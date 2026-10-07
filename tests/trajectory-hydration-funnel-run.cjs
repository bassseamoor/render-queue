const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../funnel-kernel.js');
const bp=JSON.parse(fs.readFileSync('blueprint/trajectory-canonical-hydration.blueprint.json','utf8'));

F._resetForTests();
const id='trajectory-canonical-hydration-v1';
F.open({request_id:id,input:bp.page0,source:'Sebastian / empty Trajectory diagnosis',context:{destination:'Project Pulse / Trajectory'}});
F.advance({request_id:id,stage:'references',provenance:'verified',payload:{
  reused:[
    {path:'trajectory-ledger.html',reason:'Existing localStorage-only Trajectory surface.'},
    {path:'convergence-funnel.html',reason:'Existing local checkpoint writer.'},
    {path:'dev-feed-ledger.json',reason:'Evidence that real project history already exists outside Trajectory localStorage.'},
    {path:'moor-local-files.js',reason:'SSD-backed local app storage bridge.'}
  ],missing:[]
}});
F.advance({request_id:id,stage:'distill',provenance:'inferred',payload:{
  spec_draft:bp.objective+' Diagnosis: '+bp.diagnosis.join(' ')
}});
F.advance({request_id:id,stage:'decisions',provenance:'explicit',payload:{
  locked:[
    {key:'canonical-history',value:'append-only unique files under trajectory/events/'},
    {key:'local-durable',value:'MOOR/app-data/trajectory/local-checkpoints.json'},
    {key:'score-discipline',value:'unscored canonical checkpoints are valid; do not invent trajectory numbers'},
    {key:'merge',value:'canonical and local checkpoints merge by stable identity; neither rewrites the other'}
  ],unresolved:[]
}});
const pre=F.inspect(id);
const obligations=F.extractObligations(bp.page0).map(o=>({id:o.id,source:o.source,status:'satisfied'}));
F.advance({request_id:id,stage:'replay',provenance:'verified',payload:{page0_verified:true,page0_hash:pre.stages.page0.raw_hash,obligations,substitutions:[]}});
F.advance({request_id:id,stage:'verdict',provenance:'verified',payload:{
  spec:{blueprint_id:bp.id,objective:bp.objective,diagnosis:bp.diagnosis,implementation:bp.implementation,honest_limits:bp.honest_limits,obligations},
  destination:'Project Pulse / Trajectory',done_criteria:bp.done_criteria
}});
const s=F.inspect(id);assert(s.receipt);assert.equal(F.verifyReceipt(s.receipt),true);
assert.equal(F.executionPacket(s.receipt).spec.blueprint_id,bp.id);
console.log('PASS: sealed Funnel issued canonical Trajectory hydration receipt '+s.receipt.fingerprint);
