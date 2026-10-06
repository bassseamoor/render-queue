/* MOOR Ultra Funnel Budget Core — conserved hierarchical resource envelopes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FunnelBudgetCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DIMS=['tokens','compute_ms','storage_bytes','worker_calls','parallelism','money_microunits','deadline_ms'];
function num(x){x=Number(x);return Number.isFinite(x)&&x>=0?x:0;}
function normalize(v){const o={};for(const d of DIMS)o[d]=num(v&&v[d]);return o;}
function envelope(input){input=input||{};return {schema:'moor.funnel.budget',version:1,budget_id:String(input.budget_id||('budget:'+Date.now()+':'+Math.random().toString(36).slice(2))),case_id:String(input.case_id||''),parent_budget_id:input.parent_budget_id||null,limit:normalize(input.limit),used:normalize(input.used),reserved:normalize(input.reserved)};}
function remaining(b){const o={};for(const d of DIMS)o[d]=Math.max(0,num(b.limit[d])-num(b.used[d])-num(b.reserved[d]));return o;}
function canConsume(b,cost){cost=normalize(cost);const r=remaining(b);return DIMS.every(d=>cost[d]<=r[d]);}
function consume(b,cost){cost=normalize(cost);if(!canConsume(b,cost))return {ok:false,status:'BUDGET_EXHAUSTED',budget:b,requested:cost,remaining:remaining(b)};const n=envelope(b);for(const d of DIMS)n.used[d]=num(b.used[d])+cost[d];return {ok:true,budget:n,remaining:remaining(n)};}
function allocate(parent,caseId,limit){limit=normalize(limit);const r=remaining(parent);for(const d of DIMS)if(limit[d]>r[d])throw Error('Child budget exceeds parent remaining '+d+'.');const p=envelope(parent);for(const d of DIMS)p.reserved[d]=num(parent.reserved[d])+limit[d];const child=envelope({case_id:caseId,parent_budget_id:parent.budget_id,limit});return {parent:p,child};}
function release(parent,child){const p=envelope(parent);for(const d of DIMS)p.reserved[d]=Math.max(0,num(parent.reserved[d])-num(child.limit[d]));return p;}
return Object.freeze({version:1,dimensions:DIMS.slice(),normalize,envelope,remaining,canConsume,consume,allocate,release});
});