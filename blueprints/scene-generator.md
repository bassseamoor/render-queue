# Scene Generator

# SCENE GENERATOR â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The drawer studio for building reproducible 2D scenes and living 3D worlds on the FORGE 2.0 runtime â roll a scene, remix it, save the seed, export stills and video.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Scene Generator is the moor app-drawer front end for building scenes on the FORGE 2.0 runtime â the user's procedural scene-construction runtime (engine and app kept separate, a stable plug-in system, one portable scene document format, deterministic randomness so the same seed always makes the same scene). It is a CREATE/EDIT/BUILD studio that produces portable scene documents, with the user's standardized generator interface: fully random, quasi-random, and fully customized generations; saveable seeds; a fresh random seed on every load; and iPhone video export to SSD. It hosts both lineages under one roof: FORGE 2.0 2D/canvas scenes (stacks of visual layers) and STRATA living-3D worlds (real depth and geometry) â honoring the user's STRATA correction: the image generator bakes production assets, but STRATA itself stays a living 3D world. It is the drawer home the user's direction demands â "FORGE is MOOR's procedural scene-construction runtime, not a one-off image generator" â not another image generator.

## 2. Who it's for

- The user, making ambient scenes, fireplace videos, or YouTube content: they roll a surprise scene, keep what they like, remix the rest, and export a still or send a video render to the phone queue â without touching anything technical.
- Builders and worker agents composing FORGE 2.0 scenes or STRATA worlds: they use the deeper EDIT/BUILD tools (scene graph, seed tree, render profiler, raw scene document) to assemble and debug scenes reproducibly from seeds.

## 3. What it does

