/* Funnel Vocabulary — Pulse adapter.
 * Mounts the standalone funnel-vocabulary.html (336 candidate Funnel
 * properties across 19 categories + anti-bullshit layer) in an iframe.
 *
 * TAGS: tool:funnelvocab | cat:reference | kind:vocabulary |
 *       dep:none | prov:funnel |
 *       src:funnel-vocabulary.html
 */
(function(){
'use strict';
var frame=null;
function mount(host,c){
  host.innerHTML='';
  frame=document.createElement('iframe');
  frame.src='funnel-vocabulary.html?v='+encodeURIComponent((c&&c.version)||'1');
  frame.title=(c&&c.label)||'Funnel Vocabulary';
  frame.setAttribute('loading','lazy');
  frame.style.cssText='width:100%;height:78vh;min-height:520px;border:0;display:block;'+
    'border-radius:14px;background:#07090e;';
  host.appendChild(frame);
}
function unmount(){
  if(frame&&frame.parentNode)frame.parentNode.removeChild(frame);
  frame=null;
}
TOOLS.funnelvocab={mount:mount,unmount:unmount};
})();
