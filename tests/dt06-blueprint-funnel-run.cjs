const assert=require('node:assert/strict');
const RealDate=Date;
class FixedDate extends RealDate{
  constructor(...args){super(...(args.length?args:['2026-10-07T01:05:00.000Z']));}
  static now(){return RealDate.parse('2026-10-07T01:05:00.000Z');}
}
global.Date=FixedDate;
const K=require('../funnel-kernel.js');
const seal=require('../blueprint/dt06-mobile-semantic-parity.seal.v3.json');

const PAGE0=`Read the Blueprint SOP first: https://bassseamoor.github.io/render-queue/pulse-dashboard.html?tool=blueprintsop

Then the Blueprint Standard: https://bassseamoor.github.io/render-queue/pulse-dashboard.html?tool=blueprintstd

Then the exemplar of the bar — the rebuilt deep-links blueprint v2: https://bassseamoor.github.io/render-queue/pulse-dashboard.html?tool=blueprintdl

Correction for your in-progress blueprint work:

A blueprint is NOT a list of feature names. It is instructions for how to build the thing — mathematically worked out, calculated, prepared for execution to the nail. The more detailed the plan, the better the result.

Go deep — turtles all the way down. Every hook gets its exact anchor, exact code, exact values, and why each value is what it is. Every claim gets its verification assertion.

The infrastructure already exists. New work adds data points — so specify the data: the exact parameters, the exact values, the exact contract. Don't re-spec the platform.

And it must be exciting like a comic book. Progress needs to be cool. Intelligence and creativity need to be exciting — that's how it's sold. Clean docs are not the bar; visual drama is.

Run your work through the sealed funnel (v44) — no blueprint ships without a sealed verdict.

Everything lives in Pulse. Links open inside Pulse (dashboard?tool=<id>), never standalone files.

Continue your blueprint work under this SOP. When it's done, a builder should be able to execute it with no side conversations.`;

K._resetForTests();
const id=seal.request_id;
let s=K.open({request_id:id,input:PAGE0,source:'owner',context:{project:'MOOR Blueprint Farm',slice:'DT-06',mode:'blueprint-only'}});
const usagePlan=K.makeUsagePlan(PAGE0,{project:'MOOR Blueprint Farm',slice:'DT-06',mode:'blueprint-only',source:'owner'},{
  execution_plan:{
    build_required:true,
    builder:'Blueprint authoring only; no DT-06 runtime implementation',
    destination:'Project Pulse / dashboard?tool=blueprintdt06',
    reuse_before_new:true,
    steps:[
      'reuse SOP/Standard/exemplar and current Hall/Twin anchors',
      'author exact DT-06 blueprint delta',
      'verify blueprint claims and Pulse registration'
    ]
  },
  verification_plan:{
    compare_to_page0:true,
    require_done_criteria:true,
    verify_requested_path:true,
    checks:[
      'all Page 0 obligations accounted for',
      'usage plan followed or explicitly revised before references',
      'selected references/machinery provenance retained',
      'sealed v44 verdict validates',
      'exact live anchors and locked values are asserted',
      'all owner-visible links stay inside Pulse',
      'no DT-06 runtime implementation is claimed',
      'no unapproved substitution'
    ],
    write_failures_back_as_evidence:true
  },
  output_plan:{
    preserve_provenance:true,
    record_usage_plan:true,
    record_references:true,
    record_failures:true,
    compact_after_verification:true,
    pulse_tool:'blueprintdt06',
    presentation:'comic-book SELL/SPEC/SHOW with claim-level assertions'
  }
});
s=K.advance({request_id:id,stage:'usage_plan',payload:{plan:usagePlan},provenance:'system'});
assert.equal(s.stages.usage_plan.plan_hash,seal.usage_plan_hash,'checked-in seal must bind the current Page-0 usage plan');
s=K.advance({request_id:id,stage:'references',payload:{reused:[
  {id:'blueprint-sop.html',kind:'SOP'},
  {id:'blueprint-standard.html',kind:'standard'},
  {id:'blueprint-deep-links.html',kind:'exemplar'},
  {id:'blueprint/factory-digital-twin.blueprint.json',kind:'parent-blueprint'},
  {id:'factory-twin-core.js',kind:'semantic-source'},
  {id:'pulse-beam-funnel-hall.js',kind:'runtime-anchor'},
  {id:'pulse-beam-funnel-hall.html',kind:'runtime-anchor'},
  {id:'tests/factory-twin-citadel-binding-checks.cjs',kind:'existing-verifier'}
],missing:[]},provenance:'learned'});
s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:'Create DT-06 REV 2 as a sealed, Pulse-native, comic-book build blueprint for mobile semantic parity. It must specify exact existing anchors, exact patch code, exact numeric render-density values, the full semantic-parity contract, Pulse-only deep links, non-goals, and executable verification assertions. It authorizes blueprint publication only; it does not authorize DT-06 runtime implementation.'},provenance:'inferred'});
s=K.advance({request_id:id,stage:'decisions',payload:{locked:[
  {key:'slice',value:'DT-06'},
  {key:'artifact',value:'blueprint-dt06-mobile-parity.html'},
  {key:'pulse_tool',value:'blueprintdt06'},
  {key:'scope',value:'blueprint-only; no runtime implementation'},
  {key:'semantic_rule',value:'same FactoryTwinSnapshot truth on desktop and phone; only visual density may differ'},
  {key:'breakpoint_px',value:720},
  {key:'visual_caps',value:{machines:{mobile:24,desktop:72},routes:{mobile:36,desktop:120},wip:{mobile:12,desktop:32}}},
  {key:'pixel_ratio_caps',value:{mobile:1.2,desktop:1.8}},
  {key:'ring_segments',value:{mobile:64,desktop:128}},
  {key:'pulse_links_only',value:true}
],unresolved:[]},provenance:'explicit'});
const obligations=K.extractObligations(PAGE0).map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(PAGE0),obligations,substitutions:[]},provenance:'verified'});
s=K.advance({request_id:id,stage:'verdict',payload:{spec:{
  slice_id:'DT-06',
  artifact:'blueprint-dt06-mobile-parity.html',
  pulse_tool:'blueprintdt06',
  revision:2,
  scope:'blueprint-only',
  obligations
},destination:'Project Pulse / dashboard?tool=blueprintdt06',done_criteria:seal.done_criteria},provenance:'verified'});

assert(K.verifyReceipt(s.receipt),'v44 must verify its own receipt');
assert.equal(s.receipt.fingerprint,seal.receipt_fingerprint,'checked-in seal must match deterministic v44 receipt');
assert.equal(s.receipt.ledger_head,seal.ledger_head);
assert.equal(s.receipt.page0_hash,seal.page0_hash);
assert.equal(s.receipt.usage_plan_hash,seal.usage_plan_hash);
assert.equal(s.receipt.funnel_revision,seal.funnel_revision);
assert.equal(s.receipt.version,seal.kernel_receipt_version);
assert.equal(seal.verdict,'BUILD');
assert.equal(seal.runtime_implementation_authorized,false,'blueprint seal must not authorize DT-06 runtime implementation');

console.log(JSON.stringify({pass:true,law_version:K.law_version,funnel_revision:K.revision,usage_plan_hash:s.receipt.usage_plan_hash,verdict:seal.verdict,receipt:s.receipt.fingerprint,destination:s.receipt.destination,runtime_implementation_authorized:false},null,2));
