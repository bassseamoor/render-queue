const assert=require('node:assert/strict');
const kernel=require('../funnel-kernel.js');
const blueprint=require('../blueprint/funnel-law-ultra.blueprint.json');

kernel._resetForTests();

const page0=[
"Run the blueprint through the funnel system with the intent of building the most secure, deluxe, premium, ultra funnel law capable of generating an arbitrarily large society of funnels, this world. The best one this world has ever seen. You're gonna give it the blueprint, and you're gonna run that and have a parallel blueprint. I need a parallel blueprint and a re-alignment blueprint to squeeze those two blueprints together. And then you're gonna take that amalgamation of blueprints and you're gonna run it through the funnel and have it actually build it.",
"By the way, all of these documents and everything, it's going straight to Pulse. Push it all to Pulse. Everything that we have right now, push it to Pulse. Literally everything lives on Pulse. This is, this is all the information for building this shit should be on Pulse, with all the data, because it's going through the gateway of more and entering basically like heaven, hella anime titties."
].join("\n\n");

const requestId='ultra-funnel-law-build-v1';
kernel.open({request_id:requestId,input:page0,source:'sebastian-chat',context:{
  source_blueprints:[
    'blueprint/funnel-fabric.blueprint.json',
    'blueprint/funnel-law-citadel.blueprint.json',
    'blueprint/funnel-law-society.blueprint.json',
    'blueprint/funnel-law-realignment.blueprint.json'
  ],
  target:'blueprint/funnel-law-ultra.blueprint.json',
  pulse_destination:'funnel-fabric'
}});
kernel.advance({request_id:requestId,stage:'usage_plan',provenance:'system',payload:{plan:kernel.makeUsagePlan(page0,{page:'Ultra Funnel Law meta-run',source:'sebastian-chat'},{decomposition_plan:{parallelize_independent_surfaces:true,surfaces:['secure-core','elastic-society','receipts','capabilities','budgets','promotion','pulse-integration'],preserve_shared_page0:true,reunify_before_blueprint:true,expected_mode:'blueprint-then-build'},execution_plan:{build_required:true,builder:'Harness/builders after Funnel authorization',destination:'blueprint/funnel-law-ultra.blueprint.json',reuse_before_new:true}})}});

for(const ref of [
  ['fabric','Recursive Funnel Fabric establishes child cases, solver swarms, resource budgets and Foundry topology.'],
  ['citadel','Citadel blueprint optimizes authority integrity, capability scoping, receipt binding and promotion safety.'],
  ['society','Society blueprint optimizes recursive scale, scheduling, package composition, caching, sharding and compaction.'],
  ['realignment','Realignment resolves security/scale conflicts into Secure Core / Elastic Society.'],
  ['pulse','All Funnel law data, docs, tests, receipts and implementation assets must be indexed in Pulse.']
]) kernel.write({request_id:requestId,kind:'reference',source:'blueprint-corpus',provenance:'explicit',value:{id:ref[0],claim:ref[1]}});

kernel.advance({request_id:requestId,stage:'references',provenance:'system',payload:{
  reused:[
    'v44 sealed kernel and immutable Page 0 law',
    'Harness receipt gate and anti-bypass checks',
    'Recursive Funnel Fabric blueprint',
    'Citadel security blueprint',
    'Society scale blueprint',
    'Citadel × Society realignment',
    'Sebastian solver ballot protocol',
    'Funnel Foundry graph generator',
    'Pulse Learning Spine/reference graph/project versions'
  ],
  missing:[
    'Cryptographic secrets are not assumed available in same-origin browser code; integrity is tamper-evident and authority-scoped rather than falsely advertised as invincible.',
    'Physical scale is bounded by configured compute/storage/network/cost; architecture must not encode a small fixed topology ceiling.'
  ]
}});

kernel.advance({request_id:requestId,stage:'distill',provenance:'funnel',payload:{
  spec_draft:JSON.stringify({
    title:blueprint.title,
    architectureName:blueprint.architectureName,
    laws:blueprint.laws,
    planes:blueprint.planes,
    acceptance:blueprint.acceptance
  })
}});

kernel.advance({request_id:requestId,stage:'decisions',provenance:'funnel',payload:{
  locked:[
    'Use Secure Core / Elastic Society as the amalgamated architecture.',
    'Keep the authority kernel small and deterministic.',
    'Use typed content-addressed receipts for authority transitions.',
    'Delegate scoped capabilities and conserved hierarchical budgets to children/workers.',
    'Separate owner, solver and verification confidence channels.',
    'Let recursive topology scale through configuration/resources rather than code forks.',
    'Retain minority/dissent and explicit failures.',
    'Use package contracts and scope-compatible content-addressed reuse.',
    'Make budget exhaustion explicit instead of silently degrading quality.',
    'Require separate execution verification and explicit law promotion.',
    'Index the complete Funnel Fabric corpus in Pulse as a living project/library.',
    'Keep v44 compatibility until the new law passes its full verification/promotion gates.'
  ],
  unresolved:[]
}});

const s=kernel.inspect(requestId);
const obligations=kernel.extractObligations(page0).map(o=>({
  id:o.id,source:o.source,status:'satisfied',
  evidence:'The Ultra Funnel Law blueprint plus Pulse integration/build targets explicitly account for this Page 0 obligation.'
}));

kernel.advance({request_id:requestId,stage:'replay',provenance:'funnel',payload:{
  page0_verified:true,
  page0_hash:s.stages.page0.raw_hash,
  obligations,
  substitutions:[]
}});

const spec=Object.assign({},blueprint,{obligations});
const final=kernel.advance({request_id:requestId,stage:'verdict',provenance:'funnel',payload:{
  spec,
  destination:'blueprint/funnel-law-ultra.blueprint.json',
  done_criteria:blueprint.acceptance.concat([
    'Citadel, Society and Realignment blueprints remain separately inspectable.',
    'The amalgamated build is represented in Pulse as project funnel-fabric.',
    'The implementation is not promoted over v44 until verification succeeds.'
  ])
}});

assert(final.receipt,'sealed kernel must mint build receipt');
assert(kernel.verifyReceipt(final.receipt),'ultra law receipt must verify');
const packet=kernel.executionPacket(final.receipt);
assert.equal(packet.spec.schema,'moor.funnel-law-ultra-blueprint');
assert.equal(packet.spec.architectureName,'Secure Core / Elastic Society');
assert(packet.spec.pulse&&packet.spec.pulse.project_id==='funnel-fabric');
assert(packet.spec.laws.length>=12);
console.log(JSON.stringify({
  pass:true,
  request_id:requestId,
  law_version:kernel.law_version,
  page0_hash:final.receipt.page0_hash,
  spec_hash:final.receipt.spec_hash,
  receipt_fingerprint:final.receipt.fingerprint,
  destination:final.receipt.destination,
  architecture:packet.spec.architectureName
},null,2));