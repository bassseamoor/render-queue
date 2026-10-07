# MOOR Authority Coverage Rule

Status: doctrine (not code). Funnel receipt d4cb285546a0f10d (2026-10-07).

## Purpose

MOOR already carries authority across transitions in several artifacts (Funnel receipts,
WorkOrders/travelers, SliceRelease, WorkerJob, the `MOOR:AUTO-RELEASE` class marker).
What was missing was a written rule for when existing owner authority covers a newly
derived action. This document is that rule. It creates no new authority object and
changes no invariant.

## The rule

Before continuing without a fresh owner decision, establish ALL of the following.
If any check fails or is genuinely uncertain, that is a new authorization event:
ask Sebastian with the concrete consequence, not an abstract policy question.

1. **Same objective.** The next action is derived from the same immutable Page 0 /
   owner objective that the existing authority was granted under.
2. **Semantic scope.** The action is inside the previously authorized semantic scope
   (the spec, Blueprint, or slice the owner approved).
3. **Write/interface/resource scope.** The action stays inside the authorized
   ownership: repository base, owned files/interfaces, budget, and granted
   capabilities. (WorkerReservation already enforces this mechanically.)
4. **Risk/effect class.** The action is inside the allowed risk and effect class —
   no new irreversible, governance, security, or financial commitments.
5. **Freshness.** Dependencies are valid and state is non-stale (repository base
   matches; no stale reservation; no invalidated assumption).
6. **No substitution.** The action is not an unapproved substitution of a
   Page-0 obligation. (Replay already enforces this mechanically.)
7. **Bounded.** The action remains within explicit done/stop criteria, rework
   allowances, and budgets.
8. **No new authority minted.** Models do not mint receipts; planning does not
   spawn workers; Blueprint sophistication does not authorize implementation.
   Only Funnel law (kernel verdict) or an explicit owner act creates authority.

## What this composes

- `moor.funnel-receipt` — single-execution authority (request + Page 0 + plan + spec + destination + done criteria).
- `moor.factory-workorder` / travelers — one receipt authorizing a route
  (funnel → harness → verifier) including bounded rework (`allowed_rework_loops`).
- `moor.slice-release` (`automatic_execution:false`, `owner_approval` required) and
  `moor.worker-job` (cannot expand beyond release scope).
- `MOOR:AUTO-RELEASE` marker — the production precedent for class-level
  pre-authorization (eligible PRs; governance paths excluded).

## Explicitly not covered

- Movement from one independently gated Blueprint slice to the next
  (`automatic_next_slice:false`; choreography requires an explicit owner/Funnel
  decision per slice) — this remains a policy decision for Sebastian.
- Planning-layer worker spawning (`moor-agent.json`) — planning proposes
  (authoring packets, release proposals, job packets); the kernel or an explicit
  owner act authorizes; an executor instantiates.
- Anything the eight checks above do not clearly pass.

## Relation to law

This rule is a reading aid over existing law, not law itself. Where it conflicts
with `funnel-kernel.js` (v44-sealed), `moor-agent.json`, or a sealed Blueprint,
those win. If the rule itself ever blocks clearly-authorized work, the rule is
what gets re-funneled — not the work.
