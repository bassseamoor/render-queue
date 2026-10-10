# Audio Lab

# AUDIO LAB â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The app-drawer home for procedural sound â author seeded ambient sound recipes, hear them instantly, bake seamless loops, and send soundbeds to videos and scenes.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Audio Lab is the procedural-sound home of the app drawer. Instead of hunting down stock audio, you author sound recipes â "rain on a tent," "aquarium bubbles," "deep rumble" â built from seeded synthesis (sound the computer generates from a saved number, not recordings). You hear each recipe instantly through live synthesis in the browser, then bake it into a seamless looping sound file. The loops feed Video Tools renders and living scenes, and every loop carries an honest flag: this is synthesized approximation, not recorded ambience or composed music. Everything is described in plain words â "rain," "bubbles," "night crickets" â never audio-engineer jargon.

## 2. Who it's for

- **The builder (you):** someone who needs believable ambient sound for videos and scenes and chose generated sound over stock audio, who wants to tweak a bed by ear without learning a studio tool.
- **The scenes and videos themselves:** Video Tools renders and Scene Generator scenes that need reproducible, seed-tied ambience rather than downloaded files.

## 3. What it does

- Authors ambient loop recipes in the aquarium audio-spec convention: duration, sound layers, and a required one-plain-sentence description of what it must sound like.
- Plays recipes instantly through live browser synthesis (no audio files needed to audition).
- Bakes recipes into seamless 44.1kHz/16-bit WAV files (WAV: an uncompressed sound file; the numbers are the standard quality for sound files), with a scripted check that the loop's end blends into its start.
- Generates simple generative score sketches and foley hits (short sound effects) for films, following the Vita Verde precedent.
- Sends a finished bed to Video Tools with one tap â attached by seed, mixed as the standard AAC audio track, sound toggle default ON.
- Gives every saved loop a waveform thumbnail, a where-used record, and App Wrangler registration marked "needs-check" until approved by ear.
- Uses the standardized generator UI: fully random / quasi-random / fully customized, saveable seeds, fresh seed on every load.

## 4. How you use it

1. You open Audio Lab's Studio and hit Surprise-me to get a random bed recipe â say, rain.
2. You tap Audition and hear it instantly (live synthesis, no waiting for a file).
3. You lock the layers you like and remix the rest until it sounds right.
4. You write the required one-sentence description â "sounds like rain on a tent at night â steady, soft, no thunder" â without it, the recipe cannot be saved.
5. You bake the seamless loop to a WAV file; a scripted check verifies the end blends into the start.
6. You send the bed to Video Tools with one tap, or save it to Assets.
7. You approve the loop by ear, flipping its catalog state from needs-check to approved.

## 5. What you see

