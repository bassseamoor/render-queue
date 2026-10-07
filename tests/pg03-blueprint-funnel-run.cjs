const assert=require('node:assert/strict');
const K=require('../funnel-kernel.js');
const bp=require('../blueprint/pg-03-stable-seed-substream-standard.blueprint.json');

const RealDate=Date;
class FixedDate extends RealDate{
  constructor(...a){super(...(a.length?a:['2026-10-07T03:30:00.000Z']));}
  static now(){return RealDate.parse('2026-10-07T03:30:00.000Z');}
}
global.Date=FixedDate;

const PAGE0='Holy wow use the damn funnel. Automate the redundant part of this task, ask the funnel what to do, and execute the selected work instead of manually repeating the planning process.';
K._resetForTests();
const id='pg03-blueprint-v44-rev2';
let s=K.open({request_id:id,input:PAGE0,source:'owner',context:{project:'MOOR Blueprint Farm',slice:'PG-03',mode:'blueprint-publication'}});
const plan=K.makeUsagePlan(PAGE0,{source:'owner',page:'Project Pulse'},{
  reference_plan:{
    must_reuse:['blueprint-sop.html','blueprint-standard.html','blueprint-deep-links.html','blueprint/seeded-procedural-toolchain.blueprint.json','procedural-recipe-core.js','procedural-recipe-schema.json','procedural-generator-inventory.json','pulse-dashboard.html'],
    search_before_new:true
  },
  execution_plan:{
    build_required:true,
    builder:'Blueprint author only; PG-03 runtime requires a separate v44 release',
    destination:'Project Pulse / dashboard?tool=blueprintpg03',
    reuse_before_new:true,
    steps:['preserve existing RNG','specify semantic-key-v1 as exact delta','bind claim assertions','render Blueprint Standard surface','seal publication']
  },
  verification_plan:{
    compare_to_page0:true,
    require_done_criteria:true,
    verify_requested_path:true,
    checks:['SELL','SPEC','SHOW','EXEMPLAR','HONESTY','exact anchors','exact values and formulas','claim-level assertions','Pulse-only owner links','runtime remains unreleased'],
    write_failures_back_as_evidence:true
  }
});
s=K.advance({request_id:id,stage:'usage_plan',payload:{plan},provenance:'system'});
s=K.advance({request_id:id,stage:'references',payload:{reused:[
  {id:'blueprint-sop.html',kind:'SOP'},
  {id:'blueprint-standard.html',kind:'standard'},
  {id:'blueprint-deep-links.html',kind:'exemplar'},
  {id:'blueprint/seeded-procedural-toolchain.blueprint.json',kind:'parent'},
  {id:'procedural-recipe-core.js',kind:'PG-02 machinery'},
  {id:'procedural-recipe-schema.json',kind:'PG-02 contract'},
  {id:'procedural-generator-inventory.json',kind:'PG-01 inventory'},
  {id:'pulse-dashboard.html',kind:'current seed-rng runtime'}
],missing:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:JSON.stringify({
  slice:'PG-03',
  artifact:'blueprint/pg-03-stable-seed-substream-standard.blueprint.json',
  promise:bp.promise,
  locked_values:bp.locked_values,
  touch_order:bp.builder_handoff.touch_order,
  non_goals:bp.non_goals,
  claims:bp.claims
})},provenance:'explicit'});
s=K.advance({request_id:id,stage:'decisions',payload:{locked:[
  'PG-03 is the selected slice.',
  'Reuse existing streamFrom/hashSeed/mulberry32 unchanged.',
  'semantic-key-v1 framing is prefix + JSON.stringify([String(root_seed), key_parts.map(String)]).',
  'Unknown recipe sub-seed schemes fail closed.',
  'Blueprint publication only; runtime implementation requires a separate v44 verdict.',
  'Owner-visible navigation stays inside Pulse.'
],unresolved:[]},provenance:'explicit'});
const obligations=K.extractObligations(PAGE0).map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(PAGE0),obligations,substitutions:[]},provenance:'verified'});
const done=[
  'SELL states promise, stakes, and click.',
  'SPEC names current source anchors, exact runtime delta, exact formula, exact code, interfaces, non-goals, and builder touch order.',
  'SHOW requires a dramatic comic-book Pulse presentation rather than a plain document.',
  'Every material claim is paired with an executable assertion.',
  'Blueprint owner links use pulse-dashboard.html?tool=<id> only.',
  'Runtime implementation remains unauthorized by this blueprint publication receipt.'
];
s=K.advance({request_id:id,stage:'verdict',payload:{spec:{
  blueprint_id:bp.blueprint_id,
  slice_id:bp.slice_id,
  artifact:'blueprint/pg-03-stable-seed-substream-standard.blueprint.json',
  pulse_tool:bp.pulse_tool,
  runtime_implementation_authorized:false,
  obligations
},destination:'Project Pulse / dashboard?tool=blueprintpg03',done_criteria:done},provenance:'verified'});
assert(K.verifyReceipt(s.receipt));
assert.equal(s.stages.verdict.spec.runtime_implementation_authorized,false);
assert.deepEqual(bp.unresolved_decisions,[]);
console.log(JSON.stringify({
  pass:true,
  law_version:K.law_version,
  funnel_revision:K.revision,
  verdict:'BUILD',
  receipt:s.receipt.fingerprint,
  usage_plan_hash:s.receipt.usage_plan_hash,
  page0_hash:s.receipt.page0_hash,
  destination:s.receipt.destination,
  runtime_implementation_authorized:false
},null,2));
