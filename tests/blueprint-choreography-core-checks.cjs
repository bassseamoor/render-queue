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
assert(snap.completed_slices.some(x=>x.id==='WO-01'),'WO-01 remains recorded as completed after its explicit release and implementation');
assert(snap.completed_slices.some(x=>x.id==='DT-06'),'DT-06 must leave eligibility after verified runtime completion');
assert(!snap.eligible_slices.some(x=>x.id==='DT-06'),'completed slices may not be recommended again');
assert(snap.recommendation,'at least one dependency-satisfied unfinished slice should remain');
assert(snap.eligible_slices.some(x=>x.id===snap.recommendation.slice_id),'recommendation must come from the eligible set');
const sorted=snap.eligible_slices.slice().sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));
assert.equal(snap.recommendation.slice_id,sorted[0].id,'recommendation must be the deterministic highest-scoring eligible slice');
assert(!snap.eligible_slices.some(x=>x.buildNow===true),'calculator may not convert old buildNow state into new release authority');

console.log('PASS: choreography calculator derives eligibility from live evidence, never re-recommends completed work, deterministically selects the highest-scoring eligible slice, preserves historical divergence, and never releases work.');
