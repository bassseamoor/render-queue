// Rainforest Studio — Seed Console adapter (from rainforest.html block 2).
// Reads studio state through window.__rainforestHooks (set by app.js).
// Logic is behavior-identical to the original; only the module boundary changed.
const H = window.__rainforestHooks;
if (!H) throw new Error('[rainforest] studio hooks missing — app.js must load first');
window.SeedConsoleAdapter = (function () {


  function normSeed(s) {
    return String(s == null ? '' : s).trim().slice(0, 64) || H.defaults.seed;
  }

  // Same regeneration path the old seed UI used (loader + async H.generateWorld).
  function growNow() {
    if (H.recording) return;
    if (!H.gl) { H.toast('Enable hardware acceleration and reload to grow the forest.'); return; }
    H.save();
    var l = H.$('loader');
    if (l) { l.style.display = 'grid'; l.style.opacity = '1'; }
    setTimeout(function () {
      try { H.generateWorld(); H.toast('Your new rainforest is growing.'); }
      catch (e) { H.fatal(e); }
    }, 35);
  }

  var HERO = [
    { key: 'density',     label: 'Forest density', rebuild: true  },
    { key: 'undergrowth', label: 'Undergrowth',    rebuild: true  },
    { key: 'mist',        label: 'Mist',           rebuild: false },
    { key: 'wetness',     label: 'Wet sheen',      rebuild: false },
    { key: 'wind',        label: 'Wind',           rebuild: false },
    { key: 'life',        label: 'Wildlife',       rebuild: false },
    { key: 'distance',    label: 'View distance',  rebuild: true  },
    { key: 'exposure',    label: 'Exposure',       rebuild: false }
  ];

  var params = HERO.map(function (h) {
    var e = H.$(h.key);
    var mn = (e && e.min !== '' && e.min != null) ? parseFloat(e.min) : 0;
    var mx = (e && e.max !== '' && e.max != null) ? parseFloat(e.max) : 1;
    var st = (e && e.step) ? parseFloat(e.step) : 0.01;
    return {
      key: h.key,
      label: h.label,
      min: mn,
      max: mx,
      step: st,
      get: function () { return H.cfg[h.key]; },
      set: function (v) {
        v = Math.min(mx, Math.max(mn, Number(v)));
        H.cfg[h.key] = v;
        var elc = H.$(h.key);
        if (elc) elc.value = v;
        H.outputs();
        H.save();
        if (h.rebuild) H.regenerate(false); // density/distance/undergrowth need a rebuild
      }
    };
  });

  return {
    studio: 'rainforest',
    title: 'Rainforest',
    getSeed: function () { return H.cfg.seed + H.lensSuffix(H.cfg.lens); },
    setSeed: function (s) {
      var _ls=H.parseLensSuffix(s);if(_ls){H.cfg.lens=H.cleanLens(_ls);s=String(s).replace(H.LENS_RE,'');if(window.syncLensUI)H.syncLensUI();}H.cfg.seed = normSeed(s);
      // The console inits before boot(); boot grows the world from H.cfg.seed.
      if (!H.engineReady) { H.save(); return; }
      growNow();
    },
    randomSeed: function () {
      var a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return 'VERDANT-' + ('000000' + a[0].toString(16).toUpperCase()).slice(-6);
    },
    remixSeed: function (s) {
      // Sibling seed: keep the grove family (prefix), roll new trailing digits.
      s = normSeed(String(s).replace(H.LENS_RE,''));var _lsl=H.lensSuffix(H.cfg.lens);
      var m = /^(.*?-)(\d+)H.$/.exec(s);
      if (m) {
        var w = m[2].length;
        var n = (parseInt(m[2], 10) + 1 +
                 Math.floor(Math.random() * (Math.pow(10, w) - 1))) % Math.pow(10, w);
        return m[1] + String(n).padStart(w, '0') + _lsl;
      }
      return s + '-' + Math.floor(Math.random() * 1000) + _lsl;
    },
    params: params,
    canvas: function () { return H.$('scene'); },
    fileBase: function (seed) {
      return 'rainforest-' +
        String(seed || '').toLowerCase()
          .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+H.$/g, '');
    }
  };
})();
SeedConsole.init(window.SeedConsoleAdapter);
