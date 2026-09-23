// Fireplace Studio — world/artwork.js. See README.md for ownership and replacement boundaries.


const FPFrames = (()=>{

/* ============================================================
   FPFrames v1 — deterministic framed artwork for Fireplace Studio
   ------------------------------------------------------------
   Self-contained. No FORGE dependency at runtime: the 30 artworks
   are baked into art/fireplace-frames.jpg (5x6 grid, 320x400 cells).

   Selection is a pure function of the studio seed string
   (the "#3"+8-hex 13-parameter packing is READ ONLY, never modified).

   - build(seedString)      -> frames[] (pure JS, no GL)
   - buildHost(frames, draw, M_BOX) -> pushes molding/mat/backing
        boxes through the host's own draw() (full lit shading +
        shadows for free). Exactly 5 host draws per frame.
   - create(gl) / loadAtlas(FH,url) / setArt(FH,frames) /
     render(FH,view,proj,tint) -> the artwork itself as ONE
        batched draw call (all quads, one VBO, one texture).

   Wall: back/entry wall face at z = -4.0 (x in [-5.2,5.2]).
   Fireplace wall and glass are never used.

   If the atlas is missing, frames degrade to a dark placeholder —
   the scene never breaks.
   ============================================================ */

'use strict';

var ART_COUNT = 30;
var GRID_C = 5, GRID_R = 6;
var ATLAS_URL = 'art/fireplace-frames.jpg';
var WALL_Z = -4.0;          // back wall face
var ART_Z  = -3.978;        // art quad plane (recessed behind molding front)

/* ---------------- deterministic RNG ---------------- */
function fnv1a(str) {
  var h = 0x811c9dc5;
  var s = 'fp-frames-v1:' + str;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffled(rng, n) {
  var a = [], i, j, t;
  for (i = 0; i < n; i++) a.push(i);
  for (i = n - 1; i > 0; i--) { j = (rng() * (i + 1)) | 0; t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ---------------- artwork UVs (GL convention, v-up) ---------------- */
function artUV(i) {
  var c = i % GRID_C, r = (i / GRID_C) | 0;
  return [c / GRID_C, 1 - (r + 1) / GRID_R, (c + 1) / GRID_C, 1 - r / GRID_R];
}

/* ---------------- 30 placement presets ----------------
   Generated deterministically with a FIXED salt so the set is stable
   across runs and seeds. Each preset: {kind, mixed, rects:[{x,y,w,h}]}.
   Frame counts: singles 8, medium 6, pairs 6, triptych 6, quad 8,
   salon 6-8. All rects validated non-overlapping (see test). */
var PRESETS = (function genPresets() {
  var rng = mulberry32(fnv1a('fp-presets-v1'));
  var P = [];
  function F(x, y, w) { return { x: x, y: y, w: w, h: w * 1.25 }; }
  function clear(rs, r, m) {
    for (var i = 0; i < rs.length; i++) {
      var o = rs[i];
      if (Math.abs(o.x - r.x) < (o.w + r.w) / 2 + m &&
          Math.abs(o.y - r.y) < (o.h + r.h) / 2 + m) return false;
    }
    return true;
  }
  function inWall(r) {
    return (r.x - r.w / 2 > -5.0) && (r.x + r.w / 2 < 5.0) &&
           (r.y - r.h / 2 > 0.70) && (r.y + r.h / 2 < 2.90);
  }
  var v, i, t, rs, ok, r, w, x0, x1, cy;

  /* 8 singles: loose gallery rows of 8 small frames */
  for (v = 0; v < 8; v++) {
    rs = []; ok = false; t = 0;
    while (!ok && t++ < 300) {
      rs = []; w = 0.44 + rng() * 0.10;
      x0 = -4.55 + rng() * 0.3; x1 = 4.55 - rng() * 0.3; cy = 1.85 + rng() * 0.30;
      for (i = 0; i < 8; i++) {
        r = F(x0 + (x1 - x0) * i / 7 + (rng() - 0.5) * 0.15, cy + (rng() - 0.5) * 0.30, w);
        if (!inWall(r) || !clear(rs, r, 0.10)) break;
        rs.push(r);
      }
      ok = rs.length === 8;
    }
    P.push({ kind: 'singles', mixed: false, rects: rs });
  }
  /* 6 medium: rows of 6 medium frames */
  for (v = 0; v < 6; v++) {
    rs = []; ok = false; t = 0;
    while (!ok && t++ < 300) {
      rs = []; w = 0.60 + rng() * 0.10;
      x0 = -4.35 + rng() * 0.3; x1 = 4.35 - rng() * 0.3; cy = 1.85 + rng() * 0.25;
      for (i = 0; i < 6; i++) {
        r = F(x0 + (x1 - x0) * i / 5 + (rng() - 0.5) * 0.10, cy + (rng() - 0.5) * 0.22, w);
        if (!inWall(r) || !clear(rs, r, 0.12)) break;
        rs.push(r);
      }
      ok = rs.length === 6;
    }
    P.push({ kind: 'medium', mixed: false, rects: rs });
  }
  /* 6 pairs: 3 pair clusters */
  for (v = 0; v < 6; v++) {
    rs = []; ok = false; t = 0;
    while (!ok && t++ < 300) {
      rs = []; w = 0.48 + rng() * 0.08;
      var gap = 0.16 + rng() * 0.06;
      var cxs = [-3.1 + rng() * 0.6, 0.1 + (rng() - 0.5) * 0.8, 3.2 + (rng() - 0.5) * 0.6];
      cy = 1.90 + rng() * 0.2;
      for (i = 0; i < 3; i++) {
        var y = cy + (rng() - 0.5) * 0.18;
        var r1 = F(cxs[i] - (w / 2 + gap / 2), y, w);
        var r2 = F(cxs[i] + (w / 2 + gap / 2), y + (rng() - 0.5) * 0.06, w);
        if (!inWall(r1) || !inWall(r2) || !clear(rs, r1, 0.12) || !clear(rs, r2, 0.12)) break;
        rs.push(r1, r2);
      }
      ok = rs.length === 6;
    }
    P.push({ kind: 'pairs', mixed: false, rects: rs });
  }
  /* 4 triptychs: 2 triptych clusters */
  for (v = 0; v < 4; v++) {
    rs = []; ok = false; t = 0;
    while (!ok && t++ < 300) {
      rs = []; w = 0.44 + rng() * 0.06;
      var gap2 = 0.13 + rng() * 0.05;
      var tcx = [-2.5 + rng() * 0.8, 2.5 + (rng() - 0.5) * 0.8];
      cy = 1.90 + rng() * 0.2;
      for (i = 0; i < 2; i++) {
        var y2 = cy + (rng() - 0.5) * 0.16;
        for (var k = -1; k <= 1; k++) {
          r = F(tcx[i] + k * (w + gap2), y2, w);
          if (!inWall(r) || !clear(rs, r, 0.12)) break;
          rs.push(r);
        }
        if (rs.length !== (i + 1) * 3) break;
      }
      ok = rs.length === 6;
    }
    P.push({ kind: 'triptych', mixed: false, rects: rs });
  }
  /* 3 quads: two 2x2 grids */
  for (v = 0; v < 3; v++) {
    rs = []; ok = false; t = 0;
    while (!ok && t++ < 300) {
      rs = []; w = 0.48 + rng() * 0.06;
      var g2 = 0.14 + rng() * 0.04;
      var gcx = [-2.6 + rng() * 0.7, 2.6 + (rng() - 0.5) * 0.7];
      var gcy = [1.90 + rng() * 0.15, 1.90 + rng() * 0.15];
      for (i = 0; i < 2; i++) {
        for (var a = -1; a <= 1; a += 2) for (var b = -1; b <= 1; b += 2) {
          r = F(gcx[i] + a * (w + g2) / 2, gcy[i] + b * (w * 1.25 + g2) / 2, w);
          if (!inWall(r) || !clear(rs, r, 0.12)) break;
          rs.push(r);
        }
        if (rs.length !== (i + 1) * 4) break;
      }
      ok = rs.length === 8;
    }
    P.push({ kind: 'quad', mixed: false, rects: rs });
  }
  /* 3 salon: 6-8 mixed-size scattered frames */
  for (v = 0; v < 3; v++) {
    rs = []; ok = false; t = 0;
    var target = 6 + ((rng() * 3) | 0);
    while (!ok && t++ < 600) {
      rs = [];
      for (i = 0; i < target; i++) {
        w = 0.40 + rng() * 0.26;
        r = F(-4.5 + rng() * 9.0, 1.15 + rng() * 1.30, w);
        if (!inWall(r) || !clear(rs, r, 0.12)) break;
        rs.push(r);
      }
      ok = rs.length === target;
    }
    P.push({ kind: 'salon', mixed: true, rects: rs });
  }
  return P;
})();

/* ---------------- frame styles ---------------- */
var STYLES = [
  { name: 'black',  mold: 0.035, mat: 7, tint: [0.06, 0.06, 0.07],  matBoard: true,  matTint: [0.88, 0.86, 0.80] },
  { name: 'oak',    mold: 0.050, mat: 1, tint: [0.55, 0.40, 0.26],  matBoard: true,  matTint: [0.93, 0.92, 0.88] },
  { name: 'walnut', mold: 0.045, mat: 1, tint: [0.30, 0.20, 0.14],  matBoard: true,  matTint: [0.88, 0.86, 0.80] },
  { name: 'white',  mold: 0.040, mat: 3, tint: [0.92, 0.90, 0.86],  matBoard: true,  matTint: [0.95, 0.94, 0.90] },
  { name: 'brass',  mold: 0.030, mat: 7, tint: [0.72, 0.53, 0.20],  matBoard: false, matTint: [0.90, 0.88, 0.82] },
];
var MAT_MARGIN = 0.06;

/* ---------------- build(seedString) -> frames ---------------- */
function build(seedString) {
  var rng = mulberry32(fnv1a(String(seedString)));
  var pOrder = shuffled(rng, PRESETS.length);
  var preset = PRESETS[pOrder[0]];
  var deck = shuffled(rng, ART_COUNT);
  var frames = [];
  var primStyle = (rng() * STYLES.length) | 0;
  for (var i = 0; i < preset.rects.length; i++) {
    var rc = preset.rects[i];
    var si = preset.mixed && rng() < 0.45 ? ((rng() * STYLES.length) | 0) : primStyle;
    var uv = artUV(deck[i]);
    frames.push({
      x: rc.x, y: rc.y, w: rc.w, h: rc.h,
      art: deck[i], style: si,
      u0: uv[0], v0: uv[1], u1: uv[2], v1: uv[3],
    });
  }
  return frames;
}

/* ---------------- host geometry (molding + mat + backing) ----------------
   Exactly 5 draw() calls per frame:
     1 backing (or mat board), 4 molding rails. */
function buildHost(frames, draw, M_BOX) {
  var n = 0;
  for (var i = 0; i < frames.length; i++) {
    var f = frames[i], st = STYLES[f.style];
    var mw = st.mold;
    var iw = f.w + (st.matBoard ? MAT_MARGIN * 2 : 0.012);
    var ih = f.h + (st.matBoard ? MAT_MARGIN * 2 : 0.012);
    var ow = iw + mw * 2, oh = ih + mw * 2;
    var zc = WALL_Z + 0.015; // molding center: spans [-4.0,-3.97]
    if (st.matBoard) {
      draw(M_BOX, f.x, f.y, WALL_Z + 0.006, iw, ih, 0.012, 5, { tintA: st.matTint, rough: 0.95 });
    } else {
      draw(M_BOX, f.x, f.y, WALL_Z + 0.006, iw, ih, 0.012, 3, { tintA: [0.10, 0.10, 0.10], rough: 0.9 });
    }
    n++;
    var mz = zc;
    draw(M_BOX, f.x, f.y + oh / 2 - mw / 2, mz, ow, mw, 0.03, st.mat, { tintA: st.tint, rough: 0.55 });
    draw(M_BOX, f.x, f.y - oh / 2 + mw / 2, mz, ow, mw, 0.03, st.mat, { tintA: st.tint, rough: 0.55 });
    draw(M_BOX, f.x - ow / 2 + mw / 2, f.y, mz, mw, oh - 2 * mw, 0.03, st.mat, { tintA: st.tint, rough: 0.55 });
    draw(M_BOX, f.x + ow / 2 - mw / 2, f.y, mz, mw, oh - 2 * mw, 0.03, st.mat, { tintA: st.tint, rough: 0.55 });
    n += 4;
  }
  return n;
}

/* ---------------- GL: batched art quads, one draw call ---------------- */
var VS_SRC = '#version 300 es\n' +
  'layout(location=0) in vec3 aPos;\n' +
  'layout(location=1) in vec2 aUV;\n' +
  'uniform mat4 uProj; uniform mat4 uView;\n' +
  'out vec2 vUV;\n' +
  'void main(){ vUV=aUV; gl_Position=uProj*uView*vec4(aPos,1.0); }\n';
var FS_SRC = '#version 300 es\n' +
  'precision highp float;\n' +
  'in vec2 vUV; uniform sampler2D uTex; uniform vec3 uTint;\n' +
  'out vec4 oC;\n' +
  'void main(){ vec3 c=texture(uTex,vUV).rgb; oC=vec4(c*uTint,1.0); }\n';

function compile(gl, type, src) {
  var s = gl.createShader(type);
  gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    var log = gl.getShaderInfoLog(s); gl.deleteShader(s);
    throw new Error('FPFrames shader: ' + log);
  }
  return s;
}

function create(gl) {
  var prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS_SRC));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS_SRC));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error('FPFrames link: ' + gl.getProgramInfoLog(prog));
  var vao = gl.createVertexArray();
  var vbo = gl.createBuffer();
  var ibo = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bindVertexArray(null);
  /* 1x1 dark placeholder until the atlas loads */
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([14, 13, 15, 255]));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  return {
    gl: gl, prog: prog, vao: vao, vbo: vbo, ibo: ibo, tex: tex,
    ready: false, nquads: 0,
    uProj: gl.getUniformLocation(prog, 'uProj'),
    uView: gl.getUniformLocation(prog, 'uView'),
    uTex: gl.getUniformLocation(prog, 'uTex'),
    uTint: gl.getUniformLocation(prog, 'uTint'),
  };
}

