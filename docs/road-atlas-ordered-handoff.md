# Road Atlas 2.1: ordered V1 build

## Scope and source of truth

User directive: retain the old generator and reorder its process for better output. Do not replace it with another simplified road engine. Original `road-atlas.html` is unchanged. The first-party baseline archive is byte-identical to `road-atlas-v2.html` at commit `329a68a46c825cc96708c377638f7c5415f14a96` (blob `4d052947d3f30457ea90b840e5f03465644b778d`). This archive contains the restored V1 renderer plus existing V2 controls, Seed Console and encoder.

Owned files: `road-atlas-v2.html`, `road-atlas-pipeline.js`, the pinned baseline under `vendor/`, and this handoff/test folder. Do not modify other studios or the queue in this task.

## Use

Open `road-atlas-v2.html` through the existing static site. Analysis > Build order selects Ordered build or Original V1 comparison. Random and Remix retain the original seed console. Share stores seed and pipeline selection. Data exports the actual graph, rendered road paths, fields, transit, buildings and diagnostics. There is no new runtime dependency or backend. The small shell fetches two same-origin files, so it requires static HTTP hosting rather than opening that shell through file://.

## Build sequence

1. Original terrain, water and land-use fields; move invalid wet terminals onto land.
2. Original macro graph and road classes; repaired heap A* for primary corridors.
3. Original district grids, including dry waterfront fabric.
4. Attached tensor-guided local infill; prevent the backward-heading reversal.
5. Snap dangling endpoints, split X/T crossings, deduplicate collinear spans, join nearby dry components. This is the authoritative untrimmed graph.
6. Derive junction geometry and bridge spans, keeping graph endpoints separate from trimmed drawing paths.
7. Rebuild final pavement/water occupancy, then use original block extraction and building/park packing. Reject footprints overlapping final road reservations.
8. Compute accessibility and transit from actual graph edges instead of unused macro candidates.
9. Name unsplit corridor lineages and reject close street labels.
10. Validate finite positive edges and shared endpoint references; render using the unchanged V1 cartographic function into a fresh buffer, then publish.

Each stage records duration in `world.pipeline.trace`. `RoadAtlasPipeline.exportData()` includes the final graph; `world.network` is graph truth, while `world.roads` contains trimmed rendering geometry. Do not infer connectivity from visual overlap or node-disc proximity.

Palette and label seed cells are excluded from generation entropy only in Ordered mode. Original mode keeps the old entropy behavior for exact comparison. A generation error retains the previous world, canvas and dimension state.

## Validation performed

53 passing assertions across eight deterministic seeds, headless Chromium with local source via Playwright set_content. No uncaught browser errors. Checks include original-mode pixel parity on all eight seeds, ordered repeat pixel/graph determinism, valid graph export endpoints, finite accessibility, valid transit indices, X/T/collinear/water-crossing fixtures, palette/layout independence, layer controls, mode selector, 390x844 touch viewport controls, and the actual asynchronous shell boot with local fetch fixtures. This tests rendering and code execution, not live network delivery, actual iPhone Safari, or long video encoding.

Fixtures and observed graph component counts:

- RA1-821c9gee01aa: 1 component.
- RA1-821c9gee01ab: 2 components; 99.73% of length in the largest.
- RA1-821c9gee01c3: 1 component.
- RA1-821c9gee01z9: 1 component.
- RA1-c21c9gee01r2: 5 components; 91.81% of length in the largest.
- RA1-g42o9kee01m3: 1 component.
- RA1-04269a8a01x7: 1 component.
- RA1-821c90ee01w0: 1 component.

Ordered edge counts are split road segments and must not be compared to V1's unsplit road count as a road-density improvement. Building count may decrease because invalid footprints are rejected. One component is not proof of good urban design.

## Reproduce

Test dependencies: Python, beautifulsoup4, playwright and Chromium at /usr/bin/chromium (adjust executable_path when using another environment). Run `python tests/road-atlas/verify_ordered.py` from the repo. It writes screenshots and a full JSON report to `tests/road-atlas/proof/`. The browser navigation restriction in the build environment is handled by set_content and a local first-party fetch fixture.

## Remaining limits / next ownership boundary

This is a procedural map, not a validated civil/traffic model. No lane movement graph, certified grade/curvature constraints, or automatic proof of visual quality is claimed. Accessibility includes an approximate Euclidean last-mile term. All components are reported; the local connector pass never invents a bridge to make statistics look better. V1 junction-disc/crosswalk styling and the V1 building renderer remain, with their existing visual limitations. Future work should start with visual comparison of these fixed seeds, refine one subsystem, and retain Original mode until the replacement passes equivalent tests.
