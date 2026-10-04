/* MOOR ecology contract v1.0.0. Deterministic model data, not a biological simulation.
 * normalized climate -> seeded flora -> traits -> habitat/food/material descriptors.
 * Terrain hosts own the height field. This module never positions camera or roots. */
(function(root){'use strict';
const VERSION='1.0.0',clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
function hash(s){let h=2166136261;for(let c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const FAMILIES={oak:{name:'Meadow oak',desc:'Open branching, broad curled leaves, and an irregular crown.',height:6,color:0x6a923f},birch:{name:'Silver birch',desc:'Slender pale stems, fine branching, and small fluttering leaves.',height:7,color:0x8fac52},willow:{name:'River willow',desc:'Long arching branches carry curtains of narrow leaves.',height:5.5,color:0x789655},cedar:{name:'Mountain cedar',desc:'Layered whorls of needle-bearing branches taper toward the light.',height:7,color:0x3e6e59},shrub:{name:'Wild shrub',desc:'A low multistem crown with small leaves and branch clusters.',height:1.8,color:0x62833f},fern:{name:'Woodland fern',desc:'Unfurling curved fronds with paired, tapering leaflets.',height:1.2,color:0x4d884b},flower:{name:'Meadow flowers',desc:'Branching stems, radial petals, warm pollen centers, and pointed leaves.',height:1,color:0x6e974d},grass:{name:'Tussock grass',desc:'Curved individual blades grow outward from dense shared roots.',height:0.8,color:0x8a9b4d}};
const types=['TERRAN','OCEAN','DESERT','ICE','LAVA','JUNGLE','BARREN','GAS','CRYSTAL','TOXIC'];
const preference={oak:[.55,.6],birch:[.35,.5],willow:[.55,.9],cedar:[.28,.42],shrub:[.55,.4],fern:[.45,.85],flower:[.55,.5],grass:[.45,.38]};
const woody=new Set(['oak','birch','willow','cedar','shrub']);
function flora(seed,type='TERRAN'){
 if(!types.includes(type)||!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Invalid planet identity');
 if(['GAS','BARREN','LAVA'].includes(type))return [];
 let prefixes={TERRAN:'Meadow',OCEAN:'Coastal',DESERT:'Dune',ICE:'Frost',JUNGLE:'Canopy',CRYSTAL:'Prism',TOXIC:'Mire'};
 return Object.keys(FAMILIES).filter(f=>type!=='ICE'||['grass','shrub','flower'].includes(f)).map(f=>{
 let s=hash(seed+':'+type+':'+f+':'+VERSION),r=rng(s),[t,p]=preference[f];
 if(type==='DESERT'){t=.75;p=.15;}if(type==='JUNGLE'){t=.75;p=.85;}if(type==='ICE'){t=.09;p=.35;}
 let toxic=type==='TOXIC',mineral=type==='CRYSTAL';let lifespan=woody.has(f)?20+Math.floor(r()*140):1+Math.floor(r()*8);
 const chemistry={edible:!toxic&&!mineral,toxicity:toxic?.6+r()*.4:0,mineralFraction:mineral?.18+r()*.22:.01+r()*.03,waterFraction:clamp(.45+p*.3)};
 return {id:'flora-'+seed.toString(36)+'-'+type.toLowerCase()+'-'+f,seed:s,family:f,name:prefixes[type]+' '+({oak:'oak',birch:'birch',willow:'willow',cedar:'cedar',shrub:'shrub',fern:'fern',flower:'flowers',grass:'grass'}[f]),planetSeed:seed,planetType:type,traits:{heightScale:(.65+r()*.65)*(type==='DESERT'?.55:type==='ICE'?.35:type==='JUNGLE'?1.3:1),spread:.7+r()*.6,leafWidth:(.7+r()*.65)*(type==='DESERT'?.45:type==='JUNGLE'?1.3:type==='CRYSTAL'?.6:1),curl:.07+r()*.14,hueShift:toxic?.1:mineral?-.24:(r()-.5)*.05,lifespanYears:lifespan,droughtTolerance:clamp(1-p+(r()-.5)*.15),coldTolerance:clamp(1-t),preferredTemp:t,preferredMoisture:p},chemistry,resources:woody.has(f)?['wood','fiber','leaves','seeds']:f==='flower'?['fiber','leaves','nectar','seeds']:f==='fern'?['fiber','leaves','spores']:['fiber','leaves','seeds'],habitat:woody.has(f)?'canopy and cover':f==='fern'?'understory cover':f==='flower'?'pollinator forage':'grazer forage'};
 });
}
function validateEnvironment(e){
 if(!e||!types.includes(e.type)||(!Number.isInteger(e.planetSeed)||e.planetSeed<0||e.planetSeed>4294967295))throw Error('Invalid ecology environment');
 for(let k of ['temp','precip','heightM','slope','wetness','soil'])if(!Number.isFinite(e[k]))throw Error('Invalid environment '+k);
 if(!['land','water','gas','sterile'].includes(e.surface))throw Error('Invalid environment surface');
 return {...e,temp:clamp(e.temp),precip:clamp(e.precip),slope:clamp(e.slope),wetness:clamp(e.wetness),soil:clamp(e.soil),vegetation:clamp(Number.isFinite(e.vegetation)?e.vegetation:1,0,1.5)};
}
function suitability(s,env){let e=validateEnvironment(env);if(e.surface!=='land')return 0;let t=s.traits,p=clamp(e.precip*.72+e.wetness*.28);let a=Math.exp(-Math.pow((e.temp-t.preferredTemp)/.36,2)-Math.pow((p-t.preferredMoisture)/.46,2));let slopePenalty=woody.has(s.family)?1-e.slope*.85:1-e.slope*.55;return clamp(a*slopePenalty*(.3+.7*e.soil)*e.vegetation);}
function phenotype(s,env,season=.15){let e=validateEnvironment(env),fit=suitability(s,e);return {version:'1.0.0',seed:s.seed,family:s.family,age:clamp(.45+.65*fit,.25,1.4),spread:clamp(s.traits.spread*(.75+e.soil*.25),.45,1.5),density:clamp(.35+fit,.3,1.5),moisture:e.wetness,season:clamp(season),wind:clamp(.15+e.slope*.35),traits:{...s.traits},speciesId:s.id};}
function communities(env){let e=validateEnvironment(env);return flora(e.planetSeed,e.type).map(s=>({...s,suitability:+suitability(s,e).toFixed(4),phenotype:phenotype(s,e)})).filter(s=>s.suitability>.015).sort((a,b)=>b.suitability-a.suitability||a.id.localeCompare(b.id));}
function resources(s,scale=1){let h=FAMILIES[s.family].height*s.traits.heightScale*scale,wood=woody.has(s.family)?h*h*h*.8:0,leaves=woody.has(s.family)?h*h*.3:h*.35;
 return s.resources.map(name=>({id:s.id+':'+name,name,sourceSpeciesId:s.id,estimatedDryKg:+((name==='wood'?wood:name==='fiber'?leaves*.4:name==='leaves'?leaves:name==='nectar'?leaves*.025:leaves*.06)).toFixed(3),edible:s.chemistry.edible&&['leaves','seeds','nectar'].includes(name),toxicity:s.chemistry.toxicity,mineralFraction:s.chemistry.mineralFraction,renewal:name==='wood'?'slow growth':name==='fiber'?'regrowth':'seasonal',estimate:true}));}
function ecology(env){let e=validateEnvironment(env),plants=communities(e);let foods=plants.flatMap(s=>resources(s).filter(r=>r.edible).map(r=>({...r,relativeAvailability:+(s.suitability*r.estimatedDryKg).toFixed(4)})));return{format:'moor-ecology',version:VERSION,environment:e,flora:plants,foodSources:foods,habitat:{canopy:plants.filter(s=>woody.has(s.family)).reduce((n,s)=>n+s.suitability,0),groundForage:plants.filter(s=>['grass','flower'].includes(s.family)).reduce((n,s)=>n+s.suitability,0),understory:plants.filter(s=>['fern','shrub'].includes(s.family)).reduce((n,s)=>n+s.suitability,0),waterAccess:e.wetness,thermalComfort:e.temp},organicMaterials:plants.flatMap(s=>resources(s).filter(r=>['wood','fiber'].includes(r.name))),limits:['Food and mass are model estimates, not harvestable inventory.','No aquatic flora or creature behavior is integrated.','Environment heights come from the terrain host; roots remain GPU placed.']};}
function validatePacket(p){if(!p||p.format!=='moor-ecology'||p.version!==VERSION)throw Error('Unsupported ecology packet');return ecology(validateEnvironment(p.environment));}
const api={version:VERSION,families:FAMILIES,types,flora,suitability,phenotype,communities,resources,ecology,validateEnvironment,validatePacket,hash,rng};
api.build=function(T,recipe,quality=1,structure=false){
const families=FAMILIES;
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function empty(){return{p:[],c:[]};}
let buckets={bark:empty(),leaf:empty(),petal:empty()};
function tri(b,a,d,c,col){for(const v of [a,d,c]){b.p.push(v.x,v.y,v.z);b.c.push(col.r,col.g,col.b);}}
function tube(points,radius,color){const b=buckets.bark,N=quality===0?4:7;for(let j=0;j<points.length-1;j++){let tangent=points[Math.min(j+1,points.length-1)].clone().sub(points[Math.max(0,j-1)]).normalize();let side=tangent.clone().cross(Math.abs(tangent.y)>.9?V(1,0,0):V(0,1,0)).normalize(),up=side.clone().cross(tangent).normalize();let r0=radius*(1-j/(points.length-1)*.92),r1=radius*(1-(j+1)/(points.length-1)*.92);for(let k=0;k<N;k++){const ring=(p,r,k)=>p.clone().addScaledVector(side,Math.cos(k/N*Math.PI*2)*r).addScaledVector(up,Math.sin(k/N*Math.PI*2)*r);tri(b,ring(points[j],r0,k),ring(points[j+1],r1,k),ring(points[j],r0,k+1),color);tri(b,ring(points[j],r0,k+1),ring(points[j+1],r1,k),ring(points[j+1],r1,k+1),color);}}}
function curve(a,b,bend=0,steps=7){let pts=[];for(let i=0;i<=steps;i++){let t=i/steps,p=a.clone().lerp(b,t);p.y+=Math.sin(t*Math.PI)*bend;pts.push(p);}return pts;}
function leaf(base,dir,len,width,col,kind='leaf',curl=.1){dir=dir.clone().normalize();let side=dir.clone().cross(Math.abs(dir.y)>.9?V(1,0,0):V(0,1,0)).normalize();let n=side.clone().cross(dir).normalize();const row=(t,s)=>base.clone().addScaledVector(dir,len*t).addScaledVector(side,width*(recipe.traits?.leafWidth||1)*Math.sin(t*Math.PI)*s).addScaledVector(n,Math.sin(t*Math.PI)*len*(recipe.traits?.curl||curl)+Math.abs(s)*width*.13);let segments=quality===0?2:4;for(let i=0;i<segments;i++){let t=i/segments,u=(i+1)/segments;for(let s of [-1,1]){tri(buckets[kind],row(t,0),row(u,0),row(t,s),col);tri(buckets[kind],row(t,s),row(u,0),row(u,s),col);}}}
function colorOf(r,rand){let base=new T.Color(families[r.family].color);base.offsetHSL(r.traits?.hueShift||0,0,0);if(r.family!=='cedar'&&r.season>.5){let autumn=new T.Color(0xbf6b28);base.lerp(autumn,Math.min(1,(r.season-.5)*2));}base.multiplyScalar(.76+rand()*.44);return base;}
function plant(r,origin){const rand=rng(r.seed),f=families[r.family],h=f.height*r.age*(.72+.4*r.moisture)*(r.traits?.heightScale||1);const bark=new T.Color(r.family==='birch'?0xbec3b1:0x69513b);let count=0;const foliage=(p,d,len,w)=>{if(structure)return;leaf(p,d,len,w,colorOf(r,rand));count++;};
 if(['oak','birch','willow','shrub','cedar'].includes(r.family)){
 const trunks=r.family==='shrub'?3:1;
 for(let tt=0;tt<trunks;tt++){let a=origin.clone();let top=a.clone().add(V((rand()-.5)*h*.16,h*(.9+rand()*.1),(rand()-.5)*h*.15));let spine=curve(a,top,.04*h,12);tube(spine,h*(r.family==='birch'?.021:.038)/Math.sqrt(trunks),bark);
 const n=quality===0?5:r.family==='cedar'?24:Math.round((r.family==='shrub'?5:10)+r.density*(r.family==='shrub'?4:7));
 for(let j=0;j<n;j++){let t=.22+j/n*.71,base=spine[Math.floor(t*12)].clone(),angle=j*2.399+rand()*.7+tt;let length=h*(r.family==='cedar'?(1-t)*.7:.24+rand()*.20)*r.spread/Math.sqrt(trunks);let d=V(Math.cos(angle),r.family==='cedar'?.02:.35+rand()*.5,Math.sin(angle));let end=base.clone().addScaledVector(d,length);if(r.family==='willow')end.y=base.y+length*.2;let bp=curve(base,end,length*.15,7);tube(bp,h*.012*(1-t*.7),bark);
 for(let k=1;k<=(quality===0?2:5);k++){let pb=bp[Math.min(7,k+1)],ang=angle+(k%2?1:-1)*(.6+rand()*.4);let sd=V(Math.cos(ang),r.family==='willow'?-.8:.3+rand()*.5,Math.sin(ang));let sl=length*(.3+rand()*.35),tip=pb.clone().addScaledVector(sd,sl);let twig=curve(pb,tip,r.family==='willow'?sl*.15:sl*.08,5);tube(twig,h*.004,bark);
 let leaves=quality===0?4:Math.round((r.family==='cedar'?16:r.family==='shrub'?7:18)*r.density);
 for(let l=0;l<leaves;l++){let lt=(l+.2)/leaves;let u=lt*5,idx=Math.min(4,Math.floor(u));let pos=twig[idx].clone().lerp(twig[idx+1],u-idx);let az=ang+(l%2?1:-1)*(1+rand()*.5),dir=V(Math.cos(az),r.family==='willow'?-.6:(rand()-.3)*.8,Math.sin(az));let size=h*(r.family==='cedar'?.035:r.family==='willow'?.068:.068)*(.7+rand()*.6);foliage(pos,dir,size,size*(r.family==='cedar'?.10:r.family==='willow'?.14:.35));}
 }
 }
 }
 }else if(r.family==='fern'){
 for(let j=0;j<Math.round((quality===0?4:10)*r.density);j++){let angle=j*2.399,span=h*(.55+rand()*.5)*r.spread;let pts=[];for(let k=0;k<=14;k++){let t=k/14;pts.push(origin.clone().add(V(Math.cos(angle)*span*t,h*Math.sin(t*Math.PI*.72),Math.sin(angle)*span*t)));}tube(pts,.009*r.age,bark);for(let k=2;k<14;k+=(quality===0?3:1)){let t=k/14,s=span*.22*Math.sin(t*Math.PI),p=pts[k];for(let sign of [-1,1])foliage(p,V(Math.cos(angle+sign*1.1),.08,Math.sin(angle+sign*1.1)),s,s*.13);}}
 }else if(r.family==='grass'){
 for(let j=0;j<Math.round((quality===0?3:110)*r.density);j++){let angle=rand()*Math.PI*2,len=h*(.4+rand()*.6),base=origin.clone().add(V((rand()-.5)*.22,0,(rand()-.5)*.22)),dir=V(Math.cos(angle)*.3,.9,Math.sin(angle)*.3);foliage(base,dir,len,.018*r.age);}
 }else{
 for(let j=0;j<Math.round((quality===0?2:15)*r.density);j++){let a=origin.clone().add(V((rand()-.5)*.7*r.spread,0,(rand()-.5)*.7*r.spread)),end=a.clone().add(V((rand()-.5)*.25,h*(.5+rand()*.5),(rand()-.5)*.25));let pts=curve(a,end,.03,6);tube(pts,.008*r.age,new T.Color(0x618447));for(let k=2;k<5;k++)foliage(pts[k],V(Math.cos(j+k),.2,Math.sin(j+k)),h*.25,h*.065);if(!structure){let petalColor=new T.Color([0xeacccd,0xe4b75b,0x9eafd6,0xe8e0c8][Math.floor(rand()*4)]);for(let k=0;k<7;k++){let ang=k/7*Math.PI*2;leaf(end,V(Math.cos(ang),.2,Math.sin(ang)),h*.14,h*.065,petalColor,'petal',.25);}let c=end.clone().add(V(0,.012,0));for(let k=0;k<6;k++)leaf(c,V(Math.cos(k),.3,Math.sin(k)),h*.045,h*.025,new T.Color(0xd9a13e),'petal',.1);}}
 }
 return count;
}

let count=plant(recipe,V());return {buckets,leafCount:count};
};

root.MoorEcology=Object.freeze(api);
})(globalThis);
