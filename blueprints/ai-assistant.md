# AI Assistant

# AI ASSISTANT â Blueprint

> **How to read this plan:** 12 numbered blanks, always in the same order. Blanks 1â10
> are plain words. Blank 11 is the technical map for the technically inclined.
> Blank 12 shows how this plan was made.

- **One line:** The AI surface of Moor â a chat that answers through the best free brain, a job queue that works while you're away, and one-tap handoff that sends work to your phone.
- **Status:** Project (no working version yet) Â· **Version:** 1.0 Â· **Date:** 2026-09-26
- **Size:** M

## 1. What it is

AI Assistant is the AI surface of Moor, in three parts. **Ask** is the hands-on chat: you type, the app routes your question through the best available brain â cloud for judgment, local for private or instant things â and every answer carries one small plain-text line naming the model that answered and any backup that took over. **Jobs** is the hands-off queue: inbox, running, done, failed â jobs you start and check later, each with a report, a quality score, and one-tap retry. **Offline handoff** bundles a job plus its context plus a small on-device model and sends it to your phone, which runs it offline and syncs the result back when you're online. Your conversations live as plain files you own, in a folder you can re-point or delete; the app itself never needs them to function. Memory â whether the app actually remembers things or just keeps a scrollable history â is always opt-in.

## 2. Who it's for

- **The hands-on asker (you):** someone who wants to ask Moor things in plain chat and always know which brain answered â no mystery, no hidden routing.
- **The hands-off planner (you, later):** someone who starts a job, goes offline or away, and comes back to a finished report â on the PC or on the phone.

## 3. What it does

- Chats with a side rail of conversations, each answer tagged with the model, source, and any failover (backup takeover) in one small plain-text line.
- Routes each question by a standing rule: judgment + online â cloud, private/offline/instant â local, quality scoring â always local, cloud unreachable â automatic local fallback.
- Keeps every conversation as one plain Markdown file in a `chats/` folder, through a swappable storage plug (a storage connection you can re-point); re-pointing moves the log with it, deleting is gone for good.
- Runs Jobs in four lanes â Inbox, Running, Done, Failed â with reports showing inputs, outputs, and a verifier score (a quality score from the built-in checker), and one-tap retry from Done or Failed.
- Offers "Run while I'm away" in any chat, turning the thread into a job draft, plus a full "New job" composer in the Jobs view.
- Sends a job to the phone in one tap â bundled with its context and a small local model â over the local network, with a manual QR/file-export fallback if no phone is paired.
- Keeps memory strictly opt-in: memory off means a scrollable history with no indexing; memory on means indexed, remembered, with a wipe control.
- Keeps API keys on the device only, sent nowhere except the provider you chose.

## 4. How you use it

1. You open AI Assistant and see the chat, with a hint pointing at AI & Agents settings if no model is connected yet; missing pieces explain themselves inline as they're needed.
2. You type a question; the routed answer streams in, carrying one small line: model name, source, and any failover.
3. You start a new conversation, rename, or delete from the side rail; deleting removes the plain file.
4. You flip "Remember this" on or off in the header; memory off keeps a scrollable history, memory on indexes it for recall, and the wipe control empties the index.
5. You tap "Run while I'm away" in a chat to make the thread a job draft, or open the Jobs view's composer to write a job from scratch.
6. You open a finished job's report, see its score, and retry in one tap if it failed.
7. You tap "Send to my phone" in Ask or Jobs; the package pushes over the local network (or exports as a QR/file you transfer manually); the phone runs it offline and the result appears in Jobs â Done when you're back online.

## 5. What you see

