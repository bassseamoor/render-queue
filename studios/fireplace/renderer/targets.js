// Fireplace Studio — renderer/targets.js. See README.md for ownership and replacement boundaries.
import { gl } from './context.js';

let msFBO=null, msColorRB=null, msDepthRB=null, resFBO=null, resTex=null, resDepthRB=null;
let depFBO=null, depTex=null, depW=0, depH=0, fbW=0, fbH=0;
let shFBO=null, shTex=null;
let postVAO=null;
function ensureShadow(){
  if(shFBO) return;
  shTex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,shTex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1024,1024,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  shFBO=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,shFBO);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shTex,0);
  gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
let depRB=null;
function ensureDepth(w,h){
  const dw=Math.max(2,w>>1), dh=Math.max(2,h>>1);
  if(depFBO && dw===depW && dh===depH) return;
  if(depFBO){ gl.deleteTexture(depTex); gl.deleteRenderbuffer(depRB); gl.deleteFramebuffer(depFBO); }
  depW=dw; depH=dh;
  depTex=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,depTex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,dw,dh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  depRB=gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER,depRB);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,dw,dh);
  depFBO=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,depFBO);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,depTex,0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depRB);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
function ensureFBO(w,h){
  if(msFBO && w===fbW && h===fbH) return;
  for(const o of [msColorRB,msDepthRB,resDepthRB]) if(o) gl.deleteRenderbuffer(o);
  for(const o of [msFBO,resFBO]) if(o) gl.deleteFramebuffer(o);
  if(resTex) gl.deleteTexture(resTex);
  fbW=w; fbH=h;
  msColorRB=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,msColorRB);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.RGBA8,w,h);
  msDepthRB=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,msDepthRB);
  gl.renderbufferStorageMultisample(gl.RENDERBUFFER,4,gl.DEPTH_COMPONENT24,w,h);
  msFBO=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,msFBO);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,msColorRB);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,msDepthRB);
  resTex=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,resTex);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  resDepthRB=gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER,resDepthRB);
  gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);
  resFBO=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,resFBO);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,resTex,0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,resDepthRB);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  ensureDepth(w,h);
  if(!postVAO){
    postVAO=gl.createVertexArray(); gl.bindVertexArray(postVAO);
    const b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 3,-1, -1,3]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    gl.bindVertexArray(null);
  }
}

export { depFBO, depH, depTex, depW, ensureFBO, ensureShadow, msFBO, postVAO, resFBO, resTex, shFBO, shTex };
