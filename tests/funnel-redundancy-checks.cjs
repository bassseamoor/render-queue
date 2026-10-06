const assert=require('node:assert/strict');
const fs=require('node:fs');
const R=require('../funnel-redundancy.js');
const K=require('../funnel-kernel.js');

const raw="Oh my God, you didn't even get a second to think about the last request. But I just had an idea. What if we separate it? Redundancy. We do redundant funnels, redundant isolated funnels. But because they're separate and they're not using an LLM, they don't need an LLM. They all distill the same question without using more tokens.";
const a=R.analyze(raw),b=R.analyze(raw);

assert.deepEqual(R.lenses,['lexical-v1','structural-v1','preservation-v1']);
assert.equal(a.lenses.length,3);
assert.equal(a.fingerprint,b.fingerprint,'redundant distillation must be deterministic');
assert.deepEqual(a.union,b.union);
assert(a.union.length>=4,'redundant distillation should preserve separate hard ideas');
assert(a.consensus.length>=3,'multiple isolated lenses should independently recover core intent');
assert(a.union.some(x=>/redundant isolated funnels/i.test(x.source)));
assert(a.union.some(x=>/same question without using more tokens/i.test(x.source)));
assert(a.union.some(x=>/not using an LLM/i.test(x.source)));
assert(a.union.every(x=>raw.includes(x.source)),'every obligation must be source-backed by exact Page 0 text');

for(const file of ['funnel-lens-lexical.js','funnel-lens-structural.js','funnel-lens-preservation.js','funnel-redundancy.js']){
  const src=fs.readFileSync(file,'utf8');
  assert(!/\bfetch\s*\(/.test(src),file+' must not use network fetch');
  assert(!/XMLHttpRequest|WebSocket|MOOR\.request|openai|anthropic/i.test(src),file+' must remain token-free and model-free');
}

K._resetForTests();
let s=K.open({request_id:'redundancy-test',input:raw,source:'test'});
assert.equal(s.stages.page0.redundancy.fingerprint,a.fingerprint);
const obs=K.extractObligations(raw);
assert.deepEqual(obs.map(x=>x.id),a.union.map(x=>x.id));
assert(obs.every(x=>Array.isArray(x.lenses)&&x.lenses.length>=1));

console.log('PASS: three isolated deterministic funnels consume identical Page 0, use no network/model path, preserve the obligation union, and reproduce one redundancy fingerprint');
