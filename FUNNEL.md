# MOOR Funnel — armored canonical entry

The Funnel is executable infrastructure, not prompt advice. This file is the public contract; `/funnel-kernel.js` is the runtime authority.

## Prime law

For Project Pulse, a build/change request cannot become executable because a model believes it is clear, because old answers look similar, because a caller passes `resolved:true`, or because a builder is confident.

The mandatory chain is:

**Page 0 → References → Distill → Decisions → Page 0 Replay → Verdict → Receipt → Single-use Execution Claim → Harness → Verification**

The Funnel defines. The Harness builds. The Verifier proves. The Bin/Engine remembers.

## Redundant deterministic distillation

Page 0 is fed, unchanged, into three isolated, token-free distillers:

1. **Lexical lens** — explicit requirement and action cues.
2. **Structural lens** — clause structure, negatives, hard constraints, and action/constraint pairings.
3. **Preservation lens** — named mechanisms and terms that are dangerous to silently drop.

They do not call an LLM. They do not share mutable state. Each produces source-backed candidates from the same immutable Page 0.

The Funnel records both consensus and disagreement, but replay uses the **union** of all source-backed obligations. A requirement caught by only one lens is not discarded merely because the other two missed it. Agreement raises confidence; disagreement raises scrutiny.

The complete redundant analysis is fingerprinted into the Page 0 event and into the execution receipt. Recomputing the three lenses must reproduce that fingerprint before the receipt or consumed Harness authorization verifies.

## Runtime armor

1. **Page 0 is immutable.** The original request is frozen verbatim under one request ID.
2. **The write surface is narrow and append-only.** Models may append answers, evidence, failures, corrections, references, and notes. They may not rewrite Funnel law.
3. **Stage order is hard-coded.** Stages cannot be skipped or reordered.
4. **Material unresolved decisions block replay.**
5. **Page 0 is replayed in the second half.** Every source-backed obligation must be satisfied or explicitly deferred with approval. Silent substitutions block authorization.
6. **The verdict carries the Page 0 obligation ledger.** Builders cannot receive a spec that silently drops replayed obligations.
7. **The verdict mints a receipt.** The receipt binds Page 0, spec, destination, done criteria, law version, and verdict event.
8. **A receipt may mint exactly one execution claim.** Minting the claim makes the receipt unusable for another claim.
9. **The Harness consumes that claim exactly once.** A copied/replayed handoff fails.
10. **Harness work remains gated by the consumed claim.** Any later Funnel write invalidates that authorization.
11. **Raw Harness intake is not a build bypass.** It routes back through `MOOR.request` and the Funnel.
12. **Harness stage labels are not navigation.** Stage jumping is disabled.
13. **A modification is a new build/change request.** It returns through the Funnel rather than reusing prior authority.

There is no `resolved:true` shortcut, fuzzy-lock shortcut, raw Harness compiler shortcut, reusable receipt, reusable claim, or stage-jump shortcut.

## Sealed write slot

Allowed agent writes:

- `answer`
- `evidence`
- `failure`
- `correction`
- `reference`
- `note`

These can affect later decisions. They cannot change the constitution.

## Page 0 law

Page 0 is immutable for a request ID. Distillation is allowed; replacement is not.

Explicit named mechanisms and requirement-bearing statements become atomic obligations. Replay must source each obligation back to Page 0 and mark it either:

- `satisfied`, or
- `explicitly-deferred` with owner approval.

The final verdict spec must carry the same obligation IDs resolved at replay. Omission, substitution, or mutation blocks the verdict.

## Deterministic routing

- Exact reference/system command → direct reference/action.
- Navigation/open request with a strong known target → direct navigation.
- Search/find/lookup → Bin/reference retrieval.
- Any build/change without a verified receipt → Funnel.
- Verified receipt bound to the exact Page 0 → one execution claim.
- Harness consumes the claim once.
- Ambiguous novel request → Funnel.
- No LLM/API key → local fallback inside the Funnel with provenance; never a bypass.

## Repository armor

Runtime enforcement is insufficient if a model with repository write access can edit the enforcement code. Repository mutations therefore have a second boundary.

Every non-proof pull request must include this line in its PR body:

`Funnel-Proof: .funnel/proofs/<proof>.json`

