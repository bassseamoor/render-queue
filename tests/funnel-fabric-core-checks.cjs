const assert=require('node:assert/strict');
const K=require('../funnel-kernel.js');
const Fabric=require('../funnel-fabric-core.js');

K._resetForTests();

const messy='I want a funnel for planning my week. It is kind of messy — I never know what matters most. Do not turn it into a rigid schedule. It must keep the big rocks first.';

const def=Fabric.compile(messy);
assert.equal(def.schema,'moor.funnel-fabric-definition');
assert.equal(def.version,1);
assert.equal(def.page0,messy);
assert.equal(def.page0_hash,K.hash(messy));
assert(def.usage_plan&&def.usage_plan.schema==='moor.funnel-usage-plan');
assert(Array.isArray(def.obligations)&&def.obligations.length>0);
assert(def.obligations.every(o=>o.id&&o.source&&(o.polarity==='positive'||o.polarity==='negative')));
assert(Array.isArray(def.stages)&&def.stages.length===5);
assert.deepEqual(def.stages.map(s=>s.stage),['references','distill','decisions','replay','verdict']);
def.stages.forEach(s=>{
  assert(Array.isArray(s.questions)&&s.questions.length>0,'stage '+s.stage+' needs questions');
  s.questions.forEach(q=>assert(typeof q==='string'&&q.length>10));
});
assert(Array.isArray(def.done_criteria)&&def.done_criteria.length===def.obligations.length);
assert.equal(def.generator,'funnel-fabric-core v1');

const neg=def.obligations.find(o=>/rigid schedule/.test(o.source));
assert(neg&&neg.polarity==='negative','negated constraint must carry negative polarity');
assert(def.done_criteria.some(c=>/never violated/.test(c)),'negative obligations become never-violated done criteria');

const res=Fabric.execute(def,K);
assert(res.receipt,'execute must mint a receipt');
assert.equal(res.valid,true);
assert.equal(K.verifyReceipt(res.receipt),true,'receipt must verify against the real kernel');
assert.equal(res.receipt.law_version,'v44-sealed');

const sess=K.inspect(res.receipt.request_id);
assert.equal(sess.stage,'verdict');
const replayObs=sess.stages.replay.obligations;
assert(replayObs.length>0&&replayObs.every(o=>o.status==='satisfied'),'replay obligations must all be satisfied');
assert.equal(sess.stages.page0.raw_hash,K.hash(messy),'replay ran against the generated Page 0');

const again=Fabric.execute(def,K);
assert.equal(again.receipt.fingerprint,res.receipt.fingerprint,'execute is idempotent for the same definition');

assert.throws(()=>Fabric.compile('   '),/description/);
assert.throws(()=>Fabric.compile(''),/description/);
assert.throws(()=>Fabric.execute({schema:'nope'},K),/definition/);

console.log('PASS: Funnel Fabric compiles messy descriptions into funnel definitions and executes them on the real v44 kernel to valid receipts.');
