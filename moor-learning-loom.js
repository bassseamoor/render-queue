(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MoorLearningLoom=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION='1.0.0',DAY=86400000;
function hashStr(s){let h=2166136261>>>0;for(const ch of String(s||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
function rng(seed){let y=hashStr(seed)||0x9e3779b9;return function(){y^=y<<13;y^=y>>>17;y^=y<<5;y>>>=0;return y/4294967296;};}
function pick(r,a){return a[Math.floor(r()*a.length)]}
function clone(x){return JSON.parse(JSON.stringify(x))}
function slug(s){return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function iso(ms){return new Date(ms).toISOString()}

const FIELDS={
 'software architecture':['What becomes easier to change or verify if this idea is explicit?','Turn one hidden assumption into a named interface or invariant.'],
 'systems thinking':['What relationships matter more than the isolated object?','Draw one feedback loop and mark delays, constraints, and irreversible failure.'],
 'product design':['How would a user experience this principle rather than read about it?','Redesign one interaction so its underlying consequence is visible.'],
 'learning science':['What must be retrieved or generated for this to survive beyond recognition?','Close the explanation and reconstruct it from memory.'],
 'creativity':['What possibility appears when this becomes a creative constraint?','Apply it to a medium or problem it was not designed for.'],
 'entrepreneurship':['How does this alter survival odds, compounding advantage, or experimentation cost?','Make one risky decision more reversible without removing its upside.'],
 'economics':['What incentives or compounding effects appear when many actors follow this?','List who gains, who pays, and what behavior is rewarded.'],
 'governance':['What authority must be explicit, limited, reviewable, or revocable?','Write the smallest rule that prevents ambient authority.'],
 'risk and resilience':['How does this increase distance from irreversible failure?','Name the ruin state, then add one buffer or reversible intermediate step.'],
 'ecology':['What happens when this is an ecosystem of interacting populations/resources?','Map one dependency chain and remove one resource.'],
 'procedural generation':['What primitive laws make the result emerge instead of being hand-authored?','Replace one handcrafted outcome with seed + rules + constraints.'],
 'game/world design':['What world rule could teach this through consequences rather than tutorial text?','Design a mechanic whose outcome teaches the idea.'],
 'social systems':['What happens when people copy, remix, compete, cooperate, or misunderstand?','Add provenance or a visible consequence to one social action.'],
 'manufacturing/quality':['What evidence proves the output is real and repeatable?','Define the inspection gate and evidence that travels with the result.'],
 'data provenance':['Can the state be traced to source, version, transformation, and evidence?','Add source/version/evidence/supersession to one important record.'],
 'privacy/consent':['What data use would surprise the person who created the data?','Make private the default and create an explicit contribution boundary.'],
 'automation':['What is deterministic enough to automate, and what uncertainty must remain visible?','Automate one repeatable step and name the judgment handoff.'],
 'AI/tool use':['What should be retrieved, inferred, verified, and never pretended?','Separate one task into retrieval → judgment → verification → authority.'],
 'personal growth':['What repeated behavior or protected boundary follows from this?','Choose one repeatable behavior and one failure state you will not normalize.']
};

const CONCEPTS=[
 {id:'cumulative-machinery',title:'Cumulative Machinery',one:'Useful capability should survive the project that created it and make future work easier.',mental:'Reality stacks machines. Software should accumulate verified capability the same way.',deep:'Saving files is not enough. A cumulative system keeps capabilities addressable, preserves useful relationships and failures, and routes future work through what already exists.',moor:'Pulse Capability Memory stores verified capability, compositions, failure evidence, and reconsideration history.',failure:'A component library can look cumulative while every new task still rebuilds the same behavior.',sources:['moor-capability-memory.js','blueprint/pulse-cumulative-reconsideration.blueprint.json'],fields:['software architecture','systems thinking','manufacturing/quality','entrepreneurship','personal growth']},
 {id:'distance-from-ruin',title:'Distance From Ruin',one:'More buffer between experimentation and irreversible failure means more experiments can survive.',mental:'Increase the number of mistakes the system is allowed to make.',deep:'Buffers can be rollback, cash, redundancy, modularity, time, optionality, trust, or reversible decisions. The form changes; the principle is preserving the ability to continue searching after failure.',moor:'MOOR favors additive slices, rollback, supersession, and evidence gates before promotion.',failure:'Extreme efficiency can remove the very slack that makes learning possible.',sources:['blueprint/blueprint-farm.blueprint.json','pulse-slice-release-ledger.json'],fields:['risk and resilience','entrepreneurship','systems thinking','personal growth','software architecture']},
 {id:'immutable-intent',title:'Immutable Intent',one:'Preserve the original objective so local optimization cannot silently redefine success.',mental:'Page 0 is the ruler; implementation can change, the measuring stick cannot.',deep:'Long workflows drift because each intermediate decision becomes a new local objective. Immutable intent makes substitutions and deferrals visible and lets the final result be judged against why the work began.',moor:'The Funnel freezes Page 0 and replays atomic obligations before authority is granted.',failure:'A team can finish every task in a plan while failing the original user.',sources:['FUNNEL.md','funnel-kernel.js'],fields:['product design','governance','software architecture','manufacturing/quality','personal growth']},
 {id:'usage-plan',title:'Plan How You Will Think',one:'Before solving a hard problem, decide how you will use the problem-solving system itself.',mental:'A map-reading rule is not a route. The Funnel needs both laws and a request-specific plan.',deep:'The same process should not be used identically for every problem. A usage plan declares references, material questions, decomposition, execution, verification, and rerun triggers before resolution begins.',moor:'v44 now requires Page 0 → Usage Plan → References before the rest of the Funnel can proceed.',failure:'Rules without an operating plan can produce compliant but directionless work.',sources:['funnel-usage-plan-core.js','funnel-kernel.js','FUNNEL.md'],fields:['systems thinking','learning science','AI/tool use','automation','personal growth']},
 {id:'bounded-relevance',title:'Bounded Relevance',one:'When something changes, reconsider what could matter—not everything and not nothing.',mental:'A new fact sends ripples, but only nearby structures should move first.',deep:'All-to-all reconsideration explodes. Zero reconsideration wastes cumulative knowledge. Strong structural evidence such as typed contracts, dependencies, shared state, and verified history should bound the search.',moor:'Pulse reconsiderDelta evaluates the verified capability delta against relevant existing machinery.',failure:'Generic compatibility can manufacture fake relationships if weak signals are treated as proof.',sources:['moor-capability-memory.js','blueprint/pulse-cumulative-reconsideration.blueprint.json'],fields:['software architecture','systems thinking','automation','AI/tool use','learning science']},
 {id:'provenance',title:'Provenance and Receipts',one:'A result is more trustworthy when its chain of custody travels with it.',mental:'Carry the why, source, transformation, authority, and proof with the artifact.',deep:'Provenance makes hidden substitutions harder and lets future systems distinguish verified evidence from memory or assumption. A receipt is not truth by itself; it is an auditable binding to actual state.',moor:'Funnel receipts, Pulse references, capability evidence, travelers, and version lineage preserve different pieces of provenance.',failure:'Documentation can still lie when it is not bound to executed state.',sources:['funnel-receipt-core.js','pulse-spine.js','software-factory-core.js'],fields:['data provenance','manufacturing/quality','governance','AI/tool use','social systems']},
 {id:'verification-promotion',title:'Verification Before Promotion',one:'A plausible connection and trusted infrastructure are different states.',mental:'A sketch of a bridge is not a bridge you route traffic over.',deep:'Healthy systems preserve candidate, verified, promoted, failed, and superseded states instead of collapsing them. This allows exploration without silently converting hypotheses into dependencies.',moor:'Pulse candidate compositions require evidence before machine-verified promotion.',failure:'Fast-moving systems become brittle when guesses silently turn into architecture.',sources:['moor-capability-memory.js','funnel-law-core.js'],fields:['manufacturing/quality','software architecture','governance','learning science','personal growth']},
 {id:'failure-evidence',title:'Failure as Reusable Evidence',one:'A failed attempt should reduce the cost of the next attempt instead of disappearing.',mental:'Do not merely survive failure; make it purchase information.',deep:'Failure becomes cumulative when inputs, conditions, reason, and retry evidence remain addressable. The system can then avoid repeating the same mistake or recognize when changed conditions justify a retry.',moor:'Pulse stores failure evidence and recalls it during later relevant capability deltas.',failure:'A postmortem nobody can retrieve is emotionally useful and operationally wasted.',sources:['moor-capability-memory.js','pulse-spine.js'],fields:['learning science','systems thinking','manufacturing/quality','risk and resilience','personal growth']},
 {id:'emergent-laws',title:'Emergence From Primitive Laws',one:'The deepest reusable system often describes laws that generate outcomes rather than enumerating outcomes.',mental:'Stop designing every waterfall; understand fluid, gravity, material, and atmosphere.',deep:'Repeated successful compositions are evidence that a more general primitive may exist. The abstraction should be promoted only as far as the evidence supports, with counterexamples kept visible.',moor:'Pulse can surface abstraction candidates from repeated verified relationships without silently declaring them universal law.',failure:'Premature abstraction creates elegant systems that are wrong outside the examples that inspired them.',sources:['moor-capability-memory.js','blueprint/pulse-cumulative-reconsideration.blueprint.json'],fields:['procedural generation','ecology','software architecture','game/world design','creativity']}
];

function concept(id){return CONCEPTS.find(c=>c.id===id)||null}
function fieldBridge(c,field){const l=FIELDS[field]||FIELDS['systems thinking'];return {field,question:l[0],action:l[1]}}
function generate(opts){
 opts=opts||{};const seed=String(opts.seed||'learning'),depth=opts.depth||'working',r=rng(seed+'|'+(opts.concept||'auto')+'|'+depth);
 const c=concept(opts.concept)||pick(r,CONCEPTS);
 const ordered=c.fields.slice().sort(()=>r()-.5),bridges=ordered.slice(0,depth==='deep'?5:depth==='spark'?2:3).map(f=>fieldBridge(c,f));
 const experiment=pick(r,[
   'Find one real system you use today. Identify where this concept already exists implicitly and what becomes possible if you make it explicit.',
   'Construct a counterexample. Describe a case where applying the concept too broadly would make the result worse.',
   'Take a current problem. Apply the concept once, then deliberately reverse it and compare the consequences.'
 ]);
 const build=pick(r,[
   'Build the smallest artifact that demonstrates the concept rather than merely describing it.',
   'Create a before/after representation showing the system without the principle and with it.',
   'Combine this concept with one other MOOR concept and produce a mechanism that only becomes possible through the combination.'
 ]);
 const retrieval=[
   'Without looking back, explain '+c.title+' in one sentence.',
   'Name the failure mode this concept is trying to prevent.',
   'Give one example outside software where the same structure appears.'
 ];
 return {schema:'moor.learning-thread',version:1,thread_id:'thread:'+slug(c.id)+'-'+hashStr(seed+'|'+depth).toString(16),seed,depth,concept_id:c.id,concept:c.title,
  one_line:c.one,mental_model:c.mental,deep_explanation:c.deep,moor_example:c.moor,failure_mode:c.failure,source_refs:c.sources.slice(),
  cross_field_bridges:bridges,first_principles_question:pick(r,bridges).question,experiment,build_challenge:build,retrieval_prompts:retrieval,
  teach_back:'Teach this to one person without using the phrase “'+c.title+'”. If they can restate the structure, your model is probably portable.',
  share_artifact:{title:c.title+' · field experiment',prompt:build,provenance:'Generated by EVERGREEN Learning Loom from source-backed MOOR concept '+c.id+'.'},
  next_review:null};
}
function daily(date,depth){const d=(date?new Date(date):new Date()).toISOString().slice(0,10);const idx=hashStr('daily|'+d)%CONCEPTS.length;return generate({concept:CONCEPTS[idx].id,seed:'daily|'+d,depth:depth||'working'})}
function scheduleReview(completedAt,quality){
 const now=completedAt?new Date(completedAt).getTime():Date.now(),q=Math.max(0,Math.min(3,Number(quality==null?2:quality)));
 const intervals=[1,2,4,7];return iso(now+intervals[q]*DAY);
}
function complete(thread,quality,at){const x=clone(thread);x.completed_at=at||new Date().toISOString();x.recall_quality=Number(quality==null?2:quality);x.next_review=scheduleReview(x.completed_at,x.recall_quality);return x}
function contribution(input){
 input=clone(input||{});const scope=input.consent_scope;
 if(!['pulse-contribution','public-reusable'].includes(scope))throw Error('Explicit non-private contribution scope required.');
 if(!String(input.learner_text||'').trim())throw Error('Contribution text required.');
 const c={schema:'moor.learning-contribution',version:1,capsule_id:'learning-contribution:'+hashStr(JSON.stringify(input)+'|'+Date.now()).toString(16),
  thread_id:input.thread_id||null,concept_id:input.concept_id||null,learner_text:String(input.learner_text).trim(),
  distilled_claim:String(input.distilled_claim||input.learner_text).trim(),consent_scope:scope,created_at:new Date().toISOString(),
  source_version:VERSION,provenance:'explicit-learner-contribution',training_eligibility:true,sensitive_excluded:input.sensitive_excluded!==false,
  supersedes:input.supersedes||null};
 return c;
}
function publicArtifact(thread,learnerOutput){
 if(!thread||thread.schema!=='moor.learning-thread')throw Error('Learning thread required.');
 return {schema:'moor.learning-artifact',version:1,id:'learning-artifact:'+hashStr(thread.thread_id+'|'+String(learnerOutput||'')).toString(16),
   title:thread.share_artifact.title,concept_id:thread.concept_id,challenge:thread.share_artifact.prompt,learner_output:String(learnerOutput||'').trim(),
   source_refs:thread.source_refs.slice(),provenance:thread.share_artifact.provenance,created_at:new Date().toISOString()};
}
return Object.freeze({version:VERSION,fields:Object.keys(FIELDS),concepts:CONCEPTS.map(clone),generate,daily,scheduleReview,complete,contribution,publicArtifact});
});