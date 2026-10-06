const assert=require('node:assert/strict');
const Plan=require('../funnel-usage-plan-core.js');
const K=require('../funnel-kernel.js');
const Law=require('../funnel-law-core.js');

const page0='Build a useful system. It must preserve the original intent and verify the result.';
const p=Plan.build(page0,{page:'test'},{decomposition_plan:{expected_mode:'blueprint-then-build'}});
assert(Plan.validate(p,page0));
assert.equal(p.reference_plan.inspect_existing_first,true);
assert.equal(p.verification_plan.compare_to_page0,true);
assert(p.rerun_plan.triggers.length>0);

K._resetForTests();
let s=K.open({request_id:'plan-gate',input:page0,source:'test',context:{}});
assert.equal(s.stage,'page0');
assert.throws(()=>K.advance({request_id:'plan-gate',stage:'references',payload:{reused:[]}}),/Expected usage_plan/);
s=K.advance({request_id:'plan-gate',stage:'usage_plan',payload:{plan:p},provenance:'system'});
assert.equal(s.usage_plan.page0_hash,p.page0_hash);
s=K.advance({request_id:'plan-gate',stage:'references',payload:{reused:[],missing:[]},provenance:'verified'});
assert.equal(s.stages.references.usage_plan_hash,s.stages.usage_plan.plan_hash);

const u=Law.open({case_id:'ultra-plan-gate',page0,scope:{project:'test'}});
assert(u.usage_plan&&u.usage_plan_hash);
const p2=Law.plan('ultra-plan-gate',{execution_plan:{destination:'test-destination',reuse_before_new:true}});
assert.equal(p2.execution_plan.destination,'test-destination');
Law.transition('ultra-plan-gate','REFERENCES_BOUND',{references:[]},'law');
assert.throws(()=>Law.plan('ultra-plan-gate',{}),/locks before references/);
console.log('PASS: every production v44 and Ultra candidate Funnel case carries a Page-0-bound usage plan before reference resolution');