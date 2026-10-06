const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'moor-request.js'), 'utf8');
const store = new Map();
const localStorage = {
  getItem:k => store.has(k) ? store.get(k) : null,
  setItem:(k,v) => store.set(k,String(v))
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
    packet:q=>({query:q,concepts:[{id:'concept:couch'}],recipes:[],implementations:[],rules:[],failures:[],evidence:[],intents:[]})
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
  assert.equal(forced.result.id,'fin-test');

  const resolved=await window.MOOR.request({input:'fix this layout',source:'test',resolved:true,done_criteria:['layout works']});
  assert.equal(resolved.route,'harness');
  assert.equal(resolved.status,'ready-for-execution');
  assert.equal(resolved.result.verdict_packet.done_criteria[0],'layout works');

  console.log('PASS: zero-key fallback, reference lookup, forced Funnel, and resolved Harness routing');
})().catch(err=>{console.error(err);process.exitCode=1;});
