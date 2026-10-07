/**
 * TAGS: tool:evolutionrecord | cat:interface cat:creation | kind:interactive |
 *       dep:canvas2d | prov:funnel-evolution-lens | see:funnel-kernel |
 *       src:funnel-docs/funnel-evolution-record-requirement.md
 *
 * Funnel Evolution Record — INERT CORE (pure functions, zero dependencies).
 *
 * A read-only lens over Funnel history. Records exact structural snapshots of the
 * Funnel (nodes + edges), diffs two snapshots exactly, and traces a node's
 * lineage across snapshot versions. It never scores, ranks, prunes, or composes
 * candidates, never writes to any record, and makes no appearance->cognitive-
 * property claims. Data labels only.
 *
 * Runs under plain node (no window/document) and in the browser.
 *
 * Node roles (exact strings): stage, candidate, obligation, reference, decision,
 * failure, receipt, lineage.
 * Edge roles (exact strings): requires, produced-by, decided-by, evidenced-by,
 * supersedes, merged-into, split-from.
 *
 * Merge/split convention (evidence-text markers, so diffs stay exact):
 *   - A node in snapshot B whose evidence contains "merged-from:id1,id2"
 *     declares that ids id1, id2 existed in A and were replaced by this node.
 *   - A node in snapshot A whose evidence contains "merged-into:id"
 *     declares the same from the other side (supported either way).
 *   - A node in snapshot B whose evidence contains "split-from:id"
 *     declares that id existed in A and was replaced by this node (and any
 *     other B node naming the same source).
 * Markers are parsed with plain string matching; no fuzzy logic anywhere.
 */
