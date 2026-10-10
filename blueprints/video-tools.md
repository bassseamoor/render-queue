# Video Tools

# VIDEO TOOLS â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The app-drawer home for turning scenes into finished video â render jobs with quality tiers, procedural sound mixed in, and the iPhone-to-SSD export workflow.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Video Tools is where scenes become finished video files. You pick a scene from the Scene Generator, choose a quality level, and it renders a video with ambient sound already mixed in. It knows everything the user has learned the hard way about getting video off an iPhone onto an SSD â that the video must finish assembling on the phone first, that the SSD must use a format the iPhone can write to, and that the phone caps single downloads at 256MB â and it walks you through that plainly before a long render. It also runs the phone render queue: a to-do list of saved scenes you tap to render on the phone, with an honest pause-and-continue button if the tab falls asleep overnight.

## 2. Who it's for

- **The builder (you):** someone making ambient videos â fireplace scenes, aquariums, landscapes â for YouTube and for an SSD library, who wants the render-to-disk pipeline to just work without fighting iPhone limits.
- **The phone-as-render-farm:** you, later, opening the queue on your iPhone to start or continue overnight renders without touching the PC.

## 3. What it does

- Renders video from Scene Generator scenes (it references scenes and their seeds â saved numbers that reproduce the exact same result â it never re-builds a scene studio of its own).
- Offers three quality tiers in plain words: Draft ("quick preview"), Standard ("good"), Cinematic ("best").
- Mixes in a seeded procedural soundbed as the video's audio track (AAC, the standard audio format inside video files), with the sound toggle defaulting to ON.
- Walks you through the full iPhone-to-SSD export workflow, stating the iOS facts in plain words before long renders.
- Runs the phone render queue: a seed to-do list with tap-to-render, pausing honestly when the tab sleeps and resuming with a Continue button.
- Ships one-tap presets: a YouTube ambient preset (4K, 30 frames per second, widescreen) and a short-form vertical preset (9:16), alongside manual settings.
- Logs every render job with its scene, seed, tier, output file, and honest flags (e.g., "preview render only").

## 4. How you use it

1. You open Video Tools and pick a scene from the Scene Generator.
2. You choose a quality tier (Draft, Standard, or Cinematic) and a preset â the YouTube ambient preset, the vertical short-form preset, or manual length and settings.
3. You leave the ambient-sound toggle ON (or switch it off) and tap Render.
4. Before a long iPhone render, a pre-render checklist states the iOS facts in plain words: the video assembles first, then saves; the SSD must be exFAT or APFS; files over 256MB need shorter durations or 1080p.
5. On the phone, you open the Queue, tap a queued scene, and the render assembles; when it's done you share it straight to the SSD or Photos via the iOS share sheet.
6. If the tab sleeps mid-render, the job pauses; you tap Continue to resume it.
7. You check the file's size to confirm it saved, and the job lands in History with its seed and honest flags.

## 5. What you see

- **Render.** Pick a scene, choose a tier in plain words ("quick preview," "good," "best"), pick a preset (YouTube ambient 4K/30fps/widescreen Â· Short-form 9:16) or manual length, an audio toggle (default ON â "ambient sound"), and a big Render button. The pre-render checklist shows the iOS facts in plain words before long iPhone renders.
- **Queue (phone render queue).** The seed to-do list: seeds saved from any generator, each with a scene thumbnail, tier, and status (queued / rendering / paused-asleep / done). Tap to render on the phone; a Continue button resumes after sleep. One-tap fixed-step export where available.
- **Exports.** Finished files with a thumbnail, a spec line ("4K Â· 30fps Â· 16:9 Â· with sound"), file size, seed and scene reference, and a share-sheet button (straight to SSD or Photos on iPhone; download on desktop). Files always land where the user can find them â never a bare link with no guidance.
- **History.** Every job: scene, seed, tier, preset, output, duration, and honest flags.

## 6. What it needs

- Scenes and seeds from the **Scene Generator** â render jobs reference a scene document plus its seed; Video Tools does not make its own scenes.
- Soundbeds from **Audio Lab** â the seeded procedural beds mixed into each render's audio track.
- The **browser's built-in video encoder** (WebCodecs â the standard in-browser way to produce MP4 video files) for the single render pipeline.
- An iPhone plus an SSD formatted **exFAT or APFS** (iPhones cannot write the Windows NTFS format) for the phone export workflow.
- Registration in the **App Wrangler** catalog once shipped (the standing rule for every app).

## 7. Choices & settings

