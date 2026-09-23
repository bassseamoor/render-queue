// Fireplace Studio — ui/controls.js. See README.md for ownership and replacement boundaries.
import { SeedConsole } from './seed-console.js';
import { dress, dressSave } from '../world/dressing.js';
import { S } from '../core/state.js';
import { redress } from '../core/controller.js';

/* Fireplace Studio v3 adapter for the Seed Console (seed-console.js).
 * Seed format "#3XXXXXXXX": the 32-bit number IS the mixed-radix packing of
 * all 12 scene parameters (stone/floor/wood/rug/weather/time/water/camera/
 * motion/fire/deck/sparks), so any ?seed= link rebuilds the exact scene.
 * Legacy "#2..." / numeric seeds keep their number and are hashed into the
 * nearest v3 scene. Customize tweaks re-encode into the seed via getSeed().
 * Remix changes a random subset of params (locks are re-applied by the
 * console afterwards, so locked params hold).
 */
function mountControls(){
"use strict";
var L = window.__fpLabels || {};
function enumParam(key, list, label){
  list = (list && list.length) ? list : ["?"];
  return {
    key: key, label: label+" ("+list.join("/")+")",
    min: 0, max: list.length-1, step: 1,
    get: function(){
      var s = window.__fpGetSettings ? window.__fpGetSettings() : null;
      var v = s ? Math.round(s[key]||0) : 0;
      return Math.max(0, Math.min(list.length-1, v));
    },
    set: function(v){
      v = Math.max(0, Math.min(list.length-1, Math.round(v)));
      if (window.__fpSetParam) window.__fpSetParam(key, v);
    }
  };
}
var sparksParam = {
  key: "sparks", label: "Ember rate", min: 0, max: 100, step: 1,
  get: function(){ var s=window.__fpGetSettings?window.__fpGetSettings():null; return s?(s.sparks|0):0; },
  set: function(v){ if(window.__fpSetParam) window.__fpSetParam("sparks", Math.max(0, Math.min(100, Math.round(v)))); }
};
window.SeedConsoleAdapter = {
  studio: "fireplace",
  title: "Fireplace Studio",
  getSeed: function(){ return window.__fpGetSeed(); },
  setSeed: function(s){ window.__fpSetSeed(s); },
  randomSeed: function(){ return window.__fpRandomSeed(); },
  remixSeed: function(s){ return window.__fpRemixSeed(s); },
  params: [
    enumParam("stone",   L.STONES,   "Stone"),
    enumParam("floor",   L.FLOORS,   "Floor"),
    enumParam("wood",    L.WOODS,    "Wood"),
    enumParam("rug",     L.RUGS,     "Rug"),
    enumParam("weather", L.WEATHERS, "Weather"),
    enumParam("time",    L.TIMES,    "Time of day"),
    enumParam("water",   L.WATERS,   "Lake water"),
    enumParam("camera",  L.CAMS,     "Camera"),
    enumParam("motion",  L.MOTIONS,  "Camera motion"),
    enumParam("fire",    L.FIRES,    "Fire"),
    enumParam("deck",    L.DECKS,    "Deck set"),
    sparksParam,
    enumParam("grain",   L.GRAINS,   "Film grain")
  ],
  canvas: function(){ return document.getElementById("scene"); },
  fileBase: function(seedStr){ return "fireplace-studio-"+String(seedStr).replace(/^#/,"").toLowerCase(); }
};
try {
  SeedConsole.init(window.SeedConsoleAdapter);
} catch(e){
  console.error("[fireplace] SeedConsole init failed", e);
}

/* ---- Room dressing controls (not saved in seed) ----
   Inserted after the packed scene parameters. Brightness takes effect
   live; the mantle toggle rebuilds room geometry. Seed untouched. */
try {
  const _panel = document.querySelector('.sc-panel');
  const _anchor = document.getElementById('sc-params');
  if (_panel && _anchor && !document.getElementById('dress-ceil')) {
    const _sec = document.createElement('div');
    _sec.innerHTML =
      '<div class="sc-sec">Room dressing (not saved in seed)</div>' +
      '<div class="sc-param"><div class="top"><label>Ceiling lights</label>' +
      '<span class="val" id="dress-ceilval"></span></div>' +
      '<input type="range" id="dress-ceil" min="0" max="1.5" step="0.05"></div>' +
      '<div class="sc-row"><button class="sc-btn" id="dress-mantle" style="font-size:13px"></button></div>';
    _anchor.after(_sec);
    const _slider = _sec.querySelector('#dress-ceil');
    const _val = _sec.querySelector('#dress-ceilval');
    const _mbtn = _sec.querySelector('#dress-mantle');
    const _paint = () => {
      _slider.value = dress.ceil;
      _val.textContent = Math.round(dress.ceil * 100) + '%';
      _mbtn.textContent = '🖼️ Mantle: ' + (dress.mantle ? 'On' : 'Off');
    };
    _slider.addEventListener('input', () => {
      dress.ceil = parseFloat(_slider.value) || 0;
      const _le2 = 0.9 * dress.ceil;
      for (const _d of S.draws)
        if (_d.dressLens) _d.emis = [1.0 * _le2, 0.9 * _le2, 0.75 * _le2];
      _paint(); dressSave();
    });
    _mbtn.addEventListener('click', () => {
      dress.mantle = !dress.mantle;
      _paint(); dressSave(); redress();
    });
    _paint();
  }
} catch(e){
  console.error("[fireplace] dress UI failed", e);
}
}
function mountFullscreen(){
document.getElementById("fullBtn").addEventListener("click", ()=>{
  const st=document.getElementById("stage");
  if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  else st.requestFullscreen().catch(()=>{});
});
document.addEventListener("keydown",(e)=>{
  if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if(e.key==="f"||e.key==="F") document.getElementById("fullBtn").click();
});


}

export { mountControls, mountFullscreen };
