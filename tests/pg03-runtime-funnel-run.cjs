const assert=require('node:assert/strict');
const K=require('../funnel-kernel.js');
const Loop=require('../scripts/funnel-build-loop.cjs');
const bp=require('../blueprint/pg-03-stable-seed-substream-standard.blueprint.json');

const RealDate=Date;
class FixedDate extends RealDate{
  constructor(...a){super(...(a.length?a:['2026-10-07T03:35:00.000Z']));}
  static now(){return RealDate.parse('2026-10-07T03:35:00.000Z');}
}
global.Date=FixedDate;

const PAGE0='Use the Funnel to automate redundant planning, ask it what the next work is, and build the selected sealed slice under its exact Blueprint SOP instructions.';
const live=require('../blueprint-choreography-state.json');
const fixture=JSON.parse(JSON.stringify(live));
const historical=new Set(['BF-01','BF-02','CH-01','CH-02','FM-01','FM-02','FM-05','PG-01','PG-02','PG-03','WO-01','WO-02','DT-01','DT-02','DT-03','DT-06']);
for(const id of Object.keys(fixture.slices))if(!historical.has(id))delete fixture.slices[id];
fixture.slices['PG-03']={
  status:'blueprint-sealed-runtime-partial',
  evidence:[
    'blueprint/pg-03-stable-seed-substream-standard.blueprint.json',
    'blueprint/pg-03-stable-seed-substream-standard.seal.json',
    'tests/pg03-blueprint-funnel-run.cjs',
    'tests/pg03-blueprint-standard-checks.cjs'
  ]
};
const packet=Loop.planNext({owner_directive:PAGE0,repository_base:'pg03-runtime-base',evidence:fixture});
assert.equal(packet.next_slice.slice_id,'PG-03');
assert.equal(packet.action,'execute-sealed-blueprint');
assert.deepEqual(packet.release.release_scope.write,bp.builder_handoff.touch_order);

K._resetForTests();
const id='pg03-runtime-v44-v1';
let s=K.open({request_id:id,input:PAGE0,source:'owner',context:{project:'MOOR Procedural Toolchain',slice:'PG-03',mode:'runtime-build'}});
const plan=K.makeUsagePlan(PAGE0,{source:'owner',page:'Project Pulse / PG-03'},{
  execution_plan:{
    build_required:true,
    builder:'current builder',
    destination:'MOOR procedural toolchain',
    reuse_before_new:true,
    steps:['reuse sealed PG-03 blueprint','touch only builder_handoff.touch_order','preserve existing RNG','run locality and recipe regressions']
  },
  verification_plan:{
    compare_to_page0:true,require_done_criteria:true,verify_requested_path:true,
    checks:['exact four-file write scope','no RNG implementation replacement','semantic-key-v1 locality','unknown scheme fails closed','PG-02 regression stays green','no authority mutation'],
    write_failures_back_as_evidence:true
  }
});
s=K.advance({request_id:id,stage:'usage_plan',payload:{plan},provenance:'system'});
s=K.advance({request_id:id,stage:'references',payload:{reused:[
  {id:'blueprint/pg-03-stable-seed-substream-standard.blueprint.json',kind:'sealed-blueprint'},
  {id:'blueprint/pg-03-stable-seed-substream-standard.seal.json',kind:'blueprint-seal'},
  {id:'procedural-recipe-core.js',kind:'PG-02 runtime'},
  {id:'procedural-recipe-schema.json',kind:'PG-02 contract'},
  {id:'pulse-dashboard.html',kind:'existing RNG implementation'}
],missing:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:'Execute PG-03 exactly: create semantic-key-v1 framing helper, make ProceduralRecipe reject unknown schemes, add the machine-readable scheme contract, and prove branch-local deterministic compatibility with the existing streamFrom RNG.'},provenance:'explicit'});
s=K.advance({request_id:id,stage:'decisions',payload:{locked:[
  {key:'slice',value:'PG-03'},
  {key:'write_scope',value:bp.builder_handoff.touch_order},
  {key:'scheme',value:bp.locked_values.scheme},
  {key:'formula',value:bp.locked_values.canonical_seed_formula},
  {key:'rng_owner',value:bp.locked_values.rng_owner},
  {key:'do_not_touch',value:bp.builder_handoff.do_not_touch}
],unresolved:[]},provenance:'explicit'});
const obligations=K.extractObligations(PAGE0).map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(PAGE0),obligations,substitutions:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'verdict',payload:{spec:{
  slice_id:'PG-03',
  blueprint_ref:'blueprint/pg-03-stable-seed-substream-standard.blueprint.json',
  write_scope:bp.builder_handoff.touch_order,
  scheme:'semantic-key-v1',
  obligations
},destination:'MOOR procedural toolchain / PG-03 runtime',done_criteria:bp.acceptance},provenance:'verified'});
assert(K.verifyReceipt(s.receipt));
console.log(JSON.stringify({
  pass:true,law_version:K.law_version,funnel_revision:K.revision,verdict:'BUILD',
  receipt:s.receipt.fingerprint,usage_plan_hash:s.receipt.usage_plan_hash,
  destination:s.receipt.destination,write_scope:s.stages.verdict.spec.write_scope
},null,2));