- Builds 2D canvas scenes from the FORGE 2.0 layer stack (sky, sun/moon, stars, mountains, water, rain/snow/embers, film grain, vignette, light leak, vector drawing strokes) and living STRATA 3D worlds â in one studio.
- Offers the three generation modes: **fully random** (roll every parameter), **quasi-random** (lock the layers you like, roll the rest), and **fully customized** (hand-set everything).
- Gives a **fresh random seed on every load**, keeps seeds saveable, and supports `?seed=` share URLs that reproduce a scene exactly.
- Mixes the two lineages: a FORGE image can be baked as a production asset (skybox, texture, backdrop) and placed into the living STRATA world, which keeps its depth and geometry.
- Exports stills (PNG) and video (MP4), or queues a render for the phone render queue â honoring what the user learned about iPhones the hard way: video is assembled first then saved (the phone can't stream onto the SSD mid-render), the SSD must be exFAT or APFS, downloads cap at 256MB without direct-disk writing, and Safari downloads land in Files â Downloads, not Photos.
- Registers every saved scene recipe in the App Wrangler catalog as "needs-check" until the user's eyes approve it.

## 4. How you use it

1. You open it. A fresh random seed is already rolled for you.
2. You pick Scene (2D canvas) or World (STRATA 3D).
3. You tap **Surprise me** for a fully random scene, **Remix keeping locks** for quasi-random, or **Customize** to hand-set everything.
4. You lock the layers you like and remix the rest until it looks right.
5. You save/star the seed so the scene is reproducible forever.
6. You export a still, render a video, or queue the seed for the phone render queue â the export sheet shows the plain-language SSD steps and the 256MB cap warning before a long render.
7. You publish the scene recipe to the Wrangler catalog; it waits in "needs-check" until you approve it.

## 5. What you see

- **CREATE.** The simple studio: a big viewport, the Scene/World mode switch, the three generation buttons (Surprise me Â· Remix keeping locks Â· Customize), the seed display with save/star, and one-tap Export (still / video / queue-for-phone). Fresh random seed on every load.
- **EDIT.** The controls for the active layer/plugin stack, auto-generated from each plugin's schema â human labels ("sky," "water sparkle"), never raw keys. Lock toggles per layer, per-layer re-roll, undo/redo, and a plain-words readout of world facts (terrain height, water level).
- **BUILD.** The deep tools: scene graph, plugin browser, dependency graph, seed tree, live render-pass profiler (how long each rendering step takes), and the raw JSON view of the portable scene document, plus v1 recipe import. One tap away from CREATE â never in the way of it.
- **Scenes (library).** Saved scene documents: thumbnail, seed, mode, created date, Wrangler state; `?seed=` share URLs; an open-in-queue button to push a seed to the phone render queue.
- **Export sheet.** Stills (PNG, 1:1 / 4:3 / 16:9 / 9:16), video (quality tiers, MP4), phone queue (save a seed to the render-queue to-do list). The iPhone path shows the SSD steps and the 256MB cap warning in plain words before a long render starts.

## 6. What it needs

- The FORGE 2.0 runtime (the engine the scenes are built on) and the STRATA living-3D runtime â this app is their drawer front end, not a new engine.
- A device with local storage; scene documents are plain JSON, portable by copy/paste and `?seed=` URL.
- The phone render queue to-do list, for queue-for-phone renders.
- The App Wrangler catalog, to receive scene recipe registrations.
- Materials and textures from **material-lab** and **texture-tools**; asset baking in and out through **assets**; video work sent to **video-tools** (its Queue view is the phone render queue); audio beds from **audio-lab**.
- Nothing else: no accounts, no servers, no paid services.

## 7. Choices & settings

- **Default mode** (Scene or World; default: Scene). Pick the world you build in most.
- **Default aspect** for stills (1:1 / 4:3 / 16:9 / 9:16; default: 16:9). Change it for phone-wallpaper or vertical video work.
- **Render tier default** (quality tiers; default: balanced). Higher tiers look better and take longer.
- **Phone-queue target device** (which phone receives queued renders; default: your iPhone). Set once.
- **Anti-clunk profile** (strict = CREATE-only chrome; standard = EDIT/BUILD one tap away; default: standard). Strict hides everything but the simple studio.
- **Seed history length** (how many past seeds are kept; default: keep all). Trim if it gets huge.
- **SSD format reminder** (exFAT/APFS note; default: show once, with "don't show again"). One tap to silence it forever.

## 8. Rules it never breaks

- **Never** become clunky: every new control must pass the standardized UI bar and keep one-tap export one tap â a gate, not a guideline. *(you: the user's direct "must avoid becoming clunky" order)*
- **Never** let the image generator replace the living world: baked images feed STRATA production assets, but STRATA itself stays a living 3D world with depth and geometry. *(you: the user's STRATA architecture correction)*
- **Always** give a fresh random seed on every load, keep seeds saveable, and make `?seed=` URLs reproduce the scene exactly. *(you: the standardized generator UI requirement)*
- **Never** hide the technical depth entirely: CREATE stays simple, but EDIT/BUILD stay one tap away. *(funnel-filled: the only way to satisfy both the anti-clunk order and the runtime-depth locks)*
- **Always** state the iPhone facts plainly before a long render: video is assembled then saved (no streaming to SSD), SSD must be exFAT or APFS, 256MB cap without direct-disk writing. *(you: learned from the user's real workflow)*
- **Never** ship a scene recipe without registering it in the App Wrangler catalog as "needs-check" until the user's eyes approve. *(you: standing rule)*
- **Always** use plain, non-technical language in the UI â human labels, never raw setting keys. *(you: standing product rule)*
- **Always** keep the user's iPhone 17 Pro Max as the final visual judge â any STRATA-facing claim is pending their eyes. *(you: standing honesty rule)*

## 9. Done means

1. CREATE â surprise â lock â remix â save-seed â export-still completes with zero errors; reloading the `?seed=` URL reproduces the scene pixel-deterministically.
2. Quasi-random demonstrably works: locked layers are byte-identical after Remix; unlocked layers change.
3. A mixed scene works: a FORGE-baked backdrop appears inside a STRATA world that retains depth and geometry (camera parallax is visible).
4. Phone queue works: a seed pushed from Scenes appears in the render-queue to-do list; the export sheet states the iOS facts (assemble-then-save, exFAT/APFS, 256MB cap) in plain words before a long render.
5. Every saved scene auto-registers in Wrangler as needs-check; the user's approval flips the state.
6. The anti-clunk gate holds: the CREATE view contains only viewport, mode switch, three generation buttons, seed row, and export â verified by a UI element count check; EDIT/BUILD reachable in one tap.
7. Final visual judgment is the user's iPhone 17 Pro Max (honest limit carried from STRATA).

## 10. Build order

*(funnel-filled â ordering the plan's existing scope by dependency; no new features invented)*

1. **CREATE studio first.** Viewport, Scene/World switch, the three generation buttons, seed display with save/star, one-tap export, fresh seed on every load. Checkable: surprise â save seed â reload the `?seed=` URL reproduces the scene exactly.
2. **EDIT tools next.** Schema-generated inspector, lock toggles, per-layer re-roll, undo/redo. Checkable: locked layers stay byte-identical after Remix while unlocked layers change.
3. **Scenes library + export sheet next.** Saved scene documents with thumbnails and Wrangler states; stills, video, and queue-for-phone exports with the plain-language iOS facts. Checkable: a queued seed appears in the phone render queue to-do list.
4. **BUILD tools next.** Scene graph, plugin browser, dependency graph, seed tree, render profiler, raw JSON view, v1 recipe import â one tap from CREATE. Checkable: a scene's render passes profile live in the profiler.
5. **Mixed 2D/3D scenes last.** Baking FORGE images as production assets and placing them into living STRATA worlds. Checkable: a baked backdrop sits in a STRATA world with visible camera parallax. (Last because it depends on everything else working; STRATA claims stay pending the user's eyes.)
6. **Wrangler auto-registration throughout.** Every saved scene registers as needs-check. Checkable at each stage.

## 11. Technical map

Repo and branch: **not yet assigned â this is a project with no working version yet.** Built on the FORGE 2.0 runtime (`new Forge({plugins}).mount('#viewport')` SDK shape, LayerPlugin API: schema, defaults, deterministic randomize, render, serialize, migrate, auto-generated inspectors) and the STRATA living-3D runtime. Read-only lineage references (deployed, untouched): FORGE 2.0 at https://bassseamoor.github.io/render-queue/forge-2.html (+ forge-sdk.js); STRATA at https://bassseamoor.github.io/render-queue/strata.html; FORGE v1 image engine at https://bassseamoor.github.io/render-queue/forge.html. Storage: local-first; scene docs are plain JSON, portable by copy/paste and `?seed=` URL.

Data entities (the lists the builder works from):

- `scene_doc`: the canonical portable FORGE 2.0 document (versioned; v1 recipes migrate) + optional `world` block (STRATA: terrain seed, object placements, baked-asset refs).
- `layer_state`: per plugin â params, seed, locked, visible, opacity.
- `seed_record`: master seed, per-layer/per-stream seeds (namespaced deterministic RNG), created_at, source (surprise/remix/custom), starred.
- `render_job`: scene ref, output (still/video), tier, destination (local/phone-queue), status (queued/rendering/done; iPhone sleeps â paused with Continue).
- `wrangler_entry`: scene id, name, thumbnail, state (needs-check/approved).

Technical notes: 11 built-in plugins (sky, sun/moon, stars, mountains, water, flow lines, rain/snow/embers, film grain, vignette, light leak, vector drawing strokes); CREATE/EDIT/BUILD modes are disclosure levels over the same runtime; render passes are explicit and profiled; a world/context bus carries shared facts (terrain height, water level); undo/redo across edits.

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0). Built via the quiz-funnel workflow; worker-filled; zero human answers. Provenance: "you" = the user's documented requests; "funnel-filled" = worker-authored default; "you-adjacent" = from documented user-approved material, but the term's use in this app is worker-authored. (The old files used "from-you" and "filled-in"; tags renamed here, meanings unchanged.)

**Source material gathered (the ramble, with sources):**
- FORGE 2.0 is MOOR's procedural scene-construction runtime: engine/app separation, stable LayerPlugin API, canonical portable scene documents (v1 recipes migrate cleanly), schema-generated inspectors, namespaced deterministic RNG, world/context bus, explicit profiled render passes, undo/redo, seed tree, 11 built-in plugins, CREATE/EDIT/BUILD modes, standalone SDK. Live: https://bassseamoor.github.io/render-queue/forge-2.html (+ forge-sdk.js); headless-verified 21/21. (MEMORY.md L55; memory/2026-09-22.md#L200)
- The user's durable product direction: **"FORGE is MOOR's procedural scene-construction runtime, not a one-off image generator. The current image editor should become its first reference implementation."** Next-pass priorities: engine split, versioned plugin API, one canonical portable scene document, schema-generated controls, fully namespaced deterministic RNG, world/context bus, explicit profiled render passes â "not another batch of visual effects." (memory/2026-09-22.md#L177)
- After seeing the FORGE image-engine mockup, the user said the finished tool needs refinement, **must avoid becoming clunky**, and should be directed toward **highly detailed textures, baked geometry, and consistently solid results.** (memory/2026-09-21.md#L303)
- STRATA world engine: real-3D studio, live at https://bassseamoor.github.io/render-queue/strata.html; the user **rejected the flat STRATA output** and clarified the architecture: **use the image generator to bake production assets, but make STRATA itself a living parallax/3D world with depth and geometry.** (MEMORY.md L59; memory/2026-09-22.md#L226)
- Standardized generator UI (user's requirement, all content generators): fully random, quasi-random, and fully customized generations; saveable seeds; **fresh random seed on every load**; easy iPhone video export to SSD. (MEMORY.md L19; memory/2026-09-21.md#L129)
- Phone render queue goal: save a seed from any generator into a to-do list, open the queue on any phone, tap the seed to render for the SSD; one-tap fixed-step export. (~/workspace/goals/phone-render-queue-for-saved-seeds/GOAL.md)
- iPhoneâSSD workflow facts from practice: the phone cannot stream video onto the SSD during the render (iOS restriction â the video is assembled first, then saved); the SSD must be exFAT or APFS (iPhones can't write NTFS); without direct-disk writing the phone caps downloads at 256MB; Safari downloads land in Files â Downloads; the user was confused when a download didn't appear in Photos. (memory/2026-09-23.md#L589; memory/2026-09-23.md#L20)
- Fireplace video generator for YouTube goal: high-quality shippable ambient fireplace videos for YouTube monetization. (~/workspace/goals/fireplace-video-generator-for-youtube/GOAL.md)
- "Still open: the 'all renderers in one app' hub (user pivoted before it was built; offer next)." (MEMORY.md L58)
- Standing rules: plain non-technical UX; local-first; everything registered in the App Wrangler catalog (MEMORY.md L30); no spending; phone is iPhone 17 Pro Max, its eyes are final visual judgment.

**Distilled spec (informing blanks 1â3):** Scene Generator is the moor app-drawer front end for building scenes on the FORGE 2.0 runtime: a CREATE/EDIT/BUILD studio producing portable scene documents, with the standardized generator UI (random / quasi-random / fully custom, saveable seeds, fresh seed on every load, iPhone video export to SSD). It hosts both lineages: FORGE 2.0 2D/canvas scenes (LayerPlugin stack) and STRATA living-3D worlds (depth + geometry), with the user's STRATA correction honored â image baking feeds 3D production assets; the world itself stays living.

**Explicit ramble gaps (kept, not invented):**
- GAP-1: The user never asked for a "Scene Generator" app by name; the slug comes from the parent's assignment. The app is worker-authored as the drawer home for FORGE 2.0.
- GAP-2: "Quasi-random" was never defined by the user (MEMORY.md L19 uses the term without definition). This plan defines it as "lock some layers, roll the rest" â worker-authored, flagged.
- GAP-3: Whether 2D FORGE scenes and STRATA 3D worlds are one app or two was never stated; this plan unifies them (the "all renderers in one app" hub was pivoted away from, not cancelled â open to offer).
- GAP-4: The user never specified which export formats scenes need beyond PNG stills and iPhone video export.
- GAP-5: STRATA's real-3D runtime is unverified on the user's phone; any STRATA-facing UI claims are pending their eyes.

**Quiz â 8 questions (all options valid; worker-filled, zero human answers):**

- **Q1. What does Scene Generator build on?** A) FORGE 2.0 runtime only (forge-sdk.js, LayerPlugin API) Â· B) FORGE 2.0 + STRATA living-3D under one roof Â· C) A brand-new engine â **B.** *you* â the user's durable direction makes FORGE 2.0 the scene-construction runtime (memory/2026-09-22.md#L177), and the "all renderers in one app" hub is explicitly still-open to offer (MEMORY.md L58); the STRATA correction (memory/2026-09-22.md#L226) requires both to coexist.
- **Q2. How do 2D scenes and 3D worlds relate here?** A) One scene document can mix FORGE layers and STRATA 3D (image-baked assets feed the 3D world) Â· B) Two separate modes, share only the seed system Â· C) 3D is out of scope; 2D only â **A.** *you* â exactly the user's STRATA architecture correction: "use the image generator to bake production assets, but make STRATA itself a living parallax/3D world with depth and geometry."
- **Q3. What do the three generation modes mean?** A) Fully random = every parameter rolled; quasi-random = lock some layers, roll the rest; fully customized = hand-set everything Â· B) Random vs custom only, no middle mode Â· C) Presets only â **A.** *you + funnel-filled* â the three modes are the user's words (MEMORY.md L19); the definitions are worker-authored (GAP-2, flagged), shaped by FORGE v1's proven lock-aware Remix. Quasi-random = the lock list is the steering wheel.
- **Q4. Seed behavior on load?** A) Fresh random seed every load + saveable seeds + ?seed= share URLs Â· B) Fresh seed, no saving Â· C) Remember last seed â **A.** *you* â verbatim the user's standardized UI requirement (MEMORY.md L19); ?seed= URLs are the FORGE v1 proven mechanism (MEMORY.md L58).
- **Q5. Video export target?** A) iPhone â SSD workflow with the phone-render-queue to-do list Â· B) Export on this device only Â· C) Both: render locally or queue for the phone â **C.** *you + funnel-filled* â the iPhoneâSSD export is the user's requirement (MEMORY.md L19) and the phone render queue goal exists for exactly this; "both" is worker-authored (forcing phone-only would strand desktop renders; forcing local-only ignores the phone-as-renderer workflow). Export honors the learned iOS facts (memory/2026-09-23.md#L589, #L20).
- **Q6. How much of FORGE 2.0's BUILD mode shows by default?** A) Progressive: CREATE by default, EDIT/BUILD one tap away Â· B) Everything visible (power-user studio) Â· C) CREATE only; BUILD lives elsewhere â **A.** *funnel-filled* â the user's anti-clunk order (memory/2026-09-21.md#L303) kills "everything visible" in practice; hiding BUILD entirely would strand the profiler/dependency tools the runtime was built for.
- **Q7. Anti-clunk rule (user: "must avoid becoming clunky")?** A) Hard gate: every new control must pass the standardized UI + one-tap export bar Â· B) Guideline only â **A.** *you* â "must avoid becoming clunky" was the user's direct order (memory/2026-09-21.md#L303).
- **Q8. Wrangler registration?** A) Every saved scene recipe registers as a Wrangler entry (needs-check until user approves) Â· B) Only published scenes Â· C) No registration â **A.** *you* â standing rule, everything built registers (MEMORY.md L30).

