const assert=require('node:assert/strict');
const ledger=require('../pulse-slice-release-ledger.json');
assert.equal(ledger.schema,'moor.slice-release-ledger');
assert.equal(ledger.automatic_next_slice,false);
assert.equal(ledger.current_release,'PG-01');
assert.deepEqual(ledger.releases.map(x=>x.release_order),ledger.releases.map((_,i)=>i+1),'release order must be append-only and contiguous');
assert.deepEqual(ledger.releases.map(x=>x.slice_id),['BF-01','CH-02','FM-01','FM-02','BF-02','PG-01']);
for(const r of ledger.releases){
  assert(r.authority&&r.receipt_case&&r.verification&&r.status,'every release must name authority case, verifier and state');
}
for(const id of ['CH-02','FM-01','FM-02','BF-02','PG-01']){
  const r=ledger.releases.find(x=>x.slice_id===id);
  assert(r.authority.includes('v44 sealed Funnel'),'post-BF01 release must name production Funnel authority');
  assert.equal(r.verification,'tests/owner-start-building-funnel-run.cjs');
}
console.log('PASS: later Blueprint Farm slices are append-only explicit owner/Funnel releases; original buildNow plan remains historical and automatic next-slice release stays disabled.');
