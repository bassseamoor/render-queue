/* Road Atlas 3D — props 2.0.0
 * Street furniture, all instanced: streetlights marching along the roads
 * (their heads glow after dark) and red fire hydrants tucked by corners.
 */
import * as THREE from 'three';
import { hex, rngFromSeed, smoothPath, prepPath, pointAt } from './road-atlas-3d-core.js?v=2.0.0';

export function buildProps(CITY){
  var W=CITY.W, pal=CITY.pal, groundH=CITY.groundH;
  var rng=rngFromSeed((W.seed||'x')+'|3d-props-v2');
  var group=new THREE.Group();
  var disposables=[];
  var dummy=new THREE.Object3D();

  /* ---------- streetlights along the roads ---------- */
  var lamps=[]; // {x,y,z,yaw}
  try{
    var roads=(W.roads||[]).filter(function(r){return r.pts&&r.pts.length>4;});
    roads.forEach(function(r){
      var sp=smoothPath(r.pts),prep=prepPath(sp);
      if(prep.total<80)return;
      var spacing=r.cls===2?70:55;
      var n=Math.floor(prep.total/spacing);
      for(var i=0;i<n;i++){
        if(rng()<0.1)continue; // not every slot gets one
        var s=(i+0.5)/n;
        var p=pointAt(sp,prep,s);
        var side=(i%2===0)?1:-1;
        var nx=-Math.sin(p.ang)*side,nz=Math.cos(p.ang)*side;
        var off=(r.width||8)/2+4.5;
        var lx=p.x+nx*off,lz=p.y+nz*off;
        var lh=groundH(lx,lz);
        if(lh<2.5)continue; // not in the river
        lamps.push({x:lx,y:lh,z:lz,yaw:Math.atan2(-nx,-nz)});
      }
    });
  }catch(e){/* lights are decorative */}

  var lampHeadMat=null;
  if(lamps.length){
    // pole + arm merged into one geometry, instanced
    var poleG=new THREE.CylinderGeometry(0.32,0.42,9.5,7);
    poleG.translate(0,4.75,0);
    var armG=new THREE.BoxGeometry(0.35,0.35,3.4);
    armG.translate(0,9.35,1.5);
    // merge manually
    var pPos=poleG.getAttribute('position'),aPos=armG.getAttribute('position');
    var pIdx=poleG.getIndex(),aIdx=armG.getIndex();
    var pos=new Float32Array(pPos.count*3+aPos.count*3);
    pos.set(pPos.array,0);pos.set(aPos.array,pPos.count*3);
    var idx=[];
    for(var ii=0;ii<pIdx.count;ii++)idx.push(pIdx.getX(ii));
    for(var jj=0;jj<aIdx.count;jj++)idx.push(aIdx.getX(jj)+pPos.count);
    var merged=new THREE.BufferGeometry();
    merged.setAttribute('position',new THREE.BufferAttribute(pos,3));
    merged.setIndex(idx);merged.computeVertexNormals();
    poleG.dispose();armG.dispose();
    var poleM=new THREE.MeshStandardMaterial({color:0x3d4348,roughness:0.6,metalness:0.6});
    var poles=new THREE.InstancedMesh(merged,poleM,lamps.length);
    // head: small box with the glowing lamp under it
    var headG=new THREE.BoxGeometry(1.1,0.5,2.2);
    headG.translate(0,9.15,3.1);
    lampHeadMat=new THREE.MeshBasicMaterial({color:0x555a60,toneMapped:false});
    var heads=new THREE.InstancedMesh(headG,lampHeadMat,lamps.length);
    lamps.forEach(function(L,i){
      dummy.position.set(L.x,L.y,L.z);
      dummy.rotation.set(0,L.yaw,0);
      dummy.scale.set(1,1,1);
      dummy.updateMatrix();
      poles.setMatrixAt(i,dummy.matrix);
      heads.setMatrixAt(i,dummy.matrix);
    });
    poles.instanceMatrix.needsUpdate=true;
    heads.instanceMatrix.needsUpdate=true;
    poles.castShadow=true;
    group.add(poles);group.add(heads);
    disposables.push(function(){merged.dispose();poleM.dispose();headG.dispose();lampHeadMat.dispose();});
  }

  /* ---------- fire hydrants by the corners ---------- */
  var hyds=[];
  try{
    var roads2=(W.roads||[]).filter(function(r){return r.pts&&r.pts.length>6;});
    for(var ri=0;ri<roads2.length&&hyds.length<420;ri++){
      var r2=roads2[ri];
      if(rng()<0.45)continue;
      var pi2=Math.floor(rng()*(r2.pts.length-2))+1;
      var a=r2.pts[pi2-1],b=r2.pts[pi2+1]||r2.pts[pi2];
      var ang=Math.atan2(b.y-a.y,b.x-a.x);
      var side2=rng()<0.5?1:-1;
      var nx2=-Math.sin(ang)*side2,nz2=Math.cos(ang)*side2;
      var off2=(r2.width||8)/2+2.6;
      var hx=r2.pts[pi2].x+nx2*off2,hz=r2.pts[pi2].y+nz2*off2;
      var hh=groundH(hx,hz);
      if(hh<2.5)continue;
      hyds.push({x:hx,y:hh,z:hz,yaw:rng()*6.28});
    }
  }catch(e){}
  if(hyds.length){
    // body + cap + side nozzles merged
    var bodyG=new THREE.CylinderGeometry(0.55,0.65,1.5,8);bodyG.translate(0,0.75,0);
    var capG=new THREE.SphereGeometry(0.5,8,6);capG.translate(0,1.65,0);
    var nozG=new THREE.CylinderGeometry(0.22,0.22,1.5,6);nozG.rotateZ(Math.PI/2);nozG.translate(0,1.1,0);
    var parts=[bodyG,capG,nozG];
    var total=0;parts.forEach(function(g){total+=g.getAttribute('position').count;});
    var hpos=new Float32Array(total*3),ho=0,hidx=[],base=0;
    parts.forEach(function(g){
      var pa=g.getAttribute('position'),ix=g.getIndex();
      hpos.set(pa.array,ho*3);ho+=pa.count;
      for(var k=0;k<ix.count;k++)hidx.push(ix.getX(k)+base);
      base+=pa.count;g.dispose();
    });
    var hg=new THREE.BufferGeometry();
    hg.setAttribute('position',new THREE.BufferAttribute(hpos,3));
    hg.setIndex(hidx);hg.computeVertexNormals();
    var hm=new THREE.MeshStandardMaterial({color:0xb03028,roughness:0.55,metalness:0.15});
    var hmMesh=new THREE.InstancedMesh(hg,hm,hyds.length);
    hyds.forEach(function(H,i){
      dummy.position.set(H.x,H.y,H.z);
      dummy.rotation.set(0,H.yaw,0);
      dummy.scale.set(1,1,1);
      dummy.updateMatrix();
      hmMesh.setMatrixAt(i,dummy.matrix);
    });
    hmMesh.instanceMatrix.needsUpdate=true;
    hmMesh.castShadow=true;
    group.add(hmMesh);
    disposables.push(function(){hg.dispose();hm.dispose();});
  }

  var lampDay=new THREE.Color(0x555a60),lampNight=new THREE.Color(0xffd9a0);
  var lastLamp=-1,_lc=new THREE.Color();
  function setNight(nk){
    if(!lampHeadMat||Math.abs(nk-lastLamp)<0.1)return;
    lastLamp=nk;
    _lc.copy(lampDay).lerp(lampNight,Math.min(1,nk*1.2));
    lampHeadMat.color.copy(_lc);
  }
  setNight(0);

  return {
    group:group,
    setNight:setNight,
    counts:{lamps:lamps.length,hydrants:hyds.length},
    dispose:function(){
      group.traverse(function(o){
        if(o.geometry)o.geometry.dispose();
        if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});
      });
      disposables.forEach(function(d){try{d();}catch(e){}});
    }
  };
}
