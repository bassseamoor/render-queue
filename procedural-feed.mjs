import {FAMILIES,recipe} from './procedural-studio/core.mjs?v=20261006-assets2';
import {list,descriptor} from './procedural-studio/storage.mjs?v=20261006-assets2';
const W=window.WonderFeed;
if(W?.Haven){
 function register(spec){const existing=W.Haven.native.find(n=>n.id===spec.id);if(existing){Object.assign(existing,spec);W.Haven.refreshRegistry();}else W.Haven.register(spec);}
 for(const family of FAMILIES)register({id:'native-asset-example-'+family.id,label:family.label,category:family.category,page:'procedural-studio/index.html?preview=1&family='+family.id,proceduralRecipe:recipe(family.id)});
 async function refresh(){try{for(const rec of await list())register({...descriptor(rec)});}catch(e){W.Haven.failures.push({source:'procedural-library',reason:e.message});}}
 refresh();window.addEventListener('moor:procedural-generator-saved',e=>register(descriptor(e.detail)));window.addEventListener('storage',e=>{if(e.key==='moor-procedural-catalog-changed')refresh();});window.addEventListener('focus',refresh);
}
