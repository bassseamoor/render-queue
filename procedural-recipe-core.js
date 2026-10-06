(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorProceduralRecipe=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function copy(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}'}
function hash(x){const s=typeof x==='string'?x:stable(x);let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16).padStart(8,'0')}
function normalizeAnchor(a){a=copy(a||{});return {anchor_id:String(a.anchor_id||''),frame:String(a.frame||'local'),parent_anchor:a.parent_anchor==null?null:String(a.parent_anchor),role:String(a.role||''),transform_or_constraint:copy(a.transform_or_constraint||{}),stable_key:String(a.stable_key||'')}}
function contentHash(r){const x=copy(r||{});delete x.content_hash;return hash(x)}
function normalizeRecipe(r){
 r=copy(r||{});
 const out={schema:'moor.procedural-recipe',version:Number(r.version||1),recipe_id:String(r.recipe_id||''),requested_capability:String(r.requested_capability||''),generator_binding:String(r.generator_binding||''),generator_version:String(r.generator_version||''),root_seed:String(r.root_seed==null?'':r.root_seed),subseed_scheme:String(r.subseed_scheme||'semantic-key-v1'),parameters:copy(r.parameters||{}),semantic_anchors:(Array.isArray(r.semantic_anchors)?r.semantic_anchors:[]).map(normalizeAnchor),upstream_recipe_refs:(Array.isArray(r.upstream_recipe_refs)?r.upstream_recipe_refs:[]).map(String),manual_overrides:copy(r.manual_overrides||{}),reconstruction_tolerance:copy(r.reconstruction_tolerance||{}),expected_invariants:(Array.isArray(r.expected_invariants)?r.expected_invariants:[]).map(String),provenance:copy(r.provenance||{})};
 out.content_hash=contentHash(out);return out;
}
function validateRecipe(input,inventory){
 const r=normalizeRecipe(input),errors=[];
 for(const k of ['recipe_id','requested_capability','generator_binding','generator_version','root_seed','subseed_scheme'])if(!r[k])errors.push('missing '+k);
 const ids=new Set(),keys=new Set();
 for(const a of r.semantic_anchors){if(!a.anchor_id)errors.push('anchor missing id');if(!a.role)errors.push('anchor '+a.anchor_id+' missing role');if(!a.stable_key)errors.push('anchor '+a.anchor_id+' missing stable_key');if(ids.has(a.anchor_id))errors.push('duplicate anchor_id '+a.anchor_id);ids.add(a.anchor_id);if(keys.has(a.stable_key))errors.push('duplicate stable_key '+a.stable_key);keys.add(a.stable_key)}
 for(const a of r.semantic_anchors)if(a.parent_anchor&&!ids.has(a.parent_anchor))errors.push('unknown parent_anchor '+a.parent_anchor);
 let generator=null;
 if(inventory&&Array.isArray(inventory.generators)){generator=inventory.generators.find(g=>g.generator_id===r.generator_binding&&String(g.version)===r.generator_version)||null;if(!generator)errors.push('generator binding/version not found');else if(!(generator.provides||[]).includes(r.requested_capability))errors.push('requested capability not provided')}
 if(input&&input.content_hash&&input.content_hash!==contentHash(r))errors.push('content_hash mismatch');
 return {ok:errors.length===0,errors,recipe:r,generator:copy(generator)};
}
return Object.freeze({version:1,normalizeRecipe,validateRecipe,contentHash,hash});
});