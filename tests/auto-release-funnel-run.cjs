const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../funnel-kernel.js');
const bp=JSON.parse(fs.readFileSync('blueprint/auto-release-pipeline.blueprint.json','utf8'));

F._resetForTests();
const id='auto-release-pipeline-v1';
F.open({request_id:id,input:bp.page0,source:'Sebastian / release automation',context:{destination:'Project Pulse release machinery'}});
F.advance({request_id:id,stage:'usage_plan',provenance:'system',payload:{plan:F.makeUsagePlan(bp.page0,{page:'release automation',source:'Sebastian / release automation'},{execution_plan:{build_required:true,builder:'Harness/builders after Funnel authorization',destination:'Project Pulse release machinery',reuse_before_new:true}})}});
F.advance({request_id:id,stage:'references',provenance:'verified',payload:{
  reused:[
    {path:'blueprint/worker-execution-orchestration.blueprint.json',reason:'Existing deliberate worker release contract.'},
    {path:'worker-release-core.js',reason:'Existing release gating machinery.'},
    {path:'dev-feed/event-schema.json',reason:'Existing owner-observability event contract.'},
    {path:'worker-response-sop.json',reason:'Existing evidence-backed reporting states.'},
    {path:'.github/workflows/pulse-checks.yml',reason:'Existing comprehensive verification gate.'}
  ],missing:[]
}});
F.advance({request_id:id,stage:'distill',provenance:'inferred',payload:{spec_draft:bp.objective+' '+bp.implementation.join(' ')}});
F.advance({request_id:id,stage:'decisions',provenance:'explicit',payload:{
  locked:[
    {key:'opt-in',value:'PR body machine marker only'},
    {key:'authority-boundary',value:'Funnel/governance/workflow changes remain manual'},
    {key:'stale-base',value:'auto-update branch then wait for fresh CI'},
    {key:'merge',value:'squash exact verified head SHA'},
    {key:'receipt',value:'trusted workflow appends Dev Feed receipt directly after merge'}
  ],unresolved:[]
}});
const pre=F.inspect(id);
const obligations=F.extractObligations(bp.page0).map(o=>({id:o.id,source:o.source,status:'satisfied'}));
F.advance({request_id:id,stage:'replay',provenance:'verified',payload:{page0_verified:true,page0_hash:pre.stages.page0.raw_hash,obligations,substitutions:[]}});
F.advance({request_id:id,stage:'verdict',provenance:'verified',payload:{
  spec:{blueprint_id:bp.id,objective:bp.objective,diagnosis:bp.diagnosis,implementation:bp.implementation,obligations},
  destination:'Project Pulse release machinery',
  done_criteria:bp.done_criteria
}});
const s=F.inspect(id);
assert(s.receipt);assert.equal(F.verifyReceipt(s.receipt),true);
assert.equal(s.receipt.usage_plan_hash,s.stages.usage_plan.plan_hash);
console.log('PASS: sealed Funnel issued auto-release pipeline receipt '+s.receipt.fingerprint);
