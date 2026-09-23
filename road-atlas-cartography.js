/* Road Atlas Cartography 1.0.0 — beauty pass for water, parks, buildings, plus canals.
 * Hooks into the conditions-adapted renderer via unique source anchors (no edits
 * to the immutable V1 baseline, no changes to hash-guarded first-party files).
 * All randomness comes from makeRng(W.seed,'cartography') / the existing named
 * streams, so the same seed always paints the same map.
 * This is illustrative procedural cartography, not a certified design.
 */
(function(){
'use strict';
var VERSION='1.0.0';

function clamp(x,a,b){return x<a?a:x>b?b:x;}

/* ---------- tiny geometry ---------- */
function centroid(pts){var x=0,y=0;for(var i=0;i<pts.length;i++){x+=pts[i].x;y+=pts[i].y;}return{x:x/pts.length,y:y/pts.length};}
function maxDist(pts,c){var m=0;for(var i=0;i<pts.length;i++){var d=Math.hypot(pts[i].x-c.x,pts[i].y-c.y);if(d>m)m=d;}return m;}
function polyPath(ctx,pts){ctx.beginPath();for(var i=0;i<pts.length;i++){if(i)ctx.lineTo(pts[i].x,pts[i].y);else ctx.moveTo(pts[i].x,pts[i].y);}ctx.closePath();}
function scalePoly(pts,c,k){return pts.map(function(p){return{x:c.x+(p.x-c.x)*k,y:c.y+(p.y-c.y)*k};});}
function pointInPoly(x,y,pts){var inside=false;for(var i=0,j=pts.length-1;i<pts.length;j=i++){var xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}return inside;}
function segDist(px,py,ax,ay,bx,by){var dx=bx-ax,dy=by-ay,L2=dx*dx+dy*dy||1e-9;var t=clamp(((px-ax)*dx+(py-ay)*dy)/L2,0,1);return Math.hypot(px-(ax+dx*t),py-(ay+dy*t));}
function distToPoly(x,y,pts,step){var best=1e9;step=step||1;for(var i=0;i<pts.length-1;i+=step){var d=segDist(x,y,pts[i].x,pts[i].y,pts[i+1].x,pts[i+1].y);if(d<best)best=d;}return best;}
function shade(hex,amt){var m=/^#([0-9a-f]{6})$/i.exec(hex||'');if(!m)return null;var n=parseInt(m[1],16),r=clamp((n>>16)+amt,0,255),g=clamp(((n>>8)&255)+amt,0,255),b=clamp((n&255)+amt,0,255);return '#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');}
function pathRingsLocal(ctx,rings){rings.forEach(function(ring){for(var i=0;i<ring.length;i++){if(i)ctx.lineTo(ring[i].x,ring[i].y);else ctx.moveTo(ring[i].x,ring[i].y);}ctx.closePath();});}

/* Organic closed blob: n-gon with layered sine perturbation, optionally rotated. */
function blobPoly(cx,cy,rx,ry,rot,rng,n){
  n=n||30;var s1=rng()*6.2832,s2=rng()*6.2832,s3=rng()*6.2832,pts=[];
  var cr=Math.cos(rot),sr=Math.sin(rot);
  for(var i=0;i<n;i++){
    var a=i/n*6.2832;
    var k=1+0.22*Math.sin(a*3+s1)+0.12*Math.sin(a*5+s2)+0.06*Math.sin(a*8+s3);
    var x=Math.cos(a)*rx*k,y=Math.sin(a)*ry*k;
    pts.push({x:cx+x*cr-y*sr,y:cy+x*sr+y*cr});
  }
  return pts;
}

/* ---------- one-time per-world preparation ---------- */
function ensure(W){
  if(W._carto)return W._carto;
  var F=W.F,seed=W.seed||'RA1',rng=makeRng(seed,'cartography');
  var C={W:W,ribbon:null,lakes:[],parks:[],canals:[]};

  /* River ribbon: resampled centerline + smoothly varying width. */
  if(F.river&&F.river.length>1&&typeof resample==='function'){
    var rp=resample(F.river,9),base=F.riverW||24;
    var p1=rng()*6.2832,p2=rng()*6.2832,p3=rng()*6.2832;
    var w=rp.map(function(pt,i){
      var t=rp.length<2?0:i/(rp.length-1);
      var n=Math.sin(t*9.1+p1)*0.5+Math.sin(t*23.7+p2)*0.3+Math.sin(t*4.3+p3)*0.2;
      var taper=0.70+0.30*Math.sin(t*Math.PI); /* ease off at the map edges */
      return Math.max(6,base*(0.94+0.24*n)*taper);
    });
    C.ribbon={pts:rp,w:w};
  }

  /* Lake shorelines: organic blobs in world coordinates. */
  (F.lakes||[]).forEach(function(L){
    C.lakes.push({L:L,blob:blobPoly(L.x,L.y,L.rx,L.ry,L.rot||0,rng,34)});
  });

  /* Park shapes: smooth ring if the parcel model has one, blob fallback. */
  (W.blocks.parks||[]).forEach(function(pk){
    var blob=null;
    if(pk.rings&&pk.rings.length){
      var best=pk.rings[0],ba=0;
      pk.rings.forEach(function(r){var a=0;for(var i=0;i<r.length;i++){var q=r[(i+1)%r.length];a+=(r[i].x*q.y-q.x*r[i].y);}a=Math.abs(a/2);if(a>ba){ba=a;best=r;}});
      blob=best.map(function(p){return{x:p.x,y:p.y};});
      if(typeof chaikin==='function'&&blob.length>8)blob=chaikin(chaikin(blob,1),1);
    }else if(pk.cells&&pk.cells.length){
      var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
      pk.cells.forEach(function(c){var x=(c%64)*32,y=((c/64)|0)*32;if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;});
      blob=blobPoly((x0+x1)/2+16,(y0+y1)/2+16,(x1-x0)/2+34,(y1-y0)/2+34,0,rng,28);
    }
    C.parks.push({pk:pk,blob:blob});
  });

  /* Canals: the canal-metropolis foundation. Narrow, deliberate waterways. */
  C.canals=genCanals(W,F,rng);
  if(C.canals.length){
    addCanalBridges(W,C.canals);
    var _wd=F.waterDist;
    F.waterDist=function(x,y){
      var d=_wd(x,y);
      for(var i=0;i<C.canals.length;i++){var c=C.canals[i],dd=distToPoly(x,y,c.pts,2)-c.w/2;if(dd<d)d=dd;}
      return d;
    };
  }

  W._carto=C;Carto._W=W;
  if(!Carto._expWrapped&&window.RoadAtlasPipeline&&RoadAtlasPipeline.exportData){
    var _e=RoadAtlasPipeline.exportData;
    RoadAtlasPipeline.exportData=function(){var d=_e();if(d&&Carto._W){try{d.waterways=Carto.exportWaterways(Carto._W);}catch(x){}}return d;};
    Carto._expWrapped=true;
  }
  return C;
}

function tryCanal(W,F,rng){
  var WW=(typeof WORLD_W!=='undefined')?WORLD_W:1600,WH=(typeof WORLD_H!=='undefined')?WORLD_H:1000;
  var river=(F.river&&F.river.length>1)?F.river:null;
  var fromRiver=river&&rng()<0.55,p,ang;
  if(fromRiver){
    var rp0=river[Math.floor(rng()*river.length)];p={x:rp0.x,y:rp0.y};ang=rng()*6.2832;
  }else{
    var edge=Math.floor(rng()*4);
    p=edge===0?{x:60+rng()*(WW-120),y:50}:edge===1?{x:60+rng()*(WW-120),y:WH-50}:edge===2?{x:50,y:60+rng()*(WH-120)}:{x:WW-50,y:60+rng()*(WH-120)};
    ang=(edge===0?Math.PI/2:edge===1?-Math.PI/2:edge===2?0:Math.PI)+(rng()-0.5)*0.6;
  }
  var pts=[],wander=rng()*6.2832,steps=36+Math.floor(rng()*22),stepLen=30;
  for(var i=0;i<steps;i++){
    pts.push({x:p.x,y:p.y});
    ang+=Math.sin(i*0.30+wander)*0.15+(rng()-0.5)*0.20; /* deliberate, gentle meander */
    p={x:p.x+Math.cos(ang)*stepLen,y:p.y+Math.sin(ang)*stepLen};
    if(p.x<70||p.x>WW-70)ang=Math.PI-ang;
    if(p.y<70||p.y>WH-70)ang=-ang;
    p.x=clamp(p.x,50,WW-50);p.y=clamp(p.y,50,WH-50);
  }
  if(typeof chaikin==='function')pts=chaikin(pts,2);
  if(typeof resample==='function')pts=resample(pts,10);
  var w=10+rng()*5;
  /* validation */
  for(var li=0;li<(F.lakes||[]).length;li++){var L=F.lakes[li];
    if(distToPoly(L.x,L.y,pts,3)<Math.max(L.rx,L.ry)+70)return null;}
  if(river){
    var skip=fromRiver?Math.floor(pts.length*0.25):0,hit=false;
    for(var k=skip;k<pts.length;k+=2){if(F.waterDist(pts[k].x,pts[k].y)<40){hit=true;break;}}
    if(hit)return null;
  }
  /* reject canals that run alongside a road instead of crossing it */
  var run=0,worst=0;
  for(var m=0;m<pts.length;m+=2){
    var nearRoad=false;
    for(var r=0;r<W.roads.length&&!nearRoad;r++){if(distToPoly(pts[m].x,pts[m].y,W.roads[r].pts,4)<30)nearRoad=true;}
    if(nearRoad){run+=2;if(run>worst)worst=run;}else run=0;
  }
  if(worst>80)return null; /* ~160 world units hugging a road: redraw */
  /* canal clears its own corridor through blocks (very canal-metropolis) */
  var cleared=0;
  for(var b=0;b<W.blocks.buildings.length;b++){var bd=W.blocks.buildings[b];
    if(distToPoly(bd.cx,bd.cy,pts,3)<w/2+16){cleared++;if(cleared>48)return null;}}
  return {pts:pts,w:w,fromRiver:!!fromRiver,cleared:cleared};
}

function genCanals(W,F,rng){
  var canals=[],tries=0,target=2+Math.floor(rng()*2);
  while(canals.length<target&&tries<14){
    tries++;
    var c=tryCanal(W,F,rng);
    if(!c)continue;
    var ok=true;
    for(var i=0;i<canals.length;i++){
      if(distToPoly(canals[i].pts[0].x,canals[i].pts[0].y,c.pts,3)<150){ok=false;break;}
      if(distToPoly(c.pts[0].x,c.pts[0].y,canals[i].pts,3)<150){ok=false;break;}
    }
    if(ok)canals.push(c);
  }
  return canals;
}

/* Bridge decks where roads cross canals: append runs to r.bridges (stage 6 draws them). */
function addCanalBridges(W,canals){
  W.roads.forEach(function(r){
    if(!r.pts||r.pts.length<2)return;
    canals.forEach(function(c){
      var cur=null;
      for(var i=0;i<r.pts.length;i++){
        var wet=distToPoly(r.pts[i].x,r.pts[i].y,c.pts,2)<c.w/2+3;
        if(wet){if(!cur)cur={a:i,b:i};else cur.b=i;}
        else if(cur){pushRun(r,cur);cur=null;}
      }
      if(cur)pushRun(r,cur);
    });
  });
  function pushRun(r,run){
    var a=Math.max(0,run.a-3),b=Math.min(r.pts.length-1,run.b+3),pts=[];
    for(var i=a;i<=b;i++)pts.push(r.pts[i]);
    if(pts.length>1){r.bridges=r.bridges||[];r.bridges.push(pts);}
  }
}

/* ---------- painters (called from hooks inside the adapted renderer) ---------- */
function drawWater(ctx,W,T){
  var C=ensure(W);
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  C.canals.forEach(function(c){drawCanal(ctx,c,T);});
  if(C.ribbon)drawRibbon(ctx,C.ribbon,T);
  C.lakes.forEach(function(o){drawLake(ctx,o,T);});
  ctx.restore();
}

function ribbonPath(ctx,pts,w,mul,add){
  var n=pts.length,left=[],right=[],i,p,q,q0,dx,dy,L,nx,ny;
  for(i=0;i<n;i++){
    p=pts[i];q=pts[Math.min(n-1,i+1)];q0=pts[Math.max(0,i-1)];
    dx=q.x-q0.x;dy=q.y-q0.y;L=Math.hypot(dx,dy)||1;nx=-dy/L;ny=dx/L;
    var hw=w[i]/2*mul+add;
    left.push({x:p.x+nx*hw,y:p.y+ny*hw});right.push({x:p.x-nx*hw,y:p.y-ny*hw});
  }
  ctx.beginPath();
  for(i=0;i<n;i++){if(i)ctx.lineTo(left[i].x,left[i].y);else ctx.moveTo(left[i].x,left[i].y);}
  for(i=n-1;i>=0;i--)ctx.lineTo(right[i].x,right[i].y);
  ctx.closePath();
}

function drawRibbon(ctx,R,T){
  var pts=R.pts,n=pts.length,i;
  /* soft bank */
  ribbonPath(ctx,pts,R.w,1,7);ctx.fillStyle=T.waterDeep;ctx.globalAlpha=0.42;ctx.fill();ctx.globalAlpha=1;
  /* body */
  ribbonPath(ctx,pts,R.w,1,0);ctx.fillStyle=T.water;ctx.fill();
  /* inner light: depth */
  ribbonPath(ctx,pts,R.w,0.55,0);ctx.fillStyle='rgba(255,255,255,0.16)';ctx.fill();
  /* bank line */
  ribbonPath(ctx,pts,R.w,1,0);ctx.strokeStyle=T.waterDeep;ctx.globalAlpha=0.7;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;
  /* flow lines */
  ctx.strokeStyle=T.waterLine;ctx.lineWidth=1.6;ctx.globalAlpha=0.5;
  [-0.22,0.22].forEach(function(off){
    ctx.beginPath();
    for(i=0;i<n;i++){
      var p=pts[i],q=pts[Math.min(n-1,i+1)],q0=pts[Math.max(0,i-1)];
      var dx=q.x-q0.x,dy=q.y-q0.y,L=Math.hypot(dx,dy)||1;
      var ox=p.x+(-dy/L)*R.w[i]*off,oy=p.y+(dx/L)*R.w[i]*off;
      if(i)ctx.lineTo(ox,oy);else ctx.moveTo(ox,oy);
    }
    ctx.stroke();
  });
  ctx.globalAlpha=1;
}

function drawLake(ctx,o,T){
  var blob=o.blob;if(!blob||blob.length<3)return;
  var c=centroid(blob),r=maxDist(blob,c);
  ctx.save();ctx.lineJoin='round';
  polyPath(ctx,scalePoly(blob,c,1.14));ctx.fillStyle=T.waterDeep;ctx.globalAlpha=0.38;ctx.fill();ctx.globalAlpha=1;
  var g=ctx.createRadialGradient(c.x,c.y,4,c.x,c.y,Math.max(8,r));
  g.addColorStop(0,T.water);g.addColorStop(1,T.waterDeep);
  polyPath(ctx,blob);ctx.fillStyle=g;ctx.fill();
  polyPath(ctx,scalePoly(blob,c,0.55));ctx.fillStyle='rgba(255,255,255,0.14)';ctx.fill();
  polyPath(ctx,blob);ctx.strokeStyle=T.waterDeep;ctx.globalAlpha=0.75;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;
  ctx.strokeStyle=T.waterLine;ctx.globalAlpha=0.55;ctx.lineWidth=1.4;
  polyPath(ctx,scalePoly(blob,c,0.68));ctx.stroke();
  polyPath(ctx,scalePoly(blob,c,0.40));ctx.stroke();
  ctx.globalAlpha=1;ctx.restore();
}

function drawCanal(ctx,c,T){
  var bank=(typeof P!=='undefined'&&P.theme===1)?'#42514f':(P&&P.theme===2)?'#7fa8c0':'#c9bfa2';
  ctx.strokeStyle=bank;ctx.lineWidth=c.w+6;strokePts(ctx,c.pts);
  ctx.strokeStyle=T.water;ctx.lineWidth=c.w;strokePts(ctx,c.pts);
  ctx.strokeStyle=T.waterLine;ctx.globalAlpha=0.6;ctx.lineWidth=1.2;strokePts(ctx,c.pts);ctx.globalAlpha=1;
  if(c.fromRiver&&c.pts.length){var m=c.pts[0];ctx.fillStyle=T.water;ctx.beginPath();ctx.arc(m.x,m.y,c.w*0.62,0,6.2832);ctx.fill();}
}

function drawParks(ctx,W,T){
  var C=ensure(W),seed=W.seed||'RA1',prng=makeRng(seed,'trees');
  ctx.save();ctx.lineJoin='round';
  C.parks.forEach(function(o){
    var blob=o.blob;if(!blob||blob.length<3)return;
    var c=centroid(blob),r=maxDist(blob,c);
    var pkFill=shade(T.park,10),g=null;
    if(pkFill){g=ctx.createRadialGradient(c.x,c.y,Math.max(4,r*0.1),c.x,c.y,Math.max(8,r));g.addColorStop(0,pkFill);g.addColorStop(1,T.park);}
    polyPath(ctx,blob);ctx.fillStyle=g||T.park;ctx.fill();
    var edge=shade(T.park,-30);
    polyPath(ctx,blob);ctx.strokeStyle=edge||T.park;ctx.globalAlpha=0.55;ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1;
    /* tree dots, sampled inside the organic shape */
    var cells=(o.pk.cells||[]),n=Math.min(60,Math.floor(cells.length/28));
    var x0=1e9,y0=1e9,x1=-1e9,y1=-1e9,bi;
    for(bi=0;bi<blob.length;bi++){var bp=blob[bi];if(bp.x<x0)x0=bp.x;if(bp.y<y0)y0=bp.y;if(bp.x>x1)x1=bp.x;if(bp.y>y1)y1=bp.y;}
    ctx.fillStyle=T.tree;
    var placed=0,guard=0;
    while(placed<n&&guard<n*40){
      guard++;
      var x=x0+prng()*(x1-x0),y=y0+prng()*(y1-y0);
      if(!pointInPoly(x,y,blob))continue;
      ctx.beginPath();ctx.arc(x,y,2.5+prng()*2.5,0,6.2832);ctx.fill();
      placed++;
    }
  });
  ctx.restore();
}

/* Refined building paint: same massing the city built, crisper finish. */
function drawBuildings(ctx,W,T){
  W.blocks.buildings.forEach(function(b){
    if(W.urban&&W.urban.enabled&&b.architecture&&window.RoadAtlasUrban){RoadAtlasUrban.drawBuilding(ctx,W,b);return;}
    var col=b.kind==='industrial'?T.ind:T.bCols[b.shade%T.bCols.length];
    var hb=clamp(b.hgt/38,0,1);
    var parts=b.sub||[{dx:0,dy:0,w:b.w,h:b.h}];
    ctx.save();
    if(W.conditions&&b.parcelId!=null){var P2=W.conditions.parcels[b.parcelId];if(P2&&P2.rings){pathRingsLocal(ctx,P2.rings);ctx.clip('evenodd');}}
    ctx.translate(b.cx,b.cy);ctx.rotate(b.ang);
    var sox=3+b.hgt*0.42,soy=4+b.hgt*0.34,pi,q;
    ctx.fillStyle=T.bShadow;
    for(pi=0;pi<parts.length;pi++){q=parts[pi];ctx.fillRect(q.dx-q.w/2+sox,q.dy-q.h/2+soy,q.w,q.h);}
    ctx.fillStyle=col;
    for(pi=0;pi<parts.length;pi++){q=parts[pi];ctx.fillRect(q.dx-q.w/2,q.dy-q.h/2,q.w,q.h);}
    /* plinth: grounds each mass so geometry reads solid */
    ctx.strokeStyle='rgba(0,0,0,0.30)';ctx.lineWidth=1.5;
    for(pi=0;pi<parts.length;pi++){q=parts[pi];ctx.strokeRect(q.dx-q.w/2,q.dy-q.h/2,q.w,q.h);}
    var ox=-b.hgt*0.42,oy=-b.hgt*0.42;
    ctx.fillStyle=T.bTop;
    for(pi=0;pi<parts.length;pi++){q=parts[pi];ctx.fillRect(q.dx-q.w/2+ox,q.dy-q.h/2+oy,q.w,q.h);}
    if(hb>0.04){
      ctx.fillStyle='rgba(255,255,255,'+(hb*0.38).toFixed(3)+')';
      for(pi=0;pi<parts.length;pi++){q=parts[pi];ctx.fillRect(q.dx-q.w/2+ox,q.dy-q.h/2+oy,q.w,q.h);}
    }
    /* crisp roof edge */
    ctx.strokeStyle='rgba(255,255,255,0.30)';ctx.lineWidth=1;
    for(pi=0;pi<parts.length;pi++){q=parts[pi];ctx.strokeRect(q.dx-q.w/2+ox,q.dy-q.h/2+oy,q.w,q.h);}
    ctx.strokeStyle=T.bShadow;ctx.lineWidth=1.4;
    for(pi=0;pi<parts.length;pi++){q=parts[pi];ctx.strokeRect(q.dx-q.w/2+ox,q.dy-q.h/2+oy,q.w,q.h);}
    ctx.restore();
  });
}

/* ---------- source hook: rewrite the adapted painter via unique anchors ---------- */
function rewritePaint(src){
  function rep(anchor,insert){
    var parts=src.split(anchor);
    if(parts.length!==2)throw new Error('carto hook '+(parts.length<2?'missed':'ambiguous')+': '+anchor.slice(0,48));
    return parts[0]+anchor+insert+parts[1];
  }
  function repBefore(anchor,insert){
    var parts=src.split(anchor);
    if(parts.length!==2)throw new Error('carto hook '+(parts.length<2?'missed':'ambiguous')+': '+anchor.slice(0,48));
    return parts[0]+insert+anchor+parts[1];
  }
  src=rep('\n  // 2. water\n','  if(window.RoadAtlasCarto){RoadAtlasCarto.drawWater(ctx,W,T);}else{');
  src=repBefore('\n  // 3. parks','  }\n');
  src=rep('\n  // 3. parks (batched rects — one fill per theme pass)\n','  if(window.RoadAtlasCarto){RoadAtlasCarto.drawParks(ctx,W,T);}else{');
  src=repBefore('\n  // 3b. rural fringe','  }\n');
  src=rep('\n  // 4. buildings: shadow → body → pseudo-3D top.\n','  if(window.RoadAtlasCarto){RoadAtlasCarto.drawBuildings(ctx,W,T);}else{');
  src=repBefore('\n  // 5. roads','  }\n');
  return src;
}

/* Insert the paint rewrite by wrapping the adapt() call that builds the adapted
 * painter: rewritePaint transforms the adapted source string before it is
 * embedded via the Function constructor. No toString round-trip needed. */
function transformConditions(text){
  var open="\"use strict\";return ('+adapt(originalRender,1849429006,[";
  var close="])+');')(view,drawTopo,pathRings,ruralAllowed,rect);";
  if(text.indexOf(open)<0)throw new Error('carto: conditions open anchor not found');
  if(text.indexOf(open,text.indexOf(open)+open.length)>=0)throw new Error('carto: conditions open anchor ambiguous');
  if(text.indexOf(close)<0)throw new Error('carto: conditions close anchor not found');
  if(text.indexOf(close,text.indexOf(close)+close.length)>=0)throw new Error('carto: conditions close anchor ambiguous');
  text=text.replace(open,"\"use strict\";return ('+RoadAtlasCarto.rewritePaint(adapt(originalRender,1849429006,[");
  text=text.replace(close,"]))+');')(view,drawTopo,pathRings,ruralAllowed,rect);");
  return text;
}

function exportWaterways(W){
  var C=W._carto||ensure(W),F=W.F;
  return {
    river:C.ribbon?{points:C.ribbon.pts,widths:C.ribbon.w.map(function(x){return +x.toFixed(2);})}:null,
    lakes:C.lakes.map(function(o){return{x:+o.L.x.toFixed(1),y:+o.L.y.toFixed(1),shoreline:o.blob.map(function(p){return[+p.x.toFixed(1),+p.y.toFixed(1)];})};}),
    canals:C.canals.map(function(c){return{points:c.pts.map(function(p){return[+p.x.toFixed(1),+p.y.toFixed(1)];}),width:+c.w.toFixed(2),fromRiver:c.fromRiver};}),
    parks:C.parks.map(function(o){return{boundary:o.blob?o.blob.map(function(p){return[+p.x.toFixed(1),+p.y.toFixed(1)];}):null,cells:(o.pk.cells||[]).length};})
  };
}

var Carto={
  version:VERSION,
  transformConditions:transformConditions,
  rewritePaint:rewritePaint,
  ensure:ensure,
  drawWater:drawWater,
  drawParks:drawParks,
  drawBuildings:drawBuildings,
  exportWaterways:exportWaterways,
  _W:null,_expWrapped:false
};
window.RoadAtlasCarto=Carto;
})();
