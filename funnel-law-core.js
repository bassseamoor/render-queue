(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.UltraFunnelLaw=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){'use strict';
const R=root&&root.FunnelReceiptCore||(typeof require==='function'?require('./funnel-receipt-core.js'):null);
const UsagePlan=root&&root.FunnelUsagePlan||(typeof require==='function'?require('./funnel-usage-plan-core.js'):null);
const STATES=['RECEIVED','REFERENCES_BOUND','QUESTIONS_COMPILED','SOLVING','CHILDREN_RUNNING','CONVERGING','BLUEPRINT_READY','PAGE0_REPLAYED','EXECUTION_AUTHORIZED','EXECUTING','VERIFICATION_PENDING','VERIFIED','LEARNED','COMPACTED'];
const SIDE=['BLOCKED','FAILED','STALE','BUDGET_EXHAUSTED','OWNER_REQUIRED','QUARANTINED'];
const LAW_VERSION='ultra-v1-candidate';
const cases=new Map();

function hash(x){return R?R.hash(x):JSON.stringify(x).length.toString(16)}
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function text(x){return String(x==null?'':x)}
function stable(x){return R&&R.stable?R.stable(x):JSON.stringify(x)}
function extractObligations(raw){
  const source=text(raw),parts=source.split(/(?:\n+|(?<=[.!?;])\s+)/).map(x=>x.trim()).filter(Boolean);
  const seen={},out=[];
  parts.forEach(part=>{
    if(!/\b(must|need(?:s)?|should|have to|has to|make sure|ensure|never|do not|don't|cannot|can't|want(?:s)?|required?|no excuse|build|push|preserve|keep)\b/i.test(part))return;
    const id='obligation:'+hash(part.toLowerCase());
    if(!seen[id]){seen[id]=1;out.push({id,source:part});}
  });
  if(!out.length&&source.trim())out.push({id:'obligation:'+hash(source.trim().toLowerCase()),source:source.trim()});
  return out;
}
function pushEvent(c,type,state,payload,issuer){
  const prev=c.events.length?c.events.at(-1).hash:'GENESIS';
  const body={seq:c.events.length+1,prev_hash:prev,type,state,payload:clone(payload||{}),issuer:issuer||'system'};
  const e={...body,hash:hash(body)};c.events.push(e);return e;
}
function verifyCase(c){
  if(!c||c.schema!=='moor.ultra-funnel-case'||c.law_version!==LAW_VERSION||!Array.isArray(c.events))return false;
  let prev='GENESIS';
  for(let i=0;i<c.events.length;i++){
    const e=c.events[i];
    if(!e||e.seq!==i+1||e.prev_hash!==prev)return false;
    const body={seq:e.seq,prev_hash:e.prev_hash,type:e.type,state:e.state,payload:clone(e.payload||{}),issuer:e.issuer||'system'};
    if(hash(body)!==e.hash)return false;
    prev=e.hash;
  }
  return true;
}
function open(input){
  if(!input||!input.case_id||!text(input.page0).trim())throw Error('case_id and page0 required');
  const id=String(input.case_id),raw=String(input.page0);
  if(cases.has(id)){
    const existing=cases.get(id);
    if(existing.page0!==raw)throw Error('Page 0 is immutable for this Ultra Funnel case.');
    if(!verifyCase(existing))throw Error('Ultra Funnel case integrity failed.');
    return clone(existing);
  }
  const usagePlan=input.usage_plan||UsagePlan&&UsagePlan.build?UsagePlan.build(raw,input.scope||{},input.usage_plan_overrides||{}):null;
  if(!usagePlan||!UsagePlan||!UsagePlan.validate(usagePlan,raw))throw Error('Ultra Funnel requires a valid usage plan.');
  const c={schema:'moor.ultra-funnel-case',version:1,law_version:LAW_VERSION,case_id:id,parent_case_id:input.parent_case_id||null,page0:raw,page0_hash:hash(raw),scope:clone(input.scope||{}),scope_hash:hash(input.scope||{}),usage_plan:clone(usagePlan),usage_plan_hash:UsagePlan.hash(usagePlan),state:'RECEIVED',events:[],receipts:[],stale:false};
  pushEvent(c,'open','RECEIVED',{page0_hash:c.page0_hash,scope_hash:c.scope_hash,usage_plan_hash:c.usage_plan_hash},'law');
  cases.set(c.case_id,c);return clone(c);
}
function get(id){const c=cases.get(id);return c?clone(c):null}
function plan(id,overrides){
  const c=cases.get(id);if(!c)throw Error('unknown case');if(c.state!=='RECEIVED')throw Error('Usage plan locks before references.');
  const next=UsagePlan.build(c.page0,c.scope,overrides||{});
  c.usage_plan=clone(next);c.usage_plan_hash=UsagePlan.hash(next);pushEvent(c,'usage_plan','RECEIVED',{usage_plan_hash:c.usage_plan_hash,plan:clone(next)},'law');return clone(next);
}
function checkReplay(c,payload){
  if(!payload||payload.page0_verified!==true)throw Error('Ultra Page 0 replay must explicitly verify Page 0.');
  if(payload.page0_hash!==c.page0_hash)throw Error('Ultra Page 0 replay must use the immutable Page 0 hash.');
  if(!Array.isArray(payload.obligations))throw Error('Ultra Page 0 replay requires atomic obligation results.');
  const base=extractObligations(c.page0),byId={};
  payload.obligations.forEach(o=>{if(o&&o.id)byId[o.id]=o;});
  const missing=base.filter(o=>!byId[o.id]);
  if(missing.length)throw Error('Ultra Page 0 replay omitted '+missing.length+' source-backed obligation(s).');
  const bad=payload.obligations.filter(o=>{
    if(!o||!o.id||!o.source||!c.page0.includes(o.source))return true;
    if(!['satisfied','explicitly-deferred'].includes(o.status))return true;
    if(o.status==='explicitly-deferred'&&o.approved!==true)return true;
    return false;
  });
  if(bad.length)throw Error('Ultra replay obligations must be source-backed and satisfied or explicitly deferred with approval.');
  if(payload.substitutions&&payload.substitutions.some(x=>!x||x.approved!==true))throw Error('Unapproved Ultra substitution blocks authority.');
  const br=c.receipts.find(r=>r.receipt_type==='BlueprintReceipt'&&R.verify(r,{law_version:LAW_VERSION,case_id:c.case_id,page0_hash:c.page0_hash,scope_hash:c.scope_hash}));
  if(!br)throw Error('Ultra Page 0 replay requires a valid BlueprintReceipt.');
}
function transition(id,to,payload,issuer){
  const c=cases.get(id);if(!c)throw Error('unknown case');if(c.stale)throw Error('case stale');if(!verifyCase(c))throw Error('Ultra Funnel case integrity failed.');
  const i=STATES.indexOf(c.state),j=STATES.indexOf(to);if(j!==i+1)throw Error('illegal transition '+c.state+' -> '+to);
  payload=clone(payload||{});
  if(to==='REFERENCES_BOUND'){
    if(!c.usage_plan||!c.usage_plan_hash)throw Error('REFERENCES_BOUND requires a locked Funnel usage plan.');
    const refs=payload.references||payload.reused;
    if(!Array.isArray(refs))throw Error('REFERENCES_BOUND requires references/reused array.');
    payload.usage_plan_hash=c.usage_plan_hash;
  }
  if(to==='QUESTIONS_COMPILED'){
    const qs=payload.questions||payload.material_questions;
    if(!Array.isArray(qs)||!qs.length)throw Error('QUESTIONS_COMPILED requires material questions.');
  }
  if(to==='CONVERGING'&&Array.isArray(payload.unresolved)&&payload.unresolved.length)throw Error('Unresolved material decisions block Ultra convergence.');
  if(to==='BLUEPRINT_READY'&&!payload.blueprint&&!payload.blueprint_data&&!payload.blueprint_hash&&!payload.hash)throw Error('BLUEPRINT_READY requires blueprint identity or data.');
  if(to==='PAGE0_REPLAYED')checkReplay(c,payload);
  if(to==='EXECUTION_AUTHORIZED'){
    const fp=String(payload.blueprint_receipt||'');
    const br=c.receipts.find(r=>r.receipt_type==='BlueprintReceipt'&&r.fingerprint===fp);
    if(!br||!R.verify(br,{law_version:LAW_VERSION,case_id:c.case_id,page0_hash:c.page0_hash,scope_hash:c.scope_hash}))throw Error('EXECUTION_AUTHORIZED requires the case BlueprintReceipt.');
  }
  c.state=to;pushEvent(c,'transition',to,payload,issuer||'system');
  if(to==='BLUEPRINT_READY'&&root&&typeof root.dispatchEvent==='function'){try{root.dispatchEvent(new CustomEvent('moor:blueprint-ready',{detail:{case_id:c.case_id,law_version:c.law_version,page0_hash:c.page0_hash,scope:clone(c.scope),blueprint:payload.blueprint||null,blueprint_data:payload.blueprint_data||null,hash:payload.hash||payload.blueprint_hash||null}}));}catch(e){}}
  return clone(c);
}
function stale(id,reason){
  const c=cases.get(id);if(!c)throw Error('unknown case');c.stale=true;c.state='STALE';pushEvent(c,'stale','STALE',{reason:String(reason||'changed dependency')},'law');return clone(c);
}
function allowedReceiptState(type,state){
  if(type==='BlueprintReceipt')return state==='BLUEPRINT_READY';
  if(type==='ExecutionReceipt')return state==='EXECUTION_AUTHORIZED';
  if(type==='VerificationReceipt')return state==='VERIFIED';
  if(type==='LearningReceipt')return state==='LEARNED';
  if(type==='CompactionReceipt')return state==='COMPACTED';
  return true;
}
function mintReceipt(id,type,payload,issuer,inputReceipts,budgetHash){
  const c=cases.get(id);if(!c||c.stale)throw Error('invalid case');if(!verifyCase(c))throw Error('Ultra Funnel case integrity failed.');
  if(!allowedReceiptState(type,c.state))throw Error(type+' cannot be minted from state '+c.state+'.');
  inputReceipts=Array.isArray(inputReceipts)?inputReceipts:[];
  if(type==='ExecutionReceipt'){
    const br=c.receipts.find(r=>r.receipt_type==='BlueprintReceipt'&&R.verify(r,{law_version:LAW_VERSION,case_id:c.case_id,page0_hash:c.page0_hash,scope_hash:c.scope_hash}));
    if(!br||!inputReceipts.includes(br.fingerprint))throw Error('ExecutionReceipt requires the verified BlueprintReceipt as an input.');
  }
  const ledger=c.events.at(-1).hash;
  const rec=R.mint(type,{law_version:c.law_version,case_id:c.case_id,parent_case_id:c.parent_case_id,page0_hash:c.page0_hash,scope_hash:c.scope_hash,input_receipt_hashes:inputReceipts,budget_hash:budgetHash||hash({}),payload_hash:R.hash(payload||{}),ledger_head:ledger,issuer_role:issuer||'law',meta:{state:c.state,usage_plan_hash:c.usage_plan_hash}});
  c.receipts.push(rec);return rec;
}
function verifyReceipt(receipt){
  if(!R||!R.verify(receipt))return false;
  const c=cases.get(receipt.case_id);
  if(!c||c.stale||!verifyCase(c))return false;
  if(receipt.law_version!==LAW_VERSION||receipt.page0_hash!==c.page0_hash||receipt.scope_hash!==c.scope_hash)return false;
  if(!receipt.meta||receipt.meta.usage_plan_hash!==c.usage_plan_hash)return false;
  if(!c.events.some(e=>e.hash===receipt.ledger_head))return false;
  if(!c.receipts.some(r=>r.fingerprint===receipt.fingerprint))return false;
  return true;
}
const migration=Object.freeze({
  inherited_from:'v44-sealed',
  native_guards:Object.freeze([
    'immutable-page0',
    'usage-plan-before-references',
    'ordered-states',
    'source-backed-page0-replay',
    'approved-deferrals-and-substitutions',
    'blueprint-before-replay',
    'blueprint-receipt-before-execution',
    'typed-receipt-state-gating',
    'case-integrity-chain',
    'staleness'
  ]),
  authority_status:'candidate-not-promoted'
});
return Object.freeze({version:1,law_version:LAW_VERSION,states:STATES.slice(),sideStates:SIDE.slice(),migration,open,get,plan,transition,stale,mintReceipt,verifyReceipt,extractObligations,hash,_verifyCase:verifyCase});
});
