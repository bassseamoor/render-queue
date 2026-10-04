/* Pulse component workspaces. Tool runtimes are isolated so duplicate instances do not share DOM IDs. */
(function(){
'use strict';
const params=new URLSearchParams(location.search), child=params.get('workspace-tool');
const css=document.createElement('style');css.id='pulse-workspace-style';
css.textContent=`
/* Desktop shell: retired category nav must never determine stage placement. */
.tabs-on #main{min-height:0}
.tabs-on #windows:empty{display:none}
@media(min-width:761px){
  body.tabs-on{height:100dvh;overflow:hidden}
  body.tabs-on>header{position:fixed;inset:0 0 auto;height:66px;transform:none!important}
  body.tabs-on #app,
  body.tabs-on.chrome-hidden #app,
  body.tabs-on #app.independent-focus{
    margin-top:66px;height:calc(100dvh - 66px);
    display:grid;grid-template-columns:210px minmax(0,1fr)!important;
    grid-template-rows:minmax(0,1fr);gap:14px;padding:14px;
    transition:none;
  }
  body.tabs-on #main{
    grid-column:2;grid-row:1;width:100%;height:100%;min-width:0;
    padding:24px;overflow:auto;overscroll-behavior:contain;scrollbar-gutter:stable;
    backdrop-filter:none;-webkit-backdrop-filter:none;
    background:rgba(12,14,28,.88)!important;
  }
  body.tabs-on #tabbar{
    display:flex!important;position:fixed;left:14px;top:80px;bottom:14px;
    right:auto;width:210px;flex-direction:column;justify-content:flex-start;
    align-items:stretch;gap:8px;padding:14px 10px;
    border:1px solid var(--line);border-radius:18px;background:rgba(20,15,36,.94);
  }
  body.tabs-on #tabbar button{
    flex:0 0 auto;max-width:none;min-height:52px;flex-direction:row;
    justify-content:flex-start;gap:14px;padding:12px 16px;
    font-size:.95rem;letter-spacing:0;text-align:left;
  }
  body.tabs-on #tabbar button.on{background:rgba(127,212,255,.12);box-shadow:inset 3px 0 var(--cyan)}
  body.tabs-on #tabbar button:hover{background:rgba(255,255,255,.07)}
  body.tabs-on #tabview{padding:0 0 24px}
  body.tabs-on #tabview.focus-mode{padding:0}
  body.tabs-on #chrome-pull{display:none}
  body.tabs-on #bin-results .trows{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,310px),1fr));gap:10px}
  body.tabs-on .trow{min-height:76px;align-items:flex-start}
  body.tabs-on .trow-ic{padding-top:4px}
  body.tabs-on .trow-tx strong{font-size:.95rem;line-height:1.4}
  body.tabs-on .trow-tx span{font-size:.875rem;line-height:1.45;white-space:normal;overflow-wrap:anywhere}
  body.tabs-on .bin-sec>p{font-size:.875rem}
  body.tabs-on .focus-nav{position:sticky;top:-24px;z-index:4;padding:4px 0 8px;background:#0c0e1c}
  body.tabs-on .tool-host.bare{padding:0!important;border:0!important;box-shadow:none!important;background:transparent!important;backdrop-filter:none;-webkit-backdrop-filter:none}
  body.tabs-on .focus-about{max-width:none}
  body.tabs-on .vault-grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
  body.tabs-on .app:not(.activity-hidden) aside.activity{top:80px;right:14px;bottom:14px;width:min(380px,calc(100vw - 28px))}
}
@media(min-width:761px) and (max-width:1000px){
  body.tabs-on #app, body.tabs-on.chrome-hidden #app, body.tabs-on #app.independent-focus{grid-template-columns:160px minmax(0,1fr)!important;gap:10px;padding:10px}
  body.tabs-on #tabbar{left:10px;top:76px;bottom:10px;width:160px}
  body.tabs-on #tabbar button{padding:12px 10px;gap:10px}
  body.tabs-on #main{padding:18px}
}


body.pw-child{overflow:hidden!important;height:100dvh!important}
body.pw-child>header,body.pw-child #tabbar,body.pw-child #chrome-pull,body.pw-child #activity,body.pw-child .focus-nav,body.pw-child .focus-about{display:none!important}
body.pw-child #app,body.pw-child #app.independent-focus,body.pw-child.chrome-hidden #app{display:block!important;margin:0!important;padding:0!important;height:100dvh!important}
body.pw-child #main{display:block!important;width:100%!important;height:100%!important;padding:0!important;border:0!important;border-radius:0!important;overflow:auto!important}
body.pw-child #tabview,body.pw-child .tool-host{padding:0!important;margin:0!important;width:100%!important}
body.pw-child #tabview>.tool-host{border:0!important;border-radius:0!important;box-shadow:none!important}
body.pw-child .tool-host>iframe{height:100dvh!important;min-height:0!important;border-radius:0!important}
.pw-shell{display:none;height:100%;min-height:0;flex-direction:column;gap:10px}
body.pw-active #main{padding:12px!important;overflow:hidden!important}
body.pw-active #main>.pw-shell{display:flex}
body.pw-active #main>#tabview,body.pw-active #main>#windows{display:none!important}
.pw-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:none;position:relative;z-index:5}
.pw-name{flex:1;min-width:120px;color:var(--text);font:inherit;font-weight:600;font-size:16px;line-height:1.4;background:transparent;border:1px solid var(--line);padding:9px 12px;border-radius:10px}
.pw-toolbar .btn{font-size:14px;min-height:40px;padding:8px 12px}
.pw-area{display:flex;flex:1;min-height:0;gap:10px}
.pw-bin{flex:0 0 260px;min-width:0;display:flex;flex-direction:column;gap:10px;padding:12px;background:#121324;border:1px solid var(--line);border-radius:12px;overflow:hidden}
.pw-bin[hidden]{display:none}.pw-bin input{width:100%;min-width:0;padding:10px;font:inherit;font-size:14px;background:#090e1b;color:var(--text);border:1px solid var(--line);border-radius:9px}
.pw-list{overflow:auto;flex:1;min-height:0;scrollbar-gutter:stable}
.pw-bin-group{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin:14px 4px 8px}
.pw-part{display:flex;align-items:center;gap:9px;width:100%;padding:11px 9px;margin-bottom:6px;border:1px solid var(--line);border-radius:9px;background:#1a1b2d;text-align:left;font:inherit;color:var(--text);cursor:grab}
.pw-part:hover{border-color:var(--cyan)}.pw-part strong{font-size:14px;line-height:1.35;font-weight:500}.pw-part small{display:block;font-size:12px;margin-top:3px}.pw-part .pw-part-text{flex:1;min-width:0}.pw-part .pw-grip{color:var(--muted);font-size:16px}
.pw-viewport{flex:1;min-width:0;min-height:0;overflow:auto;position:relative;border:1px solid var(--line);border-radius:12px;background:#090c16;overscroll-behavior:contain}
.pw-board{position:relative;width:1800px;height:1200px;min-width:100%;min-height:100%;background-image:radial-gradient(#a2aace25 1px,transparent 1px);background-size:24px 24px}
.pw-empty{position:absolute;left:28px;top:26px;max-width:380px;color:var(--muted);font-size:14px;line-height:1.6;pointer-events:none}.pw-empty strong{display:block;color:var(--text);font-size:18px;margin-bottom:7px}
.pw-window{position:absolute;display:flex;flex-direction:column;min-width:300px;min-height:240px;border:1px solid #777294;border-radius:12px;background:#111422;box-shadow:0 16px 36px #0005;overflow:hidden}
.pw-window.is-selected{border-color:var(--cyan);box-shadow:0 0 0 1px #7fd4ff55,0 16px 36px #0005}
.pw-window.drop-target{outline:3px solid var(--cyan);outline-offset:3px}
.pw-window-head{display:flex;align-items:center;gap:8px;padding:7px 9px;min-height:44px;flex:none;background:#252139;border-bottom:1px solid var(--line);cursor:move;touch-action:none;user-select:none}
.pw-window-title{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px;font-weight:600}
.pw-window-head button{height:30px;min-width:30px;border:1px solid var(--line);border-radius:7px;background:#ffffff08;color:var(--text);cursor:pointer;font-size:16px}
.pw-window-head button:hover{background:#ffffff18}.pw-window-body{flex:1;min-height:0;position:relative;overflow:hidden}
.pw-window-body>iframe{width:100%;height:100%;border:0;display:block;background:#0b101b}
.pw-resize{position:absolute;bottom:0;right:0;width:24px;height:24px;z-index:10;border:0!important;background:linear-gradient(135deg,transparent 48%,#7fd4ff88 49%,#7fd4ff88 55%,transparent 56%,transparent 65%,#7fd4ff 66%,#7fd4ff 72%,transparent 73%)!important;cursor:nwse-resize;touch-action:none}
.pw-project-body{display:flex;flex-direction:column;height:100%;min-height:0}
.pw-project-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:9px 12px;background:#101523;border-bottom:1px solid var(--line);font-size:13px;flex:none}
.pw-project-bar span{flex:1;color:var(--muted)}.pw-project-bar .btn{min-height:32px;font-size:13px;padding:5px 9px}
.pw-project-viewport{flex:1;overflow:auto;min-height:0;position:relative}.pw-project-board{position:relative;min-width:100%;min-height:100%;width:1600px;height:1000px;background-image:radial-gradient(#a2aace20 1px,transparent 1px);background-size:24px 24px}
body.pw-dragging iframe,body.pw-part-drag iframe{pointer-events:none!important}body.pw-dragging{user-select:none!important}
.pw-status{font-size:12px;color:var(--muted);flex:none;padding:0 3px;min-height:18px}
.pw-dialog{width:min(640px,92vw);max-height:88dvh;overflow:auto;background:#121525;color:var(--text);border:1px solid #615777;border-radius:16px;padding:22px;box-shadow:0 30px 100px #000a}.pw-dialog::backdrop{background:#0009}
.pw-dialog h2{margin-bottom:12px}.pw-dialog label{display:block;font-size:14px;margin:14px 0 6px;color:var(--muted)}.pw-dialog input,.pw-dialog textarea{width:100%;font:inherit;padding:10px}.pw-dialog textarea{min-height:130px;font-size:14px}.pw-dialog-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.pw-saved{display:flex;gap:8px;margin:10px 0;align-items:center}.pw-saved .btn:first-child{flex:1;justify-content:flex-start;text-align:left}.pw-dialog p{font-size:14px;line-height:1.55;color:var(--muted)}
@media(max-width:1000px){.pw-bin{flex-basis:210px}.pw-toolbar .btn{padding:7px 9px}.pw-toolbar{gap:6px}}
@media(max-width:760px){body.pw-active #main{padding:6px!important}body.pw-active .pw-shell{padding-bottom:78px}.pw-bin{position:absolute;left:6px;top:100px;bottom:84px;width:min(280px,82vw);z-index:50;box-shadow:20px 0 50px #0008}.pw-window{min-width:280px}.pw-toolbar .pw-name{flex-basis:100%}.pw-toolbar .btn{font-size:13px;min-height:36px}.pw-status{font-size:11px}.pw-board{width:1500px}.pw-dialog{padding:16px}}
`;document.head.appendChild(css);
if(child)document.body.classList.add('pw-child');
setTimeout(init,0);
function init(){
 if(typeof COMPS==='undefined'||typeof openComponent!=='function')return;
 if(child){
  if(typeof unmountFocus==='function')unmountFocus();
  UI.focus=null;UI.open=[];persist=function(){};
  const c=COMPS.find(c=>c.id===child);
  if(c){openComponent(child);document.title=c.label+' · Pulse panel';}
  else document.querySelector('#tabview').textContent='This component is unavailable: '+child;
  return;
 }
 const pendingComponent=params.get('component')||UI.focus;
 const KEY='moor-pulse-component-projects-v1',DRAFT='moor-pulse-workspace-v1';
 document.getElementById('app').classList.add('activity-hidden');
 document.getElementById('activity').style.display='none';
 document.getElementById('activity-toggle').setAttribute('aria-expanded','false');
 const main=document.getElementById('main');let z=10,selected=null,manifest=null;
 const originalOpen=openComponent,originalTab=selectTab,originalBar=ensureTabbar,originalBin=binView;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const uid=()=>crypto.randomUUID?crypto.randomUUID():'pw-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
 let workspace={id:uid(),name:'Untitled component project',intent:'',nodes:[],connections:[]};
 const shell=document.createElement('section');shell.className='pw-shell';shell.setAttribute('aria-label','Component workspace');
 shell.innerHTML='<div class="pw-toolbar"><button class="btn" data-pw="bin">Bin</button><input class="pw-name" aria-label="Component project name" value="Untitled component project"><button class="btn" data-pw="project">New project</button><button class="btn" data-pw="save">Save</button><button class="btn" data-pw="saved">Projects</button><button class="btn" data-pw="handoff">Chat handoff</button><button class="btn" data-pw="import">Import</button></div><div class="pw-area"><aside class="pw-bin" aria-label="Parts bin"><input type="search" placeholder="Search parts…" aria-label="Search workspace parts"><div class="pw-list"></div></aside><div class="pw-viewport"><div class="pw-board" aria-label="Workspace canvas"></div></div></div><div class="pw-status" role="status">Open parts or drag them onto the canvas. Drop onto a tool to create a project.</div>';
 main.prepend(shell);const board=shell.querySelector('.pw-board'),viewport=shell.querySelector('.pw-viewport'),bin=shell.querySelector('.pw-bin'),name=shell.querySelector('.pw-name');
 const dialog=document.createElement('dialog');dialog.className='pw-dialog';document.body.append(dialog);
 const status=t=>{shell.querySelector('.pw-status').textContent=t;};
 function persistDraft(){workspace.name=name.value.trim()||'Untitled component project';try{localStorage.setItem(DRAFT,JSON.stringify(workspace))}catch(e){status('Storage is full. Export this project to keep it.')}}
 function comp(id){return COMPS.find(c=>c.id===id)}
 function clone(n){const c=JSON.parse(JSON.stringify(n));function ids(x){x.instanceId=uid();if(x.nodes)x.nodes.forEach(ids)}ids(c);return c}
 function tool(id,x,y){return {instanceId:uid(),kind:'component',componentId:id,title:comp(id)?.label||id,layout:{x:x??30,y:y??30,width:640,height:470}}}
 function project(nodes,x,y){return {instanceId:uid(),kind:'component-project',title:'New component project',intent:'',connections:[],nodes:nodes||[],layout:{x:x??40,y:y??40,width:960,height:650}}}
 function show(){document.body.classList.add('pw-active');ensureTabbar();}
 function renderBin(){
  const q=bin.querySelector('input').value.toLowerCase();
  const cs=COMPS.filter(c=>!q||[c.label,c.short,c.id].join(' ').toLowerCase().includes(q));
  const saved=read(KEY,[]).filter(p=>!q||p.name.toLowerCase().includes(q));
  shell.querySelector('.pw-list').innerHTML=(saved.length?'<div class="pw-bin-group">Component projects</div>'+saved.map(p=>'<button class="pw-part" draggable="true" data-project-id="'+esc(p.id)+'"><span>▧</span><span class="pw-part-text"><strong>'+esc(p.name)+'</strong><small>'+p.nodes.length+' parts · wiring draft</small></span><span class="pw-grip">⠿</span></button>').join(''):'')+'<div class="pw-bin-group">Parts · '+cs.length+'</div>'+cs.map(c=>'<button class="pw-part" draggable="true" data-component-id="'+esc(c.id)+'"><span>'+esc(c.icon||'◇')+'</span><span class="pw-part-text"><strong>'+esc(c.label)+'</strong></span><span class="pw-grip">⠿</span></button>').join('');
 }
 bin.querySelector('input').addEventListener('input',renderBin);
 function savedNode(id){const p=read(KEY,[]).find(p=>p.id===id);if(!p)return null;const n=project(p.nodes.map(clone),40,40);n.title=p.name;n.intent=p.intent;n.connections=p.connections||[];return n}
 function payload(e){try{return JSON.parse(e.dataTransfer.getData('application/x-pulse-component'))}catch(_){return null}}
 bin.addEventListener('dragstart',e=>{const part=e.target.closest('.pw-part');if(!part)return;e.dataTransfer.setData('application/x-pulse-component',JSON.stringify(part.dataset.projectId?{projectId:part.dataset.projectId}:{componentId:part.dataset.componentId}));e.dataTransfer.effectAllowed='copy';document.body.classList.add('pw-part-drag');});
 bin.addEventListener('click',e=>{const p=e.target.closest('.pw-part');if(!p)return;if(p.dataset.componentId)addTool(p.dataset.componentId);else{const n=savedNode(p.dataset.projectId);if(n)add(n)}if(innerWidth<=760)bin.hidden=true});
 function add(n,container=workspace,targetBoard=board){if(container===workspace){n.layout.width=Math.min(n.layout.width,Math.max(280,viewport.clientWidth-48));n.layout.height=Math.min(n.layout.height,Math.max(240,viewport.clientHeight-48));}container.nodes.push(n);mount(n,container,targetBoard);sizeBoard(targetBoard,container);persistDraft();return n}
 function addTool(id){if(!comp(id))return;show();const offset=(workspace.nodes.length%6)*28;const n=tool(id,viewport.scrollLeft+24+offset,viewport.scrollTop+24+offset);add(n);if(innerWidth<=760)bin.hidden=true;status('Opened '+n.title+'. Drag its title bar or resize its bottom-right corner.');return n}
 function sizeBoard(b,c){const right=Math.max(b.parentElement.clientWidth,...c.nodes.map(n=>n.layout.x+n.layout.width+100));const bottom=Math.max(b.parentElement.clientHeight,...c.nodes.map(n=>n.layout.y+n.layout.height+100));b.style.width=right+'px';b.style.height=bottom+'px'}
 function activate(el){if(selected)selected.classList.remove('is-selected');selected=el;el.classList.add('is-selected');el.style.zIndex=++z}
 function mount(n,container,b){
  const el=document.createElement('article');el.className='pw-window';el.dataset.instanceId=n.instanceId;el.setAttribute('aria-label',n.title);el.style.cssText='left:'+n.layout.x+'px;top:'+n.layout.y+'px;width:'+n.layout.width+'px;height:'+n.layout.height+'px;z-index:'+(++z);
  el.innerHTML='<div class="pw-window-head"><span aria-hidden="true">'+(n.kind==='component-project'?'▧':'◇')+'</span><span class="pw-window-title">'+esc(n.title)+'</span>'+(n.kind==='component-project'?'<button data-win="rename" aria-label="Rename project" title="Rename project">✎</button>':'')+'<button data-win="maximize" aria-label="Fit panel to canvas" title="Fit to canvas">□</button><button data-win="close" aria-label="Close panel" title="Close panel">×</button></div><div class="pw-window-body"></div><button class="pw-resize" aria-label="Resize '+esc(n.title)+'" title="Drag to resize"></button>';
  b.append(el);const body=el.querySelector('.pw-window-body');
  if(n.kind==='component-project'){
   body.innerHTML='<div class="pw-project-body"><div class="pw-project-bar"><span>Assembly draft · '+n.nodes.length+' parts · not connected</span><button class="btn" data-project="brief">Brief</button><button class="btn" data-project="save">Save project</button><button class="btn" data-project="handoff">Chat handoff</button></div><div class="pw-project-viewport"><div class="pw-project-board" aria-label="Project canvas"></div></div></div>';
   const sub=body.querySelector('.pw-project-board');n.nodes.forEach(c=>mount(c,n,sub));sizeBoard(sub,n);dropBoard(sub,n);
   body.querySelector('[data-project="brief"]').onclick=()=>briefDialog(n);
   body.querySelector('[data-project="save"]').onclick=()=>saveDialog(n);
   body.querySelector('[data-project="handoff"]').onclick=()=>handoffDialog(n);
  }else{
   const frame=document.createElement('iframe');frame.title=n.title;frame.loading='eager';frame.allow='autoplay; fullscreen';
   const url=new URL(location.pathname,location.origin);url.searchParams.set('workspace-tool',n.componentId);frame.src=url.href;body.append(frame);
  }
  el.addEventListener('pointerdown',()=>activate(el));
  el.querySelector('[data-win="close"]').onclick=()=>{container.nodes=container.nodes.filter(c=>c.instanceId!==n.instanceId);el.remove();sizeBoard(b,container);persistDraft();updateCount(b,container)};
  el.querySelector('[data-win="maximize"]').onclick=()=>{if(n.restore){n.layout=n.restore;delete n.restore}else{n.restore={...n.layout};n.layout={x:b.parentElement.scrollLeft+8,y:b.parentElement.scrollTop+8,width:Math.max(300,b.parentElement.clientWidth-24),height:Math.max(240,b.parentElement.clientHeight-24)}}apply();persistDraft()};
  if(n.kind==='component-project')el.querySelector('[data-win="rename"]').onclick=()=>briefDialog(n);
  function apply(){el.style.left=n.layout.x+'px';el.style.top=n.layout.y+'px';el.style.width=n.layout.width+'px';el.style.height=n.layout.height+'px';sizeBoard(b,container)}
  function gesture(handle,resize){handle.addEventListener('pointerdown',e=>{if(e.button!==0||(!resize&&e.target.closest('button')))return;e.preventDefault();e.stopPropagation();activate(el);delete n.restore;const start={...n.layout},sx=e.clientX,sy=e.clientY;handle.setPointerCapture(e.pointerId);document.body.classList.add('pw-dragging');
   const move=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;n.layout=resize?{...start,width:Math.max(280,start.width+dx),height:Math.max(240,start.height+dy)}:{...start,x:Math.max(0,start.x+dx),y:Math.max(0,start.y+dy)};apply()};
   const end=()=>{handle.removeEventListener('pointermove',move);handle.removeEventListener('pointerup',end);handle.removeEventListener('pointercancel',end);document.body.classList.remove('pw-dragging');persistDraft()};handle.addEventListener('pointermove',move);handle.addEventListener('pointerup',end);handle.addEventListener('pointercancel',end);
  })}gesture(el.querySelector('.pw-window-head'),false);gesture(el.querySelector('.pw-resize'),true);
  el.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/x-pulse-component')){e.preventDefault();e.stopPropagation();el.classList.add('drop-target');e.dataTransfer.dropEffect='copy'}});
  el.addEventListener('dragleave',e=>{if(!el.contains(e.relatedTarget))el.classList.remove('drop-target')});
  el.addEventListener('drop',e=>{e.preventDefault();e.stopPropagation();el.classList.remove('drop-target');const p=payload(e);if(!p)return;const incoming=p.componentId?tool(p.componentId):savedNode(p.projectId);if(!incoming)return;
   if(n.kind==='component-project'){const sub=body.querySelector('.pw-project-board');const offset=n.nodes.length*28;incoming.layout.x=24+offset;incoming.layout.y=24+offset;add(incoming,n,sub);updateCount(sub,n);status('Added to '+n.title+'. Wiring remains a draft.');}
   else{const first=clone(n);first.layout={x:24,y:24,width:600,height:420};incoming.layout.x=650;incoming.layout.y=24;const group=project([first,incoming],n.layout.x+30,n.layout.y+35);group.title=n.title+' project';add(group,container,b);status('Created a new project with both parts. No connections were applied.');}
  });return el;
 }
 function updateCount(b,c){const s=b.closest('.pw-project-body')?.querySelector('.pw-project-bar span');if(s)s.textContent='Assembly draft · '+c.nodes.length+' parts · not connected'}
 function dropBoard(b,c){b.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('application/x-pulse-component')){e.preventDefault();e.dataTransfer.dropEffect='copy'}});b.addEventListener('drop',e=>{const hit=e.target.closest('.pw-window');if(hit&&hit.parentElement===b)return;e.preventDefault();e.stopPropagation();const p=payload(e);if(!p)return;const n=p.componentId?tool(p.componentId):savedNode(p.projectId);if(!n)return;const r=b.getBoundingClientRect();n.layout.x=Math.max(0,e.clientX-r.left);n.layout.y=Math.max(0,e.clientY-r.top);add(n,c,b);updateCount(b,c);status('Part added. Arrange it here; connections are made later.');})}dropBoard(board,workspace);
 function displayDialog(html){dialog.innerHTML=html;dialog.showModal();dialog.querySelector('[data-dismiss]')?.addEventListener('click',()=>dialog.close())}
 function briefDialog(n){displayDialog('<h2>Component project brief</h2><label>Project name</label><input id="pw-edit-name" value="'+esc(n.title||workspace.name)+'"><label>What should these parts do together?</label><textarea id="pw-edit-intent" placeholder="Example: terrain provides slope and water to the plant generator; plants feed the creature habitat…">'+esc(n.intent)+'</textarea><div class="pw-dialog-actions"><button class="btn primary" id="pw-brief-save">Keep brief</button><button class="btn" data-dismiss>Close</button></div>');dialog.querySelector('#pw-brief-save').onclick=()=>{n.intent=dialog.querySelector('#pw-edit-intent').value;n.title=dialog.querySelector('#pw-edit-name').value.trim()||'Component project';const el=shell.querySelector('[data-instance-id="'+n.instanceId+'"]');if(el)el.querySelector('.pw-window-title').textContent=n.title;persistDraft();dialog.close()}}
 function sourceRecord(id){const c=comp(id)||{},m=manifest?.tools?.find(t=>t.id===id)||{};const source=m.component_source||c.source||null;return {id,label:c.label||id,tool:c.tool||null,description:m.what_it_does||c.job||c.short||'',source:source,panelSource:m.panel_source||null,panelSourceUrl:m.panel_source_url||null,standaloneUrl:c.toolSrc||c.page?new URL(c.toolSrc||c.page,location.href).href:null,dependencies:m.depends_on||[],limits:m.honest_limits||c.toolGap||''}}
 function documentOf(n){const nodes=n.nodes||[],ids=new Set();function walk(ns){ns.forEach(x=>{if(x.kind==='component')ids.add(x.componentId);if(x.nodes)walk(x.nodes)})}walk(nodes);return {schema:'moor.component-project',version:1,id:n.id||n.instanceId||uid(),name:n.title||n.name||'Component project',intent:n.intent||'',status:'assembly-draft',createdAt:new Date().toISOString(),dashboardUrl:new URL(location.pathname,location.origin).href,manifestUrl:new URL('pulse-manifest.json',location.href).href,repository:'https://github.com/bassseamoor/render-queue',components:[...ids].map(sourceRecord),nodes:JSON.parse(JSON.stringify(nodes)),connections:n.connections||[],runtimeState:'Layout and membership only. Tool recipes and internal state must be exported from each tool separately.',instructions:'Read the component sources and dependencies. Use the project intent to propose and implement explicit inputs/outputs and connections. Preserve standalone behavior. These parts are collected, not automatically connected. Verify the composed behavior and document limits.'}}
 function download(p){const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=(p.name||'component-project').replace(/[^a-z0-9_-]+/gi,'-')+'.component-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
 function saveDialog(n){displayDialog('<h2>Save component project</h2><label>Project name</label><input id="pw-save-name" value="'+esc(n.title||name.value)+'"><label>Connection brief</label><textarea id="pw-save-intent" placeholder="Describe what the assembled tools should do together.">'+esc(n.intent||'')+'</textarea><p>Stores the parts, layout, source references, and brief. Export individual tool recipes separately to preserve their internal settings.</p><div class="pw-dialog-actions"><button class="btn primary" id="pw-save-local">Save project</button><button class="btn" id="pw-save-export">Export JSON</button><button class="btn" data-dismiss>Close</button></div>');
  function value(){const p=documentOf(n);p.name=dialog.querySelector('#pw-save-name').value.trim()||'Component project';p.intent=dialog.querySelector('#pw-save-intent').value;return p}
  dialog.querySelector('#pw-save-local').onclick=()=>{const p=value(),list=read(KEY,[]),i=list.findIndex(x=>x.id===p.id);if(i>=0)list[i]=p;else list.unshift(p);try{localStorage.setItem(KEY,JSON.stringify(list));n.intent=p.intent;if(n===workspace){workspace.name=p.name;name.value=p.name}else{n.title=p.name;shell.querySelector('[data-instance-id="'+n.instanceId+'"] .pw-window-title').textContent=p.name}persistDraft();renderBin();dialog.close();status('Saved '+p.name+'. Use Chat handoff to share its sources and brief.')}catch(e){status('Could not save locally. Use Export JSON.')}};
  dialog.querySelector('#pw-save-export').onclick=()=>download(value());
 }
 function savedDialog(){const list=read(KEY,[]);displayDialog('<h2>Component projects</h2>'+(list.length?list.map(p=>'<div class="pw-saved"><button class="btn" data-load="'+esc(p.id)+'">'+esc(p.name)+'</button><button class="btn" data-export="'+esc(p.id)+'">Export</button></div>').join(''):'<p>No saved projects yet.</p>')+'<div class="pw-dialog-actions"><button class="btn" data-dismiss>Close</button></div>');dialog.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{const p=list.find(x=>x.id===b.dataset.load);const n=savedNode(p.id);n.title=p.name;n.intent=p.intent;n.connections=p.connections||[];show();add(n);dialog.close();status('Opened saved project '+p.name)});dialog.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>download(list.find(x=>x.id===b.dataset.export)))}
 function b64(s){const bytes=new TextEncoder().encode(s);let binary='';for(let i=0;i<bytes.length;i++)binary+=String.fromCharCode(bytes[i]);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
 function unb64(s){return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)))}
 function brief(p){return 'MOOR COMPONENT PROJECT: '+p.name+'\n\nObjective: '+(p.intent||'Define the connections between these collected parts.')+'\nStatus: assembly draft; no connections applied.\n\nRead this project file and these sources, then connect the components and verify their behavior.\nManifest: '+p.manifestUrl+'\nRepository: '+p.repository+'\n\n'+p.components.map(c=>c.label+' ['+c.id+']\nSource: '+(c.source||'See manifest')+'\nPanel: '+(c.panelSourceUrl||c.standaloneUrl||'See dashboard')+'\nDependencies: '+c.dependencies.join(', ')+'\nLimits: '+c.limits).join('\n\n')+'\n\n'+p.instructions+'\n\nFull project document:\n'+JSON.stringify(p,null,2)}
 async function copy(s){try{await navigator.clipboard.writeText(s);status('Copied to clipboard.')}catch(e){displayDialog('<h2>Copy handoff</h2><textarea id="pw-copy-text"></textarea><div class="pw-dialog-actions"><button class="btn" data-dismiss>Close</button></div>');dialog.querySelector('textarea').value=s;dialog.querySelector('textarea').select()}}
 function handoffDialog(n){const p=documentOf(n);displayDialog('<h2>Point a chat at this project</h2><p>Attach the project JSON or paste the handoff brief into a chat. It includes the collected parts, layout, intent, source paths, and dependencies.</p><label>Connection brief</label><textarea id="pw-handoff-intent" placeholder="Describe what you want connected…">'+esc(p.intent)+'</textarea><div class="pw-dialog-actions"><button class="btn primary" id="pw-copy-brief">Copy brief</button><button class="btn" id="pw-json">Export JSON</button><button class="btn" id="pw-link">Copy workspace link</button><button class="btn" data-dismiss>Close</button></div><p style="margin-top:12px">The workspace link embeds the project; it does not publish a server file. For an LLM, attach JSON or paste the brief because many tools cannot read URL fragments.</p>');const value=()=>({...p,intent:dialog.querySelector('#pw-handoff-intent').value});dialog.querySelector('#pw-copy-brief').onclick=()=>copy(brief(value()));dialog.querySelector('#pw-json').onclick=()=>download(value());dialog.querySelector('#pw-link').onclick=()=>{const url=new URL(location.pathname,location.origin);url.hash='component-project='+b64(JSON.stringify(value()));copy(url.href)}}
 function validate(p){if(p?.schema!=='moor.component-project'||p.version!==1||!Array.isArray(p.nodes))throw Error('Choose a version 1 MOOR component-project JSON file.');let total=0;function walk(ns,depth){if(depth>8)throw Error('Project nesting is too deep.');ns.forEach(n=>{if(++total>100)throw Error('Import supports up to 100 panels.');if(!['component','component-project'].includes(n.kind))throw Error('Unknown panel kind.');if(n.kind==='component'&&!comp(n.componentId))throw Error('Unknown component: '+n.componentId);n.instanceId=uid();if(!n.layout)n.layout={x:30,y:30,width:640,height:470};for(const k of ['x','y','width','height'])if(!Number.isFinite(n.layout[k])||n.layout[k]<0||n.layout[k]>10000)throw Error('Invalid panel layout.');n.layout.width=Math.max(280,n.layout.width);n.layout.height=Math.max(240,n.layout.height);if(n.kind==='component-project'){if(!Array.isArray(n.nodes))throw Error('Project is missing its parts.');walk(n.nodes,depth+1)}})}walk(p.nodes,0);return p}
 function importProject(p){validate(p);show();const n=project(p.nodes,30,30);n.title=String(p.name||'Imported project');n.intent=String(p.intent||'');n.connections=p.connections||[];add(n);status('Imported '+n.title+'. Parts are collected; wiring remains a draft.');return n}
 function importFile(){const input=document.createElement('input');input.type='file';input.accept='.json,application/json';input.onchange=async()=>{try{const file=input.files[0];if(!file)return;if(file.size>2e6)throw Error('Project file exceeds 2 MB.');importProject(JSON.parse(await file.text()))}catch(e){status(e.message)}};input.click()}
 shell.querySelector('.pw-toolbar').addEventListener('click',e=>{const act=e.target.closest('[data-pw]')?.dataset.pw;if(!act)return;if(act==='bin')bin.hidden=!bin.hidden;if(act==='project'){show();add(project([],viewport.scrollLeft+35,viewport.scrollTop+35));status('New project. Drag parts from the Bin into its canvas.')}if(act==='save')saveDialog(workspace);if(act==='saved')savedDialog();if(act==='handoff')handoffDialog(workspace);if(act==='import')importFile()});name.addEventListener('change',persistDraft);
 openComponent=function(id){if(id.startsWith('component-project:')){const n=savedNode(id.slice(18));if(n){show();add(n)}return}if(!comp(id))return;addTool(id)};
 binView=function(){const saved=read(KEY,[]);return originalBin()+(saved.length?'<section class="bin-sec"><h3>Component projects</h3><p>Saved assemblies and connection briefs.</p><div class="trows">'+saved.map(p=>'<button class="trow" data-open="component-project:'+esc(p.id)+'"><span class="trow-ic">▧</span><span class="trow-tx"><strong>'+esc(p.name)+'</strong><span>'+p.nodes.length+' parts · assembly draft</span></span></button>').join('')+'</div></section>':'')};
 selectTab=function(id){if(id==='workspace'){show();return}document.body.classList.remove('pw-active');if(UI.focus){unmountFocus();UI.focus=null;UI.open=[]}originalTab(id)};
 ensureTabbar=function(){originalBar();const bar=document.getElementById('tabbar');if(!bar)return;if(!bar.querySelector('[data-tab="workspace"]')){const b=document.createElement('button');b.dataset.tab='workspace';b.innerHTML='<span class="tb-ic" aria-hidden="true">▧</span><span>Canvas</span>';bar.append(b)}if(document.body.classList.contains('pw-active')){bar.style.display='';bar.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.tab==='workspace');b.setAttribute('aria-current',b.dataset.tab==='workspace'?'page':'false')})}};
 document.addEventListener('dragstart',e=>{const row=e.target.closest('[data-open]');if(!row)return;e.dataTransfer.setData('application/x-pulse-component',JSON.stringify(row.dataset.open.startsWith('component-project:')?{projectId:row.dataset.open.slice(18)}:{componentId:row.dataset.open}));e.dataTransfer.effectAllowed='copy';document.body.classList.add('pw-part-drag')});
 const draggable=()=>document.querySelectorAll('#tabview [data-open]').forEach(el=>el.draggable=true);new MutationObserver(draggable).observe(document.getElementById('tabview'),{childList:true,subtree:true});draggable();
 document.addEventListener('dragend',()=>document.body.classList.remove('pw-part-drag'));
 document.addEventListener('drop',()=>document.body.classList.remove('pw-part-drag'));
 renderBin();ensureTabbar();
 fetch('pulse-manifest.json').then(r=>{if(!r.ok)throw Error('manifest');return r.json()}).then(m=>manifest=m).catch(()=>{});
 const draft=read(DRAFT,null);if(draft?.nodes?.length){try{validate({...draft,schema:'moor.component-project',version:1});workspace.id=draft.id||uid();workspace.name=draft.name||workspace.name;workspace.intent=draft.intent||'';workspace.nodes=draft.nodes;workspace.connections=draft.connections||[];name.value=workspace.name;workspace.nodes.forEach(n=>mount(n,workspace,board));sizeBoard(board,workspace)}catch(e){status('Saved draft could not be restored. Import a project JSON instead.')}}
 if(location.hash.startsWith('#component-project=')){try{const raw=location.hash.slice(19);if(raw.length>2800000)throw Error('Workspace link is too large.');importProject(JSON.parse(unb64(raw)))}catch(e){show();status('Could not open workspace link: '+e.message)}}
 if(pendingComponent&&comp(pendingComponent)){unmountFocus();UI.focus=null;UI.open=[];persist();addTool(pendingComponent);}
 window.PulseWorkspace={open:addTool,project:()=>{show();return add(project([]))},export:()=>documentOf(workspace),import:importProject,get state(){return workspace},show};
}
})();
