# Canal Metropolis — module source map

Modularized from the single-file `canal-metropolis.html` (script blocks 0–4,
in order). The HTML file is now a thin loader: identical markup/CSS, one
`<script type="module" src="studios/canal-metropolis/main.js">`.

## Modules

| File | From | Responsibility |
|---|---|---|
| `main.js` | — | Entry point. Import order mirrors the original `<script>` order. |
| `app.js` | block 0, minus shaders | Studio core: seeded config + lens-code system, GL setup, render targets, natural-world builders, city systems, buildings/details, world bake + render loop (`draw`), post/lens pipeline, DOM UI, recording, render-mode hooks. |
| `shaders.js` | block 0 (pure data) | All GLSL sources: `vert`, `frag`, `screenVert`, `common`, `skyFrag`, `mistFrag`, `compositeFrag`, `opticalGLSL`, `cityLensFrag`, `citySnapshotFrag`, `postFrag`, `cityVertex`, `cityFragment`, `cityShadowFragment`, `aoFrag`, `aoBlurFrag`. No imports, no side effects. |
| `ui/seed-console.js` | block 1, verbatim | Seed Console v2. Sets `window.SeedConsole`. |
| `ui/adapter.js` | block 2, re-hooked | Canal Metropolis adapter: `window.SeedConsoleAdapter`. Reads studio state through `window.__canalHooks` (random/remix/params/getSeed/setSeed). |
| `export/muxer.js` | block 3 | mp4-muxer v5.2.1 (third-party). Exports `Mp4Muxer`. Render mode only. |
| `export/controller.js` | block 4 | Fixed-step `?render=1` video controller. Imports `Mp4Muxer`; drives the studio through `window.__renderCanvas` / `window.__renderReset` / `window.__renderMode` / `window.__renderResult`. |

## Contracts (unchanged from the single file)

- `window.__renderCanvas`, `window.__renderReset` — set by `app.js`; read by the controller.
- `window.__renderMode` — set by the controller; read by `app.js` (fixed-step time, no wall clock).
- `window.__renderResult` — set by the controller when the MP4 is ready.
- `window.SeedConsole` / `window.SeedConsoleAdapter` — the generation console.
- `window.__canalHooks` — **new, additive**: exposes the adapter's needs
  (`rng`, `fresh`, `mix`, `clamp`, `hash`, `codeOf`, `parseCode`, `cityFamily`,
  `changeWorld`, `disposeWorld`, `syncLensUI`, `defaults`, `controls`, `canvas()`,
  `config`/`smoothed`/`current`/`previous` via getters). The original shared these
  as top-level script bindings; modules keep them private, hence the hooks object.

## Determinism notes (verified 2026-09-23)

- The studio core is byte-identical to the original block 0 (verified by
  reconstruction). The modular `?render=1` output is pixel-identical across
  runs (frame 25, seed `PX1-1-yki20y-p5x77i-ca.bu.9t.jb.by.dj.hv.bl-L1.f0.5a`).
- **Pre-existing race found in the original**: `updateBlimpSign()` measures
  the scrolling blimp-sign text with `system-ui` (`measureText`) and caches
  the texture by `blimpSignKey`. `__renderReset()` did not clear that cache,
  so a render could keep a texture baked with fallback-font metrics from
  warmup frame 0. The original was observed producing two different
  frame-25 outputs across runs (13 pixels on the blimp); the modular build
  consistently produces the font-loaded variant.
- **One-line hardening** (in `app.js` `__renderReset`, render mode only):
  reset `blimpSignKey=''` so the sign re-renders after warmup with the
  loaded font. Same pattern the codebase already uses when the blimp
  message is edited. This upholds render mode's documented determinism
  contract; it does not change normal (non-render) behavior.

## Notes

- Block 0 had no top-level `return`, so no IIFE unwrapping was needed.
- `app.js` keeps the studio core as one module (same as the Molten slice);
  shader data was the clean separable seam. A deeper split of `app.js`
  (nature / city systems / buildings / render loop) is possible as a follow-up.
- Git history retains the pre-split single file for recovery.
