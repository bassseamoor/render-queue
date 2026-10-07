const assert=require('node:assert/strict');
const Usage=require('../funnel-usage-plan-core.js');
const K=require('../funnel-kernel.js');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');

const learning='Build a free learning system in Pulse that teaches deep MOOR concepts across fields, preserves private user input by default, requires explicit consent before contributed input can improve future learning, and verifies retention through recall and applied work.';
const p=Usage.build(learning,{page:'pulse-dashboard.html',source:'test'});
assert.equal(p.schema,'moor.funnel-usage-plan');
assert.equal(p.version,2);
assert.equal(Usage.validate(p,learning),true);
assert(p.request_analysis.surfaces.includes('learning-and-content'));
assert(p.request_analysis.surfaces.includes('privacy-and-consent'));
assert(p.request_analysis.material_targets.includes('privacy-and-data-boundary'));
assert(p.reference_plan.queries.length>0);
assert(p.operating_sequence.some(x=>x.id==='reuse-scan'));
assert(p.operating_sequence.some(x=>x.id==='page0-replay'));
assert(p.verification_plan.checks.includes('no unapproved substitution'));
assert.throws(()=>Usage.validate({...p,page0_hash:'wrong'},learning),/immutable Page 0/);
assert.throws(()=>Usage.validate({...p,reference_plan:{...p.reference_plan,queries:[]}},learning),/reference queries/);

K._resetForTests();
let s=K.open({request_id:'usage-plan-test',input:learning,source:'test',context:{page:'pulse-dashboard.html'}});
assert.equal(s.stage,'page0');
assert.throws(()=>K.advance({request_id:'usage-plan-test',stage:'references',payload:{reused:[],missing:[]}}),/Expected usage_plan/);
s=K.advance({request_id:'usage-plan-test',stage:'usage_plan',payload:{plan:p},provenance:'system'});
assert.equal(s.stage,'usage_plan');
assert.equal(s.stages.usage_plan.plan_hash,Usage.hash(p));
s=K.advance({request_id:'usage-plan-test',stage:'references',payload:{reused:[],missing:[]},provenance:'learned'});
s=K.advance({request_id:'usage-plan-test',stage:'distill',payload:{spec_draft:'learning system'},provenance:'inferred'});
s=K.advance({request_id:'usage-plan-test',stage:'decisions',payload:{locked:[{key:'privacy',value:'local-private default'}],unresolved:[]},provenance:'explicit'});
const obs=K.extractObligations(learning);
s=K.advance({request_id:'usage-plan-test',stage:'replay',payload:{page0_verified:true,page0_hash:s.stages.page0.raw_hash,obligations:obs.map(o=>({...o,status:'satisfied'})),substitutions:[]},provenance:'verified'});
s=K.advance({request_id:'usage-plan-test',stage:'verdict',payload:{spec:{obligations:obs.map(o=>({...o,status:'satisfied'})),system:'learning'},destination:'app-compiler-harness',done_criteria:['usage plan remains bound']},provenance:'verified'});
assert.equal(K.verifyReceipt(s.receipt),true);
assert.equal(s.receipt.usage_plan_hash,s.stages.usage_plan.plan_hash);
assert.equal(s.receipt.funnel_revision,'usage-plan-1');

const u=Law.open({case_id:'usage-ultra',page0:learning,scope:{project:'Pulse'}});
const refined=Law.plan('usage-ultra',{decomposition_plan:{surfaces:['learning','privacy','distribution','verification'],parallelize_independent_surfaces:true}});
assert(refined.decomposition_plan.surfaces.includes('privacy'));
Law.transition('usage-ultra','REFERENCES_BOUND',{references:[]},'law');
Law.transition('usage-ultra','QUESTIONS_COMPILED',{questions:['What is private by default?']},'law');
Law.transition('usage-ultra','SOLVING',{proposal:'local-private default'},'law');
Law.transition('usage-ultra','CHILDREN_RUNNING',{children:[]},'law');
Law.transition('usage-ultra','CONVERGING',{decision:'learning loom',unresolved:[]},'law');
Law.transition('usage-ultra','BLUEPRINT_READY',{blueprint:'learning',hash:Law.hash({learning:true})},'law');
const br=Law.mintReceipt('usage-ultra','BlueprintReceipt',{blueprint:'learning'},'law',[],Law.hash({}));
assert(R.verify(br));
assert.equal(br.meta.usage_plan_hash,Law.get('usage-ultra').usage_plan_hash);
assert.equal(Law.verifyReceipt(br),true);
const tampered={...br,meta:{...br.meta,usage_plan_hash:'wrong'}};
assert.equal(Law.verifyReceipt(tampered),false);

// Negation-aware build classification (intake repair 2026-10-07, funnel receipt d4cb285546a0f10d).
const negPlan=Usage.build('Do not implement anything. Do not build a new system.',{page:'test',source:'test'});
assert.equal(negPlan.execution_plan.build_required,false,'negated build verbs must not set build_required');
assert(negPlan.request_analysis.mode!=='blueprint-build'&&negPlan.request_analysis.mode!=='research-blueprint-build');
const posPlan=Usage.build('Implement the dashboard.',{page:'test',source:'test'});
assert.equal(posPlan.execution_plan.build_required,true);
const mixedPlan=Usage.build('Build the thing, do not deploy it.',{page:'test',source:'test'});
assert.equal(mixedPlan.execution_plan.build_required,true,'unnegated build verb in the same input still counts');

console.log('PASS: v44 and Ultra derive, lock, follow and receipt-bind request-specific Funnel usage plans before resolution; negation-aware build classification.');