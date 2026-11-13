/* Render Queue Studio Standard — mounts each renderer's existing controls in one overlay. */
(()=>{'use strict';
const QUEUE_URL='https://bassseamoor.github.io/render-queue/';
const DYNAMIC=new Set(['alien-planet.html','rainforest.html','aquarium.html','molten.html','parallax-engine.html','road-atlas-v2.html']);
let tries=0;
const ready=()=>requestAnimationFrame(mount);
function mount(){
  if(document.getElementById('rq-studio-shell'))return;
  const body=document.body,file=location.pathname.split('/').pop()||'';
  const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const sc=window.SeedConsole,A=window.SeedConsoleAdapter;
  if(DYNAMIC.has(file)&&!window.__rqStudioReady){if(tries++<80)setTimeout(mount,50);return;}
  if(!sc&&!$('#scene')&&!$('canvas')&&!$('.workspace')&&!$('.layout'))return;
  body.classList.add('su-enabled');
  const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls||'';if(text!=null)el.textContent=text;return el;};
  const button=(text,fn,label)=>{const b=make('button','',text);b.type='button';b.addEventListener('click',fn);if(label)b.setAttribute('aria-label',label);return b;};
  const shell=make('div','su-shell');shell.id='rq-studio-shell';
  const name=(A&&A.title)||({ 'canal-metropolis.html':'Canal Metropolis','parallax-engine.html':'Parallax Engine','rain-window-studio.html':'Rain Window','turtle-life-studio.html':'Turtle Life','molten.html':'Molten','aquarium.html':'Aquarium','alien-planet.html':'Alien Planet','rainforest.html':'Rainforest' }[file])||document.title.split(/[—·|-]/)[0].trim()||'Scene Studio';
  const header=make('header','su-header');
  const back=make('a','su-back','Back');back.href=QUEUE_URL;back.setAttribute('aria-label','Back to studios');
  const brand=make('div','su-brand');brand.append(Object.assign(make('strong','',name),{title:name}),make('small','','Live scene studio'));
  const spacer=make('span','su-spacer');
  const inspector=make('aside','su-inspector');inspector.id='su-inspector';inspector.setAttribute('aria-label',name+' controls');
  const heading=make('div','su-heading'),headingText=make('div','');headingText.append(make('div','su-eyebrow','Live controls'),make('h2','','Adjust while watching'));
  const tabs=make('nav','su-tabs');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Studio control sections');
  const scroll=make('div','su-scroll'),pages={};
  const close=button('×',()=>open(false),'Close controls');close.className='su-close';heading.append(headingText,close);
  ['World','Camera','Export'].forEach((key,i)=>{const page=make('section','su-page');page.id='su-'+key.toLowerCase();page.setAttribute('role','tabpanel');pages[key]=page;scroll.append(page);const tab=button(key,()=>select(key));tab.id=page.id+'-tab';tab.setAttribute('role','tab');tab.setAttribute('aria-controls',page.id);tab.dataset.key=key;tabs.append(tab);if(!i)tab.setAttribute('aria-selected','true');});
  inspector.append(heading,tabs,scroll,make('div','su-panel-footer','RENDER QUEUE · LIVE · LOCAL'));
  const controls=button('Controls',()=>open(inspector.hidden));controls.className='su-controls-button';controls.setAttribute('aria-controls',inspector.id);controls.setAttribute('aria-expanded','false');
  const clean=button('Clean',()=>setClean(true),'Hide controls and leave the scene visible');clean.className='su-clean-button';header.append(back,brand,spacer,clean,controls);
  const footer=make('footer','su-footer'),restore=button('Show controls',()=>setClean(false));restore.className='su-restore';
  shell.append(header,inspector,footer,restore);body.append(shell);
  function open(value){inspector.hidden=!value;controls.setAttribute('aria-expanded',String(value));if(value&&body.classList.contains('su-clean'))setClean(false);}
  function select(key){Object.entries(pages).forEach(([k,page])=>page.hidden=k!==key);[...tabs.children].forEach(tab=>{const active=tab.dataset.key===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});scroll.scrollTop=0;}
  function setClean(value){body.classList.toggle('su-clean',value);if(value)open(false);}
  tabs.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const list=[...tabs.children],current=list.indexOf(document.activeElement);const index=event.key==='Home'?0:event.key==='End'?list.length-1:(current+(event.key==='ArrowRight'?1:list.length-1))%list.length;list[index].click();list[index].focus();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){setClean(false);open(false);controls.focus();}});
  const move=(selector,target)=>{const el=$(selector);if(!el)return null;el.hidden=false;el.classList.add('su-native');target.append(el);return el;};
  const hide=selector=>all(selector).forEach(el=>el.classList.add('su-old-chrome'));
  const isForest=!!$('.layout>aside'),isParallax=!!$('.dock'),isRain=!!$('#panel-scene'),isForge=!!$('#viewroot');
  if(isForest){move('#world',pages.World);move('#camera',pages.Camera);move('#export',pages.Export);const sound=$('#soundBtn');if(sound)pages.Camera.prepend(sound);hide('body>header,.layout>aside');}
  if(isParallax){move('#realmTabs',pages.World);move('#customize',pages.World);move('#library',pages.World);move('#lenses',pages.Camera);move('#light',pages.Camera);move('.journey-bar',pages.Camera);move('#record',pages.Export);hide('.dock,.top-actions,body>header');}
  if(isRain){move('#panel-scene',pages.World);move('#panel-glass',pages.Camera);move('#panel-export',pages.Export);move('#dock',pages.Camera);const sound=$('#sound');if(sound)pages.Camera.prepend(sound);hide('#stage>header,#panel');}
  if(file==='turtle-life-studio.html'||file==='aquarium.html'){move('#panelL',pages.World);move('#panelR',pages.Camera);move('#reefDock',pages.Camera);hide('#topbar');}
  if(isForge){move('#modeswitch',pages.World);move('#viewroot',pages.World);move('#aspectbtn',pages.Camera);hide('#topbar');}
  if(file==='road-atlas.html'||file==='road-atlas-v2.html'){move('#layersPanel',pages.World);move('#analysisPanel',pages.World);const actions=make('div','su-actions');['#randomBtn','#remixBtn','#urbanDesignBtn','#dataBtn','#shareBtn','#btn3d'].forEach(selector=>{const el=$(selector);if(el){el.classList.add('su-native');actions.append(el);}});if(actions.children.length)pages.World.prepend(actions);hide('#topbar');}
  if(file==='molten.html'){pages.World.append(make('p','su-help','Drag the lamp to orbit it. Use the scene controls below to change the wax, light, and composition.'));hide('.scene-meta');}
  if(sc&&sc.panel){
    const original=sc.panel;original.classList.remove('hidden');original.classList.add('su-native');pages.World.append(original);
    const refresh=typeof sc.refreshParams==='function'?sc.refreshParams.bind(sc):null;
    if(refresh){sc.refreshParams=function(){refresh();all('.sc-param').forEach((wrap,index)=>{const input=wrap.querySelector('input[type=range]'),label=wrap.querySelector('label');if(input&&label){input.id='su-param-'+index;label.htmlFor=input.id;input.setAttribute('aria-label',label.textContent.trim());}});};sc.refreshParams();}
    sc.togglePanel=()=>open(inspector.hidden);sc.togglePanelSection=()=>{select('Export');open(true);};sc.toggleChrome=()=>setClean(!body.classList.contains('su-clean'));
    const seed=make('span','su-seed-label','');const updateSeed=()=>{try{seed.textContent=A&&A.getSeed?A.getSeed():'';}catch(_){seed.textContent='';}};updateSeed();footer.append(seed);
    const newWorld=button('New world',()=>sc.doRandom&&sc.doRandom());newWorld.className='su-new';const remix=button('Remix',()=>sc.doRemix&&sc.doRemix());const save=button('Save',()=>sc.toggleFav&&sc.toggleFav(sc.bFav));const capture=button('Capture',()=>{select('Export');open(true);});footer.append(newWorld,remix,save,capture);
    if(sc.seedChip)new MutationObserver(updateSeed).observe(sc.seedChip,{childList:true,characterData:true,subtree:true});
  }else if(isForge){const newWorld=button('New world',()=>window.forgeApp&&window.forgeApp.newScene&&window.forgeApp.newScene());newWorld.className='su-new';footer.append(newWorld,button('Remix',()=>window.forgeApp&&window.forgeApp.remix&&window.forgeApp.remix()),button('Export PNG',()=>window.forgeApp&&window.forgeApp.exportPNG&&window.forgeApp.exportPNG()));}
  else footer.append(button('Controls',()=>open(true)));
  if(!pages.World.children.length)pages.World.append(make('p','su-help','This renderer has no editable world controls exposed yet. Its live scene remains fully interactive.'));
  if(!pages.Camera.children.length)pages.Camera.append(make('p','su-help','Drag or pinch directly on the live scene to reframe it.'));
  const fullscreen=button('Full screen',()=>{if(document.fullscreenElement)document.exitFullscreen&&document.exitFullscreen();else document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{});});pages.Camera.append(fullscreen,button('Clean scene',()=>setClean(true)));
  [header,inspector,footer].forEach(el=>el.addEventListener('touchend',event=>event.stopPropagation(),{passive:true}));
  hide('#uiToggle');select('World');open(!matchMedia('(max-width:740px)').matches);
}
window.addEventListener('studio:ready',()=>{window.__rqStudioReady=true;ready();});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
