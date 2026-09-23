/* Road Atlas 3D — nature 2.0.0
 * All foliage is instanced: three tree species (trunk + canopy each),
 * shrubs, and thousands of grass blades across parks and open land.
 * Everything is founded on the topo terrain. Deterministic per seed.
 */
import * as THREE from 'three';
import { hex, rngFromSeed, shuffle, pick } from './road-atlas-3d-core.js?v=2.0.0';

export function buildNature(CITY){
  var W=CITY.W, pal=CITY.pal, groundH=CITY.groundH;
  var rng=rngFromSeed((W.seed||'x')+'|3d-nature-v2');
  var group=new THREE.Group();
  var disposables=[];
  var dummy=new THREE.Object3D();

  /* ---------- gather tree spots ---------- */
  var spots=[]; // {x,z,s(0..1 size),kind}
  try{
    for(var bi=0;bi<W.blocks.buildings.length;bi++){
      var b=W.blocks.buildings[bi];
      var land=b.architecture&&b.architecture.landscape;
      if(land&&land.trees)for(var ti=0;ti<land.trees.length;ti++){
        var t=land.trees[ti];
        spots.push({x:t.x,z:t.y,s:Math.min(1.3,Math.max(0.5,(t.r||2)/2.4)),kind:'park'});
      }
    }
    // extra street trees along arterials is the props module's job; here we
    // fill parks and open rural land
    var carto=W._carto;
    var parkBlobs=[];
    for(var pi=0;pi<((carto&&carto.parks)||[]).length;pi++){
      var pb=carto.parks[pi];
      if(pb.blob&&pb.blob.length>2)parkBlobs.push(pb.blob);
    }
    function inBlob(blob,x,y){
      var inside=false;
      for(var i=0,j=blob.length-1;i<blob.length;j=i++){
        var xi=blob[i].x,yi=blob[i].y,xj=blob[j].x,yj=blob[j].y;
        if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
      }
      return inside;
    }
    var bounds=CITY.bounds;
    var extra=0;
    for(var px=bounds.x0;px<bounds.x1&&extra<900;px+=46){
      for(var pz=bounds.y0;pz<bounds.y1&&extra<900;pz+=46){
        var jx=px+(rng()-0.5)*40,jz=pz+(rng()-0.5)*40;
        var h=groundH(jx,jz);
        if(h<4)continue; // not in the water
        var inPark=false;
        for(var bi2=0;bi2<parkBlobs.length;bi2++){if(inBlob(parkBlobs[bi2],jx,jz)){inPark=true;break;}}
        var sl=CITY.ground.slopeAt(jx,jz);
        if(inPark){ if(rng()<0.55){spots.push({x:jx,z:jz,s:0.5+rng()*0.7,kind:'park'});extra++;} }
        else if(sl>0.35&&rng()<0.5){ spots.push({x:jx,z:jz,s:0.6+rng()*0.9,kind:'wild'});extra++; }
        else if(rng()<0.035){ spots.push({x:jx,z:jz,s:0.5+rng()*0.6,kind:'wild'});extra++; }
      }
    }
  }catch(e){/* trees are decorative */}

  shuffle(spots,rng);

  /* ---------- three species, all instanced ---------- */
  // species 0: broadleaf (icosahedron canopy), 1: conifer (cone stack), 2: palm-ish (tall trunk + flat crown)
  var counts=[0,0,0];
  var per=[[],[],[]];
  spots.forEach(function(sp){
    var k=sp.kind==='wild'?(rng()<0.7?1:0):(rng()<0.6?0:(rng()<0.7?1:2));
    per[k].push(sp);counts[k]++;
  });
  var leafC=hex(pal.leaf),trunkC=hex(pal.trunk);
  var leafC2=leafC.clone().multiplyScalar(0.8),leafC3=leafC.clone().multiplyScalar(1.15);

  function inst(geo,mat,list,place){
    if(!list.length)return null;
    var m=new THREE.InstancedMesh(geo,mat,list.length);
    list.forEach(function(sp,i){ place(sp,i,m); });
    m.instanceMatrix.needsUpdate=true;
    m.castShadow=true;
    group.add(m);
    disposables.push(function(){geo.dispose();mat.dispose();});
    return m;
  }
  function trunkPlace(h0,r0){
    return function(sp,i,m){
      var s=sp.s,h=h0*s,r=r0*s;
      dummy.position.set(sp.x,groundH(sp.x,sp.z)-0.3,sp.z);
      dummy.scale.set(r,h,r);dummy.rotation.set(0,rng()*6.28,0);
      dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
    };
  }
  // trunks: one instanced mesh per species (different proportions)
  var trunkG0=new THREE.CylinderGeometry(0.5,0.8,1,6);trunkG0.translate(0,0.5,0);
  var trunkG1=new THREE.CylinderGeometry(0.35,0.6,1,6);trunkG1.translate(0,0.5,0);
  var trunkG2=new THREE.CylinderGeometry(0.3,0.45,1,6);trunkG2.translate(0,0.5,0);
  var trunkM=new THREE.MeshStandardMaterial({color:trunkC,roughness:1});
  inst(trunkG0,trunkM,per[0],trunkPlace(4.5,1.1));
  inst(trunkG1,trunkM.clone(),per[1],trunkPlace(5.5,0.9));
  inst(trunkG2,trunkM.clone(),per[2],trunkPlace(8.5,0.8));

  // canopies
  var canG0=new THREE.IcosahedronGeometry(1,1);
  var canM0=new THREE.MeshStandardMaterial({color:leafC,roughness:1,flatShading:true});
  inst(canG0,canM0,per[0],function(sp,i,m){
    var s=sp.s;
    dummy.position.set(sp.x,groundH(sp.x,sp.z)-0.3+4.5*s+1.6*s,sp.z);
    dummy.scale.set(3.2*s,2.8*s,3.2*s);dummy.rotation.set(0,rng()*6.28,0);
    dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
    m.setColorAt(i,rng()<0.5?leafC:leafC3);
  });
  var canG1=new THREE.ConeGeometry(1,1,7);
  var canM1=new THREE.MeshStandardMaterial({color:leafC2,roughness:1,flatShading:true});
  inst(canG1,canM1,per[1],function(sp,i,m){
    var s=sp.s,gy=groundH(sp.x,sp.z)-0.3;
    // two stacked cones = one instance? no — use scale trick: single tall cone
    dummy.position.set(sp.x,gy+5.5*s+2.6*s,sp.z);
    dummy.scale.set(2.6*s,5.2*s,2.6*s);dummy.rotation.set(0,rng()*6.28,0);
    dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
    m.setColorAt(i,rng()<0.5?leafC2:leafC);
  });
  var canG2=new THREE.SphereGeometry(1,7,5);
  canG2.scale(1,0.45,1);
  var canM2=new THREE.MeshStandardMaterial({color:leafC3,roughness:1,flatShading:true});
  inst(canG2,canM2,per[2],function(sp,i,m){
    var s=sp.s;
    dummy.position.set(sp.x,groundH(sp.x,sp.z)-0.3+8.5*s+0.6,sp.z);
    dummy.scale.set(3.4*s,1.6*s,3.4*s);dummy.rotation.set(0,rng()*6.28,0);
    dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);
  });
  // fix up instance colors
  group.traverse(function(o){
    if(o.isInstancedMesh&&o.instanceColor)o.instanceColor.needsUpdate=true;
  });

  /* ---------- shrubs ---------- */
  var shrubs=[];
  for(var si=0;si<spots.length&&shrubs.length<700;si+=3){
    if(rng()<0.6){var sp2=spots[si];shrubs.push({x:sp2.x+(rng()-0.5)*14,z:sp2.z+(rng()-0.5)*14,s:0.5+rng()*0.8});}
  }
  if(shrubs.length){
    var shG=new THREE.IcosahedronGeometry(1,0);
    var shM=new THREE.MeshStandardMaterial({color:leafC2,roughness:1,flatShading:true});
    var shm=new THREE.InstancedMesh(shG,shM,shrubs.length);
    shrubs.forEach(function(sp,i){
      dummy.position.set(sp.x,groundH(sp.x,sp.z)+0.5*sp.s,sp.z);
      dummy.scale.set(1.6*sp.s,1.1*sp.s,1.6*sp.s);dummy.rotation.set(0,rng()*6.28,0);
      dummy.updateMatrix();shm.setMatrixAt(i,dummy.matrix);
    });
    shm.instanceMatrix.needsUpdate=true;
    group.add(shm);
    disposables.push(function(){shG.dispose();shM.dispose();});
  }

  /* ---------- grass: instanced blades on parks + soft ground ---------- */
  var blades=[];
  try{
    var bounds2=CITY.bounds;
    for(var gx=bounds2.x0;gx<bounds2.x1&&blades.length<5200;gx+=26){
      for(var gz=bounds2.y0;gz<bounds2.y1&&blades.length<5200;gz+=26){
        var bx=gx+(rng()-0.5)*24,bz=gz+(rng()-0.5)*24;
        var gh=groundH(bx,bz);
        if(gh<2.2||gh>CITY.ground.relief*0.9)continue;
        var gsl=CITY.ground.slopeAt(bx,bz);
        if(gsl>0.6)continue;
        if(rng()<0.42)blades.push({x:bx,z:bz,s:0.7+rng()*0.9,hue:rng()});
      }
    }
    // guarantee grass where it matters: tufts around every tree
    for(var tgi=0;tgi<spots.length&&blades.length<6800;tgi++){
      var tsp=spots[tgi];
      var nTuft=4+Math.floor(rng()*4);
      for(var qi=0;qi<nTuft;qi++){
        var qx=tsp.x+(rng()-0.5)*16,qz=tsp.z+(rng()-0.5)*16;
        if(groundH(qx,qz)<2.2)continue;
        blades.push({x:qx,z:qz,s:0.6+rng()*0.9,hue:rng()});
      }
    }
  }catch(e){}
  if(blades.length){
    // cross-quad blade
    var bpos=[],bidx=[];
    function quadBlade(){
      var base=bpos.length/3;
      // two crossed quads, 1.6 wide, 2.2 tall
      bpos.push(-0.8,0,0, 0.8,0,0, 0.8,2.2,0, -0.8,2.2,0);
      bpos.push(0,0,-0.8, 0,0,0.8, 0,2.2,0.8, 0,2.2,-0.8);
      bidx.push(base,base+1,base+2, base,base+2,base+3,
                base+4,base+5,base+6, base+4,base+6,base+7);
    }
    quadBlade();
    var bg=new THREE.BufferGeometry();
    bg.setAttribute('position',new THREE.Float32BufferAttribute(bpos,3));
    bg.setIndex(bidx);bg.computeVertexNormals();
    var bm2=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,side:THREE.DoubleSide});
    var gm=new THREE.InstancedMesh(bg,bm2,blades.length);
    var g1=hex(pal.park),g2=g1.clone().multiplyScalar(1.25),g3=g1.clone().multiplyScalar(0.75);
    var _gc=new THREE.Color();
    blades.forEach(function(sp,i){
      dummy.position.set(sp.x,groundH(sp.x,sp.z)-0.2,sp.z);
      dummy.scale.set(sp.s,sp.s*(0.8+sp.hue*0.5),sp.s);
      dummy.rotation.set(0,rng()*6.28,0);
      dummy.updateMatrix();gm.setMatrixAt(i,dummy.matrix);
      _gc.copy(sp.hue<0.33?g1:(sp.hue<0.66?g2:g3));
      gm.setColorAt(i,_gc);
    });
    gm.instanceMatrix.needsUpdate=true;
    if(gm.instanceColor)gm.instanceColor.needsUpdate=true;
    group.add(gm);
    disposables.push(function(){bg.dispose();bm2.dispose();});
  }

  return {
    group:group,
    counts:{trees:spots.length,shrubs:shrubs.length,grass:blades.length},
    dispose:function(){
      group.traverse(function(o){
        if(o.geometry)o.geometry.dispose();
        if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});
      });
      disposables.forEach(function(d){try{d();}catch(e){}});
    }
  };
}
