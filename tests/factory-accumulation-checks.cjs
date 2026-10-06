const assert=require('node:assert/strict');
const fs=require('node:fs');
const M=require('../moor-capability-memory.js');
const Refinery=require('../moor-capability-refinery.js');

M.clearForTests();
global.MoorCapabilityMemory=M;

const v1=Refinery.crystallizeOutput({
  id:'factory-machine-v1',
  title:'Factory machine',
  version:'1',
  status:'machine-verified',
  implementation_ref:'machine-v1.js',
  source:{app:'factory-test',component:'factory-machine'},
  capabilities:[{
    capability_id:'factory.machine',
    version:'1',
    status:'machine-verified',
    provides:['factory:work'],
    input_types:['moor.input'],
    output_types:['moor.output'],
    evidence_refs:['evidence:v1']
  }],
  evidence:{evidence_id:'evidence:v1',tests:[{ok:true}]}
});
M.ingest(v1);

const v2=Refinery.crystallizeOutput({
  id:'factory-machine-v2',
  title:'Factory machine',
  version:'2',
  status:'machine-verified',
  implementation_ref:'machine-v2.js',
  source:{app:'factory-test',component:'factory-machine'},
  supersedes:['factory.machine@1'],
  capabilities:[{
    capability_id:'factory.machine',
    version:'2',
    status:'machine-verified',
    supersedes:['factory.machine@1'],
    provides:['factory:work'],
    input_types:['moor.input'],
    output_types:['moor.output'],
    evidence_refs:['evidence:v2']
  }],
  evidence:{evidence_id:'evidence:v2',tests:[{ok:true}]}
});
M.ingest(v2);

const snap=M.snapshot();
assert(snap.capabilities['factory.machine@1'],'prior machine version must remain addressable');
assert(snap.capabilities['factory.machine@2'],'replacement machine must be registered');
assert.equal(snap.capabilities['factory.machine@1'].lifecycle,'deprecated','superseded machine remains but leaves preferred production');
assert.equal(snap.capabilities['factory.machine@1'].deprecation.replacement_version,'2');

const preferred=M.preferredCapability({capability_id:'factory.machine',provides:'factory:work'});
assert(preferred,'preferred machine must resolve');
assert.equal(preferred.version,'2','production should prefer newest verified active machine');

const all=M.listCapabilities({verified:true,include_deprecated:true,include_quarantined:true});
assert(all.some(x=>x.capability_id==='factory.machine'&&x.version==='1'),'full inventory must retain v1');
assert(all.some(x=>x.capability_id==='factory.machine'&&x.version==='2'),'full inventory must retain v2');

const graph=M.factoryGraph();
assert.equal(graph.schema,'moor.software-factory-graph');
assert(graph.nodes.some(x=>x.id==='cap:factory.machine@1'));
assert(graph.nodes.some(x=>x.id==='cap:factory.machine@2'));
assert(graph.edges.some(x=>x.from==='cap:factory.machine@2'&&x.to==='cap:factory.machine@1'&&x.type==='supersedes'),'factory graph must show replacement lineage');

const spine=fs.readFileSync('pulse-spine.js','utf8');
assert(spine.includes("addEdge(id,x,'supersedes'"),'Pulse reference graph must preserve supersession edges');
assert(spine.includes("supersedes:(c.supersedes||[])"),'Refinery capability lineage must enter Pulse');

const alias=require('../blueprint/software-manufacturing-machine.blueprint.json');
const bp=require('../blueprint/software-manufacturing-system.blueprint.json');
assert.equal(alias.status,'superseded-alias');
assert.equal(alias.canonical,'blueprint/software-manufacturing-system.blueprint.json');
assert.equal(bp.accumulationLaw.name,'Factory Accumulation Law');
assert(bp.accumulationLaw.rules.some(x=>/supersession|supersede/i.test(x)));

console.log('PASS: software-factory machines accumulate across versions; upgrades supersede rather than erase, production prefers verified active machinery, and Pulse preserves lineage.');
