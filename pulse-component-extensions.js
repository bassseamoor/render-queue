/* Independent Pulse components. Keep this file and its script hook across dashboard rebuilds. */
(function(){
'use strict';
var entries=[{"id":"living-garden","tool":"livingGarden","toolSrc":"moor-living-garden.html","cats":["generators","space"],"icon":"❧","label":"Living Garden Lab","short":"Grow eight plant families. Compare versions. Export real meshes.","job":"Generate plants, inspect gardens, compare recipes, and export geometry.","why":"Review and reuse a separate vegetation component.","technical":"Living Garden Lab v1.0.0","source":"moor-living-garden.html","inMoor":false,"toolGap":"Procedural art, not biological simulation. No production planet integration or automatic LOD."},{"id":"planet-workshop","tool":"planetWorkshop","toolSrc":"moor-planet-workshop.html","cats":["generators","space"],"icon":"◉","label":"Planet Workshop","short":"Explore and tune seeded terrain, rivers, and provisional plants.","job":"Inspect planetary terrain, tune geology and water, and save recipes.","why":"Review this terrain revision separately.","technical":"Planet Workshop v3.0.0","source":"moor-planet-workshop.html","inMoor":false,"toolGap":"Experimental terrain; plant visuals provisional; coarse erosion and hydrology. Not production MOOR."}];
if(typeof COMPS==='undefined'||typeof TOOLS==='undefined')return;
entries.forEach(function(c){
 if(!COMPS.some(function(x){return x.id===c.id;}))COMPS.unshift(c);
 TOOLS[c.tool]={mount:function(host){
 var bar=document.createElement('div');bar.className='t-controls';
 var note=document.createElement('span');note.className='meta';note.textContent='Independent review component';
 var link=document.createElement('a');link.className='btn primary';link.href=c.source;link.target='_blank';link.rel='noopener';link.textContent='Open full screen';
 bar.append(note,link);
 var frame=document.createElement('iframe');frame.title=c.label;frame.src=c.source;frame.style.cssText='width:100%;height:78dvh;min-height:420px;border:0;border-radius:12px;background:#162423';frame.allow='fullscreen';
 host.replaceChildren(bar,frame);
 },unmount:function(){}};
});
window.PULSE_COMPONENTS=COMPS;
var id=new URLSearchParams(location.search).get('component');
if(entries.some(function(c){return c.id===id;}))openComponent(id);
else if(typeof renderStage==='function')renderStage();
})();
