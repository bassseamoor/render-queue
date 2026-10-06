
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


/* Vehicle Builder — procedural vehicle generator with a test drive.
 *
 * The interactive version of the "Procedural vehicle builders" component:
 * pick a body (chopper, touring bike, dune buggy), tune it with parameters,
 * roll a seeded random build, then take it for a drive on real recovered
 * physics.
 *
 * PROVENANCE (builders adapted, parameters added; defaults reproduce the
 * recovered models exactly):
 *   buildChopper <- moor-city/sky-islands/chopper-model.mjs :: createChopper
 *   buildTouring <- moor-city/sky-islands/touring-motorcycle.mjs :: createTouringBike
 *   drive physics <- moor-city/sky-islands/buggy-motion.mjs :: createVehicle/stepVehicle (verbatim)
 *   buildBuggy  <- new, written for this panel in the same builder style.
 * No THREE.js in this page: the builders run against a minimal geometry /
 * material shim below (Group, Mesh, primitives, MeshStandardMaterial) backed
 * by one small WebGL renderer. Honest limits: no shadows, no textures, one
 * directional light; the windshield is simple alpha blend.
 *
 * TAGS: tool:vehicles | cat:space cat:generators | dep:webgl | prov:procedural-vehicle-mesh prov:arcade-vehicle-drive | see:vehicle-physics see:mesh-builder see:redwood-drive see:creature-lab | src:moor-city/sky-islands/chopper-model.mjs src:moor-city/sky-islands/touring-motorcycle.mjs src:moor-city/sky-islands/buggy-motion.mjs
 */
(function(){
'use strict';

/* ---------------- tiny seeded rng (self-contained) ---------------- */
function hashSeed(s){ var h=2166136261>>>0; s=String(s);
  for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0; }
function mulberry32(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0;
  var t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296; }; }

/* ---------------- THREE-lite shim ---------------- */
function V3(x,y,z){ this.x=x||0; this.y=y||0; this.z=z||0; }
V3.prototype.set=function(x,y,z){ this.x=x; this.y=y; this.z=z; return this; };
V3.prototype.fromArray=function(a){ this.x=a[0]; this.y=a[1]; this.z=a[2]; return this; };
V3.prototype.copy=function(v){ this.x=v.x; this.y=v.y; this.z=v.z; return this; };
V3.prototype.add=function(v){ this.x+=v.x; this.y+=v.y; this.z+=v.z; return this; };
V3.prototype.sub=function(v){ this.x-=v.x; this.y-=v.y; this.z-=v.z; return this; };
V3.prototype.multiplyScalar=function(s){ this.x*=s; this.y*=s; this.z*=s; return this; };
V3.prototype.distanceTo=function(v){ var dx=this.x-v.x,dy=this.y-v.y,dz=this.z-v.z;
  return Math.sqrt(dx*dx+dy*dy+dz*dz); };
V3.prototype.normalize=function(){ var l=Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)||1;
  this.x/=l; this.y/=l; this.z/=l; return this; };
V3.prototype.clone=function(){ return new V3(this.x,this.y,this.z); };

function Quat(){ this.x=0; this.y=0; this.z=0; this.w=1; this._set=false; }
Quat.prototype.setFromUnitVectors=function(a,b){
  var r=a.x*b.x+a.y*b.y+a.z*b.z+1, x,y,z;
  if(r<1e-8){ r=0;
    if(Math.abs(a.x)>Math.abs(a.z)){ x=-a.y; y=a.x; z=0; }
    else { x=0; y=-a.z; z=a.y; }
  } else { x=a.y*b.z-a.z*b.y; y=a.z*b.x-a.x*b.z; z=a.x*b.y-a.y*b.x; }
  var l=Math.sqrt(x*x+y*y+z*z+r*r)||1;
  this.x=x/l; this.y=y/l; this.z=z/l; this.w=r/l; this._set=true; return this;
};
function quatFromEuler(x,y,z){
  var cx=Math.cos(x/2),sx=Math.sin(x/2),cy=Math.cos(y/2),sy=Math.sin(y/2),
      cz=Math.cos(z/2),sz=Math.sin(z/2), q=new Quat();
  q.w=cx*cy*cz+sx*sy*sz; q.x=sx*cy*cz-cx*sy*sz;
  q.y=cx*sy*cz+sx*cy*sz; q.z=cx*cy*sz-sx*sy*cz; return q;
}

function Node3(){ this.children=[]; this.position=new V3();
  var rot={x:0,y:0,z:0};
  rot.set=function(x,y,z){ rot.x=x; rot.y=y; rot.z=z; return rot; };
  this.rotation=rot;
  this.quaternion=new Quat(); this.scale=new V3(1,1,1); }
Node3.prototype.add=function(c){ this.children.push(c); return this; };
function Group(){ Node3.call(this); this.name=''; }
Group.prototype=Object.create(Node3.prototype);
function Mesh(geo,mat){ Node3.call(this); this.geometry=geo; this.material=mat; }
Mesh.prototype=Object.create(Node3.prototype);

function hexRGB(h){ h=String(h).replace('#','');
  if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  return [parseInt(h.substr(0,2),16)/255, parseInt(h.substr(2,2),16)/255, parseInt(h.substr(4,2),16)/255]; }
function MeshStandardMaterial(o){ o=o||{};
  this.color=hexRGB(o.color||'#ffffff');
  this.metalness=(o.metalness==null?0:o.metalness);
  this.roughness=(o.roughness==null?0.8:o.roughness);
  this.emissive=o.emissive?hexRGB(o.emissive):[0,0,0];
  this.emissiveIntensity=(o.emissiveIntensity==null?1:o.emissiveIntensity);
  this.transparent=!!o.transparent; this.opacity=(o.opacity==null?1:o.opacity);
  this.doubleSided=(o.side===2); }

/* geometry converters -> non-indexed {pos,nrm,count} */
function newGeo(){ return {p:[],n:[]}; }
function tri(G,a,b,c,na,nb,nc){
  G.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);
  G.n.push(na[0],na[1],na[2],nb[0],nb[1],nb[2],nc[0],nc[1],nc[2]);
}
function boxGeo(w,h,d){ var G=newGeo(),x=w/2,y=h/2,z=d/2;
  function face(c,n){ var a=[c[0][0],c[0][1],c[0][2]],b=[c[1][0],c[1][1],c[1][2]],
    d2=[c[2][0],c[2][1],c[2][2]],e=[c[3][0],c[3][1],c[3][2]];
    tri(G,a,b,d2,n,n,n); tri(G,a,d2,e,n,n,n); }
  face([[x,y,z],[-x,y,z],[-x,y,-z],[x,y,-z]],[0,1,0]);
  face([[x,-y,-z],[-x,-y,-z],[-x,-y,z],[x,-y,z]],[0,-1,0]);
  face([[x,y,z],[x,y,-z],[x,-y,-z],[x,-y,z]],[1,0,0]);
  face([[-x,y,-z],[-x,y,z],[-x,-y,z],[-x,-y,-z]],[-1,0,0]);
  face([[x,y,z],[x,-y,z],[-x,-y,z],[-x,y,z]],[0,0,1]);
  face([[x,y,-z],[-x,y,-z],[-x,-y,-z],[x,-y,-z]],[0,0,-1]);
  return G; }
