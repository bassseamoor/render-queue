/* Road Atlas 2.1 — dependency-ordered orchestration of the V1 generator.
 * Baseline: 329a68a46c825cc96708c377638f7c5415f14a96. World units, themes,
 * field synthesis, district grids, block extraction and packing are retained.
 * Geometry is committed BEFORE occupancy, buildings, transit or statistics.
 * No real-world transport/civil-engineering claim: this is procedural content.
 */
(function () {
'use strict';
var VERSION='2.2.0', oldRegenerate=regenerate;
var mode=new URLSearchParams(location.search).get('pipeline')==='legacy'?'legacy':'ordered';
var trace=[], failures=[], generated=null;
var originalMakeRng=makeRng;
makeRng=function(seed,stream){
 // Palette and label controls are presentation, not causes of new streets.
 if(mode==='ordered'&&/^RA1-[0-9a-z]{12}$/i.test(seed))seed=seed.slice(0,12)+'01'+seed.slice(14);
 return originalMakeRng(seed,stream);
};
function copy(p){return {x:p.x,y:p.y};}
function length(pts){var d=0;for(var i=1;i<pts.length;i++)d+=Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y);return d;}
function key(p){return Math.round(p.x*100)+','+Math.round(p.y*100);}
function stage(name,fn){var t=performance.now(),v=fn();trace.push({name:name,ms:+(performance.now()-t).toFixed(2)});return v;}
function project(p,a,b){var dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;
 var q={x:a.x+t*dx,y:a.y+t*dy};q.t=t;q.d=Math.hypot(p.x-q.x,p.y-q.y);return q;}
function drySegment(F,a,b,clearance){var n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4));for(var i=0;i<=n;i++)if(F.waterDist(lerp(a.x,b.x,i/n),lerp(a.y,b.y,i/n))<clearance)return false;return true;}
function makeIndex(roads){
 var cells=new Map(),segments=[],cell=40;
 roads.forEach(function(r,ri){for(var j=1;j<r.pts.length;j++){
  var a=r.pts[j-1],b=r.pts[j];if(dist2(a.x,a.y,b.x,b.y)<1e-8)continue;
  var s={a:a,b:b,ri:ri,j:j-1,id:segments.length};segments.push(s);
  for(var y=Math.floor(Math.min(a.y,b.y)/cell);y<=Math.floor(Math.max(a.y,b.y)/cell);y++)for(var x=Math.floor(Math.min(a.x,b.x)/cell);x<=Math.floor(Math.max(a.x,b.x)/cell);x++){
   var k=x+','+y;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(s);
  }
 }});
 return {segments:segments,cells:cells,roads:roads,near:function(p,radius,skip){var best=null,seen=new Set();
  for(var y=Math.floor((p.y-radius)/cell);y<=Math.floor((p.y+radius)/cell);y++)for(var x=Math.floor((p.x-radius)/cell);x<=Math.floor((p.x+radius)/cell);x++){
   var list=cells.get(x+','+y)||[];list.forEach(function(s){if(seen.has(s.id)||s.ri===skip)return;seen.add(s.id);var q=project(p,s.a,s.b);if(q.d<=radius&&(!best||q.d<best.d)){best={x:q.x,y:q.y,d:q.d,t:q.t,ri:s.ri,j:s.j};}});
  }return best;
 }};
}
/* V1 heap A*, repaired: closed cells are not terrain obstacles; duplicate heap
 * entries do not consume the expansion budget; heuristic uses minimum cost. */
