// Fireplace Studio — core/state.js. See README.md for ownership and replacement boundaries.


const S = {
  draws: [], mtns: [], water: null, glass: null, parts: [],
  rig: null, cam: null, proj: null, simT: 0,
  texSeed: 1, camPhase: 0, flamePhase: [0,0,0],
  firePos: [-4.25,0.85,-0.9], fireCol: [1.0,0.42,0.12], flick: 1.0,
  shadowM: null, bakedKey: "",
};
const TEX = {};   /* name -> {alb,nrm,rgh} */
const MAT_TEX = ["stone","wood","bark","concrete","tile","fabric","rug","metal"];

export { MAT_TEX, S, TEX };
