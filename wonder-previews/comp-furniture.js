
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


/* Furniture Foundry — procedural furniture & common items, high quality.
 * TAGS: tool:furniture | cat:generators | dep:webgl dep:seed-rng dep:localstorage |
 *   prov:procedural-furniture prov:parametric-items prov:seeded-item-recipes |
 *   see:vehicle-builder see:mesh-builder see:palettes |
 *   src:components/furniture-design.md
 *
 * Seventeen parametric builders (chairs, tables, seating, storage, lighting,
 * lathe-turned props) on a seeded RNG. Real-world dimensions in meters, real
 * joinery (aprons, stretchers, slats), rounded-box + lathe geometry, procedural
 * wood grain and fabric weave in the fragment shader, studio lighting.
 * No Math.random anywhere. No THREE.js — minimal geometry/material shim plus
 * one small WebGL renderer, following the vehicle builder's proven pattern.
 *
 * Every item is a pure function of (seed, type, style): same recipe, same item.
 */
(function(){
'use strict';

/* ---------------- seeded RNG (from seed-rng, verbatim pattern) ---------------- */
function hashSeed(s){ var h=2166136261>>>0; s=String(s);
  for(var i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); }
  return h>>>0; }
function mulberry32(a){ return function(){ a|=0; a=(a+0x6D2B79F5)|0;
  var t=Math.imul(a^(a>>>15),1|a); t=(t+Math.imul(t^(t>>>7),61|t))^t;
  return ((t^(t>>>14))>>>0)/4294967296; }; }
function RNG(seed){ var r=mulberry32(hashSeed(seed));
  return {
    f:function(a,b){ return a+(b-a)*r(); },
    i:function(a,b){ return a+Math.floor(r()*(b-a+1)); },
    pick:function(arr){ return arr[Math.floor(r()*arr.length)]; },
    chance:function(p){ return r()<p; },
    sign:function(){ return r()<0.5?-1:1; }
  }; }

/* ---------------- THREE-lite shim (from vehicle builder) ---------------- */
var TAU=Math.PI*2;
function V3(x,y,z){ this.x=x||0; this.y=y||0; this.z=z||0; }
V3.prototype.set=function(x,y,z){ this.x=x; this.y=y; this.z=z; return this; };
V3.prototype.clone=function(){ return new V3(this.x,this.y,this.z); };
V3.prototype.normalize=function(){ var l=Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)||1;
  this.x/=l; this.y/=l; this.z/=l; return this; };
function Quat(){ this.x=0; this.y=0; this.z=0; this.w=1; this._set=false; }
function Node3(){ this.children=[]; this.position=new V3();
  this.rotation={x:0,y:0,z:0}; this.scale=new V3(1,1,1); this.quaternion=new Quat(); }
Node3.prototype.add=function(c){ this.children.push(c); return this; };
function Group(){ Node3.call(this); this.name=''; }
Group.prototype=Object.create(Node3.prototype);
function Mesh(geo,mat){ Node3.call(this); this.geometry=geo; this.material=mat; }
Mesh.prototype=Object.create(Node3.prototype);

function newGeo(){ return {p:[],n:[]}; }
function tri(G,a,b,c,na,nb,nc){
  G.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);
  G.n.push(na[0],na[1],na[2],nb[0],nb[1],nb[2],nc[0],nc[1],nc[2]); }
function boxGeo(w,h,d){ var G=newGeo(),x=w/2,y=h/2,z=d/2;
  function face(c,n){ var a=[c[0][0],c[0][1],c[0][2]],b=[c[1][0],c[1][1],c[1][2]],
    d2=[c[2][0],c[2][1],c[2][2]],e=[c[3][0],c[3][1],c[3][2]];
    tri(G,a,b,d2,n,n,n); tri(G,a,d2,e,n,n,n); }
  face([[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z]],[0,0,-1]);
  face([[x,-y,z],[-x,-y,z],[-x,y,z],[x,y,z]],[0,0,1]);
  face([[-x,-y,z],[-x,-y,-z],[-x,y,-z],[-x,y,z]],[-1,0,0]);
  face([[x,-y,-z],[x,-y,z],[x,y,z],[x,y,-z]],[1,0,0]);
  face([[-x,y,-z],[x,y,-z],[x,y,z],[-x,y,z]],[0,1,0]);
  face([[-x,-y,z],[x,-y,z],[x,-y,-z],[-x,-y,-z]],[0,-1,0]);
  return G; }

/* Rounded box: subdivided faces projected onto a true rounded solid.
 * The single biggest "doesn't look cheap" lever in the whole file. */
function rboxGeo(w,h,d,r,seg){
  seg=seg||3;
  var hw=w/2,hh=h/2,hd=d/2;
  r=Math.min(r||Math.min(w,h,d)*0.22,hw,hh,hd);
  var ix=hw-r, iy=hh-r, iz=hd-r, G=newGeo();
  function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
  function surf(px,py,pz){
    var qx=clamp(px,-ix,ix), qy=clamp(py,-iy,iy), qz=clamp(pz,-iz,iz);
    var nx=px-qx, ny=py-qy, nz=pz-qz, l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
    nx/=l; ny/=l; nz/=l;
    return [[qx+nx*r, qy+ny*r, qz+nz*r],[nx,ny,nz]]; }
  function gridFace(fixed,axis,sign){
    var base=[], idx=[], e=[hw,hh,hd];
    for(var i=0;i<=seg;i++) for(var j=0;j<=seg;j++){
      var u=i/seg*2-1, v=j/seg*2-1, p=[0,0,0];
      p[axis]=sign*fixed;
      p[(axis+1)%3]=u*e[(axis+1)%3]; p[(axis+2)%3]=v*e[(axis+2)%3];
      var s=surf(p[0],p[1],p[2]);
      base.push(s); idx.push(base.length-1); }
    for(var a=0;a<seg;a++) for(var b=0;b<seg;b++){
      var r0=idx[a*(seg+1)+b], r1=idx[(a+1)*(seg+1)+b],
          r2=idx[(a+1)*(seg+1)+b+1], r3=idx[a*(seg+1)+b+1];
      var A=base[r0],B=base[r1],C=base[r2],D=base[r3];
      if(sign>0){ tri(G,A[0],B[0],C[0],A[1],B[1],C[1]); tri(G,A[0],C[0],D[0],A[1],C[1],D[1]); }
      else { tri(G,A[0],C[0],B[0],A[1],C[1],B[1]); tri(G,A[0],D[0],C[0],A[1],D[1],C[1]); } } }
  gridFace(hw,0,1); gridFace(hw,0,-1);
  gridFace(hh,1,1); gridFace(hh,1,-1);
  gridFace(hd,2,1); gridFace(hd,2,-1);
  return G; }

/* Lathe: surface of revolution. Turned legs, vases, lamp bases, bowls, mugs. */
function latheGeo(profile,segs){
  segs=segs||28; var G=newGeo(), i, j;
  var rings=[];
  for(i=0;i<profile.length;i++){
    var pr=profile[i][0], py=profile[i][1], ring=[];
    for(j=0;j<=segs;j++){ var a=j/segs*TAU;
      ring.push([pr*Math.cos(a),py,pr*Math.sin(a)]); }
    rings.push(ring); }
  function profNormal(i){
    var a=profile[Math.max(0,i-1)], b=profile[Math.min(profile.length-1,i+1)];
    var dr=b[0]-a[0], dy=b[1]-a[1], l=Math.sqrt(dr*dr+dy*dy)||1;
    return [dy/l, -dr/l]; /* (r-comp, y-comp), outward */ }
  for(i=0;i<profile.length-1;i++){
    var n0=profNormal(i), n1=profNormal(i+1);
    for(j=0;j<segs;j++){
      var a0=j/segs*TAU, a1=(j+1)/segs*TAU;
      var ca0=Math.cos(a0),sa0=Math.sin(a0),ca1=Math.cos(a1),sa1=Math.sin(a1);
      var p00=rings[i][j],p01=rings[i][j+1],p10=rings[i+1][j],p11=rings[i+1][j+1];
      var nn00=[n0[0]*ca0,n0[1],n0[0]*sa0], nn01=[n0[0]*ca1,n0[1],n0[0]*sa1],
          nn10=[n1[0]*ca0,n1[1],n1[0]*sa0], nn11=[n1[0]*ca1,n1[1],n1[0]*sa1];
      tri(G,p00,p10,p11,nn00,nn10,nn11);
      tri(G,p00,p11,p01,nn00,nn11,nn01); } }
  /* end caps */
  function cap(ri,y,flip){
    var r0=profile[ri][0];
    if(r0<0.004) return;
    var c=[0,y,0], cn=[0,flip,0];
    for(j=0;j<segs;j++){
      var q0=rings[ri][j], q1=rings[ri][j+1];
      if(flip>0) tri(G,c,q0,q1,cn,cn,cn); else tri(G,c,q1,q0,cn,cn,cn); } }
  cap(0,profile[0][1],-1); cap(profile.length-1,profile[profile.length-1][1],1);
  return G; }

function cylGeo(rt,rb,h,rad){ rad=rad||20;
  var G=newGeo(),i;
  for(i=0;i<rad;i++){ var a0=i/rad*TAU,a1=(i+1)/rad*TAU;
    var c0=Math.cos(a0),s0=Math.sin(a0),c1=Math.cos(a1),s1=Math.sin(a1);
    var p00=[rb*c0,-h/2,rb*s0],p01=[rb*c1,-h/2,rb*s1],
        p10=[rt*c0,h/2,rt*s0],p11=[rt*c1,h/2,rt*s1];
    var n0=[c0,0,s0],n1=[c1,0,s1];
    tri(G,p00,p10,p11,n0,n0,n1); tri(G,p00,p11,p01,n0,n1,n1); }
  function cap2(y,r,ny){ var c=[0,y,0],cn=[0,ny,0];
    for(i=0;i<rad;i++){ var b0=i/rad*TAU,b1=(i+1)/rad*TAU;
      var q0=[r*Math.cos(b0),y,r*Math.sin(b0)],q1=[r*Math.cos(b1),y,r*Math.sin(b1)];
      if(ny>0) tri(G,c,q0,q1,cn,cn,cn); else tri(G,c,q1,q0,cn,cn,cn); } }
  cap2(-h/2,rb,-1); cap2(h/2,rt,1);
  return G; }
function sphGeo(r,ws,hs){ ws=ws||18; hs=hs||12; var G=newGeo(),i,j;
  for(i=0;i<hs;i++) for(j=0;j<ws;j++){
    var u0=i/hs*Math.PI,u1=(i+1)/hs*Math.PI,v0=j/ws*TAU,v1=(j+1)/ws*TAU;
    function pt(u,v){ return [r*Math.sin(u)*Math.cos(v),r*Math.cos(u),r*Math.sin(u)*Math.sin(v)]; }
    function nm(p){ var l=Math.sqrt(p[0]*p[0]+p[1]*p[1]+p[2]*p[2])||1; return [p[0]/l,p[1]/l,p[2]/l]; }
    var a=pt(u0,v0),b=pt(u1,v0),c=pt(u1,v1),d=pt(u0,v1);
    tri(G,a,b,c,nm(a),nm(b),nm(c)); tri(G,a,c,d,nm(a),nm(c),nm(d)); }
  return G; }
