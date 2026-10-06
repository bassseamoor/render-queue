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
