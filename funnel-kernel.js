/* MOOR Funnel Kernel — sealed deterministic request state machine.
 * Models may write through this API. They cannot mutate Funnel law or mint receipts.
 */
(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MOORFunnelKernel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

var SCHEMA='moor.funnel-kernel-state';
var RECEIPT_SCHEMA='moor.funnel-receipt';
var VERSION=1;
var LAW_VERSION='v44-sealed';
var STORE='moor.funnel.kernel.v1';
var ACTIVE='moor.funnel.active-request.v1';
var STAGES=Object.freeze(['page0','references','distill','decisions','replay','verdict']);
var WRITABLE=Object.freeze(['answer','evidence','failure','correction','reference','note']);
var mem=null;

function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function text(x){return String(x==null?'':x);}
function stable(x){
  if(x===null||typeof x!=='object')return JSON.stringify(x);
  if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
  return '{'+Object.keys(x).sort().map(function(k){return JSON.stringify(k)+':'+stable(x[k]);}).join(',')+'}';
}
function hash(x){
  var s=typeof x==='string'?x:stable(x),a=2166136261>>>0,b=0x9e3779b9>>>0;
  for(var i=0;i<s.length;i++){
    a^=s.charCodeAt(i);a=Math.imul(a,16777619)>>>0;
    b^=(s.charCodeAt(i)+(i&255));b=Math.imul(b,2246822519)>>>0;
  }
  return ('00000000'+a.toString(16)).slice(-8)+('00000000'+b.toString(16)).slice(-8);
}
function blank(){return {schema:SCHEMA,version:VERSION,law_version:LAW_VERSION,ledger:[]};}
function readRaw(){
  if(root&&root.localStorage){
    try{var x=JSON.parse(root.localStorage.getItem(STORE)||'null');if(x)return x;}catch(e){}
  }
  return mem?clone(mem):blank();
}
function writeRaw(s){
  mem=clone(s);
  if(root&&root.localStorage){try{root.localStorage.setItem(STORE,JSON.stringify(s));}catch(e){}}
}
function verifyState(s){
  if(!s||s.schema!==SCHEMA||s.version!==VERSION||s.law_version!==LAW_VERSION||!Array.isArray(s.ledger))return false;
  var prev='GENESIS';
  for(var i=0;i<s.ledger.length;i++){
    var e=s.ledger[i];
    if(!e||e.seq!==i+1||e.prev_hash!==prev||typeof e.hash!=='string')return false;
    var body={seq:e.seq,prev_hash:e.prev_hash,type:e.type,request_id:e.request_id,payload:e.payload,provenance:e.provenance,at:e.at};
    if(hash(body)!==e.hash)return false;
    prev=e.hash;
  }
  return true;
}
function state(){
  var s=readRaw();
  if(!verifyState(s)){
    if(s&&Array.isArray(s.ledger)&&s.ledger.length)throw Error('Funnel kernel ledger failed integrity validation. Execution receipts are locked.');
    s=blank();writeRaw(s);
  }
  return s;
}
function append(type,requestId,payload,provenance){
  var s=state(),prev=s.ledger.length?s.ledger[s.ledger.length-1].hash:'GENESIS';
  var body={seq:s.ledger.length+1,prev_hash:prev,type:type,request_id:requestId,payload:clone(payload||{}),provenance:provenance||'system',at:new Date().toISOString()};
  var e=Object.assign({},body,{hash:hash(body)});
  s.ledger.push(e);writeRaw(s);return clone(e);
}
function events(requestId){return state().ledger.filter(function(e){return e.request_id===requestId;});}
function session(requestId){
  var es=events(requestId),out={request_id:requestId,stage:null,page0:null,writes:[],stages:{},receipt:null,tainted:false};
  es.forEach(function(e){
    if(e.type==='stage'){
      out.stage=e.payload.stage;out.stages[e.payload.stage]=clone(e.payload);out.stages[e.payload.stage]._event_hash=e.hash;
      if(e.payload.stage==='page0')out.page0=e.payload.raw;
    }else if(e.type==='write')out.writes.push(clone(e.payload));
    else if(e.type==='receipt')out.receipt=clone(e.payload);
  });
  return out;
}
function active(requestId){
  if(requestId)return requestId;
  if(root&&root.localStorage){try{return root.localStorage.getItem(ACTIVE)||'';}catch(e){}}
  return '';
}
function setActive(id){if(root&&root.localStorage){try{root.localStorage.setItem(ACTIVE,id);}catch(e){}}}
function open(arg){
  arg=arg||{};var id=text(arg.request_id).trim(),raw=text(arg.input);
  if(!id)throw Error('Funnel kernel requires request_id.');
  if(!raw.trim())throw Error('Page 0 cannot be empty.');
  var cur=session(id);
  if(cur.page0!==null){
    if(cur.page0!==raw)throw Error('Page 0 is immutable for this request.');
    setActive(id);return cur;
  }
  append('stage',id,{stage:'page0',raw:raw,raw_hash:hash(raw),source:arg.source||'unknown',context:clone(arg.context||{})},'explicit');
  setActive(id);return session(id);
}
function write(arg){
  arg=arg||{};var id=active(arg.request_id),kind=text(arg.kind).trim();
  if(!id||!session(id).page0)throw Error('Open Page 0 before writing to the Funnel.');
  if(WRITABLE.indexOf(kind)<0)throw Error('Write kind is not allowed by Funnel law.');
  var payload={kind:kind,value:clone(arg.value),source:arg.source||'agent'};
  return append('write',id,payload,arg.provenance||'inferred');
}
function requiredNext(s){
  if(!s.stage)return 'page0';
  var i=STAGES.indexOf(s.stage);return i<0?null:STAGES[i+1]||null;
}
function checkReplay(payload,s){
  if(!payload||payload.page0_verified!==true)throw Error('Replay must explicitly verify Page 0.');
  if(payload.page0_hash!==s.stages.page0.raw_hash)throw Error('Replay must use the immutable Page 0 snapshot.');
  if(!Array.isArray(payload.obligations))throw Error('Replay requires atomic obligation results.');
  var base=extractObligations(s.page0),byId={};
  payload.obligations.forEach(function(o){if(o&&o.id)byId[o.id]=o;});
  var missing=base.filter(function(o){return !byId[o.id];});
  if(missing.length)throw Error('Replay omitted '+missing.length+' hard-coded Page 0 obligation(s).');
  var bad=payload.obligations.filter(function(o){
    if(!o||!o.id||!o.source||!s.page0.includes(o.source))return true;
    if(!['satisfied','explicitly-deferred'].includes(o.status))return true;
    if(o.status==='explicitly-deferred'&&o.approved!==true)return true;
    return false;
  });
  if(bad.length)throw Error('Every Page 0 obligation must be source-backed and satisfied, or explicitly deferred with approval.');
  if(payload.substitutions&&payload.substitutions.some(function(x){return !x||x.approved!==true;}))throw Error('Unapproved substitution blocks Funnel receipt.');
}
function extractObligations(raw){
  var source=text(raw),parts=source.split(/(?:\n+|(?<=[.!?;])\s+)/).map(function(x){return x.trim();}).filter(Boolean);
  var seen={},out=[];
  parts.forEach(function(part){
    if(!/\b(must|need(?:s)?|should|have to|has to|make sure|ensure|never|do not|don't|cannot|can't|want(?:s)?|required?|no excuse)\b/i.test(part))return;
    var id='obligation:'+hash(part.toLowerCase());
    if(!seen[id]){seen[id]=1;out.push({id:id,source:part});}
  });
  if(!out.length&&source.trim())out.push({id:'obligation:'+hash(source.trim().toLowerCase()),source:source.trim()});
  return out;
}
function receiptFor(id,verdict,head,page0Hash){
  var core={schema:RECEIPT_SCHEMA,version:VERSION,law_version:LAW_VERSION,request_id:id,page0_hash:page0Hash,spec_hash:hash(verdict.spec),destination:verdict.destination,done_criteria:clone(verdict.done_criteria),ledger_head:head,issued_at:new Date().toISOString()};
  return Object.assign({},core,{fingerprint:hash(core)});
}
function advance(arg){
  arg=arg||{};var id=active(arg.request_id),to=text(arg.stage).trim(),payload=clone(arg.payload||{}),prov=arg.provenance||'inferred';
  if(!id)throw Error('No active Funnel request.');
  var s=session(id),next=requiredNext(s);
  if(!next)throw Error('Funnel is already at its terminal stage.');
  if(to!==next)throw Error('Funnel stage order is locked. Expected '+next+', got '+to+'.');
  if(to==='references'){
    if(!Array.isArray(payload.reused))payload.reused=[];
    if(!Array.isArray(payload.missing))payload.missing=[];
  }
  if(to==='distill'){
    if(!payload.spec_draft||!text(payload.spec_draft).trim())throw Error('Distill stage requires a non-empty spec draft.');
  }
  if(to==='decisions'){
    if(!Array.isArray(payload.locked))throw Error('Decisions stage requires locked decisions, even if empty.');
    if(!Array.isArray(payload.unresolved))payload.unresolved=[];
    if(payload.unresolved.length)throw Error('Unresolved material decisions block replay.');
  }
  if(to==='replay')checkReplay(payload,s);
  if(to==='verdict'){
    if(!payload.spec||!text(typeof payload.spec==='string'?payload.spec:stable(payload.spec)).trim())throw Error('Verdict requires spec.');
    if(!text(payload.destination).trim())throw Error('Verdict requires destination.');
    if(!Array.isArray(payload.done_criteria)||!payload.done_criteria.length)throw Error('Verdict requires done criteria.');
    var replay=s.stages.replay;if(!replay)throw Error('Page 0 replay is required before verdict.');
    var verdictEvent=append('stage',id,Object.assign({stage:to},payload),prov);
    var receipt=receiptFor(id,payload,verdictEvent.hash,s.stages.page0.raw_hash);
    append('receipt',id,receipt,'system');
    return session(id);
  }
  append('stage',id,Object.assign({stage:to},payload),prov);
  return session(id);
}
function verifyReceipt(receipt){
  if(!receipt||receipt.schema!==RECEIPT_SCHEMA||receipt.version!==VERSION||receipt.law_version!==LAW_VERSION)return false;
  var copy=clone(receipt),fp=copy.fingerprint;delete copy.fingerprint;
  if(hash(copy)!==fp)return false;
  var s=session(receipt.request_id),es=events(receipt.request_id),last=es[es.length-1];
  if(!s.receipt||s.receipt.fingerprint!==receipt.fingerprint||!s.stages.replay||!s.stages.verdict)return false;
  if(!last||last.type!=='receipt'||!last.payload||last.payload.fingerprint!==receipt.fingerprint)return false;
  if(s.stages.page0.raw_hash!==receipt.page0_hash)return false;
  if(hash(s.stages.verdict.spec)!==receipt.spec_hash)return false;
  if(s.stages.verdict._event_hash!==receipt.ledger_head)return false;
  return verifyState(state());
}
function executionPacket(receipt){
  if(!verifyReceipt(receipt))throw Error('Harness execution denied: missing or invalid Funnel receipt.');
  var v=session(receipt.request_id).stages.verdict;
  return {spec:clone(v.spec),destination:v.destination,done_criteria:clone(v.done_criteria),funnel_receipt:clone(receipt)};
}
function inspect(requestId){var s=session(active(requestId));return clone(s);}
function resetForTests(){mem=blank();if(root&&root.localStorage){try{root.localStorage.removeItem(STORE);root.localStorage.removeItem(ACTIVE);}catch(e){}}}

return Object.freeze({
  version:VERSION,law_version:LAW_VERSION,stages:STAGES.slice(),writable:WRITABLE.slice(),
  open:open,write:write,advance:advance,inspect:inspect,extractObligations:extractObligations,verifyReceipt:verifyReceipt,executionPacket:executionPacket,hash:hash,
  _verifyState:verifyState,_resetForTests:resetForTests
});
});