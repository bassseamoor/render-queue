import {T} from './assets.mjs';
export const VERTEX=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const FRAGMENT=`precision highp float;
varying vec2 vUv;uniform sampler2D tColor,tDepth;uniform mat4 inverseProjection;uniform vec2 resolution;uniform float focus,time,grain;uniform int debugPass;
vec3 pos(vec2 uv){vec4 p=inverseProjection*vec4(uv*2.-1.,texture2D(tDepth,uv).r*2.-1.,1.);return p.xyz/p.w;}
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
vec3 sampleAA(vec2 uv){vec2 px=1./resolution;vec3 c=texture2D(tColor,uv).rgb,a=texture2D(tColor,uv+vec2(-1,1)*px).rgb,b=texture2D(tColor,uv+vec2(1,1)*px).rgb,d=texture2D(tColor,uv+vec2(-1,-1)*px).rgb,e=texture2D(tColor,uv+vec2(1,-1)*px).rgb;float la=lum(a),lb=lum(b),ld=lum(d),le=lum(e);vec2 dir=vec2(-((la+lb)-(ld+le)),(la+ld)-(lb+le));float red=max((la+lb+ld+le)*.03125,.0078);dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+red),vec2(-4),vec2(4))*px;vec3 aa=.5*(texture2D(tColor,uv-dir*.1667).rgb+texture2D(tColor,uv+dir*.1667).rgb);return mix(c,aa,.7);}
vec3 aces(vec3 c){return clamp(c*(2.51*c+.03)/(c*(2.43*c+.59)+.14),0.,1.);}
void main(){vec2 uv=vUv;float depth=texture2D(tDepth,uv).r;vec3 p=pos(uv);float z=-p.z;bool sky=depth>.99999;vec3 c=sampleAA(uv);vec3 n=normalize(cross(dFdx(p),dFdy(p)));if(dot(n,-p)<0.)n=-n;float occ=0.;
 if(!sky){float rad=clamp(.075/max(z,.1),.002,.065);for(int i=0;i<12;i++){float a=float(i)*2.39996+hash(floor(uv*resolution*.5))*6.283;vec2 off=vec2(cos(a),sin(a))*rad*(.3+.7*float(i)/12.);vec3 delta=pos(clamp(uv+off,vec2(.001),vec2(.999)))-p;float d=length(delta);occ+=max(0.,dot(n,delta/max(d,.0001))-.13)*(1.-smoothstep(.004,.10,d));}occ=clamp(occ*.12,0.,.32);c*=1.-occ;}
 float coc=sky?0.:clamp(abs(z-focus)/max(z,.08)*4.0,0.,3.5);if(coc>.3){vec3 b=vec3(0.);float count=0.;for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 q=uv+vec2(cos(a),sin(a))*coc/resolution;float dz=-pos(q).z;if(abs(dz-z)<max(.04,z*.15)){b+=texture2D(tColor,q).rgb;count+=1.;}}if(count>0.)c=mix(c,b/count*(1.-occ),.6);}
 vec3 bloom=vec3(0);for(int i=0;i<6;i++){float a=float(i)*1.0472;vec3 b=texture2D(tColor,uv+vec2(cos(a),sin(a))*5./resolution).rgb;bloom+=b*max(0.,lum(b)-1.3)/max(lum(b),.01);}c+=bloom*.018;
 c=pow(aces(c*1.10),vec3(1./2.2));c*=1.-smoothstep(.28,.85,length((uv-.5)*vec2(1.,.84)))*.13;c+=(hash(uv*resolution+vec2(floor(time*24.),17.))-.5)*grain;
 if(debugPass==1)c=vec3(1.-exp(-z*.6));if(debugPass==2)c=vec3(1.-occ);gl_FragColor=vec4(c,1.);}`;
export function createPost(renderer){
 const target=new T.WebGLRenderTarget(1,1,{type:renderer.extensions.has('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType,depthBuffer:true,minFilter:T.LinearFilter,magFilter:T.LinearFilter});target.samples=Math.min(4,renderer.capabilities.maxSamples||4);target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
 const uniforms={tColor:{value:target.texture},tDepth:{value:target.depthTexture},inverseProjection:{value:new T.Matrix4()},resolution:{value:new T.Vector2(1,1)},focus:{value:1},time:{value:0},grain:{value:.006},debugPass:{value:0}};
 const scene=new T.Scene(),camera=new T.Camera(),quad=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({uniforms,vertexShader:VERTEX,fragmentShader:FRAGMENT,depthTest:false,depthWrite:false}));scene.add(quad);
 return {uniforms,target,resize(w,h){target.setSize(w,h);uniforms.resolution.value.set(w,h);},draw(world,cam,t,config,pass=0){uniforms.inverseProjection.value.copy(cam.projectionMatrixInverse);uniforms.focus.value=world.focus;uniforms.time.value=t;uniforms.grain.value=config.grain*.018;uniforms.debugPass.value=pass;renderer.setRenderTarget(target);renderer.render(world.scene,cam);renderer.setRenderTarget(null);renderer.render(scene,camera);},dispose(){target.dispose();quad.geometry.dispose();quad.material.dispose();}};
}
