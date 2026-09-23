// Molten Studio — GLSL sources (extracted verbatim from molten.html x-shader blocks).
export const VERT_SRC = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}
`;
export const SCENE_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform vec2 uRes;
uniform vec4 uBlobs[24];
uniform int uCount,uShape,uView,uBackground,uMetal,uSteps;
uniform vec3 uWax,uHot,uLiquid,uBack;
uniform float uMerge,uWarp,uTime,uGlow,uGloss,uTranslucence,uGlass,uExposure,uHalo,uZoom,uYaw,uPitch,uGrain,uFloor,uPulse,uSoftness,uSpread,uIridescence,uMarble,uLightAngle,uLightHeight;
const float PI=3.14159265359;
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float radiusAt(float y){
 if(uView>0)return 9.;
 if(uShape==0)return mix(.86,.46,smoothstep(-1.9,1.9,y))+.035*sin((y+1.9)*.826);
 if(uShape==1)return .75;
 if(uShape==2)return sqrt(max(.001,1.-pow(y/1.95,2.)))*1.39;
 return .52+.35*pow(abs(y)/1.9,1.25);
}
float vessel(vec3 p){
 if(uShape==2)return (length(p/vec3(1.39,1.95,1.39))-1.)*1.32;
 return max(length(p.xz)-radiusAt(p.y),abs(p.y)-1.91);
}
float waxMap(vec3 p){
 float d=8.;
 vec3 q=p;
 q.x+=uWarp*.10*sin(p.y*3.1+uTime)*sin(p.z*3.7+uTime*2.);
 q.z+=uWarp*.09*sin(p.y*4.4-uTime*2.)*cos(p.x*3.5+uTime);
 for(int i=0;i<24;i++){if(i>=uCount)break;
  vec3 c=q-uBlobs[i].xyz;
  float stretch=1.+uSoftness*.32*sin(float(i)*2.67+uTime*2.);
  c.y/=stretch;
  float wob=1.+.024*sin(uTime*2.+float(i)*2.39)+.016*sin(uTime*3.+float(i)*4.07);
  float sphere=(length(c)-uBlobs[i].w*wob)*min(1.,stretch);
  d=smin(d,sphere,uMerge);
 }
 if(uView==0){
  float bottom=length((q-vec3(0.,-1.92,0.))/vec3(.66,.18,.66))-1.;
  d=smin(d,bottom*.18,.20+uMerge*.2);
  d=max(d,vessel(p)+.072);
 }
 return d;
}
vec3 waxNormal(vec3 p){vec2 e=vec2(.0015,0.);return normalize(vec3(waxMap(p+e.xyy)-waxMap(p-e.xyy),waxMap(p+e.yxy)-waxMap(p-e.yxy),waxMap(p+e.yyx)-waxMap(p-e.yyx)));}
float cappedCone(vec3 p,float h,float r1,float r2){vec2 q=vec2(length(p.xz),p.y);vec2 k1=vec2(r2,h),k2=vec2(r2-r1,2.*h);vec2 ca=vec2(q.x-min(q.x,(q.y<0.)?r1:r2),abs(q.y)-h);vec2 cb=q-k1+k2*clamp(dot(k1-q,k2)/dot(k2,k2),0.,1.);float s=(cb.x<0.&&ca.y<0.)?-1.:1.;return s*sqrt(min(dot(ca,ca),dot(cb,cb)));}
float metalMap(vec3 p){
 if(uShape==2){float a=cappedCone(p-vec3(0.,-2.04,0.),.19,.75,.5);float b=length(vec2(length(p.xz)-.49,p.y+1.89))-.044;return min(a,b);}
 float rb=uShape==1?.80:.94;float rt=uShape==0?.50:uShape==1?.8:.93;
 float base=cappedCone(p-vec3(0.,-2.21,0.),.32,rb*.82,rb);
 float foot=cappedCone(p-vec3(0.,-2.54,0.),.045,rb*.89,rb*.82);
 float cap=cappedCone(p-vec3(0.,2.065,0.),.155,rt,rt*.70);
 return min(min(base,foot),cap);
}
vec3 metalNormal(vec3 p){vec2 e=vec2(.001,0.);return normalize(vec3(metalMap(p+e.xyy)-metalMap(p-e.xyy),metalMap(p+e.yxy)-metalMap(p-e.yxy),metalMap(p+e.yyx)-metalMap(p-e.yyx)));}
vec3 env(vec3 d){
 vec3 c=mix(vec3(.025,.027,.04),vec3(.18,.19,.24),smoothstep(-.3,1.,d.y));
 float softbox=pow(max(0.,dot(d,normalize(vec3(-3.,2.,4.)))),28.);
 float strip=pow(max(0.,dot(d,normalize(vec3(3.,1.,1.)))),60.);
 c+=vec3(.95,.80,.68)*softbox*1.6+mix(uHot,vec3(.7,.75,1.),.7)*strip*1.8;
 c+=uWax*pow(max(0.,dot(d,normalize(vec3(-1.,-.4,-2.)))),8.)*.2;
 return c;
}
vec3 backdrop(vec2 uv,vec3 rd){
 if(uBackground==3)return vec3(0.);
 float halo=exp(-length(uv*vec2(.80,.67))*2.7);
 vec3 c=uBack*(.35+halo*1.5);
 c+=mix(uWax,uHot,.2)*halo*(uBackground==0?.017:.075)*uHalo;
 if(uBackground==2){float n=sin(uv.x*3.+sin(uv.y*2.+uTime))*.5+.5;float n2=sin(uv.y*4.-sin(uv.x*3.-uTime*2.))*.5+.5;c+=mix(uLiquid,uWax,n2)*n*n2*.09*uHalo;}
 return c;
}
vec2 cylinderHit(vec3 ro,vec3 rd,float r,float h){
 float a=dot(rd.xz,rd.xz),b=dot(ro.xz,rd.xz),c=dot(ro.xz,ro.xz)-r*r;
 float det=b*b-a*c;if(det<0.)return vec2(1e4,-1e4);
 vec2 t=vec2(-b-sqrt(det),-b+sqrt(det))/max(a,.00001);
 if(abs(rd.y)>.00001){vec2 ty=vec2(-h-ro.y,h-ro.y)/rd.y;if(ty.x>ty.y)ty=ty.yx;t=vec2(max(t.x,ty.x),min(t.y,ty.y));}
 return t;
}
vec3 film(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 vec2 uv=(gl_FragCoord.xy*2.-uRes.xy)/uRes.y;
 float yaw=uYaw,pitch=uPitch;
 float distance=(uView==0?7.65:uView==1?5.8:3.25)/uZoom;
 vec3 target=vec3(0.,uView==0?-.18:0.,0.);
 vec3 ro=target+vec3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch))*distance;
 vec3 ww=normalize(target-ro),uu=normalize(cross(ww,vec3(0.,1.,0.))),vv=cross(uu,ww);
 vec3 rd=normalize(uu*uv.x+vv*uv.y+ww*2.35);
 vec3 col=backdrop(uv,rd);
 float floorY=uShape==2?-2.24:-2.59;
 float tf=(floorY-ro.y)/rd.y;
 if(uFloor>.5&&uView==0&&tf>0.){
  vec3 fp=ro+rd*tf;
  float pool=exp(-dot(fp.xz,fp.xz)*.45);
  float reflection=exp(-pow(fp.x*.85,2.)-pow((fp.z-1.2)*.9,2.));
  col+=mix(uWax,uHot,.55)*pool*.038*uGlow+uHot*reflection*.013;
  col*=1.-.55*exp(-dot(fp.xz,fp.xz)*2.5);
  if(pool>.015){
   vec3 rr=reflect(rd,vec3(0.,1.,0.)),origin=fp+rr*.025;
   vec2 rb=cylinderHit(origin,rr,uShape==2?1.43:1.06,2.6);
   float rt=max(0.,rb.x);
   for(int i=0;i<40;i++){
    if(rt>rb.y)break;
    vec3 rp=origin+rr*rt;
    float wd=waxMap(rp),md=metalMap(rp),d=min(wd,md);
    if(d<.009){
     vec3 reflectionColor=wd<md?mix(uHot,uWax,smoothstep(-1.7,1.7,rp.y))*.8:env(reflect(rr,metalNormal(rp)))*.25;
     col+=reflectionColor*.10*pool;break;
    }
    rt+=max(d*.76,.012);
   }
  }
 }
 float metalT=1e3;
 if(uView==0){vec2 bound=cylinderHit(ro,rd,1.06,2.6);float t=max(0.,bound.x);
  for(int i=0;i<64;i++){if(t>bound.y)break;vec3 p=ro+rd*t;float d=metalMap(p);if(d<.0015){metalT=t;break;}t+=max(d*.8,.003);}
 }
 float entry=0.,exitT=0.;vec3 glassN=vec3(0.);bool inGlass=false;
 if(uView==0){
  vec2 bound=cylinderHit(ro,rd,uShape==2?1.43:.96,1.95);
  float t=max(0.,bound.x);
  for(int i=0;i<70;i++){if(t>bound.y)break;float d=vessel(ro+rd*t);if(d<.0015){entry=t;inGlass=true;break;}t+=max(d*.78,.002);}
  if(inGlass){
   float back=bound.y;
   for(int i=0;i<60;i++){if(back<entry)break;float d=vessel(ro+rd*back);if(d<.0015){exitT=back;break;}back-=max(d*.78,.002);}
   vec3 gp=ro+rd*entry;vec2 e=vec2(.002,0.);glassN=normalize(vec3(vessel(gp+e.xyy)-vessel(gp-e.xyy),vessel(gp+e.yxy)-vessel(gp-e.yxy),vessel(gp+e.yyx)-vessel(gp-e.yyx)));
  }
 }else{vec2 b=cylinderHit(ro,rd,4.6,4.3);entry=max(0.,b.x);exitT=b.y;inGlass=exitT>entry;}
 float lavaT=1e3;
 if(inGlass&&entry<metalT){
  vec3 rayStart=ro+rd*entry;
  vec3 lr=rd;
  if(uView==0)lr=normalize(mix(rd,refract(rd,glassN,1./1.18),uGlass*.28));
  float t=.014;float travel=max(.0,exitT-entry);
  float nearest=9.;float glowAccum=0.;
  for(int i=0;i<128;i++){
   if(i>=uSteps||t>travel||t+entry>metalT)break;
   vec3 p=rayStart+lr*t;float d=waxMap(p);nearest=min(nearest,d);
   glowAccum+=exp(-max(d,0.)*8.)*.008;
   if(d<.002){lavaT=t;break;}t+=max(d*.74,.0035);
  }
  vec3 fluidColor=uLiquid*(.07+travel*.095);
  vec3 inner=col*exp(-travel*.10)+fluidColor;
  inner+=mix(uWax,uHot,.35)*pow(max(0.,1.-abs(rayStart.x)*.6),3.)*.04*uGlow;
  if(lavaT<999.){
   vec3 p=rayStart+lr*lavaT;vec3 n=waxNormal(p);vec3 v=-lr;
   vec3 l=normalize(vec3(sin(uLightAngle)*4.6,uLightHeight,cos(uLightAngle)*4.6)-p);
   vec3 l2=normalize(vec3(2.5,-2.3,1.3)-p);
   float diff=max(dot(n,l),0.);float diff2=max(dot(n,l2),0.);
   float fres=pow(1.-max(dot(n,v),0.),3.);
   float gradient=smoothstep(-1.7,1.7,p.y+.35*sin(p.x*2.+uTime));
   vec3 pigment=mix(uHot,uWax,gradient*.86);
   float ribbons=.5+.5*sin(p.y*5.+sin(p.x*3.+uTime)*2.+cos(p.z*3.-uTime)*1.5);
   pigment=mix(pigment,mix(uWax,uHot,ribbons),uMarble*.7);
   pigment=mix(pigment,mix(uLiquid,uHot,.5+.5*sin(fres*8.+p.y*2.)),uIridescence*fres*.7);
   float sss=pow(max(dot(-n,l2),0.),2.)*uTranslucence;
   float ao=clamp(waxMap(p+n*.12)/.12,.3,1.);
   vec3 shade=pigment*(.25+diff*.52+diff2*.17)*mix(.65,1.,ao);
   shade+=uHot*sss*.45+pigment*uGlow*(.16+.12*(1.-gradient));
   vec3 halfV=normalize(l+v);
   float spec=pow(max(dot(n,halfV),0.),mix(12.,180.,uGloss));
   shade+=vec3(1.,.88,.74)*spec*(.16+.95*uGloss);
   vec3 refl=env(reflect(lr,n));
   shade+=refl*(.07+fres*.52)*uGloss;
   shade+=mix(uHot,vec3(.67,.79,1.),.27)*pow(fres,1.5)*(.09+uTranslucence*.27);
   shade=mix(shade,shade*.55+uLiquid*.21,1.-exp(-lavaT*.16));
   inner=shade;
  }
  inner+=mix(uWax,uHot,.4)*min(.28,glowAccum)*uGlow*.35;
  if(uView==0){
   float fres=pow(1.-abs(dot(glassN,-rd)),3.);
   vec3 refl=env(reflect(rd,glassN));
   float edge=pow(1.-abs(dot(glassN,-rd)),9.);
   inner=mix(inner,refl,min(.46,fres*.46*uGlass));
   inner+=refl*(.02+.16*fres)*uGlass+mix(uLiquid,vec3(.5,.58,.7),.65)*edge*.18*uGlass;
   vec3 gp=ro+rd*entry;
   float stripe=exp(-pow((glassN.x+.58)*18.,2.))*(1.-smoothstep(1.35,1.86,abs(gp.y)));
   float stripe2=exp(-pow((glassN.x-.82)*40.,2.))*(1.-smoothstep(1.3,1.86,abs(gp.y)));
   inner+=vec3(.56,.59,.68)*stripe*.13*uGlass+uHot*stripe2*.18*uGlass;
   float stripe3=exp(-pow((glassN.x+.14)*30.,2.))*(1.-smoothstep(1.2,1.86,abs(gp.y)));
   inner+=vec3(.60,.61,.69)*stripe3*.045*uGlass;
   float lip=exp(-pow((abs(gp.y)-1.87)*40.,2.));inner+=vec3(.35,.38,.46)*lip*.15*uGlass;
  }
  col=inner;
 }
 if(metalT<100.&&(!inGlass||metalT<entry)){
  vec3 p=ro+rd*metalT,n=metalNormal(p);
  vec3 refl=env(reflect(rd,n));
  vec3 tint=uMetal==0?vec3(.12,.13,.15):uMetal==1?vec3(.70,.73,.78):uMetal==2?vec3(.75,.49,.23):vec3(.75,.31,.17);
  float stripe=.96+.04*sin(p.y*900.);
  col=tint*(.09+.16*max(dot(n,normalize(vec3(-3.,4.,5.))),0.))+refl*tint*stripe*(uMetal==0?.55:1.15);
  col+=uHot*pow(max(0.,n.y),3.)*.055*uGlow;
  float rim=exp(-pow((p.y+1.902)*95.,2.));col+=uHot*rim*.3*uGlow;
 }
 float dust=0.;
 for(int i=0;i<9;i++){
  float fi=float(i);
  vec2 dh=vec2(fract(sin(fi*127.1)*43758.5453),fract(sin(fi*311.7)*12543.1234))-.5;
  vec2 dp=dh*vec2(2.8,2.3)+vec2(0.,.12)+vec2(sin(uTime+fi*2.1),cos(uTime*2.+fi*3.7))*.10;
  float dd=length(uv-dp);
  dust+=exp(-dd*dd*4200.)*(.6+.4*sin(uTime*3.+fi*7.3));
 }
 col+=mix(uHot,vec3(1.),.35)*dust*.026*min(uGlow,1.5);
 col*=1.-.12*dot(vUv-.5,vUv-.5);
 col=film(col*uExposure);
 col=pow(col,vec3(1./2.2));
 fragColor=vec4(col,1.);
}
`;
export const POST_SRC = `#version 300 es
precision highp float;
in vec2 vUv;out vec4 fragColor;
uniform sampler2D uImage;uniform vec2 uRes;uniform float uGlow,uGrain;
vec3 bright(vec2 uv){vec3 c=texture(uImage,uv).rgb;float v=max(c.r,max(c.g,c.b));return c*smoothstep(.6,.96,v);}
void main(){vec3 c=texture(uImage,vUv).rgb;vec3 bloom=vec3(0.);vec2 px=1./uRes;for(int i=0;i<12;i++){float a=float(i)*2.39996323;vec2 d=vec2(cos(a),sin(a));bloom+=bright(vUv+d*px*8.)*.027+bright(vUv+d*px*23.)*.028+bright(vUv+d*px*52.)*.026;}c+=bloom*uGlow*.19;float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;c+=n*uGrain*.025;fragColor=vec4(c,1.);}
`;
