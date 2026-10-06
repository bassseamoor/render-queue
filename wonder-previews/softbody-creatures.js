
window.TerrainCore = (function(){
const N=80, SIZE=256, COUNT=(N+1)**2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function generate(seed='silver-coast',preset='island',relief=38){
  let hash=2166136261;for(const c of seed)hash=Math.imul(hash^c.charCodeAt(0),16777619);
  const random=(x,z)=>{let h=Math.imul(x,374761393)^Math.imul(z,668265263)^hash;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;};
  const noise=(x,z)=>{const i=Math.floor(x),j=Math.floor(z);let u=x-i,v=z-j;u=u*u*(3-2*u);v=v*v*(3-2*v);return (random(i,j)*(1-u)+random(i+1,j)*u)*(1-v)+(random(i,j+1)*(1-u)+random(i+1,j+1)*u)*v;};
  const heights=new Float32Array(COUNT),biomes=new Uint8Array(COUNT);
  for(let z=0;z<=N;z++)for(let x=0;x<=N;x++){
    let f=0,amp=1,sum=0;for(let k=0;k<5;k++){f+=noise(x/N*3*2**k,z/N*3*2**k)*amp;sum+=amp;amp*=.5;}f/=sum;
    const radius=Math.hypot((x/N-.5)*2,(z/N-.5)*2);
    let h=(f-.38)*relief*2;
    if(preset==='island')h+=(.52-radius)*relief;
    if(preset==='mountains')h=Math.abs(f-.3)*relief*2.5-8;
    if(preset==='valley')h+=(Math.abs(x/N-.5)*2-.45)*relief;
    if(preset==='flat')h=6;
    heights[z*(N+1)+x]=clamp(h,-40,120);
  }
  return {format:'moor-world-terrain/1',name:'Silver Coast',seed,preset,relief,resolution:N,size:SIZE,water:0,heights,biomes};
}
function brush(data,x,z,{tool,radius,strength,target=6,biome=1}){
  const source=tool==='smooth'?data.heights.slice():data.heights;let changed=false;
  for(let j=Math.max(0,Math.floor((z-radius+SIZE/2)/SIZE*N));j<=Math.min(N,Math.ceil((z+radius+SIZE/2)/SIZE*N));j++)for(let i=Math.max(0,Math.floor((x-radius+SIZE/2)/SIZE*N));i<=Math.min(N,Math.ceil((x+radius+SIZE/2)/SIZE*N));i++){
    const dist=Math.hypot(i/N*SIZE-SIZE/2-x,j/N*SIZE-SIZE/2-z);if(dist>=radius)continue;
    const q=j*(N+1)+i,w=(1-dist/radius)**2,old=data.heights[q];let next=old;
    if(tool==='raise'||tool==='lower')next+=strength*w*(tool==='raise'?1:-1);
    if(tool==='flatten')next+=(target-old)*Math.min(1,strength*.12*w);
    if(tool==='smooth'){let sum=0,n=0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const a=i+dx,b=j+dz;if(a>=0&&a<=N&&b>=0&&b<=N){sum+=source[b*(N+1)+a];n++;}}next+=(sum/n-old)*Math.min(1,strength*.2*w);}
    if(tool==='paint'){changed ||= data.biomes[q]!==biome;data.biomes[q]=biome;}
    next=clamp(next,-40,120);changed ||= next!==old;data.heights[q]=next;
  }return changed;
}
const pack=d=>({...d,heights:Array.from(d.heights),biomes:Array.from(d.biomes)});
function unpack(d){
  if(!d||d.format!=='moor-world-terrain/1'||d.resolution!==N||d.size!==SIZE||!Array.isArray(d.heights)||d.heights.length!==COUNT||!d.heights.every(v=>Number.isFinite(v)&&v>=-40&&v<=120)||!Array.isArray(d.biomes)||d.biomes.length!==COUNT||!d.biomes.every(v=>Number.isInteger(v)&&v>=0&&v<=4)||!Number.isFinite(d.water)||d.water< -20||d.water>40||!['island','mountains','valley','flat'].includes(d.preset)||!Number.isFinite(d.relief)||d.relief<10||d.relief>70)throw Error('Choose a valid MOOR terrain JSON exported by this editor.');
  return {...d,name:String(d.name||'Untitled world').slice(0,80),seed:String(d.seed||'silver-coast').slice(0,80),heights:Float32Array.from(d.heights),biomes:Uint8Array.from(d.biomes)};
}

return {N:N,SIZE:SIZE,COUNT:COUNT,clamp:clamp,generate:generate,brush:brush,pack:pack,unpack:unpack};
})();


/* seed-rng — deterministic randomness primitives for MOOR.
 *
 * One seeded stream in, the same numbers out, on every device, every run.
 * Everything in MOOR that generates (terrain, names, audio, layouts) should
 * build on these instead of Math.random().
 *
 * PROVENANCE (each function verbatim from its source; originals untouched):
 *   mulberry32  <- render-queue/work/studios/parallax-engine.html:1656-1664
 *                  (planet-demo.html:318-319 carries an identical arrow-function
 *                  variant `mulberry32f` — same math, one implementation kept)
 *   hashSeed    <- parallax-engine.html:1650-1655  (FNV-1a, string -> uint32)
 *   hash2i      <- your_files/moor-planet-demo.html:320-321 (2-int -> [0,1))
 *   hashStr     <- your_files/universe-atlas.html:323 (djb2 variant, kept for
 *                  compatibility with the MoorWorld naming stream)
 *   makeNoise   <- your_files/universe-atlas.html:591-601 (seeded value-noise
 *                  grid; original called MoorWorld.mulberry32, which is the
 *                  same mulberry32 defined here)
 *
 * Zero dependencies. Works in browser <script> and node.
 */
