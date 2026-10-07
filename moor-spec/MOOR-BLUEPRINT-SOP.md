# MOOR Blueprint SOP

Version: 1.1  
Authority: Sebastian Moore (PL)  
Active Funnel authority: v44-sealed

The Funnel is the operating procedure. A blueprint is not merely a plan; it is the evidence-backed path from raw intent to a buildable, verifiable result.

## 1. Chain of command

### Platoon Leader — Sebastian Moore

Decision maker. Holds responsibility for the standard, gate waivers, and changes to this SOP.

### Chiefs — lead agents

Own the mission end to end: plan, delegate, verify, integrate, and report. A chief does not convert confidence into authority.

### Workers

Execute a scoped task with clear inputs, outputs, done criteria, repository base, ownership, and handoff. When the plan breaks, report upward rather than silently expanding scope.

## 2. Five recursive planning layers

### L1 — Intent

Input: raw idea/request/problem.  
Output: one-breath promise, stakes, SELL draft.

Gate: would a stranger understand why this should exist?

### L2 — Structure

Input: L1 intent.  
Output: parts, build order, interfaces, SPEC skeleton.

Gate: can every part be named and its role stated?

### L3 — Detail

Input: L2 structure.  
Output: per-part build detail, done state, acceptance criteria, non-goals, full SPEC.

Gate: could a competent builder execute without side conversations?

### L4 — Show

Input: L3 detail.  
Output: visible design/experience quality appropriate to the requested medium.

Gate: does the craft show, and does the requested path remain usable?

### L5 — Verify

Input: L4 implementation/rendered result.  
Output: sealed BUILD/FAIL verdict.

All relevant gates must pass. A failed gate recurses to the failing layer rather than being waived by worker confidence.

## 3. Automatic enforcement

- No valid sealed Funnel verdict → no authorized build.
- Verification checks intent and requested-path behavior, not only bytes or syntax.
- Existing verified machinery should be reused before new machinery is invented.
- Failed gates produce durable evidence.

## 4. Discipline

- Never ship on a failed required gate.
- Never waive a gate below PL authority.
- Never overwrite Page 0.
- Never silently substitute a named mechanism.
- Never freelance outside the released worker scope.
- Never merge stale work over newer canonical state.
- Never let visualization/documentation masquerade as implementation evidence.

## 5. Owner observability

Material work should emit append-only Dev Feed events at meaningful state changes. Repository activity, Funnel receipts, CI, maintenance state, release ledgers, and Pulse registration remain independent evidence sources.

Technical completion and owner visibility are distinct.

## 6. Response discipline

Reporting is part of the SOP.

A worker may only claim the highest state independent evidence proves:

**requested → funneled → implemented → verified → merged → Pulse-registered → owner-visible → deployed/live**

Every material completion response names:

1. what changed;
2. highest evidence-backed state;
3. canonical destination;
4. verification evidence;
5. remaining gaps or explicit non-claims.

Do not collapse these states:

- file exists ≠ in Pulse;
- PR open ≠ merged;
- merged ≠ deployed;
- documented ≠ implemented;
- implemented ≠ wired;
- wired ≠ verified;
- verified ≠ owner-visible;
- owner-visible ≠ production-ready.

If an earlier response exceeded the evidence, preserve the historical claim, state what evidence actually existed then, and append the correction. Do not rewrite history.

Machine-readable response contract: `/worker-response-sop.json`.  
Human response reference: `/docs/WORKER_RESPONSE_SOP.md`.

## 7. Parallel worker rule

Workers operate from recorded repository state and explicit scope. Stale bases, undeclared overlaps, scope creep, duplicate invention, green-tests-wrong-design, retry loops, and orphan artifacts are process failures to detect and record.

Planning alone does not spawn workers. Integration and verification remain distinct from builder execution.

## 8. Response examples

Implemented only:

> Implemented on branch `x`. Not yet verified or merged.

Verified PR:

> Implemented and CI-verified in PR #N. It is not merged yet.

Merged but not Pulse:

> Merged to `render-queue/main` at SHA. It is not registered in Pulse.

Pulse-registered:

> Merged and registered in Pulse. Live deployment was not independently checked.

Owner-visible:

> Merged, Pulse-registered, and owner-visible at the named component. CI passed. No additional live-backend/deployment claim is being made.

