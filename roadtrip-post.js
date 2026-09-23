import * as T from './three.module.js';

const vert=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const frag=`precision highp float;
varying vec2 vUv;
uniform sampler2D tColor,tDepth;
uniform vec2 resolution,sunUv;
uniform mat4 inverseProjection,cameraWorld;
uniform vec3 sunDirection,fogColor,sunColor;
uniform float time,focus,grain,fogDensity,exposure,scattering,sunVisible;
uniform int debugPass;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 positionAt(vec2 uv){float d=texture2D(tDepth,uv).r;vec4 p=inverseProjection*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
vec3 fxaa(vec2 uv){
 vec2 p=1./resolution;vec3 a=texture2D(tColor,uv+vec2(-1,-1)*p).rgb,b=texture2D(tColor,uv+vec2(1,-1)*p).rgb,c=texture2D(tColor,uv+vec2(-1,1)*p).rgb,d=texture2D(tColor,uv+vec2(1,1)*p).rgb,m=texture2D(tColor,uv).rgb;
 float la=lum(a),lb=lum(b),lc=lum(c),ld=lum(d),lm=lum(m);vec2 dir=vec2(-((la+lb)-(lc+ld)),(la+lc)-(lb+ld));float red=max((la+lb+lc+ld)*.03125,.0078125);float rec=1./(min(abs(dir.x),abs(dir.y))+red);dir=clamp(dir*rec,vec2(-6),vec2(6))*p;
 vec3 aa=.5*(texture2D(tColor,uv+dir*(-.166667)).rgb+texture2D(tColor,uv+dir*.166667).rgb);vec3 bb=aa*.5+.25*(texture2D(tColor,uv+dir*-.5).rgb+texture2D(tColor,uv+dir*.5).rgb);float ll=lum(bb);return (ll<min(lm,min(min(la,lb),min(lc,ld)))||ll>max(lm,max(max(la,lb),max(lc,ld))))?aa:bb;
}
vec3 aces(vec3 v){return clamp((v*(2.51*v+.03))/(v*(2.43*v+.59)+.14),0.,1.);}
void main(){
 vec2 uv=vUv;float dep=texture2D(tDepth,uv).r;vec3 p=positionAt(uv);float distance=-p.z;bool sky=dep>.999995;
 vec3 color=fxaa(uv);
 vec3 n=normalize(cross(dFdx(p),dFdy(p)));if(dot(n,-p)<0.)n=-n;
 float ao=0.;
 if(!sky&&distance<500.){
  float rad=clamp(1.8/max(distance,1.),.0015,.05);float angle=hash(floor(uv*resolution*.25))*6.283185;
  for(int i=0;i<10;i++){float a=angle+float(i)*2.39996;vec2 off=vec2(cos(a),sin(a))*rad*(.35+.65*float(i)/10.);vec3 delta=positionAt(clamp(uv+off,vec2(.001),vec2(.999)))-p;float dd=length(delta);ao+=max(0.,dot(n,delta/max(dd,.001))-.14)*(1.-smoothstep(.1,2.7,dd));}
  ao=clamp(ao*.20,0.,.5);color*=1.-ao;
 }
 // Conservative depth of field. Keep the road, hero car and most texture
 // detail sharp; only distant/very near surfaces receive a small blur.
 float coc=sky?0.:min(1.5,max(0.,abs(distance-focus)-24.)/max(distance,1.)*1.55);
 if(coc>.1){vec3 blur=vec3(0);float count=0.;for(int i=0;i<6;i++){float a=float(i)*1.0472;vec2 q=uv+vec2(cos(a),sin(a))*coc/resolution;float qd=-positionAt(q).z;if(abs(qd-distance)<max(6.,distance*.16)){blur+=texture2D(tColor,q).rgb;count+=1.;}}if(count>0.)color=mix(color,blur/count*(1.-ao),.3);}
 vec3 bloom=vec3(0);for(int i=0;i<8;i++){float a=float(i)*.785398;vec3 b=texture2D(tColor,uv+vec2(cos(a),sin(a))*(3.+float(i%3)*3.)/resolution).rgb;bloom+=b*max(0.,lum(b)-1.15)/max(lum(b),.01);}color+=bloom*.018;
 vec3 world=(cameraWorld*vec4(p,1)).xyz;vec3 ray=normalize((cameraWorld*vec4(normalize(p),0)).xyz);
 float alignment=max(0.,dot(ray,sunDirection));float haze=sky?0.:1.-exp(-distance*fogDensity*(.65+.65*exp(-max(world.y-12.,0.)*.009)));
 vec3 atmosphere=fogColor+sunColor*pow(alignment,12.)*.19*scattering;color=mix(color,atmosphere,min(haze,.91));
 // Depth-tested sun scattering: foreground silhouettes occlude samples.
 float rays=0.;if(sunVisible>.5){for(int i=0;i<10;i++){vec2 q=mix(uv,sunUv,float(i)/10.*.65);float open=step(.99998,texture2D(tDepth,clamp(q,vec2(.001),vec2(.999))).r);rays+=open*(1.-float(i)/13.);}color+=sunColor*rays*.0028*pow(alignment,4.)*scattering;}
 color=aces(color*exposure);color=pow(color,vec3(1./2.2));
 float vignette=smoothstep(.24,.86,length((uv-.5)*vec2(1.,.85)));color*=1.-vignette*.19;
 float g=(hash(uv*resolution+vec2(mod(floor(time*24.),1000.),17.))-.5)*grain;color+=g;
 if(debugPass==1)color=vec3(1.-exp(-distance*.007));if(debugPass==2)color=vec3(1.-ao);
 gl_FragColor=vec4(color,1.);
}`;

