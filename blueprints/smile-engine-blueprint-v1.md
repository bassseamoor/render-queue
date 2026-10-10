# BLUEPRINT: THE SMILE ENGINE

**Version:** 1.0 (design only — NOT YET SEALED as canonical; this document is the deliverable for funnel verification)
**Route:** Moor Blueprint/Funnel route. **NO PRODUCTION MACHINERY BUILT IN THIS RUN.**
**Page 0:** `~/workspace/funnel-docs/smile-engine-page0.md` (verbatim owner request, hash-bound in F1 intake receipt `c4777b74f670a277`)
**Name note:** "Smile Engine" is the founder's working name. Whether it survives as the internal name is decided in §40–§41. It is NOT approved as user-facing terminology (§26).
**Honesty header:** This blueprint proposes architecture. Nothing in it is built. Repository reality was inspected before designing (§4); disagreements with the originating prompt are documented, not smoothed. Where the corpus is silent, the blueprint says UNKNOWN.

---

# SELL

## The promise

Moor's Funnel is excellent at *verifying* answers and poor at *noticing* opportunities. It can tell you whether a candidate survives; it cannot tell you what questions you failed to ask. **The Smile Engine is a question-generating layer:** five named lenses (SAVE, MAKE, INVEST, LOVE, EXECUTE) that illuminate the same situation from different directions, producing candidate deductions that feed Moor's existing machinery (Sieve → Funnel → Forevergreen). It does not classify, does not dictate answers, and does not bypass authority. It makes the search wider where search is cheap and keeps authority narrow where authority is expensive.

## The stakes

If this exists: Moor notices reuse it would have rebuilt, investments that would compound, stakeholders it would have ignored, and executable moves it would have postponed — before the expensive machinery runs. If it doesn't: the Funnel keeps verifying answers to questions nobody thought to ask, and "we didn't think of that" remains the most expensive failure class.

## The click

Picture a Blueprint entering the Funnel today — one question family, one pass. Now picture the same Blueprint examined through five lenses first: SAVE finds the capability it would have rebuilt; INVEST finds the infrastructure it would unlock; LOVE finds the owner whose data it touches; EXECUTE finds the smallest move that is ready now. The Funnel still decides. But it decides over a richer candidate set, and every lens question that proves useless gets pruned by evidence.

---

## 1. Purpose

Give Moor an explicit, versioned, measurable **deduction layer** that:

(a) generates candidate questions about any situation through five named lenses (SAVE / MAKE / INVEST / LOVE / EXECUTE), where a lens is a question-generating function, never a category;
(b) implements a **hunger ratchet** — a dynamic acceptance discipline where a working answer becomes the floor and the floor only moves up, specified without fake numerical coefficients;
(c) biases the system toward **noticing opportunity** while keeping authority promotion on Moor's existing verified pathways (WIDE POSSIBILITY, PRECISE AUTHORITY);
(d) preserves **weirdness** (unfamiliar-but-legal candidates) long enough to demonstrate value, integrated with existing divergence preservation rather than duplicated;
(e) feeds **accumulation** — verified reusable capability that makes future searches start ahead — through capability memory, not a new store;
(f) observes itself through **Forevergreen Seeds** but never promotes changes to itself;
(g) keeps **founder philosophy as input, never scripture** — the anti-scripture provenance chain is load-bearing architecture, not a footnote.

## 2. Origin and provenance

- SAVE / MAKE / INVEST / LOVE / EXECUTE originated as Sebastian's personal framework during a very difficult period of his life. He first attempted precise definitions; he now holds their semantic breadth as a strength. **Provenance, not proof:** the origin explains the idea; it does not verify the architecture (§28 enforces this structurally).
- The acronym SMILE (Save, Make, Invest, Love, Execute) is his naming, recorded 2026-10-08: "cuz you're supposed to live your life with a smile." The name is symbolic (§"The Smile" in Page 0); it is not a metric.
- The **hunger ratchet** ("Working creates the floor. Hunger raises it. Accumulation buys selectivity.") is his 2026-10-08 formulation, endorsed after his "stroke of genius" reflection: first take anything that works, then get pickier as the baseline strengthens, then refuse to accept degradation. Recorded in the ideology notes; treated here as a hypothesis to operationalize, not a law of nature.
- "Know me without deciding that you know me" / "PEOPLE ARE STREAMS, NOT PROFILES" and the seeds-not-scripture doctrine (Taleb handling: "Take the useful idea. Let Moor metabolize it. Don't turn the thinker into scripture.") are the philosophical ancestors of §28–§29.
- Nothing in this section authorizes anything. It is the provenance layer of the anti-scripture chain.

## 3. Non-goals

- NOT a new runtime engine box. The surviving form is a methodology + two mechanism designs + one experiment, located in Moor Engine (§26). No "SmileEngine" service is proposed.
- NOT LLM-dependent. Question generation must be deterministic/templated/procedural first (§13); model calls are the most expensive tier and earned, never default.
- NOT a second Funnel, second Sieve, or second failure-learning subsystem. It feeds existing machinery.
- NOT user-facing terminology. No Moor OS surface shows "SAVE/MAKE/INVEST/LOVE/EXECUTE" without product-language translation (L2 boundary, §26).
- NOT a happiness score, positivity metric, morality score, or confidence value. The smile is symbolic; anthropomorphization is forbidden.
- NOT founder scripture. Nothing in this blueprint becomes true because he said it.
- NOT built in this run. Final Law binding.

---

## 4. Existing Moor mechanisms discovered

Read-only archaeology performed 2026-10-08 before designing. Status words are load-bearing: **BUILT** = code exists and runs; **BLUEPRINTED** = sealed or draft blueprint exists, zero or partial code; **AUTHORIZED** = a sealed verdict/receipt permits it; **DISCUSSED** = appears in notes/rambles only.

