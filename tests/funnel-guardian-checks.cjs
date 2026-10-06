const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const {authMessage,validateProof,protectedPaths}=require('../scripts/funnel-proof-lib.cjs');
const guardianSrc=fs.readFileSync(path.join(root,'scripts/funnel-pr-guardian.cjs'),'utf8');
const K=require('../funnel-kernel.js');

const workflow=fs.readFileSync(path.join(root,'.github/workflows/funnel-guardian.yml'),'utf8');
assert(workflow.includes('pull_request_target'),'Guardian must execute trusted base-branch code');
assert(workflow.includes('github.event.pull_request.base.sha'),'Guardian checkout must pin the base SHA');
assert(!workflow.includes('github.event.pull_request.head.sha }}\n          path:'),'Guardian must never checkout PR head code for execution');

for(const p of [
  'funnel-kernel.js','moor-request.js','quiz-funnel-v3.html','moor-harness-runtime-v1.html',
  'scripts/funnel-pr-guardian.cjs','scripts/funnel-proof-lib.cjs','scripts/funnel-owner-key.cjs',
  'scripts/funnel-protected-paths.json','.github/workflows/funnel-guardian.yml',
  'tests/funnel-runtime-checks.cjs','tests/harness-funnel-gate-checks.cjs','tests/funnel-guardian-checks.cjs'
]){
  assert(protectedPaths.has(p),'Missing protected Funnel path: '+p);
}

assert(guardianSrc.includes("lawChanged.length===1&&lawChanged[0]==='funnel-owner-public.pem'"),'Bootstrap exception must be public-key-only');
assert(guardianSrc.includes("verification.verified===true"),'Bootstrap commit must be GitHub-verified');
assert(guardianSrc.includes("commit.author&&commit.author.login==='bassseamoor'"),'Bootstrap commit author must be owner');
assert(guardianSrc.includes("asymmetricKeyType==='ed25519'"),'Bootstrap key must be Ed25519');
assert(guardianSrc.includes("!candidate.includes('PRIVATE KEY')"),'Private key material must be rejected');

const harness=fs.readFileSync(path.join(root,'moor-harness-runtime-v1.html'),'utf8');
let scripts=0;
for(const m of harness.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=/.test(m[1]))continue;
  new vm.Script(m[2],{filename:'harness inline '+(++scripts)});
}
assert(harness.includes('consumeClaim(claim)'));
assert(harness.includes('verifyConsumedClaim(claim)'));
assert(harness.includes('Stage order is locked'));
assert(harness.includes('await routeRawIntakeToFunnel(r,{mode:"build"})'));
assert(harness.includes('await routeRawIntakeToFunnel(r,{mode:"modify",base_version:H.canon})'));
assert(harness.includes('await routeRawIntakeToFunnel(SAMPLE_RAMBLE,{mode:"demo"})'));

K._resetForTests();
const raw='Build a guarded app. It must use the Funnel. Never bypass Page 0.';
let s=K.open({request_id:'proof-test',input:raw,source:'test'});
s=K.advance({request_id:'proof-test',stage:'references',payload:{reused:[],missing:[]}});
s=K.advance({request_id:'proof-test',stage:'distill',payload:{spec_draft:'guarded app'}});
s=K.advance({request_id:'proof-test',stage:'decisions',payload:{locked:[],unresolved:[]}});
const obs=K.extractObligations(raw),resolved=obs.map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:'proof-test',stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(raw),obligations:resolved,substitutions:[]}});
s=K.advance({request_id:'proof-test',stage:'verdict',payload:{spec:{app:'guarded',obligations:resolved},destination:'app-compiler-harness',done_criteria:['works']}});
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

console.log('PASS: trusted-base Guardian, one-time signed key bootstrap, protected constitution, one-use Harness authority, proof validation, and exact owner-signature binding');
