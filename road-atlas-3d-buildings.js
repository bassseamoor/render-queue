/* Road Atlas 3D — buildings 2.0.0
 * Denser + far more detailed. Every volume gets: parapets on flat roofs,
 * real window strips (instanced — they glow warm at night), doors,
 * storefront glass and awnings on commercial ground floors, chimneys on
 * houses, and rooftop clutter (AC units, water tanks). Empty buildable
 * parcels are infilled with new buildings so the city reads dense.
 * Everything is founded on the topo terrain (groundH), nothing floats.
 */
import * as THREE from 'three';
import { Batch, hex, shadeTo, rngFromSeed, shuffle, pick } from './road-atlas-3d-core.js?v=2.0.0';

var EX = 2.6; // vertical exaggeration, matches the 2D painter's language

export function buildBuildings(CITY){
  var W=CITY.W, pal=CITY.pal, groundH=CITY.groundH;
  var rng=rngFromSeed((W.seed||'x')+'|3d-buildings-v2');
  var group=new THREE.Group();
  var disposables=[];

  var wallBatch=new Batch();   // walls + roofs + trim (vertex colors)
  var winXf=[];                // {x,y,z,yaw} per window
  var winLit=[];               // per-window random lit factor
  var tankXf=[];               // rooftop water tanks {x,y,z,s}
  var MAXWIN=24000;

  function corner(p){return [p.x,p.y];}
  function baseY(plan){
    var m=Infinity;
    for(var i=0;i<plan.length;i++){
      var h=groundH(plan[i].x,plan[i].y);
      if(h<m)m=h;
    }
    return m-1.2; // embed slightly so nothing floats on slopes
  }

  /* one architectural volume, fully dressed */
  function addVolume(v,wallColor,commercial){
    var p=v.plan;
    if(!p||p.length<4)return;
    var c=[p[0],p[1],p[2],p[3]].map(corner);
    var y0=baseY(p)+(v.z0||0)*EX, y1=baseY(p)+v.z1*EX;
    if(y1-y0<2)y1=y0+2;
    var P3=function(q,y){return [q[0],y,q[1]];};
    // walls
    for(var i=0;i<4;i++){
      var a=c[i],b=c[(i+1)%4];
      wallBatch.quad(P3(a,y0),P3(b,y0),P3(b,y1),P3(a,y1),wallColor);
    }
    // corner pilasters — thin vertical trim that catches the light
    var trimC=wallColor.clone().multiplyScalar(1.12);
    for(var ci=0;ci<4;ci++){
      var q=c[ci];
      wallBatch.quad([q[0]-0.7,y0,q[1]-0.7],[q[0]+0.7,y0,q[1]-0.7],[q[0]+0.7,y1,q[1]+0.7],[q[0]-0.7,y1,q[1]+0.7],trimC);
    }
    var roof=v.roof||'flat';
    var roofCol=v.warmRoof?hex(pal.roofTerra):hex(pal.roofSlate);
    var dist=function(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);};
    var mid2=function(a,b){return [(a[0]+b[0])/2,(a[1]+b[1])/2];};
    var ccx=(c[0][0]+c[1][0]+c[2][0]+c[3][0])/4,
        ccz=(c[0][1]+c[1][1]+c[2][1]+c[3][1])/4;
    var wdt=Math.min(dist(c[0],c[1]),dist(c[1],c[2]));

    /* --- windows: strips on every wall, every floor --- */
    if(winXf.length<MAXWIN){
      var floors=Math.max(1,Math.round((v.z1-(v.z0||0))/3.6));
      var commercial0=commercial&&floors>0;
      for(var wi=0;wi<4;wi++){
        var wa=c[wi],wb=c[(wi+1)%4];
        var ex=wb[0]-wa[0],ez=wb[1]-wa[1],el=Math.hypot(ex,ez)||1;
        var nx=-ez/el,nz=ex/el;
        if((wa[0]-ccx)*nx+(wa[1]-ccz)*nz<0){nx=-nx;nz=-nz;}
        var n=Math.max(1,Math.floor(el/4.6));
        for(var f=0;f<floors;f++){
          var wy=y0+((f+(commercial0&&f===0?0.62:0.55))/(floors))*(y1-y0);
          if(commercial0&&f===0){
            // storefront glass band
            for(var sgi=0;sgi<n&&winXf.length<MAXWIN;sgi++){
              var t=(sgi+0.5)/n;
              winXf.push({x:wa[0]+ex*t+nx*0.45,y:wy,z:wa[1]+ez*t+nz*0.45,
                          yaw:Math.atan2(nx,nz),w:3.4,h:2.6,store:true});
              winLit.push(0.9);
            }
          }else{
            for(var sgi2=0;sgi2<n&&winXf.length<MAXWIN;sgi2++){
              var t2=(sgi2+0.5)/n;
              winXf.push({x:wa[0]+ex*t2+nx*0.45,y:wy,z:wa[1]+ez*t2+nz*0.45,
                          yaw:Math.atan2(nx,nz),w:2.3,h:2.7,store:false});
              winLit.push(rng());
            }
          }
        }
        // door on the longest wall, ground floor
        if(wi===0){
          var t3=0.5;
          var dx=wa[0]+ex*t3+nx*0.6,dz=wa[1]+ez*t3+nz*0.6;
          wallBatch.quad([dx-1.5,y0,dz-1.5],[dx+1.5,y0,dz+1.5],[dx+1.5,y0+3.4*EX*0.5,dz+1.5],[dx-1.5,y0+3.4*EX*0.5,dz-1.5],
            new THREE.Color(0x2a2622));
          // stoop
          wallBatch.quad([dx-2,y0+0.15,dz-2],[dx+2,y0+0.15,dz+2],[dx+2.6,y0+0.15,dz+2.6],[dx-2.6,y0+0.15,dz-2.6],
            wallColor.clone().multiplyScalar(0.8));
          if(commercial){
            // awning: slanted striped canopy over the storefront
            var ax0=dx-6,ax1=dx+6;
            var awnC=new THREE.Color(pick(rng,[0xb8452f,0x2f6db8,0x3f8f5f,0xc9a13b,0x7048a8]));
            wallBatch.quad([ax0,y0+4.6,dz],[ax1,y0+4.6,dz],[ax1+nx*0,y0+3.2,dz+nz*3.4],[ax0,y0+3.2,dz+nz*3.4],awnC);
          }
        }
      }
    }

    /* --- roof language --- */
    if(roof==='gable'){
      var rh=(v.ridge||2)*EX, yh=y1+rh;
      var longAB=dist(c[0],c[1])>=dist(c[1],c[2]);
      var rA,rB,e1a,e1b,e2a,e2b,g1a,g1b,g1c,g2a,g2b,g2c;
      if(longAB){rA=mid2(c[3],c[0]);rB=mid2(c[1],c[2]);e1a=c[0];e1b=c[1];e2a=c[3];e2b=c[2];g1a=c[3];g1b=c[0];g1c=rA;g2a=c[1];g2b=c[2];g2c=rB;}
      else{rA=mid2(c[0],c[1]);rB=mid2(c[2],c[3]);e1a=c[1];e1b=c[2];e2a=c[0];e2b=c[3];g1a=c[0];g1b=c[1];g1c=rA;g2a=c[2];g2b=c[3];g2c=rB;}
      wallBatch.quad(P3(e1a,y1),P3(e1b,y1),[rB[0],yh,rB[1]],[rA[0],yh,rA[1]],roofCol);
      wallBatch.quad(P3(e2a,y1),P3(e2b,y1),[rB[0],yh,rB[1]],[rA[0],yh,rA[1]],roofCol);
      wallBatch.tri(P3(g1a,y1),P3(g1b,y1),[g1c[0],yh,g1c[1]],wallColor);
      wallBatch.tri(P3(g2a,y1),P3(g2b,y1),[g2c[0],yh,g2c[1]],wallColor);
      // ridge cap + chimney
      wallBatch.quad([rA[0],yh,rA[1]],[rB[0],yh,rB[1]],[rB[0],yh+0.7,rB[1]],[rA[0],yh+0.7,rA[1]],roofCol.clone().multiplyScalar(0.85));
      if(wdt>7&&rng()<0.7){
        var chx=ccx+(rng()-0.5)*wdt*0.4,chz=ccz+(rng()-0.5)*wdt*0.4;
        wallBatch.quad([chx-0.9,y1,chz-0.9],[chx+0.9,y1,chz+0.9],[chx+0.9,yh+1.6,chz+0.9],[chx-0.9,yh+1.6,chz-0.9],
          new THREE.Color(0x8a5a48));
      }
    }else if(roof==='hip'){
      var rh2=(v.ridge||2)*EX*0.75, apex=[ccx,y1+rh2,ccz];
      for(var hi=0;hi<4;hi++)wallBatch.tri(P3(c[hi],y1),P3(c[(hi+1)%4],y1),apex,roofCol);
    }else if(roof==='sawtooth'){
      var teeth=3,rh3=(v.ridge||2)*EX;
      var longAB2=dist(c[0],c[1])>=dist(c[1],c[2]);
      var ua,va,lu,lv;
      if(longAB2){var d=[c[1][0]-c[0][0],c[1][1]-c[0][1]];lu=Math.hypot(d[0],d[1])||1;ua=[d[0]/lu,d[1]/lu];
        var e=[c[3][0]-c[0][0],c[3][1]-c[0][1]];lv=Math.hypot(e[0],e[1])||1;va=[e[0]/lv,e[1]/lv];}
      else{var d2=[c[1][0]-c[0][0],c[1][1]-c[0][1]];lv=Math.hypot(d2[0],d2[1])||1;va=[d2[0]/lv,d2[1]/lv];
        var e2=[c[3][0]-c[0][0],c[3][1]-c[0][1]];lu=Math.hypot(e2[0],e2[1])||1;ua=[e2[0]/lu,e2[1]/lu];}
      var at=function(su,sv,y){return [ccx+ua[0]*su+va[0]*sv,y,ccz+ua[1]*su+va[1]*sv];};
      var glass=hex(pal.glass);
      for(var k=0;k<teeth;k++){
        var s0=-lv/2+(k*lv)/teeth,s1=-lv/2+((k+1)*lv)/teeth;
        wallBatch.quad(at(-lu/2,s0,y1+rh3),at(lu/2,s0,y1+rh3),at(lu/2,s1,y1),at(-lu/2,s1,y1),roofCol);
        wallBatch.quad(at(-lu/2,s1,y1),at(lu/2,s1,y1),at(lu/2,s1,y1+rh3),at(-lu/2,s1,y1+rh3),glass);
        wallBatch.tri(at(-lu/2,s0,y1),at(-lu/2,s1,y1),at(-lu/2,s0,y1+rh3),wallColor);
        wallBatch.tri(at(lu/2,s0,y1),at(lu/2,s1,y1),at(lu/2,s0,y1+rh3),wallColor);
      }
    }else{ // flat / green — parapet + rooftop clutter
      var top=(roof==='green')?hex(pal.roofGreen):hex(pal.roofFlat);
      wallBatch.quad(P3(c[0],y1),P3(c[1],y1),P3(c[2],y1),P3(c[3],y1),top);
      var ph=1.5,pt=0.6,parC=wallColor.clone().multiplyScalar(0.92);
      for(var pi2=0;pi2<4;pi2++){
        var pa=c[pi2],pb2=c[(pi2+1)%4];
        var pex=pb2[0]-pa[0],pez=pb2[1]-pa[1],pel=Math.hypot(pex,pez)||1;
        var pnx=-pez/pel*pt,pnz=pex/pel*pt;
        wallBatch.quad([pa[0]+pnx,y1,pa[1]+pnz],[pa[0]-pnx,y1,pa[1]-pnz],[pb2[0]-pnx,y1,pb2[1]-pnz],[pb2[0]+pnx,y1,pb2[1]+pnz],parC);
        wallBatch.quad([pa[0]+pnx,y1,pa[1]+pnz],[pb2[0]+pnx,y1,pb2[1]+pnz],[pb2[0]+pnx,y1+ph,pb2[1]+pnz],[pa[0]+pnx,y1+ph,pa[1]+pnz],parC);
      }
      var area=dist(c[0],c[1])*dist(c[1],c[2]);
      if(area>260&&rng()<0.85){
        // AC units / vents
        var nBox=1+Math.floor(rng()*3);
        for(var bi=0;bi<nBox;bi++){
          var bx=ccx+(rng()-0.5)*wdt*0.55,bz=ccz+(rng()-0.5)*wdt*0.55;
          var bs=1.4+rng()*1.4;
          var bc2=new THREE.Color(0x9aa2a8).multiplyScalar(0.85+rng()*0.3);
          wallBatch.quad([bx-bs/2,y1,bz-bs/2],[bx+bs/2,y1,bz-bs/2],[bx+bs/2,y1+1.3,bz-bs/2],[bx-bs/2,y1+1.3,bz-bs/2],bc2);
          wallBatch.quad([bx-bs/2,y1+1.3,bz-bs/2],[bx+bs/2,y1+1.3,bz-bs/2],[bx+bs/2,y1+1.3,bz+bs/2],[bx-bs/2,y1+1.3,bz+bs/2],bc2);
        }
        if(rng()<0.45)tankXf.push({x:ccx+(rng()-0.5)*wdt*0.4,y:y1,z:ccz+(rng()-0.5)*wdt*0.4,s:1.6+rng()*1.2});
      }
    }
  }

  /* ---------- the designed city ---------- */
  var volCount=0;
  try{
    for(var bi=0;bi<W.blocks.buildings.length;bi++){
      var b=W.blocks.buildings[bi];
      var arch=b.architecture;
      if(!arch||!arch.volumes||!arch.volumes.length)continue;
      var wall=shadeTo(pal,(typeof b.shade==='number'?b.shade:0.5));
      var commercial=!!(arch.commercial||b.kind==='shop'||b.kind==='mixed');
      for(var vi=0;vi<arch.volumes.length;vi++){addVolume(arch.volumes[vi],wall,commercial);volCount++;}
    }
  }catch(e){}

  /* ---------- infill: build on empty buildable parcels ---------- */
  var infill=0;
  try{
    var C=W.conditions;
    if(C&&C.parcels&&C.parcels.length){
      var cands=shuffle(C.parcels.filter(function(q){return q.buildingId==null;}),rng);
      for(var qi=0;qi<cands.length&&infill<700;qi++){
        var q=cands[qi];
        var ring=q.rings&&q.rings[0];
        if(!ring||ring.length<4)continue;
        var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
        for(var ri=0;ri<ring.length;ri++){var rp=ring[ri];if(rp.x<x0)x0=rp.x;if(rp.y<y0)y0=rp.y;if(rp.x>x1)x1=rp.x;if(rp.y>y1)y1=rp.y;}
        var pw=x1-x0,pd=y1-y0,area=pw*pd;
        if(area<420||area>42000||pw<9||pd<9)continue;
        var kxx=Math.floor(((x0+x1)/2)/C.cell),kyy=Math.floor(((y0+y1)/2)/C.cell);
        if(kxx<0||kyy<0||kxx>=C.w||kyy>=C.h)continue;
        var fl=C.flags[kyy*C.w+kxx];
        if(fl&15)continue; // road / water / steep / reserved park / edge
        if(rng()>0.78)continue;
        // shrink inside the parcel
        var m=5+Math.min(8,pw*0.08);
        var plan=[{x:x0+m,y:y0+m},{x:x1-m,y:y0+m},{x:x1-m,y:y1-m},{x:x0+m,y:y1-m}];
        var arch2=pick(rng,['house','house','shop','apart','apart','ware']);
        var wall2=shadeTo(pal,rng());
        var vol;
        if(arch2==='house'){
          vol={plan:plan,z0:0,z1:3+rng()*1.6,roof:'gable',ridge:1.6+rng()*1.2,warmRoof:rng()<0.6};
        }else if(arch2==='shop'){
          vol={plan:plan,z0:0,z1:3.4+rng()*1.2,roof:'flat',warmRoof:false};
        }else if(arch2==='apart'){
          vol={plan:plan,z0:0,z1:7+rng()*7,roof:rng()<0.5?'flat':'hip',ridge:2,warmRoof:rng()<0.4};
        }else{
          vol={plan:plan,z0:0,z1:4+rng()*2,roof:'sawtooth',ridge:1.8,warmRoof:false};
        }
        addVolume(vol,wall2,arch2==='shop');
        volCount++;infill++;
      }
    }
  }catch(e){/* infill is bonus */}

  if(!wallBatch.empty){
    var bm=wallBatch.mesh({roughness:0.85});
    bm.castShadow=true;bm.receiveShadow=true;
    group.add(bm);
    disposables.push(function(){bm.geometry.dispose();bm.material.dispose();});
  }

  /* ---------- windows: one instanced mesh, glows at night ---------- */
  var winMesh=null,winMat=null;
  var winDay=new THREE.Color(0x2b3a44),winNight=new THREE.Color(0xffc46a),
      winStoreDay=new THREE.Color(0x9fc4d4),winStoreNight=new THREE.Color(0xffe2a8);
  var lastNk=-1;
  if(winXf.length){
    var wg=new THREE.PlaneGeometry(1,1);
    winMat=new THREE.MeshBasicMaterial({toneMapped:false});
    winMesh=new THREE.InstancedMesh(wg,winMat,winXf.length);
    var dummy=new THREE.Object3D();
    for(var wii=0;wii<winXf.length;wii++){
      var wn=winXf[wii];
      dummy.position.set(wn.x,wn.y,wn.z);
      dummy.rotation.set(0,wn.yaw,0);
      dummy.scale.set(wn.w,wn.h,1);
      dummy.updateMatrix();
      winMesh.setMatrixAt(wii,dummy.matrix);
      winMesh.setColorAt(wii,winDay);
    }
    winMesh.instanceMatrix.needsUpdate=true;
    winMesh.instanceColor.needsUpdate=true;
    winMesh.renderOrder=4;
    group.add(winMesh);
    disposables.push(function(){wg.dispose();winMat.dispose();});
  }
  var _wc=new THREE.Color();
  function setNight(nk){
    if(!winMesh||Math.abs(nk-lastNk)<0.12)return;
    lastNk=nk;
    for(var i=0;i<winXf.length;i++){
      var wn2=winXf[i];
      var lit=winLit[i]<(0.25+nk*0.6);
      if(wn2.store){
        _wc.copy(winStoreDay).lerp(winStoreNight,lit?nk:0);
      }else{
        _wc.copy(winDay).lerp(winNight,lit?nk*0.95:0);
      }
      winMesh.setColorAt(i,_wc);
    }
    winMesh.instanceColor.needsUpdate=true;
  }
  setNight(0);

  /* ---------- rooftop water tanks (instanced cylinders) ---------- */
  if(tankXf.length){
    var tg=new THREE.CylinderGeometry(1,1,1.6,10);
    tg.translate(0,0.8,0);
    var tm=new THREE.MeshStandardMaterial({color:0x8a7a5c,roughness:0.9});
    var tanks=new THREE.InstancedMesh(tg,tm,tankXf.length);
    var dummy2=new THREE.Object3D();
    tankXf.forEach(function(tk,i){
      dummy2.position.set(tk.x,tk.y,tk.z);
      dummy2.scale.set(tk.s,1.4,tk.s);
      dummy2.rotation.set(0,rng()*3.14,0);
      dummy2.updateMatrix();
      tanks.setMatrixAt(i,dummy2.matrix);
    });
    tanks.instanceMatrix.needsUpdate=true;
    tanks.castShadow=true;
    group.add(tanks);
    disposables.push(function(){tg.dispose();tm.dispose();});
  }

  return {
    group:group,
    setNight:setNight,
    counts:{volumes:volCount,infill:infill,windows:winXf.length,tanks:tankXf.length},
    dispose:function(){
      group.traverse(function(o){
        if(o.geometry)o.geometry.dispose();
        if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});
      });
      disposables.forEach(function(d){try{d();}catch(e){}});
    }
  };
}
