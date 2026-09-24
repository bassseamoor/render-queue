
'use strict';
// Canal Metropolis — studio core (script block 0 of canal-metropolis.html;
// shader sources live in ./shaders.js).
import {vert,frag,screenVert,common,skyFrag,mistFrag,compositeFrag,opticalGLSL,cityLensFrag,citySnapshotFrag,postFrag,cityVertex,cityFragment,cityShadowFragment,aoFrag,aoBlurFrag} from './shaders.js';

/* CANAL METROPOLIS / 1.0 — no assets, dependencies, or network.
   Eight depth planes; seeded geometry; a shared atmospheric clock.
   Subtlety ledger: individual two-frequency motion; coherent 3% light breathing;
   spatial sky breathing; micro/macro foliage sway; cap radius breathing; tremor;
   surface caustics; water caustics; halo motes; individualized twinkle; night embers;
   exponential depth haze; two counter-moving mist scales; mist density breathing;
   ground light pools; creamy disk-tap DOF; wandering focus; directional rims;
   refractive counter-highlights; fine chromatic edge separation; traveling glints;
   organic shaft drift; spatial brightness swell; post-tone-map grain; breathing
   vignette; genuine scene-texture heat refraction; rare soft focal passages;
   soft cloud coalescence. Everything remains small, slow, and locally phased. */
const $=id=>document.getElementById(id), TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
function hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
let seedSerial=0;
function fresh(){const a=new Uint32Array(1);if(globalThis.crypto&&crypto.getRandomValues){crypto.getRandomValues(a);return a[0]}return hash(Date.now()+':'+performance.now()+':'+(++seedSerial))}
const organic=(t,p=0)=> (Math.sin(t*.071+p)+.57*Math.sin(t*.0471+p*1.731))/1.57;
const realms=[
 {name:'Drowned Forest',mood:'Water remembers what the forest forgot.',sky:[.015,.035,.053],fog:[.10,.21,.23],light:[.69,.83,.69],accent:[.66,.86,.37],key:[.29,.30]},
 {name:'Canal Metropolis',mood:'A city in miniature. Built in light, one neighborhood at a time.',sky:[.016,.020,.058],fog:[.12,.12,.24],light:[.40,.72,.89],accent:[.91,.26,.43],key:[.32,.25]},
 {name:'Ember Wastes',mood:'The earth is still dreaming of fire.',sky:[.033,.018,.031],fog:[.22,.10,.10],light:[1,.43,.16],accent:[1,.26,.045],key:[-.29,.23]},
 {name:'Cloud Ocean',mood:'Nothing to arrive at. Only the light.',sky:[.18,.29,.41],fog:[.58,.66,.68],light:[1,.88,.68],accent:[.76,.84,.85],key:[.25,.29]},
 {name:'Mycelium Deep',mood:'A small, luminous intelligence beneath everything.',sky:[.012,.025,.034],fog:[.07,.19,.19],light:[.34,.85,.69],accent:[.40,.85,.81],key:[-.21,.22]},
 {name:'Orbital Dawn',mood:'The silence between one world and the next.',sky:[.008,.012,.027],fog:[.12,.25,.40],light:[.98,.72,.43],accent:[.30,.62,1],key:[.27,.05]}
];
const controls=[['density','Life density',.45,1.5,1],['mist','Mist',0,1.6,.35],['glow','Light bloom',.3,1.7,1],['drift','Drift',.15,1.7,.65],['palette','Palette shift',-1,1,0],['grain','Film grain',0,1,.18],['focus','Depth of field',0,1.6,.85],['rays','Light shafts',0,1.5,.75]];
const cityControlNames={density:'Street activity',mist:'Atmosphere',glow:'Exposure',drift:'Camera travel',palette:'Color warmth',grain:'Film texture',focus:'Lens softness',rays:'Sun strength'};
const lensLooks=[
 {name:'Velvet miniature',note:'Clean, soft buildings',description:'Closest to your reference: a gentle softness everywhere, with creamy depth and clear color.',shape:0,floor:1.55,radius:11,width:.17,edge:0},
 {name:'Tilt-shift',note:'Sharp slice, soft distance',description:'A crisp band through the city, falling smoothly into soft foreground and distance.',shape:0,floor:0,radius:8,width:.19,edge:.12},
 {name:'Portrait',note:'An island of focus',description:'A soft oval of focus around the central district, with the edges gently falling away.',shape:1,floor:.25,radius:15,width:.19,edge:.04},
 {name:'Dream glass',note:'Creamy, luminous softness',description:'A richer blanket of softness. Building silhouettes and lighting remain clear while fine details melt together.',shape:0,floor:3.4,radius:15,width:.23,edge:0},
 {name:'Architectural',note:'Calm, detailed clarity',description:'A broad field of detail with restrained edge softness, for watching the entire city grow.',shape:0,floor:0,radius:3.5,width:.32,edge:.08}
];
function cleanLens(l){l=l||{};const mode=Number(l.mode);return{mode:clamp(Math.round(Number.isFinite(mode)?mode:1),0,lensLooks.length-1),position:Math.round(clamp(Number.isFinite(l.position)?l.position:.54,.15,.85)*1000)/1000,width:Math.round(clamp(Number.isFinite(l.width)?l.width:.19,.04,.36)*1000)/1000};}
function lensCode(c){const l=cleanLens(c.lens);return '-L'+[l.mode,Math.round(l.position*1000),Math.round(l.width*1000)].map(n=>n.toString(36)).join('.');}
const defaults=Object.fromEntries(controls.map(c=>[c[0],c[4]]));
let history=[],storageOK=true,favoritesOnly=false;
try{const saved=JSON.parse(localStorage.getItem('canal-metropolis-seeds-v1')||'[]');if(Array.isArray(saved))history=saved.filter(v=>v&&typeof v.code==='string'&&Number.isFinite(v.realm)).map(v=>({...v,realm:clamp(v.realm|0,0,5)}))}catch(e){storageOK=false}
const canalDefaultParams={...defaults,density:1.04,mist:.12,glow:1.02,drift:.24,palette:-.03,grain:.08,focus:.92,rays:.82};
let config={realm:1,layout:0,detail:hash('canal-metropolis-reference-detail'),params:canalDefaultParams,locks:{},lens:cleanLens({mode:1,position:.54,width:.19})};
function codeOf(c){return 'PX1-'+c.realm+'-'+(c.layout>>>0).toString(36)+'-'+(c.detail>>>0).toString(36)+'-'+controls.map(k=>Math.round((c.params[k[0]]-k[2])/(k[3]-k[2])*1000).toString(36)).join('.')+lensCode(c)}
function parseCode(code){const m=/^PX1-([0-5])-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9.]+)(?:-L([a-z0-9.]+))?$/i.exec(code.trim());if(!m)return null;const values=m[4].split('.');if(values.length!==controls.length)return null;const layout=parseInt(m[2],36),detail=parseInt(m[3],36);if(layout>4294967295||detail>4294967295)return null;const params={};for(let i=0;i<controls.length;i++){const v=parseInt(values[i],36);if(!Number.isFinite(v)||v<0||v>1000)return null;params[controls[i][0]]=mix(controls[i][2],controls[i][3],v/1000)}let lens={mode:1,position:.54,width:.19};if(m[5]){const v=m[5].split('.').map(n=>parseInt(n,36));if(v.length!==3||v.some(n=>!Number.isFinite(n))||v[0]<0||v[0]>=lensLooks.length||v[1]<150||v[1]>850||v[2]<40||v[2]>360)return null;lens=cleanLens({mode:v[0],position:v[1]/1000,width:v[2]/1000});}return{realm:1,layout,detail,params,lens,locks:{...config.locks}}}
function canonical(c){const n=parseCode(codeOf(c));n.locks={...c.locks};return n}
function persist(){try{localStorage.setItem('canal-metropolis-seeds-v1',JSON.stringify(history));storageOK=true}catch(e){storageOK=false;toast('Browser storage is full or unavailable. Export seeds to keep them.')} $('historyNote').textContent=storageOK?'Every new world is remembered on this browser. Seed storage is local to this browser and file.':'These seeds are in memory only. Export seeds to keep a copy.'}
function remember(c){const code=codeOf(c);const existing=history.find(v=>v.code===code);if(existing){existing.locks={...c.locks};existing.visited=Date.now()}else history.unshift({code,realm:c.realm,star:false,created:Date.now(),locks:{...c.locks}});persist();if($('library').classList.contains('open'))showHistory()}
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500)}
function notice(message){$('notice').textContent=message;$('notice').style.display='block'}
const canvas=$('scene');
window.__renderCanvas=canvas; // render-mode hook (controller reads this before its own takeover)
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
if(!gl){notice('This place needs WebGL. Open the HTML in a browser with hardware graphics enabled.');throw new Error('WebGL unavailable')}
var extDepthTex=null;try{extDepthTex=gl.getExtension('WEBGL_depth_texture')}catch(e){extDepthTex=null}








function opticalUniforms(p){const l=cleanLens(config.lens),look=lensLooks[l.mode];uniform(p,'uOptics',[look.floor,look.radius,look.edge,0]);uniform(p,'uLensControl',[look.shape,l.position,l.width]);}


let lensProgram=null,snapshotProgram=null;
function renderCityLens(fade){if(!lensProgram)lensProgram=program(screenVert,cityLensFrag);gl.bindFramebuffer(gl.FRAMEBUFFER,lensTarget.fb);gl.viewport(0,0,lensWidth,lensHeight);gl.disable(gl.BLEND);gl.useProgram(lensProgram.p);sampler(lensProgram,'uTex',sceneTarget.tex,0);sampler(lensProgram,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);uniform(lensProgram,'uMix',previous?fade:1);uniform(lensProgram,'uSize',[width,height]);uniform(lensProgram,'uLens',smoothed.focus*lightUI.tilt);uniform(lensProgram,'uBend',lightUI.bend);opticalUniforms(lensProgram);screen(lensProgram);gl.viewport(0,0,width,height);}
function snapshotWorld(){if(!snapshotProgram)snapshotProgram=program(screenVert,citySnapshotFrag);gl.bindFramebuffer(gl.FRAMEBUFFER,layerTarget.fb);gl.disable(gl.BLEND);gl.useProgram(snapshotProgram.p);sampler(snapshotProgram,'uTex',sceneTarget.tex,0);sampler(snapshotProgram,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);uniform(snapshotProgram,'uMix',previous?ease((elapsed-transitionStart)/TRANSITION_DUR):1);screen(snapshotProgram);const swap=oldTarget;oldTarget=layerTarget;layerTarget=swap;}

function program(v,f){const p=gl.createProgram();for(const[type,source]of[[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(msg)}gl.attachShader(p,s);gl.deleteShader(s)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return{p,u:{},a:{}}}
let programs;
try{programs={mesh:program(vert,frag),sky:program(screenVert,skyFrag),mist:program(screenVert,mistFrag),composite:program(screenVert,compositeFrag),post:program(screenVert,postFrag)}}catch(e){notice('The graphics driver could not start this world. '+e.message);throw e}
function uniform(p,name,v){if(!(name in p.u))p.u[name]=gl.getUniformLocation(p.p,name);const l=p.u[name];if(l===null)return;if(Array.isArray(v)){if(v.length===2)gl.uniform2fv(l,v);else if(v.length===3)gl.uniform3fv(l,v);else gl.uniform4fv(l,v)}else gl.uniform1f(l,v)}
function sampler(p,name,tex,unit){if(!(name in p.u))p.u[name]=gl.getUniformLocation(p.p,name);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(p.u[name],unit)}
const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
let attributeProgram=null;const enabledAttributes=new Set();
function attribute(p,name,size,stride,offset){if(attributeProgram!==p){for(const n of enabledAttributes)gl.disableVertexAttribArray(n);enabledAttributes.clear();attributeProgram=p;}if(!(name in p.a))p.a[name]=gl.getAttribLocation(p.p,name);const l=p.a[name];if(l>=0){gl.enableVertexAttribArray(l);enabledAttributes.add(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,stride,offset)}}
function screen(p){gl.bindBuffer(gl.ARRAY_BUFFER,quad);attribute(p,'aPos',2,8,0);gl.drawArrays(gl.TRIANGLES,0,6)}
function target(w,h){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);const depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Frame buffer unavailable');return{tex,fb,depth,w,h}}
// Depth-texture variant of target(): the color buffer is identical, but the depth
// buffer is a sampleable texture instead of a renderbuffer. This is the scene's
// depth pass — it costs no extra geometry because it IS the main render's depth.
function targetDepth(w,h){const t=target(w,h);t.depthTex=null;t.depthIsTex=false;if(!extDepthTex)return t;try{gl.deleteRenderbuffer(t.depth);t.depth=null;const dtex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,dtex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT,w,h,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.bindFramebuffer(gl.FRAMEBUFFER,t.fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,dtex,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('depth texture unavailable');gl.bindFramebuffer(gl.FRAMEBUFFER,null);t.depthTex=dtex;t.depthIsTex=true;return t}catch(e){try{dropTarget(t)}catch(_){}return target(w,h)}}
function dropTarget(t){if(t){gl.deleteTexture(t.tex);gl.deleteFramebuffer(t.fb);if(t.depthIsTex)gl.deleteTexture(t.depthTex);else if(t.depth)gl.deleteRenderbuffer(t.depth)}}
let layerTarget,sceneTarget,oldTarget,lensTarget,lensWidth=0,lensHeight=0,width=0,height=0,recording=false,contextLost=false;
let aoTarget=null,aoBlurTarget=null; // half-res screen-space AO buffers
function allocTargets(w,h){[layerTarget,sceneTarget,oldTarget,lensTarget,aoTarget,aoBlurTarget].forEach(dropTarget);layerTarget=target(w,h);sceneTarget=targetDepth(w,h);oldTarget=target(w,h);lensWidth=Math.max(2,Math.round(w*.5));lensHeight=Math.max(2,Math.round(h*.5));lensTarget=target(lensWidth,lensHeight);const aw=Math.max(2,w>>1),ah=Math.max(2,h>>1);aoTarget=target(aw,ah);aoBlurTarget=target(aw,ah);if(previous)previous.frozen=false;gl.viewport(0,0,w,h)}
function resize(){if(recording)return;const RM=window.__renderMode;if(RM){const w=RM.W,h=RM.H;if(w===width&&h===height)return;width=w;height=h;canvas.width=w;canvas.height=h;allocTargets(w,h);return;}const aspect=innerWidth/innerHeight;const scale=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1400000/(innerWidth*innerHeight)));const w=Math.max(2,Math.round(innerWidth*scale/2)*2),h=Math.max(2,Math.round(innerHeight*scale/2)*2);if(w===width&&h===height)return;width=w;height=h;canvas.width=w;canvas.height=h;allocTargets(w,h)}
// Geometry uses world units. Portrait viewing crops the same continuous world; no rebuild on resize.
class Mesh{
 constructor(){this.data=[];this.phase=0;this.motion=0;this.material=0;this.twinkle=0;this.construction=[0,0,0,0]}
 set(phase,motion=0,material=0,twinkle=0){this.phase=phase;this.motion=motion;this.material=material;this.twinkle=twinkle;return this}
 vertex(x,y,c,u=0,v=0){this.data.push(x,y,c[0],c[1],c[2],c[3]===undefined?1:c[3],this.phase,this.motion,this.material,this.twinkle,u,v,...this.construction)}
 tri(a,b,c,color){this.vertex(a[0],a[1],color);this.vertex(b[0],b[1],color);this.vertex(c[0],c[1],color)}
 polygon(points,color){let x=0,y=0;for(const p of points){x+=p[0];y+=p[1]}x/=points.length;y/=points.length;for(let i=0;i<points.length;i++)this.tri([x,y],points[i],points[(i+1)%points.length],color)}
 rect(x,y,w,h,c){this.tri([x,y],[x+w,y],[x,y+h],c);this.tri([x,y+h],[x+w,y],[x+w,y+h],c)}
 line(x1,y1,x2,y2,w,c,w2=w){const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1,nx=-dy/len*.5,ny=dx/len*.5;const a=[x1+nx*w,y1+ny*w],b=[x1-nx*w,y1-ny*w],d=[x2+nx*w2,y2+ny*w2],e=[x2-nx*w2,y2-ny*w2];this.tri(a,b,d,c);this.tri(d,b,e,c)}
 disc(x,y,rx,ry,c,mat=1){const was=this.material;this.material=mat;const pts=[[x-rx,y-ry,0,0],[x+rx,y-ry,1,0],[x-rx,y+ry,0,1],[x-rx,y+ry,0,1],[x+rx,y-ry,1,0],[x+rx,y+ry,1,1]];for(const p of pts)this.vertex(p[0],p[1],c,p[2],p[3]);this.material=was}
 upload(){this.count=this.data.length/16;this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.data),gl.STATIC_DRAW);this.data=null;return this}
 dispose(){gl.deleteBuffer(this.buffer)}
}
const color=(c,m=1,a=1)=>[c[0]*m,c[1]*m,c[2]*m,a];
function rock(m,r,x,y,w,h,c,seedPhase=0){m.set(seedPhase,.03);const points=[];let radius=.9;for(let j=0;j<23;j++){const angle=j/23*TAU;radius=mix(radius,.72+r()*.35,.62);points.push([x+Math.cos(angle)*w*radius,y+Math.sin(angle)*h*radius])}const center=[x-w*.16,y+h*.14];for(let j=0;j<points.length;j++){const brightness=.91+r()*.075+(points[j][1]-y)/h*.12;m.tri(center,points[j],points[(j+1)%points.length],color(c,brightness))}for(let j=0;j<4;j++){const a=points[Math.floor(r()*points.length)],px=center[0]+(r()-.5)*w*.8,py=center[1]-r()*h*.6;m.line(px,py,a[0],a[1],.0004,color(c,.52,.26));m.line(px+.0005,py+.0005,a[0]+.0005,a[1]+.0005,.0003,color(c,1.32,.17))}}
function peak(m,r,x,y,w,h,c,phase){m.set(phase,.01);const summit=x+(r()-.5)*w*.38,points=[];const n=38;for(let j=0;j<=n;j++){const u=j/n,px=x-w+u*w*2;const ridge=Math.pow(Math.max(0,1-Math.abs(px-summit)/(w*1.25)),1.4);const jag=(r()-.5)*.10+Math.sin(u*27.3+phase)*.035;points.push([px,y+h*(ridge+jag*(1-Math.abs(u-.5)))])}for(let j=0;j<n;j++){const shade=.76+.20*(1-j/n);m.tri([x-w,y-.06],points[j],points[j+1],color(c,shade));if(j%3===0){const q=points[j];m.line(q[0],q[1],mix(q[0],x,j/n*.38),y,.0006,color(c,1.25,.23))}}}
function canopy(m,r,x,y,w,h,c,phase){for(let k=0;k<7;k++){const px=x+(r()-.5)*w,py=y+(r()-.5)*h*.35;m.set(phase+k*1.29,.45);m.disc(px,py,w*(.27+r()*.15),h*(.33+r()*.21),color(c,.88+r()*.13,.68),2);for(let j=0;j<3;j++){const hx=px+(r()-.5)*w*.35,hy=py-h*.16;m.set(phase+k+j*.4,.72);m.line(hx,hy,hx+(r()-.5)*w*.08,hy-h*(.24+r()*.56),.0007,color(c,1.10,.58),.00015)}}}
function roots(m,r,x,y,w,c,phase){m.set(phase,.035);for(const side of [-1,1]){let px=x,py=y+.026;for(let j=1;j<=9;j++){const u=j/9,nx=x+side*w*(.6+u*u*2.8),ny=y+.026-u*.065;m.line(px,py,nx,ny,w*(1-u)*.9+.0005,c,w*(1-u)*.65+.0003);px=nx;py=ny}}}
function terrain(m,r,y,amp,c,phase){m.set(phase,.015);const pts=[];for(let x=-2.6;x<=2.65;x+=.055){const v=y+Math.sin(x*3.13+phase)*amp*.42+Math.sin(x*7.91+phase*1.7)*amp*.23+(r()-.5)*amp*.37;pts.push([x,v])}for(let i=0;i<pts.length-1;i++){m.tri(pts[i],pts[i+1],[pts[i][0],-.85],c);m.tri(pts[i+1],[pts[i+1][0],-.85],[pts[i][0],-.85],c)}return pts}
function branch(m,r,x,y,len,angle,width,level,c,phase,foliage=true){const nx=x+Math.cos(angle)*len,ny=y+Math.sin(angle)*len;m.set(phase,.2+level*.07);m.line(x,y,nx,ny,width,c,width*.48);m.line(x-width*.23,y,nx-width*.15,ny,width*.08,color(c,1.8,.4),width*.015);if(level>0){branch(m,r,nx,ny,len*(.59+r()*.11),angle+(.26+r()*.48),width*.5,level-1,c,phase+.3,foliage);branch(m,r,nx,ny,len*(.61+r()*.12),angle-(.26+r()*.46),width*.55,level-1,c,phase+.9,foliage);if(level>2)branch(m,r,x+(nx-x)*.6,y+(ny-y)*.6,len*.44,angle+(r()>.5?1:-1)*.9,width*.4,level-2,c,phase+1.9,foliage)}else if(foliage){for(let j=0;j<4;j++){const dx=nx+(r()-.5)*len*.75,dy=ny+(r()-.5)*len*.4;m.set(phase+j,1.1);m.disc(dx,dy,len*.22,len*.085,color(c,1.1,.65),2);m.line(dx,dy,dx+(r()-.5)*.012,dy-len*(.5+r()),.0008,color(c,.9,.65),.0001)}}}
function mushroom(m,r,x,y,s,c,phase){const lean=(r()-.5)*s*.18;const top=y+s;const stem=color(c,.18);m.set(phase,-.26);m.line(x,y,x+lean*.45,y+s*.54,s*.085,stem,s*.053);m.line(x+lean*.45,y+s*.54,x+lean,top-s*.08,s*.053,color(c,.29),s*.068);m.line(x-s*.016,y,x+lean-s*.012,top-s*.07,s*.009,color(c,.74,.56),s*.008);
 const capw=s*(.41+r()*.15),capH=s*.21,cx=x+lean;
 for(let j=0;j<28;j++){const a=j/28*Math.PI,b=(j+1)/28*Math.PI;const pa=[cx+Math.cos(a)*capw,top+Math.sin(a)*capH],pb=[cx+Math.cos(b)*capw,top+Math.sin(b)*capH];m.set(phase,-.38);m.tri([cx,top-s*.045],pa,pb,color(c,.42+.25*Math.sin(a)));m.tri([cx,top-s*.045],[cx+Math.cos(a)*capw,top],[cx+Math.cos(b)*capw,top],color(c,.63));m.line(cx,top-s*.055,cx+Math.cos(a)*capw,top,s*.0025,color(c,.91,.5));}
 m.disc(cx,top-s*.005,capw*1.4,s*.18,color(c,.8,.09),1);m.disc(cx,top,s*.95,s*.75,color(c,.8,.025),1);
 for(let j=0;j<24;j++){const dx=(r()-.5)*capw*1.8,hh=Math.sqrt(Math.max(0,1-dx*dx/(capw*capw)))*capH;m.set(phase+j*.87,-.36,0,1);m.disc(cx+dx,top+r()*hh,s*.006,s*.004,color(c,1.35,.66),1)}
}
function cloud(m,r,x,y,w,h,c,phase,near=false){for(let j=0;j<18;j++){const a=r()*TAU,rad=r();const dx=x+Math.cos(a)*w*rad*.67,dy=y+Math.sin(a)*h*rad*.46;const rw=w*(.18+r()*.24),rh=h*(.49+r()*.40);m.set(phase+j*1.137,.34);m.disc(dx,dy,rw,rh,color(c,.77+(dy-y)/h*.12,near?.62:.52),2);m.disc(dx-rw*.10,dy+rh*.20,rw*.90,rh*.70,color(c,1.14,.31),2)}}
const depths=[0,.12,.26,.35,.46,.62,.88,1.12];
// CITY / elevated miniature photography. All meshes and materials are generated.



let photoPrograms=null;
function matMul(a,b){const o=new Array(16).fill(0);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o}
const dot3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const norm3=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l)};
const cross3=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function lookAt(eye,at){const z=norm3(eye.map((v,i)=>v-at[i])),x=norm3(cross3([0,1,0],z)),y=cross3(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot3(x,eye),-dot3(y,eye),-dot3(z,eye),1]}
function perspective(fov,aspect,near=8,far=160){const f=1/Math.tan(fov/2),nf=1/(near-far);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]}
function ortho(s,near=.1,far=130){return[1/s,0,0,0,0,1/s,0,0,0,0,-2/(far-near),0,0,0,-(far+near)/(far-near),1]}
function matrix(p,name,value){if(!(name in p.u))p.u[name]=gl.getUniformLocation(p.p,name);gl.uniformMatrix4fv(p.u[name],false,new Float32Array(value))}
// Column-major 4x4 inverse (matches the layout of perspective()/ortho()/lookAt()).
function mat4Inverse(m){const inv=new Array(16);
inv[0]=m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
inv[4]=-m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
inv[8]=m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
inv[12]=-m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
inv[1]=-m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
inv[5]=m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
inv[9]=-m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
inv[13]=m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
inv[2]=m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
inv[6]=-m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
inv[10]=m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
inv[14]=-m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
inv[3]=-m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
inv[7]=m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
inv[11]=-m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
inv[15]=m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
let det=m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];if(det===0)det=1;det=1/det;for(let k=0;k<16;k++)inv[k]*=det;return inv}
// Lighting + post state. Plain values only — no randomness anywhere in this path,
// so the same seed and the same slider positions always give the same image.
var lightUI={sun:1,amb:1,tod:.75,ao:true,tilt:1,bend:.08,blimpMsg:'SEAGULL INSURANCE · CHEAPER THAN BREAD'};
var lastViewInv=null,lastFocalPx=0,aoAvailable=false;
var aoProgram=null,aoBlurProgram=null;
// Rectangle subtraction gives each exposed surface one owner, including roof corners.
function cutRect(a,b){const x0=Math.max(a[0],b[0]),y0=Math.max(a[1],b[1]),x1=Math.min(a[2],b[2]),y1=Math.min(a[3],b[3]);if(x1-x0<1e-7||y1-y0<1e-7)return[a];const out=[];if(x0>a[0]+1e-7)out.push([a[0],a[1],x0,a[3]]);if(x1<a[2]-1e-7)out.push([x1,a[1],a[2],a[3]]);if(y0>a[1]+1e-7)out.push([x0,a[1],x1,y0]);if(y1<a[3]-1e-7)out.push([x0,y1,x1,a[3]]);return out;}
function subtractRects(parts,rect){return parts.flatMap(p=>cutRect(p,rect));}
function beginBuilding(m){m.solids=[];}
function finishBuilding(m){
 const boxes=m.solids;m.solids=null;if(!boxes)return;
 const state={kind:m.kind,material:m.material,anchor:m.anchor,route:m.route};
 // Outward box faces: trim covered regions instead of stacking coplanar shells.
 for(let i=0;i<boxes.length;i++){const b=boxes[i];m.kind=b.kind;m.material=b.mat;m.anchor=b.anchor;
  for(const [axis,sign,u,v] of [[2,-1,0,1],[2,1,0,1],[0,-1,2,1],[0,1,2,1],[1,1,0,2]]){
   const plane=sign>0?b.hi[axis]:b.lo[axis],rect=[b.lo[u],b.lo[v],b.hi[u],b.hi[v]];let parts=[rect];
   for(let j=0;j<boxes.length&&parts.length;j++){if(j===i)continue;const q=boxes[j],inside=q.lo[axis]<plane-1e-6&&q.hi[axis]>plane+1e-6;
    const outward=sign>0?Math.abs(q.lo[axis]-plane)<1e-6&&q.hi[axis]>plane+1e-6:Math.abs(q.hi[axis]-plane)<1e-6&&q.lo[axis]<plane-1e-6;
    const same=j>i&&Math.abs((sign>0?q.hi[axis]:q.lo[axis])-plane)<1e-6;
    if(inside||outward||same)parts=subtractRects(parts,[q.lo[u],q.lo[v],q.hi[u],q.hi[v]]);
   }
   const n=[0,0,0];n[axis]=sign;
   for(const p of parts){const point=(uu,vv)=>{const a=[0,0,0];a[axis]=plane;a[u]=uu;a[v]=vv;return a};m.face(point(p[0],p[1]),point(p[2],p[1]),point(p[2],p[3]),point(p[0],p[3]),b.c,n,1,[p[0]-b.lo[u],p[1]-b.lo[v]]);}
  }
 }
 // A separate, watertight construction cut through the UNION of the building's volumes.
 // Only the height interval currently being built is drawn; settled roofs are never moved.
 const masses=m.construction[0]<0?[]:boxes.filter(b=>b.hi[1]-b.lo[1]>.012&&b.hi[0]-b.lo[0]>.02&&b.hi[2]-b.lo[2]>.02);
 for(let i=0;i<masses.length;i++){const b=masses[i],levels=[b.lo[1],b.hi[1]];
  for(let j=0;j<i;j++){const q=masses[j];if(q.hi[0]<=b.lo[0]||q.lo[0]>=b.hi[0]||q.hi[2]<=b.lo[2]||q.lo[2]>=b.hi[2])continue;for(const y of [q.lo[1],q.hi[1]])if(y>b.lo[1]+1e-6&&y<b.hi[1]-1e-6)levels.push(y);}
  levels.sort((a,b)=>a-b);const unique=levels.filter((v,k)=>!k||v-levels[k-1]>1e-6);
  for(let k=0;k<unique.length-1;k++){const bottom=unique[k],top=unique[k+1],mid=(bottom+top)*.5;let parts=[[b.lo[0],b.lo[2],b.hi[0],b.hi[2]]];
   for(let j=0;j<i&&parts.length;j++){const q=masses[j];if(q.lo[1]<mid&&q.hi[1]>mid)parts=subtractRects(parts,[q.lo[0],q.lo[2],q.hi[0],q.hi[2]]);}
   m.kind=3;m.material=19;m.route=[bottom,top,0,0];
   for(const p of parts)m.face([p[0],0,p[1]],[p[2],0,p[1]],[p[2],0,p[3]],[p[0],0,p[3]],[.49,.50,.46],[0,1,0]);
  }
 }
 Object.assign(m,state);
}

