const assert=require('node:assert/strict');
const K=require('../funnel-kernel.js');
const Ch=require('../blueprint-choreography-core.js');
const choreography=require('../blueprint/blueprint-choreography.blueprint.json');
const evidence=require('../blueprint-choreography-state.json');

const PAGE0="Yep. I guess, uh, that's kind of the plan, right? Because we're storing this for later or something? For future reference so we can start building now? Okay, so now we're gonna start building. Build, build, using the funnels, build. Let the funnels tell you what to do. The funnels are making the plan. They're not the builders. You're the goddamn builders. They're telling you exactly what to do. You just gotta do it, get it done, following all the walls and the regulations and stuff.";

function run(id,distill,locked,spec,destination,done){
  K._resetForTests();
  let s=K.open({request_id:id,input:PAGE0,source:'owner',context:{project:'MOOR',mode:'build'}});
  s=K.advance({request_id:id,stage:'references',payload:{reused:[
    {id:'FUNNEL.md',kind:'law'},{id:'blueprint/blueprint-choreography.blueprint.json',kind:'plan'},
    {id:'blueprint-choreography-state.json',kind:'evidence'},{id:'blueprint-choreography-core.js',kind:'machine'}
  ],missing:[]},provenance:'learned'});
  s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:distill},provenance:'inferred'});
  s=K.advance({request_id:id,stage:'decisions',payload:{locked,unresolved:[]},provenance:'explicit'});
  const obligations=K.extractObligations(PAGE0).map(o=>({...o,status:'satisfied'}));
  s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(PAGE0),obligations,substitutions:[]},provenance:'verified'});
  s=K.advance({request_id:id,stage:'verdict',payload:{spec:{...spec,obligations},destination,done_criteria:done},provenance:'verified'});
  assert(K.verifyReceipt(s.receipt));
  return s.receipt;
}

const before=JSON.parse(JSON.stringify(evidence));
for(const id of ['CH-02','FM-01','FM-02','BF-02','PG-01','PG-02'])delete before.slices[id];
const snap=Ch.evaluate({choreography,evidence:before});
assert.equal(snap.recommendation.slice_id,'FM-01');
const afterFm01=JSON.parse(JSON.stringify(before));
afterFm01.slices['CH-02']=evidence.slices['CH-02'];
afterFm01.slices['FM-01']=evidence.slices['FM-01'];
const next=Ch.evaluate({choreography,evidence:afterFm01});
assert.equal(next.recommendation.slice_id,'FM-02');
const afterFm02=JSON.parse(JSON.stringify(afterFm01));
afterFm02.slices['FM-02']=evidence.slices['FM-02'];
const afterExercise=Ch.evaluate({choreography,evidence:afterFm02});
assert.equal(afterExercise.recommendation.slice_id,'BF-02');
const afterBf02=JSON.parse(JSON.stringify(afterFm02));
afterBf02.slices['BF-02']=evidence.slices['BF-02'];
const afterCompare=Ch.evaluate({choreography,evidence:afterBf02});
assert.equal(afterCompare.recommendation.slice_id,'PG-01');
const afterPg01=JSON.parse(JSON.stringify(afterBf02));
afterPg01.slices['PG-01']=evidence.slices['PG-01'];
const afterGenerators=Ch.evaluate({choreography,evidence:afterPg01});
assert.equal(afterGenerators.recommendation.slice_id,'PG-02');
const afterPg02=JSON.parse(JSON.stringify(afterPg01));
afterPg02.slices['PG-02']=evidence.slices['PG-02'];
const afterRecipe=Ch.evaluate({choreography,evidence:afterPg02});
assert.equal(afterRecipe.recommendation.slice_id,'WO-01');

const ch02=run(
  'owner-start-building-ch02-v1',
  'Build CH-02 as a read-only evidence-driven eligibility calculator. It may recommend but cannot release work.',
  [{key:'slice',value:'CH-02'},{key:'authority',value:'read-only/no-release'},{key:'next_advisory',value:'FM-01'}],
  {slice_id:'CH-02',task:'eligibility calculator',authority:'read-only',next_advisory:'FM-01'},
  'Project Pulse / Blueprint Farm',
  ['eligible and blocked slices derive from evidence','implemented-ahead-of-plan divergence stays visible','no automatic release authority exists']
);

const fm01=run(
  'owner-start-building-fm01-v1',
  'Build FM-01: a machine-readable inventory of Funnel authority, reasoning, manufacturing and observability mechanisms with owners, consumers, tests and maintenance classes. No behavior changes.',
  [{key:'slice',value:'FM-01'},{key:'selection_basis',value:'CH-02 advisory + owner delegated sequencing'},{key:'behavior_change',value:'none'}],
  {slice_id:'FM-01',task:'Funnel mechanism inventory',behavior_change:'none',selection_basis:'evidence-driven choreography'},
  'Project Pulse / Funnel maintenance',
  ['inventory is machine-readable','retained mechanisms name owners consumers tests and authority effects','unknowns remain explicit','no Funnel law or runtime behavior changes']
);

