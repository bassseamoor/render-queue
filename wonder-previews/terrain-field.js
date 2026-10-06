
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


window.FIELD_GLSL = "uniform vec3 seedOff;\nuniform vec4 uEditA[48];   /* xyz = direction, w = radius (radians) */\nuniform float uEditB[48]; /* delta (meters) */\nuniform int uEditCount;\nfloat hash(vec3 p){ p=fract(p*0.3183099+seedOff); p*=17.0;\n  return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }\nfloat vnoise(vec3 p){\n  vec3 i=floor(p),f=fract(p); vec3 u=f*f*(3.0-2.0*f);\n  return mix(mix(mix(hash(i),hash(i+vec3(1.,0.,0.)),u.x),\n                 mix(hash(i+vec3(0.,1.,0.)),hash(i+vec3(1.,1.,0.)),u.x),u.y),\n             mix(mix(hash(i+vec3(0.,0.,1.)),hash(i+vec3(1.,0.,1.)),u.x),\n                 mix(hash(i+vec3(0.,1.,1.)),hash(i+vec3(1.,1.,1.)),u.x),u.y),u.z);\n}\nfloat fbm4(vec3 p){ float v=0.0,a=0.5;\n  for(int i=0;i<4;i++){ v+=a*vnoise(p); p=p*2.03+vec3(1.7); a*=0.5; } return v; }\nfloat fbm2(vec3 p){ float v=0.0,a=0.5;\n  for(int i=0;i<2;i++){ v+=a*vnoise(p); p=p*2.11+vec3(3.1); a*=0.5; } return v; }\nfloat ridge(vec3 p){ float n=vnoise(p); n=1.0-abs(n*2.0-1.0); return n*n; }\nfloat fbmR(vec3 p){ float v=0.0,a=0.55;\n  for(int i=0;i<5;i++){ v+=a*ridge(p); p=p*2.13+vec3(1.7,9.2,4.1); a*=0.5; } return v; }\nfloat fieldRaw(vec3 sp){\n  /* ridged fBm + domain warp: real ridgelines and valleys, not pudding */\n  vec3 q=vec3(fbm2(sp*2.0),fbm2(sp*2.0+vec3(5.2,1.3,2.8)),fbm2(sp*2.0+vec3(9.1,4.7,8.3)));\n  float warp=fbmR(sp*3.0+0.9*(q-0.5));\n  float base=fbm4(sp*1.6+0.35*(q-0.5));\n  return clamp(mix(base,warp,0.72),0.0,1.0);\n}\n/* multi-scale relief. Lives in the VERTICES (shared by terrain AND props),\n   never as fragment-shader normal perturbation. */\nuniform float uMicroK;\nfloat microH(vec2 mp){\n  float h=(fbm4(vec3(mp*0.025,3.7))-0.5)*36.0;\n  h+=(fbm2(vec3(mp*0.11,9.1))-0.5)*9.0;\n  h+=(vnoise(vec3(mp*0.45,4.2))-0.5)*2.4;\n  /* ridged spine: sharp crests at ~25m wavelength for real ridgelines */\n  float r=0.0,a=0.5;vec2 rp=mp*0.04;\n  for(int i=0;i<3;i++){ float n=vnoise(vec3(rp,7.7)); n=1.0-abs(n*2.0-1.0);\n    r+=a*n*n; rp=rp*2.17+vec2(3.1,7.7); a*=0.5; }\n  h+=(r-0.29)*34.0;\n  return h*uMicroK;\n}\n/* persistent brush edits, addressed by direction */\nfloat editDelta(vec3 sp){\n  float d=0.0;\n  for(int i=0;i<48;i++){\n    if(i>=uEditCount)break;\n    vec4 e=uEditA[i];\n    float ang=acos(clamp(dot(sp,e.xyz),-1.0,1.0));\n    float k=clamp(1.0-ang/max(e.w,1e-7),0.0,1.0);\n    d+=uEditB[i]*k*k*(3.0-2.0*k);\n  }\n  return d;\n}\n";


/* Detailed terrain — WebGL2 host around the real terrain-field GLSL.
 * Uses: FIELD_GLSL (inlined verbatim), uniforms seedOff / uEditA[48] / uEditB[48]
 *       / uEditCount / uMicroK, and the fieldRaw+microH+editDelta functions.
 * Host pattern copied from the component's example-webgl.html (proven).
 * Panel-owned: uniform controls, click-to-place brush edits (first UI ever
 * for the 48 edit slots), export-edits-as-JSON (panel format, not the
 * component's — the component defines no save format). */
