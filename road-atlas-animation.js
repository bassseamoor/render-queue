/* Road Atlas animation 1.0.0 — the living-city layer.
 * Purely additive: never edits the baseline or any guarded module. It wraps
 * `regenerate` (to rebuild per-seed animation data) and `drawKenBurns` (to
 * composite animation into fixed-step video renders) at runtime, and owns the
 * interactive repaint loop (the baseline loop paints nothing per-frame).
 *
 * Everything is a pure function of (seed, frameIndex), so ?render=1 exports
 * stay pixel-deterministic: traffic, boats, trains, clouds, window lights,
 * water glints, and a full day/night cycle.
 */
var RoadAtlasAnimation=(function(){
'use strict';
var VERSION='1.0.0';

/* ---------- deterministic RNG ---------- */
function xmur3(str){var h=1779033703^str.length;for(var i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);return (h^=h>>>16)>>>0;};}
function sfc32(a,b,c,d){return function(){a>>>=0;b>>>=0;c>>>=0;d>>>=0;var t=(a+b|0)+d|0;d=d+1|0;a=b^b>>>9;b=c+c<<3;c=c<<21|c>>>11;c=c+t|0;return (t>>>0)/4294967296;};}
function rngFromSeed(s){var f=xmur3(String(s));return sfc32(f(),f(),f(),f());}

/* ---------- state ---------- */
var enabled=true;
var animCanvas=null;
var cars=[],boats=[],trains=[],lights=[],clouds=[],glints=[];
var sprites=null;

/* ---------- sprites (prerendered once) ---------- */
function radialDot(core,r,glow,glowColor){
  var pad=Math.ceil(glow), sz=(r+pad)*2;
  var c=document.createElement('canvas');c.width=c.height=sz;
  var x=c.getContext('2d');
  var g=x.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);
  g.addColorStop(0,core);g.addColorStop(r/sz,core);
  g.addColorStop((r+glow*0.4)/sz,glowColor);g.addColorStop(1,'rgba(0,0,0,0)');
  x.fillStyle=g;x.fillRect(0,0,sz,sz);
  return {c:c,half:sz/2};
}
function buildSprites(){
  if(sprites)return sprites;
  sprites={
    carW:radialDot('#fffbe8',2,7,'rgba(255,244,200,.55)'),
    carR:radialDot('#ffd9d2',2,7,'rgba(255,70,50,.55)'),
    lamp:radialDot('#ffe6b0',2.4,9,'rgba(255,180,90,.5)'),
    boat:radialDot('#ffffff',2,6,'rgba(220,240,255,.5)'),
    glint:(function(){
      var c=document.createElement('canvas');c.width=18;c.height=8;
      var x=c.getContext('2d');
      var g=x.createRadialGradient(9,4,0,9,4,9);
      g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');
      x.fillStyle=g;
      x.save();x.translate(9,4);x.scale(1,0.42);x.translate(-9,-4);
      x.fillRect(0,0,18,8);x.restore();
      return {c:c,half:9};
    })(),
    clouds:[0.7,1.0,1.4].map(function(k){
      var w=Math.round(300*k),h=Math.round(170*k);
      var c=document.createElement('canvas');c.width=w;c.height=h;
      var x=c.getContext('2d');
      var blobs=[[0.35,0.55,0.30],[0.55,0.45,0.36],[0.72,0.58,0.28],[0.5,0.62,0.30]];
      blobs.forEach(function(b){
        var g=x.createRadialGradient(w*b[0],h*b[1],0,w*b[0],h*b[1],w*b[2]);
        g.addColorStop(0,'rgba(255,255,255,.5)');g.addColorStop(1,'rgba(255,255,255,0)');
        x.fillStyle=g;x.fillRect(0,0,w,h);
      });
      return {c:c,w:w,h:h};
    })
  };
  return sprites;
}

