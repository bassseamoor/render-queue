/* Road Atlas Streets 2.5.1 — hierarchy-first, district-serving street fabric.
 * Uses the pinned V1 district-grid builder, terrain, parcels and site grammar.
 * All land reservations consume the finalized graph and junction envelopes.
 * This is illustrative procedural cartography, not a certified road design.
 */
(function(){
'use strict';
var VERSION='2.5.1',query=new URLSearchParams(location.search),settings={enabled:query.get('streets')!=='previous',radius:Math.max(4,Math.min(14,Number(query.get('corners'))||8))},last=null;
var indexCache=new WeakMap();
var widths=[8,11,15],H=RoadAtlasPipeline.debug;
function cp(p){return{x:p.x,y:p.y};}
function d(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function len(a){var n=0;for(var i=1;i<a.length;i++)n+=d(a[i-1],a[i]);return n;}
function mix(a,b,t){return{x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)};}
function norm(x,y){var n=Math.hypot(x,y)||1;return{x:x/n,y:y/n};}
function add(p,u,t){return{x:p.x+u.x*t,y:p.y+u.y*t};}
function dry(F,a,b,clear){var n=Math.ceil(d(a,b)/4);for(var i=0;i<=n;i++){var p=mix(a,b,i/Math.max(1,n));if(p.x<0||p.y<0||p.x>WORLD_W||p.y>WORLD_H||F.waterDist(p.x,p.y)<clear)return false;}return true;}
function at(path,dist){var total=0;for(var i=1;i<path.length;i++){var L=d(path[i-1],path[i]);if(total+L>=dist||i===path.length-1){var p=mix(path[i-1],path[i],clamp((dist-total)/Math.max(.0001,L),0,1));p.u=norm(path[i].x-path[i-1].x,path[i].y-path[i-1].y);p.i=i;return p;}total+=L;}return Object.assign(cp(path[0]),{u:{x:1,y:0},i:0});}
function slice(path,start,end){var L=len(path);start=clamp(start,0,L);end=clamp(end,0,L);if(end<=start)return[];var a=at(path,start),b=at(path,end),out=[cp(a)];for(var i=a.i;i<b.i;i++)out.push(cp(path[i]));out.push(cp(b));return out;}
function smoothCorners(path,F,radius){if(path.length<3)return path.map(cp);var out=[cp(path[0])];for(var i=1;i<path.length-1;i++){var a=path[i-1],b=path[i],c=path[i+1],u=norm(b.x-a.x,b.y-a.y),v=norm(c.x-b.x,c.y-b.y),angle=Math.acos(clamp(u.x*v.x+u.y*v.y,-1,1)),cut=Math.min(radius*Math.tan(angle/2),d(a,b)*.3,d(b,c)*.3);
 if(angle<.06||angle>2.55||cut<.1){out.push(cp(b));continue;}var A=add(b,u,-cut),B=add(b,v,cut),curve=[];for(var k=0;k<=8;k++){var t=k/8;curve.push(mix(mix(A,b,t),mix(b,B,t),t));}if(curve.some(function(p){return F.waterDist(p.x,p.y)<12;})){out.push(cp(b));continue;}out=out.concat(curve);
 }out.push(cp(path[path.length-1]));return out;}
function simplify(path,tol){if(path.length<3)return path.map(cp);var a=path[0],b=path[path.length-1],best=0,idx=0;for(var i=1;i<path.length-1;i++){var z=segDist(path[i].x,path[i].y,a.x,a.y,b.x,b.y);if(z>best){best=z;idx=i;}}return best>tol?simplify(path.slice(0,idx+1),tol).slice(0,-1).concat(simplify(path.slice(idx),tol)):[cp(a),cp(b)];}
function prepare(F){
 var r=makeRng(state.seed,'citywide-fields'),original=F.centers.length,step=310*Math.sqrt(WEXT),nx=Math.max(3,Math.round(WORLD_W/step)),ny=Math.max(3,Math.round(WORLD_H/step));
 for(var y=0;y<ny;y++)for(var x=0;x<nx;x++){
  var c={x:(x+.5)*WORLD_W/nx+(r()-.5)*30,y:(y+.5)*WORLD_H/ny+(r()-.5)*30};
  if(F.centers.some(function(a){return d(a,c)<step*.68;}))continue;
  if(F.waterDist(c.x,c.y)<48){var found=null;for(var rr=40;rr<150&&!found;rr+=20)for(var j=0;j<16;j++){var p={x:c.x+Math.cos(j*TAU/16)*rr,y:c.y+Math.sin(j*TAU/16)*rr};if(p.x>60&&p.y>60&&p.x<WORLD_W-60&&p.y<WORLD_H-60&&F.waterDist(p.x,p.y)>48){found=p;break;}}if(!found)continue;c=found;}
  if(F.centers.some(function(a){return d(a,c)<step*.56;}))continue;
  c.kind=r()<.12?'commercial':r()<.16?'industrial':'residential';c.extension=true;F.centers.push(c);
 }
 F.originalUrbanRadius=F.R;F.R=Math.hypot(WORLD_W,WORLD_H)*.61;
 // City fabrics share a few planning orientations instead of every district
 // inventing its own angle. Steep ground can still rotate the local fabric
 // toward contours, but only enough to adapt rather than scribble.
 var theta=(r()-.5)*.28,zoneCols=Math.max(2,Math.min(4,Math.round(WORLD_W/620))),zoneRows=Math.max(2,Math.min(3,Math.round(WORLD_H/620))),zr=makeRng(state.seed,'street-axis-zones'),zoneAngles=[];
 for(var zy=0;zy<zoneRows;zy++)for(var zx=0;zx<zoneCols;zx++)zoneAngles.push(theta+(zr()-.5)*.14);
 F.streetAxes=F.centers.map(function(c,i){var zx=clamp(Math.floor(c.x/WORLD_W*zoneCols),0,zoneCols-1),zy=clamp(Math.floor(c.y/WORLD_H*zoneRows),0,zoneRows-1),base=zoneAngles[zy*zoneCols+zx]+(r()-.5)*(i<original?.07:.04),gx=(F.heightAt(c.x+12,c.y)-F.heightAt(c.x-12,c.y))/24,gy=(F.heightAt(c.x,c.y+12)-F.heightAt(c.x,c.y-12))/24,w=clamp(Math.hypot(gx,gy)*900,0,.6),contour=Math.atan2(gx,-gy),diff=Math.atan2(Math.sin(4*(contour-base)),Math.cos(4*(contour-base)))/4,terrainPull=clamp((w-.12)/.48,0,1);return base+clamp(diff*terrainPull,-.12,.12);});
 F.streetCoverage={originalDistricts:original,addedDistricts:F.centers.length-original,axisZones:zoneCols*zoneRows};return F;
}
// Keep V1's line sampling, land/district clipping, split-at-crossing grammar.
// Replace ONLY its center-radius limit and unrelated per-district random angles.
var gridSource=Function.prototype.toString.call(buildDistrictGrids);
function edit(a,b){if(gridSource.split(a).length!==2)throw new Error('Pinned V1 street hook changed');gridSource=gridSource.replace(a,b);}
edit('var theta=F.tensorAngle(D.x,D.y)+(rng()-0.5)*0.6;','var theta=F.streetAxes[i]; rng();');
edit('var E=clamp(mnd*0.55,170,Math.min(F.R*0.95,560));','var E=clamp(mnd*.95,210,Math.min(F.R,720));');
edit('var s=clamp(96/Math.max(0.4,P.roadDensity),64,150);','var s=clamp(108/Math.max(.4,P.roadDensity),78,180)*Math.max(1,Math.sqrt(WEXT)*.82);');
edit('if(dxc*dxc+dcy*dcy>F.R*F.R*1.1)ok=false;','if(w.x<32||w.y<32||w.x>WORLD_W-32||w.y>WORLD_H-32)ok=false;');
edit('else if(F.waterDist(w.x,w.y)<20)ok=false;', 'else if(F.waterDist(w.x,w.y)<20 || (F.topography&&RoadAtlasConditions.debug.sample(F.topography.slope,w.x,w.y)>.98))ok=false;');
var cityGrids=Function('return ('+gridSource+');')();

function lineBox(center,u){
 var hits=[];function hit(t){var p=add(center,u,t);if(p.x>=-1e-6&&p.x<=WORLD_W+1e-6&&p.y>=-1e-6&&p.y<=WORLD_H+1e-6)hits.push({x:clamp(p.x,0,WORLD_W),y:clamp(p.y,0,WORLD_H),t:t});}
 if(Math.abs(u.x)>.0001){hit((0-center.x)/u.x);hit((WORLD_W-center.x)/u.x);}if(Math.abs(u.y)>.0001){hit((0-center.y)/u.y);hit((WORLD_H-center.y)/u.y);}hits.sort(function(a,b){return a.t-b.t;});return hits.length>=2?[hits[0],hits[hits.length-1]]:null;
}
function primaryCorridors(F){
 var roads=[],r=makeRng(state.seed,'primary-corridors'),centers=F.centers.filter(function(c){return c.kind!=='park';}),axis=0;
 if(F.streetAxes&&F.streetAxes.length){var sx=0,sy=0;F.streetAxes.forEach(function(a){sx+=Math.cos(2*a);sy+=Math.sin(2*a);});axis=.5*Math.atan2(sy,sx);}
 var dirs=[{x:Math.cos(axis),y:Math.sin(axis)},{x:-Math.sin(axis),y:Math.cos(axis)}],base=buildCostGrid(F),density=clamp(P.roadDensity,.4,1.6),counts=[density>1.15?2:1,density>1.35?2:1];
 dirs.forEach(function(u,di){var n={x:-u.y,y:u.x},proj=centers.map(function(c){return c.x*n.x+c.y*n.y;}).sort(function(a,b){return a-b;});if(!proj.length)return;
  for(var ci=0;ci<counts[di];ci++){var q=counts[di]===1?.5:(ci?.68:.32),idx=clamp(Math.round(q*(proj.length-1)),0,proj.length-1),target=proj[idx]+(r()-.5)*28,C={x:WORLD_W/2,y:WORLD_H/2},shift=target-(C.x*n.x+C.y*n.y),mid=add(C,n,shift),ends=lineBox(mid,u);if(!ends)continue;var A=ends[0],B=ends[1],cost=new Float32Array(base.length);
   for(var y=0;y<AROWS;y++)for(var x=0;x<ACOLS;x++){var k=y*ACOLS+x,wx=(x+.5)*ACELL,wy=(y+.5)*ACELL,lineDist=Math.abs((wx-mid.x)*n.x+(wy-mid.y)*n.y),wd=F.waterDist(wx,wy);cost[k]=base[k]+Math.pow(lineDist/95,1.45)*3.8+(wd<0?18:0);}
   var path=H.routeAStar(cost,A,B);if(!path||path.length<2)continue;path[0]=cp(A);path[path.length-1]=cp(B);path=smoothCorners(simplify(path,5.5),F,18);if(path.length<2||len(path)<Math.min(WORLD_W,WORLD_H)*.62)continue;
   roads.push({pts:resample(path,6),cls:2,source:'primary-corridor',bridges:[]});
  }
 });return roads;
}
function regraph(N){return H.planarize(N.roads.filter(function(r){return r.pts.length>1&&len(r.pts)>.5;}));}
function serviceRadius(){return 230*Math.sqrt(WEXT);}
function hasServiceCenter(F,p){var radius=serviceRadius();return F.centers.some(function(c){return c.kind!=='park'&&d(p,c)<=radius;});}
function atMapEdge(p){return p.x<30||p.y<30||p.x>WORLD_W-30||p.y>WORLD_H-30;}
function prune(N,F){
 var removedUnserved=0,removedShort=0;
 for(var pass=0;pass<3;pass++){
  var keep=N.roads.filter(function(r){var fromLeaf=N.adj[r.from].length===1,toLeaf=N.adj[r.to].length===1,dead=fromLeaf||toLeaf;if(!dead||r.source==='edge-portal'||r.source==='bridge-link')return true;
   var terminal=N.nodes[fromLeaf?r.from:r.to];if(atMapEdge(terminal))return true;
   if(r.length<42){removedShort++;return false;}
   if(r.cls===0&&!hasServiceCenter(F,terminal)){removedUnserved++;return false;}
   return true;
  });
  if(keep.length===N.roads.length)break;N=H.planarize(keep,F);
 }N.utilityPrune={unservedLocalTerminalsRemoved:removedUnserved,shortDeadEndsRemoved:removedShort};return N;
}
function edgeDirection(N,edge,node){var r=N.roads[edge],p=r.from===node?r.pts:r.pts.slice().reverse(),q=at(p,Math.min(18,len(p)));return norm(q.x-p[0].x,q.y-p[0].y);}
function outgoing(N,i){var e=N.adj[i][0];return edgeDirection(N,e.e,i);}
function networkDistance(N,start,end,limit){if(start===end)return 0;var D=new Float64Array(N.nodes.length);D.fill(Infinity);D[start]=0;var used=new Uint8Array(N.nodes.length);for(var k=0;k<N.nodes.length;k++){var u=-1,b=Infinity;for(var i=0;i<D.length;i++)if(!used[i]&&D[i]<b){b=D[i];u=i;}if(u<0||b>(limit||Infinity))break;if(u===end)return b;used[u]=1;N.adj[u].forEach(function(e){var nd=b+e.len;if(nd<D[e.to])D[e.to]=nd;});}return D[end];}
function validConnector(F,N,path,bridge){
 var A=path[0],B=path[path.length-1],idx=indexCache.get(N.roads);if(!idx){idx=H.makeIndex(N.roads);indexCache.set(N.roads,idx);}
 for(var i=1;i<path.length;i++){
  var a=path[i-1],b=path[i],box={x0:Math.floor(Math.min(a.x,b.x)/40),x1:Math.floor(Math.max(a.x,b.x)/40),y0:Math.floor(Math.min(a.y,b.y)/40),y1:Math.floor(Math.max(a.y,b.y)/40)},seen=new Set();
  for(var y=box.y0;y<=box.y1;y++)for(var x=box.x0;x<=box.x1;x++){
   var list=idx.cells.get(x+','+y)||[];
   for(var k=0;k<list.length;k++){var e=list[k];if(seen.has(e.id))continue;seen.add(e.id);var hit=segInt(a,b,e.a,e.b);
    if(!hit||d(hit,A)<1||d(hit,B)<1)continue;
    var u=norm(b.x-a.x,b.y-a.y),v=norm(e.b.x-e.a.x,e.b.y-e.a.y);
    if(Math.abs(u.x*v.y-u.y*v.x)<.60)return false;
    if(N.nodes.some(function(n){return d(n,hit)<22;}))return false;
   }
  }
  if(d(b,A)>25&&d(b,B)>25){var q=idx.near(b,9,-1);if(q){var e=N.roads[q.ri],c=e.pts[q.j],z=e.pts[q.j+1],u=norm(b.x-a.x,b.y-a.y),v=norm(z.x-c.x,z.y-c.y);if(Math.abs(u.x*v.x+u.y*v.y)>.94)return false;}}
 }return true;
}
function connect(F,N){
 var connections=0,bridges=0,loops=0;
 function ends(){return N.nodes.map(function(p,i){return{p:p,i:i};}).filter(function(a){return N.adj[a.i].length===1;});}
 function bridgeCheck(a,b){var runs=0,wet=false,span=0,max=0,n=Math.ceil(d(a,b)/3);for(var k=0;k<=n;k++){var p=mix(a,b,k/n),w=F.waterDist(p.x,p.y)<0;if(w&&!wet)runs++;if(w)span+=d(a,b)/n;else{max=Math.max(max,span);span=0;}wet=w;}max=Math.max(max,span);return runs===1&&max>4&&max<140*Math.sqrt(WEXT)&&F.waterDist(a.x,a.y)>18&&F.waterDist(b.x,b.y)>18;}
 function headingOK(a,b){var u=outgoing(N,a.i),v=outgoing(N,b.i),z=norm(b.p.x-a.p.x,b.p.y-a.p.y);return d(a.p,b.p)<24||(u.x*z.x+u.y*z.y>-.18&&-(v.x*z.x+v.y*z.y)>-.18);}
 function connectionPath(a,b){var L=d(a.p,b.p),u=outgoing(N,a.i),v=outgoing(N,b.i),C1=add(a.p,u,Math.min(L*.25,32)),C2=add(b.p,v,Math.min(L*.25,32)),p=[];for(var k=0,n=Math.ceil(L/4);k<=n;k++){var t=k/n;var aa=mix(a.p,C1,t),bb=mix(C1,C2,t),cc=mix(C2,b.p,t);p.push(mix(mix(aa,bb,t),mix(bb,cc,t),t));}return p.every(function(q){return F.waterDist(q.x,q.y)>14;})?p:[cp(a.p),cp(b.p)];}
 function link(a,b,source,custom){var p=custom||[cp(a),cp(b)];N.roads.push({pts:resample(p,5),cls:source==='bridge-link'?1:0,source:source,bridges:[]});N=H.planarize(N.roads,F);connections++;}
 // Kruskal-like component joining: deterministic shortest valid dry gaps first.
 for(var pass=0;pass<100&&N.components.length>1;pass++){
  var E=ends(),best=null;
  for(var i=0;i<E.length;i++)for(var j=i+1;j<E.length;j++){
   var a=E[i],b=E[j],L=d(a.p,b.p);if(N.component[a.i]===N.component[b.i]||L<1||L>340*Math.sqrt(WEXT))continue;
   var score=L;if(best&&score>=best.score)continue;if(!headingOK(a,b)||!dry(F,a.p,b.p,16))continue;var path=connectionPath(a,b);if(!validConnector(F,N,path,false))continue;best={a:a.p,b:b.p,score:score,path:path};
  }
  if(!best)break;link(best.a,best.b,'district-link',best.path);
 }
 // Real, explicit bank-to-bank links: never create a junction inside water.
 for(var pass=0;pass<4&&N.components.length>1;pass++){
  var E=ends(),best=null;
  for(var i=0;i<E.length;i++)for(var j=i+1;j<E.length;j++){
   var a=E[i],b=E[j],L=d(a.p,b.p);if(N.component[a.i]===N.component[b.i]||L>330*Math.sqrt(WEXT)||best&&L>=best.score)continue;
   if(headingOK(a,b)&&bridgeCheck(a.p,b.p)&&validConnector(F,N,[a.p,b.p],true))best={a:a.p,b:b.p,score:L};
  }if(!best)break;link(best.a,best.b,'bridge-link');bridges++;
 }
 // A second access, not hundreds of arbitrary attachments, between fabrics.
 var E=ends(),options=[];
 for(var i=0;i<E.length;i++)for(var j=i+1;j<E.length;j++){
  var a=E[i],b=E[j],L=d(a.p,b.p);if(L<30||L>145*Math.sqrt(WEXT)||N.component[a.i]!==N.component[b.i])continue;
  if(F.districtAt(a.p.x,a.p.y)===F.districtAt(b.p.x,b.p.y)||!headingOK(a,b)||!dry(F,a.p,b.p,16))continue;
  options.push({a:a,b:b,L:L});
 }options.sort(function(a,b){return a.L-b.L;});var used=new Set(),extra=[];
 options.forEach(function(o){if(used.has(o.a.i)||used.has(o.b.i)||extra.length>Math.max(2,Math.ceil(F.centers.length*.7)))return;var detour=networkDistance(N,o.a.i,o.b.i,o.L*4);if(!Number.isFinite(detour)||detour<o.L*1.75)return;var path=connectionPath(o.a,o.b);if(!validConnector(F,{nodes:N.nodes,roads:N.roads.concat(extra)},path,false))return;used.add(o.a.i);used.add(o.b.i);extra.push({pts:path,cls:0,source:'district-loop',bridges:[]});loops++;});
 if(extra.length)N=H.planarize(N.roads.concat(extra),F);
 N.changes={fabricConnections:connections,bankLinks:bridges,additionalLoops:loops};return N;
}
function portals(F,N){
 var extra=[];[[0,.32*WORLD_H],[WORLD_W,.67*WORLD_H],[.67*WORLD_W,0],[.32*WORLD_W,WORLD_H]].forEach(function(v){var a={x:v[0],y:v[1]},best=null;
  for(var move=0;move<6&&!best;move++){var t=move===0?0:Math.ceil(move/2)*35*(move%2?1:-1),p={x:a.x,y:a.y};if(a.x===0||a.x===WORLD_W)p.y=clamp(p.y+t,40,WORLD_H-40);else p.x=clamp(p.x+t,40,WORLD_W-40);
   if(F.waterDist(p.x,p.y)<24)continue;N.nodes.forEach(function(q,i){var L=d(p,q);if(L>240*Math.sqrt(WEXT)||best&&L>=best.L||N.adj[i].length!==1)return;var u=outgoing(N,i),v=norm(p.x-q.x,p.y-q.y);if(u.x*v.x+u.y*v.y<.1)return;if(dry(F,p,q,16)&&validConnector(F,N,[p,q],false))best={p:p,q:q,L:L};});
  }if(best)extra.push({pts:resample([cp(best.p),cp(best.q)],5),cls:1,source:'edge-portal',bridges:[]});
 });return extra.length?H.planarize(N.roads.concat(extra),F):N;
}
function finishEnds(F,N){
 for(var pass=0;pass<2;pass++){
  var index=H.makeIndex(N.roads),extensions=[];
  N.nodes.forEach(function(p,i){if(N.adj[i].length!==1)return;var u=outgoing(N,i),end=add(p,u,120*Math.sqrt(WEXT)),best=null,edge=N.adj[i][0].e;
   index.segments.forEach(function(s){if(s.ri===edge)return;var hit=segInt(p,end,s.a,s.b);if(!hit)return;var L=d(p,hit),v=norm(s.b.x-s.a.x,s.b.y-s.a.y);if(L<2||best&&L>=best.L||Math.abs(u.x*v.y-u.y*v.x)<.72)return;
    var q=cp(hit),near=-1;N.nodes.forEach(function(n,j){if(d(q,n)<18)near=j;});
    if(near>=0){if(d(q,N.nodes[near])>6||N.adj[near].length>=4)return;q=cp(N.nodes[near]);}
    if(dry(F,p,q,16))best={q:q,L:L};
   });
   if(best){extensions.push({pts:resample([cp(p),best.q],5),cls:0,source:'finished-frontage',bridges:[]});return;}
   // Cropped streets continue through the map edge instead of stopping in air.
   var ts=[];if(u.x<-.01)ts.push(-p.x/u.x);if(u.x>.01)ts.push((WORLD_W-p.x)/u.x);if(u.y<-.01)ts.push(-p.y/u.y);if(u.y>.01)ts.push((WORLD_H-p.y)/u.y);
   var t=Math.min.apply(null,ts.filter(function(t){return t>0;}));if(t>80*Math.sqrt(WEXT))return;var q=add(p,u,t);q.x=clamp(q.x,0,WORLD_W);q.y=clamp(q.y,0,WORLD_H);if(dry(F,p,q,16))extensions.push({pts:resample([cp(p),q],5),cls:0,source:'map-continuation',bridges:[]});
  });if(!extensions.length)break;N=H.planarize(N.roads.concat(extensions),F);
 }return N;
}
function resolveIsolated(F,N){
 var dropped=0,landLinks=0,cost=null;
 // A disconnected sliver is not a usable street. Remove it BEFORE parceling.
 var discard=new Set();N.components.slice(1).forEach(function(c){if(c.nodes.length<5&&c.length<1200)discard.add(c.id);});
 if(discard.size){N.roads=N.roads.filter(function(r){if(discard.has(N.component[r.from])){dropped++;return false;}return true;});N=H.planarize(N.roads,F);}
 for(var attempt=0;attempt<24&&N.components.length>1;attempt++){
  var main=N.components[0],mi=H.makeIndex(N.roads.filter(function(r){return N.component[r.from]===main.id;})),choices=[];
  N.components.slice(1).forEach(function(c){c.nodes.forEach(function(i){if(N.adj[i].length!==1)return;var p=N.nodes[i],hit=mi.near(p,550*Math.sqrt(WEXT),-1);if(hit&&hit.d>18)choices.push({i:i,p:p,q:hit,L:hit.d});});});choices.sort(function(a,b){return a.L-b.L;});
  if(!choices.length)break;
  if(!cost){cost=buildCostGrid(F);for(var y=0;y<AROWS;y++)for(var x=0;x<ACOLS;x++)if(F.waterDist((x+.5)*ACELL,(y+.5)*ACELL)<16)cost[y*ACOLS+x]=Infinity;}
  var added=false;
  for(var k=0;k<Math.min(choices.length,12)&&!added;k++){
   var c=choices[k],u=outgoing(N,c.i),lead=add(c.p,u,22);if(!dry(F,c.p,lead,16))continue;
   var path=H.routeAStar(cost,lead,c.q);if(!path||len(path)>c.L*4+120)continue;path.unshift(cp(c.p));path=smoothCorners(simplify(path,1),F,10);
   if(path.some(function(p){return F.waterDist(p.x,p.y)<12;}))continue;
   // Stop at the FIRST intersection with the main network, never weave over it.
   var stop=null;for(var j=1;j<path.length&&!stop;j++){
    var A=path[j-1],B=path[j],hits=[];mi.segments.forEach(function(t){var p=segInt(A,B,t.a,t.b);if(p&&d(c.p,p)>8)hits.push(p);});hits.sort(function(a,b){return a.t-b.t;});if(hits.length)stop={j:j,p:hits[0]};
   }
   if(stop)path=path.slice(0,stop.j).concat([cp(stop.p)]);
   var count=N.components.length,nn=H.planarize(N.roads.concat([{pts:resample(path,5),cls:1,source:'terrain-connector',bridges:[]}]),F);
   if(nn.components.length<count){N=nn;landLinks++;added=true;}
  }if(!added)break;
 }
 N.repair={droppedIsolatedSegments:dropped,terrainLinks:landLinks};return N;
}
function collapse(N,F){
 // Contract microscopic split links instead of drawing a row of node discs.
 for(var pass=0;pass<4;pass++){
  var parent=N.nodes.map(function(_,i){return i;}),busy=new Set(),changed=false;
  N.roads.slice().sort(function(a,b){return a.length-b.length;}).forEach(function(r){if(r.length>=28||busy.has(r.from)||busy.has(r.to)||N.adj[r.from].length+N.adj[r.to].length>6||!dry(F,N.nodes[r.from],N.nodes[r.to],18))return;
   parent[r.to]=r.from;busy.add(r.from);busy.add(r.to);changed=true;
  });if(!changed)break;
  var groups=new Map();parent.forEach(function(k,i){if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);});var pos=new Map();groups.forEach(function(ids,k){var p={x:0,y:0};ids.forEach(function(i){p.x+=N.nodes[i].x/ids.length;p.y+=N.nodes[i].y/ids.length;});pos.set(k,p);});
  var edges=[];N.roads.forEach(function(r){var a=parent[r.from],b=parent[r.to];if(a===b)return;var pts=r.pts.map(cp);pts[0]=cp(pos.get(a));pts[pts.length-1]=cp(pos.get(b));edges.push(Object.assign({},r,{pts:pts}));});N=H.planarize(edges,F);
 }
 return N;
}
function removeTinyCycles(N,F){
 var removed=0;
 for(var pass=0;pass<3;pass++){var drop=new Set(),lookup=new Map();N.roads.forEach(function(r,i){lookup.set(Math.min(r.from,r.to)+':'+Math.max(r.from,r.to),i);});
  for(var a=0;a<N.nodes.length;a++){var ns=N.adj[a].map(function(e){return e.to;});for(var i=0;i<ns.length;i++)for(var j=i+1;j<ns.length;j++){var b=ns[i],c=ns[j],bc=lookup.get(Math.min(b,c)+':'+Math.max(b,c));if(bc==null)continue;var ab=lookup.get(Math.min(a,b)+':'+Math.max(a,b)),ac=lookup.get(Math.min(a,c)+':'+Math.max(a,c));if(ab==null||ac==null)continue;var ids=[ab,ac,bc],roads=ids.map(function(id){return N.roads[id];});if(roads.some(function(r){return r.cls>0||r.source==='edge-portal'||r.source==='bridge-link';}))continue;var per=roads.reduce(function(t,r){return t+r.length;},0);if(per>=180*Math.sqrt(WEXT))continue;var longest=ids.slice().sort(function(x,y){return N.roads[y].length-N.roads[x].length;})[0];drop.add(longest);}}
  if(!drop.size)break;removed+=drop.size;N=H.planarize(N.roads.filter(function(_,i){return !drop.has(i);}),F);
 }N.tinyCyclesRemoved=removed;return N;
}
function turnAwarePath(N,F,start,end,cls){
 if(start===end)return[];var states=[],best=new Map(),prev=new Map(),heap=[];
 function sk(node,edge){return node+':'+edge;}
 function push(node,edge,cost){var k=sk(node,edge),old=best.get(k);if(old!=null&&old<=cost)return;best.set(k,cost);heap.push({node:node,edge:edge,cost:cost});}
 push(start,-1,0);var found=null;
 while(heap.length){heap.sort(function(a,b){return b.cost-a.cost;});var cur=heap.pop(),ck=sk(cur.node,cur.edge);if(best.get(ck)!==cur.cost)continue;if(cur.node===end){found=cur;break;}
  N.adj[cur.node].forEach(function(e){if(e.e===cur.edge)return;var r=N.roads[e.e],mid=at(r.pts,r.length/2),slope=F.topography?RoadAtlasConditions.debug.sample(F.topography.slope,mid.x,mid.y):0,turn=0;
   if(cur.edge>=0){var a=edgeDirection(N,cur.edge,cur.node),b=edgeDirection(N,e.e,cur.node),dot=clamp(a.x*b.x+a.y*b.y,-1,1);turn=(1+dot)*(1+dot)*(cls===2?92:42);}
   var sourceBias=(r.source==='edge-portal'?-8:r.source==='district-link'?-3:0),cost=cur.cost+e.len*(1+slope*.75)+turn+sourceBias,nk=sk(e.to,e.e);if(best.get(nk)==null||cost<best.get(nk)){prev.set(nk,ck);push(e.to,e.e,cost);}
  });
 }
 if(!found)return[];var edges=[],k=sk(found.node,found.edge);while(k){var parts=k.split(':'),edge=+parts[1];if(edge>=0)edges.push(edge);k=prev.get(k);}edges.reverse();return edges;
}
function stabilizeHierarchy(N){
 for(var pass=0;pass<4;pass++){var changed=false;N.nodes.forEach(function(_,i){var es=N.adj[i];if(es.length<2)return;es.forEach(function(e){var r=N.roads[e.e];if(r.cls<1)return;var u=edgeDirection(N,e.e,i),best=null;es.forEach(function(q){if(q.e===e.e)return;var v=edgeDirection(N,q.e,i),dot=u.x*v.x+u.y*v.y;if(!best||dot<best.dot)best={e:q.e,dot:dot};});if(best&&best.dot<-.84&&N.roads[best.e].cls<r.cls){N.roads[best.e].cls=r.cls;changed=true;}});});if(!changed)break;}return N;
}
function hierarchy(N,F,G){
 var nearest=function(p){var best=-1,L=Infinity;N.nodes.forEach(function(q,i){var z=d(p,q);if(z<L){L=z;best=i;}});return best;},main=nearest(F.downtown),usage=new Float64Array(N.roads.length);
 function promote(a,b,cls){if(a<0||b<0||N.component[a]!==N.component[b])return;var path=turnAwarePath(N,F,a,b,cls);path.forEach(function(e){if(e>=0){N.roads[e].cls=Math.max(N.roads[e].cls,cls);usage[e]++;}});}
 var edgeNodes=[];N.nodes.forEach(function(p,i){if((p.x<1||p.y<1||p.x>WORLD_W-1||p.y>WORLD_H-1)&&N.adj[i].some(function(e){return N.roads[e.e].source==='edge-portal';}))edgeNodes.push(i);});
 if(!N.roads.some(function(r){return r.source==='primary-corridor'&&r.cls===2;})){edgeNodes.slice(0,2).forEach(function(i){promote(main,i,2);});}edgeNodes.forEach(function(i){promote(main,i,1);});
 F.centers.forEach(function(c){if(c.kind!=='park')promote(main,nearest(c),1);});
 stabilizeHierarchy(N);for(var pass=0;pass<8;pass++){var changed=false;N.adj.forEach(function(es){if(es.length!==2)return;var a=N.roads[es[0].e],b=N.roads[es[1].e],c=Math.max(a.cls,b.cls);if(a.cls!==c||b.cls!==c){a.cls=c;b.cls=c;changed=true;}});if(!changed)break;}N.usage=Array.from(usage);return N;
}
function relaxPath(path,F,cls){
 var out=path.map(cp),clear=cls===2?18:cls===1?15:12;
 for(var pass=0;pass<4&&out.length>2;pass++){var next=[out[0]],changed=false;for(var i=1;i<out.length-1;i++){var a=next[next.length-1],b=out[i],c=out[i+1],u=norm(b.x-a.x,b.y-a.y),v=norm(c.x-b.x,c.y-b.y),angle=Math.acos(clamp(u.x*v.x+u.y*v.y,-1,1)),direct=d(a,c),walk=d(a,b)+d(b,c);
   var hairpin=angle>2.15&&direct<walk*.82,shortKink=angle>1.25&&Math.min(d(a,b),d(b,c))<24&&direct<walk*.9;
   if((hairpin||shortKink)&&dry(F,a,c,clear)){changed=true;continue;}next.push(b);
  }next.push(out[out.length-1]);out=next;if(!changed)break;}return out;
}
function mergeThrough(N,F){
 var seen=new Set(),roads=[];
 function follow(ri,start){var current=start,path=[],cls=N.roads[ri].cls,sources=[];
  while(!seen.has(ri)){
   seen.add(ri);var r=N.roads[ri],p=r.from===current?r.pts:r.pts.slice().reverse();path=path.concat(p.slice(path.length?1:0));sources.push(r.source);current=r.from===current?r.to:r.from;
   if(N.adj[current].length!==2)break;var next=N.adj[current].find(function(e){return!seen.has(e.e);});if(!next||N.roads[next.e].cls!==cls)break;ri=next.e;
  }
  path=relaxPath(simplify(path,.35),F,cls);path=smoothCorners(path,F,Math.max(8,widths[cls]+(cls===2?5:2)));if(len(path)>.1)roads.push({pts:resample(path,5),cls:cls,bridges:[],source:sources.includes('primary-corridor')?'primary-corridor':sources.includes('edge-portal')?'edge-portal':sources.includes('bridge-link')?'bridge-link':sources[0]});
 }
 N.nodes.forEach(function(p,i){if(N.adj[i].length!==2||N.roads[N.adj[i][0].e].cls!==N.roads[N.adj[i][1].e].cls)N.adj[i].forEach(function(e){if(!seen.has(e.e))follow(e.e,i);});});N.roads.forEach(function(r,i){if(!seen.has(i))follow(i,r.from);});return H.planarize(roads,F);
}
function build(F,G){
 var roads=primaryCorridors(F),kinds=F.centers.map(function(c){return c.kind;});
 try{F.centers.forEach(function(c){if(c.kind==='waterfront')c.kind='residential';});cityGrids(F,roads,function(){});}finally{F.centers.forEach(function(c,i){c.kind=kinds[i];});}
 if(!roads.length)throw new Error('No viable V1 city fabric');
 var N=H.planarize(roads,F);N=connect(F,N);var changes=N.changes;N=portals(F,N);N=finishEnds(F,N);N=collapse(N,F);N=removeTinyCycles(N,F);var tiny=N.tinyCyclesRemoved||0;N=resolveIsolated(F,N);var repair=N.repair;N=prune(N,F);var firstPrune=N.utilityPrune;N=hierarchy(N,F,G);N=mergeThrough(N,F);N=prune(N,F);var finalPrune=N.utilityPrune;N.changes=Object.assign({},changes,repair,{tinyCyclesRemoved:tiny,unservedLocalTerminalsRemoved:firstPrune.unservedLocalTerminalsRemoved+finalPrune.unservedLocalTerminalsRemoved,shortDeadEndsRemoved:firstPrune.shortDeadEndsRemoved+finalPrune.shortDeadEndsRemoved});return N;
}
function polyArea(p){var a=0;for(var i=0;i<p.length;i++){var q=p[(i+1)%p.length];a+=p[i].x*q.y-q.x*p[i].y;}return Math.abs(a)/2;}
function rings(ctx,poly){ctx.beginPath();poly.forEach(function(p,i){if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.closePath();}
function quad(a,c,b){var out=[];for(var i=1;i<=8;i++){var t=i/8;out.push(mix(mix(a,c,t),mix(c,b,t),t));}return out;}
function lineIntersection(a,u,b,v){var det=u.x*v.y-u.y*v.x;if(Math.abs(det)<1e-5)return null;var t=((b.x-a.x)*v.y-(b.y-a.y)*v.x)/det;return add(a,u,t);}
function cross(a,b,c){return(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);}
function hull(points){var pts=points.slice().sort(function(a,b){return a.x-b.x||a.y-b.y;}),lower=[],upper=[];pts.forEach(function(p){while(lower.length>1&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);});pts.slice().reverse().forEach(function(p){while(upper.length>1&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);});return lower.slice(0,-1).concat(upper.slice(0,-1));}
function simple(poly){for(var i=0;i<poly.length;i++)for(var j=i+1;j<poly.length;j++){if(j===i+1||i===0&&j===poly.length-1)continue;var a=poly[i],b=poly[(i+1)%poly.length],c=poly[j],z=poly[(j+1)%poly.length];if(d(a,b)<1e-6||d(c,z)<1e-6)continue;var p=segInt(a,b,c,z);if(p&&p.t>1e-6&&p.t<1-1e-6&&p.u>1e-6&&p.u<1-1e-6)return false;}return true;}
function circlePoly(p,r,n){var out=[];for(var i=0;i<(n||16);i++)out.push({x:p.x+Math.cos(i*TAU/(n||16))*r,y:p.y+Math.sin(i*TAU/(n||16))*r});return out;}
function junction(N,i,F){
 var p=N.nodes[i],edges=N.adj[i],degree=edges.length,short=Infinity,cls=0;
 edges.forEach(function(e){short=Math.min(short,e.len);cls=Math.max(cls,N.roads[e.e].cls);});
 var district=F.districtAt?F.districtAt(p.x,p.y):null,edgeTerminal=p.x<12||p.y<12||p.x>WORLD_W-12||p.y>WORLD_H-12,culdesac=degree===1&&cls===0&&short>48&&!edgeTerminal&&district&&district.kind==='residential'&&F.waterDist(p.x,p.y)>28&&hash2i(Math.round(p.x),Math.round(p.y),117)>0.38;
 var ports=edges.map(function(e){var r=N.roads[e.e],pts=r.from===i?r.pts:r.pts.slice().reverse(),cut=degree>=3?Math.min(widths[cls]/2+settings.radius+2,r.length*.28):0,q=at(pts,cut),u=norm(q.x-p.x,q.y-p.y);if(!cut)u=at(pts,Math.min(10,r.length)).u;var n={x:-u.y,y:u.x},h=widths[r.cls]/2;
  return{edge:e.e,from:i,cut:cut,center:cp(q),direction:u,width:2*h,cls:r.cls,angle:Math.atan2(u.y,u.x),minus:add(q,n,-h),plus:add(q,n,h)};
 }).sort(function(a,b){return a.angle-b.angle;});
 var gaps=ports.map(function(a,k){return(ports[(k+1)%ports.length].angle-a.angle+TAU)%TAU;}),through=[];
 if(degree>=2){var best=null;for(var a=0;a<ports.length;a++)for(var b=a+1;b<ports.length;b++){var dot=ports[a].direction.x*ports[b].direction.x+ports[a].direction.y*ports[b].direction.y,straight=-dot,score=straight*4+(ports[a].cls+ports[b].cls)*1.5-Math.abs(ports[a].cls-ports[b].cls)*.35;if(!best||score>best.score)best={a:a,b:b,dot:dot,score:score};}if(best&&best.dot<-.65)through=[ports[best.a].edge,ports[best.b].edge];}
 var type;if(culdesac)type='culdesac';else if(degree===1)type='terminal';else if(degree===2)type=(through.length?'continuation':'bend');else if(degree===3){var side=ports.filter(function(q){return through.indexOf(q.edge)<0;}),major=through.length&&ports.filter(function(q){return through.indexOf(q.edge)>=0;}).every(function(q){return q.cls>=Math.max.apply(null,side.map(function(z){return z.cls;}));});type=through.length&&major?'T':'Y';}else if(degree===4)type=through.length?'X':'complex';else type='complex';
 var outline=[];
 if(culdesac){var rr=Math.max(7,widths[0]*.95);outline=circlePoly(p,rr,18);}
 else if(degree>=3)ports.forEach(function(a,k){var b=ports[(k+1)%ports.length],gap=gaps[k];outline.push(a.minus,a.plus);var c=lineIntersection(a.plus,a.direction,b.minus,b.direction);
  if(gap<Math.PI-.08&&gap>.6&&c&&d(c,p)<Math.max(a.cut,b.cut)*1.8)outline=outline.concat(quad(a.plus,c,b.minus));else outline.push(b.minus);
 });
 outline=outline.filter(function(q,k){return !k||d(q,outline[k-1])>1e-6;});if(outline.length&&d(outline[0],outline[outline.length-1])<1e-6)outline.pop();var fallback=false;if(degree>=3&&outline.length&&(!simple(outline)||Math.min.apply(null,gaps)<.75)){outline=hull(ports.reduce(function(a,p){return a.concat([p.minus,p.plus]);},[]));fallback=true;}
 var r=outline.reduce(function(m,q){return Math.max(m,d(p,q));},0);
 return{x:p.x,y:p.y,node:i,deg:degree,cls:cls,type:type,ports:ports,polygon:outline,r:r,crosswalks:[],minimumAngle:gaps.length?Math.min.apply(null,gaps):TAU,throughEdges:through,conservativeEnvelope:fallback};
}
function geometry(N,F){
 var joints=N.nodes.map(function(p,i){return junction(N,i,F);}),roads=N.roads.map(function(r,i){var a=joints[r.from].ports.find(function(p){return p.edge===i;}),b=joints[r.to].ports.find(function(p){return p.edge===i;}),pts=slice(r.pts,a.cut,r.length-b.cut);return Object.assign({},r,{pts:pts,bridges:bridgeRuns(F,r.pts),startCut:a.cut,endCut:b.cut,width:widths[r.cls]});});
 var cross=[],occupied=[];
 joints.forEach(function(j){if(j.deg<3||j.deg>4||j.minimumAngle<.7||F.waterDist(j.x,j.y)<30||j.type==='Y'||j.type==='complex')return;
  var eligible=j.ports.filter(function(port){var r=N.roads[port.edge];if(r.cls===0&&j.cls===0)return false;if(j.type==='T')return j.throughEdges.indexOf(port.edge)<0;if(j.type==='X'&&j.throughEdges.length){var side=j.ports.filter(function(q){return j.throughEdges.indexOf(q.edge)<0;}),dominant=side.some(function(q){return q.cls<j.cls;});if(dominant)return j.throughEdges.indexOf(port.edge)<0;return j.ports.indexOf(port)%2===0;}return false;});
  eligible.forEach(function(port){var r=N.roads[port.edge],path=r.from===j.node?r.pts:r.pts.slice().reverse(),other=joints[r.from===j.node?r.to:r.from],otherPort=other.ports.find(function(p){return p.edge===port.edge;}),s=port.cut+6;
   if(r.length<s+otherPort.cut+18)return;var p=at(path,s),a=at(path,s-3),b=at(path,s+3);if(a.u.x*b.u.x+a.u.y*b.u.y<.995||F.waterDist(p.x,p.y)<25)return;
   var u=p.u,n={x:-u.y,y:u.x},h=port.width/2-.6,box=[add(add(p,u,-2.6),n,-h),add(add(p,u,2.6),n,-h),add(add(p,u,2.6),n,h),add(add(p,u,-2.6),n,h)];
   if(occupied.some(function(o){return d(o.p,p)<o.r+Math.hypot(h,2.6)+2;}))return;
   var bars=[];for(var t=-h+.7;t<h-.3;t+=2.4){var c=add(p,n,t),hw=Math.min(.65,h-t);bars.push([add(add(c,u,-2.5),n,-hw),add(add(c,u,2.5),n,-hw),add(add(c,u,2.5),n,hw),add(add(c,u,-2.5),n,hw)]);}
   if(!bars.length)return;var cw={node:j.node,edge:port.edge,distance:s,center:cp(p),outline:box,bars:bars};j.crosswalks.push(cw);cross.push(cw);occupied.push({p:p,r:Math.hypot(h,2.6)});
  });
 });
 var kit={version:VERSION,templates:{widths:widths.slice(),cornerRadius:settings.radius,units:'illustrative V1 world units',families:['continuation','bend','T','Y','X','complex','terminal','culdesac','bank-link']},junctions:joints,crosswalks:cross,changes:N.changes};
 validateKit(N,roads,kit);return{roads:roads,nodes:joints.filter(function(j){return j.deg>=3||j.type==='culdesac';}),streetKit:kit};
}
// Reject invalid assemblies before the pipeline publishes or packs objects.
function validateKit(N,roads,K){
 var seen=new Set();
 function finite(p){return Number.isFinite(p.x)&&Number.isFinite(p.y);}
 K.junctions.forEach(function(j){
  if(j.ports.length!==N.adj[j.node].length||new Set(j.ports.map(function(p){return p.edge;})).size!==j.ports.length)throw new Error('Invalid junction port ownership');
  if((j.deg>=3||j.type==='culdesac')&&(!j.polygon.every(finite)||polyArea(j.polygon)<=0||!simple(j.polygon)))throw new Error('Invalid junction envelope');
  j.ports.forEach(function(p){var e=N.roads[p.edge],r=roads[p.edge],q=e.from===j.node?r.pts[0]:r.pts[r.pts.length-1];if(!q||!finite(p.center)||d(q,p.center)>.03||p.width!==widths[e.cls])throw new Error('Disconnected junction mouth');});
 });
 K.crosswalks.forEach(function(c){var id=c.node+':'+c.edge,j=K.junctions[c.node];if(seen.has(id)||j.deg<3||!c.outline.every(finite))throw new Error('Invalid crossing ownership');seen.add(id);});
 return true;
}
function cssScale(ctx){if(!ctx.canvas.classList.contains('ra-map-detail'))return 1;var r=document.getElementById('stage').getBoundingClientRect(),m=ctx.getTransform();return Math.max(.001,Math.hypot(m.a,m.b)/(ctx.canvas.width/Math.max(1,r.width)));}
function drawRoads(ctx,W){var K=W.streetKit,T=THEMES[clamp(Math.round(P.theme),0,2)],night=P.theme===1,blue=P.theme===2,asphalt=night?'#334652':blue?'#326884':'#b8b8a8',curb=night?'#6b817f':blue?'#8eafc3':'#eee4cd',mark=night?'#e0e0d1':blue?'#ebf5f6':'#ffffee',major=night?'#556e6e':blue?'#50859b':'#a5a990';
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowBlur=0;
 // Every curb first, then every surface: no dark casing crosses a junction.
 W.roads.forEach(function(r){ctx.strokeStyle=curb;ctx.lineWidth=r.width+3;strokePts(ctx,r.pts);});
 K.junctions.forEach(function(j){if(j.polygon.length){rings(ctx,j.polygon);ctx.fillStyle=asphalt;ctx.fill();ctx.strokeStyle=curb;ctx.lineWidth=3;ctx.stroke();}});
 W.roads.forEach(function(r){ctx.strokeStyle=r.cls===2?major:asphalt;ctx.lineWidth=r.width;strokePts(ctx,r.pts);});
 K.junctions.forEach(function(j){if(j.polygon.length){rings(ctx,j.polygon);ctx.fillStyle=j.cls===2?major:asphalt;ctx.fill();}});
 W.roads.forEach(function(r){
  if(r.bridges&&r.bridges.length)r.bridges.forEach(function(run){if(run.length<2)return;ctx.lineWidth=.9;ctx.strokeStyle=night?'#aecac4':'#667b79';strokePts(ctx,offsetPts(run,r.width/2+1));strokePts(ctx,offsetPts(run,-r.width/2-1));});
  if(r.cls===0)return;
  var path=slice(r.pts,10,Math.max(10,len(r.pts)-10));if(path.length<2)return;ctx.lineWidth=.7;ctx.strokeStyle=mark;ctx.setLineDash([5,6]);strokePts(ctx,path);ctx.setLineDash([]);
 });
 ctx.fillStyle=mark;K.crosswalks.forEach(function(c){c.bars.forEach(function(bar){rings(ctx,bar);ctx.fill();});});
 ctx.restore();drawLabels(ctx,W);
}
function drawLabels(ctx,W){if(!P.labelsOn||!W.names)return;var T=THEMES[clamp(Math.round(P.theme),0,2)],scale=1;
 if(ctx.canvas.classList.contains('ra-map-detail')){var viewport=document.getElementById('stage').getBoundingClientRect();scale=ctx.getTransform().a/(ctx.canvas.width/Math.max(1,viewport.width));}
 scale=cssScale(ctx);var fs=16/scale,small=11/scale,placed=[],matrix=ctx.getTransform();
 var box={x0:-matrix.e/matrix.a,y0:-matrix.f/matrix.d,x1:(ctx.canvas.width-matrix.e)/matrix.a,y1:(ctx.canvas.height-matrix.f)/matrix.d};
 function label(text,x,y,size,angle,district){if(x<box.x0+20/scale||x>box.x1-20/scale||y<box.y0+20/scale||y>box.y1-20/scale||W.F.waterDist(x,y)<14)return;ctx.font=(district?'600 ':'400 ')+size+'px system-ui,sans-serif';var width=ctx.measureText(text).width,h=size*1.6;
  if(placed.some(function(p){return Math.abs(x-p.x)<(width+p.w)/2+12/scale&&Math.abs(y-p.y)<(h+p.h)/2+10/scale;}))return;
  placed.push({x:x,y:y,w:width,h:h});ctx.save();ctx.translate(x,y);ctx.rotate(angle||0);ctx.lineWidth=2.6/scale;ctx.strokeStyle=T.halo;ctx.fillStyle=T.label;ctx.strokeText(text,0,0);ctx.fillText(text,0,0);ctx.restore();
 }
 ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';try{ctx.letterSpacing='0px';}catch(e){}
 W.names.districts.forEach(function(n){label(n.name,n.x,n.y,fs,0,true);});
 W.names.streets.forEach(function(n){var a=n.ang;if(a>Math.PI/2)a-=Math.PI;if(a< -Math.PI/2)a+=Math.PI;label(n.name,n.x,n.y,small,a,false);});ctx.restore();
}
function metrics(W){var N=W.network,F=W.F,index=H.makeIndex(N.roads),eligible=0,covered=0,tiles=[],r=100*Math.sqrt(WEXT),terminalRadius=serviceRadius(),localTerminalCount=0,unservedLocalTerminals=0;
 for(var y=0;y<10;y++)for(var x=0;x<16;x++){var p={x:(x+.5)*WORLD_W/16,y:(y+.5)*WORLD_H/10};if(F.waterDist(p.x,p.y)<20||F.districtAt(p.x,p.y).kind==='park'){tiles.push({x:x,y:y,eligible:false});continue;}eligible++;var hit=index.near(p,r,-1),ok=!!hit;if(ok)covered++;tiles.push({x:x,y:y,eligible:true,served:ok,distance:hit?+hit.d.toFixed(2):null});}
 N.nodes.forEach(function(p,i){if(N.adj[i].length!==1||N.roads[N.adj[i][0].e].cls!==0||atMapEdge(p))return;localTerminalCount++;if(!hasServiceCenter(F,p))unservedLocalTerminals++;});
 var types={},turnSum=0,turnCount=0,primary=0;N.roads.forEach(function(r){if(r.source==='primary-corridor')primary++;});W.streetKit.junctions.forEach(function(j){types[j.type]=(types[j.type]||0)+1;if(j.throughEdges&&j.throughEdges.length===2){var a=j.ports.find(function(p){return p.edge===j.throughEdges[0];}),b=j.ports.find(function(p){return p.edge===j.throughEdges[1];});if(a&&b&&a.cls===2&&b.cls===2){turnSum+=Math.acos(clamp(-(a.direction.x*b.direction.x+a.direction.y*b.direction.y),-1,1))*180/Math.PI;turnCount++;}}});return{coverageSamples:eligible,coveredSamples:covered,coverageShare:eligible?covered/eligible:0,samplingRadiusWorldUnits:r,tiles:tiles,junctionTypes:types,crosswalkGroups:W.streetKit.crosswalks.length,components:N.components.length,primaryCorridorSegments:primary,meanArterialDeflectionDeg:turnCount?turnSum/turnCount:0,tinyCyclesRemoved:(N.changes&&N.changes.tinyCyclesRemoved)||0,localTerminalCount:localTerminalCount,unservedLocalTerminals:unservedLocalTerminals,serviceableLocalTerminalShare:localTerminalCount?1-unservedLocalTerminals/localTerminalCount:1,terminalServiceRadiusWorldUnits:terminalRadius,unservedLocalTerminalsRemoved:(N.changes&&N.changes.unservedLocalTerminalsRemoved)||0,shortDeadEndsRemoved:(N.changes&&N.changes.shortDeadEndsRemoved)||0};
}
function refresh(){var e=document.getElementById('streetsStatus');if(!e)return;if(!world||!world.streetKit){e.textContent='Previous ordered streets; original comparison retained.';return;}var m=world.streetKit.metrics;e.textContent=m.coveredSamples+'/'+m.coverageSamples+' eligible map samples near a road · '+m.components+' component(s) · '+m.crosswalkGroups+' crossing groups · '+Math.round(m.serviceableLocalTerminalShare*100)+'% of local dead ends near a service district · '+m.unservedLocalTerminalsRemoved+' unserved ends removed.';}
window.RoadAtlasStreets={version:VERSION,isEnabled:function(){return settings.enabled;},prepare:prepare,build:build,geometry:geometry,draw:drawRoads,cssScale:cssScale,metrics:metrics,refresh:refresh,queryParameters:function(u){u.searchParams.set('streets',settings.enabled?'connected':'previous');u.searchParams.set('corners',settings.radius);return u;},exportData:function(W){return W.streetKit||null;},getSettings:function(){return Object.assign({},settings);},setRadius:function(v){if(!Number.isFinite(+v))return;settings.radius=clamp(+v,4,14);regenerate();},setEnabled:function(v){settings.enabled=!!v;regenerate();},debug:{junction:junction,geometry:geometry,at:at,slice:slice,dry:dry,polyArea:polyArea,validateKit:validateKit}};
var panel=document.getElementById('analysisPanel'),section=document.createElement('details');section.className='cond-detail';section.innerHTML='<summary>Street assembly · 2.5.1</summary><label>Network build<select id="streetAssembly"><option value="connected">Connected, map-wide fabric</option><option value="previous">Previous ordered streets</option></select></label><label>Corner rounding <output id="streetRadiusValue"></output><input id="streetRadius" type="range" min="4" max="14" step="1"></label><p class="cond-note">Road hierarchy favors continuous corridors, coherent neighborhood axes, T-junctions and residential access. Short local dead ends are retained when they serve a nearby non-park district; unsupported local ends are removed. Junction geometry remains parametric, not fixed tiles.</p><p class="cond-note" id="streetsStatus"></p>';panel.appendChild(section);var sel=document.getElementById('streetAssembly');sel.value=settings.enabled?'connected':'previous';sel.onchange=function(){settings.enabled=sel.value==='connected';regenerate();};var radius=document.getElementById('streetRadius'),value=document.getElementById('streetRadiusValue');radius.value=settings.radius;value.value=settings.radius;radius.oninput=function(){value.value=radius.value;};radius.onchange=function(){RoadAtlasStreets.setRadius(radius.value);};
// A first control tap after panning can be consumed as hover by touch browsers.
// One deliberate pointer-up activates once; compatibility click is deduplicated.
var controls=document.querySelector('.ra-camera-controls');
if(controls){var touchStart=null,suppressed=null;
 controls.addEventListener('pointerdown',function(e){var b=e.target.closest('button');if(e.pointerType!=='mouse'&&b&&!b.disabled)touchStart={id:e.pointerId,b:b,x:e.clientX,y:e.clientY};});
 controls.addEventListener('pointercancel',function(){touchStart=null;});
 controls.addEventListener('pointerup',function(e){var t=touchStart;touchStart=null;if(!t||e.pointerId!==t.id||e.target.closest('button')!==t.b||Math.hypot(e.clientX-t.x,e.clientY-t.y)>8)return;e.preventDefault();suppressed=null;t.b.click();suppressed={b:t.b,until:performance.now()+700};});
 controls.addEventListener('click',function(e){if(e.isTrusted&&e.detail>0&&suppressed&&e.target.closest('button')===suppressed.b&&performance.now()<suppressed.until){e.preventDefault();e.stopImmediatePropagation();}},true);
}
})();
