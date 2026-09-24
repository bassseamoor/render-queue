// Parallax Engine — shader sources (extracted verbatim from parallax-engine.html).
// Pure GLSL data: no imports, no side effects. `cityLensFrag` splices in `opticalGLSL`.
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
`+opticalGLSL+`vec3 photograph(vec2 p){if(uMix>.999)return texture2D(uTex,p).rgb;return mix(texture2D(uOld,p).rgb,texture2D(uTex,p).rgb,uMix);}
void main(){float coc=opticalRadius(vUV);if(coc<.25){gl_FragColor=vec4(photograph(vUV),1.);return;}vec2 stepUV=vec2(coc)/uSize;vec3 color=photograph(vUV)*.0625;color+=photograph(vUV+stepUV*vec2(0.1290994,0.0000000))*.03125;color+=photograph(vUV+stepUV*vec2(-0.1648807,0.1510442))*.03125;color+=photograph(vUV+stepUV*vec2(0.0252376,-0.2875698))*.03125;color+=photograph(vUV+stepUV*vec2(0.2078214,0.2710663))*.03125;color+=photograph(vUV+stepUV*vec2(-0.3813779,-0.0674604))*.03125;color+=photograph(vUV+stepUV*vec2(0.3612744,-0.2298132))*.03125;color+=photograph(vUV+stepUV*vec2(-0.1208392,0.4495159))*.03125;color+=photograph(vUV+stepUV*vec2(-0.2304535,-0.4437242))*.03125;color+=photograph(vUV+stepUV*vec2(0.4999919,0.1825963))*.03125;color+=photograph(vUV+stepUV*vec2(-0.5201583,0.2147138))*.03125;color+=photograph(vUV+stepUV*vec2(0.2507507,-0.5358396))*.03125;color+=photograph(vUV+stepUV*vec2(0.1852984,0.5907604))*.03125;color+=photograph(vUV+stepUV*vec2(-0.5584914,-0.3236572))*.03125;color+=photograph(vUV+stepUV*vec2(0.6551740,-0.1440382))*.03125;color+=photograph(vUV+stepUV*vec2(-0.3998425,0.5687348))*.03125;color+=photograph(vUV+stepUV*vec2(-0.0923729,-0.7128351))*.03125;color+=photograph(vUV+stepUV*vec2(0.5670789,0.4779347))*.03125;color+=photograph(vUV+stepUV*vec2(-0.7631104,0.0315570))*.03125;color+=photograph(vUV+stepUV*vec2(0.5566305,-0.5539217))*.03125;color+=photograph(vUV+stepUV*vec2(-0.0372407,0.8053652))*.03125;color+=photograph(vUV+stepUV*vec2(-0.5296357,-0.6346805))*.03125;color+=photograph(vUV+stepUV*vec2(0.8390014,0.1128865))*.03125;color+=photograph(vUV+stepUV*vec2(-0.7108842,0.4946147))*.03125;color+=photograph(vUV+stepUV*vec2(0.1942545,-0.8634805))*.03125;color+=photograph(vUV+stepUV*vec2(0.4493004,0.7840892))*.03125;color+=photograph(vUV+stepUV*vec2(-0.8783393,-0.2802142))*.03125;color+=photograph(vUV+stepUV*vec2(0.8531949,-0.3941977))*.03125;color+=photograph(vUV+stepUV*vec2(-0.3696254,0.8832009))*.03125;color+=photograph(vUV+stepUV*vec2(-0.3298825,-0.9171573))*.03125;color+=photograph(vUV+stepUV*vec2(0.8777819,0.4613376))*.03125;gl_FragColor=vec4(color,1.);}`;
export const citySnapshotFrag=`precision highp float;varying vec2 vUV;uniform sampler2D uTex,uOld;uniform float uMix;void main(){gl_FragColor=mix(texture2D(uOld,vUV),texture2D(uTex,vUV),uMix);}`;
export const cityVertex=`precision highp float;
attribute vec3 aPosition,aNormal,aTint;attribute vec4 aSchedule,aInfo,aRoute;attribute vec2 aTex;
uniform mat4 uViewProjection,uLightMatrix;uniform float uStory,uTime,uDensity;
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
 if(aInfo.z>4.5&&aInfo.z<6.5){float travel=mod(aInfo.y*.13+uTime*aRoute.w,aRoute.z);p.xz+=aRoute.xy*travel;fade*=smoothstep(0.,.22,travel)*(1.-smoothstep(aRoute.z-.22,aRoute.z,travel));if(aInfo.z<5.5)fade*=1.-smoothstep(uDensity*66.,uDensity*66.+5.,aInfo.y);else p.y+=.004*sin(uTime*.31+aInfo.y)+.002*sin(uTime*.53+aInfo.y*1.7);}
 vPosition=p;vNormal=aNormal;vTint=aTint;vTex=aTex;vInfo=aInfo;vInfo.y=floor(aInfo.y*100.+.5);vFade=fade;vProgress=raw;vShadow=uLightMatrix*vec4(p,1.);gl_Position=uViewProjection*vec4(p,1.);if(fade<.0001)gl_Position=vec4(3.,3.,0.,1.);
}`;
export const cityFragment=`precision highp float;
varying vec3 vPosition,vNormal,vTint;varying vec2 vTex,vBuild;varying vec4 vInfo,vShadow;varying float vFade,vProgress;
uniform mat4 uLightMatrix;uniform highp sampler2D uShadow;uniform sampler2D uMaterial;uniform vec3 uEye,uSun,uLandTint,uWaterTint;uniform vec4 uGeo,uMap;uniform vec2 uCenter,uSpacing,uBounds;uniform vec3 uPark;uniform float uTime,uStory,uWeather,uMist,uGlow,uRays,uPixelScale;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
float landDistance(vec2 p){float type=uGeo.x,phase=uGeo.y,offset=uGeo.z,water=uGeo.w;float river=offset+sin(p.y*uMap.x+phase)*uMap.y+p.y*uMap.z;
 if(type<.5)return abs(p.x-river)-water;if(type<1.5)return offset+sin(p.y*.09+phase)*4.-p.x;if(type<2.5)return length((p-uCenter)/vec2(1.45,2.4))-1.35;if(type<3.5)return 20.;if(type<4.5)return min(abs(p.x-river)-water,abs(p.y-offset*.7-sin(p.x*.12+phase)*2.)-water*.72);return p.y-offset-sin(p.x*.095+phase)*3.8;}
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