function loadAtlas(FH, url) {
  var gl = FH.gl;
  var img = new Image();
  img.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, FH.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    FH.ready = true;
  };
  img.onerror = function () { FH.ready = false; /* placeholder stays */ };
  img.src = url || ATLAS_URL;
}

function setArt(FH, frames) {
  var gl = FH.gl;
  var verts = new Float32Array(frames.length * 4 * 5);
  var idx = new Uint16Array(frames.length * 6);
  for (var i = 0; i < frames.length; i++) {
    var f = frames[i], hw = f.w / 2, hh = f.h / 2, o = i * 20;
    verts[o + 0] = f.x - hw; verts[o + 1] = f.y - hh; verts[o + 2] = ART_Z;
    verts[o + 3] = f.u0;     verts[o + 4] = f.v0;
    verts[o + 5] = f.x + hw; verts[o + 6] = f.y - hh; verts[o + 7] = ART_Z;
    verts[o + 8] = f.u1;     verts[o + 9] = f.v0;
    verts[o + 10] = f.x + hw; verts[o + 11] = f.y + hh; verts[o + 12] = ART_Z;
    verts[o + 13] = f.u1;    verts[o + 14] = f.v1;
    verts[o + 15] = f.x - hw; verts[o + 16] = f.y + hh; verts[o + 17] = ART_Z;
    verts[o + 18] = f.u0;    verts[o + 19] = f.v1;
    var q = i * 4, e = i * 6;
    idx[e + 0] = q; idx[e + 1] = q + 1; idx[e + 2] = q + 2;
    idx[e + 3] = q; idx[e + 4] = q + 2; idx[e + 5] = q + 3;
  }
  gl.bindVertexArray(FH.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, FH.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, FH.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  FH.nquads = frames.length;
}

function render(FH, view, proj, tint) {
  if (!FH.nquads) return 0;
  var gl = FH.gl;
  gl.useProgram(FH.prog);
  gl.uniformMatrix4fv(FH.uProj, false, proj);
  gl.uniformMatrix4fv(FH.uView, false, view);
  gl.uniform3fv(FH.uTint, tint || [1, 1, 1]);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, FH.tex);
  gl.uniform1i(FH.uTex, 0);
  gl.bindVertexArray(FH.vao);
  gl.drawElements(gl.TRIANGLES, FH.nquads * 6, gl.UNSIGNED_SHORT, 0);
  gl.bindVertexArray(null);
  return 1;
}

