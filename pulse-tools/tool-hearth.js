/* HEARTH — Pulse adapter.
 * Mounts the standalone hearth.html (the playable HEARTH slice, a Moor-built game)
 * in an isolated iframe, so its globals never touch the dashboard's.
 * The page itself ships in the repo root.
 *
 * TAGS: tool:hearth | cat:space cat:creation | kind:interactive |
 *       dep:localstorage | prov:persistent-world prov:seeded-world |
 *       see:moor-beta see:living-garden | src:hearth.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='hearth.html';
  frame.title=(c&&c.label)||'HEARTH';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#0d0a07;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode) frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.hearth={mount:mount,unmount:unmount};
})();
