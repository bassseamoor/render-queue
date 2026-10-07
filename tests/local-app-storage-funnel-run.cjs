const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../funnel-kernel.js');
const bp=JSON.parse(fs.readFileSync('blueprint/local-app-storage.blueprint.json','utf8'));

F._resetForTests();
const id='local-app-storage-v1';
F.open({request_id:id,input:bp.page0,source:'Sebastian / connected SSD storage rule',context:{destination:'Project Pulse app storage'}});
F.advance({request_id:id,stage:'references',provenance:'verified',payload:{
  reused:[
    {path:'quick-notes.html',reason:'Existing app requiring durable local storage.'},
    {path:'trajectory-ledger.html',reason:'Existing app requiring durable local checkpoints.'},
    {path:'FUNNEL.md',reason:'Current sealed operating authority.'}
  ],missing:[]
}});
F.advance({request_id:id,stage:'distill',provenance:'inferred',payload:{
  spec_draft:bp.objective+' Layout: '+bp.structure.root+' -> '+bp.structure.app_data
}});
F.advance({request_id:id,stage:'decisions',provenance:'explicit',payload:{
  locked:[
    {key:'interface',value:'MOOR applications remain the user-facing interface; SSD is backing storage.'},
    {key:'layout',value:'MOOR/app-data/<app-id>/...'},
    {key:'permission',value:'one explicit File System Access grant; never fake silent drive access'},
    {key:'fallback',value:'browser storage remains usable when SSD handle is unavailable'}
  ],unresolved:[]
}});
const pre=F.inspect(id);
const obligations=F.extractObligations(bp.page0).map(o=>({id:o.id,source:o.source,status:'satisfied'}));
F.advance({request_id:id,stage:'replay',provenance:'verified',payload:{page0_verified:true,page0_hash:pre.stages.page0.raw_hash,obligations,substitutions:[]}});
F.advance({request_id:id,stage:'verdict',provenance:'verified',payload:{
  spec:{blueprint_id:bp.id,objective:bp.objective,structure:bp.structure,mechanism:bp.mechanism,honest_limits:bp.honest_limits,obligations},
  destination:'Project Pulse app storage',done_criteria:bp.done_criteria
}});
const s=F.inspect(id);assert(s.receipt);assert.equal(F.verifyReceipt(s.receipt),true);
assert.equal(F.executionPacket(s.receipt).spec.blueprint_id,bp.id);
console.log('PASS: sealed Funnel issued local app storage receipt '+s.receipt.fingerprint);
