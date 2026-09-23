// Fireplace Studio — core/math.js. See README.md for ownership and replacement boundaries.


function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function lerp(a,b,t){ return a+(b-a)*t; }
function sstep(a,b,v){ const t=clamp((v-a)/(b-a),0,1); return t*t*(3-2*t); }
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function cryptoUint32(){ const b=new Uint32Array(1); crypto.getRandomValues(b); return b[0]; }

/* ---------------- matrices (column-major Float32Array[16]) ---------------- */
function mIdent(){ const m=new Float32Array(16); m[0]=m[5]=m[10]=m[15]=1; return m; }
function mMul(a,b){ const o=new Float32Array(16);
  for (let c=0;c<4;c++) for (let r=0;r<4;r++){ let s=0; for (let k=0;k<4;k++) s+=a[k*4+r]*b[c*4+k]; o[c*4+r]=s; }
  return o; }
function mT(x,y,z){ const m=mIdent(); m[12]=x;m[13]=y;m[14]=z; return m; }
function mS(x,y,z){ const m=mIdent(); m[0]=x;m[5]=y;m[10]=z; return m; }
function mRx(a){ const m=mIdent(),c=Math.cos(a),s=Math.sin(a); m[5]=c;m[6]=s;m[9]=-s;m[10]=c; return m; }
function mRy(a){ const m=mIdent(),c=Math.cos(a),s=Math.sin(a); m[0]=c;m[2]=-s;m[8]=s;m[10]=c; return m; }
function mRz(a){ const m=mIdent(),c=Math.cos(a),s=Math.sin(a); m[0]=c;m[1]=s;m[4]=-s;m[5]=c; return m; }
function mPersp(fovy,aspect,near,far){
  const m=new Float32Array(16), f=1/Math.tan(fovy*Math.PI/360);
  m[0]=f/aspect; m[5]=f; m[10]=(far+near)/(near-far); m[11]=-1;
  m[14]=2*far*near/(near-far); return m; }
function mLookAt(eye,ctr,up){
  up=up||[0,1,0];
  let zx=eye[0]-ctr[0], zy=eye[1]-ctr[1], zz=eye[2]-ctr[2];
  let l=Math.hypot(zx,zy,zz); zx/=l;zy/=l;zz/=l;
  let xx=up[1]*zz-up[2]*zy, xy=up[2]*zx-up[0]*zz, xz=up[0]*zy-up[1]*zx;
  l=Math.hypot(xx,xy,xz); xx/=l;xy/=l;xz/=l;
  const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz, yz=zx*xy-zy*xx;
  const m=new Float32Array(16);
  m[0]=xx;m[1]=yx;m[2]=zx;m[4]=xy;m[5]=yy;m[6]=zy;m[8]=xz;m[9]=yz;m[10]=zz;m[15]=1;
  m[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);
  m[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);
  m[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);
  return m; }
function mOrtho(l,r,b,t,n,f){
  const m=new Float32Array(16);
  m[0]=2/(r-l); m[5]=2/(t-b); m[10]=-2/(f-n); m[15]=1;
  m[12]=-(r+l)/(r-l); m[13]=-(t+b)/(t-b); m[14]=-(f+n)/(f-n);
  return m; }
function mInverse(m){
  const o=new Float32Array(16);
  const a00=m[0],a01=m[1],a02=m[2],a03=m[3],a10=m[4],a11=m[5],a12=m[6],a13=m[7],
        a20=m[8],a21=m[9],a22=m[10],a23=m[11],a30=m[12],a31=m[13],a32=m[14],a33=m[15];
  const b00=a00*a11-a01*a10,b01=a00*a12-a02*a10,b02=a00*a13-a03*a10,b03=a01*a12-a02*a11,
        b04=a01*a13-a03*a11,b05=a02*a13-a03*a12,b06=a20*a31-a21*a30,b07=a20*a32-a22*a30,
        b08=a20*a33-a23*a30,b09=a21*a32-a22*a31,b10=a21*a33-a23*a31,b11=a22*a33-a23*a32;
  let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
  if(!det) return mIdent();
  det=1/det;
  o[0]=(a11*b11-a12*b10+a13*b09)*det; o[1]=(a02*b10-a01*b11-a03*b09)*det;
  o[2]=(a31*b05-a32*b04+a33*b03)*det; o[3]=(a22*b04-a21*b05-a23*b03)*det;
  o[4]=(a12*b08-a10*b11-a13*b07)*det; o[5]=(a00*b11-a02*b08+a03*b07)*det;
  o[6]=(a32*b02-a30*b05-a33*b01)*det; o[7]=(a20*b05-a22*b02+a23*b01)*det;
  o[8]=(a10*b10-a11*b08+a13*b06)*det; o[9]=(a01*b08-a00*b10-a03*b06)*det;
  o[10]=(a30*b04-a31*b02+a32*b01)*det; o[11]=(a21*b02-a20*b04-a22*b01)*det;
  o[12]=(a11*b07-a10*b09-a12*b06)*det; o[13]=(a00*b09-a01*b07+a02*b06)*det;
  o[14]=(a31*b01-a30*b03-a32*b00)*det; o[15]=(a20*b03-a21*b01+a22*b00)*det;
  return o; }

export { clamp, cryptoUint32, lerp, mInverse, mLookAt, mMul, mOrtho, mPersp, mRx, mRy, mRz, mS, mT, mulberry32, sstep };
