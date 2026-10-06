/* Moor Canvas stays in the Pulse desktop; its iframe isolates compiler state. */
(function(){
'use strict';
if(new URLSearchParams(location.search).has('workspace-tool'))return;
const style=document.createElement('style');style.textContent=`.pcw{position:fixed;left:260px;top:90px;width:calc(100vw - 290px);height:calc(100dvh - 120px);min-width:320px;min-height:300px;max-width:100vw;max-height:100dvh;display:flex;flex-direction:column;resize:both;overflow:hidden;background:#100d19;border:1px solid #ffffff20;border-radius:14px;box-shadow:0 24px 80px #0009;z-index:9000}.pcw-head{position:static!important;inset:auto!important;width:100%!important;height:auto!important;transform:none!important;display:flex;align-items:center;gap:8px;padding:8px 12px;min-height:44px;background:#1b1529;cursor:move;touch-action:none}.pcw-head strong{margin-right:auto;font:500 14px system-ui}.pcw-head button{font:14px system-ui;border:0;border-radius:7px;background:#ffffff12;color:white;min-height:30px;padding:5px 10px;cursor:pointer}.pcw iframe{width:100%;flex:1;min-height:0;border:0}.pcw.full{inset:70px 10px 10px!important;width:auto!important;height:auto!important;resize:none}@media(max-width:760px){.pcw{left:8px;top:70px;width:calc(100vw - 16px);height:calc(100dvh - 90px);min-width:280px}}`;document.head.append(style);
let win=null;
function open(page='more-canvas.html'){
 const url=new URL(page,location.href);if(url.origin!==location.origin||!url.pathname.endsWith('/more-canvas.html'))return;
 url.searchParams.set('release','20261006-canvas-mix2');
 if(win){if(win.querySelector('iframe').src!==url.href)win.querySelector('iframe').src=url.href;win.style.display='flex';return;}
 win=document.createElement('section');win.className='pcw';win.setAttribute('aria-label','Moor Canvas window');win.innerHTML='<header class="pcw-head"><strong>Moor Canvas</strong><button data-max aria-label="Maximize Moor Canvas">Expand</button><button data-close aria-label="Close Moor Canvas">×</button></header><iframe title="Moor Canvas compiler workspace"></iframe>';
 document.body.append(win);win.querySelector('iframe').src=url.href;
 win.querySelector('[data-close]').onclick=()=>{win.remove();win=null;};
 win.querySelector('[data-max]').onclick=()=>{win.classList.toggle('full');win.querySelector('[data-max]').textContent=win.classList.contains('full')?'Restore':'Expand';};
 const head=win.querySelector('header');let drag=null;
 head.onpointerdown=e=>{if(e.target.closest('button')||win.classList.contains('full'))return;const b=win.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,left:b.left,top:b.top};head.setPointerCapture(e.pointerId);win.querySelector('iframe').style.pointerEvents='none';};
 head.onpointermove=e=>{if(!drag)return;win.style.left=Math.max(0,Math.min(innerWidth-80,drag.left+e.clientX-drag.x))+'px';win.style.top=Math.max(0,Math.min(innerHeight-44,drag.top+e.clientY-drag.y))+'px';};
 head.onpointerup=head.onpointercancel=()=>{drag=null;if(win)win.querySelector('iframe').style.pointerEvents='';};
}
window.PulseCanvasWindow={open};
function install(){if(typeof openComponent!=='function')return;const original=openComponent;openComponent=function(id){if(id==='more-canvas'){open();return;}return original.apply(this,arguments);};}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueMicrotask(install),{once:true});else install();
document.addEventListener('click',e=>{const b=e.target.closest('[data-open="more-canvas"]');if(b){e.preventDefault();e.stopImmediatePropagation();open();return;}const a=e.target.closest('a[href]');if(!a)return;const u=new URL(a.href,location.href);if(u.origin===location.origin&&u.pathname.endsWith('/more-canvas.html')){e.preventDefault();e.stopPropagation();open(u.href);}},true);
window.addEventListener('message',e=>{if(e.origin!==location.origin||e.data?.type!=='moor:open-canvas')return;open(e.data.page);});
})();
