# Add App

# ADD APP â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The drawer's flow for adding new apps â an app library, a "describe it" funnel path, or a simple manual form â every app registered in the App Wrangler catalog.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** L

## 1. What it is

The add-app flow is how anything becomes a Moor app. The drawer today has an "Add App" tile that is a non-clickable planned placeholder (visible only in the "All" filter, tooltip "An app library is planned â not built yet"). When built, tapping it opens an Add surface with three paths: a library of available apps to browse and add, a "describe it" intake that runs the quiz funnel for genuinely new ideas, and a short manual form for web addresses the user already has. Every path registers the app in the App Wrangler catalog â the master catalog â and the tile appears in the drawer, opening inside Moor. It is also the resolution path for the planned `Assets` tile: claiming it runs this same flow, pre-filled with its existing definition â keep it or redefine.

## 2. Who it's for

- The user themselves: everything plain, non-technical, super simple â no jargon on any label or toast.
- Funnel and worker builds: builds that pass the harness verification gates self-register into the catalog automatically (the one piece flagged as highest-reversibility â if the user ever says "ask me first," it re-runs with a visible diff).

## 3. What it does

- Makes the Add App tile clickable; opens the Add surface in a Moor window (singleton, Esc closes).
- **Library**: tiles of available apps (shipped + user-added + funnel builds), each with an "Add to drawer" button; mirrors the funnel's Library canvas concept.
- **Describe it**: the quiz funnel's rambleâblueprint intake, scoped to "a new app"; a verified build self-registers with a catalog entry.
- **Add manually**: three short steps â name â what it opens (web address or built-in) â category picker â done; each step has a valid default so skipped answers still produce a valid tile.
- **Project claiming**: the planned `Assets` tile's "Claim it" button routes here, pre-filled with its existing definition â keep it or redefine.
- **Hide/Restore**: removing a tile sets state Hidden (still in the catalog); the Library shows Hidden items with Restore.
- Keeps right-click assignment to custom tabs working for added apps (existing drawer behavior).

## 4. How you use it

1. You open the drawer and tap the Add App tile (in the "All" filter) â the Add surface opens in a Moor window (singleton, Esc closes).
2. **Library path**: you browse available apps and tap "Add to drawer" â the tile appears under the right category in the Connected section; a toast confirms in plain words ("Added. Find it under Tools.").
3. **Describe it path**: you describe the app in the quiz funnel; when the build passes the verification gates, the app registers itself and its tile appears; how each answer was decided stays visible on the blueprint.
4. **Manual path**: name â web address (labeled "Web address" with an example) â category â Done; every skipped answer is auto-filled with provenance recorded; the tile appears.
5. **Claim path**: you tap "Claim it" on a placeholder card â you land in the manual tab with the name pre-filled â you finish the flow â the tile becomes Connected.
6. To remove a tile, you hide it (Settings â Apps); it stays in the catalog and Library with a Restore button.

## 5. What you see

- **Add App tile** (drawer, "All" filter): becomes clickable; opens the Add surface. Keeps the `+` affordance; drops the PLANNED tag once the flow ships.
- **Add surface** (in-Moor window, per the app-launch rule): three tabs in plain language â
  - **Library**: tiles of available apps (shipped apps + user-added + funnel builds), each with an "Add to drawer" button. Mirrors the funnel's Library canvas concept.
  - **Describe it**: the quiz funnel's rambleâblueprint intake, scoped to "a new app"; finishing it produces a blueprint and (once built + verified) self-registers per the locked piece.
  - **Add manually**: name â what it opens (web address or built-in) â category picker (Create/Tools/Media/Dev/custom tabs) â done. No jargon; the URL field is labeled "Web address" with an example.
- **Project claim card**: the planned `Assets` tile routes its "Claim it" through this flow, pre-filling the assets blueprint's definition (purpose + views); the user may keep it or redefine the tile.

## 6. What it needs

- The **App Wrangler catalog** as the single master record â the drawer mirrors it; it is never a second database.
- The **drawer**: Connected vs Planned sections, grid/list toggle, "All" filter showing the Add App tile, custom tabs (create via `+`, right-click to assign).
- The **quiz funnel** intake for the "Describe it" path, and the **Moor harness** (ASKâSPECâpoke holesâFIT CHECKâBUILD in an isolated builderâVERIFY) for building and verifying.
- The **APP_URLS registry**: added apps open inside Moor by default (in-app window, singleton, Esc closes).
- **Settings â Apps** (existing surface): list of catalog apps with per-app row actions â Hide/Restore, recategorize, and (later) per-app open-mode override. No new top-level settings section.
- **Command palette / search**: added apps become searchable immediately; selecting one opens it in-Moor.