'use strict';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* FNV-1a: any string -> uint32. Feed the result into mulberry32. */
function hashSeed(s) {
  var h = 2166136261 >>> 0;
  s = String(s);
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/* Two integer coordinates + integer salt -> deterministic [0,1). */
function hash2i(x, y, s) {
  var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0;
  h = (h ^ (h >>> 13)) | 0; h = Math.imul(h, 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* djb2 string hash (unsigned). Kept for the MoorWorld name stream. */
function hashStr(x) {
  var h = 0;
  x = String(x);
  for (var i = 0; i < x.length; i++) h = (h * 31 + x.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* Seeded 2D value-noise field: returns a closure (u,v) -> [0,1).
 * u wraps around the grid horizontally; v clamps. */
function makeNoise(seed, gw, gh) {
  var rnd = mulberry32(seed >>> 0), grid = new Float32Array(gw * gh), i;
  for (i = 0; i < gw * gh; i++) grid[i] = rnd();
  function sm(t) { return t * t * (3 - 2 * t); }
  return function (u, v) {
    var x = u * gw, y = Math.min(gh - 1.001, Math.max(0, v * gh));
    var x0 = Math.floor(x) % gw, x1 = (x0 + 1) % gw, y0 = Math.floor(y), y1 = Math.min(gh - 1, y0 + 1);
    var fx = sm(x - Math.floor(x)), fy = sm(y - y0);
    var a = grid[y0 * gw + x0], b = grid[y0 * gw + x1], c = grid[y1 * gw + x0], d = grid[y1 * gw + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

/* Convenience: one-liner seeded stream from a string seed. */
function streamFrom(seedStr) { return mulberry32(hashSeed(seedStr)); }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mulberry32: mulberry32, hashSeed: hashSeed, hash2i: hash2i, hashStr: hashStr, makeNoise: makeNoise, streamFrom: streamFrom };
}



window.SeedCodec = (function(){
/* seed-codec — compact, URL-safe seed codes with strict validation + remix.
 *
 * A code packs a whole generator configuration into one pasteable string:
 *
 *   PREFIX-realm-layout36-detail36-p1.p2. ... .pn[-Lmode.pos.width]
 *
 *   realm    architecture family (small int; remix keeps it)
 *   layout   uint32 architecture variant (base-36; remix keeps it)
 *   detail   uint32 detail stream seed (base-36; remix re-draws it)
 *   p1..pn   each hero param quantized to 0..1000 (base-36, dot-joined)
 *   -L...    optional lens suffix (mode.pos.width, base-36)
 *
 * PROVENANCE: generalized from render-queue/work/studios/parallax-engine.html
 *   codeOf      <- :73   (verbatim logic; prefix/controls/lens now injected)
 *   parseCode   <- :74   (strict validation preserved: wrong arity, out-of-range
 *                         values, or malformed lens all return null)
 *   remixConfig <- :1351-1361 ("more like this": keeps realm+layout, jitters
 *                         only unlocked params by +/-14% of range, fresh detail)
 *   randomConfig pattern <- :1331-1350 (fresh layout/detail/params)
 * Originals untouched. Zero dependencies (pairs with seed-rng for streams).
 *
 * A "controls table" describes the hero params:
 *   controls = [ [key, label, min, max], ... ]   // key: string id
 * A config object:
 *   { realm, layout, detail, params: {key: value}, lens, locks: {key: bool} }
 * lens may be null (pass opts.lens = null) or {mode, position, width}.
 */
'use strict';

function mix(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

function makeCodec(opts) {
  opts = opts || {};
  var prefix = opts.prefix || 'PX1';
  var controls = opts.controls || [];
  var lensLooks = opts.lensLooks || null; // array of lens mode names, or null

  function lensCode(c) {
    if (!lensLooks || !c.lens) return '';
    var li = lensLooks.indexOf(c.lens.mode);
    if (li < 0) li = 0;
    return '-L' + li.toString(36) + '.' +
      Math.round(c.lens.position * 1000).toString(36) + '.' +
      Math.round(c.lens.width * 1000).toString(36);
  }

  function codeOf(c) {
    return prefix + '-' + c.realm + '-' +
      (c.layout >>> 0).toString(36) + '-' + (c.detail >>> 0).toString(36) + '-' +
      controls.map(function (k) {
        return Math.round((c.params[k[0]] - k[2]) / (k[3] - k[2]) * 1000).toString(36);
      }).join('.') + lensCode(c);
  }

  var CODE_RE = null;
  function codeRe() {
    if (!CODE_RE) CODE_RE = new RegExp(
      '^' + prefix.replace(/[^a-z0-9]/gi, '') + '-(\\d+)-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9.]+)(?:-L([a-z0-9.]+))?$', 'i');
    return CODE_RE;
  }

  /* Strict: returns a config object or null. Never throws on bad input. */
  function parseCode(code) {
    var m = codeRe().exec(String(code).trim());
    if (!m) return null;
    var values = m[4].split('.');
    if (values.length !== controls.length) return null;
    var layout = parseInt(m[2], 36), detail = parseInt(m[3], 36);
    if (!(layout <= 4294967295) || !(detail <= 4294967295)) return null;
    var params = {}, i, v;
    for (i = 0; i < controls.length; i++) {
      v = parseInt(values[i], 36);
      if (!isFinite(v) || v < 0 || v > 1000) return null;
      params[controls[i][0]] = mix(controls[i][2], controls[i][3], v / 1000);
    }
    var lens = null;
    if (m[5]) {
      if (!lensLooks) return null;
      var lv = m[5].split('.').map(function (n) { return parseInt(n, 36); });
      if (lv.length !== 3 || lv.some(function (n) { return !isFinite(n); }) ||
          lv[0] < 0 || lv[0] >= lensLooks.length || lv[1] < 150 || lv[1] > 850 || lv[2] < 40 || lv[2] > 360) return null;
      lens = { mode: lensLooks[lv[0]], position: lv[1] / 1000, width: lv[2] / 1000 };
    }
    return { realm: +m[1], layout: layout, detail: detail, params: params, lens: lens, locks: {} };
  }

  /* "More like this": keep architecture (realm+layout), jitter unlocked
   * params by +/-14% of their range, draw a fresh detail stream.
   * rand: () -> [0,1). freshUint32: () -> uint32. */
  function remixConfig(base, rand, freshUint32) {
    var params = {}, i, c;
    for (i = 0; i < controls.length; i++) {
      c = controls[i];
      params[c[0]] = (base.locks && base.locks[c[0]])
        ? base.params[c[0]]
        : clamp(base.params[c[0]] + (rand() - 0.5) * (c[3] - c[2]) * 0.28, c[2], c[3]);
    }
    var locks = {};
    if (base.locks) for (var k in base.locks) locks[k] = base.locks[k];
    return { realm: base.realm, layout: base.layout, detail: freshUint32(),
             params: params, lens: base.lens, locks: locks };
  }

  /* Brand-new configuration: fresh layout/detail, params sampled mid-range. */
  function randomConfig(rand, freshUint32, defaults) {
    var params = {}, i, c;
    for (i = 0; i < controls.length; i++) {
      c = controls[i];
      params[c[0]] = (defaults && defaults[c[0]] !== undefined)
        ? defaults[c[0]] : mix(c[2], c[3], 0.25 + rand() * 0.5);
    }
    return { realm: 0, layout: freshUint32(), detail: freshUint32(),
             params: params, lens: null, locks: {} };
  }

  return { codeOf: codeOf, parseCode: parseCode, remixConfig: remixConfig,
           randomConfig: randomConfig, controls: controls, prefix: prefix };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { makeCodec: makeCodec, mix: mix, clamp: clamp };
}

return {makeCodec:makeCodec};
})();


/* MOOR Creature Lab — Stage A: end-to-end walker (handoff v1.0 §16).
 * Replaces the 2D viability sketch. This is the real architecture, first stage:
 *
 *   genome (seeded traits) -> anatomy definition (canonical JSON, hashed)
 *     -> validator + bounded repair (diagnostics) -> compiler
 *     -> render mesh + IK rig + collision proxies + soft-tissue region
 *     -> runtime: procedural gait, foot IK, fixture terrain queries
 *
 * Stages B–G (environment-conditioned species, scaling, swimming, flight,
 * breeding, ecosystems) are NOT implemented — the lab labels them planned.
 * Fixture adapters stand in for unfinished world systems, clearly labeled.
 *
 * Uses: seed-rng (named streams), moorworld (planet data), palettes (colors).
 * Renderer: raw WebGL, self-contained. */
(function(){
'use strict';

/* ================= deterministic streams (handoff §13) ================= */
function stream(name, seed){
  return streamFrom('creature:'+name+':'+seed);
}
function hashAnatomy(a){
  var s = JSON.stringify(a);
  var h1=0xdeadbeef, h2=0x41c6ce57;
  for (var i=0;i<s.length;i++){
    var ch=s.charCodeAt(i);
    h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677);
  }
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (h2>>>0).toString(16)+(h1>>>0).toString(16);
}

/* ================= species definition (fixture) ================= */
var GRAMMAR_VERSION = 1, SCHEMA_VERSION = 1;
var SPECIES = {
  id:'walker-terran', grammar:'bilateral-walker', grammarVersion:GRAMMAR_VERSION,
  legPairs:[2,3],            // 4 or 6 legs
  bodyLen:[2.4,3.6], bodyW:[0.85,1.25], bodyH:[0.95,1.35],
  legLen:[1.3,1.9],          // total leg length range
  headScale:[0.8,1.2], tailSegs:[0,4],
  massKg:[90,140]
};

/* ================= genome: resolved individual traits ================= */
function resolveGenome(speciesSeed, individualSeed){
  var g={ speciesId:SPECIES.id, speciesSeed:speciesSeed, individualSeed:individualSeed };
  var r;
  r=stream('body',speciesSeed+':'+individualSeed);
  var legPairs = SPECIES.legPairs[Math.floor(r()*SPECIES.legPairs.length)];
  g.legCount = legPairs*2;
  g.bodyLen = SPECIES.bodyLen[0]+r()*(SPECIES.bodyLen[1]-SPECIES.bodyLen[0]);
  g.bodyW   = SPECIES.bodyW[0]+r()*(SPECIES.bodyW[1]-SPECIES.bodyW[0]);
  g.bodyH   = SPECIES.bodyH[0]+r()*(SPECIES.bodyH[1]-SPECIES.bodyH[0]);
  g.legLen  = SPECIES.legLen[0]+r()*(SPECIES.legLen[1]-SPECIES.legLen[0]);
  g.upperFrac = 0.52+r()*0.1;                       // upper:lower split
  g.headScale = SPECIES.headScale[0]+r()*(SPECIES.headScale[1]-SPECIES.headScale[0]);
  g.tailSegs = Math.floor(r()*(SPECIES.tailSegs[1]+1));
  g.massKg = SPECIES.massKg[0]+r()*(SPECIES.massKg[1]-SPECIES.massKg[0]);
  r=stream('surface',speciesSeed+':'+individualSeed);
  g.hueShift = r(); g.marking = r(); g.markingAmt = r()*0.6;
  r=stream('gait',speciesSeed+':'+individualSeed);
  g.strideF = 0.9+r()*0.3; g.dutyF = 0.58+r()*0.08;
  return g;
}

/* ================= anatomy expander: genome -> canonical definition ================= */
function expandAnatomy(genome, planet){
  var ptype = planetTypeKey(planet);
  var M = (typeof MAT!=='undefined' && MAT[ptype]) || MAT.TERRAN;
  var nodes=[], rels=[];
  var nid=0;
  function node(role, parent, dims, extra){
    var n={ id:'n'+(nid++), semanticRole:role, parentId:parent,
      restPose:{p:[0,0,0], q:[0,0,0,1]}, dimensions:dims,
      material:(extra&&extra.material)||'skin', capabilities:(extra&&extra.caps)||[],
      symmetry:(extra&&extra.sym)||null };
    nodes.push(n); return n;
  }
  // torso root: 3 axial segments for organic taper
  var torso = node('torso', null, {len:genome.bodyLen, w:genome.bodyW, h:genome.bodyH},
    {material:'skin', caps:['core-support']});
  torso.restPose.p=[0, genome.legLen*0.92, 0];
  var segL=genome.bodyLen/3;
  var segs=[];
  for (var s=0;s<3;s++){
    var sg=node('axial-segment', torso.id,
      {len:segL, w:genome.bodyW*(1-0.18*Math.abs(s-1)), h:genome.bodyH*(1-0.15*Math.abs(s-1))},
      {material:'skin'});
    sg.restPose.p=[(s-1)*segL, 0, 0];
    segs.push(sg);
  }
  // legs
  var legs=[];
  var upperL=genome.legLen*genome.upperFrac, lowerL=genome.legLen*(1-genome.upperFrac);
  for (var i=0;i<genome.legCount;i++){
    var side = (i%2===0)?'L':'R';
    var pairIdx = Math.floor(i/2);
    var along = genome.legCount===4 ? (pairIdx===0?0.32:-0.32) : (pairIdx/(genome.legCount/2-1)-0.5)*0.7;
    var hip=node('locomotor-segment', torso.id,
      {upper:upperL, lower:lowerL, footR:0.14},
      {material:'skin', caps:['ground-contact'], sym:'leg-'+side});
    hip.restPose.p=[along*genome.bodyLen, -genome.bodyH*0.22, (side==='L'?1:-1)*genome.bodyW*0.32];
    hip.joint={ type:'ball', limits:{swing:0.9, lift:0.7}, poleOut:1 };
    var foot=node('contact-pad', hip.id, {r:0.14}, {material:'pad', caps:['ground-contact']});
    legs.push({hip:hip, foot:foot, side:side, along:along});
  }
  // head + sensors
  var head=node('feeding-structure', torso.id,
    {len:0.55*genome.headScale, w:0.5*genome.headScale, h:0.55*genome.headScale},
    {material:'skin', caps:['bite','visual-sensing']});
  head.restPose.p=[genome.bodyLen*0.5+0.25*genome.headScale, genome.bodyH*0.12, 0];
  var eyeL=node('sensor', head.id, {r:0.07}, {material:'eye', caps:['visual-sensing'], sym:'eye-L'});
  eyeL.restPose.p=[0.28*genome.headScale, 0.12, 0.18*genome.headScale];
  var eyeR=node('sensor', head.id, {r:0.07}, {material:'eye', caps:['visual-sensing'], sym:'eye-R'});
  eyeR.restPose.p=[0.28*genome.headScale, 0.12, -0.18*genome.headScale];
  // tail
  var tailNodes=[];
  var parent=torso.id, tx=-genome.bodyLen*0.5;
  for (var t=0;t<genome.tailSegs;t++){
    var tl=0.5*(1-t/(genome.tailSegs+0.5));
    var tn=node('tail-segment', parent, {len:tl, r:0.16*(1-t/genome.tailSegs)+0.03},
      {material:'skin', caps:t===genome.tailSegs-1?['tail-tip']:[]});
    tn.restPose.p = t===0 ? [tx, genome.bodyH*0.1, 0] : [-tl/2-0.02, 0, 0];
    if (t>0) tn.restPose.p=[-0.5*(1-(t-1)/(genome.tailSegs+0.5))-0.02, 0, 0];
    tailNodes.push(tn); parent=tn.id;
  }
  var skin = (M.leaf&&M.leaf[0])||'#4a6a3a';
  var skinB = (M.leaf&&M.leaf[1])||'#6a8a4a';
  var bellyC = (M.grass&&M.grass[0])||'#7a8a4a';
  var A={
    schema:'creature-anatomy/1', schemaVersion:SCHEMA_VERSION,
    grammarVersion:GRAMMAR_VERSION, speciesId:genome.speciesId,
    individualSeed:genome.individualSeed, genome:genome,
    nodes:nodes, softRegions:[{ id:'belly', nodeId:torso.id,
      policy:'deformable', anchors:'torso-bottom-edge',
      solver:{type:'verlet-cloth', iterations:3, damping:0.96} }],
    materials:{ skin:skin, skinB:skinB, belly:bellyC,
      pad:'#2a2018', eye:'#101418' },
    planet:{ id:planet.id, name:planet.name, type:ptype }
  };
  A.hash=hashAnatomy({nodes:nodes, genome:genome, materials:A.materials});
  return A;
}
function planetTypeKey(planet){
  var n=(((window.MoorWorld||{}).planetType||function(){return{name:''};})(planet).name||'').toUpperCase();
  var m={'TERRAN WORLD':'TERRAN','OCEAN WORLD':'OCEAN','DESERT WORLD':'DESERT','ICE WORLD':'ICE',
    'LAVA WORLD':'LAVA','JUNGLE WORLD':'JUNGLE','BARREN ROCK':'BARREN','GAS GIANT':'GAS',
    'CRYSTAL WORLD':'CRYSTAL','TOXIC WORLD':'TOXIC'};
  return m[n]||'TERRAN';
}

/* ================= validator + bounded repair (handoff §8) ================= */
var MAX_REPAIR=8;
function validate(a){
  var diags=[];
  function bad(id, check, measured, why, sev){ diags.push({id:id, check:check, measured:measured, why:why, severity:sev||'error'}); }
  var byId={}; a.nodes.forEach(function(n){ byId[n.id]=n; });
  a.nodes.forEach(function(n){
    if (byId[n.id]!==n) bad(n.id,'unique-id',n.id,'duplicate node id');
    if (n.parentId && !byId[n.parentId]) bad(n.id,'valid-parent',n.parentId,'parent missing');
    for (var k in (n.dimensions||{})){ var v=n.dimensions[k];
      if (!isFinite(v)||v<=0) bad(n.id,'positive-dims',k+'='+v,'dimension must be finite positive'); }
  });
  // movement feasibility: leg reach vs body clearance
  var torso=a.nodes[0], g=a.genome;
  var clearance=torso.restPose.p[1];
  var reach=g.legLen;
  if (reach < clearance*1.05)
    bad('legs','support-capacity',reach.toFixed(2)+' < '+clearance.toFixed(2),'legs cannot reach ground under body');
  if (g.legLen > clearance*1.9)
    bad('legs','gait-compatibility',g.legLen.toFixed(2)+' > '+(clearance*1.9).toFixed(2),'legs far longer than clearance — unstable','warn');
  return diags;
}
function repair(a){
  var log=[], pass=0;
  while (pass<MAX_REPAIR){
    var diags=validate(a).filter(function(d){return d.severity==='error';});
    if (!diags.length) break;
    var d=diags[0], g=a.genome;
    if (d.check==='support-capacity'){
      var need=a.nodes[0].restPose.p[1]*1.15;
      log.push('lengthened legs '+g.legLen.toFixed(2)+' → '+need.toFixed(2));
      g.legLen=need;
      // re-expand leg dimensions
      a.nodes.forEach(function(n){
        if (n.semanticRole==='locomotor-segment'){
          n.dimensions.upper=need*g.upperFrac; n.dimensions.lower=need*(1-g.upperFrac);
        }
      });
    } else { log.push('no repair rule for '+d.check+' — aborting'); break; }
    pass++;
  }
  a.hash=hashAnatomy({nodes:a.nodes, genome:a.genome, materials:a.materials});
  return {passes:pass, log:log, diags:validate(a)};
}

/* ================= fixture terrain (labeled fixture, handoff §4) ================= */
function makeTerrain(seed, preset){
  var r=stream('terrain', seed+':'+preset);
  var oct=[];
  for (var i=0;i<4;i++) oct.push({f:0.02*(1<<i), a:3.2/(1<<i), px:r()*100, pz:r()*100});
  var rough = preset==='rocky'?1.6 : preset==='cold'?1.2 : 1.0;
  function h(x,z){
    var s=0;
    for (var i=0;i<oct.length;i++){ var o=oct[i];
      s+=o.a*Math.sin((x+o.px)*o.f)*Math.cos((z+o.pz)*o.f*1.3); }
    return s*rough;
  }
  return {
    preset:preset, seed:seed, fixture:true,
    sampleSurface:function(x,z){ // WorldQuery.sampleSurface fixture
      var e=0.6, y=h(x,z);
      var nx=(h(x-e,z)-h(x+e,z))/(2*e), nz=(h(x,z-e)-h(x,z+e))/(2*e);
      var inv=1/Math.hypot(nx,1,nz);
      return {hit:true, position:[x,y,z], normal:[nx*inv,inv,nz*inv], materialId:'ground'};
    },
    height:h
  };
}

/* ================= geometry helpers (panel renderer) ================= */
function Geo(){ this.pos=[]; this.nrm=[]; this.col=[]; this.idx=[]; }
Geo.prototype.v=function(x,y,z,nx,ny,nz,r,g,b){
  this.pos.push(x,y,z); this.nrm.push(nx,ny,nz); this.col.push(r,g,b);
  return this.pos.length/3-1;
};
function box(geo, w,h,d, x,y,z, c){
  var x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
  var F=[[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]],
         [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1]],
         [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0]],
         [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0]],
         [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0]],
         [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0]]];
  F.forEach(function(f){
    var b=geo.pos.length/3;
    for (var i=0;i<4;i++) geo.v(f[i][0],f[i][1],f[i][2],f[4][0],f[4][1],f[4][2],c[0],c[1],c[2]);
    geo.idx.push(b,b+1,b+2,b,b+2,b+3);
  });
}
function cyl(geo, r0,r1,len,seg, x,y,z, c, axis){
  // axis 'y': along Y centered at x,y,z
  var ring0=[], ring1=[];
  for (var i=0;i<seg;i++){
    var a=i/seg*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a);
    var nx=ca, nz=sa;
    if (axis==='y'){
      ring0.push(geo.v(x+ca*r0,y-len/2,z+sa*r0,nx,0,nz,c[0],c[1],c[2]));
      ring1.push(geo.v(x+ca*r1,y+len/2,z+sa*r1,nx,0,nz,c[0],c[1],c[2]));
    } else { // along X
      ring0.push(geo.v(x-len/2,y+ca*r0,z+sa*r0,0,nx,nz,c[0],c[1],c[2]));
      ring1.push(geo.v(x+len/2,y+ca*r1,z+sa*r1,0,nx,nz,c[0],c[1],c[2]));
    }
  }
  for (var j=0;j<seg;j++){
    var a2=ring0[j], b2=ring0[(j+1)%seg], c2=ring1[j], d2=ring1[(j+1)%seg];
    geo.idx.push(a2,c2,b2, b2,c2,d2);
  }
}
function ball(geo, r, x,y,z, c, ws, hs){
  ws=ws||10; hs=hs||8;
  var rows=[];
  for (var j=0;j<=hs;j++){
    var v=j/hs*Math.PI, row=[];
    for (var i=0;i<ws;i++){
      var u=i/ws*Math.PI*2;
      var px=Math.sin(v)*Math.cos(u), py=Math.cos(v), pz=Math.sin(v)*Math.sin(u);
      row.push(geo.v(x+px*r,y+py*r,z+pz*r,px,py,pz,c[0],c[1],c[2]));
    }
    rows.push(row);
  }
  for (var y2=0;y2<hs;y2++) for (var x2=0;x2<ws;x2++){
    var a=rows[y2][x2], b=rows[y2][(x2+1)%ws], c2=rows[y2+1][x2], d=rows[y2+1][(x2+1)%ws];
    geo.idx.push(a,c2,b, b,c2,d);
  }
}
function hx(c){ return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255]; }

