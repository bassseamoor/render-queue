/* MOOR Semantic Detail Core v1 — rich description -> concrete design specifications.
 *
 * Takes sufficiently rich source semantics about a desired environment, experience,
 * interface, object, place, app, or world and expands/compiles those semantics into
 * the concrete details needed for high-quality design and implementation.
 *
 * It answers: WHAT WOULD HAVE TO BE TRUE IN THE ACTUAL REALIZED THING FOR THE
 * SOURCE DESCRIPTION TO BE TRUE?
 *
 * Pipeline: extractSemantics(text) -> expandToSpecs(semantics,{seed,domain})
 *           -> one semantic object with three projections:
 *              machine spec (the object itself),
 *              projectForHuman (blueprint section per MOOR-BLUEPRINT-STANDARD),
 *              projectForBuilder (actionable checklist).
 *
 * Provenance (every spec item tagged; never silently convert inference to truth):
 *   explicit   - stated directly in the source
 *   implied    - strong consequence of explicit facts
 *   inferred   - design decision made to realize the experience
 *   creative   - generator proposal (seeded; varies, never a rigid catalogue)
 *   unresolved - needs a human decision
 *
 * Deterministic + seeded: same input + seed -> same output. No LLM. No network.
 * Reuses funnel-reference-search-core tokenizer/stemmer when available.
 *
 * Funnel receipt 79acd43b02caf34e (2026-10-07).
 *
 * TAGS: kind:component | cat:creation | prov:semantic-detail-expansion |
 *       see:funnel-reference-search-core see:evergrove see:moor-blueprint-standard |
 *       src:funnel-reference-search-core.js |
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.SemanticDetail=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

/* ---------- seeded RNG (mulberry32) ---------- */
function hashSeed(str){let h=2166136261;const s=String(str||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function pick(rng,arr){return arr[Math.floor(rng()*arr.length)];}
function pickN(rng,arr,n){const c=arr.slice(),out=[];while(c.length&&out.length<n){out.push(c.splice(Math.floor(rng()*c.length),1)[0]);}return out;}

/* ---------- text utilities (reuse reference-search core when present) ---------- */
function getFRS(){try{
  if(typeof module==='object'&&module.exports){return require('./funnel-reference-search-core.js');}
}catch(e){}
  try{return (typeof globalThis!=='undefined'&&globalThis.FunnelReferenceSearch)||null;}catch(e){return null;}
}
const FRS=getFRS();
function tokens(text){if(FRS&&FRS.tokens)return FRS.tokens(text);
  return String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);}
function stem(w){if(FRS&&FRS.stem)return FRS.stem(w);
  w=String(w||'').toLowerCase();if(w.length>5){if(/ies$/.test(w))return w.slice(0,-3)+'y';if(/(sses|xes|ches|shes)$/.test(w))return w.slice(0,-2);if(/s$/.test(w))return w.slice(0,-1);}return w;}
function sentences(text){return String(text||'').replace(/\n+/g,' ').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(s=>s.length>8);}

/* word-numbers -> digits so "fifteen meters" is caught as a quantity */
const WORD_NUM={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19,twenty:20,thirty:30,forty:40,fifty:50,sixty:60,hundred:100};
function normalizeNumbers(low){
  return low.replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|hundred)\b(\s*(?:m|ft|feet|cm|in|mm|meters?)\b)/g,
    (m,w,u)=>' '+WORD_NUM[w]+u);
}

