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
  return /^(concept|intent|component|generator|recipe|artifact|blueprint|rule|requirement|evidence|failure|project|version|implementation|training|dataset|example|preference|critique):[a-z0-9:_-]+$/i.test(text(s));
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
  return {query:s,concepts:[],recipes:[],implementations:[],rules:[],failures:[],evidence:[],intents:[]};
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
function knownLocked(input){
  try{
    if(!window.PulseFunnel||!window.PulseFunnel.state)return false;
    var q=words(input),best=0;
    (window.PulseFunnel.state.projects||[]).forEach(function(p){
      (p.versions||[]).forEach(function(v){
        if(!/locked/i.test(v.state||''))return;
        var hay=JSON.stringify(v).toLowerCase(),score=0;
        q.forEach(function(w){if(w.length>3&&hay.indexOf(w)>=0)score++;});
        if(score>best)best=score;
      });
    });
    return best>=Math.max(2,Math.ceil(q.filter(function(w){return w.length>3;}).length*.6));
  }catch(e){return false;}
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
    return {request_id:req.id,route:opened?'navigation':'reference',status:'resolved',provenance:'learned',context:ctx,result:{reference:ref,opened:opened}};
  }

  if(retrievalIntent(input)&&!buildIntent(input)){
    return {request_id:req.id,route:'reference',status:'resolved',provenance:'learned',context:ctx,result:referencePacket(input)};
  }

  if(arg.forceFunnel){
    var forced=queueFunnel(req);
    return {request_id:req.id,route:'funnel',status:'queued',provenance:'explicit',context:ctx,result:forced};
  }

  if(buildIntent(input)){
    if(arg.resolved===true||knownLocked(input)){
      var packet=referencePacket(input);
      try{
        if(window.PulseReferences)window.PulseReferences.add({
          id:'intent:'+req.id,kind:'intent',title:'Resolved request',summary:input,status:'observed',
          source:'MOOR.request',source_id:req.id,provenance:arg.resolved===true?'explicit':'learned',data:{context:ctx,packet:packet}
        });
      }catch(e){}
      return {request_id:req.id,route:'harness',status:'ready-for-execution',provenance:arg.resolved===true?'explicit':'learned',context:ctx,
        result:{verdict_packet:{spec:input,destination:ctx.page||'current-page',done_criteria:arg.done_criteria||['Requested behavior works through the real user path.']},references:packet}};
    }
    var queued=queueFunnel(req);
    return {request_id:req.id,route:'funnel',status:'queued',provenance:'explicit',context:ctx,result:queued};
  }

  var refs=referencePacket(input);
  var hasKnown=(refs.concepts&&refs.concepts.length)||(refs.implementations&&refs.implementations.length)||(refs.recipes&&refs.recipes.length);
  if(hasKnown){
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
    ['concepts','recipes','implementations','rules','evidence','intents'].forEach(function(k){n+=(x[k]||[]).length;});
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
  contract:{funnel:'FUNNEL.md',agent:'moor-agent.json',runtime:'quiz-funnel-v3.html'},
  routes:['reference','navigation','funnel','harness','fallback']
};
if(window.MOOR&&window.MOOR!==api){for(var k in window.MOOR)if(!(k in api))api[k]=window.MOOR[k];}
window.MOOR=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){mountBar();setTimeout(drain,0);});
else{mountBar();setTimeout(drain,0);}
})();