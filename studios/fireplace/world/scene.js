// Fireplace Studio — world/scene.js. See README.md for ownership and replacement boundaries.
import { mMul, mRx, mRy, mRz, mS, mT, mulberry32 } from '../core/math.js';
import { S } from '../core/state.js';
import { ensureBaked } from './materials.js';
import { M_BOX, M_CYL, M_RBOX, M_RBOXS } from './geometry.js';
import { CEIL_POS, buildMantleFrameList, buildMantleHost, dress, dressCeil, setMantleQuads } from './dressing.js';
import { artwork } from './artwork-state.js';
import { FPFrames } from './artwork.js';
import { settingsSeedString } from '../core/seeds.js';
import { buildShagNubs } from './surface-detail.js';

function draw(mesh, x,y,z, sx,sy,sz, mat, o){
  o=o||{};
  let m = mT(x,y,z);
  if (o.rx) m = mMul(m, mRx(o.rx));
  if (o.ry) m = mMul(m, mRy(o.ry));
  if (o.rz) m = mMul(m, mRz(o.rz));
  m = mMul(m, mS(sx,sy,sz));
  S.draws.push({ mesh, model:m, mat,
    tintA:o.tintA||[1,1,1], emis:o.emis||[0,0,0], ember:o.ember?1:0, char:o.char?1:0,
    rough:o.rough!=null?o.rough:1.0, uv:o.uv||1, mode:o.mode||0,
    detail:o.detail||0, shadow:o.shadow!==false, dressLens:!!o.dressLens });
}
const WOOD_TINTS = [[0.62,0.55,0.50],[1.25,1.15,1.05],[0.22,0.20,0.19]];
function computeRig(st){
  const w=st.weather|0, t=st.time|0;
  const W = [
    {cloud:0.22,haze:0.22,rain:0,snow:0,mist:0.0,sunMul:1.0},
    {cloud:0.85,haze:0.55,rain:0,snow:0,mist:0.15,sunMul:0.42},
    {cloud:0.96,haze:0.72,rain:1,snow:0,mist:0.30,sunMul:0.30},
    {cloud:0.72,haze:0.62,rain:0,snow:1,mist:0.35,sunMul:0.55},
    {cloud:0.45,haze:0.95,rain:0,snow:0,mist:1.0,sunMul:0.60},
  ][w];
  const R = { W, night:0, cloud:W.cloud, haze:W.haze, rain:W.rain, snow:W.snow, mist:W.mist };
  const az = (S.texSeed*2.7)%(Math.PI*2);
  if (t===0){
    const el=0.95;
    R.sunDir=[Math.sin(az)*Math.cos(el)*0.9+0.35, -Math.sin(el), Math.cos(az)*Math.cos(el)*0.4-0.75];
    const l=Math.hypot(...R.sunDir); R.sunDir=R.sunDir.map(v=>v/l);
    R.sunCol=[1.0,0.96,0.90]; R.sunI=3.2*W.sunMul;
    R.moonI=0; R.exposure=1.0; R.warmth=0.35; R.amb=[0.62,0.60,0.58];
  } else if (t===1){
    const el=0.16;
    R.sunDir=[Math.sin(az)*0.9-0.55, -Math.sin(el), Math.cos(az)*0.4-0.5];
    const l=Math.hypot(...R.sunDir); R.sunDir=R.sunDir.map(v=>v/l);
    R.sunCol=[1.0,0.52,0.24]; R.sunI=2.2*W.sunMul;
    R.moonI=0; R.exposure=1.06; R.warmth=0.75; R.amb=[0.50,0.42,0.38];
  } else {
    R.night=1;
    const el=0.66;
    R.sunDir=[Math.sin(az+2.4)*0.6, -Math.sin(el), Math.cos(az+2.4)*0.5-0.4];
    const l=Math.hypot(...R.sunDir); R.sunDir=R.sunDir.map(v=>v/l);
    R.sunCol=[0.55,0.68,0.92]; R.sunI=0.70;
    R.moonI=1.0; R.exposure=1.45; R.warmth=0.25; R.amb=[0.36,0.40,0.50];
  }
  R.moonDir=R.sunDir.slice();
  R.moonCol=[0.62,0.74,0.95];
  const fi=[0.7,1.0,1.45][st.fire|0]*(t===2?1.6:1.0);
  R.fireI=fi;
  S.rig=R;
  return R;
}

