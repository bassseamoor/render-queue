# Funnel Expedition — End-to-End Architecture Blueprint

## Status
Implementation Blueprint, revision 2 (bulletproofed through 10 v44 iterations)

## Bulletproofing receipts
1. Multi-socket architecture: `b8b07627e2709be3`
2. Page 0 identity: `c92d9a0d6178d224`
3. Gen-1 isolation: `61bd5c9de1ca813f`
4. Gen-2 typing: `f61acfb18f786386`
5. Tournament truth: `93a35c2b7efefb8b`
6. Defeat/inherit: `f4563f468c4ebd2c`
7. Evidence pool: `6c9f98913fa9ad6e`
8. Ledger persistence: `52d90f77e3e10880`
9. Pulse honesty: `78d95d70c7227d7d`
10. End-to-end integration: `95a854a5441de3b8`

## Page 0
Optimize the Funnel Expedition into a working system where 256 parallel investigations share data through multi-socket connections, each with different objectives, producing a verifiable champion through evidence-quality tournament.

---

## 1. MULTI-SOCKET SHARED DATA ARCHITECTURE

### Core principle (Sebastian's intuition)
All seats wire to the same data pots via multi-socket connections. Same data, different objectives. No copies.

### Socket topology
```
┌─────────────────────────────────────────────────┐
│                  SHARED DATA POTS               │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Page 0   │  │ Evidence │  │ Metrics      │  │
│  │ Pot      │  │ Pool Pot │  │ Pot          │  │
│  │ (read-   │  │ (read +  │  │ (append-    │  │
│  │  only)   │  │  write)  │  │  only)       │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │             │               │           │
│  ─────┼─────────────┼───────────────┼────       │
│       │    SOCKET BUS (pub/sub)     │           │
│  ─────┼─────────────┼───────────────┼────       │
│       │             │               │           │
│  ┌────▼──┐ ┌────▼──┐ ┌────▼──┐ ┌────▼──┐      │
│  │Seat 1 │ │Seat 2 │ │Seat 3 │ │Seat N │ ...  │
│  │(obj A)│ │(obj B)│ │(obj C)│ │(obj N)│      │
│  └───────┘ └───────┘ └───────┘ └───────┘      │
│                                                 │
│  Each seat: isolated namespace + shared pots    │
└─────────────────────────────────────────────────┘
```

### Pot specifications

**Page 0 Pot (read-only)**
- Stores: single canonical Page 0 text + SHA-256 hash
- Access: read-only for all seats. No seat can write.
- Seats receive: `{hash, lazy_ref}` — 100 bytes, not 10KB
- Text loaded on-demand via socket, never copied into seat input
- Failure: if pot unreachable, all seats hard-fail (no Page 0 = no investigation)

**Evidence Pool Pot (read + write)**
- Stores: content-hash → finding mappings
- Seats check BEFORE investigating (deduplication during, not after)
- Writes are append-only with provenance (which seat, which dimension)
- Conflict resolution: same content-hash from different seats = corroboration (strengthens), not duplicate (discarded)
- Failure: if pot unreachable, seats proceed independently and merge on reconnect

**Metrics Pot (append-only)**
- Stores: cache hits/misses, tokens used, duplicates avoided, escalations avoided
- All writes timestamped and attributed
- Read by Pulse for honest reporting
- Failure: metrics loss is acceptable (degraded reporting, not failed investigation)

### What is shared vs isolated
| Shared (via pots) | Isolated (per seat namespace) |
|---|---|
| Page 0 text and hash | Seat findings |
| Evidence pool entries | Seat decisions |
| Global metrics | Seat receipt |
| Dimension definitions | Seat lineage |

---

## 2. PAGE 0 IDENTITY AND PROPAGATION

### Mechanism
- Page 0 hash computed once at expedition start: `SHA-256(full_text)`
- Every seat receives `{page0_hash, page0_ref}` — never the full text in input
- Full text available via Page 0 Pot socket on demand
- Every seat's `page0_hash` must equal expedition `page0_hash` or seat is invalid

### Hard-fail test
- One test seat receives deliberately altered Page 0 (single character changed)
- Hash mismatch → seat must hard-fail with `PAGE0_MISMATCH` error
- If seat proceeds with wrong Page 0, the isolation mechanism is broken

### No-embedding rule
- Seat inputs contain: seat ID, purpose, dimension, page0_hash, page0_ref
- Seat inputs do NOT contain: Page 0 full text
- Match inputs contain: match ID, candidate summaries (not full findings), page0_hash
- This eliminates the 655MB problem at the architectural level

---

## 3. GEN-1 SEAT ISOLATION

