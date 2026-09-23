# Grand Tour — road-trip studio 1.0

Updated 2026-09-23. Canonical project: `bassseamoor/render-queue`. Initial worktree base: `67a7a21902ae126eb7abdd540fd700d11c22b969`; integration was reconciled against `7204620289e2a7aac33bc4036c326d706510343c` and the latest parent tree at publication. Inspect current main before editing: concurrent Road Atlas work is active.

## Outcome and scope

A new `roadtrip.html` entry in the existing studio, using the existing vendored Three.js r160. One original burgundy touring coupe travels through a seeded cypress, broadleaf and blue-aster mountain valley. Follow, low, profile, aerial and smoothly blended director cameras; three lighting moods; landscape, portrait and cinema compositions. PNG stills and silent H.264 MP4 clips are implemented. Preview is continuous; exported clips are **not seamless loops**. Direct UI exports run 5–60 seconds; queue requests support up to 300 seconds and reject longer requests visibly.

Owned files: `roadtrip.html`, `roadtrip.css`, `roadtrip.js`, `roadtrip-world.js`, `roadtrip-materials.js`, `roadtrip-post.js`, `roadtrip-muxer.js`, `thumbs/roadtrip.jpg`, the two `tests/roadtrip-*` checks, this handoff, the deployed-entry screenshot, and narrow registry/routing/render-URL additions in `index.html`. Existing studios and queue data are preserved.

## Implementation decisions

- Canonical seed: `TRIP1-9A71C3-B-C-10` (seed, mood, camera, speed). Scene links also preserve frame format, grain, quality and playhead.
- Streaming terrain uses a floating origin and deterministic world coordinates. Road clearance and global analytical surface normals avoid boundary seams. Near terrain gains detail; instanced plants use matching branch layouts across LODs and refreshed culling bounds.
- Four 2048 × 512 height-baked material bands provide albedo, normals, roughness and cavity AO. Terrain blends rotated samples; foliage has baked fine detail; flowers use original canvas-painted alpha textures. This is a procedural map set, not an imported photogrammetry asset or a single packed trim-sheet texture.
- Physical car materials, environment reflections, emissive lamps, soft shadow maps, up to 4× MSAA plus FXAA, depth AO, restrained DOF, depth-tested scattering, bloom, atmospheric haze and grain. HDR uses half-float targets when supported, with an 8-bit fallback.
- MP4 capture uses explicit fixed frame times, bounded encoder queues, frame-duration fallback, cancellation and nonempty-output checks. Only a successful **final** queue render attempts to mark its matching job done using the studio's existing connection. Previews leave job status unchanged.

## Verified evidence and limits

- JavaScript syntax and `git diff --check`: passed.
- `node tests/roadtrip-checks.mjs`: five seeds, 14,875 road-clearance samples, near/far terrain boundaries; maximum road grade 0.049081; position and normal seam errors zero.
- `node tests/roadtrip-muxer-check.cjs` (requires FFmpeg): actual bundled muxer, real H.264 packets, explicit duration fallback. FFprobe decoded 15 frames at 320 × 180 over 0.5 seconds.
- Actual sky and post GLSL compiled under standalone EGL/OpenGL after syntax adaptation. Offline source-geometry inspections covered follow, portrait, profile and aerial views. These are not browser/WebGL conformance checks.
- Thumbnail is an offline render of the actual procedural meshes and textures with the actual sky/post shaders and approximate standalone material lighting. It is **not a browser screenshot**.
- Pages deployment `ea56c5d4929e522308bd2b141c0edc60bb0ac534` completed successfully. In the live studio, entering “cinematic road trip through a cypress valley” selected Grand Tour; the Studios tab displayed its card and loaded thumbnail, and Open launched `roadtrip.html`. Evidence: `docs/roadtrip-studio-entry-ea56c5d.jpg`. No test jobs were created.
- The live renderer displayed the explicit graphics-unavailable state with rendering controls disabled. The available cloud browser returned no WebGL 2 context, including the default-power fallback. Browser animation, physical-material appearance, performance, on-device anti-aliasing, PNG capture and WebCodecs MP4 export remain **unverified**. No physical-device test was performed.

## Resume

Read these modules and current `index.html`. First useful next check: open the deployed studio in a WebGL-2-capable browser, inspect the canonical seed across shots and lighting, pause/restart, reopen a copied link, save a PNG, and decode a five-second 720p MP4. Inspect context-loss and cancellation paths. A successful Pages build proves deployment, not rendering. Always create publication trees on the latest parent and include only owned paths; a concurrent stale-tree commit already deleted this feature once and required restoration.