export function createPost(renderer){
 const target=new T.WebGLRenderTarget(1,1,{type:renderer.extensions?.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,format:T.RGBAFormat,minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true});
 target.samples=renderer.capabilities.isWebGL2?Math.min(4,renderer.capabilities.maxSamples??4):0;target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.depthTexture.format=T.DepthFormat;
 const uniforms={tColor:{value:target.texture},tDepth:{value:target.depthTexture},resolution:{value:new T.Vector2(1,1)},sunUv:{value:new T.Vector2()},sunVisible:{value:1},inverseProjection:{value:new T.Matrix4()},cameraWorld:{value:new T.Matrix4()},sunDirection:{value:new T.Vector3()},fogColor:{value:new T.Color()},sunColor:{value:new T.Color()},time:{value:0},focus:{value:20},grain:{value:.014},fogDensity:{value:.0013},exposure:{value:1.2},scattering:{value:1},debugPass:{value:0}};
 const mat=new T.ShaderMaterial({uniforms,vertexShader:vert,fragmentShader:frag,depthTest:false,depthWrite:false});
 // Project the sun once per frame, keeping matrix inversions out of the
 // full-resolution fragment pass.
 const sunPoint=new T.Vector3();
 const scene=new T.Scene(),camera=new T.Camera();scene.add(new T.Mesh(new T.PlaneGeometry(2,2),mat));
 return {target,uniforms,resize(w,h){target.setSize(w,h);uniforms.resolution.value.set(w,h);},draw(main,cam,time){uniforms.time.value=time;uniforms.inverseProjection.value.copy(cam.projectionMatrixInverse);uniforms.cameraWorld.value.copy(cam.matrixWorld);sunPoint.copy(uniforms.sunDirection.value).multiplyScalar(2000).add(cam.position).applyMatrix4(cam.matrixWorldInverse);uniforms.sunVisible.value=sunPoint.z<0?1:0;sunPoint.applyMatrix4(cam.projectionMatrix);uniforms.sunUv.value.set(sunPoint.x*.5+.5,sunPoint.y*.5+.5);renderer.setRenderTarget(target);renderer.render(main,cam);renderer.setRenderTarget(null);renderer.render(scene,camera);}};
}

export const MOODS={
 B:{name:'Blue valley',top:'#355f78',horizon:'#a4bdb0',sun:'#ffdfa5',key:2.3,hemi:2.0,exposure:1.10,fog:.00105,sunDir:[-.52,.68,.45],stars:1},
 G:{name:'Golden hour',top:'#648c98',horizon:'#e3c591',sun:'#ffca7f',key:3.4,hemi:1.8,exposure:1.06,fog:.00120,sunDir:[-.65,.37,.61],stars:0},
 M:{name:'Morning mist',top:'#76989e',horizon:'#d8dfc5',sun:'#f3efcd',key:1.65,hemi:2.1,exposure:1.08,fog:.00225,sunDir:[-.35,.6,.72],stars:0}
};
export function makeSky(){
 const uniforms={topColor:{value:new T.Color()},horizonColor:{value:new T.Color()},sunColor:{value:new T.Color()},sunDirection:{value:new T.Vector3()},stars:{value:1}};
 const shader=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms,
 vertexShader:'varying vec3 vDirection;void main(){vDirection=position;vec4 pos=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=pos.xyww;}',
 fragmentShader:`precision highp float;varying vec3 vDirection;uniform vec3 topColor,horizonColor,sunColor,sunDirection;uniform float stars;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec3 c=mix(horizonColor,topColor,pow(h,.44));float sun=max(0.,dot(d,sunDirection));c+=sunColor*(pow(sun,450.)*.4+pow(sun,18.)*.075);float clouds=noise(d.xz/(h+.18)*3.)*.6+noise(d.xz/(h+.18)*8.)*.3+noise(d.xz/(h+.18)*20.)*.1;c=mix(c,horizonColor*1.06,smoothstep(.65,.84,clouds)*.20*smoothstep(.05,.3,h));
 vec3 md=normalize(vec3(-.31,.62,.8));float disc=1.-smoothstep(.009,.010,length(d-md));float cut=1.-smoothstep(.0085,.0093,length(d-normalize(md+vec3(.004,.002,0))));c+=vec3(.9,.93,.78)*disc*(1.-cut)*stars;float star=step(.9997,hash(floor(d.xz/(h+.15)*1100.)))*.18*smoothstep(.3,.6,h)*stars;c+=star;gl_FragColor=vec4(c,1.);}`});
 const mesh=new T.Mesh(new T.SphereGeometry(4900,32,16),shader);mesh.frustumCulled=false;mesh.renderOrder=-10;
 return {mesh,uniforms,set(mood){uniforms.topColor.value.set(mood.top);uniforms.horizonColor.value.set(mood.horizon);uniforms.sunColor.value.set(mood.sun);uniforms.sunDirection.value.fromArray(mood.sunDir).normalize();uniforms.stars.value=mood.stars;}};
}
