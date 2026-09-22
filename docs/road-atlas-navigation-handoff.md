# Road Atlas map navigation — 1.0.0

## Scope and ownership

User request: zoom and move around the existing map. Retain Road Atlas 2.3 streets, topography, conditions, parcels and architecture. No generation or baseline changes. Owned changes are the new `road-atlas-navigation.js`, its loader entry in `road-atlas-v2.html`, tap/share adapters at the end of `road-atlas-conditions.js`, the new navigation test, the three existing tests' local fetch dictionaries, and this handoff. Original `road-atlas.html`, vendor baseline, queue and other studios are unchanged.

## First useful actions

Drag with one finger or the left/middle mouse button. Pinch with two fingers or use the mouse wheel to zoom around the touched/cursor location. Double-tap/double-click zooms in unless parcel inspection is enabled. The map supports 1–16x zoom relative to its fitted size. The +/- buttons zoom about the viewport center. Fit map resets framing. Focus hides application panels and gives the map the whole viewport; this is an in-app focus view, not a browser fullscreen request. Exit focus with the same button or Escape. Mini toggles a clickable/draggable overview; it starts hidden on mobile. A focused map or overview accepts arrows, +/-, Home/0 and F. Other fields retain their normal keyboard and scroll behavior.

Layers > Inspect a point / parcel still identifies the correct parcel after panning/zooming. Dragging back to its starting point is not a tap; pinching does not inspect. Share preserves optional camera parameters (`mapZoom`, `mapX`, `mapY`, with normalized center coordinates) alongside the complete existing scene recipe. Full-map source exports remain full-map exports, not viewport crops.

## Camera and rendering contracts

The camera owns a world-space center and relative zoom, separate from all generated geometry. CSS transforms position the original world-sized canvas, with clipping at the map stage. This keeps gestures inexpensive and preserves source canvas dimensions/pixels, Seed Console recording hooks, geometry and deterministic exports. A 160ms idle pass replays the retained cartographic renderer into a viewport-sized detail canvas when the source would otherwise be magnified. That cache is limited to DPR 2 and approximately four million pixels. It is hidden while gesturing; the old bitmap remains visible. Diagnostic raster overlays retain their source resolution. This is not a tile-streaming or vector-map-engine rewrite.

`RoadAtlasNavigation` exposes `getView`, `fit`, `zoomAt`, `pan`, `screenToWorld`, `worldToScreen`, `setFocus`, `queryParameters`, `refresh` and `cancelGesture`. Coordinates accepted by screen/world conversion are client CSS pixels. The private inspector listens to a `roadatlas:maptap` event carrying world coordinates; original canvas listeners remain as fallback when the camera module is absent. Pointer capture, cancel/lost capture, blur and visibility changes prevent stuck drags. A stage-scoped touchend propagation guard prevents the retained Seed Console's document-level double-touch hide-controls shortcut from stealing map gestures.

Overlay/style/architecture edits preserve framing. New city seeds or changed world extents reset to fit. Ordered-mode palette/label seed cells do not count as a new city. Resize and focus changes preserve the world center and relative zoom subject to edge clamping. Stage and floating-control dimensions come from ResizeObserver. Map-only touch-action rules do not disable zooming controls or the document elsewhere.

The module installs before SeedConsole.init, after the pipeline/conditions/urban modules. It fetches only same-origin first-party files. `?render=1` returns a disabled navigation API without installing camera styling, events or draw hooks: deterministic MP4 rendering continues to use the original render camera. Failed detail drawing falls back to the existing map and logs a warning; it never modifies generation state.

## Validation and reproduction

Run `python tests/road-atlas/verify_navigation.py`, plus `verify_ordered.py`, `verify_conditions.py` and `verify_urban.py` in that directory. Requirements: Python, Playwright, beautifulsoup4, Shapely and Chromium; `CHROMIUM` overrides the browser executable where supported. Run from the repository or directly by file path. Reports/screenshots are generated under each test's proof directory.

295 checks passed on the committed bytes: 61 new navigation checks and the existing 53 ordered / 79 conditions / 102 urban checks. Desktop tests use browser mouse/wheel/keyboard events. Portrait (390x844) and landscape (844x390) tests use Chromium CDP-generated multi-touch events, including pinch, one-finger continuation, cancellation and double-tap. Tests cover camera/data/pixel independence, full-resolution source buffers, idle detail redraw, cursor anchoring, bounds, Fit/Focus/Mini controls, accurate zoomed parcel inspection, scroll isolation, shared framing, seed/style/edit behavior, resizing, render-mode bypass and the exact five-file asynchronous loader. No uncaught errors or detail-fallback warnings occurred.

The build environment blocks browser URL navigation, so tests use local first-party fetch/query fixtures and the exact runtime bytes. This is not an actual iPhone Safari test, live-CDN browser execution, long MP4 encode, or universal performance guarantee. Existing procedural-map and illustrative-architecture limitations remain unchanged. Raster overlays may soften at high zoom. No new content is generated by zooming.

## Concurrent-worker handoff

Build Git trees on the latest parent tree using only owned changed paths. Compare intervening edits before merging. A stale full-repository snapshot previously reverted Road Atlas after a successful merge; do not repeat it. Check both deployment status and retained feature files before reporting the update live.
