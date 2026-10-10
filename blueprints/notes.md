# Notes

# NOTES â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** An instant-capture notes app that grows the shipped widget's scratch pad into a small collection of named notes.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Notes is the full-notes app as an expansion of the already-shipped Notes widget. The widget today is a single auto-saving scratch pad â type, and it's saved. The app preserves that zero-friction core â open, type, nothing to save manually â and grows it into multiple named notes with the same fast, plain-text feel. It must feel exactly as fast and simple as the widget at every scale: no rich text, no folders to manage, no sync wizards.

## 2. Who it's for

- The user themselves: quick capture, zero friction, plain text â the widget's "Type to rememberâ¦" audience, now with room for more than one note.
- Anyone who wants a scratch pad that never asks for a filename, a folder, or a save button.

## 3. What it does

- Opens onto a flat list of notes, newest first, with pinned notes on top â plus a one-tap "quick note" that behaves like the widget.
- The widget's scratch pad becomes the first note, "Scratch" â always present, never deletable; the widget is a window into it, same text, same "N words Â· saved" line, both ways live.
- Each note is a plain-text editor that autosaves as you type (the same short debounce the widget uses).
- Single search box filters all notes as you type; pins keep important notes on top and findable.
- Delete is immediate but forgiving: a 5-second "Deleted â Undo" toast; after expiry the note is gone.
- Named notes live as plain `.md` files through the storage plug, so they appear in File Manager too.

## 4. How you use it

1. You open Notes from the drawer (inside Moor, single window, Esc closes).
2. You see your list: Scratch first, then your notes newest-first, pinned ones on top.
3. You tap a note to open it â or tap "+ New" for a blank one, already focused, title becoming the first line you type.
4. You type; it saves itself (300ms debounce â a third of a second after you stop typing).
5. You swipe or long-press a row to pin/unpin; you type in the search box to filter.
6. Delete from the note menu â "Deleted â Undo" toast for 5 seconds â undo restores it.
7. Back returns to the list; everything is already saved â there is nothing to save manually.

## 5. What you see

- **Note list** â flat list, newest first, pinned notes on top. Each row: title (first line of the note, truncated), one-line preview, relative updated time ("2m ago"). Single search filter box at top. "+ New" button; tapping a row opens it.
- **Note view** â full-screen plain-text editor in the widget's styling language (borderless-feel textarea). Autosaves on the same 300ms debounce the widget uses. Header shows the title (editable inline) and the word count + "saved" state exactly like the widget's meta line. Back returns to the list; everything is already saved.
- **Scratch** â the first note, named "Scratch", always present, never deletable. The widget is a window into it: the widget's textarea edits Scratch; the app edits Scratch; both show the same text and the same "N words Â· saved" line.
- **Settings section** â the existing Widgets â Notes widget instance stays where it is; the app does not duplicate it.

## 6. What it needs

- The shipped Notes widget behavior: a single auto-saving scratch textarea (`moor.notes.v1`, 300ms debounce, "N words Â· saved" meta line) â the app preserves it pixel-for-pixel.
- The storage plug (via Settings â Sync & Backup): named notes live as plain `.md` files through it, like chats/; if the plug is unreachable, named notes fall back to a read-only list with a plain "storage unavailable" line.
- File Manager: named notes visible as plain `.md` files; openable/deletable there (delete in Files â Trash with 30-day restore â Files owns its semantics).
- Home search: notes indexed as a search source (title + first lines), consistent with the brief's three-source search index.
- Project capsules' `notes[]`: deliberately NOT unified â project context stays project-scoped; the Notes app is personal scratch (a visible seam, not a silent merge).
- The APP_URLS registry (opens inside Moor), and registration in the App Wrangler catalog once shipped (standing rule).

## 7. Choices & settings

- **Default open target** â List vs Scratch (undecided default: the list).
- **Undo-toast duration** â fixed 5s, no toggle.
- **Note storage location** â inherited from Settings â Sync & Backup; named notes follow the plug like chats/.
- **Retention** â notes are never auto-deleted; no retention policy; deletion is always user-initiated.
- That's it: no Markdown toggles, no notebook settings â complexity must earn its place.

## 8. Rules it never breaks

