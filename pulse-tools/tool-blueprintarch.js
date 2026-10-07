/* Architecture Blueprint — Pulse adapter.
 * Mounts the standalone blueprint-architecture.html (the 10x bulletproofed
 * end-to-end architecture Blueprint) in an isolated iframe.
 *
 * TAGS: tool:blueprintarch | cat:interface | kind:blueprint |
 *       dep:none | prov:funnel |
 *       src:blueprint-architecture.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='blueprint-architecture.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Architecture Blueprint';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#07090e;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.blueprintarch={mount:mount,unmount:unmount};
})();
