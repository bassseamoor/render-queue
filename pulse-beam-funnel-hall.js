import * as THREE from './three.module.js';

const graph=window.FUNNEL_ENVIRONMENT_GRAPH||{nodes:[],edges:[],currentLaw:{}};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage=document.getElementById('stage');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x010409);
scene.fog=new THREE.FogExp2(0x010409,0.028);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.1;
stage.appendChild(renderer.domElement);

const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.05,160);
camera.position.set(0,3.4,20);

scene.add(new THREE.HemisphereLight(0xeaf8ff,0x020406,1.05));
const key=new THREE.PointLight(0xc7efff,90,38,2);key.position.set(6,10,12);scene.add(key);
const emerald=new THREE.PointLight(0x4be0a3,55,28,2);emerald.position.set(-8,5,-5);scene.add(emerald);
const rim=new THREE.DirectionalLight(0xffffff,1.3);rim.position.set(-6,10,-10);scene.add(rim);

const floorMat=new THREE.MeshPhysicalMaterial({color:0x05080d,metalness:.48,roughness:.2,clearcoat:1,clearcoatRoughness:.18});
const floor=new THREE.Mesh(new THREE.CircleGeometry(34,96),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-3.9;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(48,48,0x143442,0x0b1b24);grid.position.y=-3.86;grid.material.opacity=.16;grid.material.transparent=true;scene.add(grid);

const wallMat=new THREE.MeshPhysicalMaterial({color:0x08131d,transparent:true,opacity:.14,roughness:.18,metalness:.1,transmission:.58,thickness:.7,side:THREE.BackSide,depthWrite:false});
const wall=new THREE.Mesh(new THREE.CylinderGeometry(27,27,15,96,1,true),wallMat);wall.position.y=2.8;scene.add(wall);

const platformMat=new THREE.MeshPhysicalMaterial({color:0x081017,metalness:.55,roughness:.16,clearcoat:1,clearcoatRoughness:.12});
const platform=new THREE.Mesh(new THREE.CylinderGeometry(9.2,10.1,.72,96),platformMat);platform.position.y=-3.55;scene.add(platform);
const platformRing=new THREE.Mesh(new THREE.TorusGeometry(9.45,.035,8,128),new THREE.MeshBasicMaterial({color:0xa8e8ff,transparent:true,opacity:.26}));platformRing.rotation.x=Math.PI/2;platformRing.position.y=-3.17;scene.add(platformRing);

const architecture=new THREE.Group();architecture.position.y=.45;scene.add(architecture);

function bounds(nodes){
  const pts=nodes.map(n=>n.position).filter(Boolean);
  if(!pts.length)return {min:{x:-1,y:-1,z:-1},max:{x:1,y:1,z:1}};
  const min={x:Infinity,y:Infinity,z:Infinity},max={x:-Infinity,y:-Infinity,z:-Infinity};
  pts.forEach(p=>['x','y','z'].forEach(k=>{min[k]=Math.min(min[k],Number(p[k])||0);max[k]=Math.max(max[k],Number(p[k])||0)}));
  return {min,max};
}
const b=bounds(graph.nodes);
const span=Math.max(1,b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z);
const scale=15/span;
const center={x:(b.min.x+b.max.x)/2,y:(b.min.y+b.max.y)/2,z:(b.min.z+b.max.z)/2};
function pos(n){
  const p=n.position||{x:0,y:0,z:0};
  return new THREE.Vector3((p.x-center.x)*scale,(p.y-center.y)*scale,(p.z-center.z)*scale);
}

const nodeMap=new Map(),pickables=[],animated=[];
function materialFor(n){
  if(n.type==='law-active')return new THREE.MeshPhysicalMaterial({color:0x4be0a3,emissive:0x184f3b,emissiveIntensity:1.4,metalness:.12,roughness:.12,clearcoat:1,transmission:.14});
  if(n.type==='law-candidate')return new THREE.MeshPhysicalMaterial({color:0xf7fbff,emissive:0x5f7885,emissiveIntensity:.6,metalness:.05,roughness:.08,clearcoat:1,transmission:.24});
  if(n.type==='funnel')return new THREE.MeshPhysicalMaterial({color:0xa8e8ff,emissive:0x17475e,emissiveIntensity:.72,transparent:true,opacity:.72,roughness:.08,metalness:.02,clearcoat:1,transmission:.42,thickness:.7,depthWrite:false});
  if(n.type==='law-plane')return new THREE.MeshPhysicalMaterial({color:0xa8e8ff,emissive:0x143a4b,emissiveIntensity:.65,roughness:.16,metalness:.1,clearcoat:1});
  return new THREE.MeshPhysicalMaterial({color:0x9bb7c8,emissive:0x102330,emissiveIntensity:.36,roughness:.22,metalness:.16,clearcoat:.7});
}
for(const n of graph.nodes){
  let geo,mesh;
  if(n.type==='funnel'){
    geo=new THREE.ConeGeometry(.55,1.5,28,1,true);
    mesh=new THREE.Mesh(geo,materialFor(n));mesh.rotation.z=Math.PI;
  }else{
    const r=n.type==='law-active'?0.48:n.type==='law-candidate'?0.42:n.type==='law-plane'?0.32:0.19;
    geo=new THREE.SphereGeometry(r,20,14);mesh=new THREE.Mesh(geo,materialFor(n));
  }
  mesh.position.copy(pos(n));mesh.userData.node=n;architecture.add(mesh);nodeMap.set(n.id,mesh);pickables.push(mesh);
  if(n.type==='funnel'||n.type==='law-active'||n.type==='law-candidate')animated.push(mesh);
}
const edgeMatCache=new Map();
function edgeColor(e){
  if(e.type==='governs')return 0x4be0a3;
  if(e.type==='candidate')return 0xf7fbff;
  if(e.type==='contains-plane')return 0x5fd7ff;
  return 0x6b8ea2;
}
const flow=[];
for(const e of graph.edges){
  const a=nodeMap.get(e.from),c=nodeMap.get(e.to);if(!a||!c)continue;
  const color=edgeColor(e),keyC=String(color);
  if(!edgeMatCache.has(keyC))edgeMatCache.set(keyC,new THREE.LineBasicMaterial({color,transparent:true,opacity:e.type==='governs'?.62:e.type==='candidate'?.48:.18}));
  const g=new THREE.BufferGeometry().setFromPoints([a.position,c.position]);
  architecture.add(new THREE.Line(g,edgeMatCache.get(keyC)));
  if(flow.length<64&&(e.type==='governs'||e.type==='candidate'||e.type==='contains-plane'||Math.random()<.12)){
    const p=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.68}));
    p.userData={a:a.position.clone(),b:c.position.clone(),phase:Math.random()};
    architecture.add(p);flow.push(p);
  }
}