/* ---------- path helpers ---------- */
function prepPath(pts){
  var cum=[0],total=0;
  for(var i=1;i<pts.length;i++){
    var dx=pts[i].x-pts[i-1].x,dy=pts[i].y-pts[i-1].y;
    total+=Math.sqrt(dx*dx+dy*dy);cum.push(total);
  }
  return {cum:cum,total:total};
}
function pointAt(pts,prep,s){
  var d=s*prep.total,cum=prep.cum,lo=0,hi=cum.length-1;
  while(lo<hi){var mid=(lo+hi)>>1;if(cum[mid]<d)lo=mid+1;else hi=mid;}
  var i=Math.max(1,lo),c0=cum[i-1],c1=cum[i];
  var f=c1>c0?(d-c0)/(c1-c0):0;
  var ax=pts[i-1].x,ay=pts[i-1].y;
  return {x:ax+(pts[i].x-ax)*f,y:ay+(pts[i].y-ay)*f,
          ang:Math.atan2(pts[i].y-ay,pts[i].x-ax)};
}

/* ---------- day/night cycle ---------- */
/* stops: [t, r,g,b, alpha, lightLevel] */
var TODS=[
  [0.00,255,179,107,0.10,0.55],
  [0.07,255,255,255,0.00,0.00],
  [0.32,255,255,255,0.00,0.00],
  [0.44,255,154,77, 0.13,0.04],
  [0.52,255,122,61, 0.20,0.35],
  [0.60,26,35,80,    0.40,1.00],
  [0.86,26,35,80,    0.40,1.00],
  [0.93,255,179,107, 0.12,0.55],
  [1.00,255,179,107, 0.10,0.55]
];
function todSample(t){
  var a=TODS[0],b=TODS[TODS.length-1];
  for(var i=0;i<TODS.length-1;i++){
    if(t>=TODS[i][0]&&t<=TODS[i+1][0]){a=TODS[i];b=TODS[i+1];break;}
  }
  var f=(b[0]>a[0])?(t-a[0])/(b[0]-a[0]):0;
  return {r:Math.round(a[1]+(b[1]-a[1])*f),g:Math.round(a[2]+(b[2]-a[2])*f),
          b:Math.round(a[3]+(b[3]-a[3])*f),a:a[4]+(b[4]-a[4])*f,
          light:a[5]+(b[5]-a[5])*f};
}
function frameInfo(){
  var RM=window.__renderMode,now=(typeof performance!=='undefined'?performance.now():Date.now());
  if(RM&&(RM.phase==='record'||RM.phase==='warmup'))
    return {frame:RM.frame,fps:RM.fps||30,render:true,nowMs:now};
  return {frame:Math.floor(now/33.333),fps:30,render:false,nowMs:now};
}
function timeOfDay(fi){
  if(fi.render)return (fi.frame/(fi.fps*720))%1;   /* one full day per 12 min of video */
  return (fi.nowMs/90000)%1;                        /* one full day per 90 s on screen */
}