- **Ask (chat).** Single-column chat with a collapsible left rail listing conversations (newest first; collapses to a button on narrow screens). Each answer carries one small plain-text line: model name, provider/source, and any failover ("asked Groq; timed out; answered by Llama 3.1 8B locally"). Streaming answers; honest "this takes a while" states. Composer is plain text; "Run while I'm away" converts the thread into a job draft. Empty state: one hint line pointing at AI & Agents settings.
- **Jobs.** Four lanes: Inbox / Running / Done / Failed. Each job card: title, state, verifier score badge, timestamps. Opening a job shows the report (inputs, outputs, score, routing path); one-tap retry from Done or Failed. "New job" composer: title, goal text, brain preference (auto / cloud-judgment / local-private), run-now vs scheduled. Jobs persist as files through the storage plug, so re-pointing storage moves them with the chat log.
- **Offline handoff.** A "Send to my phone" button in Ask and in Jobs. Bundles the job + its context + a small local model into a handoff package; direct push over the local network, falling back to QR + file export the user transfers manually. The phone runs the job offline; the result syncs back and appears in Jobs â Done when the user is online again. If no phone is paired, the button explains that plainly and offers the export fallback instead of failing silently.
- **Chat log (Files-facing).** `chats/`, one Markdown file per conversation, filename `YYYY-MM-DD_title-slug.md`. Follows the storage plug on re-point. Delete = gone. Location and retention configurable in Settings â Files (keep the N newest, or a time window â the user's choice).

## 6. What it needs

- **AI & Agents settings** (existing): the key ring (API keys with live test), the download shelf (installed/suggested small local models, one-tap fetch), the judgment-provider select, and the verifier â the AI Assistant consumes these; it does not own them.
- **Settings â Files**: chat log location + retention, and the storage plug picker â re-pointing moves chats and jobs.
- **File Manager**: `chats/` visible, openable, deletable as plain files; jobs listed alongside.
- **A paired phone** (via the local network link) for the one-tap handoff; without one, the manual QR/file export fallback still works.
- Registration in the **App Wrangler** catalog once shipped (the standing rule for every app).

## 7. Choices & settings

- **Memory toggle** â in the view header: "Remember this" on/off, with a link to the full memory controls (coverage, wipe).
- **Chat log location + retention** â in Settings â Files: where `chats/` lives and how much is kept.
- **Judgment provider select** â in AI & Agents: which brain handles judgment calls; cloud for online judgment, local for private/offline/instant.
- **Verifier strictness** â in AI & Agents: how demanding the built-in quality checker is.
- **Paid opt-in** â in AI & Agents: off by default; per-job only, never a subscription the app assumes.
- **Model attribution detail depth** â the small line vs. an expanded routing view (same information, two sizes).
- **Handoff target device picker** â which phone receives the offline package.
- **Score visibility** â fixed per the locked plan (badge on answers + full detail in job reports); no toggle.

## 8. Rules it never breaks

- **Always** name the model that answered and any failover in small plain text under each answer.
- **Never** let the app need the chat log to function â it is storage (plain files you own), not app state.
- **Never** send an API key anywhere except the provider the user chose.
- **Always** degrade gracefully: a missing piece explains itself inline ("no model connected â tap here") â never a dead button, never a gate. *(funnel-filled)*
- **Always** keep memory opt-in: memory off means no indexing happens, only a scrollable history.
- **Never** invent a transport for the offline handoff that routes private job bundles through a third party by default. *(funnel-filled)*

## 9. Done means

1. A chat round-trip works through the ask pipeline with a connected provider; the answer's attribution line names the actual model and provider used, and a forced failover (unreachable cloud) visibly notes the failover and still answers locally â verified headless with a simulated router.
2. Every conversation appears as one Markdown file under `chats/` on the active storage plug; re-pointing the plug moves subsequent reads and writes, and filenames follow `YYYY-MM-DD_title-slug.md` â verified by a script listing the plug directory after re-point.
3. Jobs cover all four states; a failed job retries in one tap; the report shows the verifier score â verified headless, zero page errors.
4. Memory off: no indexing occurs (log is scrollable history only); memory on: the opt-in indexing path runs and the wipe control empties the index â verified by inspecting the index store before and after.
5. Send-to-phone with no paired device shows the export fallback, never a dead button â verified headless.
6. Keys are never sent anywhere except the selected provider (inspect network calls during a Test and a chat); model test buttons behave per the existing AI & Agents section.
7. The app opens inside Moor through the standard app-launch path (single in-app window, Esc closes) â the standing rule.

## 10. Build order

*(funnel-filled: authored from the blueprint's surfaces, ordered by dependency; no new features)*

1. **Ask chat surface.** Chat view + collapsible conversation rail, wired to the ask pipeline with the plain-text attribution line. Checkable: a round-trip answer names its model and source.
2. **Model routing + failover.** The standing routing rule with automatic local fallback. Checkable: with the cloud unreachable, an answer still arrives locally and the failover is noted.
3. **`chats/` Markdown log.** One file per conversation through the storage plug; re-pointing moves it; delete = gone. Checkable: files appear, re-point moves them, naming matches the convention.
4. **Jobs view.** Four lanes, job reports with verifier scores, one-tap retry, both entry points ("Run while I'm away" + composer). Checkable: a failed job retries in one tap; every lane holds a job.
5. **Memory opt-in.** Header toggle, opt-in indexing, wipe control. Checkable: memory-off leaves no index; wipe empties it.
6. **Offline handoff.** Package bundling (job + context + small local model), direct push over the local network, QR/file-export fallback. Checkable: no-paired-device shows the fallback; a pushed job returns to Done.
7. **Settings surfaces.** Log location + retention, judgment provider, verifier strictness, paid opt-in, handoff device picker. Checkable: each setting changes the corresponding behavior.
8. **App Wrangler registration.** The app registers in the catalog. Checkable: it appears in the catalog.

## 11. Technical map

For the technically inclined. Repo/branch for the app are unassigned (no code exists yet). The app is a surface over the harness: it never talks to a model or a disk directly.

- `ask()` = brain client + router + failover, routed by the standing rule (judgment+onlineâcloud, private/offline/instantâlocal, verifierâalways local, cloud-downâlocal fallback). Agent worker loops are not built.
- Conversation: `{id, title, createdAt, updatedAt, memoryOptIn, messages:[{role, text, model, provider, failoverFrom, verifierScore, ts}]}` serialized to one Markdown file in `chats/` (the Markdown is the source of truth; rendered from messages).
- Rail index: derived from the `chats/` listing â no separate database; the harness stays stateless.
- Job: `{id, title, goal, brainPref, state: inbox|running|done|failed, createdAt, startedAt, finishedAt, report:{input, output, score, route, failover}, package:{...}}` as files beside the log (same plug).
- Handoff package: `{job, context, modelRef, createdAt}` â modelRef points at the download-shelf entry.
- Settings plumbing: AI & Agents section is real today (Ollama base URL with Check; 14 provider key slots with Save + live Test; model pickers; judgment provider select â all in the browser's local storage drawer, keys never leaving the provider). 23-item wiring audit: Apps view mostly "not connected yet"; agent worker loops not built.
- Launch: APP_URLS registry path, singleton in-app window, Esc closes (tile: `['AI Assistant','â¦','#7fb2e5','tools',0]` â planned, not built).

## 12. How this plan was made

**Prior edition:** funnel-derived v1.0, compiled 2026-09-26. This is the first standard-template edition (v1.0).

**Source material gathered** (ramble bullets, kept for provenance):

- R1 â MOOR-BLUEPRINT.md ("Where the harness lands"): **Ask (hands-on) â the AI Assistant app.** Chat; small plain text names the model that answered and any failover. Every conversation is kept in the chat log: plain files through the storage plug (`chats/`, one per conversation). It's yours: re-point storage and the log follows; delete it and it's gone. This is storage, not app state â the harness never *needs* the log to function. Memory (opt-in) decides whether the log gets indexed and remembered; with memory off, it's just a scrollable history, not knowledge.
- R2 â MOOR-BLUEPRINT.md: **Jobs (hands-off) â the AI Assistant app's second surface:** inbox, running, done, failed. Open a report, see its score, retry in one tap.
- R3 â MOOR-BLUEPRINT.md: **Offline handoff â AI Assistant:** "I'm going offline â send this to my phone." One tap bundles the job + its context + a small local model into a handoff package and pushes it to the other device (**transport TBD â see open questions**). The phone runs the job offline on the small model, and the result syncs back when you're online again. This only works because the download shelf exists.
- R4 â MOOR-BLUEPRINT.md ("What each surface requires"): AI Assistant app requires: `ask()` (brain client + router + failover); chat log as plain files through the storage plug (`chats/`, one per conversation); jobs (inbox/running/done/failed + reports with scores + one-tap retry); offline handoff packaging (job + context + small model).
- R5 â MOOR-BLUEPRINT.md: Settings â Files holds **chat log location and retention**.
- R6 â MOOR-BRIEF.md: UX non-negotiable: clean, understandable, fast â and honest when a job just takes time. Hands-on is the product; hands-off is the capability. Model routing rule: judgment+online â cloud, private/offline/instant â local, verifier scoring â always local, cloud unreachable â auto fallback to local. Registry, router, verifier; stateless by default; memory opt-in; storage is a plug not a place; graceful degradation.
- R7 â memory/2026-09-25.md#L112: User requirement: Moor needs a stored chat log â Ask conversations written through the selected storage plug as user-owned plain files; harness remains stateless; opt-in memory determines indexed/remembered vs scrollable history. Layout: `chats/`, one file per conversation.
- R8 â MEMORY.md (Moor UI build): AI & Agents settings real: Ollama base URL with Check; 14 provider key slots with Save + live Test, model pickers, judgment provider select â all localStorage, keys never leave the provider. **Agent worker loops NOT built yet.** 23-item wiring audit: Apps view mostly 'not connected yet'.
- R9 â MOOR-BRIEF.md: "Offline handoff transport" is an explicit open question.
- R10 â moor-ui/moor.html (feed bundle, Apps registry): `['AI Assistant','â¦','#7fb2e5','tools',0]` â tile icon â¦, category **tools**, **planned = not built** (last column 0). Opens-inside-Moor rule applies once built (APP_URLS registry, singleton in-app window, Esc closes).
- R11 â MOOR-BLUEPRINT.md: "Phone as a screen" â read-only dashboard on the old phone: queue, reports, latest brief, memory log. Shows everything, touches nothing (v1); actions later. AI surfaces must work with this: reports visible there.

**Ramble gaps** (explicit; the plan does not invent past them):

- GAP-A1: Offline handoff transport â Blueprint says TBD (open question in the brief). Unknown: device pairing protocol, package size limits, delivery channel.
- GAP-A2: Jobs authoring â how a hands-off job is *created* (from chat? from a "run later" button? from moorbymoore?). The user specified the job states and reports, not the entry points.
- GAP-A3: Agent worker loops (per-roster simulated workers, nine-intelligence assignment) exist in the funnel/prompt experiments, but no documented user request ties them to the AI Assistant app's surface. Marked unbuilt.
- GAP-A4: Verifier score presentation granularity (1â10 scale per brief; whether scores show per-message, per-job, or only in reports).
- GAP-A5: Whether Ask should handle voice/multimodal input â never requested.

**Quiz** (8 questions; every option was valid and realizable; provenance now tagged you / funnel-filled):

- **Q1. The chat view's primary layout?** A) Single-column chat (like a messaging app) Â· B) Chat + collapsible side rail listing conversations Â· C) Chat with a right-side "thinking" panel (model, routing path, score) â **B, funnel-filled.** Rationale: matches the canvas OS "one window, many things" idiom; the rail hides on phones and keeps chat primary.
- **Q2. How is model attribution + failover shown?** A) One small line under each answer ("Llama 3.1 8B via Ollama") Â· B) Only when failover happened ("took over from Groq after a timeout") Â· C) Hover/tap the model badge for routing details â **A, you** (MOOR-BLUEPRINT.md R1: "small plain text names the model that answered and any failover"). Always-on beats conditional since failover is part of the value story.
- **Q3. Chat log format inside `chats/`?** A) One Markdown file per conversation (filename = date + title) Â· B) One JSON file per conversation (structured, machine-readable) Â· C) Both â Markdown for the user, JSON sidecar for the harness â **A, you** (memory/2026-09-25.md#L112 + R7: "plain files"; brief: "the user owns it"). Markdown is human-readable in Files; filename date+title sorts naturally. JSON sidecar rejected â the harness never needs the log (R1), so the structured form serves nobody.
- **Q4. What happens when the user re-points the storage plug mid-session?** A) Log follows automatically; the app keeps reading from the new plug Â· B) App asks once: "move my chat log to the new place?" Â· C) Log stays where it was; new chats go to the new place (split history) â **A, you** (MOOR-BLUEPRINT.md R1: "re-point storage and the log follows"). The ask-once option would add a stall where the brief demands none.
- **Q5. Jobs view entry points (how jobs get created)?** A) "Run while I'm away" button inside any chat Â· B) A dedicated "New job" composer in the Jobs view Â· C) Both (chat shortcut + full composer) â **C, funnel-filled.** Rationale: every option valid; offering both entry points covers hands-on users who live in chat and planner users who want the composer â no dead end either way.
- **Q6. Verifier score visibility?** A) Only in job reports and a per-answer badge Â· B) Per-answer badge + job reports + a score filter in history Â· C) Hidden by default; "show scores" toggle in the view â **A, you** (MOOR-BLUEPRINT.md R2: "Open a report, see its score, retry in one tap"). Extending the badge to chat answers stays within "small plain text" attribution without adding a new toggle to maintain.
- **Q7. Offline handoff transport (transport TBD â the blueprint must pick a working default)?** A) Package export file (QR + file drop the user transfers manually) Â· B) Direct push to the phone over the local network / Tailscale Â· C) Sync through the user's existing phoneâPC git sync kit (GitHub as mailbox) â **B with A as manual fallback, funnel-filled.** Rationale: the Tailscale join is already real on this VM and the phoneâPC sync kit exists; direct push honors "one tap," QR/file export survives when the network path is absent (graceful degradation, R6). Git-sync-mailbox rejected as primary: it routes private job bundles through a third party by default.
- **Q8. First-launch experience for AI Assistant?** A) Empty chat with a hint to connect a model in AI & Agents settings Â· B) Guided first question ("what should we do first?") + inline key/model setup Â· C) Chat works immediately with whatever's connected; missing pieces explain inline as they're needed â **C, funnel-filled.** Rationale: "one UI for the creator and the stranger" â a guided wizard adds a gate; inline explanation ("no model connected â tap here") keeps the flow unblocked.

