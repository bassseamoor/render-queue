/* Road Atlas 3D 1.0.0 — real-time 3D twin of the current Road Atlas city.
 *
 * Pure function of the live world object: reads roads, water, parks, buildings
 * (with full architectural volumes + roofs) and trees, and rebuilds them as a
 * Three.js scene you can orbit, pinch-zoom and pan on touch.
 *
 * Loaded lazily (dynamic import) only when the user taps the 3D button, so the
 * 2D studio stays light. Deterministic: same world in, same city out.
 * Never touches the 2D pipeline, roads, navigation, layers or exports.
 */
import * as THREE from 'three';

let session = null;

/* ------------------------------------------------------------------ */
/* world access                                                        */
/* ------------------------------------------------------------------ */
function findWorld() {
  for (const k of Object.keys(window)) {
    try {
      const v = window[k];
      if (v && v.blocks && v.blocks.buildings && v.blocks.buildings.length &&
          v.conditions && v.roads && v.roads.length) return v;
    } catch (e) { /* ignore */ }
  }
  return null;
}
function themeIdx() {
  try {
    if (typeof P !== 'undefined' && Number.isFinite(P.theme)) return Math.max(0, Math.min(PALETTES.length - 1, Math.round(P.theme)));
  } catch (e) { /* ignore */ }
  return 0;
}

/* ------------------------------------------------------------------ */
/* palettes matched to the 2D themes                                   */
/* ------------------------------------------------------------------ */
const PALETTES = [
  { // 0 — atlas paper, warm daylight
    sky: 0xdfe9f2, ground: 0xe7dcc3, water: 0x5e9fc4, park: 0x93c46a,
    asphalt: 0xbdb5a4, arterial: 0xf5efe0, arterialGlow: 0x000000, glowInt: 0,
    roadGlow: 0x000000, roadGlowInt: 0,
    wallA: 0xd9d0bd, wallB: 0x8f8674, roofFlat: 0x9aa0a8, roofSlate: 0x707a88,
    roofTerra: 0xb26a48, roofGreen: 0x6fa055, glass: 0xbcd8e8,
    bridge: 0xcfc8b8, trunk: 0x6b4a2f, leaf: 0x5d8f4e,
    hemiSky: 0xcfe4f5, hemiGround: 0x9a8f78, hemiInt: 0.85,
    sun: 0xfff2dd, sunInt: 1.7, fogNear: 1900, fogFar: 5200, exposure: 1.0
  },
  { // 1 — midnight, glowing streets
    sky: 0x05080f, ground: 0x131f38, water: 0x1a4d6e, park: 0x244a3a,
    asphalt: 0x3a5068, arterial: 0xffc37a, arterialGlow: 0xff9a3c, glowInt: 1.6,
    roadGlow: 0xff8a3c, roadGlowInt: 0.45,
    wallA: 0x6a7a96, wallB: 0x2e3a52, roofFlat: 0x4a5568, roofSlate: 0x3a4556,
    roofTerra: 0x8a563e, roofGreen: 0x3a6a4a, glass: 0x9fd0e8,
    bridge: 0x6a7a8c, trunk: 0x4a3626, leaf: 0x3a6a52,
    hemiSky: 0x3a5070, hemiGround: 0x131c30, hemiInt: 1.0,
    sun: 0xa8c4ff, sunInt: 1.1, fogNear: 1500, fogFar: 4200, exposure: 1.15
  },
  { // 2 — blueprint
    sky: 0x0f2b4d, ground: 0x17456e, water: 0x0d2c4e, park: 0x1d5a7a,
    asphalt: 0x5d97b5, arterial: 0xcfeaff, arterialGlow: 0x66c2ff, glowInt: 0.5,
    roadGlow: 0x2266aa, roadGlowInt: 0.15,
    wallA: 0xdfeaf5, wallB: 0x9fb6cc, roofFlat: 0xb9d2e8, roofSlate: 0x8fb0cc,
    roofTerra: 0xd8a080, roofGreen: 0x7fc4a0, glass: 0xe8f6ff,
    bridge: 0xa8c8e0, trunk: 0x4a6a8c, leaf: 0x4a9a8c,
    hemiSky: 0x9fd0f5, hemiGround: 0x1d3a5c, hemiInt: 0.8,
    sun: 0xe8f4ff, sunInt: 1.3, fogNear: 1900, fogFar: 5200, exposure: 1.05
  }
];
/* Indices 3-9 are derived from the matching 2D theme of the same index, so
 * every theme gets a coherent 3D twin. The first three stay hand-tuned.
 * The derived objects MUST carry the full renderer schema (same fields as
 * the hand-tuned palettes above); missing fields make THREE warn on
 * undefined material parameters. */