/* ---------- lexicons (curated, minimal v1) ---------- */
const MATERIALS=['wood','oak','walnut','teak','marble','granite','stone','limestone','concrete','glass','steel','brass','copper','bronze','velvet','silk','linen','leather','rattan','bamboo','ceramic','porcelain','terracotta','plaster','brick','fabric','metal','mirror','crystal','onyx','travertine','slate','quartz'];
const COLORS=['white','black','cream','ivory','beige','warm white','charcoal','gray','grey','navy','forest green','emerald','sage','terracotta','ochre','amber','gold','brass','copper','rose','blush','burgundy','indigo','azure','sky blue','teal','turquoise','sand','stone gray','warm gray'];
const LIGHT_WORDS=['sunlight','daylight','candlelight','firelight','moonlight','glow','gleam','shimmer','shaft','beam','lantern','chandelier','sconce','pendant','skylight','window','lamp','radiance','luminescence'];
const SPATIAL_PREPS=['inside','outside','above','below','beneath','beside','between','across','through','around','along','within','against','near','behind','beyond','under','over'];
const SCALE_CUES={vast:[20,60],expansive:[15,40],grand:[10,30],spacious:[8,20],generous:[6,15],comfortable:[4,10],intimate:[2.5,6],cozy:[2,5],compact:[1.5,4],tiny:[1,2.5]};
const MOODS=['serene','calm','tranquil','dramatic','moody','romantic','playful','solemn','majestic','mysterious','warm','cool','inviting','awe','wonder','intimate','energetic','peaceful','luxurious','elegant'];
const QUALITY_SUFFIX=/ous$|ful$|ive$|able$|ible$|al$|ic$|y$/;

/* quality -> design implications (seeded options, never a single canonical answer) */
const QUALITY_MAP={
  luxurious:{materials:['marble','brass','velvet','onyx','silk'],lighting:['warm layered','accent spots on texture'],spatial:['generous volume','clear sightlines']},
  elegant:{materials:['travertine','oak','linen','bronze'],lighting:['soft diffused','hidden coves'],spatial:['restrained composition','negative space']},
  warm:{materials:['oak','walnut','terracotta','linen','wool'],lighting:['2700K warm','firelight accents'],spatial:['enclosure','lower ceilings']},
  cool:{materials:['concrete','steel','glass','slate'],lighting:['4000K neutral','crisp downlights'],spatial:['open volume','hard edges']},
  serene:{materials:['limestone','oak','linen'],lighting:['soft daylight','minimal contrast'],spatial:['uncluttered','horizontal calm']},
  dramatic:{materials:['black marble','bronze','velvet'],lighting:['high contrast','pools of light in darkness'],spatial:['vertical emphasis','reveals']},
  intimate:{materials:['wood','fabric','warm plaster'],lighting:['low warm pools','candle-scale sources'],spatial:['2.5-6m enclosure','seating clusters']},
  grand:{materials:['stone','marble','brass'],lighting:['monumental daylight','chandelier scale'],spatial:['10m+ volume','processional axis']},
  natural:{materials:['oak','stone','linen','clay'],lighting:['daylight first','dappled patterns'],spatial:['organic flow','indoor-outdoor blur']},
  minimal:{materials:['plaster','oak','concrete'],lighting:['even soft','shadowless where possible'],spatial:['restraint','few objects, placed exactly']},
  cozy:{materials:['wool','wood','warm fabric'],lighting:['warm low','fireplace or equivalent'],spatial:['2-5m','soft boundaries']},
  mysterious:{materials:['dark stone','smoked glass','velvet'],lighting:['concealed sources','light as discovery'],spatial:['layered depth','partial reveals']},
};

