const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../funnel-kernel.js');

const bp=JSON.parse(fs.readFileSync('blueprint/environment-engine-canonical-presentation.blueprint.json','utf8'));
F._resetForTests();
const requestId='environment-engine-canonical-presentation-v1';
F.open({request_id:requestId,input:bp.page0,source:'Sebastian / Environment Engine build',context:{destination:'Project Pulse'}});
const usagePlan=F.makeUsagePlan(bp.page0,{page:'environment-engine.html',source:'Sebastian / Environment Engine build'},{execution_plan:{build_required:true,builder:'Harness/builders after Funnel authorization',destination:'Project Pulse / Environment Engine',reuse_before_new:true}});
F.advance({request_id:requestId,stage:'usage_plan',provenance:'system',payload:{plan:usagePlan}});
F.advance({request_id:requestId,stage:'references',provenance:'verified',payload:{
  reused:bp.references.map(path=>({path,reason:'Existing verified or canonical source reused by the Environment Engine blueprint.'})),
  missing:[]
}});
F.advance({request_id:requestId,stage:'distill',provenance:'inferred',payload:{
  spec_draft:'Extract a reusable presentation quality kernel from the eight ambient studios; preserve deterministic seed/time, layered depth, lighting, atmosphere, material response, motion, post, camera, ambience and long-form export discipline; register it in Pulse; bind all future canonical presentation advancement to the sealed Funnel contract.'
}});
F.advance({request_id:requestId,stage:'decisions',provenance:'inferred',payload:{
  locked:[
    {key:'architecture',value:'shared recipe + renderer + Pulse workbench; do not clone eight studios'},
    {key:'long-form',value:'preserve verified 3600-second job ceiling and form 8h as eight deterministic 1h segments'},
    {key:'authority',value:'v44-sealed Funnel remains source of truth; renderer cannot promote itself'},
    {key:'quality',value:'rendered inspection remains required in addition to code/tests'}
  ],
  unresolved:[]
}});
const pre=F.inspect(requestId);
const obligations=F.extractObligations(bp.page0).map(o=>({id:o.id,source:o.source,status:'satisfied'}));
F.advance({request_id:requestId,stage:'replay',provenance:'verified',payload:{
  page0_verified:true,
  page0_hash:pre.stages.page0.raw_hash,
  obligations,
  substitutions:[]
}});
F.advance({request_id:requestId,stage:'verdict',provenance:'verified',payload:{
  spec:{
    blueprint_id:bp.id,
    obligations,
    objective:bp.objective,
    architecture:bp.architecture,
    source_lessons:bp.source_lessons,
    long_form:bp.long_form,
    advancement_contract:bp.advancement_contract,
    pulse:bp.pulse,
    honest_limits:bp.honest_limits
  },
  destination:'Project Pulse / Environment Engine',
  done_criteria:bp.done_criteria
}});
const session=F.inspect(requestId);
assert(session.receipt,'Funnel must issue receipt');
assert.equal(F.verifyReceipt(session.receipt),true,'receipt must verify under sealed kernel');
assert.equal(session.receipt.usage_plan_hash,session.stages.usage_plan.plan_hash,'Environment Engine authority must bind the usage plan');
const packet=F.executionPacket(session.receipt);
assert.equal(packet.spec.blueprint_id,bp.id);
assert.equal(packet.destination,'Project Pulse / Environment Engine');
assert.deepEqual(packet.spec.obligations.map(x=>x.id).sort(),obligations.map(x=>x.id).sort());
assert.equal(packet.spec.advancement_contract.funnel_law,'v44-sealed');
console.log('PASS: sealed Funnel replay issued valid Environment Engine execution receipt '+session.receipt.fingerprint);
