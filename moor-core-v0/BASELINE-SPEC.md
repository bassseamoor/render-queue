# Baseline v1 — photos + messages as native objects (phone)

## Purpose
The space needs its everyday baseline: photos and messages as first-class
objects, not apps. Same core loops as the tracker (bring in → ask → persists →
evolves). Both, kept simple. This extends `moor-web` (the live WASM page),
not a new product.

## Core changes (`crates/moor-web`, via the existing `handle()` JSON API)
New object types through the REAL core (store.create / store.patch / baseRev —
no shortcuts, no parallel logic):
- `moor.photo`: `data = {image: <dataURL>, w, h, addedAt}`. One object per photo.
  History: `{op:"create", summary:"Added photo <name>"}`.
- `moor.thread`: `data = {messages: [{t, text}]}`. `message_add` appends via
  `store.patch` with the real baseRev compare-and-swap.
- New commands: `photo_add {name, dataUrl, w, h}`, `thread_create {name}`,
  `message_add {threadId, text}`, `list_by_type {type}` (gallery/thread lists).
  Errors are plain-language, never panics.
- Every mutation bumps rev + history, same as today. The JS keeps saving the
  returned store snapshot to localStorage (unchanged mechanism).

## Page changes (`web/index.html`, phone-first, plain language)
One page, "your space", three sections (order: gallery, threads, make-a-tracker —
the tracker maker from v0 stays, unchanged):
1. **Gallery**: "Add photos" button → `<input type=file accept="image/*" multiple>`
   (iOS photo picker). JS downscales each to max 1024px JPEG ~0.8 via canvas
   BEFORE sending to the core (keeps the phone proof inside localStorage limits).
   Grid of thumbnails; tap → simple fullscreen view; each shows "Saved".
   Empty state: "Your photos, as objects in your space. Add a few."
2. **Threads**: "New thread" (name it) → thread list → open → messages +
   message box + Send. Empty state: "Conversations that live in your space."
3. Keep the existing tracker section exactly as-is below them.
- Honest small print (one line, footer or empty states): photos are downscaled
  for this phone proof; everything is saved on this phone.
- Zero console errors. Big touch targets. Non-technical words only.

## Verify (headless, scripted — the bar)
Playwright + `/opt/meta-chromium/chrome` (--enable-unsafe-swiftshader --no-sandbox),
mobile viewport 390×844, served from `web/`:
1. Generate a test PNG locally (python), upload via `set_input_files` →
   gallery shows 1 photo.
2. **Reload** → photo still there.
3. New thread "Family" → send 2 messages → shown.
4. **Reload** → thread + both messages persist.
5. Existing tracker flow still green (make → add row → reload → intact).
6. Zero `pageerror`, zero console errors.
Paste the transcript in the report.

## Ship
- `cargo test -p moor-core` still 20/20; `cargo build` zero warnings both targets.
- Rebuild wasm, regenerate `web/pkg` with the pinned wasm-bindgen CLI (0.2.129).
- Push `web/` to `bassseamoor/render-queue@main` under `moor-core-v0/web/` with
  `~/workspace/tools/gh_multipush.py` (edit FILES per push, reset after).
  Nothing outside `moor-core-v0/web/`. Not moor-v1, not the MOOR repo.
- Wait ~2 min, curl the live page + wasm, confirm 200s and sane bytes.

## Report
Live URL, what changed (files), headless transcript, live byte-check, any core
changes needed (getrandom/js-sys shims already exist — note if touched),
caveats (localStorage photo count limits, iOS picker behavior), open questions.
