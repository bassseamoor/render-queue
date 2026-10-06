/* MOOR Ultra Funnel Receipt Core — typed, content-addressed authority records. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FunnelReceiptCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='moor.funnel.authority-receipt',VERSION=1;
const TYPES=new Set(['QuestionReceipt','SolverBallotReceipt','ConsensusReceipt','ReuseReceipt','ChildFunnelReceipt','BlueprintReceipt','ExecutionReceipt','VerificationReceipt','LearningReceipt','CompactionReceipt','PromotionReceipt','FailureReceipt']);
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
function hash(x){let s=typeof x==='string'?x:stable(x),a=2166136261>>>0,b=0x9e3779b9>>>0,c=0x85ebca6b>>>0,d=0xc2b2ae35>>>0;for(let i=0;i<s.length;i++){const z=s.charCodeAt(i);a=Math.imul(a^z,16777619)>>>0;b=Math.imul(b^(z+i),2246822519)>>>0;c=Math.imul(c^(z+(i<<1)),3266489917)>>>0;d=Math.imul(d^(z+(i<<2)),668265263)>>>0;}return [a,b,c,d].map(n=>n.toString(16).padStart(8,'0')).join('');}
function mint(type,input){
  input=input||{};if(!TYPES.has(type))throw Error('Unknown receipt type.');
  const req=['law_version','case_id','page0_hash','scope_hash','payload_hash','ledger_head','issuer_role'];
  for(const k of req)if(!String(input[k]??'').trim())throw Error('Receipt missing '+k+'.');
  const core={
    schema:SCHEMA,version:VERSION,receipt_type:type,law_version:String(input.law_version),
    case_id:String(input.case_id),parent_case_id:input.parent_case_id==null?null:String(input.parent_case_id),
    page0_hash:String(input.page0_hash),scope_hash:String(input.scope_hash),
    input_receipt_hashes:Array.isArray(input.input_receipt_hashes)?[...new Set(input.input_receipt_hashes.map(String))].sort():[],
    budget_hash:String(input.budget_hash||hash({})),payload_hash:String(input.payload_hash),
    ledger_head:String(input.ledger_head),issuer_role:String(input.issuer_role),
    issued_at:input.issued_at||new Date().toISOString(),meta:clone(input.meta||{})
  };
  return Object.freeze({...core,fingerprint:hash(core)});
}
function verify(r,expected){
  if(!r||r.schema!==SCHEMA||r.version!==VERSION||!TYPES.has(r.receipt_type)||!r.fingerprint)return false;
  const c=clone(r),fp=c.fingerprint;delete c.fingerprint;if(hash(c)!==fp)return false;
  expected=expected||{};
  for(const k of ['receipt_type','law_version','case_id','parent_case_id','page0_hash','scope_hash','payload_hash','ledger_head'])
    if(expected[k]!=null&&String(r[k])!==String(expected[k]))return false;
  return true;
}
function chain(receipts){
  receipts=receipts||[];for(const r of receipts)if(!verify(r))throw Error('Invalid receipt in chain.');
  return hash(receipts.map(r=>r.fingerprint));
}
function payloadHash(payload){return hash(payload);}
return Object.freeze({schema:SCHEMA,version:VERSION,types:[...TYPES],hash,stable,mint,verify,chain,payloadHash});
});