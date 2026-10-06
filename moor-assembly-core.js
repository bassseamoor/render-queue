/* MOOR Assembly Core v1 — deterministic contract executor; no language model required. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorAssembly=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='moor.assembly-contract',VERSION=1,executors=new Map();
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
function hash(x){let s=typeof x==='string'?x:stable(x),a=2166136261>>>0,b=0x9e3779b9>>>0;for(let i=0;i<s.length;i++){const z=s.charCodeAt(i);a=Math.imul(a^z,16777619)>>>0;b=Math.imul(b^(z+i),2246822519)>>>0;}return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');}
function pathParts(path){return String(path||'').split('.').filter(Boolean);}
function getPath(obj,path){let x=obj;for(const p of pathParts(path)){if(x==null)return undefined;x=x[p];}return x;}
function setPath(obj,path,value){const ps=pathParts(path);if(!ps.length)throw Error('path required');let x=obj;for(let i=0;i<ps.length-1;i++){const p=ps[i];if(!x[p]||typeof x[p]!=='object')x[p]={};x=x[p];}x[ps.at(-1)]=clone(value);return obj;}
function mergePath(obj,path,value){let at=getPath(obj,path);if(at==null){setPath(obj,path,{});at=getPath(obj,path);}if(!at||Array.isArray(at)||typeof at!=='object'||!value||Array.isArray(value)||typeof value!=='object')throw Error('merge requires objects');Object.assign(at,clone(value));return obj;}
function appendPath(obj,path,value){let at=getPath(obj,path);if(at==null){setPath(obj,path,[]);at=getPath(obj,path);}if(!Array.isArray(at))throw Error('append requires array');(Array.isArray(value)?value:[value]).forEach(v=>at.push(clone(v)));return obj;}
function registerExecutor(name,fn,meta){name=String(name||'').trim();if(!name||typeof fn!=='function')throw Error('executor name/function required');const prior=executors.get(name);if(prior&&prior.fn!==fn&&!(meta&&meta.replace))throw Error('executor already registered: '+name);executors.set(name,{fn,meta:clone(meta||{})});return name;}
registerExecutor('state.set.v1',async(a,c)=>{setPath(c.state,a.path,a.value);return {ok:true};},{builtin:true});
registerExecutor('state.merge.v1',async(a,c)=>{mergePath(c.state,a.path,a.value);return {ok:true};},{builtin:true});
registerExecutor('state.append.v1',async(a,c)=>{appendPath(c.state,a.path,a.value);return {ok:true};},{builtin:true});
registerExecutor('state.assert.v1',async(a,c)=>{const v=getPath(c.state,a.path);if(a.exists===true&&v===undefined)throw Error('assert exists failed: '+a.path);if(Object.prototype.hasOwnProperty.call(a,'equals')&&stable(v)!==stable(a.equals))throw Error('assert equals failed: '+a.path);return {ok:true};},{builtin:true});
registerExecutor('artifact.snapshot.v1',async(a,c)=>{c.outputs[a.name||'artifact']=clone(a.payload);return {ok:true};},{builtin:true});
function normalizeContract(input){
  input=clone(input||{});
  const req=['artifact_id','version','source_hash'];for(const k of req)if(!String(input[k]||'').trim())throw Error('AssemblyContract missing '+k);
  const c={schema:SCHEMA,version:VERSION,artifact_id:String(input.artifact_id),artifact_version:String(input.version),source_hash:String(input.source_hash),
    inputs:Array.isArray(input.inputs)?input.inputs:[],dependencies:Array.isArray(input.dependencies)?input.dependencies:[],
    operations:Array.isArray(input.operations)?input.operations.map((o,i)=>({id:String(o.id||('op-'+(i+1))),op:String(o.op||''),args:clone(o.args||{})})):[],
    required_executors:Array.isArray(input.required_executors)?[...new Set(input.required_executors.map(String))]:[],
    outputs:Array.isArray(input.outputs)?input.outputs:[],verification:Array.isArray(input.verification)?input.verification:[],
    rollback:clone(input.rollback||null),determinism:clone(input.determinism||{mode:'deterministic'}),meta:clone(input.meta||{})};
  c.operations.forEach(o=>{if(!o.op)throw Error('Assembly operation missing op');if(!c.required_executors.includes(o.op))c.required_executors.push(o.op);});
  c.content_hash=hash(c);return c;
}
function verifyContract(c){if(!c||c.schema!==SCHEMA||c.version!==VERSION||!c.content_hash)return false;const x=clone(c),h=x.content_hash;delete x.content_hash;return hash(x)===h;}
async function execute(contract,opts){
  opts=opts||{};if(!verifyContract(contract))return {ok:false,status:'INVALID_CONTRACT',error:'Assembly contract hash/schema failed.'};
  const missing=contract.required_executors.filter(x=>!executors.has(x));if(missing.length)return {ok:false,status:'MISSING_EXECUTOR',missing,required_executors:contract.required_executors.slice()};
  const ctx={state:clone(opts.state||{}),outputs:{},contract,log:[],services:opts.services||{}};
  try{
    for(const op of contract.operations){const ex=executors.get(op.op);const res=await ex.fn(clone(op.args),ctx);ctx.log.push({operation:op.id,op:op.op,ok:!(res&&res.ok===false),result:clone(res||null)});if(res&&res.ok===false)throw Error(res.error||('executor failed '+op.op));}
    return {ok:true,status:'ASSEMBLED',state:ctx.state,outputs:ctx.outputs,log:ctx.log,contract_hash:contract.content_hash};
  }catch(e){return {ok:false,status:'ASSEMBLY_FAILED',error:String(e&&e.message||e),state:ctx.state,outputs:ctx.outputs,log:ctx.log,contract_hash:contract.content_hash};}
}
function listExecutors(){return [...executors.entries()].map(([name,x])=>({name,meta:clone(x.meta)}));}
return Object.freeze({schema:SCHEMA,version:VERSION,hash,stable,normalizeContract,createContract:normalizeContract,verifyContract,registerExecutor,execute,listExecutors,getPath,setPath});
});