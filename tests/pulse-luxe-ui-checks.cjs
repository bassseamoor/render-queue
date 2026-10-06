const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

const css=fs.readFileSync('moor-luxe.css','utf8');
for(const token of ['--moor-field:#03070d','--moor-text:#f6fbff','--moor-ice:#aeeaff','--moor-emerald:#50e3a4'])
  assert(css.includes(token),'Missing Luxe token '+token);
assert(css.includes('#moor-request-bar'));
assert(css.includes('bottom:calc(82px + env(safe-area-inset-bottom))'),'Request bar must float above dock');
assert(css.includes('#tabbar'));
assert(css.includes('bottom:max(10px,env(safe-area-inset-bottom))'),'Tab dock must respect safe area');
assert(css.includes('body.funnel-env'),'Funnel environment must share Luxe law');
assert(!css.includes('#c9a7ff'),'Core Luxe shell must not use legacy purple accent');

const dash=fs.readFileSync('pulse-dashboard.html','utf8');
assert(dash.includes('pulse-beam.css'),'Pulse shell must now use Pulse Beam');
assert(dash.includes('pulse-beam.js'),'Pulse shell must mount Pulse Beam runtime');
assert(!dash.includes('moor-luxe.js?v=20261006-luxe1'),'old Luxe shell must not remain active on Pulse');

const env=fs.readFileSync('funnel-environment.html','utf8');
assert(env.includes('class="funnel-env"'));
assert(env.includes('moor-luxe.css?v=20261006-luxe1'));

const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes("var liveSrc=c.toolSrc||c.source"),'Independent Pulse tools must open their live runtime, not blueprint JSON');

const core=fs.readFileSync('funnel-foundry-core.js','utf8');
const data=fs.readFileSync('funnel-environment-data.js','utf8');
const sandbox={TextEncoder,localStorage:{getItem(){return null;}}};sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(core,sandbox,{filename:'funnel-foundry-core.js'});
vm.runInContext(data,sandbox,{filename:'funnel-environment-data.js'});
const g=sandbox.FUNNEL_ENVIRONMENT_GRAPH;
assert.equal(g.currentLaw.active,'v44-sealed');
assert.equal(g.currentLaw.candidate,'ultra-v1-candidate');
for(const id of ['law.active','law.ultra','law.plane.authority','law.plane.reasoning','law.plane.execution','law.plane.knowledge','law.plane.pulse'])
  assert(g.nodes.some(n=>n.id===id),'Missing current Funnel geometry '+id);
assert(g.edges.some(e=>e.from==='law.active'&&e.to==='page0'&&e.type==='governs'));
assert(g.edges.some(e=>e.from==='law.ultra'&&e.to==='law.active'&&e.type==='candidate'));

const render=fs.readFileSync('funnel-environment.js','utf8');
assert(render.includes("'law-active':0x50e3a4"));
assert(render.includes("'law-candidate':0xf6fbff"));
assert(!render.includes('image_gen'));

const luxe=fs.readFileSync('moor-luxe.js','utf8');
assert(luxe.includes("document.querySelectorAll('iframe')"));
assert(luxe.includes("classList.add(cls)"));

console.log('PASS: Luxe remains on the legacy 3D Funnel environment while Pulse Beam owns the live shell; current-law geometry and independent tool routing remain intact');