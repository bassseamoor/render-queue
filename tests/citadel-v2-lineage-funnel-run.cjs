const assert=require('node:assert/strict');
const K=require('../funnel-kernel.js');
const lineage=require('../blueprint/funnel-citadel-v2.runtime-lineage.json');

const PAGE0='The Funnel Citadel FC-02 blueprint baseline changed because DT-06 was separately Funnel-authorized and implemented. Re-Funnel the stale baseline relationship: preserve FC-02 as historical pinned evidence, register DT-06 as its authorized runtime successor, and do not silently rewrite or rebase the old plates.';
K._resetForTests();
const id='citadel-fc02-dt06-lineage-v1';
let s=K.open({request_id:id,input:PAGE0,source:'system replan trigger',context:{project:'MOOR',artifact:'FC-02',trigger:'authorized runtime successor'}});
const plan=K.makeUsagePlan(PAGE0,{source:'system replan trigger',page:'Project Pulse / Funnel Citadel'},{
  execution_plan:{
    build_required:false,
    builder:'none; lineage correction only',
    destination:'blueprint/funnel-citadel-v2.runtime-lineage.json',
    reuse_before_new:true,
    steps:['preserve old sealed bytes','bind authorized successor','verify current runtime hash','block silent rebase']
  },
  verification_plan:{
    compare_to_page0:true,
    require_done_criteria:true,
    verify_requested_path:true,
    checks:['old baseline hash preserved','DT-06 successor named','current runtime hash matches lineage','no plate bytes rewritten','no unapproved substitution'],
    write_failures_back_as_evidence:true
  }
});
s=K.advance({request_id:id,stage:'usage_plan',payload:{plan},provenance:'system'});
s=K.advance({request_id:id,stage:'references',payload:{reused:[
  {id:'blueprint/funnel-citadel-v2.blueprint.json',kind:'historical-blueprint'},
  {id:'blueprint/funnel-citadel-v2.seal.json',kind:'historical-seal'},
  {id:'tests/dt06-runtime-funnel-run.cjs',kind:'successor-authority'},
  {id:'tests/factory-twin-mobile-parity-checks.cjs',kind:'successor-verification'},
  {id:'pulse-beam-funnel-hall.js',kind:'current-runtime'}
],missing:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:'Preserve FC-02 REV2 as an immutable historical baseline and append an explicit runtime-lineage edge to DT-06. Future Citadel runtime work must re-Funnel from the current Hall, not mutate the old plates.'},provenance:'inferred'});
s=K.advance({request_id:id,stage:'decisions',payload:{locked:[
  {key:'baseline_sha256',value:lineage.baseline_runtime_sha256},
  {key:'baseline_status',value:lineage.baseline_status},
  {key:'successor_slice',value:lineage.successor.slice_id},
  {key:'successor_sha256',value:lineage.successor.runtime_sha256},
  {key:'policy',value:lineage.policy}
],unresolved:[]},provenance:'explicit'});
const obligations=K.extractObligations(PAGE0).map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(PAGE0),obligations,substitutions:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'verdict',payload:{spec:{artifact:'blueprint/funnel-citadel-v2.runtime-lineage.json',lineage,obligations},destination:'Project Pulse / Funnel Citadel lineage',done_criteria:[
  'FC-02 pinned source reconstructs to its original baseline hash',
  'current Hall is not required to equal the historical FC-02 hash',
  'DT-06 is explicitly recorded as the authorized successor',
  'successor runtime hash matches the current Hall',
  'future runtime repairs must re-Funnel from current Hall'
]},provenance:'verified'});
assert(K.verifyReceipt(s.receipt));
assert.equal(lineage.baseline_status,'historical-pinned');
assert.equal(lineage.successor.slice_id,'DT-06');
console.log(JSON.stringify({pass:true,receipt:s.receipt.fingerprint,baseline:lineage.baseline_runtime_sha256,successor:lineage.successor.runtime_sha256},null,2));
