// Moor kit: pixel-art v1.0.0
// Touch-first pixel art drawing pad: tappable grid canvas (8/16/32),
// neon/pastel/classic palettes, brush/eraser/fill, undo, clear, mirror,
// grid toggle, PNG export, new canvas. midnight/paper app themes.
(function(){
'use strict';

var VALID_SIZES = ['8x8','16x16','32x32'];
var VALID_PALETTES = ['neon','pastel','classic'];
var VALID_THEMES = ['midnight','paper'];
var VALID_EXTRAS = ['mirror','fill'];

function normConfig(cfg){
  cfg = (cfg && typeof cfg === 'object') ? cfg : {};
  var size = VALID_SIZES.indexOf(cfg.size) >= 0 ? cfg.size : '16x16';
  var palette = VALID_PALETTES.indexOf(cfg.palette) >= 0 ? cfg.palette : 'classic';
  var theme = VALID_THEMES.indexOf(cfg.theme) >= 0 ? cfg.theme : 'midnight';
  var raw = Array.isArray(cfg.extras) ? cfg.extras : ['mirror','fill'];
  var extras = [];
  for(var i=0;i<raw.length;i++){
    if(VALID_EXTRAS.indexOf(raw[i])>=0 && extras.indexOf(raw[i])<0) extras.push(raw[i]);
  }
  return { size:size, palette:palette, theme:theme, extras:extras };
}

function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

var PALETTES = {
  classic: ['#000000','#ffffff','#9aa0aa','#5b6470','#c0392b','#e74c3c','#e67e22',
            '#f1c40f','#2ecc71','#1abc9c','#3498db','#3d5afe','#9b59b6','#e84393',
            '#6d4c41','#f5e6c8'],
  neon:    ['#05050f','#ffffff','#ff2d78','#ff6b35','#ffe93d','#7dff00',
            '#39ff6a','#00ffa3','#00e5ff','#2d7bff','#9d4dff','#ff4dff',
            '#ff9f1c','#b388ff'],
  pastel:  ['#2b2b3a','#ffffff','#f4a7b9','#f9c89b','#fdf3a7','#b8e6b0',
            '#a8e6e1','#a7d8f0','#c3b2f7','#f0b8d8','#d9c6a5','#e8e8f0']
};

var PALETTE_LABEL = { neon:'neon', pastel:'pastel', classic:'classic' };

var THEME_CSS = {
  midnight: '--bg:#0b0d12;--panel:rgba(22,27,38,.88);--txt:#f2f4f8;--muted:#9aa3b2;--btn:#1d2434;--btnhi:#28324a;--accent:#7de3ff;--ring:rgba(125,227,255,.55);--line:rgba(255,255,255,.09)',
  paper: '--bg:#f1ebdb;--panel:rgba(255,253,246,.92);--txt:#4a4238;--muted:#8a7d68;--btn:#e4d9bf;--btnhi:#d6c9a8;--accent:#c96a1e;--ring:rgba(201,106,30,.45);--line:rgba(90,70,50,.16)'
};

var EMPTY_CELLS = {
  midnight: ['#161b28','#111522'],
  paper: ['#ece3cd','#e4d8bd']
};

function build(config){
  var c = normConfig(config);
  var N = parseInt(c.size, 10);
  var HAS_FILL = c.extras.indexOf('fill') >= 0;
  var HAS_MIRROR = c.extras.indexOf('mirror') >= 0;
  var pal = PALETTES[c.palette];
  var emptyA = EMPTY_CELLS[c.theme][0];
  var emptyB = EMPTY_CELLS[c.theme][1];
  var gridLine = c.theme === 'midnight' ? 'rgba(125,227,255,.16)' : 'rgba(120,100,70,.28)';
  var sizeLabel = N + ' × ' + N;

  // ---- palette swatch buttons ----
  var swatches = [];
  for(var i=0;i<pal.length;i++){
    swatches.push('<button class="sw' + (i===3?' sel':'') + '" data-c="' + pal[i] +
      '" style="background:' + pal[i] + '" aria-label="color ' + pal[i] + '"></button>');
  }

  // ---- tool buttons ----
  var tools = [];
  tools.push('<button class="tool sel" data-tool="brush"><span class="ti">🖌️</span><span>Brush</span></button>');
  tools.push('<button class="tool" data-tool="eraser"><span class="ti">🧽</span><span>Eraser</span></button>');
  if(HAS_FILL){
    tools.push('<button class="tool" data-tool="fill"><span class="ti">🪣</span><span>Fill</span></button>');
  }

  // ---- action buttons ----
  var actions = [];
  actions.push('<button class="act" id="undo">↩ Undo</button>');
  actions.push('<button class="act" id="clear">🗑 Clear</button>');
  actions.push('<button class="act" id="new">✚ New</button>');
  if(HAS_MIRROR){
    actions.push('<button class="act tog" id="mirror" aria-pressed="false">🪞 Mirror</button>');
  }
  actions.push('<button class="act tog on" id="gridtog" aria-pressed="true">▦ Grid</button>');
  actions.push('<button class="act primary" id="export">💾 PNG</button>');

  var html = [
  '<!DOCTYPE html>',
  '<html lang="en">',
  '<head>',
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
  '<meta name="theme-color" content="' + (c.theme==='midnight' ? '#0b0d12' : '#f1ebdb') + '">',
  '<title>Pixel Studio</title>',
  '<style>',
  '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
  'html,body{margin:0;padding:0}',
  'body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;min-height:100vh;',
  ' background:var(--bg);color:var(--txt);touch-action:manipulation;overscroll-behavior:none;',
  ' -webkit-user-select:none;user-select:none}',
  'body[data-theme="midnight"]{' + THEME_CSS.midnight + '}',
  'body[data-theme="paper"]{' + THEME_CSS.paper + '}',
  '#app{width:100%;max-width:480px;margin:0 auto;padding:calc(14px + env(safe-area-inset-top)) 16px calc(28px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px}',
  'header{display:flex;align-items:baseline;justify-content:space-between}',
  'h1{margin:0;font-size:26px;font-weight:800;letter-spacing:-.5px}',
  '#sub{font-size:12px;color:var(--muted)}',
  '#stage{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:10px;box-shadow:0 8px 30px rgba(0,0,0,.25)}',
  '#pad{display:block;width:100%;aspect-ratio:1/1;border-radius:10px;touch-action:none;cursor:crosshair}',
  '#tools{display:flex;gap:8px}',
  '.tool{flex:1;min-height:52px;border:1px solid var(--line);background:var(--btn);color:var(--txt);border-radius:14px;',
  ' font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}',
  '.tool .ti{font-size:20px}',
  '.tool.sel{border-color:var(--accent);box-shadow:0 0 0 2px var(--ring);background:var(--btnhi)}',
  '#palette{display:flex;flex-wrap:wrap;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px}',
  '.sw{width:46px;height:46px;border-radius:12px;border:2px solid transparent;cursor:pointer;padding:0}',
  '.sw.sel{border-color:var(--accent);box-shadow:0 0 0 2px var(--ring)}',
  '.swcustom{position:relative;width:46px;height:46px;border-radius:12px;border:2px dashed var(--muted);overflow:hidden;cursor:pointer;',
  ' display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--muted);background:transparent}',
  '.swcustom input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}',
  '.swcustom.sel{border-color:var(--accent);border-style:solid;box-shadow:0 0 0 2px var(--ring)}',
  '#currentrow{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted)}',
  '#curdot{width:22px;height:22px;border-radius:50%;border:2px solid var(--line)}',
  '#actions{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
  '.act{min-height:48px;border:1px solid var(--line);background:var(--btn);color:var(--txt);border-radius:14px;',
  ' font-size:14px;font-weight:600;cursor:pointer}',
  '.act.primary{background:var(--accent);color:#0b0d12;border:none}',
  'body[data-theme="paper"] .act.primary{color:#fff}',
  '.act.tog.on{border-color:var(--accent);box-shadow:0 0 0 2px var(--ring)}',
  '.act.armed{background:#c0392b;color:#fff;border-color:#c0392b}',
  '.act.dim{opacity:.4}',
  '#modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:50;padding:24px}',
  '#modal[hidden]{display:none}',
  '#card{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:20px;max-width:340px;width:100%;',
  ' display:flex;flex-direction:column;gap:12px;align-items:center;backdrop-filter:blur(12px)}',
  '#expimg{width:100%;border-radius:12px;image-rendering:pixelated;background:#888}',
  '#card p{margin:0;font-size:13px;color:var(--muted);text-align:center}',
  '#card .row{display:flex;gap:8px;width:100%}',
  '#card .row .act{flex:1}',
  'a.act{text-decoration:none;display:flex;align-items:center;justify-content:center}',
  '::-webkit-scrollbar{width:6px;height:6px}',
  '::-webkit-scrollbar-thumb{background:#3fae5a;border-radius:3px}',
  '::-webkit-scrollbar-track{background:transparent}',
  '</style>',
  '</head>',
  '<body data-theme="' + esc(c.theme) + '">',
  '<div id="app">',
  ' <header><h1>🎨 Pixel Studio</h1><div id="sub">' + esc(sizeLabel) + ' · ' + esc(PALETTE_LABEL[c.palette]) + '</div></header>',
  ' <div id="stage"><canvas id="pad"></canvas></div>',
  ' <div id="tools">' + tools.join('') + '</div>',
  ' <div id="palette">' + swatches.join('') +
    '<button class="swcustom" id="customsw" aria-label="custom color"><span>+</span><input type="color" id="customcolor" value="#ff2d78" aria-label="pick a custom color"></button></div>',
  ' <div id="currentrow"><div id="curdot"></div><span id="curhex"></span></div>',
  ' <div id="actions">' + actions.join('') + '</div>',
  '</div>',
  '<div id="modal" hidden>',
  ' <div id="card">',
  '  <img id="expimg" alt="pixel art export">',
  '  <p>Long-press the image to save it to your photos.</p>',
  '  <div class="row"><a class="act" id="expdl" download="pixel-art.png">⬇ Download</a>',
  '  <button class="act" id="expclose">Close</button></div>',
  ' </div>',
  '</div>',
  '<script>',
  '(function(){',
  "'use strict';",
  'var N=' + N + ';',
  'var EMPTY_A=' + JSON.stringify(emptyA) + ';',
  'var EMPTY_B=' + JSON.stringify(emptyB) + ';',
  'var GRID_LINE=' + JSON.stringify(gridLine) + ';',
  'var grid=[];for(var gy=0;gy<N;gy++){var row=[];for(var gx=0;gx<N;gx++)row.push(null);grid.push(row);}',
  'var tool="brush";',
  'var color=' + JSON.stringify(pal[3]) + ';',
  'var customColor="#ff2d78";',
  'var mirrorOn=false,gridOn=true;',
  'var hist=[];',
  'var pad=document.getElementById("pad");',
  'var ctx=pad.getContext("2d");',
  'var curdot=document.getElementById("curdot");',
  'var curhex=document.getElementById("curhex");',
  'function snap(){var s=[];for(var y=0;y<N;y++)s.push(grid[y].slice());return s;}',
  'function pushHist(){hist.push(snap());if(hist.length>60)hist.shift();refreshUndo();}',
  'function setCell(x,y,c){grid[y][x]=c;if(mirrorOn){grid[y][N-1-x]=c;}}',
  'function fit(){var r=pad.getBoundingClientRect();var w=Math.max(1,Math.round(r.width));',
  ' var dpr=Math.min(2,window.devicePixelRatio||1);',
  ' pad.width=Math.round(w*dpr);pad.height=Math.round(w*dpr);render();}',
  'function render(){var W=pad.width;if(!W)return;var px=W/N;',
  ' var gap=gridOn?Math.max(1,Math.round(px*0.09)):0;',
  ' ctx.fillStyle=GRID_LINE;ctx.fillRect(0,0,W,W);',
  ' for(var y=0;y<N;y++){for(var x=0;x<N;x++){',
  '  var c=grid[y][x];',
  '  ctx.fillStyle=c?c:(((x+y)%2===0)?EMPTY_A:EMPTY_B);',
  '  var ix=Math.round(x*px+gap/2),iy=Math.round(y*px+gap/2);',
  '  var sz=Math.max(1,Math.round(px-gap));',
  '  ctx.fillRect(ix,iy,sz,sz);}}}',
  'function cellFromEvent(e){var r=pad.getBoundingClientRect();',
  ' var x=Math.floor((e.clientX-r.left)/r.width*N);',
  ' var y=Math.floor((e.clientY-r.top)/r.height*N);',
  ' if(x<0)x=0;if(y<0)y=0;if(x>=N)x=N-1;if(y>=N)y=N-1;return [x,y];}',
  'function flood(sx,sy,c){var t=grid[sy][sx];if(t===c)return;',
  ' var st=[[sx,sy]];grid[sy][sx]=c;',
  ' while(st.length){var p=st.pop();var x=p[0],y=p[1];',
  '  var nb=[[x+1,y],[x-1,y],[x,y+1],[x,y-1]];',
  '  for(var i=0;i<4;i++){var nx=nb[i][0],ny=nb[i][1];',
  '   if(nx>=0&&ny>=0&&nx<N&&ny<N&&grid[ny][nx]===t){grid[ny][nx]=c;st.push([nx,ny]);}}}}',
  'var down=false,changed=false;',
  'function applyAt(e){var cell=cellFromEvent(e);var x=cell[0],y=cell[1];',
  ' if(tool==="fill"){if(e.type==="pointerdown"){flood(x,y,color);if(mirrorOn)flood(N-1-x,y,color);changed=true;}return;}',
  ' var v=(tool==="eraser")?null:color;',
  ' if(grid[y][x]!==v||(mirrorOn&&grid[y][N-1-x]!==v)){setCell(x,y,v);changed=true;}}',
  'pad.addEventListener("pointerdown",function(e){e.preventDefault();down=true;changed=false;pushHist();',
  ' applyAt(e);try{pad.setPointerCapture(e.pointerId);}catch(err){}render();});',
  'pad.addEventListener("pointermove",function(e){if(!down)return;applyAt(e);render();});',
  'function endStroke(){if(!down)return;down=false;if(!changed)hist.pop();render();refreshUndo();}',
  'pad.addEventListener("pointerup",endStroke);',
  'pad.addEventListener("pointercancel",endStroke);',
  'pad.addEventListener("contextmenu",function(e){e.preventDefault();});',
  'function setTool(t){tool=t;var bs=document.querySelectorAll(".tool");',
  ' for(var i=0;i<bs.length;i++)bs[i].classList.toggle("sel",bs[i].getAttribute("data-tool")===t);}',
  'var toolBtns=document.querySelectorAll(".tool");',
  'for(var ti=0;ti<toolBtns.length;ti++){toolBtns[ti].addEventListener("click",function(){setTool(this.getAttribute("data-tool"));});}',
  'function selectSwatch(btn,c){color=c;var sws=document.querySelectorAll(".sw,.swcustom");',
  ' for(var i=0;i<sws.length;i++)sws[i].classList.remove("sel");btn.classList.add("sel");',
  ' curdot.style.background=c;curhex.textContent=c;}',
  'var swBtns=document.querySelectorAll(".sw");',
  'for(var si=0;si<swBtns.length;si++){swBtns[si].addEventListener("click",function(){selectSwatch(this,this.getAttribute("data-c"));});}',
  'var customSw=document.getElementById("customsw");',
  'var customInput=document.getElementById("customcolor");',
  'customInput.addEventListener("input",function(){customColor=customInput.value;selectSwatch(customSw,customColor);});',
  'var undoBtn=document.getElementById("undo");',
  'function refreshUndo(){undoBtn.classList.toggle("dim",hist.length===0);}',
  'undoBtn.addEventListener("click",function(){if(hist.length){grid=hist.pop();render();refreshUndo();}});',
  'function armConfirm(btn,fn){var label=btn.textContent;var armed=false,t=null;',
  ' btn.addEventListener("click",function(){',
  '  if(!armed){armed=true;btn.textContent="Sure?";btn.classList.add("armed");',
  '   t=setTimeout(function(){armed=false;btn.textContent=label;btn.classList.remove("armed");},2600);}',
  '  else{clearTimeout(t);armed=false;btn.classList.remove("armed");btn.textContent=label;fn();}});}',
  'armConfirm(document.getElementById("clear"),function(){for(var y=0;y<N;y++)for(var x=0;x<N;x++)grid[y][x]=null;render();});',
  'armConfirm(document.getElementById("new"),function(){hist=[];for(var y=0;y<N;y++)for(var x=0;x<N;x++)grid[y][x]=null;render();refreshUndo();});',
  (HAS_MIRROR ?
  'var mirrorBtn=document.getElementById("mirror");' +
  'mirrorBtn.addEventListener("click",function(){mirrorOn=!mirrorOn;' +
  ' mirrorBtn.classList.toggle("on",mirrorOn);mirrorBtn.setAttribute("aria-pressed",mirrorOn?"true":"false");});' : ''),
  'var gridBtn=document.getElementById("gridtog");',
  'gridBtn.addEventListener("click",function(){gridOn=!gridOn;',
  ' gridBtn.classList.toggle("on",gridOn);gridBtn.setAttribute("aria-pressed",gridOn?"true":"false");render();});',
  'var modal=document.getElementById("modal");',
  'function exportPNG(){var s=Math.max(1,Math.floor(512/N));',
  ' var off=document.createElement("canvas");off.width=N*s;off.height=N*s;',
  ' var c2=off.getContext("2d");',
  ' for(var y=0;y<N;y++)for(var x=0;x<N;x++){if(grid[y][x]){c2.fillStyle=grid[y][x];c2.fillRect(x*s,y*s,s,s);}}',
  ' var url=off.toDataURL("image/png");',
  ' document.getElementById("expimg").src=url;',
  ' document.getElementById("expdl").href=url;',
  ' modal.hidden=false;}',
  'document.getElementById("export").addEventListener("click",exportPNG);',
  'document.getElementById("expclose").addEventListener("click",function(){modal.hidden=true;});',
  'modal.addEventListener("click",function(e){if(e.target===modal)modal.hidden=true;});',
  'var rT=null;',
  'window.addEventListener("resize",function(){if(rT)clearTimeout(rT);rT=setTimeout(fit,120);});',
  'window.addEventListener("orientationchange",function(){setTimeout(fit,250);});',
  'selectSwatch(document.querySelector(".sw.sel")||document.querySelector(".sw"),color);',
  'refreshUndo();',
  'fit();',
  '})();',
  '</script>',
  '</body>',
  '</html>'
  ];

  return html.join('\n');
}

window.MoorKit = { build: build };

})();