(function extendPalettes() {
  try {
    if (typeof window === 'undefined' || !window.THEMES || PALETTES.length >= 10) return;
    var hx = function (c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; };
    var css = function (r) { return '#' + r.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); var s = v.toString(16); return s.length < 2 ? '0' + s : s; }).join(''); };
    var shade = function (c, f) { return css(hx(c).map(function (v) { return v * f; })); };
    for (var i = 3; i < 10 && i < window.THEMES.length; i++) {
      var T = window.THEMES[i], night = !!T.night, glow = night && !!T.glow;
      PALETTES.push({
        sky: night ? shade(T.bg2, 1.35) : shade(T.bg2, 1.18),
        ground: T.bg1, water: T.water, park: T.park,
        asphalt: T.local, arterial: T.arterial,
        arterialGlow: glow ? T.arterial : '#000000', glowInt: glow ? 1.6 : 0,
        roadGlow: glow ? T.arterial : '#000000', roadGlowInt: glow ? 0.45 : 0,
        wallA: shade(T.bTop, 1.3), wallB: shade(T.bTop, 0.55),
        roofFlat: shade(T.bTop, 0.72), roofSlate: shade(T.bTop, 0.5),
        roofTerra: shade(T.bTop, 1.1), roofGreen: shade(T.tree, 1.05),
        glass: night ? '#9fd0e8' : '#bcd8e8',
        bridge: T.bridge, trunk: '#6b4a2f', leaf: T.tree,
        hemiSky: night ? shade(T.bg2, 1.6) : shade(T.bg1, 1.05),
        hemiGround: T.bg1, hemiInt: night ? 0.9 : 0.8,
        sun: night ? shade(T.bg2, 0.9) : '#fff2dd', sunInt: night ? 0.7 : 1.4,
        fogNear: night ? 1500 : 1900, fogFar: night ? 4200 : 5200,
        exposure: night ? 1.15 : 1.0
      });
    }
  } catch (e) { /* keep the hand-tuned three */ }
})();

/* ------------------------------------------------------------------ */
/* geometry batching                                                   */
/* ------------------------------------------------------------------ */
const _tmpC = new THREE.Color();
function hex(h) { return new THREE.Color(h); }
function shadeLerp(pal, t) {
  // t in 0..1 — blend wallA (light) to wallB (dark)
  _tmpC.set(pal.wallA).lerp(hex(pal.wallB), Math.max(0, Math.min(1, t)));
  return _tmpC.clone();
}

class Batch {
  constructor() { this.pos = []; this.col = []; this.idx = []; }
  tri(a, b, c, color) {
    const base = this.pos.length / 3;
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let i = 0; i < 3; i++) this.col.push(color.r, color.g, color.b);
    this.idx.push(base, base + 1, base + 2);
  }
  quad(a, b, c, d, color) { this.tri(a, b, c, color); this.tri(a, c, d, color); }
  get empty() { return this.idx.length === 0; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
}

/* midpoint-quadratic subdivision — same smoothing family as the 2D streets */
function smoothPath(pts) {
  const P = pts.map(p => ({ x: p.x, y: p.y }));
  if (P.length < 3) return P;
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const out = [P[0]];
  let start = P[0];
  for (let i = 1; i < P.length - 1; i++) {
    const m = mid(P[i], P[i + 1]);
    const c = P[i];
    for (const t of [0.25, 0.5, 0.75]) {
      const u = 1 - t;
      out.push({
        x: u * u * start.x + 2 * u * t * c.x + t * t * m.x,
        y: u * u * start.y + 2 * u * t * c.y + t * t * m.y
      });
    }
    out.push({ x: m.x, y: m.y });
    start = m;
  }
  out.push(P[P.length - 1]);
  return out;
}

