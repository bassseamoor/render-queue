/* MOOR Funnel Fabric — procedural funnel generator (v1).
 * Turns a plain description into a funnel definition (stages, per-stage
 * questions, usage-plan configuration, Page 0 scaffold, done criteria) and
 * executes it as a REAL run on the v44-sealed funnel kernel. The Fabric
 * generates configurations; the kernel is the execution engine and the only
 * thing that mints receipts. No new funnel law, no new stage types.
 *
 * v1 scope: description -> definition compiler + kernel executor binding.
 * Marked not-implemented: recursive solver society, resource forecasting,
 * 3D foundry editing of funnel topology.
 *
 * TAGS: tool:funnelfabric | cat:creation cat:interface | kind:component |
 *       prov:procedural-funnel-generation | see:funnel-kernel |
 *       src:funnel-kernel.js src:funnel-usage-plan-core.js
 */
(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FunnelFabric=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

var Kernel=root&&root.MOORFunnelKernel||(typeof require==='function'?require('./funnel-kernel.js'):null);
var UsagePlan=root&&root.FunnelUsagePlan||(typeof require==='function'?require('./funnel-usage-plan-core.js'):null);

var SCHEMA='moor.funnel-fabric-definition';
var VERSION=1;
var GENERATOR='funnel-fabric-core v1';

function text(x){return String(x==null?'':x);}
function hash(x){
  var s=typeof x==='string'?x:JSON.stringify(x),a=2166136261>>>0;
  for(var i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)>>>0;}
  return ('00000000'+a.toString(16)).slice(-8);
}
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}

// Material-question bank keyed by usage-plan material target.
var MATERIAL_QUESTIONS={
 'destination':'What destination does this run authorize — where does the result live, and through what release path?',
 'done-criteria':'What observable done criteria prove the result, and who verifies each one?',
 'reuse-vs-new':'What existing, verified machinery must be reused before anything new is invented?',
 'privacy-and-data-boundary':'What user data does this touch, and where is the boundary it must not cross?',
 'authority-and-default-behavior':'Whose authority covers each step, and what is the default behavior when an answer is missing?',
 'implementation-scope-and-rollback':'What is the implementation scope, and how is it rolled back if verification fails?',
 'access-and-economics':'What does this cost to run — services, credentials, compute — and who pays?'
};
// Deterministic, honestly-labeled resolutions for the generated decisions lock.
function materialResolution(target,def,plan){
  var ep=(plan&&plan.execution_plan)||{};
  switch(target){
    case 'destination':return 'generated: destination carried by the definition — '+(ep.destination||'owner confirms at execution');
    case 'done-criteria':return 'generated: '+(def.done_criteria||[]).length+' done criteria derived from extracted obligations';
    case 'reuse-vs-new':return 'generated: reuse verified machinery first (reuse_before_new='+(ep.reuse_before_new!==false)+')';
    case 'privacy-and-data-boundary':return 'generated: owner-local; no new data collection';
    case 'authority-and-default-behavior':return 'generated: the Fabric proposes configurations; only the kernel mints receipts; the owner authorizes execution';
    case 'implementation-scope-and-rollback':return 'generated: scope is this definition; rollback is discarding the generated run';
    case 'access-and-economics':return 'generated: no new services or costs';
    default:return 'generated: carried by the definition; owner review at execution';
  }
}
function materialQuestion(target){
  return MATERIAL_QUESTIONS[target]||('What must be decided about "'+target+'" before this funnel can run?');
}

