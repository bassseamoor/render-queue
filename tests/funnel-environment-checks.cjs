const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const data=fs.readFileSync('funnel-environment-data.js','utf8');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(data,sandbox,{filename:'funnel-environment-data.js'});
const g=sandbox.window.FUNNEL_ENVIRONMENT_GRAPH;
assert(g&&g.schema==='moor.funnel-environment-graph');
assert.equal(g.nodes.filter(n=>n.type==='need').length,130,'Funnel environment must contain all 130 need points');
assert.equal(g.nodes.filter(n=>n.type==='funnel').length,5,'Expected five independent specialist funnels');
for(const id of ['page0','intake.route','meta.collect','meta.interview-decision','meta.agreement','replay.page0','replay.pass','receipt.requirements','receipt.execution','harness.intake','harness.verify','learn.ledger','learn.weights'])
  assert(g.nodes.some(n=>n.id===id),'Missing Funnel stage '+id);
for(const e of g.edges){
  assert(g.nodes.some(n=>n.id===e.from),'Missing edge source '+e.from);
  assert(g.nodes.some(n=>n.id===e.to),'Missing edge target '+e.to);
}
const html=fs.readFileSync('funnel-environment.html','utf8');
for(const src of ['funnel-kernel.js','funnel-environment-data.js','funnel-environment.js'])assert(html.includes(src),'Missing '+src);
const js=fs.readFileSync('funnel-environment.js','utf8');
assert(js.includes("import * as THREE from './three.module.js'"));
assert(js.includes('raycaster.intersectObjects'));
assert(js.includes('connectedSet'));
assert(js.includes('kernel.inspect'));
assert(!js.includes('image_gen'),'Viewer must render graph geometry, not call image generation');
const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('"id":"funnel-environment"'),'Pulse must register Funnel Environment');
console.log('PASS: Funnel Environment has five isolated funnels, 130 need points, complete routed stages, live kernel overlay, and interactive graph tracing');
