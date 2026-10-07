/* MOOR Verdict Outcome Query v1 — context-scoped learning lookup.
 *
 * applicableOutcomes(contextDescriptor) returns prior verdict outcomes whose
 * context genuinely applies. Matching is project/blueprint/objective overlap —
 * NOT keyword soup, NOT color coincidence, NOT generator coincidence.
 *
 * Unrelated contexts get nothing. That is the point.
 *
 * Funnel receipt 0db877055974c598 (2026-10-07).
 *
 * TAGS: kind:component | cat:retrieval | prov:verdict-index |
 *       see:funnel-verdict-outcomes.json | src:funnel-outcome-query-core.js |
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.VerdictOutcomeQuery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

let SIDECAR=null;
function loadSidecar(data){ SIDECAR=data; return api; }
function loadSidecarJson(json){ return loadSidecar(JSON.parse(json)); }

/* Context match: all specified descriptor fields must match. Unspecified fields are wildcards.
 * project, blueprint, objective are the context axes. Nothing else counts. */
function contextMatches(verdictCtx, query){
  if(!verdictCtx||!query) return false;
  if(query.project && verdictCtx.project!==query.project) return false;
  if(query.blueprint && verdictCtx.blueprint!==query.blueprint) return false;
  if(query.objective && verdictCtx.objective!==query.objective) return false;
  // at least one axis must have been specified, or it is a global query (not allowed)
  if(!query.project && !query.blueprint && !query.objective) return false;
  return true;
}

/* Returns [{dimension, value, epistemic_state, source, detail, verdict_id, receipt}]
 * Only outcomes from matching contexts. Sorted: corrected/owner-approved first. */
const PRECEDENCE={ 'owner-approved':0, 'explicitly-constrained':1, 'corrected':2, 'verified':3, 'observed':4, 'derived':5, 'proposed':6, 'rejected':7, 'intentionally-free':8, 'unresolved':9, 'superseded':10, 'deprecated':11, 'quarantined':12 };
function applicableOutcomes(query){
  if(!SIDECAR||!SIDECAR.verdicts) return [];
  const out=[];
  SIDECAR.verdicts.forEach(v=>{
    if(!contextMatches(v.context,query)) return;
    (v.outcomes||[]).forEach(o=>{
      out.push(Object.assign({},o,{verdict_id:v.verdict_id,receipt:v.receipt}));
    });
  });
  out.sort((a,b)=>(PRECEDENCE[a.epistemic_state]??99)-(PRECEDENCE[b.epistemic_state]??99));
  return out;
}

/* Convenience: outcomes for one dimension in an applicable context. */
function outcomesFor(query, dimension){
  return applicableOutcomes(query).filter(o=>o.dimension===dimension);
}

const api={ loadSidecar, loadSidecarJson, applicableOutcomes, outcomesFor, contextMatches,
  get loaded(){ return !!SIDECAR; } };
return api;
});
