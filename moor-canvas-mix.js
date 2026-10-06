/* Canvas adapters use the shipped MOOR compiler and preserve native tools. */
(function(){
'use strict';
const css=document.createElement('style');css.textContent=`
body{overflow:auto}.app{height:100dvh;min-height:650px}.top{height:auto;min-height:58px;flex-wrap:wrap}.layout{grid-template-columns:220px minmax(0,1fr) 220px}.side{overflow:auto}.selector{flex:none}.combo-list{position:static;margin-top:8px;max-height:230px}.combo-list[hidden]{display:none}.preview{min-height:0;flex:none}.preview canvas{display:none}.previewText{overflow:visible}.previewText p{font-size:14px}.stage{overflow:auto;min-width:0}.display{flex:1;min-height:280px;overflow:auto}.caption{position:static;padding:12px}.nav3d{display:none!important}.settings{flex-wrap:wrap;white-space:normal}.settings label{font-size:14px}.status{font-size:14px;flex:none;overflow-wrap:anywhere}.actions{flex-wrap:wrap}.composer,.composer.closed{position:static;order:2;margin:0;border:0;border-radius:0;transform:none;opacity:1;pointer-events:auto;flex:none;background:#1c1429;box-shadow:none;padding:14px}.composer textarea{min-height:60px}.composer .row{flex-wrap:wrap}.composer .row small{font-size:14px}.actions{order:3}.status{order:4}.settings{order:1}.stagebar{flex-wrap:wrap}.appresult{position:static;inset:auto;margin:12px;min-height:250px}.mix-result{display:flex;flex-direction:column;gap:12px;padding:12px;min-height:100%}.mix-modules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;flex:1}.mix-module{min-width:0;display:flex;flex-direction:column;background:#100e1c;border-radius:12px;overflow:hidden}.mix-module h3{font-size:14px;padding:12px;margin:0}.mix-module iframe{width:100%;height:420px;min-height:280px;border:0;flex:1;background:#100e1c}.mix-module p{padding:12px;overflow-wrap:anywhere}.mix-result details{font-size:14px}.mix-result pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px}.mix-state{font-size:14px;color:#cbbbd6;margin:0;overflow-wrap:anywhere}.drawer.open{position:fixed;inset:70px 16px 16px auto;max-height:calc(100dvh - 86px)}
@media(max-width:1050px){.app{height:auto;min-height:100dvh}.layout{grid-template-columns:1fr 1fr;grid-template-rows:auto auto}.side{grid-row:1}.stage{grid-row:2;grid-column:1/-1;min-height:650px}.preview{display:none}.mix-module iframe{height:380px}}
@media(max-width:600px){.layout{grid-template-columns:1fr 1fr;grid-template-rows:auto auto}.side .selector{height:auto}.stage{min-height:650px}.mix-modules{grid-template-columns:1fr}.mix-module iframe{height:360px}.top .title{margin-right:auto}.top button{min-height:40px}.search{padding:9px}.composer .row small{display:none}.actions .pair{display:none}}
`;document.head.append(css);
$('composerHint').textContent='Choose two components. Add an instruction, or just mix.';
$('request').value='';$('request').placeholder='How should these work together? (optional)';
$('mix').textContent='Compile mix';$('runtime').textContent='Select two parts, then compile';
$('world').style.display='none';$('caption').textContent='Your mixed component will appear here.';
$('savePart').disabled=$('addVersion').disabled=true;
let ready,busy=false,frames=[],shared={};
const aliases={'plant-gen':'planet-vegetation','creature-lab':'softbody-creatures','planet-colors':'palettes','js-pipeline':'js-create-pipeline','moor-canvas':'canvas-shell'};
function spec(id){const actual=aliases[id]||id;return (window.MoorCanvasManifest?.tools||[]).find(t=>t.id===actual)||null;}
async function compiler(){
 if(!ready)ready=import('./moor-core-v0/web/pkg/moor_web.js').then(async m=>{await m.default();return m;}).catch(e=>{ready=null;throw e;});
 return ready;
}
async function generate(){
 if(busy)return;busy=true;$('mix').disabled=true;
 try{
  const ids=[pick.A,pick.B];if(ids[0]===ids[1])throw Error('Choose two different components to mix.');
  const selected=ids.map(part);if(selected.some(p=>!p))throw Error('Choose both components first.');
  const instruction=$('request').value.trim();
  $('status').textContent='Compiling '+selected.map(p=>p.name).join(' + ')+'…';
  if(!window.MoorCanvasManifest)await refreshCatalogFromManifest();
  const m=await compiler();
  const request=(instruction?instruction+' ':'Make a workspace. ')+'Use these selected components: '+selected.map(p=>p.name+': '+p.desc).join(' and ')+'.';
  const out=JSON.parse(m.handle('',JSON.stringify({op:'compile',request})));
  if(!out.ok)throw Error(out.error||'Compiler could not build this request.');
  const recipe={schema:'moor.canvas-mix',version:1,kind:'compiled',ids,prompt:request,seed:+$('seed').value||1337,relief:+$('relief').value,life:+$('life').value,title:selected.map(p=>p.name).join(' + '),compiler:{engine:'moor-core-v0',result:out.result,store:out.store},modules:leafIds(ids).map(id=>({id,component:aliases[id]||id})),connections:[{adapter:'shared-seed',from:'project.seed',to:'modules.seed'},{adapter:'output-context',from:'modules.moor:output',to:'project.context'},...(leafIds(ids).includes('terrain-core')&&leafIds(ids).some(id=>['plant-gen','planet-vegetation'].includes(id))?[{adapter:'terrain-placement',from:'terrain-core.heightfield',to:'planet-vegetation.elevation-and-water-mask'}]:[])]};
  activeRecipe=recipe;built=true;render(recipe);$('savePart').disabled=$('addVersion').disabled=false;
  $('status').textContent=!frames.length?'Compiled references · neither selected component has a browser runtime.':out.result?.fallback?'Native tools connected. The intent compiler used its notes fallback; custom logic needs an adapter.':'Compiled · native components share this project and seed.';
  emitMoorOutput({id:'artifact:canvas-mix:'+Date.now(),kind:'artifact',title:recipe.title,source:{app:'more-canvas',component:'more-canvas'},recipe,payload:recipe,status:'generated',provenance:'compiler',intent:request,intent_provenance:instruction?'explicit':'inferred'});
 }catch(e){$('status').textContent=e.message;toast(e.message);}
 finally{busy=false;$('mix').disabled=false;}
}
function seedFrame(frame,seed){
 try{const doc=frame.contentDocument;if(!doc)return;
  const set=(d)=>{d.querySelectorAll('input').forEach(input=>{if(input.type==='file'||input.type==='password')return;if(/seed/i.test(input.id+' '+input.name+' '+input.closest('label')?.textContent)){input.value=String(seed);input.dispatchEvent(new d.defaultView.Event('input',{bubbles:true}));input.dispatchEvent(new d.defaultView.Event('change',{bubbles:true}));}});};
  set(doc);doc.querySelectorAll('iframe').forEach(f=>{f.addEventListener('load',()=>{try{set(f.contentDocument);}catch(_){}});try{set(f.contentDocument);}catch(_){}});
  doc.querySelector('#t-gen')?.click();doc.querySelector('#v-grow')?.click();
  frame.contentWindow.postMessage({type:'moor:canvas-context',seed,context:shared},location.origin);
 }catch(_){}
}
function render(recipe){
 frames=[];shared={};$('world').style.display='none';$('caption').style.display='none';$('appResult').style.display='none';
 let host=$('mixResult');if(!host){host=document.createElement('div');host.id='mixResult';host.className='mix-result';$('display').append(host);}
 host.replaceChildren();const row=document.createElement('div');row.className='mix-modules';host.append(row);
 for(const module of recipe.modules||leafIds(recipe.ids).map(id=>({id}))){
  const p=part(module.id),t=spec(module.id),tile=document.createElement('section');tile.className='mix-module';
  const label=document.createElement('h3');label.textContent=p?.name||t?.label||module.id;tile.append(label);row.append(tile);
  const source=t?.panel_source_url||p?.src;
  if(t?.id==='more-canvas'||module.id==='more-canvas'){const msg=document.createElement('p');msg.textContent='Canvas is the host for this mix. Choose another tool for a second runtime.';tile.append(msg);continue;}
  if(!source){const msg=document.createElement('p');msg.textContent='This catalog component has no browser runtime connected. Its reference is preserved in the compiled project.';tile.append(msg);continue;}
  const frame=document.createElement('iframe');frame.title=label.textContent;
  const u=new URL('pulse-dashboard.html',location.href);u.searchParams.set('workspace-tool',t?.id||aliases[module.id]||module.id);u.searchParams.set('seed',recipe.seed);u.searchParams.set('release','20261006-canvas-mix2');frame.src=u.href;frame.dataset.module=module.id;frame.onload=()=>seedFrame(frame,recipe.seed);tile.append(frame);frames.push(frame);
 }
 const state=document.createElement('p');state.className='mix-state';state.id='mixState';state.textContent='Shared seed · '+recipe.seed;host.append(state);
 const details=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent='Compiled project';pre.textContent=JSON.stringify({compiler:recipe.compiler?.result,modules:recipe.modules,connections:recipe.connections},null,2);details.append(summary,pre);host.append(details);
 $('resultName').textContent=recipe.title;$('runtime').textContent='MOOR compiler · native component runtimes';$('pairLabel').textContent=recipe.title;$('savePart').disabled=$('addVersion').disabled=false;
}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin)return;const i=frames.findIndex(f=>f.contentWindow===e.source);if(i<0||e.data?.type!=='moor:output')return;
 const module={id:frames[i].dataset.module};shared[module.id]=e.data.detail;
 const state=$('mixState');if(state)state.textContent='Seed '+activeRecipe.seed+' · latest output: '+(e.data.detail?.title||module?.id||'component');
 frames.filter(f=>f.contentWindow!==e.source).forEach(f=>f.contentWindow.postMessage({type:'moor:canvas-context',seed:activeRecipe.seed,context:shared},location.origin));
});
window.MoorCanvasMix={generate,render};window.pulseDebug.generate=generate;
if(activeRecipe.kind==='compiled')render(activeRecipe);
window.addEventListener('canvas-catalog-ready',()=>{for(const t of window.MoorCanvasManifest?.tools||[]){if(!catalog.some(p=>(aliases[p.id]||p.id)===t.id))catalog.push({id:t.id,name:t.label,desc:t.what_it_does||'',cat:['shared'],in:t.in_moor,src:t.panel_source_url,evidence:t.honest_limits||''});}combo('A');combo('B');if(activeRecipe.kind==='compiled')render(activeRecipe);});
})();