function torGeo(R,r,rs,ts,arc){ rs=rs||10; ts=ts||28; arc=(arc==null?TAU:arc);
  var G=newGeo(),i,j;
  for(i=0;i<ts;i++){
    for(j=0;j<rs;j++){
      var u0=i/ts*arc,u1=(i+1)/ts*arc,v0=j/rs*TAU,v1=(j+1)/rs*TAU;
      function pt(u,v){ var cu=Math.cos(u),su=Math.sin(u);
        return [(R+r*Math.cos(v))*cu,r*Math.sin(v),(R+r*Math.cos(v))*su]; }
      function nm(u,v){ var cv=Math.cos(v),sv=Math.sin(v);
        return [cv*Math.cos(u),sv,cv*Math.sin(u)]; }
      var a=pt(u0,v0),b=pt(u1,v0),c=pt(u1,v1),d=pt(u0,v1);
      tri(G,a,b,c,nm(u0,v0),nm(u1,v0),nm(u1,v1)); tri(G,a,c,d,nm(u0,v0),nm(u1,v1),nm(u0,v1)); } }
  return G; }

var T3lite={
  Group:Group, Mesh:Mesh,
  BoxGeometry:function(w,h,d){ return boxGeo(w,h,d); },
  RBoxGeometry:function(w,h,d,r,s){ return rboxGeo(w,h,d,r,s); },
  CylinderGeometry:function(rt,rb,h,rad){ return cylGeo(rt,rb,h,rad||20); },
  SphereGeometry:function(r,ws,hs){ return sphGeo(r,ws,hs); },
  TorusGeometry:function(R,r,rs,ts,arc){ return torGeo(R,r,rs,ts,arc); },
  LatheGeometry:function(prof,segs){ return latheGeo(prof,segs); }
};

/* ---------------- materials ---------------- */
function hexRGB(h){ h=String(h).replace('#','');
  return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]; }
function stdMat(o){ o=o||{};
  return { color:o.color||[0.8,0.8,0.8],
    emissive:o.emissive||[0,0,0], emissiveIntensity:o.emissiveIntensity||0,
    opacity:(o.opacity==null?1:o.opacity), transparent:!!o.transparent,
    wood:o.wood?1:0, woodB:o.woodB||[0,0,0], fabric:o.fabric?1:0, metal:o.metal?1:0 }; }

/* wood species: [base, grain] — the grain pair is what sells it */
var WOODS={
  oak:    {base:'#c9a06b', grain:'#9a7443', name:'White oak'},
  walnut: {base:'#6d4a2e', grain:'#472d1a', name:'Walnut'},
  cherry: {base:'#9d5c34', grain:'#743c1d', name:'Cherry'},
  ebony:  {base:'#33291f', grain:'#1c150f', name:'Ebonized'},
  ash:    {base:'#d9c49a', grain:'#b39468', name:'Ash'}
};
var FABRICS=[
  {c:'#d9d0bf',n:'Oat linen'},{c:'#e7e0d0',n:'Bouclé'},{c:'#2f5d50',n:'Emerald velvet'},
  {c:'#b45f3c',n:'Rust weave'},{c:'#d9a441',n:'Mustard'},{c:'#5a6470',n:'Slate'},
  {c:'#8a4b5c',n:'Mauve'},{c:'#3e4a5a',n:'Ink blue'}
];
var LEATHERS=[{c:'#a05a2c',n:'Cognac'},{c:'#26221e',n:'Black'},{c:'#7a4a2e',n:'Saddle'}];
var PAINTS=[
  {c:'#ece5d8',n:'Cream'},{c:'#a8b09a',n:'Sage'},{c:'#3a3d40',n:'Charcoal'},
  {c:'#7a93a8',n:'Dusty blue'},{c:'#c4b49a',n:'Sand'}
];
var CERAMICS=['#e8e2d4','#b9c4c9','#5a6e7a','#a8503c','#2e2a26','#d9c9a8'];

function makeMats(style, R){
  var woodKey=R.pick(Object.keys(WOODS));
  if(style==='scandi') woodKey=R.pick(['oak','ash']);
  if(style==='midcentury') woodKey='walnut';
  var W=WOODS[woodKey];
  var fab=R.pick(FABRICS), lea=R.pick(LEATHERS);
  var paint=R.pick(PAINTS);
  function wood(){ return stdMat({color:hexRGB(W.base),woodB:hexRGB(W.grain),wood:1}); }
  function woodDark(){ var w=WOODS[R.pick(['walnut','ebony'])];
    return stdMat({color:hexRGB(w.base),woodB:hexRGB(w.grain),wood:1}); }
  return {
    woodName:W.name, fabricName:fab.n, leatherName:lea.n,
    wood:wood(), woodDark:woodDark(),
    fabric:stdMat({color:hexRGB(fab.c),fabric:1}),
    fabric2:stdMat({color:hexRGB(R.pick(FABRICS).c),fabric:1}),
    leather:stdMat({color:hexRGB(lea.c),fabric:1}),
    paint:stdMat({color:hexRGB(paint.c)}),
    blackMetal:stdMat({color:hexRGB('#26282c'),metal:1}),
    brass:stdMat({color:hexRGB('#b08d4f'),metal:1}),
    chrome:stdMat({color:hexRGB('#c9d2d6'),metal:1}),
    ceramic:stdMat({color:hexRGB(R.pick(CERAMICS))}),
    ceramic2:stdMat({color:hexRGB(R.pick(CERAMICS))}),
    glass:stdMat({color:hexRGB('#cfd8dc'),opacity:0.35,transparent:true}),
    bulb:stdMat({color:hexRGB('#fff2ce'),emissive:hexRGB('#ffdf9c'),emissiveIntensity:1.6}),
    shade:stdMat({color:hexRGB('#f2ead8'),fabric:1,emissive:hexRGB('#ffedbe'),emissiveIntensity:0.55}),
    flame:stdMat({color:hexRGB('#ff9a3c'),emissive:hexRGB('#ff7a1a'),emissiveIntensity:2.2}),
    screen:stdMat({color:hexRGB('#8fa8bd'),emissive:hexRGB('#4a6a8a'),emissiveIntensity:0.8}),
    paper:stdMat({color:hexRGB('#f4f1e8')}),
    leaf:stdMat({color:hexRGB('#4a7a3f')}),
    leafDark:stdMat({color:hexRGB('#33592c')}),
    soil:stdMat({color:hexRGB('#2e2118')}),
    steel:stdMat({color:hexRGB('#a8adb2'),metal:1}),
    glassGreen:stdMat({color:hexRGB('#2a4a34'),opacity:0.55,transparent:true}),
    mirror:stdMat({color:hexRGB('#b8c8d0'),metal:1,opacity:0.92,transparent:true}),
    mattress:stdMat({color:hexRGB('#f0ece2'),fabric:1}),
    bookMats:null /* filled per-shelf */
  };
}

/* ---------------- minimal WebGL renderer (from vehicle builder, upgraded:
 * procedural wood grain + fabric weave in-shader, hemisphere studio light) ---- */
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
  /* V3 has no normalize; inline it */
  function nz(v){ var l=Math.sqrt(v.x*v.x+v.y*v.y+v.z*v.z)||1; v.x/=l; v.y/=l; v.z/=l; return v; }
  nz(z); nz(x); y=v3cross(z,x);
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
  geoCache[geo._cid]=rec; return rec; }

function Renderer(canvas){
  var gl=canvas.getContext('webgl',{antialias:true,alpha:true});
  if(!gl) return null;
  var VS='attribute vec3 aP;attribute vec3 aN;uniform mat4 uM;uniform mat4 uV;'+
    'varying vec3 vN;varying vec3 vW;void main(){vec4 w=uM*vec4(aP,1.0);'+
    'vW=w.xyz;vN=mat3(uM)*aN;gl_Position=uV*w;}';
  var FS='precision mediump float;varying vec3 vN;varying vec3 vW;'+
    'uniform vec3 uC;uniform vec3 uE;uniform float uO;'+
    'uniform vec3 uCam;uniform float uWood;uniform vec3 uWoodB;'+
    'uniform float uFabric;uniform float uMetal;'+
    'float hash21(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }'+
    'void main(){'+
    'vec3 n=normalize(vN);'+
    'vec3 l=normalize(vec3(0.45,0.8,0.35));'+
    'float diff=max(dot(n,l),0.0);'+
    'vec3 amb=mix(vec3(0.30,0.28,0.26),vec3(0.62,0.66,0.72),n.y*0.5+0.5);'+
    'vec3 alb=uC;'+
    'if(uWood>0.5){'+
    '  float g=vW.x*7.0+vW.y*26.0+vW.z*6.0+sin(vW.y*43.0+vW.z*11.0)*1.4;'+
    '  g=sin(g)*0.5+0.5;'+
    '  float streak=smoothstep(0.40,0.74,g);'+
    '  float pore=hash21(floor(vW.xz*170.0)+floor(vW.yy*170.0)*7.0);'+
    '  alb=mix(uC,uWoodB,clamp(streak*0.6+pore*0.10,0.0,0.75));'+
    '}'+
    'if(uFabric>0.5){'+
    '  float wv=hash21(floor(vW.xz*240.0)+floor(vW.yy*240.0)*13.0);'+
    '  alb*=0.94+0.10*wv;'+
    '}'+
    'vec3 v=normalize(uCam-vW);vec3 h=normalize(l+v);'+
    'float specPow=uFabric>0.5?10.0:36.0;'+
    'float specAmt=uMetal>0.5?0.9:(uWood>0.5?0.22:(uFabric>0.5?0.05:0.30));'+
    'float s=pow(max(dot(n,h),0.0),specPow)*specAmt;'+
    'vec3 specCol=uMetal>0.5?alb*1.6:vec3(s);'+
    'vec3 col=alb*(amb*1.05+vec3(1.0,0.96,0.90)*diff*0.95)+specCol+uE;'+
    'gl_FragColor=vec4(col,uO);}';
  function sh(t,src){ var s=gl.createShader(t); gl.shaderSource(s,src);
    gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
      throw new Error('furniture shader: '+gl.getShaderInfoLog(s));
    return s; }
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))
    throw new Error('furniture renderer: link failed: '+gl.getProgramInfoLog(pr));
  var A={ p:gl.getAttribLocation(pr,'aP'), n:gl.getAttribLocation(pr,'aN') };
  var U={ M:gl.getUniformLocation(pr,'uM'), V:gl.getUniformLocation(pr,'uV'),
    C:gl.getUniformLocation(pr,'uC'), E:gl.getUniformLocation(pr,'uE'),
    O:gl.getUniformLocation(pr,'uO'),
    Cam:gl.getUniformLocation(pr,'uCam'), Wood:gl.getUniformLocation(pr,'uWood'),
    WoodB:gl.getUniformLocation(pr,'uWoodB'), Fabric:gl.getUniformLocation(pr,'uFabric'),
    Metal:gl.getUniformLocation(pr,'uMetal') };
  gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
  gl.clearColor(0,0,0,0);
  function nodeLocal(node){
    var q=node.quaternion._set?node.quaternion:
      (function(){ var q2=new Quat(); /* euler XYZ */
        var cx=Math.cos(node.rotation.x/2),sx=Math.sin(node.rotation.x/2),
            cy=Math.cos(node.rotation.y/2),sy=Math.sin(node.rotation.y/2),
            cz=Math.cos(node.rotation.z/2),sz=Math.sin(node.rotation.z/2);
        q2.x=sx*cy*cz+cx*sy*sz; q2.y=cx*sy*cz-sx*cy*sz;
        q2.z=cx*cy*sz+sx*sy*cz; q2.w=cx*cy*cz-sx*sy*sz; return q2; })();
    return m4compose(node.position,q,node.scale); }
  var identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function drawNode(node,parentM,vp,cam,pass){
    var M=m4mul(parentM,nodeLocal(node));
    if(node.geometry){
      var mat=node.material, isT=mat.transparent||mat.opacity<1;
      if((pass===1)===isT){ /* wrong pass */ }
      else {
        var gb=geoBuffers(gl,node.geometry);
        gl.bindBuffer(gl.ARRAY_BUFFER,gb.buf);
        gl.enableVertexAttribArray(A.p); gl.enableVertexAttribArray(A.n);
        gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,0,0);
        gl.vertexAttribPointer(A.n,3,gl.FLOAT,false,0,gb.half*4);
        gl.uniformMatrix4fv(U.M,false,M);
        gl.uniformMatrix4fv(U.V,false,vp);
        gl.uniform3fv(U.C,mat.color);
        gl.uniform3f(U.E,mat.emissive[0]*mat.emissiveIntensity,
                        mat.emissive[1]*mat.emissiveIntensity,
                        mat.emissive[2]*mat.emissiveIntensity);
        gl.uniform1f(U.O,mat.opacity);
        gl.uniform3f(U.Cam,cam.x,cam.y,cam.z);
        gl.uniform1f(U.Wood,mat.wood); gl.uniform3fv(U.WoodB,mat.woodB);
        gl.uniform1f(U.Fabric,mat.fabric); gl.uniform1f(U.Metal,mat.metal);
        if(isT){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false); }
        gl.drawArrays(gl.TRIANGLES,0,gb.count);
        if(isT){ gl.disable(gl.BLEND); gl.depthMask(true); } } }
    for(var i=0;i<node.children.length;i++) drawNode(node.children[i],M,vp,cam,pass); }
  this.render=function(root,vp,cam){
    /* NOTE: canvas.width/height are set once at mount (before context creation).
     * Changing them later silently kills drawing on some GL implementations. */
    var w=canvas.width,h=canvas.height;
    gl.viewport(0,0,w,h);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    for(var pass=0;pass<2;pass++) drawNode(root,identity,vp,cam,pass); };
  this._gl=gl;
}

