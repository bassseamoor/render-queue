/* Pulse Learning Spine — Input / Stream / Discover / Bin / Funnel.
 * Additive only: reads existing Pulse/local app stores and writes its own
 * moor-pulse-spine-v1 store. It never deletes existing Pulse information.
 */
(function(){
'use strict';
if(typeof window==='undefined'||typeof COMPS==='undefined') return;

var LS='moor-pulse-spine-v1';
var mem=null;
function read(){
  try{
    var raw=localStorage.getItem(LS);
    if(raw){ var x=JSON.parse(raw); if(x&&x.version) return x; }
  }catch(e){}
  if(mem) return mem;
  return {version:1,createdAt:new Date().toISOString(),stream:[],kept:[],funnelInbox:[],seen:{}};
}
function write(s){
  mem=s;
  try{ localStorage.setItem(LS,JSON.stringify(s)); }catch(e){}
}
var S=read();
function save(){ write(S); decorateFunnel(); }
function esc2(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function uid(p){ return (p||'sp')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7); }
function textOf(v){
  if(typeof v==='string') return v;
  try{return JSON.stringify(v);}catch(e){return String(v||'');}
}
function hash(s){
  s=String(s||''); var h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16);
}
function addStream(kind,source,title,payload,meta,stableKey){
  var sig=stableKey||hash(kind+'|'+source+'|'+title+'|'+textOf(payload));
  if(S.seen[sig]) return S.stream.find(function(x){return x.id===S.seen[sig];})||null;
  var r={id:uid('rec'),at:new Date().toISOString(),kind:kind||'information',source:source||'unknown',
    title:title||kind||'Record',payload:payload,meta:meta||{},provenance:{source:source||'unknown',mode:(meta&&meta.mode)||'observed'}};
  S.stream.push(r); S.seen[sig]=r.id; save(); return r;
}
function keepRecord(id,reason){
  var r=S.stream.find(function(x){return x.id===id;}); if(!r)return;
  if(!S.kept.some(function(k){return k.recordId===id;})){
    S.kept.push({id:uid('keep'),recordId:id,at:new Date().toISOString(),reason:reason||'kept',snapshot:r});
    save();
  }
}
function sendRecordToFunnel(id){
  var r=S.stream.find(function(x){return x.id===id;}); if(!r)return;
  if(!S.funnelInbox.some(function(k){return k.recordId===id;})){
    S.funnelInbox.push({id:uid('fin'),recordId:id,at:new Date().toISOString(),record:r,status:'waiting'});
    save();
  }
}
function componentRecord(id){
  var c=COMPS.find(function(x){return x.id===id;}); if(!c)return null;
  return addStream('component','Pulse',c.label,{componentId:c.id,label:c.label,short:c.short||'',job:c.job||'',cats:c.cats||[],source:c.source||'',technical:c.technical||'',toolSrc:c.toolSrc||'',page:c.page||''},
    {mode:'selected',componentId:c.id},'component:'+c.id);
}
function harvest(){
  try{
    var w=JSON.parse(localStorage.getItem('moor-wonder-library-v1')||'[]');
    if(Array.isArray(w)) w.forEach(function(item,i){
      var g=item&&item.genome||item||{}, seed=g.seed||item.seed||String(i), typ=g.type||'wonder';
      addStream('asset','Wonder Feed',typ+' · '+seed,item,{mode:'procedural',app:'wonder-feed'},'wonder:'+seed+':'+typ);
    });
  }catch(e){}
  try{
    var c=JSON.parse(localStorage.getItem('moor-pulse-canvas-v1')||'{}');
    var parts=c&&Array.isArray(c.parts)?c.parts:[];
    parts.forEach(function(p,i){
      var key=p&&p.id||p&&p.name||String(i);
      addStream('logic','Moor Canvas',(p&&p.name)||'Canvas part',p,{mode:'designed',app:'more-canvas'},'canvas:'+key);
    });
  }catch(e){}
}
var BLUEPRINTS=[
 {id:'input',name:'Input',summary:'Human, app, and procedural interfaces enter one pipe. Preserve raw payload and provenance; never delete the source.'},
 {id:'stream',name:'Stream',summary:'Append-only arrival lane. Records stay raw and can be kept in Bin or sent to Funnel.'},
 {id:'discover',name:'Discover',summary:'Deterministically surface relevant or novel real components from recent Stream context. Discovery is not truth.'},
 {id:'bin',name:'Bin',summary:'Durable searchable inventory for every Pulse component plus kept knowledge and blueprints.'},
 {id:'funnel',name:'Funnel',summary:'Canonical v43 two-sided resolver. User or system answers the same questions; locked pages precede building.'}
];
var CONTRACTS=[
 {id:'harness-completion',name:'Harness Completion Invariant',
  summary:'Even garbage or incomplete input must produce the best-known candidate. Passing gates teaches logic; intent confidence is tracked separately.',
  source:'moor-harness-runtime-v1.html'}
];
function blueprintDocs(){return BLUEPRINTS.concat(CONTRACTS);}

function ensureFunnelProject(){
  try{
    if(!window.PulseFunnel||!PulseFunnel.state||!Array.isArray(PulseFunnel.state.projects))return;
    var fs=PulseFunnel.state, now=new Date().toISOString();
    var members=blueprintDocs().map(function(b){return {kind:b.id==='harness-completion'?'compiler-contract':'architecture',
      ref:(b.id==='harness-completion'?'contract-':'spine-')+b.id,label:b.name,
      sourceVersion:b.id==='funnel'?'v43':b.id==='harness-completion'?'v1':'v1',
      source:'pulse-learning-spine-blueprints.json',detail:b.summary};});
    var p=fs.projects.find(function(x){return x.id==='learning-spine';});
    if(!p){
      p={id:'learning-spine',name:'Pulse Learning Spine',icon:'◇',
        description:'Input → Stream → Discover → Bin → Funnel, plus downstream compiler contracts. Existing Pulse data remains intact.',
        members:members,page:'pulse-dashboard.html',queued:false,versions:[{id:'spine-v1',number:'v1',title:'Funnel blueprint build',state:'locked-import',createdAt:now,parentId:null,revision:'',
          items:members.filter(function(x){return x.ref!=='contract-harness-completion';}).map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=false;y.change='baseline';return y;})}]};
      fs.projects.push(p);
    }
    var hasContract=(p.members||[]).some(function(x){return x.ref==='contract-harness-completion';});
    if(!hasContract){
      var contract=members.find(function(x){return x.ref==='contract-harness-completion';});
      p.members=(p.members||[]).concat([contract]);
      p.versions=p.versions||[];
      p.versions.push({id:'spine-v2-harness-completion',number:'v2',title:'Harness completion invariant',state:'locked-import',createdAt:now,
        parentId:p.versions.length?p.versions[p.versions.length-1].id:null,revision:'Separate verified logic from intent confidence; always attempt a gated candidate.',
        items:(p.members||[]).map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=x.ref!=='contract-harness-completion';y.change=x.ref==='contract-harness-completion'?'new':'inherited';return y;})});
    }
    try{localStorage.setItem('moor-pulse-funnel-projects-v1',JSON.stringify(fs));}catch(e){}
  }catch(e){}
}

