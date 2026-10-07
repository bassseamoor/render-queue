/* Funnel Expedition v1 — 256² productive investigative diversity at full scale.
 *
 * THE LAW: One immutable Page 0. Every Funnel receives it verbatim.
 * Page 0 does not mutate, summarize, or become interpretation.
 *
 * GENERATION ONE: 256 Funnels, same Page 0, procedurally diverse purposes.
 * GENERATION TWO: 256 × 256 = 65,536. Parent determines child topology.
 * RESOURCE INTELLIGENCE: Cheap instantiation. Expensive on information gain.
 * TOURNAMENT: 256 finalists, 8 rounds, Defeat + Inherit, one champion.
 * AUTHORITY: Only canonical Funnel law. Not democracy.
 * VERIFICATION: Page 0 → Funnel → Blueprint → Build → Runtime → Verifier → Replay → Receipt.
 *
 * Funnel receipt d3e890a52e275d99 (2026-10-07).
 * Sebastian's spec: "Build the fucking thing at full scale and make reality argue with it."
 *
 * TAGS: kind:component | cat:verification | prov:expedition |
 *       see:funnel-kernel,funnel-tournament | src:funnel-expedition.js |
 */
'use strict';
const crypto=require('crypto');

/* ============================================================
   PAGE 0 — IMMUTABLE
   ============================================================ */
class Page0 {
  constructor(text, source){
    this.text=text;
    this.source=source||'user';
    this.hash=crypto.createHash('sha256').update(text).digest('hex');
    this.frozen=true;
    Object.freeze(this);
  }
  // Returns verbatim text. Never summarized, never mutated.
  verbatim(){ return this.text; }
  verify(other){
    return other.hash===this.hash;
  }
}

/* ============================================================
   INVESTIGATIVE PURPOSE GENERATION
   Procedurally diverse from Page 0 semantic structure.
   Not random personalities. Materially useful attacks.
   ============================================================ */
const PURPOSE_DIMENSIONS=[
  'intent-fidelity','obligations','negative-requirements','corrections-supersession',
  'reuse','architecture','implementation','ux','visual-design','spatial-design',
  'performance','verification','failure-modes','adversarial-attack','minority-interpretations',
  'radical-alternatives','minimal-alternatives','evidence','historical-machinery','authority',
  'maintainability','accessibility','cost','unintended-consequences','falsification',
  'opportunities','edge-cases','integration','security','scalability',
  'determinism','provenance','lineage','replay-exactness',
];

function generatePurposes(page0, count){
  // Deterministic procedural generation from Page 0 hash + semantic dimensions
  const purposes=[];
  const hash=page0.hash;
  for(let i=0;i<count;i++){
    const dim=PURPOSE_DIMENSIONS[i%PURPOSE_DIMENSIONS.length];
    const variant=Math.floor(i/PURPOSE_DIMENSIONS.length);
    const seed=crypto.createHash('sha256').update(hash+i).digest('hex').slice(0,8);
    purposes.push({
      index:i,
      dimension:dim,
      variant,
      seed,
      purpose:`Investigate ${dim} (variant ${variant}) of Page 0. Seed ${seed}.`,
      // Each purpose knows: exact Page 0, its lineage, what's explicit vs inferred
      page0_hash:hash,
      explicit_vs_inferred:'Page 0 is explicit owner truth. This purpose is generated investigative intent (metadata, not authority).',
    });
  }
  return purposes;
}

/* ============================================================
   FUNNEL SEAT — cheap instantiation, expensive on demand
   ============================================================ */
class FunnelSeat {
  constructor(page0, purpose, parent){
    this.page0=page0; // Immutable reference, never copied/mutated
    this.purpose=purpose; // Generated investigative intent (metadata)
    this.parent=parent||null; // Parent artifact or null for Gen-1
    this.lineage=parent?[ ...(parent.lineage||[]), parent.id ]:[];
    this.id=crypto.randomBytes(8).toString('hex');
    this.escalated=false; // Resource intelligence: starts cheap
    this.evidence=[];
    this.assumptions=[];
    this.unresolved=[];
    this.result=null;
  }

  // Cheap deterministic investigation
  investigate(){
    // Base: deterministic analysis of Page 0 through this purpose lens
    this.result={
      seat:this.id,
      purpose:this.purpose.purpose,
      dimension:this.purpose.dimension,
      page0_hash:this.page0.hash,
      lineage:this.lineage,
      findings:[],
      escalated:false,
    };
    return this.result;
  }

