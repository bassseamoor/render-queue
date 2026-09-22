"use strict";
/* ============================================================
   FORGE core/rng.js — namespaced deterministic randomness
   ------------------------------------------------------------
   Every random stream is derived from (masterSeed, path).
   Changing the clouds never regenerates the mountain, because
   each subsystem draws from its own independent stream.

   Usage:
     const root = new RNG(scene.seed);            // scene root
     const layer = root.scope('L3_terrain:48211'); // one layer
     const clouds = layer.scope('clouds');        // subsystem
     const warp   = layer.scope('clouds.warp');   // sub-subsystem
   ============================================================ */

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Hash (masterSeed, path) down to a 32-bit stream seed. */
function streamSeed(masterSeed, path) {
  const f = xmur3(String(masterSeed) + '::' + String(path || 'root'));
  return f();
}

/* Backwards-compatible one-shot stream, e.g. rngFrom('sky481921'). */
function rngFrom(seed) {
  const f = xmur3(String(seed));
  return mulberry32(f());
}

function randSeed() {
  return Math.floor(Math.random() * 1e9);
}

class RNG {
  constructor(masterSeed, path) {
    this.masterSeed = masterSeed;
    this.path = path || 'root';
    this._fn = null;
  }
  _stream() {
    if (!this._fn) this._fn = mulberry32(streamSeed(this.masterSeed, this.path));
    return this._fn;
  }
  /* Fresh independent child stream. Same path => same sequence, always. */
  scope(sub) {
    return new RNG(this.masterSeed, this.path + '.' + String(sub));
  }
  /* Raw function for legacy-style loops: const r = rng.fn(); r() */
  fn() { return this._stream(); }
  next() { return this._stream()(); }
  range(a, b) { return a + this.next() * (b - a); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
  /* Fisher–Yates shuffle of a copy. */
  shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

/* ---------- shared math helpers ---------- */
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function hexRGB(h) {
  h = h.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mixHex(h1, h2, t) {
  const a = hexRGB(h1), b = hexRGB(h2);
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}
/* 2-D-ish pseudo noise for flow fields (kept from v1). */
function fieldAngle(x, y, s) {
  return (Math.sin(x * 1.7 + s) * 1.3 + Math.cos(y * 2.3 - s * 0.7) * 1.1 +
    Math.sin((x + y) * 0.9 + s * 1.3)) * 1.2;
}
/* 1-D value noise for ridgelines, driven by a raw rng function. */
function makeNoise1D(r) {
  const g = new Float32Array(256);
  for (let i = 0; i < 256; i++) g[i] = r();
  return function (x) {
    const xi = Math.floor(x), xf = x - xi;
    const a = g[xi & 255], b = g[(xi + 1) & 255];
    const u = xf * xf * (3 - 2 * xf);
    return a + (b - a) * u;
  };
}
/* Seeded 2-D value noise + fbm. seedStr should be a namespaced path. */
function makeNoise2D(seedStr) {
  const r = rngFrom('n2d::' + seedStr);
  const perm = new Uint8Array(256);
  for (let i = 0; i < 256; i++) perm[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
  }
  const P = new Uint8Array(512);
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  function n2(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const X = ix & 255, Y = iy & 255;
    const a = P[(P[X] + Y) & 255] / 255, b = P[(P[X + 1] + Y) & 255] / 255;
    const c = P[(P[X] + Y + 1) & 255] / 255, d = P[(P[X + 1] + Y + 1) & 255] / 255;
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }
  function fbm(x, y, oct) {
    let v = 0, a = 0.5, f = 1, nm = 0;
    for (let i = 0; i < oct; i++) { v += a * n2(x * f, y * f); nm += a; a *= 0.5; f *= 2.03; }
    return v / nm;
  }
  return { n2, fbm };
}
/* Small reusable detail tile: fbm rock grain, drawn with 'overlay'. */
function detailTile(seedStr) {
  const S = 256, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d'), nz = makeNoise2D('detailtile::' + seedStr);
  const id = g.createImageData(S, S), d = id.data;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = (y * S + x) * 4;
    let v = nz.fbm(x * 0.05, y * 0.05, 4) * 0.65 + nz.fbm(x * 0.15 + 31, y * 0.15 + 7, 2) * 0.35;
    v = v * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return cv;
}

/* ============================================================
   FORGE core/plugins.js — the LayerPlugin contract
   ------------------------------------------------------------
   LayerPlugin = {
     id,                 // 'terrain' (stable, never renamed)
     version,            // semver: '1.0.0'
     title,              // 'Mountains' (human name)
     glyph,              // '⛰️'  (editor icon)
     pass,               // render pass: simulation|geometry|materials|
                         //   lighting|atmosphere|particles|postfx|ui
     provides: [],       // world-bus keys this layer publishes
     reads: [],          // world-bus keys this layer consumes
     schema,             // parameter schema (see core/schemas.js)
     defaults(rng),      // rng: RNG scoped to 'defaults'
     randomize(rng, params, world),  // remix (optional; default jitter)
     render(lc),         // lc: layer context (see renderer.js)
     publish(lc, world), // optional: publish facts before rendering
     serialize(params),  // optional; default identity
     migrate(oldParams, fromVersion), // optional
     inspector(container, params, onChange), // optional custom UI
     composeWeight,      // weight in the Random composition bag
   }
   ============================================================ */

function definePlugin(def) {
  return Object.assign(
    { version: '1.0.0', provides: [], reads: [], pass: 'atmosphere', composeWeight: 5 },
    def
  );
}

const REQUIRED = ['id', 'title', 'schema', 'defaults', 'render'];

function validatePlugin(p) {
  const errors = [];
  for (const k of REQUIRED) {
    if (p[k] === undefined || p[k] === null) errors.push('missing required field: ' + k);
  }
  if (p.id && !/^[a-z0-9-]+$/.test(p.id)) errors.push('id must be lowercase alphanumeric/dashes');
  if (p.schema && typeof p.render !== 'function') errors.push('render must be a function');
  if (p.defaults && typeof p.defaults !== 'function') errors.push('defaults must be a function');
  if (p.randomize && typeof p.randomize !== 'function') errors.push('randomize must be a function');
  if (p.publish && typeof p.publish !== 'function') errors.push('publish must be a function');
  if (p.migrate && typeof p.migrate !== 'function') errors.push('migrate must be a function');
  return errors;
}

class PluginRegistry {
  constructor() {
    this.map = new Map();
  }
  register(plugin) {
    const errors = validatePlugin(plugin);
    if (errors.length) throw new Error('Invalid plugin "' + (plugin.id || '?') + '": ' + errors.join('; '));
    if (this.map.has(plugin.id)) {
      throw new Error('Plugin already registered: ' + plugin.id);
    }
    this.map.set(plugin.id, plugin);
    return plugin;
  }
  get(id) { return this.map.get(id); }
  has(id) { return this.map.has(id); }
  ids() { return [...this.map.keys()]; }
  list() { return [...this.map.values()]; }
  /* For the plugin browser: id, title, glyph, version, pass, provides, reads. */
  describe() {
    return this.list().map(p => ({
      id: p.id, version: p.version, title: p.title, glyph: p.glyph || '🧩',
      pass: p.pass, provides: p.provides || [], reads: p.reads || [],
      params: Object.keys(p.schema || {}).length,
    }));
  }
}

/* ============================================================
   FORGE core/world.js — the world / context bus
   ------------------------------------------------------------
   Layers publish facts about the scene; other layers consume
   them. This is what keeps multi-layer scenes coherent instead
   of "a bunch of unrelated stuff drawn on top of each other".

   Key convention: "domain.name", e.g.
     terrain.heightAt   (x:0..1) -> y:0..1  (ridge height)
     terrain.baseY      0..1  (where mountains meet the ground)
     water.level        0..1  (waterline as fraction of height)
     sky.horizonY       0..1
     weather.wetness    0..1
     weather.wind       -1..1

   Values may be constants or functions. Declarations
   (provides/reads per plugin) feed the BUILD dependency view.
   ============================================================ */

class WorldBus {
  constructor() {
    this.providers = new Map();   // key -> value | function
    this.declarations = new Map(); // pluginId -> {provides:[], reads:[]}
    this.sources = new Map();     // key -> pluginId that provided it
  }
  provide(key, value, sourceId) {
    this.providers.set(key, value);
    if (sourceId) this.sources.set(key, sourceId);
  }
  has(key) { return this.providers.has(key); }
  query(key, ...args) {
    const v = this.providers.get(key);
    if (v === undefined) return undefined;
    return typeof v === 'function' ? v(...args) : v;
  }
  /* Declared contract of one plugin instance (for the dep view). */
  declare(layerId, plugin) {
    this.declarations.set(layerId, {
      plugin: plugin.id,
      title: plugin.title,
      provides: (plugin.provides || []).slice(),
      reads: (plugin.reads || []).slice(),
    });
  }
  keys() { return [...this.providers.keys()]; }
  /* Edges: reader layer -> provider layer, for keys actually present. */
  graph() {
    const nodes = [...this.declarations.entries()].map(([layerId, d]) => ({
      layerId, plugin: d.plugin, title: d.title,
      provides: d.provides, reads: d.reads,
    }));
    const edges = [];
    for (const n of nodes) {
      for (const rk of n.reads) {
        const src = this.sources.get(rk);
        if (src && src !== n.layerId) edges.push({ from: src, to: n.layerId, key: rk });
      }
    }
    return { nodes, edges };
  }
  snapshot() {
    const out = {};
    for (const k of this.providers.keys()) {
      const v = this.providers.get(k);
      out[k] = typeof v === 'function' ? '[function]' : v;
    }
    return out;
  }
  reset() {
    this.providers.clear();
    this.sources.clear();
    this.declarations.clear();
  }
}

/* ============================================================
   FORGE core/profiler.js — per-pass / per-plugin timing
   ------------------------------------------------------------
   renderScene feeds this; the BUILD view shows:

     Terrain       2.1 ms
     Buildings     5.8 ms
     ...
     -------------------
     Frame        22.9 ms
                 43.7 FPS
   ============================================================ */

class Profiler {
  constructor() { this.reset(); }
  reset() {
    this.passes = {};   // pass -> {ms, layers}
    this.plugins = {};  // pluginId -> {ms, calls, title}
    this.totalMs = 0;
    this.frames = 0;
  }
  begin() { this._t0 = performance.now(); }
  record(pass, pluginId, title, ms) {
    if (!this.passes[pass]) this.passes[pass] = { ms: 0, layers: 0 };
    this.passes[pass].ms += ms;
    this.passes[pass].layers += 1;
    if (!this.plugins[pluginId]) this.plugins[pluginId] = { ms: 0, calls: 0, title: title || pluginId };
    this.plugins[pluginId].ms += ms;
    this.plugins[pluginId].calls += 1;
  }
  end() {
    this.totalMs = performance.now() - this._t0;
    this.frames += 1;
  }
  report() {
    const passes = Object.entries(this.passes)
      .map(([pass, d]) => ({ pass, ms: d.ms, layers: d.layers }))
      .sort((a, b) => b.ms - a.ms);
    const plugins = Object.entries(this.plugins)
      .map(([id, d]) => ({ id, title: d.title, ms: d.ms, calls: d.calls }))
      .sort((a, b) => b.ms - a.ms);
    return {
      totalMs: this.totalMs,
      fps: this.totalMs > 0 ? 1000 / this.totalMs : 0,
      passes, plugins, frames: this.frames,
    };
  }
}

/* ============================================================
   FORGE core/schemas.js — schema-driven parameters
   ------------------------------------------------------------
   A plugin declares WHAT it needs; FORGE builds the UI.

   Field types:
     number  {min,max,step,default,ui:'slider'}
     enum    {values:[...], default, ui:'segmented'}
     boolean {default, ui:'toggle'}
     color   {default:'#rrggbb'}
     palette {default:0}              // index into the palette set
     text    {default:'', maxLength}

   Legacy v1 array format [{k,label,t:'range',...}] is accepted
   and normalized, so old plugins keep working.
   ============================================================ */

const FIELD_TYPES = ['number', 'enum', 'boolean', 'color', 'palette', 'text', 'data'];

const LEGACY_TYPE = { range: 'number', seg: 'enum', color: 'color', pal: 'palette' };

function normalizeSchema(schema) {
  if (!schema) return {};
  if (Array.isArray(schema)) {
    const out = {};
    for (const s of schema) {
      const f = {
        key: s.k, label: s.label || s.k,
        type: LEGACY_TYPE[s.t] || 'number', ui: s.t === 'range' ? 'slider' : (s.t === 'seg' ? 'segmented' : s.t),
      };
      if (s.min != null) f.min = s.min;
      if (s.max != null) f.max = s.max;
      if (s.step != null) f.step = s.step;
      if (s.opts) f.values = s.opts;
      out[s.k] = f;
    }
    return out;
  }
  const out = {};
  for (const [key, f] of Object.entries(schema)) {
    out[key] = Object.assign({ key, label: key, type: 'number', ui: 'slider' }, f, { key });
  }
  return out;
}

function schemaDefaults(schema) {
  const s = normalizeSchema(schema), out = {};
  for (const [key, f] of Object.entries(s)) {
    if (f.default !== undefined) out[key] = f.default;
    else if (f.type === 'number') out[key] = f.min != null ? f.min : 0;
    else if (f.type === 'enum') out[key] = (f.values || [])[0];
    else if (f.type === 'boolean') out[key] = false;
    else if (f.type === 'color') out[key] = '#ffffff';
    else if (f.type === 'palette') out[key] = 0;
    else out[key] = '';
  }
  return out;
}

/* Coerce + clamp a params object against a schema. Fills defaults. */
function validateParams(schema, params) {
  const s = normalizeSchema(schema), defs = schemaDefaults(s), out = {};
  const p = params || {};
  for (const [key, f] of Object.entries(s)) {
    let v = p[key] !== undefined ? p[key] : defs[key];
    if (f.type === 'number') {
      v = Number(v);
      if (!isFinite(v)) v = defs[key];
      if (f.min != null) v = Math.max(f.min, v);
      if (f.max != null) v = Math.min(f.max, v);
      if (f.step && f.step >= 1 && Number.isInteger(defs[key])) v = Math.round(v);
    } else if (f.type === 'enum') {
      if (!f.values.includes(v)) v = defs[key];
    } else if (f.type === 'boolean') {
      v = !!v;
    } else if (f.type === 'color') {
      if (typeof v !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v)) v = defs[key];
    } else if (f.type === 'palette') {
      v = Math.max(0, Math.floor(Number(v) || 0));
    } else if (f.type === 'data') {
      v = v !== undefined ? v : defs[key]; // pass through untouched (arrays, objects)
    } else {
      v = String(v == null ? '' : v).slice(0, f.maxLength || 200);
    }
    out[key] = v;
  }
  return out;
}

/* Default remix: jitter numbers ±25%, re-pick enums/booleans/colors
   sometimes, keep palette indices in range. Plugins may override
   with their own randomize(rng, params, world). */
function defaultRandomize(schema, params, rng, palettes) {
  const s = normalizeSchema(schema), out = Object.assign({}, params);
  for (const [key, f] of Object.entries(s)) {
    const cur = out[key];
    if (f.type === 'number') {
      if (key === 'pal' || f.ui === 'palette') {
        out[key] = rng.int(0, Math.max(0, (palettes || []).length - 1));
        continue;
      }
      const jitter = (Math.abs(Number(cur)) || 1) * 0.25;
      let nv = Number(cur) + (rng.next() * 2 - 1) * jitter;
      if (f.step && f.step >= 1) nv = Math.round(nv);
      if (f.min != null) nv = Math.max(f.min, nv);
      if (f.max != null) nv = Math.min(f.max, nv);
      out[key] = nv;
    } else if (f.type === 'palette') {
      out[key] = rng.int(0, Math.max(0, (palettes || []).length - 1));
    } else if (f.type === 'enum') {
      if (rng.chance(0.45)) out[key] = rng.pick(f.values);
    } else if (f.type === 'boolean') {
      if (rng.chance(0.3)) out[key] = !cur;
    } else if (f.type === 'color') {
      if (rng.chance(0.3)) out[key] = rng.pick(['#ffffff', '#ffd9a0', '#ffe9b8', '#fff6d8', '#a0e7ff', '#ff9a5a']);
    }
  }
  return validateParams(s, out);
}

function fmtVal(v) {
  if (typeof v === 'number') return Math.abs(v) < 1 ? v.toFixed(2) : Math.round(v * 10) / 10;
  return String(v);
}

/* ---------- schema -> DOM inspector ----------
   buildInspector(container, schema, params, onChange, opts)
   opts: {palettes, debounceMs}
   Calls onChange(key, value) on every edit.                    */
function buildInspector(container, schema, params, onChange, opts) {
  const s = normalizeSchema(schema);
  const palettes = (opts && opts.palettes) || [];
  container.innerHTML = '';
  for (const [key, f] of Object.entries(s)) {
    const row = document.createElement('div');
    row.className = 'srow';
    row.dataset.field = key;
    const label = document.createElement('label');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = f.label;
    label.appendChild(nameSpan);
    row.appendChild(label);

    const emit = (v) => onChange(key, v);

    if (f.type === 'number') {
      const val = document.createElement('b');
      val.textContent = fmtVal(params[key]);
      label.appendChild(val);
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.min = f.min != null ? f.min : 0;
      inp.max = f.max != null ? f.max : 1;
      inp.step = f.step != null ? f.step : 0.01;
      inp.value = params[key];
      inp.addEventListener('input', () => {
        let v = parseFloat(inp.value);
        if (f.step && f.step >= 1) v = Math.round(v);
        val.textContent = fmtVal(v);
        emit(v);
      });
      row.appendChild(inp);
    } else if (f.type === 'enum') {
      const seg = document.createElement('div');
      seg.className = 'seg';
      for (const opt of f.values) {
        const b = document.createElement('button');
        b.textContent = String(opt);
        b.dataset.v = String(opt);
        if (String(params[key]) === String(opt)) b.classList.add('on');
        b.addEventListener('click', () => {
          seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          emit(opt);
        });
        seg.appendChild(b);
      }
      row.appendChild(seg);
    } else if (f.type === 'boolean') {
      const seg = document.createElement('div');
      seg.className = 'seg';
      for (const opt of [true, false]) {
        const b = document.createElement('button');
        b.textContent = opt ? (f.onLabel || 'On') : (f.offLabel || 'Off');
        if (!!params[key] === opt) b.classList.add('on');
        b.addEventListener('click', () => {
          seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          emit(opt);
        });
        seg.appendChild(b);
      }
      row.appendChild(seg);
    } else if (f.type === 'color') {
      const inp = document.createElement('input');
      inp.type = 'color';
      inp.value = params[key] || '#ffffff';
      inp.addEventListener('input', () => emit(inp.value));
      row.appendChild(inp);
    } else if (f.type === 'palette') {
      const val = document.createElement('b');
      const pi = params[key] || 0;
      val.textContent = (palettes[pi] && palettes[pi].name) || ('Palette ' + pi);
      label.appendChild(val);
      const seg = document.createElement('div');
      seg.className = 'seg palgrid';
      palettes.forEach((p, i) => {
        const b = document.createElement('button');
        b.title = p.name;
        b.dataset.v = String(i);
        if (i === pi) b.classList.add('on');
        const grad = 'linear-gradient(135deg,' + (p.sky || []).join(',') + ')';
        b.style.background = grad;
        b.style.minWidth = '44px';
        b.style.height = '30px';
        b.addEventListener('click', () => {
          seg.querySelectorAll('button').forEach(x => x.classList.remove('on'));
          b.classList.add('on');
          val.textContent = p.name;
          emit(i);
        });
        seg.appendChild(b);
      });
      row.appendChild(seg);
    } else if (f.type === 'data') {
      /* pass-through data (arrays/objects) — no generic control.
         Plugins with data fields provide a custom inspector. */
      continue;
    } else { /* text */
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = params[key] || '';
      inp.maxLength = f.maxLength || 200;
      inp.className = 'txtin';
      inp.addEventListener('change', () => emit(inp.value));
      row.appendChild(inp);
    }
    container.appendChild(row);
  }
  return container;
}

/* ============================================================
   FORGE core/renderer.js — render passes + scene renderer
   ------------------------------------------------------------
   Passes run in a fixed order; layers run inside their pass
   in scene order:

     simulation -> geometry -> materials -> lighting ->
     atmosphere -> particles -> postfx -> ui

   Two phases per frame:
     1. PUBLISH — every visible layer may publish facts to the
        world bus (terrain height, water level, ...).
     2. RENDER  — passes in order; each layer timed into the
        profiler.

   The layer context (lc) handed to plugin.render:
     { c, W, H, params, seed, layerId, plugin, palette,
       palettes, world, scene,
       rng(subpath) -> RNG (namespaced: layer -> subsystem),
       noise: { n1(rngFn), n2(seedStr) },
       help: { clamp, lerp, hexRGB, mixHex, fieldAngle } }
   ============================================================ */


const PASSES = [
  'simulation', 'geometry', 'materials', 'lighting',
  'atmosphere', 'particles', 'postfx', 'ui',
];

function paletteKeyFor(plugin) {
  const s = normalizeSchema(plugin.schema);
  for (const [k, f] of Object.entries(s)) {
    if (f.type === 'palette') return k;
  }
  return null;
}

function paletteForLayer(plugin, params, palettes) {
  const key = paletteKeyFor(plugin);
  const idx = key ? clamp(params[key] || 0, 0, palettes.length - 1) : 0;
  return palettes[idx] || palettes[0];
}

function renderScene(scene, ctx2d, opts) {
  const o = opts || {};
  const registry = o.registry;
  if (!registry) throw new Error('renderScene needs {registry}');
  const palettes = o.palettes || [];
  const world = o.world || new WorldBus();
  const profiler = o.profiler || new Profiler();
  const disabledPasses = o.disabledPasses || new Set();
  const W = scene.canvas.width, H = scene.canvas.height;

  profiler.begin();
  const rootRng = new RNG(scene.seed, 'scene');

  /* ---- phase 1: publish ---- */
  world.reset();
  const visible = scene.layers.filter(l => l.visible !== false);
  const layerCtxs = [];
  for (const layer of visible) {
    const plugin = registry.get(layer.plugin);
    if (!plugin) continue;
    const params = validateParams(plugin.schema, layer.params);
    const layerRng = rootRng.scope(layer.id + ':' + layer.seed);
    const lc = {
      c: ctx2d, W, H, params, seed: layer.seed, layerId: layer.id,
      plugin, palette: paletteForLayer(plugin, params, palettes),
      palettes, world, scene,
      rng: (sub) => (sub ? layerRng.scope(sub) : layerRng),
      seedKey: layer.id + ':' + layer.seed,
      noise: { n1: makeNoise1D, n2: makeNoise2D },
      help: { clamp, lerp, hexRGB, mixHex, fieldAngle },
    };
    layerCtxs.push({ layer, plugin, lc, params });
    world.declare(layer.id, plugin);
    if (typeof plugin.publish === 'function') {
      try { plugin.publish(lc, world); }
      catch (e) { console.warn('publish failed:', layer.id, e); }
    }
  }

  /* ---- phase 2: render passes ---- */
  ctx2d.save();
  ctx2d.clearRect(0, 0, W, H);
  ctx2d.fillStyle = '#0b0e14';
  ctx2d.fillRect(0, 0, W, H);

  for (const pass of PASSES) {
    if (disabledPasses.has(pass)) continue;
    for (const { layer, plugin, lc } of layerCtxs) {
      const lp = layer.pass || plugin.pass || 'atmosphere';
      if (lp !== pass) continue;
      const t0 = performance.now();
      ctx2d.save();
      if (layer.opacity != null && layer.opacity !== 1) ctx2d.globalAlpha = layer.opacity;
      try {
        plugin.render(lc);
      } catch (e) {
        console.warn('render failed:', layer.id, e);
      }
      ctx2d.restore();
      profiler.record(pass, plugin.id, plugin.title, performance.now() - t0);
      if (typeof o.onLayer === 'function') o.onLayer(layer, plugin, pass);
    }
  }
  ctx2d.restore();
  profiler.end();
  return { world, profiler };
}

/* Gentle filmic grade baked over the whole picture (v1 look). */
function filmicGrade(ctx2d) {
  try {
    ctx2d.save();
    ctx2d.filter = 'saturate(1.12) contrast(1.045) brightness(1.015)';
    ctx2d.drawImage(ctx2d.canvas, 0, 0);
    ctx2d.restore();
    ctx2d.filter = 'none';
  } catch (e) { /* filter unsupported — skip */ }
}

/* ============================================================
   FORGE core/scene.js — the universal scene document
   ------------------------------------------------------------
   Every project boils down to one portable structure:

     {
       engineVersion: "2.0",
       kind: "forge-scene",
       seed: 481921,
       canvas: { width, height, aspect },
       camera: {},
       environment: { palette: 0 },
       layers: [ { id, plugin, pluginVersion, seed, params,
                   opacity, visible, locked, pass } ],
       strokes: [...],
       assets: [], parameters: {}, timeline: {},
       metadata: { name, created, app }
     }

   The renderer reads it. The editor modifies it. Random/Remix
   modifies it. Export reads it. Future AI modifies it.
   Other MOOR tools can generate it. This document is truth.
   ============================================================ */

const ENGINE_VERSION = '2.0';
const SCENE_KIND = 'forge-scene';

const ASPECTS = {
  '1:1': [1, 1], '4:3': [4, 3], '16:9': [16, 9], '9:16': [9, 16],
};

function canvasForAspect(aspect, longEdge) {
  const [aw, ah] = ASPECTS[aspect] || ASPECTS['1:1'];
  const L = longEdge || 1600;
  return aw >= ah
    ? { width: L, height: Math.round(L * ah / aw), aspect }
    : { width: Math.round(L * aw / ah), height: L, aspect };
}

let _uid = 0;
function makeLayerId(pluginId) {
  _uid += 1;
  return 'L' + Date.now().toString(36) + _uid.toString(36) + '_' + pluginId;
}

function makeLayer(plugin, seed, params, opts) {
  const o = opts || {};
  return {
    id: o.id || makeLayerId(plugin.id),
    plugin: plugin.id,
    pluginVersion: plugin.version || '1.0.0',
    seed: seed,
    params: params || {},
    opacity: o.opacity != null ? o.opacity : 1,
    visible: o.visible !== false,
    locked: !!o.locked,
    pass: o.pass || plugin.pass || 'atmosphere',
  };
}

function createScene(opts) {
  const o = opts || {};
  const aspect = o.aspect || '1:1';
  return {
    engineVersion: ENGINE_VERSION,
    kind: SCENE_KIND,
    seed: o.seed != null ? o.seed : Math.floor(Math.random() * 1e9),
    canvas: canvasForAspect(aspect, o.longEdge),
    camera: o.camera || {},
    environment: Object.assign({ palette: 0 }, o.environment),
    layers: o.layers || [],
    strokes: o.strokes || [],
    assets: o.assets || [],
    parameters: o.parameters || {},
    timeline: o.timeline || {},
    metadata: Object.assign(
      { name: o.name || 'Untitled', created: Date.now(), app: 'forge-2' },
      o.metadata
    ),
  };
}

/* Deterministic JSON: stable key order so hashes match. */
function serializeScene(scene) {
  return JSON.stringify(sortKeys(scene));
}
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortKeys(v[k]);
    return out;
  }
  return v;
}

