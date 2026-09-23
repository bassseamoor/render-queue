/* Road Atlas 3D 2.0.1 — the living 3D twin, rebuilt in modules.
 *
 * Pure function of the live world object. The city is assembled from
 * specialist modules, each purely additive and each reading (never writing)
 * the 2D world, the baseline, and the guarded adapters:
 *
 *   road-atlas-3d-core.js      RNG, batching, topo ground sampler
 *   road-atlas-3d-terrain.js   topo-accurate heightfield + carved rivers
 *   road-atlas-3d-roads.js     terrain-following roads + bridges
 *   road-atlas-3d-buildings.js dense detailed buildings, night windows
 *   road-atlas-3d-nature.js    instanced trees, shrubs, grass
 *   road-atlas-3d-props.js     streetlights, fire hydrants
 *   road-atlas-3d-sky.js       dome, sun, moon, clouds, birds, planes
 *   road-atlas-3d-motion.js    traffic, boats, trains, day/night
 *
 * Loaded lazily (dynamic import) only when the user taps the 3D button.
 * Deterministic: same world in, same city out.
 */
import * as THREE from 'three';
import { makeGround, rngFromSeed } from './road-atlas-3d-core.js?v=2.0.0';
import { buildTerrain } from './road-atlas-3d-terrain.js?v=2.0.0';
import { buildRoads } from './road-atlas-3d-roads.js?v=2.0.0';
import { buildBuildings } from './road-atlas-3d-buildings.js?v=2.0.0';
import { buildNature } from './road-atlas-3d-nature.js?v=2.0.1';
import { buildProps } from './road-atlas-3d-props.js?v=2.0.0';
import { buildSky } from './road-atlas-3d-sky.js?v=2.0.0';
import { startMotion } from './road-atlas-3d-motion.js?v=2.0.0';

let session = null;

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

/* palettes matched to the 2D themes (full renderer schema — see v1 notes) */
const PALETTES = [
  { sky: 0xdfe9f2, ground: 0xe7dcc3, water: 0x5e9fc4, park: 0x93c46a,
    asphalt: 0xbdb5a4, arterial: 0xf5efe0, arterialGlow: 0x000000, glowInt: 0,
    roadGlow: 0x000000, roadGlowInt: 0,
    wallA: 0xd9d0bd, wallB: 0x8f8674, roofFlat: 0x9aa0a8, roofSlate: 0x707a88,
    roofTerra: 0xb26a48, roofGreen: 0x6fa055, glass: 0xbcd8e8,
    bridge: 0xcfc8b8, trunk: 0x6b4a2f, leaf: 0x5d8f4e,
    hemiSky: 0xcfe4f5, hemiGround: 0x9a8f78, hemiInt: 0.85,
    sun: 0xfff2dd, sunInt: 1.7, fogNear: 1900, fogFar: 5200, exposure: 1.0 },
  { sky: 0x05080f, ground: 0x131f38, water: 0x1a4d6e, park: 0x244a3a,
    asphalt: 0x3a5068, arterial: 0xffc37a, arterialGlow: 0xff9a3c, glowInt: 1.6,
    roadGlow: 0xff8a3c, roadGlowInt: 0.45,
    wallA: 0x6a7a96, wallB: 0x2e3a52, roofFlat: 0x4a5568, roofSlate: 0x3a4556,
    roofTerra: 0x8a563e, roofGreen: 0x3a6a4a, glass: 0x9fd0e8,
    bridge: 0x6a7a8c, trunk: 0x4a3626, leaf: 0x3a6a52,
    hemiSky: 0x3a5070, hemiGround: 0x131c30, hemiInt: 1.0,
    sun: 0xa8c4ff, sunInt: 1.1, fogNear: 1500, fogFar: 4200, exposure: 1.15 },
  { sky: 0x0f2b4d, ground: 0x17456e, water: 0x0d2c4e, park: 0x1d5a7a,
    asphalt: 0x5d97b5, arterial: 0xcfeaff, arterialGlow: 0x66c2ff, glowInt: 0.5,
    roadGlow: 0x2266aa, roadGlowInt: 0.15,
    wallA: 0xdfeaf5, wallB: 0x9fb6cc, roofFlat: 0xb9d2e8, roofSlate: 0x8fb0cc,
    roofTerra: 0xd8a080, roofGreen: 0x7fc4a0, glass: 0xe8f6ff,
    bridge: 0xa8c8e0, trunk: 0x4a6a8c, leaf: 0x4a9a8c,
    hemiSky: 0x9fd0f5, hemiGround: 0x1d3a5c, hemiInt: 0.8,
    sun: 0xe8f4ff, sunInt: 1.3, fogNear: 1900, fogFar: 5200, exposure: 1.05 }
];
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

