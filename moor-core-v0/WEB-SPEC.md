# moor-web — MOOR Core v0 on the phone (WASM)

## Purpose
The user is on their iPhone and wants to push the product from their phone as proof.
Deliverable: a phone-first web page that runs the REAL Rust core (same object model,
same patch engine, same rev/conflict rules, same compiler) compiled to WASM —
no server, works offline after load, data persists on the phone. The only thing
that differs from the desktop core is the storage backend (the page keeps the
store in localStorage instead of files). Say that honestly in the page footer.

## Crate: `moor-web`
- New crate in the workspace, `crate-type = ["cdylib"]`.
- Dependencies: `moor-core` (path), `wasm-bindgen` (= CLI version you install),
  `getrandom` for id generation on wasm (see below). Nothing else unless justified.
- Read `moor-core`'s source FIRST (especially `store.rs`, `id.rs`, `compiler.rs`):
  - `id.rs` currently reads `/dev/urandom` — unavailable on `wasm32-unknown-unknown`.
    Switch id generation to the `getrandom` crate (unix: default features;
    wasm32: `features = ["js"]`), cfg-gated in one place, documented. Keep the
    `obj_` + 26-char Crockford base32 shape.
  - The file-persisting `Store` can't do file I/O on WASM. Expose the core so the
    web crate can run it against an in-memory/serialized store: whichever is the
    smaller honest change — (a) a serializable store snapshot the web crate
    deserializes → mutates → re-serializes per call, or (b) a storage trait.
    Do NOT fork the logic; the WASM path must run the same create/patch/conflict/
    permission code as desktop.
- API (one function, JSON in/out — keeps the JS side thin):
  `#[wasm_bindgen] pub fn handle(store_json: &str, cmd_json: &str) -> String`
  - Commands: `{"op":"compile","request":"..."}`, `{"op":"get"}`,
    `{"op":"add_row","row":{...}}`, `{"op":"add_field","field":"..."}`
  - Returns `{"ok":true,"store":"<updated store json>","result":{...}}`
    or `{"ok":false,"error":"<plain-language message>"}`.
  - `add_row` uses the compiler/store patch path with the correct baseRev
    (no shortcuts — conflicts must be impossible to fake).

## Page: `web/index.html` (+ `web/pkg/` from wasm-bindgen)
- Phone-first: big type, big touch targets, dark, single column. Plain,
  non-technical language everywhere (the user is not technical).
- Flow:
  1. One input: "What do you want to keep track of?" + a Make button.
     (Example placeholder: "customer tracker with fields name, email, status".)
  2. The tracker appears: name, field chips, rows as cards, "Saved · version N".
  3. Add-a-row: one input per field + Add button.
  4. "Add a field" input + button (schema evolves, rows intact).
  5. One honest line: "Close this tab and come back — your stuff is still here.
     That's the whole point."
  6. Footer: "Running the real MOOR core (Rust, in your browser). Saved on this phone."
- JS responsibilities ONLY: call `handle()`, keep the returned store JSON in
  `localStorage["moor-core-v0-store"]`, restore on load, render results.
  No business logic in JS. Zero console errors.
- `web/` must work from a static file server AND from GitHub Pages
  (relative paths; `--target web` for wasm-bindgen).

## Build
- `cargo build --release --target wasm32-unknown-unknown -p moor-web`
- `wasm-bindgen --target web --out-dir crates/moor-web/web/pkg \
  target/wasm32-unknown-unknown/release/moor_web.wasm`
  (Get wasm-bindgen-cli: prefer the prebuilt binary from the wasm-bindgen
  GitHub release matching your crate version — fast. `cargo install` is the
  slow fallback. Document which you used.)
- The wasm-bindgen crate version and the CLI version MUST match.

## Verify (headless, the honest standard)
- Serve `crates/moor-web/web/` with `python3 -m http.server`, drive it with
  Playwright (`/opt/meta-chromium/chrome`, `--enable-unsafe-swiftshader --no-sandbox`):
  1. type a make request → tracker appears,
  2. add 2 rows → shown,
  3. **reload the page** → rows still there (the phone proof),
  4. add a field → rows intact + new column,
  5. zero `pageerror` + zero console errors throughout.
- Paste the scripted transcript in your report. Captures prove function, not beauty.

## Ship
- Push `crates/moor-web/web/` to `bassseamoor/render-queue` branch `main` under
  `moor-core-v0/web/` using `~/workspace/tools/gh_multipush.py`
  (edit its FILES list per push, reset to empty afterwards; re-check head
  before the ref move per the script's own safety).
  Do NOT push to moor-v1 or the MOOR repo. Nothing outside `moor-core-v0/web/`.
- Wait for Pages propagation (~2 min), then `curl` the live URL and confirm it
  serves (200 + expected bytes):
  `https://bassseamoor.github.io/render-queue/moor-core-v0/web/`

## Also update
- `README.md`: "Try it on your phone" section with the URL + what it proves.
- `IR.md`/`SPEC.md`: only if the getrandom/store change alters documented behavior.

## Report
URL, wasm size, wasm-bindgen versions used, headless test transcript, MD5/byte
check of the live page, the getrandom/store design decision, caveats, open questions.