- **Studio.** The bed recipe editor: a layer list (each layer named in plain words â "rain patter," "deep rumble," "bubble blips" â with the technical sound-building knobs underneath for the engine, never as the primary label), the required one-plain-sentence description field, duration (default 40 seconds), a seed row (saveable, shareable as a `?seed=` link), the three generation buttons (Surprise / Remix-keeping-locks / Customize), a big Audition button (instant live sound), and a Bake WAV button.
- **Score/foley (simple).** Generative score sketches and foley hits for films: mood in plain words ("dawn, hopeful"), length matched to a film project, with the honest synthesized-approximation flag.
- **Beds library.** Saved loops with waveform thumbnails, the plain-sentence description, seed, duration, where-used (which videos and scenes use it), and catalog state.
- **Send sheet.** One-tap "Send to Video Tools" (attaches the bed's seed to the render job; mixed as AAC; toggle default ON) and "Save to Assets."

## 6. What it needs

- The **browser's live sound engine** (WebAudio â the standard in-browser way to synthesize sound) for instant audition; the funnel experiments proved procedural beds work with no audio files.
- The **browser's file-writing path** to bake WAV files locally.
- **Video Tools** as the destination for one-tap bed handoff (beds must actually reach renders to matter).
- **Assets** as the save destination for finished loops.
- Registration in the **App Wrangler** catalog once shipped (the standing rule for every app; every saved loop recipe registers as needs-check until approved by ear).

## 7. Choices & settings

- **Default duration** â how long a new loop is; default 40 seconds (the aquarium's proven loop length).
- **Default channels** â mono (single channel) or stereo (two channels); default mono per the shipped aquarium precedent, stereo optional.
- **Loop crossfade length** â how the loop's end blends into its start; default 4 seconds of equal-power blending per the aquarium's proven spec, 50 milliseconds minimum per the audio convention.
- **Audition volume** â how loud the instant preview plays; default comfortable listening level.
- **Plain labels only** â locked ON: technical fields stay visible underneath but never become the primary labels.
- **Seed history length** â how many past seeds the Studio remembers.

## 8. Rules it never breaks

- **Always** require the one-plain-sentence description â a recipe without it cannot be saved. (The convention's anti-vagueness rule, enforced.)
- **Always** carry the honest flag on every baked loop: "an approximation made from synthesis â not recorded ambience or composed music."
- **Always** run the seamless-loop gate as a scripted measurement â the crossfade is checked, not claimed. *(funnel-filled)*
- **Never** put audio-engineer jargon in primary labels â "rain," "bubbles," "deep rumble," not the technical knob names.
- **Always** default the render-audio toggle to ON when sending a bed to Video Tools (the user's documented choice).
- **Always** register every saved loop recipe as needs-check until the user approves it by ear.
- **Never** let two bakes from the same seed differ â reproducibility is the spine of the whole system. *(funnel-filled)*

## 9. Done means

1. Surprise â lock â remix â audition â bake: a 40-second rain bed bakes to a 44.1kHz/16-bit WAV; the seamless-loop gate passes with a scripted crossfade check (the end blends into the start â measured, not claimed); two bakes from the same seed are byte-identical.
2. Reloading the `?seed=` link reproduces the loop exactly, including its plain-sentence description.
3. One-tap Send to Video Tools attaches the bed's seed to a render job; the rendered MP4 carries the AAC audio track; the toggle default is ON.
4. The one-plain-sentence field is required â a recipe without it cannot be saved.
5. Every saved loop registers in the Wrangler as needs-check; the user's by-ear approval flips the state.
6. Zero headless errors on the studio â audition â bake â send flow; no audio-engineer jargon in user-facing strings (verified by a banned-word check against primary labels).

## 10. Build order

*(funnel-filled: authored from the blueprint's surfaces, ordered by dependency; no new features)*

1. **Studio shell + recipe editor.** Layer list with plain-word labels, required one-sentence description, duration and seed row, the three generation buttons (Surprise / Remix / Customize). Checkable: a recipe can be authored, locked, remixed, and saved â and cannot be saved without the one-sentence description.
2. **Live audition.** Instant playback through the browser's sound engine. Checkable: Surprise-me produces an audible bed immediately, no files involved.
3. **WAV bake + seamless-loop gate.** Bake to 44.1kHz/16-bit WAV with the scripted crossfade measurement. Checkable: two bakes from one seed are byte-identical and the gate passes.
4. **Beds library.** Waveform thumbnails, where-used records, seed links. Checkable: a baked loop appears with its thumbnail and description.
5. **One-tap send to Video Tools.** Bed seed attaches to a render job; AAC audio track; toggle default ON. Checkable: a rendered MP4 carries the bed's sound.
6. **Score/foley (simple).** Generative score sketches and foley hits for film projects, with the honest flag. Checkable: a mood + length produces a sketched score file.
7. **Wrangler registration.** Every saved loop registers as needs-check; by-ear approval flips state. Checkable: the catalog shows the loop and its state changes on approval.

## 11. Technical map

For the technically inclined. Repo/branch for the app are unassigned (no code exists yet). Key records, local-first:

- `loop_recipe`: id, name, kind (bed/score/foley), layers[] (plain_label + oscillator_type + frequency + envelope + filter), plain_sentence (required), duration_s (default 40), master_seed, loop_gate (seamless pass/fail + crossfade evidence), status.
- `baked_loop`: recipe ref, uri (WAV 44.1kHz/16-bit/mono default), sha, baked_seed, waveform_png.
- `bed_assignment`: video render job or scene id â loop ref + seed (so any render's audio is reproducible).
- `wrangler_entry`: loop id, name, waveform thumbnail, state (needs-check/approved-by-ear).
- Storage: local-first; recipes are portable JSON; bakes are WAV + waveform PNG. Engine: live WebAudio procedural synthesis for audition (no audio files); bake path writes 44.1kHz/16-bit WAV with equal-power loop crossfade (default 4s; 50ms minimum per convention). Honest lineage: the 31 aquarium loops shipped as "an approximation made from synthesis â not recorded ambience or composed music" â this app carries that honesty as a standing flag on every baked loop.

## 12. How this plan was made

**Prior edition:** funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Source material gathered** (ramble bullets, kept for provenance):

- The aquarium asset convention defines audio precisely: **44100 Hz, 16-bit, seamless loop (last sample crossfades into first over 50 ms)**; every loop spec lists duration, layers (oscillator type + frequency + envelope + filter), and **what it must sound like in one plain sentence.** (plan/asset-specs/00-conventions.md, read verbatim 2026-09-26)
- 31 audio loops were specified as build contracts (`plan/asset-specs/10-audio.md`, one of the 12 spec files) and generated: **30 environment loops (10 environments Ã base/detail/night) + 1 water/filter loop**, each a seeded synthesized WAV, mono 44.1kHz/16-bit, 40 seconds, with a 4-second equal-power loop crossfade; 31 waveform PNGs; two fresh-process rebuilds byte-identical. Honest flag at delivery: "The sound is an approximation made from synthesis â not recorded ambience or composed music." (memory/2026-09-25.md#L423; memory/2026-09-25.md#L432)
- The funnel experiments synthesized **WebAudio bubble beds procedurally (no audio files)** â a proven no-asset technique for ambient beds. (parent task brief; consistent with the synthesis approach above)
- The user chose **PROCEDURAL ambience for render audio (no stock audio)**: seeded per-studio generated soundbeds (rainforest rain+birds, aquarium water+bubbles, molten rumble, etc.), muxed as MP4 audio track (AAC preferred, PCM fallback), sound toggle default ON. (memory/2026-09-22.md#L457)
- 2026-09-21: advised to pair relaxation videos with **real ambient audio** (in the context of their studio-footage-to-SSD pipeline). (memory/2026-09-21.md#L192)
- Vita Verde precedent: "original score and foley" for the procedural film (synthesized in-browser). (memory/2026-09-23.md#L352)
- Standardized generator UI (all generators): fully random / quasi-random / fully customized; saveable seeds; fresh random seed every load; iPhone video export to SSD. (MEMORY.md L19)
- Scope guardrail from the task brief (grounded in personalization notes â user is deal-conscious, outdoors, moviegoer): keep the app creator-focused, **not audiophile-jargon**.
- Standing rules: plain non-technical language; local-first; everything registered in the App Wrangler catalog (MEMORY.md L30); no spending.

**Ramble gaps** (explicit; the plan does not invent past them):

- GAP-1: The user never asked for an "Audio Lab" app by name; the slug comes from the parent's assignment.
- GAP-2: The user never said whether they want to compose anything beyond ambient beds/scores (no statement about music composition, melodies, or instruments as a user-facing feature). Blueprint scopes v1 to ambient beds + simple score/foley generation (Vita Verde precedent), flagged.
- GAP-3: No user statement on loop durations beyond the aquarium's 40-second loops; blueprint keeps 40s default, flagged as worker-authored.
- GAP-4: The user never specified live WebAudio audition vs. bake-then-listen; the funnel experiments' procedural WebAudio beds are the grounding for live audition (you-adjacent, flagged).
- GAP-5: No user statement on whether loops should be stereo; the aquarium shipped mono (memory/2026-09-25.md#L423) â blueprint defaults mono, stereo as an option, flagged.

**Quiz** (7 questions; every option was valid; provenance now tagged you / funnel-filled):

- **Q1. What does Audio Lab make?** A) Ambient loop recipes (beds: rain, water, wind, night, rumble) Â· B) Ambient loops + simple generative score/foley (Vita Verde precedent) Â· C) Full music composition studio â **B, you (adjacent; GAP-2, flagged).** Rationale: ambient beds are the user's documented choice for render audio; "original score and foley" is the shipped Vita Verde precedent. Full composition studio (C) is valid as a later growth direction, recorded as such â not rejected as wrong.
- **Q2. Sound engine?** A) Live WebAudio procedural synthesis â audition instantly, no files Â· B) Bake-to-WAV only, listen after Â· C) Both: live audition + WAV bake â **C, you (adjacent; GAP-4, flagged).** Rationale: the funnel experiments proved procedural WebAudio bubble beds with no audio files; instant audition is what makes the app feel alive, and the WAV bake is the documented aquarium deliverable format. Audition-without-bake strands the Video Tools pipeline; bake-without-audition is slow.
- **Q3. Spec convention?** A) Enforced aquarium audio contract: duration + layers (oscillator/frequency/envelope/filter) + one plain-sentence description + seamless-loop gate Â· B) Guided templates only Â· C) Free-form â **A, you** (the convention is the user's own spec format; the seamless-loop gate continues the "verification is a script" discipline: the crossfade is measured, not claimed).
- **Q4. How do beds reach video?** A) One-tap "Send bed to Video Tools" (seeded, muxed AAC, toggle default ON) Â· B) File export only Â· C) Shared bed library both apps read â **A, funnel-filled.** Rationale: beds must actually reach renders to matter (per the user's PROCEDURAL-ambience decision), and one-tap handoff matches the locked pattern in the sibling blueprints. Toggle default ON per the user's documented choice.
- **Q5. Language of the UI?** A) Plain words only ("rain," "bubbles," "deep rumble") â no audiophile jargon Â· B) Technical labels available as an option Â· C) Technical by default â **A, you** (the task brief's scope guardrail plus the user's documented preference for plain, non-technical explanations; the convention's own rule: "what it must sound like in one plain sentence").
- **Q6. Standardized generator UI?** A) Yes â random/quasi-random/custom + saveable seeds + fresh seed on load Â· B) Simplified â **A, you** (the user's standardized generator UI covers all content generators; a "bed" is generated content).
- **Q7. Wrangler registration?** A) Every saved loop recipe registers (needs-check until user approves by ear) Â· B) Only baked WAV packs Â· C) No registration â **A, you** (standing rule; "approved by ear" is the audio equivalent of the user's-eyes approval gate).

**Locked pieces** (numbered version records; v1.0):

- Piece 01 â scope: ambient loops + simple generative score/foley; full composition = later growth, recorded. Provenance: you-adjacent (memory/2026-09-22.md#L457; memory/2026-09-23.md#L352; GAP-2 flagged).
- Piece 02 â engine: live WebAudio audition + WAV bake. Provenance: you-adjacent (funnel WebAudio beds; memory/2026-09-25.md#L423; GAP-4 flagged).
- Piece 03 â contract: enforced: duration + layers + one plain sentence + seamless-loop gate. Provenance: you (00-conventions.md).
- Piece 04 â handoff: one-tap send to Video Tools (seeded, AAC, default ON). Provenance: funnel-filled.
- Piece 05 â language: plain words only, no audiophile jargon. Provenance: you (MEMORY.md Preferences; 00-conventions.md).
- Piece 06 â UI: full standardized generator UI. Provenance: you (MEMORY.md L19).
- Piece 07 â Wrangler: every saved loop recipe registers as needs-check (approved by ear). Provenance: you (MEMORY.md L30).

**Invented along the way:** nothing beyond the flagged funnel-filled defaults above (one-tap handoff choice per Q4, byte-identical reproducibility discipline). Ordering in Blank 10 is funnel-filled but introduces no new features.
