const assert=require('node:assert/strict');
const Core=require('../worker-release-core.js');

const release=Core.makeRelease({
  release_id:'release:wo01-test',
  blueprint_id:'worker-execution-orchestration',
  blueprint_version:'1',
  slice_id:'WO-01',
  page0_hash:'page0:test',
  blueprint_receipt:'receipt:test',
  dependency_receipts:['dep:bf01','dep:fm02'],
  repository_base:'0123456789abcdef0123456789abcdef01234567',
  owner_approval:true,
  budget:{worker_calls:1,files:2},
  release_scope:{write:['file:worker-release-core.js'],interfaces:['interface:release-contract'],read:['repo:*']},
  done_criteria:['contract validates','no worker spawn'],
  verification_plan:{tests:['tests/worker-release-core-checks.cjs']}
});
let vr=Core.validateRelease(release);
assert.equal(vr.ok,true,vr.errors.join('; '));
assert.equal(release.automatic_execution,false);
assert(release.release_hash);

const job=Core.makeJob(release,{
  job_id:'job:wo01-core',
  objective:'Implement release contract validation only',
  owned_files_or_interfaces:['file:worker-release-core.js','interface:release-contract'],
  read_scope:['repo:*'],
  capability_grant:{can_write_contract:true},
  budget:{worker_calls:0},
  inputs:{slice:'WO-01'},
  expected_outputs:['validated contract core'],
  done_criteria:['tests pass'],
  verification_plan:{tests:['tests/worker-release-core-checks.cjs']},
  handoff_contract:{to:'Verifier',requires:['test result']}
});
let vj=Core.validateJob(release,job);
assert.equal(vj.ok,true,vj.errors.join('; '));
assert.equal(vj.job.repository_base,release.repository_base);

vj=Core.validateJob(release,{...job,owned_files_or_interfaces:['file:unreleased.js']});
assert.equal(vj.ok,false);
assert(vj.errors.some(x=>x.includes('scope expansion')));

vr=Core.validateRelease({...release,owner_approval:false});
assert.equal(vr.ok,false);
assert(vr.errors.includes('owner approval required'));

vr=Core.validateRelease({...release,release_hash:'tampered'});
assert.equal(vr.ok,false);
assert(vr.errors.includes('release_hash mismatch'));

assert(!Object.prototype.hasOwnProperty.call(Core,'spawn'));
assert(!Object.prototype.hasOwnProperty.call(Core,'execute'));
console.log('PASS: WO-01 creates versioned SliceRelease/WorkerJob contracts, requires owner/base/scope/budget/verification, rejects scope expansion and exposes no worker-spawn authority.');
