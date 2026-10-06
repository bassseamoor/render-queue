const assert=require('node:assert/strict');
const R=require('../worker-release-core.js');
const G=require('../worker-reservation-core.js');

const base='aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const release=R.makeRelease({
  release_id:'release:wo02',blueprint_id:'worker-execution-orchestration',blueprint_version:'1',slice_id:'WO-02',
  page0_hash:'p0',blueprint_receipt:'receipt',dependency_receipts:['wo01'],repository_base:base,owner_approval:true,
  budget:{workers:2},release_scope:{write:['file:a.js','file:b.js'],interfaces:['interface:api:x'],read:['repo:*']},
  done_criteria:['guard works'],verification_plan:{tests:['worker-reservation']}
});
assert(R.validateRelease(release).ok);

const a=G.normalize({reservation_id:'r1',release_id:release.release_id,worker_id:'w1',repository_base:base,owned_files:['a.js'],owned_interfaces:['api:x']});
assert(G.validate(release,a,base,[]).ok);

let v=G.validate(release,{...a,reservation_id:'r2',worker_id:'w2'},'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',[]);
assert(!v.ok&&v.errors.includes('stale repository base'));

v=G.validate(release,{...a,reservation_id:'r2',worker_id:'w2',owned_files:['c.js']},base,[]);
assert(!v.ok&&v.errors.some(x=>x.includes('outside release scope')));

v=G.validate(release,{...a,reservation_id:'r2',worker_id:'w2'},base,[a]);
assert(!v.ok&&v.errors.some(x=>x.includes('ownership conflict')));

const shared=['file:a.js','interface:api:x'];
const s1=G.normalize({...a,shared,merge_strategy:{mode:'ordered'}});
const s2=G.normalize({...a,reservation_id:'r2',worker_id:'w2',shared,merge_strategy:{mode:'ordered'}});
assert(G.validate(release,s2,base,[s1]).ok);

assert(G.checkChange(a,base,{files:['a.js'],interfaces:['api:x']}).ok);
assert(!G.checkChange(a,base,{files:['b.js']}).ok);
assert(!G.checkChange(a,'stale',{files:['a.js']}).ok);
assert(!('write' in G)&&!('spawn' in G));
console.log('PASS: WO-02 rejects stale bases, scope expansion, undeclared overlap and unowned changes.');
