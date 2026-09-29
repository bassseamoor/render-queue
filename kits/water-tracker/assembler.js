/* Moor kit: water-tracker v1.0.0
 * Engine: window.MoorKit.build(config) -> complete <!DOCTYPE html> document.
 * config: { goal: "g1500"|"g2000"|"g2500"|"g3000", sizes: "classic"|"sport"|"sips",
 *           style: "bottle"|"glass"|"drop", accent: "aqua"|"lagoon"|"deepsea" }
 * Touch-first: all taps handled via pointerup with a movement guard (never
 * synthesized click, per the iOS tap rule).
 * Storage: localStorage wrapped in try/catch; app runs fully in-memory if blocked.
 */
(function () {
'use strict';

var STYLES = {
  bottle: {
    d: "M82,32 h36 v26 c22,8 30,22 30,44 v176 c0,22 -18,40 -40,40 H92 c-22,0 -40,-18 -40,-40 V102 c0,-22 8,-36 30,-44 z",
    cap: "<rect class=\"cap\" x=\"80\" y=\"8\" width=\"40\" height=\"24\" rx=\"7\"/>",
    top: 64, bottom: 308
  },
  glass: {
    d: "M64,36 L84,302 Q85,316 97,316 H103 Q115,316 116,302 L136,36 Z",
    cap: "",
    top: 54, bottom: 300
  },
  drop: {
    d: "M100,16 C100,16 50,112 50,182 a50,50 0 0,0 100,0 C150,112 100,16 100,16 Z",
    cap: "",
    top: 106, bottom: 236
  }
};
var GOALS = { g1500: 1500, g2000: 2000, g2500: 2500, g3000: 3000 };
var SIZES = { classic: [250, 500], sport: [330, 500, 750], sips: [150, 250, 350] };

var CSS = [
"*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}",
"html,body{margin:0;padding:0}",
"body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,sans-serif;min-height:100vh;background:var(--bg);color:var(--tx);touch-action:manipulation;-webkit-font-smoothing:antialiased}",
"body{--bg:#070b12;--card:rgba(255,255,255,.05);--card2:rgba(255,255,255,.09);--tx:#f2f6fb;--mut:#8b96a8;--line:rgba(255,255,255,.1);--ok:#4ade80;--sheet:#10161f}",
"body[data-accent=aqua]{--acc:#3ae2ff;--acc2:#0d9fd6;--accL:#9beeff}",
"body[data-accent=lagoon]{--acc:#3fe0a8;--acc2:#0da271;--accL:#a5f3d2}",
"body[data-accent=deepsea]{--acc:#5ea9ff;--acc2:#2b6fd6;--accL:#b3d4ff}",
".wrap{max-width:480px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 22px) 20px calc(env(safe-area-inset-bottom,0px) + 60px)}",
".head{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}",
".date-line{font-size:13px;color:var(--mut);letter-spacing:.4px;margin:0 0 2px}",
"h1{font-size:34px;font-weight:800;margin:0;letter-spacing:-.5px}",
".streakchip{display:flex;align-items:center;gap:7px;background:var(--card);border:1px solid var(--line);border-radius:99px;padding:10px 16px}",
".streakchip .flame{font-size:18px}",
".streakchip b{font-size:20px}",
".streakchip span:last-child{font-size:12px;color:var(--mut)}",
"#nudge{display:none;align-items:center;justify-content:space-between;gap:10px;background:linear-gradient(135deg,rgba(58,226,255,.14),rgba(58,226,255,.05));border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:14px 0 0;font-size:15px;font-weight:600}",
"#nudge.on{display:flex}",
"#nudgex{width:40px;height:40px;flex:none;border:none;border-radius:12px;background:transparent;color:var(--mut);font-size:16px;display:flex;align-items:center;justify-content:center}",
".vesselwrap{display:flex;justify-content:center;margin:6px 0 0}",
"#vessel{width:210px;height:357px}",
".vesselline{fill:rgba(255,255,255,.03);stroke:rgba(255,255,255,.38);stroke-width:3;transition:stroke .4s,filter .4s}",
".cap{fill:var(--acc2)}",
"#vessel.full .vesselline{stroke:var(--acc);filter:drop-shadow(0 0 16px var(--acc))}",
".gs0{stop-color:var(--acc)}",
".gs1{stop-color:var(--acc2)}",
".wave1{fill:var(--acc);opacity:.55}",
".wave2{fill:#fff;opacity:.16}",
"#wg{transition:transform 1s cubic-bezier(.22,1,.36,1)}",
".wslide.s1{animation:wslide 6s linear infinite}",
".wslide.s2{animation:wslide 11s linear infinite reverse}",
"@keyframes wslide{from{transform:translateX(0)}to{transform:translateX(-120px)}}",
".totalrow{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:2px}",
"#total{font-size:52px;font-weight:800;letter-spacing:-1px}",
".ml{font-size:20px;color:var(--mut);font-weight:600;margin-left:2px}",
".pctpill{font-size:15px;font-weight:800;color:var(--acc);background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:99px;padding:7px 14px}",
".goaltext{text-align:center;font-size:15px;color:var(--mut);margin:6px 0 0}",
".remain{text-align:center;font-size:16px;font-weight:700;margin:10px 0 0}",
".remain.done{color:var(--ok)}",
".pace{text-align:center;font-size:14px;color:var(--mut);margin:8px 0 0}",
".pace .ok{color:var(--ok);font-weight:700}",
".pace b{color:var(--tx)}",
".undo{display:none;align-items:center;justify-content:center;gap:6px;margin:14px auto 0;min-height:44px;padding:8px 18px;border-radius:99px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:14px;font-weight:700}",
".undo:active{transform:scale(.96)}",
".sec{font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--mut);margin:26px 2px 12px}",
".qgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}",
".qbtn{min-height:68px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--tx);font-size:22px;font-weight:800;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}",
".qbtn span{font-size:11px;font-weight:600;color:var(--mut)}",
".qbtn:active{transform:scale(.95);background:var(--card2)}",
".customrow{display:flex;gap:10px;margin-top:10px}",
".customwrap{flex:1;display:flex;flex-direction:column;gap:6px}",
".clab{font-size:12px;font-weight:700;color:var(--mut);letter-spacing:.6px;text-transform:uppercase}",
"#customamt{flex:1;min-height:56px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--tx);font-size:18px;font-weight:700;padding:0 16px;outline:none;width:100%}",
"#customamt:focus{border-color:var(--acc)}",
"#customadd{min-width:104px;min-height:56px;border-radius:14px;border:none;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#04222e;font-size:17px;font-weight:800}",
"#customadd:active{transform:scale(.96)}",
".hist{display:flex;gap:8px;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 12px 12px}",
".hcol{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}",
".hbarw{position:relative;width:100%;height:120px;display:flex;align-items:flex-end;justify-content:center}",
".hbar{width:70%;max-width:26px;border-radius:7px 7px 3px 3px;background:linear-gradient(180deg,var(--acc),var(--acc2));transition:height .6s ease}",
".hcol.today .hbar{box-shadow:0 0 12px var(--acc)}",
".gline{position:absolute;left:8%;right:8%;height:2px;background:rgba(255,255,255,.45);border-radius:2px}",
".hlbl{font-size:11px;font-weight:700;color:var(--mut)}",
".hcol.today .hlbl{color:var(--acc)}",
".hml{font-size:10px;font-weight:700;color:var(--mut)}",
".resetbtn{display:flex;align-items:center;justify-content:center;margin:26px auto 0;min-height:48px;padding:10px 26px;border-radius:99px;border:1px solid var(--line);background:transparent;color:var(--mut);font-size:14px;font-weight:700}",
".resetbtn[data-armed=\"1\"]{color:#ff8f8f;border-color:rgba(255,120,120,.5)}",
".resetbtn:active{transform:scale(.96)}",
"#toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 28px);transform:translateX(-50%) translateY(20px);background:rgba(20,26,36,.95);border:1px solid var(--line);color:var(--tx);font-size:15px;font-weight:600;padding:13px 22px;border-radius:99px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;z-index:60;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis}",
"#toast.on{opacity:1;transform:translateX(-50%) translateY(0)}",
".pdrop{position:fixed;width:10px;height:13px;border-radius:50% 50% 50% 50%/55% 55% 45% 45%;background:var(--acc);pointer-events:none;z-index:60;animation:pburst .9s ease-out forwards}",
"@keyframes pburst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}"
].join("\n");

var APP = [
"function $(id){return document.getElementById(id);}",
"var toastT=null;",
"function toast(msg){var t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on');},2200);}",
"function onTap(el,fn){if(!el||!fn)return;var down=false,sx=0,sy=0;el.addEventListener('pointerdown',function(e){down=true;sx=e.clientX;sy=e.clientY;});el.addEventListener('pointerup',function(e){if(!down)return;down=false;if(Math.abs(e.clientX-sx)<14&&Math.abs(e.clientY-sy)<14){fn(e);}});el.addEventListener('pointercancel',function(){down=false;});}",
"function pad(n){return (n<10?'0':'')+n;}",
"function todayKey(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}",
"function keyDaysAgo(n){var d=new Date();d.setDate(d.getDate()-n);return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}",
"function dayLetter(n){var d=new Date();d.setDate(d.getDate()-n);return 'SMTWTFS'.charAt(d.getDay());}",
"function fmt(n){n=Math.round(n);return n.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g,',');}",
"function goalMl(){return GOALS[CFG.goal]||2000;}",
"var state={dayKey:todayKey(),today:0,log:[],history:{},lastSip:0,snooze:0};",
"var LSKEY='moor.water.v1';",
"function lsGet(){try{var s=window.localStorage.getItem(LSKEY);return s?JSON.parse(s):null;}catch(e){return null;}}",
"function lsSet(v){try{window.localStorage.setItem(LSKEY,JSON.stringify(v));}catch(e){}}",
"function save(){lsSet({dayKey:state.dayKey,today:state.today,log:state.log,history:state.history,lastSip:state.lastSip});}",
"function load(){var s=lsGet();if(!s||typeof s!=='object')return;state.today=Math.max(0,Math.floor(+s.today)||0);if(Array.isArray(s.log)){state.log=s.log.filter(function(n){return n>0&&n<=5000;}).slice(0,200);}if(s.history&&typeof s.history==='object'){var h={},k;for(k in s.history){if(/^\\d{4}-\\d{2}-\\d{2}$/.test(k)){var v=Math.floor(+s.history[k]);if(v>0&&v<=20000)h[k]=v;}}state.history=h;}state.lastSip=Math.floor(+s.lastSip)||0;if(typeof s.dayKey==='string'&&/^\\d{4}-\\d{2}-\\d{2}$/.test(s.dayKey))state.dayKey=s.dayKey;}",
"function checkDay(){var k=todayKey();if(k!==state.dayKey){if(state.today>0)state.history[state.dayKey]=state.today;state.dayKey=k;state.today=0;state.log=[];state.lastSip=0;save();}}",
"function addMl(n){n=Math.floor(+n);if(!(n>0))return;if(n>5000)n=5000;checkDay();var before=state.today;state.today+=n;state.log.push(n);if(state.log.length>200)state.log.shift();state.lastSip=Date.now();hideNudge();render();save();if(before<goalMl()&&state.today>=goalMl()){goalBurst();toast('Goal reached! Nicely hydrated.');}else{toast('+'+fmt(n)+' ml');}}",
"function undoLast(){if(!state.log.length)return;var n=state.log.pop();state.today=Math.max(0,state.today-n);render();save();toast('Undid +'+fmt(n)+' ml');}",
"var armT=null;",
"function resetTap(){var b=$('resetbtn');if(b.getAttribute('data-armed')==='1'){b.removeAttribute('data-armed');b.textContent='Reset today';state.today=0;state.log=[];state.lastSip=0;render();save();toast('Day reset');}else{b.setAttribute('data-armed','1');b.textContent='Tap again to confirm';clearTimeout(armT);armT=setTimeout(function(){b.removeAttribute('data-armed');b.textContent='Reset today';},3000);}}",
"function streak(){var s=0;var start=(state.today>=goalMl())?0:1;for(var i=start;i<500;i++){var ml=(i===0)?state.today:(state.history[keyDaysAgo(i)]||0);if(ml>=goalMl())s++;else break;}return s;}",
"function renderPace(){var g=goalMl(),t=state.today,el=$('pace');if(!el)return;if(t>=g){el.innerHTML='<span class=\"ok\">Goal crushed — nice work.</span>';return;}var d=new Date();var mins=d.getHours()*60+d.getMinutes();var exp=g*Math.max(0,Math.min(1,(mins-420)/960));var diff=exp-t;if(diff>=150){el.innerHTML='Behind pace by <b>'+fmt(diff)+' ml</b> — a glass will fix it.';}else{el.innerHTML='<span class=\"ok\">On pace.</span> Keep sipping.';}}",
"function renderHist(){var g=goalMl(),days=[],max=g,i;for(i=6;i>=0;i--){var ml=(i===0)?state.today:(state.history[keyDaysAgo(i)]||0);days.push({ml:ml,today:i===0,lbl:dayLetter(i)});if(ml>max)max=ml;}var html='';for(i=0;i<days.length;i++){var d=days[i];var h=Math.round(d.ml/max*100);var gl=Math.round(g/max*100);html+='<div class=\"hcol'+(d.today?' today':'')+'\"><div class=\"hbarw\"><div class=\"gline\" style=\"bottom:'+gl+'%\"></div><div class=\"hbar\" style=\"height:'+h+'%\"></div></div><span class=\"hlbl\">'+d.lbl+'</span><b class=\"hml\">'+fmt(d.ml)+'</b></div>';}$('hist').innerHTML=html;}",
"function render(){checkDay();var g=goalMl(),t=state.today;var f=g>0?Math.min(1,t/g):0;var st=STYLES[CFG.style]||STYLES.bottle;var surfY=st.bottom-f*(st.bottom-st.top);var wg=$('wg');if(wg)wg.style.transform='translate(0,'+surfY.toFixed(1)+'px)';var wb=$('wb');if(wb){wb.setAttribute('y',Math.round(surfY));wb.setAttribute('height',Math.max(0,Math.round(360-surfY)));}var svg=$('vessel');if(svg){if(f>=1)svg.setAttribute('class','full');else svg.removeAttribute('class');}$('total').textContent=fmt(t);$('goaltext').textContent='/ '+fmt(g)+' ml';$('pct').textContent=Math.round(f*100)+'%';var rem=$('remain');if(t>=g){rem.textContent='Goal reached — stay hydrated!';rem.className='remain done';}else{rem.textContent=fmt(g-t)+' ml to go';rem.className='remain';}renderPace();var sk=streak();$('streakn').textContent=sk;$('streaklab').textContent=(sk===1?'day':'days');var u=$('undobtn');if(state.log.length){u.style.display='flex';u.innerHTML='&#8617; Undo +'+fmt(state.log[state.log.length-1])+' ml';}else{u.style.display='none';}renderHist();}",
"function goalBurst(){var r=$('vesselwrap').getBoundingClientRect();var cx=r.left+r.width/2,cy=r.top+r.height*0.35;for(var i=0;i<16;i++){var s=document.createElement('span');s.className='pdrop';var a=Math.random()*Math.PI*2,dist=60+Math.random()*110;s.style.left=cx+'px';s.style.top=cy+'px';s.style.setProperty('--dx',Math.cos(a)*dist+'px');s.style.setProperty('--dy',(Math.sin(a)*dist-60)+'px');document.body.appendChild(s);(function(el){setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},950);})(s);}}",
"function showNudge(){var n=$('nudge');if(n)n.classList.add('on');}",
"function hideNudge(){var n=$('nudge');if(n)n.classList.remove('on');}",
"function nudgeTick(){if(state.today>=goalMl())return;if(!state.lastSip)return;var now=Date.now();if(now-state.snooze<45*60*1000)return;if(now-state.lastSip>45*60*1000)showNudge();}",
"function init(){",
"  load();checkDay();",
"  var d=new Date();var days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];var mon=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];",
"  $('dateline').textContent=days[d.getDay()]+', '+mon[d.getMonth()]+' '+d.getDate();",
"  render();",
"  var qs=document.querySelectorAll('.qbtn');for(var i=0;i<qs.length;i++){(function(b){onTap(b,function(){addMl(+b.getAttribute('data-ml'));});})(qs[i]);}",
"  onTap($('customadd'),function(){var v=parseInt($('customamt').value,10);if(v>0){addMl(v);$('customamt').value='';}else{toast('Enter an amount in ml');}});",
"  onTap($('undobtn'),undoLast);",
"  onTap($('resetbtn'),resetTap);",
"  onTap($('nudgex'),function(){state.snooze=Date.now();hideNudge();});",
"  window.addEventListener('resize',render);",
"  window.addEventListener('orientationchange',function(){setTimeout(render,300);});",
"  document.addEventListener('visibilitychange',function(){if(!document.hidden){checkDay();render();}});",
"  setInterval(function(){checkDay();render();},30000);",
"  setInterval(nudgeTick,45000);",
"  nudgeTick();",
"}",
"window.MOOR_DEBUG={state:function(){return state;},addMl:addMl,undo:undoLast,render:render,streak:streak,goal:goalMl,setLastSip:function(t){state.lastSip=t;},nudge:nudgeTick,CFG:CFG,STYLES:STYLES};",
"init();"
].join("\n");

var BODY = [
"<div class=\"wrap\">",
"  <div class=\"head\">",
"    <div><p class=\"date-line\" id=\"dateline\"></p><h1>Water</h1></div>",
"    <div class=\"streakchip\"><span class=\"flame\">&#128293;</span><b id=\"streakn\">0</b><span id=\"streaklab\">days</span></div>",
"  </div>",
"  <div id=\"nudge\" role=\"status\"><span>&#128167; Time for a sip?</span><button id=\"nudgex\" aria-label=\"dismiss reminder\">&#10005;</button></div>",
"  <div class=\"vesselwrap\" id=\"vesselwrap\">",
"    <svg id=\"vessel\" viewBox=\"0 0 200 340\" aria-hidden=\"true\">",
"      <defs>",
"        <clipPath id=\"vclip\"><path d=\"%%OUTLINE%%\"/></clipPath>",
"        <linearGradient id=\"wgrad\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" class=\"gs0\"/><stop offset=\"1\" class=\"gs1\"/></linearGradient>",
"      </defs>",
"      <g clip-path=\"url(#vclip)\">",
"        <rect id=\"wb\" x=\"-60\" y=\"308\" width=\"320\" height=\"60\" fill=\"url(#wgrad)\"/>",
"        <g id=\"wg\" style=\"transform:translate(0,308px)\">",
"          <g class=\"wslide s1\"><path class=\"wave1\" d=\"M-160,-4 q30,-16 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 V48 H-160 Z\"/></g>",
"          <g class=\"wslide s2\"><path class=\"wave2\" d=\"M-190,-8 q30,-14 60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 t60,0 V48 H-190 Z\"/></g>",
"        </g>",
"      </g>",
"      <path class=\"vesselline\" d=\"%%OUTLINE%%\"/>",
"      %%CAP%%",
"    </svg>",
"  </div>",
"  <div class=\"totalrow\"><div><span id=\"total\">0</span><span class=\"ml\">ml</span></div><span class=\"pctpill\" id=\"pct\">0%</span></div>",
"  <div class=\"goaltext\" id=\"goaltext\">/ 2,000 ml</div>",
"  <p class=\"remain\" id=\"remain\">2,000 ml to go</p>",
"  <p class=\"pace\" id=\"pace\"></p>",
"  <button class=\"undo\" id=\"undobtn\"></button>",
"  <div class=\"sec\">Log a drink</div>",
"  <div class=\"qgrid\">",
"%%QBTNS%%",
"  </div>",
"  <div class=\"customrow\"><div class=\"customwrap\"><label class=\"clab\" for=\"customamt\">Custom amount</label><input id=\"customamt\" type=\"number\" inputmode=\"numeric\" min=\"1\" max=\"5000\" aria-label=\"custom amount in ml\"></div><button id=\"customadd\">Add</button></div>",
"  <div class=\"sec\">This week</div>",
"  <div class=\"hist\" id=\"hist\"></div>",
"  <button class=\"resetbtn\" id=\"resetbtn\">Reset today</button>",
"</div>",
"<div id=\"toast\"></div>"
].join("\n");

var GOAL_IDS = ['g1500', 'g2000', 'g2500', 'g3000'];
var SIZE_IDS = ['classic', 'sport', 'sips'];
var STYLE_IDS = ['bottle', 'glass', 'drop'];
var ACC_IDS = ['aqua', 'lagoon', 'deepsea'];

function normConfig(c) {
  c = (c && typeof c === 'object' && !Array.isArray(c)) ? c : {};
  return {
    goal: GOAL_IDS.indexOf(c.goal) >= 0 ? c.goal : 'g2000',
    sizes: SIZE_IDS.indexOf(c.sizes) >= 0 ? c.sizes : 'classic',
    style: STYLE_IDS.indexOf(c.style) >= 0 ? c.style : 'bottle',
    accent: ACC_IDS.indexOf(c.accent) >= 0 ? c.accent : 'aqua'
  };
}

function build(config) {
  var cfg = normConfig(config);
  var st = STYLES[cfg.style];
  var qbtns = SIZES[cfg.sizes].map(function (n) {
    return '<button class="qbtn" data-ml="' + n + '">+' + n + '<span>ml</span></button>';
  }).join("\n");
  var body = BODY
    .replace(/%%OUTLINE%%/g, st.d)
    .replace('%%CAP%%', st.cap)
    .replace('%%QBTNS%%', qbtns);
  var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<meta name="theme-color" content="#070b12">\n' +
    '<title>Water Tracker</title>\n<style>\n' + CSS + '\n</style>\n</head>\n' +
    '<body data-accent="' + cfg.accent + '">\n' + body + '\n' +
    '<script>\nvar CFG=' + JSON.stringify(cfg) + ';\n' +
    'var STYLES=' + JSON.stringify(STYLES) + ';\n' +
    'var GOALS=' + JSON.stringify(GOALS) + ';\n' +
    APP + '\n</scr' + 'ipt>\n</body>\n</html>';
  return html;
}

window.MoorKit = { build: build };
})();
