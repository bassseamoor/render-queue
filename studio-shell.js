/* STRATA shell v1 — reuse original controls, handlers, seed stores and encoders. */
(()=>{'use strict';
const ready=()=>{
 if(new URLSearchParams(location.search).has('render')||document.body.classList.contains('su-enabled'))return;
 const body=document.body, $=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
 if($('.inspector')&&$('.workspace')){body.classList.add('su-strata');return;}
 const sc=window.SeedConsole, A=window.SeedConsoleAdapter;
 const file=location.pathname.split('/').pop();
 const names={'forge-2.html':'FORGE 2.0','forge.html':'FORGE','rain-window-studio.html':'Rain Window','turtle-life-studio.html':'Turtle Life'};
 const name=names[file]||A?.title||document.title.split(/[·—]/)[0].trim();
 const isForest=!!$('.layout>aside'), isParallax=!!$('.dock'), isRain=!!$('#panel-scene'), isForge=!!$('#viewroot');
 
 body.classList.add('su-enabled');
 function node(tag,cls,text){const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;}
 function button(text,fn,label){const b=node('button','',text);b.type='button';b.onclick=fn;if(label)b.setAttribute('aria-label',label);return b;}
 const header=node('div','su-header'); const back=node('a','su-back','‹ Studios');back.href='/render-queue/';header.append(back);
 const brand=node('div','su-brand',name), small=node('small','','Scene studio');brand.append(small);header.append(brand,node('span','su-spacer'));
 const panel=node('aside','su-inspector');panel.id='su-inspector';panel.setAttribute('aria-label',name+' studio controls');
 const toggle=button('Studio ≡',()=>open(panel.hidden));toggle.setAttribute('aria-controls',panel.id);
 const clean=button('Clean view',()=>setClean(true));clean.className='su-clean-button';header.append(clean,toggle);
 const heading=node('div','su-heading'), title=node('div');title.append(node('span','su-eyebrow','YOUR WORLD, IN LAYERS'),node('h2','','Make somewhere.'));heading.append(title,button('×',()=>open(false),'Close studio controls'));
 const tabs=node('nav','su-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Studio sections');const scroll=node('div','su-scroll');
 const pages={};for(const key of ['World','Camera','Export']){const p=node('section','su-page');p.id='su-'+key.toLowerCase();p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',p.id+'-tab');pages[key]=p;scroll.append(p);const b=button(key,()=>select(key));b.id=p.id+'-tab';b.setAttribute('role','tab');b.setAttribute('aria-controls',p.id);tabs.append(b);}
 panel.append(heading,tabs,scroll,node('div','su-panel-footer','PROCEDURAL · LOCAL · YOURS'));body.append(header,panel);
 const footer=node('div','su-footer'), seedLabel=node('span','su-seed-label','');
 if(sc?.panel){const newBtn=button('New world ↗',()=>sc.doRandom());newBtn.className='su-new';footer.append(newBtn,button('Remix',()=>sc.doRemix()),seedLabel,button('♡ Save',()=>sc.toggleFav(sc.bFav)),button('Capture',()=>{select('Export');open(true);}));}
 else if(isForge){const b=button('New world ↗',()=>window.forgeApp?.newScene());b.className='su-new';footer.append(b,button('Remix',()=>window.forgeApp?.remix()),node('span','su-seed-label','CREATE · EDIT · BUILD'),button('Export PNG',()=>window.forgeApp?.exportPNG()));}else{footer.append(node('span','su-seed-label','SCENE STUDIO'),button('Studio ≡',()=>open(!panel.hidden)));}
 body.append(footer);
 const restore=button('Show studio',()=>setClean(false));restore.className='su-restore';body.append(restore);
 function open(value){panel.hidden=!value;toggle.setAttribute('aria-expanded',String(value));if(value&&body.classList.contains('su-clean'))setClean(false);}
 function select(key){Object.entries(pages).forEach(([k,p])=>p.hidden=k!==key);[...tabs.children].forEach(b=>{b.setAttribute('aria-selected',String(b.textContent===key));b.tabIndex=b.textContent===key?0:-1;});scroll.scrollTop=0;}
 tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const arr=[...tabs.children];let i=arr.indexOf(document.activeElement);i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;select(arr[i].textContent);arr[i].focus();});
 function setClean(v){body.classList.toggle('su-clean',v);}
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){setClean(false);open(false);toggle.focus();}});
 function move(selector,target){const el=$(selector);if(!el)return;el.classList.add('su-native');el.hidden=false;target.append(el);return el;}
 function hide(selector){all(selector).forEach(el=>el.classList.add('su-old-chrome'));}
 if(isForest){move('#world',pages.World);move('#camera',pages.Camera);move('#export',pages.Export);hide('body>header,.layout>aside');const sound=$('#soundBtn');if(sound)pages.Camera.prepend(sound);}
 if(isParallax){move('#realmTabs',pages.World);move('#customize',pages.World);move('#library',pages.World);move('#lenses',pages.Camera);move('.journey-bar',pages.Camera);move('#record',pages.Export);hide('.dock,.top-actions,body>header');}
 if(isRain){move('#panel-scene',pages.World);move('#panel-glass',pages.Camera);move('#panel-export',pages.Export);move('#dock',pages.Camera);const sound=$('#sound');if(sound)pages.Camera.prepend(sound);hide('#stage>header,#panel');}
 if(isForge){move('#modeswitch',pages.World);move('#viewroot',pages.World);const aspect=$('#aspectbtn');if(aspect)pages.Camera.append(aspect);pages.Export.append(button('Export PNG',()=>{if(window.forgeApp?.exportPNG)window.forgeApp.exportPNG();else{const b=document.getElementById('btnExport')||document.getElementById('eExport');if(b)b.click();}}));hide('#topbar');}
 if(file==='turtle-life-studio.html'){move('#panelL',pages.World);move('#panelR',pages.Camera);move('#reefDock',pages.Camera);hide('#topbar');}
 if(file==='road-atlas.html'||file==='road-atlas-v2.html'){move('#layersPanel',pages.World);move('#analysisPanel',pages.World);const share=$('#shareBtn');if(share)pages.World.append(share);hide('#topbar');}
 if(file==='aquarium.html')hide('#topbar');
 if(file==='molten.html')hide('.scene-meta');
 if(sc?.panel){
  const original=sc.panel;original.classList.remove('hidden');pages.World.append(original);original.querySelector('#sc-seedfield')?.setAttribute('aria-label','Scene code');
  const children=[...original.children];let captureTarget=pages.Export;if(pages.Export.children.length){captureTarget=node('details','su-quick-capture');captureTarget.append(node('summary','','Quick capture'));pages.Export.append(captureTarget);}let group='World';for(const child of children){if(child.classList.contains('sc-sec')){const t=child.textContent;if(/Record video/.test(t))group='Export';else if(/Favorites|Recent/.test(t))group='World';}if(group==='Export')captureTarget.append(child);}
  // Keep seed/history lookups scoped to the original panel; recording references use document ids.
  const refresh=sc.refreshParams.bind(sc);sc.refreshParams=function(){refresh();all('.sc-param').forEach((wrap,i)=>{const range=wrap.querySelector('input[type=range]'),lab=wrap.querySelector('label');if(range&&lab){range.id='su-param-'+i;lab.htmlFor=range.id;range.setAttribute('aria-label',lab.textContent);}});};sc.refreshParams();
  sc.togglePanel=()=>open(panel.hidden);sc.togglePanelSection=()=>{select('Export');open(true);};sc.toggleChrome=()=>setClean(!body.classList.contains('su-clean'));
  // The old recorder resolves elements through this.panel, so include the mounted sections.
  const originalQuery=original.querySelector.bind(original);original.querySelector=s=>originalQuery(s)||panel.querySelector(s);
  const saveButton=[...footer.querySelectorAll('button')].find(b=>b.textContent==='♡ Save');const originalFav=sc.updateFavBtn.bind(sc);sc.updateFavBtn=function(){originalFav();if(saveButton){const saved=sc.favs.get([]).some(f=>f.seed===A.getSeed());saveButton.textContent=saved?'♥ Saved':'♡ Save';saveButton.setAttribute('aria-pressed',String(saved));}};sc.updateFavBtn();
  const updateSeed=()=>seedLabel.textContent=A?.getSeed?.()||'';updateSeed();new MutationObserver(updateSeed).observe(sc.seedChip,{childList:true,characterData:true,subtree:true});
 }
 if(!pages.Camera.children.length)pages.Camera.append(node('p','su-help','Reframe directly in the scene using this studio’s drag and zoom controls.'));
 const full=button('⤢ Full screen',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>{});});pages.Camera.append(full,button('Clean view',()=>setClean(true)));
 // Touches on controls must not trigger the legacy document-wide double-tap hide gesture.
 [header,panel,footer].forEach(el=>el.addEventListener('touchend',e=>e.stopPropagation()));
 hide('#uiToggle');select('World');open(!matchMedia('(max-width:740px)').matches);
};
window.addEventListener('studio:ready',ready,{once:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
