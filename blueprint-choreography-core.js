/* MOOR Blueprint Choreography Core v1
 * Read-only evidence calculator. It never releases work or mints authority.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorBlueprintChoreography=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const INFO={low:1,medium:2,high:3,'very high':4};
const RISK={low:4,'low-medium':3.5,medium:3,high:2,critical:0};
const REV={low:0,medium:1,high:2};
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
function hash(x){let s=typeof x==='string'?x:stable(x),h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
function score(s){return (INFO[String(s.informationValue||'').toLowerCase()]||0)*100+(RISK[String(s.risk||'').toLowerCase()]||0)*10+(REV[String(s.reversibility||'').toLowerCase()]||0);}
function evaluate(input){
  input=clone(input||{});const ch=input.choreography||{},ev=input.evidence||{},release=ch.releaseSlices||[];
  const completed=new Set(Object.keys(ev.slices||{}).filter(id=>['verified','completed','implemented-and-tested','implemented-baseline'].includes(String(ev.slices[id].status||''))));
  const active=new Set(Object.keys(ev.slices||{}).filter(id=>['released','active','in-process'].includes(String(ev.slices[id].status||''))));
  const rows=release.map(s=>{
    const missing=(s.dependsOn||[]).filter(id=>!completed.has(id));
    const rec=ev.slices&&ev.slices[s.id]||null;
    const historicalMissing=rec&&rec.implemented_ahead_of_plan&&Array.isArray(rec.implemented_ahead_of_plan.observed_missing_dependencies)?rec.implemented_ahead_of_plan.observed_missing_dependencies:[];
    const isCompleted=completed.has(s.id),isActive=active.has(s.id);
    let status=isCompleted?'completed':isActive?'active':missing.length?'blocked':'eligible';
    const divergence=isCompleted&&(missing.length||historicalMissing.length)?(missing.length?'implemented-ahead-of-plan':'implemented-ahead-of-plan-history'):null;
    return {...clone(s),status,missing_dependencies:missing,historical_missing_dependencies:clone(historicalMissing),evidence:rec&&clone(rec.evidence||[]),divergence,score:score(s)};
  });
  const eligible=rows.filter(x=>x.status==='eligible').sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));
  const blocked=rows.filter(x=>x.status==='blocked');
  const divergences=rows.filter(x=>x.divergence);
  const recommendation=eligible[0]?{slice_id:eligible[0].id,name:eligible[0].name,reason:'Highest information/risk/reversibility score among dependency-satisfied slices. Advisory only; Funnel/owner release is still required.',score:eligible[0].score}:null;
  return {schema:'moor.blueprint-choreography-snapshot',version:1,snapshot_id:'choreo:'+hash({release,evidence:ev}),authority:'read-only/no-release',eligible_slices:eligible,blocked_slices:blocked,completed_slices:rows.filter(x=>x.status==='completed'),active_slices:rows.filter(x=>x.status==='active'),divergences,recommendation};
}
return Object.freeze({version:1,evaluate,hash});
});
