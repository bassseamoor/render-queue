// Fireplace Studio — core/settings.js. See README.md for ownership and replacement boundaries.


const STONES = ["dark slate","fieldstone","limestone","basalt"];
const FLOORS = ["polished concrete","dark wood","oak","stone tile"];
const WOODS  = ["walnut","oak","charred black"];
const RUGS   = ["wool weave","jute","high-pile shag","flat kilim"];
const WEATHERS = ["clear","overcast","rain","snowfall","lake mist"];
const TIMES  = ["day","golden dusk","night"];
const CAMS   = ["reference","fireside","lakeside","daybed","deck","ember macro",
               "hearth low","firebox detail","cozy wide"];
const MOTIONS= ["still","drift","slow push"];
const FIRES  = ["low","medium","roaring"];
const WATERS = ["calm","rippled","choppy"];
const DECKS  = ["slatted lounger","bench","minimal"];
const GRAINS = ["Heavy","Off","Subtle","Medium","Max"]; /* 0=Heavy keeps legacy seeds identical */
const settings = {
  seed: 0, ver: 3,
  stone:0, floor:0, wood:0, rug:0, weather:0, time:0, water:0,
  camera:0, motion:1, fire:1, sparks:60, glow:0, deck:0, grain:0
};

export { CAMS, DECKS, FIRES, FLOORS, GRAINS, MOTIONS, RUGS, STONES, TIMES, WATERS, WEATHERS, WOODS, settings };
