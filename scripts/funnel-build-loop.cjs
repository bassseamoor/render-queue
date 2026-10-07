'use strict';

const fs=require('node:fs');
const path=require('node:path');
const Usage=require('../funnel-usage-plan-core.js');
const Ch=require('../blueprint-choreography-core.js');
const WR=require('../worker-release-core.js');

function readJson(p){return JSON.parse(fs.readFileSync(path.join(__dirname,'..',p),'utf8'))}
function existingFile(ref){try{return fs.existsSync(path.join(__dirname,'..',ref))}catch(_){return false}}
function firstEvidence(ev,rx){return (ev&&ev.evidence||[]).find(x=>rx.test(String(x)))||null}

function planNext(input){
  input=input||{};
  const choreography=input.choreography||readJson('blueprint/blueprint-choreography.blueprint.json');
  const evidence=input.evidence||readJson('blueprint-choreography-state.json');
  const ownerDirective=String(input.owner_directive||'').trim();
  if(!ownerDirective)throw Error('owner_directive required');
  const repositoryBase=String(input.repository_base||'').trim();
  if(!repositoryBase)throw Error('repository_base required');

  const usagePlan=Usage.build(ownerDirective,{source:'owner',page:'Project Pulse'},{
    execution_plan:{
      build_required:true,
      builder:'Current builder after sealed Funnel authorization',
      destination:'Project Pulse',
      reuse_before_new:true,
      steps:['evaluate current choreography evidence','reuse sealed blueprint if present','build only missing delta','verify requested path']
    }
  });
  const snapshot=Ch.evaluate({choreography,evidence});
  const next=snapshot.recommendation;
  if(!next)return {schema:'moor.funnel-build-loop',version:1,action:'stop',reason:'no eligible slice',usage_plan:usagePlan,snapshot};

  const observed=evidence.slices&&evidence.slices[next.slice_id]||{};
  const blueprintRef=firstEvidence(observed,/\.blueprint\.json$/);
  const sealRef=firstEvidence(observed,/\.seal(?:\.v\d+)?\.json$/);
  let blueprint=null;
  if(blueprintRef&&existingFile(blueprintRef))blueprint=readJson(blueprintRef);

  let action='prepare-blueprint';
  if(blueprint&&String(blueprint.blueprint_status||'').includes('sealed-ready')&&blueprint.runtime_implementation_authorized===false)action='execute-sealed-blueprint';
  else if(String(observed.status||'').includes('blueprint-sealed'))action='execute-sealed-blueprint';

  const touch=(blueprint&&blueprint.builder_handoff&&blueprint.builder_handoff.touch_order)||[];
  const dont=(blueprint&&blueprint.builder_handoff&&blueprint.builder_handoff.do_not_touch)||[];
  let release=null,job=null;
  if(action==='execute-sealed-blueprint'){
    if(!blueprintRef||!sealRef)throw Error('sealed blueprint action requires blueprint + seal evidence');
    const seal=readJson(sealRef);
    const done=(blueprint.acceptance||seal.done_criteria||[]).map(String);
    release=WR.makeRelease({
      release_id:'release:'+next.slice_id.toLowerCase()+':runtime:v1',
      blueprint_id:blueprint.blueprint_id||next.slice_id,
      blueprint_version:String(blueprint.version||1),
      slice_id:next.slice_id,
      page0_hash:seal.page0_hash||'owner-delegated-build-loop',
      blueprint_receipt:seal.receipt_fingerprint||sealRef,
      dependency_receipts:(next.dependsOn||[]).map(String),
      repository_base:repositoryBase,
      owner_approval:true,
      budget:{max_files:Math.max(1,touch.length),max_retries:1,mode:'single-builder'},
      release_scope:{write:touch,read:[blueprintRef,sealRef].concat(dont),interfaces:[]},
      done_criteria:done,
      verification_plan:{required:blueprint.builder_handoff&&blueprint.builder_handoff.required_verification||[],fail_closed:true}
    });
    const vr=WR.validateRelease(release);if(!vr.ok)throw Error('release invalid: '+vr.errors.join('; '));
    job=WR.makeJob(release,{
      job_id:'job:'+next.slice_id.toLowerCase()+':runtime:v1',
      objective:'Execute sealed '+next.slice_id+' blueprint exactly; do not re-plan the platform.',
      owned_files_or_interfaces:touch,
      read_scope:[blueprintRef,sealRef].concat(dont),
      capability_grant:{write_files:touch,no_authority_changes:true},
      budget:release.budget,
      inputs:{blueprint_ref:blueprintRef,seal_ref:sealRef,usage_plan_hash:Usage.hash(usagePlan)},
      expected_outputs:touch,
      done_criteria:done,
      verification_plan:release.verification_plan,
      handoff_contract:{report_states:['implemented','verified','merged','Pulse-registered','deployed/live'],no_overclaim:true}
    });
    const vj=WR.validateJob(release,job);if(!vj.ok)throw Error('job invalid: '+vj.errors.join('; '));
  }

  return {
    schema:'moor.funnel-build-loop',version:1,
    action,
    next_slice:next,
    observed_status:observed.status||null,
    blueprint_ref:blueprintRef,
    seal_ref:sealRef,
    usage_plan:usagePlan,
    release,job,
    do_not_touch:dont,
    authority:'planner only; v44 execution receipt still required before build'
  };
}

if(require.main===module){
  const args=Object.fromEntries(process.argv.slice(2).map(x=>{const i=x.indexOf('=');return i<0?[x.replace(/^--/,''),true]:[x.slice(0,i).replace(/^--/,''),x.slice(i+1)]}));
  const out=planNext({owner_directive:args.owner||process.env.MOOR_OWNER_DIRECTIVE,repository_base:args.base||process.env.MOOR_REPOSITORY_BASE});
  process.stdout.write(JSON.stringify(out,null,2)+'\n');
}
module.exports=Object.freeze({planNext});
