const fs=require('node:fs');
const assert=require('node:assert/strict');

const bp=require('../blueprint/dt06-mobile-semantic-parity.blueprint.json');
const seal=require('../blueprint/dt06-mobile-semantic-parity.seal.v2.json');
const js=fs.readFileSync('pulse-beam-funnel-hall.js','utf8');
const html=fs.readFileSync('pulse-beam-funnel-hall.html','utf8');
const visual=fs.readFileSync('blueprint-dt06-mobile-parity.html','utf8');
const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
const manifest=require('../pulse-manifest.json');
const build=fs.readFileSync('build_pulse_v2.py','utf8');

assert.equal(bp.schema,'moor.build-blueprint');
assert.equal(bp.version,2);
assert.equal(bp.blueprint_id,'DT-06-REV2');
assert.equal(bp.pulse_tool,'blueprintdt06');
assert.equal(bp.blueprint_status,'sealed-ready-for-builder-release');
assert.deepEqual(bp.unresolved_decisions,[],'builder may not inherit unresolved choices');
assert.equal(bp.runtime_implementation_authorized,false,'blueprint publication must not masquerade as runtime release');

assert.equal(seal.authority,'v44-sealed');
assert.equal(seal.verdict,'BUILD');
assert.equal(seal.version,2);
assert.equal(seal.funnel_revision,'usage-plan-1');
assert.equal(seal.kernel_receipt_version,2);
assert.equal(seal.usage_plan_hash,'13236e86');
assert.equal(seal.receipt_fingerprint,'345048cb648d5f5b');
assert.equal(seal.runtime_implementation_authorized,false);
assert.equal(seal.destination,'Project Pulse / dashboard?tool=blueprintdt06');

const v=bp.locked_values;
assert.equal(v.compact_width_px,720);
assert.deepEqual(v.machine_visual_cap,{low:24,full:72});
assert.deepEqual(v.route_visual_cap,{low:36,full:120});
assert.deepEqual(v.wip_visual_cap,{low:12,full:32});
assert.deepEqual(v.ring_segments,{low:64,full:128});
assert.deepEqual(v.dpr_cap,{low:1.2,full:1.8});
assert.equal(v.semantic_index_initial_rows,80);
assert.equal(v.touch_target_min_px,44);
assert.equal(v.semantic_index_mobile_top_px,96);
assert.equal(v.semantic_index_mobile_bottom_px,154);

assert(Array.isArray(bp.claims)&&bp.claims.length>=8,'material claims need explicit proof');
for(const c of bp.claims){
  assert(c.id&&c.claim&&c.assertion,'every claim needs id, claim, assertion');
}
assert(Array.isArray(bp.build_steps)&&bp.build_steps.length===9,'DT-06 REV2 must be a complete nine-plate build manual');
for(const step of bp.build_steps){
  assert(step.title&&step.file&&step.done_state&&step.verification,'each build plate needs target, done-state and proof');
  assert(
    step.anchor_exact||step.route_anchor_exact||step.panel_anchor_exact||step.css_replace_exact||step.exact_assertions,
    'plate '+step.step+' needs an exact anchor/assertion surface'
  );
}

const runtimeImplemented=js.includes("const VIEW=Object.freeze({")&&js.includes('window.FACTORY_TWIN_VIEW_STATE=Object.freeze({');
if(!runtimeImplemented){
  function checkAnchor(target,anchor,label){
    const src=target==='pulse-beam-funnel-hall.js'?js:target==='pulse-beam-funnel-hall.html'?html:null;
    if(!src)return;
    for(const x of (Array.isArray(anchor)?anchor:[anchor]))assert(src.includes(x),label+' anchor drifted: '+x);
  }
  for(const step of bp.build_steps){
    if(step.anchor_exact)checkAnchor(step.file,step.anchor_exact,'plate '+step.step);
    if(step.route_anchor_exact)checkAnchor(step.file,step.route_anchor_exact,'plate '+step.step+' route');
    if(step.panel_anchor_exact)checkAnchor(step.file,step.panel_anchor_exact,'plate '+step.step+' panel');
  }
  const cssOld=bp.build_steps.find(x=>x.step===6).css_replace_exact.split('→')[0].trim();
  assert(html.includes(cssOld),'DT-06 CSS breakpoint anchor drifted');
}else{
  assert(js.includes("const semanticFactory=(twinValid?(twin.machines||[]):[])"));
  assert(js.includes("const semanticWip=(twinValid?(twin.work_orders||[]):[]).filter(o=>o.status!=='RELEASED')"));
  assert(html.includes('id="semantic-index-toggle"'));
  assert(html.includes('@media(max-width:720px)'));
}

for(const marker of [
  'SELL // THE BUG IS PHILOSOPHICAL',
  'SPEC // EXECUTE TO THE NAIL',
  'DATA // THE VALUES ARE THE FEATURE',
  'CLAIMS // EVERY LINE OWES PROOF',
  'VERIFY // NOT VIBES',
  'SEALED BLUEPRINT · BUILD',
  'class="plate"',
  '345048cb648d5f5b'
]) assert(visual.includes(marker),'visual blueprint missing standard marker '+marker);

assert(!/target=["']_blank["']/.test(visual),'DT-06 blueprint must not open owner links outside Pulse');
const hrefs=[...visual.matchAll(/href=["']([^"']+)["']/g)].map(m=>m[1]);
assert(hrefs.length>=4,'visual blueprint should expose SOP/standard/exemplar/self links');
for(const href of hrefs)assert(href.startsWith('pulse-dashboard.html?tool='),'owner-visible blueprint link must stay inside Pulse: '+href);

assert(ext.includes('"id":"blueprintdt06"'),'Pulse extensions must register DT-06 blueprint');
assert(ext.includes('"pulseOnly":true'),'DT-06 blueprint must suppress standalone open controls');
assert(ext.includes("_q.get('tool')||_q.get('component')"),'late extension registration must honor canonical ?tool= deep links');

assert(manifest.items&&manifest.items.blueprintdt06,'Pulse manifest must index DT-06 blueprint');
assert.equal(manifest.items.blueprintdt06.page,'pulse-dashboard.html?tool=blueprintdt06');
assert(manifest.items.blueprintdt06.honest_limits.includes('not DT-06 runtime implementation'));
assert(manifest.items.blueprintdt06.depends_on.includes('blueprint/dt06-mobile-semantic-parity.seal.v2.json'));
assert(build.includes("'blueprintdt06':"),'Pulse rebuild must preserve DT-06 blueprint manifest entry');

const touch=bp.builder_handoff.touch_order;
assert.deepEqual(touch,['pulse-beam-funnel-hall.js','pulse-beam-funnel-hall.html','tests/factory-twin-mobile-parity-checks.cjs']);
for(const x of ['factory-twin-core.js','funnel-kernel.js','software-factory-core.js'])assert(bp.builder_handoff.do_not_touch.includes(x));

if(runtimeImplemented){
  require('./funnel-build-loop-checks.cjs');
  require('./dt06-runtime-funnel-run.cjs');
  require('./factory-twin-mobile-parity-checks.cjs');
}
console.log('PASS: DT-06 REV2 remains a sealed executable Blueprint SOP artifact; when runtime is present, the automated Funnel build loop, separate v44 execution release, and mobile semantic-parity checks also pass.');
