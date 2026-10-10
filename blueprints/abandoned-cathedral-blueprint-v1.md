# Blueprint — abandoned cathedral (v1)
Source: funnel run funnel-abandoned-cathedral-2026-10-07, intake receipt pending.
Page 0: ~/workspace/funnel-docs/abandoned-cathedral/page0-verbatim.md — his verbatim order:
"abandoned cathedral is my fucking dev environment built it now i need it"

## What this is
A real, inhabitable 3D DEV ENVIRONMENT — the room Sebastian works inside of — not a
diorama, not a demo. "abandoned cathedral" is his verbatim name; it is used everywhere
(title, HUD, manifest, tags). The space: his DEV-01 dev room rendered as a quiet
monumental interior — aged stone/steel, tall light, still air — where his actual dev
work happens: his tools open from the monitors, his work shows on the membrane, his
funnel history lines the walls. Every spatial element earns its keep for dev work
(orientation, hierarchy, attention, persistence, comparison, provenance, state
comprehension, memory, interaction) or is cut — owner law.

## Parts (files to build)
1. `cathedral-core.js` (repo root) — INERT CORE. Pure functions, zero DOM, zero network:
   - `Cathedral.ROOM = {W:320, D:180, H:90, CEILING:84}` — sealed DEV-01 geometry, feet
   - `Cathedral.monitorArc()` — 6 monitor transforms: 110° arc at r=42in, 48" 16:9 screens
   - `Cathedral.fixtureRows()` — ceiling fixture layout (barn-door theatricals, 18in arms)
   - `Cathedral.adaptManifest(json)` → {toolCount, liveCount, deadCount, source:'pulse-manifest.json'}
   - `Cathedral.adaptCommits(json)` → {count, lastChange, source} with honest unavailable path
   - `Cathedral.receipts()` — bundled real funnel receipts (labeled, with verdict paths)
   - `Cathedral.label(value, source)` — every datum carries {value, source}; missing → {unavailable:true}
   - `Cathedral.selfCheck()` — returns {pass, checks[]}: geometry math (6 monitors, 110° arc,
     room dims = sealed values), adapter honesty (no sourceless fields), naming verbatim
   - TAGS header per tag_workspace.py taxonomy.
2. `abandoned-cathedral.html` (repo root) — STANDALONE TOOL PAGE. `<script type="module">`
   importing `./three.module.js` (established rail); references `cathedral-core.js` via
   classic script (core sets window.Cathedral). Fully functional from Pages and file://.
3. `pulse-v2/tools/tool-cathedral.js` — PULSE ADAPTER. Same contract as tool-evolutionrecord.js.
   Self-contained; opens the cathedral inside Pulse.
4. COMPS entry (id 'cathedral', cat 'interface'), `pulse-manifest.json` entry
   (name "abandoned cathedral" verbatim), `pulse-tags.json` entries.

## Scene (what is built, and why each element earns its keep)
- ROOM: 320×180×90 ft, 1 unit = 1 ft, column-free per sealed REV 4. 24-in perimeter walls
  with pilaster-strip articulation and tall lancet light slots in the upper band —
  cathedral rhythm WITHOUT freestanding columns (seal stands). Visible ceiling plane at
  84 ft carrying rows of barn-door theatrical fixtures on 18-in mount arms (REV 6).
- FLOOR: dark matte stone with a faint 10-ft scored grid (orientation + scale reference).
- LIGHT: near-black ambient; soft shafts from the lancet slots (additive planes);
  sparse dust motes (Points, slow drift) — still air, not weather. Membrane blue
  #0052FF used ONLY where truth lives (evidence markers, active states).
