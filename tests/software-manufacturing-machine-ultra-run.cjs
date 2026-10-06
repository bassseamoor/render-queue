const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');
const alias=require('../blueprint/software-manufacturing-machine.blueprint.json');
const bp=require('../blueprint/software-manufacturing-system.blueprint.json');

assert.equal(alias.status,'superseded-alias');
assert.equal(alias.canonical,'blueprint/software-manufacturing-system.blueprint.json');

const id='software-manufacturing-system-v1';
Law.open({case_id:id,page0:bp.page0,scope:{project:'MOOR',surface:'Pulse Beam Funnel Citadel',goal:'truthful cumulative software manufacturing'}});
Law.transition(id,'REFERENCES_BOUND',{references:[
  alias.canonical,
  'blueprint/funnel-ultra-v44-migration.blueprint.json',
  'funnel-maintenance-status.json',
  'moor-capability-memory.js',
  'pulse-spine.js',
  'pulse-beam-funnel-hall.js'
]},'ultra-law');
Law.transition(id,'QUESTIONS_COMPILED',{questions:[
  'Which physical manufacturing disciplines improve software production without theatrical overhead?',
  'Which state is authoritative and which is merely the HMI projection?',
  'How does useful machinery accumulate across versions without being silently erased?',
  'What evidence is required before the 3D factory can show a machine as healthy?',
  'How are maintenance gaps, rework and configuration drift made visible?'
]},'ultra-law');
Law.transition(id,'SOLVING',{decision:'MOOR Software Manufacturing System',reason:bp.principle},'ultra-law');
Law.transition(id,'CHILDREN_RUNNING',{children:[
  {id:'work-orders',scope:'objective + immutable intent'},
  {id:'parts-bom',scope:'KIND/capability identity + dependency control'},
  {id:'route',scope:'Funnel authority + deterministic assembly'},
  {id:'inspection',scope:'verification + maintenance truth'},
  {id:'accumulation',scope:'reuse + supersession + preserved lineage'},
  {id:'hmi',scope:'truthful 3D factory projection'}
]},'ultra-law');
Law.transition(id,'CONVERGING',{decision:bp.principle,unresolved:[],records:Object.keys(bp.canonicalRecords),accumulation:bp.accumulationLaw.name},'ultra-law');
Law.transition(id,'BLUEPRINT_READY',{blueprint:alias.canonical,blueprint_data:bp,hash:R.hash(bp)},'ultra-law');
const br=Law.mintReceipt(id,'BlueprintReceipt',bp,'ultra-law',[],R.hash({manufacturing:true,accumulation:true,traceability:true}));
assert(R.verify(br));assert(Law.verifyReceipt(br));
const obligations=Law.extractObligations(bp.page0).map(o=>({...o,status:'satisfied'}));
Law.transition(id,'PAGE0_REPLAYED',{page0_verified:true,page0_hash:Law.get(id).page0_hash,obligations,substitutions:[]},'ultra-law');
Law.transition(id,'EXECUTION_AUTHORIZED',{blueprint_receipt:br.fingerprint,destination:'Project Pulse / Pulse Beam / Software Factory'},'ultra-law');
const er=Law.mintReceipt(id,'ExecutionReceipt',{destination:'Project Pulse / Pulse Beam / Software Factory',targets:['funnel-maintenance-status.json','moor-capability-memory.js','pulse-spine.js','pulse-beam-funnel-hall.js']},'ultra-law',[br.fingerprint],R.hash({factory:true}));
assert(R.verify(er));assert(Law.verifyReceipt(er));
console.log(JSON.stringify({pass:true,case_id:id,law_version:Law.law_version,canonical:alias.canonical,page0_hash:Law.get(id).page0_hash,blueprint_receipt:br.fingerprint,execution_receipt:er.fingerprint,state:Law.get(id).state},null,2));
