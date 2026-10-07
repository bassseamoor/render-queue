const assert=require('node:assert/strict');
const fs=require('node:fs');
const L=require('../moor-learning-loom.js');

assert(L.concepts.length>=12,'Initial Loom curriculum must cover more than a tiny demo set.');
const covered=new Set(L.concepts.flatMap(c=>c.fields||[]));
for(const field of L.fields)assert(covered.has(field),'Declared touch field has no concept coverage: '+field);

const a=L.generate({concept:'bounded-relevance',seed:'same',depth:'deep'});
const b=L.generate({concept:'bounded-relevance',seed:'same',depth:'deep'});
assert.deepEqual(a,b,'same concept/seed/depth must replay deterministically');
assert.equal(a.schema,'moor.learning-thread');
assert(a.source_refs.length>0);
assert(a.cross_field_bridges.length>=3);
assert(a.retrieval_prompts.length>=3);
assert(a.experiment&&a.build_challenge&&a.teach_back);
assert.notEqual(L.daily('2026-10-06').thread_id,L.daily('2026-10-07').thread_id,'daily thread should change by date');

const done=L.complete(a,2,'2026-10-06T12:00:00.000Z');
assert(new Date(done.next_review)>new Date(done.completed_at),'completion must schedule future retrieval');

assert.throws(()=>L.publicArtifact(a,''),/Create something/,'sharing must follow learner-created output');
const art=L.publicArtifact(a,'I built a relevance filter and found two false positives.');
assert.equal(art.schema,'moor.learning-artifact');
assert(art.learner_output.includes('relevance filter'));

assert.throws(()=>L.contribution({thread_id:a.thread_id,concept_id:a.concept_id,learner_text:'x',consent_scope:'local-private',confirm:true,sensitive_excluded:true}),/scope/);
assert.throws(()=>L.contribution({thread_id:a.thread_id,concept_id:a.concept_id,learner_text:'x',consent_scope:'pulse-contribution',sensitive_excluded:true}),/confirmation/);
assert.throws(()=>L.contribution({thread_id:a.thread_id,concept_id:a.concept_id,learner_text:'x',consent_scope:'pulse-contribution',confirm:true,sensitive_excluded:false}),/private\/sensitive/);
const cap=L.contribution({thread_id:a.thread_id,concept_id:a.concept_id,learner_text:'Typed contracts reduced false positives.',consent_scope:'pulse-contribution',confirm:true,sensitive_excluded:true});
assert.equal(cap.training_eligibility,true);
assert.equal(cap.sensitive_excluded,true);
assert.equal(cap.provenance,'explicit-learner-contribution');

const html=fs.readFileSync('pulse-learning-loom.html','utf8');
assert(html.includes('Finite by design.'));
assert(html.includes('Private by default.'));
assert(html.includes('contribConfirm'));
assert(html.includes('Contribute this exact text'));
assert(!/streak|countdown|limited time|invite contacts/i.test(html),'Learning Loom must not contain pressure growth mechanics');

const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('"id":"evergreen-learning-loom"'));
assert(ext.includes('pulse-learning-loom.html'));
const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
assert(manifest.items&&manifest.items['evergreen-learning-loom'],'Pulse manifest must register Learning Loom');
assert.equal(manifest.items['evergreen-learning-loom'].component_source,'blueprint/evergreen-learning-loom.blueprint.json');
assert(manifest.items['funnel-usage-plan'],'Pulse manifest must expose the mandatory Funnel usage-plan mechanism');
const dash=fs.readFileSync('pulse-dashboard.html','utf8');
assert(dash.indexOf('funnel-usage-plan-core.js')>=0&&dash.indexOf('funnel-usage-plan-core.js')<dash.indexOf('funnel-kernel.js'),'Usage Plan core must load before the v44 kernel');
assert(dash.indexOf('funnel-kernel.js')<dash.indexOf('moor-request.js'),'v44 kernel must load before MOOR.request');
const builder=fs.readFileSync('build_pulse_v2.py','utf8');
assert(builder.includes("'funnel-usage-plan': {"),'Pulse rebuild must preserve Funnel Usage Plan manifest entry');
assert(builder.includes("'evergreen-learning-loom': {"),'Pulse rebuild must preserve Learning Loom manifest entry');

console.log('PASS: Learning Loom is deterministic, cross-field, finite, action/retrieval based, private by default, and explicitly consented before contribution.');