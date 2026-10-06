/* MOOR Capability Memory v1 — typed verified capability graph + candidate compositions. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorCapabilityMemory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='moor-capability-memory-v1';let mem=null;
const A=root&&root.MoorAssembly||(typeof require==='function'?require('./moor-assembly-core.js'):null);
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}function hash(x){return A?A.hash(x):String(JSON.stringify(x).length);}
function blank(){return {schema:'moor.capability-memory',version:1,bundles:{},capabilities:{},assemblies:{},compositions:{},handoffs:[],adapters:{},updated_at:null};}
function read(){if(mem)return mem;try{if(root&&root.localStorage){const x=JSON.parse(root.localStorage.getItem(KEY)||'null');if(x&&x.version)return mem=x;}}catch(e){}return mem=blank();}
function save(){const s=read();s.updated_at=new Date().toISOString();try{if(root&&root.localStorage)root.localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}return s;}
function statusVerified(s){return s==='machine-verified'||s==='human-approved'||s==='canonical';}
function types(x){return [...new Set((Array.isArray(x)?x:[]).map(v=>String(v).trim().toLowerCase()).filter(Boolean))].sort();}
function compatibleType(outT,inT,state){outT=String(outT).toLowerCase();inT=String(inT).toLowerCase();if(outT===inT||inT==='any'||outT==='any')return {ok:true,mode:'exact'};const a=state.adapters[outT+'→'+inT];return a&&statusVerified(a.status)?{ok:true,mode:'adapter',adapter:a}:null;}
function normalizeCapability(c,bundle){c=clone(c||{});if(!c.capability_id)c.capability_id='capability:'+hash({bundle:bundle&&bundle.bundle_id,c});c.version=String(c.version||'1');c.status=c.status||bundle&&bundle.status||'specified';c.provides=types(c.provides);c.requires=types(c.requires);c.input_types=types(c.input_types);c.output_types=types(c.output_types);c.knobs=c.knobs||{};c.events=types(c.events);c.state=c.state||{};c.side_effects=types(c.side_effects);c.compatibility=c.compatibility||{};c.implementation_ref=c.implementation_ref||bundle&&bundle.implementation_ref||null;c.assembly_contract_hash=c.assembly_contract_hash||bundle&&bundle.assembly_contract&&bundle.assembly_contract.content_hash||null;c.evidence_refs=Array.isArray(c.evidence_refs)?c.evidence_refs:bundle&&bundle.evidence?[bundle.evidence.evidence_id||('evidence:'+hash(bundle.evidence))]:[];c.content_hash=hash({...c,content_hash:undefined});return c;}
function ingest(bundle){bundle=clone(bundle||{});if(!bundle.bundle_id)bundle.bundle_id='crystal:'+hash(bundle);if(!bundle.content_hash)bundle.content_hash=hash({...bundle,content_hash:undefined});const s=read(),prior=s.bundles[bundle.content_hash];if(prior)return {added:false,bundle:clone(prior),candidates:inferCandidates()};
  s.bundles[bundle.content_hash]=bundle;if(bundle.assembly_contract)s.assemblies[bundle.assembly_contract.content_hash]=bundle.assembly_contract;
  (bundle.capability_delta||[]).forEach(c=>{const n=normalizeCapability(c,bundle);const key=n.capability_id+'@'+n.version;const old=s.capabilities[key];if(!old||(!statusVerified(old.status)&&statusVerified(n.status)))s.capabilities[key]=n;});
  save();const candidates=inferCandidates();try{if(root&&root.dispatchEvent)root.dispatchEvent(new CustomEvent('moor:capability-memory',{detail:{bundle,candidates}}));}catch(e){}
  return {added:true,bundle:clone(bundle),candidates};
}
function inferCandidates(){
  const s=read(),caps=Object.values(s.capabilities).filter(c=>statusVerified(c.status)),made=[];
  for(const a of caps)for(const b of caps){if(a===b)continue;for(const ot of a.output_types||[])for(const it of b.input_types||[]){const m=compatibleType(ot,it,s);if(!m)continue;const id='composition:'+hash([a.content_hash,b.content_hash,ot,it,m.mode]);if(s.compositions[id])continue;s.compositions[id]={composition_id:id,status:'candidate-unverified',from:a.capability_id,to:b.capability_id,from_version:a.version,to_version:b.version,output_type:ot,input_type:it,match:m.mode,adapter_id:m.adapter&&m.adapter.adapter_id||null,tests:[{id:'contract-compatible',kind:'deterministic',status:'pending'}],created_at:new Date().toISOString()};made.push(s.compositions[id]);}}
  }save();return clone(made);
}
function registerAdapter(a){a=clone(a||{});if(!a.from_type||!a.to_type)throw Error('adapter requires from_type/to_type');a.adapter_id=a.adapter_id||'adapter:'+hash(a);a.status=a.status||'specified';read().adapters[String(a.from_type).toLowerCase()+'→'+String(a.to_type).toLowerCase()]=a;save();return clone(a);}
function promoteComposition(id,evidence){const s=read(),c=s.compositions[id];if(!c)throw Error('unknown composition');evidence=clone(evidence||{});if(!statusVerified(evidence.status))throw Error('verified evidence required');if(Array.isArray(evidence.tests)&&evidence.tests.some(t=>t.ok===false))throw Error('composition tests failed');c.status='machine-verified';c.evidence=evidence;c.verified_at=new Date().toISOString();save();return clone(c);}
function snapshot(){return clone(read());}
function clearForTests(){mem=blank();return mem;}
return Object.freeze({version:1,ingest,inferCandidates,registerAdapter,promoteComposition,snapshot,statusVerified,clearForTests,save});
});