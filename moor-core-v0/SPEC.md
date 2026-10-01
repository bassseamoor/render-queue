# MOOR Core v0 — Build Spec (Rust)

*Status: SPEC. Purpose: prove the killer loop — Ask → MOOR creates → it persists → user modifies it later without data loss. This is Milestones 1–3 of the roadmap (Core, Creation, Evolution). It is deliberately NOT Milestone 4+ (no external integrations, no 3D shell, no accounts).*

*Why Rust (user's call, 2026-10-01): the trusted core earns its name — the compare-and-swap patch, atomic persistence, and permission gates get compile-time teeth instead of convention. Iteration is slower; keep the code small to pay for it.*

## 0. Source of truth

`~/workspace/moor-spec/MOOR-OBJECT-MODEL-SPEC.md` (v1, drafted 2026-10-01) is law for the object shape, lifecycle ops, and conformance checks. Implement it faithfully. Where this spec and that spec conflict, the object-model spec wins — note the conflict in your report.

## 1. Destination and toolchain

- Everything goes under `~/workspace/moor-core-v0/`. Touch NOTHING else on disk. Do not push to any repo. Do not touch `~/workspace/moor` (dirty worktree), `~/workspace/moor-main`, or anything `moor-v1`-related.
- Toolchain: rustup stable is being installed to `~/.cargo` (may still be in progress when you start — if `cargo` is not on PATH yet, use `~/.cargo/bin/cargo` or wait for the install to finish; do NOT install another toolchain).
- Cargo workspace at `~/workspace/moor-core-v0/Cargo.toml`.

## 2. Layout

```text
~/workspace/moor-core-v0/
  Cargo.toml                  # workspace
  SPEC.md                     # this file
  IR.md                       # the compiler's IR shape, documented
  README.md                   # what it is / proves / deliberately omits / how to run
  crates/
    moor-core/                # the library
      src/
        lib.rs
        id.rs                 # obj_ + 26-char Crockford base32 generation
        object.rs             # schema struct(s), validation, canonical serialization
        patch.rs              # RFC 6902 subset {add, remove, replace} + path allow/deny rules
        store.rs              # persistence, queries, subscribe, versions/snapshots
        permissions.rs        # view/edit checks + capability-call gate
        capabilities.rs       # descriptor types + registry (one local stub)
        compiler.rs           # deterministic rule-based intent → IR → object; patch intents
        apps.rs               # app-folder runtime + surface.html snapshot generation
      tests/
        conformance.rs        # C1–C6 from the object-model spec §10
    moor-demo/                # binary `demo`: the acceptance run
      src/main.rs
    moor-read/                # binary `moor-read`: tiny helper the demo spawns as a FRESH
                              # process to prove reload-from-disk (usage: moor-read <store-dir> <object-id>)
      src/main.rs
```

## 3. Dependencies — minimal and auditable

`serde` + `serde_json` (with derive) for the object model. `sha2` for content hashes. That is the entire dependency list unless you hit a wall — if you need one more (e.g. `getrandom`), you must name it in your report and justify why std wasn't enough. No network crates, no async runtime, no frameworks.

## 4. What to build

### 4.1 `object.rs` — the model
- Struct(s) matching the object-model spec §2 exactly: `id, type, name, owner, position, size, state, data, permissions, capabilities, connections, history, renderer, rev, updatedAt, tombstone?`.
- `state` and `data` are `serde_json::Value`. The split is sacred: `data` is patched surgically, never dropped silently.
- Validation on construction: required fields, name ≤ 200 chars, `owner` v1 always `user:local`, permissions default `{view: ["owner"], edit: ["owner"]}`, history entries well-formed.
- Canonical serialization: keys sorted (build via `BTreeMap` / a canonicalizer), UTF-8, no insignificant whitespace → SHA-256 → `contentHash`, stored alongside each object file and used by `snapshot`.
- `id.rs`: generate `obj_` + 26 Crockford base32 chars from OS randomness (`/dev/urandom` via std is fine on this Linux target — document the platform assumption; do NOT use a timestamp/counter scheme that can collide).

### 4.2 `patch.rs` — the compiler's verb
- RFC 6902 subset `{add, remove, replace}` over JSON-pointer paths.
- Allowed: `/name`, `/position`, `/size`, `/state`, `/data/**`, `/permissions`, `/capabilities`, `/connections`, `/renderer`. Rejected: `/id`, `/type`, `/owner`, `/rev`, `/history`, `/updatedAt`, `/tombstone`.
- Pure function: `apply_patch(&Value, &[PatchOp]) -> Result<Value, PatchError>`. The store adds the rev check.

### 4.3 `store.rs` — persistence (the heart of v0)
- Lifecycle ops per object-model spec §5: `create`, `get` (returns tombstones flagged), `patch` (applies `patch.rs`, enforces `baseRev` == current `rev` or returns a `Conflict` error — the object is left untouched), `snapshot` (immutable version record `{versionId, rev, at, contentHash}`), `duplicate` (new id, history notes the fork), `delete` (sets tombstone, history preserved).
- On every successful mutation: `rev += 1`, `updatedAt = now` (ISO-8601 UTC), history appends `{t, actor, op, summary (≤140 chars, plain language), rev}`. History is append-only, bounded at 200 (fold oldest into the nearest snapshot's notes when exceeded — or document deferral; never silently drop).
- On-disk: `store/objects/<id>.json`, `store/versions/<id>/<versionId>.json`. Atomic writes only: write temp file + `sync_all` + rename. A crash mid-write must never corrupt the last good state.
- Queries per §7: by `type`, by `owner`, by `space` (`position.space`), by capability `provider`, by connection target. Simple in-memory index rebuilt at load; document that a real index is future work.
- `subscribe(id | space | type, callback)`: in-process pub/sub. Document that cross-process live updates are future work.
- `listVersions(id)` / `getVersion(id, versionId)`; `getVersion` verifies `contentHash` and errors loudly on mismatch.

### 4.4 `permissions.rs`
- `can_view(obj, principal)`, `can_edit(obj, principal)` over `permissions: {view, edit}`; v1 principals `"owner"` / `"anyone"`.
- Capability-call gate: `can_call(app_obj, caller_principal, capability_id)` → true only if the capability id is in the app's granted `capabilities[]` AND the caller can edit the app. Denials are typed errors, never silent.

### 4.5 `capabilities.rs`
- Descriptor shape per object-model spec §3: `id/provider/description/inputs/outputs/actions/auth/ui`. HARD RULE: descriptors never contain secrets — only `auth.ref` pointers.
- Registry with ONE local stub: `local.clock` ("returns the current UTC time", `auth.kind: "none"`) so the gate has something real to guard. No external integrations — say so in the README.

### 4.6 `compiler.rs` — deterministic intent → object
- Rule-based, no LLM, no network. Parses requests like `"customer tracker with fields name, email, status"` → small JSON IR (**document the IR shape in `IR.md`**) → materializes a `moor.app` object: `data.schema = {fields: [...]}`, `data.customers = []`, `position.space = "ws_work"`, `renderer = {surface: "both", entry: "moor:app:bundle:<kit>-v1"}`.
- Three kits: `tracker` (fields + customers collection), `notes` (title/body), `list` (generic items). Anything else → a clear typed error saying what was understood and what wasn't. Never hallucinate a kit.
- `patch_app(store, app_id, intent)` handles at least `"add field <name> to <collection>"` (the object-model spec §9 "Add invoices" worked example is the canonical test): builds RFC 6902 ops, calls `store.patch` with the current rev, and on `Conflict` re-reads and re-plans — never force-writes.

### 4.7 `apps.rs` — app-folder runtime (v0)
- Apps materialize as folders `apps/<app-id>/` with `manifest.json` (id, name, kit, rev), `schema.json`, and `surface.html`.
- `surface.html`: a static snapshot generated from the live object at create/patch time — renders schema fields and current rows in a clean readable page. Document clearly: v0 snapshot rendering; live `renderer.entry` resolution is future work.
- Regenerate on every patch. The demo asserts the HTML contains the data after reload + patch.

### 4.8 `moor-demo` — the acceptance run (the whole point)
`cargo run -p moor-demo` runs fully scripted against a fresh `/tmp` store dir, prints PASS/FAIL/SKIP per step, exits 0 ONLY if every step passes:
1. `compile("make me a customer tracker with fields name, email, status")` → assert object exists, `data.schema.fields == ["name","email","status"]`, rev 1, history has the create entry.
2. Add 3 customers via `patch` (correct baseRev each time) → rev 4, rows present.
3. **Fresh-process restart**: spawn `moor-read <store-dir> <object-id>` via `std::process::Command` (a genuinely new OS process) → assert all 3 customers printed. In-process re-read does NOT count.
4. `patch_app` → "add field phone to customers" → assert rev bumped, history entry present, 3 customers intact, schema includes `phone`, `surface.html` regenerated containing the names + phone column.
5. Conflict: two patches with the same baseRev → second returns `Conflict`, object unchanged (C2).
6. Immutable paths: patch on `/id`, `/type` rejected (C3).
7. Permissions: `anyone` cannot view/edit the tracker; gate: app calling ungranted `spotify.play` → denied; granted `local.clock` → allowed.
8. Tombstone: delete → `get` returns flagged tombstone, history preserved (C6).
9. No-secrets: scan all capability descriptors for token/key/password/secret patterns → none (C4).
10. Snapshot round-trip: `snapshot()` → `getVersion` returns exact bytes, `contentHash` verifies.
11. Second consecutive full run passes (idempotent, no corruption).

### 4.9 `tests/conformance.rs`
Runnable C1–C6 from the object-model spec §10 (C1 round-trip on the §9 examples, C2 conflict, C3 immutable paths, C4 no-secrets, C5 history-append-only, C6 tombstone).

### 4.10 `README.md` / `IR.md`
README: what it is, what it proves (the killer loop, scripted), what's deliberately NOT built (external integrations, 3D shell, accounts, sync, live renderer binding — and why each waits), how to run (`cargo test`, `cargo run -p moor-demo`). IR.md: the compiler's IR shape with an example.

## 5. Done criteria (all must hold; paste evidence in your final report)
- `cargo build` succeeds with zero warnings (or every warning documented and justified).
- `cargo test` — all tests pass (paste output).
- `cargo run -p moor-demo` exits 0 with every step PASS, twice consecutively (paste FULL output of one run, summary of the second).
- The restart step provably spawns a fresh OS process (show the mechanism).
- Nothing written outside `~/workspace/moor-core-v0/` except the demo's `/tmp` scratch dir and Cargo's own caches.

## 6. Constraints
- No network code, no credentials, no secrets anywhere. Minimal deps (§3).
- Small beats complete: unneeded spec fields are stored-but-unused, never dropped — say which.
- If the object-model spec and this spec conflict, the object-model spec wins; report the conflict.
- Work silently. Do not narrate to the user — you cannot reach them. Report back when done.
