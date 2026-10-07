/* Blueprint SOP — Pulse adapter.
 * Mounts the standalone blueprint-sop.html (the Standard Operating Procedure
 * for writing bulletproof Blueprints) in an isolated iframe.
 *
 * TAGS: tool:blueprintsop | cat:interface | kind:sop |
 *       dep:none | prov:funnel |
 *       src:blueprint-sop.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='blueprint-sop.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Blueprint SOP';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#07090e;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.blueprintsop={mount:mount,unmount:unmount};
})();
