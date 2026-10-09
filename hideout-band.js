/* ============================================================================
 * hideout-band.js — ONE continuous glass display for the dev room band.
 *
 * The room's glass band is 4 separate wall canvases (north/south/west/east).
 * This module unifies them into a single shared coordinate space:
 *   u in [0,1) runs continuously around the room, v in [0,1] runs top→bottom.
 * Content painted through draw() flows across wall boundaries; taps are
 * resolved by 3D raycast so a tap near a boundary lands on the correct wall.
 *
 * IIFE. The only global it sets is window.__band. It never throws when an
 * anchor is missing — every feature is detected before use.
 *
 * Integration (see band-integration-spec.md):
 *   1. The room registers its band meshes in window.__bandAnchors.
 *   2. This file loads as a classic <script> after the room's module script.
 *      It waits (polls) for window.__bandAnchors, then attaches itself.
 *   3. The room's tapAt() calls window.__band.pick(raycaster) /
 *      window.__band.tap(hit) for band taps.
 *   4. The dock "System map" tool calls window.__band.cycle() instead of
 *      cycleFlow() so the ribbon regions survive flow cycling.
 *
 * Wall order for u: north -> east -> south -> west (clockwise seen from
 * above), length-proportional. This matches the room's mesh orientations:
 * each wall's canvas x grows in the direction of travel, so u is continuous
 * across every boundary.
 *
 * Canvas layout per wall (1024x128, unchanged from the room):
 *   y 0..80   — flow region (existing flowchart content, compact layout)
 *   y 80..128 — ribbon region (menu ribbons, one per wall)
 * The ribbon region is reserved: draw() repaints ribbons on top afterwards.
 * ========================================================================== */
