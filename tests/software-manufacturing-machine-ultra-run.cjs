const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const bp=require('../blueprint/software-manufacturing-machine.blueprint.json');

const id='software-manufacturing-machine-v1';
Law.open({case_id:id,page0:bp.page0,scope:{project:'MOOR',surface:'Pulse Beam Funnel Citadel',goal:'truthful spatial software manufacturing'}});
Law.transition(id,'REFERENCES_BOUND',{references:[
  'blueprint/software-manufacturing-machine.blueprint.json',
  'blueprint/funnel-ultra-v44-migration.blueprint.json',
  'blueprint/funnel-law-ultra.blueprint.json',
  'funnel-law-core.js',
  'funnel-kernel.js',
  'pulse-beam-funnel-hall.js'
]},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:[
  'Which manufacturing benefits transfer cleanly to software without theatrical overhead?',
  'Which 3D objects are authoritative state and which are only architecture/decoration?',
  'What evidence must exist before a subsystem can render as healthy?',
  'How should failures, gaps, candidate state and shared/inherited authority appear?',
  'How do future rebuilds avoid erasing the live factory shell?'
]},'ultra-law');
Law.transition(id,'SOLVING',{decision:'Truthful spatial software factory',reason:bp.thesis},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'truth-model',scope:'software source of truth + 3D projection'},
  {id:'maintenance',scope:'machine-readable health/evidence'},
  {id:'factory-floor',scope:'human spatial representation'},
  {id:'build-integrity',scope:'prevent future shell clobber'},
  {id:'verification',scope:'maintenance sweep + regression'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{decision:bp.thesis,unresolved:[],manufacturing_map:bp.manufacturingMap.map(x=>x.manufacturing)},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/software-manufacturing-machine.blueprint.json',blueprint_data:bp,hash:R.hash(bp)},'ultra-law');
const br=Law.mintReceipt(id,'BlueprintReceipt',bp,'ultra-law',[],R.hash({factory:true,traceability:true}));
assert(R.verify(br));assert(Law.verifyReceipt(br));
const obligations=Law.extractObligations(bp.page0).map(o=>({...o,status:'satisfied'}));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(id).page0_hash,obligations,substitutions:[]},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse / Pulse Beam / Funnel Citadel'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse / Pulse Beam / Funnel Citadel',targets:bp.implementation},'ultra-law',[br.fingerprint],R.hash({targets:bp.implementation}));
assert(R.verify(er));assert(Law.verifyReceipt(er));
console.log(JSON.stringify({pass:true,case_id:id,law_version:Law.law_version,page0_hash:Law.get(id).page0_hash,blueprint_receipt:br.fingerprint,execution_receipt:er.fingerprint,state:Law.get(id).state},null,2));
