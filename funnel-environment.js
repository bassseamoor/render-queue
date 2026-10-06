import * as THREE from './three.module.js';

const root=document.getElementById('stage');
const source=window.FUNNEL_ENVIRONMENT_GRAPH;
if(!source) throw new Error('Funnel environment graph is missing.');

const graph=JSON.parse(JSON.stringify(source));
const kernel=window.MOORFunnelKernel;
let liveSession=null;
try{
  liveSession=kernel&&kernel.inspect?kernel.inspect():null;
}catch(e){ liveSession=null; }

if(liveSession&&liveSession.page0){
  const p=graph.nodes.find(n=>n.id==='page0');
  if(p){
    p.detail='LIVE PAGE 0: '+liveSession.page0;
    p.live=true;
  }
  const obs=(liveSession.stages&&liveSession.stages.replay&&liveSession.stages.replay.obligations)||
    (kernel&&kernel.extractObligations?kernel.extractObligations(liveSession.page0):[]);
  obs.forEach((o,i)=>{
    const id='live.obligation.'+i;
    graph.nodes.push({
      id,label:'R'+String(i+1).padStart(2,'0'),type:'live-requirement',layer:15,lane:0,
      detail:o.source||'Live Page 0 obligation',source:o.source||'',live:true,liveIndex:i
    });
    graph.edges.push({from:'receipt.requirements',to:id,type:'authorize',label:'live requirement'});
  });
}

const nodeById=new Map(graph.nodes.map(n=>[n.id,n]));
const COLORS={
  source:0x7edcff,gate:0x94e8ff,funnel:0x50cfff,step:0x8db8d9,ballot:0xd78cff,
  'need-category':0xb67cff,need:0x82a8c9,meta:0x7ff0c5,interview:0xe58bff,final:0x7ddcff,
  replay:0xffcf70,receipt:0xffad5a,execution:0x67d6ff,learning:0xff758c,
  'live-requirement':0xffffff,
  'law-active':0x50e3a4,
  'law-candidate':0xf6fbff,
  'law-plane':0xaeeaff
};
const EDGE_COLORS={
  flow:0x75d9ff,route:0x75d9ff,ballot:0x8cf0bd,classify:0xe88cff,contains:0x8b9fb0,
  aggregate:0x8cf0bd,resolve:0xffb86b,branch:0xe88cff,feedback:0xff718b,
  authorize:0xffb86b,execute:0xffb86b,evidence:0x8cf0bd,
  governs:0x50e3a4,candidate:0xaeeaff,'contains-plane':0x63d8ff
};
const LAYER_Y={};
for(let i=0;i<=17;i++)LAYER_Y[i]=52-i*6.2;

function positionFor(n){
  if(n.position && Number.isFinite(Number(n.position.x)) && Number.isFinite(Number(n.position.y)) && Number.isFinite(Number(n.position.z))){
    return new THREE.Vector3(Number(n.position.x),Number(n.position.y),Number(n.position.z));
  }
  if(n.type==='need-category'){
    const a=(n.index/13)*Math.PI*2-Math.PI/2;
    return new THREE.Vector3(Math.cos(a)*22,LAYER_Y[4],Math.sin(a)*7);
  }
  if(n.type==='need'){
    const gi=Math.floor((n.needNumber-1)/10), ni=n.ordinal||0;
    const a=(gi/13)*Math.PI*2-Math.PI/2;
    const r=25+ni*1.35;
    return new THREE.Vector3(Math.cos(a)*r,LAYER_Y[5]-(ni%2)*0.3,Math.sin(a)*(7+ni*0.38));
  }
  if(n.type==='live-requirement'){
    const a=(n.liveIndex/Math.max(1,graph.nodes.filter(x=>x.type==='live-requirement').length))*Math.PI*2;
    return new THREE.Vector3(Math.cos(a)*9,LAYER_Y[15]-2.2,Math.sin(a)*4);
  }
  const x=(Number(n.lane)||0)*7.2;
  let z=0;
  if(n.type==='interview')z=6;
  if(n.type==='learning')z=-2.5;
  if(n.type==='receipt')z=1.8;
  if(n.type==='final')z=-1.2;
  if(n.type==='funnel')z=((Number(n.lane)||0)%2)*0.6;
  return new THREE.Vector3(x,LAYER_Y[n.layer]??0,z);
}

graph.nodes.forEach(n=>{n._pos=positionFor(n);});

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x03070d);
scene.fog=new THREE.FogExp2(0x03070d,0.0062);