function cylGeo(rt,rb,h,rad,hs,open,ts,tl){
  rad=rad||12; hs=hs||1; ts=ts||0; tl=(tl==null?Math.PI*2:tl); var G=newGeo();
  function pt(r,a,y){ return [r*Math.cos(a),y,r*Math.sin(a)]; }
  function nrm(a){ var s=(rb-rt)/h, l=Math.sqrt(1+s*s);
    return [Math.cos(a)/l, s/l, Math.sin(a)/l]; }
  for(var iy=0;iy<hs;iy++){ var y0=-h/2+h*iy/hs, y1=-h/2+h*(iy+1)/hs,
      r0=rb+(rt-rb)*iy/hs, r1=rb+(rt-rb)*(iy+1)/hs;
    for(var i=0;i<rad;i++){ var a0=ts+tl*i/rad, a1=ts+tl*(i+1)/rad;
      var b0=pt(r0,a0,y0),b1=pt(r0,a1,y0),t0=pt(r1,a0,y1),t1=pt(r1,a1,y1),
          n0=nrm(a0),n1=nrm(a1);
      tri(G,b0,t1,b1,n0,n1,n1); tri(G,b0,t0,t1,n0,n0,n1); } }
  if(!open){
    if(rt>0){ var c=[0,h/2,0];
      for(var j=0;j<rad;j++){ var q0=ts+tl*j/rad,q1=ts+tl*(j+1)/rad;
        tri(G,c,pt(rt,q1,h/2),pt(rt,q0,h/2),[0,1,0],[0,1,0],[0,1,0]); } }
    if(rb>0){ var c2=[0,-h/2,0];
      for(var k=0;k<rad;k++){ var w0=ts+tl*k/rad,w1=ts+tl*(k+1)/rad;
        tri(G,c2,pt(rb,w0,-h/2),pt(rb,w1,-h/2),[0,-1,0],[0,-1,0],[0,-1,0]); } } }
  return G; }
function sphGeo(r,ws,hs){ ws=ws||16; hs=hs||12; var G=newGeo();
  function pt(u,v){ var th=u*Math.PI*2, ph=v*Math.PI,
    x=r*Math.sin(ph)*Math.cos(th), y=r*Math.cos(ph), z=r*Math.sin(ph)*Math.sin(th);
    return [[x,y,z],[x/r,y/r,z/r]]; }
  for(var iy=0;iy<hs;iy++) for(var ix=0;ix<ws;ix++){
    var p00=pt(ix/ws,iy/hs),p10=pt((ix+1)/ws,iy/hs),
        p01=pt(ix/ws,(iy+1)/hs),p11=pt((ix+1)/ws,(iy+1)/hs);
    tri(G,p00[0],p10[0],p11[0],p00[1],p10[1],p11[1]);
    tri(G,p00[0],p11[0],p01[0],p00[1],p11[1],p01[1]); }
  return G; }
function torGeo(R,r,rs,ts,arc){ rs=rs||8; ts=ts||24; arc=(arc==null?Math.PI*2:arc);
  var G=newGeo();
  function pt(u,v){ var cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v),
    cx=R*cu, cy=R*su;
    return [[cx+r*cv*cu, cy+r*cv*su, r*sv],[cv*cu, cv*su, sv]]; }
  for(var i=0;i<ts;i++) for(var j=0;j<rs;j++){
    var p00=pt(arc*i/ts,2*Math.PI*j/rs),p10=pt(arc*(i+1)/ts,2*Math.PI*j/rs),
        p01=pt(arc*i/ts,2*Math.PI*(j+1)/rs),p11=pt(arc*(i+1)/ts,2*Math.PI*(j+1)/rs);
    tri(G,p00[0],p10[0],p11[0],p00[1],p10[1],p11[1]);
    tri(G,p00[0],p11[0],p01[0],p00[1],p11[1],p01[1]); }
  return G; }
function planeGeo(w,d){ var G=newGeo(),x=w/2,z=d/2;
  tri(G,[-x,0,-z],[x,0,-z],[x,0,z],[0,1,0],[0,1,0],[0,1,0]);
  tri(G,[-x,0,-z],[x,0,z],[-x,0,z],[0,1,0],[0,1,0],[0,1,0]); return G; }

var TL = {
  Group:Group, Mesh:Mesh, Vector3:function(x,y,z){ return new V3(x,y,z); },
  DoubleSide:2,
  MeshStandardMaterial:MeshStandardMaterial,
  BoxGeometry:function(w,h,d){ return boxGeo(w,h,d); },
  CylinderGeometry:function(rt,rb,h,rad,hs,open,ts,tl){ return cylGeo(rt,rb,h,rad,hs,open,ts,tl); },
  SphereGeometry:function(r,ws,hs){ return sphGeo(r,ws,hs); },
  TorusGeometry:function(R,r,rs,ts,arc){ return torGeo(R,r,rs,ts,arc); }
};

/* ---------------- vehicle builders (param P; defaults = recovered originals) ---------------- */
function makeMats(T,P){
  return {
    paint:  new T.MeshStandardMaterial({color:P.paint, metalness:.55, roughness:.23}),
    chrome: new T.MeshStandardMaterial({color:'#c0cbd0', metalness:.88, roughness:.2}),
    black:  new T.MeshStandardMaterial({color:'#202226', roughness:.65}),
    tire:   new T.MeshStandardMaterial({color:'#171a1d', roughness:.95}),
    leather:new T.MeshStandardMaterial({color:P.seat, roughness:.8}),
    gold:   new T.MeshStandardMaterial({color:P.accent, metalness:.72, roughness:.3}),
    light:  new T.MeshStandardMaterial({color:'#fff2ce', emissive:'#ffdf9c', emissiveIntensity:1.4}),
    red:    new T.MeshStandardMaterial({color:'#9f272b', emissive:'#8f120f', emissiveIntensity:.7})
  };
}
function builderHelpers(T,mats){
  function mesh(p,g,m,pos){ var o=new T.Mesh(g,mats[m]);
    o.position.fromArray(pos||[0,0,0]); p.add(o); return o; }
  function rod(p,a,b,r,m){ m=m||'chrome';
    var A=new T.Vector3(a[0],a[1],a[2]), B=new T.Vector3(b[0],b[1],b[2]);
    var o=mesh(p,new T.CylinderGeometry(r,r,A.distanceTo(B),12),m);
    o.position.copy(A).add(B).multiplyScalar(.5);
    o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),B.sub(A).normalize());
    return o; }
  function box(p,pos,size,m){ return mesh(p,new T.BoxGeometry(size[0],size[1],size[2]),m,pos); }
  /* spoked wheel shared by all builders; pivot stays at ground-contact height */
  function wheel(root,z,r,width){
    var pivot=new T.Group(), spin=new T.Group();
    pivot.position.set(0,r,z); root.add(pivot); pivot.add(spin);
    var tire=mesh(spin,new T.TorusGeometry(r-width*.4,width*.4,12,40),'tire');
    tire.rotation.y=Math.PI/2;
    for(var side=-1;side<=1;side+=2){
      var ring=mesh(spin,new T.TorusGeometry(r*.72,.035,7,40),'chrome',[side*width*.25,0,0]);
      ring.rotation.y=Math.PI/2;
      for(var i=0;i<24;i++){ var a=i*Math.PI/12;
        rod(spin,[side*.07,0,0],[side*width*.25,Math.cos(a)*r*.72,Math.sin(a)*r*.72],.012,'chrome'); } }
    var hub=mesh(spin,new T.CylinderGeometry(.13,.13,width+.07,18),'chrome');
    hub.rotation.z=Math.PI/2;
    var disk=mesh(spin,new T.CylinderGeometry(r*.38,r*.38,.025,24),'chrome',[-width*.52,0,0]);
    disk.rotation.z=Math.PI/2;
    for(var k=0;k<28;k++){ var t=k*Math.PI*2/28,
      bx=box(spin,[0,Math.cos(t)*r,Math.sin(t)*r],[width*.65,.025,.09],'tire');
      bx.rotation.x=t; }
    return {pivot:pivot,spin:spin,r:r};
  }
  return {mesh:mesh,rod:rod,box:box,wheel:wheel};
}

