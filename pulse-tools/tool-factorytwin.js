/* Factory Twin — Pulse adapter.
 * Mounts the standalone factory-twin.html (the reconstructed twin spec page
 * with a live determinism self-check running the real factory-twin-core.js)
 * in an isolated iframe, so its globals never touch the dashboard's.
 * The core itself ships in the repo root.
 *
 * TAGS: tool:factorytwin | cat:interface | kind:system |
 *       dep:factory-twin-core | prov:funnel |
 *       src:factory-twin.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='factory-twin.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Factory Twin';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#0a0e14;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.factorytwin={mount:mount,unmount:unmount};
})();
