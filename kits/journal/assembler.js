/* Moor kit assembler: journal (Daybook)
 * window.MoorKit.build(config) -> complete <!DOCTYPE html> document string.
 * No external URLs, no localStorage dependency, touch-first (pointerup),
 * zero console errors. Config: { vibe, prompts, extras }.
 */
(function () {
'use strict';

var THEME_COLORS = { midnight: '#0b0e14', paper: '#f6f1e7', dusk: '#160e2e' };

function sanitize(config) {
  config = (config && typeof config === 'object') ? config : {};
  var vibe = (config.vibe === 'paper' || config.vibe === 'dusk') ? config.vibe : 'midnight';
  var prompts = (config.prompts === 'deep' || config.prompts === 'none') ? config.prompts : 'daily';
  var extras = ['mood', 'words'];
  if (Array.isArray(config.extras)) {
    extras = config.extras.filter(function (e) { return e === 'mood' || e === 'words'; });
  }
  return { vibe: vibe, prompts: prompts, extras: extras };
}

function build(config) {
  var c = sanitize(config);
  var html = TPL;
  html = html.split('/*__CONFIG__*/').join(JSON.stringify(c));
  html = html.split('/*__THEME__*/').join(THEME_COLORS[c.vibe]);
  html = html.split('__VIBE__').join(c.vibe);
  return html;
}

var TPL = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="theme-color" content="/*__THEME__*/">
<title>Daybook</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
[hidden]{display:none!important}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Segoe UI,Roboto,Helvetica,Arial,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent;color:var(--ink);background:var(--bg);min-height:100%}
body[data-vibe="midnight"]{--bg:#0b0e14;--bg2:#11151f;--card:rgba(255,255,255,.045);--line:rgba(255,255,255,.09);--ink:#eef1f6;--muted:#8f97ab;--accent:#7dd3a8;--sel:rgba(125,211,168,.16)}
body[data-vibe="paper"]{--bg:#f6f1e7;--bg2:#ece4d2;--card:#fffdf7;--line:#e0d5bd;--ink:#2c2620;--muted:#8b7f68;--accent:#b3541e;--sel:rgba(179,84,30,.12)}
body[data-vibe="dusk"]{--bg:linear-gradient(180deg,#160e2e 0%,#241243 55%,#33164b 100%);--bg2:#1e1238;--card:rgba(255,255,255,.055);--line:rgba(255,255,255,.12);--ink:#f4ecff;--muted:#b3a1d4;--accent:#ff9d6b;--sel:rgba(255,157,107,.16)}
body[data-vibe="dusk"]{background-attachment:fixed}
.wrap{max-width:560px;margin:0 auto;padding:calc(10px + env(safe-area-inset-top)) 14px calc(28px + env(safe-area-inset-bottom))}
header.top{display:flex;align-items:center;justify-content:space-between;padding:6px 2px 4px}
.brand{font-size:20px;font-weight:700;letter-spacing:-.3px}
.streak{font-size:13px;font-weight:600;color:var(--muted);background:var(--card);border:1px solid var(--line);padding:8px 14px;border-radius:999px;min-height:44px;display:flex;align-items:center}
.dateLine{font-size:13px;color:var(--muted);margin:2px 2px 8px}
#strip{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 10px;-webkit-overflow-scrolling:touch;scrollbar-width:none}
#strip::-webkit-scrollbar{display:none}
.day{flex:0 0 56px;min-height:66px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:inherit;font-size:12px;cursor:pointer;user-select:none;-webkit-user-select:none;position:relative}
.day .dow{color:var(--muted);font-size:11px;text-transform:uppercase}
.day .num{font-size:18px;font-weight:700}
.day .dot{width:5px;height:5px;border-radius:50%;background:var(--accent);position:absolute;bottom:7px;opacity:0}
.day.has .dot{opacity:1}
.day.sel{background:var(--sel);border-color:var(--accent)}
.day.today .num{color:var(--accent)}
#prompt{font-size:14px;line-height:1.5;color:var(--muted);font-style:italic;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;margin:2px 0 10px}
#prompt b{color:var(--accent);font-style:normal;font-weight:700}
#moods{display:flex;gap:8px;margin:0 0 10px}
.mood{flex:1;min-height:54px;font-size:24px;border-radius:14px;border:1px solid var(--line);background:var(--card);cursor:pointer;user-select:none;-webkit-user-select:none;display:flex;align-items:center;justify-content:center}
.mood.sel{background:var(--sel);border-color:var(--accent);transform:scale(1.05)}
#editorWrap{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
#editor{width:100%;min-height:230px;border:0;outline:0;resize:vertical;background:transparent;color:var(--ink);font:inherit;font-size:16px;line-height:1.55;padding:14px;display:block}
.metaRow{display:flex;justify-content:space-between;align-items:center;padding:10px 2px 0;font-size:12px;color:var(--muted);min-height:30px}
#searchRow{margin:14px 0 4px}
#search{width:100%;min-height:48px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);font:inherit;font-size:16px;padding:0 14px;outline:none}
#search:focus{border-color:var(--accent)}
.secTitle{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.9px;color:var(--muted);margin:16px 2px 8px}
.entry{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:10px 10px 10px 12px;margin-bottom:8px;min-height:66px;cursor:pointer;user-select:none;-webkit-user-select:none}
.entry .em{font-size:22px;flex:none;width:30px;text-align:center}
.entry .tx{flex:1;min-width:0}
.entry .dt{font-size:13px;font-weight:700;margin-bottom:2px}
.entry .pv{font-size:13px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.entry .del{flex:none;min-width:48px;min-height:48px;border-radius:12px;border:1px solid var(--line);background:transparent;color:var(--muted);font:inherit;font-size:16px;cursor:pointer}
.entry .del.armed{background:#b3261e;border-color:#b3261e;color:#fff;font-size:12px;font-weight:700}
.empty{color:var(--muted);font-size:14px;text-align:center;padding:22px 10px;line-height:1.5}
</style>
</head>
<body data-vibe="__VIBE__">
<div class="wrap">
  <header class="top">
    <div class="brand">📓 Daybook</div>
    <div class="streak" id="streak">🔥</div>
  </header>
  <div class="dateLine" id="dateLine"></div>
  <div id="strip" aria-label="Days"></div>
  <div id="prompt" hidden></div>
  <div id="moods" hidden></div>
  <div id="editorWrap"><textarea id="editor" placeholder="Write today’s story…" autocomplete="off" autocapitalize="sentences"></textarea></div>
  <div class="metaRow"><span id="words"></span><span id="saved"></span></div>
  <div id="searchRow"><input id="search" type="search" placeholder="Search entries…" autocomplete="off" aria-label="Search entries"></div>
  <div class="secTitle">Past entries</div>
  <div id="entries"></div>
</div>
<script>
(function(){
'use strict';
var CONFIG=/*__CONFIG__*/;
var LSKEY='moor.journal.v1';
var MOODS=['😞','😕','😐','🙂','😄'];
var DAILY=["What is one small thing that went well today?","Describe a moment today you want to remember.","What are you grateful for right now?","What is weighing on your mind? Get it out.","What did you learn today?","Who made your day better, and how?","What would make tomorrow great?","Write about something beautiful you noticed.","What is something you are looking forward to?","Describe your energy today in a few lines.","What challenge did you face, and how did you handle it?","What is one thing you want to let go of?","Write a note to your future self.","What made you smile today?"];
var DEEP=["What would you do if you knew you could not fail?","What belief have you outgrown?","When do you feel most like yourself?","What are you avoiding, and what would facing it change?","What does a meaningful life look like to you?","What would you tell yourself five years ago?","What do you want to be remembered for?","What fear is holding you back right now?","When was the last time you changed your mind about something important?","What do you need more of in your life? Less of?","What would you do with a completely free day?","What is the hardest truth you have learned?","Who do you want to become in the next year?","What does enough look like for you?"];
var WELCOME="Welcome to Daybook.\\n\\nThis is your space to think out loud. Write a few lines each day \u2014 no rules, no audience.\\n\\nTap a day above to travel back in time. Your words save automatically as you type.\\n\\nYou can delete this entry any time with the button beside it in the list below.";

function $(id){return document.getElementById(id);}
function pad(n){return (n<10?'0':'')+n;}
function isoOf(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parseISO(s){var p=String(s).split('-');return new Date(+p[0],+p[1]-1,+p[2]);}
function todayISO(){return isoOf(new Date());}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function hasX(arr,x){return arr.indexOf(x)>=0;}

var entries={};
var selected=todayISO();
var searchQ='';
var armDel=null;
var saveTimer=null;
var saveToken=0;

function saveLS(){try{localStorage.setItem(LSKEY,JSON.stringify({v:1,entries:entries}));}catch(e){}}
function loadLS(){try{var raw=localStorage.getItem(LSKEY);if(!raw)return false;var o=JSON.parse(raw);if(o&&o.entries&&typeof o.entries==='object'){entries=o.entries;return true;}}catch(e){}return false;}

function hasText(s){var e=entries[s];return !!(e&&e.text&&String(e.text).trim().length>0);}
function words(t){t=String(t||'').trim();return t===''?0:t.split(/\\s+/).length;}
function streak(){var n=0;var d=new Date();if(!hasText(isoOf(d)))d.setDate(d.getDate()-1);var guard=0;while(guard<366&&hasText(isoOf(d))){n++;d.setDate(d.getDate()-1);guard++;}return n;}
function dayOfYear(d){var s=new Date(d.getFullYear(),0,0);return Math.floor((d.getTime()-s.getTime())/86400000);}
function promptFor(s){if(CONFIG.prompts==='none')return '';var list=(CONFIG.prompts==='deep')?DEEP:DAILY;return list[dayOfYear(parseISO(s))%list.length];}
function labelFor(s){var t=todayISO();if(s===t)return 'Today';var y=new Date();y.setDate(y.getDate()-1);if(s===isoOf(y))return 'Yesterday';return parseISO(s).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}

function renderHeader(){
  var st=streak();
  $('streak').textContent=st>0?('\uD83D\uDD25 '+st+' day'+(st===1?'':'s')):'\uD83D\uDD25 Start your streak';
  try{$('dateLine').textContent=parseISO(selected).toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric',year:'numeric'});}catch(e){$('dateLine').textContent=selected;}
}
function renderStrip(){
  var el=$('strip');var h='';var now=new Date();
  for(var i=29;i>=0;i--){var t=new Date(now.getTime());t.setDate(now.getDate()-i);var s=isoOf(t);var dt=parseISO(s);
    var cls='day'+(s===selected?' sel':'')+(s===todayISO()?' today':'')+(hasText(s)?' has':'');
    var dow='';try{dow=dt.toLocaleDateString(undefined,{weekday:'narrow'});}catch(e){dow='';}
    h+='<button type="button" class="'+cls+'" data-act="day" data-day="'+s+'"><span class="dow">'+esc(dow)+'</span><span class="num">'+dt.getDate()+'</span><span class="dot"></span></button>';
  }
  el.innerHTML=h;
  try{el.scrollLeft=el.scrollWidth;}catch(e){}
}
function renderPrompt(){
  var p=$('prompt');var txt=promptFor(selected);
  if(!txt){p.hidden=true;p.innerHTML='';return;}
  p.hidden=false;
  p.innerHTML='<b>Prompt \u00B7 </b>'+esc(txt);
}
function renderMoods(){
  var box=$('moods');
  if(!hasX(CONFIG.extras,'mood')){box.hidden=true;box.innerHTML='';return;}
  box.hidden=false;
  var e=entries[selected];var cur=(e&&e.mood!=null)?e.mood:null;
  var h='';
  for(var i=0;i<MOODS.length;i++){h+='<button type="button" class="mood'+(cur===i?' sel':'')+'" data-act="mood" data-i="'+i+'" aria-label="Mood '+(i+1)+' of 5">'+MOODS[i]+'</button>';}
  box.innerHTML=h;
}
function renderEditor(){
  var ed=$('editor');var e=entries[selected];var v=(e&&e.text)?e.text:'';
  if(document.activeElement!==ed&&ed.value!==v){ed.value=v;}
  renderWords();
}
function renderWords(){
  var w=$('words');
  if(!hasX(CONFIG.extras,'words')){w.textContent='';return;}
  var n=words($('editor').value);
  w.textContent=(n===1?'1 word':n+' words');
}
function setSaved(t){$('saved').textContent=t||'';}
function allDays(){var a=Object.keys(entries).filter(hasText);a.sort();a.reverse();return a;}
function renderList(){
  var box=$('entries');var h='';var q=searchQ.trim().toLowerCase();
  var days=allDays();
  if(q){days=days.filter(function(s){return String(entries[s].text).toLowerCase().indexOf(q)>=0;});}
  for(var i=0;i<days.length;i++){var s=days[i];var e=entries[s];
    var pv=String(e.text).replace(/\\s+/g,' ').trim();if(pv.length>90)pv=pv.slice(0,90)+'\u2026';
    var em=(hasX(CONFIG.extras,'mood')&&e.mood!=null&&MOODS[e.mood])?MOODS[e.mood]:'\uD83D\uDCDD';
    var armed=(armDel===s);
    h+='<div class="entry" data-act="open" data-day="'+s+'"><div class="em">'+em+'</div><div class="tx"><div class="dt">'+esc(labelFor(s))+'</div><div class="pv">'+esc(pv)+'</div></div><button type="button" class="del'+(armed?' armed':'')+'" data-act="del" data-day="'+s+'">'+(armed?'Sure?':'\u2715')+'</button></div>';
  }
  if(!days.length){h='<div class="empty">'+(q?'No entries match \u201C'+esc(searchQ)+'\u201D.':'Nothing here yet \u2014 write your first entry above.')+'</div>';}
  box.innerHTML=h;
}

function selectDay(s){selected=s;armDel=null;renderHeader();renderStrip();renderPrompt();renderMoods();renderEditor();renderList();}
function persist(){
  var t=$('editor').value;var e=entries[selected];var mood=(e&&e.mood!=null)?e.mood:null;
  if(String(t).trim()===''&&mood==null){delete entries[selected];}
  else{entries[selected]={text:t,mood:mood,updatedAt:Date.now()};}
  saveLS();renderHeader();renderStrip();renderList();
}
function scheduleSave(){
  setSaved('Saving\u2026');
  if(saveTimer)clearTimeout(saveTimer);
  var tok=++saveToken;
  saveTimer=setTimeout(function(){saveTimer=null;persist();if(tok===saveToken){setSaved('Saved \u2713');setTimeout(function(){if(tok===saveToken)setSaved('');},2000);}},800);
}
function toggleMood(i){
  var e=entries[selected]||{text:'',mood:null,updatedAt:Date.now()};
  e.mood=(e.mood===i)?null:i;e.updatedAt=Date.now();
  if(String(e.text).trim()===''&&e.mood==null){delete entries[selected];}
  else{entries[selected]=e;}
  saveLS();renderMoods();renderHeader();renderStrip();renderList();
}
function delDay(s){
  if(armDel===s){delete entries[s];armDel=null;saveLS();renderHeader();renderStrip();renderEditor();renderList();}
  else{armDel=s;renderList();}
}

function onTap(e){
  var ed=$('editor');var t=e.target;
  if(t===ed){if(document.activeElement!==ed){try{ed.focus();}catch(x){}}}
  else{var w=(t&&t.closest)?t.closest('#editorWrap'):null;if(w&&document.activeElement!==ed){try{ed.focus();}catch(x){}}}
  var el=(t&&t.closest)?t.closest('[data-act]'):null;
  if(!el){if(armDel){armDel=null;renderList();}return;}
  var act=el.getAttribute('data-act');
  if(act==='day'){selectDay(el.getAttribute('data-day'));}
  else if(act==='mood'){toggleMood(parseInt(el.getAttribute('data-i'),10));}
  else if(act==='open'){selectDay(el.getAttribute('data-day'));}
  else if(act==='del'){delDay(el.getAttribute('data-day'));}
}
document.addEventListener('pointerup',onTap);
$('editor').addEventListener('input',function(){renderWords();scheduleSave();});
$('search').addEventListener('input',function(e){searchQ=e.target.value;armDel=null;renderList();});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&saveTimer){clearTimeout(saveTimer);saveTimer=null;persist();}});

function init(){
  var had=loadLS();var t=todayISO();
  if(!had&&!entries[t]){entries[t]={text:WELCOME,mood:null,updatedAt:Date.now()};saveLS();}
  selected=t;
  renderHeader();renderStrip();renderPrompt();renderMoods();renderEditor();renderList();
}
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init()}
})();
</script>
</body>
</html>`;

window.MoorKit = { build: build };

})();
