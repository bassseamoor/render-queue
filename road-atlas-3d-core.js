/* Road Atlas 3D — core 2.0.0
 * Shared utils for the 3D city modules: deterministic RNG, path smoothing,
 * geometry batching helpers, and the topo-accurate ground sampler.
 *
 * The 2D city already owns a real elevation raster
 * (W.conditions.topography.elevation, bilinearly sampled). The 3D twin
 * samples the SAME raster, so hills, valleys and river banks in 3D are the
 * hills, valleys and river banks on the 2D map — not decoration.
 */
import * as THREE from 'three';

export const VERSION = '2.0.0';

/* ---------------- deterministic RNG ---------------- */
export function xmur3(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return (h^=h>>>16)>>>0;};}
export function sfc32(a,b,c,d){return function(){a>>>=0;b>>>=0;c>>>=0;d>>>=0;var t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+c<<3;c=c<<21|c>>>11;c=c+t|0;return (t>>>0)/4294967296;};}
export function rngFromSeed(s){var f=xmur3(String(s));return sfc32(f(),f(),f(),f());}
export function shuffle(arr,rng){for(var i=arr.length-1;i>0;i--){var j=Math.floor(rng()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}
export function pick(rng,arr){return arr[Math.floor(rng()*arr.length)%arr.length];}

/* ---------------- colors ---------------- */
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
export function hex(h){ return new THREE.Color(h); }
export function shadeTo(palLike, t){ // blend wallA->wallB
  _c1.set(palLike.wallA).lerp(_c2.set(palLike.wallB), Math.max(0, Math.min(1, t)));
  return _c1.clone();
}

/* ---------------- path smoothing (midpoint-quadratic family) ---------------- */
export function smoothPath(pts){
  var P=pts.map(function(p){return {x:p.x,y:p.y};});
  if(P.length<3)return P;
  var mid=function(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};};
  var out=[P[0]],start=P[0];
  for(var i=1;i<P.length-1;i++){
    var m=mid(P[i],P[i+1]),c=P[i];
    var ts=[0.25,0.5,0.75];
    for(var k=0;k<ts.length;k++){
      var t=ts[k],u=1-t;
      out.push({x:u*u*start.x+2*u*t*c.x+t*t*m.x, y:u*u*start.y+2*u*t*c.y+t*t*m.y});
    }
    out.push({x:m.x,y:m.y});start=m;
  }
  out.push(P[P.length-1]);
  return out;
}
export function prepPath(pts){
  var cum=[0],total=0;
  for(var i=1;i<pts.length;i++){
    var dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y;
    total+=Math.sqrt(dx*dx+dy*dy);cum.push(total);
  }
  return {cum:cum,total:total};
}
export function pointAt(pts,prep,s){
  var d=s*prep.total,cum=prep.cum,lo=0,hi=cum.length-1;
  while(lo<hi){var mid=(lo+hi)>>1;if(cum[mid]<d)lo=mid+1;else hi=mid;}
  var i=Math.max(1,lo),c0=cum[i-1],c1=cum[i];
  var f=c1>c0?(d-c0)/(c1-c0):0;
  var ax=pts[i-1].x,ay=pts[i-1].y;
  return {x:ax+(pts[i].x-ax)*f, y:ay+(pts[i].y-ay)*f,
          ang:Math.atan2(pts[i].y-ay,pts[i].x-ax)};
}

/* ---------------- Batch: merged vertex-colored geometry ---------------- */
export class Batch {
  constructor(){ this.pos=[]; this.col=[]; this.idx=[]; }
  tri(a,b,c,color){
    const base=this.pos.length/3;
    this.pos.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]);
    for(let i=0;i<3;i++)this.col.push(color.r,color.g,color.b);
    this.idx.push(base,base+1,base+2);
  }
  quad(a,b,c,d,color){ this.tri(a,b,c,color); this.tri(a,c,d,color); }
  get empty(){ return this.idx.length===0; }
  build(){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(this.pos,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(this.col,3));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    return g;
  }
  mesh(matOpts){
    const m=new THREE.Mesh(this.build(),
      new THREE.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:0.9,metalness:0.02,side:THREE.DoubleSide},matOpts||{})));
    return m;
  }
}

/* ribbon strip along a polyline; hw = half width number or fn(i)->w; y = fn(i)->y or number */
export function ribbon(batch,pts,hw,y,color){
  const n=pts.length; if(n<2)return;
  const w=i=>(typeof hw==='function'?hw(i):hw);
  const yy=i=>(typeof y==='function'?y(i):y);
  const nx=new Array(n),nz=new Array(n);
  for(let i=0;i<n;i++){
    const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];
    let dx=b.x-a.x,dz=b.y-a.y;
    const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l;
    nx[i]=-dz; nz[i]=dx;
  }
  for(let i=0;i<n-1;i++){
    const p=pts[i],q=pts[i+1];
    const L0=[p.x+nx[i]*w(i),yy(i),p.y+nz[i]*w(i)];
    const R0=[p.x-nx[i]*w(i),yy(i),p.y-nz[i]*w(i)];
    const L1=[q.x+nx[i+1]*w(i+1),yy(i+1),q.y+nz[i+1]*w(i+1)];
    const R1=[q.x-nx[i+1]*w(i+1),yy(i+1),q.y-nz[i+1]*w(i+1)];
    batch.quad(L0,R0,R1,L1,color);
  }
}