class CityMesh{
 constructor(){this.data=[];this.indices=[];this.construction=[0,0,0,0];this.material=0;this.phase=0;this.kind=0;this.anchor=0;this.lots=[];this.turn=0;this.pivot=[0,0];this.route=[0,0,0,0]}
 vertex(p,n,c,uv){let route=this.route;if(this.turn){const co=Math.cos(this.turn),si=Math.sin(this.turn),x=p[0]-this.pivot[0],z=p[2]-this.pivot[1];p=[this.pivot[0]+co*x+si*z,p[1],this.pivot[1]-si*x+co*z];n=[co*n[0]+si*n[2],n[1],-si*n[0]+co*n[2]];if(this.kind===2){const xx=route[0]-this.pivot[0],zz=route[1]-this.pivot[1];route=[this.pivot[0]+co*xx+si*zz,this.pivot[1]-si*xx+co*zz,route[2],route[3]];}if(this.kind===3&&route[3]>.5)uv=[co*uv[0]+si*uv[1],-si*uv[0]+co*uv[1]];}this.data.push(...p,...n,c[0],c[1],c[2],...this.construction,...uv,this.material,this.phase,this.kind,this.anchor,...route)}
 face(a,b,c,d,color,normal,uvScale=1,uvOrigin=[0,0]){const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),ad=d.map((v,i)=>v-a[i]),geometric=cross3(ab,ac),fallback=cross3(ac,ad),raw=norm3(Math.hypot(...geometric)>1e-9?geometric:fallback),n=normal&&dot3(raw,normal)<0?raw.map(v=>-v):raw,w=Math.hypot(...ab)*uvScale,h=Math.hypot(...ad)*uvScale,base=this.data.length/23;this.vertex(a,n,color,uvOrigin);this.vertex(b,n,color,[uvOrigin[0]+w,uvOrigin[1]]);this.vertex(c,n,color,[uvOrigin[0]+w,uvOrigin[1]+h]);this.vertex(d,n,color,[uvOrigin[0],uvOrigin[1]+h]);const reverse=dot3(cross3(ab,ac),n)<0;if(Math.hypot(...ab)>1e-8&&Math.hypot(...ac)>1e-8)this.indices.push(base,base+(reverse?2:1),base+(reverse?1:2));if(Math.hypot(...ad)>1e-8)this.indices.push(base,base+(reverse?3:2),base+(reverse?2:3));}

 box(x,y,z,w,h,d,c,mat=this.material){if(w<=0||h<=0||d<=0)return;if(this.solids&&this.kind<1.5){this.solids.push({lo:[x,y,z],hi:[x+w,y+h,z+d],c,mat,kind:this.kind,anchor:this.anchor});return;}const old=this.material;this.material=mat;const a=[x,y,z],b=[x+w,y,z],e=[x,y+h,z],f=[x+w,y+h,z],j=[x,y,z+d],k=[x+w,y,z+d],l=[x,y+h,z+d],q=[x+w,y+h,z+d];this.face(a,b,f,e,c,[0,0,-1]);this.face(k,j,l,q,c,[0,0,1]);this.face(j,a,e,l,c,[-1,0,0]);this.face(b,k,q,f,c,[1,0,0]);this.face(e,f,q,l,c,[0,1,0]);this.material=old;}
 bevelBox(x,y,z,w,h,d,c,mat=2){if(w<.3||h<.3||d<.3){this.box(x,y,z,w,h,d,c,mat);return;}const old=this.material;this.material=mat;const b=Math.min(w,d,h)*.045,top=y+h,ring=[[x+b,z],[x+w-b,z],[x+w,z+b],[x+w,z+d-b],[x+w-b,z+d],[x+b,z+d],[x,z+d-b],[x,z+b]];for(let k=0;k<8;k++){const a=ring[k],q=ring[(k+1)%8],dx=q[0]-a[0],dz=q[1]-a[1],n=norm3([dz,0,-dx]);this.face([a[0],y,a[1]],[q[0],y,q[1]],[q[0],top-b,q[1]],[a[0],top-b,a[1]],c,n);const aa=[mix(a[0],x+w/2,b/Math.max(w,d)),mix(a[1],z+d/2,b/Math.max(w,d))],qq=[mix(q[0],x+w/2,b/Math.max(w,d)),mix(q[1],z+d/2,b/Math.max(w,d))];this.material=0;this.face([a[0],top-b,a[1]],[q[0],top-b,q[1]],[qq[0],top,qq[1]],[aa[0],top,aa[1]],color(c,1.13),norm3([n[0],1,n[2]]));this.face([x+w/2,top,z+d/2],[aa[0],top,aa[1]],[qq[0],top,qq[1]],[x+w/2,top,z+d/2],color(c,.92),[0,1,0]);this.material=mat;}this.material=old;}
 dome(x,y,z,rx,ry,rz,c,segments=16,rings=4){const saved=this.kind;for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const point=(a,b)=>[x+Math.cos(a)*Math.sin(b)*rx,y+Math.cos(b)*ry,z+Math.sin(a)*Math.sin(b)*rz],a=i/segments*TAU,b=(i+1)/segments*TAU,c0=j/rings*Math.PI*.5,d=(j+1)/rings*Math.PI*.5,n=norm3([Math.cos((a+b)/2)*Math.sin((c0+d)/2),Math.cos((c0+d)/2),Math.sin((a+b)/2)*Math.sin((c0+d)/2)]);this.face(point(a,c0),point(b,c0),point(b,d),point(a,d),c,n);}const start=this.data.length;this.roundCap(x,y-ry,z,rx,rz,ry*2,0,segments,rings*2);for(let k=start;k<this.data.length;k+=23)this.data[k+18]=y;this.kind=saved;}
 roundCap(x,y,z,rx,rz,h,taper,segments,rings=1){if(this.construction[0]<0||this.construction[1]<=0||this.kind!==0)return;const old={kind:this.kind,material:this.material,route:this.route};this.kind=3;this.material=19;this.route=[y,y+h,taper,rings];for(let i=0;i<segments;i++){const a=i/segments*TAU,b=(i+1)/segments*TAU,base=this.data.length/23;this.vertex([x,0,z],[0,1,0],[.49,.50,.46],[0,0]);this.vertex([x+Math.cos(b)*rx,0,z+Math.sin(b)*rz],[0,1,0],[.49,.50,.46],[Math.cos(b)*rx,Math.sin(b)*rz]);this.vertex([x+Math.cos(a)*rx,0,z+Math.sin(a)*rz],[0,1,0],[.49,.50,.46],[Math.cos(a)*rx,Math.sin(a)*rz]);this.indices.push(base,base+1,base+2);}Object.assign(this,old);}
 cylinder(x,y,z,rx,rz,h,c,segments=24,taper=1){for(let i=0;i<segments;i++){const a=i/segments*TAU,b=(i+1)/segments*TAU;const p=[x+Math.cos(a)*rx,y,z+Math.sin(a)*rz],q=[x+Math.cos(b)*rx,y,z+Math.sin(b)*rz],t=[x+Math.cos(b)*rx*taper,y+h,z+Math.sin(b)*rz*taper],s=[x+Math.cos(a)*rx*taper,y+h,z+Math.sin(a)*rz*taper];this.face(p,q,t,s,c,[Math.cos((a+b)/2),0,Math.sin((a+b)/2)]);this.face([x,y+h,z],s,t,[x,y+h,z],color(c,.9),[0,1,0]);}this.roundCap(x,y,z,rx,rz,h,taper,segments);}
 sphere(x,y,z,rx,ry,rz,c,segments=10,rings=6){for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const p=(a,b)=>[x+Math.cos(a)*Math.sin(b)*rx,y+Math.cos(b)*ry,z+Math.sin(a)*Math.sin(b)*rz];const a=i/segments*TAU,b=(i+1)/segments*TAU,c0=j/rings*Math.PI,d=(j+1)/rings*Math.PI;const n=norm3([Math.cos((a+b)/2)*Math.sin((c0+d)/2),Math.cos((c0+d)/2),Math.sin((a+b)/2)*Math.sin((c0+d)/2)]);this.face(p(a,c0),p(b,c0),p(b,d),p(a,d),c,n)}if(this.material===8)this.roundCap(x,y-ry,z,rx,rz,ry*2,0,segments,rings);}
 upload(){this.vertexCount=this.data.length/23;this.count=this.indices.length;this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);if(this.vertexCount<=65535){gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(this.data),gl.STATIC_DRAW);this.indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(this.indices),gl.STATIC_DRAW);}else{const expanded=new Float32Array(this.count*23);for(let j=0;j<this.count;j++)for(let k=0;k<23;k++)expanded[j*23+k]=this.data[this.indices[j]*23+k];gl.bufferData(gl.ARRAY_BUFFER,expanded,gl.STATIC_DRAW);this.vertexCount=this.count;}this.data=null;this.indices=null;return this}
 dispose(){gl.deleteBuffer(this.buffer);if(this.indexBuffer)gl.deleteBuffer(this.indexBuffer)}
}
// A seed defines geography first, then streets, parcels, districts and architecture.
const cityPlanCache=new Map();
const cityFamilies=['River Quarter','Harbor City','Canal Metropolis','Garden Rings','Delta Islands','Sun Coast'];
function cityFamily(seed){return hash(seed+':urban-family')%cityFamilies.length}
function cityLand(s,x,z){const [type,phase,offset,water]=s.geo,[bend,amp,slope]=s.map;const river=offset+Math.sin(z*bend+phase)*amp+z*slope;
 if(type===0)return Math.abs(x-river)-water;
 if(type===1)return offset+Math.sin(z*.09+phase)*4-x;
 if(type===2)return (Math.hypot((x-s.cx)/1.50,(z-s.cz)/2.4)-1.52);
 if(type===3)return 20;
 if(type===4)return Math.min(Math.abs(x-river)-water,Math.abs(z-offset*.7-Math.sin(x*.12+phase)*2)-water*.72);
 return z-offset-Math.sin(x*.095+phase)*3.8;
}
function parkHit(p,x,z){let dx=x-p.x,dz=z-p.z;const rot=p.rot||0;
 if(rot){const c=Math.cos(-rot),s2=Math.sin(-rot),rx=dx*c-dz*s2,rz=dx*s2+dz*c;dx=rx;dz=rz;}
 if(p.kind===0)return dx*dx+dz*dz<p.r*p.r;
 if(p.kind===1)return Math.abs(dx)<p.w/2&&Math.abs(dz)<p.d/2;
 return (Math.abs(dx)<p.w/2&&Math.abs(dz)<p.d/2)||(Math.abs(dx-(p.lx||0))<(p.w2||0)/2&&Math.abs(dz-(p.lz||0))<(p.d2||0)/2);}
function cityPark(s,x,z){if(s.family===2)return Math.hypot((x-s.cx)/1.15,(z-s.cz)/2.2)<4.35;if(s.family===3)return Math.hypot(x,z)<3.25;const ps=s.parks;for(let i=0;i<ps.length;i++)if(parkHit(ps[i],x,z))return true;return false}
function cityPlan(c){if(cityPlanCache.has(c.layout))return cityPlanCache.get(c.layout);const r=rng(hash(c.layout+':urban-plan-v4')),family=cityFamily(c.layout);
 const s={family,name:cityFamilies[family],geo:[family,r()*6.28,(r()-.5)*6, .8+r()*1.25],map:[.06+r()*.10,1.4+r()*2.4,(r()-.5)*.16,0],cx:family===2?0:(r()-.5)*6,cz:family===2?0:(r()-.5)*6,park:[(r()-.5)*15,(r()-.5)*15,1.8+r()*2],sx:1.85+r()*.75,sz:1.9+r()*.65,angle:family===2?.52:(r()>.5?1:-1)*(.30+r()*.65),elevation:family===2?26:22+r()*7,distance:family===2?28:29+r()*5,roads:[],lots:[],green:[],boats:[],traffic:[],joints:[],ramps:[],xings:[],parks:[],pigeonSpots:[],surfLots:[],garages:[],freeway:null,phase:r()*100};
 if(family===1)s.geo[2]=3+r()*4;if(family===5)s.geo[2]=-4+r()*5;
 s.palette=family===5?[[.76,.71,.57],[.69,.39,.20],[.14,.29,.34]]:family===2?[[.66,.65,.56],[.45,.28,.19],[.15,.34,.42]]:family===3?[[.58,.56,.44],[.39,.25,.16],[.18,.32,.28]]:family===4?[[.73,.67,.49],[.37,.23,.14],[.12,.32,.39]]:[[.62,.61,.53],[.42,.22,.13],[.20,.34,.38]];
 s.landTint=family===2?[.24,.42,.18]:family===5?[.32,.34,.20]:[.13,.22,.14];s.waterTint=family===2?[.045,.34,.43]:family===5?[.045,.25,.32]:family===4?[.065,.23,.20]:[.055,.19,.21];
 if(family===2){const br0=rng(hash(c.layout+':grand-bridge'));s.bridgeX=(br0()<.5?-1:1)*(1.15+br0()*.35);s.bridgeArch=1.05+br0()*.5;}
 function roadPath(pts,width,opts){opts=opts||{};const seq=[pts[0].slice()];
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.8));
   for(let k=1;k<=n;k++)seq.push([mix(a[0],b[0],k/n),mix(a[1],b[1],k/n)]);}
  let open=null,bridging=false,firstRun=true,prevY=.012;
  const isLand=(x,z)=>cityLand(s,x,z)>.18&&!cityPark(s,x,z);
  const pushRun=(a,b,bridge)=>{const len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<.5)return;
   const y=bridge?.065:.012;
   if(!firstRun){
    if(Math.abs(y-prevY)>.02)s.ramps.push({x:a[0],z:a[1],dx:(b[0]-a[0])/len,dz:(b[1]-a[1])/len,w:width,y0:prevY,y1:y});
    else s.joints.push({x:a[0],z:a[1],w:width,y:y,cls:opts.cls||''});
   }
   firstRun=false;prevY=y;
   s.roads.push({a:a.slice(),b:b.slice(),width:width,y:y,bridge:bridge,cls:opts.cls||''});
   if(len>1.4&&!opts.noTraffic)s.traffic.push({a:a.slice(),b:b.slice(),cls:opts.cls||'',width:width});};
  for(let k=0;k<seq.length-1;k++){const p=seq[k],q=seq[k+1],mx=(p[0]+q[0])/2,mz=(p[1]+q[1])/2;
   const land=isLand(mx,mz),water=!land&&opts.bridge&&cityLand(s,mx,mz)<-.28,br=water&&!land;
   if(land||water){if(!open){open=p;bridging=br;}else if(br!==bridging){pushRun(open,p,bridging);open=p;bridging=br;}}
   if(open&&((!land&&!water)||k===seq.length-2)){pushRun(open,(land||water)?q:p,bridging);open=null;}}
 }
 function road(a,b,width,opts){roadPath([a,b],width,opts);}
 function lotR(rr,x,z,w,d,angle,id){const reach=Math.hypot(w,d)*.53;if(cityLand(s,x,z)<reach||cityPark(s,x,z))return;if(family===2&&Math.abs(x-s.bridgeX)<1.45&&Math.abs(z-s.cz)<6.6)return;const cluster=Math.exp(-((x-s.cx)**2+(z-s.cz)**2)/(family===2?85:50));const district=hash(c.layout+':district:'+Math.floor(x/5)+':'+Math.floor(z/5))%5;let style=district;
 if(family===5)style=rr()<.74?2:1;else if(family===2){const sv=rr();style=sv<.36?0:sv<.58?4:sv<.70?5:sv<.82?6:7;}else if(family===3)style=rr()<.55?1:3;
 let h=(.5+rr()*1.5+cluster*(1+rr()*4));if(family===2)h*=1.75;if(family===5)h*=.55;if(family===4)h*=1.15;if(style===2)h*=.70;const existing=rr()<(family===5?.50:family===2?1:.28);let birth=existing?-35000:rr()*19800; if(!existing&&rr()>.91)birth=29000+rr()*28000;const duration=1500+h*630+rr()*800;const rad=Math.hypot(x,z);s.lots.push({id,x:x-w/2,z:z-d/2,y:0,width:w,depth:d,height:h,birth,duration,phase:rr()*100,style,landmark:0,row:Math.floor((z+20)/s.sz),col:Math.floor((x+20)/s.sx),angle,existing,lod:rad>30?2:(rad>22?1:0)});}
 function lot(x,z,w,d,angle,id){lotR(r,x,z,w,d,angle,id);}
 // Worker B: varied park shapes (circle / rect / L), placed before parcels so lots avoid them.
 if(family!==3){
  const pr=rng(hash(c.layout+':parks'));
  const nP=3+Math.floor(pr()*3);
  for(let k=0;k<nP;k++){
   for(let att=0;att<14;att++){
    const a=pr()*TAU,rad=7+pr()*30,x=s.cx+Math.cos(a)*rad,z=s.cz+Math.sin(a)*rad;
    if(cityLand(s,x,z)<1.2)continue;
    const roll=pr(),pk={kind:roll<.4?0:(roll<.65?1:2),x,z,rot:(pr()-.5)*.9};
    if(pk.kind===0)pk.r=1.0+pr()*.9;
    else if(pk.kind===1){pk.w=1.8+pr()*1.6;pk.d=1.4+pr()*1.4;}
    else{pk.w=2.2+pr()*1.2;pk.d=1.2+pr()*.8;pk.lx=(pr()-.5)*1.4;pk.lz=(pr()-.5)*1.4;pk.w2=1.2+pr()*.9;pk.d2=1.0+pr()*.8;}
    let clash=false;
    for(const q of s.parks)if(Math.hypot(q.x-x,q.z-z)<3.4){clash=true;break;}
    if(!clash&&Math.hypot(x-s.cx,z-s.cz)>4){s.parks.push(pk);break;}
   }
  }
  // The ground shader tints one park blob; point it at the largest park.
  let big=s.parks[0];
  for(const p of s.parks){const area=p.kind===0?p.r*p.r*3.14:p.w*p.d,barea=big.kind===0?big.r*big.r*3.14:big.w*big.d;if(area>barea)big=p;}
  if(big)s.park=[big.x,big.z,Math.max(1.2,big.r||Math.max(big.w,big.d)/2)];
 }
 if(family===3){const rings=13+Math.floor(r()*2),spacing=2.0+r()*.4;for(let ring=0;ring<rings;ring++){const radius=4.8+ring*spacing,count=Math.floor(TAU*radius/(2.0+r()*.45)),offset=r()*TAU;
 for(let k=0;k<count;k++){const a=k/count*TAU+offset,px=Math.cos(a)*radius,pz=Math.sin(a)*radius;const spoke=Math.abs(Math.sin(a*3));if(spoke>.16)lot(px,pz,1.25+r()*.38,1.18+r()*.35,-a+Math.PI/2,'r'+ring+':'+k);const b=(k+1)/count*TAU+offset;road([Math.cos(a)*(radius+spacing*.48),Math.sin(a)*(radius+spacing*.48)],[Math.cos(b)*(radius+spacing*.48),Math.sin(b)*(radius+spacing*.48)],.30);}
 }for(let k=0;k<6;k++){const a=k/6*TAU;road([Math.cos(a)*3.4,Math.sin(a)*3.4],[Math.cos(a)*37,Math.sin(a)*37],.46);}}
 else{const shift=r()*.7,wob=(hash(c.layout+':road-wob')%628)/100,wobAmp=.45+(hash(c.layout+':road-amp')%90)/100,wob2=(hash(c.layout+':road-wob2')%628)/100;
  const hCurve=(z)=>{const pts=[];for(let x=-64;x<=64;x+=3.2)pts.push([x,z+Math.sin(x*.085+wob)*wobAmp+Math.sin(x*.031+wob2)*wobAmp*.55]);return pts;};
  const vCurve=(x,z0,z1)=>{const pts=[];for(let z=z0;z<=z1;z+=2.2)pts.push([x+Math.sin(z*.11+wob2)*wobAmp*.6,z]);return pts;};
  for(let row=-9;row<23;row++){const z=(row-6.5)*s.sz,offset=family===5?Math.sin(row*.47+s.phase)*1.2:family===4?(row%2)*s.sx*.35:Math.sin(row*.23+s.phase)*shift;
   const blvd=row%4===1;
   roadPath(hCurve(z+s.sz*.48),blvd?.5:(family===2?.42:.3),{bridge:blvd,cls:blvd?'blvd':'street'});
   for(let col=-9;col<24;col++){const x=(col-7)*s.sx+offset,w=s.sx*(.57+r()*.14),d=s.sz*(.55+r()*.16);lot(x,z,w,d,0,'g'+row+':'+col);if(row<22)roadPath(vCurve(x+s.sx*.48,z-s.sz*.5,z+s.sz*.5),.22,{cls:'lane'});}}
  // The street grid runs past the old map edge, so roads continue instead of ending mid-frame.
  const re=rng(hash(c.layout+':urban-plan-v4:far'));
  for(let row=-19;row<36;row++){if(row>=-9&&row<23)continue;const z=(row-6.5)*s.sz,offset2=family===5?Math.sin(row*.47+s.phase)*1.2:family===4?(row%2)*s.sx*.35:Math.sin(row*.23+s.phase)*shift;
   roadPath(hCurve(z+s.sz*.48),.42,{bridge:row%4===1,cls:row%4===1?'blvd':'street'});
   for(let col=-19;col<35;col++){const x=(col-7)*s.sx+offset2;
    if(col<-9||col>=24){const w=s.sx*(.57+re()*.14),d=s.sz*(.55+re()*.16);lotR(re,x,z,w,d,0,'f'+row+':'+col);}
    if(row<35)roadPath(vCurve(x+s.sx*.48,z-s.sz*.5,z+s.sz*.5),.22,{cls:'lane'});}}
  for(let row=-9;row<23;row++){const z=(row-6.5)*s.sz,offset2=family===5?Math.sin(row*.47+s.phase)*1.2:family===4?(row%2)*s.sx*.35:Math.sin(row*.23+s.phase)*shift;
   for(let col=-19;col<35;col++){if(col>=-9&&col<24)continue;const x=(col-7)*s.sx+offset2,w=s.sx*(.57+re()*.14),d=s.sz*(.55+re()*.16);lotR(re,x,z,w,d,0,'f'+row+':'+col);}}
  if(family===2){
   // Elliptical ring boulevards tie the grid together around the water.
   for(const rr of[13,26]){const pts=[];for(let i=0;i<=72;i++){const a=i/72*TAU;pts.push([s.cx+Math.cos(a)*rr*1.15,s.cz+Math.sin(a)*rr*2.2]);}roadPath(pts,.5,{bridge:true,cls:'blvd',noTraffic:true});}
   // Far-field blocks keep the city going toward the horizon, dissolving into haze.
   const re2=rng(hash(c.layout+':urban-plan-v4:far2'));
   for(let gx=-60;gx<=60;gx+=6.8)for(let gz=-60;gz<=60;gz+=6.8){
    const x=gx+(re2()-.5)*4,z=gz+(re2()-.5)*4,rad=Math.hypot(x-s.cx,z-s.cz);
    if(rad<28||rad>62)continue;if(cityLand(s,x,z)<1.6||cityPark(s,x,z))continue;
    if(Math.abs(x-s.bridgeX)<2&&Math.abs(z-s.cz)<7)continue;
    let clash=false;for(const l of s.lots){if(Math.abs(l.x+l.width/2-x)<4.4&&Math.abs(l.z+l.depth/2-z)<4.4){clash=true;break;}}
    if(clash)continue;const w=2.2+re2()*2.6,d=2.2+re2()*2.6;
    s.lots.push({id:'s'+gx+':'+gz,x:x-w/2,z:z-d/2,y:0,width:w,depth:d,height:(.9+re2()*2.6)*(1.3-rad/72),birth:-35000,duration:1,phase:re2()*100,style:0,landmark:0,row:99,col:99,angle:(re2()-.5)*.4,existing:true,lod:2});}
  }
  if(family===0||family===4){
   // Quay boulevards trace both banks of each waterway; landmark bridges join them.
   const[type,phase,offset,water]=s.geo,[bend,amp,slope]=s.map,riverX=z=>offset+Math.sin(z*bend+phase)*amp+z*slope;
   for(const side of[-1,1]){const pts=[],off=water+1.15;
    for(let i=0;i<=28;i++){const z=-40+80*i/28;pts.push([riverX(z)+side*off,z]);}
    roadPath(pts,.44,{cls:'quay'});}
   for(let j=0;j<6;j++){const z=-20+j*7.5+(hash(c.layout+':br'+j)%40)/10,cx=riverX(z),span=water+2.6,wobZ=Math.sin(j*2.1)*1.2;
    roadPath([[cx-span,z+wobZ],[cx+span,z+wobZ]],.34,{bridge:true,cls:'bridge'});}
   if(family===4){const cw=water*.72,canalZ=x=>offset*.7+Math.sin(x*.12+phase)*2;
    for(const side of[-1,1]){const pts=[];for(let i=0;i<=26;i++){const x=-40+80*i/26;pts.push([x,canalZ(x)+side*(cw+1.15)]);}
     roadPath(pts,.4,{cls:'quay'});}
    for(let j=0;j<5;j++){const x=-18+j*8+(hash(c.layout+':cb'+j)%40)/10,cz=canalZ(x),span=cw+2.4,ox=Math.sin(j*1.7);
     roadPath([[x+ox,cz-span],[x+ox,cz+span]],.3,{bridge:true,cls:'bridge'});}}
  }
 }
 // Landmark positions are selected from each city's actual land parcels.
 const candidates=s.lots.filter(l=>Math.hypot(l.x-s.cx,l.z-s.cz)<8).sort((a,b)=>hash(c.layout+a.id)-hash(c.layout+b.id));
 if(candidates[0]){const l=candidates[0];l.landmark=family===5?3:family===2?4:1;l.height=family===5?4.3:family===2?10.5+r()*2:6+r()*3;l.birth=family===2?-35000:250;l.duration=5600;l.existing=family===2;}
 if(candidates[3]){candidates[3].landmark=2;candidates[3].height=1.7+r()*.9;}
 if(candidates[1]){candidates[1].landmark=5;candidates[1].height=3.6+r()*1.4;}
 if(family===2){
  // A rooftop-garden quarter: low podiums with planted roofs near the water.
  const gd=rng(hash(c.layout+':gardens'));
  const pool=s.lots.filter(l=>{if(l.landmark||l.lod!==0||!l.existing)return false;const d=Math.hypot(l.x+l.width/2-s.cx,l.z+l.depth/2-s.cz);return d>5.5&&d<12;});
  for(let k=0;k<7&&pool.length;k++){const l=pool.splice(Math.floor(gd()*pool.length),1)[0];l.style=7;l.height=Math.min(l.height,1.1+gd()*.9);}
  s.townBounds=[64,64];
 }
 const fb=rng(hash(c.layout+':flyby'));s.flyby=[240+fb()*120,8+fb()*20];
 if(family===2){for(let ring=0;ring<2;ring++){const count=ring?28:18,radius=ring?3.82:2.40;for(let i=0;i<count;i++){const a=i/count*TAU+ring*.10,rr=radius+.12*Math.sin(i*2.17+ring);const x=s.cx+Math.cos(a)*rr*1.15,z=s.cz+Math.sin(a)*rr*2.2;if(cityLand(s,x,z)>.12&&cityPark(s,x,z))s.green.push([x,z,.64+r()*.32]);}}}
 else for(let k=0;k<250;k++){const x=(r()-.5)*39,z=(r()-.5)*39;if(cityLand(s,x,z)>.6&&cityPark(s,x,z))s.green.push([x,z,.55+r()*.55]);}
 // Straight, land-tested navigation reaches prevent vehicles from crossing water.
 s.traffic.sort((a,b)=>hash(c.layout+':traffic:'+a.a)-hash(c.layout+':traffic:'+b.a));s.traffic=s.traffic.slice(0,100);
 if(family!==3){for(let k=0;k<18;k++){const x=(r()-.5)*37,z=(r()-.5)*35,angle=r()*TAU,dx=Math.cos(angle)*2.5,dz=Math.sin(angle)*2.5;if([0,.25,.5,.75,1].every(t=>cityLand(s,x+dx*t,z+dz*t)<-.45))s.boats.push({a:[x,z],b:[x+dx,z+dz]});}}
 // ---- Worker B: intersections, stop logic, freeway, parking, pigeon spots ----
 (function(){
  const R=rng(hash(c.layout+':city-systems'));
  // Pairwise road-run intersections at matching deck height, via coarse spatial
  // hash (deterministic insertion order). Only segments sharing a cell are tested.
  const segs=s.roads,cellSz=2.5,grid=new Map();
  const cellsOf=(A)=>{const s2=new Set();
   for(let cx=Math.floor((Math.min(A.a[0],A.b[0])-1)/cellSz);cx<=Math.floor((Math.max(A.a[0],A.b[0])+1)/cellSz);cx++)
    for(let cz=Math.floor((Math.min(A.a[1],A.b[1])-1)/cellSz);cz<=Math.floor((Math.max(A.a[1],A.b[1])+1)/cellSz);cz++)
     s2.add(cx+':'+cz);
   return s2;};
  const seenJ=new Set(),jkey=(x,z)=>Math.round(x*2)+':'+Math.round(z*2);
  for(const j of s.joints)seenJ.add(jkey(j.x,j.z));
  for(const rp of s.ramps)seenJ.add(jkey(rp.x,rp.z));
  const xingTest=(A,B)=>{
   if(Math.abs(A.y-B.y)>.02)return;
   const ax=A.b[0]-A.a[0],az=A.b[1]-A.a[1],bx=B.b[0]-B.a[0],bz=B.b[1]-B.a[1];
   const den=ax*bz-az*bx;
   if(Math.abs(den)>1e-9){
    const t=((B.a[0]-A.a[0])*bz-(B.a[1]-A.a[1])*bx)/den,u=((B.a[0]-A.a[0])*az-(B.a[1]-A.a[1])*ax)/den;
    if(t>.03&&t<.97&&u>.03&&u<.97){
     const x=A.a[0]+ax*t,z=A.a[1]+az*t,k=jkey(x,z);
     if(!seenJ.has(k)&&s.xings.length<420){seenJ.add(k);s.xings.push({x:x,z:z,w:Math.max(A.width,B.width),y:A.y,cls:A.cls});}
     return;
    }
   }
   // T-junctions / end-to-end meets: cover the wedge gap at touching endpoints.
   const jw=(A.width+B.width)*.22+.06;
   const testPt=(P,S0,S1)=>{
    const dx2=S1[0]-S0[0],dz2=S1[1]-S0[1],L2=dx2*dx2+dz2*dz2;
    if(L2<1e-9)return;
    let tt=((P[0]-S0[0])*dx2+(P[1]-S0[1])*dz2)/L2;tt=Math.max(0,Math.min(1,tt));
    const px=S0[0]+dx2*tt,pz=S0[1]+dz2*tt;
    if(Math.hypot(P[0]-px,P[1]-pz)<jw){
     const k=jkey(P[0],P[1]);
     if(!seenJ.has(k)){seenJ.add(k);s.joints.push({x:P[0],z:P[1],w:Math.max(A.width,B.width),y:Math.max(A.y,B.y),cls:A.cls});}
    }};
   testPt(B.a,A.a,A.b);testPt(B.b,A.a,A.b);testPt(A.a,B.a,B.b);testPt(A.b,B.a,B.b);};
  for(let i=0;i<segs.length&&s.xings.length<420;i++){
   const A=segs[i],seen=new Set(),ck=cellsOf(A);
   for(const k of ck){const bucket=grid.get(k);
    if(bucket)for(const j of bucket){if(seen.has(j))continue;seen.add(j);xingTest(A,segs[j]);}}
   for(const k of ck){let b=grid.get(k);if(!b){b=[];grid.set(k,b);}b.push(i);}
  }
  // Stop fractions along each traffic route, from the intersections it crosses.
  for(const p of s.traffic){
   p.stops=[];
   const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],L2=dx*dx+dz*dz;
   if(L2<1e-9)continue;
   for(const x of s.xings){
    const t=((x.x-p.a[0])*dx+(x.z-p.a[1])*dz)/L2;
    if(t>.06&&t<.94){
     const px=p.a[0]+dx*t,pz=p.a[1]+dz*t;
     if(Math.hypot(px-x.x,pz-x.z)<p.width*.5+.4){p.stops.push(t);if(p.stops.length>=2)break;}
    }
   }
  }
  // Elevated freeway ring, clear of the building mass (deck at y=4.4).
  const fr=26+R()*6;
  s.freeway={x:s.cx+(R()-.5)*8,z:s.cz+(R()-.5)*8,r:fr,y:4.4,w:1.15,ramps:[]};
  // Two on/off ramps at the clearest azimuths (fewest lots in the corridor).
  for(let ri=0;ri<2;ri++){
   let best=-1,bestScore=1e9;
   for(let sa=0;sa<12;sa++){
    const a=sa/12*TAU+ri*2.4+R()*.3;
    let ok=true,score=R()*.2;
    for(let q=0;q<s.freeway.ramps.length;q++)if(Math.abs(((a-s.freeway.ramps[q]+Math.PI*3)%TAU)-Math.PI)<1.1)ok=false;
    if(!ok)continue;
    const dx=Math.cos(a),dz=Math.sin(a);
    for(const l of s.lots){
     const lx=l.x+l.width/2-s.freeway.x,lz=l.z+l.depth/2-s.freeway.z,t=lx*dx+lz*dz;
     if(t>fr-2&&t<fr+16){const perp=Math.abs(lx*dz-lz*dx);if(perp<1.6){score+=3;if(l.height>3)score+=6;}}
    }
    if(score<bestScore){bestScore=score;best=a;}
   }
   if(best>=0)s.freeway.ramps.push(best);
  }
  // Standalone parking garages tucked roadside near the street grid.
  for(let gi=0;gi<4&&s.garages.length<4;gi++){
   for(let att=0;att<48;att++){
    const tr=s.traffic[Math.floor(R()*s.traffic.length)];
    if(!tr)break;
    if(tr.bridge)continue;
    const dx=tr.b[0]-tr.a[0],dz=tr.b[1]-tr.a[1],L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;
    const t=.15+R()*.7,side=R()<.5?1:-1;
    const gw=2.0+R()*1.3,gd=1.5+R()*1.0;
    const gx=tr.a[0]+dx*t+(-uz)*side*(tr.width/2+gd/2+.5),gz=tr.a[1]+dz*t+(ux)*side*(tr.width/2+gd/2+.5);
    if(cityLand(s,gx,gz)<1.0||cityPark(s,gx,gz))continue;
    let clash=false;
    for(const l of s.lots)if(Math.abs(l.x+l.width/2-gx)<gw/2+.9&&Math.abs(l.z+l.depth/2-gz)<gd/2+.9){clash=true;break;}
    for(const q of s.garages)if(Math.hypot(q.x-gx,q.z-gz)<5){clash=true;break;}
    for(const q of s.surfLots)if(Math.hypot(q.x-gx,q.z-gz)<4){clash=true;break;}
    if(clash)continue;
    s.garages.push({x:gx,z:gz,w:gw,d:gd,rot:-Math.atan2(dz,dx),seed:R()*100});
    break;
   }
  }
  // Variable-size surface parking lots tucked beside streets.
  for(let pi=0;pi<9;pi++){
   const tr=s.traffic[Math.floor(R()*s.traffic.length)];
   if(!tr)break;
   const dx=tr.b[0]-tr.a[0],dz=tr.b[1]-tr.a[1],L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;
   const t=.15+R()*.7,side=R()<.5?1:-1;
   const pw=1.3+R()*1.5,pd=.9+R()*.9;
   const px=tr.a[0]+dx*t+(-uz)*side*(tr.width/2+pd/2+.35),pz=tr.a[1]+dz*t+(ux)*side*(tr.width/2+pd/2+.35);
   if(cityLand(s,px,pz)<1.1||cityPark(s,px,pz))continue;
   let clash=false;
   for(const l of s.lots)if(Math.abs(l.x+l.width/2-px)<pw/2+1.2&&Math.abs(l.z+l.depth/2-pz)<pd/2+1.2){clash=true;break;}
   if(clash)continue;
   s.surfLots.push({x:px,z:pz,w:pw,d:pd,rot:-Math.atan2(dz,dx),seed:R()*100});
  }
  // Pigeon spots: street corners at intersections, where flocks congregate.
  for(let qi=0;qi<30&&s.pigeonSpots.length<8;qi++){
   const x=s.xings[Math.floor(R()*s.xings.length)];
   if(!x)break;
   const a=R()*TAU,off=x.w/2+.55;
   const qx=x.x+Math.cos(a)*off,qz=x.z+Math.sin(a)*off;
   if(cityLand(s,qx,qz)<.25||cityPark(s,qx,qz))continue;
   let clash=false;
   for(const l of s.lots)if(qx>l.x-.3&&qx<l.x+l.width+.3&&qz>l.z-.3&&qz<l.z+l.depth+.3){clash=true;break;}
   if(clash)continue;
   let dup=false;
   for(const q of s.pigeonSpots)if(Math.hypot(q.x-qx,q.z-qz)<3.2){dup=true;break;}
   if(!dup)s.pigeonSpots.push({x:qx,z:qz,seed:R()*100});
  }
 })();
 s.lots.sort((a,b)=>a.z-b.z);s.lots.forEach((l,i)=>l.plane=1+Math.min(6,Math.floor(i*7/s.lots.length)));s.signature=[family,s.geo,s.map,s.sx,s.sz,s.cx,s.cz,s.angle];
 if(cityPlanCache.size>10)cityPlanCache.delete(cityPlanCache.keys().next().value);cityPlanCache.set(c.layout,s);return s;}
