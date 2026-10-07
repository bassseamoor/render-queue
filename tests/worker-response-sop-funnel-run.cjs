const assert=require('node:assert/strict');
const fs=require('node:fs');
const F=require('../funnel-kernel.js');

const bp=JSON.parse(fs.readFileSync('blueprint/worker-response-sop.blueprint.json','utf8'));
F._resetForTests();
const id='worker-response-sop-v1';
F.open({request_id:id,input:bp.page0,source:'Sebastian / Pulse SOP response audit',context:{destination:'Project Pulse SOP'}});
F.advance({request_id:id,stage:'usage_plan',provenance:'system',payload:{plan:F.makeUsagePlan(bp.page0,{page:'Project Pulse SOP',source:'Sebastian / Pulse SOP response audit'},{execution_plan:{build_required:true,builder:'Harness/builders after Funnel authorization',destination:'Project Pulse SOP / worker response reporting',reuse_before_new:true}})}});
F.advance({request_id:id,stage:'references',provenance:'verified',payload:{
  reused:bp.references.map(path=>({path,reason:'Existing Pulse/Funnel/worker contract audited as source material for response truth.'})),
  missing:[]
}});
F.advance({request_id:id,stage:'distill',provenance:'inferred',payload:{
  spec_draft:'Define a strict evidence-backed reporting ladder, update the operating documents that workers actually follow, audit prior responses in this chat, and make corrections append-only.'
}});
F.advance({request_id:id,stage:'decisions',provenance:'explicit',payload:{
  locked:[
    {key:'status-ladder',value:bp.status_ladder.join(' -> ')},
    {key:'destination-law',value:'Every completion response names the canonical destination rather than saying Pulse/main generically.'},
    {key:'correction-law',value:'Historical overclaims remain preserved; later evidence appends corrections.'},
    {key:'authority',value:'Reporting language cannot mint or upgrade Funnel/build/release/runtime state.'}
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
    status_ladder:bp.status_ladder,
    findings:bp.findings,
    implementation:bp.implementation,
    honest_limits:bp.honest_limits,
    obligations
  },
  destination:'Project Pulse SOP / worker response reporting',
  done_criteria:bp.done_criteria
}});
const s=F.inspect(id);
assert(s.receipt,'response SOP requires a Funnel receipt');
assert.equal(F.verifyReceipt(s.receipt),true);
const packet=F.executionPacket(s.receipt);
assert.equal(packet.spec.blueprint_id,bp.id);
assert.equal(packet.destination,'Project Pulse SOP / worker response reporting');
console.log('PASS: sealed Funnel issued Worker Response SOP receipt '+s.receipt.fingerprint);
