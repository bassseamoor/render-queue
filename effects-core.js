/* MOOR Effects Core v1. Seeded, time-addressable 3D art; no accumulated simulation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorEffects=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const MAX_ELEMENTS=1800,MAX_LAYERS=8,MAX_PIXELS=900000;
const enums={renderer:['point','spark','shard','ribbon','beam','ring'],shape:['point','sphere','ring','box','cone','line'],motion:['radial','orbit','vortex','wave','rise','ballistic'],blend:['add','alpha'],emission:['continuous','burst']};
const defaults={renderer:'spark',shape:'sphere',motion:'radial',blend:'add',emission:'continuous',count:180,radius:1,speed:1,life:2.8,size:0.035,hue:185,hueSpread:28,opacity:0.9,glow:0.35,gravity:0,twist:1,spread:0.7,delay:0,position:[0,0,0],enabled:true,sprite:null};
const bounds={count:[1,1200],radius:[0,4],speed:[-4,4],life:[0.2,12],size:[0.002,0.4],hue:[0,360],hueSpread:[0,180],opacity:[0,1],glow:[0,1],gravity:[-4,4],twist:[-5,5],spread:[0,3],delay:[0,12]};
function hash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function number(v,lo,hi,label){if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error(label+' must be '+lo+'…'+hi);return v;}
function normalize(input){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.schema!=='moor.effect-recipe'||input.version!==1)throw Error('Expected moor.effect-recipe version 1');
 if(JSON.stringify(input).length>384*1024)throw Error('Recipe exceeds 384 KB');
 if(!Array.isArray(input.layers)||!input.layers.length||input.layers.length>MAX_LAYERS)throw Error('Use 1…8 layers');
 const out={schema:'moor.effect-recipe',version:1,name:String(input.name||'Untitled effect').slice(0,60),duration:number(input.duration??5,0.5,12,'Duration'),variation:number(input.variation??0.3,0,1,'Seed variation'),camera:{yaw:0.45,pitch:-0.28,zoom:1,projection:'orthographic'},layers:[]};
 const cam=input.camera||{};for(const k of ['yaw','pitch','zoom'])out.camera[k]=number(cam[k]??out.camera[k],k==='zoom'?0.3:-6.3,k==='zoom'?3:6.3,'Camera '+k);if(cam.projection&&!['orthographic','perspective'].includes(cam.projection))throw Error('Unknown camera projection');out.camera.projection=cam.projection||'orthographic';
 let total=0;const ids=new Set();
 input.layers.forEach((raw,i)=>{
  if(!raw||typeof raw!=='object')throw Error('Invalid layer');
  const l={...defaults,id:String(raw.id||'layer-'+(i+1)).slice(0,48),name:String(raw.name||'Emitter '+(i+1)).slice(0,48)};
  if(ids.has(l.id))throw Error('Layer IDs must be unique');ids.add(l.id);
  for(const [key,choices] of Object.entries(enums)){if(raw[key]!==undefined&&!choices.includes(raw[key]))throw Error('Unknown '+key);l[key]=raw[key]??defaults[key];}
  for(const [key,[lo,hi]] of Object.entries(bounds)){l[key]=number(raw[key]??defaults[key],lo,hi,l.name+' '+key);if(key==='count')l.count=Math.floor(l.count);}
  if(raw.position!==undefined&&(!Array.isArray(raw.position)||raw.position.length!==3))throw Error('Position needs [x,y,z]');l.position=(raw.position||[0,0,0]).map(v=>number(v,-5,5,'Position'));
  l.enabled=raw.enabled!==false;
  if(raw.sprite){if(typeof raw.sprite!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raw.sprite)||raw.sprite.length>350000)throw Error('Use an embedded PNG under 256 KB');l.sprite=raw.sprite;}
  if(['beam','ribbon','ring'].includes(l.renderer)&&l.count>48)throw Error('Path renderers allow at most 48 instances per layer');
  total+=l.count;out.layers.push(l);
 });
 if(total>MAX_ELEMENTS)throw Error('Combined layer capacity exceeds '+MAX_ELEMENTS);return out;
}
function compile(input,seed){
 const recipe=normalize(input),s=hash(seed),r=rng(s),variation=recipe.variation;
 const hueShift=(r()-.5)*100*variation,scale=1+(r()-.5)*.65*variation;
 const layers=recipe.layers.map(l=>{const random=rng(hash(s+':'+l.id));return {...l,hue:(l.hue+hueShift+360)%360,radius:l.radius*scale,speed:l.speed*(1+(r()-.5)*.6*variation),items:Array.from({length:l.count},(_,i)=>{const a=random()*Math.PI*2,z=random()*2-1,rr=Math.sqrt(1-z*z),rad=Math.cbrt(random());return {i,a,z,rad,dir:[Math.cos(a)*rr,z,Math.sin(a)*rr],phase:random(),noise:random(),size:0.65+random()*.7,color:random()-.5};})};});
 return {recipe,seed:String(seed),layers};
}
const TAU=Math.PI*2,frac=x=>x-Math.floor(x);
function pointAt(l,p,u,t){
 const a=p.a+l.twist*u*TAU,rad=l.radius*(0.35+p.rad*.65);let x=0,y=0,z=0;
 switch(l.shape){case'sphere':x=p.dir[0]*rad;y=p.dir[1]*rad;z=p.dir[2]*rad;break;case'ring':x=Math.cos(p.a)*rad;z=Math.sin(p.a)*rad;break;case'box':x=p.dir[0]*rad;y=p.z*rad;z=(p.noise-.5)*rad*2;break;case'cone':x=Math.cos(p.a)*u*l.spread;y=-rad+u*rad*2;z=Math.sin(p.a)*u*l.spread;break;case'line':x=(p.phase-.5)*rad*3;break;}
 const travel=u*l.speed*l.life;
 switch(l.motion){case'radial':x+=p.dir[0]*travel;y+=p.dir[1]*travel;z+=p.dir[2]*travel;break;case'orbit':x=Math.cos(a+t*l.speed)*rad;y+=Math.sin(p.a*3+t)*l.spread*.3;z=Math.sin(a+t*l.speed)*rad;break;case'vortex':x=Math.cos(a+t*l.speed)*rad*(.3+u);z=Math.sin(a+t*l.speed)*rad*(.3+u);y+=(u-.5)*l.speed*3;break;case'wave':x+=(u-.5)*l.speed*3;y+=Math.sin(x*2+t*l.speed+p.a)*l.spread;z+=Math.cos(x+t+p.a)*l.spread*.5;break;case'rise':y+=travel;x+=Math.sin(t+p.a+u*4)*l.spread*.3;z+=Math.cos(t+p.a)*l.spread*.3;break;case'ballistic':x+=p.dir[0]*travel;y+=Math.abs(p.dir[1])*travel-l.gravity*u*u*l.life*l.life*.5;z+=p.dir[2]*travel;break;}
 if(l.motion!=='ballistic')y-=l.gravity*u*u*.5;
 return [x+l.position[0],y+l.position[1],z+l.position[2]];
}
function sample(compiled,time){
 if(!Number.isFinite(time)||time<0||time>1e6)throw Error('Time must be finite and nonnegative');const t=time%compiled.recipe.duration;
 return compiled.layers.filter(l=>l.enabled).map(l=>({layer:l,elements:l.items.map(p=>{
 const u=l.emission==='burst'?(t-l.delay)/l.life:frac(t/l.life+p.phase);
 const alive=u>=0&&u<=1;const fade=alive?Math.pow(Math.sin(Math.PI*Math.min(.999,Math.max(.001,u))),.6):0;
 return {index:p.i,position:pointAt(l,p,u,t),previous:pointAt(l,p,Math.max(0,u-.025),t-.035),age:u,alpha:l.opacity*fade,size:l.size*p.size,hue:(l.hue+p.color*l.hueSpread+360)%360,rotation:p.a+t*l.twist,path:(['beam','ribbon','ring'].includes(l.renderer)?path(l,p,t,u):null)};
 })}));
}
function path(l,p,t,u){
 const n=l.renderer==='ring'?80:40,pts=[];
 for(let j=0;j<=n;j++){const f=j/n;
  if(l.renderer==='ring'){const a=f*TAU+p.a+t*l.speed*.25,rad=l.radius*(.75+.2*Math.sin(t*2+p.a));pts.push([Math.cos(a)*rad+l.position[0],Math.sin(a)*rad+l.position[1],Math.sin(a*3+t)*l.spread*.12+l.position[2]]);}
  else if(l.renderer==='beam'){const x=(f-.5)*l.radius*3,w=Math.sin(f*Math.PI)*l.spread;pts.push([x+l.position[0],Math.sin(f*TAU*3+p.a+t*l.speed*3)*w*.3+l.position[1],Math.cos(f*TAU*2+p.a+t*2)*w*.3+l.position[2]]);}
  else{const a=f*TAU*l.twist+p.a+t*l.speed,rad=l.radius*(.7+.25*Math.sin(f*6+t+p.a));pts.push([Math.cos(a)*rad+l.position[0],(f-.5)*3*l.spread+l.position[1],Math.sin(a)*rad+l.position[2]]);}
 }return pts;
}
function project(pos,camera,w,h){
 const cy=Math.cos(camera.yaw),sy=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);
 const x=pos[0]*cy+pos[2]*sy,z=-pos[0]*sy+pos[2]*cy,y=pos[1]*cp-z*sp,depth=pos[1]*sp+z*cp;
 const perspective=camera.projection==='perspective'?6/Math.max(1.2,6+depth):1,scale=Math.min(w,h)*.205*camera.zoom*perspective;
 return {x:w/2+x*scale,y:h/2-y*scale,depth,scale};
}
function fit(w,h,max=MAX_PIXELS){const f=Math.min(1,Math.sqrt(max/Math.max(1,w*h)));return {width:Math.max(1,Math.round(w*f)),height:Math.max(1,Math.round(h*f))};}
function renderer(canvas){
 const ctx=canvas.getContext('2d',{alpha:true}),sprites=new Map(),images=new Map();let disposed=false;
 function glowSprite(hue){const k=Math.round(hue/12)*12;if(sprites.has(k))return sprites.get(k);const c=canvas.ownerDocument.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d'),g=x.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,`hsla(${k},100%,70%,.65)`);g.addColorStop(.25,`hsla(${k},100%,55%,.18)`);g.addColorStop(1,`hsla(${k},100%,50%,0)`);x.fillStyle=g;x.fillRect(0,0,48,48);sprites.set(k,c);return c;}
 function draw(compiled,time,options={}){
  if(disposed)return;const w=canvas.width,h=canvas.height,camera=options.camera||compiled.recipe.camera;ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,w,h);
  if(!options.transparent){ctx.fillStyle='#080b12';ctx.fillRect(0,0,w,h);if(options.grid){ctx.strokeStyle='#15212e';ctx.lineWidth=1;for(let i=-5;i<=5;i++){const a=project([i,-2,-5],camera,w,h),b=project([i,-2,5],camera,w,h),c=project([-5,-2,i],camera,w,h),d=project([5,-2,i],camera,w,h);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke();}}}
  const commands=[];for(const group of sample(compiled,time))for(const e of group.elements)if(e.alpha>.003){const q=project(e.position,camera,w,h);commands.push({l:group.layer,e,q});}commands.sort((a,b)=>b.q.depth-a.q.depth);
  for(const {l,e,q} of commands){const s=Math.max(.65,e.size*q.scale),col=`hsl(${e.hue},100%,70%)`;ctx.globalCompositeOperation=l.blend==='add'?'lighter':'source-over';ctx.globalAlpha=e.alpha;ctx.strokeStyle=ctx.fillStyle=col;ctx.lineCap='round';ctx.lineJoin='round';
   if(e.path){const pts=e.path.map(p=>project(p,camera,w,h));const stroke=(width,color,alpha)=>{ctx.lineWidth=width;ctx.strokeStyle=color;ctx.globalAlpha=e.alpha*alpha;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();};if(l.glow)stroke(s*(4+l.glow*5),col,l.glow*.12);stroke(s,col,.8);stroke(Math.max(.55,s*.3),'#ecfcff',.9);continue;}
   if(l.glow){ctx.globalAlpha=e.alpha*l.glow;const r=s*(5+l.glow*6);ctx.drawImage(glowSprite(e.hue),q.x-r,q.y-r,r*2,r*2);ctx.globalAlpha=e.alpha;}
   if(l.sprite){let img=images.get(l.sprite);if(!img){img=new Image();img.src=l.sprite;images.set(l.sprite,img);}if(img.complete&&img.naturalWidth){ctx.imageSmoothingEnabled=false;ctx.drawImage(img,q.x-s*2,q.y-s*2,s*4,s*4);continue;}}
   if(l.renderer==='spark'){const p=project(e.previous,camera,w,h),dx=q.x-p.x,dy=q.y-p.y,mag=Math.hypot(dx,dy)||1;ctx.lineWidth=Math.max(.7,s*.55);ctx.beginPath();ctx.moveTo(q.x-dx/mag*s*5,q.y-dy/mag*s*5);ctx.lineTo(q.x,q.y);ctx.stroke();ctx.fillStyle='#effaff';ctx.fillRect(q.x-.5,q.y-.5,1.2,1.2);}
   else if(l.renderer==='shard'){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(e.rotation);ctx.beginPath();ctx.moveTo(0,-s*2.8);ctx.lineTo(s,0);ctx.lineTo(0,s*1.7);ctx.lineTo(-s,0);ctx.closePath();ctx.fill();ctx.strokeStyle='#edffff';ctx.lineWidth=.65;ctx.stroke();ctx.restore();}
   else{ctx.beginPath();ctx.arc(q.x,q.y,s,0,TAU);ctx.fill();if(s>1.5){ctx.fillStyle='#edffff';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(.5,s*.3),0,TAU);ctx.fill();}}
  }ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';return commands.length;
 }
 return {draw,dispose(){disposed=true;sprites.clear();images.clear();},stats:()=>({cachedGlowSprites:sprites.size,cachedImages:images.size})};
}
return {version:1,limits:{elements:MAX_ELEMENTS,layers:MAX_LAYERS,pixels:MAX_PIXELS,fps:30},enums,defaults,bounds,hash,rng,normalize,compile,sample,project,fit,renderer};
});
