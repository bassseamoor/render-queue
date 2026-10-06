/* OBJECTIVE — Pulse adapter.
 * Mounts the standalone objective.html (the ten-question outside-in instrument:
 * tube/rod/catalyst vocabulary, questions facing outward, open-ended answers)
 * in an isolated iframe, so its globals never touch the dashboard's.
 * The page itself ships in the repo root.
 *
 * TAGS: tool:objective | cat:creation | kind:reference |
 *       prov:funnel-sealed | see:hub | src:objective.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='objective.html';
  frame.title=(c&&c.label)||'OBJECTIVE';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#0e0f13;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode) frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.objective={mount:mount,unmount:unmount};
})();
