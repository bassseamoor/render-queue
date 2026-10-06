/* Sebastian Solver Swarm — independent open-ended solution ballots.
 * Workers solve questions FROM Sebastian. They do not impersonate Sebastian.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SebastianSolver=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TASK_SCHEMA='moor.sebastian-solver-task';
const BALLOT_SCHEMA='moor.sebastian-solver-ballot';
const VERSION=1;

function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function stable(x){
  if(x===null||typeof x!=='object')return JSON.stringify(x);
  if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
  return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
}
function hash(s){
  s=typeof s==='string'?s:stable(s);let a=2166136261>>>0,b=0x9e3779b9>>>0;
  for(let i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)>>>0;b^=s.charCodeAt(i)+(i&255);b=Math.imul(b,2246822519)>>>0;}
  return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');
}
function task(question,workerId,opts={}){
  const qid=String(question.id||question.question_id||'').trim(),prompt=String(question.prompt||question.question||'').trim();
  if(!qid||!prompt)throw Error('Solver task requires a question id and prompt.');
  const leadingRisk=String(question.leading_risk||'none');
  if(leadingRisk!=='none'&&opts.allow_leading!==true)throw Error('Solver question is marked as potentially leading.');
  const core={
    schema:TASK_SCHEMA,version:VERSION,task_id:'task:'+hash(qid+'|'+workerId+'|'+(opts.isolation_key||workerId)),
    question_id:qid,worker_id:String(workerId),prompt_as_from_sebastian:'Sebastian asks: '+prompt,
    answer_contract:clone(question.answer_contract||{}),context:clone(opts.context||{}),
    isolation_key:String(opts.isolation_key||workerId),budget:clone(opts.budget||{}),
    instruction:'Answer Sebastian\'s open-ended question with your best proposed solution. Do not claim Sebastian already believes your answer. Do not read peer ballots before submitting.'
  };
  return Object.freeze(core);
}
function ballot(input){
  input=input||{};
  const proposal=String(input.proposal||'').trim(),key=String(input.proposition_key||'').trim();
  if(!input.task_id||!input.question_id||!input.worker_id||!proposal||!key)throw Error('Ballot requires task, question, worker, proposition key and proposal.');
  const core={
    schema:BALLOT_SCHEMA,version:VERSION,task_id:String(input.task_id),question_id:String(input.question_id),worker_id:String(input.worker_id),
    proposition_key:key,proposal,claims:Array.isArray(input.claims)?clone(input.claims):[],
    assumptions:Array.isArray(input.assumptions)?clone(input.assumptions):[],
    risks:Array.isArray(input.risks)?clone(input.risks):[],
    tests:Array.isArray(input.tests)?clone(input.tests):[],
    confidence:Math.max(0,Math.min(1,Number(input.confidence)||0)),
    independence_key:String(input.independence_key||input.worker_id),
    created_at:input.created_at||new Date().toISOString()
  };
  return Object.assign({},core,{fingerprint:hash(core)});
}
function verifyBallot(b){
  if(!b||b.schema!==BALLOT_SCHEMA||b.version!==VERSION||!b.task_id||!b.question_id||!b.worker_id||!b.proposition_key||!b.proposal)return false;
  const x=clone(b),fp=x.fingerprint;delete x.fingerprint;return hash(x)===fp;
}
function reconcile(ballots,opts={}){
  ballots=(ballots||[]).filter(verifyBallot);
  if(!ballots.length)return {status:'unknown',winner:null,synthetic_confidence:0,vote_count:0,alternatives:[]};
  const qids=new Set(ballots.map(b=>b.question_id));if(qids.size!==1)throw Error('Reconcile one question at a time.');
  const groups=new Map();
  for(const b of ballots){if(!groups.has(b.proposition_key))groups.set(b.proposition_key,[]);groups.get(b.proposition_key).push(b);}
  const total=ballots.length;
  const ranked=[...groups.entries()].map(([key,bs])=>{
    const independent=new Set(bs.map(b=>b.independence_key)).size;
    const votes=bs.length,agreement=votes/total;
    const mean=bs.reduce((s,b)=>s+b.confidence,0)/votes;
    const independence=Math.min(1,independent/votes);
    const calibrated=Math.max(0,Math.min(1,Number(opts.reliability&&opts.reliability[key])||1));
    // Deliberately manufactures synthetic certainty from independent agreement while keeping it labeled synthetic.
    const synthetic=1-Math.pow(1-Math.min(.95,mean*independence*calibrated),Math.max(1,independent));
    return {proposition_key:key,proposal:bs[0].proposal,vote_count:votes,independent_votes:independent,agreement_ratio:agreement,mean_worker_confidence:mean,independence_score:independence,synthetic_confidence:synthetic,ballot_ids:bs.map(b=>b.fingerprint)};
  }).sort((a,b)=>b.vote_count-a.vote_count||b.synthetic_confidence-a.synthetic_confidence);
  const winner=ranked[0],runner=ranked[1];
  const minVotes=Math.max(1,Number(opts.min_votes)||2),threshold=Number(opts.threshold)||.72;
  const disputed=!!(runner&&runner.vote_count===winner.vote_count);
  return {
    status:!disputed&&winner.vote_count>=minVotes&&winner.synthetic_confidence>=threshold?'resolved':'disputed',
    winner,synthetic_confidence:winner.synthetic_confidence,vote_count:winner.vote_count,total_ballots:total,
    alternatives:ranked.slice(1),owner_evidence_confidence:null,
    note:'synthetic_confidence measures independent solution agreement. It is not evidence of a prior Sebastian decision.'
  };
}
function spawn(question,n=4,opts={}){
  n=Math.max(1,Math.min(256,Math.round(Number(n)||4)));
  const out=[];for(let i=1;i<=n;i++)out.push(task(question,'Sebastian-'+i,{...opts,isolation_key:(opts.isolation_prefix||question.id||'q')+':'+i}));
  return out;
}
return Object.freeze({version:VERSION,TASK_SCHEMA,BALLOT_SCHEMA,task,spawn,ballot,verifyBallot,reconcile,hash});
});