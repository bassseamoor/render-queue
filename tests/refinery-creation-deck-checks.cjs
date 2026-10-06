const assert=require('node:assert/strict');
const A=require('../moor-assembly-core.js');
const M=require('../moor-capability-memory.js');
const Refinery=require('../moor-capability-refinery.js');
const H=require('../funnel-capability-handoff.js');

(async()=>{
  M.clearForTests();
  global.MoorCapabilityMemory=M;

  const contract=A.createContract({
    artifact_id:'demo',version:'1',source_hash:'source-demo',
    operations:[
      {id:'one',op:'state.set.v1',args:{path:'result.value',value:42}},
      {id:'two',op:'state.assert.v1',args:{path:'result.value',equals:42}}
    ],
    required_executors:['state.set.v1','state.assert.v1'],
    outputs:[{name:'state',type:'moor.state'}]
  });
  assert(A.verifyContract(contract));
  let res=await A.execute(contract,{});
  assert.equal(res.ok,true);
  assert.equal(res.state.result.value,42);

  const missing=A.createContract({
    artifact_id:'missing',version:'1',source_hash:'source-missing',
    operations:[{id:'x',op:'unknown.executor.v1',args:{}}],
    required_executors:['unknown.executor.v1']
  });
  res=await A.execute(missing,{});
  assert.equal(res.status,'MISSING_EXECUTOR');
  assert.deepEqual(res.missing,['unknown.executor.v1']);

  const genericBundle=Refinery.crystallizeOutput({
    id:'implementation:generic-sink:1',
    title:'Generic sink',
    version:'1',
    status:'machine-verified',
    source:{app:'test-builder',component:'generic-sink'},
    capabilities:[{
      capability_id:'test.generic.sink',version:'1',status:'machine-verified',
      provides:['generic:consume'],input_types:['any'],output_types:['moor.generic'],
      evidence_refs:['evidence:generic']
    }],
    evidence:{evidence_id:'evidence:generic',tests:[{ok:true}]}
  });
  M.ingest(genericBundle);

  const bundle=Refinery.crystallizeOutput({
    id:'implementation:test:1',
    title:'Verified test artifact',
    version:'1',
    status:'machine-verified',
    source:{app:'test-builder',component:'test-builder'},
    implementation_ref:'test.html',
    assembly_contract:contract,
    capabilities:[{
      capability_id:'test.produce.number',version:'1',status:'machine-verified',
      provides:['number:produce'],input_types:[],output_types:['moor.number'],
      evidence_refs:['evidence:test']
    },{
      capability_id:'test.consume.number',version:'1',status:'machine-verified',
      provides:['number:consume'],input_types:['moor.number'],output_types:['moor.report'],
      evidence_refs:['evidence:test']
    }],
    evidence:{evidence_id:'evidence:test',tests:[{ok:true}]},
    learning_capsule:{
      scope:{test:true},decisions:[],constraints:[],
      failures:[{reason:'Generic any-type sink produced a noisy connection hypothesis.',source_capability:'test.produce.number',target_capability:'test.generic.sink',evidence_refs:['evidence:test']}],
      substitutions:[],owner_corrections:[],verification:{tests:[{ok:true}]},intent:null,supersedes:[]
    }
  });
  assert.equal(bundle.status,'machine-verified');
  const ing=M.ingest(bundle);
  assert.equal(ing.added,true);
  assert(ing.reconsideration,'verified capability ingestion must create a bounded reconsideration record');
  assert.equal(ing.reconsideration.delta.length,2);
  const snap=M.snapshot();
  assert(Object.values(snap.capabilities).some(c=>c.capability_id==='test.produce.number'));
  assert(Object.values(snap.capabilities).some(c=>c.capability_id==='test.consume.number'));
  assert(Object.values(snap.compositions).some(c=>c.from==='test.produce.number'&&c.to==='test.consume.number'&&c.status==='candidate-unverified'));
  assert.equal(Object.values(snap.compositions).some(c=>c.to==='test.generic.sink'),false,'generic any-type compatibility must not manufacture a candidate connection');
  assert(Object.values(snap.failures).some(f=>f.target_capability==='test.generic.sink'),'failure evidence must survive in cumulative memory');
  assert.equal((snap.reconsiderations||[]).length>=2,true,'each verified delta must create a bounded reconsideration record');

  const candidate=Object.values(M.snapshot().compositions).find(c=>c.from==='test.produce.number'&&c.to==='test.consume.number');
  assert(candidate);

  const secondBundle=Refinery.crystallizeOutput({
    id:'implementation:test:2',title:'Second verified number pair',version:'1',status:'machine-verified',
    source:{app:'test-builder',component:'test-builder-2'},
    capabilities:[
      {capability_id:'test.produce.number.two',version:'1',status:'machine-verified',provides:['number:produce'],input_types:[],output_types:['moor.number'],evidence_refs:['evidence:test2']},
      {capability_id:'test.consume.number.two',version:'1',status:'machine-verified',provides:['number:consume'],input_types:['moor.number'],output_types:['moor.report'],evidence_refs:['evidence:test2']}
    ],
    evidence:{evidence_id:'evidence:test2',tests:[{ok:true}]}
  });
  const secondIngest=M.ingest(secondBundle);
  assert(secondIngest.reconsideration.relevance.length>0,'new delta must reconsider relevant existing number machinery');
  const numberLinks=Object.values(M.snapshot().compositions).filter(c=>c.output_type==='moor.number'&&c.input_type==='moor.number');
  assert(numberLinks.length>=3,'delta-driven reconsideration should surface multiple relevant typed links without rescanning unrelated pairs');
  numberLinks.slice(0,3).forEach(c=>M.promoteComposition(c.composition_id,{status:'machine-verified',tests:[{ok:true}]}));
  assert(M.abstractionCandidates().some(a=>a.relation_type==='moor.number→moor.number|exact'),'repeated verified relationships must surface an abstraction candidate');
  assert.equal(M.preferredCapability({provides:'number:produce'}).capability_id,'test.produce.number','verified machinery must be discoverable for reuse');
  const beforeDep=M.getCapability('test.produce.number','1');
  M.deprecateCapability('test.produce.number','1',{reason:'superseded in test',replacement_id:'test.produce.number.v2'});
  assert.equal(M.getCapability('test.produce.number','1').lifecycle,'deprecated','deprecation must preserve the machine');
  assert.equal(M.preferredCapability({provides:'number:produce'}),null,'deprecated machinery must leave preferred routing');
  assert.equal(M.listCapabilities({include_deprecated:true}).some(x=>x.content_hash===beforeDep.content_hash),true,'deprecated verified machine must remain addressable');
  M.quarantineCapability('test.consume.number','1',{reason:'test integrity hold',evidence_ref:'evidence:test'});
  assert.equal(M.getCapability('test.consume.number','1').lifecycle,'quarantined');
  assert.equal(M.listCapabilities({include_quarantined:false,include_deprecated:true}).some(x=>x.capability_id==='test.consume.number'),false,'quarantined machinery must not enter normal reuse');
  if(M.snapshot().compositions[candidate.composition_id].status!=='machine-verified')M.promoteComposition(candidate.composition_id,{status:'machine-verified',tests:[{ok:true}]});
  assert.equal(M.snapshot().compositions[candidate.composition_id].status,'machine-verified');

  const packet=H.makePacket(bundle);
  assert.equal(packet.authority,'reference-only');
  assert.equal(packet.verified_capabilities.length,2);
  assert(H.refs(packet).some(r=>r.kind==='capability'));
  assert(H.refs(packet).some(r=>r.kind==='assembly'));
  assert(H.refs(packet).some(r=>r.kind==='handoff'));

  const unverified=Refinery.crystallizeOutput({
    id:'spec-only',title:'Spec only',status:'specified',source:{app:'spec'},
    capabilities:[{capability_id:'spec.guess',status:'specified',output_types:['moor.guess']}]
  });
  assert.equal(H.makePacket(unverified).verified_capabilities.length,0,'unverified capability must not enter verified handoff');

  M.recordUse('capability_handoff_consumed_by_funnel',{request_id:'r1'});
  M.recordUse('request_resolved_from_reference',{request_id:'r2'});
  const stats=M.stats();
  assert(stats.inventory.verified_capabilities>=2);
  assert(stats.inventory.deprecated_capabilities>=1);
  assert(stats.inventory.quarantined_capabilities>=1);
  assert(stats.inventory.verified_compositions>=3);
  assert(stats.inventory.failure_evidence>=1);
  assert(stats.inventory.reconsiderations>=3);
  assert(stats.inventory.abstraction_candidates>=1);
  assert(stats.usage.bounded_reconsiderations>=3);
  assert(stats.usage.capability_handoffs_consumed>=1);
  assert(stats.usage.estimated_repeated_reasoning_avoided>=2,'usage stats must count real reuse events');

  const pulse=require('node:fs').readFileSync('pulse-spine.js','utf8');
  assert(pulse.includes("'capability','assembly','composition','handoff','learning'"),'Pulse reference graph must support Refinery kinds');
  assert(pulse.includes('capabilities:all.filter'), 'Pulse reference packet must expose capabilities');
  assert(pulse.includes('ensureCapabilityMemoryProject'), 'Refinery must exist as its own Pulse project');
  assert(pulse.includes('supports_abstraction'), 'Pulse spine must preserve repeated verified relationship patterns');
  assert(pulse.includes('recalled_failure'), 'Pulse spine must carry reusable negative evidence into the reference graph');

  const request=require('node:fs').readFileSync('moor-request.js','utf8');
  assert(request.includes("'capabilities','assemblies','compositions','handoffs','learning'"),'Funnel references stage must ingest Refinery lanes');
  assert(request.includes("capability_handoff_consumed_by_funnel"),'Funnel consumption must be measured');

  const beamCss=require('node:fs').readFileSync('pulse-beam.css','utf8');
  assert(beamCss.includes('.beam-top'));
  assert(beamCss.includes('.beam-dock'));
  assert(beamCss.includes('.beam-sheet.library'));
  assert(beamCss.includes('.beam-sheet.inspector'));
  assert(beamCss.includes('bottom:calc(max(9px,env(safe-area-inset-bottom)) + 75px)'),'command must sit above Beam dock');
  const beamJs=require('node:fs').readFileSync('pulse-beam.js','utf8');
  assert(beamJs.includes('Funnel Hall'));
  assert(beamJs.includes('Library'));
  assert(beamJs.includes("setSpace('create'"));

  const dash=require('node:fs').readFileSync('pulse-dashboard.html','utf8');
  assert(dash.includes('pulse-beam.css?v=20261006-beam1'));
  assert(dash.includes('moor-capability-memory.js?v=20261006-cumulative1'));
  assert(dash.indexOf('moor-capability-memory.js?v=20261006-cumulative1')<dash.indexOf('pulse-spine.js?v=20261006-cumulative1'),'Refinery memory must load before Pulse reference harvest');
  assert(dash.includes('pulse-beam.js?v=20261006-beam1'));
  assert(!dash.includes('pulse-creation-deck.js?v=20261006-deck1'),'Creation Deck must be retired from live shell');
  assert(!dash.includes('moor-luxe.js?v=20261006-luxe1'),'old Luxe Pulse shell must not be active');

  const memoryUi=require('node:fs').readFileSync('pulse-capability-memory.html','utf8');
  assert(memoryUi.includes('Latest cumulative reconsideration'));
  assert(memoryUi.includes('Abstraction candidates'));
  assert(memoryUi.includes('Failure evidence'));

  const ext=require('node:fs').readFileSync('pulse-component-extensions.js','utf8');
  assert(ext.includes('"id":"capability-memory"'));

  console.log('PASS: Pulse now compounds verified capability deltas through bounded reconsideration, preserves negative evidence, promotes tested compositions, surfaces abstraction candidates, and keeps Funnel authority singular');
})().catch(e=>{console.error(e);process.exit(1)});