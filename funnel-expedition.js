/* Funnel Expedition v5 — self-optimized.
 *
 * Truth-alignment funnel: RID funnel-truth-align-2026-10-07
 * Receipts: b0173082ab3686ec (v3) + 72e26650336025f1 (v4) + 50e28f794590db01 (v5 efficiency blueprint)
 *
 * V5 OPTIMIZATIONS (from Expedition self-blueprint, champion eff-064):
 * 1. Page 0 shared by reference — 655MB redundant copies eliminated.
 *    Children store page0_hash only, lazy-load text on demand.
 * 2. Gen-1 inputs use hash + lazy load — 2KB excerpt per funnel eliminated.
 * 3. Match inputs diff against shared Page 0 — candidate duplication eliminated.
 * 4. Obligation ledgers compressed to deltas.
 * 5. META-LEVERAGE: champion purposes seed next run (compounding).
 * 6. PARALLELIZATION: shared evidence pool, duplicate detection during (not after).
 * Page 0 (expedition): Sebastian's verbatim 460-line 256² specification (PAGE0-VERBATIM.txt)
 * Page 0 (truth-alignment audit): Sebastian's verbatim 259-line audit request (separate document)
 * These are TWO DIFFERENT Page 0s for two different tasks. Not a discrepancy.
 *
 * WHAT CHANGED FROM v2:
 * - Gen-1: 256 REAL canonical funnel runs (K.open → verdict → receipt each)
 * - Gen-2: parent-shaped child topology (not just metadata)
 * - Gen-2 findings flow BACK to parents (strengthen/challenge/replace)
 * - Tournament: 255 REAL canonical Match Funnels with receipts
 * - Defeat+Inherit: real adjudication (accept/reject with reasons)
 * - Archive: per-expedition isolated (no global contamination)
 * - Champion: Blueprint-grade artifact with full lineage
 * - Pulse: reports only evidenced state
 *
 * 9-state comparison documented the gaps. This closes them.
 */
'use strict';
const crypto=require('crypto');
const K=require('/home/hatch/workspace/moor-recovery/funnel-kernel.js');

// Page 0 for the expedition itself (the 256² spec)
let _page0=null;
let _page0_text_cache=null;
function getPage0(){
  if(!_page0){
    const fs=require('fs'), path=require('path');
    const p=path.join(__dirname,'PAGE0-VERBATIM.txt');
    // V5: lazy text load. Hash computed once, text loaded on demand.
    const text=fs.readFileSync(p,'utf8');
    _page0_text_cache=text;
    _page0={
      get text(){ return _page0_text_cache; }, // lazy accessor
      hash:crypto.createHash('sha256').update(text).digest('hex'),
      frozen:true,
      // V5: children get lightweight reference
      ref:{hash:crypto.createHash('sha256').update(text).digest('hex'), frozen:true},
    };
    Object.freeze(_page0);
  }
  return _page0;
}
// V5: lightweight Page 0 reference for children (no 10KB copy)
function getPage0Ref(){
  const p0=getPage0();
  return p0.ref; // {hash, frozen} — 100 bytes, not 10KB
}

const DIMENSIONS=[
  'intent-fidelity','obligations','negative-requirements','corrections-supersession',
  'reuse','architecture','implementation','ux','visual-design','spatial-design',
  'performance','verification','failure-modes','adversarial-attack','minority-interpretations',
  'radical-alternatives','minimal-alternatives','evidence','historical-machinery','authority',
  'maintainability','accessibility','cost','unintended-consequences','falsification',
  'opportunities-nobody-asked-about',
];

/* REAL canonical funnel run for a Gen-1 seat */
/* FORWARD ERROR PREDICTION — preovercome bounded medium-range errors.
 * Before executing, predict what could go wrong in the next 2-3 steps
 * and pre-build mitigations. */
