const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const usagePlanSrc = fs.readFileSync(path.join(root, 'funnel-usage-plan-core.js'), 'utf8');
const kernelSrc = fs.readFileSync(path.join(root, 'funnel-kernel.js'), 'utf8');
const src = fs.readFileSync(path.join(root, 'moor-request.js'), 'utf8');
const store = new Map();
const localStorage = {
  getItem:k => store.has(k) ? store.get(k) : null,
  setItem:(k,v) => store.set(k,String(v)),
  removeItem:k => store.delete(k)
};
const document = {
  readyState:'loading',
  title:'Pulse Test',
  body:{dataset:{}},
  addEventListener:()=>{},
  activeElement:{tagName:'BODY'}
};
const location = {href:'https://example.test/pulse-dashboard.html',pathname:'/pulse-dashboard.html'};
const window = {
  parent:null,
  document,
  location,
  localStorage,
  addEventListener:()=>{},
  dispatchEvent:()=>{}
};
window.parent=window;
const context = vm.createContext({
  window,document,location,localStorage,
  URLSearchParams,URL,Promise,Date,Math,JSON,String,Array,Object,RegExp,Number,
  setTimeout:()=>0,clearTimeout:()=>{},CustomEvent:function(){}
});
new vm.Script(usagePlanSrc,{filename:'funnel-usage-plan-core.js'}).runInContext(context);
window.FunnelUsagePlan=context.FunnelUsagePlan;
new vm.Script(kernelSrc,{filename:'funnel-kernel.js'}).runInContext(context);
window.MOORFunnelKernel=context.MOORFunnelKernel;
assert(window.MOORFunnelKernel && typeof window.MOORFunnelKernel.verifyReceipt === 'function');
new vm.Script(src,{filename:'moor-request.js'}).runInContext(context);
assert(window.MOOR && typeof window.MOOR.request === 'function');

(async()=>{
  const empty=await window.MOOR.request({input:'',source:'test'});
  assert.equal(empty.route,'fallback');
  assert.equal(empty.provenance,'fallback');

  const noKey=await window.MOOR.request({input:'build me a couch tool',source:'test'});
  assert.equal(noKey.route,'funnel');
  assert.equal(noKey.status,'queued');
  assert(JSON.parse(store.get('moor-request-queue-v1')).length===1,'zero-key route should queue locally');

  window.PulseReferences={
    search:()=>[{id:'concept:couch',kind:'concept',title:'couch',status:'observed'}],
    packet:q=>({query:q,concepts:[{id:'concept:couch'}],recipes:[],implementations:[],rules:[],failures:[],evidence:[],intents:[]}),
    add:()=>{}
  };
  window.PulseSpine={
    references:[{id:'concept:couch',kind:'concept',title:'couch'}],
    request:(input,ctx,source)=>({id:'fin-test',input,ctx,source})
  };

  const lookup=await window.MOOR.request({input:'find couch',source:'test'});
  assert.equal(lookup.route,'reference');
  assert.equal(lookup.status,'resolved');

  const forced=await window.MOOR.request({input:'change this layout',source:'test',forceFunnel:true});
  assert.equal(forced.route,'funnel');
  assert.equal(forced.status,'queued');
  assert.equal(forced.result.queue.id,'fin-test');

  const callerClaimsResolved=await window.MOOR.request({input:'fix this layout',source:'test',resolved:true,done_criteria:['layout works']});
  assert.equal(callerClaimsResolved.route,'funnel','Caller confidence cannot bypass Funnel law');
  assert.equal(callerClaimsResolved.status,'queued');

  const K=window.MOORFunnelKernel;
  const receiptInput='fix this layout';
  const rid='receipt-route-test';
  let s=K.open({request_id:rid,input:receiptInput,source:'test',context:{}});
  s=K.advance({request_id:rid,stage:'usage_plan',payload:{plan:K.makeUsagePlan(receiptInput,{page:'test'})},provenance:'system'});
  assert.equal(s.stage,'usage_plan');
  s=K.advance({request_id:rid,stage:'references',payload:{reused:[],missing:[]},provenance:'learned'});
  s=K.advance({request_id:rid,stage:'distill',payload:{spec_draft:'Fix the layout through the verified route.'},provenance:'inferred'});
  s=K.advance({request_id:rid,stage:'decisions',payload:{locked:[{key:'route',value:'harness-after-funnel'}],unresolved:[]},provenance:'explicit'});
  const obs=K.extractObligations(receiptInput);
  s=K.advance({request_id:rid,stage:'replay',payload:{
    page0_verified:true,
    page0_hash:K.hash(receiptInput),
    obligations:obs.map(o=>({id:o.id,source:o.source,status:'satisfied'})),
    substitutions:[]
  },provenance:'verified'});
  s=K.advance({request_id:rid,stage:'verdict',payload:{
    spec:{task:'fix layout',obligations:obs.map(o=>({id:o.id,source:o.source,status:'satisfied'}))},
    destination:'app-compiler-harness',
    done_criteria:['layout works']
  },provenance:'verified'});
  const receipt=s.receipt;
  assert(K.verifyReceipt(receipt));

  const approved=await window.MOOR.request({input:receiptInput,source:'test',funnel_receipt:receipt});
  assert.equal(approved.route,'harness');
  assert.equal(approved.status,'ready-for-execution');
  assert.equal(approved.result.verdict_packet.done_criteria[0],'layout works');

  const replayAttack=await window.MOOR.request({input:'fix a different layout',source:'test',funnel_receipt:receipt});
  assert.equal(replayAttack.route,'funnel');
  assert.equal(replayAttack.status,'locked','Receipt must be bound to exact Page 0 input');

  console.log('PASS: zero-key queue, reference lookup, mandatory Funnel routing, caller-bypass denial, exact-Page-0 receipt binding, and verified Harness execution');
})().catch(err=>{console.error(err);process.exitCode=1;});