| Mechanism | Status | What genuinely exists |
|---|---|---|
| Funnel kernel (7 stages) | BUILT, AUTHORIZED (v44-sealed) | `moor-recovery/funnel-kernel.js`, MD5 `58f454c2…`; stages page0→usage_plan→references→distill→decisions→replay→verdict; `verifyReceipt`; Page 0 immutable; kernel owns the execution gate |
| Sieve | BLUEPRINTED (v1.0 draft, unsealed) | `funnel-docs/twosided-funnel/blueprint-sieve-v1.md`; cost-ordered narrowing rounds; **oracle abstraction entirely missing from corpus**; introduces "rounds" + Round Scheduler as design |
| Forevergreen Seeds | BLUEPRINTED (v1.0 draft, unsealed) | `funnel-docs/forevergreen-seeds/blueprint-forevergreen-seeds-v1.md`; 7 seed species; law "everything may plant, nothing may promote its own seed"; current evergreen loop exists but is flawed (stale classifications, prose-only repairs, failure-only learning) |
| Live Ramble → Live Blueprint | BLUEPRINTED (v1) | `funnel-docs/live-ramble/blueprint-live-ramble-v1.md`; source-span provenance; rendered blueprint never the source of truth; manufactured owner statements → PROVISIONAL nodes |
| Capability memory | BUILT (v2 schema) | `moor-recovery/moor-capability-memory.js`; `capability_id@version`; claimed/verified split; `recordUse` envelope (flaws: `Math.random()` IDs, destructive slice caps); linear scan + token overlap retrieval |
| Distill frontier (divergence) | BUILT, AUTHORIZED (Phase 1) | `moor-recovery/funnel-distill-frontier.js`; deterministic gates; `lineage_id` + fate records; preserves divergence (weird survivors); Phase 2 deliberately ON HOLD; frozen anti-Goodhart rule |
| Build queue + dispatch | BUILT, AUTHORIZED (2026-10-08) | `build-pipeline/buildqueue.py`; durable queue dirs; `authorize_execution` flag; 5 gates; 15m cron dispatch; repo status mirror |
| Build Console (MAKE face) | BUILT, live | `abandoned-cathedral.html` @ render-queue@main; seal/track/copy-packet; 11 control-plane states |
| Oracle/Verifier architecture | DISCUSSED-in-blueprint / MISSING in code | "Oracle" appears nowhere in the corpus as code; Sieve blueprint designs bounded oracles. **No oracle abstraction exists to integrate with.** |
| Round Scheduler | BLUEPRINTED (Sieve §15) / DISCUSSED | Sieve introduces rounds + Round Scheduler as design borrowing tick discipline; build-queue cron is a dispatch loop, not the Sieve Round Scheduler |
| Hunger/acceptance ratchet | DISCUSSED (ideology notes) | His formulation recorded; **zero mechanism implements it anywhere** |
| Deduction/question generation | DISCUSSED | No explicit question-generation machinery exists; funnel stages do implicit deduction |
| Exploration/exploitation | DISCUSSED | No explicit mechanism; distill preserves divergence (exploration artifact, not policy) |
| Creative-diversity rules | PARTIAL | Distill frontier's divergence preservation (built); no diversity policy |
| Weird-survivor mechanisms | BUILT (narrow) | Distill frontier Phase 1 only; nothing at generation time |
| Owner philosophy storage | BUILT (as notes) | `MEMORY.md`, `memory/*.md`, side-chat ideology notes; no structured principle store with versioning |
| Moor OS / Engine / Pulse | AUTHORIZED (consolidation arch.) | L1 platform/dev separation; L2 technical-exposure boundary; L3 graduation law; Moor Engine = Sieve, Funnel, Rounds, Seeds, capability supply |

**The single most important discovery:** the machinery the Smile Engine most wants to integrate with (Sieve, Forevergreen, Oracle, Round Scheduler) is **blueprint-only or missing**, while the machinery it must not duplicate (Funnel authorization, distill divergence, capability memory) is **built**. The blueprint is therefore designed as a *methodology that plugs into built machinery today and docks with blueprinted machinery as it gets authorized* — not as a system that assumes its neighbors exist.

## 5. Existing concepts this duplicates or subsumes

- **Distill frontier divergence preservation** — SUBSUMED as the downstream half of weirdness preservation (§18 integrates; the Smile adds the upstream generation-time half).
- **Capability memory claimed/verified split** — REUSED, not duplicated: SAVE/INVEST deductions become capability candidates in the existing store (§23).
- **Evergreen failure learning** — INTEGRATED: success learning (§"Success Learning") is the genuine gap (current loop is failure-only); failure learning routes to existing Seeds, not a new subsystem.
- **Live Ramble source/interpretation distinction** — ADOPTED as the anti-scripture mechanism (§28); the Smile's 4-layer chain is this distinction generalized.
- **Funnel's implicit deduction** — the Funnel's stages already *do* deduction (usage plans, references, distill). The Smile does not replace this; it widens the candidate question set *before* stages run. If the dogfood experiment (§34) shows the Funnel's implicit deduction already covers the lens questions, the lens layer is theater and must die (§37).
- **Sieve's "cheap first"** — ADOPTED as the costing discipline for lens invocation (§13, §32); not duplicated.

## 6. Canonical definition of "lens"

**A lens is a named, versioned, question-generating function over a situation.** Formally: `Lens(Situation, Context) → Family<Question>`, where each question is a candidate deduction prompt with provenance (which lens, which template version, which context spans informed it).

A lens:
- does NOT classify the situation into a bucket;
- is NOT mutually exclusive with other lenses (all five may fire on the same situation);
- is NOT sequential (no fixed order; invocation is selective and cost-ordered);
- does NOT dictate answers (it generates questions; answers come from existing machinery);
- has a **stable semantic center** (§7–§11) and **context-specific question templates** that are versioned, cached, and evergreen-pruned;
- is **selectively invocable**: a cheap relevance pre-check decides which lenses fire for a given situation (Sieve discipline: cheap first).

The five lenses are the *initial registry*, not a fixed set — evergreen retires lenses whose measured information gain is ~zero, exactly as Sieve retires projections.

## 7. SAVE — semantic center

**Center: "What existing value must not be lost?"** Retention, loss-aversion, continuity. SAVE looks *at and backward*: the present situation contains value that was expensive to create and would be expensive to rebuild. Its questions hunt for working things, reusable capabilities, knowledge worth surviving, reversibility worth keeping, and runway worth protecting.

Seed questions (seeds, not canon — §13 governs their lifecycle):
- What already works?
- What is worth preserving?
- What would be expensive to lose?
- What knowledge should survive?
- What capability can be reused?
- What should remain reversible?
- What resources/runway can be protected?
- What existing value prevents unnecessary rebuilding?

**Distinctness claim:** SAVE is the only lens whose primary direction is *retention of the present*. It overlaps INVEST on "capability" (§12) but differs in temporal direction: SAVE asks what to *keep*; INVEST asks what to *spend for future gain*.

## 8. MAKE — semantic center

**Center: "What could exist that does not?"** Generativity, composition, unrealized value. MAKE looks *forward into possibility*: the gap between the current situation and a better one, and what could be created, composed, or transformed to close it.

Seed questions:
- What is missing?
- What could exist that does not yet?
- What could these existing pieces become together?
- What could be simplified?
- What could be made more beautiful or useful?
- What new capability would close this gap?
- What would materially improve the experience?

**Distinctness claim:** MAKE is the only lens whose primary direction is *generative possibility*. It overlaps EXECUTE on "bringing into reality" (§12) but differs modally: MAKE asks what *could* be; EXECUTE asks what *can move now*.

## 9. INVEST — semantic center

**Center: "What present cost buys disproportionate future capability?"** Compounding, leverage, option-space expansion. INVEST looks *forward into returns*: where spending resources today (effort, time, attention) makes tomorrow structurally easier.

Seed questions:
- What effort today makes tomorrow easier?
- What becomes cheaper after doing it once?
- What could compound?
- What small investment creates disproportionate future capability?
- What reusable infrastructure would improve many future tasks?
- What knowledge or capability increases future opportunity?

**Distinctness claim:** INVEST is the only lens whose primary direction is *forward compounding*. Its overlap with SAVE is real (both care about capability) but the question differs: SAVE asks "what do we already have that's worth keeping?"; INVEST asks "what should we pay for now that pays back later?"

