const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../funnel-kernel.js');
const bp=JSON.parse(fs.readFileSync('blueprint/quick-notes.blueprint.json','utf8'));

F._resetForTests();
const id='quick-notes-v1';
F.open({request_id:id,input:bp.page0,source:'Sebastian / Quick Notes',context:{destination:'Project Pulse'}});
F.advance({request_id:id,stage:'references',provenance:'verified',payload:{
  reused:[
    {path:'environment-engine-core.js',reason:'Reuse canonical presentation tokens lightly rather than creating another visual system.'},
    {path:'pulse-component-extensions.js',reason:'Use existing Pulse registration mechanism.'},
    {path:'FUNNEL.md',reason:'Current sealed build/change authority.'}
  ],missing:[]
}});
F.advance({request_id:id,stage:'distill',provenance:'inferred',payload:{
  spec_draft:bp.objective+' '+bp.decisions.join(' ')
}});
F.advance({request_id:id,stage:'decisions',provenance:'explicit',payload:{
  locked:bp.decisions.map((value,i)=>({key:'decision-'+(i+1),value})),unresolved:[]
}});
const pre=F.inspect(id);
const obligations=F.extractObligations(bp.page0).map(o=>({id:o.id,source:o.source,status:'satisfied'}));
F.advance({request_id:id,stage:'replay',provenance:'verified',payload:{
  page0_verified:true,page0_hash:pre.stages.page0.raw_hash,obligations,substitutions:[]
}});
F.advance({request_id:id,stage:'verdict',provenance:'verified',payload:{
  spec:{blueprint_id:bp.id,objective:bp.objective,decisions:bp.decisions,honest_limits:bp.honest_limits,obligations},
  destination:bp.destination,done_criteria:bp.done_criteria
}});
const session=F.inspect(id);
assert(session.receipt,'Funnel receipt required');
assert.equal(F.verifyReceipt(session.receipt),true,'receipt must verify');
const packet=F.executionPacket(session.receipt);
assert.equal(packet.destination,'Project Pulse');
assert.equal(packet.spec.blueprint_id,'quick-notes-v1');
console.log('PASS: sealed Funnel issued Quick Notes execution receipt '+session.receipt.fingerprint);
