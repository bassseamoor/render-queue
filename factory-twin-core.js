/* MOOR Factory Twin Core v1
 * Deterministically composes machine-readable software-factory sources into one
 * semantic snapshot for 3D/UI observability. It never mints authority.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorFactoryTwin=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEMA='moor.factory-twin-snapshot',VERSION=1;
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function stable(x){if(x===null||typeof x!=='object')return JSON.stringify(x);if(Array.isArray(x))return '['+x.map(stable).join(',')+']';return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';}
function hash(x){let s=typeof x==='string'?x:stable(x),a=2166136261>>>0,b=0x9e3779b9>>>0;for(let i=0;i<s.length;i++){const z=s.charCodeAt(i);a=Math.imul(a^z,16777619)>>>0;b=Math.imul(b^(z+i),2246822519)>>>0;}return a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');}
function visualHealthFromMaintenance(s){
  const v=s.display_state||s.visual_state||'unknown';
  if(v==='native_tested'||v==='live_shared')return 'healthy-verified';
  if(v==='candidate_tested')return 'candidate';
  if(v==='inherited')return 'shared-inherited';
  if(v==='gap')return 'gap';
  if(v==='degraded')return 'degraded';
  return 'unknown';
}
function healthFromCapability(n){
  if(n.lifecycle==='quarantined')return 'degraded';
  if(n.lifecycle==='deprecated')return 'superseded';
  if(n.status==='machine-verified'||n.status==='human-approved'||n.status==='canonical')return 'healthy-verified';
  if(n.status==='candidate-unverified')return 'candidate';
  return 'unknown';
}
function orderZone(o){
  if(o.state==='QUEUED'||o.state==='MATERIALS_BOUND')return 'intake';
  if(o.state==='ROUTED')return 'planning';
  if(o.state==='IN_PROCESS')return 'work-cells';
  if(o.state==='INSPECTION'||o.state==='PASS')return 'qc';
  if(o.state==='NONCONFORMING'||o.state==='REWORK'||o.state==='BLOCKED_MAINTENANCE')return 'rework';
  if(o.state==='RELEASED')return 'release';
  return 'planning';
}
function machineZone(n){
  if(n.kind==='machine'||n.kind==='fixture'||n.kind==='adapter'||n.kind==='connection')return n.lifecycle==='deprecated'||n.lifecycle==='quarantined'?'archive':'tool-crib';
  return 'maintenance';
}
function machineFromMaintenance(s){
  return {
    machine_id:'system:'+s.id,kind:'subsystem',label:s.name||s.label||s.id,owner:s.owner||'shared',
    lifecycle:'active',health:visualHealthFromMaintenance(s),live_path:!!s.live_path,
    evidence_refs:clone(s.proof||[]),capabilities:clone(s.capabilities||[]),supersedes:[],
    location_hint:'maintenance',source:'maintenance'
  };
}
function machineFromFactoryNode(n,edges){
  const supersedes=(edges||[]).filter(e=>e.from===n.id&&e.type==='supersedes').map(e=>e.to);
  return {
    machine_id:n.id,kind:n.kind||'machine',label:n.label||n.id,owner:'Capability Memory',
    lifecycle:n.lifecycle||'active',health:healthFromCapability(n),live_path:n.lifecycle!=='quarantined',
    evidence_refs:[n.implementation_ref||n.id].filter(Boolean),capabilities:clone(n.capabilities||[]),
    supersedes,location_hint:machineZone(n),status:n.status||null,version:n.version||null,source:'capability-memory'
  };
}
function routeFromEdge(e,prefix){
  return {route_id:(prefix||'route')+':'+hash([e.from,e.to,e.type]),from:e.from,to:e.to,state:e.type||'connected',throughput:null,blocked_reason:null,receipt_ref:null};
}
function workOrder(o,generatedAt){
  const current=o.current_operation||null;
  const station=current&&current.station_id||(o.route&&o.route.stations&&o.route.stations[o.route_index]&&o.route.stations[o.route_index].station_id)||null;
  const opened=o.events&&o.events[0]&&o.events[0].at||null;
  const age=opened&&generatedAt?Math.max(0,Date.parse(generatedAt)-Date.parse(opened)):null;
  return {
    work_order_id:o.work_order_id,page0_hash:o.page0_hash,stage:o.state,station,status:o.state,
    queue_age_ms:Number.isFinite(age)?age:null,required_actions:[],
    receipts:[o.authorization&&o.authorization.receipt_fingerprint].concat((o.travelers||[]).map(x=>x.fingerprint)).filter(Boolean),
    bom_hash:o.bom&&o.bom.content_hash||null,route_id:o.route&&o.route.route_id||null,
    ncr_open:(o.nonconformances||[]).filter(x=>!['closed','use-as-is-approved','rework-verified'].includes(String(x.disposition||''))).map(x=>x.ncr_id),
    location_hint:orderZone(o),objective:o.objective||''
  };
}
function compose(input){
  input=clone(input||{});
  const maintenance=input.maintenance||{systems:[],current_authority:{}};
  const factory=input.factory_graph||input.factory||{nodes:[],edges:[],counts:{}};
  const plant=input.plant||{orders:[],counts:{},work_in_progress:0,released:0};
  const funnel=input.funnel_graph||input.funnel||{nodes:[],edges:[],currentLaw:{}};
  const generatedAt=input.generated_at||new Date().toISOString();

  const source_hashes={
    maintenance:hash(maintenance),
    factory_graph:hash(factory),
    plant:hash(plant),
    funnel_graph:hash(funnel),
    external_receipts:hash(input.receipts||[])
  };
  const machines=[];
  for(const s of maintenance.systems||[])machines.push(machineFromMaintenance(s));
  for(const n of factory.nodes||[])machines.push(machineFromFactoryNode(n,factory.edges||[]));

  const routes=[];
  for(const e of factory.edges||[])routes.push(routeFromEdge(e,'factory'));
  for(const e of funnel.edges||[])routes.push(routeFromEdge(e,'funnel'));

  const work_orders=(plant.orders||[]).map(o=>workOrder(o,generatedAt));
  const receipts=[].concat(input.receipts||[]);
  for(const o of plant.orders||[]){
    if(o.authorization)receipts.push({kind:'authority',work_order_id:o.work_order_id,fingerprint:o.authorization.receipt_fingerprint,law_version:o.authorization.law_version});
    for(const t of o.travelers||[])receipts.push({kind:'traveler',work_order_id:o.work_order_id,fingerprint:t.fingerprint,station_id:t.station_id,operation_id:t.operation_id});
  }

  const authority_versions={
    production:maintenance.current_authority&&maintenance.current_authority.production||funnel.currentLaw&&funnel.currentLaw.active||null,
    candidate:maintenance.current_authority&&maintenance.current_authority.candidate||funnel.currentLaw&&funnel.currentLaw.candidate||null
  };
  const metrics={
    machines:machines.length,
    registered_capability_machines:factory.counts&&factory.counts.machines||0,
    maintained_systems:(maintenance.systems||[]).length,
    routes:routes.length,
    work_orders:work_orders.length,
    work_in_progress:plant.work_in_progress||work_orders.filter(x=>x.status!=='RELEASED').length,
    released:plant.released||work_orders.filter(x=>x.status==='RELEASED').length,
    gaps:(maintenance.systems||[]).filter(x=>(x.display_state||x.visual_state)==='gap').length,
    quarantined:machines.filter(x=>x.lifecycle==='quarantined').length,
    superseded:machines.filter(x=>x.lifecycle==='deprecated'||x.health==='superseded').length
  };
  const bindings=[];
  for(const m of machines)bindings.push({entity_id:m.machine_id,semantic_role:'machine',anchor_zone:m.location_hint||'tool-crib',layout_seed:hash(m.machine_id),display_priority:m.health==='gap'||m.health==='degraded'?100:m.health==='healthy-verified'?60:40,interaction_contract:'inspect-only'});
  for(const o of work_orders)bindings.push({entity_id:'work-order:'+o.work_order_id,semantic_role:'work-order',anchor_zone:o.location_hint,layout_seed:hash(o.work_order_id),display_priority:o.status==='NONCONFORMING'||o.status==='BLOCKED_MAINTENANCE'?100:70,interaction_contract:'inspect-request-actions'});

  const core={schema:SCHEMA,version:VERSION,generated_at:generatedAt,authority_versions,machines,routes,work_orders,maintenance:clone(maintenance),receipts,metrics,source_hashes,spatial_bindings:bindings};
  // Twin identity is semantic equipment/process identity, not observation time.
  // Build it positively from stable fields instead of cloning the render envelope
  // and trying to remember every volatile field that may be added later.
  const semantic_work_orders=work_orders.map(o=>({
    work_order_id:o.work_order_id,page0_hash:o.page0_hash,stage:o.stage,station:o.station,status:o.status,
    required_actions:clone(o.required_actions||[]),receipts:clone(o.receipts||[]),
    bom_hash:o.bom_hash||null,route_id:o.route_id||null,ncr_open:clone(o.ncr_open||[]),
    location_hint:o.location_hint||null,objective:o.objective||''
  }));
  const identity={
    schema:SCHEMA,version:VERSION,
    authority_versions:clone(authority_versions),
    machines:clone(machines),
    routes:clone(routes),
    work_orders:semantic_work_orders,
    maintenance:clone(maintenance),
    receipts:clone(receipts),
    metrics:clone(metrics),
    source_hashes:clone(source_hashes),
    spatial_bindings:clone(bindings)
  };
  core.snapshot_id='twin:'+hash(identity);
  return core;
}
function validate(s){
  const errors=[];if(!s||s.schema!==SCHEMA||s.version!==VERSION)errors.push('schema/version');
  if(!s||!s.snapshot_id)errors.push('snapshot_id');
  if(s&&Array.isArray(s.machines))for(const m of s.machines){
    if(!m.machine_id)errors.push('machine without id');
    if(m.health==='healthy-verified'&&!(m.evidence_refs||[]).length)errors.push('healthy machine without evidence '+m.machine_id);
  }
  if(s&&Array.isArray(s.work_orders))for(const o of s.work_orders){if(!o.work_order_id||!o.page0_hash)errors.push('work order missing identity');}
  return {ok:errors.length===0,errors};
}
function traceWorkOrder(s,id){
  if(!s)return null;const o=(s.work_orders||[]).find(x=>x.work_order_id===String(id));if(!o)return null;
  return {work_order:clone(o),receipts:clone((s.receipts||[]).filter(r=>r.work_order_id===o.work_order_id)),route:clone((s.routes||[]).filter(r=>!o.route_id||r.route_id===o.route_id))};
}
return Object.freeze({schema:SCHEMA,version:VERSION,compose,validate,traceWorkOrder,hash});
});
