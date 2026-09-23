// Fireplace Studio — world/dressing.js. See README.md for ownership and replacement boundaries.
import { clamp, mulberry32 } from '../core/math.js';
import { settingsSeedString } from '../core/seeds.js';
import { FPFrames } from './artwork.js';
import { M_BOX } from './geometry.js';

const dress = { ceil: 1.0, mantle: true };
try {
  const _dd = JSON.parse(localStorage.getItem("fireplace-studio-dress-v1") || "{}");
  if (typeof _dd.ceil === "number" && isFinite(_dd.ceil)) dress.ceil = clamp(_dd.ceil, 0, 1.5);
  if (typeof _dd.mantle === "boolean") dress.mantle = _dd.mantle;
} catch (e) {}
function dressSave(){
  try { localStorage.setItem("fireplace-studio-dress-v1", JSON.stringify(dress)); } catch (e) {}
}
function dressCeil(){ return dress ? dress.ceil : 1.0; }
function dressHash(str){
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
/* Four recessed downlights between the ceiling beams (world positions). */
const CEIL_POS = [[3.76,3.16,1.0],[1.20,3.16,1.0],[-1.36,3.16,1.0],[-3.92,3.16,1.0]];
const CEIL_FLAT = new Float32Array([3.76,3.16,1.0, 1.20,3.16,1.0, -1.36,3.16,1.0, -3.92,3.16,1.0]);
const CEIL_COL = [1.0, 0.92, 0.78];
function buildMantleFrameList(){
  const rng = mulberry32((dressHash(settingsSeedString()) ^ 0x4A47E1) >>> 0);
  const n = 2 + ((rng() * 3) | 0);
  const deck = [];
  for (let i = 0; i < 30; i++) deck.push(i);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0, t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }
  const primStyle = (rng() * FPFrames.STYLES.length) | 0;
  const widths = [];
  for (let i = 0; i < n; i++) widths.push(0.30 + rng() * 0.18);
  const gap = 0.10;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
  let z = -0.9 - total / 2;
  const frames = [];
  for (let i = 0; i < n; i++) {
    const w = widths[i], h = w * 1.25;
    const zc = z + w / 2; z += w + gap;
    const uv = FPFrames.artUV(deck[i]);
    frames.push({
      x: 4.385, y: 1.525 + h / 2, z: zc, w, h,
      art: deck[i], style: primStyle,
      u0: uv[0], v0: uv[1], u1: uv[2], v1: uv[3],
    });
  }
  return frames;
}
/* Mantle host geometry: mat board/backing + 4 molding rails per frame,
   oriented for the YZ plane (frames face -x, toward the room). */
function buildMantleHost(frames, drawFn){
  const MAT_MARGIN = 0.06, MX = 4.395;
  for (const f of frames) {
    const st = FPFrames.STYLES[f.style], mw = st.mold;
    const iw = f.w + (st.matBoard ? MAT_MARGIN * 2 : 0.012);
    const ih = f.h + (st.matBoard ? MAT_MARGIN * 2 : 0.012);
    const ow = iw + mw * 2, oh = ih + mw * 2;
    if (st.matBoard) drawFn(M_BOX, MX, f.y, f.z, 0.012, ih, iw, 5, { tintA: st.matTint, rough: 0.95 });
    else drawFn(M_BOX, MX, f.y, f.z, 0.012, ih, iw, 3, { tintA: [0.10, 0.10, 0.10], rough: 0.9 });
    drawFn(M_BOX, MX, f.y + oh / 2 - mw / 2, f.z, 0.03, mw, ow, st.mat, { tintA: st.tint, rough: 0.55 });
    drawFn(M_BOX, MX, f.y - oh / 2 + mw / 2, f.z, 0.03, mw, ow, st.mat, { tintA: st.tint, rough: 0.55 });
    drawFn(M_BOX, MX, f.y, f.z - ow / 2 + mw / 2, 0.03, oh - 2 * mw, mw, st.mat, { tintA: st.tint, rough: 0.55 });
    drawFn(M_BOX, MX, f.y, f.z + ow / 2 - mw / 2, 0.03, oh - 2 * mw, mw, st.mat, { tintA: st.tint, rough: 0.55 });
  }
}
/* Batched art quads for the mantle frames: YZ plane at x=f.x, facing -x. */
function setMantleQuads(FH, frames){
  const gl2 = FH.gl;
  const verts = new Float32Array(frames.length * 4 * 5);
  const idx = new Uint16Array(frames.length * 6);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i], hw = f.w / 2, hh = f.h / 2, o = i * 20;
    verts[o + 0] = f.x; verts[o + 1] = f.y - hh; verts[o + 2] = f.z - hw;
    verts[o + 3] = f.u0; verts[o + 4] = f.v0;
    verts[o + 5] = f.x; verts[o + 6] = f.y - hh; verts[o + 7] = f.z + hw;
    verts[o + 8] = f.u1; verts[o + 9] = f.v0;
    verts[o + 10] = f.x; verts[o + 11] = f.y + hh; verts[o + 12] = f.z + hw;
    verts[o + 13] = f.u1; verts[o + 14] = f.v1;
    verts[o + 15] = f.x; verts[o + 16] = f.y + hh; verts[o + 17] = f.z - hw;
    verts[o + 18] = f.u0; verts[o + 19] = f.v1;
    const q = i * 4, e = i * 6;
    idx[e + 0] = q; idx[e + 1] = q + 1; idx[e + 2] = q + 2;
    idx[e + 3] = q; idx[e + 4] = q + 2; idx[e + 5] = q + 3;
  }
  gl2.bindVertexArray(FH.vao);
  gl2.bindBuffer(gl2.ARRAY_BUFFER, FH.vbo);
  gl2.bufferData(gl2.ARRAY_BUFFER, verts, gl2.STATIC_DRAW);
  gl2.bindBuffer(gl2.ELEMENT_ARRAY_BUFFER, FH.ibo);
  gl2.bufferData(gl2.ELEMENT_ARRAY_BUFFER, idx, gl2.STATIC_DRAW);
  gl2.bindVertexArray(null);
  FH.nquads = frames.length;
}

export { CEIL_COL, CEIL_FLAT, CEIL_POS, buildMantleFrameList, buildMantleHost, dress, dressCeil, dressSave, setMantleQuads };
