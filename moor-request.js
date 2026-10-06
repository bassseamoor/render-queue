/* MOOR universal request router.
 * Human bar and model/script calls share MOOR.request().
 * Intelligence is optional. Routing is not.
 */
(function(){
'use strict';
if(typeof window==='undefined')return;

var QUEUE='moor-request-queue-v1';
var REQUEST_VERSION=1;
var memQueue=[];

function uid(){
  return 'request:'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
}
function text(v){return String(v==null?'':v).trim();}
function readQueue(){
  try{var q=JSON.parse(localStorage.getItem(QUEUE)||'[]');return Array.isArray(q)?q:[];}catch(e){return memQueue.slice();}
}
function writeQueue(q){
  memQueue=q.slice();
  try{localStorage.setItem(QUEUE,JSON.stringify(q.slice(-200)));}catch(e){}
}
function pageContext(){
  var out={
    url:location.href,
    path:location.pathname,
    title:document.title||'',
    page:(document.body&&document.body.dataset&&document.body.dataset.moorPage)||location.pathname.split('/').pop()||'index'
  };
  try{
    if(window.PulseFunnel&&window.PulseFunnel.state)out.funnel_project=window.PulseFunnel.state.selected||null;
  }catch(e){}
  try{
    if(window.UI){out.tab=UI.tab||null;out.focus=UI.focus||null;}
  }catch(e){}
  return out;
}
function merge(a,b){
  var o={},k;for(k in a)o[k]=a[k];for(k in (b||{}))o[k]=b[k];return o;
}
function words(s){
  return text(s).toLowerCase().replace(/[^a-z0-9:_-]+/g,' ').split(/\s+/).filter(Boolean);
}
function isExplicitRef(s){
  return /^(concept|intent|component|generator|recipe|artifact|blueprint|rule|requirement|evidence|failure|project|version|implementation|training|dataset|example|preference|critique|capability|assembly|composition|handoff|learning):[a-z0-9:_-]+$/i.test(text(s));
}
function retrievalIntent(s){
  return /^(find|search|lookup|look up|show me|where is|what is|what are|references? for)\b/i.test(text(s));
}
function navigationIntent(s){
  return /^(open|launch|go to|take me to|switch to)\b/i.test(text(s));
}
function buildIntent(s){
  return /\b(build|make|create|add|change|modify|fix|implement|wire|connect|replace|remove|delete|turn|convert|design)\b/i.test(text(s));
}
function exactReference(s){
  if(!window.PulseReferences)return null;
  var q=text(s), refs=window.PulseReferences.references||null;
  if(isExplicitRef(q)){
    var all=(window.PulseSpine&&window.PulseSpine.references)||[];
    return all.find(function(r){return r.id===q;})||null;
  }
  var hits=window.PulseReferences.search(q,{limit:8})||[];
  if(!hits.length)return null;
  var norm=q.toLowerCase().replace(/^(open|launch|go to|find|search|lookup|look up|show me)\s+/,'').trim();
  return hits.find(function(r){
    return String(r.id||'').toLowerCase()===norm||
      String(r.title||'').toLowerCase()===norm||
      String(r.source_id||'').toLowerCase()===norm;
  })||null;
}
function referencePacket(s){
  if(window.PulseReferences&&window.PulseReferences.packet)return window.PulseReferences.packet(s,8);
  return {query:s,concepts:[],recipes:[],implementations:[],rules:[],failures:[],evidence:[],intents:[],capabilities:[],assemblies:[],compositions:[],handoffs:[],learning:[]};
}
function refineryStat(type,data){
  try{if(window.MoorCapabilityMemory&&typeof window.MoorCapabilityMemory.recordUse==='function')window.MoorCapabilityMemory.recordUse(type,data||{});}catch(e){}
}
function noteReferenceUse(ref,requestId,route){
  if(!ref)return;
  if(ref.kind==='capability')refineryStat('capability_reference_retrieved',{reference_id:ref.id,request_id:requestId,route:route||'reference'});
  if(ref.kind==='assembly')refineryStat('assembly_reference_retrieved',{reference_id:ref.id,request_id:requestId,route:route||'reference'});
  if(ref.kind==='handoff')refineryStat('capability_handoff_retrieved',{reference_id:ref.id,request_id:requestId,route:route||'reference'});
  if(ref.kind==='composition')refineryStat('composition_reference_retrieved',{reference_id:ref.id,request_id:requestId,route:route||'reference',status:ref.status||null});
}
function tryOpen(ref){
  if(!ref)return false;
  var id=ref.source_id||String(ref.id||'').replace(/^component:/,'');
  try{
    if(typeof window.openComponent==='function'&&id){window.openComponent(id);return true;}
  }catch(e){}
  var page=ref.implementation_ref||ref.doc_ref;
  if(page&&/\.html(?:$|\?)/i.test(page)){
    try{location.href=new URL(page,location.href).href;return true;}catch(e){}
  }
  return false;
}
function queueOffline(req){
  var q=readQueue();
  q.push(req);writeQueue(q);
  return {queued:true,queue_size:q.length};
}
function queueFunnel(req){
  if(window.PulseSpine&&typeof window.PulseSpine.request==='function'){
    return window.PulseSpine.request(req.input,req.context,req.source||'MOOR.request');
  }
  return queueOffline(req);
}
function kernel(){
  return window.MOORFunnelKernel||null;
}
function factory(){
  return window.MoorSoftwareFactory||null;
}
function factoryOrderId(input){
  var k=kernel(),h=k&&k.hash?k.hash(input):String(input.length);
  return 'work-order:'+h;
}
function factoryParts(refs,input){
  var out=[],seen={};
  function addPart(x,kind){
    if(!x)return;var id=x.id||x.source_id||x.capability_id||x.content_hash||null;
    if(!id||seen[id])return;seen[id]=1;out.push({id:String(id),kind:kind||x.kind||'reference'});
  }
  ['capabilities','assemblies','compositions','handoffs','implementations','recipes','rules','evidence'].forEach(function(kind){
    (refs&&refs[kind]||[]).forEach(function(x){addPart(x,kind)});
  });
  if(!out.length)addPart({id:'intent-material:'+(kernel()&&kernel().hash?kernel().hash(input):input.length)},'intent');
  return out;
}
function ensureFactoryOrder(req,refs){
  var F=factory(),k=kernel();if(!F||!k)return null;
  try{
    var id=factoryOrderId(req.input),o=F.get(id);
    if(!o)o=F.open({work_order_id:id,page0_hash:k.hash(req.input),objective:req.input,scope:req.context||{},owner:req.source||null,requested_outputs:['authorized software change'],done_criteria:[],route_version:'funnel-harness-verifier-v1'});
    if(o.state==='QUEUED'){
      o=F.bindMaterials(id,{parts:factoryParts(refs,req.input),dependency_edges:[],source_hashes:[]});
    }
    if(o.state==='MATERIALS_BOUND'){
      o=F.setRoute(id,{route_id:'funnel-harness-verifier',version:'1',stations:[
        {station_id:'funnel',operation_id:'resolve',executor:'MOOR Funnel'},
        {station_id:'harness',operation_id:'build',executor:'app-compiler-harness'},
        {station_id:'verifier',operation_id:'verify',executor:'Verifier'}
      ],allowed_rework_loops:2});
    }
    return o;
  }catch(e){
    try{window.dispatchEvent(new CustomEvent('moor:factory-warning',{detail:{message:String(e&&e.message||e),input:req.input}}))}catch(_){}
    return null;
  }
}
function advanceFactoryToHarness(req,refs,receipt,packet){
  var F=factory(),o=ensureFactoryOrder(req,refs);if(!F||!o)return null;
  try{
    var id=o.work_order_id;
    if(o.state==='ROUTED'&&!o.authorization)o=F.authorize(id,receipt);
    if(o.state==='ROUTED'&&o.route&&o.route.stations[o.route_index]&&o.route.stations[o.route_index].station_id==='funnel'){
      o=F.startOperation(id,{executor:'MOOR Funnel',inputs:{page0_hash:o.page0_hash}});
      o=F.completeOperation(id,{outputs:{verdict_packet:packet},evidence:[receipt.fingerprint]});
      o=F.inspect(id,{inspection_id:'funnel-replay:'+receipt.fingerprint,characteristic:'Page 0 fidelity and authority',observed:'kernel-verified receipt',tolerance:'exact Page 0 receipt binding',pass:true,evidence_ref:receipt.fingerprint,verifier:'MOOR.request'});
    }
    if(o.state==='ROUTED'&&o.route&&o.route.stations[o.route_index]&&o.route.stations[o.route_index].station_id==='harness'){
      o=F.startOperation(id,{executor:'app-compiler-harness',inputs:{verdict_packet:packet}});
    }
    return o;
  }catch(e){
    try{window.dispatchEvent(new CustomEvent('moor:factory-warning',{detail:{message:String(e&&e.message||e),work_order_id:o&&o.work_order_id}}))}catch(_){}
    return F.get(o&&o.work_order_id)||o;
  }
}
function applyFactoryOutput(detail){
  var F=factory();detail=detail||{};if(!F||!detail.work_order_id)return null;
  var o=F.get(detail.work_order_id);if(!o)return null;
  try{
    if(o.state==='RELEASED')return o;
    var verified=detail.status==='machine-verified'&&detail.evidence&&detail.evidence.logic&&detail.evidence.logic.status==='verified-working';
    var ev=[detail.id||detail.implementation_ref||'harness-output'];
    if(o.state==='IN_PROCESS'&&o.current_operation&&o.current_operation.station_id==='harness'){
      o=F.completeOperation(o.work_order_id,{outputs:{implementation_id:detail.id||null,implementation_ref:detail.implementation_ref||null,payload:detail.payload||null},evidence:ev,result:verified?'verified-output':'unverified-output'});
      o=F.inspect(o.work_order_id,{
        inspection_id:'harness-output:'+F.hash(detail.id||detail.implementation_ref||Date.now()),
        characteristic:'Harness gate suite',
        observed:verified?'syntax+boot+behavior+integration+regression verified':'Harness output not machine-verified',
        tolerance:'machine-verified promoted output',
        pass:!!verified,
        evidence_ref:detail.implementation_ref||detail.id||null,
        verifier:'Harness gates',
        defect_class:verified?null:'harness-verification'
      });
    }
    if(!verified)return o;
    if(o.state==='ROUTED'&&o.route&&o.route.stations[o.route_index]&&o.route.stations[o.route_index].station_id==='verifier'){
      o=F.startOperation(o.work_order_id,{executor:'Verifier',inputs:{implementation_id:detail.id||null,evidence:detail.evidence||null}});
      o=F.completeOperation(o.work_order_id,{outputs:{verified_implementation:detail.id||null},evidence:ev,result:'verified'});
      o=F.inspect(o.work_order_id,{
        inspection_id:'release-verification:'+F.hash(detail.id||detail.implementation_ref||Date.now()),
        characteristic:'Release evidence',
        observed:'machine-verified Harness artifact with complete gate suite',
        tolerance:'verified implementation + bound Funnel authority',
        pass:true,
        evidence_ref:detail.implementation_ref||detail.id||null,
        verifier:'MOOR software factory'
      });
    }
    if(o.state==='PASS'){
      o=F.release(o.work_order_id,{configuration_hash:F.hash({id:detail.id||null,implementation_ref:detail.implementation_ref||null,payload:detail.payload||null,evidence:detail.evidence||null}),released_artifacts:[detail.id||detail.implementation_ref||'harness-output']});
    }
    try{window.dispatchEvent(new CustomEvent('moor:factory-updated',{detail:{work_order:o}}))}catch(_){}
    return o;
  }catch(e){
    try{window.dispatchEvent(new CustomEvent('moor:factory-warning',{detail:{message:String(e&&e.message||e),work_order_id:detail.work_order_id}}))}catch(_){}
    return F.get(detail.work_order_id)||o;
  }
}
function openKernel(req,refs){
  var k=kernel();
  if(!k)throw Error('Funnel Kernel unavailable. Build execution is locked.');
  var session=k.open({request_id:req.id,input:req.input,source:req.source,context:req.context});
  if(session.stage==='page0'){
    session=k.advance({request_id:req.id,stage:'usage_plan',payload:{plan:k.makeUsagePlan(req.input,Object.assign({source:req.source},req.context||{}),{
      execution_plan:{destination:'app-compiler-harness',reuse_before_new:true},
      reference_plan:{inspect_existing_first:true,sources:['Pulse reference packet','verified capabilities/assemblies/compositions','locked answers','prior failures/corrections']}
    })},provenance:'system'});
  }
  if(session.stage==='usage_plan'){
    var reused=[];
    ['concepts','recipes','implementations','rules','failures','evidence','intents','capabilities','assemblies','compositions','handoffs','learning'].forEach(function(kind){
      (refs&&refs[kind]||[]).forEach(function(r){reused.push({kind:kind,id:r.id||r.source_id||null,title:r.title||null});});
    });
    session=k.advance({request_id:req.id,stage:'references',payload:{reused:reused,missing:[]},provenance:'learned'});
    var capCount=(refs.capabilities||[]).length,assemblyCount=(refs.assemblies||[]).length,handoffCount=(refs.handoffs||[]).length,compositionCount=(refs.compositions||[]).length;
    if(capCount||assemblyCount||handoffCount||compositionCount){
      refineryStat('capability_handoff_consumed_by_funnel',{request_id:req.id,capabilities:capCount,assemblies:assemblyCount,handoffs:handoffCount,compositions:compositionCount});
      (refs.capabilities||[]).forEach(function(x){noteReferenceUse(x,req.id,'funnel');});
      (refs.assemblies||[]).forEach(function(x){noteReferenceUse(x,req.id,'funnel');});
      (refs.handoffs||[]).forEach(function(x){noteReferenceUse(x,req.id,'funnel');});
      (refs.compositions||[]).forEach(function(x){noteReferenceUse(x,req.id,'funnel');});
    }
  }
  return session;
}
function verifiedExecution(receipt,input){
  var k=kernel();
  if(!k||!k.verifyReceipt(receipt))return null;
  if(k.hash(input)!==receipt.page0_hash)return null;
  return k.executionPacket(receipt);
}
async function request(arg){
  if(typeof arg==='string')arg={input:arg};
  arg=arg||{};
  var input=text(arg.input);
  var ctx=merge(pageContext(),arg.context||{});
  var req={version:REQUEST_VERSION,id:uid(),input:input,source:arg.source||'unknown',context:ctx,at:new Date().toISOString()};
  if(!input){
    return {request_id:req.id,route:'fallback',status:'fallback',provenance:'fallback',context:ctx,result:{message:'Empty request preserved; no destructive action taken.'}};
  }

  var ref=exactReference(input);
  if(ref&&(isExplicitRef(input)||navigationIntent(input))){
    var opened=navigationIntent(input)?tryOpen(ref):false;
    noteReferenceUse(ref,req.id,opened?'navigation':'reference');
    if(ref.kind==='capability'||ref.kind==='assembly'||ref.kind==='handoff'||(ref.kind==='composition'&&ref.status==='machine-verified'))refineryStat('request_resolved_from_reference',{request_id:req.id,reference_id:ref.id,kind:ref.kind});
    return {request_id:req.id,route:opened?'navigation':'reference',status:'resolved',provenance:'learned',context:ctx,result:{reference:ref,opened:opened}};
  }

  if(retrievalIntent(input)&&!buildIntent(input)){
    var rp=referencePacket(input);
    ['capabilities','assemblies','handoffs','compositions'].forEach(function(k){(rp[k]||[]).forEach(function(x){noteReferenceUse(x,req.id,'reference-search');});});
    if((rp.capabilities||[]).length||(rp.assemblies||[]).length||(rp.handoffs||[]).length)refineryStat('request_resolved_from_reference',{request_id:req.id,kind:'packet'});
    return {request_id:req.id,route:'reference',status:'resolved',provenance:'learned',context:ctx,result:rp};
  }

  if(arg.forceFunnel||buildIntent(input)){
    var refsForFunnel=referencePacket(input);
    var factoryOrder=ensureFactoryOrder(req,refsForFunnel);
    if(arg.funnel_receipt){
      var packet=verifiedExecution(arg.funnel_receipt,input);
      if(packet){
        try{
          if(window.PulseReferences)window.PulseReferences.add({
            id:'intent:'+req.id,kind:'intent',title:'Funnel-resolved request',summary:input,status:'observed',
            source:'MOOR.request',source_id:req.id,provenance:'verified',data:{context:ctx,packet:packet}
          });
        }catch(e){}
        factoryOrder=advanceFactoryToHarness(req,refsForFunnel,arg.funnel_receipt,packet)||factoryOrder;
        var handoff={schema:'moor.harness-inbox',version:1,at:new Date().toISOString(),input:input,context:ctx,verdict_packet:packet,references:refsForFunnel,work_order_id:factoryOrder&&factoryOrder.work_order_id||null};
        try{localStorage.setItem('moor-harness-inbox-v1',JSON.stringify(handoff));}catch(e){}
        try{window.dispatchEvent(new CustomEvent('moor:harness-ready',{detail:handoff}));}catch(e){}
        return {request_id:req.id,route:'harness',status:'ready-for-execution',provenance:'verified',context:ctx,result:{verdict_packet:packet,references:refsForFunnel,harness_inbox:true,work_order:factoryOrder}};
      }
      return {request_id:req.id,route:'funnel',status:'locked',provenance:'fallback',context:ctx,result:{error:'Invalid Funnel receipt. Execution denied.'}};
    }
    var kernelSession;
    try{kernelSession=openKernel(req,refsForFunnel);}
    catch(err){
      return {request_id:req.id,route:'funnel',status:'locked',provenance:'fallback',context:ctx,result:{error:String(err&&err.message||err)}};
    }
    var queued=queueFunnel(req);
    return {request_id:req.id,route:'funnel',status:'queued',provenance:'explicit',context:ctx,result:{queue:queued,kernel:{law_version:kernel().law_version,stage:kernelSession.stage},work_order:factoryOrder}};
  }

  var refs=referencePacket(input);
  var hasKnown=(refs.concepts&&refs.concepts.length)||(refs.implementations&&refs.implementations.length)||(refs.recipes&&refs.recipes.length)||(refs.capabilities&&refs.capabilities.length)||(refs.assemblies&&refs.assemblies.length)||(refs.handoffs&&refs.handoffs.length)||(refs.compositions&&refs.compositions.some(function(x){return x.status==='machine-verified';}));
  if(hasKnown){
    ['capabilities','assemblies','handoffs','compositions'].forEach(function(k){(refs[k]||[]).forEach(function(x){noteReferenceUse(x,req.id,'reference-resolve');});});
    refineryStat('request_resolved_from_reference',{request_id:req.id,kind:'packet'});
    return {request_id:req.id,route:'reference',status:'resolved',provenance:'learned',context:ctx,result:refs};
  }

  var fallback=queueFunnel(req);
  return {request_id:req.id,route:'funnel',status:'queued',provenance:'fallback',context:ctx,result:fallback};
}
async function drain(){
  if(!(window.PulseSpine&&typeof window.PulseSpine.request==='function'))return 0;
  var q=readQueue();if(!q.length)return 0;
  writeQueue([]);
  q.forEach(function(r){try{window.PulseSpine.request(r.input,r.context,r.source||'offline-request');}catch(e){var back=readQueue();back.push(r);writeQueue(back);}});
  return q.length;
}
function statusText(r){
  if(!r)return '';
  if(r.route==='funnel')return 'Funnel · queued';
  if(r.route==='harness')return 'Harness · ready';
  if(r.route==='navigation')return 'Opened';
  if(r.route==='reference'){
    var x=r.result||{},n=0;
    ['concepts','recipes','implementations','rules','evidence','intents','capabilities','assemblies','compositions','handoffs'].forEach(function(k){n+=(x[k]||[]).length;});
    return 'References'+(n?' · '+n:'');
  }
  return r.route+' · '+r.status;
}
function mountBar(){
  if(new URLSearchParams(location.search).get('agent')==='1')return;
  if(window.parent!==window){
    try{if(parent.MOOR){window.MOOR=parent.MOOR;return;}}catch(e){}
    return;
  }
  if(document.getElementById('moor-request-bar'))return;
  var style=document.createElement('style');
  style.textContent=
    '#moor-request-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483000;width:min(620px,calc(100vw - 24px));font:13px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;pointer-events:none}'+
    '#moor-request-shell{pointer-events:auto;display:flex;align-items:center;gap:8px;padding:7px 8px 7px 14px;border:1px solid rgba(145,170,200,.22);border-radius:18px;background:rgba(7,12,20,.82);backdrop-filter:blur(22px);box-shadow:0 18px 55px rgba(0,0,0,.34)}'+
    '#moor-request-input{flex:1;min-width:0;border:0!important;outline:0!important;background:transparent!important;color:#eef4fb!important;font:inherit!important;padding:7px 0!important;margin:0!important;box-shadow:none!important}'+
    '#moor-request-input::placeholder{color:#8b99a9}#moor-request-go{width:34px;height:34px;border:0;border-radius:11px;background:#eef4fb;color:#081018;font:700 16px inherit;cursor:pointer}'+
    '#moor-request-status{min-height:18px;padding:5px 14px 0;color:#9aa9ba;font-size:10px;text-align:right;opacity:.9}'+
    '@media(max-width:640px){#moor-request-bar{bottom:8px;width:calc(100vw - 14px)}#moor-request-shell{border-radius:15px}}';
  document.head.appendChild(style);
  var host=document.createElement('div');host.id='moor-request-bar';host.dataset.agentIgnore='true';
  host.setAttribute('aria-label','Human MOOR request bar');
  host.innerHTML='<form id="moor-request-shell"><input id="moor-request-input" autocomplete="off" placeholder="Request anything…" aria-label="Request anything"><button id="moor-request-go" title="Send" aria-label="Send request">↗</button></form><div id="moor-request-status" role="status"></div>';
  document.body.appendChild(host);
  var form=host.querySelector('form'),input=host.querySelector('input'),st=host.querySelector('#moor-request-status');
  form.addEventListener('submit',function(e){
    e.preventDefault();var q=input.value.trim();if(!q)return;
    st.textContent='Routing…';
    request({input:q,source:'human-bar'}).then(function(r){st.textContent=statusText(r);window.dispatchEvent(new CustomEvent('moor:request-result',{detail:r}));}).catch(function(err){st.textContent='Request failed · '+String(err&&err.message||err);});
  });
  window.addEventListener('keydown',function(e){
    if(e.key==='/'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&document.activeElement&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();input.focus();}
  });
}
var api={
  version:REQUEST_VERSION,
  request:request,
  context:pageContext,
  drain:drain,
  factoryOutput:applyFactoryOutput,
  contract:{funnel:'FUNNEL.md',kernel:'funnel-kernel.js',factory:'software-factory-core.js',agent:'moor-agent.json',runtime:'quiz-funnel-v3.html'},
  routes:['reference','navigation','funnel','harness','fallback']
};
if(window.MOOR&&window.MOOR!==api){for(var k in window.MOOR)if(!(k in api))api[k]=window.MOOR[k];}
window.MOOR=api;
window.addEventListener('moor:output',function(e){try{applyFactoryOutput(e&&e.detail||{})}catch(_){}});
window.addEventListener('message',function(e){try{if(e&&e.data&&e.data.type==='moor:output')applyFactoryOutput(e.data.detail||{})}catch(_){}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mountBar();setTimeout(drain,0);});
else{mountBar();setTimeout(drain,0);}
})();