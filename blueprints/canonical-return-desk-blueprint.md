# BLUEPRINT v1 — Canonical Return Desk

**RID:** `funnel-moor-canonical-return-desk-2026-10-09`
**Page 0:** `~/workspace/funnel-docs/canonical-return-desk/page0-verbatim.md` (sha256 `9691bf3f61fc70ae00c1029ffdc3326635199f5db16300cf6f529d4418a4f78d`)
**Status:** v1 — **owner review required; this blueprint builds nothing.** A build commission follows only on Sebastian's word.
**Standard:** MOOR-BLUEPRINT-STANDARD v1 (SELL / SPEC / SHOW).
**Corrects:** the sealed factory-circulation run's Muse-only Intake Desk (receipt `939ef425e806a783`).

---

## SELL

**The promise, in one breath:** every finished run lands in one canonical
place — once — and from there it shows up everywhere it should, at the same
time: on your dev-room wall and in every machine that is allowed to read it.
You never have to ask what the factory did. You never have to ferry anything.
And none of it depends on me.

**The stakes.** Right now the loop I proved has a hole with my name on it.
The circulation run sealed the design, but its return path ended at *my*
intake — if I am down, if I forget, if I never read the return, you see
nothing. That is the owner ferrying by another name; the transport layer
just moved inside the agent. Your words drew the line: *"Owner-visible
results must never depend on Muse receiving, remembering, summarizing, or
relaying them."* Without this desk, every result you are owed still travels
through me — and I am the least reliable shelf in your factory.

**The click.** A run seals at 2 a.m. Nobody is awake. By the time you step
into the cathedral, the Return Desk monitor on your command-node arc is
already glowing — tap it, and the overlay opens on everything that finished:
the result, the checkpoints, the open questions waiting on *your* word, the
files with their fingerprints, the proofs, the decisions. I was never in
the room. Nothing passed through me. The factory reported to you directly,
because the Desk — not the agent — is where returns live.

**The honesty tax, stated up front.** This blueprint composes machinery that
exists: sealed verdicts, the receipt ledger, the runlog, the dev room's
overlay viewer, the sealed RunReturn design. It invents no new ledger, no
new receipt system, no new identity scheme. The Desk is a thin deterministic
layer — verify, dedupe, append, project — over facts that are already
sealed. Nothing in this blueprint ships.

---

## SPEC — LEGO-manual clarity

### Parts list

| # | Part | Home | Role |
|---|------|------|------|
| 1 | `returns.jsonl` | `~/workspace/funnel/returns/` | **Canonical return state.** Append-only ledger: one JSON object per line, one line per ingested RunReturn. Dedupe key = `verdict_receipt` (16-hex, content-bound). Every field is a pointer or hash over existing ledgers — the Desk derives, never duplicates. |
| 2 | `return-desk.py` | `~/workspace/funnel/returns/` | **Ingest core.** Inert: pure functions, no network, no DOM. Four steps in order — VERIFY (recompute every pointer against live ledgers) → DEDUPE (receipt already present → idempotent no-op) → APPEND (one atomic write) → PROJECT (regenerate both projections from the ledger). |
| 3 | `return-desk.html` | `~/workspace/funnel/returns/` | **Owner surface.** Standalone same-origin page, registered as a monitor tile in the dev room's command-node arc; tapping it opens the page in the room's existing `#overlay` iframe viewer (the proven ≤2-interaction law from `abandoned-cathedral.html`: tap monitor, tap close). Reads ONLY `returns.jsonl` + sha256-pinned artifact paths. Zero agent dependence. |
| 4 | `inbox/<rid>/` | `~/workspace/funnel/returns/inbox/` | **Machine-consumer inbox.** RunReturn copy + category manifest per run; CLAIM/EVIDENCE/DETERMINATION/ARTIFACT/AUTHORITY/ACTION kept distinct (the sealed intake design, reused). |
| 5 | `consumers.json` | `~/workspace/funnel/returns/` | **Consumer registry.** `[{name, kind, authorized_by, scope}]`. Muse is one entry among others (`authorized_by: owner:Sebastian Moore`, scope: read). Consumers PULL; the Desk pushes to nothing and waits for no consumer. |