function generateScene(st){
  S.draws.length=0; S.mtns.length=0; S.water=null; S.glass=null;
  const r2 = mulberry32((st.seed ^ 0x9e3779b9) >>> 0);
  S.texSeed = r2()*100+1;
  S.camPhase = r2()*6.28;
  S.flamePhase = [r2()*6.28, r2()*6.28, r2()*6.28];
  ensureBaked(st);
  const R = computeRig(st);
  const woodT = WOOD_TINTS[st.wood|0];

  /* ============ FIREPLACE WALL (east, front face x=4.42) ============
     firebox: z -1.75..-0.05, y 0.30..1.25 | log niche: z 0.05..1.00, y 0.30..1.55 */
  const WX=4.72, WD=0.6;
  function stoneSeg(z0,z1,y0,y1){
    draw(M_BOX, WX,(y0+y1)/2,(z0+z1)/2, WD,y1-y0,z1-z0, 0, {uv:0.55, detail:0.85});
  }
  stoneSeg(-4.02,-1.75, -0.02,3.2);
  stoneSeg(-0.05,0.05, -0.02,3.2);
  stoneSeg(1.00,1.60, -0.02,3.2);
  stoneSeg(-1.75,-0.05, 1.25,3.2);
  stoneSeg(0.05,1.00, 1.55,3.2);
  const soot=[0.06,0.05,0.045];
  draw(M_BOX, 4.95,0.775,-0.9, 0.1,0.95,1.7, 3, {tintA:soot, uv:2});
  draw(M_BOX, 4.7,1.275,-0.9, 0.6,0.07,1.7, 3, {tintA:soot, uv:2});
  draw(M_BOX, 4.7,0.275,-0.9, 0.6,0.05,1.7, 3, {tintA:soot, uv:2});
  draw(M_BOX, 4.7,0.775,-1.76, 0.6,0.95,0.06, 3, {tintA:soot, uv:2});
  draw(M_BOX, 4.7,0.775,-0.06, 0.6,0.95,0.06, 3, {tintA:soot, uv:2});
  draw(M_BOX, 4.95,0.925,0.525, 0.1,1.25,0.95, 3, {tintA:[0.10,0.085,0.07], uv:2});
  draw(M_BOX, 4.7,1.575,0.525, 0.6,0.07,0.95, 3, {tintA:[0.10,0.085,0.07], uv:2});
  draw(M_RBOX, 4.05,0.24,-0.35, 0.75,0.14,3.4, 0, {uv:0.55, detail:0.85}); /* hearth ledge */
  const logR=0.085;
  for(let row=0;row<4;row++){
    const n=4-(row%2);
    for(let i=0;i<n;i++)
      draw(M_CYL, 4.72, 0.40+row*0.155, 0.16+i*0.20+(row%2)*0.05, logR*2,0.5,logR*2, 2, {rz:Math.PI/2, uv:1.4});
  }
  /* ---- firebox interior rebuild: splayed fireback, grate, andirons, ash, embers, log stack ---- */
  const iron=[0.055,0.055,0.06];
  draw(M_BOX, 4.82,0.775,-1.60, 0.08,0.95,0.34, 3, {tintA:soot, uv:2, ry:0.38}); /* splayed fireback L */
  draw(M_BOX, 4.82,0.775,-0.20, 0.08,0.95,0.34, 3, {tintA:soot, uv:2, ry:-0.38}); /* splayed fireback R */
  for(const gz of [-1.30,-0.95,-0.60])
    draw(M_BOX, 4.64,0.375,gz, 0.44,0.032,0.036, 7, {tintA:iron, rough:0.55}); /* grate bars */
  for(const az of [-1.32,-0.48]){
    draw(M_BOX, 4.80,0.50,az, 0.05,0.34,0.05, 7, {tintA:iron, rough:0.55}); /* andiron post */
    draw(M_RBOX, 4.80,0.685,az, 0.075,0.075,0.075, 7, {tintA:iron, rough:0.5}); /* finial */
    draw(M_BOX, 4.68,0.345,az, 0.30,0.035,0.045, 7, {tintA:iron, rough:0.55}); /* front foot */
  }
  draw(M_BOX, 4.63,0.315,-0.9, 0.56,0.055,1.32, 3, {tintA:[0.34,0.32,0.30], uv:2, rough:1}); /* ash bed */
  draw(M_RBOX, 4.55,0.33,-1.52, 0.30,0.07,0.26, 3, {tintA:[0.40,0.38,0.35], uv:1.5, rough:1}); /* ash pile */
  draw(M_RBOX, 4.72,0.33,-0.30, 0.34,0.08,0.30, 3, {tintA:[0.42,0.40,0.37], uv:1.5, rough:1}); /* ash pile */
  draw(M_RBOX, 4.50,0.325,-0.62, 0.24,0.06,0.22, 3, {tintA:[0.38,0.36,0.33], uv:1.5, rough:1}); /* ash pile */
  draw(M_RBOX, 4.60,0.35,-1.10, 0.34,0.10,0.30, 3, {tintA:[1,1,1], uv:2, ember:1}); /* ember mound */
  draw(M_RBOX, 4.68,0.35,-0.72, 0.30,0.11,0.28, 3, {tintA:[1,1,1], uv:2, ember:1}); /* ember mound */
  draw(M_RBOX, 4.58,0.345,-0.45, 0.26,0.09,0.24, 3, {tintA:[1,1,1], uv:2, ember:1}); /* ember mound */
  draw(M_RBOX, 4.70,0.355,-1.30, 0.24,0.09,0.22, 3, {tintA:[1,1,1], uv:2, ember:1}); /* ember mound */
  const charO={char:1, uv:1.6, rough:0.95};
  draw(M_CYL, 4.60,0.475,-0.92, 0.15,0.88,0.15, 2, Object.assign({rx:Math.PI/2},charO)); /* log A along z */
  draw(M_CYL, 4.73,0.465,-0.88, 0.14,0.80,0.14, 2, Object.assign({rx:Math.PI/2, ry:0.06},charO)); /* log B along z */
  draw(M_CYL, 4.66,0.615,-0.90, 0.13,0.72,0.13, 2, Object.assign({rz:Math.PI/2, ry:0.12},charO)); /* log C crosswise */
  draw(M_CYL, 4.62,0.575,-0.68, 0.115,0.62,0.115, 2, Object.assign({rz:Math.PI/2, ry:0.55},charO)); /* log D leaning */
  draw(M_CYL, 4.70,0.60,-1.18, 0.11,0.55,0.11, 2, Object.assign({rx:Math.PI/2, ry:-0.10},charO)); /* log E chunk */

  /* ============ ROOM SHELL ============ */
  const floorMat=[3,1,1,4][st.floor|0];
  const floorTint=[[1,1,1],[0.45,0.38,0.32],[1.25,1.15,1.05],[1,1,1]][st.floor|0];
  draw(M_BOX, 0,-0.06,0, 10.4,0.12,8.4, floorMat,
    {tintA:floorTint, uv:st.floor===3?0.5:0.35, rough:st.floor===0?0.42:0.7, mode:st.floor===0?1:0, shadow:false, detail:0.5});
  const plaster=[0.78,0.74,0.68];
  draw(M_BOX, 0,1.61,-4.05, 10.4,3.26,0.1, 3, {tintA:plaster, uv:0.3});
  draw(M_BOX, 5.05,1.61,0, 0.1,3.26,8.4, 3, {tintA:plaster, uv:0.3});
  draw(M_BOX, 0,3.26,0, 10.4,0.12,8.4, 1, {tintA:[0.30,0.24,0.18], uv:0.4, shadow:false});
  for(let i=0;i<8;i++)
    draw(M_BOX, 4.4-i*1.28,3.10,0, 0.20,0.24,8.2, 1, {tintA:woodT, uv:0.5});
  const glassY=1.60, glassH=3.20;
  for(const mx of [5,3.4,1.8,0.2,-1.4,-3.0]){
    draw(M_BOX, mx,glassY,4.0, 0.09,glassH,0.12, 7, {tintA:[0.05,0.05,0.055], rough:0.4});
    draw(M_BOX, mx,0.06,4.0, 0.14,0.12,0.18, 7, {tintA:[0.05,0.05,0.055], rough:0.4}); /* mullion base shoe */
    draw(M_BOX, mx,3.14,4.0, 0.14,0.12,0.18, 7, {tintA:[0.05,0.05,0.055], rough:0.4}); /* mullion head cap */
  }
  draw(M_BOX, 0,3.165,4.0, 10.2,0.07,0.14, 7, {tintA:[0.05,0.05,0.055], rough:0.4}); /* head trim channel */
  draw(M_BOX, 0,3.10,3.94, 10.3,0.08,0.10, 1, {tintA:woodT, uv:0.5}); /* wood head casing */
  draw(M_BOX, 0,0.025,4.0, 10.2,0.05,0.16, 7, {tintA:[0.03,0.03,0.035], rough:0.4}); /* flush floor track */
  draw(M_RBOX, 0,0.06,3.92, 10.2,0.05,0.22, 1, {tintA:woodT, uv:0.5}); /* sill nosing */
  for(const ex of [-5,5])
    draw(M_BOX, ex,1.60,4.0, 0.14,3.20,0.18, 1, {tintA:woodT, uv:0.5}); /* end casing posts */
  draw(M_BOX, -3.725,1.60,4.0, 0.06,3.20,0.60, 0, {uv:0.55, detail:0.85}); /* pier junction trim */
  draw(M_BOX, -3.175,1.60,4.0, 0.06,3.20,0.60, 0, {uv:0.55, detail:0.85}); /* pier junction trim */
  draw(M_BOX, -3.45,1.59,4.0, 0.55,3.2,0.55, 0, {uv:0.55, detail:0.85}); /* stone pier */
  S.glass={ y0:0.0, y1:3.20, x0:-5, x1:5, z:4.0 };

  /* ============ FURNISHINGS ============ */
  draw(M_RBOX, -0.3,0.030,1.1, 4.4,0.07,3.1, 6, {uv:1, shadow:false, detail:0.7}); /* rug */
  draw(M_RBOX, -0.3,0.40,1.1, 1.95,0.10,1.0, 7, {tintA:[0.04,0.04,0.045], rough:0.32, mode:2, detail:0.45}); /* table slab */
  draw(M_BOX, -0.3,0.20,1.1, 0.55,0.36,0.55, 7, {tintA:[0.05,0.05,0.055], rough:0.5, mode:2, detail:0.45});   /* plinth */
  draw(M_RBOXS, 0.15,0.465,1.05, 0.44,0.05,0.32, 8, {tintA:[0.16,0.18,0.24], ry:-0.12, uv:2});
  draw(M_RBOXS, 0.12,0.505,1.08, 0.38,0.045,0.28, 8, {tintA:[0.38,0.16,0.12], ry:0.18, uv:2});
  draw(M_CYL, -0.95,0.462,1.35, 0.20,0.035,0.20, 7, {tintA:[0.08,0.08,0.085], rough:0.5}); /* tray */
  draw(M_RBOX, -2.3,0.16,2.75, 2.7,0.34,1.2, 1, {tintA:woodT, uv:0.5});   /* daybed base */
  draw(M_RBOX, -2.3,0.435,2.75, 2.55,0.20,1.08, 5, {tintA:[0.72,0.68,0.62], uv:1.2, detail:0.6}); /* mattress */
  draw(M_RBOXS, -1.45,0.60,2.75, 0.62,0.20,0.62, 5, {tintA:[0.80,0.77,0.72], detail:0.6, ry:-0.25, uv:1.5});
  draw(M_RBOXS, -2.30,0.60,2.75, 0.62,0.20,0.62, 5, {tintA:[0.62,0.58,0.53], detail:0.6, ry:0.15, uv:1.5});
  draw(M_RBOXS, -3.10,0.60,2.80, 0.58,0.18,0.58, 5, {tintA:[0.30,0.30,0.32], detail:0.6, ry:-0.4, uv:1.5});
  draw(M_RBOXS, 1.15,0.16,1.9, 0.66,0.22,0.66, 5, {tintA:[0.74,0.70,0.64], detail:0.6, ry:-0.5, uv:1.5});
  draw(M_RBOXS, 0.45,0.15,2.30, 0.60,0.20,0.60, 5, {tintA:[0.36,0.34,0.36], detail:0.6, ry:0.3, uv:1.5});

  /* ============ ROOM DRESSING (set-dressing pass; UI-only state) ============
     Four recessed ceiling downlights between the wood beams, a toggleable
     wood mantle shelf with seeded picture frames, a fireplace tool stand
     with hanging poker, and baseboard/crown trim on the solid walls. */
  const _le = 0.9 * dressCeil();
  for (const _cp of CEIL_POS) {
    draw(M_CYL, _cp[0],_cp[1]+0.018,_cp[2], 0.19,0.035,0.19, 7,
      { tintA:[0.10,0.10,0.11], rough:0.45 }); /* dark metal trim ring */
    draw(M_CYL, _cp[0],_cp[1]-0.004,_cp[2], 0.13,0.014,0.13, 7,
      { tintA:[0.92,0.87,0.76], rough:0.6,
        emis:[1.0*_le, 0.9*_le, 0.75*_le], dressLens:true }); /* emissive lens */
  }
  if (dress.mantle) {
    draw(M_RBOX, 4.30,1.47,-0.9, 0.26,0.10,2.0, 1, { tintA:woodT, uv:0.5 }); /* mantle shelf */
    draw(M_BOX, 4.36,1.355,-1.70, 0.10,0.13,0.10, 1, { tintA:woodT });       /* corbel L */
    draw(M_BOX, 4.36,1.355,-0.10, 0.10,0.13,0.10, 1, { tintA:woodT });       /* corbel R */
  }
  /* tool stand with hanging poker, on the hearth beside the firebox */
  draw(M_CYL, 4.05,0.325,-1.95, 0.22,0.03,0.22, 7, { tintA:[0.08,0.08,0.09], rough:0.5 });
  draw(M_CYL, 4.05,0.76,-1.95, 0.035,0.90,0.035, 7, { tintA:[0.08,0.08,0.09], rough:0.5 });
  draw(M_CYL, 4.05,1.225,-1.95, 0.05,0.06,0.05, 7, { tintA:[0.55,0.40,0.22], rough:0.4 });
  draw(M_CYL, 3.98,1.13,-1.95, 0.17,0.024,0.024, 7, { rz:Math.PI/2, tintA:[0.08,0.08,0.09], rough:0.5 });
  draw(M_CYL, 3.905,1.10,-1.95, 0.02,0.07,0.02, 7, { tintA:[0.08,0.08,0.09], rough:0.5 });
  draw(M_CYL, 3.905,0.72,-1.95, 0.018,0.68,0.018, 7, { tintA:[0.10,0.10,0.11], rough:0.45 });
  draw(M_CYL, 3.905,1.03,-1.95, 0.032,0.13,0.032, 1, { tintA:woodT, rough:0.7 });
  /* baseboards + crown molding on the solid back and east walls */
  const _trim = [0.80,0.76,0.70];
  draw(M_BOX, 0,0.06,-3.955, 10.4,0.12,0.07, 3, { tintA:_trim, rough:0.8, uv:0.3 });
  draw(M_BOX, 0,3.09,-3.955, 10.4,0.14,0.07, 3, { tintA:_trim, rough:0.8, uv:0.3 });
  draw(M_BOX, 4.955,0.06,0, 0.07,0.12,8.4, 3, { tintA:_trim, rough:0.8, uv:0.3 });
  draw(M_BOX, 4.955,3.09,0, 0.07,0.14,8.4, 3, { tintA:_trim, rough:0.8, uv:0.3 });

  /* ============ DECK + EXTERIOR ============ */
  draw(M_BOX, 0,-0.03,7.0, 10.4,0.10,6.0, 1, {tintA:[0.55,0.48,0.40], uv:0.3, shadow:false});
  const dv=st.deck|0;
  if(dv===0){
    const cx=4.3, cz=6.5, ry=0.45;
    const px=Math.cos(ry), pz=-Math.sin(ry);
    for(const s of [-0.26,0.26])
      draw(M_BOX, cx+px*s,0.36,cz+pz*s, 0.07,0.09,1.6, 1, {tintA:woodT, ry, uv:0.6});
    for(let i=0;i<9;i++){
      const t=-0.7+i*0.175;
      draw(M_BOX, cx+Math.sin(ry)*t,0.42,cz+Math.cos(ry)*t, 0.60,0.035,0.13, 1, {tintA:woodT, ry, uv:0.6});
    }
    for(const s of [-0.26,0.26]){
      draw(M_BOX, cx+px*s-Math.sin(ry)*0.95,0.18,cz+pz*s-Math.cos(ry)*0.95, 0.07,0.36,0.07, 1, {tintA:woodT, ry});
      draw(M_BOX, cx+px*s+Math.sin(ry)*0.75,0.18,cz+pz*s+Math.cos(ry)*0.75, 0.07,0.36,0.07, 1, {tintA:woodT, ry});
    }
    for(let i=0;i<5;i++){
      const t=0.15+i*0.16;
      draw(M_BOX, cx-Math.sin(ry)*0.85, 0.62+t*0.55, cz-Math.cos(ry)*0.85-t*0.28,
        0.60,0.035,0.13, 1, {tintA:woodT, ry, rx:-0.5, uv:0.6});
    }
  } else if(dv===1){
    draw(M_RBOX, -1.6,0.30,6.6, 1.9,0.09,0.55, 1, {tintA:woodT, uv:0.5, ry:0.1});
    draw(M_BOX, -2.3,0.14,6.6, 0.09,0.28,0.5, 1, {tintA:woodT, ry:0.1});
    draw(M_BOX, -0.9,0.14,6.6, 0.09,0.28,0.5, 1, {tintA:woodT, ry:0.1});
  }
  draw(M_CYL, 3.7,0.28,5.3, 0.56,0.56,0.56, 7, {tintA:[0.06,0.06,0.065], rough:0.45});
  draw(M_CYL, 3.7,0.56,5.3, 0.50,0.03,0.50, 3, {tintA:[0.12,0.10,0.08], rough:1});

  /* ============ WATER + MOUNTAINS ============ */
  const chop=[0.25,0.7,1.4][st.water|0]*(R.rain?1.5:1)*(R.snow?0.5:1);
  S.water={ x0:-70, x1:70, z0:10, z1:68, y:-0.38, chop, seedF:S.texSeed };
  S.mtns=[
    { x:0,   y:-1.2, z:72,  w:520, h:30, hs:0.95, haze:0.35, snow:1.0 },
    { x:-40, y:-1.6, z:135, w:620, h:48, hs:1.0,  haze:0.65, snow:1.0 },
    { x:60,  y:-2.0, z:210, w:760, h:70, hs:1.05, haze:0.9,  snow:1.0 },
  ];
  draw(M_BOX, 0,-0.30,9.7, 140,0.25,1.2, 3, {tintA:[0.22,0.21,0.20], uv:0.4, shadow:false}); /* shore */

  S.firePos=[4.42,0.72,-0.9];
  S.fireCol=[1.0,0.42,0.12];
  S.flick=1.0;
  artwork.frames = FPFrames.build(settingsSeedString());
  FPFrames.buildHost(artwork.frames, draw, M_BOX);
  FPFrames.setQuads(artwork.wall, artwork.frames);
  buildShagNubs(st);
  if (dress.mantle) {
    artwork.mantleFrames = buildMantleFrameList();
    buildMantleHost(artwork.mantleFrames, draw);
    setMantleQuads(artwork.mantle, artwork.mantleFrames);
  } else {
    artwork.mantleFrames = [];
    setMantleQuads(artwork.mantle, []);
  }
}

export { generateScene };