(function () {
  'use strict';

  var NODE_ROLES = ['stage', 'candidate', 'obligation', 'reference', 'decision', 'failure', 'receipt', 'lineage'];
  var EDGE_ROLES = ['requires', 'produced-by', 'decided-by', 'evidenced-by', 'supersedes', 'merged-into', 'split-from'];

  /** Record constructor: an exact structural snapshot. */
  function snapshot(id, meta, nodes, edges) {
    return {
      id: String(id),
      meta: meta || {},
      nodes: Array.isArray(nodes) ? nodes.slice() : [],
      edges: Array.isArray(edges) ? edges.slice() : []
    };
  }

  function nodeById(snap, id) {
    for (var i = 0; i < snap.nodes.length; i++) {
      if (snap.nodes[i].id === id) return snap.nodes[i];
    }
    return null;
  }

  /** Incident-edge signature of a node: sorted "from>to:role" strings. Exact. */
  function edgeSignature(id, edges) {
    var parts = [];
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      if (e.from === id || e.to === id) parts.push(e.from + '>' + e.to + ':' + e.role);
    }
    parts.sort();
    return parts.join('|');
  }

  function sortedIds(list) {
    return list.slice().sort();
  }

  function parseList(evidence, marker) {
    // evidence marker like "merged-from:ob-4a,ob-4b" or "split-from:ref-3"
    var m = /([a-z-]+)\s*:\s*([A-Za-z0-9_\-, ]+)/.exec(String(evidence || ''));
    if (!m || m[1] !== marker) return null;
    return m[2].split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  }

  /**
   * Exact diff of two snapshots. Returns
   * { added:[], removed:[], changed:[], merged:[{from:[],to}], split:[{from,to:[]}] }.
   * added/removed are node ids; changed are ids present in both with different
   * label, role, or incident edges. merged/split are identity events declared
   * via evidence markers (see file header). Ids named in a merged/split event
   * still appear in added/removed (they are gone/new as ids); the event says why.
   * All arrays sorted for determinism.
   */
  function diffSnapshots(a, b) {
    var aIds = {}, bIds = {}, i, n;
    for (i = 0; i < a.nodes.length; i++) aIds[a.nodes[i].id] = a.nodes[i];
    for (i = 0; i < b.nodes.length; i++) bIds[b.nodes[i].id] = b.nodes[i];

    var added = [], removed = [], changed = [];
    for (i = 0; i < b.nodes.length; i++) {
      n = b.nodes[i];
      if (!aIds.hasOwnProperty(n.id)) { added.push(n.id); continue; }
      var prev = aIds[n.id];
      if (prev.label !== n.label || prev.role !== n.role ||
          edgeSignature(n.id, a.edges) !== edgeSignature(n.id, b.edges)) {
        changed.push(n.id);
      }
    }
    for (i = 0; i < a.nodes.length; i++) {
      n = a.nodes[i];
      if (!bIds.hasOwnProperty(n.id)) removed.push(n.id);
    }

    // merged events: declared on the B side ("merged-from:a,b") or the A side ("merged-into:t")
    var mergedByTo = {};
    for (i = 0; i < b.nodes.length; i++) {
      n = b.nodes[i];
      if (aIds.hasOwnProperty(n.id)) continue;
      var from = parseList(n.evidence, 'merged-from');
      if (from) {
        var kept = from.filter(function (id) { return aIds.hasOwnProperty(id) && !bIds.hasOwnProperty(id); });
        if (kept.length) {
          (mergedByTo[n.id] = mergedByTo[n.id] || []).push.apply(mergedByTo[n.id], kept);
        }
      }
    }
    for (i = 0; i < a.nodes.length; i++) {
      n = a.nodes[i];
      if (bIds.hasOwnProperty(n.id)) continue;
      var into = parseList(n.evidence, 'merged-into');
      if (into && into.length && bIds.hasOwnProperty(into[0])) {
        (mergedByTo[into[0]] = mergedByTo[into[0]] || []).push(n.id);
      }
    }
    var merged = Object.keys(mergedByTo).sort().map(function (to) {
      return { from: sortedIds(Array.from(new Set(mergedByTo[to]))), to: to };
    });

    // split events: declared on the B side ("split-from:id")
    var splitByFrom = {};
    for (i = 0; i < b.nodes.length; i++) {
      n = b.nodes[i];
      if (aIds.hasOwnProperty(n.id)) continue;
      var src = parseList(n.evidence, 'split-from');
      if (src && src.length && aIds.hasOwnProperty(src[0]) && !bIds.hasOwnProperty(src[0])) {
        (splitByFrom[src[0]] = splitByFrom[src[0]] || []).push(n.id);
      }
    }
    var split = Object.keys(splitByFrom).sort().map(function (from) {
      return { from: from, to: sortedIds(splitByFrom[from]) };
    });

    return {
      added: sortedIds(added),
      removed: sortedIds(removed),
      changed: sortedIds(changed),
      merged: merged,
      split: split
    };
  }

  /**
   * Event chain of one node id across an ordered list of snapshots.
   * Returns [{ snapshot, present, node, transition }] where transition describes
   * what happened between the previous snapshot and this one (null for the first).
   */
  function lineage(nodeId, snapshots) {
    var chain = [];
    for (var i = 0; i < snapshots.length; i++) {
      var s = snapshots[i];
      var n = nodeById(s, nodeId);
      var transition = null;
      if (i > 0) {
        var d = diffSnapshots(snapshots[i - 1], s);
        var has = function (arr) { return arr.indexOf(nodeId) !== -1; };
        if (has(d.added)) {
          var sp = null;
          for (var k = 0; k < d.split.length; k++) {
            if (d.split[k].to.indexOf(nodeId) !== -1) sp = d.split[k].from;
          }
          transition = sp ? ('split from ' + sp) : 'added';
        } else if (has(d.removed)) {
          var mg = null;
          for (var m = 0; m < d.merged.length; m++) {
            if (d.merged[m].from.indexOf(nodeId) !== -1) mg = d.merged[m].to;
          }
          transition = mg ? ('merged into ' + mg) : 'removed';
        } else if (has(d.changed)) {
          transition = 'changed';
        } else {
          transition = 'unchanged';
        }
      }
      chain.push({ snapshot: s.id, present: !!n, node: n, transition: transition });
    }
    return chain;
  }

  /** Determinism + diff-correctness proof. Returns {pass, checks:[{name,pass}]}. */
  function selfCheck() {
    var checks = [];
    function check(name, pass) { checks.push({ name: name, pass: !!pass }); }

    // 1. snapshot shape
    var s1 = snapshot('s1', { v: 1 }, [{ id: 'n1', role: 'stage', label: 'A', evidence: 'demo' }], []);
    check('snapshot-shape', s1.id === 's1' && Array.isArray(s1.nodes) && Array.isArray(s1.edges) &&
      s1.nodes.length === 1 && s1.nodes[0].id === 'n1');

    // 2. identical snapshots -> empty diff
    var d0 = diffSnapshots(s1, snapshot('s1', { v: 1 }, [{ id: 'n1', role: 'stage', label: 'A', evidence: 'demo' }], []));
    check('diff-identical-empty', d0.added.length === 0 && d0.removed.length === 0 &&
      d0.changed.length === 0 && d0.merged.length === 0 && d0.split.length === 0);

    // 3. added / removed
    var sa = snapshot('a', {}, [{ id: 'n1', role: 'stage', label: 'A', evidence: '' }], []);
    var sb = snapshot('b', {}, [
      { id: 'n1', role: 'stage', label: 'A', evidence: '' },
      { id: 'n2', role: 'receipt', label: 'B', evidence: '' }
    ], []);
    var dab = diffSnapshots(sa, sb), dba = diffSnapshots(sb, sa);
    check('diff-added-removed', dab.added.join() === 'n2' && dab.removed.length === 0 &&
      dba.removed.join() === 'n2' && dba.added.length === 0);

    // 4. changed label
    var sc = snapshot('c', {}, [{ id: 'n1', role: 'stage', label: 'B', evidence: '' }], []);
    check('diff-changed-label', diffSnapshots(sa, sc).changed.join() === 'n1');

    // 5. changed edges (same node, new incident edge)
    var se1 = snapshot('e1', {}, [{ id: 'n1', role: 'stage', label: 'A', evidence: '' }], []);
    var se2 = snapshot('e2', {}, [
      { id: 'n1', role: 'stage', label: 'A', evidence: '' },
      { id: 'n2', role: 'receipt', label: 'B', evidence: '' }
    ], [{ from: 'n1', to: 'n2', role: 'evidenced-by', label: '' }]);
    check('diff-changed-edges', diffSnapshots(se1, se2).changed.join() === 'n1');

    // 6. merged convention (B side marker)
    var sm1 = snapshot('m1', {}, [
      { id: 'x1', role: 'obligation', label: 'X1', evidence: '' },
      { id: 'x2', role: 'obligation', label: 'X2', evidence: '' }
    ], []);
    var sm2 = snapshot('m2', {}, [
      { id: 'x', role: 'obligation', label: 'X', evidence: 'merged-from:x1,x2' }
    ], []);
    var dm = diffSnapshots(sm1, sm2);
    check('diff-merged', dm.merged.length === 1 && dm.merged[0].to === 'x' &&
      dm.merged[0].from.join() === 'x1,x2');

    // 6b. merged convention (A side marker)
    var sm1b = snapshot('m1b', {}, [
      { id: 'x1', role: 'obligation', label: 'X1', evidence: 'merged-into:x' },
      { id: 'x2', role: 'obligation', label: 'X2', evidence: 'merged-into:x' }
    ], []);
    var sm2b = snapshot('m2b', {}, [{ id: 'x', role: 'obligation', label: 'X', evidence: '' }], []);
    var dmb = diffSnapshots(sm1b, sm2b);
    check('diff-merged-a-side', dmb.merged.length === 1 && dmb.merged[0].from.join() === 'x1,x2');

    // 7. split convention
    var sp1 = snapshot('p1', {}, [{ id: 'r', role: 'reference', label: 'R', evidence: '' }], []);
    var sp2 = snapshot('p2', {}, [
      { id: 'r-a', role: 'reference', label: 'RA', evidence: 'split-from:r' },
      { id: 'r-b', role: 'reference', label: 'RB', evidence: 'split-from:r' }
    ], []);
    var dsp = diffSnapshots(sp1, sp2);
    check('diff-split', dsp.split.length === 1 && dsp.split[0].from === 'r' &&
      dsp.split[0].to.join() === 'r-a,r-b');

    // 8. determinism
    var dd1 = JSON.stringify(diffSnapshots(DEMO.v1, DEMO.v2));
    var dd2 = JSON.stringify(diffSnapshots(DEMO.v1, DEMO.v2));
    check('diff-deterministic', dd1 === dd2);

    // 9. lineage chain across the demo snapshots
    var chain = lineage('ob-4', [DEMO.v1, DEMO.v2, DEMO.v3]);
    check('lineage-chain', chain.length === 3 && !chain[0].present && chain[1].present &&
      chain[2].present && /merged|added/.test(chain[1].transition || ''));

    // 10. every demo node is labeled demo in its evidence
    var allDemo = true, allRoles = true;
    [DEMO.v1, DEMO.v2, DEMO.v3].forEach(function (snap) {
      snap.nodes.forEach(function (n) {
        if (String(n.evidence || '').indexOf('demo') === -1) allDemo = false;
        if (NODE_ROLES.indexOf(n.role) === -1) allRoles = false;
      });
      snap.edges.forEach(function (e) {
        if (EDGE_ROLES.indexOf(e.role) === -1) allRoles = false;
      });
    });
    check('demo-all-labeled-demo', allDemo);
    check('demo-roles-exact', allRoles);

    // 11. the demo diffs exercise every highlight class
    var d12 = diffSnapshots(DEMO.v1, DEMO.v2), d23 = diffSnapshots(DEMO.v2, DEMO.v3);
    check('demo-diff-classes', d12.added.length > 0 && d12.merged.length > 0 &&
      d12.split.length > 0 && d12.changed.length > 0 && d23.removed.length > 0 &&
      d23.added.length > 0);

    // 12. changed-role counts as changed
    var sr1 = snapshot('r1', {}, [{ id: 'n1', role: 'stage', label: 'A', evidence: '' }], []);
    var sr2 = snapshot('r2', {}, [{ id: 'n1', role: 'decision', label: 'A', evidence: '' }], []);
    check('diff-changed-role', diffSnapshots(sr1, sr2).changed.join() === 'n1');

    var pass = checks.every(function (c) { return c.pass; });
    return { pass: pass, checks: checks };
  }

  // ---------------------------------------------------------------------------
  // DEMO dataset: 3 snapshots synthesized from REAL sealed receipts.
  // Every node and edge is labeled "demo" in its evidence/label text. This is a
  // demonstration record, not the Funnel's actual history.
  // Receipts referenced: 2e44784661158cd5 (fabric runtime), fc5f0e9eb62a
  // (evergreen context), 608514ba3c138bdb (adapter cache-bust),
  // 9a8f1b8152224f96 (DEV-01 REV6), 4d2bfd029313ef73 (Pulse 3D migration),
  // plus distill-frontier contract events.
  // ---------------------------------------------------------------------------

  function N(id, role, label, evidence) {
    return { id: id, role: role, label: label, evidence: 'demo — ' + evidence };
  }
  function E(from, to, role, label) {
    return { from: from, to: to, role: role, label: 'demo — ' + label };
  }

  var STAGES_V1 = [
    N('s-intake', 'stage', 'Intake', 'stage in the intake record snapshot.'),
    N('s-intent', 'stage', 'Intent', 'stage in the intake record snapshot.'),
    N('s-blueprint', 'stage', 'Blueprint', 'stage in the intake record snapshot.'),
    N('s-build', 'stage', 'Build', 'stage in the intake record snapshot.'),
    N('s-verify', 'stage', 'Verify', 'stage in the intake record snapshot.'),
    N('s-distill', 'stage', 'Distill', 'stage in the intake record snapshot.'),
    N('s-decide', 'stage', 'Decide', 'stage in the intake record snapshot.'),
    N('s-record', 'stage', 'Record', 'stage in the intake record snapshot.')
  ];

  var OBLIGATIONS_V1 = [
    N('ob-1', 'obligation', 'Exact topology preserved', 'obligation carried by the run.'),
    N('ob-2', 'obligation', 'Receipts verbatim', 'obligation carried by the run.'),
    N('ob-3', 'obligation', 'No cognitive claims', 'obligation carried by the run.'),
    N('ob-4a', 'obligation', 'Lens only, no kernel writes', 'duplicate of the same obligation as ob-4b; the two are merged into ob-4 in v2.'),
    N('ob-4b', 'obligation', 'Lens only, no kernel writes', 'duplicate of the same obligation as ob-4a; the two are merged into ob-4 in v2.')
  ];

  var REFERENCES_V1 = [
    N('ref-1', 'reference', 'Requirement doc', 'reference: the funnel-evolution-record requirement text.'),
    N('ref-2', 'reference', 'Blueprint v1', 'reference: the sealed funnel build spec (receipt 4978940cc73fd989).'),
    N('ref-3', 'reference', 'Contradiction on hold', 'holds two contradictory positions about Phase 2; split into ref-3a and ref-3b in v2. split-from target.')
  ];

  var RECEIPTS_V1 = [
    N('rc-fabric', 'receipt', 'Receipt 2e44784661158cd5', 'sealed receipt 2e44784661158cd5 (fabric runtime).'),
    N('rc-evergreen', 'receipt', 'Receipt fc5f0e9eb62a', 'sealed receipt fc5f0e9eb62a (evergreen context).')
  ];

  function chainEdges(stages) {
    var edges = [];
    for (var i = 0; i + 1 < stages.length; i++) {
      edges.push(E(stages[i].id, stages[i + 1].id, 'requires', 'stage order in the record.'));
    }
    return edges;
  }

  var v1 = snapshot('v1', {
    version: 'v1', title: 'Intake record', current: false,
    note: 'demo snapshot — the intake record. Not the Funnel\u2019s actual history.'
  },
    STAGES_V1.concat(OBLIGATIONS_V1, REFERENCES_V1, RECEIPTS_V1),
    chainEdges(STAGES_V1).concat([
      E('ob-1', 's-intake', 'evidenced-by', 'obligation attached at intake.'),
      E('ob-2', 's-record', 'evidenced-by', 'obligation attached at record.'),
      E('ob-3', 's-decide', 'evidenced-by', 'obligation attached at decide.'),
      E('ob-4a', 's-verify', 'evidenced-by', 'obligation attached at verify.'),
      E('ob-4b', 's-verify', 'evidenced-by', 'obligation attached at verify.'),
      E('ref-1', 's-intent', 'evidenced-by', 'reference read at intent.'),
      E('ref-2', 's-blueprint', 'evidenced-by', 'reference read at blueprint.'),
      E('ref-3', 's-decide', 'evidenced-by', 'reference read at decide.'),
      E('rc-fabric', 's-build', 'produced-by', 'receipt produced at build.'),
      E('rc-evergreen', 's-distill', 'produced-by', 'receipt produced at distill.')
    ]));

  // --- v2: adds candidates, decisions, failures, 2 receipts; one merge, one split, one changed label ---
  var STAGES_V2 = STAGES_V1.map(function (n) {
    if (n.id === 's-verify') return N('s-verify', 'stage', 'Verify (gated)', 'stage label changed in v2: gates are now explicit. changed node.');
    return N(n.id, n.role, n.label, n.evidence.replace(/^demo — /, ''));
  });

  var OBLIGATIONS_V2 = [
    N('ob-1', 'obligation', 'Exact topology preserved', 'obligation carried by the run.'),
    N('ob-2', 'obligation', 'Receipts verbatim', 'obligation carried by the run.'),
    N('ob-3', 'obligation', 'No cognitive claims', 'obligation carried by the run.'),
    N('ob-4', 'obligation', 'Lens only, no kernel writes', 'merged-from:ob-4a,ob-4b — the two duplicate obligation nodes from v1 were merged into this one.')
  ];

  var REFERENCES_V2 = [
    N('ref-1', 'reference', 'Requirement doc', 'reference: the funnel-evolution-record requirement text.'),
    N('ref-2', 'reference', 'Blueprint v1', 'reference: the sealed funnel build spec (receipt 4978940cc73fd989).'),
    N('ref-3a', 'reference', 'Hold Phase 2', 'split-from:ref-3 — one side of the contradiction: keep Phase 2 on hold until evidence demands it.'),
    N('ref-3b', 'reference', 'Watch the lineage log', 'split-from:ref-3 — other side of the contradiction: natural work keeps leaving fossils in the lineage log.')
  ];

  var RECEIPTS_V2 = RECEIPTS_V1.concat([
    N('rc-cachebust', 'receipt', 'Receipt 608514ba3c138bdb', 'sealed receipt 608514ba3c138bdb (adapter cache-bust).'),
    N('rc-pulse3d', 'receipt', 'Receipt 4d2bfd029313ef73', 'sealed receipt 4d2bfd029313ef73 (Pulse 3D migration).')
  ]);

  var CANDIDATES_V2 = [
    N('c-1', 'candidate', 'Candidate A', 'preserved candidate from the frontier. Not scored, not ranked, not pruned — preserved.'),
    N('c-2', 'candidate', 'Candidate B', 'preserved candidate from the frontier. Not scored, not ranked, not pruned — preserved.'),
    N('c-3', 'candidate', 'Candidate C', 'preserved candidate from the frontier. Not scored, not ranked, not pruned — preserved.'),
    N('c-4', 'candidate', 'Candidate D', 'preserved candidate from the frontier. Not scored, not ranked, not pruned — preserved.'),
    N('c-5', 'candidate', 'Candidate E', 'preserved candidate from the frontier. Not scored, not ranked, not pruned — preserved.')
  ];

  var DECISIONS_V2 = [
    N('d-1', 'decision', 'Decision 1', 'decision recorded against the preserved frontier.'),
    N('d-2', 'decision', 'Decision 2', 'decision recorded against the preserved frontier.'),
    N('d-3', 'decision', 'Decision 3', 'decision recorded against the preserved frontier.'),
    N('d-4', 'decision', 'Decision 4', 'decision recorded against the preserved frontier.')
  ];

  var FAILURES_V2 = [
    N('f-1', 'failure', 'Failure 1', 'recorded failure; kept in the record, not hidden.'),
    N('f-2', 'failure', 'Failure 2', 'recorded failure; kept in the record, not hidden. Superseded; removed in v3.')
  ];

  var v2 = snapshot('v2', {
    version: 'v2', title: 'Frontier preserved', current: false,
    note: 'demo snapshot — candidates, decisions and failures appear. Not the Funnel\u2019s actual history.'
  },
    STAGES_V2.concat(OBLIGATIONS_V2, REFERENCES_V2, RECEIPTS_V2, CANDIDATES_V2, DECISIONS_V2, FAILURES_V2),
    chainEdges(STAGES_V2).concat([
      E('ob-1', 's-intake', 'evidenced-by', 'obligation attached at intake.'),
      E('ob-2', 's-record', 'evidenced-by', 'obligation attached at record.'),
      E('ob-3', 's-decide', 'evidenced-by', 'obligation attached at decide.'),
      E('ob-4', 's-verify', 'evidenced-by', 'obligation attached at verify.'),
      E('ob-4', 'ob-4a', 'supersedes', 'merge record: ob-4 replaces ob-4a (v1 id, kept as a trace edge).'),
      E('ref-1', 's-intent', 'evidenced-by', 'reference read at intent.'),
      E('ref-2', 's-blueprint', 'evidenced-by', 'reference read at blueprint.'),
      E('ref-3a', 's-decide', 'evidenced-by', 'reference read at decide.'),
      E('ref-3b', 's-decide', 'evidenced-by', 'reference read at decide.'),
      E('rc-fabric', 's-build', 'produced-by', 'receipt produced at build.'),
      E('rc-evergreen', 's-distill', 'produced-by', 'receipt produced at distill.'),
      E('rc-cachebust', 's-verify', 'produced-by', 'receipt produced at verify.'),
      E('rc-pulse3d', 's-build', 'produced-by', 'receipt produced at build.'),
      E('c-1', 's-distill', 'produced-by', 'candidate preserved at distill.'),
      E('c-2', 's-distill', 'produced-by', 'candidate preserved at distill.'),
      E('c-3', 's-distill', 'produced-by', 'candidate preserved at distill.'),
      E('c-4', 's-distill', 'produced-by', 'candidate preserved at distill.'),
      E('c-5', 's-distill', 'produced-by', 'candidate preserved at distill.'),
      E('d-1', 'c-1', 'decided-by', 'decision made from the frontier.'),
      E('d-2', 'c-2', 'decided-by', 'decision made from the frontier.'),
      E('d-3', 'c-3', 'decided-by', 'decision made from the frontier.'),
      E('d-4', 'c-4', 'decided-by', 'decision made from the frontier.'),
      E('f-1', 'd-1', 'evidenced-by', 'failure evidenced by a decision.'),
      E('f-2', 'd-2', 'evidenced-by', 'failure evidenced by a decision.')
    ]));

  // --- v3 (current): adds lineage edges + 3 distill-frontier event nodes + 1 receipt; removes f-2 ---
  function copyNodes(list) {
    return list.map(function (n) { return N(n.id, n.role, n.label, n.evidence.replace(/^demo — /, '')); });
  }

  var LINEAGE_V3 = [
    N('ln-1', 'lineage', 'lineage_id event', 'distill-frontier contract event: lineage_id (<rid>:<candidate-id>) recorded on each surviving candidate.'),
    N('ln-2', 'lineage', 'recordFate event', 'distill-frontier contract event: recordFate() logs downstream fate (preserved/considered/exercised/failed/contributed/ended).'),
    N('ln-3', 'lineage', 'frozen-rule event', 'distill-frontier contract event: frozen rule — reward preserved diversity only when it changes what the system learns, decides, avoids, or builds.')
  ];

  var v3Nodes = copyNodes(STAGES_V2)
    .concat(copyNodes(OBLIGATIONS_V2), copyNodes(REFERENCES_V2), copyNodes(RECEIPTS_V2),
      copyNodes(CANDIDATES_V2), copyNodes(DECISIONS_V2),
      copyNodes(FAILURES_V2.filter(function (f) { return f.id !== 'f-2'; })), // f-2 removed in v3
      LINEAGE_V3,
      [N('rc-dev01', 'receipt', 'Receipt 9a8f1b8152224f96', 'sealed receipt 9a8f1b8152224f96 (DEV-01 REV6).')]);

  var v3Edges = v2.edges
    .filter(function (e) { return e.from !== 'f-2' && e.to !== 'f-2'; })
    .map(function (e) { return E(e.from, e.to, e.role, e.label.replace(/^demo — /, '')); })
    .concat([
      E('ln-1', 'c-1', 'evidenced-by', 'lineage event attached to a surviving candidate.'),
      E('ln-1', 'c-2', 'evidenced-by', 'lineage event attached to a surviving candidate.'),
      E('ln-2', 'd-1', 'evidenced-by', 'fate record attached to a decision.'),
      E('ln-2', 'd-3', 'evidenced-by', 'fate record attached to a decision.'),
      E('ln-3', 's-distill', 'evidenced-by', 'frozen rule attached at distill.'),
      E('ln-3', 's-decide', 'supersedes', 'frozen rule supersedes unmeasured preservation at decide.'),
      E('rc-dev01', 's-build', 'produced-by', 'receipt produced at build.')
    ]);

  var v3 = snapshot('v3', {
    version: 'v3', title: 'Distill frontier (current)', current: true,
    note: 'demo snapshot — the current record. Not the Funnel\u2019s actual history.'
  }, v3Nodes, v3Edges);

  var DEMO = { v1: v1, v2: v2, v3: v3 };

  var EvolutionRecord = {
    snapshot: snapshot,
    diffSnapshots: diffSnapshots,
    lineage: lineage,
    selfCheck: selfCheck,
    DEMO: DEMO,
    NODE_ROLES: NODE_ROLES,
    EDGE_ROLES: EDGE_ROLES
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EvolutionRecord;
  }
  if (typeof window !== 'undefined') {
    window.EvolutionRecord = EvolutionRecord;
  }
})();
