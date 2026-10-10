# BLUEPRINT v1 — Governed Commission Dispatcher and Run Coordinator

**RID:** `funnel-dispatcher-coordinator-2026-10-09`
**Page 0:** `~/workspace/funnel/page0/dispatcher-coordinator-page0.md` (sha256 `fedb3aeb5…`)
**Status:** blueprint v1 — the mandatory checkpoint. Producing or reviewing this authorizes nothing.
**Hard boundary:** no execution, no shipping, no push from this blueprint without the owner's explicit go for the identified act + the applicable valid permit. Shipping needs both, always.

---

## SELL

**The promise, in one breath:** a commission submitted in the Dev room can never again become a dead letter. It is filed verbatim, admitted or explicitly refused, dispatched exactly once, carried by a coordinator that survives restarts — and you watch all of it without ever touching the machinery.

**The stakes.** Tonight proved the gap is real: a commission was filed and nothing moved until someone asked "is the funnel going to build it by itself?" The Funnel is machinery — it doesn't notice commissions, doesn't dispatch itself, doesn't own continuation. Every submission until now has depended on a human remembering to operate it. Without this layer, the beautiful loop from the sister commission (Dev Room → Request → Result) has nothing underneath it: visible pipelines with no persistent coordinator behind them. With it, filing *means* running — governed, exactly-once, resumable, and honest about every stop.

**The click.** You submit Commission B while Commission A is mid-run. Both stay distinct — their own identities, their own histories, their own questions. A restarts the machine; nothing duplicates, nothing is lost, nothing silently advances. A question needs *your* authority: one clear request appears, showing why you're asked, what decision it needs, and what that decision would and would not authorize. You answer; the *same* run continues. That continuity — the run remembering itself across interruptions — is the whole product.

---

## SPEC

### Parts list

