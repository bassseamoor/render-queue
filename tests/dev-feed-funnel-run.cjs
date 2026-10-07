const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../funnel-kernel.js');
const bp=JSON.parse(fs.readFileSync('blueprint/dev-feed-owner-visibility.blueprint.json','utf8'));

F._resetForTests();
const id='dev-feed-owner-visibility-v1';
F.open({request_id:id,input:bp.page0,source:'Sebastian / Dev Feed',context:{destination:'Project Pulse'}});
F.advance({request_id:id,stage:'usage_plan',provenance:'system',payload:{plan:F.makeUsagePlan(bp.page0,{page:'Project Pulse',source:'Sebastian / Dev Feed'},{execution_plan:{build_required:true,builder:'Harness/builders after Funnel authorization',destination:'Project Pulse / Dev Feed',reuse_before_new:true}})}});
F.advance({request_id:id,stage:'references',provenance:'verified',payload:{
  reused:[
    {path:'software-factory-core.js',reason:'Existing work-order/traveler machinery remains authoritative production evidence.'},
    {path:'pulse-slice-release-ledger.json',reason:'Existing release tracker is composed rather than replaced.'},
    {path:'funnel-maintenance-status.json',reason:'Existing maintenance tracker is composed rather than replaced.'},
    {path:'trajectory-ledger.html',reason:'Known intent/result observability component should become owner-visible in Pulse.'},
    {path:'pulse-component-extensions.js',reason:'Existing Pulse component registration mechanism.'}
  ],missing:[]
}});
F.advance({request_id:id,stage:'distill',provenance:'inferred',payload:{
  spec_draft:bp.objective+' '+bp.worker_rule+' '+bp.owner_visibility_rule
}});
F.advance({request_id:id,stage:'decisions',provenance:'explicit',payload:{
  locked:[
    {key:'surface',value:'multiple timestamped text streams; details behind click'},
    {key:'authority',value:'observational only; does not mint Funnel/build/release authority'},
    {key:'parallelism',value:'unique append-only event files under dev-feed/events/'},
    {key:'live-data',value:'compose semantic receipts, GitHub PR/commit activity, release ledger and maintenance status'},
    {key:'visibility',value:'merged and owner-visible are distinct states'}
  ],unresolved:[]
}});
const pre=F.inspect(id);
const obligations=F.extractObligations(bp.page0).map(o=>({id:o.id,source:o.source,status:'satisfied'}));
F.advance({request_id:id,stage:'replay',provenance:'verified',payload:{
  page0_verified:true,page0_hash:pre.stages.page0.raw_hash,obligations,substitutions:[]
}});
F.advance({request_id:id,stage:'verdict',provenance:'verified',payload:{
  spec:{
    blueprint_id:bp.id,
    objective:bp.objective,
    architecture:bp.architecture,
    owner_visibility_rule:bp.owner_visibility_rule,
    worker_rule:bp.worker_rule,
    honest_limits:bp.honest_limits,
    obligations
  },
  destination:'Project Pulse / Dev Feed',
  done_criteria:bp.done_criteria
}});
const session=F.inspect(id);
assert(session.receipt,'Dev Feed Funnel receipt required');
assert.equal(F.verifyReceipt(session.receipt),true);
const packet=F.executionPacket(session.receipt);
assert.equal(packet.destination,'Project Pulse / Dev Feed');
assert.equal(packet.spec.blueprint_id,bp.id);
console.log('PASS: sealed Funnel issued Dev Feed execution receipt '+session.receipt.fingerprint);
