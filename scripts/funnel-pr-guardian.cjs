#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {assert,authMessage,validateProof,protectedPaths}=require('./funnel-proof-lib.cjs');

const root=path.resolve(__dirname,'..');

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
async function fetchJsonFile(repo,ref,file,token){
  const x=await api('https://api.github.com/repos/'+repo+'/contents/'+file.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),token);
  assert(x&&x.encoding==='base64'&&x.content,'Funnel proof file is unreadable');
  return JSON.parse(Buffer.from(x.content.replace(/\n/g,''),'base64').toString('utf8'));
}
async function main(){
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
}
if(require.main===module){
  main().catch(e=>{console.error('FUNNEL GUARDIAN DENIED: '+String(e&&e.message||e));process.exit(1);});
}
module.exports={main,proofPathFromBody,ownerSigFromBody};
