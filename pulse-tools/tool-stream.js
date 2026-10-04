/* MOOR Stream v2 — the build-anything stream, in 3D.
 * One-way water: never blank, no questions asked. You talk (no push-to-talk;
 * one tap enables voice, then just speak) or type. The stream infers intent
 * and lands N scenes downstream as 3D dioramas — 3 by default, ask for 6/12/40
 * and you get it, never throttled. Continuous: speak → it builds → speak → it
 * builds; silence builds nothing. A coherence gate ignores non-requests
 * (thinking out loud, background talk) — it probably wasn't a request.
 * Scenes are real 3D: things standing in the space, or windows (flat portals
 * carrying the 2D stream view), or layered windows — however it's set up.
 * Tap a diorama for ingredients (real components + seeds, all the way down).
 * Dev (you) gets the kitchen: spec JSON, rewire, player-visible flags.
 * Players customize everything, control nothing structural. */
(function(){
'use strict';

/* ================= shared: components, moods, parser ================= */
var COMPONENTS = {
  'terrain-core':      {label:'Terrain',       words:['terrain','mountain','hill','valley','canyon','desert','landscape']},
  'vegetation':        {label:'Vegetation',    words:['forest','trees','woods','jungle','plants','vegetation','pine']},
  'softbody-creatures':{label:'Creatures',     words:['creature','animal','beast','walker','herd','monster','deer']},
  'ambience-engine':   {label:'Ambience',      words:['sky','clouds','atmosphere','fog','mist','ambience','sunset','night']},
  'mesh-builder':      {label:'Structures',    words:['city','buildings','structures','tower','ruins','cabin','house']},
  'water':             {label:'Water',         words:['ocean','sea','lake','water','river','pond','shore','beach']}
};
var MOODS = {
  day:    {sky:['#7fb2e5','#cfe8f7'], sun:'#fff3c4', ground:['#5a7d4a','#3d5a34'], fog:'#cfe0ee'},
  sunset: {sky:['#3a2b5c','#e0784a'], sun:'#ffd9a0', ground:['#4a3d33','#2e2620'], fog:'#8a5a52'},
  night:  {sky:['#060a18','#16233f'], sun:'#e8ecf5', ground:['#1d2b22','#111a15'], fog:'#0a1220'},
  alien:  {sky:['#1a4a3a','#7fe0a8'], sun:'#d0ffe0', ground:['#2e6b4f','#1a4030'], fog:'#3a6b58'},
  misty:  {sky:['#9aa5ad','#d5dbdd'], sun:'#f2f2ee', ground:['#5c665e','#3e453f'], fog:'#c5ccce'},
  desert: {sky:['#6fb7e8','#f7e3b0'], sun:'#fff0c0', ground:['#c2a061','#9a7a44'], fog:'#e8d5a8'}
};
var MOOD_WORDS = {dark:'night', bright:'day', alien:'alien', sunset:'sunset', night:'night',
  misty:'misty', foggy:'misty', desert:'desert', sunny:'day', moody:'sunset'};
var COUNT_WORDS = {one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,
  twelve:12,twenty:20,forty:40};
/* live self-config: the Stream tunes itself as you talk to it.
 * "make the trees bigger" → treeScale ×1.3, rebuilds, live. */
var CONFIG_DEFAULTS = {treeScale:1,treeCount:1,terrainAmp:1,creatureScale:1,creatureCount:1,
  waterLevel:0.25,fogDensity:1,spacing:16};
var CONFIG = JSON.parse(JSON.stringify(CONFIG_DEFAULTS));
try{ var _sc=localStorage.getItem('stream-config'); if(_sc) CONFIG=JSON.parse(_sc); }catch(e){}
function saveConfig(){ try{ localStorage.setItem('stream-config',JSON.stringify(CONFIG)); }catch(e){} }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function hx(c){ return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255]; }

function parseInput(text){
  var t=' '+text.toLowerCase()+' ', count=3, mood='day', comps=[], water=false, present='diorama';
  var m=t.match(/\b(\d+)\b/);
  if (m) count=Math.max(1,Math.min(40,parseInt(m[1],10)));
  else for (var w in COUNT_WORDS) if (t.indexOf(w)>=0){ count=COUNT_WORDS[w]; break; }
  for (var mw in MOOD_WORDS) if (t.indexOf(mw)>=0){ mood=MOOD_WORDS[mw]; break; }
  if (t.match(/\b(sunset)\b/)) mood='sunset';
  if (t.match(/\b(night|midnight)\b/)) mood='night';
  for (var cid in COMPONENTS){
    var c=COMPONENTS[cid];
    for (var i=0;i<c.words.length;i++) if (t.indexOf(c.words[i])>=0){ comps.push(cid); break; }
  }
  if (comps.indexOf('water')>=0){ water=true; comps.splice(comps.indexOf('water'),1); }
  if (!comps.length) comps=['terrain-core','ambience-engine'];
  if (comps.indexOf('ambience-engine')<0) comps.push('ambience-engine');
  if (t.indexOf('window')>=0||t.indexOf('portal')>=0) present='window';
  return {count:count, mood:mood, comps:comps, water:water, present:present, raw:text};
}
function makeScene(seedBase, idx, parsed, variant){
  var rnd=streamFrom('stream:'+seedBase+':'+idx+(variant||''));
  return {
    seed: Math.floor(rnd()*0xffffffff).toString(16).slice(0,8),
    comps: parsed.comps.slice(), mood: parsed.mood, water: parsed.water,
    present: parsed.present||'diorama', caption: parsed.raw||'starter',
    settled:false, playerVisible:true, n:idx
  };
}
function hasComp(spec,cid){ return spec.comps.indexOf(cid)>=0; }

/* coherence gate: was that actually a request, or thinking out loud? */
var FILLER=['um','uh','like','you','know','i','mean','hmm','uhh','so','yeah','okay','ok','well','just','really','actually','er','ah'];
function isCoherent(txt, conf){
  if (conf&&conf<0.35) return false;
  var words=txt.toLowerCase().replace(/[^\w\s]/g,'').split(/\s+/)
    .filter(function(w){ return w&&FILLER.indexOf(w)<0; });
  return words.length>=2;
}

/* self-edit intents: tune the Stream itself, not a new scene */
var SELF_EDITS = [
  [/make the trees (bigger|taller)/,'treeScale',1.3],[/make the trees (smaller|shorter)/,'treeScale',0.75],
  [/(more trees|trees.*\bmore\b)/,'treeCount',1.5], [/(fewer trees|less trees)/,'treeCount',0.6],
  [/rougher terrain/,'terrainAmp',1.3],[/smoother terrain/,'terrainAmp',0.7],[/flatter/,'terrainAmp',0.7],
  [/make the creatures bigger/,'creatureScale',1.3],[/make the creatures smaller/,'creatureScale',0.75],
  [/more creatures/,'creatureCount',1.5],[/fewer creatures/,'creatureCount',0.6],
  [/more water/,'waterLevel','+0.15'],[/less water/,'waterLevel','-0.15'],
  [/more fog/,'fogDensity',1.4],[/less fog|clearer/,'fogDensity',0.7],
  [/further apart/,'spacing','+4'],[/closer together/,'spacing','-4'],
  [/\breset\b/,'__reset__',1]
];
function parseSelfEdit(text){
  var t=' '+text.toLowerCase()+' ';
  for (var i=0;i<SELF_EDITS.length;i++)
    if (SELF_EDITS[i][0].test(t)) return {key:SELF_EDITS[i][1], val:SELF_EDITS[i][2]};
  return null;
}
function looksLikeScene(text){
  var t=' '+text.toLowerCase()+' ';
  return /\bgive me\b/.test(t) ||
    /\b(a|an|the|six|three|twelve|\d+)\b.{0,20}\b(forest|desert|ocean|city|creature|mountain|alien|misty|sunset|beach|jungle|night)\b/.test(t);
}

/* ================= 2D renderer (window mode) ================= */
function makeRidge(rnd){
  var p=new Float32Array(256);
  for (var i=0;i<256;i++) p[i]=rnd();
  function n(x){
    var xi=Math.floor(x), xf=x-xi;
    var a=p[xi&255], b=p[(xi+1)&255], u=xf*xf*(3-2*xf);
    return a+(b-a)*u;
  }
  return function(x){ return n(x)*0.55+n(x*2.7)*0.28+n(x*6.1)*0.17; };
}
function renderScene2D(cv, spec){
  var ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
  var rnd=streamFrom('stream:render:'+spec.seed);
  var mood=MOODS[spec.mood]||MOODS.day;
  var sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,mood.sky[0]); sky.addColorStop(1,mood.sky[1]);
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=mood.sun; ctx.globalAlpha=0.9;
  ctx.beginPath(); ctx.arc(W*(0.2+rnd()*0.6),H*(0.12+rnd()*0.2),H*0.07,0,7); ctx.fill(); ctx.globalAlpha=1;
  var ridge=makeRidge(rnd);
  ctx.fillStyle='rgba(90,100,115,0.8)';
  ctx.beginPath(); ctx.moveTo(0,H);
  for (var x=0;x<=W;x+=4) ctx.lineTo(x,H*0.42+(ridge(x*0.008)-0.5)*H*0.5);
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  var ridge2=makeRidge(rnd);
  ctx.fillStyle=mood.ground[0];
  ctx.beginPath(); ctx.moveTo(0,H);
  for (var x2=0;x2<=W;x2+=4) ctx.lineTo(x2,H*0.62+(ridge2(x2*0.012+9)-0.5)*H*0.42);
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  if (spec.water){
    ctx.fillStyle='rgba(70,130,180,0.75)'; ctx.fillRect(0,H*0.72,W,H*0.28);
  }
  if (hasComp(spec,'vegetation')){
    var trnd=streamFrom('stream:trees:'+spec.seed);
    for (var ti=0,nT=6+Math.floor(trnd()*10);ti<nT;ti++){
      var tx=trnd()*W, th=H*(0.10+trnd()*0.16), ty=H*0.66+(trnd()-0.5)*H*0.2, s=0.7+trnd()*0.7;
      ctx.fillStyle='rgba(30,40,28,0.9)'; ctx.fillRect(tx-1.5*s,ty-th*0.5,3*s,th*0.5);
      ctx.fillStyle=mood.ground[1];
      for (var bi=0;bi<5;bi++){
        ctx.beginPath(); ctx.arc(tx+(trnd()-0.5)*th*0.5*s, ty-th*0.55+(trnd()-0.5)*th*0.35*s, th*0.22*s*(0.7+trnd()*0.6),0,7); ctx.fill();
      }
    }
  }
  if (hasComp(spec,'softbody-creatures')){
    var crnd=streamFrom('stream:cre:'+spec.seed);
    for (var ci=0,nC=1+Math.floor(crnd()*4);ci<nC;ci++){
      var cx=crnd()*W, cy=H*(0.68+crnd()*0.12), cs=0.5+crnd()*0.9, dir=crnd()>0.5?1:-1;
      ctx.fillStyle='rgba(20,18,16,0.92)';
      ctx.beginPath(); ctx.ellipse(cx,cy,26*cs,11*cs,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx+dir*26*cs,cy-10*cs,10*cs,7*cs,dir*0.5,0,7); ctx.fill();
      for (var li=0;li<4;li++) ctx.fillRect(cx-16*cs+li*11*cs-2*cs,cy+4*cs,4*cs,20*cs);
    }
  }
  var vg=ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.9);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.4)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);
}

