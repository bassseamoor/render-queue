# BLUEPRINT: Doctrine-Stack Integration into Moor OS

**Version:** 1.0 (design only — sealed blueprint, zero production code)
**Date:** 2026-10-08
**Page 0 (verbatim, hash-bound):** `~/workspace/funnel-docs/doctrine-integration-page0.md` — page0_hash `0f759866d0d17731`
**Funnel receipts (verifyReceipt: true):** F1 intake `d35005a11629eb54` · F2 design `a7d23073cebf4bc3`
**Governing records:** layered-override ADR (`~/workspace/funnel/verdicts/layered-override-authority-v1.md`); Smile override (`~/workspace/funnel/verdicts/smile-override-v1.md`); BAGEL verdict+blueprint (`~/workspace/funnel/verdicts/bagel-v1.md`, `~/workspace/funnel/blueprints/bagel-blueprint-v1.md`); incorporation doctrine (`~/workspace/doctrine/incorporation-doctrine.md`); attention/retention amendment (`~/workspace/doctrine/attention-retention-amendment.md`).

---

# SELL

## The promise

Tonight Moor learned how to think — disagreement preserved instead of resolved, failure converted to information, attention separated from retention, philosophy made into structure. None of that survives unless it lives where Moor's agents actually read: the repository. This blueprint puts the entire doctrine stack into Moor OS in the smallest correct form — versioned markdown, loaded by the convention Moor already uses, updatable through the self-installing update path, with every item given its rightful form (mechanism, doctrine text, commentary, or explicit exclusion) and nothing force-fit.

## The stakes

Doctrine that lives only in a chat is a rumor. Doctrine that lives only in one assistant's memory files dies with the session. The owner said "everything in this chat is supposed to be built in" — the risk is building it in the wrong form: turning philosophy into machinery (cargo cult), turning machinery into philosophy (theater), or forking the sealed records into a second copy that drifts. This blueprint maps each item to exactly one home.

## The click

A year from now, a Moor agent opens the repo, reads the doctrine corpus in the canon order, and reasons the way tonight reasoned — not because anyone pasted a chat log into its prompt, but because the structure carries the lesson.

## The law

**Form follows function.** Every doctrine item gets the smallest form that actually changes behavior: mechanism where behavior must be enforced, doctrine text where judgment must be guided, commentary where understanding must be preserved, exclusion where fit is absent. "Built in" never means "built as machinery."

---

# SPEC

## 1. Purpose

Integrate the 2026-10-08 doctrine stack — incorporation doctrine, attention/retention amendment, layered-override authority, SMILE canonical lenses, BAGEL→BOUNCE BACK, derive-room model, hunger ratchet, MARK THIS wall contract, and the chat's philosophical context — into Moor OS (the product Sebastian develops) so that every Moor agent and every Moor surface can load, apply, and evolve it through Moor's real mechanisms.

## 2. Origin and provenance

- Owner directive 2026-10-08: "everything in this chat is supposed to be built in" (scope expansion on the original "add all this into my operating system" request).
- Source material: the verbatim doctrine files in `~/workspace/doctrine/`; the three sealed funnel verdicts and two sealed blueprints listed above; the owner's own words from the 2026-10-08 session (philosophy of AI, "collapse what you must to move…", derive-room crystallizations).
- This blueprint does not re-decide anything already sealed. It places sealed decisions and judges the placement form of unsealed material.

## 3. Non-goals

- No production code, no repo writes, no prompt-pipeline construction. Blueprint only.
- Does not authorize the Dev Room wall build (separate work package; §13).
- Does not re-run the SMILE, BAGEL, or override funnels. Their verdicts stand.
- Does not edit `moor-prompt-v44.md` (Sebastian revises by hand; §10 proposes the reference for his hand).
- Does not create a runtime prompt-assembly system. Moor has none; building one would be new machinery (see §4 archaeology).

## 4. Archaeology: how doctrine actually loads in Moor OS (inspected, not assumed)

