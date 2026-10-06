# MOOR Funnel — sealed canonical entry

This file describes the public contract. The executable authority is `/funnel-kernel.js`.

## Prime law

For Project Pulse, a build/change request cannot become executable because a model believes it is clear, because old answers look similar, because a caller passes `resolved:true`, or because a builder is confident.

A build/change becomes executable only when the sealed Funnel Kernel emits a valid `moor.funnel-receipt`.

Models may submit language and evidence through the Funnel doorway. They may not mint receipts, reorder stages, rewrite Funnel law, or directly authorize Harness execution.

## Mandatory path

1. **Page 0** — freeze the user's original request verbatim.
2. **References** — reuse known locked answers, Bin references, verified implementations, corrections, and failures.
3. **Distill** — convert the request into a precise candidate specification without deleting Page 0.
4. **Decisions** — lock material choices. Unresolved material decisions block execution.
5. **Replay** — compare the candidate back against immutable Page 0. Every explicit obligation must be satisfied or explicitly deferred with owner approval. Silent substitution is forbidden.
6. **Verdict** — emit only:
   - spec
   - destination
   - done criteria
7. **Receipt** — the kernel binds the verdict to Page 0 and the append-only ledger.
8. **Harness** — executes only a verdict carrying a receipt that the kernel verifies.
9. **Verifier** — proves the requested path. Failures are written back as evidence.

The Funnel defines. The Harness builds. The Verifier proves. The Bin/Engine remembers.

## Write slot

The Funnel is a sealed box with a narrow write surface. Allowed writes are append-only inputs such as:

- answer
- evidence
- failure
- correction
- reference
- note

These writes may influence later decisions. They do not alter Funnel law.

## Page 0 law

Page 0 is immutable for a request ID. Distillation is allowed; replacement is not.

Explicit named mechanisms and requirement-bearing statements become atomic obligations. Replay must source each obligation back to Page 0 and mark it either:

- `satisfied`, or
- `explicitly-deferred` with owner approval.

If replay omits an obligation or introduces an unapproved substitution, no receipt is issued.

## Runtime identities

- Public contract: `/FUNNEL.md`
- Sealed state machine: `/funnel-kernel.js`
- Human/runtime UI: `/quiz-funnel-v3.html`
- Pulse Funnel project ID: `funnel`
- Architecture contract: `/pulse-learning-spine-blueprints.json`
- Universal request router: `/moor-request.js`
- Browser entry: `await MOOR.request(...)`
- Reference system: `PulseReferences`
- Execution/Harness component: `app-compiler-harness`
- Muse operating personality: `/BUSTER.md`

The UI filename may retain its historical name. The current executable law version is `v44-sealed`, owned by the kernel.

## Authority topology and maintenance truth

The current production authority remains `v44-sealed` in `/funnel-kernel.js`. The newer `ultra-v1-candidate` architecture lives in `/funnel-law-core.js` and its supporting receipt/capability/budget/case/society modules. Ultra is a candidate, not a silently promoted replacement.

The migration contract is `/blueprint/funnel-ultra-v44-migration.blueprint.json`. The machine-readable maintenance register is `/funnel-maintenance-status.json`.

Do not collapse these states:
- documented — a contract says the subsystem should exist;
- implemented — executable code exists;
- wired — the current request/product path actually uses it;
- verified — an executable check proves its contract;
- receipt-backed — the relevant authority transition has verifiable receipt evidence;
- visualized — Pulse/3D can display it.

Visualization never upgrades another state. A 3D node can represent a missing or unhealthy machine.

## Software manufacturing and cumulative machinery

MOOR treats a verified function as capital equipment. The manufacturing blueprint is `/blueprint/software-manufacturing-system.blueprint.json`.

- OBJECTIVE defines the need before solution shape.
- HUB defines versioned KINDs/part identities, invariants and interface contracts.
- Funnel/Ultra plan and authorize the route.
- Assembly Core expresses deterministic work instructions.
- Harness/builders execute authorized operations.
- Verifier/CI inspects outputs and process characteristics.
- Receipts provide traveler/traceability evidence.
- Refinery + Capability Memory preserve reusable verified machinery and known compositions.
- Pulse Beam is the HMI/digital twin of this production line, not its authority source.

Verified machinery is cumulative. Before creating a new implementation, the reference stage must look for a compatible verified capability, assembly, adapter, or composition. A changed fit/form/function becomes a new version. Deprecation removes a machine from preferred routing but does not erase it. Quarantine is explicit. Silent replacement, orphaning, or repeated recreation of an already-verified capability is a process defect.

## Agent rule

If `window.MOOR.request` exists, use it. Do not type into the human request bar. Do not independently choose Bin, Funnel, Harness, Compiler, or a builder.

```js
await MOOR.request({
  input: "the user's original request",
  source: "agent",
  context: MOOR.context()
})
```

A model is a contributor to the Funnel, not an authority over it.

## Deterministic routing

- Exact reference/system command → direct reference/action.
- Navigation/open request with a strong known target → direct navigation.
- Search/find/lookup request → Bin/reference retrieval.
- Any build/change request without a verified Funnel receipt → Funnel.
- Build/change request with a kernel-verified Funnel receipt → Harness.
- Ambiguous novel request → Funnel.
- No intelligence/API key → local fallback inside the Funnel with provenance; never bypass the Funnel.

There is no fuzzy-match or `resolved:true` execution shortcut.

## Learning law

- One quiz, two sides: user and system answer the same decisions.
- No wrong-answer dead end.
- Vague/skip may reuse a proven known answer with provenance.
- Every answer locks as a versioned page.
- Provenance distinguishes explicit, inferred, learned, fallback, and verified evidence.
- Known answers are reused; compute is spent on novelty.
- Failed gates are durable training evidence.
- Technical success and intent match are separate judgments.
- Repeated bad interpretations are Funnel defects to repair, not permission to bypass it.
- Confirmed intent + verified logic is the strongest reusable example.

## Owner/constitution boundary

Normal agents may use the Funnel API but must not possess authority to modify Funnel law.

The target hardened deployment is:

- Funnel kernel isolated behind a separate trust boundary.
- Build agents receive only its narrow request/write/status/receipt interface.
- Funnel receipts are cryptographically signed by that authority.
- The build repository stores only the public verification material.
- Direct pushes are disabled; protected branches require the Funnel gate check.
- Funnel-law maintenance requires a separate owner unlock and is never available to ordinary agents.

A secret must never be embedded in client JavaScript or committed to the repository. A client-side password field alone is not a security boundary.

## Output envelope

Every `MOOR.request` call returns:

```json
{
  "request_id": "request:...",
  "route": "reference | navigation | funnel | harness | fallback",
  "status": "resolved | queued | locked | ready-for-execution | fallback",
  "provenance": "explicit | learned | inferred | verified | fallback",
  "context": {},
  "result": {}
}
```

Harness packets must contain a kernel-verified `funnel_receipt`. Without it, execution is denied.
