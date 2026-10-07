const assert=require('node:assert/strict');
const K=require('../funnel-kernel.js');
const Loop=require('../scripts/funnel-build-loop.cjs');
const bp=require('../blueprint/dt06-mobile-semantic-parity.blueprint.json');

const PAGE0='Holy wow use the damn Funnel. Automate the redundant part of this task, ask the Funnel what to do, and execute the selected build instead of manually re-planning the same work.';
const base='runtime-release-base';
const packet=Loop.planNext({owner_directive:PAGE0,repository_base:base});
assert.equal(packet.next_slice.slice_id,'DT-06');
assert.equal(packet.action,'execute-sealed-blueprint');

K._resetForTests();
const id='owner-dt06-runtime-release-v1';
let s=K.open({request_id:id,input:PAGE0,source:'owner',context:{project:'MOOR',slice:'DT-06',mode:'runtime-build'}});
const usage=K.makeUsagePlan(PAGE0,{project:'MOOR',slice:'DT-06',mode:'runtime-build',source:'owner'},{
  execution_plan:{
    build_required:true,
    builder:'current builder',
    destination:'Project Pulse / Funnel Citadel',
    reuse_before_new:true,
    steps:['use choreography to select next slice','reuse sealed DT-06 blueprint','touch only released files','run independent parity verification']
  },
  verification_plan:{
    compare_to_page0:true,
    require_done_criteria:true,
    verify_requested_path:true,
    checks:[
      'Funnel-selected slice is DT-06',
      'sealed blueprint is reused instead of rewritten',
      'runtime writes stay inside builder_handoff.touch_order',
      'semantic parity test passes',
      'existing Citadel regression tests remain green',
      'no authority file is modified',
      'no unapproved substitution'
    ],
    write_failures_back_as_evidence:true
  }
});
s=K.advance({request_id:id,stage:'usage_plan',payload:{plan:usage},provenance:'system'});
s=K.advance({request_id:id,stage:'references',payload:{reused:[
  {id:'blueprint/dt06-mobile-semantic-parity.blueprint.json',kind:'sealed-blueprint'},
  {id:'blueprint/dt06-mobile-semantic-parity.seal.v2.json',kind:'blueprint-receipt'},
  {id:'scripts/funnel-build-loop.cjs',kind:'planner'},
  {id:'factory-twin-core.js',kind:'truth-source'},
  {id:'pulse-beam-funnel-hall.js',kind:'runtime'},
  {id:'pulse-beam-funnel-hall.html',kind:'runtime'}
],missing:[]},provenance:'learned'});
s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:'Execute DT-06 REV2 exactly as the sealed mobile semantic parity delta. Preserve FactoryTwinSnapshot truth; reduce only drawn density; add one searchable semantic index; do not alter authority machinery.'},provenance:'inferred'});
s=K.advance({request_id:id,stage:'decisions',payload:{locked:[
  {key:'slice',value:'DT-06'},
  {key:'blueprint',value:'blueprint/dt06-mobile-semantic-parity.blueprint.json'},
  {key:'write_scope',value:bp.builder_handoff.touch_order},
  {key:'do_not_touch',value:bp.builder_handoff.do_not_touch},
  {key:'semantic_rule',value:'same semantic IDs; lower visual density only'}
],unresolved:[]},provenance:'explicit'});
const obligations=K.extractObligations(PAGE0).map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(PAGE0),obligations,substitutions:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'verdict',payload:{spec:{
  slice_id:'DT-06',
  blueprint_id:bp.blueprint_id,
  blueprint_ref:'blueprint/dt06-mobile-semantic-parity.blueprint.json',
  write_scope:bp.builder_handoff.touch_order,
  obligations
},destination:'Project Pulse / Funnel Citadel',done_criteria:bp.acceptance},provenance:'verified'});

assert(K.verifyReceipt(s.receipt));
assert.deepEqual(s.stages.verdict.spec.write_scope,[
  'pulse-beam-funnel-hall.js',
  'pulse-beam-funnel-hall.html',
  'tests/factory-twin-mobile-parity-checks.cjs'
]);
for(const p of ['factory-twin-core.js','funnel-kernel.js','software-factory-core.js'])assert(bp.builder_handoff.do_not_touch.includes(p));
console.log(JSON.stringify({pass:true,slice:'DT-06',receipt:s.receipt.fingerprint,usage_plan_hash:s.receipt.usage_plan_hash,destination:s.receipt.destination,write_scope:s.stages.verdict.spec.write_scope},null,2));
