# Pre-push gate (sealed funnel v44)

Before ANY push to bassseamoor/render-queue:

1. `python3 pulse-devtools/run.py --live --pre-push`
   - `--live`: also verifies live bytes match repo bytes.
   - `--pre-push`: strict mode (stale-tree-guard fails if HEAD moved).
2. ALL GREEN or do not push. A FAIL is a stop sign, not a suggestion.
3. If stale-tree-guard FAILs: re-sync first — download the current
   pulse-dashboard.html + pulse-manifest.json from HEAD, apply your change
   surgically, then re-run. Never push from a stale tree (2026-10-04 clobber).
4. If version-pin-check FAILs: the live version moved. Update PIN.txt only
   with Sebastian's explicit order, or if the move was his other chat's
   legitimate forward push (record it in PIN.txt HISTORY).

This gate is the scripted form of the AGENTS.md STALE-TREE RULE.

## Reporting after push / PR

A green pre-push gate only proves the local/repository gate that actually ran. It does **not** authorize the worker to say merged, in Pulse, owner-visible, deployed, or done.

After remote work, report against `worker-response-sop.json`:

- PR open → say PR open.
- CI green → say verified/CI passed.
- Merge SHA present → say merged to the named branch.
- Current Pulse registry + manifest + rebuild preservation → say registered in Pulse.
- Named openable destination/Dev Feed receipt → say owner-visible.
- Independent runtime check → only then say live/deployed.

Never compress these into “pushed” or “done” when the later state has not been proven.
