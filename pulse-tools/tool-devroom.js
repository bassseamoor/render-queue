/* Dev Room — Pulse adapter.
 * Mounts the standalone dev-01-environment.html (DEV-01, the empty
 * cathedral: his dev room) in an isolated iframe, full-bleed, so its
 * globals never touch the dashboard's. The dashboard's floating
 * "Request anything" bar is hidden while the room is focused and
 * restored when he goes back to the catalog.
 *
 * TAGS: tool:devroom | cat:interface | kind:environment |
 *       dep:none | prov:funnel |
 *       src:dev-01-environment.html
 */
(function(){
'use strict';
var frame=null;
function setAskBar(hidden){
  try{var bar=document.getElementById('moor-request-bar');
    if(bar)bar.style.display=hidden?'none':'';}catch(e){}
}
function mount(host,c){
  setAskBar(true);
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='dev-01-environment.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Dev Room';
  frame.setAttribute('loading','eager');
  frame.setAttribute('allow','fullscreen');
  frame.style.cssText='width:100%;height:calc(100dvh - 60px);min-height:520px;border:0;display:block;'+
    'background:#050505;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
  setAskBar(false);
}
TOOLS.devroom={mount:mount,unmount:unmount};
})();
