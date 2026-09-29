// Tabata Timer kit — window.MoorKit.build(config) -> complete HTML string.
// Touch-first HIIT interval timer: big countdown ring, phase labels, round dots,
// Web Audio beeps, wake-lock attempt, end summary. No external assets.
window.MoorKit = { build: build };

var PRESETS = {
  tabata:    { label: "Tabata",       work: 20, rest: 10, rounds: 8 },
  hiit:      { label: "Classic HIIT", work: 40, rest: 20, rounds: 10 },
  endurance: { label: "Endurance",    work: 45, rest: 15, rounds: 12 }
};
var WARMCOOL = { none: 0, short: 30, full: 60 };
var ACCENTS = {
  ember:   { a: "#ff5a3c", b: "#ffb03c" },
  volt:    { a: "#b8f13c", b: "#3cf19a" },
  glacier: { a: "#3cd6f1", b: "#3c7ef1" }
};

function cfgGet(cfg, key, fallback) {
  if (cfg && cfg[key] !== undefined && cfg[key] !== null) return cfg[key];
  return fallback;
}
function optId(v) {
  if (v && typeof v === "object" && v.id !== undefined) return v.id;
  return v;
}

function build(config) {
  config = (config && typeof config === "object") ? config : {};
  var presetId = PRESETS[optId(cfgGet(config, "preset", "tabata"))] ? optId(cfgGet(config, "preset", "tabata")) : "tabata";
  var wcId = WARMCOOL[optId(cfgGet(config, "warmcool", "short"))] !== undefined ? optId(cfgGet(config, "warmcool", "short")) : "short";
  var accentId = ACCENTS[optId(cfgGet(config, "accent", "ember"))] ? optId(cfgGet(config, "accent", "ember")) : "ember";
  var extras = cfgGet(config, "extras", ["sound", "awake"]);
  if (!Array.isArray(extras)) extras = [];
  extras = extras.map(optId);

  var P = PRESETS[presetId], W = WARMCOOL[wcId], A = ACCENTS[accentId];
  var soundOn = extras.indexOf("sound") !== -1;
  var awakeOn = extras.indexOf("awake") !== -1;

  var CFG = { work: P.work, rest: P.rest, rounds: P.rounds, warm: W, cool: W,
              accentA: A.a, accentB: A.b, presetLabel: P.label,
              sound: soundOn ? 1 : 0, awake: awakeOn ? 1 : 0 };

  var html = '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
    + '<title>' + P.label + ' Timer</title><style>'
    + '*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}'
    + 'html,body{height:100%}'
    + 'body{background:#0a0b0e;color:#f2f3f5;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;overflow:hidden;user-select:none;-webkit-user-select:none;touch-action:manipulation}'
    + '#app{width:100%;max-width:430px;height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;position:relative}'
    + '.screen{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px;transition:opacity .25s ease;width:100%;height:100%}'
    + '.hidden{opacity:0;pointer-events:none}'
    + 'h1{font-size:30px;font-weight:800;letter-spacing:-.5px;margin-bottom:6px;text-align:center}'
    + '.sub{color:#9aa0aa;font-size:15px;margin-bottom:26px;text-align:center;line-height:1.5}'
    + '.summary{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:16px 20px;margin-bottom:30px;width:100%}'
    + '.summary .row{display:flex;justify-content:space-between;padding:7px 0;font-size:15px}'
    + '.summary .row b{font-variant-numeric:tabular-nums}'
    + '.bigbtn{background:linear-gradient(135deg,' + A.a + ',' + A.b + ');border:0;color:#0a0b0e;font-size:19px;font-weight:800;'
    + 'border-radius:18px;padding:18px 56px;min-height:60px;min-width:220px;cursor:pointer;letter-spacing:.3px;box-shadow:0 8px 32px -8px ' + A.a + '}'
    + '.bigbtn:active{transform:scale(.96)}'
    + '#phase{font-size:17px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;color:' + A.a + '}'
    + '#roundline{font-size:15px;color:#9aa0aa;margin-bottom:18px;font-variant-numeric:tabular-nums}'
    + '#clockwrap{position:relative;width:min(72vw,280px);height:min(72vw,280px);margin-bottom:20px}'
    + '#clockwrap svg{width:100%;height:100%;transform:rotate(-90deg)}'
    + '.track{stroke:rgba(255,255,255,.08)}'
    + '#prog{stroke:url(#grad);stroke-linecap:round;transition:stroke-dashoffset .2s linear}'
    + '#time{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:min(20vw,76px);font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-2px}'
    + '#dots{display:flex;gap:8px;margin-bottom:26px;flex-wrap:wrap;justify-content:center;max-width:320px}'
    + '.dot{width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.14);transition:background .2s}'
    + '.dot.done{background:' + A.a + '}'
    + '.dot.cur{box-shadow:0 0 0 4px ' + A.a + '55;background:' + A.b + '}'
    + '#controls{display:flex;gap:14px}'
    + '.cbtn{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:#f2f3f5;font-size:15px;font-weight:700;'
    + 'border-radius:14px;min-width:96px;min-height:52px;padding:12px 18px;cursor:pointer}'
    + '.cbtn:active{transform:scale(.95)}'
    + '#endstats{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;margin-bottom:28px}'
    + '.stat{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:14px;padding:16px;text-align:center}'
    + '.stat .v{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}'
    + '.stat .k{font-size:12px;color:#9aa0aa;margin-top:4px;letter-spacing:1px;text-transform:uppercase}'
    + '.trophy{font-size:56px;margin-bottom:14px}'
    + '</style></head><body><div id="app">'

    + '<div class="screen" id="s-setup">'
    + '<h1>' + P.label + ' Timer</h1>'
    + '<div class="sub">' + P.rounds + ' rounds · ' + P.work + 's work · ' + P.rest + 's rest' + (W ? '<br>' + W + 's warm-up + ' + W + 's cool-down' : '') + '</div>'
    + '<div class="summary">'
    + '<div class="row"><span>Work</span><b>' + fmtDur(P.work * P.rounds) + '</b></div>'
    + '<div class="row"><span>Rest</span><b>' + fmtDur(P.rest * (P.rounds - 1)) + '</b></div>'
    + (W ? '<div class="row"><span>Warm-up / cool-down</span><b>' + W + 's / ' + W + 's</b></div>' : '')
    + '<div class="row"><span>Total</span><b>' + fmtDur(P.work * P.rounds + P.rest * (P.rounds - 1) + W * 2 + 5) + '</b></div>'
    + '</div>'
    + '<button class="bigbtn" id="b-start">Start workout</button>'
    + '</div>'

    + '<div class="screen hidden" id="s-run">'
    + '<div id="phase">Get ready</div>'
    + '<div id="roundline">Round 0/' + P.rounds + '</div>'
    + '<div id="clockwrap"><svg viewBox="0 0 120 120">'
    + '<defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">'
    + '<stop offset="0" stop-color="' + A.a + '"/><stop offset="1" stop-color="' + A.b + '"/>'
    + '</linearGradient></defs>'
    + '<circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="9"/>'
    + '<circle id="prog" cx="60" cy="60" r="52" fill="none" stroke-width="9" stroke-dasharray="326.7" stroke-dashoffset="0"/>'
    + '</svg><div id="time">5</div></div>'
    + '<div id="dots">' + dotsHtml(P.rounds) + '</div>'
    + '<div id="controls">'
    + '<button class="cbtn" id="b-pause">Pause</button>'
    + '<button class="cbtn" id="b-skip">Skip &#9654;&#9654;</button>'
    + '<button class="cbtn" id="b-end">End</button>'
    + '</div></div>'

    + '<div class="screen hidden" id="s-done">'
    + '<div class="trophy">🏁</div>'
    + '<h1>Workout complete</h1>'
    + '<div class="sub">Nice work. That was ' + P.label.toLowerCase() + '.</div>'
    + '<div id="endstats">'
    + '<div class="stat"><div class="v" id="e-rounds">' + P.rounds + '/' + P.rounds + '</div><div class="k">Rounds</div></div>'
    + '<div class="stat"><div class="v" id="e-work">' + fmtDur(P.work * P.rounds) + '</div><div class="k">Work time</div></div>'
    + '<div class="stat"><div class="v" id="e-total">0:00</div><div class="k">Elapsed</div></div>'
    + '<div class="stat"><div class="v" id="e-phases">0</div><div class="k">Intervals</div></div>'
    + '</div>'
    + '<button class="bigbtn" id="b-again">Go again</button>'
    + '</div>'

    + '</div><script>'
    + '"use strict";'
    + 'var CFG=' + JSON.stringify(CFG) + ';'
    + jsBody()
    + '</scr' + 'ipt></body></html>';
  return html;
}