/* ---------------- builder helpers ---------------- */
function furnHelpers(mats){
  function M(parent,geo,matKey,x,y,z){
    var o=new T3lite.Mesh(geo,mats[matKey]); o.position.set(x||0,y||0,z||0);
    parent.add(o); return o; }
  function rbox(parent,matKey,x,y,z,w,h,d,r){
    return M(parent,new T3lite.RBoxGeometry(w,h,d,r==null?Math.min(w,h,d)*0.2:r),matKey,x,y,z); }
  function box(parent,matKey,x,y,z,w,h,d){
    return M(parent,new T3lite.BoxGeometry(w,h,d),matKey,x,y,z); }
  function cyl(parent,matKey,x,y,z,rt,rb,h,rad){
    return M(parent,new T3lite.CylinderGeometry(rt,rb,h,rad||20),matKey,x,y,z); }
  function sph(parent,matKey,x,y,z,r,sx,sy,sz){
    var o=M(parent,new T3lite.SphereGeometry(r,20,14),matKey,x,y,z);
    if(sx)o.scale.set(sx,sy==null?sx:sy,sz==null?sx:sz); return o; }
  function tor(parent,matKey,x,y,z,R,r,arc){
    return M(parent,new T3lite.TorusGeometry(R,r,10,28,arc==null?TAU:arc),matKey,x,y,z); }
  function lathe(parent,matKey,x,y,z,profile,segs){
    return M(parent,new T3lite.LatheGeometry(profile,segs||28),matKey,x,y,z); }
  /* rod between two points (from vehicle builder) */
  function rod(parent,a,b,r,matKey){
    matKey=matKey||'blackMetal';
    var A=new V3(a[0],a[1],a[2]), B=new V3(b[0],b[1],b[2]);
    var dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z, len=Math.sqrt(dx*dx+dy*dy+dz*dz)||0.001;
    var o=M(parent,new T3lite.CylinderGeometry(r,r,len,12),matKey,
      (A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);
    /* orient Y axis along (B-A): yaw then pitch */
    var yaw=Math.atan2(dx,dz), pitch=Math.acos(Math.max(-1,Math.min(1,dy/len)));
    /* orient via quaternion: rotate +Y onto (B-A) */
    var q=new Quat();
    var ux=0,uy=1,uz=0, vx=dx/len,vy=dy/len,vz=dz/len;
    var cx=uy*vz-uz*vy, cy=uz*vx-ux*vz, cz=ux*vy-uy*vx;
    var dot=uy*vy, s=Math.sqrt(cx*cx+cy*cy+cz*cz);
    if(s<1e-6){ q.w = dot>0?1:-1; }
    else { var ang=Math.acos(Math.max(-1,Math.min(1,dot)));
      var hs=Math.sin(ang/2); q.x=cx/s*hs; q.y=cy/s*hs; q.z=cz/s*hs; q.w=Math.cos(ang/2); q._set=true; }
    o.quaternion=q;
    return o; }
  /* turned table/chair leg profile (unit height 1, radius ~0.035) */
  function turnedLeg(parent,matKey,x,z,h,r){
    r=r||0.032;
    var prof=[[0.001,0],[r*1.15,0],[r*1.15,0.02],[r*0.8,0.05],[r*0.55,0.10],
      [r*0.9,0.16],[r*1.0,0.22],[r*0.6,0.30],[r*0.5,0.42],[r*0.85,0.50],
      [r*1.0,0.58],[r*0.62,0.66],[r*0.55,0.78],[r*0.9,0.88],[r*1.05,0.95],[r*1.05,1.0]];
    var o=lathe(parent,matKey,x,0,z,prof.map(function(p){return [p[0],p[1]*h];}),20);
    return o; }
  /* simple tapered square leg */
  function taperedLeg(parent,matKey,x,z,h,wTop,wBot){
    var o=cyl(parent,matKey,x,h/2,z,wTop/2,wBot/2,h,4);
    o.rotation.y=Math.PI/4; return o; }
  return {M:M,rbox:rbox,box:box,cyl:cyl,sph:sph,tor:tor,lathe:lathe,rod:rod,
    turnedLeg:turnedLeg,taperedLeg:taperedLeg};
}

/* ---------------- parametric builders ----------------
 * Units are meters. y=0 is the floor. Every builder is a pure function of
 * its seeded RNG: same seed, same item. Dimensions follow real furniture. */
function frameMat(style){ return style==='industrial'?'blackMetal':(style==='midcentury'?'woodDark':'wood'); }

var BUILDERS={
/* ---- dining chair: seat, legs, posts, back variant, stretchers ---- */
chair:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var seatH=0.45, w=R.f(0.42,0.48), d=R.f(0.40,0.46), t=0.045;
  var back=R.pick(['slats','slats','ladder','splat','upholstered']);
  H.rbox(root,fm,0,seatH-t/2,0,w,t,d,0.012);
  var lx=w/2-0.035, lz=d/2-0.035, legR=0.024;
  [[-lx,-lz],[lx,-lz],[-lx,lz],[lx,lz]].forEach(function(p){
    if(style==='industrial') H.cyl(root,fm,p[0],(seatH-t)/2,p[1],legR,legR,seatH-t,12);
    else if(R.chance(0.5)) H.turnedLeg(root,fm,p[0],p[1],seatH-t,legR);
    else H.taperedLeg(root,fm,p[0],p[1],seatH-t,0.055,0.032); });
  /* stretchers */
  if(style!=='industrial'&&R.chance(0.8)){
    var sy=0.16;
    H.rod(root,[-lx,sy,-lz],[lx,sy,-lz],0.014,fm); H.rod(root,[-lx,sy,lz],[lx,sy,lz],0.014,fm);
    H.rod(root,[-lx,sy,-lz],[-lx,sy,lz],0.014,fm); H.rod(root,[lx,sy,-lz],[lx,sy,lz],0.014,fm); }
  /* back posts + variant */
  var postH=R.f(0.48,0.56), px=w/2-0.035, pz=-(d/2-0.035);
  [-px,px].forEach(function(x){
    if(style==='industrial') H.cyl(root,fm,x,seatH+postH/2,pz,legR,legR,postH,12);
    else H.turnedLeg(root,fm,x,pz,postH,legR).position.y=seatH; });
  var up=style==='industrial'?'leather':(R.chance(0.6)?'fabric':'leather');
  if(back==='slats'||back==='ladder'){
    var n=back==='ladder'?4:3;
    for(var i=0;i<n;i++){ var y=seatH+0.10+(postH-0.16)*i/(n-1);
      var s=H.rbox(root,fm,0,y,pz,px*2-0.02,0.075,0.022,0.008);
      s.rotation.x=0.06; } }
  else if(back==='splat'){
    var sp=H.rbox(root,fm,0,seatH+postH/2-0.02,pz,w*0.28,postH-0.14,0.02,0.03);
    sp.scale.set(1,1,1); }
  else { var pad=H.rbox(root,up,0,seatH+postH/2-0.03,pz+0.012,px*2-0.04,postH-0.18,0.07,0.03);
    pad.rotation.x=0.08; }
  return root; },

/* ---- armchair ---- */
armchair:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var up=R.chance(0.7)?'fabric':'leather';
  var w=R.f(0.78,0.92), seatY=0.40;
  H.rbox(root,up,0,seatY-0.10,0,w-0.1,0.22,0.62,0.06);            /* base */
  H.rbox(root,up,0,seatY+0.02,0.02,w-0.28,0.15,0.55,0.06);        /* seat cushion */
  var back=H.rbox(root,up,0,seatY+0.32,-0.30,w-0.28,0.55,0.15,0.06);
  back.rotation.x=-0.12;                                          /* backrest */
  [-1,1].forEach(function(s){                                      /* arms */
    H.rbox(root,up,s*(w/2-0.09),seatY+0.10,0,0.17,0.34,0.66,0.07); });
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){               /* legs */
    H.taperedLeg(root,fm,p[0]*(w/2-0.08),p[1]*0.26,seatY-0.21,0.05,0.03); });
  return root; },