/* ---------- per-seed animation data ---------- */
function shuffled(arr,rng){
  for(var i=arr.length-1;i>0;i--){var j=Math.floor(rng()*(i+1));var t=arr[i];arr[i]=arr[j];arr[j]=t;}
  return arr;
}
function rebuild(W){
  cars=[];boats=[];trains=[];lights=[];clouds=[];glints=[];
  if(!W)return;
  buildSprites();
  var rng=rngFromSeed((W.seed||'x')+'|anim-v1');
  var WW=window.WORLD_W||1600,WH=window.WORLD_H||1000;

  /* traffic on the road graph */
  var cand=shuffled((W.roads||[]).filter(function(r){return r.pts&&r.pts.length>8;}),rng);
  var budget=150;
  for(var i=0;i<cand.length&&budget>0;i++){
    var r=cand[i];
    var per=r.cls===2?3:(r.cls===1?2:1);
    if(!r._animPrep)r._animPrep=prepPath(r.pts);
    if(r._animPrep.total<60)continue;
    for(var k=0;k<per&&budget>0;k++,budget--){
      cars.push({road:r,off:rng(),dir:rng()<0.5?1:-1,
        speed:(r.cls===2?150:(r.cls===1?95:60))*(0.8+rng()*0.4)});
    }
  }
  /* boats on the river */
  var river=W.F&&W.F.river;
  if(river&&river.length>20){
    var rp=prepPath(river);
    for(var b=0;b<6;b++)boats.push({prep:rp,pts:river,off:rng(),dir:b%2?1:-1,speed:26+rng()*20});
  }
  /* trains on transit lines */
  var tls=W.layers&&W.layers.transit;
  if(tls)for(var ti=0;ti<tls.length;ti++){
    var tp=prepPath(tls[ti].pts);
    if(tp.total>200)trains.push({prep:tp,pts:tls[ti].pts,color:tls[ti].color||'#e5484d',off:rng(),dir:ti%2?1:-1,speed:170});
  }
  /* window lights on buildings */
  var blds=W.blocks&&W.blocks.buildings;
  if(blds){
    var order=shuffled(blds.slice(),rng),cap=900;
    for(var bi=0;bi<order.length&&cap>0;bi++){
      var bd=order[bi];
      var n=(bd.w*bd.h>9000)?3:((bd.w*bd.h>3200)?2:1);
      var ca=Math.cos(bd.ang||0),sa=Math.sin(bd.ang||0);
      for(var li=0;li<n&&cap>0;li++,cap--){
        var lx=(rng()-0.5)*bd.w*0.6,ly=(rng()-0.5)*bd.h*0.6;
        lights.push({x:bd.cx+lx*ca-ly*sa,y:bd.cy+lx*sa+ly*ca,phase:rng()*6.283});
      }
    }
  }
  /* drifting clouds */
  for(var ci=0;ci<9;ci++){
    clouds.push({x0:rng()*(WW+600),y:rng()*WH*0.9,sp:8+rng()*14,
      spr:Math.floor(rng()*3),alpha:0.5+rng()*0.5,phase:rng()*6.283});
  }
  /* water glints along the river + in lakes */
  if(river&&river.length>4){
    var acc=0;
    for(var gi=1;gi<river.length;gi++){
      var dx=river[gi].x-river[gi-1].x,dy=river[gi].y-river[gi-1].y;
      acc+=Math.sqrt(dx*dx+dy*dy);
      if(acc>34){acc=0;glints.push({x:river[gi].x,y:river[gi].y,phase:rng()*6.283});}
    }
  }
  var lakes=W.F&&W.F.lakes;
  if(lakes)for(var li2=0;li2<lakes.length;li2++){
    var L=lakes[li2];
    for(var g2=0;g2<4;g2++){
      var a2=rng()*6.283,rr=Math.sqrt(rng())*0.7;
      glints.push({x:L.x+Math.cos(a2)*L.rx*rr,y:L.y+Math.sin(a2)*L.ry*rr,phase:rng()*6.283});
    }
  }
}