function parseScene(json) {
  const warnings = [];
  let doc;
  try {
    doc = typeof json === 'string' ? JSON.parse(json) : json;
  } catch (e) {
    return { scene: null, warnings: ['Not valid JSON: ' + e.message] };
  }
  if (doc && doc.v === 1 && !doc.engineVersion) {
    return { scene: migrateV1toV2(doc), warnings: ['Migrated from FORGE v1 recipe'] };
  }
  if (!doc || doc.kind !== SCENE_KIND) {
    return { scene: null, warnings: ['Not a forge-scene document'] };
  }
  if (doc.engineVersion !== ENGINE_VERSION) {
    warnings.push('Scene engineVersion ' + doc.engineVersion + '; running ' + ENGINE_VERSION);
  }
  const scene = createScene({});
  for (const k of ['seed', 'canvas', 'camera', 'environment', 'layers', 'strokes',
    'assets', 'parameters', 'timeline', 'metadata']) {
    if (doc[k] !== undefined) scene[k] = doc[k];
  }
  scene.engineVersion = ENGINE_VERSION;
  scene.kind = SCENE_KIND;
  return { scene, warnings };
}

function validateScene(scene) {
  const errors = [];
  if (!scene) return ['No scene'];
  if (scene.kind !== SCENE_KIND) errors.push('kind must be ' + SCENE_KIND);
  if (!scene.canvas || !scene.canvas.width || !scene.canvas.height) errors.push('canvas.width/height required');
  if (!Array.isArray(scene.layers)) errors.push('layers must be an array');
  else scene.layers.forEach((l, i) => {
    if (!l.id) errors.push('layers[' + i + '].id missing');
    if (!l.plugin) errors.push('layers[' + i + '].plugin missing');
    if (typeof l.seed !== 'number') errors.push('layers[' + i + '].seed must be a number');
    if (!l.params || typeof l.params !== 'object') errors.push('layers[' + i + '].params must be an object');
  });
  return errors;
}

