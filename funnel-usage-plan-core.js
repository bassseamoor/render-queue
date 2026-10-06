(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FunnelUsagePlan=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='moor.funnel-usage-plan',VERSION=1;
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function text(x){return String(x==null?'':x);}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
function hash(x){let s=typeof x==='string'?x:stable(x),a=2166136261>>>0;for(let i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)>>>0;}return ('00000000'+a.toString(16)).slice(-8);}
function build(page0,context,overrides){
  page0=text(page0).trim();if(!page0)throw Error('Usage plan requires Page 0.');
  context=clone(context||{});overrides=clone(overrides||{});
  const buildLike=/\b(build|create|make|implement|change|fix|push|add|remove|update|design)\b/i.test(page0);
  const researchLike=/\b(find|research|compare|audit|inspect|understand|figure out|analy[sz]e)\b/i.test(page0);
  const plan={
    schema:SCHEMA,version:VERSION,page0_hash:hash(page0),
    objective:'Resolve the immutable Page 0 request without silently changing its obligations.',
    reference_plan:{
      inspect_existing_first:true,
      sources:['locked answers','Pulse/Bin references','verified machinery','prior failures/corrections'],
      missing_policy:'Name missing evidence explicitly; do not invent it.'
    },
    question_plan:{
      material_only:true,
      ask_when:'An answer changes architecture, scope, authority, risk, destination, done criteria, or a Page 0 obligation.',
      unresolved_policy:'Block replay until material decisions are resolved or explicitly deferred by the owner.'
    },
    decomposition_plan:{
      parallelize_independent_surfaces:true,
      preserve_shared_page0:true,
      reunify_before_blueprint:true,
      expected_mode:buildLike?'blueprint-then-build':researchLike?'evidence-then-resolution':'resolve-then-act'
    },
    execution_plan:{
      builder:'Harness/builders after Funnel authorization',
      destination:buildLike?'app-compiler-harness':'resolved-result',
      reuse_before_new:true
    },
    verification_plan:{
      compare_to_page0:true,
      require_done_criteria:true,
      verify_requested_path:true,
      write_failures_back_as_evidence:true
    },
    rerun_plan:{
      triggers:['owner correction','changed dependency','failed verification','new material evidence','unapproved substitution'],
      action:'Re-enter from immutable Page 0 with prior evidence preserved.'
    },
    output_plan:{
      preserve_provenance:true,
      record_usage_plan:true,
      compact_after_verification:true
    },
    context_summary:{
      page:context.page||context.href||null,
      source:context.source||null
    }
  };
  function merge(dst,src){Object.keys(src||{}).forEach(k=>{if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&dst[k]&&typeof dst[k]==='object'&&!Array.isArray(dst[k]))merge(dst[k],src[k]);else dst[k]=clone(src[k]);});}
  merge(plan,overrides);
  validate(plan,page0);
  return plan;
}
function validate(plan,page0){
  if(!plan||plan.schema!==SCHEMA||plan.version!==VERSION)throw Error('Invalid Funnel usage plan schema.');
  if(page0&&plan.page0_hash!==hash(text(page0).trim()))throw Error('Usage plan is not bound to immutable Page 0.');
  const req=['reference_plan','question_plan','decomposition_plan','execution_plan','verification_plan','rerun_plan','output_plan'];
  req.forEach(k=>{if(!plan[k]||typeof plan[k]!=='object')throw Error('Usage plan missing '+k+'.');});
  if(plan.reference_plan.inspect_existing_first!==true)throw Error('Usage plan must inspect existing references/machinery first.');
  if(plan.verification_plan.compare_to_page0!==true)throw Error('Usage plan must replay against Page 0.');
  if(!Array.isArray(plan.rerun_plan.triggers)||!plan.rerun_plan.triggers.length)throw Error('Usage plan needs rerun triggers.');
  return true;
}
return Object.freeze({schema:SCHEMA,version:VERSION,build,validate,hash});
});