# Browser

# BROWSER â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The in-canvas viewer for the web you meet through Moor â Moor's own links, moorbymoore, and dashboards â deliberately not a browser replacement.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** S

## 1. What it is

Browser is the viewer that keeps you inside Moor when Moor itself produces a link. You tap a URL in a chat answer, a job report, a note, or a file panel, and the page opens right there in the canvas â with just back, forward, and an address bar, no tabs. It is deliberately not a browser replacement: pages that refuse to be embedded get a plain one-line explanation and a one-tap "open in system browser" button instead of a blank frame. It forgets everything when you close it â no history beyond a recent-links list, no logins, no cookies â because a scoped viewer should not hold your sign-ins.

## 2. Who it's for

- **The in-canvas reader (you):** someone tapping links inside Moor who doesn't want to be thrown out to another app for every URL.
- **The dashboard checker (you):** someone glancing at moorbymoore (the public town square) or phone-as-screen dashboards without leaving the canvas.

## 3. What it does

- Opens Moor-produced links in-canvas by default â from chat answers, job reports, notes, and file detail panels.
- Embeds the page in the Moor window when the page allows it; the address bar is also an escape hatch â you can type or paste any URL.
- Falls back honestly when a page can't be embedded (blocked headers, non-secure http URLs): a plain explanation line, the URL, and a one-tap "open in system browser" button â never a blank frame, never a spinner.
- Keeps a start page with shortcuts: moorbymoore home, download-shelf docs, and recent links.
- Forgets the session on close: no cookies, no login state; recent links are the only thing kept, stored locally.
- Sends downloads to a dedicated "Downloads" folder in Files, with a toast naming the file.

## 4. How you use it

1. You tap a link inside Moor â in a chat answer, a job report, a note, or a file detail panel.
2. The page opens in the Browser viewer, in-canvas, with back/forward and an address bar.
3. You navigate with back/forward; you can type or paste a URL into the address bar at any time.
4. If the page can't be embedded, you see a plain explanation and tap "open in system browser" instead.
5. You tap a download link; the file lands in Files â Downloads and a toast names it.
6. You close the viewer (Esc); the session is forgotten â no history, no cookies, no logins persist.

## 5. What you see

- **Viewer.** The embedded page with minimal chrome: back/forward, an editable address bar (the escape hatch â typing a URL loads it if embeddable), and close. No tabs. One viewer window at a time per the standing app-launch rule; opening a second link replaces the current page.
- **Start page.** Shortcuts: moorbymoore home, download-shelf docs, recent links (the last Moor-opened URLs, kept locally).
- **Blocked-page state.** When embedding fails (blocking headers, http URL, mixed content): one plain line ("This page can't open inside Moor"), the URL, and a one-tap "Open in system browser" button. Never a blank frame, never a spinner.
- **Downloads.** Completed downloads land in Files â Downloads with a toast naming the file.

## 6. What it needs

- **AI Assistant:** links in chat answers and job reports open in the Browser viewer.
- **Notes / File Manager:** URLs in notes and file detail panels open in the viewer; the Downloads folder lives in Files.
- **moorbymoore:** the public site is the start page's first shortcut and the viewer's primary destination.
- **Phone-as-screen dashboards:** dashboard URLs open in the viewer when tapped from Moor.
- Registration in the **App Wrangler** catalog once shipped (the standing rule for every app).

## 7. Choices & settings

Not needed for this project. Browser owns no settings in v1. The two behaviors users might eventually want â remembering logins and keeping history â are explicitly out until requested; adding them silently would contradict the private-by-default lock. If the user later asks for sign-ins inside the viewer, that's a re-run of the privacy question, not a silent upgrade.

## 8. Rules it never breaks

- **Always** keep the user inside the canvas for Moor's own links. *(funnel-filled)*
- **Never** show a blank frame or a spinner when embedding is blocked â always the plain explanation plus the one-tap system-browser button.
- **Always** forget the session on close: no cookies, no login state, no history beyond the local recent-links list.
- **Never** add tabs â it is a viewer, not a browser product. *(funnel-filled)*
- **Never** silently add logins or history later â that would be a re-run of the privacy decision, not a silent upgrade. *(funnel-filled)*
- **Always** land downloads in the same predictable place: Files â Downloads, with a toast naming the file. *(funnel-filled)*

## 9. Done means