function allVisibleComps(){
  return COMPS.filter(function(c){return typeof shownComp==='function'?shownComp(c):true;});
}
function tokens(s){
  var stop={the:1,and:1,for:1,with:1,that:1,this:1,from:1,into:1,your:1,you:1,are:1,was:1,have:1,has:1,just:1,want:1,make:1};
  return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(function(w){return w.length>2&&!stop[w];});
}
function latestContext(){
  for(var i=S.stream.length-1;i>=0;i--){
    var r=S.stream[i]; if(r.kind!=='system') return r;
  }
  return null;
}
function discoveries(){
  var ctx=latestContext(), ts=tokens(ctx?ctx.title+' '+textOf(ctx.payload):'');
  var comps=allVisibleComps(), scored=[];
  comps.forEach(function(c,idx){
    var hay=((c.label||'')+' '+(c.short||'')+' '+(c.job||'')+' '+(c.cats||[]).join(' ')).toLowerCase(), score=0;
    ts.forEach(function(t){ if(hay.indexOf(t)>=0) score+=t.length>5?3:2; });
    if(c.recommended) score+=0.2;
    scored.push({c:c,score:score,idx:idx});
  });
  scored.sort(function(a,b){return b.score-a.score||a.idx-b.idx;});
  var hit=scored.filter(function(x){return x.score>0;}).slice(0,10);
  if(hit.length<6){
    var used={}; hit.forEach(function(x){used[x.c.id]=1;});
    var fallback=[];
    if(window.Smart&&Smart.recommend){
      try{fallback=Smart.recommend(10,function(c){return allVisibleComps().indexOf(c)>=0;})||[];}catch(e){}
    }
    fallback.concat(['wonder-feed','more-canvas','render-studio','moor-beta','rust-intent-compiler','component-distiller'])
      .forEach(function(id){
        if(hit.length>=10||used[id])return;
        var c=COMPS.find(function(x){return x.id===id;});
        if(c){hit.push({c:c,score:0,idx:0});used[id]=1;}
      });
  }
  return {context:ctx,items:hit};
}