- **Default tier** â which quality tier a new render starts on; default Standard.
- **Default preset** â which export preset a new render starts on; default the YouTube ambient preset.
- **Ambient sound default** â sound toggle ON or OFF for new renders; default ON.
- **Phone-queue device name** â which device the queue renders on.
- **SSD guidance** â shown always or shown once; default shown before every long iPhone render.
- **Sleep-pause behavior** â pause with a Continue button vs. warn-only; default pause with Continue.
- **Export filename pattern** â includes the seed by default so any file can be traced back to the render that made it.

## 8. Rules it never breaks

- **Never** promise background rendering that never pauses on the phone â iOS cannot do it; the tab sleep will pause the job, and that is stated honestly. *(funnel-filled)*
- **Always** state the iOS facts in plain words (assemble-then-save, 256MB cap, exFAT/APFS) before a long iPhone render.
- **Always** record the scene reference, seed, tier, and honest flags in the job log â a render without its seed is unrepeatable, and unrepeatable is unacceptable. *(funnel-filled)*
- **Never** use bitrate or codec jargon in anything the user reads; tiers and presets are named in plain words.
- **Always** keep YouTube publishing manual â uploading is the user's job, never the app's.
- **Never** fake an asset â still-open items get flagged honestly, never presented as finished. *(funnel-filled)*
- **Never** build a second scene source inside Video Tools â it renders Scene Generator scenes, period. *(funnel-filled)*

## 9. Done means

1. A 30-second Standard-tier render from a Scene Generator scene produces an MP4 that plays, with the seeded soundbed audible, the audio toggle respected, and the job log recording scene reference, seed, tier, and honest flags.
2. Reloading the job's seed reproduces the same video (a deterministic render path â stated honestly whether frames are byte-identical or documented-frame-identical).
3. On the iPhone path, the pre-render checklist shows assemble-then-save, exFAT/APFS, and 256MB-cap guidance in plain words, and export uses the share sheet direct to SSD or Photos.
4. A seed pushed from the Scene Generator appears in the phone queue; a simulated tab sleep pauses the job; Continue resumes it to completion.
5. The YouTube ambient preset outputs 4K/30fps/widescreen; the 9:16 preset outputs vertical; sizes stay within the documented guidance (HEVC â a compression format that shrinks big 4K files â roughly 8â12GB per 30 minutes at 4K, stated as guidance, not a gate).
6. Zero headless errors on the render â queue â export flow; no bitrate or codec jargon in user-facing strings; YouTube publishing remains manual (a documented limit, not a missing feature).

## 10. Build order