| # | Part | Role |
|---|------|------|
| P1 | Registry `~/workspace/funnel/dispatch/registry.jsonl` | THE durable commission+run record. Append-only, hash-chained (same envelope discipline as the decisions store). Carries the 11 explicit states. The chronicle is untouched — no new classes. |
| P2 | Dispatcher `~/workspace/build-pipeline/commission_dispatch.py` | `file_commission` (verbatim Page 0 → FILED) · `admit` (validate → ADMITTED / REFUSED with reason) · `dispatch` (exactly-once → RUNNING) · `recover` (restart → resume or explicit WAITING/BLOCKED). No judgment authority. |
| P3 | Coordinator stage machine (same module) | `transition(run, stage, evidence_refs)` — records only actual transitions through the legitimate stages; `stop_clean(run, missing)` — WAITING/BLOCKED with the missing condition stated; `resume(run)` — same run continues on satisfaction. |
| P4 | Judgment router (same module) | `classify(question)` → one of 7 classes; `issue_question` → `honest_boundary` record in `decisions/<rid>.jsonl`; `record_answer` → `interpretation` record citing the question id, attributed, admitted only through governance gates. Silence/ambiguity/absence never equals authorization. |
| P5 | Publisher extension (run 1's `publish_request_loop.py`) | Reads the registry for QUEUE / LIVE RUNS / JUDGMENT INBOX / CHECKPOINTS; keeps page0/verdicts/receipts for REQUESTS / RESULTS. |
| P6 | Dev-room sections (run 1's patch, +3) | `#queue-sec`, `#judge-sec`, `#check-sec` alongside `#req-sec`/`#live-sec`/`#res-sec`. Same section convention, same fetch pattern, same honest empty states. |
| P7 | Proof battery | 18 items + acceptance test, each with a named script/artifact. |

### Identities

- **Commission identity** = the RID itself (`funnel-<slug>-<date>`), unique by construction.
- **Run identity** = `<rid>#run-<n>`, n starting at 1. A re-dispatch after failure creates `run-2` — lineage preserved, never rewritten.

### The 11 states (the commission's words, the registry's vocabulary)

`FILED → ADMITTED → DISPATCHED → RUNNING → WAITING → BLOCKED → REFUSED → FAILED → CHECKPOINT → COMPLETE → SHIPPED`

Transitions are recorded, never inferred. A commission is COMPLETE only when its determination is proven; SHIPPED only after explicit go + valid permit (never in this build).

### Admission (validate through existing boundaries)

1. Page 0 exists, non-empty, verbatim words present.
2. RID well-formed (`funnel-…-YYYY-MM-DD`); if the RID already has a `commission_filed` record → return the existing record (idempotent, no duplicate).
3. Requester is the owner (standing doctrine: commissions come from Sebastian).
4. Restraint scan: the submission must not order a push/release/outward act on its own authority — if it does, admit the *build* but flag shipping as requiring go+permit (admission is not shipping authorization).

Refusal is explicit: `REFUSED` + reason, visible in REQUESTS. Never silently dropped.

### Exactly-once dispatch

`dispatch(rid)`: if a `run_dispatched` record exists for the commission → return the existing run identity (no second run). Else create `<rid>#run-1`, record `DISPATCHED → RUNNING`. Retries, restarts, and re-observation all funnel through this check.

### Coordinator stages (legitimate, in order, only actual transitions recorded)

`references → distillation → settlement → obligation-discovery → decision-formation → replay → verdict → receipt/authorization → blueprint → execution-packet → build → verification → proof → sealing → result-projection`

`transition()` requires evidence refs (files under `~/workspace` or `/tmp`); a stage with no evidence cannot be recorded. `replay`: any recorded transition can be re-executed from its inputs — outputs must match, or the lineage is flagged.

### Judgment routing (7 classes, classification grants nothing)

`procedurally-determinable · authorized-intelligence-judgment · owner-judgment · owner-authority · unavailable-capability · insufficient-evidence · governance-or-safety-refusal`

- Authorized intelligence: smallest sufficient question → authorized path → question+response preserved → admitted through governance gates → returned to the originating run → same run continues.
- Owner: one clear Dev-room request showing *why*, *what decision*, *what it would and would not authorize* → response preserved as first-class history → continue only within granted authority.
- Missing capability/executor/permit/authority → honest visible stop (`WAITING`/`BLOCKED` + exactly what's missing).

### Blueprint checkpoint (the 12 items, shown before execution)

Original commission · distilled purpose · applicable constraints · proposed architecture · planned artifacts · required capabilities and executors · judgment history · unresolved questions · acceptance tests · verification plan · authority required for execution · authority required for shipping.

### Build steps

1. **Registry + envelope.** `registry.jsonl` with seq/at/type/payload/authority/prev_hash/hash; `verify_chain()`. Done-state: chain verifies over seed records.
2. **Dispatcher core.** `file_commission`, `admit`, `dispatch`, idempotency checks. Done-state: filing twice → one record; dispatching twice → one run.
3. **Coordinator machine.** `transition`, `stop_clean`, `resume`, stage vocabulary. Done-state: a transition without evidence refs is rejected loudly.
4. **Judgment router.** `classify`, `issue_question`, `record_answer` with the silence≠authorization gate. Done-state: an unattributed answer is rejected; an owner-authority question cannot be answered by the coordinator.
5. **Recovery.** `recover()` re-reads the registry; resumes or marks WAITING/BLOCKED with reason. Done-state: kill-and-restart test → same run, no duplicate, no rewritten history.
6. **Proof battery.** 18 items, each with artifact. Done-state: all pass, listed in the verdict.
7. **Wire to run 1.** Registry feeds run 1's publisher; three new dev-room sections. Done-state: the demo commission's full lifecycle visible in the room.

### Interfaces

- In: Dev-room submission (words) → `file_commission(words, rid)` → `registry.jsonl` (FILED).
- `admit(rid)` → ADMITTED/REFUSED. `dispatch(rid)` → `<rid>#run-1` (RUNNING).
- `transition(run, stage, evidence)` / `stop_clean(run, missing)` / `resume(run)`.
- `issue_question(run, text)` → `decisions/<rid>.jsonl` (`honest_boundary`); `record_answer(qid, text, authority)` → `interpretation`.
- Out: registry → publisher → Dev room (QUEUE / LIVE RUNS / JUDGMENT INBOX / CHECKPOINTS).

### Acceptance

The commission's acceptance test, executed with Commissions A (demo), B, C: distinct identities; exactly-once runs; authorized-intelligence question routed and answered with continuation; owner-authority question asked clearly, nothing advancing until answered, same run continuing within granted authority; blueprint checkpoint shown; nothing ships; result opens without repository paths. Plus restart-recovery and refusal-path proofs.

### Non-goals

- The dispatcher has no judgment authority; the coordinator manufactures no authority; the Funnel is not turned into an agent.
- No chronicle changes. No bypasses (funnel, verifier, receipt, permit gates all stand).
- Blueprint/build/ship authorizations stay three separate acts.
- No push, no release, no outward communication — in this build or any other without go+permit.

---

## SHOW

### The dead letter, before and after

```
 BEFORE:   Dev room words ──▶ Page 0 file ──▶ (silence) ──▶ "is the funnel
                                                 going to build it by itself?"

 AFTER:    Dev room words ──▶ FILED ──▶ ADMITTED ──▶ DISPATCHED ──▶ RUNNING
                                │           │             │
                          verbatim     explicit      exactly once
                          Page 0       or REFUSED    <rid>#run-1
```

### One run's lineage (never rewritten, resumable)

```
 <rid>#run-1
  ├─ commission_filed      (verbatim Page 0, sha256)
  ├─ admission_decided     (ADMITTED, gates checked)
  ├─ run_dispatched        (exactly-once)
  ├─ transition × N        (stage + evidence refs only)
  ├─ question_issued       (honest_boundary, 1 of 7 classes)
  ├─ answer_recorded       (interpretation, attributed)
  ├─ checkpoint            (blueprint v1, the 12 items)
  ├─ transition × N        (build → verification → proof → sealing)
  └─ run_completed         (determination + receipt + result refs)
```

Restart anywhere in the middle: `recover()` re-reads this lineage and either resumes the same run or marks it WAITING/BLOCKED with the reason stated. History is append-only — a resumed run never rewrites its past.

### The states, explicit

```
 FILED ──▶ ADMITTED ──▶ DISPATCHED ──▶ RUNNING ──▶ CHECKPOINT ──▶ COMPLETE
    │           │              │             ├─▶ WAITING (missing stated)
    │           │              │             └─▶ BLOCKED (missing stated)
    │           └─▶ REFUSED (reason, visible — never silent)
    └─▶ (duplicate filing → existing record returned, no second commission)
```

### Verification views

Proof-battery artifacts (replay logs, restart-recovery diffs, refusal records, headless walkthrough screenshots) attach to the sealed verdict as the true-geometry record. SwiftShader proves function, not beauty — his iPhone is final visual QA.

---

## Versioning

v1 — the mandatory checkpoint. Build to this version; any change → new version. This blueprint authorizes nothing beyond its own review.