function quickInput(label){
  return '<div class="ps-compose"><input id="ps-quick" type="text" autocomplete="off" placeholder="'+esc2(label||'Put anything into Stream…')+'">'+
    '<button class="ps-primary" data-spine-send>Send</button></div>';
}
function recordRow(r){
  return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(r.title)+'</strong>'+
    '<span>'+esc2(r.kind)+' · '+esc2(r.source)+'</span></div><div class="ps-actions">'+
    '<button data-spine-keep="'+esc2(r.id)+'">Keep</button><button data-spine-funnel="'+esc2(r.id)+'">Funnel</button></div></div>';
}
function inputView(){
  harvest();
  var ids=['project-pulse','more-canvas','stream','wonder-feed'], cards=ids.map(function(id){return COMPS.find(function(c){return c.id===id;});}).filter(Boolean);
  var gens=COMPS.filter(function(c){return Array.isArray(c.cats)&&c.cats.indexOf('generators')>=0;});
  return '<div class="ps-head"><h2>Input</h2><p>Different interfaces. Same pipe.</p></div>'+quickInput('Type or paste anything…')+
    '<div class="ps-grid">'+cards.map(function(c){return '<button class="ps-card" data-open="'+esc2(c.id)+'"><b>'+esc2(c.label)+'</b><span>'+esc2(c.short||c.job||'')+'</span></button>';}).join('')+
    '<div class="ps-card ps-card-static"><b>Procedural Generators</b><span>'+gens.length+' generator components feed the same Stream as human input.</span>'+
      '<details><summary>Open generators</summary><div class="ps-mini">'+gens.map(function(c){return '<button data-open="'+esc2(c.id)+'">'+esc2(c.label)+'</button>';}).join('')+'</div></details></div></div>';
}
function streamView2(){
  harvest();
  var rows=S.stream.slice().reverse().slice(0,80);
  return '<div class="ps-head"><h2>Stream</h2><p>Everything arrives here before it is judged.</p></div>'+quickInput('Ramble, paste logic, describe a result…')+
    '<div class="ps-kicker">'+S.stream.length+' records · raw source preserved</div>'+
    '<div class="ps-rows">'+(rows.length?rows.map(recordRow).join(''):'<div class="ps-empty">Nothing has entered the Stream yet.</div>')+'</div>';
}
function discoverView2(){
  harvest();
  var d=discoveries(), ctx=d.context;
  return '<div class="ps-head"><h2>Discover</h2><p>Relevant real things, not invented answers.</p></div>'+
    '<div class="ps-context">'+(ctx?'Using recent Stream context: <b>'+esc2(ctx.title)+'</b>':'No Stream context yet — showing useful starting points.')+'</div>'+
    '<div class="ps-rows">'+d.items.map(function(x){
      var c=x.c;
      return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(c.label)+'</strong><span>'+esc2(c.short||c.job||'')+'</span></div>'+
        '<div class="ps-actions"><button data-open="'+esc2(c.id)+'">Open</button><button data-spine-comp-funnel="'+esc2(c.id)+'">Funnel</button></div></div>';
    }).join('')+'</div>';
}
function binView2(){
  harvest();
  var q=(window.PulseSpine&&PulseSpine.query||'').trim().toLowerCase();
  var comps=allVisibleComps().filter(function(c){
    if(!q)return true;
    if(window.Smart&&Smart.matches){try{return Smart.matches(c,q,((c.label||'')+' '+(c.short||'')));}catch(e){}}
    return ((c.label||'')+' '+(c.short||'')+' '+(c.job||'')).toLowerCase().indexOf(q)>=0;
  });
  var kept=S.kept.filter(function(k){return !q||textOf(k.snapshot).toLowerCase().indexOf(q)>=0;});
  var records=S.stream.filter(function(r){return !q||textOf(r).toLowerCase().indexOf(q)>=0;});
  var bps=blueprintDocs().filter(function(b){return !q||(b.name+' '+b.summary).toLowerCase().indexOf(q)>=0;});
  return '<div class="ps-head"><h2>Bin</h2><p>Everything stays addressable.</p></div>'+
    '<div class="ps-compose ps-search"><input id="ps-bin-search" type="search" value="'+esc2(q)+'" placeholder="Search everything…"></div>'+
    '<section class="ps-section"><h3>Blueprints</h3><div class="ps-rows">'+bps.map(function(b){return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(b.name)+'</strong><span>'+esc2(b.summary)+'</span></div><div class="ps-actions"><button data-spine-blueprint="'+b.id+'">View</button></div></div>';}).join('')+'</div></section>'+
    (kept.length?'<section class="ps-section"><h3>Kept</h3><div class="ps-rows">'+kept.slice().reverse().map(function(k){return recordRow(k.snapshot);}).join('')+'</div></section>':'')+
    (records.length?'<details class="ps-section ps-all"><summary>Stream records · '+records.length+'</summary><div class="ps-rows">'+records.slice().reverse().map(recordRow).join('')+'</div></details>':'')+
    '<section class="ps-section"><h3>Components</h3><div class="ps-rows">'+comps.map(function(c){return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(c.label)+'</strong><span>'+esc2(c.short||c.job||c.source||'component')+'</span></div><div class="ps-actions"><button data-open="'+esc2(c.id)+'">Open</button><button data-spine-comp-funnel="'+esc2(c.id)+'">Funnel</button></div></div>';}).join('')+'</div></section>';
}

