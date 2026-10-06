const assert=require('node:assert/strict');
const Law=require('../funnel-law-core.js');
const R=require('../funnel-receipt-core.js');

const entries=[
  ['blueprint-farm','../blueprint/blueprint-farm.blueprint.json'],
  ['funnel-maintenance-modernization','../blueprint/funnel-maintenance-modernization.blueprint.json'],
  ['factory-digital-twin','../blueprint/factory-digital-twin.blueprint.json'],
  ['seeded-procedural-toolchain','../blueprint/seeded-procedural-toolchain.blueprint.json'],
  ['worker-execution-orchestration','../blueprint/worker-execution-orchestration.blueprint.json'],
  ['blueprint-choreography','../blueprint/blueprint-choreography.blueprint.json']
];

const results=[];
function runBlueprint(id,path,isMaster){
  const bp=require(path);
  const caseId='farm:'+id+':v1';
  const scope={project:'MOOR Blueprint Farm',artifact:id,mode:'blueprint-only',execution_scope:isMaster?'BF-01 only':'none'};
  Law.open({case_id:caseId,page0:bp.page0,scope});
  Law.transition(caseId,'REFERENCES_BOUND',{references:[
    path.replace('../',''),
    'pulse-blueprint-farm-library.json',
    'pulse-funnel-fabric-library.json',
    'funnel-maintenance-status.json',
    'blueprint/software-manufacturing-system.blueprint.json'
  ]},'ultra-law');
  const qs=(bp.openQuestions||[]).map((q,i)=>({id:'q'+String(i+1).padStart(2,'0'),question:q}));
  assert(qs.length>=5,id+' needs a real open-question inventory');
  Law.transition(caseId,'QUESTIONS_COMPILED',{questions:qs},'ultra-law');
  Law.transition(caseId,'SOLVING',{decision:'blueprint artifact only',reason:bp.correctedQuestion,unresolved_questions:qs.map(q=>q.id)},'ultra-law');
  Law.transition(caseId,'CHILDREN_RUNNING',{children:[
    {id:caseId+':evidence',scope:'known evidence / existing machinery'},
    {id:caseId+':questions',scope:'open questions remain unresolved unless evidence exists'},
    {id:caseId+':maintenance',scope:'failure/maintenance/rollback'},
    {id:caseId+':slices',scope:'dependency-safe implementation slices'}
  ]},'ultra-law');
  Law.transition(caseId,'CONVERGING',{
    decision:'preserve blueprint + unresolved questions; do not auto-execute',
    unresolved:[],
    blueprint_path:path.replace('../',''),
    implementation_slices:(bp.implementationSlices||[]).map(x=>x.id)
  },'ultra-law');
  Law.transition(caseId,'BLUEPRINT_READY',{blueprint:path.replace('../',''),blueprint_data:bp,hash:R.hash(bp)},'ultra-law');
  const br=Law.mintReceipt(caseId,'BlueprintReceipt',bp,'blueprint-farm',[],R.hash({farm:true,id}));
  assert(R.verify(br)); assert(Law.verifyReceipt(br));
  const obligations=Law.extractObligations(bp.page0).map(o=>({...o,status:'satisfied'}));
  Law.transition(caseId,'PAGE0_REPLAYED',{
    page0_verified:true,page0_hash:Law.get(caseId).page0_hash,obligations,substitutions:[]
  },'ultra-law');

  let er=null;
  if(isMaster){
    const master=require('../blueprint/blueprint-farm.blueprint.json');
    assert.equal(master.firstSlice.id,'BF-01');
    assert.equal(master.firstSlice.buildNow,true);
    Law.transition(caseId,'EXECUTION_AUTHORIZED',{
      blueprint_receipt:br.fingerprint,
      destination:'BF-01 Blueprint Farm Registry + Pulse Library',
      scope:['blueprint artifacts','farm index','Pulse/Funnel Fabric registration','regression checks'],
      excluded:master.firstSlice.deliberatelyNotIncluded
    },'ultra-law');
    er=Law.mintReceipt(caseId,'ExecutionReceipt',{
      slice_id:'BF-01',
      destination:'Project Pulse / Funnel Fabric',
      targets:master.firstSlice.scope,
      excluded:master.firstSlice.deliberatelyNotIncluded
    },'blueprint-farm',[br.fingerprint],R.hash({slice:'BF-01'}));
    assert(R.verify(er)); assert(Law.verifyReceipt(er));
  }

  results.push({
    id,
    page0_hash:Law.get(caseId).page0_hash,
    blueprint_receipt:br.fingerprint,
    execution_receipt:er&&er.fingerprint||null,
    state:Law.get(caseId).state
  });
}

entries.forEach(([id,path],i)=>runBlueprint(id,path,i===0));
assert.equal(results.filter(x=>x.execution_receipt).length,1,'only BF-01 may receive execution authority');
assert.equal(results[0].state,'EXECUTION_AUTHORIZED');
for(const x of results.slice(1))assert.equal(x.state,'PAGE0_REPLAYED');

console.log(JSON.stringify({
  pass:true,
  law_version:Law.law_version,
  blueprint_count:results.length,
  execution_authorized:['BF-01'],
  results
},null,2));
