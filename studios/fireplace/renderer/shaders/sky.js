// Fireplace Studio — renderer/shaders/sky.js. See README.md for ownership and replacement boundaries.
import { GLSL_NOISE, SKY_FN, SKY_U } from './common.js';

const SKY_VS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uView; uniform mat4 uProj;
out vec3 vDir;
void main(){
  vDir = normalize(aPos);
  vec4 p = uProj*uView*vec4(aPos,1.0);
  gl_Position = p.xyww;
}`;
const SKY_FS = `#version 300 es
precision highp float;
in vec3 vDir;
uniform float uTime;
${SKY_U}
${GLSL_NOISE}
${SKY_FN}
out vec4 oC;
void main(){ oC = vec4(skyColor(normalize(vDir), uTime), 1.0); }`;

export { SKY_FS, SKY_VS };