/* ---------- paint one animation frame ---------- */
function paint(fi){
  var W=window.world;if(!W)return;
  var WW=window.WORLD_W||1600,WH=window.WORLD_H||1000;
  if(!animCanvas)animCanvas=document.createElement('canvas');
  if(animCanvas.width!==WW||animCanvas.height!==WH){animCanvas.width=WW;animCanvas.height=WH;}
  var ctx=animCanvas.getContext('2d');
  ctx.clearRect(0,0,WW,WH);
  var sp=buildSprites();
  var tod=todSample(timeOfDay(fi));
  var th=window.THEMES&&window.P?window.THEMES[Math.round(window.P.theme||0)]:null;
  var nightK=(th&&th.night)?0.35:1;

  /* 1. day/night tint */
  var ta=tod.a*nightK;
  if(ta>0.003){ctx.fillStyle='rgba('+tod.r+','+tod.g+','+tod.b+','+ta.toFixed(3)+')';ctx.fillRect(0,0,WW,WH);}

  /* 2. water glints (daytime) */
  var dayK=1-tod.light;
  if(dayK>0.02&&glints.length){
    for(var gi=0;gi<glints.length;gi++){
      var g=glints[gi];
      var tw=Math.pow(Math.max(0,Math.sin(fi.frame*0.09+g.phase)),3);
      var ga=tw*0.75*dayK;
      if(ga<0.03)continue;
      ctx.globalAlpha=ga;
      ctx.drawImage(sp.glint.c,g.x-9,g.y-4);
    }
    ctx.globalAlpha=1;
  }

  /* 3. window lights (night) */
  if(tod.light>0.02&&lights.length){
    ctx.globalCompositeOperation='lighter';
    for(var li=0;li<lights.length;li++){
      var L=lights[li];
      var la=tod.light*(0.72+0.28*Math.sin(fi.frame*0.06+L.phase));
      if(la<0.04)continue;
      ctx.globalAlpha=Math.min(1,la);
      ctx.drawImage(sp.lamp.c,L.x-sp.lamp.half,L.y-sp.lamp.half);
    }
    ctx.globalAlpha=1;
    ctx.globalCompositeOperation='source-over';
  }

  /* 4. traffic */
  var pxS=1/fi.fps;
  for(var ci=0;ci<cars.length;ci++){
    var car=cars[ci],prep=car.road._animPrep;
    var s=((car.off+car.dir*fi.frame*car.speed*pxS/prep.total)%1+1)%1;
    var p=pointAt(car.road.pts,prep,s);
    var spr=car.dir>0?sp.carW:sp.carR;
    ctx.drawImage(spr.c,p.x-spr.half,p.y-spr.half);
  }
  /* boats + wakes */
  for(var bi=0;bi<boats.length;bi++){
    var bt=boats[bi];
    var bs=((bt.off+bt.dir*fi.frame*bt.speed*pxS/bt.prep.total)%1+1)%1;
    var bp=pointAt(bt.pts,bt.prep,bs);
    ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.moveTo(bp.x,bp.y);
    ctx.lineTo(bp.x-Math.cos(bp.ang)*bt.dir*16,bp.y-Math.sin(bp.ang)*bt.dir*16);ctx.stroke();
    ctx.drawImage(sp.boat.c,bp.x-sp.boat.half,bp.y-sp.boat.half);
  }
  /* trains */
  for(var ti=0;ti<trains.length;ti++){
    var tr=trains[ti];
    var ts=((tr.off+tr.dir*fi.frame*tr.speed*pxS/tr.prep.total)%1+1)%1;
    var tp=pointAt(tr.pts,tr.prep,ts);
    ctx.save();ctx.translate(tp.x,tp.y);ctx.rotate(tp.ang+(tr.dir<0?Math.PI:0));
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(-9,-4,18,8);
    ctx.fillStyle=tr.color;ctx.fillRect(-8,-3,16,6);
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.fillRect(2,-1.5,5,3);
    ctx.restore();
  }

  /* 5. clouds drifting above it all */
  for(var cli=0;cli<clouds.length;cli++){
    var cl=clouds[cli],cs=sp.clouds[cl.spr];
    var cx=((cl.x0+fi.frame*cl.sp*pxS)%(WW+600))-300;
    var cy=cl.y+Math.sin(fi.frame*0.004+cl.phase)*22;
    ctx.globalAlpha=0.16*cl.alpha*(1-tod.light*0.55);
    ctx.drawImage(cs.c,cx-cs.w/2,cy-cs.h/2);
  }
  ctx.globalAlpha=1;
}

/* ---------- composite ---------- */
function showBase(){
  var sc=window.scene,W=window.world;
  if(!sc||!W||!window.worldCanvas)return;
  if(sc.width!==window.WORLD_W||sc.height!==window.WORLD_H)return;
  var ctx=sc.getContext('2d');
  ctx.drawImage(window.worldCanvas,0,0);
  if(window.overlayCanvas&&window.anyLayerOn&&window.anyLayerOn())ctx.drawImage(window.overlayCanvas,0,0);
}
var lastPaintMs=0;
function interactiveLoop(){
  requestAnimationFrame(interactiveLoop);
  if(!enabled||document.hidden)return;
  if(window.__renderMode)return;
  if(window.__roadAtlas3D&&window.__roadAtlas3D.active)return;
  var nowMs=(typeof performance!=='undefined'?performance.now():Date.now());
  if(nowMs-lastPaintMs<33)return; /* cap ~30fps: smooth enough, kinder to battery */
  lastPaintMs=nowMs;
  var W=window.world;if(!W||!window.worldCanvas||!window.scene)return;
  var sc=window.scene;
  if(sc.width!==window.WORLD_W||sc.height!==window.WORLD_H)return;
  try{
    paint(frameInfo());
    var ctx=sc.getContext('2d');
    ctx.drawImage(window.worldCanvas,0,0);
    if(window.overlayCanvas&&window.anyLayerOn&&window.anyLayerOn())ctx.drawImage(window.overlayCanvas,0,0);
    ctx.drawImage(animCanvas,0,0);
  }catch(e){
    if(window.__raAnimErr!==String(e&&e.message)){window.__raAnimErr=String(e&&e.message);try{console.error('[anim] frame:',e);}catch(_){}}
  }
}