/* ================= compiler: anatomy -> runtime assets ================= */
/* ================= UNIFIED SKIN =================
 * One continuous mesh over the whole animal. The body plan is a signed
 * distance field (SDF): smooth-unioned spheres/cones for torso, neck, head,
 * muzzle, muscle masses, legs, paws, tail. Surface nets polygonizes it into
 * a SINGLE watertight skin — no bolted parts. Legs/tail bend the skin via
 * procedural skinning; every vertex is a spring toward its skinned target,
 * so the whole body is soft tissue. */
function smin(a,b,k){
  var h=0.5+0.5*(b-a)/k; h=h<0?0:(h>1?1:h);
  return b+(a-b)*h-k*h*(1-h);
}
function sdSph(px,py,pz,cx,cy,cz,r){
  var dx=px-cx,dy=py-cy,dz=pz-cz;
  return Math.sqrt(dx*dx+dy*dy+dz*dz)-r;
}
function sdCone(px,py,pz,ax,ay,az,bx,by,bz,r1,r2){
  var bax=bx-ax,bay=by-ay,baz=bz-az;
  var pax=px-ax,pay=py-ay,paz=pz-az;
  var bb=bax*bax+bay*bay+baz*baz;
  var h=(pax*bax+pay*bay+paz*baz)/(bb>1e-9?bb:1e-9);
  h=h<0?0:(h>1?1:h);
  var r=r1+(r2-r1)*h;
  var dx=pax-bax*h,dy=pay-bay*h,dz=paz-baz*h;
  return Math.sqrt(dx*dx+dy*dy+dz*dz)-r;
}
function subdividePts(pts,n){
  var lens=[0];
  for (var i=1;i<pts.length;i++){
    var dx=pts[i][0]-pts[i-1][0],dy=pts[i][1]-pts[i-1][1],dz=pts[i][2]-pts[i-1][2];
    lens.push(lens[i-1]+Math.sqrt(dx*dx+dy*dy+dz*dz));
  }
  var total=lens[lens.length-1]||1e-9, out=[], seg=0;
  for (var s=0;s<=n;s++){
    var d=total*s/n;
    while (seg<lens.length-2&&lens[seg+1]<d) seg++;
    var f=(d-lens[seg])/((lens[seg+1]-lens[seg])||1e-9);
    out.push([pts[seg][0]+(pts[seg+1][0]-pts[seg][0])*f,
              pts[seg][1]+(pts[seg+1][1]-pts[seg][1])*f,
              pts[seg][2]+(pts[seg+1][2]-pts[seg][2])*f]);
  }
  return out;
}
/* rotate vector v by the minimal rotation taking unit a -> unit b */
function rotVec(ax,ay,az,bx,by,bz,vx,vy,vz){
  var cx=ay*bz-az*by, cy=az*bx-ax*bz, cz=ax*by-ay*bx;
  var dot=ax*bx+ay*by+az*bz;
  var cxx=cy*vz-cz*vy, cyy=cz*vx-cx*vz, czz=cx*vy-cy*vx;
  var cdotv=cx*vx+cy*vy+cz*vz;
  var f=(1+dot)>1e-6 ? cdotv/(1+dot) : 0;
  return [vx*dot+cxx+cx*f, vy*dot+cyy+cy*f, vz*dot+czz+cz*f];
}

