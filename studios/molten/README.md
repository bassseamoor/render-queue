# Molten Studio — module source map

Ported 2026-09-23 from the 131,234-byte single-file `molten.html` (pre-split blob
recoverable via Git history). The public URL `molten.html` is now a thin loader;
all logic lives here. No bundler, no build step — native ES modules.

## Layout

| File | Owns | From |
|---|---|---|
| `main.js` | Entry point. Imports the modules below in the exact order the original `<script>` tags ran (side-effect order matters: the app sets `window.__moltenHooks` before the adapter reads it; the export controller runs last so its `window.__renderReset` wins, as before). | new |
| `app.js` | Studio application: defaults/ranges/presets, seeded state (`buildBlobs`), WebGL2 setup, lava scene render, pointer/wheel controls, snapshot/toast UI, `?render` frame-loop hook, agent tool registration. Sets `window.__moltenHooks`, `window.__renderCanvas`, `window.__renderReset`. | molten.html block 3 (IIFE unwrapped; shader `<script>` lookups replaced with `./shaders.js` imports; the IIFE's two early `return`s became a labeled `break boot;` — same control flow) |
| `shaders.js` | GLSL sources, verbatim: `VERT_SRC`, `SCENE_SRC`, `POST_SRC`. | molten.html x-shader blocks |
| `ui/seed-console.js` | Seed Console v2 — the shared generation console (Random / Remix / Customize, favorites, recordings). Sets `window.SeedConsole`. Verbatim. | molten.html block 4 |
| `ui/adapter.js` | `window.SeedConsoleAdapter` wiring the console to this studio's state (seed get/set, hero params, favorites key `sc.molten.favs`, file base). Calls `SeedConsole.init(...)`. Verbatim. | molten.html block 5 |
| `export/muxer.js` | mp4-muxer v5.2.1 (third-party, verbatim). Exports `Mp4Muxer`; loads only in render mode. | molten.html block 6 |
| `export/controller.js` | Fixed-step render-mode controller (`?render=1&seed=&fps=&seconds=&qid=&w=&h=`): WebCodecs H.264 `VideoEncoder` + muxer, deterministic `dt=1/fps` loop, progress/result reporting via `window.__renderMode` / `window.__renderResult`. Verbatim except `import { Mp4Muxer }`. | molten.html block 7 |

## Dependency graph (acyclic)

```
main.js
 ├─ app.js ──────────► shaders.js
 ├─ ui/seed-console.js      (side effects → window.SeedConsole)
 ├─ ui/adapter.js           (reads window.__moltenHooks, window.SeedConsole)
 ├─ export/muxer.js         (exports Mp4Muxer)
 └─ export/controller.js ──► export/muxer.js
```

Cross-module communication keeps the original `window.*` contracts
(`__moltenHooks`, `__renderCanvas`, `__renderReset`, `SeedConsole`,
`SeedConsoleAdapter`, `__renderMode`, `__renderResult`) — these are the
public hooks the queue and render mode rely on.

## Verification (2026-09-23)

- `node --check` (module goal): all 7 modules pass.
- Headless Chromium + SwiftShader, `?seed=271828`: 0 page errors, 0 console
  errors; canvas non-blank (pixel range 7–218); all hooks present
  (`__renderCanvas`, `__renderReset`, `__moltenHooks`, `SeedConsole`, `SeedConsoleAdapter`).
- Determinism: same seed reloaded → pixel-identical screenshot (MD5 match).
- Parity: first frame after `__renderReset()` is pixel-identical between the
  original single file and the modular build (same seed, same viewport).
- `?render=1` render-mode boot: no page errors; `window.__renderMode` set.
- Not verified: real-GPU pixels, physical iPhone, full-length MP4 encode.

## Recovery

Pre-split single file: `molten.html` at commit `4add7cd0` (131,234 bytes).
Full history in Git; no archive folder shipped (`.nojekyll` site).