### Namespace isolation (replaces _resetForTests)
- Each seat gets a unique kernel namespace: `expedition-{run_id}-seat-{seat_id}`
- Namespaces are isolated: seat A's stages do not appear in seat B's namespace
- No global reset. All 256 namespaces coexist.
- After run, all namespaces remain inspectable via session index

### Seat lifecycle
1. `namespace.create(expedition-{run_id}-seat-{seat_id})`
2. `K.open({request_id, input: {seat_id, purpose, dimension, page0_hash, page0_ref}, namespace})`
3. Seat loads Page 0 text on-demand from Page 0 Pot (if needed for investigation)
4. Seat checks Evidence Pool Pot before investigating (deduplication)
5. Seat runs: usage_plan → references → distill → decisions → replay → verdict
6. Seat writes findings to Evidence Pool Pot (with provenance)
7. Seat writes metrics to Metrics Pot
8. `namespace.seal()` — namespace becomes read-only, receipt issued

### Cross-contamination prevention
- Seats cannot read other seats' namespaces
- Seats can only write to shared pots (Evidence, Metrics)
- Evidence Pool Pot validates provenance on every write
- A seat writing malformed evidence is quarantined, not crashed

---

## 4. GEN-2 CHILD TYPING

### Two explicit types

**Type C: Canonical Funnel**
- Full stages: open → usage_plan → references → distill → decisions → replay → verdict
- Issues receipt
- Used when: child investigation is open-ended, requires judgment
- Schema: `{type:'canonical', request_id, stages:{...}, receipt}`

**Type P: Deterministic Probe**
- Narrower contract: input → deterministic function → output + proof
- No receipt (not a funnel), but auditable
- Used when: child investigation is mechanical (counting, pattern matching, validation)
- Schema: `{type:'probe', probe_id, function:'count_must_requirements', input_hash, output, proof}`

### Typing rule
- Every child must declare `type: 'canonical' | 'probe'` at creation
- If `type` is missing, child is rejected
- Code that calls a probe a "Funnel" fails validation
- Counts: `canonical_children` and `probe_children` tracked separately

---

## 5. TOURNAMENT SCORING (QUALITY OVER COUNT)

### Scoring function
```
score(candidate) =
  page0_coverage * 40 +      // % of Page 0 obligations addressed (0-1 → 0-40)
  evidence_quality * 30 +     // avg provenance score of evidence (0-1 → 0-30)
  falsification_survival * 20 + // % of evidence surviving falsification tests
  receipt_validity * 10        // 1 if receipt valid, 0 if not
```

### Evidence quality (per finding)
```
quality(finding) =
  has_provenance ? 0.3 : 0 +
  has_falsification_test ? 0.3 : 0 +
  corroborated_by_others ? 0.2 : 0 +
  directly_addresses_page0 ? 0.2 : 0
```

### Tie handling
- If `|scoreA - scoreB| < 0.01`: honest tie
- Tied candidates receive `standing: 'co-equal'`
- Both advance metadata to next round
- Reason: `"TIE: co-equal standing (scores ${scoreA} ≈ ${scoreB})"`
- Positional fallback is BANNED. No arbitrary winners.

### Pair order invariance
- Test: run tournament with shuffled pair order
- Non-tied outcomes must be identical
- If order changes a non-tied outcome, scoring function is broken

---

## 6. DEFEAT AND SELECTIVE INHERITANCE

### Adjudication rules (per loser evidence item)
1. **Page 0 alignment**: Does it address a Page 0 obligation? If no → reject (`reason: 'not_page0_aligned'`)
2. **Contradiction check**: Does it semantically contradict winner evidence? (Not string equality — semantic opposition.) If yes → reject (`reason: 'contradicts_winner'`, include contradicting winner evidence ID)
3. **Defect lineage**: Does it import a known defect pattern? If yes → reject (`reason: 'defect_lineage'`, include defect ID)
4. **Provenance**: Does it have valid provenance? If no → reject (`reason: 'no_provenance'`)
5. **Otherwise** → accept with `inherited_from` attribution

### Traceability
- Every inherited item: `{content, inherited_from: loser_seat, accepted_by: match_id, reason: 'passed_all_checks'}`
- Every rejected item: `{content, rejected_by: match_id, reason, evidence}`
- Champion's `lineage` array traces every element to its origin seat

### Test requirement
- Controlled test with known good and known bad loser evidence
- Must show at least one accept AND one reject
- If all accepted or all rejected, adjudication is not selective

---

## 7. EVIDENCE POOL DEDUPLICATION

### Pre-work check (not post-work)
```
Before investigating:
  1. Seat formulates investigation query
  2. Seat checks Evidence Pool Pot: "has this been investigated?"
  3. If yes and result is conclusive → use cached result, record cache_hit
  4. If yes but inconclusive → investigate independently, record corroboration
  5. If no → investigate, write result to pool, record cache_miss
```