const IMPLICATIONS=[
  {match:['glass wall','floor-to-ceiling window','glazing'],implies:'Natural light dominates; plan glare control and solar gain.',dimension:'lighting',prov:'implied'},
  {match:['fireplace','fire pit','hearth'],implies:'A radiant heat + flicker light source anchors the composition; seating orients toward it.',dimension:'spatial',prov:'implied'},
  {match:['high ceiling','double-height','vaulted'],implies:'Volume demands monumental-scale light fixtures or daylight strategy; acoustics need softening.',dimension:'spatial',prov:'implied'},
  {match:['courtyard','garden','terrace'],implies:'Indoor-outdoor threshold needs detailing: flooring transition, weather protection, planting.',dimension:'spatial',prov:'implied'},
  {match:['water','pool','fountain'],implies:'Reflections and sound become primary materials; plan waterproofing and maintenance access.',dimension:'material',prov:'implied'},
  {match:['wood'],implies:'Specify species, cut, and finish — "wood" alone is not a specification.',dimension:'material',prov:'implied'},
  {match:['marble','stone'],implies:'Veining direction and slab layout are compositional decisions; book-matching changes the read entirely.',dimension:'material',prov:'implied'},
  {match:['evening','dusk','night'],implies:'Artificial lighting carries the experience; daylight strategy is secondary.',dimension:'lighting',prov:'implied'},
  {match:['morning','dawn','daylight'],implies:'Orientation and glazing placement determine the experience; model sun path.',dimension:'lighting',prov:'implied'},
];

/* ================= extractSemantics ================= */
function extractSemantics(text){
  const sents=sentences(text);
  const facts={entities:[],qualities:[],quantities:[],materials:[],colors:[],light:[],spatial:[],moods:[],experiential:[]};
  const seen=new Set();
  const tokAll=tokens(text);
  const freq={};tokAll.forEach(t=>{const s=stem(t);freq[s]=(freq[s]||0)+1;});
  sents.forEach((sent,si)=>{
    const low=normalizeNumbers(sent.toLowerCase());
    // quantities: number + unit (digits or word-numbers, normalized above)
    const qm=low.match(/(\d+(?:\.\d+)?)\s*(sqm|square meters?|meters?|m|ft|feet|cm|in|mm)\b/g);
    if(qm)qm.forEach(q=>addFact(facts.quantities,{text:q,sentence:si,prov:'explicit'}));
    // materials (word-boundary match to avoid "stone" in "limestone")
    const hasWord=(low,w)=>new RegExp('\\b'+w.replace(/ /g,'\\s+')+'\\b').test(low);
    MATERIALS.forEach(m=>{if(hasWord(low,m))addFact(facts.materials,{text:m,sentence:si,prov:'explicit'});});
    COLORS.forEach(c=>{if(hasWord(low,c))addFact(facts.colors,{text:c,sentence:si,prov:'explicit'});});
    LIGHT_WORDS.forEach(l=>{if(hasWord(low,l))addFact(facts.light,{text:l,sentence:si,prov:'explicit'});});
    MOODS.forEach(mo=>{if(hasWord(low,mo))addFact(facts.moods,{text:mo,sentence:si,prov:'explicit'});});
    SPATIAL_PREPS.forEach(p=>{const rx=new RegExp('\\b'+p+'\\b[^,.]{0,40}','i');const mm=sent.match(rx);if(mm)addFact(facts.spatial,{text:mm[0].trim(),sentence:si,prov:'explicit'});});
    // qualities: lexicon hits
    Object.keys(QUALITY_MAP).forEach(q=>{if(hasWord(low,q))addFact(facts.qualities,{text:q,sentence:si,prov:'explicit'});});
    // entities: repeated significant stems (freq>=2, len>4)
    tokens(sent).forEach(t=>{const s=stem(t);if(s.length>4&&freq[s]>=2&&!seen.has('e:'+s)){seen.add('e:'+s);facts.entities.push({text:t,sentence:si,prov:'explicit'});}});
  });
  return facts;
}
function addFact(arr,f){const k=f.text+'|'+f.sentence;f._k=k;if(!arr.some(x=>x._k===k)){delete f._k;arr.push(f);}}
/* attach the normalized source text for implication rules that need raw-text matching */
function extractSemanticsWithText(text){
  const facts=extractSemantics(text);
  facts._sourceText=String(text||'').toLowerCase();
  return facts;
}

