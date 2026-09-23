// Fireplace Studio — renderer/shaders/glass.js. See README.md for ownership and replacement boundaries.
import { GLSL_NOISE, SKY_FN, SKY_U } from './common.js';

const GLASS_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv;
uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProj;
out vec3 vWP; out vec2 vUv;
void main(){ vec4 wp=uModel*vec4(aPos,1.0); vWP=wp.xyz; vUv=aUv; gl_Position=uProj*uView*wp; }`;
const GLASS_FS = `#version 300 es
precision highp float;
in vec3 vWP; in vec2 vUv;
uniform float uTime; uniform vec3 uCamPos;
uniform float uRain; uniform float uMist;
${SKY_U}
${GLSL_NOISE}
${SKY_FN}
out vec4 oC;
void main(){
  vec3 V = normalize(uCamPos-vWP);
  vec3 N = vec3(0.0,0.0,1.0);
  if(!gl_FrontFacing) N = -N;
  float fres = 0.04+0.96*pow(1.0-abs(dot(N,V)),5.0);
  vec3 R = reflect(-V,N);
  vec3 ref = skyColor(normalize(R), uTime);
  float streak = 0.0;
  if(uRain>0.01){
    vec2 gp = vec2(vWP.x*7.0, vWP.y*2.2-uTime*0.75);
    streak = smoothstep(0.60,0.82,fbm(gp*vec2(3.0,1.0)))*uRain;
  }
  float cond = uMist*smoothstep(0.35,0.9,fbm(vWP.xy*2.6+uSeedF*0.7));
  vec3 col = ref*(0.30+0.70*fres);
  col += vec3(0.80,0.85,0.90)*streak*0.30;
  col = mix(col, vec3(0.74,0.77,0.81), cond*0.35);
  float alpha = clamp(0.10+fres*0.55+streak*0.22+cond*0.22+uMist*0.10, 0.0, 0.85);
  oC = vec4(col, alpha);
}`;

export { GLASS_FS, GLASS_VS };
