/* Independent Pulse components. Keep this file and its script hook across dashboard rebuilds. */
(function(){
'use strict';
var ideaFix=document.getElementById('pulse-wonder-idea-layout-fix');
if(!ideaFix){
 ideaFix=document.createElement('style');
 ideaFix.id='pulse-wonder-idea-layout-fix';
 ideaFix.textContent=".wd-card[data-kind=\"idea\"]{min-height:260px!important;height:auto!important;padding:20px 74px 20px 18px!important;justify-content:center!important;align-items:flex-start!important;overflow:hidden!important}.wd-card[data-kind=\"idea\"]::after{display:none!important}.wd-card[data-kind=\"idea\"] .wd-visual{position:relative!important;inset:auto!important;width:100%!important;height:auto!important;max-width:840px!important;touch-action:auto!important;z-index:1!important}.wd-card[data-kind=\"idea\"] .wd-cap{display:none!important}.wd-card[data-kind=\"idea\"] .wd-idea{width:100%!important;max-width:none!important;min-height:0!important;margin:0!important;padding:20px 22px!important}.wd-card[data-kind=\"idea\"] .wd-ideaT{font-size:18px!important;line-height:1.3!important;margin:0 0 9px!important;overflow-wrap:anywhere}.wd-card[data-kind=\"idea\"] .wd-ideaB{font-size:13px!important;line-height:1.55!important;overflow-wrap:anywhere}.wd-card[data-kind=\"idea\"] .wd-ideaS{margin-top:13px!important}.wd-card[data-kind=\"idea\"] .wd-rail{right:12px!important;top:50%!important;transform:translateY(-50%)!important;gap:7px!important}.wd-card[data-kind=\"idea\"] .wd-railbtn{width:38px!important;height:38px!important;font-size:15px!important}@media(max-width:620px){.wd-card[data-kind=\"idea\"]{min-height:286px!important;padding:14px 56px 14px 12px!important}.wd-card[data-kind=\"idea\"] .wd-idea{padding:18px 16px!important}.wd-card[data-kind=\"idea\"] .wd-ideaT{font-size:17px!important}.wd-card[data-kind=\"idea\"] .wd-rail{right:8px!important;gap:6px!important}.wd-card[data-kind=\"idea\"] .wd-railbtn{width:34px!important;height:34px!important;font-size:14px!important}}";
 document.head.appendChild(ideaFix);
}
var entries=[{"id":"wall-mirror","tool":"wallMirror","toolSrc":"moor-wall-mirror.html","cats":["generators"],"icon":"◇","label":"Wall Mirror Foundry","short":"Generate round or rectangular wall mirrors with parametric frames and a reflective surface.","job":"Generate wall mirrors, tune shape and frame, preview them, and export a reusable MOOR recipe.","why":"Turn the furniture mirror concept into a reusable generated component.","technical":"furniture.wall-mirror v1.0.0","source":"moor-wall-mirror.html","inMoor":false,"toolGap":"WebGL preview uses an environment-mapped reflective material rather than ray-traced planar reflection. Export is a parametric .moor.json recipe."},{"id":"living-garden","tool":"livingGarden","toolSrc":"moor-living-garden.html","cats":["generators","space"],"icon":"❧","label":"Living Garden Lab","short":"Grow planet-adapted plants. Inspect a terrain site. Export meshes and ecology data.","job":"Generate plants, inspect gardens, compare recipes, and export geometry.","why":"Review and reuse a separate vegetation component.","technical":"Living Garden Lab v1.0.0","source":"moor-living-garden.html","inMoor":false,"toolGap":"Procedural art, not biological simulation. Shared with Planet Workshop; reduced terrain detail. Not connected to production MOOR."},{"id":"planet-workshop","tool":"planetWorkshop","toolSrc":"moor-planet-workshop.html","cats":["generators","space"],"icon":"◉","label":"Planet Workshop","short":"Explore seeded terrain, rivers, and environment-driven plants.","job":"Inspect planetary terrain, tune geology and water, and save recipes.","why":"Review this terrain revision separately.","technical":"Planet Workshop v3.0.0","source":"moor-planet-workshop.html","inMoor":false,"toolGap":"Experimental terrain; shared seeded flora and ecology exports; coarse erosion and hydrology. Not production MOOR."}];
if(typeof COMPS==='undefined'||typeof TOOLS==='undefined')return;
var layout=document.createElement('style');
layout.textContent='.tabs-on .app.independent-focus{grid-template-columns:minmax(0,1fr) 300px}.tabs-on .app.independent-focus.activity-hidden{grid-template-columns:minmax(0,1fr)}@media(max-width:1100px){.tabs-on .app.independent-focus{grid-template-columns:minmax(0,1fr)}}';
document.head.appendChild(layout);
entries.forEach(function(c){
 var existing=COMPS.find(function(x){return x.id===c.id;});
 if(existing)Object.assign(existing,c);else COMPS.unshift(c);
 TOOLS[c.tool]={mount:function(host){
 var app=document.getElementById('app');if(app)app.classList.add('independent-focus');
 var bar=document.createElement('div');bar.className='t-controls';
 var note=document.createElement('span');note.className='meta';note.textContent='Independent review component';
 var link=document.createElement('a');link.className='btn primary';link.href=c.source;link.target='_blank';link.rel='noopener';link.textContent='Open full screen';
 bar.append(note,link);
 var frame=document.createElement('iframe');frame.title=c.label;frame.src=c.source;frame.style.cssText='width:100%;height:78dvh;min-height:420px;border:0;border-radius:12px;background:#162423';frame.allow='fullscreen';
 host.replaceChildren(bar,frame);
 },unmount:function(){var app=document.getElementById('app');if(app)app.classList.remove('independent-focus');}};
});
window.addEventListener('message',function(event){
 if(event.origin!==location.origin||!event.data||event.data.type!=='moor:open-component'||event.data.id!=='living-garden')return;
 var frames=Array.from(document.querySelectorAll('iframe'));
 if(!frames.some(function(frame){return frame.contentWindow===event.source&&new URL(frame.src,location.href).pathname.endsWith('/moor-planet-workshop.html');}))return;
 openComponent('living-garden');
});
window.PULSE_COMPONENTS=COMPS;
if(typeof hideOldChrome==='function')hideOldChrome();
var id=new URLSearchParams(location.search).get('component');
if(entries.some(function(c){return c.id===id;}))openComponent(id);
else if(typeof renderStage==='function')renderStage();
})();
