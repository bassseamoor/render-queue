const assert=require('node:assert/strict');
const blueprint=require('../blueprint/evergreen-learning-loom.blueprint.json');
const K=require('../funnel-kernel.js');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');

K._resetForTests();
const id='learning-loom-v44';
let s=K.open({request_id:id,input:blueprint.page0,source:'learning-loom-build',context:{destination:'Project Pulse'}});
assert.equal(s.stage,'page0');
const plan=K.makeUsagePlan(blueprint.page0,{page:'Project Pulse',source:'learning-loom-build'},{
  reference_plan:{inspect_existing_first:true,sources:blueprint.existingMachinery.map(x=>x.ref)},
  question_plan:{material_only:true,questions:blueprint.materialQuestions},
  decomposition_plan:{parallelize_independent_surfaces:true,preserve_shared_page0:true,reunify_before_blueprint:true,expected_mode:'blueprint-then-build'},
  execution_plan:{builder:'Harness/builders after Funnel authorization',destination:'Project Pulse',reuse_before_new:true},
  verification_plan:{compare_to_page0:true,require_done_criteria:true,verify_requested_path:true,write_failures_back_as_evidence:true,acceptance:blueprint.acceptance}
});
s=K.advance({request_id:id,stage:'usage_plan',payload:{plan},provenance:'system'});
assert.equal(s.stage,'usage_plan');
s=K.advance({request_id:id,stage:'references',payload:{reused:blueprint.existingMachinery.map(x=>({kind:'reference',id:x.ref,title:x.use})),missing:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:JSON.stringify({title:blueprint.title,objective:blueprint.objective,slice:blueprint.implementationSlices[0]})},provenance:'verified'});
s=K.advance({request_id:id,stage:'decisions',payload:{locked:[
  {key:'architecture',value:'EVERGREEN Learning Loom'},
  {key:'retention',value:'spaced retrieval + unfinished useful work'},
  {key:'referral',value:'optional useful artifacts + teach-back'},
  {key:'contribution',value:'explicit consent boundary; private by default'}
],unresolved:[]},provenance:'verified'});
const obligations=K.extractObligations(blueprint.page0).map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:s.stages.page0.raw_hash,obligations,substitutions:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'verdict',payload:{
  spec:{blueprint_ref:'blueprint/evergreen-learning-loom.blueprint.json',slice:'LL-01',obligations},
  destination:'Project Pulse',
  done_criteria:blueprint.acceptance
},provenance:'verified'});
assert(K.verifyReceipt(s.receipt),'v44 receipt must verify');
assert.equal(s.receipt.usage_plan_hash,s.stages.usage_plan.plan_hash);
const packet=K.executionPacket(s.receipt);
assert.equal(packet.destination,'Project Pulse');

// Candidate Ultra runs the same Page 0 with the same operating-plan idea; this is parity evidence, not promotion.
const cid='learning-loom-ultra';
const uc=Law.open({case_id:cid,page0:blueprint.page0,scope:{project:'Project Pulse',slice:'LL-01'}});
assert(uc.usage_plan&&uc.usage_plan_hash);
Law.plan(cid,{
  reference_plan:{inspect_existing_first:true,sources:blueprint.existingMachinery.map(x=>x.ref)},
  question_plan:{material_only:true,questions:blueprint.materialQuestions},
  decomposition_plan:{expected_mode:'blueprint-then-build',parallelize_independent_surfaces:true,preserve_shared_page0:true,reunify_before_blueprint:true}
});
Law.transition(cid,'REFERENCES_BOUND',{references:blueprint.existingMachinery.map(x=>x.ref)},'law');
Law.transition(cid,'QUESTIONS_COMPILED',{questions:blueprint.materialQuestions},'law');
Law.transition(cid,'SOLVING',{proposal:blueprint.title},'law');
Law.transition(cid,'CHILDREN_RUNNING',{children:blueprint.implementationSlices.map(x=>({id:x.id,buildNow:x.buildNow}))},'law');
Law.transition(cid,'CONVERGING',{decision:'LL-01',unresolved:[]},'law');
Law.transition(cid,'BLUEPRINT_READY',{blueprint:'blueprint/evergreen-learning-loom.blueprint.json',hash:Law.hash(blueprint)},'law');
const br=Law.mintReceipt(cid,'BlueprintReceipt',{blueprint:'blueprint/evergreen-learning-loom.blueprint.json'},'law',[],Law.hash({scope:'learning'}));
assert(R.verify(br));
const uobs=Law.extractObligations(blueprint.page0).map(o=>({...o,status:'satisfied'}));
Law.transition(cid,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(cid).page0_hash,obligations:uobs,substitutions:[]},'law');
Law.transition(cid,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse LL-01'},'law');
const er=Law.mintReceipt(cid,'ExecutionReceipt',{destination:'Project Pulse LL-01'},'law',[br.fingerprint],Law.hash({scope:'learning'}));
assert(R.verify(er));
console.log(JSON.stringify({pass:true,v44_receipt:s.receipt.fingerprint,v44_usage_plan:s.receipt.usage_plan_hash,ultra_blueprint_receipt:br.fingerprint,ultra_execution_receipt:er.fingerprint},null,2));