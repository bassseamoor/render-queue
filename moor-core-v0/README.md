# MOOR Core v0 (Rust)

**What it is:** the smallest real core of MOOR — object store, atomic
persistence, permissions, a deterministic intent→object compiler, and an
app-folder runtime. Rust, three direct dependencies (`serde`,
`serde_json`, `sha2`). No network, no credentials, no secrets.

**What it proves:** the killer loop, scripted end to end —

> Ask for something → MOOR creates it → it persists → a genuinely fresh
> OS process reads it back → you modify it later → your data survives →
> conflicts, permissions, and deletes all behave.

Run it:

```sh
cd ~/workspace/moor-core-v0
cargo build              # zero warnings
cargo test               # 20 tests: 11 unit + 9 conformance (C1–C6)
cargo run -p moor-demo   # acceptance run; exits 0 only if every step passes
```

`cargo run -p moor-demo` runs the full 11-step scenario twice internally
against fresh `/tmp` store dirs (proving no hidden global state). Run the
binary twice in a row for the consecutive-pass criterion. It needs the
`moor-read` binary beside it — plain `cargo build` puts it there.

## Try it on your phone

The same Rust core, compiled to WebAssembly, running entirely in the
browser — no server, no account. Say what you want to track, add rows,
close the tab, come back: it's still there. Add a field later and your
rows survive.

**https://bassseamoor.github.io/render-queue/moor-core-v0/web/**

Your data never leaves the phone: the page keeps the store snapshot in
the browser's own storage and hands it to the core on every tap. The
scripted phone-loop proof (make → 2 rows → reload → rows persist → add
field → rows intact, zero page errors) runs headless against the real
page before every publish.

Built from this workspace with:

```sh
cargo build --release --target wasm32-unknown-unknown -p moor-web
wasm-bindgen --target web --out-dir crates/moor-web/web/pkg \
  target/wasm32-unknown-unknown/release/moor_web.wasm
```

Two wasm-only shims keep the core portable, both cfg-gated so the
desktop build is untouched: ids come from the browser's
`crypto.getRandomValues` (`getrandom` `wasm_js`), and timestamps come
from the browser clock (`js_sys::Date`) because `std` has no clock on
`wasm32-unknown-unknown` — `SystemTime::now()` panics there, which the
headless run caught.

### Baseline v1 — photos + threads

The same page now opens with your space's everyday baseline: a **Gallery**
(`moor.photo` objects — add from the phone's photo picker, downscaled to
1024px JPEG on-device before the core sees them) and **Threads**
(`moor.thread` objects — named conversations, messages appended through the
real `store.patch` compare-and-swap). Both go through the same core loops as
the tracker: real `store.create`, real rev bumps, real history entries, and
the whole store snapshot still lives in the phone's own storage — reload the
tab and everything is still there. Photos are capped so the snapshot stays
inside localStorage limits (~4MB guard with a plain-language message).

## Layout