/* ================= 3D: matrices ================= */
function mI(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
function mMul(a,b){ var o=new Float32Array(16);
  for (var c=0;c<4;c++) for (var r=0;r<4;r++)
    o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
  return o; }
function mT(x,y,z){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]); }
function mRY(a){ var c=Math.cos(a),s=Math.sin(a);
  return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
function mRX(a){ var c=Math.cos(a),s=Math.sin(a);
  return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
function mS(x,y,z){ return new Float32Array([x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]); }
function mPersp(fovy,asp,n,f){ var t=1/Math.tan(fovy/2);
  return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0]); }
function mLook(eye,at){
  var zx=eye[0]-at[0],zy=eye[1]-at[1],zz=eye[2]-at[2];
  var l=Math.hypot(zx,zy,zz)||1; zx/=l; zy/=l; zz/=l;
  var xx=zy,xy=-zx,xz=0; // up=(0,1,0) cross z
  // proper: x = up × z
  xx=1*zz-0*zy; xy=0*zx-0*zz; xz=0*zy-1*zx;
  l=Math.hypot(xx,xy,xz)||1; xx/=l; xy/=l; xz/=l;
  var yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  return new Float32Array([xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]), -(yx*eye[0]+yy*eye[1]+yz*eye[2]), -(zx*eye[0]+zy*eye[1]+zz*eye[2]),1]);
}

