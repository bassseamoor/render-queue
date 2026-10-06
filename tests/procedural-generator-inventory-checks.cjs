const fs=require('node:fs'),assert=require('node:assert/strict');
const inv=require('../procedural-generator-inventory.json');
const manifest=require('../pulse-manifest.json');
const wonder=require('../wonder-generators.json');

assert.equal(inv.schema,'moor.procedural-generator-inventory');
assert(inv.generators.length>=12,'PG-01 must inventory the real generator estate');
const ids=new Set();
for(const g of inv.generators){
  assert(g.generator_id&&!ids.has(g.generator_id),'stable unique generator id required');ids.add(g.generator_id);
  for(const k of ['version','provides','input_types','output_types','determinism_level','source','verification_refs','status'])assert(g[k]!=null,g.generator_id+' missing '+k);
  assert(['D0','D1','D2','D3'].includes(g.determinism_level),g.generator_id+' invalid determinism level');
  assert(Array.isArray(g.provides)&&g.provides.length,g.generator_id+' must declare provided capability');
  assert(fs.existsSync(g.source),g.generator_id+' source missing: '+g.source);
}
for(const id of ['terrain-core','planet-workshop','living-garden','effects-studio','struct','road-atlas','wall-mirror','ambience'])assert(ids.has(id),'missing known generator '+id);
assert(manifest.items['terrain-core']&&manifest.items['planet-workshop']&&manifest.items['living-garden'],'inventory must be grounded in current Pulse manifest');
assert(Array.isArray(wonder.generators)&&wonder.generators.length>0,'Wonder native generator registry must exist');
assert.equal(inv.generators.find(x=>x.generator_id==='seed-rng').determinism_level,'D3');
for(const id of ['terrain-core','planet-workshop','living-garden'])assert.notEqual(inv.generators.find(x=>x.generator_id===id).determinism_level,'D3','do not overclaim canonical replay without reconstruction proof');
console.log('PASS: PG-01 inventories reusable procedural generators with stable identity, capability contracts, source/evidence refs and conservative determinism claims.');
