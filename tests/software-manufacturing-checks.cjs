const fs=require('node:fs'),assert=require('node:assert/strict');
const bp=require('../blueprint/software-manufacturing-system.blueprint.json');
const status=require('../funnel-maintenance-status.json');
const dash=fs.readFileSync('pulse-dashboard.html','utf8');
const build=fs.readFileSync('build_pulse_v2.py','utf8');
const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
const assembly=fs.readFileSync('moor-assembly-core.js','utf8');
const hub=fs.readFileSync('hub.html','utf8');
const objective=fs.readFileSync('objective.html','utf8');
const request=fs.readFileSync('moor-request.js','utf8');

assert.equal(bp.principle,'The 3D machine is a digital twin/HMI. Contracts, state transitions, evidence and receipts are the machine.');
for(const rec of ['WorkOrder','PartKind','BillOfMaterials','Route','Operation','ProcessSpec','TravelerReceipt','Inspection','Nonconformance','ReworkOrder','MaintenanceRecord','ReleaseRecord'])
  assert(bp.canonicalRecords[rec], 'missing canonical manufacturing record '+rec);
for(const law of ['Documented is not implemented.','Implemented is not wired.','Wired is not verified.','Visualization is never authority.'])
  assert(bp.qualityLaw.includes(law), 'missing quality separation '+law);

assert(hub.includes('part number')&&hub.includes('Context contract'),'HUB must retain manufacturing identity/interface semantics');
assert(objective.includes('answer the ten objective questions first'),'OBJECTIVE must remain outside-in before machine naming');
assert(assembly.includes('deterministic contract executor'),'Assembly Core must remain deterministic standard work');

for(const src of ['pulse-beam.css?v=20261006-beam1','pulse-beam-audit.js?v=20261006-beam1','pulse-beam-component-adapter.js?v=20261006-beam1','pulse-beam.js?v=20261006-beam1'])
  assert(dash.includes(src),'live dashboard missing protected factory HMI asset '+src);
assert(!dash.includes('pulse-creation-deck.js?v=20261006-deck1'),'old shell may not silently replace Beam');
assert(dash.includes('software-factory-core.js?v=20261006-factory1'),'live Pulse must load the manufacturing ledger before request routing');
assert(request.includes('ensureFactoryOrder')&&request.includes('advanceFactoryToHarness'),'MOOR.request must convert builds into routed work orders');

for(const id of ['pulse-beam','pulse-beam-funnel-hall','pulse-beam-standards','funnel-maintenance-status'])
  assert(manifest.items&&manifest.items[id],'manifest/BOM missing protected platform item '+id);
assert(build.includes('PRESERVED_PLATFORM_ITEMS'),'dashboard generator must preserve platform BOM entries');
assert(build.includes('pulse-beam.css?v=20261006-beam1')&&build.includes('pulse-beam.js?v=20261006-beam1'),'dashboard generator must preserve factory HMI wiring');

const beam=status.systems.find(x=>x.id==='pulse-beam-shell');
assert(beam&&beam.implemented===true&&beam.wired===true&&beam.verified===true,'maintenance register must track Beam wiring truth');
const gap=status.systems.find(x=>x.id==='ultra-persistence');
assert(gap&&gap.status==='remaining-gap'&&gap.implemented===false,'maintenance register must expose real remaining gaps');

console.log('PASS: MOOR manufacturing contract separates HMI from authority, preserves configuration/BOM control, and maps OBJECTIVE → HUB → Funnel → Assembly/Harness → inspection/learning into a maintainable software production line');