/* ---- sofa ---- */
sofa:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var up=R.chance(0.7)?'fabric':'leather';
  var seats=R.i(2,3), w=seats*R.f(0.62,0.70)+0.34, seatY=0.40;
  H.rbox(root,up,0,seatY-0.10,0,w-0.06,0.24,0.66,0.07);
  for(var i=0;i<seats;i++){ var x=(i-(seats-1)/2)*(w-0.34)/seats;
    H.rbox(root,up,x,seatY+0.03,0.03,(w-0.34)/seats-0.03,0.16,0.56,0.06);
    var b=H.rbox(root,up,x,seatY+0.36,-0.30,(w-0.34)/seats-0.03,0.5,0.15,0.06);
    b.rotation.x=-0.12; }
  /* throw pillows in the accent fabric */
  for(var p2=0;p2<2;p2++){ var px2=(p2-0.5)*(w-0.5);
    var pil=H.rbox(root,'fabric2',px2,seatY+0.28,-0.18,0.34,0.34,0.12,0.05);
    pil.rotation.x=-0.14; pil.rotation.z=(p2-0.5)*0.18; }
  [-1,1].forEach(function(s){ H.rbox(root,up,s*(w/2-0.10),seatY+0.12,0,0.18,0.36,0.70,0.08); });
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.taperedLeg(root,fm,p[0]*(w/2-0.09),p[1]*0.28,seatY-0.22,0.055,0.032); });
  return root; },

/* ---- coffee table ---- */
coffeeTable:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=R.f(1.0,1.3), d=R.f(0.5,0.62), h=R.f(0.36,0.44), t=0.045;
  var top=R.pick(['wood','wood','glass']);
  var topMat=top==='glass'?'glass':(R.chance(0.5)?fm:'woodDark');
  H.rbox(root,topMat,0,h-t/2,0,w,t,d,0.015);
  var kind=R.pick(['legs','legs','slab','shelf']);
  var lx=w/2-0.07, lz=d/2-0.07;
  if(kind==='legs'){ [[-lx,-lz],[lx,-lz],[-lx,lz],[lx,lz]].forEach(function(p){
      H.taperedLeg(root,fm,p[0],p[1],h-t,0.06,0.035); }); }
  else if(kind==='slab'){ [-1,1].forEach(function(s){
      H.box(root,fm,s*(w/2-0.06),(h-t)/2,0,0.04,h-t,d-0.08); }); }
  else { [[-lx,-lz],[lx,-lz],[-lx,lz],[lx,lz]].forEach(function(p){
      H.taperedLeg(root,fm,p[0],p[1],h-t,0.06,0.035); });
    H.box(root,fm,0,0.09,0,w-0.2,0.03,d-0.16); }
  return root; },

/* ---- dining table: top, apron, turned legs ---- */
diningTable:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=R.f(1.5,2.0), d=R.f(0.85,1.0), h=0.74, t=0.04;
  H.rbox(root,fm,0,h-t/2,0,w,t,d,0.014);
  var ax=w/2-0.12, az=d/2-0.12, ah=0.09;
  H.box(root,fm,0,h-t-ah/2,-az,ax*2,ah,0.03); H.box(root,fm,0,h-t-ah/2,az,ax*2,ah,0.03);
  H.box(root,fm,-ax,h-t-ah/2,0,0.03,ah,az*2); H.box(root,fm,ax,h-t-ah/2,0,0.03,ah,az*2);
  [[-ax,-az],[ax,-az],[-ax,az],[ax,az]].forEach(function(p){
    if(style==='industrial') H.cyl(root,fm,p[0],(h-t-ah)/2,p[1],0.03,0.03,h-t-ah,12);
    else H.turnedLeg(root,fm,p[0],p[1],h-t-ah,0.034); });
  return root; },

/* ---- desk: top, drawer stack, legs ---- */
desk:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=1.25, d=0.62, h=0.74, t=0.04;
  H.rbox(root,fm,0,h-t/2,0,w,t,d,0.012);
  var dw=0.42, dx=w/2-dw/2-0.04;
  H.box(root,fm,dx,h-t-0.16,0,dw,0.28,d-0.12);                    /* drawer box */
  for(var i=0;i<2;i++){ var y=h-t-0.09-i*0.13;
    H.rbox(root,'woodDark',dx,y, (d-0.12)/2+0.005, dw-0.04,0.10,0.015,0.005);
    H.sph(root,'brass',dx,y,(d-0.12)/2+0.02,0.014); }
  [[-w/2+0.05,-d/2+0.05],[ -w/2+0.05,d/2-0.05]].forEach(function(p){
    H.taperedLeg(root,fm,p[0],p[1],h-t,0.055,0.032); });
  return root; },

/* ---- bookshelf with books ---- */
bookshelf:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  bookMatsFor(R).forEach(function(m,i){ mats['__book'+i]=m; });
  var w=R.f(0.85,1.15), h=R.f(1.75,2.1), d=0.32, t=0.028;
  H.box(root,fm,-w/2+t/2,h/2,0,t,h,d); H.box(root,fm,w/2-t/2,h/2,0,t,h,d);
  H.box(root,fm,0,h-t/2,0,w,t,d); H.box(root,fm,0,t/2,0,w,t,d);
  H.box(root,fm,0,h/2,-d/2+0.008,w-2*t,h,0.016);
  var n=R.i(4,5);
  for(var s2=0;s2<n;s2++){ var y=t+(h-2*t)*(s2+1)/(n+1);
    H.box(root,fm,0,y,0,w-2*t,0.024,d-0.03);
    /* books on this shelf */
    var x=-w/2+t+0.02, maxX=w/2-t-0.02;
    while(x<maxX-0.03){
      if(R.chance(0.12)){ x+=R.f(0.03,0.09); continue; }
      if(R.chance(0.10)){ /* horizontal stack */
        var sw=R.f(0.16,0.24), sy=y+0.012;
        for(var b2=0;b2<R.i(2,4);b2++){ var bh=R.f(0.025,0.04);
          H.box(root,'__book'+R.i(0,7),x+sw/2,sy+bh/2,0,sw,bh,0.15+R.f(-0.02,0.02)); sy+=bh; }
        x+=sw+0.02; continue; }
      var bw=R.f(0.022,0.045), bh2=R.f(0.19,0.28);
      var bk=H.box(root,'__book'+R.i(0,7),x+bw/2,y+0.012+bh2/2,0,bw,bh2,0.14+R.f(-0.02,0.02));
      if(R.chance(0.14)){ bk.rotation.z=-0.13; bk.position.x+=0.02; }  /* the leaning one */
      x+=bw+R.f(0.001,0.006); } }
  return root; },

/* ---- floor lamp ---- */
floorLamp:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var h=R.f(1.5,1.68);
  H.lathe(root,fm,0,0,0,[[0.001,0],[0.15,0],[0.15,0.025],[0.05,0.05],[0.028,0.09]],20);
  H.cyl(root,fm,0,h/2,0,0.014,0.014,h-0.1,12);
  var shadeH=R.f(0.26,0.34), sr=R.f(0.16,0.20);
  H.lathe(root,'shade',0,h-shadeH-0.02,0,
    [[sr*0.72,0],[sr,shadeH],[sr,shadeH]],24);
  H.sph(root,'bulb',0,h-shadeH/2-0.02,0,0.035);
  return root; },

/* ---- table lamp ---- */
tableLamp:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['ceramic','ceramic2','brass']);
  H.lathe(root,cm,0,0,0,[[0.001,0],[0.10,0],[0.10,0.02],[0.035,0.06],[0.02,0.20],[0.035,0.24]],20);
  H.lathe(root,'shade',0,0.26,0,[[0.10,0],[0.135,0.20],[0.135,0.20]],24);
  H.sph(root,'bulb',0,0.36,0,0.028);
  return root; },

/* ---- bed: frame, headboard, mattress, pillows ---- */
bed:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=1.6, l=2.0, fh=0.30;
  H.box(root,fm,0,fh/2,-l/2+0.03,w,0.16,0.06); H.box(root,fm,0,fh/2,l/2-0.03,w,0.16,0.06);
  H.box(root,fm,-w/2+0.03,fh/2,0,0.06,0.16,l); H.box(root,fm,w/2-0.03,fh/2,0,0.06,0.16,l);
  var hb=H.rbox(root,fm,0,0.62,-l/2+0.03,w,0.75,0.07,0.025);      /* headboard */
  if(R.chance(0.5)){ for(var i=0;i<5;i++){ var x=(i-2)*w/5.4;
      H.box(root,'woodDark',x,0.62,-l/2+0.075,w/5.4-0.04,0.6,0.02); } }
  H.rbox(root,'mattress',0,fh+0.11,0,w-0.08,0.22,l-0.10,0.06);
  [-1,1].forEach(function(s){ var p=H.rbox(root,'mattress',s*(w/4-0.02),fh+0.26,-l/2+0.32,0.62,0.13,0.38,0.05);
    p.rotation.x=-0.28; p.rotation.z=s*0.05; });                  /* pillows */
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.taperedLeg(root,fm,p[0]*(w/2-0.05),p[1]*(l/2-0.05),fh-0.08,0.06,0.04); });
  return root; },

/* ---- nightstand ---- */
nightstand:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=0.46, h=0.52, d=0.40;
  H.rbox(root,fm,0,h/2+0.06,0,w,h,0.40,0.015);
  H.rbox(root,'woodDark',0,h-0.06,0.20,w-0.07,0.13,0.015,0.005);
  H.rbox(root,'woodDark',0,h-0.22,0.20,w-0.07,0.13,0.015,0.005);
  H.sph(root,'brass',0,h-0.06,0.215,0.013); H.sph(root,'brass',0,h-0.22,0.215,0.013);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.taperedLeg(root,fm,p[0]*(w/2-0.04),p[1]*0.16,0.10,0.045,0.028); });
  return root; },

/* ---- dresser ---- */
dresser:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=R.f(1.25,1.5), h=0.78, d=0.46;
  H.rbox(root,fm,0,h/2+0.07,0,w,h,d,0.015);
  H.rbox(root,fm,0,h+0.085,0,w+0.03,0.035,d+0.03,0.012);          /* top */
  var cols=2, rows=3;
  for(var c=0;c<cols;c++) for(var r2=0;r2<rows;r2++){
    var x=(c-(cols-1)/2)*(w/cols), y=h+0.07-((r2+0.5)/rows)*h;
    H.rbox(root,'woodDark',x,y,d/2+0.004,w/cols-0.05,h/rows-0.05,0.018,0.006);
    H.sph(root,'brass',x,y,d/2+0.025,0.015); }
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.taperedLeg(root,fm,p[0]*(w/2-0.05),p[1]*(d/2-0.05),0.12,0.05,0.03); });
  return root; },

/* ---- stool ---- */
stool:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var h=R.pick([0.45,0.62]), r=R.f(0.16,0.20);
  H.cyl(root,fm,0,h-0.025,0,r,r,0.05,24);
  var lr=0.026;
  for(var i=0;i<4;i++){ var a=i/4*TAU+TAU/8;
    var x=Math.cos(a)*r*0.72, z=Math.sin(a)*r*0.72;
    if(style==='industrial') H.cyl(root,fm,x,(h-0.05)/2,z,lr,lr,h-0.05,10);
    else H.turnedLeg(root,fm,x,z,h-0.05,lr); }
  var ring=H.tor(root,fm,0,0.18,0,r*0.72,0.012); ring.rotation.x=Math.PI/2;
  return root; },

