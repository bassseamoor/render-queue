const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const blueprint=require('../blueprint/capability-crystallizer.blueprint.json');

const page0="Does every MOOR blueprint/build leave behind enough deterministic structure to be reassembled without an LLM and enough verified typed capability data for the environment to become more capable over time? If not, derive the correct questions, build the system, and push it to Pulse.";
const id='capability-crystallizer-v1';
Law.open({case_id:id,page0,scope:{project:'MOOR',targets:['blueprints','build-specs','verified-builds','Pulse']}});
Law.transition(id,'REFERENCES_BOUND',{references:[
  'blueprint/funnel-law-ultra.blueprint.json',
  'funnel-package-registry.js',
  'pulse-spine.js',
  'moor-harness-runtime-v1.html',
  'pulse-manifest.json'
]},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:blueprint.materialQuestions},'ultra-law');
Law.transition(id,'SOLVING',{decision:'Crystal Loop',reason:'Separate deterministic assembly, verified capability, compact learning and unverified extrapolation.'},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'assembly-contract',scope:'model-free reconstruction'},
  {id:'capability-delta',scope:'verified reusable capability'},
  {id:'composition-graph',scope:'deterministic extrapolation'},
  {id:'pulse-memory',scope:'continuous ingestion and visibility'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{architecture:blueprint.answer.architectureName,conflicts:[]},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:'blueprint/capability-crystallizer.blueprint.json',hash:R.hash(blueprint)},'ultra-law');
const br=Law.mintReceipt(id,'BlueprintReceipt',blueprint,'ultra-law',[],R.hash({crystal:true}));
assert(R.verify(br));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,obligations:blueprint.acceptance},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse + MOOR runtime'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse + MOOR runtime',targets:blueprint.buildTargets},'ultra-law',[br.fingerprint],R.hash({targets:blueprint.buildTargets}));
assert(R.verify(er));
console.log(JSON.stringify({pass:true,case_id:id,law_version:Law.law_version,page0_hash:Law.get(id).page0_hash,blueprint_receipt:br.fingerprint,execution_receipt:er.fingerprint,state:Law.get(id).state},null,2));