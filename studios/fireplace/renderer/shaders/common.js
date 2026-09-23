// Fireplace Studio — renderer/shaders/common.js. See README.md for ownership and replacement boundaries.


const GLSL_NOISE = `
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash12(i),hash12(i+vec2(1.0,0.0)),u.x), mix(hash12(i+vec2(0.0,1.0)),hash12(i+vec2(1.0,1.0)),u.x), u.y); }
float fbm(vec2 p){ float s=0.0,a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); a*=0.5; p*=2.03; } return s; }
`;
const SKY_U = `
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunI;
uniform vec3 uMoonDir; uniform vec3 uMoonCol; uniform float uMoonI;
uniform float uCloud; uniform float uHaze; uniform float uNight; uniform float uSeedF;`;
const SKY_FN = `
vec3 skyColor(vec3 d, float t){
  vec3 sd = -uSunDir;
  float sdY = clamp(sd.y, -1.0, 1.0);
  float dayF = 1.0 - uNight;
  vec3 zen = mix(vec3(0.16,0.30,0.52), vec3(0.008,0.015,0.045), uNight);
  vec3 mid = mix(vec3(0.42,0.55,0.70), vec3(0.020,0.035,0.080), uNight);
  vec3 hor = mix(vec3(0.75,0.72,0.68), vec3(0.050,0.070,0.120), uNight);
  float sunAz = max(dot(normalize(d.xz+vec2(1e-4)), normalize(sd.xz+vec2(1e-4))), 0.0);
  vec3 warm = vec3(1.0,0.45,0.18)*pow(sunAz,3.0)*dayF*clamp(1.0-abs(sdY)*4.0,0.0,1.0);
  vec3 col = mix(hor, mid, smoothstep(0.0,0.25,d.y));
  col = mix(col, zen, smoothstep(0.2,0.9,d.y));
  col += warm*0.9;
  float cosA = max(dot(d,sd),0.0);
  col += uSunCol*(pow(cosA,1500.0)*8.0+pow(cosA,24.0)*0.35)*uSunI*dayF;
  vec3 md = -uMoonDir;
  float cosM = max(dot(d,md),0.0);
  col += uMoonCol*(pow(cosM,2200.0)*6.0+pow(cosM,40.0)*0.12)*uMoonI;
  if(uNight>0.01 && d.y>0.02){
    vec2 sp = d.xz/(d.y+0.4)*38.0+uSeedF;
    vec2 cell=floor(sp); vec2 f=fract(sp)-0.5;
    float h=hash12(cell+uSeedF);
    float star=smoothstep(0.10,0.0,length(f))*step(0.992,h)*smoothstep(0.02,0.25,d.y);
    col += vec3(0.9,0.95,1.0)*star*(0.5+0.5*sin(t*2.0+h*40.0))*uNight;
  }
  vec2 cuv = d.xz/(abs(d.y)+0.18)*1.4+vec2(t*0.008,t*0.004)+uSeedF*0.13;
  float cl = fbm(cuv*1.6);
  float cmask = smoothstep(0.55-uCloud*0.35,0.75,cl)*smoothstep(-0.02,0.12,d.y);
  vec3 cloudCol = mix(vec3(0.85,0.87,0.90), vec3(0.04,0.05,0.09), uNight);
  cloudCol += vec3(1.0,0.55,0.30)*pow(max(dot(d,sd),0.0),6.0)*dayF*0.5;
  col = mix(col, cloudCol, cmask*0.85);
  col = mix(col, hor*1.02, (1.0-smoothstep(0.0,0.28,abs(d.y)))*uHaze*0.7);
  return col;
}`;

export { GLSL_NOISE, SKY_FN, SKY_U };
