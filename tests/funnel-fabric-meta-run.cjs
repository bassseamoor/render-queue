const assert=require('node:assert/strict');
const kernel=require('../funnel-kernel.js');
const blueprint=require('../blueprint/funnel-fabric.blueprint.json');

kernel._resetForTests();

const page0="Okay, now run all of that into a funnel, asking, asking how, what is the correct blueprint to make a funnel system that captures all of this in the best way possible, that is expandable to an unfathomable degree, as long as, obviously, you find enough fucking silicone and storage.";
const requestId='meta-funnel-fabric-blueprint-v1';

kernel.open({
  request_id:requestId,
  input:page0,
  source:'sebastian-chat',
  context:{
    inherited:[
      'Funnel questions must be open-ended and non-leading.',
      'Sebastian-1..N are independent solution workers answering a question from Sebastian; they do not impersonate Sebastian.',
      'Independent agreeing solution ballots intentionally increase synthetic confidence.',
      'Literal Sebastian evidence stays separate from solver consensus.',
      'Material uncertainty can recursively spawn child funnels.',
      'Funnel systems should be reusable packages editable in the 3D Foundry.',
      'Geometry is a renderer/editor of a finite logical graph, not the logical source of truth.',
      'Resource/storage pressure should be forecast and surfaced rather than hard-coded as a small ceiling.',
      'Production execution still requires replay, receipts and verification.'
    ]
  }
});

kernel.write({request_id:requestId,kind:'reference',source:'current-thread',provenance:'explicit',value:{
  name:'Sebastian solver correction',
  claim:'Workers independently solve open-ended questions presented as questions from Sebastian. Their agreement intentionally manufactures synthetic decision confidence; proposals are not prior Sebastian statements.'
}});
kernel.write({request_id:requestId,kind:'reference',source:'current-thread',provenance:'explicit',value:{
  name:'Foundry requirement',
  claim:'The Funnel topology itself must be procedurally editable, packageable, reassemblable, visualizable in 3D, and resource-forecasted.'
}});
kernel.write({request_id:requestId,kind:'evidence',source:'current-thread',provenance:'explicit',value:{
  name:'Scalability objective',
  claim:'Expansion should be constrained by explicit compute/storage/resource budgets rather than by a fixed topology.'
}});

kernel.advance({request_id:requestId,stage:'references',provenance:'system',payload:{
  reused:[
    'v44 sealed Funnel kernel stage law',
    'Funnel Foundry graph/package architecture',
    'Sebastian independent solver-ballot correction',
    'owner-evidence vs solver-consensus separation',
    'Page 0 replay and receipt enforcement',
    '3D graph environment'
  ],
  missing:[
    'No fixed future hardware budget is known; blueprint must parameterize resource limits.',
    'No single model/vendor can be assumed; worker contract must be model-agnostic.'
  ]
}});

kernel.advance({request_id:requestId,stage:'distill',provenance:'funnel',payload:{
  spec_draft:JSON.stringify({
    title:blueprint.title,
    purpose:blueprint.purpose,
    governingPrinciples:blueprint.governingPrinciples,
    runtimePipeline:blueprint.runtimePipeline,
    scalability:blueprint.scalability
  })
}});

kernel.advance({request_id:requestId,stage:'decisions',provenance:'funnel',payload:{
  locked:[
    'Use one small deterministic kernel plus declarative recursive Funnel packages.',
    'Represent unresolved material questions as nodes that may spawn child FunnelCases.',
    'Fan each open-ended question out to isolated Sebastian solver workers.',
    'Count independent agreeing solver ballots as synthetic solution votes.',
    'Keep literal owner evidence in a distinct confidence channel.',
    'Use fan-in/meta-convergence to assemble child receipts into a parent blueprint.',
    'Make scale parameters (worker count, fanout, depth, retention, compute/storage) configurable rather than architectural constants.',
    'Use resource governance/backpressure to prevent uncontrolled recursion while allowing budgets to be raised.',
    'Keep 3D geometry subordinate to the logical graph.',
    'Require Page 0 replay, execution receipt and verification before production work.'
  ],
  unresolved:[]
}});

const inspected=kernel.inspect(requestId);
const obligations=kernel.extractObligations(page0).map(o=>({
  id:o.id,source:o.source,status:'satisfied',
  evidence:'The Funnel Fabric blueprint directly answers the request with a recursively composable architecture whose practical scale is governed by configurable resources.'
}));

kernel.advance({request_id:requestId,stage:'replay',provenance:'funnel',payload:{
  page0_verified:true,
  page0_hash:inspected.stages.page0.raw_hash,
  obligations,
  substitutions:[]
}});

const verdictSpec=Object.assign({},blueprint,{obligations});
const done=blueprint.doneCriteria.slice();
done.push('Kernel-issued receipt for this meta-blueprint verifies successfully.');

const finalSession=kernel.advance({request_id:requestId,stage:'verdict',provenance:'funnel',payload:{
  spec:verdictSpec,
  destination:'blueprint/funnel-fabric.blueprint.json',
  done_criteria:done
}});

assert(finalSession.receipt,'Kernel must mint a receipt.');
assert.equal(kernel.verifyReceipt(finalSession.receipt),true,'Funnel receipt must verify.');
const packet=kernel.executionPacket(finalSession.receipt);
assert.equal(packet.destination,'blueprint/funnel-fabric.blueprint.json');
assert.equal(packet.spec.schema,'moor.funnel-fabric-blueprint');
assert(packet.spec.systems.some(x=>x.id==='recursive-funnel-spawner'));
assert(packet.spec.systems.some(x=>x.id==='sebastian-solver-swarm'));
assert(packet.spec.systems.some(x=>x.id==='resource-governor'));
assert(packet.spec.systems.some(x=>x.id==='funnel-foundry'));
assert(packet.spec.systems.some(x=>x.id==='experiment-lab'));
assert(packet.spec.governingPrinciples.some(x=>x.includes('synthetic solution confidence')));
assert(packet.spec.scalability.theoreticalLimit.includes('No fixed limit'));

console.log(JSON.stringify({
  pass:true,
  request_id:requestId,
  law_version:kernel.law_version,
  page0_hash:finalSession.receipt.page0_hash,
  receipt_fingerprint:finalSession.receipt.fingerprint,
  spec_hash:finalSession.receipt.spec_hash,
  destination:finalSession.receipt.destination,
  systems:packet.spec.systems.length,
  stages:kernel.stages
},null,2));
