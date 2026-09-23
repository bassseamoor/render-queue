// Fireplace Studio — renderer/passes.js. See README.md for ownership and replacement boundaries.
import { canvas, gl } from './context.js';
import { depFBO, depH, depTex, depW, ensureFBO, ensureShadow, msFBO, postVAO, resFBO, resTex, shFBO } from './targets.js';
import { S, TEX } from '../core/state.js';
import { mLookAt, mMul, mOrtho, mPersp, mS, mT } from '../core/math.js';
import { DU, HU, OU, depthProg, postProg, shadProg } from './programs.js';
import { M_MTNWALL } from '../world/geometry.js';
import { drawGlass, drawLit, drawMtns, drawSky, drawWater } from './draw.js';
import { drawInstDetail } from '../world/surface-detail.js';
import { artwork } from '../world/artwork-state.js';
import { FPFrames } from '../world/artwork.js';
import { dressCeil } from '../world/dressing.js';
import { lifeDraw } from '../world/life.js';
import { drawParticles } from '../world/particles.js';
import { settings } from '../core/settings.js';

/* ============================================================================
   MASTER RENDER — fixed 8-pass pipeline
   ============================================================================ */
function renderPasses(te, frame){
  const w=canvas.width, h=canvas.height;
  ensureShadow(); ensureFBO(w,h);
  const cam=S.cam, aspect=w/h;
  const proj=mPersp(cam.fov,aspect,0.1,500);
  const view=mLookAt(cam.eye,cam.tgt);
  S.proj=proj; S.view=view;

  /* 1. shadow map */
  {
    const R=S.rig;
    const L=[-R.sunDir[0]*38,-R.sunDir[1]*38,-R.sunDir[2]*38];
    const lightM=mMul(mOrtho(-13,13,-13,13,1,90),mLookAt(L,[0,1,0]));
    S.shadowM=lightM;
    gl.bindFramebuffer(gl.FRAMEBUFFER,shFBO);
    gl.viewport(0,0,1024,1024);
    gl.clearDepth(1); gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    gl.useProgram(shadProg);
    gl.uniformMatrix4fv(HU("uLightM"),false,lightM);
    for(const d of S.draws){
      if(!d.shadow) continue;
      gl.uniformMatrix4fv(HU("uModel"),false,d.model);
      gl.bindVertexArray(d.mesh.vao);
      gl.drawElements(gl.TRIANGLES,d.mesh.count,gl.UNSIGNED_INT,0);
    }
    gl.bindVertexArray(null);
  }
  /* 2. half-res packed linear depth */
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER,depFBO);
    gl.viewport(0,0,depW,depH);
    gl.clearColor(1,1,1,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    gl.useProgram(depthProg);
    gl.uniformMatrix4fv(DU("uView"),false,view);
    gl.uniformMatrix4fv(DU("uProj"),false,proj);
    gl.uniform3fv(DU("uCamPos"),cam.eye);
    gl.uniform1f(DU("uIsMtn"),0.0);
    for(const d of S.draws){
      gl.uniformMatrix4fv(DU("uModel"),false,d.model);
      gl.bindVertexArray(d.mesh.vao);
      gl.drawElements(gl.TRIANGLES,d.mesh.count,gl.UNSIGNED_INT,0);
    }
    gl.uniform1f(DU("uIsMtn"),1.0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,TEX.mtnH);
    gl.uniform1i(DU("uHeight"),0);
    for(const m of S.mtns){
      gl.uniformMatrix4fv(DU("uModel"),false,mMul(mT(m.x,m.y,m.z),mS(m.w,m.h,1)));
      gl.uniform1f(DU("uHScale"),m.hs);
      gl.bindVertexArray(M_MTNWALL.vao);
      gl.drawElements(gl.TRIANGLES,M_MTNWALL.count,gl.UNSIGNED_INT,0);
    }
    gl.bindVertexArray(null);
    gl.uniform1f(DU("uIsMtn"),0.0);
  }
  /* 3. MSAA: sky + mountains + opaque */
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER,msFBO);
    gl.viewport(0,0,w,h);
    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    drawSky(view,proj,te);
    drawMtns(view,proj,te);
    drawLit(view,proj,te);
    drawInstDetail(view,proj,te);
    if (artwork.wall && artwork.frames && artwork.wall.nquads) {
      FPFrames.render(artwork.wall, view, proj, FPFrames.lightingFromRig(S.rig, S.fireCol, S.flick, dressCeil()));
    }
    if (artwork.mantle && artwork.mantle.nquads) {
      FPFrames.render(artwork.mantle, view, proj, FPFrames.lightingFromRig(S.rig, S.fireCol, S.flick, dressCeil()));
    }
  }
  /* 4. resolve opaque color+depth */
  {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER,msFBO);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,resFBO);
    gl.blitFramebuffer(0,0,w,h,0,0,w,h,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);
  }
  /* 5. water back into MSAA */
  {
    gl.bindFramebuffer(gl.FRAMEBUFFER,msFBO);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    drawWater(view,proj,te);
  }
  /* 6. glass + particles into MSAA */
  {
    lifeDraw(view,proj,te);
    drawGlass(view,proj,te);
    drawParticles(view,proj,te);
  }
  /* 7. final resolve into MSAA->canvas FBO then 8. post to canvas */
  {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER,msFBO);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,resFBO);
    gl.blitFramebuffer(0,0,w,h,0,0,w,h,gl.COLOR_BUFFER_BIT,gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,w,h);
    gl.clearColor(0,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    gl.useProgram(postProg);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,resTex); gl.uniform1i(OU("uTex"),0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D,depTex); gl.uniform1i(OU("uDepth"),1);
    gl.uniform1f(OU("uFrame"),frame);
    gl.uniform2f(OU("uRes"),w,h);
    gl.uniform1f(OU("uExposure"),S.rig.exposure);
    gl.uniform1f(OU("uVig"),S.cam&&S.cam.vig!=null?S.cam.vig:0.32);
    const GI=[[0.020,0.028],[0,0],[0.006,0.008],[0.012,0.016],[0.035,0.045]][settings.grain|0]||[0.020,0.028];
    gl.uniform1f(OU("uGrain"),S.rig.night?GI[1]:GI[0]);
    gl.uniform1f(OU("uWarm"),S.rig.warmth);
    gl.uniform1f(OU("uNight"),S.rig.night);
    gl.uniform1f(OU("uAO"),0.75);
    gl.bindVertexArray(postVAO);
    gl.drawArrays(gl.TRIANGLES,0,3);
    gl.bindVertexArray(null);
    gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
    gl.activeTexture(gl.TEXTURE0);
  }
}

export { renderPasses };
