# build-queue

The durable build queue. Pipeline:

```
YOU -> BUILD CONSOLE -> "build this" -> FUNNEL -> SEALED PACKET
-> DURABLE BUILD QUEUE -> ROUND SCHEDULER / DISPATCH -> BUILD RUNNER
-> BUILD CONSOLE -> LIVE / FAILED / BLOCKED / NEEDS DECISION
```

Law: automatic execution does not mean automatic authority.
UNSEALED = no execution capability. SEALED + EXECUTION-AUTHORIZED = dispatch.

## Dispatch gate (exact order)

packet appears -> VALID RECEIPT? (no -> REJECTED) -> EXECUTION AUTHORIZED?
(no -> HELD) -> CURRENT / NOT SUPERSEDED? (no -> SUPERSEDED, discarded) ->
SCOPE VALID? (no -> BLOCKED) -> RUNNER SUPPORTS PACKET? (no -> BLOCKED,
unresolved) -> yes -> EXECUTE.

## States

`QUEUED BUILDING VERIFYING LIVE` or `REJECTED HELD SUPERSEDED BLOCKED
FAILED NEEDS_OWNER`. `SEALED` / `DRAFT` / `FUNNELING` live in the console
(localStorage) before intake.

## Layout

- `~/workspace/build-queue/{pending,active,done,failed,blocked,held,rejected,superseded}/`
  is the durable store (survives VM restarts).
- `build-queue/status/<rid>.json` in this repo is the console's public
  read channel: `{rid, fp, state, updated_at, history[]}`.

## Commands

```bash
python3 ~/workspace/build-pipeline/run.py queue-add --packet p.json \
  [--executor noop|verify-ship|agent] [--map repo/path=/local/path ...] \
  [--message "commit msg"] [--target key] [--authorize] [--no-publish]
python3 ~/workspace/build-pipeline/run.py queue-poll [--dry-run] [--no-publish]
python3 ~/workspace/build-pipeline/run.py queue-status <rid>
python3 ~/workspace/build-pipeline/run.py queue-cancel <rid> [--reason why]
```

The scheduler is the `build-queue-dispatch` cron (every 15m): it runs
`queue-poll` and reports only on state changes.

## Receipt verification (honest note)

The kernel ledger is in-memory per node process, so a browser-minted receipt
cannot pass `K.verifyReceipt` VM-side. Gate 1 uses structural verification via
the kernel's own primitives: schema/version/law_version/revision match the
live kernel constants, the fingerprint is recomputed with the kernel's own
hash, and `page0_hash` + `destination` bind the exact order text and target.
Tamper-evidence + binding. The authorization *event* is the deliberate seal
(human + in-page funnel run); the receipt is its tamper-evident artifact.
