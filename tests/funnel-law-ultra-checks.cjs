const assert=require('node:assert/strict');
const R=require('../funnel-receipt-core.js');
const Cap=require('../funnel-capability-core.js');
const B=require('../funnel-budget-core.js');
const C=require('../funnel-consensus-core.js');
const P=require('../funnel-package-registry.js');
const Law=require('../funnel-law-core.js');
const Case=require('../funnel-case-runtime.js');
const Society=require('../funnel-society-core.js');
const Promo=require('../funnel-promotion-core.js');
const Gov=require('../funnel-resource-governor.js');
const Solver=require('../sebastian-solver-core.js');

// Typed receipt integrity.
const rr=R.mint('BlueprintReceipt',{law_version:'ultra-v1-candidate',case_id:'c1',page0_hash:'p',scope_hash:'s',payload_hash:'x',ledger_head:'l',issuer_role:'law'});
assert(R.verify(rr));const bad={...rr,case_id:'evil'};assert(!R.verify(bad));

// Least authority.
const grant=Cap.grant({subject:'Sebastian-1',case_id:'c1',capabilities:['read:page0','submit:ballot','spawn:child'],scope:{question_ids:['q1']}});
assert(Cap.allows(grant,'submit:ballot',{case_id:'c1',question_id:'q1'}));
assert(!Cap.allows(grant,'promote:law',{case_id:'c1'}));
assert(!Cap.allows(grant,'submit:ballot',{case_id:'c2',question_id:'q1'}));

// Conserved budgets.
let parent=B.envelope({case_id:'root',limit:{tokens:10000,worker_calls:10,storage_bytes:100000}});
const alloc=B.allocate(parent,'child',{tokens:3000,worker_calls:4,storage_bytes:20000});parent=alloc.parent;
assert.equal(B.remaining(parent).tokens,7000);assert.throws(()=>B.allocate(parent,'too-big',{tokens:8000}),/exceeds/);
const used=B.consume(alloc.child,{tokens:500,worker_calls:1});assert(used.ok);assert.equal(B.remaining(used.budget).tokens,2500);

// Package versions are immutable and scope-compatible.
const pkg=P.register({package_id:'fidelity',version:'1',purpose:'preserve explicit ask',internal_graph:{nodes:[{id:'a'}],edges:[]},compatibility:{law_versions:['ultra-v1-candidate']},tests:['keeps Page 0']});
assert(P.compatible(pkg,{law_version:'ultra-v1-candidate'}));assert(!P.compatible(pkg,{law_version:'other'}));
assert.throws(()=>P.register({...pkg,purpose:'changed same version'}),/immutable/);

// Law cannot skip stages and becomes unusable after staleness.
const root=Law.open({case_id:'root-case',page0:'Build a recursive Funnel law.',scope:{project:'moor'}});
assert.throws(()=>Law.transition('root-case','SOLVING',{},'worker'),/illegal transition/);
Law.transition('root-case','REFERENCES_BOUND',{references:[]},'law');
Law.transition('root-case','QUESTIONS_COMPILED',{questions:['How should recursion scale?']},'law');
const rootBudget=B.envelope({case_id:'root-case',limit:{tokens:50000,worker_calls:50,storage_bytes:1000000}});
const child=Case.spawn('root-case',{case_id:'child-case',question_id:'q1',question:'How should recursion scale?',parent_budget:rootBudget,budget_limit:{tokens:5000,worker_calls:8,storage_bytes:50000},capabilities:['read:page0','submit:ballot','consume:budget']});
assert.equal(child.child.parent_case_id,'root-case');assert.equal(child.child_budget.limit.tokens,5000);

// Four independent solver answers intentionally manufacture solver certainty.
const tasks=Solver.spawn({id:'q1',prompt:'What architecture best preserves security while scaling?'},4);
const ballots=tasks.map((t,i)=>Solver.ballot({task_id:t.task_id,question_id:'q1',worker_id:t.worker_id,independence_key:t.isolation_key,proposition_key:'secure-elastic',proposal:'Secure core / elastic society',confidence:.85+i*.02}));
const cv=Society.converge(ballots,{owner_confidence:.25,min_votes:3,threshold:.7});
assert.equal(cv.status,'resolved');assert(cv.solver_confidence>.7);assert.equal(cv.owner_confidence,.25);