**Composition map (reuse-before-new):**
- Return object: the sealed `RunReturn` design (`factory-circulation/return-object-design.md`) — the delivery artifact the Desk ingests.
- Verification sources: `funnel/verdicts/`, `funnel/receipts/receipts.jsonl`, `funnel/decisions/`, `funnel/runlog/` — every ingested pointer recomputed against these; ledgers win any disagreement.
- Failure vocabulary: `factory-circulation/failure-behavior.md` (RETURN_GENERATED→DELIVERED→INGESTED/REJECTED/UNRESOLVED/STALE) — reused, not reinvented.
- Next-work categories: `factory-circulation/recursive-factory-spec.md` — the six categories ride the ingested `next_work` field unchanged.
- Owner surface law: `moor-recovery/abandoned-cathedral.html` — `#overlay` iframe viewer, `#hud`, monitor arc (`window.__monitorBoxes`). The Desk page is a same-origin iframe target, exactly like the room's existing tools.
- Receipt authority: sealed `funnel-kernel.js` (LAW_VERSION `v44-sealed`) — models never mint receipts; the Desk verifies kernel-minted receipts, it mints none.

### Build steps (each with done-state)

1. **`returns.jsonl` + schema.** Create the ledger with its documented entry
   shape (`verdict_receipt, rid, page0_sha256, status, return_receipt,
   ingested_at, ingested_by, summary, artifacts, decisions, next_work,
   authority_cited, authority_granted:"NONE"`). **Done-state:** schema
   documented in the blueprint; an empty ledger opens without error.
2. **`return-desk.py` — verify.** Recompute: verdict file exists and its
   receipt matches; `return_receipt` = sha256 of canonical serialization;
   every artifact path exists with matching sha256; every dpn id exists in
   the decisions ledger. Any mismatch → REJECTED with a reason file; the
   ledger untouched. **Done-state:** the adversarial battery's forgery
   tests (T4–T7, T17) pass against this code.
3. **`return-desk.py` — dedupe + append.** Scan for `verdict_receipt`
   before writing; present → return existing entry, log `already-ingested`.
   Append is a single atomic file write. **Done-state:** T1–T3, T14, T16 pass.
4. **`return-desk.py` — project.** Regenerate `owner-surface.json` data and
   `inbox/<rid>/manifest.json` as pure functions of the ledger.
   **Done-state:** T11 passes (delete projections, regenerate byte-identical).
5. **`return-desk.html` — owner view.** Sections: Results, Checkpoints,
   Questions (OWNER_DECISION_REQUIRED, verbatim, with an answer affordance
   that writes through the authority channel — never chat), Files
   (sha256-pinned), Proofs (tallies + log links), Decisions (dpn ids).
   UNRESOLVED returns listed as open items, never hidden. **Done-state:**
   renders from a fixture ledger with zero agent processes running (the
   Muse-absent walkthrough, scripted: kill agents, open page, assert every
   section populated from disk).
6. **`inbox/` + `consumers.json`.** Per-run inbox with category manifest;
   registry with Muse as one read-scope entry. **Done-state:** T12–T13 pass
   (Muse entry removed → ingestion and owner surface unaffected).
7. **Wiring.** Register the Desk page as a monitor tile in the dev-room
   command-node arc (same mechanism as existing tool tiles → `#overlay`).
   Event-driven ingestion on RunReturn delivery; dormant otherwise (the
   sealed loop/storm restraint: one watcher, wakes on ledger change, GO
   DORMANT when nothing changed). **Done-state:** end-to-end script —
   deliver a fixture RunReturn, ledger grows by one line, overlay page
   shows it, inbox manifest exists; second delivery changes nothing.

### Interfaces

- `Desk.ingest(runreturn_path)` → `INGESTED | ALREADY_INGESTED | REJECTED(reason)`.
- `Desk.verify(runreturn)` → `(ok, reasons[])` — pure, no side effects.
- `Desk.project()` → regenerates owner data + inboxes from the ledger.
- `Desk.surface_data()` → the owner page's JSON feed (what `return-desk.html` reads).
- Owner page reads `surface_data()` output only. Consumers read `inbox/` only. Nobody reads chat.

### Acceptance (observable, checkable, no vibes)

