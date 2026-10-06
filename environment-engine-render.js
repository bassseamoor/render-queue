/* MOOR Environment Engine visual renderer.
 * Deterministic WebGL2 environment with Canvas2D fallback.
 */
(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.EnvironmentEngineRenderer=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

var VERT=[
'#version 300 es',
'precision highp float;',
'layout(location=0) in vec2 a_pos;',
'out vec2 v_uv;',
'void main(){v_uv=a_pos*.5+.5;gl_Position=vec4(a_pos,0.,1.);}'
].join('\n');

var FRAG=[
'#version 300 es',
'precision highp float;',
'in vec2 v_uv;',
'out vec4 outColor;',
'uniform vec2 u_resolution;',
'uniform float u_time;',
'uniform float u_seed;',
'uniform float u_motion;',
'uniform float u_atmo;',
'uniform float u_contrast;',
'uniform float u_bloom;',
'uniform float u_vignette;',
'uniform float u_profile;',
'float hash21(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
'float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x),f.y);}',
'float fbm(vec2 p){float s=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){s+=a*n2(p);p=m*p+.17;a*=.48;}return s;}',
'vec3 hsl2rgb(vec3 c){vec3 rgb=clamp(abs(mod(c.x*6.+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.);rgb=rgb*rgb*(3.-2.*rgb);return c.z+c.y*(rgb-.5)*(1.-abs(2.*c.z-1.));}',
'vec3 grade(vec3 c,float contrast){c=1.-exp(-c*1.2);c=(c-.5)*contrast+.5;c=pow(max(c,0.),vec3(.94));return c;}',
'float mountain(vec2 p,float z){float x=p.x*(1.15+z*.55);float f=fbm(vec2(x*1.15+u_seed*.01+z*7.7,z*13.1));f+=.26*sin(x*(2.1+z)+z*5.3+u_seed*.021);float top=-.02+z*.125+(f-.5)*(.19+.055*z);return smoothstep(.012,-.012,p.y-top);}',
'float sparkle(vec2 uv,float scale,float t){vec2 id=floor(uv*scale),q=fract(uv*scale)-.5;float h=hash21(id+u_seed);float pulse=.45+.55*sin(t*(.35+h*.9)+h*6.283);float d=length(q);return smoothstep(.055,.0,d)*step(.91,h)*pulse;}',
'void main(){',
' vec2 uv=v_uv;vec2 p=uv*2.-1.;p.x*=u_resolution.x/max(u_resolution.y,1.);float t=u_time*u_motion;float seed=fract(u_seed*.000001);',
' float hue=fract(seed*.73+.53);vec3 skyA=hsl2rgb(vec3(hue,.56,.12));vec3 skyB=hsl2rgb(vec3(fract(hue+.10),.58,.36));vec3 accent=hsl2rgb(vec3(fract(hue+.52),.72,.63));',
' float horizon=-.08+.015*sin(t*.07+seed*8.);float sy=clamp((p.y-horizon)*.64+.4,0.,1.);vec3 col=mix(skyB,skyA,pow(sy,.82));',
' float sunX=.48*sin(seed*8.3+1.2);float sunY=.34+.08*cos(seed*5.1);float sd=length(p-vec2(sunX,sunY));float halo=exp(-sd*5.5)*(.32+u_bloom*1.5);col+=accent*halo;col+=accent*exp(-sd*42.)*1.7;',
' float cloud=fbm(vec2(p.x*.5+t*.006,p.y*.72+seed*3.1));cloud=smoothstep(.58,.82,cloud)*smoothstep(-.2,.35,p.y);col=mix(col,col+vec3(.18,.22,.28),cloud*.18*u_atmo);',
' float star=sparkle(vec2(p.x*.5+.5,p.y*.5+.5),52.,t);col+=vec3(.62,.78,1.)*star*.55*smoothstep(.05,.6,p.y);',
' vec3 farC=mix(skyB,skyA,.42)*.43;vec3 nearC=mix(farC,accent,.11)*.38;float occ=0.;',
' for(int i=0;i<8;i++){float fi=float(i)/7.;float mask=mountain(vec2(p.x,p.y-horizon),fi);float fog=fi*(.72*u_atmo);vec3 mc=mix(nearC,farC,fog);mc*=.48+.42*(1.-fi);float edge=max(mask-occ,0.);col=mix(col,mc,edge);occ=max(occ,mask);}',
' float water=smoothstep(.02,-.02,p.y-horizon-.23);',
' if(water>.001){float wy=abs(p.y-horizon-.23);float wave=sin(p.x*14.+t*.17)+sin(p.x*31.-t*.11+seed*9.);wave+=fbm(vec2(p.x*3.+t*.01,wy*8.))*2.-1.;vec3 refl=mix(skyA,skyB,.55)+accent*(.07+.04*wave);float glint=pow(max(0.,1.-abs(p.x-sunX+wave*.008)*7.),5.)*exp(-wy*3.8);refl+=accent*glint*(.35+u_bloom);float depthFade=exp(-wy*2.2);col=mix(col,refl*mix(.28,.72,depthFade),water*.74);col+=accent*.025*water*sin((wy*70.)+wave*1.8);}',
' float dust=0.;vec2 dv=vec2(p.x*.44+.5,p.y*.44+.5);for(int i=0;i<3;i++){float fi=float(i);vec2 q=dv*vec2(38.+fi*13.,22.+fi*9.);q.y+=t*(.006+.005*fi);vec2 id=floor(q),f=fract(q)-.5;float h=hash21(id+u_seed+fi*17.);float d=length(f+vec2(sin(t*.03+h*9.)*.16,0.));dust+=smoothstep(.045,.0,d)*step(.94,h);}col+=accent*dust*(.12+.18*u_atmo);',
' float fogBand=exp(-abs(p.y-horizon)*5.4)*u_atmo;col=mix(col,mix(skyB,accent,.12),fogBand*.12);',
' float vign=1.-u_vignette*smoothstep(.42,1.35,length(p*vec2(.72,1.)));col*=vign;float grain=(hash21(gl_FragCoord.xy+floor(u_time*24.))-.5)*.012;col=grade(col+grain,u_contrast);',
' if(u_profile>.5&&u_profile<1.5){float grid=(smoothstep(.985,1.,fract(uv.x*18.))+smoothstep(.985,1.,fract(uv.y*10.)))*.018;col+=accent*grid;}',
' if(u_profile>2.5){col+=accent*pow(max(0.,halo),2.)*.35;}',
' outColor=vec4(col,1.);',
'}'
].join('\n');

function shader(gl,type,src){
  var s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){var log=gl.getShaderInfoLog(s)||'shader compile failed';gl.deleteShader(s);throw new Error(log);}
  return s;
}
function makeProgram(gl){
  var vs=shader(gl,gl.VERTEX_SHADER,VERT),fs=shader(gl,gl.FRAGMENT_SHADER,FRAG);
  var p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){var log=gl.getProgramInfoLog(p)||'program link failed';gl.deleteProgram(p);throw new Error(log);}
  return p;
}
function profileIndex(id){return id==='workspace'?1:id==='world'?2:id==='showcase'?3:0;}
function fit(canvas){
  var r=canvas.getBoundingClientRect(),dpr=Math.min(2,(root.devicePixelRatio||1));
  var w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
}
function fallback(canvas,recipe,time){
  var ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;if(!ctx)return;
  var g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,recipe.palette.skyTop);g.addColorStop(1,recipe.palette.skyBottom);
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  var hor=h*recipe.composition.horizon;
  for(var layer=7;layer>=0;layer--){
    var z=layer/7,base=hor+h*(.05+z*.075),amp=h*(.035+.025*(1-z));
    ctx.beginPath();ctx.moveTo(0,h);
    for(var x=0;x<=w;x+=Math.max(6,w/100)){
      var y=base+Math.sin(x/w*7+z*4+recipe.seedHash*.001+time*.025)*amp+Math.sin(x/w*17+z*9)*amp*.33;
      ctx.lineTo(x,y);
    }
    ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle='rgba(7,18,28,'+(0.28+(.07*(7-layer)))+')';ctx.fill();
  }
}
function create(canvas,recipe,opts){
  opts=opts||{};if(!canvas)throw new Error('EnvironmentEngineRenderer requires a canvas.');
  var state={recipe:recipe,paused:false,disposed:false,start:(root.performance&&performance.now?performance.now():Date.now()),raf:0,gl:null,prog:null,vao:null,fallback:false};
  var queryOffset=0;try{queryOffset=Number(new URLSearchParams(root.location&&root.location.search||'').get('offset'))||0;}catch(e){}
  try{
    var gl=canvas.getContext('webgl2',{antialias:true,alpha:false,preserveDrawingBuffer:!!opts.preserveDrawingBuffer});
    if(!gl)throw new Error('WebGL2 unavailable');
    var p=makeProgram(gl),vao=gl.createVertexArray(),buf=gl.createBuffer();
    gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
    state.gl=gl;state.prog=p;state.vao=vao;
  }catch(e){state.fallback=true;}
  function setRecipe(next){state.recipe=next||state.recipe;}
  function fixedTime(now){
    var rm=root.__renderMode;
    if(rm&&typeof rm.frame==='number'&&typeof rm.fps==='number'&&rm.fps>0)return queryOffset+rm.frame/rm.fps;
    return queryOffset+(now-state.start)/1000;
  }
  function paintAt(seconds){
    fit(canvas);var r=state.recipe;
    if(state.fallback){fallback(canvas,r,seconds);return;}
    var gl=state.gl,p=state.prog;
    gl.viewport(0,0,canvas.width,canvas.height);gl.useProgram(p);gl.bindVertexArray(state.vao);
    function f(n,v){var l=gl.getUniformLocation(p,n);if(l!==null)gl.uniform1f(l,v);}
    var lr=gl.getUniformLocation(p,'u_resolution');if(lr!==null)gl.uniform2f(lr,canvas.width,canvas.height);
    f('u_time',seconds);f('u_seed',r.seedHash);f('u_motion',r.motion.intensity);f('u_atmo',r.atmosphere.density);
    f('u_contrast',r.post.contrast);f('u_bloom',r.post.bloom);f('u_vignette',r.post.vignette);f('u_profile',profileIndex(r.profile.id));
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function tick(now){
    if(state.disposed)return;
    var rm=root.__renderMode;
    if(!state.paused&&!(rm&&rm.paused))paintAt(fixedTime(now));
    state.raf=root.requestAnimationFrame(tick);
  }
  function pause(v){state.paused=v==null?!state.paused:!!v;return state.paused;}
  function dispose(){state.disposed=true;if(state.raf)root.cancelAnimationFrame(state.raf);if(state.gl){try{state.gl.deleteProgram(state.prog);state.gl.deleteVertexArray(state.vao);}catch(e){}}}
  function reset(){state.start=(root.performance&&performance.now?performance.now():Date.now());paintAt(queryOffset);}
  var reduce=false;try{reduce=!!root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  if(reduce)state.paused=true;
  paintAt(queryOffset);if(root.requestAnimationFrame)state.raf=root.requestAnimationFrame(tick);
  root.__renderCanvas=canvas;root.__renderReset=reset;
  return {paintAt:paintAt,setRecipe:setRecipe,pause:pause,dispose:dispose,reset:reset,state:state};
}
return Object.freeze({create:create,vertexSource:VERT,fragmentSource:FRAG});
});
