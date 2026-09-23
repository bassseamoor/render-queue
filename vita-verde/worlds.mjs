import {T,M,mat,group,mesh,ball,box,rod,tube,rounded,carrot,vegetable,crate,assortment,hand,farmer,pickup,tree,batchStatic,rng,hash,mix,clamp} from './assets.mjs';
const PALETTES={farm:['#aac6c6','#efd9a4',3.2],yard:['#bdd1ce','#ffe4b5',3.0],factory:['#bbc6bf','#e7eadf',2.5],store:['#dfe4d4','#ffe3b2',2.7],pack:['#b8cbbb','#ffe0a8',3.2],road:['#b8cbbd','#ffda9b',3.4],house:['#bbcaba','#ffddb0',3.0],dinner:['#546559','#ffce95',2.3]};
function base(kind){
 const scene=new T.Scene();scene.name=kind;const [sky,sun,power]=PALETTES[kind];scene.background=new T.Color(sky);scene.fog=new T.Fog(sky,kind==='dinner'?7:15,kind==='dinner'?18:90);
 const key=new T.DirectionalLight(sun,power);key.position.set(-4,7,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:30});key.shadow.bias=-.00006;key.shadow.normalBias=.004;scene.add(key,key.target);
 const fill=new T.HemisphereLight(sky,kind==='dinner'?'#66503b':'#594d38',kind==='factory'?1.6:1.4);scene.add(fill);
 const root=group(scene,'set'),bg=group(root,'static-set');const hero=carrot({hero:true});scene.add(hero);
 return {kind,scene,root,bg,hero,key,fill,actors:[],disposables:[],focus:.7};
}
function terrain(parent,seed=1,size=70,flat=8){
 const geo=new T.PlaneGeometry(size,size,52,52);geo.rotateX(-Math.PI/2);const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.sqrt(x*x+z*z);p.setY(i,Math.max(0,d-flat)*.055*(1+Math.sin(x*.25+seed)*.4+Math.cos(z*.29)*.5));}geo.computeVertexNormals();return mesh(parent,geo,M.leaf);
}
function hills(parent,seed){const r=rng(seed);for(let i=0;i<14;i++){const a=i/14*Math.PI*2;ball(parent,mat(i%2?'#7c997e':'#91a994'),[Math.cos(a)*32,-3,Math.sin(a)*32],[8+r()*8,4+r()*7,9+r()*5]);}}
function floor(parent,material=M.ivory,size=16,y=-.06){return box(parent,material,[0,y,0],[size,.10,size]);}
function bolt(g,p){return ball(g,M.darkSteel,p,[.009,.004,.009]);}
function plankBench(g,x,y,z,w=.85,d=.6){
 for(let i=0;i<5;i++)box(g,M.wood,[x,y,z+(i-2)*d/5],[w,.04,d/5-.008]);
 for(const sx of [-1,1])for(const sz of [-1,1])box(g,M.darkSteel,[x+sx*(w/2-.05),y*.5,z+sz*(d/2-.05)],[.038,y,.038]);
}
function planter(g,x,z){const c=crate(g,{width:.42,depth:.4,height:.3});c.position.set(x,0,z);for(let j=0;j<8;j++){const v=carrot({seed:j,detail:false});v.position.set(x+(j%3-1)*.1,-.12,z+(Math.floor(j/3)-1)*.10);v.scale.set(1,1.2,1);g.add(v);}}
function lightFixture(g,x,z){box(g,M.darkSteel,[x,3.1,z],[.62,.065,.18]);box(g,M.light,[x,3.061,z],[.58,.009,.14]);rod(g,[x,3.15,z],[x,4.1,z],.012,M.darkSteel);}
function belt(g,a,b,width=.64,height=.75){
 const av=new T.Vector3(...a),bv=new T.Vector3(...b),length=av.distanceTo(bv),center=av.clone().add(bv).multiplyScalar(.5),angle=Math.atan2(b[0]-a[0],b[2]-a[2]);const q=group(g,'conveyor');q.position.set(center.x,height,center.z);q.rotation.y=angle;
 rounded(q,M.darkSteel,[0,-.10,0],[width+.10,.21,length+.09],.025);box(q,M.rubber,[0,.005,0],[width,.018,length]);
 for(const side of [-1,1]){rod(q,[side*(width/2+.025),.04,-length/2],[side*(width/2+.025),.04,length/2],.018,M.steel);for(const z of [-length*.34,length*.34]){rod(q,[side*width*.42,-.13,z],[side*width*.46,-height+.02,z],.026,M.darkSteel);bolt(q,[side*width*.43,-.04,z]);}}
 const rollerGeo=new T.CylinderGeometry(.042,.042,width,16);rollerGeo.rotateZ(Math.PI/2);for(let z=-length/2;z<=length/2;z+=.145)mesh(q,rollerGeo,M.steel,[0,-.043,z]);
 for(let z=-length/2;z<length/2;z+=.095)box(q,M.darkSteel,[0,.016,z],[width-.025,.002,.002]);return q;
}
function boxPile(w){
 const boxObj=crate(w.bg,{width:.75,depth:.65,height:.40});boxObj.position.set(-1.1,.025,3.0);w.collection=boxObj;
 const r=rng('carrot-only-pile');for(let i=0;i<22;i++){const v=carrot({seed:10+i,detail:false,imperfect:true});v.position.set(-1.1+(r()-.5)*.56,.075+Math.floor(i/8)*.055,3+(r()-.5)*.45);v.rotation.set(-Math.PI/2+(r()-.5)*.3,r()*6.28,(r()-.5)*.2);w.bg.add(v);}
}
function factoryShell(w){
 const g=w.bg;floor(g,mat('#999e90',.89),17);box(g,M.ivory,[0,2.15,-4.6],[15,4.4,.14]);for(let x=-5;x<6;x+=1.8){box(g,M.darkSteel,[x,2,-4.47],[.09,4,.11]);box(g,M.glass,[x+.72,2.8,-4.45],[1.28,1.2,.03]);}box(g,M.ivory,[0,2.15,5.8],[15,4.4,.14]);box(g,M.ivory,[-5.6,2.15,1],[.14,4.4,11]);
 for(let x=-5;x<6;x+=1.8){box(g,M.darkSteel,[x,2,5.64],[.09,4,.11]);box(g,M.glass,[x+.72,2.8,5.69],[1.28,1.2,.014]);}
 for(let z=-3;z<6;z+=2){rod(g,[-5.5,4,z],[5.5,4,z],.04,M.darkSteel);for(const x of [-2.8,0,2.8])lightFixture(g,x,z);}
 for(let i=0;i<7;i++){const c=crate(g,{cardboard:false,width:.62,depth:.55,height:.38});c.position.set(3+(i%2)*.65,.03+Math.floor(i/4)*.4,3+Math.floor(i/2)%2*.65);}
 // Far-right loading opening is bounded by actual geometry and a warm practical.
 box(g,M.darkSteel,[4.7,2.0,5.55],[1.1,4,.04]);box(g,M.light,[4.7,1.7,5.51],[.90,3.2,.03]);
}
function buildFarm(config){
 const w=base('farm'),g=w.bg,r=rng(config.seed+':farm');terrain(g,hash(config.seed)%10);hills(g,config.seed);floor(g,M.soil,13,-.07);
 for(let row=-4;row<=4;row++){
  rounded(g,M.earth,[row*.54,-.025,0],[.38,.10,9],.035);
  for(let j=-7;j<=7;j++){if(row===0&&j===0)continue;const v=carrot({seed:row*80+j+600,detail:false,imperfect:j%4===0});v.position.set(row*.54+(r()-.5)*.045,-.285,j*.5+(r()-.5)*.06);v.rotation.y=r()*6.28;g.add(v);}
 }
 for(let i=0;i<24;i++)tree(g,(i%2?1:-1)*(6+r()*10),-14+i*1.3,1.7+r()*2.1,i);
 const c=crate(g,{cardboard:false});c.position.set(.66,0,.25);for(let i=0;i<6;i++){const v=carrot({seed:i+2,detail:false});v.position.set(.47+(i%3)*.12,.04,.10+Math.floor(i/3)*.16);v.rotation.x=-Math.PI/2;g.add(v);}
 const body=farmer(w.root);body.position.set(.55,0,-.42);body.rotation.y=-.2;w.farmer=body;
 const h=hand(w.scene,1,true);w.hand=h;w.hero.position.set(0,-.285,0);
 w.soilBits=[];for(let i=0;i<14;i++){const b=ball(w.scene,M.soil,[0,-1,0],[.005+r()*.004,.004,.005]);w.soilBits.push(b);}
 batchStatic(g);return w;
}
function buildFactory(config){
 const w=base('factory'),g=w.bg;factoryShell(w);const decor=rng(config.seed+':factory');for(let i=0;i<5;i++){const c=crate(g,{cardboard:false,width:.50+decor()*.10,depth:.48,height:.31});c.position.set(-3.4+(decor()-.5)*.16,.01+Math.floor(i/3)*.32,-1.8+(i%3)*.62);}
 belt(g,[0,0,-2.7],[0,0,.48],.72);belt(g,[-.16,0,.44],[-1.1,0,1.55],.60);belt(g,[-1.1,0,1.55],[-1.1,0,2.70],.60);belt(g,[.16,0,.44],[1.1,0,1.55],.60);belt(g,[1.1,0,1.55],[1.1,0,3.65],.60);
 const arch=group(g,'optical-grader');rod(arch,[-.45,.77,.1],[-.45,1.23,.1],.026,M.steel);rod(arch,[.45,.77,.1],[.45,1.23,.1],.026,M.steel);rod(arch,[-.45,1.23,.1],[.45,1.23,.1],.026,M.steel);box(arch,M.darkSteel,[0,1.20,.1],[.16,.06,.12]);box(arch,mat('#8fc8bc',.3,0,{emissive:'#88bcb5',emissiveIntensity:.6}),[0,1.16,.1],[.10,.008,.07]);
 w.gate=group(w.scene,'diverter');w.gate.position.set(0,.82,.40);rounded(w.gate,M.steel,[.21,0,0],[.42,.05,.018],.006);
 boxPile(w);w.beltProduce=[];
 for(let i=0;i<23;i++){const bent=i%3===0,v=carrot({seed:i+130,imperfect:bent,detail:false});batchStatic(v);w.scene.add(v);v.userData.sortLeft=bent;w.beltProduce.push(v);}
 // Clearly different crate destinations with physically visible arrows.
 for(const side of [-1,1]){box(g,M.green,[side*1.1,1.58,1.7],[.58,.27,.022]);const shape=new T.Shape();shape.moveTo(-.12,-.055);shape.lineTo(.015,-.055);shape.lineTo(.015,-.10);shape.lineTo(.14,0);shape.lineTo(.015,.1);shape.lineTo(.015,.055);shape.lineTo(-.12,.055);shape.closePath();const arrow=mesh(g,new T.ShapeGeometry(shape),M.ivory,[side*1.1,1.58,1.716]);arrow.rotation.y=0;arrow.scale.x=side;}
 const h=hand(w.scene,1,true);w.hand=h;batchStatic(g);return w;
}
function buildYard(config,packing=false){
 const w=base(packing?'pack':'yard'),g=w.bg;floor(g,mat('#a6a38e',.9),28);hills(g,config.seed);const r=rng(config.seed+':yard');
 box(g,M.ivory,[0,2.1,4],[12,4.2,.14]);for(let x=-6;x<6;x+=.23)box(g,mat('#c4c8b9',.9),[x,2.1,3.92],[.025,4.1,.025]);
 box(g,M.darkSteel,[-1.3,1.7,3.8],[3.5,3.4,.06]);box(g,M.light,[-1.3,1.5,3.77],[3.1,2.9,.02]);for(const x of [-3.25,.65])rod(g,[x,0,3.2],[x,.82,3.2],.067,M.gold);
 box(g,M.green,[2.6,2.8,3.79],[2.1,.65,.04]);for(let i=0;i<3;i++){const c=crate(g,{cardboard:false});c.position.set(2.5+i*.65,.03,3.15);}
 for(let i=0;i<12;i++)tree(g,-8+r()*20,7+r()*7,2+r()*2,i);const truck=pickup(w.scene);w.truck=truck;truck.position.set(-.55,0,.0);truck.rotation.y=Math.PI;
 const cargo=crate(truck.userData.bed,{delivery:packing,cardboard:packing,width:.68,depth:.52,height:.32});w.cargo=cargo;
 if(packing)assortment(cargo,config.seed+':assortment');else{for(let i=0;i<10;i++){const v=carrot({seed:i+10,detail:false,imperfect:i%3===0});v.position.set((i%4-1.5)*.13,.10,Math.floor(i/4)*.13-.14);v.rotation.x=-.4;cargo.add(v);}}
 const actor=farmer(w.scene);w.farmer=actor;actor.position.set(.9,0,1.4);actor.rotation.y=-.6;w.hand=hand(w.scene,1,true);batchStatic(g);return w;
}
function buildStore(config){
 const w=base('store'),g=w.bg,r=rng(config.seed+':store'),variant=config.store;
 const aisle=(variant==='grocer'?2.0:variant==='market'?2.7:3.3)+(r()-.5)*.32,wid=variant==='hall'?12:9;w.aisle=aisle;
 floor(g,variant==='hall'?mat('#a5ac9c',.62):mat('#d7d8c7',.38),18);
 // Separate entrance shot looks at this glass facade, with an opaque-frame edit to the interior.
 box(g,M.ivory,[0,2,7],[wid,4,.12]);box(g,M.green,[0,3.15,-2.4],[wid,.65,.10]);
 for(const x of [-wid/2,wid/2]){box(g,M.ivory,[x,2,2],[.15,4,10]);for(let j=0;j<4;j++)box(g,M.green,[x*.99,2.7,j*2-.5],[.06,.9,1.4]);}
 for(let z=-1.8;z<8;z+=1.6){box(g,variant==='hall'?M.wood:M.ivory,[0,3.8,z],[wid,.14,.13]);for(const x of [-2,0,2])lightFixture(g,x,z);}
 for(const x of [-1.2,1.2])box(g,M.glass,[x,1.45,-2.4],[2.25,2.8,.025]);for(const x of [-2.4,0,2.4])box(g,M.darkSteel,[x,1.45,-2.40],[.04,2.9,.06]);
 w.happy=[];
 const types=['carrot','tomato','pepper','cucumber','eggplant','broccoli'];
 for(let row=0;row<3;row++)for(const side of [-1,1]){
  const x=side*(aisle/2+.47),z=.4+row*1.8+(row?(r()-.5)*.18:0)+(variant==='market'&&side>0?.4:0);plankBench(g,x,.65,z,1.15,1.12);
  for(let j=0;j<2;j++){const c=crate(g,{cardboard:false,width:1.02,depth:.49,height:.12});c.position.set(x,.67+j*.10,z+(j-.5)*.5);c.rotation.x=.10;
   const type=types[(row*2+(side>0?1:0))%6];for(let k=0;k<10;k++){const isHappy=side<0&&row===0&&j===0&&k<3,v=type==='carrot'?carrot({seed:k+row*10,detail:false,imperfect:false,smile:isHappy}):vegetable(type,k+row*10,isHappy);v.position.set(x+(k%5-2)*.18,.74+j*.1,z+(j-.5)*.48+Math.floor(k/5)*.17-.09);v.rotation.y=(r()-.5)*.4;if(type==='carrot')v.rotation.x=-.18;if(isHappy){v.position.set(x+(k-1)*.15,.77,.84);v.rotation.x=0;w.scene.add(v);w.happy.push(v);}else g.add(v);}
  }
  for(const sx of [-1,1])box(g,M.green,[x+sx*.38,.95,z-.6],[.23,.13,.012]);
 }
 for(let i=0;i<4;i++){const person=farmer(g);person.position.set((i%2?1:-1)*.4,0,4.6+Math.floor(i/2)*1.25);person.scale.setScalar(.9);person.rotation.y=i*.7;}
 w.hero.visible=false;batchStatic(g);return w;
}
function buildRoad(config){
 const w=base('road'),g=w.bg,r=rng(config.seed+':route'),offset=(hash(config.seed)%100)*.03;
 w.roadX=z=>Math.sin(z*.08+offset)*1.8;w.roadY=z=>.15+Math.sin(z*.05)*.08;
 const ground=new T.PlaneGeometry(90,110,50,50);ground.rotateX(-Math.PI/2);const p=ground.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=Math.abs(x-w.roadX(z));p.setY(i,w.roadY(z)-.04+Math.max(0,d-3)*(.11+.075*Math.sin(z*.2+x*.3)));}ground.computeVertexNormals();mesh(g,ground,mat('#82935c',.93));hills(g,config.seed);
 const pos=[],idx=[];for(let j=0;j<=120;j++){const z=j-60,x=w.roadX(z),y=w.roadY(z);pos.push(x-2.2,y,z,x+2.2,y,z);if(j<120){const a=j*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}}
 const roadGeo=new T.BufferGeometry();roadGeo.setAttribute('position',new T.Float32BufferAttribute(pos,3));roadGeo.setIndex(idx);roadGeo.computeVertexNormals();mesh(g,roadGeo,M.road);
 for(let z=-55;z<55;z+=4)box(g,M.ivory,[w.roadX(z),w.roadY(z)+.005,z],[.06,.003,1.3]);
 for(let i=0;i<60;i++){const z=-50+r()*100,x=w.roadX(z)+(i%2?1:-1)*(6.8+r()*10);tree(g,x,z,2+r()*2,i);}
 for(let i=0;i<10;i++){const x=(i%2?1:-1)*(8+r()*9),z=17+Math.floor(i/2)*4;box(g,i%2?M.ivory:M.lightWood,[x,1.1,z],[2.6,2.2,2.3]);const roof=mesh(g,new T.ConeGeometry(2.0,.9,4),M.dark,[x,2.55,z]);roof.rotation.y=Math.PI/4;}
 w.truck=pickup(w.scene);w.cargo=crate(w.truck.userData.bed,{delivery:true,width:.68,depth:.52,height:.32});assortment(w.cargo,config.seed+':assortment');w.hero.removeFromParent();w.cargo.add(w.hero);w.hero.position.set(-.06,.16,-.15);w.hero.rotation.set(-.1,0,-.12);
 for(const x of [-.31,.31])box(w.truck.userData.bed,M.dark,[x,.18,0],[.017,.38,.57]);
 batchStatic(g);return w;
}
function buildHouse(config){
 const w=base('house'),g=w.bg,r=rng(config.seed+':house'),kind=config.house,wall=kind==='brick'?mat('#9e7459',.9):kind==='timber'?M.lightWood:M.ivory;
 floor(g,mat('#9b9b80',.94),20);box(g,wall,[0,1.8,1.3],[5,3.6,.20]);
 if(kind==='brick')for(let y=.1;y<3.5;y+=.16)for(let x=-2.4;x<2.5;x+=.3){box(g,M.paperEdge,[x+(Math.round(y*6)%2)*.15,y,1.18],[.29,.006,.006]);}
 if(kind==='timber')for(let y=.1;y<3.5;y+=.14)box(g,M.wood,[0,y,1.18],[5,.008,.012]);
 // Door opening sits slightly in front of the shell; the open pose reveals a warm interior panel.
 box(g,M.dark,[0,1.25,1.08],[1.15,2.5,.08]);box(g,M.light,[0,1.20,1.032],[.91,2.37,.03]);
 for(const x of [-.59,.59])rounded(g,M.ivory,[x,1.25,1.04],[.12,2.60,.13],.016);rounded(g,M.ivory,[0,2.53,1.04],[1.29,.13,.14],.02);
 const door=group(w.scene,'door-hinge');door.position.set(-.48,0,1.0);rounded(door,M.green,[.48,1.21,0],[.96,2.42,.08],.015);
 for(const x of [.23,.73])for(const y of [.57,1.64]){rounded(door,M.dark,[x,y,-.044],[.35,.73,.013],.01);rounded(door,M.green,[x,y,-.053],[.31,.69,.011],.012);}ball(door,M.gold,[.84,1.04,-.072],[.028,.028,.025]);w.door=door;
 for(const x of [-1.7,1.7]){box(g,M.dark,[x,1.7,1.09],[.83,1.35,.07]);box(g,M.glass,[x,1.7,1.042],[.72,1.25,.022]);box(g,M.ivory,[x,1.7,1.01],[.04,1.24,.035]);box(g,M.ivory,[x,1.7,1.01],[.72,.035,.035]);}
 rounded(g,mat('#b3b09a',.86),[0,.04,.34],[1.66,.10,1.28],.025);box(g,M.wood,[0,.099,.1],[1.12,.014,.63]);
 for(const x of [-1.3,1.3])planter(g,x,.7);
 w.cargo=crate(w.scene,{delivery:true,width:.68,depth:.52,height:.32});assortment(w.cargo,config.seed+':assortment');w.hero.removeFromParent();w.cargo.add(w.hero);w.hero.position.set(-.06,.16,-.15);w.hero.rotation.z=-.12;
 w.farmer=farmer(w.scene);w.farmer.position.set(.75,0,-.35);w.farmer.rotation.y=.5;w.hands=[hand(w.scene,-1,true),hand(w.scene,1,true)];
 batchStatic(g);return w;
}
function buildDinner(config){
 const w=base('dinner'),g=w.bg,r=rng(config.seed+':dinner');w.scene.background.set('#394639');w.scene.fog=new T.Fog('#394639',4,12);
 floor(g,M.wood,10);box(g,M.green,[0,1.8,3.7],[9,3.6,.15]);for(let x=-3;x<=3;x+=1)box(g,M.gold,[x,1.8,3.59],[.017,3.2,.014]);
 rounded(g,M.wood,[0,.79,0],[2.7,.10,1.75],.04);for(const x of [-1.1,1.1])for(const z of [-.64,.64])box(g,M.dark,[x,.37,z],[.10,.74,.10]);
 const plate=group(g,'sharing-platter');plate.position.set(0,.86,0);const dish=mesh(plate,new T.CylinderGeometry(.36,.30,.027,64),M.ceramic,[0,0,0]);dish.scale.z=.8;
 const tor=new T.TorusGeometry(.331,.013,8,64);tor.rotateX(Math.PI/2);const rim=mesh(plate,tor,M.plateDark,[0,.019,0]);rim.scale.z=.8;
 // Roasted pieces are plated low around the whole, recognizable hero carrot.
 for(let i=0;i<24;i++){const a=i*2.399,rad=.18+r()*.10,x=Math.cos(a)*rad,z=Math.sin(a)*rad*.75;if(z<.08&&Math.abs(x)<.17)continue;
  if(i%4===0){const skin=ball(g,M.eggplant,[x,.902,z],[.036,.022,.029]);ball(g,mat('#bd9764',.65),[x,.919,z],[.028,.007,.022]);}
  else if(i%4===1){ball(g,M.tomato,[x,.897,z],[.026,.020,.023]);ball(g,mat('#6f3823',.65),[x+.009,.913,z],[.008,.002,.009]);}
  else if(i%4===2){const piece=rounded(g,mat('#c99443',.54),[x,.90,z],[.044,.034,.042],.010);piece.rotation.y=a;}
  else{for(let k=0;k<4;k++)ball(g,M.broccoli,[x+(r()-.5)*.026,.905+(r()*.012),z+(r()-.5)*.026],[.017,.016,.017]);}
 }
 for(let i=0;i<16;i++){const x=(r()-.5)*.52,z=(r()-.5)*.38;rod(g,[x,.889,z],[x+.02,.89,z+.014],.0014,M.leafLight,5);}

 w.hero.removeFromParent();w.hero=carrot({hero:true,cooked:true});w.scene.add(w.hero);w.hero.position.set(-.11,.972,.025);w.hero.rotation.set(-Math.PI/2,0,-.65);w.hero.scale.setScalar(.94);
 for(const x of [-.86,.86])for(const z of [-.5,.5]){
  mesh(g,new T.CylinderGeometry(.19,.18,.012,36),M.ceramic,[x,.86,z]);rod(g,[x-.23,.856,z-.14],[x-.23,.856,z+.15],.004,M.steel);rod(g,[x+.23,.856,z-.14],[x+.23,.856,z+.15],.004,M.steel);
  mesh(g,new T.CylinderGeometry(.047,.04,.13,24,1,true),M.glass,[x+.27,.92,z+.23]);
 }
 for(const x of [-.68,.65]){const candle=mesh(g,new T.CylinderGeometry(.03,.03,.14,16),M.ivory,[x,.94,.15]);ball(g,M.light,[x,1.025,.15],[.008,.024,.008]);const light=new T.PointLight('#ffc57b',.65,2,2);light.position.set(x,1.08,.15);w.scene.add(light);}
 for(let i=0;i<3;i++){const p=farmer(g);p.position.set((i-1)*.83,-.13,1.11);p.rotation.y=0;p.scale.setScalar(i===1?.69:.95);const shirt=mat(['#af865f','#c4b790','#56766f'][i],1);p.userData.root.traverse(o=>{if(o.isMesh){if(o.material===M.cloth)o.material=shirt;if(o.position.y>1.70)o.visible=false;}});}
 w.steam=[];const steamMat=mat('#e6dfc9',1,0,{transparent:true,opacity:.13,depthWrite:false});for(let i=0;i<7;i++){const s=ball(w.scene,steamMat,[0,0,0],[.03,.05,.025]);s.castShadow=false;w.steam.push(s);}
 w.key.position.set(-2,3,1.4);w.fill.intensity=.9;batchStatic(g);return w;
}
export function buildWorld(kind,config){
 const w=kind==='farm'?buildFarm(config):kind==='factory'?buildFactory(config):kind==='store'?buildStore(config):kind==='yard'?buildYard(config):kind==='pack'?buildYard(config,true):kind==='road'?buildRoad(config):kind==='house'?buildHouse(config):buildDinner(config);
 w.scene.updateMatrixWorld(true);return w;
}
export function disposeWorld(w){
 // Shared family geometry/materials stay owned by the asset library. Dispose only baked set geometry.
 w.bg.traverse(o=>{if(o.isMesh&&o.name.startsWith('batch-'))o.geometry.dispose();});
}
