/* MOOR Worker Reservation Core v1 — WO-02
 * Read-only stale-base/ownership validation. No Git mutation and no worker spawning.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorWorkerReservation=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function copy(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function list(x){return Array.isArray(x)?[...new Set(x.map(String))]:[]}
function normalize(x){x=copy(x||{});return {schema:'moor.worker-reservation',version:1,reservation_id:String(x.reservation_id||''),release_id:String(x.release_id||''),worker_id:String(x.worker_id||''),repository_base:String(x.repository_base||''),owned_files:list(x.owned_files),owned_interfaces:list(x.owned_interfaces),shared:list(x.shared),merge_strategy:copy(x.merge_strategy||null),status:String(x.status||'active')}}
function conflictKey(r){return new Set([...r.owned_files.map(x=>'file:'+x),...r.owned_interfaces.map(x=>'interface:'+x)])}
function sharedKey(r){return new Set(r.shared)}
function scopeAllows(release,kind,value){const s=release&&release.release_scope||{};return kind==='file'?(s.write||[]).includes('file:'+value)||(s.write||[]).includes(value):(s.interfaces||[]).includes('interface:'+value)||(s.interfaces||[]).includes(value)}
function validate(release,reservation,currentBase,existing){
 const r=normalize(reservation),errors=[];
 for(const k of ['reservation_id','release_id','worker_id','repository_base'])if(!r[k])errors.push('missing '+k);
 if(!release||r.release_id!==release.release_id)errors.push('release mismatch');
 if(!currentBase||currentBase!==r.repository_base||currentBase!==release.repository_base)errors.push('stale repository base');
 if(!r.owned_files.length&&!r.owned_interfaces.length)errors.push('ownership required');
 for(const x of r.owned_files)if(!scopeAllows(release,'file',x))errors.push('file outside release scope '+x);
 for(const x of r.owned_interfaces)if(!scopeAllows(release,'interface',x))errors.push('interface outside release scope '+x);
 const mine=conflictKey(r),mineShared=sharedKey(r);
 for(const raw of (Array.isArray(existing)?existing:[])){
   const other=normalize(raw);if(other.status!=='active'||other.reservation_id===r.reservation_id)continue;
   const theirs=conflictKey(other),theirShared=sharedKey(other);
   for(const key of mine)if(theirs.has(key)){
     const allowed=mineShared.has(key)&&theirShared.has(key)&&r.merge_strategy&&other.merge_strategy;
     if(!allowed)errors.push('ownership conflict '+key+' with '+other.reservation_id);
   }
 }
 return {ok:errors.length===0,errors,reservation:r};
}
function checkChange(reservation,currentBase,change){
 const r=normalize(reservation),c=copy(change||{}),errors=[];
 if(currentBase!==r.repository_base)errors.push('stale repository base');
 const files=list(c.files),interfaces=list(c.interfaces);
 for(const x of files)if(!r.owned_files.includes(x))errors.push('unowned file '+x);
 for(const x of interfaces)if(!r.owned_interfaces.includes(x))errors.push('unowned interface '+x);
 return {ok:errors.length===0,errors};
}
return Object.freeze({version:1,normalize,validate,checkChange});
});