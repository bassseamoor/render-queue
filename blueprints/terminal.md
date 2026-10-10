# Terminal

# TERMINAL â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** A safe command line for Moor â a sandboxed shell with a plain-language command palette, friendly to non-technical users.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

Terminal is a dev-category app in the Moor drawer that lets you run everyday commands â checking disk space, listing files, seeing what's running â against a sandboxed Moor shell. A sandboxed shell is a safe, limited command area: only commands on an approved list run, and it cannot touch the rest of your device. Alongside the classic prompt sits a command palette that translates plain intents ("show me disk space") into the actual command. It is a utility, not a power tool â the real, full-power shell stays on the user's own machine.

## 2. Who it's for

- The user themselves: they want everything plain, self-explanatory, and non-technical ("not as tech savvy as they lead on"). They have never actually asked for a terminal â this is an honest gap (GAP-T2 in blank 12), and the command palette is the hedge that keeps it usable for them.
- People comfortable with a command line who want the familiar prompt idiom inside Moor.

## 3. What it does

- Runs safe commands from an approved list â anything not on the list is refused in plain words ("I can't run that here").
- Command palette: pick a plain-language task ("Check disk space", "List files here", "Show what's running"); it fills the command and shows what it will do in one plain sentence before running.
- Asks for confirmation in plain language before destructive commands (deletes, overwrites, network fetches): "This will permanently delete 14 files in Projects/demo. Continue?"
- Saves long output to a plain text file in File Manager.
- Sends output to the AI Assistant ("Send output to Ask") as quoted context.
- `help` lists every safe command grouped by plain task name; `clear` clears the view (history is kept per session).

## 4. How you use it

1. You open Terminal from the drawer (it opens inside Moor, in a single window; Esc closes it).
2. You see a prompt with a blinking cursor and a one-line hint: type `help` for safe commands.
3. You type a command â or open the command palette and pick a plain-language task.
4. The palette shows what the command will do in one plain sentence; you confirm.
5. If the command is destructive, a plain-language confirmation pauses first; cancel runs nothing.
6. Output streams into the scrollback.
7. You act on the output: save it to a file, send it to Ask, or copy it.

## 5. What you see

- **Terminal view** â classic emulator: prompt, cursor, scrollback, full keyboard on desktop; a mobile-safe input row on narrow screens (exact mobile keyboard behavior was never specified â the layout must not assume a hardware keyboard). First launch shows the prompt plus the one-line `help` hint.
- **Command palette** â opened from a button or a keyboard shortcut inside the app: the full safe-command list as plain-language tasks; picking one fills and previews the command. This is the primary surface for the non-technical user.
- **Confirmation dialog** â destructive commands pause here with a plain-language description of what will happen and a Continue/Cancel choice.
- **Output actions** â per-command menu: "Save output to file" (writes a `.txt` to the current Files folder), "Send output to Ask" (pipes into the AI Assistant chat), "Copy".

## 6. What it needs

- The sandboxed Moor shell behind it â a safe command area with no access to the host device.
- The approved safe-command list (the manifest).
- The storage plug via File Manager, so "Save output to file" has somewhere to land.
- The AI Assistant, so "Send output to Ask" has somewhere to go.
- The APP_URLS registry, so it opens inside Moor (single window, Esc closes).
- Registration in the App Wrangler catalog once shipped (standing rule).

## 7. Choices & settings

- **Palette recents on/off** (default on) â recently used commands float to the top of the palette.
- **Confirm destructive commands** (default on) â turning it off shows a plain warning once.
- That's it: no host paths, no SSH hosts, no profiles in v1 â those belong to the unanswered GAP-T1 question and are deliberately out.

## 8. Rules it never breaks

- Never run a command that isn't on the approved list â refuse it in plain words.
- Always confirm destructive commands in plain language before running them (default behavior).
- Never weaken the sandbox to make a check pass â escape attempts are refused, always.
- Always keep sessions to one per window with per-session history, and say plainly that reopening starts fresh (funnel-filled â implied by the session design).
- Always degrade gracefully â nothing hard-fails on a missing piece (from the standing UX bar).
- Always open inside Moor by default via the APP_URLS registry (from the standing app-launch rule).

## 9. Done means