/* ================= expandToSpecs ================= */
function expandToSpecs(semantics,opts){
  opts=opts||{};const seed=opts.seed||'default';const domain=opts.domain||'environment';
  const rng=mulberry32(hashSeed(seed+'|'+domain));
  const specs=[]; // {dimension, statement, provenance, confidence, source}
  const S=semantics;
  const has=(arr,txt)=>arr.some(f=>f.text===txt);

  // 1. EXPLICIT: restate extracted facts as spec items
  S.quantities.forEach(q=>specs.push({dimension:'spatial',statement:'Stated dimension: '+q.text+'.',provenance:'explicit',confidence:'high',source:'sentence '+(q.sentence+1)}));
  S.materials.forEach(m=>specs.push({dimension:'material',statement:'Material named in source: '+m.text+'.',provenance:'explicit',confidence:'high',source:'sentence '+(m.sentence+1)}));
  S.colors.forEach(c=>specs.push({dimension:'material',statement:'Color named in source: '+c.text+'.',provenance:'explicit',confidence:'high',source:'sentence '+(c.sentence+1)}));
  S.light.forEach(l=>specs.push({dimension:'lighting',statement:'Light element named in source: '+l.text+'.',provenance:'explicit',confidence:'high',source:'sentence '+(l.sentence+1)}));
  S.moods.forEach(m=>specs.push({dimension:'composition',statement:'Target mood: '+m.text+'.',provenance:'explicit',confidence:'high',source:'sentence '+(m.sentence+1)}));

  // 2. IMPLIED: strong consequences via implication rules (matched against raw source text)
  const rawText=(S._sourceText||'').toLowerCase();
  const lowAll=(rawText+' '+JSON.stringify(S)).toLowerCase();
  IMPLICATIONS.forEach(rule=>{
    if(rule.match.some(m=>lowAll.includes(m))){
      specs.push({dimension:rule.dimension,statement:rule.implies,provenance:'implied',confidence:'high',source:'rule: '+rule.match[0]});
    }
  });

  // 3. INFERRED: design decisions from semantic cues
  S.qualities.forEach(q=>{
    const qm=QUALITY_MAP[q.text];
    if(qm){
      const mats=pickN(rng,qm.materials,Math.min(3,qm.materials.length));
      specs.push({dimension:'material',statement:'For "'+q.text+'": consider '+mats.join(', ')+'. (Options, not a prescription.)',provenance:'inferred',confidence:'medium',source:'quality: '+q.text});
      specs.push({dimension:'lighting',statement:'For "'+q.text+'": '+pick(rng,qm.lighting)+'.',provenance:'inferred',confidence:'medium',source:'quality: '+q.text});
      specs.push({dimension:'spatial',statement:'For "'+q.text+'": '+pick(rng,qm.spatial)+'.',provenance:'inferred',confidence:'medium',source:'quality: '+q.text});
    }
  });
  // scale cues -> dimension ranges
  Object.keys(SCALE_CUES).forEach(cue=>{
    if(lowAll.includes(cue)){
      const r=SCALE_CUES[cue];
      specs.push({dimension:'spatial',statement:'Scale cue "'+cue+'" suggests characteristic dimensions in the '+r[0]+'-'+r[1]+'m range. Confirm against actual program.',provenance:'inferred',confidence:'medium',source:'scale cue: '+cue});
    }
  });

  // 4. CREATIVE: seeded proposals (vary; never converge)
  const creativePool=[
    {dimension:'composition',statement:'Consider a single "hero" moment — one view or object composed to be unforgettable — with everything else in support.'},
    {dimension:'lighting',statement:'Design one lighting scene for the primary use and one for the secondary; a space that cannot change its light cannot change its mood.'},
    {dimension:'material',statement:'Limit the primary palette to three materials; let one of them carry the tactile surprise.'},
    {dimension:'spatial',statement:'Choreograph the arrival: the first 10 seconds of entering should answer "where am I and why is it good."'},
    {dimension:'interaction',statement:'Every significant object should invite exactly one obvious interaction; hide the rest.'},
  ];
  pickN(rng,creativePool,2).forEach(c=>specs.push({dimension:c.dimension,statement:c.statement,provenance:'creative',confidence:'low',source:'generator seed '+seed}));

  // 5. UNRESOLVED: what needs a human
  const unresolved=[];
  if(!S.quantities.length)unresolved.push('No dimensions stated — characteristic scale must be set by a human or inferred from program.');
  if(!S.materials.length)unresolved.push('No materials named — palette is fully open; generator offered options, human picks.');
  const timeCues=['morning','evening','dusk','night','dawn','day'].filter(w=>lowAll.includes(w));
  if(!timeCues.length)unresolved.push('No time-of-day cue — lighting design depends on when the space is experienced.');
  // tension: grand-scale cues combined with intimate/warm/cozy cues
  const grandCues=['grand','vast','expansive','monumental'].filter(w=>lowAll.includes(w));
  const intimateCues=['intimate','cozy','warm'].filter(w=>lowAll.includes(w));
  if(grandCues.length&&intimateCues.length){
    unresolved.push('Scale tension: source is both "'+grandCues[0]+'" and "'+intimateCues.join('/')+'". Resolve whether warmth comes from material/light (keeping grand volume) or from reduced scale — the generator offered both readings.');
  }
  unresolved.forEach(u=>specs.push({dimension:'open',statement:u,provenance:'unresolved',confidence:'low',source:'gap analysis'}));
  return {domain,seed,specs};
}

