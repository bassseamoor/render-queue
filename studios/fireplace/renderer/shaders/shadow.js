// Fireplace Studio — renderer/shaders/shadow.js. See README.md for ownership and replacement boundaries.


const SHADOW_VS = `#version 300 es
layout(location=0) in vec3 aPos;
uniform mat4 uModel; uniform mat4 uLightM;
void main(){ gl_Position = uLightM*uModel*vec4(aPos,1.0); }`;
const SHADOW_FS = `#version 300 es
precision highp float;
void main(){}`;

export { SHADOW_FS, SHADOW_VS };
