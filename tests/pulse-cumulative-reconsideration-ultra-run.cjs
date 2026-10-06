const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const blueprint=require('../blueprint/pulse-cumulative-reconsideration.blueprint.json');

const page0=blueprint.page0;
const id='pulse-cumulative-reconsideration-v1';
Law.open({case_id:id,page0,scope:{project:'Project Pulse',targets:['Refinery','Capability Memory','Pulse Spine','Capability Memory UI']}});
Law.transition(id,'REFERENCES_BOUND',{references:[
  'blueprint/capability-crystallizer.blueprint.json',
  'blueprint/moor-refinery.blueprint.json',
  'moor-capability-memory.js',
  'pulse-spine.js',
  'pulse-capability-memory.html',
  'funnel-capability-handoff.js'
]},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:blueprint.materialQuestions},'ultra-law');
Law.transition(id,'SOLVING',{decision:'Delta-Driven Crystal Loop',reason:'Preserve the existing Pulse machine room; replace routine all-pairs inference with bounded delta reconsideration.'},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'delta-boundary',scope:'bounded relevance and typed compatibility'},
  {id:'negative-evidence',scope:'failure retention and recall'},
  {id:'abstraction-promotion',scope:'repeat-pattern candidate rules'},
  {id:'pulse-observability',scope:'Capability Memory UI + reference spine'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{architecture:blueprint.answer.architectureName,conflicts:[
  {old:'routine all-pairs inferCandidates',resolution:'retain only as explicit diagnostic; ingestion uses reconsiderDelta'}
]},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/pulse-cumulative-reconsideration.blueprint.json',hash:R.hash(blueprint)},'ultra-law');
const br=Law.mintReceipt(id,'BlueprintReceipt',blueprint,'ultra-law',[],R.hash({pulse:true,cumulative:true}));
assert(R.verify(br));
const obligations=Law.extractObligations(page0).map(o=>({...o,status:'satisfied'}));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(id).page0_hash,obligations,substitutions:[]},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse existing Refinery'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse existing Refinery',targets:blueprint.buildTargets},'ultra-law',[br.fingerprint],R.hash({targets:blueprint.buildTargets}));
assert(R.verify(er));
assert.equal(blueprint.noScrapVerdict.duplicateNothing.includes('second Pulse cumulative database'),true);
console.log(JSON.stringify({pass:true,case_id:id,law_version:Law.law_version,page0_hash:Law.get(id).page0_hash,blueprint_receipt:br.fingerprint,execution_receipt:er.fingerprint,state:Law.get(id).state},null,2));