/* Chopper — from chopper-model.mjs :: createChopper */
function buildChopper(T,P){
  var mats=makeMats(T,P), H=builderHelpers(T,mats),
      mesh=H.mesh, rod=H.rod, box=H.box;
  var root=new T.Group(); root.name='SUNDOWN_CUSTOM_CHOPPER';
  var rear=H.wheel(root,-1.35,.65*P.wheel,.65*P.wheel),
      front=H.wheel(root,2.1,.79*P.wheel,.28*P.wheel);
  for(var side=-1;side<=1;side+=2){
    rod(root,[side*.22,.6,-1.32],[side*.22,.38,.25],.065,'black');
    rod(root,[side*.22,.38,.25],[side*.22,1.45,.85],.065,'black');
    rod(root,[side*.22,1.45,.85],[side*.22,1.1,-.8],.065,'black');
    rod(root,[side*.22,1.1,-.8],[side*.22,.6,-1.32],.065,'black');
    rod(root,[side*.2,1.54,.91],[side*.2,.79,2.1],.072);
    rod(root,[side*.2,1.07,1.75],[side*.2,.79,2.1],.09);
    rod(root,[side*.38,.55,-1.2],[side*.32,1.1,-.6],.06);
    for(var j=0;j<7;j++){
      var spring=mesh(root,new T.TorusGeometry(.087,.018,5,12),'chrome',
        [side*.35,.62+j*.065,-1.12+j*.073]);
      spring.rotation.x=.85; } }
  var tank=mesh(root,new T.SphereGeometry(1,24,14),'paint',[0,1.43,.35]);
  tank.scale.set(.43*P.tank,.34*P.tank,.74*P.tank);
  var stripe=mesh(root,new T.SphereGeometry(1,24,14),'gold',[0,1.454,.35]);
  stripe.scale.set(.055*P.tank,.328*P.tank,.727*P.tank);
  mesh(root,new T.CylinderGeometry(.09,.09,.025,20),'chrome',[0,1.78,.22]);
  for(var zi=0;zi<2;zi++){ var z=zi? .35 : -.37;
    var cyl=new T.Group(); cyl.position.set(0,.85,z); cyl.rotation.x=z<0?-.48:.48;
    root.add(cyl);
    for(var f=0;f<9;f++) box(cyl,[0,f*.037,0],[.61,.025,.38],f%2?'chrome':'black');
    box(cyl,[0,.37,0],[.56,.13,.36],'chrome'); }
  var crank=mesh(root,new T.CylinderGeometry(.31,.31,.65,24),'chrome',[0,.57,0]);
  crank.rotation.z=Math.PI/2;
  var cover=mesh(root,new T.CylinderGeometry(.19,.19,.08,24),'gold',[.38,.57,0]);
  cover.rotation.z=Math.PI/2;
  for(var s2=-1;s2<=1;s2+=2){
    rod(root,[s2*.38,.82,.18],[s2*.52,.45,.12],.075);
    rod(root,[s2*.52,.45,.12],[s2*.52,.39,-1.64],.075);
    rod(root,[s2*.52,.39,-1.64],[s2*.57,.46,-1.87],.09);
    rod(root,[s2*.2,.48,.55],[s2*.66,.48,.55],.04);
    box(root,[s2*.65,.48,.55],[.2,.1,.28],'black'); }
  var saddle=mesh(root,new T.SphereGeometry(1,18,10),'leather',[0,1.03,-.67]);
  saddle.scale.set(.41,.14,.46);
  for(var st=0;st<6;st++) box(root,[0,1.16,-.99+st*.12],[.58,.018,.018],'gold');
  var fender=mesh(root,new T.TorusGeometry(.76,.065,8,28,Math.PI),'paint',[0,.65,-1.35]);
  fender.rotation.set(0,Math.PI/2,0); fender.scale.z=4.2;
  rod(root,[-.3,1.04,-1.6],[-.3,1.8,-1.72],.03);
  rod(root,[.3,1.04,-1.6],[.3,1.8,-1.72],.03);
  rod(root,[-.3,1.8,-1.72],[.3,1.8,-1.72],.03);
  box(root,[0,1.22,-1.95],[.35,.12,.09],'red');
  var bars=new T.Group(); bars.position.set(0,1.7*P.bars,.87); root.add(bars);
  for(var s3=-1;s3<=1;s3+=2){
    rod(bars,[0,0,0],[s3*.28,.12,0],.04);
    rod(bars,[s3*.28,.12,0],[s3*.42,.48,-.12],.04);
    rod(bars,[s3*.42,.48,-.12],[s3*.69,.43,-.27],.04);
    rod(bars,[s3*.53,.45,-.2],[s3*.73,.42,-.29],.052,'black');
    rod(bars,[s3*.55,.43,-.22],[s3*.62,.68,-.15],.02);
    var mirror=mesh(bars,new T.SphereGeometry(1,12,8),'chrome',[s3*.62,.71,-.15]);
    mirror.scale.set(.14,.1,.025); }
  var lamp=mesh(root,new T.CylinderGeometry(.19,.22,.25,24),'chrome',[0,1.58,1.1]);
  lamp.rotation.x=Math.PI/2;
  var lens=mesh(root,new T.CylinderGeometry(.165,.165,.025,24),'light',[0,1.58,1.24]);
  lens.rotation.x=Math.PI/2;
  return { root:root,
    update:function(distance,steer){
      front.spin.rotation.x+=distance/front.r; rear.spin.rotation.x+=distance/rear.r;
      front.pivot.rotation.y=steer; bars.rotation.y=steer*.65; } };
}

