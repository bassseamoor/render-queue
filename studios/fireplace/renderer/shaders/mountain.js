// Fireplace Studio — renderer/shaders/mountain.js. See README.md for ownership and replacement boundaries.
import { GLSL_NOISE, SKY_FN, SKY_U } from './common.js';

const MTN_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv;
uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProj;
uniform sampler2D uHeight; uniform float uHScale;
out vec3 vWP; out vec2 vUv; out float vH;
void main(){
  float h = texture(uHeight, aUv).r;
  vec3 p = aPos;
  p.y += h*uHScale;
  vec4 wp = uModel*vec4(p,1.0);
  vWP = wp.xyz; vUv = aUv; vH = h;
  gl_Position = uProj*uView*wp;
}`;
const MTN_FS = `#version 300 es
precision highp float;
in vec3 vWP; in vec2 vUv; in float vH;
uniform sampler2D uHeight;
uniform float uTime; uniform vec3 uCamPos;
uniform float uHazeM; uniform float uSnow; uniform float uRelief;
${SKY_U}
${GLSL_NOISE}
${SKY_FN}
out vec4 oC;
void main(){
  vec3 V = normalize(uCamPos - vWP);
  float tx = 1.5/256.0;
  float hC = textureLod(uHeight, vUv, 2.0).r;
  float hx = textureLod(uHeight, vUv+vec2(tx,0.0), 2.0).r;
  float hy = textureLod(uHeight, vUv+vec2(0.0,tx), 2.0).r;
  vec3 N = normalize(vec3(-(hx-hC)*uRelief, -(hy-hC)*uRelief*0.4, 1.0));
  if(!gl_FrontFacing) N = -N;
  float snowLine = 0.52 - uHazeM*0.08;
  float snowM = smoothstep(snowLine, snowLine+0.14, hC+(hx-hC)*2.0)*clamp(uSnow,0.0,1.3);
  vec3 rock = mix(vec3(0.20,0.175,0.155), vec3(0.30,0.27,0.24), fbm(vWP.xy*0.045));
  vec3 forest = mix(vec3(0.05,0.09,0.05), vec3(0.10,0.16,0.09), fbm(vWP.xy*0.14+7.0));
  float forestM = smoothstep(0.44,0.30,hC)*smoothstep(0.015,0.10,hC);
  vec3 col = mix(rock, forest, forestM*0.9);
  col = mix(col, vec3(0.84,0.87,0.91), clamp(snowM,0.0,1.0));
  vec3 L = -normalize(uSunDir);
  float dif = max(dot(N,L),0.0);
  vec3 Hv = normalize(L+V);
  float spec = pow(max(dot(N,Hv),0.0),30.0)*clamp(snowM,0.0,1.0)*0.5;
  vec3 amb = mix(vec3(0.30,0.32,0.36), vec3(0.05,0.06,0.10), uNight)*(0.45+0.55*uCloud);
  col *= uSunCol*uSunI*(0.22+0.78*dif) + uMoonCol*uMoonI*max(dot(N,-normalize(uMoonDir)),0.0)*0.4 + amb;
  col += spec*uSunCol*uSunI*0.35;
  vec3 hazeC = skyColor(normalize(vec3(V.x,0.16,V.z)), uTime);
  col = mix(col, hazeC, clamp(uHazeM,0.0,1.0)*0.78);
  oC = vec4(col, 1.0);
}`;

export { MTN_FS, MTN_VS };
