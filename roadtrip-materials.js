import * as T from './three.module.js';

export function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function rng(seed){let a=hash(seed);return()=>{a+=0x6d2b79f5;let t=Math.imul(a^a>>>15,a|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function ih(x,y,s=17){let h=Math.imul(x,374761393)+Math.imul(y,668265263)+s;h=Math.imul(h^h>>>13,1274126177);return((h^h>>>16)>>>0)/4294967295;}
export function noise(x,y,s=0){const a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b,fx=u*u*(3-2*u),fy=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(ih(a,b,s),ih(a+1,b,s),fx),T.MathUtils.lerp(ih(a,b+1,s),ih(a+1,b+1,s),fx),fy);}
export function fbm(x,z,s=0){return noise(x,z,s)*.55+noise(x*2.07,z*2.07,s+19)*.27+noise(x*4.31,z*4.31,s+53)*.13+noise(x*8.53,z*8.53,s+71)*.05;}

// Four 2048 × 512 height-baked surface bands: moss, asphalt, limestone, bark. Normals
// and cavity AO are baked from that height field; no downloaded textures.
export function bakeMaterials(renderer){
 const W=2048,H=512,N=W*H,colors=[[107,127,72],[59,67,62],[133,140,116],[83,76,55]],names=['ground','road','rock','bark'];
 const result={mapSize:[W,H],textures:[]};
 for(let k=0;k<4;k++){
  const heights=new Float32Array(N),albedo=new Uint8Array(N*4),normal=new Uint8Array(N*4),orm=new Uint8Array(N*4);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x,n=ih(x,y,k*917),b=noise(x/48,y/48,100+k),c=noise(x/11,y/11,500+k);
   let h=.45*b+.3*c+.25*n;
   if(k===1)h=.8*n+.2*c;
   if(k===2)h=.5*b+.18*c+.08*n+.24*Math.abs(Math.sin(x*.043+y*.09+3*b));
   if(k===3)h=.3*b+.18*n+.52*Math.pow(Math.abs(Math.sin(x*.2+2*Math.sin(y*.009)+c)),.4);
   heights[i]=h;
   const tone=.66+.5*h+(k===1?.07*(n>.92):0);
   for(let j=0;j<3;j++)albedo[i*4+j]=clamp(colors[k][j]*tone+(n-.5)*14,0,255);
   albedo[i*4+3]=255;
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x,dx=heights[y*W+(x+1)%W]-heights[y*W+(x+W-1)%W],dy=heights[((y+1)%H)*W+x]-heights[((y+H-1)%H)*W+x];
   const strength=k===1?.45:k===3?2.3:1.6,nn=new T.Vector3(-dx*strength,-dy*strength,1).normalize();
   normal.set([(nn.x*.5+.5)*255,(nn.y*.5+.5)*255,(nn.z*.5+.5)*255,255],i*4);
   const avg=(heights[y*W+(x+8)%W]+heights[((y+8)%H)*W+x])*.5;
   orm.set([clamp(1-Math.max(0,avg-heights[i])*1.8,.55,1)*255,(k===1?.82:.92)*255,0,255],i*4);
  }
  function tex(data,color=false){const t=new T.DataTexture(data,W,H,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());if(color)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;result.textures.push(t);return t;}
  const material=new T.MeshStandardMaterial({map:tex(albedo,true),normalMap:tex(normal),roughnessMap:tex(orm),roughness:1,normalScale:new T.Vector2(k===1?.22:.5,k===1?.22:.5),vertexColors:true});
  material.aoMap=material.roughnessMap;material.aoMapIntensity=.5;result[names[k]]=material;
 }
 // Blend differently rotated/scaled samples continuously, avoiding obvious
 // repetitions without sharp per-tile boundaries or derivative seams.
 result.ground.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`vec2 tuv=vMapUv; vec4 txa=texture2D(map,tuv); vec4 txb=texture2D(map,mat2(.71,-.71,.71,.71)*tuv*.637+vec2(.31,.73)); float tw=.43+.19*sin(tuv.x*.153333+tuv.y*.113333); diffuseColor*=mix(txa,txb,tw);`);
 };
 result.ground.customProgramCacheKey=()=> 'roadtrip-ground-antitile-2';
 return result;
}

export function mergeParts(parts){
 const pos=[],norm=[],uv=[],col=[];
 for(const {g,m=new T.Matrix4(),color=new T.Color('white')} of parts){
  const b=g.index?g.toNonIndexed():g.clone();b.applyMatrix4(m);const p=b.getAttribute('position'),n=b.getAttribute('normal'),u=b.getAttribute('uv');
  for(let i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));norm.push(n.getX(i),n.getY(i),n.getZ(i));uv.push(u?u.getX(i):0,u?u.getY(i):0);col.push(color.r,color.g,color.b);}b.dispose();
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(norm,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',g.getAttribute('uv').clone());g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeBoundingSphere();return g;
}
export function transform(x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){return new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));}

