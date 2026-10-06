const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const bp=require('../blueprint/grounded-readiness-law.blueprint.json');

const page0=bp.privacy.public_page0;
const id='grounded-readiness-ultra-v1';
Law.open({case_id:id,page0,scope:{project:'MOOR',surface:'Buster + Ultra candidate law + Funnel Fabric'}});
Law.transition(id,'REFERENCES_BOUND',{references:[
  'blueprint/grounded-readiness-law.blueprint.json',
  'blueprint/funnel-law-ultra.blueprint.json',
  'blueprint/funnel-ultra-v44-migration.blueprint.json',
  'BUSTER.md'
]},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:bp.questionBlueprint},'ultra-law');
Law.transition(id,'SOLVING',{decision:'Grounded Readiness / 99-1 posture',reason:bp.thesis},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'reality',scope:'inconvenient facts + self-fallibility'},
  {id:'readiness',scope:'preparation before opportunity'},
  {id:'commitment',scope:'bounded cost + thresholds'},
  {id:'guardrails',scope:'reciprocity, agency, stop conditions'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{decision:bp.thesis,unresolved:[],laws:bp.laws.map(x=>x.id)},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/grounded-readiness-law.blueprint.json',blueprint_data:bp,hash:R.hash(bp)},'ultra-law');

const br=Law.mintReceipt(id,'BlueprintReceipt',bp,'ultra-law',[],R.hash({grounded_readiness:true}));
assert(R.verify(br));assert(Law.verifyReceipt(br));

const replayObligations=Law.extractObligations(page0).map(o=>({...o,status:'satisfied'}));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(id).page0_hash,obligations:replayObligations,substitutions:[]},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'BUSTER.md + Ultra candidate law + Pulse Funnel Fabric'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'BUSTER.md + Ultra candidate law + Pulse Funnel Fabric',targets:bp.implementation},'ultra-law',[br.fingerprint],R.hash({targets:bp.implementation}));
assert(R.verify(er));assert(Law.verifyReceipt(er));

console.log(JSON.stringify({pass:true,case_id:id,law_version:Law.law_version,page0_hash:Law.get(id).page0_hash,blueprint_receipt:br.fingerprint,execution_receipt:er.fingerprint,state:Law.get(id).state},null,2));
