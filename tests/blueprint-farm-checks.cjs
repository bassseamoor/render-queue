const fs=require('node:fs'),assert=require('node:assert/strict');

const library=require('../pulse-blueprint-farm-library.json');
const master=require('../blueprint/blueprint-farm.blueprint.json');
const releaseLedger=require('../pulse-slice-release-ledger.json');

assert.equal(library.schema,'moor.blueprint-farm-library');
assert.equal(library.authority.automatic_execution,false);
assert.equal(master.firstSlice.id,'BF-01');
assert.equal(master.firstSlice.buildNow,true);

const required=[
  'knownEvidence','openQuestions','assumptions','nonGoals','interfaces','dataContracts',
  'failureModes','maintenanceModel','observability','securityAuthority','implementationSlices','acceptance','rollback'
];

for(const entry of library.blueprints){
  assert(fs.existsSync(entry.path),'missing farm blueprint '+entry.path);
  const bp=JSON.parse(fs.readFileSync(entry.path,'utf8'));
  for(const k of required)assert(bp[k]!=null,entry.id+' missing '+k);
  assert(Array.isArray(bp.openQuestions)&&bp.openQuestions.length>=5,entry.id+' needs >=5 open questions');
  assert(Array.isArray(bp.implementationSlices)&&bp.implementationSlices.length>=1,entry.id+' needs implementation slices');
  assert(Array.isArray(bp.acceptance)&&bp.acceptance.length>=3,entry.id+' needs acceptance gates');
  assert(typeof bp.rollback==='string'&&bp.rollback.length>20,entry.id+' needs meaningful rollback');
  for(const q of bp.openQuestions){
    const s=String(typeof q==='string'?q:q.question||'');
    assert(/[?]$/.test(s),entry.id+' open question must actually be phrased as a question');
    assert(!/^Should we (use|build|make|implement)\b/i.test(s),entry.id+' question is too solution-leading: '+s);
  }
}

const choreo=require('../blueprint/blueprint-choreography.blueprint.json');
const builds=choreo.releaseSlices.filter(x=>x.buildNow);
assert.deepEqual(builds.map(x=>x.id),['BF-01'],'only BF-01 is released now');
for(const s of choreo.releaseSlices){
  assert(Array.isArray(s.dependsOn),'slice '+s.id+' missing dependency array');
  if(s.id!=='BF-01')assert.equal(s.buildNow,false,'future slice accidentally released: '+s.id);
}

const seeded=require('../blueprint/seeded-procedural-toolchain.blueprint.json');
for(const k of ['generator_binding','generator_version','root_seed','subseed_scheme','semantic_anchors'])
  assert(seeded.dataContracts.ProceduralRecipe.includes(k),'ProceduralRecipe missing '+k);
assert(seeded.seedLaw.derivation.includes('semantic keys'));

const twin=require('../blueprint/factory-digital-twin.blueprint.json');
assert(twin.spatialDesign.semanticLayers.some(x=>x.layer==='authority'&&x.authority===true));
assert(twin.visualSemantics.gap.includes('never hidden'));

const worker=require('../blueprint/worker-execution-orchestration.blueprint.json');
assert(worker.securityAuthority.releaseAuthority.includes('explicit'));
assert(worker.routingLaw.some(x=>/stale/i.test(x)));

const maint=require('../blueprint/funnel-maintenance-modernization.blueprint.json');
assert(maint.maintenanceTaxonomy.some(x=>x.class==='maintenance-debt'));
assert(maint.maintenanceTaxonomy.some(x=>x.class==='unknown'));

const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
assert(manifest.items&&manifest.items['blueprint-farm'],'Pulse manifest must expose Blueprint Farm');
const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('"id":"blueprint-farm"'),'Pulse component catalog must expose Blueprint Farm');
const spine=fs.readFileSync('pulse-spine.js','utf8');
assert(spine.includes("id:'blueprint-farm-master'"),'Pulse Spine must expose Blueprint Farm');
const fabric=JSON.parse(fs.readFileSync('pulse-funnel-fabric-library.json','utf8'));
for(const id of ['fabric-blueprint-farm-master','fabric-blueprint-farm-index','fabric-blueprint-farm-view','fabric-blueprint-farm-ultra'])
  assert(fabric.documents.some(x=>x.id===id),'Funnel Fabric must index '+id);
const build=fs.readFileSync('build_pulse_v2.py','utf8');
assert(build.includes("'blueprint-farm':"),'Pulse manifest rebuild must preserve Blueprint Farm');
const agent=JSON.parse(fs.readFileSync('moor-agent.json','utf8'));
assert(agent.blueprint_farm&&agent.blueprint_farm.current_release===releaseLedger.current_release,'canonical MOOR entry must expose the latest explicit release');
assert.equal(agent.blueprint_farm.automatic_next_slice,false,'Blueprint Farm must not auto-release later slices');

const evergreen=fs.readFileSync('morverse-evergreen-library.js','utf8');
assert(evergreen.includes("id:'blueprint-farm'"),'EVERGREEN Blueprint Stacks must expose the farm for physical inspection');
const html=fs.readFileSync('blueprint-farm.html','utf8');
assert(html.includes('pulse-blueprint-farm-library.json'));
assert(html.includes('blueprint-choreography-core.js'));
assert(html.includes('blueprint-comparison-core.js'));
assert(html.includes('Farm intelligence'));
assert(html.includes('execution:'));
assert(!html.includes('spawnWorker('));
assert(!html.includes('EXECUTION_AUTHORIZED'));

console.log('PASS: Blueprint Farm preserves the original BF-01 plan, records later owner/Funnel releases separately, exposes BF-02 cross-blueprint intelligence, and remains read-only/release-gated.');
