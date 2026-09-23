// Fireplace Studio — world/surface-detail.js. See README.md for ownership and replacement boundaries.
import { gl } from '../renderer/context.js';
import { mulberry32 } from '../core/math.js';
import { S } from '../core/state.js';
import { IU, detProg } from '../renderer/programs.js';

let shagVAO=null, shagCount=0, nubVAO=null, nubCount=0;
let shagBufs=[], nubBufs=[];
function detFreeVAO(vao, bufs){
  if(vao) gl.deleteVertexArray(vao);
  for(const b of bufs) gl.deleteBuffer(b);
}
function detBuild(n, fill, withP2, withP3){
  const quad=new Float32Array([-0.5,-0.5, 0.5,-0.5, -0.5,0.5, -0.5,0.5, 0.5,-0.5, 0.5,0.5]);
  const base=new Float32Array(n*3), p0=new Float32Array(n*4), p1=new Float32Array(n*4);
  const p2=withP2?new Float32Array(n*4):null;
  const p3=withP3?new Float32Array(n*4):null;
  for(let i=0;i<n;i++) fill(i, base, p0, p1, p2, p3);
  const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
  const bufs=[];
  function attr(loc, arr, size, divisor){
    const b=gl.createBuffer(); bufs.push(b);
    gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,arr,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,0,0);
    gl.vertexAttribDivisor(loc,divisor);
  }
  attr(0,quad,2,0); attr(1,base,3,1); attr(2,p0,4,1); attr(3,p1,4,1);
  if(p2) attr(4,p2,4,1);
  if(p3) attr(5,p3,4,1);
  gl.bindVertexArray(null);
  return {vao,bufs};
}
function buildShagNubs(st){
  detFreeVAO(shagVAO,shagBufs); detFreeVAO(nubVAO,nubBufs);
  shagVAO=null; nubVAO=null; shagBufs=[]; nubBufs=[];
  const rng=mulberry32((st.seed^0x51ab)>>>0);
  /* shag rug strands: fluffy pom-pom tufts on a jittered clump grid —
     fibers radiate outward from each tuft center with curl, S-wiggle and
     tip droop; deep shadowed valleys between tufts; per-tuft wave lean so
     neighboring tufts don't look stamped; soft fringe edge */
  const counts=[8000,8500,14000,7000];
  const n=counts[st.rug|0]||6500;
  const cw=0.45, cl=[];
  for(let gx=-2.45; gx<1.85; gx+=cw) for(let gz=-0.4; gz<2.6; gz+=cw)
    cl.push([gx+cw*0.5+(rng()-0.5)*cw*0.6, gz+cw*0.5+(rng()-0.5)*cw*0.6,
             0.72+rng()*0.60, rng()*Math.PI*2]);
    /* cx, cz, heightMul, wavePhase */
  const r=detBuild(n,(i,base,p0,p1,p2,p3)=>{
    let x=-0.3+(rng()-0.5)*4.3, z=1.1+(rng()-0.5)*3.0, c=null;
    if(rng()<0.90){ /* most strands snap toward a tuft center -> pom-poms */
      c=cl[(rng()*cl.length)|0];
      const pull=0.60+rng()*0.35;
      x+=(c[0]-x)*pull; z+=(c[1]-z)*pull;
    }
    const dxe=Math.min(x+2.45,1.85-x), dze=Math.min(z+0.4,2.6-z), de=Math.min(dxe,dze);
    const fr=de<0.38 ? 1-de/0.38 : 0; /* fringe band at the rug border */
    base[i*3]=x; base[i*3+1]=0.065; base[i*3+2]=z;
    let la, lean, hMul, wMul, toneMul, cdX, cdZ, cAmp, cPh;
    if(c){
      let rx=x-c[0], rz=z-c[1];
      const rd=Math.hypot(rx,rz), rmax=cw*0.80, vn=Math.min(rd/rmax,1);
      const vsh=vn*vn*(3-2*vn); /* 0 at tuft center -> 1 at cell border */
      hMul=(1.0-0.85*vsh)*c[2]; /* carve deep valleys between tufts */
      wMul=1.0-0.35*vsh;
      toneMul=1.0-0.50*vsh; /* shadowed valleys */
      if(rd<1e-4){ rx=1; rz=0; }
      const ra=Math.atan2(rz,rx);
      const wave=Math.sin(c[0]*5.3+c[1]*3.7+c[3]); /* per-tuft wave lean */
      la=ra+(rng()-0.5)*0.55+wave*0.55; /* radial pom-pom + jitter + tuft wave */
      lean=(0.015+vn*0.075)*(0.70+rng()*0.60); /* edge fibers lean outward */
      cdX=Math.cos(la); cdZ=Math.sin(la); /* curl follows the radial flow */
      cAmp=0.50+rng()*0.50;
      cPh=c[3]+rng()*0.8; /* per-tuft phase coherence */
    }else{
      /* un-snapped: short dark underlayer so no backing shows through */
      hMul=0.30; wMul=1.0; toneMul=0.50;
      la=rng()*Math.PI*2; lean=0.004+rng()*0.008;
      cdX=Math.cos(la); cdZ=Math.sin(la);
      cAmp=0.40+rng()*0.40; cPh=rng()*Math.PI*2;
    }
    let hgt=(0.030+rng()*0.032)*hMul; /* shorter fibers that flop instead of spike */
    if(fr>0){ /* fringe: longer strands leaning outward, soft wavy silhouette */
      const ox=dxe<dze?(x<-0.3?-1:1):0, oz=dxe<dze?0:(z<1.1?-1:1);
      la=Math.atan2(oz,ox)+(rng()-0.5)*0.9;
      lean+=fr*(0.020+rng()*0.022);
      hgt*=1.0+fr*0.7;
    }
    p0[i*4]=Math.cos(la)*lean; p0[i*4+1]=Math.sin(la)*lean;
    p0[i*4+2]=hgt; p0[i*4+3]=(0.008+rng()*0.007)*wMul; /* wider, softer ribbons: no needles */
    p2[i*4]=cdX; p2[i*4+1]=cdZ;
    p2[i*4+2]=cAmp*hgt*(1+fr*0.3); p2[i*4+3]=cPh;
    p3[i*4]=1.0; p3[i*4+1]=1.0; p3[i*4+2]=0; p3[i*4+3]=0; /* fur shading: AO + sheen */
    const tv=(0.72+rng()*0.56)*toneMul, tw=0.90+rng()*0.20;
    const hj=(rng()-0.5)*2; /* subtle per-strand hue jitter: warm/cool shift */
    p1[i*4]=rng()*Math.PI*2;
    p1[i*4+1]=0.55*tv*tw*(1+hj*0.05); p1[i*4+2]=0.50*tv*tw*(1-hj*0.02); p1[i*4+3]=0.44*tv*(1-hj*0.045);
  },true,true);
  shagVAO=r.vao; shagBufs=r.bufs; shagCount=n; S.shagN=n;
  /* couch micro-tufts: mattress + two fabric seats, 8-14mm tall */
  const spots=[
    {x:-2.3,y:0.535,z:2.75,sx:2.5,sz:1.03,n:380},
    {x:1.15,y:0.27,z:1.9,sx:0.62,sz:0.62,n:130},
    {x:0.45,y:0.25,z:2.30,sx:0.56,sz:0.56,n:110},
  ];
  let total=0; for(const s of spots) total+=s.n;
  const r2=detBuild(total,(i,base,p0,p1)=>{
    let k=i, sp=spots[0];
    for(const s of spots){ if(k<s.n){ sp=s; break; } k-=s.n; }
    const x=sp.x+(rng()-0.5)*sp.sx, z=sp.z+(rng()-0.5)*sp.sz;
    base[i*3]=x; base[i*3+1]=sp.y; base[i*3+2]=z;
    const la=rng()*Math.PI*2, lean=0.002+rng()*0.006;
    p0[i*4]=Math.cos(la)*lean; p0[i*4+1]=Math.sin(la)*lean;
    p0[i*4+2]=0.008+rng()*0.006; p0[i*4+3]=0.004+rng()*0.004;
    const tv=0.75+rng()*0.5;
    p1[i*4]=rng()*Math.PI*2;
    p1[i*4+1]=0.72*tv; p1[i*4+2]=0.68*tv; p1[i*4+3]=0.62*tv;
  });
  nubVAO=r2.vao; nubBufs=r2.bufs; nubCount=total; S.nubN=total;
}
function drawInstDetail(view, proj, te){
  if(!shagVAO&&!nubVAO) return;
  gl.useProgram(detProg);
  gl.uniformMatrix4fv(IU("uView"),false,view);
  gl.uniformMatrix4fv(IU("uProj"),false,proj);
  gl.uniform3fv(IU("uCamPos"),S.cam.eye);
  gl.uniform3fv(IU("uFirePos"),S.firePos);
  gl.uniform1f(IU("uFlick"),S.flick);
  gl.uniform3fv(IU("uFireCol"),S.fireCol);
  gl.uniform1f(IU("uFireI"),S.rig.fireI*2.0);
  gl.uniform3fv(IU("uAmbTint"),S.rig.amb);
  gl.uniform3fv(IU("uSunDir"),S.rig.sunDir);
  gl.uniform3fv(IU("uSunCol"),S.rig.sunCol);
  gl.uniform1f(IU("uSunI"),S.rig.sunI);
  gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
  if(shagVAO){ gl.bindVertexArray(shagVAO); gl.drawArraysInstanced(gl.TRIANGLES,0,6,shagCount); }
  if(nubVAO){ gl.bindVertexArray(nubVAO); gl.drawArraysInstanced(gl.TRIANGLES,0,6,nubCount); }
  gl.bindVertexArray(null);
}

export { buildShagNubs, drawInstDetail };
