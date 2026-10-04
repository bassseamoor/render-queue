/* Shared tools — every one testable. Thin interactive panels around the real
 * recovered modules (inlined verbatim by the build script).
 * Panel-owned: the demo harnesses, mock SDKs, and demo documents. */
(function(){
'use strict';

function el(tag, cls, html){
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function sec(host, title, bodyHtml){
  var d = el('div','t-sec','<div class="eyebrow">'+esc(title)+'</div>'+bodyHtml);
  host.appendChild(d);
  return d;
}

/* ================= seed-rng ================= */
TOOLS.rng = { mount: function(host){
  host.innerHTML =
    '<div class="t-controls"><label>Seed <input id="r-seed" value="silver-coast" spellcheck="false"></label>'+
    '<button class="btn primary" id="r-run">Run</button></div>'+
    '<div class="t-sec"><div class="eyebrow">Same seed, same numbers — every time</div>'+
    '<div class="meta" id="r-hash"></div><div class="meta mono" id="r-stream" style="word-break:break-all"></div></div>'+
    '<div class="t-sec"><div class="eyebrow">2D noise field (the ground under generators)</div>'+
    '<canvas id="r-noise" width="240" height="120" style="width:100%;border-radius:8px"></canvas></div>'+
    '<p class="meta">Real seed-rng: mulberry32, hashSeed, hash2i, makeNoise. Nothing here uses Math.random().</p>';
  function run(){
    var s = host.querySelector('#r-seed').value || 'seed';
    var h1 = hashSeed(s), st1 = streamFrom(s), st2 = streamFrom(s);
    var a=[], b=[];
    for (var i=0;i<10;i++){ a.push(st1().toFixed(4)); b.push(st2().toFixed(4)); }
    host.querySelector('#r-hash').textContent = 'hash("'+s+'") = '+h1;
    host.querySelector('#r-stream').innerHTML =
      'run 1: '+a.join(' ')+'<br>run 2: '+b.join(' ')+'<br>'+
      (a.join()===b.join() ? '✓ identical — deterministic' : '✗ MISMATCH');
    var nz = makeNoise(s, 60, 30), cv = host.querySelector('#r-noise'), cx = cv.getContext('2d');
    var img = cx.createImageData(60,30);
    for (var y=0;y<30;y++) for (var x=0;x<60;x++){
      var v = Math.floor(nz(x,y)*255), o=(y*60+x)*4;
      img.data[o]=img.data[o+1]=img.data[o+2]=v; img.data[o+3]=255;
    }
    var off=document.createElement('canvas'); off.width=60; off.height=30;
    off.getContext('2d').putImageData(img,0,0);
    cx.imageSmoothingEnabled=false; cx.drawImage(off,0,0,240,120);
  }
  host.querySelector('#r-run').onclick = run;
  host.querySelector('#r-seed').onchange = run;
  run();
}};

/* ================= seed-codec ================= */
TOOLS.codec = { mount: function(host){
  var codec = SeedCodec.makeCodec({prefix:'DM1', controls:[
    ['hills','Hills',0,100],['trees','Trees',0,100],['water','Water',0,100]
  ]});
  host.innerHTML =
    '<div class="t-controls"><label>Hills <input id="c-hills" type="range" min="0" max="100" value="60"></label>'+
    '<label>Trees <input id="c-trees" type="range" min="0" max="100" value="40"></label>'+
    '<label>Water <input id="c-water" type="range" min="0" max="100" value="30"></label></div>'+
    '<div class="t-row"><button class="btn primary" id="c-encode">Make code</button>'+
    '<button class="btn" id="c-remix">Remix</button></div>'+
    '<div class="t-sec"><div class="eyebrow">Code</div><div class="meta mono" id="c-code" style="word-break:break-all;font-size:15px"></div></div>'+
    '<div class="t-sec"><div class="eyebrow">Decoded back</div><div class="meta" id="c-back"></div></div>'+
    '<div class="t-sec"><div class="eyebrow">Try a code</div>'+
    '<div class="t-row"><input id="c-in" spellcheck="false" placeholder="paste a code" style="flex:1">'+
    '<button class="btn" id="c-parse">Decode</button></div><div class="meta" id="c-msg"></div></div>'+
    '<p class="meta">Real seed-codec: codeOf / parseCode (strict) / remixConfig. A code packs a whole setup into one string.</p>';
  var cur = null;
  function show(code){
    host.querySelector('#c-code').textContent = code;
    var cfg = codec.parseCode(code);
    host.querySelector('#c-back').textContent = cfg ?
      'hills '+cfg.params.hills+', trees '+cfg.params.trees+', water '+cfg.params.water+' — round-trips exactly' :
      'rejected by strict parsing';
  }
  host.querySelector('#c-encode').onclick = function(){
    cur = {realm:0, layout:0, detail:0, params:{
      hills:+host.querySelector('#c-hills').value,
      trees:+host.querySelector('#c-trees').value,
      water:+host.querySelector('#c-water').value}, lens:null, locks:{}};
    // fresh random layout/detail like a real studio would
    cur.layout = Math.floor(streamFrom('layout'+Date.now())()*4294967296);
    cur.detail = Math.floor(streamFrom('detail'+Date.now())()*4294967296);
    show(codec.codeOf(cur));
  };
  host.querySelector('#c-remix').onclick = function(){
    if (!cur){ host.querySelector('#c-msg').textContent='Make a code first.'; return; }
    cur = codec.remixConfig(cur);
    show(codec.codeOf(cur));
  };
  host.querySelector('#c-parse').onclick = function(){
    var code = host.querySelector('#c-in').value.trim();
    var cfg = codec.parseCode(code);
    host.querySelector('#c-msg').textContent = cfg ?
      'Valid — hills '+cfg.params.hills+', trees '+cfg.params.trees+', water '+cfg.params.water :
      'Invalid code (wrong shape, out-of-range value, or bad lens) — rejected, not guessed.';
  };
  host.querySelector('#c-encode').onclick();
}};

/* ================= seed-console ================= */
TOOLS.console = { mount: function(host){
  host.innerHTML =
    '<p class="meta">The real Seed Console running against a tiny demo studio (a seeded pattern canvas). '+
    'Random, remix, favorites, history, and the Customize sliders are all live — this is the exact component every generator is supposed to use.</p>'+
    '<iframe id="sc-frame" title="Seed console demo" style="width:100%;height:420px;border:1px solid rgba(120,180,220,.18);border-radius:12px;background:#0a0f16"></iframe>'+
    '<p class="meta">The console mounts to its own page inside the frame, the way it was designed to. The demo studio draws a seeded medallion; the sliders reshape it.</p>';
  var src = window.SEED_CONSOLE_SRC || '';
  var demo =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<style>html,body{margin:0;background:#0a0f16;color:#cfe3f5;font-family:system-ui}'+
    '#stage{display:block;width:100%;height:340px}</style></head><body>'+
    '<canvas id="stage" width="600" height="340"></canvas>'+
    '<script>'+src+'<\/script>'+
    '<script>\n'+
    'var S={seed:"demo-1",petals:8,rings:5,twist:30};\n'+
    'function draw(){\n'+
    ' var cv=document.getElementById("stage"),cx=cv.getContext("2d");\n'+
    ' var rnd=streamFrom(S.seed),W=cv.width,H=cv.height;\n'+
    ' cx.fillStyle="#0a0f16";cx.fillRect(0,0,W,H);\n'+
    ' cx.translate(W/2,H/2);\n'+
    ' for(var r=0;r<S.rings;r++){\n'+
    '  var rad=20+r*(Math.min(W,H)/2-30)/S.rings;\n'+
    '  for(var p=0;p<S.petals;p++){\n'+
    '   var a=(p/S.petals)*Math.PI*2+r*S.twist*Math.PI/180+rnd()*0.1;\n'+
    '   var hue=(rnd()*70+180)|0;\n'+
    '   cx.fillStyle="hsla("+hue+",60%,"+(40+r*8)+"%,.85)";\n'+
    '   cx.beginPath();cx.ellipse(Math.cos(a)*rad,Math.sin(a)*rad,6+r*2,3+r, a,0,7);cx.fill();\n'+
    '  }\n'+
    ' }\n'+
    ' cx.fillStyle="#cfe3f5";cx.font="13px system-ui";cx.textAlign="center";\n'+
    ' cx.fillText("seed "+S.seed,-W/2+70,-H/2+24);\n'+
    '}\n'+
    'window.SeedConsoleAdapter={\n'+
    ' studio:"pulse-demo",title:"Demo studio",\n'+
    ' getSeed:function(){return S.seed;},\n'+
    ' setSeed:function(s){S.seed=String(s);draw();},\n'+
    ' randomSeed:function(){return "demo-"+Math.floor(streamFrom("r"+Date.now())()*1e6).toString(36);},\n'+
    ' remixSeed:function(s){return s+"~"+Math.floor(streamFrom("m"+s)*1e4).toString(36);},\n'+
    ' params:[\n'+
    '  {key:"petals",label:"Petals",min:3,max:16,step:1,get:function(){return S.petals;},set:function(v){S.petals=v|0;draw();}},\n'+
    '  {key:"rings",label:"Rings",min:1,max:9,step:1,get:function(){return S.rings;},set:function(v){S.rings=v|0;draw();}},\n'+
    '  {key:"twist",label:"Twist",min:0,max:90,step:1,get:function(){return S.twist;},set:function(v){S.twist=+v;draw();}}\n'+
    ' ]\n'+
    '};\n'+
    'SeedConsole.init(window.SeedConsoleAdapter);\n'+
    '<\/script></body></html>';
  host.querySelector('#sc-frame').srcdoc = demo;
}};

/* ================= save-shape ================= */
TOOLS.save = { mount: function(host){
  var mgr = createSaveManager({
    key:'pulse.save-demo', version:1, debounceMs:800,
    collect:function(){ return {clicks:clicks, note:host.querySelector('#s-note').value}; },
    apply:function(s){ clicks=s.clicks||0; host.querySelector('#s-note').value=s.note||'';
      host.querySelector('#s-clicks').textContent=clicks; },
    onCorrupt:function(){ host.querySelector('#s-msg').textContent='Save was corrupted — started fresh (this is the fallback working).'; },
    shouldSave:function(){ return true; }
  });
  var clicks = 0;
  host.innerHTML =
    '<div class="t-sec"><div class="eyebrow">A tiny app with autosave</div>'+
    '<div class="t-row"><button class="btn primary" id="s-click">Click me</button>'+
    '<span class="meta">clicks: <b id="s-clicks">0</b></span></div>'+
    '<label>Note <input id="s-note" placeholder="type something…"></label>'+
    '<div class="meta" id="s-msg">Edits autosave ~1s after you stop (debounced). Reload this page — your clicks and note come back.</div></div>'+
    '<div class="t-sec"><div class="eyebrow">Break it on purpose</div>'+
    '<div class="t-row"><button class="btn" id="s-corrupt">Corrupt the save</button>'+
    '<button class="btn" id="s-clear">Clear save</button></div>'+
    '<div class="meta">Corrupting writes garbage to the save slot, then reloads — watch the fallback start fresh instead of crashing.</div></div>'+
    '<p class="meta">Real save-shape: debounce, JSON snapshot, version check, corrupt-save fallback. This demo uses its own save slot so it never touches your real data.</p>';
  if (mgr.hasSave()){ try{ mgr.loadSave(); }catch(e){} }
  host.querySelector('#s-click').onclick = function(){ clicks++;
    host.querySelector('#s-clicks').textContent = clicks; mgr.saveSoon(); };
  host.querySelector('#s-note').oninput = function(){ mgr.saveSoon(); };
  host.querySelector('#s-corrupt').onclick = function(){
    try{ localStorage.setItem('pulse.save-demo','{"clicks":###garbage'); }catch(e){}
    location.reload();
  };
  host.querySelector('#s-clear').onclick = function(){ mgr.clearSave(); location.reload(); };
}};

/* ================= release-gate ================= */
TOOLS.release = { mount: function(host){
  var gates = [
    ['Version is pinned','The build carries an exact version string — no "latest" ambiguity.'],
    ['Bytes verified','What the user downloads matches what was built, byte for byte.'],
    ['Old version kept','The previous build stays reachable until the new one proves itself.'],
    ['No silent failures','Every check reports pass/fail loudly — nothing is assumed.']
  ];
  var html = '<p class="meta">The release gate is a Python script (release.py) — it can\u2019t run inside this page, so here are its actual gates as a checklist you can run through. The script itself enforces them on every real release.</p><div class="t-sec"><div class="eyebrow">The gates</div>';
  gates.forEach(function(g,i){
    html += '<label class="t-check"><input type="checkbox" id="g-'+i+'"> <b>'+esc(g[0])+'</b><span class="meta">'+esc(g[1])+'</span></label>';
  });
  html += '<div class="t-row"><button class="btn primary" id="g-run">Run the gate</button></div><div class="meta" id="g-out"></div></div>';
  host.innerHTML = html;
  host.querySelector('#g-run').onclick = function(){
    var all = gates.every(function(_,i){ return host.querySelector('#g-'+i).checked; });
    host.querySelector('#g-out').innerHTML = all ?
      '<b style="color:#7dffa8">✓ GATE PASSED</b> — this build may be announced.' :
      '<b style="color:#ffb37d">✗ GATE BLOCKED</b> — unchecked gates above. Nothing ships until every gate passes.';
  };
}};

/* ================= registry-triple ================= */
TOOLS.registry = { mount: function(host){
  host.innerHTML =
    '<p class="meta">The catalog checker, turned on itself: it validates this dashboard\u2019s own component inventory — unique ids, known categories, every tool key resolving to a real mounted tool.</p>'+
    '<div class="t-row"><button class="btn primary" id="rg-run">Check the catalog</button></div>'+
    '<div class="t-sec"><div class="eyebrow">Results</div><div class="meta mono" id="rg-out">Not run yet.</div></div>'+
    '<p class="meta">Real registry-triple logic: schema, uniqueness, and known-kind checks — the same checks that keep the App Wrangler honest. The scan/build halves need a repo checkout, so they stay in Node.</p>';
  host.querySelector('#rg-run').onclick = function(){
    var out = [], fails = 0;
    function ok(name, cond, detail){
      out.push((cond?'\u2713 ':'\u2717 ')+name+(detail?' — '+detail:''));
      if (!cond) fails++;
    }
    var ids = {};
    COMPS.forEach(function(c){
      ok('unique id: '+c.id, !ids[c.id], ids[c.id]?'DUPLICATE':'');
      ids[c.id]=1;
      var badCats = (c.cats||[]).filter(function(k){ return !CATS.some(function(x){return x.id===k;}); });
      ok('known categories: '+c.id, badCats.length===0, badCats.join(','));
      if (c.tool) ok('tool resolves: '+c.tool, !!TOOLS[c.tool]);
      ok('inMoor is a real boolean: '+c.id, typeof c.inMoor === 'boolean');
    });
    ok('inventory non-empty', COMPS.length > 0, COMPS.length+' entries');
    host.querySelector('#rg-out').innerHTML = esc(out.join('\n'))+
      '\n\n'+(fails? '\u2717 '+fails+' FAILURES' : '\u2713 ALL '+out.length+' CHECKS PASS');
  };
}};

/* ================= replace-file ================= */
TOOLS.replace = { mount: function(host){
  var doc = 'Hello, MOOR.\nThis is line two.\n';
  function sha(s){
    if (crypto.subtle){
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(function(b){
        return Array.prototype.map.call(new Uint8Array(b), function(x){return ('0'+x.toString(16)).slice(-2);}).join('');
      });
    }
    var h=0; for (var i=0;i<s.length;i++){ h=(h*31+s.charCodeAt(i))|0; }
    return Promise.resolve('fnv'+(h>>>0).toString(16));
  }
  function render(curHash){
    host.querySelector('#rp-doc').textContent = doc;
    host.querySelector('#rp-hash').textContent = 'sha256: '+curHash.slice(0,24)+'…';
    host.querySelector('#rp-expect').value = curHash;
  }
  host.innerHTML =
    '<p class="meta">The safe-edit protocol, live: an edit only lands if the file still matches the hash you saw. Try editing with the right hash (lands), then with a stale hash (refused).</p>'+
    '<div class="t-sec"><div class="eyebrow">Document</div><div class="meta mono" id="rp-doc" style="white-space:pre-wrap"></div>'+
    '<div class="meta mono" id="rp-hash"></div></div>'+
    '<div class="t-sec"><div class="eyebrow">Propose an edit</div>'+
    '<label>New content <textarea id="rp-content" rows="3" style="width:100%">Hello, MOOR.\nThis is line two — edited.\n</textarea></label>'+
    '<label>Expected hash <input id="rp-expect" class="mono" spellcheck="false" style="width:100%"></label>'+
    '<div class="t-row"><button class="btn primary" id="rp-go">Replace file</button></div>'+
    '<div class="meta" id="rp-out"></div></div>'+
    '<p class="meta">Real replace-file protocol: hash precondition → atomic write → receipt. A wrong hash changes nothing — the edit is refused, not half-applied.</p>';
  sha(doc).then(render);
  host.querySelector('#rp-go').onclick = function(){
    sha(doc).then(function(cur){
      var exp = host.querySelector('#rp-expect').value.trim();
      if (exp !== cur){
        host.querySelector('#rp-out').innerHTML =
          '<b style="color:#ffb37d">✗ REFUSED</b> — expected hash doesn\u2019t match. The document was not touched (someone else may have edited it first).';
        return;
      }
      doc = host.querySelector('#rp-content').value;
      sha(doc).then(function(h){
        render(h);
        host.querySelector('#rp-out').innerHTML =
          '<b style="color:#7dffa8">✓ REPLACED</b> — hash matched, write applied atomically. New receipt issued.';
      });
    });
  };
}};

/* ================= idempotent-upload ================= */
TOOLS.upload = { mount: function(host){
  // mock Drive SDK: in-memory file store honoring the sealed adapter's contract
  var files = [], n = 0;
  var sdk = {
    log:function(m){ logEl.innerHTML += esc(m)+'\n'; },
    http:{
      get:function(url, o){
        var m = /q=([^&]*)/.exec(url||'');
        var found = [];
        if (m){
          var q = decodeURIComponent(m[1]);
          var km = /'([^']+)'/.exec(q);
          var key = km && km[1];
          found = files.filter(function(f){ return !f.trashed && f.appProperties && f.appProperties.moor_idem===key; });
        }
        return Promise.resolve({status:200, json:{files:found}});
      },
      post:function(url, o){
        n++;
        var meta = {};
        try {
          var body = o.body||'';
          var jm = /{[^{}]*"name"[^{}]*}/.exec(body);
          if (jm) meta = JSON.parse(jm[0]);
        } catch(e){}
        if (o.json) meta = o.json;
        var f = {id:'file-'+n, name:meta.name||'untitled', appProperties:meta.appProperties||{}};
        files.push(f);
        return Promise.resolve({status:200, json:f});
      },
      patch:function(){ return Promise.resolve({status:200, json:{}}); },
      del:function(){ return Promise.resolve({status:200, json:{}}); }
    }
  };
  host.innerHTML =
    '<p class="meta">The real Drive upload adapter, running against a pretend Drive. Upload the same file twice with the same idempotency key — the second upload finds the first and sends nothing.</p>'+
    '<div class="t-controls"><label>File name <input id="u-name" value="screenshot.png"></label>'+
    '<label>Idempotency key <input id="u-key" value="shot-001" spellcheck="false"></label></div>'+
    '<div class="t-row"><button class="btn primary" id="u-go">Upload</button>'+
    '<button class="btn" id="u-retry">Upload again (retry)</button></div>'+
    '<div class="t-sec"><div class="eyebrow">Adapter log</div><div class="meta mono" id="u-log" style="white-space:pre-wrap;min-height:80px"></div></div>'+
    '<div class="t-sec"><div class="eyebrow">Pretend Drive</div><div class="meta mono" id="u-files">(empty)</div></div>'+
    '<p class="meta">Real idempotent-upload: lookup-before-write on the moor_idem key. Retries are safe — no duplicates, ever.</p>';
  var logEl = host.querySelector('#u-log');
  function showFiles(){
    host.querySelector('#u-files').textContent = files.length ?
      files.map(function(f){return f.id+'  '+f.name+'  key='+(f.appProperties.moor_idem||'?');}).join('\n') : '(empty)';
  }
  function upload(){
    var name = host.querySelector('#u-name').value, key = host.querySelector('#u-key').value;
    DriveUpload.invoke('upload', {name:name, idempotencyKey:key, mimeType:'image/png', bytesB64:'iVBORw0KGgo='},
      {traceId:'demo'}, sdk).then(function(r){
        logEl.innerHTML += (r.deduplicated ? '→ deduplicated, returned '+r.fileId+' (nothing sent)\n'
                                           : '→ uploaded as '+r.fileId+'\n');
        showFiles();
      });
  }
  host.querySelector('#u-go').onclick = upload;
  host.querySelector('#u-retry').onclick = upload;
}};

})();
