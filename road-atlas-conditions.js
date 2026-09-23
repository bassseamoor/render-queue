/* Road Atlas Conditions 2.3.0 — terrain-derived parcels and denser district lots.
 * First-party V1 block packer / renderer are retained below, with explicit hooks.
 * Canonical placement boundary: union of full 4-world-unit raster cells, NOT
 * a smoothed outline. Raster-derived rings preserve holes and concavity.
 * Elevation is relative (0..1); slopeIndex = min(1, |gradient| * 900), matching
 * the V1 routing field's normalization. Neither is a surveyed elevation/grade.
 */
(function () {
'use strict';
var VERSION='2.3.0', HALF_DIAG=Math.SQRT2*2, stored={};
try {stored=JSON.parse(localStorage.getItem('ra.conditions.v1')||'{}')||{};} catch(e) {}
var qs=new URLSearchParams(location.search);
function number(q,fallback,lo,hi){var n=Number(q);return q!=null&&q!==''&&Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):fallback;}
var settings={setback:number(qs.get('setback'),3,0,12),slopeLimit:number(qs.get('slopeLimit'),.85,.15,1)};
var view={topo:qs.has('topo')?qs.get('topo')!=='0':stored.topo!==false,interval:number(qs.get('contour'),.02,.01,.10),opacity:number(qs.get('topoOpacity'),.62,.1,1),labels:qs.has('contourLabels')?qs.get('contourLabels')!=='0':stored.labels!==false,blocks:false,parcels:false,buildable:false,slope:false,districts:false,directions:false};
var selected=null, inspecting=false, originalRender=renderWorld, originalOverlays=renderOverlays, originalAny=anyLayerOn;
function p(x,y){return{x:x,y:y};}
function pointKey(x,y){return x+','+y;}
function rect(cx,cy,w,h,a){return{cx:cx,cy:cy,w:w,h:h,ang:a||0};}
function transform(r,x,y){var c=Math.cos(r.ang),s=Math.sin(r.ang);return p(r.cx+x*c-y*s,r.cy+x*s+y*c);}
function local(r,x,y){var c=Math.cos(r.ang),s=Math.sin(r.ang),dx=x-r.cx,dy=y-r.cy;return p(dx*c+dy*s,-dx*s+dy*c);}
function footprint(b,roof){var off=roof?-b.hgt*.42:0;return[[-b.w/2,-b.h/2],[b.w/2,-b.h/2],[b.w/2,b.h/2],[-b.w/2,b.h/2]].map(function(a){return transform(b,a[0]+off,a[1]+off);});}
function at(C,x,y){if(x<0||y<0||x>=C.w*C.cell||y>=C.h*C.cell)return-1;return Math.floor(y/C.cell)*C.w+Math.floor(x/C.cell);}
function sample(g,x,y){var u=clamp(x/g.dx,0,g.w-1),v=clamp(y/g.dy,0,g.h-1),ix=Math.min(g.w-2,Math.floor(u)),iy=Math.min(g.h-2,Math.floor(v)),tx=u-ix,ty=v-iy,k=iy*g.w+ix;return lerp(lerp(g.data[k],g.data[k+1],tx),lerp(g.data[k+g.w],g.data[k+g.w+1],tx),ty);}
function prepare(F){
 var w=Math.ceil(WORLD_W/8)+1,h=Math.ceil(WORLD_H/8)+1,dx=WORLD_W/(w-1),dy=WORLD_H/(h-1),data=new Float64Array(w*h),slope=new Float32Array(w*h),lo=Infinity,hi=-Infinity;
 for(var y=0;y<h;y++)for(var x=0;x<w;x++){var k=y*w+x,v=F.heightAt(x*dx,y*dy);if(!Number.isFinite(v))throw new Error('Non-finite terrain sample');data[k]=v;lo=Math.min(lo,v);hi=Math.max(hi,v);}
 for(var j=0;j<h;j++)for(var i=0;i<w;i++){var a=Math.max(0,i-1),b=Math.min(w-1,i+1),c=Math.max(0,j-1),d=Math.min(h-1,j+1),gx=(data[j*w+b]-data[j*w+a])/((b-a)*dx),gy=(data[d*w+i]-data[c*w+i])/((d-c)*dy);slope[j*w+i]=Math.min(1,Math.hypot(gx,gy)*900);}
 F.topography={elevation:{w:w,h:h,dx:dx,dy:dy,data:data,min:lo,max:hi,units:'relative elevation'},slope:{w:w,h:h,dx:dx,dy:dy,data:slope,units:'V1 normalized slope index; not grade percent'},contours:null,interval:0};
 return F.topography;
}
/* Marching squares: shared edge identifiers stitch adjacent cells without
 * coordinate tolerance. Bilinear determinant resolves 0101/1010 saddles.
 * No curve smoothing which would move a contour off its scalar isovalue. */
function contourGrid(g,levels){
 var result=[];
 levels.forEach(function(level,levelIndex){
  var points=new Map(),segments=[],links=new Map();
  function endpoint(edge,x,y,v){
   var id,A,B,va,vb;
   if(edge===0){id='h'+x+','+y;A=p(x*g.dx,y*g.dy);B=p((x+1)*g.dx,y*g.dy);va=v[0];vb=v[1];}
   else if(edge===1){id='v'+(x+1)+','+y;A=p((x+1)*g.dx,y*g.dy);B=p((x+1)*g.dx,(y+1)*g.dy);va=v[1];vb=v[2];}
   else if(edge===2){id='h'+x+','+(y+1);A=p(x*g.dx,(y+1)*g.dy);B=p((x+1)*g.dx,(y+1)*g.dy);va=v[3];vb=v[2];}
   else{id='v'+x+','+y;A=p(x*g.dx,y*g.dy);B=p(x*g.dx,(y+1)*g.dy);va=v[0];vb=v[3];}
   if(!points.has(id)){var t=va===vb?.5:clamp((level-va)/(vb-va),0,1);points.set(id,p(lerp(A.x,B.x,t),lerp(A.y,B.y,t)));}
   return id;
  }
  function add(a,b){if(a===b)return;var n=segments.length;segments.push([a,b]);if(!links.has(a))links.set(a,[]);if(!links.has(b))links.set(b,[]);links.get(a).push(n);links.get(b).push(n);}
  for(var y=0;y<g.h-1;y++)for(var x=0;x<g.w-1;x++){
   var k=y*g.w+x,v=[g.data[k],g.data[k+1],g.data[k+1+g.w],g.data[k+g.w]],bits=v.map(function(a){return a>=level;}),cross=[];
   for(var e=0;e<4;e++)if(bits[e]!==bits[(e+1)%4])cross.push(e);
   if(cross.length===2)add(endpoint(cross[0],x,y,v),endpoint(cross[1],x,y,v));
   else if(cross.length===4){var Q=(v[0]-level)*(v[2]-level)-(v[1]-level)*(v[3]-level),pairs=Q>=0?[[0,1],[2,3]]:[[0,3],[1,2]];pairs.forEach(function(ab){add(endpoint(ab[0],x,y,v),endpoint(ab[1],x,y,v));});}
  }
  var used=new Uint8Array(segments.length),lines=[];
  function walk(start,edge){var line=[points.get(start)],cur=start;while(edge!=null&&!used[edge]){used[edge]=1;var ab=segments[edge],next=ab[0]===cur?ab[1]:ab[0];line.push(points.get(next));cur=next;edge=(links.get(cur)||[]).find(function(i){return !used[i];});}if(line.length>1)lines.push(line);}
  links.forEach(function(es,k){if(es.length===1&&!used[es[0]])walk(k,es[0]);});
  segments.forEach(function(ab,i){if(!used[i])walk(ab[0],i);});
  if(lines.length)result.push({level:level,major:Math.abs(level/.1-Math.round(level/.1))<1e-6,lines:lines});
 });return result;
}
function contours(T){if(T.contours&&T.interval===view.interval)return T.contours;var levels=[];for(var n=Math.ceil((T.elevation.min+1e-10)/view.interval);n*view.interval<T.elevation.max;n++)levels.push(+(n*view.interval).toFixed(5));T.contours=contourGrid(T.elevation,levels);T.interval=view.interval;return T.contours;}
/* Trace exact grid-cell union boundaries, preserving holes and disconnected
 * pieces. At diagonal contacts turn right, rather than stitching a bow-tie. */
function ringsFromCells(cells,w,cell){
 var set=new Set(cells),edges=[],out=new Map(),rings=[];
 function edge(x,y,xx,yy,d){var k=pointKey(x,y),id=edges.length,e={x:x,y:y,xx:xx,yy:yy,d:d};edges.push(e);if(!out.has(k))out.set(k,[]);out.get(k).push(id);}
 cells.forEach(function(k){var x=k%w,y=k/w|0;
  if(!set.has(k-w))edge(x,y,x+1,y,0);
  if(x===w-1||!set.has(k+1))edge(x+1,y,x+1,y+1,1);
  if(!set.has(k+w))edge(x+1,y+1,x,y+1,2);
  if(x===0||!set.has(k-1))edge(x,y+1,x,y,3);
 });
 var used=new Uint8Array(edges.length),priority=[1,0,3,2];
 edges.forEach(function(e,i){if(used[i])return;var ring=[],id=i,sx=e.x,sy=e.y;
  while(id!=null&&!used[id]){var q=edges[id];used[id]=1;ring.push(p(q.x*cell,q.y*cell));if(q.xx===sx&&q.yy===sy)break;var ns=(out.get(pointKey(q.xx,q.yy))||[]).filter(function(t){return!used[t];});ns.sort(function(a,b){return priority[(edges[a].d-q.d+4)%4]-priority[(edges[b].d-q.d+4)%4];});id=ns[0];}
  // A hole can touch the exterior at one raster vertex. Split weakly
  // simple pinches into individually simple loops before exporting rings.
  function emit(line){
   if(line.length<4)return;var seen=new Map();
   for(var i=0;i<line.length;i++){var k=pointKey(line[i].x,line[i].y);if(seen.has(k)){var a=seen.get(k);emit(line.slice(a,i));emit(line.slice(0,a).concat(line.slice(i)));return;}seen.set(k,i);}
   var simple=line.filter(function(v,j){var a=line[(j+line.length-1)%line.length],b=line[(j+1)%line.length];return Math.abs((v.x-a.x)*(b.y-v.y)-(v.y-a.y)*(b.x-v.x))>1e-8;});
   if(simple.length>=4){simple.push(p(simple[0].x,simple[0].y));rings.push(simple);}
  }emit(ring);
 });return rings;
}
function pathRings(ctx,rings){ctx.beginPath();rings.forEach(function(r){r.forEach(function(v,i){if(!i)ctx.moveTo(v.x,v.y);else ctx.lineTo(v.x,v.y);});ctx.closePath();});}
function reservations(F,routed,nodes){
 var C={version:VERSION,w:BCOLS,h:BROWS,cell:BCELL,flags:new Uint8Array(BCOLS*BROWS),owner:new Int32Array(BCOLS*BROWS).fill(-1),blockOwner:new Int32Array(BCOLS*BROWS).fill(-1),district:new Int16Array(BCOLS*BROWS),parcels:[],blocks:[],parks:[],topography:F.topography||prepare(F),policy:Object.assign({},settings),counts:{candidates:0,fit:0,resized:0,rejected:0,roofLimited:0},F:F};
 var districtMap=new Map();F.centers.forEach(function(d,i){districtMap.set(d,i);});
 function bounds(x0,y0,x1,y1,fn){for(var y=Math.max(0,Math.floor(y0/BCELL));y<=Math.min(BROWS-1,Math.floor(y1/BCELL));y++)for(var x=Math.max(0,Math.floor(x0/BCELL));x<=Math.min(BCOLS-1,Math.floor(x1/BCELL));x++)fn(x,y,y*BCOLS+x);}
 function capsule(a,b,r,flag){var R=r+HALF_DIAG;bounds(Math.min(a.x,b.x)-R,Math.min(a.y,b.y)-R,Math.max(a.x,b.x)+R,Math.max(a.y,b.y)+R,function(x,y,k){if(segDist((x+.5)*BCELL,(y+.5)*BCELL,a.x,a.y,b.x,b.y)<=R)C.flags[k]|=flag;});}
 routed.roads.forEach(function(r){var R=[4,5.5,7.5][r.cls]+3.5+settings.setback;for(var i=1;i<r.pts.length;i++)capsule(r.pts[i-1],r.pts[i],R,1);});
 (nodes||[]).forEach(function(n){capsule(n,n,n.r+3.5+settings.setback,1);});
 if(F.river)for(var i=1;i<F.river.length;i++)capsule(F.river[i-1],F.river[i],F.riverW/2+5,F.riverW?2:0);
 F.lakes.forEach(function(L){var pad=HALF_DIAG+5,f=1+pad/Math.min(L.rx,L.ry),rx=L.rx*f,ry=L.ry*f,rr=Math.max(rx,ry),c=Math.cos(L.rot),s=Math.sin(L.rot);bounds(L.x-rr,L.y-rr,L.x+rr,L.y+rr,function(x,y,k){var dx=(x+.5)*BCELL-L.x,dy=(y+.5)*BCELL-L.y,u=(dx*c+dy*s)/rx,v=(-dx*s+dy*c)/ry;if(u*u+v*v<=1)C.flags[k]|=2;});});
 for(var y=0;y<C.h;y++)for(var x=0;x<C.w;x++){var k=y*C.w+x,wx=(x+.5)*C.cell,wy=(y+.5)*C.cell;C.district[k]=districtMap.get(F.districtAt(wx,wy));if(x===0||y===0||x===C.w-1||y===C.h-1)C.flags[k]|=16;if(sample(C.topography.slope,wx,wy)>settings.slopeLimit)C.flags[k]|=4;}
 C.forbidden=new Uint8Array(C.flags.length);for(var j=0;j<C.flags.length;j++)C.forbidden[j]=(C.flags[j]&15)?1:0; // Keep the outer flood-fill boundary open; edge cells are still unbuildable.
 return C;
}
/* OBB vs grid square SAT. Unlike five-point tests this visits every cell whose
 * area intersects the full footprint, including narrow holes between corners. */
function rectCells(C,r,fn){
 var c=Math.cos(r.ang),s=Math.sin(r.ang),ac=Math.abs(c),as=Math.abs(s),hx=r.w/2,hy=r.h/2,hh=C.cell/2,ex=hx*ac+hy*as,ey=hx*as+hy*ac;
 if(r.cx-ex<0||r.cy-ey<0||r.cx+ex>C.w*C.cell||r.cy+ey>C.h*C.cell)return false;
 for(var y=Math.max(0,Math.floor((r.cy-ey)/C.cell));y<=Math.min(C.h-1,Math.floor((r.cy+ey)/C.cell));y++)for(var x=Math.max(0,Math.floor((r.cx-ex)/C.cell));x<=Math.min(C.w-1,Math.floor((r.cx+ex)/C.cell));x++){
  var dx=(x+.5)*C.cell-r.cx,dy=(y+.5)*C.cell-r.cy;
  if(Math.abs(dx)>=ex+hh-1e-8||Math.abs(dy)>=ey+hh-1e-8||Math.abs(dx*c+dy*s)>=hx+hh*(ac+as)-1e-8||Math.abs(-dx*s+dy*c)>=hy+hh*(ac+as)-1e-8)continue;
  if(fn(y*C.w+x,x,y)===false)return false;
 }return true;
}
function allowed(C,r,id){return rectCells(C,r,function(k){return !C.flags[k]&&(id==null||C.owner[k]===id);});}
function createParcel(C,frame,kind,blockId,eligible,source,roadId){
 var cs=[],id=C.parcels.length,c=Math.cos(frame.ang),s=Math.sin(frame.ang),radius=Math.hypot(frame.w,frame.h)/2+BCELL;
 var centerCell=at(C,frame.cx,frame.cy),districtId=centerCell<0?-1:C.district[centerCell];
 if(districtId>=0)kind=C.F.centers[districtId].kind;
 for(var y=Math.max(0,Math.floor((frame.cy-radius)/C.cell));y<=Math.min(C.h-1,Math.floor((frame.cy+radius)/C.cell));y++)for(var x=Math.max(0,Math.floor((frame.cx-radius)/C.cell));x<=Math.min(C.w-1,Math.floor((frame.cx+radius)/C.cell));x++){
  var k=y*C.w+x;if(C.flags[k]||C.owner[k]>=0||(eligible&&!eligible.has(k))||(districtId>=0&&C.district[k]!==districtId))continue;
  var dx=(x+.5)*C.cell-frame.cx,dy=(y+.5)*C.cell-frame.cy,px=dx*c+dy*s,py=-dx*s+dy*c,pad=C.cell/2*(Math.abs(c)+Math.abs(s));
  if(Math.abs(px)+pad>frame.w/2+1e-8||Math.abs(py)+pad>frame.h/2+1e-8)continue;
  cs.push(k);
 }
 if(cs.length<8)return null;
 var parcel={id:id,source:source||'block-subdivision',blockId:blockId,roadId:roadId==null?null:roadId,district:kind,districtId:districtId,frame:frame,cells:cs,rings:ringsFromCells(cs,C.w,C.cell),area:cs.length*C.cell*C.cell,buildingId:null};
 cs.forEach(function(k){C.owner[k]=id;});C.parcels.push(parcel);return parcel;
}
function fit(C,b,parcel){
 C.counts.candidates++;if(!parcel){C.counts.rejected++;return false;}
 var base=Object.assign({},b),best=null,centers=[p(b.cx,b.cy)],cs=parcel.cells;
 var mx=0,my=0;cs.forEach(function(k){mx+=(k%C.w+.5)*C.cell;my+=((k/C.w|0)+.5)*C.cell;});mx/=cs.length;my/=cs.length;
 centers.push(p(mx,my),p(parcel.frame.cx,parcel.frame.cy));
 // Prefer interior cell centers for concave or asymmetric lots, rather than
 // repeatedly shrinking at an invalid bounding-box centroid.
 var cellSet=new Set(cs),depth=new Map(),queue=[];
 cs.forEach(function(k){if(!cellSet.has(k-1)||!cellSet.has(k+1)||!cellSet.has(k-C.w)||!cellSet.has(k+C.w)){depth.set(k,1);queue.push(k);}});
 for(var qi=0;qi<queue.length;qi++){var k=queue[qi];[k-1,k+1,k-C.w,k+C.w].forEach(function(j){if(cellSet.has(j)&&!depth.has(j)){depth.set(j,depth.get(k)+1);queue.push(j);}});}
 var ranked=cs.slice().sort(function(a,z){return (depth.get(z)||0)-(depth.get(a)||0)||a-z;});
 for(var ci=0;ci<ranked.length&&centers.length<9;ci++){var k=ranked[ci],cp=p((k%C.w+.5)*C.cell,((k/C.w|0)+.5)*C.cell);if(!centers.some(function(q){return dist2(cp.x,cp.y,q.x,q.y)<64;}))centers.push(cp);}
 var ratios=[[1,1],[1,.84],[.84,1],[.84,.84],[1,.68],[.68,1],[.76,.76],[.84,.6],[.6,.84],[.68,.68],[.6,.6],[.52,.52],[.44,.44]];
 ratios.sort(function(a,z){return z[0]*z[1]-a[0]*a[1];});
 for(var i=0;i<ratios.length&&!best;i++){var f=ratios[i],w=base.w*f[0],h=base.h*f[1];if(w<7||h<7)continue;for(var j=0;j<centers.length;j++){var r=rect(centers[j].x,centers[j].y,w,h,base.ang);if(allowed(C,r,parcel.id)){best=r;best.fx=f[0];best.fy=f[1];best.scale=Math.min(f[0],f[1]);break;}}}
 if(!best){C.counts.rejected++;return false;}
 b.cx=best.cx;b.cy=best.cy;b.w=best.w;b.h=best.h;b.kind=parcel.district;
 if(b.sub)b.sub=b.sub.map(function(q){var w=Math.min(b.w,q.w*best.fx),h=Math.min(b.h,q.h*best.fy);return{dx:clamp(q.dx*best.fx,-(b.w-w)/2,(b.w-w)/2),dy:clamp(q.dy*best.fy,-(b.h-h)/2,(b.h-h)/2),w:w,h:h};});
 // Projected roofs must also fit. Clamp decorative extrusion, not the actual
 // parcel; shadows are clipped to the same parcel in the retained renderer.
 var requested=b.hgt,lo=0,hi=requested;
 function roofOK(h){var ctr=transform(b,-h*.42,-h*.42);return allowed(C,rect(ctr.x,ctr.y,b.w,b.h,b.ang),parcel.id);}
 if(!roofOK(hi)){for(var n=0;n<12;n++){var mid=(lo+hi)/2;if(roofOK(mid))lo=mid;else hi=mid;}b.hgt=lo;C.counts.roofLimited++;}
 b.parcelId=parcel.id;b.placement={source:parcel.source,blockId:parcel.blockId,roadId:parcel.roadId,rule:'Full footprint and projected roof inside assigned buildable cells',scale:best.scale,scaleX:best.fx,scaleY:best.fy,requestedHeight:requested,maxSlopeIndex:0,setback:C.policy.setback};
 rectCells(C,b,function(k,x,y){b.placement.maxSlopeIndex=Math.max(b.placement.maxSlopeIndex,sample(C.topography.slope,(x+.5)*C.cell,(y+.5)*C.cell));});
 C.counts.fit++;if(best.scale<1)C.counts.resized++;return true;
}
function finalize(C,built){
 built.buildings.forEach(function(b,i){var q=C.parcels[b.parcelId];q.buildingId=i;});
 built.parcels=C.parcels;built.conditions=C;
 C.counts.accepted=built.buildings.length;C.counts.vacantParcels=C.parcels.filter(function(q){return q.buildingId==null;}).length;
 return built;
}

function ruralAllowed(C,r){var k=at(C,r.cx,r.cy);if(k<0)return false;var district=C.district[k];return rectCells(C,r,function(i){return !C.flags[i]&&C.owner[i]<0&&C.district[i]===district;});}
function finalizeLayers(W){
 var C=W.conditions;if(!C)return;var used=[],omitted=0;
 // V1's free-space POI sampler can return no locations in a dense fabric.
 // In that case use district service intents, then require a real host parcel.
 if(!W.layers.pois.length){
  W.layers.pois=[{x:W.F.downtown.x,y:W.F.downtown.y,kind:'h',source:'district-service-intent'}];
  W.F.centers.filter(function(c){return c.kind==='residential'||c.kind==='commercial';}).forEach(function(c){W.layers.pois.push({x:c.x,y:c.y,kind:'s',source:'district-service-intent'});});
 }
 W.layers.pois=W.layers.pois.filter(function(marker){
  var size=marker.kind==='h'?24:20,candidates=[];
  C.parcels.forEach(function(q){if(q.buildingId==null)return;var b=W.blocks.buildings[q.buildingId];candidates.push({q:q,x:b.cx,y:b.cy,d:dist2(marker.x,marker.y,b.cx,b.cy)});});
  candidates.sort(function(a,b){return a.d-b.d||a.q.id-b.q.id;});
  var hit=candidates.find(function(q){return !used.some(function(a){return a.id===q.q.id||dist2(a.x,a.y,q.x,q.y)<32*32;})&&allowed(C,rect(q.x,q.y,size,size,0),q.q.id);});
  if(!hit){omitted++;return false;}
  marker.x=hit.x;marker.y=hit.y;marker.parcelId=hit.q.id;marker.hostBuildingId=hit.q.buildingId;used.push({id:hit.q.id,x:hit.x,y:hit.y});return true;
 });C.counts.poiPlaced=W.layers.pois.length;C.counts.poiOmitted=omitted;
}

function validateBuilt(W){
 var C=W.conditions;if(!C)return{invalidFootprints:0};var invalid=0;
 W.blocks.buildings.forEach(function(b){
  if(!Number.isInteger(b.parcelId)||!C.parcels[b.parcelId]||![b.cx,b.cy,b.w,b.h,b.ang,b.hgt].every(Number.isFinite)||b.w<=0||b.h<=0||b.hgt<0){invalid++;return;}
  var ctr=transform(b,-b.hgt*.42,-b.hgt*.42);
  if(!allowed(C,b,b.parcelId)||!allowed(C,rect(ctr.x,ctr.y,b.w,b.h,b.ang),b.parcelId))invalid++;
 });
 if(invalid)throw new Error('Conditional boundary validation failed ('+invalid+'). Previous scene retained.');
 return{invalidFootprints:invalid,parcels:C.parcels.length,placementCandidates:C.counts.candidates,fittedBuildings:W.blocks.buildings.length};
}
/* Guarded adapters over the IMMUTABLE first-party V1 functions already loaded.
 * No duplicated replacement generator: only these explicit hook sites change.
 * Source fingerprint and every replacement range must match or boot stops.
 * Function compiles trusted, pinned first-party source, never user input.
 */
function adapt(fn,expected,edits){
 var source=Function.prototype.toString.call(fn),h=2166136261;
 for(var i=0;i<source.length;i++)h=Math.imul(h^source.charCodeAt(i),16777619);
 if((h>>>0)!==expected)throw new Error('V1 adapter source changed: '+fn.name);
 for(var j=edits.length-1;j>=0;j--){var e=edits[j];if(source.slice(e[0],e[1])!==e[2])throw new Error('V1 hook mismatch: '+fn.name);source=source.slice(0,e[0])+e[3]+source.slice(e[1]);}
 return source;
}
var subdivisionSource=Function.prototype.toString.call(buildBlocks),subdivisionAnchor='var SUBD={downtown:4,commercial:3,residential:3,waterfront:3,industrial:2,park:0};',subdivisionStart=subdivisionSource.indexOf(subdivisionAnchor);
if(subdivisionStart<0||subdivisionSource.indexOf(subdivisionAnchor,subdivisionStart+subdivisionAnchor.length)>=0)throw new Error('V1 hook mismatch: district lot depth');
var buildConditionalBlocks=Function("reservations","ringsFromCells","createParcel","fit","finalize","rect","at",'"use strict";return ('+adapt(buildBlocks,3686607643,[
 [
  0,
  40,
  "function buildBlocks(F, routed, nodes){\n",
  "function buildConditionalBlocks(F, routed, nodes){\n"
 ],
 [
  1966,
  1966,
  "",
  "  // The unchanged V1 angle grid remains useful. Its approximate obstacle\n  // mask is replaced by final, conservative layer reservations BEFORE blocks.\n  var C=reservations(F,routed,nodes);\n  mask=C.forbidden;\n"
 ],
 [
  3887,
  3887,
  "",
  "  blocks.forEach(function(b,i){\n    b.id=i; b.rings=ringsFromCells(b.cells,C.w,C.cell);\n    C.blocks.push({id:i,rings:b.rings,area:b.cells.length*C.cell*C.cell});\n    b.cells.forEach(function(k){C.blockOwner[k]=i;});\n  });\n"
 ],
 [
  subdivisionStart,
  subdivisionStart+subdivisionAnchor.length,
  subdivisionAnchor,
  'var SUBD={downtown:4,commercial:4,residential:4,waterfront:3,industrial:2,park:0};'
 ],
 [
  6620,
  6650,
  "  blocks.forEach(function(b){\n",
  "  blocks.forEach(function(b,blockIndex){\n"
 ],
 [
  7409,
  7492,
  "      parks.push({cells:inner.length?inner:b.cells, cx:b.cx, cy:b.cy, kind:kind});\n",
  "      var parkCells=inner.length?inner:b.cells;\n      var park={cells:parkCells,cx:b.cx,cy:b.cy,kind:kind,blockId:blockIndex,rings:ringsFromCells(parkCells,C.w,C.cell)};\n      parks.push(park);C.parks.push(park);\n      parkCells.forEach(function(k){C.flags[k]|=8;});\n"
 ],
 [
  9302,
  9302,
  "",
  "      var center=toWorld((pr[0]+pr[2])/2,(pr[1]+pr[3])/2);\n      var parcel=createParcel(C,rect(center[0],center[1],pw,ph,ang0),kind,blockIndex,innerSet,'block-subdivision',null);\n"
 ],
 [
  10511,
  10559,
  "      if(tryPlace(brect))buildings.push(brect);\n",
  "      if(fit(C,brect,parcel)&&tryPlace(brect))buildings.push(brect);\n"
 ],
 [
  10834,
  10870,
  "  routed.roads.forEach(function(r){\n",
  "  routed.roads.forEach(function(r,roadIndex){\n"
 ],
 [
  12141,
  12166,
  "        if(!ok)continue;\n",
  "        // Full-area fit below supersedes the old five-corner rejection.\n"
 ],
 [
  12396,
  12469,
  "        if(buildings.length<MAXBLD&&tryPlace(rect))buildings.push(rect);\n",
  "        // Plan a frontage lot from the street sample BEFORE fitting its object.\n        // The frontage band is clipped by all layer masks and existing parcels.\n        var depth=kind==='industrial'?64:52,offset=4+3.5+C.policy.setback+depth/2;\n        var frame={cx:mx+Math.cos(ba+Math.PI/2)*side*offset,cy:my+Math.sin(ba+Math.PI/2)*side*offset,w:36,h:depth,ang:ba};\n        var parentCell=at(C,frame.cx,frame.cy),parentBlock=parentCell<0?-1:C.blockOwner[parentCell];\n        var parcel=createParcel(C,frame,kind,parentBlock,null,'street-frontage',roadIndex);\n        if(buildings.length<MAXBLD&&fit(C,rect,parcel)&&tryPlace(rect))buildings.push(rect);\n"
 ],
 [
  12489,
  12549,
  "  return {blocks:blocks, buildings:buildings, parks:parks};\n",
  "  return finalize(C,{blocks:blocks,buildings:buildings,parks:parks});\n"
 ]
])+');')(reservations,ringsFromCells,createParcel,fit,finalize,rect,at);
var renderConditionalWorld=Function("view","drawTopo","pathRings","ruralAllowed","rect",'"use strict";return ('+adapt(originalRender,1849429006,[
 [
  0,
  29,
  "function renderWorld(ctx,W){\n",
  "function renderConditionalWorld(ctx,W){\n"
 ],
 [
  483,
  483,
  "",
  "  // Actual elevation isolines under water, roads, objects and labels.\n  if(W.conditions&&view.topo)drawTopo(ctx,W);\n"
 ],
 [
  2196,
  2196,
  "",
  "    ctx.save();if(pk.rings){pathRings(ctx,pk.rings);ctx.clip('evenodd');}\n"
 ],
 [
  2523,
  2523,
  "",
  "    ctx.restore();\n"
 ],
 [
  3311,
  3311,
  "",
  "      if(W.conditions&&!ruralAllowed(W.conditions,rect(rx2,ry2,fw,fh,fa)))continue;\n"
 ],
 [
  3702,
  3702,
  "",
  "      if(W.conditions&&!ruralAllowed(W.conditions,rect(rx2,ry2,10,10,0)))continue;\n"
 ],
 [
  4058,
  4058,
  "",
  "    if(W.urban&&W.urban.enabled&&b.architecture&&window.RoadAtlasUrban){RoadAtlasUrban.drawBuilding(ctx,W,b);return;}\n"
 ],
 [
  4211,
  4272,
  "    ctx.save(); ctx.translate(b.cx,b.cy); ctx.rotate(b.ang);\n",
  "    ctx.save(); if(W.conditions&&b.parcelId!=null){pathRings(ctx,W.conditions.parcels[b.parcelId].rings);ctx.clip('evenodd');} ctx.translate(b.cx,b.cy); ctx.rotate(b.ang);\n"
 ]
])+');')(view,drawTopo,pathRings,ruralAllowed,rect);
function drawTopo(ctx,W){
 var C=W.conditions,T=THEMES[clamp(Math.round(P.theme),0,2)],all=contours(C.topography),labels=[];
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 all.forEach(function(level){
  ctx.strokeStyle=P.theme===0?'#796b48':P.theme===1?'#859d91':'#90bad0';
  ctx.globalAlpha=view.opacity*(level.major?.76:.35);ctx.lineWidth=level.major?1.6:.8;
  ctx.beginPath();level.lines.forEach(function(line){line.forEach(function(v,i){if(!i)ctx.moveTo(v.x,v.y);else ctx.lineTo(v.x,v.y);});});ctx.stroke();
  if(view.labels&&level.major)level.lines.forEach(function(line){
   var d=0;for(var i=1;i<line.length;i++){d+=Math.hypot(line[i].x-line[i-1].x,line[i].y-line[i-1].y);if(d<280)continue;d=0;
    var a=line[i],z=line[i-1];if(a.x<60||a.y<35||a.x>WORLD_W-120||a.y>WORLD_H-90||labels.some(function(l){return dist2(a.x,a.y,l.x,l.y)<150*150;}))continue;
    if(!rectCells(C,rect(a.x,a.y,48,22,0),function(k){return !(C.flags[k]&11)&&C.owner[k]<0;}))continue;
    labels.push(a);ctx.save();ctx.translate(a.x,a.y);var ang=Math.atan2(a.y-z.y,a.x-z.x);if(ang>Math.PI/2)ang-=Math.PI;if(ang< -Math.PI/2)ang+=Math.PI;ctx.rotate(ang);
    ctx.globalAlpha=Math.min(.92,view.opacity+.2);ctx.font='11px ui-monospace, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle=T.halo;ctx.strokeText(level.level.toFixed(2),0,0);ctx.fillStyle=T.label;ctx.fillText(level.level.toFixed(2),0,0);ctx.restore();
   }
  });
 });ctx.restore();
}
function rasterOverlay(ctx,C,kind){
 var c=document.createElement('canvas');c.width=C.w;c.height=C.h;var g=c.getContext('2d'),im=g.createImageData(C.w,C.h);
 for(var k=0;k<C.flags.length;k++){
  var x=k%C.w,y=k/C.w|0,col=null,flags=C.flags[k];
  if(kind==='buildable'){if(flags&2)col=[50,141,205,90];else if(flags&1)col=[234,116,84,120];else if(flags&4)col=[186,65,75,110];else if(flags&8)col=[40,115,61,80];else if(C.owner[k]>=0)col=[52,191,143,88];}
  else if(kind==='slope'){var v=sample(C.topography.slope,(x+.5)*C.cell,(y+.5)*C.cell);col=[210,100-Math.floor(60*v),70,Math.floor(v*105)];}
  else if(kind==='districts'){var colors=[[89,173,199],[212,181,76],[104,154,112],[196,119,166],[126,132,201],[190,147,85],[147,170,174]],s=colors[C.district[k]%colors.length];col=[s[0],s[1],s[2],flags&2?0:38];}
  if(col){var j=k*4;im.data[j]=col[0];im.data[j+1]=col[1];im.data[j+2]=col[2];im.data[j+3]=col[3];}
 }g.putImageData(im,0,0);ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(c,0,0,WORLD_W,WORLD_H);ctx.restore();
}
function paintOverlays(ctx,W){
 var C=W.conditions;if(!C)return;
 if(view.slope)rasterOverlay(ctx,C,'slope');if(view.districts)rasterOverlay(ctx,C,'districts');if(view.buildable)rasterOverlay(ctx,C,'buildable');
 ctx.save();ctx.lineJoin='round';
 if(view.blocks){ctx.strokeStyle=P.theme===0?'rgba(31,106,127,.65)':'rgba(105,204,229,.7)';ctx.lineWidth=1.5;C.blocks.forEach(function(b){pathRings(ctx,b.rings);ctx.stroke();});}
 if(view.parcels){ctx.lineWidth=.9;C.parcels.forEach(function(q){ctx.strokeStyle=q.buildingId==null?'rgba(116,156,136,.45)':P.theme===0?'rgba(42,123,91,.6)':'rgba(144,228,181,.75)';pathRings(ctx,q.rings);ctx.stroke();});}
 if(view.directions){
  ctx.lineWidth=1;ctx.strokeStyle=P.theme===0?'rgba(48,102,101,.45)':'rgba(122,213,204,.6)';
  for(var y=40;y<WORLD_H;y+=60)for(var x=40;x<WORLD_W;x+=60){var k=at(C,x,y);if(k<0||C.flags[k]&2)continue;var a=W.F.tensorAngle(x,y),dx=Math.cos(a)*15,dy=Math.sin(a)*15;
   ctx.beginPath();ctx.moveTo(x-dx,y-dy);ctx.lineTo(x+dx,y+dy);ctx.moveTo(x+dx-Math.cos(a-.5)*5,y+dy-Math.sin(a-.5)*5);ctx.lineTo(x+dx,y+dy);ctx.lineTo(x+dx-Math.cos(a+.5)*5,y+dy-Math.sin(a+.5)*5);ctx.stroke();}
  W.F.centers.forEach(function(c){ctx.strokeStyle='rgba(208,154,58,.7)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(c.x,c.y,24,0,TAU);ctx.stroke();ctx.fillStyle='#d99d39';ctx.beginPath();ctx.arc(c.x,c.y,4,0,TAU);ctx.fill();});
 }
 if(selected&&selected.seed===W.seed&&selected.parcelId>=0){var q=C.parcels[selected.parcelId];if(q){pathRings(ctx,q.rings);ctx.fillStyle='rgba(247,187,76,.18)';ctx.fill('evenodd');ctx.strokeStyle='#dd9a20';ctx.lineWidth=2.2;ctx.stroke();}}
 ctx.restore();
}
renderWorld=function(ctx,W){if(W.conditions)renderConditionalWorld(ctx,W);else originalRender(ctx,W);};
renderOverlays=function(){originalOverlays();if(world&&world.conditions&&overlayCanvas)paintOverlays(overlayCanvas.getContext('2d'),world);};
anyLayerOn=function(){return originalAny()||!!(world&&world.conditions&&(view.blocks||view.parcels||view.buildable||view.slope||view.districts||view.directions||selected));};
function redraw(base){if(!world)return;if(base&&world.conditions){var next=document.createElement('canvas');next.width=WORLD_W;next.height=WORLD_H;renderWorld(next.getContext('2d'),world);worldCanvas=next;}renderOverlays();drawStatic();}
function inspect(x,y){
 if(!world||!world.conditions)return null;var C=world.conditions,k=at(C,x,y);if(k<0)return null;var q=C.owner[k]>=0?C.parcels[C.owner[k]]:null,flags=C.flags[k],reasons=[];
 if(flags&1)reasons.push('Road / junction setback');if(flags&2)reasons.push('Water / bank clearance');if(flags&4)reasons.push('Slope above placement limit');if(flags&8)reasons.push('Reserved park');if(flags&16)reasons.push('Map boundary');
 var b=q&&q.buildingId!=null?world.blocks.buildings[q.buildingId]:null;
 return{x:x,y:y,elevation:sample(C.topography.elevation,x,y),slopeIndex:sample(C.topography.slope,x,y),district:world.F.centers[C.district[k]].kind,parcelId:q?q.id:-1,blockId:q?q.blockId:C.blockOwner[k],source:q?q.source:null,roadId:q?q.roadId:null,buildable:flags===0&&!!q,reasons:reasons.length?reasons:q?['Assigned buildable parcel']:['Clear land, but no assigned parcel'],building:b?{index:q.buildingId,footprintWidth:b.w,footprintDepth:b.h,height:b.hgt,placement:b.placement}:null,policy:C.policy};
}
function inspectAt(x,y){var d=inspect(x,y);if(!d)return;selected={seed:world.seed,parcelId:d.parcelId};var panel=document.getElementById('conditionInspector');panel.hidden=false;
 var title=document.getElementById('conditionTitle');title.textContent=d.parcelId>=0?'Parcel '+d.parcelId+' · '+(d.building?'occupied':'unbuilt'):'Land conditions';
 var fields=[['Elevation',d.elevation.toFixed(3)+' relative'],['Slope index',d.slopeIndex.toFixed(3)+' / max '+d.policy.slopeLimit.toFixed(2)],['District',d.district],['Boundary',d.source||'No parcel'],['Block',d.blockId>=0?String(d.blockId):'Frontage / open land'],['Road setback',d.policy.setback+' additional world units']];
 if(d.building)fields.push(['Fitted footprint',d.building.footprintWidth.toFixed(1)+' × '+d.building.footprintDepth.toFixed(1)],['Scale from candidate',(d.building.placement.scale*100).toFixed(0)+'%']);
 var dl=document.getElementById('conditionValues');dl.replaceChildren();fields.forEach(function(kv){var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=kv[0];dd.textContent=kv[1];dl.append(dt,dd);});
 document.getElementById('conditionReason').textContent=d.reasons.join(' · ')+(d.building?' · '+d.building.placement.rule:'');if(window.RoadAtlasUrban)RoadAtlasUrban.onInspect(d);redraw(false);
}
function exportConditions(W){if(!W.conditions)return null;var C=W.conditions,T=C.topography;
 return {version:VERSION,policy:Object.assign({},C.policy),views:Object.assign({},view),units:'V1 world units; elevation is relative; slopeIndex is not a surveyed grade',resolution:C.cell,
  elevation:{w:T.elevation.w,h:T.elevation.h,dx:T.elevation.dx,dy:T.elevation.dy,data:Array.from(T.elevation.data)},slope:{w:T.slope.w,h:T.slope.h,dx:T.slope.dx,dy:T.slope.dy,data:Array.from(T.slope.data)},
  contours:contours(T),blocks:C.blocks,parcels:C.parcels.map(function(q){return{id:q.id,source:q.source,blockId:q.blockId,roadId:q.roadId,district:q.district,districtId:q.districtId,area:q.area,rings:q.rings,frame:q.frame,buildingId:q.buildingId};}),
  raster:{w:C.w,h:C.h,cell:C.cell,flags:Array.from(C.flags),flagsLegend:{road:1,water:2,slope:4,park:8,mapEdge:16},parcelOwner:Array.from(C.owner)},statistics:Object.assign({},C.counts)};
}
function reindex(built){if(!built.conditions)return;var C=built.conditions;C.parcels.forEach(function(q){q.buildingId=null;});finalize(C,built);C.counts.rejected=C.counts.candidates-C.counts.accepted;}
function refreshUI(){selected=null;var ins=document.getElementById('conditionInspector');if(ins)ins.hidden=true;var e=document.getElementById('conditionsStatus');if(!e)return;
 if(!world||!world.conditions){e.textContent='Original V1 comparison: conditions and topo are not applied.';return;}
 var C=world.conditions;e.textContent=C.parcels.length+' parcels · '+C.counts.accepted+' fitted buildings · '+C.counts.resized+' resized candidates. Boundaries use '+C.cell+'-unit cells; slope is an index, not a surveyed grade.';
}
function queryParameters(u){u.searchParams.set('setback',settings.setback);u.searchParams.set('slopeLimit',settings.slopeLimit);u.searchParams.set('topo',view.topo?'1':'0');u.searchParams.set('contour',view.interval);u.searchParams.set('topoOpacity',view.opacity);u.searchParams.set('contourLabels',view.labels?'1':'0');if(window.RoadAtlasUrban)RoadAtlasUrban.queryParameters(u);if(window.RoadAtlasNavigation&&!RoadAtlasNavigation.disabled)RoadAtlasNavigation.queryParameters(u);return u;}
function persist(){try{localStorage.setItem('ra.conditions.v1',JSON.stringify({topo:view.topo,labels:view.labels}));}catch(e){}}
function installUI(){
 var style=document.createElement('style');style.textContent='.cond-detail{border-top:1px solid #ffffff1c;padding-top:9px;margin-top:4px}.cond-detail summary{cursor:pointer;color:#b7c9d7;font-size:12px;padding:6px 0}.cond-detail label{display:block;font-size:12px;margin:9px 0}.cond-detail select{display:block;width:100%;padding:8px;background:#152129;color:#e2ecf3;border:1px solid #50606c;border-radius:7px;margin-top:5px}.cond-detail input[type=range]{width:100%;accent-color:#80b998}.cond-detail input[type=checkbox]{accent-color:#80b998}.cond-note{font-size:11px;line-height:1.5;color:#9bafbd}.cond-inspector{position:fixed;right:12px;bottom:80px;z-index:1400;width:min(320px,calc(100vw - 48px));max-height:45vh;overflow:auto;padding:14px;background:rgba(10,18,23,.95);color:#dce8ef;border:1px solid #55706c;border-radius:13px;box-shadow:0 12px 40px #0008}.cond-inspector[hidden]{display:none}.cond-inspector h3{font-size:14px;margin:0 28px 9px 0}.cond-inspector dl{display:grid;grid-template-columns:1fr 1.35fr;gap:6px;font-size:11px;line-height:1.5}.cond-inspector dt{color:#96acb7}.cond-inspector dd{margin:0}.cond-inspector .close{float:right;background:transparent;color:#dce8ef;border:0;padding:6px;cursor:pointer}.cond-inspector p{font-size:11px;line-height:1.6;color:#aac7b8}#layersPanel{max-height:calc(100dvh - 175px);overflow:auto;min-width:230px;width:min(284px,calc(100vw - 48px))}#analysisPanel{max-height:calc(100dvh - 175px);overflow:auto}#conditionsStatus{font-size:11px;line-height:1.6;color:#a5beb0;margin-top:10px}@media(max-width:720px){#layersPanel,#analysisPanel{max-height:calc(100dvh - 205px)}.cond-detail select{font-size:16px}.cond-inspector{max-height:34vh;bottom:78px}#topbar .tbtn{min-height:40px}}';style.textContent+='#stage{top:var(--ra-bar-bottom,52px)}#layersPanel,#analysisPanel{top:calc(var(--ra-bar-bottom,52px) + 8px);max-height:calc(100dvh - var(--ra-bar-bottom,52px) - 96px)}#layersPanel .lchip{width:100%;min-height:40px}';document.head.appendChild(style);
 var toolbar=document.getElementById('topbar');function barSize(){document.documentElement.style.setProperty('--ra-bar-bottom',Math.ceil(toolbar.getBoundingClientRect().bottom)+'px');}barSize();if(window.ResizeObserver)new ResizeObserver(barSize).observe(toolbar);else addEventListener('resize',barSize);
 var lp=document.getElementById('layersPanel');
 var div=document.createElement('div');div.innerHTML='<button type="button" class="lchip" id="topoToggle"><span class="dot" style="background:#aa9870"></span>Topographic contours</button><details class="cond-detail"><summary>Contour styling</summary><label>Interval · relative elevation<select id="contourInterval"><option value="0.01">0.01 · fine</option><option value="0.02">0.02 · balanced</option><option value="0.05">0.05 · sparse</option><option value="0.1">0.10 · major only</option></select></label><label>Line opacity<input id="topoOpacity" type="range" min="0.1" max="1" step="0.02"></label><label><input id="contourLabels" type="checkbox"> Elevation labels</label><div class="cond-note">Actual isolines from the V1 elevation field. Major contours every 0.10. No invented metre values.</div></details><details class="cond-detail"><summary>Boundary / field views</summary><div id="conditionViews"></div><p class="cond-note">Green = assigned buildable parcels. Orange = pavement/setback. Blue = water. Red = slope exclusion. These layers control placement even when hidden.</p></details><button class="lchip" id="inspectConditions" type="button">Inspect a point / parcel</button>';
 lp.appendChild(div);
 function button(key,label){var b=document.createElement('button');b.type='button';b.className='lchip';b.textContent=label;b.setAttribute('aria-pressed','false');b.dataset.conditionView=key;b.onclick=function(){view[key]=!view[key];b.classList.toggle('on',view[key]);b.setAttribute('aria-pressed',String(view[key]));redraw(false);};document.getElementById('conditionViews').appendChild(b);}
 [['blocks','Block boundaries'],['parcels','Parcel boundaries'],['buildable','Buildable / exclusion mask'],['slope','Slope field'],['districts','District influence regions'],['directions','Attractors + direction guides']].forEach(function(v){button(v[0],v[1]);});
 var topo=document.getElementById('topoToggle');topo.classList.toggle('on',view.topo);topo.setAttribute('aria-pressed',String(view.topo));topo.onclick=function(){view.topo=!view.topo;topo.classList.toggle('on',view.topo);topo.setAttribute('aria-pressed',String(view.topo));persist();redraw(true);};
 var interval=document.getElementById('contourInterval');interval.value=String(view.interval);interval.onchange=function(){view.interval=+interval.value;redraw(true);};
 var op=document.getElementById('topoOpacity');op.value=view.opacity;op.oninput=function(){view.opacity=+op.value;redraw(true);};
 var label=document.getElementById('contourLabels');label.checked=view.labels;label.onchange=function(){view.labels=label.checked;persist();redraw(true);};
 var analysis=document.getElementById('analysisPanel'),rules=document.createElement('details');rules.className='cond-detail';rules.id='conditionRules';rules.innerHTML='<summary>Placement conditions</summary><label>Additional road setback <output id="setbackValue"></output><input id="conditionSetback" type="range" min="0" max="12" step="1"></label><label>Maximum slope index <output id="slopeValue"></output><input id="conditionSlope" type="range" min="0.15" max="1" step="0.05"></label><p class="cond-note">Changes rebuild parcels and fitted objects from these conditions. Road layout is deterministic and unchanged by these two placement controls.</p>';analysis.appendChild(rules);
 var status=document.createElement('div');status.id='conditionsStatus';analysis.appendChild(status);
 [['conditionSetback','setback','setbackValue'],['conditionSlope','slopeLimit','slopeValue']].forEach(function(v){var input=document.getElementById(v[0]),out=document.getElementById(v[2]);input.value=settings[v[1]];out.textContent=settings[v[1]];input.oninput=function(){out.textContent=input.value;};input.onchange=function(){settings[v[1]]=+input.value;status.textContent='Rebuilding conditional placement…';setTimeout(function(){regenerate();},16);};});
 var panel=document.createElement('section');panel.id='conditionInspector';panel.className='cond-inspector';panel.hidden=true;panel.setAttribute('aria-label','Point and parcel conditions');panel.innerHTML='<button class="close" type="button" aria-label="Close condition inspector">✕</button><h3 id="conditionTitle"></h3><dl id="conditionValues"></dl><p id="conditionReason"></p>';document.body.appendChild(panel);
 panel.querySelector('.close').onclick=function(){selected=null;panel.hidden=true;redraw(false);};
 var inspectButton=document.getElementById('inspectConditions');inspectButton.onclick=function(){inspecting=!inspecting;inspectButton.classList.toggle('on',inspecting);inspectButton.textContent=inspecting?'Inspection on · tap the map':'Inspect a point / parcel';if(inspecting){lp.classList.remove('open');toast('Tap a point or parcel to inspect its conditions');}};
 var start=null;scene.addEventListener('pointerdown',function(e){if(window.RoadAtlasNavigation)return;start={x:e.clientX,y:e.clientY};});scene.addEventListener('pointerup',function(e){if(window.RoadAtlasNavigation)return;if(!inspecting||!start||Math.hypot(e.clientX-start.x,e.clientY-start.y)>8||window.__renderMode)return;var r=scene.getBoundingClientRect();inspectAt((e.clientX-r.left)/r.width*WORLD_W,(e.clientY-r.top)/r.height*WORLD_H);});
 document.getElementById('stage').addEventListener('roadatlas:maptap',function(e){if(inspecting&&!window.__renderMode)inspectAt(e.detail.x,e.detail.y);});
 var share=document.getElementById('shareBtn');if(share){var b=share.cloneNode(true);share.replaceWith(b);b.onclick=function(){var u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('seed',state.seed);u.searchParams.set('pipeline',RoadAtlasPipeline.getMode());queryParameters(u);if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u.href).then(function(){toast('Seed, build order and conditions copied');},function(){prompt('Copy this link:',u.href);});else prompt('Copy this link:',u.href);};}
}
window.RoadAtlasConditions={version:VERSION,prepare:prepare,buildBlocks:buildConditionalBlocks,finalizeLayers:finalizeLayers,validate:validateBuilt,reindex:reindex,refresh:refreshUI,exportData:exportConditions,queryParameters:queryParameters,
 getSettings:function(){return Object.assign({},settings);},getView:function(){return Object.assign({},view);},
 setSettings:function(s){if(s.setback!=null)settings.setback=number(String(s.setback),settings.setback,0,12);if(s.slopeLimit!=null)settings.slopeLimit=number(String(s.slopeLimit),settings.slopeLimit,.15,1);regenerate();},
 setView:function(v){Object.keys(view).forEach(function(k){if(v[k]!=null)view[k]=typeof view[k]==='boolean'?!!v[k]:number(String(v[k]),view[k],k==='interval'?.01:.1,k==='interval'?.1:1);});redraw(true);},isInspecting:function(){return inspecting;},inspect:inspect,inspectAt:inspectAt,
 debug:{contourGrid:contourGrid,ringsFromCells:ringsFromCells,rectCells:rectCells,allowed:allowed,footprint:footprint,createParcel:createParcel,fit:fit,sample:sample,reservations:reservations}};
installUI();
})();