Investigated read-only via `~/workspace/moor-main` (clean snapshot). Findings:

1. **There is no prompt pipeline.** No `doctrine/` directory exists. No system-prompt files, prompt templates, brief templates, or context-injection code exist anywhere in moor-main. `apps/launcher-cli` is a bridge HTTP server + Chief ledger reader + publisher; `apps/web` contains no LLM-call code. Moor is harness + UI; models are user connections. **Doctrine loads purely by file convention: agents read the repo.**
2. **Root `AGENTS.md` is the primary doctrine loader.** It declares itself "the default implementation contract for Codex and other coding agents working in this repository" and defines a canon order for underspecified requirements: (1) current user request, (2) durable decisions in `docs/implementation/DECISIONS.md`, (3) implementation doctrine in `docs/implementation/README.md` + linked files, (4) foundational product canon (`docs/principles/JOE_SHMO_PRINCIPLE.md`, `docs/local-first-doctrine.md`, `docs/consumer-producer-model.md`), (5) architecture boundaries, (6) existing patterns.
3. **`docs/implementation/COMPOUNDING_CONTEXT.md`** is the precedent for visible operating guidance: "They work when the next worker reads this repository." It specifies a compact startup packet (~1,500 tokens, budget heuristic) and labels statements as user decision / observed result / hypothesis / unverified.
4. **Anchor system** (`docs/anchors/`): persistent records of meaningful agent work; `CURRENT.md` + `history/` chain. Required fields include durable lessons and next action.
5. **Worker briefing** (protocol v1.0.0): briefing = attach the portable protocol markdown + a bounded task contract + repo-state reads. Not prompt injection.
6. **Doctrine-like content** currently lives as flat files: `docs/ai-deterministic-platform-doctrine.md`, `docs/creator-versioning-doctrine.md`, `docs/local-first-doctrine.md`.

**Consequence:** the integration mechanism is versioned markdown in the repo, registered in the AGENTS.md canon order, loaded by agents reading the repo and by briefs attaching the minimum needed. Any design requiring a runtime prompt pipeline is rejected as foreign machinery.

## 5. The integration set — per-item disposition

The funnel judges each item's correct FORM. Dispositions: **MECHANISM** (behavior-enforcing structure), **DOCTRINE** (guidance text in the corpus), **COMMENTARY** (preserved understanding, not normative), **REFERENCE** (pointer to sealed record), **EXCLUDED** (explicitly not placed, with reason), **SEPARATE BUILD** (own blueprint required).

### 5.1 Incorporation doctrine §§1–6, 9 — DOCTRINE

Listen-before-model (observed/inferred/assumed separation), the bounce-back loop, generate-the-incantation, move-variables-deliberately/externalize-into-structure, signal-not-spam, breakthrough-vs-ordinary-progress, preserve-agency. These are universal agent reasoning disciplines, not personal style. Placed as doctrine text in the corpus (`agent-doctrine.md`), adapted from second-person ("you") to agent-neutral voice. The substance is unchanged.

### 5.2 Attention/retention amendment — DOCTRINE + MECHANISM requirements

The amendment's guidance half (do not delete noise early; relevance evolves; study attention as feedback; bounce back from relevance errors; do not silence generative friction) is DOCTRINE. Its structural half is MECHANISM requirements on any Moor surface that presents agent activity: primary/secondary information layers (compress the view, preserve the evidence); raw history preserved subject to privacy/retention controls (never pre-filtered to "important" only); secondary-signal replay on new evidence; the verify cases A–E as acceptance criteria. These requirements constrain future surface builds; they do not themselves build a surface.

### 5.3 MARK THIS payload schema + wall lineage (§§7–8) — DOCTRINE (interface contract)