/* ribbon strip along a polyline; hw = half-width number or fn(i)->w */
function ribbon(batch, pts, hw, y, color) {
  const n = pts.length;
  if (n < 2) return;
  const w = i => (typeof hw === 'function' ? hw(i) : hw);
  const nx = new Array(n), nz = new Array(n);
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b.x - a.x, dz = b.y - a.y;
    const l = Math.hypot(dx, dz) || 1;
    dx /= l; dz /= l;
    nx[i] = -dz; nz[i] = dx;
  }
  for (let i = 0; i < n - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const L0 = [p.x + nx[i] * w(i), y, p.y + nz[i] * w(i)];
    const R0 = [p.x - nx[i] * w(i), y, p.y - nz[i] * w(i)];
    const L1 = [q.x + nx[i + 1] * w(i + 1), y, q.y + nz[i + 1] * w(i + 1)];
    const R1 = [q.x - nx[i + 1] * w(i + 1), y, q.y - nz[i + 1] * w(i + 1)];
    batch.quad(L0, R0, R1, L1, color);
  }
}

/* flat polygon via Shape triangulation; pts = [{x,y}] in 2D map coords */
function flatPoly(batch, pts, y, color) {
  if (!pts || pts.length < 3) return;
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, -pts[0].y);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, -pts[i].y);
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2); // (x,-y,0) -> (x, 0, y), normals up
  g.translate(0, y, 0);
  const p = g.getAttribute('position');
  const index = g.getIndex();
  const v = (i) => [p.getX(i), p.getY(i), p.getZ(i)];
  if (index) {
    for (let i = 0; i < index.count; i += 3) batch.tri(v(index.getX(i)), v(index.getX(i + 1)), v(index.getX(i + 2)), color);
  } else {
    for (let i = 0; i < p.count; i += 3) batch.tri(v(i), v(i + 1), v(i + 2), color);
  }
  g.dispose();
}

/* ------------------------------------------------------------------ */
/* buildings — prisms from plan corners + roof language                 */
/* ------------------------------------------------------------------ */
const EX = 2.6; // vertical exaggeration so the city reads in 3D

