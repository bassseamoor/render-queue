# Road Atlas 2.2 — conditional boundaries and topography

## Scope

User directive: keep the improved, ordered V1 road generation; make objects obey the conditions produced by layers; add topographic lines. Original road-atlas.html, the pinned vendor baseline, other studios and the content queue are unchanged.

Owned runtime files: road-atlas-v2.html (loader), road-atlas-pipeline.js (orchestration hooks), road-atlas-conditions.js (conditions, geometry, UI). Tests: tests/road-atlas/verify_conditions.py and the updated asynchronous-loader fixture in verify_ordered.py. The previous 2.1 pipeline is preserved under tests/road-atlas/fixtures/pipeline-2.1.0.js for reproducible same-seed comparisons.

## First useful actions

Open road-atlas-v2.html with pipeline=ordered. Topographic contours are enabled by default. Layers > Contour styling adjusts interval, opacity and relative-elevation labels. Layers > Boundary / field views shows blocks, parcels, the actual buildable/exclusion mask, slope, district regions and existing V1 direction guides. Layers > Inspect a point / parcel enables map taps. Analysis > Placement conditions changes additional road setback or the maximum slope index. Data exports the graph plus terrain, contour polylines, parcel rings, placement ownership, rules and diagnostics. Share includes seed, build order, setback, slope limit and contour styling.

## Dependencies and geometry

The V1 elevation function is sampled on an approximately 8-world-unit rectangular grid. The same field already informs V1 route cost; this pass does not replace road generation or alter the 2.1 road graph. Central differences produce the existing V1 slope normalization, min(1, magnitude(gradient) * 900). Elevation values are relative, NOT surveyed metres. Slope is a normalized design index, NOT a real grade percentage.

Marching squares produces actual elevation isolines with linearly interpolated shared-edge vertices. The bilinear determinant resolves ambiguous saddle cells. Shared edge IDs join segments into open paths or closed loops. Major lines occur at multiples of 0.10 relative elevation. No decorative curve smoothing moves those sampled vertices off the isovalue. Contours render before water, parks, roads, objects and labels, using the retained V1 cartographic renderer.

Final roads, junctions, water/bank clearance, slope exclusion and map edges produce a 4-world-unit reservation grid. The retained V1 connected-region extraction and recursive subdivision run against these conditions. Parcel envelopes are conservative unions of full cells inside the street-aligned subdivision/frame, limited by district ownership and already assigned parcels. Street-frontage parcels come from fixed frontage bands anchored to actual local road samples, before a building is fitted; they are not merely outlines wrapped around an already placed building.

Every accepted building references an assigned parcel. An oriented-rectangle vs grid-cell separating-axis test checks all intersected cells, not just corners. Candidate widths and depths shrink independently; interior cell candidates support concave parcels. The base footprint and displaced roof must both fit. Decorative height is reduced where necessary; shadows and park tree drawing are clipped to their parent rings. Rural decoration is rejected if its whole footprint crosses water, pavement, a parcel or a district boundary. Civic markers use actual host parcels; missing free-space markers become district service intents, still omitted if no valid host fits.

The exact raster-union boundaries are traced into rings, retaining holes and disconnected pieces. Vertex pinches split into simple loops. Rings are not smoothed beyond collinear simplification. This is conservative raster geometry, not a survey-grade vector inset/parcel solver. Narrow valid sites may remain empty. A changed setback or slope rule can split a land region and change block/park assignment. Blank land without an assigned parcel is not presented as an entitlement to build.

## Reuse rather than replacement

The conditions module compiles guarded adapters over the already-loaded, immutable first-party V1 buildBlocks and renderWorld functions. Full source fingerprints and every replacement range must match. The hooks add reservation, fitting, ownership and rendering clips; the existing district/block packing and visual functions are not replaced with a thin new generator. No user strings or third-party code enter these adapters. A baseline mismatch stops boot. Original comparison mode calls the untouched originals for exact V1 pixels.

RoadAtlasConditions exposes prepare, buildBlocks, reindex, finalizeLayers, validate, refresh, exportData, inspect, inspectAt, setSettings and setView. The orchestration validates base/roof containment before publishing a scene. Invalid generation retains the previous scene. Presentation changes redraw the existing world; they do not reroll geometry.

## Validation

Run python tests/road-atlas/verify_conditions.py. Dependencies: Python, beautifulsoup4, playwright, shapely, and Chromium in PATH (or CHROMIUM environment variable). It writes actual browser screenshots, an example JSON export, source hashes and validation.json under tests/road-atlas/conditions-proof/. It compares the 2.1 and 2.2 road graphs across eight seeds and uses independent Shapely geometry to check every exported building base and projected roof against its parcel. It also checks exact parcel areas, zero parcel overlaps, contour ramp/hill/saddle fixtures, hole rejection, repeat determinism, stricter placement rules, presentation independence, legacy pixels, service hosts, the actual three-file loader, wrapped phone toolbar bounds and touch inspection. Original verify_ordered.py retains its 53 regression checks and now supplies the third module to its async-loader fixture.

Tests run in headless Chromium with first-party local fetch fixtures. They are not an actual iPhone Safari test, long video encode test, survey/traffic model or universal visual-quality proof. The inherited network still reports disconnected components on some seeds. Existing annotation and junction styling remain. Source and screenshots should be compared before extending another subsystem.

## Reference

Marching-squares contour extraction from a rectangular scalar field is also documented by D3: https://d3js.org/d3-contour . This implementation is first-party code; D3 is not a runtime dependency. The harmonic/energy diagram is visual inspiration, not a physical claim or an engineering constraint.