function routeAStar(cost,A,B){
 var W=ACOLS,H=AROWS,N=W*H,si=clamp(Math.floor(A.y/ACELL),0,H-1)*W+clamp(Math.floor(A.x/ACELL),0,W-1),ti=clamp(Math.floor(B.y/ACELL),0,H-1)*W+clamp(Math.floor(B.x/ACELL),0,W-1);
 var g=new Float64Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),closed=new Uint8Array(N),heap=[],min=Infinity;
 for(var m=0;m<N;m++)if(cost[m]>=0)min=Math.min(min,cost[m]);if(!Number.isFinite(min))return null;
 function h(i){var dx=Math.abs(i%W-ti%W),dy=Math.abs((i/W|0)-(ti/W|0));return (Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy))*min;}
 function push(i,f){var k=heap.length;heap.push({i:i,f:f});while(k){var p=(k-1)>>1;if(heap[p].f<=f)break;heap[k]=heap[p];k=p;}heap[k]={i:i,f:f};}
 function pop(){var a=heap[0],z=heap.pop();if(heap.length){var k=0;while(2*k+1<heap.length){var c=2*k+1;if(c+1<heap.length&&heap[c+1].f<heap[c].f)c++;if(heap[c].f>=z.f)break;heap[k]=heap[c];k=c;}heap[k]=z;}return a.i;}
 var dx=[1,1,0,-1,-1,-1,0,1],dy=[0,1,1,1,0,-1,-1,-1];g[si]=0;push(si,h(si));
 while(heap.length){var u=pop();if(closed[u])continue;closed[u]=1;if(u===ti)break;var x=u%W,y=u/W|0;
  for(var d=0;d<8;d++){var nx=x+dx[d],ny=y+dy[d];if(nx<0||ny<0||nx>=W||ny>=H)continue;var v=ny*W+nx;
   if(closed[v]||!Number.isFinite(cost[v]))continue;
   if(d%2&&(!Number.isFinite(cost[y*W+nx])||!Number.isFinite(cost[ny*W+x])))continue;
   var ng=g[u]+(d%2?Math.SQRT2:1)*(cost[u]+cost[v])*0.5;if(ng<g[v]){g[v]=ng;prev[v]=u;push(v,ng+h(v));}
  }
 }
 if(!closed[ti])return null;var p=[];for(var u=ti;u!==-1;u=prev[u]){p.push({x:(u%W+.5)*ACELL,y:((u/W|0)+.5)*ACELL});if(u===si)break;}
 p.reverse();p[0]=copy(A);if(p.length===1)p.push(copy(B));else p[p.length-1]=copy(B);return p;
}
function shapePath(pts,iterations){
 // V1 smoothing and sampling; no forward curvature pass followed by a last-
 // point teleport. Both endpoints remain constraints throughout smoothing.
 if(!pts||pts.length<2)return null;var a=copy(pts[0]),b=copy(pts[pts.length-1]);
 var out=resample(chaikin(pts.map(copy),iterations),8);out[0]=a;out[out.length-1]=b;
 return out.filter(function(p,i){return !i||dist2(p.x,p.y,out[i-1].x,out[i-1].y)>1e-8;});
}
function fields(){var F=buildFields(state.seed);
 // A district/terminal cannot be placed in water. Keep the V1 district objects
 // so the tensor and Voronoi closures continue using the same references.
 F.centers.forEach(function(c){if(F.waterDist(c.x,c.y)>=26)return;var best=null,bd=Infinity;
  for(var rad=30;rad<=240&&!best;rad+=15)for(var a=0;a<32;a++){var p={x:c.x+Math.cos(a*TAU/32)*rad,y:c.y+Math.sin(a*TAU/32)*rad};
   if(p.x<40||p.y<40||p.x>WORLD_W-40||p.y>WORLD_H-40||F.waterDist(p.x,p.y)<26)continue;
   var d=dist2(c.x,c.y,p.x,p.y);if(d<bd){bd=d;best=p;}}
  if(best){c.x=best.x;c.y=best.y;}
 });return F;
}
function initialRoads(F,G){
 var cost=buildCostGrid(F),roads=[],occ=new Uint8Array(OCCW*OCCH);
 function mark(x,y,cls){var gx=clamp(Math.floor(x/OCCCELL),0,OCCW-1),gy=clamp(Math.floor(y/OCCCELL),0,OCCH-1),i=gy*OCCW+gx;occ[i]=Math.max(occ[i],cls+1);}
 function add(A,B,cls,source){var path=routeAStar(cost,A,B);if(!path){failures.push('Unroutable '+source);return;}var pts=shapePath(path,2);if(!pts||length(pts)<5)return;
  roads.push({pts:pts,cls:cls,source:source,bridges:[],a:-1,b:-1});pts.forEach(function(p){mark(p.x,p.y,cls);});}
 stage('Primary corridors',function(){
  var gates=G.anchors.filter(function(a){return a.role==='gate';}).sort(function(a,b){return Math.atan2(a.y-F.downtown.y,a.x-F.downtown.x)-Math.atan2(b.y-F.downtown.y,b.x-F.downtown.x);});
  if(gates.length){var pairs=[[F.downtown,gates[0]]];if(gates.length>1)pairs.push([gates[0],gates[gates.length-1]]);if(gates.length>2)pairs.push([F.downtown,gates[Math.floor(gates.length/2)]]);
   pairs.slice(0,WEXT>1.5?3:2).forEach(function(p){if(Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)>=F.R*.9)add(p[0],p[1],2,'trunk');});}
  G.edges.filter(function(e){return e.route;}).sort(function(a,b){return b.cls-a.cls||a.a-b.a||a.b-b.b;}).forEach(function(e){add(G.pts[e.a],G.pts[e.b],e.cls,'macro');});
 });
 stage('V1 district grids',function(){
  // Waterfront was entirely skipped by V1's grid pass and relied on free
  // streamlines later. Supply its dry neighborhood fabric BEFORE connectivity.
  var kinds=F.centers.map(function(c){return c.kind;});
  try{F.centers.forEach(function(c){if(c.kind==='waterfront')c.kind='residential';});buildDistrictGrids(F,roads,mark);}
  finally{F.centers.forEach(function(c,i){c.kind=kinds[i];});}
 });
 stage('Attached local infill',function(){
  var rng=makeRng(state.seed,'locals'),count=Math.round(24*P.roadDensity*Math.pow(WEXT,1.5)),index=makeIndex(roads);
  for(var k=0,accepted=0;k<count*8&&accepted<count;k++){
   var a=rng()*TAU,rad=Math.sqrt(rng())*F.R*.98,p={x:F.cx+Math.cos(a)*rad,y:F.cy+Math.sin(a)*rad*.8};
   if(F.waterDist(p.x,p.y)<30||index.near(p,40,-1))continue;
   var base=F.tensorAngle(p.x,p.y),line=stream(F,index,p,base),pts=shapePath(line,1);if(!pts||length(pts)<55)continue;
   var start=index.near(pts[0],36,-1),end=index.near(pts[pts.length-1],36,-1);
   if(!start&&!end)continue; // Do not paint a disconnected decorative street.
   if(start&&drySegment(F,pts[0],start,14))pts[0]={x:start.x,y:start.y};
   if(end&&drySegment(F,pts[pts.length-1],end,14))pts[pts.length-1]={x:end.x,y:end.y};
   if(!pts.every(function(p){return F.waterDist(p.x,p.y)>=10;}))continue;
   roads.push({pts:pts,cls:0,bridges:[],source:'infill',a:-1,b:-1});accepted++;index=makeIndex(roads);
  }
 });return roads;
}
function stream(F,index,start,base){
 function walk(heading){var out=[],p=copy(start);for(var i=0;i<34;i++){
   var t=F.tensorAngle(p.x,p.y),rev=t+Math.PI;if(Math.abs(angDiff(heading,rev))<Math.abs(angDiff(heading,t)))t=rev;
   heading+=clamp(angDiff(heading,t),-.22,.22);var q={x:p.x+Math.cos(heading)*12,y:p.y+Math.sin(heading)*12};
   if(q.x<35||q.y<35||q.x>WORLD_W-35||q.y>WORLD_H-35||F.waterDist(q.x,q.y)<20||dist2(q.x,q.y,F.cx,F.cy)>F.R*F.R*1.2)break;
   if(out.some(function(v,j){return j<out.length-6&&dist2(v.x,v.y,q.x,q.y)<25*25;}))break;
   var near=index.near(q,18,-1);if(near&&out.length>1&&drySegment(F,q,near,10)){out.push({x:near.x,y:near.y});break;}
   out.push(q);p=q;
  }return out;}
 return walk(base+Math.PI).reverse().concat([copy(start)],walk(base));
}
/* Construct actual shared vertices at ALL crossings, including macro/local
 * crossings. Decorative junction drawing is not allowed to define graph truth. */