export function plantGeometry(kind,detail){
 const r=rng(kind+'v1'),parts=[],sphere=new T.SphereGeometry(1,detail?12:6,detail?8:4);
 const sp=sphere.getAttribute('position');
 for(let i=0;i<sp.count;i++){const x=sp.getX(i),y=sp.getY(i),z=sp.getZ(i),crinkle=.83+.24*noise(x*7+y*3,z*7,71)+.12*noise(x*19,z*17+y*11,72);sp.setXYZ(i,x*crinkle,y*crinkle,z*crinkle);}sphere.computeVertexNormals();
 const height=kind==='cypress'?14:8.5;
 // LODs keep the same branch positions; only surface tessellation changes.
 const count=kind==='cypress'?58:30;
 for(let i=0;i<count;i++){
  let x,y,z,sx,sy,sz;
  if(kind==='cypress'){
   const t=i/(count-1),angle=i*2.399963;
   const radius=(Math.sin(Math.PI*Math.pow(t,.7))*.92+.08)*(0.7+r()*.5);
   y=1.2+t*height;x=Math.cos(angle)*radius*.66;z=Math.sin(angle)*radius*.66;sx=radius*(.6+r()*.35);sy=.68+r()*.7;sz=sx*(.75+r()*.3);
  }else{const a=i*2.4,rad=1.6*Math.sqrt(r());x=Math.cos(a)*rad;z=Math.sin(a)*rad;y=height*.55+r()*height*.4;sx=1.1+r();sy=.9+r()*1.5;sz=1+r()*1.2;}
  const color=new T.Color().setHSL(.24+r()*.055,.28+r()*.24,.08+.06*r()+y/height*.045);
  parts.push({g:sphere,m:transform(x,y,z,sx,sy,sz,0,r()*6,0),color});
 }
 const foliage=mergeParts(parts);sphere.dispose();
 const trunk=new T.CylinderGeometry(.065,.22,kind==='cypress'?12:5.5,detail?7:5,2);trunk.translate(0,(kind==='cypress'?12:5.5)/2,0);
 const bark=mergeParts([{g:trunk,color:new T.Color(.7,.6,.45)}]);trunk.dispose();
 return {foliage,bark};
}

export function foliageMaterial(){
 const W=512,data=new Uint8Array(W*W*4),normal=new Uint8Array(W*W*4),heights=new Float32Array(W*W);
 for(let y=0;y<W;y++)for(let x=0;x<W;x++){
  const i=y*W+x,fine=noise(x*.45,y*.45,416),branch=Math.pow(Math.abs(Math.sin(x*.20+Math.sin(y*.045)*3+y*.14)),.6),h=.3*noise(x*.037,y*.037,420)+.35*branch+.35*fine;heights[i]=h;
  const tone=.40+.90*h;data.set([Math.min(255,230*tone),Math.min(255,255*tone),Math.min(255,195*tone),255],i*4);
 }
 for(let y=0;y<W;y++)for(let x=0;x<W;x++){
  const dx=(heights[y*W+(x+1)%W]-heights[y*W+(x+W-1)%W])*2.3,dy=(heights[((y+1)%W)*W+x]-heights[((y+W-1)%W)*W+x])*2.3,len=Math.hypot(dx,dy,1);normal.set([(1-dx/len)*127.5,(1-dy/len)*127.5,(1+1/len)*127.5,255],(y*W+x)*4);
 }
 function tex(d,srgb=false){const t=new T.DataTexture(d,W,W);t.wrapS=t.wrapT=T.RepeatWrapping;t.generateMipmaps=true;t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.anisotropy=4;t.repeat.set(3,5);if(srgb)t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;return t;}
 return windMaterial(new T.MeshStandardMaterial({roughness:.96,vertexColors:true,map:tex(data,true),normalMap:tex(normal),normalScale:new T.Vector2(.45,.45)}));
}

export function flowerMaterial(){
 const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d'),r=rng('aster-bake-v1');
 x.lineCap='round';
 for(let i=0;i<42;i++){
  const px=75+r()*870,py=160+r()*650,rr=18+r()*31;
  x.strokeStyle='#385d35';x.lineWidth=3;x.beginPath();x.moveTo(px+(r()-.5)*80,1024);x.quadraticCurveTo(px+30,py+80,px,py);x.stroke();
  x.fillStyle='#5c8045';x.beginPath();x.ellipse(px+17,py+130,27,7,-.8,0,Math.PI*2);x.fill();
  const colors=i%13===0?['#fbf6dd','#bacacc']:['#bdc5ff','#657dcc'];
  for(let j=0;j<15;j++){const a=j/15*Math.PI*2; x.save();x.translate(px,py);x.rotate(a);const g=x.createLinearGradient(0,3,0,rr);g.addColorStop(0,colors[1]);g.addColorStop(1,colors[0]);x.fillStyle=g;x.beginPath();x.ellipse(0,-rr*.56,rr*.14,rr*.59,0,0,Math.PI*2);x.fill();x.restore();}
  x.fillStyle='#b5ba69';x.beginPath();x.arc(px,py,rr*.18,0,7);x.fill();
  x.fillStyle='#eee8a4';for(let j=0;j<9;j++){const a=j*2.4;x.fillRect(px+Math.cos(a)*rr*.1,py+Math.sin(a)*rr*.1,2,2);}
 }
 const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
 return new T.MeshStandardMaterial({map:tex,alphaTest:.45,alphaToCoverage:true,side:T.DoubleSide,roughness:.95,vertexColors:true});
}
export function flowerGeometry(){
 const parts=[];
 for(let i=0;i<3;i++)parts.push({g:new T.PlaneGeometry(2.5,.95),m:transform(0,.44,0,1,1,1,0,i*Math.PI/3,0),color:new T.Color('white')});
 return mergeParts(parts);
}

export function windMaterial(material){
 material.onBeforeCompile=shader=>{
  shader.uniforms.uWindTime={value:0};material.userData.shader=shader;
  shader.vertexShader='uniform float uWindTime;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   #ifdef USE_INSTANCING
   float wave=sin(uWindTime*.62+instanceMatrix[3].x*.17+instanceMatrix[3].z*.09);
   transformed.x+=wave*pow(max(position.y,0.0),1.15)*.009;
   #endif`);
 };material.customProgramCacheKey=()=> 'roadtrip-wind-1';return material;
}