/* ---------- v1 recipe -> v2 scene ----------
   v1: {v:1, aspect, masterSeed, layers:[{t,s,p,o,v}], strokes} */
function migrateV1toV2(v1) {
  const scene = createScene({
    seed: v1.masterSeed != null ? v1.masterSeed : Math.floor(Math.random() * 1e9),
    aspect: v1.aspect || '1:1',
    name: 'Migrated picture',
    metadata: { migratedFrom: 'forge-v1' },
  });
  scene.layers = (v1.layers || []).map((l, i) => ({
    id: 'L' + (i + 1) + '_' + l.t,
    plugin: l.t,
    pluginVersion: '1.0.0',
    seed: l.s,
    params: Object.assign({}, l.p),
    opacity: l.o == null ? 1 : l.o,
    visible: l.v !== 0,
    locked: false,
    pass: undefined, // resolved by renderer from plugin def
  }));
  // v1 draw strokes become a strokes-plugin layer (kept editable)
  if (v1.strokes && v1.strokes.length) {
    scene.layers.push({
      id: 'L' + (scene.layers.length + 1) + '_strokes',
      plugin: 'strokes',
      pluginVersion: '1.0.0',
      seed: 1,
      params: { strokes: v1.strokes },
      opacity: 1, visible: true, locked: false, pass: 'ui',
    });
  }
  scene.strokes = [];
  return scene;
}

