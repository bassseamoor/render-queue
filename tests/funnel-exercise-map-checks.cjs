const assert=require('node:assert/strict');
const inv=require('../funnel-mechanism-inventory.json');
const map=require('../funnel-exercise-map.json');

assert.equal(map.schema,'moor.funnel-exercise-map');
assert(map.workflows.length>=8,'exercise map must cover production, maintenance, planning and candidate paths');
const inventoryIds=new Set(inv.mechanisms.map(x=>x.mechanism_id));
for(const w of map.workflows){
  assert(w.workflow_id&&w.entry&&w.status,'workflow identity/status required');
  assert(Array.isArray(w.mechanisms)&&w.mechanisms.length,'workflow must name exercised mechanisms');
  assert(Array.isArray(w.evidence)&&w.evidence.length,'workflow must name executable/current evidence');
  for(const id of w.mechanisms)assert(inventoryIds.has(id),w.workflow_id+' references unknown mechanism '+id);
}
for(const m of inv.mechanisms){
  assert(Object.prototype.hasOwnProperty.call(map.mechanism_exercise,m.mechanism_id),'every inventoried mechanism needs an exercise entry '+m.mechanism_id);
}
const unknown=new Set(map.unknown_or_unexercised.map(x=>x.mechanism_id));
for(const [id,paths] of Object.entries(map.mechanism_exercise)){
  if(!paths.length)assert(unknown.has(id),'unexercised mechanism must be explicit '+id);
}
assert(map.workflows.some(x=>x.workflow_id==='production-build-change'&&x.mechanisms.includes('v44-kernel')&&x.mechanisms.includes('harness-gate')));
assert(map.workflows.some(x=>x.workflow_id==='maintenance-observability'&&x.mechanisms.includes('factory-twin')&&x.mechanisms.includes('citadel-hmi')));
assert(map.workflows.some(x=>x.workflow_id==='ultra-candidate-reasoning'&&x.status==='exercised-candidate-only'));
console.log('PASS: FM-02 traces current production/capability/manufacturing/planning/observability paths to inventoried mechanisms and keeps unexercised mechanisms explicit.');
