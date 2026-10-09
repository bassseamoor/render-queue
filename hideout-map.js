/* ============================================================================
   hideout-map.js — MAP FIELD
   A 3D semantic space floating behind the monitor wall: 8 dimension regions,
   value nodes with live composer-state manifestation, conflict markers,
   tap-to-select, and a fly-above vantage.

   IIFE. No globals except window.__mapfield. No network. No model calls.
   Plain-language labels only. Attaches to the room via window.__scene /
   window.__camera / window.__renderer (waits for window.__ready).
   ============================================================================ */
(function(){
'use strict';

/* ---------- semantic vocabulary: exact ids from semantics.json ---------- */
var DIMENSIONS=[
 {id:'behavior',label:'Behavior',plain:'What kind of machine it is',values:[
  {id:'RESPONDER',desc:'Input -> current state -> response rule -> output'},
  {id:'DETECTOR',desc:'Observation -> classification -> evidence-bearing result'},
  {id:'TRANSFORMER',desc:'Input state -> governed transformation -> output state'},
  {id:'CONTROLLER',desc:'Current state -> permitted action selection -> bounded action request'},
  {id:'PLANNER',desc:'Goal + available capabilities -> candidate plan'},
  {id:'SPECIALIST',desc:'Domain input -> specialist interpretation -> domain output'},
  {id:'FUNNEL',desc:'Intent -> obligations -> capability composition -> execution'},
  {id:'COMPOSITE',desc:'Governed composition of two or more machine classes'},
  {id:'GENERATOR',desc:'Declared request + constraints -> bounded generation -> admission-gated artifact'}]},
 {id:'state',label:'State',plain:'How its state is bound and moved',values:[
  {id:'GENERATED',desc:'Artifact produced, not yet reviewed'},
  {id:'REVIEWED',desc:'Artifact reviewed, not yet approved'},
  {id:'APPROVED',desc:'Approved with bound provenance, not yet published'},
  {id:'PUBLISHED',desc:'Published; historical versions verifiable'},
  {id:'STATE_BOUND_AUTHORITY',desc:'Authority material separated per state (DRAFT != APPROVED != PUBLISHED)'},
  {id:'EXPLICIT_TRANSITIONS',desc:'Every state change is a declared, logged transition'}]},
 {id:'input',label:'Input',plain:'What it accepts',values:[
  {id:'DECLARED_VARIABLES_ONLY',desc:'Only declared fields accepted; anything else refused'},
  {id:'PRODUCT_CLASS',desc:'One declared product class per machine'},
  {id:'BOUNDED_RANGES',desc:'Lengths, counts, and options bounded in the contract'}]},
 {id:'output',label:'Output',plain:'What it produces',values:[
  {id:'SINGLE_FILE_ARTIFACT',desc:'One self-contained artifact, inline assets only'},
  {id:'VERIFIED',desc:'Artifact passes verification checks before anything else'},
  {id:'ADMITTED',desc:'Admission gate: PASS admits, FAIL/BLOCKED refuse'}]},
 {id:'intelligence',label:'Intelligence',plain:'Whether it thinks',values:[
  {id:'NONE_DETERMINISTIC',desc:'No intelligence; deterministic procedures only'},
  {id:'OPTIONAL_ATTACHABLE',desc:'Intelligence attachable/detachable without redefining law'},
  {id:'NEVER_LAW',desc:'Intelligence is never law, authority, capability, verification, or history'}]},
 {id:'autonomy',label:'Autonomy',plain:'Who decides',values:[
  {id:'OWNER_DECIDES',desc:'The owner decides; holds all responsibility'},
  {id:'MODELS_PROPOSE',desc:'Models propose; Moor governs, validates, executes'},
  {id:'NO_AUTO_COLLAPSE',desc:'Never auto-collapse options to best — owner picks'}]},
 {id:'evidence',label:'Evidence',plain:'How it is proven',values:[
  {id:'VERIFICATION_CHECKS',desc:'Named checks, each passed or failed'},
  {id:'PROVENANCE',desc:'Run id, seed, transition log, artifact hash'},
  {id:'SEALED_RECEIPT',desc:'Funnel receipt for the sealed run'},
  {id:'SHA256_DIGEST',desc:'Content digests, byte-verifiable'}]},
 {id:'security',label:'Security',plain:'How deep enforcement goes',values:[
  {id:'L0_DESCRIPTIVE',desc:'Documented constraint (audit basis)'},
  {id:'L1_VALIDATION',desc:'Runtime check; violations refused'},
  {id:'L2_STATE_MACHINE',desc:'No violating transition exists'},
  {id:'L3_CAPABILITY',desc:'No capability to violate exists'},
  {id:'L4_PROCESS_ISOLATION',desc:'Separate process, no shared memory'},
  {id:'L5_NETWORK_ISOLATION',desc:'No network route'},
  {id:'L6_CRYPTOGRAPHIC',desc:'Inaccessible without key material'},
  {id:'L7_INFRASTRUCTURE',desc:'Deployment-side infrastructure'}]}
];
var STATES=['REQUIRED','ALLOWED','FORBIDDEN','UNSPECIFIED'];

/* ---------- placement ----------
   Floating glass slab behind the monitor wall (monitors sweep z 34..52,
   heads y 9..15.5). Slab at y=26, x -28..28, z -5..21: clear of every arm
   preset, visible above the monitor wall from the chair. */
var FIELD={cx:0,cz:8,y:30,w:56,d:26};
var VANTAGE_DEF={name:'mapfield',pos:[0,72,8],yaw:0,pitch:-1.45};

var THREE=null,scene=null,camera=null,dom=null;
var group=null;                 // field group added to scene
var nodeIndex={};               // 'dimId|valueId' -> node record
var hitMeshes=[];               // raycast targets
var regionMats={};              // dimId -> region plate material
var beacons={};                 // dimId -> {mesh, mat} vertical state beacon
var conflicts=[];               // [{dimension,valueId,reason}]
var pulseOn=false,pulseT=0;
var lastState=null;
var built=false;

/* preallocated scratch (no per-frame allocation) */
var _ray=null,_ndc=null,_v3=null;

/* shared materials — assigned, never cloned per node */
var MAT={};

function localToast(msg){
  var t=document.getElementById('toast'); if(!t) return;
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove('show');},2400);
}

