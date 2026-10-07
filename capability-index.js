/* Capability Index — searchable registry of verified machinery.
 * The Funnel's references stage searches this BEFORE inventing.
 * If a verified capability exists, reuse it. If not, invention becomes a new entry.
 *
 * Schema: moor.capability-index v1
 */
'use strict';

const INDEX = {
  schema: 'moor.capability-index',
  version: 1,
  generated: '2026-10-07',
  capabilities: [
    {
      id: 'funnel-kernel-v44',
      name: 'V44-Sealed Funnel Kernel',
      description: 'Canonical 7-stage funnel state machine with receipt minting.',
      location: '/home/hatch/workspace/moor-recovery/funnel-kernel.js',
      pulse_url: null,
      tags: ['funnel', 'kernel', 'authority', 'receipt'],
      provides: ['K.open', 'K.advance', 'K.verifyReceipt', 'K.makeUsagePlan', 'K.extractObligations'],
      verified: true,
      verification: 'Used in 50+ funnel runs with valid receipts.',
      reuse_count: 50,
    },
    {
      id: 'funnel-expedition-v61',
      name: 'Funnel Expedition v6.1',
      description: '256-seat parallel investigation with tournament.',
      location: 'https://bassseamoor.github.io/render-queue/funnel-expedition.js',
      pulse_url: null,
      tags: ['funnel', 'expedition', 'tournament', 'parallel'],
      provides: ['runCanonicalFunnel', 'runMatchFunnel', 'runChildInvestigation', 'reconverge'],
      verified: false,
      verification: 'Pass 1 truth table found 15 defects. See architecture Blueprint.',
      reuse_count: 3,
    },
    {
      id: 'funnel-fabric',
      name: 'Funnel Fabric',
      description: 'Compiles natural language descriptions into funnel definitions, runs on v44 kernel.',
      location: 'pulse-tools/tool-funnelfabric.js',
      pulse_url: 'https://bassseamoor.github.io/render-queue/pulse-tools/tool-funnelfabric.js',
      tags: ['funnel', 'creation', 'interface', 'interactive'],
      provides: ['TOOLS.funnelfabric.mount'],
      verified: true,
      verification: 'Returns 200. Mounts successfully.',
      reuse_count: 0,
    },
    {
      id: 'blueprint-sop-v1',
      name: 'Blueprint SOP v1.0',
      description: '7-procedure Standard Operating Procedure for writing bulletproof Blueprints.',
      location: 'https://bassseamoor.github.io/render-queue/blueprint-sop.html',
      pulse_url: 'https://bassseamoor.github.io/render-queue/blueprint-sop.html',
      tags: ['blueprint', 'sop', 'quality', 'procedure'],
      provides: ['SOP-1: API Reality Check', 'SOP-2: Decision Mechanization', 'SOP-3: Constant Justification', 'SOP-4: Mechanism Naming', 'SOP-5: Failure Enumeration', 'SOP-6: Test Code', 'SOP-7: Version Negotiation'],
      verified: true,
      verification: 'Derived from flaw assessment e0285f1b. Returns 200.',
      reuse_count: 0,
    },
    {
      id: 'funnel-vocabulary-v1',
      name: 'Funnel Properties Vocabulary v1.0',
      description: '336 candidate Funnel properties across 19 categories, each testable.',
      location: 'https://bassseamoor.github.io/render-queue/funnel-vocabulary.json',
      pulse_url: 'https://bassseamoor.github.io/render-queue/funnel-vocabulary.html',
      tags: ['funnel', 'reference', 'vocabulary', 'properties'],
      provides: ['336 testable properties', 'anti-bullshit questions', 'optimization loop', 'core invariant'],
      verified: true,
      verification: 'Machine-readable JSON. Returns 200.',
      reuse_count: 0,
    },
    {
      id: 'architecture-blueprint-rev2',
      name: 'Expedition Architecture Blueprint rev2',
      description: 'End-to-end architecture with multi-socket shared data design. 10x bulletproofed.',
      location: 'https://bassseamoor.github.io/render-queue/funnel-expedition-architecture-blueprint.md',
      pulse_url: 'https://bassseamoor.github.io/render-queue/blueprint-architecture.html',
      tags: ['blueprint', 'architecture', 'expedition'],
      provides: ['Multi-socket design', 'Failure contract', 'Proof requirements'],
      verified: false,
      verification: 'Flaw assessment found 4 critical + 5 major flaws. See e0285f1b.',
      reuse_count: 0,
    },
  ]
};

/* Search the capability index. Returns matching capabilities sorted by relevance. */
function searchCapabilities(query, opts) {
  opts = opts || {};
  const terms = query.toLowerCase().split(/\s+/);
  const results = [];

  for (const cap of INDEX.capabilities) {
    let score = 0;
    const haystack = [
      cap.name, cap.description,
      ...(cap.tags || []),
      ...(cap.provides || []),
    ].join(' ').toLowerCase();

    for (const term of terms) {
      if (haystack.includes(term)) score += 1;
      // Bonus for tag match
      if ((cap.tags || []).some(t => t.toLowerCase() === term)) score += 2;
      // Bonus for provides match
      if ((cap.provides || []).some(p => p.toLowerCase().includes(term))) score += 2;
    }

    if (score > 0) {
      // Verified capabilities rank higher
      if (cap.verified) score += 5;
      // Frequently reused rank higher
      score += Math.min(cap.reuse_count || 0, 10) * 0.5;
      results.push({ capability: cap, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  const limit = opts.limit || 10;
  return results.slice(0, limit).map(r => ({
    ...r.capability,
    _search_score: r.score,
  }));
}

/* Record a reuse event. Increments reuse_count for compounding measurement. */
function recordReuse(capabilityId) {
  const cap = INDEX.capabilities.find(c => c.id === capabilityId);
  if (cap) {
    cap.reuse_count = (cap.reuse_count || 0) + 1;
    return true;
  }
  return false;
}

/* Check if a capability exists before inventing. Returns existing or null. */
function findOrNull(query) {
  const results = searchCapabilities(query, { limit: 1 });
  return results.length > 0 ? results[0] : null;
}

module.exports = {
  INDEX,
  searchCapabilities,
  recordReuse,
  findOrNull,
  // For the Funnel references stage:
  searchBeforeInvent: function (need_description) {
    const found = findOrNull(need_description);
    if (found && found.verified) {
      recordReuse(found.id);
      return { action: 'reuse', capability: found };
    } else if (found) {
      return { action: 'reuse_with_caution', capability: found, warning: 'Not verified. See: ' + found.verification };
    } else {
      return { action: 'invent', reason: 'No matching verified capability found.' };
    }
  }
};
