const assert=require('node:assert/strict');
const Loop=require('../scripts/funnel-build-loop.cjs');

const live=require('../blueprint-choreography-state.json');
const fixture=JSON.parse(JSON.stringify(live));
fixture.slices['DT-06']={
  status:'blueprint-sealed-runtime-partial',
  evidence:[
    'blueprint/dt06-mobile-semantic-parity.blueprint.json',
    'blueprint/dt06-mobile-semantic-parity.seal.v2.json',
    'tests/dt06-blueprint-funnel-run.cjs',
    'tests/dt06-blueprint-standard-checks.cjs'
  ]
};
const out=Loop.planNext({
  owner_directive:'Use the Funnel, automate the redundant planning, ask it what to do, then build the selected slice under the existing rules.',
  repository_base:'fixture-main-sha',
  evidence:fixture
});
assert.equal(out.schema,'moor.funnel-build-loop');
assert.equal(out.next_slice.slice_id,'DT-06');
assert.equal(out.action,'execute-sealed-blueprint');
assert.equal(out.blueprint_ref,'blueprint/dt06-mobile-semantic-parity.blueprint.json');
assert.match(out.seal_ref,/dt06-mobile-semantic-parity\.seal/);
assert(out.release&&out.job,'sealed blueprint must produce a builder packet');
assert.deepEqual(out.release.release_scope.write,[
  'pulse-beam-funnel-hall.js',
  'pulse-beam-funnel-hall.html',
  'tests/factory-twin-mobile-parity-checks.cjs'
]);
assert.equal(out.release.owner_approval,true);
assert.equal(out.release.repository_base,'fixture-main-sha');
assert.equal(out.job.objective,'Execute sealed DT-06 blueprint exactly; do not re-plan the platform.');
for(const p of ['factory-twin-core.js','funnel-kernel.js','software-factory-core.js'])assert(out.do_not_touch.includes(p));
assert.equal(out.authority,'planner only; v44 execution receipt still required before build');

const liveOut=Loop.planNext({
  owner_directive:'Use the Funnel to select the next unfinished slice and automate repetitive blueprint preparation.',
  repository_base:'live-state-fixture'
});
assert(liveOut.next_slice&&liveOut.next_slice.slice_id,'live loop must select an unfinished eligible slice');
if(liveOut.action==='prepare-blueprint'){
  const p=liveOut.blueprint_authoring;
  assert(p&&p.slice_id===liveOut.next_slice.slice_id,'unblueprinted slice must receive an authoring packet');
  assert(p.parent_ref&&p.slice_spec&&p.slice_spec.id===liveOut.next_slice.slice_id,'authoring packet must resolve the canonical parent slice');
  assert.equal(p.scope,'blueprint publication only; runtime implementation requires a separate v44 verdict');
  assert.equal(p.standards.exemplar,'pulse-dashboard.html?tool=blueprintdl');
  assert(p.required_sections.some(x=>x.startsWith('SPEC:')));
  assert(p.required_sections.some(x=>x.startsWith('L5:')));
}
if(liveOut.action==='execute-sealed-blueprint')assert(liveOut.release&&liveOut.job,'sealed live slice must produce release/job packets');

console.log('PASS: Funnel build loop regression reuses sealed machinery, while live state automatically emits either a scoped build packet or a complete Blueprint SOP authoring packet. CURRENT NEXT: '+liveOut.next_slice.slice_id+' / '+liveOut.action);