/* ================= 3D: geometry ================= */
function geoSphere(r,ws,hs){
  var pos=[],nrm=[],col=[],idx=[];
  for (var j=0;j<=hs;j++){
    var th=j/hs*Math.PI, st=Math.sin(th), ct=Math.cos(th);
    for (var i=0;i<=ws;i++){
      var ph=i/ws*Math.PI*2, sp=Math.sin(ph), cp=Math.cos(ph);
      pos.push(st*cp*r,ct*r,st*sp*r); nrm.push(st*cp,ct,st*sp); col.push(1,1,1);
    }
  }
  for (var j2=0;j2<hs;j2++) for (var i2=0;i2<ws;i2++){
    var a=j2*(ws+1)+i2,b=a+1,c=a+ws+1,d=c+1;
    idx.push(a,b,c,b,d,c);
  }
  return {pos:pos,nrm:nrm,col:col,idx:idx};
}
function geoCyl(r0,r1,h,seg){
  var pos=[],nrm=[],col=[],idx=[];
  for (var j=0;j<=1;j++){
    var y=(j-0.5)*h, r=j?r1:r0;
    for (var i=0;i<=seg;i++){
      var a=i/seg*Math.PI*2, cx=Math.cos(a), sz=Math.sin(a);
      pos.push(cx*r,y,sz*r); nrm.push(cx,0,sz); col.push(1,1,1);
    }
  }
  for (var i2=0;i2<seg;i2++){
    var a2=i2,b=a2+1,c=a2+seg+1,d=c+1;
    idx.push(a2,c,b,b,c,d);
  }
  // top cap
  var tc=pos.length/3;
  pos.push(0,h/2,0); nrm.push(0,1,0); col.push(1,1,1);
  for (var i3=0;i3<seg;i3++) idx.push(tc, seg+1+i3, seg+1+i3+1);
  return {pos:pos,nrm:nrm,col:col,idx:idx};
}
function geoPlane(size){
  var h=size/2;
  return {pos:[-h,0,-h, h,0,-h, h,0,h, -h,0,h],
    nrm:[0,1,0, 0,1,0, 0,1,0, 0,1,0],
    col:[1,1,1, 1,1,1, 1,1,1, 1,1,1],
    idx:[0,1,2, 0,2,3]};
}
function geoTerrain(nf,size,seg,mood,amp){
  var pos=[],col=[],idx=[];
  var g0=hx(mood.ground[0]), g1=hx(mood.ground[1]);
  for (var j=0;j<=seg;j++) for (var i=0;i<=seg;i++){
    var x=(i/seg-0.5)*size, z=(j/seg-0.5)*size, u=i/seg, v=j/seg;
    var h=(nf(u*3,v*3)*0.55+nf(u*7+9,v*7+3)*0.3+nf(u*15+4,v*15+8)*0.15);
    h=(h-0.45)*2.4*(amp||1);
    var ex=Math.abs(u-0.5)*2, ez=Math.abs(v-0.5)*2;
    var fall=Math.max(0,1-Math.max(ex,ez));
    fall=fall*fall*(3-2*fall);
    h=h*fall-(1-fall)*1.4;
    pos.push(x,h,z);
    var c;
    if (h<-0.2) c=[0.76,0.70,0.55];
    else if (h<0.4){ var f=(h+0.2)/0.6; c=[g0[0]+(g1[0]-g0[0])*f, g0[1]+(g1[1]-g0[1])*f, g0[2]+(g1[2]-g0[2])*f]; }
    else if (h<0.8) c=[0.45,0.42,0.38];
    else c=[0.9,0.92,0.95];
    col.push(c[0],c[1],c[2]);
  }
  // normals by finite differences
  var nrm=new Float32Array(pos.length);
  function H(ii,jj){
    ii=Math.max(0,Math.min(seg,ii)); jj=Math.max(0,Math.min(seg,jj));
    return pos[(jj*(seg+1)+ii)*3+1];
  }
  var step=size/seg;
  for (var j2=0;j2<=seg;j2++) for (var i2=0;i2<=seg;i2++){
    var dx=(H(i2+1,j2)-H(i2-1,j2))/(2*step), dz=(H(i2,j2+1)-H(i2,j2-1))/(2*step);
    var nx=-dx, ny=1, nz=-dz, l=Math.hypot(nx,ny,nz)||1;
    var o=(j2*(seg+1)+i2)*3;
    nrm[o]=nx/l; nrm[o+1]=ny/l; nrm[o+2]=nz/l;
  }
  for (var j3=0;j3<seg;j3++) for (var i3=0;i3<seg;i3++){
    var a=j3*(seg+1)+i3,b=a+1,c=a+seg+1,d=c+1;
    idx.push(a,b,c,b,d,c);
  }
  return {pos:pos,nrm:Array.from(nrm),col:col,idx:idx};
}
function terrainHeightAt(d,x,z){
  var size=12, u=x/size+0.5, v=z/size+0.5;
  u=Math.max(0,Math.min(1,u)); v=Math.max(0,Math.min(1,v));
  var nf=d.nf;
  var h=(nf(u*3,v*3)*0.55+nf(u*7+9,v*7+3)*0.3+nf(u*15+4,v*15+8)*0.15);
  h=(h-0.45)*2.4*(d.amp||1);
  var ex=Math.abs(u-0.5)*2, ez=Math.abs(v-0.5)*2;
  var fall=Math.max(0,1-Math.max(ex,ez));
  fall=fall*fall*(3-2*fall);
  return h*fall-(1-fall)*1.4;
}

/* ================= 3D: shaders ================= */
var VS='attribute vec3 p;attribute vec3 n;attribute vec3 c;'+
'uniform mat4 uMVP;uniform mat4 uModel;uniform vec3 uTint;uniform vec3 uLight;uniform vec3 uCam;'+
'varying vec3 vc;varying float vf;'+
'void main(){vec4 wp=uModel*vec4(p,1.0);gl_Position=uMVP*wp;'+
'vec3 wn=normalize(mat3(uModel)*n);'+
'float dif=max(dot(wn,normalize(uLight)),0.0);'+
'vc=c*uTint*(0.38+0.62*dif);vf=length(wp.xyz-uCam);}';
var FS='precision mediump float;varying vec3 vc;varying float vf;'+
'uniform vec3 uFog;uniform vec2 uFogR;uniform float uAlpha;'+
'void main(){float f=smoothstep(uFogR.x,uFogR.y,vf);'+
'gl_FragColor=vec4(mix(vc,uFog,f),uAlpha);}';
var VS_TEX='attribute vec3 p;attribute vec2 uv;uniform mat4 uMVP;uniform mat4 uModel;varying vec2 vuv;'+
'void main(){vuv=uv;gl_Position=uMVP*uModel*vec4(p,1.0);}';
var FS_TEX='precision mediump float;varying vec2 vuv;uniform sampler2D uTex;'+
'void main(){gl_FragColor=texture2D(uTex,vuv);}';