function planarize(roads,F){
 var idx=makeIndex(roads),cuts=roads.map(function(r){return [{f:0,p:r.pts[0]},{f:r.pts.length-1,p:r.pts[r.pts.length-1]}];}),pairs=new Set();
 idx.cells.forEach(function(list){for(var a=0;a<list.length;a++)for(var b=a+1;b<list.length;b++){
  var s=list[a],t=list[b];if(s.ri===t.ri&&Math.abs(s.j-t.j)<=1)continue;var pk=Math.min(s.id,t.id)+','+Math.max(s.id,t.id);if(pairs.has(pk))continue;pairs.add(pk);
  if(Math.max(s.a.x,s.b.x)+.01<Math.min(t.a.x,t.b.x)||Math.max(t.a.x,t.b.x)+.01<Math.min(s.a.x,s.b.x)||Math.max(s.a.y,s.b.y)+.01<Math.min(t.a.y,t.b.y)||Math.max(t.a.y,t.b.y)+.01<Math.min(s.a.y,s.b.y))continue;
  var dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,ex=t.b.x-t.a.x,ey=t.b.y-t.a.y,det=dx*ey-dy*ex;
  if(Math.abs(det)>1e-7){var qx=t.a.x-s.a.x,qy=t.a.y-s.a.y,u=(qx*ey-qy*ex)/det,v=(qx*dy-qy*dx)/det;
   if(u< -1e-7||u>1+1e-7||v< -1e-7||v>1+1e-7)continue;u=clamp(u,0,1);v=clamp(v,0,1);var p={x:s.a.x+u*dx,y:s.a.y+u*dy};
   if(F&&F.waterDist(p.x,p.y)<-2)continue;cuts[s.ri].push({f:s.j+u,p:p});cuts[t.ri].push({f:t.j+v,p:p});
  }else{ // Split collinear overlaps at endpoints, then deduplicate equal edges.
   [[s,t],[t,s]].forEach(function(ab){[ab[0].a,ab[0].b].forEach(function(p){var q=project(p,ab[1].a,ab[1].b);if(q.d<.01)cuts[ab[1].ri].push({f:ab[1].j+q.t,p:copy(p)});});});
  }
 }});
 var nodes=[],nodeMap=new Map(),out=[],edgeMap=new Map();
 function id(p){var k=key(p);if(!nodeMap.has(k)){nodeMap.set(k,nodes.length);nodes.push({x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100});}return nodeMap.get(k);}
 roads.forEach(function(r,ri){var cs=cuts[ri].sort(function(a,b){return a.f-b.f;}),u=[];cs.forEach(function(c){if(!u.length||Math.abs(c.f-u[u.length-1].f)>1e-5)u.push(c);});
  for(var i=1;i<u.length;i++){
   var a=u[i-1],b=u[i],pts=[copy(a.p)];for(var j=Math.floor(a.f)+1;j<b.f-1e-6;j++)pts.push(copy(r.pts[j]));pts.push(copy(b.p));
   var len=length(pts);if(len<.1)continue;var from=id(a.p),to=id(b.p);if(from===to)continue;pts[0]=copy(nodes[from]);pts[pts.length-1]=copy(nodes[to]);len=length(pts);
   var mid=pts[Math.floor(pts.length/2)],ek=Math.min(from,to)+','+Math.max(from,to)+','+Math.round(len);
   if(edgeMap.has(ek)){var other=out[edgeMap.get(ek)];if(r.cls>other.cls)other.cls=r.cls;continue;}
   edgeMap.set(ek,out.length);out.push({pts:pts,cls:r.cls,from:from,to:to,length:len,bridges:[],source:r.source||'district'});
  }
 });
 return graph(nodes,out);
}
function graph(nodes,roads){var adj=nodes.map(function(){return[];});roads.forEach(function(r,i){adj[r.from].push({to:r.to,len:r.length,e:i});adj[r.to].push({to:r.from,len:r.length,e:i});});
 var component=new Int32Array(nodes.length).fill(-1),components=[];
 nodes.forEach(function(_,i){if(component[i]>=0)return;var cid=components.length,q=[i],vs=[],len=0;component[i]=cid;
  while(q.length){var u=q.pop();vs.push(u);adj[u].forEach(function(e){len+=e.len/2;if(component[e.to]<0){component[e.to]=cid;q.push(e.to);}});}
  components.push({id:cid,nodes:vs,length:len});});
 components.sort(function(a,b){return b.length-a.length;});
 return {nodes:nodes,roads:roads,adj:adj,component:component,components:components};
}
function settleNetwork(F,roads){
 var n=planarize(roads,F),idx=makeIndex(n.roads),changed=false;
 // Only unconnected endpoints move; shared junctions stay pinned.
 n.nodes.forEach(function(p,i){if(n.adj[i].length!==1)return;var ri=n.adj[i][0].e,r=n.roads[ri],q=idx.near(p,r.cls===0?26:12,ri);
  if(!q||q.d<.02||!drySegment(F,p,q,10))return;
  if(r.from===i)r.pts[0]={x:q.x,y:q.y};else r.pts[r.pts.length-1]={x:q.x,y:q.y};changed=true;
 });if(changed)n=planarize(n.roads,F);
 // Join nearby isolated fabrics with one explicit, land-only street, rather
 // than assuming proximity equals connectivity. River-separated areas are reported.
 for(var attempt=0;attempt<16&&n.components.length>1;attempt++){
  var main=n.components[0],mainRoads=n.roads.filter(function(r){return n.component[r.from]===main.id;}),mi=makeIndex(mainRoads),best=null;
  n.components.slice(1).forEach(function(c){c.nodes.forEach(function(i){var p=n.nodes[i];if(n.adj[i].length!==1)return;var hit=mi.near(p,92,-1);
   if(hit&&hit.d>2&&(!best||hit.d<best.d)&&drySegment(F,p,hit,18))best={a:p,b:hit,d:hit.d};});});
  if(!best)break;n.roads.push({pts:resample([copy(best.a),copy(best.b)],6),cls:0,source:'connector',bridges:[]});n=planarize(n.roads,F);
 }
 // Disconnected water-separated components remain visible and are reported;
 // no fake "100% connected" constant and no bridges invented by a local infill pass.
 return n;
}
function junctionGeometry(N,F){
 var nodes=N.nodes.map(function(p,i){var es=N.adj[i],cls=0,short=Infinity;es.forEach(function(e){cls=Math.max(cls,N.roads[e.e].cls);short=Math.min(short,e.len);});
  return {x:p.x,y:p.y,cls:cls,deg:es.length,r:es.length<3?0:Math.min([8,12,18][cls],short*.3)};});
 function trim(pts,r){if(!r)return pts;var s=pts[0];for(var i=1;i<pts.length;i++){
  var p=pts[i];if(Math.hypot(p.x-s.x,p.y-s.y)<r)continue;var a=pts[i-1],dx=p.x-a.x,dy=p.y-a.y,ox=a.x-s.x,oy=a.y-s.y,aa=dx*dx+dy*dy,bb=2*(ox*dx+oy*dy),cc=ox*ox+oy*oy-r*r;
  var t=aa?clamp((-bb+Math.sqrt(Math.max(0,bb*bb-4*aa*cc)))/(2*aa),0,1):0;
  return [{x:a.x+dx*t,y:a.y+dy*t}].concat(pts.slice(i));
 }return pts;}
 var roads=N.roads.map(function(r){var pts=trim(r.pts.map(copy),nodes[r.from].r);pts=trim(pts.reverse(),nodes[r.to].r).reverse();
  if(pts.length===2)pts=resample(pts,6);return Object.assign({},r,{pts:pts,bridges:bridgeRuns(F,pts)});});
 return {roads:roads,nodes:nodes.filter(function(n){return n.deg>=3&&n.r>.05;})};
}
function reserveAndBuild(F,geometry){
 // Occupancy is rebuilt from FINAL pavement, at raster-cell spacing. Earlier
 // occupancy was created before snapping/curvature and could be out of date.
 var dense={roads:geometry.roads.map(function(r){return Object.assign({},r,{pts:resample(r.pts,BCELL)});})};
 var FF=Object.assign({},F,{river:F.river?resample(F.river,BCELL):null});
 var built=window.RoadAtlasConditions?RoadAtlasConditions.buildBlocks(FF,dense,geometry.nodes):buildBlocks(FF,dense,geometry.nodes);
 var idx=makeIndex(geometry.roads),rejected=0;
 built.buildings=built.buildings.filter(function(b){if(!footprintClear(b,idx,geometry.nodes)){rejected++;return false;}return true;});
 built.rejectedFootprints=rejected;if(window.RoadAtlasConditions)RoadAtlasConditions.reindex(built);return built;
}
/* Final conservative footprint check against committed road corridors. This
 * runs before any building is accepted for output, not as a cosmetic overlay. */
