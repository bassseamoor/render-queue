# Road Atlas Streets 2.5.1 — hierarchy and local service

## What changed in 2.5

The road-kit pass remains parametric, but the city now establishes a small set of long primary corridors before neighborhood fabric. Corridor placement comes from the distribution of generated districts and shared planning-axis zones, not fixed road tiles. Collectors are then selected using turn-aware shortest paths, and locals remain subordinate. This targets the specific failure visible in the mobile close-ups: local-looking segments were being promoted after generation into zigzag arterials, and nearby districts independently invented orientations.

Street-axis zones now share orientation across multiple districts; steep terrain can rotate the fabric toward contours within a bounded amount. Redundant short triangular cycles are removed, short split links contract more aggressively, and optional district loops are only added when they materially shorten an existing detour. Degree-three junctions identify a dominant through pair so minor approaches read as T-junctions when appropriate. Crosswalk generation follows that priority and avoids Y/complex junctions. Residential dead ends can receive deterministic cul-de-sac bulbs, but only on sufficiently long local streets.

Primary corridors are derived from district projections along the dominant city axes. A line-attraction cost field lets them adapt to terrain/water while remaining substantially straighter than local fabric. They are generated before V1 district grids and stay arterial; edge access and district connections are collectors unless no viable primary corridor exists.

Metrics now include mean arterial deflection, primary-corridor segment count and removed tiny cycles. These are diagnostics, not civil-engineering guarantees.

## 2.5.1 local terminal service rule

The map review found a few local streets ending away from any active neighborhood. Internal degree-one local endpoints are now retained only within 230 × sqrt(WEXT) world units of a non-park district center. Map-edge continuations and bridge links are exempt; collectors and arterials are preserved. Short dead ends keep the prior 42-unit pruning rule. Exported metrics report remaining unserved local terminals, the service radius and how many unsupported terminals were removed. This is a neighborhood-reach heuristic, not a parcel-frontage or traffic-use proof.

The street fast and full browser tests now assert zero unserved internal local terminals for their fixed seeds. They were not run in this environment because the Python Playwright/Chromium test dependency is unavailable. The prior 2.5.0 test totals below are historical and do not validate these 2.5.1 changes. The versioned loader now requests Streets 2.5.1; its guarded integration fingerprint is 2.4.1.

## 2.5.0 validation record (before 2.5.1)

The fast 2.5 suite passed 46 checks on the default seed and the user's mobile screenshot seed, including independent junction/crosswalk/building geometry, deterministic regeneration, map coverage, previous-mode comparison, all corner-radius fixtures, touch navigation and fail-closed integration. The existing ordered suite also passed all 53 checks. A full legacy 2.4 regression run is expensive on the largest generated seed and was not completed in this session; the geometry test on the two targeted seeds independently validates every exported building volume.

## 2.4 implementation notes (retained)

## Scope and source of truth

User directive: fix the close-up road logic, use road-kit knowledge without fixed tiles, and distribute the city across the map. Original road-atlas.html and the pinned V1 baseline remain unchanged. Existing pipeline, conditions, architecture and navigation source files retain their prior bytes. Queue, thumbnails and STRATA are outside this change.

Owned changes: road-atlas-v2.html; new road-atlas-streets.js and road-atlas-street-hooks.js; this handoff; tests/road-atlas/verify_streets.py and the four existing suites' loader fixtures. The integration is intentionally narrow. The old engine is not replaced with another stand-alone city toy.

## First useful action

Open road-atlas-v2.html, Ordered build. Analysis > Street assembly > Connected, map-wide fabric is default. Previous ordered streets restores the preceding street process; Original V1 remains under Build order. Corner rounding varies actual junction mouths/corners from 4 to 14 illustrative world units. Share includes streets=connected|previous and corners, along with the existing seed, conditions, architecture and camera recipe. Data adds streetKit: templates, junction polygons, graph-owned ports, crossing polygons/bars, coverage samples and repair diagnostics.

The user screenshot seeds are RA1-821c9gee01c3 (paper) and RA1-8339djhi11zg (midnight). Compare those first, including at 5x and 16x rather than only map-fit thumbnails.

## Build order and preserved components

1. Retain V1 terrain, water and existing district roles. Add separated land-only centers throughout the rectangular extent; derive coherent district axes with bounded terrain-contour influence.
2. Reuse the actual V1 district-grid builder's line sampling, district/water clipping and crossing logic. Its central radius limitation and independently jittered axes are guarded adaptations; density still drives spacing.
3. Join valid neighborhood endpoints in heading order, reject shallow crossings/near-parallel duplicates, add bounded straight bank links where needed, and add selected alternate access loops.
4. Extend suitable cropped streets to the map boundary and connect valid dangling frontages. Contract microscopic links and remove short unusable stubs. Small isolated slivers are removed before parceling; substantial components can use dry A* detours, stopping at the first main-network crossing.
5. Classify paths on the actual graph into arterials and collectors. No separate overlapping road ribbons are laid over an unrelated local network. Preserve class through degree-two chains, then round eligible bends and planarize.
6. Derive parametric junction mouths from each incident edge's width, angle and arclength. T/X/Y and complex shapes use paired mouth boundaries and quadratic corners; acute/invalid shapes fall back to a recorded conservative mouth hull. Logical graph endpoints remain separate from trimmed rendering paths.
7. Reserve final road/junction space, then run existing condition-driven parcels, building fitting, site grammar, gardens, topo, network analytics and navigation.

