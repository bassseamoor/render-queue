/* Road Atlas 3D motion 1.0.0 — the living-city layer for the 3D twin.
 *
 * Purely additive: imported only by road-atlas-3d.js, never touches the 2D
 * pipeline, the baseline, or any guarded module. Cars drive the road graph,
 * boats cruise the river, trains run the transit lines, clouds drift
 * overhead, building windows glow after dark, and the whole city breathes
 * through a full day/night cycle.
 *
 * Everything is a pure function of (world seed, time), so the same city
 * always wakes up the same way. All movers are InstancedMesh — a handful of
 * draw calls, cheap enough for a phone GPU.
 */
import * as THREE from 'three';

var VERSION = '1.0.0';

/* ---------- deterministic RNG ---------- */
function xmur3(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return (h^=h>>>16)>>>0;};}
function sfc32(a,b,c,d){return function(){a>>>=0;b>>>=0;c>>>=0;d>>>=0;var t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+c<<3;c=c<<21|c>>>11;c=c+t|0;return (t>>>0)/4294967296;};}
function rngFromSeed(s){var f=xmur3(String(s));return sfc32(f(),f(),f(),f());}
function shuffle(arr,rng){for(var i=arr.length-1;i>0;i--){var j=Math.floor(rng()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}return arr;}

/* ---------- path helpers (same smoothing family as the 3D ribbons) ---------- */
function smoothPath(pts){
  var P=pts.map(function(p){return {x:p.x,y:p.y};});
  if(P.length<3)return P;
  var mid=function(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2};};
  var out=[P[0]],start=P[0];
  for(var i=1;i<P.length-1;i++){
    var m=mid(P[i],P[i+1]),c=P[i];
    var ts=[0.25,0.5,0.75];
    for(var k=0;k<ts.length;k++){
      var t=ts[k],u=1-t;
      out.push({x:u*u*start.x+2*u*t*c.x+t*t*m.x, y:u*u*start.y+2*u*t*c.y+t*t*m.y});
    }
    out.push({x:m.x,y:m.y});start=m;
  }
  out.push(P[P.length-1]);
  return out;
}
function prepPath(pts){
  var cum=[0],total=0;
  for(var i=1;i<pts.length;i++){
    var dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y;
    total+=Math.sqrt(dx*dx+dy*dy);cum.push(total);
  }
  return {cum:cum,total:total};
}
function pointAt(pts,prep,s){
  var d=s*prep.total,cum=prep.cum,lo=0,hi=cum.length-1;
  while(lo<hi){var mid=(lo+hi)>>1;if(cum[mid]<d)lo=mid+1;else hi=mid;}
  var i=Math.max(1,lo),c0=cum[i-1],c1=cum[i];
  var f=c1>c0?(d-c0)/(c1-c0):0;
  var ax=pts[i-1].x,ay=pts[i-1].y;
  return {x:ax+(pts[i].x-ax)*f, y:ay+(pts[i].y-ay)*f,
          ang:Math.atan2(pts[i].y-ay,pts[i].x-ax)};
}

/* ---------- day/night stops: [t, r,g,b, tintAlpha, nightLevel] ---------- */
var TODS=[
  [0.00,255,179,107,0.10,0.55],[0.07,255,255,255,0.00,0.00],
  [0.32,255,255,255,0.00,0.00],[0.44,255,154,77,0.13,0.04],
  [0.52,255,122,61,0.20,0.35],[0.60,26,35,80,0.40,1.00],
  [0.86,26,35,80,0.40,1.00],[0.93,255,179,107,0.12,0.55],
  [1.00,255,179,107,0.10,0.55]
];
function todSample(t){
  var a=TODS[0],b=TODS[TODS.length-1];
  for(var i=0;i<TODS.length-1;i++){if(t>=TODS[i][0]&&t<=TODS[i+1][0]){a=TODS[i];b=TODS[i+1];break;}}
  var f=(b[0]>a[0])?(t-a[0])/(b[0]-a[0]):0;
  return {r:Math.round(a[1]+(b[1]-a[1])*f),g:Math.round(a[2]+(b[2]-a[2])*f),
          b:Math.round(a[3]+(b[3]-a[3])*f),a:a[4]+(b[4]-a[4])*f,
          light:a[5]+(b[5]-a[5])*f};
}