/* ---- bench ---- */
bench:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=R.f(1.25,1.55), d=R.f(0.32,0.4), h=0.45, t=0.06;
  H.rbox(root,fm,0,h-t/2,0,w,t,d,0.018);
  if(R.chance(0.5)){ [-1,1].forEach(function(s){
      H.box(root,fm,s*(w/2-0.05),(h-t)/2,0,0.045,h-t,d-0.06); }); }
  else { var lx=w/2-0.08, lz=d/2-0.06;
    [[-lx,-lz],[lx,-lz],[-lx,lz],[lx,lz]].forEach(function(p){
      H.taperedLeg(root,fm,p[0],p[1],h-t,0.06,0.035); }); }
  return root; },

/* ---- vase (lathe, 5 profiles) ---- */
vase:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['ceramic','ceramic2']);
  var h=R.f(0.24,0.42), kind=R.pick(['amphora','cylinder','gourd','bottle','bowlvase']);
  var P;
  if(kind==='amphora') P=[[0.001,0],[0.055,0],[0.075,0.03],[0.085,0.12],[0.06,0.24],[0.035,0.32],[0.045,0.38],[0.055,0.40]];
  else if(kind==='cylinder') P=[[0.001,0],[0.06,0],[0.062,0.30],[0.058,0.34]];
  else if(kind==='gourd') P=[[0.001,0],[0.07,0],[0.085,0.08],[0.05,0.18],[0.065,0.28],[0.04,0.34]];
  else if(kind==='bottle') P=[[0.001,0],[0.065,0],[0.068,0.16],[0.025,0.24],[0.022,0.34],[0.03,0.36]];
  else P=[[0.001,0],[0.05,0],[0.095,0.10],[0.10,0.16],[0.095,0.20]];
  var s=h/0.40;
  H.lathe(root,cm,0,0,0,P.map(function(p){return [p[0],p[1]*s];}),30);
  return root; },

/* ---- mug ---- */
mug:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['ceramic','ceramic2']);
  var r=R.f(0.042,0.05), h=R.f(0.095,0.11);
  H.lathe(root,cm,0,0,0,[[0.001,0],[r,0],[r,h],[r*0.96,h]],24);
  var hd=H.tor(root,cm,r+0.012,h*0.55,0,0.028,0.011,Math.PI);
  hd.rotation.z=-Math.PI/2; hd.rotation.y=Math.PI/2;
  return root; },

/* ---- bowl ---- */
bowl:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['ceramic','ceramic2']);
  var r=R.f(0.09,0.14);
  H.lathe(root,cm,0,0,0,[[0.001,0],[r*0.45,0],[r*0.8,0.015],[r,0.05],[r*1.02,0.075]],28);
  return root; }
};

var ITEM_TYPES=[
  {id:'chair',name:'Dining chair'},{id:'armchair',name:'Armchair'},{id:'sofa',name:'Sofa'},
  {id:'coffeeTable',name:'Coffee table'},{id:'diningTable',name:'Dining table'},{id:'desk',name:'Desk'},
  {id:'bookshelf',name:'Bookshelf'},{id:'floorLamp',name:'Floor lamp'},{id:'tableLamp',name:'Table lamp'},
  {id:'bed',name:'Bed'},{id:'nightstand',name:'Nightstand'},{id:'dresser',name:'Dresser'},
  {id:'stool',name:'Stool'},{id:'bench',name:'Bench'},
  {id:'vase',name:'Vase'},{id:'mug',name:'Mug'},{id:'bowl',name:'Bowl'}
];
var STYLES=[
  {id:'shaker',name:'Shaker'},{id:'midcentury',name:'Mid-century'},
  {id:'scandi',name:'Scandi'},{id:'industrial',name:'Industrial'}
];

/* book material cache per build (bookshelf fills it) */
function bookMatsFor(R){
  var cols=['#8a4b3c','#3c5a7a','#5a6e4a','#b08d4f','#6e4a6e','#a8a092','#384048','#94552f'];
  return cols.map(function(c){ return stdMat({color:hexRGB(c)}); });
}

/* ---------------- Pulse tool ---------------- */
var CSS=[
 '.ff-wrap{position:relative;border-radius:14px;overflow:hidden;background:',
 'radial-gradient(ellipse 120% 90% at 50% 30%, #2b303c 0%, #181c24 55%, #0c0e13 100%);}',
 '.ff-canvas{display:block;width:100%;touch-action:none;cursor:grab}',
 '.ff-canvas:active{cursor:grabbing}',
 '.ff-shadow{position:absolute;left:50%;top:72%;width:64%;height:9%;transform:translate(-50%,-50%);',
 'background:radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.0) 68%);',
 'filter:blur(6px);pointer-events:none}',
 '.ff-top{display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap}',
 '.ff-title{font-size:16px;font-weight:700;color:#eef;letter-spacing:.02em}',
 '.ff-seed{font-size:11px;color:#8fa3b8;background:#ffffff10;border:1px solid #ffffff18;',
 'padding:4px 10px;border-radius:999px;font-family:ui-monospace,monospace}',
 '.ff-btn{background:#7fd4ff22;border:1px solid #7fd4ff55;color:#cfeaff;border-radius:999px;',
 'padding:8px 18px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}',
 '.ff-btn:active{transform:scale(.96)}',
 '.ff-row{display:flex;gap:6px;overflow-x:auto;padding:4px 2px 8px;scrollbar-width:thin}',
 '.ff-chip{flex:0 0 auto;background:#ffffff0c;border:1px solid #ffffff1c;color:#c8d2e0;',
 'border-radius:999px;padding:7px 13px;font-size:12.5px;cursor:pointer;font-family:inherit;white-space:nowrap}',
 '.ff-chip.on{background:#7fd4ff2e;border-color:#7fd4ff88;color:#fff}',
 '.ff-label{font-size:12px;color:#8fa3b8;margin:2px 2px 8px}',
 '.ff-label b{color:#d5dce8;font-weight:600}',
 '.ff-foot{display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap}',
 '.ff-ghost{background:transparent;border:1px solid #ffffff26;color:#aeb9c9;border-radius:999px;',
 'padding:7px 14px;font-size:12.5px;cursor:pointer;font-family:inherit}',
 '.ff-note{font-size:11.5px;color:#6b7a8f}'
].join('');

var PROP_TYPES={vase:1,mug:1,bowl:1,tableLamp:1,stool:1};

TOOLS.furniture={
  mount:function(host){
    var self=this;
    host.innerHTML='<style>'+CSS+'</style>'+
      '<div class="ff-top"><div class="ff-title">Furniture Foundry</div>'+
      '<div class="ff-seed" id="ff-seed"></div>'+
      '<button class="ff-btn" id="ff-shuffle">⚄ Shuffle</button></div>'+
      '<div class="ff-row" id="ff-types"></div>'+
      '<div class="ff-row" id="ff-styles"></div>'+
      '<div class="ff-label" id="ff-label"></div>'+
      '<div class="ff-wrap"><canvas class="ff-canvas" id="ff-cv"></canvas>'+
      '<div class="ff-shadow"></div></div>'+
      '<div class="ff-foot"><button class="ff-ghost" id="ff-copy">Copy recipe</button>'+
      '<button class="ff-ghost" id="ff-rot">⟳ auto-rotate: on</button>'+
      '<span class="ff-note">Drag to orbit · scroll / pinch to zoom. Same seed, same item.</span></div>';

    var state={ type:'armchair', style:'midcentury',
      seed:'f'+hashSeed(new URLSearchParams(location.search).get('wonder-preview')||String(Date.now())).toString(36),
      cam:{yaw:0.7,pitch:0.42,dist:2.4}, auto:true,
      raf:0, clean:[], last:0 };
    var seedNum=hashSeed(state.seed);

    var canvas=host.querySelector('#ff-cv');
    var wrapW=host.clientWidth||360, wrapH=Math.round(wrapW*0.78);
    var dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(wrapW*dpr); canvas.height=Math.round(wrapH*dpr);
    canvas.style.height=wrapH+'px';
    var renderer=new Renderer(canvas);
    if(!renderer||typeof renderer.render!=='function'){ host.querySelector('.ff-wrap').innerHTML='<p class="ff-note">WebGL unavailable.</p>'; return; }

    function on(elm,ev,fn){ elm.addEventListener(ev,fn);
      state.clean.push(function(){ elm.removeEventListener(ev,fn); }); }

    /* type + style pickers */
    var typesEl=host.querySelector('#ff-types');
    ITEM_TYPES.forEach(function(t){
      var b=document.createElement('button'); b.className='ff-chip'+(t.id===state.type?' on':'');
      b.textContent=t.name; b.setAttribute('data-t',t.id);
      b.addEventListener('click',function(){ state.type=t.id; syncChips(); rebuild(); });
      typesEl.appendChild(b); });
    var stylesEl=host.querySelector('#ff-styles');
    STYLES.forEach(function(s){
      var b=document.createElement('button'); b.className='ff-chip'+(s.id===state.style?' on':'');
      b.textContent=s.name; b.setAttribute('data-s',s.id);
      b.addEventListener('click',function(){ state.style=s.id; syncChips(); rebuild(); });
      stylesEl.appendChild(b); });
    function syncChips(){
      typesEl.querySelectorAll('.ff-chip').forEach(function(c){
        c.classList.toggle('on',c.getAttribute('data-t')===state.type); });
      stylesEl.querySelectorAll('.ff-chip').forEach(function(c){
        c.classList.toggle('on',c.getAttribute('data-s')===state.style); }); }

    function newSeed(){ seedNum=(seedNum+0x9E3779B9)>>>0;
      state.seed=seedNum.toString(36); }

    var build=null, mats=null;
    function rebuild(){
      var R=RNG(state.seed+':'+state.type+':'+state.style);
      mats=makeMats(state.style,R);
      var H=furnHelpers(mats);
      var root=BUILDERS[state.type](R,H,mats,state.style);
      build={root:root};
      var isProp=!!PROP_TYPES[state.type];
      state.cam.dist=isProp?0.85:2.4;
      state.cam.targetY=isProp?0.14:0.55;
      var tName=(ITEM_TYPES.filter(function(t){return t.id===state.type;})[0]||{}).name;
      var sName=(STYLES.filter(function(s){return s.id===state.style;})[0]||{}).name;
      host.querySelector('#ff-seed').textContent='#'+state.seed;
      host.querySelector('#ff-label').innerHTML='<b>'+tName+'</b> · '+sName+
        ' · '+mats.woodName+' · '+mats.fabricName; }

    on(host.querySelector('#ff-shuffle'),'click',function(){
      if(RNG('s'+(seedNum++)).chance(0.3))
        state.type=RNG('t'+seedNum).pick(ITEM_TYPES).id;
      newSeed(); syncChips(); rebuild(); });
    var rotBtn=host.querySelector('#ff-rot');
    on(rotBtn,'click',function(){ state.auto=!state.auto;
      rotBtn.textContent='⟳ auto-rotate: '+(state.auto?'on':'off'); });
    on(host.querySelector('#ff-copy'),'click',function(){
      var recipe=JSON.stringify({tool:'furniture',type:state.type,style:state.style,
        seed:state.seed,wood:mats.woodName,fabric:mats.fabricName},null,2);
      var btn=host.querySelector('#ff-copy');
      function done(ok){ btn.textContent=ok?'Copied':'Copy failed';
        setTimeout(function(){ btn.textContent='Copy recipe'; },1400); }
      if(navigator.clipboard&&navigator.clipboard.writeText)
        navigator.clipboard.writeText(recipe).then(function(){done(true);},function(){done(false);});
      else done(false); });

    /* orbit */
    var dragging=false,lx=0,ly=0;
    on(canvas,'pointerdown',function(e){ dragging=true; lx=e.clientX; ly=e.clientY;
      canvas.setPointerCapture(e.pointerId); });
    on(canvas,'pointerup',function(){ dragging=false; });
    on(canvas,'pointercancel',function(){ dragging=false; });
    on(canvas,'pointermove',function(e){
      if(!dragging) return;
      state.cam.yaw-=(e.clientX-lx)*0.008; state.cam.pitch+=(e.clientY-ly)*0.006;
      state.cam.pitch=Math.max(0.06,Math.min(1.35,state.cam.pitch));
      lx=e.clientX; ly=e.clientY; });
    on(canvas,'wheel',function(e){ e.preventDefault();
      state.cam.dist*=Math.pow(1.0015,e.deltaY);
      state.cam.dist=Math.max(0.4,Math.min(9,state.cam.dist)); },{passive:false});

    function renderFrame(){
      var cam=state.cam, ty=cam.targetY||0.55;
      var eye=new V3(cam.dist*Math.cos(cam.pitch)*Math.sin(cam.yaw),
                     ty+cam.dist*Math.sin(cam.pitch),
                     cam.dist*Math.cos(cam.pitch)*Math.cos(cam.yaw));
      var look=new V3(0,ty,0);
      var vp=m4mul(m4persp(0.7,canvas.width/Math.max(1,canvas.height),0.05,60),
                   m4look(eye,look,new V3(0,1,0)));
      renderer.render(build.root,vp,eye); }
    /* synchronous read-back for verification (same-task readPixels).
     * Pass a 2D canvas to also paint a flipped screenshot into it. */
    canvas._ffShot=function(target2d){
      renderFrame();
      var gl=renderer._gl, w=canvas.width, h=canvas.height;
      var px=new Uint8Array(w*h*4);
      gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
      var mean=0,n=w*h,i;
      for(i=0;i<px.length;i+=4) mean+=(px[i]+px[i+1]+px[i+2])/3;
      mean/=n;
      var v=0;
      for(i=0;i<px.length;i+=4){ var d=(px[i]+px[i+1]+px[i+2])/3-mean; v+=d*d; }
      if(target2d){
        target2d.width=w; target2d.height=h;
        var cx=target2d.getContext('2d'), img=cx.createImageData(w,h), dd=img.data;
        for(var y=0;y<h;y++){ var s=(h-1-y)*w*4, t=y*w*4;
          for(var x=0;x<w*4;x++) dd[t+x]=px[s+x]; }
        cx.putImageData(img,0,0); }
      return {variance:+(v/n).toFixed(1)}; };

    function frame(t){
      state.raf=requestAnimationFrame(frame);
      var dt=Math.min(0.05,(t-state.last)/1000||0.016); state.last=t;
      if(state.auto&&build) build.root.rotation.y+=dt*0.4;
      renderFrame(); }

    rebuild();
    state.last=performance.now();
    state.raf=requestAnimationFrame(frame);
    this._state=state;
  },
  unmount:function(){
    var s=this._state;
    if(s){ cancelAnimationFrame(s.raf);
      for(var i=0;i<s.clean.length;i++) try{ s.clean[i](); }catch(e){} }
    geoCache={}; geoSeq=0;
  }
};



