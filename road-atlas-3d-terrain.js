/* Road Atlas 3D — terrain 2.0.0
 * Topo-accurate ground: a heightfield displaced by the SAME elevation raster
 * the 2D map draws its contour lines from (W.conditions.topography).
 * The river and canals carve real valleys; water surfaces follow the
 * terrain down. Parks get soft green draping. Everything sits on the
 * heightfield so roads, buildings and trees follow the hills.
 */
import * as THREE from 'three';
import { Batch, ribbon, flatPoly, hex, smoothPath, makePointIndex } from './road-atlas-3d-core.js?v=2.0.0';

export function buildTerrain(CITY){
  var W=CITY.W, pal=CITY.pal, bounds=CITY.bounds, ground=CITY.ground;
  var group=new THREE.Group();
  var rng=CITY.rng;
  var cx=(bounds.x0+bounds.x1)/2, cz=(bounds.y0+bounds.y1)/2;

  /* ---------- water polylines (for carving + surface) ---------- */
  var waterLines=[];
  try{
    var carto=W._carto;
    if(carto){
      if(carto.ribbon&&carto.ribbon.pts&&carto.ribbon.pts.length>1)
        waterLines.push({pts:smoothPath(carto.ribbon.pts),w:carto.ribbon.w});
      for(var ci=0;ci<(carto.canals||[]).length;ci++){
        var c=carto.canals[ci];
        if(c.pts&&c.pts.length>1)waterLines.push({pts:smoothPath(c.pts),w:c.w||8});
      }
    }
  }catch(e){/* no carving */}
  // flattened point set for the spatial index
  var waterPts=[];
  waterLines.forEach(function(wl){
    wl.pts.forEach(function(p){ waterPts.push({x:p.x,y:p.y,w:wl.w}); });
  });
  var waterIdx=waterPts.length?makePointIndex(waterPts,50):null;

  function carve(x,y){
    // how far the terrain should dip near water (river valley)
    if(!waterIdx)return 0;
    var near=waterIdx.near(x,y,90);
    var dip=0;
    for(var i=0;i<near.length;i++){
      var p=near[i];
      var d=Math.hypot(p.x-x,p.y-y);
      var half=((Array.isArray(p.w)?8:p.w)||8)/2+14;
      if(d<half+70){
        var f=1-Math.min(1,d/(half+70));
        var local=10+half*0.35;
        dip=Math.max(dip,local*f*f);
      }
    }
    return dip;
  }

  function groundH(x,y){
    return ground.height(x,y)-carve(x,y);
  }
  CITY.groundH=groundH;      // terrain height incl. carving — the city floor
  CITY.waterLines=waterLines;

  /* ---------- heightfield mesh ---------- */
  var SEG=170;
  var gw=(bounds.x1-bounds.x0)+700, gd=(bounds.y1-bounds.y0)+700;
  var geo=new THREE.PlaneGeometry(gw,gd,SEG,SEG);
  geo.rotateX(-Math.PI/2);
  var posA=geo.getAttribute('position');
  var colors=new Float32Array(posA.count*3);
  var cGrassLow=hex(pal.park), cGround=hex(pal.ground),
      cHigh=new THREE.Color(pal.ground).multiplyScalar(1.18),
      cSlope=new THREE.Color(pal.ground).multiplyScalar(0.72),
      cSand=new THREE.Color(pal.ground).lerp(new THREE.Color(0xd8c690),0.5);
  var tmp=new THREE.Color();
  for(var vi=0;vi<posA.count;vi++){
    var wx=cx+posA.getX(vi), wz=cz+posA.getZ(vi);
    var h=groundH(wx,wz);
    posA.setY(vi,h);
    // color: lowlands green-gold, slopes brown, highlands pale
    var t=Math.max(0,Math.min(1,h/ground.relief));
    var sl=ground.slopeAt(wx,wz);
    tmp.copy(cGround).lerp(cGrassLow,Math.max(0,0.55-t*0.9));
    tmp.lerp(cHigh,Math.max(0,(t-0.45)*1.4));
    tmp.lerp(cSlope,Math.min(1,sl*1.6)*0.7);
    if(h<3.2)tmp.lerp(cSand,0.6); // shoreline
    colors[vi*3]=tmp.r;colors[vi*3+1]=tmp.g;colors[vi*3+2]=tmp.b;
  }
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  geo.computeVertexNormals();
  var terrain=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0}));
  terrain.position.set(cx,0,cz);
  terrain.receiveShadow=true;
  group.add(terrain);

  /* ---------- water surfaces (follow terrain down into the valleys) ---------- */
  var wc=hex(pal.water);
  var waterBatch=new Batch();
  waterLines.forEach(function(wl){
    var w=wl.w;
    ribbon(waterBatch,wl.pts,
      function(i){return ((Array.isArray(w)?w[Math.min(i,w.length-1)]:w)||8)/2;},
      function(i){var p=wl.pts[i];return groundH(p.x,p.y)+0.55;},
      wc);
  });
  try{
    var carto2=W._carto;
    for(var li=0;li<((carto2&&carto2.lakes)||[]).length;li++){
      var l=carto2.lakes[li],pts=l.blob||l.pts||l;
      if(pts&&pts.length>2){
        var lh=groundH(pts[0].x,pts[0].y)+0.55;
        flatPoly(waterBatch,pts,lh,wc);
      }
    }
  }catch(e){}
  if(!waterBatch.empty){
    var wm=waterBatch.mesh({roughness:0.25,metalness:0.15});
    wm.receiveShadow=true;
    group.add(wm);
  }

  /* ---------- parks draped on the hills ---------- */
  try{
    var carto3=W._carto,parkBatch=new Batch(),pc=hex(pal.park);
    for(var pi=0;pi<((carto3&&carto3.parks)||[]).length;pi++){
      var p=carto3.parks[pi];
      if(p.blob&&p.blob.length>2){
        var pb2=new Batch();
        drapePoly(pb2,p.blob,pc);
        if(!pb2.empty){
          var pm=pb2.mesh({roughness:1});
          pm.receiveShadow=true;
          group.add(pm);
        }
      }
    }
  }catch(e){/* parks are decorative */}

  function drapePoly(batch,pts,color){
    if(!pts||pts.length<3)return;
    var shape=new THREE.Shape();
    shape.moveTo(pts[0].x,-pts[0].y);
    for(var i=1;i<pts.length;i++)shape.lineTo(pts[i].x,-pts[i].y);
    shape.closePath();
    var g=new THREE.ShapeGeometry(shape,4);
    g.rotateX(-Math.PI/2);
    var p=g.getAttribute('position'),index=g.getIndex();
    function P(i){var x=p.getX(i),z=p.getZ(i);return [x,groundH(x,z)+0.45,z];}
    if(index){for(var i=0;i<index.count;i+=3)batch.tri(P(index.getX(i)),P(index.getX(i+1)),P(index.getX(i+2)),color);}
    else{for(var j=0;j<p.count;j+=3)batch.tri(P(j),P(j+1),P(j+2),color);}
    g.dispose();
  }

  return {
    group:group,
    dispose:function(){
      group.traverse(function(o){
        if(o.geometry)o.geometry.dispose();
        if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(function(m){m.dispose();});
      });
    }
  };
}
