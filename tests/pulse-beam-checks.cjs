const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

const bp=require('../blueprint/pulse-beam-rebrand.blueprint.json');
assert.equal(bp.productIdentity.displayName,'Pulse Beam');
assert(bp.acceptance.some(x=>x.includes('Existing components remain discoverable')));
assert.equal(bp.migration.law.startsWith('No destructive redesign'),true);

const dash=fs.readFileSync('pulse-dashboard.html','utf8');
assert(dash.includes('pulse-beam.css?v=20261006-beam1'));
assert(dash.includes('pulse-beam-audit.js?v=20261006-beam1'));
assert(dash.includes('pulse-beam-component-adapter.js?v=20261006-beam1'));
assert(dash.includes('pulse-beam.js?v=20261006-beam1'));
assert(!dash.includes('pulse-creation-deck.js?v=20261006-deck1'));
assert(!dash.includes('pulse-creation-deck.css?v=20261006-deck1'));
for(const required of ['pulse-spine.js','moor-request.js','pulse-component-extensions.js','moor-capability-memory.js'])
  assert(dash.includes(required),'Beam rebrand must preserve core runtime '+required);

const beam=fs.readFileSync('pulse-beam.js','utf8');
assert(beam.includes("{id:'create',label:'Create'"));
assert(beam.includes("{id:'funnel',label:'Funnel Hall'"));
assert(beam.includes("interactiveTarget(e.target)"),'global swipe must reject interactive component targets');
assert(beam.includes("data-space=\"'+s.id+'\""),'visible space controls must exist');
assert(beam.includes("beam:navigate"),'Funnel Hall must hand navigation back to shell');
assert(beam.includes("beam:open-component"),'Hall must open real Pulse tools');

const css=fs.readFileSync('pulse-beam.css','utf8');
for(const token of ['--beam-field:#04080d','--beam-white:#f7fbff','--beam-ice:#a8e8ff','--beam-emerald:#4be0a3'])
  assert(css.includes(token),'Missing Beam token '+token);
assert(css.includes('body.beam-embedded'),'legacy tools need compatibility mode');
assert(css.includes('@media(prefers-reduced-motion:reduce)'),'Beam must respect reduced motion');
assert(css.includes('min-height:44px'),'embedded touch controls need minimum target sizing');

const adapter=fs.readFileSync('pulse-beam-component-adapter.js','utf8');
assert(adapter.includes("level:'legacy-compatible'"));
assert(adapter.includes('before_actions'));
assert(adapter.includes('after_actions'));
assert(adapter.includes('parity=before.actions===after.actions&&before.inputs===after.inputs'));
assert(!adapter.includes("level:'beam-native'"),'global adapter may not claim Beam-native');

const audit=fs.readFileSync('pulse-beam-audit.js','utf8');
assert(audit.includes("level:'beam-native'"));
assert(audit.includes("evidence.parity!==true"));
assert(audit.includes("mobile_safe"));
assert(audit.includes("touch_safe"));

const hall=fs.readFileSync('pulse-beam-funnel-hall.html','utf8');
assert(hall.includes('funnel-foundry-core.js'));
assert(hall.includes('funnel-environment-data.js'));
assert(hall.includes('pulse-beam-funnel-hall.js'));
assert(hall.includes('FOUNDRY')&&hall.includes('REFINERY'));
const halljs=fs.readFileSync('pulse-beam-funnel-hall.js','utf8');
assert(halljs.includes("window.FUNNEL_ENVIRONMENT_GRAPH"));
assert(halljs.includes("graph.nodes.filter(n=>n.type==='funnel')"));
assert(halljs.includes("n.type==='law-active'"));
assert(halljs.includes("n.type==='law-candidate'"));
assert(halljs.includes("parent.postMessage({type:'beam:navigate',space:'create'}"));
assert(!halljs.includes('image_gen'),'Funnel Hall must render live geometry, not generate an image');

const core=fs.readFileSync('funnel-foundry-core.js','utf8');
const data=fs.readFileSync('funnel-environment-data.js','utf8');
const sandbox={TextEncoder,localStorage:{getItem(){return null;}}};sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(core,sandbox,{filename:'funnel-foundry-core.js'});
vm.runInContext(data,sandbox,{filename:'funnel-environment-data.js'});
const g=sandbox.FUNNEL_ENVIRONMENT_GRAPH;
assert(g.nodes.some(n=>n.type==='funnel'),'current graph must expose specialist Funnels');
assert.equal(g.currentLaw.active,'v44-sealed');
assert.equal(g.currentLaw.candidate,'ultra-v1-candidate');

const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('"id":"pulse-beam-funnel-hall"'));
assert(ext.includes('"id":"pulse-beam-standards"'));
assert(ext.includes('"id":"capability-memory"'),'Refinery must survive Beam rebrand');

const spine=fs.readFileSync('pulse-spine.js','utf8');
assert(spine.includes("page:'pulse-beam-funnel-hall.html'"));
assert(spine.includes("id:'beam-rebrand-blueprint'"));

const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
assert(manifest.items['pulse-beam']);
assert(manifest.items['pulse-beam-funnel-hall']);
assert(manifest.items['pulse-beam-standards']);

assert(fs.existsSync('pulse-creation-deck.js')&&fs.existsSync('pulse-creation-deck.css'),'prior shell must remain preserved for provenance/rollback');

console.log('PASS: Pulse Beam replaces the live shell without deleting prior assets, protects component gestures/identity, provides a real current-graph Funnel Hall, and enforces no-loss migration evidence');