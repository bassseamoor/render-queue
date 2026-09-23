import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
const root=fileURLToPath(new URL('../../',import.meta.url));
const baseline='0278a61892cf06f4d4f8c6f3f30e10e539f07aba';
const html=execFileSync('git',['show',baseline+':fireplace.html'],{cwd:root,encoding:'utf8',maxBuffer:2**20});
const original=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const digest=x=>crypto.createHash('sha256').update(x).digest('hex');
function environment(){
 const calls=[],shaders=[],storage=new Map(),timers=new Map(),raf=[];
 let recording=false,uid=0,boundBuffers={},boundTextures={},activeTexture=0;
 const consts=new Map();
 function normalized(x){
  if(ArrayBuffer.isView(x))return {type:x.constructor.name,len:x.length,hash:digest(Buffer.from(x.buffer,x.byteOffset,x.byteLength))};
  if(Array.isArray(x))return Array.from(x,normalized);
  if(x&&typeof x==='object')return x.uniform?{uniform:x.uniform,program:x.program}:x.kind?{kind:x.kind,hash:x.hash??null}:x;
  return x;
 }
 const gl=new Proxy({}, {get(t,k){
  if(k in t)return t[k];
  if(/^[A-Z_0-9]+$/.test(k)){if(!consts.has(k))consts.set(k,parseInt(digest(k).slice(0,7),16));return consts.get(k);}
  return t[k]=(...args)=>{
   if(recording)calls.push([k,...args.map(normalized)]);
   if(k.startsWith('create'))return {kind:k.slice(6),id:++uid};
   if(k==='getExtension')return null;
   if(k==='getParameter')return 8;
   if(k==='getShaderParameter'||k==='getProgramParameter')return true;
   if(k==='getShaderInfoLog'||k==='getProgramInfoLog')return '';
   if(k==='shaderSource'){args[0].src=args[1];args[0].hash=digest(args[1]);shaders.push(args[1]);}
   if(k==='attachShader'){(args[0].shaders??=[]).push(args[1]);args[0].hash=args[0].shaders.map(s=>s.hash).join('/');}
   if(k==='getUniformLocation')return {uniform:args[1],program:args[0].hash};
   if(k==='bindBuffer')boundBuffers[args[0]]=args[1];
   if(k==='bufferData'&&boundBuffers[args[0]])boundBuffers[args[0]].hash=typeof args[1]==='number'?'size:'+args[1]:digest(Buffer.from(args[1].buffer,args[1].byteOffset,args[1].byteLength));
   if(k==='activeTexture')activeTexture=args[0];
   if(k==='bindTexture')boundTextures[activeTexture]=args[1];
   if(k==='texImage2D'){const tex=boundTextures[activeTexture],data=args.at(-1);if(tex)tex.hash=ArrayBuffer.isView(data)?digest(Buffer.from(data.buffer,data.byteOffset,data.byteLength)):JSON.stringify(args.slice(0,-1));}
   return undefined;
  };
 }});
 const elements=new Map();
 function el(id){if(!elements.has(id))elements.set(id,{id,width:960,height:540,clientWidth:960,clientHeight:540,style:{},addEventListener(){},getContext(kind){if(kind==='webgl2')return gl;throw Error('unexpected context '+kind);},querySelector(){return null;}});return elements.get(id);}
 const doc={getElementById:el,querySelector(){return null;},createElement(){return {style:{}};},addEventListener(){},activeElement:null,hidden:false,title:'Fireplace Studio',body:{appendChild(){}},head:{appendChild(){}}};
 const env={console,Math,Array,Object,Number,String,parseInt,parseFloat,isFinite,JSON,document:doc,location:{search:'?seed=%2331A2B3C4D'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},devicePixelRatio:1,innerWidth:960,innerHeight:540,addEventListener(){},setTimeout(fn){const id=++uid;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>raf.push(fn),Image:class{set src(value){this.url=value;}},crypto:{getRandomValues(a){a[0]=0x1a2b3c4d;return a;}},URLSearchParams,URL,performance:{now:()=>1000},Uint8Array,Uint16Array,Uint32Array,Float32Array,Float64Array,ArrayBuffer};
 env.window=env;const ctx=vm.createContext(env);
 return {ctx,env,gl,shaders,storage,raf,el,timers,record(){calls.length=0;recording=true;},take(){recording=false;return [...calls];}};
}
const old=environment(),fresh=environment();
vm.runInContext(original[0],old.ctx);vm.runInContext(original[1],old.ctx);
const cache=new Map();
// This is an instrumented API, not a WebGL driver. Shader status is stubbed;
// compilation/rendering must also be checked in a real WebGL2 browser.
// Handles normalize by resource type and uploaded content, not allocation ID.
function getModule(file){file=path.resolve(root+'/studios/fireplace',file);if(cache.has(file))return cache.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context:fresh.ctx,identifier:file,importModuleDynamically:async(s,ref)=>{const d=await load(path.resolve(path.dirname(ref.identifier),s));if(d.status!=='evaluated')await d.evaluate();return d;}});cache.set(file,m);return m;}
async function load(file){const m=getModule(file);if(m.status==='unlinked')await m.link((s,ref)=>getModule(path.resolve(path.dirname(ref.identifier),s)));return m;}
const controller=await load('core/controller.js');await controller.evaluate();
const compat=await load('ui/compatibility.js');await compat.evaluate();compat.namespace.installCompatibility();
const clock=await load('core/clock.js');await clock.evaluate();clock.namespace.sizeCanvas();
fresh.env.__fpSetSeed('#31A2B3C4D');
const newShaders=[...fresh.shaders].sort(),oldShaders=[...old.shaders].sort();assert.deepEqual(newShaders,oldShaders,'Compiled shader sources changed');
function snapshot(e){return JSON.parse(JSON.stringify({settings:e.env.__fpGetSettings(),seed:e.env.__fpGetSeed(),life:e.env.__lifeHash(),dress:e.env.__fpDress}));}
function compare(label,oa,na){old.record();fresh.record();oa();na();const a=old.take(),b=fresh.take();try{assert.deepEqual(b,a,label);}catch(err){fs.writeFileSync(path.join(os.tmpdir(),'fireplace-trace-old.json'),JSON.stringify(a));fs.writeFileSync(path.join(os.tmpdir(),'fireplace-trace-new.json'),JSON.stringify(b));let i=0;while(JSON.stringify(a[i])===JSON.stringify(b[i])&&i<a.length)i++;console.error('First different command',i,a[i],b[i]);throw err;}assert.deepEqual(snapshot(fresh),snapshot(old),label+' state');console.log('PASS',label,a.length,'GL commands',digest(JSON.stringify(a)).slice(0,16));}
for(const seed of ['#300000000','#31A2B3C4D','#3FFFFFFFF','#1234ABCD','1234567890']){
 compare('seed '+seed,()=>old.env.__fpSetSeed(seed),()=>fresh.env.__fpSetSeed(seed));
 for(const t of [0,0.5,11.25])compare('frame '+t,()=>vm.runInContext(`tickFrame(${t},${Math.round(t*30)})`,old.ctx),()=>clock.namespace.tickFrame(t,Math.round(t*30)));
}
compare('render reset',()=>old.env.__renderReset(),()=>fresh.env.__renderReset());
for(const [w,h]of [[1080,1920],[1920,1080],[360,640]]){
 old.el('scene').width=fresh.el('scene').width=w;old.el('scene').height=fresh.el('scene').height=h;
 compare('resize '+w+'x'+h,()=>vm.runInContext('tickFrame(1,30)',old.ctx),()=>clock.namespace.tickFrame(1,30));
}
for(const e of [old,fresh])e.env.__fpDress.mantle=false;
compare('mantle off',()=>old.env.__fpRedress(),()=>fresh.env.__fpRedress());
compare('mantle off render',()=>vm.runInContext('tickFrame(2,60)',old.ctx),()=>clock.namespace.tickFrame(2,60));
for(const e of [old,fresh])e.env.__fpDress.mantle=true;
compare('mantle on',()=>old.env.__fpRedress(),()=>fresh.env.__fpRedress());
for(const [key,val]of [['weather',2],['weather',3],['camera',8],['grain',1]]){
 for(const e of [old,fresh]){e.env.__fpSetParam(key,val);}
 compare('parameter '+key+'='+val,()=>{for(const fn of old.timers.values())fn();old.timers.clear();},()=>{for(const fn of fresh.timers.values())fn();fresh.timers.clear();});
 compare('parameter render '+key,()=>vm.runInContext('tickFrame(3,90)',old.ctx),()=>clock.namespace.tickFrame(3,90));
}

