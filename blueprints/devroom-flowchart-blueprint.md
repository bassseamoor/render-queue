# BLUEPRINT v1 — Dev Room 3D Flowchart

**RID:** `funnel-moor-devroom-flowchart-2026-10-09`
**Page 0:** `~/workspace/funnel-docs/moor-devroom-flowchart/page0-verbatim.md` (sha256 `a6ff64272aab69126e66710bdcc01d0d3086eec74ff7f23a72ae8032d1402da3`)
**Status:** v1 — **owner review required; this blueprint builds nothing.** A build commission follows only on Sebastian's word.
**Standard:** MOOR-BLUEPRINT-STANDARD v1 (SELL / SPEC / SHOW). Sealed funnel v44 receipt `ef3fb4ba18a56603`.

---

## SELL

**The promise, in one breath:** the work moving through your factory, drawn in air —
a real 3D flowchart floating in your dev room: decision diamonds you can fly around,
branch edges that carry their conditions, loop-back ribbons that return upstream,
stacked in depth like floors of a cathedral you can walk through.

**The stakes.** Two weeks of drift landed here. The maker panel in your dev room is
flat, and your words were plain: *"the maker panel sucks right now and i dont know
where my 3d stacked flowchart multidimensional perspective model viewing tools are."*
The last thing shipped to you as a "flowchart" was three flat lists of boxes —
stacked labeled boxes, not a flowchart. You said so: *"That's not a flow chart."*
Without this, your commissions stay invisible: filed, funneled, decided, built —
and you never see the machine work. The factory is rigorous and invisible; that
invisibility is the defect.

**The click.** You step into the cathedral. West of your command node, in the empty
air of the room, your commission pipeline hangs as a glass sculpture: REQUESTS
splits into a decision diamond — *obligations extractable?* — the YES branch flows
to distill, verify, decide, replay; the NO branch loops back upstream to the owner
inbox. You fly *through* the loop. You hover over the replay node and its verdict
receipt glows membrane-blue. That is not a mockup. That is your factory, alive in
the room you already work inside.

**The honesty tax, stated up front.** This blueprint composes machinery that exists:
the dev room's sealed geometry, its three.js rail, its deck and band-menu UI, the
sealed funnel kernel that mints receipts. It invents no new funnel, no new graph
database, no new identity system. The graph contract (B15) is designated but its
implementation is not yet built — so the flowchart stores its own honest versioned
models now, shaped to slot into B15 later. Nothing in this blueprint ships.

---

## SPEC — LEGO-manual clarity

### Parts list

Every component named, with its role. One unit = one foot, per sealed DEV-01
geometry (`cathedral-core.js`: `ROOM = {W:320, D:180, H:90, CEILING:84}`).

| # | Part | File / home | Role |
|---|------|-------------|------|
| 1 | `flowchart-core.js` | dev room canon-build (alongside `cathedral-core.js`) | **Inert model core.** Pure functions, zero DOM, zero network, zero dependencies — the same shape as the cathedral core. Defines the flowchart graph: node types, edges, validation, deterministic 3D layout. |
| 2 | `flowchart-renderer.js` | dev room canon-build | **Scene binding.** Renders a `flowchart-core` model into the room's THREE scene (established rail: `three.module.js`, three.js r4.6). Diamonds, boxes, terminators, edge tubes, label sprites. |
| 3 | `flowchart-panel.js` | dev room canon-build (alongside `ui-deck.js`) | **Maker integration.** Registers a new FLOW tab in the dev-room deck through the existing `window.__devroomUI` registry API; wires a band-menu segment through `window.__bandMenus.initBandMenus`. |
| 4 | `flowchart-view.json` (schema, not a product) | funnel-docs | **Honest snapshot format.** Versioned JSON serialization of one flowchart model + layout hash, sha256-content-addressed. Shaped for B15 ingestion when the B15 implementation exists. |

**Composition map (reuse-before-new):**
- Geometry authority: `cathedral-core.js` — room dims, no-intersection layout math pattern (`monitorArc` chord check), `Cathedral.label(value, source)` honesty wrapper.
- WebGL rail: `three.module.js` (minified three.js r4.6 already in canon-build).
- Maker surface: `ui-deck.js` — bottom-sheet deck, 6 tabs (Make/Params/Safety/Describe/Output/System), public API `window.__devroomUI = {attach, focusWall, blur, deckState, registry, compile, generate, getState, setParam, onPreset, selfTest}`.
- Wall surface: `ui-band.js` — band menu ribbon layer, `initBandMenus(opts)` requiring `{THREE, scene, segments, makeCanvas, canvasTex, getState}`; wall index→role `0=make,1=params,2=safety,3=describe`.
- Receipt authority: `funnel-kernel.js` (sealed, LAW_VERSION `v44-sealed`) — models may not mint receipts; only the kernel can.
- Live commission rendering: `funnel-fabric-core.js` — executes real runs on the kernel; the flowchart's first live subject is the commission pipeline itself (see §Demo subject).

