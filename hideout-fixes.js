/* hideout-fixes.js — runtime patch module for the canon dev room (abandoned cathedral).
 *
 * What it fixes (bottom dock):
 *  1. "Farm", "Detached Child", "Pulse", "Decisions" opened an EMPTY overlay:
 *     the room's openToolUrl() looks up #overlay-frame / #overlay-title, but the
 *     overlay markup uses #ovframe / #ovname, so the tool URL was never loaded.
 *     These buttons are rewired to the room's own working overlay opener.
 *  2. "Monitor focus" flew the camera correctly, but its fullscreen view also
 *     opened an empty overlay (same stale IDs). Reimplemented with the room's
 *     own live rig state (head.userData.rig) + exposed player/camera.
 *  3. "New blueprint" only showed a toast. It now opens the build console with
 *     a Page 0 draft template prefilled in the order box — a real starting point.
 *  4. The dock collapse toggle (#dock-toggle) was destroyed by renderDock()'s
 *     innerHTML='' on every render, so it could never be clicked. It is
 *     restored and wired (phones start minimized and can now expand the dock).
 *  5. window.openToolUrl shim: inline onclick="openToolUrl(...)" handlers
 *     (e.g. the museum "OPEN EVIDENCE" button) threw ReferenceError because
 *     openToolUrl only exists in module scope. The shim routes them to the
 *     working overlay opener.
 *
 * Design: IIFE. The only global is window.__hideoutFixes. Every step
 * feature-detects its anchors and never throws. No network. No model calls.
 * Arm geometry is NOT patched here (arm posing lives in module scope and is
 * re-applied every frame); the geometric fix ships as a code-edit patch spec.
 */
