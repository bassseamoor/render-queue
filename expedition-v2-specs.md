# Funnel Expedition v2 — Specifications

**From TRUE Page 0** (Sebastian verbatim, 2026-10-07)
**Funnel receipt:** `c0450bb4696739c5`
**Page 0 hash:** `6a576dd951428d1e...`
**Status:** Built, tested, live

---

## What It Is

The 256² Funnel Expedition: one request generates 65,536 structured investigations, concentrated through an 8-round tournament into one champion Blueprint.

Not voting. Not averaging. Not summarizing. A tournament.

---

## Architecture

### Page 0 — Immutable

- Sebastian's verbatim 460-line specification, frozen at load
- SHA-256 hashed, `Object.freeze()` applied
- Every Funnel seat receives the exact text — never summarized, never paraphrased
- Singleton: one Page 0 per expedition run

### Generation One — 256 Seats

- 256 Funnel seats, all with identical Page 0
- Procedurally generated investigative purposes from Page 0's semantic structure
- 26 dimensions from Page 0: intent-fidelity, obligations, negative-requirements, corrections-supersession, reuse, architecture, implementation, UX, visual-design, spatial-design, performance, verification, failure-modes, adversarial-attack, minority-interpretations, radical-alternatives, minimal-alternatives, evidence, historical-machinery, authority, maintainability, accessibility, cost, unintended-consequences, falsification, opportunities-nobody-asked-about
- Each seat knows: exact Page 0, parent (null), lineage ([]), purpose, inherited evidence (none), explicit vs inferred

### Generation Two — 256 × N

- Each Gen-1 parent generates its own child society
- Parent result determines child investigative topology
- Full scale: 256 × 256 = 65,536
- Default run: 256 × 8 = 2,048 (configurable)

### Resource Intelligence

- Instantiation is cheap (deterministic FunnelSeat objects)
- Expensive work (LM calls, searches, tools) only on information gain
- `escalate(reason)` method for on-demand escalation
- 256 available ≠ 256 expensive calls

### Functional Reconvergence

- Analyzes unresolved composition across all seats
- Outputs actual percentages by dimension
- 256-seat topology stays constant, purpose distribution changes

### Tournament — 8 Rounds

- 256 finalists → 128 → 64 → 32 → 16 → 8 → 4 → 2 → 1
- 255 Match Funnels, 255 battles
- Each match: which candidate is stronger realization of Page 0?

### Defeat + Inherit

- Winner STEALS from loser (not blind merge)
- Inventory loser's unique: evidence, discoveries, mechanisms, verification strategies, minority insights
- Inherit only what strengthens without: violating Page 0, weakening evidence, introducing contradiction, smuggling assumptions, semantic drift, importing the defect
- Losers archived permanently: match, opponent, reason, contributions, lineage, provenance
- 255 archived per run

### Authority

- Only canonical Funnel law produces final authority
- Not democracy — 256 votes don't create intent
- Generated Funnels investigate, Match Funnels discriminate
- Tournament survival strengthens lineage

---

## Verification Chain

Per Page 0: `PAGE 0 → FUNNEL → BLUEPRINT → BUILD → RUNTIME → VERIFIER → REPLAY → RECEIPT`

---

## Test Run (2026-10-07)

- Gen-1: 256 seats
- Gen-2: 2,048 (256 × 8)
- Tournament: 8 rounds, 255 battles
- Champion: `08f3e0f8` (8 victories)
- Archived: 255 losers
- Verdict: CHAMPION SELECTED FROM TRUE PAGE 0

---

## Files

- Engine: https://bassseamoor.github.io/render-queue/funnel-expedition.js
- True Page 0: https://bassseamoor.github.io/render-queue/PAGE0-VERBATIM.txt
- Pulse: comp-expedition (83 tools)

---

## v1 → v2

v1 was built from a summarized Page 0. Sebastian rejected it: "That did not come out of my fucking funnel."

v2 was rebuilt from his verbatim 460-line specification through canonical funnel law (receipt `c0450bb4696739c5`).
