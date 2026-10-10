# BLUEPRINT v1 — Dev Room → Request → Result: the human operating loop

**RID:** `funnel-devroom-request-result-2026-10-09`
**Page 0:** `~/workspace/funnel/page0/devroom-request-result-page0.md` (sha256 `4a3c71a4…`)
**Status:** blueprint v1 — build to this version.
**Amendment (pre-build, 2026-10-09):** composition with the dispatcher commission
(`funnel-dispatcher-coordinator-2026-10-09`, settled by funnel decision
`dpn_37a55a0acad0bd5d`). Six surfaces, not three: REQUESTS / QUEUE /
LIVE PIPELINES / JUDGMENT INBOX / CHECKPOINTS / RESULTS, fed by six JSONs
(`requests.json`, `queue.json`, `live-runs.json`, `judgment-inbox.json`,
`checkpoints.json`, `results.json`). The dispatch registry
(`funnel/dispatch/registry.jsonl`) is the canonical source for QUEUE /
LIVE RUNS / JUDGMENT INBOX / CHECKPOINTS; page0/verdicts/receipts stay the
sources for REQUESTS / RESULTS. "LIVE PIPELINES" (this commission's frozen
words) is the same surface as the dispatcher commission's "LIVE RUNS".
**Non-goal up front:** no push ships from this blueprint without the owner's explicit word + a relay PERMIT naming Sebastian. This blueprint builds; it does not release.

---

## SELL

**The promise, in one breath:** you say "Build X." in your Dev room, and you watch it move — captured, frozen, funneled, questioned, answered, built, verified, sealed — until the result sits somewhere obvious and you open it and have the thing.

**The stakes.** Tonight the machinery is rigorous and invisible. Every commission lives in files only the agent can see; you have to ask "did it file? where did it go? what is it waiting for?" — which is exactly why operating it feels insane. Without this loop, every future commission repeats tonight: you, staring at a factory with no front desk. With it, the Funnel becomes something you *watch* instead of something you have to *believe*. Requests stay requests, results stay results, and nothing about the governance underneath gets weaker to make the surface convenient.

**The click.** Picture it: you open the Dev room on your phone. Three sections — REQUESTS, LIVE PIPELINES, RESULTS. You tap a live pipeline. Eleven stages, the completed ones lit, the current one breathing. Beneath it: what went in, what came out, what's blocked, the one question waiting for a judgment — and the question has your name on it, or it doesn't, and either way the pipe keeps moving after it's answered. That tap — from "mysterious machinery" to "I can see exactly where my request is" — is the whole product.

---

## SPEC

### Parts list

| # | Part | Role |
|---|------|------|
| P1 | Publisher `~/workspace/build-pipeline/publish_request_loop.py` | Scans canonical state, emits six JSONs: `queues/requests.json`, `queues/queue.json`, `queues/live-runs.json`, `queues/judgment-inbox.json`, `queues/checkpoints.json`, `queues/results.json`. Re-run on every state change. |
| P2 | Dev-room surfaces `#req-sec` / `#queue-sec` / `#live-sec` / `#judge-sec` / `#check-sec` / `#res-sec` | Six sections inside `#funnel-ov` after `#pipe-sec`, following the exact `#<x>-sec` convention. Fetch the six JSONs from the `funnel-queue` branch via the Contents API (the `pipePull` pattern verbatim). 404 → honest "not published yet". |
| P3 | Judgment records `decisions/<rid>.jsonl` | Open questions recorded as kind `honest_boundary`; answers as kind `interpretation`, attributed, with the question's decision id in `source_refs`. Hash-chained. No new classes, no new kinds. |
| P4 | Stage vocabulary (11, his words) | `request-received → page0-frozen → references-gathered → distilling → obligations-identified → judgment-requested → decisions-finalized → building → verification → sealing → complete`. Each stage derived from a real artifact; never invented. |
| P5 | Proof harness | Synthetic labeled demo Page 0 → real `run.py funnel` kernel run → publisher → headless acceptance walkthrough (desktop + phone viewport), `node --check`, screenshots. |

### Canonical state (the only sources the surfaces may project)

1. `funnel/page0/*.md` — filed requests.
2. `funnel/verdicts/*.md` + `funnel/receipts/receipts.jsonl` — results, determinations, receipts.
3. `funnel/runs/*` + `funnel/decisions/*.jsonl` — stage history, questions, judgments.

Unknown or absent renders as *not recorded* — never invented, never interpolated.

### Stage derivation (honest mapping, artifact → stage)

- `request-received`: page0 file exists.
- `page0-frozen`: page0 sha256 recorded (runs f1 `page0_hash`).
- `references-gathered`: distillation decisions with `source_refs` exist.
- `distilling`: `obligation_framing` decision recorded.
- `obligations-identified`: obligations list finalized (runs f1 `obligations_list`).
- `judgment-requested`: unanswered `honest_boundary` record exists.
- `decisions-finalized`: every open question has an answering `interpretation`.
- `building`: run artifacts (f1) exist.
- `verification`: verifier evidence recorded (f2 `receipt_valid`).
- `sealing`: receipt minted + mirrored to `receipts.jsonl`.
- `complete`: sealed verdict file exists containing `VERDICT SEALED`.

### Build steps

