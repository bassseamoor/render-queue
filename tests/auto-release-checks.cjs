const assert=require('node:assert/strict');
const fs=require('node:fs');
const P=require('../scripts/moor-auto-release-policy.cjs');

const parsed=P.parse('hello\n<!-- MOOR:AUTO-RELEASE {"release_mode":"auto","item_id":"x","destination":"Project Pulse / X"} -->');
assert.equal(parsed.enabled,true);
assert.equal(parsed.metadata.item_id,'x');
assert.equal(P.metadataValid(parsed.metadata).ok,true);

const malformed=P.parse('<!-- MOOR:AUTO-RELEASE {bad} -->');
assert.equal(malformed.enabled,false);
assert(malformed.error);

assert.equal(P.evaluatePaths(['quick-notes.html','tests/x.cjs']).ok,true);
for(const path of ['FUNNEL.md','funnel-kernel.js','moor-spec/MOOR-BLUEPRINT-SOP.md','.github/workflows/pulse-checks.yml','.github/workflows/moor-auto-release.yml']){
  assert.equal(P.blockedPath(path),true,'must block '+path);
}

let gate=P.workflowGate([]);
assert.equal(gate.ready,false);
assert.match(gate.reason,/Pulse recovery/);

gate=P.workflowGate([
  {name:'Pulse recovery checks',event:'pull_request',status:'in_progress',conclusion:null}
]);
assert.equal(gate.ready,false);
assert.match(gate.reason,/running/);

gate=P.workflowGate([
  {name:'Pulse recovery checks',event:'pull_request',status:'completed',conclusion:'success'},
  {name:'Pulse cumulative checks',event:'pull_request',status:'completed',conclusion:'failure'}
]);
assert.equal(gate.ready,false);
assert.deepEqual(gate.failed,['Pulse cumulative checks']);

const green=[
  {name:'Pulse recovery checks',event:'pull_request',status:'completed',conclusion:'success'},
  {name:'Pulse cumulative checks',event:'pull_request',status:'completed',conclusion:'success'}
];
gate=P.workflowGate(green);
assert.equal(gate.ready,true);

const pr={number:9,title:'Ship X',html_url:'https://github.com/a/b/pull/9',user:{login:'worker'}};
const metadata={release_mode:'auto',item_id:'x',destination:'Project Pulse / X',funnel_receipt_ref:'tests/x-funnel-run.cjs'};
const rec=P.receipt({pr,metadata,mergeSha:'abc123',workflowRuns:green,at:'2026-10-07T02:00:00Z'});
assert.equal(rec.schema,'moor.dev-feed-event');
assert.equal(rec.stage,'main');
assert.equal(rec.status,'complete');
assert.equal(rec.receipt.pull_request,9);

const cp=P.trajectoryCheckpoint({pr,metadata:{...metadata,trajectory:{
  title:'X',
  original_intent:'raw',
  funnel_intent:'spec',
  built_result:'observed'
}},mergeSha:'abc123',at:'2026-10-07T02:00:00Z'});
assert.equal(cp.schema,'moor.trajectory-checkpoint');
assert.equal(cp.assessors.length,0);
assert.equal(cp.originalIntent,'raw');

const workflow=fs.readFileSync('.github/workflows/moor-auto-release.yml','utf8');
for(const needle of [
  'workflow_run:',
  "ref: main",
  'persist-credentials: false',
  "pr.head.repo.full_name",
  "update-branch",
  "listWorkflowRunsForRepo",
  "merge_method: 'squash'",
  "createOrUpdateFileContents",
  "dev-feed/events/",
  "trajectory/events/"
]) assert(workflow.includes(needle),'workflow missing '+needle);
assert(!workflow.includes('github.event.pull_request.head.sha'),'trusted workflow must not checkout PR head');
console.log('PASS: MOOR Auto Release is opt-in, stale-safe, CI-gated, governance-blocked, and emits append-only receipts.');
