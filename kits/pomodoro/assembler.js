(function () {
  "use strict";

  // Themes applied at build time from the quiz "vibe" answer.
  var THEMES = {
    midnight: {
      bg: "#0a0a0f",
      bgGlow: "radial-gradient(120% 90% at 50% 0%, #171722 0%, #0a0a0f 62%)",
      text: "#f5f5f7",
      muted: "rgba(245,245,247,0.55)",
      surface: "rgba(255,255,255,0.05)",
      surfaceBorder: "rgba(255,255,255,0.10)",
      btnBg: "#f5f5f7",
      btnText: "#0a0a0f",
      dotEmpty: "rgba(255,255,255,0.16)",
      track: "rgba(255,255,255,0.08)"
    },
    paper: {
      bg: "#f6f1e7",
      bgGlow: "radial-gradient(120% 90% at 50% 0%, #fffdf7 0%, #f6f1e7 62%)",
      text: "#1d1a15",
      muted: "rgba(29,26,21,0.55)",
      surface: "rgba(29,26,21,0.045)",
      surfaceBorder: "rgba(29,26,21,0.10)",
      btnBg: "#1d1a15",
      btnText: "#f6f1e7",
      dotEmpty: "rgba(29,26,21,0.16)",
      track: "rgba(29,26,21,0.08)"
    }
  };

  var PHASE_COLORS = { focus: "#ffb454", short: "#5fd68a", long: "#62b6ff" };
  var SHORT_MIN = 5;
  var LONG_MIN = 15;

  function build(config) {
    config = config || {};
    var focusMin = parseInt(config.focus_len, 10);
    if (!(focusMin >= 5 && focusMin <= 180)) focusMin = 25;
    var vibe = config.vibe === "paper" ? "paper" : "midnight";
    var extras = Array.isArray(config.extras) ? config.extras : [];
    var tickOn = extras.indexOf("tick") !== -1;
    var streakOn = extras.indexOf("streak") !== -1;
    var t = THEMES[vibe];

    var streakHtml = streakOn
      ? '<div class="today" id="today">Today: 0 sessions</div>'
      : "";

    var html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Focus Timer</title>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; }
  body {
    margin: 0;
    background: ${t.bg};
    background-image: ${t.bgGlow};
    color: ${t.text};
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    display: flex; align-items: center; justify-content: center;
    min-height: 100dvh; padding: 24px 20px;
    touch-action: manipulation;
    -webkit-user-select: none; user-select: none;
  }
  .wrap { width: 100%; max-width: 400px; display: flex; flex-direction: column; align-items: center; gap: 18px; }
  .phase {
    font-size: 15px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    color: ${PHASE_COLORS.focus};
  }
  .ringbox { position: relative; width: min(78vw, 300px); aspect-ratio: 1; }
  .ringbox svg { width: 100%; height: 100%; display: block; transform: rotate(-90deg); }
  .track { fill: none; stroke: ${t.track}; stroke-width: 13; }
  .prog {
    fill: none; stroke: ${PHASE_COLORS.focus}; stroke-width: 13; stroke-linecap: round;
    stroke-dasharray: 829.38; stroke-dashoffset: 0;
    transition: stroke 0.4s ease;
  }
  .center {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 6px; pointer-events: none;
  }
  .time { font-size: clamp(52px, 16vw, 68px); font-weight: 200; letter-spacing: 1px; font-variant-numeric: tabular-nums; }
  .sub { font-size: 14px; color: ${t.muted}; }
  .dots { display: flex; gap: 10px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: ${t.dotEmpty}; transition: background 0.3s ease, transform 0.3s ease; }
  .dot.on { background: ${PHASE_COLORS.focus}; transform: scale(1.15); }
  .controls { display: flex; gap: 12px; width: 100%; justify-content: center; }
  button {
    font-family: inherit; cursor: pointer; border: none; border-radius: 999px;
    min-height: 60px; padding: 0 40px; font-size: 18px; font-weight: 700;
    touch-action: manipulation;
  }
  button:active { transform: scale(0.97); }
  .primary { background: ${t.btnBg}; color: ${t.btnText}; min-width: 170px; box-shadow: 0 8px 28px rgba(0,0,0,0.25); }
  .ghost { background: ${t.surface}; color: ${t.text}; border: 1px solid ${t.surfaceBorder}; min-width: 110px; }
  .today {
    font-size: 14px; color: ${t.muted}; background: ${t.surface};
    border: 1px solid ${t.surfaceBorder}; border-radius: 999px; padding: 8px 18px;
  }
  .card {
    width: 100%; background: ${t.surface}; border: 1px solid ${t.surfaceBorder};
    border-radius: 16px; padding: 14px 18px; font-size: 13px; color: ${t.muted};
    text-align: center; line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="phase" id="phase">Ready</div>
    <div class="ringbox">
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <circle class="track" cx="150" cy="150" r="132"></circle>
        <circle class="prog" id="prog" cx="150" cy="150" r="132"></circle>
      </svg>
      <div class="center">
        <div class="time" id="time">--:--</div>
        <div class="sub" id="sub">tap start</div>
      </div>
    </div>
    <div class="dots" id="dots" aria-hidden="true"></div>
    <div class="controls">
      <button class="primary" id="startBtn" type="button">Start</button>
      <button class="ghost" id="resetBtn" type="button">Reset</button>
    </div>
    ${streakHtml}
    <div class="card">4 focus sessions, then a long break.<br>Stand up, breathe, come back sharper.</div>
  </div>
<script>
(function () {
  "use strict";
  var CFG = { focusMin: ${focusMin}, tick: ${tickOn}, streak: ${streakOn} };
  var COLORS = { focus: "${PHASE_COLORS.focus}", short: "${PHASE_COLORS.short}", long: "${PHASE_COLORS.long}" };
  var SHORT_MIN = ${SHORT_MIN}, LONG_MIN = ${LONG_MIN};
  var C = 829.38;

  var seq = [];
  (function () {
    for (var i = 0; i < 4; i++) {
      seq.push({ id: "focus", label: "Focus", min: CFG.focusMin });
      var last = (i === 3);
      seq.push({ id: last ? "long" : "short", label: last ? "Long break" : "Short break", min: last ? LONG_MIN : SHORT_MIN });
    }
  })();

  var phaseIdx = 0;
  var totalMs = seq[0].min * 60000;
  var remainingMs = totalMs;
  var endAt = 0;
  var running = false;
  var timerId = null;
  var lastTickSec = -1;
  var focusDone = 0;
  var todayCount = 0;

  var elPhase = document.getElementById("phase");
  var elTime = document.getElementById("time");
  var elSub = document.getElementById("sub");
  var elProg = document.getElementById("prog");
  var elDots = document.getElementById("dots");
  var elStart = document.getElementById("startBtn");
  var elReset = document.getElementById("resetBtn");
  var elToday = document.getElementById("today");

  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60), r = s % 60;
    return (m < 10 ? "0" + m : "" + m) + ":" + (r < 10 ? "0" + r : "" + r);
  }

  function render() {
    var ph = seq[phaseIdx];
    elPhase.textContent = ph.label;
    elPhase.style.color = COLORS[ph.id];
    elTime.textContent = fmt(remainingMs);
    elProg.style.stroke = COLORS[ph.id];
    var frac = totalMs > 0 ? remainingMs / totalMs : 0;
    if (frac < 0) frac = 0; if (frac > 1) frac = 1;
    elProg.style.strokeDashoffset = String(C * (1 - frac));
    elSub.textContent = running ? (ph.id === "focus" ? "stay with it" : "breathe") : "tap start";
    var dots = "";
    for (var i = 0; i < 4; i++) {
      dots += '<span class="dot' + (i < focusDone ? " on" : "") + '"></span>';
    }
    elDots.innerHTML = dots;
    elStart.textContent = running ? "Pause" : "Start";
    if (elToday) {
      elToday.textContent = "Today: " + todayCount + (todayCount === 1 ? " session" : " sessions");
    }
  }

  var AC = null;
  function ac() {
    try {
      if (!AC) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        AC = new Ctx();
      }
      if (AC.state === "suspended") { AC.resume(); }
    } catch (e) { return null; }
    return AC;
  }
  function blip(freq, dur, vol, delay) {
    try {
      var ctx = ac();
      if (!ctx) return;
      var t0 = ctx.currentTime + (delay || 0);
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) {}
  }
  function chime() { blip(659.25, 0.5, 0.14, 0); blip(880, 0.7, 0.14, 0.18); }

  function advance() {
    var was = seq[phaseIdx];
    if (was.id === "focus") { todayCount++; focusDone++; }
    phaseIdx = (phaseIdx + 1) % seq.length;
    if (phaseIdx === 0) { focusDone = 0; }
    var ph = seq[phaseIdx];
    totalMs = ph.min * 60000;
    remainingMs = totalMs;
    lastTickSec = -1;
    if (running) { endAt = Date.now() + remainingMs; }
    chime();
    render();
  }

  function loop() {
    if (!running) return;
    remainingMs = endAt - Date.now();
    if (remainingMs <= 0) { advance(); return; }
    if (CFG.tick && seq[phaseIdx].id === "focus") {
      var sec = Math.ceil(remainingMs / 1000);
      if (sec !== lastTickSec) { lastTickSec = sec; blip(880, 0.035, 0.022, 0); }
    }
    render();
  }

  function start() {
    if (running) return;
    ac();
    running = true;
    endAt = Date.now() + remainingMs;
    lastTickSec = -1;
    if (!timerId) { timerId = setInterval(loop, 200); }
    render();
  }
  function pause() { running = false; render(); }
  function reset() {
    running = false;
    phaseIdx = 0;
    totalMs = seq[0].min * 60000;
    remainingMs = totalMs;
    focusDone = 0;
    lastTickSec = -1;
    render();
  }

  elStart.addEventListener("click", function () { if (running) { pause(); } else { start(); } });
  elReset.addEventListener("click", function () { reset(); });
  render();
})();
</script>
</body>
</html>`;

    return html;
  }

  var root = typeof window !== "undefined"
    ? window
    : (typeof globalThis !== "undefined" ? globalThis : {});
  root.MoorKit = { build: build };
})();
