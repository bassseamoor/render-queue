/* DEV-01 blueprint — Pulse adapter.
 * Mounts the standalone blueprint-devenv.html (the build blueprint for
 * the Pulse dev environment: the empty cathedral) in an isolated iframe,
 * so its globals never touch the dashboard's.
 *
 * TAGS: tool:blueprintdevenv | cat:interface | kind:blueprint |
 *       dep:none | prov:funnel |
 *       src:blueprint-devenv.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='blueprint-devenv.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'DEV-01 blueprint';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#080705;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.blueprintdevenv={mount:mount,unmount:unmount};
})();
