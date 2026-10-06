const assert=require('node:assert/strict');
const inv=require('../funnel-mechanism-inventory.json');
assert.equal(inv.schema,'moor.funnel-mechanism-inventory');
assert.equal(inv.production_authority,'v44-sealed');
assert(inv.mechanisms.length>=18,'inventory should cover the actual control/production/observability machine, not a toy subset');
const ids=new Set();
for(const m of inv.mechanisms){
  assert(m.mechanism_id&&!ids.has(m.mechanism_id),'mechanism ids must be stable and unique');ids.add(m.mechanism_id);
  for(const k of ['owner_layer','files','entrypoints','authority_effect','consumers','tests','receipts','maintenance_class','notes'])assert(m[k]!=null,m.mechanism_id+' missing '+k);
  assert(Array.isArray(m.files)&&m.files.length,m.mechanism_id+' must name implementation/contract files');
  assert(Array.isArray(m.consumers),m.mechanism_id+' consumers must be explicit');
  assert(['authority-essential','reasoning-useful','observability','compatibility','duplicate-defense','maintenance-debt','unknown'].includes(m.maintenance_class),m.mechanism_id+' invalid maintenance class');
}
for(const id of ['request-router','v44-kernel','harness-gate','verification-ci','capability-memory','software-factory-ledger','maintenance-register','factory-twin','citadel-hmi','ultra-law-core','blueprint-farm','choreography-calculator','ultra-persistent-ledger'])
  assert(ids.has(id),'missing critical mechanism '+id);
assert.equal(inv.mechanisms.find(x=>x.mechanism_id==='ultra-persistent-ledger').maintenance_class,'unknown');
assert(inv.mechanisms.find(x=>x.mechanism_id==='v44-kernel').authority_effect.includes('production execution receipt'));
assert(inv.mechanisms.find(x=>x.mechanism_id==='citadel-hmi').authority_effect.startsWith('none'));
console.log('PASS: FM-01 inventories Funnel authority, reasoning, manufacturing, maintenance and observability mechanisms with explicit owners, consumers, tests and unknown gaps; no behavior changes.');
