import {T,clamp,mix,ease,phase} from './assets.mjs';
import {storyState,SHOTS} from './timeline.mjs';
const V=a=>new T.Vector3(...a),lerp=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
const POSES={soil:[0,-.285,0],pile:[-1.10,.19,3.02],packed:[-.06,.16,-.15]};
function pose(o,p,r=[0,0,0],s=1){o.position.fromArray(p);o.rotation.set(...r);o.scale.setScalar(s);o.visible=true;}
function face(w,mood,t){w.hero.userData.face?.set(mood,t);const f=w.hero.userData.foliage;if(f)f.stems.forEach((s,i)=>{s.rotation.z=Math.sin(t*2.1+i)*.045+(i-2)*.075;});}
function cam(camera,p,target,fov,config,wideStage=false){camera.position.fromArray(p);if(config.format==='portrait')camera.position.copy(V(target).lerp(V(p),wideStage?1.1:1.55));camera.fov=config.format==='portrait'&&wideStage?78:fov*(config.format==='portrait'?1.23:1);camera.near=.008;camera.far=140;camera.lookAt(...target);camera.updateProjectionMatrix();camera.updateMatrixWorld();return camera.position.distanceTo(V(target));}
// Closed-form two-bone reach: the wrist is constrained to the contact point on every frame.
export function reach(actor,index,target,rotation=[0,0,0],grip=.8){
 actor.updateMatrixWorld(true);const {arm,fore,hand}=actor.userData.arms[index],side=index===0?-1:1;
 const origin=arm.getWorldPosition(new T.Vector3()),end=V(target),delta=end.clone().sub(origin),dist=delta.length(),l1=Math.hypot(.08,.30),l2=.33,d=clamp(dist,.04,l1+l2-.001),dir=delta.normalize();
 const pole=new T.Vector3(side*.7,-.35,-.5);pole.addScaledVector(dir,-pole.dot(dir)).normalize();const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));const elbow=origin.clone().addScaledVector(dir,a).addScaledVector(pole,h);
 const parentQ=arm.parent.getWorldQuaternion(new T.Quaternion()).invert(),elocal=elbow.clone().sub(origin).applyQuaternion(parentQ).normalize();arm.quaternion.setFromUnitVectors(V([side*.08,-.30,0]).normalize(),elocal);arm.updateMatrixWorld(true);
 const foreQ=fore.parent.getWorldQuaternion(new T.Quaternion()).invert(),fpos=fore.getWorldPosition(new T.Vector3());fore.quaternion.setFromUnitVectors(V([0,-1,0]),end.clone().sub(fpos).applyQuaternion(foreQ).normalize());fore.updateMatrixWorld(true);
 hand.quaternion.copy(new T.Quaternion().setFromEuler(new T.Euler(...rotation))).premultiply(hand.parent.getWorldQuaternion(new T.Quaternion()).invert());hand.userData.setGrip(grip);
 return {requested:target,actual:hand.getWorldPosition(new T.Vector3()).toArray(),reachable:dist<=l1+l2};
}
function crouch(actor,depth){actor.userData.root.position.y=-depth;for(const {leg,shin,foot} of actor.userData.legs){const height=.83-depth,dist=height-.06,L=.39,l=.38,a=(L*L-l*l+dist*dist)/(2*dist),forward=Math.sqrt(Math.max(0,L*L-a*a));leg.position.y=height;leg.rotation.x=-Math.atan2(forward,a);shin.rotation.x=Math.atan2(forward,dist-a)-leg.rotation.x;foot.rotation.x=-(leg.rotation.x+shin.rotation.x);}}
function gripHero(w,p,rotation=[0,0,0],amount=1){
 pose(w.hero,p,rotation);w.hero.updateMatrixWorld(true);const anchor=w.hero.localToWorld(V([.018,.340,-.016]));pose(w.hand,anchor.toArray(),rotation);w.hand.rotation.z+=Math.PI;w.hand.userData.setGrip(amount);
 // Sleeve extends out of the close-up; geometry is attached to the same wrist transform.
 return anchor;
}
export function direct(w,camera,time,config){
 const s=storyState(time),{t,shot,u}=s,id=shot.id;w.hero.visible=w.kind!=='store';if(w.hand){w.hand.visible=false;if(w.hand.userData.sleeve)w.hand.userData.sleeve.visible=true;}if(w.farmer){w.farmer.visible=true;w.farmer.userData.walk(t,0);for(const a of w.farmer.userData.arms){a.arm.rotation.set(0,0,0);a.fore.rotation.set(0,0,0);a.hand.rotation.set(0,0,Math.PI);a.hand.visible=true;}}
 let cp,ct,fov=44;
 if(w.kind==='farm'){
  const lift=phase(t,5.3,8.0),p=lerp(POSES.soil,[.03,.32,.04],lift);pose(w.hero,p,[0,0,-.12*lift]);
  w.farmer.position.set(.55,0,-.42);w.farmer.rotation.y=-.2;w.farmer.visible=id===1; // Close-up gives the fingertips room in the frame.
  const approach=phase(t,4.1,5.3);if(t>=4){gripHero(w,p,[0,0,-.12*lift],phase(t,4.9,5.5));w.hand.position.y+=(1-approach)*.38;w.hand.position.x+=(1-approach)*.16;}
  w.soilBits.forEach((b,i)=>{const start=5.85+i*.025,age=t-start;b.visible=age>0&&age<.72;const a=i*2.4;b.position.set(Math.cos(a)*(.012+age*.12),Math.max(-.018,.04+age*.28-age*age*1.8),Math.sin(a)*(.01+age*.10));b.rotation.set(age*3,i,age*5);});
  cp=id===1?lerp([2.9,1.55,3.65],[1.65,1.1,2.8],ease(u)):lerp([.44,.22,.75],[.38,.68,.86],lift);ct=id===1?lerp([.2,.15,0],[.02,.02,0],ease(u)):[.03,p[1]+.235,.0];fov=id===1?46:37;
 }else if(w.kind==='factory'){
  w.beltProduce.forEach((v,i)=>{const distance=((t*.26+i*.57)%5.4)-.6,side=v.userData.sortLeft?-1:1,p=laneMotion(distance,side);v.visible=distance<4.76&&distance>-.3;pose(v,p,[-Math.PI/2,0,(i%2-.5)*.12]);v.visible=distance<4.76&&distance>-.3;});
  const d=t<29?mix(.10,2.3,clamp((t-17)/12)):mix(2.3,5.13,clamp((t-29)/4));let hp=laneMotion(d,-1),rot=[-Math.PI/2,0,0];
  if(t>=33&&t<34.6){const f=clamp((t-33)/1.6);hp=[-1.1+Math.sin(f*Math.PI)*.045,mix(.785,.19,f*f),mix(2.78,3.02,ease(f))];rot=lerp([-Math.PI/2,0,0],[-.10,0,-.17],ease(f));}
  if(t>=34.6){hp=[...POSES.pile];rot=[-.1,0,-.17];hp[1]+=t<35.2?Math.sin((t-34.6)*Math.PI/ .6)*.023:0;}
  pose(w.hero,hp,rot);if(t>=17&&t<33.1)w.beltProduce.forEach(v=>{if(v.position.distanceTo(w.hero.position)<.57)v.visible=false;});w.gate.rotation.y=t>=28&&t<31?-.6:.6*Math.sin(t*.7);
  if(id===13){const a=phase(t,52.35,54.6),lift=phase(t,54.6,57.7);hp=lerp(POSES.pile,[-.91,1.18,3.12],lift);gripHero(w,hp,[-.1,0,mix(-.17,.04,lift)],phase(t,54.05,54.7));w.hand.position.x-=.24*(1-a);w.hand.position.y+=.40*(1-a);}
  if(id===5){cp=lerp([3.4,3.65,5.15],[1.8,3.05,4.8],ease(u));ct=[0,.70,.58];fov=49;}
  else if(id===6){cp=[hp[0]+.15,hp[1]+.32,hp[2]+.36];ct=[hp[0],hp[1]+.025,hp[2]-.14];fov=40;}
  else if(id===7){cp=lerp([.08,2.60,4.70],[-.20,2.0,4.65],ease(u));ct=[-.1,.78,1.02];fov=45;}
  else if(id===8){cp=lerp([-.45,1.30,3.80],[-.64,.83,3.90],ease(u));ct=[-1.08,mix(.70,.43,phase(t,32.8,35)),2.94];fov=42;}
  else if(id===11){cp=lerp([-.75,.77,3.95],[-.92,.63,3.78],ease(u));ct=[-1.075,.43,3.0];fov=37;}
  else if(id===12){cp=[-.93,.66,3.90];ct=[-1.09,.55,3.0];fov=42;}
  else{cp=lerp([-.67,.75,3.94],[-.46,1.59,4.2],phase(t,54.6,57.8));ct=[hp[0],hp[1]+.23,hp[2]];fov=42;}
 }else if(w.kind==='store'){
  w.hero.visible=false;w.happy.forEach((v,i)=>{v.rotation.y=0;v.userData.face?.set('hope',t+i);});
  const aisle=w.aisle,x=-(aisle/2+.47);
  if(id===9){cp=lerp([.15,1.45,-5.8],[.13,1.37,-2.65],ease(u));ct=[0,1.3,1.3];fov=52;}
  else{cp=lerp([x+.12,1.16,1.78],[x+.04,1.12,1.59],ease(u));ct=[x,.988,.84];fov=40;}
 }else if(w.kind==='yard'||w.kind==='pack'){
  w.truck.position.set(-.55,0,0);w.truck.rotation.set(0,Math.PI,0);w.farmer.visible=false;
  if(id===3||id===4){const z=id===3?mix(-4.5,0,ease(u)):0;w.truck.position.z=z;w.truck.userData.wheels.forEach(v=>v.rotation.x=z/.34);w.truck.updateMatrixWorld(true);const p=w.cargo.localToWorld(V([-.05,.13,-.08]));pose(w.hero,p.toArray(),[-.22,Math.PI,-.15]);
   if(id===3){cp=lerp([1.95,2.3,z+3.35],[1.1,1.65,z+2.6],ease(u));ct=[-.45,1.05,z+.8];fov=43;}
   else{cp=lerp([4.3,2.7,-4.6],[2.1,2.2,-2.4],ease(u));ct=[-.65,1.3,2.25];fov=48;}
  }else if(id===14){const actor=w.farmer;actor.visible=true;pose(actor,[mix(.1,.9,ease(u)),0,mix(3.1,1.55,ease(u))],[0,-.42,0]);actor.userData.walk(t,.55);const hp=[actor.position.x-.27,1.02,actor.position.z-.38];gripHero(w,hp,[.08,0,-.2],.9);actor.userData.arms[0].hand.visible=false;if(w.hand.userData.sleeve)w.hand.userData.sleeve.visible=false;reach(actor,0,w.hand.position.toArray(),[0,0,Math.PI]);cp=lerp([2.5,1.8,-.3],[2.15,1.65,-.45],ease(u));ct=[actor.position.x,1.15,actor.position.z];fov=43;
  }else{
   w.truck.updateMatrixWorld(true);const packed=w.cargo.localToWorld(V(POSES.packed)),a=phase(t,61.4,64),hp=lerp([packed.x+.43,packed.y+.65,packed.z+.06],packed.toArray(),a);gripHero(w,hp,[-.1,0,-.12],1-phase(t,64,64.65));if(t>64){w.hand.position.add(V([phase(t,64.3,65.7)*.4,phase(t,64.3,65.7)*.45,0]));}cp=lerp([.60,2.05,2.65],[.27,1.67,2.28],ease(u));ct=[mix(hp[0],packed.x,.5),mix(hp[1],packed.y,.5)+.22,packed.z];fov=43;
  }
 }else if(w.kind==='road'){
  const z=mix(-15,18,u),x=w.roadX(z)-.85,y=w.roadY(z),yaw=Math.atan2(w.roadX(z+.1)-w.roadX(z-.1),.2);pose(w.truck,[x,y,z],[0,yaw,0]);w.truck.userData.body.rotation.z=Math.sin(t*2.2)*.007;w.truck.userData.wheels.forEach(v=>v.rotation.x=z/.34);
  pose(w.hero,POSES.packed,[-.1,Math.PI,-.12]);const offset=lerp([2.5,4.2,-6.8],[2.0,3.6,-5.6],ease(u));cp=[x+offset[0],y+offset[1],z+offset[2]];ct=[x,y+1.03,z-.35];fov=43;w.key.position.set(x-4,7,z+3);w.key.target.position.set(x,0,z);
 }else if(w.kind==='house'){
  const put=phase(t,74.4,76.4),enter=phase(t,79,80.9),carry=t<74.4?phase(t,72,74.4):1;pose(w.cargo,[0,mix(.88,.114,put)+enter*.6,mix(-1.4,.16,carry)+enter*.7]);
  pose(w.hero,POSES.packed,[-.1,Math.PI,-.12]);const actor=w.farmer;pose(actor,[0,.10,w.cargo.position.z-.35],[0,Math.PI,0]);actor.userData.walk(t,t<74.4?.55:0);crouch(actor,put*.63);actor.visible=t<77.7;if(t>76.4){actor.position.x+=phase(t,76.4,78)*1.5;actor.position.z-=phase(t,76.4,78);actor.userData.walk(t,.5);}
  w.hands.forEach((h,i)=>{const side=i?1:-1;pose(h,[side*.35,w.cargo.position.y+.22,w.cargo.position.z-.01],[Math.PI/2,0,-side*Math.PI/2]);h.userData.setGrip(.65);h.visible=t<76.4||t>78.8;if(h.userData.sleeve)h.userData.sleeve.visible=t>78.8;});
  if(t<76.4){actor.userData.arms.forEach(a=>a.hand.visible=false);reach(actor,0,w.hands[1].position.toArray());reach(actor,1,w.hands[0].position.toArray());}
  w.door.rotation.y=-phase(t,78.05,79.3)*1.17;
  if(id===17){cp=lerp([2.35,1.6,-3.65],[1.28,1.17,-2.33],ease(u));ct=[0,.70,.35];fov=43;}
  else{cp=lerp([.68,.83,-1.4],[.21,.95,-1.1],ease(u));ct=[0,.53+enter*.42,.34];fov=42;}
 }else{
  pose(w.hero,[-.145,.927,.075],[-Math.PI/2,0,-.85],.94);w.steam.forEach((v,i)=>{const age=((t*.35+i/7)%1);pose(v,[Math.sin(i*2.4+t*.5)*.14,1.02+age*.38,Math.cos(i*2.4)*.10],[0,0,0]);const size=.45+age*.55;v.scale.set(.03*size,.05*size,.025*size);v.material.opacity=.09;});
  cp=id===19?lerp([.26,1.36,-.66],[.08,1.21,-.56],ease(u)):lerp([.08,1.21,-.56],[.04,1.15,-.47],ease(u));ct=[0,.965,-.055];fov=id===19?44:46;
 }
 face(w,s.mood,t);w.focus=cam(camera,cp,ct,fov,config,[5,7].includes(id));w.scene.updateMatrixWorld(true);return {...s,focus:w.focus,cameraPosition:camera.position.toArray(),cameraTarget:ct};
}
export function laneMotion(d,side){
 // Piecewise physical centerline follows the built belts, including the straight run-out.
 if(d<=2.44)return [side*.16,.785,-2+d];
 if(d<=3.90){const u=(d-2.44)/1.46;return [mix(side*.16,side*1.1,u),.785,mix(.44,1.55,u)];}
 return [side*1.1,.785,1.55+(d-3.90)];
}