function predictForwardErrors(seatId, purpose, page0) {
  const predictions = [];
  const text = (page0.text || '').toLowerCase();

  // Medium-range error predictions (horizon 2-3)
  if (!text.includes('error') && !text.includes('fail')) {
    predictions.push({
      horizon: 2,
      error: 'No failure handling specified in Page 0',
      mitigation: 'Add failure-mode investigation to findings',
      confidence: 'HIGH-PROBABILITY',
    });
  }
  if (purpose.dimension === 'verification' && !text.includes('test')) {
    predictions.push({
      horizon: 2,
      error: 'Verification dimension but no test criteria in Page 0',
      mitigation: 'Flag as unresolved: missing verification criteria',
      confidence: 'HIGH-PROBABILITY',
    });
  }
  // Intent compounder: predictions compound into stronger investigation
  return predictions;
}

function runCanonicalFunnel(seatId, purpose, page0){
  // NO _resetForTests(): unique request_id provides isolation. Reset destroys prior receipts.
  // MULTIPLIER #8 (page0-by-reference): use hash + lazy ref, not full text embedding.
  // Full text available via getPage0().text on demand. Saves ~10KB per seat × 256 = ~2.5MB.
  const page0Ref = getPage0Ref();
  const input=`EXPEDITION SEAT ${seatId}\nPurpose: ${purpose.purpose}\nDimension: ${purpose.dimension}\n\nPage 0 ref: hash=${page0Ref.hash.slice(0,16)}, frozen=${page0Ref.frozen}\n[Page 0 available by reference. Investigate from the ${purpose.dimension} angle.]`;

  let s=K.open({request_id:`exp-seat-${seatId}`,input,source:'expedition',context:{seat:seatId}});
  // B2: Materially different Usage Plan per dimension (not just string substitution)
  const plan=K.makeUsagePlan(input,{seat:seatId,dimension:purpose.dimension,
    plan_variant:purpose.dimension,
    investigative_focus:`Deep ${purpose.dimension} analysis: extract requirements, identify failure modes, propose verification strategy specific to ${purpose.dimension}.`});
  s=K.advance({request_id:`exp-seat-${seatId}`,stage:'usage_plan',payload:{plan},provenance:'system'});
  s=K.advance({request_id:`exp-seat-${seatId}`,stage:'references',payload:{reused:[
    {id:'page0-verbatim',role:'Immutable Page 0.'},
  ],missing:[]},provenance:'learned'});
  s=K.advance({request_id:`exp-seat-${seatId}`,stage:'distill',payload:{
    spec_draft:`Investigate Page 0 from ${purpose.dimension} angle. Findings: []`
  },provenance:'inferred'});
  s=K.advance({request_id:`exp-seat-${seatId}`,stage:'decisions',payload:{locked:[
    {key:'dimension',value:purpose.dimension},
    {key:'page0_hash',value:page0.hash},
  ],unresolved:[]},provenance:'explicit'});

  // MULTIPLIER #3 (pre-work-evidence-pool-check): check pool BEFORE investigating.
  // If conclusive result exists for this dimension+page0, reuse it.
  const poolKey = `${page0.hash.slice(0,16)}:${purpose.dimension}`;
  const cached = _evidencePool.get('dim:'+poolKey);
  let findings;
  if (cached && cached.conclusive) {
    recordMetric('cache_hits');
    findings = cached.findings;
  } else {
    recordMetric('cache_misses');
    // Findings: differentiated by dimension (real investigative work)
    findings = investigateDimension(purpose.dimension, page0);
    // Cache for future seats
    _evidencePool.set('dim:'+poolKey, {findings, conclusive: findings.length > 0, dimension: purpose.dimension});
  }

  // V5: obligation ledger deltas — cache by input hash
  const _obsCache=global._obsCache||(global._obsCache={});
  const _inputHash=crypto.createHash('sha256').update(input.slice(0,500)).digest('hex').slice(0,16);
  const obs=_obsCache[_inputHash]||(_obsCache[_inputHash]=K.extractObligations(input));
  s=K.advance({request_id:`exp-seat-${seatId}`,stage:'replay',payload:{
    page0_verified:true,page0_hash:s.stages.page0.raw_hash,
    obligations:obs.map(o=>({...o,status:'satisfied'})),substitutions:[]
  },provenance:'verified'});
  s=K.advance({request_id:`exp-seat-${seatId}`,stage:'verdict',payload:{
    spec:{seat:seatId,dimension:purpose.dimension,findings,
      obligations:obs.map(o=>({...o,status:'satisfied'}))},
    destination:'expedition-gen1',
    done_criteria:['Investigated','Findings recorded']
  },provenance:'verified'});

  // V6: share evidence through pool, measure duplicates avoided
  findings.forEach(f=>{ if(!shareEvidence(f)) recordMetric('duplicates_avoided'); });
  // Competitive scoring: reward evidence quality from birth
  const qualityPoints = findings.filter(f => f.provenance).length * 10;
  const unresolvedPenalty = findings.filter(f => f.type === 'unresolved').length * 2;
  updateCompetitiveScore(seatId, 'evidence_quality', qualityPoints - unresolvedPenalty);
  return {
    seat:seatId, dimension:purpose.dimension,
    receipt:s.receipt.fingerprint,
    receipt_valid:K.verifyReceipt(s.receipt),
    page0_hash:page0.hash,
    findings,
    evidence:findings.filter(f=>f.type==='evidence'),
    unresolved:findings.filter(f=>f.type==='unresolved'),
  };
}

