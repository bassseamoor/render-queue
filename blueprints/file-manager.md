# File Manager

# FILE MANAGER â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The visible face of Moor's storage plug â plain-language browsing, managing, and sharing of your files.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** L

## 1. What it is

File Manager is the app where the user's stored things live: "This is where I store." It shows exactly what the active storage plug points at â nothing more, nothing less â in plain language. A storage plug is Moor's storage connection: the user picks where things live (this device, an external drive, encrypted or not, over SSH) and can re-point it any time; re-pointing the plug re-points Files. Files is not a second brain and not a sync engine; the plug does the storing, Files does the showing.

## 2. Who it's for

- The user themselves: everything plain, self-explanatory, and non-technical ("This is where I store" is the product's own bar).
- Anyone who stores things in Moor and wants to find, open, share, and tidy them without learning file-system jargon.

## 3. What it does

- Browses the plug's contents: sidebar folders, breadcrumb, folder grid with item counts, file cards.
- Opens files in their owning app (`.md` in Notes, chat files in the AI Assistant, images in a viewer); unknown kinds say plainly "no app for this yet."
- Renames, deletes (to a 30-day Trash), pins to Home, stars, restores.
- Shares a file as a package to another device through the handoff channel.
- Imports files: "Add files" button plus drag-drop onto the window.
- Lets each folder be tuned: rename, icon/color, sort order, grid-or-list default.
- When the plug is unreachable, says so plainly with a button to the fix â never a stale listing, never a spinner of death.

## 4. How you use it

1. You open File Manager from the drawer (inside Moor, single window, Esc closes).
2. It lands on the Home folder contents.
3. You tap a folder to navigate (the breadcrumb tracks where you are); you tap a file to open it in its app.
4. Long-press or right-click gives a context menu: Open, Share, Rename, Pin, Delete.
5. You pin things to Home, star things to the Starred list, delete things to Trash.
6. To add files, you tap "Add files" or drag them onto the window; files other apps wrote appear automatically.
7. If storage is unreachable, you get a plain "Storage unavailable" message and a button to Settings â Sync & Backup.

## 5. What you see

- **Browser** â sidebar (Home, Projects, Worlds, Assets, Tools, Media, Dev, Shared, Recent, Starred, Trash), breadcrumb, folder grid with item counts, file cards (icon + name + size + modified date). Grid/list toggle and sort control. Lands on Home. Plain-language empty states ("Nothing here yet").
- **Detail panel** â right panel for the selected file or folder: Open, Share, Pin to Home, Folder Settings, Rename, Delete, file info (size, modified, kind). Share makes a share package to another device via the handoff channel, with the same QR/file-export fallback the AI Assistant handoff uses.
- **Trash** â deleted files rest here 30 days, restorable in one tap, auto-emptied after 30 days. "Empty trash now" button. Plain countdown text on each item ("gone in 12 days").
- **Import** â "Add files" button + drag-drop onto the window: files land in the current folder through the plug. App-created files (notes, `chats/`, job files) appear automatically â Files never hides what the plug holds.
- **Unavailable state** â plug unreachable â empty state, plain "Storage unavailable", one button to Settings â Sync & Backup. No stale listings, no spinners.

## 6. What it needs

- The storage plug interface: list, read, write, and delete through whichever plug is active â plus the plug picker state.
- Settings â Sync & Backup: the plug picker ("where things live now, where they could live, re-point in two taps"). Files links there on failure; it never re-implements the picker.
- The AI Assistant: `chats/` and job files visible and openable in Files; chat files open back in the AI Assistant. Delete semantics keep a visible seam: delete in the AI Assistant is immediate ("delete it and it's gone"); delete in Files goes to Trash â Files' Trash only catches Files-made deletions; each surface owns its delete rule.
- Notes: named-note `.md` files visible in Files; delete in Files = Trash with 30-day restore, delete in Notes = immediate + undo toast â the two surfaces keep their own delete rules (flagged as a visible seam: a Notes-deleted note past its undo window is already gone, never in Trash).
- Projects: its folder nav becomes a saved Files location; the shipped folder-nav + history UI keeps its look, backed by the one engine.
- Home search: files are a search source through the plug.
- The APP_URLS registry (opens inside Moor), and registration in the App Wrangler catalog once shipped (standing rule).

## 7. Choices & settings

- **Default sort** â how files are ordered (e.g. by name, by date).
- **Default view** â grid or list.
- **Trash auto-empty window** â fixed at 30 days per the lock below; shown, not tunable, to avoid a settings maze.
- **Per-folder settings** â rename, icon/color, sort order, grid/list default for that folder (the user's own "Folder Settings" label, filled with the full small set of per-folder preferences).
- The plug itself is owned by Settings â Sync & Backup â Files only links to it.

## 8. Rules it never breaks

- Always show exactly what the active plug points at â nothing more, nothing less; re-pointing the plug re-points Files.
- Never show a stale listing â if the plug is unreachable, say so plainly with a shortcut to the fix (funnel-filled â implied by the graceful-degradation rule).
- Never re-implement the storage plug picker â it lives in Settings â Sync & Backup; Files only links to it.
- Always use one browser engine â Projects' folder nav is a saved location inside Files, not a second implementation.
- Always respect each surface's delete rule â Files' Trash only catches Files-made deletions; never silently merge another surface's delete semantics (funnel-filled â implied by the visible-seam design).
- Never hard-fail on a missing piece â anything unavailable is fine, stated plainly (from the standing graceful-degradation rule).

## 9. Done means

1. Re-pointing the storage plug re-points Files: a script re-points the plug and the browser listing matches the new plug's root â verified headless.
2. Sidebar shows all eleven entries; breadcrumb tracks navigation; folder cards show item counts â verified headless against the spec list.
3. Delete â Trash; restore returns the file to its original path; a file deleted 30+ days ago is auto-emptied on launch â verified with seeded dates, headless.
4. Plug unreachable â the exact unavailable state with a working shortcut button; no stale listing is ever shown â verified headless with the plug stubbed offline.
5. Share produces a handoff package (same format as the AI Assistant handoff) â verified by inspecting the package bytes.
6. Import via the Add button lands bytes on the plug in the current folder â verified headless.
7. Opens inside Moor via the APP_URLS registry path (singleton in-app window, Esc closes); zero page errors.

## 10. Build order

(funnel-filled â authored ordering of existing scope; no new features)

1. **Plug read path** â list and browse the active plug; plain empty states. Checkable: the listing matches the plug's contents exactly.
2. **Browser** â sidebar (all eleven entries), breadcrumb, folder grid with item counts, file cards (icon + name + size + modified), grid/list toggle, sort control; lands on Home. Checkable headless.
3. **Detail panel** â Open (routes by kind: `.md` â Notes, chat files â AI Assistant, images â viewer; unknown kinds state plainly "no app for this yet"), Share (handoff package), Pin to Home, Folder Settings (rename, icon/color, sort, view default), Rename, Delete. Checkable headless.
4. **Trash** â 30-day auto-empty (date check on launch), one-tap restore to original path, countdown text, "Empty trash now". Checkable with seeded dates.
5. **Import** â "Add files" button + drag-drop onto the window; app-created files appear automatically. Checkable headless.
6. **Unavailable state** â plain "Storage unavailable" + working button to Settings â Sync & Backup; never a stale listing. Checkable headless with the plug stubbed offline.
7. **Folder-local search filter** (honest scope: not a global search), Projects folder nav as a saved Files location, App Wrangler registration, APP_URLS wiring â then the end-to-end verification script.

## 11. Technical map

- **All content lives on the plug; Files keeps metadata only**: pins (Home pins), starred ids, recent list (shared with the Home recent store), trash index `{id, name, originalPath, deletedAt, autoEmptyAt}` â auto-empty is a date check on launch, not a background job; per-folder settings.
- **No separate file database**: the plug listing is the source of truth (stateless-friendly).
- **Plug interface**: list/read/write/delete through whichever plug is active, plus the plug picker state (owned by Settings â Sync & Backup).
- **Delete seams**: delete in Files â Trash; delete in the AI Assistant â immediate ("delete it and it's gone"); delete in Notes â immediate + undo toast â each surface owns its rule; Files' Trash reconciles only Files-made deletions.
- **Repo/branch**: not specified â no repo was ever named for File Manager (gap; see blank 12).

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Draft spec (user's documented material, condensed):** File Manager is the visible face of the storage plug: sidebar (Home, Projects, Worlds, Assets, Tools, Media, Dev, Shared, Recent, Starred, Trash), breadcrumb, folder grid with item counts, file cards, right detail panel (Open, Share, Pin to Home, Folder Settings). It shows exactly what the active plug points at; re-pointing the plug re-points Files. Underneath: plug interface (list/read/write/delete), plug picker state, metadata (pins, starred, recent, trash). Plain non-technical language throughout ("This is where I store").

**Ramble gaps (explicit, still open):**
- GAP-F1: Trash semantics â retention period, empty behavior, restore path. Sidebar lists Trash; nothing specified its rules.
- GAP-F2: "Share" in the detail panel â share to whom/how (link? device? moorbymoore?). Never specified.
- GAP-F3: Upload/add-file flows (from phone? from the web? drag-drop?) â never specified.
- GAP-F4: Preview behavior (which file types preview inline vs open in an app) â never specified.
- GAP-F5: Search within Files â the brief's Home search covers files as a source, but a Files-internal search was never specified. (Left as a folder-local filter in v1 â honest scope.)

**Quiz â all 8 questions auto-filled (zero human answers; every answer funnel-filled):**
- **Q1. What is the default landing view?** Options: A: Home folder contents Â· B: Recent files Â· C: The sidebar's last-visited location (remembered). â **Chosen A.** Rationale: "This is where I store" â Files' job is to show the store, not the recency feed; Recent has its own sidebar entry.
- **Q2. Trash semantics?** Options: A: 30-day auto-empty, restore anytime within 30 days Â· B: Trash is manual â empties only when the user empties it Â· C: No trash for plug storage â delete is immediate (matches "delete it and it's gone"). â **Chosen A.** Rationale: the standing "delete it and it's gone" rule covers owned logs, but Files is the general store where fat-finger deletes are costliest; a bounded trash is the smallest safety that still ends in "gone."
- **Q3. What does "Share" do in the detail panel?** Options: A: Copies a local path/reference the user can paste elsewhere Â· B: Generates a share package (file + metadata) for another device via the handoff channel Â· C: Publishes to moorbymoore (public or unlisted). â **Chosen B.** Rationale: matches the offline-handoff machinery â one transport story for "move bits to my other device"; moorbymoore publishing was never requested for files.
- **Q4. File cards show?** Options: A: Icon + name only (dense grid) Â· B: Icon + name + size + modified date Â· C: Icon + name + size + date + kind badge. â **Chosen B.** Rationale: plain and self-explanatory (the standing UX rule) â enough to recognize a file, not enough to clutter a phone screen.
- **Q5. How do files get INTO Files?** Options: A: Drag-drop + an "Add files" picker button Â· B: Everything arrives via other apps (Notes, AI Assistant, downloads) â Files is read/manage only Â· C: Both (import button + app-created files appear automatically). â **Chosen C.** Rationale: Files must show "whatever the storage plug points at" â that includes files other apps wrote; the import button covers the rest. No dead ends.
- **Q6. When the storage plug is unreachable?** Options: A: Show last-known listing, grayed, with "storage unavailable" banner Â· B: Show empty state with "storage unavailable â check Sync & Backup" and a shortcut button Â· C: Show cached metadata only (names, no sizes/previews). â **Chosen B.** Rationale: graceful degradation with a next step â the banner names the fix and the button goes there; a stale grayed listing risks the user acting on dead data.
- **Q7. Folder Settings (detail panel action) controls?** Options: A: Rename + change icon/color of the folder Â· B: Rename + sort order + view (grid/list) default for that folder Â· C: Both (rename, icon/color, sort, view default). â **Chosen C.** Rationale: "Folder Settings" was the user's own label; filling it with the full small set of per-folder preferences makes the menu real instead of decorative.
- **Q8. Relationship between Files and the Projects view's existing folder nav?** Options: A: Projects keeps its own folder nav; Files is the general browser Â· B: Projects' folder nav becomes a saved location inside Files ("Projects") Â· C: Merge â Projects view embeds the Files browser for its folders. â **Chosen B.** Rationale: one browser, not two â Projects keeps its project framing, but its folder nav points at the same Files engine; avoids divergent implementations of the same thing.

**Coherence check (carried over):** Q2-A's trash applies plug-wide (consistent with Q7/Q8's single-engine view). Q3-B reuses the handoff transport from the AI Assistant â one device-transfer story across apps. Q6-B's shortcut goes to Sync & Backup, the plug picker the user already owns.

**Locked pieces (v1.0) â all funnel-filled:**
- **Piece 01** â Q1 (landing): Home folder contents.
- **Piece 02** â Q2 (trash): 30-day auto-empty; restore within 30 days.
- **Piece 03** â Q3 (share): share package â other device via handoff channel.
- **Piece 04** â Q4 (cards): icon + name + size + modified date.
- **Piece 05** â Q5 (ingest): import button + app-created files appear automatically.
- **Piece 06** â Q6 (plug unreachable): empty state + plain "storage unavailable" + shortcut button to Sync & Backup.
- **Piece 07** â Q7 (folder settings): rename, icon/color, sort order, grid/list default per folder.
- **Piece 08** â Q8 (Projects relationship): Projects' folder nav becomes a saved Files location; one browser engine.

**Source material gathered (ramble):**
- MOOR-BLUEPRINT.md ("The five surfaces" #3): **Files â the file manager, and the visible face of storage.** Sidebar: Home, Projects, Worlds, Assets, Tools, Media, Dev, Shared, Recent, Starred, Trash. Breadcrumb; folder grid with item counts; file cards; right detail panel (Open, Share, Pin to Home, Folder Settings). "This is where I store" â Files shows whatever the storage plug points at; **re-pointing the plug re-points Files.**
- MOOR-BLUEPRINT.md ("What each surface requires"): Files requires the storage plug interface (list/read/write/delete through whichever plug is active); the plug picker state; file metadata (pins, starred, recent, trash).
- MOOR-BRIEF.md: "Storage is a plug, not a place. Same device, external drive, encrypted or not, over SSH â the user picks and re-points anytime." "Storage: 'OK, right here.' A picker, not a path."
- MOOR-BLUEPRINT.md: Settings â Sync & Backup: the storage plug picker â "where things live now, where they could live, re-point in two taps."
- MEMORY.md (Moor UI build): Projects view â folder nav + history (shipped in slices 1â22).
- moor-ui/moor.html Apps registry: `['File Manager','ð','#e5c87f','tools',0]` â tile icon ð, category **tools**, planned = not built yet (last column 0).
- memory/2026-09-25.md#L426: Moor does not read the workspace folder live; generated asset libraries stay on the filesystem, Moor shows serialized planning docs. Implication: Files shows the plug's contents, not the VM workspace â the plug is the truth.
- MOOR-BRIEF.md: graceful degradation â anything unavailable is fine; never hard-fail on a missing piece. Applies directly: plug unreachable â Files says so plainly, never a spinner of death.
