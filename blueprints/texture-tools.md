# Texture Tools

# TEXTURE TOOLS â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The detail-texture workbench â author the small seamless tiles (fish scales, sand grain, trim sheets, alpha cutouts) that give surfaces their fine detail, under a hard tileability gate.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Texture Tools is the detail-texture workbench of the app drawer: the place for authoring, inspecting, and finishing the small tileable PNGs that carry surface detail â fish scales, coral grain, sand, rock, trim sheets, plant alpha details â under the aquarium tileability contract (512Ã512, edges matched), with seeded procedural generation in the FORGE lineage, a zoomed pixel-level inspector, and one-tap handoff to Material Lab (as material layers) and Scene Generator (as detail overlays). It complements Material Lab on purpose: Material Lab authors full surfaces and recipes; Texture Tools authors the fine detail tiles that sit on top of them. It exists because of the user's 2026-09-20 directive, "use pngs for details everywhere," and the aquarium pass that proved small seeded detail PNGs â floors, structure materials, plant alpha cutouts â are the details that make scenes look real.

## 2. Who it's for

- The user, when a surface needs its detail: they roll a scale or sand-grain pattern, check the 3Ã3 tiling with their own eyes, touch up a spot with the brush, and send it onward in one tap â everything labeled in plain words ("fish scales," "sand grain"), never shader jargon.
- Builders and worker agents finishing texture sets: they generate seeded detail tiles, verify the edge-match gate per texture, lay out labeled trim sheets cell by cell, and hand finished textures to Material Lab and the asset catalog with seeds intact.

## 3. What it does

