# Context-Scoped Learning Doctrine

**Status:** Standing architecture problem · **Date:** 2026-10-07 · **Owner:** Sebastian Moore
**Funnel receipt:** 9e594f97159bb78f (valid)

---

## Core Doctrine

**Verdicts are the training data. Contexts are the scope. Freedom is a first-class record, not an absence of records.**

## The Missing Loop

```
generator → candidate → Funnel/build → reality → verification/verdict → context-scoped learning → future generator
```

The system already produces the evidence. What is missing is the update step: nothing reads verdicts back into generators.

## Audit (2026-10-07, honest)

**60% exists — the evidence layer:**
- 22 funnel verdict files record decisions, corrections, and rejections in rich narrative form.
- The funnel kernel produces cryptographic receipts with obligations and substitutions.
- Reference-search machinery provides the retrieval pattern.

**0% exists — the feedback mechanism:**
- Verdicts are narrative markdown, not structured queryable data. No generator reads them.
- No context-signature keying. No query interface for "what do past verdicts say about this context?"
- The funnel does not record deliberate openness as distinct from undecided.

## The Smallest Justified Mechanism (designed, not built)

1. **Verdict structured metadata.** Each verdict gains a context signature (hash of its constraint set) plus tagged outcomes:
   - explicitly constrained
   - derived
   - corrected
   - rejected
   - proposed
   - **intentionally free**

2. **Context-query interface.** Generators ask: "given this context signature, what do past verdicts constrain?" Only the matching context's corrections apply.

3. **Context matching rule.** A new request belongs to the context whose constraint set it satisfies. "Blue won three times in Dev Room contexts" does not touch "warm workshop" contexts.

4. **Freedom records.** "Intentionally free" is written with the same care as decisions. *Unspecified*, *forgotten*, and *deliberately unconstrained* are three different states — only the third is freedom. Do not interpret absence of a decision as freedom unless the governing semantics justify it.

5. **Evolution preference.** Prefer evolving these semantic resources and configurations over rewriting stable generator mechanics. Replace mechanics only when reality demonstrates the mechanics themselves are the limitation.

## Constraints

- Do not let repeated contextual choices silently become universal intent.
- Do not turn yesterday's useful interpretation into tomorrow's law.
- Absence of semantics remains legitimate. A mature generator knows more precisely which dimensions it is free to invent.

## End State

> **Maximum semantic fidelity where meaning exists, maximum generative freedom where it doesn't.**

## What This Is Not

This is a standing architecture problem, not a build order. No new subsystem is authorized. When implementation becomes justified, it should reuse existing machinery (verdicts, reference search, the funnel kernel) and add only the smallest missing pieces: structured metadata, context keying, and the query interface.

*Supersedes the earlier semantic-evolution-doctrine.md draft, which is retained for history.*
