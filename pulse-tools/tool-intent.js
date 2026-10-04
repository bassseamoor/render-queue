/* Intent tester — the real rust-intent-compiler (WASM) running in the page.
 * Type a request, see the intent it deduces, give thumbs up/down, build a log.
 * The compiler is inlined as its WASM glue; the .wasm bytes are fetched from
 * this site (pushed alongside the page). Nothing is sent anywhere. */
(function(){
'use strict';

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

var WASM_URL = 'moor_web_bg.wasm';
var ready = null; // promise -> true when handle() is usable

function ensureWasm(){
  if (ready) return ready;
  ready = (async function(){
    if (typeof WebAssembly === 'undefined') throw new Error('WebAssembly unavailable');
    var res = await fetch(WASM_URL);
    if (!res.ok) throw new Error('wasm fetch failed: '+res.status);
    var bytes = await res.arrayBuffer();
    MoorWasm.initSync({module: bytes});
    return true;
  })();
  return ready;
}

function compile(request){
  var out = JSON.parse(MoorWasm.handle('{}', JSON.stringify({op:'compile', request:request})));
  if (!out.ok) throw new Error(out.error || 'compile failed');
  return out.result;
}

function loadLog(){
  try { return JSON.parse(localStorage.getItem('pulse.intent-log') || '[]'); }
  catch(e){ return []; }
}
function saveLog(l){
  try { localStorage.setItem('pulse.intent-log', JSON.stringify(l.slice(-200))); } catch(e){}
}

TOOLS.intent = { mount: function(host){
  var log = loadLog();
  var last = null; // {request, kit, message, fallback}
  host.innerHTML =
    '<div class="t-sec"><div class="eyebrow">Status</div><div class="meta" id="i-status">Loading the intent compiler…</div></div>'+
    '<div class="t-sec"><div class="eyebrow">Ask it for something</div>'+
    '<div class="t-row"><input id="i-req" placeholder="e.g. make me a place to track my plants" spellcheck="false" style="flex:1">'+
    '<button class="btn primary" id="i-go">What did it hear?</button></div>'+
    '<div class="meta">Try a game, a collection, a voxel build, or total nonsense — the compiler never fails silently.</div></div>'+
    '<div class="t-sec" id="i-result-wrap" style="display:none"><div class="eyebrow">What it heard</div>'+
    '<div class="meta" id="i-result"></div>'+
    '<div class="t-row"><button class="btn" id="i-up">👍 got it right</button>'+
    '<button class="btn" id="i-down">👎 missed it</button></div>'+
    '<div class="meta" id="i-vote-msg"></div></div>'+
    '<div class="t-sec"><div class="eyebrow">Feedback log (<span id="i-count">'+log.length+'</span>)</div>'+
    '<div class="meta" id="i-stats"></div>'+
    '<div class="meta mono" id="i-log" style="max-height:180px;overflow:auto;white-space:pre-wrap"></div>'+
    '<div class="t-row"><button class="btn" id="i-clear">Clear log</button></div></div>'+
    '<p class="meta">The real rust-intent-compiler (deterministic, rule-based) via WebAssembly. Your votes stay on this device.</p>';

  function renderLog(){
    var ups = log.filter(function(e){return e.vote==='up';}).length;
    host.querySelector('#i-count').textContent = log.length;
    host.querySelector('#i-stats').innerHTML = log.length ?
      'Correct: <b>'+ups+'</b> / '+log.length+' ('+Math.round(ups/log.length*100)+'%)' : 'No votes yet.';
    host.querySelector('#i-log').innerHTML = log.slice().reverse().map(function(e){
      return (e.vote==='up'?'👍':'👎')+' <b>'+esc(e.kit)+'</b> — “'+esc(e.request)+'”';
    }).join('\n') || '(empty)';
  }
  renderLog();

  ensureWasm().then(function(){
    host.querySelector('#i-status').innerHTML = '✓ Compiler ready — deterministic, runs on-device.';
    host.querySelector('#i-go').onclick = ask;
    host.querySelector('#i-req').onkeydown = function(e){ if (e.key==='Enter') ask(); };
  }).catch(function(err){
    host.querySelector('#i-status').textContent = 'Could not load the compiler: '+err.message;
  });

  function ask(){
    var req = host.querySelector('#i-req').value.trim();
    if (!req) return;
    var r;
    try { r = compile(req); }
    catch(e){
      host.querySelector('#i-result-wrap').style.display='';
      host.querySelector('#i-result').textContent = 'Error: '+e.message;
      return;
    }
    last = {request:req, kit:r.kit, message:r.message, fallback:!!r.fallback};
    host.querySelector('#i-result-wrap').style.display='';
    host.querySelector('#i-vote-msg').textContent='';
    host.querySelector('#i-result').innerHTML =
      'Heard: <b>'+esc(r.kit)+'</b>'+(r.fallback?' <span class="meta">(fallback — no kit matched, started notes instead)</span>':'')+
      '<br><span class="meta">'+esc(r.message||'')+'</span>';
  }
  function vote(v){
    if (!last){ host.querySelector('#i-vote-msg').textContent='Ask it something first.'; return; }
    log.push({t:Date.now(), request:last.request, kit:last.kit, fallback:last.fallback, vote:v});
    saveLog(log); renderLog();
    host.querySelector('#i-vote-msg').textContent = v==='up' ? 'Logged as correct.' : 'Logged as a miss.';
    last = null;
  }
  host.querySelector('#i-up').onclick = function(){ vote('up'); };
  host.querySelector('#i-down').onclick = function(){ vote('down'); };
  host.querySelector('#i-clear').onclick = function(){ log=[]; saveLog(log); renderLog(); };
}};

})();
