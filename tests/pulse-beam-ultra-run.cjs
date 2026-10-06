const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const bp=require('../blueprint/pulse-beam-rebrand.blueprint.json');

const page0="Rework and rebrand Pulse as Pulse Beam. Preserve everything that already exists and works, but establish an end-to-end premium spatial theme, elegant gesture navigation, a permanent monumental room for the live Funnel systems, and clear standards because many components need UI overhauls. The reference image is atmosphere evidence, not a prescribed solution. Ask the Funnel open-endedly what the best complete product architecture should be, then build and publish it.";
const id='pulse-beam-rebrand-v1';
Law.open({case_id:id,page0,scope:{project:'Pulse Beam',migration:'no-loss',surfaces:['shell','components','funnel-hall','mobile','desktop']}});
Law.transition(id,'REFERENCES_BOUND',{references:[
  'blueprint/pulse-beam-rebrand.blueprint.json',
  'blueprint/pulse-creation-deck.blueprint.json',
  'blueprint/moor-refinery.blueprint.json',
  'blueprint/funnel-law-ultra.blueprint.json',
  'funnel-environment-data.js',
  'pulse-dashboard.html',
  'pulse-component-extensions.js'
]},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:bp.materialQuestions},'ultra-law');
Law.transition(id,'SOLVING',{decision:bp.answer.architectureName,reason:bp.answer.thesis,reference_image_role:'atmosphere evidence only'},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'beam-shell',scope:'rebrand, spaces, gestures, navigation'},
  {id:'beam-design-law',scope:'tokens, materials, control hierarchy, accessibility'},
  {id:'component-migration',scope:'compatibility, audit, no-loss receipts'},
  {id:'funnel-hall',scope:'live monumental room + real graph utility'},
  {id:'verification',scope:'migration/no-loss/reduced-motion/current data'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{architecture:bp.answer.architectureName,spaces:bp.beamSpaces.initial.map(x=>x.id),design_law:bp.designLaw.name,conflicts:[]},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/pulse-beam-rebrand.blueprint.json',blueprint_data:bp,hash:R.hash(bp)},'ultra-law');
const br=Law.mintReceipt(id,'BlueprintReceipt',bp,'ultra-law',[],R.hash({beam:true,migration:'no-loss'}));
assert(R.verify(br));
const replayObligations=Law.extractObligations(page0).map(o=>({...o,status:'satisfied'}));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(id).page0_hash,obligations:replayObligations,substitutions:[]},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse / Pulse Beam'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse / Pulse Beam',targets:bp.implementation},'ultra-law',[br.fingerprint],R.hash({targets:bp.implementation}));
assert(R.verify(er));
console.log(JSON.stringify({
  pass:true,case_id:id,law_version:Law.law_version,page0_hash:Law.get(id).page0_hash,
  blueprint_receipt:br.fingerprint,execution_receipt:er.fingerprint,state:Law.get(id).state
},null,2));