/* Share-link encoding (URL-safe base64 of the scene JSON). */
function sceneToShare(scene) {
  const json = serializeScene(scene);
  if (json.length > 6000) return null;
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sceneFromShare(hash) {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(b64)));
    return parseScene(json);
  } catch (e) {
    return { scene: null, warnings: ['Bad share link: ' + e.message] };
  }
}

/* ============================================================
   FORGE plugin: sky — gradient sky + baked domain-warped clouds
   pass: atmosphere | provides: sky.horizonY
   ============================================================ */

const skyPlugin = definePlugin({
  id: 'sky',
  version: '1.0.0',
  title: 'Sky',
  glyph: '🌅',
  pass: 'atmosphere',
  provides: ['sky.horizonY'],
  reads: [],
  composeWeight: 10,
  schema: {
    style:    { type: 'enum', label: 'Style', values: ['linear', 'horizon', 'radial'], default: 'linear', ui: 'segmented' },
    pal:      { type: 'palette', label: 'Colors', default: 0 },
    horizon:  { type: 'number', label: 'Horizon height', min: 0.2, max: 0.9, step: 0.01, default: 0.6, ui: 'slider' },
    soft:     { type: 'number', label: 'Blend softness', min: 0, max: 1, step: 0.01, default: 0.6, ui: 'slider' },
    clouds:   { type: 'number', label: 'Cloud detail', min: 0, max: 1, step: 0.01, default: 0.5, ui: 'slider' },
    coverage: { type: 'number', label: 'Cloud cover', min: 0, max: 1, step: 0.01, default: 0.5, ui: 'slider' },
  },
  defaults(rng) {
    return {
      style: rng.pick(['linear', 'linear', 'horizon', 'radial']),
      pal: 0,
      horizon: rng.range(0.45, 0.75),
      soft: rng.range(0.2, 1),
      clouds: rng.range(0.25, 0.8),
      coverage: rng.range(0.3, 0.65),
    };
  },
  publish(lc, world) {
    world.provide('sky.horizonY', lc.params.horizon, lc.layerId);
  },
  render(lc) {
    const { c, W, H, params: P, palette: pal, help } = lc;
    const { clamp, lerp, hexRGB, mixHex } = help;
    const cols = pal.sky;
    let g;
    if (P.style === 'radial') {
      g = c.createRadialGradient(W / 2, H * P.horizon, 10, W / 2, H * P.horizon, Math.max(W, H) * 0.75);
    } else {
      g = c.createLinearGradient(0, 0, 0, H);
    }
    const h0 = P.horizon;
    if (P.style === 'horizon') {
      g.addColorStop(0, cols[0]);
      g.addColorStop(Math.max(0, h0 - 0.18 * P.soft), mixHex(cols[0], cols[1], 0.5));
      g.addColorStop(h0, cols[1]);
      g.addColorStop(Math.min(1, h0 + 0.12 * P.soft + 0.02), cols[2]);
      g.addColorStop(1, mixHex(cols[2], '#000000', 0.35));
    } else {
      g.addColorStop(0, cols[0]);
      g.addColorStop(clamp(h0, 0, 1), cols[1]);
      g.addColorStop(1, cols[2]);
    }
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    /* baked clouds: fbm, domain-warped, lit from the palette.
       Namespaced stream: 'clouds' — changing the sun never
       re-rolls the clouds. */
    if (P.clouds > 0.02) {
      const nz = lc.noise.n2(lc.seedKey + ':clouds');
      const rj = lc.rng('clouds.jitter').fn();
      const cw = Math.max(160, Math.floor(W / 3)), ch = Math.max(120, Math.floor(H / 3));
      const cv = document.createElement('canvas');
      cv.width = cw; cv.height = ch;
      const gx = cv.getContext('2d'), id = gx.createImageData(cw, ch), dd = id.data;
      const wx = rj() * 40, wy = rj() * 40;
      const hi = mixHex(cols[2], '#ffffff', 0.55), lo = mixHex(cols[0], '#000000', 0.25);
      const hir = hexRGB(hi), lor = hexRGB(lo);
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const u = x / cw * 5 + wx, vv = y / ch * 3.2 + wy;
        const warp = nz.fbm(u * 0.9 + 13.7, vv * 0.9 + 7.1, 2);
        let m = nz.fbm(u + warp * 1.6, vv + warp * 1.6, 4);
        m = clamp((m - (1 - P.coverage) * 0.85) / (P.coverage * 0.9 + 0.05), 0, 1);
        m = Math.pow(m, 1.25) * P.clouds;
        const shade = nz.n2(u * 2.2 + 40, vv * 2.2);
        const t = clamp(0.35 + shade * 0.65, 0, 1);
        const i = (y * cw + x) * 4;
        dd[i] = lerp(lor[0], hir[0], t);
        dd[i + 1] = lerp(lor[1], hir[1], t);
        dd[i + 2] = lerp(lor[2], hir[2], t);
        dd[i + 3] = m * 235;
      }
      gx.putImageData(id, 0, 0);
      c.save();
      c.globalAlpha = 0.9;
      c.drawImage(cv, 0, 0, cw, ch, 0, 0, W, H * 0.92);
      c.restore();
    }
  },
});

