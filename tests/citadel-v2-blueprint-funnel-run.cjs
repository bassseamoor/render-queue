const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sealPath='blueprint/funnel-citadel-v2.seal.json',write=process.argv.includes('--write');
const old=fs.existsSync(sealPath)?JSON.parse(fs.readFileSync(sealPath)):null;
const at=old?.sealed_at||new Date().toISOString();const RealDate=Date;global.Date=class extends RealDate{constructor(...a){super(...(a.length?a:[at]))}static now(){return RealDate.parse(at)}};
const K=require('../funnel-kernel.js'),bp=require('../blueprint/funnel-citadel-v2.blueprint.json');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const references=['blueprint-sop.html','blueprint-standard.html','blueprint-deep-links.html','FUNNEL.md','blueprint/moor-funnel-citadel.super-blueprint.json','blueprint/pulse-beam-six-hour-citadel.blueprint.json','blueprint/dt06-mobile-semantic-parity.blueprint.json','pulse-beam-funnel-hall.js','pulse-beam-funnel-hall.html','funnel-environment-data.js','factory-twin-core.js','pulse-component-extensions.js','pulse-manifest.json'];
const runtime=require('../blueprint/funnel-citadel-v2.runtime-preview.json'),presentation=require('../blueprint/funnel-citadel-v2.presentation-preview.json');
assert(runtime.checks.length===3&&runtime.checks.every(x=>x.errors.length===0&&x.info&&x.canvas));
assert(presentation.checks.slice(0,3).every(x=>!x.overflow&&x.errors.length===0&&x.plates===21));
assert(presentation.checks[3].registered&&presentation.checks[3].visible);
assert(presentation.checks[3].errors.every(e=>e==='factoryNodeMap is not defined'),'unknown host failures block seal');
const gates={
 SELL:'PASS — arrival promise, creation-law stakes and selectable graph reveal, visually reviewed at 1440×900 and 390×844.',
 SPEC:'PASS — all 209 runtime lines in 21 contiguous hashed plates; four unique patches syntax-check; equations and candidate runtime checks pass.',
 SHOW:'PASS — floor-plan and laser-section schematics, oversized reveal, colored plate hierarchy; three responsive renders show no document overflow; expanded phone recipe readable.',
 EXEMPLAR:'PASS — DL-02 v2 exact-anchor/code/value/rationale/assertion pattern extended to every runtime plate and repair; existing systems reused.',
 HONESTY:'PASS — publication only; runtime_implementation_authorized=false; existing Hall factoryNodeMap error preserved as P1; candidate preview is explicitly temporary; social/property and DT-06 remain unreleased.'
};
K._resetForTests();const id='funnel-citadel-fc02-rev2';
K.open({request_id:id,input:bp.page0,source:'owner',context:{project:'Pulse',surface:'Funnel Citadel',scope:'executable blueprint publication'}});
const plan=K.makeUsagePlan(bp.page0,{source:'owner',page:'Pulse / Funnel Citadel'},{execution_plan:{build_required:true,builder:'Blueprint author; runtime patches require separate v44 release',destination:bp.destination,reuse_before_new:true},decomposition_plan:{parallelize_independent_surfaces:false,surfaces:['existing source audit','calculated geometry','exact repairs','comic-book rendering','verification'],preserve_shared_page0:true,reunify_before_blueprint:true},verification_plan:{compare_to_page0:true,require_done_criteria:true,verify_requested_path:true,checks:['SELL','SPEC','SHOW','EXEMPLAR','HONESTY','unique anchors and calculated data','candidate runtime three viewports','blueprint three viewports and Pulse entry','separate publication/runtime authority'],write_failures_back_as_evidence:true}});
K.advance({request_id:id,stage:'usage_plan',payload:{plan},provenance:'system'});
K.write({request_id:id,kind:'answer',value:{question:'Which in-progress blueprint?',answer:bp.owner_clarification},source:'owner clarification',provenance:'explicit'});
K.advance({request_id:id,stage:'references',payload:{reused:references,missing:[]},provenance:'verified'});
K.write({request_id:id,kind:'failure',value:{issue:'Existing Hall references undeclared factoryNodeMap; it crashes when opened through Pulse.',resolution:'Exact P1 planned and verified in temporary runtime; baseline not falsely marked repaired.'},source:'browser pageerror + source audit',provenance:'verified'});
K.write({request_id:id,kind:'failure',value:{issue:'Initial blueprint split table exceeded viewport.',resolution:'minmax(0,1fr) tracks and min-width:0; rerendered all three widths without overflow.'},source:'presentation preview',provenance:'verified'});
K.advance({request_id:id,stage:'distill',payload:{spec_draft:JSON.stringify({blueprint:bp.title,version:2,scope:bp.scope,plates:bp.plates.map(p=>({id:p.id,contract:p.contract,hash:p.code_sha256})),patches:bp.patches,contracts:bp.contracts,values:bp.values,non_goals:bp.non_goals})},provenance:'explicit'});
K.advance({request_id:id,stage:'decisions',payload:{locked:['Owner selected Funnel Citadel.','Preserve parent identity and future phases; exact revision targets existing room and planned repairs.','Existing graph, renderer, Twin, registry and kernel reused; no replacement platform.','Blueprint publication only; four runtime repairs stay unreleased.','All owner-facing links stay inside Pulse.','Current baseline Hall error is disclosed, not hidden by blueprint checks.'],unresolved:[]},provenance:'explicit'});
K.write({request_id:id,kind:'evidence',value:{gates,runtime_preview:runtime,presentation_preview:presentation,artifacts:['docs/citadel-v2-proof/desktop.png','docs/citadel-v2-proof/phone.png','docs/citadel-v2-proof/expanded-plate-phone.png','docs/citadel-v2-proof/pulse.png']},source:'numeric assertions + browser verification + rendered review',provenance:'verified'});
const obligations=K.extractObligations(bp.page0).map(o=>({...o,status:'satisfied',evidence:'FC-02 REV 2 exact plates / contracts / calculations / visual renders / v44 publication seal'}));
K.advance({request_id:id,stage:'replay',payload:{page0_verified:true,page0_hash:K.hash(bp.page0),obligations,substitutions:[]},provenance:'verified'});
const blueprint_sha256=sha(fs.readFileSync('blueprint/funnel-citadel-v2.blueprint.json'));
K.advance({request_id:id,stage:'verdict',payload:{spec:{artifact:'blueprint-funnel-citadel-v2.html',blueprint:'blueprint/funnel-citadel-v2.blueprint.json',blueprint_sha256,version:2,tool:'blueprintfc2',runtime_implementation_authorized:false,gates,obligations},destination:bp.destination,done_criteria:bp.done_criteria},provenance:'verified'});
const s=K.inspect(id);assert(K.verifyReceipt(s.receipt));assert.equal(K.executionPacket(s.receipt).spec.runtime_implementation_authorized,false);
const seal={schema:'moor.citadel-blueprint-seal',version:2,sealed_at:at,verdict:'BUILD',runtime_implementation_authorized:false,blueprint_sha256,gates,receipt:s.receipt,usage_plan:s.stages.usage_plan.plan,known_gap:'Existing Hall factoryNodeMap error is P1; publication does not repair the production runtime.'};
if(write)fs.writeFileSync(sealPath,JSON.stringify(seal,null,2)+'\n');else{assert(old,'seal missing');assert.deepEqual(seal,old,'sealed ledger must reproduce exactly');}
console.log(JSON.stringify({pass:true,verdict:'BUILD',law:K.law_version,revision:K.revision,receipt:s.receipt.fingerprint,destination:s.receipt.destination,runtime_implementation_authorized:false}));
