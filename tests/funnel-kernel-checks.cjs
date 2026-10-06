const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const K=require('../funnel-kernel.js');

K._resetForTests();
const input='Build the Pulse request path. It must preserve Page 0. Never let Buster bypass the Funnel. Make sure every build gets a receipt.';
let s=K.open({request_id:'r1',input,source:'test',context:{page:'pulse-dashboard.html'}});
assert.equal(s.stage,'page0');
assert.equal(s.page0,input);
assert.throws(()=>K.open({request_id:'r1',input:'different request'}),/immutable/);
assert.throws(()=>K.advance({request_id:'r1',stage:'distill',payload:{spec_draft:'x'}}),/Expected references/);

s=K.advance({request_id:'r1',stage:'references',payload:{reused:[],missing:[]},provenance:'learned'});
assert.equal(s.stage,'references');
K.write({request_id:'r1',kind:'evidence',value:{note:'router inspected'},provenance:'verified'});
s=K.advance({request_id:'r1',stage:'distill',payload:{spec_draft:'Preserve Page 0 and require a receipt.'},provenance:'inferred'});
assert.equal(s.stage,'distill');
assert.throws(()=>K.advance({request_id:'r1',stage:'decisions',payload:{locked:[],unresolved:['receipt format']}}),/Unresolved material decisions/);
s=K.advance({request_id:'r1',stage:'decisions',payload:{locked:[{key:'receipt',value:'required'}],unresolved:[]},provenance:'explicit'});
assert.equal(s.stage,'decisions');

const obs=K.extractObligations(input);
assert(obs.length>=3);
assert.throws(()=>K.advance({request_id:'r1',stage:'replay',payload:{page0_verified:true,page0_hash:'wrong',obligations:obs.map(o=>({...o,status:'satisfied'}))}}),/immutable Page 0/);
assert.throws(()=>K.advance({request_id:'r1',stage:'replay',payload:{page0_verified:true,page0_hash:s.stages.page0.raw_hash,obligations:obs.slice(1).map(o=>({...o,status:'satisfied'}))}}),/omitted/);

s=K.advance({request_id:'r1',stage:'replay',payload:{
  page0_verified:true,
  page0_hash:s.stages.page0.raw_hash,
  obligations:obs.map(o=>({...o,status:'satisfied'})),
  substitutions:[]
},provenance:'verified'});
assert.equal(s.stage,'replay');

s=K.advance({request_id:'r1',stage:'verdict',payload:{
  spec:{router:'MOOR.request',page0:'immutable',receipt:'required',obligations:obs.map(o=>({...o,status:'satisfied'}))},
  destination:'app-compiler-harness',
  done_criteria:['A build cannot reach Harness without a valid Funnel receipt.']
},provenance:'verified'});
assert.equal(s.stage,'verdict');
assert(s.receipt);
assert.equal(K.verifyReceipt(s.receipt),true);
const packet=K.executionPacket(s.receipt);
assert.equal(packet.destination,'app-compiler-harness');
assert.equal(packet.spec.obligations.length,obs.length);
assert.equal(packet.funnel_receipt.fingerprint,s.receipt.fingerprint);

const tampered={...s.receipt,destination:'somewhere-else'};
assert.equal(K.verifyReceipt(tampered),false);
K.write({request_id:'r1',kind:'correction',value:{note:'spec changed after verdict'},provenance:'explicit'});
assert.equal(K.verifyReceipt(s.receipt),false,'Any later write must stale the old receipt');

const root=path.resolve(__dirname,'..');
const request=fs.readFileSync(path.join(root,'moor-request.js'),'utf8');
const dash=fs.readFileSync(path.join(root,'pulse-dashboard.html'),'utf8');
const contract=fs.readFileSync(path.join(root,'FUNNEL.md'),'utf8');
assert(request.includes('funnel_receipt'));
assert(request.includes('verifyReceipt'));
assert(!request.includes('knownLocked('),'Fuzzy locked-version execution bypass must stay removed');
assert(!request.includes('arg.resolved'),'Caller-declared resolved execution bypass must stay removed');
assert(dash.indexOf('funnel-kernel.js')>=0&&dash.indexOf('funnel-kernel.js')<dash.indexOf('moor-request.js'),'Kernel must load before request router');
assert(contract.includes('v44-sealed'));
assert(contract.includes('BUSTER.md'));
console.log('PASS: sealed Funnel state order, immutable Page 0, source-backed replay, receipt gate, receipt staleness, and router anti-bypass guards');
