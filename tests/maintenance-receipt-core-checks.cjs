const assert=require('node:assert/strict');
const Core=require('../maintenance-receipt-core.js');
const status=require('../funnel-maintenance-status.json');
const inventory=require('../funnel-mechanism-inventory.json');
const exercise=require('../funnel-exercise-map.json');

const live={
  overall:'degraded',
  counts:{stations:2,passed:1,failed:1,critical_failed:0},
  results:[
    {id:'page0-v44',critical:true,pass:true,passed:1,total:1,tests:[{file:'tests/funnel-kernel-checks.cjs',pass:true}]},
    {id:'example-cell',critical:false,pass:false,passed:0,total:1,tests:[{file:'tests/example.cjs',pass:false}]}
  ]
};
const a=Core.compose({status,inventory,exercise,live,commit_sha:'abc123',generated_at:'2026-10-06T20:00:00Z'});
const b=Core.compose({status,inventory,exercise,live,commit_sha:'abc123',generated_at:'2026-10-06T21:00:00Z'});

assert.equal(a.schema,'moor.maintenance-receipt');
assert.equal(a.version,1);
assert.equal(Core.validate(a).ok,true);
assert.equal(a.snapshot_hash,b.snapshot_hash,'observation time must not change semantic maintenance identity');
assert.equal(a.law_versions.production,'v44-sealed');
assert(a.mechanism_statuses.some(x=>x.mechanism_id==='v44-kernel'&&x.exercised===true));
assert(a.mechanism_statuses.some(x=>x.mechanism_id==='ultra-persistent-ledger'&&x.exercised===false));
assert(a.tests_executed.some(x=>x.station_id==='example-cell'&&x.pass===false));
assert(a.failures.some(x=>x.station_id==='example-cell'));
assert(a.known_gaps.some(x=>x.id==='ultra-persistence'));
assert.equal(a.overall,'degraded');

console.log('PASS: FM-05 MaintenanceReceipt deterministically binds law versions, mechanism exercise, station tests, failures and known gaps without observation time becoming authority.');
