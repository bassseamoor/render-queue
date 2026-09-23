// Fireplace Studio — world/particles.js. See README.md for ownership and replacement boundaries.
import { gl } from '../renderer/context.js';
import { mulberry32 } from '../core/math.js';
import { S } from '../core/state.js';
import { PU, partProg } from '../renderer/programs.js';
import { settings } from '../core/settings.js';

const partVAO=(function(){
  const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
  const qb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,qb);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-0.5,-0.5, 0.5,-0.5, -0.5,0.5, 0.5,0.5]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const sb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,sb);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,4,gl.FLOAT,false,0,0);
  gl.vertexAttribDivisor(1,1);
  gl.bindVertexArray(null);
  return {vao, seedBuf:sb};
})();
function makePartSystem(o){
  const n=o.count, seeds=new Float32Array(n*4);
  const r=mulberry32((o.seed^0x1234)>>>0);
  for(let i=0;i<n*4;i++) seeds[i]=r();
  return { mode:o.mode, count:n, origin:o.origin, rise:o.rise||1, size:o.size||0.1,
    spread:o.spread||0.5, rate:o.rate||0.3, sway:o.sway||0.05, grow:o.grow||1,
    alpha:o.alpha==null?1:o.alpha, seeds };
}
function buildParticles(st){
  S.parts.length=0;
  const sd=st.seed>>>0;
  const fl=[14,26,40][st.fire|0];
  S.parts.push(makePartSystem({mode:0, count:fl, seed:sd^0xF1, origin:[4.50,0.52,-0.9],
    rise:0.90, size:0.55, spread:0.36, rate:0.75, sway:0.09, grow:1.2, alpha:0.80}));
  const tgR=[6,10,14][st.fire|0], tgM=[5,8,12][st.fire|0], tgF=[4,7,10][st.fire|0];
  S.parts.push(makePartSystem({mode:7, count:tgR, seed:sd^0x71, origin:[4.70,0.48,-0.9],
    rise:1.15, size:0.43, spread:0.27, rate:1.15, sway:0.13, grow:1.25, alpha:0.75}));
  S.parts.push(makePartSystem({mode:7, count:tgM, seed:sd^0x72, origin:[4.58,0.50,-0.9],
    rise:1.05, size:0.38, spread:0.25, rate:1.35, sway:0.15, grow:1.2, alpha:0.72}));
  S.parts.push(makePartSystem({mode:7, count:tgF, seed:sd^0x73, origin:[4.40,0.46,-0.9],
    rise:0.85, size:0.33, spread:0.22, rate:1.50, sway:0.16, grow:1.15, alpha:0.70}));
  const emN=Math.round((st.sparks|0)/100*46);
  if(emN>0) S.parts.push(makePartSystem({mode:1, count:emN, seed:sd^0xE2, origin:[4.55,0.70,-0.9],
    rise:1.7, size:0.022, spread:0.35, rate:0.5, sway:0.16, grow:0.6, alpha:0.9}));
  S.parts.push(makePartSystem({mode:2, count:9, seed:sd^0x5E, origin:[4.50,1.35,-0.9],
    rise:1.5, size:0.5, spread:0.2, rate:0.22, sway:0.25, grow:2.6, alpha:0.30}));
  S.parts.push(makePartSystem({mode:3, count:4, seed:sd^0x60, origin:[4.55,0.34,-0.9],
    rise:0.02, size:0.68, spread:0.45, rate:0.25, sway:0, grow:1, alpha:0.38}));
  const shN=[6,9,12][st.fire|0];
  S.parts.push(makePartSystem({mode:6, count:shN, seed:sd^0xF6, origin:[4.55,0.72,-0.9],
    rise:0.01, size:0.55, spread:0.16, rate:0.40, sway:0, grow:1, alpha:0.70}));
  const w=st.weather|0;
  if(w===3) S.parts.push(makePartSystem({mode:4, count:560, seed:sd^0x5F, origin:[0,8.5,6],
    rise:8.0, size:0.035, spread:17, rate:0.16, sway:0.35, grow:1, alpha:0.85}));
  else if(w===2) S.parts.push(makePartSystem({mode:5, count:520, seed:sd^0x2A, origin:[0,9,6],
    rise:9.0, size:0.30, spread:17, rate:0.9, sway:0.02, grow:1, alpha:0.5}));
}
/* firebox log segments for geometry-aware flames: (x,y,z,radius) and (axis.xyz,halfLen).
   Matches the 5-log stack in generateScene: A/B along z, C crosswise, D leaning, E chunk.
   NOTE: geoCyl has unit radius 0.5, so true radius = 0.5*sx from the draw() calls. */
const FIRE_LOGS=new Float32Array([4.60,0.475,-0.92,0.075, 4.73,0.465,-0.88,0.07, 4.66,0.615,-0.90,0.065, 4.62,0.575,-0.68,0.0575, 4.70,0.60,-1.18,0.055]);
const FIRE_LOGAX=new Float32Array([0,0,1,0.44, 0,0,1,0.40, -0.993,0,0.120,0.36, -0.8525,0,0.5227,0.31, 0,0,1,0.275]);
function drawParticles(view, proj, te){
  gl.enable(gl.BLEND);
  gl.depthMask(false);
  gl.useProgram(partProg);
  /* burn stage: fixed per seed, derived from the packed fire param (0/1/2 -> 0.30/0.55/0.80).
     No time progression: the ambient fire must never die out mid-render. */
  gl.uniform1f(PU("uBurn"), 0.30+0.25*(settings.fire|0));
  gl.uniform4fv(PU("uLogs"), FIRE_LOGS);
  gl.uniform4fv(PU("uLogAx"), FIRE_LOGAX);
  gl.uniform3fv(PU("uCamPos"), S.cam.eye);
  gl.uniformMatrix4fv(PU("uProj"),false,proj);
  gl.uniformMatrix4fv(PU("uView"),false,view);
  gl.uniform1f(PU("uTime"),te);
  gl.uniform1f(PU("uFlick"),S.flick);
  gl.bindVertexArray(partVAO.vao);
  for(const p of S.parts){
    if(p.mode===3||p.mode===6) gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
    else gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.uniform3fv(PU("uOrigin"),p.origin);
    gl.uniform1f(PU("uMode"),p.mode);
    gl.uniform1f(PU("uRise"),p.rise);
    gl.uniform1f(PU("uSize"),p.size);
    gl.uniform1f(PU("uSpread"),p.spread);
    gl.uniform1f(PU("uRate"),p.rate);
    gl.uniform1f(PU("uSway"),p.sway);
    gl.uniform1f(PU("uGrow"),p.grow);
    gl.uniform1f(PU("uAlpha"),p.alpha);
    gl.bindBuffer(gl.ARRAY_BUFFER,partVAO.seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER,p.seeds,gl.DYNAMIC_DRAW);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,p.count);
  }
  gl.bindVertexArray(null);
  gl.depthMask(true); gl.disable(gl.BLEND);
}

export { buildParticles, drawParticles };
