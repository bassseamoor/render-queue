/* MOOR Refinery → singular Funnel capability handoff. Non-authoritative. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorCapabilityHandoff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';const KEY='moor-capability-handoff-v1';const A=root&&root.MoorAssembly||(typeof require==='function'?require('./moor-assembly-core.js'):null);
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}function hash(x){return A?A.hash(x):String(JSON.stringify(x).length);}
function verified(s){return s==='machine-verified'||s==='human-approved'||s==='canonical';}
function makePacket(bundle){
  bundle=clone(bundle||{});const caps=(bundle.capability_delta||[]).filter(c=>verified(c.status));
  const packet={schema:'moor.capability-handoff',version:1,handoff_id:'handoff:'+hash([bundle.content_hash,caps.map(c=>c.content_hash||c.capability_id)]),
    source_system:'MOOR Refinery',target_system:'MOOR Funnel',authority:'reference-only',bundle_hash:bundle.content_hash,
    verified_capabilities:caps,assembly_contract:bundle.assembly_contract||null,learning_capsule:bundle.learning_capsule||null,
    candidates:[],created_at:new Date().toISOString()};
  return packet;
}
function refs(packet){
  const out=[];(packet.verified_capabilities||[]).forEach(c=>out.push({id:'capability:'+hash(c),kind:'capability',title:c.capability_id,summary:'Verified reusable capability handed from MOOR Refinery.',status:c.status,source:'MOOR Refinery',source_id:c.capability_id,provenance:'verified',implementation_ref:c.implementation_ref||null,data:c}));
  if(packet.assembly_contract)out.push({id:'assembly:'+packet.assembly_contract.content_hash,kind:'assembly',title:'Assembly · '+packet.assembly_contract.artifact_id,summary:'Deterministic model-free assembly contract.',status:'machine-verified',source:'MOOR Refinery',provenance:'procedural',data:packet.assembly_contract});
  out.push({id:packet.handoff_id,kind:'handoff',title:'Capability handoff',summary:'Reference-only capability delta from MOOR Refinery to the singular Funnel.',status:'machine-verified',source:'MOOR Refinery',provenance:'verified',data:packet});
  return out;
}
function publish(packetOrBundle){
  const packet=packetOrBundle&&packetOrBundle.schema==='moor.capability-handoff'?clone(packetOrBundle):makePacket(packetOrBundle);
  if(!packet.verified_capabilities.length)return {published:false,reason:'no verified capabilities',packet};
  const rs=refs(packet);try{if(root&&root.PulseReferences)rs.forEach(r=>root.PulseReferences.add(r));}catch(e){}
  try{if(root&&root.localStorage){let q=JSON.parse(root.localStorage.getItem(KEY)||'[]');if(!Array.isArray(q))q=[];if(!q.some(x=>x.handoff_id===packet.handoff_id))q.push(packet);root.localStorage.setItem(KEY,JSON.stringify(q.slice(-500)));}}catch(e){}
  try{if(root&&root.dispatchEvent)root.dispatchEvent(new CustomEvent('moor:capability-handoff',{detail:packet}));}catch(e){}
  return {published:true,packet,references:rs};
}
function publishBundle(bundle){return publish(makePacket(bundle));}
function fromMemory(memory){const s=memory&&memory.snapshot?memory.snapshot():memory||{},packets=[];for(const b of Object.values(s.bundles||{})){const p=makePacket(b);if(p.verified_capabilities.length)packets.push(p);}return packets;}
return Object.freeze({version:1,makePacket,publish,publishBundle,fromMemory,refs});
});