- `crates/moor-core/src/` — the library
  - `id.rs` — `obj_`/`ver_` + 26 Crockford base32 chars from `/dev/urandom`
  - `object.rs` — schema structs, validation, canonical serialization,
    SHA-256 content hashes, UTC timestamps
  - `patch.rs` — RFC 6902 subset `{add, remove, replace}` + path
    allow/deny rules (the compiler's verb)
  - `store.rs` — persistence, compare-and-swap patch, queries,
    in-process subscribe, immutable version records
  - `permissions.rs` — view/edit principals + the capability-call gate
  - `capabilities.rs` — descriptor types, the v0 registry (one local
    stub), the no-secrets scanner
  - `compiler.rs` — deterministic intent→IR→object compiler (3 kits:
    `tracker`, `notes`, `list`); `patch_app` for patch-in-place
  - `apps.rs` — app-folder runtime: `manifest.json`, `schema.json`,
    `surface.html` (static snapshot, regenerated on create/patch)
  - `tests/conformance.rs` — C1–C6 from the object-model spec §10
- `crates/moor-demo/` — binary `demo`: the acceptance run
- `crates/moor-read/` — binary `moor-read`: the fresh-process store
  reader the demo spawns to prove reload-from-disk
- `crates/moor-shell/` — binary `moor-shell`: interactive REPL tester
  (see "Try it on Windows" below)
- `IR.md` — the compiler's intermediate representation, documented
- `SPEC.md` — the build spec this implements
- `SHELL-SPEC.md` — the build spec for `moor-shell`

## Try it on Windows

Three files, one folder, zero setup. Copy these next to each other:

- `moor-shell.exe` (~2.2 MB) — the interactive tester
- `moor-demo.exe` (~2.2 MB) — the full automated proof
- `moor-read.exe` (~2.1 MB) — helper the demo spawns (must sit beside
  `moor-demo.exe`)

All three are fully static — they link only against Windows system DLLs,
so they double-click-run on a stock Windows PC with nothing to install.

Double-click `moor-shell.exe` and try the loop:

```text
moor> make customer tracker with fields name, email, status
moor> add
moor> show
moor> restart        (or just close the window and double-click the exe again)
moor> show           (everything is still there)
moor> field phone    (the app evolves; your rows survive)
moor> show
moor> quit
```

Five commands is the whole story: **make → add → show → restart →
show → field → show**. Every mutation prints its new rev — revs going up
is the persistence story made visible.

Your data lives in `moor-store/` right next to the exe, as plain JSON
files — open the folder and look. (`files` inside the shell prints the
exact path.) Delete the folder and you start over; nothing is hidden.

`moor-demo.exe` runs the full 11-step acceptance proof automatically
(create → 3 rows → fresh-process restart → patch → conflicts →
permissions → tombstones → snapshots) and exits 0 only if every step
passes. Keep `moor-read.exe` beside it or the restart step can't run.

Built from this workspace with:

```sh
RUSTFLAGS="-C link-arg=-static" cargo build --release \
  --target x86_64-pc-windows-gnu -p moor-shell -p moor-demo -p moor-read
```

Static linking verified with
`x86_64-w64-mingw32-objdump -p <exe> | grep "DLL Name"` — only system
DLLs (`KERNEL32.dll`, `msvcrt.dll`, …) appear; no MinGW runtime DLLs.

## Deliberately NOT built (and why each waits)

- **External integrations** — v0 ships one local stub (`local.clock`, no
  auth) so the capability gate has something real to guard. Real
  providers come with Milestone 4, after the core loop is trusted.
- **Live renderer binding** — `surface.html` is a static snapshot
  regenerated at create/patch time. Resolving `renderer.entry` into a
  live renderer is future work; the snapshot says so on the page.
- **3D shell / workspace UI** — Milestone 5. The object model already
  carries `position`/`size`/`renderer` so the shell has something to read.
- **Accounts, sync, cross-process live updates** — `owner` is always
  `user:local`; `subscribe()` is in-process only. Distribution is
  Milestone 6.
- **A real query index** — queries are linear scans over an in-memory map
  rebuilt at load. Fine for v0 scale; a real index is future work.

## Design notes worth knowing

- `state` vs `data` is sacred: the renderer may replace `state`
  wholesale; `data` is only ever patched surgically, never dropped
  silently. That split is what makes "add field phone" safe.
- History is append-only and bounded at 200 entries; when the bound is
  hit, the oldest entries fold into the nearest version record's notes —
  never silently dropped.
- `duplicate()` is literal per the spec: new id, everything else
  identical (including `rev`), history gains `{op: "fork", from}`.
- Atomic writes everywhere (temp + fsync + rename + dir sync): a crash
  mid-write can never corrupt the last good state. Temp files from
  crashed writes are skipped (not loaded) on open.
- Canonical form: UTF-8, keys sorted, no insignificant whitespace, and
  whole-valued floats normalize to integers — so `0` and `0.0` (the same
  JSON number written by different producers) hash identically.
- `snapshot()` appends a `{op: "snapshot"}` history entry but does not
  bump `rev`. `tombstone` is excluded from the patch allow-list (patching
  it is rejected like the other system fields).
