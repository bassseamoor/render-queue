# MOOR Core v0 — IR (Intermediate Representation)

The compiler (`crates/moor-core/src/compiler.rs`) is deterministic and
rule-based: it turns a natural-language request into a small JSON IR, then
materializes that IR as a `moor.app` draft object (persisted via
`store.create`). The IR is the boundary between "what the user asked for"
and "what got built" — small enough to inspect, log, and reason about
without chasing the object.

## IR shape (v0)

```json
{
  "kit": "tracker",
  "name": "Customer Tracker",
  "collection": "customers",
  "fields": ["name", "email", "status"],
  "space": "ws_work",
  "actor": "compiler",
  "source_request": "make me a customer tracker with fields name, email, status"
}
```

| Field | Meaning |
|---|---|
| `kit` | Which kit template matched: `tracker`, `notes`, or `list`. |
| `name` | Human-readable app name, derived from the request. |
| `collection` | The data collection key holding the rows (e.g. `customers`). |
| `fields` | Ordered field names, from the request's `fields a, b, c` clause or the kit default. |
| `space` | Workspace the app is placed in (`ws_work` in v0). |
| `actor` | Always `compiler` — who produced this IR. |
| `source_request` | The original request, for the history summary. |

In Rust this is the `compiler::Ir` struct (`to_json()` renders the shape
above).

## Kits (v0)

| Kit | Trigger words | Default fields | Collection |
|---|---|---|---|
| `tracker` | "tracker" | *required* — `MissingFields` error otherwise | `customers` |
| `notes` | "note"/"notes" | `title`, `body` | `notes` |
| `list` | "list" | `item` | `items` |

Anything else → `CompileError::UnknownKit`, which names what was tried
and what the compiler understands. The compiler never invents a kit.

## How the IR becomes an object

The IR is expanded into a `MoorObject` draft:

- `type: "moor.app"`, `owner: "user:local"`, fresh `obj_…` id
- `data.schema = {"fields": [...]}` (from `fields`)
- `data.<collection> = []` (empty rows at creation)
- `state = {"view": "list"}` (renderer-owned, replaceable)
- `position.space = "ws_work"`, `renderer = {"surface": "both",
  "entry": "moor:app:bundle:<kit>-v1"}` (from `kit`)
- `capabilities = [moor.app.data]` (provider `moor`, no auth)
- `permissions = {"view": ["owner"], "edit": ["owner"]}`
- `store.create` sets `rev: 1`, `updatedAt`, and the `{op: "create",
  actor: "compiler"}` history entry

The IR itself is returned transiently on the `CompiledApp`; it is NOT
persisted — the object is the record of what was built.

## Patch intents (compiler → RFC 6902)

`patch_app` parses the intent, plans against the live object, and emits
JSON Patch ops applied through the store's compare-and-swap `patch`.
Currently supported:

- `add field <name> to <collection>` →
  `add /data/schema/fields/-` plus `add /data/<collection>/<i>/<name> = ""`
  for every existing row. Data is patched surgically; no row is dropped.
  On `Conflict` the plan is rebuilt against the fresh object and retried
  once — never force-written.

Anything else → `CompileError::BadPatchIntent`, which quotes the intent
and shows the supported shape. Field names are limited to
letters/digits/underscores (so JSON-pointer escaping is never needed).
