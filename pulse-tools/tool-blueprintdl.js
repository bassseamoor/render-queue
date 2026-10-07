/* Deep Links blueprint — Pulse adapter.
 * Mounts the standalone blueprint-deep-links.html (the comic-book
 * blueprint selling the Pulse deep-link addition) in an isolated
 * iframe, so its globals never touch the dashboard's.
 *
 * TAGS: tool:blueprintdl | cat:interface | kind:blueprint |
 *       dep:none | prov:funnel |
 *       src:blueprint-deep-links.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='blueprint-deep-links.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Deep Links blueprint';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#06070d;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.blueprintdl={mount:mount,unmount:unmount};
})();
