// Fireplace Studio — renderer/shaders/fire.js. See README.md for ownership and replacement boundaries.
import { GLSL_NOISE } from './common.js';

const PART_VS = `#version 300 es
layout(location=0) in vec2 aQuad;
layout(location=1) in vec4 aSeed;
uniform mat4 uProj; uniform mat4 uView;
uniform vec3 uOrigin; uniform float uMode; uniform float uTime;
uniform float uRise; uniform float uSize; uniform float uSpread; uniform float uRate;
uniform float uSway; uniform float uGrow;
out vec2 vQ; out vec4 vSeed; out float vFade; out float vCyc; out vec3 vWP;
void main(){
  float cyc = fract(uTime*uRate*(0.7+0.6*aSeed.x)+aSeed.y);
  vec3 p = uOrigin;
  p.x += (aSeed.z-0.5)*2.0*uSpread;
  p.z += (aSeed.w-0.5)*2.0*uSpread;
  if(uMode>3.5 && uMode<5.5) p.y = uOrigin.y-cyc*uRise;
  else if(uMode<5.5) p.y += uRise*cyc;
  p.x += sin(uTime*(1.0+aSeed.x)+aSeed.y*40.0)*uSway*(0.3+cyc);
  if(uMode>3.5 && uMode<5.5 && p.z<4.12){ vQ=vec2(0.0); vSeed=vec4(0.0); vFade=0.0; vCyc=0.0; vWP=p; gl_Position=vec4(0.0,0.0,-3.0,1.0); return; }
  if(uMode>0.5 && uMode<1.5){
    vec2 sdo = vec2(aSeed.z-0.5, aSeed.w-0.5);
    float sdl = max(length(sdo),1e-3);
    p.x += sdo.x/sdl*cyc*0.4; p.z += sdo.y/sdl*cyc*0.4;
  }
  float size = uSize*(0.6+0.8*aSeed.w)*(1.0+(uGrow-1.0)*cyc);
  if(uMode>4.5 && uMode<5.5) size = uSize;
  vFade = (uMode>3.5 && uMode<5.5) ? (1.0-abs(cyc-0.5)*2.0) : (1.0-cyc)*smoothstep(0.0,0.12,cyc);
  vCyc = cyc;
  vec3 right = vec3(uView[0][0],uView[1][0],uView[2][0]);
  vec3 up = vec3(uView[0][1],uView[1][1],uView[2][1]);
  vec3 wp;
  if(uMode>5.5 && uMode<6.5){
    float ang = floor(aSeed.z*3.0)*1.0472+(fract(aSeed.z*7.0)-0.5)*0.55;
    vec3 sr = vec3(cos(ang),0.0,sin(ang));
    float h01 = aQuad.y+0.5;
    float swayS = sin(uTime*(1.6+aSeed.x*1.3)+aSeed.y*40.0)*h01*h01*0.22*size;
    wp = p+vec3(0.0,1.0,0.0)*aQuad.y*size+sr*(aQuad.x*size*0.5+swayS);
  }
  else if(uMode>4.5) wp = p+vec3(0.0,1.0,0.0)*aQuad.y*size+right*aQuad.x*size*0.06;
  else wp = p+(right*aQuad.x+up*aQuad.y)*size;
  vQ=aQuad; vSeed=aSeed; vWP=wp;
  gl_Position = uProj*uView*vec4(wp,1.0);
}`;
const PART_FS = `#version 300 es
precision highp float;
in vec2 vQ; in vec4 vSeed; in float vFade; in float vCyc; in vec3 vWP;
uniform float uMode; uniform float uTime; uniform float uAlpha; uniform float uFlick;
uniform float uBurn;
uniform vec4 uLogs[5]; uniform vec4 uLogAx[5]; uniform vec3 uCamPos;
out vec4 oC;
${GLSL_NOISE}
/* screen-space log silhouette: carve a tunnel through flame billboards along
   each view ray that passes through a log, so flames visibly part around the
   dark log silhouettes instead of washing over them in screen space.
   Depth-independent on purpose: where the log covers the screen, flames die
   there (the reference look) and lick harder in the halo around it.
   Returns (suppress, rimBoost). Deterministic. */
vec2 silhouette(vec3 p, float h01){
  vec3 rdir = p - uCamPos;
  float tFrag = length(rdir); rdir /= max(tFrag, 1e-4);
  float sil = 1.0; float rim = 0.0;
  for(int i=0;i<5;i++){
    vec3 m = uLogs[i].xyz; float rad = max(uLogs[i].w, 1e-4);
    vec3 ax = uLogAx[i].xyz; float h = uLogAx[i].w;
    vec3 w0 = uCamPos - m;
    float b = dot(rdir, ax);
    float dd = dot(rdir, w0);
    float e = dot(ax, w0);
    float D = max(1.0 - b*b, 1e-5);
    float sSeg = clamp((e - b*dd)/D, -h, h);
    vec3 q = m + ax*sSeg;
    float tRay = dot(q - uCamPos, rdir);
    float dist = length((uCamPos + rdir*tRay) - q) / rad;
    float prox = 1.0 - smoothstep(0.85, 1.45, dist);
    sil *= 1.0 - prox*0.96;
    float band = (1.0 - smoothstep(1.30, 2.30, dist)) * smoothstep(0.90, 1.25, dist);
    rim += band;
  }
  return vec2(sil, min(rim,1.2)*0.50*(0.35+0.65*h01));
}
/* geometry-aware fire: analytic distance to the 5 firebox log segments
   (center+radius in uLogs, axis+halfLen in uLogAx). Returns distance in
   units of log radius, so 1.0 == the log surface. Deterministic. */
float logProx(vec3 p){
  float m = 1e9;
  for(int i=0;i<5;i++){
    vec3 d = p - uLogs[i].xyz;
    float t = clamp(dot(d, uLogAx[i].xyz), -uLogAx[i].w, uLogAx[i].w);
    float dd = length(d - uLogAx[i].xyz*t) / max(uLogs[i].w, 1e-4);
    m = min(m, dd);
  }
  return m;
}
/* flame/log interaction: suppress inside log volume, boost at log edges,
   climbing stronger with height. Returns the adjusted heat. */
float logWrap(float heat, float h01){
  float lp = logProx(vWP);
  float inside = 1.0 - smoothstep(0.70, 1.10, lp);
  float edge = (1.0-smoothstep(1.10, 1.80, lp)) * smoothstep(0.72, 1.02, lp);
  heat *= 1.0 - inside*0.94;
  heat = clamp(heat + edge*0.70*(0.35+0.65*h01), 0.0, 1.0);
  /* screen-space silhouette carve + rim lick */
  vec2 silh = silhouette(vWP, h01);
  return clamp(heat*silh.x + silh.y, 0.0, 1.0);
}
/* wash-parting for the non-flame particle modes (ember/glow): suppresses the
   bright billboards inside the log volumes so the fire reads as parting
   around dark log silhouettes. No edge boost here — the flame tongues
   already provide the licking edge. */
float logDampen(vec3 p){
  float lp = logProx(p);
  float inside = 1.0 - smoothstep(0.60, 1.05, lp);
  return 1.0 - inside*0.88;
}
vec4 flameShade(vec2 q, float ph, float te, float flick, float burn){
  float h01 = q.y+0.5;
  /* flame-local heat shimmer: wobble the noise lookup, strongest at the hot base */
  float shim = fbm(vec2(q.x*6.0+ph, h01*3.0 - te*2.2));
  vec2 wuv = vec2(q.x*3.2, h01*2.2 - te*(0.9+0.35*sin(ph))) + (shim-0.5)*0.35*(1.0-h01);
  float curl = mix(1.25, 0.55, burn);
  float warp = fbm(wuv*1.7 + vec2(ph*3.1, -te*0.6) + fbm(wuv*2.3+vec2(ph))*0.9);
  float width = mix(0.60, 0.10, pow(h01,0.8));
  float d = abs(q.x + (warp-0.5)*0.6*curl*(0.25+h01));
  float body = smoothstep(width, width*0.22, d);
  float hgt = mix(0.72, 1.22, burn);
  float tip = 1.0 - smoothstep(0.50+0.38*(warp-0.5), 1.02, clamp(h01/hgt,0.0,1.0));
  float base = smoothstep(0.0, 0.10, h01);
  float heat = clamp(body*tip*base*1.25*mix(0.80,1.20,burn), 0.0, 1.0);
  heat = logWrap(heat, h01);
  vec3 coolC = mix(vec3(0.80,0.13,0.015), vec3(0.60,0.075,0.010), burn);
  vec3 col = mix(coolC, vec3(1.0,0.42,0.07), clamp(heat*1.5,0.0,1.0));
  vec3 hotC = mix(vec3(1.0,0.88,0.55), vec3(1.0,0.55,0.18), burn);
  col = mix(col, hotC, clamp((heat-0.55)*2.4,0.0,1.0));
  float a = clamp(heat*1.05, 0.0, 0.90);
  return vec4(col*(0.72+0.60*flick), a);
}
vec4 tongueShade(vec2 q, float ph, float te, float flick, vec4 seed, float burn){
  float h01 = q.y+0.5;
  float shim = fbm(vec2(q.x*7.0+ph*1.3, h01*3.4 - te*2.6));
  vec2 wuv = vec2(q.x*4.0, h01*2.6 - te*(1.2+0.4*sin(ph))) + (shim-0.5)*0.30*(1.0-h01);
  float curl = mix(1.25, 0.55, burn);
  float warp = fbm(wuv*1.9 + vec2(ph*2.7, -te*0.8) + fbm(wuv*2.6+vec2(ph))*0.8);
  float width = mix(0.38, 0.05, pow(h01,0.9));
  float d = abs(q.x + (warp-0.5)*0.55*curl*(0.25+h01));
  float body = smoothstep(width, width*0.25, d);
  float hgt = mix(0.72, 1.22, burn);
  float tip = 1.0 - smoothstep(0.42+0.34*(warp-0.5), 1.0, clamp(h01/hgt,0.0,1.0));
  float base = smoothstep(0.0, 0.08, h01);
  float heat = clamp(body*tip*base*1.3*mix(0.80,1.20,burn), 0.0, 1.0);
  heat = logWrap(heat, h01);
  float tvar = seed.x;
  vec3 coolC = mix(vec3(0.78,0.12,0.01), vec3(0.60,0.07,0.01), burn);
  vec3 col = mix(coolC, vec3(1.0,0.40,0.06), clamp(heat*1.6,0.0,1.0));
  vec3 hotC = mix(mix(vec3(1.0,0.72,0.30), vec3(1.0,0.85,0.45), tvar), vec3(1.0,0.52,0.16), burn);
  col = mix(col, hotC, clamp((heat-0.5)*2.2,0.0,1.0));
  float a = clamp(heat*1.05, 0.0, 0.9);
  return vec4(col*(0.75+0.60*flick), a);
}
void main(){
  float r = length(vQ)*2.0;
  if(uMode<0.5){
    vec4 fsh = flameShade(vQ, vSeed.x*6.2831, uTime, uFlick, uBurn);
    oC = vec4(fsh.rgb, fsh.a*uAlpha*vFade);
  } else if(uMode<1.5){
    float tw = 0.55+0.45*sin(uTime*(7.0+vSeed.x*9.0)+vSeed.y*47.0);
    float b=smoothstep(1.0,0.0,r)*tw*logDampen(vWP)*silhouette(vWP, vQ.y+0.5).x;
    vec3 col=mix(vec3(1.0,0.72,0.28),vec3(0.85,0.12,0.02),clamp(vCyc*1.2,0.0,1.0));
    oC=vec4(col*2.0,b*uAlpha*vFade);
  } else if(uMode<2.5){
    float b=smoothstep(1.0,0.15,r);
    vec2 suv = vec2(vQ.x*2.2, vQ.y*1.1 - uTime*0.22 + vSeed.x*9.0);
    float w = fbm(suv*1.6 + fbm(suv*2.3+vec2(vSeed.y*7.0))*0.85);
    float dens = smoothstep(0.32,0.78,w);
    oC=vec4(vec3(0.12,0.115,0.115)*(0.55+0.9*w), b*dens*uAlpha*vFade*0.5);
  } else if(uMode<3.5){
    float b=smoothstep(1.0,0.0,r)*logDampen(vWP)*silhouette(vWP, vQ.y+0.5).x; b*=b;
    float puls = 0.65+0.35*sin(uTime*1.9+vSeed.x*43.0);
    oC=vec4(vec3(1.0,0.40,0.09)*b*puls*(0.65+0.7*uFlick), b*uAlpha*vFade);
  } else if(uMode<4.5){
    float b=smoothstep(1.0,0.3,r);
    oC=vec4(vec3(0.92,0.95,1.0),b*uAlpha*vFade);
  } else if(uMode<5.5){
    float b=smoothstep(0.5,0.1,abs(vQ.x)*2.0)*smoothstep(0.5,0.32,abs(vQ.y)*2.0);
    oC=vec4(vec3(0.65,0.72,0.82),b*uAlpha*vFade);
  } else if(uMode<6.5){
    vec4 fsh = flameShade(vec2(vQ.x*1.15, vQ.y), vSeed.y*6.2831+1.7, uTime*1.15, uFlick, uBurn);
    float puls = 0.82+0.18*sin(uTime*2.2+vSeed.x*39.0);
    oC = vec4(fsh.rgb, fsh.a*uAlpha*puls);
  } else {
    vec4 tsh = tongueShade(vQ, vSeed.y*6.2831+0.6, uTime, uFlick, vSeed, uBurn);
    float puls = 0.78+0.22*sin(uTime*3.1+vSeed.x*57.0);
    oC = vec4(tsh.rgb, tsh.a*uAlpha*puls*vFade);
  }
}`;

export { PART_FS, PART_VS };
