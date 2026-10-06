/* Canonical Funnel evidence is imported with system/fallback provenance. */
(function(){
'use strict';
async function install(){if(new URLSearchParams(location.search).has('workspace-tool')||!window.MOOR?.request||!window.PulseReferences)return;try{const marker='moor-effects-blueprint-import-v1';if(localStorage.getItem(marker))return;const b=await(await fetch('docs/effects-studio.blueprint.json?v=20261006-fx1')).json();const context={page:'effects-studio',blueprint:b.id,provenance:'fallback-system-decisions'};
 const initial=await MOOR.request({input:b.page0,source:'agent-effects-research',context});
 const evidence=await MOOR.request({input:'Create effects studio using researched architectures and existing generators '+JSON.stringify({research:b.research,inventory:b.inventory}),source:'agent-effects-research',forceFunnel:true,context});
 const queued=await MOOR.request({input:'Implement effects blueprint '+JSON.stringify(b.spec),source:'agent-effects-research',forceFunnel:true,context});
 const execution=await MOOR.request({input:'Implement effects blueprint '+JSON.stringify(b.spec),source:'agent-effects-research',resolved:true,done_criteria:b.doneCriteria,context});
 PulseReferences.add({id:'blueprint:'+b.id,kind:'blueprint',title:'Procedural Effects Studio',summary:'Research-backed reusable effects authoring with deterministic recipes and automatic Wonder Feed generators.',status:'observed',source:'System research and build',provenance:'fallback',implementation_ref:'effects-studio.html',doc_ref:'docs/effects-studio.md',data:{blueprint:b,routes:{initial,evidence,queued,execution},ownerIntentConfirmed:false}});localStorage.setItem(marker,'1');
 }catch(e){console.warn('Effects Funnel evidence:',e.message);}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