var oldTabView=window.tabView||tabView;
window.tabView=tabView=function(tab){
  if(tab==='input')return inputView();
  if(tab==='stream')return streamView2();
  if(tab==='discover')return discoverView2();
  if(tab==='bin')return binView2();
  return oldTabView(tab);
};

TABS=[
  {id:'stream',name:'Stream',icon:'≋',tag:'Everything entering MOOR.'},
  {id:'discover',name:'Discover',icon:'◇',tag:'Find what matters next.'},
  {id:'bin',name:'Bin',icon:'▧',tag:'Everything reusable.'},
  {id:'input',name:'Input',icon:'＋',tag:'Human and procedural interfaces.'}
];
if(typeof UI!=='undefined'){
  if(UI.tab==='you')UI.tab='input';
  if(UI.fromTab==='you')UI.fromTab='input';
  if(['stream','discover','bin','input'].indexOf(UI.tab)<0)UI.tab='stream';
}

var prevEnsure=ensureTabbar;
ensureTabbar=function(){
  prevEnsure();
  var bar=document.getElementById('tabbar'); if(!bar)return;
  var funnel=bar.querySelector('[data-tab="workspace"]'), input=bar.querySelector('[data-tab="input"]');
  if(funnel&&input&&funnel.nextSibling!==input) bar.insertBefore(funnel,input);
  bar.querySelectorAll('button').forEach(function(b){
    var tx=b.querySelector('span:not(.tb-ic)');
    if(tx){tx.style.display='inline';tx.style.visibility='visible';tx.style.opacity='1';}
    b.setAttribute('title',tx?tx.textContent.trim():'');
  });
};