function buildUnifiedSkin(g, M, skin, skinB, bellyC, padC){
  var L=g.bodyLen, W=g.bodyW, H=g.bodyH;
  var upperL=g.legLen*g.upperFrac, lowerL=g.legLen*(1-g.upperFrac);
  var K=0.085, KK=0.06;
  /* skeleton (rest pose, local: +X forward, Y up). Hip roots match the
   * anatomy legDefs so the walk IK drives the skin exactly. */
  var spine=[
    [-L*0.50,H*0.10,W*0.30],[-L*0.36,H*0.12,W*0.42],[-L*0.18,H*0.10,W*0.50],
    [L*0.02,H*0.12,W*0.52],[L*0.22,H*0.16,W*0.48],[L*0.36,H*0.24,W*0.40],
    [L*0.46,H*0.32,W*0.32]
  ];
  var neckA=[L*0.46,H*0.32,0], neckB=[L*0.60,H*0.52,0];
  var headC=[L*0.68,H*0.58,0], headR=W*0.26;
  var muzzleC=[L*0.82,H*0.53,0], muzzleR=W*0.145;
  var legs=[];
  for (var li=0;li<4;li++){
    var along=(li<2?0.32:-0.32), sz=(li%2===0?1:-1);
    var hx=along*L, hz=sz*W*0.32, hy=-H*0.22;
    var hip=[hx,hy,hz];
    var knee=[hx+upperL*0.22,hy-upperL*0.94,hz*1.02];
    var ankle=[hx-upperL*0.02,knee[1]-lowerL*0.62,hz*1.02];
    var foot=[hx+0.12,-g.legLen,hz*1.02];
    legs.push([hip,knee,ankle,foot]);
  }
  var tailPts=[];
  var nTail=Math.max(3,Math.min(6,g.tailSegs+2));
  var tailLen=0.5+g.tailSegs*0.16;
  for (var ti=0;ti<=nTail;ti++){
    var f=ti/nTail;
    tailPts.push([-L*0.50-tailLen*f, H*0.10+Math.sin(f*2.0)*0.07-f*0.06, 0]);
  }
  var tailR0=0.13;
  /* SDF: smooth union of everything = the flesh */
  function sdf(x,y,z){
    var d=1e9, i, s;
    for (i=0;i<spine.length;i++){ s=spine[i]; d=smin(d,sdSph(x,y,z,s[0],s[1],0,s[2]),K); }
    d=smin(d,sdCone(x,y,z,neckA[0],neckA[1],neckA[2],neckB[0],neckB[1],neckB[2],0.20,0.15),K);
    d=smin(d,sdSph(x,y,z,headC[0],headC[1],headC[2],headR),K);
    d=smin(d,sdSph(x,y,z,muzzleC[0],muzzleC[1],muzzleC[2],muzzleR),K);
    for (i=0;i<4;i++){
      var lg=legs[i], mr=i<2?W*0.20:W*0.27;
      d=smin(d,sdSph(x,y,z,lg[0][0],lg[0][1]+0.06,lg[0][2],mr),K);
      d=smin(d,sdCone(x,y,z,lg[0][0],lg[0][1],lg[0][2],lg[1][0],lg[1][1],lg[1][2],0.15,0.095),KK);
      d=smin(d,sdCone(x,y,z,lg[1][0],lg[1][1],lg[1][2],lg[2][0],lg[2][1],lg[2][2],0.095,0.065),KK);
      d=smin(d,sdCone(x,y,z,lg[2][0],lg[2][1],lg[2][2],lg[3][0],lg[3][1],lg[3][2],0.065,0.085),KK);
      d=smin(d,sdSph(x,y,z,lg[3][0],lg[3][1],lg[3][2],0.095),KK);
    }
    for (i=0;i<tailPts.length-1;i++){
      var a=tailPts[i], b=tailPts[i+1];
      var r0=tailR0*(1-i/tailPts.length)+0.015, r1=tailR0*(1-(i+1)/tailPts.length)+0.015;
      d=smin(d,sdCone(x,y,z,a[0],a[1],a[2],b[0],b[1],b[2],r0,r1),KK);
    }
    return d;
  }
  /* surface nets */
  var minX=-L*0.85, maxX=L*1.05;
  var minY=-g.legLen*1.25, maxY=H*1.0;
  var minZ=-W*0.85, maxZ=W*0.85;
  var nx=76;
  var ny=Math.max(24,Math.round(nx*(maxY-minY)/(maxX-minX)));
  var nz=Math.max(24,Math.round(nx*(maxZ-minZ)/(maxX-minX)));
  var sx=nx+1, sy=ny+1, sz=nz+1;
  var field=new Float32Array(sx*sy*sz);
  function idx3(i,j,k){ return (k*sy+j)*sx+i; }
  for (var k=0;k<sz;k++){
    var z=minZ+(maxZ-minZ)*k/nz;
    for (var j=0;j<sy;j++){
      var y=minY+(maxY-minY)*j/ny, row=(k*sy+j)*sx;
      for (var i=0;i<sx;i++) field[row+i]=sdf(minX+(maxX-minX)*i/nx, y, z);
    }
  }
  var cellVert=new Int32Array(nx*ny*nz).fill(-1);
  var vpos=[];
  function cidx(ci,cj,ck){ return (ck*ny+cj)*nx+ci; }
  var EDGES=[
    [[0,0,0],[1,0,0]],[[0,1,0],[1,1,0]],[[0,0,1],[1,0,1]],[[0,1,1],[1,1,1]],
    [[0,0,0],[0,1,0]],[[1,0,0],[1,1,0]],[[0,0,1],[0,1,1]],[[1,0,1],[1,1,1]],
    [[0,0,0],[0,0,1]],[[1,0,0],[1,0,1]],[[0,1,0],[0,1,1]],[[1,1,0],[1,1,1]]
  ];
  for (var ck=0;ck<nz;ck++) for (var cj=0;cj<ny;cj++) for (var ci=0;ci<nx;ci++){
    var sign=field[idx3(ci,cj,ck)]<0?1:0, mixed=false;
    for (var cn=1;cn<8&&!mixed;cn++){
      var ox=(cn&1), oy=(cn&2)?1:0, oz=(cn&4)?1:0;
      if ((field[idx3(ci+ox,cj+oy,ck+oz)]<0?1:0)!==sign) mixed=true;
    }
    if (!mixed) continue;
    var ax=0,ay=0,az=0,cnt=0;
    for (var e=0;e<12;e++){
      var A=EDGES[e][0], B=EDGES[e][1];
      var va=field[idx3(ci+A[0],cj+A[1],ck+A[2])];
      var vb=field[idx3(ci+B[0],cj+B[1],ck+B[2])];
      if ((va<0)===(vb<0)) continue;
      var t=va/(va-vb);
      ax+=ci+A[0]+(B[0]-A[0])*t; ay+=cj+A[1]+(B[1]-A[1])*t; az+=ck+A[2]+(B[2]-A[2])*t;
      cnt++;
    }
    if (!cnt) continue;
    vpos.push(minX+(maxX-minX)*(ax/cnt)/nx, minY+(maxY-minY)*(ay/cnt)/ny, minZ+(maxZ-minZ)*(az/cnt)/nz);
    cellVert[cidx(ci,cj,ck)]=vpos.length/3-1;
  }
  var indices=[];
  function quad(v0,v1,v2,v3){
    if (v0<0||v1<0||v2<0||v3<0) return;
    indices.push(v0,v1,v2, v0,v2,v3);
  }
  var i2,j2,k2,i3,j3,k3,i4,j4,k4;
  for (k2=1;k2<nz;k2++) for (j2=1;j2<ny;j2++) for (i2=0;i2<nx;i2++){
    if ((field[idx3(i2,j2,k2)]<0)===(field[idx3(i2+1,j2,k2)]<0)) continue;
    quad(cellVert[cidx(i2,j2-1,k2-1)],cellVert[cidx(i2,j2,k2-1)],
         cellVert[cidx(i2,j2,k2)],cellVert[cidx(i2,j2-1,k2)]);
  }
  for (k3=1;k3<nz;k3++) for (j3=0;j3<ny;j3++) for (i3=1;i3<nx;i3++){
    if ((field[idx3(i3,j3,k3)]<0)===(field[idx3(i3,j3+1,k3)]<0)) continue;
    quad(cellVert[cidx(i3-1,j3,k3-1)],cellVert[cidx(i3,j3,k3-1)],
         cellVert[cidx(i3,j3,k3)],cellVert[cidx(i3-1,j3,k3)]);
  }
  for (k4=0;k4<nz;k4++) for (j4=1;j4<ny;j4++) for (i4=1;i4<nx;i4++){
    if ((field[idx3(i4,j4,k4)]<0)===(field[idx3(i4,j4,k4+1)]<0)) continue;
    quad(cellVert[cidx(i4-1,j4-1,k4)],cellVert[cidx(i4,j4-1,k4)],
         cellVert[cidx(i4,j4,k4)],cellVert[cidx(i4-1,j4,k4)]);
  }
  function grad(x,y,z){
    var e=0.012;
    return [sdf(x+e,y,z)-sdf(x-e,y,z), sdf(x,y+e,z)-sdf(x,y-e,z), sdf(x,y,z+e)-sdf(x,y,z-e)];
  }
  /* fix winding so faces point outward */
  for (var t3=0;t3<indices.length;t3+=3){
    var ia=indices[t3]*3, ib=indices[t3+1]*3, ic=indices[t3+2]*3;
    var ax3=vpos[ia],ay3=vpos[ia+1],az3=vpos[ia+2];
    var bx3=vpos[ib],by3=vpos[ib+1],bz3=vpos[ib+2];
    var cx3=vpos[ic],cy3=vpos[ic+1],cz3=vpos[ic+2];
    var ux=bx3-ax3,uy=by3-ay3,uz=bz3-az3, vx=cx3-ax3,vy=cy3-ay3,vz=cz3-az3;
    var fnx=uy*vz-uz*vy, fny=uz*vx-ux*vz, fnz=ux*vy-uy*vx;
    var gg=grad((ax3+bx3+cx3)/3,(ay3+by3+cy3)/3,(az3+bz3+cz3)/3);
    if (fnx*gg[0]+fny*gg[1]+fnz*gg[2]<0){
      var tmp=indices[t3+1]; indices[t3+1]=indices[t3+2]; indices[t3+2]=tmp;
    }
  }
  var nv=vpos.length/3;
  var rest=new Float32Array(vpos);
  var nrm=new Float32Array(vpos.length);
  for (var vi=0;vi<vpos.length;vi+=3){
    var g2=grad(vpos[vi],vpos[vi+1],vpos[vi+2]);
    var l=Math.hypot(g2[0],g2[1],g2[2])||1;
    nrm[vi]=g2[0]/l; nrm[vi+1]=g2[1]/l; nrm[vi+2]=g2[2]/l;
  }
  /* skinning: assign each vertex to a body part + bone params */
  var SUB=12, SUBT=8;
  var legRestSub=legs.map(function(lg){ return subdividePts(lg,SUB); });
  var tailRestSub=subdividePts(tailPts,SUBT);
  var legRestDir=legRestSub.map(function(sp){
    var dd=[];
    for (var s=0;s<SUB;s++){
      var dx=sp[s+1][0]-sp[s][0], dy=sp[s+1][1]-sp[s][1], dz=sp[s+1][2]-sp[s][2];
      var ll=Math.hypot(dx,dy,dz)||1e-9;
      dd.push([dx/ll,dy/ll,dz/ll]);
    }
    return dd;
  });
  var tailRestDir=[];
  for (var s2=0;s2<SUBT;s2++){
    var dx2=tailRestSub[s2+1][0]-tailRestSub[s2][0],
        dy2=tailRestSub[s2+1][1]-tailRestSub[s2][1],
        dz2=tailRestSub[s2+1][2]-tailRestSub[s2][2];
    var ll2=Math.hypot(dx2,dy2,dz2)||1e-9;
    tailRestDir.push([dx2/ll2,dy2/ll2,dz2/ll2]);
  }
  function nearestOn(sp,x,y,z){
    var best=null;
    for (var s=0;s<sp.length-1;s++){
      var ax=sp[s][0],ay=sp[s][1],az=sp[s][2];
      var bx=sp[s+1][0],by=sp[s+1][1],bz=sp[s+1][2];
      var abx=bx-ax,aby=by-ay,abz=bz-az;
      var t=((x-ax)*abx+(y-ay)*aby+(z-az)*abz)/((abx*abx+aby*aby+abz*abz)||1e-9);
      t=t<0?0:(t>1?1:t);
      var cx=ax+abx*t, cy=ay+aby*t, cz=az+abz*t;
      var dx=x-cx, dy=y-cy, dz=z-cz, d2=dx*dx+dy*dy+dz*dz;
      if (!best||d2<best.d2) best={sub:s,t:t,cx:cx,cy:cy,cz:cz,d2:d2};
    }
    return best;
  }
  var skind=new Array(nv);
  for (var q=0;q<nv;q++){
    var o=q*3, x=vpos[o], y=vpos[o+1], z=vpos[o+2];
    var dB=1e9, head=false, si;
    for (si=0;si<spine.length;si++){ var sp2=spine[si]; var dd=sdSph(x,y,z,sp2[0],sp2[1],0,sp2[2]); if (dd<dB) dB=dd; }
    var dn=sdCone(x,y,z,neckA[0],neckA[1],neckA[2],neckB[0],neckB[1],neckB[2],0.20,0.15);
    if (dn<dB){ dB=dn; head=true; }
    var dh=sdSph(x,y,z,headC[0],headC[1],headC[2],headR);
    if (dh<dB){ dB=dh; head=true; }
    var dm=sdSph(x,y,z,muzzleC[0],muzzleC[1],muzzleC[2],muzzleR);
    if (dm<dB){ dB=dm; head=true; }
    var bestLeg=-1, bestLI=null, dL2=1e9;
    for (var ql=0;ql<4;ql++){
      var inf=nearestOn(legRestSub[ql],x,y,z);
      if (inf.d2<dL2){ dL2=inf.d2; bestLeg=ql; bestLI=inf; }
    }
    var tInf=nearestOn(tailRestSub,x,y,z);
    var dLs=Math.sqrt(dL2), dT=Math.sqrt(tInf.d2);
    if (dLs<dB && dLs<dT){
      skind[q]={part:2+bestLeg,sub:bestLI.sub,t:bestLI.t,rx:x-bestLI.cx,ry:y-bestLI.cy,rz:z-bestLI.cz};
    } else if (dT<dB){
      skind[q]={part:6,sub:tInf.sub,t:tInf.t,rx:x-tInf.cx,ry:y-tInf.cy,rz:z-tInf.cz};
    } else {
      skind[q]={part:head?1:0};
    }
  }
  /* colors: countershading + markings + dark paws/muzzle */
  var col=new Float32Array(vpos.length);
  var dark=[skin[0]*0.60,skin[1]*0.60,skin[2]*0.60];
  for (var q2=0;q2<nv;q2++){
    var o2=q2*3, x2=vpos[o2], y2=vpos[o2+1], z2=vpos[o2+2], p2=skind[q2].part;
    var hf=(y2+H*0.35)/(H*1.05); hf=hf<0?0:(hf>1?1:hf);
    var c;
    if (hf<0.5){
      var f2=hf/0.5;
      c=[bellyC[0]+(skin[0]-bellyC[0])*f2,bellyC[1]+(skin[1]-bellyC[1])*f2,bellyC[2]+(skin[2]-bellyC[2])*f2];
    } else {
      var f3=(hf-0.5)/0.5;
      c=[skin[0]+(dark[0]-skin[0])*f3,skin[1]+(dark[1]-skin[1])*f3,skin[2]+(dark[2]-skin[2])*f3];
    }
    if (g.markingAmt>0.05&&hf>0.55){
      var mk=g.marking<0.5 ? (Math.sin(x2*9+g.marking*20)>0.55?1:0)
                           : (Math.sin(x2*22+z2*18+g.marking*30)>0.72?1:0);
      if (mk){
        var amt=g.markingAmt*0.55;
        c=[c[0]*(1-amt)+dark[0]*amt,c[1]*(1-amt)+dark[1]*amt,c[2]*(1-amt)+dark[2]*amt];
      }
    }
    if (p2>=2&&p2<=5){
      c=[c[0]*0.90,c[1]*0.90,c[2]*0.90];
      if (y2<-g.legLen*0.72){ c=[padC[0]*0.9+0.05,padC[1]*0.9+0.05,padC[2]*0.9+0.05]; }
    }
    if (p2===6&&skind[q2].t>0.75){ c=[c[0]*0.85,c[1]*0.85,c[2]*0.85]; }
    col[o2]=c[0]; col[o2+1]=c[1]; col[o2+2]=c[2];
  }
  /* eyes + nose sit ON the skin (separate small meshes, follow the head) */
  function eyePos(sideSign){
    var dx=0.549, dy=0.279, dz=0.788*sideSign;
    var rr=headR*0.94;
    return [headC[0]+dx*rr, headC[1]+dy*rr, headC[2]+dz*rr];
  }
  return {
    rest:rest, nrm:nrm, col:col, idx:new Uint32Array(indices), nv:nv,
    skin:skind, legs:legs, legRestSub:legRestSub, legRestDir:legRestDir,
    tailRestSub:tailRestSub, tailRestDir:tailRestDir, SUB:SUB, SUBT:SUBT,
    headC:headC, headR:headR,
    eyeL:eyePos(1), eyeR:eyePos(-1),
    nose:[muzzleC[0]+muzzleR*0.92, muzzleC[1]+0.01, 0],
    simPos:new Float32Array(rest), simVel:new Float32Array(rest.length),
    simNrm:new Float32Array(nrm)
  };
}

