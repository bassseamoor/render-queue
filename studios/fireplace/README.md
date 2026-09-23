# Fireplace Studio source map

`fireplace.html` loads `main.js`, which starts `studio.js`. These native ES modules
are the live source; there is no generated HTML bundle to patch or regenerate.
The studio URL, queue entry, artwork atlas, local storage keys, packed seeds,
render parameters, and public queue hooks keep their existing contracts.

## Find the right brick

| Change | Owner | Boundary |
| --- | --- | --- |
| Startup and load failures | `main.js`, `studio.js` | One startup sequence; export code loads only for `?render=1` |
| Seed interpretation and packing | `core/seeds.js`, `core/settings.js` | Pure codec plus shared settings; keep the v3 radix order compatible |
| Scene rebuilds and remix | `core/controller.js` | Applies seeds, rebuilds world and particles, resets the clock |
| Time, resize, export cadence | `core/clock.js` | Sole owner of the animation loop and mutable time |
| Shared scene data | `core/state.js` | `S` contains draw descriptions; `TEX` contains baked material handles |
| Room, hearth, deck, and mountains | `world/scene.js` | Seeded geometry descriptions in meters; writes `S` |
| Camera positions and motion | `world/camera.js` | Time and settings → camera |
| Texture baking | `world/materials.js` | Deterministic albedo, AO, normal, and roughness maps |
| Mesh primitives | `world/geometry.js` | Geometry → GPU meshes |
| Fire and weather particles | `world/particles.js` | Instance data, log segments, particle draw uniforms |
| Flame appearance | `renderer/shaders/fire.js` | `PART_VS` / `PART_FS`; coordinate uniforms with `world/particles.js` |
| Shag and upholstery detail | `world/surface-detail.js`, `renderer/shaders/detail.js` | Instanced surface geometry and shading |
| Birds, insects, and other life | `world/life.js`, `renderer/shaders/life.js` | Seeded event simulation and rendering |
| Wall art and mantle dressing | `world/artwork*.js`, `world/dressing.js` | Artwork API, GPU instances, separately persisted dressing state |
| Material lighting, lake, glass, sky | `renderer/shaders/` | One file per shader family; shared GLSL lives in `common.js` |
| GL setup and shader diagnostics | `renderer/context.js`, `renderer/programs.js`, `ui/diagnostics.js` | WebGL2 context and compile/link reports |
| MSAA, depth, shadow, resolve targets | `renderer/targets.js` | Owns allocation/resize; exports live bindings for changing handles |
| Render order | `renderer/passes.js`, `renderer/draw.js` | Existing eight-pass pipeline and individual draw helpers |
| Console, favorites, recording controls | `ui/seed-console.js`, `ui/controls.js` | UI → controller, existing storage and adapter contract |
| Queue compatibility | `ui/compatibility.js` | Explicit `window.__fp*` / `window.__render*` bridge |
| MP4 export | `export/controller.js` | Render phases → WebCodecs and download |
| MP4 container library | `export/mp4-muxer.js` | Existing vendored v5.2.1; keep separate from first-party logic |
| Page presentation | `studio.css`, `fireplace.html` | Styles and accessible page shell |

## Replace one brick

1. Open its owner above and inspect the named imports and exports. Avoid adding
   another global dependency, a second loop, or an inline copy in the HTML.
2. Change the implementation behind that interface. When changing a shader
   uniform or coordinate convention, update its matching draw module together.
3. Run `node --experimental-vm-modules tests/fireplace/modules.test.mjs`.
   This checks the source graph, missing files, cycles, size limits, and the
   single entry/loop. It links the modules without claiming to render pixels.
4. For an extraction/refactor, compare against the archived implementation with
   `node --experimental-vm-modules tests/fireplace/parity.test.mjs`.
   This executes both engines with an instrumented GL API and compares shader
   strings, data uploads, uniforms, draw commands, settings, and saved seeds.
   An intentional visual change should update the relevant expectations; do not
   suppress differences indiscriminately.
5. Check the actual image and interactions in a WebGL2 browser, including a
   portrait resize and a short MP4. The CPU comparison cannot establish GPU
   compilation, final pixels, or hardware encoder behavior.
6. Remove superseded code from the current tree. Record its old commit and path
   in the existing handoff/history; never import an archive as a fallback.

The dependency graph is acyclic. GPU resources stay with their owner; changing
framebuffer bindings are live ESM exports, not snapshots copied at startup.
The only intended browser-global integration is the existing UI/export contract
and diagnostics. New subsystem code should use named imports.

## Recovery without shipping the old build

The immutable archive is commit
`0278a61892cf06f4d4f8c6f3f30e10e539f07aba` in this repository:

| Historical path | Git blob | Why it leaves the current tree |
| --- | --- | --- |
| `fireplace.html` | `aa6e18c9e54e19151e662fc19075522e709e13f7` | Original 238,840-byte inline studio; replaced by the module loader |
| `fireplace.js` | `ac55cb1f007a64a96a872a72c34744ce04883e92` | Unreferenced earlier studio implementation |
| `fireplace-render.js` | `19719a772e799f9537652d0a7be555b358764616` | Unreferenced earlier renderer/exporter implementation |

Inspect without restoring it into Pages:

```sh
git show 0278a61892cf06f4d4f8c6f3f30e10e539f07aba:fireplace.html
```

Use a temporary directory outside the site root for old executable copies.
This repository has `.nojekyll`, so an `_archive` directory would still be
published by Pages. Git history preserves recovery without serving duplicate
implementations. To roll back the integration, revert the modularization commit
as a unit after reviewing later changes; do not mix the old entry with new code.

The shadowed fixed-step `tickFrame` / `frameLoop` declarations, their unused
`FIXED_DT`, and unused seed/reset helpers were removed. The later active loop
and all GLSL bodies were preserved. The old camera radix of six is intentional
for compatibility in this refactor even though the UI lists nine cameras.
