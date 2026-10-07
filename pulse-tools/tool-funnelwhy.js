/* Why Funnel — Pulse adapter.
 * Mounts funnel-why.html (the real reason the funnel exists) in an iframe.
 * TAGS: tool:funnelwhy | cat:reference | kind:intent | dep:none | prov:sebastian | src:funnel-why.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='funnel-why.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Why Funnel';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;border-radius:14px;background:#07090e;';
  host.appendChild(frame);
}
function unmount(){ if(frame&&frame.parentNode)frame.parentNode.removeChild(frame); frame=null; }
TOOLS.funnelwhy={mount:mount,unmount:unmount};
})();