The white-mark pileup was caused by the old cartographic renderer finding approaches by proximity to many nearby trimmed endpoints. Crossing groups now have unique (junction node, incident edge) ownership. Degree-one/two nodes receive no zebra groups. Each accepted group fits its road width; tight/acute/wet/short approaches are omitted. One casing pass, one surface pass, then junction fills and markings prevent road-edge strokes from cutting across junctions. Center dashes leave the crossing zone clear.

District/street and topo labels use bounded screen sizes during the existing idle detail redraw. During gestures, the retained source canvas is still transformed for responsiveness. Connected-mode ruler labels are world units, not invented kilometres. A scoped pointer-up adapter makes touch camera buttons activate once after a pan and suppresses only duplicate trusted compatibility clicks.

## Integration and contracts

road-atlas-street-hooks.js fingerprints the whole prior first-party pipeline and conditions source before injecting explicit call points. FNV32 values: pipeline 3614172088, conditions 1622085547. Each replacement must match exactly once; unexpected edits stop boot, not silently mispatch. No user or third-party code is compiled. The V1 grid adapter likewise checks exact source anchors. When changing either upstream source, review every hook and update the fingerprint; a static transform check does not replace the browser suites before release. Existing Original mode invokes the original source unchanged.

The loader fetches seven same-origin resources: pinned baseline, pipeline, conditions, urban, navigation, streets and hook adapter. It transforms the two known sources before executing their existing initialization sequence. RoadAtlasStreets exposes prepare/build/geometry/draw/metrics, settings and export methods. Runtime validation rejects malformed port ownership, non-positive/self-crossing junction outlines and disconnected mouths before publishing a new world. Existing orchestration retains the previous successful world on failure.

## Validation performed

383 passing local headless-Chromium checks: 88 new street checks plus 53 ordered, 79 conditions, 102 urban and 61 navigation regressions. The old suites' assertions are retained; fetch fixtures include the two new modules, and the exact resource-count assertion changes from five to seven.

New tests boot the actual shipped seven-resource shell with local first-party fetch/query fixtures. Nine fixed seeds include both user screenshot seeds, a dry map and scale/density extremes. Independent Shapely tests check logical endpoint references, one port per actual incident edge, trimmed-path/mouth coincidence, matching widths, valid junction outlines, crossings wholly within road corridors, zero crossing-group overlaps, and parcel containment of all 12,201 generated building volumes plus landscape surfaces. Empty zero-area gardens are valid, not failed containment tests. Synthetic T, X, skew Y, rotated X and near-parallel fixtures exercise parameterized geometry rather than bitmaps. Radius extremes, deterministic repeat pixels/graphs, comparison mode, capped zoom labels, source-fingerprint rejection, touch panning/Fit and shared recipes are covered. No uncaught errors or detail-render warnings were recorded.

Coverage is an explicit 16x10 sampling diagnostic: eligible points exclude water/bank margins and park districts; a point is counted when within 100*sqrt(WEXT) world units of an actual street. Observed eligible coverage was 94.37%-100%, not a claim every square metre is accessible. Eight of nine seeds yielded one component; RA1-g42o9kee01m3 retained two. Components are reported without inventing arbitrary bridges.

Reproduce from repository root:

    python tests/road-atlas/verify_streets.py
    python tests/road-atlas/verify_ordered.py
    python tests/road-atlas/verify_conditions.py
    python tests/road-atlas/verify_urban.py
    python tests/road-atlas/verify_navigation.py

Dependencies: Python, beautifulsoup4, playwright, shapely, Chromium; CHROMIUM override supported except the retained ordered test's original /usr/bin/chromium path. Reports and actual screenshots are written below tests/road-atlas/*-proof (ordered uses proof).

## Remaining limits

This is procedural cartographic logic, not a traffic simulator, surveyed road design or standards-compliant marking generator. It has no lane-movement graph, traffic signals, certified grade/cant/turning-radius limits or interchange/roundabout solver. Long dead-end streets can still be valid generated terminals; not every terminal has a turning bulb. Complex acute junctions may use conservative hulls. Terrain routing and coverage are heuristics. Some large maps remain disconnected. World-wide generation intentionally changes road and parcel layout for old seeds; Previous ordered and Original modes remain available.

The largest fixture took about 21 seconds of measured generation stages on the test machine; smaller/default fixtures were roughly 0.6-1.1 seconds in that run. These are desktop test observations, not phone performance guarantees. Actual iPhone Safari, live-CDN browser execution, long MP4 encoding and universal visual quality were not tested. Raster boundary resolution and prior architecture/footpath limits remain.

Primary design reference for the separation of nodes, edges, explicit connections and junction shapes: SUMO official documentation, https://sumo.dlr.de/docs/Networks/PlainXML.html and https://sumo.dlr.de/docs/Simulation/Intersections.html . SUMO is not a runtime dependency or an implementation claim.

Future workers: start from the current repository tree and include only owned changed paths. Never write a stale whole-repository snapshot over concurrent work.
