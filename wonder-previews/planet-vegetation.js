
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


/* Planet vegetation — the real plant geometry builders from moor-planet-demo.html,
 * running verbatim against a minimal THREE shim (only the geometry classes the
 * builders use: BufferGeometry + 4 primitives). No THREE.js is loaded.
 * Panel-owned: the shim, the orbit viewer, and the wind sway (the real wind
 * shader is planet-field-specific and lives in the demo). */
(function(){
'use strict';

/* ---------- minimal THREE geometry shim (panel code) ---------- */
function BufAttr(arr, size){
  this.array = (arr instanceof Float32Array) ? arr : new Float32Array(arr);
  this.itemSize = size; this.count = this.array.length / size;
}
BufAttr.prototype.getX = function(i){ return this.array[i*3]; };
BufAttr.prototype.getY = function(i){ return this.array[i*3+1]; };
BufAttr.prototype.getZ = function(i){ return this.array[i*3+2]; };
BufAttr.prototype.setXYZ = function(i,x,y,z){ var a=this.array,o=i*3; a[o]=x;a[o+1]=y;a[o+2]=z; };
BufAttr.prototype.setXYZW = function(i,x,y,z,w){ var a=this.array,o=i*4; a[o]=x;a[o+1]=y;a[o+2]=z;a[o+3]=w; };

function BufferGeometry(){
  this.attributes = {}; this.index = null;
}
BufferGeometry.prototype.setAttribute = function(n,a){ this.attributes[n]=a; return this; };
BufferGeometry.prototype.setIndex = function(idx){
  this.index = (idx && idx.array) ? idx : {array: idx};
  return this;
};
BufferGeometry.prototype.computeVertexNormals = function(){
  var p = this.attributes.position, n = p.count;
  var ns = new Float32Array(n*3);
  var idx = this.index ? this.index.array : null;
  function tri(a,b,c){
    var ax=p.array[a*3],ay=p.array[a*3+1],az=p.array[a*3+2];
    var bx=p.array[b*3],by=p.array[b*3+1],bz=p.array[b*3+2];
    var cx=p.array[c*3],cy=p.array[c*3+1],cz=p.array[c*3+2];
    var ux=bx-ax,uy=by-ay,uz=bz-az, vx=cx-ax,vy=cy-ay,vz=cz-az;
    var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
    ns[a*3]+=nx;ns[a*3+1]+=ny;ns[a*3+2]+=nz;
    ns[b*3]+=nx;ns[b*3+1]+=ny;ns[b*3+2]+=nz;
    ns[c*3]+=nx;ns[c*3+1]+=ny;ns[c*3+2]+=nz;
  }
  if (idx){ for (var i=0;i<idx.length;i+=3) tri(idx[i],idx[i+1],idx[i+2]); }
  else { for (var j=0;j<n;j+=3) tri(j,j+1,j+2); }
  for (var k=0;k<n;k++){
    var l = Math.hypot(ns[k*3],ns[k*3+1],ns[k*3+2]) || 1;
    ns[k*3]/=l; ns[k*3+1]/=l; ns[k*3+2]/=l;
  }
  this.attributes.normal = new BufAttr(ns,3);
};
function xform(geo, fn){
  var p = geo.attributes.position;
  for (var i=0;i<p.count;i++) fn(p.array, i*3);
  if (geo.attributes.normal) geo.computeVertexNormals();
  return geo;
}
BufferGeometry.prototype.translate = function(x,y,z){
  return xform(this, function(a,o){ a[o]+=x; a[o+1]+=y; a[o+2]+=z; });
};
BufferGeometry.prototype.scale = function(x,y,z){
  return xform(this, function(a,o){ a[o]*=x; a[o+1]*=y; a[o+2]*=z; });
};
BufferGeometry.prototype.rotateX = function(a){
  var c=Math.cos(a), s=Math.sin(a);
  return xform(this, function(p,o){ var y=p[o+1],z=p[o+2]; p[o+1]=y*c-z*s; p[o+2]=y*s+z*c; });
};
BufferGeometry.prototype.rotateY = function(a){
  var c=Math.cos(a), s=Math.sin(a);
  return xform(this, function(p,o){ var x=p[o],z=p[o+2]; p[o]=x*c+z*s; p[o+2]=-x*s+z*c; });
};

function gridGeo(nu, nv, fn){
  // fn(u,v) -> [x,y,z]; indexed grid with normals via computeVertexNormals
  var pos = [], idx = [];
  for (var j=0;j<=nv;j++) for (var i=0;i<=nu;i++){
    var p = fn(i/nu, j/nv); pos.push(p[0],p[1],p[2]);
  }
  for (var y=0;y<nv;y++) for (var x=0;x<nu;x++){
    var a=y*(nu+1)+x, b=a+1, c=a+nu+1, d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  var g = new BufferGeometry();
  g.setAttribute('position', new BufAttr(pos,3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function CylinderGeometry(rt, rb, h, rad, hs){
  rad=rad||8; hs=hs||1;
  return gridGeo(rad, hs, function(u,v){
    var r = rb+(rt-rb)*v, a=u*Math.PI*2;
    return [Math.cos(a)*r, v*h, Math.sin(a)*r];
  });
}
function ConeGeometry(r, h, rad){
  return CylinderGeometry(0.0001, r, h, rad||8, 1);
}
function PlaneGeometry(w, h, ws, hs){
  return gridGeo(ws||1, hs||1, function(u,v){
    return [(u-0.5)*w, (v-0.5)*h, 0];
  });
}
function IcosahedronGeometry(r, detail){
  // base icosahedron; detail>0 subdivides once (detail 2 = enough for rocks/canopy)
  var t=(1+Math.sqrt(5))/2, v=[];
  [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
    .forEach(function(p){ var l=Math.hypot(p[0],p[1],p[2]); v.push([p[0]/l*r,p[1]/l*r,p[2]/l*r]); });
  var f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  function sub(a,b,c){
    var mab=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
    var mbc=[(b[0]+c[0])/2,(b[1]+c[1])/2,(b[2]+c[2])/2];
    var mca=[(c[0]+a[0])/2,(c[1]+a[1])/2,(c[2]+a[2])/2];
    [mab,mbc,mca].forEach(function(m){ var l=Math.hypot(m[0],m[1],m[2]); m[0]=m[0]/l*r;m[1]=m[1]/l*r;m[2]=m[2]/l*r; });
    return [[a,mab,mca],[mab,b,mbc],[mca,mbc,c],[mab,mbc,mca]];
  }
  var tris=[];
  f.forEach(function(ff){
    var t0=[v[ff[0]],v[ff[1]],v[ff[2]]];
    for (var d=0; d<(detail||0); d++){
      var nt=[];
      t0.forEach(function(t){ sub(t[0],t[1],t[2]).forEach(function(x){nt.push(x);}); });
      t0=nt;
    }
    t0.forEach(function(t){ tris.push(t); });
  });
  var pos=[], idx=[], vmap={};
  function vi(p){
    var k=p[0].toFixed(4)+','+p[1].toFixed(4)+','+p[2].toFixed(4);
    if (vmap[k]==null){ vmap[k]=pos.length/3; pos.push(p[0],p[1],p[2]); }
    return vmap[k];
  }
  tris.forEach(function(t){ idx.push(vi(t[0]),vi(t[1]),vi(t[2])); });
  var g=new BufferGeometry();
  g.setAttribute('position', new BufAttr(pos,3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
var THREE = {
  BufferGeometry: BufferGeometry, BufferAttribute: BufAttr,
  CylinderGeometry: CylinderGeometry, ConeGeometry: ConeGeometry,
  PlaneGeometry: PlaneGeometry, IcosahedronGeometry: IcosahedronGeometry
};

/* ---------- verbatim builders (from moor-planet-demo.html) ---------- */
function mulberry32f(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var VEG_SEED = 1;
function tinted(geo,r,gcol,b){
  const n=geo.attributes.position.count,t=new Float32Array(n*3);
  for(let i=0;i<n;i++){t[i*3]=r;t[i*3+1]=gcol;t[i*3+2]=b;}
  geo.setAttribute('aTint',new THREE.BufferAttribute(t,3));
  return geo;
}
function jitterGeo(geo,amt,seedJ){
  const p=geo.attributes.position,rnd=mulberry32f(seedJ);
  for(let i=0;i<p.count;i++){
    p.setXYZ(i,p.getX(i)+(rnd()-0.5)*amt,p.getY(i)+(rnd()-0.5)*amt,p.getZ(i)+(rnd()-0.5)*amt);
  }
  geo.computeVertexNormals();
  return geo;
}
function merge2(a,b){
  const pa=a.attributes.position,na=a.attributes.normal,ta=a.attributes.aTint;
  const pb=b.attributes.position,nb=b.attributes.normal,tb=b.attributes.aTint;
  const n=pa.count+pb.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),T=new Float32Array(n*3);
  P.set(pa.array,0);P.set(pb.array,pa.count*3);
  N.set(na.array,0);N.set(nb.array,pa.count*3);
  T.set(ta.array,0);T.set(tb.array,pa.count*3);
  const ia=a.index?Array.from(a.index.array):[...Array(pa.count).keys()];
  const ib=b.index?Array.from(b.index.array):[...Array(pb.count).keys()];
  const I=new Uint32Array(ia.length+ib.length);
  I.set(ia,0);
  for(let i=0;i<ib.length;i++)I[ia.length+i]=ib[i]+pa.count;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(P,3));
  g.setAttribute('normal',new THREE.BufferAttribute(N,3));
  g.setAttribute('aTint',new THREE.BufferAttribute(T,3));
  g.setIndex(new THREE.BufferAttribute(I,1));
  return g;
}
function coniferTreeGeo(){
  const trunk=new THREE.CylinderGeometry(0.28,0.42,1.6,6);trunk.translate(0,0.8,0);
  tinted(trunk,0.5,1,0);
  let g=trunk;
  const layers=[[2.6,3.2,2.2],[2.0,2.6,3.6],[1.3,2.0,4.8]];
  for(const [r,h,y] of layers){
    const c=new THREE.ConeGeometry(r,h,7);c.translate(0,y,0);
    tinted(c,0.15,0,0);
    g=merge2(g,c);
  }
  return g;
}
function broadTreeGeo(){
  const trunk=new THREE.CylinderGeometry(0.32,0.48,1.8,6);trunk.translate(0,0.9,0);
  tinted(trunk,0.5,1,0);
  const can=jitterGeo(new THREE.IcosahedronGeometry(3.8,2),1.0,VEG_SEED+9);
  can.scale(1,0.8,1);can.translate(0,3.4,0);
  tinted(can,0.35,0,0);
  return merge2(trunk,can);
}
function rockGeo(){
  const g=jitterGeo(new THREE.IcosahedronGeometry(1.5,2),0.55,VEG_SEED+21);
  g.scale(1,0.72,1);g.translate(0,0.5,0);
  return tinted(g,0.6,0.4,0);
}
function grassGeo(){
  const g=new THREE.BufferGeometry();
  const v=new Float32Array([
    -0.12,0,0, 0.12,0,0, -0.07,0.7,0, 0.07,0.7,0,
    0,0,-0.12, 0,0,0.12, 0,0.7,-0.07, 0,0.7,0.07 ]);
  const nn=new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    1,0,0, 1,0,0, 1,0,0, 1,0,0 ]);
  g.setAttribute('position',new THREE.BufferAttribute(v,3));
  g.setAttribute('normal',new THREE.BufferAttribute(nn,3));
  g.setIndex([0,1,2,2,1,3, 4,5,6,6,5,7]);
  return tinted(g,0.7,0,0);
}
function flowerGeo(){
  const stem=new THREE.CylinderGeometry(0.02,0.03,0.4,4);stem.translate(0,0.2,0);
  tinted(stem,0.5,1,0);
  const head=new THREE.IcosahedronGeometry(0.09,0);head.translate(0,0.45,0);
  tinted(head,0.9,0,0);
  const g=merge2(stem,head);
  return g;
}
function softPlantGeo(){
  const stem=new THREE.CylinderGeometry(0.07,0.11,1.7,5,3);stem.translate(0,0.85,0);
  tinted(stem,0.5,1,0);
  const leaves=[];
  const rnd=mulberry32f(VEG_SEED+33);
  for(let i=0;i<6;i++){
    const l=new THREE.PlaneGeometry(0.5,0.9,1,2);
    const a=i/6*Math.PI*2+rnd()*0.5,tilt=0.5+rnd()*0.5;
    l.rotateX(-tilt);
    l.rotateY(a);
    l.translate(Math.cos(a)*0.35,1.35+rnd()*0.4,Math.sin(a)*0.35);
    tinted(l,0.25,0,1);
    leaves.push(l);
  }
  let g=stem;
  for(const l of leaves)g=merge2(g,l);
  return g;
}

/* ---------- panel viewer: raw WebGL orbit + wind (panel code) ---------- */
var SPECIES = [
  {id:'conifer', name:'Conifer', make:coniferTreeGeo, colA:'#2e7a34', colB:'#3f8a3a', wind:0.35},
  {id:'broad', name:'Broadleaf', make:broadTreeGeo, colA:'#2e7a34', colB:'#4f9a3a', wind:0.35},
  {id:'soft', name:'Soft plant', make:softPlantGeo, colA:'#2e7a34', colB:'#4f9a3a', wind:0.5},
  {id:'grass', name:'Grass', make:grassGeo, colA:'#4a7a2e', colB:'#7a9a3a', wind:0.5},
  {id:'flower', name:'Flower', make:flowerGeo, colA:'#e84a7a', colB:'#f0d040', wind:0.3},
  {id:'rock', name:'Rock', make:rockGeo, colA:'#6e6e72', colB:'#8e8e92', wind:0}
];

TOOLS.vegetation = { mount: function(host){
  var wonderPlant=new URLSearchParams(location.search).has('wonder-preview');
  var species = SPECIES[0], seed = +(new URLSearchParams(location.search).get('seed')||7), wind = 0.35, count = wonderPlant?1:36;
  var canvasTerrain=null;
  function terrainAt(x,z){
    var t=canvasTerrain;if(!t)return {y:0,wet:false};
    var n=Math.round(Math.sqrt(t.heights.length));
    var ix=Math.max(0,Math.min(n-1,Math.round((x/24+.5)*(n-1))));
    var iz=Math.max(0,Math.min(n-1,Math.round((z/24+.5)*(n-1))));
    var h=+t.heights[iz*n+ix];return {y:h/10,wet:h<(+t.water||0)};
  }
  function onCanvasContext(e){
    if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='moor:canvas-context')return;
    var contexts=e.data.context||{};
    for(var id in contexts){var t=contexts[id]?.payload?.terrain;if(t&&Array.isArray(t.heights)&&t.heights.length===6561&&t.heights.every(Number.isFinite)){canvasTerrain=t;break;}}
  }
  window.addEventListener('message',onCanvasContext);
  host.innerHTML =
    '<div class="t-controls"><div class="t-species" id="v-sp"></div></div>'+
    '<div class="t-controls"><label>Seed <input id="v-seed" value="7" spellcheck="false" style="width:70px"></label>'+
    '<label>Wind <input id="v-wind" type="range" min="0" max="100" value="35"><span id="v-wind-v">0.35</span></label>'+
    '<label>Count <input id="v-count" type="range" min="4" max="120" value="36"><span id="v-count-v">36</span></label>'+
    '<button class="btn primary" id="v-grow">Grow</button></div>'+
    '<canvas id="v-cv" width="600" height="380" style="width:100%;border-radius:12px;touch-action:none"></canvas>'+
    '<p class="meta">Drag to orbit, scroll to zoom. The plant shapes are the real builders from the planet demo — the orbit camera and this wind sway are panel viewing code.</p>';

  var cv = host.querySelector('#v-cv'), gl = cv.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
  if(!gl){host.innerHTML='<p>WebGL unavailable in this browser.</p>';return;}
  var VS = 'attribute vec3 p;attribute vec3 n;attribute vec3 t;'+
    'uniform mat4 mvp;uniform float uTime,uWind;'+
    'varying vec3 vN;varying vec3 vT;varying float vH;'+
    'void main(){vec3 q=p;'+
    'float hk=clamp(q.y/4.0,0.0,1.0);'+
    'q.x+=sin(uTime*1.9+t.r*6.28)*uWind*hk*hk;'+
    'q.z+=cos(uTime*1.6+t.r*6.28)*uWind*hk*hk*0.6;'+
    'vN=n;vT=t;vH=hk;'+
    'gl_Position=mvp*vec4(q,1.0);}';
  var FS = 'precision mediump float;'+
    'uniform vec3 uColA,uColB,uBarkA,uBarkB;'+
    'varying vec3 vN;varying vec3 vT;varying float vH;'+
    'void main(){'+
    'vec3 leaf=mix(uColA,uColB,vT.r);'+
    'vec3 bark=mix(uBarkA,uBarkB,vT.r);'+
    'vec3 base=mix(leaf,bark,vT.g);'+
    'vec3 N=normalize(vN);'+
    'float ndl=max(dot(N,normalize(vec3(0.5,0.8,0.4))),0.0);'+
    'vec3 lit=base*(0.55+0.65*ndl+0.25*(N.y*0.5+0.5));'+
    'gl_FragColor=vec4(lit,1.0);}';
  function sh(t,s){ var h=gl.createShader(t); gl.shaderSource(h,s); gl.compileShader(h); return h; }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  var aP=gl.getAttribLocation(pr,'p'), aN=gl.getAttribLocation(pr,'n'), aT=gl.getAttribLocation(pr,'t');
  var uMVP=gl.getUniformLocation(pr,'mvp'), uTime=gl.getUniformLocation(pr,'uTime'),
      uWind=gl.getUniformLocation(pr,'uWind'), uColA=gl.getUniformLocation(pr,'uColA'),
      uColB=gl.getUniformLocation(pr,'uColB'), uBarkA=gl.getUniformLocation(pr,'uBarkA'),
      uBarkB=gl.getUniformLocation(pr,'uBarkB');
  function hx(c){ return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255]; }

  var yaw=0.6, pitch=0.5, dist=wonderPlant?8:34, dragging=false, lx=0, ly=0;
  cv.addEventListener('pointerdown', function(e){ dragging=true; lx=e.clientX; ly=e.clientY; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function(e){
    if (!dragging) return;
    yaw += (e.clientX-lx)*0.008; pitch = Math.max(0.08, Math.min(1.4, pitch+(e.clientY-ly)*0.008));
    lx=e.clientX; ly=e.clientY;
  });
  cv.addEventListener('pointerup', function(){ dragging=false; });
  cv.addEventListener('wheel', function(e){ e.preventDefault(); dist=Math.max(8,Math.min(80,dist*(1+e.deltaY*0.001))); }, {passive:false});

  var geos = [];
  function grow(){
    VEG_SEED = (parseInt(host.querySelector('#v-seed').value,10)||0);
    wind = (+host.querySelector('#v-wind').value)/100;
    count = +host.querySelector('#v-count').value;
    host.querySelector('#v-wind-v').textContent = wind.toFixed(2);
    host.querySelector('#v-count-v').textContent = count;
    var base = species.make();
    var rnd = mulberry32f(VEG_SEED*7919+11);
    geos = [];
    for (var i=0;i<count;i++){
      var a = rnd()*Math.PI*2, r = 3+rnd()*9;
      geos.push({g:base, x:wonderPlant?0:Math.cos(a)*r, z:wonderPlant?0:Math.sin(a)*r,
        s:0.7+rnd()*0.9, rot:rnd()*Math.PI*2, ph:rnd()});
    }
  }

  host.querySelector('#v-seed').value=String(seed);
  var sp = host.querySelector('#v-sp');
  SPECIES.forEach(function(spc){
    var b = document.createElement('button');
    b.className = 'btn'+(spc===species?' primary':'');
    b.textContent = spc.name;
    b.onclick = function(){
      species = spc;
      Array.prototype.forEach.call(sp.children, function(x){x.classList.remove('primary');});
      b.classList.add('primary'); grow();
    };
    sp.appendChild(b);
  });
  host.querySelector('#v-grow').onclick = grow;
  host.querySelector('#v-wind').oninput = grow;
  host.querySelector('#v-count').oninput = grow;
  grow();

  function mat4persp(fovy,asp,n,f){
    var t=1/Math.tan(fovy/2), o=new Float32Array(16);
    o[0]=t/asp; o[5]=t; o[10]=(f+n)/(n-f); o[11]=-1; o[14]=2*f*n/(n-f);
    return o;
  }
  function mat4look(eye,cx,cy,cz){
    var zx=eye[0]-cx, zy=eye[1]-cy, zz=eye[2]-cz;
    var l=Math.hypot(zx,zy,zz); zx/=l; zy/=l; zz/=l;
    var xx=zz, xy=0, xz=-zx;
    l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
    var yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
      -(xx*eye[0]+xy*eye[1]+xz*eye[2]), -(yx*eye[0]+yy*eye[1]+yz*eye[2]), -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1]);
  }
  function mat4mul(a,b){
    var o=new Float32Array(16);
    for (var c=0;c<4;c++) for (var r=0;r<4;r++){
      o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
    }
    return o;
  }

  var bufs = {};
  function getBufs(g){
    var key = g.__vk || (g.__vk = 'k'+Math.random().toString(36).slice(2));
    if (bufs[key]) return bufs[key];
    function mk(attr, loc, size){
      var b=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,b);
      gl.bufferData(gl.ARRAY_BUFFER, attr.array, gl.STATIC_DRAW);
      return {b:b, loc:loc, size:size, n:attr.count};
    }
    var o = {
      p: mk(g.attributes.position, aP, 3),
      n: mk(g.attributes.normal, aN, 3),
      t: mk(g.attributes.aTint, aT, 3),
      idx: (function(){
        var b=gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g.index.array), gl.STATIC_DRAW);
        return {b:b, n:g.index.array.length};
      })()
    };
    bufs[key]=o; return o;
  }

  var t0 = performance.now(), raf = 0;
  function frame(){
    raf = requestAnimationFrame(frame);
    var t = (performance.now()-t0)/1000;
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0.04,0.06,0.09,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    var eye=[Math.cos(yaw)*Math.cos(pitch)*dist, Math.sin(pitch)*dist, Math.sin(yaw)*Math.cos(pitch)*dist];
    var mvp = mat4mul(mat4persp(0.9, cv.width/cv.height, 0.1, 200), mat4look(eye,0,2,0));
    gl.uniformMatrix4fv(uMVP,false,mvp);
    gl.uniform1f(uTime,t); gl.uniform1f(uWind, wind*species.wind*3);
    var cA=hx(species.colA), cB=hx(species.colB);
    gl.uniform3f(uColA,cA[0],cA[1],cA[2]); gl.uniform3f(uColB,cB[0],cB[1],cB[2]);
    gl.uniform3f(uBarkA,0.29,0.21,0.13); gl.uniform3f(uBarkB,0.35,0.27,0.19);
    // ground disc
    // (simple dark disc drawn as a flattened cylinder would need geometry; skip — plants float on gradient bg)
    geos.forEach(function(inst){
      var ground=terrainAt(inst.x,inst.z);if(ground.wet)return;
      var B = getBufs(inst.g);
      // model matrix: scale/rot/translate folded into a per-instance MVP would need
      // a uniform; instead bake into a temporary matrix multiply here
      var c=Math.cos(inst.rot), s=Math.sin(inst.rot), k=inst.s;
      var model = new Float32Array([
        c*k,0,-s*k,0, 0,k,0,0, s*k,0,c*k,0, inst.x,ground.y,inst.z,1]);
      gl.uniformMatrix4fv(uMVP,false,mat4mul(mvp,model));
      gl.uniform1f(uTime, t + inst.ph*10);
      [[B.p],[B.n],[B.t]].forEach(function(x){
        gl.bindBuffer(gl.ARRAY_BUFFER, x[0].b);
        gl.enableVertexAttribArray(x[0].loc);
        gl.vertexAttribPointer(x[0].loc, x[0].size, gl.FLOAT, false, 0, 0);
      });
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.idx.b);
      gl.drawElements(gl.TRIANGLES, B.idx.n, gl.UNSIGNED_SHORT, 0);
    });
  }
  frame();
  TOOLS.vegetation.unmount = function(){ cancelAnimationFrame(raf);window.removeEventListener('message',onCanvasContext); };
}};

})();


window.WONDER_PREVIEW_TOOL="vegetation";
