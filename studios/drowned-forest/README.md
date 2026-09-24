# Drowned Forest — module source map

Modularized from the single-file `drowned-forest.html` (script blocks 0–4,
in order). The HTML file is now a thin loader: identical markup/CSS, one
`<script type="module" src="studios/drowned-forest/main.js">`.

## Modules

| File | From | Responsibility |
|---|---|---|
| `main.js` | — | Entry point. Import order mirrors the original `<script>` order. |
| `app.js` | block 0, minus shaders | Studio core: seeded config + lens-code system, GL setup, render targets, realm builders (8 depth planes), world bake + render loop (`draw`), post/lens pipeline, DOM UI, recording, render-mode hooks. |
| `shaders.js` | block 0 (pure data) | All GLSL sources: `vert`, `frag`, `screenVert`, `common`, `compositeFrag`, `opticalGLSL`, `cityLensFrag` (= `` `…`+opticalGLSL+`…` ``), `citySnapshotFrag`, `cityVertex`, `cityFragment`, `cityShadowFragment`. No imports, no side effects. |
| `ui/seed-console.js` | block 1, verbatim | Seed Console v2. Sets `window.SeedConsole`. |
| `ui/adapter.js` | block 2, re-hooked | Drowned Forest adapter: `window.SeedConsoleAdapter`. Reads studio state through `window.__drownedHooks` (random/remix/params/getSeed/setSeed). |
| `export/muxer.js` | block 3 | mp4-muxer v5.2.1 (third-party). Exports `Mp4Muxer`. Render mode only. |
| `export/controller.js` | block 4 | Fixed-step `?render=1` video controller. Imports `Mp4Muxer`; drives the studio through `window.__renderCanvas` / `window.__renderReset` / `window.__renderMode` / `window.__renderResult`. |

## Contracts (unchanged from the single file)

- `window.__renderCanvas`, `window.__renderReset` — set by `app.js`; read by the controller.
- `window.__renderMode` — set by the controller; read by `app.js` (fixed-step time, no wall clock).
- `window.__renderResult` — set by the controller when the MP4 is ready.
- `window.SeedConsole` / `window.SeedConsoleAdapter` — the generation console.
- `window.__drownedHooks` — **new, additive**: exposes the adapter's needs
  (`rng`, `fresh`, `mix`, `clamp`, `hash`, `codeOf`, `parseCode`, `cityFamily`,
  `changeWorld`, `disposeWorld`, `syncLensUI`, `defaults`, `controls`, `canvas()`,
  `config`/`smoothed`/`current`/`previous` via getters, `previous` also settable).
  The original shared these as top-level script bindings; modules keep them
  private, hence the hooks object.

## Determinism notes (verified 2026-09-24)

- The studio core is byte-identical to the original block 0 (verified by
  reconstruction: reinsert the 11 extracted shaders, remove the module-only
  header/import/hooks). The seed console, adapter logic, muxer, and render
  controller are behavior-identical to the single file.
- Block 0 had no top-level `return` (the one `^return` match is inside a GLSL
  string), so no IIFE unwrapping was needed.
- `app.js` keeps the studio core as one module (same as the Molten, Canal, and
  Parallax Engine slices); shader data was the clean separable seam.
- Git history retains the pre-split single file for recovery.