const hemi=new THREE.HemisphereLight(0xf6fbff,0x07111b,1.2);
scene.add(hemi);
const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(-25,55,45);scene.add(key);
const fill=new THREE.PointLight(0x63d8ff,24,180);fill.position.set(18,15,30);scene.add(fill);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setSize(root.clientWidth,root.clientHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
root.appendChild(renderer.domElement);

const perspective=new THREE.PerspectiveCamera(42,1,0.1,500);
const ortho=new THREE.OrthographicCamera(-60,60,40,-40,0.1,500);
let camera=ortho;

const target=new THREE.Vector3(0,-1,0);
const controls={theta:0.48,phi:1.16,radius:126,tTheta:0.48,tPhi:1.16,tRadius:126};
function applyCamera(){
  controls.phi+=(controls.tPhi-controls.phi)*0.12;
  controls.theta+=(controls.tTheta-controls.theta)*0.12;
  controls.radius+=(controls.tRadius-controls.radius)*0.12;
  const sp=Math.sin(controls.phi);
  const x=target.x+controls.radius*sp*Math.sin(controls.theta);
  const y=target.y+controls.radius*Math.cos(controls.phi);
  const z=target.z+controls.radius*sp*Math.cos(controls.theta);
  perspective.position.set(x,y,z); perspective.lookAt(target);
  ortho.position.set(x,y,z); ortho.lookAt(target);
  const aspect=Math.max(0.4,root.clientWidth/Math.max(1,root.clientHeight));
  const span=controls.radius*0.48;
  ortho.left=-span*aspect;ortho.right=span*aspect;ortho.top=span;ortho.bottom=-span;ortho.updateProjectionMatrix();
}
applyCamera();

const grid=new THREE.GridHelper(120,24,0x173044,0x0e1d2a);
grid.rotation.x=Math.PI/2;
grid.position.z=-8;
grid.material.opacity=0.32;grid.material.transparent=true;
scene.add(grid);

const layerGroup=new THREE.Group();scene.add(layerGroup);
const majorLayers=[
  [0,'PAGE 0'],[2,'SPECIALISTS'],[5,'130 NEEDS'],[9,'META'],[13,'CONVERGENCE'],
  [14,'REPLAY'],[15,'RECEIPTS'],[16,'EXECUTION'],[17,'LEARNING']
];
majorLayers.forEach(([layer])=>{
  const y=LAYER_Y[layer];
  const curve=new THREE.EllipseCurve(0,y,41,1.2,0,Math.PI*2,false,0);
  const pts=curve.getPoints(96).map(p=>new THREE.Vector3(p.x,p.y,-7.2));
  const geom=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineBasicMaterial({color:0x173e55,transparent:true,opacity:0.52});
  layerGroup.add(new THREE.LineLoop(geom,mat));
});

function labelSprite(text,color=0xddeeff,scale=1){
  const c=document.createElement('canvas'),ctx=c.getContext('2d');
  const dpr=2;c.width=512*dpr;c.height=80*dpr;ctx.scale(dpr,dpr);
  ctx.font='600 22px Inter,Segoe UI,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(4,9,15,.82)';ctx.fillRect(1,8,510,64);
  ctx.strokeStyle='rgba(90,170,215,.38)';ctx.strokeRect(1.5,8.5,509,63);
  ctx.fillStyle='#'+new THREE.Color(color).getHexString();ctx.fillText(text.slice(0,42),256,40);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});
  const s=new THREE.Sprite(mat);s.scale.set(10.4*scale,1.65*scale,1);return s;
}

const nodeGroup=new THREE.Group(),edgeGroup=new THREE.Group(),labelGroup=new THREE.Group();
scene.add(edgeGroup,nodeGroup,labelGroup);
const meshById=new Map(), labelById=new Map(), edgeObjects=[];

function makeNode(n){
  const color=COLORS[n.type]||0x9db5c8;
  let geom,mat,mesh;
  if(n.type==='funnel'){
    geom=new THREE.CylinderGeometry(2.7,0.55,4.3,28,1,true);
    mat=new THREE.MeshBasicMaterial({color,wireframe:true,transparent:true,opacity:0.9});
    mesh=new THREE.Mesh(geom,mat);
  }else{
    let r=0.46;
    if(['source','receipt','law-active','law-candidate'].includes(n.type))r=0.72;
    if(['gate','meta','final','replay','execution','learning','ballot','law-plane'].includes(n.type))r=0.58;
    if(n.type==='need-category')r=0.55;
    if(n.type==='need')r=0.22;
    if(n.type==='live-requirement')r=0.3;
    geom=new THREE.SphereGeometry(r,12,9);
    mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:n.type==='need'?0.72:0.94});
    mesh=new THREE.Mesh(geom,mat);
  }
  mesh.position.copy(n._pos);mesh.userData={nodeId:n.id,baseOpacity:mat.opacity||1};
  nodeGroup.add(mesh);meshById.set(n.id,mesh);

  if(n.type!=='need'){
    const lab=labelSprite(n.label,color,n.type==='funnel'?1.05:n.type==='need-category'?0.72:0.78);
    lab.position.copy(n._pos).add(new THREE.Vector3(0,n.type==='funnel'?3.4:1.3,0));
    lab.userData={nodeId:n.id,baseOpacity:1};
    labelGroup.add(lab);labelById.set(n.id,lab);
  }
}
graph.nodes.forEach(makeNode);

