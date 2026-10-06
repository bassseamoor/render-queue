const assert=require('node:assert/strict');
const Ch=require('../blueprint-choreography-core.js');
const choreography=require('../blueprint/blueprint-choreography.blueprint.json');
const evidence=require('../blueprint-choreography-state.json');

const snap=Ch.evaluate({choreography,evidence});
assert.equal(snap.schema,'moor.blueprint-choreography-snapshot');
assert.equal(snap.authority,'read-only/no-release');
assert(snap.completed_slices.some(x=>x.id==='BF-01'));
assert(snap.completed_slices.some(x=>x.id==='DT-01'));
assert(snap.divergences.some(x=>x.id==='DT-01'&&x.divergence==='implemented-ahead-of-plan-history'&&x.historical_missing_dependencies.includes('FM-05')&&x.historical_missing_dependencies.includes('PG-01')),'must preserve implemented-ahead-of-plan history after dependencies catch up');
for(const id of ['FM-03','PG-03','WO-03','DT-04','DT-06','FM-04'])assert(snap.eligible_slices.some(x=>x.id===id),'expected eligible slice '+id);
assert.equal(snap.recommendation.slice_id,'DT-06','after verified DT-02 and DT-03, mobile semantic parity is the highest-scoring advisory next slice');
assert(snap.completed_slices.some(x=>x.id==='WO-01'),'WO-01 remains recorded as completed after its explicit release and implementation');
assert(!snap.eligible_slices.some(x=>x.buildNow===true),'calculator may not convert old buildNow state into new release authority');

console.log('PASS: choreography calculator derives eligible/blocked work from current evidence, preserves historical out-of-order implementation, advances advisory sequencing beyond completed DT-02, and never releases work.');
