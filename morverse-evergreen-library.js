import * as THREE from './three.module.js';

const BLUEPRINT_URL='blueprints/evergreen-public-library-world.json';
const prefersReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={blueprint:null,zone:null,light:'day',yaw:0,pitch:-0.04,keys:{},moving:false,drag:false,dragMoved:0,selected:null,travel:null,last:performance.now()};
const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(msg)=>{const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800);};

const FALLBACK_ZONES=[
{id:'arrival-terrace',name:'Arrival Terrace',x:0,z:76,role:'Threshold',purpose:'A civic threshold into the public library world.',built:true},
{id:'forum-of-questions',name:'Forum of Questions',x:0,z:42,role:'Civic plaza',purpose:'Questions, announcements, temporary exhibits and chance encounters.',built:true},
{id:'grand-rotunda',name:'Grand Rotunda',x:0,z:0,role:'Heart',purpose:'The intellectual and spatial center of the library.',built:true},
{id:'blueprint-stacks',name:'Blueprint Stacks',x:42,z:3,role:'Structured knowledge',purpose:'Browse systems as inspectable, forkable public blueprints.',built:true},
{id:'reading-hall',name:'Public Reading Hall',x:-42,z:3,role:'Deep learning',purpose:'A beautiful place to stay for hours and learn.',built:true},
{id:'evergreen-grove',name:'Evergreen Grove',x:0,z:-46,role:'Compounding knowledge',purpose:'Reusable knowledge remains visible and keeps yielding value.',built:true},
{id:'makers-hall',name:'Makers Hall',x:50,z:-32,role:'Creation',purpose:'Turn public knowledge into working things.',built:true},
{id:'amphitheater',name:'Civic Amphitheater',x:-50,z:-34,role:'Public discourse',purpose:'Lectures, debates, performances and demonstrations.',built:true},
{id:'observatory',name:'Observatory of Unfinished Things',x:0,z:-88,role:'Frontier',purpose:'Hold unresolved questions without pretending they are settled.',built:true},
{id:'social-commons',name:'Social Commons',x:-48,z:44,role:'Belonging',purpose:'Ordinary hanging out is a first-class library function.',built:true},
{id:'archive-vault',name:'Archive Vault',x:48,z:44,role:'Memory',purpose:'Preserve canonical versions, provenance and failures.',built:true},
{id:'branch-gates',name:'Branch Gates',x:0,z:108,role:'Expansion/transit',purpose:'Reserved axis for future planetary branches.',built:false}
];
const FALLBACK_PROGRAM=[
{name:'Open Build Night',home:'Makers Hall',value:'Build in public; working results return as evidence.'},
{name:'Public Lecture',home:'Civic Amphitheater',value:'Experts teach and public knowledge compounds.'},
{name:'Salon of Unfinished Things',home:'Observatory',value:'Discuss unresolved questions without premature certainty.'},
{name:'Blueprint Crit',home:'Blueprint Stacks',value:'Walk a system together and improve its requirements.'},
{name:'Mentor Grove',home:'Evergreen Grove',value:'Small-group guidance around reusable knowledge.'},
{name:'Community Meal',home:'Social Commons',value:'Belonging with no productivity requirement.'}
];
const EXHIBITS=[
{id:'funnel-kernel',title:'Funnel Kernel',status:'canonical law',summary:'Sealed request resolver: Page 0 → references → distill → decisions → replay → verdict.',source:'funnel-kernel.js',provenance:'verified mechanism'},
{id:'reference-graph',title:'Universal Reference Graph',status:'working architecture',summary:'Concepts, recipes, components, outputs, failures and evidence remain addressable as one graph.',source:'pulse-reference-graph-schema.json',provenance:'Pulse'},
{id:'app-compiler-harness',title:'App Compiler Harness',status:'bounded prototype',summary:'Turns resolved intent into a candidate build, gates it, and learns logic separately from intent.',source:'moor-harness-runtime-v1.html',provenance:'Pulse component'},
{id:'wonder-feed',title:'Wonder Feed',status:'live component',summary:'Procedural idea stream whose saved outputs feed the reference system.',source:'wonder-feed.html',provenance:'Pulse component'},
{id:'planet-workshop',title:'Planet Workshop',status:'experimental',summary:'Seeded planetary terrain, rivers and environment-driven vegetation.',source:'moor-planet-workshop.html',provenance:'Pulse component'},
{id:'moor-atlas',title:'MOOR Atlas',status:'experimental',summary:'Coordinates, places, claims and terrain-aware routes for spatial worlds.',source:'moor-atlas.html',provenance:'Pulse component'},
{id:'material-lab',title:'Material Lab',status:'specified',summary:'Recipe-first material system with deterministic layers, locks and verification contracts.',source:'pulse-training-blueprints-11.json',provenance:'training blueprint'},
{id:'evergreen-world',title:'EVERGREEN World Blueprint',status:'current build',summary:'The end-to-end public library planet you are standing inside.',source:BLUEPRINT_URL,provenance:'Funnel build'}
];