const crown=new THREE.Group();scene.add(crown);
for(let i=0;i<3;i++){
  const t=new THREE.Mesh(new THREE.TorusGeometry(10.6+i*.55,.018+i*.006,8,160),new THREE.MeshBasicMaterial({color:i===2?0x4be0a3:0xa8e8ff,transparent:true,opacity:i===2?.13:.19}));
  t.rotation.x=Math.PI/2+(i-1)*.08;t.rotation.z=i*.35;t.position.y=.45;crown.add(t);
}
for(let i=0;i<8;i++){
  const a=i/8*Math.PI*2;
  const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,9,10),new THREE.MeshBasicMaterial({color:0xbdeeff,transparent:true,opacity:.10}));
  pillar.position.set(Math.cos(a)*13,.7,Math.sin(a)*13);scene.add(pillar);
}

const funnelNodes=graph.nodes.filter(n=>n.type==='funnel');
document.getElementById('hall-count').textContent=funnelNodes.length+' specialist funnels';
const law=graph.currentLaw||{};
document.getElementById('hall-state').innerHTML='<b class="emerald">'+(law.active||'v44-sealed')+'</b> ACTIVE &nbsp;·&nbsp; <b class="ice">'+(law.candidate||'ultra-v1-candidate')+'</b> CANDIDATE';

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
function inspect(mesh){
  const n=mesh&&mesh.userData.node;if(!n)return;
  document.getElementById('info-type').textContent=(n.type||'node').replace(/-/g,' ');
  document.getElementById('info-title').textContent=n.label||n.id;
  document.getElementById('info-copy').textContent=n.detail||'Live Funnel architecture node.';
  document.getElementById('info-status').textContent=n.type==='law-active'?'ACTIVE':n.type==='law-candidate'?'CANDIDATE':'LIVE GRAPH';
  document.getElementById('info').classList.add('on');
}

