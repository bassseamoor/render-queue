/* Road Atlas Urban 2.4.0 — denser site massing, not a replacement city engine.
 * Reads finalized 2.3 parcels, road graph, topography and accessibility.
 * Geometry units are V1 world units, not construction dimensions. Volume height
 * is illustrative. No zoning, daylight, wind, structural or traffic certification.
 * Invariants: no changes to streets/parcels/envelopes; every volume is supported,
 * every plan AND entire cartographic extrusion fits its assigned parcel;
 * all ground components are disjoint; gardens/paths have explicit cell owners.
 */
(function () {
'use strict';
var VERSION='2.4.0', D=RoadAtlasConditions.debug, query=new URLSearchParams(location.search);
var CHARACTERS={balanced:'Context-led mix',courtyard:'Courts & shared gardens',terraced:'Stepped garden fabric',compact:'Compact centers'};
function num(v,f,lo,hi){var n=Number(v);return v!=null&&v!==''&&Number.isFinite(n)?clamp(n,lo,hi):f;}
var settings={enabled:query.get('urban')!=='0',character:Object.prototype.hasOwnProperty.call(CHARACTERS,query.get('character'))?query.get('character'):'balanced',openness:num(query.get('openness'),.32,.15,.65),relief:num(query.get('relief'),.85,.25,1.25)};
var selectedId=null, phase=5, patternView=false, timer=0, studyCanvas=null, focusBefore=null;
var PHASES=['Site','Envelope','Ground form','Upper form','Open space','Finished'];
var FORM_NAMES={bar:'Compact bar',wing:'L-wing garden',court:'Open courtyard',perimeter:'Gated perimeter court',terrace:'Stepped terraces',podium:'Podium + setback tower',pavilion:'Paired civic pavilions',row:'Fine-grain row',workshop:'Workshop + service yard'};
function point(x,y){return{x:x,y:y};}
function tr(f,x,y){var c=Math.cos(f.ang),s=Math.sin(f.ang);return point(f.cx+c*x-s*y,f.cy+s*x+c*y);}
function loc(f,p){var c=Math.cos(f.ang),s=Math.sin(f.ang),x=p.x-f.cx,y=p.y-f.cy;return point(c*x+s*y,-s*x+c*y);}
function corners(r){return [[-r.w/2,-r.h/2],[r.w/2,-r.h/2],[r.w/2,r.h/2],[-r.w/2,r.h/2]].map(function(p){return tr(r,p[0],p[1]);});}
function rectArea(r){return r.w*r.h;}
function ringsPath(ctx,rings,project){ctx.beginPath();rings.forEach(function(r){r.forEach(function(p,i){var q=project?project(p,0):p;if(!i)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);});ctx.closePath();});}
function poly(ctx,points,fill,stroke,width){ctx.beginPath();points.forEach(function(p,i){if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=width||1;ctx.strokeStyle=stroke;ctx.stroke();}}
function field(grid,x,y){var ix=clamp(Math.floor(x/WORLD_W*grid.w),0,grid.w-1),iy=clamp(Math.floor(y/WORLD_H*grid.h),0,grid.h-1);return grid.data[iy*grid.w+ix];}
function mapPoint(b,p,z){var d=-.42*z,c=Math.cos(b.ang),s=Math.sin(b.ang);return point(p.x+d*(c-s),p.y+d*(s+c));}
function projectedBound(b,r,z0,z1){
 var pts=corners(r),xs=[],ys=[];[z0,z1].forEach(function(z){pts.forEach(function(p){var q=loc(b,mapPoint(b,p,z));xs.push(q.x);ys.push(q.y);});});
 var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys),c=tr(b,(x0+x1)/2,(y0+y1)/2);
 return {cx:c.x,cy:c.y,w:x1-x0,h:y1-y0,ang:b.ang};
}
function supported(child,parent){var p=corners(child).map(function(v){return loc(parent,v);});return p.every(function(v){return Math.abs(v.x)<=parent.w/2+1e-7&&Math.abs(v.y)<=parent.h/2+1e-7;});}
function groundOverlap(a,b){
 var axes=[a.ang,a.ang+Math.PI/2,b.ang,b.ang+Math.PI/2],pa=corners(a),pb=corners(b);
 return axes.every(function(t){var c=Math.cos(t),s=Math.sin(t),A=pa.map(function(p){return p.x*c+p.y*s;}),B=pb.map(function(p){return p.x*c+p.y*s;});return Math.min(Math.max.apply(null,A),Math.max.apply(null,B))-Math.max(Math.min.apply(null,A),Math.min.apply(null,B))>1e-7;});
}
function charter(W,q){
 var c=W.F.centers[q.districtId]||W.F.downtown,kind=q.district,rule,reason;
 if(kind==='industrial'){rule='working';reason='Industrial district keeps a broad working floor and a service yard.';}
 else if(kind==='waterfront'){rule='waterfront';reason='Waterfront parcels favor separated, lower masses and retained open ground.';}
 else if(settings.character==='courtyard'){rule='courtyard';reason='Shared-court character repeats across parcels in this district.';}
 else if(settings.character==='terraced'){rule='terraced';reason='Stepped character repeats upper-level retreats and open ground.';}
 else if(settings.character==='compact'&&(kind==='downtown'||kind==='commercial')){rule='center';reason='Compact character concentrates the upper mass inside its lower support.';}
 else if(kind==='downtown'){rule='center';reason='Downtown role gives the district a stronger vertical hierarchy.';}
 else if(kind==='commercial'){rule='courtyard';reason='Commercial frontage wraps a court instead of filling the whole envelope.';}
 else{rule='garden';reason='Residential or park-edge parcels use wings and small repeated masses.';}
 return {districtId:q.districtId,district:kind,rule:rule,reason:reason,center:{x:c.x,y:c.y},principles:['ownership','orientation',rule==='center'?'hierarchy':'regularity',kind==='waterfront'?'edge response':'specialization']};
}
function siteContext(W,b,q,index){
 var hit=index.near(point(b.cx,b.cy),240,-1),localHit=hit?loc(b,hit):point(0,-1),turn;
 if(Math.abs(localHit.y)>=Math.abs(localHit.x))turn=localHit.y<=0?0:2;else turn=localHit.x>0?1:3;
 var frame={cx:b.cx,cy:b.cy,w:turn%2?b.h:b.w,h:turn%2?b.w:b.h,ang:b.ang+turn*Math.PI/2};
 var slope=D.sample(W.conditions.topography.slope,b.cx,b.cy),elevation=D.sample(W.conditions.topography.elevation,b.cx,b.cy),access=clamp(field(W.layers.acc,b.cx,b.cy),0,1);
 return {frame:frame,frontage:hit?{x:hit.x,y:hit.y,roadId:hit.ri,distance:hit.d,class:W.roads[hit.ri].cls}:null,slopeIndex:slope,elevation:elevation,accessibilityIndex:access,waterDistance:Math.max(0,W.F.waterDist(b.cx,b.cy)),charter:charter(W,q)};
}
function chooseForm(site,q,rng,civic){
 var f=site.frame,small=Math.min(f.w,f.h)<15;
 if(small)return'bar';
 if(q.district==='industrial')return'workshop';
 if(civic&&Math.min(f.w,f.h)>24)return'pavilion';
 if(site.slopeIndex>.52&&f.h>22)return'terrace';
 if(site.charter.rule==='waterfront')return f.w>26?'pavilion':'wing';
 if(site.charter.rule==='center')return f.w*f.h>700?'podium':'terrace';
 if(site.charter.rule==='terraced')return f.w>32?'row':'terrace';
 if(site.charter.rule==='courtyard')return Math.min(f.w,f.h)>35&&settings.openness<.45?'perimeter':'court';
 return f.w>34&&f.h>22?(rng()<.65?'row':'court'):'wing';
}
/* All grammar rectangles are local to the already fitted envelope. Widths,
 * voids and parent-supported upper volumes derive from the same ground model.
 * The first four priority levels are hard constraints, never aesthetic votes. */
function makeModel(W,b,q,index){
 var rng=makeRng(W.seed,'urban.site.'+q.id),site=siteContext(W,b,q,index),civic=W.layers.pois.some(function(p){return p.parcelId===q.id;}),kind=chooseForm(site,q,rng,civic),F=site.frame;
 var H=Math.max(3,Math.min(44,b.placement.requestedHeight||12))*settings.relief*(.72+.38*site.accessibilityIndex);
 if(site.charter.rule==='waterfront'||site.slopeIndex>.52)H*=.7;
 var inset=.07,gap=.055+settings.openness*.12,thick=.22+(1-settings.openness)*.235,ground=[],uppers=[],volumes=[],heightLimited=0;
 function add(u0,v0,u1,v1,h){var r={u0:u0,v0:v0,u1:u1,v1:v1,h:h};ground.push(r);return ground.length-1;}
 function upper(i,u0,v0,u1,v1,h){uppers.push({parent:i,u0:u0,v0:v0,u1:u1,v1:v1,h:h});}
 if(kind==='wing'){
  var a=add(inset,inset,inset+thick,.93,H*.6),c=add(inset+thick,.93-thick,.93,.93,H*.52);
  upper(a,inset+.035,.26,inset+thick-.035,.86,H*.32);upper(c,inset+thick+.035,.93-thick+.035,.86,.895,H*.23);
 }else if(kind==='court'||kind==='perimeter'){
  var t=thick*.83,rear=add(.07,.93-t,.93,.93,H*.5),left=add(.07,.07,.07+t,.93-t,H*.45),right=add(.93-t,.07,.93,.93-t,H*.45);
  upper(rear,.11,.965-t,.89,.895,H*.37);upper(left,.105,.24,.035+t,.895-t,H*.22);upper(right,.965-t,.24,.895,.895-t,H*.22);
  if(kind==='perimeter'){add(.07+t,.07,.5-gap*.55,.07+t,H*.32);add(.5+gap*.55,.07,.93-t,.07+t,H*.32);}
 }else if(kind==='podium'){
  var p=add(.08,.18+gap*.35,.92,.92,H*.28);upper(p,.25+gap*.2,.42,.75-gap*.2,.83,H*.7);
 }else if(kind==='terrace'){
  var p=add(.08,.1,.92,.92,H*.28);upper(p,.13,.28+gap*.4,.87,.86,H*.28);
  // A third tier is inserted after its actual parent has been accepted.
 }else if(kind==='pavilion'){
  var a=add(.07,.15,.5-gap/2,.88,H*.5),c=add(.5+gap/2,.28,.93,.88,H*.4);
  upper(a,.105,.30,.465-gap/2,.83,H*.24);upper(c,.535+gap/2,.48,.895,.84,H*.22);
 }else if(kind==='row'){
  var count=F.w>55?4:3,t=(.86-gap*(count-1))/count;
  for(var i=0;i<count;i++){var u=.07+i*(t+gap),p=add(u,.12+(i%2)*.045,u+t,.9,H*(.42+.035*i));upper(p,u+.018,.32,u+t-.018,.85,H*.24);}
 }else if(kind==='workshop'){
  var a=add(.08,.35,.92,.91,H*.35);add(.08,.08,.35,.35,H*.24);upper(a,.68,.47,.86,.84,H*.15);
 }else{
  var a=add(.1,.12,.9,.9,H*.5);if(F.w>12&&F.h>12)upper(a,.18,.37,.82,.84,H*.25);
 }
 var area=ground.reduce(function(a,r){return a+Math.max(0,r.u1-r.u0)*Math.max(0,r.v1-r.v0);},0);
 // The former scale could only shrink massing. A 1.14 ceiling lets buildings
 // use almost all of their already-fitted envelope while staying inside its
 // 7% edge reserve; the selected openness still caps ground occupancy.
 var scale=Math.min(1.14,Math.sqrt((1-settings.openness)/Math.max(area,1e-9)));
 function shape(r){var u0=.5+(r.u0-.5)*scale,u1=.5+(r.u1-.5)*scale,v0=.5+(r.v0-.5)*scale,v1=.5+(r.v1-.5)*scale,c=tr(F,((u0+u1)/2-.5)*F.w,((v0+v1)/2-.5)*F.h);return {cx:c.x,cy:c.y,w:(u1-u0)*F.w,h:(v1-v0)*F.h,ang:F.ang};}
 function accept(r,z0,height,parent,role){
  if(r.w<2.5||r.h<2.5||!D.allowed(W.conditions,r,q.id))return null;
  if(parent!=null&&!supported(r,volumes[parent].rect))return null;
  var top=z0+height;
  function ok(z){return D.allowed(W.conditions,projectedBound(b,r,z0,z),q.id);}
  if(!ok(z0))return null;
  if(!ok(top)){var lo=z0,hi=top;for(var i=0;i<14;i++){var m=(lo+hi)*.5;if(ok(m))lo=m;else hi=m;}top=lo;heightLimited++;}
  if(top-z0<.25)return null;
  var v={id:volumes.length,parent:parent,role:role,rect:r,z0:z0,z1:top,plan:corners(r),projectedBase:corners(r).map(function(p){return mapPoint(b,p,z0);}),projectedRoof:corners(r).map(function(p){return mapPoint(b,p,top);})};volumes.push(v);return v.id;
 }
 var parents=ground.map(function(r){return accept(shape(r),0,r.h,null,'ground');});
 uppers.forEach(function(r){var pi=parents[r.parent];if(pi!=null)accept(shape(r),volumes[pi].z1,r.h,pi,'upper');});
 if(kind==='terrace'&&volumes.length>1){var p=volumes[1],r=p.rect;accept({cx:r.cx-Math.sin(r.ang)*r.h*.12,cy:r.cy+Math.cos(r.ang)*r.h*.12,w:r.w*.84,h:r.h*.66,ang:r.ang},p.z1,H*.28,p.id,'upper');}
 if(!volumes.some(function(v){return v.z0===0;})){
  kind='bar';var r=shape({u0:.2,v0:.2,u1:.8,v1:.8});accept(r,0,3,null,'ground');
 }
 if(!volumes.length)throw new Error('No valid supported mass in fitted parcel '+q.id);
 var base=volumes.filter(function(v){return v.parent==null;}),groundArea=base.reduce(function(a,v){return a+rectArea(v.rect);},0),totalVolume=volumes.reduce(function(a,v){return a+rectArea(v.rect)*(v.z1-v.z0);},0),maxHeight=Math.max.apply(null,volumes.map(function(v){return v.z1;}));
 var envelopeArea=b.w*b.h,model={version:VERSION,parcelId:q.id,buildingId:q.buildingId,form:kind,label:FORM_NAMES[kind],context:site,volumes:volumes,limits:{heightLimited:heightLimited,boundaryCell:W.conditions.cell},metrics:{parcelArea:q.area,envelopeArea:envelopeArea,groundArea:groundArea,groundCoverage:groundArea/q.area,envelopeCoverage:groundArea/envelopeArea,targetEnvelopeCoverage:1-settings.openness,unbuiltArea:q.area-groundArea,volume:totalVolume,maxHeight:maxHeight},reasons:[site.charter.reason,'Orientation follows the nearest existing street side; the fitted envelope and road setback are retained.',site.slopeIndex>.52?'Higher slope index selects a stepped, reduced-height form.':'Slope passes the existing placement condition.',kind==='row'?'Fine-grain residential rows add more street-scale building fronts.':kind==='bar'?'Small-site fallback avoids unusably thin wings.':'Ground forms expand toward the selected occupancy target while preserving open-space gaps.','Every upper volume stays inside its supporting mass and parcel.']};
 model.landscape=siteLandscape(W,b,q,model,index,rng);
 return model;
}
function siteLandscape(W,b,q,model,index,rng){
 var C=W.conditions,blocked=new Set(),projected=new Set();
 model.volumes.forEach(function(v){if(v.parent==null)D.rectCells(C,v.rect,function(k){blocked.add(k);});D.rectCells(C,projectedBound(b,v.rect,v.z0,v.z1),function(k){projected.add(k);});});
 var free=q.cells.filter(function(k){return !blocked.has(k);}),freeSet=new Set(free),front=model.context.frame,grounds=model.volumes.filter(function(v){return v.parent==null;}),doorVolume=grounds.slice().sort(function(a,b){var A=loc(front,point(a.rect.cx,a.rect.cy)),B=loc(front,point(b.rect.cx,b.rect.cy));return A.y-a.rect.h/2-(B.y-b.rect.h/2);})[0];
 var door=tr(doorVolume.rect,0,-doorVolume.rect.h/2),center=function(k){return point((k%C.w+.5)*C.cell,((k/C.w|0)+.5)*C.cell);};
 var start=null,best=Infinity;free.forEach(function(k){var p=center(k),d=dist2(p.x,p.y,door.x,door.y);if(d<best){best=d;start=k;}});
 var came=new Map(),queue=[],exit=null,exitScore=Infinity;
 if(start!=null){came.set(start,null);queue.push(start);}
 for(var n=0;n<queue.length;n++){var k=queue[n],x=k%C.w,p=center(k),nb=[x? k-1:-1,x<C.w-1?k+1:-1,k-C.w,k+C.w];
  if(nb.some(function(i){return i<0||i>=C.owner.length||C.owner[i]!==q.id;})){
   var road=model.context.frontage,score=road?dist2(p.x,p.y,road.x,road.y):dist2(p.x,p.y,front.cx,front.cy);
   if(score<exitScore){exit=k;exitScore=score;}
  }
  nb.forEach(function(i){if(freeSet.has(i)&&!came.has(i)){came.set(i,k);queue.push(i);}});
 }
 var path=[];if(exit!=null){for(var k=exit;k!=null;k=came.get(k))path.push(k);}
 var pathSet=new Set(path),garden=[],paving=[],trees=[];
 // Surface assignment is a coherent spatial rule, never per-cell confetti.
 // Door approach + frontage/service band are paved; residual owned ground is
 // garden. Industry keeps a wider service band than garden/court districts.
 free.forEach(function(k){var a=center(k),nearDoor=Math.hypot(a.x-door.x,a.y-door.y)<C.cell*1.35,l=loc(front,a),u=l.x/front.w,v=l.y/front.h;
  var apron=q.district==='industrial'?v<-.12:q.district==='downtown'?v<-.32&&Math.abs(u)<.65:v<-.40&&Math.abs(u)<.36;
  if(pathSet.has(k)||nearDoor||apron){paving.push(k);return;}
  garden.push(k);if(trees.length<8&&!projected.has(k)&&rng()<.045)trees.push({x:a.x,y:a.y,r:Math.min(1.65,C.cell*.39),h:3.2,cell:k});
 });
 return {door:{x:door.x,y:door.y,volumeId:doorVolume.id},internalPath:{cells:path,points:path.map(center),status:path.length?'Internal parcel approach only; street connection is not modeled.':'No internal frontage approach found.',publicConnectionVerified:false},surfaces:[{kind:'garden',cells:garden,rings:D.ringsFromCells(garden,C.w,C.cell),area:garden.length*C.cell*C.cell},{kind:'paving',cells:paving,rings:D.ringsFromCells(paving,C.w,C.cell),area:paving.length*C.cell*C.cell}],trees:trees};
}
function validate(W){
 if(!W.urban||!W.urban.enabled)return {models:0,invalid:0};var invalid=[];
 W.blocks.buildings.forEach(function(b){var m=b.architecture,q=W.conditions.parcels[b.parcelId];if(!m||m.parcelId!==q.id){invalid.push('missing owner');return;}
  m.volumes.forEach(function(v,i){if(![v.z0,v.z1,v.rect.cx,v.rect.cy,v.rect.w,v.rect.h,v.rect.ang].every(Number.isFinite)||v.z1<=v.z0||v.rect.w<=0||v.rect.h<=0||v.id!==i)invalid.push('nonfinite/empty mass');
   if(!D.allowed(W.conditions,v.rect,q.id)||!D.allowed(W.conditions,projectedBound(b,v.rect,v.z0,v.z1),q.id))invalid.push('parcel extrusion');
   if(v.parent!=null){var p=m.volumes[v.parent];if(!p||p.id>=i||Math.abs(v.z0-p.z1)>1e-7||!supported(v.rect,p.rect))invalid.push('unsupported upper mass');}else if(v.z0!==0)invalid.push('floating ground');
  });var g=m.volumes.filter(function(v){return v.parent==null;});for(var i=0;i<g.length;i++)for(var j=i+1;j<g.length;j++)if(groundOverlap(g[i].rect,g[j].rect))invalid.push('overlapping ground');
  for(var a=0;a<m.volumes.length;a++)for(var z=a+1;z<m.volumes.length;z++){var A=m.volumes[a],B=m.volumes[z];if(Math.min(A.z1,B.z1)-Math.max(A.z0,B.z0)>1e-7&&groundOverlap(A.rect,B.rect))invalid.push('interpenetrating volumes');}
  var used=new Set();m.landscape.surfaces.forEach(function(s){s.cells.forEach(function(k){if(W.conditions.owner[k]!==q.id||W.conditions.flags[k]||used.has(k))invalid.push('surface ownership');used.add(k);});});
 });
 if(invalid.length)throw new Error('Urban geometry validation failed: '+invalid.slice(0,3).join(', '));
 return {models:W.blocks.buildings.length,invalid:0,volumes:W.urban.metrics.volumes};
}
function compile(W){
 var urban={version:VERSION,enabled:settings.enabled,settings:Object.assign({},settings),units:'V1 world units; mass heights/volumes are illustrative, not construction data',priority:['parcel ownership','pavement/water/slope reservations','ground support','frontage','district character','bounded variation'],metrics:{sites:0,volumes:0,groundArea:0,parcelArea:0,envelopeArea:0,volume:0,heightLimited:0,targetEnvelopeCoverage:1-settings.openness},districts:[],forms:{}};
 W.urban=urban;if(!settings.enabled){W.blocks.buildings.forEach(function(b){delete b.architecture;});return urban;}
 var index=RoadAtlasPipeline.debug.makeIndex(W.roads),groups=new Map();
 W.blocks.buildings.forEach(function(b){var q=W.conditions.parcels[b.parcelId],m=makeModel(W,b,q,index);b.architecture=m;urban.metrics.sites++;urban.metrics.volumes+=m.volumes.length;urban.metrics.groundArea+=m.metrics.groundArea;urban.metrics.parcelArea+=q.area;urban.metrics.volume+=m.metrics.volume;urban.metrics.heightLimited+=m.limits.heightLimited;urban.forms[m.form]=(urban.forms[m.form]||0)+1;
  if(!groups.has(q.districtId))groups.set(q.districtId,{id:q.districtId,kind:q.district,charter:m.context.charter.rule,reason:m.context.charter.reason,sites:0,parcelArea:0,groundArea:0,forms:{}});
  var g=groups.get(q.districtId);g.sites++;g.parcelArea+=q.area;g.groundArea+=m.metrics.groundArea;g.forms[m.form]=(g.forms[m.form]||0)+1;
  urban.metrics.envelopeArea+=m.metrics.envelopeArea;
 });
 urban.districts=Array.from(groups.values()).sort(function(a,b){return a.id-b.id;});urban.metrics.coverage=urban.metrics.parcelArea?urban.metrics.groundArea/urban.metrics.parcelArea:0;urban.metrics.envelopeCoverage=urban.metrics.envelopeArea?urban.metrics.groundArea/urban.metrics.envelopeArea:0;urban.validation=validate(W);return urban;
}
/* Map representation uses the existing cartographic projection and palette.
 * Every face's entire projected sweep was validated before this draws. */
function drawBuilding(ctx,W,b){
 var m=b.architecture,q=W.conditions.parcels[b.parcelId],T=THEMES[clamp(Math.round(P.theme),0,2)];
 ctx.save();ringsPath(ctx,q.rings);ctx.clip('evenodd');
 m.landscape.surfaces.forEach(function(s){ringsPath(ctx,s.rings);ctx.fillStyle=s.kind==='garden'?(P.theme===0?'#adbb91':'#29483e'):(P.theme===0?'#c6b999':'#34454d');ctx.globalAlpha=s.kind==='garden'?.4:.25;ctx.fill('evenodd');});ctx.globalAlpha=1;
 m.volumes.forEach(function(v){var ps=v.plan.map(function(p){return point(p.x+3+v.z1*.22,p.y+4+v.z1*.24);});poly(ctx,ps,T.bShadow);});
 m.landscape.trees.forEach(function(t){ctx.beginPath();ctx.arc(t.x,t.y,t.r,0,TAU);ctx.fillStyle=T.tree;ctx.fill();});
 m.volumes.forEach(function(v){
  var bottom=v.projectedBase,roof=v.projectedRoof,body=b.kind==='industrial'?T.ind:T.bCols[b.shade%T.bCols.length];
  // Full closed shell, clipped to its own allowed parcel. Thin dark outlines
  // read at map scale without the old exaggerated floating roof displacement.
  for(var i=0;i<4;i++){var j=(i+1)%4;poly(ctx,[bottom[i],bottom[j],roof[j],roof[i]],body,T.bShadow,.45);}
  poly(ctx,roof,T.bTop,T.bShadow,.65);
  if(v.role==='upper'){ctx.save();ctx.globalAlpha=.10;poly(ctx,roof,'#ffffff');ctx.restore();}
  if(v.rect.w>12&&v.rect.h>10){var c=point((roof[0].x+roof[2].x)*.5,(roof[0].y+roof[2].y)*.5);ctx.beginPath();ctx.moveTo(lerp(roof[0].x,c.x,.3),lerp(roof[0].y,c.y,.3));ctx.lineTo(lerp(roof[1].x,c.x,.3),lerp(roof[1].y,c.y,.3));ctx.strokeStyle=P.theme===0?'#c7ba99':'#64828c';ctx.lineWidth=.45;ctx.stroke();}
 });
 var path=m.landscape.internalPath.points;if(path.length>1){ctx.beginPath();path.forEach(function(p,i){if(!i)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);});ctx.strokeStyle=P.theme===0?'#e5d8b9':'#68796e';ctx.lineWidth=1.25;ctx.stroke();}
 ctx.restore();
}
function drawPatterns(ctx,W){
 if(!patternView||!W.urban||!W.urban.enabled)return;
 var colors={center:'#d6a254',courtyard:'#b986a3',terraced:'#8eb19c',garden:'#90ae72',waterfront:'#6aa7b5',working:'#9491b7'};
 ctx.save();W.blocks.buildings.forEach(function(b){var m=b.architecture,q=W.conditions.parcels[b.parcelId];ringsPath(ctx,q.rings);ctx.fillStyle=colors[m.context.charter.rule]||'#969ba1';ctx.globalAlpha=.32;ctx.fill('evenodd');ctx.globalAlpha=.7;ctx.lineWidth=.75;ctx.strokeStyle=ctx.fillStyle;ctx.stroke();});ctx.restore();
}
var oldOverlays=renderOverlays,oldAny=anyLayerOn;
renderOverlays=function(){oldOverlays();if(world&&overlayCanvas)drawPatterns(overlayCanvas.getContext('2d'),world);};
anyLayerOn=function(){return oldAny()||!!(patternView&&world&&world.urban&&world.urban.enabled);};
function renderMap(){if(!world)return;var next=document.createElement('canvas');next.width=WORLD_W;next.height=WORLD_H;renderWorld(next.getContext('2d'),world);worldCanvas=next;renderOverlays();drawStatic();}
function setSettings(update){
 var previous=Object.assign({},settings);if(update.enabled!=null)settings.enabled=!!update.enabled;if(Object.prototype.hasOwnProperty.call(CHARACTERS,update.character))settings.character=update.character;
 if(update.openness!=null)settings.openness=num(String(update.openness),settings.openness,.15,.65);if(update.relief!=null)settings.relief=num(String(update.relief),settings.relief,.25,1.25);
 if(!world||!world.conditions){syncControls();return;}
 var prevUrban=world.urban,prevModels=world.blocks.buildings.map(function(b){return b.architecture;});
 try{compile(world);if(world.pipeline&&world.pipeline.metrics)world.pipeline.metrics.urban=world.urban.validation||{models:0,invalid:0};renderMap();refresh(false);}catch(e){settings=previous;world.urban=prevUrban;world.blocks.buildings.forEach(function(b,i){if(prevModels[i])b.architecture=prevModels[i];else delete b.architecture;});showErr(e.message);console.error(e);}syncControls();
}
function queryParameters(u){u.searchParams.set('urban',settings.enabled?'1':'0');u.searchParams.set('character',settings.character);u.searchParams.set('openness',settings.openness);u.searchParams.set('relief',settings.relief);return u;}
function exportData(W){return W.urban?JSON.parse(JSON.stringify(W.urban)):null;}
/* The site study is a second view of the committed model, not an illustration
 * or separately generated building. Stage exports use these same functions. */