function makeLabelCanvas(w,h,draw){
  var c=document.createElement('canvas'); c.width=w; c.height=h;
  var g=c.getContext('2d'); draw(g,w,h);
  var t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;
  return t;
}
var FONT='-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif';

function dimLabelTexture(dim){
  return makeLabelCanvas(512,128,function(g,w,h){
    g.fillStyle='rgba(6,10,14,0.72)'; g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(120,220,255,0.35)'; g.lineWidth=3; g.strokeRect(4,4,w-8,h-8);
    g.fillStyle='#d8f4ff'; g.font='700 46px '+FONT; g.textAlign='center';
    g.fillText(dim.label,w/2,58);
    g.fillStyle='rgba(160,200,220,0.85)'; g.font='400 27px '+FONT;
    g.fillText(dim.plain,w/2,100);
  });
}
function valLabelTexture(text){
  return makeLabelCanvas(256,64,function(g,w,h){
    g.fillStyle='rgba(6,10,14,0.6)'; g.fillRect(0,0,w,h);
    g.fillStyle='rgba(200,230,245,0.92)'; g.font='600 30px '+FONT; g.textAlign='center';
    g.fillText(text,w/2,42);
  });
}
function humanize(id){ return id.replace(/_/g,' '); }

function flatPlane(w,h,tex){
  var m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false,depthWrite:false}));
  m.rotation.x=-Math.PI/2;
  return m;
}

