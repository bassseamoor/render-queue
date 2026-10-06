const assert=require('node:assert/strict');
const ledger=require('../pulse-slice-release-ledger.json');

assert.equal(ledger.schema,'moor.slice-release-ledger');
assert.equal(ledger.automatic_next_slice,false);
assert(ledger.releases.length>=9,'expected accumulated explicit releases');
assert.deepEqual(
  ledger.releases.map(x=>x.release_order),
  ledger.releases.map((_,i)=>i+1),
  'release order must be append-only and contiguous'
);
assert.equal(
  ledger.current_release,
  ledger.releases[ledger.releases.length-1].slice_id,
  'current release must be the append-only ledger head'
);
assert.equal(ledger.releases[0].slice_id,'BF-01');

for(const id of ['CH-02','FM-01','FM-02','BF-02','PG-01','PG-02','WO-01','WO-02']){
  const r=ledger.releases.find(x=>x.slice_id===id);
  assert(r,'missing released slice '+id);
  assert(r.authority.includes('v44 sealed Funnel'),'post-BF01 release must name production Funnel authority');
  assert.equal(r.verification,'tests/owner-start-building-funnel-run.cjs');
}
for(const r of ledger.releases)
  assert(r.authority&&r.receipt_case&&r.verification&&r.status,'every release must name authority case, verifier and state');

console.log('PASS: later Blueprint Farm slices are append-only explicit owner/Funnel releases; original buildNow history remains intact and automatic next-slice release stays disabled.');