The panel structure (TITLE / INSCRIPTION / WHY IT MATTERS / ORIGIN / IMPLICATION / STATUS / CONNECTIONS) and the compounding lineage rules (connect / refine / absorb / contradict / supersede, never silently erase) are placed as the **interface contract** for the future wall build (`mark-this-contract.md`). This is a spec, not an implementation. Until the wall exists, the operator handles MARK THIS manually per this contract (ready-to-persist payloads).

### 5.4 Design laws (§10 make-the-philosophy-physics; §9 preserve-agency) — DOCTRINE

Placed as design law in the corpus (`design-laws.md`). These govern how Moor experiences are built: embody principles in environment/interface; make the good path obvious without hiding alternatives. Enforced through the existing Blueprint SOP review gates, not through new machinery.

### 5.5 Layered-override ADR — REFERENCE (already placed)

The ADR is already sealed as standalone platform law. This blueprint does not move it. The corpus carries a **reference** (path + receipt fingerprints `c65583a155ace39c` / `3e84d4187d872469` + the short-form law) so agents find it through the canon order. The override record format (§7 of the ADR) is MECHANISM wherever Moor surfaces present evaluations that can be overridden (funnel verdicts, build queue) — no new enforcement service (the ADR already forbids it).

### 5.6 SMILE five canonical lenses — DOCTRINE (vocabulary, not machinery)

Per the sealed owner override: the five lenses are canonical CONCEPTUAL lenses. Placed as vocabulary + the unlabeled lens pattern ("generate questions from multiple directions before deciding") as agent guidance, plus the INVEST+LOVE special status (deduction checklists for compounding/reuse framing and stakeholder/downside analysis — the LOVE checklist already exists as a fallback component). The seven exclusions (mandatory LLM calls, mandatory stages, numerical hunger, smile scoring, rigid categories, seed questions, diagrams as immutable truth) are restated as exclusions. **Explicitly not five runtime stages.**

### 5.7 BAGEL→BOUNCE BACK (reduced form) — REFERENCE + DOCTRINE

The sealed verdict already fixed the canonical form. The corpus carries the reduced definition (boring internal `attempt_outcome: failed`; required survivors/next_moves/deltas/seed_ref fields; bounce-back obligation; guardrails; humor boundaries) with provenance to the sealed blueprint/verdict (receipts `e7048a4a9458ffcf` / `b389b4f25171fa29`). UX vocabulary "BAGEL" is presentation-layer. Nothing re-decided here.

### 5.8 Derive-room model — DOCTRINE (pattern)

Placed as a reasoning pattern: perspectives enter one room (existing Funnel reasoning + lenses + retrieved context) → candidate deductions → deduplicate conclusions downstream → Funnel. Agreement, disagreement, and novelty are all information. Explicitly not five implementations.

### 5.9 Hunger ratchet + hunger corollary — DOCTRINE

The ratchet (ordinal incumbent-vs-challenger protocol; floor only moves up; "working creates the floor, hunger raises it") is the sealed mechanism design, implementation-gated as the Smile blueprint specifies. The corollary ("take inexpensive wins in perspective now, earn the right to optimize later") is prioritization guidance. Both doctrine text; the ratchet's machinery gate is unchanged.

### 5.10 "Collapse what you must to move, preserve what you can so you can learn" — DOCTRINE

Placed as the philosophical name of the override law — the WHY behind the ADR's mechanical "override the outcome, not the record." Doctrine text, not a new rule. It earns its place because it is the most compressed true statement of the architecture, and compressed true statements are what agents actually load.

### 5.11 "Deduplicate the outputs, not the perspectives" — DOCTRINE

Placed alongside the derive-room pattern as its one-line form. Same justification as §5.10.

### 5.12 "You still have a move" / "wins accumulate capability, bagels accumulate learning, waste neither" — DOCTRINE

The UX expression of the bounce-back obligation and the two-direction ratchet restatement. Doctrine text; the ratchet machinery belongs to Forevergreen/Sieve per the BAGEL verdict's docking.

