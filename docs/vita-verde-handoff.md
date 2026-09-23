# Vita Verde build handoff — 2026-09-23

**Project:** `bassseamoor/render-queue`, branch `feature/vita-verde-film`. Started at `7d91deb884ca336081adfd84211c30393d408f51`; reconciled to main `487caa611a65d7528984bae8349041ccf7028d01`, preserving the three newer Road Atlas changes. Source of truth remains this Git repository.

**Goal:** Build the harvest-first Vita Verde story into a usable procedural film studio, following the user’s protocol v1.1.0 and the earlier production blueprint.

**Now:** A complete 90-second, 20-shot, 24-fps procedural sequence and Studio entry are implemented. A 960 × 540 MP4 preview contains all 2,160 frames, an original score, foley, the thought bubble and end card. The preview is a native EGL render of the actual scene geometry/cameras. It is not a browser recording or a Cycles film. Cycles has separately rendered representative beauty/depth frames successfully.

**Changed:** `vita-verde.html`, `vita-verde/`, `tools/vita-verde/`, `tests/vita-verde/`, `thumbs/vita-verde.jpg`, evidence under `docs/vita-verde-evidence/`, and narrow Studio registry/job additions in `index.html`. Existing renderer implementations are unchanged. Read `vita-verde/README.md` for controls and exact reproduction commands.

**Decisions:** The bent carrot and story stay fixed across seeds. Scenery and store/house families vary. Imperfect produce goes screen-left; the grocery is a cutaway while the hero remains in the collection box. Only the thought bubble depicts trash. The final dish retains a whole bent carrot without a face. Hands use IK, fixed wrist contacts and palm compression. Preview lighting is raster PBR; the separate Cycles adapter provides true path tracing and linear depth. No nutrition/pesticide claims were imported from the reference poster.

**Verified:** 16 executed Node checks cover frame/shot coverage, seek-order independence, settings round-trip, route continuity, spacing, ownership, camera framing, wrist contacts, portrait wall clearance, seed variation, steam scale, sound and registry integration. All pass. The full preview decodes with FFmpeg; FFprobe confirms 90 seconds, 2,160 H.264 frames at 24 fps, and 48 kHz AAC audio. All 20 shots and a second seed’s portrait/store/house variations were visually inspected. Cycles 4.5.12 beauty/depth renders also ran. This is a self-review, with no delegated workers or model-routing claims.

**Open:** Live browser interactions, local-storage reload behavior and browser WebCodecs export remain untested in this environment. The browser cannot open this local project through the available file navigation route; this was not bypassed. The full Cycles animation and final assembly have not run. Assets are stylized procedural geometry; hands are not a free-running soft-body simulation. This branch is not merged or publicly deployed.

**Next:** Review the film and branch; then run the browser flow on a WebGL2-capable device (play/seek, seed change, project save/reload, short MP4 with audio, cancellation). Merge/deploy only when authorized. For the final Cycles film, use the documented capture/render/assembly commands.

**Resume:** Start with this handoff, `vita-verde/README.md`, `timeline.mjs`, `director.mjs`, and the current Git diff. Evidence is labeled by render method. Do not call a native review image a browser screenshot.