function fmtDur(s) {
  s = Math.round(s);
  var m = Math.floor(s / 60), r = s % 60;
  return m + ":" + (r < 10 ? "0" : "") + r;
}
function dotsHtml(n) {
  var s = "";
  for (var i = 0; i < n; i++) s += '<div class="dot" id="dot' + i + '"></div>';
  return s;
}

function jsBody() {
  return '(' + engineSrc.toString() + ')();';
}

function engineSrc() {
  var C = CFG;
  var $ = function(id) { return document.getElementById(id); };
  var CIRC = 326.7;

  // ---- timeline ----
  var phases = [];
  if (C.warm > 0) phases.push({ label: "Warm up", secs: C.warm, kind: "warm" });
  phases.push({ label: "Get ready", secs: 5, kind: "ready" });
  for (var r = 1; r <= C.rounds; r++) {
    phases.push({ label: "Work", secs: C.work, kind: "work", round: r });
    if (r < C.rounds) phases.push({ label: "Rest", secs: C.rest, kind: "rest", round: r });
  }
  if (C.cool > 0) phases.push({ label: "Cool down", secs: C.cool, kind: "cool" });

  // ---- state ----
  var idx = -1, phaseStart = 0, phaseLen = 0, remaining = 0;
  var tickTimer = null, running = false, paused = false, finished = false;
  var phaseCount = 0, workoutStart = 0, audio = null;
  var wakeLock = null, lastTickSec = -1;

  function show(id) {
    ["s-setup", "s-run", "s-done"].forEach(function(s) {
      $(s).classList.toggle("hidden", s !== id);
    });
  }

  // ---- audio ----
  function ensureAudio() {
    if (!C.sound) return;
    try {
      if (!audio) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audio = new AC();
      }
      if (audio.state === "suspended") audio.resume();
    } catch (e) { audio = null; }
  }
  function beep(freq, dur, when) {
    if (!C.sound || !audio) return;
    try {
      var t = audio.currentTime + (when || 0);
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (e) {}
  }
  var shortBeep = function(w) { beep(880, 0.15, w); };
  var longBeep = function() { beep(440, 0.6, 0); };

  // ---- wake lock ----
  function lockScreen() {
    if (!C.awake) return;
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request("screen").then(function(l) {
          wakeLock = l;
        }).catch(function() {});
      }
    } catch (e) {}
  }
  function unlockScreen() {
    try { if (wakeLock && wakeLock.release) wakeLock.release(); } catch (e) {}
    wakeLock = null;
  }
  document.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "visible" && running && !paused) lockScreen();
  });

  // ---- render ----
  function updateDotsByIdx() {
    var doneRounds = 0;
    for (var i = 0; i <= idx; i++) {
      if (phases[i] && phases[i].kind === "work") doneRounds = phases[i].round;
    }
    for (var j = 0; j < C.rounds; j++) {
      var d = $("dot" + j);
      if (!d) continue;
      var cls = "dot";
      if (j < doneRounds) cls += " done";
      else if (idx >= 0 && phases[idx] && phases[idx].kind === "work" && phases[idx].round === j + 1) cls += " cur";
      d.className = cls;
    }
  }
  function render() {
    var ph = phases[idx];
    if (!ph) return;
    $("phase").textContent = ph.label;
    var rl = "Round " + (ph.round || (ph.kind === "warm" || ph.kind === "cool" ? "–" : "0")) + "/" + C.rounds;
    $("roundline").textContent = rl;
    var secsLeft = Math.max(0, Math.ceil(remaining));
    $("time").textContent = secsLeft;
    var frac = phaseLen > 0 ? (remaining / phaseLen) : 0;
    frac = Math.max(0, Math.min(1, frac));
    $("prog").setAttribute("stroke-dashoffset", (CIRC * (1 - frac)).toFixed(1));
    updateDotsByIdx();
  }

  function tick() {
    var now = Date.now();
    remaining = (phaseStart + phaseLen * 1000 - now) / 1000;
    if (remaining <= 0) { nextPhase(); return; }
    var s = Math.ceil(remaining);
    if (s !== lastTickSec) {
      lastTickSec = s;
      if (s <= 3 && s >= 1) shortBeep(0);
    }
    render();
  }

  function nextPhase() {
    idx++;
    if (idx >= phases.length) { finish(); return; }
    var ph = phases[idx];
    phaseLen = ph.secs; remaining = ph.secs;
    phaseStart = Date.now();
    lastTickSec = -1;
    phaseCount++;
    longBeep();
    render();
  }

  function start() {
    ensureAudio();
    lockScreen();
    idx = -1; phaseCount = 0; finished = false; paused = false;
    running = true;
    workoutStart = Date.now();
    show("s-run");
    $("b-pause").textContent = "Pause";
    nextPhase();
    clearInterval(tickTimer);
    tickTimer = setInterval(tick, 200);
  }

  function pauseToggle() {
    if (!running || finished) return;
    ensureAudio();
    if (paused) {
      // resume
      phaseStart = Date.now() - (phaseLen * 1000 - remaining * 1000);
      paused = false;
      clearInterval(tickTimer);
      tickTimer = setInterval(tick, 200);
      $("b-pause").textContent = "Pause";
      lockScreen();
    } else {
      paused = true;
      clearInterval(tickTimer);
      $("b-pause").textContent = "Resume";
      unlockScreen();
    }
  }

  function skip() {
    if (!running || finished) return;
    ensureAudio();
    clearInterval(tickTimer);
    paused = false;
    $("b-pause").textContent = "Pause";
    nextPhase();
    if (running) tickTimer = setInterval(tick, 200);
  }

  function endEarly() {
    if (!running) return;
    clearInterval(tickTimer);
    running = false;
    paused = false;
    unlockScreen();
    finish();
  }

  function finish() {
    finished = true;
    running = false;
    paused = false;
    clearInterval(tickTimer);
    unlockScreen();
    if (C.sound) { shortBeep(0); shortBeep(0.25); longBeep(); }
    var elapsed = Math.max(0, Math.round((Date.now() - workoutStart) / 1000));
    var doneRounds = 0;
    for (var i = 0; i < Math.min(idx, phases.length); i++) {
      if (phases[i].kind === "work") doneRounds = phases[i].round;
    }
    $("e-rounds").textContent = doneRounds + "/" + C.rounds;
    $("e-work").textContent = fmtDur(doneRounds * C.work);
    $("e-total").textContent = fmtDur(elapsed);
    $("e-phases").textContent = phaseCount;
    show("s-done");
  }

  function fmtDur(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function bindTap(el, fn) {
    if (!el) return;
    el.addEventListener("pointerdown", function(e) { e.preventDefault(); fn(); }, { passive: false });
    el.addEventListener("keydown", function(e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
    });
  }

  bindTap($("b-start"), start);
  bindTap($("b-pause"), pauseToggle);
  bindTap($("b-skip"), skip);
  bindTap($("b-end"), endEarly);
  bindTap($("b-again"), function() {
    show("s-setup");
  });
}