function cityLots(c,index){return cityPlan(c).lots.filter(l=>l.plane===index)}
function cityRoad(m,a,b,width,y,c,mat=4){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1,nx=-dz/len*width*.5,nz=dx/len*width*.5;m.material=mat;m.face([a[0]+nx,y,a[1]+nz],[b[0]+nx,y,b[1]+nz],[b[0]-nx,y,b[1]-nz],[a[0]-nx,y,a[1]-nz],c,[0,1,0]);m.material=0;}
function cityTree(m,x,z,s,r){m.box(x-.025,.05,z-.025,.05,s*.65,.05,[.25,.18,.10],0);m.material=23;const g=.33+r()*.09,leaf=[.18+r()*.06,g,.10+r()*.045];m.sphere(x,s*.72,z,s*.35,s*.43,s*.34,leaf,9,5);m.sphere(x-s*.17,s*.77,z,s*.22,s*.28,s*.23,[leaf[0]*1.12,leaf[1]*1.08,leaf[2]*1.06],8,4);m.sphere(x+s*.18,s*.78,z+s*.03,s*.22,s*.28,s*.23,[leaf[0]*.91,leaf[1]*.96,leaf[2]*.91],8,4);m.material=0;}
// Architectural grammar: parcels keep their schedule, district language and silhouette at every LOD.
// A small seamless material field is baked once per world, never regenerated while tuning.
// Guarded anisotropic filtering for baked canvas/material textures: sharpens
// grazing-angle detail on ground and buildings when the driver allows it.
// Purely additive — silently does nothing if the extension is missing.
let anisoExt=null,anisoMax=1;
function applyAniso(tex){try{
 if(!anisoExt){anisoExt=gl.getExtension('EXT_texture_filter_anisotropic')||gl.getExtension('MOZ_EXT_texture_filter_anisotropic')||gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');if(anisoExt)anisoMax=Math.min(4,gl.getParameter(anisoExt.MAX_TEXTURE_MAX_ANISOTROPY));}
 if(anisoExt&&anisoMax>1){gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameterf(gl.TEXTURE_2D,anisoExt.TEXTURE_MAX_ANISOTROPY_EXT,anisoMax);}
}catch(_){}}
function bakeCityMaterials(seed){
 const size=128,r=rng(hash(seed+':mineral-atlas')),grids=[2,4,8,16,32,64].map(n=>({n,v:Float32Array.from({length:n*n},()=>r())}));
 const sample=(g,u,v)=>{const xx=u*g.n,yy=v*g.n,x=Math.floor(xx),y=Math.floor(yy),fx=xx-x,fy=yy-y,tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy),at=(a,b)=>g.v[(b%g.n)*g.n+a%g.n];return mix(mix(at(x,y),at(x+1,y),tx),mix(at(x,y+1),at(x+1,y+1),tx),ty)};
 const bytes=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,i=(y*size+x)*4,values=grids.map(g=>sample(g,u,v));bytes[i]=Math.round(255*(values[0]*.50+values[1]*.30+values[2]*.20));bytes[i+1]=Math.round(255*(values[2]*.50+values[3]*.32+values[4]*.18));bytes[i+2]=Math.round(255*(values[4]*.4+values[5]*.6));bytes[i+3]=255;}
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);applyAniso(tex);return tex;
}
const architectureNames=['Lantern glass','Terracotta screen','Crown setback','Garden courtyard','Sawtooth works','Mansard house','Loggia residence','Hanging gardens','Bridge towers','Stepped garden tower','Grand courtyard','Wavy atelier','Canal warehouse','Needle spire','Dome pavilion','Green roof podium','Ziggurat steps','Twin skybridge','Drum tower','Thin slab','Notch corner','Spire stack'];
function architecturalType(c,l){const t=l.style*2+(hash(c.layout+':architecture:'+Math.floor(l.x/4)+':'+Math.floor(l.z/4))&1);const nw=hash(c.layout+':arch-wc:'+l.id);return nw%7===0?16+(nw>>>4)%6:t;}
// Worker C: six new silhouette families (types 16-21) take ~1/7 of lots.
function roofKit(m,x,z,w,d,h,r,theme,far=false){
 const old=m.kind;m.kind=1;
 if(far){m.material=16;m.face([x,h+.025,z],[x+w,h+.025,z],[x+w,h+.025,z+d],[x,h+.025,z+d],[.26,.29,.27],[0,1,0]);m.material=0;m.kind=old;return;}
 m.box(x+.018,h,z+.018,w-.036,.025,d-.036,[.26,.29,.27],16);
 const stone=[.65,.64,.55],rim=.035;
 m.box(x,h,z,w,.10,rim,stone,12);m.box(x,h,z+d-rim,w,.10,rim,stone,12);
 m.box(x,h,z,rim,.10,d,stone,12);m.box(x+w-rim,h,z,rim,.10,d,stone,12);
 if(w>.42&&d>.42){
  if(theme===1){ // Protected roof garden, with a timber shade frame.
   m.box(x+w*.12,h+.03,z+d*.13,w*.72,.065,d*.44,[.45,.43,.32],12);
   m.box(x+w*.15,h+.096,z+d*.16,w*.66,.025,d*.38,[.20,.30,.13],5);
   for(let j=0;j<2;j++){m.material=5;m.sphere(x+w*(.30+j*.35),h+.18,z+d*.36,w*.12,.12,d*.13,[.17,.30,.11],5,2);}m.material=0;
   if(w>.7&&d>.7){const px=x+w*.15,pz=z+d*.64,pw=w*.62,pd=d*.23;
    for(let j=0;j<4;j++)m.box(px+(j%2)*pw,h+.03,pz+Math.floor(j/2)*pd,.027,.25,.027,[.32,.26,.17],15);
    for(let j=0;j<4;j++)m.box(px-.03,h+.28,pz+j*pd/3,pw+.08,.025,.023,[.46,.37,.23],15);
   }
  }else if(theme===2){ // Copper lantern and stone service stack.
   m.box(x+w*.28,h+.03,z+d*.28,w*.42,.16,d*.43,[.13,.26,.25],14);
   m.box(x+w*.26,h+.19,z+d*.26,w*.46,.025,d*.47,[.26,.40,.35],14);
   m.box(x+w*.13,h+.03,z+d*.70,.085,.26,.09,[.50,.42,.31],3);
  }else{ // Louvred plant, a separate duct, and inset solar panels.
   m.box(x+w*.12,h+.035,z+d*.13,w*.30,.13,d*.26,[.46,.51,.49],8);
   m.box(x+w*.15,h+.167,z+d*.16,w*.24,.012,d*.20,[.13,.19,.19],17);
   m.box(x+w*.42,h+.04,z+d*.20,w*.33,.06,.06,[.50,.52,.48],8);
   m.box(x+w*.16,h+.04,z+d*.59,w*.62,.028,d*.25,[.045,.13,.20],18);
  }
 }
 m.kind=old;
}
function pitchedRoof(m,x,z,w,d,h,r,far,mansard=false){
 const old=m.kind;m.kind=1;const rise=Math.min(w,d)*(mansard?.30:.23),roof=[.24,.30,.29];
 if(mansard){ // Four hipped slopes around a usable flat crown.
  const ix=w*.17,iz=d*.17;m.material=14;
  m.face([x,h,z],[x+w,h,z],[x+w-ix,h+rise,z+iz],[x+ix,h+rise,z+iz],roof,[0,.55,-.83]);
  m.face([x+w,h,z+d],[x,h,z+d],[x+ix,h+rise,z+d-iz],[x+w-ix,h+rise,z+d-iz],roof,[0,.55,.83]);
  m.face([x,h,z+d],[x,h,z],[x+ix,h+rise,z+iz],[x+ix,h+rise,z+d-iz],roof,[-.83,.55,0]);
  m.face([x+w,h,z],[x+w,h,z+d],[x+w-ix,h+rise,z+d-iz],[x+w-ix,h+rise,z+iz],roof,[.83,.55,0]);
  m.box(x+ix,h+rise-.012,z+iz,w-ix*2,.025,d-iz*2,[.30,.34,.31],16);
  if(!far){for(let j=0;j<2;j++){const xx=x+w*(.22+j*.42);m.box(xx,h+rise*.35,z+d*.035,w*.14,rise*.50,d*.15,[.67,.61,.48],12);m.box(xx+w*.02,h+rise*.41,z+d*.025,w*.10,rise*.32,.016,[.07,.16,.20],1);m.box(xx-.012,h+rise*.85,z+d*.018,w*.14+.024,.025,d*.19,roof,14);}}
 }else{m.material=10;m.face([x-.025,h,z],[x+w+.025,h,z],[x+w+.025,h+rise,z+d*.5],[x-.025,h+rise,z+d*.5],[.47,.24,.13],[0,.9,-.44]);m.face([x-.025,h+rise,z+d*.5],[x+w+.025,h+rise,z+d*.5],[x+w+.025,h,z+d],[x-.025,h,z+d],[.47,.24,.13],[0,.9,.44]);
  m.material=3;m.face([x,h,z],[x,h,z+d],[x,h+rise,z+d*.5],[x,h+rise,z+d*.5],[.47,.30,.22],[-1,0,0]);m.face([x+w,h,z+d],[x+w,h,z],[x+w,h+rise,z+d*.5],[x+w,h+rise,z+d*.5],[.47,.30,.22],[1,0,0]);}
 if(!far)m.box(x+w*.72,h+rise*.3,z+d*.65,.09,.31,.10,[.44,.31,.23],3);
 m.material=0;m.kind=old;
}
function architectureBuilding(m,l,s,c,stone,brick,glass){
 const {x,z,width:w,depth:d,height:h}=l,far=!!l.lod,type=architecturalType(c,l),r=rng(hash(c.detail+':building-kit:'+l.id));
 const trim=color(stone,1.13),dark=color(stone,.76),copper=[.19+r()*.04,.34+r()*.04,.30],clay=[.53+r()*.12,.29+r()*.08,.16];
 m.anchor=.31+(hash(c.layout+':floor:'+l.id)%5)*.022;
 const box=(xx,yy,zz,ww,hh,dd,tint,mat)=>m.box(xx,yy,zz,ww,hh,dd,tint,mat);
 const roof=(xx,zz,ww,dd,hh,theme=0)=>roofKit(m,xx,zz,ww,dd,hh,r,theme,far);
 // A legible base / body / crown rhythm, with different massing for each building family.
 if(type===0){
  box(x,0,z,w,h*.15,d,dark,12);box(x+w*.08,h*.15,z+d*.08,w*.84,h*.85,d*.84,glass,1);
  if(!far)for(let j=0;j<3;j++)box(x+w*(.13+j*.34),h*.15,z+d*.065,.028,h*.85,d*.87,trim,8);
  roof(x+w*.08,z+d*.08,w*.84,d*.84,h,0);
 }else if(type===1){
  box(x,0,z,w,h,d,glass,1);
  const count=far?3:5;for(let j=0;j<count;j++)box(x+w*j/(count-1)-.008,.10,z-.028,.042,h-.10,d+.056,clay,13);
  roof(x,z,w,d,h,1);
 }else if(type===2){
  for(let j=0;j<3;j++){const inset=j*.13,ww=w*(1-2*inset),dd=d*(1-2*inset),yy=h*j/3;box(x+w*inset,yy,z+d*inset,ww,h/3,dd,stone,2);box(x+w*inset-.025,yy+h/3-.055,z+d*inset-.025,ww+.05,.065,dd+.05,trim,12);}
  roof(x+w*.26,z+d*.26,w*.48,d*.48,h,2);
 }else if(type===3){
  const wing=w*.27,bar=d*.25,back=h*.92;
  box(x,0,z,wing,h,d,stone,2);box(x+w-wing,0,z,wing,h,d,stone,2);box(x+wing,0,z,w-wing*2,back,bar,stone,2);box(x+wing,0,z+d-bar,w-wing*2,h*.65,bar,stone,2);
  roof(x,z,wing,d,h,0);roof(x+w-wing,z,wing,d,h,0);roof(x+wing,z,w-wing*2,bar,back,0);roof(x+wing,z+d-bar,w-wing*2,bar,h*.65,0);
  // The open central court is actual empty space, with a planted floor.
  box(x+wing,.04,z+bar,w-wing*2,.035,d-bar*2,[.22,.30,.16],5);
  if(!far){m.material=5;m.sphere(x+w*.5,.32,z+d*.5,w*.15,.28,d*.14,[.16,.30,.12],6,3);m.material=0;}
 }else if(type===4){
  box(x,0,z,w,h,d,brick,3);const bays=3,span=d/bays,rise=Math.min(.24,h*.22);m.kind=1;
  for(let j=0;j<bays;j++){const zz=z+j*span;m.material=14;m.face([x,h,zz],[x+w,h,zz],[x+w,h+rise,zz+span*.76],[x,h+rise,zz+span*.76],copper,[0,.86,-.51]);m.material=1;m.face([x,h+rise,zz+span*.76],[x+w,h+rise,zz+span*.76],[x+w,h,zz+span],[x,h,zz+span],glass,[0,.55,.84]);m.material=3;m.face([x,h,zz],[x,h,zz+span],[x,h+rise,zz+span*.76],[x,h+rise,zz+span*.76],brick,[-1,0,0]);m.face([x+w,h,zz+span],[x+w,h,zz],[x+w,h+rise,zz+span*.76],[x+w,h+rise,zz+span*.76],brick,[1,0,0]);}
  m.kind=0;if(!far){box(x+w*.12,0,z+d*.85,w*.15,h+.32,d*.12,brick,3);box(x+w*.10,h+.29,z+d*.83,w*.19,.045,d*.16,trim,12);}
 }else if(type===5){
  box(x,0,z,w,h,d,brick,3);box(x-.018,h-.07,z-.018,w+.036,.09,d+.036,trim,12);pitchedRoof(m,x,z,w,d,h,r,far,true);
  if(!far)for(let j=0;j<3;j++)box(x+w*j/2-.014,.12,z-.018,.035,Math.max(.1,h-.18),.048,trim,12);
 }else if(type===6){
  box(x+w*.05,0,z+d*.08,w*.90,h,d*.84,stone,2);
  const floors=Math.max(2,Math.min(far?5:9,Math.floor(h/.38))),fh=h/floors;
  for(let j=1;j<=floors;j++){const yy=j*fh-.05;box(x,yy,z,w,.045,d,trim,12);if(!far&&j<floors){box(x,yy+.04,z,w,.07,.025,dark,12);box(x,yy+.04,z+d-.025,w,.07,.025,dark,12);}}
  if(!far){box(x,0,z,.045,h,d,trim,12);box(x+w-.045,0,z,.045,h,d,trim,12);}
  roof(x,z,w,d,h,1);
 }else if(type===7){
  for(let j=0;j<3;j++){const zz=z+d*j*.19,dd=d*(1-j*.19),yy=h*j/3;box(x,yy,zz,w,h/3,dd,stone,2);box(x-.02,yy+h/3-.04,zz-.02,w+.04,.055,dd+.04,trim,12);
   if(j<2){box(x+w*.08,yy+h/3,zz+.035,w*.84,.065,d*.105,[.23,.34,.16],5);if(!far)box(x+w*.08,yy+h/3,zz+.022,w*.84,.052,.025,trim,12);}}
  roof(x,z+d*.38,w,d*.62,h,1);
 }else if(type===8){
  box(x,0,z,w*.36,h,d,glass,1);box(x+w*.64,0,z,w*.36,h*.84,d,glass,1);box(x+w*.34,h*.55,z+d*.25,w*.32,Math.min(.22,h*.18),d*.50,stone,2);
  if(!far){box(x+w*.02,0,z-.018,.035,h,.05,trim,8);box(x+w*.95,0,z-.018,.035,h*.84,.05,trim,8);}
  roof(x,z,w*.36,d,h,0);roof(x+w*.64,z,w*.36,d,h*.84,0);
 }else if(type===9){
  // Stepped garden tower: each setback becomes a planted terrace.
  const tiers=3+Math.floor(r()*2);let xx=x,yy=0,zz=z,ww=w,dd=d;
  for(let j=0;j<tiers;j++){
   const th=j===0?h*.44:(h-yy)/(tiers-j);
   box(xx,yy,zz,ww,th,dd,j%2?glass:stone,j%2?1:2);
   if(j<tiers-1){
    const ix=ww*(.11+r()*.09),iz=dd*(.11+r()*.09);
    if(!far){box(xx+.14,yy+th,zz+.14,Math.max(ww-.28,.15),.10,Math.max(dd-.28,.15),[.30,.40,.26],4);
     if(ww>1&&dd>1){m.material=5;m.sphere(xx+ww*.5,yy+th+.28,zz+dd*.5,Math.min(ww,dd)*.10,.24,Math.min(ww,dd)*.10,[.17,.30,.12],6,3);m.material=0;}}
    xx+=ix*.5;zz+=iz*.5;ww-=ix;dd-=iz;yy+=th;
    if(ww<.5||dd<.5)break;
   }else yy+=th;
  }
  if(!far)box(xx+ww*.32,yy,zz+dd*.32,Math.max(ww*.36,.24),.42,Math.max(dd*.36,.24),trim,8);
 }else if(type===10){
  // Grand courtyard block: four wings around a planted court.
  const wh=h*.72,cw=w*.38,cd=d*.38,cx0=x+(w-cw)/2,cz0=z+(d-cd)/2;
  box(x,0,z,cx0-x,wh,d,stone,2);box(cx0+cw,0,z,x+w-(cx0+cw),wh,d,stone,2);
  box(cx0,0,z,cw,cz0-z,wh,brick,3);box(cx0,0,cz0+cd,cw,z+d-(cz0+cd),wh,brick,3);
  box(cx0,.03,cz0,cw,.09,cd,[.30,.40,.26],4);
  if(!far){
   for(let k=0;k<3;k++){m.material=5;m.sphere(cx0+cw*(.25+.25*k),.34,cz0+cd*.5,.15,.26,.15,[.16,.30,.12],6,3);m.material=0;}
   for(const[px,pz]of[[x,z],[x+w-.44,z],[x,z+d-.44],[x+w-.44,z+d-.44]])box(px,wh,pz,.44,.36,.44,trim,8);
  }
  roof(x,z,cx0-x,d,wh,0);roof(cx0+cw,z,x+w-(cx0+cw),d,wh,0);
 }else if(type===11){
  // Wavy atelier: soft sinusoidal slabs over a sharp stone base.
  const slabs=6,ph=h*.16;
  box(x,0,z,w,ph,d,stone,2);
  for(let j=0;j<slabs;j++){
   const sy=ph+j/slabs*(h-ph),sh=(h-ph)/slabs;
   const ox=Math.sin(j*1.35+r()*.6)*w*.085,oz=Math.cos(j*.95)*d*.085;
   box(x+w*.07+ox,sy,z+d*.07+oz,w*.86,sh,d*.86,j%2?glass:color(glass,.82),1);
  }
  if(!far)box(x+w*.38,h,z+d*.38,w*.24,.34,d*.24,trim,8);
 }else if(type===12){
  // Canal warehouse: long brick shed, sawtooth roof, loading doors.
  const wh=Math.min(h,1.5);
  box(x,0,z,w,wh,d,brick,3);
  const teeth=3;m.kind=1;
  for(let k=0;k<teeth;k++){const tx=x+w*k/teeth,tw=w/teeth;
   m.material=14;m.face([tx,wh,z],[tx+tw,wh,z],[tx+tw,wh+.5,z+d*.7],[tx,wh+.5,z+d*.7],copper,[0,.83,-.55]);
   m.material=1;m.face([tx,wh+.5,z+d*.7],[tx+tw,wh+.5,z+d*.7],[tx+tw,wh,z+d],[tx,wh,z+d],glass,[0,.55,.83]);
   m.material=3;m.face([tx,wh,z],[tx,wh,z+d],[tx,wh+.5,z+d*.7],[tx,wh+.5,z+d*.7],brick,[-1,0,0]);
   m.face([tx+tw,wh,z+d],[tx+tw,wh,z],[tx+tw,wh+.5,z+d*.7],[tx+tw,wh+.5,z+d*.7],brick,[1,0,0]);
  }
  m.material=0;m.kind=0;
  if(!far){
   for(let k=0;k<3;k++)box(x+w*(.12+.31*k),.03,z+d-.05,w*.17,wh*.5,.07,[.15,.13,.11],2);
   box(x+w*.5-.05,wh,z+d*.32,.10,wh*.55,.10,trim,8);
  }
 }else if(type===13){
  // Needle spire: tapered stone tiers under a slender crown and beacon.
  const tiers=4;let yy=0,ww=w,dd=d,xx=x,zz=z;
  for(let j=0;j<tiers;j++){const th=h*.20;box(xx,yy,zz,ww,th,dd,stone,2);const nx=ww*.24,nz=dd*.24;xx+=nx/2;zz+=nz/2;ww-=nx;dd-=nz;yy+=th;}
  const cxp=xx+ww/2,czp=zz+dd/2;
  m.material=8;m.cylinder(cxp,yy,czp,Math.max(ww*.30,.10),Math.max(dd*.30,.10),h*.30,trim,10,.18);m.material=0;
  if(!far){const mm=m.material;m.material=9;m.sphere(cxp,yy+h*.30,czp,.085,.085,.085,[1.,.55,.20],8,4);m.material=mm;}
 }else if(type===14){
  // Dome pavilion: colonnade podium under a copper dome.
  const ph=Math.min(h*.5,1.1);
  box(x,0,z,w,ph,d,stone,2);
  if(!far)for(let k=0;k<6;k++)box(x+w*(.07+.165*k),ph,z+d*.05,.11,h*.34,.11,trim,8);
  m.material=14;m.dome(x+w/2,ph+(far?0:h*.34),z+d/2,w*.30,Math.min(h*.40,1.6),d*.30,color(copper,1.06),16,5);m.material=0;
 }else if(type===15){
  // Green-roof podium: the LAWN step as architecture.
  const ph=Math.min(h,1.5);
  box(x,0,z,w,ph,d,stone,2);
  box(x+w*.06,ph,z+d*.06,w*.88,.09,d*.88,[.31,.41,.27],4);
  if(!far){
   for(let k=0;k<4;k++){m.material=5;m.sphere(x+w*(.18+.21*k),ph+.30,z+d*(.30+.13*(k%3)),.15,.26,.15,[.16,.30,.12],6,3);m.material=0;}
   box(x+w*.40,ph+.09,z+d*.40,w*.20,.30,d*.20,glass,1);
   box(x+w*.44,ph+.39,z+d*.44,w*.12,.06,d*.12,trim,8);
  }
 }else if(type===16){
  // Worker C: ziggurat — broad stepped pyramid with a crown shrine. Strong stepped silhouette.
  const flagship=hash(c.layout+':wc-flagship:'+l.id)%9===0;
  const steps=4+Math.floor(r()*3);let yy=0,ww=w,dd=d,xx=x,zz=z;
  for(let j=0;j<steps;j++){
   const th=h/steps;
   box(xx,yy,zz,ww,th,dd,j%2?color(stone,.93):stone,2);
   box(xx-.02,yy+th-.05,zz-.02,ww+.04,.06,dd+.04,flagship?copper:trim,flagship?31:12);
   const nx=ww*(.15+r()*.10),nz=dd*(.15+r()*.10);
   xx+=nx*(.25+r()*.5);zz+=nz*(.25+r()*.5);ww-=nx;dd-=nz;yy+=th;
   if(ww<.45||dd<.45)break;
  }
  if(!far)box(xx+ww*.32,yy,zz+dd*.32,Math.max(ww*.36,.18),Math.min(.5,h*.14),Math.max(dd*.36,.18),trim,8);
  roof(xx,zz,Math.max(ww,.3),Math.max(dd,.3),yy,flagship?1:2);
 }else if(type===17){
  // Worker C: twin towers joined by a skybridge, with a glass atrium between them.
  const flagship=hash(c.layout+':wc-flagship:'+l.id)%9===0;
  const tw=w*.36,gapx=x+tw,gapw=w-tw*2;
  box(x,0,z,tw,h,d,flagship?glass:stone,flagship?1:2);
  box(x+w-tw,0,z,tw,h*.84,d,flagship?glass:stone,flagship?1:2);
  box(x+tw-.03,h*(.52+r()*.18),z+d*.22,gapw+.06,Math.min(.30,h*.12),d*.56,trim,8);
  if(!far){
   box(x+tw*.35,h,z+d*.38,tw*.30,.32,d*.24,trim,8);
   box(x+w-tw*.65,h*.84,z+d*.38,tw*.30,.32,d*.24,trim,8);
  }
  roof(x,z,tw,d,h,0);roof(x+w-tw,z,tw,d,h*.84,0);
  if(!far&&gapw>.4){
   // Translucent glass atrium walls (mat 25); simple interior baked direct (mat 26),
   // visible up close through the dithered glass.
   box(gapx+.02,0,z+d*.16,gapw-.04,.55,d*.68,glass,25);
   const sv=m.solids;m.solids=null;
   box(gapx+.07,.03,z+d*.21,gapw-.14,.05,d*.58,[.52,.50,.46],26);
   box(gapx+.07,.30,z+d*.21,gapw-.14,.05,d*.58,[.52,.50,.46],26);
   box(gapx+gapw*.32,.08,z+d*.42,gapw*.36,.14,.14,[.40,.30,.20],26);
   box(gapx+.07,.50,z+d*.21,gapw-.14,.035,d*.58,[1.,.85,.55],9);
   m.solids=sv;
  }
 }else if(type===18){
  // Worker C: drum tower — stacked stone cylinder with glass bands and ring cornices.
  const flagship=hash(c.layout+':wc-flagship:'+l.id)%9===0;
  const cxp=x+w/2,czp=z+d/2,rad=Math.min(w,d)*.40,mm0=m.material;
  m.material=2;m.cylinder(cxp,0,czp,rad,rad,h*.9,stone,18,1);m.material=mm0;
  for(let j=1;j<=3;j++){
   const yy2=h*.9*j/4;
   m.material=12;m.cylinder(cxp,yy2-.03,czp,rad*1.06,rad*1.06,.07,trim,18);m.material=mm0;
   m.material=flagship?25:1;m.cylinder(cxp,yy2+.04,czp,rad*1.015,rad*1.015,Math.min(.22,h*.1),glass,18);m.material=mm0;
  }
  m.material=30;m.cylinder(cxp,h*.9,czp,rad*.72,rad*.72,Math.min(.5,h*.12),color(trim,.9),14,.6);m.material=mm0;
  if(!far){m.material=27;m.sphere(cxp,h*.9+Math.min(.5,h*.12)+.06,czp,.05,.06,.05,[1,.12,.07],8,4);m.material=mm0;}
 }else if(type===19){
  // Worker C: thin slab tower with a protruding glass lobby (simple interior inside).
  const flagship=hash(c.layout+':wc-flagship:'+l.id)%9===0;
  const sw=Math.max(w*.30,.34),sx=x+(w-sw)/2;
  box(sx,0,z,sw,h,d,flagship?glass:stone,flagship?1:2);
  if(!far)for(let j=1;j<=4;j++){const yy3=h*j/5;box(sx-.015,yy3-.025,z-.015,sw+.03,.05,d+.03,trim,12);}
  box(sx-.03,h,z-.03,sw+.06,.14,d+.06,trim,12);
  if(!far){
   const lw=Math.min(sw*1.6,1.1),lx=sx+(sw-lw)/2;
   box(lx,0,z+d-.02,lw,.5,.55,glass,25);
   const sv=m.solids;m.solids=null;
   box(lx+.06,.03,z+d+.03,lw-.12,.05,.45,[.52,.50,.46],26);
   box(lx+lw*.32,.08,z+d+.16,lw*.36,.13,.14,[.40,.30,.20],26);
   box(lx+.06,.44,z+d+.03,lw-.12,.03,.45,[1.,.85,.55],9);
   m.solids=sv;
  }
 }else if(type===20){
  // Worker C: corner-notch tower — L-shaped massing with a recessed glass slot.
  const flagship=hash(c.layout+':wc-flagship:'+l.id)%9===0;
  box(x,0,z,w,h*.92,d*.60,stone,2);
  box(x,0,z+d*.60,w*.60,h,d*.40,flagship?glass:brick,flagship?1:3);
  box(x+w*.60+.02,0,z+d*.62,w*.38-.04,h*.80,d*.36,glass,1);
  if(!far){
   box(x+w*.60-.03,0,z+d*.60-.03,.06,h*.80,.06,trim,12);
   for(let j=1;j<=3;j++){const yy4=h*.92*j/4;box(x-.015,yy4-.02,z-.015,w+.03,.045,d*.60+.03,trim,12);}
  }
  roof(x,z,w,d*.60,h*.92,1);roof(x,z+d*.60,w*.60,d*.40,h,0);
 }else if(type===21){
  // Worker C: slender spire stack — ring terraces climbing a thin shaft, beacon tip.
  const flagship=hash(c.layout+':wc-flagship:'+l.id)%9===0;
  const cxp2=x+w/2,czp2=z+d/2,rad2=Math.min(w,d)*.20,ph=Math.min(h*.16,.7),mm0b=m.material;
  box(x,0,z,w,ph,d,stone,2);
  const floors=5,fh=(h-ph)/floors;
  for(let j=0;j<floors;j++){
   const yy5=ph+j*fh,rr2=rad2*(1-j*.09);
   m.material=j%2?1:30;m.cylinder(cxp2,yy5,czp2,rr2,rr2,fh,j%2?glass:color(trim,.92),14);m.material=mm0b;
   m.material=flagship?31:12;m.cylinder(cxp2,yy5+fh-.045,czp2,rr2*1.14,rr2*1.14,.06,flagship?copper:trim,14);m.material=mm0b;
  }
  m.material=8;m.cylinder(cxp2,h,czp2,.055,.055,h*.20,trim,10,.3);m.material=mm0b;
  if(!far){m.material=27;m.sphere(cxp2,h+h*.20+.05,czp2,.05,.06,.05,[1,.12,.07],8,4);m.material=mm0b;}
 }else{
  box(x+w*.22,0,z,w*.56,h,d,stone,2);box(x,h*.12,z+d*.27,w,h*.76,d*.46,glass,1);
  box(x+w*.20,h-.065,z-.02,w*.60,.085,d+.04,trim,12);roof(x+w*.22,z,w*.56,d,h,2);
 }
 // Finished street frontage belongs to the building rather than floating scene decoration.
 if(!far&&type!==3&&h>.6){const width=w*.40,px=x+w*.30;
  box(px,.045,z-.024,width,Math.min(.24,h*.28),.029,[.06,.13,.16],1);
  box(px-.035,Math.min(.29,h*.33),z-.11,width+.07,.027,.14,type===4||type===5?clay:copper,14);
  if(type===4||type===5){box(x+w*.08,.015,z-.10,w*.17,.06,.12,[.30,.34,.25],12);box(x+w*.10,.075,z-.085,w*.13,.055,.09,[.17,.30,.12],5);}
 }
 m.material=0;m.kind=0;m.anchor=0;
}
// Cheap far-field massing: the city continues toward the horizon and dissolves into haze.
function farFieldBlock(m,l,s,c,stone,brick,glass){
 const{x,z,width:w,depth:d,height:h}=l;
 m.anchor=0;
 const rr=rng(hash(c.detail+':far:'+l.id));
 const tiers=2+Math.floor(rr()*2);
 let xx=x,yy=0,zz=z,ww=w,dd=d;
 for(let j=0;j<tiers;j++){
  const th=j===0?h*.52:(h-yy)/Math.max(1,tiers-j);
  const t=j===0?stone:(rr()<.45?glass:(rr()<.5?brick:stone));
  m.box(xx,yy,zz,ww,th,dd,t,j===0?2:1);
  const ix=ww*(.12+rr()*.12),iz=dd*(.12+rr()*.12);
  xx+=ix*rr();zz+=iz*rr();ww-=ix;dd-=iz;yy+=th;
  if(ww<.4||dd<.4)break;
 }
 m.box(xx,yy,zz,Math.max(ww,.3),.07,Math.max(dd,.3),[.27,.29,.28],0);
}
// Clock tower landmark: stone shaft, glowing clock stage, spire.
function clockTower(m,l,s,c,r){
 const{x,z,width:w,depth:d,height:h}=l;
 const stone=color(s.palette[0],.95),trim=color(s.palette[3]||[.6,.58,.5],1.02);
 m.box(x+w*.28,0,z+d*.28,w*.44,h,d*.44,stone,2);
 const cy=h*.74;
 m.box(x+w*.22,cy,z+d*.22,w*.56,h*.18,d*.56,trim,8);
 const mm=m.material;m.material=9;
 const fc=[1.,.85,.55],fh=h*.10;
 m.box(x+w*.30,cy+h*.04,z-.015,w*.40,fh,.03,fc);
 m.box(x+w*.30,cy+h*.04,z+d-.015,w*.40,fh,.03,fc);
 m.box(x-.015,cy+h*.04,z+d*.30,.03,fh,d*.40,fc);
 m.box(x+w-.015,cy+h*.04,z+d*.30,.03,fh,d*.40,fc);
 m.material=8;
 m.cylinder(x+w/2,cy+h*.18,z+d/2,Math.max(w*.14,.12),Math.max(d*.14,.12),h*.22,trim,10,.15);
 m.material=mm;
}
// Sky life: bird flocks, a drifting blimp, airliners and the formation flyby.
// Everything is baked once per world; all motion happens in the vertex shader as a
// pure function of the seed-baked values and uTime, so live view and export agree.
// Billboard ad atlas: 8 goofy canvas ads (2x4), baked once per world from the seed.
const BB_ADS=[
 ['SEAGULL INSURANCE','CHEAPER THAN BREAD','CALL 555-0199','#2b7fd4','#ffffff'],
 ['CLOUD STORAGE','actual clouds. 100% rainproof.','no servers were harmed','#7a5fd0','#ffffff'],
 ['CANAL WATER','ENERGY DRINK','tastes like victory* (*and canal)','#0e8f7a','#ffffff'],
 ['BLIMP PARKING','$5/HR','no refunds if it drifts','#e07b1f','#141414'],
 ['VISIT THE MOON','now with 30% less cheese','bookings: pigeon post','#101c3a','#ffd23f'],
 ['PIGEON POST','faster than email.','messier too.','#5a6b73','#ffffff'],
 ['GONDOLA UBER','surge pricing during floods','*rowers not included','#c23b3b','#ffffff'],
 ['FOR RENT','great view of','other apartments','#3f7a3f','#ffffff']];