function addVolume(batch, v, wallColor, pal) {
  const p = v.plan;
  if (!p || p.length < 4) return;
  const c = [p[0], p[1], p[2], p[3]].map(q => [q.x, q.y]); // xz pairs
  const y0 = (v.z0 || 0) * EX, y1 = v.z1 * EX;
  const P3 = (q, y) => [q[0], y, q[1]];
  // walls
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4];
    batch.quad(P3(a, y0), P3(b, y0), P3(b, y1), P3(a, y1), wallColor);
  }
  const roof = v.roof || 'flat';
  const roofCol = v.warmRoof ? hex(pal.roofTerra) : hex(pal.roofSlate);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const mid2 = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const cx = (c[0][0] + c[1][0] + c[2][0] + c[3][0]) / 4;
  const cz = (c[0][1] + c[1][1] + c[2][1] + c[3][1]) / 4;

  if (roof === 'gable') {
    const rh = (v.ridge || 2) * EX;
    const yh = y1 + rh;
    const longAB = dist(c[0], c[1]) >= dist(c[1], c[2]);
    let rA, rB, e1a, e1b, e2a, e2b, g1a, g1b, g1c, g2a, g2b, g2c;
    if (longAB) { // ridge along ab/cd; gable ends on da and bc
      rA = mid2(c[3], c[0]); rB = mid2(c[1], c[2]);
      e1a = c[0]; e1b = c[1]; e2a = c[3]; e2b = c[2];
      g1a = c[3]; g1b = c[0]; g1c = rA; g2a = c[1]; g2b = c[2]; g2c = rB;
    } else { // ridge along bc/da; gable ends on ab and cd
      rA = mid2(c[0], c[1]); rB = mid2(c[2], c[3]);
      e1a = c[1]; e1b = c[2]; e2a = c[0]; e2b = c[3];
      g1a = c[0]; g1b = c[1]; g1c = rA; g2a = c[2]; g2b = c[3]; g2c = rB;
    }
    batch.quad(P3(e1a, y1), P3(e1b, y1), [rB[0], yh, rB[1]], [rA[0], yh, rA[1]], roofCol);
    batch.quad(P3(e2a, y1), P3(e2b, y1), [rB[0], yh, rB[1]], [rA[0], yh, rA[1]], roofCol);
    batch.tri(P3(g1a, y1), P3(g1b, y1), [g1c[0], yh, g1c[1]], wallColor);
    batch.tri(P3(g2a, y1), P3(g2b, y1), [g2c[0], yh, g2c[1]], wallColor);
  } else if (roof === 'hip') {
    const rh = (v.ridge || 2) * EX * 0.75;
    const apex = [cx, y1 + rh, cz];
    for (let i = 0; i < 4; i++) {
      batch.tri(P3(c[i], y1), P3(c[(i + 1) % 4], y1), apex, roofCol);
    }
  } else if (roof === 'sawtooth') {
    const teeth = 3;
    const rh = (v.ridge || 2) * EX;
    const longAB = dist(c[0], c[1]) >= dist(c[1], c[2]);
    // ua = long axis unit, va = short axis unit
    let ua, va, lu, lv;
    if (longAB) {
      const d = [c[1][0] - c[0][0], c[1][1] - c[0][1]]; lu = Math.hypot(d[0], d[1]) || 1; ua = [d[0] / lu, d[1] / lu];
      const e = [c[3][0] - c[0][0], c[3][1] - c[0][1]]; lv = Math.hypot(e[0], e[1]) || 1; va = [e[0] / lv, e[1] / lv];
    } else {
      const d = [c[1][0] - c[0][0], c[1][1] - c[0][1]]; lv = Math.hypot(d[0], d[1]) || 1; va = [d[0] / lv, d[1] / lv];
      const e = [c[3][0] - c[0][0], c[3][1] - c[0][1]]; lu = Math.hypot(e[0], e[1]) || 1; ua = [e[0] / lu, e[1] / lu];
    }
    const at = (su, sv, y) => [cx + ua[0] * su + va[0] * sv, y, cz + ua[1] * su + va[1] * sv];
    const glass = hex(pal.glass);
    for (let k = 0; k < teeth; k++) {
      const s0 = -lv / 2 + (k * lv) / teeth, s1 = -lv / 2 + ((k + 1) * lv) / teeth;
      // sloped roof face (high at s0, low at s1)
      batch.quad(at(-lu / 2, s0, y1 + rh), at(lu / 2, s0, y1 + rh), at(lu / 2, s1, y1), at(-lu / 2, s1, y1), roofCol);
      // vertical north-light glazing at s1
      batch.quad(at(-lu / 2, s1, y1), at(lu / 2, s1, y1), at(lu / 2, s1, y1 + rh), at(-lu / 2, s1, y1 + rh), glass);
      // end caps
      batch.tri(at(-lu / 2, s0, y1), at(-lu / 2, s1, y1), at(-lu / 2, s0, y1 + rh), wallColor);
      batch.tri(at(lu / 2, s0, y1), at(lu / 2, s1, y1), at(lu / 2, s0, y1 + rh), wallColor);
    }
  } else { // flat or green
    const top = (roof === 'green') ? hex(pal.roofGreen) : hex(pal.roofFlat);
    batch.quad(P3(c[0], y1), P3(c[1], y1), P3(c[2], y1), P3(c[3], y1), top);
  }
}