/* touch-first orbit controls */
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
      if (pinchD0 > 0) { s.tRadius = pinchR0 * (pinchD0 / Math.max(40, d)); }
      else {
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

export async function enter3D(container) {
  if (session) return session;
  const W = findWorld();
  if (!W) throw new Error('city is still generating — try again in a moment');
  const pal = PALETTES[themeIdx()];

  /* shared city context — every module reads from this, none writes the world */
  const bounds = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
  for (const r of W.roads) for (const p of r.pts) {
    if (p.x < bounds.x0) bounds.x0 = p.x; if (p.y < bounds.y0) bounds.y0 = p.y;
    if (p.x > bounds.x1) bounds.x1 = p.x; if (p.y > bounds.y1) bounds.y1 = p.y;
  }
  const CITY = {
    W, pal, bounds,
    ground: makeGround(W),
    rng: rngFromSeed((W.seed || 'x') + '|3d-city-v2'),
    scene: null, groundH: null, roadY: null, sun: null, hemi: null,
    handles: {}
  };
  if (!CITY.ground.ready) throw new Error('terrain data is not ready yet');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(pal.sky);
  scene.fog = new THREE.Fog(pal.sky, pal.fogNear, pal.fogFar);
  CITY.scene = scene;

  /* build the city module by module (terrain first — it defines the floor) */
  const modules = [];
  function addModule(m) { scene.add(m.group); modules.push(m); return m; }
  try {
    const terrain = addModule(buildTerrain(CITY));   // sets CITY.groundH
    const roads = addModule(buildRoads(CITY));       // sets CITY.roadY via return
    CITY.roadY = roads.roadY;
    CITY.handles.buildings = addModule(buildBuildings(CITY));
    CITY.handles.nature = addModule(buildNature(CITY));
    CITY.handles.props = addModule(buildProps(CITY));
    CITY.handles.sky = addModule(buildSky(CITY));
    CITY.counts = {
      roads: roads.counts, buildings: CITY.handles.buildings.counts,
      nature: CITY.handles.nature.counts, props: CITY.handles.props.counts,
      sky: CITY.handles.sky.counts
    };
  } catch (e) {
    throw new Error('the 3D city failed to build: ' + (e && e.message));
  }

  /* lights */
  const hemi = new THREE.HemisphereLight(pal.hemiSky, pal.hemiGround, pal.hemiInt);
  scene.add(hemi);
  const cx = (bounds.x0 + bounds.x1) / 2, cz = (bounds.y0 + bounds.y1) / 2;
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
  CITY.sun = sun; CITY.hemi = hemi;

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

  const cam = new THREE.PerspectiveCamera(42, 1, 1, 14000);
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
  let motion = null;
  try {
    motion = startMotion({
      scene, W, pal, sun, hemi, renderer, bounds,
      groundH: CITY.groundH, roadY: CITY.roadY, handles: CITY.handles
    });
  } catch (e) { console.warn('[3d-motion] disabled:', e); }
  const loop = () => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (motion) { try { motion.update(performance.now()); } catch (e) { /* keep rendering */ } }
    controls.update();
    renderer.render(scene, cam);
  };
  const onVis = () => {
    if (document.hidden) { running = false; cancelAnimationFrame(raf); }
    else if (session) { running = true; loop(); }
  };
  document.addEventListener('visibilitychange', onVis);

  loop();
  renderer.render(scene, cam);

  session = {
    exit() {
      running = false;
      cancelAnimationFrame(raf);
      if (motion) { try { motion.dispose(); } catch (e) { /* ignore */ } motion = null; }
      for (const m of modules) { try { m.dispose(); } catch (e) { /* ignore */ } }
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
      scene: () => scene, triangles: () => renderer.info.render.triangles,
      calls: () => renderer.info.render.calls,
      camPos: () => [cam.position.x, cam.position.y, cam.position.z].map(v => Math.round(v)),
      state: () => ({ theta: +controls.targets.theta.toFixed(3), phi: +controls.targets.phi.toFixed(3), radius: Math.round(controls.targets.radius) }),
      setView: (v) => {
        if (v.theta !== undefined) controls.targets.tTheta = v.theta;
        if (v.phi !== undefined) controls.targets.tPhi = v.phi;
        if (v.radius !== undefined) controls.targets.tRadius = v.radius;
        if (v.tx !== undefined) controls.targets.tTx = v.tx;
        if (v.tz !== undefined) controls.targets.tTz = v.tz;
      },
      counts: () => CITY.counts
    }
  };
  return session;
}

export function exit3D() {
  if (session) { const s = session; session = null; s.exit(); }
}

export function is3DActive() { return !!session; }