/* per-frame: bend the skin by the animated skeleton, then relax every
 * vertex toward its target with a spring. Whole-body soft tissue. */
function deformSkin(sm, legAnim, tailAnim, softness, dt, accX, accZ){
  var SUB=sm.SUB, SUBT=sm.SUBT, li, s;
  var legSub=[], legDir=[];
  for (li=0;li<4;li++){
    var sp=subdividePts(legAnim[li],SUB);
    legSub.push(sp);
    var dd=[];
    for (s=0;s<SUB;s++){
      var ax=sp[s][0],ay=sp[s][1],az=sp[s][2];
      var bx=sp[s+1][0],by=sp[s+1][1],bz=sp[s+1][2];
      var l=Math.hypot(bx-ax,by-ay,bz-az)||1e-9;
      dd.push([(bx-ax)/l,(by-ay)/l,(bz-az)/l]);
    }
    legDir.push(dd);
  }
  var tsp=subdividePts(tailAnim,SUBT), tdd=[];
  for (s=0;s<SUBT;s++){
    var ax2=tsp[s][0],ay2=tsp[s][1],az2=tsp[s][2];
    var bx2=tsp[s+1][0],by2=tsp[s+1][1],bz2=tsp[s+1][2];
    var l2=Math.hypot(bx2-ax2,by2-ay2,bz2-az2)||1e-9;
    tdd.push([(bx2-ax2)/l2,(by2-ay2)/l2,(bz2-az2)/l2]);
  }
  var stiff=Math.max(22, 95-softness*42);
  var damp=Math.max(3.2, 8.5-softness*3);
  var rest=sm.rest, simP=sm.simPos, simV=sm.simVel, simN=sm.simNrm, restN=sm.nrm;
  var sk=sm.skin;
  var kdt=stiff*dt, dampF=Math.max(0,1-damp*dt);
  for (var vi=0;vi<sm.nv;vi++){
    var o=vi*3, sd=sk[vi], tx,ty,tz;
    if (sd.part>=2&&sd.part<=5){
      var L2=sd.part-2, sp2=legSub[L2], dd2=legDir[L2], sdi=sd.sub;
      var p0=sp2[sdi], p1=sp2[sdi+1];
      var bx3=p0[0]+(p1[0]-p0[0])*sd.t, by3=p0[1]+(p1[1]-p0[1])*sd.t, bz3=p0[2]+(p1[2]-p0[2])*sd.t;
      var rd=sm.legRestDir[L2][sdi], ad=dd2[sdi];
      var rr=rotVec(rd[0],rd[1],rd[2],ad[0],ad[1],ad[2],sd.rx,sd.ry,sd.rz);
      var rn=rotVec(rd[0],rd[1],rd[2],ad[0],ad[1],ad[2],restN[o],restN[o+1],restN[o+2]);
      tx=bx3+rr[0]; ty=by3+rr[1]; tz=bz3+rr[2];
      simN[o]=rn[0]; simN[o+1]=rn[1]; simN[o+2]=rn[2];
    } else if (sd.part===6){
      var sdi2=sd.sub;
      var q0=tsp[sdi2], q1=tsp[sdi2+1];
      var cx4=q0[0]+(q1[0]-q0[0])*sd.t, cy4=q0[1]+(q1[1]-q0[1])*sd.t, cz4=q0[2]+(q1[2]-q0[2])*sd.t;
      var rd2=sm.tailRestDir[sdi2], ad2=tdd[sdi2];
      var rr2=rotVec(rd2[0],rd2[1],rd2[2],ad2[0],ad2[1],ad2[2],sd.rx,sd.ry,sd.rz);
      var rn2=rotVec(rd2[0],rd2[1],rd2[2],ad2[0],ad2[1],ad2[2],restN[o],restN[o+1],restN[o+2]);
      tx=cx4+rr2[0]; ty=cy4+rr2[1]; tz=cz4+rr2[2];
      simN[o]=rn2[0]; simN[o+1]=rn2[1]; simN[o+2]=rn2[2];
    } else {
      tx=rest[o]; ty=rest[o+1]; tz=rest[o+2];
    }
    simV[o]=(simV[o]+(tx-simP[o])*kdt)*dampF+accX*dt;
    simV[o+1]=(simV[o+1]+(ty-simP[o+1])*kdt)*dampF;
    simV[o+2]=(simV[o+2]+(tz-simP[o+2])*kdt)*dampF+accZ*dt;
    simP[o]+=simV[o]*dt; simP[o+1]+=simV[o+1]*dt; simP[o+2]+=simV[o+2]*dt;
  }
}

function compile(a){
  var g=a.genome, M=a.materials;
  var skin=hx(M.skin), skinB=hx(M.skinB), bellyC=hx(M.belly),
      padC=hx(M.pad), eyeC=hx(M.eye);
  var torsoY=g.legLen*0.92;

  /* Countershading color: dorsal slightly darker -> ventral light, plus markings */
  function skinColor(u, v, pos, base, dark){
    // v=0 at top (+Y). topness=1 at top, 0 at bottom.
    var topness=Math.cos(v*Math.PI*2)*0.5+0.5;
    // Gentle gradient: top uses dark, bottom uses base (lighter)
    var c=[
      dark[0]+(base[0]-dark[0])*(1-topness*0.5),
      dark[1]+(base[1]-dark[1])*(1-topness*0.5),
      dark[2]+(base[2]-dark[2])*(1-topness*0.5)
    ];
    // markings: stripes along body based on genome
    if (g.markingAmt>0.05){
      var stripe=Math.sin(u*20+g.marking*10)>0.6 ? 1 : 0;
      var spot=Math.sin(u*37+v*20+g.marking*20)>0.75 ? 1 : 0;
      var mk=g.marking<0.5?stripe:spot;
      if (mk && topness>0.4){
        var amt=g.markingAmt*0.5;
        c=[c[0]*(1-amt)+bellyC[0]*amt, c[1]*(1-amt)+bellyC[1]*amt, c[2]*(1-amt)+bellyC[2]*amt];
      }
    }
    return c;
  }
  var darkSkin=[Math.min(1,skin[0]*0.75+0.08), Math.min(1,skin[1]*0.75+0.08), Math.min(1,skin[2]*0.75+0.08)];

  /* ---- unified skin: one continuous mesh, no bolted parts ---- */
  var skinMesh=buildUnifiedSkin(g, M, skin, skinB, bellyC, padC);
  // eyes + nose as small separate meshes sitting on the skin
  var eyeGeoL=new Geo(); ball(eyeGeoL, 0.045, skinMesh.eyeL[0], skinMesh.eyeL[1], skinMesh.eyeL[2], eyeC, 8, 6);
  var eyeGeoR=new Geo(); ball(eyeGeoR, 0.045, skinMesh.eyeR[0], skinMesh.eyeR[1], skinMesh.eyeR[2], eyeC, 8, 6);
  var noseGeo=new Geo(); ball(noseGeo, 0.05, skinMesh.nose[0], skinMesh.nose[1], skinMesh.nose[2], [0.08,0.06,0.06], 8, 6);

  return {
    anatomy:a, skin:skinMesh, eyeL:eyeGeoL, eyeR:eyeGeoR, nose:noseGeo, torsoY:torsoY,
    legDefs:a.nodes.filter(function(n){return n.semanticRole==='locomotor-segment';})
  };
}
function appendGeo(dst, src){
  var base=dst.pos.length/3;
  for (var k=0;k<src.pos.length;k++){ dst.pos.push(src.pos[k]); dst.nrm.push(src.nrm[k]); dst.col.push(src.col[k]); }
  src.idx.forEach(function(ix){ dst.idx.push(ix+base); });
}

/* ============ organic tube builder (Stage A refinement) ============ */
/* Builds smooth tapered tubes along a spine — torso, neck, head, legs.
 * stations: [{x,y,z, rx,ry}] rings along the spine. colorFn(u, v, pos) -> [r,g,b]
 * where u is along-length (0..1), v is around (0..1, 0=top).
 * axis: 'x' for horizontal tubes (torso), 'y' for vertical tubes (legs). */
