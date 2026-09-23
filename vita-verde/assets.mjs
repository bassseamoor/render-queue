import * as T from '../three.module.js';
export {T};
export const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const mix=(a,b,t)=>a+(b-a)*t;
export const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
export const phase=(t,a,b)=>ease((t-a)/(b-a));
export function hash(s){let h=2166136261;for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619);}return h>>>0;}
export function rng(s){let a=hash(s);return()=>{a+=0x6d2b79f5;let t=Math.imul(a^a>>>15,a|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function mat(color,roughness=.7,metalness=0,extra={}){const m=new T.MeshStandardMaterial({color,roughness,metalness,...extra});m.name=String(color);return m;}
export const M={
 soil:mat('#51412b'),earth:mat('#665138'),leaf:mat('#47752b',.79),leafLight:mat('#739633',.74),stem:mat('#607d2a'),
 steel:mat('#a9b9b1',.29,.72),darkSteel:mat('#334a43',.36,.68),rubber:mat('#36413e',.9),paper:mat('#b89462',.9),paperEdge:mat('#916f46',1),
 wood:mat('#775334',.85),lightWood:mat('#bb9460',.8),ivory:mat('#e7e1ce',.7),green:mat('#224e37',.38),dark:mat('#122b23',.66),
 black:mat('#152320',.47),eye:mat('#101918',.23),white:mat('#fff3d8',.42),cloth:mat('#4f655c',1),glove:mat('#b6a283',.99),
 glass:mat('#99bbb4',.12,.25,{transparent:true,opacity:.33,depthWrite:false}),gold:mat('#ad8852',.33,.65),
 light:mat('#fff0d1',.5,0,{emissive:'#fff0bf',emissiveIntensity:2}),ceramic:mat('#e0e9df',.22),road:mat('#494940',.94),
 tomato:mat('#bb3922',.31),pepper:mat('#d74525',.28),cucumber:mat('#326442',.4),broccoli:mat('#32642d',.8),eggplant:mat('#382e46',.26),
 roast:mat('#b85418',.28),plateDark:mat('#6f8067',.32)
};
const geoCache=new Map();
export const ballGeo=new T.SphereGeometry(1,16,10);
export const boxGeo=new T.BoxGeometry(1,1,1);
function texture(seed,type){
 const N=256,data=new Uint8Array(N*N*4),r=rng(seed),base=new T.Color(type==='carrot'?'#ef8a37':type==='paper'?'#bb9b6b':type==='wood'?'#927050':'#74634b');
 // Tangent-space detail is shared; no baked directional light on food surfaces.
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const n=r()-.5;let v=type==='carrot'?1+n*.055+(Math.sin(y*.39+Math.sin(x*.067)*1.3)>.92?-.12:0):type==='wood'?1+Math.sin(y*.09+Math.sin(x*.009)*7)*.07+n*.08:1+n*.09;
  const i=(y*N+x)*4;data[i]=clamp(base.r*v)*255;data[i+1]=clamp(base.g*v)*255;data[i+2]=clamp(base.b*v)*255;data[i+3]=255;
 }
 const tex=new T.DataTexture(data,N,N);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;return tex;
}
M.carrot=mat('#ffffff',.66,0,{map:texture('carrot-skin','carrot')});M.paper.map=texture('kraft','paper');M.paper.color.set('white');M.wood.map=texture('timber','wood');M.wood.color.set('white');
export function group(parent,name){const g=new T.Group();g.name=name||'';if(parent)parent.add(g);return g;}
export function mesh(g,geo,material,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geo,material);m.position.fromArray(pos);m.scale.fromArray(scale);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
export const ball=(g,m,p,s)=>mesh(g,ballGeo,m,p,s);
export const box=(g,m,p,s)=>mesh(g,boxGeo,m,p,s);
export function rod(g,a,b,r,material,segments=8){
 const av=new T.Vector3(...a),bv=new T.Vector3(...b),len=av.distanceTo(bv);if(len<1e-8)return null;
 const key=`rod:${segments}`;if(!geoCache.has(key))geoCache.set(key,new T.CylinderGeometry(1,1,1,segments));
 const m=mesh(g,geoCache.get(key),material,av.clone().add(bv).multiplyScalar(.5).toArray(),[r,len,r]);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;
}
export function tube(g,points,r,material,steps=18){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(g,new T.TubeGeometry(curve,steps,r,6,false),material);}
export function rounded(g,material,p,s,r=.025){
 const [w,h,d]=s;const rr=Math.min(r,w/3,h/3,d/3),key=[w,h,d,rr].join(':');
 if(!geoCache.has(key)){
  const shape=new T.Shape(),x=-w/2,z=-h/2;
  shape.moveTo(x+rr,z);shape.lineTo(x+w-rr,z);shape.quadraticCurveTo(x+w,z,x+w,z+rr);shape.lineTo(x+w,z+h-rr);shape.quadraticCurveTo(x+w,z+h,x+w-rr,z+h);shape.lineTo(x+rr,z+h);shape.quadraticCurveTo(x,z+h,x,z+h-rr);shape.lineTo(x,z+rr);shape.quadraticCurveTo(x,z,x+rr,z);
  const geo=new T.ExtrudeGeometry(shape,{depth:Math.max(.001,d-2*rr),bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:rr*.55,bevelThickness:rr,curveSegments:3});geo.translate(0,0,-d/2+rr);geo.computeVertexNormals();geoCache.set(key,geo);
 }
 return mesh(g,geoCache.get(key),material,p);
}
function rootGeometry(bend=0,seed=1,detail=1){
 const rings=detail?32:14,segments=detail?32:12,p=[],uv=[],idx=[];
 for(let j=0;j<=rings;j++){const t=j/rings,y=t*.31;const cx=bend*.057*Math.pow(1-t,2.7);
  const radius=.037*Math.pow(Math.sin(Math.PI*(.035+.91*t)),.68)*(.3+.7*t)+.001;
  for(let k=0;k<=segments;k++){const a=k/segments*Math.PI*2,rr=radius*(1+.023*Math.sin(a*5+t*29+seed));p.push(cx+Math.cos(a)*rr,y,Math.sin(a)*rr);uv.push(k/segments,t);}
 }
 for(let j=0;j<rings;j++)for(let k=0;k<segments;k++){const a=j*(segments+1)+k,b=a+segments+1;idx.push(a,b,a+1,b,b+1,a+1);}
 for(const j of [0,rings]){const t=j/rings,center=p.length/3;p.push(bend*.057*Math.pow(1-t,2.7),t*.31,0);uv.push(.5,t);for(let k=0;k<segments;k++){const a=j*(segments+1)+k;idx.push(center,j===0?a+1:a,j===0?a:a+1);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();return geo;
}
function leafShape(){const p=[],idx=[];for(let i=0;i<=8;i++){const t=i/8,w=Math.sin(t*Math.PI)*.018; p.push(-w,t*.09,Math.sin(t*Math.PI)*.008,w,t*.09,Math.sin(t*Math.PI)*.008);}for(let i=0;i<8;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;}
const leafGeo=leafShape();M.leaf.side=M.leafLight.side=T.DoubleSide;
export function leaves(g,seed=1,detailed=true){
 const r=rng('leaf'+seed),top=group(g,'foliage'),stems=[];top.position.y=.30;
 for(let j=0;j<(detailed?5:3);j++){
  const stem=group(top,'frond'),angle=j*2.399+seed*.17,len=.14+r()*.06;stem.rotation.set((r()-.5)*.5,angle,(r()-.5)*.5);stems.push(stem);
  rod(stem,[0,0,0],[.025,len,0],.0018,M.stem,5);
  for(let k=1;k<6;k++){const t=k/6;for(const side of [-1,1]){
   const leaf=mesh(stem,leafGeo,j%2?M.leaf:M.leafLight,[.025*t,len*t,0],[.32+(1-t)*.24,.28+(1-t)*.28,.6]);leaf.rotation.z=side*(.55+(1-t)*.9);leaf.rotation.y=side*.45;
   if(detailed&&k<4){const ll=leaf.clone();ll.position.y+=.007;ll.rotation.y+=1.2;stem.add(ll);}
  }}
 }
 return {top,stems};
}
export function face(g,y=.224,z=.030,scale=1){
 const root=group(g,'face');root.position.set(.002,y,z);root.scale.setScalar(scale);const eyes=[],brows=[];
 for(const x of [-.012,.012]){
  const eye=ball(root,M.eye,[x,0,0],[.0045,.0068,.0024]);eyes.push(eye);ball(root,M.white,[x-.0012,.002,.0021],[.00125,.0018,.001]);
  const brow=rod(root,[x-.004,.013,.0002],[x+.004,.014,.0002],.0013,M.dark,6);brow.userData.baseZ=brow.rotation.z;brows.push(brow);
 }
 const mouth=group(root,'mouth');
 const points=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI;points.push([Math.cos(a)*.009,-.014-Math.sin(a)*.004,.001]);}
 tube(mouth,points,.0013,M.dark,12);
 return {root,eyes,brows,mouth,set(mood,t){const sad=mood==='sad'||mood==='worry';mouth.scale.y=sad?-1:1;mouth.position.y=sad?-.028:0;for(let i=0;i<2;i++){brows[i].rotation.z=brows[i].userData.baseZ+(i?-1:1)*(sad?.30:0);const blink=Math.pow(Math.max(0,Math.cos(t*1.6+2)),30);eyes[i].scale.y=.0068*(1-blink*.88);}root.visible=mood!=='cooked';}};
}
export function carrot({hero=false,seed=1,imperfect=false,detail=true,smile=false,cooked=false}={}){
 const g=group(null,hero?'hero-carrot-001':'carrot'),bend=hero?1.25:imperfect?.6+((seed%13)/13)*.7:((seed%5)-2)*.055;
 const key=`carrot:${hero?'hero':Math.round(bend*10)}:${detail}`;
 if(!geoCache.has(key))geoCache.set(key,rootGeometry(bend,hero?71:seed,detail));
 const body=mesh(g,geoCache.get(key),cooked?M.roast:M.carrot);body.name='carrot-body';
 const foliage=cooked?null:leaves(g,hero?71:seed,detail);
 const f=(hero||smile)?face(g):null;
 if(hero&&!cooked){const scar=group(g,'crescent-scar');scar.position.set(.020,.274,.027);tube(scar,[[-.004,0,0],[-.002,-.002,0],[.001,-.003,0],[.004,-.001,0]],.0007,M.ivory,8);}
 g.userData={species:'carrot',hero,bend,identity:hero?'VV-HERO-001':`carrot-${seed}`,foliage,face:f,body};return g;
}
export function vegetable(type,seed=1,smile=false){
 if(type==='carrot')return carrot({seed,detail:false,imperfect:seed%3===0,smile});
 const g=group(null,type),r=rng(type+seed),matr=M[type];
 if(type==='tomato'||type==='pepper'){
  const lobes=type==='tomato'?6:4,h=type==='tomato'?.105:.17;
  for(let i=0;i<lobes;i++){const a=i/lobes*Math.PI*2;ball(g,matr,[Math.cos(a)*.027,h*.55,Math.sin(a)*.027],[.052,h*.51,.052]);}
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2,l=mesh(g,leafGeo,M.leaf,[0,h,0],[.6,.5,.6]);l.rotation.set(.9,a,0);}
  tube(g,[[0,h,0],[.002,h+.024,0],[.014,h+.039,0]],.006,M.stem,8);
 }else if(type==='cucumber'){
  ball(g,matr,[0,.14,0],[.036,.14,.037]);for(let j=0;j<6;j++){const a=j/6*Math.PI*2;tube(g,[[Math.sin(a)*.034,.04,Math.cos(a)*.034],[Math.sin(a)*.037,.13,Math.cos(a)*.037],[Math.sin(a)*.030,.25,Math.cos(a)*.030]],.0008,M.leaf,10);}
 }else if(type==='eggplant'){
  ball(g,matr,[0,.09,0],[.069,.086,.062]);ball(g,matr,[-.01,.165,0],[.042,.065,.036]);for(let i=0;i<6;i++){const l=mesh(g,leafGeo,M.leaf,[-.01,.216,0],[.7,.6,.7]);l.rotation.set(1,i/6*Math.PI*2,0);}rod(g,[-.01,.21,0],[.005,.26,0],.008,M.stem);
 }else{
  rod(g,[0,0,0],[0,.15,0],.024,M.leafLight);
  for(let j=0;j<12;j++){const a=j*2.399,rad=Math.sqrt(j/12)*.085,x=Math.cos(a)*rad,z=Math.sin(a)*rad,y=.16+.04*(1-rad/.09);rod(g,[0,.08,0],[x,y,z],.009,M.leafLight);ball(g,M.broccoli,[x,y,z],[.044,.037,.041]);for(let k=0;k<5;k++)ball(g,M.broccoli,[x+(r()-.5)*.06,y+.024,z+(r()-.5)*.06],[.014,.013,.014]);}
 }
 if(smile)g.userData.face=face(g,type==='pepper'?.115:.09,type==='eggplant'?.063:.070,1);
 g.userData.species=type;return g;
}
const GLYPHS={V:['101','101','101','101','010'],I:['111','010','010','010','111'],T:['111','010','010','010','010'],A:['010','101','111','101','101'],E:['111','100','110','100','111'],R:['110','101','110','101','101'],D:['110','101','101','101','110']};
function printBrand(parent,w,h,d){const g=group(parent,'printed-wordmark'),pixel=w*.018;for(const [line,text]of ['VITA','VERDE'].entries()){let i=0;for(const char of text){const glyph=GLYPHS[char];for(let y=0;y<5;y++)for(let x=0;x<3;x++)if(glyph[y][x]==='1'){const px=(i*4+x-(text.length*4-2)/2)*pixel;box(g,M.ivory,[-px,h*.65-line*pixel*7-y*pixel,-d/2-.0045],[pixel*.82,pixel*.82,.0015]);}i++;}}batchStatic(g);}
export function crate(parent,{cardboard=true,delivery=false,width=.66,depth=.48,height=.33}={}){
 const g=group(parent,delivery?'delivery-box':'collection-box'),m=cardboard?M.paper:M.wood,th=.014;
 box(g,m,[0,th/2,0],[width,th,depth]);
 for(const s of [-1,1]){box(g,m,[s*(width-th)/2,height/2,0],[th,height,depth]);box(g,m,[0,height/2,s*(depth-th)/2],[width,height,th]);
  if(cardboard){rod(g,[-width/2,height,s*depth/2],[width/2,height,s*depth/2],.005,M.paperEdge);}
 }
 if(!cardboard){for(let j=0;j<3;j++)for(const s of [-1,1])box(g,M.lightWood,[0,(j+.5)*height/3,s*(depth/2+.002)],[width,.016,.012]);}
 if(delivery){printBrand(g,width,height,depth);g.userData.brandPlane=box(g,M.green,[0,height*.55,-depth/2-.002],[width*.66,height*.47,.003]);g.userData.brandPlane.name='brand-print';}
 return g;
}
export function assortment(parent,seed='box',hero=null){
 const r=rng(seed),all=[];
 const types=['pepper','tomato','cucumber','broccoli','eggplant','carrot','tomato','pepper'];
 for(let i=0;i<types.length;i++){const v=vegetable(types[i],i+hash(seed)%50);const col=i%4,row=Math.floor(i/4);v.position.set((col-1.5)*.135,.15+(row?.025:0),(row-.5)*.17);v.rotation.set((r()-.5)*.3,(r()-.5)*.7,(r()-.5)*.3);batchStatic(v);parent.add(v);all.push(v);}
 if(hero){hero.position.set(-.06,.16,-.15);hero.rotation.set(-.1,0,-.12);parent.add(hero);}return all;
}
export function hand(parent,side=1,extended=false){
 const g=group(parent,'hand'),fingers=[];
 const palm=rounded(g,M.glove,[0,0,0],[.076,.09,.036],.012);
 for(let i=0;i<4;i++){
  const finger=group(g,'finger');finger.position.set((i-1.5)*.017,.042,0);const length=.045-(i===3?.013:i===0?.007:0);ball(finger,M.glove,[0,length*.5,0],[.0085,length*.62,.011]);const tip=group(finger,'finger-tip');tip.position.y=length;ball(tip,M.glove,[0,.014,0],[.008,.022,.010]);fingers.push({finger,tip});
 }
 const thumb=group(g,'thumb');thumb.position.set(side*.044,-.006,.006);thumb.rotation.z=-side*.65;ball(thumb,M.glove,[0,.024,0],[.012,.030,.013]);
 const cuff=rounded(g,M.cloth,[0,-.060,0],[.075,.044,.052],.01);
 if(extended){g.userData.sleeve=rounded(g,M.cloth,[0,-.235,-.012],[.083,.34,.065],.022);}
 g.userData.setGrip=(v)=>{palm.scale.z=1-.055*v;palm.scale.x=1+.018*v;fingers.forEach(({finger,tip},i)=>{finger.rotation.x=.15+v*.8;tip.rotation.x=v*.9;});thumb.rotation.y=-side*v*.6;};g.userData.fingers=fingers;return g;
}
export function farmer(parent){
 const g=group(parent,'farmer'),root=group(g,'body');
 rounded(root,M.cloth,[0,1.14,0],[.42,.55,.24],.05);rounded(root,M.green,[0,1.05,-.132],[.29,.38,.024],.01);
 for(const s of [-1,1]){rod(root,[s*.115,1.36,-.12],[s*.13,1.03,-.15],.020,M.green);}
 const head=ball(root,mat('#ad8764',.87),[0,1.57,0],[.13,.16,.12]);
 ball(root,M.eye,[-.041,1.59,-.110],[.009,.008,.004]);ball(root,M.eye,[.041,1.59,-.110],[.009,.008,.004]);
 rounded(root,M.dark,[0,1.725,.008],[.32,.046,.27],.06);ball(root,M.green,[0,1.76,.008],[.125,.07,.115]);
 const arms=[],legs=[];
 for(const s of [-1,1]){
  const arm=group(root,'arm');arm.position.set(s*.24,1.36,0);rod(arm,[0,0,0],[s*.08,-.30,0],.057,M.cloth);const fore=group(arm,'forearm');fore.position.set(s*.08,-.30,0);rod(fore,[0,0,0],[0,-.30,0],.049,M.cloth);const h=hand(fore,s);h.position.set(0,-.33,0);h.rotation.z=Math.PI;arms.push({arm,fore,hand:h});
  const leg=group(g,'leg');leg.position.set(s*.115,.83,0);rod(leg,[0,0,0],[0,-.39,0],.085,M.dark);const shin=group(leg,'shin');shin.position.y=-.39;rod(shin,[0,0,0],[0,-.38,0],.062,M.dark);const foot=group(shin,'foot');foot.position.y=-.38;rounded(foot,M.wood,[0,-.005,-.07],[.13,.115,.26],.024);legs.push({leg,shin,foot});
 }
 g.userData={arms,legs,root,walk(t,amount=1){legs.forEach(({leg,shin,foot},i)=>{leg.position.y=.83;const p=t*6.2+i*Math.PI;leg.rotation.x=Math.sin(p)*.35*amount;shin.rotation.x=Math.max(0,Math.sin(p+1))*.35*amount;foot.rotation.x=-(leg.rotation.x+shin.rotation.x);});root.position.y=Math.abs(Math.sin(t*6.2))*.018*amount;}};
 return g;
}
export function pickup(parent){
 const g=group(parent,'green-pickup'),wheels=[],body=group(g,'suspension');
 rounded(body,M.green,[0,.59,0],[1.7,.48,3.8],.10);box(body,M.dark,[0,.27,0],[1.44,.14,3.45]);
 rounded(body,M.green,[0,1.16,.20],[1.61,.72,1.42],.09);rounded(body,M.green,[0,1.53,.18],[1.73,.08,1.52],.04);
 box(body,M.glass,[0,1.25,-.526],[1.4,.43,.013]);box(body,M.glass,[0,1.25,.93],[1.4,.43,.013]);
 for(const s of [-1,1]){box(body,M.glass,[s*.817,1.24,.2],[.013,.44,1.1]);rounded(body,M.green,[s*.805,.9,-1.17],[.13,.48,1.30],.035);}
 // Bed is open behind the cab (negative Z), with a physical floor and closed tailgate.
 box(body,M.wood,[0,.82,-1.17],[1.48,.06,1.30]);box(body,M.green,[0,1.01,-1.88],[1.68,.42,.08]);
 rounded(body,M.green,[0,.93,1.30],[1.60,.24,1.11],.08);box(body,M.dark,[0,.68,1.93],[1.22,.21,.03]);
 for(let j=0;j<6;j++)box(body,M.steel,[(j-2.5)*.15,.68,1.956],[.018,.17,.006]);
 for(const s of [-1,1]){ball(body,M.light,[s*.64,.79,1.956],[.12,.10,.018]);ball(body,mat('#ba4330',.3),[s*.66,.93,-1.929],[.09,.07,.01]);}
 box(body,M.steel,[0,.47,1.98],[1.78,.08,.1]);box(body,M.steel,[0,.47,-1.95],[1.78,.08,.1]);
 const tireGeo=new T.CylinderGeometry(.34,.34,.22,24);tireGeo.rotateZ(Math.PI/2);
 for(const z of [-1.13,1.21])for(const s of [-1,1]){const wheel=group(g,'wheel');wheel.position.set(s*.86,.35,z);mesh(wheel,tireGeo,M.rubber);const rim=mesh(wheel,new T.CylinderGeometry(.18,.18,.23,18),M.steel);rim.rotation.z=Math.PI/2;wheels.push(wheel);}
 const bed=group(body,'cargo');bed.position.set(0,.855,-1.20);
 g.userData={wheels,body,bed};return g;
}
export function tree(parent,x,z,size,seed=1){const g=group(parent,'tree');g.position.set(x,0,z);const r=rng(seed);rod(g,[0,0,0],[.04,size*.72,.03],size*.045,M.wood,7);for(let i=0;i<6;i++){const a=i*2.4;ball(g,i%2?M.leaf:M.leafLight,[Math.cos(a)*size*.18,size*(.63+r()*.24),Math.sin(a)*size*.19],[size*.24,size*.3,size*.25]);}return g;}
export function scatterInstances(parent,geometry,material,transforms,name='instances'){
 const m=new T.InstancedMesh(geometry,material,transforms.length),o=new T.Object3D();
 transforms.forEach((v,i)=>{o.position.fromArray(v.p);o.rotation.fromArray(v.r||[0,0,0]);o.scale.fromArray(v.s||[1,1,1]);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.computeBoundingSphere();m.castShadow=true;m.receiveShadow=true;m.name=name;parent.add(m);return m;
}
export function batchStatic(parent){
 parent.updateMatrixWorld(true);const batches=new Map(),inv=parent.matrixWorld.clone().invert(),remove=[];
 parent.traverseVisible(o=>{if(!o.isMesh||o.isInstancedMesh)return;const material=o.material;if(Array.isArray(material))return;let b=batches.get(material);if(!b){b={p:[],n:[],uv:[]};batches.set(material,b);}const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry,pa=geo.attributes.position,na=geo.attributes.normal,ua=geo.attributes.uv,transform=new T.Matrix4().multiplyMatrices(inv,o.matrixWorld),nm=new T.Matrix3().getNormalMatrix(transform),v=new T.Vector3();
  for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(transform);b.p.push(v.x,v.y,v.z);if(na)v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();else v.set(0,1,0);b.n.push(v.x,v.y,v.z);b.uv.push(ua?ua.getX(i):0,ua?ua.getY(i):0);}if(geo!==o.geometry)geo.dispose();remove.push(o);
 });
 for(const o of remove)o.removeFromParent();
 for(const [material,b]of batches){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(b.p,3));geo.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));geo.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));const m=mesh(parent,geo,material);m.name='batch-'+material.name;}
}