/* ------------------------------------------------------------------ */
/* touch-first orbit controls                                          */
/* ------------------------------------------------------------------ */
function makeControls(canvas, cam, bounds) {
  const home = { theta: 0.7, phi: 0.88, radius: 950, tx: (bounds.x0 + bounds.x1) / 2, ty: 0, tz: (bounds.y0 + bounds.y1) / 2 };
  const s = { ...home, tTheta: home.theta, tPhi: home.phi, tRadius: home.radius, tTx: home.tx, tTy: home.ty, tTz: home.tz };
  const pointers = new Map();
  let pinchD0 = 0, pinchR0 = 0, lastTap = 0, downXY = null;

  const clampAll = () => {
    s.tPhi = Math.max(0.12, Math.min(1.42, s.tPhi));
    s.tRadius = Math.max(180, Math.min(4200, s.tRadius));
    s.tTx = Math.max(bounds.x0 - 300, Math.min(bounds.x1 + 300, s.tTx));
    s.tTz = Math.max(bounds.y0 - 300, Math.min(bounds.y1 + 300, s.tTz));
  };
  const apply = () => {
    const k = 0.14;
    s.theta += (s.tTheta - s.theta) * k; s.phi += (s.tPhi - s.phi) * k;
    s.radius += (s.tRadius - s.radius) * k;
    s.tx += (s.tTx - s.tx) * k; s.ty += (s.tTy - s.ty) * k; s.tz += (s.tTz - s.tz) * k;
    const sp = Math.sin(s.phi), x = s.tx + s.radius * sp * Math.sin(s.theta), y = s.ty + s.radius * Math.cos(s.phi), z = s.tz + s.radius * sp * Math.cos(s.theta);
    cam.position.set(x, y, z);
    cam.lookAt(s.tx, s.ty, s.tz);
  };
  const reset = () => { Object.assign(s, { tTheta: home.theta, tPhi: home.phi, tRadius: home.radius, tTx: home.tx, tTy: home.ty, tTz: home.tz }); };

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) downXY = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchD0 = Math.hypot(a.x - b.x, a.y - b.y);
      pinchR0 = s.tRadius;
      downXY = null;
    }
  });
  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 1) {
      s.tTheta -= dx * 0.0052;
      s.tPhi -= dy * 0.0042;
      if (downXY && Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y) > 12) downXY = null;
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchD0 > 0) { // pinch -> dolly
        s.tRadius = pinchR0 * (pinchD0 / Math.max(40, d));
      } else { // two-finger drag -> pan
        const k = s.tRadius / 900;
        const sin = Math.sin(s.theta), cos = Math.cos(s.theta);
        s.tTx -= (dx * cos) * k * 0.5; s.tTz -= (-dx * sin) * k * 0.5;
        s.tTx -= (dy * -sin) * k * 0.35; s.tTz -= (dy * -cos) * k * 0.35;
      }
    }
    clampAll();
  });
  const up = e => {
    pointers.delete(e.pointerId);
    if (pointers.size === 0 && downXY) {
      const now = performance.now();
      if (now - downXY.t < 350 && now - lastTap < 450) reset();
      lastTap = now;
      downXY = null;
    }
    if (pointers.size < 2) pinchD0 = 0;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    s.tRadius *= (e.deltaY > 0 ? 1.12 : 0.89);
    clampAll();
  }, { passive: false });

  apply();
  return { update: apply, reset, targets: s };
}

