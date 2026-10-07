const fs=require('node:fs'),assert=require('node:assert/strict');
const bp=require('../blueprint/pg-03-stable-seed-substream-standard.blueprint.json');
const seal=require('../blueprint/pg-03-stable-seed-substream-standard.seal.json');
const manifest=require('../pulse-manifest.json');

assert.equal(bp.blueprint_id,'PG-03-REV2');
assert.equal(bp.blueprint_status,'sealed-ready-for-builder-release');
assert.equal(bp.sealed_verdict.verdict,'BUILD');
assert.equal(bp.sealed_verdict.receipt,'7ef1649f30935f91');
assert.equal(bp.sealed_verdict.runtime_implementation_authorized,false);
assert.equal(seal.receipt_fingerprint,'7ef1649f30935f91');
assert.equal(seal.law_version,'v44-sealed');
assert.equal(seal.runtime_implementation_authorized,false);
assert.deepEqual(bp.unresolved_decisions,[]);
assert.equal(bp.build_steps.length,4);
for(const step of bp.build_steps){
  assert(step.file&&step.operation&&step.done_state,'every plate needs file/operation/done state');
}
for(const c of bp.claims)assert(c.claim&&c.assertion,'every material claim needs an executable assertion');
assert(bp.value_rationale.length>=6,'exact values require rationale');

const runtime=fs.readFileSync('procedural-recipe-core.js','utf8');
assert(runtime.includes("subseed_scheme:String(r.subseed_scheme||'semantic-key-v1')"),'PG-03 must attach to the existing PG-02 scheme datum');
const dashboard=fs.readFileSync('pulse-dashboard.html','utf8');
assert(dashboard.includes('function streamFrom(seedStr) { return mulberry32(hashSeed(seedStr)); }'),'blueprint must reuse current RNG');
const coreCode=bp.build_steps.find(x=>x.step===1).exact_code;
for(const forbidden of ['function mulberry32','function hashSeed','Date.now','Math.random'])assert(!coreCode.includes(forbidden),'PG-03 framing core must not duplicate/escape existing RNG: '+forbidden);
assert(coreCode.includes("PREFIX='moor:subseed:v1:'"));
assert(coreCode.includes('JSON.stringify([root,keys])'));

const html=fs.readFileSync('blueprint-pg03-seed-tree.html','utf8');
for(const marker of ['SEED TREE','SELL // WHY THIS EXISTS','SPEC // EXECUTE TO THE NAIL','VERIFY // EVERY CLAIM HAS TEETH','SEALED v44 · BUILD · 7ef1649f30935f91'])assert(html.includes(marker),'missing visual blueprint marker '+marker);
for(const m of html.matchAll(/href="([^"]+)"/g))assert(m[1].startsWith('#')||m[1].startsWith('pulse-dashboard.html?tool='),'owner links must stay inside Pulse: '+m[1]);

const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('"id":"blueprintpg03"'),'Pulse component registry must expose PG-03');
assert(manifest.items.blueprintpg03,'Pulse manifest must expose PG-03');
assert.equal(manifest.items.blueprintpg03.page,'pulse-dashboard.html?tool=blueprintpg03');
const build=fs.readFileSync('build_pulse_v2.py','utf8');
assert(build.includes("'blueprintpg03':"),'Pulse rebuild must preserve PG-03');

console.log('PASS: PG-03 is a sealed v44 Blueprint SOP artifact with exact delta/code/values/assertions, dramatic Seed Tree presentation, existing-RNG reuse, and Pulse-only owner navigation.');
