# MOOR Worker Response SOP

This SOP exists because MOOR now has enough parallel chats, workers, branches, receipts, trackers and repositories that prose like “done” or “pushed to Pulse” can become misleading even when the underlying work is useful.

The rule is simple:

> **A worker may only claim the highest state that independent evidence proves.**

This is a reporting contract, not a new authority system. Funnel, Harness, verifier, Git, CI, release ledgers and runtime evidence keep their existing authority.

## Status ladder

| State | Required evidence | Safe response |
| --- | --- | --- |
| Requested | Page 0/request exists | “Captured / entered Funnel.” |
| Funneled | valid sealed Funnel receipt/replay | “Funneled / authorized for execution.” |
| Implemented | executable artifact exists on current branch/location | “Implemented on branch.” |
| Verified | requested-path verification actually passed | “Verified; tests/CI passed.” |
| Merged | canonical target branch contains merge SHA | “Merged to main.” |
| Pulse-registered | current main contains Pulse registry + manifest + rebuild preservation + artifact | “Registered in Pulse.” |
| Owner-visible | Sebastian can find/open the named destination and follow evidence | “Owner-visible.” |
| Deployed/live | actual runtime/deployment path independently checked | “Live / deployed.” |

Do not skip words in this ladder merely because the work will probably reach the next state.

## Response law

Every material completion response should answer five things:

1. **What changed.**
2. **Highest evidence-backed state.**
3. **Canonical destination.**
4. **Verification evidence.**
5. **Remaining gaps / explicit non-claims.**

“Done” is allowed only as a convenience after those facts make the scope unambiguous.

## Forbidden shortcuts

- File in repo ≠ pushed to Pulse.
- PR open ≠ merged.
- Merged ≠ deployed.
- Unit test exists ≠ verified.
- Pulse registry entry ≠ live Pages/runtime verified.
- Documented ≠ implemented.
- Implemented ≠ wired.
- Wired ≠ verified.
- Verified ≠ owner-visible.
- Owner-visible ≠ production-ready.

## Parallel-worker reporting

Workers should emit append-only Dev Feed events under `dev-feed/events/` at meaningful transitions. Those events are observations. GitHub, Funnel receipts, CI, release ledgers, maintenance state and Pulse registration remain independent evidence.

A worker response must not upgrade a state merely because the worker created the event.

## Correction rule

If an earlier worker response exceeded the evidence:

1. preserve the original historical claim;
2. record what evidence actually existed at that time;
3. state the corrected claim;
4. if the gap was later repaired, append the repair as a later event.

Do not rewrite history to make the worker look cleaner.

Machine-readable contract: `worker-response-sop.json`.