/* Touring bike — from touring-motorcycle.mjs :: createTouringBike */
function buildTouring(T,P){
  var mats=makeMats(T,P), H=builderHelpers(T,mats),
      mesh=H.mesh, rod=H.rod, box=H.box;
  var root=new T.Group(); root.name='SUNDOWN_TOURING_MOTORCYCLE';
  var rear=H.wheel(root,-1.35,.65*P.wheel,.65*P.wheel),
      front=H.wheel(root,1.5,.79*P.wheel,.28*P.wheel);
  for(var side=-1;side<=1;side+=2){
    rod(root,[side*.22,.6,-1.32],[side*.22,.38,.25],.065,'black');
    rod(root,[side*.22,.38,.25],[side*.22,1.45,.85],.065,'black');
    rod(root,[side*.22,1.45,.85],[side*.22,1.1,-.8],.065,'black');
    rod(root,[side*.22,1.1,-.8],[side*.22,.6,-1.32],.065,'black');
    rod(root,[side*.2,1.54,.91],[side*.2,.79,1.5],.072);
    rod(root,[side*.2,1.07,1.75],[side*.2,.79,1.5],.09);
    rod(root,[side*.38,.55,-1.2],[side*.32,1.1,-.6],.06);
    for(var j=0;j<7;j++){
      var spring=mesh(root,new T.TorusGeometry(.087,.018,5,12),'chrome',
        [side*.35,.62+j*.065,-1.12+j*.073]);
      spring.rotation.x=.85; } }
  var tank=mesh(root,new T.SphereGeometry(1,24,14),'paint',[0,1.43,.35]);
  tank.scale.set(.43*P.tank,.34*P.tank,.74*P.tank);
  var stripe=mesh(root,new T.SphereGeometry(1,24,14),'gold',[0,1.454,.35]);
  stripe.scale.set(.055*P.tank,.328*P.tank,.727*P.tank);
  mesh(root,new T.CylinderGeometry(.09,.09,.025,20),'chrome',[0,1.78,.22]);
  for(var zi=0;zi<2;zi++){ var z=zi? .35 : -.37;
    var cyl=new T.Group(); cyl.position.set(0,.85,z); cyl.rotation.x=z<0?-.48:.48;
    root.add(cyl);
    for(var f=0;f<9;f++) box(cyl,[0,f*.037,0],[.61,.025,.38],f%2?'chrome':'black');
    box(cyl,[0,.37,0],[.56,.13,.36],'chrome'); }
  var crank=mesh(root,new T.CylinderGeometry(.31,.31,.65,24),'chrome',[0,.57,0]);
  crank.rotation.z=Math.PI/2;
  var cover=mesh(root,new T.CylinderGeometry(.19,.19,.08,24),'gold',[.38,.57,0]);
  cover.rotation.z=Math.PI/2;
  for(var s2=-1;s2<=1;s2+=2){
    rod(root,[s2*.38,.82,.18],[s2*.52,.45,.12],.075);
    rod(root,[s2*.52,.45,.12],[s2*.52,.39,-1.64],.075);
    rod(root,[s2*.52,.39,-1.64],[s2*.57,.46,-1.87],.09);
    rod(root,[s2*.2,.48,.55],[s2*.66,.48,.55],.04);
    box(root,[s2*.65,.48,.55],[.2,.1,.28],'black'); }
  var saddle=mesh(root,new T.SphereGeometry(1,18,10),'leather',[0,1.03,-.67]);
  saddle.scale.set(.41,.14,.46);
  for(var st=0;st<6;st++) box(root,[0,1.16,-.99+st*.12],[.58,.018,.018],'gold');
  var fender=mesh(root,new T.TorusGeometry(.76,.065,8,28,Math.PI),'paint',[0,.65,-1.35]);
  fender.rotation.set(0,Math.PI/2,0); fender.scale.z=4.2;
  rod(root,[-.3,1.04,-1.6],[-.3,1.8,-1.72],.03);
  rod(root,[.3,1.04,-1.6],[.3,1.8,-1.72],.03);
  rod(root,[-.3,1.8,-1.72],[.3,1.8,-1.72],.03);
  box(root,[0,1.22,-1.95],[.35,.12,.09],'red');
  var bars=new T.Group(); bars.position.set(0,1.7*P.bars,.87); root.add(bars);
  for(var s3=-1;s3<=1;s3+=2){
    rod(bars,[0,0,0],[s3*.28,.12,0],.04);
    rod(bars,[s3*.28,.12,0],[s3*.42,.17,-.12],.04);
    rod(bars,[s3*.42,.17,-.12],[s3*.69,.15,-.27],.04);
    rod(bars,[s3*.53,.17,-.2],[s3*.73,.15,-.29],.052,'black');
    rod(bars,[s3*.55,.17,-.22],[s3*.62,.43,-.15],.02);
    var mirror=mesh(bars,new T.SphereGeometry(1,12,8),'chrome',[s3*.62,.48,-.15]);
    mirror.scale.set(.14,.1,.025); }
  var lamp=mesh(root,new T.CylinderGeometry(.19,.22,.25,24),'chrome',[0,1.58,1.1]);
  lamp.rotation.x=Math.PI/2;
  var lens=mesh(root,new T.CylinderGeometry(.165,.165,.025,24),'light',[0,1.58,1.24]);
  lens.rotation.x=Math.PI/2;
  /* touring extras: fairing, screen, crash bars, hard luggage, pillion, trunk */
  var fairing=mesh(root,new T.SphereGeometry(1,24,16),'paint',[0,1.72,1.02]);
  fairing.scale.set(.77,.52,.4);
  var dash=mesh(root,new T.SphereGeometry(1,20,12),'black',[0,1.86,.74]);
  dash.scale.set(.64,.3,.16);
  for(var gx=-1;gx<=1;gx+=2){
    var gauge=mesh(root,new T.CylinderGeometry(.09,.09,.025,18),'light',[gx*.2,1.99,.61]);
    gauge.rotation.x=Math.PI/2; }
  var screenMat=new T.MeshStandardMaterial({color:'#c1e0e4',roughness:.14,metalness:.1,
    transparent:true,opacity:.28,side:T.DoubleSide});
  var screen=new T.Mesh(new T.CylinderGeometry(.77,.77,.85,28,1,true,-.92,1.84),screenMat);
  screen.position.set(0,2.32,.48); screen.rotation.x=-.15; root.add(screen);
  for(var s4=-1;s4<=1;s4+=2){
    rod(root,[s4*.57,1.76,.93],[s4*.55,2.53,.83],.025);
    var aux=mesh(root,new T.CylinderGeometry(.13,.13,.035,22),'light',[s4*.37,1.6,1.36]);
    aux.rotation.x=Math.PI/2;
    rod(root,[s4*.38,.47,.75],[s4*.76,.48,.67],.04);
    rod(root,[s4*.76,.48,.67],[s4*.76,1,.52],.04);
    rod(root,[s4*.76,1,.52],[s4*.38,1.1,.42],.04);
    var bag=mesh(root,new T.SphereGeometry(1,20,12),'paint',[s4*.6,.94,-1.28]);
    bag.scale.set(.34,.46,.77);
    box(root,[s4*.6,1.3,-1.28],[.58,.1,1.28],'black');
    box(root,[s4*.92,1,-1.24],[.025,.055,1.13],'gold');
    box(root,[s4*.6,.88,-1.98],[.38,.12,.04],'red'); }
  var pillion=mesh(root,new T.SphereGeometry(1,18,10),'leather',[0,1.22,-1.32]);
  pillion.scale.set(.43,.16,.39);
  var trunk=mesh(root,new T.SphereGeometry(1,20,12),'paint',[0,1.6,-1.83]);
  trunk.scale.set(.65,.37,.4);
  box(root,[0,1.55,-1.48],[.66,.3,.1],'leather');
  box(root,[0,1.64,-2.2],[.83,.09,.05],'red');
  return { root:root,
    update:function(distance,steer){
      front.spin.rotation.x+=distance/front.r; rear.spin.rotation.x+=distance/rear.r;
      front.pivot.rotation.y=steer; bars.rotation.y=steer*.65; } };
}

/* Dune buggy — new parametric builder in the recovered builder style.
 * P: paint, accent, seat, wheel (radius scale), ride (ride-height scale),
 *    cage (bool), spoiler (bool). */
