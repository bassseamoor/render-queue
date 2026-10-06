/* Pulse Creation Deck v1 — spatial shell around existing Pulse components. */
(function(){
'use strict';
const KEY='moor-pulse-creation-deck-v1';
let state={pinned:[],recent:[],libraryOpen:false,inspectorOpen:false,filter:'all',query:'',selected:null};
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x)state=Object.assign(state,x);}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}
function comps(){try{return typeof COMPS!=='undefined'&&Array.isArray(COMPS)?COMPS:[];}catch(e){return [];}}
function compById(id){return comps().find(c=>c.id===id)||null}
function visibleComps(){return comps().filter(c=>!c.hidden)}
function isRunnable(c){return !!(c&&(c.tool||c.page||c.toolSrc||c.source&&/\.html(?:$|\?)/i.test(c.source)))}
function openComp(id){
  const c=compById(id);if(!c)return;
  state.selected=id;state.recent=[id].concat(state.recent.filter(x=>x!==id)).slice(0,16);save();
  try{if(typeof openComponent==='function')openComponent(id);else if(window.openComponent)window.openComponent(id);}catch(e){}
  document.body.classList.add('pcd-focus');renderDeck();renderInspector();closeSheets();
}
function closeFocus(){
  try{if(typeof UI!=='undefined'&&UI.focus&&typeof closeComponent==='function')closeComponent(UI.focus);}catch(e){}
  document.body.classList.remove('pcd-focus');renderDeck();
}
function sourceStats(c){
  const refs=(window.PulseReferences&&window.PulseSpine&&window.PulseSpine.references)||[];
  const rel=refs.filter(r=>r.source_id===c.id||r.implementation_ref===c.page||r.implementation_ref===c.toolSrc||r.implementation_ref===c.source);
  return {refs:rel.length,verified:rel.filter(r=>r.status==='machine-verified'||r.status==='human-approved'||r.status==='canonical').length,capabilities:rel.filter(r=>r.kind==='capability').length};
}
function verifiedComp(c){const x=sourceStats(c);return x.verified>0||x.capabilities>0}
function appSet(){
  const ids=[...state.pinned,...state.recent];
  const out=[];ids.forEach(id=>{const c=compById(id);if(c&&isRunnable(c)&&!out.some(x=>x.id===id))out.push(c);});
  if(out.length<8)visibleComps().filter(isRunnable).slice(0,18).forEach(c=>{if(!out.some(x=>x.id===c.id))out.push(c)});
  return out.slice(0,14);
}
function icon(c){return c&&c.icon?c.icon:'◇'}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function make(tag,cls,html){const el=document.createElement(tag);if(cls)el.className=cls;if(html!=null)el.innerHTML=html;return el}
function ensure(){
  if(document.querySelector('.pcd-top'))return;
  document.body.classList.add('pulse-creation-deck');
  const top=make('div','pcd-top');
  top.innerHTML='<button class="pcd-brand" id="pcd-home" aria-label="Pulse home"><span class="pcd-brand-mark">◎</span><span class="pcd-brand-name">MOOR · Pulse</span></button>'+
    '<div class="pcd-top-actions">'+
      '<button class="pcd-circle" id="pcd-library" title="Library" aria-label="Component Library">⌘</button>'+
      '<button class="pcd-circle optional-mobile" id="pcd-refinery-btn" title="Refinery" aria-label="MOOR Refinery">◇</button>'+
      '<button class="pcd-circle optional-mobile" id="pcd-funnel" title="Funnel" aria-label="Funnel">⌬</button>'+
      '<button class="pcd-tune" id="pcd-inspector" aria-label="Inspector">TUNE</button>'+
    '</div>';
  document.body.appendChild(top);

  const deck=make('div','pcd-deck');
  deck.innerHTML='<div class="pcd-deck-scroll" id="pcd-apps"></div><span class="pcd-deck-divider"></span><button class="pcd-deck-action" id="pcd-all" title="All components" aria-label="All components">＋</button>';
  document.body.appendChild(deck);

  const pill=make('button','pcd-refinery','<i></i><span>Refinery</span><b id="pcd-reuse-count">0 reuse</b>');
  pill.id='pcd-refinery-pill';document.body.appendChild(pill);

  const scrim=make('div','pcd-scrim');scrim.id='pcd-scrim';document.body.appendChild(scrim);
  const lib=make('aside','pcd-sheet library');lib.id='pcd-library-sheet';
  lib.innerHTML='<div class="pcd-sheet-head"><div class="pcd-sheet-title">Component Library</div><button class="pcd-sheet-close" data-pcd-close>×</button></div>'+
    '<input class="pcd-search" id="pcd-search" placeholder="Search components, apps, capabilities…">'+
    '<div class="pcd-filter-row" id="pcd-filters"></div><div class="pcd-list" id="pcd-library-list"></div>';
  document.body.appendChild(lib);
  const ins=make('aside','pcd-sheet inspector');ins.id='pcd-inspector-sheet';
  ins.innerHTML='<div class="pcd-sheet-head"><div class="pcd-sheet-title">Inspector</div><button class="pcd-sheet-close" data-pcd-close>×</button></div><div class="pcd-inspector-body" id="pcd-inspector-body"></div>';
  document.body.appendChild(ins);

  document.getElementById('pcd-home').onclick=()=>{closeFocus();closeSheets()};
  document.getElementById('pcd-library').onclick=()=>openSheet('library');
  document.getElementById('pcd-all').onclick=()=>openSheet('library');
  document.getElementById('pcd-inspector').onclick=()=>openSheet('inspector');
  document.getElementById('pcd-refinery-btn').onclick=()=>openRefinery();
  document.getElementById('pcd-refinery-pill').onclick=()=>openRefinery();
  document.getElementById('pcd-funnel').onclick=()=>openByCandidate(['funnel-fabric','funnel-environment','funnel']);
  scrim.onclick=closeSheets;
  document.querySelectorAll('[data-pcd-close]').forEach(b=>b.onclick=closeSheets);
  document.getElementById('pcd-search').addEventListener('input',e=>{state.query=e.target.value;renderLibrary()});
  window.addEventListener('moor:request-result',updateStats);
  window.addEventListener('moor:refinery-usage',updateStats);
  window.addEventListener('moor:capability-memory',updateStats);
  window.addEventListener('message',e=>{if(e&&e.data&&e.data.type==='moor:assembly-stat'&&window.MoorCapabilityMemory)window.MoorCapabilityMemory.recordUse(e.data.detail.type,e.data.detail.data||{});});
  setInterval(updateStats,2500);
  renderFilters();renderDeck();renderLibrary();renderInspector();updateStats();
}
function openByCandidate(ids){for(const id of ids){if(compById(id)){openComp(id);return}}}
function openRefinery(){openByCandidate(['capability-memory','moor-refinery','funnel-fabric'])}
function openSheet(which){
  const lib=document.getElementById('pcd-library-sheet'),ins=document.getElementById('pcd-inspector-sheet'),scrim=document.getElementById('pcd-scrim');
  lib.classList.toggle('on',which==='library');ins.classList.toggle('on',which==='inspector');scrim.classList.add('on');
  if(which==='library')setTimeout(()=>document.getElementById('pcd-search').focus(),80);
  if(which==='inspector')renderInspector();
}
function closeSheets(){document.getElementById('pcd-library-sheet')?.classList.remove('on');document.getElementById('pcd-inspector-sheet')?.classList.remove('on');document.getElementById('pcd-scrim')?.classList.remove('on')}
function renderDeck(){
  const host=document.getElementById('pcd-apps');if(!host)return;host.innerHTML='';
  const focus=(typeof UI!=='undefined'&&UI.focus)||null;
  appSet().forEach(c=>{
    const b=make('button','pcd-app'+(focus===c.id?' active':''),esc(icon(c)));b.title=c.label||c.id;b.dataset.id=c.id;b.dataset.verified=verifiedComp(c)?'1':'0';b.onclick=()=>openComp(c.id);host.appendChild(b);
  });
}
function filters(){return [{id:'all',label:'All'},{id:'apps',label:'Apps'},{id:'components',label:'Components'},{id:'verified',label:'Verified'},{id:'recent',label:'Recent'},{id:'made',label:'Made by you'}]}
function renderFilters(){const h=document.getElementById('pcd-filters');if(!h)return;h.innerHTML='';filters().forEach(f=>{const b=make('button','pcd-filter'+(state.filter===f.id?' on':''),esc(f.label));b.onclick=()=>{state.filter=f.id;save();renderFilters();renderLibrary()};h.appendChild(b)})}
function libraryItems(){
  let xs=visibleComps().slice(),q=(state.query||'').trim().toLowerCase();
  if(state.filter==='apps')xs=xs.filter(isRunnable);
  if(state.filter==='components')xs=xs.filter(c=>!isRunnable(c)||c.tool);
  if(state.filter==='verified')xs=xs.filter(verifiedComp);
  if(state.filter==='recent'){const order=new Map(state.recent.map((x,i)=>[x,i]));xs=xs.filter(c=>order.has(c.id)).sort((a,b)=>order.get(a.id)-order.get(b.id))}
  if(state.filter==='made')xs=xs.filter(c=>/made|you|custom|project/i.test([...(c.cats||[]),c.source||'',c.short||''].join(' ')));
  if(q)xs=xs.filter(c=>[c.id,c.label,c.short,c.job,c.source,(c.cats||[]).join(' ')].join(' ').toLowerCase().includes(q));
  return xs.slice(0,300);
}
function renderLibrary(){
  const h=document.getElementById('pcd-library-list');if(!h)return;h.innerHTML='';
  const xs=libraryItems();
  if(!xs.length){h.innerHTML='<div style="padding:28px 16px;color:#758899;font-size:12px">Nothing matches this view.</div>';return}
  xs.forEach(c=>{
    const r=make('button','pcd-row');const v=verifiedComp(c);
    r.innerHTML='<span class="pcd-row-icon">'+esc(icon(c))+'</span><span class="pcd-row-copy"><strong>'+esc(c.label||c.id)+'</strong><span>'+esc(c.short||c.job||c.id)+'</span></span>'+(v?'<span class="pcd-row-badge">VERIFIED</span>':'');
    r.onclick=()=>{state.selected=c.id;save();renderInspector();openComp(c.id)};h.appendChild(r);
  });
}
function focusedComp(){let id=null;try{id=typeof UI!=='undefined'&&UI.focus||state.selected}catch(e){id=state.selected}return compById(id)||compById(state.selected)}
function renderInspector(){
  const h=document.getElementById('pcd-inspector-body');if(!h)return;const c=focusedComp();
  if(!c){h.innerHTML='<div style="padding:24px 2px;color:#7e91a2;font-size:13px;line-height:1.6">Focus an app or component. Full controls, provenance, assembly and capability data will appear here without occupying the workspace.</div>';return}
  const st=sourceStats(c),refs=(window.PulseSpine&&window.PulseSpine.references||[]).filter(r=>r.source_id===c.id||r.implementation_ref===c.source||r.implementation_ref===c.page||r.implementation_ref===c.toolSrc);
  const caps=refs.filter(r=>r.kind==='capability'),assemblies=refs.filter(r=>r.kind==='assembly'),evidence=refs.filter(r=>r.kind==='evidence');
  h.innerHTML='<div style="font-size:27px;margin-bottom:10px">'+esc(icon(c))+'</div><h2>'+esc(c.label||c.id)+'</h2><p>'+esc(c.job||c.short||'')+'</p>'+
    '<button class="pcd-open-btn" id="pcd-inspector-open">Open / focus</button>'+
    '<div class="pcd-inspector-section"><div class="pcd-inspector-label">Capability</div>'+
      '<div class="pcd-kv"><span>Verified references</span><b>'+st.verified+'</b></div><div class="pcd-kv"><span>Capabilities</span><b>'+caps.length+'</b></div><div class="pcd-kv"><span>Assemblies</span><b>'+assemblies.length+'</b></div><div class="pcd-kv"><span>Evidence</span><b>'+evidence.length+'</b></div></div>'+
    '<div class="pcd-inspector-section"><div class="pcd-inspector-label">Source</div><div class="pcd-kv"><span>ID</span><b>'+esc(c.id)+'</b></div><div class="pcd-kv"><span>Runtime</span><b>'+esc(c.tool||c.page||c.toolSrc||'component')+'</b></div><div class="pcd-kv"><span>Categories</span><b>'+esc((c.cats||[]).join(' · ')||'—')+'</b></div></div>'+
    (refs.length?'<div class="pcd-inspector-section"><div class="pcd-inspector-label">References</div>'+refs.slice(0,8).map(r=>'<div class="pcd-kv"><span>'+esc(r.kind)+'</span><b>'+esc(r.status||'observed')+'</b></div>').join('')+'</div>':'');
  document.getElementById('pcd-inspector-open').onclick=()=>openComp(c.id);
}
function updateStats(){
  const el=document.getElementById('pcd-reuse-count');if(!el)return;
  let n=0;try{const st=window.MoorCapabilityMemory&&window.MoorCapabilityMemory.stats();n=st&&st.usage&&st.usage.deterministic_reuse_events||0}catch(e){}
  el.textContent=n+' reuse';
}
function observeFocus(){
  let last=null;setInterval(()=>{let f=null;try{f=typeof UI!=='undefined'?UI.focus:null}catch(e){}if(f!==last){last=f;document.body.classList.toggle('pcd-focus',!!f);if(f){state.selected=f;state.recent=[f].concat(state.recent.filter(x=>x!==f)).slice(0,16);save()}renderDeck();renderInspector()}},350);
}
function start(){read();ensure();observeFocus()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();