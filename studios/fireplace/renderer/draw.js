// Fireplace Studio — renderer/draw.js. See README.md for ownership and replacement boundaries.
import { MAT_TEX, S, TEX } from '../core/state.js';
import { gl } from './context.js';
import { GU, KU, LU, NU, WU, glassProg, litProg, mtnProg, skyProg, waterProg } from './programs.js';
import { CEIL_COL, CEIL_FLAT, dressCeil } from '../world/dressing.js';
import { depTex, resTex, shTex } from './targets.js';
import { mInverse, mMul, mS, mT } from '../core/math.js';
import { M_MTNWALL, M_SPH, M_WALL, M_WATERMESH } from '../world/geometry.js';

function setSkyUniforms(LU2, te){
  const R=S.rig;
  gl.uniform1f(LU2("uTime"),te);
  gl.uniform3fv(LU2("uSunDir"),R.sunDir); gl.uniform3fv(LU2("uSunCol"),R.sunCol); gl.uniform1f(LU2("uSunI"),R.sunI);
  gl.uniform3fv(LU2("uMoonDir"),R.moonDir); gl.uniform3fv(LU2("uMoonCol"),R.moonCol); gl.uniform1f(LU2("uMoonI"),R.moonI);
  gl.uniform1f(LU2("uCloud"),R.cloud); gl.uniform1f(LU2("uHaze"),R.haze);
  gl.uniform1f(LU2("uNight"),R.night); gl.uniform1f(LU2("uSeedF"),S.texSeed);
}
function bindMatTex(LU2, mat){
  const T=TEX[MAT_TEX[mat]]||TEX.concrete;
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,T.alb); gl.uniform1i(LU2("uTexAlb"),0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,T.nrm); gl.uniform1i(LU2("uTexNrm"),1);
  gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D,T.rgh); gl.uniform1i(LU2("uTexRgh"),2);
}
function drawLit(view, proj, te){
  gl.useProgram(litProg);
  gl.uniformMatrix4fv(LU("uView"),false,view);
  gl.uniformMatrix4fv(LU("uProj"),false,proj);
  gl.uniformMatrix4fv(LU("uShadowM"),false,S.shadowM);
  gl.uniform3fv(LU("uCamPos"),S.cam.eye);
  setSkyUniforms(LU,te);
  gl.uniform3fv(LU("uFirePos"),S.firePos);
  gl.uniform1f(LU("uFlick"),S.flick);
  gl.uniform3fv(LU("uFireCol"),S.fireCol);
  gl.uniform1f(LU("uFireI"),S.rig.fireI*2.0);
  gl.uniform3fv(LU("uCeilPos"),CEIL_FLAT);
  gl.uniform3fv(LU("uCeilCol"),CEIL_COL);
  gl.uniform1f(LU("uCeilI"),dressCeil()*1.35);
  gl.uniform3fv(LU("uAmbTint"),S.rig.amb);
  gl.uniform3fv(LU("uFillCol"),[0.5,0.56,0.62]);
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D,shTex); gl.uniform1i(LU("uShadow"),3);
  let lastMat=-1;
  for(const d of S.draws){
    gl.uniformMatrix4fv(LU("uModel"),false,d.model);
    if(d.mat!==lastMat){ bindMatTex(LU,d.mat); lastMat=d.mat; }
    gl.uniform3fv(LU("uTintA"),d.tintA);
    gl.uniform3fv(LU("uEmis"),d.emis);
    gl.uniform1f(LU("uEmber"),d.ember);
    gl.uniform1f(LU("uChar"),d.char);
    gl.uniform1f(LU("uRoughMul"),d.rough);
    gl.uniform1f(LU("uUvScale"),d.uv);
    gl.uniform1f(LU("uMode"),d.mode);
    gl.uniform1f(LU("uDetail"),d.detail);
    gl.bindVertexArray(d.mesh.vao);
    gl.drawElements(gl.TRIANGLES,d.mesh.count,gl.UNSIGNED_INT,0);
  }
  gl.bindVertexArray(null);
}
function drawSky(view, proj, te){
  gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
  gl.useProgram(skyProg);
  gl.uniformMatrix4fv(KU("uView"),false,mT(S.cam.eye[0],S.cam.eye[1],S.cam.eye[2]));
  gl.uniformMatrix4fv(KU("uProj"),false,proj);
  setSkyUniforms(KU,te);
  gl.bindVertexArray(M_SPH.vao);
  gl.drawElements(gl.TRIANGLES,M_SPH.count,gl.UNSIGNED_INT,0);
  gl.bindVertexArray(null);
  gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
}
function drawMtns(view, proj, te){
  gl.useProgram(mtnProg);
  gl.uniformMatrix4fv(NU("uView"),false,view);
  gl.uniformMatrix4fv(NU("uProj"),false,proj);
  gl.uniform3fv(NU("uCamPos"),S.cam.eye);
  setSkyUniforms(NU,te);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,TEX.mtnH); gl.uniform1i(NU("uHeight"),0);
  for(const m of S.mtns){
    gl.uniformMatrix4fv(NU("uModel"),false,mMul(mT(m.x,m.y,m.z),mS(m.w,m.h,1)));
    gl.uniform1f(NU("uHScale"),m.hs);
    gl.uniform1f(NU("uHazeM"),m.haze*(0.5+S.rig.haze));
    gl.uniform1f(NU("uSnow"),m.snow*(S.rig.snow?1.15:1.0));
    gl.uniform1f(NU("uRelief"),9.0);
    gl.bindVertexArray(M_MTNWALL.vao);
    gl.drawElements(gl.TRIANGLES,M_MTNWALL.count,gl.UNSIGNED_INT,0);
  }
  gl.bindVertexArray(null);
}
function drawWater(view, proj, te){
  const Wd=S.water; if(!Wd) return;
  gl.useProgram(waterProg);
  gl.uniformMatrix4fv(WU("uViewM"),false,view);
  gl.uniformMatrix4fv(WU("uProjM"),false,proj);
  gl.uniformMatrix4fv(WU("uViewI"),false,mInverse(view));
  gl.uniform3fv(WU("uCamPos"),S.cam.eye);
  setSkyUniforms(WU,te);
  gl.uniform1f(WU("uChop"),Wd.chop);
  let wspd=1/6; if(S.rig.mist>0.01) wspd*=0.5; if(S.rig.rain>0.01) wspd*=1.4;
  gl.uniform1f(WU("uWSpd"),wspd);
  gl.uniform1f(WU("uRain"),S.rig.rain);
  gl.uniform1f(WU("uMist"),S.rig.mist);
  gl.uniform1f(WU("uShoreX"),10.0);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,resTex); gl.uniform1i(WU("uScene"),0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,depTex); gl.uniform1i(WU("uDepth"),1);
  gl.uniformMatrix4fv(WU("uModel"),false,
    mMul(mT((Wd.x0+Wd.x1)/2,Wd.y,(Wd.z0+Wd.z1)/2),mS(Wd.x1-Wd.x0,1,Wd.z1-Wd.z0)));
  gl.uniformMatrix4fv(WU("uView"),false,view);
  gl.uniformMatrix4fv(WU("uProj"),false,proj);
  gl.bindVertexArray(M_WATERMESH.vao);
  gl.drawElements(gl.TRIANGLES,M_WATERMESH.count,gl.UNSIGNED_INT,0);
  gl.bindVertexArray(null);
  gl.activeTexture(gl.TEXTURE0);
}
function drawGlass(view, proj, te){
  const G=S.glass; if(!G) return;
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.useProgram(glassProg);
  gl.uniformMatrix4fv(GU("uView"),false,view);
  gl.uniformMatrix4fv(GU("uProj"),false,proj);
  gl.uniform3fv(GU("uCamPos"),S.cam.eye);
  setSkyUniforms(GU,te);
  gl.uniform1f(GU("uRain"),S.rig.rain); gl.uniform1f(GU("uMist"),S.rig.mist);
  const spans=[[-5,-3.725],[-3.175,-1.4],[-1.4,0.2],[0.2,1.8],[1.8,3.4],[3.4,5.0]];
  for(const sp of spans){
    gl.uniformMatrix4fv(GU("uModel"),false,
      mMul(mT((sp[0]+sp[1])/2,(G.y0+G.y1)/2,G.z),mS(sp[1]-sp[0],G.y1-G.y0,1)));
    gl.bindVertexArray(M_WALL.vao);
    gl.drawElements(gl.TRIANGLES,M_WALL.count,gl.UNSIGNED_INT,0);
  }
  gl.bindVertexArray(null);
  gl.depthMask(true); gl.disable(gl.BLEND);
}

export { drawGlass, drawLit, drawMtns, drawSky, drawWater };