function buildBuggy(T,P){
  var mats=makeMats(T,P), H=builderHelpers(T,mats),
      mesh=H.mesh, rod=H.rod, box=H.box;
  var root=new T.Group(); root.name='PULSE_DUNE_BUGGY';
  var wr=.52*P.wheel, ww=.42*P.wheel, ride=P.ride,
      fz=1.15, rz=-1.05, tx=.85;
  var wheels=[
    H.wheel(root, fz, wr, ww), H.wheel(root, rz, wr*1.08, ww*1.15)
  ];
  wheels[0].pivot.position.x=-tx; wheels[1].pivot.position.x=-tx;
  var w3=H.wheel(root, fz, wr, ww); w3.pivot.position.x=tx;
  var w4=H.wheel(root, rz, wr*1.08, ww*1.15); w4.pivot.position.x=tx;
  wheels.push(w3,w4);
  var y0=.55*ride;
  /* chassis rails + bumpers */
  for(var s=-1;s<=1;s+=2){
    rod(root,[s*tx,y0,-1.35],[s*tx,y0,1.45],.07,'black');
    rod(root,[s*tx,y0+.05,1.45],[s*tx,y0+.28,1.72],.06);
    rod(root,[s*tx,y0+.05,-1.35],[s*tx,y0+.3,-1.6],.06); }
  rod(root,[-tx,y0+.28,1.72],[tx,y0+.28,1.72],.06);
  rod(root,[-tx,y0+.3,-1.6],[tx,y0+.3,-1.6],.06);
  box(root,[0,y0-.08,.1],[1.5,.1,2.6],'black');           /* floor pan */
  /* nose + side pods */
  var nose=mesh(root,new T.SphereGeometry(1,20,14),'paint',[0,y0+.28,1.28]);
  nose.scale.set(.62,.34,.62);
  for(var s2=-1;s2<=1;s2+=2){
    var pod=mesh(root,new T.SphereGeometry(1,18,12),'paint',[s2*.72,y0+.22,-.1]);
    pod.scale.set(.3,.32,.95);
    var stripe=mesh(root,new T.SphereGeometry(1,18,12),'gold',[s2*.72,y0+.42,-.1]);
    stripe.scale.set(.1,.1,.9); }
  /* roll cage */
  if(P.cage){
    for(var s3=-1;s3<=1;s3+=2){
      rod(root,[s3*.62,y0+.1,.75],[s3*.62,y0+1.35,.35],.05);
      rod(root,[s3*.62,y0+1.35,.35],[s3*.62,y0+1.35,-.75],.05);
      rod(root,[s3*.62,y0+1.35,-.75],[s3*.62,y0+.15,-.85],.05); }
    rod(root,[-.62,y0+1.35,.35],[.62,y0+1.35,.35],.05);
    rod(root,[-.62,y0+1.35,-.75],[.62,y0+1.35,-.75],.05); }
  /* seats */
  for(var s4=-1;s4<=1;s4+=2){
    box(root,[s4*.34,y0+.18,-.35],[.5,.14,.55],'leather');
    var back=box(root,[s4*.34,y0+.5,-.62],[.5,.62,.14],'leather');
    back.rotation.x=-.18;
    box(root,[s4*.34,y0+.62,-.56],[.52,.1,.05],'gold'); }
  /* engine + exhaust */
  box(root,[0,y0+.32,-1.05],[.72,.42,.5],'chrome');
  for(var e=0;e<5;e++) box(root,[0,y0+.14+e*.07,-1.05],[.78,.03,.54],e%2?'black':'chrome');
  for(var s5=-1;s5<=1;s5+=2){
    rod(root,[s5*.3,y0+.3,-1.28],[s5*.42,y0+.22,-1.75],.055);
    rod(root,[s5*.42,y0+.22,-1.75],[s5*.5,y0+.3,-2.05],.07); }
  /* headlights */
  for(var s6=-1;s6<=1;s6+=2){
    var cup=mesh(root,new T.CylinderGeometry(.14,.16,.18,18),'chrome',[s6*.34,y0+.42,1.62]);
    cup.rotation.x=Math.PI/2;
    var gl=mesh(root,new T.CylinderGeometry(.12,.12,.03,18),'light',[s6*.34,y0+.42,1.72]);
    gl.rotation.x=Math.PI/2; }
  /* whip antenna + flag */
  rod(root,[.5,y0+.2,-1.5],[.62,y0+2.1,-1.62],.015,'black');
  box(root,[.63,y0+2.0,-1.63],[.16,.12,.02],'red');
  /* spoiler */
  if(P.spoiler){
    for(var s7=-1;s7<=1;s7+=2) rod(root,[s7*.4,y0+.5,-1.55],[s7*.4,y0+1.05,-1.7],.04);
    var wing=box(root,[0,y0+1.08,-1.72],[1.3,.06,.34],'paint');
    wing.rotation.x=.18;
    box(root,[0,y0+1.12,-1.72],[1.32,.02,.06],'gold'); }
  /* steering column + wheel */
  rod(root,[0,y0+.3,.75],[0,y0+.75,.45],.035,'black');
  var sw=mesh(root,new T.TorusGeometry(.19,.03,8,24),'black',[0,y0+.82,.4]);
  sw.rotation.x=-.5;
  return { root:root,
    update:function(distance,steer){
      for(var i=0;i<4;i++){ var w=wheels[i];
        w.spin.rotation.x+=distance/w.r;
        if(i===0||i===2) w.pivot.rotation.y=steer; } } };
}

/* ---------------- drive physics: verbatim buggy-motion.mjs ---------------- */
function createVehicle(x,z,yaw){ x=(x==null?210:x); z=(z==null?0:z); yaw=(yaw==null?Math.PI/2:yaw);
  return {x:x,z:z,yaw:yaw,vx:0,vz:0,steer:0,speed:0,hit:false}; }
function stepVehicle(s,input,dt,tune,blocked){
  blocked=blocked||function(){return false;};
  var power=tune.power||1;
  var forward={x:Math.sin(s.yaw),z:Math.cos(s.yaw)},
      right={x:Math.cos(s.yaw),z:-Math.sin(s.yaw)};
  var v=s.vx*forward.x+s.vz*forward.z, lateral=s.vx*right.x+s.vz*right.z;
  var target=input.turn*tune.steering/(1+Math.abs(v)*.035);
  s.steer+=(target-s.steer)*(1-Math.exp(-9*dt));
  var acceleration=0;
  if(input.throttle>0) acceleration=(v<-.3?16:8.5)*power;
  if(input.throttle<0) acceleration=(v>.3?-18:-4.5)*power;
  v+=acceleration*dt;
  var drag=(input.handbrake?9:.45)*power+.006*v*v/power;
  v=Math.sign(v)*Math.max(0,Math.abs(v)-drag*dt);
  v=Math.max(-7*power,Math.min(tune.maxSpeed,v));
  lateral*=Math.exp(-(input.handbrake?1.25:tune.grip)*dt);
  var yawDelta=v/(tune.wheelbase||2.52)*Math.tan(s.steer)*dt;
  var yaw=s.yaw+yawDelta;
  lateral-=v*Math.sin(yawDelta);
  var vx=Math.sin(yaw)*v+Math.cos(yaw)*lateral,
      vz=Math.cos(yaw)*v-Math.sin(yaw)*lateral;
  var x=s.x+vx*dt, z=s.z+vz*dt;
  s.hit=blocked(x,z,yaw);
  if(!s.hit){ s.x=x; s.z=z; s.yaw=yaw; s.vx=vx; s.vz=vz; }
  else { s.vx*=.15; s.vz*=.15; }
  s.speed=s.vx*Math.sin(s.yaw)+s.vz*Math.cos(s.yaw);
  return s;
}

/* ---------------- minimal WebGL renderer ---------------- */
function m4mul(a,b){ var o=new Float32Array(16);
  for(var c=0;c<4;c++) for(var r=0;r<4;r++){ var s=0;
    for(var k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
  return o; }
function m4compose(pos,quat,scale){
  var x=quat.x,y=quat.y,z=quat.z,w=quat.w,
      x2=x+x,y2=y+y,z2=z+z,
      xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2,
      sx=scale.x,sy=scale.y,sz=scale.z;
  return new Float32Array([
    (1-(yy+zz))*sx,(xy+wz)*sx,(xz-wy)*sx,0,
    (xy-wz)*sy,(1-(xx+zz))*sy,(yz+wx)*sy,0,
    (xz+wy)*sz,(yz-wx)*sz,(1-(xx+yy))*sz,0,
    pos.x,pos.y,pos.z,1]); }
function m4persp(fov,aspect,near,far){ var f=1/Math.tan(fov/2),nf=1/(near-far);
  return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]); }
