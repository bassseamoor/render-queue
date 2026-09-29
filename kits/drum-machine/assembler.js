// Moor kit: drum-machine v1.0.0
// Touch drum machine: 4x4 synthesized pads + 16-step sequencer.
// All sounds synthesized with Web Audio (oscillators + filtered noise). Zero assets.
(function(){
'use strict';

var KITS = {
  boombap:  { label:'Boom Bap',  lp:9000,  decayMul:1.25, atk:0.002, noise:1.0,  sat:true,  body:1.15 },
  electro:  { label:'Electro',   lp:18000, decayMul:0.8,  atk:0.001, noise:0.9,  sat:false, body:0.9 },
  acoustic: { label:'Acoustic',  lp:12000, decayMul:1.0,  atk:0.006, noise:0.8,  sat:false, body:1.0 }
};
var VALID_KITS = ['boombap','electro','acoustic'];

var TRACKS = [
  { id:'kick',  name:'KICK',  color:'#ff5a5a' },
  { id:'snare', name:'SNARE', color:'#ffb84d' },
  { id:'clap',  name:'CLAP',  color:'#ffe14d' },
  { id:'chat',  name:'HAT',   color:'#7de3ff' },
  { id:'ohat',  name:'OHAT',  color:'#7dffc8' },
  { id:'tomlo', name:'TOM',   color:'#c39bff' },
  { id:'perc',  name:'PERC',  color:'#ff8ad1' },
  { id:'shk',   name:'SHKR',  color:'#a8ff9e' }
];

var PADS = [
  { id:'kick',   name:'KICK'  }, { id:'snare', name:'SNARE' }, { id:'clap',  name:'CLAP'  }, { id:'rim',   name:'RIM'   },
  { id:'chat',   name:'HAT'   }, { id:'ohat',  name:'OHAT'  }, { id:'shk',   name:'SHKR'  }, { id:'tamb',  name:'TAMB'  },
  { id:'tomlo',  name:'TOM L' }, { id:'tomhi', name:'TOM H' }, { id:'perc',  name:'PERC'  }, { id:'cowbell',name:'BELL'  },
  { id:'crash',  name:'CRASH' }, { id:'drop',  name:'DROP'  }, { id:'zap',   name:'ZAP'   }, { id:'snap',  name:'SNAP'  }
];

function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function normConfig(cfg){
  cfg = (cfg && typeof cfg==='object') ? cfg : {};
  var kit = VALID_KITS.indexOf(cfg.kit_sound)>=0 ? cfg.kit_sound : 'boombap';
  var layout = (cfg.layout==='sequencer') ? 'sequencer' : 'pads';
  var ex = Array.isArray(cfg.extras) ? cfg.extras : [];
  var extras = [];
  if(ex.indexOf('metronome')>=0) extras.push('metronome');
  if(ex.indexOf('swing')>=0) extras.push('swing');
  return { kit_sound:kit, layout:layout, extras:extras };
}

function build(config){
  var c = normConfig(config);
  var K = KITS[c.kit_sound];
  var hasMetro = c.extras.indexOf('metronome')>=0;
  var hasSwing = c.extras.indexOf('swing')>=0;

  var css = [
    '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
    'html,body{margin:0;padding:0;height:100%}',
    'body{background:#0b0d12;color:#f2f4f8;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;',
    '  min-height:100%;display:flex;flex-direction:column;align-items:center;touch-action:manipulation;overscroll-behavior:none}',
    '#app{width:100%;max-width:520px;padding:12px 12px 28px;display:flex;flex-direction:column;gap:12px}',
    'header{display:flex;align-items:center;gap:10px;padding:4px 2px}',
    '.logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#ff5a5a,#ffb84d);display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}',
    '.ttl{font-size:19px;font-weight:700;letter-spacing:.2px}',
    '.sub{font-size:12px;color:#9aa3b2;margin-top:1px}',
    '#transport{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:10px}',
    '.trow{display:flex;align-items:center;gap:10px}',
    '#playbtn{width:64px;height:64px;border-radius:50%;border:none;flex:none;font-size:22px;color:#0b0d12;font-weight:800;cursor:pointer;',
    '  background:linear-gradient(135deg,#7dffc8,#7de3ff);box-shadow:0 4px 18px rgba(125,255,200,.35)}',
    '#playbtn:active{transform:scale(.94)}',
    '.tempo{flex:1;display:flex;flex-direction:column;gap:4px}',
    '.tempo label{font-size:11px;color:#9aa3b2;text-transform:uppercase;letter-spacing:1px;display:flex;justify-content:space-between}',
    '#bpmv{color:#f2f4f8;font-weight:700}',
    'input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:34px;background:transparent;cursor:pointer}',
    'input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:rgba(255,255,255,.14)}',
    'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:30px;height:30px;border-radius:50%;background:#7de3ff;margin-top:-12px;box-shadow:0 2px 10px rgba(125,227,255,.5)}',
    'input[type=range]::-moz-range-track{height:6px;border-radius:3px;background:rgba(255,255,255,.14)}',
    'input[type=range]::-moz-range-thumb{width:30px;height:30px;border:none;border-radius:50%;background:#7de3ff}',
    '#stepread{font-variant-numeric:tabular-nums;font-size:12px;color:#9aa3b2;min-width:64px;text-align:right}',
    '.trow2{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.pill{border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:#f2f4f8;border-radius:999px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;min-height:44px}',
    '.pill.on{background:rgba(125,227,255,.22);border-color:#7de3ff;color:#7de3ff}',
    '.swingwrap{flex:1;display:flex;align-items:center;gap:8px;font-size:12px;color:#9aa3b2;min-width:150px}',
    '.sect{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:10px}',
    '.sect h2{margin:0;font-size:12px;color:#9aa3b2;text-transform:uppercase;letter-spacing:1.5px;display:flex;justify-content:space-between;align-items:center}',
    '.sect h2 button{background:none;border:none;color:#7de3ff;font-size:12px;font-weight:700;cursor:pointer;padding:8px;min-height:44px}',
    '#pads{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}',
    '#pads.big .pad{aspect-ratio:1}',
    '#pads.small .pad{aspect-ratio:1.7}',
    '.pad{border:1px solid rgba(255,255,255,.1);border-radius:14px;background:linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.03));',
    '  color:#f2f4f8;font-size:12px;font-weight:700;letter-spacing:.5px;cursor:pointer;min-height:56px;user-select:none;-webkit-user-select:none;touch-action:none;position:relative;overflow:hidden}',
    '.pad.hit{background:linear-gradient(180deg,var(--pc,#7de3ff),var(--pc2,#2b8fa8));color:#0b0d12;transform:scale(.93);box-shadow:0 0 22px var(--pc,#7de3ff)}',
    '#seqrows{display:flex;flex-direction:column;gap:6px}',
    '.srow{display:grid;grid-template-columns:44px repeat(16,1fr);gap:3px;align-items:center}',
    '.srow .tname{font-size:9px;font-weight:800;color:var(--tc,#fff);letter-spacing:.5px;white-space:nowrap;overflow:hidden}',
    '.cell{aspect-ratio:1;border-radius:5px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.05);cursor:pointer;min-width:0;min-height:22px;touch-action:manipulation}',
    '.cell.beat{background:rgba(255,255,255,.12)}',
    '.cell.on{background:var(--tc,#7de3ff);box-shadow:0 0 8px var(--tc,#7de3ff);border-color:transparent}',
    '.cell.now{outline:2px solid #fff;outline-offset:-1px}',
    '.hint{font-size:11px;color:#6b7280;text-align:center;padding:2px}',
    '@media (orientation:landscape) and (max-height:500px){ #pads.big .pad{aspect-ratio:1.9} }'
  ].join('\n');

  // Inner app script — plain ES5, no template literals, no ${} sequences.
  var js = [
  "'use strict';",
  "var KIT=" + JSON.stringify(K) + ";",
  "var TRACKS=" + JSON.stringify(TRACKS) + ";",
  "var PADS=" + JSON.stringify(PADS) + ";",
  "var HAS_METRO=" + (hasMetro?'true':'false') + ";",
  "var HAS_SWING=" + (hasSwing?'true':'false') + ";",
  "var KIT_LABEL=" + JSON.stringify(K.label) + ";",

  "var AC=null, master=null, noiseBuf=null, started=false;",
  "var playing=false, step=0, nextT=0, timer=null, bpm=100, swing=0.2, metroOn=false;",
  "var pattern=[]; for(var ti=0;ti<TRACKS.length;ti++){ pattern.push([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]); }",
  "// starter groove so play instantly sounds good",
  "function seed(){ var p=pattern;",
  "  var K=[0,4,8,12],S=[4,12],H=[0,2,4,6,8,10,12,14];",
  "  for(var i=0;i<K.length;i++) p[0][K[i]]=1;",
  "  for(var j=0;j<S.length;j++) p[1][S[j]]=1;",
  "  for(var k=0;k<H.length;k++) p[3][H[k]]=1;",
  "  p[2][14]=1; p[6][7]=1; p[6][15]=1;",
  "}",
  "seed();",

  "function ac(){",
  "  if(!AC){",
  "    var Ctx=window.AudioContext||window.webkitAudioContext;",
  "    if(!Ctx) return null;",
  "    AC=new Ctx();",
  "    master=AC.createGain(); master.gain.value=0.9;",
  "    var lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=KIT.lp;",
  "    var comp=AC.createDynamicsCompressor();",
  "    master.connect(lp); lp.connect(comp); comp.connect(AC.destination);",
  "    var len=AC.sampleRate*1.2, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0);",
  "    for(var i=0;i<len;i++) d[i]=Math.random()*2-1;",
  "    noiseBuf=buf;",
  "  }",
  "  if(AC.state==='suspended'){ try{AC.resume();}catch(e){} }",
  "  return AC;",
  "}",
  "function nz(){ var s=AC.createBufferSource(); s.buffer=noiseBuf; s.loop=true; return s; }",
  "function g0(){ return AC.createGain(); }",
  "function adsr(t,a,peak,dec){ var g=g0(); g.gain.setValueAtTime(0.0001,t);",
  "  g.gain.linearRampToValueAtTime(peak,t+a);",
  "  g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); return g; }",
  "function osc(type,f0,f1,t,dur){ var o=AC.createOscillator(); o.type=type;",
  "  o.frequency.setValueAtTime(Math.max(20,f0),t);",
  "  if(f1&&f1!==f0) o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);",
  "  return o; }",
  "function bp(f,q){ var fl=AC.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=f; fl.Q.value=q||1; return fl; }",
  "function hp(f){ var fl=AC.createBiquadFilter(); fl.type='highpass'; fl.frequency.value=f; return fl; }",

  "var V={};",
  "V.kick=function(t,v){ var k=KIT, d=0.42*k.decayMul;",
  "  var o=osc('sine',k.body>1?140:160,k.body>1?38:44,t,0.12); var g=adsr(t,k.atk,0.95*v,d);",
  "  o.connect(g); g.connect(master); o.start(t); o.stop(t+d+0.1);",
  "  var n=nz(), f=hp(1000), ng=adsr(t,0.001,0.25*v,0.02); n.connect(f); f.connect(ng); ng.connect(master); n.start(t); n.stop(t+0.05); };",
  "V.snare=function(t,v){ var k=KIT;",
  "  var n=nz(), f=bp(1800,0.9), g=adsr(t,k.atk,0.6*v*k.noise,0.19*k.decayMul);",
  "  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.35);",
  "  var o=osc('triangle',190,150,t,0.09), g2=adsr(t,k.atk,0.5*v,0.09);",
  "  o.connect(g2); g2.connect(master); o.start(t); o.stop(t+0.15); };",
  "V.clap=function(t,v){ var k=KIT, offs=[0,0.011,0.024];",
  "  for(var i=0;i<offs.length;i++){ (function(dt){",
  "    var n=nz(), f=bp(1200,2), g=adsr(t+dt,k.atk,0.4*v*k.noise,0.2*k.decayMul);",
  "    n.connect(f); f.connect(g); g.connect(master); n.start(t+dt); n.stop(t+dt+0.3); })(offs[i]); } };",
  "V.rim=function(t,v){ var k=KIT;",
  "  var o=osc('square',820,420,t,0.025), g=adsr(t,k.atk,0.35*v,0.05);",
  "  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.08); };",
  "V.chat=function(t,v){ var k=KIT;",
  "  var n=nz(), f=hp(7600), g=adsr(t,k.atk,0.32*v*k.noise,0.05*k.decayMul);",
  "  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.12); };",
  "V.ohat=function(t,v){ var k=KIT;",
  "  var n=nz(), f=hp(7000), g=adsr(t,k.atk,0.34*v*k.noise,0.34*k.decayMul);",
  "  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.6); };",
  "V.shk=function(t,v){ var k=KIT;",
  "  var n=nz(), f=hp(6000), g=adsr(t,0.012,0.28*v*k.noise,0.12*k.decayMul);",
  "  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.25); };",
  "V.tamb=function(t,v){ var k=KIT;",
  "  var n=nz(), f=hp(6500), g=adsr(t,k.atk,0.3*v*k.noise,0.2*k.decayMul);",
  "  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.3);",
  "  var o=osc('sine',5200,5200,t,0.06), g2=adsr(t,k.atk,0.12*v,0.07);",
  "  o.connect(g2); g2.connect(master); o.start(t); o.stop(t+0.1); };",
  "V.tomlo=function(t,v){ var k=KIT, d=0.32*k.decayMul;",
  "  var o=osc('sine',130,52,t,0.2), g=adsr(t,k.atk,0.8*v*k.body,d);",
  "  o.connect(g); g.connect(master); o.start(t); o.stop(t+d+0.1); };",
  "V.tomhi=function(t,v){ var k=KIT, d=0.28*k.decayMul;",
  "  var o=osc('sine',195,82,t,0.18), g=adsr(t,k.atk,0.7*v*k.body,d);",
  "  o.connect(g); g.connect(master); o.start(t); o.stop(t+d+0.1); };",
  "V.perc=function(t,v){ var k=KIT;",
  "  var o=osc('sine',880,590,t,0.07), g=adsr(t,k.atk,0.4*v,0.09);",
  "  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.14);",
  "  var n=nz(), f=hp(4000), g2=adsr(t,k.atk,0.12*v,0.03); n.connect(f); f.connect(g2); g2.connect(master); n.start(t); n.stop(t+0.06); };",
  "V.cowbell=function(t,v){ var k=KIT;",
  "  var o1=osc('square',540,540,t,0.15), o2=osc('square',800,800,t,0.15), f=bp(1400,1.4), g=adsr(t,k.atk,0.22*v,0.18*k.decayMul);",
  "  o1.connect(f); o2.connect(f); f.connect(g); g.connect(master); o1.start(t); o1.stop(t+0.3); o2.start(t); o2.stop(t+0.3); };",
  "V.crash=function(t,v){ var k=KIT;",
  "  var n=nz(), f=hp(4800), g=adsr(t,0.005,0.5*v*k.noise,1.15*k.decayMul);",
  "  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+1.6); };",
  "V.drop=function(t,v){ var k=KIT, d=0.6*k.decayMul;",
  "  var o=osc('sine',200,30,t,0.5), g=adsr(t,0.004,0.9*v*k.body,d);",
  "  o.connect(g); g.connect(master); o.start(t); o.stop(t+d+0.1); };",
  "V.zap=function(t,v){ var k=KIT;",
  "  var o=osc('sawtooth',1300,110,t,0.16), g=adsr(t,k.atk,0.32*v,0.17);",
  "  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.25); };",
  "V.snap=function(t,v){ var k=KIT;",
  "  var n=nz(), f=bp(2600,1.6), g=adsr(t,k.atk,0.45*v*k.noise,0.07);",
  "  n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+0.12); };",
  "V.metroHi=function(t){ var o=osc('sine',1600,1600,t,0.03), g=adsr(t,0.001,0.3,0.045); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.08); };",
  "V.metroLo=function(t){ var o=osc('sine',1100,1100,t,0.03), g=adsr(t,0.001,0.18,0.04); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.08); };",

  "function hit(id,v){ if(!ac()) return; var t=AC.currentTime+0.001; var fn=V[id]; if(fn) fn(t, v||1); }",

  "// ---- scheduler ----",
  "function stepDur(){ return 60/bpm/4; }",
  "function schedStep(s,t){",
  "  for(var i=0;i<TRACKS.length;i++){ if(pattern[i][s]){ var fn=V[TRACKS[i].id]; if(fn) fn(t,1); } }",
  "  if(HAS_METRO&&metroOn){ if(s%4===0) V.metroHi(t); else V.metroLo(t); }",
  "  var delay=Math.max(0,(t-AC.currentTime)*1000);",
  "  (function(ss){ setTimeout(function(){ drawStep(ss); }, delay); })(s);",
  "}",
  "function tick(){",
  "  while(nextT < AC.currentTime + 0.12){",
  "    var off=(step%2===1&&HAS_SWING)? swing*stepDur() : 0;",
  "    schedStep(step, nextT+off);",
  "    nextT += stepDur(); step=(step+1)%16;",
  "  }",
  "}",
  "function play(){ if(playing) return; if(!ac()) return; playing=true; step=0; nextT=AC.currentTime+0.06;",
  "  timer=setInterval(tick,25); tick(); drawPlay(); }",
  "function stop(){ playing=false; if(timer){clearInterval(timer);timer=null;} drawPlay(); clearSteps(); setRead('-'); }",

  "// ---- UI ----",
  "function el(id){ return document.getElementById(id); }",
  "function on(elm,ev,fn){ if(elm.addEventListener) elm.addEventListener(ev,fn,false); }",
  "function setRead(s){ var r=el('stepread'); if(r) r.textContent='STEP '+s; }",
  "function drawPlay(){ var b=el('playbtn'); if(!b) return; b.textContent=playing?'\u23f8':'\u25b6'; b.setAttribute('aria-label',playing?'Stop':'Play'); }",
  "function clearSteps(){ var cs=document.querySelectorAll('.cell.now'); for(var i=0;i<cs.length;i++) cs[i].classList.remove('now'); }",
  "function drawStep(s){",
  "  clearSteps();",
  "  var cells=document.querySelectorAll('.cell[data-s=\"'+s+'\"]');",
  "  for(var i=0;i<cells.length;i++) cells[i].classList.add('now');",
  "  setRead((s+1<10?'0':'')+(s+1)+'/16');",
  "}",
  "function buildPads(big){",
  "  var w=el('pads'); w.className=big?'big':'small'; w.innerHTML='';",
  "  for(var i=0;i<PADS.length;i++){ (function(p,idx){",
  "    var b=document.createElement('button'); b.className='pad'; b.type='button';",
  "    var tc=idx<TRACKS.length?TRACKS[idx].color:'#7de3ff';",
  "    b.style.setProperty('--pc',tc); b.style.setProperty('--pc2',tc);",
  "    b.textContent=p.name; b.setAttribute('aria-label',p.name+' pad');",
  "    on(b,'pointerdown',function(e){ e.preventDefault(); ac(); hit(p.id,1);",
  "      b.classList.add('hit'); setTimeout(function(){b.classList.remove('hit');},140); });",
  "    on(b,'contextmenu',function(e){ e.preventDefault(); });",
  "    w.appendChild(b); })(PADS[i],i); }",
  "}",
  "function buildSeq(){",
  "  var w=el('seqrows'); w.innerHTML='';",
  "  for(var r=0;r<TRACKS.length;r++){ (function(r){",
  "    var row=document.createElement('div'); row.className='srow'; row.style.setProperty('--tc',TRACKS[r].color);",
  "    var nm=document.createElement('div'); nm.className='tname'; nm.textContent=TRACKS[r].name; row.appendChild(nm);",
  "    for(var s=0;s<16;s++){ (function(s){",
  "      var c=document.createElement('button'); c.className='cell'+(s%4===0?' beat':''); c.type='button';",
  "      c.setAttribute('data-s',s); c.setAttribute('data-r',r);",
  "      c.setAttribute('aria-label',TRACKS[r].name+' step '+(s+1));",
  "      if(pattern[r][s]) c.classList.add('on');",
  "      on(c,'pointerup',function(e){ e.preventDefault(); ac();",
  "        pattern[r][s]=pattern[r][s]?0:1; c.classList.toggle('on',!!pattern[r][s]);",
  "        if(pattern[r][s]) hit(TRACKS[r].id,0.9); });",
  "      row.appendChild(c); })(s); }",
  "    w.appendChild(row); })(r); }",
  "}",
  "function wire(){",
  "  on(document,'pointerdown',function(){ ac(); },true);",
  "  on(el('playbtn'),'pointerup',function(e){ e.preventDefault(); playing?stop():play(); });",
  "  on(el('tempo'),'input',function(e){ bpm=parseInt(e.target.value,10)||100; el('bpmv').textContent=bpm+' BPM'; });",
  "  var mb=el('metrobtn');",
  "  if(mb) on(mb,'pointerup',function(e){ e.preventDefault(); ac(); metroOn=!metroOn; mb.classList.toggle('on',metroOn); });",
  "  var sw=el('swing');",
  "  if(sw) on(sw,'input',function(e){ swing=parseInt(e.target.value,10)/100; el('swingv').textContent=e.target.value+'%'; });",
  "  var cb=el('clearbtn');",
  "  if(cb) on(cb,'pointerup',function(e){ e.preventDefault();",
  "    for(var r=0;r<pattern.length;r++) for(var s=0;s<16;s++) pattern[r][s]=0; buildSeq(); clearSteps(); });",
  "}",
  "buildPads(true); buildSeq(); wire(); drawPlay(); setRead('-');"
  ].join('\n');

  var metroBtn = hasMetro
    ? '<button class="pill" id="metrobtn" type="button">METRONOME</button>' : '';
  var swingCtl = hasSwing
    ? '<div class="swingwrap"><span>SWING</span><input type="range" id="swing" min="0" max="60" value="20" aria-label="Swing amount"><span id="swingv">20%</span></div>' : '';

  var padsSection =
    '<section class="sect" id="padsect"><h2><span>Drum pads</span></h2><div id="pads" class="big"></div>' +
    '<div class="hint">Tap the pads to play live. First tap unlocks sound.</div></section>';
  var seqSection =
    '<section class="sect" id="seqsect"><h2><span>Step sequencer</span><button id="clearbtn" type="button">CLEAR</button></h2>' +
    '<div id="seqrows"></div><div class="hint">Tap squares to program. Tap an active square to hear it.</div></section>';
  var body2 = (c.layout==='pads') ? (padsSection + seqSection) : (seqSection + padsSection);

  var html =
'<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">\n' +
'<meta name="theme-color" content="#0b0d12">\n' +
'<title>' + esc('Drum Machine') + '</title>\n' +
'<style>\n' + css + '\n</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="app">\n' +
'  <header><div class="logo">\uD83E\uDD41</div><div><div class="ttl">Drum Machine</div>' +
'  <div class="sub">' + esc(K.label) + ' kit &middot; tap to play</div></div></header>\n' +
'  <div id="transport">\n' +
'    <div class="trow"><button id="playbtn" type="button" aria-label="Play">\u25b6</button>\n' +
'      <div class="tempo"><label><span>Tempo</span><span id="bpmv">100 BPM</span></label>\n' +
'      <input type="range" id="tempo" min="60" max="180" value="100" aria-label="Tempo"></div>\n' +
'      <div id="stepread">STEP -</div></div>\n' +
'    <div class="trow2">' + metroBtn + swingCtl + '</div>\n' +
'  </div>\n' +
  body2 + '\n' +
'</div>\n' +
'<scr'+'ipt>\n' + js + '\n</scr'+'ipt>\n' +
'</body>\n' +
'</html>\n';
  return html;
}

window.MoorKit = { build: build };

})();
