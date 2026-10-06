/* MOOR Ultra Funnel Capability Core — least-authority scoped grants. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FunnelCapabilityCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ALL=['read:page0','read:reference:scoped','append:evidence','submit:ballot','spawn:child','consume:budget','request:convergence','request:execution','submit:verification','propose:promotion'];
const PROTECTED=['mutate:page0','rewrite:ledger','mint:authority-receipt','mark:verified','promote:law','expand:budget-without-owner-or-policy','escape:scope'];
const set=x=>new Set(Array.isArray(x)?x:[]);
function normalizeScope(s){s=s||{};return {case_id:String(s.case_id||''),question_ids:[...set(s.question_ids)].map(String).sort(),reference_prefixes:[...set(s.reference_prefixes)].map(String).sort(),package_ids:[...set(s.package_ids)].map(String).sort()};}
function grant(input){input=input||{};const caps=[...set(input.capabilities)].filter(x=>ALL.includes(x)).sort();if(!input.subject||!input.case_id)throw Error('Capability grant requires subject and case_id.');return Object.freeze({schema:'moor.funnel.capability-grant',version:1,grant_id:String(input.grant_id||('grant:'+Date.now()+':'+Math.random().toString(36).slice(2))),subject:String(input.subject),case_id:String(input.case_id),capabilities:caps,scope:normalizeScope({...input.scope,case_id:input.case_id}),parent_grant_id:input.parent_grant_id||null,expires_at:input.expires_at||null});}
function allows(g,cap,ctx){if(!g||PROTECTED.includes(cap)||!ALL.includes(cap)||!g.capabilities.includes(cap))return false;ctx=ctx||{};if(ctx.case_id&&String(ctx.case_id)!==g.case_id)return false;if(g.expires_at&&Date.now()>Date.parse(g.expires_at))return false;
  if(ctx.question_id&&g.scope.question_ids.length&&!g.scope.question_ids.includes(String(ctx.question_id)))return false;
  if(ctx.reference_id&&g.scope.reference_prefixes.length&&!g.scope.reference_prefixes.some(p=>String(ctx.reference_id).startsWith(p)))return false;
  if(ctx.package_id&&g.scope.package_ids.length&&!g.scope.package_ids.includes(String(ctx.package_id)))return false;
  return true;}
function delegate(parent,input){input=input||{};for(const c of input.capabilities||[])if(!allows(parent,c,{case_id:parent.case_id}))throw Error('Cannot delegate unheld capability '+c);return grant({...input,parent_grant_id:parent.grant_id,case_id:input.case_id||parent.case_id});}
return Object.freeze({version:1,capabilities:ALL.slice(),protectedActions:PROTECTED.slice(),grant,allows,delegate,normalizeScope});
});