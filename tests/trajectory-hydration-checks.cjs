const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const dir='trajectory/events';
const files=fs.readdirSync(dir).filter(x=>x.endsWith('.json')).sort();
assert(files.length>=8,'expected canonical Trajectory backfill');
const ids=new Set();
let foundGap=false,foundEnv=false,foundNotes=false;
for(const file of files){
  const j=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
  assert.equal(j.schema,'moor.trajectory-checkpoint',file+' wrong schema');
  assert.equal(j.version,1,file+' wrong version');
  for(const k of ['checkpoint_id','at','source','title','originalIntent','funnelIntent','builtResult','artifact']) assert(String(j[k]||'').length,file+' missing '+k);
  assert(!ids.has(j.checkpoint_id),'duplicate checkpoint '+j.checkpoint_id);ids.add(j.checkpoint_id);
  if(j.checkpoint_id==='trajectory-visibility-gap-and-repair')foundGap=true;
  if(j.checkpoint_id==='environment-engine-v1')foundEnv=true;
  if(j.checkpoint_id==='quick-notes-v1')foundNotes=true;
  assert(Array.isArray(j.assessors),file+' assessors must be explicit array');
}
assert(foundGap&&foundEnv&&foundNotes,'critical backfill checkpoints missing');

const html=fs.readFileSync('trajectory-ledger.html','utf8');
for(const needle of [
  "REPO_API='https://api.github.com/repos/bassseamoor/render-queue/contents/trajectory/events?ref=main'",
  'canonicalRows=[]',
  'mergeRows()',
  'repository-canonical',
  'Unscored is valid',
  'Refresh history'
]) assert(html.includes(needle),'Trajectory hydration missing '+needle);

const contract=JSON.parse(fs.readFileSync('trajectory-ledger.component-project.json','utf8'));
assert.equal(contract.storage.canonical,'append-only repository checkpoints under trajectory/events/');
assert(contract.requirements.includes('TR-10 fresh browsers hydrate canonical repository checkpoints instead of presenting an empty ledger'));
assert(contract.requirements.includes('TR-11 SSD-backed local checkpoints remain app-owned and are viewed through MOOR Trajectory'));

const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
assert(manifest.items['trajectory-ledger'].depends_on.includes('moor-local-files.js'));
assert(manifest.items['quick-notes'].depends_on.includes('moor-local-files.js'));
assert(manifest.items['trajectory-ledger'].tags.includes('dep:file-system-access'));
assert(manifest.items['quick-notes'].tags.includes('dep:file-system-access'));

console.log('PASS: Trajectory hydrates canonical append-only history and merges SSD/browser local checkpoints without inventing scores.');
