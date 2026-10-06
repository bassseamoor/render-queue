# MOOR Funnel — armored canonical entry

The Funnel is executable infrastructure, not prompt advice. The public contract is this file; the runtime authority is `/funnel-kernel.js`.

## Prime law

A build/change cannot become executable because a model says it is clear, because prior answers look similar, because a caller supplies `resolved:true`, or because a builder is confident.

The mandatory chain is:

**Page 0 → References → Distill → Decisions → Page 0 Replay → Verdict → Receipt → Single-use Execution Claim → Harness → Verification**

The Funnel defines. The Harness builds. The Verifier proves. The Bin/Engine remembers.

## Runtime armor

1. **Page 0 is immutable.** The original request is frozen verbatim under one request ID.
2. **Writes use a narrow append surface.** Agents may append answers, evidence, failures, corrections, references, and notes. They may not rewrite Funnel law.
3. **Stage order is hard-coded.** Stages cannot be skipped or reordered.
4. **Material unresolved decisions block replay.**
5. **Page 0 is replayed in the second half.** Every source-backed obligation must be satisfied or explicitly deferred with approval. Silent substitutions block authorization.
6. **Verdict mints a receipt.** The receipt binds Page 0, spec, destination, done criteria, law version, and verdict event.
7. **A receipt can mint exactly one execution claim.** Minting the claim consumes receipt mint authority.
8. **A claim can be consumed exactly once by the Harness.** Reloads and replay attempts fail closed.
9. **The Harness has no raw build entrance.** Direct ramble compilation, stage jumping, and post-delivery modification reuse are disabled.
10. **A modification is a new build/change request.** It returns to Page 0 and requires a new Funnel run.

## Sealed write slot

Allowed agent writes:

- `answer`
- `evidence`
- `failure`
- `correction`
- `reference`
- `note`

These can change later decisions. They cannot change the constitution.

## Deterministic routing

- Exact reference/system command → direct reference/action.
- Navigation/open request with a strong target → direct navigation.
- Search/find/lookup → Bin/reference retrieval.
- Any build/change without a verified receipt → Funnel.
- Verified receipt bound to the exact Page 0 → one execution claim.
- Harness consumes that claim once.
- No API key/intelligence → local fallback inside the Funnel with provenance; never a bypass.

There is no `resolved:true` shortcut, fuzzy-lock shortcut, raw Harness compiler shortcut, or reusable execution receipt.

## Repository law

Runtime enforcement is not enough if an agent can edit the enforcement code. Repository changes therefore have a second boundary.

Every non-proof pull request must include:

`Funnel-Proof: .funnel/proofs/<proof>.json`

The trusted base-branch workflow `.github/workflows/funnel-guardian.yml` validates the proof using validator code from the base branch. The PR does not get to supply or execute its own judge.

A valid proof must reproduce the hard-coded Funnel stages, immutable Page 0 hash, zero unresolved material decisions, Page 0 replay obligations, verdict, and receipt bindings.

### Constitution changes

Changes to protected Funnel-law files require an additional line:

`Funnel-Owner-Authorization: ed25519:<signature>`

The signature is bound to the exact repository, PR number, PR head SHA, and exact protected file set.

The private signing key is never stored. `scripts/funnel-owner-key.cjs` derives an Ed25519 private key from the owner's high-entropy password using scrypt, uses it in memory, and discards it. Only `funnel-owner-public.pem` is committed.

Until that public key is bootstrapped, protected Funnel-law PRs fail closed.

## Owner bootstrap

Run locally:

`node scripts/funnel-owner-key.cjs bootstrap`

Type a high-entropy passphrase of at least 20 characters. Replace `funnel-owner-public.pem` with the emitted **public key only**.

For a later protected PR:

`node scripts/funnel-owner-key.cjs sign <PR-number>`

The script fetches that PR's exact head and protected file set, asks for the password locally, and prints the one authorization line to paste into the PR body.

The password is never committed or written by the utility.

## Required GitHub repository setting

The final repository boundary requires branch protection/rules on `main` so merges cannot bypass the `sealed-funnel` check and direct pushes are disabled. Without branch protection, repository administrators or credentials with direct write authority can still bypass any in-repository workflow.

## Runtime identities

- Contract: `/FUNNEL.md`
- Kernel: `/funnel-kernel.js`
- Law: `v45-armored`
- Human Funnel: `/quiz-funnel-v3.html`
- Router: `/moor-request.js`
- Harness: `/moor-harness-runtime-v1.html`
- Agent entry: `/moor-agent.json`
- Muse personality: `/BUSTER.md`
- PR guardian: `/.github/workflows/funnel-guardian.yml`
- Proof validator: `/scripts/funnel-proof-lib.cjs`

## Agent entry

When `MOOR.request` exists, use it. Do not type into the human request bar and do not choose Funnel/Builder/Harness independently.

```js
await MOOR.request({
  input: "the user's original request",
  source: "agent",
  context: MOOR.context()
})
```

A model is a contributor to the Funnel, never the authority that decides whether it may bypass it.

## Learning law

- One quiz, two sides: user and system resolve the same decisions.
- No wrong-answer dead end.
- Known answers and references are reused before new intelligence is spent.
- Provenance distinguishes explicit, inferred, learned, fallback, and verified evidence.
- Failed gates are durable evidence.
- Technical success and intent match are separate judgments.
- Repeated bad interpretations are Funnel defects to repair, not reasons to route around it.
- Confirmed intent + verified logic is the strongest reusable example.