*(funnel-filled: authored from the blueprint's surfaces, ordered by dependency; no new features)*

1. **Render screen, single tier.** Pick a Scene Generator scene, render it locally, replay from seed. Checkable: a 30-second render completes and re-rendering the same seed reproduces it.
2. **Video pipeline.** Standardize on the browser's built-in video encoder producing MP4. Checkable: output is a playable MP4 file.
3. **Seeded audio mix-in.** Blend a seeded procedural soundbed as the audio track, toggle default ON. Checkable: the MP4 has audible, reproducible sound; the toggle silences it.
4. **Tier presets.** Draft / Standard / Cinematic plus the YouTube ambient and 9:16 presets. Checkable: each preset renders at its stated resolution and frame rate.
5. **Queue screen.** Seed to-do list, tap-to-render on the phone, sleep-pause with Continue. Checkable: simulated tab sleep pauses a job and Continue finishes it.
6. **Exports + iPhone flow.** Share-sheet export, pre-render iOS checklist in plain words, files landing where the user can find them. Checkable: end-to-end on iPhone, verified by file size.
7. **History + job log.** Every job logged with scene reference, seed, tier, output, and honest flags. Checkable: the log lists a completed render and its seed replays.
8. **App Wrangler registration.** The app registers itself in the catalog. Checkable: it appears in the catalog.

## 11. Technical map

For the technically inclined. Repo/branch for the app are unassigned (no code exists yet). Key records, local-first:

- `render_job`: id, scene_ref, seed, tier (draft/standard/cinematic), preset, duration_s, audio (bed_seed, enabled), destination (local/phone-queue), status (queued/rendering/paused-asleep/done/failed), output_uri, bytes, honest_flags[].
- `queue_entry`: seed, scene thumbnail, tier, added_at, device, status.
- `export_preset`: name, width, height, fps, codec, audio â plain-language labels ("YouTube ambient," "Phone short").
- `wrangler_entry`: video-tools app registration. Flagged decision: the app registers; individual renders are files, not catalog entries.
- Storage: local-first; job log is local JSON; outputs are MP4 files. Pipeline: browser-native WebCodecs MP4 export (the Vita Verde precedent, https://bassseamoor.github.io/render-queue/vita-verde.html); the aquarium's MP4 muxer approach is kept for the audio-track pipeline only, not the container.

## 12. How this plan was made

**Prior edition:** funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Source material gathered** (ramble bullets, kept for provenance):

- Standardized generator UI (all content generators): fully random / quasi-random / fully customized; saveable seeds; fresh random seed every load; **easy iPhone video export to SSD.** (MEMORY.md L19; memory/2026-09-21.md#L129)
- The user's phone is an iPhone 17 Pro Max, which they plan to use for rendering generator videos out to an SSD. (memory/2026-09-21.md#L133)
- iPhoneâSSD facts learned the hard way: the phone **cannot stream video onto the SSD during the render** (iOS restriction â the video is assembled first, then saved); the SSD must be **exFAT or APFS** (iPhones can't write NTFS); without direct-disk writing the **phone caps downloads at 256MB**, so long 4K films should use shorter durations or 1080p. (memory/2026-09-23.md#L589)
- The user was confused when a Safari download didn't appear in Photos/Files: downloads land in Files â Downloads; the standing offer (unanswered) was to change download buttons to open the iOS share sheet directly so video goes straight to the SSD or Photos. (memory/2026-09-23.md#L20)
- 2026-09-21: the user asked how much space a 30-min 4K video takes and what target spec to shoot for; advised **4K, 30fps, 16:9** as the sweet spot for ambient videos (YouTube compresses 4K uploads better; HEVC keeps 30 min â 8â12 GB); pair relaxation videos with real ambient audio. The user is actively working out their studio-footage-to-SSD pipeline. (memory/2026-09-21.md#L192)
- Render Queue production shell: **render tiers** (quality-tiered post-processing); honest limit â **iPhone overnight renders pause if the tab sleeps (Continue button).** (MEMORY.md L64)
- Phone render queue goal: save a seed from any generator into a to-do list, open the queue on any phone, tap the seed to render for the SSD; Turtle and Rain have one-tap fixed-step export. (~/workspace/goals/phone-render-queue-for-saved-seeds/GOAL.md)
- Vita Verde film studio precedent: 90-second, 20-shot, 24fps procedural harvest-to-dinner film with seeded worlds, 16:9 and 9:16 framing, original score and foley, project JSON, PNG stills, and **WebCodecs MP4 export**; live at https://bassseamoor.github.io/render-queue/vita-verde.html. Honest limits: browser live-render not verified by anyone; no 90s preview MP4 in repo (contact-sheet JPGs only). (memory/2026-09-23.md#L352; MEMORY.md Â§Vita Verde)
- Aquarium MP4 muxer + render controller precedent: the modular aquarium has an MP4 muxer, render controller, seeded generated soundbeds muxed as MP4 audio track (AAC preferred, PCM fallback), sound toggle default ON. (memory/2026-09-22.md#L457; memory/2026-09-24.md#L191)
- Fireplace video generator for YouTube goal: high-quality shippable ambient fireplace videos for YouTube monetization. (~/workspace/goals/fireplace-video-generator-for-youtube/GOAL.md)
- Standing rules: plain non-technical language; local-first; everything registered in the App Wrangler catalog (MEMORY.md L30); no spending; YouTube publishing stays manual (MEMORY.md L64).

**Ramble gaps** (explicit; the plan does not invent past them):

- GAP-1: The user never asked for a "Video Tools" app by name; the slug comes from the parent's assignment. The render queue + export pieces exist as goals and precedents, not as a unified app request.
- GAP-2: The user never chose between WebCodecs MP4 export (Vita Verde precedent) and the aquarium's MP4 muxer approach; blueprint standardizes on one pipeline (worker-authored, flagged).
- GAP-3: The user never specified render job formats beyond MP4, nor a codec preference beyond the AAC-audio-track precedent.
- GAP-4: Whether overnight renders should resume automatically vs. Continue-button manual resume was never stated beyond the documented honest limit (tab sleep pauses; Continue button exists).
- GAP-5: The user's target spec (4K/30fps/16:9, HEVC ~8â12GB per 30 min) was advice they received and acted on, not a formal order â treated as you-adjacent, flagged.

**Quiz** (8 questions; every option was valid; provenance now tagged you / funnel-filled):

- **Q1. What does Video Tools render FROM?** A) Scene Generator scenes (render jobs reference scene docs + seeds) Â· B) Its own built-in scenes Â· C) Both â **A, funnel-filled.** Rationale: the drawer already has a scene studio; a second scene source inside Video Tools duplicates it. Render jobs reference scene docs + seeds so any render is reproducible.
- **Q2. Render pipeline?** A) Standardize on WebCodecs MP4 export (Vita Verde precedent) Â· B) Standardize on the aquarium MP4 muxer + render controller Â· C) Support both, per-job choice â **A, funnel-filled (GAP-2, flagged).** Rationale: two muxers is a maintenance split the user would feel as bugs; Vita Verde's WebCodecs MP4 export is the more recent shipped precedent. The aquarium muxer's AAC-audio-track approach is kept for the audio pipeline, not the container.
- **Q3. Quality tiers?** A) Draft / Standard / Cinematic (quality-tiered post-processing, render-queue precedent) Â· B) Single quality Â· C) Fully custom settings â **A, you** (quality-tiered post-processing is the render-queue production shell's documented feature). Three named tiers in plain words; no bitrate jargon in the UI.
- **Q4. Audio on video?** A) Seeded procedural soundbed muxed as MP4 audio track (AAC), toggle default ON Â· B) Silent by default Â· C) User-supplied audio only â **A, you** (the user chose PROCEDURAL ambience for render audio â no stock audio: seeded per-studio soundbeds, AAC preferred, toggle default ON). Audio Lab supplies the beds.
- **Q5. iPhoneâSSD export?** A) Full workflow: assemble-then-save, share-sheet direct to SSD/Photos, exFAT/APFS + 256MB-cap guidance in plain words Â· B) Plain file download only Â· C) Queue-only (render on phone, fetch later) â **A, you** (easy iPhone video export to SSD is the user's explicit requirement; every iOS fact was learned from the user's own confusion and questions). The unanswered share-sheet offer is implemented here as the default.
- **Q6. Overnight renders?** A) Phone render queue: seed to-do list, tap-to-render, sleep-pause with Continue button (documented honest limit) Â· B) Background rendering that never pauses Â· C) Desktop-only long renders â **A, you** (the phone render queue is a documented user goal; the sleep-pause/Continue honest limit is documented). Promising never-pausing background rendering would invent an iOS capability that doesn't exist.
- **Q7. Target spec presets?** A) YouTube ambient preset (4K/30fps/16:9, HEVC) + short-form preset (9:16) Â· B) No presets, manual settings Â· C) Presets only, no manual â **A, you (adjacent; GAP-5, flagged)** â the 4K/30fps/16:9 target came from advice the user solicited and acted on; 16:9 and 9:16 framing is the Vita Verde shipped precedent. Manual settings remain available (not presets-only).
- **Q8. Job history?** A) Every render job logged with scene ref, seed, tier, output file, honest flags Â· B) Files only, no log Â· C) Log without files â **A, funnel-filled.** Rationale: a render without its seed is unrepeatable, which breaks the reproducibility spine.

