const assert=require('node:assert/strict');
const Twin=require('../factory-twin-core.js');

const maintenance={
  current_authority:{production:'v44-sealed',candidate:'ultra-v1-candidate'},
  systems:[
    {id:'router',name:'Request Router',owner:'v44-sealed',visual_state:'native_tested',live_path:true,proof:['tests/moor-request-checks.cjs']},
    {id:'gap',name:'Missing ledger',owner:'ultra-v1-candidate',visual_state:'gap',live_path:false,proof:[]}
  ]
};
const factory={
  nodes:[
    {id:'cap:a@1',kind:'machine',label:'a',version:'1',status:'machine-verified',lifecycle:'active',implementation_ref:'a.js'},
    {id:'cap:a@0',kind:'machine',label:'a',version:'0',status:'machine-verified',lifecycle:'deprecated',implementation_ref:'a0.js'},
    {id:'assembly:x',kind:'fixture',label:'assembly x',status:'machine-verified'}
  ],
  edges:[
    {from:'cap:a@1',to:'cap:a@0',type:'supersedes'},
    {from:'cap:a@1',to:'assembly:x',type:'assembled_by'}
  ],
  counts:{machines:2,fixtures:1,connections:0,adapters:0}
};
const plant={
  orders:[{
    work_order_id:'wo1',page0_hash:'p0',objective:'build thing',state:'IN_PROCESS',owner:'test',
    route:{route_id:'r1',stations:[{station_id:'harness',operation_id:'build'}]},route_index:0,
    current_operation:{station_id:'harness',operation_id:'build'},
    authorization:{receipt_fingerprint:'auth1',law_version:'v44-sealed'},
    travelers:[{fingerprint:'trav1',station_id:'funnel',operation_id:'resolve'}],
    inspections:[],nonconformances:[],events:[{at:'2026-10-06T20:00:00Z'}],
    bom:{content_hash:'bom1'}
  }],
  counts:{IN_PROCESS:1},work_in_progress:1,released:0
};
const funnel={
  currentLaw:{active:'v44-sealed',candidate:'ultra-v1-candidate'},
  nodes:[],
  edges:[{from:'page0',to:'funnel',type:'governs'}]
};

const a=Twin.compose({maintenance,factory_graph:factory,plant,funnel_graph:funnel,generated_at:'2026-10-06T20:10:00Z'});
const b=Twin.compose({maintenance,factory_graph:factory,plant,funnel_graph:funnel,generated_at:'2026-10-06T20:20:00Z'});
assert.equal(a.schema,'moor.factory-twin-snapshot');
assert.equal(a.authority_versions.production,'v44-sealed');
assert.equal(a.metrics.work_in_progress,1);
assert.equal(a.metrics.gaps,1);
assert.equal(a.metrics.superseded,1);
assert(a.machines.some(x=>x.machine_id==='cap:a@1'&&x.health==='healthy-verified'));
assert(a.machines.some(x=>x.machine_id==='cap:a@0'&&x.health==='superseded'));
assert(a.machines.find(x=>x.machine_id==='cap:a@1').supersedes.includes('cap:a@0'));
assert(a.work_orders.some(x=>x.work_order_id==='wo1'&&x.station==='harness'));
assert(a.spatial_bindings.some(x=>x.entity_id==='work-order:wo1'&&x.anchor_zone==='work-cells'));
assert.equal(a.snapshot_id,b.snapshot_id,'semantic snapshot identity must not change merely because render time changed');
assert.equal(Twin.validate(a).ok,true);
const trace=Twin.traceWorkOrder(a,'wo1');
assert(trace&&trace.receipts.some(x=>x.fingerprint==='auth1'));
assert(trace.receipts.some(x=>x.fingerprint==='trav1'));

const bad=JSON.parse(JSON.stringify(a));
bad.machines.push({machine_id:'fake-green',health:'healthy-verified',evidence_refs:[]});
assert.equal(Twin.validate(bad).ok,false,'green/healthy twin state without evidence must fail validation');

console.log('PASS: FactoryTwinSnapshot deterministically binds authority, maintenance truth, cumulative machinery, supersession, real WIP, receipts and semantic spatial anchors without creating authority');