function v3sub(a,b){ return new V3(a.x-b.x,a.y-b.y,a.z-b.z); }
function v3cross(a,b){ return new V3(a.y*b.z-a.z*b.y, a.z*b.x-a.x*b.z, a.x*b.y-a.y*b.x); }
function v3dot(a,b){ return a.x*b.x+a.y*b.y+a.z*b.z; }
function m4look(eye,center,up){
  var z=v3sub(eye,center).normalize(), x=v3cross(up,z).normalize(), y=v3cross(z,x);
  return new Float32Array([x.x,y.x,z.x,0, x.y,y.y,z.y,0, x.z,y.z,z.z,0,
    -v3dot(x,eye),-v3dot(y,eye),-v3dot(z,eye),1]); }

var geoCache={}, geoSeq=0;
function geoBuffers(gl,geo){
  if(!geo._cid) geo._cid=++geoSeq;
  var hit=geoCache[geo._cid];
  if(hit) return hit;
  var b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
  var data=new Float32Array(geo.p.length+geo.n.length);
  for(var i=0;i<geo.p.length;i++) data[i]=geo.p[i];
  for(var j=0;j<geo.n.length;j++) data[geo.p.length+j]=geo.n[j];
  gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  var rec={buf:b,count:geo.p.length/3,half:geo.p.length};
  geoCache[geo._cid]=rec; return rec;
}

function Renderer(canvas){
  var gl=canvas.getContext('webgl',{antialias:true});
  if(!gl) return null;
  var VS='attribute vec3 aP;attribute vec3 aN;uniform mat4 uM;uniform mat4 uV;'+
    'varying vec3 vN;varying vec3 vW;void main(){vec4 w=uM*vec4(aP,1.0);'+
    'vW=w.xyz;vN=mat3(uM)*aN;gl_Position=uV*w;}';
  var FS='precision mediump float;varying vec3 vN;varying vec3 vW;'+
    'uniform vec3 uC;uniform vec3 uE;uniform float uO;uniform vec3 uL;'+
    'uniform vec3 uCam;uniform float uUnlit;'+
    'void main(){vec3 col;'+
    'if(uUnlit>0.5){col=uC;}else{'+
    'vec3 n=normalize(vN);vec3 l=normalize(uL);'+
    'float d=max(dot(n,l),0.0);'+
    'vec3 v=normalize(uCam-vW);vec3 h=normalize(l+v);'+
    'float s=pow(max(dot(n,h),0.0),28.0)*0.4;'+
    'col=uC*(0.30+0.85*d)+vec3(s)+uE;}'+
    'gl_FragColor=vec4(col,uO);}';
  function sh(t,src){ var s=gl.createShader(t); gl.shaderSource(s,src);
    gl.compileShader(s); return s; }
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))
    throw new Error('vehicle renderer: shader link failed: '+gl.getProgramInfoLog(pr));
  var A={ p:gl.getAttribLocation(pr,'aP'), n:gl.getAttribLocation(pr,'aN') };
  var U={ M:gl.getUniformLocation(pr,'uM'), V:gl.getUniformLocation(pr,'uV'),
    C:gl.getUniformLocation(pr,'uC'), E:gl.getUniformLocation(pr,'uE'),
    O:gl.getUniformLocation(pr,'uO'), L:gl.getUniformLocation(pr,'uL'),
    Cam:gl.getUniformLocation(pr,'uCam'), Unlit:gl.getUniformLocation(pr,'uUnlit') };
  gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
  gl.clearColor(0.027,0.043,0.07,1);
  var lightDir=[0.5,0.8,0.35];
  function nodeLocal(node){
    var q=node.quaternion._set?node.quaternion:quatFromEuler(node.rotation.x,node.rotation.y,node.rotation.z);
    return m4compose(node.position,q,node.scale);
  }
  function drawNode(node,parentM,vp,cam,pass){
    var M=m4mul(parentM,nodeLocal(node));
    if(node.geometry){
      var mat=node.material, isT=mat.transparent||mat.opacity<1;
      if((pass===1)===isT) { /* wrong pass for this mesh: opaque in 1, transparent in 2 */ }
      else {
        var gb=geoBuffers(gl,node.geometry);
        gl.bindBuffer(gl.ARRAY_BUFFER,gb.buf);
        gl.enableVertexAttribArray(A.p); gl.enableVertexAttribArray(A.n);
        gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,0,0);
        gl.vertexAttribPointer(A.n,3,gl.FLOAT,false,0,gb.half*4);
        gl.uniformMatrix4fv(U.M,false,M);
        gl.uniform3fv(U.C,mat.color);
        gl.uniform3f(U.E,mat.emissive[0]*mat.emissiveIntensity,
                          mat.emissive[1]*mat.emissiveIntensity,
                          mat.emissive[2]*mat.emissiveIntensity);
        gl.uniform1f(U.O,mat.opacity);
        gl.uniform3fv(U.L,lightDir); gl.uniform3f(U.Cam,cam.x,cam.y,cam.z);
        gl.uniform1f(U.Unlit,0);
        if(isT){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false); }
        gl.drawArrays(gl.TRIANGLES,0,gb.count);
        if(isT){ gl.disable(gl.BLEND); gl.depthMask(true); } } }
    for(var i=0;i<node.children.length;i++) drawNode(node.children[i],M,vp,cam,pass);
  }
  var gridBuf=null;
  function grid(){
    if(gridBuf) return gridBuf;
    var pts=[];
    for(var i=-30;i<=30;i+=2){ pts.push(i,0,-30, i,0,30, -30,0,i, 30,0,i); }
    gridBuf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(pts),gl.STATIC_DRAW);
    gridBuf.count=pts.length/3; return gridBuf;
  }
  var identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  this.render=function(root,vp,cam,ground){
    /* NOTE: canvas.width/height are set once at mount (before context creation).
     * Changing them later silently kills drawing on some GL implementations,
     * so the backing store is never resized here — only the viewport. */
    gl.useProgram(pr);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.clearColor(0.027,0.043,0.07,1);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniformMatrix4fv(U.V,false,vp);   /* view-projection: constant for the frame */
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    if(ground) drawNode(ground,identity,vp,cam,1);
    drawNode(root,identity,vp,cam,1);   /* opaque */
    drawNode(root,identity,vp,cam,2);   /* transparent */
    /* grid lines */
    var g=grid();
    gl.bindBuffer(gl.ARRAY_BUFFER,g);
    gl.enableVertexAttribArray(A.p); gl.disableVertexAttribArray(A.n);
    gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,0,0);
    gl.uniformMatrix4fv(U.M,false,identity);
    gl.uniform3f(U.C,0.11,0.14,0.19); gl.uniform1f(U.Unlit,1); gl.uniform1f(U.O,1);
    gl.drawArrays(gl.LINES,0,g.count);
    gl.uniform1f(U.Unlit,0);
  };
  this.gl=gl;
}

/* ---------------- panel UI ---------------- */
var PAINTS=['#782737','#1f3a5f','#2e5d3a','#b3541e','#d8d3c8','#23262b','#5b2a6e','#0f6b6b'];
var DEFAULTS={type:'chopper',seed:'sundown-1',paint:'#782737',accent:'#e3bc6c',
  seat:'#412e24',wheel:1,tank:1,bars:1,ride:1,cage:true,spoiler:true};

