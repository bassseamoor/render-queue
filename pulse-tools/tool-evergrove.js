/* EVERGROVE — Pulse adapter.
 * Mounts the standalone evergrove.html (the Moor-built good-experience cultivator:
 * procedural happy situations + blueprint emitter + blueprint library) in an
 * isolated iframe, so its globals never touch the dashboard's. The page itself
 * ships in the repo root.
 *
 * TAGS: tool:evergrove | cat:creation | kind:generative |
 *       dep:localstorage | prov:seeded-prose prov:intent-data |
 *       see:awe | src:evergrove.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='evergrove.html';
  frame.title=(c&&c.label)||'EVERGROVE';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#0a0e08;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode) frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.evergrove={mount:mount,unmount:unmount};
})();
