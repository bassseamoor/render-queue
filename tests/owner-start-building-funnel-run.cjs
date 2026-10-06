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

const snap=Ch.evaluate({choreography,evidence});
assert.equal(snap.recommendation.slice_id,'FM-01');

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

console.log(JSON.stringify({pass:true,law_version:K.law_version,ch02_receipt:ch02.fingerprint,fm01_receipt:fm01.fingerprint,recommendation:snap.recommendation},null,2));
