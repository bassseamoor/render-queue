const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const blueprint=require('../blueprint/pulse-luxe-ui.blueprint.json');

const page0="Use the provided unloaded Verse screenshots as a literal visual systems reference for Pulse. Build, do not generate a picture. Apply the deep black/navy spatial field, hovering premium surfaces, bright white/ice-blue accent and emerald state light across Pulse, fix mobile interaction/overlap, and show the current Funnel in the same 3D configuration. Run this through the new Funnel, produce the blueprint, then build the result.";

const id='pulse-luxe-ui-v1';
const c=Law.open({case_id:id,page0,scope:{project:'Project Pulse',surfaces:['pulse','embedded-tools','funnel-environment']}});
assert.equal(c.state,'RECEIVED');

Law.transition(id,'REFERENCES_BOUND',{references:['IMG_4068.png','IMG_4067.png','blueprint/funnel-law-ultra.blueprint.json','pulse-dashboard.html','funnel-environment.html']},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{material_questions:[
  {q:'What properties of the reference must become system-wide laws rather than a single mockup?',answer:'spatial dark field, floating chrome, ice-white light, emerald state light, depth, mobile-safe hierarchy'},
  {q:'What must remain functional?',answer:'Pulse navigation, MOOR.request, embedded tools, Funnel tracing and v44 compatibility'},
  {q:'What should not happen?',answer:'No generated image, no decorative replacement of real content, no silent Ultra promotion'}
]},'ultra-law');
Law.transition(id,'SOLVING',{owner_confidence:.98,solver_confidence:null,note:'Direct explicit owner request; no fake independent solver swarm claimed.'},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'visual-system',scope:'shared palette/depth/surfaces'},
  {id:'mobile-shell',scope:'top rail + command dock + bottom dock collision removal'},
  {id:'funnel-view',scope:'current Funnel 3D visual alignment'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{decision:'one shared Luxe design law + shell overrides + current 3D Funnel styling',conflicts:[]},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/pulse-luxe-ui.blueprint.json',blueprint_hash:R.hash(blueprint)},'ultra-law');

const br=Law.mintReceipt(id,'BlueprintReceipt',blueprint,'ultra-law',[],R.hash({ui:true,mobile:true}));
assert(R.verify(br));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,obligations:[
  'actual UI build, not image',
  'system-wide visual law',
  'mobile interaction fixed',
  'current Funnel visible in 3D',
  'ice/white + emerald palette',
  'Ultra not silently promoted'
]},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse',blueprint:'blueprint/pulse-luxe-ui.blueprint.json'},'ultra-law',[br.fingerprint],R.hash({files:blueprint.implementation}));
assert(R.verify(er));

console.log(JSON.stringify({
  pass:true,
  law_version:Law.law_version,
  case_id:id,
  blueprint_receipt:br.fingerprint,
  execution_receipt:er.fingerprint,
  page0_hash:Law.get(id).page0_hash,
  state:Law.get(id).state
},null,2));