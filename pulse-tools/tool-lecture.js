/* LECTURE — Pulse adapter.
 * Mounts the standalone lecture.html (the speaker: a fullscreen wall of
 * scrolling words generated endlessly from the Moor OS build canon)
 * in an isolated iframe, so its globals never touch the dashboard's.
 * The page itself ships in the repo root.
 *
 * TAGS: tool:lecture | cat:creation | kind:reference |
 *       prov:funnel-sealed | see:objective | src:lecture.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='lecture.html';
  frame.title=(c&&c.label)||'LECTURE';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#000;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode) frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.lecture={mount:mount,unmount:unmount};
})();