/* Room-light tint for the artwork: ambient plus a warm kiss from the fire.
   rig: the studio's computeRig() result ({amb:[r,g,b], fireI:number}),
   fireCol: S.fireCol ([r,g,b]), flick: S.flick (0..~1.5).
   ceilI (optional): ceiling-downlight brightness 0..1.5, adds a warm lift. */
function lightingFromRig(rig, fireCol, flick, ceilI) {
  var amb = rig.amb, fi = rig.fireI * 2.0 * flick;
  var cl = (typeof ceilI === 'number' && ceilI > 0) ? ceilI * 0.30 : 0;
  return [
    amb[0] * 0.95 + fireCol[0] * fi * 0.22 + 0.34 * cl,
    amb[1] * 0.95 + fireCol[1] * fi * 0.22 + 0.31 * cl,
    amb[2] * 0.95 + fireCol[2] * fi * 0.22 + 0.26 * cl
  ];
}

var FPFrames = {
  ART_COUNT: ART_COUNT,
  ATLAS_URL: ATLAS_URL,
  WALL_Z: WALL_Z,
  PRESETS: PRESETS,
  STYLES: STYLES,
  artUV: artUV,
  build: build,
  buildHost: buildHost,
  create: create,
  loadAtlas: loadAtlas,
  load: loadAtlas,
  setArt: setArt,
  setQuads: setArt,
  lightingFromRig: lightingFromRig,
  render: render,
};







return FPFrames;
})();

export { FPFrames };
