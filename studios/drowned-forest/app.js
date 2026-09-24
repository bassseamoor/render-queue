// Drowned Forest — studio core (from drowned-forest.html block 0;
// shader sources live in ./shaders.js).
import {vert,frag,screenVert,common,compositeFrag,opticalGLSL,cityLensFrag,citySnapshotFrag,cityVertex,cityFragment,cityShadowFragment} from './shaders.js';

'use strict';
/* DROWNED FOREST / 1.0 — no assets, dependencies, or network.
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
 {name:'Canopy Glow',note:'Luminous, dreamy softness',description:'A luminous haze over the whole forest. Trunks stay readable while mist and light melt into a soft glow.',shape:0,floor:2.2,radius:12,width:.20,edge:0},
 {name:'Tilt-shift Glade',note:'Crisp slice, soft surroundings',description:'A crisp band of focus through the glade, falling smoothly into soft ferns below and canopy above.',shape:0,floor:0,radius:14,width:.13,edge:.14},
 {name:'Firefly Portrait',note:'An island of focus',description:'A soft oval of focus around the heart of the scene, the edges falling gently away like dusk.',shape:1,floor:.3,radius:16,width:.19,edge:.05},
 {name:'Mist Veil',note:'Heavy, silvery dream',description:'A heavy blanket of silver softness. Silhouettes and shafts of light stay clear while fine detail dissolves.',shape:0,floor:3.8,radius:16,width:.24,edge:0},
 {name:'Fern Macro',note:'Macro-thin slice',description:'A macro-thin slice of sharpness, like kneeling close to the ferns while the forest blurs into color.',shape:0,floor:.1,radius:18,width:.09,edge:.18},
 {name:'Deepwood Calm',note:'Quiet, watchful clarity',description:'A broad, calm field of detail with only a breath of edge softness — for watching the forest move.',shape:0,floor:0,radius:5,width:.34,edge:.10}
];
function cleanLens(l){l=l||{};return{mode:clamp(Math.round(Number(l.mode)||0),0,lensLooks.length-1),position:Math.round(clamp(Number.isFinite(l.position)?l.position:.56,.15,.85)*1000)/1000,width:Math.round(clamp(Number.isFinite(l.width)?l.width:.17,.04,.36)*1000)/1000};}
function lensCode(c){const l=cleanLens(c.lens);return '-L'+[l.mode,Math.round(l.position*1000),Math.round(l.width*1000)].map(n=>n.toString(36)).join('.');}
const defaults=Object.fromEntries(controls.map(c=>[c[0],c[4]]));
let history=[],storageOK=true,favoritesOnly=false;
try{const saved=JSON.parse(localStorage.getItem('drowned-forest-seeds-v1')||'[]');if(Array.isArray(saved))history=saved.filter(v=>v&&typeof v.code==='string'&&Number.isFinite(v.realm)).map(v=>({...v,realm:clamp(v.realm|0,0,5)}))}catch(e){storageOK=false}
let config={realm:0,layout:fresh(),detail:fresh(),params:{...defaults},locks:{},lens:cleanLens()};
function codeOf(c){return 'PX1-'+c.realm+'-'+(c.layout>>>0).toString(36)+'-'+(c.detail>>>0).toString(36)+'-'+controls.map(k=>Math.round((c.params[k[0]]-k[2])/(k[3]-k[2])*1000).toString(36)).join('.')+lensCode(c)}
function parseCode(code){const m=/^PX1-([0-5])-([a-z0-9]+)-([a-z0-9]+)-([a-z0-9.]+)(?:-L([a-z0-9.]+))?$/i.exec(code.trim());if(!m)return null;const values=m[4].split('.');if(values.length!==controls.length)return null;const layout=parseInt(m[2],36),detail=parseInt(m[3],36);if(layout>4294967295||detail>4294967295)return null;const params={};for(let i=0;i<controls.length;i++){const v=parseInt(values[i],36);if(!Number.isFinite(v)||v<0||v>1000)return null;params[controls[i][0]]=mix(controls[i][2],controls[i][3],v/1000)}let lens={mode:1,position:.56,width:.14};if(m[5]){const v=m[5].split('.').map(n=>parseInt(n,36));if(v.length!==3||v.some(n=>!Number.isFinite(n))||v[0]<0||v[0]>=lensLooks.length||v[1]<150||v[1]>850||v[2]<40||v[2]>360)return null;lens=cleanLens({mode:v[0],position:v[1]/1000,width:v[2]/1000});}return{realm:0,layout,detail,params,lens,locks:{...config.locks}}}
function canonical(c){const n=parseCode(codeOf(c));n.locks={...c.locks};return n}
function persist(){try{localStorage.setItem('drowned-forest-seeds-v1',JSON.stringify(history));storageOK=true}catch(e){storageOK=false;toast('Browser storage is full or unavailable. Export seeds to keep them.')} $('historyNote').textContent=storageOK?'Every new world is remembered on this browser. Seed storage is local to this browser and file.':'These seeds are in memory only. Export seeds to keep a copy.'}
function remember(c){const code=codeOf(c);const existing=history.find(v=>v.code===code);if(existing){existing.locks={...c.locks};existing.visited=Date.now()}else history.unshift({code,realm:c.realm,star:false,created:Date.now(),locks:{...c.locks}});persist();if($('library').classList.contains('open'))showHistory()}
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4500)}
function notice(message){$('notice').textContent=message;$('notice').style.display='block'}
const canvas=$('scene');
window.__renderCanvas=canvas; // render-mode hook (controller reads this before its own takeover)
const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
if(!gl){notice('This place needs WebGL. Open the HTML in a browser with hardware graphics enabled.');throw new Error('WebGL unavailable')}




const skyFrag=common+`
void main(){vec2 p=world();vec2 q=p;float phase=uSeed*.001;vec2 key=uKeyPos;float weather=1.+.03*uWeather;
 float clouds=fbm(p*3.4+vec2(uStory*.000035,-uStory*.000017)+phase);
 vec3 col=mix(uSky*.43,uFog*.75,(1.-smoothstep(-.5,.5,p.y)));
 col+=uFog*.075*clouds;float halo=exp(-length((p-key)*vec2(1.,1.1))*5.);col+=uKey*halo*.085*uGlow;
 if(uRealm<.5){float d=length(p-key);col+=uKey*(.54+uDay*.9)*(1.-smoothstep(.0245,.026,d));col+=uKey*(.07+uDay*.12)*exp(-d*16.)*uGlow;col*=1.-.1*clouds;}
 else if(uRealm<1.5){col+=vec3(.21,.08,.24)*exp(-abs(p.y+.11)*7.);col+=uKey*.018*pow(clouds,2.);}
 else if(uRealm<2.5){col+=vec3(.24,.045,.009)*exp(-abs(p.y+.13)*9.)*(.94+.06*clouds);col*=.9+clouds*.15;}
 else if(uRealm<3.5){col=mix(uSky,uFog,(1.-smoothstep(-.2,.44,p.y)));col+=uKey*(.09+uDay*.20)*halo;col+=uKey*(.6+uDay*1.4)*(1.-smoothstep(.039,.043,length(p-key)));col+=uKey*.10*pow(clouds,3.);}
 else if(uRealm<4.5){col*=.43;col+=uKey*exp(-length(p-vec2(-.2,-.05))*4.)*.025;}
 else {col=uSky*(.6+clouds*.28);vec2 center=vec2(-.12,-1.10);float radius=1.10;float d=length(p-center)-radius;float limb=exp(-abs(d)*95.);vec2 planetXY=(p-center)/radius;vec3 normal=vec3(planetXY,sqrt(max(0.,1.-dot(planetXY,planetXY))));float orbit=uStory/28800.*6.2831853-.8;vec3 sunlight=normalize(vec3(cos(orbit),.34,sin(orbit)));float day=smoothstep(-.15,.22,dot(normal,sunlight));vec3 land=mix(vec3(.012,.065,.105),vec3(.06,.14,.18),fbm(p*18.+phase));float cloudMap=smoothstep(.49,.68,fbm(p*13.+vec2(uStory*.000009,0.)+phase));land=mix(land,vec3(.27,.39,.45),cloudMap*.6);land*=.07+day*.93;float nightLights=pow(n(p*290.+phase),24.)*(1.-day);land+=vec3(.72,.42,.15)*nightLights*.25;col=mix(land,col,smoothstep(-.002,.002,d));col+=mix(vec3(.13,.45,.86),uKey,pow(day,18.))*limb*.51*uGlow;col+=uKey*exp(-length((p-vec2(.26,-.052))*vec2(1.,3.))*23.)*.39;}
 // Seeded star field, with sub-percent stellar scintillation at private phases.
 if(uRealm<.5||uRealm>4.5){vec2 cell=p*330.;vec2 id=floor(cell);vec2 offset=vec2(hash2(id+uSeed),hash2(id+13.+uSeed));float star=pow(max(0.,1.-length(fract(cell)-offset)*2.8),8.);float keep=step(.992,hash2(id+phase));float visible=uRealm>4.5?smoothstep(-.01,.10,p.y):smoothstep(.1,.35,p.y);col+=vec3(.62,.74,.83)*star*keep*visible*(.55+.05*b(uTime,offset.x*60.));}
 col*=weather*(1.+.016*b(uTime*.73,phase+p.x*.8));gl_FragColor=vec4(col,1.);
}`;
const mistFrag=common+`uniform float uStage;
void main(){vec2 p=world();float phase=uSeed*.001;vec2 flow=vec2(uTime*.00019,-uTime*.000047);
 float low=fbm(p*vec2(2.7,5.2)+flow+phase);float high=fbm(p*vec2(6.1,9.3)-flow*1.47+phase+41.);
 float belt=exp(-pow((p.y+.14+uStage*.025)*3.9,2.));if(uRealm>4.5)belt*=.08;
 float breathing=1.+.10*b(uTime*.8,phase+p.x);float a=(low*.062+high*.023)*belt*uMist*breathing;
 float front=exp(-pow(p.x*1.1-uFront,2.)*2.2);a+=front*belt*.065*uMist;
 vec3 color=uFog*(1.04+.03*uWeather);vec2 key=uKeyPos+vec2(b(uTime*.37,phase)*.004,b(uTime*.29,phase+3.)*.003);
 float dx=p.x-key.x-(key.y-p.y)*.28;float shaft=pow(max(0.,sin(dx*21.+phase)+.39*sin(dx*34.7+2.1)),7.);shaft=min(shaft,.8)*smoothstep(.03,.19,key.y-p.y)*exp(-abs(p.y)*1.4);
 if(uRealm>4.5||uRealm>1.5&&uRealm<2.5)shaft*=.12;
 float ray=shaft*.038*uRays*(.85+low*.15);color+=uKey*ray*9.;a+=ray;
 // A second, broader lobe of light for a fuller volumetric feel.
 float lobe=pow(max(0.,sin(dx*9.+phase*1.7)+.5*sin(dx*13.3+4.2)),4.);lobe=min(lobe,.6)*smoothstep(.02,.24,key.y-p.y)*exp(-abs(p.y)*1.1);
 float ray2=lobe*.05*uRays*(.7+low*.3);color+=uKey*ray2*7.;a+=ray2;
 // Broad pools of light slide across horizontal surfaces without changing their geometry.
 float pool=pow(low,3.)*exp(-pow((p.y+.29)*8.,2.))*.022*uGlow;
 if(uRealm>.5&&uRealm<1.5){
  // Fine falling streaks and a separate, slow wave of light down their wet edges.
  vec2 rainP=p*vec2(290.,40.);rainP.x+=p.y*7.;vec2 id=floor(rainP);float phase2=hash2(id+phase);float fall=fract(rainP.y+uTime*.11+.013*b(uTime*.31,phase2*40.));float streak=pow(max(0.,1.-abs(fract(rainP.x)-.5)*2.),19.)*smoothstep(.74,.96,fall)*step(.67,phase2);a+=streak*.022;color+=uKey*streak*.08;
  float steam=pow(fbm(p*vec2(8.,5.)+vec2(uTime*.0006,-uTime*.0012)+phase),3.)*exp(-pow((p.y+.12)*8.,2.));a+=steam*.075*uMist;
 }
 gl_FragColor=vec4(color*a+uKey*pool*(1.+.03*uWeather),a);
}`;



function opticalUniforms(p){const l=cleanLens(config.lens),look=lensLooks[l.mode];uniform(p,'uOptics',[look.floor,look.radius,look.edge,0]);uniform(p,'uLensControl',[look.shape,l.position,l.width]);}


let lensProgram=null,snapshotProgram=null,brightProgram=null,bloomProgram=null,fxaaProgram=null;
function renderLensBlur(fade){if(!lensProgram)lensProgram=program(screenVert,cityLensFrag);gl.bindFramebuffer(gl.FRAMEBUFFER,lensTarget.fb);gl.viewport(0,0,lensWidth,lensHeight);gl.disable(gl.BLEND);gl.useProgram(lensProgram.p);sampler(lensProgram,'uTex',sceneTarget.tex,0);sampler(lensProgram,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);uniform(lensProgram,'uMix',previous?fade:1);uniform(lensProgram,'uSize',[width,height]);uniform(lensProgram,'uLens',smoothed.focus);opticalUniforms(lensProgram);screen(lensProgram);gl.viewport(0,0,width,height);}
// --- AAA: bloom + FXAA shaders ---
const brightFrag=common+`uniform sampler2D uTex;void main(){vec3 c=texture2D(uTex,vUV).rgb;float l=dot(c,vec3(.299,.587,.114));gl_FragColor=vec4(c*smoothstep(.68,.92,l),1.);}`;
const softBlurFrag=common+`uniform sampler2D uTex;uniform vec2 uPx;void main(){vec2 px=uPx;vec3 c=texture2D(uTex,vUV).rgb*.227027;vec2 o1=px*1.3846153846,o2=px*3.2307692308;c+=(texture2D(uTex,vUV+o1).rgb+texture2D(uTex,vUV-o1).rgb)*.3162162162;c+=(texture2D(uTex,vUV+o2).rgb+texture2D(uTex,vUV-o2).rgb)*.0702702703;gl_FragColor=vec4(c,1.);}`;
const fxaaFrag=common+`uniform sampler2D uTex;
void main(){vec2 px=1./uSize;vec3 c=texture2D(uTex,vUV).rgb;
vec3 a=texture2D(uTex,vUV+vec2(-px.x,-px.y)).rgb,b=texture2D(uTex,vUV+vec2(px.x,-px.y)).rgb,d=texture2D(uTex,vUV+vec2(-px.x,px.y)).rgb,e=texture2D(uTex,vUV+px).rgb;
vec3 luma=vec3(.299,.587,.114);float lc=dot(c,luma),la=dot(a,luma),lb=dot(b,luma),ld=dot(d,luma),le=dot(e,luma);
float lo=min(lc,min(min(la,lb),min(ld,le))),hi=max(lc,max(max(la,lb),max(ld,le)));
if(hi-lo>max(.016,hi*.105)){vec2 dir=vec2(-(la+lb-ld-le),la+ld-lb-le);float reduce=max((la+lb+ld+le)*.03125,.0078125);dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),vec2(-6.),vec2(6.))*px;vec3 first=.5*(texture2D(uTex,vUV-dir/6.).rgb+texture2D(uTex,vUV+dir/6.).rgb),second=first*.5+.25*(texture2D(uTex,vUV-dir*.5).rgb+texture2D(uTex,vUV+dir*.5).rgb);float lum=dot(second,luma);c=lum<lo||lum>hi?first:second;}
gl_FragColor=vec4(c,1.);}`;
function renderBloom(){if(!brightProgram)brightProgram=program(screenVert,brightFrag);if(!bloomProgram)bloomProgram=program(screenVert,softBlurFrag);
 gl.disable(gl.BLEND);
 gl.bindFramebuffer(gl.FRAMEBUFFER,bloomA.fb);gl.viewport(0,0,lensWidth,lensHeight);gl.useProgram(brightProgram.p);sampler(brightProgram,'uTex',sceneTarget.tex,0);screen(brightProgram);
 gl.bindFramebuffer(gl.FRAMEBUFFER,bloomB.fb);gl.useProgram(bloomProgram.p);sampler(bloomProgram,'uTex',bloomA.tex,0);uniform(bloomProgram,'uPx',[1/lensWidth,0]);screen(bloomProgram);
 gl.bindFramebuffer(gl.FRAMEBUFFER,bloomA.fb);sampler(bloomProgram,'uTex',bloomB.tex,0);uniform(bloomProgram,'uPx',[0,1/lensHeight]);screen(bloomProgram);
 gl.viewport(0,0,width,height);}
function snapshotWorld(){if(!snapshotProgram)snapshotProgram=program(screenVert,citySnapshotFrag);gl.bindFramebuffer(gl.FRAMEBUFFER,layerTarget.fb);gl.disable(gl.BLEND);gl.useProgram(snapshotProgram.p);sampler(snapshotProgram,'uTex',sceneTarget.tex,0);sampler(snapshotProgram,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);uniform(snapshotProgram,'uMix',previous?ease((elapsed-transitionStart)/TRANSITION_DUR):1);screen(snapshotProgram);const swap=oldTarget;oldTarget=layerTarget;layerTarget=swap;}
const postFrag=common+`uniform sampler2D uTex,uOld,uBlurred,uBloom;uniform float uMix,uGrain,uPalette,uLens;
`+opticalGLSL+`vec3 photograph(vec2 uv){if(uMix>.999)return texture2D(uTex,uv).rgb;return mix(texture2D(uOld,uv).rgb,texture2D(uTex,uv).rgb,uMix);}
void main(){vec2 uv=vUV;vec2 p=world();float phase=uSeed*.001;
 if(uRealm>.5&&uRealm<1.5){float coc=opticalRadius(vUV);vec3 sharp=photograph(uv),color=mix(sharp,texture2D(uBlurred,uv).rgb,smoothstep(.25,1.25,coc));
 if(coc<1.&&uOptics.z>0.){vec2 px=1./uSize;vec3 neighbors=(photograph(uv+vec2(px.x,0.))+photograph(uv-vec2(px.x,0.))+photograph(uv+vec2(0.,px.y))+photograph(uv-vec2(0.,px.y)))*.25;color+=(1.-coc)*uOptics.z*(sharp-neighbors);}
 color=mix(vec3(dot(color,vec3(.2126,.7152,.0722))),color,1.12);color*=vec3(1.03+uPalette*.20,1.,.96-uPalette*.20)*.80;color=(color*(2.51*color+.03))/(color*(2.43*color+.59)+.14);color=pow(clamp(color,0.,1.),vec3(.4545));color*=1.-.13*pow(length(uv-.5),1.8);color+=(hash2(gl_FragCoord.xy+floor(uTime*8.))-.5)*.007*uGrain;gl_FragColor=vec4(clamp(color,0.,1.),1.);return;}

 // True screen-space refraction: sample the already-composited scene at a distorted position.
 if(uRealm>1.5&&uRealm<2.5){float strength=(1.-smoothstep(-.42,.13,p.y));uv.x+=(sin(p.y*77.+uTime*.17)+.43*sin(p.y*123.7-uTime*.113+phase))*.00032*strength;uv.y+=sin(p.x*43.+uTime*.097)*sin(p.y*31.-uTime*.061)*.00012*strength;}
 if(uRealm<.5&&p.y<-.15){float water=(1.-smoothstep(-.38,-.15,p.y));uv.x+=(sin(p.y*155.+uTime*.063)+.48*sin(p.y*241.3-uTime*.087))*water*.00011;}
 vec3 sharp=photograph(uv);float coc=opticalRadius(vUV);vec3 col=mix(sharp,texture2D(uBlurred,uv).rgb,smoothstep(.25,1.25,coc));
 if(coc<1.&&uOptics.z>0.){vec2 px=1./uSize;vec3 neighbors=(photograph(uv+vec2(px.x,0.))+photograph(uv-vec2(px.x,0.))+photograph(uv+vec2(0.,px.y))+photograph(uv-vec2(0.,px.y)))*.25;col+=(1.-coc)*uOptics.z*(sharp-neighbors);}
 vec2 fringe=(uv-.5)*.00013*uGlow;col.r=mix(col.r,texture2D(uTex,uv+fringe).r,.22*uMix);col.b=mix(col.b,texture2D(uTex,uv-fringe).b,.22*uMix);
 col+=texture2D(uBloom,vUV).rgb*.5;
 col*=mix(vec3(.85,.96,1.04),vec3(1.035,1.015,.96),vUV.y);col*=vec3(1.+uPalette*.065,1.-abs(uPalette)*.022,1.-uPalette*.065);
 col=hueRotate(col,uPalette*.38);
 col*=1.04;
 col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
 col=pow(max(col,vec3(0.)),vec3(1./2.2));
 float flum=dot(col,vec3(.2126,.7152,.0722));
 col=mix(vec3(flum),col,1.16);
 col*=mix(vec3(.93,1.04,1.06),vec3(1.),smoothstep(.5,.04,flum));
 col*=mix(vec3(1.),vec3(1.07,1.0,.9),smoothstep(.5,.96,flum));
 col*=1.-.05*smoothstep(.4,.0,flum);
 float vignette=1.-.20*pow(length((vUV-.5)*vec2(.95,1.)),1.7)*(1.+.012*b(uTime*.76,phase));col*=vignette;
 float grain=hash2(gl_FragCoord.xy+vec2(floor(uTime*12.)*13.7,phase))-.5;col+=grain*.014*uGrain;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
function program(v,f){const p=gl.createProgram();for(const[type,source]of[[gl.VERTEX_SHADER,v],[gl.FRAGMENT_SHADER,f]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(msg)}gl.attachShader(p,s);gl.deleteShader(s)}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return{p,u:{},a:{}}}
let programs;
try{programs={mesh:program(vert,frag),sky:program(screenVert,skyFrag),mist:program(screenVert,mistFrag),composite:program(screenVert,compositeFrag),post:program(screenVert,postFrag)}}catch(e){notice('The graphics driver could not start this world. '+e.message);throw e}
function uniform(p,name,v){if(!(name in p.u))p.u[name]=gl.getUniformLocation(p.p,name);const l=p.u[name];if(l===null)return;if(Array.isArray(v)){if(v.length===2)gl.uniform2fv(l,v);else if(v.length===3)gl.uniform3fv(l,v);else gl.uniform4fv(l,v)}else gl.uniform1f(l,v)}
function sampler(p,name,tex,unit){if(!(name in p.u))p.u[name]=gl.getUniformLocation(p.p,name);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(p.u[name],unit)}
const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
let attributeProgram=null;const enabledAttributes=new Set();
function attribute(p,name,size,stride,offset){if(attributeProgram!==p){for(const n of enabledAttributes)gl.disableVertexAttribArray(n);enabledAttributes.clear();attributeProgram=p;}if(!(name in p.a))p.a[name]=gl.getAttribLocation(p.p,name);const l=p.a[name];if(l>=0){gl.enableVertexAttribArray(l);enabledAttributes.add(l);gl.vertexAttribPointer(l,size,gl.FLOAT,false,stride,offset)}}
function screen(p){gl.bindBuffer(gl.ARRAY_BUFFER,quad);attribute(p,'aPos',2,8,0);gl.drawArrays(gl.TRIANGLES,0,6)}
function target(w,h){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);const depth=gl.createRenderbuffer();gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Frame buffer unavailable');return{tex,fb,depth}}
function dropTarget(t){if(t){gl.deleteTexture(t.tex);gl.deleteFramebuffer(t.fb);if(t.depth)gl.deleteRenderbuffer(t.depth)}}
let layerTarget,sceneTarget,oldTarget,lensTarget,postTarget,bloomA,bloomB,lensWidth=0,lensHeight=0,width=0,height=0,recording=false,contextLost=false;
function resize(){if(recording)return;const RM=window.__renderMode;if(RM){const w=RM.W,h=RM.H;if(w===width&&h===height)return;width=w;height=h;canvas.width=w;canvas.height=h;[layerTarget,sceneTarget,oldTarget,lensTarget,postTarget,bloomA,bloomB].forEach(dropTarget);layerTarget=target(w,h);sceneTarget=target(w,h);oldTarget=target(w,h);lensWidth=Math.max(2,Math.round(w*.5));lensHeight=Math.max(2,Math.round(h*.5));lensTarget=target(lensWidth,lensHeight);postTarget=target(w,h);bloomA=target(lensWidth,lensHeight);bloomB=target(lensWidth,lensHeight);if(previous)previous.frozen=false;gl.viewport(0,0,w,h);return;}const aspect=innerWidth/innerHeight;const scale=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1400000/(innerWidth*innerHeight)));const w=Math.max(2,Math.round(innerWidth*scale/2)*2),h=Math.max(2,Math.round(innerHeight*scale/2)*2);if(w===width&&h===height)return;width=w;height=h;canvas.width=w;canvas.height=h;[layerTarget,sceneTarget,oldTarget,lensTarget,postTarget,bloomA,bloomB].forEach(dropTarget);layerTarget=target(w,h);sceneTarget=target(w,h);oldTarget=target(w,h);lensWidth=Math.max(2,Math.round(w*.5));lensHeight=Math.max(2,Math.round(h*.5));lensTarget=target(lensWidth,lensHeight);postTarget=target(w,h);bloomA=target(lensWidth,lensHeight);bloomB=target(lensWidth,lensHeight);if(previous)previous.frozen=false;gl.viewport(0,0,w,h)}
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
const cityFamilies=['River Quarter','Harbor City','Park Metropolis','Garden Rings','Delta Islands','Sun Coast'];
function cityFamily(seed){return hash(seed+':urban-family')%cityFamilies.length}
function cityLand(s,x,z){const [type,phase,offset,water]=s.geo,[bend,amp,slope]=s.map;const river=offset+Math.sin(z*bend+phase)*amp+z*slope;
 if(type===0)return Math.abs(x-river)-water;
 if(type===1)return offset+Math.sin(z*.09+phase)*4-x;
 if(type===2)return (Math.hypot((x-s.cx)/1.45,(z-s.cz)/2.4)-1.35);
 if(type===3)return 20;
 if(type===4)return Math.min(Math.abs(x-river)-water,Math.abs(z-offset*.7-Math.sin(x*.12+phase)*2)-water*.72);
 return z-offset-Math.sin(x*.095+phase)*3.8;
}
function cityPark(s,x,z){if(s.family===2)return Math.hypot((x-s.cx)/1.15,(z-s.cz)/2.2)<4.0;if(s.family===3)return Math.hypot(x,z)<3.25;return Math.hypot(x-s.park[0],z-s.park[1])<s.park[2]}
function cityPlan(c){if(cityPlanCache.has(c.layout))return cityPlanCache.get(c.layout);const r=rng(hash(c.layout+':urban-plan-v4')),family=cityFamily(c.layout);
 const s={family,name:cityFamilies[family],geo:[family,r()*6.28,(r()-.5)*6, .8+r()*1.25],map:[.06+r()*.10,1.4+r()*2.4,(r()-.5)*.16,0],cx:(r()-.5)*6,cz:(r()-.5)*6,park:[(r()-.5)*15,(r()-.5)*15,1.8+r()*2],sx:1.85+r()*.75,sz:1.9+r()*.65,angle:(r()>.5?1:-1)*(.30+r()*.65),elevation:22+r()*7,distance:29+r()*5,roads:[],lots:[],green:[],boats:[],traffic:[],phase:r()*100};
 if(family===1)s.geo[2]=3+r()*4;if(family===5)s.geo[2]=-4+r()*5;
 s.palette=family===5?[[.76,.71,.57],[.69,.39,.20],[.14,.29,.34]]:family===2?[[.43,.48,.48],[.29,.32,.31],[.10,.24,.31]]:family===3?[[.58,.56,.44],[.39,.25,.16],[.18,.32,.28]]:family===4?[[.73,.67,.49],[.37,.23,.14],[.12,.32,.39]]:[[.62,.61,.53],[.42,.22,.13],[.20,.34,.38]];
 s.landTint=family===5?[.32,.34,.20]:[.13,.22,.14];s.waterTint=family===5?[.045,.25,.32]:family===4?[.065,.23,.20]:[.055,.19,.21];
 function road(a,b,width){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/.75);let open=null;for(let k=0;k<steps;k++){const t0=k/steps,t1=(k+1)/steps,p=[mix(a[0],b[0],t0),mix(a[1],b[1],t0)],q=[mix(a[0],b[0],t1),mix(a[1],b[1],t1)],x=(p[0]+q[0])/2,z=(p[1]+q[1])/2;const land=cityLand(s,x,z)>.18&&!cityPark(s,x,z);if(land){if(!open)open=p;}if(open&&(!land||k===steps-1)){const end=land?q:p;s.roads.push({a:open,b:end,width,y:.012});if(Math.hypot(end[0]-open[0],end[1]-open[1])>1.2)s.traffic.push({a:open,b:end});open=null;}}}
 function lot(x,z,w,d,angle,id){const reach=Math.hypot(w,d)*.53;if(cityLand(s,x,z)<reach||cityPark(s,x,z))return;const cluster=Math.exp(-((x-s.cx)**2+(z-s.cz)**2)/(family===2?85:50));const district=hash(c.layout+':district:'+Math.floor(x/5)+':'+Math.floor(z/5))%5;let style=family===5?(r()<.74?2:1):family===2?(r()<.65?0:4):family===3?(r()<.55?1:3):district;
 let h=(.5+r()*1.5+cluster*(1+r()*4));if(family===2)h*=1.75;if(family===5)h*=.55;if(family===4)h*=1.15;if(style===2)h*=.70;const existing=r()<(family===5?.50:.28);let birth=existing?-35000:r()*19800; if(!existing&&r()>.91)birth=29000+r()*28000;const duration=1500+h*630+r()*800;s.lots.push({id,x:x-w/2,z:z-d/2,y:0,width:w,depth:d,height:h,birth,duration,phase:r()*100,style,landmark:0,row:Math.floor((z+20)/s.sz),col:Math.floor((x+20)/s.sx),angle,existing,lod:Math.hypot(x,z)>22?1:0});}
 if(family===3){const rings=13+Math.floor(r()*2),spacing=2.0+r()*.4;for(let ring=0;ring<rings;ring++){const radius=4.8+ring*spacing,count=Math.floor(TAU*radius/(2.0+r()*.45)),offset=r()*TAU;
 for(let k=0;k<count;k++){const a=k/count*TAU+offset,px=Math.cos(a)*radius,pz=Math.sin(a)*radius;const spoke=Math.abs(Math.sin(a*3));if(spoke>.16)lot(px,pz,1.25+r()*.38,1.18+r()*.35,-a+Math.PI/2,'r'+ring+':'+k);const b=(k+1)/count*TAU+offset;road([Math.cos(a)*(radius+spacing*.48),Math.sin(a)*(radius+spacing*.48)],[Math.cos(b)*(radius+spacing*.48),Math.sin(b)*(radius+spacing*.48)],.30);}
 }for(let k=0;k<6;k++){const a=k/6*TAU;road([Math.cos(a)*3.4,Math.sin(a)*3.4],[Math.cos(a)*37,Math.sin(a)*37],.46);}}
 else{const shift=r()*.7;for(let row=-9;row<23;row++){const z=(row-6.5)*s.sz,offset=family===5?Math.sin(row*.47+s.phase)*1.2:family===4?(row%2)*s.sx*.35:Math.sin(row*.23+s.phase)*shift;
 road([-43,z+s.sz*.48],[43,z+s.sz*.48],family===2?.48:.32);
 for(let col=-9;col<24;col++){const x=(col-7)*s.sx+offset,w=s.sx*(.57+r()*.14),d=s.sz*(.55+r()*.16);lot(x,z,w,d,0,'g'+row+':'+col);if(row<22)road([x+s.sx*.48,z-s.sz*.50],[x+s.sx*.48,z+s.sz*.50],.26);}}
 }
 // Landmark positions are selected from each city's actual land parcels.
 const candidates=s.lots.filter(l=>Math.hypot(l.x-s.cx,l.z-s.cz)<8).sort((a,b)=>hash(c.layout+a.id)-hash(c.layout+b.id));
 if(candidates[0]){const l=candidates[0];l.landmark=family===5?3:family===2?4:1;l.height=family===5?4.3:family===2?10.5+r()*2:6+r()*3;l.birth=250;l.duration=5600;l.existing=false;}
 if(candidates[3]){candidates[3].landmark=2;candidates[3].height=1.7+r()*.9;}
 for(let k=0;k<250;k++){const x=(r()-.5)*39,z=(r()-.5)*39;if(cityLand(s,x,z)>.6&&cityPark(s,x,z))s.green.push([x,z,.55+r()*.55]);}
 // Straight, land-tested navigation reaches prevent vehicles from crossing water.
 s.traffic.sort((a,b)=>hash(c.layout+':traffic:'+a.a)-hash(c.layout+':traffic:'+b.a));s.traffic=s.traffic.slice(0,100);
 if(family!==3){for(let k=0;k<18;k++){const x=(r()-.5)*37,z=(r()-.5)*35,angle=r()*TAU,dx=Math.cos(angle)*2.5,dz=Math.sin(angle)*2.5;if([0,.25,.5,.75,1].every(t=>cityLand(s,x+dx*t,z+dz*t)<-.45))s.boats.push({a:[x,z],b:[x+dx,z+dz]});}}
 s.lots.sort((a,b)=>a.z-b.z);s.lots.forEach((l,i)=>l.plane=1+Math.min(6,Math.floor(i*7/s.lots.length)));s.signature=[family,s.geo,s.map,s.sx,s.sz,s.cx,s.cz,s.angle];
 if(cityPlanCache.size>10)cityPlanCache.delete(cityPlanCache.keys().next().value);cityPlanCache.set(c.layout,s);return s;}
function cityLots(c,index){return cityPlan(c).lots.filter(l=>l.plane===index)}
function cityRoad(m,a,b,width,y,c,mat=4){const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz)||1,nx=-dz/len*width*.5,nz=dx/len*width*.5;m.material=mat;m.face([a[0]+nx,y,a[1]+nz],[b[0]+nx,y,b[1]+nz],[b[0]-nx,y,b[1]-nz],[a[0]-nx,y,a[1]-nz],c,[0,1,0]);m.material=0;}
function cityTree(m,x,z,s,r){m.box(x-.025,.05,z-.025,.05,s*.65,.05,[.21,.17,.105],0);m.material=5;const leaf=[.10+r()*.035,.22+r()*.08,.09+r()*.025];m.sphere(x,s*.69,z,s*.33,s*.43,s*.32,leaf,6,3);m.material=0;}
// Architectural grammar: parcels keep their schedule, district language and silhouette at every LOD.
// A small seamless material field is baked once per world, never regenerated while tuning.
function bakeCityMaterials(seed){
 const size=128,r=rng(hash(seed+':mineral-atlas')),grids=[2,4,8,16,32,64].map(n=>({n,v:Float32Array.from({length:n*n},()=>r())}));
 const sample=(g,u,v)=>{const xx=u*g.n,yy=v*g.n,x=Math.floor(xx),y=Math.floor(yy),fx=xx-x,fy=yy-y,tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy),at=(a,b)=>g.v[(b%g.n)*g.n+a%g.n];return mix(mix(at(x,y),at(x+1,y),tx),mix(at(x,y+1),at(x+1,y+1),tx),ty)};
 const bytes=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,i=(y*size+x)*4,values=grids.map(g=>sample(g,u,v));bytes[i]=Math.round(255*(values[0]*.50+values[1]*.30+values[2]*.20));bytes[i+1]=Math.round(255*(values[2]*.50+values[3]*.32+values[4]*.18));bytes[i+2]=Math.round(255*(values[4]*.4+values[5]*.6));bytes[i+3]=255;}
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,size,size,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return tex;
}
const architectureNames=['Lantern glass','Terracotta screen','Crown setback','Garden courtyard','Sawtooth works','Mansard house','Loggia residence','Hanging gardens','Bridge towers','Cruciform atelier'];
function architecturalType(c,l){return l.style*2+(hash(c.layout+':architecture:'+Math.floor(l.x/4)+':'+Math.floor(l.z/4))&1)}
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
function makeCityPlane(c,index){const m=new CityMesh(),s=cityPlan(c),r=rng(hash(c.detail+':photo-finish:'+index));
 if(index===1){m.material=11;m.face([-65,-.055,-65],[65,-.055,-65],[65,-.055,65],[-65,-.055,65],s.landTint,[0,1,0]);m.material=0;

 for(const p of s.roads)cityRoad(m,p.a,p.b,p.width,p.y,[.095,.12,.135]);
 for(let i=0;i<s.green.length;i++)cityTree(m,...s.green[i],r);
 // Waterfront crossings vary with each plan, and are separate from the streets.
 if(s.family===0||s.family===4){for(let j=0;j<4;j++){const z=-12+j*8,x=s.geo[2]+Math.sin(z*s.map[0]+s.geo[1])*s.map[1]+z*s.map[2],half=s.geo[3]+.6;cityRoad(m,[x-half,z],[x+half,z],.50,.18,[.62,.58,.48],0);m.box(x-half,.18,z-.27,half*2,.13,.035,[.71,.68,.57],0);m.box(x-half,.18,z+.24,half*2,.13,.035,[.71,.68,.57],0);}}
 if(s.family===1||s.family===5){for(let j=0;j<5;j++){const z=-12+j*5,x=s.geo[2]+Math.sin(z*.09+s.geo[1])*4;if(s.family===1){cityRoad(m,[x-.6,z],[x+2.5,z],.32,.07,[.42,.32,.20],0);for(let k=0;k<4;k++)m.box(x+k*.6,.06,z-.19,.035,.18,.035,[.29,.25,.17],0);}}}
 }
 const lots=cityLots(c,index);m.lots=lots;
 for(const l of lots){const{x,z,width:w,depth:d,height:h,style,phase}=l;m.phase=phase;m.turn=l.angle||0;m.pivot=[x+w/2,z+d/2];
  // Permanent low urban fabric and construction plots share the same seeded plan.
  m.material=0;m.face([x-.035,.025,z-.035],[x+w+.035,.025,z-.035],[x+w+.035,.025,z+d+.035],[x-.035,.025,z+d+.035],[.39,.39,.35],[0,1,0]);m.construction=[l.birth,l.duration,0,h];beginBuilding(m);
  const glass=color(s.palette[2],.85+r()*.3),stone=color(s.palette[0],.88+r()*.24),brick=color(s.palette[1],.85+r()*.3);
  if(l.landmark===1){m.material=1;m.cylinder(x+w*.5,0,z+d*.5,w*.58,d*.48,h,glass,20,.76);m.kind=1;m.material=8;m.cylinder(x+w*.5,h,z+d*.5,w*.44,d*.37,.10,[.67,.72,.69],20);m.box(x+w*.47,h,z+d*.47,.035,.65,.035,[.70,.71,.64],8);m.kind=0;}
  else if(l.landmark===2){const dh=Math.min(h*.45,w*.47,d*.47),base=h-dh;m.box(x,0,z,w,base,d,[.68,.66,.56],2);m.material=8;m.dome(x+w*.5,base,z+d*.5,w*.49,dh,d*.49,[.44,.55,.53],16,5);}
  else if(l.landmark===3){m.box(x+w*.27,0,z+d*.27,w*.46,h,d*.46,stone,2);m.material=8;m.cylinder(x+w*.5,h,z+d*.5,w*.30,d*.30,.18,[.36,.40,.35],12);m.kind=1;m.box(x+w*.37,h+.18,z+d*.37,w*.26,.26,d*.26,glass,1);m.kind=0;}
  else if(l.landmark===4){for(let k=0;k<5;k++){const inset=k*.065;m.box(x+w*inset,h*k/5,z+d*inset,w*(1-inset*2),h/5,d*(1-inset*2),glass,1);}m.kind=1;m.box(x+w*.47,h,z+d*.47,.05,.8,.05,[.65,.67,.60],8);m.kind=0;}
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
 for(let i=index-1;i<s.traffic.length*3;i+=7){const p=s.traffic[Math.floor(i/3)],dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],length=Math.hypot(dx,dz);m.phase=r()*100;m.kind=5;m.anchor=0;m.route=[dx/length,dz/length,length,.38+r()*.28];m.turn=-Math.atan2(dz,dx);m.pivot=p.a;
 const tint=r()>.6?[.75,.28,.13]:[.75,.77,.71];m.box(p.a[0],.023,p.a[1],.22,.085,.105,tint,8);m.box(p.a[0]+.055,.108,p.a[1]+.012,.10,.04,.079,[.10,.20,.23],1);m.turn=0;m.route=[0,0,0,0];m.kind=0;}
 for(let i=index-1;i<s.boats.length;i+=7){const p=s.boats[i],dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],length=Math.hypot(dx,dz);m.phase=r()*100;m.kind=6;m.anchor=0;m.route=[dx/length,dz/length,length,.05];m.turn=-Math.atan2(dz,dx);m.pivot=p.a;m.box(p.a[0],-.04,p.a[1],.50,.065,.17,[.74,.76,.70],8);m.box(p.a[0]+.12,.025,p.a[1]+.025,.19,.05,.12,[.15,.29,.34],1);m.kind=0;m.turn=0;m.route=[0,0,0,0];}
 return m.upload();
}
function cityDraw(mesh,p,view,light,t,eye,sun,params,world){gl.useProgram(p.p);matrix(p,'uViewProjection',view);matrix(p,'uLightMatrix',light);uniform(p,'uStory',t);uniform(p,'uTime',elapsed);uniform(p,'uDensity',params.density*quality);uniform(p,'uRays',params.rays);uniform(p,'uPixelScale',.67/height);uniform(p,'uEye',eye);uniform(p,'uSun',sun);uniform(p,'uWeather',organic(elapsed*.8,world.city.phase));uniform(p,'uMist',params.mist);uniform(p,'uGlow',params.glow);uniform(p,'uGeo',world.city.geo);uniform(p,'uMap',world.city.map);uniform(p,'uCenter',[world.city.cx,world.city.cz]);uniform(p,'uSpacing',[world.city.sx,world.city.sz]);uniform(p,'uBounds',world.city.family===3?[38,38]:[world.city.sx*16.5,world.city.sz*16]);uniform(p,'uPark',world.city.park);uniform(p,'uLandTint',world.city.landTint);uniform(p,'uWaterTint',world.city.waterTint);if(p===photoPrograms.surface){sampler(p,'uShadow',world.shadow.tex,2);sampler(p,'uMaterial',world.materialTexture,3);}gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);attribute(p,'aPosition',3,92,0);attribute(p,'aNormal',3,92,12);attribute(p,'aTint',3,92,24);attribute(p,'aSchedule',4,92,36);attribute(p,'aTex',2,92,52);attribute(p,'aInfo',4,92,60);attribute(p,'aRoute',4,92,76);if(mesh.indexBuffer){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.indexBuffer);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);}else gl.drawArrays(gl.TRIANGLES,0,mesh.count);}
function renderPhotoCity(w,t,params,dest){if(!photoPrograms)photoPrograms={surface:program(cityVertex,cityFragment),shadow:program(cityVertex,cityShadowFragment)};
 if(!w.materialTexture)w.materialTexture=bakeCityMaterials(w.config.detail);
 if(!w.shadow){w.shadow=target(1024,1024);gl.bindTexture(gl.TEXTURE_2D,w.shadow.tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);w.shadowAt=-100;}
 const s=w.city,phase=s.phase,drift=params.drift,angle=s.angle+.055*organic(elapsed*.24,phase)*drift;
 const eye=[Math.sin(angle)*s.distance,s.elevation,Math.cos(angle)*s.distance],focus=[organic(elapsed*.20,phase)*1.5*drift,1.05,organic(elapsed*.13,phase+2)*1.5*drift],fov=(37+.25*organic(elapsed*.34,phase+4))*Math.PI/180;const view=matMul(perspective(fov,width/height),lookAt(eye,focus));
 gl.disable(gl.BLEND);gl.disable(gl.DITHER);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);
 if(elapsed-w.shadowAt>.12||Math.abs(t-w.shadowStory)>120){w.sun=norm3([-.68+.08*Math.sin(t*.000025+s.phase)+.035*Math.sin(t*.000041+1.7),1,.39+.025*Math.sin(t*.000031)+.01*Math.sin(t*.000053+2.1)]);w.light=matMul(ortho(34),lookAt(w.sun.map(v=>v*57),[0,0,0]));gl.bindFramebuffer(gl.FRAMEBUFFER,w.shadow.fb);gl.viewport(0,0,1024,1024);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);for(let i=1;i<8;i++)cityDraw(w.planes[i],photoPrograms.shadow,w.light,w.light,t,eye,w.sun,params,w);w.shadowAt=elapsed;w.shadowStory=t;}
 gl.bindFramebuffer(gl.FRAMEBUFFER,dest.fb);gl.viewport(0,0,width,height);gl.clearColor(.39,.49,.54,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);for(let i=1;i<8;i++)cityDraw(w.planes[i],photoPrograms.surface,view,w.light,t,eye,w.sun,params,w);gl.disable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
}

function cityProgress(lot,time){const raw=(time-lot.birth)/lot.duration;return {height:ease(raw),complete:raw>=1.2,active:raw>=0&&raw<1.2}}
function makePlane(c,index,epoch=0){if(c.realm===1)return makeCityPlane(c,index);const realm=c.realm;const far=index<3;const r=rng(hash(c.layout+':plane:'+index+':'+(far?epoch:0)));const d=rng(hash(c.detail+':detail:'+index+':'+epoch));const m=new Mesh(),pal=realms[realm],depth=depths[index];const near=index>=6;let base=color(pal.fog,near?.12:mix(.30,.8,1-depth));const phase=r()*TAU;
 if(realm===0){
  if(index===3){m.set(phase);m.rect(-2.6,-.8,5.2,.64,[.013,.043,.051,1]);for(let i=0;i<180;i++){let x=d()*5.2-2.6,y=-.16-d()*.61,w=.008+d()*.12;m.set(d()*80,.025);m.line(x,y,x+w,y,.00045,[.18,.35,.33,.08+d()*.10]);if(i%5===0)m.disc(x,y,w*.3,.0008,[.14,.30,.32,.20],3)}for(let i=0;i<17;i++){const y=-.18-i*.016,x=pal.key[0]+(d()-.5)*.018;m.disc(x,y,.024+i*.008,.0013,color(pal.light,.52,.12*(1-i/20)),1)}}
  else{const count=near?6:index===1?34:index===2?22:12;for(let i=0;i<count;i++){let x=mix(-2.5,2.5,(i+.2+r()*.6)/count),y=-.17-(index-1)*.039;let h=(near?.76:.28+depth*.37)*(.6+r()*.7);if(near&&Math.abs(x)<.22)x+=x<0?-.37:.37;const w=h*(near?.034:.03),treePhase=d()*70;branch(m,r,x,y,h*.42,Math.PI*.5+(r()-.5)*.15,w,near?5:4,base,treePhase,true);roots(m,r,x,y,w,base,treePhase);for(let k=0;k<5;k++){const sy=y+h*(.45+k*.095),cw=h*(.35-k*.048);canopy(m,r,x+(r()-.5)*cw*.3,sy,cw,h*.095,base,treePhase+k*2.3)}if(!near){m.set(d()*80,.04);m.disc(x,y-.05,w*2,h*.13,color(base,.38,.52),2)}}
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
function disposeWorld(w){if(!w)return;if(w.shadow)dropTarget(w.shadow);if(w.materialTexture)gl.deleteTexture(w.materialTexture);w.planes.forEach(m=>m&&m.dispose());w.particles.forEach(m=>m.dispose());if(w.next)w.next.forEach(m=>m&&m.dispose())}
let current,previous=null,transitionStart=-100,worldTime=0,lastFrame=0,elapsed=0,playbackRate=60,TRANSITION_DUR=0.3,previewEnd=null,seeking=false,quality=1,qualityTarget=1,slowCount=0,goodCount=0,frames=0,smoothed={...defaults};
function commonUniforms(p,w,t,params){const c=w.config,pal=realms[c.realm],s=storyAt(c,t),motion=elapsed,phase=(hash(c.layout+':weather')%10000)*.01;const drift=params.drift;const camera=[(organic(motion*.43,phase)*.009+organic(motion*.11,phase+2)*.015)*drift,(organic(motion*.29,phase+4)*.003+organic(motion*.073,phase+1)*.005)*drift];const zoom=1.+.015*organic(motion*.94,phase+5);const daylight=c.realm===4||c.realm===5?0:s.day;const warm=Math.max(0,s.warmth)*1.3;const key=pal.light.map((v,i)=>mix(v,[1,.76,.43][i],warm));uniform(p,'uSize',[width,height]);uniform(p,'uLens',params.focus);uniform(p,'uCamera',camera);uniform(p,'uZoom',zoom);uniform(p,'uTime',motion);uniform(p,'uStory',t);uniform(p,'uDay',s.day);uniform(p,'uEnergy',s.energy);uniform(p,'uGrowth',s.growth);uniform(p,'uFront',s.front);uniform(p,'uRealm',c.realm);uniform(p,'uSeed',hash(c.detail)%8192);uniform(p,'uWeather',organic(motion*.82,phase));uniform(p,'uMist',params.mist*s.mist);uniform(p,'uGlow',params.glow*(.65+s.energy*.55));uniform(p,'uRays',params.rays*(.6+s.day*.9));uniform(p,'uSky',pal.sky.map((v,i)=>v*(1+daylight*.7)+key[i]*daylight*.43));uniform(p,'uFog',pal.fog.map((v,i)=>v+key[i]*daylight*.30));uniform(p,'uKey',key);uniform(p,'uKeyPos',[pal.key[0]+Math.sin(s.sun*2.3)*.27,pal.key[1]+Math.sin(s.sun*3.1)*.09])}
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
 elapsed=0;worldTime=0;transitionStart=-100; // no cross-fade on reset
 smoothed={...config.params}; // pin params; no stale smoothing
 quality=1;qualityTarget=1;slowCount=0;goodCount=0;frames=0;lastFrame=0;
 current=build(config,0); // rebuild world from current seeded config at t=0
 try{resize()}catch(e){} // rebuild framebuffer targets at RM.W x RM.H
};
// ---- Module interface ----
// window.__drownedHooks exposes the studio internals the Seed Console adapter needs.
// (The original single file shared these as top-level script bindings; ES modules
// keep them module-private, so the adapter reads them through these hooks.)
// Added during modularization; existing window.__render* contracts are unchanged.
window.__drownedHooks={
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
 if(config.realm<=1)renderLensBlur(fade);
 renderBloom();
 gl.bindFramebuffer(gl.FRAMEBUFFER,postTarget.fb);gl.viewport(0,0,width,height);gl.disable(gl.BLEND);const p=programs.post;gl.useProgram(p.p);commonUniforms(p,current,worldTime,smoothed);sampler(p,'uBlurred',lensTarget.tex,3);sampler(p,'uTex',sceneTarget.tex,0);sampler(p,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);sampler(p,'uBloom',bloomA.tex,2);uniform(p,'uMix',previous?fade:1);opticalUniforms(p);uniform(p,'uGrain',smoothed.grain);uniform(p,'uPalette',smoothed.palette+((hash(config.layout+':palette')%1000)/1000-.5)*.45);screen(p);
 if(!fxaaProgram)fxaaProgram=program(screenVert,fxaaFrag);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.disable(gl.BLEND);gl.useProgram(fxaaProgram.p);sampler(fxaaProgram,'uTex',postTarget.tex,0);uniform(fxaaProgram,'uSize',[width,height]);screen(fxaaProgram);
 if(recording)updateRecording(now);
 if(RM.phase==='warmup'){RM.frame++;if(RM.frame>=RM.warmup&&RM.onPhase){try{RM.onPhase('reset')}catch(e){}}}
 else if(RM.phase==='record'){if(RM.onFrame){try{RM.onFrame(RM.frame)}catch(e){}}RM.frame++;if(RM.frame>=RM.totalFrames&&RM.onPhase){try{RM.onPhase('done')}catch(e){}}}
 requestAnimationFrame(draw);return;
}
if(contextLost)return;requestAnimationFrame(draw);const dt=lastFrame?Math.min((now-lastFrame)/1000,.15):0;lastFrame=now;if(document.hidden)return;elapsed+=dt;worldTime+=dt*playbackRate;if(previewEnd!==null&&worldTime>=previewEnd){worldTime=previewEnd;previewEnd=null;playbackRate=1;$('pace').value='1';toast('Eight-hour preview complete. The world continues at ambient speed.')}if(frames%15===0)updateJourneyUI();frames++;if(frames>120&&dt>0){if(dt>.023){slowCount++;goodCount=0}else{goodCount++;slowCount=Math.max(0,slowCount-1)}if(slowCount>120){qualityTarget=Math.max(.28,qualityTarget-.1);slowCount=0}if(goodCount>600){qualityTarget=Math.min(1,qualityTarget+.04);goodCount=0}}quality=mix(quality,qualityTarget,1-Math.exp(-dt/5));
 for(const c of controls)smoothed[c[0]]=mix(smoothed[c[0]],config.params[c[0]],1-Math.exp(-dt/.10));
 const fade=ease((elapsed-transitionStart)/TRANSITION_DUR);renderWorld(current,worldTime,smoothed,sceneTarget);
 if(previous&&fade<1){if(!previous.frozen)renderWorld(previous,previous.savedTime+(elapsed-transitionStart),previous.config.params,oldTarget)}else if(previous){disposeWorld(previous);previous=null}
 if(config.realm<=1)renderLensBlur(fade);
 renderBloom();
 gl.bindFramebuffer(gl.FRAMEBUFFER,postTarget.fb);gl.viewport(0,0,width,height);gl.disable(gl.BLEND);const p=programs.post;gl.useProgram(p.p);commonUniforms(p,current,worldTime,smoothed);sampler(p,'uBlurred',lensTarget.tex,3);sampler(p,'uTex',sceneTarget.tex,0);sampler(p,'uOld',previous?oldTarget.tex:sceneTarget.tex,1);sampler(p,'uBloom',bloomA.tex,2);uniform(p,'uMix',previous?fade:1);opticalUniforms(p);uniform(p,'uGrain',smoothed.grain);uniform(p,'uPalette',smoothed.palette+((hash(config.layout+':palette')%1000)/1000-.5)*.45);screen(p);
 if(!fxaaProgram)fxaaProgram=program(screenVert,fxaaFrag);
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.disable(gl.BLEND);gl.useProgram(fxaaProgram.p);sampler(fxaaProgram,'uTex',postTarget.tex,0);uniform(fxaaProgram,'uSize',[width,height]);screen(fxaaProgram);
 if(recording)updateRecording(now);
}
function changeWorld(next,resetClock=true){next=canonical(next);const made=build(next,resetClock?0:worldTime);snapshotWorld();if(previous)disposeWorld(previous);previous=current;if(previous)previous.frozen=true;if(previous)previous.savedTime=worldTime;current=made;config=next;if(resetClock){worldTime=0;if(playbackRate===120)previewEnd=28800}transitionStart=elapsed;remember(config);syncUI();updateJourneyUI();return true}
function updateJourneyUI(){if(seeking)return;const s=storyAt(config,worldTime);$('chapterName').textContent=s.name;const h=Math.floor(worldTime/3600),m=Math.floor(worldTime/60)%60;$('journeyClock').value=h+':'+String(m).padStart(2,'0')+' / 8:00';if(!seeking)$('journeySeek').value=Math.min(worldTime,28800);$('journeyHint').textContent=playbackRate===1?'Ambient pace · the world keeps moving.':playbackRate===120?'Eight-hour preview · four minutes.':playbackRate===60?'Eight hours unfold in eight minutes.':'Eight hours unfold in twenty minutes.';if(config.realm===1&&current){let complete=0,rising=0;for(const plane of current.planes)for(const lot of plane?.lots||[]){const state=cityProgress(lot,worldTime);if(state.complete)complete++;else if(state.active)rising++;}$('journeyHint').textContent=complete+' buildings complete · '+rising+' rising · '+playbackRate+'×';}}
function seekJourney(time){if(previous){toast('The scene is blending — one sec…');return false}time=clamp(time,0,28800);const made=build(config,time);previous=current;previous.savedTime=worldTime;current=made;worldTime=time;transitionStart=elapsed;if(playbackRate===120)previewEnd=28800;updateJourneyUI();return true}
$('pace').onchange=()=>{const requested=+$('pace').value;if(![1,24,60,120].includes(requested))return;if(requested===120&&worldTime>1){if(!seekJourney(0)){$('pace').value=String(playbackRate);return}}playbackRate=requested;previewEnd=requested===120?28800:null;updateJourneyUI()};
$('restartJourney').onclick=()=>seekJourney(0);
$('journeySeek').oninput=()=>{seeking=true;const t=+$('journeySeek').value;$('chapterName').textContent=storyAt(config,t).name;$('journeyClock').value=Math.floor(t/3600)+':'+String(Math.floor(t/60)%60).padStart(2,'0')+' / 8:00'};
$('journeySeek').onchange=()=>{const t=+$('journeySeek').value;seeking=false;seekJourney(t);updateJourneyUI()};
function syncLensUI(){const l=cleanLens(config.lens);config.lens=l;$('openLens').disabled=false;$('lensDescription').textContent=lensLooks[l.mode].description;lensLooks.forEach((v,i)=>$('lens-'+i)?.setAttribute('aria-pressed',String(i===l.mode)));$('lensAmount').value=config.params.focus;$('lensAmountValue').value=config.params.focus.toFixed(2);$('lensPosition').value=l.position;$('lensPositionValue').value=Math.round(l.position*100)+'%';$('lensWidth').value=l.width;$('lensWidthValue').value=Math.round(l.width*100)+'%';}
function applyLens(){config.lens=cleanLens(config.lens);current.config.lens={...config.lens};if(previous){disposeWorld(previous);previous=null;}syncLensUI();$('seedInput').value=codeOf(config);}
lensLooks.forEach((look,i)=>{const b=document.createElement('button');b.id='lens-'+i;b.setAttribute('aria-pressed','false');const title=document.createElement('strong'),note=document.createElement('small');title.textContent=look.name;note.textContent=look.note;b.append(title,note);b.onclick=()=>{config.lens={...cleanLens(config.lens),mode:i,width:look.width};applyLens();remember(config);};$('lensPresets').append(b);});
$('lensPosition').oninput=()=>{config.lens={...cleanLens(config.lens),position:+$('lensPosition').value};applyLens();};
$('lensWidth').oninput=()=>{config.lens={...cleanLens(config.lens),width:+$('lensWidth').value};applyLens();};
$('lensAmount').oninput=()=>{config.params.focus=+$('lensAmount').value;smoothed.focus=config.params.focus;current.config.params.focus=config.params.focus;applyLens();$('slider-focus').value=config.params.focus;$('value-focus').value=config.params.focus.toFixed(2);};
for(const id of ['lensPosition','lensWidth','lensAmount'])$(id).onchange=()=>{config=canonical(config);remember(config);syncUI();};
function syncUI(){syncLensUI();const pal=realms[config.realm];$('realmName').textContent=config.realm===1?cityPlan(config).name:pal.name;$('realmMood').textContent=pal.mood;$('seedMark').textContent=(config.layout>>>0).toString(36).toUpperCase()+' · '+(config.detail>>>0).toString(36).toUpperCase();$('seedInput').value=codeOf(config);document.querySelectorAll('[data-realm]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.realm===config.realm)));for(const c of controls){$('label-'+c[0]).textContent=config.realm===1?cityControlNames[c[0]]:c[1];$('slider-'+c[0]).value=config.params[c[0]];$('value-'+c[0]).value=config.params[c[0]].toFixed(2);$('lock-'+c[0]).setAttribute('aria-pressed',String(!!config.locks[c[0]]));$('lock-'+c[0]).textContent=config.locks[c[0]]?'Locked':'Lock'}}
function showHistory(){const root=$('historyList');root.replaceChildren();const values=history.filter(v=>!favoritesOnly||v.star);if(!values.length){const p=document.createElement('p');p.textContent='Star a seed to collect your favorite places.';root.append(p)}for(const v of values){const row=document.createElement('div');row.className='history-item';const star=document.createElement('button');star.className='star';star.textContent=v.star?'★':'☆';star.setAttribute('aria-label',v.star?'Unstar seed':'Star seed');star.onclick=()=>{v.star=!v.star;persist();showHistory()};const restore=document.createElement('button');restore.className='restore';const label=document.createElement('strong');label.textContent=realms[v.realm].name;const seed=document.createElement('small');seed.textContent=v.code;restore.append(label,seed);restore.onclick=()=>{const c=parseCode(v.code);if(c){c.locks={...v.locks};changeWorld(c)}};row.append(star,restore);root.append(row)}}
for(const c of controls){const wrap=document.createElement('div'),label=document.createElement('label');label.className='slider-label';label.htmlFor='slider-'+c[0];const name=document.createElement('span');name.id='label-'+c[0];name.textContent=c[1];const output=document.createElement('output');output.id='value-'+c[0];const lock=document.createElement('button');lock.id='lock-'+c[0];lock.className='lock';lock.type='button';lock.setAttribute('aria-label','Lock '+c[1]+' during Remix');lock.onclick=e=>{e.preventDefault();config.locks[c[0]]=!config.locks[c[0]];remember(config);syncUI()};label.append(name,output,lock);const input=document.createElement('input');input.type='range';input.id='slider-'+c[0];input.min=c[2];input.max=c[3];input.step=.001;input.value=c[4];input.oninput=()=>{config.params[c[0]]=+input.value;smoothed[c[0]]=+input.value;if(c[0]==='focus')syncLensUI();current.config.params[c[0]]=+input.value;if(previous){disposeWorld(previous);previous=null;}output.value=(+input.value).toFixed(2);$('seedInput').value=codeOf(config)};input.onchange=()=>{config=canonical(config);current.config.params={...config.params};if(c[0]==='density'&&config.realm!==1){const old=current.particles;current.particles=[makeParticles(config,0),makeParticles(config,1)];old.forEach(m=>m.dispose())}remember(config);syncUI()};wrap.append(label,input);$('sliders').append(wrap)}
$('random').onclick=()=>{const r=rng(fresh()),params={...defaults};for(const c of controls)params[c[0]]=c[0]==='grain'?.35+r()*.4:c[0]==='palette'?(r()-.5)*1.2:mix(c[2],c[3],.25+r()*.5);let layout=fresh();if(config.realm===1){for(let attempt=0;attempt<64&&cityFamily(layout)===cityFamily(config.layout);attempt++)layout=fresh();while(cityFamily(layout)===cityFamily(config.layout))layout=(layout+1)>>>0;}changeWorld({realm:config.realm,layout,detail:fresh(),params,lens:config.lens,locks:{...config.locks}})};
$('remix').onclick=()=>{const r=rng(fresh()),params={...config.params};for(const c of controls)if(!config.locks[c[0]])params[c[0]]=clamp(params[c[0]]+(r()-.5)*(c[3]-c[2])*.28,c[2],c[3]);changeWorld({...config,detail:fresh(),params},false)};
$('applySeed').onclick=()=>{const text=$('seedInput').value.trim();if(!text)return;const parsed=parseCode(text);if(/^PX1-/i.test(text)&&!parsed){toast('That seed code is incomplete. Paste the entire PX1 code.');return}changeWorld(parsed||{realm:config.realm,layout:hash(text),detail:hash(text+':details'),params:{...defaults},lens:config.lens,locks:{...config.locks}})};
$('seedInput').onkeydown=e=>{if(e.key==='Enter')$('applySeed').click()};
$('favorites').onclick=()=>{favoritesOnly=!favoritesOnly;$('favorites').setAttribute('aria-pressed',String(favoritesOnly));showHistory()};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
$('exportSeeds').onclick=()=>download(new Blob([JSON.stringify({instrument:'DROWNED FOREST',version:1,seeds:history},null,2)],{type:'application/json'}),'drowned-forest-seeds.json');
let hideTimer;function scheduleHide(){clearTimeout(hideTimer);if(!document.querySelector('.drawer.open'))hideTimer=setTimeout(()=>setHidden(true),18000)}
function setHidden(h){document.body.classList.toggle('hidden',h);const hidden=document.body.classList.contains('hidden');document.querySelectorAll('.chrome').forEach(e=>{e.inert=hidden});if(!hidden)scheduleHide()}
$('hide').onclick=()=>setHidden(true);canvas.onclick=()=>setHidden(!document.body.classList.contains('hidden'));
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
async function shareFile(){if(!recordFile)return false;try{if(navigator.canShare&&navigator.canShare({files:[recordFile]})){await navigator.share({files:[recordFile],title:'DROWNED FOREST'});return true}}catch(e){if(e.name==='AbortError')return false}return false}
function completed(){recording=false;clearInterval(recordTimer);document.body.classList.remove('recording');if(stream)stream.getTracks().forEach(t=>t.stop());releaseAwake();$('startRecord').disabled=false;$('startRecord').textContent='Start recording';$('duration').disabled=false;const type=recorder.mimeType||preferredMime||'video/webm';if(chunks.length){recordBlob=new Blob(chunks,{type});chunks=[];const ext=type.includes('mp4')?'mp4':'webm',name='drowned-forest-'+realms[config.realm].name.toLowerCase().replace(/ /g,'-')+'-'+Date.now()+'.'+ext;recordFile=new File([recordBlob],name,{type});if(recordURL)URL.revokeObjectURL(recordURL);recordURL=URL.createObjectURL(recordBlob);$('downloadRecording').href=recordURL;$('downloadRecording').download=name;$('fileInfo').textContent=(recordBlob.size/1048576).toFixed(1)+' MB · '+canvas.width+' × '+canvas.height+' · '+ext.toUpperCase();$('ready').style.display='block';$('recordState').textContent=recordError?'Partial capture saved':'Ready to save';setHidden(false);document.querySelectorAll('.drawer').forEach(e=>e.classList.remove('open'));$('record').classList.add('open');document.querySelector('[data-drawer="record"]').setAttribute('aria-expanded','true');clearTimeout(hideTimer);shareFile().then(shared=>{if(!shared)toast('Recording ready. Tap Share / Save to Files or Download.')})}else{$('recordState').textContent='No video was produced. Try another browser.'}resize()}
$('startRecord').onclick=async()=>{if(recording){stopRecording();return}if(!recordSupported)return;try{stream=canvas.captureStream(30);const options={videoBitsPerSecond:Math.round(clamp(canvas.width*canvas.height*6,4000000,16000000))};if(preferredMime)options.mimeType=preferredMime;recorder=new MediaRecorder(stream,options);chunks=[];recordError=false;recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};recorder.onstop=completed;recorder.onerror=()=>{recordError=true;toast('Capture was interrupted. Preparing the available video.');if(recorder.state!=='inactive')stopRecording()};recorder.start(1000);recordStart=performance.now();recordLimit=+$('duration').value;recording=true;document.body.classList.add('recording');$('startRecord').textContent='Stop recording';$('duration').disabled=true;$('recordInfo').textContent=canvas.width+' × '+canvas.height+' · 30 fps capture · '+(preferredMime.includes('mp4')?'MP4':preferredMime?'WebM':'browser format')+' · '+playbackRate+'× journey · real-time recording duration';$('ready').style.display='none';keepAwake();recordTimer=setInterval(()=>{if(recording)updateRecording(performance.now())},250)}catch(e){if(stream)stream.getTracks().forEach(t=>t.stop());recording=false;toast('Recording could not start: '+e.message)}};
$('shareRecording').onclick=async()=>{if(!await shareFile())toast('Use Download recording if file sharing is unavailable.')};
window.addEventListener('resize',()=>{if(!contextLost)resize()});document.addEventListener('visibilitychange',()=>{lastFrame=0;releaseAwake();if(!document.hidden)keepAwake()});document.addEventListener('pointerdown',()=>{if(!document.hidden)keepAwake()},{passive:true});
window.addEventListener('beforeunload',e=>{if(recording){e.preventDefault();e.returnValue=''}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextLost=true;if(recording)stopRecording();notice('The graphics context was interrupted. Reload to reopen this seed: '+codeOf(config))});
canvas.addEventListener('webglcontextrestored',()=>{notice('Graphics are available again. Reload this file to resume the instrument.')});
config=canonical(config);smoothed={...config.params};resize();current=build(config);remember(config);syncUI();updateJourneyUI();requestAnimationFrame(draw);scheduleHide();keepAwake();
