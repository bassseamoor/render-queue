/* Funnel Environment architecture seed.
 * The viewer turns this structured graph into geometry. No image model is involved.
 */
(function(root){
'use strict';

const needGroups = [
  ['Body',['Hydration','Nutrition','Sleep','Warmth','Cooling','Movement','Recovery','Pain relief','Hygiene','Physical safety']],
  ['Security',['Shelter','Stability','Predictability','Protection','Privacy','Control','Redundancy','Continuity','Backup','Resilience']],
  ['Resources',['Cash flow','Savings','Liquidity','Income','Ownership','Tools','Compute','Bandwidth','Transportation','Leverage']],
  ['Autonomy',['Choice','Independence','Mobility','Permission','Self-direction','Control of time','Optionality','Sovereignty','Escape','Self-reliance']],
  ['Competence',['Mastery','Skill','Fluency','Craftsmanship','Problem solving','Execution','Speed','Precision','Confidence','Adaptability']],
  ['Progress',['Momentum','Completion','Measurable gain','Feedback','Iteration','Challenge','Discipline','Consistency','Acceleration','Breakthrough']],
  ['Creation',['Invention','Expression','Design','Building','Experimentation','Originality','Composition','Prototyping','Worldbuilding','Authorship']],
  ['Understanding',['Clarity','Explanation','Mental models','Causality','Pattern recognition','Context','Truth','Prediction','Memory','Synthesis']],
  ['Connection',['Belonging','Friendship','Family','Partnership','Trust','Reciprocity','Communication','Collaboration','Intimacy','Community']],
  ['Recognition',['Being seen','Respect','Appreciation','Credibility','Reputation','Influence','Status','Legacy','Acknowledgment','Distinctiveness']],
  ['Play',['Fun','Novelty','Exploration','Adventure','Surprise','Challenge play','Immersion','Humor','Wonder','Freedom to play']],
  ['Comfort',['Ease','Convenience','Calm','Cleanliness','Organization','Beauty','Spaciousness','Simplicity','Coherence','Familiarity']],
  ['Meaning',['Purpose','Service','Usefulness','Impact','Responsibility','Fairness','Protection of others','Teaching','Stewardship','Transcendence']]
];

const nodes=[], edges=[];
const N=(id,label,type,layer,lane,detail,extra={})=>nodes.push({id,label,type,layer,lane,detail,...extra});
const E=(from,to,type='flow',label='')=>edges.push({from,to,type,label});

// Immutable source and intake.
N('page0','PAGE 0','source',0,0,'Exact original request. Frozen; never replaced by a summary.');
N('intake.freeze','Freeze','gate',1,-3,'Bind request ID, timestamp, context, attachments and raw Page 0.');
N('intake.parse','Parse','gate',1,-1,'Extract statements without deciding what they mean.');
N('intake.context','Context','gate',1,1,'Attach current project state, references, prior locks and known failures.');
N('intake.route','Route','gate',1,3,'Create bounded inputs for specialist funnels; specialists receive only the evidence they need.');
E('page0','intake.freeze'); E('intake.freeze','intake.parse'); E('intake.parse','intake.context'); E('intake.context','intake.route');

// Five isolated specialist funnels.
const funnels = [
  {k:'fid', label:'FIDELITY', lane:-4, objective:'What did Sebastian actually ask for?', steps:[
    ['source','Page 0 slice','Only request language and explicit references.'],
    ['extract','Explicit requirements','Find named mechanisms, commands, prohibitions and requested behavior.'],
    ['claims','Interpretation claims','State the minimum interpretation needed to build.'],
    ['contradict','Contradiction scan','Find claims that conflict with Page 0 or each other.'],
    ['ballot','Fidelity ballot','Requirements, confidence, evidence and unanswered material questions.']
  ]},
  {k:'pres', label:'PRESERVATION', lane:-2, objective:'What must not be broken?', steps:[
    ['source','System-state slice','Current implementation, dependencies, locked behavior and verified paths.'],
    ['deps','Dependency map','Trace upstream/downstream systems touched by the change.'],
    ['surface','Change surface','Identify exactly what must change and what should remain untouched.'],
    ['risks','Regression risks','List realistic breakage and required preservation tests.'],
    ['ballot','Preservation ballot','Protected invariants, risk scores and evidence.']
  ]},
  {k:'out', label:'OUTCOME', lane:0, objective:'What observable result would make this useful?', steps:[
    ['source','Goal slice','Outcome language, requested experience and current dissatisfaction.'],
    ['success','Success condition','Define what the user can actually observe or do afterward.'],
    ['false','False-success attack','Find ways the implementation could technically work while still doing nothing useful.'],
    ['done','Done criteria','Turn outcomes into behavioral acceptance tests.'],
    ['ballot','Outcome ballot','Success criteria, anti-goals and confidence.']
  ]},
  {k:'needs', label:'NEEDS', lane:2, objective:'Which Sebastian needs are implicated?', steps:[
    ['source','Need signals','Only signals relevant to needs; not the entire raw request.'],
    ['classify','Need classification','Map signals into the 130-need ontology.'],
    ['weights','Need weights','Score relevance, urgency and conflicts without forcing every need into the decision.'],
    ['synergy','Synergy / conflict','Identify needs helped together or traded against each other.'],
    ['ballot','Needs ballot','Weighted need vector plus evidence and uncertainty.']
  ]},
  {k:'value', label:'VALUE', lane:4, objective:'Can this create useful leverage or money?', steps:[
    ['source','Economic slice','Only market, cost, time, asset, distribution and monetization signals.'],
    ['paths','Value paths','Identify plausible ways the work creates value or leverage.'],
    ['costs','Cost / leverage','Compare effort, reuse, opportunity cost and compounding value.'],
    ['timing','Timing','Decide whether value matters now, later, or not at all for this request.'],
    ['ballot','Value ballot','Relevant value paths and relevance score; cannot hijack the request.']
  ]}
];

for(const f of funnels){
  N(f.k+'.funnel',f.label,'funnel',2,f.lane,f.objective,{objective:f.objective});
  E('intake.route',f.k+'.funnel','route',f.objective);
  let prev=f.k+'.funnel';
  f.steps.forEach((s,i)=>{
    const id=f.k+'.'+s[0];
    N(id,s[1],i===f.steps.length-1?'ballot':'step',3+i,f.lane,s[2],{funnel:f.label});
    E(prev,id,'flow');
    prev=id;
  });
}

// Needs ontology: 13 hubs x 10 explicit need points = 130 needs.
needGroups.forEach((g,gi)=>{
  const hub='needcat.'+gi;
  N(hub,g[0],'need-category',4,gi-6,'Category hub for ten editable Sebastian-need definitions.',{category:g[0],index:gi});
  E('needs.classify',hub,'classify');
  g[1].forEach((name,ni)=>{
    const id='need.'+(gi*10+ni+1);
    N(id,name,'need',5,gi-6,'Provisional Sebastian need #'+(gi*10+ni+1)+'. Editable; weighting is evidence-driven.',{category:g[0],needNumber:gi*10+ni+1,ordinal:ni});
    E(hub,id,'contains');
  });
  E(hub,'needs.weights','aggregate');
});

// Ballot box / meta-funnel pipeline.
N('meta.collect','Collect ballots','meta',9,-3,'Collect independent specialist outputs without forcing agreement.');
N('meta.normalize','Normalize evidence','meta',9,-2,'Normalize evidence references, confidence scales and missing-data markers.');
N('meta.weight','Dynamic weighting','meta',9,-1,'Weight a ballot by request relevance, evidence quality and historical reliability.');
N('meta.conflicts','Conflict resolver','meta',9,0,'Surface disagreements. Do not average away incompatible claims.');
N('meta.gaps','Gap detector','meta',9,1,'Identify material information still missing.');
N('meta.interview-decision','Interview decision','meta',9,2,'Ask only when different answers could materially change execution.');
N('meta.agreement','Convergence gate','meta',9,3,'Require enough evidence to produce one coherent candidate.');

for(const f of funnels) E(f.k+'.ballot','meta.collect','ballot');
E('meta.collect','meta.normalize'); E('meta.normalize','meta.weight'); E('meta.weight','meta.conflicts');
E('meta.conflicts','meta.gaps'); E('meta.gaps','meta.interview-decision'); E('meta.interview-decision','meta.agreement');

// Interview branch.
N('interview.questions','Generate questions','interview',10,4,'Generate the smallest set of material questions.');
N('interview.route','Route questions','interview',11,4,'Send each question only to the person or specialist that can answer it.');
N('interview.answers','Lock answers','interview',12,4,'Append answers with provenance; never overwrite Page 0.');
E('meta.interview-decision','interview.questions','branch','material uncertainty');
E('interview.questions','interview.route'); E('interview.route','interview.answers');
E('interview.answers','meta.collect','feedback','re-run affected specialists only');

// Final convergence bundle.
const finals=[
 ['final.requirements','Requirements',-3,'Resolved atomic requirements.'],
 ['final.dependencies','Dependencies',-2,'Required systems, references and adapters.'],
 ['final.constraints','Constraints',-1,'Must-not-break and must-not-do rules.'],
 ['final.assumptions','Assumptions',0,'Every remaining assumption is explicit and source-labeled.'],
 ['final.priorities','Priorities',1,'Ordering and relative importance without erasing minority evidence.'],
 ['final.acceptance','Acceptance tests',2,'Observable tests that distinguish real success from false success.'],
 ['final.deferred','Deferred ideas',3,'Useful but non-blocking ideas retained without contaminating current scope.']
];
finals.forEach(x=>{N(x[0],x[1],'final',13,x[2],x[3]);E('meta.agreement',x[0],'resolve');});

// Replay and receipts.
N('replay.collect','Reassemble candidate','replay',14,-2,'Reassemble the complete candidate from resolved bundles.');
N('replay.page0','Page 0 replay','replay',14,-1,'Compare the candidate against the exact frozen request.');
N('replay.coverage','Coverage proof','replay',14,0,'Every explicit obligation must be represented or explicitly deferred.');
N('replay.substitutions','Substitution check','replay',14,1,'Reject silent replacement of requested mechanisms.');
N('replay.false-success','False-success check','replay',14,2,'Attack the candidate from the user-outcome perspective.');
N('replay.pass','Replay gate','gate',14,3,'Only a clean replay can authorize receipts.');
finals.forEach(x=>E(x[0],'replay.collect'));
E('replay.collect','replay.page0'); E('replay.page0','replay.coverage'); E('replay.coverage','replay.substitutions');
E('replay.substitutions','replay.false-success'); E('replay.false-success','replay.pass');

N('receipt.requirements','Requirement receipts','receipt',15,-1,'One source-backed receipt per consequential requirement.');
N('receipt.execution','Execution receipt','receipt',15,1,'Compact authority binding Page 0, resolved spec, criteria and current ledger state.');
E('replay.pass','receipt.requirements','authorize'); E('receipt.requirements','receipt.execution','authorize');

// Harness / build / verification.
N('harness.intake','Harness intake','execution',16,-3,'Accept only a valid execution receipt plus the builder-facing packet.');
N('harness.plan','Execution plan','execution',16,-1.5,'Map requirements to implementation work and verification gates.');
N('harness.build','Build / change','execution',16,0,'Perform the requested work through bounded workers/tools.');
N('harness.integrate','Integration','execution',16,1.5,'Connect changes through the real system path.');
N('harness.verify','Verifier','execution',16,3,'Prove syntax, boot, behavior, integration, regression and intent criteria.');
E('receipt.execution','harness.intake','execute'); E('harness.intake','harness.plan'); E('harness.plan','harness.build');
E('harness.build','harness.integrate'); E('harness.integrate','harness.verify');

// Learning loop.
N('learn.result','Outcome record','learning',17,-2,'Record what actually happened, not what the builder claimed.');
N('learn.feedback','Sebastian feedback','learning',17,-0.7,'Acceptance, rejection, correction or changed priority.');
N('learn.ledger','Learning ledger','learning',17,0.7,'Store verified successes, failures, interpretations and provenance.');
N('learn.weights','Weight update','learning',17,2,'Adjust future relevance/reliability weights from outcomes, never confidence alone.');
E('harness.verify','learn.result','evidence'); E('learn.result','learn.feedback'); E('learn.feedback','learn.ledger'); E('learn.ledger','learn.weights');
for(const f of funnels) E('learn.weights',f.k+'.funnel','feedback','future weighting');
E('learn.weights','needs.weights','feedback','need-model calibration');

root.FUNNEL_ENVIRONMENT_GRAPH={
  schema:'moor.funnel-environment-graph',
  version:1,
  title:'MOOR Funnel System',
  note:'Structured architecture seed. The 130-need ontology is provisional and intentionally editable.',
  needCount:needGroups.reduce((n,g)=>n+g[1].length,0),
  nodes,edges
};
})(window);