function bakeBillboardAtlas(seed){
 const cv=document.createElement('canvas');cv.width=1024;cv.height=1024;const g=cv.getContext('2d');
 BB_ADS.forEach((ad,i)=>{
  const ox=(i%2)*512,oy=Math.floor(i/2)*256;
  g.fillStyle=ad[3];g.fillRect(ox,oy,512,256);
  g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=8;g.strokeRect(ox+10,oy+10,492,236);
  g.fillStyle=ad[4];g.textAlign='center';
  g.font='900 60px system-ui,sans-serif';g.fillText(ad[0],ox+256,oy+92,470);
  g.font='700 42px system-ui,sans-serif';g.fillText(ad[1],ox+256,oy+158,470);
  g.font='400 30px system-ui,sans-serif';g.fillText(ad[2],ox+256,oy+208,470);
 });
 const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 return t;
}
// ================= Worker C: buildings / signage / rooftops / radio / smoke / glass / gargoyles / flags / graffiti =================
// Business theming: seeded goofy + normal businesses, each with brand colors.
// Signage goes on small facade plates (mat 33), never the whole facade.
const WC_BIZ=[
 ['BIG CANAL COFFEE','#1f6f4a','#f5efe0'],['SEAGULL & SONS','#14324a','#ffd23f'],
 ['PIGEON POST EXPRESS','#5a6b73','#ffffff'],['GONDOLA UBER','#c23b3b','#ffffff'],
 ['CLOUD STORAGE','#7a5fd0','#ffffff'],['HARBOR & FINCH','#2b2b30','#e8dcc0'],
 ['MERIDIAN LOFTS','#0e8f7a','#ffffff'],['THE DRIFTING DOCK','#8a5a2b','#ffe9c4'],
 ['MOON CHEESE IMPORTS','#101c3a','#ffd23f'],['JUNIPER & CO.','#3f7a3f','#ffffff'],
 ['SIR ROWS-A-LOT','#7a2e2e','#ffd9a0'],['TIDE LAUNDRY','#2b7fd4','#ffffff'],
 ['COPPERLINE','#4a3220','#e0a458'],['NORTHLIGHT STUDIO','#d8d8d8','#1a1a1a'],
 ['BLIMP PARKING LTD','#e07b1f','#141414'],['BREAD & SEAGULLS','#c8a24a','#3a2a10']];