function buildField(){
  THREE=window.THREE; scene=window.__scene; camera=window.__camera;
  dom=window.__renderer?window.__renderer.domElement:null;
  _ray=new THREE.Raycaster(); _ndc=new THREE.Vector2(); _v3=new THREE.Vector3();

  MAT.required =new THREE.MeshStandardMaterial({color:0x0b2b26,emissive:0x2dffb8,emissiveIntensity:1.5,roughness:0.35,metalness:0.15});
  MAT.allowed  =new THREE.MeshStandardMaterial({color:0x0d1e24,emissive:0x1e8fa0,emissiveIntensity:0.5,roughness:0.5,metalness:0.1});
  MAT.forbidden=new THREE.MeshStandardMaterial({color:0x150a0d,emissive:0x000000,roughness:0.95,metalness:0});
  MAT.ghost    =new THREE.MeshStandardMaterial({color:0x39424c,transparent:true,opacity:0.3,emissive:0x1c2733,emissiveIntensity:0.25,roughness:0.8,metalness:0});
  MAT.marker   =new THREE.MeshStandardMaterial({color:0x0b2b26,emissive:0x54ffd2,emissiveIntensity:2.2,roughness:0.3,metalness:0.2});
  MAT.conflict =new THREE.MeshBasicMaterial({color:0xff5a2a,transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false});
  MAT.hatch    =new THREE.LineBasicMaterial({color:0xff3b30,transparent:true,opacity:0.95});
  MAT.slab     =new THREE.MeshStandardMaterial({color:0x0a0f15,transparent:true,opacity:0.6,roughness:0.18,metalness:0.65});
  MAT.slabEdge =new THREE.LineBasicMaterial({color:0x2b6f86,transparent:true,opacity:0.6});

  group=new THREE.Group();
  group.name='mapfield';
  scene.add(group);

  /* slab */
  var slab=new THREE.Mesh(new THREE.BoxGeometry(FIELD.w,0.5,FIELD.d),MAT.slab);
  slab.position.set(FIELD.cx,FIELD.y-0.35,FIELD.cz);
  group.add(slab);
  var slabEdge=new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(FIELD.w,0.5,FIELD.d)),MAT.slabEdge);
  slabEdge.position.copy(slab.position);
  group.add(slabEdge);

  var cols=4,rows=2,cellW=FIELD.w/cols,cellD=FIELD.d/rows;
  var nodeGeo=new THREE.BoxGeometry(1.5,0.9,1.5);
  var markerGeo=new THREE.OctahedronGeometry(0.55);
  var ringGeo=new THREE.RingGeometry(1.35,1.75,28);
  var hatchGeo=new THREE.EdgesGeometry(new THREE.BoxGeometry(1.95,1.35,1.95));
  var beaconGeo=new THREE.CylinderGeometry(0.3,0.3,1,10);
  var regionGeo=new THREE.PlaneGeometry(cellW-1.2,cellD-1.2);
  var regionEdgeGeo=new THREE.EdgesGeometry(new THREE.PlaneGeometry(cellW-1.2,cellD-1.2));

  DIMENSIONS.forEach(function(dim,di){
    var c=di%cols,r=(di/cols)|0;
    var cxp=FIELD.cx-FIELD.w/2+cellW*(c+0.5);
    var czp=FIELD.cz-FIELD.d/2+cellD*(r+0.5);

    /* region plate */
    var rmat=new THREE.MeshStandardMaterial({color:0x0a0f14,transparent:true,opacity:0.85,
      emissive:0x223344,emissiveIntensity:0.12,roughness:0.35,metalness:0.55});
    regionMats[dim.id]=rmat;
    var plate=new THREE.Mesh(regionGeo,rmat);
    plate.rotation.x=-Math.PI/2;
    plate.position.set(cxp,FIELD.y+0.02,czp);
    group.add(plate);
    var redge=new THREE.LineSegments(regionEdgeGeo,
      new THREE.LineBasicMaterial({color:0x2b6f86,transparent:true,opacity:0.4}));
    redge.rotation.x=-Math.PI/2;
    redge.position.set(cxp,FIELD.y+0.03,czp);
    group.add(redge);

    /* dimension label (flat, readable from above) */
    var dl=flatPlane(10,2.5,dimLabelTexture(dim));
    dl.position.set(cxp,FIELD.y+0.06,czp-cellD/2+2.1);
    group.add(dl);

    /* vertical state beacon on the region's near (chair-side) edge:
       reads as a glowing skyline from the chair, a dot from above */
    var bmat=new THREE.MeshStandardMaterial({color:0x0a0f14,emissive:0x223344,
      emissiveIntensity:0.3,roughness:0.4,metalness:0.2});
    var beacon=new THREE.Mesh(beaconGeo,bmat);
    beacon.scale.y=1.2;
    beacon.position.set(cxp-cellW/2+1.4,FIELD.y+0.1+0.6,czp+cellD/2-1.4);
    group.add(beacon);
    beacons[dim.id]={mesh:beacon,mat:bmat};

    /* value nodes */
    var n=dim.values.length;
    var ncol=n<=3?n:(n===4?2:3);
    var nrow=Math.ceil(n/ncol);
    var sx=3.6,sz=2.9;
    var z0=czp-cellD/2+4.6; /* below the label */
    dim.values.forEach(function(v,vi){
      var gc=vi%ncol,gr=(vi/ncol)|0;
      var nx=cxp+(gc-(ncol-1)/2)*sx;
      var nz=z0+gr*sz;
      var mesh=new THREE.Mesh(nodeGeo,MAT.ghost);
      mesh.position.set(nx,FIELD.y+0.55,nz);
      mesh.userData={dimId:dim.id,valId:v.id,label:dim.label+' · '+humanize(v.id),desc:v.desc,nodeState:'UNSPECIFIED'};
      group.add(mesh); hitMeshes.push(mesh);

      var vl=flatPlane(3.3,0.82,valLabelTexture(humanize(v.id)));
      vl.position.set(nx,FIELD.y+0.05,nz+1.32);
      group.add(vl);

      var marker=new THREE.Mesh(markerGeo,MAT.marker);
      marker.position.set(nx,FIELD.y+1.7,nz);
      marker.visible=false;
      group.add(marker);

      var hatch=new THREE.LineSegments(hatchGeo,MAT.hatch);
      hatch.position.set(nx,FIELD.y+0.55,nz);
      hatch.visible=false;
      group.add(hatch);

      var ring=new THREE.Mesh(ringGeo,MAT.conflict);
      ring.rotation.x=-Math.PI/2;
      ring.position.set(nx,FIELD.y+0.65,nz);
      ring.visible=false;
      group.add(ring);

      nodeIndex[dim.id+'|'+v.id]={mesh:mesh,marker:marker,hatch:hatch,ring:ring,dim:dim,val:v};
    });
  });

  wireTaps();
  built=true;
  api.object3D=group;
  registerDevroom();
  /* __devroom may arrive after us; one deferred re-registration, no polling */
  setTimeout(registerDevroom,5000);
}

