// Aquarium Studio — shader sources (extracted verbatim from aquarium.html).
// Pure GLSL data: no imports, no side effects.
export const FOG_GLSL = `
uniform vec3 uFogColor;   // NOTE: this block declares uFogColor AND uFogRange — do NOT redeclare them below
uniform vec2 uFogRange;
vec3 applyFog(vec3 col, float dist){
  float f = smoothstep(uFogRange.x, uFogRange.y, dist);
  return mix(col, uFogColor, f * 0.85);
}`;
export const CAUSTIC_GLSL = `
float caustic(vec2 p, float t){
  float c = 0.0;
  vec2 q = p;
  for(int i=0;i<3;i++){
    float fi = float(i)*1.7;
    q = p + 0.35*vec2(sin(q.y*2.1 + t*1.1 + fi), cos(q.x*2.1 - t*0.9 + fi*1.3));
    float w = sin(q.x*3.0 + t*1.7 + fi) * sin(q.y*3.0 - t*1.3 + fi*2.1);
    c += 1.0 - abs(w);
  }
  c /= 3.0;
  return pow(clamp(c, 0.0, 1.0), 3.0);
}`;
export const BG_VS = `precision highp float; attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }`;
export const BG_FS = `precision highp float; varying vec2 vUv; uniform float uTime;
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot;
void main(){
  float temp = sin(uTime*0.0052);
  float temp2 = sin(uTime*0.0034+1.7);
  vec3 top = uTop*vec3(1.0+0.05*temp, 1.0+0.01*temp, 1.0-0.04*temp);
  vec3 mid = uMid*vec3(1.0+0.04*temp, 1.0, 1.0-0.03*temp);
  vec3 bot = uBot;
  vec3 col = mix(bot, mid, smoothstep(0.0,0.55,vUv.y));
  col = mix(col, top, smoothstep(0.55,1.0,vUv.y));
  float g = sin(vUv.x*4.0+uTime*0.07+temp2)*sin(vUv.y*3.0-uTime*0.05);
  col += vec3(0.02,0.05,0.07)*(0.5+0.5*g);
  gl_FragColor = vec4(col,1.0);
}`;
export const RAY_FS = `precision highp float; varying vec2 vUv; uniform float uTime;
uniform vec3 uRayCol; uniform float uRayI;
float band(float x, float c, float w){ float d=(x-c)/w; return exp(-d*d); }
void main(){
  vec2 uv = vUv;
  float acc = 0.0;
  for(int i=0;i<6;i++){
    float fi = float(i);
    float drift = 0.055*sin(uTime*0.09 + fi*0.9) + 0.030*sin(uTime*0.22 + fi*2.3);
    float cx = 0.13 + fi*0.148 + drift;
    float slant = (1.0-uv.y)*0.34;
    float wdt = 0.048 + 0.030*(0.5+0.5*sin(uTime*0.16 + fi*1.7));
    float b = band(uv.x, cx+slant, wdt);
    float vert = smoothstep(0.0,0.35,uv.y)*(0.25+0.75*uv.y);
    float fl = 0.60+0.40*sin(uTime*0.32+fi*1.9);
    acc += b*vert*fl*(0.70+0.30*sin(fi*3.7));
  }
  vec3 col = uRayCol*acc*uRayI;
  gl_FragColor = vec4(col, clamp(acc*0.45,0.0,0.85));
}`;
export const SURF_VS = `precision highp float;
attribute vec3 aPos; uniform mat4 uMvp; varying vec3 vW;
void main(){ vW = aPos; gl_Position = uMvp*vec4(aPos,1.0); }`;
export const SURF_FS = `precision highp float;
uniform float uTime; uniform vec3 uTintC; uniform vec3 uGlowC; varying vec3 vW;
${CAUSTIC_GLSL}
void main(){
  float ca = caustic(vW.xz*0.8, uTime);
  vec3 col = uTintC*0.95 + vec3(0.85,0.97,1.0)*pow(ca,2.0)*1.5;
  vec2 sun = vec2(0.7+0.30*sin(uTime*0.0045), 0.4+0.18*sin(uTime*0.0031+2.0));
  float sd = length(vW.xz - sun);
  col += uGlowC*exp(-sd*sd*1.1)*0.55;
  float edge = smoothstep(5.5,4.2,abs(vW.x)) * smoothstep(4.5,3.4,abs(vW.z));
  gl_FragColor = vec4(col, edge);
}`;
export const SAND_VS = `precision highp float;
attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv;
uniform mat4 uMvp; varying vec3 vW; varying vec3 vN; varying vec2 vUv;
void main(){ vW=aPos; vN=aNor; vUv=aUv; gl_Position=uMvp*vec4(aPos,1.0); }`;
export const SAND_FS = `precision highp float;
uniform float uTime; uniform vec3 uCamPos; uniform vec3 uSandCol;
uniform vec3 uAmbCol; uniform float uAmb;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI;
uniform vec3 uCausticCol;
uniform sampler2D uTrim; uniform sampler2D uSandTex; uniform float uSandNorm;
varying vec3 vW; varying vec3 vN; varying vec2 vUv;
${CAUSTIC_GLSL}
${FOG_GLSL}
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  vec3 N = normalize(vN);
  vec3 base = uSandCol*(texture2D(uSandTex, vW.xz*0.55).rgb*uSandNorm);
  base *= mix(vec3(1.0), texture2D(uTrim, vUv).rgb, 0.60);
  float up = max(dot(N, vec3(0.0,1.0,0.0)), 0.0);
  vec3 sd = normalize(uSunDir);
  vec3 col = base*(uAmbCol*(uAmb*(0.55+0.45*up)) + uSunCol*max(dot(N,sd),0.0)*uSunI);
  float ca = caustic(vW.xz*0.55, uTime);
  float breathe = 0.90+0.18*sin(uTime*0.0045+1.1);
  col += uCausticCol*ca*(0.25+0.75*up)*1.15*breathe;
  float sd2 = length(uCamPos-vW);
  col = applyFog(col, sd2);
  col = mix(col, uFogColor, smoothstep(uFogRange.x+1.0, uFogRange.y-2.0, sd2));
  gl_FragColor = vec4(col,1.0);
}`;
export const ROCK_VS = `precision highp float;
attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol; attribute vec2 aUv;
uniform mat4 uMvp;
varying vec3 vN; varying vec3 vW; varying vec3 vCol; varying vec2 vUv;
void main(){
  vN = aNor; vW = aPos; vCol = aCol; vUv = aUv;
  gl_Position = uMvp*vec4(aPos,1.0);
}`;
export const ROCK_FS = `precision highp float;
uniform float uTime; uniform vec3 uCamPos;
uniform vec3 uAmbCol; uniform float uAmb;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI;
uniform vec3 uCausticCol;
uniform sampler2D uTrim; uniform sampler2D uRockTex;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec2 vUv;
${CAUSTIC_GLSL}
${FOG_GLSL}
void main(){
  vec3 N = normalize(vN);
  vec3 sd = uSunDir;
  float dif = max(dot(N,sd),0.0);
  vec3 col = vCol*(uAmbCol*uAmb*0.85 + uSunCol*dif*uSunI);
  col *= mix(vec3(1.0), texture2D(uTrim, vUv).rgb, 0.50);
  col *= mix(vec3(1.0), texture2D(uRockTex, vW.xz*0.9 + vW.yy*0.35).rgb, 0.5);
  float up = max(dot(N,vec3(0.0,1.0,0.0)),0.0);
  col += uCausticCol*caustic(vW.xz*0.7+vW.y*0.3, uTime)*up*up*0.55;
  col = applyFog(col, length(uCamPos-vW));
  gl_FragColor = vec4(col,1.0);
}`;
export const PLANT_VS = `precision highp float;
attribute vec3 aPos; attribute vec3 aNor; attribute float aBend; attribute float aPhase; attribute vec2 aUv;
uniform mat4 uMvp; uniform float uTime;
varying float vBend; varying float vPh; varying vec3 vN; varying vec3 vW; varying vec2 vUv;
void main(){
  vec3 p = aPos;
  float b = aBend*aBend;
  float sway = sin(uTime*0.90 + aPhase - aBend*2.4)*0.17 + sin(uTime*1.75 + aPhase*1.7 - aBend*3.5)*0.05;
  sway += sin(uTime*0.37 + aPhase*0.7 + aBend*1.9)*0.09;   /* slow low-frequency drift layer */
  p.x += sway*b; p.z += sway*0.6*b;
  p.y += sin(uTime*0.52 + aPhase*1.3)*0.018*b;            /* faint vertical breathing */
  vBend = aBend; vPh = aPhase; vN = aNor; vW = aPos; vUv = aUv;
  gl_Position = uMvp*vec4(p,1.0);
}`;
export const PLANT_FS = `precision highp float;
uniform vec3 uCamPos;
uniform vec3 uAmbCol; uniform float uAmb;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI;
uniform sampler2D uTrim;
varying float vBend; varying float vPh; varying vec3 vN; varying vec3 vW; varying vec2 vUv;
${FOG_GLSL}
void main(){
  vec3 deep = vec3(0.045,0.20,0.115);
  vec3 tip  = vec3(0.20,0.70,0.38);
  float jitter = 0.82+0.36*fract(sin(vPh*12.9898)*43758.5453);
  vec3 base = mix(deep, tip, vBend)*jitter;
  base *= mix(vec3(1.0), texture2D(uTrim, vUv).rgb, 0.55);
  vec3 N = normalize(vN);
  float ndl = abs(dot(N, normalize(uSunDir)));
  vec3 col = base*(uAmbCol*uAmb*0.9 + uSunCol*ndl*uSunI*0.8);
  col += vec3(0.25,0.5,0.4)*pow(vBend,3.0)*0.30;
  col = applyFog(col, length(uCamPos-vW));
  gl_FragColor = vec4(col,1.0);
}`;
export const FISH_VS = `precision highp float;
attribute vec3 aPos; attribute vec3 aNor; attribute float aPart; attribute float aV;
attribute vec3 aIPos;   /* instance: world position */
attribute vec4 aIPar;   /* body yaw, pitch, size, swimPhase (radians, CPU-integrated) */
attribute vec4 aIPar2;  /* tail freq (Hz, derived from speed), waveAmp, family, stripeOn */
attribute vec4 aIPar3;  /* pectL, pectR, dorsalLean (rad), bank (rad) */
attribute vec4 aIPar4;  /* glide amp mul, headLead (rad), flare, finBoost */
attribute vec3 aIColA;  /* top color */
attribute vec3 aIColB;  /* belly color */
attribute vec4 aIColC;  /* stripe color, stripe amount */
uniform mat4 uVp;
varying float vV; varying float vFin; varying float vU; varying float vFam; varying float vPart;
varying float vFinU; varying float vFinV;
varying vec3 vN; varying vec3 vW;
varying vec3 vColA; varying vec3 vColB; varying vec4 vColC;
void main(){
  float yaw=aIPar.x, pitch=aIPar.y, size=aIPar.z, ph=aIPar.w;
  /* fin-local UVs from the rest pose: u = base->tip, v = across the span */
  float part0=aPart, finU=0.0, finV=0.0;
  if(part0>4.5&&part0<5.5){ finU=clamp((aPos.z+0.28)/-0.19,0.0,1.0); finV=clamp(aPos.y/0.155,-1.0,1.0); }
  else if(part0>5.5&&part0<6.5){ finU=clamp((aPos.y-0.07)/0.085,0.0,1.0); finV=clamp((aPos.z+0.07)/0.18,-1.0,1.0); }
  else if(part0>6.5&&part0<8.5){ float sd0=part0<7.5?1.0:-1.0;
    vec3 fb=vec3(sd0*0.055,-0.028,0.10); finU=clamp(length(aPos-fb)/0.16,0.0,1.0);
    finV=sd0*clamp((aPos.z-0.10)/-0.17,-1.0,1.0); }
  vFinU=finU; vFinV=finV;
  float freq=aIPar2.x, wamp=aIPar2.y;
  vFam=aIPar2.z; vPart=aPart;
  float pecL=aIPar3.x, pecR=aIPar3.y, dLean=aIPar3.z, bank=aIPar3.w;
  float glide=aIPar4.x, headLead=aIPar4.y, flare=aIPar4.z, finBoost=aIPar4.w;
  float speedN=clamp((freq-1.4)/1.8,0.0,1.0);
  float u0=clamp((aPos.z+0.28)/0.56,0.0,1.0);   /* 0 tail .. 1 head */
  vec3 p=aPos; vec3 n=aNor;
  float part=aPart;
  /* articulated spine: hinge z, wave factor, phase lag per piece.
     the wave begins behind the gills (head ~0) and grows toward the tail */
  float zh, af, lag;
  if(part<0.5){ zh=0.10; af=0.05; lag=0.00; }        /* head */
  else if(part<1.5){ zh=0.02; af=0.30; lag=0.28; }  /* body seg 1 */
  else if(part<2.5){ zh=-0.06; af=0.58; lag=0.55; } /* body seg 2 */
  else if(part<3.5){ zh=-0.14; af=0.85; lag=0.85; } /* body seg 3 */
  else if(part<4.5){ zh=-0.22; af=1.00; lag=1.15; } /* peduncle */
  else if(part<5.5){ zh=-0.24; af=1.45; lag=1.45; } /* caudal fin */
  else if(part<6.5){ zh=-0.02; af=0.42; lag=0.40; } /* dorsal fin */
  else if(part<8.5){ zh=0.10; af=0.10; lag=0.05; }  /* pectoral fins */
  else { zh=0.10; af=0.05; lag=0.00; }              /* eyes ride the head */
  /* tail beat: 8-18% of body length at the tail tip, ~0 at the head */
  float tailAng=(0.135+0.175*speedN)*wamp*glide;
  float th=tailAng*af*sin(ph-lag);
  float c=cos(th), s=sin(th);
  float dx=p.x, dz=p.z-zh;
  p.x=dx*c+dz*s; p.z=-dx*s+dz*c+zh;
  float qx=n.x, qz=n.z;
  n.x=qx*c+qz*s; n.z=-qx*s+qz*c;
  /* turn anticipation: head (and eyes) rotate to the new heading first */
  if(part<0.5||part>8.5){
    float c2=cos(headLead), s2=sin(headLead);
    float hx=p.x, hz=p.z-0.10;
    p.x=hx*c2+hz*s2; p.z=-hx*s2+hz*c2+0.10;
    float ex=n.x, ez=n.z;
    n.x=ex*c2+ez*s2; n.z=-ex*s2+ez*c2;
  }
  /* tail thrust: 1-2% body-length compression at mid-stroke + tiny forward impulse at center crossing */
  float stroke=cos(ph-1.45);
  float comp=abs(stroke);
  p.z*=1.0-0.015*comp*(1.0-0.4*u0);
  p.z+=0.006*stroke*stroke;
  /* dorsal fin: leans against turns (lagged), folds during bursts */
  if(part>5.5&&part<6.5){
    float fold=clamp((speedN-0.65)/0.35,0.0,1.0);
    float leanA=dLean-bank*0.4;
    float lc=cos(leanA), ls=sin(leanA);
    vec2 dxy=p.xy-vec2(0.0,0.055);
    dxy.y*=1.0-0.5*fold;
    p.xy=vec2(0.0,0.055)+mat2(lc,-ls,ls,lc)*dxy;
    n.xy=mat2(lc,-ls,ls,lc)*n.xy;
  }
  /* pectoral fins: cruise = slow alternating beat; braking = flare; turning = outside beats, inside folds */
  if(part>6.5&&part<8.5){
    float side=part<7.5?1.0:-1.0;
    float pec=side>0.0?pecL:pecR;
    float bph=ph*0.5+finBoost*2.0+(side>0.0?0.0:3.14159);
    float beat=sin(bph)*0.45*pec*(1.0-0.6*flare);
    float spread=0.18+flare*0.9-(pec<0.25?0.35:0.0);
    float ang=-side*(spread+beat);
    vec3 hb=vec3(side*0.055,-0.028,0.10);
    vec3 rel=p-hb;
    float ac=cos(ang), as=sin(ang);
    rel.xy=mat2(ac,-as,as,ac)*rel.xy;
    rel.z+=sin(bph-1.2)*0.02*pec;
    p=hb+rel;
    n.xy=mat2(ac,-as,as,ac)*n.xy;
  }
  /* banking: roll into turns (damped spring on CPU) */
  float bc=cos(bank), bs=sin(bank);
  p.xy=mat2(bc,-bs,bs,bc)*p.xy;
  n.xy=mat2(bc,-bs,bs,bc)*n.xy;
  vV=aV; vFin=(part>4.5&&part<8.5)?1.0:0.0; vU=u0;
  vColA=aIColA; vColB=aIColB; vColC=aIColC;
  /* model matrix Ry(yaw)*Rx(pitch), uniform scale */
  float cy=cos(yaw),syw=sin(yaw),cx=cos(pitch),sxp=sin(pitch);
  mat3 R=mat3(cy,0.0,-syw, syw*sxp,cx,cy*sxp, syw*cx,-sxp,cy*cx);
  vec3 wp=R*(p*size)+aIPos;
  vW=wp; vN=R*n;
  gl_Position=uVp*vec4(wp,1.0);
}`;
export const FISH_FS = `precision highp float;
varying vec3 vColA; varying vec3 vColB; varying vec4 vColC;
uniform vec3 uCamPos; uniform float uTime;
uniform vec3 uAmbCol; uniform float uAmb;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI;
uniform vec3 uRimCol; uniform float uCaustic;
uniform sampler2D uFishTex;
varying float vV; varying float vFin; varying float vU; varying float vFam; varying float vPart;
varying float vFinU; varying float vFinV;
varying vec3 vN; varying vec3 vW;
${FOG_GLSL}
${CAUSTIC_GLSL}
void main(){
  /* authored skin detail: r=scale relief, g=stripe mask, b=lateral-line sheen */
  vec3 ftex=texture2D(uFishTex, vec2(vU,1.0-(vFam+vV*0.5)/4.0)).rgb;
  vec3 base=mix(vColB,vColA,smoothstep(0.05,0.95,vV));
  base*=0.72+ftex.r*0.38;
  base=mix(base,vColC.rgb,ftex.g*vColC.a*(1.0-vFin*0.85));
  base*=0.82+0.36*ftex.b*(1.0-vFin*0.7);
  /* fin membrane: radiating rays, softer and darker toward the tip edge */
  if(vFin>0.5){
    float rays=sin((vFinV*7.0+vFinU*3.0)*6.2831+vFam*1.7);
    base*=0.86+0.14*rays;
    base*=0.70+0.30*smoothstep(1.05,0.25,vFinU);
  }
  vec3 N=normalize(vN);
  vec3 V=normalize(uCamPos-vW);
  float dif=max(dot(N,uSunDir),0.0);
  vec3 col=base*(uAmbCol*uAmb+uSunCol*dif*uSunI*1.25);
  /* soft top sheen (cheap) */
  float sh=max(dot(reflect(-uSunDir,N),V),0.0); sh*=sh; sh*=sh;
  col+=vec3(0.9,0.97,1.0)*sh*sh*0.35;
  /* rim light on fins and silhouette */
  float rim=pow(1.0-abs(dot(N,V)),2.0);
  col+=uRimCol*rim*(0.25+0.75*vFin)*0.5;
  /* geometry eyes (part 9): near-black with a wet specular catchlight */
  if(vPart>8.5){
    vec3 N2=normalize(vN); vec3 V2=normalize(uCamPos-vW);
    float sh2=pow(max(dot(reflect(-uSunDir,N2),V2),0.0),24.0);
    col=vec3(0.008,0.010,0.016)+vec3(0.9,0.97,1.0)*sh2*0.9;
  }
  float ca=caustic(vW.xz,uTime);
  col*=1.0+uCaustic*ca*0.7;
  col=applyFog(col,length(uCamPos-vW));
  gl_FragColor=vec4(col,1.0);
}`;
export const PTS_VS = `precision highp float;
attribute vec3 aPos; attribute float aSize; attribute float aAlpha;
uniform mat4 uMvp; uniform mat4 uMv; uniform float uPx;
varying float vA;
void main(){
  vec4 mv = uMv*vec4(aPos,1.0);
  gl_Position = uMvp*vec4(aPos,1.0);
  gl_PointSize = aSize*uPx/max(0.6,-mv.z);
  vA = aAlpha;
}`;
export const PTS_FS = `precision highp float;
uniform vec3 uTint;
varying float vA;
void main(){
  vec2 p = gl_PointCoord*2.0-1.0;
  float d = length(p);
  if(d>1.0) discard;
  float rim = smoothstep(0.45,0.92,d);
  float body = 1.0-smoothstep(0.0,0.85,d);
  vec3 col = uTint;
  float a = (body*0.22 + rim*0.8)*vA;
  gl_FragColor = vec4(col*a, a);
}`;
export const GRADE_FS = `precision highp float; varying vec2 vUv; uniform float uTime;
uniform vec3 uTint; uniform float uExpo;
float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
void main(){
  float d = length((vUv-0.5)*vec2(1.30,1.0));
  float v = smoothstep(1.02,0.28,d);
  float temp = sin(uTime*0.0052);
  vec3 tint = vec3(1.0+0.020*temp, 1.0+0.004*temp, 1.0-0.022*temp);
  vec3 col = vec3(0.72+0.28*v, 0.78+0.22*v, 0.90+0.10*v)*tint;
  col *= 0.98+0.04*v;
  col *= uTint*uExpo;
  /* subtle water-depth cue: a breath of lift near the surface, a gentle
     deepening toward the bed — the frame reads "underwater", not "backdrop" */
  float dv = smoothstep(1.0, 0.0, vUv.y);   /* 0 at surface, 1 at bed */
  col *= mix(vec3(1.015,1.015,1.020), vec3(0.970,0.985,1.000), dv);
  float g = hash(vUv*vec2(911.0,517.0)+mod(uTime*13.0,17.0));
  col *= 1.0+(g-0.5)*0.035;
  gl_FragColor = vec4(col,1.0);
}`;
export const SIL_VS = `precision highp float;
attribute vec3 aPos; attribute float aDark;
uniform mat4 uMvp; varying float vDark; varying vec3 vW;
void main(){ vDark=aDark; vW=aPos; gl_Position=uMvp*vec4(aPos,1.0); }`;
export const SIL_FS = `precision highp float;
uniform vec3 uCamPos;
varying float vDark; varying vec3 vW;
${FOG_GLSL}
void main(){
  vec3 col = vec3(0.030,0.085,0.135)*(0.35+0.65*vDark);
  float sd = length(uCamPos-vW);
  col = applyFog(col, sd);
  col = mix(col, uFogColor, 0.55);
  gl_FragColor = vec4(col,1.0);
}`;
export const CORAL_VS = `precision highp float;
attribute vec3 aPos; attribute vec3 aNor;
attribute float aTip; attribute float aHue; attribute float aBend; attribute float aPhase; attribute vec2 aUv;
uniform mat4 uMvp; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying float vTip; varying float vHue; varying vec2 vUv;
void main(){
  vec3 p = aPos;
  float b = aBend*aBend;
  float sway = sin(uTime*1.05 + aPhase)*0.10 + sin(uTime*2.0 + aPhase*1.7)*0.03;
  p.x += sway*b; p.z += sway*0.6*b;
  vN = aNor; vW = p; vTip = aTip; vHue = aHue; vUv = aUv;
  gl_Position = uMvp*vec4(p,1.0);
}`;
export const CORAL_FS = `precision highp float;
uniform vec3 uCamPos; uniform float uTime;
uniform vec3 uAmbCol; uniform float uAmb;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI;
uniform sampler2D uTrim;
varying vec3 vN; varying vec3 vW; varying float vTip; varying float vHue; varying vec2 vUv;
${FOG_GLSL}
void main(){
  vec3 base;
  if (vHue < 0.5) base = vec3(1.00,0.42,0.60);
  else if (vHue < 1.5) base = vec3(1.00,0.55,0.24);
  else if (vHue < 2.5) base = vec3(0.60,0.38,1.00);
  else base = vec3(0.22,0.48,0.32);
  vec3 N = normalize(vN);
  vec3 sd = normalize(uSunDir + vec3(0.08*sin(uTime*0.0045), 0.0, 0.06*sin(uTime*0.0032+1.2)));
  float dif = max(dot(N,sd),0.0);
  vec3 col = base*(uAmbCol*uAmb + uSunCol*dif*uSunI*1.1);
  col *= mix(vec3(1.0), texture2D(uTrim, vUv).rgb, 0.55);
  vec3 glowC = vHue > 2.5 ? vec3(0.45,1.0,0.60) : vec3(1.0,0.82,0.88);
  col += glowC*pow(clamp(vTip,0.0,1.0),2.0)*0.60;
  col = applyFog(col, length(uCamPos-vW));
  gl_FragColor = vec4(col,1.0);
}`;
export const JELLY_VS = `precision highp float;
attribute vec3 aPos; attribute vec3 aNor;
attribute float aBend; attribute float aTent; attribute float aLen; attribute float aSeed;
attribute vec3 aIPos;   /* instance world pos */
attribute vec4 aIPar;   /* spin, size, phase, speed */
attribute vec3 aITint;  /* instance tint */
uniform mat4 uVp; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying float vTent; varying float vLen; varying float vPulse; varying float vBend;
varying float vFade; varying vec3 vTint;
void main(){
  float spin = aIPar.x, size = aIPar.y, phase = aIPar.z, speed = aIPar.w;
  vec3 p = aPos;
  float pulse = sin(uTime*1.35 + phase);
  vPulse = pulse; vBend = aBend;
  if (aTent > 0.5) {
    float w1 = sin(uTime*1.7 + phase + aSeed + aLen*6.0);
    float w2 = cos(uTime*1.45 + phase*1.3 + aSeed*1.7 + aLen*5.0);
    p.x += w1*0.16*aLen; p.z += w2*0.16*aLen;
    p.y -= aLen*0.06*(0.5+0.5*pulse);
  } else {
    float contract = 1.0 - 0.17*(0.5+0.5*pulse)*aBend;
    p.x *= contract; p.z *= contract;
    p.y += pulse*0.035*aBend;
  }
  float cs = cos(spin), sn = sin(spin);
  vec3 q = vec3(p.x*cs - p.z*sn, p.y, p.x*sn + p.z*cs)*size;
  vec3 n = vec3(aNor.x*cs - aNor.z*sn, aNor.y, aNor.x*sn + aNor.z*cs);
  vN = n; vW = aIPos + q;
  float cyc = fract(uTime*0.032*speed + phase*0.159);
  vFade = min(1.0, min(cyc, 1.0-cyc)/0.08);
  vTint = aITint;
  vTent = aTent; vLen = aLen;
  gl_Position = uVp*vec4(aIPos + q, 1.0);
}`;
export const JELLY_FS = `precision highp float;
uniform vec3 uCamPos; varying float vFade; varying vec3 vTint;
varying vec3 vN; varying vec3 vW; varying float vTent; varying float vLen; varying float vPulse; varying float vBend;
${FOG_GLSL}
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(uCamPos - vW);
  float fr = pow(1.0 - abs(dot(N,V)), 2.2);
  float glow = 0.5+0.5*vPulse;
  /* translucent luminous body — dome glows, rim is defined */
  vec3 col = vTint*(0.38+0.30*glow)*(0.72+0.45*(1.0-vBend));
  /* bright rim light */
  col += mix(vTint, vec3(1.0), 0.55)*pow(fr,1.3)*0.85;
  /* soft top light on the dome */
  col += vec3(0.85,0.92,1.0)*pow(max(dot(N,V),0.0),2.0)*0.12;
  if (vTent > 0.5) col += vTint*glow*0.30;
  float a = (0.12 + 0.50*fr)*vFade;
  if (vTent > 0.5) a *= (1.0 - vLen*0.55);
  float sd = length(uCamPos - vW);
  float f = smoothstep(uFogRange.x, uFogRange.y, sd);
  col = mix(col, uFogColor, f*0.60);
  gl_FragColor = vec4(col*a, a);
}`;