/* ---------------- batch 2: more furniture ---------------- */
Object.assign(BUILDERS,{

/* ---- rocking chair: ladder-back on curved rockers ---- */
rockingChair:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var seatH=0.44, w=0.46, d=0.44, t=0.045;
  H.rbox(root,fm,0,seatH-t/2,0,w,t,d,0.012);
  var lx=w/2-0.04, lz=d/2-0.04;
  [[-lx,-lz],[lx,-lz],[-lx,lz],[lx,lz]].forEach(function(p){
    H.turnedLeg(root,fm,p[0],p[1],seatH-0.06,0.026); });
  /* rockers: long gentle arcs in the ZY plane, nested group so the arc centers at bottom */
  var arcA=Math.PI*0.35, Rr=1.1;
  [-1,1].forEach(function(s){
    var g=new T3lite.Group(); g.position.set(s*(lx+0.02),Rr-0.01,0.03);
    g.rotation.y=Math.PI/2; root.add(g);
    var rk=H.tor(g,fm,0,0,0,Rr,0.024,arcA);
    rk.rotation.z=-Math.PI/2-arcA/2;
    /* posts from rocker up to seat */
    H.rod(root,[s*(lx+0.02),0.05,-0.22],[s*lx,seatH-0.05,-lz],0.02,fm);
    H.rod(root,[s*(lx+0.02),0.05,0.26],[s*lx,seatH-0.05,lz],0.02,fm); });
  /* back */
  var postH=0.55, px=w/2-0.04, pz=-(d/2-0.04);
  [-px,px].forEach(function(x){
    H.turnedLeg(root,fm,x,pz,postH,0.024).position.y=seatH; });
  for(var i=0;i<3;i++){ var y=seatH+0.12+(postH-0.2)*i/2;
    var s2=H.rbox(root,fm,0,y,pz,px*2-0.02,0.07,0.022,0.008); s2.rotation.x=0.06; }
  return root; },

/* ---- office chair: 5-star base, gas lift, backrest ---- */
officeChair:function(R,H,mats,style){
  var root=new T3lite.Group();
  var up=R.chance(0.6)?'fabric':'leather';
  var seatY=0.52;
  H.rbox(root,up,0,seatY,0,0.5,0.09,0.48,0.035);
  var bk=H.rbox(root,up,0,seatY+0.36,-0.26,0.46,0.55,0.09,0.035); bk.rotation.x=-0.1;
  H.cyl(root,'blackMetal',0,0.32,0,0.025,0.025,0.30,12);          /* gas lift */
  H.cyl(root,'blackMetal',0,0.16,0,0.05,0.05,0.06,12);
  for(var i=0;i<5;i++){ var a=i/5*TAU;                            /* 5-star */
    var x=Math.cos(a)*0.30, z=Math.sin(a)*0.30;
    H.rod(root,[0,0.13,0],[x,0.06,z],0.02,'blackMetal');
    H.sph(root,'blackMetal',x,0.035,z,0.035); }
  if(R.chance(0.7)){ [-1,1].forEach(function(s){                  /* armrests */
      H.cyl(root,'blackMetal',s*0.26,seatY-0.10,0,0.018,0.018,0.22,10);
      H.rbox(root,up,s*0.26,seatY+0.03,0.02,0.07,0.04,0.30,0.015); }); }
  return root; },

/* ---- sideboard / credenza ---- */
sideboard:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=R.f(1.6,2.0), h=0.62, d=0.46;
  H.rbox(root,fm,0,h/2+0.08,0,w,h,d,0.015);
  H.rbox(root,fm,0,h+0.095,0,w+0.03,0.035,d+0.03,0.012);
  var n=R.i(3,4);
  for(var i=0;i<n;i++){ var x=(i-(n-1)/2)*(w/n);
    var door=R.chance(0.5);
    H.rbox(root,'woodDark',x,h/2+0.08,d/2+0.004,w/n-0.05,h-0.10,0.018,0.006);
    if(door){ H.sph(root,'brass',x+w/n/2-0.09,h/2+0.08,d/2+0.025,0.014); }
    else { H.box(root,'brass',x,h/2+0.08,d/2+0.022,w/n-0.24,0.018,0.02); } }
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.taperedLeg(root,fm,p[0]*(w/2-0.05),p[1]*(d/2-0.05),0.13,0.05,0.03); });
  return root; },

/* ---- TV stand ---- */
tvStand:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=1.5, h=0.44, d=0.40;
  H.rbox(root,fm,0,h/2+0.06,0,w,h,d,0.014);
  H.box(root,fm,0,h/2+0.06,0,w-0.08,0.02,d-0.06);                 /* mid shelf */
  [-1,1].forEach(function(s){
    H.rbox(root,'woodDark',s*(w/4+0.02),h/2+0.06,d/2+0.004,w/4-0.06,h-0.12,0.018,0.006);
    H.sph(root,'brass',s*(w/4+0.02),h/2+0.06,d/2+0.025,0.013); });
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.taperedLeg(root,fm,p[0]*(w/2-0.05),p[1]*(d/2-0.05),0.11,0.05,0.03); });
  return root; },

/* ---- wardrobe ---- */
wardrobe:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=1.15, h=1.95, d=0.58;
  H.rbox(root,fm,0,h/2+0.05,0,w,h,d,0.015);
  H.rbox(root,fm,0,h+0.075,0,w+0.05,0.05,d+0.05,0.015);           /* crown */
  H.box(root,fm,0,0.075,0,w-0.04,0.05,d-0.04);                   /* plinth */
  [-1,1].forEach(function(s){
    H.rbox(root,'woodDark',s*w/4,h/2+0.05,d/2+0.004,w/2-0.05,h-0.14,0.018,0.006);
    H.sph(root,'brass',s*0.07,h/2+0.05,d/2+0.025,0.016); });
  return root; },

/* ---- vanity + round mirror ---- */
vanity:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=1.05, d=0.44, h=0.74, t=0.04;
  H.rbox(root,fm,0,h-t/2,0,w,t,d,0.012);
  [-1,1].forEach(function(s){ H.box(root,fm,s*(w/2-0.05),(h-t)/2,0,0.05,h-t,d-0.06); });
  H.rbox(root,'woodDark',0,h-t-0.10,0.10,0.4,0.12,0.015,0.005);
  H.sph(root,'brass',0,h-t-0.10,0.115,0.013);
  /* mirror on posts */
  var mr=0.30;
  [-1,1].forEach(function(s){ H.cyl(root,fm,s*(mr+0.03),h+0.28,-d/2+0.06,0.016,0.016,0.62,10); });
  var fr=H.tor(root,fm,0,h+0.55,-d/2+0.06,mr,0.022);
  H.cyl(root,'mirror',0,h+0.55,-d/2+0.06,mr-0.015,mr-0.015,0.008,28);
  return root; },

/* ---- ottoman / pouf ---- */
ottoman:function(R,H,mats,style){
  var root=new T3lite.Group();
  var up=R.chance(0.7)?'fabric':'leather';
  if(R.chance(0.5)){ var r=R.f(0.26,0.32);
    H.cyl(root,up,0,0.17,0,r,r*0.94,0.30,24);
    H.cyl(root,up,0,0.335,0,r*0.96,r*0.96,0.05,24); }
  else { var w=R.f(0.5,0.62);
    H.rbox(root,up,0,0.19,0,w,0.34,w*0.9,0.09); }
  return root; },

