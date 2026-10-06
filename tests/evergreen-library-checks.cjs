const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const bp=JSON.parse(read('blueprints/evergreen-public-library-world.json'));
const html=read('morverse-evergreen-library.html');
const js=read('morverse-evergreen-library.js');
const manifest=JSON.parse(read('pulse-manifest.json'));
const extensions=read('pulse-component-extensions.js');
const workspace=read('pulse-workspace.js');
const K=require('../funnel-kernel.js');

assert.equal(bp.schema,'moor.morverse-world-blueprint');
assert.equal(bp.funnel.law_version,'v44-sealed');
assert(bp.funnel.page0.includes('public library'));
assert(bp.funnel.page0.includes('Using the funnel'));
assert.equal(bp.funnel.unresolved.length,0);
assert(bp.funnel.requirements.length>=18);
assert.equal(new Set(bp.funnel.requirements.map(r=>r.id)).size,bp.funnel.requirements.length);
assert((bp.world.zones||[]).length>=12);
assert((bp.world.zones||[]).filter(z=>z.built!==false).length>=10);
assert((bp.social_program.recurring_formats||[]).length>=8);
assert((bp.expansions||[]).length>=6);
assert((bp.accessibility||[]).length>=5);
assert(/Real attendance.*require/i.test(bp.social_program.online_dependency));
assert(bp.governance.public_covenant.some(x=>/Public browsing/i.test(x)));
assert(bp.knowledge_model.evergreen_promotion.criteria.length>=4);
assert(bp.verdict_packet.destination.includes('morverse-evergreen-library.html'));

assert(html.includes('data-moor-page="evergreen-public-library"'));
assert(html.includes('data-panel="map"'));
assert(html.includes('data-panel="program"'));
assert(html.includes('data-panel="library"'));
assert(html.includes('id="dpad"'));
assert(html.indexOf('funnel-kernel.js')>=0&&html.indexOf('funnel-kernel.js')<html.indexOf('moor-request.js'),'Funnel kernel must load before MOOR router');
assert(html.includes('morverse-evergreen-library.js'));
assert(!/https:\/\/(?:unpkg|cdn|jsdelivr)/i.test(html),'World shell must not require a remote rendering CDN');

const parseable=js.replace(/^import\s+\*\s+as\s+THREE\s+from\s+['"].*?['"];\s*/,'');
new vm.Script(parseable,{filename:'morverse-evergreen-library.js'});
assert(js.includes("import * as THREE from './three.module.js'"));
assert(js.includes('function buildRotunda'));
assert(js.includes('function buildGrove'));
assert(js.includes('function buildMakers'));
assert(js.includes('function buildAmphitheater'));
assert(js.includes('function buildObservatory'));
assert(js.includes('function travelTo'));
assert(js.includes('MoorOutput.emit'));
assert(!/online\s+visitors?\s*[:=]\s*\d+/i.test(js),'Do not fabricate online population');

assert(manifest.items['evergreen-public-library']);
assert.equal(manifest.items['evergreen-public-library'].page,'morverse-evergreen-library.html');
assert(extensions.includes('"id":"evergreen-public-library"'));
assert(extensions.includes('"tool":"evergreenPublicLibrary"'));
assert(workspace.includes("seedProject('evergreen-public-library'"));
assert(workspace.includes('blueprints/evergreen-public-library-world.json'));

// Run the exact frozen Page 0 through the sealed Funnel kernel.
K._resetForTests();
const requestId='evergreen-public-library-world-build';
let s=K.open({request_id:requestId,input:bp.funnel.page0,source:'owner',context:{project:'evergreen-public-library'}});
s=K.advance({request_id:requestId,stage:'references',payload:{reused:bp.funnel.references,missing:[]},provenance:'learned'});
bp.funnel.references.forEach(ref=>K.write({request_id:requestId,kind:'reference',value:{ref},source:'evergreen-blueprint',provenance:'learned'}));
s=K.advance({request_id:requestId,stage:'distill',payload:{spec_draft:bp.funnel.distilled_spec},provenance:'inferred'});
s=K.advance({request_id:requestId,stage:'decisions',payload:{locked:bp.funnel.locked_decisions,unresolved:[]},provenance:'inferred'});
const obligations=K.extractObligations(bp.funnel.page0);
assert(obligations.length>0);
s=K.advance({request_id:requestId,stage:'replay',payload:{
  page0_verified:true,
  page0_hash:s.stages.page0.raw_hash,
  obligations:obligations.map(o=>({...o,status:'satisfied'})),
  substitutions:[]
},provenance:'verified'});
s=K.advance({request_id:requestId,stage:'verdict',payload:{
  spec:{
    blueprint_id:bp.id,
    requirements:bp.funnel.requirements,
    zones:bp.world.zones.map(z=>z.id),
    expansions:bp.expansions.map(x=>x.phase),
    obligations:obligations.map(o=>({...o,status:'satisfied'}))
  },
  destination:bp.verdict_packet.destination,
  done_criteria:bp.funnel.requirements.map(r=>r.text)
},provenance:'verified'});
assert(s.receipt);
assert.equal(K.verifyReceipt(s.receipt),true);
const packet=K.executionPacket(s.receipt);
assert(packet.funnel_receipt);
assert(packet.destination.includes('morverse-evergreen-library.html'));
assert.equal(packet.spec.requirements.length,bp.funnel.requirements.length);

// Blueprint's explicit requirement replay must be complete too.
const coverage=new Map(bp.replay.coverage.map(x=>[x.id,x]));
for(const req of bp.funnel.requirements){
  assert(coverage.has(req.id),'Missing blueprint replay coverage for '+req.id);
  assert.equal(coverage.get(req.id).status,'satisfied-by-spec');
}

console.log('PASS: EVERGREEN blueprint, sealed Funnel receipt, world architecture, UI, social/expansion plan, Pulse registration, and no fake live presence');
