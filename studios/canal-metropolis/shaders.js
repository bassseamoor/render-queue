// Canal Metropolis — shader sources (extracted verbatim from canal-metropolis.html).
// Pure GLSL data: no imports, no side effects. `common` prefixes the lit
// background shaders; `opticalGLSL` is spliced into the post chain.
export const vert=`precision highp float;
attribute vec2 aPos;attribute vec4 aColor;attribute vec4 aMeta;attribute vec2 aUV;attribute vec4 aBuild;
uniform vec2 uSize;uniform vec2 uCamera;uniform float uZoom,uTime,uDepth,uFocus,uWeather,uParticleCut,uRealm,uGrowth,uStory;
varying vec4 vColor;varying vec4 vMeta;varying vec2 vUV;varying vec2 vWorld;varying vec4 vBuild;
float breathe(float t,float p){return (sin(t*.071+p)+.57*sin(t*.0471+p*1.731))/1.57;}
void main(){vec2 p=aPos;float phase=aMeta.x;
 float wave=breathe(uTime,phase);float small=(sin(uTime*.217+phase*2.3)+.43*sin(uTime*.3137+phase))/1.43;
 float mobility=aMeta.w>1.5?2.:aMeta.y;p.x+=mobility*(wave*.0018+small*.00017);p.y+=mobility*.00034*breathe(uTime*.83,phase+2.);
 // Materials 1/2 are soft sprites. Each center carries a different phase.
 // Wrap an entire sprite around its center, never its individual vertices.
 if(aMeta.w>1.5&&aMeta.w<2.5){float age=uTime*.009+phase*.131+.009*breathe(uTime*.13,phase);p.y+=fract((aMeta.y+.6)/1.2-age)*1.2-.6-aMeta.y;p.x+=breathe(uTime*.17,phase)*.002;}
 if(aMeta.w>2.5){p.y+=fract((aMeta.y+.6)/1.2+uTime*.00036+breathe(uTime*.17,phase)*.008)*1.2-.6-aMeta.y;p.x+=breathe(uTime*.19,phase+4.)*.008;}
 if(uRealm>3.5&&uRealm<4.5&&aMeta.y<0.&&aMeta.w<1.5){float floorY=-.16-uDepth*.27;p.y=floorY+(p.y-floorY)*(.72+.28*uGrowth);}
 if(uRealm>2.5&&uRealm<3.5&&aMeta.z>1.5&&aMeta.z<2.5)p.x+=(sin(uStory*.000087+phase*.04)+.41*sin(uStory*.000139+phase*.061))*.065*(.2+uDepth);
 vBuild=vec4(0.);float buildFade=1.;
 if(aBuild.y>0.){float raw=(uStory-aBuild.x)/aBuild.y;float built=smoothstep(0.,1.,raw);float level=clamp((aPos.y-aBuild.z)/aBuild.w,0.,1.);vBuild=vec4(aBuild.z+(built+.17*smoothstep(.92,1.12,raw))*aBuild.w,aPos.y,smoothstep(.06,.24,raw-level),1.);buildFade=smoothstep(-.07,.035,raw);
  if(aMeta.w< -1.5&&aMeta.w> -3.5){p.y-=aBuild.w*(1.-built);vBuild.w=2.;buildFade*=1.-smoothstep(1.01,1.18,raw);if(aMeta.w< -2.5){p.x+=breathe(uTime*.73,phase)*.002;p.y+=breathe(uTime*.57,phase+2.)*.003;}}
  if(aMeta.w< -3.5&&aMeta.w> -4.5){vBuild.w=3.;buildFade*=1.-smoothstep(.92,1.12,raw);}
  if(aMeta.w< -4.5&&aMeta.w> -5.5){vBuild.xy=vec2(aBuild.z+built*aBuild.w,aPos.x);}
  if(aMeta.w< -5.5){float direction=mod(floor(phase),2.)<1.?1.:-1.;float cx=mod(aBuild.z+2.6+uTime*.019*direction+breathe(uTime*.13,phase)*.017,5.2)-2.6;p.x+=cx-aBuild.z;vBuild.w=4.;buildFade=smoothstep(.93,1.2,raw);}
 }
 float rate=uDepth<.65 ? (.65-uDepth)*.45 :-(uDepth-.65)*1.8;
 p+=uCamera*rate;gl_Position=vec4(p.x*2./(uSize.x/uSize.y),p.y*2.,0.,1.);gl_Position.xy*=uZoom;
 vColor=aColor;vColor.a*=buildFade;if(buildFade<=0.)gl_Position=vec4(3.,3.,0.,1.);if(uParticleCut>=0.)vColor.a*=clamp((uParticleCut-phase)/8.,0.,1.);vMeta=aMeta;vUV=aUV;vWorld=p;
}`;
export const frag=`precision highp float;
varying vec4 vColor;varying vec4 vMeta;varying vec2 vUV;varying vec2 vWorld;varying vec4 vBuild;
uniform float uTime,uDepth,uWeather,uGlow,uRealm,uMist,uDay,uEnergy,uStory;uniform vec3 uFog,uKey;
float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float softnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(noise(i),noise(i+vec2(1.,0.)),f.x),mix(noise(i+vec2(0.,1.)),noise(i+1.),f.x),f.y);}
float b(float t,float p){return(sin(t*.071+p)+.57*sin(t*.0471+p*1.731))/1.57;}
void main(){vec3 col=vColor.rgb;float alpha=vColor.a;float mat=vMeta.z;float phase=vMeta.x;
 float light=1.+.03*uWeather;float swell=b(uTime*.76,phase+vWorld.x*.4);
 if(vBuild.w>.5){if(vBuild.w<1.5||vBuild.w>2.5&&vBuild.w<3.5)alpha*=1.-smoothstep(vBuild.x-.0012,vBuild.x+.0012,vBuild.y);if(vMeta.w>.5&&vMeta.w<1.5)alpha*=vBuild.z;}if(alpha<.00001)discard;
 if(mat>.5&&mat<1.5){vec2 q=(vUV*2.-1.)/(1.+.02*b(uTime*.81,phase));float r=dot(q,q);alpha*=exp(-r*5.)*(1.-smoothstep(.55,1.,r));col*=uGlow*(1.+.03*b(uTime,phase));}
 else if(mat>1.5&&mat<2.5){float meeting=mod(uTime+phase*19.+b(uTime*.47,phase)*.24,197.)-98.;float settling=exp(-meeting*meeting/1.21);vec2 q=(vUV*2.-1.)/(1.+.017*b(uTime*.83,phase)+.003*settling);float grain=softnoise(q*5.4+phase)+.4*softnoise(q*13.1+phase);float r=dot(q,q)+(grain-.7)*.10;float edge=1.-smoothstep(.44,.99,r);alpha*=edge;col*=.86+.14*q.y+.075*grain;}
 else if(mat>2.5&&mat<3.5){vec2 q=vUV*2.-1.;float r=dot(q,q);alpha*=(1.-smoothstep(.65,1.,r));float fres=pow(clamp(r,0.,1.),3.);col+=uKey*fres*.13;col+=vec3(.18,.37,.41)*exp(-length(q-vec2(.45,-.35))*14.)*.14;}
 else {float grain=noise(floor(vWorld*1300.));col*=.97+.06*grain;float surface=softnoise(vWorld*81.+phase)+.37*softnoise(vWorld*193.+phase);col*=.84+surface*.22;float caustic=sin(vWorld.x*36.+vWorld.y*12.+uTime*.022+phase)+.55*sin(vWorld.x*21.7-vWorld.y*23.1-uTime*.037+phase);col*=1.+.021*caustic;}
 if(vMeta.w>.5){alpha*=1.+.18*b(uTime*1.12,phase);if(vMeta.w>1.5)alpha*=smoothstep(-.58,-.42,vWorld.y)*(1.-smoothstep(.42,.58,vWorld.y));}
 float haze=(1.-exp(-pow(1.-min(uDepth,1.),1.7)*1.45))*uMist*.34;
 if(uRealm<.5||uRealm>2.5&&uRealm<3.5)col*=1.+uDay*.9;
 if(uRealm>.5&&uRealm<1.5&&(vMeta.w>.5||mat>.5&&mat<1.5))col*=mix(1.2,.30,uDay);
 if(uRealm<.5&&vMeta.w>1.5)alpha*=1.-uDay*.88;
 if(uRealm>1.5&&uRealm<2.5&&col.r>col.g*1.7)col*=.62+uEnergy*1.5;
 if(uRealm>3.5&&uRealm<4.5)col*=.65+uEnergy*.8;
 col=mix(col,uFog,clamp(haze,0.,.65));col*=light*(1.+.015*swell);
 gl_FragColor=vec4(col*alpha,alpha);
}`;
export const screenVert=`attribute vec2 aPos;varying vec2 vUV;void main(){vUV=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}`;
export const common=`precision highp float;varying vec2 vUV;
uniform vec2 uSize,uCamera,uKeyPos;uniform float uTime,uRealm,uWeather,uMist,uGlow,uRays,uSeed,uZoom,uStory,uDay,uEnergy,uGrowth,uFront;uniform vec3 uSky,uFog,uKey;
float hash2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash2(i),hash2(i+vec2(1.,0.)),f.x),mix(hash2(i+vec2(0.,1.)),hash2(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){return .54*n(p)+.27*n(p*2.03+17.)+.13*n(p*4.13-9.)+.06*n(p*8.39+3.);}
float b(float t,float p){return(sin(t*.071+p)+.57*sin(t*.0471+p*1.731))/1.57;}
vec2 world(){return (vUV-.5)*vec2(uSize.x/uSize.y,1.)/uZoom-uCamera*.29;}
`;
export const skyFrag=common+`
void main(){vec2 p=world();vec2 q=p;float phase=uSeed*.001;vec2 key=uKeyPos;float weather=1.+.03*uWeather;
 float clouds=fbm(p*3.4+vec2(uStory*.000035,-uStory*.000017)+phase);
 vec3 col=mix(uSky*.43,uFog*.75,(1.-smoothstep(-.5,.5,p.y)));
 col+=uFog*.075*clouds;float halo=exp(-length((p-key)*vec2(1.,1.1))*5.);col+=uKey*halo*.085*uGlow;
 if(uRealm<.5){float d=length(p-key);col+=uKey*(.54+uDay*.9)*(1.-smoothstep(.0245,.026,d));col+=uKey*(.07+uDay*.12)*exp(-d*16.)*uGlow;col*=1.-.1*clouds;}
 else if(uRealm<1.5){
  // Canal sky: richer gradient stops, warm horizon glow, proper soft sun disc.
  col=mix(uSky*.40,uFog*.80,1.-smoothstep(-.55,.55,p.y));
  col+=uKey*vec3(1.,.62,.34)*exp(-abs(p.y+.10)*6.)*.12;
  col+=uSky*exp(-max(p.y,0.)*3.2)*.28;
  vec2 sd=p-key;float sdd=length(sd);
  col+=uKey*((1.-smoothstep(.030,.036,sdd))*1.1+exp(-sdd*11.)*.22)*(.55+.45*uDay);
  col+=uKey*.018*pow(clouds,2.);
 }
 else if(uRealm<2.5){col+=vec3(.24,.045,.009)*exp(-abs(p.y+.13)*9.)*(.94+.06*clouds);col*=.9+clouds*.15;}
 else if(uRealm<3.5){col=mix(uSky,uFog,(1.-smoothstep(-.2,.44,p.y)));col+=uKey*(.09+uDay*.20)*halo;col+=uKey*(.6+uDay*1.4)*(1.-smoothstep(.039,.043,length(p-key)));col+=uKey*.10*pow(clouds,3.);}
 else if(uRealm<4.5){col*=.43;col+=uKey*exp(-length(p-vec2(-.2,-.05))*4.)*.025;}
 else {col=uSky*(.6+clouds*.28);vec2 center=vec2(-.12,-1.10);float radius=1.10;float d=length(p-center)-radius;float limb=exp(-abs(d)*95.);vec2 planetXY=(p-center)/radius;vec3 normal=vec3(planetXY,sqrt(max(0.,1.-dot(planetXY,planetXY))));float orbit=uStory/28800.*6.2831853-.8;vec3 sunlight=normalize(vec3(cos(orbit),.34,sin(orbit)));float day=smoothstep(-.15,.22,dot(normal,sunlight));vec3 land=mix(vec3(.012,.065,.105),vec3(.06,.14,.18),fbm(p*18.+phase));float cloudMap=smoothstep(.49,.68,fbm(p*13.+vec2(uStory*.000009,0.)+phase));land=mix(land,vec3(.27,.39,.45),cloudMap*.6);land*=.07+day*.93;float nightLights=pow(n(p*290.+phase),24.)*(1.-day);land+=vec3(.72,.42,.15)*nightLights*.25;col=mix(land,col,smoothstep(-.002,.002,d));col+=mix(vec3(.13,.45,.86),uKey,pow(day,18.))*limb*.51*uGlow;col+=uKey*exp(-length((p-vec2(.26,-.052))*vec2(1.,3.))*23.)*.39;}
 // Seeded star field, with sub-percent stellar scintillation at private phases.
 if(uRealm<.5||uRealm>4.5){vec2 cell=p*330.;vec2 id=floor(cell);vec2 offset=vec2(hash2(id+uSeed),hash2(id+13.+uSeed));float star=pow(max(0.,1.-length(fract(cell)-offset)*2.8),8.);float keep=step(.992,hash2(id+phase));float visible=uRealm>4.5?smoothstep(-.01,.10,p.y):smoothstep(.1,.35,p.y);col+=vec3(.62,.74,.83)*star*keep*visible*(.55+.05*b(uTime,offset.x*60.));}
 col*=weather*(1.+.016*b(uTime*.73,phase+p.x*.8));gl_FragColor=vec4(col,1.);
}`;
export const mistFrag=common+`uniform float uStage;
void main(){vec2 p=world();float phase=uSeed*.001;vec2 flow=vec2(uTime*.00019,-uTime*.000047);
 float low=fbm(p*vec2(2.7,5.2)+flow+phase);float high=fbm(p*vec2(6.1,9.3)-flow*1.47+phase+41.);
 float belt=exp(-pow((p.y+.14+uStage*.025)*3.9,2.));if(uRealm>4.5)belt*=.08;
 float breathing=1.+.10*b(uTime*.8,phase+p.x);float a=(low*.062+high*.023)*belt*uMist*breathing;
 float front=exp(-pow(p.x*1.1-uFront,2.)*2.2);a+=front*belt*.065*uMist;
 vec3 color=uFog*(1.04+.03*uWeather);vec2 key=uKeyPos+vec2(b(uTime*.37,phase)*.004,b(uTime*.29,phase+3.)*.003);
 float dx=p.x-key.x-(key.y-p.y)*.28;float shaft=pow(max(0.,sin(dx*21.+phase)+.39*sin(dx*34.7+2.1)),7.);shaft=min(shaft,.8)*smoothstep(.03,.19,key.y-p.y)*exp(-abs(p.y)*1.4);
 if(uRealm>4.5||uRealm>1.5&&uRealm<2.5)shaft*=.12;
 float ray=shaft*.024*uRays*(.85+low*.15);color+=uKey*ray*8.;a+=ray;
 // Broad pools of light slide across horizontal surfaces without changing their geometry.
 float pool=pow(low,3.)*exp(-pow((p.y+.29)*8.,2.))*.022*uGlow;
 if(uRealm>.5&&uRealm<1.5){
  // Fine falling streaks and a separate, slow wave of light down their wet edges.
  vec2 rainP=p*vec2(290.,40.);rainP.x+=p.y*7.;vec2 id=floor(rainP);float phase2=hash2(id+phase);float fall=fract(rainP.y+uTime*.11+.013*b(uTime*.31,phase2*40.));float streak=pow(max(0.,1.-abs(fract(rainP.x)-.5)*2.),19.)*smoothstep(.74,.96,fall)*step(.67,phase2);a+=streak*.022;color+=uKey*streak*.08;
  float steam=pow(fbm(p*vec2(8.,5.)+vec2(uTime*.0006,-uTime*.0012)+phase),3.)*exp(-pow((p.y+.12)*8.,2.));a+=steam*.075*uMist;
 }
 gl_FragColor=vec4(color*a+uKey*pool*(1.+.03*uWeather),a);
}`;
export const compositeFrag=`precision highp float;varying vec2 vUV;uniform sampler2D uTex;uniform vec2 uSize;uniform float uBlur,uOpacity;
void main(){if(uBlur<.25){gl_FragColor=texture2D(uTex,vUV)*uOpacity;return;}vec2 d=vec2(uBlur)/uSize;vec4 c=texture2D(uTex,vUV)*.20;
 // Eight taps on an irregular disk plus the center: no cross-shaped blur kernel.
 c+=texture2D(uTex,vUV+d*vec2(.93,.08))*.10;c+=texture2D(uTex,vUV+d*vec2(.61,.77))*.10;
 c+=texture2D(uTex,vUV+d*vec2(-.13,.94))*.10;c+=texture2D(uTex,vUV+d*vec2(-.76,.58))*.10;
 c+=texture2D(uTex,vUV+d*vec2(-.94,-.17))*.10;c+=texture2D(uTex,vUV+d*vec2(-.54,-.79))*.10;
 c+=texture2D(uTex,vUV+d*vec2(.19,-.91))*.10;c+=texture2D(uTex,vUV+d*vec2(.77,-.48))*.10;gl_FragColor=c*uOpacity;
}`;
export const opticalGLSL=`uniform vec4 uOptics;uniform vec3 uLensControl;
float opticalRadius(vec2 uv){vec2 q=uv-vec2(.5,uLensControl.y);float distance=uLensControl.x>.5?length(q*vec2(1.,1.18)):abs(q.y-q.x*.095);float amount=pow(smoothstep(uLensControl.z,uLensControl.z+.30,distance),1.55);return (uOptics.x+uOptics.y*amount)*uLens*(uSize.y/900.);}
`;
export const cityLensFrag=`precision highp float;varying vec2 vUV;uniform sampler2D uTex,uOld;uniform vec2 uSize;uniform float uMix,uLens;
`+opticalGLSL+`uniform float uBend;vec2 bendUV(vec2 q){vec2 cc=q-.5;return q+cc*dot(cc,cc)*uBend;}vec3 photograph(vec2 p){if(uMix>.999)return texture2D(uTex,p).rgb;return mix(texture2D(uOld,p).rgb,texture2D(uTex,p).rgb,uMix);}
void main(){vec2 buv=bendUV(vUV);float coc=opticalRadius(buv);if(coc<.25){gl_FragColor=vec4(photograph(buv),1.);return;}vec2 stepUV=vec2(coc)/uSize;vec3 color=photograph(buv)*.0625;color+=photograph(buv+stepUV*vec2(0.1290994,0.0000000))*.03125;color+=photograph(buv+stepUV*vec2(-0.1648807,0.1510442))*.03125;color+=photograph(buv+stepUV*vec2(0.0252376,-0.2875698))*.03125;color+=photograph(buv+stepUV*vec2(0.2078214,0.2710663))*.03125;color+=photograph(buv+stepUV*vec2(-0.3813779,-0.0674604))*.03125;color+=photograph(buv+stepUV*vec2(0.3612744,-0.2298132))*.03125;color+=photograph(buv+stepUV*vec2(-0.1208392,0.4495159))*.03125;color+=photograph(buv+stepUV*vec2(-0.2304535,-0.4437242))*.03125;color+=photograph(buv+stepUV*vec2(0.4999919,0.1825963))*.03125;color+=photograph(buv+stepUV*vec2(-0.5201583,0.2147138))*.03125;color+=photograph(buv+stepUV*vec2(0.2507507,-0.5358396))*.03125;color+=photograph(buv+stepUV*vec2(0.1852984,0.5907604))*.03125;color+=photograph(buv+stepUV*vec2(-0.5584914,-0.3236572))*.03125;color+=photograph(buv+stepUV*vec2(0.6551740,-0.1440382))*.03125;color+=photograph(buv+stepUV*vec2(-0.3998425,0.5687348))*.03125;color+=photograph(buv+stepUV*vec2(-0.0923729,-0.7128351))*.03125;color+=photograph(buv+stepUV*vec2(0.5670789,0.4779347))*.03125;color+=photograph(buv+stepUV*vec2(-0.7631104,0.0315570))*.03125;color+=photograph(buv+stepUV*vec2(0.5566305,-0.5539217))*.03125;color+=photograph(buv+stepUV*vec2(-0.0372407,0.8053652))*.03125;color+=photograph(buv+stepUV*vec2(-0.5296357,-0.6346805))*.03125;color+=photograph(buv+stepUV*vec2(0.8390014,0.1128865))*.03125;color+=photograph(buv+stepUV*vec2(-0.7108842,0.4946147))*.03125;color+=photograph(buv+stepUV*vec2(0.1942545,-0.8634805))*.03125;color+=photograph(buv+stepUV*vec2(0.4493004,0.7840892))*.03125;color+=photograph(buv+stepUV*vec2(-0.8783393,-0.2802142))*.03125;color+=photograph(buv+stepUV*vec2(0.8531949,-0.3941977))*.03125;color+=photograph(buv+stepUV*vec2(-0.3696254,0.8832009))*.03125;color+=photograph(buv+stepUV*vec2(-0.3298825,-0.9171573))*.03125;color+=photograph(buv+stepUV*vec2(0.8777819,0.4613376))*.03125;gl_FragColor=vec4(color,1.);}`;
export const citySnapshotFrag=`precision highp float;varying vec2 vUV;uniform sampler2D uTex,uOld;uniform float uMix;void main(){gl_FragColor=mix(texture2D(uOld,vUV),texture2D(uTex,vUV),uMix);}`;
export const postFrag=common+`uniform sampler2D uTex,uOld,uBlurred,uAO,uDepth;uniform float uMix,uGrain,uPalette,uLens,uAOOn,uAA,uBend,uHasDepth;
`+opticalGLSL+`
// xXAA — full edge-search FXAA (quality class). Replaces the cheap 9-tap console
// approximation: a contrast gate keeps flat areas perfectly crisp, then real
// edges get orientation detection plus an endpoint search along the edge.
float fxaaContrast(vec4 a,vec4 b){vec4 d=abs(a-b);return max(max(max(d.r,d.g),d.b),d.a);}
vec3 fxaaTap(sampler2D tex,vec2 uv,vec2 px){
 vec4 rgbaM=texture2D(tex,uv);
 vec4 rgbaN=texture2D(tex,uv+vec2(0.,-px.y)),rgbaS=texture2D(tex,uv+vec2(0.,px.y));
 vec4 rgbaE=texture2D(tex,uv+vec2(px.x,0.)),rgbaW=texture2D(tex,uv+vec2(-px.x,0.));
 float edgeT=.2,invEdgeT=5.;
 if(max(max(max(fxaaContrast(rgbaM,rgbaN),fxaaContrast(rgbaM,rgbaS)),fxaaContrast(rgbaM,rgbaE)),fxaaContrast(rgbaM,rgbaW))<edgeT)return rgbaM.rgb;
 float cN=fxaaContrast(rgbaM,rgbaN),cS=fxaaContrast(rgbaM,rgbaS),cE=fxaaContrast(rgbaM,rgbaE),cW=fxaaContrast(rgbaM,rgbaW);
 float relV=(cN+cS-cE-cW)*invEdgeT;
 bool horzSpan=relV>0.;
 if(abs(relV)<.3){
  vec2 toEdge=vec2(cE>cW?1.:-1.,cS>cN?1.:-1.);
  float matchH=fxaaContrast(rgbaM,texture2D(tex,uv+vec2(toEdge.x,-toEdge.y)*px));
  float matchV=fxaaContrast(rgbaM,texture2D(tex,uv+vec2(-toEdge.x,toEdge.y)*px));
  relV=(matchV-matchH)*invEdgeT;
  if(abs(relV)<.3)return mix(rgbaM,(rgbaN+rgbaS+rgbaE+rgbaW)*.25,.4).rgb;
  horzSpan=relV>0.;
 }
 if(!horzSpan){rgbaN=rgbaW;rgbaS=rgbaE;}
 bool pairN=fxaaContrast(rgbaM,rgbaN)>fxaaContrast(rgbaM,rgbaS);
 if(!pairN)rgbaN=rgbaS;
 vec2 offNP=vec2(horzSpan?px.x:0.,horzSpan?0.:px.y);
 bool doneN=false,doneP=false;float nDist=0.,pDist=0.;vec2 posN=uv,posP=uv;int itN=0,itP=0;
 for(int i=0;i<5;i++){
  float inc=float(i+1);
  if(!doneN){nDist+=inc;posN=uv+offNP*nDist;vec4 eN=texture2D(tex,posN);doneN=fxaaContrast(eN,rgbaM)>fxaaContrast(eN,rgbaN);itN=i;}
  if(!doneP){pDist+=inc;posP=uv-offNP*pDist;vec4 eP=texture2D(tex,posP);doneP=fxaaContrast(eP,rgbaM)>fxaaContrast(eP,rgbaN);itP=i;}
  if(doneN||doneP)break;
 }
 if(!doneP&&!doneN)return rgbaM.rgb;
 float dist=min(doneN?float(itN)/4.:1.,doneP?float(itP)/4.:1.);
 dist=1.-pow(dist,.5);
 return mix(rgbaM,rgbaN,dist*.5).rgb;
}
// Subtle barrel distortion, like a real camera lens: the center stays put,
// the edges bend outward just slightly. Applied only to the canal finish.
// Filmic tone mapping (Krzysztof Narkowicz ACES fit): exposure is applied by the
// caller, this maps HDR -> display-referred sRGB-ready values. Deterministic.
vec3 acesF(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec2 bendUV(vec2 q){vec2 cc=q-.5;return q+cc*dot(cc,cc)*uBend;}
vec3 photograph(vec2 uv){vec3 c=uAA>.5?fxaaTap(uTex,uv,1./uSize):texture2D(uTex,uv).rgb;if(uMix>.999)return c;return mix(texture2D(uOld,uv).rgb,c,uMix);}
void main(){vec2 uv=vUV;vec2 p=world();float phase=uSeed*.001;
 if(uRealm>.5&&uRealm<1.5){uv=bendUV(uv);
  float linZ=160.,linF=30.;
  if(uHasDepth>.5){
   // Depth-pass effects, straight from the main render's depth buffer.
   float zNdc=texture2D(uDepth,uv).x*2.-1.;
   linZ=(2.*8.*160.)/(160.+8.-zNdc*(160.-8.));
   float fNdc=texture2D(uDepth,vec2(.5)).x*2.-1.;
   linF=(2.*8.*160.)/(160.+8.-fNdc*(160.-8.));
  }
  // Depth-assisted focus: blur grows gently where depth differs from the
  // screen-center focus plane, so the sharp middle stays crystal clear.
  float coc=opticalRadius(uv)+clamp(abs(linZ-linF)*.025,0.,1.)*.4;
  vec3 sharp=photograph(uv),color=mix(sharp,texture2D(uBlurred,uv).rgb,smoothstep(.25,1.25,coc));
 if(coc<1.&&uOptics.z>0.){vec2 px=1./uSize;vec3 neighbors=(photograph(uv+vec2(px.x,0.))+photograph(uv-vec2(px.x,0.))+photograph(uv+vec2(0.,px.y))+photograph(uv-vec2(0.,px.y)))*.25;color+=(1.-coc)*uOptics.z*(sharp-neighbors);}
 color=mix(vec3(dot(color,vec3(.2126,.7152,.0722))),color,1.12);color*=vec3(1.03+uPalette*.20,1.,.96-uPalette*.20)*1.35;
 // Restrained bright-pass bloom: a 4-tap diamond of the HDR buffer, tonemapped
 // on its own so only hot spots (lamps, window lights, sun glints) lift.
 vec2 bpx=3.5/uSize;vec3 bsum=texture2D(uTex,uv+vec2(bpx.x,0.)).rgb+texture2D(uTex,uv-vec2(bpx.x,0.)).rgb+texture2D(uTex,uv+vec2(0.,bpx.y)).rgb+texture2D(uTex,uv-vec2(0.,bpx.y)).rgb;
 float bmask=smoothstep(.78,1.2,max(max(bsum.r,bsum.g),bsum.b)*.25)*uMix;
 color=acesF(color)+acesF(bsum*.25)*bmask*.10;
 float aerial=smoothstep(26.,120.,linZ);color=mix(color,color*vec3(.93,.97,1.05)+vec3(.012,.028,.045),aerial*.5);color*=mix(1.,texture2D(uAO,uv).r,uAOOn);
 float vd=length((uv-.5)*vec2(1.12,.94));color*=mix(.82,1.,1.-smoothstep(.32,1.02,vd));
 color+=(hash2(gl_FragCoord.xy+floor(uTime*8.))-.5)*.007*uGrain;gl_FragColor=vec4(clamp(color,0.,1.),1.);return;}

 // True screen-space refraction: sample the already-composited scene at a distorted position.
 if(uRealm>1.5&&uRealm<2.5){float strength=(1.-smoothstep(-.42,.13,p.y));uv.x+=(sin(p.y*77.+uTime*.17)+.43*sin(p.y*123.7-uTime*.113+phase))*.00032*strength;uv.y+=sin(p.x*43.+uTime*.097)*sin(p.y*31.-uTime*.061)*.00012*strength;}
 if(uRealm<.5&&p.y<-.15){float water=(1.-smoothstep(-.38,-.15,p.y));uv.x+=(sin(p.y*155.+uTime*.063)+.48*sin(p.y*241.3-uTime*.087))*water*.00011;}
 vec3 col=mix(texture2D(uOld,uv).rgb,texture2D(uTex,uv).rgb,uMix);
 vec2 fringe=(uv-.5)*.00013*uGlow;col.r=mix(col.r,texture2D(uTex,uv+fringe).r,.22*uMix);col.b=mix(col.b,texture2D(uTex,uv-fringe).b,.22*uMix);
 col*=mix(vec3(.85,.96,1.04),vec3(1.035,1.015,.96),vUV.y);col*=vec3(1.+uPalette*.065,1.-abs(uPalette)*.022,1.-uPalette*.065);
 col=1.-exp(-col*1.19);col=pow(max(col,vec3(0.)),vec3(.88));
 float vignette=1.-.20*pow(length((vUV-.5)*vec2(.95,1.)),1.7)*(1.+.012*b(uTime*.76,phase));col*=vignette;
 float grain=hash2(gl_FragCoord.xy+vec2(floor(uTime*12.)*13.7,phase))-.5;col+=grain*.014*uGrain;
 gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`;
