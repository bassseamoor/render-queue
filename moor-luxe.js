/* MOOR Luxe Spatial UI v1 — shared shell activation and same-origin tool inheritance. */
(function(){
'use strict';
function addBodyClass(doc,cls){
  try{if(doc&&doc.body&&!doc.body.classList.contains(cls))doc.body.classList.add(cls);}catch(e){}
}
function injectFrame(frame){
  try{
    const doc=frame.contentDocument;if(!doc||!doc.head)return;
    addBodyClass(doc,'moor-luxe-embedded');
    if(!doc.querySelector('link[data-moor-luxe]')){
      const l=doc.createElement('link');l.rel='stylesheet';l.href=new URL('moor-luxe.css',location.href).href;l.dataset.moorLuxe='1';doc.head.appendChild(l);
    }
  }catch(e){}
}
function bindFrame(frame){
  if(!frame||frame.dataset.moorLuxeBound)return;
  frame.dataset.moorLuxeBound='1';
  frame.addEventListener('load',()=>injectFrame(frame));
  injectFrame(frame);
}
function scan(){document.querySelectorAll('iframe').forEach(bindFrame);}
function start(){
  addBodyClass(document,'moor-luxe');
  scan();
  const mo=new MutationObserver(scan);mo.observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();