/* FORGE plugin: orb — sun / moon. pass: lighting */

const orbPlugin = definePlugin({
  id: 'orb', version: '1.0.0', title: 'Sun / Moon', glyph: '🌞',
  pass: 'lighting', provides: [], reads: [], composeWeight: 5,
  schema: {
    x:     { type: 'number', label: 'Across', min: 0, max: 1, step: 0.01, default: 0.5, ui: 'slider' },
    y:     { type: 'number', label: 'Height', min: 0, max: 1, step: 0.01, default: 0.3, ui: 'slider' },
    size:  { type: 'number', label: 'Size', min: 0.02, max: 0.2, step: 0.005, default: 0.08, ui: 'slider' },
    glow:  { type: 'number', label: 'Glow', min: 0, max: 1, step: 0.01, default: 0.75, ui: 'slider' },
    warm:  { type: 'boolean', label: 'Warm tone', default: true, ui: 'toggle', onLabel: 'Warm', offLabel: 'Cool' },
    col:   { type: 'color', label: 'Color', default: '#fff6d8' },
  },
  defaults(rng) {
    return {
      x: rng.range(0.15, 0.85), y: rng.range(0.12, 0.5),
      size: rng.range(0.04, 0.13), glow: rng.range(0.5, 1),
      warm: rng.chance(0.7),
      col: rng.pick(['#fff6d8', '#ffe9b8', '#ffffff', '#ffd9a0']),
    };
  },
  render(lc) {
    const { c, W, H, params: P, help } = lc;
    const { mixHex } = help;
    const x = P.x * W, y = P.y * H, R = P.size * Math.min(W, H);
    const col = P.warm ? P.col : mixHex(P.col, '#bfe9ff', 0.6);
    if (P.glow > 0) {
      const g = c.createRadialGradient(x, y, R * 0.4, x, y, R * (2 + P.glow * 3));
      g.addColorStop(0, col + 'cc');
      g.addColorStop(0.4, col + '44');
      g.addColorStop(1, col + '00');
      c.fillStyle = g;
      c.beginPath(); c.arc(x, y, R * (2 + P.glow * 3), 0, 7); c.fill();
    }
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y, R, 0, 7); c.fill();
  },
});

/* FORGE plugin: stars — twinkling starfield. pass: atmosphere */

const starsPlugin = definePlugin({
  id: 'stars', version: '1.0.0', title: 'Stars', glyph: '✨',
  pass: 'atmosphere', provides: [], reads: [], composeWeight: 5,
  schema: {
    n:    { type: 'number', label: 'How many', min: 0, max: 400, step: 5, default: 130, ui: 'slider' },
    smax: { type: 'number', label: 'Max size', min: 0.5, max: 4, step: 0.1, default: 1.8, ui: 'slider' },
    tw:   { type: 'boolean', label: 'Twinkle', default: true, ui: 'toggle', onLabel: 'On', offLabel: 'Off' },
  },
  defaults(rng) {
    return { n: rng.int(40, 220), smax: rng.range(1, 2.6), tw: rng.chance(0.6) };
  },
  render(lc) {
    const { c, W, H, params: P } = lc;
    const r = lc.rng('stars').fn();
    for (let i = 0; i < P.n; i++) {
      const x = r() * W, y = r() * H * 0.8, s = 0.4 + r() * P.smax;
      const a = P.tw ? 0.35 + 0.65 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) : 0.9;
      c.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')';
      c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
    }
  },
});

/* ============================================================
   FORGE plugin: terrain — mountain ridges with baked detail
   pass: geometry
   provides: terrain.heightAt(x)  — ridge crest, y as 0..1 of H
             terrain.baseY        — ground line, 0..1 of H
   reads:    (none yet — future: water.level for shoreline foam)
   ============================================================ */

const terrainPlugin = definePlugin({
  id: 'terrain',
  version: '1.0.0',
  title: 'Mountains',
  glyph: '⛰️',
  pass: 'geometry',
  provides: ['terrain.heightAt', 'terrain.baseY'],
  reads: [],
  composeWeight: 7,
  schema: {
    bands:  { type: 'number', label: 'Ridges', min: 1, max: 4, step: 1, default: 2, ui: 'slider' },
    rough:  { type: 'number', label: 'Roughness', min: 0.1, max: 1.2, step: 0.01, default: 0.65, ui: 'slider' },
    base:   { type: 'number', label: 'Height', min: 0.35, max: 0.9, step: 0.01, default: 0.68, ui: 'slider' },
    pal:    { type: 'palette', label: 'Colors', default: 0 },
    haze:   { type: 'number', label: 'Haze', min: 0, max: 1, step: 0.01, default: 0.35, ui: 'slider' },
    snow:   { type: 'number', label: 'Snow caps', min: 0, max: 1, step: 0.01, default: 0.4, ui: 'slider' },
    detail: { type: 'number', label: 'Rock detail', min: 0, max: 1, step: 0.01, default: 0.7, ui: 'slider' },
  },
  defaults(rng) {
    return {
      bands: rng.int(1, 3), rough: rng.range(0.3, 1), base: rng.range(0.55, 0.8),
      pal: 0, haze: rng.range(0, 0.7), snow: rng.range(0, 0.8), detail: rng.range(0.4, 1),
    };
  },
  /* Publish ridge data BEFORE any layer renders, so other
     plugins (roads, trees, shoreline foam...) can query it. */
  publish(lc, world) {
    const P = lc.params;
    const n1 = lc.noise.n1(lc.rng('ridge').fn());
    const nz = lc.noise.n2(lc.seedKey + ':ridgefbm');
    const b = 0; // front ridge describes the silhouette
    const yBase = P.base - (P.bands - 1 - b) * 0.09;
    const heightAt = (x) => {
      const u = Math.max(0, Math.min(1, x));
      const r = yBase - (n1(u * 4 + b * 13.7) * 0.72 + nz.fbm(u * 7 + b * 31.7, 0.5, 3) * 0.28) * 0.30 * P.rough
        - Math.sin(u * Math.PI) * 0.04;
      return Math.max(0, Math.min(1, r));
    };
    world.provide('terrain.heightAt', heightAt, lc.layerId);
    world.provide('terrain.baseY', P.base, lc.layerId);
  },
  render(lc) {
    const { c, W, H, params: P, palette: pal, palettes, help } = lc;
    const { clamp, mixHex } = help;
    const lp = palettes[P.pal] ? palettes[P.pal].land : pal.land;
    const nz = lc.noise.n2(lc.seedKey + ':fbm');
    const dt = detailTile(lc.seedKey + ':detail');
    const steps = Math.max(90, Math.floor(W / 12));
    for (let b = 0; b < P.bands; b++) {
      const t = P.bands === 1 ? 0.5 : b / (P.bands - 1);
      const n1 = lc.noise.n1(lc.rng('ridge.' + b).fn());
      const yBase = H * (P.base - (P.bands - 1 - b) * 0.09);
      const ridge = new Float32Array(steps + 1);
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        ridge[i] = yBase - (n1(u * 4 + b * 13.7) * 0.72 + nz.fbm(u * 7 + b * 31.7, 0.5, 3) * 0.28) * H * 0.30 * P.rough
          - Math.sin(u * Math.PI) * H * 0.04;
      }
      const col = mixHex(lp[0], lp[1], t * 0.85);
      c.save();
      c.beginPath(); c.moveTo(0, H);
      for (let i = 0; i <= steps; i++) c.lineTo(i / steps * W, ridge[i]);
      c.lineTo(W, H); c.closePath();
      c.fillStyle = col; c.fill(); c.clip();

      if (P.detail > 0.02) {
        c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.34 * P.detail;
        c.drawImage(dt, 0, 0, 256, 256, 0, 0, W, H); c.restore();
        c.save(); c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.20 * P.detail;
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.2;
        const sy0 = Math.min.apply(null, ridge);
        for (let s = 0; s < 7; s++) {
          const yy = sy0 + 20 + s * (H - sy0) / 7 + nz.n2(s * 3.1, b) * 30;
          c.beginPath();
          for (let i = 0; i <= steps; i += 2) {
            const x = i / steps * W, y = yy + nz.n2(i * 0.05, s * 9.4) * 26;
            i ? c.lineTo(x, y) : c.moveTo(x, y);
          }
          c.stroke();
        }
        c.restore();
      }
      if (P.snow > 0.03) {
        const g2 = c.createLinearGradient(0, 0, 0, H * 0.4);
        const sc = mixHex(pal.sky[2], '#ffffff', 0.72);
        g2.addColorStop(0, sc); g2.addColorStop(1, sc + '00');
        c.save(); c.globalAlpha = 0.85 * P.snow; c.fillStyle = g2; c.beginPath();
        let started = false;
        for (let i = 0; i <= steps; i++) {
          const x = i / steps * W, depth = (26 + nz.fbm(i * 0.09, b * 7.7 + 3, 3) * 70) * (0.4 + P.snow);
          const y = ridge[i] + depth;
          if (!started) { c.moveTo(x, ridge[i]); started = true; }
          c.lineTo(x, y);
        }
        for (let i = steps; i >= 0; i--) c.lineTo(i / steps * W, ridge[i]);
        c.closePath(); c.fill(); c.restore();
      }
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.5;
      c.strokeStyle = mixHex(pal.sky[2], '#ffffff', 0.5);
      c.lineWidth = Math.max(1.2, W / 900);
      c.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = i / steps * W, y = ridge[i] - 1;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke(); c.restore();
      const ao = c.createLinearGradient(0, yBase - H * 0.25, 0, H);
      ao.addColorStop(0, 'rgba(0,0,0,0)');
      ao.addColorStop(1, 'rgba(0,0,0,.42)');
      c.fillStyle = ao; c.fillRect(0, 0, W, H);
      c.restore();
      if (P.haze > 0) {
        c.fillStyle = 'rgba(200,220,240,' + (P.haze * 0.16 * (1 - t * 0.6)).toFixed(3) + ')';
        c.fillRect(0, 0, W, H);
      }
    }
  },
});