/* ---------- install ---------- */
function install(){
  buildSprites();
  /* rebuild animation data after every regenerate (seed/theme change) */
  if(typeof window.regenerate==='function'&&!window.regenerate._raAnimWrapped){
    var _regen=window.regenerate;
    var wrapped=function(){_regen();try{rebuild(window.world);}catch(e){try{console.error('[anim] rebuild:',e);}catch(_){}}};
    wrapped._raAnimWrapped=true;
    window.regenerate=wrapped;
  }
  /* composite animation into fixed-step video renders */
  if(typeof window.drawKenBurns==='function'&&!window.drawKenBurns._raAnimWrapped){
    var _kb=window.drawKenBurns;
    var wrappedKB=function(t,RM){
      _kb(t,RM);
      try{
        if(!enabled||!window.world||!window.scene)return;
        var fi={frame:RM.frame,fps:RM.fps||30,render:true,nowMs:Date.now()};
        paint(fi);
        var D=Math.max(1,RM.totalFrames/RM.fps);
        var ft=clamp(t/D,0,1)*(KB_WPS.length-1);
        var i0=Math.min(KB_WPS.length-2,Math.floor(ft)),f=ft-i0;
        f=f*f*(3-2*f);
        var A=KB_WPS[i0],B=KB_WPS[i0+1];
        var cx=lerp(A[0],B[0],f)*WORLD_W,cy=lerp(A[1],B[1],f)*WORLD_H,z=lerp(A[2],B[2],f);
        var vw=WORLD_W/z,vh=WORLD_H/z;
        if(vw>WORLD_W){vw=WORLD_W;vh=WORLD_H;}
        var sx=clamp(cx-vw/2,0,WORLD_W-vw),sy=clamp(cy-vh/2,0,WORLD_H-vh);
        var ctx=window.scene.getContext('2d');
        ctx.drawImage(animCanvas,sx,sy,vw,vh,0,0,window.scene.width,window.scene.height);
      }catch(e){
        if(window.__raAnimErr!==String(e&&e.message)){window.__raAnimErr=String(e&&e.message);try{console.error('[anim] kb:',e);}catch(_){}}
      }
    };
    wrappedKB._raAnimWrapped=true;
    window.drawKenBurns=wrappedKB;
  }
  if(window.world)try{rebuild(window.world);}catch(e){}
  /* floating motion toggle */
  if(!document.getElementById('fabmotion')){
    var st=document.createElement('style');
    st.textContent='#fabmotion{position:fixed;right:16px;bottom:150px;z-index:1200;display:flex;align-items:center;gap:8px;padding:11px 16px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(14,20,28,.85);color:#f2ead8;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);}#fabmotion:active{transform:scale(.96);}#fabmotion.off{opacity:.55;}.su-clean #fabmotion{display:none;}';
    document.head.appendChild(st);
    var btn=document.createElement('button');
    btn.id='fabmotion';btn.title='Toggle the living-city animation';
    btn.textContent='✨ Motion on';
    btn.addEventListener('click',function(){
      enabled=!enabled;
      btn.textContent=enabled?'✨ Motion on':'✨ Motion off';
      btn.classList.toggle('off',!enabled);
      if(!enabled)showBase();
    });
    document.body.appendChild(btn);
  }
  interactiveLoop();
  window.__raMotion={get enabled(){return enabled;},set enabled(v){enabled=!!v;if(!enabled)showBase();},rebuild:rebuild,VERSION:VERSION};
}

return {install:install,VERSION:VERSION,rebuild:rebuild};
})();
try{RoadAtlasAnimation.install();}catch(e){try{console.error('[anim] install failed:',e);}catch(_){}}
