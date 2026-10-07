/* Blueprint Production Pipeline — Pulse adapter.
 * Mounts the standalone blueprint-production.html (the interactive
 * production pipeline SOP: P1-P6 stages, component library, gap rule,
 * collaboration contract) in an isolated iframe, so its globals never
 * touch the dashboard's.
 *
 * TAGS: tool:blueprintprod | cat:interface | kind:doctrine |
 *       dep:blueprint-sop | prov:funnel |
 *       src:blueprint-production.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='blueprint-production.html';
  frame.title=(c&&c.label)||'Blueprint Factory';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#07060e;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.blueprintprod={mount:mount,unmount:unmount};
})();
