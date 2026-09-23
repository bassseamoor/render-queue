/* Road Atlas 3D — roads 2.0.0
 * Road ribbons draped on the topo terrain, glowing arterials for night
 * themes, and bridges lifted over the carved river valleys.
 */
import * as THREE from 'three';
import { Batch, ribbon, hex, smoothPath } from './road-atlas-3d-core.js?v=2.0.0';

export function buildRoads(CITY){
  var W=CITY.W, pal=CITY.pal, groundH=CITY.groundH;
  var group=new THREE.Group();
  var disposables=[];

  function roadY(x,y){ return groundH(x,y)+0.9; }

  var roadBatch=new Batch(), artBatch=new Batch();
  var asph=hex(pal.asphalt), artc=hex(pal.arterial);
  for(var ri=0;ri<W.roads.length;ri++){
    var r=W.roads[ri];
    var sp=smoothPath(r.pts);
    var hw=(r.width||8)/2*0.92;
    var yfn=function(x,y){return roadY(x,y);};
    // ribbon() takes y as fn(i) — wrap:
    var pts=sp;
    if(r.cls===2)ribbon(artBatch,pts,hw,function(i){return roadY(pts[i].x,pts[i].y);},artc);
    else ribbon(roadBatch,pts,hw,function(i){return roadY(pts[i].x,pts[i].y);},asph);
  }
  if(!roadBatch.empty){
    var rm=new THREE.Mesh(roadBatch.build(),new THREE.MeshStandardMaterial({
      vertexColors:true,roughness:0.9,side:THREE.DoubleSide,
      emissive:pal.roadGlow,emissiveIntensity:pal.roadGlowInt}));
    rm.receiveShadow=true;
    group.add(rm);
    disposables.push(function(){rm.geometry.dispose();rm.material.dispose();});
  }
  if(!artBatch.empty){
    var am=new THREE.Mesh(artBatch.build(),new THREE.MeshStandardMaterial({
      vertexColors:true,roughness:0.7,side:THREE.DoubleSide,
      emissive:pal.arterialGlow,emissiveIntensity:pal.glowInt}));
    am.receiveShadow=true;
    group.add(am);
    disposables.push(function(){am.geometry.dispose();am.material.dispose();});
  }

  /* bridges — decks lifted above the valley floor */
  var bridgeBatch=new Batch(),bc=hex(pal.bridge);
  var nb=0;
  for(var rj=0;rj<W.roads.length;rj++){
    var r2=W.roads[rj];
    for(var si=0;si<(r2.bridges||[]).length;si++){
      var seg=r2.bridges[si];
      if(!seg||seg.length<2)continue;
      var ssp=smoothPath(seg);
      var top=-1e9;
      for(var vi=0;vi<ssp.length;vi++){var hh=groundH(ssp[vi].x,ssp[vi].y);if(hh>top)top=hh;}
      var deckY=top+4.2;
      ribbon(bridgeBatch,ssp,((r2.width||8)/2)+2.5,function(){return deckY;},bc);
      nb++;
      // piers down to the valley
      for(var pii=0;pii<ssp.length;pii+=6){
        var pp=ssp[pii],gy=groundH(pp.x,pp.y);
        var pierH=deckY-gy;
        if(pierH>2){
          bridgeBatch.quad([pp.x-1.6,gy,pp.y-1.6],[pp.x+1.6,gy,pp.y+1.6],
                           [pp.x+1.6,deckY,pp.y+1.6],[pp.x-1.6,deckY,pp.y-1.6],bc);
        }
      }
    }
  }
  if(!bridgeBatch.empty){
    var brm=new THREE.Mesh(bridgeBatch.build(),new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.8,side:THREE.DoubleSide}));
    brm.castShadow=true;brm.receiveShadow=true;
    group.add(brm);
    disposables.push(function(){brm.geometry.dispose();brm.material.dispose();});
  }

  return {
    group:group,
    roadY:roadY,
    counts:{roads:W.roads.length,bridges:nb},
    dispose:function(){
      group.traverse(function(o){
        if(o.geometry)o.geometry.dispose();
        if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});
      });
      disposables.forEach(function(d){try{d();}catch(e){}});
    }
  };
}