**Locked pieces** (numbered version records; v1.0):

- Piece 01 â Q1 (layout): chat + collapsible side rail. Provenance: funnel-filled.
- Piece 02 â Q2 (attribution): always-on small plain-text model + failover line under each answer. Provenance: you (MOOR-BLUEPRINT.md, "Where the harness lands").
- Piece 03 â Q3 (log format): one Markdown file per conversation, filename = `YYYY-MM-DD` + title slug. Provenance: you (memory/2026-09-25.md#L112; MOOR-BLUEPRINT.md).
- Piece 04 â Q4 (storage re-point): log follows automatically, no prompt. Provenance: you (MOOR-BLUEPRINT.md: "re-point storage and the log follows").
- Piece 05 â Q5 (job entry): both â "Run while I'm away" in chat + "New job" composer in Jobs. Provenance: funnel-filled.
- Piece 06 â Q6 (scores): per-answer verifier badge + full score in job reports. Provenance: you (MOOR-BLUEPRINT.md: "Open a report, see its score").
- Piece 07 â Q7 (handoff transport): direct push over LAN/Tailscale, manual QR/file export fallback. Provenance: funnel-filled (Tailscale + sync kit facts from MEMORY.md). **Conflict flag:** Blueprint says transport TBD; this lock *authors* a default under standing autonomy (flagged, not silent). Re-runnable when the user picks a transport.
- Piece 08 â Q8 (first launch): works immediately with connected models; inline explanations for missing pieces. Provenance: funnel-filled.

**Invented along the way:** the Q7 transport default (flagged conflict above), the coherence check tying Q4+Q3 and Q6+Q2 together, and the Q2 "hover/tap badge for routing details" extension (same line, no new UI language). Ordering in Blank 10 is funnel-filled but introduces no new features.
