// Moor kit: white-noise v1.0.0
// Sleep & focus sound mixer. All sounds synthesized with Web Audio
// (oscillators + generated noise buffers). Zero audio files, zero assets.
(function(){
'use strict';

var SOUNDS = [
  { id:'white',    name:'White Noise', icon:'\uD83D\uDCA8', scale:0.40 },
  { id:'pink',     name:'Pink Noise',  icon:'\uD83C\uDF38', scale:0.70 },
  { id:'brown',    name:'Brown Noise', icon:'\uD83E\uDEB5', scale:0.90 },
  { id:'rain',     name:'Rain',        icon:'\uD83C\uDF27', scale:0.90 },
  { id:'ocean',    name:'Ocean',       icon:'\uD83C\uDF0A', scale:0.90 },
  { id:'fan',      name:'Fan',         icon:'\uD83C\uDF00', scale:0.80 },
  { id:'crickets', name:'Crickets',    icon:'\uD83E\uDD97', scale:0.70 }
];
var ORDER = ['white','pink','brown','rain','ocean','fan','crickets'];

var PRESETS = {
  deepsleep: { label:'Deep Sleep',  vals:{ white:0,    pink:0,    brown:0.75, rain:0.35, ocean:0, fan:0.15, crickets:0 } },
  focus:     { label:'Focus',       vals:{ white:0.25, pink:0.65, brown:0,    rain:0,    ocean:0, fan:0.20, crickets:0 } },
  rainnight: { label:'Rainy Night', vals:{ white:0.15, pink:0,    brown:0,    rain:0.80, ocean:0, fan:0,    crickets:0.50 } }
};
var VALID_MIX = ['deepsleep','focus','rainnight'];

var VIBES = {
  midnight: { bg:'#07090f', card:'rgba(255,255,255,.045)', line:'rgba(255,255,255,.09)',
              txt:'#eef1f7', dim:'#8b93a7', acc:'#7de3ff', acc2:'#a8b8ff', meta:'#07090f' },
  deepblue: { bg:'#04101f', card:'rgba(125,227,255,.05)',  line:'rgba(125,227,255,.14)',
              txt:'#eaf4ff', dim:'#7d97b5', acc:'#5ad1ff', acc2:'#7dffc8', meta:'#04101f' }
};
var VALID_VIBE = ['midnight','deepblue'];

function normConfig(cfg){
  cfg = (cfg && typeof cfg==='object') ? cfg : {};
  var mix = VALID_MIX.indexOf(cfg.mix)>=0 ? cfg.mix : 'deepsleep';
  var vibe = VALID_VIBE.indexOf(cfg.vibe)>=0 ? cfg.vibe : 'midnight';
  var ex = Array.isArray(cfg.extras) ? cfg.extras : [];
  var extras = [];
  if(ex.indexOf('timer')>=0) extras.push('timer');
  if(ex.indexOf('visualizer')>=0) extras.push('visualizer');
  return { mix:mix, vibe:vibe, extras:extras };
}

function build(config){
  var c = normConfig(config);
  var V = VIBES[c.vibe];
  var P = PRESETS[c.mix];
  var hasTimer = c.extras.indexOf('timer')>=0;
  var hasViz = c.extras.indexOf('visualizer')>=0;

  var css = [
    '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
    'html,body{margin:0;padding:0;min-height:100%}',
    'body{background:'+V.bg+';color:'+V.txt+';font-family:system-ui,-apple-system,sans-serif;',
    '  display:flex;flex-direction:column;align-items:center;touch-action:manipulation;overscroll-behavior:none}',
    '#app{width:100%;max-width:520px;padding:14px 14px 34px;display:flex;flex-direction:column;gap:12px}',
    'header{display:flex;align-items:center;gap:12px;padding:6px 2px}',
    '.logo{width:46px;height:46px;border-radius:15px;flex:none;display:flex;align-items:center;justify-content:center;font-size:26px;',
    '  background:linear-gradient(135deg,'+V.acc+','+V.acc2+')}',
    '.ttl{font-size:20px;font-weight:700;letter-spacing:.2px}',
    '.sub{font-size:12px;color:'+V.dim+';margin-top:2px}',
    '#transport{background:'+V.card+';border:1px solid '+V.line+';border-radius:18px;padding:14px}',
    '.trow{display:flex;align-items:center;gap:14px}',
    '#playbtn{width:76px;height:76px;border-radius:50%;border:none;flex:none;font-size:26px;color:#06121f;font-weight:800;cursor:pointer;',
    '  background:linear-gradient(135deg,'+V.acc+','+V.acc2+');box-shadow:0 4px 22px '+V.acc+'55}',
    '#playbtn:active{transform:scale(.93)}',
    '.tinfo{flex:1;min-width:0}',
    '#status{font-size:15px;font-weight:600}',
    '#timerread{font-size:13px;color:'+V.dim+';margin-top:4px;font-variant-numeric:tabular-nums;min-height:18px}',
    '.timer{margin-top:12px;padding-top:12px;border-top:1px solid '+V.line+'}',
    '.tlabel{font-size:11px;color:'+V.dim+';text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px}',
    '.tbtns{display:flex;gap:8px;flex-wrap:wrap}',
    '.tpill{flex:1;min-width:64px;min-height:46px;border-radius:12px;border:1px solid '+V.line+';background:transparent;color:'+V.txt+';',
    '  font-size:14px;font-weight:700;cursor:pointer}',
    '.tpill.on{background:'+V.acc+'22;border-color:'+V.acc+';color:'+V.acc+'}',
    '#viz{width:100%;height:110px;border-radius:18px;background:'+V.card+';border:1px solid '+V.line+';display:block}',
    '#mixer{background:'+V.card+';border:1px solid '+V.line+';border-radius:18px;padding:6px 14px 10px}',
    '.mhead{font-size:11px;color:'+V.dim+';text-transform:uppercase;letter-spacing:1.5px;padding:10px 0 2px}',
    '.srow{display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid '+V.line+'}',
    '.srow:last-child{border-bottom:none}',
    '.sicon{width:40px;height:40px;border-radius:12px;flex:none;display:flex;align-items:center;justify-content:center;font-size:21px;background:'+V.acc+'14}',
    '.sname{width:92px;flex:none;font-size:14px;font-weight:600}',
    '.sval{width:40px;flex:none;text-align:right;font-size:12px;color:'+V.dim+';font-variant-numeric:tabular-nums}',
    'input[type=range]{-webkit-appearance:none;appearance:none;flex:1;height:44px;background:transparent;cursor:pointer;min-width:0}',
    'input[type=range]::-webkit-slider-runnable-track{height:8px;border-radius:4px;background:'+V.acc+'30}',
    'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:32px;height:32px;border-radius:50%;background:'+V.acc+';margin-top:-12px;box-shadow:0 2px 12px '+V.acc+'66}',
    'input[type=range]::-moz-range-track{height:8px;border-radius:4px;background:'+V.acc+'30}',
    'input[type=range]::-moz-range-thumb{width:32px;height:32px;border:none;border-radius:50%;background:'+V.acc+'}',
    '.foot{text-align:center;font-size:12px;color:'+V.dim+';padding:4px 20px;line-height:1.5}'
  ];

  var rows = [];
  for(var r=0;r<SOUNDS.length;r++){
    var s = SOUNDS[r];
    var v = Math.round((P.vals[s.id]||0)*100);
    rows.push(
      '<div class="srow"><div class="sicon">'+s.icon+'</div>'+
      '<div class="sname">'+s.name+'</div>'+
      '<input type="range" id="sl-'+s.id+'" min="0" max="100" value="'+v+'" aria-label="'+s.name+' volume">'+
      '<div class="sval" id="sv-'+s.id+'">'+v+'</div></div>'
    );
  }

  var timerHtml = '';
  if(hasTimer){
    timerHtml =
      '<div class="timer"><div class="tlabel">Sleep timer</div>'+
      '<div class="tbtns">'+
      '<button class="tpill" data-min="15">15m</button>'+
      '<button class="tpill" data-min="30">30m</button>'+
      '<button class="tpill" data-min="60">60m</button>'+
      '<button class="tpill on" data-min="0">Off</button>'+
      '</div></div>';
  }
  var vizHtml = hasViz ? '<canvas id="viz"></canvas>' : '';

  var html =
    '<div id="app">'+
    '<header><div class="logo">\uD83C\uDF0A</div>'+
    '<div><div class="ttl">Sleep Sounds</div><div class="sub" id="presetname">'+P.label+' mix</div></div></header>'+
    '<div id="transport"><div class="trow">'+
    '<button id="playbtn" aria-label="Play or stop">\u25B6</button>'+
    '<div class="tinfo"><div id="status">Tap play to begin</div><div id="timerread"></div></div>'+
    '</div>'+timerHtml+'</div>'+
    vizHtml+
    '<div id="mixer"><div class="mhead">Mixer</div>'+rows.join('')+'</div>'+
    '<div class="foot">Every sound is synthesized live in your browser. No audio files, no streaming, works offline.</div>'+
    '</div>';

  var js = [
    "'use strict';",
    "var VB={acc:'"+V.acc+"',acc2:'"+V.acc2+"'};",
    "var PRESET="+JSON.stringify(P.vals)+";",
    "var SCALES="+JSON.stringify({white:0.40,pink:0.70,brown:0.90,rain:0.90,ocean:0.90,fan:0.80,crickets:0.70})+";",
    "var ORDER=['white','pink','brown','rain','ocean','fan','crickets'];",
    "var HAS_TIMER="+(hasTimer?'true':'false')+";",
    "var ctx=null,master=null,analyser=null,built=false,playing=false;",
    "var gains={},vols={},rainFilter=null,rainTick=null,chirpTick=null,cricketGain=null;",
    "var timerMin=0,timerEnd=0,timerInt=null,fading=false;",
    "var vizC=null,vizX=null;",
    "var i; for(i=0;i<ORDER.length;i++){ vols[ORDER[i]]=0; }",
    "function $(id){ return document.getElementById(id); }",
    "function note(t){ var el=$('status'); if(el){ el.textContent=t; } }",
    "function ensureAudio(){",
    "  if(built){ return true; }",
    "  try{",
    "    var AC=window.AudioContext||window.webkitAudioContext;",
    "    if(!AC){ return false; }",
    "    ctx=new AC();",
    "    master=ctx.createGain(); master.gain.value=0.9;",
    "    analyser=ctx.createAnalyser(); analyser.fftSize=2048;",
    "    master.connect(analyser); analyser.connect(ctx.destination);",
    "    var sr=ctx.sampleRate,len=sr*2,n,buf,ch;",
    "    buf=ctx.createBuffer(1,len,sr); ch=buf.getChannelData(0);",
    "    for(n=0;n<len;n++){ ch[n]=Math.random()*2-1; }",
    "    var whiteBuf=buf;",
    "    buf=ctx.createBuffer(1,len,sr); ch=buf.getChannelData(0);",
    "    var b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,w;",
    "    for(n=0;n<len;n++){ w=Math.random()*2-1;",
    "      b0=0.99886*b0+w*0.0555179; b1=0.99332*b1+w*0.0750759; b2=0.96900*b2+w*0.1538520;",
    "      b3=0.86650*b3+w*0.3104856; b4=0.55000*b4+w*0.5329522; b5=-0.7616*b5-w*0.0168980;",
    "      var vv=b0+b1+b2+b3+b4+b5+b6+w*0.5362; b6=w*0.115926; ch[n]=vv*0.11; }",
    "    var pinkBuf=buf;",
    "    buf=ctx.createBuffer(1,len,sr); ch=buf.getChannelData(0);",
    "    var last=0;",
    "    for(n=0;n<len;n++){ last=(last+0.02*(Math.random()*2-1))/1.02; ch[n]=last*3.5; }",
    "    var brownBuf=buf;",
    "    var src,g,f;",
    "    src=ctx.createBufferSource(); src.buffer=whiteBuf; src.loop=true;",
    "    gains.white=ctx.createGain(); gains.white.gain.value=0; src.connect(gains.white); gains.white.connect(master); src.start(0);",
    "    src=ctx.createBufferSource(); src.buffer=pinkBuf; src.loop=true;",
    "    gains.pink=ctx.createGain(); gains.pink.gain.value=0; src.connect(gains.pink); gains.pink.connect(master); src.start(0);",
    "    src=ctx.createBufferSource(); src.buffer=brownBuf; src.loop=true;",
    "    gains.brown=ctx.createGain(); gains.brown.gain.value=0; src.connect(gains.brown); gains.brown.connect(master); src.start(0);",
    "    src=ctx.createBufferSource(); src.buffer=whiteBuf; src.loop=true;",
    "    rainFilter=ctx.createBiquadFilter(); rainFilter.type='bandpass'; rainFilter.frequency.value=2500; rainFilter.Q.value=0.6;",
    "    gains.rain=ctx.createGain(); gains.rain.gain.value=0; src.connect(rainFilter); rainFilter.connect(gains.rain); gains.rain.connect(master); src.start(0);",
    "    src=ctx.createBufferSource(); src.buffer=pinkBuf; src.loop=true;",
    "    f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420;",
    "    var wave=ctx.createGain(); wave.gain.value=0.55;",
    "    var lfo=ctx.createOscillator(); lfo.frequency.value=0.07;",
    "    var lfoAmp=ctx.createGain(); lfoAmp.gain.value=0.30;",
    "    lfo.connect(lfoAmp); lfoAmp.connect(wave.gain); lfo.start(0);",
    "    gains.ocean=ctx.createGain(); gains.ocean.gain.value=0; src.connect(f); f.connect(wave); wave.connect(gains.ocean); gains.ocean.connect(master); src.start(0);",
    "    var osc=ctx.createOscillator(); osc.type='triangle'; osc.frequency.value=52;",
    "    f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=240;",
    "    gains.fan=ctx.createGain(); gains.fan.gain.value=0; osc.connect(f); f.connect(gains.fan); gains.fan.connect(master); osc.start(0);",
    "    src=ctx.createBufferSource(); src.buffer=whiteBuf; src.loop=true;",
    "    f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=500;",
    "    g=ctx.createGain(); g.gain.value=0.25; src.connect(f); f.connect(g); g.connect(gains.fan); src.start(0);",
    "    osc=ctx.createOscillator(); osc.type='sine'; osc.frequency.value=4300;",
    "    cricketGain=ctx.createGain(); cricketGain.gain.value=0;",
    "    gains.crickets=ctx.createGain(); gains.crickets.gain.value=0;",
    "    osc.connect(cricketGain); cricketGain.connect(gains.crickets); gains.crickets.connect(master); osc.start(0);",
    "    built=true; return true;",
    "  }catch(e){ return false; }",
    "}",
    "function applyVols(){",
    "  if(!ctx){ return; }",
    "  for(var k=0;k<ORDER.length;k++){ var id=ORDER[k];",
    "    try{ gains[id].gain.setTargetAtTime(vols[id]*SCALES[id],ctx.currentTime,0.06); }catch(e){} }",
    "}",
    "function startMod(){",
    "  stopMod();",
    "  rainTick=setInterval(function(){",
    "    if(!playing||!rainFilter){ return; }",
    "    try{ rainFilter.frequency.setTargetAtTime(1200+Math.random()*3200,ctx.currentTime,0.06); }catch(e){}",
    "  },280);",
    "  chirpTick=setInterval(function(){",
    "    if(!playing||!cricketGain){ return; }",
    "    try{ var t=Date.now(),cyc=t%1400,on=(cyc<360)&&((t%120)<60);",
    "      cricketGain.gain.setTargetAtTime(on?0.5:0.0001,ctx.currentTime,0.02); }catch(e){}",
    "  },110);",
    "}",
    "function stopMod(){ if(rainTick){clearInterval(rainTick);rainTick=null;} if(chirpTick){clearInterval(chirpTick);chirpTick=null;} }",
    "function paintPlay(){ var b=$('playbtn'); if(b){ b.textContent=playing?'\u23F8':'\u25B6'; } note(playing?'Playing':'Paused'); }",
    "function paintTimer(rem){",
    "  var el=$('timerread'); if(!el){ return; }",
    "  if(timerMin<=0){ el.textContent=''; return; }",
    "  var m=Math.floor(rem/60),s=rem%60;",
    "  el.textContent='Sleep in '+(m<10?'0':'')+m+':'+(s<10?'0':'')+s;",
    "}",
    "function stopClock(){ if(timerInt){clearInterval(timerInt);timerInt=null;} }",
    "function tickTimer(){",
    "  var rem=Math.max(0,Math.round((timerEnd-Date.now())/1000));",
    "  paintTimer(rem);",
    "  if(rem<=60&&!fading&&playing&&ctx){ fading=true;",
    "    try{ master.gain.cancelScheduledValues(ctx.currentTime);",
    "      master.gain.setValueAtTime(master.gain.value,ctx.currentTime);",
    "      master.gain.linearRampToValueAtTime(0.0001,ctx.currentTime+Math.max(1,rem)); }catch(e){} }",
    "  if(rem<=0){ halt(); }",
    "}",
    "function startClock(){",
    "  stopClock();",
    "  if(timerMin<=0||!HAS_TIMER){ return; }",
    "  timerEnd=Date.now()+timerMin*60000; fading=false;",
    "  timerInt=setInterval(tickTimer,1000); tickTimer();",
    "}",
    "function halt(){",
    "  stopClock(); stopMod(); playing=false;",
    "  try{ if(ctx){ ctx.suspend(); } }catch(e){}",
    "  note('Good night'); paintPlay(); paintTimer(0);",
    "}",
    "function togglePlay(){",
    "  if(!ensureAudio()){ note('Audio is not available on this device'); return; }",
    "  if(playing){",
    "    playing=false;",
    "    try{ master.gain.setTargetAtTime(0.0001,ctx.currentTime,0.05); }catch(e){}",
    "    var c2=ctx;",
    "    setTimeout(function(){ try{ c2.suspend(); }catch(e){} },220);",
    "    stopClock(); stopMod(); paintPlay();",
    "  }else{",
    "    if(ctx.state==='suspended'){ try{ ctx.resume(); }catch(e){} }",
    "    try{ master.gain.cancelScheduledValues(ctx.currentTime);",
    "      master.gain.setTargetAtTime(0.9,ctx.currentTime,0.08); }catch(e){}",
    "    playing=true; applyVols(); startMod(); startClock(); paintPlay();",
    "  }",
    "}",
    "function setTimerMin(m){",
    "  timerMin=m;",
    "  var pills=document.querySelectorAll('.tpill'),p;",
    "  for(p=0;p<pills.length;p++){",
    "    var on=parseInt(pills[p].getAttribute('data-min'),10)===m;",
    "    if(on){ pills[p].classList.add('on'); }else{ pills[p].classList.remove('on'); }",
    "  }",
    "  if(playing){ startClock(); } else { paintTimer(m*60); }",
    "}",
    "function sizeViz(){",
    "  if(!vizC){ return; }",
    "  var r=vizC.getBoundingClientRect(),d=window.devicePixelRatio||1;",
    "  vizC.width=Math.max(1,Math.floor(r.width*d)); vizC.height=Math.max(1,Math.floor(110*d));",
    "}",
    "function drawViz(){",
    "  requestAnimationFrame(drawViz);",
    "  if(!vizC||!vizX){ return; }",
    "  var W=vizC.width,H=vizC.height,i2,y;",
    "  vizX.clearRect(0,0,W,H); vizX.beginPath();",
    "  if(analyser&&playing){",
    "    var data=new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(data);",
    "    var step=Math.max(1,Math.floor(data.length/W));",
    "    for(i2=0;i2<W;i2++){ var v=data[i2*step]/128-1; y=H/2+v*H*0.42; if(i2){vizX.lineTo(i2,y);}else{vizX.moveTo(i2,y);} }",
    "  }else{",
    "    var t=Date.now()/1000;",
    "    for(i2=0;i2<W;i2+=2){ y=H/2+Math.sin(i2*0.05+t*1.2)*H*0.12+Math.sin(i2*0.013+t*0.6)*H*0.10; if(i2){vizX.lineTo(i2,y);}else{vizX.moveTo(i2,y);} }",
    "  }",
    "  vizX.strokeStyle=VB.acc; vizX.lineWidth=Math.max(2,W/200); vizX.stroke();",
    "}",
    "function init(){",
    "  var p=$('playbtn');",
    "  if(p){ p.addEventListener('pointerup',function(e){ e.preventDefault(); togglePlay(); }); }",
    "  var pills=document.querySelectorAll('.tpill'),q;",
    "  for(q=0;q<pills.length;q++){",
    "    (function(el){ el.addEventListener('pointerup',function(e){ e.preventDefault(); setTimerMin(parseInt(el.getAttribute('data-min'),10)); }); })(pills[q]);",
    "  }",
    "  var sl,sv;",
    "  for(var k=0;k<ORDER.length;k++){",
    "    (function(id){",
    "      var s2=$('sl-'+id), v2=$('sv-'+id);",
    "      vols[id]=(PRESET[id]||0);",
    "      if(s2){ s2.addEventListener('input',function(){ var v=parseInt(s2.value,10)||0; vols[id]=v/100; if(v2){v2.textContent=String(v);} applyVols(); }); }",
    "    })(ORDER[k]);",
    "  }",
    "  vizC=$('viz');",
    "  if(vizC){ vizX=vizC.getContext('2d'); sizeViz(); drawViz();",
    "    window.addEventListener('resize',sizeViz); window.addEventListener('orientationchange',function(){ setTimeout(sizeViz,300); }); }",
    "}",
    "if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',init); }else{ init(); }",
    "window.MOOR_DEBUG={",
    "  info:function(){ var g={},k; for(k=0;k<ORDER.length;k++){ var id=ORDER[k]; g[id]=gains[id]?Math.round(gains[id].gain.value*1000)/1000:0; }",
    "    return {audio:built,state:ctx?ctx.state:'none',playing:playing,sounds:Object.keys(gains).length,gains:g,vols:vols,timerMin:timerMin,",
    "      timerRemain:timerEnd?Math.max(0,Math.round((timerEnd-Date.now())/1000)):0,visualizer:!!vizC}; },",
    "  setVol:function(id,v){ var el=$('sl-'+id); if(el){ el.value=String(v); var ev=new Event('input',{bubbles:true}); el.dispatchEvent(ev); } },",
    "  play:function(){ togglePlay(); },",
    "  setTimer:function(m){ setTimerMin(m); }",
    "};"
  ];

  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n' +
    '<meta name="theme-color" content="'+V.meta+'">\n' +
    '<title>Sleep Sounds</title>\n<style>\n' + css.join('\n') + '\n</style>\n</head>\n' +
    '<body data-vibe="'+c.vibe+'">\n' + html + '\n' +
    '<scr'+'ipt>\n' + js.join('\n') + '\n</scr'+'ipt>\n</body>\n</html>\n';
}

window.MoorKit = { build: build };
})();
