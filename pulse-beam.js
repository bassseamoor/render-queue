/* Pulse Beam v1 — spatial product shell. Existing component internals remain unchanged. */
(function(){
'use strict';
const KEY='moor-pulse-beam-v1';
let state={space:'create',pinned:[],recent:[],filter:'all',query:'',selected:null};
const SPACES=[{id:'create',label:'Create',icon:'◉'},{id:'funnel',label:'Funnel Hall',icon:'⌬'}];
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x)state=Object.assign(state,x)}catch(e){}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function comps(){try{return typeof COMPS!=='undefined'&&Array.isArray(COMPS)?COMPS:[]}catch(e){return []}}
function comp(id){return comps().find(c=>c.id===id)||null}
function visible(){return comps().filter(c=>!c.hidden)}
function runnable(c){return !!(c&&(c.tool||c.page||c.toolSrc||c.source&&/\.html(?:$|\?)/i.test(c.source)))}
function icon(c){return c&&c.icon?c.icon:'◇'}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function make(t,cl,h){const e=document.createElement(t);if(cl)e.className=cl;if(h!=null)e.innerHTML=h;return e}
function refsFor(c){const refs=(window.PulseSpine&&window.PulseSpine.references)||[];return refs.filter(r=>r.source_id===c.id||r.implementation_ref===c.page||r.implementation_ref===c.toolSrc||r.implementation_ref===c.source)}
function verified(c){return refsFor(c).some(r=>['machine-verified','human-approved','canonical'].includes(r.status)||r.kind==='capability')}
function appSet(){const ids=[...state.pinned,...state.recent],out=[];ids.forEach(id=>{const c=comp(id);if(c&&runnable(c)&&!out.some(x=>x.id===id))out.push(c)});if(out.length<9)visible().filter(runnable).slice(0,20).forEach(c=>{if(!out.some(x=>x.id===c.id))out.push(c)});return out.slice(0,15)}
function openComp(id){const c=comp(id);if(!c)return;state.selected=id;state.recent=[id].concat(state.recent.filter(x=>x!==id)).slice(0,18);save();setSpace('create',{silent:true});try{if(typeof openComponent==='function')openComponent(id);else if(window.openComponent)window.openComponent(id)}catch(e){}renderDock();renderInspector();closeSheets()}
function setSpace(id,opt){opt=opt||{};if(!SPACES.some(s=>s.id===id))return;state.space=id;save();document.body.classList.toggle('beam-space-funnel',id==='funnel');document.querySelectorAll('.beam-space-btn').forEach(b=>b.classList.toggle('on',b.dataset.space===id));document.querySelectorAll('.beam-space-dot').forEach(b=>b.classList.toggle('on',b.dataset.space===id));if(id==='funnel'){try{document.getElementById('beam-funnel-frame').contentWindow.postMessage({type:'beam:entered'},'*')}catch(e){}}if(!opt.silent){try{navigator.vibrate&&navigator.vibrate(7)}catch(e){}}}
function nextSpace(dir){const i=SPACES.findIndex(s=>s.id===state.space),j=Math.max(0,Math.min(SPACES.length-1,i+dir));if(i!==j)setSpace(SPACES[j].id)}
function build(){
  if(document.querySelector('.beam-top'))return;document.body.classList.add('pulse-beam');
  const top=make('div','beam-top');
  top.innerHTML='<button class="beam-brand" id="beam-home"><span class="beam-brand-mark">◈</span><span>PULSE BEAM</span><span class="beam-brand-sub">MOOR</span></button><div class="beam-space-nav">'+
    SPACES.map(s=>'<button class="beam-space-btn" data-space="'+s.id+'" title="'+s.label+'" aria-label="'+s.label+'">'+s.icon+'</button>').join('')+
    '<button class="beam-control optional-mobile" id="beam-library" title="Library" aria-label="Component Library">⌘</button><button class="beam-control tune" id="beam-inspector">TUNE</button></div>';
  document.body.appendChild(top);
  const hall=make('section','beam-funnel-space','<div class="beam-space-hint">live Funnel architecture · drag to look · swipe right to return</div><iframe id="beam-funnel-frame" title="Pulse Beam Funnel Hall" src="pulse-beam-funnel-hall.html"></iframe>');document.body.appendChild(hall);
  const dock=make('div','beam-dock','<div class="beam-dock-scroll" id="beam-apps"></div><span class="beam-dock-line"></span><button class="beam-dock-action" id="beam-add" aria-label="All components">＋</button>');document.body.appendChild(dock);
  const dots=make('div','beam-space-dots',SPACES.map(s=>'<i class="beam-space-dot '+(s.id==='funnel'?'funnel':'')+'" data-space="'+s.id+'"></i>').join(''));document.body.appendChild(dots);
  const scrim=make('div','beam-scrim');scrim.id='beam-scrim';document.body.appendChild(scrim);
  const lib=make('aside','beam-sheet library','<div class="beam-sheet-head"><div class="beam-sheet-title">Library</div><button class="beam-sheet-close" data-beam-close>×</button></div><input class="beam-search" id="beam-search" placeholder="Search tools, components, capabilities…"><div class="beam-filters" id="beam-filters"></div><div class="beam-list" id="beam-list"></div>');lib.id='beam-library-sheet';document.body.appendChild(lib);
  const ins=make('aside','beam-sheet inspector','<div class="beam-sheet-head"><div class="beam-sheet-title">Inspector</div><button class="beam-sheet-close" data-beam-close>×</button></div><div class="beam-inspector-body" id="beam-inspector-body"></div>');ins.id='beam-inspector-sheet';document.body.appendChild(ins);
  document.getElementById('beam-home').onclick=()=>setSpace('create');
  document.querySelectorAll('.beam-space-btn').forEach(b=>b.onclick=()=>setSpace(b.dataset.space));
  document.getElementById('beam-library').onclick=()=>openSheet('library');document.getElementById('beam-add').onclick=()=>openSheet('library');document.getElementById('beam-inspector').onclick=()=>openSheet('inspector');
  scrim.onclick=closeSheets;document.querySelectorAll('[data-beam-close]').forEach(b=>b.onclick=closeSheets);document.getElementById('beam-search').oninput=e=>{state.query=e.target.value;renderLibrary()};
  installGestures();installKeys();renderFilters();renderDock();renderLibrary();renderInspector();observeFocus();setSpace(state.space,{silent:true});
}
function openSheet(which){document.getElementById('beam-library-sheet').classList.toggle('on',which==='library');document.getElementById('beam-inspector-sheet').classList.toggle('on',which==='inspector');document.getElementById('beam-scrim').classList.add('on');if(which==='library')setTimeout(()=>document.getElementById('beam-search').focus(),70);if(which==='inspector')renderInspector()}
function closeSheets(){document.getElementById('beam-library-sheet')?.classList.remove('on');document.getElementById('beam-inspector-sheet')?.classList.remove('on');document.getElementById('beam-scrim')?.classList.remove('on')}
function renderDock(){const h=document.getElementById('beam-apps');if(!h)return;h.innerHTML='';let focus=null;try{focus=typeof UI!=='undefined'?UI.focus:null}catch(e){}appSet().forEach(c=>{const b=make('button','beam-app'+(focus===c.id?' active':''),esc(icon(c)));b.title=c.label||c.id;b.dataset.verified=verified(c)?'1':'0';b.onclick=()=>openComp(c.id);h.appendChild(b)})}
const filters=[['all','All'],['apps','Apps'],['components','Components'],['verified','Verified'],['recent','Recent'],['made','Made by you']];
function renderFilters(){const h=document.getElementById('beam-filters');if(!h)return;h.innerHTML='';filters.forEach(([id,label])=>{const b=make('button','beam-filter'+(state.filter===id?' on':''),label);b.onclick=()=>{state.filter=id;save();renderFilters();renderLibrary()};h.appendChild(b)})}
function libraryItems(){let xs=visible().slice(),q=state.query.trim().toLowerCase();if(state.filter==='apps')xs=xs.filter(runnable);if(state.filter==='components')xs=xs.filter(c=>!runnable(c)||c.tool);if(state.filter==='verified')xs=xs.filter(verified);if(state.filter==='recent'){const o=new Map(state.recent.map((x,i)=>[x,i]));xs=xs.filter(c=>o.has(c.id)).sort((a,b)=>o.get(a.id)-o.get(b.id))}if(state.filter==='made')xs=xs.filter(c=>/made|you|custom|project/i.test([...(c.cats||[]),c.source||'',c.short||''].join(' ')));if(q)xs=xs.filter(c=>[c.id,c.label,c.short,c.job,c.source,(c.cats||[]).join(' ')].join(' ').toLowerCase().includes(q));return xs.slice(0,400)}
function renderLibrary(){const h=document.getElementById('beam-list');if(!h)return;const xs=libraryItems();h.innerHTML=xs.length?'':'<div style="padding:25px 14px;color:#758797;font-size:12px">Nothing matches.</div>';xs.forEach(c=>{const r=make('button','beam-row');r.innerHTML='<span class="beam-row-ic">'+esc(icon(c))+'</span><span class="beam-row-copy"><strong>'+esc(c.label||c.id)+'</strong><span>'+esc(c.short||c.job||c.id)+'</span></span>'+(verified(c)?'<span class="beam-badge">VERIFIED</span>':'');r.onclick=()=>openComp(c.id);h.appendChild(r)})}
function focused(){let id=state.selected;try{id=typeof UI!=='undefined'&&UI.focus||id}catch(e){}return comp(id)||comp(state.selected)}
function renderInspector(){const h=document.getElementById('beam-inspector-body');if(!h)return;const c=focused();if(!c){h.innerHTML='<p style="padding:18px 2px">Focus a tool or component. Beam keeps full controls, provenance and migration state here without occupying the workspace.</p>';return}const refs=refsFor(c),audit=window.PulseBeamAudit&&window.PulseBeamAudit.get(c.id);h.innerHTML='<div style="font-size:27px">'+esc(icon(c))+'</div><h2>'+esc(c.label||c.id)+'</h2><p>'+esc(c.job||c.short||'')+'</p><button class="beam-open" id="beam-open-focus">Open / focus</button><div class="beam-inspector-section"><div class="beam-inspector-label">Beam migration</div><div class="beam-kv"><span>Level</span><b>'+esc(audit&&audit.level||'legacy-compatible')+'</b></div><div class="beam-kv"><span>No-loss parity</span><b>'+esc(audit&&audit.parity?'PASS':'pending')+'</b></div><div class="beam-kv"><span>References</span><b>'+refs.length+'</b></div></div><div class="beam-inspector-section"><div class="beam-inspector-label">Identity</div><div class="beam-kv"><span>ID</span><b>'+esc(c.id)+'</b></div><div class="beam-kv"><span>Runtime</span><b>'+esc(c.tool||c.page||c.toolSrc||'component')+'</b></div></div>';document.getElementById('beam-open-focus').onclick=()=>openComp(c.id)}
function interactiveTarget(t){return !!(t&&t.closest&&t.closest('input,textarea,select,button,a,iframe,canvas,[contenteditable],.beam-sheet,.page-open,.window,.tool-host,[data-no-beam-swipe]'))}
function installGestures(){let start=null;document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(interactiveTarget(e.target))return;start={x:e.clientX,y:e.clientY,t:performance.now()}},{passive:true});document.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y,dt=Math.max(1,performance.now()-start.t),v=Math.abs(dx)/dt;start=null;if(Math.abs(dx)<72||Math.abs(dx)<Math.abs(dy)*1.35||v<.18)return;if(dx<0)nextSpace(1);else nextSpace(-1)},{passive:true})}
function installKeys(){window.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement&&document.activeElement.tagName))return;if(e.key===']'||(e.altKey&&e.key==='ArrowRight')){e.preventDefault();nextSpace(1)}if(e.key==='['||(e.altKey&&e.key==='ArrowLeft')){e.preventDefault();nextSpace(-1)}})}
function observeFocus(){let last=null;setInterval(()=>{let f=null;try{f=typeof UI!=='undefined'?UI.focus:null}catch(e){}if(f!==last){last=f;if(f){state.selected=f;state.recent=[f].concat(state.recent.filter(x=>x!==f)).slice(0,18);save()}renderDock();renderInspector()}},320)}
window.addEventListener('message',e=>{
  const d=e&&e.data||{};
  if(d.type==='beam:navigate'&&d.space)setSpace(d.space);
  if(d.type==='beam:open-component'&&Array.isArray(d.ids)){for(const id of d.ids){if(comp(id)){openComp(id);break}}}
});
function start(){read();build()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.PulseBeam=Object.freeze({spaces:SPACES.slice(),setSpace,openComp,getState:()=>JSON.parse(JSON.stringify(state))});
})();