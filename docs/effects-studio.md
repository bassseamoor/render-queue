# Procedural Effects Studio

Open `effects-studio.html`, or Pulse → Bin → Generators → Effects Studio.

The studio authors specific reusable procedural effects. An effect recipe is a stack of emitters with independent birth shape, motion, output, color and timing. It can render particles, laser beams, ribbons, energy rings and illuminated shards in one scene. Six examples are already registered in Wonder Feed: Prism Lance, Ion Bloom, Arc Halo, Ember Wake, Cryo Shatter and Aurora Loom.

## Research and Funnel

The original request is frozen in `docs/effects-studio.blueprint.json`. Its requirements preserve the explicit removal of lenses, reuse the verified feed limits, distinguish user instructions from inferred/fallback choices, and include a source inventory of 24 existing local effect generators. `scripts/run-effects-funnel.cjs` executes the actual `moor-request.js` router: original request → Funnel; inventory/research → Funnel; blueprint → Funnel; resolved execution → Harness. `docs/effects-studio-funnel-run.json` stores the envelopes and the three-field verdict. This is a zero-key local resolver pass with fallback provenance, not a claim that an external model reviewed or approved the design. The runtime imports the evidence into Pulse references on opening the normal Pulse page. The router queues execution; the implementation and verification were carried out by the builder.

