# Vita Verde — The Odd One

A seeded, 90-second procedural short film, built into the existing Studio. Version 1.0.0.

The first scene is a harvest. One bent carrot travels to the factory, goes down the **left** conveyor into a clean cardboard collection box, imagines being thrown away, and is chosen for a mixed delivery box. The story ends at a doorstep and then a dinner table. The grocery store is a cutaway: the hero never physically goes there. There is no actual trash disposal.

## Open the studio

Serve the repository root with any static HTTP server, then open `vita-verde.html`:

```sh
python3 -m http.server 8080
```

Open `http://localhost:8080/vita-verde.html`. Press **Watch the film**. Playback starts with sound after that click. Space plays/pauses; left/right arrows seek by one second; H hides the surrounding controls. The initial seed is `VV1-7C41A2`.

- The timeline and 20 shot buttons seek deterministically.
- Seed changes vary scenery and inventory details. Store and house selectors choose distinct building families. Story order, hero identity, conveyor routes and duration stay fixed.
- Landscape and portrait framing have separate camera accommodation.
- Save/Open project uses versioned JSON. Local storage remembers settings and the playhead.
- Save still includes the thought bubble/end card. Depth and AO views can be saved as separate PNGs.
- MP4 exports evaluate exact frame times at 24 fps; the full film is 2,160 frames. Audio is an original, deterministic score and foley. AAC capability is checked first; unsupported browsers can export silent video and a separate WAV. Cancel discards incomplete output.
- The Studio registry creates 90-second narrative jobs for this renderer, including when an ambient preset was previously selected. Other studios retain their existing presets.

The browser preview is **rasterized PBR**, with soft shadow maps, up to 4× MSAA, FXAA, depth AO, restrained depth of field and film grain. It is not a ray-traced render. Hands use joint animation, closed-form arm IK, wrist contact constraints, and slight palm compression. They are not a free-running soft-body simulation.

## Source boundaries

| File | Owns |
|---|---|
| `assets.mjs` | Procedural geometry, materials, seeded families, joints, mesh batching |
| `worlds.mjs` | Eight environments; protected story locations and seeded scenery |
| `timeline.mjs` | Shot manifest, validation/defaults, ownership and duration |
| `director.mjs` | Absolute-time movement, grips, cameras, expressions |
| `post.mjs` | Depth-based picture passes |
| `overlay.mjs` | Exported thought bubble and end card |
| `sound.mjs` | Deterministic original score and WAV output |
| `studio.mjs` | Playback, controls, persistence, PNG and WebCodecs MP4 |

World coordinates are metres, right handed, Y up. The carrot's origin is its tip; crown height is 0.31 m. The hero seed and hook remain fixed. Changing a world seed does not mutate the story. Backdrop meshes are batched by material. Shared asset geometry is reused; background carrots use a lower resolution mesh. Active hands, faces, wheels, hero and door remain independent.

The project reuses the repository's Three.js r160 and MP4 muxer, and adapts the existing road-trip renderer's post-processing/export approach. The 3D geometry is authored procedurally from the supplied visual references. No photo-to-mesh service was used. `brand.png` is the supplied Vita Verde logo. Unsupported nutrition and pesticide statements in the reference poster were not added.

## Verification

```sh
node --test tests/vita-verde/core.test.mjs
```

The checks exercise timeline coverage, deterministic scrubbing, hero identity, branch continuity and screen direction, ownership during the store cutaway, camera framing, protected belt spacing, wrist contacts, settings round-trip, seeded variation, sound output and queue integration. See `docs/vita-verde-handoff.md` for the actual execution evidence and limits.

## Native review render

This optional renderer uses the **same generated geometry, camera poses, material values and post shader** in an EGL context. It is a scene review render, not a browser screenshot or a WebGL integration test.

Requirements: Node, Python with `numpy`, `moderngl`, `Pillow`, an EGL-capable driver, and FFmpeg. Install Python dependencies in your preferred virtual environment. `VV_RENDER_DEPS` can name an existing dependency directory.

```sh
VV_FPS=24 node tools/vita-verde/capture.mjs /tmp/vita-verde-capture
python tools/vita-verde/render.py /tmp/vita-verde-capture --width 960 --height 540 --video vita-verde-preview.mp4
```

Without `VV_FPS`, capture generates 20 representative frames. `VV_SEED`, `VV_STORE`, `VV_HOUSE`, `VV_FORMAT` set the corresponding edition. `VV_TIMES=6.5,29.5,49,75,84` selects particular times. The capture contains per-frame object matrices and all required mesh/texture bytes.

## Cycles final-render path

The adapter has been executed in Blender/Cycles 4.5.12 using the Python 3.11 `bpy` distribution. Representative 960 × 540 frames were rendered at 32 samples with denoising, and separate 32-bit OpenEXR depth files were produced. The full 90-second Cycles sequence has not been rendered.

```sh
VV_FPS=24 node tools/vita-verde/capture.mjs /tmp/vita-verde-capture
blender -b --python tools/vita-verde/render_cycles.py -- /tmp/vita-verde-capture --frame 1152 --samples 128 --save
blender -b --python tools/vita-verde/render_cycles.py -- /tmp/vita-verde-capture --animation --samples 128
python tools/vita-verde/assemble.py /tmp/vita-verde-capture --output vita-verde-cycles.mp4
```

The adapter builds real mesh instances, surface materials, camera, lighting, DOF, Cycles denoising, PNG beauty frames and separate linear OpenEXR depth. `--save` saves the chosen scene snapshot as a `.blend`. Assembly verifies that all 2,160 beauty frames exist, then adds the animated thought bubble, end card and score. It does not stretch a single frame into a film. The provided 90-second review MP4 is the native raster render, the Cycles proof frames are separate.