1. Only listed commands execute; a script attempting 20 non-listed commands sees all refused with the plain "I can't run that here" message â verified headless, zero page errors.
2. Every destructive-flagged command pauses for the plain-language confirm; confirming runs it, cancelling runs nothing â verified headless.
3. The palette lists every manifest entry by plain task name; picking one fills and previews the command â verified headless.
4. "Save output to file" produces a `.txt` on the active plug in the current Files folder â verified by listing the plug directory.
5. "Send output to Ask" opens the AI Assistant with the output as quoted context â verified headless.
6. A sandbox escape attempt (e.g. `; rm -rf`, command chaining outside the manifest) is refused â verified by a script; the sandbox is a real gate, never weakened for a pass.
7. Opens inside Moor via the APP_URLS registry path (singleton in-app window, Esc closes) â the standing app-launch rule.

## 10. Build order

(funnel-filled â authored ordering of existing scope; no new features)

1. **Safe-command list** â the manifest (name, plain description, command, destructive flag, category), reviewable on its own.
2. **Run/refuse gate** â only listed commands execute; everything else gets the plain refusal; chaining and shell-escape tricks are refused. Checkable: a script tries 20 non-listed commands and gets 20 refusals, zero errors.
3. **Terminal view** â prompt, cursor, scrollback, keyboard; first-launch `help` hint line. Checkable headless: it opens, renders, the hint is visible.
4. **Confirmation dialog** â plain-language pause for destructive commands; cancel runs nothing. Checkable headless.
5. **Command palette** â every manifest entry as a plain task name; pick â fill â one-sentence preview â run. Checkable headless.
6. **Output actions** â save to a `.txt` in Files; send to Ask as quoted context; copy. Checkable: file appears in Files; Ask opens with the context.
7. **Session memory** (per-window history), palette recents, App Wrangler registration, APP_URLS wiring â then the end-to-end verification script.

## 11. Technical map

- **Sandbox manifest** (the allowlist): `{name, plainDescription, command, destructive: bool, category}`. Everything not in the manifest doesn't run; the refusal is a plain-words message.
- **Session**: `{id, startedAt, history:[{command, output, ts}]}` â in-memory only in v1; reopening starts fresh, and the spec says so plainly.
- **Palette recents**: last-used commands float to the top; stored locally, nothing else.
- **Save output**: writes a `.txt` through the plug into the current Files folder. **Send to Ask**: pipes output into the AI Assistant chat as quoted context.
- **Repo/branch**: not specified â no repo was ever named for Terminal (gap; see blank 12).
- The sandbox is a real gate: chaining/escape attempts outside the manifest are refused, and the gate is never weakened for a verification pass.

## 12. How this plan was made

Prior edition: funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Honest statement (carried over):** the user has never described what the Terminal should do, what it should connect to, or who it's for. Everything below the ramble is worker-authored defaults built on the standing product rules (local-first, plain language, no advanced mode, graceful degradation) â every one of them is funnel-filled and every gap is listed.

**Ramble gaps (explicit, still open):**
- GAP-T1: What the terminal connects to â local device shell? the PC? a sandboxed Moor shell? The user never said. (A PowerShell server runs on the PC, but no user request ties Terminal to it â assuming that link would be invention.)
- GAP-T2: Who it's for â the user wants everything plain and non-technical; whether they want a raw shell or something friendlier is unknowable.
- GAP-T3: Command scope/safety â can it run anything, or a curated set? Never specified.
- GAP-T4: Relationship to the harness worker (do terminal commands feed jobs?) â never specified.
- GAP-T5: Mobile behavior â a terminal on the iPhone was never discussed.

