#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const readline=require('node:readline');

const REPO='bassseamoor/render-queue';
const SALT='MOOR-FUNNEL-OWNER-v1:'+REPO;
const root=path.resolve(__dirname,'..');
const protectedPaths=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'funnel-protected-paths.json'),'utf8')));

function promptHidden(label){
  return new Promise((resolve,reject)=>{
    if(!process.stdin.isTTY)return reject(new Error('Owner password prompt requires a TTY.'));
    process.stdout.write(label);
    const stdin=process.stdin,wasRaw=stdin.isRaw;
    let value='';
    stdin.setRawMode(true);stdin.resume();stdin.setEncoding('utf8');
    function done(err){
      stdin.removeListener('data',onData);
      stdin.setRawMode(!!wasRaw);stdin.pause();process.stdout.write('\n');
      if(err)reject(err);else resolve(value);
    }
    function onData(ch){
      if(ch==='\u0003')return done(new Error('cancelled'));
      if(ch==='\r'||ch==='\n')return done();
      if(ch==='\u007f'||ch==='\b'){value=value.slice(0,-1);return}
      if(ch>=' ')value+=ch;
    }
    stdin.on('data',onData);
  });
}
function derive(password){
  if(String(password).length<20)throw new Error('Use a high-entropy owner passphrase of at least 20 characters. The public key permits offline guessing attempts.');
  const seed=crypto.scryptSync(password,SALT,32,{N:131072,r:8,p:1,maxmem:256*1024*1024});
  const prefix=Buffer.from('302e020100300506032b657004220420','hex');
  const privateKey=crypto.createPrivateKey({key:Buffer.concat([prefix,seed]),format:'der',type:'pkcs8'});
  const publicKey=crypto.createPublicKey(privateKey);
  return {privateKey,publicPem:publicKey.export({format:'pem',type:'spki'}).toString()};
}
async function gh(url){
  const res=await fetch(url,{headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'moor-funnel-owner'}});
  if(!res.ok)throw new Error('GitHub API '+res.status+' '+await res.text());
  return res.json();
}
async function prFiles(n){
  let page=1,out=[];
  while(true){
    const rows=await gh('https://api.github.com/repos/'+REPO+'/pulls/'+n+'/files?per_page=100&page='+page);
    out=out.concat(rows.map(x=>x.filename));
    if(rows.length<100)return out;
    page++;
  }
}
function authMessage(pr,head,files){
  return ['MOOR-FUNNEL-OWNER-AUTH-V1','repo:'+REPO,'pr:'+pr,'head:'+head,'files:',...files.slice().sort()].join('\n');
}
(async()=>{
  const cmd=process.argv[2]||'help';
  if(cmd==='bootstrap'){
    const a=await promptHidden('Choose Funnel owner passphrase: ');
    const b=await promptHidden('Repeat passphrase: ');
    if(a!==b)throw new Error('Passphrases do not match.');
    const key=derive(a);
    process.stdout.write('\nPublic key only — safe to commit as funnel-owner-public.pem:\n\n'+key.publicPem+'\n');
    return;
  }
  if(cmd==='sign'){
    const n=Number(process.argv[3]);
    if(!n)throw new Error('Usage: node scripts/funnel-owner-key.cjs sign <PR number>');
    const pr=await gh('https://api.github.com/repos/'+REPO+'/pulls/'+n);
    const files=(await prFiles(n)).filter(f=>protectedPaths.has(f)).sort();
    if(!files.length)throw new Error('That PR does not change protected Funnel-law paths.');
    const password=await promptHidden('Funnel owner passphrase: ');
    const key=derive(password);
    const configured=fs.readFileSync(path.join(root,'funnel-owner-public.pem'),'utf8').trim();
    if(!/^UNCONFIGURED/.test(configured)&&key.publicPem.trim()!==configured)throw new Error('Passphrase does not derive the configured owner public key.');
    const message=authMessage(n,pr.head.sha,files);
    const sig=crypto.sign(null,Buffer.from(message),key.privateKey).toString('base64url');
    process.stdout.write('\nAdd this exact line to PR #'+n+' body:\n\nFunnel-Owner-Authorization: ed25519:'+sig+'\n');
    return;
  }
  process.stdout.write('MOOR Funnel owner key utility\n\n  bootstrap   derive the public key from a password without storing the password\n  sign <PR>   sign one exact protected PR head + protected file set\n');
})().catch(e=>{console.error('ERROR: '+String(e&&e.message||e));process.exit(1);});
