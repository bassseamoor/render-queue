/* Planet vegetation — the real plant geometry builders from moor-planet-demo.html,
 * running verbatim against a minimal THREE shim (only the geometry classes the
 * builders use: BufferGeometry + 4 primitives). No THREE.js is loaded.
 * Panel-owned: the shim, the orbit viewer, and the wind sway (the real wind
 * shader is planet-field-specific and lives in the demo). */
(function(){
'use strict';

/* ---------- minimal THREE geometry shim (panel code) ---------- */
function BufAttr(arr, size){
  this.array = (arr instanceof Float32Array) ? arr : new Float32Array(arr);
  this.itemSize = size; this.count = this.array.length / size;
}
BufAttr.prototype.getX = function(i){ return this.array[i*3]; };
BufAttr.prototype.getY = function(i){ return this.array[i*3+1]; };
BufAttr.prototype.getZ = function(i){ return this.array[i*3+2]; };
BufAttr.prototype.setXYZ = function(i,x,y,z){ var a=this.array,o=i*3; a[o]=x;a[o+1]=y;a[o+2]=z; };
BufAttr.prototype.setXYZW = function(i,x,y,z,w){ var a=this.array,o=i*4; a[o]=x;a[o+1]=y;a[o+2]=z;a[o+3]=w; };

function BufferGeometry(){
  this.attributes = {}; this.index = null;
}
BufferGeometry.prototype.setAttribute = function(n,a){ this.attributes[n]=a; return this; };
BufferGeometry.prototype.setIndex = function(idx){
  this.index = (idx && idx.array) ? idx : {array: idx};
  return this;
};
BufferGeometry.prototype.computeVertexNormals = function(){
  var p = this.attributes.position, n = p.count;
  var ns = new Float32Array(n*3);
  var idx = this.index ? this.index.array : null;
  function tri(a,b,c){
    var ax=p.array[a*3],ay=p.array[a*3+1],az=p.array[a*3+2];
    var bx=p.array[b*3],by=p.array[b*3+1],bz=p.array[b*3+2];
    var cx=p.array[c*3],cy=p.array[c*3+1],cz=p.array[c*3+2];
    var ux=bx-ax,uy=by-ay,uz=bz-az, vx=cx-ax,vy=cy-ay,vz=cz-az;
    var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
    ns[a*3]+=nx;ns[a*3+1]+=ny;ns[a*3+2]+=nz;
    ns[b*3]+=nx;ns[b*3+1]+=ny;ns[b*3+2]+=nz;
    ns[c*3]+=nx;ns[c*3+1]+=ny;ns[c*3+2]+=nz;
  }
  if (idx){ for (var i=0;i<idx.length;i+=3) tri(idx[i],idx[i+1],idx[i+2]); }
  else { for (var j=0;j<n;j+=3) tri(j,j+1,j+2); }
  for (var k=0;k<n;k++){
    var l = Math.hypot(ns[k*3],ns[k*3+1],ns[k*3+2]) || 1;
    ns[k*3]/=l; ns[k*3+1]/=l; ns[k*3+2]/=l;
  }
  this.attributes.normal = new BufAttr(ns,3);
};
function xform(geo, fn){
  var p = geo.attributes.position;
  for (var i=0;i<p.count;i++) fn(p.array, i*3);
  if (geo.attributes.normal) geo.computeVertexNormals();
  return geo;
}
BufferGeometry.prototype.translate = function(x,y,z){
  return xform(this, function(a,o){ a[o]+=x; a[o+1]+=y; a[o+2]+=z; });
};
BufferGeometry.prototype.scale = function(x,y,z){
  return xform(this, function(a,o){ a[o]*=x; a[o+1]*=y; a[o+2]*=z; });
};
BufferGeometry.prototype.rotateX = function(a){
  var c=Math.cos(a), s=Math.sin(a);
  return xform(this, function(p,o){ var y=p[o+1],z=p[o+2]; p[o+1]=y*c-z*s; p[o+2]=y*s+z*c; });
};
BufferGeometry.prototype.rotateY = function(a){
  var c=Math.cos(a), s=Math.sin(a);
  return xform(this, function(p,o){ var x=p[o],z=p[o+2]; p[o]=x*c+z*s; p[o+2]=-x*s+z*c; });
};

function gridGeo(nu, nv, fn){
  // fn(u,v) -> [x,y,z]; indexed grid with normals via computeVertexNormals
  var pos = [], idx = [];
  for (var j=0;j<=nv;j++) for (var i=0;i<=nu;i++){
    var p = fn(i/nu, j/nv); pos.push(p[0],p[1],p[2]);
  }
  for (var y=0;y<nv;y++) for (var x=0;x<nu;x++){
    var a=y*(nu+1)+x, b=a+1, c=a+nu+1, d=c+1;
    idx.push(a,c,b, b,c,d);
  }
  var g = new BufferGeometry();
  g.setAttribute('position', new BufAttr(pos,3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function CylinderGeometry(rt, rb, h, rad, hs){
  rad=rad||8; hs=hs||1;
  return gridGeo(rad, hs, function(u,v){
    var r = rb+(rt-rb)*v, a=u*Math.PI*2;
    return [Math.cos(a)*r, v*h, Math.sin(a)*r];
  });
}
function ConeGeometry(r, h, rad){
  return CylinderGeometry(0.0001, r, h, rad||8, 1);
}
function PlaneGeometry(w, h, ws, hs){
  return gridGeo(ws||1, hs||1, function(u,v){
    return [(u-0.5)*w, (v-0.5)*h, 0];
  });
}
function IcosahedronGeometry(r, detail){
  // base icosahedron; detail>0 subdivides once (detail 2 = enough for rocks/canopy)
  var t=(1+Math.sqrt(5))/2, v=[];
  [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]]
    .forEach(function(p){ var l=Math.hypot(p[0],p[1],p[2]); v.push([p[0]/l*r,p[1]/l*r,p[2]/l*r]); });
  var f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
  function sub(a,b,c){
    var mab=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
    var mbc=[(b[0]+c[0])/2,(b[1]+c[1])/2,(b[2]+c[2])/2];
    var mca=[(c[0]+a[0])/2,(c[1]+a[1])/2,(c[2]+a[2])/2];
    [mab,mbc,mca].forEach(function(m){ var l=Math.hypot(m[0],m[1],m[2]); m[0]=m[0]/l*r;m[1]=m[1]/l*r;m[2]=m[2]/l*r; });
    return [[a,mab,mca],[mab,b,mbc],[mca,mbc,c],[mab,mbc,mca]];
  }
  var tris=[];
  f.forEach(function(ff){
    var t0=[v[ff[0]],v[ff[1]],v[ff[2]]];
    for (var d=0; d<(detail||0); d++){
      var nt=[];
      t0.forEach(function(t){ sub(t[0],t[1],t[2]).forEach(function(x){nt.push(x);}); });
      t0=nt;
    }
    t0.forEach(function(t){ tris.push(t); });
  });
  var pos=[], idx=[], vmap={};
  function vi(p){
    var k=p[0].toFixed(4)+','+p[1].toFixed(4)+','+p[2].toFixed(4);
    if (vmap[k]==null){ vmap[k]=pos.length/3; pos.push(p[0],p[1],p[2]); }
    return vmap[k];
  }
  tris.forEach(function(t){ idx.push(vi(t[0]),vi(t[1]),vi(t[2])); });
  var g=new BufferGeometry();
  g.setAttribute('position', new BufAttr(pos,3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
var THREE = {
  BufferGeometry: BufferGeometry, BufferAttribute: BufAttr,
  CylinderGeometry: CylinderGeometry, ConeGeometry: ConeGeometry,
  PlaneGeometry: PlaneGeometry, IcosahedronGeometry: IcosahedronGeometry
};

/* ---------- verbatim builders (from moor-planet-demo.html) ---------- */
function mulberry32f(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var VEG_SEED = 1;
function tinted(geo,r,gcol,b){
  const n=geo.attributes.position.count,t=new Float32Array(n*3);
  for(let i=0;i<n;i++){t[i*3]=r;t[i*3+1]=gcol;t[i*3+2]=b;}
  geo.setAttribute('aTint',new THREE.BufferAttribute(t,3));
  return geo;
}
function jitterGeo(geo,amt,seedJ){
  const p=geo.attributes.position,rnd=mulberry32f(seedJ);
  for(let i=0;i<p.count;i++){
    p.setXYZ(i,p.getX(i)+(rnd()-0.5)*amt,p.getY(i)+(rnd()-0.5)*amt,p.getZ(i)+(rnd()-0.5)*amt);
  }
  geo.computeVertexNormals();
  return geo;
}
function merge2(a,b){
  const pa=a.attributes.position,na=a.attributes.normal,ta=a.attributes.aTint;
  const pb=b.attributes.position,nb=b.attributes.normal,tb=b.attributes.aTint;
  const n=pa.count+pb.count;
  const P=new Float32Array(n*3),N=new Float32Array(n*3),T=new Float32Array(n*3);
  P.set(pa.array,0);P.set(pb.array,pa.count*3);
  N.set(na.array,0);N.set(nb.array,pa.count*3);
  T.set(ta.array,0);T.set(tb.array,pa.count*3);
  const ia=a.index?Array.from(a.index.array):[...Array(pa.count).keys()];
  const ib=b.index?Array.from(b.index.array):[...Array(pb.count).keys()];
  const I=new Uint32Array(ia.length+ib.length);
  I.set(ia,0);
  for(let i=0;i<ib.length;i++)I[ia.length+i]=ib[i]+pa.count;
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(P,3));
  g.setAttribute('normal',new THREE.BufferAttribute(N,3));
  g.setAttribute('aTint',new THREE.BufferAttribute(T,3));
  g.setIndex(new THREE.BufferAttribute(I,1));
  return g;
}
function coniferTreeGeo(){
  const trunk=new THREE.CylinderGeometry(0.28,0.42,1.6,6);trunk.translate(0,0.8,0);
  tinted(trunk,0.5,1,0);
  let g=trunk;
  const layers=[[2.6,3.2,2.2],[2.0,2.6,3.6],[1.3,2.0,4.8]];
  for(const [r,h,y] of layers){
    const c=new THREE.ConeGeometry(r,h,7);c.translate(0,y,0);
    tinted(c,0.15,0,0);
    g=merge2(g,c);
  }
  return g;
}
function broadTreeGeo(){
  const trunk=new THREE.CylinderGeometry(0.32,0.48,1.8,6);trunk.translate(0,0.9,0);
  tinted(trunk,0.5,1,0);
  const can=jitterGeo(new THREE.IcosahedronGeometry(3.8,2),1.0,VEG_SEED+9);
  can.scale(1,0.8,1);can.translate(0,3.4,0);
  tinted(can,0.35,0,0);
  return merge2(trunk,can);
}
function rockGeo(){
  const g=jitterGeo(new THREE.IcosahedronGeometry(1.5,2),0.55,VEG_SEED+21);
  g.scale(1,0.72,1);g.translate(0,0.5,0);
  return tinted(g,0.6,0.4,0);
}
function grassGeo(){
  const g=new THREE.BufferGeometry();
  const v=new Float32Array([
    -0.12,0,0, 0.12,0,0, -0.07,0.7,0, 0.07,0.7,0,
    0,0,-0.12, 0,0,0.12, 0,0.7,-0.07, 0,0.7,0.07 ]);
  const nn=new Float32Array([
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    1,0,0, 1,0,0, 1,0,0, 1,0,0 ]);
  g.setAttribute('position',new THREE.BufferAttribute(v,3));
  g.setAttribute('normal',new THREE.BufferAttribute(nn,3));
  g.setIndex([0,1,2,2,1,3, 4,5,6,6,5,7]);
  return tinted(g,0.7,0,0);
}
function flowerGeo(){
  const stem=new THREE.CylinderGeometry(0.02,0.03,0.4,4);stem.translate(0,0.2,0);
  tinted(stem,0.5,1,0);
  const head=new THREE.IcosahedronGeometry(0.09,0);head.translate(0,0.45,0);
  tinted(head,0.9,0,0);
  const g=merge2(stem,head);
  return g;
}
function softPlantGeo(){
  const stem=new THREE.CylinderGeometry(0.07,0.11,1.7,5,3);stem.translate(0,0.85,0);
  tinted(stem,0.5,1,0);
  const leaves=[];
  const rnd=mulberry32f(VEG_SEED+33);
  for(let i=0;i<6;i++){
    const l=new THREE.PlaneGeometry(0.5,0.9,1,2);
    const a=i/6*Math.PI*2+rnd()*0.5,tilt=0.5+rnd()*0.5;
    l.rotateX(-tilt);
    l.rotateY(a);
    l.translate(Math.cos(a)*0.35,1.35+rnd()*0.4,Math.sin(a)*0.35);
    tinted(l,0.25,0,1);
    leaves.push(l);
  }
  let g=stem;
  for(const l of leaves)g=merge2(g,l);
  return g;
}

/* ---------- panel viewer: raw WebGL orbit + wind (panel code) ---------- */
var SPECIES = [
  {id:'conifer', name:'Conifer', make:coniferTreeGeo, colA:'#2e7a34', colB:'#3f8a3a', wind:0.35},
  {id:'broad', name:'Broadleaf', make:broadTreeGeo, colA:'#2e7a34', colB:'#4f9a3a', wind:0.35},
  {id:'soft', name:'Soft plant', make:softPlantGeo, colA:'#2e7a34', colB:'#4f9a3a', wind:0.5},
  {id:'grass', name:'Grass', make:grassGeo, colA:'#4a7a2e', colB:'#7a9a3a', wind:0.5},
  {id:'flower', name:'Flower', make:flowerGeo, colA:'#e84a7a', colB:'#f0d040', wind:0.3},
  {id:'rock', name:'Rock', make:rockGeo, colA:'#6e6e72', colB:'#8e8e92', wind:0}
];

TOOLS.vegetation = { mount: function(host){
  var species = SPECIES[0], seed = 7, wind = 0.35, count = 36;
  host.innerHTML =
    '<div class="t-controls"><div class="t-species" id="v-sp"></div></div>'+
    '<div class="t-controls"><label>Seed <input id="v-seed" value="7" spellcheck="false" style="width:70px"></label>'+
    '<label>Wind <input id="v-wind" type="range" min="0" max="100" value="35"><span id="v-wind-v">0.35</span></label>'+
    '<label>Count <input id="v-count" type="range" min="4" max="120" value="36"><span id="v-count-v">36</span></label>'+
    '<button class="btn primary" id="v-grow">Grow</button></div>'+
    '<canvas id="v-cv" width="600" height="380" style="width:100%;border-radius:12px;touch-action:none"></canvas>'+
    '<p class="meta">Drag to orbit, scroll to zoom. The plant shapes are the real builders from the planet demo — the orbit camera and this wind sway are panel viewing code.</p>';

  var cv = host.querySelector('#v-cv'), gl = cv.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
  var VS = 'attribute vec3 p;attribute vec3 n;attribute vec3 t;'+
    'uniform mat4 mvp;uniform float uTime,uWind;'+
    'varying vec3 vN;varying vec3 vT;varying float vH;'+
    'void main(){vec3 q=p;'+
    'float hk=clamp(q.y/4.0,0.0,1.0);'+
    'q.x+=sin(uTime*1.9+t.r*6.28)*uWind*hk*hk;'+
    'q.z+=cos(uTime*1.6+t.r*6.28)*uWind*hk*hk*0.6;'+
    'vN=n;vT=t;vH=hk;'+
    'gl_Position=mvp*vec4(q,1.0);}';
  var FS = 'precision mediump float;'+
    'uniform vec3 uColA,uColB,uBarkA,uBarkB;'+
    'varying vec3 vN;varying vec3 vT;varying float vH;'+
    'void main(){'+
    'vec3 leaf=mix(uColA,uColB,vT.r);'+
    'vec3 bark=mix(uBarkA,uBarkB,vT.r);'+
    'vec3 base=mix(leaf,bark,vT.g);'+
    'vec3 N=normalize(vN);'+
    'float ndl=max(dot(N,normalize(vec3(0.5,0.8,0.4))),0.0);'+
    'vec3 lit=base*(0.55+0.65*ndl+0.25*(N.y*0.5+0.5));'+
    'gl_FragColor=vec4(lit,1.0);}';
  function sh(t,s){ var h=gl.createShader(t); gl.shaderSource(h,s); gl.compileShader(h); return h; }
  var pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  var aP=gl.getAttribLocation(pr,'p'), aN=gl.getAttribLocation(pr,'n'), aT=gl.getAttribLocation(pr,'t');
  var uMVP=gl.getUniformLocation(pr,'mvp'), uTime=gl.getUniformLocation(pr,'uTime'),
      uWind=gl.getUniformLocation(pr,'uWind'), uColA=gl.getUniformLocation(pr,'uColA'),
      uColB=gl.getUniformLocation(pr,'uColB'), uBarkA=gl.getUniformLocation(pr,'uBarkA'),
      uBarkB=gl.getUniformLocation(pr,'uBarkB');
  function hx(c){ return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255]; }

  var yaw=0.6, pitch=0.5, dist=34, dragging=false, lx=0, ly=0;
  cv.addEventListener('pointerdown', function(e){ dragging=true; lx=e.clientX; ly=e.clientY; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function(e){
    if (!dragging) return;
    yaw += (e.clientX-lx)*0.008; pitch = Math.max(0.08, Math.min(1.4, pitch+(e.clientY-ly)*0.008));
    lx=e.clientX; ly=e.clientY;
  });
  cv.addEventListener('pointerup', function(){ dragging=false; });
  cv.addEventListener('wheel', function(e){ e.preventDefault(); dist=Math.max(8,Math.min(80,dist*(1+e.deltaY*0.001))); }, {passive:false});

  var geos = [];
  function grow(){
    VEG_SEED = (parseInt(host.querySelector('#v-seed').value,10)||0);
    wind = (+host.querySelector('#v-wind').value)/100;
    count = +host.querySelector('#v-count').value;
    host.querySelector('#v-wind-v').textContent = wind.toFixed(2);
    host.querySelector('#v-count-v').textContent = count;
    var base = species.make();
    var rnd = mulberry32f(VEG_SEED*7919+11);
    geos = [];
    for (var i=0;i<count;i++){
      var a = rnd()*Math.PI*2, r = 3+rnd()*9;
      geos.push({g:base, x:Math.cos(a)*r, z:Math.sin(a)*r,
        s:0.7+rnd()*0.9, rot:rnd()*Math.PI*2, ph:rnd()});
    }
  }

  var sp = host.querySelector('#v-sp');
  SPECIES.forEach(function(spc){
    var b = document.createElement('button');
    b.className = 'btn'+(spc===species?' primary':'');
    b.textContent = spc.name;
    b.onclick = function(){
      species = spc;
      Array.prototype.forEach.call(sp.children, function(x){x.classList.remove('primary');});
      b.classList.add('primary'); grow();
    };
    sp.appendChild(b);
  });
  host.querySelector('#v-grow').onclick = grow;
  host.querySelector('#v-wind').oninput = grow;
  host.querySelector('#v-count').oninput = grow;
  grow();

  function mat4persp(fovy,asp,n,f){
    var t=1/Math.tan(fovy/2), o=new Float32Array(16);
    o[0]=t/asp; o[5]=t; o[10]=(f+n)/(n-f); o[11]=-1; o[14]=2*f*n/(n-f);
    return o;
  }
  function mat4look(eye,cx,cy,cz){
    var zx=eye[0]-cx, zy=eye[1]-cy, zz=eye[2]-cz;
    var l=Math.hypot(zx,zy,zz); zx/=l; zy/=l; zz/=l;
    var xx=zz, xy=0, xz=-zx;
    l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
    var yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
    return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
      -(xx*eye[0]+xy*eye[1]+xz*eye[2]), -(yx*eye[0]+yy*eye[1]+yz*eye[2]), -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1]);
  }
  function mat4mul(a,b){
    var o=new Float32Array(16);
    for (var c=0;c<4;c++) for (var r=0;r<4;r++){
      o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
    }
    return o;
  }

  var bufs = {};
  function getBufs(g){
    var key = g.__vk || (g.__vk = 'k'+Math.random().toString(36).slice(2));
    if (bufs[key]) return bufs[key];
    function mk(attr, loc, size){
      var b=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,b);
      gl.bufferData(gl.ARRAY_BUFFER, attr.array, gl.STATIC_DRAW);
      return {b:b, loc:loc, size:size, n:attr.count};
    }
    var o = {
      p: mk(g.attributes.position, aP, 3),
      n: mk(g.attributes.normal, aN, 3),
      t: mk(g.attributes.aTint, aT, 3),
      idx: (function(){
        var b=gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(g.index.array), gl.STATIC_DRAW);
        return {b:b, n:g.index.array.length};
      })()
    };
    bufs[key]=o; return o;
  }

  var t0 = performance.now(), raf = 0;
  function frame(){
    raf = requestAnimationFrame(frame);
    var t = (performance.now()-t0)/1000;
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0.04,0.06,0.09,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    var eye=[Math.cos(yaw)*Math.cos(pitch)*dist, Math.sin(pitch)*dist, Math.sin(yaw)*Math.cos(pitch)*dist];
    var mvp = mat4mul(mat4persp(0.9, cv.width/cv.height, 0.1, 200), mat4look(eye,0,2,0));
    gl.uniformMatrix4fv(uMVP,false,mvp);
    gl.uniform1f(uTime,t); gl.uniform1f(uWind, wind*species.wind*3);
    var cA=hx(species.colA), cB=hx(species.colB);
    gl.uniform3f(uColA,cA[0],cA[1],cA[2]); gl.uniform3f(uColB,cB[0],cB[1],cB[2]);
    gl.uniform3f(uBarkA,0.29,0.21,0.13); gl.uniform3f(uBarkB,0.35,0.27,0.19);
    // ground disc
    // (simple dark disc drawn as a flattened cylinder would need geometry; skip — plants float on gradient bg)
    geos.forEach(function(inst){
      var B = getBufs(inst.g);
      // model matrix: scale/rot/translate folded into a per-instance MVP would need
      // a uniform; instead bake into a temporary matrix multiply here
      var c=Math.cos(inst.rot), s=Math.sin(inst.rot), k=inst.s;
      var model = new Float32Array([
        c*k,0,-s*k,0, 0,k,0,0, s*k,0,c*k,0, inst.x,0,inst.z,1]);
      gl.uniformMatrix4fv(uMVP,false,mat4mul(mvp,model));
      gl.uniform1f(uTime, t + inst.ph*10);
      [[B.p],[B.n],[B.t]].forEach(function(x){
        gl.bindBuffer(gl.ARRAY_BUFFER, x[0].b);
        gl.enableVertexAttribArray(x[0].loc);
        gl.vertexAttribPointer(x[0].loc, x[0].size, gl.FLOAT, false, 0, 0);
      });
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.idx.b);
      gl.drawElements(gl.TRIANGLES, B.idx.n, gl.UNSIGNED_SHORT, 0);
    });
  }
  frame();
  TOOLS.vegetation.unmount = function(){ cancelAnimationFrame(raf); };
}};

})();