**Quiz â all 7 questions auto-filled (zero human answers; every answer funnel-filled):**
- **Q1. What does the Terminal connect to?** Options: A: A sandboxed Moor shell (safe commands only, no host access) Â· B: The local device's real shell (full power, user's responsibility) Â· C: The Moor PC/server the user pairs (remote shell to their own machine). â **Chosen A.** Rationale: "Assume nothing; graceful degradation; no advanced mode" â a raw host shell contradicts the non-technical-user rule and the product's safety posture; the sandbox is the only default that can't hurt the user.
- **Q2. How technical is the surface?** Options: A: Raw terminal emulator (prompt, cursor, full keyboard) Â· B: Raw terminal + a plain-language command palette ("what do you want to do?" â fills the command) Â· C: Guided actions first, raw prompt behind a toggle. â **Chosen B.** Rationale: keeps the familiar terminal idiom for those who know it while the palette honors "plain, self-explanatory" for the user.
- **Q3. Session model?** Options: A: One session per window, history kept per session Â· B: Tabs â multiple sessions side by side Â· C: Single session, scrollback only. â **Chosen A.** Rationale: smallest coherent session model; tabs add window-management the canvas doesn't need yet.
- **Q4. What happens on a dangerous command?** Options: A: Runs it â the user asked, the terminal obeys Â· B: Asks for confirmation on destructive commands (delete, format, network) Â· C: Blocks a denylist of destructive commands entirely in the sandbox. â **Chosen B.** Rationale: middle path â obeys the user (no nanny-block) but catches fat fingers; consistent with Notes' undo-toast philosophy.
- **Q5. Output handling for long output?** Options: A: Plain scrollback, user scrolls Â· B: Scrollback + auto-collapse for output over N lines Â· C: Scrollback + "save output to a note/file" action. â **Chosen C.** Rationale: output saved as a plain file lands in Files through the plug â reuses existing machinery instead of inventing an export format.
- **Q6. First-launch state?** Options: A: Empty prompt, blinking cursor Â· B: Prompt + one-line hint ("type help for safe commands") Â· C: Prompt + quick-action chips for common safe tasks. â **Chosen B.** Rationale: one line, no wizard, no clutter â matches "works immediately, explains inline."
- **Q7. Does the Terminal talk to the harness?** Options: A: No â standalone utility, no harness coupling Â· B: "Send output to Ask" button pipes results into a chat Â· C: Commands can be saved as jobs (hands-off) from the Terminal. â **Chosen B.** Rationale: lightest useful coupling â Terminal stays standalone (no job-system entanglement the user never asked for â GAP-T4), but output can flow into the surface the user actually lives in.

**Coherence check (carried over):** Q1-A + Q4-B lock together (sandbox with a curated command set â the confirmation list is knowable). Q5-C + Q7-B both route through existing surfaces (Files, Ask) â no new subsystems invented. Q2-B's palette draws its safe-command list from the Q1-A sandbox manifest.

**Locked pieces (v1.0) â all funnel-filled:**
- **Piece 01** â Q1 (connection): sandboxed Moor shell, safe command manifest, no host access. **Gap flag:** GAP-T1 â the user never specified the target; this is an authored default, re-runnable.
- **Piece 02** â Q2 (surface): terminal emulator + plain-language command palette. **Gap flag:** GAP-T2 â audience unknowable; the palette is the hedge.
- **Piece 03** â Q3 (sessions): one session per window, per-session history.
- **Piece 04** â Q4 (danger): confirmation prompt on destructive commands from the manifest's flagged set. **Gap flag:** GAP-T3 â the flagged set is authored, not user-specified.
- **Piece 05** â Q5 (output): scrollback + "save output to file" (lands in Files via the plug).
- **Piece 06** â Q6 (first launch): prompt + `help` hint line.
- **Piece 07** â Q7 (harness): standalone; "Send output to Ask" only. **Gap flag:** GAP-T4 â no job coupling until the user asks.

**Source material gathered (ramble):**
- Apps registry (`moor-ui/moor.html`): `['Terminal','â','#9fe07f','dev',0]` â tile icon â, category **dev** (the only one of the five in dev), planned = not built yet (last column 0).
- MOOR-BLUEPRINT.md line 382: "Terminal" listed among the Apps-surface tiles. No further description anywhere in the blueprint, brief, or protocols.
- memory/2026-09-25.md#L33: functional-wiring audit â 15 of 17 Apps report 'not connected yet'; Terminal is one of the unbuilt tiles.
- memory/2026-09-25.md#L269: standing app-launch rule â apps open inside Moor by default via the APP_URLS registry (singleton in-app window, Esc closes). Applies to Terminal once built.
- MOOR-BRIEF.md: standing UX â clean, understandable, fast; graceful degradation; "one UI for the creator and the stranger" â no advanced mode.
- Funnel rule (standing autonomy): where the user gave no intent, the worker authors working defaults, marks them filled-in, and flags the gaps visibly instead of inventing user intent.
