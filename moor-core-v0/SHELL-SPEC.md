# moor-shell — Interactive Windows Tester for MOOR Core v0

## Purpose
Let the user (non-technical, on Windows) *feel* the killer loop with zero setup:
double-click `moor-shell.exe` → `make` something → `add` rows → close the window →
double-click again → everything still there → `field` to evolve it. The loop is the product.

## Binary
- New crate `crates/moor-shell`, binary `moor-shell`, depends on `moor-core` only.
- **Std only. No new dependencies.** No unicode art in output — plain ASCII only
  (Windows consoles garble anything fancy; `moor> ` prompt is fine).
- Never panic on user input: every error prints a friendly one-line message and
  re-prompts. EOF on stdin exits cleanly.

## Store location
`<folder containing the exe>/moor-store/`, resolved via `std::env::current_exe()`
→ parent (fallback: current working dir). The user can literally open this folder
and see their data as plain JSON files — that visibility IS the trust story.
`shell-state.json` inside the store dir remembers the current app id:
`{ "current_app": "obj_..." }`.

## Commands (first word case-insensitive, rest as typed)
- `help` — list commands with one-line examples.
- `make <request>` — e.g. `make customer tracker with fields name, email, status`.
  Uses `compiler::compile`, stores the object, sets it current. Prints the id
  (short prefix), name, and field list. Compiler errors print honestly.
- `apps` — list every `moor.app` object: short id prefix, name, rev, row count.
- `use <id-prefix>` — switch current app (prefix match; ambiguous → list matches).
- `show` — current app as a plain table: name, fields header, one row per line
  (` | ` separated). Also prints rev and id prefix.
- `add` — interactive row entry: for each schema field print `  <field>: `,
  read one line per field (empty line = empty string), then patch the new row
  onto `/data/<collection>/-` with the correct baseRev. Print the new rev.
- `field <name>` — evolve the schema: `compiler::patch_app` "add field <name>
  to <collection>". Print new field list + rev, confirm rows intact.
- `restart` — a REAL restart: flush stdout, spawn the current exe detached
  (`std::env::current_exe` + `std::process::Command`), then exit this process.
  The new process cold-loads the store from disk. Print "restarting…" first.
- `files` — print the absolute store dir path: "your data lives here — go look."
- `quit` / `exit` — goodbye line, exit 0.

## Welcome banner (printed on start)
Plain-ASCII, short. Must convey the loop in ~4 lines, e.g.:

```text
MOOR Core v0 — interactive tester
Your data lives in <store-dir> as plain JSON files.
Try: make customer tracker with fields name, email, status
Then: add, show, close this window, open it again, show
Type help for commands.
```

If a current app is remembered, print `Resumed "<name>" (rev N). Type show.` instead
of the tutorial lines.

## Session flow notes
- First run: no apps → `make` something. `show`/`add`/`field` with no current app
  print "no app yet — try: make customer tracker with fields name, email, status".
- `make` with an empty request prints the honest compiler error + an example.
- Every mutation prints the new rev — revs going up is the persistence story
  made visible.

## Build & verify (Windows exe, cross-compiled on Linux)
- `cargo build --release --target x86_64-pc-windows-gnu -p moor-shell -p moor-demo`
- Must link **fully static** (no MinGW DLL dependency or the exe won't double-click
  on a stock Windows PC): try `RUSTFLAGS="-C link-arg=-static"` (adjust if the
  linker complains) and verify with
  `x86_64-w64-mingw32-objdump -p <exe> | grep "DLL Name"` — only system DLLs
  (KERNEL32.dll etc.) may appear; `libgcc_s_seh-1.dll` / `libstdc++-6.dll`
  must NOT.
- Smoke-test the logic on Linux first: `cargo run -p moor-shell` and pipe a
  scripted session (`printf 'make ...\nadd\n...'`), asserting the restart path
  reloads rows. The Windows exe can't be executed here — say so in the report.
- Report: exe paths, sizes, objdump DLL list, scripted session transcript.

## Also update
`README.md`: add a "Try it on Windows" section — download the two exes into one
folder, double-click `moor-shell.exe`, the 5-command loop, where the JSON lives,
and `moor-demo.exe` for the full automated proof.