function studyBuilding(){if(!world||!world.urban||!world.urban.enabled)return null;return world.blocks.buildings.find(function(b){return b.parcelId===selectedId;})||null;}
function pickStudy(){if(!world||!world.urban||!world.urban.enabled)return null;var candidates=world.blocks.buildings.slice().sort(function(a,b){var A=a.architecture,B=b.architecture;return (B.volumes.length*15+Math.sqrt(B.metrics.parcelArea))-(A.volumes.length*15+Math.sqrt(A.metrics.parcelArea))||a.parcelId-b.parcelId;});return candidates[0]||null;}
function drawStudy(ctx,box,W,b,step){
 var m=b.architecture,q=W.conditions.parcels[b.parcelId],f=m.context.frame,raw=function(p,z){var v=loc(f,p),x=v.x,y=-v.y;return point((x-y)*.866,(x+y)*.5-z);};
 var ext=[];q.rings.forEach(function(r){r.forEach(function(p){ext.push(raw(p,0));});});m.volumes.forEach(function(v){v.plan.forEach(function(p){ext.push(raw(p,v.z1));});});
 var xmin=Math.min.apply(null,ext.map(function(p){return p.x;})),xmax=Math.max.apply(null,ext.map(function(p){return p.x;})),ymin=Math.min.apply(null,ext.map(function(p){return p.y;})),ymax=Math.max.apply(null,ext.map(function(p){return p.y;}));
 var s=Math.min((box.w-64)/(xmax-xmin+24),(box.h-55)/(ymax-ymin+26)),ox=box.x+box.w*.5-(xmin+xmax)*s/2,oy=box.y+box.h*.51-(ymin+ymax)*s/2;
 var proj=function(p,z){var v=raw(p,z||0);return point(ox+v.x*s,oy+v.y*s);};
 ctx.save();ctx.beginPath();ctx.rect(box.x,box.y,box.w,box.h);ctx.clip();ctx.fillStyle='#fafbf9';ctx.fillRect(box.x,box.y,box.w,box.h);
 // Nearby field contours and real street centerlines form the context drawing.
 var radius=Math.max(f.w,f.h)*1.4+25,C=W.conditions;
 ctx.save();ctx.strokeStyle='#e2e7e4';ctx.lineWidth=.65;ctx.beginPath();
 (C.topography.contours||[]).forEach(function(c){c.lines.forEach(function(line){var drawing=false;line.forEach(function(p){var v=loc(f,p);if(Math.abs(v.x)<radius&&Math.abs(v.y)<radius){var a=proj(p);if(!drawing)ctx.moveTo(a.x,a.y);else ctx.lineTo(a.x,a.y);drawing=true;}else drawing=false;});});});ctx.stroke();
 W.roads.forEach(function(r){var pts=r.pts;if(!pts.some(function(p){return Math.hypot(p.x-b.cx,p.y-b.cy)<radius;}))return;ctx.beginPath();pts.forEach(function(p,i){var a=proj(p);if(!i)ctx.moveTo(a.x,a.y);else ctx.lineTo(a.x,a.y);});ctx.strokeStyle='#e7ebeb';ctx.lineWidth=(r.cls===0?6:r.cls===1?9:12)*s;ctx.stroke();ctx.strokeStyle='#c4cfd2';ctx.lineWidth=.8;ctx.stroke();});ctx.restore();
 // The site includes holes exactly; do not fill a bounding rectangle.
 ringsPath(ctx,q.rings,proj);ctx.fillStyle=step===0?'#f7dcb7':'#f1f1e8';ctx.fill('evenodd');ctx.strokeStyle='#b8afa0';ctx.lineWidth=1.2;ctx.stroke();
 if(step>=1){poly(ctx,corners(b).map(function(p){return proj(p,0);}),step===1?'#f7d6a8':'#efebe0');ctx.save();ctx.setLineDash([5,4]);poly(ctx,corners(b).map(function(p){return proj(p,0);}),null,'#c19661',1);ctx.restore();}
 if(step>=4){m.landscape.surfaces.forEach(function(a){ringsPath(ctx,a.rings,proj);ctx.fillStyle=a.kind==='garden'?'#dae4cc':'#e2dccb';ctx.fill('evenodd');});}
 var vols=m.volumes.filter(function(v){return step>=3||v.parent==null;});
 if(step>=2){
  vols.forEach(function(v){var shadow=v.plan.map(function(p){return proj(point(p.x+v.z1*.35,p.y+v.z1*.22),0);});ctx.save();ringsPath(ctx,q.rings,proj);ctx.clip('evenodd');poly(ctx,shadow,'#cdd5d580');ctx.restore();});
  vols.sort(function(a,b){return a.z0-b.z0||raw(point(a.rect.cx,a.rect.cy),0).y-raw(point(b.rect.cx,b.rect.cy),0).y||a.id-b.id;});
  vols.forEach(function(v){
   var down=v.plan.map(function(p){return proj(p,v.z0);}),top=v.plan.map(function(p){return proj(p,v.z1);}),emphasis=step===2||(step===3&&v.parent!=null),roof=emphasis?'#f4cfaa':v.parent!=null?'#f5eadb':'#f8f8f2';
   // Draw only camera-facing walls. World face normals are transformed into
   // study-frame x/y before comparing to the (+x,-y) camera direction.
   for(var i=0;i<4;i++){var j=(i+1)%4,a=loc(f,v.plan[i]),z=loc(f,v.plan[j]),nx=z.y-a.y,ny=-(z.x-a.x);if(nx-ny<=1e-8)continue;
    var face=[down[i],down[j],top[j],top[i]];poly(ctx,face,emphasis?'#d8bda3':nx>0?'#cad5d9':'#e1e6e5','#95a2a6',.75);
    if(step===5&&v.z1-v.z0>1.4){
     ctx.save();poly(ctx,face,null);ctx.clip();var floors=Math.max(1,Math.floor((v.z1-v.z0)/4)),span=Math.hypot(v.plan[j].x-v.plan[i].x,v.plan[j].y-v.plan[i].y),bays=Math.max(1,Math.floor(span/4));
     for(var zlev=0;zlev<floors;zlev++){var za=lerp(v.z0,v.z1,(zlev+.21)/floors),zb=lerp(v.z0,v.z1,(zlev+.71)/floors);
      for(var bay=0;bay<bays;bay++){var pa=point(lerp(v.plan[i].x,v.plan[j].x,(bay+.14)/bays),lerp(v.plan[i].y,v.plan[j].y,(bay+.14)/bays)),pb=point(lerp(v.plan[i].x,v.plan[j].x,(bay+.86)/bays),lerp(v.plan[i].y,v.plan[j].y,(bay+.86)/bays));poly(ctx,[proj(pa,za),proj(pb,za),proj(pb,zb),proj(pa,zb)],'#9eb5bf',null);}
     }ctx.restore();
    }
   }
   poly(ctx,top,roof,emphasis?'#bd9670':'#96a3a4',.95);
   if(step===5){var a=top[0],z=top[1],c=top[2],d=top[3];ctx.beginPath();ctx.moveTo(lerp(a.x,d.x,.10),lerp(a.y,d.y,.10));ctx.lineTo(lerp(z.x,c.x,.10),lerp(z.y,c.y,.10));ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.stroke();}
  });
 }
 if(step>=4){
  var ps=m.landscape.internalPath.points;if(ps.length){ctx.beginPath();ps.forEach(function(p,i){var a=proj(p);if(!i)ctx.moveTo(a.x,a.y);else ctx.lineTo(a.x,a.y);});ctx.lineCap='round';ctx.strokeStyle='#c9ae80';ctx.lineWidth=Math.max(1.5,1.5*s);ctx.stroke();}
  m.landscape.trees.forEach(function(t){var p=proj(t,0),top=proj(t,t.h),r=t.r*s;ctx.beginPath();ctx.ellipse(p.x,p.y,r*1.5,r*.65,0,0,TAU);ctx.fillStyle='#b6c6a1';ctx.fill();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(top.x,top.y);ctx.strokeStyle='#899377';ctx.lineWidth=Math.max(.8,.25*s);ctx.stroke();ctx.beginPath();ctx.ellipse(top.x,top.y,r,r*1.3,0,0,TAU);ctx.fillStyle='#a7bd8b';ctx.fill();ctx.strokeStyle='#93aa7a';ctx.lineWidth=.65;ctx.stroke();});
 }
 if(step<2){var center=proj(point(b.cx,b.cy));ctx.textAlign='center';ctx.font='600 '+Math.max(11,Math.min(17,box.w*.034))+'px system-ui,sans-serif';ctx.fillStyle='#a77d48';ctx.fillText(step===0?'ASSIGNED SITE':'FITTED ENVELOPE',center.x,center.y);}
 var front=m.context.frontage;
 if(front){var a=proj(front,0),c=proj(point(b.cx,b.cy),0);var vx=c.x-a.x,vy=c.y-a.y,L=Math.hypot(vx,vy)||1,tip=point(a.x+vx/L*15,a.y+vy/L*15);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(tip.x,tip.y);ctx.strokeStyle='#c28f4c';ctx.lineWidth=1.6;ctx.stroke();poly(ctx,[tip,point(tip.x-vx/L*6-vy/L*3,tip.y-vy/L*6+vx/L*3),point(tip.x-vx/L*6+vy/L*3,tip.y-vy/L*6-vx/L*3)],'#c28f4c');}
 ctx.fillStyle='#80908d';ctx.font='10px system-ui,sans-serif';ctx.textAlign='left';ctx.fillText('Same committed parcel • illustrative massing',box.x+16,box.y+box.h-14);ctx.restore();
}
function phaseText(b,step){var m=b.architecture;return [
 'The assigned parcel, including all notches and holes, is the hard boundary. No roads or neighboring parcels move.',
 'This is the existing fitted building envelope inside the road, water, slope and ownership reservations. The study does not invent a larger site.',
 m.label+' carves '+Math.round((1-m.metrics.groundArea/m.metrics.envelopeArea)*100)+'% of the fitted envelope away from the ground masses. Separate ground parts never overlap.',
 'Each upper mass is inset into its actual lower support. Heights are reduced wherever the complete map projection would leave the parcel.',
 'Remaining owned cells become gardens or paving. The entrance approach is internal to this parcel; a public pedestrian connection is not certified.',
 'The same volumes now show facade bays, roof retreats and bounded landscape. This is a procedural design study, not a construction or environmental analysis.'
 ][step];}