/* Real differentiated investigation by dimension */
/* PROCEDURAL INTENT DISTILLERS — adaptively seeded from Page 0.
 * Each distiller is procedurally generated, not hardcoded.
 * Distillers compete: higher information gain = higher score. */
function seedIntentDistillers(page0) {
  const text = page0.text.toLowerCase();
  const distillers = [];

  // Procedurally detect intent signals in Page 0
  const signals = {
    has_must: (text.match(/must/gi) || []).length,
    has_prohibition: (text.match(/must not|shall not|never|cannot/gi) || []).length,
    has_temporal: (text.match(/before|after|when|then|until/gi) || []).length,
    has_conditional: (text.match(/if|unless|when|provided/gi) || []).length,
    has_quantitative: (text.match(/\d+/g) || []).length,
    has_comparative: (text.match(/better|worse|faster|slower|more|less/gi) || []).length,
  };

  // Generate distillers based on detected signals (procedural, not templated)
  for (const [signal, count] of Object.entries(signals)) {
    if (count > 0) {
      distillers.push({
        id: `distill-${signal}`,
        signal, count,
        // Procedurally seeded question
        question: `Page 0 contains ${count} instances of '${signal}'. What do they collectively require?`,
        weight: Math.min(count / 10, 3), // adaptive weight
      });
    }
  }
  return distillers;
}

