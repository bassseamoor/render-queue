/* Moor kit assembler: budget-tracker (Budget)
 * window.MoorKit.build(config) -> complete <!DOCTYPE html> document string.
 * No external URLs, no localStorage dependency, touch-first (pointerup),
 * zero console errors. Config: { vibe, style, extras }.
 */
(function () {
'use strict';

var THEME_COLORS = { midnight: '#0b0e14', paper: '#f6f1e7', mint: '#0c1512' };

function sanitize(config) {
  config = (config && typeof config === 'object') ? config : {};
  var vibe = (config.vibe === 'paper' || config.vibe === 'mint') ? config.vibe : 'midnight';
  var style = (config.style === 'rolling' || config.style === 'free') ? config.style : 'monthly';
  var extras = ['chart'];
  if (Array.isArray(config.extras)) {
    extras = config.extras.filter(function (e) { return e === 'chart' || e === 'weekly'; });
  }
  return { vibe: vibe, style: style, extras: extras };
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
<title>Budget</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
[hidden]{display:none!important}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Segoe UI,Roboto,Helvetica,Arial,sans-serif;touch-action:manipulation;-webkit-tap-highlight-color:transparent;color:var(--ink);background:var(--bg);min-height:100%}
body[data-vibe="midnight"]{--bg:#0b0e14;--bg2:#11151f;--card:rgba(255,255,255,.045);--line:rgba(255,255,255,.09);--ink:#eef1f6;--muted:#8f97ab;--accent:#7dd3a8;--danger:#ff7d7d;--sel:rgba(125,211,168,.16);--bar:#232b3d}
body[data-vibe="paper"]{--bg:#f6f1e7;--bg2:#ece4d2;--card:#fffdf7;--line:#e0d5bd;--ink:#2c2620;--muted:#8b7f68;--accent:#1e8e5a;--danger:#c23b3b;--sel:rgba(30,142,90,.12);--bar:#e7dcc3}
body[data-vibe="mint"]{--bg:#0c1512;--bg2:#101b16;--card:rgba(255,255,255,.05);--line:rgba(255,255,255,.1);--ink:#eaf5ee;--muted:#8fa89a;--accent:#5eead4;--danger:#ff8f8f;--sel:rgba(94,234,212,.14);--bar:#1c2b24}
.wrap{max-width:560px;margin:0 auto;padding:calc(10px + env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom))}
header.top{display:flex;align-items:center;justify-content:space-between;padding:8px 2px 2px}
.brand{font-size:22px;font-weight:800;letter-spacing:-.3px}
.period{font-size:13px;color:var(--muted);font-weight:600;background:var(--card);border:1px solid var(--line);padding:8px 14px;border-radius:999px}
.total{margin:14px 2px 4px}
.total .lbl{font-size:13px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.6px}
.total .amt{font-size:44px;font-weight:800;letter-spacing:-1px;margin-top:2px}
.tbar{height:10px;border-radius:99px;background:var(--bar);overflow:hidden;margin:10px 2px 4px}
.tbar i{display:block;height:100%;border-radius:99px;background:var(--accent);transition:width .3s}
.tbar i.over{background:var(--danger)}
.tsub{font-size:13px;color:var(--muted);margin:0 2px 14px}
.tsub b{color:var(--ink)}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin:12px 0}
.card h3{font-size:14px;font-weight:700;margin-bottom:10px}
.brow{padding:10px 2px;border-top:1px solid var(--line);min-height:44px}
.brow:first-of-type{border-top:none}
.brow .r1{display:flex;align-items:center;gap:10px}
.brow .ic{font-size:22px;width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;background:var(--bg2);border-radius:12px}
.brow .nm{flex:1;font-weight:600;font-size:15px}
.brow .vals{font-size:13px;color:var(--muted);text-align:right}
.brow .vals b{color:var(--ink);font-size:15px}
.brow .edit{font-size:12px;color:var(--accent);font-weight:700;padding:10px 8px;min-height:44px;min-width:44px;text-align:center}
.bar{height:8px;border-radius:99px;background:var(--bar);overflow:hidden;margin-top:8px}
.bar i{display:block;height:100%;border-radius:99px;background:var(--accent)}
.bar i.over{background:var(--danger)}
.bedit{display:flex;gap:8px;margin-top:10px;align-items:center}
.bedit input{flex:1;font:inherit;font-size:16px;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--bg2);color:var(--ink);min-height:48px}
.bedit button{font:inherit;font-weight:700;padding:12px 16px;border-radius:12px;border:1px solid var(--line);background:var(--accent);color:#0b0e14;min-height:48px;min-width:64px}
.bedit button.ghost{background:transparent;color:var(--muted)}
.donutwrap{display:flex;align-items:center;gap:16px}
.legend{flex:1;display:flex;flex-direction:column;gap:6px}
.leg{display:flex;align-items:center;gap:8px;font-size:13px}
.leg .sw{width:10px;height:10px;border-radius:3px;flex:none}
.leg .pc{margin-left:auto;color:var(--muted);font-weight:700}
.wks{display:flex;gap:10px;align-items:flex-end;justify-content:space-around;padding:6px 2px 2px}
.wk{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:44px}
.wkb{height:96px;display:flex;align-items:flex-end;width:100%;justify-content:center}
.wkb i{display:block;width:70%;max-width:44px;border-radius:8px;background:var(--accent);min-height:4px}
.wl{font-size:12px;color:var(--muted);font-weight:700}
.amtbig{font-size:52px;font-weight:800;letter-spacing:-1px;text-align:center;margin:18px 0 6px;min-height:64px}
.keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:8px 0 4px}
.key{font:inherit;font-size:24px;font-weight:700;min-height:64px;border-radius:16px;border:1px solid var(--line);background:var(--card);color:var(--ink)}
.key:active{background:var(--sel)}
.catchips{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
.chip{font:inherit;min-height:64px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:600}
.chip .e{font-size:22px}
.chip.sel{background:var(--sel);border-color:var(--accent)}
.note{width:100%;font:inherit;font-size:16px;padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);min-height:52px;margin:4px 0 10px}
.save{width:100%;font:inherit;font-size:18px;font-weight:800;min-height:60px;border-radius:16px;border:none;background:var(--accent);color:#0b0e14}
.save:disabled{opacity:.35}
.hrow{display:flex;align-items:center;gap:10px;padding:12px 2px;border-top:1px solid var(--line);min-height:60px}
.hrow:first-of-type{border-top:none}
.hrow .ic{font-size:20px;width:40px;height:40px;flex:none;display:flex;align-items:center;justify-content:center;background:var(--bg2);border-radius:12px}
.hrow .mid{flex:1;min-width:0}
.hrow .n{font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hrow .d{font-size:12px;color:var(--muted);margin-top:2px}
.hrow .a{font-weight:800;font-size:16px}
.hrow .del{font:inherit;font-size:13px;font-weight:700;color:var(--muted);padding:12px;min-height:48px;min-width:56px}
.hrow .del.arm{color:var(--danger)}
.ghead{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.6px;margin:14px 2px 2px}
.empty{text-align:center;color:var(--muted);padding:36px 20px;font-size:15px;line-height:1.5}
.empty .big{font-size:40px;margin-bottom:10px}
.tabs{position:fixed;left:0;right:0;bottom:0;display:flex;background:var(--bg2);border-top:1px solid var(--line);padding:8px 8px calc(10px + env(safe-area-inset-bottom));z-index:20}
.tab{flex:1;font:inherit;min-height:56px;border:none;background:none;color:var(--muted);font-size:12px;font-weight:700;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border-radius:12px}
.tab .e{font-size:22px}
.tab.sel{color:var(--accent)}
#toast{position:fixed;left:50%;bottom:110px;transform:translateX(-50%) translateY(20px);background:var(--ink);color:var(--bg);font-weight:700;font-size:14px;padding:12px 20px;border-radius:99px;opacity:0;transition:all .25s;pointer-events:none;z-index:50;white-space:nowrap;max-width:92vw}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
</style>
</head>
<body data-vibe="__VIBE__">
<div class="wrap" id="app"></div>
<nav class="tabs" id="tabs"></nav>
<div id="toast"></div>
<script>
(function(){
'use strict';
var CFG = /*__CONFIG__*/;
var CATS = [
  {id:'food', name:'Food', icon:'\u{1F354}', color:'#ff9f6b'},
  {id:'transport', name:'Transport', icon:'\u{1F697}', color:'#6bb8ff'},
  {id:'shopping', name:'Shopping', icon:'\u{1F6CD}', color:'#c792ff'},
  {id:'bills', name:'Bills', icon:'\u{1F9FE}', color:'#ffd166'},
  {id:'fun', name:'Fun', icon:'\u{1F3AE}', color:'#7dd3a8'},
  {id:'health', name:'Health', icon:'\u{1F48A}', color:'#ff7d9c'},
  {id:'other', name:'Other', icon:'\u{1F4E6}', color:'#9aa5b8'}
];
function catById(id){ for(var i=0;i<CATS.length;i++) if(CATS[i].id===id) return CATS[i]; return CATS[6]; }
var LSKEY = 'moor.budget.v1';
function todayISO(){ var d=new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function pad(n){ return (n<10?'0':'')+n; }
function isoDaysAgo(n){ var d=new Date(); d.setDate(d.getDate()-n); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function seed(){
  return {
    seq: 100,
    budgets: {food:400, transport:150, shopping:200, bills:300, fun:120, health:100, other:80},
    expenses: [
      {id:'e1', amt:14.50, cat:'food', note:'Tacos', date: todayISO()},
      {id:'e2', amt:42.00, cat:'transport', note:'Gas', date: todayISO()},
      {id:'e3', amt:8.75, cat:'food', note:'Coffee', date: isoDaysAgo(1)},
      {id:'e4', amt:89.99, cat:'shopping', note:'Headphones', date: isoDaysAgo(2)},
      {id:'e5', amt:65.00, cat:'bills', note:'Electric', date: isoDaysAgo(5)},
      {id:'e6', amt:22.40, cat:'food', note:'Groceries', date: isoDaysAgo(9)}
    ]
  };
}
function load(){
  try {
    var raw = localStorage.getItem(LSKEY);
    if(raw){ var s = JSON.parse(raw); if(s && Array.isArray(s.expenses)) return s; }
  } catch(e){}
  return seed();
}
function save(){ try { localStorage.setItem(LSKEY, JSON.stringify(S)); } catch(e){} }
var S = load();
var tab = 'home';
var addAmt = '';
var addCat = 'food';
var addNote = '';
var editCat = null;
var delArm = null;
var toastT = null;

function esc(s){
  var d = document.createElement('div');
  d.textContent = String(s == null ? '' : s);
  return d.innerHTML;
}
function money(n){ return '$' + Number(n).toFixed(2); }
function periodStart(){
  if(CFG.style === 'rolling'){ return isoDaysAgo(30); }
  var d = new Date();
  return d.getFullYear() + '-' + pad(d.getMonth()+1) + '-01';
}
function inPeriod(ds){ return ds >= periodStart(); }
function periodLabel(){
  if(CFG.style === 'rolling') return 'Last 30 days';
  var d = new Date();
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return months[d.getMonth()] + ' ' + d.getFullYear();
}
function dayLabel(ds){
  if(ds === todayISO()) return 'Today';
  if(ds === isoDaysAgo(1)) return 'Yesterday';
  var p = ds.split('-');
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[Number(p[1])-1] + ' ' + Number(p[2]);
}
function catTotal(id){
  var t = 0;
  for(var i=0;i<S.expenses.length;i++){ var e=S.expenses[i]; if(e.cat===id && inPeriod(e.date)) t += e.amt; }
  return t;
}
function totalSpent(){
  var t = 0;
  for(var i=0;i<S.expenses.length;i++){ if(inPeriod(S.expenses[i].date)) t += S.expenses[i].amt; }
  return t;
}
function totalBudget(){
  var t = 0;
  for(var i=0;i<CATS.length;i++){ t += Number(S.budgets[CATS[i].id]) || 0; }
  return t;
}
function toast(msg){
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  if(toastT) clearTimeout(toastT);
  toastT = setTimeout(function(){ el.classList.remove('show'); }, 1800);
}

function renderTabs(){
  var tabs = [['home','\u{1F4B0}','Home'],['add','\u2795','Add'],['history','\u{1F4DC}','History']];
  var h = '';
  for(var i=0;i<tabs.length;i++){
    h += '<button class="tab' + (tab===tabs[i][0] ? ' sel' : '') + '" data-act="tab" data-v="' + tabs[i][0] + '"><span class="e">' + tabs[i][1] + '</span>' + tabs[i][2] + '</button>';
  }
  document.getElementById('tabs').innerHTML = h;
}

function renderHome(){
  var h = '<header class="top"><div class="brand">\u{1F4B0} Budget</div><div class="period">' + esc(periodLabel()) + '</div></header>';
  var spent = totalSpent();
  h += '<div class="total"><div class="lbl">Spent ' + (CFG.style==='free' ? 'this period' : 'vs budget') + '</div><div class="amt">' + money(spent) + '</div></div>';
  if(CFG.style !== 'free'){
    var tb = totalBudget();
    var pct = tb > 0 ? Math.min(100, spent / tb * 100) : 0;
    var over = tb > 0 && spent > tb;
    h += '<div class="tbar"><i class="' + (over ? 'over' : '') + '" style="width:' + pct.toFixed(1) + '%"></i></div>';
    h += '<div class="tsub"><b>' + money(spent) + '</b> of <b>' + money(tb) + '</b> total budget' + (over ? ' \u2014 over by ' + money(spent - tb) : '') + '</div>';
  } else {
    h += '<div class="tsub">Tracking only \u2014 no budgets set</div>';
  }
  if(CFG.extras.indexOf('chart') !== -1){
    h += renderDonut(spent);
  }
  if(CFG.extras.indexOf('weekly') !== -1){
    h += renderWeekly();
  }
  h += '<div class="card"><h3>' + (CFG.style === 'free' ? 'Spending by category' : 'Category budgets') + '</h3>';
  for(var i=0;i<CATS.length;i++){
    h += renderBudgetRow(CATS[i], spent);
  }
  h += '</div>';
  return h;
}

function renderBudgetRow(c, totalSpentAll){
  var st = catTotal(c.id);
  var b = Number(S.budgets[c.id]) || 0;
  var h = '<div class="brow" data-cat="' + c.id + '"><div class="r1">';
  h += '<div class="ic">' + c.icon + '</div><div class="nm">' + esc(c.name) + '</div>';
  if(CFG.style === 'free'){
    var pct = totalSpentAll > 0 ? Math.round(st / totalSpentAll * 100) : 0;
    h += '<div class="vals"><b>' + money(st) + '</b><br>' + pct + '% of total</div>';
  } else {
    var pct2 = b > 0 ? Math.min(100, st / b * 100) : 0;
    var over = b > 0 && st > b;
    h += '<div class="vals"><b>' + money(st) + '</b> / ' + (b > 0 ? money(b) : '\u2014') + '</div>';
    h += '<button class="edit" data-act="editb" data-v="' + c.id + '">\u270E</button>';
    h += '</div>';
    if(editCat === c.id){
      h += '<div class="bedit"><input id="binput" inputmode="decimal" type="text" value="' + (b > 0 ? b : '') + '" placeholder="Monthly budget"><button data-act="saveb" data-v="' + c.id + '">Set</button><button class="ghost" data-act="canceledit">\u2715</button></div>';
    } else {
      h += '<div class="bar"><i class="' + (over ? 'over' : '') + '" style="width:' + pct2.toFixed(1) + '%"></i></div>';
    }
    return h + '</div>';
  }
  h += '</div></div>';
  return h;
}

function renderDonut(spent){
  var segs = [];
  for(var i=0;i<CATS.length;i++){
    var t = catTotal(CATS[i].id);
    if(t > 0) segs.push({c: CATS[i], t: t});
  }
  if(!segs.length) return '';
  var R = 54, CIRC = 2 * Math.PI * R;
  var off = 25;
  var circles = '';
  for(var j=0;j<segs.length;j++){
    var frac = segs[j].t / spent;
    var len = frac * CIRC;
    circles += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + segs[j].c.color + '" stroke-width="18" stroke-dasharray="' + Math.max(0, len - 2).toFixed(1) + ' ' + CIRC.toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 70 70)"/>';
    off += len;
  }
  var h = '<div class="card"><h3>Where it went</h3><div class="donutwrap">';
  h += '<svg width="140" height="140" viewBox="0 0 140 140">' + circles + '</svg>';
  h += '<div class="legend">';
  segs.sort(function(a,b){ return b.t - a.t; });
  for(var k=0;k<segs.length;k++){
    var pc = Math.round(segs[k].t / spent * 100);
    h += '<div class="leg"><span class="sw" style="background:' + segs[k].c.color + '"></span>' + esc(segs[k].c.name) + '<span class="pc">' + pc + '%</span></div>';
  }
  h += '</div></div></div>';
  return h;
}

function renderWeekly(){
  var sums = [0,0,0,0];
  var today = todayISO();
  for(var i=0;i<S.expenses.length;i++){
    var dd = daysBetween(S.expenses[i].date, today);
    if(dd >= 0 && dd < 28) sums[Math.floor(dd/7)] += S.expenses[i].amt;
  }
  var max = 0, j;
  for(j=0;j<4;j++) if(sums[j] > max) max = sums[j];
  var h = '<div class="card"><h3>Last 4 weeks</h3><div class="wks">';
  for(j=3;j>=0;j--){
    var ht = max > 0 ? Math.max(4, Math.round(sums[j]/max*88)) : 4;
    h += '<div class="wk"><div class="wkb"><i style="height:' + ht + 'px"></i></div><div class="wl">' + money0(sums[j]) + '</div></div>';
  }
  return h + '</div></div>';
}
function daysBetween(a, b){
  var pa = a.split('-'), pb = b.split('-');
  var da = Date.UTC(+pa[0], +pa[1]-1, +pa[2]);
  var db = Date.UTC(+pb[0], +pb[1]-1, +pb[2]);
  return Math.round((db - da) / 86400000);
}
function money0(n){ return '$' + Math.round(Number(n)); }

function renderAdd(){
  var disp = addAmt === '' ? '$0' : '$' + esc(addAmt);
  var h = '<header class="top"><div class="brand">\u2795 Add expense</div><div class="period">' + esc(periodLabel()) + '</div></header>';
  h += '<div class="amtbig" id="amtdisp">' + disp + '</div>';
  var keys = ['1','2','3','4','5','6','7','8','9','.','0','\u232B'];
  h += '<div class="keypad">';
  for(var i=0;i<keys.length;i++){
    h += '<button class="key" data-act="key" data-v="' + keys[i] + '">' + keys[i] + '</button>';
  }
  h += '</div>';
  h += '<div class="catchips">';
  for(var j=0;j<CATS.length;j++){
    h += '<button class="chip' + (addCat === CATS[j].id ? ' sel' : '') + '" data-act="catchip" data-v="' + CATS[j].id + '"><span class="e">' + CATS[j].icon + '</span>' + esc(CATS[j].name) + '</button>';
  }
  h += '</div>';
  h += '<input class="note" id="note" type="text" placeholder="Note (optional)" value="' + esc(addNote) + '" maxlength="80">';
  var ok = parseFloat(addAmt) > 0;
  h += '<button class="save" data-act="saveexp"' + (ok ? '' : ' disabled') + '>Save expense</button>';
  return h;
}

function renderHistory(){
  var list = [];
  for(var i=0;i<S.expenses.length;i++){ if(inPeriod(S.expenses[i].date)) list.push(S.expenses[i]); }
  list.sort(function(a,b){ if(a.date === b.date) return b.id < a.id ? -1 : 1; return a.date < b.date ? 1 : -1; });
  var h = '<header class="top"><div class="brand">\u{1F4DC} History</div><div class="period">' + esc(periodLabel()) + '</div></header>';
  if(!list.length){
    return h + '<div class="empty"><div class="big">\u{1F4ED}</div>No expenses this period yet.<br>Tap \u2795 Add to log your first one.</div>';
  }
  var lastDay = '';
  for(var j=0;j<list.length;j++){
    var e = list[j];
    if(e.date !== lastDay){ h += '<div class="ghead">' + esc(dayLabel(e.date)) + '</div>'; lastDay = e.date; }
    var c = catById(e.cat);
    h += '<div class="hrow"><div class="ic">' + c.icon + '</div><div class="mid"><div class="n">' + (e.note ? esc(e.note) : esc(c.name)) + '</div><div class="d">' + esc(c.name) + '</div></div>';
    h += '<div class="a">' + money(e.amt) + '</div>';
    h += '<button class="del' + (delArm === e.id ? ' arm' : '') + '" data-act="del" data-v="' + e.id + '">' + (delArm === e.id ? 'Sure?' : '\u2715') + '</button></div>';
  }
  return h;
}

function render(){
  var app = document.getElementById('app');
  if(tab === 'home') app.innerHTML = renderHome();
  else if(tab === 'add') app.innerHTML = renderAdd();
  else app.innerHTML = renderHistory();
  renderTabs();
  var ni = document.getElementById('note');
  if(ni){
    ni.addEventListener('input', function(){ addNote = ni.value; });
  }
  var bi = document.getElementById('binput');
  if(bi){ bi.focus(); }
}

function onTap(ev){
  var t = ev.target.closest('[data-act]');
  if(!t) return;
  if(ev.cancelable) ev.preventDefault();
  var act = t.getAttribute('data-act');
  var v = t.getAttribute('data-v');
  if(act === 'tab'){ tab = v; delArm = null; editCat = null; }
  else if(act === 'key'){
    if(v === '\u232B'){ addAmt = addAmt.slice(0, -1); }
    else if(v === '.'){ if(addAmt.indexOf('.') === -1) addAmt = (addAmt === '' ? '0' : addAmt) + '.'; }
    else { if(addAmt.replace('.', '').length < 7) addAmt += v; }
  }
  else if(act === 'catchip'){ addCat = v; }
  else if(act === 'saveexp'){
    var amt = Math.round(parseFloat(addAmt) * 100) / 100;
    if(!(amt > 0)) return;
    S.seq += 1;
    S.expenses.push({id: 'e' + S.seq, amt: amt, cat: addCat, note: addNote.trim(), date: todayISO()});
    save();
    toast('Saved ' + money(amt) + ' \u00B7 ' + catById(addCat).name);
    addAmt = ''; addNote = '';
  }
  else if(act === 'del'){
    if(delArm === v){
      S.expenses = S.expenses.filter(function(e){ return e.id !== v; });
      save(); delArm = null; toast('Deleted');
    } else { delArm = v; }
  }
  else if(act === 'editb'){ editCat = (editCat === v ? null : v); delArm = null; }
  else if(act === 'canceledit'){ editCat = null; }
  else if(act === 'saveb'){
    var inp = document.getElementById('binput');
    var nv = inp ? parseFloat(inp.value) : NaN;
    if(!isNaN(nv) && nv >= 0){
      S.budgets[v] = Math.round(nv * 100) / 100;
      save(); toast(catById(v).name + ' budget: ' + money(S.budgets[v]));
    }
    editCat = null;
  }
  render();
}

document.addEventListener('pointerup', onTap);
window.addEventListener('resize', function(){});
render();
})();
<\/script>
</body>
</html>`;

window.MoorKit = { build: build };

})();
