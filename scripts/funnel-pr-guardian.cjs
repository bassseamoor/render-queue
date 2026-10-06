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
function ownerBootstrapFromBody(body){
  return /^Funnel-Owner-Bootstrap:\s*I am setting the owner key\s*$/mi.test(String(body||''));
}
async function fetchTextFile(repo,ref,file,token){
  const x=await api('https://api.github.com/repos/'+repo+'/contents/'+file.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref),token);
  assert(x&&x.encoding==='base64'&&x.content,'requested repository file is unreadable');
  return Buffer.from(x.content.replace(/\n/g,''),'base64').toString('utf8');
}
async function verifyOneTimeBootstrap(repo,pr,lawChanged,token){
  assert(lawChanged.length===1&&lawChanged[0]==='funnel-owner-public.pem','unconfigured constitution only permits the one-time owner public-key bootstrap');
  assert(ownerBootstrapFromBody(pr.body),'one-time key bootstrap requires: Funnel-Owner-Bootstrap: I am setting the owner key');
  assert(pr.user&&pr.user.login==='bassseamoor','owner-key bootstrap PR must be opened by repository owner bassseamoor');
  const commit=await api('https://api.github.com/repos/'+repo+'/commits/'+pr.head.sha,token);
  assert(commit&&commit.commit&&commit.commit.verification&&commit.commit.verification.verified===true,'owner-key bootstrap head commit must be GitHub-verified/signed');
  assert(commit.author&&commit.author.login==='bassseamoor','owner-key bootstrap head commit must be authored by bassseamoor');
  const candidate=(await fetchTextFile(repo,pr.head.sha,'funnel-owner-public.pem',token)).trim();
  let key=null;
  try{key=crypto.createPublicKey(candidate);}catch(e){}
  assert(key&&key.asymmetricKeyType==='ed25519','bootstrap file must contain exactly a valid Ed25519 public key');
  assert(!candidate.includes('PRIVATE KEY'),'private key material is forbidden');
  console.log('PASS: one-time GitHub-verified owner public-key bootstrap accepted');
  return true;
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
    if(!pem||/^UNCONFIGURED/.test(pem)){
      await verifyOneTimeBootstrap(repo,pr,lawChanged,token);
    }else{
      const sig=ownerSigFromBody(pr.body);
      assert(sig,'protected Funnel-law change requires Funnel-Owner-Authorization: ed25519:<signature>');
      const message=authMessage(repo,prNumber,pr.head.sha,lawChanged);
      let ok=false;
      try{ok=crypto.verify(null,Buffer.from(message),crypto.createPublicKey(pem),Buffer.from(sig,'base64url'));}catch(e){ok=false;}
      assert(ok,'owner signature is invalid for this exact PR head and protected file set');
      console.log('PASS: owner signature verified for '+lawChanged.length+' protected Funnel-law path(s)');
    }
  }
}
if(require.main===module){
  main().catch(e=>{console.error('FUNNEL GUARDIAN DENIED: '+String(e&&e.message||e));process.exit(1);});
}
module.exports={main,proofPathFromBody,ownerSigFromBody,ownerBootstrapFromBody,verifyOneTimeBootstrap};
