/* Pulse Beam Component Adapter v1 — non-destructive compatibility layer. */
(function(){
'use strict';
function comps(){try{return typeof COMPS!=='undefined'&&Array.isArray(COMPS)?COMPS:[]}catch(e){return []}}
function identify(frame){
  const src=(frame.getAttribute('src')||'').split('#')[0].split('?')[0],title=frame.title||'';
  return comps().find(c=>[c.page,c.toolSrc,c.source].some(x=>x&&String(x).split('#')[0].split('?')[0]===src))||
         comps().find(c=>title&&(c.label===title||c.id===title))||null;
}
function inventory(doc){
  const actions=[...doc.querySelectorAll('button,a[href],[role="button"],[onclick]')].filter(x=>!x.closest('[data-beam-adapter-ignore]'));
  const inputs=[...doc.querySelectorAll('input,textarea,select,[contenteditable="true"]')];
  const stateKeys=[];try{for(let i=0;i<doc.defaultView.localStorage.length;i++)stateKeys.push(doc.defaultView.localStorage.key(i))}catch(e){}
  const de=doc.documentElement,body=doc.body;
  return {actions:actions.length,inputs:inputs.length,state_keys:stateKeys.sort(),horizontal_overflow:!!(de&&de.scrollWidth>de.clientWidth+2||body&&body.scrollWidth>body.clientWidth+2)};
}
function touchSafe(doc){const xs=[...doc.querySelectorAll('button,a[href],[role="button"],input[type="button"],input[type="submit"]')].slice(0,160);if(!xs.length)return true;let bad=0;xs.forEach(x=>{const r=x.getBoundingClientRect();if(r.width>0&&r.height>0&&(r.width<40||r.height<40))bad++});return bad/xs.length<=.12}
function inject(frame){
  const c=identify(frame),id=c?c.id:(frame.title||frame.src||'iframe');
  try{
    const doc=frame.contentDocument;if(!doc||!doc.head||!doc.body)return;
    const before=inventory(doc);
    if(!doc.querySelector('link[data-pulse-beam]')){const l=doc.createElement('link');l.rel='stylesheet';l.href=new URL('pulse-beam.css',location.href).href;l.dataset.pulseBeam='1';doc.head.appendChild(l)}
    doc.body.classList.add('beam-embedded');doc.body.dataset.beamMode='compat';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const after=inventory(doc),parity=before.actions===after.actions&&before.inputs===after.inputs;
      const receipt={level:'legacy-compatible',parity,before_actions:before.actions,after_actions:after.actions,before_inputs:before.inputs,after_inputs:after.inputs,
        state_keys:after.state_keys,routes:[frame.getAttribute('src')||''],output_contracts:[],horizontal_overflow:after.horizontal_overflow,
        mobile_safe:!after.horizontal_overflow,touch_safe:touchSafe(doc),adapter:'pulse-beam-component-adapter-v1',adapted_at:new Date().toISOString()};
      window.PulseBeamAudit&&window.PulseBeamAudit.record(id,receipt);
      try{frame.dataset.beamAdapted='1'}catch(e){}
    }))
  }catch(e){window.PulseBeamAudit&&window.PulseBeamAudit.record(id,{level:'external-unadapted',parity:false,reason:'cross-origin-or-unavailable',routes:[frame.src||'']})}
}
function bind(f){if(!f||f.dataset.beamBound)return;f.dataset.beamBound='1';f.addEventListener('load',()=>inject(f));inject(f)}
function scan(){document.querySelectorAll('iframe').forEach(bind)}
function start(){scan();new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.PulseBeamAdapter=Object.freeze({scan,inject});
})();