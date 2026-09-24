// Alien Planet Studio — shader sources (extracted verbatim from alien-planet.html).
// Pure GLSL data: no imports, no side effects.
export const noiseGLSL=`float hash3(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i),hash3(i+vec3(1,0,0)),f.x),mix(hash3(i+vec3(0,1,0)),hash3(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)),hash3(i+vec3(1,0,1)),f.x),mix(hash3(i+vec3(0,1,1)),hash3(i+vec3(1,1,1)),f.x),f.y),f.z);}float fbm(vec3 p){return noise3(p)*.55+noise3(p*2.03)*.28+noise3(p*4.09)*.12+noise3(p*8.13)*.05;}`;
export const terrainGLSL=`float easeLand(float x){x=clamp(x,0.,1.);return x*x*(3.-2.*x);}float riverCenter(float z){return sin(z*.06+uTerrainPhase)*2.8+sin(z*.15)*.7;}float riverWidthAt(float z){return 1.55+.24*sin(z*.19+uTerrainPhase)+.16*sin(z*.43);}float landHeight(vec2 p){float x=p.x,z=p.y,d=abs(x-riverCenter(z)),w=riverWidthAt(z),bank=max(0.,d-w),fade=easeLand(bank/4.);float bed=-.78+.58*easeLand(d/w),rise=.70*easeLand(bank/2.6)+min(bank*.105,1.8);float hills=(sin(x*.21+z*.095)*.42+cos(z*.17-x*.085)*.34+pow(.5+.5*sin(x*.08+z*.055),3.)*1.3)*fade;return bed+rise+hills+easeLand((length(p)-45.)/90.)*(2.5+sin(x*.033+uTerrainPhase)*sin(z*.025)*3.)*fade;}`;
export const meshVS=`precision highp float;
layout(location=0)in vec3 aPos;layout(location=1)in vec3 aNormal;layout(location=2)in vec3 aColor;layout(location=3)in vec2 aUV;layout(location=4)in vec2 aData;
layout(location=5)in vec4 iTransform;layout(location=6)in vec4 iVariation;
uniform mat4 uVP,uLight,uLightPrevious;uniform float uTime,uWind,uTerrainPhase;uniform int uInstanced;
${terrainGLSL}
out vec3 vPos,vNormal,vColor;out vec2 vUV;flat out float vMat;out vec4 vShadow,vShadowPrevious;
void main(){vec3 p=aPos,n=aNormal;float phase=p.x*.45+p.z*.31;vColor=aColor;
if(uInstanced==1){mat2 rot=mat2(iVariation.x,-iVariation.y,iVariation.y,iVariation.x);p.xz=rot*p.xz;n.xz=rot*n.xz;if(iVariation.z<0.){p.y*=-iVariation.z;n.y/=-iVariation.z;}p=p*iTransform.w+iTransform.xyz;if(aData.x>8.5&&aData.x<9.5){float t=uTime*.08+iVariation.w;p.x+=sin(t)*.42;p.z+=cos(t)*.33;p.y=aPos.y*iTransform.w+landHeight(p.xz)+.018;p.y+=sin(uTime*14.+iVariation.w)*aData.y;}phase=iVariation.w+aPos.x*1.4+aPos.z*.9;vColor*=mix(vec3(.72,1.02,1.22),vec3(1.23,1.03,.74),iVariation.z<0.?.55:clamp(iVariation.z-.5,0.,1.));}
float gust=.78+.18*sin(uTime*.21+p.x*.075+p.z*.09)+.08*sin(uTime*.13-p.z*.12);float sway=(sin(uTime*.53+phase)*.75+.18*sin(uTime*.89+phase*1.7)+.025*sin(uTime*2.1+phase*4.))*uWind*aData.y*1.85*gust;
p.x+=sway;p.z+=sway*.53;p.y+=sin(uTime*.93+phase)*aData.y*uWind*.2;n=normalize(n+vec3(sway*.12,0.,sway*.05));
vPos=p;vNormal=n;vUV=aUV;vMat=aData.x;vShadow=uLight*vec4(p,1);vShadowPrevious=uLightPrevious*vec4(p,1);gl_Position=uVP*vec4(p,1);}`;
export const meshFS=`precision highp float;
in vec3 vPos,vNormal,vColor;in vec2 vUV;flat in float vMat;in vec4 vShadow,vShadowPrevious;out vec4 frag;
uniform float uTerrainPhase;
uniform vec3 uEye,uSun,uFog,uRipples[4];uniform float uDay,uRain,uWet,uCloud,uTime,uFogD,uFlash,uDistance,uAtlasReady;uniform sampler2D uShadow,uShadowPrevious,uAtlas;uniform float uShadowMix;uniform int uShadowOn;
${noiseGLSL}
${terrainGLSL}
float sampleShadow(sampler2D map,vec4 coord,vec3 n){vec3 p=coord.xyz/coord.w*.5+.5;if(any(lessThan(p,vec3(0)))||any(greaterThan(p,vec3(1))))return 1.;float sum=0.,bias=.0016+.0008*(1.-abs(dot(n,uSun))),radius=1.4+uCloud*1.1;for(int i=0;i<9;i++){float angle=float(i)*2.39996;vec2 offset=i==0?vec2(0):vec2(cos(angle),sin(angle))*radius*sqrt(float(i)/8.)/1024.;sum+=p.z-bias<texture(map,p.xy+offset).r?1.:.13;}float edge=1.-smoothstep(.87,.99,max(abs(p.x*2.-1.),abs(p.y*2.-1.)));return mix(1.,sum/9.,edge);}
float shadow(vec3 n){if(uShadowOn==0)return 1.;float current=sampleShadow(uShadow,vShadow,n);if(uShadowMix>=.999)return current;return mix(sampleShadow(uShadowPrevious,vShadowPrevious,n),current,uShadowMix);}

vec3 atlas(vec2 uv,vec2 origin,vec2 size){return texture(uAtlas,origin+uv*size).rgb;}
// Derivative cotangent frame: surface micro-relief follows the actual geometry.
vec3 bump(vec3 n,float h,float strength){vec3 dx=dFdx(vPos),dy=dFdy(vPos),r1=cross(dy,n),r2=cross(n,dx);float det=dot(dx,r1);return normalize(abs(det)*n-sign(det)*strength*(dFdx(h)*r1+dFdy(h)*r2));}
vec2 rainNormal(vec2 pos){vec2 cell=floor(pos*2.7),q=fract(pos*2.7)-.5;float id=hash3(vec3(cell,9.)),age=fract(uTime*(1.2+id*.7)+id*13.);q-=vec2(id-.5,hash3(vec3(cell,6.))-.5)*.35;float radius=length(q),ring=sin((radius-age*.52)*85.)*exp(-abs(radius-age*.52)*28.)*(1.-age);return normalize(q+vec2(.001))*ring*.045*uRain;}
void main(){
if(vMat>10.5&&hash3(vec3(floor(gl_FragCoord.xy),7.))>vUV.x)discard;
vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 view=normalize(uEye-vPos),albedo=vColor;float distanceToEye=length(uEye-vPos);
bool leaf=(vMat>.5&&vMat<1.5)||(vMat>9.5&&vMat<10.5),soil=vMat>1.5&&vMat<2.5,water=vMat>3.5&&vMat<4.5,stone=vMat>6.5&&vMat<7.5,litter=vMat>7.5&&vMat<8.5;
float rough=.76,wet=uWet,puddle=0.,height=0.,occlusion=1.;float channelDepth=0.;if(water){float bedHeight=landHeight(vPos.xz);if(bedHeight>-.201)discard;channelDepth=max(0.,-.20-bedHeight);}
if(vMat>5.5&&vMat<6.5){
// Overlapping foliage volumes have an opaque interior and ragged leafy margins.
vec2 q=(vUV-.5)*2.;float angle=atan(q.y,q.x);float outline=.88+.065*sin(angle*7.+vColor.g*31.)+.045*sin(angle*13.+vColor.r*63.);float rim=noise3(vec3(vUV*38.,vColor.g*61.));if(length(q)>outline+(rim-.5)*.14)discard;
vec2 cells=vUV*vec2(21.,17.)+vec2(noise3(vec3(vUV*7.,3.)),noise3(vec3(vUV*6.,9.)))*5.;vec2 id=floor(cells),local=fract(cells)-.5;float seed=hash3(vec3(id,vColor.r*113.));float a=seed*6.283;local=mat2(cos(a),-sin(a),sin(a),cos(a))*local;float shape=1.-smoothstep(.65,1.,length(local/vec2(.48,.22)));float veins=exp(-abs(local.y)*95.)*.08;float clusters=noise3(vec3(vUV*6.,vColor.b*33.));albedo*=mix(.40,.82,clusters)+shape*(.16+seed*.26)+veins*shape;n=normalize(n+vec3((seed-.5)*shape*.24,shape*.22,0.));
}
if(vMat<.5){
vec2 barkUV=vec2(vUV.x*6.,vPos.y*.34);vec3 t=atlas(fract(barkUV),vec2(.59,.12),vec2(.29,.35));float warp=noise3(vec3(vUV.x*11.,vPos.y*.43,3.));float grain=noise3(vec3(vUV.x*95.+warp*4.,vPos.y*2.3,5.));float split=noise3(vec3(vUV.x*43.+warp*2.4,vPos.y*.87,8.));float fissure=1.-smoothstep(.24,.40,split);float flakes=noise3(vec3(vUV.x*152.,vPos.y*12.,6.));float furrow=smoothstep(.4,.7,grain);height=furrow*.032-fissure*.035+flakes*.006;
vec3 bark=mix(vec3(.105,.058,.028),vec3(.29,.20,.105),grain);bark=mix(bark,t*vec3(.64,.53,.38),uAtlasReady*.38);albedo=bark*(1.-fissure*.62)*(.83+flakes*.24);float moss=smoothstep(.53,.76,noise3(vPos*1.2)+n.y*.1)*(1.-smoothstep(2.,10.,vPos.y));float lichen=smoothstep(.70,.79,noise3(vPos*8.))*smoothstep(.42,.67,noise3(vPos*.9));albedo=mix(albedo,vec3(.052,.13,.023),moss*.77);albedo=mix(albedo,vec3(.25,.29,.17),lichen*.40);rough=mix(.88,.34,wet);occlusion=1.-fissure*.20;
}
else if(leaf||litter){vec3 t=atlas(clamp(vec2(vUV.x,1.-vUV.y),.01,.99),vec2(.025),vec2(.45));float vein=exp(-abs(vUV.x-.5)*125.)*.07+pow(.5+.5*cos((vUV.y-abs(vUV.x-.5)*.35)*100.),24.)*.016;height=dot(t,vec3(.333))*.07+vein;albedo=mix(albedo,t*(.5+vColor*2.0),uAtlasReady*.48);if(vMat>9.5){float detail=dot(t,vec3(.22,.67,.11));albedo=vColor*(.56+detail*2.6);float veins=.5+.5*sin(vUV.y*32.+abs(vUV.x-.5)*14.);albedo*=.88+.12*veins;}if(litter){albedo=mix(vColor,t*vColor*3.,.4);wet*=.8;}wet=max(wet,uRain*.98);rough=mix(.58,.16,wet);float bead=pow(max(0.,noise3(vPos*130.)-.72)*3.7,3.);float beadFilter=1.-smoothstep(.3,1.1,max(length(dFdx(vPos*130.)),length(dFdy(vPos*130.))));height+=bead*.018*wet*beadFilter;float rivulet=pow(max(0.,noise3(vec3(vUV.x*110.,vUV.y*9.-uTime*.2,4.))-.62)*2.6,3.);height+=rivulet*.008*uRain*beadFilter;occlusion=.74+.26*sin(clamp(vUV.y,0.,1.)*3.14159);}
else if(soil){
// Independent scales and rotated texture samples break visible square repetition.
vec2 q=vPos.xz;float soilMix=fbm(vec3(q*.21,2.3)),fine=noise3(vec3(q*13.,3.)),moss=smoothstep(.49,.65,soilMix+.08*sin(q.x*.31+q.y*.27));
vec3 t=atlas(fract(q*.31),vec2(.09,.54),vec2(.37,.32));vec2 rotated=mat2(.8,.6,-.6,.8)*q;vec3 t2=atlas(fract(rotated*.77+vec2(.37,.21)),vec2(.09,.54),vec2(.37,.32));t=mix(t,t2,smoothstep(.3,.7,noise3(vec3(q*.44,4.))));
float shore=1.-smoothstep(-.16,.95,vPos.y);float saturated=max(uWet*.82,shore*.96);wet=saturated;
vec3 mud=mix(vec3(.047,.027,.013),vec3(.14,.083,.039),fine*.38+soilMix*.45);vec3 mulch=mix(vec3(.13,.074,.032),t*.62,uAtlasReady*.55);float mulchMask=smoothstep(.54,.72,soilMix)*(1.-shore*.8);albedo=mix(mud,mulch,mulchMask);albedo=mix(albedo,vec3(.048,.095,.022)*(.65+fine*.5),moss*(1.-shore*.88)*.7);
vec2 basinWarp=q+vec2(noise3(vec3(q*.63,4.)),noise3(vec3(q*.59,8.)))*1.4;float poolField=noise3(vec3(basinWarp*1.15,6.));float basin=(1.-smoothstep(.38,.54,poolField))*smoothstep(.70,.96,n.y);puddle=basin*smoothstep(.18,.8,wet);albedo=mix(albedo,vec3(.039,.029,.014),puddle*.58);height=(dot(t,vec3(.333))*.028+fine*.009)*(1.-puddle*.92);rough=mix(mix(.8,.23,wet),.09,puddle);occlusion=.83+.17*fine;

}
else if(stone){vec2 uv=fract(vec2(vPos.x+vPos.y*.7,vPos.z)*.7);vec3 t=atlas(uv,vec2(.53),vec2(.34));albedo=mix(albedo,t*.7,uAtlasReady*.85);height=dot(t,vec3(.333))*.09;rough=mix(.85,.23,wet);}
else if(vMat>4.5&&vMat<5.5){albedo*=1.-smoothstep(.64,.75,noise3(vPos*95.))*.3;rough=.29;wet=.7;}
if(vMat>10.5){float pores=noise3(vec3(vUV.y*7.,vNormal.xy*90.));rough=vMat<11.5?.24:vMat<12.5?.38:.12;wet=.85;if(vMat<12.5){float scales=pow(.5+.5*cos(vUV.y*7.+sin(vNormal.y*65.)),10.);albedo*=.82+pores*.25;albedo*=1.-scales*.13;n=bump(n,pores*.001+scales*.0008,.18);}}
if(!water&&(vMat<8.5||leaf)){float pixelFootprint=max(length(dFdx(vPos)),length(dFdy(vPos)));float detailFade=(1.-smoothstep(12.,38.,distanceToEye))*(1.-smoothstep(.015,.065,pixelFootprint));n=bump(n,height,.13*detailFade);albedo*=1.-wet*.22;}
// Spatially separated violet / petrol colonies, with mineral-lit veins.
float colony=noise3(vec3(vPos.xz*.10,4.));
if(leaf){float lum=dot(albedo,vec3(.22,.68,.1));albedo=mix(vec3(.19,.045,.24),vec3(.035,.23,.20),smoothstep(.38,.66,colony))*(.65+lum*2.4);}
if(vMat<.5)albedo=mix(vec3(.035,.025,.075),vec3(.20,.13,.25),clamp(dot(albedo,vec3(2.)),0.,1.));
if(soil||litter)albedo=albedo.bgr*vec3(1.35,.65,1.25)+vec3(.025,.012,.035);
if(stone)albedo=mix(vec3(.025,.04,.075),vec3(.15,.18,.27),clamp(dot(albedo,vec3(.8)),0.,1.));
if(vMat>4.5&&vMat<5.5||vMat>10.5&&vMat<12.5)albedo=albedo.brg*vec3(1.2,.9,1.35);
vec3 reflection=vec3(0.);float fresnel=pow(1.-max(dot(n,view),0.),5.);
if(water){vec2 flow=vec2(vPos.x-riverCenter(vPos.z),vPos.z);float speed=.42+.3*(1.-smoothstep(1.4,1.95,riverWidthAt(vPos.z)));float t=uTime*speed;vec2 moving=flow+vec2(0.,-t*.35);vec2 warp=vec2(noise3(vec3(moving*.71,1.)),noise3(vec3(moving*.83,9.)))*2.3;vec2 q=mat2(.83,.56,-.56,.83)*moving+warp;float wave1=noise3(vec3(q*3.1,2.))*2.-1.,wave2=noise3(vec3(q*4.7+vec2(6.2,3.7),7.))*2.-1.,wave3=noise3(vec3(q*11.3,4.))*2.-1.;
float shoreDamp=smoothstep(0.,.15,channelDepth);n=normalize(vec3((wave1*.027+wave3*.008)*shoreDamp,1.,(wave2*.019+wave3*.006)*shoreDamp));n.xz+=rainNormal(vPos.xz)*1.7;
for(int i=0;i<4;i++){vec3 r=uRipples[i];if(r.z>=0.){vec2 delta=vPos.xz-r.xy;float radius=length(delta),ring=exp(-pow((radius-r.z*.6)*12.,2.))*(1.-clamp(r.z/2.5,0.,1.));n.xz+=normalize(delta+vec2(.001))*ring*.10;}}n=normalize(n);rough=.13+uRain*.055;wet=1.;
vec2 refractedBed=vPos.xz+n.xz*channelDepth*2.;float grit=noise3(vec3(refractedBed*19.,2.)),pebble=noise3(vec3(refractedBed*37.,5.));vec3 bottom=mix(vec3(.17,.12,.055),vec3(.37,.30,.15),grit);bottom*=.76+.24*pebble;
// Soft, irregular moving light patches replace the intersecting sine lattice.
vec2 lightUV=refractedBed*2.7+warp*.55+vec2(t*.09,-t*.12);float lightNoise=noise3(vec3(lightUV,4.7));float caustic=smoothstep(.57,.78,lightNoise)*(1.-smoothstep(.45,.65,noise3(vec3(lightUV*1.73,1.8))));bottom+=vec3(.075,.087,.045)*caustic*uDay*(1.-uCloud)*smoothstep(.06,.22,channelDepth);

vec3 transmission=exp(-vec3(3.1,1.65,1.25)*channelDepth*2.2);albedo=mix(vec3(.012,.16,.19),bottom,transmission);fresnel=.035+.965*pow(1.-max(dot(n,view),0.),5.);
}
if(soil&&puddle>.05){n=normalize(mix(n,vec3(0,1,0),puddle*.8)+vec3(rainNormal(vPos.xz).x,0,rainNormal(vPos.xz).y)*puddle);}
vec3 reflected=reflect(-view,n);float skyOpening=smoothstep(.35,.70,noise3(vec3(reflected.xz*4.+vPos.xz*.035,uTime*.002)));
reflection=mix(vec3(.028,.057,.03),mix(vec3(.27,.37,.34),vec3(.63,.73,.68),skyOpening),smoothstep(.12,.75,reflected.y));if(water){vec3 rd=reflect(-view,n);float canopy=fbm(vec3(rd.x*9.+vPos.x*.04,rd.z*9.+vPos.z*.04,3.));float opening=smoothstep(.49,.65,canopy);vec3 reflectedSky=mix(vec3(.18,.22,.42),vec3(.54,.42,.65),smoothstep(.1,.8,rd.y));vec3 canopyColor=mix(vec3(.035,.016,.07),vec3(.12,.04,.19),noise3(rd*27.));reflection=mix(canopyColor,reflectedSky,opening);float trunks=smoothstep(.62,.8,noise3(vec3(rd.x*21.,rd.z*13.,5.)))*(1.-opening);reflection*=1.-trunks*.6;}
reflection*=mix(.08,1.,uDay)*(1.-uCloud*.3);
float nd=max(dot(n,uSun),0.),sh=shadow(n);float gap=noise3(vec3(vPos.xz*.26+vec2(uTime*.009,uTime*.004),2.));float dapple=mix(.46,1.,smoothstep(.30,.65,gap));
float ao=mix(.72,1.,smoothstep(-.4,6.,vPos.y))*occlusion;
vec3 ambient=mix(vec3(.065,.085,.15),mix(vec3(.14,.10,.19),vec3(.25,.30,.41),n.y*.5+.5),uDay)*ao;
vec3 sunColor=mix(vec3(.25,.37,.56),mix(vec3(1.55,.86,.36),vec3(1.24,1.20,.90),smoothstep(.15,.8,uSun.y)),uDay);
float direct=mix(.17,1.65,uDay)*pow(1.-uCloud*.93,2.);vec3 lit=albedo*(ambient+sunColor*direct*nd*sh*dapple);lit+=albedo*vec3(.10,.11,.13)*max(0.,noise3(vec3(vPos.xz*.9,uTime*.07))-.68)*3.*(soil?1.:stone?.6:0.)*uDay;
// Broad atmospheric fill and restrained companion-star light keep forms legible.
float skyFill=.5+.5*max(n.y,0.);vec3 companion=normalize(uSun+vec3(.09,.02,.02));lit+=albedo*(vec3(.10,.16,.24)*(1.-uDay)*skyFill+vec3(.16,.22,.34)*max(dot(n,companion),0.)*uDay*(1.-uCloud)*sh*.14);
if(leaf){float back=pow(max(dot(view,-uSun),0.),3.);lit+=albedo*sunColor*(.04+back*.48)*uDay*sh*(1.-uCloud*.6);}
// Energy-shaped specular lobe plus a restrained sky reflection on wet surfaces.
float normalVariance=max(dot(dFdx(n),dFdx(n)),dot(dFdy(n),dFdy(n)));rough=sqrt(rough*rough+min(.18,normalVariance)*.9);vec3 h=normalize(uSun+view);float nh=max(dot(n,h),0.),nv=max(dot(n,view),.001),vh=max(dot(view,h),0.);float alpha=max(.055,rough*rough),a2=alpha*alpha;
float D=a2/(3.14159*pow(nh*nh*(a2-1.)+1.,2.));float k=pow(rough+1.,2.)*.125;float G=(nv/(nv*(1.-k)+k))*(nd/(nd*(1.-k)+k));float F=.035+.965*pow(1.-vh,5.);
lit+=sunColor*min(4.,D*G*F/max(4.*nv*nd,.001))*nd*sh*direct*(leaf?.32:1.);
float coat=(.025+fresnel*.42)*wet*(leaf?(.42+uRain*.88):soil?.48:.22)+puddle*(.17+fresnel*.72);lit+=reflection*coat*ao;
if(water){lit=mix(lit,reflection,clamp(fresnel*.92+.10,0.,.94));float edge=1.-smoothstep(.008,.065,channelDepth);float lace=noise3(vec3(vPos.xz*24.,uTime*.35));float flecks=pow(max(0.,noise3(vec3((vPos.x-riverCenter(vPos.z))*17.,vPos.z*5.-uTime*.6,3.))-.58)*2.38,3.);float foam=clamp(edge*smoothstep(.40,.70,lace)*.35+flecks*.13,0.,.5);lit=mix(lit,vec3(.46,.55,.45)*(ambient+sunColor*nd*direct*sh*.25),foam);}lit+=albedo*uFlash*.65;
if(leaf){float veins=exp(-abs(vUV.x-.5)*90.)+pow(.5+.5*cos((vUV.y-abs(vUV.x-.5)*.55)*55.),24.)*.32;veins*= (1.-smoothstep(.025,.10,max(fwidth(vUV.x),fwidth(vUV.y))))*(1.-smoothstep(16.,55.,distanceToEye));float pulse=.87+.09*sin(uTime*.42+vPos.x*.35+vPos.z*.27)+.04*sin(uTime*.19-vPos.z*.2);lit+=mix(vec3(.045,.6,.46),vec3(.48,.13,.32),1.-smoothstep(.38,.66,colony))*veins*pulse*mix(.65,.16,uDay);}
if(vMat>2.5&&vMat<3.5)lit+=albedo*.34;
if(water)lit+=vec3(.005,.16,.18)*(.4+.6*noise3(vec3(vPos.xz*2.+uTime*.04,8.)))*mix(.7,.18,uDay);
float groundMist=noise3(vec3(vPos.xz*.12+vec2(uTime*.017,uTime*.008),uTime*.005));float fog=1.-exp(-distanceToEye*uFogD*(1.+exp(-max(vPos.y,0.)*.45)*groundMist*1.4));fog=max(fog,smoothstep(uDistance*.85,uDistance+25.,distanceToEye));lit=mix(lit,uFog,clamp(fog,0.,.985));frag=vec4(max(lit,vec3(0)),1.);}`;
export const shadowFS=`precision highp float;void main(){}`;
export const fullVS=`precision highp float;out vec2 vUV;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUV=p;gl_Position=vec4(p*2.-1.,0,1);}`;
export const skyFS=`precision highp float;in vec2 vUV;out vec4 frag;uniform vec3 uForward,uRight,uUp,uSun;uniform vec2 uSize;uniform float uTan,uDay,uCloud,uTime,uFlash;${noiseGLSL}
void main(){vec2 q=vUV*2.-1.;vec3 d=normalize(uForward+uRight*q.x*uTan*uSize.x/uSize.y+uUp*q.y*uTan);float elev=max(d.y,0.);vec3 sky=mix(vec3(.008,.013,.045),mix(vec3(.38,.22,.40),vec3(.065,.12,.27),pow(elev,.55)),uDay);
float sun=dot(d,uSun);sky+=vec3(1.,.67,.42)*pow(max(sun,0.),700.)*uDay*(1.-uCloud*.8);sky+=vec3(.44,.65,1.)*pow(max(dot(d,normalize(uSun+vec3(.09,.02,.02))),0.),1600.)*uDay;
vec3 center=normalize(vec3(-.22,.55,-1.))*5.,rn=normalize(vec3(.18,.85,.5));float pr=1.48,b=dot(d,center),disc=b*b-dot(center,center)+pr*pr,hit=100.;bool sphere=disc>0.&&b>0.;if(sphere)hit=b-sqrt(disc);
float den=dot(d,rn),rt=abs(den)>.001?dot(center,rn)/den:-1.;vec3 rp=d*rt-center;float rr=length(rp);bool ring=rt>0.&&rr>pr*1.24&&rr<pr*2.12;float ringPhase=rr*48.+noise3(rp*5.)*2.;float bands=.5+.5*sin(ringPhase)*(1.-smoothstep(.5,2.5,fwidth(ringPhase)));vec3 ringColor=mix(vec3(.24,.16,.28),vec3(.63,.46,.35),bands)*mix(.45,.9,uDay);
if(ring&&rt>hit)sky=mix(sky,ringColor,.72);
if(sphere){vec3 normal=normalize(d*hit-center);float band=.5+.5*sin(normal.y*38.+fbm(normal*6.)*5.);vec3 planet=mix(vec3(.15,.22,.37),vec3(.52,.37,.43),band);float light=max(0.,dot(normal,normalize(vec3(-.8,.5,.4))));planet*=.13+light*.95;float rim=pow(1.-max(0.,dot(normal,-d)),3.);sky=planet+vec3(.11,.23,.42)*rim*.55;}
if(ring&&rt<hit)sky=mix(sky,ringColor,.78);
float moon=dot(d,normalize(vec3(.62,.37,-1.)));sky+=vec3(.3,.48,.59)*smoothstep(.999,.9996,moon)*.65;
float stars=step(.9984,hash3(floor(d*650.)))*pow(1.-uDay*.9,3.)*smoothstep(.02,.4,d.y);if(!sphere&&!ring)sky+=stars*.85;
float curtain=exp(-abs(d.y-(.34+.065*sin(d.x*8.+uTime*.018)))*38.);float ribbons=.5+.5*sin(d.x*90.+noise3(d*7.+uTime*.007)*9.);sky+=mix(vec3(.035,.31,.26),vec3(.25,.06,.4),ribbons)*curtain*(.22+.78*ribbons)*(1.-uDay)*.8;
vec3 p=d*(5./max(d.y+.12,.12));p.xz+=vec2(uTime*.006,uTime*.002);float clouds=smoothstep(.70-uCloud*.35,.91-uCloud*.34,fbm(p*.65))*smoothstep(-.12,.12,d.y);vec3 cloudCol=mix(vec3(.028,.033,.075),mix(vec3(.57,.44,.60),vec3(.16,.18,.28),uCloud),uDay);sky=mix(sky,cloudCol,clouds*.85);sky*=1.+.012*sin(uTime*.06+uSun.x*4.);sky+=uFlash*.55;frag=vec4(sky,1);}`;
export const postFS=`precision highp float;in vec2 vUV;out vec4 frag;uniform sampler2D uColor,uDepth;uniform vec2 uSize,uSunScreen;uniform float uDay,uShaft,uExposure,uTime,uRain,uMist,uFar,uAO;float linearDepth(float d){return .24*uFar/(uFar+.12-(d*2.-1.)*(uFar-.12));}void main(){vec3 c=texture(uColor,vUV).rgb;vec2 px=1./uSize;
vec3 a=texture(uColor,vUV+vec2(-px.x,-px.y)).rgb,b=texture(uColor,vUV+vec2(px.x,-px.y)).rgb,d=texture(uColor,vUV+vec2(-px.x,px.y)).rgb,e=texture(uColor,vUV+px).rgb;
vec3 luma=vec3(.299,.587,.114);float lc=dot(c,luma),la=dot(a,luma),lb=dot(b,luma),ld=dot(d,luma),le=dot(e,luma),lo=min(lc,min(min(la,lb),min(ld,le))),hi=max(lc,max(max(la,lb),max(ld,le)));
if(hi-lo>max(.016,hi*.105)){vec2 dir=vec2(-(la+lb-ld-le),la+ld-lb-le);float reduce=max((la+lb+ld+le)*.03125,.0078125);dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),vec2(-6),vec2(6))*px;vec3 first=.5*(texture(uColor,vUV-dir/6.).rgb+texture(uColor,vUV+dir/6.).rgb),second=first*.5+.25*(texture(uColor,vUV-dir*.5).rgb+texture(uColor,vUV+dir*.5).rgb);float lum=dot(second,luma);c=lum<lo||lum>hi?first:second;}
float dep0=texture(uDepth,vUV).r;if(uAO>0.&&dep0<.9997){float z=linearDepth(dep0),occ=0.;vec2 radius=px*clamp(160./max(z,1.),2.,24.);for(int i=0;i<8;i++){float theta=float(i)*2.39996;vec2 offset=vec2(cos(theta),sin(theta))*radius*(.55+float(i%2)*.45);float zn=linearDepth(texture(uDepth,clamp(vUV+offset,0.,1.)).r),delta=z-zn;occ+=smoothstep(.025,.25,delta)*(1.-smoothstep(.3,1.6,delta));}c*=1.-occ*.026*uAO;}if(uShaft>0.){vec2 stepUV=(uSunScreen-vUV)*.055;vec2 p=vUV;float beam=0.,decay=1.;for(int i=0;i<16;i++){p+=stepUV;float dep=texture(uDepth,clamp(p,0.,1.)).r;beam+=smoothstep(.9985,.99995,dep)*decay;decay*=.94;}float radial=max(0.,1.-length(vUV-uSunScreen)*.75);c+=vec3(.45,.40,.21)*beam*.025*radial*uDay*uShaft;}float vignette=(1.-smoothstep(.25,.9,length((vUV-.5)*vec2(1.,.85))));c*=mix(.78,1.,vignette);c*=uExposure;c=(c*(2.51*c+.03))/(c*(2.43*c+.59)+.14);c=pow(clamp(c,0.,1.),vec3(1./2.2));c+=(fract(sin(dot(vUV*uSize+vec2(uTime*127.1,uTime*311.7),vec2(12.9898,78.233)))*43758.5453)-.5)*.014;frag=vec4(c,1);}`;
export const particlesVS=`precision highp float;layout(location=0)in vec4 aParticle;uniform mat4 uVP;uniform float uTime,uRain,uDay,uLife,uWind,uEvent,uPointScale;out float vType,vAlpha,vPhase;void main(){float id=aParticle.w;vec3 p=aParticle.xyz;vType=0.;vPhase=id;if(id<1000.){p.y=mod(p.y-uTime*(9.+fract(id*.371)*8.),22.);p.x+=sin(id)*uWind*(22.-p.y)*.13;vAlpha=uRain*.35;vType=0.;}else if(id<1300.){if(id>1000.+uLife*65.){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=1.;vAlpha=0.;vType=1.;vPhase=id;return;}p.x+=sin(uTime*.27+id)*1.5;p.y+=sin(uTime*.41+id)*.7;p.z+=cos(uTime*.23+id)*1.2;vAlpha=(1.-uDay*.65)*uLife*(.10+.90*pow(.5+.5*sin(uTime*.85+id),6.));vType=1.;}else if(id<1400.){p.y=mod(p.y-uTime*.16,15.);p.x+=sin(uTime*.4+id)*2.;vAlpha=.12*(.35+.65*uDay)*(.7+.3*sin(uTime*.7+id*1.7));vType=2.;}else{p.y=mod(p.y-uTime*.8,18.);p.x+=sin(uTime*.5+id)*3.;vAlpha=uEvent*.45;vType=3.;}gl_Position=uVP*vec4(p,1);gl_PointSize=clamp(uPointScale/(gl_Position.w)*mix(16.,4.,step(1000.,id)),1.,32.);if(id>=1400.)gl_PointSize=clamp(uPointScale*9./gl_Position.w,2.,20.);}`;
export const particlesFS=`precision highp float;in float vType,vAlpha,vPhase;out vec4 frag;uniform float uTime;void main(){vec2 p=gl_PointCoord*2.-1.;float a;vec3 c;if(vType<.5){a=exp(-p.x*p.x*70.)*(1.-abs(p.y));c=vec3(.7,.84,.84);}else if(vType<1.5){a=exp(-dot(p,p)*4.);c=vec3(.24,.88,.95)*.8;}else if(vType<2.5){a=max(0.,1.-dot(p,p));c=vec3(.76,.49,.91);}else{float an=uTime+vPhase;vec2 q=mat2(cos(an),-sin(an),sin(an),cos(an))*p;a=1.-smoothstep(.2,.5,length(q*vec2(1.,2.)));c=vec3(.31,.3,.09);}frag=vec4(c,a*vAlpha);}`;
export const rainVS=`precision highp float;
layout(location=0)in vec2 aCorner;layout(location=1)in vec4 aDrop;
uniform mat4 uVP;uniform vec3 uRight;uniform float uTime,uRain,uWet,uWind,uShower,uTerrainPhase;uniform int uMode;
${terrainGLSL}
out vec2 vUV;out float vAge,vFade;flat out int vMode;
void main(){float seed=aDrop.w,age=fract(uTime*(.7+fract(seed*1.7)*1.6)+seed);vec3 p=aDrop.xyz;vUV=aCorner;vAge=age;vMode=uMode;vFade=1.;
if(uMode==3){float period=2.8+fract(seed*.17)*5.;float elapsed=mod(uTime+seed*19.,period/(1.+uShower*2.));float fall=max(0.,elapsed-.35);p.y-=4.9*fall*fall;p.x+=uWind*fall*.18;float bottom=max(-.2,landHeight(p.xz));float grow=smoothstep(0.,.35,elapsed);float len=mix(.012,.055,clamp(fall*2.,0.,1.));p+=uRight*aCorner.x*.012*grow+vec3(0.,aCorner.y*len*grow,0.);vFade=(p.y>bottom?1.:0.)*uWet*(.55+uShower*.4);}
else if(uMode==0){float height=23.,speed=16.+fract(seed*.13)*8.;float fall=mod(uTime*speed+seed*19.,height);p.y+=height-fall;p.x+=uWind*fall*.13;float len=.23+fract(seed*.71)*.39;float width=.006+fract(seed*2.7)*.006;vec3 down=normalize(vec3(uWind*.13,-1.,.04));p+=uRight*aCorner.x*width+down*aCorner.y*len;vFade=uRain*.7;}
else if(uMode==1){float size=.022+age*(.12+fract(seed*.3)*.18);p+=vec3(aCorner.x*size,.008,aCorner.y*size);vFade=(1.-age)*(1.-age)*uRain;}
else{float size=.07+fract(seed*.3)*.05;p+=uRight*aCorner.x*size;p.y+=(aCorner.y+1.)*size*.8;vFade=pow(1.-age,3.)*uRain;}
gl_Position=uVP*vec4(p,1.);}`;
export const rainFS=`precision highp float;
in vec2 vUV;in float vAge,vFade;flat in int vMode;out vec4 frag;uniform float uDay;
void main(){float a=0.;vec3 color=mix(vec3(.25,.37,.49),vec3(.66,.80,.77),uDay);
if(vMode==0||vMode==3){a=exp(-vUV.x*vUV.x*5.)*(1.-smoothstep(.25,1.,abs(vUV.y)));color+=vec3(.15)*exp(-vUV.y*vUV.y*24.);}
else if(vMode==1){float r=length(vUV);a=exp(-pow((r-.78)*34.,2.))*.5+exp(-pow((r-.47)*38.,2.))*.13;}
else{float x=vUV.x,y=(vUV.y+1.)*.5;float crown=pow(abs(sin(x*10.)),3.)*.35;float band=exp(-pow((y-(.14+crown)*(1.-vAge)*3.)*24.,2.));a=band*(1.-smoothstep(.3,1.,abs(x)))*.45;}
if(a*vFade<.005)discard;frag=vec4(color,a*vFade);}`;
