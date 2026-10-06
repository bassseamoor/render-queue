/* MOOR Worker Release Core v1 — WO-01
 * Contract builder/validator only. It cannot spawn workers, mutate Git, or mint Funnel authority.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorWorkerRelease=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function copy(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}'}
function hash(x){const s=typeof x==='string'?x:stable(x);let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16).padStart(8,'0')}
function list(x){return Array.isArray(x)?[...new Set(x.map(String))]:[]}
function normalizeScope(s){s=copy(s||{});return {write:list(s.write),interfaces:list(s.interfaces),read:list(s.read)}}
function makeRelease(x){
 x=copy(x||{});
 const r={schema:'moor.slice-release',version:1,release_id:String(x.release_id||''),blueprint_id:String(x.blueprint_id||''),blueprint_version:String(x.blueprint_version||''),slice_id:String(x.slice_id||''),page0_hash:String(x.page0_hash||''),blueprint_receipt:String(x.blueprint_receipt||''),dependency_receipts:list(x.dependency_receipts),repository_base:String(x.repository_base||''),owner_approval:x.owner_approval===true,budget:copy(x.budget||{}),release_scope:normalizeScope(x.release_scope),done_criteria:list(x.done_criteria),verification_plan:copy(x.verification_plan||{}),automatic_execution:false};
 r.release_hash=hash(r);return r;
}
function validateRelease(input){
 const r=makeRelease(input),errors=[];
 for(const k of ['release_id','blueprint_id','blueprint_version','slice_id','page0_hash','blueprint_receipt','repository_base'])if(!r[k])errors.push('missing '+k);
 if(!r.owner_approval)errors.push('owner approval required');
 if(!r.done_criteria.length)errors.push('done criteria required');
 if(!Object.keys(r.budget).length)errors.push('budget required');
 if(!r.release_scope.write.length&&!r.release_scope.interfaces.length)errors.push('release scope requires write file or interface ownership');
 if(input&&input.release_hash&&input.release_hash!==hash({...r,release_hash:undefined}))errors.push('release_hash mismatch');
 return {ok:errors.length===0,errors,release:r};
}
function allowed(scope,item){return scope.write.includes(item)||scope.interfaces.includes(item)}
function makeJob(releaseInput,x){
 const vr=validateRelease(releaseInput);x=copy(x||{});
 const j={schema:'moor.worker-job',version:1,job_id:String(x.job_id||''),release_id:vr.release.release_id,objective:String(x.objective||''),owned_files_or_interfaces:list(x.owned_files_or_interfaces),read_scope:list(x.read_scope),capability_grant:copy(x.capability_grant||{}),budget:copy(x.budget||{}),inputs:copy(x.inputs||{}),expected_outputs:list(x.expected_outputs),done_criteria:list(x.done_criteria),verification_plan:copy(x.verification_plan||{}),handoff_contract:copy(x.handoff_contract||{}),repository_base:vr.release.repository_base};
 j.job_hash=hash(j);return j;
}
function validateJob(releaseInput,jobInput){
 const vr=validateRelease(releaseInput),j=makeJob(vr.release,jobInput),errors=[...vr.errors];
 for(const k of ['job_id','release_id','objective','repository_base'])if(!j[k])errors.push('missing '+k);
 if(j.release_id!==vr.release.release_id)errors.push('release mismatch');
 if(!j.owned_files_or_interfaces.length)errors.push('job ownership required');
 for(const item of j.owned_files_or_interfaces)if(!allowed(vr.release.release_scope,item))errors.push('scope expansion '+item);
 if(!j.done_criteria.length)errors.push('job done criteria required');
 if(!j.expected_outputs.length)errors.push('expected outputs required');
 if(!Object.keys(j.verification_plan).length)errors.push('verification plan required');
 if(!Object.keys(j.handoff_contract).length)errors.push('handoff contract required');
 if(jobInput&&jobInput.job_hash&&jobInput.job_hash!==hash({...j,job_hash:undefined}))errors.push('job_hash mismatch');
 return {ok:errors.length===0,errors,release:vr.release,job:j};
}
return Object.freeze({version:1,makeRelease,validateRelease,makeJob,validateJob,hash});
});