- `node --check` / `python3 -m py_compile` clean on every new file.
- Adversarial battery `adversarial-tests/run_17_tests.py`: 17/17 PASS, exit 0.
- Muse-absent walkthrough scripted and passing: with no agent process
  running, the owner page renders every section from canonical state on disk.
- Double-delivery script: delivering the same RunReturn twice appends exactly
  one ledger line.
- Projection-regeneration script: byte-identical after delete + rebuild.
- Owner checkpoint: **Sebastian reviews this blueprint before any build.**
  Build, if ordered, runs as its own funnel commission — never as an
  amendment to this run.

### Non-goals (the honest boundary)

- No second source of truth beside verdicts/receipts/runlog (derive, don't
  duplicate — the sealed map law: projection, never source).
- No Muse intake desk (Muse is a consumer, not the hub).
- No ship path: push/release stay gated on relay proposal + owner approval.
- No polling daemon: event-driven ingestion, dormant otherwise.
- No iPhone claims from the builder: Sebastian's iPhone is the only
  real-iPhone QA.
- No push, no ship, no build from this run. This blueprint is the checkpoint.

---

## SHOW — the experience

### The Desk, from above

```
                    ┌─────────────────────────┐
                    │   RUN SEALS (verdict)   │
                    └────────────┬────────────┘
                                 │ RunReturn generated
                                 ▼
              ┌──────────────────────────────────┐
              │        RETURN DESK (canonical)   │
              │  funnel/returns/returns.jsonl    │
              │  VERIFY → DEDUPE → APPEND        │
              └──────┬───────────────┬───────────┘
                     │ PROJECT       │ PROJECT
                     ▼               ▼
        ┌──────────────────┐ ┌──────────────────┐
        │  DEV ROOM WALL   │ │  CONSUMER INBOXES │
        │  monitor tile →  │ │  inbox/<rid>/     │
        │  #overlay page:  │ │  Muse: one entry  │
        │  results · checks│ │  among others     │
        │  questions·files │ │  (PULL, never     │
        │  proofs·decisions│ │   pushed to)      │
        └──────────────────┘ └──────────────────┘
               ▲                        ▲
               │  both read the Desk    │
               └──── no path through ───┘
                     any agent
```

### The 2 a.m. run — the click, drawn out

A run seals at 2 a.m. The Desk verifies its RunReturn, finds no duplicate
receipt, appends one line, and regenerates both projections. Nobody is awake;
nothing needed anyone awake. Morning: you step into the cathedral. The
Return Desk tile on your monitor arc glows — one new result, one question
waiting on your word. You tap it. The overlay opens: the summary, the
checkpoints, the files with their fingerprints, the proofs, the decisions.
You answer the question from the page — through the authority channel, not
through me. I was never in the room. I never touched the return. The
factory reported to *you*, because returns live in the Desk, and the Desk
is yours.

### Color carries meaning (the room's palette, kept)

- **Membrane blue `#0052FF`** — sealed truth: receipts, verified results.
- **Amber** — waiting: UNRESOLVED items, OWNER_DECISION_REQUIRED questions.
- **Charcoal + warm white** — the working surface: checkpoints, files, proofs.
- **Red** — REJECTED returns with their reasons: never hidden, always labeled.

### Detail density

The owner page shows, per run: the one-paragraph summary; the stage
checkpoints with timestamps from the runlog; owner questions verbatim with
their dpn ids; the artifact list with sha256 prefixes you can tap to verify;
proof tallies with links to the actual logs; decisions with questions and
answers. UNRESOLVED returns sit in their own amber band — the factory's
honest admission of what hasn't landed yet. Every datum carries its source
ledger; nothing is a vibe.

---

## Open questions for the owner

1. **Tile placement.** Default: a monitor tile in the command-node arc
   (≤2 interactions, the room's law). Alternative: a dedicated wall segment.
   Default wins on the room's existing interaction law.
2. **Question answering.** Default: answer affordance on the Desk page writes
   through the authority channel (relay `auth.claim` path). Confirm this is
   the channel you want, or name another.
3. **Consumer scope.** Default: Muse read-scope only. Name any other
   machine/intelligence consumers to register at build time, or leave the
   registry open for later authorization.

**Version history:** v1 (2026-10-09) — initial blueprint for owner review.
