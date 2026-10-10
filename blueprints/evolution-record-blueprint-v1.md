# Blueprint — Funnel Evolution Record visualization tool (v1)
Source: funnel run funnel-evolution-record-prod-2026-10-07, receipt 0f7266b91c764842.
Page 0: ~/workspace/funnel-docs/funnel-evolution-record-requirement.md (fed as the actual file).

## What this is
A read-only LENS over Funnel history. It renders snapshots of the Funnel's structure
over time as an inspectable graph. It never writes to the record, never scores/ranks/
prunes/composes candidates, never touches funnel-kernel.js or funnel-distill-frontier.js.

## Parts (files to build)
1. `evolution-record-core.js` (repo root) — INERT CORE. Pure functions only:
   - `ER.snapshot(id, meta, nodes, edges)` — snapshot record constructor
   - `ER.diffSnapshots(a, b)` — exact diff: added[], removed[], changed[], merged[], split[]
   - `ER.lineage(nodeId, snapshots)` — event chain across snapshots
   - `ER.selfCheck()` — determinism + diff-correctness proof, returns {pass, checks[]}
   - TAGS header per tag_workspace.py taxonomy. No DOM. No network.
2. `funnel-evolution-record.html` (repo root) — STANDALONE TOOL PAGE. References
   evolution-record-core.js via script src. Canvas renderer + evidence panel + timeline
   scrubber + compare mode. Fully functional offline from file:// . Live self-check
   runs on load, result shown on the page.
3. `pulse-v2/tools/tool-evolutionrecord.js` — PULSE ADAPTER. Registers the tool in the
   dashboard (same adapter contract as tool-blueprintdl.js). Self-contained; opens the
   tool view inside Pulse.
4. COMPS entry in `pulse-v2/dashboard.js` (id 'evolutionrecord', cat 'interface').
5. `pulse-manifest.json` entry + `pulse-tags.json` entries.

## Interfaces
- Core has zero dependencies; adapter depends only on dashboard tool contract.
- Node types (data labels, from the record structure): stage, candidate, obligation,
  reference, decision, failure, receipt, lineage.
- Edges carry role labels (requires, produced-by, decided-by, evidenced-by, supersedes).
- Demo dataset: synthesized from REAL receipts only —
  2e44784661158cd5 (fabric runtime), fc5f0e9eb62a (evergreen context),
  608514ba3c138bdb (adapter cache-bust), 9a8f1b8152224f96 (DEV-01 REV6),
  4d2bfd029313ef73 (Pulse 3D migration), distill-frontier contract events.
  Every demo node/edge is labeled "demo" in the evidence panel.

## Build steps
1. Write evolution-record-core.js with TAGS header; node --check clean; ER.selfCheck()
   passes in node (extract and run).
2. Write funnel-evolution-record.html; node --check on every script block;
   headless: zero pageerror, zero console errors, non-blank render, screenshot.
3. Write tool-evolutionrecord.js following the tool-blueprintdl.js contract.
4. COMPS + manifest + tags entries.
5. Push via gh_multipush.py in ONE commit (stale-tree rules: HEAD re-check immediately
   before push; re-download + re-apply if moved; diff item keys after).
6. Wait ~2 min; curl each file with ?v=<commit>; MD5 live == local. Claim live only on match.

## Acceptance (all 11 must pass headless or be explicitly disclaimed)
- [ ] Whole structure visible at once (fit-view renders all snapshots' roles)
- [ ] Clustering by actual structural role (role clusters, labels = data labels only)
- [ ] Edge bundling or progressive disclosure (bundled edges, no spaghetti at fit-view)
- [ ] Zoom whole-topology → individual node
- [ ] Filtering without deleting (role/stage filters; filtered items hidden, not removed)
- [ ] Current-vs-historical distinction (visual marker; historical dimmed)
- [ ] Add/remove/merge/split/changed highlighting between snapshots
- [ ] Lineage through time (node lineage chain view)
- [ ] Node → evidence inspection (click node, see underlying evidence/receipt)
- [ ] Two-snapshot comparison mode
- [ ] Evolution/timeline mode (scrubber; structural change visually obvious)

## Non-goals
- No scoring, ranking, pruning, or composition of candidates (distill Phase 2 on hold).
- No appearance→cognitive-property claims anywhere (no "circle = holistic", no
  five-tribes mappings as fact, no "dense cluster = learning fastest").
- No kernel/funnel machinery changes. No backend. No persistence beyond the demo record.

## Demo snapshots (3 versions, honest labels)
- v1: intake record — 8 stage nodes + obligations + references + 2 receipts.
- v2: adds candidates/frontier (5 preserved), decisions, failures, 2 more receipts;
  one node merged (duplicate), one split (contradiction).
- v3 (current): adds lineage edges + distill-frontier events; one node removed.
Diffs between v1→v2→v3 exercise every highlight class.