- Authors **detail tiles only** â scales, grain, trim, alpha cutouts; full materials stay in Material Lab. (The boundary is worker-authored; the fallback is recorded: if the user finds two apps confusing, this becomes a "Detail" tab inside Material Lab â the data model is designed to survive that merge.)
- Generates procedurally (seeded FORGE lineage: layer stack with per-layer seed/lock/re-roll) **and** hand-draws (brush tab like FORGE v1's Draw, plus eraser and alpha brush) â because touching up a scale pattern by hand is exactly where a brush earns its place.
- Enforces a **tileability gate**: edge-match verified per texture (left edge pixels equal right edge, top equals bottom). A detail texture that doesn't tile is a broken asset.
- Makes **alpha/cutout textures first-class**: foliage, grates, and plant details with real transparency channels â the 6 plant-detail PNGs with alpha the aquarium pass shipped are the documented precedent.
- Makes **trim sheets first-class**: multi-element sheets with a labeled grid map ("row 1: window trims, row 2: pipe jointsâ¦"), each cell individually re-rollable, the grid map exporting alongside as plain labeled JSON.
- Hands textures over in one tap: send to Material Lab (as a layer) and automatic catalog entry in Assets.
- Follows the full standardized generator UI: random / quasi-random / custom + saveable seeds + fresh seed on every load.
- Registers every saved texture in the App Wrangler catalog as "needs-check" until the user's eyes approve.

## 4. How you use it

1. You open the Bench. A fresh random seed is already rolled.
2. You tap **Surprise** for a fully random detail tile, **Remix keeping locks** to re-roll only unlocked layers, or **Customize** to hand-set everything â or you switch to the Draw tab and paint by hand.
3. You lock the good layers and remix the rest; the canvas shows the texture tiled 3Ã3 live, so seams are visible immediately.
4. You touch up spots with the brush, eraser, or alpha brush.
5. You check the Inspector: pixel-zoom loupe, the edge-match gate result with the actual compared edge rows, and the alpha channel view toggle.
6. You pass the gate, then send the texture to Material Lab as a layer or save it to Assets in one tap.
7. For trim sheets: you lay out the grid, generate per cell (each cell individually re-rollable), and export the sheet plus its labeled grid map.

## 5. What you see

- **Bench.** The canvas with the texture tiled 3Ã3 live (seams visible immediately), the procedural layer stack (per-layer seed/lock/re-roll, FORGE lineage), the Draw tab (brush, eraser, alpha brush), the three generation buttons (Surprise / Remix-keeping-locks / Customize), and the seed row with save + `?seed=` URL.
- **Inspector.** A pixel-zoom loupe, the edge-match readout (gate result with the actual compared edge rows shown), an alpha channel view toggle, and the resolution readout.
- **Trim sheets.** A sheet canvas with a labeled grid map ("row 1: window trims, row 2: pipe jointsâ¦"); each cell individually re-rollable; the grid map exports alongside the sheet as plain labeled JSON.
- **Library.** Saved textures: tiled thumbnail, seed, kind (detail/trim/alpha), "where-used" refs, Wrangler state.

## 6. What it needs

- The FORGE layer lineage (procedural layers with per-layer seeds/locks/params) and the FORGE v1 Draw-tab precedent for hand-drawn strokes.
- A device with local storage; recipes are portable JSON, outputs are PNG files.
- Material Lab, to receive textures as stack layers.
- Scene Generator, to use textures as detail overlays.
- Assets, which auto-catalogs every saved texture with its seed and preview.
- The App Wrangler catalog, for registration.
- Nothing else: no accounts, no servers, no paid services.

## 7. Choices & settings

- **Default resolution** (default: 512). The aquarium tileability contract is 512Ã512; change it if a sheet needs more.
- **Edge-match gate strictness** (default: strict). Strict blocks non-tiling textures; loosening it is possible but weakens the guarantee the whole app is built on.
- **Brush defaults** (size, alpha; defaults: medium brush, full alpha). Change for fine touch-up work.
- **Seed history length** (how many past seeds are kept; default: keep all).
- **Default handoff target** (Material Lab / Assets / ask each time; default: ask each time). Set it if you always send the same direction.

## 8. Rules it never breaks

- **Never** ship a texture that doesn't tile: the edge-match gate (left==right, top==bottom) runs per texture, verified â a gate, not a hope. *(you: the aquarium convention mandates edge-matched tileability)*
- **Always** show the texture tiled 3Ã3 live on the Bench, so seams are visible immediately. *(funnel-filled: the only honest way to claim tileability)*
- **Never** use placeholder glyphs or abstract previews â every preview is the actual texture. *(you: the convention's "no abstract glyphs" rule)*
- **Never** collapse into Material Lab's territory: detail tiles here, full materials there â the boundary keeps the drawer from gaining a duplicate. *(funnel-filled: recorded fallback is the merge tab, only if the user asks)*
- **Always** reproduce exactly: reloading the `?seed=` URL reproduces procedural layers byte-identically, and brush strokes reproduce exactly (saved with the recipe, per FORGE v1 precedent). *(you: the documented determinism precedent)*
- **Always** keep alpha real: an alpha texture carries a real transparency channel, verifiable in the alpha view toggle. *(you-adjacent: the 6 shipped plant-detail PNGs with alpha)*
- **Always** label every trim-sheet cell in plain words and export the grid map alongside the sheet. *(funnel-filled: the smallest faithful reading of "baked trim sheets")*
- **Never** skip Wrangler registration: every saved texture registers as needs-check until the user's eyes approve. *(you: standing rule)*
- **Always** speak plain language in the UI â "fish scales," "sand grain," never shader jargon. *(you: standing product rule)*
- **Always** keep it local-first and free â no spending, no accounts. *(you: standing product rules)*

## 9. Done means

1. Surprise â lock â remix â brush touch-up â gate â send: a 512Ã512 scale texture passes the scripted edge-match gate and appears as a layer in Material Lab with its seed intact.
2. Reloading the `?seed=` URL reproduces the texture byte-identically (procedural layers); brush strokes reproduce exactly (saved with the recipe, FORGE v1 precedent).
3. Alpha texture: a foliage cutout PNG carries a real alpha channel; the alpha view toggle shows it.
4. Trim sheet: a 2Ã4 sheet bakes with a labeled grid map; each cell is individually re-rollable without disturbing the others.
5. Every saved texture registers in Wrangler as needs-check; the user's approval flips the state.
6. Zero headless errors on the bench â gate â handoff flow; UI strings plain-language throughout.

## 10. Build order

*(funnel-filled â ordering the plan's existing scope by dependency; no new features invented)*

1. **Bench core first.** Canvas with live 3Ã3 tiling, procedural layer stack (per-layer seed/lock/re-roll), the three generation buttons, seed row with save + `?seed=` URL, Draw tab (brush, eraser). Checkable: surprise â remix â the `?seed=` URL reproduces the texture byte-identically.
2. **Inspector + tileability gate next.** Pixel-zoom loupe, edge-match readout with compared edge rows, gate enforcement at bake. Checkable: a non-tiling texture fails with the mismatching rows shown; a fixed one passes.
3. **Alpha support next.** Alpha brush, alpha channel view toggle, PNGs with real transparency. Checkable: a foliage cutout PNG carries a real alpha channel visible in the toggle.
4. **Trim sheets next.** Sheet canvas, labeled grid map, per-cell re-roll, sheet + grid-map export. Checkable: a 2Ã4 sheet bakes with its labeled grid map; re-rolling one cell leaves the others untouched.
5. **Library next.** Saved textures with tiled thumbnails, seeds, where-used refs, Wrangler states. Checkable: a saved texture reopens and reproduces exactly.
6. **Handoffs last.** One-tap send to Material Lab as a layer, auto-catalog in Assets, Wrangler registration. Checkable: a sent texture appears in Material Lab with its seed intact.

## 11. Technical map

Repo and branch: **not yet assigned â this is a project with no working version yet.** Built on the FORGE image-engine lineage (10 layer types with per-layer seeds/locks/params; Random/Remix/per-layer re-roll; Add/Draw/Saved tabs; PNG export; `?seed=` URLs) and FORGE 2.0's LayerPlugin architecture (schema-generated inspectors). Read-only lineage references (deployed, untouched): https://bassseamoor.github.io/render-queue/forge.html (v1); https://bassseamoor.github.io/render-queue/forge-2.html (2.0). Storage: local-first; recipes are portable JSON; outputs are PNG.

Data entities (the lists the builder works from):

- `texture_recipe`: id, name, kind (detail/trim/alpha), layer_stack[] (type, params, seed, locked), brush_strokes[] (saved with the recipe, per FORGE v1 precedent), master_seed, resolution (default 512), edge_gate (pass/fail + evidence), status.
- `trim_sheet`: id, grid (rowsÃcols), cell_labels{}, per-cell recipe refs, sheet_seed.
- `texture_output`: recipe ref, uri, sha (checksum), has_alpha, baked_seed.
- `wrangler_entry`: texture id, name, tiled thumbnail, state (needs-check/approved).

Technical notes: the edge-match gate = scripted pixel-row comparison (left edge == right edge, top == bottom) per texture with the compared rows shown as evidence; brush strokes are stored as vector stroke records in the recipe so they replay deterministically; the data model is merge-safe â `texture_recipe` is a strict subset of a material layer, so the recorded fallback (this app becoming a "Detail" tab inside Material Lab) requires no data migration.

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0). Built via the quiz-funnel workflow; worker-filled; zero human answers. Provenance: "you" = the user's documented requests; "funnel-filled" = worker-authored default; "you-adjacent" = from documented user-approved material, but the term's use in this app is worker-authored. (The old files used "from-you" and "filled-in"; tags renamed here, meanings unchanged.) Honest note carried from the prior edition: there is no documented user request for a "Texture Tools" app â its shape is worker-authored, grounded only in the texture-related facts below.

**Source material gathered (the ramble, with sources):**
- The aquarium asset convention defines textures precisely: **512Ã512 PNG, tileable (left edge matches right, top matches bottom)**; backdrops 1920Ã1080 with composition specified as zones; catalog preview cards must be "render of the ACTUAL mesh on neutral background" â no abstract glyphs. (plan/asset-specs/00-conventions.md, read verbatim 2026-09-26)
- The user ordered 20 textures as **measurable build contracts** in the aquarium plan (`plan/asset-specs/08-textures.md`, one of the 12 spec files). (MEMORY.md L134)
- 2026-09-20 directive: **"use pngs for details everywhere"** â fish scales, coral, sand, rock detail textures, baked once per scene. (memory/2026-09-20.md#L637)
- The 2026-09-25 generation pass produced: 10 seeded 1024px tileable floor textures + 4 seeded tileable structure-material textures + 6 seeded plant-detail PNGs with alpha; procedural determinism spot-checked byte-identical. (memory/2026-09-25.md#L421)
- FORGE image-engine lineage: 10 layer types with per-layer seeds/locks/params; Random/Remix/per-layer re-roll; Add/Draw/Saved tabs; PNG export; ?seed= URLs. (MEMORY.md L58) FORGE 2.0 turned these into LayerPlugins with schema-generated inspectors. (memory/2026-09-22.md#L200)
- The user's FORGE direction: refinement, avoid clunkiness, toward **highly detailed textures, baked geometry, consistently solid results.** (memory/2026-09-21.md#L303)
- Standardized generator UI (all generators): fully random / quasi-random / fully customized; saveable seeds; fresh random seed every load; iPhone video export to SSD. (MEMORY.md L19)
- Aquarium realism note: "baked trim sheets" were added in a polish pass. (~/workspace/goals/colony-aquarium-studio/GOAL.md)
- Standing rules: plain non-technical language; local-first; everything registered in the App Wrangler catalog (MEMORY.md L30); no spending.

**Distilled spec (informing blanks 1â3):** Texture Tools is the detail-texture workbench of the app drawer: the place for authoring, inspecting, and finishing the small tileable PNGs that give surfaces their detail â scales, coral grain, sand, rock, trim sheets, plant alpha details â under the aquarium tileability contract (512Ã512, edge-matched), with seeded procedural generation in the FORGE lineage, a zoomed pixel-level inspector, and one-tap handoff to Material Lab (as material layers) and Scene Generator (as detail overlays). It complements Material Lab: Material Lab authors full surfaces/recipes; Texture Tools authors the fine detail tiles that sit on top of them.

**Explicit ramble gaps (kept, not invented):**
- GAP-1: The user never asked for a "Texture Tools" app. Its existence and its boundary with Material Lab are entirely worker-authored. Risk flagged: this app could be a tab inside Material Lab rather than its own drawer entry â the plan keeps it separate but names the merge option.
- GAP-2: The user never distinguished "texture" (detail tile) from "material" (surface recipe); the division here is worker-authored.
- GAP-3: No user statement on texture painting (hand-drawn detail) vs. purely procedural generation. The FORGE v1 Draw tab exists (MEMORY.md L58) â the plan includes both, flagged as worker-authored.
- GAP-4: The user never specified trim sheets beyond the colony-aquarium-studio goal's mention of "baked trim sheets" â what they contain and how they're authored is a gap.
- GAP-5: No user statement on alpha/cutout textures beyond the 6 plant-detail PNGs with alpha (memory/2026-09-25.md#L421).

**Quiz â 7 questions (all options valid; worker-filled, zero human answers):**

- **Q1. What is Texture Tools' job vs. Material Lab?** A) Detail tiles only (scales, grain, trim, alpha details); materials stay in Material Lab Â· B) Full overlap â both do everything Â· C) Merge: Texture Tools is a tab inside Material Lab â **A.** *funnel-filled (GAP-1/2, flagged)* â without a boundary the two apps collapse into one and the drawer gains a duplicate. The aquarium's own texture artifacts were all detail tiles (scales, coral, sand, rock â memory/2026-09-20.md#L637); that documented set defines the app's territory. Merge option (C) is recorded as the fallback if the user finds two apps confusing.
- **Q2. Generation method?** A) Procedural only (FORGE layer lineage, seeded) Â· B) Procedural + hand-draw (brush tab like FORGE v1's Draw) Â· C) Hand-draw only â **B.** *you + funnel-filled* â procedural generation is the FORGE lineage (MEMORY.md L58); the Draw tab is a documented FORGE v1 feature (MEMORY.md L58), so hand-draw is you-adjacent. Detail work (touching up a scale pattern) is exactly where a brush earns its place.
- **Q3. Tileability?** A) Gate: edge-match verified per texture (left==right, top==bottom) Â· B) Preview-only check Â· C) Not enforced â **A.** *you* â the convention mandates edge-matched tileability (00-conventions.md); treating it as a gate continues Material Lab's piece-05 lock. A detail texture that doesn't tile is a broken asset.
- **Q4. Alpha/cutout support?** A) Yes â alpha detail textures (foliage, grates) are first-class Â· B) Opaque only Â· C) Later â **A.** *you-adjacent* â the 6 plant-detail PNGs with alpha are documented shipped artifacts (memory/2026-09-25.md#L421, GAP-5 flagged); making alpha first-class serves the documented need rather than inventing a new one.
- **Q5. Trim sheets?** A) First-class: multi-element sheets with a labeled grid map Â· B) Out of scope Â· C) Later â **A.** *funnel-filled (GAP-4, flagged)* â "baked trim sheets" appear in the user's aquarium polish pass (goal colony-aquarium-studio); giving them a home with a grid map (which cell holds which trim, in plain labels) is the smallest faithful interpretation.
- **Q6. Handoff?** A) One-tap send to Material Lab (as a layer) and to Assets catalog Â· B) File export only Â· C) Both â **A.** *funnel-filled* â coheres with Material Lab piece-03's lock (one-tap send the other direction would be asymmetric); textures are assets, so the Assets catalog entry follows the standing registration rule (MEMORY.md L30).
- **Q7. Standardized generator UI?** A) Yes â random/quasi-random/custom + saveable seeds + fresh seed on load Â· B) Simplified: random + custom only â **A.** *you* â the user's standardized generator UI covers all content generators (MEMORY.md L19); no basis for a simplified variant.

**Version locks (v1.0, carried from the prior edition):**

- Piece 01 â Q1 scope â detail tiles only (scales/grain/trim/alpha); materials stay in Material Lab. Fallback recorded: merge into Material Lab tab if user finds two apps confusing. Provenance: funnel-filled (GAP-1/2 flagged); territory you (memory/2026-09-20.md#L637).
- Piece 02 â Q2 method â procedural (seeded FORGE lineage) + hand-draw brush. Provenance: you (MEMORY.md L58).
- Piece 03 â Q3 tileability â edge-match gate per texture. Provenance: you (00-conventions.md).
- Piece 04 â Q4 alpha â first-class alpha detail textures. Provenance: you-adjacent (memory/2026-09-25.md#L421; GAP-5 flagged).
- Piece 05 â Q5 trim sheets â first-class with labeled grid map. Provenance: funnel-filled (GAP-4 flagged; goal colony-aquarium-studio mention).
- Piece 06 â Q6 handoff â one-tap to Material Lab + auto Assets catalog entry. Provenance: funnel-filled.
- Piece 07 â Q7 UI â full standardized generator UI. Provenance: you (MEMORY.md L19).
