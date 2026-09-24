// Aquarium Studio — Seed Console adapter (from aquarium.html block 3).
// Reads studio state through window.__aquariumHooks (set by app.js).
// Logic is behavior-identical to the original; only the module boundary changed.
const H = window.__aquariumHooks;
if (!H) throw new Error('[aquarium] studio hooks missing — app.js must load first');
/* Aquarium Studio adapter for the Seed Console (seed-console.js, inlined above).
 * Seed format: "#XXXXXXXX" (uint32 hex), matching the studio's old seed readout.
 * setSeed() fully rebuilds the scene via H.generateScene(); the very first call
 * (page load) builds synchronously so there is exactly one generation path.
 */
var BIOMES = ["tropical", "deep", "jelly", "zen"];
var DENS = ["low", "med", "high"];
var CLARITIES = ["crystal", "natural", "murky"];
var LIGHTNAMES = ["day", "golden", "blue", "moon"];
var CAMS = ["drift", "explore", "locked", "orbit"];

function parseSeed(s) {
  s = String(s == null ? "" : s).trim();
  if (s.charAt(0) === "#") s = s.slice(1);
  if (/^[0-9a-fA-F]{1,8}$/.test(s)) return parseInt(s, 16) >>> 0;
  if (/^\d{1,10}$/.test(s)) return parseInt(s, 10) >>> 0;
  var h = 0x811c9dc5; /* xfnv1a fallback so arbitrary strings still seed */
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
function cryptoUint32() {
  try {
    var a = new Uint32Array(1);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return a[0] >>> 0;
  } catch (e) { return (Math.random() * 0x100000000) >>> 0; }
}

/* geometry-rebuilding params are debounced so slider drags coalesce into one build */
var regenTimer = 0;
function queueRegen() {
  clearTimeout(regenTimer);
  regenTimer = setTimeout(function () { H.regenerate(false); }, 250);
}
function enumParam(key, list, rebuild, label) {
  return {
    key: key,
    label: label + " (" + list.join("/") + ")",
    min: 0, max: list.length - 1, step: 1,
    get: function () { var i = list.indexOf(H.settings[key]); return i < 0 ? 0 : i; },
    set: function (v) {
      var i = Math.max(0, Math.min(list.length - 1, Math.round(v)));
      if (H.settings[key] === list[i]) return;
      H.settings[key] = list[i];
      H.saveSettings();
      if (rebuild) queueRegen();
    }
  };
}
function numParam(key, label, min, max) {
  return {
    key: key, label: label, min: min, max: max, step: 1,
    get: function () { return H.settings[key] || 0; },
    set: function (v) {
      v = Math.max(min, Math.min(max, Math.round(v)));
      if (H.settings[key] === v) return;
      H.settings[key] = v; /* live: the per-frame palette cache picks this up, no rebuild */
      H.saveSettings();
    }
  };
}

var booted = false;
window.SeedConsoleAdapter = {
  studio: "aquarium",
  title: "Aquarium Studio",
  getSeed: function () { return H.seedText(); },
  setSeed: function (s) {
    H.settings.seed = parseSeed(s);
    if (!booted) {
      /* first call = page load: build synchronously, exactly one generation */
      booted = true;
      H.generateScene(H.settings);
      H.refreshSeedUI();
      H.saveSettings();
      return;
    }
    return H.regenerateAsync(false);
  },
  randomSeed: function () {
    return "#" + cryptoUint32().toString(16).toUpperCase().padStart(8, "0");
  },
  remixSeed: function (s) {
    /* sibling seed: avalanche the bits and mix fresh entropy. The biome is a
       separate setting and is left untouched — same family, new details. */
    var n = parseSeed(s) >>> 0;
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
    n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35) >>> 0;
    n = (n ^ cryptoUint32()) >>> 0;
    return "#" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
  },
  params: [
    enumParam("biome", BIOMES, true, "Biome"),
    enumParam("fish", DENS, true, "Fish"),
    enumParam("plants", DENS, true, "Plants"),
    enumParam("corals", DENS, true, "Corals"),
    enumParam("clarity", CLARITIES, true, "Clarity"),
    enumParam("light", LIGHTNAMES, false, "Light"),
    numParam("bright", "Brightness", -50, 50),
    numParam("warm", "Warmth", -50, 50),
    numParam("sunH", "Sun height", -50, 50),
    enumParam("camera", CAMS, false, "Camera")
  ],
  canvas: function () { return document.getElementById("scene"); },
  fileBase: function (seedStr) { return "aquarium-studio-" + String(seedStr).replace(/^#/, "").toLowerCase(); }
};
try {
  SeedConsole.init(window.SeedConsoleAdapter);
} catch (e) {
  console.error("[aquarium] SeedConsole init failed — falling back to a direct build", e);
  H.generateScene(H.settings);
}