function tube(geo, stations, radial, colorFn, axis){
  axis=axis||'x';
  var rings=[];
  for (var s=0;s<stations.length;s++){
    var st=stations[s], ring=[];
    var u=s/(stations.length-1);
    for (var i=0;i<radial;i++){
      var v=i/radial, a=v*Math.PI*2;
      var cy=Math.cos(a), sz=Math.sin(a);
      var px, py, pz, nx, ny, nz;
      if (axis==='x'){
        // tube along X: rings in Y-Z plane, v=0 at top (+Y)
        px=st.x; py=st.y+cy*st.ry; pz=st.z+sz*st.rx;
        var nl=Math.hypot(cy*st.rx, sz*st.ry)||1;
        nx=0; ny=cy*st.rx/nl; nz=sz*st.ry/nl;
      } else {
        // tube along Y: rings in X-Z plane
        // v=0 at +Z (front), v=0.25 at +X, etc. — colorFn topness uses v differently
        px=st.x+cy*st.rx; py=st.y; pz=st.z+sz*st.rx;
        var nl2=Math.hypot(cy, sz)||1;
        nx=cy/nl2; ny=0; nz=sz/nl2;
      }
      var c=colorFn(u, v, [px,py,pz]);
      ring.push(geo.v(px,py,pz, nx,ny,nz, c[0],c[1],c[2]));
    }
    rings.push(ring);
  }
  for (var s2=0;s2<stations.length-1;s2++){
    for (var i2=0;i2<radial;i2++){
      var a2=rings[s2][i2], b2=rings[s2][(i2+1)%radial];
      var c2=rings[s2+1][i2], d2=rings[s2+1][(i2+1)%radial];
      geo.idx.push(a2,c2,b2, b2,c2,d2);
    }
  }
  // cap the ends
  function cap(ring, flip, c){
    var cx=0, cy2=0, cz2=0;
    ring.forEach(function(vi){ cx+=geo.pos[vi*3]; cy2+=geo.pos[vi*3+1]; cz2+=geo.pos[vi*3+2]; });
    var n=ring.length; cx/=n; cy2/=n; cz2/=n;
    var ci=geo.v(cx,cy2,cz2, flip?-1:1,0,0, c[0],c[1],c[2]);
    for (var i=0;i<n;i++){
      var a3=ring[i], b3=ring[(i+1)%n];
      if (flip) geo.idx.push(ci,a3,b3); else geo.idx.push(ci,b3,a3);
    }
  }
  var endC=colorFn(1,0.5,[0,0,0]);
  var startC=colorFn(0,0.5,[0,0,0]);
  cap(rings[rings.length-1], false, endC);
  cap(rings[0], true, startC);
}

