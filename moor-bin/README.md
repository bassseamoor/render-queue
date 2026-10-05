# MOOR Bin

Durable GitHub backing for Pulse's universal reference graph.

The live graph remains in Pulse. This folder is the repository destination for durable snapshots, promoted references, evidence, recipes, project/version records, and artifacts that should survive outside browser storage.

## Layout

- `index.json` — backing contract and latest known snapshot metadata.
- `refs/` — serialized reference nodes, grouped by kind when written.
- `recipes/` — durable reconstruction recipes.
- `artifacts/` — durable generated outputs or manifests pointing to them.
- `evidence/` — verification evidence.
- `failures/` — durable negative evidence and retry context.
- `projects/` — project/version reference records.
- `snapshots/` — whole-graph snapshots suitable for restore or training.

Pulse also maintains a separate local `moor-bin` backing directory using the browser's Origin Private File System. A user-selected device-folder mirror may be attached where the browser supports directory access.

Do not treat presence in this folder as proof that an implementation is verified. Reference status and evidence remain authoritative.