The trusted workflow `/.github/workflows/funnel-guardian.yml` runs with `pull_request_target` and checks out the PR's **base SHA**. The PR supplies data to the judge, but it does not supply or execute its own judge.

The base-branch validator requires the proof to reproduce:

- immutable Page 0 and its hash,
- references,
- distillation,
- zero unresolved material decisions,
- source-backed Page 0 replay,
- approved deferrals/substitutions only,
- obligation-carrying verdict,
- destination and done criteria,
- receipt bindings and fingerprint.

### Constitution changes

Files that define or enforce Funnel law are listed in `/scripts/funnel-protected-paths.json` and `/.github/CODEOWNERS`.

After the owner public key is configured, any PR touching one of those files additionally requires:

`Funnel-Owner-Authorization: ed25519:<signature>`

The signature is bound to the exact repository, PR number, PR head SHA, and exact protected-file set. Changing the PR invalidates the signature.

The private signing key is not stored. `scripts/funnel-owner-key.cjs` derives an Ed25519 private key in memory from the owner's high-entropy passphrase with scrypt, signs the exact PR authorization message, and discards the in-memory key when the process exits. Only the public key is committed.

A weak password is not appropriate here: the public key permits offline guessing attempts. Use a high-entropy passphrase.

### One-time owner-key bootstrap

The repository initially contains `funnel-owner-public.pem` as `UNCONFIGURED`. To avoid a circular lock, the Guardian has exactly one bootstrap exception:

- the only protected file changed must be `funnel-owner-public.pem`;
- the PR must contain `Funnel-Owner-Bootstrap: I am setting the owner key`;
- the PR and head commit must be attributable to `bassseamoor`;
- the head commit must be GitHub-verified/signed;
- the new file must parse as an Ed25519 **public** key;
- private-key material is rejected.

Once the base branch contains a real public key, this bootstrap path disappears automatically and future protected changes require the password-derived signature.

## Owner key utility

Run locally:

`node scripts/funnel-owner-key.cjs bootstrap`

Type the passphrase twice. The utility prints the public PEM. It does not intentionally persist the passphrase or private key.

For a later protected PR:

`node scripts/funnel-owner-key.cjs sign <PR-number>`

The utility fetches that PR's exact head and protected files, asks for the passphrase locally, verifies it derives the configured public key, and prints the exact `Funnel-Owner-Authorization` line.

## Required GitHub repository setting

The final repository trust boundary requires `main` branch protection/rules so that:

- changes must arrive through pull requests;
- the `sealed-funnel` check is required;
- direct pushes are disabled/restricted;
- bypass permissions are minimized;
- CODEOWNERS review can be required for constitution files.

Without branch protection, credentials with direct write authority can still replace in-repository guards. Code cannot make that repository-administration fact disappear.

## Runtime identities

- Contract: `/FUNNEL.md`
- Kernel: `/funnel-kernel.js`
- Law: `v46-redundant`
- Human Funnel: `/quiz-funnel-v3.html`
- Router: `/moor-request.js`
- Harness: `/moor-harness-runtime-v1.html`
- Agent entry: `/moor-agent.json`
- Muse operating personality: `/BUSTER.md`
- PR guardian: `/.github/workflows/funnel-guardian.yml`
- Proof validator: `/scripts/funnel-proof-lib.cjs`
- Owner signer: `/scripts/funnel-owner-key.cjs`

## Agent rule

If `window.MOOR.request` exists, use it. Do not type into the human global request bar and do not independently choose Funnel, Harness, Compiler, or a builder.

```js
await MOOR.request({
  input: "the user's original request",
  source: "agent",
  context: MOOR.context()
})
```

A model is a contributor to the Funnel, never the authority over whether it may bypass it.

## Learning law

- One quiz, two sides: user and system resolve the same decisions.
- No wrong-answer dead end.
- Vague/skip may reuse a proven known answer with provenance.
- Every answer locks as a versioned page.
- Known answers and references are reused before new intelligence is spent.
- Provenance distinguishes explicit, inferred, learned, fallback, and verified evidence.
- Failed gates are durable training evidence.
- Technical success and intent match are separate judgments.
- Repeated bad interpretations are Funnel defects to repair, not reasons to route around it.
- Confirmed intent + verified logic is the strongest reusable example.