/* ---- chaise lounge ---- */
chaiseLounge:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var up=R.chance(0.7)?'fabric':'leather';
  var l=1.55, w=0.68, seatY=0.38;
  H.rbox(root,up,0,seatY-0.08,0.1,w-0.06,0.20,l-0.5,0.07);
  H.rbox(root,up,0,seatY+0.02,0.28,w-0.20,0.13,0.95,0.055);       /* long cushion */
  var bk=H.rbox(root,up,0,seatY+0.34,-0.52,w-0.20,0.62,0.14,0.06); bk.rotation.x=-0.35;
  H.rbox(root,up,-(w/2-0.10),seatY+0.12,-0.05,0.16,0.30,1.05,0.07); /* one arm */
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.taperedLeg(root,fm,p[0]*(w/2-0.07),p[1]*0.55,seatY-0.18,0.05,0.03); });
  return root; },

/* ---- coat rack ---- */
coatRack:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var h=1.82;
  H.lathe(root,fm,0,0,0,[[0.001,0],[0.17,0],[0.17,0.03],[0.05,0.06],[0.026,0.10]],20);
  H.cyl(root,fm,0,h/2,0,0.024,0.024,h,14);
  H.sph(root,fm,0,h+0.02,0,0.035);
  for(var i=0;i<4;i++){ var a=i/4*TAU+TAU/8;
    var x=Math.cos(a), z=Math.sin(a);
    H.rod(root,[x*0.02,h-0.28,z*0.02],[x*0.20,h-0.10,z*0.20],0.014,fm);
    H.sph(root,fm,x*0.20,h-0.10,z*0.20,0.022); }
  return root; },

/* ---- folding room divider: 3 slatted panels ---- */
roomDivider:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var pw=0.55, ph=1.72, ang=R.f(0.3,0.5);
  for(var p=0;p<3;p++){
    var g=new T3lite.Group();
    g.position.set((p-1)*pw*Math.cos(ang*0.5),0,(p===1?0:(p===0?-1:1)*pw*Math.sin(ang*0.5)*0.9));
    g.rotation.y=(p-1)*ang; root.add(g);
    H.box(g,fm,-pw/2+0.02,ph/2,0,0.045,ph,0.04); H.box(g,fm,pw/2-0.02,ph/2,0,0.045,ph,0.04);
    H.box(g,fm,0,ph-0.03,0,pw,0.06,0.04); H.box(g,fm,0,0.06,0,pw,0.09,0.04);
    for(var s=0;s<5;s++){ var y=0.28+s*(ph-0.62)/4;
      var sl=H.box(g,fm,0,y,0,pw-0.09,0.10,0.018); sl.rotation.x=0.5; } }
  return root; }
});

/* ---------------- batch 3: lighting + decor + kitchen ---------------- */
Object.assign(BUILDERS,{

/* ---- pendant lamp ---- */
pendantLamp:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['blackMetal','brass','ceramic']);
  var shadeH=R.f(0.22,0.32), sr=R.f(0.15,0.22);
  H.cyl(root,'blackMetal',0,1.35,0,0.008,0.008,0.7,8);            /* cord */
  var kind=R.pick(['dome','cone','drum']);
  if(kind==='dome') H.lathe(root,cm,0,1.02,0,[[0.02,shadeH],[sr*0.9,shadeH*0.55],[sr,0]],24);
  else if(kind==='cone') H.lathe(root,cm,0,1.02,0,[[0.03,shadeH],[sr,0],[sr,0]],24);
  else H.lathe(root,cm,0,1.02,0,[[sr*0.92,shadeH],[sr,0],[sr,0]],24);
  H.sph(root,'bulb',0,1.06,0,0.035);
  return root; },

/* ---- desk lamp: articulated pose ---- */
deskLamp:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['blackMetal','brass']);
  H.lathe(root,cm,0,0,0,[[0.001,0],[0.11,0],[0.11,0.025],[0.04,0.05]],20);
  H.rod(root,[0,0.05,0],[0.10,0.42,0],0.016,cm);
  H.rod(root,[0.10,0.42,0],[0.30,0.52,0.02],0.014,cm);
  H.sph(root,cm,0.10,0.42,0,0.024);
  var sh=H.lathe(root,cm,0.30,0.40,0.02,[[0.035,0.14],[0.11,0],[0.11,0]],22);
  sh.rotation.z=0.5; sh.rotation.x=0.1;
  H.sph(root,'bulb',0.345,0.40,0.03,0.028);
  return root; },

/* ---- lantern ---- */
lantern:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=0.16, h=0.30;
  H.box(root,fm,0,0.02,0,w,0.04,w); H.box(root,fm,0,h+0.03,0,w+0.02,0.04,w+0.02);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.box(root,fm,p[0]*(w/2-0.015),h/2+0.02,p[1]*(w/2-0.015),0.03,h,0.03); });
  H.box(root,'glass',0,h/2+0.02,0,w-0.05,h-0.04,w-0.05);
  H.cyl(root,'paper',0,0.10,0,0.035,0.035,0.12,14);
  H.sph(root,'flame',0,0.175,0,0.014,1,1.6,1);
  var hd=H.tor(root,fm,0,h+0.05,0,0.07,0.014,Math.PI); hd.rotation.z=0;
  return root; },

/* ---- wall mirror (product-shot floating) ---- */
wallMirror:function(R,H,mats,style){
  var root=new T3lite.Group();
  var fm=R.pick(['brass','blackMetal','wood']);
  if(R.chance(0.5)){ var r=R.f(0.3,0.42);
    H.tor(root,fm,0,0.75,0,r,0.028);
    H.cyl(root,'mirror',0,0.75,0,r-0.02,r-0.02,0.01,32); }
  else { var w=R.f(0.5,0.7), h=R.f(0.7,1.0);
    H.rbox(root,fm,0,0.8,0,w,h,0.05,0.015);
    H.box(root,'mirror',0,0.8,0.012,w-0.09,h-0.09,0.012); }
  return root; },

/* ---- wall clock ---- */
wallClock:function(R,H,mats,style){
  var root=new T3lite.Group();
  var fm=R.pick(['blackMetal','wood','brass']);
  var r=R.f(0.16,0.24);
  H.cyl(root,fm,0,0.8,0,r,r,0.045,28).rotation.x=Math.PI/2;
  H.cyl(root,'paper',0,0.8,0.024,r-0.025,r-0.025,0.008,28).rotation.x=Math.PI/2;
  for(var i=0;i<12;i++){ var a=i/12*TAU;
    H.box(root,'blackMetal',Math.cos(a)*(r-0.05),0.8+Math.sin(a)*(r-0.05),0.028,
      0.012,i%3?0.03:0.05,0.006); }
  var hr=R.f(1,12), mn=R.f(0,60);
  var ha=(hr%12+mn/60)/12*TAU, ma=mn/60*TAU;
  var h1=H.box(root,'blackMetal',0,0.8,0.032,0.014,r*0.5,0.008);
  h1.geometry=h1.geometry; /* pivot at center: offset trick below */
  h1.position.set(Math.sin(ha)*r*0.22,0.8+Math.cos(ha)*r*0.22,0.032); h1.rotation.z=-ha;
  var m1=H.box(root,'blackMetal',0,0.8,0.034,0.010,r*0.75,0.008);
  m1.position.set(Math.sin(ma)*r*0.33,0.8+Math.cos(ma)*r*0.33,0.034); m1.rotation.z=-ma;
  H.sph(root,'brass',0,0.8,0.036,0.012);
  return root; },

/* ---- rug: two-tone flat ---- */
rug:function(R,H,mats,style){
  var root=new T3lite.Group();
  var w=R.f(1.5,1.9), d=R.f(2.1,2.6);
  var base=R.pick(['#b09a7a','#7a8a99','#9a8a7a','#6a7a6a']);
  var acc=R.pick(['#e8e0d0','#3a3d40','#a8503c','#2f5d50']);
  mats.__rugBase=stdMat({color:hexRGB(base),fabric:1});
  mats.__rugAcc=stdMat({color:hexRGB(acc),fabric:1});
  H.rbox(root,'__rugBase',0,0.012,0,w,0.024,d,0.01);
  H.rbox(root,'__rugAcc',0,0.024,0,w*0.78,0.026,d*0.8,0.01);
  return root; },

/* ---- plant pot + simple plant ---- */
plantPot:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['ceramic','ceramic2']);
  var r=R.f(0.13,0.18), h=R.f(0.24,0.32);
  H.lathe(root,cm,0,0,0,[[0.001,0],[r*0.72,0],[r*0.85,0.03],[r,h*0.92],[r*1.02,h]],22);
  H.cyl(root,'soil',0,h*0.86,0,r*0.86,r*0.86,0.03,20);
  var n=R.i(5,8);
  for(var i=0;i<n;i++){ var a=R.f(0,TAU), rr=R.f(0,r*0.5);
    var x=Math.cos(a)*rr, z=Math.sin(a)*rr, y=h+R.f(0.10,0.34);
    var s=H.sph(root,R.chance(0.5)?'leaf':'leafDark',x,y,z,R.f(0.06,0.11));
    s.scale.set(1,R.f(1.2,1.8),1); s.rotation.y=R.f(0,TAU); }
  return root; },

/* ---- picture frame ---- */
pictureFrame:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=R.f(0.5,0.75), h=R.f(0.65,0.95), b=0.055;
  H.box(root,fm,0,0.85+h/2-b/2,0,w,b,0.04); H.box(root,fm,0,0.85-h/2+b/2,0,w,b,0.04);
  H.box(root,fm,-w/2+b/2,0.85,0,b,h-2*b,0.04); H.box(root,fm,w/2-b/2,0.85,0,b,h-2*b,0.04);
  var art=R.pick(['#7a93a8','#a8b09a','#c4b49a','#8a4b5c','#5a6e7a']);
  mats.__art=stdMat({color:hexRGB(art)});
  H.box(root,'__art',0,0.85,-0.008,w-2*b,h-2*b,0.012);
  /* simple horizon line on the art */
  mats.__art2=stdMat({color:hexRGB('#e8e2d4')});
  H.box(root,'__art2',0,0.85+h*0.1,-0.001,w-2*b,h*0.28,0.014);
  return root; },

/* ---- candle holder + candle + flame ---- */
candleHolder:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['brass','ceramic','blackMetal']);
  H.lathe(root,cm,0,0,0,[[0.001,0],[0.06,0],[0.062,0.015],[0.03,0.03],[0.032,0.05]],20);
  var ch=R.f(0.09,0.14);
  H.cyl(root,'paper',0,0.05+ch/2,0,0.024,0.024,ch,16);
  H.sph(root,'flame',0,0.05+ch+0.012,0,0.011,1,1.7,1);
  return root; },

/* ---- woven-look basket ---- */
basket:function(R,H,mats,style){
  var root=new T3lite.Group();
  var bc=R.pick(['#a8814f','#8a6a42','#b59468']);
  mats.__basket=stdMat({color:hexRGB(bc),fabric:1});
  var r=R.f(0.16,0.22), h=R.f(0.22,0.30);
  H.lathe(root,'__basket',0,0,0,[[0.001,0],[r*0.7,0],[r*0.92,h*0.9],[r,h]],24);
  var rim=H.tor(root,'__basket',0,h,0,r,0.014); rim.rotation.x=Math.PI/2;
  return root; },

