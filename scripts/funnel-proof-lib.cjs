'use strict';

const fs=require('node:fs');
const path=require('node:path');

const protectedPaths=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'funnel-protected-paths.json'),'utf8')));

class FunnelGuardianError extends Error{
  constructor(message){super(message);this.name='FunnelGuardianError';}
}
function assert(ok,msg){if(!ok)throw new FunnelGuardianError(msg);}
function stable(x){
  if(x===null||typeof x!=='object')return JSON.stringify(x);
  if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
  return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
}
function hash(x){
  const s=typeof x==='string'?x:stable(x);let a=2166136261>>>0,b=0x9e3779b9>>>0;
  for(let i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)>>>0;b^=(s.charCodeAt(i)+(i&255));b=Math.imul(b,2246822519)>>>0;}
  return ('00000000'+a.toString(16)).slice(-8)+('00000000'+b.toString(16)).slice(-8);
}
function extractObligations(raw){
  const source=String(raw||''),parts=source.split(/(?:\n+|(?<=[.!?;])\s+)/).map(x=>x.trim()).filter(Boolean),seen={},out=[];
  for(const part of parts){
    if(!/\b(must|need(?:s)?|should|have to|has to|make sure|ensure|never|do not|don't|cannot|can't|want(?:s)?|required?|no excuse)\b/i.test(part))continue;
    const id='obligation:'+hash(part.toLowerCase());
    if(!seen[id]){seen[id]=1;out.push({id,source:part});}
  }
  if(!out.length&&source.trim())out.push({id:'obligation:'+hash(source.trim().toLowerCase()),source:source.trim()});
  return out;
}
function authMessage(repo,pr,head,files){
  return ['MOOR-FUNNEL-OWNER-AUTH-V1','repo:'+repo,'pr:'+pr,'head:'+head,'files:',...files.slice().sort()].join('\n');
}
function validateProof(p){
  assert(p&&p.schema==='moor.funnel-proof'&&p.version===1,'missing or invalid moor.funnel-proof');
  assert(p.law_version==='v45-armored','proof must use current Funnel law v45-armored');
  assert(p.page0&&typeof p.page0.raw==='string'&&p.page0.raw.trim(),'proof Page 0 is empty');
  assert(p.page0.raw_hash===hash(p.page0.raw),'proof Page 0 hash mismatch');
  for(const stage of ['references','distill','decisions','replay','verdict'])assert(p[stage]&&p[stage].stage===stage,'proof missing '+stage+' stage');
  assert(Array.isArray(p.references.reused)&&Array.isArray(p.references.missing),'references stage malformed');
  assert(typeof p.distill.spec_draft==='string'&&p.distill.spec_draft.trim(),'distill stage lacks spec draft');
  assert(Array.isArray(p.decisions.locked)&&Array.isArray(p.decisions.unresolved)&&p.decisions.unresolved.length===0,'material Funnel decisions remain unresolved');
  assert(p.replay.page0_verified===true&&p.replay.page0_hash===p.page0.raw_hash,'Page 0 replay is not bound to immutable input');
  assert(Array.isArray(p.replay.obligations),'replay obligations missing');
  const required=extractObligations(p.page0.raw),byId=new Map(p.replay.obligations.filter(Boolean).map(o=>[o.id,o]));
  for(const base of required){
    const o=byId.get(base.id);
    assert(o,'replay omitted Page 0 obligation: '+base.source);
    assert(o.source===base.source&&p.page0.raw.includes(o.source),'replay obligation source mismatch');
    assert(o.status==='satisfied'||o.status==='explicitly-deferred','invalid obligation status');
    if(o.status==='explicitly-deferred')assert(o.approved===true,'deferred obligation lacks explicit approval');
  }
  assert(!Array.isArray(p.replay.substitutions)||p.replay.substitutions.every(x=>x&&x.approved===true),'unapproved substitution in proof');
  assert(p.verdict.spec!=null&&String(typeof p.verdict.spec==='string'?p.verdict.spec:stable(p.verdict.spec)).trim(),'verdict spec is empty');
  assert(typeof p.verdict.destination==='string'&&p.verdict.destination.trim(),'verdict destination missing');
  assert(Array.isArray(p.verdict.done_criteria)&&p.verdict.done_criteria.length,'verdict done criteria missing');
  const r=p.receipt;
  assert(r&&r.schema==='moor.funnel-receipt'&&r.law_version===p.law_version,'receipt missing or wrong law');
  assert(r.request_id===p.request_id&&r.page0_hash===p.page0.raw_hash,'receipt request/Page 0 binding mismatch');
  assert(r.spec_hash===hash(p.verdict.spec),'receipt spec hash mismatch');
  assert(r.destination===p.verdict.destination,'receipt destination mismatch');
  assert(stable(r.done_criteria)===stable(p.verdict.done_criteria),'receipt done criteria mismatch');
  assert(r.ledger_head===p.verdict._event_hash,'receipt is not bound to verdict event');
  const copy=JSON.parse(JSON.stringify(r)),fp=copy.fingerprint;delete copy.fingerprint;
  assert(fp===hash(copy),'receipt fingerprint mismatch');
  return true;
}

module.exports={FunnelGuardianError,assert,stable,hash,extractObligations,authMessage,validateProof,protectedPaths};