function footprintClear(b,idx,junctions){
 var ca=Math.cos(b.ang),sa=Math.sin(b.ang),radius=Math.hypot(b.w,b.h)/2+28,seen=new Set();
 function local(p){var dx=p.x-b.cx,dy=p.y-b.cy;return{x:dx*ca+dy*sa,y:-dx*sa+dy*ca};}
 function intersects(A,B,pad){var a=local(A),z=local(B),dx=z.x-a.x,dy=z.y-a.y,hx=b.w/2+pad,hy=b.h/2+pad,t0=0,t1=1;
  var ds=[-dx,dx,-dy,dy],qs=[a.x+hx,hx-a.x,a.y+hy,hy-a.y];
  for(var i=0;i<4;i++){if(Math.abs(ds[i])<1e-9){if(qs[i]<0)return false;}else{var t=qs[i]/ds[i];if(ds[i]<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return false;}}return true;
 }
 for(var y=Math.floor((b.cy-radius)/40);y<=Math.floor((b.cy+radius)/40);y++)for(var x=Math.floor((b.cx-radius)/40);x<=Math.floor((b.cx+radius)/40);x++){
  var list=idx.cells.get(x+','+y)||[];
  for(var i=0;i<list.length;i++){var s=list[i];if(seen.has(s.id))continue;seen.add(s.id);if(intersects(s.a,s.b,[4,5.5,7.5][idx.roads[s.ri].cls]+3.5))return false;}
 }
 for(var i=0;i<junctions.length;i++){var n=junctions[i],p=local(n);var dx=Math.max(0,Math.abs(p.x)-b.w/2),dy=Math.max(0,Math.abs(p.y)-b.h/2);if(dx*dx+dy*dy<(n.r+3.5)*(n.r+3.5))return false;}
 return true;
}
function layersFromNetwork(F,G,N,W){
 // Retain V1 population and civic-marker aesthetics; replace ghost macro-edge
 // distances and free-drawn transit with paths through the finalized graph.
 var L=buildLayers(F,G,W),sources=[],targets=[];
 function nearest(p){var best=-1,bd=Infinity;N.nodes.forEach(function(q,i){var d=dist2(p.x,p.y,q.x,q.y);if(d<bd){bd=d;best=i;}});return best;}
 G.anchors.forEach(function(p){var i=nearest(p);if(i>=0){sources.push(i);targets.push({p:p,i:i});}});
 var Ds=sources.map(function(s){return dijkstraHeap(N.adj,s);}),cost=new Float32Array(L.acc.data.length),LW=L.acc.w,LH=L.acc.h;
 for(var y=0;y<LH;y++)for(var x=0;x<LW;x++){
  var p={x:(x+.5)*WORLD_W/LW,y:(y+.5)*WORLD_H/LH},near=nearest(p),mn=Infinity;
  Ds.forEach(function(D){mn=Math.min(mn,D[near]);});
  var walk=near>=0?Math.hypot(p.x-N.nodes[near].x,p.y-N.nodes[near].y):Infinity;
  var v=mn<1e17?Math.exp(-(mn+walk*2)/Math.max(1,F.R*.7)):0;
  cost[y*LW+x]=F.waterDist(p.x,p.y)<0?0:v;
 }
 L.acc={w:LW,h:LH,data:cost};L.transit=[];
 var origin=targets.find(function(a){return a.p.role==='downtown';}),dests=targets.filter(function(a){return a.p.role==='gate'||a.p.role==='industry';});
 var colors=['#d94848','#2f9e5f','#3f6fd4'];
 if(origin)dests.slice(0,WEXT>1.6?3:2).forEach(function(t,i){if(N.component[origin.i]!==N.component[t.i]){failures.push('Transit destination is in a separate street component');return;}
  // V1's predecessor helper returns edges backwards and [-1] for no path.
  var path=dijkstraPathHeap(N.adj,origin.i,t.i).reverse(),u=origin.i,pts=[];
  if(path.some(function(e){return e<0||!N.roads[e];}))return;
  path.forEach(function(ei){var r=N.roads[ei],p=r.from===u?r.pts:r.pts.slice().reverse();pts=pts.concat(p.slice(pts.length?1:0));u=r.from===u?r.to:r.from;});
  if(!pts.length||u!==t.i)return;var stops=[],acc=0;for(var j=1;j<pts.length;j++){acc+=Math.hypot(pts[j].x-pts[j-1].x,pts[j].y-pts[j-1].y);if(acc>=140){acc=0;stops.push(copy(pts[j]));}}
  L.transit.push({pts:pts,stops:stops,color:colors[i%3],edges:path});
 });return L;
}
function validate(N,W){
 if(!N.roads.length||!N.nodes.length)throw new Error('Empty street network. Previous scene retained.');
 var bad=0;N.roads.forEach(function(r){if(r.from===r.to||!Number.isFinite(r.length)||r.length<=0)bad++;r.pts.forEach(function(p){if(!Number.isFinite(p.x)||!Number.isFinite(p.y))bad++;});
  if(key(r.pts[0])!==key(N.nodes[r.from])||key(r.pts[r.pts.length-1])!==key(N.nodes[r.to]))bad++;
 });if(bad)throw new Error('Graph validation failed ('+bad+'). Previous scene retained.');
 var total=N.roads.reduce(function(a,r){return a+r.length;},0),main=N.components[0];
 return {nodes:N.nodes.length,edges:N.roads.length,components:N.components.length,largestComponentLengthShare:total&&main?clamp(main.length/total,0,1):0,networkLengthWorldUnits:total,invalidEdges:bad,blocks:W.blocks.blocks.length,buildings:W.blocks.buildings.length,rejectedFootprints:W.blocks.rejectedFootprints||0,stageOrder:trace.map(function(t){return t.name;})};
}
function sizeWorld(){WEXT=extentOf(P.cityScale);WORLD_W=Math.round(1600*WEXT);WORLD_H=Math.round(1000*WEXT);
 ACOLS=Math.max(24,Math.round(WORLD_W/ACELL));AROWS=Math.max(16,Math.round(WORLD_H/ACELL));BCOLS=Math.max(60,Math.round(WORLD_W/BCELL));BROWS=Math.max(40,Math.round(WORLD_H/BCELL));
 OCCW=Math.max(40,Math.round(WORLD_W/OCCCELL));OCCH=Math.max(28,Math.round(WORLD_H/OCCCELL));AGW=Math.max(12,Math.round(WORLD_W/AGCELL));AGH=Math.max(8,Math.round(WORLD_H/AGCELL));}
function regenerateOrdered(){
 if(mode==='legacy'){oldRegenerate();status('Original V1 build order. No ordered-graph metrics.');generated=null;if(window.RoadAtlasConditions)RoadAtlasConditions.refresh();return;}
 trace=[];failures=[];var t0=performance.now(),prior=world,priorCanvas=worldCanvas;
 var priorSize=[WEXT,WORLD_W,WORLD_H,ACOLS,AROWS,BCOLS,BROWS,OCCW,OCCH,AGW,AGH];
 try{
  sizeWorld();var F=stage('Terrain and land-use constraints',fields);
  if(window.RoadAtlasConditions)stage('Elevation and slope conditions',function(){RoadAtlasConditions.prepare(F);});
  var G=stage('V1 macro plan',function(){
   var G=buildMacroGraph(F);
   G.pts.forEach(function(p){if(F.waterDist(p.x,p.y)>=24)return;var best=null;
    for(var r=24;r<=180&&!best;r+=12)for(var a=0;a<32;a++){var q={x:p.x+Math.cos(a*TAU/32)*r,y:p.y+Math.sin(a*TAU/32)*r};
     if(q.x>30&&q.y>30&&q.x<WORLD_W-30&&q.y<WORLD_H-30&&F.waterDist(q.x,q.y)>24){best=q;break;}}
    if(best){p.x=best.x;p.y=best.y;if(p.anchor!=null){G.anchors[p.anchor].x=p.x;G.anchors[p.anchor].y=p.y;}}
   });return G;
  });
  var candidates=initialRoads(F,G),N=stage('Snap, split and connect network',function(){return settleNetwork(F,candidates);});
  var geometry=stage('Final junctions and bridges',function(){return junctionGeometry(N,F);});
  var blocks=stage('Reserve pavement, extract blocks, pack buildings',function(){return reserveAndBuild(F,geometry);});
  var idx=makeIndex(geometry.roads),W={F:F,G:G,roads:geometry.roads,nodes:geometry.nodes,blocks:blocks,seed:state.seed,
    occNear:function(x,y,r){return !!idx.near({x:x,y:y},r,-1);},network:N,conditions:blocks.conditions};
  W.layers=stage('Accessibility and transit on actual streets',function(){return layersFromNetwork(F,G,N,W);});
  if(W.conditions)stage('Civic markers inside assigned parcels',function(){RoadAtlasConditions.finalizeLayers(W);});
  W.names=stage('Labels on final geometry',function(){
   // Splitting a corridor must not turn every piece into a separately named
   // street. Use its unsplit, already routed lineage, then reject close labels.
   var names=buildNames(F,candidates),placed=[];
   names.streets=names.streets.filter(function(s){if(placed.some(function(p){return dist2(s.x,s.y,p.x,p.y)<120*120;}))return false;placed.push(s);return true;});
   return names;
  });
  var metrics=stage('Validate committed scene',function(){var m=validate(N,W);if(W.conditions)m.conditions=RoadAtlasConditions.validate(W);return m;});
  // Base rendering is unchanged. Draw to a new buffer before publishing.
  var next=document.createElement('canvas');next.width=WORLD_W;next.height=WORLD_H;
  stage('V1 cartographic rendering',function(){renderWorld(next.getContext('2d'),W);});
  metrics.stageOrder=trace.map(function(t){return t.name;});
  W.pipeline={version:VERSION,metrics:metrics,trace:trace.slice(),warnings:failures.slice()};world=W;worldCanvas=next;generated=W.pipeline;
  refreshAnalysisPanel();if(window.RoadAtlasConditions)RoadAtlasConditions.refresh();renderOverlays();drawStatic();document.getElementById('err').style.display='none';
  document.getElementById('genmeta').textContent='Ordered · '+((performance.now()-t0)/1000).toFixed(2)+'s · '+N.roads.length+' segments · '+blocks.buildings.length+' buildings';
  status(N.components.length+' network component'+(N.components.length===1?'':'s')+' · '+(metrics.largestComponentLengthShare*100).toFixed(1)+'% of road length in largest component. '+(failures.length?failures.join('; '):'Validated finite edges and shared endpoints.'));
 }catch(e){world=prior;worldCanvas=priorCanvas;
  WEXT=priorSize[0];WORLD_W=priorSize[1];WORLD_H=priorSize[2];ACOLS=priorSize[3];AROWS=priorSize[4];BCOLS=priorSize[5];BROWS=priorSize[6];OCCW=priorSize[7];OCCH=priorSize[8];AGW=priorSize[9];AGH=priorSize[10];
  showErr(e.message);console.error(e);status('Generation failed. The previous scene was retained.');}
}
function status(text){var e=document.getElementById('pipelineStatus');if(e)e.textContent=text;}
regenerate=regenerateOrdered;
var selector=document.getElementById('pipelineMode');if(selector){selector.value=mode;selector.addEventListener('change',function(){mode=selector.value;regenerate();});}
var chain=document.getElementById('pipelineChain');if(chain)chain.textContent='Terrain + land use → main corridors → V1 district grids → attached infill → shared junction graph → final pavement mask → V1 blocks/buildings/parks → network accessibility/transit → labels → V1 rendering.';
var share=document.getElementById('shareBtn');if(share){var fresh=share.cloneNode(true);share.replaceWith(fresh);fresh.addEventListener('click',function(){
 var u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('seed',state.seed);u.searchParams.set('pipeline',mode);
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(u.href).then(function(){toast('Exact recipe + build order copied');},function(){prompt('Copy this link:',u.href);});else prompt('Copy this link:',u.href);
});}
function exportData(){if(!world)return null;var N=world.network;
 return {format:'MOOR-RoadAtlas-2.2',pipeline:mode,engineVersion:VERSION,seed:state.seed,params:Object.assign({},P),extent:{width:WORLD_W,height:WORLD_H,units:'V1 world units'},
  network:N?{nodes:N.nodes,edges:N.roads.map(function(r){return {from:r.from,to:r.to,class:r.cls,length:r.length,points:r.pts,source:r.source};})}:null,
  roads:world.roads.map(function(r){return {class:r.cls,points:r.pts,from:r.from,to:r.to,bridges:r.bridges};}),
  intersections:world.nodes,buildings:world.blocks.buildings,parks:world.blocks.parks,
  fields:{population:{w:world.layers.pop.w,h:world.layers.pop.h,data:Array.from(world.layers.pop.data)},accessibility:{w:world.layers.acc.w,h:world.layers.acc.h,data:Array.from(world.layers.acc.data)}},
  transit:world.layers.transit,pois:world.layers.pois,conditions:window.RoadAtlasConditions?RoadAtlasConditions.exportData(world):null,diagnostics:generated};}
var dataBtn=document.getElementById('dataBtn');if(dataBtn){var button=dataBtn.cloneNode(true);dataBtn.replaceWith(button);button.addEventListener('click',function(){var data=exportData();if(!data)return;
 var blob=new Blob([JSON.stringify(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='road-atlas-'+state.seed+'-'+mode+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},1500);
});}
window.RoadAtlasPipeline={version:VERSION,getMode:function(){return mode;},setMode:function(v){mode=v==='legacy'?'legacy':'ordered';if(selector)selector.value=mode;regenerate();},exportData:exportData,
 debug:{footprintClear:footprintClear,makeIndex:makeIndex,planarize:planarize,graph:graph,routeAStar:routeAStar,settleNetwork:settleNetwork,validate:validate}};
})();