/* merge small boxes with baked vertex colors into one geometry */
function mergeBoxes(parts){
  var pos=[],col=[],idx=[],base=0;
  parts.forEach(function(pb){
    var g=new THREE.BoxGeometry(pb.w,pb.h,pb.d);
    g.translate(pb.x,pb.y,pb.z);
    var p=g.getAttribute('position'),ix=g.getIndex();
    for(var i=0;i<p.count;i++){pos.push(p.getX(i),p.getY(i),p.getZ(i));col.push(pb.c[0],pb.c[1],pb.c[2]);}
    for(var j=0;j<ix.count;j++)idx.push(base+ix.getX(j));
    base+=p.count;g.dispose();
  });
  var out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  out.setIndex(idx);out.computeVertexNormals();
  return out;
}

function ribbonStrip(pts,hw,y,color,out){
  // minimal ribbon into a plain array-based batch {pos,col,idx}
  var n=pts.length;if(n<2)return;
  var nx=new Array(n),nz=new Array(n);
  for(var i=0;i<n;i++){
    var a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];
    var dx=b.x-a.x,dz=b.y-a.y,l=Math.hypot(dx,dz)||1;
    dx/=l;dz/=l;nx[i]=-dz;nz[i]=dx;
  }
  for(var k=0;k<n-1;k++){
    var p=pts[k],q=pts[k+1];
    var base=out.pos.length/3;
    out.pos.push(p.x+nx[k]*hw,y,p.y+nz[k]*hw, p.x-nx[k]*hw,y,p.y-nz[k]*hw,
                 q.x+nx[k+1]*hw,y,q.y+nz[k+1]*hw, q.x-nx[k+1]*hw,y,q.y-nz[k+1]*hw);
    for(var m=0;m<4;m++)out.col.push(color.r,color.g,color.b);
    out.idx.push(base,base+1,base+2, base,base+2,base+3);
  }
}