function showBlueprint(id){
  var b=blueprintDocs().find(function(x){return x.id===id;}); if(!b)return;
  var old=document.getElementById('ps-modal'); if(old)old.remove();
  var m=document.createElement('div');m.id='ps-modal';
  m.innerHTML='<div class="ps-modal-card"><button class="ps-x" data-spine-close>×</button><div class="ps-head"><h2>'+esc2(b.name)+'</h2><p>Locked learning-spine blueprint</p></div><p class="ps-blue">'+esc2(b.summary)+'</p><a class="ps-link" href="pulse-learning-spine-blueprints.json" target="_blank" rel="noopener">Full blueprint ↗</a></div>';
  document.body.appendChild(m);
}
function decorateFunnel(){
  var top=document.querySelector('.pf-shell .pf-top'); if(!top)return;
  var badge=top.querySelector('.ps-funnel-badge');
  if(!badge){badge=document.createElement('button');badge.className='ps-funnel-badge';badge.dataset.spineInbox='1';top.appendChild(badge);}
  badge.textContent='Inbox '+S.funnelInbox.length;
  var panel=document.querySelector('.pf-shell .ps-funnel-panel');
  if(panel){
    panel.innerHTML='<div class="ps-funnel-panel-head"><b>Funnel inbox</b><button data-spine-hide-inbox>×</button></div>'+
      (S.funnelInbox.length?S.funnelInbox.slice().reverse().map(function(x){return '<div class="ps-funnel-item"><strong>'+esc2(x.record.title)+'</strong><span>'+esc2(x.record.kind)+' · '+esc2(x.record.source)+'</span></div>';}).join(''):'<div class="ps-empty">Nothing waiting.</div>');
  }
}
function toggleInbox(show){
  var shell=document.querySelector('.pf-shell'); if(!shell)return;
  var p=shell.querySelector('.ps-funnel-panel');
  if(!p){p=document.createElement('div');p.className='ps-funnel-panel';var layout=shell.querySelector('.pf-layout');shell.insertBefore(p,layout||null);}
  p.style.display=show===false?'none':'block';decorateFunnel();
}

var mo=new MutationObserver(function(){ if(document.body.classList.contains('pw-active'))decorateFunnel(); });
mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

document.addEventListener('click',function(e){
  var send=e.target.closest('[data-spine-send]');
  if(send){
    var inp=document.getElementById('ps-quick'),v=inp&&inp.value.trim(); if(!v)return;
    addStream('intent','You',v,v,{mode:'human'});
    if(inp)inp.value='';
    if(typeof renderStage==='function')renderStage();
    return;
  }
  var k=e.target.closest('[data-spine-keep]'); if(k){keepRecord(k.dataset.spineKeep,'manual keep');if(typeof renderStage==='function')renderStage();return;}
  var f=e.target.closest('[data-spine-funnel]'); if(f){sendRecordToFunnel(f.dataset.spineFunnel);decorateFunnel();return;}
  var cf=e.target.closest('[data-spine-comp-funnel]'); if(cf){var r=componentRecord(cf.dataset.spineCompFunnel);if(r)sendRecordToFunnel(r.id);decorateFunnel();return;}
  var bp=e.target.closest('[data-spine-blueprint]'); if(bp){showBlueprint(bp.dataset.spineBlueprint);return;}
  if(e.target.closest('[data-spine-close]')){var m=document.getElementById('ps-modal');if(m)m.remove();return;}
  if(e.target.closest('[data-spine-inbox]')){toggleInbox(true);return;}
  if(e.target.closest('[data-spine-hide-inbox]')){toggleInbox(false);return;}
});
window.addEventListener('moor:spine-input',function(e){
  var d=e&&e.detail||{};
  addStream(d.kind||'information',d.source||'App',d.title||d.kind||'Input',d.payload!=null?d.payload:d,d.meta||{mode:'app'},d.stableKey||null);
});

document.addEventListener('input',function(e){
  if(e.target&&e.target.id==='ps-bin-search'){
    window.PulseSpine.query=e.target.value;
    var pos=e.target.selectionStart;
    if(typeof renderStage==='function')renderStage();
    var n=document.getElementById('ps-bin-search');if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(x){}}
  }
});

