import * as T from './three.module.js';
import {hash,rng,noise,fbm,clamp,smooth,mergeParts,transform,plantGeometry,flowerGeometry,flowerMaterial,foliageMaterial,windMaterial} from './roadtrip-materials.js';

const CHUNK=128;
export class Valley {
 constructor(scene,materials,seed){
  this.scene=scene;this.mat=materials;this.seed=seed;this.n=hash(seed);this.phase=(this.n%10000)*.001;this.chunks=new Map();this.origin=0;
  this.leaves=foliageMaterial();
  this.flowers=windMaterial(flowerMaterial());this.flowerGeo=flowerGeometry();
  this.species={cypress:[plantGeometry('cypress',true),plantGeometry('cypress',false)],oak:[plantGeometry('oak',true),plantGeometry('oak',false)]};
  const rg=new T.IcosahedronGeometry(1,1),p=rg.getAttribute('position');
  for(let i=0;i<p.count;i++){const a=p.getX(i),b=p.getY(i),c=p.getZ(i),d=.83+noise(a*4,c*4,41)*.4;p.setXYZ(i,a*d,b*d,c*d);}rg.computeVertexNormals();
  this.rockGeo=mergeParts([{g:rg,color:new T.Color(.8,.84,.7)}]);rg.dispose();
  this.lineMat=new T.MeshStandardMaterial({color:'#e3dfb8',roughness:.93,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  this.last=-99999;
 }
 roadX(z){return 42*Math.sin(z/240+this.phase)+23*Math.sin(z/109+this.phase*.3)+65*Math.sin(z/710+this.phase);}
 roadY(z){return 12+5*Math.sin(z/210+this.phase)+2.2*Math.sin(z/87);}
 heightAt(x,z){
  const d=Math.abs(x-this.roadX(z)),p=this.phase;
  const fine=fbm(x*.015,z*.015,this.n)*2-1;
  const hills=Math.pow(fbm(x*.0035+11,z*.0035,this.n+90),1.35);
  const ridges=1-Math.abs(noise(x*.018,z*.008,this.n+2)*2-1);
  const rise=Math.pow(Math.max(0,d-7)*.017,1.23)*(9+52*hills)/(1+Math.pow(d/620,2.1));
  const geological=Math.pow(ridges,4)*smooth(25,200,d)*(7+Math.min(d,650)*.12);
  return this.roadY(z)-.07+smooth(4.1,14,d)*(rise+fine*1.4+geological);
 }
 buildTerrain(index){
  const z0=index*CHUNK,near=index-this.last<8,steps=near?32:12;
  const side=[4,5,8,12,18,25,34,46,62,83,108,135,166,200,240,285,335,390,450,515,585,660,740,825,915,1010,1110,1215,1325,1440,1560];const xs=[...side.map(x=>-x).reverse(),0,...side];
  const p=[],c=[],uv=[],ix=[],normals=[],cols=xs.length;
  for(let j=0;j<=steps;j++){
   const z=z0+j*CHUNK/steps;
   for(let k=0;k<cols;k++){
    const x=this.roadX(z)+xs[k],h=this.heightAt(x,z),d=Math.abs(xs[k]);p.push(x,h,z-z0);uv.push(x*.15,z*.15);
    const normal=new T.Vector3(this.heightAt(x-.6,z)-this.heightAt(x+.6,z),1.2,this.heightAt(x,z-.6)-this.heightAt(x,z+.6)).normalize();normals.push(normal.x,normal.y,normal.z);
    const slope=Math.abs(this.heightAt(x+1,z)-h)+Math.abs(this.heightAt(x,z+1)-h),n=fbm(x*.03,z*.03,this.n);
    const cc=new T.Color().setHSL(.245+n*.07,.27+n*.14,.30+n*.18);
    cc.lerp(new T.Color('#91907a'),smooth(.65,2,slope)*.68);
    const flowers=smooth(5,9,d)*(1-smooth(30,95,d))*smooth(.37,.66,noise(x*.05,z*.05,this.n+71));
    cc.lerp(new T.Color('#6985b1'),flowers*.63);
    const ao=.77+.23*smooth(-.5,1.8,(this.heightAt(x-3,z)+this.heightAt(x+3,z)-h*2)*-.5+1);cc.multiplyScalar(ao);
    c.push(cc.r,cc.g,cc.b);
   }
  }
  for(let j=0;j<steps;j++)for(let k=0;k<cols-1;k++){const a=j*cols+k,b=a+cols;ix.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',g.getAttribute('uv').clone());g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(ix);g.computeBoundingSphere();g.userData.detailed=near;return g;
 }
 ribbon(index,left,right,yOffset=.10){
  const p=[],uv=[],c=[],ix=[],normals=[],N=48,z0=index*CHUNK;
  for(let j=0;j<=N;j++){
   const z=z0+j*CHUNK/N;
   const normal=new T.Vector3(0,1,-(this.roadY(z+.2)-this.roadY(z-.2))/.4).normalize();
   for(const x of [left,right]){normals.push(...normal.toArray());p.push(this.roadX(z)+x,this.roadY(z)+yOffset,z-z0);uv.push((x+4)/8,z*.06);const tone=.72+.05*noise(z*.2,x,52);c.push(tone,tone,tone);}
  }
  for(let j=0;j<N;j++){const a=j*2;ix.push(a,a+2,a+1,a+2,a+3,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',g.getAttribute('uv').clone());g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(ix);g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));return g;
 }
 marks(index){
  const p=[],ix=[],z0=index*CHUNK;
  function quad(a,b,c,d){let i=p.length/3;p.push(...a,...b,...c,...d);ix.push(i,i+2,i+1,i+2,i+3,i+1);}
  for(let z=z0;z<z0+CHUNK;z+=2){
   const end=Math.min(z+2,z0+CHUNK);
   for(const offset of [-3.48,3.48,...((Math.floor(z/2)%6)<2?[0]:[])]){
    const w=offset===0?.075:.055;
    quad([this.roadX(z)+offset-w,this.roadY(z)+.118,z-z0],[this.roadX(z)+offset+w,this.roadY(z)+.118,z-z0],[this.roadX(end)+offset-w,this.roadY(end)+.118,end-z0],[this.roadX(end)+offset+w,this.roadY(end)+.118,end-z0]);
   }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();return g;
 }
 instance(geo,material,transforms,colors=null){
  const m=new T.InstancedMesh(geo,material,transforms.length);
  transforms.forEach((a,i)=>{m.setMatrixAt(i,a);if(colors)m.setColorAt(i,colors[i]);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();return m;
 }
 buildChunk(index,plants){
  const group=new T.Group();group.userData.index=index;const geometries=[];
  const add=(geo,mat)=>{const m=new T.Mesh(geo,mat);group.add(m);geometries.push(geo);return m;};
  const terrain=add(this.buildTerrain(index),this.mat.ground);terrain.receiveShadow=true;group.userData.terrain=terrain;
  const shoulder=add(this.ribbon(index,-4.22,4.22,.005),this.mat.rock);shoulder.receiveShadow=true;
  const asphalt=add(this.ribbon(index,-3.75,3.75),this.mat.road);asphalt.receiveShadow=true;
  add(this.marks(index),this.lineMat);
  group.userData.geometries=geometries;group.userData.lods=[];group.userData.hasPlants=plants;
  if(plants){
   const r=rng(this.seed+':chunk:'+index),z0=index*CHUNK;
   for(const kind of ['cypress','oak']){
    const matrices=[],colors=[];
    const total=kind==='cypress'?56:100;
    for(let i=0;i<total;i++){
     const z=z0+r()*CHUNK,side=r()<.5?-1:1;
     const d=kind==='cypress'?9.5+Math.pow(r(),1.6)*115:13.5+Math.pow(r(),.75)*220;
     const x=this.roadX(z)+side*d,y=this.heightAt(x,z),s=.6+r()*.85;
     matrices.push(transform(x,y-.08,z-z0,s,s*(.85+r()*.38),s,0,r()*6.28,0));colors.push(new T.Color().setHSL(.24+r()*.07,.1+r()*.16,.57+r()*.23));
    }
    const model=this.species[kind],leaves=this.instance(model[1].foliage,this.leaves,matrices,colors),trunks=this.instance(model[1].bark,this.mat.bark,matrices);
    leaves.castShadow=true;leaves.receiveShadow=true;trunks.castShadow=true;group.add(leaves,trunks);group.userData.lods.push({mesh:leaves,high:model[0].foliage,low:model[1].foliage},{mesh:trunks,high:model[0].bark,low:model[1].bark});
   }
   const fm=[],fc=[];
   for(let i=0;i<2400;i++){
    const z=z0+r()*CHUNK,d=4.9+Math.pow(r(),2.1)*48,x=this.roadX(z)+(r()<.5?-d:d),s=.58+r()*.95;
    if(noise(x*.05,z*.05,this.n+71)<.36&&d>9)continue;
    fm.push(transform(x,this.heightAt(x,z)-.08,z-z0,s,.7+r()*.6,s,0,r()*6.28,0));fc.push(new T.Color().setHSL(.62+r()*.04,.08+r()*.15,.67+r()*.24));
   }
   const flowers=this.instance(this.flowerGeo,this.flowers,fm,fc);flowers.receiveShadow=true;group.add(flowers);group.userData.flowers=flowers;
   const rm=[];
   for(let i=0;i<32;i++){
    const z=z0+r()*CHUNK,d=6+r()*130,x=this.roadX(z)+(r()<.5?-d:d),s=.3+r()*2.1;
    rm.push(transform(x,this.heightAt(x,z)-s*.2,z-z0,s*1.1,s*.65,s,0,r()*6,0));
   }
   const rocks=this.instance(this.rockGeo,this.mat.rock,rm);rocks.castShadow=true;rocks.receiveShadow=true;group.add(rocks);
   // Short roadside posts carry scale without turning the valley into a city.
   const pm=[];for(let z=z0+12;z<z0+CHUNK;z+=32)for(const d of [-4.7,4.7])pm.push(transform(this.roadX(z)+d,this.roadY(z)+.48,z-z0,.12,.8,.16));
   const postGeo=new T.BoxGeometry(1,1,1),posts=this.instance(postGeo,new T.MeshStandardMaterial({color:'#c6cbbb',roughness:.9}),pm);posts.castShadow=true;group.add(posts);geometries.push(postGeo);group.userData.postMat=posts.material;
  }
  this.chunks.set(index,group);this.scene.add(group);return group;
 }
 update(z,time,quality){
  this.origin=Math.floor(z/CHUNK)*CHUNK;const index=Math.floor(z/CHUNK);
  if(index!==this.last){
   this.last=index;
   for(const [i,g] of this.chunks)if(i<index-2||i>index+23){this.scene.remove(g);g.userData.geometries.forEach(x=>x.dispose());g.userData.postMat?.dispose();g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});this.chunks.delete(i);}
   for(let i=index-2;i<=index+23;i++){
    const plants=i<=index+10;
    if(this.chunks.has(i)&&plants&&!this.chunks.get(i).userData.hasPlants){const old=this.chunks.get(i);this.scene.remove(old);old.userData.geometries.forEach(x=>x.dispose());this.chunks.delete(i);}
    if(!this.chunks.has(i))this.buildChunk(i,plants);
    const chunk=this.chunks.get(i);if(i-index<8&&!chunk.userData.terrain.geometry.userData.detailed){const old=chunk.userData.terrain.geometry,next=this.buildTerrain(i);chunk.userData.terrain.geometry=next;chunk.userData.geometries[0]=next;old.dispose();}
   }
  }
  for(const [i,g] of this.chunks){
   g.position.z=i*CHUNK-this.origin;
   const distance=Math.abs(i*CHUNK+CHUNK/2-z),close=distance<(quality==='balanced'?120:190);
   for(const m of g.userData.lods){const geo=close?m.high:m.low;if(m.mesh.geometry!==geo){m.mesh.geometry=geo;m.mesh.computeBoundingSphere();}}
   if(g.userData.flowers)g.userData.flowers.visible=distance<(quality==='balanced'?270:420);
   for(const m of g.userData.lods)m.mesh.castShadow=distance<130;
  }
  if(this.leaves.userData.shader)this.leaves.userData.shader.uniforms.uWindTime.value=time;
  if(this.flowers.userData.shader)this.flowers.userData.shader.uniforms.uWindTime.value=time;
 }
 dispose(){
  for(const g of this.chunks.values()){this.scene.remove(g);g.userData.geometries.forEach(x=>x.dispose());g.userData.postMat?.dispose();g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
  for(const variants of Object.values(this.species))for(const v of variants){v.foliage.dispose();v.bark.dispose();}
  this.flowerGeo.dispose();this.rockGeo.dispose();this.leaves.map.dispose();this.leaves.normalMap.dispose();this.leaves.dispose();this.flowers.map.dispose();this.flowers.dispose();this.lineMat.dispose();this.chunks.clear();
 }
}

function loft(sections){
 const shape=[[-1,0],[-1,.28],[-.98,.73],[-.85,1],[-.55,1.02],[0,1.035],[.55,1.02],[.85,1],[.98,.73],[1,.28],[1,0],[0,-.02]],p=[],uv=[],ix=[],M=shape.length;
 sections.forEach(([z,w,b,h],j)=>shape.forEach(([x,y],i)=>{p.push(x*w,b+y*h,z);uv.push(i/(M-1),j/(sections.length-1));}));
 for(let j=0;j<sections.length-1;j++)for(let i=0;i<M;i++){const a=j*M+i,b=j*M+(i+1)%M,c=a+M,d=b+M;ix.push(a,c,b,b,c,d);}
 for(const j of [0,sections.length-1])for(let i=1;i<M-1;i++)j===0?ix.push(j*M,j*M+i,j*M+i+1):ix.push(j*M,j*M+i+1,j*M+i);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
export function makeCar(){
 const group=new T.Group(),wheels=[];
 const paint=new T.MeshPhysicalMaterial({color:'#642b2d',metalness:.55,roughness:.27,clearcoat:1,clearcoatRoughness:.16});
 const chrome=new T.MeshStandardMaterial({color:'#c7d2c9',metalness:.91,roughness:.2});
 const rubber=new T.MeshStandardMaterial({color:'#15191b',roughness:.88});
 const dark=new T.MeshStandardMaterial({color:'#152323',roughness:.34,metalness:.45});
 const glass=new T.MeshPhysicalMaterial({color:'#668b8b',metalness:.35,roughness:.12,clearcoat:1,transparent:true,opacity:.84});
 const lampMat=new T.MeshStandardMaterial({color:'#ffedba',emissive:'#ffd695',emissiveIntensity:2.1,roughness:.25});
 const tailMat=new T.MeshStandardMaterial({color:'#b63228',emissive:'#dc2516',emissiveIntensity:1.1,roughness:.25});
 const seatMat=new T.MeshStandardMaterial({color:'#766650',roughness:.95});
 const white=new T.Color('white');
 // Parts are collected per material and merged into one geometry each, so the
 // whole static body renders in a handful of draw calls instead of ~90.
 const P={paint:[],chrome:[],rubber:[],dark:[],glass:[],lamp:[],tail:[],seat:[]};
 const M4=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(sx,sy,sz));
 const part=(mat,geo,m)=>P[mat].push({g:geo,m:m||new T.Matrix4(),color:white});
 const box=(mat,x,y,z,w,h,d)=>part(mat,new T.BoxGeometry(w,h,d),M4(x,y,z));
 function bar(mat,a,b,r=.025){
  const av=new T.Vector3(...a),bv=new T.Vector3(...b),len=av.distanceTo(bv);
  const m=new T.Matrix4().compose(av.clone().add(bv).multiplyScalar(.5),
   new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize()),new T.Vector3(1,1,1));
  part(mat,new T.CylinderGeometry(r,r,len,7),m);
 }
 part('paint',loft([[-2.25,.77,.46,.44],[-2.05,.96,.44,.65],[-1.45,1,.43,.68],[-.85,.95,.43,.63],[.45,.95,.43,.63],[1.38,1,.43,.64],[2.1,.91,.49,.5],[2.27,.80,.55,.31]]));
 part('glass',loft([[-1.66,.73,1.02,.1],[-.83,.79,1.04,.64],[.25,.76,1.04,.68],[1.02,.84,1.05,.12]]));
 part('paint',loft([[-.87,.73,1.65,.06],[-.63,.78,1.69,.07],[.12,.74,1.69,.07],[.3,.68,1.65,.05]]));
 box('rubber',0,.39,0,1.55,.18,3.8);
 for(const s of [-1,1]){
  bar('paint',[s*.86,1.10,1.03],[s*.68,1.73,.24],.036);bar('paint',[s*.76,1.73,-.81],[s*.76,1.07,-1.68],.045);
  bar('chrome',[s*.8,1.10,-.65],[s*.75,1.73,-.57],.023);bar('chrome',[s*.91,1.065,-1.6],[s*.91,1.065,1.08],.018);
  box('chrome',s*.964,.77,-.12,.026,.025,2.23);box('chrome',s*.97,1.02,-.4,.035,.035,.19);
  bar('chrome',[s*.84,1.1,.83],[s*1.18,1.25,.7],.025);
  part('paint',new T.SphereGeometry(1,12,6),M4(s*1.19,1.25,.68,0,0,0,.16,.075,.11));
  // Wheels stay separate (they spin), but each wheel merges to 3 meshes.
  for(const wz of [-1.43,1.42]){
   const wg=new T.Group();wg.position.set(s*1.015,.41,wz);group.add(wg);wheels.push(wg);
   const wChrome=[],wRubber=[],wDark=[];
   wRubber.push({g:new T.CylinderGeometry(.4,.4,.245,32,1),m:M4(0,0,0,0,0,Math.PI/2),color:white});
   wChrome.push({g:new T.CylinderGeometry(.277,.277,.252,24,1),m:M4(0,0,0,0,0,Math.PI/2),color:white});
   wDark.push({g:new T.CylinderGeometry(.22,.22,.256,24,1),m:M4(0,0,0,0,0,Math.PI/2),color:white});
   for(let k=0;k<10;k++){const a=k*Math.PI/5;wChrome.push({g:new T.BoxGeometry(.26,.025,.205),m:M4(0,Math.cos(a)*.12,Math.sin(a)*.12,-a+Math.PI/2,0,0),color:white});}
   wChrome.push({g:new T.SphereGeometry(.078,12,6),m:M4(s*.14,0,0,0,0,0,.25,1,1),color:white});
   const wm=[[mergeParts(wRubber),rubber],[mergeParts(wChrome),chrome],[mergeParts(wDark),dark]];
   for(const [g,m] of wm){const mesh=new T.Mesh(g,m);mesh.castShadow=true;wg.add(mesh);}
  }
  part('chrome',new T.TorusGeometry(.442,.026,6,24,Math.PI),M4(s*1.035,.4,-1.43,0,Math.PI/2,0));
  part('chrome',new T.TorusGeometry(.442,.026,6,24,Math.PI),M4(s*1.035,.4,1.42,0,Math.PI/2,0));
 }
 box('chrome',0,.57,2.24,1.75,.095,.13);box('chrome',0,.58,-2.21,1.8,.105,.13);box('dark',0,.78,2.236,1.26,.2,.048);
 for(let i=0;i<5;i++)box('chrome',0,.7+i*.033,2.269,1.20,.012,.012);
 for(const s of [-1,1]){
  for(const x of [.59,.79]){
   part('chrome',new T.CylinderGeometry(.12,.12,.045,24),M4(s*x,.81,2.20,Math.PI/2,0,0));
   part('lamp',new T.CircleGeometry(.10,24),M4(s*x,.81,2.23));
  }
  box('tail',s*.69,.76,-2.236,.33,.13,.022);
 }
 for(const s of [-1,1]){box('seat',s*.39,1.02,-.05,.49,.40,.52);part('seat',new T.BoxGeometry(.51,.57,.14),new T.Matrix4().multiplyMatrices(M4(s*.39,1.20,-.39),M4(0,0,0,-.13,0,0)));}
 const mats={paint,chrome,rubber,dark,glass,lamp:lampMat,tail:tailMat,seat:seatMat};
 for(const k of Object.keys(P)){
  if(!P[k].length)continue;
  const mesh=new T.Mesh(mergeParts(P[k]),mats[k]);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 }
 const plate=document.createElement('canvas');plate.width=256;plate.height=64;const pc=plate.getContext('2d');pc.fillStyle='#d7d7b9';pc.fillRect(0,0,256,64);pc.fillStyle='#283829';pc.font='bold 36px sans-serif';pc.textAlign='center';pc.fillText('MOOR',128,46);const pt=new T.CanvasTexture(plate);pt.colorSpace=T.SRGBColorSpace;
 const rear=new T.Mesh(new T.PlaneGeometry(.48,.12),new T.MeshStandardMaterial({map:pt,roughness:.7}));rear.position.set(0,.70,-2.246);rear.rotation.y=Math.PI;group.add(rear);
 // Interior remains a coherent silhouette through the glazed cabin.
 const contact=document.createElement('canvas');contact.width=contact.height=128;const cx=contact.getContext('2d'),cg=cx.createRadialGradient(64,64,6,64,64,64);cg.addColorStop(0,'rgba(0,0,0,.7)');cg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=cg;cx.fillRect(0,0,128,128);
 const shadow=new T.Mesh(new T.PlaneGeometry(3.3,5.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(contact),transparent:true,depthWrite:false,opacity:.75}));shadow.position.set(0,.014,0);shadow.rotation.x=-Math.PI/2;group.add(shadow);
 return {group,wheels,paint};
}
