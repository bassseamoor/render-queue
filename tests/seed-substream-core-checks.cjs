const fs=require('node:fs'),assert=require('node:assert/strict');
const Seed=require('../seed-substream-core.js');
const Recipe=require('../procedural-recipe-core.js');
const schema=require('../procedural-recipe-schema.json');
const inv=require('../procedural-generator-inventory.json');

assert.equal(Seed.scheme,'semantic-key-v1');
assert.equal(Seed.prefix,'moor:subseed:v1:');
const a=Seed.seed('alpha',['terrain','ridge']);
assert.equal(a,'moor:subseed:v1:["alpha",["terrain","ridge"]]');
assert.equal(a,Seed.seed('alpha',['terrain','ridge']));
assert.notEqual(Seed.seed('alpha',['ab','c']),Seed.seed('alpha',['a','bc']));
assert.notEqual(Seed.seed('alpha',['terrain']),Seed.seed('beta',['terrain']));
assert.equal(Seed.seed('α/🌱',['flora','oak/crown']), 'moor:subseed:v1:["α/🌱",["flora","oak/crown"]]');

const before=Seed.seed('world-7',['terrain','primary']);
Seed.seed('world-7',['vegetation','new-sibling']);
const after=Seed.seed('world-7',['terrain','primary']);
assert.equal(before,after,'adding an unrelated sibling must not perturb an existing semantic branch');

assert.throws(()=>Seed.seed('', ['terrain']),/root seed required/);
assert.throws(()=>Seed.seed('root', []),/key parts/);
assert.throws(()=>Seed.seed('root', ['terrain','']),/key parts/);

function hashSeed(s){let h=2166136261>>>0;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296}}
function streamFrom(seedStr){return mulberry32(hashSeed(seedStr))}
const s1=Seed.stream('alpha',['city','block','07'],streamFrom);
const s2=Seed.stream('alpha',['city','block','07'],streamFrom);
for(let i=0;i<16;i++)assert.equal(s1(),s2(),'derived seed must feed the current RNG deterministically');

const recipe=Recipe.normalizeRecipe({
  recipe_id:'recipe:pg03-test',version:1,requested_capability:'seeded-planet',
  generator_binding:'planet-workshop',generator_version:'3.0.0',root_seed:'alpha',
  subseed_scheme:'semantic-key-v1',parameters:{},semantic_anchors:[],upstream_recipe_refs:[],
  manual_overrides:{},reconstruction_tolerance:{mode:'semantic'},expected_invariants:[],provenance:{source:'pg03-test'}
});
let result=Recipe.validateRecipe(recipe,inv);
assert.equal(result.ok,true,result.errors.join('; '));
result=Recipe.validateRecipe({...recipe,subseed_scheme:'unknown-v9',content_hash:undefined},inv);
assert.equal(result.ok,false);
assert(result.errors.includes('unsupported subseed_scheme unknown-v9'));
assert.deepEqual(Recipe.subseed_schemes,['semantic-key-v1']);

assert(schema.contracts.SeedSubstreamScheme);
assert.equal(schema.contracts.SeedSubstreamScheme.id,'semantic-key-v1');
assert(schema.contracts.SeedSubstreamScheme.formula.includes('JSON.stringify'));
assert(schema.contracts.SeedSubstreamScheme.invariants.some(x=>x.includes('sequence index')));
assert(schema.contracts.SeedSubstreamScheme.invariants.some(x=>x.includes('prior draw count')));

const src=fs.readFileSync('seed-substream-core.js','utf8');
for(const forbidden of ['Date.now','Math.random','function hashSeed','function mulberry32'])assert(!src.includes(forbidden),'substream core must not own '+forbidden);

console.log('PASS: PG-03 semantic-key-v1 gives every procedural branch an unambiguous stable address, preserves sibling locality, reuses the existing RNG, and makes unknown recipe schemes fail closed.');
