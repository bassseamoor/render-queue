// Fireplace Studio — renderer/shaders/post.js. See README.md for ownership and replacement boundaries.
import { GLSL_NOISE } from './common.js';

const POST_VS = `#version 300 es
layout(location=0) in vec2 aP;
out vec2 vUv;
void main(){ vUv=aP*0.5+0.5; gl_Position=vec4(aP,0.0,1.0); }`;
const POST_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex; uniform sampler2D uDepth;
uniform float uFrame; uniform vec2 uRes;
uniform float uExposure; uniform float uVig; uniform float uGrain;
uniform float uWarm; uniform float uNight; uniform float uAO;
out vec4 oC;
${GLSL_NOISE}
void main(){
  vec3 c = texture(uTex,vUv).rgb;
  float dC = texture(uDepth,vUv).r;
  float ao=0.0;
  vec2 px = 1.0/uRes;
  float rnd = hash12(vUv*913.0+fract(uFrame)*7.31)*6.2831;
  for(int i=0;i<8;i++){
    float a=float(i)/8.0*6.2831+rnd;
    vec2 o=vec2(cos(a),sin(a))*(2.0+float(i)*0.9)*px*2.0;
    float dS=texture(uDepth,vUv+o).r;
    ao += clamp((dC-dS)*36.0,0.0,1.0)*(1.0-float(i)/8.0);
  }
  ao = 1.0-clamp(ao/8.0,0.0,1.0)*uAO;
  c *= mix(1.0,ao,0.85);
  c *= uExposure;
  vec3 x=c;
  c = (x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14);
  c = mix(c,c*vec3(1.06,0.98,0.90),uWarm*0.5);
  c = mix(c,c*vec3(0.94,1.00,1.08),uNight*0.4);
  vec2 q=vUv-0.5;
  c *= 1.0-uVig*dot(q,q)*2.2;
  c += (hash12(vUv*uRes*0.5+fract(uFrame)*13.7)-0.5)*uGrain;
  c = pow(max(c,vec3(0.0)),vec3(1.0/2.2));
  oC = vec4(c,1.0);
}`;

export { POST_FS, POST_VS };