(function(){
'use strict';
TOOLS.field = {
  mount: function(host){
    host.innerHTML =
      '<div class="t-controls">'+
        '<label>Seed <input id="f-seed" type="number" value="4242" style="width:90px"></label>'+
        '<label>Fine detail <input id="f-micro" type="range" min="0" max="1" step="0.01" value="1"><span id="f-micro-v">1.00</span></label>'+
        '<button class="btn primary" id="f-render">Render</button>'+
      '</div>'+
      '<div class="t-main">'+
        '<canvas id="f-cv" width="360" height="360"></canvas>'+
        '<div class="t-side">'+
          '<div class="eyebrow">Brush edits (up to 48)</div>'+
          '<p class="meta">Click the preview to aim. Then set size and lift, and add the edit.</p>'+
          '<label>Edit size <input id="f-erad" type="range" min="2" max="40" value="12"><span id="f-erad-v">12\u00B0</span></label>'+
          '<label>Lift <input id="f-edelta" type="range" min="-60" max="60" value="20"><span id="f-edelta-v">+20 m</span></label>'+
          '<div class="t-row"><button class="btn" id="f-add">Add edit</button><button class="btn" id="f-clear">Clear edits</button></div>'+
          '<div class="meta" id="f-estat">0 of 48 edit slots used</div>'+
          '<div class="t-row"><button class="btn" id="f-exp">Copy edits as JSON</button></div>'+
          '<p class="meta">Height = ridged terrain + fine detail \u00D7 detail + your edits. Colors are a display ramp; the component outputs meters.</p>'+
        '</div>'+
      '</div>';

    var cv = host.querySelector('#f-cv');
    var gl = cv.getContext('webgl2', {preserveDrawingBuffer:true});
    if (!gl) { host.innerHTML = '<div class="empty">This device has no WebGL2, which the terrain shader needs.</div>'; return; }

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }');
    gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision highp float;\n' + window.FIELD_GLSL +
      '\nuniform vec2 uSeed;\nvoid main(){\n'+
      '  vec2 xy = (gl_FragCoord.xy / 360.0 - 0.5) * 2.0;\n'+
      '  vec3 sp = normalize(vec3(xy.x, 1.0, xy.y));\n'+
      '  float h = fieldRaw(sp + vec3(uSeed, 0.0));\n'+
      '  h += microH((gl_FragCoord.xy / 360.0 - 0.5) * 200.0);\n'+
      '  h += editDelta(sp);\n'+
      '  float t = clamp(h / 60.0 + 0.5, 0.0, 1.0);\n'+
      '  vec3 col = mix(vec3(0.05,0.10,0.16), vec3(0.55,0.75,0.55), smoothstep(0.35,0.6,t));\n'+
      '  col = mix(col, vec3(0.9,0.92,0.95), smoothstep(0.6,0.85,t));\n'+
      '  col = mix(vec3(0.10,0.16,0.28), col, smoothstep(0.28,0.35,t));\n'+
      '  gl_FragColor = vec4(col, 1.0);\n}');
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      host.innerHTML = '<div class="empty">Shader failed: '+gl.getShaderInfoLog(fs)+'</div>'; return;
    }
    var pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uSeed = gl.getUniformLocation(pr, 'uSeed');
    var uSeedOff = gl.getUniformLocation(pr, 'seedOff');
    var uA = gl.getUniformLocation(pr, 'uEditA'), uB = gl.getUniformLocation(pr, 'uEditB');
    var uC = gl.getUniformLocation(pr, 'uEditCount'), uM = gl.getUniformLocation(pr, 'uMicroK');

    var editA = new Float32Array(48*4), editB = new Float32Array(48), editCount = 0;
    var aim = [0, 1, 0]; // unit direction of next edit

    function seedTuple(s){ return [(s%100)*0.13, (s%77)*0.29, (s%53)*0.41]; }
    function render(){
      var s = parseInt(host.querySelector('#f-seed').value, 10) || 0;
      var st = seedTuple(s);
      gl.uniform2f(uSeed, st[0], st[1]);
      gl.uniform3f(uSeedOff, st[0], st[1], st[2]);
      gl.uniform4fv(uA, editA); gl.uniform1fv(uB, editB);
      gl.uniform1i(uC, editCount);
      gl.uniform1f(uM, parseFloat(host.querySelector('#f-micro').value));
      gl.viewport(0, 0, 360, 360);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      host.querySelector('#f-estat').textContent = editCount + ' of 48 edit slots used';
    }

    cv.addEventListener('click', function(ev){
      var r = cv.getBoundingClientRect();
      var xy = [((ev.clientX-r.left)/r.width - 0.5)*2, ((ev.clientY-r.top)/r.height - 0.5)*2];
      var v = [xy[0], 1, xy[1]], l = Math.hypot(v[0],v[1],v[2]);
      aim = [v[0]/l, v[1]/l, v[2]/l];
      render();
    });

    host.querySelector('#f-micro').addEventListener('input', function(ev){
      host.querySelector('#f-micro-v').textContent = (+ev.target.value).toFixed(2); render();
    });
    host.querySelector('#f-erad').addEventListener('input', function(ev){
      host.querySelector('#f-erad-v').textContent = ev.target.value + '\u00B0';
    });
    host.querySelector('#f-edelta').addEventListener('input', function(ev){
      var v = +ev.target.value;
      host.querySelector('#f-edelta-v').textContent = (v>=0?'+':'') + v + ' m';
    });
    host.querySelector('#f-render').onclick = render;
    host.querySelector('#f-add').onclick = function(){
      if (editCount >= 48) { toast('All 48 edit slots are full'); return; }
      var rad = (+host.querySelector('#f-erad').value) * Math.PI/180;
      var d = +host.querySelector('#f-edelta').value;
      editA.set([aim[0], aim[1], aim[2], rad], editCount*4);
      editB[editCount] = d;
      editCount++;
      render();
    };
    host.querySelector('#f-clear').onclick = function(){
      editA = new Float32Array(48*4); editB = new Float32Array(48); editCount = 0; render();
    };
    host.querySelector('#f-exp').onclick = function(){
      var out = [];
      for (var i=0;i<editCount;i++) out.push({dir:[+editA[i*4].toFixed(4),+editA[i*4+1].toFixed(4),+editA[i*4+2].toFixed(4)], radiusRad:+editA[i*4+3].toFixed(4), deltaM:editB[i]});
      var txt = JSON.stringify({format:'pulse-v2/terrain-field-edits/1', edits:out}, null, 1);
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){ toast('Edits copied ('+out.length+')'); });
      else toast('Clipboard unavailable');
    };

    this._gl = gl;
    render();
  },
  unmount: function(){ /* context dies with the canvas */ }
};
})();


window.WONDER_PREVIEW_TOOL="field";
