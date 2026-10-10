# BLUEPRINT: BAGEL → BOUNCE BACK

**Status:** SEALED BLUEPRINT v1.0 — design only. Zero production code, zero pushes, kernel untouched.
**Date:** 2026-10-08
**Page 0 (verbatim, hash-bound):** `~/workspace/funnel-docs/bagel-page0.md` — page0_hash `d5e0643083be74fb`
**Funnel receipts (verifyReceipt: true, 0 substitutions):**
- F1 intake: `e7048a4a9458ffcf` — 53/53 Page 0 obligations source-backed and satisfied
- F2 design: `b389b4f25171fa29` — 19/19 design obligations satisfied, anti-cargo-cult pass executed
- Ledgers: `~/workspace/funnel/runs/bagel-20261008-f1.json`, `bagel-20261008-f2.json`
**Governing records:** layered-override ADR (`~/workspace/funnel/verdicts/layered-override-authority-v1.md`);
Smile Engine blueprint v1.0 + owner override (`~/workspace/funnel/blueprints/smile-engine-blueprint-v1.md`);
Smile dogfood report (`~/workspace/funnel-docs/smile-dogfood/report.md`).

---

# SELL

## The promise

Failure in Moor stops being either hidden or terminal. Every failed attempt becomes
a **BAGEL** — an honest, visible declaration that *this attempt did not land* —
followed by a **BOUNCE BACK**: the evidence preserved, the survivors extracted,
the lesson saved, and the next legitimate move made easier to find than the
failed one was.

## The stakes

Moor already preserves failure truthfully — sealed FAIL verdicts, append-only
ledgers, build-queue REJECTED/BLOCKED states. What it does not do is **continue
well**. A verdict records what died; nothing is obligated to say what survived,
what was learned, or what to try next. Lessons evaporate between sessions
(Forevergreen Seeds blueprint: "Moor learns the way a person with no notebook
learns"). The same failures recur — the grass pipeline failed its executive
visual check, got fixed at the subsystem level, and failed the same way again,
because the lesson never became machinery.

BAGEL → BOUNCE BACK is the notebook.

## The click

A public blueprint attempt fails. Instead of the failure quietly disappearing —
or exploding into a postmortem nobody reads — the page carries a small honest
card: **BAGEL.** *This attempt did not survive this run.* Below it: what
happened, what survived, what was learned, and the legitimate moves still
available — one of which is already easier to take than the failed attempt was.
Nobody pretends it succeeded. Nobody is shamed. Nothing valuable is lost.
The next person starts farther ahead.

## The law

**ZERO REMAINS ZERO. NOTHING VALUABLE IS WASTED. YOU STILL HAVE A MOVE.**

---

# SPEC

## 1. Purpose

Design the smallest correct canonical form of a system-wide failure-and-recovery
philosophy for Moor, built on one principle: **failure should be visible,
honest, informative, and not automatically terminal.** Origin: the owner's
sales-ritual story — saying "bagel" for a zero day kept the zero a zero while
changing the team's relationship to it. (The sales culture itself is explicitly
NOT the significance; the relationship to the number is.)

## 2. Origin and provenance

- Page 0 verbatim: `~/workspace/funnel-docs/bagel-page0.md` (2026-10-08).
- The concept was attacked by its own mandatory anti-cargo-cult pass and
  dogfooded against four real Moor failures before this blueprint was written.
  The verdict (`~/workspace/funnel/verdicts/bagel-v1.md`) records per-section
  SURVIVES / REDUCED / NO honestly — including what died.
- Established principles applied, not re-derived: "Collapse what you must to
  move. Preserve what you can so you can learn." / "Deduplicate the outputs,
  not necessarily the perspectives." / "Override the outcome, not the record."

## 3. Non-goals

