# Fireplace module extraction

Project: `bassseamoor/render-queue`, existing GitHub Pages Fireplace Studio.
Base and recovery revision: `0278a61892cf06f4d4f8c6f3f30e10e539f07aba`.
Task: replace the 238,840-byte inline studio with accessible, independently
editable source modules; preserve the current image logic and keep obsolete
implementations out of the served tree.

## Delivered source

`fireplace.html` is a 1,155-byte shell loading `studios/fireplace/main.js`.
There are 41 JavaScript modules, organized by responsibility under `core/`,
`world/`, `renderer/`, `renderer/shaders/`, `ui/`, and `export/`.
The largest first-party module is the existing 24,931-byte seed console.
The 32 KB third-party MP4 muxer is separate and loads only in render mode.
Native modules are the source of truth; no bundler, regeneration, or duplicated
inline build is required. Named imports make dependencies visible and the
graph is acyclic.

The old fixed-step loop was shadowed by a later function of the same name.
Only the later active loop remains. Unused `FIXED_DT`, `seedText`, and
`resetSim` declarations were removed. Unreferenced root `fireplace.js` and
`fireplace-render.js` were deleted from the current tree. Historical source
and exact blob IDs remain recoverable through the pinned Git revision and
the recovery table in `studios/fireplace/README.md`. No executable archive
directory is shipped: `.nojekyll` would otherwise publish it.

The original URL, queue registration, artwork, seed packing, settings,
storage keys, lighting/shader bodies, eight render passes, and export hooks
were retained. Existing public FPFrames/FramesModule and SeedConsole aliases
are installed through the compatibility adapter. Other studios are untouched.

## Evidence and limits

- `node --experimental-vm-modules tests/fireplace/modules.test.mjs`: passed;
  all 41 modules parse and link, all imports resolve, one entry/loop exists,
  no cycles or old executable files exist, and preview excludes the MP4 library.
- `node --experimental-vm-modules tests/fireplace/parity.test.mjs`: passed;
  shader source submitted to the instrumented GL API matches the original.
  41 comparisons match material/geometry uploads, uniforms, draw commands,
  settings and seed state across five seeds, animation times, three resizes,
  dressing and parameter changes, and export warmup/record phases.
  Remix compatibility and repeated-start loop ownership also passed.
- `git diff --check`: passed. Self-review checked imports, resource lifetime,
  startup order, archive exclusion, queue hooks, and the unchanged GLSL.
- Real GPU pixels, physical-device behavior and encoded MP4: not verified.
  The available browser reports WebGL2 unavailable on the original live studio.
  The CPU test stubs shader status and normalizes GPU handles by resource type
  and uploaded content; it is not a GPU or image-equivalence test.

One existing issue is intentionally outside this extraction: the active
clock's bookkeeping advances `RM` even while pause/backpressure takes the
preview path. Address that as an explicit export-behavior fix, with a focused
clock test, rather than mistaking preserved behavior for a new guarantee.

Next: use the source map for targeted edits. On a WebGL2 device, inspect
`?seed=%2331A2B3C4D&sherr=1`, test portrait resize, seed controls, and a short
MP4 before claiming GPU/video validation. Resume from the README, relevant
owner module, and the two tests. Work used deterministic extraction and a
coordinator self-review; no delegated workers or cost savings are claimed.
