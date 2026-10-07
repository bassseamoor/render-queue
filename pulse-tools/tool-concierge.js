/* The Concierge Cut — Pulse adapter.
 * Mounts the standalone concierge-cut.html (the MOOR doctrine page for the
 * conversational commerce pattern) in an isolated iframe, so its globals
 * never touch the dashboard's. The page itself ships in the repo root.
 *
 * TAGS: tool:concierge | cat:interface | kind:doctrine |
 *       prov:conversation prov:funnel | see:suno |
 *       src:concierge-cut.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='concierge-cut.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Concierge Cut';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#0a0e14;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.concierge={mount:mount,unmount:unmount};
})();
