/* Moor Kit engine: sketch-pad — freehand sketch pad / whiteboard.
   window.MoorKit.build(config) -> complete self-contained HTML string. */
(function () {
"use strict";

var PALETTES = {
  classic: ["#222222","#5b5b5b","#999999","#e74c3c","#e67e22","#f1c40f","#2ecc71","#1abc9c","#3498db","#9b59b6","#ec008c","#8b5a2b","#ffffff","#000000"],
  neon:    ["#ffffff","#ffe600","#00ff9d","#00e5ff","#7c4dff","#ff2ea6","#ff5a5a","#ff9d00","#b6ff00","#00ff66","#66ffcc","#cc66ff","#ff66cc","#0a0a0a"],
  pastel:  ["#f8a5c2","#fbcfe8","#fde68a","#fef3c7","#bbf7d0","#a7f3d0","#bae6fd","#c4b5fd","#ddd6fe","#fecdd3","#fed7aa","#d9f99d","#5b5b66","#ffffff"]
};
var NAMES = { sketchbook: "Sketchbook", doodlepad: "Doodle Pad", whiteboard: "Whiteboard", inkwell: "Inkwell" };
var LOOKS = { chalkboard: 1, paper: 1 };
var TOOLS = { brush: 1, marker: 1, highlighter: 1 };
var MAX_STROKES = 250;

function oneOf(v, set, fallback) {
  return (typeof v === "string" && set[v]) ? v : fallback;
}

function build(config) {
  config = (config && typeof config === "object") ? config : {};
  var look = oneOf(config.look, LOOKS, "chalkboard");
  var tool = oneOf(config.tool, TOOLS, "brush");
  var palKey = oneOf(config.palette, { classic: 1, neon: 1, pastel: 1 }, "classic");
  var name = NAMES[config.name] || NAMES.sketchbook;
  var palette = PALETTES[palKey];
  var dark = look === "chalkboard";
  var inkDefault = dark ? "#f5f5f5" : "#232323";
  var bgColor = dark ? "#101216" : "#f7f3ea";
  var uiFg = dark ? "#f2f4f8" : "#22242b";
  var uiDim = dark ? "rgba(242,244,248,.55)" : "rgba(34,36,43,.55)";
  var panelBg = dark ? "rgba(18,20,26,.82)" : "rgba(255,255,255,.82)";
  var hairline = dark ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)";
  var accent = "#2ecc71";

  var swatches = palette.map(function (c, i) {
    return '<button class="sw' + (c === inkDefault ? " sel" : "") + '" data-c="' + c + '"' +
      ' style="background:' + c + '" aria-label="color ' + (i + 1) + '"></button>';
  }).join("");

  var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n' +
  '<title>' + name + '</title>\n<style>\n' +
  '*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}\n' +
  'html,body{height:100%;overflow:hidden}\n' +
  'body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;' +
  'background:' + bgColor + ';color:' + uiFg + ';display:flex;flex-direction:column;' +
  'user-select:none;-webkit-user-select:none;touch-action:manipulation}\n' +
  '#hdr{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 10px) 14px 10px;' +
  'background:' + panelBg + ';backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
  'border-bottom:1px solid ' + hairline + ';z-index:5}\n' +
  '#hdr h1{font-size:18px;font-weight:700;letter-spacing:.2px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n' +
  '.hbtn{min-width:44px;min-height:44px;border:1px solid ' + hairline + ';border-radius:14px;background:transparent;color:' + uiFg + ';' +
  'font-size:18px;display:flex;align-items:center;justify-content:center;padding:0 10px;cursor:pointer}\n' +
  '.hbtn:disabled{opacity:.28}\n' +
  '.hbtn.armed{border-color:' + accent + ';color:' + accent + '}\n' +
  '#stage{position:relative;flex:1;overflow:hidden}\n' +
  '#cv{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block;cursor:crosshair}\n' +
  '#hint{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);color:' + uiDim + ';font-size:15px;' +
  'pointer-events:none;text-align:center;transition:opacity .5s}\n' +
  '#hint.gone{opacity:0}\n' +
  '#dock{position:relative;background:' + panelBg + ';backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
  'border-top:1px solid ' + hairline + ';padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 10px);' +
  'transition:transform .28s ease,opacity .28s ease;z-index:5}\n' +
  'body.drawing #dock{opacity:.18;pointer-events:none}\n' +
  'body.collapsed #dock{transform:translateY(110%)}\n' +
  '#fab{position:absolute;right:14px;bottom:calc(env(safe-area-inset-bottom,0px) + 14px);z-index:6;' +
  'width:56px;height:56px;border-radius:50%;border:1px solid ' + hairline + ';background:' + panelBg + ';' +
  'color:' + uiFg + ';font-size:24px;display:none;align-items:center;justify-content:center;cursor:pointer}\n' +
  'body.collapsed #fab{display:flex}\n' +
  '.trow{display:flex;gap:8px;align-items:center;margin-bottom:10px}\n' +
  '.tbtn{flex:1;min-height:48px;border:1px solid ' + hairline + ';border-radius:14px;background:transparent;color:' + uiDim + ';' +
  'font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer}\n' +
  '.tbtn.sel{color:' + uiFg + ';border-color:' + accent + ';box-shadow:inset 0 0 0 1px ' + accent + '}\n' +
  '.prow{display:flex;gap:8px;align-items:center;margin-bottom:10px}\n' +
  '#pal{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;flex:1}\n' +
  '.sw{aspect-ratio:1;border-radius:50%;border:2px solid transparent;cursor:pointer;min-width:0;padding:0;' +
  'box-shadow:inset 0 0 0 1px rgba(128,128,128,.35)}\n' +
  '.sw.sel{border-color:' + accent + ';transform:scale(1.12)}\n' +
  '.swcustom{position:relative;overflow:hidden}\n' +
  '.swcustom input{position:absolute;inset:-8px;opacity:0;cursor:pointer}\n' +
  '.srow{display:flex;gap:10px;align-items:center}\n' +
  '.srow label{font-size:13px;color:' + uiDim + ';font-weight:600;white-space:nowrap}\n' +
  '#sz{flex:1;accent-color:' + accent + ';height:44px}\n' +
  '#szval{font-size:13px;font-weight:700;min-width:44px;text-align:right}\n' +
  '#clearbtn{min-height:44px;border:1px solid ' + hairline + ';border-radius:14px;background:transparent;' +
  'color:' + uiDim + ';font-size:13px;font-weight:600;padding:0 14px;cursor:pointer}\n' +
  '#clearbtn.armed{color:#ff6b6b;border-color:#ff6b6b}\n' +
  '#cbtn{min-height:44px;border:1px solid ' + hairline + ';border-radius:14px;background:transparent;color:' + uiDim + ';' +
  'font-size:13px;font-weight:600;padding:0 14px;cursor:pointer}\n' +
  '#modal{position:absolute;inset:0;z-index:20;display:none;align-items:center;justify-content:center;' +
  'background:rgba(0,0,0,.55);padding:20px}\n' +
  '#modal.open{display:flex}\n' +
  '#card{background:' + panelBg + ';backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);' +
  'border:1px solid ' + hairline + ';border-radius:20px;padding:18px;width:100%;max-width:340px}\n' +
  '#card h2{font-size:17px;margin-bottom:12px}\n' +
  '#pv{width:100%;border-radius:12px;border:1px solid ' + hairline + ';display:block;margin-bottom:12px;background:' +
  (dark ? "#1a1d24" : "#ffffff") + '}\n' +
  '.mrow{display:flex;gap:8px;margin-bottom:12px}\n' +
  '.mbg{flex:1;min-height:48px;border-radius:14px;border:1px solid ' + hairline + ';background:transparent;' +
  'color:' + uiDim + ';font-weight:600;font-size:14px;cursor:pointer}\n' +
  '.mbg.sel{color:' + uiFg + ';border-color:' + accent + ';box-shadow:inset 0 0 0 1px ' + accent + '}\n' +
  '#dl{display:block;text-align:center;min-height:52px;line-height:52px;border-radius:16px;background:' + accent + ';' +
  'color:#06130c;font-weight:700;font-size:16px;text-decoration:none;margin-bottom:8px}\n' +
  '#mclose{width:100%;min-height:48px;border-radius:14px;border:1px solid ' + hairline + ';background:transparent;' +
  'color:' + uiDim + ';font-size:15px;font-weight:600;cursor:pointer}\n' +
  '</style>\n</head>\n<body>\n' +
  '<header id="hdr"><h1>' + name + '</h1>' +
  '<button class="hbtn" id="undo" aria-label="undo">↩</button>' +
  '<button class="hbtn" id="redo" aria-label="redo">↪</button>' +
  '<button class="hbtn" id="share" aria-label="export">⤴</button></header>\n' +
  '<div id="stage"><canvas id="cv"></canvas>' +
  '<div id="hint">Draw with your finger<br><span style="font-size:13px">tools hide while you draw</span></div></div>\n' +
  '<div id="dock">\n' +
  '<div class="trow">' +
  '<button class="tbtn' + (tool === "brush" ? " sel" : "") + '" data-t="brush">🖌 Brush</button>' +
  '<button class="tbtn' + (tool === "marker" ? " sel" : "") + '" data-t="marker">🖊 Marker</button>' +
  '<button class="tbtn' + (tool === "highlighter" ? " sel" : "") + '" data-t="highlighter">🌟 Hi-lite</button>' +
  '<button class="tbtn" data-t="eraser">🧽 Erase</button>' +
  '</div>\n' +
  '<div class="prow"><div id="pal">' + swatches +
  '<label class="sw swcustom" aria-label="custom color" style="background:conic-gradient(#f55,#ff5,#5f5,#5ff,#55f,#f5f,#f55)">＋<input type="color" id="custom" value="' + inkDefault + '"></label>' +
  '</div></div>\n' +
  '<div class="srow"><label>Size</label><input type="range" id="sz" min="1" max="40" value="8">' +
  '<span id="szval">8</span>' +
  '<button id="clearbtn">Clear</button>' +
  '<button id="cbtn">Hide</button></div>\n' +
  '</div>\n' +
  '<button id="fab" aria-label="show tools">🎨</button>\n' +
  '<div id="modal"><div id="card"><h2>Export PNG</h2>' +
  '<img id="pv" alt="sketch preview">' +
  '<div class="mrow"><button class="mbg' + (dark ? " sel" : "") + '" id="bgT">Transparent</button>' +
  '<button class="mbg' + (dark ? "" : " sel") + '" id="bgB">' + (dark ? "Chalkboard" : "Paper") + '</button></div>' +
  '<a id="dl" download="sketch.png">Download PNG</a>' +
  '<button id="mclose">Close</button></div></div>\n' +
  '<script>\n' +
  appScript(look, tool, inkDefault, bgColor) +
  '\n</scr' + 'ipt>\n</body>\n</html>';
  return html;
}

function appScript(look, defTool, inkDefault, bgColor) {
  var j = JSON.stringify;
  return (
  '"use strict";\n' +
  'var LOOK=' + j(look) + ',DEF_TOOL=' + j(defTool) + ',INK=' + j(inkDefault) + ',BGC=' + j(bgColor) + ';\n' +
  'var cv=document.getElementById("cv"),ctx=cv.getContext("2d");\n' +
  'var strokes=[],redoStack=[],cur=null,activeId=null;\n' +
  'var curTool=DEF_TOOL,curColor=INK,curSize=8,clearArmed=false,exportBg=(LOOK==="chalkboard"?"t":"b");\n' +
  'var dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));\n' +
  'function sizeCanvas(){\n' +
  ' var r=cv.getBoundingClientRect();\n' +
  ' cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.height*dpr));\n' +
  ' redraw();\n' +
  '}\n' +
  'function dot(x,y,w){\n' +
  ' ctx.beginPath();ctx.arc(x,y,Math.max(0.4,w/2),0,6.2832);ctx.fill();\n' +
  '}\n' +
  'function drawStroke(s){\n' +
  ' if(!s.pts.length)return;\n' +
  ' if(s.t==="eraser"){ctx.save();ctx.globalCompositeOperation="destination-out";}\n' +
  ' else if(s.t==="highlighter"){ctx.save();ctx.globalAlpha=0.35;}\n' +
  ' else ctx.save();\n' +
  ' ctx.strokeStyle=s.c;ctx.fillStyle=s.c;ctx.lineCap="round";ctx.lineJoin="round";\n' +
  ' var p=s.pts;\n' +
  ' if(p.length===1){dot(p[0].x,p[0].y,p[0].w);}\n' +
  ' else{\n' +
  '  for(var i=1;i<p.length;i++){\n' +
  '   var a=p[i-1],b=p[i];\n' +
  '   ctx.beginPath();ctx.lineWidth=(a.w+b.w)/2;\n' +
  '   ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();\n' +
  '  }\n' +
  '  dot(p[p.length-1].x,p[p.length-1].y,p[p.length-1].w);\n' +
  ' }\n' +
  ' ctx.restore();\n' +
  '}\n' +
  'function redraw(){\n' +
  ' try{\n' +
  '  ctx.setTransform(dpr,0,0,dpr,0,0);\n' +
  '  ctx.clearRect(0,0,cv.width/dpr,cv.height/dpr);\n' +
  '  for(var i=0;i<strokes.length;i++)drawStroke(strokes[i]);\n' +
  ' }catch(e){}\n' +
  ' updateHist();\n' +
  ' document.getElementById("hint").classList.toggle("gone",strokes.length>0);\n' +
  '}\n' +
  'function pushStroke(s){\n' +
  ' strokes.push(s);\n' +
  ' if(strokes.length>250)strokes.shift();\n' +
  ' redoStack.length=0;\n' +
  ' redraw();persist();\n' +
  '}\n' +
  'function wFor(t,size,speed){\n' +
  ' var v=Math.min(1,speed/1.6);\n' +
  ' if(t==="brush")return size*(1.7-1.3*v);\n' +
  ' if(t==="marker")return size*2.1;\n' +
  ' if(t==="highlighter")return size*3.2;\n' +
  ' return size*2.6;\n' +
  '}\n' +
  'function pt(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}\n' +
  'cv.addEventListener("pointerdown",function(e){\n' +
  ' if(activeId!==null)return;\n' +
  ' try{e.preventDefault();}catch(_){}\n' +
  ' activeId=e.pointerId;\n' +
  ' try{cv.setPointerCapture(e.pointerId);}catch(_){}\n' +
  ' var p=pt(e),now=performance.now();\n' +
  ' cur={t:curTool,c:curColor,s:curSize,pts:[{x:p.x,y:p.y,w:wFor(curTool,curSize,0),t:now}]};\n' +
  ' document.body.classList.add("drawing");\n' +
  ' drawStrokeLive();\n' +
  '});\n' +
  'cv.addEventListener("pointermove",function(e){\n' +
  ' if(e.pointerId!==activeId||!cur)return;\n' +
  ' var p=pt(e),now=performance.now(),pts=cur.pts,last=pts[pts.length-1];\n' +
  ' var dx=p.x-last.x,dy=p.y-last.y,dt=Math.max(1,now-last.t);\n' +
  ' var dist=Math.sqrt(dx*dx+dy*dy);\n' +
  ' if(dist<1.2)return;\n' +
  ' pts.push({x:p.x,y:p.y,w:wFor(cur.t,cur.s,dist/dt),t:now});\n' +
  ' drawStrokeLive();\n' +
  '});\n' +
  'function endStroke(e){\n' +
  ' if(e&&e.pointerId!==activeId)return;\n' +
  ' if(cur&&cur.pts.length)pushStroke(cur);\n' +
  ' cur=null;activeId=null;\n' +
  ' document.body.classList.remove("drawing");\n' +
  '}\n' +
  'cv.addEventListener("pointerup",endStroke);\n' +
  'cv.addEventListener("pointercancel",endStroke);\n' +
  'function drawStrokeLive(){redraw();if(cur)drawStroke(cur);}\n' +
  'function updateHist(){\n' +
  ' document.getElementById("undo").disabled=!strokes.length;\n' +
  ' document.getElementById("redo").disabled=!redoStack.length;\n' +
  '}\n' +
  'document.getElementById("undo").addEventListener("click",function(){\n' +
  ' if(!strokes.length)return;redoStack.push(strokes.pop());redraw();persist();\n' +
  '});\n' +
  'document.getElementById("redo").addEventListener("click",function(){\n' +
  ' if(!redoStack.length)return;strokes.push(redoStack.pop());redraw();persist();\n' +
  '});\n' +
  'var toolBtns=document.querySelectorAll(".tbtn");\n' +
  'function selTool(t){\n' +
  ' curTool=t;\n' +
  ' for(var i=0;i<toolBtns.length;i++)toolBtns[i].classList.toggle("sel",toolBtns[i].getAttribute("data-t")===t);\n' +
  '}\n' +
  'for(var ti=0;ti<toolBtns.length;ti++){(function(b){\n' +
  ' b.addEventListener("click",function(){selTool(b.getAttribute("data-t"));});\n' +
  '})(toolBtns[ti]);}\n' +
  'var sws=document.querySelectorAll("#pal .sw[data-c]");\n' +
  'function selColor(c){\n' +
  ' curColor=c;\n' +
  ' for(var i=0;i<sws.length;i++)sws[i].classList.toggle("sel",sws[i].getAttribute("data-c")===c);\n' +
  '}\n' +
  'for(var si=0;si<sws.length;si++){(function(b){\n' +
  ' b.addEventListener("click",function(){selColor(b.getAttribute("data-c"));});\n' +
  '})(sws[si]);}\n' +
  'document.getElementById("custom").addEventListener("input",function(e){selColor(e.target.value);});\n' +
  'var sz=document.getElementById("sz"),szv=document.getElementById("szval");\n' +
  'sz.addEventListener("input",function(){curSize=parseInt(sz.value,10)||8;szv.textContent=sz.value;});\n' +
  'var cbtn=document.getElementById("clearbtn");\n' +
  'function disarmClear(){clearArmed=false;cbtn.classList.remove("armed");cbtn.textContent="Clear";}\n' +
  'cbtn.addEventListener("click",function(){\n' +
  ' if(!clearArmed){clearArmed=true;cbtn.classList.add("armed");cbtn.textContent="Tap again";\n' +
  '  setTimeout(disarmClear,2600);return;}\n' +
  ' strokes.length=0;redoStack.length=0;disarmClear();redraw();persist();\n' +
  '});\n' +
  'document.getElementById("cbtn").addEventListener("click",function(){\n' +
  ' document.body.classList.toggle("collapsed");\n' +
  ' setTimeout(sizeCanvas,300);\n' +
  '});\n' +
  'document.getElementById("fab").addEventListener("click",function(){\n' +
  ' document.body.classList.remove("collapsed");setTimeout(sizeCanvas,300);\n' +
  '});\n' +
  'var modal=document.getElementById("modal"),pv=document.getElementById("pv"),dl=document.getElementById("dl");\n' +
  'var bgT=document.getElementById("bgT"),bgB=document.getElementById("bgB");\n' +
  'function selBg(which){exportBg=which;bgT.classList.toggle("sel",which==="t");bgB.classList.toggle("sel",which==="b");refreshExport();}\n' +
  'bgT.addEventListener("click",function(){selBg("t");});\n' +
  'bgB.addEventListener("click",function(){selBg("b");});\n' +
  'function refreshExport(){\n' +
  ' try{\n' +
  '  var ex=document.createElement("canvas");ex.width=cv.width;ex.height=cv.height;\n' +
  '  var exx=ex.getContext("2d");\n' +
  '  if(exportBg==="b"){exx.fillStyle=BGC;exx.fillRect(0,0,ex.width,ex.height);}\n' +
  '  var oldCtx=ctx;ctx=exx;\n' +
  '  var oldDpr=dpr;dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1));\n' +
  '  exx.setTransform(dpr,0,0,dpr,0,0);\n' +
  '  for(var i=0;i<strokes.length;i++)drawStroke(strokes[i]);\n' +
  '  ctx=oldCtx;dpr=oldDpr;\n' +
  '  var url=ex.toDataURL("image/png");\n' +
  '  pv.src=url;dl.href=url;\n' +
  ' }catch(e){}\n' +
  '}\n' +
  'document.getElementById("share").addEventListener("click",function(){\n' +
  ' refreshExport();modal.classList.add("open");\n' +
  '});\n' +
  'document.getElementById("mclose").addEventListener("click",function(){modal.classList.remove("open");});\n' +
  'modal.addEventListener("click",function(e){if(e.target===modal)modal.classList.remove("open");});\n' +
  'var KEY="moor.sketchpad.v1";\n' +
  'function persist(){try{localStorage.setItem(KEY,JSON.stringify(strokes.slice(-80)));}catch(e){}}\n' +
  '(function restore(){try{\n' +
  ' var raw=localStorage.getItem(KEY);if(!raw)return;\n' +
  ' var arr=JSON.parse(raw);if(Array.isArray(arr))strokes=arr.filter(function(s){return s&&Array.isArray(s.pts);}).slice(0,250);\n' +
  '}catch(e){}})();\n' +
  'window.addEventListener("resize",function(){sizeCanvas();});\n' +
  'window.addEventListener("orientationchange",function(){setTimeout(sizeCanvas,200);});\n' +
  'sizeCanvas();\n'
  );
}

module.exports = null;
if (typeof window !== "undefined") { window.MoorKit = { build: build }; }
})();
