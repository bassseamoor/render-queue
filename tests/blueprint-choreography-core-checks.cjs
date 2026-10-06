const assert=require('node:assert/strict');
const Ch=require('../blueprint-choreography-core.js');
const choreography=require('../blueprint/blueprint-choreography.blueprint.json');
const evidence=require('../blueprint-choreography-state.json');

const snap=Ch.evaluate({choreography,evidence});
assert.equal(snap.schema,'moor.blueprint-choreography-snapshot');
assert.equal(snap.authority,'read-only/no-release');
assert(snap.completed_slices.some(x=>x.id==='BF-01'));
assert(snap.completed_slices.some(x=>x.id==='DT-01'));
assert(snap.divergences.some(x=>x.id==='DT-01'&&x.missing_dependencies.includes('FM-05')&&x.missing_dependencies.includes('PG-01')),'must expose implemented-ahead-of-plan evidence instead of rewriting history');
for(const id of ['BF-02','FM-02','PG-01','DT-02','DT-04'])assert(snap.eligible_slices.some(x=>x.id===id),'expected eligible slice '+id);
assert.equal(snap.recommendation.slice_id,'FM-02','after FM-01, the very-high information / low-risk exercise map should be advisory next');
assert(snap.blocked_slices.some(x=>x.id==='WO-01'&&x.missing_dependencies.includes('FM-02')));
assert(!snap.eligible_slices.some(x=>x.buildNow===true),'calculator may not convert old buildNow state into new release authority');

console.log('PASS: choreography calculator derives eligible/blocked work from evidence, flags out-of-order implementation, recommends FM-01 advisory-only, and never releases work.');
