# Alien Planet Studio — module source map

Modularized from the single-file `alien-planet.html` (script blocks 0–4, in
order). The HTML file is now a thin loader: identical markup/CSS, one
`<script type="module" src="studios/alien-planet/main.js">`.

## Modules

| File | From | Responsibility |
|---|---|---|
| `main.js` | — | Entry point. Import order mirrors the original `<script>` order. |
| `app.js` | block 0, minus shaders | Studio core: Xenora seeded world (`cfg`), matrix utilities, adaptive WebGL2 rendering (terrain, meshes, shadows, sky, post, particles, rain), `regenerate()` generation path, render-mode hooks, UI. |
| `shaders.js` | block 0 (pure data) | All GLSL sources: `noiseGLSL`, `terrainGLSL`, `meshVS/FS`, `shadowFS`, `fullVS`, `skyFS`, `postFS`, `particlesVS/FS`, `rainVS/FS`. No imports, no side effects. |
| `ui/seed-console.js` | block 1, verbatim | Seed Console v2 (shared with the other studios). Sets `window.SeedConsole`. |
| `ui/adapter.js` | block 2, re-hooked | Xenora adapter: `window.SeedConsoleAdapter`. Seed format `XENO-…` (6 hex). Reads studio state through `window.__alienHooks` (`regenerate`, `outputs`, `save`, `cfg` and `recording` via getter/setter). Waits for `window.__xenoraEngineReady` before `SeedConsole.init`, as the original did. |
| `export/muxer.js` | block 3 | mp4-muxer v5.2.1 (third-party). Exports `Mp4Muxer`. Render mode only. |
| `export/controller.js` | block 4 | Fixed-step `?render=1` video controller. Imports `Mp4Muxer`; drives the studio through `window.__renderCanvas` / `window.__renderReset` / `window.__renderMode` / `window.__renderResult`. |

## Contracts (unchanged from the single file)

- `window.__renderCanvas`, `window.__renderReset` — set by `app.js`; read by the controller.
- `window.__renderMode` — set by the controller; read by `app.js` (fixed-step time, no wall clock).
- `window.__renderResult` — set by the controller when the MP4 is ready.
- `window.__xenoraEngineReady` — set by `app.js` when the engine boots; the adapter polls it before init.
- `window.SeedConsole` / `window.SeedConsoleAdapter` — the generation console.
- `window.__alienHooks` — **new, additive**: exposes the adapter's needs
  (`regenerate`, `outputs`, `save`, `cfg`/`recording` via getter/setter). The
  original shared these as top-level script bindings; modules keep them
  private, hence the hooks object.

## Determinism notes (verified 2026-09-24)

- The studio core is byte-identical to the original block 0 (verified by
  reconstruction: reinsert the 12 extracted shaders, remove the module-only
  header/import/hooks). The Seed Console, adapter logic, muxer, and render
  controller are behavior-identical to the single file.
- No duplicate top-level declarations, so no module conversion conflicts.
- Git history retains the pre-split single file for recovery.
