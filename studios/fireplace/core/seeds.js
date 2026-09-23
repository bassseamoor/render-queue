// Fireplace Studio — core/seeds.js. See README.md for ownership and replacement boundaries.
import { clamp, cryptoUint32 } from './math.js';
import { settings } from './settings.js';

function parseSeed(s){
  s = String(s||"").trim();
  let m = s.match(/^#3([0-9A-Fa-f]{8})$/);
  if (m) return { n: parseInt(m[1],16)>>>0, ver: 3 };
  m = s.match(/^#([0-9A-Fa-f]{8})$/);
  if (m) return { n: parseInt(m[1],16)>>>0, ver: 2 }; /* legacy: remap to closest v3 */
  m = s.match(/^(\d{1,10})$/);
  if (m) return { n: (parseInt(m[1],10)>>>0), ver: 1 };
  return { n: cryptoUint32(), ver: 3 };
}
const PARAM_KEYS=["stone","floor","wood","rug","weather","time","water","camera","motion","fire","deck","sparks","grain"];
const PARAM_SIZES=[4,4,3,4,5,3,3,6,3,3,3,101,5];
function hashMix(n){ n=Math.imul(n^0x9e3779b9,0x85ebca6b)>>>0; n^=n>>>13; n=Math.imul(n,0xc2b2ae35)>>>0; n^=n>>>16; return n>>>0; }
function decodeParams(n){
  const out={}; let k=n>>>0;
  for(let i=0;i<PARAM_SIZES.length;i++){ out[PARAM_KEYS[i]]=k%PARAM_SIZES[i]; k=Math.floor(k/PARAM_SIZES[i]); }
  return out;
}
function paramsToNum(p){
  let n=0,mult=1;
  for(let i=0;i<PARAM_KEYS.length;i++){ n+=clamp(Math.round(p[PARAM_KEYS[i]]||0),0,PARAM_SIZES[i]-1)*mult; mult*=PARAM_SIZES[i]; }
  return n>>>0;
}
function randomSeedString(){
  const p={};
  for(let i=0;i<PARAM_KEYS.length;i++) p[PARAM_KEYS[i]]=(cryptoUint32()>>>0)%PARAM_SIZES[i];
  return "#3"+paramsToNum(p).toString(16).toUpperCase().padStart(8,"0");
}
function settingsSeedString(){
  return "#3"+paramsToNum(settings).toString(16).toUpperCase().padStart(8,"0");
}
function applySeedParams(ps){
  const raw=(ps.ver===3)?(ps.n>>>0):hashMix(ps.n>>>0);
  const q=decodeParams(raw);
  for(const k of PARAM_KEYS) settings[k]=q[k];
  settings.seed=ps.n>>>0; settings.ver=ps.ver;
}

export { PARAM_KEYS, PARAM_SIZES, applySeedParams, decodeParams, hashMix, paramsToNum, parseSeed, randomSeedString, settingsSeedString };