/* ---------- composer-state manifestation ---------- */
function paintRegion(dim,counts){
  var m=regionMats[dim.id]; if(!m) return;
  var b=beacons[dim.id];
  var hex,inten,bh;
  if(counts.REQUIRED>0){ hex=0x2dffb8; inten=0.75; bh=1.4; }
  else if(counts.ALLOWED>0){ hex=0x1e8fa0; inten=0.4; bh=1.0; }
  else if(counts.FORBIDDEN>0){ hex=0xff3b30; inten=0.18; bh=0.8; }
  else { hex=0x223344; inten=0.12; bh=0.3; }
  m.emissive.setHex(hex); m.emissiveIntensity=inten;
  if(b){
    b.mat.emissive.setHex(hex); b.mat.emissiveIntensity=bh;
    var h=Math.min(9,1.2+2.0*counts.REQUIRED+0.8*counts.ALLOWED);
    b.mesh.scale.y=h;
    b.mesh.position.y=FIELD.y+0.1+h/2;
  }
}

function manifest(state){
  if(!built) return false;
  state=state||{};
  var dims=state.dimensions||{};
  DIMENSIONS.forEach(function(dim){
    var per=dims[dim.id]||{};
    var counts={REQUIRED:0,ALLOWED:0,FORBIDDEN:0,UNSPECIFIED:0};
    dim.values.forEach(function(v){
      var st=per[v.id];
      if(st!=='REQUIRED'&&st!=='ALLOWED'&&st!=='FORBIDDEN'&&st!=='UNSPECIFIED') st='UNSPECIFIED';
      counts[st]++;
      var rec=nodeIndex[dim.id+'|'+v.id]; if(!rec) return;
      rec.mesh.material = st==='REQUIRED'?MAT.required
        : st==='ALLOWED'?MAT.allowed
        : st==='FORBIDDEN'?MAT.forbidden : MAT.ghost;
      rec.mesh.userData.nodeState=st;
      rec.marker.visible=(st==='REQUIRED');
      rec.hatch.visible=(st==='FORBIDDEN');
    });
    paintRegion(dim,counts);
  });
  lastState=state;
  return true;
}

/* ---------- conflicts: markers only, never auto-resolve ---------- */
function showConflicts(list){
  if(!built) return false;
  Object.keys(nodeIndex).forEach(function(k){ nodeIndex[k].ring.visible=false; });
  conflicts=[];
  (list||[]).forEach(function(c){
    if(!c) return;
    var rec=nodeIndex[c.dimension+'|'+c.valueId];
    if(!rec) return;
    rec.ring.visible=true;
    conflicts.push({dimension:c.dimension,valueId:c.valueId,reason:String(c.reason||'')});
  });
  if(conflicts.length&&!pulseOn){ pulseOn=true; requestAnimationFrame(pulseLoop); }
  return true;
}
function conflictInfo(){
  return conflicts.map(function(c){ return {dimension:c.dimension,valueId:c.valueId,reason:c.reason}; });
}
function pulseLoop(){
  if(!conflicts.length){ pulseOn=false; return; }
  requestAnimationFrame(pulseLoop);
  try{ if(window.__stillMode&&window.__stillMode()) return; }catch(e){}
  pulseT+=0.09;
  MAT.conflict.opacity=0.55+0.4*Math.sin(pulseT);
}

