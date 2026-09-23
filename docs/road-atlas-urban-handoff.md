# Road Atlas 2.4 — fuller building massing and district character

## 2.4 occupancy follow-up

The 2.5 comparison showed that building roofs read too small and sparse against the street widths. This follow-up scales ground forms toward the selected openness target, selects residential rows more often on larger sites, and allows one extra V1 lot-splitting level in residential and commercial blocks where existing size limits permit it. The 1.14 maximum normalized massing scale leaves about a 1% margin at the outer edges of the fitted envelope. Analysis reports fitted-envelope occupancy as well as parcel-area coverage. Roads, parcel ownership and fitted envelopes remain fixed during a building-grammar-only edit; the new conditions version can create more lots during scene generation.

Integration base: GitHub `main` at `39f7d4b18451a7ef30f6e62e8c0fd69fff9c5e68`; the shipped 2.5 merge `72989b236634e536e8f20f30bcb3c9a17e7fd49f` is an ancestor. `tests/road-atlas/verify_urban.py` includes independent aggregate envelope-coverage validation; its browser suite was not run in this environment because Python Playwright and Chromium are unavailable. The condition and street browser suites were also not run for this follow-up.

## Scope and ownership

The user supplied an architectural site-to-building sequence, an urban-elements reference board, and a point/line/area spatial-organization matrix. This pass interprets those references as a bounded building-grammar layer. It does not implement every item on the reference boards and does not replace the improved road engine.

Owned runtime: `road-atlas-urban.js`, `road-atlas-streets.js`, the guarded `road-atlas-conditions.js` adapter, its `road-atlas-street-hooks.js` fingerprint, and the module loader in `road-atlas-v2.html`. Original `road-atlas.html`, pinned vendor source, routing and topography sampling are unchanged. The V1 recursive parcel splitter now allows depth 4 for residential and commercial blocks, within its prior minimum-size and count guards. Git is canonical. Work from the latest tree; preserve other workers' changes outside this scope.

## First useful actions

Open `road-atlas-v2.html?seed=RA1-821c9gee01c3&pipeline=ordered&topo=1&urban=1&v=2.4.0`. Select **Design**. The six stages are Site, Envelope, Ground form, Upper form, Open space and Finished. The selector and Previous/Next buttons browse actual committed city parcels, not a separately randomized model. An occupied parcel in the existing condition inspector also offers **Site → building study**.

In Design, Neighborhood character, Courts & gaps, and Illustrative height rebuild massing only. Roads, terrain, parcel ownership and prior fitted envelopes stay fixed. Turning Building grammar off restores the existing cartographic building style; exact visual comparison for this denser lot build is pending. Original V1 remains under Analysis > Build order. Layers > Neighborhood pattern field colors actual occupied parcels by their district charter. Analysis > Building grammar & district patterns lists measured per-district site counts and ground coverage.

**Export six-stage PNG** makes a 1680 × 2040 plate using the same scene renderer and committed model. **Export this site as JSON** returns a self-contained parcel, envelope, frontage road, model, landscape and settings. Existing Data exports all models plus the existing city graph and conditions. Share includes urban, character, openness and relief along with seed, build order and the active conditions settings. Existing Seed Console favorites remain seed-only; use Share or Data for the full extended recipe.

## Build order and contracts

The ordered pipeline keeps its existing stage order through roads, reservations, parcel fitting, network accessibility and hosted civic markers; the conditions adapter permits finer residential/commercial subdivision during parcel generation. The new stage then runs before labels and final rendering:

`finalized site + district + frontage + slope + accessibility → district charter → ground grammar → supported upper masses → bounded landscape → validation → existing map renderer / site-study renderer`

`RoadAtlasUrban.compile(W)` stores `W.urban` and `b.architecture`. It does not change an existing building's cx/cy/w/h/ang/hgt or its parcel, nor any road edge or terrain sample. `setSettings()` rebuilds this layer against the existing world and redraws; it does not regenerate roads or parcels. Deterministic namespaced RNG uses the existing palette-independent ordered RNG.

