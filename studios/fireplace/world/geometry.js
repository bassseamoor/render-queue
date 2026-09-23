// Fireplace Studio — world/geometry.js. See README.md for ownership and replacement boundaries.
import { clamp } from '../core/math.js';
import { gl } from '../renderer/context.js';

function geoPlane(w,h,sx,sz){
  const pos=[],nrm=[],uv=[],idx=[];
  for(let j=0;j<=sz;j++)for(let i=0;i<=sx;i++){
    const x=(i/sx-0.5)*w, z=(j/sz-0.5)*h;
    pos.push(x,0,z); nrm.push(0,1,0); uv.push(i/sx,j/sz);
  }
  for(let j=0;j<sz;j++)for(let i=0;i<sx;i++){
    const a=j*(sx+1)+i, b=a+1, c=a+sx+1, d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  return {pos,nrm,uv,idx};
}
/* vertical wall plane (faces +z), y in [0,1], subdivided */
function geoWall(w,h,sx,sy){
  const g=geoPlane(w,h,sx,sy);
  for(let i=0;i<g.pos.length;i+=3){ const z=g.pos[i+2]; g.pos[i+1]=-z+0.5; g.pos[i+2]=0; }
  for(let i=0;i<g.nrm.length;i+=3){ g.nrm[i]=0; g.nrm[i+1]=0; g.nrm[i+2]=1; }
  for(let i=0;i<g.idx.length;i+=3){ const t=g.idx[i+1]; g.idx[i+1]=g.idx[i+2]; g.idx[i+2]=t; }
  return g;
}
function geoBox(){
  /* 24-vert box, proper face normals/uvs, unit cube centered at origin */
  const pos=[],nrm=[],uv=[],idx=[];
  const corners=[[-0.5,-0.5,-0.5],[0.5,-0.5,-0.5],[0.5,0.5,-0.5],[-0.5,0.5,-0.5],
                 [-0.5,-0.5,0.5],[0.5,-0.5,0.5],[0.5,0.5,0.5],[-0.5,0.5,0.5]];
  const faces=[[4,5,6,7],[1,0,3,2],[0,4,7,3],[5,1,2,6],[7,6,2,3],[0,1,5,4]]; /* +z,-z,-x,+x,+y,-y */
  const norms=[[0,0,1],[0,0,-1],[-1,0,0],[1,0,0],[0,1,0],[0,-1,0]];
  for(let f=0;f<6;f++){
    const base=pos.length/3;
    for(let k=0;k<4;k++){ const c=corners[faces[f][k]]; pos.push(c[0],c[1],c[2]); nrm.push(...norms[f]); uv.push(k===0||k===3?0:1, k<2?0:1); }
    idx.push(base,base+1,base+2, base,base+2,base+3);
  }
  return {pos,nrm,uv,idx};
}
function geoRBox(r,seg){
  /* true rounded box: per-face grids projected onto the rounded surface,
     analytic normals. Gives genuinely soft highlights on furniture edges. */
  r=clamp(r||0.06,0.004,0.24); seg=seg||3;
  const pos=[],nrm=[],uv=[],idx=[];
  const faces=[
    {n:[0,0,1], u:[1,0,0], v:[0,1,0]},
    {n:[0,0,-1],u:[-1,0,0],v:[0,1,0]},
    {n:[1,0,0], u:[0,0,-1],v:[0,1,0]},
    {n:[-1,0,0],u:[0,0,1], v:[0,1,0]},
    {n:[0,1,0], u:[1,0,0], v:[0,0,-1]},
    {n:[0,-1,0],u:[1,0,0], v:[0,0,1]}
  ];
  const inner=0.5-r;
  for(const f of faces){
    const base=pos.length/3;
    for(let j=0;j<=seg;j++)for(let i=0;i<=seg;i++){
      const a=i/seg-0.5, b=j/seg-0.5;
      const px=f.n[0]*0.5+f.u[0]*a+f.v[0]*b;
      const py=f.n[1]*0.5+f.u[1]*a+f.v[1]*b;
      const pz=f.n[2]*0.5+f.u[2]*a+f.v[2]*b;
      const qx=clamp(px,-inner,inner), qy=clamp(py,-inner,inner), qz=clamp(pz,-inner,inner);
      let nx=px-qx, ny=py-qy, nz=pz-qz;
      const l=Math.hypot(nx,ny,nz);
      if(l>1e-6){ nx/=l; ny/=l; nz/=l; } else { nx=f.n[0]; ny=f.n[1]; nz=f.n[2]; }
      pos.push(qx+nx*r, qy+ny*r, qz+nz*r);
      nrm.push(nx,ny,nz);
      uv.push(i/seg, j/seg);
    }
    for(let j=0;j<seg;j++)for(let i=0;i<seg;i++){
      const a0=base+j*(seg+1)+i, b0=a0+1, c0=a0+seg+1, d0=c0+1;
      idx.push(a0,b0,c0, b0,d0,c0);
    }
  }
  return {pos,nrm,uv,idx};
}
function geoCyl(radial,hgt){
  const pos=[],nrm=[],uv=[],idx=[];
  const R=0.5;
  for(let j=0;j<=hgt;j++)for(let i=0;i<=radial;i++){
    const a=i/radial*Math.PI*2;
    pos.push(Math.cos(a)*R,(j/hgt-0.5),Math.sin(a)*R);
    nrm.push(Math.cos(a),0,Math.sin(a)); uv.push(i/radial,j/hgt);
  }
  for(let j=0;j<hgt;j++)for(let i=0;i<radial;i++){
    const a=j*(radial+1)+i,b=a+1,c=a+radial+1,d=c+1;
    idx.push(a,b,c, b,d,c);
  }
  /* top cap fan */
  const tc=pos.length/3;
  pos.push(0,0.5,0); nrm.push(0,1,0); uv.push(0.5,0.5);
  for(let i=0;i<radial;i++) idx.push(tc, i, i+1);
  /* bottom cap fan */
  const bc=pos.length/3;
  pos.push(0,-0.5,0); nrm.push(0,-1,0); uv.push(0.5,0.5);
  const bs=hgt*(radial+1);
  for(let i=0;i<radial;i++) idx.push(bc, bs+i+1, bs+i);
  return {pos,nrm,uv,idx};
}
function geoSphere(rad,radial,vertical){
  const pos=[],nrm=[],uv=[],idx=[];
  for(let j=0;j<=vertical;j++)for(let i=0;i<=radial;i++){
    const th=i/radial*Math.PI*2, ph=j/vertical*Math.PI;
    const x=Math.sin(ph)*Math.cos(th), y=Math.cos(ph), z=Math.sin(ph)*Math.sin(th);
    pos.push(x*rad,y*rad,z*rad); nrm.push(x,y,z); uv.push(i/radial,j/vertical);
  }
  for(let j=0;j<vertical;j++)for(let i=0;i<radial;i++){
    const a=j*(radial+1)+i,b=a+1,c=a+radial+1,d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  return {pos,nrm,uv,idx};
}
function makeMesh(g){
  const vao=gl.createVertexArray(); gl.bindVertexArray(vao);
  const pb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,pb);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.pos),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const nb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,nb);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.nrm),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
  const tb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,tb);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(g.uv),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,2,gl.FLOAT,false,0,0);
  const ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(g.idx),gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return {vao, count:g.idx.length};
}
const M_BOX=makeMesh(geoBox());
const M_RBOX=makeMesh(geoRBox(0.055,3));
const M_RBOXS=makeMesh(geoRBox(0.10,3));
const M_CYL=makeMesh(geoCyl(14,3));
const M_SPH=makeMesh(geoSphere(400,28,18));
const M_PLANE=makeMesh(geoPlane(1,1,1,1));
const M_WALL=makeMesh(geoWall(1,1,1,1));
const M_MTNWALL=makeMesh(geoWall(1,1,256,40));
const M_WATERMESH=makeMesh(geoPlane(1,1,48,24));

export { M_BOX, M_CYL, M_MTNWALL, M_RBOX, M_RBOXS, M_SPH, M_WALL, M_WATERMESH };