/* ---- teapot ---- */
teapot:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['ceramic','ceramic2']);
  var r=R.f(0.075,0.095);
  H.lathe(root,cm,0,0,0,[[0.001,0],[r*0.62,0],[r,0.05],[r*1.02,0.11],[r*0.72,0.17],[r*0.4,0.185]],26);
  H.lathe(root,cm,0,0.185,0,[[r*0.4,0],[r*0.42,0.012],[0.001,0.02]],20);
  H.sph(root,cm,0,0.215,0,0.014);
  var sp=H.cyl(root,cm,0,0,0,0.016,0.026,0.11,14);       /* spout */
  sp.position.set(r*0.95,0.10,0); sp.rotation.z=-0.9;
  var hd=H.tor(root,cm,-r*0.95,0.10,0,0.05,0.012,Math.PI); /* handle */
  hd.rotation.z=Math.PI/2;
  return root; },

/* ---- plate ---- */
plate:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['ceramic','ceramic2']);
  var r=R.f(0.11,0.14);
  H.lathe(root,cm,0,0,0,[[0.001,0],[r*0.55,0],[r*0.9,0.012],[r,0.028],[r*0.97,0.032]],26);
  return root; },

/* ---- bottle ---- */
bottle:function(R,H,mats,style){
  var root=new T3lite.Group();
  var h=R.f(0.28,0.34), r=R.f(0.038,0.046);
  H.lathe(root,'glassGreen',0,0,0,
    [[0.001,0],[r,0],[r,h*0.55],[r*0.42,h*0.72],[r*0.36,h*0.92],[r*0.4,h]],22);
  H.cyl(root,'blackMetal',0,h+0.008,0,r*0.36,r*0.36,0.025,14);
  return root; },

/* ---- toaster ---- */
toaster:function(R,H,mats,style){
  var root=new T3lite.Group();
  var w=0.28, h=0.19, d=0.17;
  H.rbox(root,'chrome',0,h/2+0.02,0,w,h,d,0.03);
  H.box(root,'blackMetal',0,0.015,0,w-0.04,0.03,d-0.04);
  [-1,1].forEach(function(s){
    H.box(root,'blackMetal',s*0.055,h+0.015,0,0.075,0.012,d-0.07); }); /* slots */
  H.rod(root,[w/2+0.005,0.16,0],[w/2+0.03,0.16,0],0.008,'blackMetal');
  H.box(root,'blackMetal',w/2+0.035,0.16,0,0.02,0.045,0.03);           /* lever */
  return root; },

/* ---- cutting board ---- */
cuttingBoard:function(R,H,mats,style){
  var root=new T3lite.Group();
  var w=0.30, l=0.34;
  H.rbox(root,'wood',0,0.014,0.03,w,0.028,l,0.012);
  H.rbox(root,'wood',0,0.014,-l/2-0.045,w*0.32,0.024,0.11,0.011);
  return root; }
});

/* ---------------- batch 4: office + storage + outdoor ---------------- */
Object.assign(BUILDERS,{

/* ---- monitor ---- */
monitor:function(R,H,mats,style){
  var root=new T3lite.Group();
  var w=0.56, h=0.34;
  H.cyl(root,'blackMetal',0,0.02,0,0.11,0.13,0.03,20);
  H.cyl(root,'blackMetal',0,0.16,0,0.025,0.025,0.28,12);
  H.rbox(root,'blackMetal',0,0.42,0,w,h,0.035,0.012);
  H.box(root,'screen',0,0.42,0.012,w-0.045,h-0.045,0.008);
  return root; },

/* ---- laptop ---- */
laptop:function(R,H,mats,style){
  var root=new T3lite.Group();
  var w=0.33, d=0.23;
  H.rbox(root,'blackMetal',0,0.014,0,w,0.024,d,0.008);
  H.box(root,'blackMetal',0,0.028,0.02,w-0.03,0.006,d-0.05);   /* keyboard deck */
  var sc=H.rbox(root,'blackMetal',0,0.13,-d/2+0.008,w,0.24,0.018,0.008);
  sc.rotation.x=-0.28;
  var face=H.box(root,'screen',0,0.13,-d/2+0.019,w-0.03,0.21,0.004);
  face.rotation.x=-0.28;
  return root; },

/* ---- keyboard ---- */
keyboard:function(R,H,mats,style){
  var root=new T3lite.Group();
  var w=0.37, d=0.135;
  H.rbox(root,'blackMetal',0,0.012,0,w,0.024,d,0.008);
  for(var r=0;r<4;r++) for(var c=0;c<12;c++){
    var kw=(r===3&&c>7)?0.052:0.024;
    H.box(root,'paper',(c-5.5)*0.028+(r===3&&c>7?0.014:0),0.026,(r-1.5)*0.03,kw-0.004,0.014,0.024); }
  return root; },

/* ---- slatted crate ---- */
crate:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=R.f(0.4,0.55), h=R.f(0.3,0.42), d=R.f(0.3,0.4);
  var sl=0.07, gap=0.025;
  for(var y=0;y<h;y+=sl+gap){
    H.box(root,fm,0,y+sl/2,-d/2,w,sl,0.02); H.box(root,fm,0,y+sl/2,d/2,w,sl,0.02);
    H.box(root,fm,-w/2,y+sl/2,0,0.02,sl,d); H.box(root,fm,w/2,y+sl/2,0,0.02,sl,d); }
  H.box(root,fm,0,0.01,0,w,0.02,d);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(p){
    H.box(root,fm,p[0]*(w/2-0.01),h/2,p[1]*(d/2-0.01),0.045,h,0.045); });
  return root; },

/* ---- trash can ---- */
trashCan:function(R,H,mats,style){
  var root=new T3lite.Group();
  var cm=R.pick(['steel','blackMetal']);
  var r=R.f(0.14,0.17), h=R.f(0.32,0.4);
  H.lathe(root,cm,0,0,0,[[0.001,0],[r*0.78,0],[r,0.03],[r*1.04,h*0.94],[r*1.04,h]],22);
  var rim=H.tor(root,cm,0,h,0,r*1.04,0.012); rim.rotation.x=Math.PI/2;
  return root; },

/* ---- birdhouse ---- */
birdhouse:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var w=0.19, h=0.24, d=0.17;
  H.cyl(root,fm,0,0.55,0,0.025,0.025,1.1,10);                     /* post */
  H.box(root,fm,0,1.10+h/2,0,w,h,d);
  var r1=H.box(root,'woodDark',0,1.10+h+0.045,-d/4-0.01,w+0.05,0.03,d/2+0.08);
  r1.rotation.x=0.5;
  var r2=H.box(root,'woodDark',0,1.10+h+0.045,d/4+0.01,w+0.05,0.03,d/2+0.08);
  r2.rotation.x=-0.5;
  H.cyl(root,'blackMetal',0,1.10+h*0.62,0.088,0.028,0.028,0.012,16).rotation.x=Math.PI/2; /* hole */
  H.cyl(root,fm,0,1.10+h*0.42,0.10,0.008,0.008,0.07,8).rotation.x=Math.PI/2;               /* perch */
  return root; },

/* ---- mailbox ---- */
mailbox:function(R,H,mats,style){
  var root=new T3lite.Group(), fm=frameMat(style);
  var h=1.05, w=0.24, d=0.5;
  H.box(root,fm,0,h/2,0,0.09,h,0.09);
  H.box(root,fm,0,h+0.10,0,w,0.20,d);
  var top=H.cyl(root,fm,0,h+0.20,0,w/2,w/2,d,20); top.rotation.x=Math.PI/2;
  H.box(root,'blackMetal',0,h+0.10,d/2+0.004,0.16,0.14,0.015);   /* door */
  H.rod(root,[w/2+0.01,h+0.28,0.1],[w/2+0.01,h+0.48,0.1],0.012,'blackMetal');
  H.box(root,'blackMetal',w/2+0.01,h+0.50,0.1,0.03,0.05,0.09);   /* flag */
  return root; },

/* ---- kettle grill ---- */
kettleGrill:function(R,H,mats,style){
  var root=new T3lite.Group();
  var r=0.28, y=0.62;
  H.sph(root,'blackMetal',0,y,0,r,1,0.72,1);
  var lid=H.sph(root,'blackMetal',0,y+0.10,0,r*0.98,1,0.5,1);
  H.cyl(root,'blackMetal',0,y+0.30,0,0.02,0.02,0.10,10);
  var hd=H.tor(root,'blackMetal',0,y+0.36,0,0.07,0.012,Math.PI);
  for(var i=0;i<3;i++){ var a=i/3*TAU;
    H.rod(root,[Math.cos(a)*r*0.7,y-0.12,Math.sin(a)*r*0.7],
               [Math.cos(a)*r*1.15,0.02,Math.sin(a)*r*1.15],0.016,'blackMetal'); }
  H.cyl(root,'steel',0,y+0.02,0,r*0.8,r*0.8,0.015,20);           /* grate */
  return root; }
});

/* register the new types in the picker */
ITEM_TYPES.push(
  {id:'rockingChair',name:'Rocking chair'},{id:'officeChair',name:'Office chair'},
  {id:'sideboard',name:'Sideboard'},{id:'tvStand',name:'TV stand'},
  {id:'wardrobe',name:'Wardrobe'},{id:'vanity',name:'Vanity'},
  {id:'ottoman',name:'Ottoman'},{id:'chaiseLounge',name:'Chaise lounge'},
  {id:'coatRack',name:'Coat rack'},{id:'roomDivider',name:'Room divider'},
  {id:'pendantLamp',name:'Pendant lamp'},{id:'deskLamp',name:'Desk lamp'},
  {id:'lantern',name:'Lantern'},{id:'wallMirror',name:'Wall mirror'},
  {id:'wallClock',name:'Wall clock'},{id:'rug',name:'Rug'},
  {id:'plantPot',name:'Plant pot'},{id:'pictureFrame',name:'Picture frame'},
  {id:'candleHolder',name:'Candle holder'},{id:'basket',name:'Basket'},
  {id:'teapot',name:'Teapot'},{id:'plate',name:'Plate'},{id:'bottle',name:'Bottle'},
  {id:'toaster',name:'Toaster'},{id:'cuttingBoard',name:'Cutting board'},
  {id:'monitor',name:'Monitor'},{id:'laptop',name:'Laptop'},{id:'keyboard',name:'Keyboard'},
  {id:'crate',name:'Crate'},{id:'trashCan',name:'Trash can'},
  {id:'birdhouse',name:'Birdhouse'},{id:'mailbox',name:'Mailbox'},
  {id:'kettleGrill',name:'Kettle grill'}
);
/* small-item camera framing */
Object.assign(PROP_TYPES,{plate:1,bottle:1,teapot:1,candleHolder:1,lantern:1,
  keyboard:1,laptop:1,basket:1});

})();


window.WONDER_PREVIEW_TOOL="furniture";