1. Tapping a link in a chat answer opens the URL in the in-canvas viewer (not a new tab, not the system browser) â verified headless.
2. An un-embeddable URL (a test page with the standard "do not embed" header) shows the blocked-page state with the exact explanation line, the URL, and a working system-browser button â verified headless.
3. Closing the viewer forgets session state: reopening shows no history beyond the recent-links list, and no cookies persist â verified by inspecting storage after close.
4. A download link saves bytes to Files â Downloads through the plug and shows the naming toast â verified by listing the plug directory.
5. The start page shows the three shortcut groups (moorbymoore, shelf docs, recent links) â verified headless, zero page errors.
6. The app opens inside Moor through the standard app-launch path (single in-app window, Esc closes) â the standing rule.

## 10. Build order

*(funnel-filled: authored from the blueprint's surfaces, ordered by dependency; no new features)*

1. **Viewer with minimal chrome.** Embedded page, back/forward, editable address bar, close â single in-app window per the launch rule. Checkable: a link tap opens the URL in-canvas.
2. **Blocked-page state.** Plain explanation + URL + one-tap system-browser button for un-embeddable pages. Checkable: the "do not embed" test page shows the state and the button works.
3. **Start page.** Shortcuts to moorbymoore, shelf docs, recent links. Checkable: all three shortcut groups render and open.
4. **Private-by-default sessions.** No cookies, no login state; only the local recent-links list persists. Checkable: storage inspection after close shows nothing but recent links.
5. **Downloads.** Files land in Files â Downloads with a naming toast. Checkable: a download link's bytes appear in the folder.
6. **App Wrangler registration.** The app registers in the catalog. Checkable: it appears in the catalog.

## 11. Technical map

For the technically inclined. Repo/branch for the app are unassigned (no code exists yet).

- Rendering: embedded view (an iframe â a page inside the Moor window) when the page allows it; system browser when embedding is blocked. Known hard limits: X-Frame-Options headers (a website setting that says "do not embed me"), non-secure http URLs, and mixed content â the MOOR City precedent (memory/2026-09-25.md#L269) proves some pages can never embed, so the fallback is load-bearing, not decorative.
- Recent links: a local list (URL, title, openedAt), capped at 20 â the only persistence, and it's local-only (private-by-default).
- No cookie jar, no history database, no bookmarks store in v1. If the user later asks for sign-ins inside the viewer, that's a re-run of the privacy question, not a silent upgrade.
- Launch: APP_URLS registry path, singleton in-app window, Esc closes (tile: `['Browser','ð','#7fb2e5','tools',0]` â planned, not built yet).
- Downloads route through the storage plug into Files â Downloads.

## 12. How this plan was made

**Prior edition:** funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Source material gathered** (ramble bullets, kept for provenance):

- R1 â moor-ui/moor.html Apps registry: `['Browser','ð','#7fb2e5','tools',0]` â tile icon ð, category **tools**, **planned = not built yet** (last column 0).
- R2 â MOOR-BLUEPRINT.md line 382: "Browser" listed among the Apps-surface tiles. No further description anywhere in the blueprint, brief, or protocols.
- R3 â memory/2026-09-25.md#L33: Functional-wiring audit: 15 of 17 Apps report 'not connected yet' â Browser is one of the unbuilt tiles.
- R4 â memory/2026-09-25.md#L269: Standing app-launch rule: apps open inside Moor by default via the APP_URLS registry (singleton in-app window, Esc closes). Applies to Browser once built.
- R5 â MOOR-BRIEF.md: Standing UX: clean, understandable, fast; "one UI for the creator and the stranger" â no advanced mode; graceful degradation.
- R6 â MOOR-BRIEF.md / MOOR-BLUEPRINT.md: moorbymoore is the public site (social layer + "store"); the phone-as-screen pattern points "a browser" at dashboards (brief: old phone runs a browser pointed at the laptop).
- R7 â Funnel rule (standing autonomy): Where the user gave no intent, the worker authors working defaults, marks them filled-in, and flags the gaps visibly instead of inventing user intent.

**Honest statement (carried from the prior edition):** the user has never said what the in-Moor Browser is for â general web browsing? a viewer for moorbymoore? a way to open links without leaving the canvas? Every behavioral decision in this plan is a worker-authored default on the standing product rules, marked funnel-filled, with the gaps listed below.

**Ramble gaps** (explicit; the plan does not invent past them):

- GAP-B1: Purpose â general-purpose web browser vs. a scoped viewer (moorbymoore, dashboards, docs). The user never said.
- GAP-B2: Engine â the Moor feed is itself a web page; an "in-app browser" is an embedded view with real limits (blocking headers, mixed content â MOOR City already can't embed over http, memory/2026-09-25.md#L269). Whether the user expects full browsing is unknowable.
- GAP-B3: Privacy model â history, cookies, logins inside Moor. Never specified.
- GAP-B4: Relationship to links elsewhere in Moor (moorbymoore links, shared files, handoff QR codes) â never specified.
- GAP-B5: Downloads â where a downloaded file goes. Never specified.

**Quiz** (7 questions; every option was valid and realizable; provenance now tagged you / funnel-filled â all seven are funnel-filled, zero human answers):

- **Q1. What is the Browser for?** A) Full general-purpose web browsing inside Moor Â· B) A scoped viewer â opens links and moorbymoore/dashboard pages inside the canvas Â· C) Both â address bar for anywhere, but link-taps from Moor stay in-canvas by default â **B, funnel-filled.** Rationale: the user never asked for a browser replacement (GAP-B1); the honest, buildable job is keeping the user inside the canvas when Moor itself produces a link. A full-browser promise would collide with the known embedding limits (GAP-B2).
- **Q2. How are pages rendered?** A) Embedded view (iframe) inside the Moor window Â· B) Delegates to the device's real browser (opens system browser) Â· C) Embedded when the page allows it, system browser when blocked â **C, funnel-filled.** Rationale: graceful degradation (R5): the MOOR City mixed-content lesson proves some pages can never embed â the app must have a real fallback, not a dead frame.
- **Q3. Navigation chrome?** A) Full chrome â back/forward, address bar, tabs, bookmarks Â· B) Minimal â back/forward + address bar, no tabs Â· C) Just the page + a close button (pure viewer) â **B, funnel-filled.** Rationale: it's a viewer with an escape hatch, not a browser product; tabs would pretend it's something it isn't.
- **Q4. History and privacy?** A) Keeps history + cookies like a normal browser (stays signed in) Â· B) Forgets everything on close (private by default) Â· C) Keeps history, forgets cookies on close (signed-out each session) â **B, funnel-filled.** Rationale: safest default for a scoped viewer: no login state to leak, no history to manage, and it matches "assume nothing about the user" (R5).
- **Q5. Where do downloads go?** A) Straight to Files (current folder) through the storage plug Â· B) To a dedicated "Downloads" folder in Files Â· C) Ask each time (Files picker at the current location) â **B, funnel-filled.** Rationale: predictable ("your downloads are always here") without pestering the user each time; visible in Files like everything else.
- **Q6. What happens when a page can't be embedded (blocked headers, http URL)?** A) Offer "open in system browser" with one tap Â· B) Show a plain explanation and the URL to copy Â· C) Both â explanation + one-tap system-browser button â **C, funnel-filled.** Rationale: names the limit honestly and still moves the user forward.
- **Q7. First-launch page?** A) Blank start page with an address bar Â· B) moorbymoore home (the public town square) Â· C) A start page with shortcuts: moorbymoore, downloads shelf docs, recent links â **C, funnel-filled.** Rationale: gives the scoped viewer a useful home without pretending to be a portal; recent links make repeat visits one tap.

