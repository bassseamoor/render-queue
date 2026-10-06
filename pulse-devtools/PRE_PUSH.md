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
