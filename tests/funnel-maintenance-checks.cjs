const fs=require('node:fs'),assert=require('node:assert/strict');

const status=require('../funnel-maintenance-status.json');
const migration=require('../blueprint/funnel-ultra-v44-migration.blueprint.json');
const agent=require('../moor-agent.json');
const workflow=fs.readFileSync('.github/workflows/pulse-checks.yml','utf8');
const dash=fs.readFileSync('pulse-dashboard.html','utf8');
const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
const ultra=fs.readFileSync('funnel-law-core.js','utf8');
const contract=fs.readFileSync('FUNNEL.md','utf8');

assert.equal(status.current_authority.production,'v44-sealed');
assert.equal(status.current_authority.candidate,'ultra-v1-candidate');
assert.equal(agent.funnel.candidate_version,'ultra-v1-candidate');
assert.equal(agent.funnel.maintenance_status,'funnel-maintenance-status.json');
assert.equal(agent.manufacturing.stations.observability,'pulse-beam-funnel-hall.html');

for(const term of ['documented','implemented','wired','verified','receipt_backed','visualized'])
  assert(Object.prototype.hasOwnProperty.call(status.semantics,term),'maintenance semantics missing '+term);

const required=['page0-v44','page0-ultra','ultra-society','ultra-capabilities','ultra-budgets','refinery-handoff','pulse-beam-shell','funnel-citadel','ultra-persistence'];
for(const id of required)assert(status.systems.some(x=>x.id===id),'maintenance register missing '+id);

const gap=status.systems.find(x=>x.id==='ultra-persistence');
assert.equal(gap.status,'remaining-gap');
assert.equal(gap.implemented,false);

assert(migration.migration.some(x=>x.concept==='Atomic source-backed Page 0 replay'&&x.status==='native-ultra'));
assert(migration.migration.some(x=>x.concept==='Append-only persistent public write slot'&&x.status==='remaining-gap'));

for(const token of ['extractObligations','PAGE0_REPLAYED','BlueprintReceipt','ExecutionReceipt','verifyReceipt'])
  assert(ultra.includes(token),'Ultra core missing native guard '+token);

for(const src of ['pulse-beam.css?v=20261006-beam1','pulse-beam-audit.js?v=20261006-beam1','pulse-beam-component-adapter.js?v=20261006-beam1','pulse-beam.js?v=20261006-beam1'])
  assert(dash.includes(src),'Beam wiring drift: '+src);
for(const id of ['pulse-beam','pulse-beam-funnel-hall','pulse-beam-standards','funnel-maintenance-status'])
  assert(manifest.items&&manifest.items[id],'manifest/BOM drift: '+id);

assert(contract.includes('Visualization never upgrades another state.'));
assert(contract.includes('Verified machinery is cumulative.'));
assert(workflow.includes('tests/funnel-law-ultra-checks.cjs'));

console.log('PASS: Funnel maintenance truth distinguishes docs/code/wiring/tests/receipts/visualization, exposes Ultra migration gaps, and detects Beam BOM integration drift');