/* ============================================================
   FORGE plugin: water — reflection, glitter path, foam
   pass: materials
   provides: water.level (0..1 waterline), water.lineY (px at render)
   ============================================================ */

const waterPlugin = definePlugin({
  id: 'water',
  version: '1.0.0',
  title: 'Water',
  glyph: '🌊',
  pass: 'materials',
  provides: ['water.level', 'water.lineY'],
  reads: [],
  composeWeight: 4,
  schema: {
    y:       { type: 'number', label: 'Water line', min: 0.4, max: 0.95, step: 0.01, default: 0.72, ui: 'slider' },
    ripple:  { type: 'number', label: 'Ripples', min: 0, max: 1, step: 0.01, default: 0.65, ui: 'slider' },
    shimmer: { type: 'number', label: 'Shimmer', min: 0, max: 1, step: 0.01, default: 0.65, ui: 'slider' },
    dark:    { type: 'number', label: 'Depth', min: 0, max: 0.8, step: 0.01, default: 0.3, ui: 'slider' },
    glitter: { type: 'number', label: 'Light path', min: 0, max: 1, step: 0.01, default: 0.7, ui: 'slider' },
    glitterX:{ type: 'number', label: 'Path position', min: 0, max: 1, step: 0.01, default: 0.5, ui: 'slider' },
    foam:    { type: 'number', label: 'Foam', min: 0, max: 1, step: 0.01, default: 0.5, ui: 'slider' },
  },
  defaults(rng) {
    return {
      y: rng.range(0.6, 0.85), ripple: rng.range(0.3, 1), shimmer: rng.range(0.3, 1),
      dark: rng.range(0.1, 0.5), glitter: rng.range(0.4, 1), glitterX: rng.range(0.3, 0.7),
      foam: rng.range(0.2, 0.8),
    };
  },
  publish(lc, world) {
    world.provide('water.level', lc.params.y, lc.layerId);
  },
  render(lc) {
    const { c, W, H, params: P, palette: pal, help } = lc;
    const { clamp, mixHex } = help;
    const y0 = P.y * H;
    lc.world.provide('water.lineY', y0, lc.layerId);
    c.save();
    c.beginPath(); c.rect(0, y0, W, H - y0); c.clip();
    const n = lc.noise.n1(lc.rng('ripple').fn());
    const rows = Math.ceil((H - y0) / 3);
    const rr = lc.rng('shimmer').fn();
    for (let j = 0; j < rows; j++) {
      const sy = Math.floor(y0 - 1 - ((j * 3) / (H - y0)) * y0 * 0.9);
      if (sy < 0) continue;
      const off = Math.sin(j * 0.7) * 8 * P.ripple + (n(j * 0.05) - 0.5) * 24 * P.ripple;
      c.drawImage(c.canvas, 0, sy, W, 1, off, y0 + j * 3, W, 3);
      if (off > 0.5) c.drawImage(c.canvas, 0, sy, W, 1, off - W, y0 + j * 3, W, 3);
      else if (off < -0.5) c.drawImage(c.canvas, 0, sy, W, 1, off + W, y0 + j * 3, W, 3);
    }
    const dg = c.createLinearGradient(0, y0, 0, H);
    dg.addColorStop(0, 'rgba(4,10,20,' + (P.dark * 0.35).toFixed(2) + ')');
    dg.addColorStop(1, 'rgba(2,6,14,' + P.dark.toFixed(2) + ')');
    c.fillStyle = dg; c.fillRect(0, y0, W, H - y0);

    if (P.glitter > 0.02) {
      const nz = lc.noise.n2(lc.seedKey + ':glitter');
      const gx = P.glitterX * W;
      c.save(); c.globalCompositeOperation = 'screen';
      const slices = 70;
      for (let j = 0; j < slices; j++) {
        const yy = y0 + (j / slices) * (H - y0);
        const spread = (0.02 + (j / slices) * 0.16) * W * (0.6 + P.glitter * 0.8);
        const wob = nz.fbm(j * 0.12, 3.3, 2) * spread;
        const a = P.glitter * (1 - j / slices * 0.75) * (0.35 + 0.65 * nz.n2(j * 0.3, 9.1));
        const grad = c.createLinearGradient(gx - spread + wob, 0, gx + spread + wob, 0);
        const hc = mixHex(pal.sky[2], '#ffffff', 0.6);
        grad.addColorStop(0, hc + '00'); grad.addColorStop(0.5, hc); grad.addColorStop(1, hc + '00');
        c.globalAlpha = clamp(a, 0, 1) * 0.5;
        c.fillStyle = grad;
        c.fillRect(gx - spread + wob, yy, spread * 2, (H - y0) / slices + 1);
      }
      c.restore();
    }
    if (P.foam > 0.02) {
      const nz2 = lc.noise.n2(lc.seedKey + ':foam');
      const fh = Math.max(8, (H - y0) * 0.09);
      const fw = Math.max(200, Math.floor(W / 4));
      const cv = document.createElement('canvas');
      cv.width = fw; cv.height = Math.ceil(fh);
      const fx = cv.getContext('2d'), id = fx.createImageData(fw, cv.height), dd = id.data;
      for (let yy = 0; yy < cv.height; yy++) for (let x = 0; x < fw; x++) {
        const m = nz2.fbm(x * 0.06, yy * 0.09 + 4.4, 3);
        const edge = 1 - yy / cv.height;
        const on = clamp((m - 0.42) * 4, 0, 1) * edge * P.foam;
        const i = (yy * fw + x) * 4;
        dd[i] = dd[i + 1] = dd[i + 2] = 235; dd[i + 3] = on * 200;
      }
      fx.putImageData(id, 0, 0);
      c.save(); c.globalAlpha = 0.8;
      c.drawImage(cv, 0, 0, fw, cv.height, 0, y0 - 2, W, fh + 2);
      c.restore();
    }
    if (P.shimmer > 0) {
      c.fillStyle = 'rgba(255,255,255,' + (P.shimmer * 0.06).toFixed(3) + ')';
      for (let i = 0; i < 40 * P.shimmer; i++) {
        const x = rr() * W, y = y0 + rr() * (H - y0);
        c.fillRect(x, y, 4 + rr() * 36, 1.5);
      }
    }
    c.restore();
  },
});

/* FORGE plugin: flow — flow-field lines. pass: particles */

