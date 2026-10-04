# MOOR Atlas v1

Reusable, self-contained map component. Runtime: `moor-atlas.html`. Pulse ID: `moor-atlas`; tool: `moorAtlas`. Registered by `pulse-component-extensions.js` and described in `pulse-manifest.json`. Uses the standard isolated, resizable Pulse workspace frame and can be collected into a component project. No changes to the workspace layout or existing components.

## Inputs and outputs

Same-origin hosts can access `iframe.contentWindow.MoorAtlas` after load.

- `getWorld()` returns a detached JSON world document.
- `setWorld(raw)` validates and replaces the map world, then saves it on this browser. Accepts an Atlas world, Atlas export, Beta world, or Beta worlds/active storage object. Returns `{id,name}`.
- `sample({x,z})` returns `{x,z,y,slope,code,seed}`.
- `selectPoint({x,z,name?})` selects/focuses that point and returns its sample.
- `planRoute({from:{x,z},to:{x,z,name?}})` stages a terrain route and returns `{ok,route,stats}` or `{ok:false}`. This does not save the route or move the player.

Window events inside the component: `moor-atlas:change` with a detached world in detail; `moor-atlas:select` with point, code, and seed. The host can subscribe directly through the same-origin frame. Events are not broadcast to arbitrary origins.

## World schema

`moor.atlas.world` v1: `{id,name,seed,terrain:{preset,relief},terrainEdits[],waypoints[],claims[],paths[],buildings[],player:{x,z}}`. Meshes are derived. Presets: mountains, island, valley, flat, classic, glass. Coordinates in metres, x/z -200..200. Waypoints `{id,name,kind,x,z}`; claims `{id,name,x0,z0,x1,z1,color}`; paths `{id,name,kind,pts:[[x,z],...]}`.

The world export includes component references and explicit connections. Pulse component-project export captures membership and layout only; export the Atlas world separately to retain its recipe and edits. Each live frame has isolated controls; saves use the shared origin-local `moor-atlas-world-v1` key. Live frames do not automatically synchronize edits.

## Composition

Moor Beta world + seeded terrain -> map geometry, place elevations, claims, routes. Optional Glass Map field -> same height sampler. Map picking -> original GridCoords -> lookup and codes. Selection -> original HoloPanel inspector. Routes use the shared sampler. Original sources embedded in the standalone preserve independence from Pulse and external services.

## Limits

One local 400 x 400 m sector. No production MOOR integration, network authority, live ownership, multiplayer, chunk streaming, or actual travel. Codes have 0.5 m precision and no world identity; pair with seed/world. Original mod-32 weighted checksum has some undetectable character substitutions. Route A* uses 5 m grid samples, excludes water and sampled grades >70%; no building collision or subcell obstacle checking. Manual routes have no obstacle validation. Walking time and marker playback are estimates/previews.

## Source provenance

Embedded libraries recovered from `glass-map.html`, `grid-coords.html`, `pulse-dashboard.html` (HoloPanel), and `moor-beta.html` (terrain + Map3D). Atlas adds camera pan, dynamic contour ranges, top view, editing, route planning, export/import, and browser-local persistence. Standalone app developed separately; integration is additive.