function paramsFromSeed(seed){
  var rng=mulberry32(hashSeed('vehicles:'+seed));
  return { paint:PAINTS[Math.floor(rng()*PAINTS.length)],
    wheel:0.9+rng()*0.35, tank:0.85+rng()*0.4, bars:0.9+rng()*0.25,
    ride:0.9+rng()*0.25, cage:rng()>0.3, spoiler:rng()>0.4 };
}

TOOLS.vehicles={
  mount:function(host){
    host.innerHTML=
      '<style>.veh-stage{position:relative;width:100%;height:520px;border-radius:12px;overflow:hidden;'+
      'background:#070b12;border:1px solid var(--line)}'+
      '.veh-stage canvas{width:100%;height:100%;display:block;touch-action:none}'+
      '.veh-hint{position:absolute;left:12px;bottom:10px;font-size:.78rem;color:var(--muted);'+
      'background:rgba(7,11,18,.72);padding:6px 10px;border-radius:8px;pointer-events:none}'+
      '.veh-touch{position:absolute;right:12px;bottom:10px;display:none;gap:8px}'+
      '.veh-touch.on{display:flex}'+
      '.veh-touch button{width:58px;height:58px;border-radius:50%;border:1px solid var(--line);'+
      'background:rgba(11,21,35,.85);color:var(--text);font-size:1.15rem}'+
      '.veh-type{display:flex;gap:8px}'+
      '.veh-type .btn.on{border-color:var(--cyan);color:var(--cyan)}'+
      '.veh-err{padding:24px;color:var(--muted)}</style>'+
      '<div class="t-controls">'+
        '<div class="veh-type">'+
          '<button class="btn" data-vt="chopper">Chopper</button>'+
          '<button class="btn" data-vt="touring">Touring bike</button>'+
          '<button class="btn" data-vt="buggy">Dune buggy</button>'+
        '</div>'+
        '<label>Seed <input type="text" id="veh-seed" value="sundown-1" style="width:130px"></label>'+
        '<button class="btn" id="veh-random">Roll random</button>'+
        '<button class="btn primary" id="veh-drive">Test ride</button>'+
        '<button class="btn" id="veh-copy">Copy recipe</button>'+
      '</div>'+
      '<div class="t-controls">'+
        '<label>Paint <input type="color" id="veh-paint" value="#782737"></label>'+
        '<label>Wheel size <input type="range" id="veh-wheel" min="0.8" max="1.3" step="0.01" value="1"></label>'+
        '<label>Tank / body <input type="range" id="veh-tank" min="0.8" max="1.3" step="0.01" value="1"></label>'+
        '<label>Bars height <input type="range" id="veh-bars" min="0.85" max="1.2" step="0.01" value="1"></label>'+
        '<label data-buggy>Ride height <input type="range" id="veh-ride" min="0.85" max="1.25" step="0.01" value="1"></label>'+
        '<label data-buggy><input type="checkbox" id="veh-cage" checked> Cage</label>'+
        '<label data-buggy><input type="checkbox" id="veh-spoiler" checked> Spoiler</label>'+
      '</div>'+
      '<div class="veh-stage"><canvas id="veh-canvas"></canvas>'+
        '<div class="veh-hint" id="veh-hint">Drag to orbit · scroll to zoom</div>'+
        '<div class="veh-touch" id="veh-touch">'+
          '<button data-k="left">&#9664;</button><button data-k="right">&#9654;</button>'+
          '<button data-k="gas">GAS</button><button data-k="brk">BRK</button>'+
        '</div>'+
      '</div>'+
      '<p class="meta" style="margin-top:10px">Bodies adapted from the recovered '+
      '<b>chopper-model.mjs</b> / <b>touring-motorcycle.mjs</b> builders (defaults reproduce them exactly); '+
      'the buggy is new, in the same style. Test ride runs the verbatim '+
      '<b>buggy-motion.mjs</b> physics. No THREE.js here — one small WebGL renderer, no shadows or textures.</p>';

    var canvas=host.querySelector('#veh-canvas');
    /* size the backing store once, BEFORE the GL context is created */
    var dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.max(2,Math.round((canvas.clientWidth||640)*dpr));
    canvas.height=Math.max(2,Math.round((canvas.clientHeight||520)*dpr));
    var renderer=new Renderer(canvas);
    if(!renderer||typeof renderer.render!=='function'){ host.querySelector('.veh-stage').innerHTML=
      '<div class="veh-err">WebGL is not available in this browser, so the 3D preview cannot start.</div>';
      return; }

    var P=JSON.parse(JSON.stringify(DEFAULTS));
    var state={build:null,drive:false,car:null,input:{turn:0,throttle:0,handbrake:false},
      tune:{power:1.1,steering:0.6,grip:5.5,maxSpeed:24,wheelbase:2.2},
      cam:{yaw:0.7,pitch:0.34,dist:8,target:new V3(0,1.1,0)},
      chase:new V3(0,3.5,-8),raf:0,last:0,keys:{},clean:[]};

    /* ground: dark disc + the renderer's grid */
    var ground=new Group();
    var gp=new Mesh(planeGeo(90,90),
      new MeshStandardMaterial({color:'#0a0e15',roughness:1}));
    ground.add(gp);

    function currentBuilder(){
      return P.type==='touring'?buildTouring:(P.type==='buggy'?buildBuggy:buildChopper);
    }
    function rebuild(){
      state.build=currentBuilder()(TL,P);
      if(state.drive) resetDrive();
    }
    function resetDrive(){
      state.car=createVehicle(0,0,0);
      state.build.root.position.set(0,0,0);
      state.build.root.rotation.y=0;
      state.chase.set(0,3.5,-8);
    }
    function setType(t){
      P.type=t;
      var btns=host.querySelectorAll('[data-vt]');
      for(var i=0;i<btns.length;i++)
        btns[i].className='btn'+(btns[i].getAttribute('data-vt')===t?' on':'');
      var buggy=(t==='buggy');
      var extra=host.querySelectorAll('[data-buggy]');
      for(var j=0;j<extra.length;j++) extra[j].style.display=buggy?'':'none';
      rebuild();
    }
    function applySeed(){
      var add=paramsFromSeed(P.seed);
      for(var k in add) P[k]=add[k];
      host.querySelector('#veh-paint').value=P.paint;
      host.querySelector('#veh-wheel').value=P.wheel;
      host.querySelector('#veh-tank').value=P.tank;
      host.querySelector('#veh-bars').value=P.bars;
      host.querySelector('#veh-ride').value=P.ride;
      host.querySelector('#veh-cage').checked=P.cage;
      host.querySelector('#veh-spoiler').checked=P.spoiler;
      rebuild();
    }

    /* --- controls --- */
    function on(el,ev,fn,opts){ el.addEventListener(ev,fn,opts||false);
      state.clean.push(function(){ el.removeEventListener(ev,fn,opts||false); }); }
    var btns=host.querySelectorAll('[data-vt]');
    for(var bi=0;bi<btns.length;bi++)
      (function(b){ on(b,'click',function(){ setType(b.getAttribute('data-vt')); }); })(btns[bi]);
    on(host.querySelector('#veh-random'),'click',function(){
      var arr=new Uint32Array(1);
      if(window.crypto&&crypto.getRandomValues) crypto.getRandomValues(arr);
      else arr[0]=(Date.now()%1000000);
      P.seed='v'+arr[0].toString(36);
      host.querySelector('#veh-seed').value=P.seed;
      applySeed();
    });
    on(host.querySelector('#veh-seed'),'change',function(e){
      P.seed=e.target.value||'v1'; applySeed();
    });
    on(host.querySelector('#veh-paint'),'input',function(e){ P.paint=e.target.value; rebuild(); });
    on(host.querySelector('#veh-wheel'),'input',function(e){ P.wheel=+e.target.value; rebuild(); });
    on(host.querySelector('#veh-tank'),'input',function(e){ P.tank=+e.target.value; rebuild(); });
    on(host.querySelector('#veh-bars'),'input',function(e){ P.bars=+e.target.value; rebuild(); });
    on(host.querySelector('#veh-ride'),'input',function(e){ P.ride=+e.target.value; rebuild(); });
    on(host.querySelector('#veh-cage'),'change',function(e){ P.cage=e.target.checked; rebuild(); });
    on(host.querySelector('#veh-spoiler'),'change',function(e){ P.spoiler=e.target.checked; rebuild(); });
    var driveBtn=host.querySelector('#veh-drive');
    on(driveBtn,'click',function(){
      state.drive=!state.drive;
      driveBtn.textContent=state.drive?'Back to builder':'Test ride';
      driveBtn.className='btn'+(state.drive?'':' primary');
      host.querySelector('#veh-touch').className='veh-touch'+(state.drive?' on':'');
      host.querySelector('#veh-hint').textContent=state.drive?
        'Arrows / WASD or the buttons: steer, GAS, BRK (space = handbrake)':
        'Drag to orbit · scroll to zoom';
      if(state.drive) resetDrive();
    });
    on(host.querySelector('#veh-copy'),'click',function(){
      var recipe=JSON.stringify({tool:'vehicles',type:P.type,seed:P.seed,
        params:{paint:P.paint,accent:P.accent,seat:P.seat,wheel:+P.wheel.toFixed(3),
        tank:+P.tank.toFixed(3),bars:+P.bars.toFixed(3),ride:+P.ride.toFixed(3),
        cage:P.cage,spoiler:P.spoiler}},null,2);
      function done(ok){ driveBtn.blur();
        host.querySelector('#veh-copy').textContent=ok?'Copied':'Copy failed';
        setTimeout(function(){ host.querySelector('#veh-copy').textContent='Copy recipe'; },1400); }
      if(navigator.clipboard&&navigator.clipboard.writeText)
        navigator.clipboard.writeText(recipe).then(function(){done(true);},function(){done(false);});
      else done(false);
    });

    /* --- orbit --- */
    var dragging=false,lx=0,ly=0;
    on(canvas,'pointerdown',function(e){ dragging=true; lx=e.clientX; ly=e.clientY;
      canvas.setPointerCapture(e.pointerId); });
    on(canvas,'pointerup',function(){ dragging=false; });
    on(canvas,'pointercancel',function(){ dragging=false; });
    on(canvas,'pointermove',function(e){
      if(!dragging||state.drive) return;
      state.cam.yaw-=(e.clientX-lx)*0.008; state.cam.pitch+=(e.clientY-ly)*0.006;
      state.cam.pitch=Math.max(0.05,Math.min(1.3,state.cam.pitch));
      lx=e.clientX; ly=e.clientY; });
    on(canvas,'wheel',function(e){ e.preventDefault();
      state.cam.dist*=Math.pow(1.0015,e.deltaY);
      state.cam.dist=Math.max(3.5,Math.min(24,state.cam.dist)); },{passive:false});

    /* --- drive input: keyboard --- */
    function key(e,down){
      var k=e.key;
      if(k==='ArrowLeft'||k==='a'||k==='A'){ state.keys.left=down; e.preventDefault(); }
      else if(k==='ArrowRight'||k==='d'||k==='D'){ state.keys.right=down; e.preventDefault(); }
      else if(k==='ArrowUp'||k==='w'||k==='W'){ state.keys.gas=down; e.preventDefault(); }
      else if(k==='ArrowDown'||k==='s'||k==='S'){ state.keys.brk=down; e.preventDefault(); }
      else if(k===' '){ state.keys.hb=down; e.preventDefault(); }
    }
    on(window,'keydown',function(e){ key(e,true); });
    on(window,'keyup',function(e){ key(e,false); });
    /* --- drive input: touch buttons --- */
    var touch=host.querySelectorAll('#veh-touch button');
    for(var ti=0;ti<touch.length;ti++)
      (function(b){ var k=b.getAttribute('data-k');
        function dn(e){ e.preventDefault(); state.keys[k]=true; }
        function up(e){ e.preventDefault(); state.keys[k]=false; }
        b.addEventListener('pointerdown',dn); b.addEventListener('pointerup',up);
        b.addEventListener('pointercancel',up); b.addEventListener('pointerleave',up);
        state.clean.push(function(){
          b.removeEventListener('pointerdown',dn); b.removeEventListener('pointerup',up);
          b.removeEventListener('pointercancel',up); b.removeEventListener('pointerleave',up); });
      })(touch[ti]);

    /* --- frame loop --- */
    function frame(t){
      state.raf=requestAnimationFrame(frame);
      var dt=Math.min(0.05,(t-state.last)/1000||0.016); state.last=t;
      var cam=state.cam, eye, look;
      if(state.drive&&state.car){
        var inp=state.input;
        inp.turn=(state.keys.left?-1:0)+(state.keys.right?1:0);
        inp.throttle=(state.keys.gas?1:0)+(state.keys.brk?-0.7:0);
        inp.handbrake=!!state.keys.hb;
        stepVehicle(state.car,inp,dt,state.tune);
        var dist=state.car.speed*dt;
        state.build.update(dist,state.car.steer);
        state.build.root.position.set(state.car.x,0,state.car.z);
        state.build.root.rotation.y=state.car.yaw;
        var fx=Math.sin(state.car.yaw), fz=Math.cos(state.car.yaw);
        var want=new V3(state.car.x-fx*7.5,3.4,state.car.z-fz*7.5);
        state.chase.x+=(want.x-state.chase.x)*Math.min(1,dt*4);
        state.chase.y+=(want.y-state.chase.y)*Math.min(1,dt*4);
        state.chase.z+=(want.z-state.chase.z)*Math.min(1,dt*4);
        eye=state.chase; look=new V3(state.car.x,1.3,state.car.z);
      } else {
        state.build.update(0,0);
        state.build.root.rotation.y+=dt*0.35;
        eye=new V3(cam.target.x+cam.dist*Math.cos(cam.pitch)*Math.sin(cam.yaw),
                   cam.target.y+cam.dist*Math.sin(cam.pitch),
                   cam.target.z+cam.dist*Math.cos(cam.pitch)*Math.cos(cam.yaw));
        look=cam.target;
      }
      var vp=m4mul(m4persp(0.785,canvas.clientWidth/Math.max(1,canvas.clientHeight),0.1,300),
                   m4look(eye,look,new V3(0,1,0)));
      var scene=new Group(); scene.add(state.build.root);
      renderer.render(scene,vp,eye,ground);
    }

    setType('chopper');
    state.last=performance.now();
    state.raf=requestAnimationFrame(frame);
    this._state=state;
  },
  unmount:function(){
    var s=this._state;
    if(s){ cancelAnimationFrame(s.raf);
      for(var i=0;i<s.clean.length;i++) try{ s.clean[i](); }catch(e){} }
  }
};

})();


window.WONDER_PREVIEW_TOOL="vehicles";