function makeEdge(e){
  const a=nodeById.get(e.from),b=nodeById.get(e.to);if(!a||!b)return;
  const color=EDGE_COLORS[e.type]||0x6d8ba2;
  let pts=[a._pos,b._pos];
  if(e.type==='feedback'){
    const mid=a._pos.clone().lerp(b._pos,0.5);mid.z-=10;pts=[a._pos,mid,b._pos];
  }else if(e.type==='branch'){
    const mid=a._pos.clone().lerp(b._pos,0.5);mid.z+=5;pts=[a._pos,mid,b._pos];
  }
  const geom=new THREE.BufferGeometry().setFromPoints(pts);
  const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:e.type==='contains'?0.26:0.56});
  const line=new THREE.Line(geom,mat);
  line.userData={edge:e,baseOpacity:mat.opacity};
  edgeGroup.add(line);edgeObjects.push(line);
}
graph.edges.forEach(makeEdge);

// Ring around the 130-needs field.
const needRing=new THREE.Mesh(
  new THREE.TorusGeometry(31.5,0.08,6,128),
  new THREE.MeshBasicMaterial({color:0x4d7894,transparent:true,opacity:0.45})
);
needRing.rotation.x=Math.PI/2;needRing.position.y=(LAYER_Y[4]+LAYER_Y[5])/2;scene.add(needRing);

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let selected=null,needsVisible=true;

function connectedSet(id){
  const keep=new Set([id]),queue=[id];
  while(queue.length){
    const cur=queue.shift();
    graph.edges.forEach(e=>{
      if(e.type==='feedback')return;
      let next=null;
      if(e.from===cur)next=e.to; else if(e.to===cur)next=e.from;
      if(next&&!keep.has(next)){keep.add(next);queue.push(next);}
    });
  }
  graph.edges.forEach(e=>{
    if(e.type==='feedback'&&(e.from===id||e.to===id)){keep.add(e.from);keep.add(e.to);}
  });
  return keep;
}
function renderSelection(id){
  selected=id||null;
  const keep=id?connectedSet(id):null;
  meshById.forEach((m,k)=>{
    const visible=needsVisible||!['need','need-category'].includes(nodeById.get(k)?.type);
    m.visible=visible;
    const on=!keep||keep.has(k);
    m.material.opacity=visible?(on?m.userData.baseOpacity:0.08):0;
  });
  labelById.forEach((s,k)=>{
    const visible=needsVisible||nodeById.get(k)?.type!=='need-category';
    s.visible=visible;s.material.opacity=!keep||keep.has(k)?1:0.1;
  });
  edgeObjects.forEach(l=>{
    const e=l.userData.edge;
    const needEdge=['need','need-category'].includes(nodeById.get(e.from)?.type)||['need','need-category'].includes(nodeById.get(e.to)?.type);
    l.visible=needsVisible||!needEdge;
    const on=!keep||(keep.has(e.from)&&keep.has(e.to));
    l.material.opacity=l.visible?(on?Math.min(1,l.userData.baseOpacity*1.55):0.025):0;
  });
  needRing.visible=needsVisible;
  updateSide(id);
}
function updateSide(id){
  const n=id&&nodeById.get(id);
  const summary=document.getElementById('summary'),detail=document.getElementById('detail');
  if(!n){
    document.querySelector('#side h2').textContent='Whole Funnel graph';
    summary.textContent='Select any point or funnel to trace its exact incoming and outgoing relationships.';
    detail.textContent='Page 0 enters once. Specialist funnels analyze different objectives in isolation. Ballots converge, uncertainty branches into interviews, Page 0 is replayed, receipts authorize Harness execution, and verified outcomes feed the learning loop.';
    return;
  }
  const incoming=graph.edges.filter(e=>e.to===id),outgoing=graph.edges.filter(e=>e.from===id);
  document.querySelector('#side h2').textContent=n.label;
  summary.textContent=[n.type,n.funnel,n.category,n.objective].filter(Boolean).join(' · ');
  detail.textContent=n.detail||'';
  const old=[...document.querySelectorAll('#side .dynamic')];old.forEach(x=>x.remove());
  const side=document.getElementById('side');
  [['Incoming',incoming],['Outgoing',outgoing]].forEach(([title,arr])=>{
    const d=document.createElement('div');d.className='kv dynamic';
    d.innerHTML='<span>'+title+'</span><b>'+arr.length+'</b>';side.appendChild(d);
    arr.slice(0,12).forEach(e=>{
      const x=document.createElement('div');x.className='meta dynamic';
      const other=e.from===id?nodeById.get(e.to):nodeById.get(e.from);
      x.textContent=(e.from===id?'→ ':'← ')+(other?other.label:(e.from===id?e.to:e.from))+(e.label?' · '+e.label:'');
      side.appendChild(x);
    });
  });
}

