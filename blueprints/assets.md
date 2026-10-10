# Assets

# ASSETS â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The app-drawer home where every procedural asset is written as an exact, measurable specification, catalogued with its seed and an honest preview, and registered for use.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Assets is the moor app-drawer home for procedural assets â the images, 3D models, sound loops, and data files everything else is built from. It exists because the user proved, by deleting 905 files, that specifications â not galleries â are the durable artifact: after an asset pass produced gallery shapes that didn't match their names (an offering-bowl model rendered as two columns), the user ordered "delete all the assets you just made, write exact specifications in the plan." This app is that order living as software: you author each asset as a measurable build contract in the user's asset-spec convention (every claim about shape checkable against a render), catalogue every produced asset with its seed and an honest preview, and publish finished assets to the App Wrangler catalog so they can be used everywhere.

## 2. Who it's for

- The user themselves, when they need an asset made exactly right: they write or review the spec, check the preview, and approve it with their own eyes.
- Builders and worker agents who produce assets for the other apps: they author specs against the convention, run generation passes, and land finished assets in the catalog with seeds, so results are reproducible and reviewable instead of one-off files.

## 3. What it does

- Authors asset specifications in the user's convention: every entry carries **Form** (exact shape description, every adjective replaced by a number), **Dimensions** (in units, where 1 unit = 5cm, or as fractions of a length), **Orientation** (how it sits in the coordinate frame), and an **ACCEPT/REJECT** block (the visual check, listing specific failures that disqualify it).
- Enforces the convention while you write: flags banned vague words (*natural, nice, realistic, pretty, detailed, organic*), blocks specs missing the ACCEPT/REJECT block or using unit-less adjectives ("large" â "spans 0.8 of the length").
- Keeps an asset catalog (the Library view): every asset searchable, with its preview, seed, and status (draft / spec'd / generated / needs-check / approved).
- Runs generation passes: textures to PNGs, models to 3D files, audio to sound files â with seeds assigned, run status shown, and honest flags on anything approximated (nothing is ever faked; still-open items are flagged).
- Registers finished assets in the App Wrangler catalog with the state "needs-check" until the user's own eyes approve them.

## 4. How you use it

1. You open the app and go to the Author desk.
2. You pick a template for the asset kind (fish body, fin, texture, audio loop, backdrop, preset).
3. You write the spec: shape description, measurements, orientation, and what counts as a pass or fail. The checker flags vague words and missing blocks live.
4. You assign or review the seed â the number that makes this asset's generation reproducible.
5. You launch a generation pass and watch its status; outputs land in the catalog's folder tree.
6. You inspect the preview render (the actual mesh or photo on a neutral background, with its name captioned) and the honest flags on anything approximated.
7. You publish to the Wrangler catalog; the asset waits in "needs-check" until you approve it with your own eyes.

## 5. What you see

- **Author (spec desk).** An editor with convention templates per asset kind. It enforces the rules: a banned-word checker, required Form/Dimensions/Orientation/ACCEPT-REJECT blocks, a unit validator (1u = 5cm), and per-kind checks (e.g., a fin module contains no body). A live checklist panel shows which convention rules pass or fail.
- **Library (catalog).** A searchable grid of every asset: preview render (actual mesh or photo, neutral background, name captioned â never abstract placeholder glyphs), kind/catalog/id, seed, status. Filters by kind, catalog, and status. Tapping an asset shows the full spec, its seed history, prior-run diffs, and preview history.
- **Generate (launcher).** Queues scripted generation passes per catalog: textures to PNGs, meshes to 3D files (with 3 levels of detail), audio to WAV files. Shows seed assignment and run status; outputs land in the catalog folder tree with honest flags on anything approximated.
- **Wrangler (publish).** A publish-to-Wrangler button on every finished asset; registration carries the preview, the seed, and a link to the spec, and stays "needs-check" until the user approves.

## 6. What it needs

- The asset-spec convention itself (the documented ruleset the user's "write exact specifications" order produced â e.g., the aquarium pack's `plan/asset-specs/` is the reference implementation; this app treats it as a read-only reference and never edits it).
- A device with local storage for the catalog folder tree and generated files.
- The Colony App Wrangler catalog, to receive registrations.
- Scene and texture generation scripts run outside the app for actual asset production (the launcher queues and tracks them).
- Partner apps that consume assets: **scene-generator** (scenes consume catalog textures and meshes), **texture-tools** (detail authoring), **audio-lab** (audio loop specs), **video-tools** (assets used in renders).
- Nothing else: no accounts, no servers, no paid services.

## 7. Choices & settings

- **Units display** (units vs centimeters; default: units, 1u = 5cm). Change it if you think in centimeters when writing measurements.
- **Strictness profile** (strict convention vs guided; default: strict). Strict blocks non-compliant specs; guided shows templates and reminders without blocking. The user paid 905 deleted files for strictness, so strict is the default.
- **Seed log retention** (how long prior-run seed records are kept; default: keep all). Trim it if the catalog gets huge.
- **Wrangler target** (where the baked catalog path lives locally; default: the app's folder). Change it if your catalog lives somewhere else.
- **Preview render style** (default: neutral background, enforced). The neutral background is what makes previews honest; changing it weakens the check, so it stays enforced by default.

## 8. Rules it never breaks

- **Never** fake an asset â flag still-open items honestly at delivery. *(you: the generation pass's standing honesty rule)*
- **Never** use a banned vague word in a spec (*natural, nice, realistic, pretty, detailed, organic*) â every adjective gets a number or gets deleted. *(you: the convention the user's deletion order established)*
- **Never** accept a spec missing any of the four blocks (Form, Dimensions, Orientation, ACCEPT/REJECT). *(you)*
- **Always** give every asset a per-asset seed, and keep a seed log so regenerations reuse seeds and diffs stay meaningful. *(you)*
- **Always** show a preview render of the actual asset on a neutral background with its name captioned â never an abstract glyph. *(you)*
- **Never** let an asset ship without Wrangler registration â everything built must be registered in the App Wrangler catalog. *(you: standing rule)*
- **Always** enforce the naming pattern `<kind>-<catalog>-<id3>-<slug>` with collision checks, because the seed log and catalog depend on unique, sortable names. *(you: from the established generation pass)*
- **Always** explain the app in plain, non-technical language â "what it must look like," "what makes it fail," not jargon. *(you: standing product rule)*
- **Always** keep everything local-first and free â no spending, no accounts. *(you: standing product rules)*

## 9. Done means

1. In the Author view, a fish-fin spec missing ACCEPT/REJECT or containing the word "realistic" is blocked with a plain-language message naming the violated rule; it passes only when all four blocks and the unit check pass.
2. The Library shows at least one asset per kind, all with actual-render previews (no placeholder glyphs); every asset has a seed and a seed-history entry.
3. The Generate launcher completes a 10-texture pass: all outputs are tileable 512Ã512 PNGs, names match the pattern, the seed log is written, and approximated items are flagged honestly.
4. Publish-to-Wrangler registers an entry with state "needs-check"; the user's approval flips the state; nothing ships unregistered.
5. Round-trip: edit a spec, regenerate with the prior seed, and the diff against the prior-run record shows only the intended changes.
6. Zero errors on the core flow (headless check), and the UI reads in plain language throughout.

## 10. Build order

*(funnel-filled â ordering the plan's existing scope by dependency; no new features invented)*

1. **Spec Author desk first.** The convention templates, the four-block structure, and the enforcement checker (banned words, required blocks, unit validation). Checkable: a bad spec is blocked with the right message, a good spec passes.
2. **Library catalog next.** The searchable grid with previews, seeds, and status, backed by the folder tree. Checkable: an asset spec'd in step 1 appears here with its preview and seed.
3. **Generate launcher next.** Seed assignment, pass queuing, run status, outputs landing in the folder tree with honest flags. Checkable: a 10-texture pass completes with the seed log written and flagged approximations.
4. **Wrangler publish last.** The publish button, registration with needs-check state, approval flip. Checkable: a published asset appears in the Wrangler catalog as needs-check and flips to approved on approval.

## 11. Technical map

Repo and branch: **not yet assigned â this is a project with no working version yet;** local-first folder tree mirroring the aquarium pack layout: `assets/<catalog>/<kind>-<catalog>-<id3>-<slug>/`, exportable as a portable directory.

Data entities (the lists the builder works from):

- `asset_spec`: id (`<kind>-<catalog>-<id3>-<slug>`), kind (image / mesh / audio / data), catalog, form, dimensions, orientation, accept, reject[] (failure list), units_ref, seed, seed_history[], status (draft/spec'd/generated/needs-check/approved), preview_uri, wrangler_state.
- `asset_binary`: uri, bytes/sha (checksum), lod_band (level-of-detail band for meshes), resolution (images), duration/format (audio), generated_seed, honest_flags[].
- `catalog`: name, kinds, asset_ids[], naming_pattern, manifest_version.
- `wrangler_entry`: app/asset id, name, href, state (needs-check/approved), registered_at.

Technical notes: banned-vagueness checker = a word-list validator plus rules (adjectives without numbers flagged, missing blocks block save); unit validator enforces 1u = 5cm; seed log = append-only per-asset seed history enabling prior-run reuse and meaningful diffs; enforcement engine runs as a live checklist panel in the editor. The aquarium planning pack's `plan/asset-specs/` is the reference implementation of the convention â read-only, never edited by this app.

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0). Built via the quiz-funnel workflow; worker-filled; zero human answers. Provenance: "you" = the user's documented requests; "funnel-filled" = worker-authored default. (The old files used "from-you" and "filled-in"; the tags are renamed here, meanings unchanged.)

**Source material gathered (the ramble, with sources):**
- After an asset pass produced gallery shapes that didn't match their names (the offering-bowl GLB rendered as two columns), the user ordered: **"Delete all the assets you just made, write exact specifications in the plan."** 905 workspace files + 902 gallery paths were deleted; specs were written instead. (MEMORY.md L134)
- The resulting convention, `plan/asset-specs/00-conventions.md` (read verbatim 2026-09-26): units 1u = 5cm; axes +X forward / +Y up / +Z left; fin modules contain NO body; every asset entry carries Form / Dimensions / Orientation / ACCEPT-REJECT; banned vagueness (*natural, nice, realistic, pretty, detailed, organic* replaced with a measurement or deleted); textures 512Ã512 tileable PNG; audio 44100 Hz 16-bit seamless loops with per-loop layers listed; a `_prior-run/` seed log so regenerations reuse seeds and diffs stay meaningful.
- "The 258 aquarium asset specs define geometry as measurable build contracts â form, dimensions in units, orientation, plus an ACCEPT/REJECT test â not vertex-level coordinates." (memory/2026-09-26.md#L4)
- The 2026-09-25 asset-generation pass: naming `<kind>-<catalog>-<id3>-<slug>`, per-asset seeds, and "never fake an asset â flag still-open items" with honest flags at delivery. (memory/2026-09-25.md#L432)
- Standing rules: everything built must be registered in the Colony App Wrangler catalog (MEMORY.md L30); clean/understandable/fast UX; explanations plain and non-technical; local-first; no spending.
- Creator-tools lineage: the Assets app is the catalog/authoring home for the asset-spec convention â the thing the user's "exact specifications" order invented.
- 2026-09-20 directive folded into Aquarium work: "use pngs for details everywhere" (memory/2026-09-20.md#L637).

**Distilled spec (informing blanks 1â3):** Assets is the moor app-drawer app where every procedural asset (image/texture, 3D mesh, audio loop, JSON data) is authored as a measurable build contract in the user's asset-spec convention, catalogued with per-asset seeds and preview renders, and registered in the App Wrangler catalog.

**Explicit ramble gaps (kept, not invented):**
- GAP-1: The user never asked for an "Assets app" by name. The app's existence is worker-authored, not a documented user request.
- GAP-2: Whether the user wants to author NEW assets here vs. only browse/register the aquarium-pack assets â never stated. This plan assumes both.
- GAP-3: 2D textures vs 3D meshes vs audio â the convention covers all; no user statement prioritizes one kind.
- GAP-4: Whether asset generation (actually producing GLBs/PNGs/WAVs) should happen inside this app or remain a builder-script job outside it â never stated.
- GAP-5: The user never said where the catalog data lives (local-only, phone, PC) beyond local-first standing rules.

**Quiz â 8 questions (all options valid; worker-filled, zero human answers):**

- **Q1. What is the Assets app first and foremost?** A) A spec authoring desk Â· B) An asset catalog/library Â· C) A generation launcher Â· D) All three in one home â **D.** *funnel-filled.* The user's asset workflow is write-specs â generate-assets â register; splitting it across apps recreates the scatter the user hates.
- **Q2. Which asset kinds ship in v1?** A) Images/textures only Â· B) 3D meshes only Â· C) Images + 3D meshes Â· D) Images + meshes + audio loops + data JSONs (the full convention) â **D.** *you* â the aquarium convention was explicitly defined across textures, audio, backdrops, and presets (MEMORY.md L134; 00-conventions.md).
- **Q3. How strict is the spec editor about the convention?** A) Enforced: banned-word checker flags forbidden words, missing ACCEPT/REJECT blocks, unit-less adjectives Â· B) Guided: templates + reminders, no enforcement Â· C) Lenient: free-form with templates available â **A.** *you* â the user deleted 905 files because vagueness produced wrong shapes; the convention's whole point is "every claim about shape must be checkable against a render."
- **Q4. Seed discipline?** A) Per-asset seed, required; seed log with prior-run reuse Â· B) Per-asset seed, optional Â· C) Seeds only for generated assets, not authored specs â **A.** *you* â the aquarium pass used per-asset seeds and `_prior-run/` seed reuse so future diffs are meaningful (memory/2026-09-25.md#L432; 00-conventions.md).
- **Q5. Preview renders?** A) A preview render (actual mesh/photo on neutral background, name caption) required for every catalogued asset Â· B) Previews optional Â· C) No previews â specs only â **A.** *you* â "render of the ACTUAL mesh on neutral background, name caption below. No abstract glyphs" (00-conventions.md); the failure that started this whole convention was a preview that lied.
- **Q6. How does Wrangler registration work?** A) Publish-to-Wrangler button on every finished asset with state `needs-check` until the user's eyes approve Â· B) Automatic registration on spec completion Â· C) Manual only, from a separate catalog screen â **A.** *you* â standing rule "everything built must be registered in the App Wrangler catalog" (MEMORY.md L30); `needs-check` matches how other apps were registered pending the user's eyes.
- **Q7. Naming discipline?** A) Enforced `<kind>-<catalog>-<id3>-<slug>` with collision checks Â· B) Suggested pattern, free naming allowed Â· C) No naming rule â **A.** *you* â the 2026-09-25 generation pass established exactly this naming (memory/2026-09-25.md#L432); enforced because the seed log and catalog depend on unique sortable names.
- **Q8. Where does the catalog live?** A) Local-first (device storage; exports as a portable folder tree) Â· B) Synced through the existing phoneâPC git mailbox (work-sync branch) Â· C) Local now, sync later â **A.** *you* â standing local-first rule. Sync-via-git is funnel-filled as a later option, not v1 scope.

**Version locks (v1.0, carried from the prior edition):**

- Piece 01 â Q1 scope â all three (author + catalog + generation launcher). Provenance: funnel-filled.
- Piece 02 â Q2 kinds â images + meshes + audio + data JSONs. Provenance: you (aquarium convention files 08/10/11; MEMORY.md L134).
- Piece 03 â Q3 strictness â enforced convention (banned-word checker, required ACCEPT/REJECT, unit checks). Provenance: you (MEMORY.md L134; 00-conventions.md).
- Piece 04 â Q4 seeds â per-asset required seed + `_prior-run`-style seed log. Provenance: you (memory/2026-09-25.md#L432; 00-conventions.md).
- Piece 05 â Q5 previews â actual-render preview required per asset, name caption, no abstract glyphs. Provenance: you (00-conventions.md).
- Piece 06 â Q6 Wrangler â publish button; registers as `needs-check` until user approves. Provenance: you (MEMORY.md L30).
- Piece 07 â Q7 naming â enforced `<kind>-<catalog>-<id3>-<slug>`, collision checks. Provenance: you (memory/2026-09-25.md#L432).
- Piece 08 â Q8 storage â local-first, portable folder-tree export. Provenance: you (standing local-first rule).
