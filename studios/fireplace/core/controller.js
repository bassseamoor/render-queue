// Fireplace Studio — core/controller.js. See README.md for ownership and replacement boundaries.
import { PARAM_KEYS, PARAM_SIZES, applySeedParams, decodeParams, hashMix, paramsToNum, parseSeed, settingsSeedString } from './seeds.js';
import { generateScene } from '../world/scene.js';
import { settings } from './settings.js';
import { buildParticles } from '../world/particles.js';
import { resetClock, tickFrame } from './clock.js';
import { lifeInit } from '../world/life.js';
import { cryptoUint32, mulberry32 } from './math.js';

function applySeedString(seedStr){
  applySeedParams(parseSeed(seedStr));
  generateScene(settings);
  buildParticles(settings);
  resetClock();
  tickFrame(0,0);
  document.title="Fireplace — "+settingsSeedString();
  try{ localStorage.setItem("fireplace-studio-v3-seed",settingsSeedString()); }catch(e){}
}
let regenTimer=0;
function setParamLive(key,val){
  settings[key]=val;
  clearTimeout(regenTimer);
  regenTimer=setTimeout(function(){ generateScene(settings); buildParticles(settings); },180);
}

function redress(){ generateScene(settings); buildParticles(settings); }
const resetRender=function(){
  resetClock();
  generateScene(settings);
  buildParticles(settings);
  lifeInit(settings.seed);
};
const remixSeed=function(s){
  const ps=parseSeed(s);
  const q=decodeParams(ps.ver===3?(ps.n>>>0):hashMix(ps.n>>>0));
  const r=mulberry32(cryptoUint32());
  const idx=[]; const nCh=3+((r()*3)|0);
  while(idx.length<nCh){ const ii=(r()*PARAM_KEYS.length)|0; if(idx.indexOf(ii)<0) idx.push(ii); }
  for(const ii of idx) q[PARAM_KEYS[ii]]=(r()*PARAM_SIZES[ii])|0;
  return "#3"+paramsToNum(q).toString(16).toUpperCase().padStart(8,"0");
};

export { applySeedString, redress, remixSeed, resetRender, setParamLive };
