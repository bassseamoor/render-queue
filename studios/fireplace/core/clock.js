// Fireplace Studio — core/clock.js. See README.md for ownership and replacement boundaries.
import { S } from './state.js';
import { settings } from './settings.js';
import { cameraAt } from '../world/camera.js';
import { lifeTick } from '../world/life.js';
import { renderPasses } from '../renderer/passes.js';
import { canvas } from '../renderer/context.js';

/* Smooth deterministic fire flicker: multi-octave value noise, pure function of te */
function flickHash(n){ const s=Math.sin(n*127.1+311.7)*43758.5453; return s-Math.floor(s); }
function flickNoise(x){ const i=Math.floor(x), f=x-i, u=f*f*(3-2*f);
  return flickHash(i)*(1-u)+flickHash(i+1)*u; }
function fireFlick(te){
  const ph=S.flamePhase;
  const n=flickNoise(te*3.1+ph[0])*0.55+flickNoise(te*7.3+ph[1])*0.30+flickNoise(te*15.7+ph[2])*0.15;
  return 0.62+0.76*n;
}
let lastNow=0, liveT=0;
function rmBookkeep(RM){
  if(RM.phase==="warmup"){ RM.frame++; if(RM.frame>=RM.warmup&&RM.onPhase){ try{RM.onPhase("reset");}catch(e){} } }
  else if(RM.phase==="record"){ if(RM.onFrame){ try{RM.onFrame(RM.frame);}catch(e){} } RM.frame++; if(RM.frame>=RM.totalFrames&&RM.onPhase){ try{RM.onPhase("done");}catch(e){} } }
}
function tickFrame(te,frameNo){
  const fl=[0.6,1.0,1.5][settings.fire|0];
  S.flick=fireFlick(te)*fl;
  S.cam=cameraAt(te);
  lifeTick(te);
  renderPasses(te,frameNo);
}
function frameLoop(nowMs){
  requestAnimationFrame(frameLoop);
  const RM=window.__renderMode;
  const active=RM&&!RM.paused&&RM.phase!=="done"&&RM.phase!=="cancelled"&&RM.phase!=="reset"&&!RM._bp;
  let te,frameNo;
  if(active){
    if(canvas.width!==RM.W||canvas.height!==RM.H){ canvas.width=RM.W; canvas.height=RM.H; }
    te=RM.frame/RM.fps; frameNo=RM.frame;
  }else{
    sizeCanvas();
    const now=nowMs/1000;
    if(!lastNow) lastNow=now;
    const dt=Math.min(Math.max(now-lastNow,0),0.1); lastNow=now;
    liveT+=dt; te=liveT; frameNo=S.frame; S.frame++;
  }
  tickFrame(te,frameNo);
  if(RM) rmBookkeep(RM);
}
function sizeCanvas(){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.round(canvas.clientWidth*dpr)||Math.round(window.innerWidth*dpr);
  const h=Math.round(canvas.clientHeight*dpr)||Math.round(window.innerHeight*dpr);
  if(w&&h&&(canvas.width!==w||canvas.height!==h)){ canvas.width=w; canvas.height=h; }
}

function resetClock(){ S.frame=0; liveT=0; lastNow=0; }
let started=false;
function startLoop(){
  if(started) return;
  started=true;
  window.addEventListener("resize",sizeCanvas);
  sizeCanvas();
  requestAnimationFrame(frameLoop);
}

export { frameLoop, resetClock, sizeCanvas, startLoop, tickFrame };