for(const phase of ['warmup','record']){
 for(const e of [old,fresh])e.env.__renderMode={phase,frame:0,fps:30,W:1280,H:720,warmup:2,totalFrames:3,onFrame(){},onPhase(next){this.phase=next;}};
 for(const ms of [1000,1033,1066]){
  compare('export '+phase+' '+ms,()=>vm.runInContext(`frameLoop(${ms})`,old.ctx),()=>clock.namespace.frameLoop(ms));
  assert.equal(fresh.env.__renderMode.frame,old.env.__renderMode.frame);
  assert.equal(fresh.env.__renderMode.phase,old.env.__renderMode.phase);
 }
}
assert.equal(fresh.env.__fpRemixSeed('#31A2B3C4D'),old.env.__fpRemixSeed('#31A2B3C4D'));
const initialFrames=fresh.raf.length;
clock.namespace.startLoop();clock.namespace.startLoop();
assert.equal(fresh.raf.length,initialFrames+1,'Repeated start must not create another RAF loop');

// Link every first-party module and the vendored exporter without starting UI recording.
for(const f of ['studio.js','export/controller.js']){const m=await load(f);await m.evaluate();}
console.log('PASS all',cache.size,'ES modules link and evaluate. Render-command equivalence is not pixel or GPU validation.');