- COMMAND NODE (Zone A): 84×36×30-in smoke-glass desk (translucent, layered), deep-charcoal
  chair mass, SIX monitors in 110° arc at r=42 in. Each monitor is a LIVE screen:
  CanvasTexture dashboard fed by real data (manifest tool count; GitHub commits API with
  DATA UNAVAILABLE fallback; bundled funnel receipts; dev-feed; blueprint farm status;
  owner decisions). Tapping a monitor opens the REAL tool in a same-origin overlay
  iframe — ≤2 interactions from 3D surface to working tool. This is what makes it a
  dev environment and not a diorama.
- MEMBRANE (four walls, 90,000 sq ft): the north wall carries the Blueprint Wall —
  farm data rendered as a composed frieze (NOT orbs, NOT a legend bar): large date
  bands, varied weights, staleness self-visible via last-change dates, every datum
  source-labeled. One wall carries the funnel evolution timeline (sealed receipts as
  architectural markers). Ambient, persistent, non-demanding.
- PROOF PLAQUE: small secondary surface at the command node showing live self-check
  result — proof lives off the main view, never as a dashboard section (defeat law).
- HUD (minimal, dark translucent chrome per his 2026-09-28 reference): top-left title
  "abandoned cathedral" + zone; bottom hint pill; right tool quick-list (≤6). No
  text-heavy dashboard habits. 44px touch targets.
- CAMERA: touch-first — one-finger orbit, pinch zoom, two-finger pan; fly-mode toggle
  (6DoF). STILL MODE: honors prefers-reduced-motion + manual toggle — static vantage
  presets, shafts/dust frozen, complete information preserved.

## Interfaces
- Core has zero dependencies. Page depends on three.module.js + cathedral-core.js.
- Adapter depends only on the dashboard tool contract.
- Data honesty contract: fetch failures render "DATA UNAVAILABLE — refusing to fabricate";
  demo/unknown content is labeled; nothing implies stronger evidence than exists (P7).

## Build steps
1. Write cathedral-core.js with TAGS header; `node --check`; `Cathedral.selfCheck()` passes
   in node (14+ checks, all pass).
2. Write abandoned-cathedral.html; `node --check` on every script block; NO canvas resize
   after getContext; per-frame uniforms uploaded in render().
3. Headless (/opt/meta-chromium/chrome --enable-unsafe-swiftshader --no-sandbox, Playwright):
   zero pageerror + zero console errors; readPixels (synchronous, same task) non-blank —
   screenshots never composite WebGL here; screenshot for DOM/HUD; tap a monitor →
   overlay opens (touchscreen.tap, never mouse click).
4. Write tool-cathedral.js per the tool-evolutionrecord.js contract.
5. COMPS + manifest + tags entries (surgical edits on repo HEAD bytes).
6. Push via gh_multipush.py in ONE commit (stale-tree rules: HEAD re-check immediately
   before push; re-download + re-apply if moved; diff item keys after).
7. Wait ~2 min; curl each file with ?v=<commit>; MD5 live == local. Claim live only on match.

## Acceptance (each must pass or be explicitly disclaimed)
- [ ] Room renders at sealed geometry (readPixels non-blank; selfCheck geometry checks pass)
- [ ] Six monitors present in 110° arc at r=42in (selfCheck); each shows live or honestly-unavailable data
- [ ] Tapping a monitor opens the real tool (overlay iframe or new tab) — ≤2 interactions
- [ ] Membrane shows farm/timeline content with source labels; no orbs, no legend bar, no text-dump
- [ ] HUD minimal; still mode freezes motion with information preserved
- [ ] Zero pageerror + zero console errors headless
- [ ] node --check clean on all script blocks; kernel MD5 unchanged
- [ ] Live MD5 matches on all pushed files

## Non-goals
- No funnel-kernel.js changes (MD5 58f454c2751a2dbdb4fb3bb8d9d0216a verified before and after).
- No scoring/ranking of his work; no appearance→cognition claims anywhere.
- No physical-room claims — virtual only, stated on the page.
- No backend; no persistence beyond bundled data + live fetches.
- Physical display binding (which screen shows the room) stays a future owner answer.
