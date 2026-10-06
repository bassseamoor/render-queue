/* MOOR Capability Memory v1 — typed verified capability graph + candidate compositions. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorCapabilityMemory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='moor-capability-memory-v1';let mem=null;
const A=root&&root.MoorAssembly||(typeof require==='function'?require('./moor-assembly-core.js'):null);
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}function hash(x){return A?A.hash(x):String(JSON.stringify(x).length);}
function blank(){return {schema:'moor.capability-memory',version:1,bundles:{},capabilities:{},assemblies:{},compositions:{},handoffs:[],adapters:{},usage:{events:[],counts:{}},updated_at:null};}
function read(){
  if(mem)return mem;
  try{
    if(root&&root.localStorage){
      const x=JSON.parse(root.localStorage.getItem(KEY)||'null');
      if(x&&x.version){
        if(!x.usage)x.usage={events:[],counts:{}};
        if(!Array.isArray(x.usage.events))x.usage.events=[];
        if(!x.usage.counts||typeof x.usage.counts!=='object')x.usage.counts={};
        mem=x;return mem;
      }
    }
  }catch(e){}
  mem=blank();return mem;
}
function save(){const s=read();s.updated_at=new Date().toISOString();try{if(root&&root.localStorage)root.localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}return s;}
function statusVerified(s){return s==='machine-verified'||s==='human-approved'||s==='canonical';}
function recordUse(type,data){
  type=String(type||'event');const s=read();if(!s.usage)s.usage={events:[],counts:{}};
  s.usage.counts[type]=(s.usage.counts[type]||0)+1;
  const ev={id:'use:'+hash([type,Date.now(),Math.random()]),type,at:new Date().toISOString(),data:clone(data||{})};
  s.usage.events.push(ev);if(s.usage.events.length>5000)s.usage.events=s.usage.events.slice(-5000);
  save();try{if(root&&root.dispatchEvent)root.dispatchEvent(new CustomEvent('moor:refinery-usage',{detail:ev}));}catch(e){}
  return clone(ev);
}
function stats(){
  const s=read(),counts=clone(s.usage&&s.usage.counts||{}),caps=Object.values(s.capabilities||{}),comps=Object.values(s.compositions||{});
  const requestsReused=(counts.capability_reference_retrieved||0)+(counts.request_resolved_from_reference||0);
  const assemblies=(counts.assembly_succeeded||0),attempts=(counts.assembly_attempted||0);
  const avoided=(counts.request_resolved_from_reference||0)+assemblies;
  const funnelUses=counts.capability_handoff_consumed_by_funnel||0;
  return {
    inventory:{
      crystal_bundles:Object.keys(s.bundles||{}).length,
      assemblies:Object.keys(s.assemblies||{}).length,
      capabilities:caps.length,
      verified_capabilities:caps.filter(c=>statusVerified(c.status)).length,
      active_verified_capabilities:caps.filter(c=>statusVerified(c.status)&&c.lifecycle!=='deprecated'&&c.lifecycle!=='quarantined').length,
      deprecated_capabilities:caps.filter(c=>c.lifecycle==='deprecated').length,
      quarantined_capabilities:caps.filter(c=>c.lifecycle==='quarantined').length,
      candidate_compositions:comps.filter(c=>c.status==='candidate-unverified').length,
      verified_compositions:comps.filter(c=>c.status==='machine-verified').length,
      adapters:Object.keys(s.adapters||{}).length
    },
    usage:{
      counts,requests_reused:requestsReused,
      capability_handoffs_consumed:funnelUses,
      model_free_assemblies_succeeded:assemblies,
      assembly_success_rate:attempts?assemblies/attempts:0,
      deterministic_reuse_events:avoided,
      missing_executors:counts.assembly_missing_executor||0,
      estimated_repeated_reasoning_avoided:avoided
    },
    recent:(s.usage&&s.usage.events||[]).slice(-100).reverse(),
    updated_at:s.updated_at
  };
}

function types(x){return [...new Set((Array.isArray(x)?x:[]).map(v=>String(v).trim().toLowerCase()).filter(Boolean))].sort();}
function compatibleType(outT,inT,state){outT=String(outT).toLowerCase();inT=String(inT).toLowerCase();if(outT===inT||inT==='any'||outT==='any')return {ok:true,mode:'exact'};const a=state.adapters[outT+'→'+inT];return a&&statusVerified(a.status)?{ok:true,mode:'adapter',adapter:a}:null;}
function normalizeCapability(c,bundle){c=clone(c||{});if(!c.capability_id)c.capability_id='capability:'+hash({bundle:bundle&&bundle.bundle_id,c});c.version=String(c.version||'1');c.status=c.status||bundle&&bundle.status||'specified';c.lifecycle=c.lifecycle||'active';c.supersedes=[...new Set((Array.isArray(c.supersedes)?c.supersedes:[]).map(String))];c.provides=types(c.provides);c.requires=types(c.requires);c.input_types=types(c.input_types);c.output_types=types(c.output_types);c.knobs=c.knobs||{};c.events=types(c.events);c.state=c.state||{};c.side_effects=types(c.side_effects);c.compatibility=c.compatibility||{};c.implementation_ref=c.implementation_ref||bundle&&bundle.implementation_ref||null;c.assembly_contract_hash=c.assembly_contract_hash||bundle&&bundle.assembly_contract&&bundle.assembly_contract.content_hash||null;c.evidence_refs=Array.isArray(c.evidence_refs)?c.evidence_refs:bundle&&bundle.evidence?[bundle.evidence.evidence_id||('evidence:'+hash(bundle.evidence))]:[];c.content_hash=hash({...c,content_hash:undefined,lifecycle:undefined,deprecation:undefined,quarantine:undefined});return c;}
function ingest(bundle){bundle=clone(bundle||{});if(!bundle.bundle_id)bundle.bundle_id='crystal:'+hash(bundle);if(!bundle.content_hash)bundle.content_hash=hash({...bundle,content_hash:undefined});const s=read(),prior=s.bundles[bundle.content_hash];if(prior)return {added:false,bundle:clone(prior),candidates:inferCandidates()};
  s.bundles[bundle.content_hash]=bundle;recordUse('crystal_bundle_ingested',{bundle_hash:bundle.content_hash,status:bundle.status});if(bundle.assembly_contract)s.assemblies[bundle.assembly_contract.content_hash]=bundle.assembly_contract;
  (bundle.capability_delta||[]).forEach(c=>{const n=normalizeCapability(c,bundle);const key=n.capability_id+'@'+n.version;const old=s.capabilities[key];if(old&&statusVerified(old.status)&&old.content_hash!==n.content_hash){recordUse('capability_version_conflict',{capability_id:n.capability_id,version:n.version,existing_hash:old.content_hash,incoming_hash:n.content_hash});return;}if(!old||(!statusVerified(old.status)&&statusVerified(n.status))){if(old&&old.lifecycle)n.lifecycle=old.lifecycle;if(old&&old.deprecation)n.deprecation=old.deprecation;if(old&&old.quarantine)n.quarantine=old.quarantine;s.capabilities[key]=n;if(statusVerified(n.status))recordUse('verified_capability_registered',{capability_id:n.capability_id,version:n.version,status:n.status});}
    n.supersedes.forEach(ref=>{
      Object.entries(s.capabilities||{}).forEach(([priorKey,prior])=>{
        if(priorKey===key)return;
        const matches=priorKey===ref||prior.capability_id===ref||prior.capability_id+'@'+prior.version===ref;
        if(!matches)return;
        prior.lifecycle='deprecated';
        prior.deprecation={at:new Date().toISOString(),reason:'superseded',replacement_id:n.capability_id,replacement_version:n.version};
        recordUse('capability_superseded',{prior:priorKey,by:key});
      });
    });
  });
  save();const candidates=inferCandidates();try{if(root&&root.dispatchEvent)root.dispatchEvent(new CustomEvent('moor:capability-memory',{detail:{bundle,candidates}}));}catch(e){}
  return {added:true,bundle:clone(bundle),candidates};
}
function inferCandidates(){
  const s=read(),caps=Object.values(s.capabilities||{}).filter(c=>statusVerified(c.status)&&c.lifecycle!=='quarantined'&&c.lifecycle!=='deprecated'),made=[];
  for(const a of caps){
    for(const b of caps){
      if(a===b)continue;
      for(const ot of a.output_types||[]){
        for(const it of b.input_types||[]){
          const m=compatibleType(ot,it,s);if(!m)continue;
          const id='composition:'+hash([a.content_hash,b.content_hash,ot,it,m.mode]);
          if(s.compositions[id])continue;
          s.compositions[id]={
            composition_id:id,status:'candidate-unverified',from:a.capability_id,to:b.capability_id,
            from_version:a.version,to_version:b.version,output_type:ot,input_type:it,match:m.mode,
            adapter_id:m.adapter&&m.adapter.adapter_id||null,
            tests:[{id:'contract-compatible',kind:'deterministic',status:'pending'}],
            created_at:new Date().toISOString()
          };
          made.push(s.compositions[id]);
          recordUse('candidate_composition_inferred',{composition_id:id,from:a.capability_id,to:b.capability_id,output_type:ot,input_type:it});
        }
      }
    }
  }
  save();return clone(made);
}
function registerAdapter(a){a=clone(a||{});if(!a.from_type||!a.to_type)throw Error('adapter requires from_type/to_type');a.adapter_id=a.adapter_id||'adapter:'+hash(a);a.status=a.status||'specified';read().adapters[String(a.from_type).toLowerCase()+'→'+String(a.to_type).toLowerCase()]=a;save();return clone(a);}
function promoteComposition(id,evidence){const s=read(),c=s.compositions[id];if(!c)throw Error('unknown composition');evidence=clone(evidence||{});if(!statusVerified(evidence.status))throw Error('verified evidence required');if(Array.isArray(evidence.tests)&&evidence.tests.some(t=>t.ok===false))throw Error('composition tests failed');c.status='machine-verified';c.evidence=evidence;c.verified_at=new Date().toISOString();recordUse('verified_composition_promoted',{composition_id:id});save();return clone(c);}
function capabilityKey(id,version){return String(id)+'@'+String(version||'1');}
function getCapability(id,version){const s=read();if(version)return clone(s.capabilities[capabilityKey(id,version)]||null);const xs=Object.values(s.capabilities||{}).filter(c=>c.capability_id===String(id));xs.sort((a,b)=>String(b.version).localeCompare(String(a.version),undefined,{numeric:true}));return clone(xs[0]||null);}
function listCapabilities(opts){opts=opts||{};let xs=Object.values(read().capabilities||{});if(opts.verified!==false)xs=xs.filter(c=>statusVerified(c.status));if(opts.include_quarantined!==true)xs=xs.filter(c=>c.lifecycle!=='quarantined');if(opts.include_deprecated!==true)xs=xs.filter(c=>c.lifecycle!=='deprecated');if(opts.provides){const q=String(opts.provides).toLowerCase();xs=xs.filter(c=>(c.provides||[]).includes(q));}return clone(xs);}
function deprecateCapability(id,version,input){input=clone(input||{});const s=read(),key=capabilityKey(id,version),c=s.capabilities[key];if(!c)throw Error('unknown capability');c.lifecycle='deprecated';c.deprecation={at:new Date().toISOString(),reason:String(input.reason||'superseded'),replacement_id:input.replacement_id||null,replacement_version:input.replacement_version||null};recordUse('capability_deprecated',{capability_id:c.capability_id,version:c.version,replacement_id:c.deprecation.replacement_id});save();return clone(c);}
function quarantineCapability(id,version,input){input=clone(input||{});const s=read(),key=capabilityKey(id,version),c=s.capabilities[key];if(!c)throw Error('unknown capability');c.lifecycle='quarantined';c.quarantine={at:new Date().toISOString(),reason:String(input.reason||'integrity or safety hold'),evidence_ref:input.evidence_ref||null};recordUse('capability_quarantined',{capability_id:c.capability_id,version:c.version,reason:c.quarantine.reason});save();return clone(c);}
function preferredCapability(query){query=query||{};let xs=listCapabilities({verified:true,provides:query.provides,include_deprecated:false,include_quarantined:false});if(query.capability_id)xs=xs.filter(c=>c.capability_id===String(query.capability_id));if(query.input_type){const t=String(query.input_type).toLowerCase();xs=xs.filter(c=>(c.input_types||[]).includes(t)||(c.input_types||[]).includes('any'));}xs.sort((a,b)=>String(b.version).localeCompare(String(a.version),undefined,{numeric:true}));const hit=xs[0]||null;if(hit)recordUse('preferred_capability_resolved',{capability_id:hit.capability_id,version:hit.version,provides:query.provides||null});return clone(hit);}
function factoryGraph(){
  const s=read(),nodes=[],edges=[],seen=new Set();
  function node(id,kind,data){if(!id||seen.has(id))return;seen.add(id);nodes.push({id,kind,...clone(data||{})});}
  function edge(from,to,type,data){if(from&&to)edges.push({from,to,type,...clone(data||{})});}
  Object.entries(s.capabilities||{}).forEach(([key,cap])=>{
    node('cap:'+key,'machine',{label:cap.capability_id,version:cap.version,status:cap.status,lifecycle:cap.lifecycle||'active',implementation_ref:cap.implementation_ref||null});
    if(cap.assembly_contract_hash)edge('cap:'+key,'assembly:'+cap.assembly_contract_hash,'assembled_by');
    (cap.supersedes||[]).forEach(ref=>{
      const prior=Object.entries(s.capabilities||{}).find(([pk,p])=>pk===ref||p.capability_id===ref||p.capability_id+'@'+p.version===ref);
      if(prior)edge('cap:'+key,'cap:'+prior[0],'supersedes');
    });
  });
  Object.entries(s.assemblies||{}).forEach(([id,a])=>node('assembly:'+id,'fixture',{label:a.artifact_id||id,version:a.artifact_version||a.version||'1'}));
  Object.entries(s.compositions||{}).forEach(([id,x])=>{
    node(id,'connection',{label:(x.from||'?')+' → '+(x.to||'?'),status:x.status||'candidate-unverified'});
    const from=Object.keys(s.capabilities||{}).find(k=>s.capabilities[k].capability_id===x.from&&String(s.capabilities[k].version)===String(x.from_version||s.capabilities[k].version));
    const to=Object.keys(s.capabilities||{}).find(k=>s.capabilities[k].capability_id===x.to&&String(s.capabilities[k].version)===String(x.to_version||s.capabilities[k].version));
    if(from)edge('cap:'+from,id,'feeds');
    if(to)edge(id,'cap:'+to,'feeds');
  });
  Object.entries(s.adapters||{}).forEach(([id,a])=>node('adapter:'+id,'adapter',{label:id,status:a.status||'specified'}));
  return {schema:'moor.software-factory-graph',version:1,nodes,edges,counts:{machines:Object.keys(s.capabilities||{}).length,fixtures:Object.keys(s.assemblies||{}).length,connections:Object.keys(s.compositions||{}).length,adapters:Object.keys(s.adapters||{}).length}};
}
function snapshot(){return clone(read());}
function clearForTests(){mem=blank();return mem;}
return Object.freeze({version:2,ingest,inferCandidates,registerAdapter,promoteComposition,getCapability,listCapabilities,preferredCapability,deprecateCapability,quarantineCapability,factoryGraph,snapshot,statusVerified,recordUse,stats,clearForTests,save});
});