function makeProg(gl,vs,fs){
  function sh(t,s){ var h=gl.createShader(t); gl.shaderSource(h,s); gl.compileShader(h);
    if(!gl.getShaderParameter(h,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(h));
    return h; }
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));
  gl.linkProgram(pr); gl.useProgram(pr);
  return pr;
}
function Mesh(gl,geo){
  this.count=geo.idx.length;
  function buf(d){ var b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STATIC_DRAW); return b; }
  this.pb=buf(geo.pos); this.nb=buf(geo.nrm); this.cb=buf(geo.col);
  var ib=gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(geo.idx),gl.STATIC_DRAW);
  this.ib=ib;
}
function bindA(gl,loc,b,sz){
  gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc,sz,gl.FLOAT,false,0,0);
}

/* ================= dioramas ================= */
function buildDiorama(spec){
  var rnd=streamFrom('stream:3d:'+spec.seed);
  var mood=MOODS[spec.mood]||MOODS.day;
  var nf=makeNoise(hashSeed('stream:nf:'+spec.seed),64,64);
  var d={spec:spec, cx:0, nf:nf, mood:mood, trees:[], creatures:[], structs:[],
         water:spec.water, amp:CONFIG.terrainAmp};
  if (hasComp(spec,'vegetation')){
    var nT=Math.round((8+Math.floor(rnd()*10))*CONFIG.treeCount);
    for (var i=0;i<nT;i++)
      d.trees.push({x:(rnd()-0.5)*10, z:(rnd()-0.5)*10, s:(0.7+rnd()*0.8)*CONFIG.treeScale});
  }
  if (hasComp(spec,'softbody-creatures')){
    var nC=Math.max(1,Math.round((1+Math.floor(rnd()*3))*CONFIG.creatureCount));
    for (var j=0;j<nC;j++)
      d.creatures.push({x:(rnd()-0.5)*5, z:(rnd()-0.5)*5, s:(0.8+rnd()*0.7)*CONFIG.creatureScale,
        yaw:rnd()*Math.PI*2, phase:rnd()*7, tint:rnd()});
  }
  if (hasComp(spec,'mesh-builder')){
    var nS=2+Math.floor(rnd()*3);
    for (var k=0;k<nS;k++)
      d.structs.push({x:(rnd()-0.5)*8, z:(rnd()-0.5)*8, w:0.8+rnd()*1.2, h:1.5+rnd()*3});
  }
  return d;
}