(function(){
'use strict';

/* ---------- fixed geometry ---------- */
var CW=1024, CH=128;          /* canvas size, matches the room's makeCanvas(1024,128) */
var FLOW_H=80, RIBBON_H=48;   /* region split inside each canvas */
var FONT='-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,system-ui,sans-serif';
var MONO='ui-monospace,SFMono-Regular,Menlo,monospace';

/* Continuous wraparound order. Creation order in the room is N,S,W,E;
 * the display order below is what makes u continuous around the room. */
var U_ORDER=['north','east','south','west'];

/* Ribbon role per wall (preserves the direct-making layer's mapping:
 * MAKE north / PARAMETERS south / SAFETY west / DESCRIBE east).
 * `focus` is the window.__devroomUI.focusWall(i) index for that role. */
var ROLE_BY_WALL={
  north:{role:'make',    label:'MAKE',       focus:0},
  south:{role:'params',  label:'PARAMETERS', focus:1},
  west: {role:'safety',  label:'SAFETY',     focus:2},
  east: {role:'describe', label:'DESCRIBE',   focus:3}
};

/* ---------- state ---------- */
var walls=[];        /* wall records in U_ORDER: {index,name,len,g,tex,mesh,u0,u1} */
var byName={};
var byMesh=[];
var meshes=[];
var anchors=null;
var ready=false;
var tapSubs=[];
var lastError=null;

/* ---------- small helpers ---------- */
function normU(u){ u=Number(u); if(!isFinite(u))return 0; u=u%1; return u<0?u+1:u; }
function each(arr,fn){ for(var i=0;i<arr.length;i++) fn(arr[i],i); }

/* ============================================================================
 * attach(anchors)
 * anchors = { walls:[{name,g,tex,mesh,len}], cycleFlow:fn, getFlow:fn }
 * Safe to call more than once; safe to call with a partial object.
 * ========================================================================== */
function attach(a){
  try{
    if(!a||!a.walls||!a.walls.length) { lastError='attach: no walls in anchors'; return false; }
    var found={};
    each(a.walls,function(w){
      if(!w||!w.g||!w.tex||!w.name) return;
      if(!ROLE_BY_WALL[w.name]) return;
      found[w.name]=w;
    });
    var names=[];
    each(U_ORDER,function(n){ if(found[n]) names.push(n); });
    if(!names.length){ lastError='attach: no recognized wall names'; return false; }
    anchors=a;
    /* length-proportional u ranges */
    var total=0, lens={};
    each(names,function(n){ var L=(found[n].len>0)?found[n].len:1; lens[n]=L; total+=L; });
    walls=[]; byName={}; byMesh=[]; meshes=[];
    var acc=0;
    each(names,function(n,i){
      var w=found[n];
      var u0=acc/total, u1=(acc+lens[n])/total; acc+=lens[n];
      var rec={index:i,name:n,len:lens[n],g:w.g,tex:w.tex,mesh:w.mesh||null,u0:u0,u1:u1};
      walls.push(rec); byName[n]=rec;
      if(rec.mesh){ meshes.push(rec.mesh); byMesh.push(rec); }
    });
    ready=true; lastError=null;
    repaintAll();
    return true;
  }catch(e){ lastError='attach threw: '+(e&&e.message); return false; }
}

/* ============================================================================
 * coordinate space
 * ========================================================================== */
function uvToWall(u){
  u=normU(u);
  var rec=walls[walls.length-1];
  each(walls,function(w){ if(u>=w.u0&&u<w.u1) rec=w; });
  if(u===0&&walls.length) rec=walls[0];
  var x=((u-rec.u0)/Math.max(1e-9,(rec.u1-rec.u0)))*CW;
  return {wallIndex:rec.index, name:rec.name, x:x};
}
function wallToUv(wallIndex,x,y){
  var rec=walls[Number(wallIndex)]||null;
  if(!rec) return null;
  var u=rec.u0+(Number(x)/CW)*(rec.u1-rec.u0);
  var v=Number(y)/CH;             /* v=0 at the top of the band, v=1 at the bottom */
  if(v<0)v=0; if(v>1)v=1;
  return {u:normU(u), v:v};
}

/* ============================================================================
 * draw(fn) — paint shared content across the whole band.
 * fn(ctx, x0, y0, w, h, wallIndex, u0, u1); x0,y0,w,h = full canvas rect.
 * Ribbon regions are repainted on top afterwards (they are reserved).
 * ========================================================================== */
function draw(fn){
  if(!ready||typeof fn!=='function'){ return false; }
  try{
    each(walls,function(w){
      fn(w.g,0,0,CW,CH,w.index,w.u0,w.u1);
      paintRibbon(w);
      w.tex.needsUpdate=true;
    });
    return true;
  }catch(e){ lastError='draw threw: '+(e&&e.message); return false; }
}

/* ============================================================================
 * taps — resolved by 3D raycast, so boundary taps land on the right wall.
 * pick(raycaster) -> {u,v,wallIndex,name,x,y,point3D} | null
 * tap(hit)        -> notifies onTap subscribers, then default ribbon behavior
 * onTap(cb)       -> cb(hit); set hit.consumed=true to suppress the default
 * ========================================================================== */
function pick(raycaster){
  if(!ready||!raycaster||typeof raycaster.intersectObjects!=='function') return null;
  if(!meshes.length) return null;
  try{
    var hits=raycaster.intersectObjects(meshes,false);
    if(!hits.length) return null;
    var h=hits[0], rec=null;
    each(byMesh,function(w){ if(w.mesh===h.object) rec=w; });
    if(!rec||!h.uv) return null;
    var x=h.uv.x*CW, y=(1-h.uv.y)*CH;
    var uv=wallToUv(rec.index,x,y);
    if(!uv) return null;
    return {u:uv.u,v:uv.v,wallIndex:rec.index,name:rec.name,
            x:x,y:y,point3D:h.point||null,consumed:false};
  }catch(e){ lastError='pick threw: '+(e&&e.message); return null; }
}
function defaultRibbonTap(hit){
  if(!hit) return false;
  if(hit.y<FLOW_H) return false;              /* not in the ribbon region */
  var role=ROLE_BY_WALL[hit.name];
  if(!role) return false;
  try{
    var ui=window.__devroomUI;
    if(ui&&typeof ui.focusWall==='function'){ ui.focusWall(role.focus); return true; }
  }catch(e){}
  return false;
}
function tap(hit){
  if(!hit) return false;
  each(tapSubs.slice(),function(cb){ try{ cb(hit); }catch(e){} });
  if(!hit.consumed) defaultRibbonTap(hit);
  return true;
}
function onTap(cb){
  if(typeof cb==='function') tapSubs.push(cb);
  return function(){ var i=tapSubs.indexOf(cb); if(i>=0) tapSubs.splice(i,1); };
}

/* ============================================================================
 * flow + ribbons (existing content preserved)
 * ========================================================================== */
function getFlow(){
  try{
    if(anchors&&typeof anchors.getFlow==='function'){
      var f=anchors.getFlow();
      if(f&&f.name&&f.nodes) return f;
    }
  }catch(e){}
  return {id:'build',name:'BUILD FLOW',
    nodes:['PAGE 0','OBLIGATIONS','ASSEMBLY','EXECUTION','VERIFICATION','RECEIPT']};
}

/* Same content as the room's drawFlowBand, compacted into the top FLOW_H px
 * so the ribbon region below it stays visible. Nothing is dropped: title,
 * every node label, arrows between nodes. */
function paintFlow(g,flow){
  g.fillStyle='rgba(4,8,14,0.92)'; g.fillRect(0,0,CW,FLOW_H);
  g.fillStyle='#00D4FF'; g.font='600 16px '+FONT; g.textAlign='left'; g.textBaseline='alphabetic';
  g.fillText(flow.name,20,24);
  var n=flow.nodes.length;
  var x0=20, x1=CW-20, gap=(x1-x0)/Math.max(1,(n-1));
  g.font='600 13px '+FONT; g.textAlign='center';
  var y=56;
  flow.nodes.forEach(function(nd,i){
    var x=x0+gap*i, w=128, tw=0;
    try{ tw=g.measureText(nd).width+26; }catch(e){ tw=110; }
    w=Math.min(150,Math.max(70,tw));
    g.fillStyle='rgba(0,212,255,0.10)'; g.strokeStyle='#00D4FF'; g.lineWidth=1.5;
    var bx=x-w/2;
    if(typeof g.roundRect==='function'){ g.beginPath(); g.roundRect(bx,y-16,w,32,7); g.fill(); g.stroke(); }
    else{ g.fillRect(bx,y-16,w,32); g.strokeRect(bx,y-16,w,32); }
    g.fillStyle='#e8f4ff'; g.fillText(nd,x,y+4);
    if(i<n-1){
      var nx=x0+gap*(i+1), nw2=128;
      try{ nw2=Math.min(150,Math.max(70,g.measureText(flow.nodes[i+1]).width+26)); }catch(e){}
      g.strokeStyle='#00D4FF'; g.lineWidth=2;
      g.beginPath(); g.moveTo(x+w/2+3,y); g.lineTo(nx-nw2/2-12,y); g.stroke();
      g.fillStyle='#00D4FF';
      g.beginPath(); g.moveTo(nx-nw2/2-5,y); g.lineTo(nx-nw2/2-13,y-5); g.lineTo(nx-nw2/2-13,y+5); g.closePath(); g.fill();
    }
  });
}

/* ---------- ribbon painters (the preserved direct-making ribbons) ---------- */
function ribbonState(){
  var st={makableId:'website',safety:'default',params:{},describeText:'',focused:-1,registry:null};
  try{
    var ui=window.__devroomUI;
    if(ui&&typeof ui.getState==='function'){
      var s=ui.getState()||{};
      if(s.makableId)st.makableId=String(s.makableId);
      if(s.safety)st.safety=String(s.safety);
      if(s.params)st.params=s.params;
      if(typeof s.describeText==='string')st.describeText=s.describeText;
      if(typeof s.focused==='number')st.focused=s.focused;
    }
    if(ui&&typeof ui.registry==='object'&&ui.registry) st.registry=ui.registry;
  }catch(e){}
  return st;
}
function ribbonBase(g,roleLabel,focused){
  var y0=FLOW_H;
  g.clearRect(0,y0,CW,RIBBON_H);
  g.fillStyle='rgba(5,6,10,0.78)'; g.fillRect(0,y0,CW,RIBBON_H);
  g.fillStyle='rgba(0,212,255,0.16)'; g.fillRect(0,y0,CW,2);
  if(focused){ g.fillStyle='#3a86ff'; g.fillRect(0,y0+2,CW,2); }
  g.fillStyle='#7aa8ff'; g.font='600 20px '+FONT; g.textAlign='left'; g.textBaseline='middle';
  g.fillText(roleLabel,24,y0+RIBBON_H/2+1);
  g.fillStyle='rgba(122,168,255,0.30)'; g.fillRect(196,y0+10,1,RIBBON_H-20);
  g.textBaseline='alphabetic';
}
function ribbonChip(g,x,yc,text,active){
  g.font='17px '+MONO;
  var tw=0; try{ tw=g.measureText(text).width+24; }catch(e){ tw=text.length*10+24; }
  g.fillStyle=active?'rgba(58,134,255,0.25)':'rgba(255,255,255,0.05)';
  g.fillRect(x,yc-14,tw,28);
  if(active){ g.strokeStyle='#3a86ff'; g.lineWidth=1.5; g.strokeRect(x,yc-14,tw,28); }
  g.fillStyle=active?'#ffffff':'#c9d4e8';
  g.fillText(text,x+12,yc+6);
  return tw;
}
function paintRibbon(w){
  var role=ROLE_BY_WALL[w.name]; if(!role) return;
  var g=w.g, st=ribbonState(), y0=FLOW_H, yc=y0+RIBBON_H/2;
  var focused=(st.focused===role.focus);
  ribbonBase(g,role.label,focused);
  var x=224;
  function put(text,active){
    var tw=ribbonChip(g,x,yc,String(text),!!active);
    x+=tw+12;
    return x<CW-20;
  }
  try{
    if(role.role==='make'){
      var ids=st.registry?Object.keys(st.registry):['website','glow'];
      if(!ids.length){ g.fillStyle='#5b6577'; g.font='17px '+FONT; g.fillText('nothing makable',x,yc+6); }
      each(ids,function(id,i){
        var label=(st.registry&&st.registry[id]&&st.registry[id].label)||String(id);
        if(!put((i+1)+'. '+label,id===st.makableId)) return;
      });
    }else if(role.role==='params'){
      var p=(st.params&&st.params[st.makableId])||{};
      var keys=Object.keys(p);
      if(!keys.length){ g.fillStyle='#5b6577'; g.font='17px '+FONT; g.fillText('no params for '+st.makableId,x,yc+6); }
      each(keys.slice(0,6),function(k){
        var v=p[k];
        if(Array.isArray(v))v=v.length+' sections';
        if(v==null||v==='')v='--';
        if(!put(k+' = '+String(v).slice(0,24),false)) return;
      });
    }else if(role.role==='safety'){
      var pkgs=[['default','[DEFAULT]','Default package'],['strict','[STRICT]','Strict package']];
      each(pkgs,function(pk){
        if(!put(pk[1]+' '+pk[2],st.safety===pk[0])) return;
      });
    }else if(role.role==='describe'){
      var t=(st.describeText||'').replace(/\s+/g,' ').slice(0,88);
      g.fillStyle=t?'#e8e4da':'#5b6577'; g.font='17px '+FONT;
      g.fillText(t||'Describe what you want — it becomes settings',x,yc+6);
    }
  }catch(e){ lastError='paintRibbon threw: '+(e&&e.message); }
}
function repaintAll(){
  if(!ready) return 0;
  var t0=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  var flow=getFlow();
  each(walls,function(w){
    try{
      paintFlow(w.g,flow);
      paintRibbon(w);
      w.tex.needsUpdate=true;
    }catch(e){ lastError='repaintAll threw: '+(e&&e.message); }
  });
  var t1=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  return t1-t0;
}
/* Repaint ribbon strips only (cheap; keeps flow content untouched). */
function refresh(){
  if(!ready) return 0;
  var t0=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  each(walls,function(w){
    try{ paintRibbon(w); w.tex.needsUpdate=true; }
    catch(e){ lastError='refresh threw: '+(e&&e.message); }
  });
  var t1=(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  return t1-t0;
}
/* Cycle the flowchart (preserves the room's existing behavior), then restore
 * the ribbon regions the room's full-canvas repaint would have covered. */
function cycle(){
  try{
    if(anchors&&typeof anchors.cycleFlow==='function') anchors.cycleFlow();
  }catch(e){ lastError='cycle threw: '+(e&&e.message); return false; }
  repaintAll();
  return true;
}

/* ---------- public surface ---------- */
function wallsInfo(){
  return walls.map(function(w){
    return {index:w.index,name:w.name,len:w.len,canvas:{w:CW,h:CH},u0:w.u0,u1:w.u1};
  });
}
function status(){
  return {ready:ready, walls:wallsInfo(), taps:tapSubs.length,
          hasAnchors:!!anchors, hasDevroomUI:!!(window.__devroomUI),
          lastError:lastError};
}
window.__band={
  attach:attach,
  walls:wallsInfo,
  wallOrder:function(){ return walls.map(function(w){return w.name;}); },
  uvToWall:uvToWall,
  wallToUv:wallToUv,
  draw:draw,
  onTap:onTap,
  pick:pick,
  tap:tap,
  cycle:cycle,
  refresh:refresh,
  repaintAll:repaintAll,
  status:status,
  FLOW_H:FLOW_H, RIBBON_H:RIBBON_H, CW:CW, CH:CH
};

/* ---------- boot: wait for the room to register its anchors ---------- */
var bootTries=0;
var bootTimer=setInterval(function(){
  bootTries++;
  try{
    if(window.__bandAnchors){ attach(window.__bandAnchors); clearInterval(bootTimer); return; }
    /* room finished loading but never registered anchors: stay dormant but callable */
    if(window.__ready===true&&bootTries>120){ clearInterval(bootTimer); }
    if(bootTries>1200){ clearInterval(bootTimer); }   /* ~60s hard stop */
  }catch(e){ clearInterval(bootTimer); }
},50);

})();