### Build steps (each with done-state)

1. **`flowchart-core.js` — model + validation.**
   Node types: `process` (rounded box), `decision` (diamond — the shape Sebastian
   was denied), `terminator` (capsule: start/end), `loopAnchor` (ring: a named
   re-entry point). Edge: `{from, to, label, condition?}`; an edge with `condition`
   is a **branch**; an edge whose `to` is an ancestor of `from` (or a loopAnchor)
   is a **loop**.
   - `validate(graph)` returns `[]` or hard errors: decision with fewer than 2
     labeled outgoing edges; unlabeled branch edge; duplicate node id; edge to
     missing node; loop edge that cannot name its anchor. **Done-state:** a
     `selfCheck()` returning `{pass, checks[]}` exactly like the cathedral core's,
     plus `node --check` clean.
2. **Deterministic layout.** Layer along Y = depth (the "stacked" dimension —
   upstream low, downstream high, or parallel tracks as sibling stacks);
   branches spread along X; Z carries the walkthrough depth. Layout is a pure
   function of the model + a content-seeded RNG (stable across reloads —
   same model, same sculpture, every time). **Done-state:** scripted assertion —
   two layout runs of the same model produce identical coordinates, byte-for-byte.
3. **`flowchart-renderer.js` — geometry.** Decision = octahedron (true diamond
   in 3D, not a flat lozenge); process = beveled box; terminator = capsule;
   branch edge = curved tube with a cone arrowhead and a floating label sprite
   carrying `edge.label` (condition); loop edge = the same tube, tinted amber,
   rising over the stack and descending on its anchor ring. Labels use
   CanvasTexture sprites — the same technique as the room's monitor dashboards.
   **Done-state:** headless render (Playwright + SwiftShader): zero `pageerror`,
   zero console errors, pixel-variance proof that nodes rendered, node count on
   screen matches model count.
4. **Placement.** Zone B: west of the command node, centered in the room volume,
   sized to the sealed room dims (never intersecting the monitor arc, the desk,
   or the walls — the no-intersection math pattern from `monitorArc` is
   re-applied: chord > width for every neighbor pair, verified by scripted
   Box3 test). **Done-state:** the Box3 script passes; nothing in the room
   moves to make room.
5. **`flowchart-panel.js` — deck + band wiring.** New deck tab FLOW (not a
   hijack of MAKE): lists saved flowcharts from their sha256 snapshots, opens
   one into Zone B, compiles a flowchart from a live funnel run via the kernel's
   session ledger. Band-menu wall role addition keeps `ui-band.js` untouched —
   the panel supplies `makeCanvas`/`canvasTex`/`getState` to `initBandMenus`.
   **Done-state:** `window.__devroomUI.deckState()` shows the FLOW tab; tapping
   a monitor-side surface opens a real flowchart in ≤2 interactions (the room's
   existing law: ≤2 interactions from 3D surface to working tool).
6. **Honest snapshots.** `flowchart-view.json`: `{schema, version, model,
   layoutHash, modelHash, source, createdAt}`. sha256 content hash; the model
   hash is embedded in the layout so a re-laid-out copy can be caught as stale.
   B15-shaped: node classes map to future B15 peers; when B15 is implemented,
   snapshots become ingest payloads — not a migration. **Done-state:** a
   snapshot written, re-read, layout hash re-derived identically; the file says
   `b15_status: "contract-sealed, implementation-not-built"` in its own fields
   (no conflation of sealed-contract with live-implementation).
7. **The kernel loop.** A flowchart may be *compiled from a real funnel run*:
   page0 → usage plan → references → distill → decisions → replay → verdict —
   each stage a node; the verdict node carries the kernel receipt. This uses
   `funnel-fabric-core.js`'s execute path, which runs on the sealed kernel —
   **no receipt is ever painted that the kernel did not mint.**
   **Done-state:** the first live subject (below) compiles end-to-end and its
   verdict node's receipt string verifies via `Kernel.verifyReceipt`.

### Interfaces

- `Flowchart.createGraph()` → graph; `Flowchart.addNode(id, type, label, opts)`;
  `Flowchart.addEdge(from, to, label, condition?)`; `Flowchart.validate(g)`;
  `Flowchart.layout(g)` → `{nodes:{id:{x,y,z}}, edges:[...]}`; `Flowchart.hash(g)`.
- Renderer: `FlowchartRender.attach({scene, THREE, model, layout})` → `{dispose()}`.
- Panel: `FlowchartPanel.attach({devroomUI: window.__devroomUI, band: window.__bandMenus})`.
- All DOM-free except the panel; the core imports nothing.

