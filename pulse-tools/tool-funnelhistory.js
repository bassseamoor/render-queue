/* Funnel History — Pulse adapter.
 * Mounts the standalone funnel-history.html (constitutional history
 * and design biography of the Funnel) in an isolated iframe.
 *
 * TAGS: tool:funnelhistory | cat:reference | kind:history |
 *       dep:none | prov:sebastian |
 *       src:funnel-history.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='funnel-history.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Funnel History';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#07090e;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.funnelhistory={mount:mount,unmount:unmount};
})();
