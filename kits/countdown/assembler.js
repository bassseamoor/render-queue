"use strict";
/* Moor kit assembler: countdown — event countdowns with animated ambience. */
function build(config) {
  config = config && typeof config === "object" ? config : {};
  var first = strOpt(config.first, ["newyear", "christmas", "vacation", "custom"], "newyear");
  var theme = strOpt(config.theme, ["aurora", "sunrise", "minimal"], "aurora");
  var accent = strOpt(config.accent, ["violet", "aqua", "amber"], "violet");

  var themes = {
    aurora:  { bg1: "#070a16", bg2: "#0b1026", glowA: "rgba(139,92,246,.35)", glowB: "rgba(34,211,238,.28)", band: "aurora" },
    sunrise: { bg1: "#160b08", bg2: "#241206", glowA: "rgba(251,146,60,.32)", glowB: "rgba(244,114,182,.22)", band: "sunrise" },
    minimal: { bg1: "#0a0a0c", bg2: "#101014", glowA: "rgba(255,255,255,.05)", glowB: "rgba(255,255,255,.03)", band: "flat" }
  };
  var accents = {
    violet: { main: "#a78bfa", deep: "#7c3aed", soft: "rgba(167,139,250,.16)" },
    aqua:   { main: "#22d3ee", deep: "#0e7490", soft: "rgba(34,211,238,.14)" },
    amber:  { main: "#fbbf24", deep: "#b45309", soft: "rgba(251,191,36,.14)" }
  };
  var T = themes[theme], A = accents[accent];

  var cfg = { first: first, theme: theme, accent: accent };

  var css = [
    "*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}",
    "html,body{height:100%}",
    "body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',system-ui,sans-serif;",
    "background:radial-gradient(120% 90% at 50% 0%," + T.bg2 + " 0%," + T.bg1 + " 70%);",
    "color:#f4f4f6;min-height:100%;overflow:hidden;position:fixed;inset:0;width:100%}",
    "#stars{position:fixed;inset:0;pointer-events:none;z-index:0}",
    ".band{position:fixed;left:-20%;right:-20%;height:34vh;filter:blur(70px);opacity:.55;pointer-events:none;z-index:0}",
    ".band.b1{top:-8vh;background:" + T.glowA + "}",
    ".band.b2{top:16vh;background:" + T.glowB + "}",
    ".flat .band{display:none}",
    "#app{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;max-width:480px;margin:0 auto;padding:0 18px}",
    "header{display:flex;align-items:center;justify-content:space-between;padding:18px 0 6px}",
    "h1{font-size:20px;margin:0;letter-spacing:.4px;font-weight:700}",
    ".sub{font-size:12px;opacity:.55;margin-top:2px}",
    ".iconbtn{width:48px;height:48px;border-radius:16px;border:1px solid rgba(255,255,255,.12);",
    "background:rgba(255,255,255,.06);color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;cursor:pointer}",
    ".iconbtn:active{transform:scale(.94)}",
    "#stage{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;min-height:0}",
    "#evname{font-size:15px;font-weight:600;opacity:.85;margin:0 0 2px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "#evdate{font-size:12px;opacity:.5;margin:0 0 14px}",
    "#digits{display:flex;gap:8px;justify-content:center;align-items:stretch}",
    ".cell{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:16px;",
    "min-width:72px;padding:12px 6px;backdrop-filter:blur(8px)}",
    ".num{font-size:40px;font-weight:800;font-variant-numeric:tabular-nums;color:" + A.main + ";line-height:1}",
    ".lbl{font-size:10px;letter-spacing:2px;opacity:.55;margin-top:6px;text-transform:uppercase}",
    "#statusline{margin-top:14px;font-size:13px;opacity:.65;min-height:18px}",
    "#party{display:none;text-align:center}",
    "#party .big{font-size:34px;font-weight:800;color:" + A.main + ";margin:0}",
    "#party p{opacity:.7;font-size:14px}",
    "#confetti{position:fixed;inset:0;pointer-events:none;z-index:5}",
    "#list{max-height:26vh;overflow-y:auto;margin:0 0 8px;padding:2px}",
    ".row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);",
    "border-radius:16px;padding:10px 12px;margin-bottom:8px;cursor:pointer;min-height:56px}",
    ".row.active{border-color:" + A.main + ";background:" + A.soft + "}",
    ".row .nm{flex:1;min-width:0}",
    ".row .nm b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".row .nm span{font-size:11px;opacity:.55;font-variant-numeric:tabular-nums}",
    ".del{width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#ff8a8a;font-size:16px;cursor:pointer;flex:none}",
    ".del.armed{background:#ff3b30;border-color:#ff3b30;color:#fff}",
    "#sheet{position:fixed;inset:0;z-index:10;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.55)}",
    "#sheet.open{display:flex}",
    "#card{width:100%;max-width:480px;background:#141419;border-radius:24px 24px 0 0;padding:22px 20px 30px;border:1px solid rgba(255,255,255,.1)}",
    "#card h2{margin:0 0 14px;font-size:18px}",
    "#card label{display:block;font-size:12px;opacity:.6;margin:12px 0 6px;letter-spacing:.5px}",
    "#card input,#card select{width:100%;font-size:17px;padding:13px 14px;border-radius:14px;border:1px solid rgba(255,255,255,.14);",
    "background:rgba(255,255,255,.06);color:#fff;font-family:inherit}",
    "#card input[type=datetime-local]{color-scheme:dark}",
    ".btnrow{display:flex;gap:10px;margin-top:20px}",
    ".btn{flex:1;min-height:52px;border-radius:16px;font-size:16px;font-weight:700;border:none;cursor:pointer}",
    ".btn.primary{background:" + A.main + ";color:#0b0b10}",
    ".btn.primary:active{transform:scale(.97)}",
    ".btn.ghost{background:rgba(255,255,255,.07);color:#fff}",
    ".btn:active{transform:scale(.97)}",
    "#sharebar{display:none;gap:10px;margin-top:10px}",
    "#sharebar.show{display:flex}",
    ".hint{font-size:12px;opacity:.5;text-align:center;margin:6px 0 10px}",
    "::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(34,197,94,.5);border-radius:3px}"
  ].join("\n");

  var body = [
    '<canvas id="stars"></canvas>',
    '<div class="band b1"></div><div class="band b2"></div>',
    '<canvas id="confetti"></canvas>',
    '<div id="app">',
    '  <header><div><h1>Countdown</h1><div class="sub" id="countsub"></div></div>',
    '  <button class="iconbtn" id="addbtn" aria-label="Add countdown">＋</button></header>',
    '  <div id="stage">',
    '    <p id="evname"></p><p id="evdate"></p>',
    '    <div id="digits">',
    '      <div class="cell"><div class="num" id="d">0</div><div class="lbl">days</div></div>',
    '      <div class="cell"><div class="num" id="h">0</div><div class="lbl">hrs</div></div>',
    '      <div class="cell"><div class="num" id="m">0</div><div class="lbl">min</div></div>',
    '      <div class="cell"><div class="num" id="s">0</div><div class="lbl">sec</div></div>',
    '    </div>',
    '    <div id="party"><p class="big">🎉 IT\'S TIME! 🎉</p><p id="partyname"></p></div>',
    '    <p id="statusline"></p>',
    '    <div id="sharebar"><button class="btn ghost" id="sharebtn" style="flex:1;min-height:48px">Share this date</button></div>',
    '  </div>',
    '  <p class="hint">Tap an event to switch · tap ＋ to add one</p>',
    '  <div id="list"></div>',
    '</div>',
    '<div id="sheet"><div id="card">',
    '  <h2>New countdown</h2>',
    '  <label for="fname">Event name</label><input id="fname" maxlength="40" autocomplete="off">',
    '  <label for="fdate">Date &amp; time</label><input id="fdate" type="datetime-local">',
    '  <div class="btnrow"><button class="btn ghost" id="cancelbtn">Cancel</button>',
    '  <button class="btn primary" id="savebtn">Start countdown</button></div>',
    '</div></div>'
  ].join("\n");

  var appjs = [
    "(function(){",
    "var CFG=__CFG__;",
    "var state={events:[],active:0,partied:{}};",
    "try{var raw=localStorage.getItem('cd.v1');if(raw){var s=JSON.parse(raw);if(s&&s.events)state=s;}}catch(e){}",
    "function save(){try{localStorage.setItem('cd.v1',JSON.stringify(state));}catch(e){}}",
    "function presets(){",
    "  var now=new Date();var list=[];",
    "  if(CFG.first==='newyear'){var y=now.getFullYear();var d=new Date(y+1,0,1,0,0,0);list.push({name:'New Year',at:d.getTime()});}",
    "  else if(CFG.first==='christmas'){var y2=now.getFullYear();var c=new Date(y2,11,25,0,0,0);if(c.getTime()<now.getTime())c=new Date(y2+1,11,25,0,0,0);list.push({name:'Christmas',at:c.getTime()});}",
    "  else if(CFG.first==='vacation'){list.push({name:'Vacation',at:now.getTime()+30*864e5});}",
    "  return list;",
    "}",
    "if(!state.events.length){state.events=presets();}",
    "var $=function(id){return document.getElementById(id);};",
    "var shareUntil=0;",
    "var digits=$('digits'),party=$('party'),statusline=$('statusline'),list=$('list');",
    "function fmtDate(t){var d=new Date(t);return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})+' · '+d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});}",
    "function ago(ms){var s=Math.max(0,Math.floor(ms/1000));var d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);s=s%60;return{d:d,h:h,m:m,s:s};}",
    "function renderList(){",
    "  list.innerHTML='';",
    "  $('countsub').textContent=state.events.length+(state.events.length===1?' event':' events');",
    "  state.events.forEach(function(ev,i){",
    "    var row=document.createElement('div');row.className='row'+(i===state.active?' active':'');",
    "    var left=ago(ev.at-Date.now());",
    "    var nm=document.createElement('div');nm.className='nm';",
    "    var b=document.createElement('b');b.textContent=ev.name;",
    "    var sp=document.createElement('span');sp.textContent=left.d>0?left.d+'d '+left.h+'h to go':'happening soon';",
    "    nm.appendChild(b);nm.appendChild(sp);",
    "    var del=document.createElement('button');del.className='del';del.setAttribute('aria-label','Delete '+ev.name);del.textContent='✕';",
    "    del.addEventListener('pointerup',function(e){e.stopPropagation();",
    "      if(!del.classList.contains('armed')){del.classList.add('armed');del.dataset.t=setTimeout(function(){del.classList.remove('armed');},2600);}",
    "      else{clearTimeout(del.dataset.t);state.events.splice(i,1);if(state.active>=state.events.length)state.active=0;save();renderList();}",
    "    });",
    "    row.appendChild(nm);row.appendChild(del);",
    "    row.addEventListener('pointerup',function(){state.active=i;save();renderList();});",
    "    list.appendChild(row);",
    "  });",
    "}",
    "function tick(){",
    "  var ev=state.events[state.active];",
    "  if(!ev){digits.style.display='none';party.style.display='none';$('evname').textContent='';$('evdate').textContent='';statusline.textContent='No countdowns yet — tap ＋ to add one.';$('sharebar').classList.remove('show');return;}",
    "  var ms=ev.at-Date.now();",
    "  if(ms<=0){",
    "    digits.style.display='none';party.style.display='block';$('partyname').textContent=ev.name+' has arrived!';",
    "    $('evname').textContent=ev.name;$('evdate').textContent=fmtDate(ev.at);statusline.textContent='';",
    "    if(!state.partied[ev.at+ev.name]){state.partied[ev.at+ev.name]=1;burst();} save();return;",
    "  }",
    "  digits.style.display='flex';party.style.display='none';",
    "  var p=ago(ms);",
    "  $('d').textContent=p.d;$('h').textContent=String(p.h).padStart(2,'0');",
    "  $('m').textContent=String(p.m).padStart(2,'0');$('s').textContent=String(p.s).padStart(2,'0');",
    "  $('evname').textContent=ev.name;$('evdate').textContent=fmtDate(ev.at);",
    "  if(Date.now()>shareUntil)statusline.textContent=p.d>1?p.d+' days to go':p.h>0?'under a day to go':'less than an hour to go';",
    "  $('sharebar').classList.add('show');renderListSoon();",
    "}",
    "var listT=0;function renderListSoon(){if(listT)return;listT=setTimeout(function(){listT=0;renderList();},9000);}",
    "function burst(){",
    "  var c=$('confetti'),x=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;",
    "  var cols=['"+A.main+"','#fff','#22d3ee','#fbbf24','#f472b6'];var ps=[];",
    "  for(var i=0;i<160;i++)ps.push({x:c.width/2,y:c.height*0.32,vx:(Math.random()-0.5)*11,vy:Math.random()*-9-2,g:0.28,s:Math.random()*6+3,r:Math.random()*6.28,c:cols[i%cols.length],l:90+Math.random()*40});",
    "  var n=0;(function fr(){x.clearRect(0,0,c.width,c.height);var alive=false;",
    "    ps.forEach(function(p){if(n>p.l)return;p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.r+=0.1;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/2,p.s,p.s*0.6);x.restore();if(p.y<c.height+20)alive=true;});",
    "    n++;if(alive&&n<400)requestAnimationFrame(fr);else x.clearRect(0,0,c.width,c.height);})();",
    "}",
    "function stars(){",
    "  var c=$('stars');try{var x=c.getContext('2d');}catch(e){return;}",
    "  function size(){c.width=innerWidth;c.height=innerHeight;}size();",
    "  var ps=[];for(var i=0;i<110;i++)ps.push({x:Math.random(),y:Math.random(),r:Math.random()*1.4+0.3,v:Math.random()*0.0004+0.0001,o:Math.random()*0.6+0.2});",
    "  function dr(){try{x.clearRect(0,0,c.width,c.height);}catch(e){return;}var g=x.createLinearGradient(0,0,0,c.height);",
    "    g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(1,'rgba(255,255,255,0)');",
    "    ps.forEach(function(p){p.y-=p.v;if(p.y<0)p.y=1;x.globalAlpha=p.o;x.fillStyle='#cfe6ff';x.beginPath();x.arc(p.x*c.width,p.y*c.height,p.r,0,6.29);x.fill();});",
    "    x.globalAlpha=1;requestAnimationFrame(dr);}",
    "  dr();addEventListener('resize',size);",
    "}",
    "if(CFG.theme!=='minimal')stars();else document.body.classList.add('flat');",
    "$('addbtn').addEventListener('pointerup',function(){$('sheet').classList.add('open');var d=new Date(Date.now()+7*864e5);try{$('fdate').value=d.toISOString().slice(0,16);}catch(e){}$('fname').value='';});",
    "$('cancelbtn').addEventListener('pointerup',function(){$('sheet').classList.remove('open');});",
    "$('sheet').addEventListener('pointerup',function(e){if(e.target===$('sheet'))$('sheet').classList.remove('open');});",
    "$('savebtn').addEventListener('pointerup',function(){",
    "  var name=$('fname').value.trim()||'My event';var v=$('fdate').value;",
    "  var t=v?new Date(v).getTime():Date.now()+7*864e5;if(!isFinite(t))t=Date.now()+7*864e5;",
    "  state.events.push({name:name,at:t});state.active=state.events.length-1;save();renderList();$('sheet').classList.remove('open');",
    "});",
    "$('sharebtn').addEventListener('pointerup',function(){",
    "  var ev=state.events[state.active];if(!ev)return;",
    "  var msg='Counting down to '+ev.name+' — '+fmtDate(ev.at);",
    "  function done(ok){shareUntil=Date.now()+2600;statusline.textContent=ok?'Copied to clipboard ✓':'Copy this: '+msg;}",
    "  try{if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(msg).then(function(){done(true);},function(){done(false);});}else done(false);}",
    "  catch(e){done(false);}",
    "});",
    "renderList();tick();setInterval(tick,250);",
    "})();"
  ].join("\n").split("__CFG__").join(JSON.stringify(cfg));

  var html = "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover\">\n" +
    "<title>Countdown</title>\n<style>\n" + css + "\n</style>\n</head>\n<body>\n" +
    body + "\n<script>\n" + appjs + "\n</" + "script>\n</body>\n</html>";
  return html;
}

function strOpt(v, allowed, fb) {
  if (typeof v === "string" && allowed.indexOf(v) !== -1) return v;
  return fb;
}

if (typeof window !== "undefined") { window.MoorKit = { build: build }; }
if (typeof module !== "undefined" && module.exports) { module.exports = { build: build }; }
