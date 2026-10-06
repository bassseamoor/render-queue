#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.resolve(__dirname,'..');
const protectedPaths=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'funnel-protected-paths.json'),'utf8')));

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
function fail(msg){console.error('FUNNEL GUARDIAN DENIED: '+msg);process.exit(1);}
function assert(ok,msg){if(!ok)fail(msg);}
function authMessage(repo,pr,head,files){
  return ['MOOR-FUNNEL-OWNER-AUTH-V1','repo:'+repo,'pr:'+pr,'head:'+head,'files:',...files.slice().sort()].join('\n');
}
async function api(url,token){
  const res=await fetch(url,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28','User-Agent':'moor-funnel-guardian'}});
  if(!res.ok)throw new Error('GitHub API '+res.status+' '+await res.text());
  return res.json();
}
async function allFiles(repo,pr,token){
  let page=1,out=[];
  while(true){
    const rows=await api('https://api.github.com/repos/'+repo+'/pulls/'+pr+'/files?per_page=100&page='+page,token);
    out=out.concat(rows);
    if(rows.length<100)return out;
    page++;
  }
}
function proofPathFromBody(body){
  const m=String(body||'').match(/^Funnel-Proof:\s*(\.funnel\/proofs\/[A-Za-z0-9._/-]+\.json)\s*$/mi);
  return m&&m[1];
}
function ownerSigFromBody(body){
  const m=String(body||'').match(/^Funnel-Owner-Authorization:\s*ed25519:([A-Za-z0-9_-]+)\s*$/mi);
  return m&&m[1];
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
async function fetchJsonFile(repo,ref,file,token){
  const x=await api('https://api.github.com/repos/'+repo+'/contents/'+file.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),token);
  assert(x&&x.encoding==='base64'&&x.content,'Funnel proof file is unreadable');
  return JSON.parse(Buffer.from(x.content.replace(/\n/g,''),'base64').toString('utf8'));
}

(async()=>{
  const repo=process.env.GITHUB_REPOSITORY,prNumber=Number(process.env.PR_NUMBER),token=process.env.GH_TOKEN;
  assert(repo&&prNumber&&token,'guardian environment is incomplete');
  const pr=await api('https://api.github.com/repos/'+repo+'/pulls/'+prNumber,token);
  const files=(await allFiles(repo,prNumber,token)).map(x=>x.filename);
  const meaningful=files.filter(f=>!f.startsWith('.funnel/proofs/'));
  if(!meaningful.length){console.log('PASS: proof-only PR; no product mutation');return;}

  const proofPath=proofPathFromBody(pr.body);
  assert(proofPath,'every product/repository mutation requires a PR body line: Funnel-Proof: .funnel/proofs/<file>.json');
  const proof=await fetchJsonFile(repo,pr.head.sha,proofPath,token);
  validateProof(proof);
  console.log('PASS: deterministic Funnel proof verified for '+meaningful.length+' changed path(s)');

  const lawChanged=files.filter(f=>protectedPaths.has(f)).sort();
  if(lawChanged.length){
    const pem=fs.readFileSync(path.join(root,'funnel-owner-public.pem'),'utf8').trim();
    assert(pem&&!/^UNCONFIGURED/.test(pem),'Funnel constitution is fail-closed: owner public key has not been bootstrapped');
    const sig=ownerSigFromBody(pr.body);
    assert(sig,'protected Funnel-law change requires Funnel-Owner-Authorization: ed25519:<signature>');
    const message=authMessage(repo,prNumber,pr.head.sha,lawChanged);
    let ok=false;
    try{ok=crypto.verify(null,Buffer.from(message),crypto.createPublicKey(pem),Buffer.from(sig,'base64url'));}catch(e){ok=false;}
    assert(ok,'owner signature is invalid for this exact PR head and protected file set');
    console.log('PASS: owner signature verified for '+lawChanged.length+' protected Funnel-law path(s)');
  }
})().catch(e=>{console.error(e&&e.stack||e);process.exit(1);});