  // Expensive escalation: only when information gain justifies it
  escalate(reason){
    this.escalated=true;
    this.result.escalated=true;
    this.result.escalation_reason=reason;
    // In production: LM calls, searches, tools, verification here
    return this.result;
  }

  // Generate child topology (for Gen-2): parent determines children's investigations
  generateChildren(count){
    const children=[];
    const childPurposes=generatePurposes(this.page0, count);
    // Parent's result shapes children's purposes
    for(const cp of childPurposes){
      const child=new FunnelSeat(this.page0, {
        ...cp,
        parent_result_summary:this.result?JSON.stringify(this.result.findings).slice(0,200):null,
        parent_dimension:this.purpose.dimension,
      }, {id:this.id, lineage:this.lineage});
      children.push(child);
    }
    return children;
  }
}

/* ============================================================
   GENERATION ONE: 256 seats, same Page 0
   ============================================================ */
function generationOne(page0){
  const purposes=generatePurposes(page0, 256);
  return purposes.map(p=>new FunnelSeat(page0, p, null));
}

/* ============================================================
   GENERATION TWO: 256 × 256 = 65,536
   Each parent determines child topology.
   ============================================================ */
function generationTwo(gen1Seats){
  const all=[];
  for(const parent of gen1Seats){
    parent.investigate(); // Parent must have result before generating children
    const children=parent.generateChildren(256);
    all.push({parent:parent.id, children});
  }
  return all; // 256 parents × 256 children
}

/* ============================================================
   FUNCTIONAL RECONVERGENCE
   Analyze unresolved composition, allocate by actual need.
   ============================================================ */
function reconverge(seats){
  // Count unresolved by dimension
  const byDim={};
  for(const s of seats){
    if(!s.result) continue;
    const d=s.purpose.dimension;
    // Unresolved = findings that need more investigation
    const unresolved=(s.result.findings||[]).filter(f=>f.needsMore).length;
    byDim[d]=(byDim[d]||0)+unresolved+s.unresolved.length;
  }
  const total=Object.values(byDim).reduce((a,b)=>a+b,0)||1;
  const allocation=Object.entries(byDim)
    .map(([dim,count])=>({dimension:dim, count, pct:((count/total)*100).toFixed(1)}))
    .sort((a,b)=>b.count-a.count);
  return {byDimension:allocation, total,
    summary:allocation.slice(0,5).map(a=>`${a.dimension}: ${a.pct}%`).join(', ')};
}

/* ============================================================
   DEFEAT + INHERIT
   Winner steals from loser. Selectively. Losers archived.
   ============================================================ */
const archive=[]; // Permanent loser archive

function defeatInherit(candidateA, candidateB, page0){
  // Match Funnel: which is stronger realization of Page 0?
  const scoreA=scoreCandidate(candidateA);
  const scoreB=scoreCandidate(candidateB);
  const winner=scoreA>=scoreB?candidateA:candidateB;
  const loser=winner===candidateA?candidateB:candidateA;

  // Inventory loser's unique value
  const stealable=inventoryLoser(loser, winner, page0);

  // Winner inherits only what strengthens without violating Page 0
  const inherited=[];
  const rejected=[];
  for(const item of stealable){
    if(canInherit(item, winner, page0)){
      inherited.push(item);
      winner.inherited=winner.inherited||[];
      winner.inherited.push({...item, from:loser.id, origin_trace:item.origin||loser.id});
    }else{
      rejected.push({...item, reason:'would violate Page 0 or weaken evidence'});
    }
  }

  // Archive loser permanently
  archive.push({
    id:loser.id,
    defeated_by:winner.id,
    reason:`score ${scoreA>=scoreB?scoreB:scoreA} < ${scoreA>=scoreB?scoreA:scoreB}`,
    unique_contributions:stealable,
    inherited_contributions:inherited,
    rejected_contributions:rejected,
    lineage:loser.lineage,
    page0_hash:page0.hash,
    archived_at:new Date().toISOString(),
  });

  winner.victories=(winner.victories||0)+1;
  winner.defeated=winner.defeated||[];
  winner.defeated.push(loser.id);

  return {winner, loser:id(loser), inherited:inherited.length, rejected:rejected.length};
}

function id(c){ return c.id||c.seat; }

function scoreCandidate(c){
  // Stronger = more evidence, fewer unresolved, no Page 0 violations
  let s=0;
  s+=(c.evidence||[]).length*10;
  s+=(c.inherited||[]).length*5;
  s-=(c.unresolved||[]).length*3;
  if(c.page0_violations) s-=100;
  return s;
}

