/* abandoned cathedral — inert core v1.
 *
 * Pure functions. Zero DOM. Zero network. Zero dependencies.
 * Geometry constants are the sealed DEV-01 values (feet).
 *
 * TAGS: tool:cathedral | cat:interface | kind:interactive |
 *       dep:webgl dep:canvas2d dep:network |
 *       prov:dev-environment-3d | see:evolutionrecord dev01 |
 *       src:funnel/blueprints/abandoned-cathedral-blueprint-v1.md
 */
(function (global) {
  'use strict';

  var NAME = 'abandoned cathedral';
  var VERSION = '1.0.0';

  // Sealed DEV-01 geometry, feet. 1 unit = 1 ft.
  var ROOM = { W: 320, D: 180, H: 90, CEILING: 84 };

  // Command-node monitor geometry: 48" 16:9 screens, 110° arc at r = 42 in.
  var MONITOR = { count: 6, arcDeg: 110, radiusIn: 42, diagIn: 48, ratioW: 16, ratioH: 9 };
  // Ceiling fixtures: barn-door theatricals on 18-in mount arms under the 84 ft plane.
  var FIXTURE = { armIn: 18, rows: [-2, -1, 0, 1, 2], cols: [-3, -2, -1, 0, 1, 2, 3], spacingFt: 40 };

  function rad(d) { return d * Math.PI / 180; }

  // 6 monitor transforms on a 110° arc at r=42in.
  // Positions are relative to the arc center (the chair), feet; +z toward the chair.
  function monitorArc() {
    var out = [];
    var step = MONITOR.arcDeg / (MONITOR.count - 1); // 22°
    var r = MONITOR.radiusIn / 12;
    var wIn = MONITOR.diagIn * MONITOR.ratioW / Math.sqrt(MONITOR.ratioW * MONITOR.ratioW + MONITOR.ratioH * MONITOR.ratioH);
    var hIn = MONITOR.diagIn * MONITOR.ratioH / Math.sqrt(MONITOR.ratioW * MONITOR.ratioW + MONITOR.ratioH * MONITOR.ratioH);
    for (var i = 0; i < MONITOR.count; i++) {
      var aDeg = (i - (MONITOR.count - 1) / 2) * step; // -55 .. +55
      var a = rad(aDeg);
      out.push({
        index: i,
        angleDeg: aDeg,
        xFt: Math.sin(a) * r,
        zFt: -Math.cos(a) * r,
        yawDeg: -aDeg, // screen faces the arc center
        radiusIn: MONITOR.radiusIn,
        screenWIn: wIn,
        screenHIn: hIn,
        screenWft: wIn / 12,
        screenHft: hIn / 12
      });
    }
    return out;
  }

  // Ceiling fixture layout: 5 rows × 7 cols barn-door theatricals, 18-in arms.
  function fixtureRows() {
    var out = [];
    var y = ROOM.CEILING - FIXTURE.armIn / 12;
    for (var ri = 0; ri < FIXTURE.rows.length; ri++) {
      for (var ci = 0; ci < FIXTURE.cols.length; ci++) {
        out.push({
          row: ri, col: ci,
          xFt: FIXTURE.cols[ci] * FIXTURE.spacingFt,
          yFt: y,
          zFt: FIXTURE.rows[ri] * FIXTURE.spacingFt,
          armIn: FIXTURE.armIn
        });
      }
    }
    return out;
  }

  // Every datum carries {value, source}. Missing → {unavailable:true, source}.
  function label(value, source) {
    if (value === null || value === undefined) return { unavailable: true, source: source };
    return { value: value, source: source };
  }

  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }

  // pulse-manifest.json → tool inventory summary.
  // live = the entry references a real source (panel_source/page/component).
  // dead = it does not. No source info invented.
  function adaptManifest(json) {
    if (!json || (typeof json !== 'object')) return { unavailable: true, source: 'pulse-manifest.json' };
    var items = isArr(json) ? json : json.tools;
    if (!isArr(items)) return { unavailable: true, source: 'pulse-manifest.json' };
    var live = 0, dead = 0;
    for (var i = 0; i < items.length; i++) {
      var t = items[i] || {};
      if (t.panel_source || t.page || t.component || t.panel_source_url) live++; else dead++;
    }
    return { toolCount: items.length, liveCount: live, deadCount: dead, source: 'pulse-manifest.json' };
  }

  // GitHub commits API array → count + last change. Honest unavailable path.
  function adaptCommits(json) {
    if (!isArr(json) || json.length === 0) return { unavailable: true, source: 'github-commits-api' };
    var first = json[0] || {};
    var c = first.commit || {};
    var committer = c.committer || {}, author = c.author || {};
    var date = committer.date || author.date || null;
    return { count: json.length, lastChange: date, source: 'github-commits-api' };
  }

  // Bundled REAL funnel receipts — the same strings as the sealed verdicts.
  function receipts() {
    return [
      {
        receipt: 'f060d939a1309d13',
        what: 'abandoned-cathedral intake seal — "abandoned cathedral is my fucking dev environment built it now i need it"',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/abandoned-cathedral-v1.md'
      },
      {
        receipt: 'bb599942637ca427',
        what: 'abandoned-cathedral build seal — blueprint v1 authorized for build',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/abandoned-cathedral-v1.md'
      },
      {
        receipt: '9a8f1b8152224f96',
        what: 'DEV-01 REV 6 seal — ceiling deep-dive (visible plane 84ft, barn-door fixtures, 18in arms)',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/dev01-rev6-v1.md'
      },
      {
        receipt: '2e44784661158cd5',
        what: 'funnel fabric runtime seal — assembly fabric that carries sealed runs',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/funnel-fabric-runtime-v1.md'
      },
      {
        receipt: 'fc5f0e9eb62a',
        what: 'evergreen context seal — standing owner context bundle',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/evergreen-context-v1.md'
      }
    ];
  }

  // Inertness proof: the core must not touch DOM or network.
  function _purityViolations() {
    var bad = [];
    var fns = { ROOM: function () { return ROOM; }, monitorArc: monitorArc, fixtureRows: fixtureRows, label: label, adaptManifest: adaptManifest, adaptCommits: adaptCommits, receipts: receipts, selfCheck: selfCheck };
    Object.keys(fns).forEach(function (k) {
      var src = '';
      try { src = String(fns[k]); } catch (e) { bad.push(k + ':uninspectable'); return; }
      if (/(^|[^A-Za-z_$])(document|window|fetch|XMLHttpRequest|localStorage)([^A-Za-z_$]|$)/.test(src)) {
        bad.push(k + ':dom-or-network-reference');
      }
    });
    return bad;
  }

  function selfCheck() {
    var checks = [];
    function ck(name, pass, detail) { checks.push({ name: name, pass: !!pass, detail: detail || '' }); }

    // --- geometry: sealed values ---
    ck('room-w-320', ROOM.W === 320);
    ck('room-d-180', ROOM.D === 180);
    ck('room-h-90', ROOM.H === 90);
    ck('room-ceiling-84', ROOM.CEILING === 84);

    // --- monitors: 6 in a 110° arc at r=42in, 48" 16:9 ---
    var m = monitorArc();
    ck('monitor-count-6', m.length === 6);
    var span = m[m.length - 1].angleDeg - m[0].angleDeg;
    ck('monitor-arc-110', Math.abs(span - 110) < 1e-9, 'span=' + span);
    ck('monitor-radius-42in', m.every(function (x) { return x.radiusIn === 42; }));
    var diag = Math.sqrt(m[0].screenWIn * m[0].screenWIn + m[0].screenHIn * m[0].screenHIn);
    var ratio = m[0].screenWIn / m[0].screenHIn;
    ck('monitor-screen-48in-16x9',
      Math.abs(diag - 48) < 0.05 && Math.abs(ratio - 16 / 9) < 0.01,
      'diag=' + diag.toFixed(3) + ' ratio=' + ratio.toFixed(4));

    // --- fixtures: 5×7 barn-door rows, 18in arms ---
    var f = fixtureRows();
    ck('fixture-rows-5x7', f.length === 35);
    ck('fixture-arm-18in', f.every(function (x) { return x.armIn === 18; }));
    ck('fixture-y-82.5', f.every(function (x) { return Math.abs(x.yFt - 82.5) < 1e-9; }), 'y=84-1.5');
    ck('fixture-in-room', f.every(function (x) { return Math.abs(x.xFt) <= ROOM.W / 2 && Math.abs(x.zFt) <= ROOM.D / 2; }));

    // --- adapter honesty ---
    var um = adaptManifest(null);
    ck('adapt-manifest-honest', um.unavailable === true && um.source === 'pulse-manifest.json');
    var uc = adaptCommits(null);
    ck('adapt-commits-honest', uc.unavailable === true && uc.source === 'github-commits-api');
    var ok = adaptManifest({ tools: [{ panel_source: 'a' }, { label: 'b' }] });
    ck('adapt-manifest-counts', ok.toolCount === 2 && ok.liveCount === 1 && ok.deadCount === 1);
    ck('adapt-fields-sourced',
      typeof ok.source === 'string' && ok.source.length > 0 && typeof uc.source === 'string');

    // --- receipts: bundled, real, labeled ---
    var r = receipts();
    ck('receipts-5-labeled', r.length === 5 &&
      r.every(function (x) { return /^[0-9a-f]{12,16}$/.test(x.receipt) && x.what && x.verdictPath; }),
      r.map(function (x) { return x.receipt; }).join(','));

    // --- label contract ---
    var l1 = label(null, 'src-a'), l2 = label(42, 'src-b');
    ck('label-honest', l1.unavailable === true && l1.source === 'src-a' &&
      l2.value === 42 && l2.source === 'src-b' && l2.unavailable === undefined);

    // --- naming verbatim ---
    ck('naming-verbatim', NAME === 'abandoned cathedral', NAME);

    // --- purity: no DOM, no network in the core ---
    var pv = _purityViolations();
    ck('purity', pv.length === 0, pv.join(';') || 'no dom, no network references');

    var pass = checks.every(function (c) { return c.pass; });
    return { pass: pass, checks: checks };
  }

  var Cathedral = {
    NAME: NAME,
    VERSION: VERSION,
    ROOM: ROOM,
    monitorArc: monitorArc,
    fixtureRows: fixtureRows,
    adaptManifest: adaptManifest,
    adaptCommits: adaptCommits,
    receipts: receipts,
    label: label,
    selfCheck: selfCheck
  };

  global.Cathedral = Cathedral;
  if (typeof module !== 'undefined' && module.exports) module.exports = Cathedral;
})(typeof window !== 'undefined' ? window : global);
