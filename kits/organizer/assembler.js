/* Moor kit: organizer v1.0.0 — personal CRM / client & appointment tracker.
   build(config) -> complete self-contained HTML document string.
   No external URLs, no localStorage dependency, touch-first, zero console errors. */
(function () {
'use strict';

function build(config) {
  config = config || {};

  var tracking = config.tracking;
  if (!Array.isArray(tracking)) tracking = ['clients', 'appointments'];
  var showClients = tracking.indexOf('clients') !== -1;
  var showAppts = tracking.indexOf('appointments') !== -1;
  // Never strand the user with zero tabs: fall back to both.
  if (!showClients && !showAppts) { showClients = true; showAppts = true; }

  var vibe = config.vibe || 'ink';
  if (['ink', 'paper', 'neon'].indexOf(vibe) === -1) vibe = 'ink';

  var extras = config.extras;
  if (!Array.isArray(extras)) extras = [];
  var nudges = extras.indexOf('nudges') !== -1;
  var deposits = extras.indexOf('deposits') !== -1;

  var themeColor = vibe === 'paper' ? '#f6f3ea' : vibe === 'neon' ? '#04050c' : '#0b0d10';

  var cfg = {
    tabs: { clients: showClients, appointments: showAppts },
    vibe: vibe,
    nudges: nudges,
    deposits: deposits
  };
  var cfgJson = JSON.stringify(cfg);

  var html = `<!DOCTYPE html>
<html lang="en" data-vibe="${vibe}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="${themeColor}">
<title>Organizer</title>
<style>
:root, [data-vibe="ink"]{
  --bg:#0b0d10; --bg2:#0e1116;
  --surface:rgba(255,255,255,.045); --surface2:rgba(255,255,255,.09);
  --text:#f2f4f6; --muted:#9aa3ad;
  --accent:#e0a458; --accent-ink:#1a1206;
  --danger:#ff6b6b; --ok:#4ade80;
  --border:rgba(255,255,255,.09);
  --shadow:0 8px 28px rgba(0,0,0,.45);
}
[data-vibe="paper"]{
  --bg:#f6f3ea; --bg2:#efe9da;
  --surface:#ffffff; --surface2:#f0ebdd;
  --text:#211d15; --muted:#7a7264;
  --accent:#b3541e; --accent-ink:#fff8ef;
  --danger:#d33f3f; --ok:#1f9d55;
  --border:rgba(33,29,21,.12);
  --shadow:0 8px 24px rgba(60,45,20,.12);
}
[data-vibe="neon"]{
  --bg:#04050c; --bg2:#070914;
  --surface:rgba(0,255,200,.05); --surface2:rgba(0,255,200,.11);
  --text:#eaf6ff; --muted:#7d8aa0;
  --accent:#00ffc8; --accent-ink:#03231b;
  --danger:#ff3d71; --ok:#00ffa3;
  --border:rgba(0,255,200,.16);
  --shadow:0 8px 28px rgba(0,255,200,.08);
}
*{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
html,body{margin:0; padding:0;}
body{
  background:var(--bg); color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;
  font-size:16px; line-height:1.45;
  min-height:100vh; padding-bottom:96px;
}
.wrap{max-width:600px; margin:0 auto; padding:0 16px;}
header.top{
  position:sticky; top:0; z-index:20;
  background:color-mix(in srgb, var(--bg) 82%, transparent);
  -webkit-backdrop-filter:blur(14px); backdrop-filter:blur(14px);
  border-bottom:1px solid var(--border);
}
header.top .wrap{padding-top:14px; padding-bottom:12px;}
header.top h1{margin:0; font-size:22px; letter-spacing:.2px;}
header.top .dateline{color:var(--muted); font-size:13px; margin-top:2px;}
#view{padding-top:14px;}
.vhead{display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin:4px 0 12px;}
.vhead h2{margin:0; font-size:20px;}
.vhead .sub{color:var(--muted); font-size:13px; margin-top:2px;}
h3.sec{font-size:13px; text-transform:uppercase; letter-spacing:1.2px; color:var(--muted); margin:20px 2px 10px;}
.card{
  background:var(--surface); border:1px solid var(--border);
  border-radius:16px; padding:14px; margin-bottom:12px;
  box-shadow:var(--shadow);
}
.card.nudge{border-left:3px solid var(--accent);}
.crow{display:flex; align-items:flex-start; justify-content:space-between; gap:10px;}
.cname{font-weight:700; font-size:17px;}
.phone{display:inline-block; color:var(--accent); text-decoration:none; font-size:15px; margin-top:2px; min-height:32px;}
.tags{display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;}
.tag{font-size:12px; padding:4px 10px; border-radius:999px; background:var(--surface2); color:var(--muted); border:1px solid var(--border);}
.notes{color:var(--muted); font-size:14px; margin-top:8px;}
.meta{color:var(--muted); font-size:13px; margin-top:8px;}
.meta b{color:var(--text);}
.dep{display:inline-block; margin-top:8px; font-size:13px; font-weight:600; color:var(--accent); background:var(--surface2); border:1px solid var(--border); padding:4px 10px; border-radius:999px;}
.rowbtns{display:flex; gap:8px; margin-top:10px;}
.btn{
  appearance:none; border:1px solid var(--border); cursor:pointer;
  background:var(--surface2); color:var(--text);
  min-height:48px; padding:10px 18px; border-radius:12px;
  font-size:15px; font-weight:600; font-family:inherit;
}
.btn:active{transform:scale(.98);}
.btn-primary{background:var(--accent); border-color:transparent; color:var(--accent-ink);}
.btn-ghost{background:transparent;}
.btn-danger{background:transparent; color:var(--danger); border-color:var(--danger); width:100%; margin-top:10px;}
.btn.big{width:100%; margin-top:14px;}
.iconbtn{
  appearance:none; border:none; background:transparent; cursor:pointer;
  font-size:18px; min-width:44px; min-height:44px; border-radius:10px; color:var(--muted);
}
.pill{
  appearance:none; border:1px solid var(--border); cursor:pointer; flex-shrink:0;
  min-height:36px; padding:6px 14px; border-radius:999px;
  font-size:13px; font-weight:700; font-family:inherit;
}
.st-upcoming{background:var(--accent); color:var(--accent-ink); border-color:transparent;}
.st-done{background:transparent; color:var(--ok); border-color:var(--ok);}
.st-cancelled{background:transparent; color:var(--muted);}
.search{
  width:100%; height:48px; font-size:16px; font-family:inherit;
  background:var(--surface); border:1px solid var(--border); color:var(--text);
  border-radius:12px; padding:0 14px; margin-bottom:12px;
}
.chips{display:flex; gap:8px; margin-bottom:12px; overflow-x:auto; padding-bottom:2px;}
.chip{
  appearance:none; border:1px solid var(--border); background:transparent; color:var(--muted);
  min-height:44px; padding:8px 16px; border-radius:999px; font-size:14px; font-weight:600; font-family:inherit; white-space:nowrap;
}
.chip.on{background:var(--accent); color:var(--accent-ink); border-color:transparent;}
.empty{
  text-align:center; color:var(--muted); padding:28px 16px;
  border:1px dashed var(--border); border-radius:16px; margin-bottom:12px; font-size:15px;
}
.empty.slim{padding:16px;}
.empty b{color:var(--text);}
.stats{display:flex; gap:12px; margin-bottom:4px;}
.stat{flex:1; background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:14px; text-align:center;}
.snum{font-size:26px; font-weight:800; color:var(--accent);}
.slab{font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-top:2px;}
nav#tabs{
  position:fixed; left:0; right:0; bottom:0; z-index:30;
  display:flex; gap:4px; padding:8px 12px calc(10px + env(safe-area-inset-bottom));
  background:color-mix(in srgb, var(--bg2) 88%, transparent);
  -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px);
  border-top:1px solid var(--border);
}
.tab{
  appearance:none; border:none; background:transparent; cursor:pointer; flex:1;
  display:flex; flex-direction:column; align-items:center; gap:2px;
  min-height:56px; justify-content:center; border-radius:12px;
  color:var(--muted); font-family:inherit; font-size:12px; font-weight:600;
}
.tab .ti{font-size:20px;}
.tab.on{color:var(--accent);}
#sheet-back{
  position:fixed; inset:0; z-index:40; background:rgba(0,0,0,.5);
  opacity:0; pointer-events:none; transition:opacity .2s;
}
#sheet-back.open{opacity:1; pointer-events:auto;}
#sheet{
  position:fixed; left:0; right:0; bottom:0; z-index:41;
  background:var(--bg2); border-top:1px solid var(--border);
  border-radius:20px 20px 0 0; box-shadow:var(--shadow);
  transform:translateY(105%); transition:transform .25s ease;
  max-height:88vh; overflow-y:auto; padding:8px 18px calc(20px + env(safe-area-inset-bottom));
}
#sheet.open{transform:translateY(0);}
.grab{width:44px; height:5px; border-radius:99px; background:var(--border); margin:8px auto 4px;}
#sheet-title{margin:6px 0 12px; font-size:19px;}
.fld{display:block; margin-bottom:12px;}
.fld > span{display:block; font-size:13px; font-weight:600; color:var(--muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:.6px;}
.fld input, .fld select, .fld textarea{
  width:100%; min-height:48px; font-size:16px; font-family:inherit;
  background:var(--surface); border:1px solid var(--border); color:var(--text);
  border-radius:12px; padding:10px 14px;
}
.fld textarea{resize:vertical;}
.grid2{display:grid; grid-template-columns:1fr 1fr; gap:10px;}
#toast{
  position:fixed; left:50%; bottom:96px; transform:translateX(-50%) translateY(20px); z-index:50;
  background:var(--text); color:var(--bg); font-size:14px; font-weight:600;
  padding:10px 18px; border-radius:999px; opacity:0; pointer-events:none; transition:all .25s;
  max-width:88vw; text-align:center;
}
#toast.show{opacity:1; transform:translateX(-50%) translateY(0);}
@media (max-width:380px){ .grid2{grid-template-columns:1fr;} }
</style>
</head>
<body>
<header class="top"><div class="wrap">
  <h1>Organizer</h1>
  <div class="dateline" id="dateline"></div>
</div></header>
<main id="view" class="wrap"></main>
<nav id="tabs"></nav>
<div id="sheet-back"></div>
<div id="sheet"><div class="grab"></div><h2 id="sheet-title"></h2><div id="sheet-body"></div></div>
<div id="toast"></div>
<script>
(function () {
'use strict';
var CFG = ${cfgJson};
var NUDGE_DAYS = 14;
var LSKEY = 'moor.kit.organizer.v1';
var state = { clients: [], appts: [], seq: 1, seeded: false };
var ui = { tab: 'dash', q: '', f: 'upcoming' };

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function pad(n) { return (n < 10 ? '0' : '') + n; }
function uid(p) { return p + (state.seq++) + '_' + Date.now().toString(36); }
function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseDate(s) { var p = String(s || '').split('-'); return new Date(+p[0] || 2000, (+p[1] || 1) - 1, +p[2] || 1); }
function addDays(ds, n) { var d = parseDate(ds); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dayDiff(a, b) { return Math.round((parseDate(b) - parseDate(a)) / 86400000); }
function fmtDate(ds) { var d = parseDate(ds); var wd = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return wd[d.getDay()] + ' ' + mo[d.getMonth()] + ' ' + d.getDate(); }
function fmtTime(t) { var p = String(t || '').split(':'); var h = parseInt(p[0], 10); if (isNaN(h)) return ''; var m = p[1] || '00'; var ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12; return h + ':' + m + ' ' + ap; }
function longDate() { var d = new Date(); var wd = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']; var mo = ['January','February','March','April','May','June','July','August','September','October','November','December']; return wd[d.getDay()] + ', ' + mo[d.getMonth()] + ' ' + d.getDate(); }
function findClient(id) { for (var i = 0; i < state.clients.length; i++) if (state.clients[i].id === id) return state.clients[i]; return null; }
function findAppt(id) { for (var i = 0; i < state.appts.length; i++) if (state.appts[i].id === id) return state.appts[i]; return null; }
function apptName(a) { return a.clientName || (function () { var c = findClient(a.clientId); return c ? c.name : ''; })() || '—'; }
function daysAgoStr(ds) { if (!ds) return 'never'; var n = dayDiff(ds, todayStr()); if (n <= 0) return 'today'; if (n === 1) return 'yesterday'; return n + ' days ago'; }

function save() { try { localStorage.setItem(LSKEY, JSON.stringify(state)); } catch (e) {} }
function load() { try { var raw = localStorage.getItem(LSKEY); if (raw) { var s = JSON.parse(raw); if (s && typeof s === 'object') { if (Array.isArray(s.clients)) state.clients = s.clients; if (Array.isArray(s.appts)) state.appts = s.appts; if (s.seq) state.seq = s.seq; state.seeded = !!s.seeded; } } } catch (e) {} }

function seed() {
  if (state.seeded) return;
  state.seeded = true;
  if (state.clients.length || state.appts.length) { save(); return; }
  var t = todayStr();
  var c1 = uid('c'), c2 = uid('c'), c3 = uid('c');
  state.clients = [
    { id: c1, name: 'Maya Reyes', phone: '555-014-2288', notes: 'Full sleeve in progress. Loves bold linework.', tags: 'vip', last: addDays(t, -3) },
    { id: c2, name: 'Jonah Park', phone: '555-019-7731', notes: 'First tattoo — small wrist piece.', tags: 'new', last: addDays(t, -21) },
    { id: c3, name: 'Sofia Almeida', phone: '555-011-9042', notes: 'Cover-up consult done. Floral over old tribal.', tags: 'consult', last: addDays(t, -31) }
  ];
  state.appts = [
    { id: uid('a'), clientId: c1, clientName: 'Maya Reyes', date: t, time: '14:00', status: 'upcoming', deposit: '100' },
    { id: uid('a'), clientId: c2, clientName: 'Jonah Park', date: addDays(t, 2), time: '11:30', status: 'upcoming', deposit: '50' },
    { id: uid('a'), clientId: c3, clientName: 'Sofia Almeida', date: addDays(t, -2), time: '15:00', status: 'done', deposit: '0' }
  ];
  save();
}

function toast(msg) {
  var t = $('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(function () { t.classList.remove('show'); }, 2200);
}

function tabDefs() {
  var d = [{ id: 'dash', label: 'Home', icon: '🏠' }];
  if (CFG.tabs.clients) d.push({ id: 'clients', label: 'Clients', icon: '👥' });
  if (CFG.tabs.appointments) d.push({ id: 'appts', label: 'Booked', icon: '📅' });
  return d;
}
function renderTabs() {
  var d = tabDefs(), h = '';
  for (var i = 0; i < d.length; i++) {
    h += '<button class="tab' + (ui.tab === d[i].id ? ' on' : '') + '" data-action="tab" data-id="' + d[i].id + '"><span class="ti">' + d[i].icon + '</span><span class="tl">' + d[i].label + '</span></button>';
  }
  $('tabs').innerHTML = h;
}

function viewHead(title, sub, btnLabel, action) {
  var h = '<div class="vhead"><div><h2>' + esc(title) + '</h2>';
  if (sub) h += '<div class="sub">' + esc(sub) + '</div>';
  h += '</div>';
  if (btnLabel) h += '<button class="btn btn-primary" data-action="' + action + '">' + esc(btnLabel) + '</button>';
  return h + '</div>';
}

function tagsHtml(tags) {
  var t = String(tags || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (!t.length) return '';
  var h = '<div class="tags">';
  for (var i = 0; i < t.length; i++) h += '<span class="tag">' + esc(t[i]) + '</span>';
  return h + '</div>';
}

function clientCard(c) {
  var h = '<div class="card">';
  h += '<div class="crow"><div class="cname">' + esc(c.name) + '</div><button class="iconbtn" data-action="edit-client" data-id="' + c.id + '" aria-label="Edit client">✏️</button></div>';
  if (c.phone) h += '<a class="phone" href="tel:' + esc(String(c.phone).replace(/[^+\\d]/g, '')) + '">' + esc(c.phone) + '</a>';
  h += tagsHtml(c.tags);
  if (c.notes) h += '<div class="notes">' + esc(c.notes) + '</div>';
  h += '<div class="meta">Last contact: <b>' + esc(daysAgoStr(c.last)) + '</b></div>';
  h += '<div class="rowbtns"><button class="btn btn-ghost" data-action="contacted" data-id="' + c.id + '">✓ Mark contacted today</button></div>';
  return h + '</div>';
}

function clientListHtml() {
  var list = state.clients.slice().sort(function (a, b) { return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1; });
  var q = ui.q.trim().toLowerCase();
  if (q) list = list.filter(function (c) { return (c.name + ' ' + c.phone + ' ' + c.notes + ' ' + c.tags).toLowerCase().indexOf(q) !== -1; });
  if (!list.length) return '<div class="empty">No clients found.<br>Tap <b>+ Add client</b> to add one.</div>';
  var h = '';
  for (var i = 0; i < list.length; i++) h += clientCard(list[i]);
  return h;
}

function viewClients() {
  var h = viewHead('Clients', state.clients.length + ' total', '+ Add client', 'add-client');
  h += '<input id="q" class="search" type="search" placeholder="Search name, phone, notes…" value="' + esc(ui.q) + '" autocomplete="off">';
  h += '<div id="clist">' + clientListHtml() + '</div>';
  return h;
}

function statusPill(a) {
  var label = a.status === 'upcoming' ? 'Upcoming' : a.status === 'done' ? 'Done' : 'Cancelled';
  return '<button class="pill st-' + a.status + '" data-action="cycle" data-id="' + a.id + '" aria-label="Change status">' + label + '</button>';
}

function apptCard(a) {
  var h = '<div class="card">';
  h += '<div class="crow"><div><div class="cname">' + esc(apptName(a)) + '</div><div class="meta">' + esc(fmtDate(a.date)) + ' · ' + esc(fmtTime(a.time)) + '</div></div>' + statusPill(a) + '</div>';
  if (CFG.deposits && a.deposit && +a.deposit > 0) h += '<div class="dep">Deposit $' + esc(a.deposit) + '</div>';
  h += '<div class="rowbtns"><button class="btn btn-ghost" data-action="edit-appt" data-id="' + a.id + '">Edit</button></div>';
  return h + '</div>';
}

function viewAppts() {
  var h = viewHead('Appointments', null, '+ Book', 'add-appt');
  var fs = [['upcoming', 'Upcoming'], ['done', 'Done'], ['cancelled', 'Cancelled'], ['all', 'All']];
  h += '<div class="chips">';
  for (var i = 0; i < fs.length; i++) h += '<button class="chip' + (ui.f === fs[i][0] ? ' on' : '') + '" data-action="filter" data-id="' + fs[i][0] + '">' + fs[i][1] + '</button>';
  h += '</div>';
  var list = state.appts.slice().sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
  if (ui.f !== 'all') list = list.filter(function (a) { return a.status === ui.f; });
  if (!list.length) h += '<div class="empty">Nothing here.<br>Tap <b>+ Book</b> to schedule.</div>';
  for (var j = 0; j < list.length; j++) h += apptCard(list[j]);
  return h;
}

function nudgeCard(c) {
  var n = c.last ? dayDiff(c.last, todayStr()) : -1;
  var h = '<div class="card nudge"><div class="crow"><div class="cname">' + esc(c.name) + '</div></div>';
  h += '<div class="meta">' + (n < 0 ? 'Never contacted' : 'No contact in <b>' + n + ' days</b>') + '</div>';
  h += '<div class="rowbtns"><button class="btn btn-ghost" data-action="contacted" data-id="' + c.id + '">✓ Mark contacted</button></div></div>';
  return h;
}

function viewDash() {
  var t = todayStr();
  var h = viewHead('Home', longDate(), null, null);
  var upcoming = state.appts.filter(function (a) { return a.status === 'upcoming' && a.date >= t; }).length;
  h += '<div class="stats"><div class="stat"><div class="snum">' + state.clients.length + '</div><div class="slab">Clients</div></div><div class="stat"><div class="snum">' + upcoming + '</div><div class="slab">Upcoming</div></div></div>';

  var tod = state.appts.filter(function (a) { return a.date === t && a.status === 'upcoming'; }).sort(function (a, b) { return a.time < b.time ? -1 : 1; });
  h += '<h3 class="sec">Today</h3>';
  if (!tod.length) h += '<div class="empty slim">Nothing booked today.</div>';
  for (var i = 0; i < tod.length; i++) h += apptCard(tod[i]);

  var week = state.appts.filter(function (a) { return a.status === 'upcoming' && a.date > t && dayDiff(t, a.date) <= 7; }).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
  h += '<h3 class="sec">Next 7 days</h3>';
  if (!week.length) h += '<div class="empty slim">Nothing scheduled this week.</div>';
  for (var j = 0; j < week.length; j++) h += apptCard(week[j]);

  if (CFG.nudges) {
    var stale = state.clients.filter(function (c) { return !c.last || dayDiff(c.last, t) > NUDGE_DAYS; }).sort(function (a, b) { return String(a.last || '') < String(b.last || '') ? -1 : 1; });
    h += '<h3 class="sec">Follow up</h3>';
    if (!stale.length) h += '<div class="empty slim">All caught up. Nice.</div>';
    for (var k = 0; k < stale.length; k++) h += nudgeCard(stale[k]);
  }
  return h;
}

function render() {
  renderTabs();
  var v = $('view');
  if (ui.tab === 'clients' && CFG.tabs.clients) v.innerHTML = viewClients();
  else if (ui.tab === 'appts' && CFG.tabs.appointments) v.innerHTML = viewAppts();
  else { ui.tab = 'dash'; v.innerHTML = viewDash(); }
}

function openSheet(title, body) {
  $('sheet-title').textContent = title;
  $('sheet-body').innerHTML = body;
  $('sheet-back').classList.add('open');
  $('sheet').classList.add('open');
}
function closeSheet() { $('sheet-back').classList.remove('open'); $('sheet').classList.remove('open'); }

function field(label, inner) { return '<label class="fld"><span>' + esc(label) + '</span>' + inner + '</label>'; }
function inp(id, v, type, ph) { return '<input id="' + id + '" type="' + (type || 'text') + '" value="' + esc(v || '') + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>'; }
function val(id) { var el = $(id); return el ? el.value.trim() : ''; }

function clientForm(c) {
  var isNew = !c;
  c = c || { name: '', phone: '', notes: '', tags: '', last: todayStr() };
  var h = field('Name *', inp('f-name', c.name, 'text', 'Full name'));
  h += field('Phone', inp('f-phone', c.phone, 'tel', '555-000-1234'));
  h += field('Tags (comma separated)', inp('f-tags', c.tags, 'text', 'vip, regular'));
  h += field('Last contacted', inp('f-last', c.last, 'date'));
  h += '<label class="fld"><span>Notes</span><textarea id="f-notes" rows="3" placeholder="Anything worth remembering…">' + esc(c.notes) + '</textarea></label>';
  h += '<button class="btn btn-primary big" data-action="save-client" data-id="' + (isNew ? '' : c.id) + '">Save client</button>';
  if (!isNew) h += '<button class="btn btn-danger" data-action="del-client" data-id="' + c.id + '">Delete</button>';
  openSheet(isNew ? 'New client' : 'Edit client', h);
}

function statusOpts(cur) {
  var opts = [['upcoming', 'Upcoming'], ['done', 'Done'], ['cancelled', 'Cancelled']];
  var h = '';
  for (var i = 0; i < opts.length; i++) h += '<option value="' + opts[i][0] + '"' + (cur === opts[i][0] ? ' selected' : '') + '>' + opts[i][1] + '</option>';
  return h;
}

function apptForm(a) {
  var isNew = !a;
  a = a || { clientId: '', clientName: '', date: todayStr(), time: '12:00', status: 'upcoming', deposit: '' };
  var h = '';
  if (CFG.tabs.clients && state.clients.length) {
    h += '<label class="fld"><span>Client *</span><select id="f-aclient">';
    for (var i = 0; i < state.clients.length; i++) {
      var c = state.clients[i];
      h += '<option value="' + c.id + '"' + (a.clientId === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }
    h += '</select></label>';
  } else {
    h += field('Client name *', inp('f-aclname', a.clientName, 'text', 'Who is this for?'));
  }
  h += '<div class="grid2">' + field('Date *', inp('f-adate', a.date, 'date')) + field('Time *', inp('f-atime', a.time, 'time')) + '</div>';
  h += '<label class="fld"><span>Status</span><select id="f-astatus">' + statusOpts(a.status) + '</select></label>';
  if (CFG.deposits) h += field('Deposit ($)', inp('f-adep', a.deposit, 'number', '0'));
  h += '<button class="btn btn-primary big" data-action="save-appt" data-id="' + (isNew ? '' : a.id) + '">Save appointment</button>';
  if (!isNew) h += '<button class="btn btn-danger" data-action="del-appt" data-id="' + a.id + '">Delete</button>';
  openSheet(isNew ? 'New appointment' : 'Edit appointment', h);
}

function saveClient(id) {
  var name = val('f-name');
  if (!name) { toast('Name is required'); return; }
  var rec = { name: name, phone: val('f-phone'), tags: val('f-tags'), last: val('f-last') || todayStr(), notes: val('f-notes') };
  if (id) { var c = findClient(id); if (c) { for (var k in rec) c[k] = rec[k]; } }
  else { rec.id = uid('c'); state.clients.push(rec); }
  save(); closeSheet(); render(); toast('Client saved ✓');
}

function saveAppt(id) {
  var date = val('f-adate'), time = val('f-atime');
  if (!date || !time) { toast('Date and time are required'); return; }
  var rec = { date: date, time: time, status: val('f-astatus') || 'upcoming', deposit: val('f-adep') };
  if (CFG.tabs.clients && state.clients.length) {
    var cid = val('f-aclient');
    var c = findClient(cid);
    if (!c) { toast('Pick a client'); return; }
    rec.clientId = c.id; rec.clientName = c.name;
  } else {
    var nm = val('f-aclname');
    if (!nm) { toast('Client name is required'); return; }
    rec.clientId = ''; rec.clientName = nm;
  }
  if (id) { var a = findAppt(id); if (a) { for (var k in rec) a[k] = rec[k]; } }
  else { rec.id = uid('a'); state.appts.push(rec); }
  save(); closeSheet(); render(); toast('Appointment saved ✓');
}

function armDelete(el, id, kind) {
  if (el.getAttribute('data-armed')) {
    if (kind === 'client') state.clients = state.clients.filter(function (c) { return c.id !== id; });
    else state.appts = state.appts.filter(function (a) { return a.id !== id; });
    save(); closeSheet(); render(); toast('Deleted');
    return;
  }
  el.setAttribute('data-armed', '1');
  el.textContent = 'Tap again to confirm delete';
  setTimeout(function () { el.removeAttribute('data-armed'); el.textContent = 'Delete'; }, 3000);
}

function onAction(e) {
  var t = e.target;
  if (!t || !t.closest) return;
  var el = t.closest('[data-action]');
  if (!el) return;
  var a = el.getAttribute('data-action'), id = el.getAttribute('data-id');
  if (a === 'tab') { ui.tab = id; render(); }
  else if (a === 'filter') { ui.f = id; render(); }
  else if (a === 'add-client') clientForm(null);
  else if (a === 'edit-client') clientForm(findClient(id));
  else if (a === 'save-client') saveClient(id || null);
  else if (a === 'del-client') armDelete(el, id, 'client');
  else if (a === 'contacted') { var c = findClient(id); if (c) { c.last = todayStr(); save(); render(); toast('Marked contacted ✓'); } }
  else if (a === 'add-appt') apptForm(null);
  else if (a === 'edit-appt') apptForm(findAppt(id));
  else if (a === 'save-appt') saveAppt(id || null);
  else if (a === 'del-appt') armDelete(el, id, 'appt');
  else if (a === 'cycle') { var ap = findAppt(id); if (ap) { ap.status = ap.status === 'upcoming' ? 'done' : ap.status === 'done' ? 'cancelled' : 'upcoming'; save(); render(); } }
}

load();
seed();
$('dateline').textContent = longDate();
render();
document.body.addEventListener('click', onAction);
$('sheet-back').addEventListener('click', closeSheet);
$('view').addEventListener('input', function (e) {
  if (e.target && e.target.id === 'q') {
    ui.q = e.target.value;
    var l = $('clist');
    if (l) l.innerHTML = clientListHtml();
  }
});
window.addEventListener('resize', function () { /* layout is fluid; hook reserved */ });
window.addEventListener('orientationchange', function () { /* layout is fluid; hook reserved */ });
})();
</script>
</body>
</html>`;

  return html;
}

if (typeof window !== 'undefined') { window.MoorKit = { build: build }; }
})();
