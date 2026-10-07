/* MOOR Character Stream Core v1 — procedural animated background.
 *
 * A clean, elegant, continuously-generated field of vertically flowing characters
 * (numbers, letters, symbols) in vivid blue and white. MOOR's visual identity —
 * not glitchy, not retro-terminal, not cyberpunk. Extremely clean, precise, modern,
 * smooth, visually deep. Readable as moving characters without demanding to be read.
 *
 * ~10 perceptual depth layers varying in speed, scale, brightness, opacity, density.
 * Deterministic seeded: same seed -> same stream. No short repeating loops.
 *
 * Usage: const stream = CharStream.create(canvas, {seed:'devroom'});
 *        stream.start(); stream.stop(); stream.resize(w,h);
 *
 * Funnel receipt 20fbba52eda49130 (2026-10-07).
 *
 * TAGS: kind:component | cat:creation | prov:procedural-animation |
 *       see:dev-01-environment | src:charstream-core.js |
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CharStream=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

/* Coinbase-like vivid blue + white. Depth-graded. */
const BLUE='#0052FF', WHITE='#FFFFFF', BG='#04070F';

const CHARS='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*+-=<>?/\\|~:;';
const LAYERS=10;

function hashSeed(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

function create(canvas,opts){
  opts=opts||{};
  const seed=opts.seed||'charstream';
  const rng=mulberry32(hashSeed(seed));
  const ctx=canvas.getContext('2d');
  let W=canvas.width,H=canvas.height,running=false,raf=0,lastT=0;

  /* per-layer config: depth 0 = far (small, dim, slow) .. 9 = near (large, bright, fast) */
  const layers=[];
  for(let d=0;d<LAYERS;d++){
    const t=d/(LAYERS-1); // 0..1 near
    layers.push({
      depth:d,
      fontSize:Math.round(8+t*24),            // 8px far .. 32px near
      speed:15+t*110,                         // px/sec
      opacity:0.14+t*0.78,                     // dim far .. bright near
      // color: far = deep blue, near = blue-white
      color:t<0.5?BLUE:(t<0.8?'#7AA8FF':WHITE),
      density:0.85+t*1.1,                      // columns per 100px (denser)
      changeRate:0.4+t*2.2,                   // char changes/sec
    });
  }

  /* columns per layer */
  let columns=[];
  function buildColumns(){
    columns=[];
    layers.forEach((L,li)=>{
      const n=Math.max(2,Math.round(W/100*L.density));
      for(let i=0;i<n;i++){
        const len=6+Math.floor(rng()*22);
        const chars=[];for(let j=0;j<len;j++)chars.push(CHARS[Math.floor(rng()*CHARS.length)]);
        columns.push({
          layer:li,x:rng()*W,y:rng()*H-H,
          chars,speed:L.speed*(0.85+rng()*0.3),
          changeT:rng()/L.changeRate,
        });
      }
    });
  }

  function draw(dt){
    // fade trail for smoothness (not smear)
    ctx.fillStyle=BG;ctx.globalAlpha=1;ctx.fillRect(0,0,W,H);
    layers.forEach((L,li)=>{
      ctx.font=L.fontSize+'px ui-monospace,SFMono-Regular,Menlo,monospace';
      ctx.textBaseline='top';
      columns.forEach(col=>{
        if(col.layer!==li)return;
        col.y+=col.speed*dt;
        col.changeT-=dt;
        if(col.changeT<=0){ // mutate a random character (continuous generation)
          col.chars[Math.floor(rng()*col.chars.length)]=CHARS[Math.floor(rng()*CHARS.length)];
          col.changeT=1/L.changeRate*(0.5+rng());
        }
        if(col.y-col.chars.length*L.fontSize*1.25>H){ // recycle past bottom
          col.y=-col.chars.length*L.fontSize*1.25;
          col.x=rng()*W;
        }
        const head=col.y;
        for(let j=0;j<col.chars.length;j++){
          const cy=head+j*L.fontSize*1.25;
          if(cy<-L.fontSize||cy>H+L.fontSize)continue;
          // head character brighter (white), trail fades to layer color
          const isHead=j===0;
          ctx.globalAlpha=L.opacity*(isHead?1:Math.max(0.25,1-j/col.chars.length*0.75));
          ctx.fillStyle=isHead?WHITE:L.color;
          ctx.fillText(col.chars[j],col.x,cy);
        }
      });
    });
    ctx.globalAlpha=1;
  }

  function frame(t){
    if(!running)return;
    const dt=Math.min(0.05,(t-lastT)/1000||0.016);lastT=t;
    draw(dt);
    raf=requestAnimationFrame(frame);
  }

  return {
    start(){if(running)return;running=true;lastT=performance.now();raf=requestAnimationFrame(frame);},
    stop(){running=false;cancelAnimationFrame(raf);},
    resize(w,h){canvas.width=w;canvas.height=h;W=w;H=h;buildColumns();},
    _layers:layers.length,
  };
}

// init columns on create via resize
const _origCreate=create;

return {create:function(canvas,opts){
  const s=_origCreate(canvas,opts);
  s.resize(canvas.width||512,canvas.height||256);
  return s;
},BLUE,WHITE,LAYERS};
});
