const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const core=fs.readFileSync('funnel-foundry-core.js','utf8');
const data=fs.readFileSync('funnel-environment-data.js','utf8');
const sandbox={TextEncoder,localStorage:{getItem(){return null;}}};sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(core,sandbox,{filename:'funnel-foundry-core.js'});
vm.runInContext(data,sandbox,{filename:'funnel-environment-data.js'});
const g=sandbox.window.FUNNEL_ENVIRONMENT_GRAPH;
assert(g&&g.schema==='moor.funnel-environment-graph');
assert.equal(g.version,2);
assert.equal(g.nodes.filter(n=>n.type==='need').length,130,'Default Foundry graph must contain all 130 need points');
for(const key of ['fidelity','preservation','outcome','needs','value'])
  assert(g.nodes.some(n=>n.type==='funnel'&&n.systemKey===key),'Missing specialist system '+key);
for(const key of ['convergence','replay','execution','learning'])
  assert(g.nodes.some(n=>n.type==='funnel'&&n.systemKey===key),'Missing support system '+key);
for(const id of ['page0','intake.route','meta.merge','final.merge','receipt.merge','verify.merge'])
  assert(g.nodes.some(n=>n.id===id),'Missing Funnel stage '+id);
for(const e of g.edges){
  assert(g.nodes.some(n=>n.id===e.from),'Missing edge source '+e.from);
  assert(g.nodes.some(n=>n.id===e.to),'Missing edge target '+e.to);
}
assert.equal(sandbox.window.FunnelFoundry.validateGraph(g),true);
const html=fs.readFileSync('funnel-environment.html','utf8');
for(const src of ['funnel-kernel.js','funnel-foundry-core.js','funnel-environment-data.js','funnel-environment.js'])assert(html.includes(src),'Missing '+src);
assert(html.indexOf('funnel-foundry-core.js')<html.indexOf('funnel-environment-data.js'),'Foundry core must load before generated data');
const js=fs.readFileSync('funnel-environment.js','utf8');
assert(js.includes("import * as THREE from './three.module.js'"));
assert(js.includes('n.position &&'),'Renderer must honor Foundry-generated geometry positions');
assert(js.includes('raycaster.intersectObjects'));
assert(js.includes('connectedSet'));
assert(js.includes('kernel.inspect'));
assert(!js.includes('image_gen'),'Viewer must render graph geometry, not call image generation');
const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('"id":"funnel-environment"'),'Pulse must register Funnel Environment');
console.log('PASS: generated Funnel Environment loads Foundry core, preserves 130 needs, validates graph edges, and renders explicit graph geometry');