(function(){
'use strict';

var report = { applied: [], skipped: [], errors: [] };
function ok(name){ report.applied.push(name); }
function skip(name, why){ report.skipped.push(name + ' — ' + why); }
function $(id){ return document.getElementById(id); }

/* Fixed overlay opener. Prefers the room's own exposed opener; falls back to
 * direct DOM with the correct element IDs. Returns true if it did something. */
function openToolFixed(url, title){
  try{
    if(typeof window.__openOverlayForTest === 'function'){
      window.__openOverlayForTest(url, title || url);
      return true;
    }
    var o = $('overlay'), f = $('ovframe'), t = $('ovname');
    if(!o || !f) return false;
    if(t) t.textContent = title || url;
    f.src = url;
    o.classList.add('open');
    return true;
  }catch(e){
    report.errors.push('openToolFixed: ' + (e && e.message));
    return false;
  }
}

/* "New blueprint" — real function: open the build console (the commissioning
 * path) with a Page 0 draft template prefilled. Plain language, no invented
 * backend: the user fills it in and seals it through the normal funnel. */
var PAGE0_TEMPLATE = 'PAGE 0 — new blueprint draft\n' +
  '\n' +
  'Name: \n' +
  'One-line promise: \n' +
  'Who it serves: \n' +
  'What changes for them: \n' +
  'What it is NOT: \n' +
  'First proof it works: \n';
function newBlueprintDraft(){
  try{ if(typeof window.__openBuild === 'function') window.__openBuild(); }catch(e){}
  try{
    var ta = $('bld-order');
    if(ta && !ta.value.trim()){
      ta.value = PAGE0_TEMPLATE;
      try{ ta.focus(); }catch(e2){}
    }
  }catch(e){
    report.errors.push('newBlueprintDraft: ' + (e && e.message));
  }
}

/* "Monitor focus" — faithful reimplementation using the room's own live state.
 * The original flies the camera (that half works) then opens an EMPTY overlay
 * (stale IDs). This does the same camera move via the exposed player/camera,
 * then opens the overlay with the monitor's real tool URL. */
function findHead(key){
  try{
    var scene = window.__scene;
    if(!scene || typeof scene.traverse !== 'function') return null;
    var found = null;
    scene.traverse(function(o){
      if(found) return;
      var r = o.userData && o.userData.rig;
      if(r && r.def && r.def.key === key) found = o;
    });
    return found;
  }catch(e){ return null; }
}
function flyPlayerTo(tx, ty, tz){
  try{
    var player = window.__player, apply = window.__applyCam;
    if(!player || typeof apply !== 'function') return false;
    var fx = player.x, fy = player.y, fz = player.z, t0 = null;
    function step(ts){
      try{
        if(t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / 1200);
        var k = t >= 1 ? 1 : (1 - Math.pow(1 - t, 3)); // same cubic-out ease as flyTo
        player.x = fx + (tx - fx) * k;
        player.y = fy + (ty - fy) * k;
        player.z = fz + (tz - fz) * k;
        apply();
        if(t < 1) requestAnimationFrame(step);
      }catch(e){}
    }
    requestAnimationFrame(step);
    return true;
  }catch(e){ return false; }
}
function focusMonitorFixed(){
  var fallbackUrl = 'pulse-dashboard.html';
  try{
    var head = findHead('tools'); // monitor 0
    var st = head && head.userData && head.userData.rig;
    var url = (st && st.def && st.def.url) || fallbackUrl;
    if(st && st.cur){
      var p = st.cur, yawR = p.yaw * Math.PI / 180;
      // same target as the original: 9 units in front of the screen
      flyPlayerTo(p.x + Math.sin(yawR) * 9, p.y, p.z + Math.cos(yawR) * 9);
    }
    setTimeout(function(){ openToolFixed(url, url); }, 900);
  }catch(e){
    report.errors.push('focusMonitorFixed: ' + (e && e.message));
    openToolFixed(fallbackUrl, fallbackUrl);
  }
}

/* Rewire the dock. renderDock() rebuilds #dock via innerHTML='' on every
 * category toggle, which destroys both the toggle button and our onclick
 * overrides — so this runs once at load AND on every #dock mutation. */
var URL_BUTTONS = {
  'Farm': 'blueprint-farm.html',
  'Detached Child': 'pulse-dashboard.html',
  'Pulse': 'pulse-dashboard.html',
  'Decisions': 'funnel-evolution-record.html'
};
function rewireDock(){
  var dock = $('dock');
  if(!dock) return false;
  // restore the collapse toggle renderDock() wipes out
  var tg = $('dock-toggle');
  if(!tg){
    tg = document.createElement('button');
    tg.id = 'dock-toggle';
    tg.setAttribute('aria-label', 'collapse dock');
    tg.textContent = '–';
    dock.insertBefore(tg, dock.firstChild);
  }
  if(!tg._hfWired){
    tg._hfWired = true;
    tg.addEventListener('click', function(){ dock.classList.toggle('min'); });
  }
  // rewire the broken tool buttons, matched by visible name
  var tools = dock.querySelectorAll('.dock-tool');
  for(var i = 0; i < tools.length; i++){
    var b = tools[i];
    if(b._hfWired) continue;
    var s = b.querySelector('strong');
    if(!s) continue;
    var name = s.textContent.trim();
    if(URL_BUTTONS[name]){
      (function(btn, url){
        btn.addEventListener('click', function(){ openToolFixed(url, url); });
        // neutralize the original (broken) onclick without removing it
        btn.onclick = null;
      })(b, URL_BUTTONS[name]);
      b._hfWired = true;
    }else if(name === 'New blueprint'){
      b.addEventListener('click', function(){ newBlueprintDraft(); });
      b.onclick = null;
      b._hfWired = true;
    }else if(name === 'Monitor focus'){
      b.addEventListener('click', function(){ focusMonitorFixed(); });
      b.onclick = null;
      b._hfWired = true;
    }
  }
  return true;
}

function init(){
  if(!$('dock')){ skip('init', 'no #dock element'); return; }
  // Global shim so inline onclick="openToolUrl(...)" handlers (museum detail
  // "OPEN EVIDENCE") stop throwing ReferenceError. The module's own internal
  // openToolUrl is untouched; dock buttons are rewired at the DOM level.
  try{
    if(typeof window.openToolUrl !== 'function'){
      window.openToolUrl = function(u){ openToolFixed(u, u); };
      ok('window.openToolUrl shim');
    }else{
      skip('window.openToolUrl shim', 'already defined');
    }
  }catch(e){
    report.errors.push('shim: ' + (e && e.message));
  }
  try{
    if(rewireDock()) ok('dock rewire (initial pass)');
    else skip('dock rewire', 'rewireDock returned false');
  }catch(e){
    report.errors.push('rewire: ' + (e && e.message));
  }
  try{
    var mo = new MutationObserver(function(){
      try{ rewireDock(); }catch(e){}
    });
    mo.observe($('dock'), { childList: true, subtree: true });
    ok('dock mutation observer');
  }catch(e){
    skip('mutation observer', String((e && e.message) || e));
  }
}

if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', init);
}else{
  init();
}

window.__hideoutFixes = {
  report: function(){ return report; },
  rewire: rewireDock,
  version: '1.0.0'
};
})();