void main(){if(vFade<.015||(vBuild.y>.5&&vPosition.y>vBuild.x))discard;vec3 N=normalize(vNormal),V=normalize(uEye-vPosition);float footprint=length(uEye-vPosition)*uPixelScale/max(.22,abs(dot(N,V)));float mat=vInfo.x,seed=floor(vInfo.y+.5);vec3 albedo=vTint;if(mat>10.5&&mat<11.5){float shore=landDistance(vPosition.xz);mat=shore<0.?6.:5.;vec2 p=vPosition.xz;float park=uGeo.x>1.5&&uGeo.x<2.5?1.-smoothstep(3.75,4.1,length((p-uCenter)/vec2(1.15,2.2))):uGeo.x>2.5&&uGeo.x<3.5?1.-smoothstep(3.0,3.5,length(p)):1.-smoothstep(uPark.z-.25,uPark.z+.25,length(p-uPark.xy));float town=1.-smoothstep(.96,1.10,max(abs(p.x)/uBounds.x,abs(p.y)/uBounds.y));vec3 land=mix(uLandTint,mix(vec3(.30,.33,.30),uLandTint,park),town);albedo=shore<0.?uWaterTint:mix(vec3(.48,.44,.30),land,smoothstep(0.,.23,shore));}float rough=.7,metal=0.;vec3 emission=vec3(0.);float grain=texture2D(uMaterial,fract(vPosition.xz*.17)).b;albedo*=.992+.016*grain;
 // Facade detail follows floor courses; broad mineral variation precedes fine joints.
 if(mat>.5&&mat<3.5&&abs(N.y)<.5){
  float floorHeight=max(.32,vInfo.w),bay=mat<1.5?.29:.38;
  vec2 coord=vec2(vTex.x/bay,vPosition.y/floorHeight),cell=floor(coord),f=fract(coord);
  float aa=clamp(footprint/bay*.6,.025,.32),nearDetail=(1.-smoothstep(.035,.16,footprint));
  float left=mat<1.5?.08:.20,right=1.-left,low=mat<1.5?.12:.23;
  float panes=smoothstep(left-aa,left+aa,f.x)*(1.-smoothstep(right-aa,right+aa,f.x))*smoothstep(low-aa,low+aa,f.y)*(1.-smoothstep(.86-aa,.86+aa,f.y));
  panes=mix(panes,(right-left)*(.86-low),smoothstep(.23,.42,footprint/bay));
  float rnd=hash(cell+seed),column=hash(vec2(cell.x,seed));
  float windowLight=smoothstep(1.,1.20,vProgress)*step(.82,rnd);
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
  emission=vec3(1.,.67,.28)*windowLight*panes*.075*uGlow;
 }
 if(mat>.5&&mat<1.5&&abs(N.y)>=.5){float fres=pow(1.-max(dot(N,V),0.),4.);albedo=mix(albedo,vec3(.32,.48,.52),.16+fres*.28);rough=.24;metal=.22;}
 if(mat>3.5&&mat<4.5){albedo*=.96+.04*noise(vPosition.xz*5.);rough=.92;}
 if(mat>4.5&&mat<5.5){albedo*=.96+.04*noise(vPosition.xz*3.);rough=.93;}
 if(mat>5.5&&mat<6.5){float ripple=sin(vPosition.x*4.+uTime*.21)+.43*sin(vPosition.z*6.7-uTime*.133);N=normalize(N+vec3(ripple*.025,0.,sin(vPosition.z*8.3+uTime*.091)*.014));float fres=pow(1.-max(dot(N,V),0.),4.);albedo=mix(uWaterTint,vec3(.28,.48,.52),fres*.74);float glint=pow(max(dot(reflect(-V,N),uSun),0.),120.);albedo+=vec3(.65,.70,.55)*glint*.12;float foam=(1.-smoothstep(.02,.16,abs(landDistance(vPosition.xz))))*(.50+.16*sin(vPosition.z*6.+uTime*.31)+.10*sin(vPosition.x*8.7-uTime*.47));albedo=mix(albedo,vec3(.69,.85,.77),foam*.42);rough=.16;metal=.3;}
 if(mat>7.5&&mat<8.5){rough=.36;metal=.24;}
 if(mat>9.5&&mat<10.5){vec2 tile=fract(vec2(vTex.x*11.,vPosition.z*16.));float nearDetail=1.-smoothstep(.025,.095,footprint);albedo*=1.-.12*(1.-smoothstep(.03,.14,min(tile.x,tile.y)))*nearDetail;rough=.81;}
 // Low contrast, multiscale surface finishes inspired by Forge's baked detail layers.
 if(mat>11.5){
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
 if(mat>8.5&&mat<9.5){emission=albedo*.60*uGlow;rough=.2;}
 // Fresh concrete at the active frontier settles into the finished facade below it.
 if(vBuild.y>.5&&mat>.5&&mat<3.5){float finish=smoothstep(.07,.54,vBuild.x-vPosition.y);albedo=mix(vec3(.45,.47,.44),albedo,finish);emission*=finish;rough=mix(.92,rough,finish);metal*=finish;}
 float direct=max(dot(N,uSun),0.),visibility=shadow(normalize(vNormal));float sky=.58+.42*max(N.y,0.);vec3 ambient=vec3(.18,.27,.40)*sky;float ao=mix(.58,1.,smoothstep(0.,.8,vPosition.y));vec3 lighting=ambient*ao+vec3(1.47,1.17,.80)*direct*visibility*(.32+.91*uRays);
 vec3 H=normalize(V+uSun);float spec=pow(max(dot(N,H),0.),mix(125.,12.,rough))*(.10+metal*.7)*visibility;vec3 col=albedo*lighting+vec3(1.0,.86,.63)*spec+emission;
 float distance=length(uEye-vPosition);float haze=1.-exp(-max(distance-16.,0.)*.010*uMist*uMist);col=mix(col,vec3(.45,.55,.60),haze);col*=1.+.022*uWeather;col*=.45+.65*uGlow;gl_FragColor=vec4(col,1.);
}`;
export const cityShadowFragment=`precision highp float;varying float vFade;varying highp vec4 vShadow;varying vec4 vInfo;varying vec2 vBuild;varying vec3 vPosition;void main(){if(vFade<.015||(vBuild.y>.5&&vPosition.y>vBuild.x)||(vInfo.x>10.5&&vInfo.x<11.5))discard;highp float depth=clamp(vShadow.z/vShadow.w*.5+.5,0.,.999999);vec4 enc=fract(depth*vec4(1.,255.,65025.,16581375.));enc-=enc.yzww*vec4(1./255.,1./255.,1./255.,0.);gl_FragColor=enc;}`;
