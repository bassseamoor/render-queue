const assert=require('node:assert/strict');
const fs=require('node:fs');
const Local=require('../moor-local-files.js');

assert.equal(Local.MOOR_ROOT,'MOOR');
assert.equal(Local.APP_DATA,'app-data');
assert.deepEqual(Local.appSegments('quick-notes'),['MOOR','app-data','quick-notes']);
assert.deepEqual(Local.appSegments('trajectory'),['MOOR','app-data','trajectory']);
assert.equal(Local.cleanSegment('bad/name:*?'),'bad-name-');

const storageBp=JSON.parse(fs.readFileSync('blueprint/local-app-storage.blueprint.json','utf8'));
assert.equal(storageBp.id,'local-app-storage-v1');
assert.equal(storageBp.structure.root,'MOOR/');
assert.equal(storageBp.structure.app_data,'MOOR/app-data/<app-id>/');
assert(storageBp.done_criteria.some(x=>x.includes('quick-notes/state.json')));
assert(storageBp.done_criteria.some(x=>x.includes('trajectory/')));

const qbp=JSON.parse(fs.readFileSync('blueprint/quick-notes.blueprint.json','utf8'));
assert.equal(qbp.version,2);
assert(qbp.decisions[0].includes('MOOR/app-data/quick-notes/state.json'));

const qhtml=fs.readFileSync('quick-notes.html','utf8');
for(const needle of ['moor-local-files.js',"writeAppJson(ssdHandle,'quick-notes','state.json'","Connect durable SSD storage","MOOR/app-data/quick-notes"]){
  assert(qhtml.includes(needle),'Quick Notes SSD integration missing '+needle);
}

const traj=fs.readFileSync('trajectory-ledger.html','utf8');
for(const needle of ['moor-local-files.js',"APP_ID='trajectory'","local-checkpoints.json","canonical-cache.json","MOOR/app-data/trajectory/"]){
  assert(traj.includes(needle),'Trajectory SSD integration missing '+needle);
}

const conv=fs.readFileSync('convergence-funnel.html','utf8');
assert(conv.includes('<script src="moor-local-files.js"></script>'));
assert(conv.includes("writeAppJson(handle,'trajectory','local-checkpoints.json'"));

const readme=fs.readFileSync('docs/LOCAL_APP_STORAGE.md','utf8');
assert(readme.includes('MOOR/app-data/'));
assert(readme.includes('MOOR applications are the interface'));

console.log('PASS: MOOR local app storage uses clean app-owned SSD paths with browser fallback and MOOR-app-first presentation.');
