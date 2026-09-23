// Original procedural score and foley. Absolute-time synthesis keeps seeks/exports identical.
const RATE=48000,TAU=Math.PI*2;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const notes=[196,246.94,293.66,392,440,493.88,587.33,659.25];
function noise(x){const a=Math.sin(x*127.1+311.7)*43758.5453;return(a-Math.floor(a))*2-1;}
export function sample(t){
 const beat=Math.floor(t/.625),age=t-beat*.625,minor=t>=32&&t<53,late=t>=54,n=notes[[0,2,3,1,4,2,5,3][beat%8]]*(minor?.89:1);let v=0;
 const env=Math.exp(-age*4)*(1-Math.exp(-age*90));v+=(Math.sin(TAU*n*age)+.3*Math.sin(TAU*n*2*age)+.1*Math.sin(TAU*n*3.005*age))*env*(minor?.019:.027);
 const chord=[130.81,164.81,196][Math.floor(t/5)%3]*(minor?.89:1),pad=(Math.sin(TAU*chord*t)+Math.sin(TAU*chord*1.5*t)+Math.sin(TAU*chord*2*t))*.006;v+=pad*(.6+.4*Math.sin(t*.3)**2);
 if(t<9)v+=noise(Math.floor(t*1700))*.009*(.5+.5*Math.sin(t*.7)**2);
 if(t>=9&&t<17||t>=66&&t<72)v+=(Math.sin(t*TAU*49)+noise(Math.floor(t*700)))*.006;
 if(t>=17&&t<37||t>=44&&t<58)v+=(Math.sin(t*TAU*67)+Math.sin(t*TAU*103)+noise(Math.floor(t*2100)))*.0035;
 for(const hit of [5.8,9.7,34.6,54.5,64,76.3,79]){const a=t-hit;if(a>=0&&a<.28)v+=noise(Math.floor(a*12000))*Math.exp(-a*20)*.035;}
 if(t>=81)v+=noise(Math.floor(t*600))*.002;
 return Math.tanh(v*3.2)*smooth(t/1.2)*smooth((90-t)/1.4);
}
export function pcm(start,seconds,rate=RATE){const data=new Float32Array(Math.round(seconds*rate));for(let i=0;i<data.length;i++)data[i]=sample(start+i/rate);return data;}
export function wav(start=0,seconds=90){const data=pcm(start,seconds),buffer=new ArrayBuffer(44+data.length*2),v=new DataView(buffer);const str=(o,s)=>[...s].forEach((c,i)=>v.setUint8(o+i,c.charCodeAt(0)));str(0,'RIFF');v.setUint32(4,buffer.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,RATE,true);v.setUint32(28,RATE*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);str(36,'data');v.setUint32(40,data.length*2,true);for(let i=0;i<data.length;i++)v.setInt16(44+i*2,Math.max(-32768,Math.min(32767,data[i]*32767)),true);return buffer;}
export class Score {
 constructor(){this.context=null;this.source=null;this.buffer=null;}
 async play(t){this.stop();if(!this.context)this.context=new AudioContext();await this.context.resume();if(!this.buffer){this.buffer=this.context.createBuffer(1,RATE*90,RATE);this.buffer.copyToChannel(pcm(0,90),0);}this.source=this.context.createBufferSource();this.source.buffer=this.buffer;this.source.connect(this.context.destination);this.source.start(0,Math.min(t,89.999));}
 stop(){try{this.source?.stop();}catch{}this.source=null;}
}