// Branch forecast responds to scale instead of a hard-coded topology.
const small=Society.forecastBranching({max_depth:2,branch_factor:2,workers:4});
const big=Society.forecastBranching({max_depth:5,branch_factor:4,workers:16});
assert(big.max_cases>small.max_cases&&big.max_solver_calls>small.max_solver_calls);
const forecast=Gov.forecast({questions:3,workers:16,max_depth:4,branch_factor:4,runs:10,storage_budget_bytes:1e6});
assert(['green','yellow','red'].includes(forecast.status));assert(forecast.storage_bytes>0);

// Native Ultra Page 0 fidelity, receipt order, and staleness.
assert.throws(()=>Law.open({case_id:'root-case',page0:'Different request.',scope:{project:'moor'}}),/immutable/);
Law.transition('root-case','SOLVING',{proposal:'Secure core / elastic society'},'law');
assert.throws(()=>Law.mintReceipt('root-case','BlueprintReceipt',{blueprint:'too-early'},'law',[],Law.hash(rootBudget)),/cannot be minted/);
Law.transition('root-case','CHILDREN_RUNNING',{children:[{id:'child-case'}]},'law');
Law.transition('root-case','CONVERGING',{decision:'secure-elastic',unresolved:[]},'law');
Law.transition('root-case','BLUEPRINT_READY',{blueprint:'candidate',hash:Law.hash({blueprint:'candidate'})},'law');
const br=Law.mintReceipt('root-case','BlueprintReceipt',{blueprint:'candidate'},'law',[],Law.hash(rootBudget));
assert(R.verify(br));assert(Law.verifyReceipt(br));
const obs=Law.extractObligations('Build a recursive Funnel law.');
assert.throws(()=>Law.transition('root-case','PAGE0_REPLAYED',{page0_verified:true,page0_hash:'wrong',obligations:obs.map(o=>({...o,status:'satisfied'})),substitutions:[]},'law'),/immutable Page 0 hash/);
Law.transition('root-case','PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get('root-case').page0_hash,obligations:obs.map(o=>({...o,status:'satisfied'})),substitutions:[]},'law');
assert.throws(()=>Law.mintReceipt('root-case','ExecutionReceipt',{},'law',[br.fingerprint],Law.hash(rootBudget)),/cannot be minted/);
Law.transition('root-case','EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse'},'law');
const er=Law.mintReceipt('root-case','ExecutionReceipt',{destination:'Project Pulse'},'law',[br.fingerprint],Law.hash(rootBudget));
assert(R.verify(er));assert(Law.verifyReceipt(er));
Law.stale('root-case','Sebastian correction');assert.equal(Law.verifyReceipt(er),false);assert.throws(()=>Law.mintReceipt('root-case','ExecutionReceipt',{},'law'),/invalid case/);

// Promotion requires regression + explicit approval + PromotionReceipt.
Promo.candidate({law_version:'ultra-v1',blueprint_hash:'bh',prior_version:'v44-sealed'});
Promo.regression('ultra-v1',{pass:true,tests:42});
assert.throws(()=>Promo.promote('ultra-v1',rr),/owner approval|required|PromotionReceipt/);
Promo.approve('ultra-v1');
const pr=R.mint('PromotionReceipt',{law_version:'ultra-v1',case_id:'promote',page0_hash:'p',scope_hash:'s',payload_hash:'bh',ledger_head:'l',issuer_role:'owner'});
assert.equal(Promo.promote('ultra-v1',pr).state,'promoted');

console.log('PASS: Ultra Funnel Law enforces native immutable Page 0 replay, typed receipt ordering, least authority, conserved budgets, recursive cases, synthetic solver confidence, scale forecasts, staleness, package immutability, and gated promotion');