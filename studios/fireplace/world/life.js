// Fireplace Studio — world/life.js. See README.md for ownership and replacement boundaries.
import { settings } from '../core/settings.js';
import { mulberry32 } from '../core/math.js';
import { compileProg, locCache } from '../renderer/programs.js';
import { LIFE_FS, LIFE_VS } from '../renderer/shaders/life.js';
import { gl } from '../renderer/context.js';

/* ================= DETERMINISTIC AMBIENT LIFE =================
   30 ambient outdoor "life events". Deterministic: seeded sub-stream from
   settings.seed, all motion a pure function of te. Hooked via lifeTick(te)
   in tickFrame and lifeInit(seed) in __renderReset. */
const LIFE_MAXI=96;
const LIFE_TEST=(typeof location!=="undefined"&&/[?&]lifetest=1/.test(location.search));
const LWd=()=>settings.weather|0, LTm=()=>settings.time|0;
const DAYISH=()=>LTm()<2, CLEARISH=()=>{const w=LWd();return w===0||w===1;};
function lifeSil(){ return LTm()===2?[0.015,0.015,0.022]:LTm()===1?[0.10,0.075,0.08]:[0.11,0.12,0.15]; }
const LIFE_DEFS=[
 {n:"songbird_flock", iv:[25,60],  dur:26, max:2, g:()=>DAYISH()&&CLEARISH()},
 {n:"goose_formation", iv:[60,140], dur:40, max:1, g:()=>LTm()===0&&LWd()===0},
 {n:"eagle_soar",      iv:[45,110], dur:45, max:1, g:()=>LTm()===0&&CLEARISH()},
 {n:"hawk_circle",     iv:[40,100], dur:35, max:1, g:()=>LTm()===0&&CLEARISH()},
 {n:"swallow_swoops",  iv:[20,50],  dur:24, max:2, g:()=>LTm()===0&&LWd()===0},
 {n:"bat_flight",      iv:[15,40],  dur:20, max:3, g:()=>LTm()===1},
 {n:"heron_stand",     iv:[50,120], dur:70, max:1, g:()=>DAYISH()&&LWd()!==2&&LWd()!==3},
 {n:"duck_land",       iv:[45,100], dur:60, max:2, g:()=>DAYISH()&&CLEARISH()},
 {n:"loon_pair",       iv:[60,130], dur:55, max:1, g:()=>DAYISH()&&CLEARISH()},
 {n:"cormorant_dive",  iv:[50,110], dur:40, max:1, g:()=>DAYISH()&&CLEARISH()},
 {n:"fish_jump",       iv:[12,35],  dur:3.2,max:3, g:()=>DAYISH()&&LWd()!==2&&LWd()!==3},
 {n:"trout_rise",      iv:[8,25],   dur:4,  max:4, g:()=>DAYISH()&&LWd()!==2},
 {n:"frog_plip",       iv:[20,55],  dur:2.5,max:2, g:()=>LTm()===0&&LWd()===0},
 {n:"beaver_swim",     iv:[70,150], dur:45, max:1, g:()=>DAYISH()&&CLEARISH()},
 {n:"deer_drink",      iv:[80,160], dur:55, max:2, g:()=>DAYISH()&&LWd()!==2&&LWd()!==3},
 {n:"owl_perch",       iv:[40,90],  dur:60, max:1, g:()=>LTm()===2},
 {n:"fireflies",       iv:[20,40],  dur:45, max:3, g:()=>LTm()===2&&LWd()!==2&&LWd()!==3},
 {n:"shooting_star",   iv:[25,70],  dur:1.6,max:2, g:()=>LTm()===2&&LWd()===0},
 {n:"butterfly",       iv:[15,40],  dur:30, max:3, g:()=>LTm()===0&&LWd()===0},
 {n:"dragonfly",       iv:[18,45],  dur:25, max:3, g:()=>LTm()===0&&CLEARISH()},
 {n:"water_strider",   iv:[25,60],  dur:30, max:2, g:()=>LTm()===0&&LWd()===0},
 {n:"falling_leaves",  iv:[20,50],  dur:26, max:3, g:()=>DAYISH()&&CLEARISH()},
 {n:"mist_wisps",      iv:[15,35],  dur:40, max:4, g:()=>LWd()===4||(LTm()===0&&LWd()===0)},
 {n:"rain_rings",      iv:[2,6],    dur:3,  max:6, g:()=>LWd()===2},
 {n:"cloud_drift",     iv:[30,70],  dur:90, max:3, g:()=>LTm()===0&&CLEARISH()},
 {n:"wind_gust",       iv:[18,45],  dur:6,  max:3, g:()=>DAYISH()&&LWd()!==2&&LWd()!==3},
 {n:"reed_sway",       iv:[100,120],dur:120,max:2, g:()=>true},
 {n:"cattail_sway",    iv:[100,120],dur:120,max:2, g:()=>true},
 {n:"waterfall",       iv:[90,180], dur:50, max:1, g:()=>DAYISH()&&CLEARISH()},
 {n:"kingfisher_dart", iv:[35,90],  dur:6,  max:1, g:()=>LTm()===0&&LWd()===0},
];
let lifeR=null, lifeSeedInit=-1, lifeLastTe=-1;
let lifeNext=new Float64Array(30), lifeEvts=[];
const lifeBuf=new Float32Array(LIFE_MAXI*12);
let lifeVAO=null, lifeVBO=null, lifeProg=null, lifeLoc=null;
function lifeInit(seed){
  lifeR=mulberry32(((seed>>>0)^0x11FE5)>>>0);
  lifeSeedInit=seed>>>0; lifeLastTe=-1; lifeEvts=[];
  const sc=LIFE_TEST?0.02:1;
  for(let i=0;i<30;i++){ const d=LIFE_DEFS[i]; lifeNext[i]=4+lifeR()*(d.iv[0]*sc); }
}
function lifeActive(k){ let n=0; for(const e of lifeEvts) if(e.k===k) n++; return n; }
function lifeSpawnParams(k){
  const s1=lifeR(),s2=lifeR(),s3=lifeR(),s4=lifeR();
  return {s1,s2,s3,s4};
}
function lifeTick(te){
  if(lifeSeedInit!==(settings.seed>>>0)||(lifeLastTe>=0&&te<lifeLastTe-1)) lifeInit(settings.seed);
  lifeLastTe=te;
  const sc=LIFE_TEST?0.02:1;
  for(let k=0;k<30;k++){
    if(te>=lifeNext[k]){
      const d=LIFE_DEFS[k];
      if(d.g()&&lifeActive(k)<d.max){
        const p=lifeSpawnParams(k);
        const col=lifeSil();
        lifeEvts.push({k,t0:te,dur:d.dur,p,c:col});
        if(window.__lifeLog||LIFE_TEST) console.log("[life] spawn",d.n,"t="+te.toFixed(1));
      }
      lifeNext[k]=te+(d.iv[0]+lifeR()*(d.iv[1]-d.iv[0]))*sc;
    }
  }
  // Despawn only — sprite emission happens solely in lifeDraw().
  for(let i=lifeEvts.length-1;i>=0;i--){
    const e=lifeEvts[i], age=te-e.t0;
    if(age<0||age>e.dur) lifeEvts.splice(i,1);
  }
}
function lifeSpr(ni,x,y,z,size,type,phase,alpha,aux,r,g,b,anchor){
  if(ni>=LIFE_MAXI) return ni;
  const o=ni*12;
  lifeBuf[o]=x;lifeBuf[o+1]=y;lifeBuf[o+2]=z;lifeBuf[o+3]=size;
  lifeBuf[o+4]=type;lifeBuf[o+5]=phase;lifeBuf[o+6]=alpha;lifeBuf[o+7]=aux;
  lifeBuf[o+8]=r;lifeBuf[o+9]=g;lifeBuf[o+10]=b;lifeBuf[o+11]=anchor?1:0;
  return ni+1;
}
const lifeLerp=(a,b,t)=>a+(b-a)*t;
function lifeEmit(e,te,ni){
  const k=e.k, p=e.p, c=e.c, a01=(te-e.t0)/e.dur, dir=p.s1>0.5?1:-1;
  const YW=-0.38;
  switch(k){
  case 0:{ const y=14+p.s2*9, z=26+p.s3*22, x=lifeLerp(-70*dir,70*dir,a01), n=5+Math.floor(p.s4*4);
    for(let i=0;i<n;i++) ni=lifeSpr(ni,x-dir*i*1.7,y+(i%2)*0.9-i*0.12,z+(i%3)*1.4,0.95,0,te*1.0+i*0.7,0.85,0,c[0],c[1],c[2],0);
    return n; }
  case 1:{ const y=19, z=40+p.s2*15, x=lifeLerp(-75*dir,75*dir,a01);
    for(let i=0;i<7;i++){ const side=i===0?0:(i%2?1:-1), row=Math.ceil(i/2);
      ni=lifeSpr(ni,x-dir*row*2.4,y-row*0.25,z+side*row*2.0,1.5,0,te*0.8+i,0.9,0,c[0],c[1],c[2],0); }
    return 7; }
  case 2:{ const cx=-20+p.s2*40, an=a01*Math.PI*2*dir+p.s3*6;
    ni=lifeSpr(ni,cx+Math.cos(an)*14,20+Math.sin(a01*9+p.s1*5)*1.6,46+Math.sin(an)*14,2.3,1,te*0.35,0.9,0,0.16,0.11,0.08,0);
    return 1; }
  case 3:{ const cx=-15+p.s2*30, an=a01*Math.PI*4*dir+p.s3*6;
    ni=lifeSpr(ni,cx+Math.cos(an)*8,15+Math.sin(a01*7)*1.2,38+Math.sin(an)*8,1.4,1,te*0.5,0.9,0,c[0],c[1],c[2],0);
    return 1; }
  case 4:{ const cx=-4+p.s2*8;
    for(let i=0;i<3;i++){ const q=(a01+i*0.13)%1;
      ni=lifeSpr(ni,cx+Math.sin(q*20+p.s1*9+i*2)*3,2.6+Math.sin(q*31+i)*1.2,6+Math.cos(q*17)*2.2,0.5,2,te*1.4+i*2.1,0.85,0,c[0],c[1],c[2],0); }
    return 3; }
  case 5:{ const x=lifeLerp(-32*dir,32*dir,a01)+Math.sin(a01*40+p.s1*9)*4;
    ni=lifeSpr(ni,x,6.5+p.s2*4+Math.sin(a01*23)*1.5,16+p.s3*14,0.55,3,te*1.6,0.85,0,0.02,0.02,0.03,0);
    ni=lifeSpr(ni,x-dir*3+Math.sin(a01*30)*3,7.5+p.s4*3,18+p.s2*10,0.5,3,te*1.6+2,0.8,0,0.02,0.02,0.03,0);
    return 2; }
  case 6:{ const hx=-30+p.s1*60, strike=Math.max(0,1-Math.abs(a01-(0.3+p.s2*0.4))/0.035);
    ni=lifeSpr(ni,hx,YW+0.62,10.6,1.15,4,te*0.5,0.92,strike,c[0],c[1],c[2],0);
    return 1; }
  case 7:{ const x0=-40+p.s1*80, x1=-30+p.s2*60, xl=lifeLerp(x0,x1,Math.min(a01/0.3,1));
    const y=a01<0.3?lifeLerp(7,0.1,a01/0.3):-0.15, z=a01<0.3?lifeLerp(58,26,a01/0.3):26+(a01-0.3)*10*dir*0.2;
    for(let i=0;i<3;i++) ni=lifeSpr(ni,xl-i*1.1*dir,y,z+i*0.8,0.55,5,te*0.4+i,0.9,0,0.20,0.16,0.12,0);
    let n2=3;
    if(a01>0.3&&a01<0.5){ ni=lifeSpr(ni,x1,YW+0.02,26,1.6,7,(a01-0.3)/0.2,0.55,0,0.7,0.8,0.85,0); n2++; }
    return n2; }
  case 8:{ const x=lifeLerp(-42*dir,42*dir,a01), dive=(a01>0.45&&a01<0.62);
    const y=dive?-1.3:-0.18, z=20+p.s2*6;
    if(!dive){ for(let i=0;i<2;i++) ni=lifeSpr(ni,x-i*1.4*dir,y,z+i*0.5,0.6,27,te*0.4+i*3,0.9,0,0.05,0.05,0.06,0); }
    else { ni=lifeSpr(ni,x,YW+0.02,z,1.8,7,(a01-0.45)/0.17,0.5,0,0.7,0.8,0.85,0); return 1; }
    return 2; }
  case 9:{ const x=lifeLerp(-35*dir,35*dir,a01), dive=(a01>0.5&&a01<0.66), z=16+p.s2*5;
    if(!dive) ni=lifeSpr(ni,x,-0.18,z,0.55,5,te*0.4,0.9,0,0.04,0.04,0.05,0);
    else { ni=lifeSpr(ni,x,YW+0.02,z,1.5,7,(a01-0.5)/0.16,0.5,0,0.7,0.8,0.85,0); }
    return 1; }
  case 10:{ const fx=-40+p.s1*80, fz=15+p.s2*35, cyc=Math.min(a01/0.85,1);
    if(cyc<1){ const y=YW+4*cyc*(1-cyc)*1.7;
      ni=lifeSpr(ni,fx+dir*cyc*2,y,fz,0.5,6,cyc,0.95,0,0.15,0.16,0.18,0); }
    if(a01>0.8){ const q=(a01-0.8)/0.2;
      ni=lifeSpr(ni,fx+dir*2,YW+0.05,fz,0.7,8,q,0.7,0,0.8,0.88,0.9,0);
      ni=lifeSpr(ni,fx+dir*2,YW+0.02,fz,2.2,7,q,0.5,0,0.7,0.8,0.85,0); return 3; }
    return 1; }
  case 11:{ const x=-45+p.s1*90, z=13+p.s2*40;
    ni=lifeSpr(ni,x,YW+0.02,z,1.7,7,a01,0.5,0,0.7,0.8,0.85,0);
    if(p.s3>0.6) ni=lifeSpr(ni,x+0.4,YW+0.15,z,0.3,6,a01,0.8,0,0.15,0.16,0.18,0);
    return p.s3>0.6?2:1; }
  case 12:{ const x=-20+p.s1*40, x2=x+1.2*dir, l=Math.min(a01/0.5,1);
    if(l<1) ni=lifeSpr(ni,lifeLerp(x,x2,l),lifeLerp(0.1,YW+0.05,l)-4*l*(1-l)*0.5,lifeLerp(10.2,11.6,l),0.28,6,l,0.9,0,0.12,0.14,0.10,0);
    else ni=lifeSpr(ni,x2,YW+0.02,11.6,0.8,7,(a01-0.5)/0.5,0.45,0,0.7,0.8,0.85,0);
    return 1; }
  case 13:{ const x=lifeLerp(-45*dir,45*dir,a01), z=14+p.s2*4;
    ni=lifeSpr(ni,x,YW+0.05,z,0.7,25,te*0.5,0.92,0,0.14,0.10,0.07,0);
    ni=lifeSpr(ni,x-dir*1.2,YW+0.03,z,1.4,26,a01,0.5,0,0.65,0.72,0.75,0);
    return 2; }
  case 14:{ const dx=-32+p.s1*64, bob=0.5+0.5*Math.sin(a01*e.dur*1.1+p.s2*6);
    ni=lifeSpr(ni,dx,YW+0.85,10.9,1.5,9,te*0.6,0.95,bob,c[0],c[1],c[2],0);
    return 1; }
  case 15:{ const ox=-25+p.s1*50;
    ni=lifeSpr(ni,ox,YW,12.0,1.5,28,0,0.95,0,0,0,0,1);
    ni=lifeSpr(ni,ox,YW+2.05,12.0,0.7,10,te*0.5,0.95,Math.sin(a01*12.6)*0.5,0.03,0.03,0.04,0);
    return 2; }
  case 16:{ const cx=-20+p.s1*40, cz=10+p.s2*3; let n=0;
    for(let i=0;i<8;i++){ const px=cx+Math.sin(te*0.7+i*2.4+p.s3*6)*2.2, py=0.8+Math.sin(te*0.9+i*1.7)*0.5, pz=cz+Math.cos(te*0.6+i*3.1)*1.6;
      ni=lifeSpr(ni,px,py,pz,0.13,11,te*3.1+i*1.3,0.85,0,0,0,0,0); n++; }
    return n; }
  case 17:{ const sx=-60+p.s1*120, x=lifeLerp(sx,sx+30*dir,a01), y=lifeLerp(46,34,a01), z=150;
    ni=lifeSpr(ni,x,y,z,3.2,12,a01,1-a01,0,0,0,0,0);
    return 1; }
  case 18:{ const bx=-4+p.s1*8;
    for(let i=0;i<2;i++){ const q=(a01+i*0.4)%1;
      ni=lifeSpr(ni,bx+Math.sin(q*12+p.s2*9+i*3)*1.6,1.2+Math.sin(q*17+i*2)*0.5,7+Math.cos(q*9)*1.5,0.28,13,te*2.2+i*4,0.9,0,
        0.85,0.55+p.s3*0.2,0.25,0); }
    return 2; }
  case 19:{ const x=lifeLerp(-25*dir,25*dir,a01)+Math.sin(a01*50+p.s1*9)*3;
    ni=lifeSpr(ni,x,0.55+Math.sin(a01*37)*0.4,12+p.s2*6,0.3,14,te*3.0,0.85,0,0.12,0.16,0.30,0);
    return 1; }
  case 20:{ const sx=-15+p.s1*30; let n=0;
    for(let i=0;i<4;i++){ const px=sx+Math.sin(te*1.3+i*2.1+p.s2*6)*1.2+i*0.5, pz=11.3+Math.cos(te*1.1+i*1.4)*0.5;
      ni=lifeSpr(ni,px,YW+0.06,pz,0.18,15,te*2.0+i,0.8,(te*0.5+i*0.37)%1,c[0],c[1],c[2],0); n++; }
    return n; }
  case 21:{ let n=0;
    for(let i=0;i<6;i++){ const lx=-50+p.s1*100+i*4, lz=16+p.s2*24, land=0.55+p.s3*0.2, q=Math.min(a01/land,1);
      const y=lifeLerp(8,YW,q)-Math.sin(q*Math.PI)*0.4, x=lx+Math.sin(te*2+i*2.3)*1.6*q;
      const tumble=te*(1.5+i*0.2)+i*2.0;
      const cc=[[0.75,0.45,0.2],[0.7,0.6,0.25],[0.55,0.3,0.15]][i%3];
      ni=lifeSpr(ni,x,Math.max(y,YW+0.02),lz,0.24,16,tumble,0.92,0,cc[0],cc[1],cc[2],0); n++;
      if(a01>land&&a01<land+0.12){ ni=lifeSpr(ni,lx,YW+0.02,lz,0.9,7,(a01-land)/0.12,0.4,0,0.7,0.8,0.85,0); n++; } }
    return n; }
  case 22:{ let n=0;
    for(let i=0;i<3;i++){ const x=lifeLerp(-52,52,(a01*0.7+p.s1*0.3+i*0.33)%1);
      ni=lifeSpr(ni,x,0.9+p.s2*0.8,18+i*11+p.s3*4,5.5,17,te*0.3+i*2.0,0.11,0,0.82,0.86,0.90,0); n++; }
    return n; }
  case 23:{ let n=0;
    for(let i=0;i<5;i++){ const hx=-0.5+((p.s1*7+i*2.61)%1), hz=12+((p.s2*9+i*3.77)%1)*44, q=(a01*2.2+hx+hz*0.01)%1;
      ni=lifeSpr(ni,-50+hx*100,YW+0.02,hz,1.1,18,q,0.5,0,0.75,0.82,0.88,0); n++; }
    return n; }
  case 24:{ const x=lifeLerp(-90,90,a01*0.6)+p.s1*40-20;
    ni=lifeSpr(ni,x,44+p.s2*16,185,42,19,te*0.05,0.42,0,0.92,0.94,0.97,0);
    ni=lifeSpr(ni,x*0.5-30,52+p.s3*10,200,30,19,te*0.05+3,0.35,0,0.88,0.90,0.94,0);
    return 2; }
  case 25:{ let n=0;
    for(let i=0;i<4;i++){ const q=(a01*1.4+i*0.25)%1, x=lifeLerp(-60,60,q);
      ni=lifeSpr(ni,x,YW+0.04,14+i*9+p.s2*6,4.5,20,te*0.8+i,0.13,0,0.75,0.80,0.85,0); n++; }
    return n; }
  case 26:{ const rx=-24+p.s1*48; let n=0;
    for(let i=0;i<5;i++) ni=lifeSpr(ni,rx+i*0.7-1.4,YW,10.0+p.s2*0.8,1.7,21,te*0.4+i*1.7,0.95,0,0,0,0,1),n++;
    return n; }
  case 27:{ const rx=-20+p.s1*40; let n=0;
    for(let i=0;i<4;i++) ni=lifeSpr(ni,rx+i*0.9-1.3,YW,10.3+p.s3*0.6,1.9,22,te*0.4+i*2.3,0.95,0,0,0,0,1),n++;
    return n; }
  case 28:{ ni=lifeSpr(ni,-25,8.5,71.4,7.5,23,te*1.2,0.5,0,0,0,0,0);
    ni=lifeSpr(ni,-25,0.6,70.6,3.2,17,te*0.5,0.20,0,0.85,0.89,0.92,0);
    return 2; }
  default:{ const kx=-30+p.s1*60, dv=Math.min(a01/0.6,1);
    const x=lifeLerp(kx,kx+5*dir,dv), y=lifeLerp(3.2,YW+0.1,dv)-Math.sin(dv*Math.PI)*0.8, z=lifeLerp(26,19,dv);
    ni=lifeSpr(ni,x,Math.max(y,YW+0.1),z,0.35,24,te*2.4,0.95,0,0,0,0,0);
    if(a01>0.6&&a01<0.75){ ni=lifeSpr(ni,kx+5*dir,YW+0.02,19,0.9,7,(a01-0.6)/0.15,0.5,0,0.7,0.8,0.85,0); return 2; }
    return 1; }
  }
}
function lifeDraw(view,proj,te){
  if(!lifeProg){
    lifeProg=compileProg(LIFE_VS,LIFE_FS,"life");
    lifeLoc=locCache(lifeProg);
    const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
    const qb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,qb);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    lifeVBO=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,lifeVBO);
    gl.bufferData(gl.ARRAY_BUFFER,lifeBuf.byteLength,gl.DYNAMIC_DRAW);
    for(let a=1;a<=3;a++){ gl.enableVertexAttribArray(a);
      gl.vertexAttribPointer(a,4,gl.FLOAT,false,48,(a-1)*16); gl.vertexAttribDivisor(a,1); }
    gl.bindVertexArray(null); lifeVAO=vao;
  }
  let ni=0;
  for(let i=lifeEvts.length-1;i>=0;i--){
    const e=lifeEvts[i], age=te-e.t0;
    if(age<0||age>e.dur) continue;
    ni+=lifeEmit(e,te,ni);
    if(ni>=LIFE_MAXI-4) break;
  }
  if(!ni) return;
  const LU3=lifeLoc;
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.useProgram(lifeProg);
  gl.uniformMatrix4fv(LU3("uProj"),false,proj);
  gl.uniformMatrix4fv(LU3("uView"),false,view);
  gl.uniform1f(LU3("uTime"),te);
  gl.bindVertexArray(lifeVAO);
  gl.bindBuffer(gl.ARRAY_BUFFER,lifeVBO);
  gl.bufferSubData(gl.ARRAY_BUFFER,0,lifeBuf.subarray(0,ni*12));
  gl.drawArraysInstanced(gl.TRIANGLE_STRIP,0,4,ni);
  gl.bindVertexArray(null);
  gl.depthMask(true); gl.disable(gl.BLEND);
}
const getLifeDebug=function(){ return {active:lifeEvts.length, te:lifeLastTe, defs:LIFE_DEFS.map(function(d){return d.n;})}; };
const getLifeHash=function(){ let h=0; for(let i=0;i<lifeBuf.length;i++){ const v=(lifeBuf[i]*4096)|0; h=((h*31)^v)|0; } return (h>>>0).toString(16)+"/"+lifeEvts.length; };

export { getLifeDebug, getLifeHash, lifeDraw, lifeInit, lifeTick };
