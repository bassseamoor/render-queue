/* Road Atlas 3D — sky 2.0.0
 * A real sky: gradient dome, a visible sun disc and moon that follow the
 * day/night cycle, puffy low-poly 3D clouds (not sprites), tiny flapping
 * birds circling thermals, and airliners crossing overhead with contrails.
 */
import * as THREE from 'three';
import { hex, rngFromSeed, shuffle } from './road-atlas-3d-core.js?v=2.0.0';

export function buildSky(CITY){
  var pal=CITY.pal, bounds=CITY.bounds;
  var rng=rngFromSeed((CITY.W.seed||'x')+'|3d-sky-v2');
  var group=new THREE.Group();
  var disposables=[];
  var dummy=new THREE.Object3D();
  var cx=(bounds.x0+bounds.x1)/2, cz=(bounds.y0+bounds.y1)/2;
  var R=5200; // celestial distance

  /* ---------- gradient dome ---------- */
  var domeGeo=new THREE.SphereGeometry(6000,24,16);
  var dp=domeGeo.getAttribute('position');
  var dcol=new Float32Array(dp.count*3);
  var zen=hex(pal.sky).multiplyScalar(0.72),hor=hex(pal.sky).multiplyScalar(1.12);
  var _dc=new THREE.Color();
  for(var di=0;di<dp.count;di++){
    var t=Math.max(0,Math.min(1,dp.getY(di)/6000*0.5+0.5));
    _dc.copy(hor).lerp(zen,Math.pow(t,0.8));
    dcol[di*3]=_dc.r;dcol[di*3+1]=_dc.g;dcol[di*3+2]=_dc.b;
  }
  domeGeo.setAttribute('color',new THREE.BufferAttribute(dcol,3));
  var domeMat=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,depthWrite:false});
  var dome=new THREE.Mesh(domeGeo,domeMat);
  dome.position.set(cx,0,cz);
  dome.renderOrder=-10;
  group.add(dome);
  disposables.push(function(){domeGeo.dispose();domeMat.dispose();});

  /* ---------- sun disc + moon ---------- */
  var sunMat=new THREE.MeshBasicMaterial({color:0xfff3c4,toneMapped:false,fog:false,transparent:true,opacity:0.95});
  var sunDisc=new THREE.Mesh(new THREE.CircleGeometry(190,32),sunMat);
  sunDisc.userData.kind='sunDisc';
  group.add(sunDisc);
  var sunGlowMat=new THREE.MeshBasicMaterial({color:0xffe9a8,toneMapped:false,fog:false,transparent:true,opacity:0.25,depthWrite:false});
  var sunGlow=new THREE.Mesh(new THREE.CircleGeometry(330,32),sunGlowMat);
  group.add(sunGlow);
  var moonMat=new THREE.MeshBasicMaterial({color:0xe8eefc,toneMapped:false,fog:false,transparent:true,opacity:0});
  var moon=new THREE.Mesh(new THREE.CircleGeometry(110,32),moonMat);
  group.add(moon);
  // simple crater shading: darker disc slightly offset behind
  var craterMat=new THREE.MeshBasicMaterial({color:0xc9d4e8,toneMapped:false,fog:false,transparent:true,opacity:0});
  var craters=new THREE.Group();
  for(var cri=0;cri<4;cri++){
    var cr=new THREE.Mesh(new THREE.CircleGeometry(14+rng()*20,12),craterMat);
    cr.position.set((rng()-0.5)*120,(rng()-0.5)*120,1);
    craters.add(cr);
  }
  group.add(craters);
  disposables.push(function(){sunDisc.geometry.dispose();sunMat.dispose();sunGlow.geometry.dispose();sunGlowMat.dispose();moon.geometry.dispose();moonMat.dispose();craterMat.dispose();});

  function placeDisc(mesh,x,y,z){
    mesh.position.set(cx+x,y,cz+z);
    mesh.lookAt(cx,0,cz);
  }
  function setCelestial(az,el,nk){
    // az: sun azimuth radians, el: elevation radians (-below horizon..)
    var sd=Math.sin(az),cd=Math.cos(az),se=Math.sin(el),ce=Math.cos(el);
    var sx=cd*ce*R,sy=se*R,sz=sd*ce*R;
    placeDisc(sunDisc,sx,Math.max(sy,-400),sz);
    placeDisc(sunGlow,sx,Math.max(sy,-400),sz);
    var dayOp=Math.max(0,Math.min(1,(se+0.06)*4));
    sunMat.opacity=0.95*dayOp;
    sunGlowMat.opacity=0.25*dayOp;
    // moon opposite the sun
    var mx=-cd*ce*R,my=-se*R,mz=-sd*ce*R;
    placeDisc(moon,mx,Math.max(my,-400),mz);
    craters.position.copy(moon.position);
    craters.lookAt(cx,0,cz);
    var nightOp=Math.max(0,Math.min(1,(-se+0.02)*5))*Math.min(1,nk*1.5+0.2);
    moonMat.opacity=0.95*nightOp;
    craterMat.opacity=0.9*nightOp;
    // dome tint at night
    domeMat.color.setScalar(1-0.82*Math.min(1,nk));
  }

  /* ---------- 3D clouds: merged blob clusters, instanced ---------- */
  var cloudMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:true,transparent:true,opacity:0.92});
  var cloudDay=new THREE.Color(0xffffff),cloudNight=new THREE.Color(0x2a3550),
      cloudDusk=new THREE.Color(0xffd9b0);
  var cloudMeshes=[];
  var archetypes=[];
  for(var ai=0;ai<3;ai++){
    var parts=[];
    var nBlob=5+Math.floor(rng()*3);
    for(var b2=0;b2<nBlob;b2++){
      var g=new THREE.IcosahedronGeometry(1,1);
      var bx=(rng()-0.5)*130,by=(rng()-0.5)*34,bz=(rng()-0.5)*70;
      var bs=26+rng()*38;
      g.scale(bs,bs*0.62,bs*0.8);
      g.translate(bx,by,bz);
      parts.push(g);
    }
    // merge parts
    var tp=0;parts.forEach(function(g){tp+=g.getAttribute('position').count;});
    var cpos=new Float32Array(tp*3),co=0,cidx=[],cb=0;
    parts.forEach(function(g){
      var pa=g.getAttribute('position'),ix=g.getIndex();
      cpos.set(pa.array,co*3);co+=pa.count;
      if(ix){for(var k=0;k<ix.count;k++)cidx.push(ix.getX(k)+cb);}
      else{for(var k2=0;k2<pa.count;k2++)cidx.push(cb+k2);}
      cb+=pa.count;g.dispose();
    });
    var cg=new THREE.BufferGeometry();
    cg.setAttribute('position',new THREE.BufferAttribute(cpos,3));
    cg.setIndex(cidx);cg.computeVertexNormals();
    archetypes.push(cg);
  }
  var clouds=[]; // {mesh idx, x, y, z, speed, phase}
  var span=(bounds.x1-bounds.x0)+1600;
  archetypes.forEach(function(cg,agi){
    var n=4;
    var im=new THREE.InstancedMesh(cg,cloudMat,n);
    for(var i2=0;i2<n;i2++){
      var sc=1.1+rng()*1.3;
      var cy2=520+rng()*260;
      var xx=bounds.x0-800+rng()*span;
      var zz=bounds.y0-200+rng()*((bounds.y1-bounds.y0)+400);
      clouds.push({im:im,slot:i2,x0:xx,y:cy2,z:zz,speed:10+rng()*14,phase:rng()*6.28,sc:sc});
      dummy.position.set(xx,cy2,zz);
      dummy.scale.set(sc,sc,sc);
      dummy.rotation.set(0,rng()*6.28,0);
      dummy.updateMatrix();
      im.setMatrixAt(i2,dummy.matrix);
    }
    im.instanceMatrix.needsUpdate=true;
    group.add(im);
    cloudMeshes.push(im);
    disposables.push(function(){cg.dispose();});
  });
  disposables.push(function(){cloudMat.dispose();});

  /* ---------- birds: tiny flapping specks on thermal circles ---------- */
  var birds=[];
  var birdGeo=(function(){
    // two triangles = wings
    var g=new THREE.BufferGeometry();
    var v=new Float32Array([ -2.2,0,0,  0,0,0.5,  0,0,-0.5,   2.2,0,0,  0,0,-0.5,  0,0,0.5 ]);
    g.setAttribute('position',new THREE.BufferAttribute(v,3));
    g.setIndex([0,1,2, 3,4,5]);
    g.computeVertexNormals();
    return g;
  })();
  var birdMat=new THREE.MeshBasicMaterial({color:0x2c3138,side:THREE.DoubleSide});
  var NB=34;
  var birdMesh=new THREE.InstancedMesh(birdGeo,birdMat,NB);
  birdMesh.userData.kind='birds';
  for(var bdi=0;bdi<NB;bdi++){
    birds.push({
      cx:cx+(rng()-0.5)*(bounds.x1-bounds.x0)*0.7,
      cz:cz+(rng()-0.5)*(bounds.y1-bounds.y0)*0.7,
      r:60+rng()*160, h:150+rng()*220,
      sp:(0.25+rng()*0.4)*(rng()<0.5?1:-1),
      ph:rng()*6.28, fl:6+rng()*5, s:0.8+rng()*0.9
    });
  }
  group.add(birdMesh);
  disposables.push(function(){birdGeo.dispose();birdMat.dispose();});

  /* ---------- planes with contrails ---------- */
  var planes=[];
  var planeGeo=(function(){
    var parts=[];
    function box(w,h,d,x,y,z){var g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);parts.push(g);}
    box(46,4,4,0,0,0);          // fuselage (x = forward)
    box(8,5,3,-20,3,0);         // tail fin
    box(10,1.6,30,2,0,0);       // wings
    box(7,1.2,12,-21,1,0);      // tailplane
    var tp2=0;parts.forEach(function(g){tp2+=g.getAttribute('position').count;});
    var pp=new Float32Array(tp2*3),po=0,pidx=[],pb2=0;
    parts.forEach(function(g){
      var pa=g.getAttribute('position'),ix=g.getIndex();
      pp.set(pa.array,po*3);po+=pa.count;
      for(var k=0;k<ix.count;k++)pidx.push(ix.getX(k)+pb2);
      pb2+=pa.count;g.dispose();
    });
    var pg=new THREE.BufferGeometry();
    pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
    pg.setIndex(pidx);pg.computeVertexNormals();
    return pg;
  })();
  var planeMat=new THREE.MeshStandardMaterial({color:0xdfe5ea,roughness:0.5,metalness:0.2});
  var TRAIL=42;
  for(var pli=0;pli<2;pli++){
    var pm=new THREE.Mesh(planeGeo,planeMat);
    pm.userData.kind='plane';
    group.add(pm);
    // contrail: flat ribbon updated per frame
    var tg=new THREE.BufferGeometry();
    var tpos=new Float32Array(TRAIL*2*3);
    tg.setAttribute('position',new THREE.BufferAttribute(tpos,3));
    var tidx=[];
    for(var ti3=0;ti3<TRAIL-1;ti3++){var b3=ti3*2;tidx.push(b3,b3+1,b3+2,b3+1,b3+3,b3+2);}
    tg.setIndex(tidx);
    var tm2=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false});
    var trail=new THREE.Mesh(tg,tm2);
    trail.frustumCulled=false;
    group.add(trail);
    var dir=rng()*Math.PI*2;
    planes.push({
      mesh:pm,trail:trail,tpos:tpos,
      x:cx+(rng()-0.5)*3000,z:cz+(rng()-0.5)*3000,
      dir:dir,speed:95+rng()*40,h:760+rng()*260,
      hist:[],ph:rng()*6.28
    });
  }
  disposables.push(function(){planeGeo.dispose();planeMat.dispose();});

  /* ---------- per-frame update ---------- */
  function update(t,dt){
    var ts=t/1000;
    // clouds drift + bob
    for(var i=0;i<clouds.length;i++){
      var cl=clouds[i];
      var x=bounds.x0-800+(((cl.x0-(bounds.x0-800)+ts*cl.speed)%span)+span)%span;
      dummy.position.set(x,cl.y+Math.sin(ts*0.11+cl.phase)*16,cl.z);
      dummy.scale.set(cl.sc,cl.sc,cl.sc);
      dummy.rotation.set(0,cl.phase,0);
      dummy.updateMatrix();
      cl.im.setMatrixAt(cl.slot,dummy.matrix);
    }
    for(var mi=0;mi<cloudMeshes.length;mi++)cloudMeshes[mi].instanceMatrix.needsUpdate=true;
    // birds
    for(var j=0;j<birds.length;j++){
      var bd=birds[j];
      var a=bd.ph+ts*bd.sp;
      var bx=bd.cx+Math.cos(a)*bd.r,bz=bd.cz+Math.sin(a)*bd.r;
      var by=bd.h+Math.sin(ts*0.7+bd.ph)*14;
      var flap=Math.sin(ts*bd.fl+bd.ph);
      dummy.position.set(bx,by,bz);
      dummy.rotation.set(0,-a+(bd.sp>0?0:Math.PI),flap*0.5);
      dummy.scale.set(bd.s,bd.s*(0.55+0.45*Math.abs(flap)),bd.s);
      dummy.updateMatrix();
      birdMesh.setMatrixAt(j,dummy.matrix);
    }
    birdMesh.instanceMatrix.needsUpdate=true;
    // planes
    for(var k2=0;k2<planes.length;k2++){
      var pl=planes[k2];
      pl.x+=Math.cos(pl.dir)*pl.speed*dt;
      pl.z+=Math.sin(pl.dir)*pl.speed*dt;
      // wrap in a big circle around the city
      var dx=pl.x-cx,dz=pl.z-cz,d=Math.hypot(dx,dz);
      if(d>3600){
        pl.dir=Math.atan2(-dz,-dx)+(rng()-0.5)*0.6;
        pl.x=cx+Math.cos(pl.dir+Math.PI)*3400;
        pl.z=cz+Math.sin(pl.dir+Math.PI)*3400;
      }
      var py=pl.h+Math.sin(ts*0.4+pl.ph)*20;
      pl.mesh.position.set(pl.x,py,pl.z);
      pl.mesh.rotation.set(0,-pl.dir,0.08);
      pl.hist.unshift({x:pl.x-Math.cos(pl.dir)*30,y:py,z:pl.z-Math.sin(pl.dir)*30});
      if(pl.hist.length>TRAIL)pl.hist.pop();
      var pa2=pl.trail.geometry.getAttribute('position');
      for(var h2=0;h2<TRAIL;h2++){
        var hp=pl.hist[Math.min(h2,pl.hist.length-1)]||{x:pl.x,y:py,z:pl.z};
        var wdt2=(h2/TRAIL)*7+0.6;
        var px2=-Math.sin(pl.dir),pz2=Math.cos(pl.dir);
        pa2.setXYZ(h2*2,hp.x+px2*wdt2,hp.y,hp.z+pz2*wdt2);
        pa2.setXYZ(h2*2+1,hp.x-px2*wdt2,hp.y,hp.z-pz2*wdt2);
      }
      pa2.needsUpdate=true;
    }
  }

  var _cc=new THREE.Color(),lastSkyNk=-1;
  function setNight(nk,duskF){
    if(Math.abs(nk-lastSkyNk)<0.1)return;
    lastSkyNk=nk;
    _cc.copy(cloudDay).lerp(cloudNight,Math.min(1,nk*1.15));
    if(duskF>0)_cc.lerp(cloudDusk,duskF*0.55*(1-Math.min(1,nk)));
    cloudMat.color.copy(_cc);
    birdMat.color.setHex(nk>0.6?0x11141a:0x2c3138);
  }
  setNight(0,0);

  return {
    group:group,
    update:update,
    setNight:setNight,
    setCelestial:setCelestial,
    counts:{clouds:clouds.length,birds:NB,planes:planes.length},
    dispose:function(){
      group.traverse(function(o){
        if(o.geometry)o.geometry.dispose();
        if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});
      });
      disposables.forEach(function(d){try{d();}catch(e){}});
    }
  };
}
