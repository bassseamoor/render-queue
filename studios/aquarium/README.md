# Aquarium Studio — module source map

Modularized from the single-file `aquarium.html` (script blocks 0–5, in
order). The HTML file is now a thin loader: identical markup/CSS, one
`<script type="module" src="studios/aquarium/main.js">`.

## Modules

| File | From | Responsibility |
|---|---|---|
| `main.js` | — | Entry point. Import order mirrors the original `<script>` order. |
| `app.js` | block 0, minus shaders | Studio core: settings + `#XXXXXXXX` seed system, `generateScene`/`regenerate`/`regenerateAsync`, WebGL aquarium (background, light rays, water surface, sand, rocks, plants, fish, particles, grade, SIL/CORAL/JELLY), render-mode hooks, UI panels. |
| `shaders.js` | block 0 (pure data) | All GLSL sources: `FOG_GLSL`, `CAUSTIC_GLSL`, `BG_VS/FS`, `RAY_FS`, `SURF_VS/FS`, `SAND_VS/FS`, `ROCK_VS/FS`, `PLANT_VS/FS`, `FISH_VS/FS`, `PTS_VS/FS`, `GRADE_FS`, `SIL_VS/FS`, `CORAL_VS/FS`, `JELLY_VS/FS`. No imports, no side effects. |
| `ui/toggle.js` | block 1, verbatim | The uiToggle show/hide interface button. |
| `ui/seed-console.js` | block 2, verbatim | Seed Console v2 (shared with the other studios). Sets `window.SeedConsole`. |
| `ui/adapter.js` | block 3, re-hooked | Aquarium adapter: `window.SeedConsoleAdapter`. Seed format `#XXXXXXXX`. Reads studio state through `window.__aquariumHooks` (`seedText`, `generateScene`, `refreshSeedUI`, `saveSettings`, `regenerate`, `regenerateAsync`, `settings` getter/setter). |
| `export/muxer.js` | block 4 | mp4-muxer v5.2.1 (third-party). Exports `Mp4Muxer`. Render mode only. |
| `export/controller.js` | block 5 | Fixed-step `?render=1` video controller. Imports `Mp4Muxer`; drives the studio through `window.__renderCanvas` / `window.__renderReset` / `window.__renderMode` / `window.__renderResult`. |

## Contracts (unchanged from the single file)

- `window.__renderCanvas`, `window.__renderReset` — set by `app.js`; read by the controller. (`__renderReset` re-seeds the streams and calls `generateScene(settings)` with no re-seed.)
- `window.__renderMode` — set by the controller; read by `app.js` (fixed-step time via `rmBookkeep`, no wall clock).
- `window.__renderResult` — set by the controller when the MP4 is ready.
- `window.SeedConsole` / `window.SeedConsoleAdapter` — the generation console.
- `window.__aquariumHooks` — **new, additive**: exposes the adapter's needs
  (`seedText`, `generateScene`, `refreshSeedUI`, `saveSettings`, `regenerate`,
  `regenerateAsync`, `settings` via getter/setter). The original shared these
  as top-level script bindings; modules keep them private, hence the hooks
  object.

## Determinism notes (verified 2026-09-24)

- The studio core is byte-identical to the original block 0 (verified by
  reconstruction: reinsert the 24 extracted shaders, remove the module-only
  header/import/hooks). The UI toggle, Seed Console, adapter logic, muxer,
  and render controller are behavior-identical to the single file.
- FOG_GLSL declares `uFogColor` — the SIL/CORAL/JELLY shaders must not
  redeclare it (that caused the 2026-09-20 black-screen bug; the fix is
  preserved verbatim in `shaders.js`).
- Git history retains the pre-split single file for recovery.
