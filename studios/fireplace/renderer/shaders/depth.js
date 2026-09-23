// Fireplace Studio — renderer/shaders/depth.js. See README.md for ownership and replacement boundaries.


const DEPTH_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv;
uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProj;
uniform sampler2D uHeight; uniform float uHScale; uniform float uIsMtn;
out vec3 vWP;
void main(){
  vec3 p=aPos;
  if(uIsMtn>0.5) p.y += texture(uHeight,aUv).r*uHScale;
  vec4 wp=uModel*vec4(p,1.0); vWP=wp.xyz; gl_Position=uProj*uView*wp;
}`;
const DEPTH_FS = `#version 300 es
precision highp float;
in vec3 vWP; uniform vec3 uCamPos;
out vec4 oC;
void main(){
  float d = clamp((length(vWP-uCamPos)-0.1)/899.9, 0.0, 1.0);
  oC = vec4(d,0.0,0.0,1.0);
}`;

export { DEPTH_FS, DEPTH_VS };