/* flat polygon at fixed height */
export function flatPoly(batch,pts,y,color){
  if(!pts||pts.length<3)return;
  const shape=new THREE.Shape();
  shape.moveTo(pts[0].x,-pts[0].y);
  for(let i=1;i<pts.length;i++)shape.lineTo(pts[i].x,-pts[i].y);
  shape.closePath();
  const g=new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI/2);
  g.translate(0,y,0);
  const p=g.getAttribute('position'),index=g.getIndex();
  const v=i=>[p.getX(i),p.getY(i),p.getZ(i)];
  if(index){ for(let i=0;i<index.count;i+=3)batch.tri(v(index.getX(i)),v(index.getX(i+1)),v(index.getX(i+2)),color); }
  else { for(let i=0;i<p.count;i+=3)batch.tri(v(i),v(i+1),v(i+2),color); }
  g.dispose();
}

/* merge small translated boxes with baked vertex colors into one geometry */
export function mergeBoxes(parts){
  var pos=[],col=[],idx=[],base=0;
  parts.forEach(function(pb){
    var g=new THREE.BoxGeometry(pb.w,pb.h,pb.d);
    g.translate(pb.x,pb.y,pb.z);
    var p=g.getAttribute('position'),ix=g.getIndex();
    for(var i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));col.push(pb.c[0],pb.c[1],pb.c[2]);}
    for(var j=0;j<ix.count;j++)idx.push(base+ix.getX(j));
    base+=p.count;g.dispose();
  });
  var out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  out.setIndex(idx);out.computeVertexNormals();
  return out;
}

/* ---------------- topo-accurate ground ----------------
 * Samples W.conditions.topography.elevation (the same raster the 2D contour
 * lines are drawn from) and maps it to world height. Returns:
 *   { sample(x,y) -> raw raster value,
 *     height(x,y) -> world-space Y of the ground,
 *     slopeAt(x,y) -> slope index 0..1,
 *     relief -> total world-space height range,
 *     ready: bool }
 */
export function makeGround(W){
  var T=W.conditions&&W.conditions.topography;
  var E=T&&T.elevation, S=T&&T.slope;
  function rawSample(g,x,y){
    if(!g||!g.data)return 0;
    var u=Math.max(0,Math.min(g.w-1,x/g.dx)),v=Math.max(0,Math.min(g.h-1,y/g.dy));
    var ix=Math.min(g.w-2,Math.floor(u)),iy=Math.min(g.h-2,Math.floor(v));
    var tx=u-ix,ty=v-iy,k=iy*g.w+ix;
    var a=g.data[k],b=g.data[k+1],c=g.data[k+g.w],d=g.data[k+g.w+1];
    return (a+(b-a)*tx)+((c+(d-c)*tx)-(a+(b-a)*tx))*ty;
  }
  if(!E||!E.data||E.data.length<4){
    return { ready:false, sample:function(){return 0;}, height:function(){return 0;},
             slopeAt:function(){return 0;}, relief:0, emin:0, emax:1 };
  }
  var lo=(typeof E.min==='number')?E.min:Infinity,
      hi=(typeof E.max==='number')?E.max:-Infinity;
  if(!isFinite(lo)||!isFinite(hi)){
    for(var i=0;i<E.data.length;i++){var v=E.data[i];if(v<lo)lo=v;if(v>hi)hi=v;}
  }
  var span=(hi-lo)||1;
  // target relief: hills read clearly without dwarfing the city
  var RELIEF=110;
  function height(x,y){
    var e=rawSample(E,x,y);
    return ((e-lo)/span)*RELIEF;
  }
  function slopeAt(x,y){
    if(!S||!S.data)return 0;
    return Math.max(0,Math.min(1,rawSample(S,x,y)));
  }
  return { ready:true, sample:function(x,y){return rawSample(E,x,y);},
           height:height, slopeAt:slopeAt, relief:RELIEF, emin:lo, emax:hi };
}

/* spatial hash for fast nearest-polyline queries (river carving, etc.) */
export function makePointIndex(pts,cell){
  cell=cell||40;
  var map=new Map();
  function key(ix,iz){return ix+','+iz;}
  pts.forEach(function(p,pi){
    var ix=Math.floor(p.x/cell),iz=Math.floor(p.y/cell);
    var k=key(ix,iz),a=map.get(k);
    if(!a){a=[];map.set(k,a);}
    a.push(pi);
  });
  return {
    near(x,y,r){
      var out=[],c0=Math.floor((x-r)/cell),c1=Math.floor((x+r)/cell),
          d0=Math.floor((y-r)/cell),d1=Math.floor((y+r)/cell);
      for(var ix=c0;ix<=c1;ix++)for(var iz=d0;iz<=d1;iz++){
        var a=map.get(key(ix,iz));
        if(a)for(var i=0;i<a.length;i++)out.push(pts[a[i]]);
      }
      return out;
    }
  };
}