/* ------------------------------------------------------------------ */
/* scene build                                                         */
/* ------------------------------------------------------------------ */
function buildScene(W, pal) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(pal.sky);
  scene.fog = new THREE.Fog(pal.sky, pal.fogNear, pal.fogFar);

  // bounds from roads
  const bounds = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  for (const r of W.roads) for (const p of r.pts) {
    if (p.x < bounds.x0) bounds.x0 = p.x; if (p.y < bounds.y0) bounds.y0 = p.y;
    if (p.x > bounds.x1) bounds.x1 = p.x; if (p.y > bounds.y1) bounds.y1 = p.y;
  }
  const cx = (bounds.x0 + bounds.x1) / 2, cz = (bounds.y0 + bounds.y1) / 2;

  // ground
  const gw = (bounds.x1 - bounds.x0) + 500, gd = (bounds.y1 - bounds.y0) + 500;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(gw, gd),
    new THREE.MeshStandardMaterial({ color: pal.ground, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(cx, 0, cz);
  ground.receiveShadow = true;
  scene.add(ground);

  // water: river ribbon + canals + lakes
  const water = new Batch();
  const wc = hex(pal.water);
  try {
    const carto = W._carto;
    if (carto) {
      if (carto.ribbon && carto.ribbon.pts && carto.ribbon.pts.length > 1) {
        const w = carto.ribbon.w;
        ribbon(water, smoothPath(carto.ribbon.pts), i => ((Array.isArray(w) ? w[Math.min(i, w.length - 1)] : w) || 8) / 2, 0.35, wc);
      }
      for (const c of (carto.canals || [])) {
        if (c.pts && c.pts.length > 1) ribbon(water, smoothPath(c.pts), (c.w || 8) / 2, 0.35, wc);
      }
      for (const l of (carto.lakes || [])) {
        const pts = l.blob || l.pts || l;
        flatPoly(water, pts, 0.35, wc);
      }
      // parks
      const park = new Batch();
      const pc = hex(pal.park);
      for (const p of (carto.parks || [])) {
        if (p.blob && p.blob.length > 2) flatPoly(park, p.blob, 0.22, pc);
      }
      if (!park.empty) {
        const m = new THREE.Mesh(park.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
        m.receiveShadow = true;
        scene.add(m);
      }
    }
  } catch (e) { /* water is decorative; never break the city */ }
  if (!water.empty) {
    const m = new THREE.Mesh(water.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.1, side: THREE.DoubleSide }));
    m.receiveShadow = true;
    scene.add(m);
  }

  // roads — arterials separated so midnight can make them glow
  const roadBatch = new Batch(), artBatch = new Batch();
  const asph = hex(pal.asphalt), artc = hex(pal.arterial);
  for (const r of W.roads) {
    const sp = smoothPath(r.pts);
    const hw = (r.width || 8) / 2 * 0.92;
    if (r.cls === 2) ribbon(artBatch, sp, hw, 0.7, artc);
    else ribbon(roadBatch, sp, hw, 0.7, asph);
  }
  const roadMat = new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.9, side: THREE.DoubleSide,
    emissive: pal.roadGlow, emissiveIntensity: pal.roadGlowInt
  });
  if (!roadBatch.empty) {
    const m = new THREE.Mesh(roadBatch.build(), roadMat);
    m.receiveShadow = true;
    scene.add(m);
  }
  if (!artBatch.empty) {
    const m = new THREE.Mesh(artBatch.build(), new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.7, side: THREE.DoubleSide,
      emissive: pal.arterialGlow, emissiveIntensity: pal.glowInt
    }));
    m.receiveShadow = true;
    scene.add(m);
  }

  // bridges — decks lifted over water
  const bridgeBatch = new Batch();
  const bc = hex(pal.bridge);
  for (const r of W.roads) {
    for (const seg of (r.bridges || [])) {
      if (seg && seg.length > 1) ribbon(bridgeBatch, smoothPath(seg), ((r.width || 8) / 2) + 2.5, 3.2, bc);
    }
  }
  if (!bridgeBatch.empty) {
    const m = new THREE.Mesh(bridgeBatch.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }));
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
  }

  // buildings — one merged mesh
  const bBatch = new Batch();
  let volCount = 0;
  for (const b of W.blocks.buildings) {
    const arch = b.architecture;
    if (!arch || !arch.volumes || !arch.volumes.length) continue;
    const wall = shadeLerp(pal, (typeof b.shade === 'number' ? b.shade : 0.5));
    for (const v of arch.volumes) { addVolume(bBatch, v, wall, pal); volCount++; }
  }
  if (!bBatch.empty) {
    const m = new THREE.Mesh(bBatch.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.02, side: THREE.DoubleSide }));
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
  }

  // trees — instanced trunks + canopies
  const trees = [];
  for (const b of W.blocks.buildings) {
    const land = b.architecture && b.architecture.landscape;
    if (land && land.trees) for (const t of land.trees) trees.push(t);
  }
  if (trees.length) {
    const dummy = new THREE.Object3D();
    const trunkG = new THREE.CylinderGeometry(0.5, 0.75, 1, 5);
    trunkG.translate(0, 0.5, 0);
    const trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: pal.trunk, roughness: 1 }), trees.length);
    const canG = new THREE.IcosahedronGeometry(1, 0);
    const cans = new THREE.InstancedMesh(canG, new THREE.MeshStandardMaterial({ color: pal.leaf, roughness: 1, flatShading: true }), trees.length);
    trees.forEach((t, i) => {
      const th = (t.h || 3) * 2.2, tr = Math.max(1.2, (t.r || 2) * 1.6);
      dummy.position.set(t.x, 0, t.y); dummy.scale.set(tr * 0.28, th * 0.5, tr * 0.28); dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix(); trunks.setMatrixAt(i, dummy.matrix);
      dummy.position.set(t.x, th * 0.5 + tr * 0.5, t.y); dummy.scale.set(tr, tr * 1.15, tr);
      dummy.updateMatrix(); cans.setMatrixAt(i, dummy.matrix);
    });
    trunks.castShadow = true; cans.castShadow = true;
    trunks.instanceMatrix.needsUpdate = true; cans.instanceMatrix.needsUpdate = true;
    scene.add(trunks); scene.add(cans);
  }

  // lights
  scene.add(new THREE.HemisphereLight(pal.hemiSky, pal.hemiGround, pal.hemiInt));
  const sun = new THREE.DirectionalLight(pal.sun, pal.sunInt);
  sun.position.set(cx - 900, 1400, cz - 500);
  sun.target.position.set(cx, 0, cz);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -1100; sc.right = 1100; sc.top = 1100; sc.bottom = -1100;
  sc.near = 100; sc.far = 4200;
  sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);

  return { scene, bounds, volCount, treeCount: trees.length };
}

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */
export async function enter3D(container) {
  if (session) return session;
  const W = findWorld();
  if (!W) throw new Error('city is still generating — try again in a moment');
  const pal = PALETTES[themeIdx()];
  // Build the scene BEFORE touching the DOM, so a data error never leaves an orphan canvas.
  const { scene, bounds } = buildScene(W, pal);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  } catch (e) {
    throw new Error('this device could not start WebGL');
  }
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = pal.exposure;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';
  container.appendChild(renderer.domElement);

  const cam = new THREE.PerspectiveCamera(42, 1, 1, 12000);
  const controls = makeControls(renderer.domElement, cam, bounds);

  const resize = () => {
    const w = container.clientWidth || window.innerWidth || 1;
    const h = container.clientHeight || window.innerHeight || 1;
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  let raf = 0, running = true;
  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, cam);
  };
  const onVis = () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (session) { running = true; loop(); }
  };
  document.addEventListener('visibilitychange', onVis);

  loop();
  // first frame now — veil can lift
  renderer.render(scene, cam);

  session = {
    exit() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', resize);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      session = null;
    },
    resetView: () => controls.reset(),
    debug: {
      triangles: () => renderer.info.render.triangles,
      calls: () => renderer.info.render.calls,
      camPos: () => [cam.position.x, cam.position.y, cam.position.z].map(v => Math.round(v)),
      state: () => ({ theta: +controls.targets.theta.toFixed(3), phi: +controls.targets.phi.toFixed(3), radius: Math.round(controls.targets.radius) }),
      setView: (v) => {
        if (v.theta !== undefined) controls.targets.tTheta = v.theta;
        if (v.phi !== undefined) controls.targets.tPhi = v.phi;
        if (v.radius !== undefined) controls.targets.tRadius = v.radius;
        if (v.tx !== undefined) controls.targets.tTx = v.tx;
        if (v.tz !== undefined) controls.targets.tTz = v.tz;
      }
    }
  };
  return session;
}

export function exit3D() {
  if (session) { const s = session; session = null; s.exit(); }
}

export function is3DActive() { return !!session; }
