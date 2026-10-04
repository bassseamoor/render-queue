/* Responsive presentation contract for Pulse tool frames; never changes tool data or renderer buffers. */
(function(){
'use strict';
if(window.PulsePanelFit)return;
const CSS=`
html.pw-fit{--pw-gap:12px;--pw-scene-height:280px;--pw-square:340px}
html.pw-fit *{box-sizing:border-box}
html.pw-fit body.pw-child #orbs,html.pw-fit body.pw-child #glitter,html.pw-fit body.pw-child #glitter-front{display:none!important}html.pw-fit body.pw-child #main{background:#0d1220!important;box-shadow:none!important;backdrop-filter:none!important}\nhtml.pw-fit body{margin:0;max-width:100%;overscroll-behavior:contain}
html.pw-fit input,html.pw-fit select,html.pw-fit textarea{min-width:0;max-width:100%}
html.pw-fit input[type=range]{min-width:48px}
html.pw-fit button,html.pw-fit a{overflow-wrap:anywhere}
html.pw-fit pre{max-width:100%;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere}
html.pw-fit iframe{max-width:100%;min-width:0}
html.pw-fit :where(.t-controls,.t-row,.t-brushes,.t-tabs,.window-actions){flex-wrap:wrap!important;gap:8px!important}
html.pw-fit :where(.t-controls,.t-side) label{min-width:0;max-width:100%;flex-wrap:wrap;line-height:1.45;gap:6px}
html.pw-fit .t-controls>label{flex:1 1 170px}
html.pw-fit .t-controls>label>input:not([type=range]),html.pw-fit .t-controls>label>select{flex:1 1 100px;width:100px}
html.pw-fit .t-controls>label>input[type=range]{flex:1 1 100px;width:100px}
html.pw-fit .t-controls>.btn{flex:0 0 auto}
html.pw-fit :where(.t-main,.p-main,.s-main,.w-main){display:grid!important;grid-template-columns:minmax(0,1fr)!important;align-items:start;gap:var(--pw-gap)!important;width:100%;min-width:0}
html.pw-fit :where(.t-main,.p-main,.s-main,.w-main)>*{min-width:0!important;max-width:100%!important}
html.pw-fit .t-side{min-width:0!important;width:100%;gap:10px}
html.pw-fit .t-side label>input[type=range]{flex:1 1 90px;min-width:60px}
html.pw-fit .t-dims{flex-wrap:wrap;max-width:100%}
html.pw-fit .w-tree,html.pw-fit .w-detail{min-width:0!important;max-height:min(420px,65dvh)}
html.pw-fit :where(.t-main,.s-main)>canvas{display:block;width:min(100%,var(--pw-square))!important;height:auto!important;justify-self:center;object-fit:contain;max-width:100%}
html.pw-fit body.pw-child #tabview>.tool-host,html.pw-fit .tool-host{min-width:0;max-width:100%;padding:12px!important;border:0!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important;background:#0d1220!important;margin:0!important}
html.pw-fit .tool-host> :where(div,section,article){min-width:0;max-width:100%}
html.pw-fit body.pw-child #tabview>.pw-embedded-host,html.pw-fit .pw-embedded-host{display:flex!important;flex-direction:column;height:100dvh!important;overflow:hidden;padding:0!important}
html.pw-fit .pw-embedded-host>.t-controls{display:none!important;flex:none;margin:0!important;padding:6px 10px;border-bottom:1px solid #ffffff18;background:#121523}
html.pw-fit .pw-embedded-host>.t-controls>.meta{display:none}
html.pw-fit .pw-embedded-host>.t-controls>.btn{font-size:12px;min-height:30px;padding:5px 9px;box-shadow:none!important}
html.pw-fit .pw-embedded-host>iframe{flex:1;min-height:0!important;height:auto!important;width:100%;border-radius:0!important}
html.pw-fit .pw-fit-overflow-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr))!important}
html.pw-fit .pw-fit-overflow-flex{flex-wrap:wrap!important}
html.pw-fit .pw-fit-overflow-flex>*{min-width:0!important;max-width:100%!important;flex-shrink:1}
html.pw-fit .pw-fit-fixed-width{width:100%!important;min-width:0!important;max-width:100%!important}
html.pw-fit .pw-fit-table-wrap{max-width:100%;overflow:auto;scrollbar-width:thin}
html.pw-fit #stm-gl{height:var(--pw-scene-height)!important;min-height:140px!important}
html.pw-fit .pf-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))!important;padding:12px!important;gap:12px!important;max-height:none!important}
html.pw-fit .ff-wrap{height:var(--pw-scene-height)!important;min-height:140px}html.pw-fit .ff-canvas{width:100%!important;height:100%!important;object-fit:contain}html.pw-fit .ff-row{flex-wrap:wrap!important;overflow-x:visible!important;max-height:140px;overflow-y:auto;gap:6px}html.pw-fit .ff-chip{white-space:normal!important;max-width:100%}\nhtml.pw-fit .pf-readout{font-size:clamp(36px,9vw,72px)!important}
html.pw-fit .stm-row{flex-wrap:wrap!important;gap:8px}.pw-fit .stm-in{min-width:0!important;flex:1 1 180px!important}
html.pw-fit .stm-head{flex-wrap:wrap!important;gap:8px!important;padding:12px!important}
html.pw-fit .stm-focus{flex-wrap:wrap!important;gap:8px!important}
html.pw-fit .wd-feed{height:calc(100dvh - 100px)!important;min-height:180px}
html.pw-fit .wd-full .wd-feed{height:auto!important;min-height:0}
html.pw-fit .wd-card{min-height:calc(100dvh - 105px)!important}
@media(min-width:700px){
 html.pw-fit :where(.t-main,.s-main){grid-template-columns:minmax(0,1.3fr) minmax(220px,1fr)!important}
 html.pw-fit :where(.w-main,.p-main){grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)!important}
 html.pw-fit :where(.t-main,.s-main)>canvas{width:min(100%,var(--pw-square))!important}
}
@media(max-width:420px){html.pw-fit{--pw-gap:10px}html.pw-fit .tool-host{padding:10px!important}html.pw-fit .t-controls>label{flex-basis:100%}html.pw-fit :where(.btn,.t-brushes .btn){min-height:36px;white-space:normal}html.pw-fit .p-swatches{grid-template-columns:repeat(auto-fit,minmax(95px,1fr))}}
/* Standalone model editor: scene and controls occupy explicit tracks, never a fixed 300px minimum. */
html.pw-fit-mirror .top{height:auto!important;min-height:40px;padding:7px 10px!important;gap:8px;flex-wrap:wrap}
html.pw-fit-mirror .sub{display:none}
html.pw-fit-mirror .work{grid-template-columns:minmax(0,1fr)!important;grid-template-rows:minmax(120px,45%) minmax(0,1fr)!important}
html.pw-fit-mirror .viewport{order:1!important;min-height:0!important}
html.pw-fit-mirror .controls{order:2!important;min-width:0;min-height:0;padding:10px!important;border-right:0;overflow:auto;overscroll-behavior:contain}
html.pw-fit-mirror .profiles{grid-template-columns:repeat(5,minmax(0,1fr))!important;overflow:visible}
html.pw-fit-mirror .bigKnob{grid-template-columns:minmax(60px,auto) minmax(0,1fr)}
html.pw-fit-mirror .seg button{padding:8px 5px;min-width:0}
@media(min-width:720px){html.pw-fit-mirror .work{grid-template-columns:clamp(220px,30vw,300px) minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr)!important}html.pw-fit-mirror .controls{order:1!important;border-right:1px solid #28302e}html.pw-fit-mirror .viewport{order:2!important}}
/* Overlay editors get bounded sheets; a short window never loses the dismiss controls. */
html.pw-fit-garden header{padding:8px 10px!important;gap:6px!important;flex-wrap:wrap;background:#101a19ee}
html.pw-fit-garden header b{font-size:10px;letter-spacing:1px}html.pw-fit-garden header span{font-size:14px;min-width:0}
html.pw-fit-garden header button{padding:7px 9px;font-size:12px}
html.pw-fit-garden #controls{top:62px!important;bottom:48px!important;left:8px!important;right:auto!important;width:min(260px,calc(100vw - 16px))!important;max-height:none!important;padding:12px!important}
html.pw-fit-garden #controls h1{font-size:22px}html.pw-fit-garden #controls>p{font-size:13px}
html.pw-fit-garden #species{grid-template-columns:repeat(2,minmax(0,1fr))!important}
html.pw-fit-garden #caption{right:12px;top:65px!important;left:auto!important;max-width:min(230px,35vw)!important}
html.pw-fit-garden #caption h2{font-size:22px!important}
html.pw-fit-garden footer{height:auto;min-height:36px;padding:8px 10px!important;flex-wrap:wrap;gap:5px;font-size:11px!important}
html.pw-fit-planet .top{top:8px!important;left:8px!important;right:8px!important;gap:5px!important;flex-wrap:wrap}
html.pw-fit-planet .top .glass{padding:8px 10px!important}
html.pw-fit-planet .workpanel{top:62px!important;bottom:62px!important;left:8px!important;width:min(280px,calc(100vw - 16px))!important;max-width:none;max-height:none}
html.pw-fit-planet .panelhead{padding:12px 12px 7px!important}.pw-fit-planet .panelhead p{display:none}
html.pw-fit-planet .panelbody{padding:0 12px 12px!important;min-height:0}
html.pw-fit-planet .tabs{flex-wrap:wrap;padding:0 8px 8px}.pw-fit-planet .tabs button{min-height:34px;font-size:12px}
html.pw-fit-planet .viewbar{bottom:8px!important;left:8px!important;right:8px!important;flex-wrap:wrap;gap:4px!important;padding:5px!important}
html.pw-fit-planet .viewbar button{font-size:12px!important;padding:5px 8px!important;min-height:32px}
html.pw-fit-planet .caption{display:none}html.pw-fit-planet .meter{top:65px!important;right:10px!important;max-width:35vw}
@media(max-width:560px){html.pw-fit-garden #controls{top:auto!important;bottom:48px!important;right:8px!important;width:auto!important;max-height:48dvh!important}html.pw-fit-garden #caption{max-width:55vw!important}html.pw-fit-planet .workpanel{top:auto!important;bottom:62px!important;right:8px!important;width:auto!important;height:50dvh!important}html.pw-fit-planet .meter{max-width:60vw}}
@media(max-height:320px){html.pw-fit-garden #controls{top:48px!important;bottom:38px!important}html.pw-fit-garden #caption{display:none}html.pw-fit-planet .workpanel{top:50px!important;bottom:52px!important;height:auto!important}.pw-fit-planet .meter{display:none}}
`;
function attach(win,root){
 try{
  const doc=win.document;if(!doc?.body||doc.getElementById('pulse-panel-fit'))return;
  const st=doc.createElement('style');st.id='pulse-panel-fit';st.textContent=CSS;doc.head.append(st);doc.documentElement.classList.add('pw-fit');
  if(doc.querySelector('#stage')&&doc.querySelector('.heroControls'))doc.documentElement.classList.add('pw-fit-mirror');
  if(doc.querySelector('#cv')&&doc.querySelector('#species'))doc.documentElement.classList.add('pw-fit-garden');
  if(doc.querySelector('#heroCanvas'))doc.documentElement.classList.add('pw-fit-planet');
  const host=root||doc.querySelector('.tool-host')||doc.body;let frame=0,live=true;
  const knownFrames=new WeakSet();
  function layout(){
   frame=0;if(!live)return;
   const w=win.innerWidth,h=win.innerHeight;
   doc.documentElement.style.setProperty('--pw-scene-height',Math.round(Math.max(140,Math.min(680,h*.58)))+'px');
   doc.documentElement.style.setProperty('--pw-square',Math.round(Math.max(150,Math.min(600,w-24,h*.68)))+'px');
   host.querySelectorAll('.tool-host').forEach(el=>{if(el.querySelector(':scope>iframe'))el.classList.add('pw-embedded-host')});
   if(host.classList.contains('tool-host')&&host.querySelector(':scope>iframe'))host.classList.add('pw-embedded-host');
   /* Only repair actual overflows. Intentional scrolling strips, art layers and overlays retain their layouts. */
   host.querySelectorAll('div,section,article,fieldset').forEach(el=>{
    if(el.closest('.wd-visual,.wd-cap,.wd-rail,.w-cards,.pw-fit-table-wrap')||el.classList.contains('tool-host'))return;
    const cs=win.getComputedStyle(el);if(['absolute','fixed'].includes(cs.position)||cs.overflowX==='auto'||cs.overflowX==='scroll'||el.clientWidth<1)return;
    if(cs.display==='grid'&&el.scrollWidth>el.clientWidth+4&&el.children.length>1)el.classList.add('pw-fit-overflow-grid');
    if(cs.display==='flex'&&cs.flexDirection==='row'&&cs.flexWrap==='nowrap'&&el.scrollWidth>el.clientWidth+4)el.classList.add('pw-fit-overflow-flex');
    if(el.clientWidth>el.parentElement.clientWidth+8&&cs.display!=='inline'&&cs.position==='static')el.classList.add('pw-fit-fixed-width');
   });
   host.querySelectorAll('table').forEach(t=>{if(t.parentElement.classList.contains('pw-fit-table-wrap'))return;const wrap=doc.createElement('div');wrap.className='pw-fit-table-wrap';t.before(wrap);wrap.append(t)});
   doc.querySelectorAll('iframe').forEach(f=>{if(knownFrames.has(f))return;knownFrames.add(f);const fit=()=>{try{attach(f.contentWindow)}catch(_){}};f.addEventListener('load',fit);if(f.contentDocument?.readyState==='complete')fit()});
  }
  function schedule(){if(!frame&&live)frame=win.requestAnimationFrame(layout)}
  const ro=new win.ResizeObserver(schedule);ro.observe(doc.documentElement);
  const mo=new win.MutationObserver(schedule);mo.observe(host,{childList:true,subtree:true});
  win.addEventListener('resize',schedule,{passive:true});
  win.addEventListener('pagehide',()=>{live=false;ro.disconnect();mo.disconnect();if(frame)win.cancelAnimationFrame(frame)},{once:true});
  layout();
 }catch(e){console.warn('Pulse panel layout:',e.message)}
}
window.PulsePanelFit={attach};
if(new URLSearchParams(location.search).has('workspace-tool'))attach(window,document.querySelector('.tool-host'));
})();