/* ================= the Lab ================= */
TOOLS.creatures = { mount: function(host){
  var MW=window.MoorWorld;
  var planets=[];
  (MW.sectors()||[]).forEach(function(s){ (s.systems||[]).forEach(function(y){ (y.planets||[]).forEach(function(p){ planets.push(p); }); }); });
  var planet=planets[3]||planets[0];
  var terrain=makeTerrain('lab','temperate');
  var speciesSeed='prime', individualSeed='alpha-1';
  var anatomy=null, compiled=null, diagReport=null;
  var playing=true, softness=1, showInspector=false;
  // creature state
  var S={ x:0, z:0, heading:0.6, speed:0, targetSpeed:1.1, tx:6, tz:4, phase:0 };
  var feet=[]; // per leg runtime: {plant:[x,y,z], phase, swinging, from, to}

  host.innerHTML =
    '<p class="meta"><b>Creature Lab — Stage A: end-to-end walker.</b> '+
    'Deterministic anatomy → validation + repair → compiled mesh/rig/soft-tissue → procedural walking. '+
    'Stages B–G (swimming, flight, breeding, ecosystems) are planned, not present.</p>'+
    '<div class="t-controls">'+
    '<label>Habitat <select id="cl-ter"><option value="temperate">Temperate uneven</option><option value="rocky">High-gravity rocky</option><option value="cold">Cold terrain</option></select></label>'+
    '<label>Species seed <input id="cl-ss" value="prime" spellcheck="false" style="width:80px"></label>'+
    '<label>Individual <input id="cl-is" value="alpha-1" spellcheck="false" style="width:80px"></label>'+
    '<button class="btn primary" id="cl-gen">Generate</button>'+
    '<button class="btn" id="cl-remix">Remix individual</button>'+
    '</div>'+
    '<div class="t-controls">'+
    '<button class="btn" id="cl-play">Pause</button>'+
    '<label>Softness <input id="cl-soft" type="range" min="20" max="150" value="100"></label>'+
    '<button class="btn" id="cl-insp">Inspector</button>'+
    '<button class="btn" id="cl-save">Export</button>'+
    '<label class="btn">Import<input id="cl-load" type="file" accept=".json" hidden></label>'+
    '</div>'+
    '<canvas id="cl-cv" width="640" height="400" style="width:100%;border-radius:12px;touch-action:none"></canvas>'+
    '<div class="meta" id="cl-info"></div>'+
    '<div class="t-sec" id="cl-inspect" style="display:none"><div class="eyebrow">Inspector — anatomy, validation, diagnostics</div>'+
    '<div class="meta mono" id="cl-diag" style="white-space:pre-wrap;max-height:220px;overflow:auto"></div></div>'+
    '<p class="meta">Click the ground to set a walk target. Same seeds → same creature, byte-identical anatomy hash.</p>';

  /* ---------- WebGL ---------- */
  var cv=host.querySelector('#cl-cv'), gl=cv.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
  var VS='attribute vec3 p;attribute vec3 n;attribute vec3 c;'+
    'uniform mat4 mvp;uniform mat4 model;'+
    'varying vec3 vN;varying vec3 vC;'+
    'void main(){vec4 wp=model*vec4(p,1.0);vN=mat3(model)*n;vC=c;'+
    'gl_Position=mvp*wp;}';
  var FS='precision mediump float;varying vec3 vN;varying vec3 vC;'+
    'void main(){vec3 N=normalize(vN);'+
    'float ndl=max(dot(N,normalize(vec3(0.5,0.8,0.35))),0.0);'+
    'float up=N.y*0.5+0.5;'+
    'vec3 lit=vC*(0.45+0.75*ndl+0.25*up);'+
    'gl_FragColor=vec4(lit,1.0);}';
  function sh(t,s){ var h=gl.createShader(t); gl.shaderSource(h,s); gl.compileShader(h); return h; }
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  var aP=gl.getAttribLocation(pr,'p'), aNorm=gl.getAttribLocation(pr,'n'), aC=gl.getAttribLocation(pr,'c');
  var uMVP=gl.getUniformLocation(pr,'mvp'), uModel=gl.getUniformLocation(pr,'model');
  var meshCache={};
  function toMesh(geo){
    var key=geo.__mk;
    if (key&&meshCache[key]) return meshCache[key];
    var lp=gl.getAttribLocation(pr,'p'), ln=gl.getAttribLocation(pr,'n'), lc=gl.getAttribLocation(pr,'c');
    // Expand indexed geometry to non-indexed triangle soup (avoids index buffer issues)
    var pos=[], nrm=[], col=[];
    for (var i=0;i<geo.idx.length;i++){
      var vi=geo.idx[i]*3;
      pos.push(geo.pos[vi],geo.pos[vi+1],geo.pos[vi+2]);
      nrm.push(geo.nrm[vi],geo.nrm[vi+1],geo.nrm[vi+2]);
      col.push(geo.col[vi],geo.col[vi+1],geo.col[vi+2]);
    }
    function buf(arr,loc){
      var b=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,b);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);
      return {b:b,loc:loc,sz:3};
    }
    var m={p:buf(pos,lp),n:buf(nrm,ln),c:buf(col,lc),count:geo.idx.length,indexed:false};
    if (geo.pos.length/3<65536){
      key='k'+Math.random().toString(36).slice(2); geo.__mk=key; meshCache[key]=m;
    }
    return m;
  }
  function drawGeo(geo, model){
    var m=toMesh(geo);
    gl.uniformMatrix4fv(uModel,false,model);
    var attrs=[m.p,m.n,m.c];
    for (var i=0;i<attrs.length;i++){
      var at=attrs[i];
      gl.bindBuffer(gl.ARRAY_BUFFER,at.b);
      gl.enableVertexAttribArray(at.loc);
      gl.vertexAttribPointer(at.loc,at.sz,gl.FLOAT,false,0,0);
    }
    gl.drawArrays(gl.TRIANGLES,0,m.count);
  }
  function matIdentity(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function matMul(a,b){ var o=new Float32Array(16);
    for (var c=0;c<4;c++) for (var r=0;r<4;r++)
      o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
    return o; }
  function matTrans(x,y,z){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]); }
  function matRotY(a){ var c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
  function matRotX(a){ var c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
  function matRotZ(a){ var c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); }
  // terrain mesh (fixture)
  var terGeo=(function(){
    var g=new Geo(), N=48, SZ=44;
    var c1=hx('#3a5a3a'), c2=hx('#5a6a4a');
    for (var j=0;j<=N;j++) for (var i=0;i<=N;i++){
      var x=(i/N-0.5)*SZ, z=(j/N-0.5)*SZ, y=terrain.height(x,z);
      var t=Math.min(1,Math.max(0,(y+3)/6));
      g.v(x,y,z, 0,1,0, c1[0]+(c2[0]-c1[0])*t, c1[1]+(c2[1]-c1[1])*t, c1[2]+(c2[2]-c1[2])*t);
    }
    for (var y2=0;y2<N;y2++) for (var x2=0;x2<N;x2++){
      var a=y2*(N+1)+x2, b=a+1, c=a+N+1, d=c+1;
      g.idx.push(a,c,b,b,c,d);
    }
    // compute normals
    var gg=new Geo(); gg.pos=g.pos; gg.idx=g.idx;
    // (flat-up normals are fine for the fixture look; skip true normals)
    return g;
  })();

  /* ---------- camera ---------- */
  var camYaw=0.7, camPitch=0.32, camDist=10, dragging=false, lx=0, ly=0;
  cv.addEventListener('pointerdown',function(e){dragging=true;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!dragging)return;
    camYaw+=(e.clientX-lx)*0.008; camPitch=Math.max(0.15,Math.min(1.35,camPitch+(e.clientY-ly)*0.008));
    lx=e.clientX;ly=e.clientY;});
  cv.addEventListener('pointerup',function(){dragging=false;});
  cv.addEventListener('wheel',function(e){e.preventDefault();camDist=Math.max(6,Math.min(30,camDist*(1+e.deltaY*0.001)));},{passive:false});
  // click-to-move (click without drag)
  var downPos=null;
  cv.addEventListener('pointerdown',function(e){downPos=[e.clientX,e.clientY];});
  cv.addEventListener('pointerup',function(e){
    if (!downPos) return;
    var moved=Math.hypot(e.clientX-downPos[0],e.clientY-downPos[1]); downPos=null;
    if (moved>6||!compiled) return;
    var r=cv.getBoundingClientRect();
    var nx=((e.clientX-r.left)/r.width)*2-1, ny=-(((e.clientY-r.top)/r.height)*2-1);
    // unproject onto y=0 plane
    var mvp=currentMVP;
    var inv=matInverse(mvp);
    function unproj(px,py,pz){
      var v=[px,py,pz,1], o=[0,0,0,0];
      for (var r2=0;r2<4;r2++) o[r2]=inv[r2]*v[0]+inv[4+r2]*v[1]+inv[8+r2]*v[2]+inv[12+r2]*v[3];
      return [o[0]/o[3],o[1]/o[3],o[2]/o[3]];
    }
    var a=unproj(nx,ny,-1), b=unproj(nx,ny,1);
    var t=-a[1]/(b[1]-a[1]);
    if (t>0&&t<100){ S.tx=a[0]+(b[0]-a[0])*t; S.tz=a[2]+(b[2]-a[2])*t; }
  });
  function matInverse(m){
    var inv=new Float32Array(16);
    inv[0]=m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
    inv[4]=-m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    inv[8]=m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
    inv[12]=-m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    inv[1]=-m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
    inv[5]=m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    inv[9]=-m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
    inv[13]=m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    inv[2]=m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
    inv[6]=-m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    inv[10]=m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
    inv[14]=-m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    inv[3]=-m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
    inv[7]=m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    inv[11]=-m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
    inv[15]=m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
    var det=m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];
    if (!det) return matIdentity();
    det=1/det; for (var i=0;i<16;i++) inv[i]*=det;
    return inv;
  }

  /* ---------- generate ---------- */
  function generate(ss, is){
    speciesSeed=ss; individualSeed=is;
    var genome=resolveGenome(ss,is);
    anatomy=expandAnatomy(genome, planet);
    diagReport=repair(anatomy);
    compiled=compile(anatomy);
    // init feet
    feet=compiled.legDefs.map(function(ld,i){
      var p=ld.restPose.p;
      var wx=S.x+Math.cos(S.heading)*p[0]-Math.sin(S.heading)*p[2];
      var wz=S.z+Math.sin(S.heading)*p[0]+Math.cos(S.heading)*p[2];
      var s=terrain.sampleSurface(wx,wz);
      return { plant:[wx,s.position[1],wz], phase:gaitPhase(i,genome.legCount),
               swinging:false, from:null, to:null, t:0 };
    });
    meshCache={}; dynSkin=null;
    var errs=diagReport.diags.filter(function(d){return d.severity==='error';});
    host.querySelector('#cl-info').innerHTML=
      '<b>'+esc(anatomy.genome.legCount)+'-leg walker</b> · '+esc(planet.name)+' ('+esc(anatomy.planet.type)+') · '+
      'anatomy hash <span class="mono">'+anatomy.hash.slice(0,12)+'…</span> · '+
      'validation: '+(errs.length? errs.length+' errors' : 'clean')+
      (diagReport.log.length? ' · repaired: '+esc(diagReport.log.join('; ')) : '')+
      ' · mass '+genome.massKg.toFixed(0)+' kg';
    renderDiag();
  }
  function gaitPhase(i,n){
    if (n===4){ return [0,0.5,0.5,0][i%4]; }
    // 6 legs: lateral wave
    return [0,0.5,0.25,0.75,0.5,0][i%6];
  }
  function renderDiag(){
    if (!showInspector||!anatomy) return;
    var L=[];
    L.push('SPECIES '+anatomy.speciesId+'  grammar '+anatomy.grammarVersion+'  schema '+anatomy.schemaVersion);
    L.push('genome: '+anatomy.genome.legCount+' legs, body '+anatomy.genome.bodyLen.toFixed(2)+'m, mass '+anatomy.genome.massKg.toFixed(0)+'kg');
    L.push('anatomy hash: '+anatomy.hash);
    L.push('nodes: '+anatomy.nodes.length+'  soft regions: '+anatomy.softRegions.map(function(r){return r.id;}).join(','));
    L.push('--- validation ---');
    if (!diagReport.diags.length) L.push('clean');
    diagReport.diags.forEach(function(d){ L.push((d.severity==='error'?'ERR ':'warn ')+d.check+' @'+d.id+' — '+d.why); });
    L.push('--- repairs ('+diagReport.passes+' passes) ---');
    diagReport.log.forEach(function(l){ L.push('fixed: '+l); });
    L.push('--- capabilities (implemented) ---');
    L.push('walking (trot/wave gait, 2-bone IK, terrain feet) ✓');
    L.push('soft belly (verlet, inertia) ✓');
    L.push('swimming / flight / climbing / burrowing — PLANNED (Stage D–E)');
    L.push('breeding / damage / ecosystem — PLANNED (Stage F–G)');
    host.querySelector('#cl-diag').textContent=L.join('\n');
  }

  /* ---------- locomotion ---------- */
  function legLocal(i){
    var ld=compiled.legDefs[i];
    return ld.restPose.p;
  }
  function step(dt){
    if (!compiled||!playing) return;
    var g=anatomy.genome;
    // steering toward target
    var dx=S.tx-S.x, dz=S.tz-S.z, dist=Math.hypot(dx,dz);
    var wantHeading=Math.atan2(dz,dx);
    var dh=wantHeading-S.heading;
    while (dh>Math.PI)dh-=Math.PI*2; while (dh<-Math.PI)dh+=Math.PI*2;
    var turnRate=Math.max(-1.5,Math.min(1.5,dh*3));
    S.heading+=Math.max(-1.5*dt,Math.min(1.5*dt,dh));
    S.targetSpeed = dist>0.6 ? 1.1 : 0;
    var prevSpeed=S.speed;
    S.speed += (S.targetSpeed-S.speed)*Math.min(1,dt*2.5);
    S.accel=((S.speed-prevSpeed)/Math.max(dt,1e-4));
    var stride=0.55*g.strideF*(0.4+S.speed);
    var cycleT=Math.max(0.5, 1.15-S.speed*0.35);
    S.phase+=dt/cycleT*(S.speed>0.05?1:0);
    var ch=Math.cos(S.heading), sh=Math.sin(S.heading);
    // body follows terrain + gait bob
    // (roll removed: body mesh rolling without hips following looks like tipping over)
    var bs=terrain.sampleSurface(S.x,S.z);
    // bob at 2x stride frequency, amplitude scales with speed
    var bobA=0.06*Math.min(1,S.speed);
    var bob=Math.sin(S.phase*Math.PI*2*2)*bobA;
    var targetY=bs.position[1]+compiled.torsoY+bob;
    S.y=(S.y==null?targetY:S.y+(targetY-S.y)*Math.min(1,dt*6));
    // pitch with acceleration (subtle lean)
    var targetPitch=Math.max(-0.12,Math.min(0.12,-S.accel*0.05));
    S.pitch=(S.pitch==null?targetPitch:S.pitch+(targetPitch-S.pitch)*Math.min(1,dt*4));
    S.roll=0;
    S.x+=Math.cos(S.heading)*S.speed*dt;
    S.z+=Math.sin(S.heading)*S.speed*dt;
    // keep in bounds
    if (Math.abs(S.x)>20){S.x=Math.sign(S.x)*20;S.tx=-S.tx;}
    if (Math.abs(S.z)>20){S.z=Math.sign(S.z)*20;S.tz=-S.tz;}
    // feet
    feet.forEach(function(f,i){
      var lp=legLocal(i);
      // neutral foot in world
      var nx=S.x+ch*lp[0]-sh*lp[2]+ch*0.25, nz=S.z+sh*lp[0]+ch*lp[2]+sh*0.25;
      var cyc=(S.phase+f.phase)%1;
      var swinging=cyc>g.dutyF;
      if (swinging&&!f.swinging){
        // lift: choose new target ahead
        f.swinging=true; f.from=f.plant.slice();
        var lead=stride*1.4;
        var tx2=nx+Math.cos(S.heading)*lead*0.5, tz2=nz+Math.sin(S.heading)*lead*0.5;
        var s2=terrain.sampleSurface(tx2,tz2);
        f.to=[tx2,s2.position[1],tz2]; f.t=0;
      }
      if (!swinging){ f.swinging=false; }
      else {
        f.t+=dt/(cycleT*(1-g.dutyF));
        var k=Math.min(1,f.t), e=k*k*(3-2*k);
        var lift=Math.sin(e*Math.PI)*0.35;
        var s3=terrain.sampleSurface(
          f.from[0]+(f.to[0]-f.from[0])*e, f.from[2]+(f.to[2]-f.from[2])*e);
        f.plant=[ f.from[0]+(f.to[0]-f.from[0])*e,
                  s3.position[1]+lift,
                  f.from[2]+(f.to[2]-f.from[2])*e ];
        if (k>=1){ f.swinging=false; f.plant=f.to.slice(); }
      }
    });
  }

  /* ---------- 2-bone IK ---------- */
  function solveLeg(hipW, footW, l1, l2, poleW){
    var toF=[footW[0]-hipW[0],footW[1]-hipW[1],footW[2]-hipW[2]];
    var d=Math.hypot(toF[0],toF[1],toF[2]);
    var maxD=(l1+l2)*0.999, minD=Math.abs(l1-l2)*1.05+0.01;
    var dc=Math.max(minD,Math.min(maxD,d));
    var dir=[toF[0]/d,toF[1]/d,toF[2]/d];
    // knee via law of cosines
    var a1=Math.acos(Math.max(-1,Math.min(1,(l1*l1+dc*dc-l2*l2)/(2*l1*dc))));
    // bend axis = normalize(cross(dir, pole))
    var px=poleW[0],py=poleW[1],pz=poleW[2];
    var cx=dir[1]*pz-dir[2]*py, cy=dir[2]*px-dir[0]*pz, cz=dir[0]*py-dir[1]*px;
    var cl=Math.hypot(cx,cy,cz)||1; cx/=cl;cy/=cl;cz/=cl;
    // knee = hip + R(dir, +a1 around axis)*l1... use Rodrigues
    var cosA=Math.cos(a1), sinA=Math.sin(a1);
    var kx=dir[0]*cosA+(cy*dir[2]-cz*dir[1])*sinA+cx*(cx*dir[0]+cy*dir[1]+cz*dir[2])*(1-cosA);
    var ky=dir[1]*cosA+(cz*dir[0]-cx*dir[2])*sinA+cy*(cx*dir[0]+cy*dir[1]+cz*dir[2])*(1-cosA);
    var kz=dir[2]*cosA+(cx*dir[1]-cy*dir[0])*sinA+cz*(cx*dir[0]+cy*dir[1]+cz*dir[2])*(1-cosA);
    var knee=[hipW[0]+kx*l1, hipW[1]+ky*l1, hipW[2]+kz*l1];
    var footC=[hipW[0]+dir[0]*dc, hipW[1]+dir[1]*dc, hipW[2]+dir[2]*dc];
    return {knee:knee, foot:footC, stretched:d>maxD};
  }

  /* ---------- render ---------- */
  var currentMVP=matIdentity();
  // persistent dynamic buffers for belly cloth + target marker (updated per frame, not re-created)
  var dynBelly=null, dynMarker=null, dynSkin=null;
  function getDynSkin(sm){
    if (!dynSkin){
      dynSkin={};
      var n=sm.nv;
      [['p',3],['n',3]].forEach(function(x){
        var b=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,b);
        gl.bufferData(gl.ARRAY_BUFFER, n*x[1]*4, gl.DYNAMIC_DRAW);
        dynSkin[x[0]]={b:b, sz:x[1], loc:x[0]==='p'?aP:aNorm};
      });
      var cb=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,cb);
      gl.bufferData(gl.ARRAY_BUFFER, sm.col, gl.STATIC_DRAW);
      dynSkin.c={b:cb, sz:3, loc:aC};
      var ib=gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sm.idx), gl.STATIC_DRAW);
      dynSkin.ib=ib; dynSkin.count=sm.idx.length;
    }
    return dynSkin;
  }
  function getDynBelly(nverts){
    if (!dynBelly){
      dynBelly={};
      [['p',3],['n',3],['c',3]].forEach(function(x){
        var b=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,b);
        gl.bufferData(gl.ARRAY_BUFFER, nverts*x[1]*4, gl.DYNAMIC_DRAW);
        dynBelly[x[0]]={b:b, sz:x[1], loc:x[0]==='p'?aP:(x[0]==='n'?aNorm:aC)};
      });
      var ib=gl.createBuffer(); dynBelly.ib=ib;
    }
    return dynBelly;
  }
  function getDynMarker(){
    if (!dynMarker){
      var mg=new Geo(); var mc=hx('#5bd8ff');
      cyl(mg, 0.12,0.12,1.2,8, 0,0,0, mc,'y');
      dynMarker={geo:mg, mesh:toMesh(mg)};
    }
    return dynMarker;
  }
  function persp(f,a,n,f2){ var t=1/Math.tan(f/2),o=new Float32Array(16);
    o[0]=t/a;o[5]=t;o[10]=(f2+n)/(n-f2);o[11]=-1;o[14]=2*f2*n/(n-f2);return o; }
  function lookAt(e,c){
    var zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2],l=Math.hypot(zx,zy,zz);
    zx/=l;zy/=l;zz/=l;
    var xx=zz,xz=-zx;l=Math.hypot(xx,xz)||1;xx/=l;xz/=l;
    var yx=zy*xz-zz*0, yy=zz*xx-zx*xz, yz=-zy*xx;
    return new Float32Array([xx,yx,zx,0, 0,yy,zy,0, xz,yz,zz,0,
      -(xx*e[0]+xz*e[2]), -(yx*e[0]+yy*e[1]+yz*e[2]), -(zx*e[0]+zy*e[1]+zz*e[2]),1]);
  }
  function segModel(from, to, r){
    // model matrix aligning +Y cylinder from->to (for limb segments drawn along Y)
    var dx=to[0]-from[0], dy=to[1]-from[1], dz=to[2]-from[2];
    var len=Math.hypot(dx,dy,dz)||1e-6;
    var ux=dx/len, uy=dy/len, uz=dz/len;
    // rotation taking +Y to u
    var dot=uy, ang=Math.acos(Math.max(-1,Math.min(1,dot)));
    var ax=uz, az=-ux; // axis = Y x u
    var al=Math.hypot(ax,az);
    var m;
    if (al<1e-4){ m=matIdentity(); if (dot<0) m=matRotX(Math.PI); }
    else {
      ax/=al; az/=al;
      var c=Math.cos(ang), s=Math.sin(ang), t=1-c;
      m=new Float32Array([
        t*ax*ax+c, t*ax*0+s*az, t*ax*az-s*0, 0,
        t*ax*0-s*az, t*0*0+c, t*0*az+s*ax, 0,
        t*ax*az+s*0, t*0*az-s*ax, t*az*az+c, 0,
        0,0,0,1]);
      // note: geometry built along -Y from origin; we want +Y->u then translate
    }
    // scale Y by len (geometry is unit-ish? no — geometry has real length; use as-is)
    return matMul(matTrans(from[0],from[1],from[2]), m);
  }

  var raf=0, lastT=performance.now();
  function frame(now){
    raf=requestAnimationFrame(frame);
    var dt=Math.min(0.05,(now-lastT)/1000); lastT=now;
    step(dt);
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0.05,0.07,0.11,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    var cx=S.x, cz=S.z, cy=(S.y||2);
    var eye=[cx+Math.cos(camYaw)*Math.cos(camPitch)*camDist, cy+Math.sin(camPitch)*camDist,
             cz+Math.sin(camYaw)*Math.cos(camPitch)*camDist];
    var mvp=matMul(persp(0.9,cv.width/cv.height,0.1,120), lookAt(eye,[cx,cy,cz]));
    currentMVP=mvp;
    gl.uniformMatrix4fv(uMVP,false,mvp);
    // terrain
    drawGeo(terGeo, matIdentity());
    if (!compiled) return;
    var g=anatomy.genome, ch=Math.cos(S.heading), sh=Math.sin(S.heading);
    var bodyM=matMul(matTrans(S.x,S.y,S.z), matRotY(-S.heading));
    // apply roll (bank into turns) and pitch (acceleration lean)
    if (S.roll) bodyM=matMul(bodyM, matRotX(S.roll));
    if (S.pitch) bodyM=matMul(bodyM, matRotZ(S.pitch));
    // ---- UNIFIED SKIN: one mesh, bent by the animated skeleton ----
    var sm=compiled.skin;
    var invBodyM=matInverse(bodyM);
    function toLocal(w){
      return [invBodyM[0]*w[0]+invBodyM[4]*w[1]+invBodyM[8]*w[2]+invBodyM[12],
              invBodyM[1]*w[0]+invBodyM[5]*w[1]+invBodyM[9]*w[2]+invBodyM[13],
              invBodyM[2]*w[0]+invBodyM[6]*w[1]+invBodyM[10]*w[2]+invBodyM[14]];
    }
    var upperL=g.legLen*g.upperFrac, lowerL=g.legLen*(1-g.upperFrac);
    var legAnim=[];
    compiled.legDefs.forEach(function(ld,i){
      var lp=ld.restPose.p;
      var hipW=[S.x+ch*lp[0]-sh*lp[2], S.y+lp[1], S.z+sh*lp[0]+ch*lp[2]];
      var f=feet[i];
      var sideSign=(lp[2]>0?1:-1);
      var outX=-sh*sideSign, outZ=ch*sideSign;
      var poleW=[hipW[0]+outX*0.4+ch*0.2, hipW[1]-0.2, hipW[2]+outZ*0.4+sh*0.2];
      var sol=solveLeg(hipW, f.plant, upperL, lowerL, poleW);
      var hipL=toLocal(hipW), kneeL=toLocal(sol.knee), footL=toLocal(sol.foot);
      var ankleL=[kneeL[0]+(footL[0]-kneeL[0])*0.55,kneeL[1]+(footL[1]-kneeL[1])*0.55,kneeL[2]+(footL[2]-kneeL[2])*0.55];
      legAnim.push([hipL,kneeL,ankleL,footL]);
    });
    // tail wag (local space, lateral)
    var tSec=now/1000, tailAnim=[];
    for (var tpi=0;tpi<sm.tailRestSub.length;tpi++){
      var rp=sm.tailRestSub[tpi], tf=tpi/(sm.tailRestSub.length-1);
      tailAnim.push([rp[0], rp[1]+Math.sin(tSec*2+tpi)*0.015*tf,
                     rp[2]+Math.sin(tSec*3+tpi*0.9)*0.10*tf*Math.min(1,S.speed*2+0.2)]);
    }
    // whole-body soft tissue: springs chase the skinned targets
    deformSkin(sm, legAnim, tailAnim, softness, Math.min(0.05,dt),
               (S.accel||0)*0.35, (typeof turnRate!=='undefined'?turnRate:0)*0.6);
    // upload (local sim -> world) and draw as one indexed mesh
    var ds=getDynSkin(sm);
    var wp=new Float32Array(sm.nv*3), wn=new Float32Array(sm.nv*3);
    var sp=sm.simPos, sn=sm.simNrm;
    for (var wvi=0;wvi<sm.nv;wvi++){
      var wo=wvi*3, lx=sp[wo], ly=sp[wo+1], lz=sp[wo+2];
      wp[wo]  =bodyM[0]*lx+bodyM[4]*ly+bodyM[8]*lz+bodyM[12];
      wp[wo+1]=bodyM[1]*lx+bodyM[5]*ly+bodyM[9]*lz+bodyM[13];
      wp[wo+2]=bodyM[2]*lx+bodyM[6]*ly+bodyM[10]*lz+bodyM[14];
      var nx2=sn[wo], ny2=sn[wo+1], nz2=sn[wo+2];
      wn[wo]  =bodyM[0]*nx2+bodyM[4]*ny2+bodyM[8]*nz2;
      wn[wo+1]=bodyM[1]*nx2+bodyM[5]*ny2+bodyM[9]*nz2;
      wn[wo+2]=bodyM[2]*nx2+bodyM[6]*ny2+bodyM[10]*nz2;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, ds.p.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, wp);
    gl.bindBuffer(gl.ARRAY_BUFFER, ds.n.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, wn);
    gl.uniformMatrix4fv(uModel,false,matIdentity());
    [['p',ds.p],['n',ds.n],['c',ds.c]].forEach(function(x){
      gl.bindBuffer(gl.ARRAY_BUFFER,x[1].b); gl.enableVertexAttribArray(x[1].loc);
      gl.vertexAttribPointer(x[1].loc,x[1].sz,gl.FLOAT,false,0,0); });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ds.ib);
    gl.drawElements(gl.TRIANGLES, ds.count, gl.UNSIGNED_SHORT, 0);
    // eyes + nose ride on the skin
    drawGeo(compiled.eyeL, bodyM);
    drawGeo(compiled.eyeR, bodyM);
    drawGeo(compiled.nose, bodyM);
    // walk target marker
    drawGeo(getDynMarker().geo, matTrans(S.tx,terrain.height(S.tx,S.tz)+0.6,S.tz));
  }

  /* ---------- UI wiring ---------- */
  host.querySelector('#cl-gen').onclick=function(){
    generate(host.querySelector('#cl-ss').value||'prime', host.querySelector('#cl-is').value||'alpha-1');
  };
  host.querySelector('#cl-remix').onclick=function(){
    var r=stream('remix',speciesSeed+':'+individualSeed+':'+Date.now());
    generate(speciesSeed, 'remix-'+Math.floor(r()*1e6).toString(36));
    host.querySelector('#cl-is').value=individualSeed;
  };
  host.querySelector('#cl-play').onclick=function(e){
    playing=!playing; e.target.textContent=playing?'Pause':'Play';
  };
  host.querySelector('#cl-soft').oninput=function(e){ softness=e.target.value/100; };
  host.querySelector('#cl-insp').onclick=function(){
    showInspector=!showInspector;
    host.querySelector('#cl-inspect').style.display=showInspector?'':'none';
    renderDiag();
  };
  host.querySelector('#cl-ter').onchange=function(e){
    terrain=makeTerrain('lab', e.target.value);
  };
  host.querySelector('#cl-save').onclick=function(){
    if (!anatomy) return;
    var data={ app:'moor-creature-lab', schemaVersion:SCHEMA_VERSION,
      speciesId:anatomy.speciesId, speciesSeed:speciesSeed, individualSeed:individualSeed,
      anatomyHash:anatomy.hash, genome:anatomy.genome,
      state:{x:S.x,z:S.z,heading:S.heading} };
    var blob=new Blob([JSON.stringify(data)],{type:'application/json'});
    var aEl=document.createElement('a');
    aEl.href=URL.createObjectURL(blob);
    aEl.download='creature-'+individualSeed+'.json';
    aEl.click(); setTimeout(function(){URL.revokeObjectURL(aEl.href);},2000);
  };
  host.querySelector('#cl-load').onchange=function(e){
    var f=e.target.files[0]; if (!f) return;
    var rd=new FileReader();
    rd.onload=function(){
      try {
        var d=JSON.parse(rd.result);
        if (d.app!=='moor-creature-lab') throw new Error('not a creature file');
        generate(d.speciesSeed, d.individualSeed);
        if (d.anatomyHash!==anatomy.hash) throw new Error('hash mismatch — generator changed');
        S.x=d.state.x; S.z=d.state.z; S.heading=d.state.heading;
        host.querySelector('#cl-ss').value=d.speciesSeed;
        host.querySelector('#cl-is').value=d.individualSeed;
      } catch(err){ host.querySelector('#cl-info').textContent='Import failed: '+err.message; }
    };
    rd.readAsText(f);
  };

  generate(speciesSeed, individualSeed);
  frame(performance.now());
  TOOLS.creatures.unmount=function(){ cancelAnimationFrame(raf); };
}};

function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

})();


window.WONDER_PREVIEW_TOOL="creatures";