function wcCanvasTexture(cv){
 const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 return t;
}
function bakeSignageAtlas(seed){
 const cv=document.createElement('canvas');cv.width=1024;cv.height=1024;const g=cv.getContext('2d');
 WC_BIZ.forEach((b,i)=>{
  const ox=(i%4)*256,oy=Math.floor(i/4)*256;
  g.fillStyle=b[1];g.fillRect(ox,oy,256,256);
  g.strokeStyle=b[2];g.lineWidth=6;g.strokeRect(ox+12,oy+12,232,232);
  g.fillStyle=b[2];g.textAlign='center';g.textBaseline='middle';
  let fs=46;g.font='900 '+fs+'px system-ui,sans-serif';
  while(g.measureText(b[0]).width>200&&fs>16){fs-=4;g.font='900 '+fs+'px system-ui,sans-serif';}
  const words=b[0].split(' ');
  if(words.length>2&&fs<=30){
   const mid=Math.ceil(words.length/2);
   g.fillText(words.slice(0,mid).join(' '),ox+128,oy+106,200);
   g.fillText(words.slice(mid).join(' '),ox+128,oy+152,200);
  }else g.fillText(b[0],ox+128,oy+128,200);
  g.font='400 20px system-ui,sans-serif';g.fillText('· EST. CANAL ·',ox+128,oy+198);
 });
 return wcCanvasTexture(cv);
}
const WC_TAGS=['ZEP','MIRA','KNOX','VELA'];
function bakeGraffitiAtlas(seed){
 const cv=document.createElement('canvas');cv.width=256;cv.height=256;const g=cv.getContext('2d');
 const r=rng(hash(seed+':wc-graffiti'));
 const cols=['#ff4fd8','#43f5ff','#c6ff4f','#ff9a3d'];
 WC_TAGS.forEach((tag,i)=>{
  const ox=(i%2)*128,oy=Math.floor(i/2)*128;
  g.save();g.translate(ox+64,oy+64);g.rotate((r()-.5)*.5);
  g.font='900 44px system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';
  g.lineWidth=7;g.strokeStyle='#101010';g.strokeText(tag,0,0);
  g.fillStyle=cols[i];g.fillText(tag,0,0);
  for(let k=0;k<4;k++){g.strokeStyle=cols[i];g.lineWidth=3;g.beginPath();
   const sx=(r()-.5)*90;g.moveTo(sx,-30-r()*20);
   g.quadraticCurveTo(sx+(r()-.5)*30,10,sx+(r()-.5)*20,44);g.stroke();}
  g.restore();
 });
 return wcCanvasTexture(cv);
}
function bakeFlagTexture(){
 const cv=document.createElement('canvas');cv.width=96;cv.height=64;const g=cv.getContext('2d');
 for(let i=0;i<13;i++){g.fillStyle=i%2?'#f4f4f4':'#b22234';g.fillRect(0,Math.floor(i*64/13),96,Math.ceil(64/13)+1);}
 g.fillStyle='#3c3b6e';g.fillRect(0,0,38,34);
 g.fillStyle='#fff';for(let ry=0;ry<5;ry++)for(let rx=0;rx<6;rx++){g.beginPath();g.arc(3.5+rx*6,3.6+ry*6.2,1.6,0,7);g.fill();}
 return wcCanvasTexture(cv);
}
// Rooftop kit: sparse, seeded, instanced-style merged boxes.
function wcBeacon(m,x,y,z){const mm=m.material;m.material=27;m.sphere(x,y,z,.05,.06,.05,[1,.12,.07],8,4);m.material=mm;}
function wcWaterTower(m,x,y,z,r){
 const leg=[.30,.24,.16];
 for(const sx of[-1,1])for(const sz of[-1,1])m.box(x+sx*.13-.02,y,z+sz*.13-.02,.04,.55,.04,leg,15);
 m.box(x-.16,y+.55,z-.16,.32,.30,.32,[.55,.42,.30],3);
 const mm=m.material;m.material=14;m.cylinder(x,y+.85,z,.19,.19,.12,[.48,.33,.24],10,.25);m.material=mm;
}
function wcAntenna(m,x,y,z,h,r){
 m.box(x-.016,y,z-.016,.032,h,.032,[.36,.37,.39],8);
 const n=Math.max(2,Math.floor(h/.5));
 for(let j=1;j<=n;j++)m.box(x-.14,y+h*j/n-.012,z-.012,.28,.024,.024,[.40,.41,.43],8);
 wcBeacon(m,x,y+h+.03,z);
}
function wcDish(m,x,y,z,s,r){
 m.box(x-.02,y,z-.02,.04,.34,.04,[.42,.43,.45],8);
 const mm=m.material;m.material=8;m.sphere(x,y+.40,z,s,s*.40,s,[.80,.82,.84],10,5);m.material=mm;
 m.box(x-.008,y+.30,z-.008,.016,.16,.016,[.5,.5,.52],8);
}
function wcRoofDoor(m,x,y,z,r){
 const w2=.22+r()*.10;
 m.box(x,y,z,w2,.30,w2*.8,[.58,.55,.48],2);
 m.box(x+w2*.28,y+.02,z+w2*.8+.004,w2*.44,.22,.015,[.20,.22,.20],3);
 m.box(x-.015,y+.30,z-.015,w2+.03,.03,w2*.8+.03,[.40,.38,.34],12);
}
function wcVent(m,x,y,z,r){
 const h2=.18+r()*.22;
 m.box(x-.05,y,z-.05,.10,h2,.10,[.50,.52,.50],8);
 m.box(x-.07,y+h2,z-.07,.14,.035,.14,[.44,.46,.44],8);
}
function wcSkylight(m,x,y,z,w,d,r){
 m.box(x,y,z,w,.10,d,[.55,.57,.55],12);
 m.box(x+.03,y+.10,z+.03,w-.06,.07,d-.06,[.35,.55,.60],18);
}
// Gargoyles: seeded part combinations (pose, wing angle, head tilt, scale) —
// no two buildings share the same gargoyle.
function wcGargoyle(m,x,y,z,r){
 const s=.8+r()*.5,gc=[.40+r()*.06,.38+r()*.05,.34];
 const pose=r(),wing=r(),tilt=r();
 const lean=(pose<.35?.02:(pose<.7?.07:.11))*(0.7+tilt*.6);
 const bh=(pose<.35?.10:.15)*s;
 m.box(x-.05*s,y,z-.05*s,.10*s,.06*s,.10*s,[.50,.47,.42],12);
 m.box(x-.035*s+lean*.5,y+.06*s,z-.028*s,.07*s,bh,.056*s,gc,2);
 if(pose<.35){
  m.box(x-.058*s,y+.06*s,z-.02*s,.026*s,.09*s,.05*s,gc,2);
  m.box(x+.032*s,y+.06*s,z-.02*s,.026*s,.09*s,.05*s,gc,2);
 }
 const hy=y+.06*s+bh;
 m.box(x-.026*s+lean,hy,z-.024*s,.052*s,.055*s,.048*s,gc,2);
 m.box(x-.018*s+lean,hy-.012*s,z-.052*s,.036*s,.022*s,.030*s,gc,2);
 const wa=(wing-.5)*.14;
 for(let sgi=0;sgi<3;sgi++)for(const sd of[-1,1])
  m.box(x+sd*(.035+sgi*.042)*s-.02*s,hy-.02*s+sgi*wa,z-.012*s,.04*s,Math.max(.03,(.09-sgi*.016)*s),.024*s,gc,2);
 m.box(x-.012*s+lean*.2,hy-.05*s,z+.026*s,.024*s,.03*s,.06*s,gc,2);
}
// Tiny American flag: pole (static) + waving quad (kind 20 / mat 32).
function wcFlag(m,x,y,z,r){
 m.box(x-.012,y,z-.012,.024,.55,.024,[.55,.56,.58],8);
 const fw=.24,fh=.15,fy=y+.55-fh;
 const mm=m.material,kk=m.kind,pp=m.phase,rrt=m.route;
 m.material=32;m.kind=20;m.phase=r()*100;m.route=[0,0,0,0];
 const n=[0,0,1],c=[1,1,1];
 const V=(px,py,pz,u,v,nn)=>m.vertex([px,py,pz],nn,c,[u,v]);
 const b0=m.data.length/23;
 V(x,fy,z,0,0,n);V(x+fw,fy,z,1,0,n);V(x+fw,fy+fh,z,1,1,n);V(x,fy+fh,z,0,1,n);
 m.indices.push(b0,b0+1,b0+2,b0,b0+2,b0+3);
 const b1=m.data.length/23;
 V(x,fy,z,0,0,n);V(x,fy+fh,z,0,1,n);V(x+fw,fy+fh,z,1,1,n);V(x+fw,fy,z,1,0,n);
 m.indices.push(b1,b1+3,b1+2,b1,b1+2,b1+1);
 m.material=mm;m.kind=kk;m.phase=pp;m.route=rrt;
}
// Sparse lattice-ish radio tower with blinking red beacons.
function wcRadioTower(m,x,z,h,r){
 const base=.55,top=.13,levels=6,steel=[.34,.36,.38];
 for(let j=0;j<levels;j++){
  const y0=j/levels*h,y1=(j+1)/levels*h;
  const r0=base+(top-base)*j/levels,r1=base+(top-base)*(j+1)/levels;
  for(const sx of[-1,1])for(const sz of[-1,1])m.box(x+sx*r0-.03,y0,z+sz*r0-.03,.06,y1-y0+.02,.06,steel,8);
  m.box(x-r1,y1-.025,z-r1,r1*2,.05,.05,steel,8);
  m.box(x-r1,y1-.025,z+r1-.05,r1*2,.05,.05,steel,8);
  m.box(x-r1,y1-.025,z-r1,.05,.05,r1*2,steel,8);
  m.box(x+r1-.05,y1-.025,z-r1,.05,.05,r1*2,steel,8);
 }
 m.box(x-.045,h,z-.045,.09,1.3,.09,steel,8);
 wcBeacon(m,x,h+.55,z);wcBeacon(m,x,h+1.15,z);
 m.box(x-.35,0,z-.35,.7,.55,.7,[.46,.44,.40],2);
 m.box(x-.35,.55,z-.35,.74,.05,.74,[.30,.32,.30],12);
}
// Light smoke from a stack: crossed quads rising on kind 19 / mat 28.
function wcSmokeStack(m,x,y,z,r){
 m.box(x-.045,y,z-.045,.09,.55,.09,[.48,.30,.22],3);
 m.box(x-.06,y+.55,z-.06,.12,.05,.12,[.30,.20,.16],3);
 const bx=x,by=y+.62,bz=z,NP=7;
 const mm=m.material,kk=m.kind,pp=m.phase;
 m.material=28;m.kind=19;
 const c=[1,1,1];
 const Q=(px,py,pz,u,v,nn)=>m.vertex([px,py,pz],nn,c,[u,v]);
 for(let k=0;k<NP;k++){
  const jx=(r()-.5)*.14,jz=(r()-.5)*.14,s=.13+r()*.10;
  m.phase=r()*100;m.route=[bx+jx,bz+jz,.9+r()*.5,.14+r()*.10];
  const v0=m.data.length/23;
  Q(bx+jx-s,by,bz+jz,0,0,[0,0,1]);Q(bx+jx+s,by,bz+jz,1,0,[0,0,1]);
  Q(bx+jx+s,by+s,bz+jz,1,1,[0,0,1]);Q(bx+jx-s,by+s,bz+jz,0,1,[0,0,1]);
  m.indices.push(v0,v0+1,v0+2,v0,v0+2,v0+3,v0,v0+3,v0+2,v0,v0+2,v0+1);
  const v1=m.data.length/23;
  Q(bx+jx,by,bz+jz-s,0,0,[1,0,0]);Q(bx+jx,by,bz+jz+s,1,0,[1,0,0]);
  Q(bx+jx,by+s,bz+jz+s,1,1,[1,0,0]);Q(bx+jx,by+s,bz+jz-s,0,1,[1,0,0]);
  m.indices.push(v1,v1+1,v1+2,v1,v1+2,v1+3,v1,v1+3,v1+2,v1,v1+2,v1+1);
 }
 m.material=mm;m.kind=kk;m.phase=pp;m.route=[0,0,0,0];
}
// Small facade sign plate from the signage atlas (mat 33). vTex selects the cell.
function wcSignQuad(m,cx,cy,z,w2,h2,biz,r){
 const col=biz%4,row=Math.floor(biz/4)%4;
 const uu0=col*.25,uu1=uu0+.25,vv0=1-(row+1)*.25,vv1=1-row*.25;
 const mm=m.material,kk=m.kind,pp=m.phase,rrt=m.route;
 m.material=33;m.kind=0;m.phase=r()*100;m.route=[0,0,0,0];
 const b0=m.data.length/23,n=[0,0,1],c=[1,1,1];
 m.vertex([cx-w2/2,cy-h2/2,z],n,c,[uu0,vv0]);m.vertex([cx+w2/2,cy-h2/2,z],n,c,[uu1,vv0]);
 m.vertex([cx+w2/2,cy+h2/2,z],n,c,[uu1,vv1]);m.vertex([cx-w2/2,cy+h2/2,z],n,c,[uu0,vv1]);
 m.indices.push(b0,b0+1,b0+2,b0,b0+2,b0+3);
 m.material=mm;m.kind=kk;m.phase=pp;m.route=rrt;
}
// Tiny graffiti decal from the tag atlas (mat 29).
function wcGrafQuad(m,cx,cy,z,w2,h2,tag,r){
 const uu0=(tag%2)*.5,uu1=uu0+.5,vv0=1-(Math.floor(tag/2)+1)*.5,vv1=1-Math.floor(tag/2)*.5;
 const mm=m.material,kk=m.kind,pp=m.phase,rrt=m.route;
 m.material=29;m.kind=0;m.phase=r()*100;m.route=[0,0,0,0];
 const b0=m.data.length/23,n=[0,0,1],c=[1,1,1];
 m.vertex([cx-w2/2,cy-h2/2,z],n,c,[uu0,vv0]);m.vertex([cx+w2/2,cy-h2/2,z],n,c,[uu1,vv0]);
 m.vertex([cx+w2/2,cy+h2/2,z],n,c,[uu1,vv1]);m.vertex([cx-w2/2,cy+h2/2,z],n,c,[uu0,vv1]);
 m.indices.push(b0,b0+1,b0+2,b0,b0+2,b0+3);
 m.material=mm;m.kind=kk;m.phase=pp;m.route=rrt;
}
// Flat-roof check for rooftop kit placement (sawtooth/spire/dome/drum roofs opt out).
function wcFlatRoof(c,l){
 if(l.lod===2)return true;
 const t=architecturalType(c,l);
 return t!==4&&t!==9&&t!==11&&t!==12&&t!==13&&t!==14&&t!==18&&t!==21;
}
// Blimp marquee sign: a canvas texture scrolled by render time, editable from the panel.
let blimpSignTex=null,blimpSignCv=null,blimpSignG=null,blimpSignKey='';
function blimpSignTexture(){
 if(!blimpSignTex){
  blimpSignCv=document.createElement('canvas');blimpSignCv.width=1024;blimpSignCv.height=160;
  blimpSignG=blimpSignCv.getContext('2d');
  blimpSignTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,blimpSignTex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 }
 return blimpSignTex;
}
function updateBlimpSign(){
 const tex=blimpSignTexture(),g=blimpSignG,W=1024,H=160;
 const msg=(String(lightUI.blimpMsg||'').trim()||'SEAGULL INSURANCE · CHEAPER THAN BREAD').slice(0,80);
 const unit=msg+'   \u2022   ';
 g.font='700 88px system-ui,sans-serif';
 const tw=Math.max(50,g.measureText(unit).width);
 const off=(elapsed*110)%tw,key=msg+'|'+Math.round(off);
 if(key===blimpSignKey)return;blimpSignKey=key;
 g.fillStyle='#0d1626';g.fillRect(0,0,W,H);
 g.strokeStyle='#ffd23f';g.lineWidth=6;g.strokeRect(9,9,W-18,H-18);
 g.fillStyle='#ffd23f';g.textAlign='left';g.textBaseline='middle';
 for(let x=-off;x<W;x+=tw)g.fillText(unit,x,H/2+2);
 gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,blimpSignCv);
}
// Extra living-world details: billboards, drifting clouds, quay greenery, rooftop
// clutter, awnings and moored boats. All cheap, seeded, and batched into the mesh.
function bakeCityDetails(m,s,c,r){
 const TAU=Math.PI*2;
 m.solids=null;m.turn=0;m.construction=[0,0,0,0];m.material=0;
 // Goofy billboards on taller buildings, each on its own fade schedule (kind 13 / mat 21).
 const lots=s.lots||[]; // Worker C: was c.lots (always empty) — lots live on the city object.
 for(const l of lots){
  if(l.plane!==1||l.lod||!l.exists||l.height<1.6)continue;
  const br=rng(hash(c.layout+':bb:'+l.id));
  if(br()<.62)continue;
  const x=l.x+l.width/2,z=l.z+l.depth+.03,by=Math.min(l.height*.72,2.3);
  const bw=Math.min(1.5,l.width*.75),bh=.7;
  m.material=0;m.kind=0;
  m.box(x-bw/2+.05,0,z-.02,.1,by,.1,[.18,.18,.20],8);
  m.box(x+bw/2-.15,0,z-.02,.1,by,.1,[.18,.18,.20],8);
  m.material=21;m.kind=13;m.phase=br()*100;
  const adRow=Math.floor(br()*4),adCol=Math.floor(br()*2);
  const u0=adCol*.5,u1=u0+.5,v0=1-(adRow+1)*.25,v1=1-adRow*.25;
  const bb=m.data.length/23;
  m.vertex([x-bw/2,by-bh/2,z],[0,0,1],[1,1,1],[u0,v0]);m.vertex([x+bw/2,by-bh/2,z],[0,0,1],[1,1,1],[u1,v0]);
  m.vertex([x+bw/2,by+bh/2,z],[0,0,1],[1,1,1],[u1,v1]);m.vertex([x-bw/2,by+bh/2,z],[0,0,1],[1,1,1],[u0,v1]);
  m.indices.push(bb,bb+1,bb+2,bb,bb+2,bb+3);
  m.route=[0,0,7+br()*6,1]; // aRoute.z = cycle seconds
  m.material=0;m.kind=0;
 }
 // Drifting low-poly cloud clusters (kind 14 / mat 22).
 for(let ci=0;ci<10;ci++){
  const cr2=rng(hash(c.layout+':cloud:'+ci));
  const cx0=-30+cr2()*60,cz0=-30+cr2()*60,cy=9+cr2()*5;
  m.material=22;m.kind=14;m.phase=cr2()*100;
  m.route=[1,0,70+cr2()*20,.5+cr2()*.3];
  const npuff=5+Math.floor(cr2()*3);
  for(let pi=0;pi<npuff;pi++){
   const px=cx0+(cr2()-.5)*6,py=cy+(cr2()-.5)*1.2,pz=cz0+(cr2()-.5)*3;
   m.sphere(px,py,pz,1.1+cr2()*1.3,1.1+cr2()*1.3,.9+cr2()*.7,[1,1,1],10,6);
  }
  m.material=0;m.kind=0;
 }
 // Rooftop clutter + awnings, sharing each building's construction schedule.
 for(const l of lots){
  if(l.plane!==1||l.lod||!l.exists||l.height<1.1)continue;
  const cr3=rng(hash(c.layout+':clutter:'+l.id));
  const x=l.x,z=l.z,w=l.width,d=l.depth;
  m.turn=0;m.construction=[l.birth,l.duration,0,l.height];m.phase=l.phase;m.material=8;m.kind=0;
  if(l.height>1.4&&cr3()<.55){
   m.box(x+w*.18,l.height,z+d*.25,.34,.20,.30,[.52,.52,.48],8);
   if(cr3()<.4)m.box(x+w*.62,l.height,z+d*.60,.32,.32,.50,[.60,.55,.45],8);
  }
  if(cr3()<.35){
   const ax=x+w*.15,az=z+d+.02,aw2=w*.5;
   const acol=cr3()<.5?[.72,.28,.22]:[.24,.44,.66];
   m.face([ax,.55,az],[ax+aw2,.55,az],[ax+aw2-.12,.34,az+.34],[ax-.12,.34,az+.34],acol,[0,.7,.7]);
  }
  m.construction=[0,0,0,0];
 }
 // Canal quays: extra trees, bushes, lamps and moored boats.
 if(s.family===2){
  const tr=rng(hash(c.layout+':quay'));
  for(let i=0;i<60;i++){
   const a=i/60*TAU,rad=3.45+tr()*.7;
   const tx=s.cx+Math.cos(a)*rad*1.15,tz=s.cz+Math.sin(a)*rad*2.2;
   if(cityLand(s,tx,tz)<.25)continue;
   if(tr()<.7)cityTree(m,tx,tz,.45+tr()*.35,tr);
   else{m.material=23;m.sphere(tx,.14,tz,.22,.16,.22,[.22,.38,.18],8,5);m.material=0;}
   if(i%3===0){
    m.box(tx-.03,.02,tz-.03,.06,.8,.06,[.16,.17,.18],8);
    m.material=9;m.sphere(tx,.86,tz,.07,.07,.07,[1.,.75,.35],8,4);m.material=0;
   }
  }
  for(let i=0;i<10;i++){
   const a=tr()*TAU,rad=1.05+tr()*.3;
   const bx=s.cx+Math.cos(a)*rad*1.50,bz=s.cz+Math.sin(a)*rad*2.4;
   if(cityLand(s,bx,bz)>-.08)continue;
   m.box(bx-.35,-.02,bz-.12,.7,.14,.24,[.62,.58,.50],8);
   m.box(bx-.1,.06,bz-.07,.22,.12,.14,[.30,.34,.36],8);
  }
 }
 // Radio towers: up to 3 sparse lattice towers on open land, blinking beacons.
 {
  const tr2=rng(hash(c.layout+':wc-radio'));
  let placed=0;
  for(let k=0;k<8&&placed<3;k++){
   const a=tr2()*Math.PI*2,rad=16+tr2()*22;
   const tx=s.cx+Math.cos(a)*rad,tz=s.cz+Math.sin(a)*rad*1.35;
   if(cityLand(s,tx,tz)<.9)continue;
   let clash=false;
   for(const l of lots){if(Math.abs(l.x+l.width/2-tx)<3.4&&Math.abs(l.z+l.depth/2-tz)<3.4){clash=true;break;}}
   if(clash)continue;
   m.turn=0;m.construction=[0,0,0,0];m.phase=tr2()*100;m.material=0;m.kind=0;
   wcRadioTower(m,tx,tz,5.5+tr2()*2.5,tr2);
   placed++;
  }
 }
 m.material=0;m.kind=0;m.turn=0;m.construction=[0,0,0,0];
}
// Worker C: per-plane detail pass — signage, rooftop kit, smoke, flags, graffiti.
// Called for every plane (1-7); each plane details its own lots. Radio towers stay
// in bakeCityDetails (index 1) so only one set is ever placed.
function bakeWCDetails(m,s,c,index){
 const lots=s.lots||[];
 // Business signage: small seeded facade plates (mat 33), ~2/5 of lots.
 for(const l of lots){
  if(l.plane!==index||l.height<1.2)continue;
  const sr=rng(hash(c.layout+':wc-sign:'+l.id));
  if(sr()<.58)continue;
  const flagship=hash(c.layout+':wc-flagship:'+l.id)%9===0;
  const biz=Math.floor(sr()*WC_BIZ.length);
  const sw=Math.min(flagship?1.3:.95,l.width*(flagship?.8:.62)),sh=sw*.24;
  const sx=l.x+l.width*(.2+sr()*.6),sy=Math.min(l.height*.80,l.height-.28),sz=l.z+l.depth+.015;
  m.turn=l.angle||0;m.pivot=[l.x+l.width/2,l.z+l.depth/2];m.construction=[l.birth,l.duration,0,l.height];
  wcSignQuad(m,sx,sy,sz,sw,sh,biz,sr);
  m.construction=[0,0,0,0];
 }
 // Rooftop kit: sparse seeded water towers, antennas, dishes, beacons, roof doors,
 // vents, skylights; gargoyles on ~14% of flat roofs (each one unique); rooftop
 // gardens stay rare (~4.5%) and never on every roof.
 for(const l of lots){
  if(l.plane!==index||l.height<1.0||!wcFlatRoof(c,l))continue;
  const kr=rng(hash(c.layout+':wc-roof:'+l.id));
  const x=l.x,z=l.z,w=l.width,d=l.depth,h=l.height;
  m.turn=l.angle||0;m.pivot=[l.x+l.width/2,l.z+l.depth/2];m.construction=[l.birth,l.duration,0,h];m.phase=l.phase;m.material=0;m.kind=0;
  const px=(f)=>x+w*f,pz=(f)=>z+d*f;
  if(h>1.7&&kr()<.13)wcWaterTower(m,px(.3+kr()*.4),h,pz(.3+kr()*.4),kr);
  if(h>2.2&&kr()<.20)wcAntenna(m,px(.2+kr()*.6),h,pz(.2+kr()*.6),.7+kr()*.9,kr);
  if(kr()<.16)wcDish(m,px(.15+kr()*.7),h,pz(.15+kr()*.7),.09+kr()*.10,kr);
  if(h>3.4&&kr()<.55)wcBeacon(m,px(.5),h+.42,pz(.5));
  else if(h>2.4&&kr()<.3)wcBeacon(m,px(.5),h+.3,pz(.5));
  if(kr()<.5)wcRoofDoor(m,px(.15+kr()*.5),h,pz(.6+kr()*.2),kr);
  if(kr()<.55){const nv=1+Math.floor(kr()*2);for(let vi=0;vi<nv;vi++)wcVent(m,px(.15+kr()*.7),h,pz(.15+kr()*.7),kr);}
  if(w>.8&&d>.8&&kr()<.28)wcSkylight(m,px(.2+kr()*.5),h,pz(.2+kr()*.5),Math.min(.5,w*.3),Math.min(.5,d*.3),kr);
  if(kr()<.045){
   m.box(px(.3),h+.02,pz(.3),w*.3,.05,d*.25,[.30,.40,.26],4);
   m.material=5;m.sphere(px(.45),h+.2,pz(.42),.12,.14,.12,[.17,.30,.12],6,4);m.material=0;
  }
  if(h>1.8&&kr()<.14)wcGargoyle(m,x+(kr()<.5?.06:w-.06),h+.10,z+(kr()<.5?.06:d-.06),kr);
  m.construction=[0,0,0,0];
 }
 // Chimney smoke on sparse existing buildings (kind 19 / mat 28), timeless geometry.
 for(const l of lots){
  if(l.plane!==index||!l.existing||l.height<1.5||!wcFlatRoof(c,l))continue;
  const hr=rng(hash(c.layout+':wc-smoke:'+l.id));
  if(hr()<.86)continue;
  m.turn=l.angle||0;m.pivot=[l.x+l.width/2,l.z+l.depth/2];m.construction=[l.birth,l.duration,0,l.height];m.phase=l.phase;m.material=0;m.kind=0;
  wcSmokeStack(m,l.x+l.width*(.2+hr()*.6),l.height,l.z+l.depth*(.2+hr()*.6),hr);
 }
 // Tiny waving American flags (kind 20 / mat 32) on ~10% of flat-roofed buildings.
 for(const l of lots){
  if(l.plane!==index||l.height<1.4||!wcFlatRoof(c,l))continue;
  const fr2=rng(hash(c.layout+':wc-flag:'+l.id));
  if(fr2()<.90)continue;
  m.turn=l.angle||0;m.pivot=[l.x+l.width/2,l.z+l.depth/2];m.construction=[l.birth,l.duration,0,l.height];m.phase=l.phase;m.material=0;m.kind=0;
  wcFlag(m,l.x+l.width*(.3+fr2()*.4),l.height,l.z+l.depth*(.3+fr2()*.4),fr2);
 }
 // Graffiti: tiny seeded tags on select walls (mat 29), ~20% of lots.
 for(const l of lots){
  if(l.plane!==index||l.height<.9)continue;
  const gr2=rng(hash(c.layout+':wc-graf:'+l.id));
  if(gr2()<.80)continue;
  const gw=.45+gr2()*.35,gh=.32+gr2()*.2;
  m.turn=l.angle||0;m.pivot=[l.x+l.width/2,l.z+l.depth/2];m.construction=[l.birth,l.duration,0,l.height];
  wcGrafQuad(m,l.x+gr2()*(l.width-gw)+gw/2,.12+gr2()*.5,l.z+l.depth+.012,gw,gh,Math.floor(gr2()*4),gr2);
  m.construction=[0,0,0,0];
 }
 m.material=0;m.kind=0;m.turn=0;m.pivot=[0,0];m.construction=[0,0,0,0];
}
// Worker B: near-field foliage as instanced-feel textured cross-quads (mat 24).
function foliageTree(m,x,z,s,r){
 m.box(x-.03,.02,z-.03,.06,s*.55,.06,[.25,.18,.10],0);
 const w=s*.95,y0=s*.32,y1=y0+s*1.05,cell=r()<.5?0:1,u0=cell*.5;
 const old=m.material;m.material=24;m.kind=0;
 const cross=(a,b,c2,d2,n)=>{
  const base=m.data.length/23;
  m.vertex(a,n,[1,1,1],[u0,0]);m.vertex(b,n,[1,1,1],[u0+.5,0]);m.vertex(c2,n,[1,1,1],[u0+.5,1]);m.vertex(d2,n,[1,1,1],[u0,1]);
  m.indices.push(base,base+1,base+2,base,base+2,base+3,base,base+3,base+2,base,base+2,base+1);};
 cross([x-w/2,y0,z],[x+w/2,y0,z],[x+w/2,y1,z],[x-w/2,y1,z],[0,0,1]);
 cross([x,y0,z-w/2],[x,y0,z+w/2],[x,y1,z+w/2],[x,y1,z-w/2],[1,0,0]);
 m.material=old;
}
// Worker B: procedural alpha foliage atlas (canopy cell + bush cell), seeded.
function bakeFoliageAtlas(seed){
 const W=256,H=128,cv=document.createElement('canvas');cv.width=W;cv.height=H;
 const g=cv.getContext('2d'),r=rng(hash(seed+':foliage-atlas')),PI2=Math.PI*2;
 g.clearRect(0,0,W,H);
 const cell=(ox,bush)=>{
  for(let k=0;k<170;k++){
   const a=r()*PI2,rad=Math.pow(r(),.55)*H*.46;
   const cx=ox+H/2+Math.cos(a)*rad,cy=H/2+Math.sin(a)*rad*(bush?.62:.85);
   const sz=3.5+r()*(bush?8:12);
   g.fillStyle='rgba('+(52+r()*46|0)+','+(92+r()*66|0)+','+(36+r()*36|0)+','+(.72+r()*.28).toFixed(2)+')';
   g.beginPath();g.ellipse(cx,cy,sz,sz*(.5+r()*.35),r()*3,0,PI2);g.fill();
  }
  for(let k=0;k<46;k++){
   const cx=ox+H/2+(r()-.5)*H*.8,cy=H*.62+r()*H*.3,sz=4+r()*9;
   g.fillStyle='rgba('+(30+r()*26|0)+','+(58+r()*36|0)+','+(24+r()*24|0)+',.85)';
   g.beginPath();g.ellipse(cx,cy,sz,sz*.6,r()*3,0,PI2);g.fill();
  }
  for(let k=0;k<36;k++){
   const cx=ox+H/2+(r()-.5)*H*.75,cy=H*.16+r()*H*.24,sz=3+r()*7;
   g.fillStyle='rgba('+(110+r()*60|0)+','+(150+r()*60|0)+','+(70+r()*40|0)+',.8)';
   g.beginPath();g.ellipse(cx,cy,sz,sz*.55,r()*3,0,PI2);g.fill();
  }
 };
 cell(0,false);cell(H,true);
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,cv);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 return tex;
}
// Worker B: city systems + life. Baked once (index 1): freeway, parks, parking,
// street furniture, stop signs, pedestrians, pigeons, beacons, signs, mountains.
function bakeCityLife(m,s,c,r){
 const TAU2=Math.PI*2;
 const reset=()=>{m.construction=[0,0,0,0];m.kind=0;m.route=[0,0,0,0];m.turn=0;m.pivot=[0,0];m.phase=0;m.anchor=0;m.material=0;};
 const fan=(cx,cz,rr,y,col,mat,n=10)=>{
  const base=m.data.length/23;m.material=mat;const nn=[0,1,0];
  for(let k=0;k<n;k++){const a0=k/n*TAU2,a1=(k+1)/n*TAU2;
   m.vertex([cx,y,cz],nn,col,[0,0]);
   m.vertex([cx+Math.cos(a0)*rr,y,cz+Math.sin(a0)*rr],nn,col,[.5,0]);
   m.vertex([cx+Math.cos(a1)*rr,y,cz+Math.sin(a1)*rr],nn,col,[0,.5]);
   m.indices.push(base+k*3,base+k*3+1,base+k*3+2,base+k*3,base+k*3+2,base+k*3+1);}
  m.material=0;};
 const vquad=(a,b2,c2,d2,col,n,mat)=>{
  const base=m.data.length/23;m.material=mat;
  m.vertex(a,n,col,[0,0]);m.vertex(b2,n,col,[1,0]);m.vertex(c2,n,col,[1,1]);m.vertex(d2,n,col,[0,1]);
  m.indices.push(base,base+1,base+2,base,base+2,base+3,base,base+3,base+2,base,base+2,base+1);
  m.material=0;};
 const lampAt=(x,z,h=.85)=>{
  m.box(x-.025,0,z-.025,.05,h,.05,[.16,.17,.18],8);
  m.box(x-.17,h-.035,z-.02,.34,.04,.04,[.16,.17,.18],8);
  m.material=9;m.box(x+.09,h-.06,z-.025,.13,.05,.05,[1.,.74,.36],9);m.material=8;};
 // ---- Freeway ring: deck chords, rails, piers, ramps, semi trucks (kind 16) ----
 if(s.freeway){
  const fw=s.freeway,N=72,deckC=[.135,.14,.145];
  for(let k=0;k<N;k++){
   const a0=k/N*TAU2,a1=(k+1)/N*TAU2;
   const x0=fw.x+Math.cos(a0)*fw.r,z0=fw.z+Math.sin(a0)*fw.r,x1=fw.x+Math.cos(a1)*fw.r,z1=fw.z+Math.sin(a1)*fw.r;
   const dx=x1-x0,dz=z1-z0,cl=Math.hypot(dx,dz)||1,nx=-dz/cl,nz=dx/cl,hw=fw.w/2;
   m.material=4;
   m.face([x0+nx*hw,fw.y,z0+nz*hw],[x1+nx*hw,fw.y,z1+nz*hw],[x1-nx*hw,fw.y,z1-nz*hw],[x0-nx*hw,fw.y,z0-nz*hw],deckC,[0,1,0]);
   m.face([x0-nx*.035,fw.y+.004,z0-nz*.035],[x1-nx*.035,fw.y+.004,z1-nz*.035],[x1+nx*.035,fw.y+.004,z1+nz*.035],[x0+nx*.035,fw.y+.004,z0+nz*.035],[.55,.50,.30],[0,1,0]);
   m.material=0;
   for(const sd of[-1,1]){const o=(hw-.04)*sd;
    vquad([x0+nx*o,fw.y,z0+nz*o],[x1+nx*o,fw.y,z1+nz*o],[x1+nx*o,fw.y+.24,z1+nz*o],[x0+nx*o,fw.y+.24,z0+nz*o],[.55,.55,.52],[nx*sd,0,nz*sd],8);}
   if(k%3===0){const mx=(x0+x1)/2,mz=(z0+z1)/2;m.box(mx-.16,0,mz-.16,.32,fw.y,.32,[.40,.39,.36],12);}
  }
  for(const ra of fw.ramps){
   const dx=Math.cos(ra),dz=Math.sin(ra),SEG=8,run=15;
   const px=fw.x+dx*fw.r,pz=fw.z+dz*fw.r,nx=-dz,nz=dx,hw2=.26;
   for(let sg=0;sg<SEG;sg++){
    const t0=sg/SEG,t1=(sg+1)/SEG;
    const qx0=px+dx*run*t0,qz0=pz+dz*run*t0,qx1=px+dx*run*t1,qz1=pz+dz*run*t1;
    const y0=fw.y*(1-t0)+.02*t0,y1=fw.y*(1-t1)+.02*t1;
    m.material=4;
    m.face([qx0+nx*hw2,y0,qz0+nz*hw2],[qx1+nx*hw2,y1,qz1+nz*hw2],[qx1-nx*hw2,y1,qz1-nz*hw2],[qx0-nx*hw2,y0,qz0-nz*hw2],deckC,[0,1,0]);
    m.material=0;
   }
   for(let sg=1;sg<SEG;sg+=2){const t=sg/SEG,qx=px+dx*run*t,qz=pz+dz*run*t,y=fw.y*(1-t);
    m.box(qx-.12,0,qz-.12,.24,Math.max(.1,y),.24,[.40,.39,.36],12);}
  }
  const tr=rng(hash(c.layout+':ring-trucks'));
  for(let k=0;k<14;k++){
   reset();m.kind=16;m.phase=tr()*100;
   const lane=k%2?1:-1,rad=fw.r+lane*.30,spd=(.055+tr()*.035)*(lane>0?1:-1);
   m.route=[fw.x,fw.z,rad,spd];
   const cabC=tr()<.5?[.70,.22,.14]:[.20,.35,.62];
   m.box(-.62,fw.y+.02,-.10,1.05,.44,.20,[.82,.82,.80],8);
   m.box(.48,fw.y+.02,-.085,.34,.34,.17,cabC,8);
   m.box(.66,fw.y+.22,-.07,.05,.12,.14,[.12,.22,.26],1);
   for(const wx of[-.45,-.15,.15,.55])for(const wz of[-.095,.075])m.box(wx,fw.y+.005,wz,.09,.07,.035,[.07,.07,.08],8);
  }
  reset();
 }
 // ---- Parks: plates, paths, statues/monuments, benches, lamps, planting ----
 const pr2=rng(hash(c.layout+':park-dress'));
 for(const pk of s.parks){
  const grassC=[.23,.36,.20];
  reset();
  if(pk.kind===0)fan(pk.x,pk.z,pk.r,.010,grassC,5,14);
  else{
   const rot=pk.rot||0,co=Math.cos(rot),si=Math.sin(rot);
   const rect=(cx,cz,w,d)=>{
    const corn=(lx,lz)=>[cx+lx*co-lz*si,.010,cz+lx*si+lz*co];
    m.material=5;m.face(corn(-w/2,-d/2),corn(w/2,-d/2),corn(w/2,d/2),corn(-w/2,d/2),grassC,[0,1,0]);m.material=0;};
   rect(pk.x,pk.z,pk.w,pk.d);
   if(pk.kind===2)rect(pk.x+(pk.lx||0)*co-(pk.lz||0)*si,pk.z+(pk.lx||0)*si+(pk.lz||0)*co,pk.w2,pk.d2);
  }
  const pathC=[.60,.54,.40],pw=.22;
  for(const pa of[0,Math.PI/2]){
   const dx=Math.cos(pa+(pk.rot||0)),dz=Math.sin(pa+(pk.rot||0)),pl=(pk.kind===0?pk.r*1.7:Math.max(pk.w,pk.d)*1.35);
   m.material=5;
   m.face([pk.x-dx*pl/2-dz*pw/2,.012,pk.z-dz*pl/2+dx*pw/2],[pk.x+dx*pl/2-dz*pw/2,.012,pk.z+dz*pl/2+dx*pw/2],[pk.x+dx*pl/2+dz*pw/2,.012,pk.z+dz*pl/2-dx*pw/2],[pk.x-dx*pl/2+dz*pw/2,.012,pk.z-dz*pl/2-dx*pw/2],pathC,[0,1,0]);
   m.material=0;
  }
  const st=pr2();
  if(st<.45){
   m.box(pk.x-.17,.012,pk.z-.17,.34,.5,.34,[.62,.60,.52],12);
   m.box(pk.x-.09,.51,pk.z-.08,.18,.52,.16,[.32,.26,.17],8);
   m.material=8;m.sphere(pk.x,1.12,pk.z,.085,.10,.085,[.36,.30,.20],7,4);m.material=0;
  }else if(st<.75){
   m.box(pk.x-.22,.012,pk.z-.22,.44,.18,.44,[.60,.58,.50],12);
   m.material=8;m.cylinder(pk.x,.19,pk.z,.15,.15,1.15,[.55,.52,.44],4,.28);m.material=0;
   m.box(pk.x-.05,1.34,pk.z-.05,.10,.10,.10,[.70,.62,.40],8);
  }else{
   m.material=8;m.cylinder(pk.x,.012,pk.z,.55,.55,.30,[.58,.57,.50],14);m.material=0;
   m.material=6;m.cylinder(pk.x,.012,pk.z,.44,.44,.22,[.20,.34,.38],14);m.material=0;
   m.box(pk.x-.06,.30,pk.z-.06,.12,.42,.12,[.55,.54,.47],8);
   m.box(pk.x-.16,.70,pk.z-.16,.32,.07,.32,[.60,.59,.51],8);
  }
  const nB=3+Math.floor(pr2()*3);
  for(let bi=0;bi<nB;bi++){
   const a=pr2()*TAU2,rr=(pk.kind===0?pk.r*.62:Math.min(pk.w,pk.d)*.36)+pr2()*.5;
   const bx=pk.x+Math.cos(a)*rr,bz=pk.z+Math.sin(a)*rr;
   if(cityPark(s,bx,bz)&&cityLand(s,bx,bz)>.4){
    m.turn=pr2()*TAU2;m.pivot=[bx,bz];
    m.box(bx-.16,.10,bz-.035,.32,.035,.07,[.42,.32,.20],8);
    m.box(bx-.16,.13,bz-.055,.32,.16,.025,[.42,.32,.20],8);
    m.turn=0;m.pivot=[0,0];
    if(bi%2===0)lampAt(bx+.5,bz+.3,.62);
   }
  }
  const nT=4+Math.floor(pr2()*5);
  for(let ti=0;ti<nT;ti++){
   const a=pr2()*TAU2,rr=pr2()*(pk.kind===0?pk.r*.8:Math.min(pk.w,pk.d)*.45);
   const tx=pk.x+Math.cos(a)*rr,tz=pk.z+Math.sin(a)*rr;
   if(cityPark(s,tx,tz)&&cityLand(s,tx,tz)>.4)foliageTree(m,tx,tz,.5+pr2()*.45,pr2);
  }
 }
 // ---- Parking: surface lots, multi-deck garages, podiums ----
 for(const pl of s.surfLots){
  reset();
  const co=Math.cos(pl.rot),si=Math.sin(pl.rot);
  const corner=(lx,lz)=>[pl.x+lx*co-lz*si,pl.z+lx*si+lz*co];
  const q=(lx0,lz0,lx1,lz1,y,col,mat)=>{const a=corner(lx0,lz0),b=corner(lx1,lz0),c2=corner(lx1,lz1),d=corner(lx0,lz1);
   m.material=mat;m.face([a[0],y,a[1]],[b[0],y,b[1]],[c2[0],y,c2[1]],[d[0],y,d[1]],col,[0,1,0]);m.material=0;};
  q(-pl.w/2,-pl.d/2,pl.w/2,pl.d/2,.011,[.15,.15,.16],4);
  const lr=rng(hash(c.layout+':surflot:'+(pl.seed|0)));
  const stalls=Math.max(3,Math.floor(pl.w/.34));
  for(let sti=0;sti<=stalls;sti++){const lx=-pl.w/2+sti*(pl.w/stalls);
   q(lx-.012,-pl.d/2,lx+.012,pl.d/2,.013,[.68,.68,.64],0);}
  for(let sti=0;sti<stalls;sti++){
   if(lr()<.45)continue;
   const lx=-pl.w/2+(sti+.5)*(pl.w/stalls),lz=(lr()<.5?-1:1)*pl.d*.25;
   m.turn=pl.rot;m.pivot=[pl.x,pl.z];
   m.box(pl.x+lx-.11,.013,pl.z+lz-.055,.22,.075,.11,[[.75,.28,.13],[.78,.78,.75],[.16,.22,.38],[.12,.12,.14]][Math.floor(lr()*4)],8);
   m.box(pl.x+lx-.06,.088,pl.z+lz-.037,.11,.04,.074,[.10,.20,.23],1);
   m.turn=0;m.pivot=[0,0];
  }
 }
 for(const g of s.garages){
  reset();
  const gr=rng(hash(c.layout+':garage:'+(g.seed|0)));
  const decks=3,dh=.52,conc=[.55,.55,.52];
  for(let lv=0;lv<decks;lv++){
   const y=lv*dh;
   m.box(g.x-g.w/2,y,g.z-g.d/2,g.w,.07,g.d,conc,12);
   for(const cc of[[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1]])
    m.box(g.x+cc[0]*g.w*.42-.045,y+.07,g.z+cc[1]*g.d*.42-.045,.09,dh-.07,.09,conc,12);
   m.box(g.x-g.w/2,y+.07,g.z-g.d/2,g.w,.30,.06,conc,12);
   m.box(g.x-g.w/2,y+.07,g.z+g.d/2-.06,g.w,.30,.06,conc,12);
   m.box(g.x-g.w/2,y+.07,g.z-g.d/2,.06,.30,g.d,conc,12);
   m.box(g.x+g.w/2-.06,y+.07,g.z-g.d/2,.06,.30,g.d,conc,12);
   const n=Math.floor(g.w/.5);
   for(let ci=0;ci<n;ci++){
    if(gr()<.4)continue;
    const cx=g.x-g.w/2+.3+ci*.5,cz=g.z+(gr()<.5?-g.d*.25:g.d*.25);
    m.box(cx-.11,y+.07,cz-.055,.22,.075,.11,[[.75,.28,.13],[.78,.78,.75],[.20,.30,.55]][Math.floor(gr()*3)],8);
    m.box(cx-.06,y+.145,cz-.037,.11,.04,.074,[.10,.20,.23],1);
   }
   if(lv<decks-1){
    m.material=12;
    m.face([g.x+g.w/2-.7,y+.07,g.z-g.d/2+.15],[g.x+g.w/2-.1,y+.07,g.z-g.d/2+.15],[g.x+g.w/2-.1,y+dh,g.z+g.d/2-.15],[g.x+g.w/2-.7,y+dh,g.z+g.d/2-.15],conc,[0,1,0]);
    m.material=0;
   }
  }
  m.box(g.x-.3,decks*dh+.02,g.z-g.d/2-.06,.6,.22,.05,[.85,.70,.20],9);
 }
 const pr3=rng(hash(c.layout+':podiums'));
 for(const l of s.lots){
  if(l.plane!==1||l.lod||!l.existing||l.height<1.7)continue;
  if(l.style!==0&&l.style!==2)continue;
  if(pr3()<.72)continue;
  const ph=.5,x=l.x,z=l.z,w=l.width,d=l.depth;
  m.box(x-.07,0,z-.07,w+.14,ph,d+.14,[.58,.57,.52],12);
  const band=[.07,.085,.10];
  m.box(x-.075,.16,z+d+.055,w+.15,.15,.02,band,8);
  m.box(x-.075,.16,z-.075,w+.15,.15,.02,band,8);
  m.box(x+w+.055,.16,z-.075,.02,.15,d+.15,band,8);
  m.box(x-.075,.16,z-.075,.02,.15,d+.15,band,8);
 }
 // ---- Street furniture: lamps (+night pools), bins, post boxes, stop signs ----
 let lampCount=0;
 for(const p of s.roads){
  const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],len=Math.hypot(dx,dz);
  if(p.bridge||len<4||p.width<.24||lampCount>260)continue;
  const n=Math.floor(len/5);
  for(let k=0;k<n&&lampCount<260;k++){
   const t=(k+.5)/n,side=(k%2?1:-1),o=(p.width/2+.17)*side;
   const nx=-dz/len,nz=dx/len;
   const lx=p.a[0]+dx*t+nx*o,lz=p.a[1]+dz*t+nz*o;
   if(Math.hypot(lx-s.cx,lz-s.cz)>34)continue;
   if(cityLand(s,lx,lz)<.3)continue;
   lampAt(lx,lz);
   fan(lx,lz,1.05,p.y+.0035,[.30,.26,.19],9,10);
   lampCount++;
  }
 }
 let xi=0;
 for(const x of s.xings){
  if(xi%2===0){m.material=8;m.cylinder(x.x+x.w*.5+.25,.012,x.z+x.w*.5+.25,.045,.045,.13,[.22,.30,.22],7);m.material=0;}
  if(xi%5===0)m.box(x.x-x.w*.5-.35,.012,x.z-x.w*.5-.3,.14,.11,.10,[.12,.25,.55],8);
  xi++;
 }
 const sr=rng(hash(c.layout+':stopsigns'));
 let sc2=0;
 for(const p of s.traffic){
  if(!p.stops||!p.stops.length||sc2>=60)continue;
  if(sr()<.35)continue;
  const t=p.stops[0],dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],L=Math.hypot(dx,dz)||1,ux=dx/L,uz=dz/L;
  const sx=p.a[0]+ux*(t*L-.55)+(-uz)*(p.width/2+.18),sz=p.a[1]+uz*(t*L-.55)+(ux)*(p.width/2+.18);
  if(cityLand(s,sx,sz)<.2)continue;
  m.turn=-Math.atan2(dz,dx);m.pivot=[sx,sz];
  m.box(sx-.018,0,sz-.018,.036,.78,.036,[.30,.30,.32],8);
  m.box(sx-.012,.60,sz-.10,.024,.20,.20,[.75,.12,.10],8);
  m.box(sx-.014,.63,sz-.075,.028,.14,.15,[.85,.85,.82],8);
  m.turn=0;m.pivot=[0,0];
  sc2++;
 }
 // ---- Pedestrians (kind 15): sidewalk walkers with crosswalk dwells ----
 const pdr=rng(hash(c.layout+':peds'));
 const cloth=[[.70,.25,.20],[.20,.35,.60],[.75,.70,.55],[.30,.55,.35],[.55,.40,.65],[.80,.55,.25]];
 let pedCount=0;
 for(const p of s.roads){
  if(p.bridge||pedCount>=46)continue;
  const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],len=Math.hypot(dx,dz);
  if(len<4||p.width<.24)continue;
  if(pdr()<.55)continue;
  const ux=dx/len,uz=dz/len,side=pdr()<.5?1:-1,o=(p.width/2+.11)*side;
  const ax=p.a[0]+(-uz)*o,az=p.a[1]+(ux)*o;
  let sf=-1;
  for(const x of s.xings){
   const t=((x.x-p.a[0])*dx+(x.z-p.a[1])*dz)/(len*len);
   if(t>.1&&t<.9&&Math.hypot(p.a[0]+dx*t-x.x,p.a[1]+dz*t-x.z)<p.width){sf=t;break;}
  }
  reset();m.kind=15;m.phase=pdr()*100;m.anchor=0;
  m.route=[ux,uz,len,.20+pdr()*.22];m.turn=-Math.atan2(dz,dx);m.pivot=[ax,az];
  m.construction=[sf,0,.38,0];
  m.box(ax-.025,.015,az-.022,.05,.115,.044,cloth[Math.floor(pdr()*cloth.length)],8);
  m.material=8;m.sphere(ax,.155,az,.026,.030,.026,[.80,.62,.48],6,4);m.material=0;
  m.turn=0;m.route=[0,0,0,0];m.kind=0;m.pivot=[0,0];m.construction=[0,0,0,0];
  pedCount++;
 }
 // ---- Pigeons (kind 17): flocks at plazas, scatter from the camera ----
 const pgr=rng(hash(c.layout+':pigeons'));
 const colorways=[[.45,.45,.48],[.25,.25,.28],[.85,.85,.84],[.45,.34,.24],[.55,.55,.58]];
 for(const sp of s.pigeonSpots){
  const n=5+Math.floor(pgr()*4);
  for(let k=0;k<n;k++){
   reset();m.kind=17;m.phase=pgr()*100;
   const cw=colorways[Math.floor(pgr()*colorways.length)];
   const sa=pgr()*TAU2;
   m.route=[sp.x,sp.z,.45+pgr()*.55,0];
   m.construction=[Math.cos(sa),Math.sin(sa),0,0];
   m.turn=pgr()*TAU2;m.pivot=[0,0];
   const headC=[cw[0]*.72,cw[1]*.72,cw[2]*.72];
   m.box(-.028,.02,-.048,.056,.05,.096,cw,8);
   m.box(-.016,.062,.026,.032,.036,.032,headC,8);
   m.box(-.022,.032,-.088,.044,.016,.042,cw,8);
   m.turn=0;
  }
 }
 reset();
 // ---- Aircraft-warning beacons (kind 18): blink on the tall towers ----
 const bcr=rng(hash(c.layout+':beacons'));
 for(const l of s.lots){
  if(l.plane!==1||l.lod||!l.existing||l.height<3.2)continue;
  if(bcr()<.5)continue;
  reset();m.kind=18;m.phase=bcr()*100;m.material=9;
  m.sphere(l.x+l.width/2,l.height+.07,l.z+l.depth/2,.05,.06,.05,[1.,.16,.10],6,4);
  m.material=0;
 }
 reset();
 // ---- Lit shop signage (emissive strips on street-facing lots) ----
 const sgr=rng(hash(c.layout+':signs'));
 const signCols=[[.95,.25,.20],[.20,.70,.95],[.95,.80,.25],[.30,.95,.55],[.90,.45,.90]];
 for(const l of s.lots){
  if(l.plane!==1||l.lod||!l.existing||l.height<1.0)continue;
  if(sgr()<.68)continue;
  reset();m.material=9;
  const sc3=signCols[Math.floor(sgr()*signCols.length)];
  m.box(l.x+l.width*.18,.85,l.z+l.depth-.01,l.width*.64,.20,.05,sc3,9);
  if(sgr()<.4)m.box(l.x+l.width-.02,1.1,l.z+l.depth*.3,.05,.5,.12,sc3,9);
  m.material=0;
 }
 reset();
 // ---- Procedural mountain ridges (cheap hazed silhouettes) ----
 for(let ri=0;ri<3;ri++){
  const Rr=70+ri*9,mr=rng(hash(c.layout+':ridge:'+ri)),mph=mr()*TAU2;
  const base=4.5+ri*2.6,amp=2.6+ri*1.9,SEG=56,hazeMix=.34+ri*.20;
  const mtc=[mix(.34,.58,hazeMix),mix(.37,.63,hazeMix),mix(.44,.68,hazeMix)];
  for(let k=0;k<SEG;k++){
   const a0=k/SEG*TAU2,a1=(k+1)/SEG*TAU2;
   const x0=s.cx+Math.cos(a0)*Rr,z0=s.cz+Math.sin(a0)*Rr,x1=s.cx+Math.cos(a1)*Rr,z1=s.cz+Math.sin(a1)*Rr;
   const h0=base+amp*(.5+.5*Math.sin(a0*3+ri*2.1+mph))+mr()*1.2,h1=base+amp*(.5+.5*Math.sin(a1*3+ri*2.1+mph))+mr()*1.2;
   vquad([x0,-4,z0],[x1,-4,z1],[x1,h1,z1],[x0,h0,z0],mtc,[0,0,1],2);
  }
 }
 reset();
}
function bakeSkyLife(m,s,c){
 const r=rng(hash(c.layout+':sky-life'));
 const reset=()=>{m.construction=[0,0,0,0];m.kind=0;m.route=[0,0,0,0];m.turn=0;m.pivot=[0,0];m.phase=0;m.anchor=0;m.material=0;};
 // Double-sided quad with explicit UVs (aTex.x drives wing flap / smoke age).
 const quad=(a,b,c2,d2,col,n,uvs)=>{
  const base=m.data.length/23;
  m.vertex(a,n,col,uvs[0]);m.vertex(b,n,col,uvs[1]);m.vertex(c2,n,col,uvs[2]);m.vertex(d2,n,col,uvs[3]);
  m.indices.push(base,base+1,base+2,base,base+2,base+3,base,base+3,base+2,base,base+2,base+1);
 };
 // Bird flocks circle low over the far rooftops, where the camera actually sees sky.
 const birdC=[.07,.08,.10];
 for(let f=0;f<3;f++){
  const fx=(r()-.5)*36,fz=(r()-.5)*32,frad=12+r()*8,falt=7.5+r()*4.5,spd=(.10+r()*.08)*(r()<.5?1:-1);
  const n=8+Math.floor(r()*6);
  for(let b=0;b<n;b++){
   reset();m.kind=8;m.phase=r()*100;m.route=[fx,fz,frad,spd];m.material=0;
   quad([-0.25,falt,-0.045],[0.25,falt,-0.045],[0.25,falt,0.045],[-0.25,falt,0.045],birdC,[0,1,0],[[0,0],[0,0],[0,0],[0,0]]);
   for(const sd of[1,-1])
    quad([-0.05,falt,sd*0.03],[0.12,falt,sd*0.03],[0.085,falt,sd*0.51],[-0.085,falt,sd*0.51],birdC,[0,1,0],[[0,0],[0,0],[1,0],[1,0]]);
  }
 }
 // One slow blimp circling the far rooftops, where the camera can actually see it.
 {
  reset();m.kind=9;m.phase=r()*100;m.route=[(r()-.5)*12,(r()-.5)*12,16+r()*6,(.020+r()*.012)*(r()<.5?1:-1)];m.material=8;
  const by=9+r()*2,bc=[.70,.66,.60];
  m.sphere(0,by,0,3.4,1.15,1.15,bc,14,8);
  m.box(-0.5,by-1.5,-0.45,1.7,.55,.9,color(bc,.7),8);
  m.box(-3.7,by-.4,-0.06,1.0,1.5,.12,color(bc,.82),8);
  m.box(-3.7,by-.1,-0.75,1.0,.12,1.5,color(bc,.82),8);
  m.box(2.2,by-.1,-1.16,1.2,.5,.06,[.55,.12,.10],8);
  m.box(2.2,by-.1,1.10,1.2,.5,.06,[.55,.12,.10],8);
  // Scrolling marquee sign hugging the envelope. Same kind/route/phase as the blimp
  // so the vertex shader carries it along; the scrolling text is a canvas texture.
  m.material=20;
  for(const ssd of[1,-1]){const SX0=-2.3,SX1=2.3,SY0=by-.44,SY1=by+.44,SEGN=10;
   for(let sqi=0;sqi<SEGN;sqi++){
    const sxa=SX0+(SX1-SX0)*sqi/SEGN,sxb=SX0+(SX1-SX0)*(sqi+1)/SEGN;
    const sza=Math.sqrt(Math.max(.06,1-(sxa/3.4)*(sxa/3.4)))*1.15*ssd+ssd*.045;
    const szb=Math.sqrt(Math.max(.06,1-(sxb/3.4)*(sxb/3.4)))*1.15*ssd+ssd*.045;
    const sb=m.data.length/23,sn=[0,0,ssd];
    m.vertex([sxa,SY0,sza],sn,[1,1,1],[sqi/SEGN,0]);m.vertex([sxb,SY0,szb],sn,[1,1,1],[(sqi+1)/SEGN,0]);
    m.vertex([sxb,SY1,szb],sn,[1,1,1],[(sqi+1)/SEGN,1]);m.vertex([sxa,SY1,sza],sn,[1,1,1],[sqi/SEGN,1]);
    m.indices.push(sb,sb+1,sb+2,sb,sb+2,sb+3,sb,sb+3,sb+2,sb,sb+2,sb+1);
   }}
  m.material=8;
 }
 // A few airliners, high and fast on the horizon.
 for(let pI=0;pI<3;pI++){
  reset();m.kind=10;m.phase=r()*100;
  const a=r()*TAU,dx=Math.cos(a),dz=Math.sin(a),alt=13+r()*7,len=190,spd=7+r()*3;
  m.route=[dx,dz,len,spd];m.material=8;m.turn=-a;m.pivot=[0,0];
  const pc=[.82,.83,.85],pz=(r()-.5)*60;
  m.box(-1.3,alt,pz-.14,2.6,.26,.28,pc,8);
  m.box(-0.25,alt+.02,pz-1.5,.9,.07,3.0,color(pc,.9),8);
  m.box(-1.55,alt+.05,pz-.06,.5,.62,.12,color(pc,.85),8);
  m.turn=0;
 }
 // Formation flyby: a rare seeded event with red, white and blue smoke.
 {
  const fa=r()*TAU,fdx=Math.cos(fa),fdz=Math.sin(fa),flen=200,fspd=26,falt=9+r()*4;
  const form=[[0,0],[-1.8,-1.6],[-1.8,1.6],[-3.6,-3.2],[-3.6,3.2],[-4.6,0]];
  const smokeCols=[[.95,.13,.09],[.95,.95,.95],[.10,.28,.95],[.95,.13,.09],[.95,.95,.95],[.10,.28,.95]];
  const jc=[.16,.17,.20],SEG=40;
  for(let j=0;j<6;j++){
   const ox=form[j][0],oz=form[j][1];
   reset();m.kind=11;m.phase=j*7.3;m.route=[fdx,fdz,flen,fspd];m.material=8;m.turn=-fa;m.pivot=[0,0];
   m.box(ox-1.15,falt-.09,oz-.11,2.3,.18,.22,jc,8);
   m.box(ox-.45,falt-.02,oz-1.0,.8,.05,2.0,color(jc,1.25),8);
   m.box(ox-1.30,falt-.02,oz-.05,.5,.42,.10,color(jc,1.15),8);
   m.box(ox+1.00,falt-.07,oz-.07,.35,.14,.14,color(jc,1.1),8);
   m.turn=0;
   // Smoke ribbon: baked in the flight frame, emission solved in the shader.
   reset();m.kind=12;m.phase=j*3.1+1;m.route=[fdx,fdz,flen,fspd];m.material=9;
   m.construction=[0,0,ox*fdx-oz*fdz,ox*fdz+oz*fdx];
   const col=smokeCols[j];
   for(let sgi=0;sgi<SEG;sgi++){
    const age0=sgi*(7/SEG),age1=(sgi+1)*(7/SEG),w0=.09+age0*.15,w1=.09+age1*.15;
    quad([0,falt,w0],[0,falt,-w0],[0,falt,-w1],[0,falt,w1],col,[0,1,0],[[age0,1],[age0,-1],[age1,-1],[age1,1]]);
   }
  }
 }
 reset();
}
function makeCityPlane(c,index){const m=new CityMesh(),s=cityPlan(c),r=rng(hash(c.detail+':photo-finish:'+index));
 if(index===1){m.material=11;m.face([-95,-.055,-95],[95,-.055,-95],[95,-.055,95],[-95,-.055,95],s.landTint,[0,1,0]);m.material=0;

 for(const p of s.roads){
  const col=s.family===2?(p.cls==='blvd'?[.16,.18,.18]:p.cls==='bridge'?[.30,.25,.18]:[.13,.15,.16]):p.cls==='quay'?[.13,.135,.12]:p.cls==='blvd'?[.105,.115,.125]:p.cls==='bridge'?[.16,.15,.13]:[.095,.11,.125];
  cityRoad(m,p.a,p.b,p.width,p.y,col);
  {const rdx=p.b[0]-p.a[0],rdz=p.b[1]-p.a[1],rlen=Math.hypot(rdx,rdz)||1,rnx=-rdz/rlen,rnz=rdx/rlen;
   if(rlen>2&&p.width>=.22)for(const sd of[-1,1]){const o=(p.width/2+.11)*sd;
    cityRoad(m,[p.a[0]+rnx*o,p.a[1]+rnz*o],[p.b[0]+rnx*o,p.b[1]+rnz*o],.11,p.y+(p.bridge?.014:.0025),[.55,.55,.52],5);}}
  if(p.bridge){
   const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],len=Math.hypot(dx,dz)||1,nx=-dz/len,nz=dx/len;
   for(const sd of[-1,1]){const o=p.width*.5*sd;
    cityRoad(m,[p.a[0]+nx*o,p.a[1]+nz*o],[p.b[0]+nx*o,p.b[1]+nz*o],.07,p.y+.14,[.60,.58,.52],0);}
   if(len>4){const n=Math.floor(len/4);for(let i=1;i<=n;i++){const t=i/(n+1),px=mix(p.a[0],p.b[0],t),pz=mix(p.a[1],p.b[1],t);
    m.box(px-.18,-.05,pz-.18,.36,p.y+.05,.36,[.45,.44,.40],0);}}
  }else if(p.width>=.38){
   const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],len=Math.hypot(dx,dz);
   if(len>2){const n=Math.floor(len/1.15);for(let i=0;i<n;i++){const t0=(i+.30)/n,t1=(i+.70)/n;
    cityRoad(m,[mix(p.a[0],p.b[0],t0),mix(p.a[1],p.b[1],t0)],[mix(p.a[0],p.b[0],t1),mix(p.a[1],p.b[1],t1)],.05,p.y+.002,[.55,.55,.48],0);}}
  }
 }
 // Worker B: seam covers at run joints, sloped ramps at level changes,
 // crossing covers at intersections, and crosswalk stripes.
 for(const j of s.joints){
  const col=s.family===2?(j.cls==='blvd'?[.16,.18,.18]:j.cls==='bridge'?[.30,.25,.18]:[.13,.15,.16]):j.cls==='quay'?[.13,.135,.12]:j.cls==='blvd'?[.105,.115,.125]:j.cls==='bridge'?[.16,.15,.13]:[.095,.11,.125];
  cityRoad(m,[j.x-j.w*.53,j.z],[j.x+j.w*.53,j.z],j.w*1.06,j.y+.002,col,4);
 }
 for(const rp of s.ramps){
  const col=s.family===2?[.16,.18,.18]:[.105,.115,.125],n=3,nx=-rp.dz,nz=rp.dx;
  for(let k=0;k<n;k++){
   const t0=k/n,t1=(k+1)/n,y0=mix(rp.y0,rp.y1,t0),y1=mix(rp.y0,rp.y1,t1);
   const ax=rp.x+rp.dx*(t0-.5)*1.5,az=rp.z+rp.dz*(t0-.5)*1.5,bx=rp.x+rp.dx*(t1-.5)*1.5,bz=rp.z+rp.dz*(t1-.5)*1.5,hw=rp.w/2;
   m.face([ax+nx*hw,y0,az+nz*hw],[bx+nx*hw,y1,bz+nz*hw],[bx-nx*hw,y1,bz-nz*hw],[ax-nx*hw,y0,az-nz*hw],col,[0,1,0]);
  }
 }
 for(const x of s.xings){
  const col=s.family===2?(x.cls==='blvd'?[.16,.18,.18]:x.cls==='bridge'?[.30,.25,.18]:[.13,.15,.16]):x.cls==='quay'?[.13,.135,.12]:x.cls==='blvd'?[.105,.115,.125]:x.cls==='bridge'?[.16,.15,.13]:[.095,.11,.125];
  cityRoad(m,[x.x-x.w*.55,x.z],[x.x+x.w*.55,x.z],x.w*1.1,x.y+.0022,col,4);
 }
 let xw=0;
 for(const x of s.xings){
  if(xw>=44)break;if(xw%3!==0){xw++;continue;}xw++;
  for(let k=-2;k<=2;k++)cityRoad(m,[x.x-.44+k*.22,x.z-.15],[x.x-.44+k*.22,x.z+.15],.085,x.y+.0038,[.72,.72,.68],0);
 }
 if(s.family===2){
  // A clean promenade rings the central water; a grand arched bridge crosses it.
  const walk=[];for(let i=0;i<=96;i++){const a=i/96*TAU;walk.push([s.cx+Math.cos(a)*3.18*1.15,s.cz+Math.sin(a)*3.18*2.2]);}
  for(let i=0;i<walk.length-1;i++)cityRoad(m,walk[i],walk[i+1],.105,.018,[.64,.58,.44],0);
  const bx=s.bridgeX,bz0=s.cz-5.6,bz1=s.cz+5.6,archH=s.bridgeArch;
  const bstone=color(s.palette[0],.95),btrim=color(s.palette[3]||[.6,.58,.5],1.02);
  const NSEG=16;
  for(let i=0;i<NSEG;i++){
   const t0=i/NSEG,t1=(i+1)/NSEG,z0=bz0+(bz1-bz0)*t0,z1=bz0+(bz1-bz0)*t1,zm=(z0+z1)/2;
   const ym=.10+Math.sin(Math.PI*(t0+t1)/2)*archH,segLen=(z1-z0)+.12;
   m.box(bx-.42,ym-.14,zm-segLen/2,.84,.14,segLen,bstone,2);
   m.box(bx-.42,ym,zm-segLen/2,.09,.5,segLen,btrim,12);
   m.box(bx+.33,ym,zm-segLen/2,.09,.5,segLen,btrim,12);
  }
  for(let i=0;i<=6;i++){const t=i/6,z=bz0+(bz1-bz0)*t,y=.10+Math.sin(Math.PI*t)*archH;
   m.box(bx-.5,y-.42,z-.13,1.0,.14,.26,color(s.palette[0],.8),2);}
  for(let i=0;i<=4;i++){const t=i/4,z=bz0+(bz1-bz0)*t,y=.10+Math.sin(Math.PI*t)*archH+.62;
   m.box(bx-.40,y-.55,z-.05,.09,.55,.09,[.13,.13,.14],8);
   m.box(bx+.31,y-.55,z-.05,.09,.55,.09,[.13,.13,.14],8);
   const lmm=m.material;m.material=9;
   m.sphere(bx-.355,y+.08,z,.085,.085,.085,[1.,.72,.30],8,4);
   m.sphere(bx+.355,y+.08,z,.085,.085,.085,[1.,.72,.30],8,4);
   m.material=lmm;}
 }
 for(let i=0;i<s.green.length;i++){const g=s.green[i];
  if(Math.hypot(g[0]-s.cx,g[1]-s.cz)<17){if(index===1)foliageTree(m,g[0],g[1],g[2],r);}
  else cityTree(m,g[0],g[1],g[2],r);}
 // Waterfront crossings vary with each plan, and are separate from the streets.
 if(s.family===1||s.family===5){for(let j=0;j<5;j++){const z=-12+j*5,x=s.geo[2]+Math.sin(z*.09+s.geo[1])*4;if(s.family===1){cityRoad(m,[x-.6,z],[x+2.5,z],.32,.07,[.42,.32,.20],0);for(let k=0;k<4;k++)m.box(x+k*.6,.06,z-.19,.035,.18,.035,[.29,.25,.17],0);}}}
 }
 const lots=cityLots(c,index);m.lots=lots;
 for(const l of lots){const{x,z,width:w,depth:d,height:h,style,phase}=l;m.phase=phase;m.turn=l.angle||0;m.pivot=[x+w/2,z+d/2];
  // Permanent low urban fabric and construction plots share the same seeded plan.
  m.material=0;m.face([x-.035,.025,z-.035],[x+w+.035,.025,z-.035],[x+w+.035,.025,z+d+.035],[x-.035,.025,z+d+.035],s.family===2?[.47,.46,.40]:[.39,.39,.35],[0,1,0]);m.construction=[l.birth,l.duration,0,h];beginBuilding(m);
  const glass=color(s.palette[2],.85+r()*.3),stone=color(s.palette[0],.88+r()*.24),brick=color(s.palette[1],.85+r()*.3);
  // District color variety: seeded per-block shifts so quarters of the city feel different.
  {const district=hash(c.layout+':district:'+Math.floor((x+w/2)/5)+':'+Math.floor((z+d/2)/5))%5;
   const dsh=[[1,.99,1.01],[1.07,.96,.88],[.90,.99,1.09],[1.0,1.05,.93],[1.03,.93,1.02]][district];
   for(const cc of[glass,stone,brick]){cc[0]*=dsh[0];cc[1]*=dsh[1];cc[2]*=dsh[2];}}
  if(l.landmark===1){m.material=1;m.cylinder(x+w*.5,0,z+d*.5,w*.58,d*.48,h,glass,20,.76);m.kind=1;m.material=8;m.cylinder(x+w*.5,h,z+d*.5,w*.44,d*.37,.10,[.67,.72,.69],20);m.box(x+w*.47,h,z+d*.47,.035,.65,.035,[.70,.71,.64],8);m.kind=0;}
  else if(l.landmark===2){const dh=Math.min(h*.45,w*.47,d*.47),base=h-dh;m.box(x,0,z,w,base,d,[.68,.66,.56],2);m.material=8;m.dome(x+w*.5,base,z+d*.5,w*.49,dh,d*.49,[.44,.55,.53],16,5);}
  else if(l.landmark===3){m.box(x+w*.27,0,z+d*.27,w*.46,h,d*.46,stone,2);m.material=8;m.cylinder(x+w*.5,h,z+d*.5,w*.30,d*.30,.18,[.36,.40,.35],12);m.kind=1;m.box(x+w*.37,h+.18,z+d*.37,w*.26,.26,d*.26,glass,1);m.kind=0;}
  else if(l.landmark===4){for(let k=0;k<5;k++){const inset=k*.065;m.box(x+w*inset,h*k/5,z+d*inset,w*(1-inset*2),h/5,d*(1-inset*2),glass,1);}m.kind=1;m.box(x+w*.47,h,z+d*.47,.05,.8,.05,[.65,.67,.60],8);m.kind=0;}
  else if(l.landmark===5)clockTower(m,l,s,c,r);
  else if(l.lod===2)farFieldBlock(m,l,s,c,stone,brick,glass);
  else architectureBuilding(m,l,s,c,stone,brick,glass);
  finishBuilding(m);
  // Grounded cranes retract their jibs before lowering; site screens retire after handover.
  if(!l.existing&&(!l.lod||l.row%3===0)){const cx=x-.10,cz=z+d*.46;m.kind=7;m.box(cx-.022,.032,cz-.022,.044,h+.50,.044,[.73,.51,.24],8);m.kind=2;m.route=[cx,cz,0,0];m.box(cx-.16,h+.47,cz-.035,w*.83+.22,.035,.07,[.81,.57,.27],8);m.box(cx+w*.66,h+.20,cz-.006,.012,.28,.012,[.35,.36,.32],8);m.box(cx-.13,h+.39,cz-.04,.12,.08,.08,[.45,.45,.38],8);m.kind=0;m.route=[0,0,0,0];}
  if(!l.existing&&!l.lod){m.kind=4;const fence=[.28,.37,.37];m.box(x-.023,.032,z-.023,w+.046,.13,.018,fence,13);m.box(x-.023,.032,z+d+.005,w*.35,.13,.018,fence,13);m.box(x+w*.65,.032,z+d+.005,w*.35+.023,.13,.018,fence,13);m.box(x-.023,.032,z-.005,.018,.13,d+.010,fence,13);m.box(x+w+.005,.032,z-.005,.018,.13,d+.010,fence,13);m.kind=0;}
  m.construction=[0,0,0,0];
  if(!l.lod&&(l.row%2===0||l.col%3===0)){cityTree(m,x+w+.16,z+d*.55,.42+r()*.19,r);m.box(x-.12,.02,z+d*.68,.025,.54,.025,[.19,.23,.23],8);m.box(x-.15,.55,z+d*.68,.11,.024,.032,[.89,.79,.54],9);}
  m.turn=0;
 }
 // Route origins and directions are carried per vertex, so motion needs no CPU updates.
 for(let i=index-1;i<s.traffic.length*3;i+=7){const p=s.traffic[Math.floor(i/3)];if(!p)continue;
  const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],length=Math.hypot(dx,dz)||1,ux=dx/length,uz=dz/length;
  const vr=rng(hash(c.detail+':veh:'+Math.floor(i/3)+':'+index));
  const lane=((hash(c.layout+':lane:'+Math.floor(i/3))%2)?1:-1)*(p.width*.22);
  const ox=p.a[0]+(-uz)*lane,oz=p.a[1]+(ux)*lane;
  const isBus=(p.cls==='blvd'||p.cls==='quay')&&vr()<.7;
  const L=isBus?.62:.26,W=isBus?.135:.105,H=isBus?.17:.085;
  m.phase=vr()*100;m.kind=5;m.anchor=0;m.route=[ux,uz,length,.34+vr()*.30];m.turn=-Math.atan2(dz,dx);m.pivot=[ox,oz];
  const sfs=p.stops||[],sf=sfs.length?sfs[Math.floor(vr()*sfs.length)]:-1;
  m.construction=[sf,0,.22,0];
  const tints=[[.75,.28,.13],[.78,.78,.75],[.16,.22,.38],[.13,.13,.15],[.72,.62,.18],[.58,.62,.64]];
  const tint=isBus?[[.12,.45,.48],[.85,.55,.15],[.82,.82,.80]][Math.floor(vr()*3)]:tints[Math.floor(vr()*tints.length)];
  m.box(ox,.023,oz,L,H,W,tint,8);
  m.box(ox+L*.30,.023+H,oz+(W-(isBus?.11:.078))/2,L*.34,.045,isBus?.11:.078,[.10,.20,.23],1);
  if(isBus)m.box(ox+.035,.023+H*.42,oz-.004,L-.07,.05,W+.008,[.62,.74,.78],1);
  for(const wx of[L*.16,L*.84])for(const wz of[.013,W-.013])m.box(ox+wx-.022,.008,oz+wz-.012,.044,.036,.024,[.07,.07,.08],8);
  m.turn=0;m.route=[0,0,0,0];m.kind=0;m.pivot=[0,0];m.construction=[0,0,0,0];}
 for(let i=index-1;i<s.boats.length;i+=7){const p=s.boats[i],dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],length=Math.hypot(dx,dz);m.phase=r()*100;m.kind=6;m.anchor=0;m.route=[dx/length,dz/length,length,.05];m.turn=-Math.atan2(dz,dx);m.pivot=p.a;m.box(p.a[0],-.04,p.a[1],.50,.065,.17,[.74,.76,.70],8);m.box(p.a[0]+.12,.025,p.a[1]+.025,.19,.05,.12,[.15,.29,.34],1);m.kind=0;m.turn=0;m.route=[0,0,0,0];}
 if(index===1){bakeSkyLife(m,s,c);bakeCityDetails(m,s,c,r);bakeCityLife(m,s,c,r);}
 bakeWCDetails(m,s,c,index); // Worker C: signage/rooftops/smoke/flags/graffiti, every plane.
 return m.upload();
}
function cityDraw(mesh,p,view,light,t,eye,sun,params,world){gl.useProgram(p.p);matrix(p,'uViewProjection',view);matrix(p,'uLightMatrix',light);uniform(p,'uStory',t);uniform(p,'uTime',elapsed);uniform(p,'uDensity',params.density*quality);uniform(p,'uRays',params.rays);uniform(p,'uPixelScale',.67/height);uniform(p,'uEye',eye);uniform(p,'uSun',sun);uniform(p,'uWeather',organic(elapsed*.8,world.city.phase));uniform(p,'uMist',params.mist);uniform(p,'uGlow',params.glow);uniform(p,'uGeo',world.city.geo);uniform(p,'uMap',world.city.map);uniform(p,'uCenter',[world.city.cx,world.city.cz]);uniform(p,'uSpacing',[world.city.sx,world.city.sz]);uniform(p,'uBounds',world.city.townBounds||(world.city.family===3?[38,38]:[world.city.sx*16.5,world.city.sz*16]));uniform(p,'uFlyby',world.city.flyby||[300,12]);uniform(p,'uPark',world.city.park);uniform(p,'uLandTint',world.city.landTint);uniform(p,'uWaterTint',world.city.waterTint);{const pph=(elapsed/53+world.city.phase*.013)%1,pu=Math.min(1,Math.max(0,(pph-.02)/.05))*(1-Math.min(1,Math.max(0,(pph-.32)/.10)));
uniform(p,'uPigPulse',window.__renderMode?pu:0);}
if(p===photoPrograms.surface){sampler(p,'uShadow',world.shadow.tex,2);sampler(p,'uMaterial',world.materialTexture,3);sampler(p,'uBlimpSign',blimpSignTexture(),6);if(world.billboardTex)sampler(p,'uBillboard',world.billboardTex,7);sampler(p,'uFoliage',world.foliageTex,8);if(world.signageTex)sampler(p,'uSignage',world.signageTex,11);if(world.graffitiTex)sampler(p,'uGraffiti',world.graffitiTex,12);if(world.flagTex)sampler(p,'uFlag',world.flagTex,13);uniform(p,'uSunI',lightUI.sun);uniform(p,'uAmbI',lightUI.amb);uniform(p,'uTod',lightUI.tod);}gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);attribute(p,'aPosition',3,92,0);attribute(p,'aNormal',3,92,12);attribute(p,'aTint',3,92,24);attribute(p,'aSchedule',4,92,36);attribute(p,'aTex',2,92,52);attribute(p,'aInfo',4,92,60);attribute(p,'aRoute',4,92,76);if(mesh.indexBuffer){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}else gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
// ---- Free camera (live view only) ----
// Touch: one-finger drag orbits, pinch zooms, two-finger drag pans.
// Mouse: drag orbits, wheel zooms, Shift/right-drag pans.
// The exported video always uses the cinematic camera — every read below
// and in commonUniforms is gated on !window.__renderMode.
var freeCam={active:false,tO:0,tE:0,tD:0,tPX:0,tPZ:0,aO:0,aE:0,aD:0,aPX:0,aPZ:0,tZK:1,aZK:1,tCX:0,tCY:0,aCX:0,aCY:0,lastT:-1};
function camTakeover(){
 if(window.__renderMode||!current||!current.city)return false;
 if(freeCam.active)return true;
 var s=current.city,phase=s.phase,drift=smoothed.drift||0;
 freeCam.tO=freeCam.aO=s.angle+.055*organic(elapsed*.24,phase)*drift;
 freeCam.tE=freeCam.aE=s.elevation;
 freeCam.tD=freeCam.aD=s.distance;
 freeCam.tPX=freeCam.aPX=organic(elapsed*.20,phase)*1.5*drift;
 freeCam.tPZ=freeCam.aPZ=organic(elapsed*.13,phase+2)*1.5*drift;
 freeCam.tZK=1;freeCam.tCX=0;freeCam.tCY=0;
 freeCam.active=true;$('camReset').hidden=false;
 return true;
}
function updateFreeCam(){
 if(window.__renderMode||!freeCam.active)return;
 var dt=freeCam.lastT<0?1/60:Math.min(Math.max(elapsed-freeCam.lastT,1/240),.25);
 freeCam.lastT=elapsed;
 var k=1-Math.exp(-dt/.14),k2=1-Math.exp(-dt/.18),f=freeCam;
 f.aO+=(f.tO-f.aO)*k;f.aE+=(f.tE-f.aE)*k;f.aD+=(f.tD-f.aD)*k;
 f.aPX+=(f.tPX-f.aPX)*k;f.aPZ+=(f.tPZ-f.aPZ)*k;
 f.aZK+=(f.tZK-f.aZK)*k2;f.aCX+=(f.tCX-f.aCX)*k2;f.aCY+=(f.tCY-f.aCY)*k2;
}
function renderPhotoCity(w,t,params,dest){if(!photoPrograms)photoPrograms={surface:program(cityVertex,cityFragment),shadow:program(cityVertex,cityShadowFragment)};
 if(!w.materialTexture)w.materialTexture=bakeCityMaterials(w.config.detail);
 if(!w.foliageTex)w.foliageTex=bakeFoliageAtlas(w.config.detail);
 if(!w.billboardTex)w.billboardTex=bakeBillboardAtlas(w.config.detail);
 if(!w.signageTex)w.signageTex=bakeSignageAtlas(w.config.layout); // Worker C: layout is the canonical seed.
 if(!w.graffitiTex)w.graffitiTex=bakeGraffitiAtlas(w.config.layout);
 if(!w.flagTex)w.flagTex=bakeFlagTexture();
 updateBlimpSign();
 if(!w.shadow){w.shadow=target(1024,1024);gl.bindTexture(gl.TEXTURE_2D,w.shadow.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);w.shadowAt=-100;}
 const s=w.city,phase=s.phase,drift=params.drift,RM=window.__renderMode,fc=(!RM&&freeCam.active)?freeCam:null;
 const angle=fc?fc.aO:(s.angle+.055*organic(elapsed*.24,phase)*drift);
 const dist=fc?fc.aD:s.distance;
 const eye=[Math.sin(angle)*dist,fc?fc.aE:s.elevation,Math.cos(angle)*dist],focus=fc?[fc.aPX,1.05,fc.aPZ]:[organic(elapsed*.20,phase)*1.5*drift,1.05,organic(elapsed*.13,phase+2)*1.5*drift],fov=(37+.25*organic(elapsed*.34,phase+4))*Math.PI/180;const view=matMul(perspective(fov,width/height),lookAt(eye,focus));
 lastViewInv=mat4Inverse(view);lastFocalPx=(height*.5)/Math.tan(fov/2);
 gl.disable(gl.BLEND);gl.disable(gl.DITHER);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
 const tod=lightUI.tod,sunY=.22+1.03*tod; // time of day raises/lowers the sun
 if(elapsed-w.shadowAt>.12||Math.abs(t-w.shadowStory)>120){w.sun=norm3([-.68+.08*Math.sin(t*.000025+s.phase)+.035*Math.sin(t*.000041+1.7),sunY,.39+.025*Math.sin(t*.000031)+.01*Math.sin(t*.000053+2.1)]);
  // Texel-snapped shadow camera: the sun drifts a little between updates, and each
  // re-render used to shift the map by a fraction of a texel — the visible shimmer.
  // Snapping the eye so the world origin lands on whole shadow texels freezes it.
  let sEye=w.sun.map(v=>v*57);const sView=lookAt(sEye,[0,0,0]),sTex=68/1024;
  const sDX=sView[12]-Math.round(sView[12]/sTex)*sTex,sDY=sView[13]-Math.round(sView[13]/sTex)*sTex;
  sEye=[sEye[0]+sView[0]*sDX+sView[4]*sDY,sEye[1]+sView[1]*sDX+sView[5]*sDY,sEye[2]+sView[2]*sDX+sView[6]*sDY];
  w.light=matMul(ortho(34),lookAt(sEye,[0,0,0]));gl.bindFramebuffer(gl.FRAMEBUFFER,w.shadow.fb);gl.viewport(0,0,1024,1024);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);for(let i=1;i<8;i++)cityDraw(w.planes[i],photoPrograms.shadow,w.light,w.light,t,eye,w.sun,params,w);w.shadowAt=elapsed;w.shadowStory=t;}
 const duskK=Math.max(0,Math.min(1,(.55-tod)/.55)),dusk=duskK*duskK*(3-2*duskK); // low sun warms the sky
 gl.bindFramebuffer(gl.FRAMEBUFFER,dest.fb);gl.viewport(0,0,width,height);gl.clearColor(.67+.31*dusk,.78-.06*dusk,.82-.27*dusk,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);for(let i=1;i<8;i++)cityDraw(w.planes[i],photoPrograms.surface,view,w.light,t,eye,w.sun,params,w);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
}
// Screen-space ambient occlusion, kept phone-friendly: the depth pass is free
// (it is the main render's depth buffer, exposed as a texture), the AO runs at
// half resolution with a FIXED 12-tap kernel — no RNG, so seeds stay deterministic.