var st=document.createElement('style');st.id='pulse-spine-style';st.textContent=
'.ps-head{margin:4px 0 12px}.ps-head h2{font-size:1.15rem;margin:0}.ps-head p{margin:2px 0 0;color:var(--muted);font-size:.78rem}'+
'.ps-compose{display:flex;gap:6px;margin:0 0 12px}.ps-compose input{flex:1;min-width:0;height:38px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:#0b111c;color:var(--text);padding:0 11px;font:inherit;font-size:12px}.ps-primary{border:0;border-radius:10px;padding:0 14px;background:#f5f7fb;color:#101218;font-weight:700;cursor:pointer}'+
'.ps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.ps-card{display:flex;flex-direction:column;gap:5px;text-align:left;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.025);color:var(--text);padding:13px;font:inherit;cursor:pointer}.ps-card b{font-size:12px}.ps-card span{font-size:10px;color:var(--muted);line-height:1.4}.ps-card-static{cursor:default}.ps-card details{margin-top:5px}.ps-card summary{cursor:pointer;font-size:10px;color:var(--cyan)}.ps-mini{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.ps-mini button{font:inherit;font-size:9px;color:var(--muted);border:1px solid rgba(255,255,255,.08);border-radius:999px;background:transparent;padding:4px 7px;cursor:pointer}'+
'.ps-kicker,.ps-context{font-size:10px;color:var(--muted);margin:2px 0 9px}.ps-rows{display:flex;flex-direction:column;gap:5px}.ps-row{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.02);padding:8px 9px}.ps-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.ps-row-main strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ps-row-main span{font-size:9px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ps-actions{display:flex;gap:3px}.ps-actions button{border:1px solid rgba(255,255,255,.09);background:transparent;color:var(--muted);border-radius:8px;padding:5px 7px;font:inherit;font-size:9px;cursor:pointer}.ps-actions button:hover{color:var(--text)}'+
'.ps-section{margin:15px 0}.ps-section h3,.ps-all>summary{font-size:10px;letter-spacing:.11em;text-transform:uppercase;margin:0 0 6px;color:var(--muted)}.ps-all>summary{cursor:pointer;list-style:none}.ps-all>summary::-webkit-details-marker{display:none}.ps-empty{padding:14px;color:var(--muted);font-size:11px}.ps-search{max-width:520px}'+
'#ps-modal{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.65);display:grid;place-items:center;padding:18px}.ps-modal-card{position:relative;width:min(520px,100%);border:1px solid rgba(255,255,255,.13);border-radius:18px;background:#10131d;padding:18px;box-shadow:0 25px 80px #000}.ps-x{position:absolute;right:10px;top:10px;border:0;background:transparent;color:var(--muted);font-size:20px;cursor:pointer}.ps-blue{font-size:13px;line-height:1.6;color:#dce2ee}.ps-link{display:inline-block;margin-top:14px;color:var(--cyan);font-size:11px;text-decoration:none}'+
'.ps-funnel-badge{margin-left:auto;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.035);color:#eef3fa;padding:5px 9px;font:inherit;font-size:10px;cursor:pointer}.ps-funnel-panel{display:none;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(10,12,19,.85);padding:9px;margin-bottom:8px}.ps-funnel-panel-head{display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px}.ps-funnel-panel-head button{border:0;background:transparent;color:var(--muted);cursor:pointer}.ps-funnel-item{display:flex;justify-content:space-between;gap:8px;padding:6px 2px;border-top:1px solid rgba(255,255,255,.05);font-size:10px}.ps-funnel-item span{color:var(--muted)}'+
'body.tabs-on #tabbar button>span:not(.tb-ic){display:inline!important;visibility:visible!important;opacity:1!important;color:inherit!important;white-space:nowrap!important}.pf-project-copy strong{display:block!important;visibility:visible!important;opacity:1!important;color:#eef3fa!important}'+
'@media(min-width:761px){body.tabs-on #tabbar button{overflow:visible!important}.ps-row{min-height:38px}}'+
'@media(max-width:760px){.ps-grid{grid-template-columns:1fr 1fr}.ps-actions{flex:none}.ps-row{padding:7px}.ps-funnel-item{display:block}.ps-funnel-item span{display:block;margin-top:2px}}';
document.head.appendChild(st);

window.PulseSpine={
  get state(){return S;},
  query:'',
  add:function(kind,source,title,payload,meta){return addStream(kind,source,title,payload,meta);},
  keep:keepRecord,
  funnel:sendRecordToFunnel,
  harvest:harvest,
  blueprints:BLUEPRINTS.slice(),
  contracts:CONTRACTS.slice()
};

harvest();
ensureFunnelProject();
ensureTabbar();
if(typeof renderStage==='function')renderStage();
decorateFunnel();
})();