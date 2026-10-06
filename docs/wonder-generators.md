# Adding generators to Wonder Feed

Wonder Feed presents the result first. A model, plant, scene, animation or UI should occupy the preview; editor controls, prose and unrelated chrome do not belong in its card. A plant remains a plant: do not invent pots or scenery to disguise a weak generator.

## Automatic registration

Add one descriptor to the `generators` array in `/wonder-generators.json`:

```json
{
  "id": "native-my-generator",
  "label": "My generator",
  "category": "Models",
  "page": "my-generator.html",
  "canvasSelector": "#result"
}
```

The page must be same-origin. IDs are stable, unique and begin with `native-`. The loader registers the type with the canonical genome factory, validates saved genomes, adds it to the shuffled feed and generator selector, and updates already mounted feeds. Capture, organized saves, portrait/landscape framing, resource limits and failure handling come from the shared adapter. No edits to Pulse, the feed's picker or the feed's shuffle list are needed.

For a component that already has a Pulse tool, `component` can replace `page`. This compatibility path uses `workspace-tool=<id>`. Prefer a small dedicated preview page for new work so it does not boot the full dashboard. `/wonder-preview.html` already hosts six extracted core tools without the Pulse shell.

Code loaded after Wonder Feed may also call `WonderFeed.Haven.register(descriptor)`. Duplicate IDs and cross-origin page URLs are rejected. Registration is an opt-in presentation contract: arbitrary files and components are not guessed into the feed.

## Reliable new preview pages

Read `seed` and `wonder-preview` from the URL. Initialize from that seed instead of `Date.now()` or `Math.random()`. Render the actual result on one canvas, then expose this same-origin bridge:

```js
window.WonderPreview = {
  canvas: () => document.querySelector('#result'),
  setRecipe({seed, params}) {
    // Rebuild using your existing seeded generator, not a second renderer.
    render(seed, params);
  },
  dispose() {
    // Cancel RAF/timers; disconnect observers; dispose GPU/audio resources.
  }
};
window.addEventListener('pagehide', () => WonderPreview.dispose());
```

Keep `setRecipe` synchronous unless the canvas is absent until asynchronous rendering completes. The adapter polls for canvas initialization, mirrors at no more than 30 FPS, limits its output to 900,000 pixels, and removes the frame on suspension. On resume the genome and captured controls replay; do not start audio automatically. Preview failure remains queryable at `WonderFeed.Haven.failures`. In the All feed, unavailable kinds are excluded for that session and a real alternative replaces the failed card. A specifically selected failed generator shows an explicit unavailable state.

The bridge supplies a canvas; it does not yet capture arbitrary DOM UI or expose arbitrary parameter forms. A UI generator needs its own actual visual canvas output or a dedicated future DOM adapter. Do not register a text summary as a visual result.

## Legacy compatibility

Old pages without a bridge use best-effort seed input detection, seeded select/button choices, recorded control values and the largest visible canvas (or `canvasSelector`). These are compatibility adapters, not proof of deterministic replay. A page that ignores the seed or uses uncontrolled randomness needs an explicit bridge before promising reproducibility. Snapshot retention avoids rebuilding recently seen cards; evicted unsaved results may regenerate. Full saved images and recipes remain in device storage.

## Keep extracted previews current

After changing any of the six native tools in `pulse-dashboard.html`, run:

```sh
node scripts/build-wonder-previews.cjs
node tests/wonder-haven-checks.cjs
node tests/wonder-scroll-checks.cjs
node tests/pulse-checks.cjs
```

Commit both the original tool change and the generated `wonder-previews/*.js` files. The build extracts existing implementations and dependencies; it refuses to guess when a renderer is missing. Do not hand-edit generated files. They contain no Spine, Funnel UI, material chrome or background animation.

## Release gate

Verify through the normal Pulse URL and standalone feed. Check portrait, landscape, fullscreen enter/exit, continuous scrolling and return to a recent card, Save → Saved → Open, and leaving/re-entering the tool. Inspect `document.querySelector('.wh').parentElement._wonderApi.stats()` for mounted-card and renderer counts. The limits are 60 mounted cards, 3 live renderers and 1 live native renderer per mounted feed. Paused renderer retention is 12 and offscreen poster retention is 48.

For each new generator: replay the same seed twice, compare geometry/recipe state, test a different seed, resize both orientations, capture a nonempty PNG, and force an initialization error to verify cleanup. Test on the intended laptop and phone. Resource caps do not guarantee a particular FPS, and WebGL availability depends on the device.

The repair blueprint and original request are in `docs/wonder-scroll-repair.blueprint.json`; routed evidence is in `docs/wonder-scroll-funnel-run.json`. Runtime installation imports them into Pulse references with system provenance and queues the original input through `MOOR.request`. System choices do not overwrite owner answers.
