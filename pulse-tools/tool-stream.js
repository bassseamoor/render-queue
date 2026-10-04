/* MOOR Stream — the build-anything stream (v1).
 * One-way water: there's always a result on screen, never a blank page.
 * You say what you want (talk or type) — no questions are ever asked.
 * The stream infers the intent and lands N scenes below (3 by default;
 * ask for 6, 12, 40 — you get what you ask for, never throttled).
 * Scenes are clean renders, no cards, no chrome: boom, boom, boom.
 * Tap a scene for ingredients (components + seeds, all the way down).
 * Dev (you) gets the kitchen: spec JSON, rewire, player-visible flags.
 * Players customize everything, control nothing structural.
 * Every scene is a real seeded composition naming real components —
 * previews are procedural, deterministic, and honest about what they are. */
(function(){
'use strict';

var COMPONENTS = {
  'terrain-core':      {label:'Terrain',       words:['terrain','mountain','hill','valley','canyon','desert','landscape']},
  'vegetation':        {label:'Vegetation',    words:['forest','trees','woods','jungle','plants','vegetation','pine']},
  'softbody-creatures':{label:'Creatures',     words:['creature','animal','beast','walker','herd','monster','deer']},
  'ambience-engine':   {label:'Ambience',      words:['sky','clouds','atmosphere','fog','mist','ambience','sunset','night']},
  'mesh-builder':      {label:'Structures',    words:['city','buildings','structures','tower','ruins','cabin','house']},
  'water':             {label:'Water',         words:['ocean','sea','lake','water','river','pond','shore','beach']}
};
var MOODS = {
  day:    {sky:['#7fb2e5','#cfe8f7'], sun:'#fff3c4', ground:['#5a7d4a','#3d5a34'], far:['#8a9bb0','#6b7d94']},
  sunset: {sky:['#3a2b5c','#e0784a'], sun:'#ffd9a0', ground:['#4a3d33','#2e2620'], far:['#5c4458','#3e2f42']},
  night:  {sky:['#060a18','#16233f'], sun:'#e8ecf5', ground:['#1d2b22','#111a15'], far:['#2a3648','#1a2330']},
  alien:  {sky:['#1a4a3a','#7fe0a8'], sun:'#d0ffe0', ground:['#2e6b4f','#1a4030'], far:['#3a7d6b','#265448']},
  misty:  {sky:['#9aa5ad','#d5dbdd'], sun:'#f2f2ee', ground:['#5c665e','#3e453f'], far:['#a8b0b2','#8a9294']},
  desert: {sky:['#6fb7e8','#f7e3b0'], sun:'#fff0c0', ground:['#c2a061','#9a7a44'], far:['#b09a7a','#8a7558']}
};
var MOOD_WORDS = {dark:'night', bright:'day', alien:'alien', sunset:'sunset', night:'night',
  misty:'misty', foggy:'misty', desert:'desert', sunny:'day', moody:'sunset'};
var COUNT_WORDS = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  twelve:12,twenty:20,forty:40};

function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

/* 1D value noise for ridgelines */
function makeRidge(rnd){
  var p=new Float32Array(256);
  for (var i=0;i<256;i++) p[i]=rnd();
  function n(x){
    var xi=Math.floor(x), xf=x-xi;
    var a=p[xi&255], b=p[(xi+1)&255];
    var u=xf*xf*(3-2*xf);
    return a+(b-a)*u;
  }
  return function(x){
    return n(x)*0.55+n(x*2.7)*0.28+n(x*6.1)*0.17;
  };
}

function parseInput(text){
  var t=' '+text.toLowerCase()+' ', count=3, mood='day', comps=[], water=false;
  var m=t.match(/\b(\d+)\b/);
  if (m) count=Math.max(1,Math.min(40,parseInt(m[1],10)));
  else {
    for (var w in COUNT_WORDS) if (t.indexOf(w)>=0){ count=COUNT_WORDS[w]; break; }
  }
  for (var mw in MOOD_WORDS) if (t.indexOf(mw)>=0){ mood=MOOD_WORDS[mw]; break; }
  if (t.match(/\b(sunset)\b/)) mood='sunset';
  if (t.match(/\b(night|midnight)\b/)) mood='night';
  for (var cid in COMPONENTS){
    var c=COMPONENTS[cid];
    for (var i=0;i<c.words.length;i++) if (t.indexOf(c.words[i])>=0){ comps.push(cid); break; }
  }
  if (comps.indexOf('water')>=0){ water=true; comps.splice(comps.indexOf('water'),1); }
  if (!comps.length) comps=['terrain-core','ambience-engine'];
  if (comps.indexOf('ambience-engine')<0) comps.push('ambience-engine');
  return {count:count, mood:mood, comps:comps, water:water, raw:text};
}

function makeScene(seedBase, idx, parsed, variant){
  var rnd=streamFrom('stream:'+seedBase+':'+idx+(variant||''));
  var seedHex=Math.floor(rnd()*0xffffffff).toString(16);
  return {
    seed: seedHex.slice(0,8), comps: parsed.comps.slice(), mood: parsed.mood,
    water: parsed.water, caption: parsed.raw || 'starter',
    settled:false, playerVisible:true, n:idx,
    treeSeed: Math.floor(rnd()*1e9), creatureSeed: Math.floor(rnd()*1e9)
  };
}

function renderScene(cv, spec){
  var ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
  var rnd=streamFrom('stream:render:'+spec.seed);
  var mood=MOODS[spec.mood]||MOODS.day;
  // sky
  var sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,mood.sky[0]); sky.addColorStop(1,mood.sky[1]);
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  // sun/moon
  var sx=W*(0.2+rnd()*0.6), sy=H*(0.12+rnd()*0.2), sr=H*0.07;
  ctx.fillStyle=mood.sun; ctx.globalAlpha=0.9;
  ctx.beginPath(); ctx.arc(sx,sy,sr,0,7); ctx.fill(); ctx.globalAlpha=1;
  var ridge=makeRidge(rnd);
  // far mountains
  ctx.fillStyle=mood.far[0];
  ctx.beginPath(); ctx.moveTo(0,H);
  for (var x=0;x<=W;x+=4){
    var y=H*0.42+ (ridge(x*0.008)-0.5)*H*0.5;
    ctx.lineTo(x,y);
  }
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  // near ground
  var ridge2=makeRidge(rnd);
  ctx.fillStyle=mood.ground[0];
  ctx.beginPath(); ctx.moveTo(0,H);
  for (var x2=0;x2<=W;x2+=4){
    var y2=H*0.62+(ridge2(x2*0.012+9)-0.5)*H*0.42;
    ctx.lineTo(x2,y2);
  }
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  // ground shading
  var gg=ctx.createLinearGradient(0,H*0.6,0,H);
  gg.addColorStop(0,'rgba(0,0,0,0)'); gg.addColorStop(1,'rgba(0,0,0,0.35)');
  ctx.fillStyle=gg; ctx.fillRect(0,H*0.55,W,H*0.45);
  // water band
  if (spec.water){
    var wy=H*0.72;
    ctx.fillStyle='rgba(70,130,180,0.75)'; ctx.fillRect(0,wy,W,H-wy);
    ctx.strokeStyle='rgba(255,255,255,0.25)';
    for (var wi=0;wi<14;wi++){
      var wx=rnd()*W, ww=10+rnd()*30;
      ctx.beginPath(); ctx.moveTo(wx,wy+4+rnd()*(H-wy-8)); ctx.lineTo(wx+ww,wy+4+rnd()*(H-wy-8)); ctx.stroke();
    }
  }
  var hasVeg=spec.comps.indexOf('vegetation')>=0;
  var hasCre=spec.comps.indexOf('softbody-creatures')>=0;
  var hasStruct=spec.comps.indexOf('mesh-builder')>=0;
  // trees
  if (hasVeg){
    var trnd=streamFrom('stream:trees:'+spec.treeSeed);
    var nT=6+Math.floor(trnd()*10);
    for (var ti=0;ti<nT;ti++){
      var tx=trnd()*W, th=H*(0.10+trnd()*0.16);
      var ty=H*0.66+(trnd()-0.5)*H*0.2;
      var s=0.7+trnd()*0.7;
      ctx.fillStyle='rgba(30,40,28,0.9)';
      ctx.fillRect(tx-1.5*s,ty-th*0.5,3*s,th*0.5);
      ctx.fillStyle=mood.ground[1];
      for (var bi=0;bi<5;bi++){
        var bx=tx+(trnd()-0.5)*th*0.5*s, by=ty-th*0.55+(trnd()-0.5)*th*0.35*s;
        ctx.beginPath(); ctx.arc(bx,by,th*0.22*s*(0.7+trnd()*0.6),0,7); ctx.fill();
      }
    }
  }
  // structures
  if (hasStruct){
    var srnd=streamFrom('stream:struct:'+spec.seed);
    var nS=2+Math.floor(srnd()*4);
    for (var si2=0;si2<nS;si2++){
      var bx2=srnd()*W, bw2=W*(0.04+srnd()*0.08), bh2=H*(0.12+srnd()*0.22);
      var by2=H*0.68-bh2*0.3;
      ctx.fillStyle='rgba(25,28,34,0.92)';
      ctx.fillRect(bx2,by2-bh2,bw2,bh2);
      ctx.fillStyle='rgba(255,220,150,0.5)';
      for (var wy2=0;wy2<4;wy2++) for (var wx2=0;wx2<3;wx2++)
        if (srnd()>0.5) ctx.fillRect(bx2+4+wx2*(bw2/3), by2-bh2+6+wy2*(bh2/5), 3, 4);
    }
  }
  // creatures (side-view quadruped silhouettes from seeded params)
  if (hasCre){
    var crnd=streamFrom('stream:cre:'+spec.creatureSeed);
    var nC=1+Math.floor(crnd()*4);
    for (var ci=0;ci<nC;ci++){
      var cx=crnd()*W, cy=H*(0.68+crnd()*0.12), cs=0.5+crnd()*0.9;
      var dir=crnd()>0.5?1:-1;
      ctx.fillStyle='rgba(20,18,16,0.92)';
      // body
      ctx.beginPath(); ctx.ellipse(cx,cy,26*cs,11*cs,0,0,7); ctx.fill();
      // neck+head
      ctx.beginPath(); ctx.ellipse(cx+dir*26*cs,cy-10*cs,10*cs,7*cs,dir*0.5,0,7); ctx.fill();
      // legs
      for (var li=0;li<4;li++){
        var lx=cx-16*cs+li*11*cs;
        ctx.fillRect(lx-2*cs,cy+4*cs,4*cs,20*cs);
      }
      // tail
      ctx.strokeStyle='rgba(20,18,16,0.92)'; ctx.lineWidth=3*cs;
      ctx.beginPath(); ctx.moveTo(cx-dir*26*cs,cy-2*cs);
      ctx.quadraticCurveTo(cx-dir*38*cs,cy-8*cs,cx-dir*44*cs,cy+2*cs); ctx.stroke();
    }
  }
  // vignette
  var vg=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.9);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.4)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
}

