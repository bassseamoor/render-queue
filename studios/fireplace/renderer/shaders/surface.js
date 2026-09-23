// Fireplace Studio — renderer/shaders/surface.js. See README.md for ownership and replacement boundaries.
import { GLSL_NOISE, SKY_FN, SKY_U } from './common.js';

const LIT_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv;
uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProj; uniform mat4 uShadowM;
out vec3 vWP; out vec3 vN; out vec2 vUv; out vec4 vSh; out vec3 vLocal;
void main(){
  vec4 wp = uModel*vec4(aPos,1.0);
  vLocal = aPos;
  vWP = wp.xyz;
  vN = mat3(uModel)*aNrm;
  vUv = aUv;
  vSh = uShadowM*wp;
  gl_Position = uProj*uView*wp;
}`;
const LIT_FS = `#version 300 es
precision highp float;
in vec3 vWP; in vec3 vN; in vec2 vUv; in vec4 vSh; in vec3 vLocal;
uniform sampler2D uTexAlb; uniform sampler2D uTexNrm; uniform sampler2D uTexRgh;
uniform sampler2D uShadow;
uniform vec3 uCamPos; uniform float uTime;
uniform vec3 uTintA; uniform vec3 uEmis; uniform float uRoughMul; uniform float uUvScale; uniform float uMode;
uniform float uDetail;
uniform vec3 uFirePos; uniform float uFlick; uniform vec3 uFireCol; uniform float uFireI;
uniform float uEmber; uniform float uChar;
uniform vec3 uCeilPos[4]; uniform vec3 uCeilCol; uniform float uCeilI;
uniform vec3 uAmbTint; uniform vec3 uFillCol;
${SKY_U}
${GLSL_NOISE}
${SKY_FN}
out vec4 oC;
vec3 perturbN(vec3 Ng, vec3 V, vec2 tuv){
  vec3 q0=dFdx(vWP), q1=dFdy(vWP);
  vec2 st0=dFdx(tuv), st1=dFdy(tuv);
  vec3 T=normalize(q0*st1.t-q1*st0.t+vec3(1e-5));
  vec3 B=normalize(-q0*st1.s+q1*st0.s+vec3(1e-5));
  vec3 mt=texture(uTexNrm,tuv).rgb*2.0-1.0;
  return normalize(mat3(T,B,Ng)*mt);
}
/* world-space (non-repeating) micro detail: dominant-axis planar projection */
vec2 matWSCoord(vec3 wp, vec3 N){
  vec3 an=abs(N);
  return (an.y>=an.x&&an.y>=an.z)?wp.xz:((an.x>=an.z)?wp.zy:wp.xy);
}
vec3 matWSBump(vec3 wp, vec3 N, float amt){
  vec3 an=abs(N);
  vec2 wuv=(an.y>=an.x&&an.y>=an.z)?wp.xz:((an.x>=an.z)?wp.zy:wp.xy);
  float e=0.05, fq=43.0;
  float c0=vnoise(wuv*fq);
  vec2 gg=vec2(vnoise((wuv+vec2(e,0.0))*fq)-c0, vnoise((wuv+vec2(0.0,e))*fq)-c0);
  vec3 g=(an.y>=an.x&&an.y>=an.z)?vec3(gg.x,0.0,gg.y):((an.x>=an.z)?vec3(0.0,gg.x,gg.y):vec3(gg.x,gg.y,0.0));
  return normalize(N-g*(amt*1.15));
}
float shadowAt(vec4 sp){
  vec3 pc = sp.xyz/max(sp.w,1e-5)*0.5+0.5;
  if(pc.x<0.001||pc.x>0.999||pc.y<0.001||pc.y>0.999||pc.z>1.0) return 1.0;
  vec2 ts = vec2(1.0/1024.0);
  float s=0.0;
  for(int i=-1;i<=1;i++)for(int j=-1;j<=1;j++)
    s += step(pc.z-0.0028, texture(uShadow,pc.xy+vec2(float(i),float(j))*ts).r);
  return mix(0.28,1.0,s/9.0);
}
void main(){
  vec2 tuv = vUv*uUvScale;
  vec4 alb4 = texture(uTexAlb,tuv);
  vec3 alb = alb4.rgb*uTintA;
  if(uChar>0.5) alb = mix(alb, vec3(0.020,0.015,0.012), 0.93); /* charred bark */
  float bakedAO = alb4.a;
  float rough = clamp(texture(uTexRgh,tuv).r*uRoughMul,0.05,1.0);
  vec3 V = normalize(uCamPos-vWP);
  vec3 Ng = normalize(vN)*(gl_FrontFacing?1.0:-1.0);
  vec3 N = perturbN(Ng,V,tuv);
  if(uDetail>0.001){
    vec2 dwuv = matWSCoord(vWP,N);
    float dm = vnoise(dwuv*5.0)*0.55+vnoise(dwuv*19.0+3.7)*0.30+vnoise(dwuv*61.0+9.1)*0.15;
    alb *= 1.0+(dm-0.5)*0.30*uDetail;
    rough = clamp(rough+(vnoise(dwuv*13.0+5.3)-0.5)*0.35*uDetail,0.05,1.0);
    N = matWSBump(vWP,N,uDetail);
  }
  float sh = shadowAt(vSh);
  vec3 L = -normalize(uSunDir);
  float ndl = max(dot(N,L),0.0);
  vec3 H = normalize(L+V);
  float spec = pow(max(dot(N,H),0.0),mix(24.0,220.0,1.0-rough))*(1.0-rough*0.9);
  vec3 direct = uSunCol*uSunI*ndl*sh;
  vec3 fD = uFirePos-vWP;
  float fDist = length(fD);
  vec3 fL = fD/max(fDist,1e-3);
  float fAtt = uFireI*uFlick/(1.0+fDist*fDist*0.55);
  float fNdl = max(dot(N,fL),0.0);
  vec3 fire = uFireCol*fAtt*(0.35+0.65*fNdl);
  vec3 ceilL = vec3(0.0);
  for(int i=0;i<4;i++){
    vec3 cD = uCeilPos[i]-vWP;
    float cDist = length(cD);
    vec3 cL = cD/max(cDist,1e-3);
    float cAtt = uCeilI/(1.0+cDist*cDist*0.38);
    ceilL += uCeilCol*cAtt*(0.30+0.70*max(dot(N,cL),0.0));
  }
  vec3 skyAmb = skyColor(normalize(mix(N,vec3(0.0,1.0,0.0),0.65)),uTime);
  vec3 amb = mix(vec3(0.16,0.14,0.12),skyAmb,0.55)*uAmbTint*(0.35+0.65*clamp(N.y*0.5+0.5,0.0,1.0));
  float fillF = clamp(dot(N,normalize(vec3(0.2,0.35,1.0))),0.0,1.0);
  vec3 fill = uFillCol*fillF*0.22*(0.4+0.6*uCloud);
  vec3 col = alb*(direct+fire+ceilL+amb+fill)*bakedAO;
  col += spec*(direct*0.6+fire*0.8+ceilL*0.7+vec3(0.04))*bakedAO;
  if(uMode>0.5&&uMode<1.5){ /* polished concrete floor: soft environment wash */
    vec3 R=reflect(-V,N);
    vec3 env=skyColor(normalize(R),uTime);
    col=mix(col,env*(0.25+0.75*(1.0-rough)),0.35*(1.0-rough));
  }
  if(uMode>1.5){ /* glossy black: true fresnel-weighted reflections, stays black face-on */
    vec3 R=reflect(-V,N);
    float fres=0.04+0.96*pow(1.0-max(dot(N,V),0.0),5.0);
    vec3 skyRef=skyColor(normalize(R),uTime);
    float sunRef=pow(max(dot(R,-normalize(uSunDir)),0.0),600.0);
    vec3 fD2=uFirePos-vWP; float fd2=length(fD2); vec3 fL2=fD2/max(fd2,1e-3);
    float fireRef=pow(max(dot(R,fL2),0.0),90.0)*uFireI*uFlick/(1.0+fd2*fd2*0.25);
    col+=(skyRef*0.30+uSunCol*sunRef*2.0+uFireCol*fireRef*1.2)*fres;
  }
  if(uEmber>0.5){
    vec2 ecell = vWP.xz*vec2(9.0,7.0);
    vec2 eci = floor(ecell);
    float ch = hash12(eci*1.7+3.1);
    float pulse = 0.55+0.45*sin(uTime*(0.6+ch*0.9)+ch*43.0);
    float shimmer = 0.5+0.5*sin(uTime*(7.0+ch*5.0)+ch*91.0);
    float flare = smoothstep(0.965,1.0,sin(uTime*0.31+ch*57.0)*0.5+0.5);
    float heat = clamp(0.30+0.45*pulse+0.20*shimmer+0.55*flare, 0.0, 1.0);
    vec3 coal = mix(vec3(0.05,0.02,0.015), vec3(0.85,0.16,0.02), heat);
    coal = mix(coal, vec3(1.0,0.42,0.08), clamp((heat-0.72)*3.0,0.0,1.0)*0.8);
    float gap = smoothstep(0.06,0.22,length(fract(ecell)-0.5));
    col = mix(vec3(0.03,0.02,0.02), coal, gap);
    col += coal*heat*(0.35+0.65*uFlick)*gap;
  }
  if(uChar>0.5){
    /* glowing cracks in the char: ridged fbm crevices along the log */
    float sideM = 1.0-smoothstep(0.485,0.5,abs(vLocal.y));
    vec2 cuv = vec2(vUv.x*4.0, vUv.y*6.0);
    float w1 = fbm(cuv*vec2(3.0,1.5)+fbm(cuv*2.0)*0.8);
    float ridge = 1.0-abs(2.0*w1-1.0);
    float crack = smoothstep(0.86,0.97,ridge)*sideM;
    float chc = hash12(floor(cuv*vec2(6.0,3.0))*1.3+7.7);
    float pulse = 0.45+0.55*sin(uTime*(1.2+chc*1.6)+chc*61.0);
    vec3 glowC = mix(vec3(1.0,0.14,0.01), vec3(1.0,0.52,0.10), clamp(pulse,0.0,1.0));
    float flickC = clamp(uFlick,0.0,1.5);
    col += glowC * crack * (0.35+0.65*flickC) * (0.5+0.5*pulse);
    /* cut ends: ember glow fading out to a charred rim */
    float capM = smoothstep(0.47,0.5,abs(vLocal.y));
    vec2 cuv2 = vLocal.xz*2.0;
    float rr = length(cuv2);
    float rings = 0.5+0.5*sin(rr*44.0+fbm(cuv2*3.0)*4.0);
    float endGlow = capM*smoothstep(1.0,0.15,rr);
    vec3 endC = mix(vec3(0.90,0.10,0.01), vec3(1.0,0.45,0.08), rings*0.6+pulse*0.4);
    col += endC*endGlow*(0.30+0.70*flickC)*(0.55+0.45*pulse);
  }
  col += uEmis*bakedAO;
  oC = vec4(col,1.0);
}`;

export { LIT_FS, LIT_VS };