1. **No new failure-learning subsystem.** Compounding docks with Forevergreen /
   Sieve; BAGEL does not build its own. (Page 0: "Do not create duplicate
   learning infrastructure unnecessarily.")
2. **No new receipt type.** Failure records are verdicts/ledger entries with
   outcome FAILED; receipts already bind evidence (H2/H3).
3. **No mandatory ceremony.** Trivial and corrective misses self-erase; BAGEL
   is not stamped on every failed headless check.
4. **No positivity theater.** "Great failure!" is forbidden, not encouraged.
5. **No humiliation engine, no failure gamification.** Forbidden with
   mechanisms (§13), not just words.
6. **No privacy destruction.** Failure is open only within the scope where the
   underlying work is open. Consent gates are structural (§11).
7. **No second provenance system.** The 4-layer anti-scripture chain (§18)
   extends, not duplicates.

## 4. Archaeology: existing failure-handling primitives (inspected first)

What Moor already has — the honest inventory:

| Primitive | Location | What it does | Gap BAGEL addresses |
|---|---|---|---|
| Sealed FAIL verdicts | `~/workspace/funnel/verdicts/` (e.g. `grass-20261006-0326.md`) | Preserves truth + evidence of failed attempts | No survivor/next-move obligation |
| Append-only ledgers | `~/workspace/funnel/runs/*.json` | Hash-bound obligation records | Not queryable as learning |
| Build-queue terminal states | `REJECTED / HELD / BLOCKED / NEEDS OWNER / SUPERSEDED` | Mechanical failure classification | No lesson extraction, no bounce-back |
| Failure-injection evidence | `~/workspace/funnel-docs/antifragile/` | Bounded failures producing durable fixes (T12 → fail-fast `ensureDir`) | Called "antifragile events", not unified |
| Standing lessons | `~/workspace/AGENTS.md` ("learned the hard way") | Manual compounding that actually works | Manual, unsealed, single-surface |
| Memory/daily notes | `~/MEMORY.md`, `~/memory/` | Accumulation across sessions | Not structured as failure records |
| Forevergreen Seeds | `~/workspace/funnel-docs/forevergreen-seeds/` — **draft, unsealed** | The intended compounding layer | Does not exist as sealed machinery |
| Capability memory | verified-status promotion | Accumulation of what works | No failure counterpart |

**Honest finding:** the truth-preservation half of BAGEL already exists.
Verdicts don't lie; ledgers don't rewrite. What does not exist is the
**continuation obligation**: nothing requires a failed attempt to yield
survivors, a next move, or a planted seed. That obligation — not the
vocabulary, not a new database — is the genuinely new thing this blueprint
adds.

## 5. Dogfood: four real Moor failures (summary; full analysis in the verdict)

- **Grass FAIL (2026-10-06):** the verdict preserved truth ("subsystem success
  cannot override executive visual failure" — the Convergence Law). BAGEL would
  have added: survivors (the Red-FSH test method, the technically-correct
  normals fix) and a next-move pointer. Then the failure **recurred** — the
  lesson never became machinery. Verdict on BAGEL here: the *recording* half
  existed; the *compounding* half is exactly what's missing, and it depends on
  the unsealed Seeds layer.
- **Pulse tool-inline bug (tonight-audit):** the complete BAGEL→bounce-back
  cycle happened with NO vocabulary — bug found, fixed, lesson entered
  AGENTS.md as a standing rule. **The naming added nothing informational here.**
  This is the strongest evidence that the vocabulary is the weakest claim.
- **Antifragile T12:** bounded failure injection exposed a hang; the fix
  permanently changed behavior. Exemplary already. BAGEL adds only cross-layer
  naming unity ("as above, so below").
- **Adapter cachebust hotfix:** process failure (shipped unsealed),
  repaired under the rules. The repair pattern — visible failure, preserved
  evidence, extracted lesson — is BAGEL-shaped already.

**Where BAGEL would have been actively worse** (Page 0 demanded these):
1. **Serious failures** (security, privacy, safety): playful BAGEL presentation
   trivializes. The branding risks tonal contamination even in records.
2. **High-frequency trivial failures**: stamping BAGEL on every failed check
   is ceremony theater — the corrective-bounce self-erasure principle argues
   *against* memorializing these.
3. **Consent pressure**: the cultural gravity of "don't hide failure" can
   override legitimate privacy preferences. The scope gate must be structural,
   not advisory.
4. **Gamification drift**: visible BAGELs become status signals (shame or
   perverse pride) despite the rule against it. The rule needs a mechanism.

## 6. Canonical definition

**BAGEL** (UX vocabulary only): an honest, visible declaration that a bounded
attempt did not land — *this attempt*, not *this person*; truth, not shame;
information, not theater.

**Internally the canonical name stays boring:** `attempt_outcome: failed` on a
verdict/ledger record. UI renders BAGEL. (Page 0 asked this exact question;
the answer is **both, separated**: boring in the machinery, human at the
surface.)

A BAGEL is **not**: a verdict on the person · a success in disguise · hidden
evidence · game over · permission to fail carelessly · a joke about serious
harm.

**BOUNCE BACK** (the continuation obligation): when a failure is recorded
within a scope where BAGEL applies, the record **must** carry: what survived,
what was learned, and the legitimate moves still available — with contextual
deltas (what changed since the attempt that matters to *this* actor's *current*
goal). The next legitimate move must be easier to discover than the failed
action was to repeat.

## 7. The BAGEL record (derived from existing primitives — not the Page-0 sketch)

Page 0 forbade blindly implementing its 12-field sketch. Derived instead from
the verdict + receipt + 4-layer primitives:

```
BAGEL RECORD = verdict with outcome FAILED, containing:
  attempt:      what was tried (Layer 1: verbatim Page 0 / request)
  expected:     what was supposed to happen (Layer 1/2, labeled)
  actual:       what happened, with evidence refs (Layer 3: receipts, measurements)
  inferred:     what Moor infers — labeled inference, revisable (Layer 2)
  survivors:    what inside the attempt retains value (components, methods,
                constraints discovered, tests, seeds) — THE NEW REQUIRED FIELD
  next_moves:   legitimate moves still available, ordered by cost — REQUIRED
  deltas:       what changed since, relevant to the actor's goal — REQUIRED
                where the actor is the owner/user in personal scope
  seed_ref:     Forevergreen seed planted, if the lesson generalizes (docked,
                not duplicated; seeds are the compounding path)
  scope:        visibility scope, carried from the underlying work's scope
```

**Provenance (extends the 4-layer chain):** attempted / expected / actual /
inferred / future-evidence are preserved **separately**. Old BAGELs are never
rewritten when new information arrives — interpretation updates are appended
as new Layer-2 entries; the historical event stands. This is H4
(history preserved, never silently rewritten) applied to failure.

**What is genuinely new in this schema:** `survivors`, `next_moves`, and
`deltas` as **required** fields, and `seed_ref` as the compounding dock.
Everything else is existing verdict machinery.

## 8. BOUNCE BACK mechanics

1. **Survivor extraction** distinguishes THE WHOLE ATTEMPT FAILED from
   EVERYTHING INSIDE WAS WORTHLESS. Survivors: disproven assumptions (these
   are information), reusable components, new constraints, better tests,
   Forevergreen seeds, improved discriminators.
2. **Next-move surfacing** answers "you still have a move": the remaining
   option space given what changed — never "try the identical thing again"
   by default.
3. **Contextual deltas**: at bounce-back time, surface what changed that
   matters to what this person is trying to do *right now* — new capabilities,
   newly live work, relevant blueprint changes. **Not changelog dumps.**
4. **Corrective-bounce self-erasure** (preserved): a miss that teaches routing
   reduces future misses; when deduction routes correctly automatically, the
   corrective bounce disappears. Memorializing self-erasing misses would be
   theater — BAGEL does not apply where the mechanism's success is its own
   disappearance.

## 9. The compounding ratchet (docked, not duplicated)

```
expensive failure → BAGEL → lesson → SAVE → detection moves upstream
→ same failure gets cheaper → prevented before expensive execution
```

- The ratchet's machinery is **Forevergreen Seeds** (seven species, "plant
  questions everywhere, grow evidence, funnel the hypotheses, promote only
  survivors"). BAGEL records plant seeds; they do not grow their own garden.
- **Honest status:** Seeds is draft/unsealed. Until it seals, compounding is
  the manual pattern that already works (AGENTS.md standing rules, MEMORY.md
  entries) — explicitly labeled manual, not invented as automatic.
- A repeated failure that teaches nothing new is evidence Moor failed to
  metabolize the previous BAGEL — this is itself a measurable signal (§22).

## 10. As above, so below

One semantic event — `attempt_outcome: failed` — across user blueprints,
internal builds, funnel attempts, experiments, Smile hypotheses, Forevergreen
trials, owner hypotheses, and Moor's own assumptions. **Presentation differs
by audience and layer; semantic honesty does not.** Moor does not BAGEL users
while hiding its own failures: the kernel, the queue, and Moor's own
assumptions are all in scope. The grass recurrence is the standing example of
why: the system's own failure to metabolize is itself BAGEL-able.

## 11. Privacy and scope (structural, not advisory)

- **The scope gate:** a BAGEL's visibility scope is **inherited from the
  underlying work's scope**, never widened by the failure. Public work →
  public BAGEL is legitimate. Private work → the BAGEL stays in the private
  scope. This is a structural rule: the recorder cannot promote visibility.
- **Never exposed:** private projects, personal information, private funnel
  evidence, confidential failures, security-sensitive material, health/
  financial context, hidden internals, anything the actor didn't authorize
  for the audience.
- **Consent:** "don't hide failure because it's uncomfortable" is a nudge
  within a scope, never a license to cross one. Where the actor hasn't
  authorized openness, the BAGEL exists privately or not at all — and "not
  at all" is legitimate for trivial misses (self-erasure).

## 12. Humor boundaries (where playfulness disappears)

BAGEL may be playful — the object of the joke is the failed attempt and the
absurdity of failure, never the worth of the person. **Playfulness disappears
entirely** for: security incidents, privacy breaches, safety-relevant
failures, financial loss, health context, failures with human downside
bearers in distress, and any failure the affected actor experiences as
non-trivial. In these scopes the record keeps the full philosophy (truth,
survivors, next moves) with **zero** playful presentation. The internal
boring name (`attempt_outcome: failed`) exists precisely so the machinery
never depends on the joke.

## 13. No humiliation engine; no fake gamification (mechanisms)

- **Forbidden:** failure leaderboards, humiliation mechanics, ridicule,
  status destruction, pile-ons, punitive social scoring, suffering-as-
  entertainment. **Mechanism:** BAGEL records carry no person-score, no
  counts aggregated per person, no public person-level failure tallies.
  Aggregation is per-attempt-type (for the ratchet), never per-person.
- **Forbidden:** incentivizing meaningless failures for points/badges/
  streaks/status/attention. **Mechanism:** there is nothing to earn. BAGELs
  confer no points, no badges, no streaks. What gets rewarded — by
  Forevergreen promotion, the only promotion path — is **valuable learning
  and progress**: survivors reused, seeds that mature into verified
  improvements. The reward attaches to the bounce-back, never to the bagel.

## 14. Fail early vs fail carelessly

FAIL EARLY / FAIL OPENLY / LEARN is not FAILURE IS ALWAYS GOOD.

- **Desirable:** bounded experiments — downside small and capped, learning or
  upside meaningful (Smile §30 positive asymmetry; build-queue scope limits).
- **Prevention territory:** where failure creates severe or unacceptable
  consequences, guardrails and prevention matter more than learning. The
  system must get better at distinguishing these cases over time — this
  discrimination is itself a Forevergreen seed species candidate.
- Negligent or repeatedly-avoidable failure is not "a bagel, how playful" —
  it is evidence the ratchet isn't firing, and the response is prevention,
  not celebration.

## 15. SMILE relationship (natural, not forced)

The mapping is genuine because Page 0's seven questions already are the
lenses applied to failure — used as an **interpretation aid**, never as
runtime machinery (lenses are canonical-conceptual per the owner override):

- **SAVE** — what should survive this attempt? (survivor extraction *is* the
  SAVE question)
- **MAKE** — what should be changed or created next? (the bounce-back move)
- **INVEST** — what lesson or infrastructure improves future attempts?
  (the ratchet; the seed)
- **LOVE** — who bears the downside, and how is failure handled humanely?
  (humor boundaries, no-humiliation, privacy scoping)
- **EXECUTE** — what legitimate next move is actually available? (you still
  have a move)

Deduplicate the outputs, not the perspectives: if the existing verdict
format already answers one of these, don't add a redundant section.

## 16. Override relationship

An override followed by a failed attempt produces a BAGEL — and the BAGEL
**must not retroactively declare the evaluator the winner**. Likewise an
override followed by success must not erase the evaluator's NO. The override
record (§7 format) and the BAGEL record coexist: reality generated additional
evidence; all states are preserved. This is "override the outcome, not the
record" applied to failure: **the failure is new information about the
decision, not a retroactive verdict on the disagreement.**

## 17. Wins and bagels

```
ATTEMPT → WIN → preserve gain → reusable value → raise the floor
        → BAGEL → preserve lesson → bounce back ─┘
                    → STRONGER STATE → NEXT ATTEMPT
```

**WINS ACCUMULATE CAPABILITY. BAGELS ACCUMULATE LEARNING. WASTE NEITHER.**
Capability memory owns the win side; BAGEL records + Forevergreen seeds own
the learning side. Same ratchet, two directions.

## 18. Cost model

| Operation | Cost | Rule |
|---|---|---|
| Recording `attempt_outcome: failed` on an existing verdict | ~free | Always; it's a field |
| Survivor/next-move extraction (template) | cheap (deterministic prompts over the record) | Required where BAGEL applies |
| Seed planting to Forevergreen | cheap | Only when the lesson generalizes |
| Model-assisted bounce-back (next-move reasoning) | expensive | Only when templates can't resolve AND the attempt was expensive |
| BAGEL ceremony for trivial/corrective misses | theater | Forbidden by the self-erasure rule |

Cost without evidence is theater (Smile §32). If survivor extraction doesn't
measurably shorten time-to-next-action or reduce repeat failures, it gets cut
to the bone: the field stays, the ceremony dies.

## 19. Measurement and falsifiability

**What would establish BAGEL helps Moor learn:**
- repeat-failure rate declines for failure types with BAGEL records vs
  without (the ratchet firing);
- time from failure to meaningful next action shortens;
- survivors get reused (seed_ref → verified capability promotion count);
- resumption after interruption improves (user understanding scores).

**What would kill the concept** (Page 0 demanded this):
- BAGEL records accumulate but repeat failures don't decline → the
  compounding claim is false; keep the vocabulary, kill the machinery claim.
- Survivor/next-move sections go unread/unused → cut to the minimal field;
  the ceremony dies.
- The vocabulary demonstrably discourages participation or trivializes
  serious failures → the branding dies (the boring internal name survives).
- Evidence that public BAGELs become shame/status signals despite §13 →
  public BAGEL becomes opt-in-only or dies.
- **The experiment that cannot kill is marketing.** These are the kill
  criteria; they are binding.

## 20. Failure modes (of BAGEL itself)

| # | Failure mode | Detection | Response |
|---|---|---|---|
| B1 | **Bagel theater** | Records exist; repeat-failure rate flat; sections unread | Cut ceremony to the field; keep truth-preservation |
| B2 | **Branding contamination** | Playful tone leaks into serious-failure scopes | Enforce §12; the boring name is the backstop |
| B3 | **Shame drift** | Person-level tallies appear; participation drops | §13 mechanisms were bypassed — audit and remove |
| B4 | **Gamification drift** | Bagels sought for status | No points exist by design; remove any that appear |
| B5 | **Privacy creep** | Scope widened by failure visibility | Structural scope inheritance (§11); treat as defect |
| B6 | **Ceremony creep** | BAGELs stamped on trivial misses | Self-erasure rule (§8.4); prune |
| B7 | **Lesson hoarding** | BAGELs recorded, never planted as seeds | Seed-planting rate is the metric; manual pattern until Seeds seals |
| B8 | **Retroactive scorekeeping** | BAGEL used to declare an old disagreement's winner | §16; the override record is the backstop |

## 21. Ideas rejected (anti-cargo-cult kills)

1. **The 12-field schema as a new event type.** Killed: derived from
   verdict+receipt+4-layer primitives instead; only survivors/next_moves/
   deltas/seed_ref are new, and they're fields, not a system.
2. **Mandatory BAGEL ceremony for every failure.** Killed: trivial and
   corrective misses self-erase; ceremony without function is theater.
3. **BAGEL as architecture vocabulary.** Killed: internal name stays boring
   (`attempt_outcome: failed`); BAGEL is UX vocabulary.
4. **A new learning subsystem.** Killed: Forevergreen/Sieve own compounding.
5. **Public BAGEL as default.** Reduced: legitimate within scope, never
   widened by the failure; consent is structural.
6. **Positivity theater.** Killed absolutely: failure may suck; the record
   says so when true.
7. **The cultural orientation list as law.** Reduced: guidance, each item
   qualified (§22); not canonized by fiat.
8. **BAGEL scoring / bagel counts as metrics of anything about a person.**
   Killed: metrics attach to failure *types* (ratchet) and to learning
   (seeds matured), never to people.
9. **Retroactive winner-declaration.** Killed: §16.
10. **The 🥯 mockup as spec.** Killed per Page 0: presentation designed
    appropriately per context, humor bounded by §12.

## 22. Cultural orientation (each item challenged; guidance, not law)

Page 0 listed eight orientations and demanded each be challenged. Disposition:

1. **Truth over face-saving** — ADOPT with qualifier: face-saving isn't
   always vice; dignity matters (§12, §13). Truth about the *attempt*,
   never at the cost of the *person*.
2. **Learning over concealment** — ADOPT, bounded by §11 (privacy).
   Concealment within authorized scope is legitimate.
3. **Continuation over catastrophizing** — ADOPT with qualifier: "when
   continuation is appropriate" (Page 0's own words). Sometimes stopping
   is the right move (§14).
4. **Evidence over rewritten history** — ADOPT as law: already invariant
   H4. No qualifier needed.
5. **Bounded experimentation over paralysis** — ADOPT: "bounded" does the
   work. Unbounded experimentation is §14's failure mode.
6. **Prevention where failure is unacceptable** — ADOPT as law: already a
   hard constraint (Smile §31.7).
7. **Opportunity over premature defeat** — ADOPT with qualifier: "premature"
   does the work; some defeats aren't premature.
8. **Accumulation over repeated rediscovery** — ADOPT with qualifier:
   accumulation has bookkeeping costs (Smile §39.8 flagged Layer 2/3
   collapse under volume). Accumulate what earns its keep — §19 metrics
   decide.

None is scripture. Each carries its qualifier structurally.

## 23. Open uncertainties

1. Does the vocabulary change behavior, or is it branding theater? (§19
   metrics decide; the dogfood says the naming is the weakest claim.)
2. Will Forevergreen Seeds seal, giving the ratchet real machinery? Until
   then compounding is manual — honestly labeled.
3. Can survivor/next-move extraction stay cheap at volume, or does it
   become ceremony? (Cost instrumentation decides — currently zero.)
4. Does public BAGEL encourage participation or chill it? (Participation
   metrics decide; §13 mechanisms are the guardrails.)
5. Where exactly does "trivial miss" end and "BAGEL-worthy attempt" begin?
   (Judgment call per scope; the self-erasure principle guides, no
   universal constant.)
6. Does the boring-internal-name / playful-UX split hold under real use,
   or does the branding contaminate the machinery? (§12 backstop.)

## 24. Recommendation on canonical status

**YES — for the reduced form only, conditionally.**

What earns canonical status:
(a) **The core law** — failure visible, honest, informative, not
automatically terminal — as architectural guidance.
(b) **The BAGEL record convention** — `attempt_outcome: failed` + required
survivors/next_moves/deltas fields + seed_ref dock — as a verdict-record
standard.
(c) **The bounce-back obligation** — the genuinely new behavioral
requirement: a recorded failure must make the next legitimate move easier
to discover.
(d) **The UX vocabulary "BAGEL"** — presentation layer, humor bounded by
§12, internal name boring.
(e) **The guardrails** — §11 (scope), §13 (no humiliation/gamification),
§14 (fail-carelessly distinction), §16 (no retroactive winners) — as
binding constraints on any BAGEL implementation.

What does NOT earn it: a new subsystem; a new receipt type; mandatory
ceremony; public-by-default; the cultural list as law; the mockup as spec;
any person-level failure metrics.

**Conditions:** (i) §19 metrics instrumented — the concept stays on probation
until repeat-failure and time-to-next-action move; (ii) compounding docks
with Seeds when it seals — no parallel infrastructure meanwhile;
(iii) any §20 failure mode triggers its stated response, including death
of the branding if §12 fails.

## 25. If YES — exact surviving canonical definition

```
BAGEL (canonical):
  - UX vocabulary for a honestly-recorded failed attempt.
  - Internally: attempt_outcome: failed on a verdict/ledger record.
  - Required record fields: attempt, expected, actual, inferred,
    survivors, next_moves, deltas (where user-facing), seed_ref, scope.
  - Provenance: 4-layer separation; historical event never rewritten.
  - Scope: visibility inherited from the underlying work; never widened.
  - Humor: bounded by audience/layer (§12); machinery uses the boring name.
  - Guardrails: no person-level metrics, no humiliation, no gamification,
    no retroactive winner-declaration, fail-carelessly distinction.

BOUNCE BACK (canonical):
  - The continuation obligation: survivors extracted, learning saved
    (seed planted where generalizable), next legitimate move surfaced
    with contextual deltas.
  - Corrective misses self-erase; ceremony for them is forbidden.
  - Wins and bagels both feed the ratchet: capability vs learning.

Non-canonical (explicitly excluded):
  five mandatory anything · new subsystem · new receipt type · BAGEL as
  architecture vocabulary · public-by-default · cultural list as law ·
  person-level failure metrics · positivity theater · the mockup as spec.
```

---

# SHOW

## D1 — Attempt → BAGEL → BOUNCE BACK

```
                    ATTEMPT
                       │
                 DID IT LAND?
                  /         \
                YES           NO
                 │             │
                 │      ┌─────────────┐
                 │      │    BAGEL    │  ← honest, visible
                 │      │ this attempt│    zero remains zero
                 │      │ did not land│
                 │      └──────┬──────┘
                 │             │
                 │      preserve evidence (verdict+receipt, 4-layer)
                 │             │
                 │      extract survivors (SAVE: what keeps value)
                 │             │
                 │      plant seed → Forevergreen (INVEST: the ratchet)
                 │             │
                 │      surface next moves + deltas (MAKE/EXECUTE:
                 │             │   legitimate moves, cheaper to find)
                 │      BOUNCE BACK
                 │             │
                 └──────┬──────┘
                        ▼
                 STRONGER NEXT STATE
```

## D2 — The compounding ratchet (docked with Forevergreen)

```
expensive failure
      │ BAGEL (record: attempt/expected/actual/inferred)
      ▼
   lesson ──SAVE──► seed planted (Forevergreen species)
      │                │ repetition + evidence
      ▼                ▼
  detection moves upstream ──► cheaper failure ──► prevented
      │
      └─► if the same failure recurs with no new lesson:
          THE RATCHET DIDN'T FIRE — itself a BAGEL-able signal
```

## D3 — As above, so below (one semantic event, many presentations)

```
  user blueprint fails ──┐
  internal build fails ──┤
  funnel attempt fails ──┤──► attempt_outcome: failed ──► BAGEL record
  experiment flops ──────┤         (one semantic event)
  owner hypothesis dies ─┤
  Moor's assumption dies ┘
         │
    ┌────┴───────────────────────────────┐
    │ presentation differs by audience:  │
    │  public page → BAGEL card 🥯       │
    │  serious scope → plain record      │
    │  internal log → attempt_outcome    │
    │  semantic honesty: identical       │
    └────────────────────────────────────┘
```

---

*Collapse what you must to move. Preserve what you can so you can learn.
Deduplicate the outputs, not the perspectives. Override the outcome, not
the record. Wins improve the starting line. Bagels should too.*
