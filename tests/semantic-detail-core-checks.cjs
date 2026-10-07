const assert=require('node:assert/strict');
const SD=require('../semantic-detail-core.js');

const TEXT='A serene courtyard garden at dusk. Weathered oak benches sit beside a still reflecting pool. Warm lantern light glows against limestone walls. The space feels intimate and luxurious.';

// Extraction finds the semantic facts
const sem=SD.extractSemantics(TEXT);
assert(sem.qualities.some(q=>q.text==='serene'),'should extract quality "serene"');
assert(sem.qualities.some(q=>q.text==='luxurious'),'should extract quality "luxurious"');
assert(sem.materials.some(m=>m.text==='oak'),'should extract material "oak"');
assert(sem.materials.some(m=>m.text==='limestone'),'should extract material "limestone"');
assert(!sem.materials.some(m=>m.text==='stone'),'"stone" must not match inside "limestone"');
assert(sem.light.some(l=>l.text==='lantern'),'should extract light "lantern"');

// Expansion produces all five provenance levels
const spec=SD.expandToSpecs(sem,{seed:'v1',domain:'courtyard'});
const provs=new Set(spec.specs.map(s=>s.provenance));
['explicit','implied','inferred','creative','unresolved'].forEach(p=>assert(provs.has(p),'provenance level missing: '+p));
assert(spec.specs.length>=10,'should produce substantial specs, got '+spec.specs.length);

// Every spec item is provenance-tagged (never silently converted)
spec.specs.forEach(s=>{
  assert(['explicit','implied','inferred','creative','unresolved'].includes(s.provenance),'item missing valid provenance: '+JSON.stringify(s));
  assert(s.dimension&&s.statement,'item missing dimension/statement');
});

// Deterministic: same input + seed -> same output
const spec2=SD.expandToSpecs(SD.extractSemantics(TEXT),{seed:'v1',domain:'courtyard'});
assert.deepEqual(spec.specs,spec2.specs,'same seed must be deterministic');

// Anti-sameness: different seed varies the creative proposals
const spec3=SD.expandToSpecs(SD.extractSemantics(TEXT),{seed:'different',domain:'courtyard'});
const c1=spec.specs.filter(s=>s.provenance==='creative').map(s=>s.statement).join('|');
const c3=spec3.specs.filter(s=>s.provenance==='creative').map(s=>s.statement).join('|');
assert(c1!==c3,'different seeds should vary creative proposals');

// Projections: human-legible and builder-actionable
const human=SD.projectForHuman(spec,'Courtyard Garden');
assert(human.includes('EXPLICIT')&&human.includes('UNRESOLVED'),'human projection must show provenance sections');
assert(human.length>500,'human projection should be substantial');
const builder=SD.projectForBuilder(spec);
assert(builder.includes('[ ]'),'builder projection must be a checklist');
assert(builder.includes('UNRESOLVED'),'builder projection must surface unresolved first');

// Graceful degradation
assert.deepEqual(SD.extractSemantics('').qualities,[]);
const emptySpec=SD.expandToSpecs(SD.extractSemantics(''),{seed:'x'});
assert(emptySpec.specs.some(s=>s.provenance==='unresolved'),'empty input should yield unresolved items, not crash');

console.log('PASS: semantic detail core — extraction, 5-level provenance, determinism, seed variation, projections, graceful degradation');
