// Alien Planet Studio — Seed Console adapter (from alien-planet.html block 2).
// Reads studio state through window.__alienHooks (set by app.js).
// Logic is behavior-identical to the original; only the module boundary changed.
const H = window.__alienHooks;
if (!H) throw new Error('[alien-planet] studio hooks missing — app.js must load first');
  var HEX = '0123456789ABCDEF';
  function cryptoHex(n) {
    var out = '', i;
    try {
      var b = new Uint8Array(n);
      (window.crypto || window.msCrypto).getRandomValues(b);
      for (i = 0; i < n; i++) out += HEX[(b[i] >> 4) & 15] + HEX[b[i] & 15];
      return out;
    } catch (e) {
      for (i = 0; i < n; i++) out += HEX[Math.floor(Math.random() * 16)];
      return out;
    }
  }
  // Geometry params rebuild the whole forest — debounce so slider drags don't thrash.
  var regenT = null;
  function scheduleRegen() {
    if (H.recording) return;
    clearTimeout(regenT);
    regenT = setTimeout(function () { H.regenerate(false).catch(function () {}); }, 700);
  }
  function setParam(key, v, min, max, geom) {
    v = Math.min(max, Math.max(min, +v));
    if (!isFinite(v)) return;
    H.cfg[key] = v;
    var e = document.getElementById(key);
    if (e && 'value' in e) e.value = v;
    try { H.outputs(); } catch (err) {}
    try { H.save(); } catch (err) {}
    if (geom) scheduleRegen();
  }
  function param(key, label, min, max, step, geom) {
    return {
      key: key, label: label, min: min, max: max, step: step,
      get: function () { return H.cfg[key]; },
      set: function (v) { setParam(key, v, min, max, geom); }
    };
  }
  window.SeedConsoleAdapter = {
    studio: 'alien-planet',
    title: 'Alien Planet',
    getSeed: function () { return H.cfg.seed; },
    // Full rebuild through the studio's single generation path.
    setSeed: function (s) {
      if (H.recording) return Promise.reject(new Error('H.recording'));
      return H.regenerate(false, s);
    },
    // Same 'XENO-…' style the studio itself uses (XENO- + 6 hex), from crypto randomness.
    randomSeed: function () { return 'XENO-' + cryptoHex(3); },
    // Sibling seed: keep the realm prefix (e.g. XENORA), vary the detail tail.
    remixSeed: function (s) {
      s = String(s == null ? '' : s).trim();
      var prefix = 'XENO', tailLen = 6, i = s.lastIndexOf('-');
      if (i > 0 && i < s.length - 1) {
        prefix = s.slice(0, i).toUpperCase() || 'XENO';
        tailLen = Math.max(3, Math.min(12, s.length - i - 1));
      }
      return prefix + '-' + cryptoHex(Math.ceil(tailLen / 2)).slice(0, tailLen);
    },
    params: [
      param('density', 'Colony density', 0.5, 1.5, 0.1, true),
      param('undergrowth', 'Undergrowth', 0.4, 1.6, 0.1, true),
      param('wetness', 'Wet sheen', 0, 1, 0.01, false),
      param('wind', 'Wind', 0, 1, 0.01, false),
      param('mist', 'Mist', 0, 1, 0.01, false),
      param('life', 'Wildlife activity', 0, 1, 0.01, false),
      param('exposure', 'Exposure', 0.4, 2, 0.01, false),
      param('distance', 'Forest reach', 90, 260, 10, true)
    ],
    canvas: function () { return document.getElementById('scene'); },
    fileBase: function (seedStr) {
      var s = seedStr == null ? H.cfg.seed : seedStr;
      return 'xenora-' + String(s).replace(/[^a-z0-9_-]/gi, '-').slice(0, 40);
    }
  };
  // The console drives the initial seed: honor ?seed=, else a fresh random seed
  // on every load. Wait for the engine to finish booting first.
  (function waitForEngine() {
    if (window.__xenoraEngineReady && window.SeedConsole) {
      try { SeedConsole.init(window.SeedConsoleAdapter); }
      catch (e) { console.error('[SeedConsole] adapter init failed', e); }
    } else {
      setTimeout(waitForEngine, 50);
    }
  })();
