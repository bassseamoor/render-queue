// Fireplace Studio — renderer/shaders/life.js. See README.md for ownership and replacement boundaries.


const LIFE_VS = `#version 300 es
layout(location=0) in vec2 aQuad;
layout(location=1) in vec4 aP;
layout(location=2) in vec4 aD;
layout(location=3) in vec4 aC;
uniform mat4 uProj; uniform mat4 uView; uniform float uTime;
out vec2 vUv; out float vType; out float vPhase; out float vAlpha; out float vAux; out vec3 vCol;
void main(){
  vUv=aQuad; vType=aD.x; vPhase=aD.y; vAlpha=aD.z; vAux=aD.w; vCol=aC.rgb;
  vec3 right=vec3(uView[0][0],uView[1][0],uView[2][0]);
  vec3 up=vec3(uView[0][1],uView[1][1],uView[2][1]);
  float sz=aP.w; vec3 wp;
  if(aC.a>0.5){
    float h01=aQuad.y*0.5+0.5;
    float sway=sin(uTime*1.35+aD.y*17.0)*h01*h01*0.20*sz;
    wp=vec3(aP.x,aP.y,aP.z)+vec3(0.0,1.0,0.0)*h01*sz+right*(aQuad.x*sz*0.10+sway);
  } else {
    wp=vec3(aP.x,aP.y,aP.z)+(right*aQuad.x+up*aQuad.y)*sz;
  }
  gl_Position=uProj*uView*vec4(wp,1.0);
}`;
const LIFE_FS = `#version 300 es
precision highp float;
in vec2 vUv; in float vType; in float vPhase; in float vAlpha; in float vAux; in vec3 vCol;
out vec4 oC;
void main(){
  vec2 p=vUv; float r=length(p); float a=0.0; vec3 col=vCol;
  if(vType<0.5){
    float flap=sin(vPhase*9.0)*0.75;
    vec2 q=vec2(p.x,p.y+abs(p.x)*flap*0.8);
    float wing=smoothstep(0.20,0.03,abs(q.y))*smoothstep(1.0,0.55,abs(q.x));
    float body=smoothstep(0.10,0.03,length(q*vec2(2.6,1.2)));
    a=max(wing,body);
  } else if(vType<1.5){
    float flap=sin(vPhase*2.6)*0.5;
    vec2 q=vec2(p.x,p.y+abs(p.x)*flap*0.5);
    float wing=smoothstep(0.26,0.04,abs(q.y))*smoothstep(1.0,0.40,abs(q.x));
    float body=smoothstep(0.12,0.04,length(q*vec2(2.2,1.0)));
    a=max(wing,body);
  } else if(vType<2.5){
    float flap=sin(vPhase*14.0)*0.9;
    vec2 q=vec2(p.x,p.y+abs(p.x)*flap);
    float wing=smoothstep(0.16,0.02,abs(q.y))*smoothstep(1.0,0.6,abs(q.x));
    float fork=smoothstep(0.05,0.02,abs(abs(q.x)-0.85))*step(0.7,abs(q.x))*smoothstep(0.25,0.05,abs(q.y+0.1));
    a=max(max(wing,fork),smoothstep(0.08,0.02,length(q*vec2(2.4,1.2))));
  } else if(vType<3.5){
    float flap=sin(vPhase*16.0)*0.9;
    vec2 q=vec2(p.x,p.y+abs(p.x)*flap*0.9);
    a=smoothstep(0.18,0.03,abs(q.y))*smoothstep(1.0,0.5,abs(q.x));
    a=max(a,smoothstep(0.09,0.03,length(q*vec2(2.2,1.1))));
  } else if(vType<4.5){
    float legs=smoothstep(0.035,0.015,abs(p.x-0.06))*step(p.y,-0.25)*step(-1.0,p.y)
             + smoothstep(0.035,0.015,abs(p.x+0.10))*step(p.y,-0.25)*step(-1.0,p.y);
    float body=smoothstep(0.42,0.30,length((p-vec2(0.0,0.05))*vec2(1.5,2.2)));
    float strike=clamp(1.0-abs(vAux-0.5)*6.0,0.0,1.0);
    float hy=0.72-0.55*strike;
    float neck=smoothstep(0.09,0.045,length((p-vec2(0.28,0.55-0.30*strike))*vec2(1.4,1.0)));
    float head=smoothstep(0.14,0.09,length(p-vec2(0.34,hy)));
    float bill=smoothstep(0.045,0.02,abs(p.y-hy))*step(0.34,p.x)*step(p.x,0.66);
    a=max(max(legs,body),max(neck,max(head,bill)));
  } else if(vType<5.5){
    float body=smoothstep(0.45,0.32,length((p-vec2(-0.05,0.0))*vec2(1.6,2.4)));
    float head=smoothstep(0.20,0.13,length(p-vec2(0.38,0.28)));
    float bill=smoothstep(0.05,0.02,length((p-vec2(0.56,0.26))*vec2(1.0,2.0)));
    float wake=smoothstep(0.06,0.01,abs(p.y+0.28))*step(p.x,-0.5)*step(-1.0,p.x)*0.5;
    a=max(max(body,head),max(bill,wake));
  } else if(vType<6.5){
    float t=clamp(vAux,0.0,1.0);
    vec2 q=vec2(p.x*cos(t*2.0)-0.3*t,p.y);
    float body=smoothstep(0.30,0.12,length(q*vec2(2.0,1.1)));
    float tail=smoothstep(0.06,0.02,abs(q.y))*step(-0.75,q.x)*step(q.x,-0.30);
    a=max(body,tail);
  } else if(vType<7.5){
    float R=clamp(vAux,0.02,0.98);
    float ring=smoothstep(0.09,0.02,abs(r-R));
    a=ring*(1.0-R)*0.9;
  } else if(vType<8.5){
    float t=clamp(vAux,0.0,1.0);
    float d=0.0;
    for(int i=0;i<6;i++){
      float fi=float(i);
      vec2 o=vec2(sin(fi*2.39+1.7),cos(fi*3.11+0.6))*(0.15+0.55*t);
      d=max(d,smoothstep(0.10,0.03,length(p-o-vec2(0.0,0.25*t))));
    }
    a=d*(1.0-t*0.6);
  } else if(vType<9.5){
    vec2 bp=p-vec2(0.0,0.10);
    float body=smoothstep(0.50,0.40,length(bp*vec2(1.35,1.9)));
    float legs=smoothstep(0.045,0.02,abs(bp.x+0.28))*step(bp.y,-0.35)*step(-1.0,bp.y)
             + smoothstep(0.045,0.02,abs(bp.x-0.28))*step(bp.y,-0.35)*step(-1.0,bp.y);
    float bob=vAux;
    float neck=smoothstep(0.11,0.05,length((p-vec2(0.38,0.55+0.25*bob))*vec2(1.2,2.4)));
    float head=smoothstep(0.15,0.10,length(p-vec2(0.44,0.80+0.30*bob)));
    a=max(max(body,legs),max(neck,head));
  } else if(vType<10.5){
    float tuft=smoothstep(0.06,0.02,length((p-vec2(-0.16,0.52))*vec2(1.0,1.6)))
              +smoothstep(0.06,0.02,length((p-vec2(0.16,0.52))*vec2(1.0,1.6)));
    float body=smoothstep(0.55,0.42,length((p-vec2(0.0,0.0))*vec2(1.5,1.15)));
    vec2 eo=vec2(vAux*0.08,0.0);
    float eyes=smoothstep(0.075,0.04,length(p-vec2(-0.14,0.22)-eo))
              +smoothstep(0.075,0.04,length(p-vec2(0.14,0.22)-eo));
    a=max(max(tuft,body),eyes*0.9);
    col=mix(col,vec3(1.0,0.85,0.4),eyes*0.55);
  } else if(vType<11.5){
    float tw=0.35+0.65*pow(0.5+0.5*sin(vPhase*3.1),2.0);
    a=pow(smoothstep(0.55,0.0,r),2.0)*tw;
    col=vec3(0.75,1.0,0.35)*(1.2+0.8*tw);
  } else if(vType<12.5){
    float head=smoothstep(0.10,0.02,length(p-vec2(0.75,0.0)));
    float tail=smoothstep(0.06,0.0,abs(p.y))*smoothstep(0.75,-1.0,p.x);
    a=max(head*1.4,tail*0.8);
    col=vec3(0.9,0.95,1.0);
  } else if(vType<13.5){
    float flap=sin(vPhase*18.0);
    vec2 q=vec2(p.x*(0.35+0.65*abs(flap)),p.y);
    float wing=smoothstep(0.5,0.15,length((q-vec2(-0.25,0.05))*vec2(1.0,1.5)))
              +smoothstep(0.5,0.15,length((q-vec2(0.25,0.05))*vec2(1.0,1.5)));
    a=max(wing,smoothstep(0.08,0.03,length(q*vec2(1.0,3.0))));
  } else if(vType<14.5){
    float wing=smoothstep(0.05,0.015,abs(p.y))*smoothstep(1.0,0.3,abs(p.x));
    float body=smoothstep(0.05,0.02,length(p*vec2(3.0,1.0)));
    a=max(wing*0.7,body);
  } else if(vType<15.5){
    float dot_=smoothstep(0.08,0.03,r);
    float R=clamp(vAux,0.05,0.9);
    float ring=smoothstep(0.05,0.015,abs(r-R*0.5))*(1.0-R)*0.7;
    a=max(dot_,ring);
  } else if(vType<16.5){
    float tumble=vPhase*2.0;
    vec2 q=mat2(cos(tumble),-sin(tumble),sin(tumble),cos(tumble))*p;
    a=smoothstep(0.35,0.12,length(q*vec2(1.0,1.9)));
  } else if(vType<17.5){
    vec2 q=p*vec2(0.45,1.4);
    float n=sin(q.x*3.0+vPhase)*sin(q.y*2.0-vPhase*0.7);
    a=pow(smoothstep(1.0,0.0,length(q)),1.6)*(0.75+0.25*n);
  } else if(vType<18.5){
    float R=clamp(vAux,0.03,0.95);
    a=smoothstep(0.10,0.02,abs(r-R))*(1.0-R);
  } else if(vType<19.5){
    vec2 q=p*vec2(0.5,1.1);
    float n=sin(q.x*2.2+vPhase*0.4)*sin(q.y*3.1-vPhase*0.23);
    a=pow(smoothstep(1.0,0.0,length(q)),1.8)*(0.8+0.2*n);
  } else if(vType<20.5){
    a=smoothstep(1.0,0.15,length(p*vec2(0.30,2.4)))*0.55;
  } else if(vType<21.5){
    float blade=smoothstep(0.55,0.12,abs(p.x*2.6))*(1.0-abs(p.y)*0.75);
    a=blade;
    col=mix(vec3(0.16,0.20,0.10),vec3(0.35,0.32,0.16),p.y*0.5+0.5);
  } else if(vType<22.5){
    float stem=smoothstep(0.5,0.15,abs(p.x*3.2))*(1.0-abs(p.y)*0.6);
    float head=smoothstep(0.30,0.18,length((p-vec2(0.0,0.45))*vec2(2.2,1.1)));
    a=max(stem,head);
    col=mix(vec3(0.18,0.22,0.11),vec3(0.30,0.20,0.10),clamp(head*2.0,0.0,1.0));
  } else if(vType<23.5){
    float streak=smoothstep(0.35,0.08,abs(p.x))*(0.55+0.45*sin(p.y*36.0+vPhase*7.0));
    a=streak*smoothstep(1.0,0.7,abs(p.y));
    col=vec3(0.75,0.85,0.92);
  } else if(vType<24.5){
    float dart=smoothstep(0.09,0.02,length(p*vec2(2.4,1.2)));
    float wing=smoothstep(0.05,0.015,abs(p.y+abs(p.x)*0.7*sin(vPhase*22.0)))*smoothstep(1.0,0.6,abs(p.x));
    a=max(dart,wing*0.8);
    col=vec3(0.15,0.45,0.75);
  } else if(vType<25.5){
    float body=smoothstep(0.42,0.28,length((p-vec2(-0.1,0.0))*vec2(1.7,2.6)));
    float tail=smoothstep(0.10,0.04,length((p-vec2(-0.62,-0.05))*vec2(1.0,2.2)));
    a=max(body,tail);
  } else if(vType<26.5){
    float v=smoothstep(0.10,0.02,abs(abs(p.y)-(-p.x)*0.35-0.1))*step(p.x,0.2);
    a=v*0.6;
  } else if(vType<27.5){
    float body=smoothstep(0.45,0.32,length((p-vec2(-0.02,0.02))*vec2(1.5,2.3)));
    float head=smoothstep(0.18,0.12,length(p-vec2(0.42,0.30)));
    float bill=smoothstep(0.05,0.02,length((p-vec2(0.60,0.28))*vec2(1.0,2.4)));
    a=max(max(body,head),bill);
    col=mix(col,vec3(0.85,0.87,0.88),smoothstep(0.2,0.1,length(p-vec2(0.30,0.18)))*0.5);
  } else {
    float trunk=smoothstep(0.5,0.2,abs(p.x*3.0))*smoothstep(1.0,0.9,abs(p.y));
    float jag=smoothstep(0.4,0.15,abs(p.x*3.0+sin(p.y*9.0)*0.3))*step(0.75,p.y);
    a=max(trunk,jag*0.8);
    col=vec3(0.10,0.09,0.08);
  }
  oC=vec4(col,a*vAlpha);
  if(oC.a<0.004) discard;
}`;

export { LIFE_FS, LIFE_VS };
