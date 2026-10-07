(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FunnelUsagePlan=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='moor.funnel-usage-plan',VERSION=2;
const STOP=new Set(['the','and','that','this','with','from','into','your','you','for','are','was','were','will','would','should','could','have','has','had','not','but','all','use','using','make','build','create','system','moor','pulse','funnel','thing','things','just','like','want','need','needs']);
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function text(x){return String(x==null?'':x);}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
function hash(x){let s=typeof x==='string'?x:stable(x),a=2166136261>>>0;for(let i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)>>>0;}return ('00000000'+a.toString(16)).slice(-8);}
function uniq(xs){return [...new Set((xs||[]).filter(Boolean))];}
function words(s){return uniq((text(s).toLowerCase().match(/[a-z0-9][a-z0-9_-]{2,}/g)||[]).filter(w=>!STOP.has(w))).slice(0,32);}
function phrases(raw){
  return text(raw).split(/(?:\n+|(?<=[.!?;])\s+)/).map(s=>s.trim()).filter(Boolean);
}
function obligationHints(raw){
  const out=[];
  phrases(raw).forEach(p=>{
    if(/\b(must|need(?:s)?|should|have to|has to|make sure|ensure|never|do not|don't|cannot|can't|want(?:s)?|required?|build|push|preserve|keep|default)\b/i.test(p))out.push(p);
  });
  return uniq(out).slice(0,24);
}
function detectSurfaces(raw){
  const s=text(raw).toLowerCase(),out=['intent-and-constraints','existing-machinery'];
  const rules=[
    ['ui',['ui','interface','screen','panel','window','visual','layout','design']],
    ['data-and-state',['data','state','memory','store','save','database','record']],
    ['privacy-and-consent',['private','privacy','consent','training','user input','sensitive']],
    ['learning-and-content',['learn','teach','education','content','retention','curriculum','lesson']],
    ['growth-and-sharing',['referral','share','retention','growth','viral','promotion']],
    ['world-and-spatial',['world','planet','3d','space','map','terrain','morverse']],
    ['automation-and-agents',['agent','worker','automation','model','ai','llm']],
    ['architecture-and-contracts',['architecture','contract','dependency','interface','schema']],
    ['security-and-authority',['security','authority','permission','receipt','gate','law']],
    ['verification-and-release',['verify','test','release','deploy','publish','live']]
  ];
  rules.forEach(([id,terms])=>{if(terms.some(t=>s.includes(t)))out.push(id);});
  out.push('execution-route','verification');
  return uniq(out);
}
function materialTargets(raw){
  const s=text(raw).toLowerCase(),out=['destination','done-criteria','reuse-vs-new'];
  if(/public|private|share|consent|training|user input|data/.test(s))out.push('privacy-and-data-boundary');
  if(/default|law|funnel|authority|receipt|kernel/.test(s))out.push('authority-and-default-behavior');
  if(/retention|referral|growth|promotion/.test(s))out.push('growth-mechanism-and-user-agency');
  if(/build|implement|wire|push|fix|change|update/.test(s))out.push('implementation-scope-and-rollback');
  if(/free|pay|price|monet/.test(s))out.push('access-and-economics');
  return uniq(out);
}
function referenceQueries(raw){
  const ws=words(raw),qs=[];
  if(ws.length)qs.push(ws.slice(0,8).join(' '));
  obligationHints(raw).slice(0,6).forEach(p=>{
    const k=words(p).slice(0,6).join(' ');
    if(k)qs.push(k);
  });
  return uniq(qs).slice(0,8);
}
function planSteps(raw,buildLike,researchLike){
  const surfaces=detectSurfaces(raw);
  const steps=[
    {id:'bind-page0',action:'Freeze immutable Page 0 and extract explicit obligations.'},
    {id:'reuse-scan',action:'Search existing verified references, machinery, corrections and failures before inventing anything.'},
    {id:'resolve-material',action:'Resolve only decisions that can change architecture, scope, authority, destination, risk or done criteria.'}
  ];
  if(surfaces.length>4)steps.push({id:'parallel-surfaces',action:'Split independent problem surfaces, preserve one Page 0, and reconverge before blueprint/verdict.'});
  if(buildLike)steps.push({id:'blueprint',action:'Produce a build blueprint with dependencies, interfaces, rollback and acceptance before execution.'});
  if(researchLike&&!buildLike)steps.push({id:'evidence-resolution',action:'Resolve the question from evidence before proposing action.'});
  steps.push({id:'page0-replay',action:'Replay the result against Page 0 and reject silent substitutions.'});
  if(buildLike)steps.push({id:'execute',action:'Authorize only the selected destination after a valid receipt exists.'});
  steps.push({id:'verify',action:'Verify the requested path and write failures/new evidence back into cumulative memory.'});
  return steps;
}
function merge(dst,src){Object.keys(src||{}).forEach(k=>{if(src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])&&dst[k]&&typeof dst[k]==='object'&&!Array.isArray(dst[k]))merge(dst[k],src[k]);else dst[k]=clone(src[k]);});}
// Negation-aware verb detection (intake repair 2026-10-07, funnel receipt d4cb285546a0f10d):
// a verb under negation scope ("do not build", "never implement") is mentioned, not requested.
const NEG_SCOPE=/\b(do not|don't|does not|doesn't|did not|didn't|never|cannot|can't|can not|could not|should not|would not|will not|won't|not|no|without|avoid|avoiding|refrain from)\b/i;
function hasUnnegatedVerb(s,verbs){
  const clauses=text(s).split(/(?:\n+|(?<=[.!?;])\s+)/);
  const re=new RegExp('\\b('+verbs+')\\b','i');
  return clauses.some(function(cl){
    const m=re.exec(cl);
    if(!m)return false;
    return !NEG_SCOPE.test(cl.slice(0,m.index));
  });
}
function build(page0,context,overrides){
  page0=text(page0).trim();if(!page0)throw Error('Usage plan requires Page 0.');
  context=clone(context||{});overrides=clone(overrides||{});
  const buildLike=hasUnnegatedVerb(page0,'build|create|make|implement|change|fix|push|add|remove|update|design|wire|replace|deploy|publish');
  const researchLike=/\b(find|research|compare|audit|inspect|understand|figure out|analy[sz]e|investigate|learn)\b/i.test(page0);
  const obligations=obligationHints(page0),surfaces=detectSurfaces(page0),queries=referenceQueries(page0);
  const plan={
    schema:SCHEMA,version:VERSION,page0_hash:hash(page0),
    objective:'Resolve the immutable Page 0 request without silently changing its obligations.',
    request_analysis:{
      mode:buildLike?(researchLike?'research-blueprint-build':'blueprint-build'):(researchLike?'evidence-resolution':'resolve-act'),
      keywords:words(page0),
      obligation_hints:obligations,
      surfaces,
      material_targets:materialTargets(page0)
    },
    operating_sequence:planSteps(page0,buildLike,researchLike),
    reference_plan:{
      inspect_existing_first:true,
      sources:['locked answers','Pulse/Bin references','verified machinery','prior blueprints/receipts','prior failures/corrections','cumulative capability memory'],
      queries,
      selection_rule:'Prefer verified, current, non-deprecated machinery that satisfies the needed contract; retain provenance and known failures.',
      missing_policy:'Name missing evidence explicitly; do not invent it.'
    },
    question_plan:{
      material_only:true,
      targets:materialTargets(page0),
      ask_when:'An answer changes architecture, scope, authority, risk, destination, done criteria, or a Page 0 obligation.',
      unresolved_policy:'Block replay until material decisions are resolved or explicitly deferred by the owner.'
    },
    decomposition_plan:{
      parallelize_independent_surfaces:surfaces.length>4,
      surfaces,
      preserve_shared_page0:true,
      reunify_before_blueprint:true,
      expected_mode:buildLike?'blueprint-then-build':researchLike?'evidence-then-resolution':'resolve-then-act'
    },
    execution_plan:{
      build_required:buildLike,
      builder:buildLike?'Harness/builders after Funnel authorization':'none unless the resolved result requires a build',
      destination:buildLike?'app-compiler-harness':'resolved-result',
      reuse_before_new:true,
      steps:buildLike?['resolve verified machinery','build only missing delta','verify','promote evidence']:['resolve','answer','preserve evidence']
    },
    verification_plan:{
      compare_to_page0:true,
      require_done_criteria:true,
      verify_requested_path:true,
      checks:uniq([
        'all Page 0 obligations accounted for',
        'usage plan followed or explicitly revised before references',
        'selected references/machinery provenance retained',
        buildLike?'built output exists at intended destination':null,
        buildLike?'affected regression path passes':null,
        'no unapproved substitution'
      ]),
      write_failures_back_as_evidence:true
    },
    rerun_plan:{
      triggers:['owner correction','changed dependency','failed verification','new material evidence','unapproved substitution','usage-plan-invalidated'],
      action:'Create a new run from immutable Page 0 with prior evidence and the superseded usage plan retained.'
    },
    output_plan:{
      preserve_provenance:true,
      record_usage_plan:true,
      record_references:true,
      record_failures:true,
      compact_after_verification:true
    },
    context_summary:{page:context.page||context.href||null,source:context.source||null}
  };
  merge(plan,overrides);
  validate(plan,page0);
  return plan;
}
function validate(plan,page0){
  if(!plan||plan.schema!==SCHEMA||plan.version!==VERSION)throw Error('Invalid Funnel usage plan schema.');
  if(page0&&plan.page0_hash!==hash(text(page0).trim()))throw Error('Usage plan is not bound to immutable Page 0.');
  const req=['request_analysis','reference_plan','question_plan','decomposition_plan','execution_plan','verification_plan','rerun_plan','output_plan'];
  req.forEach(k=>{if(!plan[k]||typeof plan[k]!=='object')throw Error('Usage plan missing '+k+'.');});
  if(!Array.isArray(plan.operating_sequence)||plan.operating_sequence.length<5)throw Error('Usage plan requires an operating sequence.');
  if(plan.reference_plan.inspect_existing_first!==true)throw Error('Usage plan must inspect existing references/machinery first.');
  if(!Array.isArray(plan.reference_plan.queries)||!plan.reference_plan.queries.length)throw Error('Usage plan must derive request-specific reference queries.');
  if(!Array.isArray(plan.question_plan.targets)||!plan.question_plan.targets.length)throw Error('Usage plan must identify material decision targets.');
  if(!Array.isArray(plan.decomposition_plan.surfaces)||plan.decomposition_plan.surfaces.length<2)throw Error('Usage plan must identify problem surfaces.');
  if(plan.verification_plan.compare_to_page0!==true||!Array.isArray(plan.verification_plan.checks)||!plan.verification_plan.checks.length)throw Error('Usage plan must define Page 0 verification checks.');
  if(!Array.isArray(plan.rerun_plan.triggers)||!plan.rerun_plan.triggers.length)throw Error('Usage plan needs rerun triggers.');
  return true;
}
return Object.freeze({schema:SCHEMA,version:VERSION,build,validate,hash,words,obligationHints,detectSurfaces,materialTargets,referenceQueries});
});