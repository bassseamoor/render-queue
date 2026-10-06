/* MOOR Refinery v1 — parallel non-authoritative capability filter. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorRefinery=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const A=root&&root.MoorAssembly||(typeof require==='function'?require('./moor-assembly-core.js'):null);
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}function hash(x){return A.hash(x);}
function srcId(src){if(!src)return 'unknown';if(typeof src==='string')return src;return src.component||src.app||src.project||src.id||'unknown';}
function verifiedStatus(s){return s==='machine-verified'||s==='human-approved'||s==='canonical';}
function makeAssembly(d){
  if(d.assembly_contract&&A.verifyContract(d.assembly_contract))return clone(d.assembly_contract);
  const sid=srcId(d.source),recipe=clone(d.recipe||null),payload=d.payload!=null?clone(d.payload):(d.data!=null?clone(d.data):null);
  if(recipe&&recipe.spec&&Array.isArray(recipe.parts)){
    return A.createContract({artifact_id:d.id||('artifact:'+hash([sid,d.title])),version:String(d.version||d.payload&&d.payload.version||'1'),
      source_hash:hash({source:sid,recipe}),inputs:[],dependencies:[{id:'moor-harness-runtime-v1.html',version:'1'}],
      operations:[{id:'compose',op:'harness.compose.v1',args:{spec:recipe.spec,parts:recipe.parts,seed:hash(recipe)}}],
      required_executors:['harness.compose.v1'],outputs:[{name:'app',type:'moor.app.html'}],
      verification:[{kind:'evidence-ref',value:d.evidence_id||null}],rollback:null,
      determinism:{mode:'deterministic-source',excludes:['declared runtime randomness','external network/data']},
      meta:{source:sid,implementation_ref:d.implementation_ref||null}});
  }
  if(recipe){
    return A.createContract({artifact_id:d.id||('artifact:'+hash([sid,d.title])),version:String(d.version||'1'),source_hash:hash({source:sid,recipe}),
      inputs:[],dependencies:[],operations:[{id:'replay',op:sid+'.replay.v1',args:{recipe}}],required_executors:[sid+'.replay.v1'],
      outputs:[{name:'artifact',type:(d.output_type||'moor.artifact')}],verification:[],determinism:{mode:'executor-declared'},meta:{source:sid,implementation_ref:d.implementation_ref||null}});
  }
  return A.createContract({artifact_id:d.id||('artifact:'+hash([sid,d.title,payload])),version:String(d.version||'1'),source_hash:hash({source:sid,payload}),
    inputs:[],dependencies:[],operations:[{id:'snapshot',op:'artifact.snapshot.v1',args:{name:'artifact',payload}}],required_executors:['artifact.snapshot.v1'],
    outputs:[{name:'artifact',type:d.output_type||'moor.artifact.snapshot'}],verification:[],determinism:{mode:'deterministic'},meta:{source:sid,implementation_ref:d.implementation_ref||null}});
}
function normalizeCapabilities(d,assembly){
  const status=verifiedStatus(d.status)?d.status:'specified',caps=[];
  if(Array.isArray(d.capabilities)&&d.capabilities.length){
    d.capabilities.forEach((c,i)=>{if(typeof c==='string')c={capability_id:c,provides:[c]};c=clone(c);c.capability_id=c.capability_id||('capability:'+hash([d.id,i,c]));c.version=String(c.version||d.version||'1');c.status=verifiedStatus(c.status)?c.status:status;c.implementation_ref=c.implementation_ref||d.implementation_ref||null;c.assembly_contract_hash=assembly.content_hash;c.evidence_refs=c.evidence_refs||((d.evidence||d.evidence_id)?[d.evidence_id||('evidence:'+hash(d.evidence))]:[]);caps.push(c);});
  }else{
    caps.push({capability_id:'capability:artifact:'+hash(d.id||d.title||assembly.content_hash),version:String(d.version||'1'),status:status,
      provides:['artifact:materialize'],requires:[],input_types:[],output_types:[d.output_type||'moor.artifact.snapshot'],knobs:{},events:[],state:{},
      side_effects:[],compatibility:{},implementation_ref:d.implementation_ref||null,assembly_contract_hash:assembly.content_hash,
      evidence_refs:(d.evidence||d.evidence_id)?[d.evidence_id||('evidence:'+hash(d.evidence))]:[]});
  }
  return caps;
}
function crystallizeOutput(d,opts){
  d=clone(d||{});opts=opts||{};const assembly=makeAssembly(d),caps=normalizeCapabilities(d,assembly),status=verifiedStatus(d.status)?d.status:'specified';
  const learning={scope:clone(opts.scope||d.scope||{}),decisions:clone(d.decisions||[]),constraints:clone(d.constraints||[]),failures:clone(Array.isArray(d.failures)?d.failures:(d.failure?[d.failure]:[])),
    substitutions:clone(d.substitutions||[]),owner_corrections:clone(d.owner_corrections||[]),verification:clone(d.evidence||null),intent:clone(d.intent||null),
    supersedes:clone(d.supersedes||[]),compacted_at:new Date().toISOString()};
  const core={schema:'moor.crystal-bundle',version:1,bundle_id:'crystal:'+hash([d.id||d.title,assembly.content_hash]),source:{id:srcId(d.source),artifact_id:d.id||null,title:d.title||d.name||null},
    status,implementation_ref:d.implementation_ref||null,assembly_contract:assembly,capability_delta:caps,learning_capsule:learning,
    evidence:clone(d.evidence||null),created_at:new Date().toISOString(),authority:'non-authoritative-refinery'};
  core.content_hash=hash(core);return core;
}
async function crystallizeBlueprint(detail){
  detail=clone(detail||{});let blueprint=detail.blueprint_data||null,path=detail.blueprint||detail.path||null;
  if(!blueprint&&path&&root&&typeof root.fetch==='function'){try{const r=await root.fetch(path,{cache:'no-store'});if(r.ok)blueprint=await r.json();}catch(e){}}
  const d={id:'blueprint:'+hash([detail.case_id,path,blueprint]),title:blueprint&&blueprint.title||path||'Blueprint',version:blueprint&&blueprint.version||'1',
    source:{app:'Ultra Funnel',component:'funnel-law-core'},status:'specified',implementation_ref:path,recipe:{blueprint:path||null,content_hash:detail.hash||hash(blueprint||{})},
    output_type:'moor.blueprint',capabilities:[{capability_id:'capability:blueprint:'+hash(path||blueprint),provides:['blueprint:specified'],output_types:['moor.blueprint'],status:'specified'}],
    evidence:{case_id:detail.case_id||null,state:'BLUEPRINT_READY',blueprint_hash:detail.hash||null}};
  return crystallizeOutput(d,{scope:{case_id:detail.case_id||null}});
}
function attach(){
  if(!root||!root.addEventListener)return;
  root.addEventListener('moor:blueprint-ready',async e=>{try{const b=await crystallizeBlueprint(e.detail||{});if(root.MoorCapabilityMemory)root.MoorCapabilityMemory.ingest(b);if(root.MoorCapabilityHandoff)root.MoorCapabilityHandoff.publishBundle(b);}catch(_){}});
}
attach();
return Object.freeze({version:1,name:'MOOR Refinery',crystallizeOutput,crystallizeBlueprint,verifiedStatus});
});