const fm02=run(
  'owner-start-building-fm02-v1',
  'Build FM-02: map which inventoried Funnel mechanisms are exercised by current production, capability, manufacturing, planning and observability workflows. Preserve unknown mechanisms and make no behavior changes.',
  [{key:'slice',value:'FM-02'},{key:'selection_basis',value:'CH-02 advisory after verified FM-01'},{key:'behavior_change',value:'none'}],
  {slice_id:'FM-02',task:'current-path exercise map',behavior_change:'none',selection_basis:'evidence-driven choreography'},
  'Project Pulse / Funnel maintenance',
  ['exercise map is machine-readable','real workflows name mechanisms and executable evidence','unknown/unexercised mechanisms stay explicit','no Funnel law or runtime behavior changes']
);
const bf02=run(
  'owner-start-building-bf02-v1',
  'Build BF-02: a read-only cross-blueprint comparison and unresolved-question inspector. It must expose assumptions, tensions, question queues, dependency defects and supersession lineage without releasing implementation work.',
  [{key:'slice',value:'BF-02'},{key:'selection_basis',value:'CH-02 advisory after verified FM-02'},{key:'authority',value:'read-only/no-release'}],
  {slice_id:'BF-02',task:'blueprint comparison and unresolved-question inspector',authority:'read-only'},
  'Project Pulse / Blueprint Farm',
  ['all farm blueprints can be compared','open questions stay attributable to source blueprints','assumption/interface/dependency tensions are visible','supersession lineage is visible when present','no release authority exists']
);
const pg01=run(
  'owner-start-building-pg01-v1',
  'Build PG-01: inventory MOOR procedural generators as reusable versioned factory machines with capabilities, input/output contracts, source/evidence references and conservative determinism levels.',
  [{key:'slice',value:'PG-01'},{key:'selection_basis',value:'CH-02 advisory after verified BF-02'},{key:'overclaim_rule',value:'no unproven D3 determinism'}],
  {slice_id:'PG-01',task:'procedural generator capability inventory',authority:'inventory only'},
  'Project Pulse / Procedural toolchain',
  ['generator identities and versions are stable','capabilities and I/O contracts are machine-readable','determinism claims remain evidence-scoped','existing tools are referenced rather than rewritten']
);
const pg02=run(
  'owner-start-building-pg02-v1',
  'Build PG-02: implement the versioned ProceduralRecipe, SemanticAnchor and ReconstructionReceipt contracts as executable validation machinery without yet adapting every generator.',
  [{key:'slice',value:'PG-02'},{key:'selection_basis',value:'CH-02 advisory after verified PG-01'},{key:'scope',value:'contracts and validation only'}],
  {slice_id:'PG-02',task:'procedural recipe contract',authority:'non-release validation'},
  'Project Pulse / Procedural toolchain',
  ['recipe/anchor/receipt schemas are versioned','generator binding and version are mandatory','anchors are stable and validatable','no generator is silently upgraded or substituted']
);
const wo01=run(
  'owner-start-building-wo01-v1',
  'Build WO-01: implement exact SliceRelease and WorkerJob contracts. Planning must not spawn workers; release packets must bind blueprint slice, Page 0, Funnel authority, repository base, owner approval, budget, scope, done criteria, verification and handoff.',
  [{key:'slice',value:'WO-01'},{key:'selection_basis',value:'CH-02 advisory after verified PG-02'},{key:'automation',value:'contracts only; no worker spawning'}],
  {slice_id:'WO-01',task:'slice release and worker job contracts',authority:'contract validation only'},
  'Project Pulse / Worker orchestration',
  ['SliceRelease is versioned and authority-bound','WorkerJob cannot exceed release scope','repository base and owner approval are mandatory','planning alone cannot spawn a worker']
);
console.log(JSON.stringify({pass:true,law_version:K.law_version,ch02_receipt:ch02.fingerprint,fm01_receipt:fm01.fingerprint,fm02_receipt:fm02.fingerprint,bf02_receipt:bf02.fingerprint,pg01_receipt:pg01.fingerprint,pg02_receipt:pg02.fingerprint,wo01_receipt:wo01.fingerprint,initial_recommendation:snap.recommendation,after_fm01:next.recommendation,after_fm02:afterExercise.recommendation,after_bf02:afterCompare.recommendation,after_pg01:afterGenerators.recommendation,after_pg02:afterRecipe.recommendation},null,2));
