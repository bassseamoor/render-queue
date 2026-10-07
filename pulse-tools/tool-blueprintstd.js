/* Blueprint Standard — Pulse adapter.
 * Mounts the standalone blueprint-standard.html (the doctrine page that
 * embodies the standard it sets: SELL / SPEC / SHOW) in an isolated
 * iframe, so its globals never touch the dashboard's.
 *
 * TAGS: tool:blueprintstd | cat:interface | kind:doctrine |
 *       dep:none | prov:funnel |
 *       src:blueprint-standard.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='blueprint-standard.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Blueprint Standard';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#07090e;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.blueprintstd={mount:mount,unmount:unmount};
})();