Priority order is ownership, pavement/water/slope reservations, geometric support, frontage, district character, bounded variation. Industrial and waterfront context override a requested stylistic character; very small sites fall back to a compact bar instead of forcing thin wings. Higher slope-index sites prefer stepped/reduced-height masses. Existing network accessibility modestly affects illustrative height. These are disclosed design heuristics, not predictions of urban performance.

The grammar has compact bars, L-wings, open courts, gated perimeter courts, stepped terraces, setback towers on podiums, paired civic pavilions, fine-grain rows and workshops/service yards. Not every form is valid on every seed or parcel. A district charter coordinates related choices: center, courtyard, terraced, garden, waterfront or working. Hard conditions still outrank the charter.

## Geometry and actual guarantees

A volume has a world-space oriented rectangle, plan polygon, z0/z1, parent volume id, projected base and projected roof. Ground components have disjoint interiors. Upper components sit at their parent's top elevation and their whole plan lies within that parent. The implementation checks every intersected ownership cell, including the entire cartographic sweep between base and roof, not just its endpoints. It uses a conservative oriented bounding rectangle of that sweep; therefore it can cap a height even when a more exact polygon solver would allow it. Intersecting 3D volume interiors are rejected.

Geometric nesting is not a structural-engineering proof. Z uses illustrative V1 world units. Facade bays do not constitute an occupancy or floorplan model. The isometric study uses a flat local ground plane; slope influences form selection, not a simulated cut/fill or foundation design. There is no wind, insolation, fire-code, accessibility-code, structural or zoning solver.

Ground coverage is the actual disjoint ground-footprint area divided by the area of occupied host parcels. It is not citywide building coverage, floor-area ratio, permeability or a walkability score. Total volume is the sum of noninterpenetrating prism volumes in world units cubed, not market or development value.

Gardens and paving are coherent frontage/door/service-band rules over residual owned cells; no random per-cell material confetti. Full-cell exclusion keeps surface regions away from all ground footprints. An internal four-neighbor cell path connects a reachable parcel-boundary approach to an entrance-adjacent free cell when possible. `publicConnectionVerified` is always false: the gap from the parcel boundary to the public sidewalk is not solved. Tree canopy footprints stay within free owned cells. Map shadows are clipped to the owning parcel. No new tree shader, traffic simulation or external asset dependency was added.

The inherited boundary resolution remains four world units. Small sites can look stepped or conservative; do not smooth exported boundaries across reserved ground just to make the study prettier. Inherited disconnected road components remain reported. Site-study diagrams and city maps are two projections of the same geometry, with different palette/detail levels.

## Reproduce and extend

Run `python tests/road-atlas/verify_urban.py`, `python tests/road-atlas/verify_ordered.py`, and `python tests/road-atlas/verify_conditions.py`. Dependencies: Python, beautifulsoup4, playwright, shapely, and Chromium (CHROMIUM can specify the binary). Tests use exact local first-party source with set_content and a local four-file loader/query fixture because external browser navigation is blocked in this environment. These are not live-delivery or actual iPhone Safari tests.

The new test independently reconstructs prism sweeps, parent support, disjoint footprints, parcel rings, surfaces, canopy footprints, path cells and coverage using Shapely. It compares roads/parcels/envelopes before and after across eight seeds, tests four characters at both parameter extremes, deterministic pixels, exact grammar-off/Original V1 comparisons, overlay/palette independence, stricter conditions, query roundtrip, six-stage PNG and site JSON export, inspector links, and portrait/landscape touch viewports. Output is in `tests/road-atlas/urban-proof/`. Existing tests only change their loader fixture and expected orchestrator version; their old checks remain.

Next bounded ownership targets: frontage-to-public-sidewalk connectivity; nonrectangular ground footprints; accurate terrain foundations; and different climate/solar models only when explicitly implemented and measured. Do not silently convert the charters into claimed performance scores. Preserve the grammar-off comparison and both existing baselines.
