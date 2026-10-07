/* AWE — Pulse adapter.
 * Mounts the standalone awe.html (the standing-there generator, built from
 * Sebastian's distilled intent data) in an isolated iframe, so its globals
 * never touch the dashboard's. The page itself ships in the repo root.
 *
 * TAGS: tool:awe | cat:creation | kind:generative |
 *       dep:localstorage | prov:seeded-prose prov:intent-data |
 *       see:hearth | src:awe.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='awe.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'AWE';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#0d0b08;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode) frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.awe={mount:mount,unmount:unmount};
})();