- Never lose the scratch pad â the widget and the Scratch note are one data home; the old saved text migrates with zero loss.
- Always save automatically (300ms debounce); never require a manual save (from the widget's exact shipped behavior).
- Never delete silently â immediate delete always comes with the one undo toast.
- Never auto-delete notes â deletion is always user-initiated (funnel-filled â implied by the no-retention lock).
- Never unify project-capsule notes with personal notes â project context stays project-scoped (from the blueprint's explicit non-unification).
- Always degrade gracefully â if the plug is unreachable, named notes are read-only with a plain line, never a failure (funnel-filled â implied by the standing graceful-degradation rule).

## 9. Done means

1. Widget behavior unchanged to the pixel and keystroke: placeholder "Type to rememberâ¦", 300ms debounced save, "N words Â· saved" meta line â verified headless against the current widget test plus a script diffing the widget's rendered HTML before/after.
2. The old saved text migrates to Scratch on first app launch with zero loss â verified by a script seeding the key, launching, and comparing bytes.
3. Typing in the widget updates the app's Scratch view and vice versa (same store) â verified headless, zero page errors.
4. Named notes appear as `.md` files on the active storage plug with the `YYYY-MM-DD_title-slug.md` convention; re-pointing the plug moves new notes; the list rebuilds from the plug listing alone.
5. Delete â undo toast (5s) restores the note; after expiry the file is gone from the plug â verified headless.
6. Search filters the list as you type; pinned notes stay on top regardless of recency â verified headless.
7. Opens inside Moor via the APP_URLS registry path (singleton in-app window, Esc closes) â the standing app-launch rule.

## 10. Build order

(funnel-filled â authored ordering of existing scope; no new features)

1. **Scratch migration** â one-way copy of the old saved text into the Scratch note's local slot on first launch; value never dropped. Checkable: seed the old key, launch, compare bytes.
2. **Note list** â flat, newest first, pin-to-top, "+ New", rows with title/preview/relative time; Scratch first and never deletable. Checkable headless.
3. **Note view** â plain-text editor, 300ms autosave, word-count + "saved" line, inline editable title; back returns to the list. Checkable headless.
4. **Widget binding** â widget edits Scratch, app edits Scratch, same text live both ways; widget UI (placeholder, debounce, word count) unchanged. Checkable headless.
5. **Search filter + delete** â single filter box across all notes; delete â 5s undo toast â gone. Checkable headless.
6. **Plug storage for named notes** â one `.md` file per note (`YYYY-MM-DD_title-slug.md`, same convention as `chats/`); re-pointing the plug moves new notes; the list rebuilds from the plug listing alone; read-only fallback with a plain line when the plug is unreachable. Checkable.
7. **App Wrangler registration + APP_URLS wiring** â then the full verification script.

## 11. Technical map

- **Scratch**: today `localStorage['moor.notes.v1']` ("moor.notes.v1" = the widget's saved-text key). On app ship: migrate the value â the Scratch note's local slot; the key is retired but the value is never dropped. One-way copy on first launch.
- **Named notes**: plain `.md` files through the storage plug, one file per note, filename `YYYY-MM-DD_title-slug.md` â same convention as `chats/`. Title = filename slug or first line.
- **Index**: pin state + updated times kept in a tiny local JSON (`moor.notes.index.v1`); rebuildable from the plug listing (stateless-friendly, like the chat rail index).
- **Widget binding**: the widget reads/writes Scratch only â same data, same store.
- **Delete seam**: delete in Notes = immediate + undo toast; delete in Files = Trash with 30-day restore â each surface owns its rule.
- **Repo/branch**: not specified â no repo was ever named for Notes (gap; see blank 12).

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Draft spec (user's documented material, condensed):** A full Notes app expanding the shipped widget: the widget's exact behavior today is a single auto-saving scratch textarea (`moor.notes.v1`, 300ms debounce, "N words Â· saved"). The app must preserve that scratch-pad core â open-and-type, nothing to save manually â and grow it into multiple named notes with the same zero-friction feel, persisting locally. No user requirements exist for sync, sharing, rich text, or search; the only hard facts are the widget's behavior, the planned tile, and "persist locally."

**Ramble gaps (explicit, still open):**
- GAP-N1: Multi-note model (notebooks? folders? tags? just a list?) â the user never specified. The widget implies one pad; the app implies more than one.
- GAP-N2: Whether Notes should sync through the storage plug (like chats/) or stay device-local (like the widget's localStorage). Undecided by the user.
- GAP-N3: Relationship to project-capsule notes (`p.notes[]` in the bundle) â keep separate or unify? No user direction.
- GAP-N4: Rich text / Markdown / attachments â never requested.
- GAP-N5: Search within notes â never requested.

**Quiz â all 7 questions auto-filled (zero human answers; six funnel-filled, one you):**
- **Q1. What does the Notes app open onto?** Options: A: The same single scratch pad as the widget (one pad, synced with the widget) Â· B: A list of named notes + one-tap "quick note" that behaves like the widget Â· C: A list of notes; the widget's scratch pad appears as the first note ("Scratch"). â **Chosen C** (funnel-filled). Rationale: preserves the widget's zero-friction core while giving the app a home for more than one note; nothing the user has breaks.
- **Q2. How do multiple notes get organized?** Options: A: Flat list, newest first, no folders Â· B: Flat list + pin-to-top Â· C: Notebooks (folders) with a flat "All notes" view. â **Chosen B** (funnel-filled). Rationale: the user's notes are scratch by nature; folders add taxonomy tax the user never asked for; pinning covers the "important few."
- **Q3. Storage model?** Options: A: Device-local only (localStorage, exactly like the widget today) Â· B: Through the storage plug as plain `.md` files (user-owned, follows re-point, like chats/) Â· C: Both â local scratch is instant, named notes go to the plug. â **Chosen C** (funnel-filled). Rationale: honors the widget's localStorage behavior (offline-instant) AND the brief's "storage is a plug" principle for user-owned content; named notes become plain `.md` files the user can see in Files.
- **Q4. Editing model?** Options: A: Plain text only, same as the widget Â· B: Plain text with Markdown rendering toggle per note Â· C: Markdown by default with a live preview toggle. â **Chosen A** (funnel-filled). Rationale: the widget is plain text; Markdown was never requested. Keep the app as fast and simple as the widget â complexity must earn its place.
- **Q5. The widget relationship after the app ships?** Options: A: Widget stays as-is (separate scratch, `moor.notes.v1`) Â· B: Widget becomes a window into the app's Scratch note (same data) Â· C: Widget gains a note picker â scratch or any note. â **Chosen B** (you â the widget's behavior is documented user material: one pad, `moor.notes.v1`). Rationale: one scratch pad, one data home â avoids the two-pads-diverge bug; the widget's exact UI (placeholder, debounce, word count) stays identical, only the backing store upgrades.
- **Q6. Search?** Options: A: No search â notes are few by design Â· B: Simple text search across all notes Â· C: Search + pin keeps important notes findable. â **Chosen B** (funnel-filled). Rationale: once there are multiple notes, findability is load-bearing; a single filter box is the smallest valid search.
- **Q7. Deletion semantics?** Options: A: Delete is immediate and permanent (matches chat-log rule: "delete it and it's gone") Â· B: Trash with 30-day auto-empty (mirrors File Manager conventions) Â· C: Immediate delete + one undo toast. â **Chosen C** (funnel-filled). Rationale: "delete it and it's gone" is the standing rule for owned files, but a transient undo keeps fat-finger deletes safe without a whole Trash system.

**Coherence check (carried over):** Q1-C + Q5-B lock together (one scratch data home). Q3-C's plug path mirrors the chat-log convention (chats/ precedent). Q7-C stays consistent with the user's "delete = gone" rule while adding the smallest safety net.

**Locked pieces (v1.0):**
- **Piece 01** â Q1 (open surface): note list; widget scratch pad = the "Scratch" note. funnel-filled.
- **Piece 02** â Q2 (organization): flat list, newest first + pin-to-top. funnel-filled.
- **Piece 03** â Q3 (storage): scratch instant-local; named notes as plain `.md` files through the storage plug. funnel-filled.
- **Piece 04** â Q4 (editing): plain text only, no Markdown. funnel-filled.
- **Piece 05** â Q5 (widget): widget renders the app's Scratch note (same data); widget UI unchanged (placeholder "Type to rememberâ¦", 300ms debounce, "N words Â· saved"). you (moor-ui/moor.html `wgNotes()`).
- **Piece 06** â Q6 (search): single text filter across all notes. funnel-filled.
- **Piece 07** â Q7 (delete): immediate + one undo toast (5s). funnel-filled.

**Source material gathered (ramble):**
- moor-ui/moor.html (feed bundle), `wgNotes()` lines 2666â2676 â **the real widget, verbatim behavior**: renders `<textarea class="wg-notes" placeholder="Type to rememberâ¦">` plus a meta line. On load, value is restored from `localStorage` key **`moor.notes.v1`** (best-effort, try/catch). On input: 300ms debounce, then saves to `moor.notes.v1`. Meta line shows word count: `"{N} word(s) Â· saved"` when non-empty, empty otherwise.
- moor-ui/moor.html line 226: widget CSS â flex-fill textarea, min-height 110px, bordered, 12.5px font: a quick-capture pad, not a document editor.
- moor-ui/moor.html line 2341, Apps registry: `['Notes','ð','#e5c87f','tools',0]` â tile icon ð, category **tools**, planned = not built yet (last column 0).
- memory/2026-09-25.md#L258: widgets catalog deployed (Clock, Weather, Calendar, **Notes**, Timer, Stopwatch, Calculator, Focus, Reminders, Battery). **"Notes and Reminders persist locally."** Playwright verified: "Notes and Reminders survived reload," zero page errors.
- memory/2026-09-25.md#L260: widgets rail button/view **removed** â Widgets became a **Settings section** (20260925-011); the same ten widget instances, re-entering does not duplicate them.
- MOOR-BLUEPRINT.md: ships "Notes" in the Apps surface tile set (line 382) and lists a Notes app among planned drawer apps. No further user requirements recorded for a full Notes app.
- MOOR-BLUEPRINT.md ("Where the harness lands" + ai-assistant ramble R1): project notes exist separately â project capsules carry `notes[]` (manual/API-added context, shown in continuity handoff). The Notes app/widget is a different thing â personal scratch notes, not project context.
