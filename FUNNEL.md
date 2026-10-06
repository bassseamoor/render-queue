# MOOR Funnel — canonical agent entry

This file is the single repository doorway for the MOOR decision resolver.

## If an instruction says "use the Funnel"

Do not search around for a different Funnel implementation and do not invent a parallel questionnaire.

1. Treat the user's original request as immutable Page 0 input.
2. Resolve the request through the canonical v43 rules below.
3. Reuse known locked answers and Bin references before spending new intelligence.
4. Resolve only missing, changed, conflicting, or downstream-affected decisions.
5. Preserve every explicit named mechanism as its own requirement.
6. Produce a verdict packet containing only:
   - spec
   - destination
   - done criteria
7. Builders execute the verdict packet; they do not receive the raw ramble.
8. Verification must prove the actual requested path. Failed gates remain evidence.
9. If no LLM/API key is available, use known references and local fallback rules, mark fallback provenance, and continue. Never return nothing merely because intelligence is unavailable.

## Runtime identities

- Human/runtime UI: `/quiz-funnel-v3.html`
- Pulse Funnel project ID: `funnel`
- Architecture contract: `/pulse-learning-spine-blueprints.json`
- Universal request router: `/moor-request.js`
- Browser API: `await MOOR.request(...)`
- Reference system: `PulseReferences`
- Execution/Harness component: `app-compiler-harness`

The filename `quiz-funnel-v3.html` is a runtime shell name. The canonical decision contract is Funnel v43.

## Model rule

A model with browser/page access SHOULD NOT type into the human global request bar when `window.MOOR.request` is available.

Use:

```js
await MOOR.request({
  input: "the user's request",
  source: "agent",
  context: MOOR.context()
})
```

MOOR chooses Bin/reference lookup, navigation, Funnel resolution, or resolved execution. The caller should not independently select a subsystem unless explicitly overriding the router for diagnostics.

## Deterministic routing

1. Exact reference/system command → direct reference/action.
2. Navigation/open request with a strong known target → direct navigation.
3. Search/find/lookup request → Bin/reference retrieval.
4. Build/change request with already locked decisions → Harness/execution route.
5. Build/change request with unresolved intent → Funnel.
6. Ambiguous novel request → Funnel.
7. No intelligence available → local fallback with provenance; no dead end.

## Canonical Funnel laws

- One quiz, two sides: user and system answer the same decisions.
- No wrong-answer dead end.
- Vague/skip may use proven known answers.
- Every answer locks as a versioned page.
- Ramble may be distilled, but Page 0 remains frozen.
- Provenance distinguishes user, inferred, learned, and fallback.
- Explicit requirements become atomic obligations; none may be silently substituted.
- Funnel decides WHAT. Harness executes. Verifier proves. Bin/Engine remember.
- Known answers are reused; compute is spent on novelty.
- Failures are durable training evidence.
- A technically working result and an intent-matching result are separate judgments.
- Verified working logic may be learned even when intent remains unconfirmed.
- Confirmed intent + verified logic is the strongest reusable example.

## Completion contract

A poor, empty, or janky request is not permission to stop. The system should still attempt the best-known candidate, with honest provenance and real gates.

## Human global input

The global "Request anything" bar is a human interface to `MOOR.request`. It is not the Funnel itself. Simple navigation/retrieval must not invoke Funnel unnecessarily.

## Output contract

Every call returns a structured envelope:

```json
{
  "request_id": "request:...",
  "route": "reference | navigation | funnel | harness | fallback",
  "status": "resolved | queued | ready-for-execution | fallback",
  "provenance": "explicit | learned | inferred | fallback",
  "context": {},
  "result": {}
}
```
