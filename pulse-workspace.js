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
'.pf-top{display:flex;align-items:center;gap:8px;padding:1px 2px 3px;min-height:32px}',
'.pf-top-copy{flex:1;min-width:0}.pf-top h2{font-size:1rem;letter-spacing:.01em}.pf-top p{display:none}',
'.pf-top .pill{display:none}',
'.pf-layout{display:grid;grid-template-columns:178px minmax(0,1fr);gap:8px;flex:1;min-height:0}',
'.pf-bin,.pf-stage{border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(10,11,20,.72);min-height:0}',
'.pf-bin{display:flex;flex-direction:column;padding:7px;overflow:hidden}',
'.pf-bin input{width:100%;height:30px;padding:5px 9px;border:1px solid rgba(255,255,255,.08);border-radius:9px;background:rgba(255,255,255,.035);color:var(--text);font:inherit;font-size:11px}',
'.pf-list{overflow:auto;min-height:0;margin-top:4px;padding-right:1px}',
'.pf-project{width:100%;display:flex;align-items:center;gap:8px;text-align:left;border:1px solid transparent;background:transparent;color:var(--text);padding:7px 8px;border-radius:9px;margin:1px 0}',
'.pf-project:hover{background:#ffffff08;border-color:var(--line)}.pf-project.on{background:#7fd4ff12;border-color:#7fd4ff55}',
'.pf-project-icon{font-size:14px;width:18px;text-align:center;opacity:.9}.pf-project-copy{flex:1;min-width:0}.pf-project-copy strong{display:block;font-size:11px;font-weight:550;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pf-project-copy small{display:none}',
'.pf-q{width:6px;height:6px;padding:0;border:0;border-radius:50%;background:var(--amber);font-size:0;box-shadow:0 0 9px #f4cb7755}',
'.pf-stage{overflow:auto;padding:12px 14px 28px;background:radial-gradient(circle at 78% 0,rgba(89,52,120,.10),transparent 32%),linear-gradient(180deg,rgba(10,8,17,.92),rgba(7,7,12,.96))}',
'.pf-empty{display:grid;place-items:center;min-height:50%;color:var(--muted);text-align:center}.pf-empty strong{display:block;color:var(--text);font-size:18px;margin-bottom:6px}',
'.pf-project-head{display:flex;align-items:center;gap:8px;margin-bottom:12px;min-height:34px}.pf-project-head>div:first-child{flex:1;min-width:0}.pf-project-head h2{font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pf-project-head p{display:none}.pf-head-actions{display:flex;gap:5px;align-items:center;flex-wrap:nowrap}.pf-head-actions .btn{width:30px;height:30px;min-height:30px;padding:0;border-radius:9px;font-size:0}.pf-head-actions .btn:before{font-size:13px}.pf-head-actions .btn[data-open-project]:before{content:"↗"}.pf-head-actions .btn[data-export-project]:before{content:"⇩"}',
'.pf-layout-toggle{display:inline-flex;padding:2px;border:1px solid rgba(255,255,255,.10);border-radius:9px;background:rgba(255,255,255,.03)}.pf-layout-toggle button{width:28px;height:26px;border:0;background:transparent;color:var(--muted);font:inherit;font-size:0;padding:0;border-radius:7px;cursor:pointer}.pf-layout-toggle button[data-layout="vertical"]:before{content:"↕";font-size:13px}.pf-layout-toggle button[data-layout="horizontal"]:before{content:"↔";font-size:13px}.pf-layout-toggle button.on{color:#0b0d12;background:linear-gradient(180deg,#fff,#e9e9ee);box-shadow:0 3px 10px #0004}',
'.pf-queue{border:1px solid #806b3b;background:#2d26142e;border-radius:14px;padding:16px}.pf-queue strong{color:var(--amber)}.pf-queue p{margin-top:6px;color:var(--muted);font-size:.86rem}',
'.pf-line{position:relative}.pf-line.mode-vertical{display:flex;flex-direction:column;align-items:flex-start;gap:20px}.pf-line.mode-horizontal{display:flex;align-items:flex-start;gap:22px;min-width:max-content;padding:4px 10px 14px 4px;overflow:visible}',
'.pf-version{position:relative;display:flex;gap:10px;align-items:flex-start;background:transparent;border:0;padding:0;margin:0;box-shadow:none;overflow:visible}.pf-line.mode-vertical .pf-version{display:block;width:min(360px,100%)}.pf-line.mode-horizontal .pf-version{display:flex;flex-direction:row;min-width:max-content}.pf-version.working{filter:none}',
'.pf-vhead{display:contents}.pf-vcopy{display:none}.pf-state,.pf-vmeta,.pf-summary{display:none}.pf-vactions{display:flex;gap:4px}.pf-vactions .btn{width:28px;height:28px;min-height:28px;padding:0;border-radius:8px;font-size:0}.pf-vactions .btn[data-duplicate]:before{content:"+";font-size:17px}.pf-vactions .btn[data-copy-revision]:before{content:"⧉";font-size:13px}',
'.pf-version-marker{position:relative;z-index:2;display:flex;align-items:center;justify-content:center;flex-direction:column;width:64px;min-width:64px;height:64px;border:1px solid rgba(255,255,255,.72);border-radius:17px;background:linear-gradient(160deg,#fff,#e8e9ee);color:#15161a;box-shadow:0 10px 24px #0005,inset 0 1px #fff}.pf-version-marker strong{font-size:15px;line-height:1}.pf-version-marker small{margin-top:5px;font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:#747983}.pf-version.working .pf-version-marker{box-shadow:0 10px 24px #0005,0 0 24px rgba(244,203,119,.15)}.pf-line.mode-vertical .pf-version-marker{margin-bottom:9px}.pf-line.mode-horizontal .pf-version-marker{margin-top:4px}',
'.pf-version-body{display:flex;flex-direction:column;gap:5px}.pf-version-tools{display:flex;gap:4px;align-items:center;margin-top:2px}.pf-line.mode-vertical .pf-version-body{margin-left:0}.pf-line.mode-horizontal .pf-version-body{min-width:0}.pf-line.mode-vertical .pf-version-tools{width:220px;justify-content:flex-end}.pf-line.mode-horizontal .pf-version-tools{justify-content:flex-start}',
'.pf-components{display:flex;gap:8px}.pf-line.mode-vertical .pf-components{flex-direction:column;width:220px}.pf-line.mode-horizontal .pf-components{flex-direction:row;align-items:flex-start}',
'.pf-tile{position:relative;width:150px;min-width:150px;height:86px;padding:12px 11px 10px;border:1px solid rgba(255,255,255,.72);border-radius:17px;background:linear-gradient(160deg,rgba(255,255,255,.98),rgba(237,238,243,.94));color:#16171b;box-shadow:0 10px 24px #0005,inset 0 1px rgba(255,255,255,1);overflow:hidden;isolation:isolate}.pf-line.mode-vertical .pf-tile{width:220px;min-width:220px}.pf-tile:before{content:"";position:absolute;inset:0;background:linear-gradient(125deg,rgba(255,255,255,.72),rgba(255,255,255,.14) 38%,rgba(255,255,255,0) 62%);border-radius:inherit;pointer-events:none;z-index:-1}.pf-tile:after{content:"";position:absolute;inset:1px;border-radius:16px;border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 0 24px rgba(255,255,255,.18);pointer-events:none}.pf-tile strong{display:block;font-size:11px;line-height:1.25;letter-spacing:-.01em}.pf-tile small{display:block;margin-top:7px;font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:#656a72}.pf-tile .pf-kind{position:absolute;right:9px;bottom:8px;font-size:8px;color:#7b8088;opacity:.72}.pf-tile.inherited{opacity:.25;filter:saturate(.4);box-shadow:0 5px 16px #0003}.pf-tile.changed{opacity:1;box-shadow:0 12px 30px #0007,0 0 0 1px rgba(110,255,170,.30),0 0 22px rgba(77,255,145,.16)}.pf-tile.new{opacity:1;box-shadow:0 12px 30px #0007,0 0 0 1px rgba(110,255,170,.46),0 0 28px rgba(77,255,145,.24)}.pf-tile.removed{opacity:.16;background:transparent;color:#e8e8ed;border:1px dashed rgba(255,255,255,.28);box-shadow:none}.pf-tile.removed:before,.pf-tile.removed:after{display:none}.pf-tile.blocked{box-shadow:0 10px 24px #0005,0 0 0 1px rgba(244,203,119,.32)}',
'.pf-detail{margin:6px 0 0}.pf-detail summary{font-size:0;color:var(--muted);width:28px;height:28px;border:1px solid rgba(255,255,255,.08);border-radius:8px;display:flex;align-items:center;justify-content:center;list-style:none;cursor:pointer}.pf-detail summary:before{content:"···";font-size:13px;letter-spacing:1px}.pf-detail summary::-webkit-details-marker{display:none}.pf-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:7px;margin-top:7px;max-width:720px}.pf-card{border:1px solid #30394f;border-radius:9px;padding:9px;background:#0d1220}.pf-card strong{display:block;font-size:11px}.pf-card p{font-size:10px;color:var(--muted);margin-top:3px;line-height:1.4}',
'.pf-ramble{margin-top:8px;width:min(520px,78vw)}.pf-ramble label{display:none}.pf-ramble textarea{width:100%;min-height:64px;resize:vertical;padding:9px;font-size:12px}.pf-ramble .pf-note{display:none}.pf-ramble-actions{display:flex;gap:5px;margin-top:5px}.pf-ramble-actions .btn{min-height:30px;padding:5px 8px;font-size:11px}',
'.pf-status{font-size:11px;color:var(--muted);padding:0 4px;min-height:16px}',
'@media(max-width:900px){.pf-layout{grid-template-columns:150px minmax(0,1fr)}}',
'@media(max-width:760px){body.pw-active #main{padding:5px!important}.pf-top{display:none}.pf-layout{display:block;overflow:auto}.pf-bin{max-height:118px;margin-bottom:5px;padding:5px}.pf-bin input{height:26px}.pf-list{display:flex;gap:3px;overflow-x:auto;overflow-y:hidden}.pf-project{width:auto;min-width:max-content;padding:6px 8px}.pf-project-copy strong{font-size:10px}.pf-project-icon{display:none}.pf-stage{overflow:visible;padding:10px}.pf-project-head{margin-bottom:8px}.pf-project-head h2{font-size:.92rem}.pf-head-actions{margin-left:auto}.pf-line.mode-horizontal{overflow-x:auto;padding-bottom:10px}.pf-line.mode-vertical .pf-version{width:100%}.pf-line.mode-vertical .pf-components{width:100%;align-items:flex-start}.pf-line.mode-vertical .pf-tile{width:min(220px,72vw);min-width:min(220px,72vw)}.pf-line.mode-horizontal .pf-components{overflow:visible}.pf-tile{flex:0 0 140px}.pf-ramble{width:100%}}'
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
 const LAYOUT_KEY='moor-pulse-funnel-layout-mode';
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
   seedProject('moor-whole-blueprint','MOOR Whole Blueprint','◇','The whole-product blueprint: audited offer, 645 cards, dependency order, editable connections, reference previews and complete context export.',[pageItem('moor-whole-blueprint','MOOR Whole Blueprint','moor-blueprint.html','Audited baseline and editable versions.'),pageItem('moor-whole-blueprint-data','Complete graph data','blueprint/moor-blueprint-data.json','Source ledger, specifications and build dependencies.')],'moor-blueprint.html',false),
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
 let layoutMode=read(LAYOUT_KEY,'vertical');
 if(!['vertical','horizontal'].includes(layoutMode))layoutMode='vertical';

 const shell=document.createElement('section');
 shell.className='pf-shell';
 shell.setAttribute('aria-label','Funnel project versions');
 shell.innerHTML=
  '<div class="pf-top"><div class="pf-top-copy"><h2>Funnel</h2></div></div>'+
  '<div class="pf-layout"><aside class="pf-bin"><input id="pf-search" type="search" placeholder="Search projects…" aria-label="Search Funnel projects"><div id="pf-list" class="pf-list"></div></aside><section id="pf-stage" class="pf-stage"></section></div>'+
  '<div id="pf-status" class="pf-status" role="status"></div>';
 main.prepend(shell);

 const listEl=shell.querySelector('#pf-list'),stage=shell.querySelector('#pf-stage'),search=shell.querySelector('#pf-search'),statusEl=shell.querySelector('#pf-status');
 const status=t=>statusEl.textContent=t||'';
 function save(){state.selected=selected;write(STORE,state);write(LAYOUT_KEY,layoutMode);renderCounts();if(window.PulseReferences)setTimeout(()=>{try{PulseReferences.sync();}catch(e){}},0);}
 function setLayout(mode){if(!['vertical','horizontal'].includes(mode))return;layoutMode=mode;write(LAYOUT_KEY,layoutMode);renderStage();status(mode==='horizontal'?'Horizontal lineage · oldest left, newest right.':'Vertical lineage · newest top, oldest bottom.');}
 function renderCounts(){}
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
   '<span class="pf-project-icon">'+esc(p.icon||'◇')+'</span><span class="pf-project-copy"><strong>'+esc(p.name)+'</strong></span>'+
   (p.queued?'<span class="pf-q">Queued</span>':'')+'</button>'
  ).join('');
 }
 function itemState(i){
  if(i.change==='removed')return 'removed';
  if(i.change==='new'||i.change==='added')return 'new';
  if(i.change==='blocked')return 'blocked';
  if(i.inherited||i.change==='inherited')return 'inherited';
  if(i.change&&i.change!=='baseline')return 'changed';
  return 'baseline';
 }
 function itemTile(i){
  const st=itemState(i);
  const cls=st==='baseline'?'':(' '+st);
  const stateText=st==='baseline'?'present':st;
  return '<div class="pf-tile'+cls+'" title="'+esc(i.source||'')+'"><strong>'+esc(i.label||i.ref)+'</strong><small>'+esc(i.sourceVersion||'current')+' · '+esc(stateText)+'</small><span class="pf-kind">'+esc(i.kind||'part')+'</span></div>';
 }
 function versionSummary(v){
  const counts={changed:0,inherited:0,new:0,removed:0,blocked:0,present:0};
  (v.items||[]).forEach(i=>{const st=itemState(i);if(st==='baseline')counts.present++;else if(counts[st]!==undefined)counts[st]++;});
  const bits=[];
  if(counts.changed)bits.push('<span>'+counts.changed+' changed</span>');
  if(counts.new)bits.push('<span>'+counts.new+' new</span>');
  if(counts.inherited)bits.push('<span>'+counts.inherited+' inherited</span>');
  if(counts.removed)bits.push('<span>'+counts.removed+' removed</span>');
  if(counts.blocked)bits.push('<span>'+counts.blocked+' blocked</span>');
  if(counts.present&&!bits.length)bits.push('<span>'+counts.present+' present</span>');
  return bits.join('');
 }
 function detailCard(i){
  return '<div class="pf-card"><strong>'+esc(i.label||i.ref)+'</strong><p>'+esc(i.kind||'part')+' · '+esc(i.source||'source unknown')+(i.detail?' · '+esc(i.detail):'')+'</p></div>';
 }
 function versionHtml(p,v){
  const isWorking=v.state==='working';
  const actions=isWorking
   ? '<button class="btn" data-copy-revision="'+esc(v.id)+'" title="Copy request">Copy request</button>'
   : '<button class="btn" data-duplicate="'+esc(v.id)+'" title="Duplicate as new version">Duplicate as new version</button>';
  const marker='<div class="pf-version-marker"><strong>'+esc(v.number.toUpperCase())+'</strong><small>'+esc(p.name)+'</small></div>';
  const ramble=isWorking
   ? '<div class="pf-ramble"><textarea aria-label="Revision request" id="rev-'+esc(v.id)+'" data-revision="'+esc(v.id)+'" placeholder="What changes?">'+esc(v.revision||'')+'</textarea><div class="pf-ramble-actions"><button class="btn primary" data-save-revision="'+esc(v.id)+'">Save</button>'+(p.id==='funnel'?'<button class="btn" data-open-project="'+esc(p.id)+'">Open Funnel</button>':'<button class="btn" data-open-funnel>Resolve</button>')+'</div></div>'
   : '';
  return '<article class="pf-version '+(isWorking?'working':'')+'" data-version-card="'+esc(v.id)+'">'+
   marker+
   '<div class="pf-version-body"><div class="pf-components">'+(v.items||[]).map(itemTile).join('')+'</div>'+
   '<div class="pf-version-tools"><div class="pf-vactions">'+actions+'</div><details class="pf-detail"><summary>Details</summary><div class="pf-detail-grid">'+(v.items||[]).map(detailCard).join('')+'</div></details></div>'+ramble+'</div></article>';
 }
 function renderStage(){
  const p=projectById(selected);
  if(!p){stage.innerHTML='<div class="pf-empty"><div><strong>Select a project</strong><span>Choose one from the project bin.</span></div></div>';return;}
  const toggle='<div class="pf-layout-toggle" role="group" aria-label="Version layout"><button data-layout="vertical" class="'+(layoutMode==='vertical'?'on':'')+'">Vertical</button><button data-layout="horizontal" class="'+(layoutMode==='horizontal'?'on':'')+'">Horizontal</button></div>';
  const actions=toggle+(p.page?'<button class="btn" data-open-project="'+esc(p.id)+'" title="Open project" aria-label="Open project">Open project</button>':'')+
    '<button class="btn" data-export-project="'+esc(p.id)+'" title="Export manifest" aria-label="Export manifest">Export manifest</button>';
  let body='';
  if(p.queued){
   body='<div class="pf-queue"><strong>Queued</strong><p>Not frozen yet. Beta stays untouched until you import its first locked version.</p></div>';
  }else{
   const versions=(p.versions||[]).slice();
   if(layoutMode==='vertical')versions.reverse();
   body='<div class="pf-line mode-'+layoutMode+'">'+versions.map(v=>versionHtml(p,v)).join('')+'</div>';
  }
  stage.innerHTML='<header class="pf-project-head"><div><h2>'+esc(p.name)+'</h2></div><div class="pf-head-actions">'+actions+'</div></header>'+body;
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
  const layout=e.target.closest('[data-layout]');if(layout){setLayout(layout.dataset.layout);return;}
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