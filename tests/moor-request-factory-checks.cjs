const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const store=new Map();
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const document={readyState:'loading',title:'Pulse Factory Test',body:{dataset:{}},addEventListener:()=>{},activeElement:{tagName:'BODY'}};
const location={href:'https://example.test/pulse-dashboard.html',pathname:'/pulse-dashboard.html'};
const events=[];
const window={parent:null,document,location,localStorage,addEventListener:()=>{},dispatchEvent:e=>events.push(e)};
window.parent=window;
const context=vm.createContext({window,document,location,localStorage,URLSearchParams,URL,Promise,Date,Math,JSON,String,Array,Object,RegExp,Number,Map,Set,TextEncoder,setTimeout:()=>0,clearTimeout:()=>{},CustomEvent:function(type,x){this.type=type;this.detail=x&&x.detail}});
for(const file of ['funnel-usage-plan-core.js','funnel-kernel.js','software-factory-core.js','moor-request.js']){
  new vm.Script(fs.readFileSync(file,'utf8'),{filename:file}).runInContext(context);
}
window.MOORFunnelKernel=context.MOORFunnelKernel;
window.MoorSoftwareFactory=context.MoorSoftwareFactory;
assert(window.MOORFunnelKernel);
assert(window.MoorSoftwareFactory);
assert(window.MOOR&&typeof window.MOOR.request==='function');

window.PulseReferences={
  search:()=>[],
  packet:q=>({query:q,concepts:[],recipes:[],implementations:[],rules:[],failures:[],evidence:[],intents:[],capabilities:[{id:'capability:existing@1',kind:'capability',title:'existing'}],assemblies:[],compositions:[],handoffs:[],learning:[]}),
  add:()=>{}
};
window.PulseSpine={references:[],request:(input,ctx,source)=>({id:'queued',input,ctx,source})};

(async()=>{
  const input='Build a verified reusable widget and push it to Pulse.';
  const queued=await window.MOOR.request({input,source:'test',forceFunnel:true});
  assert.equal(queued.route,'funnel');
  assert(queued.result.work_order,'build request must create a software factory work order');
  assert.equal(queued.result.work_order.state,'ROUTED');
  assert(queued.result.work_order.bom.parts.some(p=>p.id==='capability:existing@1'),'known machine must enter the BOM');

  const K=window.MOORFunnelKernel,id='factory-receipt-test';
  let s=K.open({request_id:id,input,source:'test',context:{}});
  const usagePlan=K.makeUsagePlan(input,{page:'pulse-dashboard.html',source:'test'},{execution_plan:{build_required:true,builder:'Harness/builders after Funnel authorization',destination:'app-compiler-harness',reuse_before_new:true}});
  s=K.advance({request_id:id,stage:'usage_plan',payload:{plan:usagePlan},provenance:'system'});
  s=K.advance({request_id:id,stage:'references',payload:{reused:[],missing:[]},provenance:'learned'});
  s=K.advance({request_id:id,stage:'distill',payload:{spec_draft:'Build verified reusable widget.'},provenance:'inferred'});
  s=K.advance({request_id:id,stage:'decisions',payload:{locked:[{key:'build',value:'widget'}],unresolved:[]},provenance:'explicit'});
  const obs=K.extractObligations(input);
  s=K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(input),obligations:obs.map(o=>({...o,status:'satisfied'})),substitutions:[]},provenance:'verified'});
  s=K.advance({request_id:id,stage:'verdict',payload:{spec:{task:'widget',obligations:obs.map(o=>({...o,status:'satisfied'}))},destination:'app-compiler-harness',done_criteria:['verified widget exists']},provenance:'verified'});
  assert(K.verifyReceipt(s.receipt));
  assert.equal(s.receipt.usage_plan_hash,s.stages.usage_plan.plan_hash);

  const approved=await window.MOOR.request({input,source:'test',forceFunnel:true,funnel_receipt:s.receipt});
  assert.equal(approved.route,'harness');
  assert(approved.result.work_order,'Harness handoff must retain work order');
  assert.equal(approved.result.work_order.state,'IN_PROCESS');
  assert.equal(approved.result.work_order.current_operation.station_id,'harness');
  assert.equal(JSON.parse(store.get('moor-harness-inbox-v1')).work_order_id,approved.result.work_order.work_order_id);
  const persisted=window.MoorSoftwareFactory.get(approved.result.work_order.work_order_id);
  assert.equal(persisted.travelers.length,1,'Funnel completion must create a traveler before Harness');
  assert(persisted.authorization&&persisted.authorization.receipt_fingerprint===s.receipt.fingerprint);

  const released=window.MOOR.factoryOutput({
    work_order_id:persisted.work_order_id,
    id:'implementation:test:1',
    implementation_ref:'test-output.html#v1',
    status:'machine-verified',
    payload:{version:'1'},
    evidence:{logic:{status:'verified-working',gates:'syntax+boot+behavior+integration+regression'}}
  });
  assert.equal(released.state,'RELEASED','machine-verified Harness output must close the production traveler');
  assert.equal(released.travelers.length,3,'Funnel, Harness and Verifier must each leave a traveler');
  assert.equal(released.inspections.length,3,'Funnel, Harness and release verification must each be inspected');
  assert(released.release&&released.release.fingerprint,'released work order must carry a release record');

  console.log('PASS: build requests become routed software work orders, reuse known machinery in the BOM, bind Funnel authority, travel through Funnel/Harness/Verifier, and release only from verified Harness output');
})().catch(err=>{console.error(err);process.exitCode=1;});
