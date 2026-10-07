const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const bp=require('../blueprint/funnel-citadel-v2.blueprint.json');
let src=fs.readFileSync('pulse-beam-funnel-hall.js','utf8');for(const p of bp.patches){assert.equal(src.split(p.before).length-1,1);src=src.replace(p.before,p.after);}
src+='\nwindow.CITADEL_BLUEPRINT_PREVIEW={camera,scene,pickables,nodeMap,flows,toggleLevel,inspect,held,getLevel:()=>level};';
(async()=>{const http=require('node:http'),path=require('node:path');const server=http.createServer((req,res)=>{try{const f=path.join(process.cwd(),decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.json')?'application/json':'text/html');res.end(fs.readFileSync(f));}catch(e){res.statusCode=404;res.end('missing')}});await new Promise(r=>server.listen(8765,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,headless:true,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report=[];
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
 const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/pulse-beam-funnel-hall.js',r=>r.fulfill({body:src,contentType:'text/javascript'}));
 await page.goto('http://127.0.0.1:8765/pulse-beam-funnel-hall.html');await page.waitForFunction(()=>!!window.CITADEL_BLUEPRINT_PREVIEW,{timeout:30000});
 const result=await page.evaluate(()=>{const p=window.CITADEL_BLUEPRINT_PREVIEW;p.toggleLevel();const upper={y:p.camera.position.y,r:Math.hypot(p.camera.position.x,p.camera.position.z)};p.toggleLevel();p.inspect(window.FUNNEL_ENVIRONMENT_GRAPH.nodes[0]);return{upper,groundY:p.camera.position.y,picks:p.pickables.length,nodes:p.nodeMap.size,info:document.getElementById('info').classList.contains('on'),canvas:!!document.querySelector('canvas')};});
 assert.equal(result.upper.y,7.77);assert(result.upper.r>=15.4&&result.upper.r<=22.3);assert.equal(result.groundY,1.72);assert(result.picks>0&&result.info&&result.canvas);assert.equal(errors.length,0,errors.join('\n'));
 // Upper bounds under actual frame-driven motion. A synthetic keyboard state avoids touch-pad visibility assumptions.
 await page.evaluate(()=>{const p=window.CITADEL_BLUEPRINT_PREVIEW;p.toggleLevel();p.camera.position.set(0,7.77,22.29);p.held.s=true;});await page.waitForTimeout(350);
 const radius=await page.evaluate(()=>{const p=window.CITADEL_BLUEPRINT_PREVIEW;p.held.s=false;return Math.hypot(p.camera.position.x,p.camera.position.z)});assert(radius<=22.3+1e-8);
 for(const [button,id] of [['foundry','funnel-fabric'],['refinery','capability-memory']]){
  const href=await page.evaluate(button=>{let link;document.getElementById(button).onclick.toString();return document.getElementById(button).onclick.toString();},button);assert(href.includes('pulse-dashboard.html?tool='+id));
 }
 await page.screenshot({path:'/tmp/citadel-runtime-'+viewport.width+'.png'});report.push({viewport,...result,errors,radius});await page.close();
}
await browser.close();server.close();fs.writeFileSync('blueprint/funnel-citadel-v2.runtime-preview.json',JSON.stringify({scope:'temporary patched runtime; production files untouched',checks:report},null,2)+'\n');console.log('PASS: candidate runtime boots, selects live graph, toggles correct observation height/radius, and stays bounded at three viewport sizes');
})().catch(e=>{console.error(e);process.exit(1)});