1. **Publisher.** Write `publish_request_loop.py`: scan page0/verdicts/receipts/runs/decisions; emit the three JSONs to a local staging dir. Done-state: JSONs validate, every field traces to a source file, empty states honest.
2. **Demo Page 0.** Write labeled synthetic Page 0 (`funnel-demo-request-loop-20261009`, DEMO-marked, zero production impact). Done-state: file exists, rid distinct from all real commissions.
3. **Demo judgment.** Record one `honest_boundary` + one answering `interpretation` in `decisions/funnel-demo-request-loop-20261009.jsonl`; verify the chain. Done-state: `verify_chain` true.
4. **Demo funnel run.** Craft payloads (`distill_spec_draft`, `verdict`, `obligation_evidence` keyed by kernel obligation ids); run `run.py funnel`; receipts mirrored. Done-state: f1/f2 JSONs exist, `receipt_valid` true, fingerprints in `receipts.jsonl`.
5. **Publisher run.** Run the publisher; the three JSONs include the demo. Done-state: demo rid present in `live-pipelines.json` with honestly derived stages.
6. **Dev-room patch.** Surgical string-replace on current HEAD (`156d6c5d782f3c401e4eb151d499aec215a63185`): insert `#req-sec`, `#live-sec`, `#res-sec` + JS (`reqPull/reqRender`, `livePull/liveRender`, `resPull/resRender`) + auto-pull in `openPanel('funnel-ov')`. Aesthetic: existing tokens only (`#00D4FF`, `#0a0e14`, panel chrome, ≥44px targets, 640px breakpoint). Done-state: `diff` shows only the intended insertions.
7. **Static checks.** `node --check` on every script block of the patched file. Done-state: all pass.
8. **Headless acceptance.** Playwright + Chromium/SwiftShader, API fetches intercepted to the local JSONs: open funnel overlay → REQUESTS lists the demo → LIVE PIPELINES shows its stages → open pipeline → stage inspector → RESULTS lists the sealed demo → open result → full record. Desktop 1280×800 and phone 390×844 (touch). Done-state: zero `pageerror`, zero console errors, non-blank renders, screenshots captured.
9. **Verdict + receipt.** Write `funnel/verdicts/devroom-request-result-v1.md` in the sealed format; receipt = sha256-16 content-bound; mirror via `receipt_registry`. Done-state: `VERDICT SEALED` present, fingerprint in `receipts.jsonl`.

### Interfaces

- Publisher in: `page0/*.md`, `verdicts/*.md`, `receipts.jsonl`, `runs/*`, `decisions/*.jsonl`. Out: three JSONs (schema: `{rid, title, stage|status, detail, refs{...}, updated_at}`).
- Dev room in: three JSONs via `https://api.github.com/repos/bassseamoor/render-queue/contents/queues/<name>.json?ref=funnel-queue` (base64-decoded, same as `pipePull`). Out: rendered sections; question answers route through the existing queue-for-Buster path, labeled as routed — the page never writes canonical state directly.
- Judgments in: a question the run cannot determine procedurally. Out: `honest_boundary` record → answer → `interpretation` record citing it → run continues.

### Acceptance (the commission's test, observable)

"Build X." → request visible in REQUESTS → LIVE PIPELINES shows entry + stage progression → judgment obtained or asked → answered → run continues → build/verify/seal → result obvious in RESULTS → opened → the thing (full underlying record). Proven on desktop and phone viewports, hostile input handled (parser fails safe — verbatim freeze preserves uncertainty; nothing invented).

### Non-goals

- No push, no release, no outward communication in this build.
- No natural-language parser — verbatim-minimal capture; the parser is the still-open mobile-intake commission's work and lands later without changing this loop.
- No new chronicle event classes or decision kinds.
- No backend: static page + published JSON. "Live" = freshest published canonical state, timestamp-labeled.
- No redesign: fix in place, existing aesthetic tokens only.
- The composer does not file commissions by itself — filing stays a governed act; the UI labels queued vs filed vs running vs sealed honestly.

---

## SHOW

### The loop (what the owner experiences)

```
 ┌─────────────────────────────────────────────────────────┐
 │ DEV ROOM                                                │
 │                                                         │
 │   "Build X."  ── ordinary words, nothing else needed    │
 └──────┬──────────────────────────────────────────────────┘
        ▼
 ┌──────────────┐   ┌──────────────┐   ┌───────────────────┐
 │   REQUESTS   │──▶│ LIVE PIPELINE│──▶│     RESULTS       │
 │ what I asked │   │ 11 stages,   │   │ the thing, with   │
 │              │   │ what/when/   │   │ its whole record  │
 │              │   │ blocked/why  │   │                   │
 └──────────────┘   └──────┬───────┘   └───────────────────┘
                           │ ▲
              ┌────────────┘ └────────────┐
              ▼                          │
   ┌─────────────────────┐   ┌────────────────────────┐
   │ JUDGMENT NEEDED?    │   │ answer recorded via    │
   │  ├─ Muse permitted │──▶│ governed path          │
   │  └─ owner required │──▶│ one clean question in  │
   │                     │   │ the Dev room           │
   └─────────────────────┘   └────────────────────────┘
```

### The eleven stages (his words, the conveyor window)

```
 ● request-received  ● page0-frozen  ● references-gathered  ● distilling
 ● obligations-identified  ○ judgment-requested  ○ decisions-finalized
 ○ building  ○ verification  ○ sealing  ○ complete
```

Each lit stage is backed by a real artifact. An unlit stage is *not yet reported* — never grayed-out theater.

### Data flow (no second truth)

```
 page0/*.md ──┐
 verdicts/*.md ├─▶ publish_request_loop.py ─▶ queues/*.json ─▶ Dev room
 receipts.jsonl│         (funnel-queue branch)      ▲ renders
 runs/* ───────┘                              pipePull pattern
 decisions/*.jsonl ── judgments ─────────────▶ live-pipelines.json
```

### Verification views

Screenshots captured during the headless acceptance walkthrough (desktop 1280×800, phone 390×844) are attached to the sealed verdict as the true-geometry record. SwiftShader proves function, not beauty — his iPhone is final visual QA.

---

## Versioning

v1 — built from this version. Any change → new version.
