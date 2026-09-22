/* Road Atlas navigation 1.0.0 — a camera, never a generator.
 * CSS transforms preserve the original full-resolution canvas/encoder pixels.
 * Camera units: world-space center + zoom relative to the fitted map.
 * Pointer Events own only the map; controls and document zoom remain independent.
 */
(function () {
'use strict';
if (window.RoadAtlasNavigation) return;
var VERSION='1.0.0', qs=new URLSearchParams(location.search);
if (qs.get('render')==='1') { window.RoadAtlasNavigation={version:VERSION,disabled:true}; return; }
var stage=document.getElementById('stage'), map=document.getElementById('scene');
if (!stage||!map) throw new Error('Map navigation requires #stage and #scene');
var MIN=1,MAX=16,zoom=1,cx=0,cy=0,scale=1,tx=0,ty=0,area=null,lastKey=null;
var pointers=new Map(),multiple=false,moved=false,lastTap=null,focusMode=false;
var pending=0,thumbnail=null,lastBuffer=null,pill=null,ready=false;
var detailTimer=0,detailKey=null,sceneEpoch=0,detailMs=0;
var overview=matchMedia('(min-width:721px)').matches;
function clampN(n,a,b){return Math.max(a,Math.min(b,n));}
function finite(n,otherwise){return Number.isFinite(Number(n))?Number(n):otherwise;}
function currentKey(){
 if(typeof world==='undefined'||!world)return null;
 var seed=String(world.seed||'');
 // Same rules as Ordered mode: palette/labels are not a different city.
 if(window.RoadAtlasPipeline&&RoadAtlasPipeline.getMode()==='ordered'&&/^RA1-[0-9a-z]{12}$/i.test(seed))seed=seed.slice(0,12)+'01'+seed.slice(14);
 return seed+'|'+WORLD_W+'|'+WORLD_H;
}
function worldReady(){return typeof worldCanvas!=='undefined'&&worldCanvas&&typeof world!=='undefined'&&world&&WORLD_W>0&&WORLD_H>0;}
function geometry(){
 var r=stage.getBoundingClientRect(),bottom=12,top=controls.offsetHeight+24;
 if(pill&&!focusMode){var p=pill.getBoundingClientRect();if(p.width&&p.height)bottom=Math.max(bottom,r.bottom-p.top+10);}
 var w=Math.max(32,r.width-24),h=Math.max(32,r.height-top-bottom);
 return {left:12,top:top,w:w,h:h,x:r.width/2,y:top+h/2,fit:Math.min(w/WORLD_W,h/WORLD_H),rect:r};
}
function constrain(){
 scale=area.fit*zoom;
 var halfX=area.w/(2*scale),halfY=area.h/(2*scale);
 cx=WORLD_W<=2*halfX?WORLD_W/2:clampN(cx,halfX,WORLD_W-halfX);
 cy=WORLD_H<=2*halfY?WORLD_H/2:clampN(cy,halfY,WORLD_H-halfY);
 tx=area.x-cx*scale;ty=area.y-cy*scale;
}
function update(){
 if(!worldReady()||window.__renderMode)return;
 var key=currentKey(),first=!ready;
 if(key!==lastKey){lastKey=key;cx=WORLD_W/2;cy=WORLD_H/2;zoom=1;cancelGesture();}
 if(first){
  zoom=clampN(finite(qs.get('mapZoom')||1,1),MIN,MAX);
  cx=clampN(finite(qs.get('mapX')||.5,.5),0,1)*WORLD_W;
  cy=clampN(finite(qs.get('mapY')||.5,.5),0,1)*WORLD_H;ready=true;
 }
 area=geometry();constrain();
 // Intrinsic canvas dimensions remain world-sized. No upscaled draw buffer,
 // generation, scalar field sampling, or pixel serialization during gestures.
 map.style.width=(WORLD_W*area.fit)+'px';map.style.height=(WORLD_H*area.fit)+'px';
 map.style.transform='translate('+tx+'px,'+ty+'px) scale('+zoom+')';
 amount.textContent=(zoom<10?zoom.toFixed(1):zoom.toFixed(0))+'×';
 minus.disabled=zoom<=MIN+1e-6;plus.disabled=zoom>=MAX-1e-6;
 miniWrap.hidden=!overview;miniToggle.setAttribute('aria-pressed',String(overview));
 stage.classList.toggle('ra-dragging',pointers.size>0);
 drawOverview();queueDetail();
}
function schedule(){if(!pending)pending=requestAnimationFrame(function(){pending=0;update();});}
function fit(){if(!worldReady())return;zoom=1;cx=WORLD_W/2;cy=WORLD_H/2;cancelGesture();update();}
function localPoint(clientX,clientY){var r=stage.getBoundingClientRect();return {x:clientX-r.left,y:clientY-r.top};}
function screenToWorld(clientX,clientY){
 if(!worldReady())return null;if(!area)update();
 var p=localPoint(clientX,clientY);return {x:(p.x-tx)/scale,y:(p.y-ty)/scale};
}
function worldToScreen(x,y){if(!area)return null;var r=stage.getBoundingClientRect();return {x:r.left+tx+x*scale,y:r.top+ty+y*scale};}
function zoomAt(next,clientX,clientY){
 if(!worldReady())return;update();
 var p=clientX==null?{x:area.x,y:area.y}:localPoint(clientX,clientY);
 var x=(p.x-tx)/scale,y=(p.y-ty)/scale;
 zoom=clampN(finite(next,zoom),MIN,MAX);var s=area.fit*zoom;
 cx=x-(p.x-area.x)/s;cy=y-(p.y-area.y)/s;update();
}
function pan(dx,dy){if(!worldReady())return;cx-=dx/scale;cy-=dy/scale;update();}
function getView(){return {version:VERSION,zoom:zoom,center:{x:cx,y:cy},normalizedCenter:{x:cx/WORLD_W,y:cy/WORLD_H},scale:scale,translation:{x:tx,y:ty},limits:{min:MIN,max:MAX},focus:focusMode,overview:overview,dragging:pointers.size>0,detailReady:!!detail&&!detail.hidden,detailRenderMs:detailMs};}
function queryParameters(url){
 if(zoom>1.00001){url.searchParams.set('mapZoom',+zoom.toFixed(6));url.searchParams.set('mapX',+(cx/WORLD_W).toFixed(7));url.searchParams.set('mapY',+(cy/WORLD_H).toFixed(7));}
 else ['mapZoom','mapX','mapY'].forEach(function(k){url.searchParams.delete(k);});
 return url;
}
function excluded(target){return target.closest&&target.closest('[data-ra-navigation],button,input,select,textarea,a,summary');}
function cancelGesture(){
 var ids=Array.from(pointers.keys());pointers.clear();multiple=false;moved=false;lastTap=null;
 ids.forEach(function(id){try{if(stage.hasPointerCapture(id))stage.releasePointerCapture(id);}catch(e){}});
 stage.classList.remove('ra-dragging');
}
function pointerDown(e){
 if(!ready||excluded(e.target)||window.__renderMode||(e.pointerType==='mouse'&&e.button!==0&&e.button!==1))return;
 e.preventDefault();update();
 if(!pointers.size){multiple=false;moved=false;stage.focus({preventScroll:true});}
 var p=localPoint(e.clientX,e.clientY);p.ox=p.x;p.oy=p.y;
 pointers.set(e.pointerId,p);
 if(pointers.size>1){multiple=true;moved=true;lastTap=null;}
 try{stage.setPointerCapture(e.pointerId);}catch(err){}
 stage.classList.add('ra-dragging');queueDetail();
}
function pointerMove(e){
 if(!pointers.has(e.pointerId)||window.__renderMode)return;e.preventDefault();
 var previous=Array.from(pointers.values()).slice(0,2),old=pointers.get(e.pointerId),p=localPoint(e.clientX,e.clientY);
 p.ox=old.ox;p.oy=old.oy;
 if(Math.hypot(p.x-p.ox,p.y-p.oy)>5)moved=true;
 pointers.set(e.pointerId,p);
 if(pointers.size===1){if(moved)pan(p.x-old.x,p.y-old.y);return;}
 // Use the old midpoint's world point, then place it under the NEW midpoint.
 // This combines zoom and two-finger translation without a jump on release.
 var next=Array.from(pointers.values()).slice(0,2),a={x:(previous[0].x+previous[1].x)/2,y:(previous[0].y+previous[1].y)/2},b={x:(next[0].x+next[1].x)/2,y:(next[0].y+next[1].y)/2};
 var d0=Math.hypot(previous[0].x-previous[1].x,previous[0].y-previous[1].y),d1=Math.hypot(next[0].x-next[1].x,next[0].y-next[1].y);
 var wx=(a.x-tx)/scale,wy=(a.y-ty)/scale;
 if(d0>2&&d1>2)zoom=clampN(zoom*d1/d0,MIN,MAX);
 var s=area.fit*zoom;cx=wx-(b.x-area.x)/s;cy=wy-(b.y-area.y)/s;update();
}
function pointerEnd(e){
 if(!pointers.has(e.pointerId))return;
 var old=pointers.get(e.pointerId),pt=localPoint(e.clientX,e.clientY);
 var tap=e.type==='pointerup'&&!multiple&&!moved&&Math.hypot(pt.x-old.ox,pt.y-old.oy)<=5;
 pointers.delete(e.pointerId);
 try{if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);}catch(err){}
 if(!pointers.size){stage.classList.remove('ra-dragging');multiple=false;moved=false;}
 queueDetail();
 if(!tap){lastTap=null;return;}
 var inspecting=window.RoadAtlasConditions&&RoadAtlasConditions.isInspecting&&RoadAtlasConditions.isInspecting();
 var now=performance.now();
 if(!inspecting&&e.pointerType!=='mouse'&&lastTap&&now-lastTap.time<320&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<26){
  zoomAt(zoom*2,e.clientX,e.clientY);lastTap=null;return;
 }
 lastTap={time:now,x:e.clientX,y:e.clientY};
 var w=screenToWorld(e.clientX,e.clientY);
 if(w&&w.x>=0&&w.y>=0&&w.x<WORLD_W&&w.y<WORLD_H)stage.dispatchEvent(new CustomEvent('roadatlas:maptap',{detail:w}));
}
function wheel(e){
 if(!ready||excluded(e.target)||window.__renderMode)return;
 e.preventDefault();lastTap=null;
 var delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?area.h:1);
 zoomAt(zoom*Math.exp(-clampN(delta,-300,300)*.0025),e.clientX,e.clientY);
}
function setFocus(value){
 cancelGesture();focusMode=!!value;document.body.classList.toggle('ra-map-focus',focusMode);
 focusButton.textContent=focusMode?'Exit focus':'Focus';focusButton.setAttribute('aria-pressed',String(focusMode));
 focusButton.setAttribute('aria-label',focusMode?'Exit map focus mode':'Focus on the map');
 update();schedule();
}
function drawOverview(){
 if(!overview||!ready)return;
 if(lastBuffer!==worldCanvas){lastBuffer=worldCanvas;thumbnail=document.createElement('canvas');thumbnail.width=320;thumbnail.height=Math.max(1,Math.round(320*WORLD_H/WORLD_W));thumbnail.getContext('2d').drawImage(worldCanvas,0,0,thumbnail.width,thumbnail.height);}
 var c=mini.getContext('2d'),w=mini.width,h=mini.height;c.clearRect(0,0,w,h);c.drawImage(thumbnail,0,0,w,h);
 var left=clampN(-tx/scale,0,WORLD_W),top=clampN(-ty/scale,0,WORLD_H),right=clampN((area.rect.width-tx)/scale,0,WORLD_W),bottom=clampN((area.rect.height-ty)/scale,0,WORLD_H);
 c.fillStyle='rgba(11,18,21,.25)';c.beginPath();c.rect(0,0,w,h);c.rect(left/WORLD_W*w,top/WORLD_H*h,(right-left)/WORLD_W*w,(bottom-top)/WORLD_H*h);c.fill('evenodd');
 c.strokeStyle='#f9f4df';c.lineWidth=3;c.strokeRect(left/WORLD_W*w+1,top/WORLD_H*h+1,Math.max(1,(right-left)/WORLD_W*w-2),Math.max(1,(bottom-top)/WORLD_H*h-2));
}
// Redraw retained vector/cartographic geometry only AFTER a gesture settles.
// This viewport-sized cache avoids magnifying a blurry world bitmap indefinitely;
// it never changes the authoritative scene canvas or the MP4 render camera.
function viewKey(){return [lastKey,sceneEpoch,cx,cy,zoom,area.rect.width,area.rect.height,devicePixelRatio||1].join('|');}
function queueDetail(){
 clearTimeout(detailTimer);
 if(!ready||!detail||window.__renderMode)return;
 var key=viewKey();
 if(key===detailKey&&!pointers.size)return;
 detail.hidden=true;
 if(pointers.size||scale*(devicePixelRatio||1)<=1.05)return;
 detailTimer=setTimeout(function(){
  if(!ready||pointers.size||window.__renderMode||key!==viewKey())return;
  var t=performance.now(),r=stage.getBoundingClientRect();
  var d=Math.min(devicePixelRatio||1,2,Math.sqrt(4000000/Math.max(1,r.width*r.height)));
  detail.width=Math.max(1,Math.round(r.width*d));detail.height=Math.max(1,Math.round(r.height*d));
  var c=detail.getContext('2d');
  try{c.setTransform(scale*d,0,0,scale*d,tx*d,ty*d);renderWorld(c,world);if(anyLayerOn()&&overlayCanvas)c.drawImage(overlayCanvas,0,0);detailKey=key;detailMs=+(performance.now()-t).toFixed(1);detail.hidden=false;}
  catch(e){detail.hidden=true;console.warn('Map detail redraw skipped:',e.message);}
 },160);
}
function recenter(e){var r=mini.getBoundingClientRect();cx=clampN((e.clientX-r.left)/r.width,0,1)*WORLD_W;cy=clampN((e.clientY-r.top)/r.height,0,1)*WORLD_H;update();}
var css=document.createElement('style');css.textContent=`
#stage.ra-navigable{display:block;overflow:hidden;touch-action:none;overscroll-behavior:contain;user-select:none;-webkit-user-select:none;outline:none}
#stage.ra-navigable #scene{position:absolute;left:0;top:0;max-width:none;max-height:none;margin:0;transform-origin:0 0;will-change:transform;touch-action:none;cursor:grab;}
#stage.ra-navigable.ra-dragging,#stage.ra-navigable.ra-dragging #scene{cursor:grabbing}
#stage .ra-map-detail{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1}#stage .ra-map-detail[hidden]{display:none}
#stage.ra-navigable:focus-visible{outline:2px solid #b7c5aa;outline-offset:-3px}
.ra-camera-controls{position:absolute;left:max(12px,env(safe-area-inset-left));top:12px;z-index:20;display:flex;align-items:center;gap:4px;padding:5px;background:rgba(16,20,20,.91);border:1px solid #72817c88;border-radius:13px;box-shadow:0 4px 18px #0003;color:#f1eadb;touch-action:manipulation;}
.ra-camera-controls button{min-width:42px;min-height:42px;border:0;border-radius:8px;background:#ffffff0c;color:inherit;padding:0 10px;font:12px system-ui;cursor:pointer;}
.ra-camera-controls button:hover,.ra-camera-controls button[aria-pressed=true]{background:#647d6577}.ra-camera-controls button:disabled{opacity:.3;cursor:default}.ra-camera-controls button:focus-visible{outline:2px solid #d4e3c7;outline-offset:1px}
.ra-camera-controls .ra-zoom-step{font-size:23px}.ra-camera-controls output{font:12px ui-monospace,monospace;min-width:36px;text-align:center;}
.ra-overview{position:absolute;right:max(12px,env(safe-area-inset-right));top:78px;z-index:19;border:1px solid #72817c88;border-radius:10px;background:#121919e8;padding:6px;color:#e6e5d7;box-shadow:0 4px 16px #0004;}
.ra-overview[hidden]{display:none}.ra-overview span{display:block;font:10px system-ui;letter-spacing:.05em;margin:0 0 5px 2px}.ra-overview canvas{display:block;width:160px;height:100px;touch-action:none;border-radius:4px;cursor:crosshair;}
.ra-camera-help{position:absolute;left:14px;top:76px;z-index:19;pointer-events:none;color:#eee6d4;background:#121919c9;border-radius:7px;padding:6px 8px;font:10px system-ui;}
body.ra-map-focus #topbar,body.ra-map-focus .sc-pill,body.ra-map-focus .sc-panel,body.ra-map-focus #layersPanel,body.ra-map-focus #analysisPanel,body.ra-map-focus #conditionInspector{display:none!important}
body.ra-map-focus #stage{inset:0!important}
@media(max-width:720px){.ra-camera-controls{gap:2px;padding:4px;left:8px;top:8px}.ra-camera-controls button{padding:0 8px}.ra-camera-controls output{min-width:32px}.ra-camera-help{display:none}.ra-overview{top:69px}.ra-overview canvas{width:128px;height:80px}}
body.rendering .ra-camera-controls,body.rendering .ra-overview,body.rendering .ra-camera-help{display:none!important}
`;
document.head.appendChild(css);stage.classList.add('ra-navigable');stage.tabIndex=0;stage.setAttribute('role','region');stage.setAttribute('aria-label','Interactive city map');stage.setAttribute('aria-describedby','raCameraHelp');
var controls=document.createElement('div');controls.className='ra-camera-controls';controls.dataset.raNavigation='true';controls.setAttribute('role','group');controls.setAttribute('aria-label','Map navigation');
controls.innerHTML='<button id="raZoomOut" class="ra-zoom-step" type="button" aria-label="Zoom out" title="Zoom out (minus)">−</button><output id="raZoomAmount" aria-label="Map zoom">1.0×</output><button id="raZoomIn" class="ra-zoom-step" type="button" aria-label="Zoom in" title="Zoom in (plus)">+</button><button id="raFitMap" type="button" title="Fit the whole map (0 or Home)">Fit map</button><button id="raFocusMap" type="button" aria-pressed="false" title="Hide panels for more map space (F; Escape to return)">Focus</button><button id="raMiniToggle" type="button" aria-pressed="false" title="Toggle the clickable overview map">Mini</button>';
stage.appendChild(controls);
var detail=document.createElement('canvas');detail.className='ra-map-detail';detail.hidden=true;detail.setAttribute('aria-hidden','true');stage.appendChild(detail);
var amount=document.getElementById('raZoomAmount'),minus=document.getElementById('raZoomOut'),plus=document.getElementById('raZoomIn'),focusButton=document.getElementById('raFocusMap'),miniToggle=document.getElementById('raMiniToggle');
minus.onclick=function(){zoomAt(zoom/1.5);};plus.onclick=function(){zoomAt(zoom*1.5);};document.getElementById('raFitMap').onclick=fit;focusButton.onclick=function(){setFocus(!focusMode);};miniToggle.onclick=function(){overview=!overview;update();};
var help=document.createElement('div');help.id='raCameraHelp';help.className='ra-camera-help';help.textContent='Drag to move · pinch / wheel to zoom · double-tap to get closer · 0 to fit';stage.appendChild(help);
var miniWrap=document.createElement('div');miniWrap.className='ra-overview';miniWrap.dataset.raNavigation='true';miniWrap.innerHTML='<span>OVERVIEW · tap to move</span><canvas width="320" height="200" tabindex="0" aria-label="Map overview: tap to recenter, arrows to pan"></canvas>';stage.appendChild(miniWrap);var mini=miniWrap.querySelector('canvas');
mini.addEventListener('pointerdown',function(e){e.preventDefault();e.stopPropagation();if(!ready)return;mini.setPointerCapture(e.pointerId);recenter(e);});mini.addEventListener('pointermove',function(e){if(mini.hasPointerCapture(e.pointerId))recenter(e);});mini.addEventListener('pointerup',function(e){if(mini.hasPointerCapture(e.pointerId))mini.releasePointerCapture(e.pointerId);});
// The preserved Seed Console has a document-level double-touch chrome shortcut.
// Map gestures belong to this camera, not to that recording shortcut.
stage.addEventListener('touchend',function(e){e.stopPropagation();},{passive:true});
stage.addEventListener('pointerdown',pointerDown);stage.addEventListener('pointermove',pointerMove);stage.addEventListener('pointerup',pointerEnd);stage.addEventListener('pointercancel',pointerEnd);stage.addEventListener('lostpointercapture',function(e){if(pointers.has(e.pointerId))cancelGesture();});stage.addEventListener('wheel',wheel,{passive:false});
stage.addEventListener('dblclick',function(e){if(!excluded(e.target)&&!(window.RoadAtlasConditions&&RoadAtlasConditions.isInspecting())){e.preventDefault();zoomAt(zoom*2,e.clientX,e.clientY);}});
stage.addEventListener('keydown',function(e){
 if(e.target!==stage&&e.target!==mini)return;var handled=true;
 if(e.key==='+'||e.key==='=')zoomAt(zoom*1.5);else if(e.key==='-')zoomAt(zoom/1.5);else if(e.key==='0'||e.key==='Home')fit();
 else if(e.key==='ArrowLeft')pan(64,0);else if(e.key==='ArrowRight')pan(-64,0);else if(e.key==='ArrowUp')pan(0,64);else if(e.key==='ArrowDown')pan(0,-64);else if(e.key.toLowerCase()==='f')setFocus(!focusMode);else handled=false;
 if(handled)e.preventDefault();
});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&focusMode&&!document.querySelector('dialog[open]')){setFocus(false);stage.focus({preventScroll:true});}});
addEventListener('blur',cancelGesture);document.addEventListener('visibilitychange',function(){if(document.hidden)cancelGesture();});
if(window.ResizeObserver){new ResizeObserver(schedule).observe(stage);new ResizeObserver(schedule).observe(controls);}addEventListener('resize',schedule);
// Observe only once until the old Seed Console creates its floating controls.
var mo=new MutationObserver(function(){pill=document.querySelector('.sc-pill');if(pill){mo.disconnect();if(window.ResizeObserver)new ResizeObserver(schedule).observe(pill);schedule();}});mo.observe(document.body,{childList:true});
var originalDraw=drawStatic;drawStatic=function(){originalDraw();sceneEpoch++;update();};
window.RoadAtlasNavigation={version:VERSION,disabled:false,getView:getView,fit:fit,zoomAt:zoomAt,pan:pan,screenToWorld:screenToWorld,worldToScreen:worldToScreen,queryParameters:queryParameters,setFocus:setFocus,refresh:update,cancelGesture:cancelGesture};
schedule();
})();
