import * as T from './three.module.js';
import {bakeMaterials,hash,clamp,smooth} from './roadtrip-materials.js';
import {Valley,makeCar} from './roadtrip-world.js';
import {createPost,makeSky,MOODS} from './roadtrip-post.js';

const $=id=>document.getElementById(id),qs=new URLSearchParams(location.search);
const number=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
const SHOTS={C:['01 — THE FOLLOW',40],L:['02 — ROAD LEVEL',48],S:['03 — THE PROFILE',48],A:['04 — ABOVE IT ALL',42],D:['05 — DIRECTOR’S ROUTE',40]};
const state={seed:'9A71C3',mood:'B',shot:'C',speed:10,grain:3,format:'wide',quality:'high',time:0,playing:!matchMedia('(prefers-reduced-motion: reduce)').matches,exporting:false,cancel:false,ready:false};
let renderer,scene,camera,world,post,car,sky,key,hemi,pmrem,envTarget,lastNow=0,lastLabel=0,previewFrames=0,lastFPS=performance.now(),captureUrl=null;
function canonical(){return `TRIP1-${state.seed}-${state.mood}-${state.shot}-${state.speed}`;}
function parseSeed(value){
 const m=/^TRIP1-([0-9a-f]{6})-([BGM])-([CLSAD])-(\d{1,2})$/i.exec(value.trim());
 return m?{seed:m[1].toUpperCase(),mood:m[2].toUpperCase(),shot:m[3].toUpperCase(),speed:clamp(+m[4],5,16)}:{seed:hash(value).toString(16).slice(-6).padStart(6,'0').toUpperCase(),mood:state.mood,shot:state.shot,speed:state.speed};
}
Object.assign(state,parseSeed(qs.get('seed')||canonical()));
state.grain=clamp(number(qs.get('grain')??3,3),0,10);state.format=['wide','portrait','cinema'].includes(qs.get('format'))?qs.get('format'):'wide';
state.quality=['balanced','high','ultra'].includes(qs.get('quality'))?qs.get('quality'):'high';state.time=clamp(number(qs.get('t'),0),0,10000000);
if(qs.get('paused')==='1')state.playing=false;
function status(s){$('status').textContent=s;}
function sceneUrl(){const u=new URL(location.href);u.search='';u.searchParams.set('seed',canonical());u.searchParams.set('format',state.format);u.searchParams.set('grain',state.grain);u.searchParams.set('quality',state.quality);if(state.time>0)u.searchParams.set('t',state.time.toFixed(2));if(!state.playing)u.searchParams.set('paused','1');return u;}
function sync(){
 $('moodCaption').textContent=MOODS[state.mood].name.toUpperCase();$('seed').value=canonical();$('speed').value=state.speed;$('speedLabel').textContent=Math.round(state.speed*3.6)+' km/h';$('grain').value=state.grain;$('grainLabel').textContent=state.grain===0?'Off':state.grain<5?'Subtle':'Textured';$('quality').value=state.quality;
 $('shotLabel').textContent=SHOTS[state.shot][0];$('lensLabel').textContent=state.shot==='A'?'AERIAL':state.shot==='D'?'CONTINUOUS':'TRACKING';
 document.querySelectorAll('[data-shot]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shot===state.shot)));document.querySelectorAll('[data-mood]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mood===state.mood)));document.querySelectorAll('[data-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.format===state.format)));
 $('viewport').className=state.format==='wide'?'':state.format;
 $('play').textContent=state.playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',state.playing?'Pause animation':'Play animation');
 if(qs.get('render')!=='1')history.replaceState(null,'',sceneUrl());
}
function aspect(){return state.format==='portrait'?9/16:state.format==='cinema'?2.39:16/9;}
// Shadow map resolution follows the quality tier. 2048 PCFSoft every frame
// was a large fixed cost; 1024/1536 keep the look at a fraction of the fill.
function applyShadowSize(){const s=state.quality==='balanced'?1024:state.quality==='ultra'?2048:1536;if(key&&key.shadow.mapSize.x!==s){key.shadow.mapSize.set(s,s);if(key.shadow.map){key.shadow.map.dispose();key.shadow.map=null;}}}
function resize(w,h){
 if(!renderer)return;
 if(!w){const rect=$('viewport').getBoundingClientRect();const d=state.quality==='balanced'?1:state.quality==='ultra'?Math.min(devicePixelRatio||1,1.8):Math.min(devicePixelRatio||1,1.35);w=Math.max(2,Math.floor(rect.width*d/2)*2);h=Math.max(2,Math.floor(rect.height*d/2)*2);}
 renderer.setSize(w,h,false);post.resize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function applyMood(){
 const m=MOODS[state.mood];sky.set(m);key.color.set(m.sun);key.intensity=m.key;hemi.intensity=m.hemi;hemi.color.set(m.horizon);hemi.groundColor.set('#35412c');
 post.uniforms.fogColor.value.set(m.horizon);post.uniforms.sunColor.value.set(m.sun);post.uniforms.sunDirection.value.fromArray(m.sunDir).normalize();post.uniforms.fogDensity.value=m.fog;post.uniforms.exposure.value=m.exposure;
 const envScene=new T.Scene(),envSky=sky.mesh.clone();envSky.position.set(0,0,0);envScene.add(envSky);const ground=new T.Mesh(new T.PlaneGeometry(10000,10000),new T.MeshBasicMaterial({color:'#536340'}));ground.rotation.x=-Math.PI/2;ground.position.y=-4;envScene.add(ground);
 const old=envTarget;envTarget=pmrem.fromScene(envScene,.06,.1,10000);scene.environment=envTarget.texture;old?.dispose();ground.geometry.dispose();ground.material.dispose();
}
function positionAt(z,offset=1.65){return new T.Vector3(world.roadX(z)+offset,world.roadY(z)+.09,z-world.origin);}
function pose(kind,z,time){
 const choices={C:[-28,4.8,5.3],L:[-11,-1.5,2.6],S:[-1.7,-9,4.2],A:[-30,-25,30],F:[16,5.8,4.8]};const [dz,dx,h]=choices[kind]||choices.C;
 const cz=z+dz,cx=world.roadX(cz)+1.65+dx;
 return new T.Vector3(cx,Math.max(world.roadY(cz)+h,world.heightAt(cx,cz)+2.0),cz-world.origin);
}
function draw(time){
 const z=160+time*state.speed;world.update(z,time,state.quality);const p=positionAt(z);car.group.position.copy(p);
 const dx=world.roadX(z+.2)-world.roadX(z-.2),dy=world.roadY(z+.2)-world.roadY(z-.2),yaw=Math.atan2(dx,.4);
 const curve=(world.roadX(z+2)-2*world.roadX(z)+world.roadX(z-2))/4;
 car.group.rotation.set(-Math.atan2(dy,Math.hypot(dx,.4)),yaw,clamp(-curve*state.speed*.10,-.022,.022),'YXZ');car.group.position.y+=Math.sin(time*3.4)*.006;
 for(const w of car.wheels)w.rotation.x=z/.4;
 let cam;
 if(state.shot==='D'){
  const route=['C','S','F','A','C'],phase=(time%100)/25,index=Math.floor(phase),blend=smooth(.62,1,phase-index);cam=pose(route[index],z,time).lerp(pose(route[index+1],z,time),blend);
 }else cam=pose(state.shot,z,time);
 cam.y=Math.max(cam.y,world.heightAt(cam.x,cam.z+world.origin)+1.6);
 camera.position.copy(cam);const target=positionAt(z+(state.shot==='A'?7:state.shot==='C'?9:2.4));target.y+=state.shot==='C'?3.1:.9;camera.lookAt(target);camera.rotation.z+=Math.sin(time*.12)*.002;
 camera.fov=state.format==='portrait'?55:state.shot==='L'||state.shot==='S'?42:48;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 sky.mesh.position.copy(camera.position);
 const sun=new T.Vector3().fromArray(MOODS[state.mood].sunDir).normalize();const snap=160/key.shadow.mapSize.x;
 key.target.position.set(Math.round(p.x/snap)*snap,p.y,Math.round((p.z+world.origin)/snap)*snap-world.origin);key.position.copy(key.target.position).addScaledVector(sun,180);key.target.updateMatrixWorld();
 post.uniforms.focus.value=camera.position.distanceTo(p);post.uniforms.grain.value=state.grain*.0033;
 post.draw(scene,camera,time);
 $('scene').dataset.seed=canonical();$('scene').dataset.frameTime=time.toFixed(6);
}
function loop(now){
 if(!state.exporting){if(lastNow&&state.playing)state.time+=Math.min(.06,(now-lastNow)/1000);draw(state.time);previewFrames++;
  if(now-lastLabel>500){$('timeLabel').textContent=Math.floor(state.time/60).toString().padStart(2,'0')+':'+Math.floor(state.time%60).toString().padStart(2,'0');$('distanceLabel').textContent=(state.time*state.speed/1000).toFixed(1)+' KM';lastLabel=now;}
  if(now-lastFPS>2000){const fps=previewFrames*1000/(now-lastFPS);$('renderInfo').textContent=`${state.quality.toUpperCase()} · ${Math.round(fps)} FPS`;previewFrames=0;lastFPS=now;}
 }lastNow=now;requestAnimationFrame(loop);
}
async function build(){
 const controls=document.querySelectorAll('aside button,aside input,aside select,#play,#restart');controls.forEach(c=>c.disabled=true);
 try{
  const canvas=$('scene'),gl=canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'})||canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'default'});
  if(!gl)throw new Error('This scene needs WebGL 2. Open it in a current browser with graphics acceleration enabled.');
  renderer=new T.WebGLRenderer({canvas,context:gl,antialias:false,alpha:false,preserveDrawingBuffer:true});renderer.debug.onShaderError=(gl,program)=>{console.error('Grand Tour shader:',gl.getProgramInfoLog(program));throw new Error('The scene’s lighting could not compile on this device. Try another browser or graphics driver.');};renderer.outputColorSpace=T.LinearSRGBColorSpace;renderer.toneMapping=T.NoToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  scene=new T.Scene();camera=new T.PerspectiveCamera(48,16/9,.3,4600);post=createPost(renderer,state.quality);post.uniforms.debugPass.value=qs.get('pass')==='depth'?1:qs.get('pass')==='ao'?2:0;
  $('loadText').textContent='Baking the surfaces…';await new Promise(requestAnimationFrame);const materials=bakeMaterials(renderer);
  sky=makeSky();scene.add(sky.mesh);key=new T.DirectionalLight('white',2);key.castShadow=true;applyShadowSize();Object.assign(key.shadow.camera,{left:-80,right:80,top:80,bottom:-80,near:1,far:420});key.shadow.normalBias=.10;key.shadow.bias=-.00015;key.shadow.radius=2;scene.add(key,key.target);
  hemi=new T.HemisphereLight('#c0d4d1','#384e36',2);scene.add(hemi);pmrem=new T.PMREMGenerator(renderer);applyMood();
  $('loadText').textContent='Growing cypresses and wildflowers…';await new Promise(requestAnimationFrame);
  world=new Valley(scene,materials,state.seed);car=makeCar();scene.add(car.group);window.__renderCanvas=canvas;
  sync();resize();draw(state.time);state.ready=true;controls.forEach(c=>c.disabled=false);$('loading').hidden=true;
  // Instrumentation hook (used by automated profiling; harmless in production).
  window.__rt={renderer,post,world,car,draw,get quality(){return state.quality;}};
  $('scene').dataset.ready='true';$('scene').dataset.msaa=post.target.samples;$('scene').dataset.materialMap=materials.mapSize.join('x');
  requestAnimationFrame(loop);
  if(qs.get('clean')==='1')setClean(true);
  if(qs.get('render')==='1'){
   const seconds=number(qs.get('seconds'),15)||15;
   await exportVideo({seconds,w:number(qs.get('w'),1280)||1280,h:number(qs.get('h'),720)||720,fps:clamp(number(qs.get('fps'),30)||30,12,60),start:state.time});
  }
 }catch(error){$('loading').querySelector('strong').textContent='The scene couldn’t start.';$('renderInfo').textContent='GRAPHICS UNAVAILABLE';$('loadText').textContent=error.message;$('status').textContent=error.message;console.error(error);}
}
function dimensions(){const h=+$('resolution').value,w=Math.round(h*16/9/2)*2;return state.format==='portrait'?{w:h,h:w}:state.format==='cinema'?{w,h:Math.round(w/2.39/2)*2}:{w,h};}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),30000);}
async function still(){if(!state.ready||state.exporting)return;const d=dimensions();try{state.exporting=true;resize(d.w,d.h);draw(state.time);const blob=await new Promise(resolve=>$('scene').toBlob(resolve,'image/png'));if(!blob)throw new Error('The image could not be created.');download(blob,`grand-tour-${canonical()}-${state.time.toFixed(1)}s.png`);status(`Saved ${d.w} × ${d.h} still.`);}catch(e){status(e.message);}finally{state.exporting=false;resize();}}
function resetDialog(){if(captureUrl){URL.revokeObjectURL(captureUrl);captureUrl=null;}$('exportTitle').textContent='Making your film.';$('exportStatus').textContent='';$('progress').value=0;$('exportActions').replaceChildren($('cancelExport'));$('cancelExport').hidden=false;$('cancelExport').textContent='Cancel render';if(!$('exportDialog').open)$('exportDialog').showModal();}
async function exportVideo(options={}){
 if(!state.ready||state.exporting)return;
 state.exporting=true;state.cancel=false;const start=options.start??state.time,seconds=options.seconds??+$('duration').value,fps=options.fps??30,{w,h}=options.w?options:dimensions(),frames=Math.round(seconds*fps);let encoder,muxer,wakeLock,originalTime=state.time;
 resetDialog();$('exportDetail').textContent=`${w} × ${h} · ${fps} fps · ${seconds} seconds · silent`;
 try{
  if(!window.VideoEncoder||!window.VideoFrame)throw new Error('MP4 encoding is unavailable here. Try a current Chrome, Edge, or Safari browser. You can still save PNGs.');
  const max=renderer.capabilities.maxTextureSize;if(w>max||h>max)throw new Error('This resolution exceeds the device limit. Select 1080p or 720p.');
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<64||h<64||w%2||h%2)throw new Error('Video dimensions must be even numbers of at least 64 pixels.');
  if(seconds<=0)throw new Error('Choose a positive clip length.');
  if(seconds>300)throw new Error('Choose a clip of 5 minutes or less for browser export.');
  let chunks=0,asyncError=null;
  const codec=w*h>2300000?'avc1.640033':'avc1.420028';
  muxer=new window.Mp4Muxer.Muxer({target:new window.Mp4Muxer.ArrayBufferTarget(),video:{codec:'avc',width:w,height:h},fastStart:'in-memory',firstTimestampBehavior:'offset'});
  encoder=new VideoEncoder({output:(chunk,meta)=>{
   try{
    // Safari can omit duration. Pass it explicitly into the muxer.
    const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);muxer.addVideoChunkRaw(data,chunk.type,chunk.timestamp,chunk.duration||Math.round(1e6/fps),meta);chunks++;
   }catch(e){asyncError=e;}
  },error:e=>{asyncError=e;}});
  encoder.configure({codec,width:w,height:h,bitrate:Math.round(Math.min(45000000,w*h*7)),framerate:fps,latencyMode:'quality'});
  const copy=document.createElement('canvas');copy.width=w;copy.height=h;const context=copy.getContext('2d',{alpha:false});
  try{wakeLock=await navigator.wakeLock?.request('screen');}catch{}
  resize(w,h);const began=performance.now();
  for(let i=0;i<frames;i++){
   if(state.cancel)throw new Error('Render cancelled. No video was saved.');if(asyncError)throw asyncError;
   while(encoder.encodeQueueSize>6){await new Promise(r=>setTimeout(r,12));if(asyncError)throw asyncError;if(state.cancel)throw new Error('Render cancelled. No video was saved.');}
   draw(start+i/fps);context.drawImage($('scene'),0,0,w,h);const frame=new VideoFrame(copy,{timestamp:Math.round(i*1e6/fps),duration:Math.round(1e6/fps),alpha:'discard'});
   try{encoder.encode(frame,{keyFrame:i%(fps*2)===0});}finally{frame.close();}
   if(i%6===0||i===frames-1){$('progress').value=(i+1)/frames;const elapsed=(performance.now()-began)/1000,rate=(i+1)/Math.max(elapsed,.1);$('exportStatus').textContent=`Frame ${i+1} / ${frames} · ${rate.toFixed(1)} frames/sec`;await new Promise(requestAnimationFrame);}
   if(i===Math.min(90,frames-1)){await encoder.flush();if(asyncError)throw asyncError;if(!chunks)throw new Error('The device encoded no frames. Try 720p or another browser.');}
  }
  $('exportStatus').textContent='Finishing the MP4…';await encoder.flush();if(asyncError)throw asyncError;if(!chunks)throw new Error('No video frames were produced.');muxer.finalize();
  const bytes=muxer.target.buffer;if(bytes.byteLength<1500)throw new Error('The output is empty. Try another resolution.');
  window.__renderResult=bytes;const blob=new Blob([bytes],{type:'video/mp4'}),name=`grand-tour-${canonical()}-${seconds}s.mp4`;captureUrl=URL.createObjectURL(blob);
  $('exportTitle').textContent='Your film is ready.';$('exportStatus').textContent=`${chunks} frames · ${(blob.size/1048576).toFixed(1)} MB · ${w} × ${h}`;$('cancelExport').hidden=true;
  const link=document.createElement('a');link.href=captureUrl;link.download=name;link.textContent='Download MP4';$('exportActions').append(link);
  const share=document.createElement('button');share.textContent='Share video';share.onclick=()=>{const f=new File([blob],name,{type:'video/mp4'});if(navigator.canShare?.({files:[f]}))navigator.share({files:[f],title:'Grand Tour'}).catch(()=>{});else link.click();};$('exportActions').append(share);
  const close=document.createElement('button');close.textContent='Back to the scene';close.onclick=()=>$('exportDialog').close();$('exportActions').append(close);
  $('exportDialog').dataset.frames=chunks;$('exportDialog').dataset.bytes=blob.size;$('exportDialog').dataset.start=start;status('Film rendered. Use Download MP4 or Share video.');if(qs.get('render')==='1'&&qs.get('tier')==='final')void markQueueDone();
 }catch(e){$('exportTitle').textContent=state.cancel?'Render cancelled.':'Couldn’t finish this render.';$('exportStatus').textContent=e.message;$('cancelExport').textContent='Back to the scene';console.warn(e.message);}
 finally{try{encoder?.close();}catch{}try{await wakeLock?.release();}catch{}state.time=originalTime;state.exporting=false;lastNow=performance.now();resize();}
}
async function markQueueDone(){
 const qid=qs.get('qid');let token;try{token=localStorage.getItem('rq_token');}catch{}if(!qid||!token)return;
 try{
  const url='https://api.github.com/repos/bassseamoor/render-queue/contents/queue.json',headers={Authorization:'Bearer '+token};
  const response=await fetch(url,{headers});if(!response.ok)throw new Error('Queue read failed.');const file=await response.json();
  const bytes=Uint8Array.from(atob(file.content.replace(/\s/g,'')),c=>c.charCodeAt(0)),data=JSON.parse(new TextDecoder().decode(bytes)),item=data.items?.find(x=>x.id===qid);if(!item)return;
  item.status='done';const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2))));const saved=await fetch(url,{method:'PUT',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({message:'Mark Grand Tour final render done',sha:file.sha,content:encoded})});if(!saved.ok)throw new Error('Queue update failed.');
  status('Film rendered. The final render is marked done in your queue.');
 }catch{status('Film rendered. Queue status could not be updated; your download is still ready.');}
}
function setClean(on){document.body.classList.toggle('clean',on);$('showUI').hidden=!on;requestAnimationFrame(()=>resize());}
document.querySelectorAll('[data-shot]').forEach(b=>b.onclick=()=>{if(state.exporting)return;state.shot=b.dataset.shot;sync();});
document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{if(state.exporting||!state.ready)return;state.mood=b.dataset.mood;applyMood();sync();});
document.querySelectorAll('[data-format]').forEach(b=>b.onclick=()=>{if(state.exporting)return;state.format=b.dataset.format;sync();requestAnimationFrame(()=>resize());});
$('speed').oninput=()=>{if(state.exporting)return;const distance=state.time*state.speed;state.speed=+$('speed').value;state.time=distance/state.speed;sync();};
$('grain').oninput=()=>{state.grain=+$('grain').value;sync();};
$('quality').onchange=()=>{state.quality=$('quality').value;post.setQuality(state.quality);applyShadowSize();sync();resize();};
$('play').onclick=()=>{state.playing=!state.playing;sync();};$('restart').onclick=()=>{state.time=0;lastNow=performance.now();};
function regenerate(value){if(!state.ready||state.exporting)return;Object.assign(state,parseSeed(value));const materials=world.mat;world.dispose();world=new Valley(scene,materials,state.seed);state.time=0;applyMood();sync();status('A new route, grown from your seed.');}
$('seed').onchange=()=>regenerate($('seed').value);$('seed').onkeydown=e=>{if(e.key==='Enter'){$('seed').blur();}};
$('newSeed').onclick=()=>{const a=new Uint32Array(1);crypto.getRandomValues(a);regenerate(`TRIP1-${(a[0]&0xffffff).toString(16).padStart(6,'0')}-${state.mood}-${state.shot}-${state.speed}`);};
$('copyLink').onclick=async()=>{const u=sceneUrl();u.searchParams.set('t',state.time.toFixed(2));try{await navigator.clipboard.writeText(u.href);status('Copied the scene, settings, and playhead.');}catch{status(u.href);}};
$('saveStill').onclick=still;$('exportVideo').onclick=()=>exportVideo();$('cancelExport').onclick=()=>{if(state.exporting)state.cancel=true;else $('exportDialog').close();};
$('exportDialog').addEventListener('cancel',e=>{if(state.exporting){e.preventDefault();state.cancel=true;}});
$('hideUI').onclick=()=>setClean(true);$('showUI').onclick=()=>setClean(false);$('fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('viewport').requestFullscreen?.();};
window.addEventListener('resize',()=>{if(!state.exporting)resize();});
document.addEventListener('visibilitychange',()=>{lastNow=performance.now();});
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;if(e.key.toLowerCase()==='h')setClean(!document.body.classList.contains('clean'));if(e.key===' '){e.preventDefault();$('play').click();}});
$('scene').addEventListener('webglcontextlost',e=>{e.preventDefault();state.playing=false;state.cancel=true;status('Graphics memory was interrupted. Reload and choose Balanced or a lower export resolution.');});
build();