**Version locks (v1.0, carried from the prior edition):**

- Piece 01 â Q1 engine â FORGE 2.0 runtime + STRATA living-3D under one roof. Provenance: you (memory/2026-09-22.md#L177; MEMORY.md L58).
- Piece 02 â Q2 2D/3D relation â mixed scenes; image baking feeds the living 3D world. Provenance: you (memory/2026-09-22.md#L226).
- Piece 03 â Q3 modes â random = roll all; quasi-random = lock some, roll rest (worker-defined, flagged); customized = hand-set. Provenance: you (MEMORY.md L19) + funnel-filled definitions.
- Piece 04 â Q4 seeds â fresh random seed every load; saveable; ?seed= URLs. Provenance: you (MEMORY.md L19; MEMORY.md L58).
- Piece 05 â Q5 export â local render + phone queue; iOS facts honored. Provenance: you (MEMORY.md L19; goal phone-render-queue-for-saved-seeds; memory/2026-09-23.md#L589).
- Piece 06 â Q6 disclosure â CREATE default; EDIT/BUILD one tap away. Provenance: funnel-filled (anti-clunk lock).
- Piece 07 â Q7 anti-clunk â hard gate on new controls. Provenance: you (memory/2026-09-21.md#L303).
- Piece 08 â Q8 Wrangler â every saved recipe registers as needs-check. Provenance: you (MEMORY.md L30).