| Researched system | Useful mechanism | Studio application |
| --- | --- | --- |
| [Epic Niagara](https://dev.epicgames.com/documentation/unreal-engine/overview-of-niagara-effects-for-unreal-engine) | A system contains emitters; modules govern behavior; renderers govern appearance. | Multiple layers with separate emission, motion and output fields. |
| [Unity Visual Effect Graph](https://docs.unity3d.com/Packages/com.unity.visualeffectgraph@17.0/manual/Contexts.html) | Separate spawn, initialize, update and output stages, with explicit capacity. | Seeded initialization, time-addressed motion and a separate bounded renderer. |
| [Godot complex emission shapes](https://docs.godotengine.org/en/stable/tutorials/3d/particles/complex_shapes.html) | Emission geometry is independent of appearance and can describe surfaces or volumes. | Six reusable shape modules. Arbitrary mesh-surface import is not implemented in v1. |
| [Babylon.js particle system](https://doc.babylonjs.com/features/featuresDeepDive/particles/particle_system/particle_system_intro) | Capacity, lifetime, emission shape and particle texture are authoring inputs. | Lifetime and capacity controls, procedural output shapes and optional embedded PNG sprites. |

This is an architectural synthesis, not an import of those engines or a claim of matching all their features. The existing local hard-coded effects were inspected as appearance/motion references; their scripts remain intact. No external effect source or texture was copied.

## Authoring

1. Start with an example, or add an emitter layer.
2. Choose output, emission shape and motion. Tune capacity, radius, speed, size, hue and glow. Open the timing section for lifetime, burst delay, gravity, opacity, blend and 3D position.
3. Drag the canvas to orbit, scroll to zoom, or use Front, Top and Iso. Orthographic and perspective are geometric projections. There are no lens distortions, depth of field, motion blur, vignette or chromatic aberration.
4. Pause and scrub time to inspect an exact frame. The seed, recipe and time determine the same geometry regardless of playback history.
5. Set Seed variation to zero to keep the overall design locked. Higher values let the seed vary palette, radius and speed within bounded ranges. Individual element positions still use the seed at zero variation.
6. Export a transparent PNG, a 24-frame transparent flipbook with replay metadata, or the complete recipe JSON.
7. Save generator to put the recipe in your device library and automatically add a generator to Wonder Feed. Reusing its stable ID updates the recipe. Seen/saved feed genomes retain the earlier embedded recipe and replay it with their original seed.

PNG sprites are optional. Import a valid PNG under 256 KB and 4 megapixels; it is embedded in the recipe, making exports portable. Procedural outputs work without image files. Glow adds luminous halos behind crisp cores; it is not a lens filter. PNG exports remove the backdrop and grid. The renderer approximates emissive lighting and shaded-looking shards; it does not provide scene lights, physically based mesh materials or physical collisions.

## AI and code contract

`effects-core.js` exports `MoorEffects` in the browser and the same API through CommonJS in tests. `normalize(recipe)` validates and sanitizes the typed recipe. `compile(recipe, seed)` creates reproducible element data. `sample(compiled, time)` returns 3D geometry. `renderer(canvas).draw(compiled, time, options)` draws it. There is no arbitrary script evaluation in imported recipes.

The studio exposes one shared interface:

```js
const {recipe, seed, time} = EffectsStudio.getRecipe();
recipe.layers[0].hue = 195;
recipe.layers[0].glow = 0.25;
EffectsStudio.applyRecipe(recipe, {seed: 'cyan-42', time: 1.3});
EffectsStudio.sample(1.3);
EffectsStudio.setTime(1.3);
await EffectsStudio.saveGenerator({id: 'cyan-lance', name: 'Cyan Lance'});
```

Native browser WebMCP tools, when supported, expose `effects_get_recipe`, `effects_apply_recipe`, `effects_sample`, `effects_set_time`, and `effects_save_generator`. They use the same validator and renderer as human controls. This adds structured manipulation, not an embedded LLM or an automatic prompt-to-effect service. The current official [WebMCP API](https://developer.chrome.com/docs/ai/webmcp/imperative-api) uses `document.modelContext`; the studio also feature-detects the older namespace. Unsupported browsers retain normal UI and JSON editing.

`effects/presets.json` holds example recipes. Add a repository example there and a descriptor to `wonder-generators.json`:

```json
{
  "id": "native-fx-preset-my-effect",
  "label": "My Effect",
  "category": "Effects",
  "page": "effects-studio.html?preview=1&preset=my-effect",
  "recipe": {"schema":"moor.effect-recipe","version":1,"name":"My Effect","layers":[]}
}
```

Replace the empty layers with a valid recipe; the validator requires at least one layer. The same descriptor recipe is embedded in each feed genome for durable replay. A generator saved through the studio creates this registration automatically on the current device. Repository examples are available to everyone; personal generators are local. Export/import their recipe JSON to transfer to another device, then save a stable generator ID there.

## Storage and performance

A seed avoids storing every generated frame; it does not mean zero storage. Code, recipes, seeds, saved sprites and saved result images still take space.

- Scrolling creates only temporary previews and compact in-memory genome history. The effects engine does not persist rendered frames or write generated images while browsing.
- Explicit generator saves use IndexedDB `moor-effects-v1` / `generators`. Each recipe is capped at 384 KB, including optional embedded PNG; at most 100 generator IDs. Updating an ID replaces one record.
- Feed Save stores an image and replay recipe in the existing Wonder Feed library. PNGs consume more space than recipes. Downloading PNGs or flipbooks creates files only when requested.
- The effects renderer allows 8 layers and 1800 elements total. Path renderers allow at most 48 instances per layer. Live rendering is capped at 30 FPS and 900,000 pixels; glow textures are cached by hue. Hidden pages pause drawing and disposal cancels RAF and observers.
- The shared feed keeps its limits: 3 live renderers, 1 native renderer, 60 mounted cards, 12 retained paused renderers and 48 offscreen posters. Every effect preview is isolated and lightweight; it does not boot the whole Pulse dashboard.

V1 is a 3D coordinate art renderer projected through Canvas2D. It works without WebGL and preserves crisp output. It is not an unrestricted GPU particle simulator, a general modeling package, a volumetric fluid engine or a production MOOR integration. Pixel output can differ slightly between browsers, while sampled geometry and recipes are deterministic. Device FPS remains a device-specific measurement.

## Release checks

Run:

```sh
node scripts/run-effects-funnel.cjs
node tests/effects-checks.cjs
node tests/wonder-haven-checks.cjs
node tests/wonder-scroll-checks.cjs
node tests/pulse-checks.cjs
node tests/moor-request-checks.cjs
node tests/funnel-checks.cjs
node tests/blueprint-checks.cjs
```

Verify actual studio controls, two different seeds, exact time replay, camera angles, both feed orientations, Save generator → feed registration, Save result → Saved → Open, transparent PNG alpha, flipbook export, and navigation into Funnel and back to Bin. Inspect capacities and live renderer counts. Record failures as evidence; passing a schema test alone is not proof of a rendered effect or user intent.
