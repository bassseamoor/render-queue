/* Road Atlas 3D motion 2.0.0 — the living-city layer.
 *
 * Cars drive the road graph over the hills, trains run the transit lines,
 * boats cruise the carved river, and the full day/night cycle moves the real
 * sun and moon across the sky, lights the windows, and switches on the
 * streetlights. Purely additive; a failure here never takes down the city.
 */
import * as THREE from 'three';
import { rngFromSeed, shuffle, smoothPath, prepPath, pointAt, mergeBoxes } from './road-atlas-3d-core.js?v=2.0.0';

var VERSION = '2.0.0';

/* day/night stops: [t, r,g,b, tintAlpha, nightLevel] */
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

export function startMotion(ctx){
  var scene=ctx.scene,W=ctx.W,pal=ctx.pal,sun=ctx.sun,hemi=ctx.hemi,
      renderer=ctx.renderer,bounds=ctx.bounds,groundH=ctx.groundH,
      roadY=ctx.roadY,handles=ctx.handles||{};
  var rng=rngFromSeed((W.seed||'x')+'|3d-motion-v2');
  var cx=(bounds.x0+bounds.x1)/2,cz=(bounds.y0+bounds.y1)/2;
  var group=new THREE.Group();scene.add(group);
  var updaters=[],disposables=[];
  var dyn={carLightMat:null,trainLightMat:null};
  var dummy=new THREE.Object3D();
  var tmpC=new THREE.Color(),tmpC2=new THREE.Color();

  /* ---------------- cars (follow the hills) ---------------- */
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
          var p2=pointAt(car.pts,car.prep,Math.min(1,s+0.004));
          var pitch=Math.atan2((roadY(p2.x,p2.y)-roadY(p.x,p.y)),Math.max(1,Math.hypot(p2.x-p.x,p2.y-p.y)));
          dummy.position.set(p.x,roadY(p.x,p.y)+0.15+Math.sin(t*0.02+car.phase)*0.05,p.y);
          dummy.rotation.set(0,-(p.ang+(car.dir<0?Math.PI:0)),0);
          dummy.rotateZ(pitch*0.7);
          dummy.updateMatrix();
          bodies.setMatrixAt(j,dummy.matrix);
          lights.setMatrixAt(j,dummy.matrix);
        }
        bodies.instanceMatrix.needsUpdate=true;
        lights.instanceMatrix.needsUpdate=true;
      });
      disposables.push(function(){bodyG.dispose();lightG.dispose();bodyM.dispose();lightM.dispose();});
    }
  }catch(e){}

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
      var railBatch={pos:[],col:[],idx:[]};
      trains.forEach(function(tr){
        tmpC.copy(tr.color).multiplyScalar(0.35);
        ribbonStrip(tr.pts,1.6,function(i){var p=tr.pts[i];return groundH(p.x,p.y)+1.1;},tmpC,railBatch);
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
          dummy.position.set(p.x,groundH(p.x,p.y)+1.2+Math.sin(t*0.015+tr.phase)*0.06,p.y);
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
  }catch(e){}

  /* ---------------- boats (ride the carved river) ---------------- */
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
          var wy=groundH(p.x,p.y)+0.75;
          var yaw=-(p.ang+(bt.dir<0?Math.PI:0));
          dummy.position.set(p.x,wy+Math.sin(t*0.002+bt.phase)*0.28,p.y);
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
  }catch(e){}

  function ribbonStrip(pts,hw,yfn,color,out){
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
      var y0=yfn(k),y1=yfn(k+1);
      out.pos.push(p.x+nx[k]*hw,y0,p.y+nz[k]*hw, p.x-nx[k]*hw,y0,p.y-nz[k]*hw,
                   q.x+nx[k+1]*hw,y1,q.y+nz[k+1]*hw, q.x-nx[k+1]*hw,y1,q.y-nz[k+1]*hw);
      for(var m=0;m<4;m++)out.col.push(color.r,color.g,color.b);
      out.idx.push(base,base+1,base+2, base,base+2,base+3);
    }
  }

  /* ---------------- day/night: sun + moon + lights ---------------- */
  var nightScale=pal.glowInt>0?0.55:1;
  var sunBaseI=pal.sunInt,sunBaseC=new THREE.Color(pal.sun);
  var hemiBaseI=pal.hemiInt,expBase=pal.exposure;
  var skyBase=new THREE.Color(pal.sky),nightSky=new THREE.Color(0x0b1226);
  var nightSun=new THREE.Color(0x8fa8d8);
  var skyH=handles.sky, bldH=handles.buildings, propH=handles.props;
  function daynight(t,dt){
    var tod=(t/90000)%1;
    var s=todSample(tod);
    var nk=Math.min(1,s.light)*nightScale;
    var duskF=Math.max(0,1-Math.abs(s.light-0.3)*3.2)*Math.min(1,s.a*5+0.25);
    sun.intensity=sunBaseI*(1-0.9*nk);
    tmpC.copy(sunBaseC).lerp(nightSun,nk*0.75);
    tmpC2.setRGB(s.r/255,s.g/255,s.b/255);
    tmpC.lerp(tmpC2,Math.min(1,s.a*4)*0.5);
    sun.color.copy(tmpC);
    var az=tod*Math.PI*2+1.1;
    var el=Math.sin((tod-0.25)*Math.PI*2)*1.05; // sun elevation: up at midday
    var dayness=1-nk;
    sun.position.set(cx+Math.cos(az)*Math.cos(el)*1600,Math.max(60,Math.sin(el)*1500+120),cz+Math.sin(az)*Math.cos(el)*1600);
    hemi.intensity=hemiBaseI*(1-0.7*nk);
    tmpC.copy(skyBase).lerp(nightSky,nk);
    scene.background.copy(tmpC);
    if(scene.fog)scene.fog.color.copy(tmpC);
    renderer.toneMappingExposure=expBase*(1+0.12*nk);
    if(dyn.carLightMat)dyn.carLightMat.color.setScalar(0.6+1.2*nk);
    if(dyn.trainLightMat)dyn.trainLightMat.color.setScalar(0.6+1.2*nk);
    if(skyH){try{skyH.setCelestial(az,el,nk);skyH.setNight(nk,duskF);skyH.update(t,dt);}catch(e){}}
    if(bldH){try{bldH.setNight(nk);}catch(e){}}
    if(propH){try{propH.setNight(nk);}catch(e){}}
  }

  var lastT=0;
  function update(t){
    var dt=Math.min(0.1,(t-lastT)/1000||0.016);
    lastT=t;
    for(var i=0;i<updaters.length;i++){try{updaters[i](t);}catch(e){}}
    try{daynight(t,dt);}catch(e){}
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