function paintStudy(){
 if(!studyCanvas)return;var dialog=document.getElementById('urbanStudy');if(!dialog.open)return;var r=studyCanvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2),w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));if(studyCanvas.width!==w)studyCanvas.width=w;if(studyCanvas.height!==h)studyCanvas.height=h;var ctx=studyCanvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);var b=studyBuilding();
 if(b)drawStudy(ctx,{x:0,y:0,w:r.width,h:r.height},world,b,phase);else{ctx.fillStyle='#f7f8f5';ctx.fillRect(0,0,r.width,r.height);ctx.fillStyle='#69746e';ctx.font='15px system-ui';ctx.fillText('Enable building grammar in Ordered mode to inspect a site.',22,42);}
 var info=document.getElementById('urbanStudyInfo');info.replaceChildren();document.getElementById('urbanPlateBtn').disabled=!b;document.getElementById('urbanSiteDataBtn').disabled=!b;if(!b){document.getElementById('urbanStudyTitle').textContent='Site study · grammar inactive';document.getElementById('urbanPhaseText').textContent='Enable building grammar in Ordered mode. The existing cartographic or Original V1 buildings remain available without this layer.';document.getElementById('urbanReason').textContent='';return;}var m=b.architecture;
 document.getElementById('urbanStudyTitle').textContent='Parcel '+b.parcelId+' · '+m.label;
 document.getElementById('urbanPhaseText').textContent=phaseText(b,phase);
 var facts=[['District pattern',m.context.charter.rule],['Site area',m.metrics.parcelArea.toFixed(0)+' units²'],['Ground coverage',(m.metrics.groundCoverage*100).toFixed(1)+'% of parcel'],['Supported volumes',String(m.volumes.length)],['Highest mass',m.metrics.maxHeight.toFixed(1)+' world units'],['Slope index',m.context.slopeIndex.toFixed(3)],['Height constraints',m.limits.heightLimited+' mass caps']];
 facts.forEach(function(a){var dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=a[0];dd.textContent=a[1];info.append(dt,dd);});
 document.getElementById('urbanReason').textContent=m.context.charter.reason;
 document.querySelectorAll('[data-urban-phase]').forEach(function(b){var on=+b.dataset.urbanPhase===phase;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
function openStudy(id){
 var requested=world&&world.blocks.buildings.find(function(b){return b.parcelId===id&&b.architecture;});var b=requested||studyBuilding()||pickStudy();selectedId=b?b.parcelId:null;
 document.getElementById('layersPanel').classList.remove('open');document.getElementById('analysisPanel').classList.remove('open');document.getElementById('conditionInspector').hidden=true;
 var dialog=document.getElementById('urbanStudy');focusBefore=document.activeElement;if(!dialog.open){if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');}refresh(false);requestAnimationFrame(paintStudy);
}
function closeStudy(){var d=document.getElementById('urbanStudy');if(d.close)d.close();else d.removeAttribute('open');if(focusBefore&&focusBefore.isConnected)focusBefore.focus();}
function stepTo(n){phase=clamp(n,0,5);paintStudy();}
function cycleSite(delta){if(!world)return;var b=world.blocks.buildings.filter(function(b){return b.architecture;});if(!b.length)return;var i=b.findIndex(function(b){return b.parcelId===selectedId;});selectedId=b[(i+delta+b.length)%b.length].parcelId;refresh(false);}
function downloadBlob(blob,name){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},3000);}
function exportPlate(){var b=studyBuilding();if(!b)return;var c=document.createElement('canvas');c.width=1680;c.height=2040;var g=c.getContext('2d');g.fillStyle='#fafbf9';g.fillRect(0,0,c.width,c.height);g.fillStyle='#283b38';g.font='600 32px system-ui';g.fillText('ROAD ATLAS / SITE STUDY',54,60);g.font='18px system-ui';g.fillStyle='#687b73';g.fillText('Parcel '+b.parcelId+' · '+b.architecture.label+' · '+world.seed,54,94);
 for(var i=0;i<6;i++){var x=32+(i%2)*816,y=130+Math.floor(i/2)*620;drawStudy(g,{x:x,y:y,w:800,h:538},world,b,i);g.fillStyle='#b2874e';g.font='600 19px system-ui';g.fillText('0'+(i+1)+'  '+PHASES[i].toUpperCase(),x+25,y+564);g.fillStyle='#77877f';g.font='15px system-ui';var line=['Assigned boundary with exclusions','Retained fitted envelope','Ground masses and carved voids','Parent-supported upper levels','Owned landscape and internal approach','Same model, facade and roof detail'][i];g.fillText(line,x+25,y+590);}
 g.fillStyle='#7c8983';g.font='14px system-ui';g.fillText('Illustrative procedural geometry • not a construction, zoning, daylight or wind assessment.',54,2010);
 window.__urbanPlate=c; c.toBlob(function(blob){if(blob)downloadBlob(blob,'road-atlas-site-'+b.parcelId+'.png');},'image/png');
}
function exportSiteData(id){
 var b=id==null?studyBuilding():world&&world.blocks.buildings.find(function(b){return b.parcelId===id&&b.architecture;});if(!b)return null;
 var q=world.conditions.parcels[b.parcelId],m=b.architecture,front=m.context.frontage,r=front?world.roads[front.roadId]:null;
 return JSON.parse(JSON.stringify({format:'MOOR-Site-2.4',version:VERSION,seed:world.seed,units:'V1 world units; illustrative vertical massing',settings:settings,parcel:{id:q.id,rings:q.rings,area:q.area,district:q.district,frame:q.frame,rasterCell:world.conditions.cell,rasterColumns:world.conditions.w},envelope:{cx:b.cx,cy:b.cy,w:b.w,h:b.h,ang:b.ang},frontageRoad:r?{class:r.cls,points:r.pts}:null,model:m}));
}
function exportSite(){var d=exportSiteData();if(!d)return;window.__urbanSiteExport=d;downloadBlob(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}),'road-atlas-site-'+d.parcel.id+'.json');}
function onInspect(d){var slot=document.getElementById('urbanInspectorSlot');if(!slot)return;slot.hidden=!d.building||!world.urban||!world.urban.enabled;if(slot.hidden)return;var b=world.blocks.buildings[d.building.index];if(!b||!b.architecture){slot.hidden=true;return;}document.getElementById('urbanInspectorText').textContent=b.architecture.label+' · '+b.architecture.volumes.length+' supported masses · '+(b.architecture.metrics.envelopeCoverage*100).toFixed(1)+'% of fitted envelope occupied';document.getElementById('urbanInspectStudy').onclick=function(){openStudy(d.parcelId);};}
function syncControls(){document.querySelectorAll('[data-urban-setting]').forEach(function(el){var k=el.dataset.urbanSetting;if(el.type==='checkbox')el.checked=settings[k];else el.value=String(settings[k]);});document.querySelectorAll('[data-urban-output]').forEach(function(el){var k=el.dataset.urbanOutput;el.textContent=k==='openness'?Math.round(settings[k]*100)+'%':settings[k].toFixed(2)+'×';});}
function refresh(reset){
 if(reset!==false){selectedId=null;var slot=document.getElementById('urbanInspectorSlot');if(slot)slot.hidden=true;}
 var status=document.getElementById('urbanStatus'),list=document.getElementById('urbanDistrictList'),selector=document.getElementById('urbanSiteSelect');if(!status)return;
 list.replaceChildren();selector.replaceChildren();var U=world&&world.urban;
 if(!U||!U.enabled){status.textContent='Building grammar is off. Existing cartographic buildings are retained; Original V1 is also unchanged.';syncControls();paintStudy();return;}
 status.textContent=U.metrics.sites+' fitted sites · '+U.metrics.volumes+' supported masses · '+(U.metrics.envelopeCoverage*100).toFixed(1)+'% of fitted envelopes occupied · '+(U.metrics.coverage*100).toFixed(1)+'% occupied-parcel ground coverage. Streets and parcel boundaries are unchanged.';
 U.districts.forEach(function(d){var row=document.createElement('div');row.className='urbanDistrict';var strong=document.createElement('strong');strong.textContent=d.kind+' / '+d.charter;var note=document.createElement('span');note.textContent=d.sites+' sites · '+(d.groundArea/d.parcelArea*100).toFixed(0)+'% ground coverage';row.append(strong,note);list.appendChild(row);});
 world.blocks.buildings.forEach(function(b){if(!b.architecture)return;var o=document.createElement('option');o.value=b.parcelId;o.textContent='#'+b.parcelId+' · '+b.architecture.label;selector.appendChild(o);});
 if(!studyBuilding()){var b=pickStudy();selectedId=b?b.parcelId:null;}selector.value=String(selectedId);syncControls();paintStudy();
}
function installUI(){
 var style=document.createElement('style');style.textContent=`
 .urbanDistrict{display:flex;flex-direction:column;border-top:1px solid #ffffff18;padding:8px 0;gap:3px;font-size:11px;color:#b8c7c5}.urbanDistrict span{color:#8b9f99;font-size:10px}
 #urbanStatus{font-size:11px;line-height:1.6;color:#b6cabe;margin:10px 0}.urbanAction{padding:10px 12px;min-height:42px;border:1px solid #82998c;background:#28433a;border-radius:9px;color:#eaf3e9;cursor:pointer;font:inherit}
 #urbanInspectorSlot{padding-top:8px;border-top:1px solid #ffffff22}#urbanInspectorText{font-size:11px;line-height:1.6}
 #urbanStudy{padding:0;width:min(1180px,calc(100vw - 24px));height:min(820px,calc(100dvh - 24px));max-width:none;max-height:none;box-sizing:border-box;border:1px solid #d7dfd9;border-radius:16px;background:#f9fbf7;color:#33443d;box-shadow:0 32px 100px #0007;overflow:hidden}
 #urbanStudy::backdrop{background:#061510bb;backdrop-filter:blur(5px)}#urbanStudy[open]{display:flex;flex-direction:column}
 #urbanStudy *{box-sizing:border-box}#urbanStudy button,#urbanStudy select,#urbanStudy input{font:inherit}#urbanStudy button{cursor:pointer}
 .urbanHead{display:flex;align-items:center;gap:12px;padding:16px 20px;border-bottom:1px solid #dde4db;flex:none}.urbanHead small{font-size:10px;letter-spacing:.13em;color:#8a9484;display:block;margin-bottom:5px}.urbanHead h2{font-size:17px;margin:0;font-weight:650;letter-spacing:-.015em}.urbanHead .urbanClose{margin-left:auto;background:#edf1e8;border:0;border-radius:8px;width:38px;height:38px;color:#586756;font-size:22px}
 .urbanBody{display:grid;grid-template-columns:minmax(0,1fr) 304px;min-height:0;flex:1;overflow:auto}.urbanDrawing{display:flex;flex-direction:column;min-width:0;min-height:0;border-right:1px solid #e0e5dc}.urbanStudyCanvasWrap{flex:1;min-height:300px;position:relative}#urbanStudyCanvas{display:block;width:100%;height:100%}
 .urbanPhases{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;padding:12px}.urbanPhases button{border:1px solid #d9e1d6;border-radius:8px;background:#f6f8f2;color:#6e7a6b;min-height:48px;font-size:11px;line-height:1.4;padding:7px 4px}.urbanPhases button.active{background:#e6cba4;border-color:#c8a370;color:#564331}.urbanPhases button small{display:block;opacity:.65;font-size:9px}
 #urbanPhaseText{font-size:12px;line-height:1.6;margin:0;padding:0 18px 16px;min-height:69px;color:#6d7b6f}.urbanSide{padding:15px 18px;overflow:auto;background:#f5f7f0}.urbanSide h3{font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#8c9685;margin:17px 0 8px}.urbanSide select{width:100%;min-height:40px;padding:8px;background:#fff;border:1px solid #d3ddcc;border-radius:7px;color:#3a5146}.urbanBrowse{display:flex;gap:6px;margin:8px 0}.urbanBrowse button{flex:1;min-height:32px;background:#edf1e6;border:1px solid #d5dfcf;border-radius:7px;color:#607357}
 #urbanStudyInfo{display:grid;grid-template-columns:1fr 1fr;gap:7px;font-size:11px;line-height:1.5}#urbanStudyInfo dt{color:#88917f}#urbanStudyInfo dd{margin:0;color:#4c6154;text-align:right;font-variant-numeric:tabular-nums}#urbanReason{font-size:12px;line-height:1.6;color:#728069}
 .urbanKnobs{border-top:1px solid #d6dfd1;margin-top:13px;padding-top:8px}.urbanKnobs label{display:block;font-size:12px;line-height:1.6;margin:10px 0}.urbanKnobs output{float:right;color:#a37945}.urbanKnobs input[type=range]{display:block;width:100%;accent-color:#a88954}.urbanKnobs input[type=checkbox]{accent-color:#73906c}.urbanCaveat{font-size:10px;line-height:1.6;color:#99a18f}
 #urbanPlateBtn,#urbanSiteDataBtn{width:100%;margin-top:8px}.urbanSide .urbanAction{font-size:12px;background:#3d5649;border-color:#3d5649}
 @media(max-width:1100px){#topbar .sub,#topbar .meta{display:none}#topbar{gap:6px;padding:0 8px}#topbar .tbtn{font-size:12px;padding:8px 9px}}
 @media(max-width:700px){#urbanStudy{width:100vw;height:96dvh;border-radius:14px 14px 0 0;position:fixed;top:auto;bottom:0;margin:0;max-height:96dvh}.urbanHead{padding:11px 14px}.urbanHead h2{font-size:14px}.urbanBody{display:block}.urbanDrawing{border-right:0}.urbanStudyCanvasWrap{height:43dvh;min-height:280px;flex:none}.urbanPhases{grid-template-columns:repeat(3,1fr);gap:5px;padding:8px 12px}.urbanPhases button{min-height:37px;font-size:11px}.urbanPhases button small{display:inline;margin-right:5px}#urbanPhaseText{min-height:0;font-size:11px;padding-bottom:12px}.urbanSide{overflow:visible;padding:15px}.urbanSide select{font-size:16px}#urbanStudyInfo{font-size:12px}}
 `;document.head.appendChild(style);
 var design=document.createElement('button');design.id='urbanDesignBtn';design.className='tbtn';design.type='button';design.textContent='Design';design.title='Inspect the actual site-to-building sequence';design.onclick=function(){openStudy();};document.getElementById('topbar').insertBefore(design,document.getElementById('layersBtn'));
 var layer=document.createElement('button');layer.type='button';layer.id='urbanPatterns';layer.className='lchip';layer.textContent='Neighborhood pattern field';layer.setAttribute('aria-pressed','false');layer.onclick=function(){patternView=!patternView;layer.classList.toggle('on',patternView);layer.setAttribute('aria-pressed',String(patternView));renderOverlays();drawStatic();};document.getElementById('layersPanel').appendChild(layer);
 var analysis=document.createElement('details');analysis.className='cond-detail';analysis.id='urbanAnalysis';analysis.innerHTML='<summary>Building grammar & district patterns</summary><div id="urbanStatus"></div><div id="urbanDistrictList"></div><button class="urbanAction" id="urbanStudyFromAnalysis" type="button">Study a fitted site</button><p class="cond-note">Pattern colors: amber center · rose court · pale green stepped · green garden · blue waterfront · violet working. These are design rules, not performance ratings.</p>';document.getElementById('analysisPanel').appendChild(analysis);document.getElementById('urbanStudyFromAnalysis').onclick=function(){openStudy();};
 var slot=document.createElement('div');slot.id='urbanInspectorSlot';slot.hidden=true;slot.innerHTML='<p id="urbanInspectorText"></p><button class="urbanAction" id="urbanInspectStudy" type="button">Site → building study</button>';document.getElementById('conditionInspector').appendChild(slot);
 var dialog=document.createElement('dialog');dialog.id='urbanStudy';dialog.setAttribute('aria-labelledby','urbanStudyTitle');dialog.innerHTML='<header class="urbanHead"><div><small>ROAD ATLAS / GENERATIVE ARCHITECTURE</small><h2 id="urbanStudyTitle">Site study</h2></div><button class="urbanClose" type="button" aria-label="Close site study">×</button></header><div class="urbanBody"><section class="urbanDrawing"><div class="urbanStudyCanvasWrap"><canvas id="urbanStudyCanvas" aria-label="Isometric view of the selected committed site"></canvas></div><nav class="urbanPhases" aria-label="Site design stages"></nav><p id="urbanPhaseText"></p></section><aside class="urbanSide"><h3>Selected site</h3><select id="urbanSiteSelect" aria-label="Select fitted site"></select><div class="urbanBrowse"><button id="urbanPrev" type="button">← Previous</button><button id="urbanNext" type="button">Next →</button></div><h3>Conditions → form</h3><dl id="urbanStudyInfo"></dl><p id="urbanReason"></p><div class="urbanKnobs"><label><input type="checkbox" data-urban-setting="enabled"> Building grammar</label><label>Neighborhood character<select data-urban-setting="character"></select></label><label>Courts & gaps <output data-urban-output="openness"></output><input data-urban-setting="openness" type="range" min="0.15" max="0.65" step="0.05"></label><label>Illustrative height <output data-urban-output="relief"></output><input data-urban-setting="relief" type="range" min="0.25" max="1.25" step="0.05"></label><p class="urbanCaveat">These controls rebuild building forms only. Roads, terrain and parcel ownership stay fixed. Heights are illustrative; no structural, daylight, wind or zoning compliance is implied.</p></div><button id="urbanPlateBtn" class="urbanAction" type="button">Export six-stage PNG</button><button id="urbanSiteDataBtn" class="urbanAction" type="button">Export this site as JSON</button></aside></div>';
 document.body.appendChild(dialog);dialog.querySelector('.urbanClose').onclick=closeStudy;dialog.addEventListener('cancel',function(e){e.preventDefault();closeStudy();});dialog.addEventListener('click',function(e){if(e.target===dialog){var r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeStudy();}});
 var steps=dialog.querySelector('.urbanPhases');PHASES.forEach(function(name,i){var btn=document.createElement('button');btn.type='button';btn.dataset.urbanPhase=i;btn.innerHTML='<small>0'+(i+1)+'</small>'+name;btn.onclick=function(){stepTo(i);};steps.appendChild(btn);});
 var select=dialog.querySelector('[data-urban-setting="character"]');Object.keys(CHARACTERS).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=CHARACTERS[k];select.appendChild(o);});
 dialog.querySelectorAll('[data-urban-setting]').forEach(function(el){var key=el.dataset.urbanSetting;function commit(){var up={};up[key]=el.type==='checkbox'?el.checked:el.type==='range'?+el.value:el.value;setSettings(up);}el.onchange=function(){clearTimeout(timer);commit();};if(el.type==='range')el.oninput=function(){var o=dialog.querySelector('[data-urban-output="'+key+'"]');o.textContent=key==='openness'?Math.round(+el.value*100)+'%':(+el.value).toFixed(2)+'×';clearTimeout(timer);timer=setTimeout(commit,140);};});
 document.getElementById('urbanSiteSelect').onchange=function(){selectedId=+this.value;paintStudy();};document.getElementById('urbanPrev').onclick=function(){cycleSite(-1);};document.getElementById('urbanNext').onclick=function(){cycleSite(1);};document.getElementById('urbanPlateBtn').onclick=exportPlate;document.getElementById('urbanSiteDataBtn').onclick=exportSite;
 studyCanvas=document.getElementById('urbanStudyCanvas');if(window.ResizeObserver)new ResizeObserver(function(){if(dialog.open)paintStudy();}).observe(studyCanvas.parentElement);else addEventListener('resize',paintStudy);syncControls();
}
window.RoadAtlasUrban={version:VERSION,compile:compile,validate:validate,drawBuilding:drawBuilding,refresh:refresh,onInspect:onInspect,queryParameters:queryParameters,exportData:exportData,setSettings:setSettings,getSettings:function(){return Object.assign({},settings);},openStudy:openStudy,closeStudy:closeStudy,setPhase:stepTo,exportPlate:exportPlate,exportSiteData:exportSiteData,drawStudy:drawStudy,debug:{projectedBound:projectedBound,groundOverlap:groundOverlap,supported:supported,corners:corners,mapPoint:mapPoint}};
installUI();
})();