### Duplicate vs corroboration
- **Duplicate**: same query, same method, same result → skip work, use cached
- **Corroboration**: same query, different method or different seat → independent investigation, strengthens evidence
- Pool stores: `{query_hash, method, result, seat_id, dimension, timestamp, corroboration_count}`

### Instrumentation
- Every pool check records: hit/miss, timestamp, seat
- Metrics Pot aggregates: total hits, total misses, hit rate
- Unmeasured values reported as `UNMEASURED`, never as 0

---

## 8. LEDGER PERSISTENCE

### Storage schema
```
expedition-{run_id}/
  manifest.json          // run manifest (schema v1)
  session-index.json     // maps seat/match IDs to namespace IDs
  namespaces/
    seat-000/            // 256 seat namespaces
      stages.json        // all 7 stages
      receipt.json       // signed receipt
    ...
    match-000/           // 255 match namespaces
      stages.json
      receipt.json
  evidence-pool.jsonl    // append-only evidence log
  metrics.json           // aggregated metrics
```

### Tamper detection
- Each namespace has a hash chain: each stage hashes the previous
- Receipt signs the final hash
- Tampering with any stage invalidates the receipt
- Tampering with one namespace does not affect others

### Post-run inspection
- All 511 namespaces (256 + 255) remain readable after run
- Session index provides O(1) lookup by seat/match ID
- No `_resetForTests()`. No destruction. Ever.

---

## 9. PULSE HONEST REPORTING

### Independent verification
`pulseView()` does NOT accept caller-supplied counts. Instead:
1. Reads `manifest.json` for expected counts
2. Reads `session-index.json` and counts actual namespaces
3. Verifies each receipt independently via `K.verifyReceipt()`
4. Reads `metrics.json` for measured values
5. Reports `UNMEASURED` for anything without evidence

### Output schema
```json
{
  "gen1_expected": 256,
  "gen1_actual": 256,
  "gen1_receipts_valid": 256,
  "gen2_canonical_expected": "UNMEASURED",
  "tournament_battles_expected": 255,
  "tournament_battles_actual": 255,
  "champion": "seat-042",
  "verification": "INDEPENDENT",
  "caveats": []
}
```

### Failure mode
- If verification fails, Pulse reports `"verification": "FAILED"` with details
- Pulse never reports success based on caller claims
- Pulse never hides failures

---

## 10. END-TO-END DATA FLOW

```
Page 0 Input
    │
    ▼
┌─────────────┐
│ Page 0 Pot  │◄── Hash verified, text stored once
└──────┬──────┘
       │ (read-only socket)
       ▼
┌─────────────────────────────────────────┐
│ 256 Gen-1 Seats (isolated namespaces)   │
│ Each: checks Evidence Pot → investigates │
│ → writes findings → gets receipt         │
└──────┬──────────────────────────────────┘
       │ (findings via Evidence Pool Pot)
       ▼
┌─────────────────────────────────────────┐
│ 65,536 Gen-2 Children                   │
│ Typed: canonical (receipt) or probe     │
│ (auditable contract)                    │
│ Parent-shaped: focus from parent gaps   │
└──────┬──────────────────────────────────┘
       │ (child results → parent revision)
       ▼
┌─────────────────────────────────────────┐
│ 255 Tournament Matches                  │
│ Quality scoring (not count)             │
│ Defeat/inherit with real adjudication   │
│ Honest ties → co-equal standing         │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│  Champion   │──► Blueprint with full lineage
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Pulse     │──► Independent verification
└─────────────┘    Honest reporting only
```

---

## FAILURE CONTRACT

| Failure | Response |
|---|---|
| Page 0 Pot unreachable | All seats hard-fail. No investigation without Page 0. |
| Evidence Pool Pot unreachable | Seats proceed independently. Merge on reconnect. |
| Metrics Pot unreachable | Degraded reporting. Investigation continues. |
| Seat namespace corrupted | Seat quarantined. Other seats unaffected. |
| Tournament scoring order-dependent | Scoring function rejected. Must be order-invariant. |
| Receipt invalid | Candidate cannot win. Match re-run. |
| Pulse verification fails | Report FAILED. Do not claim success. |

---

## PROOF REQUIREMENTS

- [ ] All 511 namespaces inspectable post-run
- [ ] Page 0 hash identical across all seats
- [ ] One altered-Page-0 test hard-fails
- [ ] Tournament order-invariance test passes
- [ ] At least one inherit accept AND one reject in controlled test
- [ ] Evidence pool hit rate measured (not assumed)
- [ ] Pulse verification independent (not caller-supplied)
- [ ] All 10 bulletproofing receipts valid

---

*If this Blueprint is correct, the product will be correct.*
*No pass certifies itself. Every claim has an artifact.*
