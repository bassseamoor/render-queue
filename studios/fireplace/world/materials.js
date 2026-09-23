// Fireplace Studio — world/materials.js. See README.md for ownership and replacement boundaries.
import { clamp, lerp, mulberry32, sstep } from '../core/math.js';
import { gl } from '../renderer/context.js';
import { S, TEX } from '../core/state.js';

function bakeRng(tag){ let h=2166136261; for(let i=0;i<tag.length;i++){ h^=tag.charCodeAt(i); h=Math.imul(h,16777619); } return mulberry32(h>>>0); }
/* proper Perlin-style gradient noise (deterministic, tileable-ish) */
function makeVNoise(rng){
  const perm=[...Array(256).keys()];
  for(let i=255;i>0;i--){ const j=(rng()*(i+1))|0; const t=perm[i]; perm[i]=perm[j]; perm[j]=t; }
  const p=new Uint8Array(512); for(let i=0;i<512;i++) p[i]=perm[i&255];
  const fade=t=>t*t*(3-2*t);
  function grad(h,x,y){ switch(h&15){ case 0:case 1:return x+y; case 2:case 3:return -x+y; case 4:case 5:return x-y;
    case 6:case 7:return -x-y; case 8:case 9:return x; case 10:case 11:return -x; case 12:case 13:return y; default:return -y; } }
  return function(x,y){
    const X=Math.floor(x)&255, Y=Math.floor(y)&255;
    x-=Math.floor(x); y-=Math.floor(y);
    const u=fade(x), v=fade(y);
    const aa=p[(p[X]+Y)&255], ab=p[(p[X]+Y+1)&255], ba=p[(p[X+1&255]+Y)&255], bb=p[(p[X+1&255]+Y+1)&255];
    return lerp(lerp(grad(aa,x,y),grad(ba,x-1,y),u), lerp(grad(ab,x,y-1),grad(bb,x-1,y-1),u), v)*0.7+0.5;
  };
}
function fbmFactory(nz){ return function(x,y,oct){ let s=0,a=0.5,f=1,nm=0; for(let i=0;i<oct;i++){ s+=a*nz(x*f,y*f); nm+=a; a*=0.5; f*=2.03; } return s/nm; }; }

