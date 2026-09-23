// Fireplace Studio — renderer/shaders/detail.js. See README.md for ownership and replacement boundaries.


const DET_VS = `#version 300 es
layout(location=0) in vec2 aQuad;
layout(location=1) in vec3 aBase;
layout(location=2) in vec4 aP0; /* leanX, leanZ, height, width */
layout(location=3) in vec4 aP1; /* rotY, toneR, toneG, toneB */
layout(location=4) in vec4 aP2; /* curlDirX, curlDirZ, curlAmp, curlPhase (shag only; nubs read defaults) */
layout(location=5) in vec4 aP3; /* aoK, sheenK (shag only; nubs read defaults) */
uniform mat4 uView; uniform mat4 uProj;
out vec2 vQ; out vec3 vWP; out vec3 vTone; out vec3 vTan; out vec2 vFx;
void main(){
  vQ=aQuad; vTone=aP1.yzw; vTan=vec3(aP0.x,aP0.y,aP0.z); vFx=aP3.xy;
  float cr=cos(aP1.x), sr=sin(aP1.x);
  float t=aQuad.y+0.5;
  float bend=t*t; /* curl grows along the strand so the root stays planted */
  vec2 curl=vec2(aP2.x,aP2.y)*(aP2.z*bend*1.4+0.45*aP2.z*sin(aP2.w+t*9.0)*t);
  float rise=aP0.z*t;
  float droop=min(aP2.z*bend*1.1, rise*0.92); /* flop over into wavy masses, never below the backing */
  vec3 center=aBase+vec3(aP0.x*t,rise,aP0.z*t)+vec3(curl.x,-droop,curl.y);
  vec3 off=vec3(cr*aQuad.x*aP0.w, 0.0, -sr*aQuad.x*aP0.w)*(1.0-t*0.75);
  vec3 pos=center+off;
  vWP=pos;
  gl_Position=uProj*uView*vec4(pos,1.0);
}`;
const DET_FS = `#version 300 es
precision highp float;
in vec2 vQ; in vec3 vWP; in vec3 vTone; in vec3 vTan; in vec2 vFx;
uniform vec3 uCamPos; uniform vec3 uFirePos; uniform float uFlick;
uniform vec3 uFireCol; uniform float uFireI; uniform vec3 uAmbTint;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI;
out vec4 oC;
void main(){
  float t=vQ.y+0.5;
  vec3 V=normalize(uCamPos-vWP);
  vec3 N=normalize(vec3(V.x*0.35,1.0,V.z*0.35)); /* fake fiber normal */
  float ndl=max(dot(N,-normalize(uSunDir)),0.0);
  vec3 fD=uFirePos-vWP; float fd=length(fD); vec3 fL=fD/max(fd,1e-3);
  float fAtt=uFireI*uFlick/(1.0+fd*fd*0.55);
  float sheen=pow(1.0-abs(dot(N,V)),2.0); /* fiber sheen */
  float aniso=pow(1.0-abs(dot(normalize(vTan),V)),2.0); /* soft fuzzy rim: brightest looking across the strand */
  vec3 col=vTone*mix(0.30+0.70*t, 0.12+0.88*t*t, vFx.x); /* fake fiber AO: shadowed root, light tip */
  vec3 lit=col*(uSunCol*uSunI*ndl*0.35+uFireCol*fAtt*(0.4+0.6*max(dot(N,fL),0.0)));
  lit+=col*uAmbTint*0.35;
  lit+=vTone*mix(sheen*0.06, aniso*0.07, vFx.y)*(0.4+0.6*fAtt);
  oC=vec4(lit,1.0);
}`;

export { DET_FS, DET_VS };
