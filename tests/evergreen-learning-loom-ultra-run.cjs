const assert=require('node:assert/strict');
const fs=require('node:fs');
const K=require('../funnel-kernel.js');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const blueprint=JSON.parse(fs.readFileSync('blueprint/evergreen-learning-loom.blueprint.json','utf8'));

const page0=blueprint.page0;

// Production v44: Page 0 -> request-specific Usage Plan -> References -> resolution -> receipt.
K._resetForTests();
let s=K.open({request_id:'learning-loom-v44',input:page0,source:'blueprint-test',context:{page:'Project Pulse',destination:'EVERGREEN Learning Loom'}});
const plan=K.makeUsagePlan(page0,{page:'Project Pulse',source:'blueprint-test'},{
  decomposition_plan:{parallelize_independent_surfaces:true,surfaces:['curriculum','pedagogy','privacy-and-consent','growth-and-sharing','pulse-integration','verification'],preserve_shared_page0:true,reunify_before_blueprint:true,expected_mode:'blueprint-then-build'},
  execution_plan:{build_required:true,builder:'Harness/builders after Funnel authorization',destination:'Project Pulse / evergreen-learning-loom',reuse_before_new:true,steps:['reuse LECTURE/EVERGREEN/Pulse Spine/Refinery','build LL-01 missing delta','verify focused learning contract','publish through Pulse']},
  verification_plan:{compare_to_page0:true,require_done_criteria:true,verify_requested_path:true,checks:blueprint.acceptance.slice(),write_failures_back_as_evidence:true}
});
s=K.advance({request_id:s.request_id,stage:'usage_plan',payload:{plan},provenance:'system'});
assert.equal(s.stage,'usage_plan');
s=K.advance({request_id:s.request_id,stage:'references',payload:{reused:blueprint.existingMachinery.map(x=>x.ref),missing:[]},provenance:'verified'});
s=K.advance({request_id:s.request_id,stage:'distill',payload:{spec_draft:JSON.stringify({blueprint:blueprint.title,slice:'LL-01',objective:blueprint.objective})},provenance:'verified'});
s=K.advance({request_id:s.request_id,stage:'decisions',payload:{locked:[
  {key:'growth',value:'value/mastery/shareable-output; no dark patterns'},
  {key:'privacy',value:'local-private default; explicit contribution only'},
  {key:'distribution',value:'Project Pulse first'},
  {key:'slice',value:'LL-01'}
],unresolved:[]},provenance:'explicit'});
const obligations=K.extractObligations(page0);
s=K.advance({request_id:s.request_id,stage:'replay',payload:{page0_verified:true,page0_hash:s.stages.page0.raw_hash,obligations:obligations.map(o=>({...o,status:'satisfied'})),substitutions:[]},provenance:'verified'});
s=K.advance({request_id:s.request_id,stage:'verdict',payload:{spec:{blueprint_id:'evergreen-learning-loom',slice:'LL-01',obligations:obligations.map(o=>({...o,status:'satisfied'})),usage_plan_hash:s.stages.usage_plan.plan_hash},destination:'Project Pulse / evergreen-learning-loom',done_criteria:blueprint.acceptance},provenance:'verified'});
assert(K.verifyReceipt(s.receipt));
assert.equal(s.receipt.usage_plan_hash,s.stages.usage_plan.plan_hash);
assert.equal(s.receipt.funnel_revision,'usage-plan-1');

// Ultra candidate independently walks the same blueprint and binds its receipt to its usage plan.
const id='learning-loom-ultra';
Law.open({case_id:id,page0,scope:{project:'Project Pulse',slice:'LL-01'}});
const up=Law.plan(id,{decomposition_plan:{parallelize_independent_surfaces:true,surfaces:['curriculum','pedagogy','privacy-and-consent','growth-and-sharing','pulse-integration','verification'],preserve_shared_page0:true,reunify_before_blueprint:true,expected_mode:'blueprint-then-build'}});
assert(up.decomposition_plan.surfaces.includes('privacy-and-consent'));
Law.transition(id,'REFERENCES_BOUND',{references:blueprint.existingMachinery.map(x=>x.ref)},'law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:blueprint.materialQuestions},'law');
Law.transition(id,'SOLVING',{proposal:'EVERGREEN Learning Loom LL-01',laws:blueprint.laws},'law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'curriculum',scope:'concept registry + cross-field bridges'},
  {id:'pedagogy',scope:'retrieval + transfer + applied work'},
  {id:'consent',scope:'private/local default + explicit contribution'},
  {id:'pulse',scope:'component + Spine output'}
]},'law');
Law.transition(id,'CONVERGING',{decision:'Learning Loom',unresolved:[]},'law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/evergreen-learning-loom.blueprint.json',hash:Law.hash(blueprint)},'law');
const br=Law.mintReceipt(id,'BlueprintReceipt',{blueprint:'blueprint/evergreen-learning-loom.blueprint.json'},'law',[],Law.hash({slice:'LL-01'}));
assert(R.verify(br)&&Law.verifyReceipt(br));
assert.equal(br.meta.usage_plan_hash,Law.get(id).usage_plan_hash);
const uobs=Law.extractObligations(page0);
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(id).page0_hash,obligations:uobs.map(o=>({...o,status:'satisfied'})),substitutions:[]},'law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse / evergreen-learning-loom'},'law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse / evergreen-learning-loom',slice:'LL-01'},'law',[br.fingerprint],Law.hash({slice:'LL-01'}));
assert(R.verify(er)&&Law.verifyReceipt(er));
assert.equal(er.meta.usage_plan_hash,Law.get(id).usage_plan_hash);

console.log(JSON.stringify({pass:true,v44_receipt:s.receipt.fingerprint,v44_usage_plan:s.receipt.usage_plan_hash,ultra_blueprint_receipt:br.fingerprint,ultra_execution_receipt:er.fingerprint,ultra_usage_plan:er.meta.usage_plan_hash},null,2));