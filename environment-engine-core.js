/* MOOR Environment Engine — canonical presentation quality kernel.
 * Distills repeatable presentation laws from the long-form ambient studios.
 * Authority for advancement lives in the Funnel contract, not in this renderer.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EnvironmentEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

var RECIPE_SCHEMA='moor.environment-presentation-recipe';
var CONTRACT_SCHEMA='moor.environment-advancement-contract';
var VERSION=1;
var MAX_VERIFIED_SEGMENT_SECONDS=3600;
var DEFAULT_HOURS=8;

var STUDIOS=Object.freeze([
  {id:'fireplace',label:'Fireplace',source:'studios/fireplace/README.md',lessons:['eight-pass render order','MSAA/depth/shadow/resolve targets','deterministic material maps','camera separated from world','surface detail and life']},
  {id:'aquarium',label:'Aquarium',source:'studios/aquarium/README.md',lessons:['fog and caustics','light rays and water surface','layered flora/fauna','grade pass','fixed-step render hooks']},
  {id:'alien-planet',label:'Alien Planet',source:'studios/alien-planet/README.md',lessons:['adaptive WebGL2','terrain and mesh shadows','sky/post separation','weather particles','seeded world rebuild']},
  {id:'canal-metropolis',label:'Canal Metropolis',source:'studios/canal-metropolis/README.md',lessons:['render targets','mist/composite/optics','AO and blur','city plus nature depth','deterministic render hardening']},
  {id:'drowned-forest',label:'Drowned Forest',source:'studios/drowned-forest/README.md',lessons:['eight depth planes','lens/post pipeline','realm builders','atmospheric separation','seeded remix']},
  {id:'molten',label:'Molten',source:'studios/molten/README.md',lessons:['high-contrast emissive material','procedural motion','post pipeline','fixed-step export','seeded ambience']},
  {id:'parallax-engine',label:'Parallax Engine',source:'studios/parallax-engine/README.md',lessons:['depth-first composition','camera/parallax separation','seed reproducibility','long-form cadence','portable settings']},
  {id:'rainforest',label:'Rainforest',source:'studios/rainforest/README.md',lessons:['dense layered ecology','atmospheric depth','organic motion','ambient sound bed','seed reproducibility']}
]);

var QUALITY_LAWS=Object.freeze([
  {id:'deterministic-time',label:'Deterministic time',rule:'Presentation state must be replayable from seed, recipe and fixed time.'},
  {id:'depth-first',label:'Depth-first composition',rule:'Build foreground, subject, middle distance, far field and atmosphere as explicit layers.'},
  {id:'light-shadow-depth',label:'Light / shadow / depth',rule:'Lighting, occlusion, depth and resolve are presentation structure, not optional decoration.'},
  {id:'atmosphere',label:'Atmosphere',rule:'Fog, haze, particles, water, weather or equivalent environmental media establish scale and cohesion.'},
  {id:'materials',label:'Material response',rule:'Surface color alone is insufficient; use roughness/specular/emissive/normal or analogous cues where the medium permits.'},
  {id:'life-motion',label:'Environmental motion',rule:'Motion should imply a living system and remain deterministic, subtle and pauseable.'},
  {id:'post-grade',label:'Post and grade',rule:'A coherent grade, exposure curve, vignette/optics and restrained detail pass unify the output.'},
  {id:'camera',label:'Camera choreography',rule:'Camera state is first-class, preservable and distinct from world generation.'},
  {id:'loop-audio',label:'Loop-safe ambience',rule:'Long presentation may use seeded, seamless ambience; sound failure must never destroy visual output.'},
  {id:'export-proof',label:'Export proof',rule:'Long-form output needs fixed-step timing, diagnostics, bounded segments and evidence that media was actually encoded.'},
  {id:'accessibility',label:'Presentation restraint',rule:'Reduced-motion, pause, legibility and performance budgets remain part of visual correctness.'},
  {id:'provenance',label:'Presentation provenance',rule:'Every promoted presentation rule must retain the source lesson and Funnel decision that justified it.'}
]);

var REQUIRED_GATES=Object.freeze([
  'source_provenance',
  'intent_replay',
  'deterministic_replay',
  'rendered_inspection',
  'performance_budget',
  'mobile_legibility',
  'reduced_motion',
  'no_false_capability_claims'
]);

function clamp(v,a,b){v=Number(v);return Math.max(a,Math.min(b,isFinite(v)?v:a));}
function hashSeed(s){var h=2166136261>>>0;s=String(s);for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function hex(n){return '#'+('000000'+(n>>>0).toString(16)).slice(-6);}
function colorFrom(rng,base){
  var h=(base+rng()*46-23+360)%360,s=58+rng()*24,l=42+rng()*16;
  return {h:Number(h.toFixed(2)),s:Number(s.toFixed(2)),l:Number(l.toFixed(2))};
}
function hsl(c,a){
  if(a==null)return 'hsl('+c.h+' '+c.s+'% '+c.l+'%)';
  return 'hsl('+c.h+' '+c.s+'% '+c.l+'% / '+a+')';
}

function planLongForm(input){
  input=input||{};
  var hours=clamp(input.hours==null?DEFAULT_HOURS:input.hours,1/60,24);
  var fps=Math.round(clamp(input.fps==null?30:input.fps,1,120));
  var totalSeconds=Math.round(hours*3600);
  var segMax=Math.round(clamp(input.segmentSeconds==null?MAX_VERIFIED_SEGMENT_SECONDS:input.segmentSeconds,60,MAX_VERIFIED_SEGMENT_SECONDS));
  var count=Math.ceil(totalSeconds/segMax),segments=[];
  for(var i=0;i<count;i++){
    var offset=i*segMax,seconds=Math.min(segMax,totalSeconds-offset);
    segments.push({
      index:i+1,
      offsetSeconds:offset,
      seconds:seconds,
      frames:seconds*fps,
      query:{
        render:'1',
        fps:String(fps),
        seconds:String(seconds),
        offset:String(offset),
        segment:String(i+1),
        segments:String(count)
      }
    });
  }
  return {
    strategy:'bounded-deterministic-segments',
    totalSeconds:totalSeconds,
    hours:Number((totalSeconds/3600).toFixed(4)),
    fps:fps,
    maxVerifiedSegmentSeconds:MAX_VERIFIED_SEGMENT_SECONDS,
    segmentCount:count,
    segments:segments,
    continuity:{
      sameSeed:true,
      fixedStep:true,
      absoluteTimeOffset:true,
      loopSafeAudio:true
    },
    honestLimit:'The shared verified studio controller is bounded to one-hour render segments. An eight-hour plan is therefore eight deterministic one-hour segments; automatic final-file concatenation is not claimed by Environment Engine v1.'
  };
}

function profileDefaults(profile){
  var p=String(profile||'canonical').toLowerCase();
  if(['canonical','workspace','world','showcase'].indexOf(p)<0)p='canonical';
  return {
    id:p,
    motion:p==='workspace'?0.32:p==='canonical'?0.52:p==='world'?0.72:0.84,
    atmosphere:p==='workspace'?0.42:p==='canonical'?0.68:p==='world'?0.82:0.74,
    contrast:p==='workspace'?0.86:p==='canonical'?1.02:p==='world'?1.08:1.16,
    detail:p==='workspace'?0.48:p==='canonical'?0.68:p==='world'?0.84:0.88,
    camera:p==='workspace'?'anchored':p==='canonical'?'slow-drift':p==='world'?'exploratory':'hero-orbit'
  };
}

function compile(input){
  input=input||{};
  var seed=String(input.seed||'MOOR-CANON-001');
  var profile=profileDefaults(input.profile);
  var rng=mulberry32(hashSeed(seed+'|'+profile.id+'|environment-v1'));
  var baseHue=Math.floor(rng()*360);
  var c0=colorFrom(rng,baseHue),c1=colorFrom(rng,(baseHue+38)%360),c2=colorFrom(rng,(baseHue+184)%360);
  var recipe={
    schema:RECIPE_SCHEMA,
    version:VERSION,
    seed:seed,
    seedHash:hashSeed(seed),
    profile:profile,
    sourceStudios:STUDIOS.map(function(s){return {id:s.id,source:s.source};}),
    qualityLaws:QUALITY_LAWS.map(function(x){return x.id;}),
    composition:{
      depthPlanes:8,
      horizon:Number((0.46+rng()*0.08).toFixed(4)),
      foregroundWeight:Number((0.54+rng()*0.18).toFixed(4)),
      subjectWeight:Number((0.62+rng()*0.18).toFixed(4)),
      negativeSpace:Number((0.18+rng()*0.18).toFixed(4))
    },
    lighting:{
      keyAngle:Number((0.15+rng()*0.7).toFixed(4)),
      keyStrength:Number((0.82+rng()*0.35).toFixed(4)),
      fillStrength:Number((0.2+rng()*0.24).toFixed(4)),
      rimStrength:Number((0.25+rng()*0.4).toFixed(4)),
      shadowSoftness:Number((0.45+rng()*0.35).toFixed(4)),
      depthOcclusion:Number((0.42+rng()*0.32).toFixed(4))
    },
    atmosphere:{
      density:Number((profile.atmosphere*(0.82+rng()*0.28)).toFixed(4)),
      haze:Number((0.36+rng()*0.38).toFixed(4)),
      particleDensity:Number((0.18+rng()*0.4).toFixed(4)),
      waterReflection:Number((0.28+rng()*0.44).toFixed(4))
    },
    material:{
      roughness:Number((0.28+rng()*0.42).toFixed(4)),
      specular:Number((0.28+rng()*0.38).toFixed(4)),
      emissive:Number((0.06+rng()*0.2).toFixed(4)),
      microDetail:Number((profile.detail*(0.82+rng()*0.24)).toFixed(4))
    },
    post:{
      exposure:Number((0.92+rng()*0.22).toFixed(4)),
      contrast:Number(profile.contrast.toFixed(4)),
      bloom:Number((0.06+rng()*0.16).toFixed(4)),
      vignette:Number((0.12+rng()*0.16).toFixed(4)),
      grain:Number((0.008+rng()*0.012).toFixed(4)),
      chroma:Number((0.002+rng()*0.006).toFixed(4))
    },
    camera:{
      mode:profile.camera,
      fov:Number((48+rng()*20).toFixed(2)),
      drift:Number((profile.motion*(0.42+rng()*0.3)).toFixed(4)),
      preserveAsState:true
    },
    motion:{
      intensity:Number(profile.motion.toFixed(4)),
      deterministic:true,
      pauseable:true,
      reducedMotionScale:0.12
    },
    palette:{
      skyTop:hsl(c0),
      skyBottom:hsl(c1),
      accent:hsl(c2),
      glass:hsl(c0,0.16),
      text:'#eef6ff',
      background:'#05080f'
    },
    audio:{
      mode:'seeded-loop-safe-ambience',
      loopSeconds:60,
      bestEffort:true,
      visualOutputSurvivesAudioFailure:true
    },
    export:planLongForm({
      hours:input.hours==null?DEFAULT_HOURS:input.hours,
      fps:input.fps==null?30:input.fps
    }),
    authority:{
      funnelContract:'FUNNEL.md',
      funnelKernel:'funnel-kernel.js',
      funnelLaw:'v44-sealed',
      blueprint:'blueprint/environment-engine-canonical-presentation.blueprint.json',
      advancementContractSchema:CONTRACT_SCHEMA
    }
  };
  return recipe;
}

function validateRecipe(r){
  var errors=[];
  if(!r||r.schema!==RECIPE_SCHEMA)errors.push('wrong recipe schema');
  if(!r||r.version!==VERSION)errors.push('unsupported recipe version');
  if(!r||typeof r.seed!=='string'||!r.seed)errors.push('seed required');
  if(!r||!r.composition||r.composition.depthPlanes<4)errors.push('depth composition incomplete');
  if(!r||!r.authority||r.authority.funnelLaw!=='v44-sealed')errors.push('Funnel authority missing');
  if(!r||!r.export||!Array.isArray(r.export.segments)||!r.export.segments.length)errors.push('long-form plan missing');
  return {ok:errors.length===0,errors:errors};
}

function validateContract(contract){
  var errors=[];
  if(!contract||contract.schema!==CONTRACT_SCHEMA)errors.push('wrong advancement contract schema');
  if(!contract||contract.version!==1)errors.push('unsupported advancement contract version');
  if(!contract||contract.funnel_law!=='v44-sealed')errors.push('advancement contract must bind v44-sealed');
  if(!contract||!Array.isArray(contract.required_gates))errors.push('required_gates missing');
  else REQUIRED_GATES.forEach(function(g){if(contract.required_gates.indexOf(g)<0)errors.push('missing required gate: '+g);});
  return {ok:errors.length===0,errors:errors};
}

function advancementGate(evidence,contract){
  evidence=evidence||{};
  var cv=validateContract(contract);
  var missing=[];
  REQUIRED_GATES.forEach(function(g){if(evidence[g]!==true)missing.push(g);});
  return {
    ready:cv.ok&&missing.length===0,
    contractValid:cv.ok,
    contractErrors:cv.errors,
    missing:missing,
    authority:cv.ok?'Funnel-backed':'blocked'
  };
}

function advance(current,evidence,contract,next){
  var gate=advancementGate(evidence,contract);
  if(!gate.ready)throw new Error('Canonical presentation advancement blocked: '+gate.contractErrors.concat(gate.missing).join(', '));
  var vr=validateRecipe(current);
  if(!vr.ok)throw new Error('Current presentation recipe invalid: '+vr.errors.join(', '));
  var out=compile(Object.assign({},next||{},{
    seed:(next&&next.seed)||current.seed,
    profile:(next&&next.profile)||current.profile.id,
    hours:(next&&next.hours)||current.export.hours,
    fps:(next&&next.fps)||current.export.fps
  }));
  out.supersedes={seedHash:current.seedHash,profile:current.profile.id,version:current.version};
  out.advancementEvidence=REQUIRED_GATES.slice();
  return out;
}

function presentationTokens(recipe){
  recipe=recipe||compile({});
  var p=recipe.palette;
  return {
    '--moor-env-bg':p.background,
    '--moor-env-sky-top':p.skyTop,
    '--moor-env-sky-bottom':p.skyBottom,
    '--moor-env-accent':p.accent,
    '--moor-env-glass':p.glass,
    '--moor-env-text':p.text,
    '--moor-env-motion':String(recipe.motion.intensity),
    '--moor-env-atmosphere':String(recipe.atmosphere.density)
  };
}

function applyTokens(target,recipe){
  if(!target||!target.style)return presentationTokens(recipe);
  var t=presentationTokens(recipe);
  Object.keys(t).forEach(function(k){target.style.setProperty(k,t[k]);});
  return t;
}

function sourceMatrix(){
  return STUDIOS.map(function(s){return {id:s.id,label:s.label,source:s.source,lessons:s.lessons.slice()};});
}

return Object.freeze({
  version:VERSION,
  recipeSchema:RECIPE_SCHEMA,
  contractSchema:CONTRACT_SCHEMA,
  maxVerifiedSegmentSeconds:MAX_VERIFIED_SEGMENT_SECONDS,
  studios:STUDIOS,
  qualityLaws:QUALITY_LAWS,
  requiredGates:REQUIRED_GATES,
  hashSeed:hashSeed,
  compile:compile,
  validateRecipe:validateRecipe,
  validateContract:validateContract,
  planLongForm:planLongForm,
  advancementGate:advancementGate,
  advance:advance,
  presentationTokens:presentationTokens,
  applyTokens:applyTokens,
  sourceMatrix:sourceMatrix,
  _hex:hex
});
});