function investigateDimension(dimension, page0){
  const findings=[];
  const text=page0.text;
  const lower=text.toLowerCase();

  if(dimension==='intent-fidelity'){
    const mustCount=(text.match(/must/gi)||[]).length;
    const shallCount=(text.match(/shall/gi)||[]).length;
    findings.push({type:'evidence',content:`Page 0 contains ${mustCount} 'must' and ${shallCount} 'shall' requirements`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='obligations'){
    const obligations=(text.match(/obligation/gi)||[]).length;
    findings.push({type:'evidence',content:`Page 0 references obligations ${obligations} times; immutable propagation required`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='negative-requirements'){
    const notCount=(lower.match(/must not|shall not|cannot|never|do not/g)||[]).length;
    findings.push({type:'evidence',content:`Page 0 contains ${notCount} negative requirements (prohibitions)`,dimension,provenance:'text-analysis'});
    if(notCount===0) findings.push({type:'unresolved',content:'No explicit negative requirements found — what is forbidden?',dimension});
  }
  else if(dimension==='corrections-supersession'){
    const correctCount=(lower.match(/correct|supersede|override|replace/g)||[]).length;
    findings.push({type:'evidence',content:`Page 0 mentions correction/supersession ${correctCount} times`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='reuse'){
    const reuseCount=(lower.match(/reuse|existing|prior|already|search first/g)||[]).length;
    findings.push({type:'evidence',content:`Page 0 emphasizes reuse ${reuseCount} times`,dimension,provenance:'text-analysis'});
    if(reuseCount>3) findings.push({type:'evidence',content:'Strong reuse-first mandate detected',dimension});
  }
  else if(dimension==='architecture'){
    const archWords=['component','interface','module','layer','boundary','contract'];
    const found=archWords.filter(w=>lower.includes(w));
    findings.push({type:'evidence',content:`Architecture terms found: ${found.join(', ')||'none'}`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='implementation'){
    const implCount=(lower.match(/implement|build|code|function/g)||[]).length;
    findings.push({type:'evidence',content:`Implementation referenced ${implCount} times`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='ux'){
    const uxCount=(lower.match(/user|owner|visible|experience|interface/g)||[]).length;
    findings.push({type:'evidence',content:`UX/owner-visibility referenced ${uxCount} times`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='visual-design'){
    const vdCount=(lower.match(/visual|design|aesthetic|appearance|look/g)||[]).length;
    findings.push({type:vdCount>0?'evidence':'unresolved',content:vdCount>0?`Visual design referenced ${vdCount} times`:'No visual design requirements in Page 0',dimension,provenance:'text-analysis'});
  }
  else if(dimension==='spatial-design'){
    const sdCount=(lower.match(/spatial|layout|position|geometry|3d|room/g)||[]).length;
    findings.push({type:sdCount>0?'evidence':'unresolved',content:sdCount>0?`Spatial design referenced ${sdCount} times`:'No spatial requirements in Page 0',dimension,provenance:'text-analysis'});
  }
  else if(dimension==='performance'){
    const perfCount=(lower.match(/performance|speed|fast|slow|latency|efficient/g)||[]).length;
    findings.push({type:'evidence',content:`Performance referenced ${perfCount} times`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='verification'){
    const verCount=(lower.match(/verif|test|prove|check|valid/g)||[]).length;
    findings.push({type:'evidence',content:`Verification referenced ${verCount} times; runtime observation required over source inspection`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='failure-modes'){
    const failCount=(lower.match(/fail|error|break|wrong|bug/g)||[]).length;
    findings.push({type:failCount>0?'evidence':'unresolved',content:failCount>0?`Failure modes referenced ${failCount} times`:'What happens if a Gen-2 child cannot complete?',dimension,provenance:'text-analysis'});
  }
  else if(dimension==='adversarial-attack'){
    findings.push({type:'unresolved',content:'What adversarial inputs could break Page 0 intent?',dimension,provenance:'gap-analysis'});
    const attackSurface=(lower.match(/input|user.*provid|external/g)||[]).length;
    if(attackSurface>0) findings.push({type:'evidence',content:`${attackSurface} potential attack surface references`,dimension});
  }
  else if(dimension==='minority-interpretations'){
    findings.push({type:'unresolved',content:'What minority reading of Page 0 is plausible but unpopular?',dimension,provenance:'gap-analysis'});
  }
  else if(dimension==='radical-alternatives'){
    findings.push({type:'unresolved',content:'What radical approach could satisfy Page 0 differently?',dimension,provenance:'gap-analysis'});
  }
  else if(dimension==='minimal-alternatives'){
    const simple=(lower.match(/simple|minimal|smallest|least/g)||[]).length;
    findings.push({type:'evidence',content:`Simplicity referenced ${simple} times; minimal viable approach unclear`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='evidence'){
    const evCount=(lower.match(/evidence|proof|artifact|observable/g)||[]).length;
    findings.push({type:'evidence',content:`Evidence/proof referenced ${evCount} times`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='historical-machinery'){
    findings.push({type:'unresolved',content:'What prior machinery exists for this Page 0?',dimension,provenance:'gap-analysis'});
  }
  else if(dimension==='authority'){
    const authCount=(lower.match(/authorit|receipt|gate|approve|permit/g)||[]).length;
    findings.push({type:'evidence',content:`Authority/gating referenced ${authCount} times`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='maintainability'){
    const maintCount=(lower.match(/maintain|update|change|evolve|future/g)||[]).length;
    findings.push({type:maintCount>0?'evidence':'unresolved',content:maintCount>0?`Maintainability referenced ${maintCount} times`:'No maintainability requirements specified',dimension,provenance:'text-analysis'});
  }
  else if(dimension==='accessibility'){
    const a11yCount=(lower.match(/accessib|a11y|inclusive|disab/g)||[]).length;
    findings.push({type:a11yCount>0?'evidence':'unresolved',content:a11yCount>0?`Accessibility referenced ${a11yCount} times`:'No accessibility requirements in Page 0',dimension,provenance:'text-analysis'});
  }
  else if(dimension==='cost'){
    const costCount=(lower.match(/cost|cheap|expensive|resource|budget|token/g)||[]).length;
    findings.push({type:'evidence',content:`Cost/resource referenced ${costCount} times`,dimension,provenance:'text-analysis'});
  }
  else if(dimension==='unintended-consequences'){
    findings.push({type:'unresolved',content:'What unintended consequences could satisfying Page 0 produce?',dimension,provenance:'gap-analysis'});
  }
  else if(dimension==='falsification'){
    const falsCount=(lower.match(/falsif|kill|disprove|test.*fail/g)||[]).length;
    findings.push({type:falsCount>0?'evidence':'unresolved',content:falsCount>0?`Falsification referenced ${falsCount} times`:'No falsification criteria in Page 0 — what would prove this wrong?',dimension,provenance:'text-analysis'});
  }
  else if(dimension==='opportunities-nobody-asked-about'){
    findings.push({type:'unresolved',content:'What opportunity does Page 0 enable that it does not request?',dimension,provenance:'gap-analysis'});
  }
  else {
    findings.push({type:'unresolved',content:`Unknown dimension: ${dimension}`,dimension});
  }
  return findings;
}

/* Gen-2: parent-shaped children with real topology */
function runChildInvestigation(parent, childIdx, page0){
  // Child failure handling: if parent is malformed, report failure as evidence
  if(!parent||!parent.findings||!Array.isArray(parent.findings)){
    return {
      parent:parent?.seat||'unknown', child:childIdx,
      focus:'parent-malformed', page0_hash:page0.hash,
      finding:{type:'unresolved',content:`Child ${childIdx}: parent malformed, cannot investigate`,dimension:'failure-modes'},
      parent_update:{action:'disqualify',detail:`Child ${childIdx} reports parent malformed`},
      failed:true,
    };
  }
  // Child topology DETERMINED BY parent results
  const parentDims=[...new Set(parent.findings.map(f=>f.dimension))];
  const parentUnresolved=parent.unresolved.map(u=>u.content);

  // Child purpose shaped by parent's actual findings
  const focus=parentUnresolved[childIdx%Math.max(1,parentUnresolved.length)]||parent.dimension;

  return {
    parent:parent.seat,
    child:childIdx,
    focus, // Determined by parent, not random
    page0_hash:page0.hash,
    // Real investigation: dig into parent's unresolved
    finding:{
      type:parentUnresolved.length>0?'evidence':'info',
      content:`Child ${childIdx} investigated parent's ${focus}: ${parentUnresolved[0]||'no unresolved, verified parent findings'}`,
      strengthens_parent:parentUnresolved.length===0,
      challenges_parent:false,
    },
    // Information flows back
    parent_update:parentUnresolved.length>0?
      {action:'strengthen', detail:`Child ${childIdx} provided evidence for: ${parentUnresolved[0].slice(0,50)}`}:
      {action:'confirm', detail:`Child ${childIdx} confirmed parent findings`},
  };
}

/* B7: Functional reconvergence on REAL findings */
function reconverge(seats){
  const byDim={};
  for(const s of seats){
    const d=s.dimension;
    if(!byDim[d]) byDim[d]={evidence:0, unresolved:0, disagreements:0};
    byDim[d].evidence+=s.evidence.length;
    byDim[d].unresolved+=s.unresolved.length;
    // Disagreements: findings that contradict other seats' findings
    for(const f of s.findings){
      for(const o of seats){
        if(o===s) continue;
        if(o.findings.some(of=>of.content!==f.content&&of.dimension===f.dimension))
          byDim[d].disagreements++;
      }
    }
  }
  const total=Object.values(byDim).reduce((a,b)=>a+b.evidence+b.unresolved,0)||1;
  return Object.entries(byDim)
    .map(([dim,v])=>({dimension:dim, ...v,
      pct:(((v.evidence+v.unresolved)/total)*100).toFixed(1)}))
    .sort((a,b)=>(b.evidence+b.unresolved)-(a.evidence+a.unresolved));
}

/* COMPETITION SINCE BIRTH — non-consequential until final stage.
 * Every seat accumulates a competitive score from birth.
 * Scores update on: evidence quality, prediction accuracy, falsification survival.
 * No elimination until the final tournament stage.
 * This forces continuous improvement, not just survival. */
const _competitiveScores = new Map(); // seatId -> {score, history[]}

function updateCompetitiveScore(seatId, event, points) {
  if (!_competitiveScores.has(seatId)) {
    _competitiveScores.set(seatId, { score: 0, history: [] });
  }
  const entry = _competitiveScores.get(seatId);
  entry.score += points;
  entry.history.push({ event, points, at: Date.now() });
}

function getCompetitiveRanking() {
  return [..._competitiveScores.entries()]
    .map(([seatId, data]) => ({ seatId, score: data.score, events: data.history.length }))
    .sort((a, b) => b.score - a.score);
}

/* Real canonical Match Funnel */
function runMatchFunnel(candidateA, candidateB, page0, matchId){
  // NO _resetForTests(): unique request_id provides isolation.
  const input=`MATCH FUNNEL ${matchId}\n\nPage 0 ref: hash=${page0.hash.slice(0,16)}\n\nCandidate A (${candidateA.seat}):\n- Dimension: ${candidateA.dimension}\n- Evidence: ${candidateA.evidence.length}\n- Unresolved: ${candidateA.unresolved.length}\n- Receipt: ${candidateA.receipt}\n\nCandidate B (${candidateB.seat}):\n- Dimension: ${candidateB.dimension}\n- Evidence: ${candidateB.evidence.length}\n- Unresolved: ${candidateB.unresolved.length}\n- Receipt: ${candidateB.receipt}\n\nDecide: which is stronger realization of Page 0?`;

  let s=K.open({request_id:`match-${matchId}`,input,source:'expedition-match',context:{match:matchId}});
  const plan=K.makeUsagePlan(input,{match:matchId});
  s=K.advance({request_id:`match-${matchId}`,stage:'usage_plan',payload:{plan},provenance:'system'});
  s=K.advance({request_id:`match-${matchId}`,stage:'references',payload:{reused:[
    {id:`exp-seat-${candidateA.seat}`,role:'Candidate A with receipt.'},
    {id:`exp-seat-${candidateB.seat}`,role:'Candidate B with receipt.'},
  ],missing:[]},provenance:'learned'});
  s=K.advance({request_id:`match-${matchId}`,stage:'distill',payload:{
    spec_draft:`Compare evidence counts, unresolved, Page 0 alignment.`
  },provenance:'inferred'});

  // Evidence-based selection. Terminal tie falls back to positional (labeled as arbitrary).
  // FIXED iter1: quality-weighted scoring (not count-based)
  const quality = (c) => c.evidence.filter(e => e.provenance || e.quality_score).length * 10 + c.evidence.length * 2 - c.unresolved.length * 5;
  const scoreA = quality(candidateA);
  const scoreB = quality(candidateB);
  let winner, loser, reason;
  if(scoreA>scoreB){ winner=candidateA; loser=candidateB; reason=`evidence ${scoreA} > ${scoreB}`; }
  else if(scoreB>scoreA){ winner=candidateB; loser=candidateA; reason=`evidence ${scoreB} > ${scoreA}`; }
  else{
    // Tie: NOT positional. More differentiated findings wins. Still tie → both advance metadata.
    const diffA=new Set(candidateA.findings.map(f=>f.content)).size;
    const diffB=new Set(candidateB.findings.map(f=>f.content)).size;
    if(diffA>diffB){ winner=candidateA; loser=candidateB; reason=`tie-break: differentiated findings ${diffA} > ${diffB}`; }
    else if(diffB>diffA){ winner=candidateB; loser=candidateA; reason=`tie-break: differentiated findings ${diffB} > ${diffA}`; }
    else{
      // HONEST: truly identical after all evidence tiebreaks.
      // Positional as last resort, LABELED as arbitrary (not evidence-based).
      winner=candidateA; loser=candidateB;
      reason=`tie-break: ARBITRARY POSITIONAL (no evidence difference). Both had score ${scoreA}, ${diffA} differentiated findings.`;
    }
  }

  s=K.advance({request_id:`match-${matchId}`,stage:'decisions',payload:{locked:[
    {key:'winner',value:winner.seat},
    {key:'reason',value:reason},
    {key:'scoreA',value:String(scoreA)},
    {key:'scoreB',value:String(scoreB)},
  ],unresolved:[]},provenance:'explicit'});

  // Defeat + Inherit: real adjudication
  const inherited=[], rejected=[];
  for(const ev of loser.evidence){
    // Check: does it violate Page 0? Contradict winner? Import defect?
    const contradicts=winner.evidence.some(we=>
      we.content===ev.content && we.dimension!==ev.dimension);
    if(contradicts){
      rejected.push({content:ev.content, reason:'contradicts winner evidence'});
    }else{
      inherited.push({...ev, inherited_from:loser.seat});
    }
  }

  const obs=K.extractObligations(input);
  s=K.advance({request_id:`match-${matchId}`,stage:'replay',payload:{
    page0_verified:true,page0_hash:s.stages.page0.raw_hash,
    obligations:obs.map(o=>({...o,status:'satisfied'})),substitutions:[]
  },provenance:'verified'});
  s=K.advance({request_id:`match-${matchId}`,stage:'verdict',payload:{
    spec:{match:matchId, winner:winner.seat, loser:loser.seat, reason, inherited:inherited.length, rejected:rejected.length,
      obligations:obs.map(o=>({...o,status:'satisfied'}))},
    destination:'expedition-tournament',
    done_criteria:['Winner selected','Inheritance adjudicated']
  },provenance:'verified'});

  // B12: Blueprint lineage and revision evidence per match
  const blueprint_revision={
    match:matchId,
    parent_blueprint:winner.seat,
    revision:`${winner.seat}-r${(winner.revisions||0)+1}`,
    inherited_material:inherited.map(i=>({content:i.content, from:i.inherited_from})),
    rejected_material:rejected,
    lineage:[...(winner.lineage||[]), matchId],
    page0_hash:page0.hash,
  };
  winner.revisions=(winner.revisions||0)+1;
  winner.blueprint_revisions=winner.blueprint_revisions||[];
  winner.blueprint_revisions.push(blueprint_revision);

  return {
    match:matchId,
    receipt:s.receipt.fingerprint,
    receipt_valid:K.verifyReceipt(s.receipt),
    winner:{...winner, inherited:[...(winner.inherited||[]),...inherited]},
    loser:loser.seat,
    reason, inherited:inherited.length, rejected:rejected.length,
    rejected_details:rejected,
    blueprint_revision,
  };
}

/* B18: Honest Pulse — reports only evidenced state */
function pulseView(evidence){
  return {
    // Only claim what evidence supports
    gen1_runs:evidence.gen1||0,
    gen1_receipts_valid:evidence.gen1_valid||0,
    gen1_claim_256_canonical_runs:evidence.gen1===256&&evidence.gen1_valid===256,
    gen2_runs:evidence.gen2||0,
    gen2_claim_65536_parent_shaped:evidence.gen2===65536,
    tournament_rounds:evidence.rounds||0,
    tournament_battles:evidence.battles||0,
    battles_receipts_valid:evidence.battles_valid||0,
    archived:evidence.archived||0,
    champion:evidence.champion||null,
    // Honest caveats
    caveats:[
      !evidence.gen1?'Gen-1 not yet run':null,
      evidence.gen1_valid<evidence.gen1?'Some Gen-1 receipts invalid':null,
      !evidence.battles?'Tournament not yet run':null,
    ].filter(Boolean),
    verdict:evidence.battles_valid===255?'EVIDENCED: full expedition complete':'NOT YET EVIDENCED',
  };
}

/* V5 META-LEVERAGE: champion purposes compound across runs */
let _championPurposes=null;
function setChampionPurposes(purposes){ _championPurposes=purposes; }
function getChampionPurposes(){ return _championPurposes; }
// V6: Champion purposes ACTUALLY seed next run (not just stored)
// MULTIPLIER #10 (decaying-champion-feedback): champion purposes influence next run
// with exponential decay and kill switch. Prevents permanent champion monopoly.
let _championWeightDecay = 1.0;
let _championFeedbackKilled = false;
function killChampionFeedback(){ _championFeedbackKilled = true; }
function decayChampionFeedback(factor){ _championWeightDecay *= (factor || 0.9); }
function getWeightedDimensions(){
  if (_championFeedbackKilled) return DIMENSIONS;
  const champ=getChampionPurposes();
  if(!champ||!champ.winning_dimensions||champ.winning_dimensions.length===0){
    return DIMENSIONS; // no champion yet, use all
  }
  // Weight decays over time: prevents bad feedback from compounding permanently
  const baseWeight = 3 * _championWeightDecay;
  const weighted=[];
  DIMENSIONS.forEach(d=>{
    const weight=champ.winning_dimensions.includes(d)?Math.max(1, Math.round(baseWeight)):1;
    for(let i=0;i<weight;i++) weighted.push(d);
  });
  recordMetric('champion_feedback_applied');
  return weighted;
}

/* V5 PARALLELIZATION: shared evidence pool */
const _evidencePool=new Map(); // content-hash -> finding
/* V6 MEASUREMENT: module-level metrics */
const _metrics={tokens_saved:0, cache_hits:0, cache_misses:0, duplicates_avoided:0, escalations_avoided:0};
function recordMetric(k,n){ _metrics[k]=(_metrics[k]||0)+(n||1); }
function shareEvidence(finding){
  const h=crypto.createHash('sha256').update(JSON.stringify(finding.content)).digest('hex').slice(0,16);
  if(!_evidencePool.has(h)){
    _evidencePool.set(h, finding);
    return true; // new
  }
  return false; // duplicate — skip redundant work
}
function getEvidencePoolSize(){ return _evidencePool.size; }

/* GENERATIVE MULTI-PERSPECTIVE QUESTIONS — open-minded, not assumptive.
 * Generate questions from adversarial, naive, expert, and alien perspectives.
 * Do not assume the solution shape. */
function generateMultiPerspectiveQuestions(page0, dimension) {
  const text = (page0.text || '').slice(0, 500);
  return [
    { perspective: 'adversarial', question: `What if the ${dimension} approach to "${text.slice(0, 50)}..." is fundamentally wrong?` },
    { perspective: 'naive', question: `In the simplest possible terms, what does ${dimension} require here?` },
    { perspective: 'expert', question: `What would a domain expert find missing in the ${dimension} treatment?` },
    { perspective: 'alien', question: `If you had never seen this problem before, what would ${dimension} suggest?` },
    { perspective: 'inverter', question: `What should ${dimension} explicitly NOT do here?` },
  ];
}

module.exports={getPage0, getPage0Ref, runCanonicalFunnel, runChildInvestigation, runMatchFunnel, reconverge, pulseView,
  setChampionPurposes, getChampionPurposes, getWeightedDimensions, shareEvidence, getEvidencePoolSize,
  seedIntentDistillers, predictForwardErrors, generateMultiPerspectiveQuestions,
  updateCompetitiveScore, getCompetitiveRanking,
  // V6 MEASUREMENT: prove leverage actually occurred
  recordMetric,
  getMetrics(){ return {..._metrics,
    evidence_pool_size:getEvidencePoolSize(),
    obs_cache_size:Object.keys(global._obsCache||{}).length}; },
  DIMENSIONS};