/* ================= the tool ================= */
TOOLS.stream = { mount: function(host){
  var dev=false, voiceOn=false, rec=null;
  var dioramas=[], focusIdx=0;
  var seedBase=Math.floor(Math.random()*0xffffffff).toString(16);

  host.innerHTML =
    '<style>'+
    '.stm{font-family:system-ui,sans-serif;color:#dfe8f2;max-width:860px;margin:0 auto;padding:0 0 96px;}'+
    '.stm-head{display:flex;align-items:center;gap:10px;padding:14px 14px 6px;}'+
    '.stm-title{font-size:17px;font-weight:600;}'+
    '.stm-sub{font-size:12px;color:#8fa3b8;}'+
    '.stm-dev{margin-left:auto;font-size:11px;color:#8fa3b8;background:none;border:1px solid #2a3a4d;border-radius:20px;padding:4px 10px;cursor:pointer;}'+
    '.stm-dev.on{color:#ffd479;border-color:#ffd479;}'+
    '.stm-voice{font-size:11px;color:#8fa3b8;background:none;border:1px solid #2a3a4d;border-radius:20px;padding:4px 10px;cursor:pointer;}'+
    '.stm-voice.on{color:#7fe0a8;border-color:#7fe0a8;}'+
    '#stm-gl{width:100%;height:440px;display:block;border-radius:12px;touch-action:none;cursor:grab;}'+
    '.stm-kb{animation:stmkb 24s ease-in-out infinite alternate;}'+
    '@keyframes stmkb{from{transform:scale(1) translate(0,0);}to{transform:scale(1.12) translate(-2%,1.5%);}}'+
    '.stm-focus{display:flex;align-items:center;gap:8px;padding:8px 4px;font-size:13px;color:#c8d6e4;}'+
    '.stm-focus .nav{background:#12202f;border:1px solid #2a3a4d;color:#9fc2e0;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:14px;}'+
    '.stm-focus .acts{margin-left:auto;display:flex;gap:4px;}'+
    '.stm-focus .acts button{background:none;border:none;color:#7fd4ff;font-size:12px;cursor:pointer;padding:4px 6px;}'+
    '.stm-ing{font-size:12px;color:#9fb2c8;padding:8px 4px;border-left:2px solid #2a3a4d;margin:6px 0 6px 4px;padding-left:10px;display:none;}'+
    '.stm-ing .comp{display:flex;gap:8px;padding:3px 0;}'+
    '.stm-ing .seed{font-family:monospace;color:#5f7a92;}'+
    '.stm-spec{width:100%;min-height:80px;background:#0a1220;color:#bfe3ff;border:1px solid #2a3a4d;border-radius:8px;font-family:monospace;font-size:11px;padding:8px;margin-top:6px;}'+
    '.stm-bar{position:fixed;bottom:0;left:0;right:0;background:rgba(8,15,25,0.96);border-top:1px solid #1c2a3d;padding:10px 14px;z-index:50;}'+
    '.stm-row{display:flex;gap:8px;align-items:center;max-width:860px;margin:0 auto;}'+
    '.stm-in{flex:1;background:#0e1826;border:1px solid #2a3a4d;color:#e8f1fa;border-radius:24px;padding:10px 16px;font-size:14px;outline:none;}'+
    '.stm-nudge{font-size:10px;color:#5f7a92;text-align:center;padding:4px 0 0;max-width:860px;margin:0 auto;}'+
    '</style>'+
    '<div class="stm">'+
      '<div class="stm-head"><div><div class="stm-title">Stream</div>'+
      '<div class="stm-sub" id="stm-sub">say what you want — worlds land in the space</div></div>'+
      '<button class="stm-voice" id="stm-voice">🔊 voice off</button>'+
      '<button class="stm-dev" id="stm-boop" style="color:#7fd4ff;border-color:#7fd4ff;">boop → screen</button>'+
      '<span id="stm-tune-note" style="font-size:11px;color:#7fe0a8;opacity:0;transition:opacity .4s;"></span>'+
      '<button class="stm-dev" id="stm-dev">dev</button></div>'+
      '<canvas id="stm-gl" width="860" height="440"></canvas>'+
      '<canvas id="stm-screen" width="860" height="440" style="display:none;width:100%;border-radius:12px;"></canvas>'+
      '<div class="stm-focus"><button class="nav" id="stm-prev">◀</button>'+
      '<span id="stm-cap" style="flex:1"></span>'+
      '<span class="acts"><button id="stm-more">↻ more like this</button>'+
      '<button id="stm-done">✓ that\u2019s it</button>'+
      '<button id="stm-ing">ingredients</button></span>'+
      '<button class="nav" id="stm-next">▶</button></div>'+
      '<div class="stm-ing" id="stm-ingbox"></div>'+
      '<div class="stm-ing" id="stm-tunebox" style="display:none;"></div>'+
    '</div>'+
    '<div class="stm-bar"><div class="stm-row">'+
      '<input class="stm-in" id="stm-in" placeholder="a forest with creatures at sunset — or &quot;give me six&quot;" />'+
    '</div><div class="stm-nudge" id="stm-nudge">tap 🔊 once, then just talk. typing works too.</div></div>';

  var cv=host.querySelector('#stm-gl');
  var gl=cv.getContext('webgl',{antialias:true});
  if (!gl){ host.querySelector('.stm').innerHTML='<div style="padding:40px;color:#8fa3b8">WebGL unavailable.</div>'; return; }
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  var pr=makeProg(gl,VS,FS);
  var u={ uMVP:gl.getUniformLocation(pr,'uMVP'), uModel:gl.getUniformLocation(pr,'uModel'),
    uTint:gl.getUniformLocation(pr,'uTint'), uAlpha:gl.getUniformLocation(pr,'uAlpha'),
    uLight:gl.getUniformLocation(pr,'uLight'), uCam:gl.getUniformLocation(pr,'uCam'),
    uFog:gl.getUniformLocation(pr,'uFog'), uFogR:gl.getUniformLocation(pr,'uFogR'),
    aP:gl.getAttribLocation(pr,'p'), aN:gl.getAttribLocation(pr,'n'), aC:gl.getAttribLocation(pr,'c') };
  var prT=makeProg(gl,VS_TEX,FS_TEX);
  var ut={ uMVP:gl.getUniformLocation(prT,'uMVP'), uModel:gl.getUniformLocation(prT,'uModel'),
    uTex:gl.getUniformLocation(prT,'uTex'),
    aP:gl.getAttribLocation(prT,'p'), aUV:gl.getAttribLocation(prT,'uv') };

  /* shared unit meshes */
  var mBall=new Mesh(gl,geoSphere(1,10,8));
  var mCyl=new Mesh(gl,geoCyl(1,1,2,8));
  var mCone=new Mesh(gl,geoCyl(0.02,1,2,8));
  var mPlane=new Mesh(gl,geoPlane(1));
  function drawMesh(m,model,mvp,tint,alpha){
    gl.useProgram(pr);
    gl.uniformMatrix4fv(u.uMVP,false,mvp);
    gl.uniformMatrix4fv(u.uModel,false,model);
    gl.uniform3fv(u.uTint,tint); gl.uniform1f(u.uAlpha,alpha==null?1:alpha);
    bindA(gl,u.aP,m.pb,3); bindA(gl,u.aN,m.nb,3); bindA(gl,u.aC,m.cb,3);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);
    gl.drawElements(gl.TRIANGLES,m.count,gl.UNSIGNED_SHORT,0);
  }

  /* camera */
  var cam={yaw:0.6,pitch:0.55,dist:20,tx:0,ty:1.5,tz:0,
           gtx:0,gty:1.5,gtz:0,gdist:20,gyaw:0.6};
  function camPos(){
    return [cam.tx+Math.cos(cam.yaw)*Math.cos(cam.pitch)*cam.dist,
            cam.ty+Math.sin(cam.pitch)*cam.dist,
            cam.tz+Math.sin(cam.yaw)*Math.cos(cam.pitch)*cam.dist];
  }
  var dragging=false,lx=0,ly=0,moved=0;
  cv.addEventListener('pointerdown',function(e){ dragging=true; lx=e.clientX; ly=e.clientY; moved=0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove',function(e){
    if(!dragging) return;
    var dx=e.clientX-lx, dy=e.clientY-ly; lx=e.clientX; ly=e.clientY; moved+=Math.abs(dx)+Math.abs(dy);
    cam.yaw-=dx*0.005; cam.gyaw=cam.yaw;
    cam.pitch=Math.max(0.12,Math.min(1.35,cam.pitch+dy*0.005));
  });
  cv.addEventListener('pointerup',function(e){
    dragging=false;
    if (moved<8) pick(e);
  });
  cv.addEventListener('wheel',function(e){
    e.preventDefault();
    cam.dist=Math.max(9,Math.min(46,cam.dist*(1+e.deltaY*0.001)));
    cam.gdist=cam.dist;
  },{passive:false});
  function pick(e){
    var r=cv.getBoundingClientRect();
    var nx=((e.clientX-r.left)/r.width)*2-1, ny=-(((e.clientY-r.top)/r.height)*2-1);
    var eye=camPos(), at=[cam.tx,cam.ty,cam.tz];
    var view=mLook(eye,at), proj=mPersp(0.9,cv.width/cv.height,0.1,200);
    // unproject: ray through NDC
    var fwd=[at[0]-eye[0],at[1]-eye[1],at[2]-eye[2]];
    var fl=Math.hypot(fwd[0],fwd[1],fwd[2]); fwd=[fwd[0]/fl,fwd[1]/fl,fwd[2]/fl];
    var right=[fwd[2]*0-0,0,0]; // compute properly below
    var up=[0,1,0];
    var rx=[fwd[1]*up[2]-fwd[2]*up[1],fwd[2]*up[0]-fwd[0]*up[2],fwd[0]*up[1]-fwd[1]*up[0]];
    var rl=Math.hypot(rx[0],rx[1],rx[2])||1; rx=[rx[0]/rl,rx[1]/rl,rx[2]/rl];
    var ux=[rx[1]*fwd[2]-rx[2]*fwd[1],rx[2]*fwd[0]-rx[0]*fwd[2],rx[0]*fwd[1]-rx[1]*fwd[0]];
    var tan=Math.tan(0.45), asp=cv.width/cv.height;
    var dir=[fwd[0]+rx[0]*nx*tan*asp+ux[0]*ny*tan,
             fwd[1]+rx[1]*nx*tan*asp+ux[1]*ny*tan,
             fwd[2]+rx[2]*nx*tan*asp+ux[2]*ny*tan];
    var dl=Math.hypot(dir[0],dir[1],dir[2]); dir=[dir[0]/dl,dir[1]/dl,dir[2]/dl];
    var best=-1,bd=1e9;
    dioramas.forEach(function(d,i){
      var oc=[d.cx-eye[0],1-eye[1],0-eye[2]];
      var tca=oc[0]*dir[0]+oc[1]*dir[1]+oc[2]*dir[2];
      if (tca<0) return;
      var d2=oc[0]*oc[0]+oc[1]*oc[1]+oc[2]*oc[2]-tca*tca;
      if (d2<49&&tca<bd){ bd=tca; best=i; }
    });
    if (best>=0) setFocus(best);
  }

  var viewMode='world'; // 'world' = in it, using it. 'screen' = watching it.
  function setFocus(i){
    focusIdx=Math.max(0,Math.min(dioramas.length-1,i));
    var d=dioramas[focusIdx];
    if (d){ cam.gtx=d.cx; cam.gty=1.5; cam.gtz=0; }
    updateCap();
    if (viewMode==='screen') drawScreen();
  }
  function drawScreen(){
    var d=dioramas[focusIdx]; if(!d) return;
    var sc=host.querySelector('#stm-screen');
    renderScene2D(sc,d.spec);
  }
  host.querySelector('#stm-boop').onclick=function(){
    var glc=host.querySelector('#stm-gl'), sc=host.querySelector('#stm-screen');
    var btn=host.querySelector('#stm-boop');
    if (viewMode==='world'){
      viewMode='screen';
      glc.style.display='none'; sc.style.display='block';
      sc.classList.add('stm-kb');
      drawScreen();
      btn.textContent='boop → world';
      host.querySelector('#stm-sub').textContent='watching — boop to step inside';
    } else {
      viewMode='world';
      sc.style.display='none'; sc.classList.remove('stm-kb'); glc.style.display='block';
      btn.textContent='boop → screen';
      host.querySelector('#stm-sub').textContent = voiceOn?'listening — say what you want':'say what you want — worlds land in the space';
    }
  };
  function updateCap(){
    var d=dioramas[focusIdx];
    host.querySelector('#stm-cap').innerHTML=d?
      '<b>'+esc(d.spec.caption)+'</b> <span style="color:#5f7a92">'+(focusIdx+1)+' / '+dioramas.length+'</span>':'';
    var ib=host.querySelector('#stm-ingbox');
    ib.style.display='none'; ib.innerHTML='';
  }

  /* diorama GL resources */
  function ensureGL(d){
    if (d.gl) return;
    d.gl={ terrain:new Mesh(gl,geoTerrain(d.nf,12,40,d.mood,d.amp)) };
    if (d.spec.present==='window'){
      var wc=document.createElement('canvas'); wc.width=320; wc.height=200;
      renderScene2D(wc,d.spec);
      var tx=gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D,tx);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,wc);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      d.gl.winTex=tx;
    }
  }

  function drawDiorama(d,time,mvp,eye){
    ensureGL(d);
    var base=mT(d.cx,0,0);
    gl.useProgram(pr);
    gl.uniform3fv(u.uLight,[0.5,0.8,0.4]);
    gl.uniform3fv(u.uCam,eye);
    var fogC=hx(d.mood.fog);
    gl.uniform3fv(u.uFog,fogC); gl.uniform2fv(u.uFogR,[30/CONFIG.fogDensity,90/CONFIG.fogDensity]);
    if (d.spec.present==='window'){
      // framed portal carrying the 2D stream view
      drawMesh(mBall,mMul(base,mMul(mT(0,2.2,0),mS(2.6,1.7,0.2))),mvp,[0.12,0.14,0.18],1);
      gl.useProgram(prT);
      gl.uniformMatrix4fv(ut.uMVP,false,mvp);
      gl.uniformMatrix4fv(ut.uModel,false,mMul(base,mT(0,2.2,0.12)));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D,d.gl.winTex);
      gl.uniform1i(ut.uTex,0);
      var qp=new Mesh(gl,{pos:[-2.3,-1.4,0, 2.3,-1.4,0, 2.3,1.4,0, -2.3,1.4,0],
        nrm:[0,0,1,0,0,1,0,0,1,0,0,1], col:[1,1,1,1,1,1,1,1,1,1,1,1],
        idx:[0,1,2,0,2,3], uv:true});
      // build a UV-carrying quad manually
      bindA(gl,ut.aP,qp.pb,3);
      var uvb=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,uvb);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0, 1,0, 1,1, 0,1]),gl.STATIC_DRAW);
      gl.enableVertexAttribArray(ut.aUV); gl.vertexAttribPointer(ut.aUV,2,gl.FLOAT,false,0,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,qp.ib);
      gl.drawElements(gl.TRIANGLES,6,gl.UNSIGNED_SHORT,0);
      gl.useProgram(pr);
      return;
    }
    // terrain
    drawMesh(d.gl.terrain,mMul(base,mI()),mvp,[1,1,1],1);
    // water
    if (d.water){
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      drawMesh(mPlane,mMul(base,mMul(mT(0,CONFIG.waterLevel+Math.sin(time*1.2)*0.03,0),mS(12,1,12))),mvp,[0.25,0.5,0.75],0.72);
      gl.disable(gl.BLEND);
    }
    // trees
    d.trees.forEach(function(t){
      var y=terrainHeightAt(d,t.x,t.z);
      var m=mMul(base,mMul(mT(t.x,y-0.05,t.z),mS(t.s,t.s,t.s)));
      drawMesh(mCyl,mMul(m,mT(0,0.8,0)),mvp,[0.32,0.22,0.14],1);
      var g=hx(d.mood.ground[1]);
      drawMesh(mCone,mMul(m,mT(0,2.3,0)),mvp,[g[0]*0.9,g[1]*0.9,g[2]*0.9],1);
    });
    // structures
    d.structs.forEach(function(s2){
      var y=terrainHeightAt(d,s2.x,s2.z);
      var m=mMul(base,mT(s2.x,y+s2.h/2-0.1,s2.z));
      drawMesh(mCyl,mMul(m,mS(s2.w,s2.h,s2.w)),mvp,[0.16,0.17,0.2],1);
    });
    // creatures: simple primitive quadrupeds, idle motion
    d.creatures.forEach(function(c){
      var y=terrainHeightAt(d,c.x,c.z);
      var bob=Math.sin(time*2+c.phase)*0.05;
      var m0=mMul(base,mMul(mT(c.x,y,c.z),mMul(mRY(c.yaw),mS(c.s,c.s,c.s))));
      var tints=[[0.45,0.36,0.28],[0.5,0.5,0.52],[0.36,0.44,0.3]];
      var tn=tints[Math.floor(c.tint*3)%3];
      drawMesh(mBall,mMul(m0,mMul(mT(0,1.0+bob,0),mS(1.15,0.6,0.6))),mvp,tn,1); // body
      drawMesh(mBall,mMul(m0,mT(1.2,1.35+bob,0)),mvp,tn,1); // head
      drawMesh(mBall,mMul(m0,mMul(mT(1.55,1.2+bob,0),mS(0.45,0.35,0.35))),mvp,[tn[0]*0.8,tn[1]*0.8,tn[2]*0.8],1); // muzzle
      for (var li=0;li<4;li++){
        var lxz=[[-0.7,0.32],[0.7,0.32],[-0.7,-0.32],[0.7,-0.32]][li];
        drawMesh(mCyl,mMul(m0,mMul(mT(lxz[0],0.45,lxz[1]),mS(0.14,0.9,0.14))),mvp,[tn[0]*0.7,tn[1]*0.7,tn[2]*0.7],1);
      }
      drawMesh(mCyl,mMul(m0,mMul(mT(-1.3,1.1+bob,0),mMul(mRY(0),mS(0.08,1.0,0.08)))),mvp,[tn[0]*0.7,tn[1]*0.7,tn[2]*0.7],1); // tail
    });
  }

  /* main loop */
  var startT=performance.now();
  function frame(){
    var time=(performance.now()-startT)/1000;
    // camera glide
    cam.tx+=(cam.gtx-cam.tx)*0.06; cam.ty+=(cam.gty-cam.ty)*0.06; cam.tz+=(cam.gtz-cam.tz)*0.06;
    cam.dist+=(cam.gdist-cam.dist)*0.08;
    var mood0=dioramas.length?dioramas[focusIdx].mood:'day';
    var sky=hx((MOODS[mood0]||MOODS.day).sky[0]);
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(sky[0],sky[1],sky[2],1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var eye=camPos();
    var mvp=mMul(mPersp(0.9,cv.width/cv.height,0.1,220),mLook(eye,[cam.tx,cam.ty,cam.tz]));
    dioramas.forEach(function(d){ drawDiorama(d,time,mvp,eye); });
    requestAnimationFrame(frame);
  }

  /* flow: speak/type → dioramas land downstream */
  function clampNum(v,k){
    if (k==='spacing') return Math.max(8,Math.min(40,v));
    if (k==='waterLevel') return Math.max(-0.5,Math.min(1.2,v));
    if (k==='fogDensity') return Math.max(0.3,Math.min(3,v));
    return Math.max(0.25,Math.min(3,v));
  }
  function fmtN(v){ return (Math.round(v*100)/100).toString(); }
  function tuneNote(msg){
    var el=host.querySelector('#stm-tune-note');
    if(!el) return;
    el.textContent=msg; el.style.opacity=1;
    clearTimeout(el._t); el._t=setTimeout(function(){ el.style.opacity=0; },2600);
  }
  function rebuildAll(){
    dioramas.forEach(function(d,i){
      var nd=buildDiorama(d.spec);
      nd.cx=i*CONFIG.spacing;
      dioramas[i]=nd;
    });
    var d=dioramas[focusIdx];
    if (d) cam.gtx=d.cx;
  }
  function applySelfEdit(se,text){
    if (se.key==='__reset__'){
      CONFIG=JSON.parse(JSON.stringify(CONFIG_DEFAULTS));
    } else if (typeof se.val==='number'){
      CONFIG[se.key]=clampNum(CONFIG[se.key]*se.val,se.key);
    } else {
      var dv=parseFloat(se.val.slice(1));
      CONFIG[se.key]=clampNum(CONFIG[se.key]+(se.val.charAt(0)==='+'?dv:-dv),se.key);
    }
    saveConfig();
    rebuildAll();
    tuneNote('tuned \u00b7 '+text+' \u2192 '+se.key+' = '+fmtN(CONFIG[se.key]));
    refreshTunePanel();
  }
  function flow(text){
    var se=parseSelfEdit(text);
    if (se && !looksLikeScene(text)){ applySelfEdit(se,text); return; }
    var parsed=parseInput(text);
    for (var i=0;i<parsed.count;i++){
      var spec=makeScene(seedBase+':'+Date.now()+':'+Math.random(), dioramas.length, parsed, 'f'+i);
      spec.caption=text;
      var d=buildDiorama(spec);
      d.cx=dioramas.length*CONFIG.spacing;
      dioramas.push(d);
    }
    setFocus(dioramas.length-1);
  }

  /* UI wiring */
  host.querySelector('#stm-prev').onclick=function(){ setFocus(focusIdx-1); };
  host.querySelector('#stm-next').onclick=function(){ setFocus(focusIdx+1); };
  host.querySelector('#stm-more').onclick=function(){
    var d=dioramas[focusIdx]; if(!d) return;
    for (var i=0;i<3;i++){
      var p={comps:d.spec.comps,mood:d.spec.mood,water:d.spec.water,present:d.spec.present,
             raw:'more like "'+d.spec.caption+'"'};
      var spec=makeScene(d.spec.seed+':v'+i,dioramas.length,p,'m'+i);
      spec.caption=p.raw;
      var nd=buildDiorama(spec); nd.cx=dioramas.length*CONFIG.spacing; dioramas.push(nd);
    }
    setFocus(dioramas.length-1);
  };
  host.querySelector('#stm-done').onclick=function(){
    var d=dioramas[focusIdx]; if(!d) return;
    d.spec.settled=true;
    host.querySelector('#stm-done').textContent='✓ settled';
    setTimeout(function(){ host.querySelector('#stm-done').innerHTML='✓ that\u2019s it'; },1500);
  };
  host.querySelector('#stm-ing').onclick=function(){
    var d=dioramas[focusIdx]; if(!d) return;
    var ib=host.querySelector('#stm-ingbox');
    if (ib.style.display==='block'){ ib.style.display='none'; ib.innerHTML=''; return; }
    var h='';
    d.spec.comps.forEach(function(cid){
      var c=COMPONENTS[cid]||{label:cid};
      h+='<div class="comp"><span>'+esc(c.label)+'</span><span class="seed">seed '+esc(d.spec.seed)+'</span>'+
         (dev?'<span class="seed">'+(d.spec.playerVisible?'player-visible':'dev-only')+'</span>':'')+'</div>';
    });
    h+='<div class="comp"><span>presentation</span><span class="seed">'+esc(d.spec.present)+'</span></div>';
    if (dev){
      h+='<textarea class="stm-spec" id="stm-specx">'+esc(JSON.stringify(d.spec,null,1))+'</textarea><br>'+
         '<button id="stm-apply" style="color:#7fd4ff;background:none;border:none;font-size:12px;cursor:pointer;">apply spec</button> '+
         '<button id="stm-vis" style="color:#7fd4ff;background:none;border:none;font-size:12px;cursor:pointer;">toggle player-visible</button> '+
         '<button id="stm-present" style="color:#7fd4ff;background:none;border:none;font-size:12px;cursor:pointer;">toggle diorama/window</button>';
    } else {
      h+='<div style="color:#5f7a92;margin-top:4px;">'+d.spec.comps.length+' real components, one seed.</div>';
    }
    ib.innerHTML=h; ib.style.display='block';
    if (dev){
      host.querySelector('#stm-apply').onclick=function(){
        try{
          var ns=JSON.parse(host.querySelector('#stm-specx').value);
          var idx=dioramas.indexOf(d);
          for (var k in ns) d.spec[k]=ns[k];
          var nd2=buildDiorama(d.spec); nd2.cx=d.cx; nd2.gl=null;
          dioramas[idx]=nd2; updateCap();
          ib.style.display='none'; ib.innerHTML='';
        }catch(e){ alert('bad JSON'); }
      };
      host.querySelector('#stm-vis').onclick=function(){ d.spec.playerVisible=!d.spec.playerVisible;
        host.querySelector('#stm-ing').onclick(); host.querySelector('#stm-ing').onclick(); };
      host.querySelector('#stm-present').onclick=function(){
        d.spec.present=d.spec.present==='diorama'?'window':'diorama';
        d.gl=null;
        host.querySelector('#stm-ing').onclick(); host.querySelector('#stm-ing').onclick(); };
    }
  };
  var devBtn=host.querySelector('#stm-dev');
  devBtn.onclick=function(){ dev=!dev; devBtn.classList.toggle('on',dev); };

  var input=host.querySelector('#stm-in');
  input.addEventListener('keydown',function(e){
    if (e.key==='Enter'&&input.value.trim()){ flow(input.value.trim()); input.value=''; }
  });

  /* voice: one tap, then just talk. coherence gate drops non-requests. */
  var vBtn=host.querySelector('#stm-voice');
  var nudge=host.querySelector('#stm-nudge');
  vBtn.onclick=function(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR){ nudge.textContent='voice not available here — typing works.'; input.focus(); return; }
    if (voiceOn){ voiceOn=false; try{rec.stop();}catch(e){} vBtn.textContent='🔊 voice off'; vBtn.classList.remove('on');
      nudge.textContent='tap 🔊 once, then just talk. typing works too.'; return; }
    rec=new SR(); rec.continuous=true; rec.interimResults=true; rec.lang='en-US';
    rec.onresult=function(e){
      for (var i=e.resultIndex;i<e.results.length;i++){
        if (e.results[i].isFinal){
          var txt=e.results[i][0].transcript.trim();
          var conf=e.results[i][0].confidence;
          if (txt&&isCoherent(txt,conf)) flow(txt);
          /* incoherent → not a request → ignored, stream stays still */
        }
      }
    };
    rec.onend=function(){ if (voiceOn){ try{rec.start();}catch(e){} } };
    rec.onerror=function(){ /* keep trying; mic permission issues surface here */ };
    try{
      rec.start(); voiceOn=true;
      vBtn.textContent='🔊 listening'; vBtn.classList.add('on');
      nudge.textContent='just talk — coherent requests build, everything else is ignored.';
      host.querySelector('#stm-sub').textContent='listening — say what you want';
    }catch(e){ nudge.textContent='could not start voice — typing works.'; }
  };

  var TUNE_KEYS=[['treeScale','trees size'],['treeCount','trees amount'],['terrainAmp','terrain roughness'],
    ['creatureScale','creatures size'],['creatureCount','creatures amount'],
    ['waterLevel','water level'],['fogDensity','fog'],['spacing','world spacing']];
  function refreshTunePanel(){
    var tb=host.querySelector('#stm-tunebox');
    if (tb&&tb.style.display==='block') buildTunePanel();
  }
  function buildTunePanel(){
    var tb=host.querySelector('#stm-tunebox');
    var h='<div style="margin-bottom:6px;color:#ffd479;">tune the stream itself \u2014 live</div>';
    TUNE_KEYS.forEach(function(k){
      var key=k[0], label=k[1], v=CONFIG[key];
      var min=key==='spacing'?8:(key==='waterLevel'?-0.5:0.25);
      var max=key==='spacing'?40:(key==='waterLevel'?1.2:3);
      var step=key==='spacing'?1:0.05;
      h+='<div style="display:flex;align-items:center;gap:8px;padding:2px 0;">'+
         '<span style="width:130px;">'+label+'</span>'+
         '<input type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+v+'" data-k="'+key+'" style="flex:1">'+
         '<span class="seed" data-v="'+key+'">'+fmtN(v)+'</span></div>';
    });
    h+='<div style="margin-top:6px;"><button id="stm-tune-reset" style="color:#7fd4ff;background:none;border:none;font-size:12px;cursor:pointer;">reset all</button> '+
       '<span style="color:#5f7a92;font-size:11px;">or just say it: "make the trees bigger", "rougher terrain", "reset"</span></div>';
    tb.innerHTML=h; tb.style.display='block';
    Array.prototype.forEach.call(tb.querySelectorAll('input[type=range]'),function(r){
      r.oninput=function(){
        var k=r.getAttribute('data-k');
        CONFIG[k]=clampNum(parseFloat(r.value),k);
        saveConfig(); rebuildAll();
        var lbl=tb.querySelector('[data-v="'+k+'"]'); if(lbl) lbl.textContent=fmtN(CONFIG[k]);
      };
    });
    tb.querySelector('#stm-tune-reset').onclick=function(){
      CONFIG=JSON.parse(JSON.stringify(CONFIG_DEFAULTS)); saveConfig(); rebuildAll(); buildTunePanel();
      tuneNote('tuned \u00b7 reset to defaults');
    };
  }
  /* dev toggle, sticky */
  (function(){
    var db=host.querySelector('#stm-dev');
    try{ if(localStorage.getItem('stream-dev')==='1'){ dev=true; db.classList.add('on'); } }catch(e){}
    var tb2=document.createElement('button');
    tb2.className='stm-dev'; tb2.textContent='tune';
    tb2.style.display=dev?'':'none';
    db.parentNode.insertBefore(tb2,db.nextSibling);
    tb2.onclick=function(){
      var box=host.querySelector('#stm-tunebox');
      if (box.style.display==='block'){ box.style.display='none'; box.innerHTML=''; }
      else buildTunePanel();
    };
    db.onclick=function(){
      dev=!dev; db.classList.toggle('on',dev);
      try{ localStorage.setItem('stream-dev',dev?'1':'0'); }catch(e){}
      tb2.style.display=dev?'':'none';
      if(!dev){ var box=host.querySelector('#stm-tunebox'); box.style.display='none'; box.innerHTML=''; }
    };
  })();
  /* never blank: three starter dioramas */
  [['misty forest',['terrain-core','vegetation','ambience-engine'],'misty',false,'diorama'],
   ['creatures at sunset',['terrain-core','softbody-creatures','ambience-engine'],'sunset',false,'diorama'],
   ['alien shore',['terrain-core','vegetation','ambience-engine'],'alien',true,'window']
  ].forEach(function(s,i){
    var p={comps:s[1],mood:s[2],water:s[3],present:s[4],raw:s[0]};
    var spec=makeScene('starter',i,p,'s'); spec.caption=s[0];
    var d=buildDiorama(spec); d.cx=i*CONFIG.spacing; dioramas.push(d);
  });
  setFocus(0);
  frame();
}};

})();