function pointerToNDC(ev){
  const r=renderer.domElement.getBoundingClientRect();
  pointer.x=((ev.clientX-r.left)/r.width)*2-1;
  pointer.y=-((ev.clientY-r.top)/r.height)*2+1;
}
renderer.domElement.addEventListener('click',ev=>{
  if(drag.moved)return;
  pointerToNDC(ev);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects([...meshById.values()].filter(x=>x.visible),false);
  if(hits.length)renderSelection(hits[0].object.userData.nodeId);
});

const drag={active:false,x:0,y:0,moved:false,id:null};
renderer.domElement.addEventListener('pointerdown',e=>{
  drag.active=true;drag.x=e.clientX;drag.y=e.clientY;drag.moved=false;drag.id=e.pointerId;
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
  if(!drag.active||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
  if(Math.abs(dx)+Math.abs(dy)>3)drag.moved=true;
  controls.tTheta-=dx*0.005;
  controls.tPhi=Math.max(0.18,Math.min(1.48,controls.tPhi-dy*0.004));
});
function endDrag(e){if(e.pointerId===drag.id){drag.active=false;drag.id=null;setTimeout(()=>drag.moved=false,0);}}
renderer.domElement.addEventListener('pointerup',endDrag);renderer.domElement.addEventListener('pointercancel',endDrag);
renderer.domElement.addEventListener('wheel',e=>{
  e.preventDefault();controls.tRadius=Math.max(48,Math.min(220,controls.tRadius*(e.deltaY>0?1.09:0.92)));
},{passive:false});

function setCamera(kind){
  camera=kind==='persp'?perspective:ortho;
  document.getElementById('ortho').classList.toggle('on',camera===ortho);
  document.getElementById('persp').classList.toggle('on',camera===perspective);
  applyCamera();
}
document.getElementById('ortho').addEventListener('click',()=>setCamera('ortho'));
document.getElementById('persp').addEventListener('click',()=>setCamera('persp'));
document.getElementById('reset').addEventListener('click',()=>{
  controls.tTheta=0.48;controls.tPhi=1.16;controls.tRadius=126;target.set(0,-1,0);renderSelection(null);
});
document.getElementById('top').addEventListener('click',()=>{
  controls.tTheta=0;controls.tPhi=Math.PI/2;controls.tRadius=126;target.set(0,-1,0);setCamera('ortho');
});
document.getElementById('needs').addEventListener('click',e=>{
  needsVisible=!needsVisible;e.currentTarget.classList.toggle('on',needsVisible);renderSelection(selected);
});
document.getElementById('clear').addEventListener('click',()=>renderSelection(null));

const search=document.getElementById('search');
search.addEventListener('input',()=>{
  const q=search.value.trim().toLowerCase();if(q.length<2)return;
  const hit=graph.nodes.find(n=>n.label.toLowerCase()===q)||graph.nodes.find(n=>n.label.toLowerCase().includes(q)||n.id.toLowerCase().includes(q));
  if(hit)renderSelection(hit.id);
});
search.addEventListener('keydown',e=>{if(e.key==='Escape'){search.value='';renderSelection(null);search.blur();}});

document.getElementById('nodeCount').textContent=graph.nodes.length;
document.getElementById('edgeCount').textContent=graph.edges.length;
document.getElementById('needCount').textContent=graph.nodes.filter(n=>n.type==='need').length;
document.getElementById('live').textContent=liveSession&&liveSession.page0?(liveSession.stage||'page0'):'none';

function resize(){
  const w=root.clientWidth,h=Math.max(1,root.clientHeight);
  renderer.setSize(w,h,false);perspective.aspect=w/h;perspective.updateProjectionMatrix();applyCamera();
}
addEventListener('resize',resize);resize();

function animate(){
  requestAnimationFrame(animate);applyCamera();
  if(selected&&meshById.has(selected)){
    const m=meshById.get(selected);
    const s=1+Math.sin(performance.now()*0.004)*0.12;m.scale.setScalar(s);
  }
  renderer.render(scene,camera);
}
renderSelection(null);animate();