## 7. Choices & settings

- Per app, in Settings â Apps: **Hide/Restore**, **recategorize**, and later a per-app open-mode override (inside Moor vs new tab).
- Categories for a new app: the existing set (All, Create, Tools, Media, Dev) plus the user's custom tabs â no free-form taxonomy invented.
- Nothing else is user-configurable: the catalog entry shape is worker-authored (per blank 11) and the flow's defaults come from the funnel's auto-fill rule.

## 8. Rules it never breaks

- Always register every app in the App Wrangler catalog â the drawer is a view of the catalog, never a second database (from the standing rule).
- Always open added apps inside Moor by default (from the standing app-launch rule).
- Never invent taxonomy â categories are the existing set plus the user's custom tabs (from the current drawer).
- Never stall on a vague or skipped answer â every input state produces a valid tile via auto-fill with provenance recorded; the funnel stays total (from Funnel Rule 3).
- Always keep plain language â no jargon on any label, button, or toast (from the user's non-technical bar).

## 9. Done means

1. Add App tile is clickable in the "All" filter and opens the Add surface in a Moor window (singleton, Esc closes); zero page/console errors headless.
2. All three tabs work end-to-end: library add â tile appears in the right category's Connected section; manual add with all-skipped answers â valid tile via auto-fill with provenance recorded; funnel path â verified build self-registers with a catalog entry.
3. Every registration writes a complete App Wrangler catalog entry (all fields in blank 11); the drawer renders from the catalog â verified by adding an app, reloading, and confirming the tile persists.
4. Added apps open inside Moor by default (in-app window), not in a new tab.
5. Claiming the planned `Assets` tile via its project card lands in this flow with its definition pre-filled and registers on completion.
6. Hide/Restore round-trips: hidden apps disappear from the drawer, remain in the catalog/Library, and restore correctly.
7. Plain-language check: no jargon on any label or toast (verified by text review against the user's non-technical bar).
8. The funnel-filled pieces (01, 04, 05, 06) are marked as such in any user-visible "how this was decided" affordance, and the self-registration piece carries its re-run instruction ("if the user ever says 'ask me first,' re-run from Q5 â B with a visible diff").

## 10. Build order

(funnel-filled â authored ordering of existing scope; no new features)

1. **Catalog entry shape** â the App Wrangler entry fields (blank 11); the drawer's app array becomes a view rendered from the catalog (current hard-coded array as seed). Checkable: catalog exists, drawer mirrors it after reload.
2. **Add surface shell** â Add App tile becomes clickable in the "All" filter; opens the three-tab surface in a Moor window (singleton, Esc closes). Checkable headless, zero errors.
3. **Library tab** â available apps (shipped + user-added + funnel builds) with "Add to drawer"; tile appears in the right category's Connected section; plain-words toast. Checkable headless end-to-end.
4. **Manual tab** â name â web address â category â done; all-skipped answers auto-fill with provenance; valid tile produced. Checkable headless.
5. **States** â Connected / Planned / Hidden; Settings â Apps rows with Hide/Restore/recategorize; Hidden items visible in Library with Restore. Checkable: hide/restore round-trip headless.
6. **Project claim path** â the `Assets` project card's claim button deep-links to the manual tab with its definition pre-filled. Checkable headless.
7. **Describe-it tab** â funnel intake embedded; verified build self-registers with a catalog entry. Checkable end-to-end.
8. **Search/palette indexing of added apps**, jargon-free text review, then the full verification script.

## 11. Technical map

- **App Wrangler catalog entry** (master record) â fields (worker-authored; the catalog-schema gap resolved by convention, flagged funnel-filled): `id` (stable slug), `name` (display), `icon` (glyph), `color`, `category`, `state` (connected | planned | hidden), `open` (`in-moor` | `new-tab`; default `in-moor`), `target` (URL or built-in id), `provenance` (you | funnel-filled + source), `added_via` (library | funnel | manual | placeholder-claim), `added_at`.
- The drawer's `APPS` array becomes a **view** rendered from the catalog (migration detail authored at build time; the current hard-coded array is the seed).
- The `Assets` entry exists in the catalog with `state: planned` and its pre-authored definition (provenance per the assets blueprint).
- Persistence: localStorage under the existing drawer-state conventions; exact keys authored at build time.
- Funnel verdict: `buildApp(spec, destination, doneCriteria)` â builders receive only spec + destination + done-criteria (Funnel Rules 7â8); builds that pass the gates self-register.
- **Repo/branch**: not specified â no repo was ever named for the add-app flow (gap; see blank 12).

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Investigation trail (ramble):**
1. `muse.memory_search` ("moor app drawer add app", "moor-app placeholder drawer", "app drawer tile placeholder") â found: Apps view has 18 tiles with honest Connected/Planned sections and grid/list toggle (memory/2026-09-26.md#L36); custom tabs exist â `+` creates a tab, right-click assigns apps, state persists in localStorage (memory/2026-09-25.md#L257); built-in categories are All, Create, Tools, Media, Dev (`worlds` became a seeded custom tab). Standing app-launch rule: when someone makes an app, it opens inside Moor by default â APP_URLS registry; in-app windows are draggable/resizable/maximizable singletons, Esc closes (memory/2026-09-25.md#L269; memory/2026-09-26.md#L47).
2. `~/MEMORY.md` â standing rule: **everything built must be registered in the Colony App Wrangler catalog** (the master catalog). Also: explanations/interfaces must stay super simple and non-technical (user preference).
3. `~/workspace/moor-ui/moor.html` (the drawer source) â **found the Add App tile** in `drawApps()` (lines ~2378â2385): rendered only when the Apps filter is `all`; `+` icon, name "Add App", `PLANNED` tag; tooltip: **"An app library is planned â not built yet."** It is a non-clickable `div`. Planned-section note above it: *"These apps are not built yet. They are placeholders for what is coming â nothing here is broken, there is just nothing to open."*
4. Funnel handoff (`~/workspace/your_files/funnel-handoff.md`) â the funnel's Library is "a visual canvas (tiles) of everything: funnel-made builds + all previously shipped apps + user-added apps" (Â§3.9, Â§7) â the user-added-apps concept exists and is expected. The funnel Verdict is the exact builder call `buildApp(spec, destination, doneCriteria)` with builders receiving only spec + destination + done-criteria (Rules 7â8).
5. Protocols â Moor Harness: ASKâSPECâpoke holesâFIT CHECKâBUILD (isolated builder: spec+destination+done-criteria only)âVERIFY. Worker economy: paid per verified job.
6. `~/workspace/goals/` â no goal covers the add-app flow directly.

**User's documented material (you):**
- Standing rule: everything built must be registered in the App Wrangler catalog â the master catalog. (MEMORY.md)
- App-launch rule: when someone makes an app, it opens inside Moor by default (APP_URLS registry; in-app window, singleton, Esc closes). (memory/2026-09-25.md#L269)
- Drawer shape: Connected vs Planned sections; grid/list toggle; custom tabs via `+` and right-click; categories All/Create/Tools/Media/Dev. (memory/2026-09-25.md#L257, memory/2026-09-26.md#L36)
- UX bar: plain, non-technical, super simple. (MEMORY.md preferences)
- Funnel Library already promises user-added apps as tiles. (funnel-handoff.md Â§3.9)
- Funnel Rules 1â3: one quiz fillable by human or worker; no wrong answers; auto-fill with from-you/filled-in provenance.

**Ramble gaps (explicit, still open):**
- GAP-1 â Entry shape: library picker vs. form vs. quiz-funnel intake â the user never picked. (Resolved by worker fill in Q1, flagged funnel-filled.)
- GAP-2 â Auto-registration: whether funnel/worker builds self-register into the catalog or need user confirmation â never specified. (Q5.)
- GAP-3 â Catalog schema: exact App Wrangler fields never specified â worker-authored from the drawer tile fields + standing rules. (Q2.)
- GAP-4 â Placeholder claiming: whether tapping `cit`/`con`/`moor`/`Assets` should route through the same add-app flow â never specified. (Q6.)

**Quiz â all 8 questions, zero human answers (provenance per answer):**
- **Q1. What should the "Add App" tile open?** Options: A. An app library: browse available apps (shipped + user-added), tap to add to the drawer. Â· B. A short guided add flow: name â what it opens (URL or built-in) â category â done; plain language, no jargon. Â· C. The quiz funnel ("describe what you want, it builds the blueprint") as the proposal path for genuinely new apps. Â· D. All three: library first; "can't find it? describe it" leads to the funnel; a simple manual form for URLs the user already has. (All options worker hypotheses â D matches the tile's own tooltip: "An app library is planned"; the funnel is the user's intake mechanism.) â **Chosen D** (funnel-filled). Rationale: the tile's own tooltip promises a library; the funnel is the proven intake for new ideas; a URL form covers the trivial case â D is the only option that honors all three without dead ends.
- **Q2. Where is the master record when an app is added?** Options: A. The App Wrangler catalog â the drawer mirrors it; the catalog is the single source of truth. (you â standing rule) Â· B. The drawer's local state only, with optional catalog export. (worker hypothesis) Â· C. Both independently synced. (worker hypothesis). â **Chosen A** (you). Rationale: the standing rule is explicit; the drawer becomes a view, not a second database.
- **Q3. How do newly added apps open?** Options: A. Inside Moor by default (APP_URLS registry; in-app window, singleton, Esc closes). (you â standing app-launch rule) Â· B. New browser tab. (worker hypothesis) Â· C. Ask the user each time. (worker hypothesis). â **Chosen A** (you). Rationale: explicit user order; per-app override can come later, not now.
- **Q4. What states can a drawer app be in?** Options: A. Connected (opens) vs Planned (honest placeholder, PLANNED tag) â as today. (you â current drawer sections) Â· B. Connected / Planned / Hidden (user-removed but restorable from the catalog). (worker hypothesis) Â· C. Connected / Planned / Draft (mid-funnel builds not yet verified). (worker hypothesis). â **Chosen B** (funnel-filled). Rationale: today's two states plus Hidden, which the placeholder blueprints already require for "Remove tile" â keeps one state model across the drawer.
- **Q5. Who can add apps â and do funnel/worker builds self-register?** Options: A. The user adds manually; funnel builds register automatically once they pass verification gates. (worker hypothesis â harness: workers build AND verify) Â· B. The user adds manually; funnel builds appear as Drafts needing one user tap to register. (worker hypothesis) Â· C. Only the user, ever â workers never touch the catalog. (worker hypothesis). â **Chosen A** (funnel-filled). Rationale: harness rule "workers build AND verify" + "paid per verified job" â a build that passed the gates has earned its tile; making the user re-approve verified work is busywork. **Highest-reversibility piece**: if the user ever says "ask me first," re-run from Q5 â B with a visible diff.
- **Q6. How do the cryptic placeholder tiles (`cit`, `con`, `moor`, `Assets`) relate to this flow?** Options: A. Claiming a placeholder IS the add-app flow: tap â claim â the same guided add (rename/define â register â tile becomes Connected). (worker hypothesis) Â· B. Placeholders are separate â the add-app flow only handles brand-new apps. (worker hypothesis). â **Chosen A** (funnel-filled). Rationale: one flow, not two â the placeholder blueprints' "Claim it" buttons deep-link here, so `cit`/`con`/`moor`/`Assets` resolve through the same registered path.
- **Q7. What categories can a new app go into?** Options: A. The existing set (All, Create, Tools, Media, Dev) plus the user's custom tabs. (you â current drawer categories + custom tabs) Â· B. Free-form categories the user invents per app. (worker hypothesis). â **Chosen A** (you). Rationale: don't invent taxonomy; the custom-tab mechanism already covers anything new.
- **Q8. What does the flow do when the user can't answer (vague/skipped)?** Options: A. Worker auto-fills from the funnel's worker bank with from-you/filled-in provenance, and keeps going â every input state produces a valid tile. (you â Funnel Rule 3) Â· B. Stall and ask again. (worker hypothesis â included as valid but weak; the funnel is total, so this is the "patient" variant). â **Chosen A** (you). Rationale: explicit constitutional rule; Q8-B exists only as the valid-but-weaker alternative.

**Borrowed craft (carried over):** steals from the tech & code domain (Stacktrace â "teach them to read the error first": the flow teaches by showing, never by jargon) and the closing department (every option moves forward; claiming a placeholder is an option close). No lock-vs-blueprint conflicts with user material.

**Locked pieces (v1.0):**
- **Piece 01:** Q1 â D (Add App opens one surface: library + "describe it" funnel entry + manual URL form). funnel-filled.
- **Piece 02:** Q2 â A (App Wrangler catalog is the master record; drawer mirrors it). you (standing rule). No conflict.
- **Piece 03:** Q3 â A (added apps open inside Moor by default via APP_URLS; in-app window, singleton, Esc closes). you (standing app-launch rule). No conflict.
- **Piece 04:** Q4 â B (states: Connected / Planned / Hidden). funnel-filled. Extends (does not contradict) the current Connected/Planned model.
- **Piece 05:** Q5 â A (manual adds by user; verified funnel builds self-register). funnel-filled. Flagged as the highest-reversibility piece: if the user ever says "ask me first," re-run from Q5 â B with a visible diff.
- **Piece 06:** Q6 â A (placeholder claiming routes through this flow). funnel-filled. Cross-links the `cit`, `con`, `moor-app`, and assets blueprints.
- **Piece 07:** Q7 â A (categories: All/Create/Tools/Media/Dev + custom tabs). you (current drawer).
- **Piece 08:** Q8 â A (auto-fill with provenance; funnel total). you (Funnel Rule 3).
