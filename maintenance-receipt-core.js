/* MOOR Maintenance Receipt Core v1 — FM-05 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorMaintenanceReceipt=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function copy(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}'}
function hash(x){const s=typeof x==='string'?x:stable(x);let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h.toString(16).padStart(8,'0')}
function compose(input){
 input=copy(input||{});const status=input.status||{systems:[],current_authority:{}},inv=input.inventory||{mechanisms:[]},exercise=input.exercise||{mechanism_exercise:{}},live=input.live||{results:[]};
 const mechanism_statuses=(inv.mechanisms||[]).map(m=>({mechanism_id:m.mechanism_id,maintenance_class:m.maintenance_class,exercise_paths:copy((exercise.mechanism_exercise||{})[m.mechanism_id]||[]),exercised:((exercise.mechanism_exercise||{})[m.mechanism_id]||[]).length>0}));
 const tests_executed=[];for(const s of live.results||[])for(const t of s.tests||[])tests_executed.push({station_id:s.id,file:t.file,pass:!!t.pass});
 const failures=tests_executed.filter(x=>!x.pass);
 const known_gaps=(status.systems||[]).filter(s=>s.implemented===false||(s.display_state||s.visual_state)==='gap').map(s=>({id:s.id,name:s.name||s.id,detail:s.detail||s.note||''}));
 const semantic={law_versions:{production:status.current_authority&&status.current_authority.production||null,candidate:status.current_authority&&status.current_authority.candidate||null},mechanism_statuses,station_results:(live.results||[]).map(s=>({id:s.id,pass:!!s.pass,critical:!!s.critical,passed:s.passed,total:s.total})),known_gaps,commit_sha:input.commit_sha||null};
 return {schema:'moor.maintenance-receipt',version:1,snapshot_hash:'maintenance:'+hash(semantic),generated_at:String(input.generated_at||new Date().toISOString()),commit_sha:input.commit_sha||null,law_versions:semantic.law_versions,mechanism_statuses,tests_executed,failures,known_gaps,results:copy(live.results||[]),overall:live.overall||'unknown',counts:copy(live.counts||{})};
}
function validate(r){const errors=[];if(!r||r.schema!=='moor.maintenance-receipt'||r.version!==1)errors.push('schema/version');if(!r||!r.snapshot_hash)errors.push('snapshot_hash');if(!r||!r.law_versions||!r.law_versions.production)errors.push('production law');if(!Array.isArray(r&&r.mechanism_statuses))errors.push('mechanism statuses');if(!Array.isArray(r&&r.tests_executed))errors.push('tests');if(!Array.isArray(r&&r.known_gaps))errors.push('known gaps');return {ok:errors.length===0,errors}}
return Object.freeze({version:1,compose,validate,hash});
});