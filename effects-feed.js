/* Saved effect recipes become native feed kinds; unsaved rendering never writes. */
(function(){
'use strict';
const W=window.WonderFeed;if(!W?.Haven||!window.EffectsLibrary)return;
function register(rec){const spec=EffectsLibrary.descriptor(rec),existing=W.Haven.native.find(n=>n.id===spec.id);if(existing){Object.assign(existing,spec);const t=W.genome.types.find(t=>t.kind===spec.id);if(t)t.label=spec.label;W.Haven.refreshRegistry();}else W.Haven.register(spec);}
async function refresh(){try{for(const rec of await EffectsLibrary.list())register(rec);}catch(e){W.Haven.failures.push({source:'effect-library',reason:e.message});}}
refresh();window.addEventListener('moor:effect-generator-saved',e=>register(e.detail));window.addEventListener('storage',e=>{if(e.key==='moor-effects-catalog-changed')refresh();});window.addEventListener('focus',refresh);
})();
