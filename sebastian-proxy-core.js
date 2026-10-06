/* Sebastian Evidence Proxies — source-backed owner-answer receipts.
 * Proxies may retrieve evidence. They may not invent an owner preference.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SebastianProxy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='moor.sebastian-evidence-receipt';
const VERSION=1;
const STANCES=['explicit','correction','inferred','unknown','conflict'];

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
function sourceFingerprint(e){
  return hash({surface:e.surface||'unknown',source_id:e.source_id||'',at:e.at||'',excerpt:String(e.excerpt||'').trim()});
}
function makeReceipt(input){
  input=input||{};
  const proxy=String(input.proxy_id||'').trim(),question=String(input.question_id||'').trim();
  if(!proxy||!question)throw Error('Sebastian receipt requires proxy_id and question_id.');
  const stance=STANCES.includes(input.stance)?input.stance:'unknown';
  const evidence=Array.isArray(input.evidence)?input.evidence.map(e=>({
    surface:String(e.surface||'unknown'),
    source_id:String(e.source_id||''),
    at:e.at?String(e.at):null,
    excerpt:String(e.excerpt||'').trim().slice(0,4000),
    source_fingerprint:sourceFingerprint(e)
  })):[];
  if(['explicit','correction','inferred'].includes(stance)&&!evidence.length)throw Error('Asserted Sebastian receipt requires evidence.');
  const core={
    schema:SCHEMA,version:VERSION,proxy_id:proxy,question_id:question,
    answer:stance==='unknown'?null:clone(input.answer),
    stance,scope:String(input.scope||'').trim().slice(0,500),
    confidence:Math.max(0,Math.min(1,Number(input.confidence)||0)),
    evidence,
    conflicts:Array.isArray(input.conflicts)?input.conflicts.map(x=>String(x).slice(0,1000)):[],
    created_at:input.created_at||new Date().toISOString()
  };
  if(stance==='unknown'){core.answer=null;core.confidence=0;}
  if(stance==='conflict'&&!core.conflicts.length)throw Error('Conflict receipt requires conflict detail.');
  return Object.assign({},core,{fingerprint:hash(core)});
}
function verifyReceipt(r){
  if(!r||r.schema!==SCHEMA||r.version!==VERSION||!r.proxy_id||!r.question_id||!STANCES.includes(r.stance))return false;
  const x=clone(r),fp=x.fingerprint;delete x.fingerprint;
  if(hash(x)!==fp)return false;
  if(['explicit','correction','inferred'].includes(r.stance)&&(!Array.isArray(r.evidence)||!r.evidence.length))return false;
  if(r.stance==='unknown'&&r.answer!==null)return false;
  return true;
}
function answerKey(a){return stable(a);}
function reconcile(receipts){
  receipts=(receipts||[]).filter(verifyReceipt);
  if(!receipts.length)return {status:'unknown',answer:null,confidence:0,receipts:[],uniqueEvidence:[],conflicts:['No valid Sebastian evidence receipts.']};
  const q=new Set(receipts.map(r=>r.question_id));if(q.size!==1)throw Error('Reconcile one Funnel question at a time.');
  const evidenceByFp=new Map();
  for(const r of receipts)for(const e of r.evidence||[])if(!evidenceByFp.has(e.source_fingerprint))evidenceByFp.set(e.source_fingerprint,e);
  const asserted=receipts.filter(r=>['explicit','correction','inferred'].includes(r.stance));
  const conflictReceipts=receipts.filter(r=>r.stance==='conflict');
  const groups=new Map();
  for(const r of asserted){
    const k=answerKey(r.answer);if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(r);
  }
  const scored=[...groups.entries()].map(([k,rs])=>{
    const fps=new Set(rs.flatMap(r=>(r.evidence||[]).map(e=>e.source_fingerprint)));
    let sourceScore=0;
    for(const fp of fps){
      const citing=rs.filter(r=>(r.evidence||[]).some(e=>e.source_fingerprint===fp));
      const best=Math.max(...citing.map(r=>r.stance==='correction'?1.2:r.stance==='explicit'?1:r.stance==='inferred'?.45:0));
      sourceScore+=best;
    }
    const retrievalAgreement=new Set(rs.map(r=>r.proxy_id)).size/Math.max(1,new Set(receipts.map(r=>r.proxy_id)).size);
    const confidence=Math.min(1,(sourceScore/(sourceScore+1))*.82+retrievalAgreement*.18);
    return {key:k,answer:rs[0].answer,receipts:rs,uniqueSources:fps.size,sourceScore,retrievalAgreement,confidence};
  }).sort((a,b)=>b.sourceScore-a.sourceScore||b.retrievalAgreement-a.retrievalAgreement);
  const explicitAnswers=new Set(asserted.filter(r=>r.stance==='explicit'||r.stance==='correction').map(r=>answerKey(r.answer)));
  const conflicts=[...conflictReceipts.flatMap(r=>r.conflicts||[])];
  if(explicitAnswers.size>1)conflicts.push('Current explicit Sebastian evidence supports incompatible answers.');
  if(!scored.length)return {status:conflicts.length?'conflict':'unknown',answer:null,confidence:0,receipts:clone(receipts),uniqueEvidence:[...evidenceByFp.values()],conflicts};
  const winner=scored[0],runner=scored[1];
  if(conflicts.length||(runner&&runner.sourceScore>=winner.sourceScore*.85)){
    return {status:'conflict',answer:null,confidence:Math.min(winner.confidence,.69),receipts:clone(receipts),uniqueEvidence:[...evidenceByFp.values()],candidates:scored.map(x=>({answer:x.answer,confidence:x.confidence,uniqueSources:x.uniqueSources})),conflicts};
  }
  const strongestStance=winner.receipts.some(r=>r.stance==='correction')?'correction':winner.receipts.some(r=>r.stance==='explicit')?'explicit':'inferred';
  return {
    status:strongestStance==='inferred'&&winner.confidence<.72?'needs-owner':'resolved',
    answer:clone(winner.answer),confidence:winner.confidence,stance:strongestStance,
    receipts:clone(receipts),uniqueEvidence:[...evidenceByFp.values()],
    evidenceCount:winner.uniqueSources,retrievalConfirmations:new Set(winner.receipts.map(r=>r.proxy_id)).size,
    conflicts
  };
}
function canAutoAnswer(result,threshold=.78){
  return !!result&&result.status==='resolved'&&result.stance!=='inferred'&&result.confidence>=threshold&&!result.conflicts.length;
}
function packet(question,evidenceScope,proxyIds=['Sebastian-1','Sebastian-2','Sebastian-3','Sebastian-4']){
  return proxyIds.map(proxy_id=>({
    schema:'moor.sebastian-proxy-task',version:1,proxy_id,
    question_id:String(question.id||question.question_id||''),
    question:String(question.prompt||question.question||''),
    evidence_scope:clone(evidenceScope||{}),
    instruction:'Retrieve attributable Sebastian evidence only. Return a Sebastian Evidence Receipt. Never answer from general reasoning, model preference, or another model\'s claim. If evidence is insufficient, return stance unknown. If Sebastian evidence conflicts, return stance conflict and preserve both sides.'
  }));
}
return Object.freeze({schema:SCHEMA,version:VERSION,makeReceipt,verifyReceipt,reconcile,canAutoAnswer,packet,sourceFingerprint,hash});
});