/* ================= projections ================= */
const PROV_LABEL={explicit:'EXPLICIT — stated in the source',implied:'IMPLIED — strong consequence',inferred:'INFERRED — design decision',creative:'CREATIVE — generator proposal',unresolved:'UNRESOLVED — needs a human'};
const PROV_ORDER=['explicit','implied','inferred','creative','unresolved'];
function projectForHuman(specObj,domainLabel){
  const L=[];
  L.push('# Design Detail Expansion — '+(domainLabel||specObj.domain||'environment'));
  L.push('');
  L.push('> Expanded from rich source semantics. Every item carries provenance: what the source said,');
  L.push('> what follows from it, what the generator decided, and what still needs a human.');
  L.push('');
  PROV_ORDER.forEach(prov=>{
    const items=specObj.specs.filter(s=>s.provenance===prov);
    if(!items.length)return;
    L.push('## '+PROV_LABEL[prov]+' ('+items.length+')');
    L.push('');
    const byDim={};items.forEach(it=>{(byDim[it.dimension]=byDim[it.dimension]||[]).push(it);});
    Object.keys(byDim).sort().forEach(dim=>{
      L.push('**'+dim+'**');
      byDim[dim].forEach(it=>L.push('- '+it.statement+(it.source?' _['+it.source+']':'')));
      L.push('');
    });
  });
  return L.join('\n');
}
function projectForBuilder(specObj){
  const L=[];
  L.push('# Builder Checklist — '+(specObj.domain||'environment'));
  L.push('');
  L.push('Derived from the expanded design specification. Work top-down; resolve UNRESOLVED first.');
  L.push('');
  let n=0;
  PROV_ORDER.forEach(prov=>{
    specObj.specs.filter(s=>s.provenance===prov).forEach(it=>{
      n++;L.push('- [ ] ('+prov.toUpperCase()+') ['+it.dimension+'] '+it.statement);
    });
  });
  L.push('');
  L.push('_'+n+' items. Provenance key: EXPLICIT = source said it; IMPLIED = follows strongly; INFERRED = design decision; CREATIVE = proposal; UNRESOLVED = human must decide._');
  return L.join('\n');
}

module.exports={extractSemantics,extractSemanticsWithText,expandToSpecs,projectForHuman,projectForBuilder,tokens,stem,QUALITY_MAP,SCALE_CUES};
return {extractSemantics,extractSemanticsWithText,expandToSpecs,projectForHuman,projectForBuilder,tokens,stem,QUALITY_MAP,SCALE_CUES};
});