**Locked pieces** (numbered version records; v1.0):

- Piece 01 â renders from Scene Generator scenes (scene doc + seed refs). Provenance: funnel-filled.
- Piece 02 â pipeline: WebCodecs MP4 export standardized. Provenance: funnel-filled (GAP-2 flagged; precedent memory/2026-09-23.md#L352).
- Piece 03 â tiers: Draft / Standard / Cinematic. Provenance: you (MEMORY.md L64).
- Piece 04 â audio: seeded procedural soundbed, AAC track, default ON. Provenance: you (memory/2026-09-22.md#L457).
- Piece 05 â export: full iPhoneâSSD workflow (assemble-then-save, share-sheet direct, exFAT/APFS + 256MB guidance). Provenance: you (MEMORY.md L19; memory/2026-09-23.md#L589, #L20).
- Piece 06 â overnight: phone render queue, sleep-pause with Continue. Provenance: you (goal phone-render-queue-for-saved-seeds; MEMORY.md L64).
- Piece 07 â presets: YouTube ambient (4K/30/16:9 HEVC) + 9:16 short-form, manual settings available. Provenance: you-adjacent (memory/2026-09-21.md#L192; GAP-5 flagged).
- Piece 08 â history: job log with seed/tier/output/honest flags. Provenance: funnel-filled.

**Invented along the way:** nothing beyond the flagged funnel-filled defaults above (pipeline standardization per GAP-2, scene-source exclusivity, job-log rationale). Ordering in Blank 10 is funnel-filled but introduces no new features.
