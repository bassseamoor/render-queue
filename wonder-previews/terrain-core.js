
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


/* Terrain sculpting — thin interactive panel around the real terrain-core module.
 * Uses: TerrainCore.generate / brush / pack / unpack (inlined verbatim).
 * Panel-owned: the 2D heightmap painter, pointer->brush wiring, save/load UI. */
(function(){
'use strict';
TOOLS.terrain = {
  mount: function(host){
    var TC = window.TerrainCore;
    var data = TC.generate(new URLSearchParams(location.search).get('seed')||'silver-coast', 'island', 38);
    var tool = 'raise', radius = 24, strength = 4, target = 6, biome = 1;

    host.innerHTML =
      '<div class="t-controls">'+
        '<label>Seed <input id="t-seed" value="silver-coast" spellcheck="false"></label>'+
        '<label>Shape <select id="t-preset"><option value="island">island</option><option value="mountains">mountains</option><option value="valley">valley</option><option value="flat">flat</option></select></label>'+
        '<label>Relief <input id="t-relief" type="range" min="10" max="70" value="38"><span id="t-relief-v">38</span></label>'+
        '<button class="btn primary" id="t-gen">Generate</button>'+
      '</div>'+
      '<div class="t-main">'+
        '<canvas id="t-cv" width="405" height="405"></canvas>'+
        '<div class="t-side">'+
          '<div class="eyebrow">Brush</div>'+
          '<div class="t-brushes" id="t-brushes"></div>'+
          '<label>Size <input id="t-radius" type="range" min="6" max="60" value="24"><span id="t-radius-v">24</span></label>'+
          '<label>Strength <input id="t-strength" type="range" min="1" max="12" value="4"><span id="t-strength-v">4</span></label>'+
          '<label>Flatten target <input id="t-target" type="range" min="-40" max="120" value="6"><span id="t-target-v">6</span></label>'+
          '<label>Paint biome <select id="t-biome"><option value="0">0 \u2014 bare</option><option value="1" selected>1 \u2014 grass</option><option value="2">2 \u2014 forest</option><option value="3">3 \u2014 rock</option><option value="4">4 \u2014 snow</option></select></label>'+
          '<div class="t-stats meta" id="t-stats"></div>'+
          '<div class="t-row"><button class="btn" id="t-save">Save terrain</button>'+
          '<label class="btn">Load terrain<input id="t-load" type="file" accept=".json" hidden></label></div>'+
          '<p class="meta">Drag on the land to sculpt. Heights clamp to \u221240\u2026120 m.</p>'+
        '</div>'+
      '</div>';

    host.querySelector('#t-seed').value=data.seed;
    var cv = host.querySelector('#t-cv'), ctx = cv.getContext('2d');
    var off = document.createElement('canvas'); off.width = off.height = 81;
    var octx = off.getContext('2d'), img = octx.createImageData(81, 81);

    function ramp(h){
      var r,g,b;
      if (h < 0){ var t=Math.min(1,-h/40); r=10+20*t; g=40+60*t; b=110+80*t; }
      else if (h < 14){ var t=h/14; r=194-40*t; g=178-20*t; b=120-40*t; }
      else if (h < 45){ var t=(h-14)/31; r=110-30*t; g=150-60*t; b=80-30*t; }
      else { var t=Math.min(1,(h-45)/55); r=120+120*t; g=100+130*t; b=70+160*t; }
      return [r|0,g|0,b|0];
    }
    var biomeTint = [[0,0,0,0],[60,140,60,46],[30,90,40,70],[120,110,100,60],[230,240,250,70]];

    function paint(){
      if(parent!==window){try{parent.postMessage({type:'moor:output',detail:{title:'Terrain',source:{component:'terrain-core'},payload:{terrain:TC.pack(data)}}},location.origin);}catch(_) {}}
      var d = img.data, mn=1e9, mx=-1e9;
      for (var j=0;j<81;j++) for (var i=0;i<81;i++){
        var q=j*81+i, h=data.heights[q], c=ramp(h), t=biomeTint[data.biomes[q]]||biomeTint[0];
        var o=q*4;
        d[o]=c[0]; d[o+1]=c[1]; d[o+2]=c[2]; d[o+3]=255;
        if (t[3]){ d[o]=(d[o]*(255-t[3])+t[0]*t[3])/255; d[o+1]=(d[o+1]*(255-t[3])+t[1]*t[3])/255; d[o+2]=(d[o+2]*(255-t[3])+t[2]*t[3])/255; }
        if (h<mn)mn=h; if (h>mx)mx=h;
      }
      octx.putImageData(img,0,0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0,0,405,405);
      ctx.drawImage(off,0,0,405,405);
      host.querySelector('#t-stats').textContent =
        'seed \u201c'+data.seed+'\u201d \u00B7 '+data.preset+' \u00B7 relief '+data.relief+
        ' \u00B7 height '+mn.toFixed(0)+'\u2026'+mx.toFixed(0)+' m \u00B7 81\u00D781 cells';
    }

    var brushes = host.querySelector('#t-brushes');
    ['raise','lower','flatten','smooth','paint'].forEach(function(b){
      var btn = document.createElement('button');
      btn.className = 'btn' + (b===tool ? ' primary' : '');
      btn.textContent = b[0].toUpperCase()+b.slice(1);
      btn.onclick = function(){ tool=b;
        Array.prototype.forEach.call(brushes.children, function(x){x.classList.remove('primary');});
        btn.classList.add('primary'); };
      brushes.appendChild(btn);
    });

    function stroke(ev){
      var r = cv.getBoundingClientRect();
      var gx = (ev.clientX-r.left)/r.width*80, gz = (ev.clientY-r.top)/r.height*80;
      var wx = gx/80*256-128, wz = gz/80*256-128;
      if (TC.brush(data, wx, wz, {tool:tool, radius:radius, strength:strength, target:target, biome:biome})) paint();
    }
    var down = false;
    cv.addEventListener('pointerdown', function(ev){ down=true; cv.setPointerCapture(ev.pointerId); stroke(ev); });
    cv.addEventListener('pointermove', function(ev){ if(down) stroke(ev); });
    cv.addEventListener('pointerup', function(){ down=false; });

    function bindNum(id, vid, fn){
      var el = host.querySelector('#'+id);
      el.addEventListener('input', function(){ host.querySelector('#'+vid).textContent = el.value; fn(+el.value); });
    }
    bindNum('t-relief','t-relief-v', function(){});
    bindNum('t-radius','t-radius-v', function(v){ radius=v; });
    bindNum('t-strength','t-strength-v', function(v){ strength=v; });
    bindNum('t-target','t-target-v', function(v){ target=v; });
    host.querySelector('#t-preset').addEventListener('change', function(){});
    host.querySelector('#t-biome').addEventListener('change', function(ev){ biome=+ev.target.value; });

    host.querySelector('#t-gen').onclick = function(){
      var seed = host.querySelector('#t-seed').value.trim() || 'silver-coast';
      var preset = host.querySelector('#t-preset').value;
      var relief = +host.querySelector('#t-relief').value;
      data = TC.generate(seed, preset, relief);
      paint();
    };
    host.querySelector('#t-save').onclick = function(){
      var blob = new Blob([JSON.stringify(TC.pack(data))], {type:'application/json'});
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'terrain-'+data.seed+'.json';
      a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); }, 4000);
    };
    host.querySelector('#t-load').addEventListener('change', function(ev){
      var f = ev.target.files[0]; if(!f) return;
      var rd = new FileReader();
      rd.onload = function(){
        try { data = TC.unpack(JSON.parse(rd.result)); paint(); toast('Terrain loaded'); }
        catch(err){ toast('Load failed: '+err.message); }
      };
      rd.readAsText(f); ev.target.value='';
    });

    paint();
  },
  unmount: function(){ /* pure computation; nothing to stop */ }
};
})();


window.WONDER_PREVIEW_TOOL="terrain";
