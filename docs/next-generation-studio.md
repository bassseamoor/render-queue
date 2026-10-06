# Next generation Effects Studio

The highest leverage goal is **discover and reuse**, explicitly chosen by Sebastian. The blueprint starts with open questions about outcomes, obstacles, preservation and excluded users; it does not start by assuming a new engine or more algorithms. A second pass asks how the first blueprint can remain useful as needs change. Both actual v44 Kernel/router runs and their append-only ledgers are in [the receipt record](next-generation-studio-funnel-run.json); [the full blueprint](next-generation-studio.blueprint.json) retains verbatim Page 0, answers, alternatives, provenance and acceptance criteria.

The agent supplied the reasoning. The Funnel enforced ordered stages, source-backed replay and receipt issuance; it did not independently infer these answers. No callable browser MOOR.request bridge was exposed, so the repository's actual Kernel and router ran locally, with this limitation recorded. The final receipt was issued before implementation. This is an integrity receipt in the existing client Kernel, not an external cryptographic signature. Technical verification does not prove that everyone is happy.

## The move

Explore four deterministic alternatives at the same moment. Lock individual layers to preserve their geometry, color and timing while the other layers vary. The original remains unchanged until **Use variant**. Undo/redo retains up to 20 edits in memory. Manual edits remain available on locked layers: locks apply to exploration, not the editor.

**Keep exact take** stores the normalized recipe, seed, camera and time. This differs from **Save generator**, which saves a recipe that can produce many seeded results. Reopen a take to restore its exact moment. Download/import its JSON to move it between devices. Saving a generator still registers it automatically in Wonder Feed; browsing creates no stored rendered frames.

Kept takes use a separate IndexedDB database, preserving existing generator data without a destructive migration. Admission checks and inserts occur in one read/write transaction. There are at most 24 takes and 2 MB of serialized take metadata. At the cap, download remains available; nothing is silently evicted. Browser storage is device-local and can be cleared; keep portable downloads of work you need to retain.

Comparison previews render four static canvases. They create no extra feed animation loops. The live canvas stops painting while paused and initially pauses when the device requests reduced motion. Camera controls and selection buttons are available without dragging. Path renderers use analytic path math: irrelevant shape/motion selectors are disabled and capacity follows their real 48-instance limit. PNG sprites are decoded before still/flipbook/comparison export rendering.

## Lasting value is an evidence loop

Value review records bounded counts for comparison, selection, keeping, reopening, successful export actions and generator saves. It keeps at most 12 optional notes of 500 characters. All of this is local; no service collects population analytics. It changes only on explicit actions, not while drawing or scrolling. Export actions are intention signals, not verified reuse elsewhere. Notes preserve the person's words instead of turning them into invented owner answers.

The review asks the next open question based on the observed gap: what prevented keeping, what prevented reuse, or what was useful to whom. Download it when deciding the next build. Feed that evidence back into the Funnel, preserving dissent and failures. Do not turn click counts into a claim of satisfaction. A hypothesis worth testing is that comparison plus preservation improves keep-to-reuse conversion; no adoption claim has been established yet.

## Add generators cleanly

1. Construct a `moor.effect-recipe` version 1 within `MoorEffects.limits`; call `MoorEffects.normalize` before rendering or saving.
2. From Studio, call `EffectsStudio.applyRecipe(recipe, {seed, time})`. Humans and AI use the same validator. `EffectsWorkbench.explore({locked: [layerId], round, strength})` returns four take recipes without changing or saving the current view.
3. Call `EffectsStudio.saveGenerator({id: 'your-stable-id', name: 'Your generator'})` only when ready to keep a generator. The existing `EffectsLibrary.descriptor` and `moor:effect-generator-saved` event register it with Wonder Feed automatically. Reusing an ID updates the generator; it does not rewrite old saved recipes or exact takes.
4. To ship a built-in example, add its recipe to `effects/presets.json` and matching `native-fx-preset-*` descriptor to `wonder-generators.json`. Test deterministic replay, capacity and the actual Feed path. Do not hand-add a second registry in the Studio.
5. For a new rendering primitive, extend `effects-core.js` enums, validator, sampler and renderer together; make inspector controls describe actual behavior. Keep existing v1 replay semantics or introduce an explicit new version with a tested migration. Unknown take/engine versions are rejected without editing the active state.

`EffectsWorkbench.getTake()` returns `moor.effect-take` version 1 / engineVersion 1. `useTake`, `keep`, `undo`, `redo` and `review` are available to integrations. WebMCP exposes read-only `effects_explore_variants` and `effects_get_exact_take` alongside the existing editing tools. Structured exploration returns recipes, not fabricated rendered results.

## Limits and next questions

This remains a bounded analytic 3D effects renderer projected through Canvas 2D. It has no physical fluid simulation, mesh modeling or GPU compute. There are no lens effects. Do not choose a broad engine migration until actual needs justify it. The next investigation should ask: which kept results became useful, where did portability fail, who could not operate the controls, and which missing effect could not be expressed by the current contract?

Research references: [W3C pause/stop/hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide) informed motion control; [IndexedDB 3.0](https://www.w3.org/TR/IndexedDB/) informed atomic storage admission. Existing [Effects Studio research](effects-studio.md) covers generator precedents and renderer tradeoffs. These choices do not establish full accessibility conformance.