/* ------------------------------------------------------------------ */
export function startMotion(ctx){
  var scene=ctx.scene,W=ctx.W,pal=ctx.pal,sun=ctx.sun,hemi=ctx.hemi,
      renderer=ctx.renderer,bounds=ctx.bounds;
  var rng=rngFromSeed((W.seed||'x')+'|3d-motion-v1');
  var cx=(bounds.x0+bounds.x1)/2,cz=(bounds.y0+bounds.y1)/2;
  var group=new THREE.Group();scene.add(group);
  var updaters=[],disposables=[];
  var dyn={windowsMat:null,carLightMat:null,trainLightMat:null,cloudMat:null};
  var dummy=new THREE.Object3D();
  var tmpC=new THREE.Color(),tmpC2=new THREE.Color();

  /* ---------------- cars ---------------- */
  try{
    var roads=shuffle((W.roads||[]).filter(function(r){return r.pts&&r.pts.length>8;}),rng);
    var cars=[],budget=120;
    for(var i=0;i<roads.length&&budget>0;i++){
      var r=roads[i],sp=smoothPath(r.pts),prep=prepPath(sp);
      if(prep.total<60)continue;
      var per=r.cls===2?3:(r.cls===1?2:1);
      for(var k=0;k<per&&budget>0;k++,budget--)
        cars.push({pts:sp,prep:prep,off:rng(),dir:rng()<0.5?1:-1,
          speed:(r.cls===2?150:(r.cls===1?95:60))*(0.8+rng()*0.4),phase:rng()*6.28});
    }
    if(cars.length){
      var bodyG=new THREE.BoxGeometry(4.4,1.3,2.2);bodyG.translate(0,0.65,0);
      var bodyM=new THREE.MeshStandardMaterial({roughness:0.55,metalness:0.35});
      var bodies=new THREE.InstancedMesh(bodyG,bodyM,cars.length);
      var paint=[0xd7dde3,0x9aa4ae,0x39434e,0x8c3b34,0x2f5a80,0xc9a13b,0xf2f2f2,0x20262e,0x4a7a5c];
      for(var ci=0;ci<cars.length;ci++){tmpC.set(paint[Math.floor(rng()*paint.length)]);bodies.setColorAt(ci,tmpC);}
      bodies.instanceColor.needsUpdate=true;
      var lightG=mergeBoxes([
        {w:0.35,h:0.5,d:1.9,x:2.21,y:0.75,z:0,c:[1,0.95,0.82]},
        {w:0.35,h:0.5,d:1.9,x:-2.21,y:0.75,z:0,c:[1,0.16,0.1]}]);
      var lightM=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
      var lights=new THREE.InstancedMesh(lightG,lightM,cars.length);
      bodies.castShadow=true;
      group.add(bodies);group.add(lights);
      dyn.carLightMat=lightM;
      updaters.push(function(t){
        for(var j=0;j<cars.length;j++){
          var car=cars[j];
          var s=((car.off+car.dir*t/1000*car.speed/car.prep.total)%1+1)%1;
          var p=pointAt(car.pts,car.prep,s);
          dummy.position.set(p.x,0.75+Math.sin(t*0.02+car.phase)*0.05,p.y);
          dummy.rotation.set(0,-(p.ang+(car.dir<0?Math.PI:0)),0);
          dummy.updateMatrix();
          bodies.setMatrixAt(j,dummy.matrix);
          lights.setMatrixAt(j,dummy.matrix);
        }
        bodies.instanceMatrix.needsUpdate=true;
        lights.instanceMatrix.needsUpdate=true;
      });
      disposables.push(function(){bodyG.dispose();lightG.dispose();bodyM.dispose();lightM.dispose();});
    }
  }catch(e){/* traffic is decorative */}

  /* ---------------- trains + rails ---------------- */
  try{
    var tls=(W.layers&&W.layers.transit)||[];
    var trains=[];
    tls.forEach(function(tl,ti){
      if(!tl.pts||tl.pts.length<4)return;
      var sp2=smoothPath(tl.pts),prep2=prepPath(sp2);
      if(prep2.total<200)return;
      trains.push({pts:sp2,prep:prep2,off:rng(),dir:ti%2?1:-1,speed:170,
                   color:new THREE.Color(tl.color||'#e5484d'),phase:rng()*6.28});
    });
    if(trains.length){
      // visible rails so the trains sit on something
      var railBatch={pos:[],col:[],idx:[]};
      trains.forEach(function(tr){
        tmpC.copy(tr.color).multiplyScalar(0.35);
        ribbonStrip(tr.pts,1.6,0.9,tmpC,railBatch);
      });
      var railG=new THREE.BufferGeometry();
      railG.setAttribute('position',new THREE.Float32BufferAttribute(railBatch.pos,3));
      railG.setAttribute('color',new THREE.Float32BufferAttribute(railBatch.col,3));
      railG.setIndex(railBatch.idx);railG.computeVertexNormals();
      var railM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.8,side:THREE.DoubleSide});
      var rails=new THREE.Mesh(railG,railM);rails.receiveShadow=true;group.add(rails);
      disposables.push(function(){railG.dispose();railM.dispose();});

      var tBodyG=mergeBoxes([
        {w:24,h:2.6,d:3.0,x:0,y:1.3,z:0,c:[1,1,1]},
        {w:24.4,h:0.7,d:3.2,x:0,y:2.85,z:0,c:[0.32,0.32,0.34]}]);
      var tBodyM=new THREE.MeshStandardMaterial({roughness:0.5,metalness:0.3});
      var tBodies=new THREE.InstancedMesh(tBodyG,tBodyM,trains.length);
      trains.forEach(function(tr,ti){tBodies.setColorAt(ti,tr.color);});
      tBodies.instanceColor.needsUpdate=true;
      var tLightG=mergeBoxes([
        {w:0.4,h:0.8,d:2.6,x:12.1,y:1.6,z:0,c:[1,0.95,0.82]},
        {w:0.4,h:0.8,d:2.6,x:-12.1,y:1.6,z:0,c:[1,0.16,0.1]}]);
      var tLightM=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
      var tLights=new THREE.InstancedMesh(tLightG,tLightM,trains.length);
      tBodies.castShadow=true;
      group.add(tBodies);group.add(tLights);
      dyn.trainLightMat=tLightM;
      updaters.push(function(t){
        for(var j=0;j<trains.length;j++){
          var tr=trains[j];
          var s=((tr.off+tr.dir*t/1000*tr.speed/tr.prep.total)%1+1)%1;
          var p=pointAt(tr.pts,tr.prep,s);
          dummy.position.set(p.x,1.0+Math.sin(t*0.015+tr.phase)*0.06,p.y);
          dummy.rotation.set(0,-(p.ang+(tr.dir<0?Math.PI:0)),0);
          dummy.updateMatrix();
          tBodies.setMatrixAt(j,dummy.matrix);
          tLights.setMatrixAt(j,dummy.matrix);
        }
        tBodies.instanceMatrix.needsUpdate=true;
        tLights.instanceMatrix.needsUpdate=true;
      });
      disposables.push(function(){tBodyG.dispose();tLightG.dispose();tBodyM.dispose();tLightM.dispose();});
    }
  }catch(e){/* trains are decorative */}

  /* ---------------- boats ---------------- */
  try{
    var river=(W.F&&W.F.river)||((W._carto&&W._carto.ribbon&&W._carto.ribbon.pts)||null);
    if(river&&river.length>20){
      var rsp=smoothPath(river),rprep=prepPath(rsp);
      var boats=[];
      for(var b=0;b<6;b++)boats.push({off:rng(),dir:b%2?1:-1,speed:26+rng()*20,phase:rng()*6.28});
      var hullG=new THREE.BoxGeometry(5.5,1.4,2.6);hullG.translate(0,0.7,0);
      var hullM=new THREE.MeshStandardMaterial({roughness:0.7});
      var hulls=new THREE.InstancedMesh(hullG,hullM,boats.length);
      var hullCols=[0xf2ede2,0xd8cdb8,0x7a6a55,0x4a6a8c,0xf2ede2,0x8c3b34];
      for(var bi=0;bi<boats.length;bi++){tmpC.set(hullCols[bi%hullCols.length]);hulls.setColorAt(bi,tmpC);}
      hulls.instanceColor.needsUpdate=true;
      var wakeG=new THREE.PlaneGeometry(3.4,13);wakeG.rotateX(-Math.PI/2);wakeG.translate(0,0,-8.5);
      var wakeM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.3,depthWrite:false});
      var wakes=new THREE.InstancedMesh(wakeG,wakeM,boats.length);
      hulls.castShadow=true;
      group.add(hulls);group.add(wakes);
      updaters.push(function(t){
        for(var j=0;j<boats.length;j++){
          var bt=boats[j];
          var s=((bt.off+bt.dir*t/1000*bt.speed/rprep.total)%1+1)%1;
          var p=pointAt(rsp,rprep,s);
          var yaw=-(p.ang+(bt.dir<0?Math.PI:0));
          dummy.position.set(p.x,0.55+Math.sin(t*0.002+bt.phase)*0.28,p.y);
          dummy.rotation.set(Math.sin(t*0.0016+bt.phase)*0.05,yaw,Math.sin(t*0.0013+bt.phase*2)*0.05);
          dummy.updateMatrix();
          hulls.setMatrixAt(j,dummy.matrix);
          wakes.setMatrixAt(j,dummy.matrix);
        }
        hulls.instanceMatrix.needsUpdate=true;
        wakes.instanceMatrix.needsUpdate=true;
      });
      disposables.push(function(){hullG.dispose();wakeG.dispose();hullM.dispose();wakeM.dispose();});
    }
  }catch(e){/* boats are decorative */}

  /* ---------------- clouds ---------------- */
  try{
    var cc2=document.createElement('canvas');cc2.width=256;cc2.height=160;
    var cx2=cc2.getContext('2d');
    var blobs=[[0.35,0.55,0.30],[0.55,0.45,0.36],[0.72,0.58,0.28],[0.5,0.64,0.30]];
    blobs.forEach(function(b){
      var g=cx2.createRadialGradient(256*b[0],160*b[1],0,256*b[0],160*b[1],256*b[2]);
      g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');
      cx2.fillStyle=g;cx2.fillRect(0,0,256,160);
    });
    var cloudTex=new THREE.CanvasTexture(cc2);
    var cloudM=new THREE.SpriteMaterial({map:cloudTex,transparent:true,opacity:0.55,depthWrite:false});
    dyn.cloudMat=cloudM;
    var clouds=[];
    for(var ci=0;ci<7;ci++){
      var spr=new THREE.Sprite(cloudM);
      var sc=240+rng()*200;
      spr.scale.set(sc,sc*0.62,1);
      var cy=380+rng()*150;
      var cx0=bounds.x0-400+rng()*((bounds.x1-bounds.x0)+800);
      var cz0=bounds.y0+rng()*(bounds.y1-bounds.y0);
      spr.position.set(cx0,cy,cz0);
      group.add(spr);
      clouds.push({spr:spr,x0:cx0,sp:9+rng()*13,cy:cy,phase:rng()*6.28});
    }
    var span=(bounds.x1-bounds.x0)+800;
    updaters.push(function(t){
      for(var j=0;j<clouds.length;j++){
        var cl=clouds[j];
        var x=bounds.x0-400+((cl.x0-(bounds.x0-400)+t/1000*cl.sp)%span+span)%span;
        cl.spr.position.set(x,cl.cy+Math.sin(t*0.0004+cl.phase)*22,cl.spr.position.z);
      }
    });
    disposables.push(function(){cloudTex.dispose();cloudM.dispose();});
  }catch(e){/* clouds are decorative */}

  /* ---------------- window lights ---------------- */
  try{
    var EX=2.6;
    var blds=shuffle((W.blocks&&W.blocks.buildings||[]).slice(),rng);
    var wins=[],cap=700;
    for(var bi2=0;bi2<blds.length&&cap>0;bi2++){
      var bd=blds[bi2];
      var arch=bd.architecture;if(!arch||!arch.volumes)continue;
      var vols=arch.volumes.slice(0,3);
      for(var vi=0;vi<vols.length&&cap>0;vi++){
        var v=vols[vi],plan=v.plan;
        if(!plan||plan.length<4)continue;
        var nWin=(bd.w*bd.h>9000)?3:((bd.w*bd.h>3200)?2:1);
        for(var wi=0;wi<nWin&&cap>0;wi++,cap--){
          var wall=Math.floor(rng()*4);
          var a=plan[wall],bb=plan[(wall+1)%4];
          var t=0.3+rng()*0.4;
          var mx=a.x+(bb.x-a.x)*t,my=a.y+(bb.y-a.y)*t;
          var ex=bb.x-a.x,ey=bb.y-a.y,el=Math.hypot(ex,ey)||1;
          var nx=-ey/el,ny=ex/el;
          var ccx=(plan[0].x+plan[1].x+plan[2].x+plan[3].x)/4,
              ccy=(plan[0].y+plan[1].y+plan[2].y+plan[3].y)/4;
          if((mx-ccx)*nx+(my-ccy)*ny<0){nx=-nx;ny=-ny;}
          var z0=(v.z0||0),z1=v.z1||3;
          var wy=(z0+(z1-z0)*(0.35+rng()*0.4))*EX;
          wins.push({x:mx+nx*0.6,y:wy,z:my+ny*0.6,yaw:Math.atan2(nx,ny)});
        }
      }
    }
    if(wins.length){
      var winG=new THREE.PlaneGeometry(2.6,3.4);
      var winM=new THREE.MeshBasicMaterial({color:0xffdca0,transparent:true,opacity:0,toneMapped:false,depthWrite:false});
      var winMesh=new THREE.InstancedMesh(winG,winM,wins.length);
      winMesh.renderOrder=5;
      wins.forEach(function(wn,i){
        dummy.position.set(wn.x,wn.y,wn.z);
        dummy.rotation.set(0,wn.yaw,0);
        dummy.updateMatrix();
        winMesh.setMatrixAt(i,dummy.matrix);
      });
      winMesh.instanceMatrix.needsUpdate=true;
      group.add(winMesh);
      dyn.windowsMat=winM;
      disposables.push(function(){winG.dispose();winM.dispose();});
    }
  }catch(e){/* windows are decorative */}

  /* ---------------- day/night ---------------- */
  var nightScale=pal.glowInt>0?0.55:1;
  var sunBaseI=pal.sunInt,sunBaseC=new THREE.Color(pal.sun);
  var hemiBaseI=pal.hemiInt,expBase=pal.exposure;
  var skyBase=new THREE.Color(pal.sky),nightSky=new THREE.Color(0x0b1226);
  var nightSun=new THREE.Color(0x8fa8d8);
  function daynight(t){
    var tod=(t/90000)%1;               /* one full day per 90 s on screen */
    var s=todSample(tod);
    var nk=Math.min(1,s.light)*nightScale;
    sun.intensity=sunBaseI*(1-0.9*nk);
    tmpC.copy(sunBaseC).lerp(nightSun,nk*0.75);
    tmpC2.setRGB(s.r/255,s.g/255,s.b/255);
    tmpC.lerp(tmpC2,Math.min(1,s.a*4)*0.5);
    sun.color.copy(tmpC);
    var az=tod*Math.PI*2+1.1,dayness=1-nk;
    sun.position.set(cx+Math.cos(az)*1300,260+dayness*1350,cz+Math.sin(az)*1300);
    hemi.intensity=hemiBaseI*(1-0.7*nk);
    tmpC.copy(skyBase).lerp(nightSky,nk);
    scene.background.copy(tmpC);
    if(scene.fog)scene.fog.color.copy(tmpC);
    renderer.toneMappingExposure=expBase*(1+0.12*nk);
    if(dyn.windowsMat)dyn.windowsMat.opacity=nk*0.95;
    if(dyn.carLightMat)dyn.carLightMat.color.setScalar(0.6+1.2*nk);
    if(dyn.trainLightMat)dyn.trainLightMat.color.setScalar(0.6+1.2*nk);
    if(dyn.cloudMat)dyn.cloudMat.opacity=0.55*(1-0.45*nk);
  }

  function update(t){
    for(var i=0;i<updaters.length;i++){try{updaters[i](t);}catch(e){}}
    try{daynight(t);}catch(e){}
  }
  function dispose(){
    scene.remove(group);
    group.traverse(function(o){
      if(o.geometry)o.geometry.dispose();
      if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});
    });
    disposables.forEach(function(d){try{d();}catch(e){}});
    updaters.length=0;
  }
  return {update:update,dispose:dispose,VERSION:VERSION};
}
