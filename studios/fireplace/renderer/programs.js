// Fireplace Studio — renderer/programs.js. See README.md for ownership and replacement boundaries.
import { gl } from './context.js';
import { SKY_FS, SKY_VS } from './shaders/sky.js';
import { MTN_FS, MTN_VS } from './shaders/mountain.js';
import { WATER_FS, WATER_VS } from './shaders/water.js';
import { GLASS_FS, GLASS_VS } from './shaders/glass.js';
import { LIT_FS, LIT_VS } from './shaders/surface.js';
import { SHADOW_FS, SHADOW_VS } from './shaders/shadow.js';
import { DEPTH_FS, DEPTH_VS } from './shaders/depth.js';
import { PART_FS, PART_VS } from './shaders/fire.js';
import { DET_FS, DET_VS } from './shaders/detail.js';
import { POST_FS, POST_VS } from './shaders/post.js';

window.__fpShaderLogs=[];
function compileProg(vsSrc, fsSrc, progName){
  function sh(type,src){
    const s=gl.createShader(type);
    gl.shaderSource(s,src); gl.compileShader(s);
    const ok=!!gl.getShaderParameter(s,gl.COMPILE_STATUS);
    window.__fpShaderLogs.push({prog:progName||"?", stage:type===gl.VERTEX_SHADER?"vertex":"fragment",
      ok:ok, log:String(gl.getShaderInfoLog(s)||"(empty)")});
    if(!ok)
      throw new Error("shader: "+gl.getShaderInfoLog(s)+"\n---\n"+src.slice(0,600));
    return s;
  }
  const p=gl.createProgram();
  gl.attachShader(p,sh(gl.VERTEX_SHADER,vsSrc));
  gl.attachShader(p,sh(gl.FRAGMENT_SHADER,fsSrc));
  gl.linkProgram(p);
  const lok=!!gl.getProgramParameter(p,gl.LINK_STATUS);
  window.__fpShaderLogs.push({prog:progName||"?", stage:"link", ok:lok,
    log:String(gl.getProgramInfoLog(p)||"(empty)")});
  if(!lok) throw new Error("link: "+gl.getProgramInfoLog(p));
  return p;
}
function locCache(prog){
  const c={};
  return function(n){
    if(!(n in c)) c[n]=gl.getUniformLocation(prog,n);
    return c[n];
  };
}
const skyProg=compileProg(SKY_VS,SKY_FS,"sky");     const KU=locCache(skyProg);
const mtnProg=compileProg(MTN_VS,MTN_FS,"mountain");     const NU=locCache(mtnProg);
const waterProg=compileProg(WATER_VS,WATER_FS,"water"); const WU=locCache(waterProg);
const glassProg=compileProg(GLASS_VS,GLASS_FS,"glass"); const GU=locCache(glassProg);
const litProg=compileProg(LIT_VS,LIT_FS,"lit");     const LU=locCache(litProg);
const shadProg=compileProg(SHADOW_VS,SHADOW_FS,"shadow"); const HU=locCache(shadProg);
const depthProg=compileProg(DEPTH_VS,DEPTH_FS,"depth"); const DU=locCache(depthProg);
const partProg=compileProg(PART_VS,PART_FS,"particles");
const detProg=compileProg(DET_VS,DET_FS,"instdet");   const IU=locCache(detProg);
  const PU=locCache(partProg);
const postProg=compileProg(POST_VS,POST_FS,"post");  const OU=locCache(postProg);

export { DU, GU, HU, IU, KU, LU, NU, OU, PU, WU, compileProg, depthProg, detProg, glassProg, litProg, locCache, mtnProg, partProg, postProg, shadProg, skyProg, waterProg };