function heightToNormal(h, size, strength){
  const out=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const xm=h[y*size+((x-1+size)%size)], xp=h[y*size+((x+1)%size)];
    const ym=h[((y-1+size)%size)*size+x], yp=h[((y+1)%size)*size+x];
    const dx=(xm-xp)*strength, dy=(ym-yp)*strength;
    const inv=1/Math.sqrt(dx*dx+dy*dy+1);
    const i=(y*size+x)*4;
    out[i]=clamp(-dx*inv*0.5+0.5,0,1)*255;
    out[i+1]=clamp(-dy*inv*0.5+0.5,0,1)*255;
    out[i+2]=clamp(inv*0.5+0.5,0,1)*255;
    out[i+3]=255;
  }
  return out;
}
let anisoExt=null, anisoMax=1;
function ensureAniso(){
  if(!anisoExt){ anisoExt=gl.getExtension("EXT_texture_filter_anisotropic");
    if(anisoExt) anisoMax=Math.min(4,gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT)); }
}
function glTex3(data,size,srgb){
  const t=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,t);
  gl.texImage2D(gl.TEXTURE_2D,0,srgb?gl.SRGB8_ALPHA8:gl.RGBA8,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);
  if(anisoExt) gl.texParameterf(gl.TEXTURE_2D,anisoExt.TEXTURE_MAX_ANISOTROPY_EXT,anisoMax);
  return t;
}
function makeTexSet(name, alb, nrm, rgh, size){
  TEX[name]={ alb:glTex3(alb,size,true), nrm:glTex3(nrm,size,false), rgh:glTex3(rgh,size,false) };
}
/* ---- stone: 512px, irregular courses, pillow faces, chipped edges, deep mortar ---- */
function bakeStone(v){
  const size=512, rng=bakeRng("stone"+v), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const cfg=[
    {base:[0.145,0.14,0.15], mort:[0.045,0.045,0.05], rows:7, var:0.10, relief:0.5},
    {base:[0.40,0.36,0.31],  mort:[0.15,0.14,0.12],  rows:6, var:0.16, relief:0.8},
    {base:[0.60,0.57,0.51],  mort:[0.33,0.31,0.27],  rows:8, var:0.08, relief:0.35},
    {base:[0.09,0.09,0.10],  mort:[0.028,0.028,0.032],rows:7, var:0.07, relief:0.4},
  ][v];
  const rows=[]; let y0=0, rn=0;
  while(y0<size-8){ /* irregular course heights */
    const rh=size/cfg.rows*(0.72+rng()*0.56);
    const off=rng()*0.95;
    const blocks=[]; let x=-off*size/cfg.rows;
    while(x<size){ /* irregular widths; per-block tone/hue/rough/chip seeds */
      const w=size/cfg.rows*(0.62+rng()*1.25);
      blocks.push([x,x+w,rng(),rng(),rng(),rng()]); x+=w;
    }
    const y1=Math.min(size,y0+rh);
    rows.push({y0,y1,blocks}); y0=y1; rn++;
    if(rn>24) break;
  }
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  const mPx=size/cfg.rows*0.075;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    let row=rows[rows.length-1]; for(const rr of rows){ if(y<rr.y1){ row=rr; break; } }
    let blk=row.blocks[row.blocks.length-1];
    for(const b of row.blocks){ if(x>=b[0]&&x<b[1]){ blk=b; break; } }
    const bw=blk[1]-blk[0], bh=row.y1-row.y0;
    const fx=clamp((x-blk[0])/Math.max(bw,1),0,1), fy=clamp((y-row.y0)/Math.max(bh,1),0,1);
    const pillow=Math.sin(Math.PI*fx)*Math.sin(Math.PI*fy); /* pillow-profiled face */
    const dEdge=Math.min(x-blk[0],blk[1]-x,y-row.y0,row.y1-y);
    const chipN=fbm(x*0.055+blk[5]*43.0, y*0.055, 3);
    const chip=sstep(0.72,0.88,chipN)*sstep(mPx*3.2,mPx*0.8,dEdge); /* chipped edges */
    const mortar=sstep(mPx*2.4,mPx*0.5,dEdge+chip*mPx*1.4); /* deeper mortar */
    const mottle=fbm(x*0.008+9.1,y*0.008,3); /* large-scale mottling */
    const det=fbm(x*0.045,y*0.045,4);
    const tone=1+(blk[2]-0.5)*cfg.var*2+(det-0.5)*0.22+(mottle-0.5)*0.30;
    const i=(y*size+x)*4;
    const m=mortar>0.5;
    const hue=1+(blk[3]-0.5)*0.14;
    const cr=m?cfg.mort[0]:cfg.base[0]*tone*hue;
    const cg=m?cfg.mort[1]:cfg.base[1]*tone;
    const cb=m?cfg.mort[2]:cfg.base[2]*tone*(2-hue);
    const shade=m?1:(0.55+0.45*pillow)*(1-mortar*0.35);
    alb[i]=clamp(cr*shade,0,1)*255; alb[i+1]=clamp(cg*shade,0,1)*255; alb[i+2]=clamp(cb*shade,0,1)*255;
    alb[i+3]=clamp(1-mortar*0.78,0,1)*255; /* stronger mortar AO */
    hgt[y*size+x]=(1-mortar)*(pillow*cfg.relief+0.25)-mortar*0.55+det*0.22;
    const rr2=clamp((m?0.95:0.80)+(blk[4]-0.5)*0.25+(det-0.5)*0.2-mortar*0.08,0.05,1);
    rgh[i]=rr2*255; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,2.6), rgh, size};
}
/* ---- wood planks: grain, knots, seams (neutral oak; tinted per use) ---- */
/* ---- wood planks: 512px, 8 planks, staggered butt joints, knots, per-plank tone ---- */
function bakeWood(){
  const size=512, rng=bakeRng("wood"), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const planks=8, ph=size/planks; /* 64px: divides evenly -> tileable in y */
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  const knots=[]; for(let k=0;k<14;k++) knots.push([rng()*size,rng()*size,4+rng()*7]);
  const pTone=[], pHue=[], joints=[];
  for(let p=0;p<planks;p++){
    pTone.push(0.86+rng()*0.28); pHue.push((rng()-0.5)*0.06);
    const jn=1+((rng()*2)|0), jj=[];
    for(let j=0;j<jn;j++) jj.push(rng()*size);
    joints.push(jj);
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const pl=Math.min(planks-1,(y/ph)|0);
    const seam=sstep(3.0,0.8,Math.min(y-pl*ph,(pl+1)*ph-y));
    let dj=1e9; for(const jx of joints[pl]){ const d=Math.abs(x-jx); if(d<dj) dj=d; }
    const bj=sstep(1.8,0.5,dj); /* recessed butt joint */
    const g=fbm(x*0.006,(y+pl*37)*0.045,4);
    const g2=fbm(x*0.025,y*0.175+pl*11,3);
    const fiber=Math.sin(x*0.11+g*9.0+pl*2.1)*0.5+0.5; /* fine grain lines */
    let tone=(0.80+g*0.40)*pTone[pl]+(fiber-0.5)*0.10+(g2-0.5)*0.14;
    let kd=1e9; for(const k of knots){ const d=Math.hypot(x-k[0],y-k[1])/k[2]; if(d<kd)kd=d; }
    const knot=sstep(1.4,0.5,kd);
    tone*=1-knot*0.45;
    const i=(y*size+x)*4;
    const sh=(1-seam*0.55)*(1-bj*0.20);
    const hue=pHue[pl];
    alb[i]=clamp((0.46+hue)*tone*sh,0,1)*255;
    alb[i+1]=clamp(0.33*tone*sh,0,1)*255;
    alb[i+2]=clamp((0.21-hue*0.5)*tone*sh,0,1)*255;
    alb[i+3]=clamp(1-seam*0.5-knot*0.2-bj*0.15,0,1)*255;
    hgt[y*size+x]=clamp((1-seam)*0.5+(1-bj)*0.25+g*0.2+fiber*0.06-knot*0.25,0,1);
    const r=clamp(0.62+(g-0.5)*0.2+seam*0.15+bj*0.1,0.05,1);
    rgh[i]=r*255; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,1.6), rgh, size};
}
/* ---- polished concrete: pores, trowel sweep ---- */
function bakeConcrete(){
  const size=256, rng=bakeRng("concrete"), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const d=fbm(x*0.02,y*0.02,4), d2=fbm(x*0.11+9,y*0.11,3);
    const pore=sstep(0.72,0.9,fbm(x*0.35,y*0.35,2))*sstep(0.4,0.2,d2);
    const tone=0.92+(d-0.5)*0.16-pore*0.5;
    const i=(y*size+x)*4;
    alb[i]=clamp(0.56*tone,0,1)*255; alb[i+1]=clamp(0.55*tone,0,1)*255; alb[i+2]=clamp(0.53*tone,0,1)*255;
    alb[i+3]=clamp(1-pore*0.35,0,1)*255;
    hgt[y*size+x]=d*0.3-pore*0.4;
    const r=clamp(0.42+(d-0.5)*0.25+pore*0.4,0.05,1);
    rgh[i]=r*255; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,1.2), rgh, size};
}
/* ---- large stone tile ---- */
function bakeTile(){
  const size=256, rng=bakeRng("tile"), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const n=2, ts=size/n;
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  const tv=[]; for(let k=0;k<n*n;k++) tv.push(0.9+rng()*0.2);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const tx=(x/ts)|0, ty=(y/ts)|0;
    const lx=x-tx*ts, ly=y-ty*ts;
    const grout=sstep(3.2,1.0,Math.min(lx,ly,ts-lx,ts-ly));
    const d=fbm(x*0.04,y*0.04,4);
    const tone=tv[ty*n+tx]*(0.9+(d-0.5)*0.2);
    const i=(y*size+x)*4;
    const sh=1-grout*0.45;
    alb[i]=clamp(0.50*tone*sh,0,1)*255; alb[i+1]=clamp(0.49*tone*sh,0,1)*255; alb[i+2]=clamp(0.47*tone*sh,0,1)*255;
    alb[i+3]=clamp(1-grout*0.6,0,1)*255;
    hgt[y*size+x]=(1-grout)*0.4+d*0.15;
    const r=clamp(0.55+(d-0.5)*0.2+grout*0.2,0.05,1);
    rgh[i]=r*255; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,1.4), rgh, size};
}
/* ---- bark: vertical ridged plates ---- */
function bakeBark(){
  const size=256, rng=bakeRng("bark"), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const r1=1-Math.abs(2*fbm(x*0.06,y*0.008,4)-1);
    const r2=1-Math.abs(2*fbm(x*0.16+7,y*0.02,3)-1);
    const ridge=Math.pow(r1*0.65+r2*0.35,1.5);
    const tone=0.55+ridge*0.7+(fbm(x*0.2,y*0.2,2)-0.5)*0.2;
    const i=(y*size+x)*4;
    alb[i]=clamp(0.30*tone,0,1)*255; alb[i+1]=clamp(0.21*tone,0,1)*255; alb[i+2]=clamp(0.14*tone,0,1)*255;
    alb[i+3]=clamp(0.45+ridge*0.55,0,1)*255;
    hgt[y*size+x]=ridge*0.9;
    rgh[i]=clamp(0.9-ridge*0.1,0.05,1)*255; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,2.4), rgh, size};
}
/* ---- rugs: 4 weaves ---- */
/* ---- rugs: 4 weaves, 512px, woven border + medallion motifs ---- */
function bakeRug(v){
  const size=512, rng=bakeRng("rug"+v), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  const pals=[
    [[0.52,0.48,0.42],[0.40,0.36,0.31]],  /* wool weave */
    [[0.55,0.47,0.33],[0.44,0.37,0.25]],  /* jute */
    [[0.48,0.44,0.40],[0.36,0.33,0.30]],  /* shag */
    [[0.45,0.38,0.30],[0.30,0.26,0.22]],  /* kilim */
  ];
  const pal=pals[v], acc=[0.60,0.42,0.26]; /* motif accent (warm rust) */
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size, w=y/size, i=(y*size+x)*4;
    /* ---- weave base (per variant) ---- */
    let mix=0, h=0.5, rough=0.95;
    if(v===0){ const wv=Math.sin(x*0.24+Math.sin(y*0.10)*1.2)*Math.sin(y*0.24+Math.sin(x*0.09)*1.2); mix=sstep(-0.45,0.45,wv); h=0.55+wv*0.15; }
    else if(v===1){ const row=Math.sin(y*0.42+fbm(x*0.03,y*0.03,2)*4); mix=sstep(-0.4,0.4,row); h=0.5+row*0.25; rough=0.9; }
    else if(v===2){ const c=fbm(x*0.045,y*0.045,4); mix=sstep(0.3,0.7,c); h=0.35+c*0.65; }
    else { const ws=Math.sin(y*0.09+fbm(x*0.02,y*0.02,2)*3.0)*0.5+0.5; /* fine weft stripes */
      mix=sstep(0.35,0.65,ws)*0.5+0.25; h=0.5; rough=0.92; }
    /* ---- large-scale woven design: guard stripes, zigzag border, medallion, corners ---- */
    const ex=Math.min(u,1-u,w,1-w);
    const guard=sstep(0.020,0.014,ex)+sstep(0.088,0.080,ex)*(1-sstep(0.104,0.096,ex));
    const bandM=sstep(0.078,0.068,ex)*(1-sstep(0.030,0.022,ex));
    const zig=sstep(0.42,0.18,Math.abs((((x*0.9+y*0.9)/34)%2+2)%2-1));
    const dia=Math.abs(u-0.5)*1.42+Math.abs(w-0.5);
    const med=sstep(0.24,0.20,dia)*(1-sstep(0.085,0.055,dia));
    const medRing=sstep(0.028,0.012,Math.abs(dia-0.155));
    const cor=sstep(0.15,0.12,Math.abs(Math.abs(u-0.5)-0.35)+Math.abs(Math.abs(w-0.5)-0.35));
    let dm=clamp(guard*0.9+bandM*(0.35+0.65*zig)+med*0.95+medRing+cor*0.8,0,1);
    if(v===2) dm*=0.45; /* shag keeps motifs subtle */
    /* ---- compose ---- */
    const det=(fbm(x*0.15,y*0.15,2)-0.5)*0.25;
    const t=clamp((1-dm)*clamp(mix+det,0,1)+dm*0.9,0,1);
    alb[i]=clamp(lerp(lerp(pal[0][0],pal[1][0],t),acc[0],dm*0.75),0,1)*255;
    alb[i+1]=clamp(lerp(lerp(pal[0][1],pal[1][1],t),acc[1],dm*0.75),0,1)*255;
    alb[i+2]=clamp(lerp(lerp(pal[0][2],pal[1][2],t),acc[2],dm*0.75),0,1)*255;
    alb[i+3]=clamp(0.75+h*0.25-dm*0.1,0,1)*255;
    hgt[y*size+x]=clamp(h*(1-dm*0.25)+dm*0.62+det*0.3,0,1);
    rgh[i]=rough*255; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,2.0), rgh, size};
}
/* ---- linen fabric ---- */
function bakeFabric(){
  const size=256, rng=bakeRng("fabric"), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const w=Math.sin(x*0.9)*0.5+Math.sin(y*0.9)*0.5;
    const d=fbm(x*0.05,y*0.05,3);
    const tone=0.94+w*0.05+(d-0.5)*0.1;
    const i=(y*size+x)*4;
    alb[i]=clamp(0.78*tone,0,1)*255; alb[i+1]=clamp(0.75*tone,0,1)*255; alb[i+2]=clamp(0.70*tone,0,1)*255;
    alb[i+3]=255;
    hgt[y*size+x]=0.5+w*0.12;
    rgh[i]=235; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,1.0), rgh, size};
}
/* ---- blackened metal (mullions, table, planter) ---- */
function bakeMetal(){
  const size=128, rng=bakeRng("metal"), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const alb=new Uint8Array(size*size*4), hgt=new Float32Array(size*size), rgh=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const brush=fbm(x*0.02,y*0.3,3);
    const tone=0.9+(brush-0.5)*0.25;
    const i=(y*size+x)*4;
    alb[i]=0.05*tone*255; alb[i+1]=0.05*tone*255; alb[i+2]=0.055*tone*255; alb[i+3]=255;
    hgt[y*size+x]=0.5;
    const r=clamp(0.38+(brush-0.5)*0.3,0.05,1);
    rgh[i]=r*255; rgh[i+1]=255; rgh[i+2]=255; rgh[i+3]=255;
  }
  return {alb, nrm:heightToNormal(hgt,size,0.6), rgh, size};
}
/* ---- mountain heightfield ---- */
function bakeMountainH(){
  const size=256, rng=bakeRng("mtn"), nz=makeVNoise(rng), fbm=fbmFactory(nz);
  const h=new Float32Array(size*size);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size, v=y/size;
    let r=1-Math.abs(2*fbm(u*7,v*3.0,6)-1);
    r=Math.pow(r,2.1);
    const p1=Math.exp(-Math.pow((u-0.30)*3.4,2)), p2=Math.exp(-Math.pow((u-0.72)*2.8,2)), p3=Math.exp(-Math.pow((u-0.52)*5.2,2));
    let hgt=r*(0.35+0.65*Math.max(p1,Math.max(p2,p3)))*(0.55+0.45*fbm(u*14,v*6,4));
    hgt*=1.0-sstep(0.78,0.98,v); /* valley carve near the lake line (v=1 = wall base) */
    h[y*size+x]=clamp(hgt,0,1);
  }
  return h;
}
function ensureBaked(st){
  const key="s"+st.stone+"r"+st.rug;
  if(S.bakedKey===key) return;
  S.bakedKey=key;
  ensureAniso();
  let b=bakeStone(st.stone); makeTexSet("stone",b.alb,b.nrm,b.rgh,b.size);
  b=bakeWood();  makeTexSet("wood",b.alb,b.nrm,b.rgh,b.size);
  b=bakeConcrete(); makeTexSet("concrete",b.alb,b.nrm,b.rgh,b.size);
  b=bakeTile();  makeTexSet("tile",b.alb,b.nrm,b.rgh,b.size);
  b=bakeBark();  makeTexSet("bark",b.alb,b.nrm,b.rgh,b.size);
  b=bakeRug(st.rug); makeTexSet("rug",b.alb,b.nrm,b.rgh,b.size);
  b=bakeFabric(); makeTexSet("fabric",b.alb,b.nrm,b.rgh,b.size);
  b=bakeMetal(); makeTexSet("metal",b.alb,b.nrm,b.rgh,b.size);
  const mh=bakeMountainH();
  const m8=new Uint8Array(256*256*4);
  for(let i=0;i<256*256;i++){ const v=clamp(Math.round(mh[i]*255),0,255); m8[i*4]=v; m8[i*4+1]=v; m8[i*4+2]=v; m8[i*4+3]=255; }
  const mt=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,mt);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,256,256,0,gl.RGBA,gl.UNSIGNED_BYTE,m8);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  TEX.mtnH=mt;
}

export { ensureBaked };
