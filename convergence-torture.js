/* MOOR Convergence Torture Core v1.0.0 — pure, deterministic, browser + Node compatible */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MOOR_CONVERGENCE_TORTURE=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
const TEMPLATES=[{"id":"visual.grass-density","modality":"visual","target":"The meadow must read as dense continuous grass at walking height.","good":["The meadow reads as dense continuous grass with overlapping coverage at walking height.","Near-field grass forms a continuous soft carpet with little exposed ground."],"bad":["The meadow reads as sparse isolated stalks over large exposed green ground.","Grass appears as occasional vertical needles with broad bare gaps."],"proxy":["303 tufts were generated and 2.79 million indices are valid.","Vegetation buffers contain valid geometry."],"delta":"Rebuild the visible near-field representation until walking-height frames read as dense continuous grass."},{"id":"visual.cloud-tiling","modality":"visual","target":"Clouds must not show obvious repeating tiles or stamped texture patterns.","good":["Cloud structure varies continuously with no obvious repeating tiles or stamped patterns.","The cloud field has irregular large forms, warped erosion, and no visible repetition."],"bad":["Clouds repeat in obvious square tiles across the sky.","The same stamped cloud motif repeats at regular intervals."],"proxy":["The cloud noise texture loaded successfully and wraps correctly.","The cloud shader compiled with four noise octaves."],"delta":"Remove visible repetition using world-space multi-scale structure, domain warping, and non-repeating erosion."},{"id":"visual.depth","modality":"visual","target":"The scene must have readable foreground, midground, and background depth.","good":["Foreground, midground, and background separate clearly through scale, contrast, contact depth, and atmosphere.","The frame has strong layered depth and distant forms recede naturally."],"bad":["The scene reads flat, with foreground and distant objects sitting on the same visual plane.","Depth cues are weak and distant terrain has the same contrast as the foreground."],"proxy":["Depth buffer values are present and finite.","Camera near and far planes are configured."],"delta":"Restore layered depth with contact grounding, atmospheric perspective, and distance-aware contrast."},{"id":"visual.material-grounding","modality":"visual","target":"Objects must look grounded rather than floating or pasted onto the terrain.","good":["Objects sit convincingly on the terrain with contact shadow, occlusion, and local material transition.","Props have clear contact depth and do not appear to float."],"bad":["Objects look pasted onto the ground with bright gaps under their bases.","Props appear to float because contact depth is absent."],"proxy":["Object Y positions match sampled terrain heights within tolerance.","Collision AABBs touch the ground plane."],"delta":"Add visible contact grounding at object-terrain interfaces without changing authoritative placement."},{"id":"visual.future-natural","modality":"visual","target":"The environment must feel futuristic without collapsing into generic neon cyberpunk.","good":["Futuristic elements are restrained: precise materials, quiet emissives, embedded light, and natural weathering.","Technology feels advanced but integrated with soil, plants, stone, glass, and subtle light."],"bad":["The environment is covered in saturated neon strips and reads as generic cyberpunk.","Bright emissive accents dominate every surface and overpower the natural world."],"proxy":["Emissive materials use physically valid values.","The palette contains cyan and amber swatches."],"delta":"Reduce generic neon language; keep futuristic cues precise, quiet, and integrated with natural materials."},{"id":"visual.micro-life","modality":"visual","target":"Small life details must make the environment feel inhabited without becoming visual noise.","good":["Sparse insects, distant birds, drifting seeds, and tiny motion cues make the scene feel inhabited without clutter.","Micro-life appears selectively where ecology supports it and remains subordinate to the environment."],"bad":["Particles, birds, and bugs fill the whole frame uniformly and create distracting visual noise.","There is no small life or ambient motion anywhere, so the environment feels sterile."],"proxy":["The particle pool contains 400 active instances.","Bird agents update every simulation step."],"delta":"Use low-density habitat-aware micro-life with quiet negative space and relevance culling."},{"id":"renderer.link","modality":"visual","target":"Every production shader program that contributes to the frame must compile, link, and rasterize visible pixels.","good":["Production shader programs compile and link, and their production draw calls rasterize visible pixels.","The exact production shader pair links successfully and contributes pixels to the framebuffer."],"bad":["The grass program fails to link and its draw calls rasterize zero pixels.","A production shader is dead even though buffers and draw calls exist."],"proxy":["2.79 million indices are valid and 66,000 draw calls were issued.","Vertex buffers uploaded without errors."],"delta":"Fail at shader compile/link/raster sentinel before accepting any downstream render evidence."},{"id":"renderer.lod","modality":"visual","target":"LOD transitions must preserve the same visual identity instead of collapsing abruptly.","good":["Near, mid, and far representations transition smoothly while preserving the same visual mass and identity.","LOD changes are difficult to notice during movement and do not expose sudden holes."],"bad":["Grass jumps from individual spikes directly to nothing at mid-distance.","LOD swaps produce obvious popping, holes, and silhouette collapse."],"proxy":["LOD selection code executes and returns valid level indices.","All LOD meshes have valid buffers."],"delta":"Make LOD perceptual: preserve mass and identity across representations with crossfade or dithered transition."},{"id":"ui.multiwindow","modality":"ux","target":"The workspace must allow multiple independent resizable windows to stay open at once.","good":["Multiple independent windows remain open together, and each can be dragged and resized without closing the others.","Users can accumulate several resizable tools on one canvas."],"bad":["Opening a new tool replaces the previous panel, so only one window can exist at a time.","Windows are fixed-size and cannot be resized independently."],"proxy":["Window components are present in the DOM.","The resize handler function exists."],"delta":"Preserve independent window instances and wire real drag/resize behavior without singleton replacement."},{"id":"ui.responsive","modality":"ux","target":"The workspace must remain clean and usable across desktop and phone landscape sizes.","good":["The workspace remains readable and operable on desktop and phone landscape without clipped controls or unusable compression.","Panels reflow cleanly while preserving the same workspace model across target sizes."],"bad":["The desktop left rail is crushed and controls overlap, while phone landscape clips the workspace.","Resizing causes panels to overflow and important controls become unreachable."],"proxy":["Responsive CSS media queries exist.","The viewport meta tag is present."],"delta":"Fix actual responsive layout behavior at canonical desktop and phone-landscape viewports."},{"id":"ui.direct-manipulation","modality":"ux","target":"Dragging a component into another component must open a new composition panel instead of instantly merging them.","good":["Dropping one component onto another opens a new composition panel containing both parts while preserving the originals.","Drag composition creates a new editable canvas rather than mutating either source immediately."],"bad":["Dropping a component instantly merges and destroys the separate source parts.","Drag-and-drop does nothing beyond highlighting the target."],"proxy":["Drag event listeners are attached.","The drop zone receives pointer events."],"delta":"Route component drops into a new composition project panel and preserve both source components."},{"id":"state.reload","modality":"state","target":"Required user state must survive a full reload and reconstruct identically.","good":["After a full reload the required user state reconstructs identically from persisted data.","The saved workspace survives reload with the same authoritative values."],"bad":["A full reload loses the user's workspace and resets state to defaults.","Reload restores only part of the state and silently drops fields."],"proxy":["localStorage.setItem was called.","The save function returned success."],"delta":"Verify persistence by reloading the exact artifact and comparing reconstructed authoritative state."},{"id":"state.determinism","modality":"state","target":"The same seed and inputs must reproduce the same world result without unrelated generators perturbing it.","good":["Repeated runs with the same seed and inputs reproduce identical world results, and adding unrelated generators does not perturb existing streams.","Named random streams keep deterministic outputs stable across generator evolution."],"bad":["Adding a new generator changes existing terrain and vegetation for the same seed.","Repeated runs with the same seed produce different world results."],"proxy":["A seeded RNG object exists.","The seed string is stored in state."],"delta":"Split randomness into stable named streams and verify byte-equivalent outputs for unchanged subsystems."},{"id":"performance.frame","modality":"performance","target":"The balanced quality tier must stay within its measured frame-time budget on target hardware.","good":["On target hardware the balanced tier stays within its declared frame-time budget at median and tail percentiles.","Measured P95 frame time remains inside the balanced-tier budget on the target device."],"bad":["On target hardware P95 frame time exceeds the declared budget and interaction stutters.","Performance is reported from software rendering only, with no target-hardware measurement."],"proxy":["The perf governor reports quality 0.75.","A synthetic benchmark loop completed in 12 ms."],"delta":"Measure on target hardware and reduce the highest-cost invisible detail until the declared percentile budget is met."},{"id":"performance.degrade","modality":"performance","target":"Quality reduction must remove low-value detail before damaging the environment's visual identity.","good":["As quality drops, distant particles and expensive secondary effects disappear before core silhouettes, lighting, and gameplay readability degrade.","Low tiers preserve environmental identity while scaling density and expensive passes gracefully."],"bad":["The quality governor removes the main vegetation silhouette first, leaving a bare world.","Low quality simply lowers everything uniformly until the scene loses its identity."],"proxy":["A quality number from 0.28 to 1.0 is produced.","The governor detects slow frames."],"delta":"Bind quality to perceptual priority so invisible or secondary costs disappear before identity-defining features."},{"id":"audio.target","modality":"audio","target":"The rendered vocal must sound intense, angelic, spacious, and studio-clean without obvious destructive artifacts.","good":["The rendered vocal sounds intense and angelic with controlled spacious echoes, clear highs, and a clean studio finish.","The vocal remains intelligible while the ambience feels large and polished."],"bad":["The vocal is dry, flat, and narrow with no spatial character.","Heavy processing smears the words and produces harsh metallic artifacts."],"proxy":["The reverb node and pitch-correction node are connected.","The output file was encoded successfully."],"delta":"Judge the rendered audio itself and rebalance pitch, ambience, dynamics, and clarity until the target character is audible."},{"id":"data.roundtrip","modality":"structural","target":"Exported project data must round-trip back into the application without losing supported fields.","good":["Export followed by import reproduces all supported project fields exactly.","The round-trip comparison shows no supported-field loss or mutation."],"bad":["Import drops supported fields that were present in the exported project.","Round-trip changes values even though export and import individually report success."],"proxy":["The exporter returned JSON.","The importer parsed without throwing."],"delta":"Verify semantic round-trip equality across every supported field, not just successful serialization."},{"id":"network.offline","modality":"ux","target":"When a nonessential network dependency disappears, the app must degrade honestly to useful local operation.","good":["With the network dependency removed, local functionality remains usable and the unavailable remote capability is clearly marked.","The app degrades to honest local operation rather than entering a broken loading state."],"bad":["Killing the network leaves the application stuck on an endless loading state.","A missing remote service makes unrelated local tools unusable."],"proxy":["The fetch call has a catch handler.","A connection-status icon changes color."],"delta":"Exercise the real dependency failure and keep unrelated local capabilities functional with explicit degraded state."},{"id":"accessibility.motion","modality":"ux","target":"Reduced-motion mode must actually remove nonessential motion without removing required information.","good":["With reduced motion enabled, nonessential animation stops while all required information and controls remain available.","The interface remains understandable without camera shake, ambient movement, or decorative transitions."],"bad":["Reduced-motion mode still runs decorative movement and camera shake.","Reduced-motion mode hides controls and information instead of only removing motion."],"proxy":["A prefers-reduced-motion media query exists.","The settings screen contains a reduced-motion toggle."],"delta":"Test the reduced-motion experience directly and disable nonessential motion without deleting information."},{"id":"world.terrain-truth","modality":"visual","target":"Props and vegetation must agree with the authoritative terrain surface instead of visibly floating, clipping, or sampling another height field.","good":["Props and vegetation follow the authoritative terrain surface with no visible floating or clipping across edited terrain.","CPU placement and GPU terrain presentation agree at visible contact points."],"bad":["Vegetation floats above edited terrain in some cells and clips below it in others.","Props follow a stale CPU height field while the visible terrain uses a different GPU field."],"proxy":["CPU placement height queries return finite values.","Terrain and prop generators use the same seed."],"delta":"Route placement and presentation through the same authoritative terrain contract and verify visible contact after edits."},{"id":"pipeline.intent","modality":"structural","target":"No proxy metric may promote a result when the requested observable consequence is still unverified or visibly wrong.","good":["Promotion stays blocked whenever the required observable consequence is unverified, even if lower-level proxy metrics pass.","Evidence is scoped to what it can observe, and partial gates cannot become completion."],"bad":["The build is declared complete because counts and hashes pass even though the requested observable result was never checked.","A partial perceptual gate is treated as success after structural tests pass."],"proxy":["Nine structural gates are green.","All expected files and hashes exist."],"delta":"Make promotion fail closed on the requested observable consequence and preserve evidence boundaries through every summary."}];
const EXTRAS=[{"id":"extra.debug-overlay","text":"A permanent debug overlay covers the upper-left quarter of the result.","delta":"Remove the permanent debug overlay from the production result."},{"id":"extra.neon","text":"Unrequested flashing neon particles cover the scene.","delta":"Remove unrequested flashing neon particles."},{"id":"extra.modal","text":"An unrequested blocking modal appears before the main task can be used.","delta":"Remove the unrequested blocking modal."},{"id":"extra.telemetry","text":"The result adds an unrelated telemetry dashboard that dominates the workspace.","delta":"Remove unrelated telemetry UI from the requested result."},{"id":"extra.autoplay","text":"Unrequested autoplay audio begins whenever the artifact opens.","delta":"Remove unrequested autoplay audio."},{"id":"extra.duplicate","text":"A duplicate set of controls appears beside the real controls.","delta":"Remove duplicated controls."}];
const MODALITY_LABEL={"visual":"rendered pixels","ux":"real interaction","audio":"rendered audio","state":"reload/state behavior","performance":"target-hardware performance","structural":"structural/code behavior"};
function hash32(s){
  let h=2166136261>>>0;
  s=String(s);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
function rng(seed){
  let x=(seed>>>0)||0x9e3779b9;
  return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};
}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function shuffle(r,a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function norm(s){return String(s||"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();}
function containsAny(hay,arr){const n=norm(hay);return arr.some(x=>n.includes(norm(x)));}
function compatible(reqMode,obsMode){return reqMode===obsMode || (reqMode==="visual"&&obsMode==="visual");}
function makeSituation(index,masterSeed){
  const r=rng(hash32(masterSeed+":"+index));
  const modality=pick(r,["visual","ux","state","performance","audio","structural"]);
  let pool=TEMPLATES.filter(t=>t.modality===modality);
  if(pool.length<3) pool=TEMPLATES.filter(t=>t.modality===modality||t.modality==="structural");
  const count=2+Math.floor(r()*Math.min(4,pool.length-1));
  const reqs=shuffle(r,pool).slice(0,count);
  const caseId="S"+String(index+1).padStart(4,"0");
  const expectedArtifact="build-"+caseId+"-"+Math.floor(r()*99999).toString(36);
  const dogfood=[
    `Situation ${caseId}. Produce the requested result exactly; do not substitute adjacent proxy success.`,
    ...reqs.map(t=>"- "+t.target)
  ].join("\n");

  const bad = r()<0.96;
  const mutations={};
  const obs=[];
  for(const t of reqs){
    let m="pass";
    if(bad && r()<0.62) m=pick(r,["missing","wrong","proxy","wrong","missing","contradictory"]);
    mutations[t.id]=m;
    if(m==="pass") obs.push(pick(r,t.good));
    else if(m==="wrong") obs.push(pick(r,t.bad));
    else if(m==="proxy") obs.push(pick(r,t.proxy));
    else if(m==="contradictory") obs.push(pick(r,t.good)+" "+pick(r,t.bad));
  }
  const extras=[];
  if(bad && r()<0.38){
    const e=pick(r,EXTRAS); extras.push(e.id); obs.push(e.text);
  }
  if(r()<0.22) obs.push("The worker reports that all gates pass and calls the rebuild complete.");
  const boundaryMissing=bad && r()<0.11;
  const wrongModality=bad && r()<0.10;
  const artifactMismatch=bad && r()<0.08;
  const observedModality=wrongModality ? pick(r,Object.keys(MODALITY_LABEL).filter(m=>m!==modality)) : modality;
  const boundary=boundaryMissing ? "" : `${MODALITY_LABEL[observedModality]} only; this observation cannot prove properties outside that modality.`;
  const observedArtifact=artifactMismatch ? expectedArtifact+"-stale" : expectedArtifact;
  if(!obs.length) obs.push("No directly relevant property was observed.");

  return {
    id:caseId,
    public:{
      dogfood,
      result:shuffle(r,obs).join("\n"),
      modality:observedModality,
      evidence_boundary:boundary,
      artifact:{expected:expectedArtifact,observed:observedArtifact}
    },
    truth:{reqIds:reqs.map(x=>x.id),mutations,extras,boundaryMissing,wrongModality,artifactMismatch,targetModality:modality}
  };
}
function activeTemplates(dogfood){
  return TEMPLATES.filter(t=>norm(dogfood).includes(norm(t.target)));
}
function reverseHalf(packet){
  const reqs=activeTemplates(packet.dogfood);
  const global=[];
  if(!String(packet.evidence_boundary||"").trim()) global.push("MISSING_EVIDENCE_BOUNDARY");
  if(!packet.artifact || packet.artifact.expected!==packet.artifact.observed) global.push("ARTIFACT_IDENTITY_MISMATCH");
  const results=[];
  for(const t of reqs){
    if(!compatible(t.modality,packet.modality)){
      results.push({id:t.id,status:"MISSING",reason:`Wrong observation modality: ${packet.modality} cannot prove ${t.modality}.`});
      continue;
    }
    const hasBad=containsAny(packet.result,t.bad);
    const hasGood=containsAny(packet.result,t.good);
    const hasProxy=containsAny(packet.result,t.proxy);
    if(hasBad){
      results.push({id:t.id,status:"WRONG",reason:hasGood?"Observation is contradictory; bad consequence is still present.":"Observed consequence contradicts the dogfood."});
    }else if(hasGood){
      results.push({id:t.id,status:"PASS",reason:"Requested consequence directly observed in the correct modality."});
    }else if(hasProxy){
      results.push({id:t.id,status:"MISSING",reason:"Only proxy evidence was observed; requested consequence remains unverified."});
    }else{
      results.push({id:t.id,status:"MISSING",reason:"Requested consequence was not observed."});
    }
  }
  const extras=EXTRAS.filter(e=>containsAny(packet.result,[e.text])).map(e=>({id:e.id,text:e.text,delta:e.delta}));
  const missing=results.filter(x=>x.status==="MISSING");
  const wrong=results.filter(x=>x.status==="WRONG");
  const pass=!global.length&&!missing.length&&!wrong.length&&!extras.length&&reqs.length>0;
  const delta=[
    ...global.map(g=>g==="MISSING_EVIDENCE_BOUNDARY"?"State the exact observation modality and evidence boundary before judging the result.":"Observe and compare the exact production artifact; stale or different bytes cannot be promoted."),
    ...missing.map(x=>{const t=TEMPLATES.find(t=>t.id===x.id);return t?`${x.id}: ${t.delta}`:`${x.id}: satisfy the missing requirement.`;}),
    ...wrong.map(x=>{const t=TEMPLATES.find(t=>t.id===x.id);return t?`${x.id}: ${t.delta}`:`${x.id}: correct the wrong consequence.`;}),
    ...extras.map(x=>`${x.id}: ${x.delta}`)
  ];
  return {pass,global,requirements:results,missing,wrong,extra:extras,delta,material_difference:!pass};
}
function oracle(s){
  const out={missing:[],wrong:[],extra:s.truth.extras.slice(),global:[]};
  if(s.truth.boundaryMissing) out.global.push("MISSING_EVIDENCE_BOUNDARY");
  if(s.truth.artifactMismatch) out.global.push("ARTIFACT_IDENTITY_MISMATCH");
  for(const id of s.truth.reqIds){
    if(s.truth.wrongModality){out.missing.push(id);continue;}
    const m=s.truth.mutations[id];
    if(m==="wrong"||m==="contradictory") out.wrong.push(id);
    else if(m==="missing"||m==="proxy") out.missing.push(id);
  }
  out.pass=!out.global.length&&!out.missing.length&&!out.wrong.length&&!out.extra.length;
  return out;
}
function sort(a){return a.slice().sort();}
function eq(a,b){return JSON.stringify(sort(a))===JSON.stringify(sort(b));}
function score(s,res){
  const o=oracle(s);
  const gotMissing=res.missing.map(x=>x.id),gotWrong=res.wrong.map(x=>x.id),gotExtra=res.extra.map(x=>x.id);
  const exact=eq(o.missing,gotMissing)&&eq(o.wrong,gotWrong)&&eq(o.extra,gotExtra)&&eq(o.global,res.global)&&o.pass===res.pass;
  return {exact,oracle:o,got:{missing:gotMissing,wrong:gotWrong,extra:gotExtra,global:res.global,pass:res.pass}};
}
function correctedPacket(s){
  const reqs=TEMPLATES.filter(t=>s.truth.reqIds.includes(t.id));
  return {
    dogfood:s.public.dogfood,
    result:reqs.map(t=>t.good[0]).join("\n"),
    modality:s.truth.targetModality,
    evidence_boundary:`${MODALITY_LABEL[s.truth.targetModality]} only; exact requested consequences observed.`,
    artifact:{expected:s.public.artifact.expected,observed:s.public.artifact.expected}
  };
}
function runSuite(count=1000,seed="moor-convergence-1000"){
  const stats={seed,count,exact:0,mismatches:0,falsePromotions:0,badCases:0,cleanCases:0,cleanPassed:0,convergedAfterDelta:0,failedToConverge:0,byFault:{missing:0,wrong:0,proxy:0,contradictory:0,extra:0,boundary:0,modality:0,artifact:0},failures:[],samples:[]};
  for(let i=0;i<count;i++){
    const s=makeSituation(i,seed);
    const r1=reverseHalf(s.public);
    const sc=score(s,r1);
    const o=sc.oracle;
    const isBad=!o.pass;
    if(isBad)stats.badCases++;else stats.cleanCases++;
    if(sc.exact)stats.exact++;else{stats.mismatches++;if(stats.failures.length<25)stats.failures.push({id:s.id,public:s.public,truth:s.truth,score:sc,result:r1});}
    if(isBad&&r1.pass)stats.falsePromotions++;
    if(!isBad&&r1.pass)stats.cleanPassed++;
    Object.values(s.truth.mutations).forEach(m=>{if(stats.byFault[m]!==undefined)stats.byFault[m]++;});
    stats.byFault.extra+=s.truth.extras.length;
    if(s.truth.boundaryMissing)stats.byFault.boundary++;
    if(s.truth.wrongModality)stats.byFault.modality++;
    if(s.truth.artifactMismatch)stats.byFault.artifact++;
    if(isBad){
      const r2=reverseHalf(correctedPacket(s));
      if(r2.pass)stats.convergedAfterDelta++; else stats.failedToConverge++;
    }
    if(stats.samples.length<12 && (i<4 || (isBad&&i%97===0))) stats.samples.push({id:s.id,public:s.public,truth:s.truth,reverse:r1});
  }
  stats.accuracy=stats.exact/count;
  return stats;
}
return {version:'1.0.0',TEMPLATES,EXTRAS,makeSituation,reverseHalf,oracle,score,correctedPacket,runSuite};
});
