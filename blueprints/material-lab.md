# Material Lab

# MATERIAL LAB â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The materials companion to Scene Generator â author surface materials (stone, moss, metal, fabric) as editable, seeded, reproducible recipes and bake them to seamless tiling textures.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Material Lab is the materials companion to Scene Generator: a procedural material authoring studio built on the FORGE image-engine lineage â stacked visual layers, each with its own seed, lock, and settings. It produces tileable, seeded, reproducible surface materials â the color, detail, and depth maps that make surfaces look like stone, wood, moss, or metal â for use in FORGE 2.0 scenes and STRATA worlds. It treats each material as an editable recipe (FORGE v1's proven model: nothing baked until you say so, everything re-creatable exactly), bakes tileable PNGs or full PBR map packs (PBR = physically-based rendering: a set of maps â color, bump/relief, shine/roughness, metalness â that describe how light plays on a surface), and registers materials in the App Wrangler catalog. It exists to serve the user's direction for FORGE work: refinement, no clunk, toward highly detailed textures, baked geometry, and consistently solid results.

## 2. Who it's for

- The user, when a scene needs a surface that looks right: they roll a stone or moss material, check the 3Ã3 tiled preview for seams, bake it, and send it to Scene Generator in one tap â in plain language, no shader jargon.
- Builders and worker agents assembling scenes and worlds: they author material recipes with per-layer seeds and locks, bake them reproducibly, and hand them to scenes and the asset catalog with seeds intact.

## 3. What it does