const flowPlugin = definePlugin({
  id: 'flow', version: '1.0.0', title: 'Flow Lines', glyph: '🌀',
  pass: 'particles', provides: [], reads: [], composeWeight: 4,
  schema: {
    n:     { type: 'number', label: 'Lines', min: 10, max: 500, step: 5, default: 160, ui: 'slider' },
    len:   { type: 'number', label: 'Length', min: 0.05, max: 0.8, step: 0.01, default: 0.3, ui: 'slider' },
    swirl: { type: 'number', label: 'Swirl', min: 0.2, max: 3, step: 0.01, default: 1.2, ui: 'slider' },
    pal:   { type: 'palette', label: 'Colors', default: 0 },
    alpha: { type: 'number', label: 'Opacity', min: 0.05, max: 0.9, step: 0.01, default: 0.32, ui: 'slider' },
    w:     { type: 'number', label: 'Width', min: 0.4, max: 4, step: 0.1, default: 1.5, ui: 'slider' },
  },
  defaults(rng) {
    return {
      n: rng.int(60, 260), len: rng.range(0.1, 0.5), swirl: rng.range(0.5, 2),
      pal: 0, alpha: rng.range(0.15, 0.5), w: rng.range(0.6, 2.4),
    };
  },
  render(lc) {
    const { c, W, H, params: P, palette: pal, palettes, help } = lc;
    const { fieldAngle } = help;
    const cols = [pal.accent, pal.part, (palettes[P.pal] || pal).accent, '#ffffff'];
    const rng = lc.rng('flow');
    c.lineCap = 'round';
    for (let i = 0; i < P.n; i++) {
      let x = rng.next() * W, y = rng.next() * H;
      const s = rng.next() * 10;
      c.strokeStyle = rng.pick(cols);
      c.globalAlpha = P.alpha * (0.4 + rng.next() * 0.6);
      c.lineWidth = P.w * (0.5 + rng.next());
      c.beginPath(); c.moveTo(x, y);
      const steps = Math.floor(8 + P.len * 40);
      for (let j = 0; j < steps; j++) {
        const a = fieldAngle(x / W * 6, y / H * 6, s) * P.swirl;
        x += Math.cos(a) * 4; y += Math.sin(a) * 4;
        c.lineTo(x, y);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
  },
});

/* ============================================================
   FORGE plugin: fall — rain / snow / embers. pass: particles
   reads: water.level — embers that land in water get dimmed
   (the world bus working for real: precipitation reacts to
   the water another layer published).
   ============================================================ */

const fallPlugin = definePlugin({
  id: 'fall', version: '1.0.0', title: 'Rain / Snow / Embers', glyph: '🌧️',
  pass: 'particles', provides: ['weather.precipitation'], reads: ['water.level'],
  composeWeight: 4,
  schema: {
    kind:  { type: 'enum', label: 'Type', values: ['rain', 'snow', 'embers'], default: 'rain', ui: 'segmented' },
    n:     { type: 'number', label: 'How many', min: 10, max: 800, step: 10, default: 250, ui: 'slider' },
    angle: { type: 'number', label: 'Slant', min: -0.6, max: 0.6, step: 0.01, default: 0, ui: 'slider' },
    len:   { type: 'number', label: 'Streak', min: 0.005, max: 0.25, step: 0.005, default: 0.07, ui: 'slider' },
    col:   { type: 'color', label: 'Color', default: '#ffffff' },
    alpha: { type: 'number', label: 'Opacity', min: 0.1, max: 1, step: 0.01, default: 0.48, ui: 'slider' },
  },
  defaults(rng) {
    return {
      kind: rng.pick(['rain', 'snow', 'embers', 'rain', 'snow']),
      n: rng.int(80, 420), angle: rng.range(-0.3, 0.3), len: rng.range(0.02, 0.12),
      col: '#ffffff', alpha: rng.range(0.25, 0.7),
    };
  },
  publish(lc, world) {
    world.provide('weather.precipitation', lc.params.kind, lc.layerId);
  },
  render(lc) {
    const { c, W, H, params: P, palette: pal, world } = lc;
    const rng = lc.rng('fall');
    const waterY = world.has('water.level') ? world.query('water.level') * H : Infinity;
    const col = P.kind === 'embers'
      ? rng.pick([pal.accent, '#ff7a2e', '#ffd9a0'])
      : P.kind === 'snow' ? '#ffffff' : P.col;
    for (let i = 0; i < P.n; i++) {
      const x = rng.next() * W, y = rng.next() * H;
      /* embers die when they hit water — bus consumption in action */
      const dim = (P.kind === 'embers' && y > waterY) ? 0.15 : 1;
      c.strokeStyle = col;
      c.globalAlpha = P.alpha * (0.4 + rng.next() * 0.6) * dim;
      if (P.kind === 'snow') {
        c.fillStyle = col;
        const s = 1 + rng.next() * 3;
        c.beginPath(); c.arc(x, y, s, 0, 7); c.fill();
      } else {
        c.lineWidth = P.kind === 'embers' ? 1.6 + rng.next() * 1.6 : 1;
        const L = P.len * Math.min(W, H), dx = Math.sin(P.angle) * L, dy = Math.cos(P.angle) * L;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx, y + dy); c.stroke();
        if (P.kind === 'embers') {
          c.globalAlpha *= 0.35; c.lineWidth *= 3;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx, y + dy); c.stroke();
        }
      }
    }
    c.globalAlpha = 1;
  },
});

/* FORGE plugin: grain — film grain. pass: postfx */

const grainPlugin = definePlugin({
  id: 'grain', version: '1.0.0', title: 'Film Grain', glyph: '🎞️',
  pass: 'postfx', provides: [], reads: [], composeWeight: 6,
  schema: {
    amt: { type: 'number', label: 'Amount', min: 0, max: 0.3, step: 0.005, default: 0.09, ui: 'slider' },
  },
  defaults(rng) { return { amt: rng.range(0.04, 0.14) }; },
  render(lc) {
    const { c, W, H, params: P } = lc;
    const r = lc.rng('grain').fn();
    const n = Math.floor(W * H * P.amt / 28);
    for (let i = 0; i < n; i++) {
      const v = r() < 0.5 ? 0 : 255;
      c.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.05 + r() * 0.08).toFixed(3) + ')';
      c.fillRect(r() * W, r() * H, 1.4, 1.4);
    }
  },
});

/* FORGE plugin: vignette. pass: postfx */

const vignettePlugin = definePlugin({
  id: 'vignette', version: '1.0.0', title: 'Vignette', glyph: '◼️',
  pass: 'postfx', provides: [], reads: [], composeWeight: 7,
  schema: {
    str:   { type: 'number', label: 'Strength', min: 0, max: 1, step: 0.01, default: 0.45, ui: 'slider' },
    round: { type: 'number', label: 'Roundness', min: 0, max: 1, step: 0.01, default: 0.7, ui: 'slider' },
  },
  defaults(rng) { return { str: rng.range(0.25, 0.65), round: rng.range(0.4, 1) }; },
  render(lc) {
    const { c, W, H, params: P } = lc;
    const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3 * P.round, W / 2, H / 2, Math.max(W, H) * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,' + P.str.toFixed(2) + ')');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  },
});

/* FORGE plugin: leak — light leak. pass: postfx */

const leakPlugin = definePlugin({
  id: 'leak', version: '1.0.0', title: 'Light Leak', glyph: '💡',
  pass: 'postfx', provides: [], reads: [], composeWeight: 3,
  schema: {
    side: { type: 'enum', label: 'Side', values: ['left', 'right'], default: 'left', ui: 'segmented' },
    hue:  { type: 'color', label: 'Color', default: '#ff9a5a' },
    str:  { type: 'number', label: 'Strength', min: 0, max: 1, step: 0.01, default: 0.42, ui: 'slider' },
    size: { type: 'number', label: 'Size', min: 0.1, max: 1, step: 0.01, default: 0.42, ui: 'slider' },
  },
  defaults(rng) {
    return {
      side: rng.chance(0.5) ? 'left' : 'right',
      hue: rng.pick(['#ff9a5a', '#ffd9a0', '#ff6b8a', '#a0e7ff']),
      str: rng.range(0.25, 0.6), size: rng.range(0.25, 0.6),
    };
  },
  render(lc) {
    const { c, W, H, params: P } = lc;
    const x = P.side === 'left' ? 0 : W;
    const R = P.size * Math.max(W, H);
    const g = c.createRadialGradient(x, H * 0.35, 10, x, H * 0.35, R);
    g.addColorStop(0, P.hue);
    g.addColorStop(1, P.hue + '00');
    c.save();
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = P.str;
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.restore();
  },
});

/* ============================================================
   FORGE plugin: strokes — vector brush strokes (draw mode).
   pass: ui | params: { strokes: [{color,width,opacity,pts}] }
   Strokes are data, not pixels: they stay editable, undoable,
   and they serialize into the scene document.
   ============================================================ */

