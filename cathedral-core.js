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
  var VERSION = '1.2.0';

  // Sealed DEV-01 geometry, feet. 1 unit = 1 ft.
  var ROOM = { W: 320, D: 180, H: 90, CEILING: 84 };

  // Command-node monitor geometry (owner-ordered 2026-10-07: no intersections, modern design):
  // 6x 32" 16:9 slim-bezel floating panels, 140° arc at r = 84 in (7 ft) — chord 3.39ft > 2.32ft screen width.
  var MONITOR = { count: 6, arcDeg: 140, radiusIn: 84, diagIn: 32, ratioW: 16, ratioH: 9 };
  // Ceiling fixtures: barn-door theatricals on 18-in mount arms under the 84 ft plane.
  var FIXTURE = { armIn: 18, rows: [-2, -1, 0, 1, 2], cols: [-3, -2, -1, 0, 1, 2, 3], spacingFt: 40 };

  function rad(d) { return d * Math.PI / 180; }

  // 6 monitor transforms on a 140° arc at r=84in. Chord between neighbors (3.39ft)
  // exceeds screen width (2.32ft): zero intersections, verified by scripted Box3 test.
  // Positions are relative to the arc center (the chair), feet; +z toward the chair.
  function monitorArc() {
    var out = [];
    var step = MONITOR.arcDeg / (MONITOR.count - 1); // 28°
    var r = MONITOR.radiusIn / 12;
    var wIn = MONITOR.diagIn * MONITOR.ratioW / Math.sqrt(MONITOR.ratioW * MONITOR.ratioW + MONITOR.ratioH * MONITOR.ratioH);
    var hIn = MONITOR.diagIn * MONITOR.ratioH / Math.sqrt(MONITOR.ratioW * MONITOR.ratioW + MONITOR.ratioH * MONITOR.ratioH);
    for (var i = 0; i < MONITOR.count; i++) {
      var aDeg = (i - (MONITOR.count - 1) / 2) * step; // -70 .. +70
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

  // Glass display band: a glass ribbon wrapping all four interior walls —
  // a BAND, not full-wall coverage. Pure geometry; the page skins it.
  var GLASS_BAND = { yFt: 14, heightFt: 6, insetFt: 1.5, thicknessFt: 0.25 };
  function glassBand() {
    var hw = ROOM.W / 2 - GLASS_BAND.insetFt, hd = ROOM.D / 2 - GLASS_BAND.insetFt;
    return [
      { id: 'north', wFt: ROOM.W - GLASS_BAND.insetFt * 2, xFt: 0,   yFt: GLASS_BAND.yFt, zFt: -hd, ryDeg: 0 },
      { id: 'south', wFt: ROOM.W - GLASS_BAND.insetFt * 2, xFt: 0,   yFt: GLASS_BAND.yFt, zFt:  hd, ryDeg: 180 },
      { id: 'west',  wFt: ROOM.D - GLASS_BAND.insetFt * 2, xFt: -hw, yFt: GLASS_BAND.yFt, zFt: 0,   ryDeg: 90 },
      { id: 'east',  wFt: ROOM.D - GLASS_BAND.insetFt * 2, xFt:  hw, yFt: GLASS_BAND.yFt, zFt: 0,   ryDeg: -90 }
    ];
  }

  // Lighting presets (ported from DEV-01, adapted to the cathedral rig).
  // amb/hemi/fill/spot = intensities; *Color = hex; disc = emissive disc intensity.
  var LIGHT_PRESETS = {
    ambient:   { label: 'AMBIENT 3200K',   amb: 1.2, hemi: 0.8, spot: 800,  spotColor: 0xffc98a, disc: 0.8, discColor: 0xffc98a, shaft: 0x8a94a8, fill: 0.4 },
    work:      { label: 'WORK 4000K',      amb: 2.6, hemi: 1.8, spot: 2600, spotColor: 0xfff2df, disc: 2.0, discColor: 0xfff2df, shaft: 0xdfe8f2, fill: 1.0 },
    cinematic: { label: 'CINEMATIC 2800K', amb: 1.6, hemi: 1.1, spot: 2000, spotColor: 0xffb46b, disc: 1.6, discColor: 0xffd9a0, shaft: 0xcfd6e2, fill: 0.6 },
    pulse:     { label: 'PULSE 4500K',     amb: 2.0, hemi: 1.5, spot: 2200, spotColor: 0x9fc4ff, disc: 2.2, discColor: 0x7aa8ff, shaft: 0x9fc4ff, fill: 0.9 }
  };
  var LIGHT_ORDER = ['ambient', 'work', 'cinematic', 'pulse'];

  // Robot arm joint presets (radians). sx/sz = shoulder, ex = elbow, wx = wrist, grip 0..1.
  var ARM_PRESETS = {
    rest:    { label: 'REST',    j: { sx: -0.35, sz: 0,    ex: -2.25, wx: 0.55,  grip: 0.15 } },
    reach:   { label: 'REACH',   j: { sx: -1.25, sz: 0,    ex: -0.25, wx: 0.35,  grip: 0.50 } },
    present: { label: 'PRESENT', j: { sx: -2.55, sz: 0.35, ex: -0.45, wx: -0.35, grip: 1.00 } },
    work:    { label: 'WORK',    j: { sx: -1.55, sz: -0.20, ex: -1.15, wx: 0.85,  grip: 0.35 } }
  };
  var ARM_ORDER = ['rest', 'reach', 'present', 'work'];

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
      },
      {
        receipt: '12a6b8f95feeabca',
        what: 'cathedral lighting fix seal — "ok its too dark i cant see", legibility pass',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/cathedral-lighting-v1.md'
      },
      {
        receipt: '37f42c698b1f3ff4',
        what: 'cathedral camera containment seal — walls are the only hard limit',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/cathedral-containment-v1.md'
      },
      {
        receipt: 'b69e27120b8ffda0',
        what: 'cathedral minecraft movement seal — creative-mode free camera',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/cathedral-movement-v1.md'
      },
      {
        receipt: 'c900429153e364ef',
        what: 'cathedral monitor fix seal — no intersections, modern redesign',
        verdict: 'verifyReceipt:true',
        verdictPath: '~/workspace/funnel/verdicts/cathedral-monitors-v1.md'
      }
    ];
  }

  // Inertness proof: the core must not touch DOM or network.
  function _purityViolations() {
    var bad = [];
    var fns = { ROOM: function () { return ROOM; }, monitorArc: monitorArc, fixtureRows: fixtureRows, glassBand: glassBand, label: label, adaptManifest: adaptManifest, adaptCommits: adaptCommits, receipts: receipts, selfCheck: selfCheck };
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

    // --- monitors: 6 in a 140° arc at r=84in, 32" 16:9, non-intersecting ---
    var m = monitorArc();
    ck('monitor-count-6', m.length === 6);
    var span = m[m.length - 1].angleDeg - m[0].angleDeg;
    ck('monitor-arc-140', Math.abs(span - 140) < 1e-9, 'span=' + span);
    ck('monitor-radius-84in', m.every(function (x) { return x.radiusIn === 84; }));
    var diag = Math.sqrt(m[0].screenWIn * m[0].screenWIn + m[0].screenHIn * m[0].screenHIn);
    var ratio = m[0].screenWIn / m[0].screenHIn;
    ck('monitor-screen-32in-16x9',
      Math.abs(diag - 32) < 0.05 && Math.abs(ratio - 16 / 9) < 0.01,
      'diag=' + diag.toFixed(3) + ' ratio=' + ratio.toFixed(4));
    // no-intersection: chord between neighbors must exceed screen width + margin
    var chord = 2 * (m[0].radiusIn / 12) * Math.sin((Math.PI / 180) * (m[1].angleDeg - m[0].angleDeg) / 2);
    ck('monitor-no-intersect', chord > m[0].screenWft + 0.5, 'chord=' + chord.toFixed(2) + 'ft');

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
    ck('receipts-9-labeled', r.length === 9 &&
      r.every(function (x) { return /^[0-9a-f]{12,16}$/.test(x.receipt) && x.what && x.verdictPath; }),
      r.map(function (x) { return x.receipt; }).join(','));

    // --- label contract ---
    var l1 = label(null, 'src-a'), l2 = label(42, 'src-b');
    ck('label-honest', l1.unavailable === true && l1.source === 'src-a' &&
      l2.value === 42 && l2.source === 'src-b' && l2.unavailable === undefined);

    // --- naming verbatim ---
    ck('naming-verbatim', NAME === 'abandoned cathedral', NAME);

    // --- glass band: 4 segments wrapping the room, band not full wall ---
    var gb = glassBand();
    ck('glassband-4', gb.length === 4);
    ck('glassband-not-fullwall', gb.every(function (s) { return s.yFt - GLASS_BAND.heightFt / 2 > 0 && s.yFt + GLASS_BAND.heightFt / 2 < ROOM.H; }),
      'band y=' + GLASS_BAND.yFt + '±' + (GLASS_BAND.heightFt / 2));
    ck('glassband-in-room', gb.every(function (s) { return Math.abs(s.xFt) <= ROOM.W / 2 && Math.abs(s.zFt) <= ROOM.D / 2; }));

    // --- presets: 4 light, 4 arm, all labeled ---
    ck('light-presets-4', LIGHT_ORDER.length === 4 && LIGHT_ORDER.every(function (k) { return !!LIGHT_PRESETS[k].label; }));
    ck('arm-presets-4', ARM_ORDER.length === 4 && ARM_ORDER.every(function (k) { return !!ARM_PRESETS[k].label && !!ARM_PRESETS[k].j; }));

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
    glassBand: glassBand,
    GLASS_BAND: GLASS_BAND,
    LIGHT_PRESETS: LIGHT_PRESETS,
    LIGHT_ORDER: LIGHT_ORDER,
    ARM_PRESETS: ARM_PRESETS,
    ARM_ORDER: ARM_ORDER,
    adaptManifest: adaptManifest,
    adaptCommits: adaptCommits,
    receipts: receipts,
    label: label,
    selfCheck: selfCheck
  };

  global.Cathedral = Cathedral;
  if (typeof module !== 'undefined' && module.exports) module.exports = Cathedral;
})(typeof window !== 'undefined' ? window : global);