export const cityVertex=`precision highp float;
attribute vec3 aPosition,aNormal,aTint;attribute vec4 aSchedule,aInfo,aRoute;attribute vec2 aTex;
uniform mat4 uViewProjection,uLightMatrix;uniform float uStory,uTime,uDensity;uniform vec2 uFlyby;uniform vec3 uEye;uniform float uPigPulse;
varying vec3 vPosition,vNormal,vTint;varying vec2 vTex,vBuild;varying vec4 vInfo,vShadow;varying float vFade,vProgress;
void main(){vec3 p=aPosition;float fade=1.,raw=10.;vBuild=vec2(10000.,0.);
 if(aSchedule.y>0.){raw=(uStory-aSchedule.x)/aSchedule.y;float progress=smoothstep(0.,1.,raw),height=aSchedule.z+aSchedule.w*progress,frontier=height+max(1.2,aSchedule.w*.15)*smoothstep(1.,1.16,raw);
  fade=smoothstep(-.06,.02,raw);
  // Native surfaces stay in place. Both the color and shadow passes clip at the build frontier.
  if(aInfo.z<1.5)vBuild=vec2(frontier,1.);
  else if(aInfo.z<2.5){float fold=1.-smoothstep(1.01,1.09,raw),lower=1.-smoothstep(1.09,1.20,raw);p.xz=aRoute.xy+(p.xz-aRoute.xy)*fold;p.y=(p.y-aSchedule.w*(1.-progress))*lower;fade*=lower;}
  else if(aInfo.z<3.5){
   p.y=frontier;fade*=step(max(aRoute.x+(aRoute.w>.5?.0001:0.),aRoute.w>1.5?aInfo.w+.0001:aRoute.x),frontier)*(1.-step(aRoute.y,frontier));
   if(aRoute.w>.5){float t=clamp((frontier-aRoute.x)/(aRoute.y-aRoute.x),0.,1.),radius;
    if(aRoute.w<1.5)radius=mix(1.,aRoute.z,t);
    else{float y=t*2.-1.,ring=acos(clamp(y,-1.,1.))/3.14159265359*aRoute.w,j=floor(ring),a=j/aRoute.w*3.14159265359,b=(j+1.)/aRoute.w*3.14159265359;radius=mix(sin(a),sin(b),clamp((cos(a)-y)/max(.0001,cos(a)-cos(b)),0.,1.));}
    p.xz+=aTex*(radius-1.);
   }
  }
  else if(aInfo.z<4.5){float gate=smoothstep(-.06,.02,raw)*(1.-smoothstep(1.10,1.20,raw));p.y=.032+(p.y-.032)*gate;fade*=gate;}
  else if(aInfo.z>6.5){float lower=1.-smoothstep(1.09,1.20,raw);p.y=.032+(p.y-.032)/max(.1,aSchedule.w+.50)*(height+.50)*lower;fade*=lower;}
 }
 if(aInfo.z>4.5&&aInfo.z<6.5){float travel=mod(aInfo.y*.13+uTime*aRoute.w,aRoute.z);
  float sf=aSchedule.x,dwl=aSchedule.z;
  if(sf>-.5&&dwl>0.&&aRoute.z>0.){float cyc=travel/aRoute.z;float cm=cyc-sf;cm-=floor(cm);
   float g01=clamp((cm-dwl)/max(.001,1.-dwl),0.,1.);g01=g01*g01*(3.-2.*g01);
   travel=(sf+g01)*aRoute.z;if(travel>=aRoute.z)travel-=aRoute.z;}
  p.xz+=aRoute.xy*travel;fade*=smoothstep(0.,.22,travel)*(1.-smoothstep(aRoute.z-.22,aRoute.z,travel));if(aInfo.z<5.5)fade*=1.-smoothstep(uDensity*66.,uDensity*66.+5.,aInfo.y);else p.y+=.004*sin(uTime*.31+aInfo.y)+.002*sin(uTime*.53+aInfo.y*1.7);}
 // Sky life: birds, blimp, airliners, formation flyby and its smoke. All motion is a
 // pure function of seed-baked values and uTime, so renders stay deterministic.
 else if(aInfo.z>7.5&&aInfo.z<12.5){
  if(aInfo.z<8.5){float brnd=fract(aInfo.y*.618034);float ang=uTime*aRoute.w+aInfo.y*2.1;vec2 bc=aRoute.xy+vec2(cos(ang),sin(ang))*(aRoute.z*(.62+.76*brnd));float head=ang+(aRoute.w>0.?1.5707963:-1.5707963),ch=cos(head),sh=sin(head);vec2 lp=vec2(p.x*ch-p.z*sh,p.x*sh+p.z*ch);p.x=bc.x+lp.x;p.z=bc.y+lp.y;p.y+=sin(uTime*.9+aInfo.y)*1.1+sin(uTime*(7.+brnd*3.)+aInfo.y*40.)*.26*abs(aTex.x);}
  else if(aInfo.z<9.5){float ang=uTime*aRoute.w+aInfo.y*2.1;vec2 bc=aRoute.xy+vec2(cos(ang),sin(ang))*aRoute.z;float head=ang+(aRoute.w>0.?1.5707963:-1.5707963),ch=cos(head),sh=sin(head);vec2 lp=vec2(p.x*ch-p.z*sh,p.x*sh+p.z*ch);p.x=bc.x+lp.x;p.z=bc.y+lp.y;p.y+=sin(uTime*.45+aInfo.y)*.6;}
  else if(aInfo.z<10.5){float travel=mod(aInfo.y*29.3+uTime*aRoute.w,aRoute.z);p.x+=aRoute.x*(travel-aRoute.z*.5);p.z+=aRoute.y*(travel-aRoute.z*.5);p.y+=sin(uTime*.8+aInfo.y*2.)*.35;fade*=smoothstep(0.,8.,travel)*(1.-smoothstep(aRoute.z-8.,aRoute.z,travel));}
  else if(aInfo.z<11.5){float tc=uTime-uFlyby.y;float tIn=mod(tc,uFlyby.x);float L=aRoute.z,spd=aRoute.w;p.x+=aRoute.x*(tIn*spd-L*.5);p.z+=aRoute.y*(tIn*spd-L*.5);fade*=step(0.,tc)*step(tIn,L/spd+1.5)*smoothstep(0.,3.,tIn);}
  else{float tc=uTime-uFlyby.y;float tIn=mod(tc,uFlyby.x);float L=aRoute.z,spd=aRoute.w,age=aTex.x;float et=tIn-age;float ok=step(0.,tc)*step(0.,et)*step(et,L/spd)*step(age,7.);float wdt=ok*(1.-age/7.)*smoothstep(0.,.25,age);vec2 fw=aRoute.xy,pv=vec2(-fw.y,fw.x);vec2 joff=aSchedule.zw;vec2 ep=fw*(et*spd-L*.5)+joff+vec2(.55,.18)*age;vec2 lp=p.xz*(1.+age*.18)*wdt;p.x=ep.x+fw.x*lp.x+pv.x*lp.y;p.z=ep.y+fw.y*lp.x+pv.y*lp.y;p.y+=sin(age*2.2+aInfo.y*3.)*.14*age*wdt;}
 }
 else if(aInfo.z>12.5&&aInfo.z<13.5){
  // Billboards: each runs its own seeded appearance cycle, a pure function of uTime.
  float cyc=uTime/max(aRoute.z,1.),ph=fract(cyc+aInfo.y);
  fade*=smoothstep(.02,.10,ph)*(1.-smoothstep(.62,.80,ph));
 }
 else if(aInfo.z>13.5&&aInfo.z<14.5){
  // Clouds: slow deterministic drift across the sky, fading at the route ends.
  float travel=mod(aInfo.y*37.7+uTime*aRoute.w,aRoute.z);
  p.x+=aRoute.x*(travel-aRoute.z*.5);
  fade*=smoothstep(0.,12.,travel)*(1.-smoothstep(aRoute.z-12.,aRoute.z,travel));
 }
 // City systems (Worker B): pedestrians, ring trucks, pigeons, beacons. All motion is a
 // pure function of seed-baked values, uTime, uEye and uPigPulse, so renders stay deterministic.
 else if(aInfo.z>14.5&&aInfo.z<15.5){
  float travel=mod(aInfo.y*.13+uTime*aRoute.w,aRoute.z);
  float sf=aSchedule.x,dwl=aSchedule.z,cm=0.;
  if(sf>-.5&&dwl>0.&&aRoute.z>0.){float cyc=travel/aRoute.z;cm=cyc-sf;cm-=floor(cm);
   float g01=clamp((cm-dwl)/max(.001,1.-dwl),0.,1.);g01=g01*g01*(3.-2.*g01);
   travel=(sf+g01)*aRoute.z;if(travel>=aRoute.z)travel-=aRoute.z;}
  p.xz+=aRoute.xy*travel;
  float moving=sf>-.5?smoothstep(dwl-.03,dwl+.06,cm):1.;
  p.y+=abs(sin(travel*24.+aInfo.y*7.))*.012*moving;
  fade*=smoothstep(0.,.15,travel)*(1.-smoothstep(aRoute.z-.15,aRoute.z,travel));
 }
 else if(aInfo.z>15.5&&aInfo.z<16.5){
  float ang=uTime*aRoute.w+aInfo.y*2.1;
  vec2 cc=aRoute.xy;float rad=aRoute.z;
  float head=ang+(aRoute.w>0.?1.5707963:-1.5707963);
  float ch=cos(head),sh=sin(head);
  vec2 lp=vec2(p.x*ch-p.z*sh,p.x*sh+p.z*ch);
  p.x=cc.x+cos(ang)*rad+lp.x;p.z=cc.y+sin(ang)*rad+lp.y;
 }
 else if(aInfo.z>16.5&&aInfo.z<17.5){
  vec2 spot=aRoute.xy;float ph=aInfo.y;
  float sc=smoothstep(15.,7.5,distance(uEye.xz,spot));
  sc=max(sc,uPigPulse);
  float wob=1.-sc;
  vec2 wander=vec2(sin(uTime*.43+ph*3.1),cos(uTime*.37+ph*2.3))*aRoute.z*wob;
  float fly=sc*(1.4+.5*sin(uTime*3.+ph*5.));
  p.x+=spot.x+wander.x+aSchedule.x*fly;p.z+=spot.y+wander.y+aSchedule.y*fly;
  p.y+=sc*(1.2+.45*sin(uTime*9.+ph*7.))+abs(sin(uTime*2.2+ph*3.))*.012*wob;
 }
 else if(aInfo.z>17.5&&aInfo.z<18.5){
  float bl=.5+.5*sin(uTime*2.3+aInfo.y*39.);
  fade*=smoothstep(.15,.85,bl);
 }
 else if(aInfo.z>18.5&&aInfo.z<19.5){
  // Worker C: chimney smoke — soft puffs rise, swell and loop, a pure function of uTime.
  float cyc=fract(uTime*aRoute.w+aInfo.y*.0137),rise=cyc*aRoute.z,grow=.55+cyc*1.5;
  p.y+=rise;p.xz=aRoute.xy+(p.xz-aRoute.xy)*grow;
  fade*=(1.-cyc)*smoothstep(0.,.10,cyc);
 }
 else if(aInfo.z>19.5&&aInfo.z<20.5){
  // Worker C: flags — ripple grows away from the pole edge, a pure function of uTime.
  float hang=aTex.x;
  p.z+=sin(uTime*7.3+aInfo.y*2.9+hang*8.5)*.045*hang;
  p.y+=sin(uTime*5.1+aInfo.y*2.1+hang*6.0)*.016*hang;
 }
 vPosition=p;vNormal=aNormal;vTint=aTint;vTex=aTex;vInfo=aInfo;vInfo.y=floor(aInfo.y*100.+.5);vFade=fade;vProgress=raw;vShadow=uLightMatrix*vec4(p,1.);gl_Position=uViewProjection*vec4(p,1.);if(fade<.0001)gl_Position=vec4(3.,3.,0.,1.);
}`;
export const cityFragment=`precision highp float;
varying vec3 vPosition,vNormal,vTint;varying vec2 vTex,vBuild;varying vec4 vInfo,vShadow;varying float vFade,vProgress;
uniform mat4 uLightMatrix;uniform highp sampler2D uShadow;uniform sampler2D uMaterial;uniform sampler2D uBlimpSign;uniform sampler2D uBillboard;uniform sampler2D uFoliage;uniform sampler2D uSignage,uGraffiti,uFlag;uniform vec3 uEye,uSun,uLandTint,uWaterTint;uniform vec4 uGeo,uMap;uniform vec2 uCenter,uSpacing,uBounds;uniform vec3 uPark;uniform float uTime,uStory,uWeather,uMist,uGlow,uRays,uPixelScale;uniform float uSunI,uAmbI,uTod;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float landDistance(vec2 p){float type=uGeo.x,phase=uGeo.y,offset=uGeo.z,water=uGeo.w;float river=offset+sin(p.y*uMap.x+phase)*uMap.y+p.y*uMap.z;
 if(type<.5)return abs(p.x-river)-water;if(type<1.5)return offset+sin(p.y*.09+phase)*4.-p.x;if(type<2.5)return length((p-uCenter)/vec2(1.50,2.4))-1.52;if(type<3.5)return 20.;if(type<4.5)return min(abs(p.x-river)-water,abs(p.y-offset*.7-sin(p.x*.12+phase)*2.)-water*.72);return p.y-offset-sin(p.x*.095+phase)*3.8;}
float unpack(vec4 c){return dot(c,vec4(1.,1./255.,1./65025.,1./16581375.));}
float shadow(vec3 N){
 float reach=length(vPosition.xz);if(reach>36.||dot(N,uSun)<.025)return 1.;
 vec3 q=vShadow.xyz/vShadow.w*.5+.5;if(q.x<0.||q.x>1.||q.y<0.||q.y>1.||q.z<0.||q.z>1.)return 1.;
 // Compare each sample against the RECEIVER PLANE at that sample, not the center depth.
 // Inverse-transpose normal for ortho(34, .1, 130), derived from its squared axis scales.
 vec3 lightNormal=(uLightMatrix*vec4(N,0.)).xyz*vec3(1156.,1156.,4218.5025);
 vec2 slope=clamp(-lightNormal.xy/(abs(lightNormal.z)<.0001?.0001:lightNormal.z),vec2(-12.),vec2(12.));
 vec2 grid=q.xy*1024.-.5,base=floor(grid),f=fract(grid);
 vec2 p00=(base+vec2(.5,.5))/1024.,p10=(base+vec2(1.5,.5))/1024.,p01=(base+vec2(.5,1.5))/1024.,p11=(base+vec2(1.5,1.5))/1024.;
 float bias=.00012;
 float s00=step(q.z+dot(slope,p00-q.xy)-bias,unpack(texture2D(uShadow,p00))),s10=step(q.z+dot(slope,p10-q.xy)-bias,unpack(texture2D(uShadow,p10))),s01=step(q.z+dot(slope,p01-q.xy)-bias,unpack(texture2D(uShadow,p01))),s11=step(q.z+dot(slope,p11-q.xy)-bias,unpack(texture2D(uShadow,p11)));
 float lit=mix(mix(s00,s10,f.x),mix(s01,s11,f.x),f.y);return mix(lit,1.,smoothstep(26.,36.,reach));
}

void main(){if(vFade<.015||(vBuild.y>.5&&vPosition.y>vBuild.x))discard;vec3 N=normalize(vNormal),V=normalize(uEye-vPosition);float footprint=length(uEye-vPosition)*uPixelScale/max(.22,abs(dot(N,V)));float mat=vInfo.x,seed=floor(vInfo.y+.5);vec3 albedo=vTint;float nightF=1.-smoothstep(.05,.55,uTod);if(mat>10.5&&mat<11.5){float shore=landDistance(vPosition.xz);mat=shore<0.?6.:5.;vec2 p=vPosition.xz;float park=uGeo.x>1.5&&uGeo.x<2.5?1.-smoothstep(4.10,4.45,length((p-uCenter)/vec2(1.15,2.2))):uGeo.x>2.5&&uGeo.x<3.5?1.-smoothstep(3.0,3.5,length(p)):1.-smoothstep(uPark.z-.25,uPark.z+.25,length(p-uPark.xy));float town=1.-smoothstep(.96,1.10,max(abs(p.x)/uBounds.x,abs(p.y)/uBounds.y));vec3 land=mix(uLandTint,mix(vec3(.30,.33,.30),uLandTint,park),town);albedo=shore<0.?uWaterTint:mix(vec3(.48,.44,.30),land,smoothstep(0.,.23,shore));}float rough=.7,metal=0.;vec3 emission=vec3(0.);float grain=texture2D(uMaterial,fract(vPosition.xz*.17)).b;albedo*=.992+.016*grain;
 // Facade detail follows floor courses; broad mineral variation precedes fine joints.
 if(mat>.5&&mat<3.5&&abs(N.y)<.5){
  float floorHeight=max(.32,vInfo.w),bay=mat<1.5?.29:.38;
  vec2 coord=vec2(vTex.x/bay,vPosition.y/floorHeight),cell=floor(coord),f=fract(coord);
  float aa=clamp(footprint/bay*.6,.025,.32),nearDetail=(1.-smoothstep(.035,.16,footprint));
  float left=mat<1.5?.08:.20,right=1.-left,low=mat<1.5?.12:.23;
  float panes=smoothstep(left-aa,left+aa,f.x)*(1.-smoothstep(right-aa,right+aa,f.x))*smoothstep(low-aa,low+aa,f.y)*(1.-smoothstep(.86-aa,.86+aa,f.y));
  panes=mix(panes,(right-left)*(.86-low),smoothstep(.23,.42,footprint/bay));
  float rnd=hash(cell+seed),column=hash(vec2(cell.x,seed));
  float windowLight=smoothstep(1.,1.20,vProgress)*step(mix(.82,.40,nightF),rnd);
  vec3 reflection=mix(vec3(.065,.14,.17),vec3(.36,.53,.56),clamp(V.y*.65+.30,0.,1.));
  reflection*=.80+.16*column+.045*sin(vPosition.y*.61+seed);
  reflection+=vec3(.19,.16,.10)*pow(max(0.,dot(reflect(-V,N),uSun)),16.);
  // Curtains and recessed upper edges give glazing depth without noisy black grids.
  float curtain=step(.64,rnd)*smoothstep(.38,.50,f.x)*.16;
  reflection=mix(reflection,vec3(.54,.48,.34),curtain);
  float recess=mix(.66,1.,smoothstep(low,low+.20,f.y));
  vec3 mineralField=texture2D(uMaterial,fract(vec2(vTex.x,vPosition.y)*.11+seed*.137)).rgb;float mineral=mineralField.r*.65+mineralField.g*.35;
  albedo*=.95+.08*mineral;
  if(mat<1.5){albedo=mix(vTint*.80,reflection*recess,panes);rough=.22;metal=.24;}
  else if(mat<2.5){
   vec2 slab=fract(vec2(vTex.x*2.1,vPosition.y/floorHeight));
   float joint=(1.-smoothstep(.012,.035,min(slab.x,slab.y)))*nearDetail;
   albedo*=1.-joint*.11;
   float sill=smoothstep(.16,.21,f.y)*(1.-smoothstep(.23,.28,f.y))*smoothstep(.13,.22,f.x)*(1.-smoothstep(.78,.87,f.x));
   albedo*=1.+sill*.12*nearDetail;albedo=mix(albedo,reflection*.58*recess,panes*.90);rough=.67;
  }else{
   vec2 brickCoord=vec2(vTex.x*8.,vPosition.y*15.);brickCoord.x+=mod(floor(brickCoord.y),2.)*.5;
   vec2 joint=fract(brickCoord);float mortar=(1.-smoothstep(.035,.105,min(joint.x,joint.y)))*nearDetail;
   float brickTone=hash(floor(brickCoord)+seed);
   albedo*=mix(1.,.94+.08*brickTone,nearDetail);albedo=mix(albedo,albedo*1.19,mortar*.65);
   albedo=mix(albedo,reflection*.48*recess,panes*.88);rough=.86;
  }
  emission=vec3(1.,.67,.28)*windowLight*panes*(.075+.95*nightF)*uGlow;
 }
 if(mat>.5&&mat<1.5&&abs(N.y)>=.5){float fres=pow(1.-max(dot(N,V),0.),4.);albedo=mix(albedo,vec3(.32,.48,.52),.16+fres*.28);rough=.24;metal=.22;}
 if(mat>3.5&&mat<4.5){albedo*=.96+.04*noise(vPosition.xz*5.);rough=.92;}
 if(mat>4.5&&mat<5.5){albedo*=.96+.04*noise(vPosition.xz*3.);rough=.93;}
 if(mat>5.5&&mat<6.5){float ripple=sin(vPosition.x*4.+uTime*.21)+.43*sin(vPosition.z*6.7-uTime*.133);N=normalize(N+vec3(ripple*.025,0.,sin(vPosition.z*8.3+uTime*.091)*.014));float fres=pow(1.-max(dot(N,V),0.),4.);albedo=mix(uWaterTint,mix(vec3(.28,.48,.52),vec3(.19,.33,.42),.30),fres*.74);float glint=pow(max(dot(reflect(-V,N),uSun),0.),260.);albedo+=vec3(.72,.74,.58)*glint*.22;float foam=(1.-smoothstep(.02,.16,abs(landDistance(vPosition.xz))))*(.50+.16*sin(vPosition.z*6.+uTime*.31)+.10*sin(vPosition.x*8.7-uTime*.47));albedo=mix(albedo,vec3(.69,.85,.77),foam*.42);rough=.12;metal=.3;}
 if(mat>7.5&&mat<8.5){rough=.36;metal=.24;}
 if(mat>9.5&&mat<10.5){vec2 tile=fract(vec2(vTex.x*11.,vPosition.z*16.));float nearDetail=1.-smoothstep(.025,.095,footprint);albedo*=1.-.12*(1.-smoothstep(.03,.14,min(tile.x,tile.y)))*nearDetail;rough=.81;}
 // Low contrast, multiscale surface finishes inspired by Forge's baked detail layers.
 if(mat>11.5&&mat<18.6){
  vec2 surface=abs(N.y)>.5?vPosition.xz:vec2(vTex.x,vPosition.y);
  vec3 field=texture2D(uMaterial,fract(surface*.11+seed*.137)).rgb;float broad=field.r,fine=field.b,detail=1.-smoothstep(.035,.14,footprint);
  albedo*=.95+.075*broad+.025*fine*detail;
  if(mat<12.5){vec2 course=fract(surface*vec2(2.,5.));float joint=1.-smoothstep(.015,.065,min(course.x,course.y));albedo*=1.-joint*.09*detail;rough=.83;}
  else if(mat<13.5){albedo*=.98+.035*fine;rough=.90;}
  else if(mat<14.5){float seam=1.-smoothstep(.025,.085,fract(surface.x*8.));albedo=mix(albedo,albedo*vec3(.80,1.04,.96),broad*.3);albedo*=1.-seam*.16*detail;rough=.49;metal=.28;}
  else if(mat<15.5){albedo*=.93+.09*texture2D(uMaterial,fract(surface*vec2(.8,.04)+seed*.137)).g;rough=.85;}
  else if(mat<16.5){albedo*=.92+.12*fine*detail;rough=.98;}
  else if(mat<17.5){albedo*=1.-.28*(1.-smoothstep(.15,.35,fract(surface.x*26.)))*detail;rough=.68;}
  else if(mat<18.5){vec2 panel=fract(surface*vec2(14.,18.));albedo*=mix(.97,.8+.2*smoothstep(.025,.10,min(panel.x,panel.y)),detail);rough=.25;metal=.30;}
  else{albedo=vec3(.49,.50,.46)*(.96+.05*broad);rough=.94;}
 }
 // Blimp marquee: the scrolling canvas sign on the envelope.
 if(mat>19.5&&mat<20.5){vec3 sign=texture2D(uBlimpSign,vTex).rgb;albedo=sign;emission=sign*.32;rough=.5;metal=.1;}
 // Billboards: seeded canvas ads drifting in and out on their own schedule.
 if(mat>20.5&&mat<21.5){vec3 ad=texture2D(uBillboard,vTex).rgb;if(hash(gl_FragCoord.xy)>vFade+.001)discard;albedo=ad;emission=ad*.38*uGlow;rough=.55;}
 // Drifting clouds: soft white, shaded by normal.
 if(mat>21.5&&mat<22.5){albedo=vec3(.94,.955,.975)*(.80+.20*max(N.y,0.));rough=1.;}
 // Instanced foliage: leafy variation with a darker underside.
 if(mat>22.5&&mat<23.5){albedo*=.86+.28*noise(vPosition.xz*7.+vPosition.y*2.3);albedo*=.55+.45*max(N.y,0.);rough=1.;}
 if(mat>23.5&&mat<24.5){vec4 ftx=texture2D(uFoliage,vTex);if(ftx.a<.42)discard;albedo=ftx.rgb*(.72+.38*max(N.y,0.));rough=1.;}
 // Worker C materials 24-32: signage, translucent glass, interiors, beacons, smoke,
 // graffiti, brushed metal, copper, flags. Glass/interior/smoke stay LOD-cheap.
 if(mat>32.5&&mat<33.5){vec3 sg=texture2D(uSignage,vTex).rgb;albedo=sg;emission=sg*.30*uGlow;rough=.5;}
 if(mat>24.5&&mat<25.5){
  // Translucent glass: cheap screen-door dither, denser far / sparse near.
  float dist=length(uEye-vPosition);
  float keep=mix(.40,.985,smoothstep(3.,17.,dist));
  if(hash(gl_FragCoord.xy)>keep+.001)discard;
  float bay=.29;vec2 coord=vec2(vTex.x/bay,vPosition.y/.34);vec2 cf=floor(coord),f=fract(coord);
  float frame=1.-smoothstep(.015,.06,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));
  vec3 reflection=mix(vec3(.10,.17,.20),vec3(.44,.56,.59),clamp(V.y*.6+.35,0.,1.));
  albedo=mix(vTint*.72,reflection,.55+.30*frame);
  albedo*=.92+.08*hash(cf+seed);
  rough=.16;metal=.32;
 }
 if(mat>25.5&&mat<26.5){
  // Interior hints: warm, coarse, culled far away so they never cost a pixel at LOD.
  float dist2=length(uEye-vPosition);
  if(hash(gl_FragCoord.xy*1.71)<smoothstep(4.,13.,dist2))discard;
  albedo*=.9+.1*hash(floor(vPosition.xz*20.)+seed);
  emission=albedo*vec3(.55,.38,.22)*uGlow;rough=.9;
 }
 if(mat>26.5&&mat<27.5){float blink=step(.42,fract(uTime*.5+seed*.061));albedo=mix(vec3(.30,.03,.02),vec3(1.,.16,.10),blink);emission=vec3(1.2,.12,.06)*blink*uGlow;rough=.4;}
 if(mat>27.5&&mat<28.5){
  // Smoke: alpha-scaled dither (vFade carries the age ramp), soft procedural noise.
  float a=clamp(vFade,0.,1.)*.5;
  if(hash(gl_FragCoord.xy*1.31)>a+.001)discard;
  float nse=hash(floor(vPosition.xz*24.)+floor(vPosition.y*24.));
  albedo=vec3(.60,.62,.65)*(.88+.24*nse);rough=1.;
 }
 if(mat>28.5&&mat<29.5){vec3 tag=texture2D(uGraffiti,vTex).rgb;if(dot(tag,vec3(.333))<.04)discard;albedo=tag;emission=tag*.12;rough=.9;}
 if(mat>29.5&&mat<30.5){
  // Brushed metal: streaky roughness from the material atlas.
  vec2 surface=abs(N.y)>.5?vPosition.xz:vec2(vTex.x,vPosition.y);
  vec3 field=texture2D(uMaterial,fract(surface*vec2(.13,.53)+seed*.137)).rgb;
  albedo*=.92+.16*field.g;
  float streak=texture2D(uMaterial,fract(vec2(surface.x*3.,surface.y*36.)+seed*.137)).r;
  albedo*=1.-streak*.10;rough=.44;metal=.82;
 }
 if(mat>30.5&&mat<31.5){
  // Copper: subtle ribbed variation, warmer reflection.
  vec2 surface2=abs(N.y)>.5?vPosition.xz:vec2(vTex.x,vPosition.y);
  vec3 field2=texture2D(uMaterial,fract(surface2*.23+seed*.137)).rgb;
  albedo*=.80+.30*field2.b;
  float rib=1.-smoothstep(.10,.30,abs(fract(surface2.x*9.)-.5));
  albedo*=1.-rib*.14;rough=.58;metal=.72;
 }
 if(mat>31.5&&mat<32.5){vec3 fl=texture2D(uFlag,vTex).rgb;albedo=fl*(.92+.08*hash(gl_FragCoord.xy));rough=.92;}
 if(mat>8.5&&mat<9.5){emission=albedo*uGlow*(.20+.95*nightF);rough=.2;}
 // Formation smoke: the ribbon pales and thins into the haze as it ages.
 if(vInfo.z>11.5&&vInfo.z<12.5){float sage=clamp(vTex.x/7.,0.,1.);albedo=mix(albedo,vec3(.45,.55,.60),sage*sage*.9);emission*=1.-sage*.75;}
 // Fresh concrete at the active frontier settles into the finished facade below it.
 if(vBuild.y>.5&&mat>.5&&mat<3.5){float finish=smoothstep(.07,.54,vBuild.x-vPosition.y);albedo=mix(vec3(.45,.47,.44),albedo,finish);emission*=finish;rough=mix(.92,rough,finish);metal*=finish;}
 float direct=max(dot(N,uSun),0.),visibility=shadow(normalize(vNormal));float sky=.58+.42*max(N.y,0.);
 // Plain lighting controls: sun strength, ambient strength, time of day (warms and lowers the sun).
 vec3 sunTint=mix(vec3(1.50,1.14,.73),vec3(1.78,.90,.48),1.-smoothstep(.05,.55,uTod));
 vec3 ambTint=vec3(.155,.255,.445)*mix(.42,1.,smoothstep(.0,.65,uTod));
 float ao=mix(.58,1.,smoothstep(0.,.8,vPosition.y));vec3 lighting=ambTint*sky*ao*uAmbI+sunTint*direct*visibility*(.32+.91*uRays)*uSunI;
 vec3 H=normalize(V+uSun);float spec=pow(max(dot(N,H),0.),mix(125.,12.,rough))*(.10+metal*.7)*visibility;vec3 col=albedo*lighting+vec3(1.0,.86,.63)*spec+emission;
 float distance=length(uEye-vPosition);float haze=1.-exp(-max(distance-16.,0.)*.010*uMist*uMist);col=mix(col,vec3(.45,.55,.60),haze);col*=1.+.022*uWeather;col*=.45+.65*uGlow;gl_FragColor=vec4(col,1.);
}`;
export const cityShadowFragment=`precision highp float;varying float vFade;varying highp vec4 vShadow;varying vec4 vInfo;varying vec2 vBuild;varying vec3 vPosition;void main(){if(vFade<.015||(vBuild.y>.5&&vPosition.y>vBuild.x)||(vInfo.x>10.5&&vInfo.x<11.5)||(vInfo.x>20.5&&vInfo.x<22.5)||(vInfo.x>23.5&&vInfo.x<24.5)||(vInfo.x>24.5&&vInfo.x<26.5)||(vInfo.x>27.5&&vInfo.x<28.5))discard;highp float depth=clamp(vShadow.z/vShadow.w*.5+.5,0.,.999999);vec4 enc=fract(depth*vec4(1.,255.,65025.,16581375.));enc-=enc.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=enc;}`;
export const aoFrag=`precision highp float;varying vec2 vUV;
uniform sampler2D uDepth;uniform mat4 uInvVP;uniform vec2 uTexel;
uniform float uNear,uFar,uFocalPx,uRadiusW,uIntensity;
float linZ(vec2 uv){float zNdc=texture2D(uDepth,uv).x*2.-1.;return (2.*uNear*uFar)/(uFar+uNear-zNdc*(uFar-uNear));}
void main(){
 vec2 taps[12];
 taps[0]=vec2(.94,.34);taps[1]=vec2(-.34,.94);taps[2]=vec2(-.94,-.34);taps[3]=vec2(.34,-.94);
 taps[4]=vec2(.66,.66);taps[5]=vec2(-.66,.66);taps[6]=vec2(-.66,-.66);taps[7]=vec2(.66,-.66);
 taps[8]=vec2(1.,0.);taps[9]=vec2(0.,1.);taps[10]=vec2(-1.,0.);taps[11]=vec2(0.,1.);
 float pz=linZ(vUV);
 float rPx=uRadiusW*uFocalPx/max(pz,1e-3); // constant world-space radius
 vec2 pr=rPx*uTexel;
 float occ=0.;
 for(int i=0;i<12;i++){
  vec2 tuv=vUV+taps[i]*pr;
  float qz=linZ(tuv);
  float dz=pz-qz; // >0: the tap is closer to the camera — an occluder
  if(dz>.05){occ+=1.-smoothstep(0.,uRadiusW*1.5,dz);}
 }
 float distFade=exp(-pz*.02); // don't let far geometry darken itself
 float ao=1.-uIntensity*(occ/12.)*distFade;
 gl_FragColor=vec4(ao,ao,ao,1.);
}`;
export const aoBlurFrag=`precision highp float;varying vec2 vUV;uniform sampler2D uTex;uniform vec2 uTexel;
void main(){vec2 d=uTexel;vec3 c=texture2D(uTex,vUV).rgb*.25;
 c+=texture2D(uTex,vUV+vec2(d.x,0.)).rgb*.125;c+=texture2D(uTex,vUV-vec2(d.x,0.)).rgb*.125;
 c+=texture2D(uTex,vUV+vec2(0.,d.y)).rgb*.125;c+=texture2D(uTex,vUV-vec2(0.,d.y)).rgb*.125;
 c+=texture2D(uTex,vUV+d).rgb*.0625;c+=texture2D(uTex,vUV-d).rgb*.0625;
 c+=texture2D(uTex,vUV+vec2(d.x,-d.y)).rgb*.0625;c+=texture2D(uTex,vUV+vec2(-d.x,d.y)).rgb*.0625;
 gl_FragColor=vec4(c,1.);}`;
