# Procedural Asset Studio

Open MOOR Forge → **Procedural assets**, or open the Studio directly. Wonder Feed is in the Studio header. The earlier Effects Studio remains available beside it. Everything works without an account; publishing remains MOOR's existing creator/launcher workflow.

## What is stored

A generator is `moor.procedural-recipe` v1: a seed, dimensions, up to eight family layers with parameters/transforms, and up to twelve model primitives. Geometry and frames are transient. A seed does not eliminate all storage: the engine, recipe, and any source image still exist. Source images are currently preview inputs and must be exported/transferred separately. A PNG is a deliberately baked snapshot.

Explicit saves use IndexedDB `moor-procedural-assets-v1`: at most 64 generators / 3 MB. Recipes reject unsupported versions and exceedance of 48 KB. No automatic save during scrolling. The original Effects Studio retains its separate versioned effect recipes, exact takes and storage limits.

## Useful workflow

1. Select a family, adjust seed and dimensions, and scrub time. Drag to orbit; use Front/Top and orthographic/perspective for clean inspection. There are no lens effects.
2. Add layers and tune their position/scale/rotation. The optional modeler supplies editable box, sphere and cylinder primitives in the same scene.
3. Save a named generator. Pulse's native Wonder Feed automatically registers it on this device; MOOR's built-in asset feed reads the same-origin local catalog. Origins do not share browser storage: transfer recipe JSON explicitly between Pulse and MOOR.
4. Export JSON for continuous seeded motion, SVG for frame/stroke glyph layers, or transparent PNG for a snapshot. MoorPack export packages the authoring app and current recipe with SHA-256 file integrity, using MOOR's existing format. Publish with MOOR Create/launcher.
5. **World placement** saves a compact binding and downloads it. On the same origin, the matching current Morverse runtime loads it. Between hosts, import that file in Morverse's Living assets panel. The City plugin grants only existing graphics/world/event/UI/private-storage capabilities; it does not change Core, ownership or commerce.

## Add a new generator cleanly

The single authoritative family catalog is `procedural-studio/core.mjs` (`apps/web/public/procedural-studio/core.mjs` in MOOR). Add its stable ID, friendly label, category and actual mathematical description to `FAMILIES`; expose only parameters that affect its output. Add its allowlisted parameter ranges to `PARAMS` and normalizer when genuinely needed. Implement its sampler case with `unit(seed,item,channel)` and absolute time; keep stable item IDs and lower LOD as a prefix/subset of the same items. No arbitrary code from imported recipes is executed.

Use existing primitive descriptions (`box`, `sphere`, `cylinder`, `segment`, `ring`, `leaf`, `water`, `image-strip`) or add a shared renderer primitive with disposal. Keep output ≤900 objects total, eight layers, and the global byte budget. Source assets must stay explicit rather than hidden inside seeds. Run the catalog checks; they iterate all families automatically for finite geometry, deterministic replay, seed variation, LOD and bounds. Inspect the new family in the browser as well.

Studio family selection and parameter controls, both feed registries and default examples consume `FAMILIES`, so no new card renderer or per-generator Pulse glue is necessary. A user-created variation only needs **Save generator**. To make a built-in preset, add a compact recipe and registry descriptor instead of storing generated frames. Keep the shared `core.mjs`/`scene.mjs`/`aquarium-math.mjs`/`world-plugin.mjs` copies byte-identical across MOOR, City and Pulse; update version only with explicit migration rules. Keep CI and native component manifest entries intact.

## Quiz Funnel automation

`window.MOORQuiz.compile(job)` uses the actual Quiz question bank and adaptive branches, reports missing answers, and labels supplied answers as agent reasoning. `automate(job)` traverses the canonical sealed Funnel, requires source references and obligation evidence, verifies the receipt, and hands the blueprint to Harness. It does not pretend the prototype Harness independently writes arbitrary code or verifies production.

The reproducible job is `docs/procedural-assets-quiz-job.json`; its run is `docs/procedural-assets-quiz-run.json`. Run `node scripts/run-procedural-quiz.cjs` from render-queue to execute the actual Quiz shell and kernel locally. Reuse the job format for future generators: verbatim input, answers, blueprint, references, obligationEvidence and doneCriteria. Missing answers or invalid choices return/block clearly; human drafts and locks are not overwritten. Model reasoning is supplied by the agent; the zero-key Quiz adapter does not invent autonomous intelligence.

## Exact limits

Thirty asset families plus six preserved particle presets. Soft bodies are analytic elastic animation, not collision physics. Talking rigs use explicit mouth envelope/speech shape rather than infer speech from audio. Stroke fonts support A–Z, 0–9 and simple punctuation as SVG glyph geometry, not a full multilingual TTF engine. Picture wrapping bends an explicitly uploaded image; it does not infer hidden depth. Aquarium reuses the original caustic GLSL and plant sway, with bounded analytic schools rather than porting the original ecological simulation. World placement stores twelve bindings, renders four scenes at low detail / 15 Hz, and uses the host's Three.js and actual scene.

Verification combines automatic geometry/input/receipt checks with rendered workflow inspection. Production availability is tracked separately from source commits and CI.