TOOLS.stream = { mount: function(host){
  var dev=false; // dev = you. players get this off.
  var scenes=[];
  var seedBase=Math.floor(Math.random()*0xffffffff).toString(16);

  host.innerHTML =
    '<style>'+
    '.stm{font-family:system-ui,sans-serif;color:#dfe8f2;max-width:760px;margin:0 auto;padding:0 0 90px;}'+
    '.stm-head{display:flex;align-items:center;gap:10px;padding:14px 14px 6px;}'+
    '.stm-title{font-size:17px;font-weight:600;}'+
    '.stm-sub{font-size:12px;color:#8fa3b8;}'+
    '.stm-dev{margin-left:auto;font-size:11px;color:#8fa3b8;background:none;border:1px solid #2a3a4d;border-radius:20px;padding:4px 10px;cursor:pointer;}'+
    '.stm-dev.on{color:#ffd479;border-color:#ffd479;}'+
    '.stm-scene{margin:14px 0;}'+
    '.stm-scene canvas{width:100%;display:block;border-radius:10px;}'+
    '.stm-cap{font-size:12px;color:#9fb2c8;padding:6px 4px 0;display:flex;gap:8px;align-items:center;}'+
    '.stm-cap .acts{margin-left:auto;display:flex;gap:6px;}'+
    '.stm-cap button{background:none;border:none;color:#7fd4ff;font-size:12px;cursor:pointer;padding:2px 6px;}'+
    '.stm-ing{font-size:12px;color:#9fb2c8;padding:8px 4px;border-left:2px solid #2a3a4d;margin:6px 0 6px 4px;padding-left:10px;}'+
    '.stm-ing .comp{display:flex;gap:8px;padding:3px 0;}'+
    '.stm-ing .seed{font-family:monospace;color:#5f7a92;}'+
    '.stm-spec{width:100%;min-height:90px;background:#0a1220;color:#bfe3ff;border:1px solid #2a3a4d;border-radius:8px;font-family:monospace;font-size:11px;padding:8px;margin-top:6px;}'+
    '.stm-bar{position:fixed;bottom:0;left:0;right:0;background:rgba(8,15,25,0.96);border-top:1px solid #1c2a3d;padding:10px 14px;display:flex;gap:8px;align-items:center;z-index:50;}'+
    '.stm-in{flex:1;background:#0e1826;border:1px solid #2a3a4d;color:#e8f1fa;border-radius:24px;padding:10px 16px;font-size:14px;outline:none;}'+
    '.stm-mic{background:#12324a;border:none;color:#7fd4ff;border-radius:50%;width:42px;height:42px;font-size:18px;cursor:pointer;flex:none;}'+
    '.stm-nudge{font-size:10px;color:#5f7a92;text-align:center;padding:2px 0 0;}'+
    '</style>'+
    '<div class="stm">'+
      '<div class="stm-head"><div><div class="stm-title">Stream</div>'+
      '<div class="stm-sub">say what you want — scenes land below</div></div>'+
      '<button class="stm-dev" id="stm-dev">dev</button></div>'+
      '<div id="stm-list"></div>'+
    '</div>'+
    '<div class="stm-bar"><div style="flex:1">'+
      '<div style="display:flex;gap:8px;">'+
      '<input class="stm-in" id="stm-in" placeholder="a forest with creatures at sunset — or &quot;give me six&quot;" />'+
      '<button class="stm-mic" id="stm-mic" title="talk — it\u2019s faster">🎙</button>'+
      '</div><div class="stm-nudge">talk — it\u2019s faster. typing works too.</div>'+
    '</div></div>';

  var list=host.querySelector('#stm-list');
  var input=host.querySelector('#stm-in');
  var devBtn=host.querySelector('#stm-dev');
  devBtn.onclick=function(){ dev=!dev; devBtn.classList.toggle('on',dev); renderAll(); };

  function sceneEl(spec){
    var d=document.createElement('div');
    d.className='stm-scene';
    var cv=document.createElement('canvas');
    cv.width=640; cv.height=360;
    renderScene(cv,spec);
    d.appendChild(cv);
    var cap=document.createElement('div');
    cap.className='stm-cap';
    cap.innerHTML='<span>'+esc(spec.caption)+'</span><span class="acts">'+
      '<button data-a="more">↻ more like this</button>'+
      '<button data-a="done">✓ that\u2019s it</button>'+
      '<button data-a="ing">ingredients</button></span>';
    d.appendChild(cap);
    var ing=document.createElement('div');
    ing.className='stm-ing'; ing.style.display='none';
    d.appendChild(ing);
    function showIng(){
      var h='';
      spec.comps.forEach(function(cid){
        var c=COMPONENTS[cid]||{label:cid};
        h+='<div class="comp"><span>'+esc(c.label)+'</span><span class="seed">seed '+esc(spec.seed)+'</span>'+
           (dev?'<span class="seed">'+(spec.playerVisible?'player-visible':'dev-only')+'</span>':'')+'</div>';
      });
      if (dev){
        h+='<textarea class="stm-spec" id="stm-spec-'+spec.n+'">'+esc(JSON.stringify(spec,null,1))+'</textarea>'+
           '<button data-a="apply" style="color:#7fd4ff;background:none;border:none;font-size:12px;cursor:pointer;">apply spec</button> '+
           '<button data-a="vis" style="color:#7fd4ff;background:none;border:none;font-size:12px;cursor:pointer;">toggle player-visible</button>';
      } else {
        h+='<div style="color:#5f7a92;margin-top:4px;">every scene is '+spec.comps.length+' real components, one seed.</div>';
      }
      ing.innerHTML=h;
      ing.style.display='block';
    }
    cap.onclick=function(e){
      var a=e.target.getAttribute('data-a');
      if (a==='more'){
        var v=streamFrom('stream:var:'+spec.seed)();
        for (var i=0;i<3;i++){
          var ns=makeScene(spec.seed+':v'+i, scenes.length,
            {comps:spec.comps, mood:spec.mood, water:spec.water, raw:'more like "'+spec.caption+'"'}, 'm'+i);
          scenes.push(ns); list.appendChild(sceneEl(ns));
        }
        list.lastChild.scrollIntoView({behavior:'smooth',block:'nearest'});
      } else if (a==='done'){
        spec.settled=true;
        e.target.textContent='✓ settled'; e.target.style.color='#7fe0a8';
      } else if (a==='ing'){
        if (ing.innerHTML===''){ showIng(); } else { ing.style.display='none'; ing.innerHTML=''; }
      } else if (a==='apply'){
        try {
          var ns=JSON.parse(host.querySelector('#stm-spec-'+spec.n).value);
          for (var k in ns) spec[k]=ns[k];
          var cv2=d.querySelector('canvas'); renderScene(cv2,spec);
          ing.innerHTML=''; ing.style.display='none';
        } catch(err){ alert('bad JSON'); }
      } else if (a==='vis'){
        spec.playerVisible=!spec.playerVisible; showIng();
      }
    };
    // tap the render itself toggles ingredients too
    cv.style.cursor='pointer';
    cv.onclick=function(){
      if (ing.innerHTML===''){ showIng(); } else { ing.style.display='none'; ing.innerHTML=''; }
    };
    return d;
  }

  function renderAll(){
    list.innerHTML='';
    scenes.forEach(function(s){ list.appendChild(sceneEl(s)); });
  }

  function flow(text){
    var parsed=parseInput(text);
    for (var i=0;i<parsed.count;i++){
      var spec=makeScene(seedBase+':'+Date.now(), scenes.length, parsed, 'f'+i);
      spec.caption=text;
      scenes.push(spec);
      list.appendChild(sceneEl(spec));
    }
    var last=list.lastChild;
    if (last) last.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  input.addEventListener('keydown',function(e){
    if (e.key==='Enter'&&input.value.trim()){ flow(input.value.trim()); input.value=''; }
  });

  // mic: encourage talking, typing always works
  var mic=host.querySelector('#stm-mic');
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if (SR){
    var rec=new SR(); rec.interimResults=false;
    rec.onresult=function(e){
      var txt=e.results[0][0].transcript;
      flow(txt);
    };
    rec.onerror=function(){ input.focus(); };
    mic.onclick=function(){ try{ rec.start(); mic.textContent='🔴'; setTimeout(function(){mic.textContent='🎙';},4000); }catch(e){ input.focus(); } };
  } else {
    mic.style.opacity=0.4;
    mic.onclick=function(){ input.focus(); };
  }

  // never blank: three starter scenes on open
  [['a misty forest','misty forest',{'comps':['terrain-core','vegetation','ambience-engine'],'mood':'misty','water':false}],
   ['creatures at sunset','creatures at sunset',{'comps':['terrain-core','softbody-creatures','ambience-engine'],'mood':'sunset','water':false}],
   ['an alien shore','alien shore with water',{'comps':['terrain-core','vegetation','ambience-engine'],'mood':'alien','water':true}]
  ].forEach(function(s,i){
    var p={comps:s[2].comps, mood:s[2].mood, water:s[2].water, raw:s[1]};
    var spec=makeScene('starter', i, p, 's');
    spec.caption=s[1];
    scenes.push(spec);
  });
  renderAll();
}};

})();
