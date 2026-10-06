const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {authMessage,validateProof,protectedPaths}=require('../scripts/funnel-proof-lib.cjs');
const K=require('../funnel-kernel.js');

const workflow=fs.readFileSync(path.join(root,'.github/workflows/funnel-guardian.yml'),'utf8');
assert(workflow.includes('pull_request_target'),'Guardian must execute trusted base-branch code');
assert(workflow.includes('github.event.pull_request.base.sha'),'Guardian checkout must pin the base SHA');
assert(!workflow.includes('github.event.pull_request.head.sha }}\n          path:'),'Guardian must never checkout PR head code for execution');

for(const p of ['funnel-kernel.js','moor-request.js','quiz-funnel-v3.html','moor-harness-runtime-v1.html','scripts/funnel-pr-guardian.cjs','.github/workflows/funnel-guardian.yml']){
  assert(protectedPaths.has(p),'Missing protected Funnel path: '+p);
}

const harness=fs.readFileSync(path.join(root,'moor-harness-runtime-v1.html'),'utf8');
let scripts=0;
for(const m of harness.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=/.test(m[1]))continue;
  new vm.Script(m[2],{filename:'harness inline '+(++scripts)});
}
assert(harness.includes('consumeClaim(claim)'));
assert(harness.includes('Raw Harness compilation is disabled'));
assert(harness.includes('Stage order is locked'));
assert(harness.includes('requires a fresh Funnel run'));

K._resetForTests();
const raw='Build a guarded app. It must use the Funnel. Never bypass Page 0.';
let s=K.open({request_id:'proof-test',input:raw,source:'test'});
s=K.advance({request_id:'proof-test',stage:'references',payload:{reused:[],missing:[]}});
s=K.advance({request_id:'proof-test',stage:'distill',payload:{spec_draft:'guarded app'}});
s=K.advance({request_id:'proof-test',stage:'decisions',payload:{locked:[],unresolved:[]}});
const obs=K.extractObligations(raw);
s=K.advance({request_id:'proof-test',stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(raw),obligations:obs.map(o=>({...o,status:'satisfied'})),substitutions:[]}});
s=K.advance({request_id:'proof-test',stage:'verdict',payload:{spec:{app:'guarded',obligations:obs.map(o=>({...o,status:'satisfied'}))},destination:'app-compiler-harness',done_criteria:['works']}});
const proof=K.exportProof('proof-test');
assert.equal(validateProof(proof),true);
const bad=JSON.parse(JSON.stringify(proof));bad.replay.obligations=[];
assert.throws(()=>validateProof(bad),/omitted/);

const msg=authMessage('bassseamoor/render-queue',12,'abc',['funnel-kernel.js','FUNNEL.md']);
assert(msg.includes('head:abc')&&msg.indexOf('FUNNEL.md')<msg.indexOf('funnel-kernel.js'),'Owner auth message must sort and bind exact files');

const seed=Buffer.alloc(32,7),prefix=Buffer.from('302e020100300506032b657004220420','hex');
const priv=crypto.createPrivateKey({key:Buffer.concat([prefix,seed]),format:'der',type:'pkcs8'}),pub=crypto.createPublicKey(priv);
const sig=crypto.sign(null,Buffer.from(msg),priv);
assert(crypto.verify(null,Buffer.from(msg),pub,sig));
assert(!crypto.verify(null,Buffer.from(msg+'x'),pub,sig));

console.log('PASS: base-branch Guardian, protected constitution, Harness syntax/locks, proof validation, and exact owner-signature binding');