### 5.13 Founder philosophy of AI (yes-machine/no-machine, leaving behind, open echo, nature mirror) — COMMENTARY

**Explicitly not architecture.** Preserved as the founder's words with provenance (2026-10-08 session), in the corpus as cultural context. Its operationalizable parts are already captured elsewhere and are not duplicated: "leaving behind for the next guy" is the accumulation ratchet; "open echo vs closed-loop echo" is disagreement preservation + the derive room. The philosophy itself is not law — the anti-scripture chain forbids canonizing it, and tonight's own discipline ("do not turn the thinker into scripture") applies to the founder too.

### 5.14 Quantum analogy — COMMENTARY ONLY (explicit architectural NO)

**The analogy does not enter the OS as a principle, pattern, or vocabulary.** Its valid content — "don't destroy knowledge to make a decision; don't collapse the possibility space earlier than necessary" — is already the override law (§5.5) and the attention/retention amendment (§5.2). Importing the analogy would add a second name for existing law plus a live misreading hazard (future agents/users taking "quantum-flavored" as a technical claim — the exact failure the chat's own discipline section was written to prevent). It may appear in explanatory prose as a gloss, never in normative text. This is the funnel's clearest "right idea, wrong home" judgment.

### 5.15 Dev Room wall as an OS feature — SEPARATE BUILD

The wall (persistent panels as environmental objects, external cognition) is a real feature requiring its own Page 0, funnel run, and Standard-compliant blueprint per the standing rule that every funnel mechanism needs a proper name and SELL/SPEC/SHOW blueprint. This blueprint carries only its interface contract (§5.3). **The wall is not authorized by this blueprint.**

### 5.16 Sealed funnel artifacts (verdicts, blueprints, receipts, ledgers) — REFERENCE, never embed

The artifacts stay in `~/workspace/funnel/` (and their future canonical home, wherever the owner places the funnel's evidence store). The OS corpus **references** them by path + receipt fingerprint + date; it never copies them wholesale. Rationale: the funnel is the promotion path and the evidence store; embedding copies into the OS repo forks the record and the copies drift. Where an agent needs a definition at brief-time, the corpus inlines the definition with a provenance pointer (§6), which is quotation with citation, not a fork.

### 5.17 Operator-personal notes — EXCLUDED from OS (stay with the operator)

The conversational style guidance addressed to the current operator ("speak once, watch what moves," the governing incantation as personal mantra) stays in the operator's notes. Its substance is already in the OS via §§5.1–5.2 (act → read response → update is the bounce-back loop). The blueprint is explicit about this split so a future reader doesn't mistake personal working notes for platform law.

## 6. Canonical placement: the doctrine corpus

**Location:** new directory `docs/doctrine/` in the Moor repo (bassseamoor/MOOR), containing:

- `INDEX.md` — the corpus map: every doctrine item, its disposition (mechanism / doctrine / commentary / reference), its status (canonical / guidance / commentary / probation), its provenance (source record + receipt where sealed), and what is explicitly excluded.
- `agent-doctrine.md` — §§5.1, 5.2 (guidance half), 5.6, 5.8, 5.9, 5.10, 5.11, 5.12: the reasoning disciplines, attention/retention guidance, SMILE vocabulary, derive-room pattern, hunger, the compressed laws. Agent-neutral voice.
- `design-laws.md` — §§5.4, 5.2 (mechanism requirements for activity surfaces, incl. verify cases A–E).
- `mark-this-contract.md` — §5.3: payload schema + lineage rules (interface contract for the future wall build).
- `platform-law-refs.md` — §§5.5, 5.7: pointers to the sealed ADR, override record, SMILE override, BAGEL verdict/blueprint (paths + receipt fingerprints + one-line holdings).
- `commentary.md` — §§5.13, 5.14: founder philosophy and the quantum analogy, labeled COMMENTARY with the explicit architectural NO on the analogy.

**Why a directory, not flat files:** the existing flat `docs/*-doctrine.md` files are single-topic; this corpus is cross-cutting, needs an index with per-item status/provenance, and will grow by promotion (funnel verdicts), not by accretion. The INDEX is the anti-drift mechanism.

**Registration:** one addition to root `AGENTS.md`'s canon order — the doctrine corpus (`docs/doctrine/INDEX.md`) is consulted for agent-conduct and design-law questions, sitting alongside the existing implementation doctrine entry. This is the entire loading mechanism: agents read the repo.

## 7. How doctrine reaches agents (no new machinery)

1. **Repo-read convention** (primary): agents read `docs/doctrine/INDEX.md` via the AGENTS.md canon order — the same way COMPOUNDING_CONTEXT.md works today ("they work when the next worker reads this repository").
2. **Brief-time attachment** (secondary): coordinators attach the minimum needed doctrine to a worker brief (worker-protocol pattern: portable markdown + bounded task contract). The generate-the-incantation principle (§5.1) governs brief composition — smallest effective instruction for THIS state, not the whole corpus.
3. **Startup packet budget**: the COMPOUNDING_CONTEXT ~1,500-token budget heuristic applies; doctrine is not dumped wholesale into every context.
4. **What is NOT built:** no prompt assembler, no injection pipeline, no doctrine service. The archaeology (§4) proves there is nothing to hook into; constructing one would be foreign machinery serving the doctrine instead of the doctrine serving the system.

## 8. Doctrine update propagation (self-installing)

1. Doctrine changes are **content changes** in the repo: edit the corpus file, update INDEX.md status/provenance.
2. Substantive changes (new law, status promotion, exclusion reversal) travel the **promotion path**: funnel run → sealed verdict → corpus update. The ADR's influence-vs-authority rule (§6 of the ADR) governs.
3. Distribution rides the **existing self-installing update mechanism**: the corpus ships inside the versioned bundle; the updater delivers it; the user never manually refreshes (standing rule).
4. **Private update branch rule (binding):** doctrine lands on the private update branch first and stays there until the owner authorizes live release. The blueprint does not name the branch (branch topology is the owner's); it binds the rule: no doctrine ships to live without explicit owner authorization.
5. Rollback is content rollback: the previous corpus version is the previous bundle version. No special machinery.

## 9. Cost model

Near-zero runtime cost: markdown files, no new services, no new stages, no prompt pipeline. The cost is editorial: keeping INDEX.md honest (status/provenance per item), which is bounded and reviewable. The expensive items (wall build, Seeds compounding) are explicitly NOT authorized here.

## 10. Funnel prompt reference (proposed, not applied)

`moor-prompt-v44.md` is revised by Sebastian's hand. This blueprint proposes — for his hand, not by automation — adding one reference line in the funnel prompt's doctrine section pointing at `docs/doctrine/INDEX.md`, so funnel runs load the corpus the same way. The blueprint does not edit the file.

## 11. Measurement and falsifiability

- The corpus earns its keep if agents' briefs and designs visibly apply it (spot-checkable in anchors and verdicts); it fails if it becomes unread reference ballast (measured by: does any agent cite it unprompted within 30 days of landing?).
- Kill conditions: (a) the corpus duplicates the sealed records instead of referencing them (fork detected → cut back to pointers); (b) the quantum analogy or founder philosophy migrates into normative text (scripture drift → revert to commentary); (c) agents stop reading it because the startup budget can't fit it (→ compress, don't expand).
- The §5.14 NO is itself falsifiable: if a future sealed verdict demonstrates the analogy does architectural work the override law doesn't, the NO can be overridden through the legitimate mechanism — not by drift.

## 12. Ideas rejected (anti-cargo-cult kills)

- A runtime prompt-assembly/injection pipeline for doctrine. Nothing to hook into; would be new machinery.
- A doctrine service or API. File convention already loads doctrine.
- Embedding the sealed funnel records into the OS repo. Reference, never embed (§5.16).
- The quantum analogy as architecture (§5.14). Commentary only.
- Founder philosophy as law (§5.13). Commentary only; anti-scripture applies to the founder too.
- Authorizing the Dev Room wall build inside this blueprint (§5.15). Separate funnel required.
- Auto-editing `moor-prompt-v44.md` (§10). His hand only.
- Turning "everything built in" into "everything built as machinery." The owner's intent is honored by giving each item its rightful form, not by mechanizing philosophy.

## 13. Open uncertainties

1. Whether agents will actually read a new corpus directory or whether it needs a stronger pull (e.g., brief-time attachment becoming the primary path in practice).
2. The exact private-branch topology for doctrine updates (owner's call at build time).
3. Whether `docs/doctrine/` or the existing flat `docs/*-doctrine.md` convention wins on review — the blueprint recommends the directory for indexability; the owner may flatten.
4. Whether the MARK THIS contract is sufficient for the future wall build or needs a second funnel pass at build time (likely yes — this is an interface contract, not a wall blueprint).
5. The 30-day citation check (§11) needs someone to actually run it.

## 14. Recommendation on canonical status

**YES — for the corpus as placed, with the dispositions in §5.** What earns canonical status: the corpus location and INDEX discipline (§6), the loading mechanism (§7), the update propagation rules (§8), the per-item dispositions (§5) including the explicit NOs (§§5.14, 5.17) and the separate-build boundary (§5.15). What does not: the wall build, a prompt pipeline, embedded copies of sealed records, the analogy or philosophy as law.

---

# SHOW

## D1 — Where doctrine lives and how it loads

```
OWNER / SEALED RECORDS                    MOOR OS REPO (bassseamoor/MOOR)
~/workspace/funnel/verdicts/*.md         docs/doctrine/
~/workspace/funnel/blueprints/*.md  ──┐       ├── INDEX.md  (map: item → form → status → provenance)
~/workspace/doctrine/*.md         ──┤       ├── agent-doctrine.md
                                          │       ├── design-laws.md
                                          │       ├── mark-this-contract.md
                                     quot └────── ├── platform-law-refs.md
                                     with         └── commentary.md
                                   citation             │
                                                        │ registered in
                                                        ▼
                                              root AGENTS.md canon order
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        ▼                               ▼                               ▼
              agents read the repo            briefs attach the minimum            funnel prompt (v44+)
              (primary path)                  (generate-the-incantation)           references INDEX
                                                                                 (owner's hand)
```

## D2 — Per-item disposition map

```
15 items in
    │
    ├─ MECHANISM (enforcing structure) ── override record format (where evaluations are overridden)
    │                                     attention/retention surface requirements (verify A–E)
    │                                     MARK THIS contract (interface for future wall build)
    ├─ DOCTRINE (guidance text) ────────── agent reasoning disciplines (§§1–6, 9)
    │                                     SMILE vocabulary · derive-room pattern · hunger
    │                                     compressed laws ("collapse what you must…",
    │                                                      "deduplicate the outputs…")
    ├─ REFERENCE (pointer, never embed) ── override ADR · SMILE override · BAGEL verdict/blueprint
    │                                     sealed funnel artifacts stay in ~/workspace/funnel/
    ├─ COMMENTARY (preserved, not law) ─── founder AI philosophy · quantum analogy (arch. NO)
    ├─ SEPARATE BUILD ──────────────────── Dev Room wall (own Page 0 + funnel + blueprint)
    └─ EXCLUDED from OS ────────────────── operator-personal style notes (stay with operator)
```

## D3 — Doctrine update propagation (self-installing, private-first)

```
edit corpus ──► INDEX.md updated ──► substantive? ──YES──► funnel run ──► sealed verdict ──► corpus
   (content          (status/                                │
    change)          provenance)                            NO
                                                            │
                                                            ▼
                                              private update branch ──► owner authorizes ──► live
                                              (self-installing bundle; user never manually refreshes)
```