- Authors a **material** as a FORGE-style recipe: stacked procedural layers with per-layer seed/lock/params, baked to tileable maps. (Starts with layered recipes; grows into full PBR sets as the recipe core proves solid â shipping PBR complexity before the recipe core is solid would violate the user's anti-clunk order.)
- Outputs tileable PNGs (color/detail, 512 or 1024px) and/or full PBR map packs, chosen per material: flat textures for floors and backdrops, full map packs for structures and creatures.
- **Guarantees tileability by construction** â a gate, not a hope: every bake runs a scripted edge-match check (left edge pixels equal right edge, top equals bottom); a material that doesn't tile doesn't ship.
- Builds fine detail through **layered noise stacks** (the FORGE lineage's mechanism): stacked layers of procedural grain and speckle, which is also how "baked geometry"-style relief (bump detail) emerges without a new engine.
- Hands materials to Scene Generator in one tap ("Send to Scene Generator"), and auto-catalogs every saved material in Assets with its seed and preview.
- Follows the standardized generator UI: fully random / quasi-random (lock layers) / fully customized; saveable seeds; fresh random seed every load; `?seed=` share URLs.
- Registers every saved material recipe in the App Wrangler catalog as "needs-check" until the user's eyes approve.

## 4. How you use it

1. You open the Studio. A fresh random seed is already rolled.
2. You tap **Surprise** for a fully random material, **Remix keeping locks** to re-roll only unlocked layers, or **Customize** to hand-set everything.
3. You lock the layers you like and remix the rest.
4. You inspect the large tile-preview showing the material tiled 3Ã3 â seams show up immediately.
5. If the surface needs depth, you switch on PBR maps: color, bump, and shine tabs, each its own layer stack derived from the same master seed, previewed side-by-side on a test swatch.
6. You bake: choose tileable PNG or PBR pack, resolution, and destination â the tileability gate result shows before the bake completes.
7. You send it to Scene Generator or save it to Assets in one tap; it registers in the Wrangler catalog as needs-check until you approve.

## 5. What you see

- **Studio.** The layer stack (Add/Remix/Re-roll per layer, lock toggles), a large tile-preview showing the material tiled 3Ã3 (tiling artifacts visible immediately), the recipe bar (Random / Remix-keeping-locks / Customize), the seed row (saveable, `?seed=` URL copy), the resolution picker (512/1024), and one-tap "Send to Scene Generator" and "Save to Assets."
- **Maps (PBR view).** For materials in PBR mode: color, bump-style relief, and shine tabs â each its own layer stack derived from the same master seed; side-by-side preview on a test sphere/plane swatch.
- **Library.** Saved material recipes: tiled thumbnail, seed, kind (flat/PBR), "where-used" (which scenes and assets reference it), Wrangler state.
- **Bake sheet.** Output choice (tileable PNG / PBR pack), resolution, destination (Scene Generator / Assets catalog / file) â with the tileability gate result shown before the bake completes.

## 6. What it needs

- The FORGE image-engine / FORGE 2.0 plugin lineage it builds on (stacked layers with per-layer seeds/locks/params).
- A device with local storage; recipes are portable JSON, bakes are PNG files stored next to the recipe.
- Scene Generator, as the primary consumer (one-tap send; materials appear in its layer/plugin browser).
- Assets, which auto-catalogs every saved material with its seed and preview.
- Texture Tools, for round-tripping detail authoring.
- The App Wrangler catalog, for registration.
- Nothing else: no accounts, no servers, no paid services.

## 7. Choices & settings

- **Default resolution** (512 / 1024; default: 512). 1024 for hero surfaces like the aquarium's seeded tileable floors; 512 for everything else.
- **Default kind** (flat / PBR; default: flat). Flat is faster and simpler; PBR when the surface needs depth.
- **Strict tileability gate** (on/off; default: on). Off only if you know the material will never tile â leaving it on is the default because a non-tiling texture is a broken asset.
- **Seed history length** (how many past seeds are kept; default: keep all).
- **PBR map defaults** (which maps a new PBR material includes: color, bump, shine, metalness; default: color + bump + shine). Add metalness for metals.
- **Plain-language labels toggle** (on/off; default: on). On means "color," "bump," "shine"; the technical labels ("albedo," "normal," "roughness") only appear if you turn this off.

## 8. Rules it never breaks

- **Never** ship a texture that doesn't tile: tileability is a construction gate (edge-matched, verified per bake), not a hope. *(you: the aquarium convention mandates edge-matched tileability; the 10 floor textures shipped as "seeded 1024px tileable")*
- **Always** make recipes reproducible: reloading a recipe's `?seed=` URL reproduces the material byte-identically. *(you: the aquarium floor textures proved this achievable; the standardized seed UI demands it)*
- **Never** let the studio become clunky: start with layered recipes, grow into PBR sets only after the recipe core is solid. *(you: the user's anti-clunk order + refinement direction)*
- **Always** name layers in plain words ("stone speckle," "moss creep") â never shader jargon in the UI. *(you: standing plain-language rule; technical labels only behind the toggle)*
- **Never** leave a material orphaned: one-tap send to Scene Generator and automatic cataloging in Assets. *(funnel-filled: the user hates scatter â everything lands in one verified place)*
- **Always** verify with a script, not a sentence: the tileability gate is a real edge-match check, not a visual claim. *(funnel-filled: the standing verification standard)*
- **Never** skip Wrangler registration: every saved material recipe registers as needs-check until the user's eyes approve. *(you: standing rule)*
- **Always** keep it local-first and free â no spending, no accounts. *(you: standing product rules)*

## 9. Done means

1. Surprise â lock â remix â bake a 1024px tileable floor texture: the 3Ã3 tiled preview shows no visible seams; the tileability gate passes with a scripted edge-match check (left edge equals right, top equals bottom pixel rows), not a visual claim.
2. Reloading the recipe's `?seed=` URL reproduces the material byte-identically (the aquarium floor textures proved this is achievable).
3. One-tap Send to Scene Generator lands the material in the scene's layer browser with its seed intact.
4. PBR mode: a stone material bakes color + bump + shine maps from one master seed; all three maps tile.
5. Every saved recipe registers in Wrangler as needs-check; the user's approval flips the state.
6. Zero headless errors on the studio â bake â send flow; UI strings plain-language throughout (no "albedo/normal/roughness" in user-facing labels unless the user enables technical labels).

## 10. Build order

*(funnel-filled â ordering the plan's existing scope by dependency; no new features invented)*

1. **Studio core first.** Layer stack with per-layer seed/lock/re-roll, the three generation buttons, seed row with save and `?seed=` URL, 3Ã3 tiled preview, resolution picker. Checkable: surprise â lock â remix keeps locked layers identical; the `?seed=` URL reproduces the material byte-identically.
2. **Tileability gate next.** The scripted edge-match check shown in the preview and enforced at bake. Checkable: a non-tiling recipe fails the gate with the mismatching edge rows shown; a fixed one passes.
3. **Bake sheet next.** Output choice (tileable PNG), resolution, destination. Checkable: a baked 1024px floor texture tiles seamlessly with a passed gate.
4. **Library next.** Saved recipes with tiled thumbnails, seeds, where-used refs, Wrangler states. Checkable: a saved recipe reopens and reproduces exactly.
5. **PBR mode next.** Color/bump/shine tabs from one master seed, side-by-side swatch preview, PBR pack output. Checkable: a stone material bakes three maps from one seed, all tiling. (After the flat core â the staged growth plan.)
6. **One-tap handoffs last.** Send to Scene Generator, save to Assets, Wrangler auto-registration. Checkable: a sent material appears in Scene Generator's layer browser with its seed intact.

## 11. Technical map

Repo and branch: **not yet assigned â this is a project with no working version yet.** Built on the FORGE image-engine lineage (stacked procedural layers with per-layer seeds/locks/params; Random/Remix/per-layer re-roll; Add/Draw/Saved tabs; PNG export; `?seed=` URLs) and the FORGE 2.0 plugin architecture (LayerPlugins with schema, defaults, deterministic randomize, render, serialize, migrate, auto-generated inspectors). Read-only lineage references (deployed, untouched): https://bassseamoor.github.io/render-queue/forge.html (v1 image engine); https://bassseamoor.github.io/render-queue/forge-2.html (FORGE 2.0). Storage: local-first; recipes are portable JSON; bakes are PNG files next to the recipe.

Data entities (the lists the builder works from):

- `material_recipe`: id, name, kind (flat/pbr), layer_stack[] (per FORGE LayerPlugin schema: type, params, seed, locked), master_seed, resolution, tileability_gate (pass/fail + evidence), status.
- `baked_output`: recipe ref, format (png-albedo / pbr-pack), files[{map, uri, sha}], baked_seed, baked_at.
- `usage_ref`: scene/asset ids consuming this material (for "where-used").
- `wrangler_entry`: material id, name, thumbnail, state (needs-check/approved).

Technical notes: the tileability gate = scripted pixel-row comparison (left edge == right edge, top == bottom) run per bake, with the evidence shown in the UI; PBR maps derive from the same master seed so color/bump/shine stay aligned; "where-used" refs are maintained on send/save so renaming a material never orphans a scene.

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0). Built via the quiz-funnel workflow; worker-filled; zero human answers. Provenance: "you" = the user's documented requests; "funnel-filled" = worker-authored default; "you-adjacent" = from documented user-approved material, but the term's use in this app is worker-authored. (The old files used "from-you" and "filled-in"; tags renamed here, meanings unchanged.)

**Source material gathered (the ramble, with sources):**
- FORGE image engine lineage (v1), live at https://bassseamoor.github.io/render-queue/forge.html: 10 layer types with per-layer seeds/locks/params, Random/Remix/per-layer re-roll, Add/Draw/Saved tabs, PNG export, ?seed= URLs; headless-verified. (MEMORY.md L58; memory/2026-09-21.md#L275)
- FORGE 2.0 converted those 10 visual layer types plus vector strokes into LayerPlugins with schema, defaults, deterministic randomize, render, serialize, migrate, auto-generated inspectors. (memory/2026-09-22.md#L200)
- The user's direction for FORGE work: refinement, avoid clunkiness, toward **highly detailed textures, baked geometry, and consistently solid results.** (memory/2026-09-21.md#L303)
- The aquarium asset pass produced real material artifacts: **10 seeded 1024px tileable floor textures** and **4 seeded tileable structure-material textures** (byte-identical on rebuild spot-check), plus a hard rule of "use pngs for details everywhere" (fish scales, coral, sand, rock). (memory/2026-09-25.md#L421; memory/2026-09-20.md#L637)
- The aquarium rebuild catalog (user's expanded scope) demands PBR texture details and depth/height mapping per category: "Every category should include procedural parameters, physics/behavior, **PBR texture details, depth/height mapping**, and texture descriptions." (memory/2026-09-24.md#L279)
- Standardized generator UI (all generators): fully random, quasi-random, fully customized; saveable seeds; fresh random seed every load; iPhone video export to SSD. (MEMORY.md L19)
- The forge-procedural-image-engine goal frames the engine as "the alternative to AI image generators: stacked procedural layers, each with its own seed and settings, re-creatable exactly, editable, and drawable on canvas." (~/workspace/goals/forge-procedural-image-engine/GOAL.md)
- Standing rules: plain non-technical language; local-first; everything registered in the App Wrangler catalog (MEMORY.md L30); no spending.

**Distilled spec (informing blanks 1â3):** Material Lab is the materials companion to Scene Generator: a procedural material authoring studio built on the FORGE image-engine lineage (stacked layers, per-layer seeds/locks/params), producing tileable, seeded, reproducible surface materials â color, detail, roughness/bump-style maps â for use in FORGE 2.0 scenes and STRATA worlds. Each material is an editable recipe; it exports tileable PNGs and registers in the App Wrangler catalog.

**Explicit ramble gaps (kept, not invented):**
- GAP-1: The user never asked for a "Material Lab" app by name; the slug comes from the parent's assignment ("planned as the materials companion to scene-generator").
- GAP-2: The user never said "PBR" themselves â PBR texture details come from the aquarium rebuild catalog scope (memory/2026-09-24.md#L279), a documented user-approved catalog, so it's you-adjacent; the term's use in THIS app is worker-authored. Flagged.
- GAP-3: Whether materials should include full PBR map sets (color/bump/shine/metalness) vs. flat tileable color textures was never specified by the user.
- GAP-4: No user statement on resolution standards beyond the aquarium's 1024px tileable floors and 512Ã512 tileable textures (you-facts for the aquarium pack, not necessarily this app's defaults).

**Quiz â 7 questions (all options valid; worker-filled, zero human answers):**

- **Q1. What is a "material" here?** A) A FORGE-style recipe: stacked procedural layers with per-layer seed/lock/params, baked to tileable maps Â· B) A single flat tileable texture Â· C) A full PBR set authored as one recipe Â· D) Start with A, grow into C â **D.** *you + funnel-filled* â the recipe model is the user's proven FORGE lineage (MEMORY.md L58; goal forge-procedural-image-engine); PBR detail demand is you-adjacent via the aquarium catalog scope (memory/2026-09-24.md#L279, GAP-2 flagged). Staging (A first, then C) avoids shipping PBR complexity before the recipe core is solid â coheres with the anti-clunk order.
- **Q2. Output formats?** A) Tileable PNGs (color/detail), 512/1024px Â· B) Full PBR map packs (PNG sets) Â· C) Both, per-material choice â **C.** *funnel-filled* â some materials stay flat (floors, backdrops) while others need full map packs (structures, creatures); forcing one output shape would break either the aquarium floor-texture lineage or the PBR scope.
- **Q3. How do materials reach scenes?** A) One-tap "Send to Scene Generator" + automatic catalog entry in Assets Â· B) Manual export/import only Â· C) Shared live library both apps read â **A.** *funnel-filled* â the user hates scatter; manual export/import reintroduces the file-shuffling the funnel exists to kill; automatic cataloging coheres with the Assets publish model.
- **Q4. Generation modes?** A) The standardized three: fully random / quasi-random (lock layers) / fully customized Â· B) Random + custom only â **A.** *you* â the user's standardized generator UI requirement applies to all content generators (MEMORY.md L19); FORGE v1 proved lock-aware Remix (memory/2026-09-22.md#L200), the quasi-random mechanism.
- **Q5. Tileability?** A) Guaranteed tileable by construction (edge-matching is a gate, not a hope) Â· B) Best-effort with a preview Â· C) Not required â **A.** *you* â the aquarium convention requires "tileable (left edge matches right, top matches bottom)" (00-conventions.md); the 10 floor textures shipped as "seeded 1024px tileable" (memory/2026-09-25.md#L421).
- **Q6. Detail philosophy (user: "highly detailed textures ... consistently solid results")?** A) Bake fine detail procedurally at high resolution, then downsample Â· B) Author at target resolution Â· C) Detail via layered noise stacks (FORGE lineage) â **C.** *you* â the user's "highly detailed textures" direction was given for the FORGE image engine specifically (memory/2026-09-21.md#L303), whose mechanism IS stacked procedural layers (MEMORY.md L58); layered stacks are also how relief-style detail emerges without a new engine.
- **Q7. Wrangler registration?** A) Every saved material recipe registers (needs-check until user approves) Â· B) Only exported packs Â· C) No registration â **A.** *you* â standing rule (MEMORY.md L30).

**Version locks (v1.0, carried from the prior edition):**

- Piece 01 â Q1 material model â layered recipe now, PBR sets as growth. Provenance: you (MEMORY.md L58; memory/2026-09-21.md#L303) + funnel-filled staging.
- Piece 02 â Q2 outputs â tileable PNGs and/or full PBR map packs, per-material choice. Provenance: funnel-filled.
- Piece 03 â Q3 handoff â one-tap Send to Scene Generator + automatic Assets catalog entry. Provenance: funnel-filled.
- Piece 04 â Q4 modes â standardized random/quasi-random/custom. Provenance: you (MEMORY.md L19).
- Piece 05 â Q5 tileability â guaranteed by construction, verified per bake. Provenance: you (00-conventions.md; memory/2026-09-25.md#L421).
- Piece 06 â Q6 detail â layered noise stacks (FORGE lineage). Provenance: you (memory/2026-09-21.md#L303; MEMORY.md L58).
- Piece 07 â Q7 Wrangler â every saved recipe registers as needs-check. Provenance: you (MEMORY.md L30).