## 10. LOVE — semantic center

**Center: "Who is affected, and what deserves care?"** Stakeholder value, dignity, agency, the unmeasured. LOVE looks *outward at people*: who receives value, who bears downside, what deserves protection, what care would change.

Seed questions:
- Who is affected?
- Who receives value?
- Who bears downside?
- What deserves protection?
- What would make this genuinely better for another person?
- Are we preserving meaningful ownership and agency?
- What are we ignoring because it is difficult to measure?
- What would care change about this decision?

**Distinctness claim:** LOVE is the only lens with **no existing Moor mechanism covering it**. Nothing in the Funnel, Sieve, capability memory, or evergreen loop asks stakeholder questions. This is the lens with the strongest independent justification — and the hardest operationalization (§39). LOVE is deliberately broad; its templates must be context-addressed (§13) to avoid vacuous "think of the users" noise. If LOVE cannot be operationalized without generating noise, it becomes a checklist prompt, not a lens (§37 kills it in that case).

## 11. EXECUTE — semantic center

**Center: "What can actually move now?"** Actionability, readiness, the smallest meaningful step. EXECUTE looks *at the present moment*: what is sufficiently resolved, what is blocked, what decision is required, what disappears if never acted on.

Seed questions:
- What can actually be done?
- What opportunity exists now?
- What is sufficiently resolved to act on?
- What is the smallest meaningful movement?
- What is blocked?
- What decision is actually required?
- What disappears if we never act?
- What turns this from intention into reality?

**Distinctness claim:** EXECUTE is the only lens whose primary direction is *immediacy*. It overlaps MAKE on "bringing into reality" but differs: MAKE generates possibilities; EXECUTE filters for readiness. EXECUTE is the lens closest to existing machinery (Funnel execution packets, build queue) — its questions often resolve into "already covered," which is fine: a lens that frequently returns "nothing new" is still doing its job cheaply.

## 12. Overlap model

The five lenses are **not orthogonal, and that is by design**. Overlap is expected; the model makes it explicit so it can be measured (and pruned if a lens adds no marginal information — §33).

```
Temporal axis:   SAVE (retain present) <———> INVEST (buy future)
Modal axis:      MAKE (could exist)    <———> EXECUTE (can move now)
Stakeholder axis: LOVE (orthogonal — who is affected)
```

- **SAVE ↔ INVEST:** share the "capability" vocabulary; differ in temporal direction (keep vs. spend-for-return). Expected overlap: ~30% of deductions may be generable from either. The dogfood experiment (§34) measures whether both earn their keep.
- **MAKE ↔ EXECUTE:** share the "reality" vocabulary; differ modally (possibility vs. readiness). MAKE without EXECUTE is dreaming; EXECUTE without MAKE is myopia. They are designed as a pair.
- **LOVE:** orthogonal to both axes. It can fire on any situation the other four examine, asking a question none of them ask.
- **All five on one situation:** the intended invocation pattern. A Blueprint examined through SAVE (what value does it preserve?), MAKE (what new value?), INVEST (what future capability?), LOVE (who benefits, what deserves care?), EXECUTE (what turns it real?) yields five question families over one object. Duplicated deductions across lenses are deduped by content hash (cf. failure-record dedup pattern) and counted as evidence *for* the overlap model, not as five separate findings.

**Collapse risk (honest):** if measurement shows SAVE/INVEST or MAKE/EXECUTE generate identical deduction sets across contexts, the pair collapses to one lens with two question templates. The blueprint does not defend five-ness as sacred.

## 13. Question-generation model

Questions are generated in **cost-ordered tiers** (Sieve discipline: CHEAP FIRST, EXPENSIVE ONLY WHEN EARNED):

- **Tier 0 — deterministic templates (~free):** the seed questions instantiated with situation slots (e.g., SAVE: "What existing {capability} in {situation} would be expensive to rebuild?"). Pure string templating; no model calls; always available.
- **Tier 1 — context-addressed retrieval (cheap):** templates filled from capability memory / references / ramble spans. "What existing notes capability can be reused?" is answered by retrieval, not generation.
- **Tier 2 — selective model judgment (expensive, earned):** only for questions Tier 0–1 cannot resolve AND whose expected value exceeds the call cost. Never five parallel LLM calls by default (Page 0 forbids automatic routing).

**Lifecycle:** templates are versioned; every generated question carries provenance (lens, template version, context spans); questions are cached by (situation-hash, lens, template-version); Forevergreen prunes templates whose measured yield is ~zero and promotes templates that repeatedly produce surviving deductions (§22). The seed lists in §7–§11 are **version 0 seeds**, explicitly non-canonical.

**Selective invocation:** a cheap relevance pre-check (keyword/signal overlap against the situation, Sieve-projection style) decides which lenses fire. A pure code-refactor situation may fire SAVE+MAKE+EXECUTE and skip LOVE+INVEST; a product decision fires all five. Invocation is logged; over/under-invocation is itself a Forevergreen observation.

## 14. Deduction architecture

```
SITUATION (+ context: Page 0, references, ramble spans, capability memory)
   │
   ├─ relevance pre-check (cheap) → which lenses fire
   │
   ├─ LENS(SAVE)    → question family → candidate deductions
   ├─ LENS(MAKE)    → question family → candidate deductions
   ├─ LENS(INVEST)  → question family → candidate deductions
   ├─ LENS(LOVE)    → question family → candidate deductions
   └─ LENS(EXECUTE)  → question family → candidate deductions
   │
   ├─ dedupe by content hash; tag each deduction with (lens, template, provenance)
   │
   ├─ SIEVE projections (when Sieve is authorized/built): lens deductions become
   │  cheap deterministic projections for cost-ordered narrowing
   │
   └─ FUNNEL input: deductions enter as References / candidate information.
      The 7 stages are UNCHANGED. The Funnel still authorizes; the Smile only widens.
```

