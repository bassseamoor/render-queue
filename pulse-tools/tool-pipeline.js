/* Pipeline inspector — see inside the terrain generator without reading code.
 * Top: the real terrain-core pipeline as equation boxes (derived from the
 * actual generate() source, shown as math, not code).
 * Bottom: add your own layers — real seeded math applied to the real output.
 * Added layers are panel composition (clearly labeled); the base pipeline is
 * the untouched component. Everything stays deterministic: same seed +
 * same layers = same land. */
(function(){
'use strict';

function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

var STAGES = [
  {t:'Seed → hash', e:'h = FNV-1a(seed)', d:'Your seed word becomes one integer. Same word, same integer, forever.'},
  {t:'Lattice random', e:'r(x,z) = hash(x, z, h)', d:'Every integer grid point gets a fixed pseudo-random value from the hash.'},
  {t:'Value noise', e:'n(x,z) = smooth blend of r() at 4 corners', d:'Smooth interpolation between lattice values — rolling hills, no blockiness.'},
  {t:'fBm × 5 octaves', e:'f = Σ n(x·3·2ᵏ, z·3·2ᵏ)·(½)ᵏ / Σ(½)ᵏ', d:'Five layers of noise, each twice as detailed and half as strong. Big shapes + fine detail.'},
  {t:'Shape', e:'h = (f − 0.38) · relief · 2  [+ preset]', d:'Centers the noise, scales by relief. Island adds a radial falloff; mountains fold it; valley carves.'},
  {t:'Clamp', e:'h = clamp(h, −40, 120)', d:'Heights stay in the valid −40…120 m band. What the saver accepts.'}
];

var LAYER_DEFS = [
  {id:'terrace', name:'Terrace', params:[['steps','Steps',2,12,6]],
   eq:function(p){ return 'h = ⌊h/s⌋·s + s/2,  s = range/'+p.steps; },
   make:function(p){ var s = 160/p.steps;
     return function(h){ return Math.floor(h/s)*s + s/2; }; }},
  {id:'multiply', name:'Amplify', params:[['k','Strength',0.2,3,1.5]],
   eq:function(p){ return 'h = h · '+p.k; },
   make:function(p){ return function(h){ return h*p.k; }; }},
  {id:'power', name:'Power curve', params:[['e','Exponent',0.3,3,1.6]],
   eq:function(p){ return 'h = sign(h)·|h| ^ '+p.e+'  (normalized)'; },
   make:function(p){ return function(h){ var s=h<0?-1:1; return s*Math.pow(Math.abs(h)/120, p.e)*120; }; }},
  {id:'ridge', name:'Ridge fold', params:[['t','Fold at',-40,120,20]],
   eq:function(p){ return 'h = '+p.t+' − |h − '+p.t+'|'; },
   make:function(p){ return function(h){ return p.t - Math.abs(h-p.t); }; }},
  {id:'smooth', name:'Smooth', params:[['r','Radius',1,4,2]],
   eq:function(p){ return 'h = mean of neighbors in radius '+p.r; },
   make:function(p){ return {smooth:p.r}; }},
  {id:'grain', name:'Grain', params:[['amt','Amount',0,30,8]],
   eq:function(p){ return 'h = h + (hash(x,z,seed) − ½) · '+p.amt; },
   make:function(p){ var amt=p.amt;
     return {grain:function(h,x,z,hs){ return h + (hs(x,z)-0.5)*amt; }}; }}
];

TOOLS.pipeline = { mount: function(host){
  var TC = window.TerrainCore;
  var seed='silver-coast', preset='island', relief=38;
  var layers = []; // {def, params:{}}
  var data = null;

  host.innerHTML =
    '<div class="t-sec"><div class="eyebrow">Inside the generator — the real pipeline, as math</div>'+
    '<div class="t-pipe" id="p-stages"></div>'+
    '<p class="meta">This is what generate() actually does, step by step. No code — just the equations.</p></div>'+
    '<div class="t-sec"><div class="eyebrow">Your layers <span class="meta">(panel composition — seeded, applied after the real pipeline)</span></div>'+
    '<div class="t-row" id="p-add"></div>'+
    '<div id="p-list"></div></div>'+
    '<div class="t-controls"><label>Seed <input id="p-seed" value="silver-coast" spellcheck="false"></label>'+
    '<label>Shape <select id="p-preset"><option>island</option><option>mountains</option><option>valley</option><option>flat</option></select></label>'+
    '<button class="btn primary" id="p-run">Rebuild</button></div>'+
    '<canvas id="p-cv" width="405" height="405" style="width:100%;max-width:405px;border-radius:12px"></canvas>'+
    '<div class="meta" id="p-stats"></div>';

  var stHost = host.querySelector('#p-stages');
  STAGES.forEach(function(s,i){
    var d = document.createElement('div');
    d.className = 't-stage';
    d.innerHTML = '<div class="t-stage-n">'+(i+1)+'</div><b>'+esc(s.t)+'</b>'+
      '<div class="t-eq">'+esc(s.e)+'</div><div class="meta">'+esc(s.d)+'</div>';
    stHost.appendChild(d);
    if (i < STAGES.length-1){
      var ar = document.createElement('div'); ar.className='t-arrow'; ar.textContent='↓';
      stHost.appendChild(ar);
    }
  });

  var addHost = host.querySelector('#p-add');
  LAYER_DEFS.forEach(function(def){
    var b = document.createElement('button');
    b.className='btn'; b.textContent='+ '+def.name;
    b.onclick = function(){
      var p = {};
      def.params.forEach(function(pr){ p[pr[0]] = pr[3]; });
      layers.push({def:def, params:p});
      renderLayers(); rebuild();
    };
    addHost.appendChild(b);
  });

  function renderLayers(){
    var list = host.querySelector('#p-list');
    list.innerHTML='';
    if (!layers.length){
      list.innerHTML='<p class="meta">No layers — pure generator output. Add one above.</p>';
      return;
    }
    layers.forEach(function(L, i){
      var d = document.createElement('div');
      d.className='t-layer';
      var ph = '<b>'+esc(L.def.name)+'</b> <span class="t-eq">'+esc(L.def.eq(L.params))+'</span><div class="t-row">';
      L.def.params.forEach(function(pr){
        ph += '<label>'+esc(pr[1])+' <input type="range" min="'+pr[2]+'" max="'+pr[3]+'" step="any" value="'+L.params[pr[0]]+'" data-k="'+pr[0]+'"></label>';
      });
      ph += '</div><div class="t-row">'+
        '<button class="btn" data-a="up" '+(i===0?'disabled':'')+'>↑</button>'+
        '<button class="btn" data-a="dn" '+(i===layers.length-1?'disabled':'')+'>↓</button>'+
        '<button class="btn" data-a="rm">Remove</button></div>';
      d.innerHTML = ph;
      d.querySelectorAll('input[type=range]').forEach(function(inp){
        inp.oninput = function(){ L.params[inp.getAttribute('data-k')] = +inp.value; renderLayers(); rebuild(); };
      });
      d.querySelectorAll('button').forEach(function(btn){
        btn.onclick = function(){
          var a = btn.getAttribute('data-a');
          if (a==='rm') layers.splice(i,1);
          else if (a==='up' && i>0){ layers[i-1]=layers.splice(i,1,layers[i-1])[0]; }
          else if (a==='dn' && i<layers.length-1){ layers[i+1]=layers.splice(i,1,layers[i+1])[0]; }
          renderLayers(); rebuild();
        };
      });
      list.appendChild(d);
    });
  }

  var cv = host.querySelector('#p-cv'), ctx = cv.getContext('2d');
  var off = document.createElement('canvas'); off.width=off.height=81;
  var octx = off.getContext('2d'), img = octx.createImageData(81,81);

  function rebuild(){
    seed = host.querySelector('#p-seed').value || 'seed';
    preset = host.querySelector('#p-preset').value;
    data = TC.generate(seed, preset, relief);
    // apply layers (deterministic)
    var hs = null;
    layers.forEach(function(L){
      var fn = L.def.make(L.params);
      if (fn.smooth){
        var r = Math.round(fn.smooth), src = data.heights.slice(), N = TC.N;
        for (var z=0;z<=N;z++) for (var x=0;x<=N;x++){
          var sum=0,n=0;
          for (var dz=-r;dz<=r;dz++) for (var dx=-r;dx<=r;dx++){
            var ax=x+dx, az=z+dz;
            if (ax>=0&&ax<=N&&az>=0&&az<=N){ sum+=src[az*(N+1)+ax]; n++; }
          }
          data.heights[z*(N+1)+x] = sum/n;
        }
      } else if (fn.grain){
        if (!hs){ var h0=2166136261; for (var c=0;c<seed.length;c++) h0=Math.imul(h0^seed.charCodeAt(c),16777619);
          hs = function(x,z){ var hh=Math.imul(x,374761393)^Math.imul(z,668265263)^h0;
            hh=Math.imul(hh^(hh>>>13),1274126177); return ((hh^(hh>>>16))>>>0)/4294967295; }; }
        var N2 = TC.N;
        for (var z2=0;z2<=N2;z2++) for (var x2=0;x2<=N2;x2++){
          var q=z2*(N2+1)+x2;
          data.heights[q] = fn.grain(data.heights[q], x2, z2, hs);
        }
      } else {
        for (var i=0;i<data.heights.length;i++) data.heights[i] = fn(data.heights[i]);
      }
    });
    // clamp to the component's valid band (honest: the saver would reject outside)
    for (var k=0;k<data.heights.length;k++){
      if (data.heights[k] < -40) data.heights[k] = -40;
      if (data.heights[k] > 120) data.heights[k] = 120;
    }
    paint();
  }

  function ramp(h){
    var r,g,b;
    if (h < 0){ var t=Math.min(1,-h/40); r=10+20*t; g=40+60*t; b=110+80*t; }
    else if (h < 14){ var t2=h/14; r=194-40*t2; g=178-20*t2; b=120-40*t2; }
    else if (h < 45){ var t3=(h-14)/31; r=110-30*t3; g=150-60*t3; b=80-30*t3; }
    else { var t4=Math.min(1,(h-45)/55); r=120+120*t4; g=100+130*t4; b=70+160*t4; }
    return [r|0,g|0,b|0];
  }
  function paint(){
    var d = img.data, mn=1e9, mx=-1e9;
    for (var j=0;j<81;j++) for (var i=0;i<81;i++){
      var q=j*81+i, h=data.heights[q], c=ramp(h), o=q*4;
      d[o]=c[0]; d[o+1]=c[1]; d[o+2]=c[2]; d[o+3]=255;
      if (h<mn)mn=h; if (h>mx)mx=h;
    }
    octx.putImageData(img,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,405,405);
    ctx.drawImage(off,0,0,405,405);
    host.querySelector('#p-stats').textContent =
      '“'+seed+'” · '+preset+' · '+layers.length+' layer'+(layers.length===1?'':'s')+
      ' · height '+mn.toFixed(0)+'…'+mx.toFixed(0)+' m — same seed + layers, same land, every time.';
  }

  host.querySelector('#p-run').onclick = rebuild;
  host.querySelector('#p-seed').onchange = rebuild;
  host.querySelector('#p-preset').onchange = rebuild;
  renderLayers(); rebuild();
}};

})();
