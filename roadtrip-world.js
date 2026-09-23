import * as T from './three.module.js';
import {hash,rng,noise,fbm,clamp,smooth,mergeParts,transform,plantGeometry,flowerGeometry,flowerMaterial,windMaterial} from './roadtrip-materials.js';

const CHUNK=128;
export class Valley {
 constructor(scene,materials,seed){
  this.scene=scene;this.mat=materials;this.seed=seed;this.n=hash(seed);this.phase=(this.n%10000)*.001;this.chunks=new Map();this.origin=0;
  this.leaves=windMaterial(new T.MeshStandardMaterial({roughness:.94,vertexColors:true}));
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
  const rise=Math.pow(Math.max(0,d-7)*.017,1.23)*(9+52*hills);
  const geological=Math.pow(ridges,4)*smooth(25,200,d)*(7+Math.min(d,650)*.12);
  return this.roadY(z)-.07+smooth(4.1,14,d)*(rise+fine*1.4+geological);
 }
 buildTerrain(index){
  const z0=index*CHUNK,near=index-this.last<8,steps=near?32:12;
  const xs=[-1500,-1150,-900,-700,-540,-400,-300,-220,-160,-115,-83,-62,-46,-34,-25,-18,-12,-8,-5,-4,0,4,5,8,12,18,25,34,46,62,83,115,160,220,300,400,540,700,900,1150,1500];
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
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',g.getAttribute('uv').clone());g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(ix);g.computeBoundingSphere();return g;
 }
 ribbon(index,left,right,yOffset=.10){
  const p=[],uv=[],c=[],ix=[],N=48,z0=index*CHUNK;
  for(let j=0;j<=N;j++){
   const z=z0+j*CHUNK/N;
   for(const x of [left,right]){p.push(this.roadX(z)+x,this.roadY(z)+yOffset,z-z0);uv.push((x+4)/8,z*.06);const tone=.72+.05*noise(z*.2,x,52);c.push(tone,tone,tone);}
  }
  for(let j=0;j<N;j++){const a=j*2;ix.push(a,a+2,a+1,a+2,a+3,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setAttribute('uv1',g.getAttribute('uv').clone());g.setAttribute('color',new T.Float32BufferAttribute(c,3));g.setIndex(ix);g.computeVertexNormals();return g;
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
  const terrain=add(this.buildTerrain(index),this.mat.ground);terrain.receiveShadow=true;
  const shoulder=add(this.ribbon(index,-4.22,4.22,.005),this.mat.rock);shoulder.receiveShadow=true;
  const asphalt=add(this.ribbon(index,-3.75,3.75),this.mat.road);asphalt.receiveShadow=true;
  add(this.marks(index),this.lineMat);
  group.userData.geometries=geometries;group.userData.lods=[];group.userData.hasPlants=plants;
  if(plants){
   const r=rng(this.seed+':chunk:'+index),z0=index*CHUNK;
   for(const kind of ['cypress','oak']){
    const matrices=[],colors=[];
    const total=kind==='cypress'?42:64;
    for(let i=0;i<total;i++){
     const z=z0+r()*CHUNK,side=r()<.5?-1:1;
     const d=kind==='cypress'?8+Math.pow(r(),1.6)*115:9+Math.pow(r(),.75)*220;
     const x=this.roadX(z)+side*d,y=this.heightAt(x,z),s=.6+r()*.85;
     matrices.push(transform(x,y-.08,z-z0,s,s*(.85+r()*.38),s,0,r()*6.28,0));colors.push(new T.Color().setHSL(.24+r()*.07,.1+r()*.16,.57+r()*.23));
    }
    const model=this.species[kind],leaves=this.instance(model[1].foliage,this.leaves,matrices,colors),trunks=this.instance(model[1].bark,this.mat.bark,matrices);
    leaves.castShadow=true;leaves.receiveShadow=true;trunks.castShadow=true;group.add(leaves,trunks);group.userData.lods.push({mesh:leaves,high:model[0].foliage,low:model[1].foliage},{mesh:trunks,high:model[0].bark,low:model[1].bark});
   }
   const fm=[],fc=[];
   for(let i=0;i<1150;i++){
    const z=z0+r()*CHUNK,d=4.7+Math.pow(r(),1.9)*64,x=this.roadX(z)+(r()<.5?-d:d),s=.4+r()*.85;
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
    const plants=i<=index+6;
    if(this.chunks.has(i)&&plants&&!this.chunks.get(i).userData.hasPlants){const old=this.chunks.get(i);this.scene.remove(old);old.userData.geometries.forEach(x=>x.dispose());this.chunks.delete(i);}
    if(!this.chunks.has(i))this.buildChunk(i,plants);
   }
  }
  for(const [i,g] of this.chunks){
   g.position.z=i*CHUNK-this.origin;
   const distance=Math.abs(i*CHUNK+CHUNK/2-z),close=distance<(quality==='balanced'?160:270);
   for(const m of g.userData.lods)m.mesh.geometry=close?m.high:m.low;
   if(g.userData.flowers)g.userData.flowers.visible=distance<(quality==='balanced'?270:420);
   for(const m of g.userData.lods)m.mesh.castShadow=distance<130;
  }
  if(this.leaves.userData.shader)this.leaves.userData.shader.uniforms.uWindTime.value=time;
  if(this.flowers.userData.shader)this.flowers.userData.shader.uniforms.uWindTime.value=time;
 }
 dispose(){
  for(const g of this.chunks.values()){this.scene.remove(g);g.userData.geometries.forEach(x=>x.dispose());g.userData.postMat?.dispose();g.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
  for(const variants of Object.values(this.species))for(const v of variants){v.foliage.dispose();v.bark.dispose();}
  this.flowerGeo.dispose();this.rockGeo.dispose();this.leaves.dispose();this.flowers.map.dispose();this.flowers.dispose();this.lineMat.dispose();this.chunks.clear();
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
 const add=(geo,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;};
 const box=(x,y,z,w,h,d,mat)=>add(new T.BoxGeometry(w,h,d),mat,x,y,z);
 add(loft([[-2.25,.77,.46,.44],[-2.05,.96,.44,.65],[-1.45,1,.43,.68],[-.85,.95,.43,.63],[.45,.95,.43,.63],[1.38,1,.43,.64],[2.1,.91,.49,.5],[2.27,.80,.55,.31]]),paint);
 add(loft([[-1.66,.73,1.02,.1],[-.83,.79,1.04,.64],[.25,.76,1.04,.68],[1.02,.84,1.05,.12]]),glass);
 add(loft([[-.87,.73,1.65,.06],[-.63,.78,1.69,.07],[.12,.74,1.69,.07],[.3,.68,1.65,.05]]),paint);
 box(0,.39,0,1.55,.18,3.8,rubber);
 function bar(a,b,r=.025,mat=chrome){const av=new T.Vector3(...a),bv=new T.Vector3(...b),m=add(new T.CylinderGeometry(r,r,av.distanceTo(bv),7),mat);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;}
 for(const s of [-1,1]){
  bar([s*.86,1.10,1.03],[s*.68,1.73,.24],.036,paint);bar([s*.76,1.73,-.81],[s*.76,1.07,-1.68],.045,paint);bar([s*.8,1.10,-.65],[s*.75,1.73,-.57],.023,chrome);bar([s*.91,1.065,-1.6],[s*.91,1.065,1.08],.018);
  box(s*.964,.77,-.12,.026,.025,2.23,chrome);box(s*.97,1.02,-.4,.035,.035,.19,chrome);
  bar([s*.84,1.1,.83],[s*1.18,1.25,.7],.025);const mirror=add(new T.SphereGeometry(1,12,6),paint,s*1.19,1.25,.68);mirror.scale.set(.16,.075,.11);
  for(const wz of [-1.43,1.42]){
   const wg=new T.Group();wg.position.set(s*1.015,.41,wz);group.add(wg);wheels.push(wg);
   const tire=new T.Mesh(new T.CylinderGeometry(.4,.4,.245,32,1),rubber);tire.rotation.z=Math.PI/2;wg.add(tire);tire.castShadow=true;
   const rim=new T.Mesh(new T.CylinderGeometry(.277,.277,.252,24,1),chrome);rim.rotation.z=Math.PI/2;wg.add(rim);
   const hub=new T.Mesh(new T.CylinderGeometry(.22,.22,.256,24,1),dark);hub.rotation.z=Math.PI/2;wg.add(hub);
   for(let k=0;k<10;k++){const a=k*Math.PI/5,sp=new T.Mesh(new T.BoxGeometry(.26,.025,.205),chrome);sp.position.set(0,Math.cos(a)*.12,Math.sin(a)*.12);sp.rotation.x=-a+Math.PI/2;wg.add(sp);}
   const cap=new T.Mesh(new T.SphereGeometry(.078,12,6),chrome);cap.position.x=s*.14;cap.scale.x=.25;wg.add(cap);
   const arch=add(new T.TorusGeometry(.442,.026,6,24,Math.PI),chrome,s*1.035,.4,wz);arch.rotation.y=Math.PI/2;
  }
 }
 box(0,.57,2.24,1.75,.095,.13,chrome);box(0,.58,-2.21,1.8,.105,.13,chrome);box(0,.78,2.236,1.26,.2,.048,dark);
 for(let i=0;i<5;i++)box(0,.7+i*.033,2.269,1.20,.012,.012,chrome);
 const lamp=new T.MeshStandardMaterial({color:'#ffedba',emissive:'#ffd695',emissiveIntensity:2.1,roughness:.25});
 for(const s of [-1,1]){
  for(const x of [.59,.79]){const rim=add(new T.CylinderGeometry(.12,.12,.045,24),chrome,s*x,.81,2.20);rim.rotation.x=Math.PI/2;const light=add(new T.CircleGeometry(.10,24),lamp,s*x,.81,2.23);light.rotation.y=0;}
  box(s*.69,.76,-2.236,.33,.13,.022,new T.MeshStandardMaterial({color:'#b63228',emissive:'#dc2516',emissiveIntensity:1.1,roughness:.25}));
 }
 const plate=document.createElement('canvas');plate.width=256;plate.height=64;const pc=plate.getContext('2d');pc.fillStyle='#d7d7b9';pc.fillRect(0,0,256,64);pc.fillStyle='#283829';pc.font='bold 36px sans-serif';pc.textAlign='center';pc.fillText('MOOR',128,46);const pt=new T.CanvasTexture(plate);pt.colorSpace=T.SRGBColorSpace;
 const rear=add(new T.PlaneGeometry(.48,.12),new T.MeshStandardMaterial({map:pt,roughness:.7}),0,.70,-2.246);rear.rotation.y=Math.PI;
 // Interior remains a coherent silhouette through the glazed cabin.
 const seat=new T.MeshStandardMaterial({color:'#766650',roughness:.95});for(const s of [-1,1]){box(s*.39,1.02,-.05,.49,.40,.52,seat);const back=box(s*.39,1.20,-.39,.51,.57,.14,seat);back.rotation.x=-.13;}
 const contact=document.createElement('canvas');contact.width=contact.height=128;const cx=contact.getContext('2d'),cg=cx.createRadialGradient(64,64,6,64,64,64);cg.addColorStop(0,'rgba(0,0,0,.7)');cg.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=cg;cx.fillRect(0,0,128,128);
 const shadow=add(new T.PlaneGeometry(3.3,5.8),new T.MeshBasicMaterial({map:new T.CanvasTexture(contact),transparent:true,depthWrite:false,opacity:.75}),0,.014,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;shadow.receiveShadow=false;
 return {group,wheels,paint};
}