**Placement:** the deduction layer sits *before* and *around* the Funnel, never inside its authorization path. It is an advisor in the containment zone (cf. Sieve's 15% containment), never canonical. Lens output is labeled *candidate information*, never evidence — evidence is what survives the Funnel's stages.

## 15. Opportunity-generation model

**Principle (challenged as Page 0 demands):** Page 0 proposes "WIDE POSSIBILITY. PRECISE AUTHORITY." The challenge: *wide* is not free — unbounded generation is expensive theater. The refined principle:

> **POSSIBILITY GENERATION IS CHEAP AND BROAD. AUTHORITY PROMOTION IS EXPENSIVE AND NARROW. THE TWO ARE CONNECTED ONLY THROUGH VERIFIED PATHWAYS.**

- **Generating possibilities** (lens questions, candidate deductions) should be biased toward noticing: unfamiliar candidates are not killed for unfamiliarity (§18). Cost is controlled by tiering (§13), not by premature rejection.
- **Promoting claims to authority** (verified capability, sealed receipt, canonical status) stays on Moor's existing pathways: Funnel stages, capability-memory verified statuses, owner approval. No lens output is ever self-authorizing.
- The system must be able to say both "interesting, keep exploring" (cheap) and "proven, promote" (expensive) without confusing the two. Conflation in either direction is a failure mode (§35).

## 16. Hunger / dynamic acceptance model

**The ratchet, specified without fake coefficients.** Hunger is NOT a number. It is an **ordinal comparison protocol** between an incumbent and a challenger:

```
INCUMBENT (the current floor — a working answer, verified to the extent it is verified)
   vs
CHALLENGER (a candidate)
```

The challenger displaces the incumbent **iff** it demonstrates *material improvement net of replacement cost*:

1. **Material improvement** must be stated in the situation's own terms (faster, cheaper, more capable, less fragile — never an abstract score).
2. **Replacement cost** must be named: migration effort, risk, disruption, retraining, downstream dependents.
3. **The comparison is comparative, not absolute:** the question is never "how good is the challenger (0–100)?" but "is the challenger better than the incumbent *enough to justify the switch*?"
4. **The floor only moves up:** once a challenger wins, it becomes the incumbent. Degradation is never accepted as "the new normal" — his verbatim standard: when outputs stopped working, he "refused to accept that standard."
5. **No incumbent (weak position):** the bar is "does anything work?" — take the first material gain. This is not low standards; it is the correct standard for a weak position, because a working answer *creates the conditions* for higher standards.
6. **Strong incumbent:** the bar rises to "does this improve enough to justify replacement cost, risk, and disruption?" Mediocre alternatives are rejected *by the incumbent's strength*, not by prejudice.

**What this is not:** a utility function, a scoring rubric, a "hunger=0.7" parameter, an excuse to bypass hard constraints (§31 — hunger never overrides authority, privacy, verification, or safety).

**Relationship to existing machinery:** nothing implements this today (archaeology §4: zero mechanisms). The distill frontier's frozen rule ("reward preserved diversity only when it changes what the system learns") is the closest philosophical relative. The ratchet is specified here as a *protocol*, implementation-gated on the dogfood experiment (§34).

## 17. Accumulation model

```
problem
  │
useful answer (passes the current floor)
  │
verified reusable capability → capability memory (verified status)
  │
future problem begins ahead (retrieval finds the incumbent first)
  │
less hunger for mediocre alternatives (ratchet: challengers face a stronger incumbent)
  │
higher threshold → search aims at larger improvements
  │
the engine never repeatedly starts from zero
```

- **The store is capability memory** (existing, v2 schema) — not a new accumulation store. SAVE/INVEST deductions that survive verification become capabilities with `machine-verified` / `human-approved` status; the claimed/verified split is the anti-Goodhart mechanism.
- **The ratchet is the consumer** of accumulation: a stronger capability supply means stronger incumbents, which means higher bars, which means search effort concentrates where it matters.
- **Success learning feeds it** (§"Success Learning" in Page 0): "what unexpectedly created value? what should become reusable? what should future searches start with?" — the current evergreen loop is failure-only; this is the documented gap the accumulation model fills via Forevergreen Seeds (§22).
- **Failure mode it prevents:** the "brilliant amnesiac" — re-deriving the same working answers every session. Accumulation is the notebook.

## 18. Weirdness/diversity preservation

**Rule:** a weird candidate that violates a hard constraint dies appropriately; a weird candidate that is *merely unfamiliar* must survive long enough to demonstrate value — but not at unlimited cost.

- **Existing mechanism (built):** the distill frontier preserves divergence at the *distill* stage (lineage_id + fate records, Phase 1). The Smile extends this *upstream* to generation time: lens questions must not pre-filter unfamiliar candidates.
- **Bounded exploration:** weirdness gets a **budget**, not a blank check. Cheap weirdness (unfamiliar phrasing, novel composition of verified parts) is nearly free to preserve. Expensive weirdness (unproven architecture, high-cost experiments) must pass the asymmetry screen (§30): bounded downside, meaningful upside, learning even on failure.
- **Diversity is measured, not vibes:** track the candidate population's spread (distinct approaches per situation); if optimization collapses it into safe sameness, that collapse is itself a Forevergreen observation (§22).
- **What this is not:** protection for nonsense. "Weird" means unfamiliar-but-legal. Illegal (constraint-violating) candidates die at the cheapest gate that catches them — that is Sieve's job, and cheap death is a feature.

## 19. Sieve integration

- **Status:** Sieve is blueprint-only (v1.0 draft, unsealed). Integration is designed against the blueprint, marked conditional on Sieve's authorization.
- **Lens deductions as Sieve projections:** each lens family maps to cheap deterministic projections in Sieve's projection registry (e.g., SAVE → "existing-capability overlap" projection; EXECUTE → "readiness/blocker" projection). Projections carry provenance spans (Sieve §4).
- **Cost discipline shared:** Sieve's "CHEAP FIRST, EXPENSIVE ONLY WHEN EARNED" is the Smile's Tier 0→1→2 invocation model (§13). The Smile does not invent a second cost model.
- **Failure→discriminator compilation:** Sieve's design (failures compiled into cheaper upstream discriminators) is where Smile-generated questions that repeatedly fail get pruned — the mechanism by which the lens registry improves.
- **Boundary:** Sieve never mints receipts; the Smile never touches authorization. Both live in the advisory containment zone.

## 20. Funnel integration

- **The 7 stages are UNCHANGED.** The Smile Engine does not add, remove, reorder, or bypass stages. Kernel law is not negotiable.
- **Entry points:** lens deductions enter the Funnel as **References** (candidate information with provenance) and inform **usage_plan** construction (the plan can note which lenses fired and what they surfaced). They do not enter as Page 0 (immutable, owner-only) and do not mint receipts.
- **The Funnel remains the authorization path.** A lens can suggest; only the Funnel's stages (distill → decisions → replay → verdict) can promote a suggestion to a sealed, receipt-bearing outcome.
- **Dogfood dependency:** if the experiment (§34) shows the Funnel's existing implicit deduction already covers lens questions, the Smile's pre-Funnel layer is redundant for Funnel inputs (it may still serve non-Funnel situations — §25, §26).

## 21. Oracle integration

- **Honest status: there is no Oracle architecture to integrate with.** The corpus contains zero oracle abstraction in code; Sieve's blueprint designs bounded oracles. This section is therefore a *docking specification*, not an integration claim.
- **When oracles exist:** lens-generated questions are natural oracle candidates — each question is a checkable claim ("what existing capability can be reused?" → retrieval oracle; "who bears downside?" → stakeholder-review oracle). Questions carry the cost tier that determines which oracle class may answer them.
- **Until then:** Tier 0–1 questions resolve deterministically; Tier 2 questions are answered by the existing expensive paths (human review, funnel stages) and labeled as such. No fake "oracle" is constructed from a template.

## 22. Forevergreen integration

- **Status:** Forevergreen Seeds is blueprint-only (v1.0 draft, unsealed). Integration designed conditionally.
- **The Smile observes itself → plants seeds:** lens consistently contributes nothing; two lenses generate identical deductions; question templates produce noise; over/under-invocation; thresholds cause premature acceptance or missed opportunities; weird candidates repeatedly win (evidence for the weirdness budget).
- **The Smile may NOT promote changes to itself.** Seed → evidence → Funnel → authorized promotion. The law "nothing may promote its own seed" applies to the Smile Engine with full force — a self-modifying question-generator is the exact failure mode the law exists to prevent.
- **Success learning** (the documented gap in the current failure-only evergreen loop) is specified here: seeds for "what unexpectedly created value / why did this work / what should become reusable" — especially for SAVE and INVEST.
- **Failure learning** routes to existing Seeds/Sieve discriminator compilation, not a new subsystem: "can an expensive failure become a cheap upstream discriminator?"

## 23. Capability-memory integration

- **The store:** `moor-capability-memory.js` v2 (built). No new store.
- **Write path:** SAVE deductions ("what capability can be reused?") that survive verification become capabilities with verified status; INVEST deductions ("what infrastructure would compound?") become composition candidates (pairwise graph edges, `promoteComposition` requires evidence — existing guard reused).
- **Read path:** Tier 1 question generation retrieves from capability memory first ("what existing notes capability can be reused?" is a retrieval question, not a generation question). Retrieval is currently linear scan + token overlap — adequate for now; the blueprint does not require embeddings.
- **Known flaws inherited honestly:** `Math.random()` IDs (no content dedup — the Smile's content-hash dedup for deductions is the recommended fix, not assumed); destructive slice caps (archival, not deletion, recommended). These are flagged, not silently depended upon.

## 24. Live Ramble integration

- **The source/interpretation distinction IS the anti-scripture mechanism** (§28). Live Ramble's design — verbatim capture first, interpretation layered and revisable, manufactured owner statements → PROVISIONAL — is adopted as the Smile's provenance architecture for founder philosophy.
- **Ramble as lens input:** a Live Ramble is a situation rich in owner intent; lens questions over ramble spans ("what in this ramble is worth preserving?" / "who is affected?") are Tier 1 (context-addressed) invocations.
- **"People are streams, not profiles"** is implemented by the same distinction: new statements are captured verbatim and interpreted against (not through) history; interpretations remain revisable (§29).

## 25. Blueprint integration

- Blueprints are Moor OS's native creative medium (consolidation architecture). The Smile illuminates Blueprints **optionally**: a Blueprint can be examined through the five lenses (SAVE: what existing value does it preserve? MAKE: what new value? INVEST: what future capability? LOVE: who benefits, what deserves care? EXECUTE: what turns it real?).
- **Not mandatory.** Lens illumination must not become required marketing copy unless evidence supports that use. Blueprints advertise through CLARITY + BEAUTY + EVIDENCE + DEMONSTRATED VALUE (Page 0) — lenses are a means to clarity, not a template to fill.
- **Provenance:** lens-generated Blueprint perspectives carry the 4-layer chain (§28) — a reader can always distinguish what the author said from what the lenses inferred.

## 26. Moor OS relationship

- **Layer:** Moor Engine (with Funnel, Sieve, Rounds, Seeds, capability supply) — per the consolidation architecture's component map. The Smile is underlying capability, not product surface.
- **L2 boundary (binding):** no dev-only concept appears in a Moor OS surface without product-language translation. Ordinary users never see "SAVE/MAKE/INVEST/LOVE/EXECUTE" as engine terminology. Possible user-facing expressions (all *eventual*, none assumed): optional five-lens views, question prompts, Blueprint perspectives, decision reflection, opportunity discovery, creation guidance.
- **The underlying capability must remain useful without requiring the user to understand the architecture.** If the Smile only works when the user thinks in lenses, it has failed as engine design.

## 27. Pulse relationship

- Pulse is the developer environment; technical depth is exposed there (owner's L2 correction). Lens views, question provenance, template versions, invocation logs, and Forevergreen observations about the lenses may all be visible in Pulse — this is appropriate for the dev audience.
- **No Pulse visual metaphor may become a hidden dependency** of the Smile's underlying capability (L1). The lens abstraction must survive independently of any cathedral/console/panel expression.
- The Build Console (MAKE face, live) is a *consumer* of the Smile's question generation (order composition could invoke lenses), not its host.

## 28. Anti-scripture architecture

**Load-bearing.** Four separable layers, enforced structurally — not as documentation advice but as data-model invariants:

```
LAYER 1 — WHAT HE SAID
  Verbatim founder/author statements, byte-preserved, hash-bound, immutable.
  Example: the SMILE ramble text; "Working creates the floor..."
  May never be edited, only superseded by newer verbatim with explicit supersession records.

LAYER 2 — WHAT MOOR INFERRED
  Interpretations, lens outputs, template instantiations, hypotheses.
  Always labeled with author (which lens/template/model), always revisable.
  Example: "SAVE lens suggests capability X is worth preserving" — an inference, not his words.

LAYER 3 — WHAT EVIDENCE SUPPORTED
  Only what survived a verified pathway: funnel receipts, test results, measurements,
  dogfood outcomes. Each item anchored to a receipt fingerprint or measurement record.

LAYER 4 — WHAT THE SYSTEM CURRENTLY USES
  The live mechanism: which templates are active, which thresholds are set, which
  capabilities are verified. Changed only through authorized promotion (Funnel verdict).
```

- **The mechanism may become extremely useful even if the founder's explanation was wrong.** Layers let the explanation die while the mechanism survives — that is the entire point.
- **Manufactured authority is attacked:** any path that could launder an inference into Layer 1 (e.g., a template that writes "the owner wants X") is forbidden by construction — cf. Live Ramble's rule that interpreter output cannot express `actor:'owner'`, producing at most PROVISIONAL nodes.
- **Applies to everyone:** founder, authors he reads, researchers, models, previous Moor architecture, current Moor architecture. No exceptions for admired sources.

## 29. Personalization/listening implications

- **"Know me without deciding that you know me":** historical knowledge improves context without replacing new observation. Implementation: new statements captured verbatim (Layer 1) + historical context as *hypotheses* (Layer 2) → current interpretation, remain revisable.
- **"People are streams, not profiles":** personalization provides hypotheses; it must not erase listening. A profile is a cached Layer-2 inference with an expiry, never a Layer-1 fact about the person.
- **Live Ramble's source/interpretation distinction already provides the correct architecture** (Page 0's question, answered): yes — §28 is that distinction generalized to all founder/author input, not just rambles.

## 30. Positive asymmetry / bounded experimentation

- The Smile should notice **positive asymmetry**: limited downside + meaningful possible upside + learning even on failure = worth exploring.
- **Mechanism:** the weirdness budget (§18) + Sieve's cost ordering. A bounded experiment is a candidate with a declared downside cap; it may proceed cheaply *because* the downside is bounded, even when the upside is uncertain.
- **This is not financial or risk-taking advice.** Within Moor: bounded experiments are build/runner operations with explicit scope limits (cf. build-queue scope validation), never open-ended resource commitments.
- **Founder asymmetry note (his standing doctrine):** seeking positive asymmetry for himself is legitimate; it never excuses deceptive lock-in, hidden extraction, or misleading claims. The Smile's LOVE lens is the structural counterweight — asymmetry questions and care questions fire on the same situation.

## 31. Hard constraints

Hunger does not override, in this order:

1. **Owner authority** — Page 0 immutability, PL decisions, explicit stops.
2. **Kernel law** — 7 stages, receipt authorization, execution gates.
3. **Execution authorization** — the build queue's `authorize_execution` discipline; unsealed never executes.
4. **Privacy** — notes default private; no training on private material; the notes privacy policy is a hard boundary LOVE enforces.
5. **Required provenance** — the 4-layer chain; no layer may be fabricated.
6. **Required verification** — claimed vs. verified stays split; verification is never waived for "obvious" lens outputs.
7. **Hard safety constraints & security boundaries** — weird candidates that violate constraints die at the cheapest gate.

**"The Smile Engine searches within reality. It does not redefine reality because it wants an opportunity to exist."** Opportunity bias (§15) operates strictly inside these constraints; a lens question that implies violating one is itself a defect to prune.

## 32. Cost model

| Tier | Operation | Approx. cost | Budget rule |
|---|---|---|---|
| T0 | Template instantiation (deterministic) | ~free | Always allowed; logged |
| T1 | Context retrieval (capability memory, references, spans) | cheap (linear scan today) | Allowed when relevance pre-check fires the lens |
| T2 | Model judgment call | expensive | Only when T0–T1 cannot resolve AND expected value > cost; never 5 parallel by default |
| T3 | Bounded experiment (build/run) | bounded by declared downside | Only via authorized execution paths (build queue) |

- **Per-situation budget:** lens invocation draws from a situation budget; T2 calls require explicit expected-value justification recorded in provenance.
- **Measured, not assumed:** cost/token/latency instrumentation is currently **zero everywhere** (archaeology §4) — the cost model is a design commitment; the instrumentation it needs does not exist yet and is flagged as a prerequisite for §33, not assumed present.
- **Anti-theater:** if T2 calls don't measurably improve downstream Funnel survival (§34), they are cut. Cost without evidence is the definition of theater.

## 33. Measurement

Ongoing (post-dogfood) instrumentation per lens and per template:

- **Yield:** deductions generated → survived Funnel stages (survival rate per lens).
- **Novelty:** deductions not generable from baseline (duplicate rate per lens-pair — feeds the overlap model §12).
- **Cost:** tier distribution per situation; T2 spend vs. downstream survival.
- **Noise:** deductions pruned as irrelevant, per template (pruning signal for §22).
- **Threshold calibration:** premature acceptances vs. missed opportunities (ratchet tuning signal).
- **Reuse discovered:** SAVE/INVEST deductions that became verified capabilities.
- **Constraint misses:** lens outputs that implied hard-constraint violations (defect signal).

**Kill criteria (standing):** any lens with ~zero marginal information gain across measured contexts is retired. Any template with sustained noise is pruned. The measurement exists to kill, not to justify.

## 34. Dogfood experiment (DESIGNED ONLY — not run; running = building)

**Question:** does explicit five-lens question generation measurably improve deduction over the existing baseline?

**Design:**
- **Corpus:** a bounded set of real historical Moor requests (funnel run ledgers with Page 0s, e.g. the 2026-10-07/08 run history). N chosen for statistical readability, not maximal size.
- **Arms:**
  - BASELINE: the request's Page 0 → existing Funnel input preparation (as actually run historically).
  - LENS-ASSISTED: the same Page 0 → Tier 0–1 lens question generation (SAVE/MAKE/INVEST/LOVE/EXECUTE, selective invocation) → questions + candidate deductions appended as References → Funnel.
- **Blinding:** evaluators (funnel operators) see both arms' Funnel inputs without arm labels where feasible.
- **Metrics:** useful opportunities discovered (novel deductions that survive distill); duplicated deductions; irrelevant deductions; novel useful candidates; cost (tier distribution); latency; model calls (must be zero for Tier 0–1 arms — by construction); downstream Funnel survival (verdict rate, obligation coverage); reuse discovered (capability-memory hits); missed hard constraints; owner-rated usefulness (sampled, not every item).
- **Ablations:** 5-lens vs 3-lens (SAVE/MAKE/LOVE) vs 1-lens vs 0-lens; templated-only vs retrieval-augmented. Determines whether fewer lenses, different semantics, or no explicit machinery wins.
- **Kill conditions:** if lens-assisted shows no measurable gain on survival-weighted usefulness, or gains are explained entirely by retrieval (Tier 1) with lenses adding nothing, the verdict is THEATER — the lens layer dies and §42's fallback applies.
- **Do NOT assume the Smile version wins.** The experiment is designed to be capable of killing the concept. An experiment that cannot kill is marketing.

## 35. Failure modes

| # | Failure mode | How it happens | Detection | Response |
|---|---|---|---|---|
| F1 | **Lens theater** | Questions generated, none used; the layer performs diligence without changing outcomes | Survival rate ~zero across lenses (§33) | Kill the layer (§37) |
| F2 | **Category creep** | Lenses slowly become buckets/silos/stages in practice | Audits find lens-exclusive routing or mandatory sequencing | Structural review; the blueprint forbids it — treat as defect, not evolution |
| F3 | **Threshold gaming** | Ratchet tuned to always accept (floor never binds) or never accept (floor unreachable) | Premature-acceptance vs missed-opportunity metrics diverge | Recalibrate via Forevergreen; thresholds are Layer 4 (revisable), not law |
| F4 | **LOVE-washing** | LOVE questions asked and ignored; care language without care mechanics | LOVE deductions never affect decisions | Operationalize or kill LOVE as a lens (§10) |
| F5 | **Smile-score misreading** | Someone builds the forbidden happiness/confidence metric | Any numeric "smile" appears | Kill on sight; the blueprint forbids it absolutely |
| F6 | **Founder laundering** | Inferences presented as "what he said" | Layer-1/2 confusion in outputs | PROVISIONAL quarantine per Live Ramble rule; provenance audit |
| F7 | **Weirdness capture** | Weirdness budget spent on expensive nonsense repeatedly | Budget burn without learning | Tighten asymmetry screen; budget is bounded, not entitled |
| F8 | **Possibility/authority conflation** | Lens candidates treated as verified | Unsealed lens output cited as evidence | Provenance labels; the kernel's receipt discipline is the backstop |
| F9 | **Cost creep** | T2 calls multiply without evidence | Cost per situation trends up, survival flat | Cut T2; Sieve discipline reimposed |
| F10 | **Self-promotion** | The Smile promotes changes to itself | Any Layer-4 change originating from a Smile-planted seed without Funnel verdict | Forbidden absolutely; the seed law has no exceptions |

## 36. Poisoning/authority attacks

- **Manufactured owner statements:** an input that tricks question generation into emitting "the owner wants X." Defense: interpreter/template output schema cannot express Layer-1 authorship; such outputs are PROVISIONAL by construction (Live Ramble rule, §24); the owner sees and retracts.
- **Lens-output poisoning:** adversarial context spans that steer Tier 1 retrieval. Defense: provenance spans on every question; retrieval sources are allowlisted (capability memory, receipts, ramble spans — not arbitrary web text).
- **Receipt forgery:** a fake "verified" deduction. Defense: only the kernel mints receipts; `verifyReceipt` recomputes; lens outputs never carry receipt-shaped claims.
- **Threshold manipulation:** adversarial incumbents (a weak answer entrenched as "the floor"). Defense: the floor must itself have passed the current floor's bar *at the time* — incumbents carry their provenance; an incumbent that never earned its position can be challenged by any challenger that demonstrates material improvement. The ratchet is not incumbency protection.
- **Seed poisoning:** malicious Forevergreen seeds about the lenses. Defense: seeds require repetition + evidence + Funnel promotion; the Smile never promotes its own seeds (§22).

## 37. Ideas rejected

Killed by the anti-cargo-cult pass — each with the reason:

1. **Five lenses as categories/silos/stages/folders/sequential steps.** Killed: Page 0 forbids it; categories would recreate the exact rigidity the lens abstraction escapes.
2. **A numerical hunger coefficient.** Killed: Page 0 forbids fake coefficients; the ratchet is ordinal/comparative (§16).
3. **"Smile" as a score, metric, or confidence value.** Killed absolutely (§35-F5).
4. **Five parallel LLM calls per situation.** Killed: cost without evidence; Tier 0–1 first, T2 earned (§13).
5. **A new Smile Engine runtime service/box.** Killed: no evidence the value needs a runtime box; the surviving form is methodology + mechanism designs (§40).
6. **Mandatory lens invocation on every Funnel run.** Killed pending dogfood evidence; mandatory = theater until proven.
7. **A second failure-learning subsystem.** Killed: integrate with Forevergreen/Sieve (§22).
8. **A second accumulation store.** Killed: capability memory exists (§23).
9. **LOVE as vague "think of users" prompting.** Killed as a lens *unless* operationalized with context-addressed templates; the fallback is a checklist prompt, honestly labeled (§10).
10. **User-facing "SMILE" terminology in Moor OS.** Killed per L2 (§26); internal name only, pending §40.
11. **Canonizing the seed question lists.** Killed: they are version-0 seeds, evergreen-pruned (§13).
12. **The founder's diagrams as architecture.** Killed: Page 0 itself says not to preserve them if reality suggests better.

## 38. Ideas simplified

- **Weirdness preservation** → not a new subsystem: extend distill frontier's built divergence preservation upstream to generation time, with a bounded budget (§18).
- **Accumulation** → not a new store: capability memory's verified-status promotion + the ratchet as its consumer (§17, §23).
- **Anti-scripture** → not a new invention: Live Ramble's source/interpretation distinction generalized to the 4-layer chain (§28).
- **Question generation** → not model calls: Tier 0 templates + Tier 1 retrieval first; T2 earned (§13).
- **Oracle integration** → not claimed: honest docking spec against a missing abstraction (§21).
- **The five lenses** → kept as five, but with the overlap model explicit and collapse conditions stated (§12). Five-ness is a hypothesis, not a monument.
- **"Engine"** → the surviving form is a *layer + protocol + experiment*, not an engine in the runtime sense. The name survives only as internal shorthand (§40).

## 39. Open uncertainties

1. Does explicit lens invocation measurably beat the Funnel's implicit deduction? (Dogfood decides.)
2. Can LOVE be operationalized without generating noise? (Templates + measurement decide.)
3. SAVE/INVEST and MAKE/EXECUTE: one lens or two? (Overlap measurement decides.)
4. What calibrates the ratchet's "material improvement" bar per domain? (Evidence decides; no universal constant.)
5. Cost at scale: does Tier 0–1 question generation stay ~free as situation volume grows? (Instrumentation decides — currently zero.)
6. Is "Smile Engine" the right internal name, or does it invite the F5 misreading forever? (Usage decides; L2 keeps it internal regardless.)
7. Do Sieve/Forevergreen get authorized/built, and does the docking spec (§19, §22) match their real shapes? (Their funnels decide.)
8. Does the 4-layer anti-scripture chain survive contact with real high-volume use, or does Layer 2/3 bookkeeping collapse under its own weight? (Dogfood adjacent; flagged, not assumed.)

## 40. Recommendation on canonical status

**YES — for the surviving form only, conditionally.**

What earns canonical status (evidence-based):

(a) **The lens abstraction + five lenses as versioned methodology in Moor Engine** (§6–§12). The abstraction is genuinely new (no existing mechanism does non-exclusive question generation over a situation); LOVE fills a real coverage gap; the overlap model is honest about redundancy risks. Canonize the *abstraction and the registry mechanism*, not the seed questions.

(b) **The hunger ratchet as a specified mechanism design** (§16), implementation **gated on dogfood evidence**. The ratchet is novel (nothing implements it), matches his verified ideology, and is specified without fake quantification. It becomes canonical machinery only if the experiment shows thresholds matter.

(c) **The anti-scripture 4-layer chain** (§28) as the provenance standard for all founder/author-derived content. This generalizes already-designed Live Ramble mechanics; it is the load-bearing answer to "don't turn the thinker into scripture."

What does NOT earn it: the name as user-facing terminology; the seed question lists; the smile posture as doctrine; any runtime "Smile Engine" box; mandatory invocation; the founder's diagrams.

**Conditions:** (i) dogfood experiment (§34) must show non-theater value or the lens layer dies per its own kill criteria; (ii) LOVE must operationalize or be demoted to checklist; (iii) the overlap measurement must not collapse any pair — or the collapse happens and the survivor is what's canonical.

## 41. If YES — exact surviving canonical definition

> **THE SMILE ENGINE (canonical candidate v1.0):** A question-generation methodology in Moor Engine consisting of (1) five named, versioned, non-exclusive lenses — SAVE ("what existing value must not be lost?"), MAKE ("what could exist that does not?"), INVEST ("what present cost buys disproportionate future capability?"), LOVE ("who is affected, and what deserves care?"), EXECUTE ("what can actually move now?") — each a function from (situation, context) to a family of candidate questions with provenance, invoked selectively in cost order (deterministic templates, then retrieval, then earned model judgment); (2) a hunger ratchet — an ordinal incumbent-vs-challenger acceptance protocol where a working answer becomes the floor, the floor only moves up, and displacement requires material improvement net of replacement cost, never a numerical score; (3) the anti-scripture provenance chain separating what was said / inferred / evidenced / currently used. Lens output is candidate information, never authority. Authority remains with the Funnel's verified pathways. The engine observes itself through Forevergreen Seeds and may never promote changes to itself.

Nothing else in this blueprint is canonical. Not the seed questions. Not the diagrams. Not the name outside internal use.

## 42. If NO — what useful components survive without the name

(Moot given §40's YES-conditional, recorded as the fallback the dogfood kill-criteria would trigger:)

- The **lens abstraction** as an unlabeled design pattern ("generate questions from multiple directions before deciding") — useful even with zero lenses named.
- The **hunger ratchet** as a decision protocol — the most portable idea in the document; survives as "incumbent-vs-challenger with replacement cost," no acronym needed.
- **LOVE's stakeholder questions** as a review checklist — the coverage gap is real regardless of machinery.
- The **dogfood experiment design** — reusable for any future "does this explicit machinery beat the implicit baseline?" question.
- The **4-layer provenance chain** — already partially designed in Live Ramble; survives as that project's extension.

---

# DIAGRAMS

## D1 — Five lenses → questions → opportunities

```
                    SITUATION (+ context)
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    relevance pre-check (cheap): which lenses fire?
         │               │               │
    ┌────┴────┐    ┌────┴────┐    ┌────┴────┐   ... (1-5 lenses)
    │  SAVE   │    │  MAKE   │    │  LOVE   │   ... each: Lens(situation, ctx)
    └────┬────┘    └────┬────┘    └────┬────┘
         │               │               │
    question families (provenance-tagged, cached)
         │               │               │
         └───────────────┼───────────────┘
                         │
              dedupe by content hash
                         │
              candidate deductions
              (labeled: candidate information,
               NEVER authority)
                         │
              ┌──────────┴──────────┐
              │  Sieve projections  │  (when authorized)
              │  (cheap narrowing)  │
              └──────────┬──────────┘
                         │
              ┌──────────┴──────────┐
              │  FUNNEL (7 stages,  │
              │  unchanged)         │
              └──────────┬──────────┘
                         │
              survivors → improved position
                         │
                   LOOK AGAIN :)
```

## D2 — Accumulation / rising floor (the ratchet)

```
weak position ──► "does anything work?" ──► YES: take the gain
                                                    │
                                             stronger position
                                                    │
                          ┌─────────────────────────┘
                          ▼
              ┌──────────────────────┐
              │  INCUMBENT = floor   │◄── verified reusable capability
              │  (working answer)    │    (capability memory)
              └──────────┬───────────┘
                         │ challenger appears
                         ▼
              material improvement
              NET OF replacement cost?
                    │           │
                   YES          NO
                    │           │
              challenger wins   incumbent stands
                    │           (rejection is information)
                    ▼
              NEW floor (higher)
                    │
              keep searching ──► thresholds rise with the floor
```

## D3 — Smile Engine → Sieve → Funnel

```
SMILE (question generation, advisory, cheap)
  lenses → questions → candidate deductions
                    │
                    ▼
SIEVE (cost-ordered narrowing, advisory)      [blueprint-only today]
  projections → rounds → bounded oracles
  failures → cheaper upstream discriminators
                    │
                    ▼
FUNNEL (authorization, 7 locked stages)       [BUILT, v44-sealed]
  page0 → usage_plan → references → distill
    → decisions → replay → verdict → RECEIPT
                    │
                    ▼
          BUILD QUEUE (authorized execution)  [BUILT]
                    │
                    ▼
          capability memory ← verified survivors
                    │
                    ▼
          Forevergreen Seeds ← observations   [blueprint-only today]
          (may never promote its own seeds)
```

Authority flows DOWNWARD only through the Funnel's receipt. Nothing above the Funnel authorizes anything.

## D4 — Anti-scripture provenance

```
 WHAT HE SAID (Layer 1)          WHAT MOOR INFERRED (Layer 2)
 verbatim, hash-bound,            lens outputs, templates,
 immutable                       hypotheses — revisable, labeled
        │                                   │
        │         ┌─────────────────────────┘
        │         ▼
        │   WHAT EVIDENCE SUPPORTED (Layer 3)
        │   funnel receipts, measurements,
        │   dogfood outcomes — anchored
        │                   │
        └───────────────────┼───────────────────┐
                            ▼                   │
              WHAT THE SYSTEM CURRENTLY USES    │
              (Layer 4)                         │
              live templates, thresholds,       │
              verified capabilities —           │
              changeable ONLY via               │
              authorized promotion              │
                                                │
  A mechanism may survive even if the           │
  founder's explanation was wrong. ◄────────────┘
  The thinker is not scripture.
```

## D5 — Forevergreen self-improvement path

```
SMILE operates
    │
    ├─► observes itself:
    │     lens yields ~zero info        ─┐
    │     two lenses identical output    │
    │     template produces noise        ├─► PLANT SEED
    │     over/under-invocation          │   (provenance-tagged,
    │     premature acceptance           │    Layer-2 observation)
    │     missed opportunities           │
    │     weird candidates win          ─┘
    │
    ▼
SEED matures: repetition + evidence
    │
    ▼
FUNNEL verifies the hypothesis
    │
    ├─► SURVIVES ──► authorized promotion
    │                (template pruned / lens retired /
    │                 threshold recalibrated)
    │
    └─► DIES ──► recorded, not mourned
                            │
              ┌─────────────┘
              ▼
   THE SMILE NEVER PROMOTES ITS OWN SEEDS.
   (F10 failure mode — forbidden absolutely)
```

---

*End of blueprint v1.0. Design only. No production machinery built. Awaiting funnel verification and the owner's architectural review. The goal is not to immortalize a philosophy — it is to determine whether this insight improves Moor.*

---

## OWNER OVERRIDE (2026-10-08) — appended after sealing; v1.0 above is UNCHANGED

**This addendum is a later owner override, not a revision.** The v1.0 conclusions
(§40–§42, including the conditional-yes verdict and the anti-cargo-cult kills)
stand exactly as written. What follows is recorded disagreement under the
layered-override architecture
(`~/workspace/funnel/verdicts/layered-override-authority-v1.md`).

Full override record: `~/workspace/funnel/verdicts/smile-override-v1.md`
(sealed 2026-10-08, receipts `3b343810def29c47` / `1fd9b3f926b9530c`).

**Evaluator verdict (preserved verbatim, not rewritten):** the dogfood experiment
found the five-lens mandatory deduction layer unjustified (theater for Funnel
inputs); SAVE/MAKE/EXECUTE redundant with the Funnel's implicit deduction;
INVEST+LOVE produced all measurable novel gain; kill conditions did not trigger
for the reduced form. Evidence: `~/workspace/funnel-docs/smile-dogfood/report.md`.

**Owner override (disagreement, not consensus):** the owner ACCEPTS all dogfood
measurements verbatim and OVERRIDES only the deletion conclusion. **SAVE, MAKE,
INVEST, LOVE, EXECUTE are preserved as the five canonical conceptual lenses**
of the Smile Engine. Canonical-conceptual ≠ runtime-invocation-strategy: no
five mandatory LLM calls, no five mandatory runtime stages, cheap per-lens
coverage checks, dedup downstream. The seven exclusions (mandatory LLM calls,
mandatory stages, numerical hunger coefficients, smile scoring, rigid
categories, seed questions, diagrams as immutable truth) remain excluded.

**What this changes for readers of v1.0:** wherever v1.0 recommends absorbing
SAVE/MAKE/EXECUTE into existing machinery or declines to canonize the five-lens
layer, that recommendation remains the evaluator's standing position — and the
owner's controlling decision is the five-lens canon above. INVEST + LOVE retain
their special implementation-guiding status (systematic Funnel gaps).

**Falsifiability:** if the five-lens representation later creates material harm,
confusion, latency, instability, or measurable degradation, that evidence is
preserved and brought back for reconsideration. Future independent evidence may
challenge both the evaluator verdict and this override.
