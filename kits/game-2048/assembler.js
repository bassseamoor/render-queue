// Moor kit: game-2048 v1.0.0
// Classic 2048: swipe/arrow keys to slide, merge matching tiles, chase 2048.
// Board size (3x3/4x4/5x5), theme (midnight/paper/neon), undo + move counter toggles.
(function(){
'use strict';

var VALID_BOARDS = ['4x4','5x5','3x3'];
var VALID_VIBES = ['midnight','paper','neon'];
var VALID_EXTRAS = ['undo','moves'];

function normConfig(cfg){
  cfg = (cfg && typeof cfg === 'object') ? cfg : {};
  var board = VALID_BOARDS.indexOf(cfg.board) >= 0 ? cfg.board : '4x4';
  var vibe = VALID_VIBES.indexOf(cfg.vibe) >= 0 ? cfg.vibe : 'midnight';
  var raw = Array.isArray(cfg.extras) ? cfg.extras : ['undo'];
  var extras = [];
  for(var i=0;i<raw.length;i++){ if(VALID_EXTRAS.indexOf(raw[i])>=0 && extras.indexOf(raw[i])<0) extras.push(raw[i]); }
  return { board:board, vibe:vibe, extras:extras };
}

function esc(s){
  return String(s==null?'':s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function build(config){
  var c = normConfig(config);
  var N = parseInt(c.board, 10);
  var UNDO_ON = c.extras.indexOf('undo') >= 0;
  var MOVES_ON = c.extras.indexOf('moves') >= 0;

  var css = [
    '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}',
    'html,body{margin:0;padding:0}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;min-height:100vh;',
    '  display:flex;flex-direction:column;align-items:center;background:var(--bg);color:var(--txt);',
    '  touch-action:manipulation;overscroll-behavior:none;-webkit-user-select:none;user-select:none}',
    'body[data-vibe="midnight"]{--bg:#0b0d12;--panel:#161b26;--cell:rgba(255,255,255,.07);--txt:#f2f4f8;--muted:#9aa3b2;--btn:#232b3d;--btnhi:#2f3a52;--accent:#7de3ff}',
    'body[data-vibe="paper"]{--bg:#f4efe3;--panel:#e7dcc4;--cell:rgba(120,100,70,.16);--txt:#4a4238;--muted:#8a7d68;--btn:#ded2b8;--btnhi:#d3c5a6;--accent:#c96a1e}',
    'body[data-vibe="neon"]{--bg:#05050f;--panel:#0d0d24;--cell:rgba(130,130,255,.09);--txt:#eef0ff;--muted:#8f93c9;--btn:#181840;--btnhi:#22225c;--accent:#7df9ff}',
    '#app{width:100%;max-width:460px;padding:18px 16px 40px;display:flex;flex-direction:column;gap:14px}',
    '#top{display:flex;align-items:flex-end;justify-content:space-between}',
    'h1{margin:0;font-size:44px;font-weight:800;letter-spacing:-1px}',
    '#scores{display:flex;gap:8px}',
    '.sbox{background:var(--panel);border-radius:12px;padding:8px 14px;text-align:center;min-width:74px}',
    '.sbox .lab{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)}',
    '.sbox .val{font-size:22px;font-weight:800}',
    '#sub{color:var(--muted);font-size:14px;margin-top:-8px}',
    '#movesline{color:var(--muted);font-size:13px;min-height:18px}',
    '#boardwrap{position:relative;width:100%}',
    '#board{position:relative;width:100%;aspect-ratio:1/1;background:var(--panel);border-radius:16px;touch-action:none}',
    '#grid{position:absolute;inset:10px;display:grid;gap:8px}',
    '.cell{border-radius:10px;background:var(--cell)}',
    '#tiles{position:absolute;inset:10px}',
    '.tile{position:absolute;left:0;top:0;transition:transform 130ms ease-in-out;will-change:transform}',
    '.tin{position:absolute;left:4px;top:4px;right:4px;bottom:4px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800}',
    '#board.n3 .tin{font-size:52px}',
    '#board.n4 .tin{font-size:38px}',
    '#board.n5 .tin{font-size:28px}',
    '#board .tin.big{font-size:.62em}',
    '.v2{background:#eee4da;color:#776e65}.v4{background:#ede0c8;color:#776e65}',
    '.v8{background:#f2b179;color:#f9f6f2}.v16{background:#f59563;color:#f9f6f2}',
    '.v32{background:#f67c5f;color:#f9f6f2}.v64{background:#f65e3b;color:#f9f6f2}',
    '.v128{background:#edcf72;color:#f9f6f2}.v256{background:#edcc61;color:#f9f6f2}',
    '.v512{background:#edc850;color:#f9f6f2}.v1024{background:#edc53f;color:#f9f6f2}',
    '.v2048{background:#edc22e;color:#f9f6f2}.vbig{background:#3c3a32;color:#f9f6f2}',
    'body[data-vibe="neon"] .tin{background:#101032;border:1px solid rgba(140,140,255,.25)}',
    'body[data-vibe="neon"] .v2{color:#cfd2ff}body[data-vibe="neon"] .v4{color:#a9adff}',
    'body[data-vibe="neon"] .v8{color:#ffb179;text-shadow:0 0 12px #f2b179}body[data-vibe="neon"] .v16{color:#ff9a63;text-shadow:0 0 12px #f59563}',
    'body[data-vibe="neon"] .v32{color:#ff7c5f;text-shadow:0 0 12px #f67c5f}body[data-vibe="neon"] .v64{color:#ff6a4d;text-shadow:0 0 14px #f65e3b}',
    'body[data-vibe="neon"] .v128{color:#ffe14d;text-shadow:0 0 14px #edcf72}body[data-vibe="neon"] .v256{color:#ffd94d;text-shadow:0 0 14px #edcc61}',
    'body[data-vibe="neon"] .v512{color:#ffd24d;text-shadow:0 0 16px #edc850}body[data-vibe="neon"] .v1024{color:#ffce3f;text-shadow:0 0 16px #edc53f}',
    'body[data-vibe="neon"] .v2048{color:#7df9ff;text-shadow:0 0 18px #7df9ff}body[data-vibe="neon"] .vbig{color:#ff8ad1;text-shadow:0 0 18px #ff8ad1}',
    '.tile.spawn .tin{animation:spawn 160ms ease-out}',
    '.tile.pop .tin{animation:pop 180ms ease-out}',
    '@keyframes spawn{0%{transform:scale(0)}60%{transform:scale(1.12)}100%{transform:scale(1)}}',
    '@keyframes pop{0%{transform:scale(1)}45%{transform:scale(1.22)}100%{transform:scale(1)}}',
    '#btnrow{display:flex;gap:10px}',
    'button{flex:1;min-height:52px;border:0;border-radius:14px;background:var(--btn);color:var(--txt);',
    '  font-size:17px;font-weight:700;font-family:inherit;cursor:pointer}',
    'button:active{background:var(--btnhi)}',
    'button.disabled{opacity:.35}',
    '.overlay{position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;',
    '  background:color-mix(in srgb, var(--bg) 72%, transparent);border-radius:16px;text-align:center;padding:20px}',
    '.overlay[hidden]{display:none}',
    '.overlay h2{margin:0;font-size:34px}',
    '.overlay p{margin:0;color:var(--muted)}',
    '.overlay button{flex:none;min-width:200px}',
    '#hint{text-align:center;color:var(--muted);font-size:13px}'
  ];

  var js = [
    '(function(){',
    "'use strict';",
    'var N=' + N + ', UNDO_ON=' + UNDO_ON + ', MOVES_ON=' + MOVES_ON + ';',
    'var tiles=[], nextId=1, score=0, best=0, moves=0;',
    'var won=false, over=false, keepGoing=false, undoStack=[];',
    'var tileEls={}, elBoard, elGrid, elTiles, elScore, elBest, elMoves, elMovesLine, elUndo, elNew;',
    'var elOver, elOverScore, elWin, elWinScore;',
    'try{ best=parseInt(localStorage.getItem("moor2048best")||"0",10)||0; }catch(e){ best=0; }',
    'function saveBest(){ try{ localStorage.setItem("moor2048best", String(best)); }catch(e){} }',
    'function $(id){ return document.getElementById(id); }',
    'function onTap(el, fn){ el.addEventListener("pointerup", function(e){ e.preventDefault(); fn(); }); }',
    'function at(r,c){ for(var i=0;i<tiles.length;i++){ var t=tiles[i]; if(t.r===r&&t.c===c) return t; } return null; }',
    'function removeTile(t){ for(var i=0;i<tiles.length;i++){ if(tiles[i].id===t.id){ tiles.splice(i,1); return; } } }',
    'function emptyCells(){ var e=[]; for(var r=0;r<N;r++) for(var c=0;c<N;c++) if(!at(r,c)) e.push([r,c]); return e; }',
    'function addRandom(){ var e=emptyCells(); if(!e.length) return;',
    '  var cell=e[Math.floor(Math.random()*e.length)];',
    '  tiles.push({id:nextId++, v:(Math.random()<0.9?2:4), r:cell[0], c:cell[1], fresh:true}); }',
    'function snapshot(){ return { tiles:tiles.map(function(t){ return {id:t.id,v:t.v,r:t.r,c:t.c}; }),',
    '  score:score, moves:moves, won:won, keepGoing:keepGoing }; }',
    'function pushUndo(){ undoStack.push(snapshot()); if(undoStack.length>20) undoStack.shift(); }',
    'function doUndo(){ if(!undoStack.length||over) return;',
    '  var s=undoStack.pop(); tiles=s.tiles; score=s.score; moves=s.moves; won=s.won; keepGoing=s.keepGoing;',
    '  nextId=tiles.reduce(function(m,t){ return Math.max(m,t.id); },0)+1;',
    '  tiles.forEach(function(t){ t.fresh=false; t.pop=false; });',
    '  elOver.hidden=true; elWin.hidden=true; render(); }',
    'function newGame(){ tiles=[]; nextId=1; score=0; moves=0; won=false; over=false; keepGoing=false; undoStack=[];',
    '  addRandom(); addRandom(); elOver.hidden=true; elWin.hidden=true; render(); }',
    'function linesFor(dir){ var L=[],r,c,l;',
    '  if(dir===0){ for(c=0;c<N;c++){ l=[]; for(r=0;r<N;r++) l.push([r,c]); L.push(l); } }',
    '  else if(dir===2){ for(c=0;c<N;c++){ l=[]; for(r=N-1;r>=0;r--) l.push([r,c]); L.push(l); } }',
    '  else if(dir===3){ for(r=0;r<N;r++){ l=[]; for(c=0;c<N;c++) l.push([r,c]); L.push(l); } }',
    '  else { for(r=0;r<N;r++){ l=[]; for(c=N-1;c>=0;c--) l.push([r,c]); L.push(l); } }',
    '  return L; }',
    'function doMove(dir){',
    '  if(over) return;',
    '  pushUndo();',
    '  var moved=false, gained=0, merged={};',
    '  var lines=linesFor(dir);',
    '  for(var li=0; li<lines.length; li++){',
    '    var line=lines[li], vals=[], i, t;',
    '    for(i=0;i<line.length;i++){ t=at(line[i][0],line[i][1]); if(t) vals.push(t); }',
    '    var target=0; i=0;',
    '    while(i<vals.length){',
    '      var t0=vals[i], nr=line[target][0], nc=line[target][1];',
    '      if(i+1<vals.length && vals[i+1].v===t0.v && !merged[t0.id] && !merged[vals[i+1].id]){',
    '        var t1=vals[i+1]; removeTile(t1);',
    '        t0.v*=2; gained+=t0.v; t0.pop=true; merged[t0.id]=1; moved=true;',
    '        t0.r=nr; t0.c=nc; i+=2;',
    '      } else {',
    '        if(t0.r!==nr||t0.c!==nc) moved=true;',
    '        t0.r=nr; t0.c=nc; i+=1;',
    '      }',
    '      target++;',
    '    }',
    '  }',
    '  if(!moved){ undoStack.pop();',
    '    if(!canMove()){ over=true; elOverScore.textContent=score; elOver.hidden=false; }',
    '    return; }',
    '  score+=gained; moves++;',
    '  if(score>best){ best=score; saveBest(); }',
    '  addRandom(); render(); checkEnd();',
    '}',
    'function canMove(){',
    '  if(emptyCells().length) return true;',
    '  for(var r=0;r<N;r++) for(var c=0;c<N;c++){ var t=at(r,c); if(!t) continue;',
    '    var a=at(r+1,c), b=at(r,c+1);',
    '    if((a&&a.v===t.v)||(b&&b.v===t.v)) return true; }',
    '  return false; }',
    'function checkEnd(){',
    '  var has=false; for(var i=0;i<tiles.length;i++) if(tiles[i].v>=2048) has=true;',
    '  if(has && !won && !keepGoing){ won=true; elWinScore.textContent=score; elWin.hidden=false; return; }',
    '  if(!canMove()){ over=true; elOverScore.textContent=score; elOver.hidden=false; } }',
    'function render(){',
    '  elScore.textContent=score; elBest.textContent=best;',
    '  if(MOVES_ON) elMoves.textContent=moves;',
    '  if(UNDO_ON) elUndo.classList.toggle("disabled", !undoStack.length);',
    '  var seen={}, i, t, el, inner, cls;',
    '  for(i=0;i<tiles.length;i++){ t=tiles[i]; seen[t.id]=1; el=tileEls[t.id];',
    '    if(!el){ el=document.createElement("div"); inner=document.createElement("div");',
    '      el.appendChild(inner); el.style.width=(100/N)+"%%"; el.style.height=(100/N)+"%%";',
    '      tileEls[t.id]=el; elTiles.appendChild(el); }',
    '    inner=el.firstChild;',
    '    inner.className="tin "+(t.v<=2048?("v"+t.v):"vbig")+(t.v>=1024?" big":"");',
    '    inner.textContent=t.v;',
    '    cls="tile"; if(t.fresh) cls+=" spawn"; if(t.pop) cls+=" pop";',
    '    el.className=cls;',
    '    el.style.transform="translate("+(t.c*100)+"%%,"+(t.r*100)+"%%)";',
    '    el.style.zIndex=t.pop?"3":"2"; }',
    '  Object.keys(tileEls).forEach(function(id){ if(!seen[id]){ var o=tileEls[id];',
    '    if(o.parentNode) o.parentNode.removeChild(o); delete tileEls[id]; } });',
    '  tiles.forEach(function(x){ x.fresh=false; x.pop=false; });',
    '}',
    'function init(){',
    '  elBoard=$("board"); elBoard.classList.add("n"+N);',
    '  elGrid=$("grid"); elGrid.style.gridTemplateColumns="repeat("+N+",1fr)";',
    '  for(var i=0;i<N*N;i++){ var d=document.createElement("div"); d.className="cell"; elGrid.appendChild(d); }',
    '  elTiles=$("tiles"); elScore=$("score"); elBest=$("best"); elUndo=$("undo"); elNew=$("newgame");',
    '  elOver=$("over"); elOverScore=$("overscore"); elWin=$("win"); elWinScore=$("winscore");',
    '  if(MOVES_ON){ elMoves=$("moves"); elMovesLine=$("movesline"); }',
    '  var sx=0, sy=0, tracking=false;',
    '  elBoard.addEventListener("touchstart", function(e){ var t=e.changedTouches[0]; sx=t.clientX; sy=t.clientY; tracking=true; }, {passive:true});',
    '  elBoard.addEventListener("touchend", function(e){ if(!tracking) return; tracking=false;',
    '    var t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy;',
    '    var ax=Math.abs(dx), ay=Math.abs(dy); if(Math.max(ax,ay)<24) return;',
    '    if(ax>ay) doMove(dx>0?1:3); else doMove(dy>0?2:0); }, {passive:true});',
    '  elBoard.addEventListener("touchmove", function(e){ e.preventDefault(); }, {passive:false});',
    '  document.addEventListener("keydown", function(e){ var k=e.key, d=-1;',
    '    if(k==="ArrowUp"||k==="w"||k==="W") d=0; else if(k==="ArrowRight"||k==="d"||k==="D") d=1;',
    '    else if(k==="ArrowDown"||k==="s"||k==="S") d=2; else if(k==="ArrowLeft"||k==="a"||k==="A") d=3;',
    '    if(d>=0){ e.preventDefault(); doMove(d); } });',
    '  onTap(elNew, newGame);',
    '  if(UNDO_ON) onTap(elUndo, doUndo);',
    '  onTap($("overnew"), newGame); onTap($("winnew"), newGame);',
    '  onTap($("winkkeep"), function(){ keepGoing=true; elWin.hidden=true; });',
    '  window.MOOR_DEBUG={',
    '    set:function(vals){ tiles=[]; nextId=1;',
    '      for(var i=0;i<vals.length&&i<N*N;i++) if(vals[i]) tiles.push({id:nextId++,v:vals[i],r:Math.floor(i/N),c:i%N,fresh:false});',
    '      over=false; won=false; keepGoing=false; undoStack=[]; elOver.hidden=true; elWin.hidden=true; render(); },',
    '    move:doMove,',
    '    state:function(){ return {score:score, over:over, won:won, keepGoing:keepGoing,',
    '      vals:tiles.map(function(t){ return t.v; }).sort(function(a,b){ return a-b; }).join(",") }; }',
    '  };',
    '  newGame();',
    '}',
    'if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init); else init();',
    '})();'
  ];

  // fix the %% escapes used above (kept literal in source to survive join)
  var jsStr = js.join('\n').replace(/%%/g, '%');

  var undoBtn = UNDO_ON ? '<button id="undo">↩ Undo</button>' : '';
  var movesLine = MOVES_ON ? '<div id="movesline">Moves: <span id="moves">0</span></div>' : '<div id="movesline"></div>';

  var html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">',
    '<meta name="theme-color" content="' + (c.vibe === 'paper' ? '#f4efe3' : c.vibe === 'neon' ? '#05050f' : '#0b0d12') + '">',
    '<title>2048</title>',
    '<style>' + css.join('\n') + '</style>',
    '</head>',
    '<body data-vibe="' + esc(c.vibe) + '">',
    '<div id="app">',
    '  <div id="top"><h1>2048</h1>',
    '    <div id="scores"><div class="sbox"><div class="lab">Score</div><div class="val" id="score">0</div></div>',
    '    <div class="sbox"><div class="lab">Best</div><div class="val" id="best">0</div></div></div>',
    '  </div>',
    '  <div id="sub">Join the numbers and get to <b>2048</b>.</div>',
    '  ' + movesLine,
    '  <div id="boardwrap"><div id="board"><div id="grid"></div><div id="tiles"></div>',
    '    <div class="overlay" id="over" hidden><h2>Game over</h2><p>Score: <span id="overscore">0</span></p><button id="overnew">Try again</button></div>',
    '    <div class="overlay" id="win" hidden><h2>🎉 You win!</h2><p>You reached 2048 — score <span id="winscore">0</span></p><button id="winkkeep">Keep going</button><button id="winnew">New game</button></div>',
    '  </div></div>',
    '  <div id="btnrow"><button id="newgame">New game</button>' + undoBtn + '</div>',
    '  <div id="hint">Swipe on the board, or use arrow keys.</div>',
    '</div>',
    '<script>' + jsStr + '</' + 'script>',
    '</body>',
    '</html>'
  ].join('\n');

  return html;
}

window.MoorKit = { build: build };
})();
