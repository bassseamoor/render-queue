// Canal Metropolis — SeedConsole adapter (from canal-metropolis.html;
// modularized: studio state comes from window.__canalHooks, exposed by ../app.js).

/* ============ Seed Console adapter: Canal Metropolis ============ */
(function () {
  'use strict';
  var H = window.__canalHooks; // exposed by ../app.js (modularized; was shared script scope)
  if (!H) { console.error('[canal-metropolis] SeedConsole adapter: studio hooks missing'); return; }
  var initialRandomPending = !(new URLSearchParams(location.search).get('seed') || '').trim();
  // Mirror of the native Random button: new layout/detail/params, keep realm + lens.
  function randomConfig() {
    var r = H.rng(H.fresh()), params = Object.assign({}, H.defaults), i, c, layout;
    for (i = 0; i < H.controls.length; i++) {
      c = H.controls[i];
      params[c[0]] = c[0] === 'grain' ? 0.35 + r() * 0.4
        : c[0] === 'palette' ? (r() - 0.5) * 1.2
        : H.mix(c[2], c[3], 0.25 + r() * 0.5);
    }
    layout = H.fresh();
    if (H.config.realm === 1) {
      var attempt = 0;
      while (attempt < 64 && H.cityFamily(layout) === H.cityFamily(H.config.layout)) { layout = H.fresh(); attempt++; }
      while (H.cityFamily(layout) === H.cityFamily(H.config.layout)) layout = (layout + 1) >>> 0;
    }
    return { realm: H.config.realm, layout: layout, detail: H.fresh(), params: params, lens: H.config.lens, locks: Object.assign({}, H.config.locks) };
  }
  // Mirror of the native Remix button: keep architecture, jitter unlocked params.
  function remixConfig(base) {
    var r = H.rng(H.fresh()), params = Object.assign({}, base.params), i, c;
    for (i = 0; i < H.controls.length; i++) {
      c = H.controls[i];
      if (!base.locks[c[0]])
        params[c[0]] = H.clamp(params[c[0]] + (r() - 0.5) * (c[3] - c[2]) * 0.28, c[2], c[3]);
    }
    return { realm: base.realm, layout: base.layout, detail: H.fresh(), params: params, lens: base.lens, locks: Object.assign({}, base.locks) };
  }
  function liveParam(c) {
    return {
      key: c[0], label: c[1], min: c[2], max: c[3], step: 0.01,
      get: function () { return H.config.params[c[0]]; },
      set: function (v) {
        H.config.params[c[0]] = v; H.smoothed[c[0]] = v;
        if (c[0] === 'focus' && typeof H.syncLensUI === 'function') H.syncLensUI();
        if (H.current) H.current.config.params[c[0]] = v;
        if (H.previous) { H.disposeWorld(H.previous); H.previous = null; }
      }
    };
  }
  window.SeedConsoleAdapter = {
    studio: 'canal-metropolis',
    title: 'Canal Metropolis',
    getSeed: function () { return H.codeOf(H.config); },
    setSeed: function (s) {
      var text = String(s).trim();
      var parsed = H.parseCode(text);
      if (parsed && H.codeOf(parsed) === H.codeOf(H.config)) return;
      H.changeWorld(parsed || { realm: H.config.realm, layout: H.hash(text), detail: H.hash(text + ':details'),
        params: Object.assign({}, H.defaults), lens: H.config.lens, locks: Object.assign({}, H.config.locks) });
    },
    randomSeed: function () { if (initialRandomPending) { initialRandomPending = false; return H.codeOf(H.config); } return H.codeOf(randomConfig()); },
    remixSeed: function (s) {
      var base = H.parseCode(String(s).trim()) || H.config;
      return H.codeOf(remixConfig(base));
    },
    params: H.controls.map(liveParam),
    canvas: function () { return H.canvas(); },
    fileBase: function (seedStr) { return 'canal-metropolis-' + String(seedStr).replace(/[^\w\-]+/g, '_'); }
  };
  SeedConsole.init(window.SeedConsoleAdapter);
})();
