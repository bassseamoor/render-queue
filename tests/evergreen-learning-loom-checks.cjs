const assert=require('node:assert/strict');
const fs=require('node:fs');
const L=require('../moor-learning-loom.js');

const a=L.generate({concept:'cumulative-machinery',seed:'same',depth:'deep'});
const b=L.generate({concept:'cumulative-machinery',seed:'same',depth:'deep'});
assert.deepEqual(a,b,'same seed + concept + depth must replay identically');
assert(a.source_refs.length>=2);
assert(a.cross_field_bridges.length>=5);
assert(a.retrieval_prompts.length>=3);
assert(a.experiment&&a.build_challenge&&a.teach_back);

const daily1=L.daily('2026-10-06','working');
const daily2=L.daily('2026-10-06','working');
assert.deepEqual(daily1,daily2,'daily thread must be deterministic');

const done=L.complete(a,2,'2026-10-06T12:00:00Z');
assert(new Date(done.next_review)>new Date(done.completed_at),'completion must schedule later retrieval');

assert.throws(()=>L.contribution({thread_id:a.thread_id,concept_id:a.concept_id,learner_text:'private thought',consent_scope:'local-private'}),/Explicit non-private contribution scope required/);
const cap=L.contribution({thread_id:a.thread_id,concept_id:a.concept_id,learner_text:'A useful explicit contribution',consent_scope:'pulse-contribution'});
assert.equal(cap.training_eligibility,true);
assert.equal(cap.provenance,'explicit-learner-contribution');
assert.equal(cap.sensitive_excluded,true);

const art=L.publicArtifact(a,'I built a visible capability graph.');
assert.equal(art.concept_id,a.concept_id);
assert(art.provenance.includes('EVERGREEN Learning Loom'));

const html=fs.readFileSync('pulse-learning-loom.html','utf8');
assert(html.includes('Finite by design.'));
assert(html.includes('Private by default.'));
assert(html.includes('Contribute this exact text'));
assert(html.includes("type:'moor:output'"));
assert(html.includes('schedule review'));
const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('evergreen-learning-loom'));
assert(ext.includes('EVERGREEN Learning Loom'));
const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json'));
assert(manifest.items['evergreen-learning-loom']);
console.log('PASS: Learning Loom produces deterministic source-backed cross-field threads, finite review loops, optional share artifacts, and explicit consented contribution capsules');