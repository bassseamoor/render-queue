/* MOOR Software Factory Core v1
 * Additive manufacturing ledger for software work.
 * Authority remains in Funnel/receipt systems. This core records work orders,
 * BOM/routes, travelers, inspection, NCR/rework, maintenance blocks and release.
 */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorSoftwareFactory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

const SCHEMA='moor.software-factory-ledger',VERSION=1,KEY='moor-software-factory-v1';
const STATES=['QUEUED','MATERIALS_BOUND','ROUTED','IN_PROCESS','INSPECTION','PASS','NONCONFORMING','REWORK','BLOCKED_MAINTENANCE','RELEASED'];
let memory=null;

function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
function hash(x){let s=typeof x==='string'?x:stable(x),h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
function blank(){return {schema:SCHEMA,version:VERSION,orders:{},updated_at:null};}
function read(){
  if(memory)return memory;
  try{if(root&&root.localStorage){const x=JSON.parse(root.localStorage.getItem(KEY)||'null');if(x&&x.schema===SCHEMA&&x.version===VERSION){memory=x;return memory;}}}catch(_){}
  memory=blank();return memory;
}
function save(){const s=read();s.updated_at=new Date().toISOString();try{if(root&&root.localStorage)root.localStorage.setItem(KEY,JSON.stringify(s));}catch(_){}return clone(s);}
function order(id){const o=read().orders[String(id)];if(!o)throw Error('unknown work order');return o;}
function append(o,type,payload){
  const prev=o.events.length?o.events[o.events.length-1].hash:'GENESIS';
  const core={seq:o.events.length+1,prev_hash:prev,type:String(type),state:o.state,at:new Date().toISOString(),payload:clone(payload||{})};
  const e={...core,hash:hash(core)};o.events.push(e);return e;
}
function verifyLedger(o){
  if(!o||!Array.isArray(o.events))return false;let prev='GENESIS';
  for(let i=0;i<o.events.length;i++){const e=o.events[i];if(!e||e.seq!==i+1||e.prev_hash!==prev)return false;const core={seq:e.seq,prev_hash:e.prev_hash,type:e.type,state:e.state,at:e.at,payload:clone(e.payload||{})};if(hash(core)!==e.hash)return false;prev=e.hash;}
  return true;
}
function transition(o,to,type,payload){if(!STATES.includes(to))throw Error('invalid factory state '+to);o.state=to;append(o,type||'transition',payload||{});save();return clone(o);}
function open(input){
  input=clone(input||{});for(const k of ['work_order_id','page0_hash','objective'])if(!String(input[k]||'').trim())throw Error('work order missing '+k);
  const s=read(),id=String(input.work_order_id),prior=s.orders[id];
  if(prior){
    if(prior.page0_hash!==String(input.page0_hash)||prior.objective!==String(input.objective))throw Error('work order identity/Page 0 is immutable');
    return clone(prior);
  }
  const o={schema:'moor.software-work-order',version:1,work_order_id:id,page0_hash:String(input.page0_hash),objective:String(input.objective),scope:clone(input.scope||{}),priority:input.priority||'normal',owner:input.owner||null,requested_outputs:clone(input.requested_outputs||[]),done_criteria:clone(input.done_criteria||[]),route_version:input.route_version||null,state:'QUEUED',bom:null,route:null,route_index:0,authorization:null,current_operation:null,travelers:[],inspections:[],nonconformances:[],rework_orders:[],release:null,maintenance_block:null,events:[]};
  append(o,'work_order_opened',{page0_hash:o.page0_hash,objective:o.objective});s.orders[id]=o;save();return clone(o);
}
function bindMaterials(id,bom){
  const o=order(id);if(o.state!=='QUEUED')throw Error('materials bind requires QUEUED');
  bom=clone(bom||{});const parts=Array.isArray(bom.parts)?bom.parts:Array.isArray(bom.part_kind_ids)?bom.part_kind_ids.map(x=>({id:x})):null;
  if(!parts||!parts.length)throw Error('BOM requires parts');
  o.bom={schema:'moor.software-bom',version:1,work_order_id:o.work_order_id,parts,dependency_edges:clone(bom.dependency_edges||[]),source_hashes:clone(bom.source_hashes||[]),content_hash:hash({parts,dependency_edges:bom.dependency_edges||[],source_hashes:bom.source_hashes||[]})};
  return transition(o,'MATERIALS_BOUND','materials_bound',{bom_hash:o.bom.content_hash,parts:parts.length});
}
function setRoute(id,route){
  const o=order(id);if(o.state!=='MATERIALS_BOUND')throw Error('routing requires MATERIALS_BOUND');
  route=clone(route||{});if(!String(route.route_id||'').trim()||!Array.isArray(route.stations)||!route.stations.length)throw Error('route_id and stations required');
  o.route={schema:'moor.software-route',version:1,route_id:String(route.route_id),stations:route.stations.map((x,i)=>typeof x==='string'?{station_id:x,operation_id:'op-'+(i+1)}:{...x,station_id:String(x.station_id||''),operation_id:String(x.operation_id||('op-'+(i+1)))}),entry_criteria:clone(route.entry_criteria||[]),exit_criteria:clone(route.exit_criteria||[]),resource_budget:clone(route.resource_budget||{}),allowed_rework_loops:Number(route.allowed_rework_loops==null?1:route.allowed_rework_loops),content_hash:null};
  if(o.route.stations.some(x=>!x.station_id))throw Error('every route station requires station_id');
  o.route.content_hash=hash({...o.route,content_hash:undefined});o.route_index=0;o.route_version=route.version||o.route_version||'1';
  return transition(o,'ROUTED','route_bound',{route_id:o.route.route_id,route_hash:o.route.content_hash,stations:o.route.stations.length});
}
function defaultVerifier(receipt){
  try{return !!(root&&root.MOORFunnelKernel&&typeof root.MOORFunnelKernel.verifyReceipt==='function'&&root.MOORFunnelKernel.verifyReceipt(receipt));}catch(_){return false;}
}
function authorize(id,receipt,verifyFn){
  const o=order(id);if(o.state!=='ROUTED')throw Error('authorization requires ROUTED');
  const verify=typeof verifyFn==='function'?verifyFn:defaultVerifier;if(!receipt||verify(receipt)!==true)throw Error('verified Funnel authorization required');
  if(String(receipt.page0_hash||'')!==o.page0_hash)throw Error('authorization receipt Page 0 mismatch');
  o.authorization={receipt_fingerprint:String(receipt.fingerprint||''),law_version:String(receipt.law_version||''),verified_at:new Date().toISOString(),receipt_type:receipt.receipt_type||receipt.schema||'authority'};
  append(o,'authorization_bound',o.authorization);save();return clone(o);
}
function startOperation(id,input){
  const o=order(id);if(!['ROUTED','REWORK'].includes(o.state))throw Error('operation start requires ROUTED or REWORK');if(!o.authorization)throw Error('work order is not authorized');
  input=clone(input||{});let station=null;
  if(o.state==='REWORK'){const rw=o.rework_orders[o.rework_orders.length-1];station={station_id:input.station_id||rw&&rw.approved_route&&rw.approved_route.station_id||'rework',operation_id:input.operation_id||rw&&rw.approved_route&&rw.approved_route.operation_id||('rework-'+o.rework_orders.length)};}
  else station=o.route&&o.route.stations[o.route_index];
  if(!station)throw Error('no route station available');
  o.current_operation={station_id:String(input.station_id||station.station_id),operation_id:String(input.operation_id||station.operation_id),executor:input.executor||station.executor||null,inputs:clone(input.inputs||{}),parameters:clone(input.parameters||{}),started_at:new Date().toISOString()};
  return transition(o,'IN_PROCESS','operation_started',o.current_operation);
}
function completeOperation(id,input){
  const o=order(id);if(o.state!=='IN_PROCESS'||!o.current_operation)throw Error('operation completion requires IN_PROCESS');
  input=clone(input||{});const op=o.current_operation;
  const traveler={schema:'moor.software-traveler',version:1,work_order_id:o.work_order_id,station_id:op.station_id,operation_id:op.operation_id,input_hashes:clone(input.input_hashes||[hash(op.inputs)]),output_hashes:clone(input.output_hashes||[hash(input.outputs||{})]),law_version:o.authorization&&o.authorization.law_version||null,result:input.result||'completed',evidence:clone(input.evidence||[]),timestamp:new Date().toISOString(),authority_receipt:o.authorization&&o.authorization.receipt_fingerprint||null};
  traveler.fingerprint=hash({...traveler,fingerprint:undefined});o.travelers.push(traveler);o.current_operation=null;
  return transition(o,'INSPECTION','operation_completed',{traveler_fingerprint:traveler.fingerprint,station_id:traveler.station_id,operation_id:traveler.operation_id});
}
function inspect(id,input){
  const o=order(id);if(o.state!=='INSPECTION')throw Error('inspection requires INSPECTION');input=clone(input||{});
  for(const k of ['inspection_id','characteristic'])if(!String(input[k]||'').trim())throw Error('inspection missing '+k);
  if(typeof input.pass!=='boolean')throw Error('inspection pass must be boolean');
  const rec={schema:'moor.software-inspection',version:1,inspection_id:String(input.inspection_id),characteristic:String(input.characteristic),observed:clone(input.observed),tolerance:clone(input.tolerance),pass:input.pass,evidence_ref:input.evidence_ref||null,verifier:input.verifier||'unspecified',at:new Date().toISOString()};
  rec.fingerprint=hash({...rec,fingerprint:undefined});o.inspections.push(rec);
  if(!rec.pass){
    const ncr={schema:'moor.software-nonconformance',version:1,ncr_id:String(input.ncr_id||('ncr:'+hash([o.work_order_id,rec.fingerprint]))),work_order_id:o.work_order_id,station:o.travelers[o.travelers.length-1]&&o.travelers[o.travelers.length-1].station_id||null,defect_class:input.defect_class||'inspection-failure',observed_vs_expected:{observed:rec.observed,tolerance:rec.tolerance},containment:input.containment||'hold work order',disposition:null,root_cause_status:'open',opened_at:new Date().toISOString()};
    o.nonconformances.push(ncr);return transition(o,'NONCONFORMING','inspection_failed',{inspection:rec,ncr});
  }
  if(o.route&&o.route_index<o.route.stations.length-1){o.route_index++;return transition(o,'ROUTED','inspection_passed',{inspection:rec,next_station:o.route.stations[o.route_index].station_id});}
  return transition(o,'PASS','inspection_passed',{inspection:rec,route_complete:true});
}
function issueRework(id,input){
  const o=order(id);if(o.state!=='NONCONFORMING')throw Error('rework requires NONCONFORMING');input=clone(input||{});
  const ncr=o.nonconformances.find(x=>x.ncr_id===input.ncr_id)||o.nonconformances[o.nonconformances.length-1];if(!ncr)throw Error('NCR required');
  const prior=o.rework_orders.filter(x=>x.ncr_id===ncr.ncr_id).length,max=Number(input.max_cycles==null?(o.route&&o.route.allowed_rework_loops||1):input.max_cycles);if(prior>=max)throw Error('rework cycle limit exhausted');
  const rw={schema:'moor.software-rework-order',version:1,rework_id:String(input.rework_id||('rework:'+hash([ncr.ncr_id,prior+1]))),ncr_id:ncr.ncr_id,approved_route:clone(input.approved_route||{}),cycle:prior+1,max_cycles:max,required_reinspection:input.required_reinspection!==false,issued_at:new Date().toISOString()};
  ncr.disposition='rework';o.rework_orders.push(rw);return transition(o,'REWORK','rework_authorized',rw);
}
function blockMaintenance(id,input){
  const o=order(id);if(o.state==='RELEASED')throw Error('released work cannot be maintenance-blocked');input=clone(input||{});
  o.maintenance_block={prior_state:o.state,asset_id:input.asset_id||null,reason:String(input.reason||'maintenance hold'),verification_ref:input.verification_ref||null,at:new Date().toISOString()};
  return transition(o,'BLOCKED_MAINTENANCE','maintenance_blocked',o.maintenance_block);
}
function resumeMaintenance(id,input){
  const o=order(id);if(o.state!=='BLOCKED_MAINTENANCE'||!o.maintenance_block)throw Error('no maintenance block');input=clone(input||{});
  if(input.cleared!==true)throw Error('maintenance clearance required');const prior=o.maintenance_block.prior_state;o.maintenance_block={...o.maintenance_block,cleared:true,cleared_at:new Date().toISOString(),clearance_evidence:input.evidence_ref||null};return transition(o,prior,'maintenance_cleared',o.maintenance_block);
}
function release(id,input){
  const o=order(id);if(o.state!=='PASS')throw Error('release requires PASS');if(!o.authorization)throw Error('release requires authority');
  if(o.inspections.some(x=>x.pass!==true))throw Error('all inspections must pass');
  if(o.nonconformances.some(x=>!['use-as-is-approved','closed','rework-verified'].includes(String(x.disposition||''))))throw Error('open nonconformance blocks release');
  input=clone(input||{});if(!String(input.configuration_hash||'').trim())throw Error('configuration hash required');
  const rec={schema:'moor.software-release',version:1,work_order_id:o.work_order_id,all_required_inspections_passed:true,configuration_hash:String(input.configuration_hash),receipt_chain:[o.authorization.receipt_fingerprint].concat(o.travelers.map(x=>x.fingerprint)),released_artifacts:clone(input.released_artifacts||[]),released_at:new Date().toISOString()};
  rec.fingerprint=hash({...rec,fingerprint:undefined});o.release=rec;return transition(o,'RELEASED','released',rec);
}
function closeNonconformance(id,ncrId,input){
  const o=order(id),n=o.nonconformances.find(x=>x.ncr_id===ncrId);if(!n)throw Error('unknown NCR');input=clone(input||{});
  const allowed=['closed','use-as-is-approved','rework-verified'];if(!allowed.includes(input.disposition))throw Error('invalid NCR disposition');n.disposition=input.disposition;n.root_cause_status=input.root_cause_status||'closed';n.closed_at=new Date().toISOString();n.evidence_ref=input.evidence_ref||null;append(o,'nonconformance_closed',{ncr_id:n.ncr_id,disposition:n.disposition});save();return clone(n);
}
function get(id){const o=read().orders[String(id)];return o?clone(o):null;}
function list(){return clone(Object.values(read().orders));}
function plantSnapshot(){const orders=Object.values(read().orders);return {schema:'moor.software-plant-state',version:1,generated_at:new Date().toISOString(),orders:clone(orders),counts:STATES.reduce((a,s)=>(a[s]=orders.filter(o=>o.state===s).length,a),{}),work_in_progress:orders.filter(o=>!['RELEASED'].includes(o.state)).length,released:orders.filter(o=>o.state==='RELEASED').length};}
function clearForTests(){memory=blank();return clone(memory);}
return Object.freeze({schema:SCHEMA,version:VERSION,states:STATES.slice(),open,bindMaterials,setRoute,authorize,startOperation,completeOperation,inspect,issueRework,closeNonconformance,blockMaintenance,resumeMaintenance,release,get,list,plantSnapshot,verifyLedger,hash,clearForTests,save});
});
