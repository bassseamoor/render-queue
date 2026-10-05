/* MOOR Beauty Kernel v1.0.0
 * A deterministic procedural beauty grammar. Priors, not universal laws.
 * Browser + Node compatible.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.MOOR_BEAUTY=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const VERSION='1.0.0';

const KERNEL={
  definition:'Beauty is coherent complexity with clear hierarchy, believable depth, intentional variation, meaningful contrast, causal material behavior, and enough restraint that the whole is legible before the details are discovered.',
  short:'coherence × hierarchy × depth × variation × restraint × life',
  moor_signature:'clean structure, dirty consequence; advanced technology, natural occupation; precise forms, imperfect surfaces; quiet futurism inside a living world',
  principles:[
    {id:'BK-01',name:'proportional-coherence',rule:'Derive repeated dimensions from a small related ratio family instead of arbitrary independent numbers.'},
    {id:'BK-02',name:'hierarchy',rule:'Establish dominant, supporting, and accent visual authority; avoid equal importance everywhere.'},
    {id:'BK-03',name:'multi-scale-structure',rule:'Organize macro, meso, micro, and temporal structure with meaningful scale separation.'},
    {id:'BK-04',name:'distribution-quality',rule:'Use distributions that match the generating process: blue-noise, clustered, log-normal, heavy-tail, correlated fields, and 1/f-like multi-scale variation.'},
    {id:'BK-05',name:'controlled-asymmetry',rule:'Use global balance with local asymmetry and rare strong symmetry.'},
    {id:'BK-06',name:'rhythm',rule:'Alternate repetition, interruption, density, and rest; avoid uniform spacing and pure random soup.'},
    {id:'BK-07',name:'color-value-hierarchy',rule:'Large low-salience fields support smaller higher-salience accents; saturation and emissive area are sparse.'},
    {id:'BK-08',name:'depth-occlusion',rule:'Use overlap, contact, atmospheric separation, and silhouette preservation to make relationships readable.'},
    {id:'BK-09',name:'curvature-language',rule:'Use intentional continuity: C1/C2 for organic flow; deliberate C0/C1 breaks for designed hard-surface seams.'},
    {id:'BK-10',name:'material-truth',rule:'Wear, wetness, dirt, damage, reflection, and roughness follow causes rather than random decoration.'},
    {id:'BK-11',name:'temporal-coherence',rule:'Shared low-frequency causes drive regional and individual response; avoid unrelated sine motion.'},
    {id:'BK-12',name:'restraint',rule:'Not every surface glows, moves, reflects, blooms, or demands attention.'},
    {id:'BK-13',name:'exception-budget',rule:'Establish a strong visual law, then violate it selectively enough that the exception is meaningful.'},
    {id:'BK-14',name:'deterministic-causality',rule:'Randomness is seeded, scoped, and conditioned on parent systems so local parts inherit world context.'}
  ],
  hard_failures:[
    'uniform random scatter where a causal ecological or spatial process should exist',
    'visible repeated texture or motif period at the intended viewing distance unless deliberately ornamental',
    'equal visual weight across the whole frame or surface',
    'arbitrary dimension soup with no shared proportion language',
    'independent random animation for objects responding to the same physical force',
    'high-frequency detail everywhere with no quiet regions',
    'perfect regularity everywhere unless the design explicitly calls for it',
    'randomness without a causal field or parent condition',
    'extra complexity that weakens silhouette, hierarchy, legibility, or interaction',
    'random grunge, dirt, wear, or wetness with no plausible cause',
    'LOD or quality reduction that destroys identity before removing secondary detail',
    'proxy metrics treated as proof that the perceptual result is beautiful'
  ],
  ratio_families:{
    harmonic:[1,1.25,1.5,2],
    classical:[1,1.333333,1.5,1.666667],
    root2:[1,1.414214,2,2.828427],
    phi:[1,1.618034,2.618034],
    compact:[1,1.2,1.333333,1.6]
  },
  distribution_library:{
    'blue-noise':'even coverage without grids or clumps; useful for sparse natural coverage and sampling',
    'poisson-disk':'minimum spacing with organic irregularity; useful for trees, rocks, props, UI marks',
    'clustered':'colonies and neighborhoods; useful for flowers, bushes, settlements, insects, debris',
    'log-normal':'many small/medium members and a few large ones; useful for natural sizes and wear events',
    'heavy-tail':'rare dominant features among many ordinary ones; useful for landmarks, boulders, hero forms',
    'correlated-field':'placement conditioned on soil, moisture, slope, sun, traffic, heat, or another field',
    'one-over-f':'multi-frequency variation with energy across scales; useful for terrain, clouds, materials, ambience',
    'bounded-jitter':'structured repetition with controlled deviation; useful for architecture, UI, crafted objects',
    'rhythmic-sequence':'motif grammar such as A A B / A A B / A C rather than flat repetition'
  },
  domains:{
    environment:{ratios:['classical','root2'],space:['correlated-field','clustered','one-over-f'],symmetry:'global balance + local asymmetry',curvature:'mixed',motion:'shared weather field → region → object → micro detail'},
    vegetation:{ratios:['harmonic','compact'],space:['clustered','correlated-field','log-normal'],symmetry:'asymmetric growth around a coherent species grammar',curvature:'C1/C2 organic',motion:'weather field → patch → tuft/branch → tip flutter'},
    terrain:{ratios:['root2','classical'],space:['one-over-f','correlated-field','heavy-tail'],symmetry:'none globally; local geological structure',curvature:'C1/C2 except designed cliffs/cuts',motion:'mostly static; temporal weather modifies materials, particles, water'},
    architecture:{ratios:['classical','phi','root2'],space:['bounded-jitter','rhythmic-sequence','heavy-tail'],symmetry:'global balance + local controlled asymmetry',curvature:'intentional C0/C1 seams with selective C2 softness',motion:'primary transition → subordinate response → restrained secondary motion'},
    ui:{ratios:['compact','root2','harmonic'],space:['bounded-jitter','rhythmic-sequence'],symmetry:'alignment grid with selective asymmetry',curvature:'consistent corner/radius family',motion:'primary state transition → child follow-through; reduced-motion safe'},
    creature:{ratios:['harmonic','phi'],space:['bounded-jitter','log-normal'],symmetry:'bilateral base + controlled asymmetry',curvature:'C1/C2 biological flow with functional hard breaks',motion:'body intent → limb chain → secondary tissue/ornament'},
    material:{ratios:['root2','compact'],space:['correlated-field','one-over-f','log-normal'],symmetry:'surface process dependent',curvature:'inherits host form',motion:'weather/contact/history drive temporal change'},
    motion:{ratios:['harmonic'],space:['rhythmic-sequence','bounded-jitter'],symmetry:'temporal balance, not mirrored timing',curvature:'easing continuity',motion:'shared low-frequency driver + regional phase + individual response + high-frequency detail'},
    audio:{ratios:['harmonic'],space:['rhythmic-sequence','one-over-f'],symmetry:'phrase balance + controlled deviation',curvature:'envelope continuity',motion:'macro phrase → section dynamics → event timing → micro texture'}
  }
};

function hash32(s){
  let h=2166136261>>>0; s=String(s);
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
  return h>>>0;
}
function rng(seed){let x=(seed>>>0)||0x9e3779b9;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;x>>>=0;return x/4294967296;};}
function pick(r,a){return a[Math.floor(r()*a.length)];}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function round(v,n=3){const p=10**n;return Math.round(v*p)/p;}
function normalizeHierarchy(r,strictness){
  const s=clamp(strictness,0,1);
  let d=.50+r()*.25, a=.02+r()*.08;
  d=d*(1-s)+(.64+r()*.06)*s;
  a=a*(1-s)+(.055+r()*.025)*s;
  let sup=1-d-a;
  if(sup<.20){const need=.20-sup;d-=need*.8;a-=need*.2;sup=.20;}
  return {dominant:round(d),support:round(sup),accent:round(a)};
}
function compile(opts={}){
  const domain=KERNEL.domains[opts.domain]?opts.domain:'environment';
  const seed=String(opts.seed||'moor-beauty');
  const strictness=clamp(Number.isFinite(+opts.strictness)?+opts.strictness:.72,0,1);
  const r=rng(hash32(seed+'|'+domain+'|'+strictness));
  const D=KERNEL.domains[domain];
  const ratioFamily=pick(r,D.ratios);
  const ratios=KERNEL.ratio_families[ratioFamily];
  const scaleRatio=round(4+r()*6,2);
  const hierarchy=normalizeHierarchy(r,strictness);
  const exceptionBudget=round(.05+r()*.10,3);
  const quietShare=round(.18+r()*.24,3);
  const partialOcclusion=round(.12+r()*.28,3);
  const saturationAccentCap=round(.04+r()*.08,3);
  const emissiveAreaCap=round(.005+r()*.035,3);
  const localVariation=round(.04+r()*.14,3);
  const motionPhaseJitter=round(.05+r()*.20,3);
  const distributions=D.space.map(id=>({id,why:KERNEL.distribution_library[id]}));
  return {
    format:'moor.beauty-contract.v1',version:VERSION,seed,domain,strictness:round(strictness,2),
    intent:{definition:KERNEL.definition,signature:KERNEL.moor_signature},
    proportion:{family:ratioFamily,ratios,rule:'derive repeated dimensions from this family; do not force every dimension onto a magic ratio'},
    hierarchy:{...hierarchy,meaning:'visual authority; may combine projected area, contrast, scale, motion, saturation, and position'},
    scale:{bands:['macro','meso','micro','temporal'],adjacent_ratio:scaleRatio,rule:'keep enough separation that bands do not collapse into procedural mush'},
    spatial:{distributions,rule:'condition child placement on parent/world fields rather than independent randomness'},
    symmetry:{rule:D.symmetry,exception_budget:exceptionBudget},
    rhythm:{quiet_share:quietShare,rule:'alternate density and rest; use motif interruption instead of flat repetition'},
    color:{accent_saturation_area_cap:saturationAccentCap,emissive_area_cap:emissiveAreaCap,rule:'large low-salience field → smaller supporting family → sparse high-salience accent'},
    value:{background:'compressed contrast',midground:'moderate contrast',foreground:'widest useful contrast',focal:'strongest local contrast'},
    edges:{rule:'concentrate high-frequency edges around meaning; preserve quiet regions',quiet_share:quietShare},
    curvature:{rule:D.curvature},
    occlusion:{target_partial_overlap_share:partialOcclusion,rule:'create enough partial overlap for depth while preserving readable silhouettes'},
    material:{rule:'all wear/wet/dirt/roughness variation must have a plausible cause and scale hierarchy'},
    motion:{rule:D.motion,phase_jitter:motionPhaseJitter,rule2:'shared cause first; individual noise last'},
    variation:{local_bounded_variation:localVariation,rule:'bounded deviation around a learned local law; no arbitrary soup'},
    exception:{budget:exceptionBudget,rule:'establish the pattern first; spend exceptions where they create surprise, focus, story, or function'},
    hard_failures:KERNEL.hard_failures.slice(),
    conditional_model:'P(child | parent, environment, history) rather than P(child)=random()',
    promotion:'Beauty contract is a grammar and failure boundary, not a single scalar score. Final perceptual judgment still evaluates the rendered consequence.'
  };
}
function validate(c){
  const errors=[];
  if(!c||c.format!=='moor.beauty-contract.v1') errors.push('bad format');
  if(!c||!KERNEL.domains[c.domain]) errors.push('unknown domain');
  if(!c||!c.proportion||!Array.isArray(c.proportion.ratios)) errors.push('missing proportion grammar');
  if(!c||!c.hierarchy) errors.push('missing hierarchy');
  if(c&&c.hierarchy){const s=c.hierarchy.dominant+c.hierarchy.support+c.hierarchy.accent;if(Math.abs(s-1)>.003) errors.push('hierarchy does not sum to 1');}
  if(!c||!c.scale||c.scale.adjacent_ratio<4||c.scale.adjacent_ratio>10) errors.push('bad scale separation');
  if(!c||!c.exception||c.exception.budget<.05||c.exception.budget>.15) errors.push('bad exception budget');
  if(!c||!Array.isArray(c.hard_failures)||c.hard_failures.length<10) errors.push('missing hard failures');
  return {ok:errors.length===0,errors};
}
function suite(){
  const domains=Object.keys(KERNEL.domains), failures=[]; let cases=0;
  for(const d of domains){
    for(let i=0;i<100;i++){
      const seed='test-'+d+'-'+i;
      const a=compile({domain:d,seed,strictness:(i%101)/100});
      const b=compile({domain:d,seed,strictness:(i%101)/100});
      cases++;
      if(JSON.stringify(a)!==JSON.stringify(b)) failures.push({d,i,why:'nondeterministic'});
      const v=validate(a); if(!v.ok) failures.push({d,i,why:v.errors.join(', ')});
    }
  }
  return {version:VERSION,cases,failures,pass:failures.length===0};
}

return {version:VERSION,KERNEL,compile,validate,suite};
});
