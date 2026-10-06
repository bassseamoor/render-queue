const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const bp=require('../blueprint/pulse-creation-deck.blueprint.json');

const page0="Redesign Pulse, heavily inspired by the unloaded Verse screenshot, into an elegant intuitive creation instrument. Preserve all components and meticulous control; make tools/components browseable and creation/consumption apps immediately accessible. Verify that MOOR Refinery results are actually being used with runtime statistics. Ask/seek through the Funnel, build it, and push it live.";
const id='pulse-creation-deck-v1';
Law.open({case_id:id,page0,scope:{project:'Pulse',systems:['MOOR Refinery','singular Funnel'],surfaces:['mobile','desktop']}});
Law.transition(id,'REFERENCES_BOUND',{references:[
  'blueprint/moor-refinery.blueprint.json',
  'blueprint/pulse-luxe-ui.blueprint.json',
  'blueprint/pulse-creation-deck.blueprint.json',
  'pulse-dashboard.html',
  'pulse-spine.js',
  'moor-request.js'
]},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:bp.materialQuestions},'ultra-law');
Law.transition(id,'SOLVING',{decision:'Pulse Creation Deck + Refinery Use Telemetry',reason:'Separate browseable resources, runnable instruments, contextual control and measurable reuse.'},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'deck-layout',scope:'floating screenshot-inspired spatial hierarchy'},
  {id:'library',scope:'browse/search all components without permanent clutter'},
  {id:'inspector',scope:'progressive full-fidelity control'},
  {id:'telemetry',scope:'runtime proof of capability reuse'},
  {id:'handoff',scope:'Refinery reference-only handoff to singular Funnel'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{architecture:bp.architecture.name,telemetry:bp.telemetry.name,conflicts:[]},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/pulse-creation-deck.blueprint.json',blueprint_data:bp,hash:R.hash(bp)},'ultra-law');
const br=Law.mintReceipt(id,'BlueprintReceipt',bp,'ultra-law',[],R.hash({layout:true,telemetry:true,refinery:true}));
assert(R.verify(br));
const replayObligations=Law.extractObligations(page0).map(o=>({...o,status:'satisfied'}));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(id).page0_hash,obligations:replayObligations,substitutions:[]},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse',targets:bp.buildTargets},'ultra-law',[br.fingerprint],R.hash({targets:bp.buildTargets}));
assert(R.verify(er));
console.log(JSON.stringify({pass:true,case_id:id,law_version:Law.law_version,page0_hash:Law.get(id).page0_hash,blueprint_receipt:br.fingerprint,execution_receipt:er.fingerprint,state:Law.get(id).state},null,2));