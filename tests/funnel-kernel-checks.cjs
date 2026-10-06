const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const K=require('../funnel-kernel.js');
const {validateProof}=require('../scripts/funnel-proof-lib.cjs');

K._resetForTests();
const input='Build the Pulse request path. It must preserve Page 0. Never let Buster bypass the Funnel. Make sure every build gets a receipt.';
let s=K.open({request_id:'r1',input,source:'test',context:{page:'pulse-dashboard.html'}});
assert.equal(s.stage,'page0');
assert.equal(s.page0,input);
assert.throws(()=>K.open({request_id:'r1',input:'different request'}),/immutable/);
assert.throws(()=>K.advance({request_id:'r1',stage:'distill',payload:{spec_draft:'x'}}),/Expected references/);

s=K.advance({request_id:'r1',stage:'references',payload:{reused:[],missing:[]},provenance:'learned'});
K.write({request_id:'r1',kind:'evidence',value:{note:'router inspected'},provenance:'verified'});
s=K.advance({request_id:'r1',stage:'distill',payload:{spec_draft:'Preserve Page 0 and require one-use execution authority.'},provenance:'inferred'});
assert.throws(()=>K.advance({request_id:'r1',stage:'decisions',payload:{locked:[],unresolved:['claim format']}}),/Unresolved material decisions/);
s=K.advance({request_id:'r1',stage:'decisions',payload:{locked:[{key:'execution',value:'single-use claim'}],unresolved:[]},provenance:'explicit'});

const obs=K.extractObligations(input);
assert(obs.length>=3);
assert.throws(()=>K.advance({request_id:'r1',stage:'replay',payload:{page0_verified:true,page0_hash:'wrong',obligations:obs.map(o=>({...o,status:'satisfied'}))}}),/immutable Page 0/);
assert.throws(()=>K.advance({request_id:'r1',stage:'replay',payload:{page0_verified:true,page0_hash:s.stages.page0.raw_hash,obligations:obs.slice(1).map(o=>({...o,status:'satisfied'}))}}),/omitted/);

const resolvedObs=obs.map(o=>({...o,status:'satisfied'}));
s=K.advance({request_id:'r1',stage:'replay',payload:{
  page0_verified:true,page0_hash:s.stages.page0.raw_hash,
  obligations:resolvedObs,substitutions:[]
},provenance:'verified'});

assert.throws(()=>K.advance({request_id:'r1',stage:'verdict',payload:{
  spec:{router:'MOOR.request'},destination:'app-compiler-harness',done_criteria:['works']
}}),/obligation ledger/);

s=K.advance({request_id:'r1',stage:'verdict',payload:{
  spec:{router:'MOOR.request',page0:'immutable',execution:'single-use',obligations:resolvedObs},
  destination:'app-compiler-harness',
  done_criteria:['A build cannot reach Harness without one consumed Funnel claim.']
},provenance:'verified'});
const receipt=s.receipt;
assert(receipt);
assert.equal(K.verifyReceipt(receipt),true);

const proof=K.exportProof('r1');
assert.equal(validateProof(proof),true);
const badProof=JSON.parse(JSON.stringify(proof));badProof.replay.obligations=[];
assert.throws(()=>validateProof(badProof),/omitted/);

const tampered={...receipt,destination:'somewhere-else'};
assert.equal(K.verifyReceipt(tampered),false);
assert.throws(()=>K.claimExecution(receipt,'different input','app-compiler-harness'),/Page 0/);

const claim=K.claimExecution(receipt,input,'app-compiler-harness');
assert.equal(claim.schema,'moor.funnel-execution-claim');
assert.equal(K.verifyClaim(claim),true);
assert.equal(K.verifyReceipt(receipt),false,'A receipt may mint only one claim');
assert.throws(()=>K.claimExecution(receipt,input,'app-compiler-harness'),/denied/);

const packet=K.consumeClaim(claim);
assert.equal(packet.destination,'app-compiler-harness');
assert.equal(packet.spec.obligations.length,resolvedObs.length);
assert.equal(packet.execution_claim.claim_id,claim.claim_id);
assert.equal(K.verifyClaim(claim),false);
assert.equal(K.verifyConsumedClaim(claim),true);
assert.throws(()=>K.consumeClaim(claim),/claim|consumed|denied/i);

K.write({request_id:'r1',kind:'correction',value:{note:'post-consume change'},provenance:'explicit'});
assert.equal(K.verifyConsumedClaim(claim),false,'Any post-authorization Funnel write must stale Harness authority');

const root=path.resolve(__dirname,'..');
const request=fs.readFileSync(path.join(root,'moor-request.js'),'utf8');
const dash=fs.readFileSync(path.join(root,'pulse-dashboard.html'),'utf8');
const harness=fs.readFileSync(path.join(root,'moor-harness-runtime-v1.html'),'utf8');
const contract=fs.readFileSync(path.join(root,'FUNNEL.md'),'utf8');
assert(request.includes('claimExecution'));
assert(!request.includes('knownLocked('),'Fuzzy locked-version execution bypass must stay removed');
assert(!request.includes('arg.resolved'),'Caller-declared resolved execution bypass must stay removed');
assert(dash.indexOf('funnel-kernel.js')>=0&&dash.indexOf('funnel-kernel.js')<dash.indexOf('moor-request.js'),'Kernel must load before request router');
assert(harness.includes('consumeClaim(claim)'));
assert(harness.includes('verifyConsumedClaim'));
assert(contract.includes('v45-armored'));
console.log('PASS: immutable Page 0, obligation-carrying verdict, deterministic proof, one-use receipt/claim/consume chain, and post-authorization staleness');