let yaw=0,pitch=-.06,drag=null,moved=false,edgeNav=null;
function look(){
  const dir=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
  camera.lookAt(camera.position.clone().add(dir));
}
look();
function moveForward(amount){
  const dir=new THREE.Vector3(Math.sin(yaw),0,-Math.cos(yaw));
  camera.position.addScaledVector(dir,amount);
  const r=Math.hypot(camera.position.x,camera.position.z);
  if(r>24){camera.position.x*=24/r;camera.position.z*=24/r}
  camera.position.y=Math.max(-2.7,Math.min(7,camera.position.y));
}
renderer.domElement.addEventListener('pointerdown',e=>{
  renderer.domElement.setPointerCapture?.(e.pointerId);
  if(e.clientX<28){edgeNav={x:e.clientX,y:e.clientY};return}
  drag={x:e.clientX,y:e.clientY};moved=false;
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(edgeNav)return;
  if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>4)moved=true;
  yaw-=dx*.0045;pitch-=dy*.0038;pitch=Math.max(-1.05,Math.min(1.0,pitch));drag={x:e.clientX,y:e.clientY};look();
});
renderer.domElement.addEventListener('pointerup',e=>{
  if(edgeNav){const dx=e.clientX-edgeNav.x;edgeNav=null;if(dx>78){parent.postMessage({type:'beam:navigate',space:'create'},'*');return}}
  if(drag&&!moved){
    const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;
    raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(pickables,false);if(hits[0])inspect(hits[0].object);
  }
  drag=null;
});
renderer.domElement.addEventListener('wheel',e=>{moveForward(Math.sign(e.deltaY)*-.65)},{passive:true});

const held={forward:false,back:false};
function hold(btn,key){const on=()=>held[key]=true,off=()=>held[key]=false;btn.addEventListener('pointerdown',on);btn.addEventListener('pointerup',off);btn.addEventListener('pointercancel',off);btn.addEventListener('pointerleave',off)}
hold(document.getElementById('forward'),'forward');hold(document.getElementById('back'),'back');
const keys=new Set();
addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.key==='Escape')parent.postMessage({type:'beam:navigate',space:'create'},'*')});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

document.getElementById('foundry').onclick=()=>parent.postMessage({type:'beam:open-component',ids:['funnel-fabric','funnel-environment','funnel']},'*');
document.getElementById('refinery').onclick=()=>parent.postMessage({type:'beam:open-component',ids:['capability-memory','moor-refinery']},'*');

let audio=null,soundOn=false;
document.getElementById('sound').onclick=async function(){
  soundOn=!soundOn;this.classList.toggle('live',soundOn);this.textContent=soundOn?'●':'◌';
  if(soundOn){
    const C=window.AudioContext||window.webkitAudioContext;audio=audio||new C();await audio.resume();
    if(!audio._beam){const o=audio.createOscillator(),g=audio.createGain(),f=audio.createBiquadFilter();o.type='sine';o.frequency.value=54;f.type='lowpass';f.frequency.value=140;g.gain.value=.012;o.connect(f).connect(g).connect(audio.destination);o.start();audio._beam={o,g}}
    audio._beam.g.gain.setTargetAtTime(.012,audio.currentTime,.08);
  }else if(audio&&audio._beam)audio._beam.g.gain.setTargetAtTime(0,audio.currentTime,.08);
};

addEventListener('message',e=>{if(e.data&&e.data.type==='beam:entered'){look()}});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

const clock=new THREE.Clock();
function tick(){
  requestAnimationFrame(tick);const t=clock.getElapsedTime(),dt=Math.min(.04,clock.getDelta?0.016:0.016);
  if(!reduced){
    architecture.rotation.y=Math.sin(t*.13)*.055;
    crown.rotation.y=t*.035;
    animated.forEach((m,i)=>{const s=1+Math.sin(t*.75+i*.9)*.035;m.scale.setScalar(s)});
    flow.forEach((p,i)=>{const q=(t*.16+p.userData.phase+i*.013)%1;p.position.lerpVectors(p.userData.a,p.userData.b,q);p.material.opacity=.32+.42*Math.sin(q*Math.PI)});
  }
  const speed=.085;
  if(keys.has('w')||keys.has('arrowup')||held.forward)moveForward(speed);
  if(keys.has('s')||keys.has('arrowdown')||held.back)moveForward(-speed);
  if(keys.has('a')){camera.position.x-=Math.cos(yaw)*speed}
  if(keys.has('d')){camera.position.x+=Math.cos(yaw)*speed}
  look();
  renderer.render(scene,camera);
}
tick();