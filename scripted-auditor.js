// Automated Procedural Scripted Auditing System
// Bounded connections, auto-termination, cross-referencing, receipt verification,
// baked bug testing, error tracking, anti-intent accumulation.

const K = require('/home/hatch/workspace/moor-recovery/funnel-kernel.js');
const crypto = require('crypto');
const fs = require('fs');

class ScriptedAuditor {
  constructor(opts = {}) {
    this.maxConnections = opts.maxConnections || 5;  // bounded connections
    this.connections = new Map();
    this.errorLog = [];
    this.antiIntent = [];  // accumulation of opposite-of-intent
    this.terminated = new Set();
  }

  // Bounded connection: limit concurrent audits
  acquireConnection(auditId) {
    if (this.connections.size >= this.maxConnections) {
      return { granted: false, reason: 'connection bound reached' };
    }
    this.connections.set(auditId, { started: Date.now() });
    return { granted: true };
  }

  releaseConnection(auditId) {
    this.connections.delete(auditId);
  }

  // Auto-termination: if logic no longer applies to the situation, stop
  shouldTerminate(auditId, context) {
    // Semantic check: does the audit logic still apply?
    if (!context.page0 || !context.page0.text) {
      this.terminated.add(auditId);
      return { terminate: true, reason: 'No Page 0 — logic not applicable' };
    }
    if (context.page0.text.length < 10) {
      this.terminated.add(auditId);
      return { terminate: true, reason: 'Page 0 too short — logic not applicable' };
    }
    // Check if we've seen this exact Page 0 before (no new information)
    const hash = crypto.createHash('sha256').update(context.page0.text).digest('hex').slice(0, 16);
    if (this._seenHashes && this._seenHashes.has(hash)) {
      this.terminated.add(auditId);
      return { terminate: true, reason: 'Duplicate Page 0 — no new information' };
    }
    this._seenHashes = this._seenHashes || new Set();
    this._seenHashes.add(hash);
    return { terminate: false };
  }

  // Cross-referencing: when wrong results appear, cross-check against independent sources
  crossReference(result, independentSources) {
    const discrepancies = [];
    for (const source of independentSources) {
      if (source.hash !== result.page0_hash) {
        discrepancies.push({
          type: 'hash_mismatch',
          expected: result.page0_hash,
          found: source.hash,
          source: source.name,
        });
      }
      if (source.receipt && !K.verifyReceipt(source.receipt)) {
        discrepancies.push({
          type: 'receipt_invalid',
          source: source.name,
        });
      }
    }
    return discrepancies;
  }

  // Concrete receipt verification with error exposing
  verifyReceiptWithExposure(receipt) {
    const result = { valid: false, errors: [] };

    if (!receipt) {
      result.errors.push({ code: 'RECEIPT_MISSING', message: 'No receipt provided' });
      return result;
    }
    if (!receipt.fingerprint) {
      result.errors.push({ code: 'FINGERPRINT_MISSING', message: 'Receipt has no fingerprint' });
      return result;
    }

    try {
      result.valid = K.verifyReceipt(receipt);
      if (!result.valid) {
        result.errors.push({
          code: 'VERIFICATION_FAILED',
          message: 'Receipt failed kernel verification',
          fingerprint: receipt.fingerprint.slice(0, 16),
        });
      }
    } catch (e) {
      result.errors.push({ code: 'VERIFICATION_ERROR', message: e.message });
    }

    // Log errors for tracking
    if (result.errors.length > 0) {
      this.errorLog.push({
        at: new Date().toISOString(),
        receipt_fp: receipt.fingerprint ? receipt.fingerprint.slice(0, 16) : 'none',
        errors: result.errors,
      });
    }

    return result;
  }

  // Baked bug testing: run standard bug probes
  runBugProbes(target) {
    const bugs = [];

    // Probe 1: null/undefined handling
    try {
      target(null);
    } catch (e) {
      bugs.push({ probe: 'null_input', error: e.message.slice(0, 100) });
    }

    // Probe 2: empty input
    try {
      const r = target('');
      if (r === undefined) bugs.push({ probe: 'empty_input', error: 'returned undefined' });
    } catch (e) {
      bugs.push({ probe: 'empty_input', error: e.message.slice(0, 100) });
    }

    // Probe 3: massive input
    try {
      target('x'.repeat(1000000));
    } catch (e) {
      bugs.push({ probe: 'massive_input', error: e.message.slice(0, 100) });
    }

    return bugs;
  }

  // Anti-intent accumulation: learn what NOT to do from failures
  accumulateAntiIntent(failure) {
    const anti = {
      at: new Date().toISOString(),
      what_failed: failure.what,
      why: failure.why,
      do_not: failure.do_not,  // explicit anti-pattern
      context: failure.context,
    };
    this.antiIntent.push(anti);

    // Persist
    try {
      const path = '/home/hatch/workspace/funnel-docs/anti-intent.jsonl';
      fs.appendFileSync(path, JSON.stringify(anti) + '\n');
    } catch (e) { /* non-fatal */ }

    return anti;
  }

  getAntiIntent() {
    return this.antiIntent;
  }

  getErrorLog() {
    return this.errorLog;
  }

  // Full scripted audit
  audit(auditId, context) {
    const conn = this.acquireConnection(auditId);
    if (!conn.granted) {
      return { auditId, status: 'rejected', reason: conn.reason };
    }

    try {
      // Auto-termination check
      const term = this.shouldTerminate(auditId, context);
      if (term.terminate) {
        return { auditId, status: 'terminated', reason: term.reason };
      }

      const results = {
        auditId,
        status: 'complete',
        receipt_checks: [],
        bug_probes: [],
        cross_refs: [],
        anti_intent_new: 0,
      };

      // Receipt verification with error exposing
      if (context.receipts) {
        for (const r of context.receipts) {
          const v = this.verifyReceiptWithExposure(r);
          results.receipt_checks.push(v);
          if (!v.valid) {
            this.accumulateAntiIntent({
              what: 'receipt_verification',
              why: v.errors.map(e => e.code).join(','),
              do_not: 'Accept unverified receipts as authority',
              context: auditId,
            });
            results.anti_intent_new++;
          }
        }
      }

      // Bug probes on target function
      if (context.target_fn) {
        results.bug_probes = this.runBugProbes(context.target_fn);
        for (const b of results.bug_probes) {
          this.accumulateAntiIntent({
            what: `bug_probe:${b.probe}`,
            why: b.error,
            do_not: `Assume ${b.probe} is handled`,
            context: auditId,
          });
          results.anti_intent_new++;
        }
      }

      // Cross-referencing
      if (context.result && context.sources) {
        results.cross_refs = this.crossReference(context.result, context.sources);
        for (const d of results.cross_refs) {
          this.accumulateAntiIntent({
            what: `cross_ref:${d.type}`,
            why: JSON.stringify(d).slice(0, 200),
            do_not: 'Trust single-source results without cross-reference',
            context: auditId,
          });
          results.anti_intent_new++;
        }
      }

      return results;
    } finally {
      this.releaseConnection(auditId);
    }
  }
}

module.exports = { ScriptedAuditor };