### Acceptance (observable, checkable, no vibes)

- `node --check` on every new file.
- Headless walkthrough (desktop + phone viewport): zero pageerrors, zero console
  errors; screenshot proves nodes on screen (pixel variance, not eyeball).
- Layout determinism script: same model → byte-identical coordinates, twice.
- Validation battery: decision-without-branches rejected; unlabeled branch
  rejected; dangling edge rejected; duplicate id rejected; loop edge without
  anchor rejected; valid sample passes.
- Box3 no-intersection test against room geometry from `cathedral-core.js`.
- Kernel receipt on the compiled-run flowchart verifies via `verifyReceipt`.
- Owner checkpoint: **Sebastian reviews this blueprint before any build.**
  Build, if ordered, runs as its own funnel commission — never as an amendment
  to this run.

### Non-goals (the honest boundary)

- No new funnel, no new receipt system, no new identity system, no new graph
  database. B15 stays the designated graph contract; this blueprint does not
  build it.
- No second dev room. The flowchart lives inside DEV-01, on the established rail.
- No fake telemetry: if a flowchart's data is unavailable, its node shows the
  room's DATA UNAVAILABLE pattern (per the cathedral blueprint's adapter law),
  never a plausible-looking lie.
- No iPhone claims from the builder: Sebastian's iPhone is the only real-iPhone
  QA. The builder proves on desktop + phone viewport; he confirms on his phone.
- No push, no ship, no build from this run. This blueprint is the checkpoint
  Page 0 ordered.

---

## SHOW — the experience, in the room

### The room, cross-section (Zone B, from above)

```
                NORTH WALL (membrane)
 ┌──────────────────────────────────────────────────┐
 │                                                  │
 │   ┌─ command node (6 monitors, arc r=84in) ─┐   │
 │   │            [you sit here]                │   │
 │   └──────────────────────────────────────────┘   │
 │                                                  │
 │        ZONE B — the flowchart sculpture           │
 │                                                  │
 │      ◆ decision diamond (octahedron, blue)       │
 │     ╱ ╲ branch edges (tubes, labeled sprites)    │
 │   [A]   [B]  process boxes, spread along X       │
 │     ╲ ╱                                          │
 │      ╰⤺ amber loop ribbon, over the stack        │
 │         back to the loop-anchor ring             │
 │                                                  │
 │   layers rise in Y: upstream low, downstream     │
 │   high — the "stacked" dimension he asked for    │
 └──────────────────────────────────────────────────┘
```

### The first live subject — his own commission pipeline

The flowchart that proves the tool is the funnel's own shape, compiled from a
real run (`funnel-devroom-request-result-2026-10-09`, built 2026-10-09):

```
   (start)──▶[REQUEST filed]──▶{obligations extractable?}──▶YES──▶[distill]
                │                                              │
                │ NO                                           ▼
                ▼                                        {all obligations
        [owner inbox loop]◀── loop-back ── amber ribbon ── have evidence?}
                │                                              │
                ▼                                              ▼ YES
        [clarify + refile]──▶(re-enter)                    [decide]──▶[replay]
                                                                      │
                                                                      ▼
                                                              {verdict sealed?}
                                                              YES: [receipt — membrane blue]
                                                              NO: [held — red]──▶ loop to owner
```

Hover a node: its source (page0 quote, ledger line, receipt fingerprint) rides
the label sprite — every datum carries its source, the cathedral's honesty law.

### Color carries meaning (not decoration)

- **Membrane blue `#0052FF`** — truth only: kernel receipts, sealed verdicts.
- **Amber** — loop-back edges: the machine returning upstream.
- **Charcoal + warm white** — process nodes and labels: the room's stone palette.
- **Red** — a held/blocked node: never hidden, always labeled with its grounds.

### Detail density

Decision diamonds are true octahedra — walk around one and it stays a diamond
from every angle, which is exactly what the fake "stacked boxes" failed to be.
Branch labels are CanvasTexture sprites, legible at 20 ft, fading with distance
like the monitor dashboards. Loop ribbons arc *over* the stack and descend onto
ring anchors — you see the loop before you read it.

---

## Open questions for the owner (answered by defaults unless he says otherwise)

1. **First live subject.** Default: the commission-pipeline replay above
   (compiled from the real sealed run). Alternative: a flowchart of his own
   choosing — he names the subject, the builder compiles it.
2. **Placement.** Default: Zone B room volume (walkthrough sculpture).
   Alternative: a flowchart monitor in the command-node arc. Default wins on
   his own words — "3D stacked multidimensional perspective model" — which a
   flat screen cannot be.
3. **Deck tab.** Default: new FLOW tab beside MAKE (his complaint was that the
   maker panel sucks; hijacking MAKE would prove him right).

**Version history:** v1 (2026-10-09) — initial blueprint for owner review.