function computeAO(){
 aoAvailable=false;
 if(!aoTarget||!aoBlurTarget||!sceneTarget||!sceneTarget.depthTex||!lastViewInv||!lightUI.ao)return;
 if(!aoProgram)aoProgram=program(screenVert,aoFrag);
 if(!aoBlurProgram)aoBlurProgram=program(screenVert,aoBlurFrag);
 const p=aoProgram;gl.useProgram(p.p);
 sampler(p,'uDepth',sceneTarget.depthTex,5);matrix(p,'uInvVP',lastViewInv);
 uniform(p,'uTexel',[1/aoTarget.w,1/aoTarget.h]);
 uniform(p,'uNear',8);uniform(p,'uFar',160);uniform(p,'uFocalPx',lastFocalPx);
 uniform(p,'uRadiusW',1.5);uniform(p,'uIntensity',.62);
 gl.bindFramebuffer(gl.FRAMEBUFFER,aoTarget.fb);gl.viewport(0,0,aoTarget.w,aoTarget.h);gl.disable(gl.BLEND);screen(p);
 const b=aoBlurProgram;gl.useProgram(b.p);
 sampler(b,'uTex',aoTarget.tex,5);uniform(b,'uTexel',[1/aoBlurTarget.w,1/aoBlurTarget.h]);
 gl.bindFramebuffer(gl.FRAMEBUFFER,aoBlurTarget.fb);gl.viewport(0,0,aoBlurTarget.w,aoBlurTarget.h);screen(b);
 gl.viewport(0,0,width,height);
 aoAvailable=true;
}

