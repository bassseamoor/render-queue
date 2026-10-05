/* Pulse Funnel project/version surface. Replaces the old component canvas without deleting legacy project data. */
(function(){
'use strict';

const params=new URLSearchParams(location.search);
const child=params.get('workspace-tool');

const style=document.createElement('style');
style.id='pulse-funnel-style';
style.textContent=[
'@media(min-width:761px){',
' body.tabs-on{height:100dvh;overflow:hidden}',
' body.tabs-on>header{position:fixed;inset:0 0 auto;height:66px;transform:none!important}',
' body.tabs-on #app,body.tabs-on.chrome-hidden #app,body.tabs-on #app.independent-focus{margin-top:66px;height:calc(100dvh - 66px);display:grid;grid-template-columns:210px minmax(0,1fr)!important;grid-template-rows:minmax(0,1fr);gap:14px;padding:14px;transition:none}',
' body.tabs-on #main{grid-column:2;grid-row:1;width:100%;height:100%;min-width:0;padding:24px;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;backdrop-filter:none;-webkit-backdrop-filter:none;background:rgba(12,14,28,.88)!important}',
' body.tabs-on #tabbar{display:flex!important;position:fixed;left:14px;top:80px;bottom:14px;right:auto;width:210px;flex-direction:column;justify-content:flex-start;align-items:stretch;gap:8px;padding:14px 10px;border:1px solid var(--line);border-radius:18px;background:rgba(20,15,36,.94)}',
' body.tabs-on #tabbar button{flex:0 0 auto;max-width:none;min-height:52px;flex-direction:row;justify-content:flex-start;gap:14px;padding:12px 16px;font-size:.95rem;letter-spacing:0;text-align:left}',
' body.tabs-on #tabbar button.on{background:rgba(127,212,255,.12);box-shadow:inset 3px 0 var(--cyan)}',
' body.tabs-on #tabbar button:hover{background:rgba(255,255,255,.07)}',
' body.tabs-on #tabview{padding:0 0 24px}',
' body.tabs-on #chrome-pull{display:none}',
'}',
'@media(min-width:761px) and (max-width:1000px){body.tabs-on #app,body.tabs-on.chrome-hidden #app,body.tabs-on #app.independent-focus{grid-template-columns:160px minmax(0,1fr)!important;gap:10px;padding:10px}body.tabs-on #tabbar{left:10px;top:76px;bottom:10px;width:160px}body.tabs-on #tabbar button{padding:12px 10px;gap:10px}body.tabs-on #main{padding:18px}}',
'body.pw-child{overflow:hidden!important;height:100dvh!important}',
'body.pw-child>header,body.pw-child #tabbar,body.pw-child #chrome-pull,body.pw-child #activity,body.pw-child .focus-nav,body.pw-child .focus-about{display:none!important}',
'body.pw-child #app,body.pw-child #app.independent-focus,body.pw-child.chrome-hidden #app{display:block!important;margin:0!important;padding:0!important;height:100dvh!important}',
'body.pw-child #main{display:block!important;width:100%!important;height:100%!important;padding:0!important;border:0!important;border-radius:0!important;overflow:auto!important}',
'body.pw-child #tabview,body.pw-child .tool-host{padding:0!important;margin:0!important;width:100%!important}',
'body.pw-child #tabview>.tool-host{border:0!important;border-radius:0!important;box-shadow:none!important}',
'body.pw-child .tool-host>iframe{height:100dvh!important;min-height:0!important;border-radius:0!important}',
'.pf-shell{display:none;height:100%;min-height:0;flex-direction:column;gap:10px}',
'body.pw-active #main{padding:12px!important;overflow:hidden!important}',
'body.pw-active #main>.pf-shell{display:flex}',
'body.pw-active #main>#tabview,body.pw-active #main>#windows{display:none!important}',
'.pf-top{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;padding:5px 4px 3px}',
'.pf-top-copy{flex:1;min-width:220px}.pf-top h2{font-size:1.25rem}.pf-top p{font-size:.82rem;color:var(--muted);margin-top:4px;max-width:760px}',
'.pf-top .pill{font-size:11px}',
'.pf-layout{display:grid;grid-template-columns:245px minmax(0,1fr);gap:12px;flex:1;min-height:0}',
'.pf-bin,.pf-stage{border:1px solid var(--line);border-radius:16px;background:rgba(13,16,31,.80);min-height:0}',
'.pf-bin{display:flex;flex-direction:column;padding:10px;overflow:hidden}',
'.pf-bin input{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:10px;background:#090d19;color:var(--text);font:inherit}',
'.pf-list{overflow:auto;min-height:0;margin-top:8px;padding-right:2px}',
'.pf-project{width:100%;display:flex;align-items:center;gap:10px;text-align:left;border:1px solid transparent;background:transparent;color:var(--text);padding:10px;border-radius:11px;margin:2px 0}',
'.pf-project:hover{background:#ffffff08;border-color:var(--line)}.pf-project.on{background:#7fd4ff12;border-color:#7fd4ff55}',
'.pf-project-icon{font-size:18px;width:24px;text-align:center}.pf-project-copy{flex:1;min-width:0}.pf-project-copy strong{display:block;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pf-project-copy small{display:block;margin-top:3px;font-size:11px;color:var(--muted)}',
'.pf-q{font-size:10px;letter-spacing:.08em;text-transform:uppercase;border:1px solid #f4cb7766;color:var(--amber);border-radius:999px;padding:3px 6px}',
'.pf-stage{overflow:auto;padding:18px 18px 40px}',
'.pf-empty{display:grid;place-items:center;min-height:50%;color:var(--muted);text-align:center}.pf-empty strong{display:block;color:var(--text);font-size:18px;margin-bottom:6px}',
'.pf-project-head{display:flex;align-items:flex-start;gap:12px;margin-bottom:18px}.pf-project-head>div:first-child{flex:1}.pf-project-head h2{font-size:1.45rem}.pf-project-head p{margin-top:5px;color:var(--muted);font-size:.86rem;max-width:760px}.pf-head-actions{display:flex;gap:8px;flex-wrap:wrap}.pf-head-actions .btn{min-height:36px;font-size:12px;padding:7px 10px}',
'.pf-queue{border:1px solid #806b3b;background:#2d26142e;border-radius:14px;padding:16px}.pf-queue strong{color:var(--amber)}.pf-queue p{margin-top:6px;color:var(--muted);font-size:.86rem}',
'.pf-line{position:relative;padding-left:38px}.pf-line:before{content:"";position:absolute;left:13px;top:10px;bottom:10px;width:1px;background:linear-gradient(#7fd4ff66,#7fd4ff12)}',
'.pf-version{position:relative;border:1px solid #3a435c;border-radius:15px;background:#101522;margin:0 0 18px;padding:14px;box-shadow:0 12px 36px #0003}.pf-version:before{content:"";position:absolute;left:-32px;top:23px;width:11px;height:11px;border-radius:50%;background:#0b101b;border:2px solid var(--cyan);box-shadow:0 0 14px #7fd4ff55}.pf-version.working{border-color:#f4cb7766}.pf-version.working:before{border-color:var(--amber);box-shadow:0 0 14px #f4cb7755}',
'.pf-vhead{display:flex;align-items:flex-start;gap:10px}.pf-vcopy{flex:1;min-width:0}.pf-vtitle{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.pf-vtitle strong{font-size:15px}.pf-state{font-size:10px;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);border-radius:999px;padding:3px 7px;color:var(--muted)}.pf-state.locked{color:var(--cyan);border-color:#7fd4ff55}.pf-state.working{color:var(--amber);border-color:#f4cb7766}.pf-vmeta{font-size:11px;color:var(--muted);margin-top:4px}.pf-vactions{display:flex;gap:7px;flex-wrap:wrap}.pf-vactions .btn{min-height:34px;padding:6px 9px;font-size:12px}',
'.pf-components{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px;padding-top:12px;border-top:1px solid #ffffff0b}.pf-chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #454e66;border-radius:9px;background:#171d2b;color:var(--text);padding:7px 9px;font-size:12px;max-width:280px}.pf-chip.inherited{opacity:.28}.pf-chip.changed{border-color:#7fd4ff88;background:#7fd4ff10}.pf-chip small{font-size:10px;color:var(--muted)}',
'.pf-detail{margin-top:12px;border-top:1px solid #ffffff0d;padding-top:10px}.pf-detail summary{color:var(--muted);font-size:12px}.pf-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:8px}.pf-card{border:1px solid #30394f;border-radius:10px;padding:10px;background:#0d1220}.pf-card strong{display:block;font-size:12px}.pf-card p{font-size:11px;color:var(--muted);margin-top:4px;line-height:1.45}',
'.pf-ramble{margin-top:13px;padding-top:12px;border-top:1px solid #ffffff0d}.pf-ramble label{display:block;font-size:12px;color:var(--muted);margin-bottom:6px}.pf-ramble textarea{width:100%;min-height:92px;resize:vertical}.pf-ramble .pf-note{font-size:11px;color:var(--muted);margin-top:6px}.pf-ramble-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}.pf-ramble-actions .btn{min-height:34px;padding:6px 9px;font-size:12px}',
'.pf-status{font-size:11px;color:var(--muted);padding:0 4px;min-height:16px}',
'@media(max-width:900px){.pf-layout{grid-template-columns:190px minmax(0,1fr)}}',
'@media(max-width:760px){body.pw-active #main{padding:6px!important}.pf-layout{display:block;overflow:auto}.pf-bin{max-height:210px;margin-bottom:8px}.pf-stage{overflow:visible;padding:14px}.pf-project-head{display:block}.pf-head-actions{margin-top:10px}.pf-line{padding-left:27px}.pf-line:before{left:9px}.pf-version:before{left:-23px}.pf-components{gap:5px}.pf-chip{font-size:11px;padding:6px 7px}}'
].join('\n');
document.head.appendChild(style);

if(child)document.body.classList.add('pw-child');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else queueMicrotask(init);

function init(){
 if(typeof COMPS==='undefined'||typeof openComponent!=='function')return;

 if(child){
  if(typeof unmountFocus==='function')unmountFocus();
  if(typeof UI!=='undefined'){UI.focus=null;UI.open=[];}
  try{persist=function(){};}catch(_){}
  const c=COMPS.find(x=>x.id===child);
  if(c){
   openComponent(child);
   document.title=(c.label||child)+' · Pulse panel';
   const fit=document.createElement('script');fit.src='pulse-panel-fit.js?v=20261005-funnel';document.body.appendChild(fit);
  }else{
   const tv=document.querySelector('#tabview');if(tv)tv.textContent='This component is unavailable: '+child;
  }
  return;
 }

 const STORE='moor-pulse-funnel-projects-v1';
 const LEGACY='moor-pulse-component-projects-v1';
 const originalOpen=openComponent,originalTab=selectTab,originalBar=ensureTabbar,originalBin=binView;
 const main=document.getElementById('main');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=()=>crypto.randomUUID?crypto.randomUUID():'pf-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v??d}catch(e){return d}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
 const now=()=>new Date().toISOString();
 const comp=id=>COMPS.find(c=>c.id===id);

 function componentItem(id){
  const c=comp(id);
  if(!c)return {kind:'component',ref:id,label:id,sourceVersion:'current',source:'Pulse manifest'};
  return {kind:'component',ref:id,label:c.label||id,sourceVersion:c.version||'current',source:c.source||c.page||c.toolSrc||'Pulse manifest'};
 }
 function pageItem(ref,label,page,detail){return {kind:'page',ref:ref,label:label,page:page,sourceVersion:'current',source:page,detail:detail||''};}
 function virtualItem(ref,label,detail){return {kind:'system',ref:ref,label:label,sourceVersion:'v43',source:'The Moor Funnel Prompt — v43',detail:detail||''};}

 function funnelMembers(){
  return [
   pageItem('funnel-app','The Funnel','quiz-funnel-v3.html','The existing full Funnel application in the repository.'),
   virtualItem('ramble-blueprint','Ramble → Blueprint','Raw thought distillation and frozen Page 0.'),
   virtualItem('quiz-resolver','Quiz resolver','Two-sided quiz; only valid answers; auto-fill unresolved pages.'),
   virtualItem('paged-attention','Locked pages','Immutable answer pages with provenance and incremental recompute.'),
   virtualItem('worker-bank','Worker bank','Domain-fit routing from proven worker philosophy, taste, and rules.'),
   virtualItem('verdict-packet','Verdict packet','Builder receives only spec + destination + done-criteria.'),
   virtualItem('verification','Verification gates','Workers build and prove through the real user path.'),
   virtualItem('dogfood-engine','Dogfood Engine','Verified answers and negative results compound into reusable parts.'),
   virtualItem('foundry','Foundry','The funnel builds and trials new workers.'),
   virtualItem('versions','Versions','Locked, restorable, forkable outcomes are the verdict.')
  ];
 }
 function generatorMembers(){
  return COMPS.filter(c=>Array.isArray(c.cats)&&c.cats.includes('generators')).map(c=>componentItem(c.id));
 }
 function seedProject(id,name,icon,description,members,page,queued){
  return {id:id,name:name,icon:icon,description:description,members:members||[],page:page||null,queued:!!queued,versions:queued?[]:[{
   id:uid(),number:'v1',title:'Current import',state:'locked-import',createdAt:now(),parentId:null,revision:'',items:(members||[]).map(x=>Object.assign({},x,{inherited:false,change:'baseline'}))
  }]};
 }

 function seeds(){
  return [
   seedProject('funnel','Funnel','🌀','The full v43 Funnel system itself: quiz resolver, pages, workers, verification, Engine, Foundry, and versions.',funnelMembers(),'quiz-funnel-v3.html',false),
   seedProject('project-pulse','Project Pulse','◈','The Project Pulse environment itself — inventory, tools, projects, and the Funnel surface.',[componentItem('project-pulse')],'pulse-dashboard.html',false),
   seedProject('procedural-generators','Procedural Generators','⚙','Every current Pulse component explicitly tagged as a generator, kept together as one heavyweight generator project.',generatorMembers(),null,false),
   seedProject('render-studio','Render Studio','◫','The unified rendering/creative studio as a complete project.',[componentItem('render-studio')],comp('render-studio')?.page||null,false),
   seedProject('moor-canvas','Moor Canvas','▧','Moor Canvas as a complete evolving project.',[componentItem('more-canvas')],comp('more-canvas')?.page||'more-canvas.html',false),
   seedProject('moor-ultra-os','Moor Ultra OS','≋','Moor Ultra OS as a complete project.',[componentItem('stream')],comp('stream')?.page||null,false),
   seedProject('wonder-feed','Wonder Feed','✨','Wonder Feed as a complete project.',[componentItem('wonder-feed')],comp('wonder-feed')?.page||'wonder-feed.html',false),
   seedProject('moor-beta','Moor Beta','🌐','Queued for this Funnel/version system, but intentionally not imported or frozen while the Beta is actively being worked on.',[componentItem('moor-beta')],comp('moor-beta')?.page||'moor-beta.html',true)
  ];
 }

 function loadState(){
  const current=read(STORE,null);
  if(!current||!Array.isArray(current.projects)){
   const state={schema:'moor.funnel-projects',version:1,createdAt:now(),selected:'funnel',projects:seeds()};
   write(STORE,state);return state;
  }
  const byId=new Map(current.projects.map(p=>[p.id,p]));
  seeds().forEach(s=>{
   if(!byId.has(s.id)){current.projects.push(s);return;}
   const p=byId.get(s.id);
   p.name=s.name;p.icon=s.icon;p.description=s.description;p.page=s.page;p.queued=s.queued;
   if(p.queued){p.members=s.members;}
   if(!Array.isArray(p.members)||!p.members.length)p.members=s.members;
  });
  if(!current.selected||!current.projects.some(p=>p.id===current.selected))current.selected='funnel';
  write(STORE,current);return current;
 }

 let state=loadState();
 let selected=state.selected;

 const shell=document.createElement('section');
 shell.className='pf-shell';
 shell.setAttribute('aria-label','Funnel project versions');
 shell.innerHTML=
  '<div class="pf-top"><div class="pf-top-copy"><h2>Funnel</h2><p>Projects are the visible unit. Locked versions are immutable; revisions duplicate the whole project and inherit unchanged answers by reference.</p></div>'+
  '<span class="pill"><span id="pf-project-count"></span> projects</span><span class="pill amber"><span id="pf-queue-count"></span> queued</span></div>'+
  '<div class="pf-layout"><aside class="pf-bin"><input id="pf-search" type="search" placeholder="Search projects…" aria-label="Search Funnel projects"><div id="pf-list" class="pf-list"></div></aside><section id="pf-stage" class="pf-stage"></section></div>'+
  '<div id="pf-status" class="pf-status" role="status"></div>';
 main.prepend(shell);

 const listEl=shell.querySelector('#pf-list'),stage=shell.querySelector('#pf-stage'),search=shell.querySelector('#pf-search'),statusEl=shell.querySelector('#pf-status');
 const status=t=>statusEl.textContent=t||'';
 function save(){state.selected=selected;write(STORE,state);renderCounts();}
 function renderCounts(){
  shell.querySelector('#pf-project-count').textContent=state.projects.length;
  shell.querySelector('#pf-queue-count').textContent=state.projects.filter(p=>p.queued).length;
 }
 function show(){document.body.classList.add('pw-active');ensureTabbar();render();}
 function projectById(id){return state.projects.find(p=>p.id===id);}
 function versionById(p,id){return (p.versions||[]).find(v=>v.id===id);}
 function nextVersionNumber(p){
  const nums=(p.versions||[]).map(v=>parseInt(String(v.number||'').replace(/\D/g,''),10)).filter(Number.isFinite);
  return 'v'+((nums.length?Math.max.apply(null,nums):0)+1);
 }
 function duplicateVersion(p,v){
  if(p.queued)return;
  if((p.versions||[]).some(x=>x.state==='working')){status('This project already has a working revision.');return;}
  const nv={id:uid(),number:nextVersionNumber(p),title:'Working revision',state:'working',createdAt:now(),parentId:v.id,revision:'',items:(v.items||[]).map(x=>Object.assign({},x,{inherited:true,change:'inherited'}))};
  p.versions.push(nv);save();renderStage();status('Duplicated '+v.number+' into '+nv.number+'. Locked parent remains untouched.');
 }
 function queueRevision(p,v,text){
  v.revision=String(text||'').trim();
  v.queuedAt=now();
  save();renderStage();
  status(v.revision?'Revision request saved. Run it through the Funnel before any project code changes.':'Working revision saved with no request yet.');
 }
 function copyText(s){
  if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(s).then(()=>status('Copied revision request.')).catch(()=>status('Copy failed — select the text manually.'));
  status('Clipboard is unavailable here.');
 }
 function openPage(p){
  if(!p.page){status('This project is an aggregate; expand the version to inspect its parts.');return;}
  window.open(new URL(p.page,location.href).href,'_blank','noopener');
 }

 function renderList(){
  const q=search.value.trim().toLowerCase();
  const rows=state.projects.filter(p=>!q||[p.name,p.description].join(' ').toLowerCase().includes(q));
  listEl.innerHTML=rows.map(p=>
   '<button class="pf-project '+(p.id===selected?'on':'')+'" data-project="'+esc(p.id)+'">'+
   '<span class="pf-project-icon">'+esc(p.icon||'◇')+'</span><span class="pf-project-copy"><strong>'+esc(p.name)+'</strong><small>'+
   (p.queued?'Queued · no snapshot yet':((p.versions||[]).length+' version'+((p.versions||[]).length===1?'':'s')))+'</small></span>'+
   (p.queued?'<span class="pf-q">Queued</span>':'')+'</button>'
  ).join('');
 }
 function itemChip(i){
  const cls=i.inherited?' inherited':(i.change&&i.change!=='baseline'?' changed':'');
  return '<span class="pf-chip'+cls+'" title="'+esc(i.source||'')+'"><span>'+esc(i.label||i.ref)+'</span><small>'+esc(i.sourceVersion||'')+'</small></span>';
 }
 function detailCard(i){
  return '<div class="pf-card"><strong>'+esc(i.label||i.ref)+'</strong><p>'+esc(i.kind||'part')+' · '+esc(i.source||'source unknown')+(i.detail?' · '+esc(i.detail):'')+'</p></div>';
 }
 function versionHtml(p,v){
  const isWorking=v.state==='working';
  const stateLabel=v.state==='locked-import'?'LOCKED IMPORT':(isWorking?'WORKING':'LOCKED');
  const actions=isWorking
   ? '<button class="btn" data-copy-revision="'+esc(v.id)+'">Copy request</button>'
   : '<button class="btn" data-duplicate="'+esc(v.id)+'">Duplicate as new version</button>';
  const ramble=isWorking
   ? '<div class="pf-ramble"><label for="rev-'+esc(v.id)+'">What do you want to change in this version?</label><textarea id="rev-'+esc(v.id)+'" data-revision="'+esc(v.id)+'" placeholder="Ramble here. The locked parent stays untouched.">'+esc(v.revision||'')+'</textarea><div class="pf-ramble-actions"><button class="btn primary" data-save-revision="'+esc(v.id)+'">Save revision request</button>'+(p.id==='funnel'?'<button class="btn" data-open-project="'+esc(p.id)+'">Open actual Funnel</button>':'<button class="btn" data-open-funnel>Open Funnel resolver</button>')+'</div><div class="pf-note">No component parameters are edited here. The revision must resolve through the Funnel before any changed part receives a new version.</div></div>'
   : '';
  return '<article class="pf-version '+(isWorking?'working':'')+'" data-version-card="'+esc(v.id)+'">'+
   '<div class="pf-vhead"><div class="pf-vcopy"><div class="pf-vtitle"><strong>'+esc(p.name)+' · '+esc(v.number)+'</strong><span class="pf-state '+(isWorking?'working':'locked')+'">'+stateLabel+'</span></div><div class="pf-vmeta">'+esc(v.title||'')+' · '+esc(new Date(v.createdAt).toLocaleString())+(v.parentId?' · from '+esc(versionById(p,v.parentId)?.number||'parent'):'')+'</div></div><div class="pf-vactions">'+actions+'</div></div>'+
   '<div class="pf-components">'+(v.items||[]).map(itemChip).join('')+'</div>'+
   '<details class="pf-detail"><summary>Expand version details</summary><div class="pf-detail-grid">'+(v.items||[]).map(detailCard).join('')+'</div></details>'+ramble+'</article>';
 }
 function renderStage(){
  const p=projectById(selected);
  if(!p){stage.innerHTML='<div class="pf-empty"><div><strong>Select a project</strong><span>Choose one from the project bin.</span></div></div>';return;}
  const actions=(p.page?'<button class="btn" data-open-project="'+esc(p.id)+'">Open project</button>':'')+
    '<button class="btn" data-export-project="'+esc(p.id)+'">Export manifest</button>';
  let body='';
  if(p.queued){
   body='<div class="pf-queue"><strong>Queued — intentionally not imported yet.</strong><p>'+esc(p.description)+'</p><p>Nothing from the active Beta has been frozen, duplicated, or modified by this Funnel migration. When you are ready, this queue entry can become the first immutable Beta snapshot.</p></div>';
  }else{
   const versions=(p.versions||[]).slice().reverse();
   body='<div class="pf-line">'+versions.map(v=>versionHtml(p,v)).join('')+'</div>';
  }
  stage.innerHTML='<header class="pf-project-head"><div><h2>'+esc(p.icon||'')+' '+esc(p.name)+'</h2><p>'+esc(p.description)+'</p></div><div class="pf-head-actions">'+actions+'</div></header>'+body;
 }
 function render(){renderCounts();renderList();renderStage();}
 function exportProject(p){
  const payload={schema:'moor.funnel-project',version:1,exportedAt:now(),project:JSON.parse(JSON.stringify(p))};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=u;a.download=p.id+'.funnel-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
 }
 function openFunnel(){
  window.open(new URL('quiz-funnel-v3.html',location.href).href,'_blank','noopener');
 }

 search.addEventListener('input',renderList);
 listEl.addEventListener('click',e=>{
  const b=e.target.closest('[data-project]');if(!b)return;
  selected=b.dataset.project;save();render();
 });
 stage.addEventListener('click',e=>{
  const p=projectById(selected);if(!p)return;
  const dup=e.target.closest('[data-duplicate]');if(dup){const v=versionById(p,dup.dataset.duplicate);if(v)duplicateVersion(p,v);return;}
  const saveBtn=e.target.closest('[data-save-revision]');if(saveBtn){const v=versionById(p,saveBtn.dataset.saveRevision),ta=stage.querySelector('[data-revision="'+CSS.escape(saveBtn.dataset.saveRevision)+'"]');if(v)queueRevision(p,v,ta?.value||'');return;}
  const copyBtn=e.target.closest('[data-copy-revision]');if(copyBtn){const v=versionById(p,copyBtn.dataset.copyRevision);copyText(v?.revision||'');return;}
  const openBtn=e.target.closest('[data-open-project]');if(openBtn){const target=projectById(openBtn.dataset.openProject);if(target)openPage(target);return;}
  if(e.target.closest('[data-open-funnel]')){openFunnel();return;}
  const exp=e.target.closest('[data-export-project]');if(exp){exportProject(p);return;}
 });

 openComponent=function(id){
  if(id==='project-funnel'||id==='funnel'){selected='funnel';save();show();return;}
  if(comp(id)){originalOpen(id);return;}
 };
 binView=function(){
  const legacy=read(LEGACY,[]);
  return originalBin()+(legacy.length?'<section class="bin-sec"><h3>Legacy Canvas projects</h3><p>'+legacy.length+' saved assemblies are preserved in local storage. Funnel does not mutate or delete them.</p></section>':'');
 };
 selectTab=function(id){
  if(id==='workspace'){show();return;}
  document.body.classList.remove('pw-active');
  originalTab(id);
 };
 ensureTabbar=function(){
  originalBar();
  const bar=document.getElementById('tabbar');if(!bar)return;
  let b=bar.querySelector('[data-tab="workspace"]');
  if(!b){b=document.createElement('button');b.dataset.tab='workspace';bar.appendChild(b);}
  b.innerHTML='<span class="tb-ic" aria-hidden="true">🌀</span><span>Funnel</span>';
  if(document.body.classList.contains('pw-active')){
   bar.style.display='';
   bar.querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x.dataset.tab==='workspace');x.setAttribute('aria-current',x.dataset.tab==='workspace'?'page':'false');});
  }
 };

 render();
 ensureTabbar();

 const pending=params.get('component')||(typeof UI!=='undefined'?UI.focus:null);
 if(pending&&comp(pending)){originalOpen(pending);}
 window.PulseFunnel={show:show,get state(){return state},selectProject:id=>{if(projectById(id)){selected=id;save();show();}},queueBeta:()=>{selected='moor-beta';save();show();},duplicate:(projectId,versionId)=>{const p=projectById(projectId),v=p&&versionById(p,versionId);if(p&&v)duplicateVersion(p,v);}};
}
})();