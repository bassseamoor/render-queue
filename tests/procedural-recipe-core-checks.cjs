const assert=require('node:assert/strict');
const Core=require('../procedural-recipe-core.js');
const schema=require('../procedural-recipe-schema.json');
const inv=require('../procedural-generator-inventory.json');

assert.equal(schema.schema,'moor.procedural-contracts');
for(const name of ['ProceduralRecipe','SemanticAnchor','ReconstructionReceipt'])assert(schema.contracts[name],'missing contract '+name);

const recipe=Core.normalizeRecipe({
  recipe_id:'recipe:test-planet',
  version:1,
  requested_capability:'seeded-planet',
  generator_binding:'planet-workshop',
  generator_version:'3.0.0',
  root_seed:'alpha-42',
  subseed_scheme:'semantic-key-v1',
  parameters:{roughness:.7},
  semantic_anchors:[
    {anchor_id:'world',frame:'world',parent_anchor:null,role:'planet-root',transform_or_constraint:{position:[0,0,0]},stable_key:'planet-root'},
    {anchor_id:'landing',frame:'local',parent_anchor:'world',role:'landing-zone',transform_or_constraint:{surface:'nearest'},stable_key:'landing-zone'}
  ],
  upstream_recipe_refs:[],
  manual_overrides:{},
  reconstruction_tolerance:{mode:'semantic'},
  expected_invariants:['same planet identity','same landing-zone role'],
  provenance:{source:'test'}
});
assert(recipe.content_hash);
let result=Core.validateRecipe(recipe,inv);
assert.equal(result.ok,true,result.errors.join('; '));
assert.equal(result.generator.generator_id,'planet-workshop');

result=Core.validateRecipe({...recipe,generator_version:'999'},inv);
assert.equal(result.ok,false);
assert(result.errors.some(x=>x.includes('generator binding/version')));

const bad=JSON.parse(JSON.stringify(recipe));
bad.semantic_anchors.push({...bad.semantic_anchors[1],anchor_id:'landing-2'});
result=Core.validateRecipe(bad,inv);
assert.equal(result.ok,false);
assert(result.errors.some(x=>x.includes('duplicate stable_key')));

const tampered={...recipe,parameters:{roughness:.9}};
result=Core.validateRecipe(tampered,inv);
assert.equal(result.ok,false);
assert(result.errors.some(x=>x.includes('content_hash mismatch')));

assert.equal(Core.contentHash(recipe),recipe.content_hash);
console.log('PASS: PG-02 enforces versioned generator binding, stable semantic anchors and immutable recipe content hashes without running or silently substituting generators.');
