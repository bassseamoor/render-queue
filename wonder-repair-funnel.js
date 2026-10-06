/* Import this repair as system evidence, never as owner approval. */
(function(){
'use strict';
const marker='moor-wonder-repair-import-v1';
async function install(){
 if(new URLSearchParams(location.search).has('workspace-tool')||new URLSearchParams(location.search).has('wonder-preview'))return;
 if(!window.MOOR?.request||!window.PulseReferences)return;
 try{
  if(localStorage.getItem(marker))return;
  const response=await fetch('docs/wonder-scroll-repair.blueprint.json?v=20261006-scroll-repair2');if(!response.ok)throw Error('Repair blueprint unavailable');const b=await response.json();
  const input=await MOOR.request({input:b.page0,source:'agent-repair-evidence',context:{page:'wonder-feed',blueprint:b.id}});
  const queued=await MOOR.request({input:'Implement repair blueprint '+JSON.stringify(b.spec),source:'agent-repair-evidence',forceFunnel:true,context:{page:'wonder-feed',blueprint:b.id,provenance:'fallback-system-decisions'}});
  const execution=await MOOR.request({input:'Implement repair blueprint '+JSON.stringify(b.spec),source:'agent-repair-evidence',resolved:true,done_criteria:b.doneCriteria,context:{page:'wonder-feed',blueprint:b.id,provenance:'fallback-system-decisions'}});
  PulseReferences.add({id:'blueprint:'+b.id,kind:'blueprint',title:'Wonder Feed scroll repair',summary:'Bounded rendering, preserved results, isolated previews and automatic generator registration.',status:'observed',source:'System repair',provenance:'fallback',doc_ref:'docs/wonder-generators.md',data:{blueprint:b,routes:{input,queued,execution},ownerIntentConfirmed:false}});
  localStorage.setItem(marker,'1');
 }catch(e){console.warn('Wonder repair evidence:',e.message);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