function cityProgress(lot,time){const raw=(time-lot.birth)/lot.duration;return {height:ease(raw),complete:raw>=1.2,active:raw>=0&&raw<1.2}}
function makePlane(c,index,epoch=0){if(c.realm===1)return makeCityPlane(c,index);const realm=c.realm;const far=index<3;const r=rng(hash(c.layout+':plane:'+index+':'+(far?epoch:0)));const d=rng(hash(c.detail+':detail:'+index+':'+epoch));const m=new Mesh(),pal=realms[realm],depth=depths[index];const near=index>=6;let base=color(pal.fog,near?.12:mix(.30,.8,1-depth));const phase=r()*TAU;
 if(realm===0){
  if(index===3){m.set(phase);m.rect(-2.6,-.8,5.2,.64,[.013,.043,.051,1]);for(let i=0;i<180;i++){let x=d()*5.2-2.6,y=-.16-d()*.61,w=.008+d()*.12;m.set(d()*80,.025);m.line(x,y,x+w,y,.00045,[.18,.35,.33,.08+d()*.10]);if(i%5===0)m.disc(x,y,w*.3,.0008,[.14,.30,.32,.20],3)}for(let i=0;i<17;i++){const y=-.18-i*.016,x=pal.key[0]+(d()-.5)*.018;m.disc(x,y,.024+i*.008,.0013,color(pal.light,.52,.12*(1-i/20)),1)}}
  else{const count=near?6:index===1?34:index===2?22:12;for(let i=0;i<count;i++){let x=mix(-2.5,2.5,(i+.2+r()*.6)/count),y=-.17-(index-1)*.039;let h=(near?.76:.28+depth*.37)*(.6+r()*.7);if(near&&Math.abs(x)<.22)x+=x<0?-.37:.37;const w=h*(near?.034:.03),treePhase=d()*70;branch(m,r,x,y,h*.42,Math.PI*.5+(r()-.5)*.15,w,near?5:4,base,treePhase,true);roots(m,r,x,y,w,base,treePhase);for(let k=0;k<5;k++){const sy=y+h*(.45+k*.095),cw=h*(.35-k*.048);canopy(m,r,x+(r()-.5)*cw*.3,sy,cw,h*.095,base,treePhase+k*2.3)}if(!near){m.set(d()*80,.04);m.disc(x,y-.05,w*2,h*.13,color(base,.48,.28),2)}}
  if(index===5||near){for(let i=0;i<75;i++){const x=r()*5.2-2.6,y=-.42-r()*.15;branch(m,r,x,y,.035+r()*.075,1.57+(r()-.5)*.65,.002,1,base,d()*50,false)}}}
 }

 else if(realm===2){
  const y=index===1?-.05:index===2?-.12:index===3?-.27:-.17-depth*.26;terrain(m,r,y,index<3?.12:.075,base,phase);
  if(index<3){for(let i=0;i<9;i++)peak(m,r,r()*5.2-2.6,y-.035,.13+r()*.19,.05+r()*.20,base,d()*70)}
  for(let i=0;i<(near?12:22);i++){let x=r()*5.2-2.6,yy=y+(r()-.5)*.055,w=.03+r()*(near?.16:.08);if(near&&Math.abs(x)<.18)continue;rock(m,r,x,yy,w,w*(.27+r()*.50),base,d()*100)}
  if(index>=3&&index<=5){for(let i=0;i<10;i++){let x=r()*5.2-2.6,y0=y+.045;for(let j=0;j<12;j++){const nx=x+(r()-.5)*.055,ny=y0-.012-r()*.026;m.set(d()*90,.01);m.line(x,y0,nx,ny,.009,color(pal.accent,.7,.30),.006);m.line(x,y0,nx,ny,.0023,color(pal.light,1.3,.87),.0015);m.disc(x,y0,.037,.024,color(pal.accent,1,.06),1);x=nx;y0=ny}}}
 }
 else if(realm===3){
  if(index===1||index===2||index===4){for(let i=0;i<9;i++){const x=r()*5.4-2.7,y=-.19-r()*.12,w=.07+r()*.15,h=.10+r()*.19;peak(m,r,x,y,w,h,color(pal.fog,index===1?.78:.51),d()*80)}}
  const count=near?23:31;for(let i=0;i<count;i++){let x=r()*5.4-2.7,y=-.20+(r()-.5)*.18-depth*.13;const w=(near?.26:.15)+r()*.15,h=(near?.12:.075)+r()*.045;cloud(m,r,x,y,w,h,near?[.46,.55,.60]:color(pal.fog,1.15+depth*.16),d()*100,near)}
 }
 else if(realm===4){
  const y=-.16-depth*.27;terrain(m,r,y,.10,base,phase);
  for(let i=0;i<(near?16:34);i++){let x=r()*5.2-2.6,yy=y+(r()-.5)*.05,w=.025+r()*.09;if(near&&Math.abs(x)<.20)continue;rock(m,r,x,yy,w,w*(.5+r()),base,d()*100)}
  if(index===1||index===2||near){for(let i=0;i<17;i++){const x=r()*5.2-2.6,w=.035+r()*.085,tip=.25+r()*.21;m.set(d()*60,.015);m.polygon([[x-w,.75],[x+w,.75],[x+w*.53,.44],[x+w*.2,tip],[x-w*.18,tip+.075]],color(base,.75));}}
  if(!near){for(let i=0;i<(index<3?28:18);i++){const x=mix(-2.5,2.5,(i+r()*.8)/28),s=(index<3?.12:.23)*(.45+r()*.85);const shifted=[pal.accent[0]*(.75+d()*.45),pal.accent[1],pal.accent[2]*(.7+d()*.4)];mushroom(m,r,x,y+.005,s,shifted,d()*90)}}else{for(let i=0;i<6;i++){let x=r()*5.2-2.6;if(Math.abs(x)<.28)x+=.45;mushroom(m,r,x,y,.22+r()*.24,color(pal.accent,.13),d()*100)}}
  if(index===3||index===5){for(let i=0;i<110;i++){const x=d()*5.2-2.6,yy=y-d()*.20;m.set(d()*80,.015);m.line(x,yy,x+(d()-.5)*.035,yy+.005+d()*.024,.0005,color(pal.accent,.7,.20));}}
 }
 else{
  if(index===3){for(let i=0;i<100;i++){const x=r()*5.2-2.6,y=-.12-r()*.55;m.set(d()*80,.01,0,1);m.disc(x,y,.001,.0007,[.96,.65,.24,.16],1)}}
  else{const count=near?5:index<3?12:8;for(let i=0;i<count;i++){let x=r()*5.2-2.6,y=mix(-.05,.55,r()),s=(near?.054:index<3?.0015:.012)*(.6+r());if(near&&Math.abs(x)<.32)x+=.67;const col=near?[.027,.032,.039]:[.13,.17,.20];rock(m,r,x,y,s,s*.55,col,d()*100);m.set(d()*80,.12);m.line(x-s*.62,y+s*.28,x+s*.2,y+s*.39,s*.022,color(pal.light,.48,.6));if(index===5&&i===0){m.rect(x-s*2.8,y-s*.1,s*1.8,s*.6,[.034,.077,.12,1]);m.rect(x+s,y-s*.1,s*1.8,s*.6,[.034,.077,.12,1]);for(let k=0;k<5;k++){m.line(x-s*2.8+k*s*.36,y-s*.1,x-s*2.8+k*s*.36,y+s*.5,.0006,[.19,.28,.36,.5])}}}}
 }
 return m.upload();
}
function makeParticles(c,index){const r=rng(hash(c.detail+':particles:'+index)),m=new Mesh(),pal=realms[c.realm];const count=Math.round((c.realm===1?280:150)*1.5);for(let i=0;i<count;i++){const x=r()*5.2-2.6,y=r()*1.2-.6,phase=i+r();let s=.0006+r()*.0015;let col=pal.accent;m.set(phase,y,0,c.realm===1?2:3);if(c.realm===1){m.line(x,y,x-.0018,y-.017-r()*.018,.00035,color(pal.light,.52,.11));m.disc(x,y,.001,.004,color(pal.light,.6,.11),1)}else{if(c.realm===3){s*=1.8;col=pal.light}if(c.realm===5)s*=.6;m.disc(x,y,s*5,s*5,color(col,.8,.09),1);m.disc(x,y,s,s,color(col,1,c.realm===2?.28:c.realm===3?.15:.43),1)}}return m.upload()}
// The large story and the little motions have separate clocks. Accelerating the
// story moves weather, sunlight, growth and terrain; it never races the camera.
const arcs=[
 {names:['Before morning','Blue mist','First sunlight','The fog lifts','A rain front arrives','Silver water','Amber through the trees','Afterglow','Night returns'],day:[.02,.12,.58,.93,.42,.62,.76,.26,.035],mist:[.8,1.5,1.2,.38,1.6,.75,.4,.9,1.1],energy:[.6,.55,.45,.3,.35,.4,.65,.95,.75],growth:[.5,.5,.5,.5,.5,.5,.5,.5,.5]},
 {names:['First foundations','The avenue blocks rise','Cranes above the district','Glass joins the skyline','New neighborhoods connect','The tall towers open','The roof gardens open','The horizon fills in','Expansion continues'],day:[.32,.12,.03,.025,.07,.30,.74,.98,.72],mist:[.6,.8,1.5,1.1,.8,1.3,1.1,.55,.7],energy:[.8,1,1.2,.65,.3,.55,1,.65,.4],growth:[.5,.5,.5,.5,.5,.5,.5,.5,.5]},
 {names:['Heat under the crust','The first fissures','Rivers of light','Ash crosses the valley','The deep surge','Cooling stone','A wind through the ash','The last red seams','Heat below the surface'],day:[.08,.12,.30,.12,.40,.20,.12,.08,.06],mist:[.55,.7,.85,1.65,1.1,.8,1.3,.5,.6],energy:[.15,.5,.95,.6,1.35,.75,.3,.15,.12],growth:[.5,.5,.5,.5,.5,.5,.5,.5,.5]},
 {names:['Above the sleeping clouds','Gold at the horizon','The peaks emerge','Open blue','A cloud front closes in','Light behind the veil','The sky opens again','Long light','Above the evening sea'],day:[.2,.6,.92,1,.38,.55,.95,.65,.25],mist:[1.1,.9,.55,.32,1.7,1.25,.6,.5,.9],energy:[.3,.6,.8,.7,.25,.5,.9,.7,.35],growth:[.5,.5,.5,.5,.5,.5,.5,.5,.5]},
 {names:['The cave stirs','The first blue growth','Caps open to the dark','Spore season','A luminous canopy','Light travels underground','The drifting bloom','The grove settles','A new living floor'],day:[.03,.04,.05,.06,.09,.04,.08,.035,.02],mist:[.6,.8,.75,1.3,1.1,.8,1.5,1,.7],energy:[.2,.4,.65,.95,1.2,.65,1.05,.55,.35],growth:[.08,.2,.4,.65,.9,1,1.1,1.15,1.2]},
 {names:['The first atmospheric light','Sunrise on the limb','Above the day side','Continents in sunlight','The long terminator','Blue twilight','Cities on the night side','Across the dark ocean','The next dawn'],day:[.18,.60,.95,1,.55,.2,.025,.02,.24],mist:[.3,.4,.2,.2,.3,.45,.2,.2,.4],energy:[.45,.8,1,.75,.6,.5,.4,.35,.6],growth:[.5,.5,.5,.5,.5,.5,.5,.5,.5]}
];
function storyAt(c,t){const h=Math.max(0,t)/3600,k=Math.floor(h),f=ease(h-k),arc=arcs[c.realm];const values={};for(const name of ['day','mist','energy','growth']){const knot=i=>{if(i<=8)return arc[name][i];const r=rng(hash(c.layout+':hour:'+i+':'+name));return name==='growth'&&c.realm===4?.8+r()*.5:name==='mist'?.4+r()*1.2:name==='energy'?.2+r():r()};values[name]=mix(knot(k),knot(k+1),f)}const weatherPhase=(hash(c.layout+':front')%1000)/1000;values.front=(Math.sin(h*.87+weatherPhase*6)+.47*Math.sin(h*1.413+weatherPhase*9))*.9;values.warmth=(Math.sin(h*.59+.2)+.31*Math.sin(h*1.017+1.4))*.5;values.sun=h*.082;values.name=k<8?arc.names[k]:k===8?arc.names[8]:'Beyond the next horizon';return values}
const landscapeClock=t=>t*.1+elapsed*.9;
function build(c,time=0){const world={config:JSON.parse(JSON.stringify(c)),planes:[],particles:[],epoch:c.realm===1?0:Math.floor(landscapeClock(time)/360),next:null,born:time,city:c.realm===1?cityPlan(c):null};for(let i=1;i<8;i++)world.planes[i]=makePlane(c,i,world.epoch);if(c.realm!==1){world.particles[0]=makeParticles(c,0);world.particles[1]=makeParticles(c,1);}return world}
function disposeWorld(w){if(!w)return;if(w.shadow)dropTarget(w.shadow);if(w.materialTexture)gl.deleteTexture(w.materialTexture);if(w.billboardTex)gl.deleteTexture(w.billboardTex);if(w.foliageTex)gl.deleteTexture(w.foliageTex);w.planes.forEach(m=>m&&m.dispose());w.particles.forEach(m=>m.dispose());if(w.next)w.next.forEach(m=>m&&m.dispose())}
let current,previous=null,transitionStart=-100,worldTime=0,lastFrame=0,elapsed=0,playbackRate=60,TRANSITION_DUR=0.3,previewEnd=null,seeking=false,quality=1,qualityTarget=1,slowCount=0,goodCount=0,frames=0,smoothed={...defaults};
function commonUniforms(p,w,t,params){const c=w.config,pal=realms[c.realm],s=storyAt(c,t),motion=elapsed,phase=(hash(c.layout+':weather')%10000)*.01;const drift=params.drift;const fc2=(!window.__renderMode&&freeCam.active)?freeCam:null;const camera=[(organic(motion*.43,phase)*.009+organic(motion*.11,phase+2)*.015)*drift+(fc2?fc2.aCX:0),(organic(motion*.29,phase+4)*.003+organic(motion*.073,phase+1)*.005)*drift+(fc2?fc2.aCY:0)];const zoom=(1.+.015*organic(motion*.94,phase+5))*(fc2?fc2.aZK:1);const daylight=c.realm===4||c.realm===5?0:s.day;const warm=Math.max(0,s.warmth)*1.3;const key=pal.light.map((v,i)=>mix(v,[1,.76,.43][i],warm));uniform(p,'uSize',[width,height]);uniform(p,'uLens',params.focus*lightUI.tilt);uniform(p,'uCamera',camera);uniform(p,'uZoom',zoom);uniform(p,'uTime',motion);uniform(p,'uStory',t);uniform(p,'uDay',s.day);uniform(p,'uEnergy',s.energy);uniform(p,'uGrowth',s.growth);uniform(p,'uFront',s.front);uniform(p,'uRealm',c.realm);uniform(p,'uSeed',hash(c.detail)%8192);uniform(p,'uWeather',organic(motion*.82,phase));uniform(p,'uMist',params.mist*s.mist);uniform(p,'uGlow',params.glow*(.65+s.energy*.55));uniform(p,'uRays',params.rays*(.6+s.day*.9));uniform(p,'uSky',pal.sky.map((v,i)=>v*(1+daylight*.7)+key[i]*daylight*.43));uniform(p,'uFog',pal.fog.map((v,i)=>v+key[i]*daylight*.30));uniform(p,'uKey',key);uniform(p,'uKeyPos',[pal.key[0]+Math.sin(s.sun*2.3)*.27,pal.key[1]+Math.sin(s.sun*3.1)*.09])}
function drawMesh(m,depth,w,t,params,particle=false){const p=programs.mesh;gl.useProgram(p.p);commonUniforms(p,w,t,params);uniform(p,'uDepth',depth);const cut=m.count/12*quality*params.density/1.5;uniform(p,'uParticleCut',particle?cut:-1);gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);attribute(p,'aPos',2,64,0);attribute(p,'aColor',4,64,8);attribute(p,'aMeta',4,64,24);attribute(p,'aUV',2,64,40);attribute(p,'aBuild',4,64,48);gl.drawArrays(gl.TRIANGLES,0,particle?Math.min(m.count,Math.ceil(cut)*12):m.count)}
function composite(tex,dest,blur,opacity=1){gl.bindFramebuffer(gl.FRAMEBUFFER,dest.fb);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);const p=programs.composite;gl.useProgram(p.p);uniform(p,'uSize',[width,height]);uniform(p,'uBlur',blur);uniform(p,'uOpacity',opacity);sampler(p,'uTex',tex,0);screen(p)}
function mist(w,t,params,target,stage){gl.bindFramebuffer(gl.FRAMEBUFFER,target.fb);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);const p=programs.mist;gl.useProgram(p.p);commonUniforms(p,w,t,params);uniform(p,'uStage',stage);screen(p)}
// A tiny visitor is scheduled once per six-minute epoch, never a surprise cut.
function focalEvent(w,t,params,target,story=t){const eventSeed=hash(w.config.detail+':event:'+Math.floor(t/360));const r=rng(eventSeed);const start=125+r()*80,duration=42+r()*16,u=(t%360-start)/duration;if(u<0||u>1)return;const envelope=ease(u/.22)*ease((1-u)/.22);const m=new Mesh();const x=mix(-.85,.85,ease(u)),y=.08+r()*.14+organic(t*.8,eventSeed%70)*.003;const pal=realms[w.config.realm];m.set(eventSeed%99,.1);if(w.config.realm===0||w.config.realm===3){const wing=(Math.sin(t*.57)+.47*Math.sin(t*.917+1.3))*.0018;m.line(x-.006,y+wing,x,y,.0008,[.09,.13,.15,envelope*.48]);m.line(x,y,x+.006,y+wing,.0008,[.09,.13,.15,envelope*.48])}else{m.disc(x,y,.007,.003,color(pal.light,.9,envelope*.25),1);m.disc(x,y,.001,.001,color(pal.light,1,envelope*.7),1)}m.upload();gl.bindFramebuffer(gl.FRAMEBUFFER,target.fb);drawMesh(m,.25,w,story,params);m.dispose()}
function renderWorld(w,t,params,target){if(w.config.realm===1){renderPhotoCity(w,t,params,target);return;}gl.disable(gl.DEPTH_TEST);gl.bindFramebuffer(gl.FRAMEBUFFER,target.fb);gl.disable(gl.BLEND);gl.useProgram(programs.sky.p);commonUniforms(programs.sky,w,t,params);screen(programs.sky);
 const landscapeTime=w.config.realm===1?0:landscapeClock(t),cycle=Math.floor(landscapeTime/360),progress=landscapeTime%360;if(cycle!==w.epoch){if(w.next&&cycle===w.epoch+1){for(let i=1;i<=2;i++){w.planes[i].dispose();w.planes[i]=w.next[i]}w.next=null}else{if(w.next){w.next.forEach(m=>m&&m.dispose());w.next=null}for(let i=1;i<=2;i++){w.planes[i].dispose();w.planes[i]=makePlane(w.config,i,cycle)}}w.epoch=cycle;}
 if(progress>285&&!w.next){w.next=[];for(let i=1;i<=2;i++)w.next[i]=makePlane(w.config,i,w.epoch+1)}
 const fade=ease((progress-285)/75);const focus=.52+organic(elapsed*.29,hash(w.config.layout)%47)*.065;
 for(let i=1;i<8;i++){
  const depth=depths[i];const blur=(i>=6?mix(3.8,8,(depth-.88)/.24):i>=4?Math.abs(depth-focus)*17:.14)*params.focus*(height/900);
  const versions=i<3&&w.next?[[w.planes[i],1-fade],[w.next[i],fade]]:[[w.planes[i],1]];
  for(const[m,opacity]of versions){if(opacity<.0001)continue;gl.bindFramebuffer(gl.FRAMEBUFFER,layerTarget.fb);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);drawMesh(m,depth,w,t,params);if(i===4||i===5)drawMesh(w.particles[i-4],depth,w,t,params,true);composite(layerTarget.tex,target,blur,opacity)}
  if(i===3)mist(w,t,params,target,0);if(i===5){focalEvent(w,elapsed,params,target,t);mist(w,t,params,target,1)}
 }
}
// ---- Render mode (?render=1): one-tap fixed-step video export ----
// window.__renderMode (RM) is provided by the injected render controller.
// The controller calls __renderReset at the end of warmup so the recorded
// segment starts at a deterministic t=0. The seed is NOT re-rolled here:
// ?seed= is applied synchronously at boot by the Seed Console adapter, and
// config already carries it.
window.__renderReset=function(){
 if(previous){disposeWorld(previous);previous=null}
 if(current)disposeWorld(current);
 elapsed=0;worldTime=0;transitionStart=-100;blimpSignKey=''; // no cross-fade on reset; force blimp sign re-render (system font may have loaded since warmup; avoids stale fallback-font metrics)
 smoothed={...config.params}; // pin params; no stale smoothing
 quality=1;qualityTarget=1;slowCount=0;goodCount=0;frames=0;lastFrame=0;
 current=build(config,0); // rebuild world from current seeded config at t=0
 try{resize()}catch(e){} // rebuild framebuffer targets at RM.W x RM.H
};
// ---- Module interface ----
// window.__canalHooks exposes the studio internals the Seed Console adapter needs.
// (The original single file shared these as top-level script bindings; ES modules
// keep them module-private, so the adapter reads them through these hooks.)
// Added during modularization; existing window.__render* contracts are unchanged.
window.__canalHooks={
rng:rng,fresh:fresh,mix:mix,clamp:clamp,hash:hash,codeOf:codeOf,parseCode:parseCode,
cityFamily:cityFamily,changeWorld:changeWorld,disposeWorld:disposeWorld,syncLensUI:syncLensUI,
defaults:defaults,controls:controls,canvas:function(){return canvas;},
get config(){return config;},get smoothed(){return smoothed;},get current(){return current;},
get previous(){return previous;},set previous(v){previous=v;}};
function draw(now){
var RM=window.__renderMode;
if(RM){
 if(RM.paused||RM._bp||RM.phase==='done'||RM.phase==='cancelled'||RM.phase==='reset'){requestAnimationFrame(draw);return;}
 var rdt=1/RM.fps,rt=RM.frame/RM.fps;
 elapsed=rt;worldTime=rt; // absolute — no wall-clock, no performance.now() in draw path
 quality=1; // pin so adaptive quality can't degrade mid-render
 if(previewEnd!==null&&worldTime>=previewEnd){worldTime=previewEnd;previewEnd=null;playbackRate=1;$('pace').value='1';toast('Eight-hour preview complete. The world continues at ambient speed.');}
 if(frames%15===0)updateJourneyUI();frames++;
 /* param smoothing uses the fixed rdt factor; bypass document.hidden early-out */
 for(const c of controls)smoothed[c[0]]=mix(smoothed[c[0]],config.params[c[0]],1-Math.exp(-rdt/.10));
 const fade=ease((elapsed-transitionStart)/TRANSITION_DUR);renderWorld(current,worldTime,smoothed,sceneTarget);
 if(previous&&fade<1){if(!previous.frozen)renderWorld(previous,previous.savedTime+(elapsed-transitionStart),previous.config.params,oldTarget)}else if(previous){disposeWorld(previous);previous=null}
 if(config.realm===1)renderCityLens(fade);
 computeAO(); // depth pass -> half-res SSAO (same chain in live view and ?render=1 export)
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);const p=programs.post;gl.useProgram(p.p);commonUniforms(p,current,worldTime,smoothed);sampler(p,'uBlurred',lensTarget.tex,3);sampler(p,'uTex',sceneTarget.tex,0);sampler(p,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);sampler(p,'uAO',aoAvailable?aoBlurTarget.tex:aoTarget.tex,4);uniform(p,'uAOOn',aoAvailable?1:0);uniform(p,'uAA',1);if(sceneTarget.depthTex)sampler(p,'uDepth',sceneTarget.depthTex,7);uniform(p,'uHasDepth',sceneTarget.depthTex?1:0);uniform(p,'uMix',previous?fade:1);opticalUniforms(p);uniform(p,'uBend',lightUI.bend);uniform(p,'uGrain',smoothed.grain);uniform(p,'uPalette',smoothed.palette+((hash(config.layout+':palette')%1000)/1000-.5)*.45);screen(p);
 if(recording)updateRecording(now);
 if(RM.phase==='warmup'){RM.frame++;if(RM.frame>=RM.warmup&&RM.onPhase){try{RM.onPhase('reset')}catch(e){}}}
 else if(RM.phase==='record'){if(RM.onFrame){try{RM.onFrame(RM.frame)}catch(e){}}RM.frame++;if(RM.frame>=RM.totalFrames&&RM.onPhase){try{RM.onPhase('done')}catch(e){}}}
 requestAnimationFrame(draw);return;
}
if(contextLost)return;requestAnimationFrame(draw);const dt=lastFrame?Math.min((now-lastFrame)/1000,.15):0;lastFrame=now;if(document.hidden)return;elapsed+=dt;worldTime+=dt*playbackRate;if(previewEnd!==null&&worldTime>=previewEnd){worldTime=previewEnd;previewEnd=null;playbackRate=1;$('pace').value='1';toast('Eight-hour preview complete. The world continues at ambient speed.')}if(frames%15===0)updateJourneyUI();frames++;if(frames>120&&dt>0){if(dt>.023){slowCount++;goodCount=0}else{goodCount++;slowCount=Math.max(0,slowCount-1)}if(slowCount>120){qualityTarget=Math.max(.28,qualityTarget-.1);slowCount=0}if(goodCount>600){qualityTarget=Math.min(1,qualityTarget+.04);goodCount=0}}quality=mix(quality,qualityTarget,1-Math.exp(-dt/5));
 for(const c of controls)smoothed[c[0]]=mix(smoothed[c[0]],config.params[c[0]],1-Math.exp(-dt/.10));
 updateFreeCam(); // damped free-camera (live view only; ignored during ?render=1)
 const fade=ease((elapsed-transitionStart)/TRANSITION_DUR);renderWorld(current,worldTime,smoothed,sceneTarget);
 if(previous&&fade<1){if(!previous.frozen)renderWorld(previous,previous.savedTime+(elapsed-transitionStart),previous.config.params,oldTarget)}else if(previous){disposeWorld(previous);previous=null}
 if(config.realm===1)renderCityLens(fade);
 computeAO(); // depth pass -> half-res SSAO (same chain in live view and ?render=1 export)
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.disable(gl.BLEND);const p=programs.post;gl.useProgram(p.p);commonUniforms(p,current,worldTime,smoothed);sampler(p,'uBlurred',lensTarget.tex,3);sampler(p,'uTex',sceneTarget.tex,0);sampler(p,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);sampler(p,'uAO',aoAvailable?aoBlurTarget.tex:aoTarget.tex,4);uniform(p,'uAOOn',aoAvailable?1:0);uniform(p,'uAA',1);if(sceneTarget.depthTex)sampler(p,'uDepth',sceneTarget.depthTex,7);uniform(p,'uHasDepth',sceneTarget.depthTex?1:0);uniform(p,'uMix',previous?fade:1);opticalUniforms(p);uniform(p,'uBend',lightUI.bend);uniform(p,'uGrain',smoothed.grain);uniform(p,'uPalette',smoothed.palette+((hash(config.layout+':palette')%1000)/1000-.5)*.45);screen(p);
 if(recording)updateRecording(now);
}
function changeWorld(next,resetClock=true){next=canonical(next);const made=build(next,resetClock?0:worldTime);snapshotWorld();if(previous)disposeWorld(previous);previous=current;if(previous)previous.frozen=true;if(previous)previous.savedTime=worldTime;current=made;config=next;if(resetClock){worldTime=0;if(playbackRate===120)previewEnd=28800}transitionStart=elapsed;remember(config);syncUI();updateJourneyUI();return true}
function updateJourneyUI(){if(seeking)return;const s=storyAt(config,worldTime);$('chapterName').textContent=s.name;const h=Math.floor(worldTime/3600),m=Math.floor(worldTime/60)%60;$('journeyClock').value=h+':'+String(m).padStart(2,'0')+' / 8:00';if(!seeking)$('journeySeek').value=Math.min(worldTime,28800);$('journeyHint').textContent=playbackRate===1?'Ambient pace · the world keeps moving.':playbackRate===120?'Eight-hour preview · four minutes.':playbackRate===60?'Eight hours unfold in eight minutes.':'Eight hours unfold in twenty minutes.';if(config.realm===1&&current){let complete=0,rising=0;for(const plane of current.planes)for(const lot of plane?.lots||[]){const state=cityProgress(lot,worldTime);if(state.complete)complete++;else if(state.active)rising++;}$('journeyHint').textContent=complete+' buildings complete · '+rising+' rising · '+playbackRate+'×';}}
function seekJourney(time){if(previous){toast('The scene is blending — one sec…');return false}time=clamp(time,0,28800);const made=build(config,time);previous=current;previous.savedTime=worldTime;current=made;worldTime=time;transitionStart=elapsed;if(playbackRate===120)previewEnd=28800;updateJourneyUI();return true}
$('pace').onchange=()=>{const requested=+$('pace').value;if(![1,24,60,120].includes(requested))return;if(requested===120&&worldTime>1){if(!seekJourney(0)){$('pace').value=String(playbackRate);return}}playbackRate=requested;previewEnd=requested===120?28800:null;updateJourneyUI()};
$('restartJourney').onclick=()=>seekJourney(0);
$('journeySeek').oninput=()=>{seeking=true;const t=+$('journeySeek').value;$('chapterName').textContent=storyAt(config,t).name;$('journeyClock').value=Math.floor(t/3600)+':'+String(Math.floor(t/60)%60).padStart(2,'0')+' / 8:00'};
$('journeySeek').onchange=()=>{const t=+$('journeySeek').value;seeking=false;seekJourney(t);updateJourneyUI()};
function syncLensUI(){const l=cleanLens(config.lens);config.lens=l;$('openLens').disabled=config.realm!==1;$('lensDescription').textContent=lensLooks[l.mode].description;lensLooks.forEach((v,i)=>$('lens-'+i)?.setAttribute('aria-pressed',String(i===l.mode)));$('lensAmount').value=config.params.focus;$('lensAmountValue').value=config.params.focus.toFixed(2);$('lensPosition').value=l.position;$('lensPositionValue').value=Math.round(l.position*100)+'%';$('lensWidth').value=l.width;$('lensWidthValue').value=Math.round(l.width*100)+'%';}
function applyLens(){config.lens=cleanLens(config.lens);current.config.lens={...config.lens};if(previous){disposeWorld(previous);previous=null;}syncLensUI();$('seedInput').value=codeOf(config);}
lensLooks.forEach((look,i)=>{const b=document.createElement('button');b.id='lens-'+i;b.setAttribute('aria-pressed','false');const title=document.createElement('strong'),note=document.createElement('small');title.textContent=look.name;note.textContent=look.note;b.append(title,note);b.onclick=()=>{config.lens={...cleanLens(config.lens),mode:i,width:look.width};applyLens();remember(config);};$('lensPresets').append(b);});
$('lensPosition').oninput=()=>{config.lens={...cleanLens(config.lens),position:+$('lensPosition').value};applyLens();};
$('lensWidth').oninput=()=>{config.lens={...cleanLens(config.lens),width:+$('lensWidth').value};applyLens();};
$('lensAmount').oninput=()=>{config.params.focus=+$('lensAmount').value;smoothed.focus=config.params.focus;current.config.params.focus=config.params.focus;applyLens();$('slider-focus').value=config.params.focus;$('value-focus').value=config.params.focus.toFixed(2);};
for(const id of ['lensPosition','lensWidth','lensAmount'])$(id).onchange=()=>{config=canonical(config);remember(config);syncUI();};
// Light drawer: three plain sliders + the AO switch. Session state only —
// the same seed always renders the same image for the same slider positions.
function syncLightUI(){$('lightSun').value=lightUI.sun;$('lightSunV').value=(+lightUI.sun).toFixed(2);$('lightAmb').value=lightUI.amb;$('lightAmbV').value=(+lightUI.amb).toFixed(2);$('lightTod').value=lightUI.tod;$('lightTodV').value=(+lightUI.tod).toFixed(2);$('lightAO').checked=lightUI.ao;$('lightTilt').value=lightUI.tilt;$('lightTiltV').value=(+lightUI.tilt).toFixed(2);$('lightBend').value=lightUI.bend;$('lightBendV').value=(+lightUI.bend).toFixed(3);$('lightBlimpMsg').value=lightUI.blimpMsg;}
$('lightSun').oninput=()=>{lightUI.sun=+$('lightSun').value;$('lightSunV').value=lightUI.sun.toFixed(2)};
$('lightAmb').oninput=()=>{lightUI.amb=+$('lightAmb').value;$('lightAmbV').value=lightUI.amb.toFixed(2)};
$('lightTod').oninput=()=>{lightUI.tod=+$('lightTod').value;$('lightTodV').value=lightUI.tod.toFixed(2)};
$('lightAO').onchange=()=>{lightUI.ao=$('lightAO').checked};
$('lightTilt').oninput=()=>{lightUI.tilt=+$('lightTilt').value;$('lightTiltV').value=lightUI.tilt.toFixed(2)};
$('lightBend').oninput=()=>{lightUI.bend=+$('lightBend').value;$('lightBendV').value=lightUI.bend.toFixed(3)};
$('lightBlimpMsg').oninput=()=>{lightUI.blimpMsg=$('lightBlimpMsg').value;blimpSignKey='';};
function syncUI(){syncLensUI();const pal=realms[config.realm];$('realmName').textContent=config.realm===1?cityPlan(config).name:pal.name;$('realmMood').textContent=pal.mood;$('seedMark').textContent=(config.layout>>>0).toString(36).toUpperCase()+' · '+(config.detail>>>0).toString(36).toUpperCase();$('seedInput').value=codeOf(config);document.querySelectorAll('[data-realm]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.realm===config.realm)));for(const c of controls){$('label-'+c[0]).textContent=config.realm===1?cityControlNames[c[0]]:c[1];$('slider-'+c[0]).value=config.params[c[0]];$('value-'+c[0]).value=config.params[c[0]].toFixed(2);$('lock-'+c[0]).setAttribute('aria-pressed',String(!!config.locks[c[0]]));$('lock-'+c[0]).textContent=config.locks[c[0]]?'Locked':'Lock'}}
function showHistory(){const root=$('historyList');root.replaceChildren();const values=history.filter(v=>!favoritesOnly||v.star);if(!values.length){const p=document.createElement('p');p.textContent='Star a seed to collect your favorite places.';root.append(p)}for(const v of values){const row=document.createElement('div');row.className='history-item';const star=document.createElement('button');star.className='star';star.textContent=v.star?'★':'☆';star.setAttribute('aria-label',v.star?'Unstar seed':'Star seed');star.onclick=()=>{v.star=!v.star;persist();showHistory()};const restore=document.createElement('button');restore.className='restore';const label=document.createElement('strong');label.textContent=realms[v.realm].name;const seed=document.createElement('small');seed.textContent=v.code;restore.append(label,seed);restore.onclick=()=>{const c=parseCode(v.code);if(c){c.locks={...v.locks};changeWorld(c)}};row.append(star,restore);root.append(row)}}
for(const c of controls){const wrap=document.createElement('div'),label=document.createElement('label');label.className='slider-label';label.htmlFor='slider-'+c[0];const name=document.createElement('span');name.id='label-'+c[0];name.textContent=c[1];const output=document.createElement('output');output.id='value-'+c[0];const lock=document.createElement('button');lock.id='lock-'+c[0];lock.className='lock';lock.type='button';lock.setAttribute('aria-label','Lock '+c[1]+' during Remix');lock.onclick=e=>{e.preventDefault();config.locks[c[0]]=!config.locks[c[0]];remember(config);syncUI()};label.append(name,output,lock);const input=document.createElement('input');input.type='range';input.id='slider-'+c[0];input.min=c[2];input.max=c[3];input.step=.001;input.value=c[4];input.oninput=()=>{config.params[c[0]]=+input.value;smoothed[c[0]]=+input.value;if(c[0]==='focus')syncLensUI();current.config.params[c[0]]=+input.value;if(previous){disposeWorld(previous);previous=null;}output.value=(+input.value).toFixed(2);$('seedInput').value=codeOf(config)};input.onchange=()=>{config=canonical(config);current.config.params={...config.params};if(c[0]==='density'&&config.realm!==1){const old=current.particles;current.particles=[makeParticles(config,0),makeParticles(config,1)];old.forEach(m=>m.dispose())}remember(config);syncUI()};wrap.append(label,input);$('sliders').append(wrap)}
$('random').onclick=()=>{const r=rng(fresh()),params={...defaults};for(const c of controls)params[c[0]]=c[0]==='grain'?.35+r()*.4:c[0]==='palette'?(r()-.5)*1.2:mix(c[2],c[3],.25+r()*.5);let layout=fresh();if(config.realm===1){for(let attempt=0;attempt<64&&cityFamily(layout)===cityFamily(config.layout);attempt++)layout=fresh();while(cityFamily(layout)===cityFamily(config.layout))layout=(layout+1)>>>0;}changeWorld({realm:config.realm,layout,detail:fresh(),params,lens:config.lens,locks:{...config.locks}})};
$('remix').onclick=()=>{const r=rng(fresh()),params={...config.params};for(const c of controls)if(!config.locks[c[0]])params[c[0]]=clamp(params[c[0]]+(r()-.5)*(c[3]-c[2])*.28,c[2],c[3]);changeWorld({...config,detail:fresh(),params},false)};
$('applySeed').onclick=()=>{const text=$('seedInput').value.trim();if(!text)return;const parsed=parseCode(text);if(/^PX1-/i.test(text)&&!parsed){toast('That seed code is incomplete. Paste the entire PX1 code.');return}changeWorld(parsed||{realm:config.realm,layout:hash(text),detail:hash(text+':details'),params:{...defaults},lens:config.lens,locks:{...config.locks}})};
$('seedInput').onkeydown=e=>{if(e.key==='Enter')$('applySeed').click()};
$('favorites').onclick=()=>{favoritesOnly=!favoritesOnly;$('favorites').setAttribute('aria-pressed',String(favoritesOnly));showHistory()};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
$('exportSeeds').onclick=()=>download(new Blob([JSON.stringify({instrument:'CANAL METROPOLIS',version:1,seeds:history},null,2)],{type:'application/json'}),'canal-metropolis-seeds.json');
let hideTimer;function scheduleHide(){clearTimeout(hideTimer);if(!document.querySelector('.drawer.open'))hideTimer=setTimeout(()=>setHidden(true),18000)}
function setHidden(h){document.body.classList.toggle('hidden',h);const hidden=document.body.classList.contains('hidden');document.querySelectorAll('.chrome').forEach(e=>{e.inert=hidden});if(!hidden)scheduleHide()}
$('hide').onclick=()=>setHidden(true);canvas.onclick=()=>setHidden(!document.body.classList.contains('hidden'));
// Free-camera input: drag to orbit, pinch/wheel to zoom, two-finger drag (or
// Shift/right-drag with a mouse) to pan. A real drag swallows the click so it
// doesn't also toggle the chrome.
var camPointers=new Map(),camPinch0=0,camMid0=null,camMoved=false,camDrag=0;
canvas.addEventListener('click',function(e){if(camMoved){camMoved=false;e.stopImmediatePropagation();e.preventDefault();}},true);
function camXY(e){var r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];}
canvas.addEventListener('pointerdown',function(e){
 if(window.__renderMode||!camTakeover())return;
 try{canvas.setPointerCapture(e.pointerId)}catch(_){}
 camPointers.set(e.pointerId,camXY(e));camDrag=0;
 if(camPointers.size===2){var p=[...camPointers.values()];camPinch0=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])||1;camMid0=[(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2];}
});
canvas.addEventListener('pointermove',function(e){
 if(window.__renderMode||!camPointers.has(e.pointerId))return;
 var prev=camPointers.get(e.pointerId),pos=camXY(e);
 camPointers.set(e.pointerId,pos);
 var dx=pos[0]-prev[0],dy=pos[1]-prev[1];
 camDrag+=Math.abs(dx)+Math.abs(dy);if(camDrag>8)camMoved=true;
 if(camPointers.size===1){
  var pan=e.pointerType==='mouse'&&(e.shiftKey||(e.buttons&2));
  if(pan){freeCam.tPX=clamp(freeCam.tPX-dx*.02*(freeCam.tD/30),-20,20);freeCam.tPZ=clamp(freeCam.tPZ-dy*.02*(freeCam.tD/30),-20,20);}
  else{freeCam.tO-=dx*.0052;freeCam.tE=clamp(freeCam.tE+dy*.12,3,60);}
  freeCam.tCX=clamp(freeCam.tCX-dx*.00012,-.12,.12);freeCam.tCY=clamp(freeCam.tCY+dy*.00012,-.12,.12);
 }else if(camPointers.size===2){
  var q=[...camPointers.values()];
  var d=Math.hypot(q[0][0]-q[1][0],q[0][1]-q[1][1])||1,mid=[(q[0][0]+q[1][0])/2,(q[0][1]+q[1][1])/2];
  if(camPinch0>0){var sc=camPinch0/d;freeCam.tD=clamp(freeCam.tD*sc,14,60);freeCam.tZK=clamp(freeCam.tZK*sc,.45,3);}
  camPinch0=d;
  if(camMid0){freeCam.tPX=clamp(freeCam.tPX-(mid[0]-camMid0[0])*.02*(freeCam.tD/30),-20,20);freeCam.tPZ=clamp(freeCam.tPZ-(mid[1]-camMid0[1])*.02*(freeCam.tD/30),-20,20);}
  camMid0=mid;
 }
});
function camEnd(e){camPointers.delete(e.pointerId);if(camPointers.size<2){camPinch0=0;camMid0=null;}if(camPointers.size===0)camDrag=0;}
canvas.addEventListener('pointerup',camEnd);
canvas.addEventListener('pointercancel',camEnd);
canvas.addEventListener('wheel',function(e){
 if(window.__renderMode||!camTakeover())return;
 e.preventDefault();
 var z=Math.exp(e.deltaY*.0011);
 freeCam.tD=clamp(freeCam.tD*z,14,60);freeCam.tZK=clamp(freeCam.tZK*z,.45,3);
},{passive:false});
canvas.addEventListener('contextmenu',function(e){if(freeCam.active)e.preventDefault();});
$('camReset').onclick=()=>{freeCam.active=false;freeCam.lastT=-1;$('camReset').hidden=true;};
document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;if(e.key.toLowerCase()==='h'||e.key==='Escape')setHidden(!document.body.classList.contains('hidden'));if(e.key.toLowerCase()==='f')$('fullscreen').click()});
document.querySelectorAll('[data-drawer]').forEach(b=>b.onclick=()=>{const was=$(b.dataset.drawer).classList.contains('open');document.querySelectorAll('.drawer').forEach(e=>e.classList.remove('open'));document.querySelectorAll('[data-drawer]').forEach(e=>e.setAttribute('aria-expanded','false'));if(!was){$(b.dataset.drawer).classList.add('open');b.setAttribute('aria-expanded','true');if(b.dataset.drawer==='library')showHistory()}scheduleHide()});
document.querySelector('.dock').addEventListener('pointerdown',scheduleHide);
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(canvas.parentElement.requestFullscreen)await canvas.parentElement.requestFullscreen();else toast('Fullscreen is controlled by this browser. Hide the controls for a clean view.')}catch(e){toast('Fullscreen is unavailable here. Tap Disappear to hide the controls.')}};
// Recording never draws a DOM node into the scene. Dimensions stay fixed until capture ends.
const mimeCandidates=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
let recorder=null,stream=null,chunks=[],recordStart=0,recordLimit=0,recordBlob=null,recordFile=null,recordURL=null,wakeLock=null,recordTimer=null,recordError=false;
const recordSupported=!!(canvas.captureStream&&globalThis.MediaRecorder);let preferredMime='';if(recordSupported)preferredMime=mimeCandidates.find(m=>MediaRecorder.isTypeSupported(m))||'';
if(!recordSupported){$('startRecord').disabled=true;$('recordInfo').textContent='This browser cannot record a canvas. Open this file in a browser with canvas capture and MediaRecorder support.'}
async function keepAwake(){try{if(navigator.wakeLock&&!wakeLock)wakeLock=await navigator.wakeLock.request('screen')}catch(e){/* Optional enhancement; capture works without it. */}}
function releaseAwake(){if(wakeLock){wakeLock.release().catch(()=>{});wakeLock=null}}
function stopRecording(){if(recorder&&recorder.state!=='inactive'){recorder.stop();$('startRecord').disabled=true;$('recordState').textContent='Preparing file…'}}
function updateRecording(now){const seconds=(now-recordStart)/1000;const h=Math.floor(seconds/3600),m=Math.floor(seconds/60)%60,s=Math.floor(seconds)%60;$('recordState').textContent=(h?h+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');if(recordLimit&&seconds>=recordLimit)stopRecording()}
async function shareFile(){if(!recordFile)return false;try{if(navigator.canShare&&navigator.canShare({files:[recordFile]})){await navigator.share({files:[recordFile],title:'CANAL METROPOLIS'});return true}}catch(e){if(e.name==='AbortError')return false}return false}
function completed(){recording=false;clearInterval(recordTimer);document.body.classList.remove('recording');if(stream)stream.getTracks().forEach(t=>t.stop());releaseAwake();$('startRecord').disabled=false;$('startRecord').textContent='Start recording';$('duration').disabled=false;const type=recorder.mimeType||preferredMime||'video/webm';if(chunks.length){recordBlob=new Blob(chunks,{type});chunks=[];const ext=type.includes('mp4')?'mp4':'webm',name='canal-metropolis-'+realms[config.realm].name.toLowerCase().replace(/ /g,'-')+'-'+Date.now()+'.'+ext;recordFile=new File([recordBlob],name,{type});if(recordURL)URL.revokeObjectURL(recordURL);recordURL=URL.createObjectURL(recordBlob);$('downloadRecording').href=recordURL;$('downloadRecording').download=name;$('fileInfo').textContent=(recordBlob.size/1048576).toFixed(1)+' MB · '+canvas.width+' × '+canvas.height+' · '+ext.toUpperCase();$('ready').style.display='block';$('recordState').textContent=recordError?'Partial capture saved':'Ready to save';setHidden(false);document.querySelectorAll('.drawer').forEach(e=>e.classList.remove('open'));$('record').classList.add('open');document.querySelector('[data-drawer="record"]').setAttribute('aria-expanded','true');clearTimeout(hideTimer);shareFile().then(shared=>{if(!shared)toast('Recording ready. Tap Share / Save to Files or Download.')})}else{$('recordState').textContent='No video was produced. Try another browser.'}resize()}
$('startRecord').onclick=async()=>{if(recording){stopRecording();return}if(!recordSupported)return;try{stream=canvas.captureStream(30);const options={videoBitsPerSecond:Math.round(clamp(canvas.width*canvas.height*6,4000000,16000000))};if(preferredMime)options.mimeType=preferredMime;recorder=new MediaRecorder(stream,options);chunks=[];recordError=false;recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};recorder.onstop=completed;recorder.onerror=()=>{recordError=true;toast('Capture was interrupted. Preparing the available video.');if(recorder.state!=='inactive')stopRecording()};recorder.start(1000);recordStart=performance.now();recordLimit=+$('duration').value;recording=true;document.body.classList.add('recording');$('startRecord').textContent='Stop recording';$('duration').disabled=true;$('recordInfo').textContent=canvas.width+' × '+canvas.height+' · 30 fps capture · '+(preferredMime.includes('mp4')?'MP4':preferredMime?'WebM':'browser format')+' · '+playbackRate+'× journey · real-time recording duration';$('ready').style.display='none';keepAwake();recordTimer=setInterval(()=>{if(recording)updateRecording(performance.now())},250)}catch(e){if(stream)stream.getTracks().forEach(t=>t.stop());recording=false;toast('Recording could not start: '+e.message)}};
$('shareRecording').onclick=async()=>{if(!await shareFile())toast('Use Download recording if file sharing is unavailable.')};
window.addEventListener('resize',()=>{if(!contextLost)resize()});document.addEventListener('visibilitychange',()=>{lastFrame=0;releaseAwake();if(!document.hidden)keepAwake()});document.addEventListener('pointerdown',()=>{if(!document.hidden)keepAwake()},{passive:true});
window.addEventListener('beforeunload',e=>{if(recording){e.preventDefault();e.returnValue=''}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;if(recording)stopRecording();notice('The graphics context was interrupted. Reload to reopen this seed: '+codeOf(config))});
canvas.addEventListener('webglcontextrestored',()=>{notice('Graphics are available again. Reload this file to resume the instrument.')});
config=canonical(config);smoothed={...config.params};resize();current=build(config);remember(config);syncUI();syncLightUI();updateJourneyUI();requestAnimationFrame(draw);scheduleHide();keepAwake();