let scene,camera,renderer,raycaster,pointer;
const interactive=[];
const collision=[];
const mats={};
const clock=new THREE.Clock();

async function loadBlueprint(){
  try{
    const r=await fetch(BLUEPRINT_URL,{cache:'no-store'});
    if(!r.ok)throw new Error(String(r.status));
    state.blueprint=await r.json();
  }catch(e){
    state.blueprint={world:{zones:FALLBACK_ZONES},social_program:{recurring_formats:FALLBACK_PROGRAM},expansions:[],governance:{holder:'Evergreen Public Library Steward Assembly'}};
  }
}
function mat(name,color,rough=.7,metal=.05,opts={}){
  const m=new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,...opts});m.name=name;return m;
}
function setupMaterials(){
  mats.limestone=mat('civic limestone',0xd8d1bf,.82,.02);
  mats.limestoneDark=mat('shadow limestone',0xaaa38f,.9,.02);
  mats.bronze=mat('warm bronze',0x8c7143,.36,.68);
  mats.wood=mat('dark walnut',0x4e3528,.76,.02);
  mats.oak=mat('pale oak',0xb69b72,.78,.01);
  mats.glass=new THREE.MeshPhysicalMaterial({color:0xa8c0b8,roughness:.08,metalness:0,transparent:true,opacity:.24,transmission:.38,thickness:.2});
  mats.water=new THREE.MeshPhysicalMaterial({color:0x273c3a,roughness:.12,metalness:.05,transparent:true,opacity:.82});
  mats.green=mat('evergreen',0x2c4b38,.9,0);
  mats.green2=mat('evergreen light',0x45644a,.92,0);
  mats.ground=mat('ground',0x68745f,1,0);
  mats.path=mat('path',0xbab2a0,.93,.01);
  mats.dark=mat('dark metal',0x252928,.42,.6);
  mats.emissive=new THREE.MeshStandardMaterial({color:0xd7b97a,emissive:0x8a5a21,emissiveIntensity:.32,roughness:.55,metalness:.22});
}
function mesh(geo,material,x=0,y=0,z=0,cast=true,receive=true){
  const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=receive;scene.add(m);return m;
}
function box(w,h,d,material,x,y,z){return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z);}
function cyl(r,h,material,x,y,z,segments=40){return mesh(new THREE.CylinderGeometry(r,r,h,segments),material,x,y,z);}
function slab(w,d,y=.08,material=mats.path,x=0,z=0){return box(w,.16,d,material,x,y,z);}
function addColumn(x,z,h=8,r=.42,material=mats.limestone){
  const shaft=cyl(r,h,material,x,h/2,z,24);
  cyl(r*1.35,.28,mats.limestoneDark,x,.14,z,24);cyl(r*1.28,.24,mats.limestoneDark,x,h-.12,z,24);
  return shaft;
}
function addColumnsLine(x1,z1,x2,z2,count,h=7){
  for(let i=0;i<count;i++){const t=count===1?.5:i/(count-1);addColumn(THREE.MathUtils.lerp(x1,x2,t),THREE.MathUtils.lerp(z1,z2,t),h);}
}
function addTable(x,z,w=4,d=1.2){
  box(w,.16,d,mats.oak,x,.82,z);for(const sx of [-1,1])for(const sz of [-1,1])box(.12,.75,.12,mats.dark,x+sx*(w*.42),.4,z+sz*(d*.34));
}
function addBench(x,z,rot=0){
  const g=new THREE.Group();const seat=new THREE.Mesh(new THREE.BoxGeometry(2.8,.18,.65),mats.oak);seat.position.y=.64;g.add(seat);
  for(const sx of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.16,.58,.5),mats.dark);leg.position.set(sx*1.05,.31,0);g.add(leg);}
  g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);return g;
}
function signSprite(text,color='#f1ead9'){
  const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  ctx.font='600 32px Inter, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text.toUpperCase(),256,62);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));s.scale.set(9,2.25,1);return s;
}
function addLabel(text,x,y,z){
  const s=signSprite(text);s.position.set(x,y,z);scene.add(s);return s;
}
function addTree(x,z,scale=1){
  const g=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.18*scale,.24*scale,2.3*scale,7),mats.wood);trunk.position.y=1.15*scale;g.add(trunk);
  for(let i=0;i<3;i++){const cone=new THREE.Mesh(new THREE.ConeGeometry((1.45-i*.24)*scale,(3.3-i*.4)*scale,9),i%2?mats.green2:mats.green);cone.position.y=(2.6+i*.95)*scale;g.add(cone);}
  g.position.set(x,0,z);scene.add(g);return g;
}
function addLamp(x,z){
  box(.12,3.2,.12,mats.dark,x,1.6,z);const bulb=mesh(new THREE.SphereGeometry(.18,12,8),mats.emissive,x,3.18,z,false,false);return bulb;
}
function addReflectingPool(x,z,w,d){
  slab(w+1,d+1,.02,mats.limestoneDark,x,z);const p=slab(w,d,.11,mats.water,x,z);p.position.y=.11;return p;
}
function addLandscape(){
  const ground=mesh(new THREE.CircleGeometry(155,96),mats.ground,0,-.08,0,false,true);ground.rotation.x=-Math.PI/2;
  const water=mesh(new THREE.CircleGeometry(190,96),new THREE.MeshStandardMaterial({color:0x526b68,roughness:.42,metalness:.02}),0,-1.1,0,false,true);water.rotation.x=-Math.PI/2;
  // Axial and cross-campus walks.
  slab(12,224,.02,mats.path,0,6);slab(112,8,.025,mats.path,0,3);slab(78,7,.03,mats.path,0,-43);
  addReflectingPool(0,27,7,20);addReflectingPool(0,-25,5,12);
  // Outer tree belt.
  for(let i=0;i<64;i++){const a=i/64*Math.PI*2,r=116+(i%5)*3.5;addTree(Math.cos(a)*r,Math.sin(a)*r,.8+(i%4)*.12);}
  // Distant low-poly mountain rim.
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=168+(i%3)*9,h=18+(i%5)*5;const m=mesh(new THREE.ConeGeometry(15+(i%4)*3,h,7),mats.limestoneDark,Math.cos(a)*r,h/2-1.2,Math.sin(a)*r,false,true);m.rotation.y=a;}
}
function buildRotunda(){
  slab(36,36,.08,mats.path,0,0);cyl(17,.75,mats.limestone,0,.38,0,64);cyl(15,.42,mats.limestoneDark,0,.78,0,64);
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2;addColumn(Math.cos(a)*13.2,Math.sin(a)*13.2,9.4,.44);}
  const ring=new THREE.Mesh(new THREE.TorusGeometry(13.2,.58,14,72),mats.bronze);ring.position.y=9.25;ring.rotation.x=Math.PI/2;ring.castShadow=true;scene.add(ring);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(11.8,48,22,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x9a8251,roughness:.3,metalness:.52,side:THREE.DoubleSide}));dome.position.y=9.3;dome.castShadow=true;scene.add(dome);
  const oculus=new THREE.Mesh(new THREE.TorusGeometry(3.1,.32,12,42),mats.dark);oculus.position.y=20.72;oculus.rotation.x=Math.PI/2;scene.add(oculus);
  addLabel('Grand Rotunda',0,6.2,16.2);
  for(let i=0;i<5;i++)addTable(-5+i*2.5,0,1.8,.9);
}
function buildForum(){
  addReflectingPool(0,43,18,7);for(const x of [-13,-8,-3,3,8,13])addBench(x,37.5,0);
  for(const x of [-15,15])for(const z of [35,42,49])addLamp(x,z);
  addLabel('Forum of Questions',0,3.6,51);
}
function buildArrival(){
  for(let i=0;i<5;i++)slab(24-i*2,2,.03+i*.08,mats.limestone,0,67+i*2.1);
  box(1.2,5,.8,mats.bronze,-7,2.5,78);box(1.2,5,.8,mats.bronze,7,2.5,78);
  const beam=box(15.2,.55,.8,mats.bronze,0,5,78);beam.castShadow=true;addLabel('Public by default',0,3.1,74.6);
}
function buildHall(side){
  const sx=side==='east'?1:-1,x=sx*42,name=side==='east'?'Blueprint Stacks':'Public Reading Hall';
  slab(32,34,.03,mats.limestone,x,3);box(29,.55,30,mats.limestoneDark,x,7.4,3);
  addColumnsLine(x-13,18,x+13,18,8,7);addColumnsLine(x-13,-12,x+13,-12,8,7);
  for(const xx of [-11,-7,-3,3,7,11])addColumn(x+xx,18,7);
  for(let i=0;i<5;i++)addTable(x-8+i*4,3,3,1);
  if(side==='east'){
    for(let i=0;i<EXHIBITS.length;i++){
      const col=i%2,row=Math.floor(i/2),px=x-7+col*14,pz=13-row*6.5;
      const pl=cyl(1.1,.7,mats.bronze,px,.35,pz,28);pl.userData={kind:'blueprint',data:EXHIBITS[i]};interactive.push(pl);
      const folio=box(1.55,.12,1.1,mats.emissive,px,.78,pz);folio.rotation.y=(col?-.18:.18);folio.userData={kind:'blueprint',data:EXHIBITS[i]};interactive.push(folio);
    }
  }else{
    for(let rz=-8;rz<=12;rz+=5)for(let rx=-10;rx<=10;rx+=5)addTable(x+rx,rz,3.3,1);
  }
  addLabel(name,x,5.4,20.5);
}
function buildGrove(){
  const positions=[];for(let row=0;row<5;row++)for(let col=0;col<9;col++){const x=-28+col*7+(row%2)*2.2,z=-36-row*6.5;if(Math.abs(x)<8&&row<2)continue;positions.push([x,z,.8+((row+col)%4)*.08]);}
  positions.forEach(p=>addTree(...p));
  for(const x of [-14,-7,0,7,14]){const p=cyl(1.15,.55,mats.bronze,x,.28,-48,30);p.userData={kind:'evergreen',data:{title:'Evergreen '+(x===0?'Core':'Reference'),summary:'A maintained reusable pattern whose descendants and where-used links continue accumulating.',status:'promotion surface',source:BLUEPRINT_URL}};interactive.push(p);}
  addLabel('Evergreen Grove',0,4.2,-61);
  for(const x of [-18,-9,9,18])addBench(x,-54,Math.PI);
}
function buildMakers(){
  const x=50,z=-32;slab(30,25,.03,mats.path,x,z);box(28,.4,22,mats.dark,x,7,z);
  for(const xx of [-13,13])for(const zz of [-10,10])box(.38,13,.38,mats.dark,x+xx,6.5,z+zz);
  const front=new THREE.Mesh(new THREE.BoxGeometry(27,11,.18),mats.glass);front.position.set(x,5.5,z+10);scene.add(front);
  const side1=new THREE.Mesh(new THREE.BoxGeometry(.18,11,20),mats.glass);side1.position.set(x-13,5.5,z);scene.add(side1);
  const side2=side1.clone();side2.position.x=x+13;scene.add(side2);
  for(let i=0;i<4;i++)addTable(x-8+i*5.2,z,3.5,1.4);addLabel('Makers Hall',x,5,z+13);
}
function buildAmphitheater(){
  const cx=-50,cz=-34;for(let ring=0;ring<6;ring++){const r=5+ring*2.2;for(let i=0;i<11+ring*2;i++){const a=Math.PI*.12+(i/(10+ring*2))*Math.PI*.76;const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;const seat=box(1.3,.28,.75,mats.limestone,x,.15+ring*.12,z);seat.rotation.y=-a+Math.PI/2;}}
  box(12,.45,5,mats.wood,cx,.23,cz+1);addLabel('Civic Amphitheater',cx,4.1,cz+15);
}
function buildObservatory(){
  const x=0,z=-88;const mound=mesh(new THREE.CylinderGeometry(18,23,4,64),mats.green2,x,1.9,z,false,true);
  cyl(10,6,mats.limestone,x,5,z,48);const dome=new THREE.Mesh(new THREE.SphereGeometry(9,40,20,0,Math.PI*2,0,Math.PI/2),mats.dark);dome.position.set(x,8,z);scene.add(dome);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(10.5,.35,12,48),mats.bronze);ring.rotation.x=Math.PI/2;ring.position.set(x,6.8,z);scene.add(ring);
  addLabel('Unfinished Things',x,4.2,z+13);
}
function buildCommons(){
  const x=-48,z=44;slab(30,26,.03,mats.path,x,z);for(const xx of [-12,12])for(const zz of [-9,9])addColumn(x+xx,z+zz,5.8,.35);
  box(26,.42,19,mats.oak,x,5.8,z);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;addTable(x+Math.cos(a)*7,z+Math.sin(a)*6,2.6,1);}
  for(const xx of [-13,13])addTree(x+xx,z+7,.8);addLabel('Social Commons',x,4.4,z+14);
}
function buildVault(){
  const x=48,z=44;slab(28,24,.03,mats.limestoneDark,x,z);box(26,8,20,mats.limestoneDark,x,4,z);box(4,6,.45,mats.bronze,x,3,z+10.2);
  for(const xx of [-8,8])addLamp(x+xx,z+12);addLabel('Archive Vault',x,4,z+12.5);
}
function buildGates(){
  for(const x of [-8,8]){box(1.8,13,2,mats.limestone,x,6.5,108);box(.9,13,.9,mats.bronze,x,6.5,108);}
  box(18,1.3,2,mats.limestone,0,12.4,108);addLabel('Future Branches',0,6.1,104);
  // Expansion beacons on horizon.
  const parcels=[[-86,-82,'Conservatory Belt'],[88,-80,'College of Making'],[-105,72,'Regional Branch Transit'],[104,76,'Planetary Exchange']];
  parcels.forEach(([x,z,n])=>{const b=cyl(.28,8,mats.bronze,x,4,z,12);const halo=new THREE.Mesh(new THREE.TorusGeometry(2.2,.08,8,36),mats.emissive);halo.position.set(x,8,z);halo.rotation.x=Math.PI/2;scene.add(halo);addLabel(n,x,10,z);});
}
function buildCampus(){
  addLandscape();buildArrival();buildForum();buildRotunda();buildHall('east');buildHall('west');buildGrove();buildMakers();buildAmphitheater();buildObservatory();buildCommons();buildVault();buildGates();
  for(let z=-75;z<=92;z+=14){addLamp(-5.5,z);addLamp(5.5,z);}
}
function setupScene(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x9aa89d);scene.fog=new THREE.Fog(0x9aa89d,95,245);
  camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,600);camera.position.set(0,2.25,88);
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;document.body.prepend(renderer.domElement);
  const hemi=new THREE.HemisphereLight(0xeaf2e7,0x53604f,1.35);hemi.name='hemi';scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff0d5,2.3);sun.name='sun';sun.position.set(-48,72,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-120;sun.shadow.camera.right=120;sun.shadow.camera.top=120;sun.shadow.camera.bottom=-120;sun.shadow.camera.near=1;sun.shadow.camera.far=220;sun.shadow.bias=-.0002;scene.add(sun);
  setupMaterials();buildCampus();raycaster=new THREE.Raycaster();pointer=new THREE.Vector2();
}
function setLighting(mode){
  state.light=mode;const sun=scene.getObjectByName('sun'),hemi=scene.getObjectByName('hemi');
  if(mode==='day'){scene.background.set(0x9aa89d);scene.fog.color.set(0x9aa89d);sun.color.set(0xfff0d5);sun.intensity=2.3;sun.position.set(-48,72,35);hemi.color.set(0xeaf2e7);hemi.intensity=1.35;renderer.toneMappingExposure=1.08;$('#lightBtn').textContent='☼';}
  else{scene.background.set(0x252b31);scene.fog.color.set(0x30383a);sun.color.set(0xffba75);sun.intensity=1.35;sun.position.set(58,30,48);hemi.color.set(0x61717c);hemi.intensity=.65;renderer.toneMappingExposure=.88;$('#lightBtn').textContent='◐';}
  try{localStorage.setItem('moor.evergreen.light',mode);}catch(e){}
}
function updateCameraRotation(){
  state.pitch=THREE.MathUtils.clamp(state.pitch,-.9,.8);camera.rotation.order='YXZ';camera.rotation.y=state.yaw;camera.rotation.x=state.pitch;
}
function movement(dt){
  const speed=(state.keys.ShiftLeft||state.keys.ShiftRight)?10.5:6.3;
  let forward=0,side=0;
  if(state.keys.KeyW||state.keys.ArrowUp||state.keys.forward)forward+=1;
  if(state.keys.KeyS||state.keys.ArrowDown||state.keys.back)forward-=1;
  if(state.keys.KeyA||state.keys.ArrowLeft||state.keys.left)side-=1;
  if(state.keys.KeyD||state.keys.ArrowRight||state.keys.right)side+=1;
  if(!forward&&!side)return;
  const len=Math.hypot(forward,side)||1;forward/=len;side/=len;
  const f=new THREE.Vector3(-Math.sin(state.yaw),0,-Math.cos(state.yaw));
  const r=new THREE.Vector3(Math.cos(state.yaw),0,-Math.sin(state.yaw));
  camera.position.addScaledVector(f,forward*speed*dt).addScaledVector(r,side*speed*dt);
  const rad=Math.hypot(camera.position.x,camera.position.z);if(rad>143){camera.position.x*=143/rad;camera.position.z*=143/rad;}
  camera.position.y=2.25;state.travel=null;
}
function travelTo(zone){
  if(!zone)return;closeDrawer();const tx=zone.x,tz=zone.z+Math.max(8,zone.id==='observatory'?16:10);
  const target={x:tx,y:2.25,z:tz,yaw:Math.atan2(-(zone.x-tx),-(zone.z-tz))};
  if(prefersReduced){camera.position.set(target.x,target.y,target.z);state.yaw=target.yaw;updateCameraRotation();}
  else state.travel={from:camera.position.clone(),to:new THREE.Vector3(target.x,target.y,target.z),start:performance.now(),dur:850,yaw0:state.yaw,yaw1:target.yaw};
  toast('Travel · '+zone.name);
}
function updateTravel(now){
  const t=state.travel;if(!t)return;let p=Math.min(1,(now-t.start)/t.dur);p=p*p*(3-2*p);camera.position.lerpVectors(t.from,t.to,p);state.yaw=THREE.MathUtils.lerp(t.yaw0,t.yaw1,p);updateCameraRotation();if(p>=1)state.travel=null;
}
function nearestZone(){
  const zones=(state.blueprint&&state.blueprint.world&&state.blueprint.world.zones)||FALLBACK_ZONES;let best=null,bd=1e9;
  zones.forEach(z=>{const d=Math.hypot(camera.position.x-z.x,camera.position.z-z.z);if(d<bd){bd=d;best=z;}});
  return bd<26?best:{id:'civic-shelf',name:'The Civic Shelf',role:'Public campus',purpose:'The first public library district on EVERGREEN.'};
}
function updateZone(){
  const z=nearestZone();if(state.zone&&state.zone.id===z.id)return;state.zone=z;$('#placeTop').textContent=z.name;$('#locRole').textContent=z.role||'PUBLIC CAMPUS';$('#locName').textContent=z.name;$('#locPurpose').textContent=z.purpose||'';try{localStorage.setItem('moor.evergreen.last-zone',z.id);}catch(e){}
}
function animate(now){
  requestAnimationFrame(animate);const dt=Math.min(.05,(now-state.last)/1000||.016);state.last=now;movement(dt);updateTravel(now);updateZone();
  const t=now*.00025;interactive.forEach((o,i)=>{if(o.userData.kind==='evergreen')o.rotation.y=t+i*.4;});
  renderer.render(scene,camera);
}
function panelCard(title,meta,body,buttons=''){return '<article class="card"><small>'+escapeHTML(meta||'')+'</small><h3>'+escapeHTML(title)+'</h3><p>'+escapeHTML(body||'')+'</p>'+buttons+'</article>';}
function openDrawer(kind){
  const bp=state.blueprint||{},body=$('#drawerBody'),title=$('#drawerTitle');body.innerHTML='';
  document.querySelectorAll('[data-panel]').forEach(b=>b.classList.toggle('on',b.dataset.panel===kind));
  if(kind==='map'){
    title.textContent='Campus map';
    const zones=(bp.world&&bp.world.zones)||FALLBACK_ZONES;
    body.innerHTML=zones.map((z,i)=>'<article class="card zone-row" data-zone="'+escapeHTML(z.id)+'"><span class="n">'+String(i+1).padStart(2,'0')+'</span><div><b>'+escapeHTML(z.name)+'</b><br><span>'+escapeHTML(z.role)+(z.built===false?' · expansion':'')+'</span></div><span class="go">GO</span></article>').join('');
    body.querySelectorAll('[data-zone]').forEach(el=>el.onclick=()=>travelTo(zones.find(z=>z.id===el.dataset.zone)));
  }else if(kind==='program'){
    title.textContent='Public program';
    const list=(bp.social_program&&bp.social_program.recurring_formats)||FALLBACK_PROGRAM;
    body.innerHTML=panelCard('Social by design','program architecture','These are recurring formats the world is designed to host. They are not a fake live schedule. Real attendance/calendar data requires the future relay.')+
      list.map(x=>panelCard(x.name,x.home,x.value||x.purpose||'', '<div class="row"><button class="pill" data-home="'+escapeHTML(x.home)+'">Go to space</button></div>')).join('');
    body.querySelectorAll('[data-home]').forEach(el=>el.onclick=()=>{const zones=(bp.world&&bp.world.zones)||FALLBACK_ZONES;travelTo(zones.find(z=>z.name===el.dataset.home));});
  }else if(kind==='library'){
    title.textContent='Public blueprint library';
    body.innerHTML=panelCard('Open holdings','public by default','These folios are current exhibits. Provenance/status stay visible; a decorative case never counts as verification.')+
      EXHIBITS.map((x,i)=>panelCard(x.title,x.status+' · '+x.provenance,x.summary,'<div class="row"><button class="pill primary" data-exhibit="'+i+'">Inspect folio</button></div>')).join('');
    body.querySelectorAll('[data-exhibit]').forEach(el=>selectExhibit(EXHIBITS[+el.dataset.exhibit]));
  }else{
    title.textContent='About EVERGREEN';
    const holder=bp.governance&&bp.governance.holder||'Evergreen Public Library Steward Assembly';
    body.innerHTML=panelCard('Public world','stewardship',holder+' maintains this planet as a public library world. Canonical holdings are publicly readable; personal drafts are not forced public.')+
      panelCard('Controls','traversal','Desktop: WASD or arrows, drag to look. Phone: direction pad to move, drag the world to look. Map travel is an accessibility shortcut, not a separate mode.')+
      panelCard('Honest boundary','network','The campus, exhibits and program architecture are real in this build. Multiplayer presence, accounts, authoritative ownership and live event calendars are not connected yet.')+
      panelCard('Open source','MOOR','This world is part of the open MOOR service. Its build blueprint lives at '+BLUEPRINT_URL+'.');
  }
  $('#drawer').classList.add('open');
}
function closeDrawer(){ $('#drawer').classList.remove('open');document.querySelectorAll('[data-panel]').forEach(b=>b.classList.remove('on')); }
function selectExhibit(data){
  if(!data)return;state.selected=data;$('#inspectMeta').textContent=(data.status||'Blueprint')+' · '+(data.provenance||'');$('#inspectTitle').textContent=data.title;$('#inspectBody').textContent=data.summary;$('#inspector').classList.add('open');closeDrawer();
}
function inspectRay(clientX,clientY){
  const rect=renderer.domElement.getBoundingClientRect();pointer.x=((clientX-rect.left)/rect.width)*2-1;pointer.y=-((clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);
  const hit=raycaster.intersectObjects(interactive,false)[0];if(hit&&hit.object.userData.data)selectExhibit(hit.object.userData.data);
}
function setupUI(){
  document.querySelectorAll('[data-panel]').forEach(b=>b.onclick=()=>{const open=$('#drawer').classList.contains('open')&&b.classList.contains('on');open?closeDrawer():openDrawer(b.dataset.panel);});
  $('#drawerClose').onclick=closeDrawer;$('#inspectClose').onclick=()=>$('#inspector').classList.remove('open');
  $('#lightBtn').onclick=()=>setLighting(state.light==='day'?'evening':'day');
  $('#inspectAsk').onclick=async()=>{if(!state.selected)return;const q='Explain the '+state.selected.title+' reference in the context of EVERGREEN Public Blueprint Library.';if(window.MOOR&&MOOR.request){const r=await MOOR.request({input:q,source:'evergreen-library',context:{selection:state.selected.id||state.selected.title}});toast('MOOR · '+r.route);}else toast('MOOR request router unavailable');};
  $('#inspectFork').onclick=async()=>{if(!state.selected)return;const q='Fork or build from the '+state.selected.title+' blueprint while preserving its provenance and explicit requirements.';if(window.MOOR&&MOOR.request){const r=await MOOR.request({input:q,source:'evergreen-library',context:{selection:state.selected.id||state.selected.title,world:'EVERGREEN'}});toast(r.route==='funnel'?'Sent to Funnel':('MOOR · '+r.route));}else toast('MOOR request router unavailable');};
  $('#inspectOpen').onclick=()=>{if(!state.selected||!state.selected.source)return;location.href=new URL(state.selected.source,location.href).href;};
  addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(document.activeElement&&document.activeElement.tagName||''))return;state.keys[e.code]=true;});
  addEventListener('keyup',e=>state.keys[e.code]=false);
  document.querySelectorAll('#dpad [data-move]').forEach(b=>{const k=b.dataset.move;const on=e=>{e.preventDefault();state.keys[k]=true;};const off=e=>{e.preventDefault();state.keys[k]=false;};b.addEventListener('pointerdown',on);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('pointerleave',off);});
  let lastX=0,lastY=0,downX=0,downY=0;
  renderer.domElement.addEventListener('pointerdown',e=>{state.drag=true;state.dragMoved=0;lastX=downX=e.clientX;lastY=downY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!state.drag)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;state.dragMoved+=Math.abs(dx)+Math.abs(dy);lastX=e.clientX;lastY=e.clientY;state.yaw-=dx*.0042;state.pitch-=dy*.0035;updateCameraRotation();});
  renderer.domElement.addEventListener('pointerup',e=>{if(state.drag&&state.dragMoved<8)inspectRay(e.clientX,e.clientY);state.drag=false;});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}