const strokesPlugin = definePlugin({
  id: 'strokes', version: '1.0.0', title: 'Drawing', glyph: '✏️',
  pass: 'ui', provides: [], reads: [], composeWeight: 0, // never auto-composed
  schema: {
    strokes: { type: 'data', label: 'Strokes', default: [] },
  },
  defaults() { return { strokes: [] }; },
  serialize(params) {
    return { strokes: Array.isArray(params.strokes) ? params.strokes : [] };
  },
  render(lc) {
    const { c, W, H, params: P } = lc;
    const strokes = Array.isArray(P.strokes) ? P.strokes : [];
    for (const s of strokes) {
      if (!s.pts || s.pts.length < 2) continue;
      c.save();
      c.globalAlpha = s.opacity != null ? s.opacity : 0.9;
      c.strokeStyle = s.color || '#ffffff';
      c.lineWidth = (s.width || 8) * (W / 800);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath();
      s.pts.forEach((p, i) => {
        const x = p[0] * W, y = p[1] * H;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      c.stroke();
      c.restore();
    }
  },
  /* Custom inspector: stroke list with per-stroke delete. */
  inspector(container, params, onChange) {
    const strokes = Array.isArray(params.strokes) ? params.strokes : [];
    container.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'secT';
    t.textContent = strokes.length + ' stroke' + (strokes.length === 1 ? '' : 's');
    container.appendChild(t);
    strokes.forEach((s, i) => {
      const row = document.createElement('div');
      row.className = 'lrow';
      const nm = document.createElement('div');
      nm.className = 'nm';
      nm.innerHTML = '<span style="color:' + s.color + '">●</span> Stroke ' + (i + 1) +
        '<small>' + s.pts.length + ' points · ' + Math.round((s.opacity || 1) * 100) + '%</small>';
      row.appendChild(nm);
      const del = document.createElement('button');
      del.className = 'icobtn danger';
      del.textContent = '✕';
      del.title = 'Delete stroke';
      del.addEventListener('click', () => {
        const next = strokes.slice();
        next.splice(i, 1);
        onChange('strokes', next);
      });
      row.appendChild(del);
      container.appendChild(row);
    });
    const clear = document.createElement('button');
    clear.className = 'midbtn';
    clear.style.width = '100%';
    clear.textContent = '🗑 Clear drawing';
    clear.addEventListener('click', () => onChange('strokes', []));
    container.appendChild(clear);
    return true; // custom UI handled it
  },
});

/* FORGE plugins/index.js — register the built-in plugin set. */

const BUILTIN_PLUGINS = [
  skyPlugin, orbPlugin, starsPlugin, terrainPlugin, waterPlugin,
  flowPlugin, fallPlugin, grainPlugin, vignettePlugin, leakPlugin,
  strokesPlugin,
];

function registerBuiltins(registry) {
  for (const p of BUILTIN_PLUGINS) registry.register(p);
  return registry;
}

/* FORGE palettes.js — shared palette set (kept from v1). */
const PALETTES = [
  { name: 'Ember Dusk', sky: ['#2b1a4e', '#b34a2e', '#ffcf7a'], land: ['#1c1030', '#3a1f3f'], accent: '#ffb454', part: '#ffd9a0' },
  { name: 'Arctic Dawn', sky: ['#0e2a4a', '#7fb6d9', '#ffe9c9'], land: ['#12283d', '#3d6a8a'], accent: '#bfe9ff', part: '#ffffff' },
  { name: 'Neon Night', sky: ['#05060f', '#1b0f3b', '#0f3b4a'], land: ['#0a0d18', '#17203a'], accent: '#6ee7f9', part: '#c084fc' },
  { name: 'Forest Mist', sky: ['#0d2118', '#3d6b4f', '#cfe8b8'], land: ['#0a1a12', '#24402e'], accent: '#a7e3a0', part: '#e8ffd9' },
  { name: 'Desert Noon', sky: ['#3a7bd5', '#9fd0f5', '#fff3d6'], land: ['#8a5a2e', '#d9a45b'], accent: '#fff0b8', part: '#ffffff' },
  { name: 'Galaxy', sky: ['#020208', '#2a0a4a', '#7a1e5a'], land: ['#0a0618', '#241243'], accent: '#c084fc', part: '#f0abfc' },
  { name: 'Rose Ash', sky: ['#1a0f14', '#6b2d3a', '#e8a37a'], land: ['#140d10', '#3a1f26'], accent: '#ffb4a2', part: '#ffd6c2' },
  { name: 'Mono Ink', sky: ['#0c0d10', '#3a3d44', '#c9ccd4'], land: ['#08090b', '#232529'], accent: '#e8eaee', part: '#ffffff' },
];

/* ============================================================
   FORGE SDK — @moor/forge
   ------------------------------------------------------------
   The framework without the editor. Other generators import
   this and arrive as plugin configurations:

     import { Forge, definePlugin } from './forge-sdk.js';

     const terrainPlugin = definePlugin({
       id: 'terrain', version: '1.0.0', title: 'Terrain',
       pass: 'geometry',
       provides: ['terrain.heightAt'],
       reads: [],
       schema: { ... },
       defaults(rng) { ... },
       render(lc) { ... },
     });

     const app = new Forge({ plugins: [terrainPlugin, ...] });
     app.mount(document.querySelector('#viewport'));
     app.newScene({ seed: 123 });
     app.render();

   Everything the editor does — scene docs, namespaced RNG,
   the world bus, render passes, the profiler — is available
   here. The editor is just one UI over this SDK.
   ============================================================ */


class Forge {
  constructor(opts) {
    const o = opts || {};
    this.registry = new PluginRegistry();
    (o.plugins || []).forEach(p => this.registry.register(p));
    if (o.builtins !== false && this.registry.ids().length === 0) {
      registerBuiltins(this.registry);
    }
    this.palettes = o.palettes || PALETTES;
    this.world = new WorldBus();
    this.profiler = new Profiler();
    this.scene = null;
    this.canvas = null;
    this.disabledPasses = new Set();
    this.grade = o.grade !== false; // filmic grade like the editor
  }

  /* Register one more plugin at runtime. */
  use(plugin) {
    this.registry.register(plugin);
    return this;
  }

  mount(canvas) {
    this.canvas = canvas;
    return this;
  }

  newScene(opts) {
    const o = opts || {};
    this.scene = createScene({ seed: o.seed != null ? o.seed : randSeed(), aspect: o.aspect || '1:1' });
    if (o.layers) {
      this.scene.layers = o.layers.map(l => {
        const p = this.registry.get(l.plugin);
        if (!p) throw new Error('Unknown plugin: ' + l.plugin);
        return makeLayer(p, l.seed != null ? l.seed : randSeed(),
          validateParams(p.schema, l.params || p.defaults(new RNG(this.scene.seed, 'sdk:' + l.plugin))), l);
      });
    }
    return this.scene;
  }

  loadScene(doc) {
    const { scene, warnings } = parseScene(doc);
    if (!scene) throw new Error('Bad scene: ' + warnings.join('; '));
    const kept = [];
    for (const l of scene.layers) {
      const p = this.registry.get(l.plugin);
      if (!p) { warnings.push('Unknown plugin skipped: ' + l.plugin); continue; }
      if (!l.pass) l.pass = p.pass;
      l.params = validateParams(p.schema, l.params);
      kept.push(l);
    }
    scene.layers = kept;
    this.scene = scene;
    return { scene, warnings };
  }

  /* Re-roll every unlocked layer (or a subset). */
  remix(opts) {
    const o = opts || {};
    if (!this.scene) throw new Error('No scene');
    const rng = new RNG(this.scene.seed, 'remix:' + randSeed());
    for (const l of this.scene.layers) {
      if (l.locked) continue;
      if (o.only && !o.only.includes(l.plugin)) continue;
      const p = this.registry.get(l.plugin);
      l.seed = rng.int(1, 1e9);
      const lrng = new RNG(this.scene.seed, l.id + ':' + l.seed + ':remix');
      l.params = typeof p.randomize === 'function'
        ? validateParams(p.schema, p.randomize(lrng, l.params, this.world))
        : defaultRandomize(p.schema, l.params, lrng, this.palettes);
    }
    this.scene.seed = randSeed();
    return this.scene;
  }

  render() {
    if (!this.scene) throw new Error('No scene');
    if (!this.canvas) throw new Error('No canvas — call mount(canvas) first');
    const c = this.canvas.getContext('2d');
    const { W, H } = { W: this.scene.canvas.width, H: this.scene.canvas.height };
    if (this.canvas.width !== W || this.canvas.height !== H) {
      this.canvas.width = W; this.canvas.height = H;
    }
    const out = renderScene(this.scene, c, {
      registry: this.registry,
      palettes: this.palettes,
      world: this.world,
      profiler: this.profiler,
      disabledPasses: this.disabledPasses,
    });
    if (this.grade) filmicGrade(c);
    return out.profiler.report();
  }

  toJSON() { return serializeScene(this.scene); }
  validate() { return validateScene(this.scene); }

  /* World-bus access for host apps. */
  provide(key, value) { this.world.provide(key, value, 'host'); }
  query(key, ...args) { return this.world.query(key, ...args); }
}

  RNG, randSeed, PluginRegistry, definePlugin, validatePlugin,
  WorldBus, Profiler, PASSES, ENGINE_VERSION,
  createScene, makeLayer, serializeScene, parseScene, validateScene,
  validateParams, defaultRandomize, normalizeSchema,
  registerBuiltins, PALETTES, renderScene, filmicGrade,
};


export { Forge, RNG, randSeed, PluginRegistry, definePlugin, validatePlugin,
  WorldBus, Profiler, PASSES, ENGINE_VERSION,
  createScene, makeLayer, serializeScene, parseScene, validateScene,
  validateParams, defaultRandomize, normalizeSchema,
  registerBuiltins, PALETTES, renderScene, filmicGrade };
