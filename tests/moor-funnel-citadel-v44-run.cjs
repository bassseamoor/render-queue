const assert=require('node:assert/strict');
const K=require('../funnel-kernel.js');
const bp=require('../blueprint/moor-funnel-citadel.super-blueprint.json');

K._resetForTests();
const request_id='moor-funnel-citadel-super-blueprint-v1';
const page0=bp.page0;
K.open({request_id,input:page0,source:'owner',context:{project:'MOOR OS',surface:'Pulse Beam / Funnel Hall',world:'Morverse',mode:'worldbuilding + implementation'}});

K.write({request_id,kind:'reference',value:{paths:bp.references},source:'repository-audit',provenance:'verified'});
K.write({request_id,kind:'evidence',value:{questions:bp.funnelQuestions,reason:'Open-ended material questions used to distill the location rather than presuppose a visual solution.'},source:'super-blueprint',provenance:'explicit'});
K.write({request_id,kind:'evidence',value:{beauty_contract:'BEAUTY-KERNEL.md',location_contract:'MOOR-WORLDBUILDING.md'},source:'repository',provenance:'verified'});

K.advance({request_id,stage:'references',provenance:'verified',payload:{reused:bp.references,missing:[]}});
K.advance({request_id,stage:'distill',provenance:'explicit',payload:{spec_draft:JSON.stringify({identity:bp.locationIdentity,architecture:bp.architecturalMasterplan,laser:bp.laserLanguage,life:bp.lifeSystems,property:bp.propertyPlan,worldbuilding:bp.worldbuildingContract,technical:bp.technicalPlan})}});
K.advance({request_id,stage:'decisions',provenance:'explicit',payload:{locked:[
  'Funnel Citadel is a real traversable Morverse/Pulse Beam location, not an image.',
  'Live Funnel graph remains semantic source of holographic geometry.',
  'Graph metaphor is laser/ring/lattice/glyph, not glass spheres.',
  'Architecture is a complete civic complex with meaningful zones and circulation.',
  'Future property is adjacent to civic value and cannot buy Funnel authority.',
  'Future-only social/economic systems are not presented as implemented.',
  'MOOR Location Contract v1 becomes reusable worldbuilding law for important locations.'
],unresolved:[]}});

const obligations=K.extractObligations(page0).map(o=>({id:o.id,source:o.source,status:'satisfied'}));
K.advance({request_id,stage:'replay',provenance:'verified',payload:{page0_verified:true,page0_hash:K.hash(page0),obligations,substitutions:[]}});

const spec={
  schema:'moor.funnel-citadel-execution-spec',
  version:1,
  blueprint:'blueprint/moor-funnel-citadel.super-blueprint.json',
  worldbuilding_contract:'MOOR-WORLDBUILDING.md',
  identity:bp.locationIdentity,
  architecture:bp.architecturalMasterplan,
  laser_language:bp.laserLanguage,
  life_systems:bp.lifeSystems,
  property_plan:bp.propertyPlan,
  technical_plan:bp.technicalPlan,
  build_now:bp.buildNow,
  future_phases:bp.futurePhases,
  obligations
};
K.advance({request_id,stage:'verdict',provenance:'verified',payload:{spec,destination:'Project Pulse / Pulse Beam / Funnel Hall',done_criteria:bp.doneCriteria}});
const session=K.inspect(request_id);
assert(session.receipt,'sealed Funnel must issue a receipt');
assert(K.verifyReceipt(session.receipt),'receipt must verify against sealed ledger');
const packet=K.executionPacket(session.receipt);
assert.equal(packet.destination,'Project Pulse / Pulse Beam / Funnel Hall');
assert(packet.spec.build_now.length>=7);
console.log(JSON.stringify({pass:true,request_id,law_version:K.law_version,page0_hash:session.stages.page0.raw_hash,receipt:session.receipt.fingerprint,destination:packet.destination,done_criteria:packet.done_criteria.length},null,2));