async function boot(){
  try{
    await loadBlueprint();setupScene();setupUI();updateCameraRotation();
    const saved=(()=>{try{return localStorage.getItem('moor.evergreen.light')}catch(e){return null}})();setLighting(saved==='evening'?'evening':'day');
    const z=(state.blueprint.world&&state.blueprint.world.zones||FALLBACK_ZONES).find(x=>x.id==='arrival-terrace');if(z)camera.position.set(z.x,2.25,z.z+12);
    updateZone();requestAnimationFrame(animate);
    try{window.MoorOutput&&MoorOutput.emit({id:'artifact:evergreen-public-library-world',kind:'artifact',title:'EVERGREEN Public Blueprint Library',summary:'Traversable first-campus implementation of the public Morverse Blueprint Library world.',source:{app:'morverse-evergreen-library',component:'evergreen-public-library'},concepts:['public library','blueprint library','3d world','evergreen knowledge'],recipe:{blueprint:BLUEPRINT_URL,runtime:'morverse-evergreen-library.html'},implementation_ref:'morverse-evergreen-library.html',status:'generated',provenance:'procedural'});}catch(e){}
  }catch(err){
    console.error(err);$('#bootMessage').textContent='WebGL/Three.js failed to initialize: '+String(err&&err.message||err);$('#bootError').style.display='grid';
  }
}
boot();
