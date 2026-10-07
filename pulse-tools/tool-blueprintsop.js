/* Blueprint SOP — Pulse adapter.
 * Mounts the standalone blueprint-sop.html (the interactive Standard
 * Operating Procedure: chain of command, L1-L5 recursive planning
 * layers, automatic gates, discipline) in an isolated iframe, so its
 * globals never touch the dashboard's.
 *
 * TAGS: tool:blueprintsop | cat:interface | kind:doctrine |
 *       dep:blueprint-standard | prov:funnel |
 *       src:blueprint-sop.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='blueprint-sop.html';
  frame.title=(c&&c.label)||'Blueprint SOP';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#080b10;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.blueprintsop={mount:mount,unmount:unmount};
})();
