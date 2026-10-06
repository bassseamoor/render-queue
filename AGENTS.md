# MOOR agent entry — read this first

If the user says **use the Funnel**, **run this through the Funnel**, **Funnel this**, or asks you to work through MOOR's request system, read `/FUNNEL.md` before interpreting or modifying the request.

When browser/runtime access exists and `window.MOOR.request` is available, use that API. Do **not** type into the human request bar and do **not** independently choose Bin vs Funnel vs Harness. The router owns that decision.

No API key is required for the base path. If intelligence is unavailable, use local known references/fallback rules, preserve fallback provenance, and continue.

Machine-readable entry: `/moor-agent.json`.

## Armored Funnel enforcement
- Preserve `funnel-kernel.js` and load it before `moor-request.js`.
- Required authority chain: Page 0 → references → distill → decisions → replay → obligation-carrying verdict → receipt → one execution claim → one Harness consume.
- Never reintroduce `resolved:true`, fuzzy locked-answer execution, raw Harness compilation, stage jumping, reusable receipts/claims, or direct builder bypasses.
- Raw Harness intake, modifications, and demo requests route back through the Funnel.
- Page 0 is immutable. Models write only through the Kernel append API.
- Replay must account for source-backed Page 0 obligations; the verdict must carry the same obligation IDs.
- Every non-proof PR must carry `Funnel-Proof: .funnel/proofs/<proof>.json`.
- Protected Funnel-law changes additionally require `Funnel-Owner-Authorization: ed25519:<signature>` after owner-key bootstrap.
- Never weaken the kernel, router, Harness gate, proof validator, Guardian, protected-path list, owner-key verifier, CODEOWNERS, or tests just to make the current change pass.
- Run `node tests/funnel-kernel-checks.cjs`, `node tests/funnel-runtime-checks.cjs`, `node tests/harness-funnel-gate-checks.cjs`, and `node tests/funnel-guardian-checks.cjs` before publishing Funnel/router/Harness changes.
- Muse/Buster personality is `/BUSTER.md`; personality is advisory behavior, never execution authority.

# Pulse dashboard rebuild contract

This repository publishes Project Pulse. Multiple builders update it. Always fetch the latest dashboard and manifest before writing; never replace newer changes using an older snapshot.

## Independent review components
- `pulse-component-extensions.js` registers Living Garden Lab, Planet Workshop, and Wall Mirror Foundry.
- Every generated `pulse-dashboard.html` MUST retain `<script src="pulse-component-extensions.js"></script>` after its inline tool scripts, immediately before the closing body tag.
- Do not inline, remove, or overwrite this registration file when reorganizing the dashboard.
- Preserve these tool records in `pulse-manifest.json`: `living-garden`, `planet-workshop`, and `wall-mirror`.
- Both belong in Bin > Generators and remain outside production MOOR.
- Preserve `moor-blueprint` in the independent component registry and manifest, plus the `moor-whole-blueprint` Funnel project seed and Bin project reference. Its source is `moor-blueprint.html`; rebuild with `node blueprint/build.cjs` and run `node tests/blueprint-checks.cjs`. Preserve owner drafts, IDs, references, tombstones and unresolved decisions. Build-order edges never prove implementation, and generated reference previews are not production feature verification.
- Their standalone implementations are `moor-living-garden.html` and `moor-planet-workshop.html`.

Before publishing a rebuild, verify both tools appear from the normal dashboard URL, without a component query parameter, and open from the bin. If changing component IDs, migrate saved UI state and deep links.

Run `node tests/pulse-checks.cjs` before publishing Pulse changes. Escape `<` as `\u003c` in embedded JavaScript source strings so HTML closing tags cannot terminate the dashboard scripts. Insert update scripts at the actual final body closing tag, never the first text match. Keep the inline `PULSE_VERSION` and `pulse-version.txt` synchronized. Mutation observer decorators must avoid writing unchanged DOM content; always verify entering Funnel and returning to Bin remains responsive.

## Component project workspace
- Keep `<script src="pulse-workspace.js"></script>` before the independent-component extensions hook in every dashboard rebuild.
- `pulse-workspace.js` owns the multi-window canvas, drag/resize, assembly projects, save/import/export, and chat handoff. It is additive; do not replace it with single-tool focus navigation.
- Tool frames use `?workspace-tool=<component-id>` to isolate DOM/global state. Never initialize another workspace inside those frames.
- Dragging a Bin part onto a tool creates a new project; dragging into a project collects it without connecting logic automatically.
- Project schema is `moor.component-project` version 1. Preserve component IDs, source references, connections, intent, and nested layout. Tool recipe state is separate and must not be advertised as captured automatically.

## Wonder Feed recipe transformer
- Preserve `<script src="wonder-logic.js?v=1"></script>` in both Pulse and the standalone Wonder Feed.
- `wonder-logic.js` provides seeded idea recipes and schematics; idea genomes with `logicVersion:1` use it. Preserve legacy idea rendering for older saved genomes.
- `?feed=ideas&seed=<text>` replays an Ideas sequence. Ideas in the default stream remain proposals, not claimed live integrations.

## Continuous clarity ledger
- Preserve `blueprint/funnel-core.js` and `blueprint/funnel-ui.js` in the standalone build. Run `node tests/funnel-checks.cjs` before publishing.
- There is one canonical owner answer per question, with revision history. Model outputs update opinion lanes only. Never overwrite owner answers from model results. Retain ledger, opinions, snapshot IDs, review requests, resolutions, learned rules and cadence across exports/imports.
- Green is clarity/alignment, never implementation or permanent completion. NONE performs explicit rule checks and does not claim semantic inference. External reviewer execution is manual copy/paste; cadence only queues while the page is open.