**Locked pieces** (numbered version records; v1.0):

- Piece 01 â Q1 (purpose): scoped in-canvas viewer for Moor-produced links, moorbymoore, dashboards. Provenance: funnel-filled. **Gap flag:** GAP-B1 â user never specified; re-runnable.
- Piece 02 â Q2 (rendering): embed when the page allows; one-tap system-browser fallback when blocked. Provenance: funnel-filled. **Gap flag:** GAP-B2 â embedding limits are real (MOOR City precedent).
- Piece 03 â Q3 (chrome): minimal â back/forward + address bar, no tabs. Provenance: funnel-filled.
- Piece 04 â Q4 (privacy): private by default â history and cookies forgotten on close. Provenance: funnel-filled. **Gap flag:** GAP-B3 â privacy model authored, not requested.
- Piece 05 â Q5 (downloads): dedicated "Downloads" folder in Files. Provenance: funnel-filled. **Gap flag:** GAP-B5.
- Piece 06 â Q6 (blocked pages): plain explanation + one-tap system-browser button. Provenance: funnel-filled.
- Piece 07 â Q7 (start page): shortcuts to moorbymoore, shelf docs, recent links. Provenance: funnel-filled.

**Invented along the way:** nothing beyond the flagged funnel-filled defaults above; the Q1-B + Q2-C + Q3-B coherence story (a link-viewer, not a browser) and the Q4/Q5 pairings are worker-authored orderings, not new features. Ordering in Blank 10 is funnel-filled but introduces no new features.