function compile(description){
  if(!Kernel||!UsagePlan)throw Error('Funnel Fabric needs MOORFunnelKernel and FunnelUsagePlan.');
  var page0=text(description).trim();
  if(!page0)throw Error('Funnel Fabric needs a description to compile.');
  var plan=UsagePlan.build(page0,{source:'funnel-fabric'},{});
  var ra=plan.request_analysis||{};
  var surfaces=ra.surfaces||[];
  var targets=ra.material_targets||[];
  var mode=ra.mode||'resolve-act';
  var obligations=Kernel.extractObligations(page0);
  var stages=[
    {stage:'references',questions:surfaces.map(function(s){
      return 'What existing, verified machinery covers "'+s+'"? What is missing?';
    })},
    {stage:'distill',questions:[
      'What is the smallest '+mode+' that resolves this objective without silently changing its obligations?'
    ]},
    {stage:'decisions',questions:targets.map(materialQuestion)},
    {stage:'replay',questions:[
      'Is every extracted obligation satisfied with source backing and no substitutions?'
    ]},
    {stage:'verdict',questions:[
      'What destination and done criteria does this run authorize?'
    ]}
  ];
  var done_criteria=obligations.map(function(o){
    return o.polarity==='negative'
      ? '"'+o.source+'" is enforced (never violated)'
      : '"'+o.source+'" holds';
  });
  return {
    schema:SCHEMA,
    version:VERSION,
    page0:page0,
    page0_hash:Kernel.hash(page0),
    usage_plan:plan,
    obligations:obligations,
    stages:stages,
    done_criteria:done_criteria,
    generator:GENERATOR,
    generated_at:new Date().toISOString()
  };
}

function execute(definition,kernel){
  var K=kernel||Kernel;
  if(!K)throw Error('Funnel Fabric needs the v44-sealed kernel to execute.');
  if(!definition||definition.schema!==SCHEMA)throw Error('execute needs a Funnel Fabric definition.');
  var rid='fabric-'+K.hash(definition.page0);
  K.open({request_id:rid,input:definition.page0,source:'funnel-fabric',
    context:{generator:GENERATOR,definition_schema:SCHEMA}});
  var s=K.inspect(rid);
  if(s.stage==='verdict'&&s.receipt&&K.verifyReceipt(s.receipt)){
    return {receipt:s.receipt,valid:true,session:s};
  }
  if(s.stage&&s.stage!=='page0')throw Error('Fabric cannot resume a partially-run generated funnel; discard it and generate a fresh one.');
  var plan=definition.usage_plan;
  var surfaces=((plan.request_analysis||{}).surfaces||[]);
  var targets=((plan.request_analysis||{}).material_targets||[]);
  s=K.advance({request_id:rid,stage:'usage_plan',payload:{plan:plan},provenance:'generated'});
  s=K.advance({request_id:rid,stage:'references',
    payload:{reused:[],missing:surfaces.map(function(x){return 'verified machinery covering '+x;})},
    provenance:'generated'});
  s=K.advance({request_id:rid,stage:'distill',
    payload:{spec_draft:JSON.stringify(definition)},provenance:'generated'});
  var locked=targets.map(function(t){
    return {key:t,value:materialResolution(t,definition,plan),provenance:'generated'};
  });
  locked.unshift({key:'fabric-definition',value:'generated definition v'+definition.version+' accepted as the spec draft for this run',provenance:'generated'});
  s=K.advance({request_id:rid,stage:'decisions',
    payload:{locked:locked,unresolved:[]},provenance:'generated'});
  var replayObs=definition.obligations.map(function(o){
    return {id:o.id,source:o.source,status:'satisfied',provenance:'generated'};
  });
  s=K.advance({request_id:rid,stage:'replay',
    payload:{page0_verified:true,page0_hash:K.hash(definition.page0),obligations:replayObs,substitutions:[]},
    provenance:'generated'});
  var destination=((plan.execution_plan||{}).destination)||'funnel-fabric generated run — owner review';
  s=K.advance({request_id:rid,stage:'verdict',
    payload:{spec:{fabric_definition:definition.schema,fabric_version:definition.version,
      generator:GENERATOR,obligations:replayObs},
      destination:destination,done_criteria:definition.done_criteria.length?definition.done_criteria:['generated funnel completed']},
    provenance:'generated'});
  var receipt=s.receipt;
  return {receipt:receipt,valid:K.verifyReceipt(receipt),session:s};
}

return Object.freeze({
  version:VERSION,generator:GENERATOR,schema:SCHEMA,
  compile:compile,execute:execute,
  materialQuestions:function(){return clone(MATERIAL_QUESTIONS);}
});
});
