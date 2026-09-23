// Fireplace Studio — renderer/shaders/water.js. See README.md for ownership and replacement boundaries.
import { GLSL_NOISE, SKY_FN, SKY_U } from './common.js';

const WATER_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv;
uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProj;
uniform float uTime; uniform float uChop; uniform float uSeedF; uniform float uWSpd;
out vec3 vWP; out vec2 vUv;
${GLSL_NOISE}
void main(){
  vec4 wp0 = uModel*vec4(aPos,1.0);
  vec3 wpos = wp0.xyz;
  float t = uTime*uWSpd;
  float w = sin(wpos.x*0.35+t*1.1)*0.5 + sin(wpos.z*0.5-t*0.9+uSeedF)*0.3 + sin((wpos.x+wpos.z)*0.18+t*0.6)*0.4;
  w += vnoise(wpos.xz*0.6+vec2(t*0.35,-t*0.22))*0.8-0.4;
  wpos.y += w*0.055*(0.35+uChop);
  vWP = wpos; vUv = aUv;
  gl_Position = uProj*uView*vec4(wpos,1.0);
}`;
const WATER_FS = `#version 300 es
precision highp float;
in vec3 vWP; in vec2 vUv;
uniform sampler2D uScene; uniform sampler2D uDepth;
uniform float uTime; uniform vec3 uCamPos; uniform float uWSpd;
uniform float uChop; uniform float uRain; uniform float uMist; uniform float uShoreX;
uniform mat4 uViewI; uniform mat4 uViewM; uniform mat4 uProjM;
${SKY_U}
${GLSL_NOISE}
${SKY_FN}
out vec4 oC;
vec3 ssrHit(vec3 p, vec3 r){
  for(int i=0;i<10;i++){
    float t = 0.4+float(i)*(0.35+float(i)*0.12);
    vec3 sp = p+r*t;
    vec4 cp = uProjM*uViewM*vec4(sp,1.0);
    if(cp.w<=0.0) break;
    vec3 ndc = cp.xyz/cp.w;
    vec2 suv = ndc.xy*0.5+0.5;
    if(suv.x<0.002||suv.x>0.998||suv.y<0.002||suv.y>0.998) break;
    float dscene = texture(uDepth, suv).r;
    float drawn = clamp((length(sp-uCamPos)-0.1)/899.9, 0.0, 1.0);
    if(dscene < drawn-0.0012) return texture(uScene, suv).rgb;
  }
  return vec3(-1.0);
}
void main(){
  vec2 p = vWP.xz;
  float t = uTime*uWSpd;
  float e = 0.35;
  vec2 wob = vec2(t*0.45,-t*0.28)*(0.5+uChop);
  float hC = fbm(p*0.55+wob);
  float hX = fbm((p+vec2(e,0.0))*0.55+wob);
  float hZ = fbm((p+vec2(0.0,e))*0.55+wob);
  float amp = (0.35+uChop*0.9)*0.5;
  vec3 N = normalize(vec3(-(hX-hC)*amp/e, 1.0, -(hZ-hC)*amp/e));
  if(uRain>0.01){
    vec2 rp = p*2.2+vec2(0.0,t*7.0);
    vec2 cell = floor(rp);
    float rh = hash12(cell);
    vec2 c = fract(rp)-0.5;
    float ring = smoothstep(0.5,0.40,length(c))*step(rh,0.4)*fract(t*1.4+rh*7.0);
    N.xz += (c/max(length(c),1e-3))*ring*0.7*uRain;
    N = normalize(N);
  }
  vec3 V = normalize(uCamPos-vWP);
  float fres = 0.02+0.98*pow(1.0-max(dot(N,V),0.0),5.0);
  fres = mix(fres, 1.0, uMist*0.25);
  vec3 R = reflect(-V,N);
  R.y = abs(R.y)+0.02;
  vec3 skyR = skyColor(normalize(R), t);
  vec3 hit = ssrHit(vWP, normalize(R));
  vec3 refCol = hit.x<-0.5 ? skyR : mix(skyR, hit, 0.72);
  vec3 deep = mix(vec3(0.030,0.065,0.085), vec3(0.008,0.015,0.030), uNight);
  deep = mix(deep, vec3(0.10,0.12,0.12), uMist*0.5);
  vec3 col = mix(deep, refCol, clamp(fres,0.0,1.0));
  vec3 L1 = -normalize(uSunDir);
  vec3 Hv = normalize(L1+V);
  col += uSunCol*pow(max(dot(N,Hv),0.0),700.0)*3.0*uSunI;
  vec3 Lm = -normalize(uMoonDir);
  vec3 Hm = normalize(Lm+V);
  col += uMoonCol*pow(max(dot(N,Hm),0.0),900.0)*2.5*uMoonI;
  float shore = smoothstep(2.4,0.12,abs(vWP.z-uShoreX));
  float foamN = fbm(p*2.4+vec2(0.0,t*0.7));
  float foam = shore*smoothstep(0.42,0.75,foamN+shore*0.28);
  col = mix(col, vec3(0.72,0.75,0.75)*(0.35+0.65*(1.0-uNight)), foam*0.65);
  float dist = length(uCamPos-vWP);
  vec3 mistC = skyColor(normalize(vec3(V.x,0.12,V.z)), t);
  col = mix(col, mistC, clamp(dist/170.0,0.0,1.0)*(0.30+uMist*0.60));
  oC = vec4(col, 1.0);
}`;

export { WATER_FS, WATER_VS };
