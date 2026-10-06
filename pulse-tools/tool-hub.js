/* HUB — Pulse adapter.
 * Mounts the standalone hub.html (the kind registry: define once, instantiate
 * as ID + parameters) in an isolated iframe, so its globals never touch the
 * dashboard's. The page itself ships in the repo root.
 *
 * TAGS: tool:hub | cat:creation | kind:generative |
 *       dep:localstorage | prov:seeded-render prov:kind-registry |
 *       see:awe | src:hub.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='hub.html';
  frame.title=(c&&c.label)||'HUB';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#0e0f13;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode) frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.hub={mount:mount,unmount:unmount};
})();