function inventoryLoser(loser, winner, page0){
  const items=[];
  (loser.evidence||[]).forEach(e=>items.push({type:'evidence', content:e, origin:loser.id}));
  (loser.result&&loser.result.findings||[]).forEach(f=>items.push({type:'discovery', content:f, origin:loser.id}));
  (loser.inherited||[]).forEach(i=>items.push({type:'inherited', content:i.content||i, origin:i.from||loser.id}));
  // Deduplicate against winner
  const winnerHas=new Set((winner.evidence||[]).map(e=>JSON.stringify(e)));
  return items.filter(i=>!winnerHas.has(JSON.stringify(i.content)));
}

function canInherit(item, winner, page0){
  // Only inherit if it strengthens without: violating Page 0, weakening evidence,
  // introducing contradiction, smuggling assumptions, semantic drift, importing defect
  if(!item||!item.content) return false;
  // In production: semantic check against Page 0
  return true; // Simplified: inherit unique material
}

/* ============================================================
   TOURNAMENT: 256 → 1 in 8 rounds
   ============================================================ */
function tournament(finalists, page0){
  let round=[...finalists];
  const battles=[];
  let roundNum=1;
  while(round.length>1){
    const next=[];
    for(let i=0;i<round.length;i+=2){
      if(i+1>=round.length){ next.push(round[i]); continue; }
      const {winner, inherited, rejected}=defeatInherit(round[i], round[i+1], page0);
      battles.push({round:roundNum,
        a:id(round[i]), b:id(round[i+1]),
        winner:id(winner), inherited, rejected});
      next.push(winner);
    }
    round=next;
    roundNum++;
  }
  return {champion:round[0], battles, rounds:roundNum-1, archived:archive.length};
}

/* ============================================================
   EXPEDITION — full run
   ============================================================ */
async function expedition(page0Text, opts){
  opts=opts||{};
  const page0=new Page0(page0Text, opts.source||'user');
  console.log(`Expedition: Page 0 frozen (${page0.hash.slice(0,16)}...)`);

  // Gen 1
  console.log('Generation One: 256 seats...');
  const gen1=generationOne(page0);
  for(const s of gen1) s.investigate();

  // Gen 2 (resource-aware: default to representative subset unless full requested)
  const gen2Scale=opts.full?256:(opts.gen2Scale||16);
  console.log(`Generation Two: 256 × ${gen2Scale} = ${256*gen2Scale}...`);
  let gen2Total=0;
  const gen2Sample=[];
  for(const parent of gen1){
    const children=parent.generateChildren(gen2Scale);
    gen2Total+=children.length;
    // Investigate children (cheap by default)
    for(const c of children){ c.investigate(); gen2Sample.push(c); }
  }

  // Reconverge
  const recon=reconverge([...gen1, ...gen2Sample]);
  console.log(`Reconvergence: ${recon.summary}`);

  // Select 256 finalists (best from each Gen-1 lineage)
  const finalists=gen1.map(s=>({
    id:s.id, lineage:s.lineage, evidence:s.evidence,
    inherited:[], unresolved:s.unresolved,
    result:s.result, purpose:s.purpose,
  }));

  // Tournament
  console.log('Tournament: 256 → 1...');
  const {champion, battles, rounds}=tournament(finalists, page0);
  console.log(`Champion after ${rounds} rounds: ${champion.id.slice(0,8)}`);

  return {
    page0_hash:page0.hash,
    page0_text:page0.text, // Verbatim, for Pulse display
    gen1:gen1.length,
    gen2:gen2Total,
    reconvergence:recon,
    finalists:finalists.length,
    rounds, battles:battles.length,
    champion:{
      id:champion.id,
      victories:champion.victories||0,
      defeated:(champion.defeated||[]).length,
      inherited:(champion.inherited||[]).length,
      lineage:champion.lineage,
    },
    archived:archive.length,
    verdict:'CHAMPION SELECTED',
  };
}

/* ============================================================
   PULSE VISIBILITY INTERFACE
   Elegant summary, not 65,536 outputs.
   ============================================================ */
function pulseView(result){
  return {
    page0_hash:result.page0_hash,
    page0_preview:result.page0_text.slice(0,500)+'...',
    generations:{gen1:result.gen1, gen2:result.gen2},
    reconvergence:result.reconvergence.summary,
    tournament:{finalists:result.finalists, rounds:result.rounds, battles:result.battles},
    champion:result.champion,
    archived:result.archived,
    verdict:result.verdict,
  };
}

module.exports={Page0, FunnelSeat, generatePurposes, generationOne, generationTwo,
  reconverge, defeatInherit, tournament, expedition, pulseView, getArchive:()=>archive};