/* ---------- map-as-input: tap a node ---------- */
var _downX,_downY,_downT;
function wireTaps(){
  if(!dom) return;
  dom.addEventListener('pointerdown',function(e){
    _downX=e.clientX; _downY=e.clientY; _downT=(window.performance&&performance.now())||0;
  });
  dom.addEventListener('pointerup',function(e){
    if(_downX===undefined) return;
    var dx=e.clientX-_downX,dy=e.clientY-_downY;
    var dt=((window.performance&&performance.now())||0)-_downT;
    var isTap=Math.sqrt(dx*dx+dy*dy)<10&&dt<600;
    _downX=undefined;
    if(!isTap) return;
    handleTap(e.clientX,e.clientY);
  });
}
function handleTap(cx,cy){
  if(!built||!_ray) return;
  var w=dom.clientWidth||window.innerWidth,h=dom.clientHeight||window.innerHeight;
  _ndc.set((cx/w)*2-1,-(cy/h)*2+1);
  _ray.setFromCamera(_ndc,camera);
  var hits=_ray.intersectObjects(hitMeshes,false);
  if(!hits.length) return;
  var u=hits[0].object.userData;
  var comp=window.__composer;
  if(comp&&typeof comp.mapSelect==='function'){
    try{ comp.mapSelect(u.dimId,u.valId); }catch(e){ localToast(u.label); }
  }else{
    localToast(u.label+' — '+u.desc);
  }
}

/* ---------- fly-above vantage ---------- */
function goMapVantage(){
  var v=VANTAGE_DEF;
  if(window.__player&&typeof window.__applyCam==='function'){
    window.__player.x=v.pos[0]; window.__player.y=v.pos[1]; window.__player.z=v.pos[2];
    window.__player.yaw=v.yaw; window.__player.pitch=v.pitch;
    window.__applyCam();
  }else if(camera){
    camera.position.set(v.pos[0],v.pos[1],v.pos[2]);
    camera.rotation.order='YXZ';
    camera.rotation.set(v.pitch,v.yaw,0);
  }
  localToast('Map field — looking down into the semantic space');
}

function fieldBounds(){
  return {minX:FIELD.cx-FIELD.w/2,maxX:FIELD.cx+FIELD.w/2,
          minY:FIELD.y-0.6,maxY:FIELD.y+9.5,
          minZ:FIELD.cz-FIELD.d/2,maxZ:FIELD.cz+FIELD.d/2};
}

/* ---------- demo state for testing ---------- */
var DEMO_STATE={dimensions:{
  behavior:{FUNNEL:'REQUIRED',GENERATOR:'ALLOWED',CONTROLLER:'FORBIDDEN'},
  state:{APPROVED:'REQUIRED',EXPLICIT_TRANSITIONS:'REQUIRED'},
  input:{DECLARED_VARIABLES_ONLY:'REQUIRED'},
  output:{ADMITTED:'REQUIRED',VERIFIED:'ALLOWED'},
  intelligence:{NEVER_LAW:'REQUIRED',NONE_DETERMINISTIC:'ALLOWED'},
  autonomy:{OWNER_DECIDES:'REQUIRED',NO_AUTO_COLLAPSE:'ALLOWED'},
  evidence:{SEALED_RECEIPT:'REQUIRED',PROVENANCE:'ALLOWED'},
  security:{L2_STATE_MACHINE:'REQUIRED',L1_VALIDATION:'ALLOWED',L4_PROCESS_ISOLATION:'FORBIDDEN'}
}};
function demo(state){ return manifest(state||DEMO_STATE); }

/* ---------- public surface ---------- */
var api={
  ready:function(){ return built; },
  manifest:manifest,
  showConflicts:showConflicts,
  conflictInfo:conflictInfo,
  demo:demo,
  goMapVantage:goMapVantage,
  vantageDef:function(){ return {name:VANTAGE_DEF.name,pos:VANTAGE_DEF.pos.slice(),
    yaw:VANTAGE_DEF.yaw,pitch:VANTAGE_DEF.pitch}; },
  fieldBounds:fieldBounds,
  nodeCount:function(){ return Object.keys(nodeIndex).length; },
  nodeState:function(dimId,valId){
    var rec=nodeIndex[dimId+'|'+valId];
    return rec?rec.mesh.userData.nodeState:null;
  },
  dimensions:function(){ return DIMENSIONS.map(function(d){ return d.id; }); },
  object3D:null /* set to the field Group once built (coordinator contract) */
};
window.__mapfield=api;
function registerDevroom(){
  try{ if(window.__devroom) window.__devroom.mapfield=api; }catch(e){}
}

/* ---------- attach when the room is up ---------- */
var _tries=0;
var _timer=setInterval(function(){
  _tries++;
  if(window.__ready&&window.__scene&&window.__camera&&window.__renderer&&window.THREE){
    clearInterval(_timer);
    try{ buildField(); }catch(e){ /* never break the room */ }
  }else if(_tries>120){
    clearInterval(_timer); /* room never appeared; stay inert */
  }
},250);

})();
