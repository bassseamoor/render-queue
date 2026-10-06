const assert=require('node:assert/strict');
const F=require('../software-factory-core.js');

F.clearForTests();
const receipt={page0_hash:'p0',fingerprint:'r1',law_version:'v44-sealed',receipt_type:'moor.funnel-receipt'};
let w=F.open({work_order_id:'wo-1',page0_hash:'p0',objective:'Build a verified machine',requested_outputs:['artifact'],done_criteria:['passes inspection']});
assert.equal(w.state,'QUEUED');
assert.throws(()=>F.open({work_order_id:'wo-1',page0_hash:'different',objective:'Build a verified machine'}),/immutable/);

w=F.bindMaterials('wo-1',{parts:[{id:'capability:a@1'},{id:'capability:b@2'}],dependency_edges:[['a','b']],source_hashes:['ha','hb']});
assert.equal(w.state,'MATERIALS_BOUND');
assert(w.bom.content_hash);

w=F.setRoute('wo-1',{route_id:'route-1',version:'1',stations:[
  {station_id:'funnel',operation_id:'plan'},
  {station_id:'harness',operation_id:'build'}
],allowed_rework_loops:1});
assert.equal(w.state,'ROUTED');
assert.throws(()=>F.startOperation('wo-1',{}),/not authorized/);
w=F.authorize('wo-1',receipt,r=>r.fingerprint==='r1');
assert.equal(w.authorization.receipt_fingerprint,'r1');

w=F.startOperation('wo-1',{executor:'funnel'});
assert.equal(w.state,'IN_PROCESS');
w=F.completeOperation('wo-1',{outputs:{spec:true},evidence:['evidence:plan']});
assert.equal(w.state,'INSPECTION');
w=F.inspect('wo-1',{inspection_id:'inspect-plan',characteristic:'page0 fidelity',observed:'pass',tolerance:'exact',pass:true,verifier:'test'});
assert.equal(w.state,'ROUTED');

w=F.startOperation('wo-1',{executor:'harness'});
w=F.completeOperation('wo-1',{outputs:{artifact:'v1'},evidence:['evidence:build']});
w=F.inspect('wo-1',{inspection_id:'inspect-build-1',characteristic:'behavior',observed:'bad',tolerance:'must pass',pass:false,verifier:'test',defect_class:'behavior'});
assert.equal(w.state,'NONCONFORMING');
const ncr=w.nonconformances[0];
w=F.issueRework('wo-1',{ncr_id:ncr.ncr_id,approved_route:{station_id:'harness-rework',operation_id:'repair'},max_cycles:1});
assert.equal(w.state,'REWORK');
w=F.startOperation('wo-1',{executor:'harness-rework'});
w=F.completeOperation('wo-1',{outputs:{artifact:'v2'},evidence:['evidence:repair']});
w=F.inspect('wo-1',{inspection_id:'inspect-build-2',characteristic:'behavior',observed:'good',tolerance:'must pass',pass:true,verifier:'test'});
assert.equal(w.state,'PASS');
assert.throws(()=>F.release('wo-1',{configuration_hash:'cfg1'}),/nonconformance/);
F.closeNonconformance('wo-1',ncr.ncr_id,{disposition:'rework-verified',evidence_ref:'evidence:repair'});
w=F.release('wo-1',{configuration_hash:'cfg1',released_artifacts:['artifact:v2']});
assert.equal(w.state,'RELEASED');
assert(w.release.fingerprint);
assert.equal(F.verifyLedger(F.get('wo-1')),true);

let w2=F.open({work_order_id:'wo-2',page0_hash:'p2',objective:'Maintenance hold test'});
F.bindMaterials('wo-2',{parts:[{id:'capability:c@1'}]});
F.setRoute('wo-2',{route_id:'r2',stations:['station-a']});
F.authorize('wo-2',{page0_hash:'p2',fingerprint:'r2',law_version:'v44-sealed'},()=>true);
w2=F.blockMaintenance('wo-2',{asset_id:'station-a',reason:'failed preventive check'});
assert.equal(w2.state,'BLOCKED_MAINTENANCE');
w2=F.resumeMaintenance('wo-2',{cleared:true,evidence_ref:'maintenance:pass'});
assert.equal(w2.state,'ROUTED');

const plant=F.plantSnapshot();
assert.equal(plant.released,1);
assert.equal(plant.counts.RELEASED,1);
assert.equal(plant.counts.ROUTED,1);

console.log('PASS: software factory core records immutable work orders, BOM/routes, verified authorization, travelers, inspection, NCR/rework, maintenance holds and gated release without minting authority');
