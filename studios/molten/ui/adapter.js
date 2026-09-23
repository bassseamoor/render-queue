// Molten Studio — SeedConsole adapter (verbatim from molten.html; reads window.__moltenHooks).

'use strict';
/* Seed Console adapter for the Molten studio. The console is the only UI that
 * mutates generation state: seed, hero parameters, favorites, and recording.
 * setSeed() fully rebuilds the scene (new blob choreography from the seed,
 * motion restarted) while leaving the seamless loop guarantee intact - the
 * loop closes on integer motion harmonics, which hold for every seed. */
(function () {
  var H = window.__moltenHooks;
  if (!H) { console.error('[molten] SeedConsole adapter: studio hooks missing'); return; }
  var SEED_MIN = 1, SEED_MAX = 999999;
  function cryptoUint() {
    var a = new Uint32Array(1);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(a);
    else a[0] = Math.floor(Math.random() * 4294967296);
    return a[0];
  }
  function randomSeed() { return String(SEED_MIN + (cryptoUint() % (SEED_MAX - SEED_MIN + 1))); }
  /* Sibling seed: a small random hop from the current seed, so the new world
   * is a variant of this one (same look/palette family, new blob details).
   * Locked hero params are re-applied by the console after regeneration. */
  function remixSeed(s) {
    var cur = parseInt(String(s).trim(), 10);
    if (!isFinite(cur)) cur = SEED_MIN;
    var off = 1 + (cryptoUint() % 5000);
    var dir = (cryptoUint() % 2) ? 1 : -1;
    var n = (((cur - 1 + dir * off) % SEED_MAX) + SEED_MAX) % SEED_MAX + 1;
    return String(n);
  }
  function param(key, label, min, max, step, custom) {
    return {
      key: key, label: label, min: min, max: max, step: step,
      get: function () { return H.getState()[key]; },
      set: function (v) { H.update(key, v, custom !== false); }
    };
  }
  var viewParam = param('view', 'Framing \u00b7 Sculpture / Liquid / Macro', 0, 2, 1, false);
  var setView = viewParam.set;
  viewParam.set = function (v) { setView(v); H.resetCamera(); };
  window.SeedConsoleAdapter = {
    studio: 'molten',
    title: 'Molten',
    getSeed: function () { return String(H.getState().seed); },
    setSeed: function (s) {
      var n = parseInt(String(s).trim(), 10);
      if (!isFinite(n)) n = SEED_MIN;
      n = Math.max(SEED_MIN, Math.min(SEED_MAX, Math.round(n)));
      H.setSeed(n);
    },
    randomSeed: randomSeed,
    remixSeed: remixSeed,
    params: [
      param('count', 'Wax bodies', 4, 24, 1),
      param('size', 'Blob size', 0.5, 1.65, 0.01),
      param('speed', 'Flow speed', 0.15, 3, 0.01),
      param('glow', 'Luminous glow', 0, 3, 0.01),
      param('merge', 'Fusion', 0.06, 0.65, 0.01),
      param('heat', 'Thermal lift', 0, 1, 0.01),
      param('marble', 'Color marbling', 0, 1, 0.01),
      param('warp', 'Surface turbulence', 0, 1.5, 0.01),
      param('exposure', 'Brightness', 0.35, 2.8, 0.01),
      viewParam
    ],
    canvas: function () { return H.canvas(); },
    fileBase: function (seedStr) { return 'molten-' + String(seedStr).replace(/[^\w\-]+/g, '_'); }
  };
  SeedConsole.init(window.SeedConsoleAdapter);
})();
