/* Planet color sets — viewer over the real palettes data tables.
 * Uses: PTEX / MAT (inlined verbatim, frozen). No computation in component.
 * Panel-owned: swatch grid, planet preview (drawn from the real color values),
 * temporary experiment overrides (panel localStorage state, clearly labeled —
 * the component has no edit model and no save format). */
(function(){
'use strict';
var EXP_KEY = 'pulse-v2.palette-exp';
function loadExp(){ try { return JSON.parse(localStorage.getItem(EXP_KEY)||'{}'); } catch(e){ return {}; } }
function saveExp(e){ try { localStorage.setItem(EXP_KEY, JSON.stringify(e)); } catch(x){} }
function hex(n){ return '#'+n.toString(16).padStart(6,'0'); }

TOOLS.palettes = {
  mount: function(host){
    var type = 'TERRAN';
    var exp = loadExp(); // {TYPE: {fieldKey: cssColor}}
    function eff(t, key, src){
      return (exp[t] && exp[t][key]) ? exp[t][key] : src;
    }
    function isExp(t, key){ return !!(exp[t] && exp[t][key]); }

    host.innerHTML =
      '<div class="t-controls">'+
        '<label>Planet type <select id="p-type"></select></label>'+
        '<span class="meta" id="p-expnote"></span>'+
        '<button class="btn" id="p-reset">Reset experiments</button>'+
      '</div>'+
      '<div class="p-main"><canvas id="p-cv" width="240" height="240"></canvas>'+
      '<div class="p-swatches" id="p-sw"></div></div>'+
      '<p class="meta">Click any swatch to try a temporary color. <b>Source</b> = the saved component tables. <b>Experiment</b> = your temporary override, kept on this device only.</p>'+
      '<input type="color" id="p-pick" style="position:fixed;left:-9999px">';

    var sel = host.querySelector('#p-type');
    Object.keys(PTEX).forEach(function(t){
      var o = document.createElement('option'); o.value = t; o.textContent = t; sel.appendChild(o);
    });
    sel.value = type;

    var FIELDS = [
      ['land',0],['land',1],['water',0],['water',1],['bands',0],['bands',1],
      ['sky',0],['sky',1],['atmo',-1],
      ['grass',0],['grass',1],['leaf',0],['leaf',1],['bark',-1],
      ['rock',0],['rock',1],['flower',0],['flower',1],['flower',2],['flower',3],['soil',-1]
    ];

    function fieldVal(t, f, i){
      var tbl = (f==='grass'||f==='leaf'||f==='bark'||f==='rock'||f==='flower'||f==='soil') ? MAT[t] : PTEX[t];
      var v = tbl[f];
      if (v == null) return null;
      if (i < 0) return (typeof v === 'number') ? hex(v) : v;
      return v[i] || null;
    }

    function drawPreview(){
      var cv = host.querySelector('#p-cv'), ctx = cv.getContext('2d');
      var t = type;
      var sky0 = eff(t,'sky0',fieldVal(t,'sky',0)), sky1 = eff(t,'sky1',fieldVal(t,'sky',1));
      var atmo = eff(t,'atmo',fieldVal(t,'atmo',-1));
      var g = ctx.createLinearGradient(0,0,0,240);
      g.addColorStop(0, sky0||'#0a0a12'); g.addColorStop(1, sky1||'#1a1a2a');
      ctx.fillStyle = g; ctx.fillRect(0,0,240,240);
      var cx=120, cy=120, R=78;
      // atmosphere glow
      ctx.beginPath(); ctx.arc(cx,cy,R+10,0,7);
      ctx.fillStyle = (atmo||'#88bbff') + '44'; ctx.fill();
      // planet body: land base with water/bands
      var land0 = eff(t,'land0',fieldVal(t,'land',0)) || eff(t,'bands0',fieldVal(t,'bands',0)) || '#555';
      var land1 = eff(t,'land1',fieldVal(t,'land',1)) || eff(t,'bands1',fieldVal(t,'bands',1)) || '#777';
      var water0 = eff(t,'water0',fieldVal(t,'water',0));
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,R,0,7); ctx.clip();
      var bg = ctx.createLinearGradient(cx-R,cy-R,cx+R,cy+R);
      bg.addColorStop(0,land0); bg.addColorStop(1,land1);
      ctx.fillStyle = bg; ctx.fillRect(cx-R,cy-R,R*2,R*2);
      if (water0) {
        var water1 = eff(t,'water1',fieldVal(t,'water',1));
        ctx.fillStyle = water0; ctx.globalAlpha = 0.75;
        for (var i=0;i<5;i++){ ctx.beginPath();
          ctx.ellipse(cx-R+((i*67)%160), cy-R+((i*97)%160), 34, 20, i, 0, 7); ctx.fill(); }
        ctx.globalAlpha = 1;
        ctx.fillStyle = water1||water0; ctx.globalAlpha=0.35;
        ctx.fillRect(cx-R,cy,R*2,R);
        ctx.globalAlpha = 1;
      }
      // terminator shading
      var sh = ctx.createLinearGradient(cx-R,0,cx+R,0);
      sh.addColorStop(0,'rgba(0,0,0,0.55)'); sh.addColorStop(0.55,'rgba(0,0,0,0)');
      ctx.fillStyle = sh; ctx.fillRect(cx-R,cy-R,R*2,R*2);
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx,cy,R,0,7);
      ctx.strokeStyle = atmo||'#88bbff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#9db1cc'; ctx.font = '12px system-ui';
      ctx.fillText(t + ' \u2014 preview from real table values', 12, 228);
    }

    function render(){
      var t = type, sw = host.querySelector('#p-sw'), h = '';
      FIELDS.forEach(function(fi){
        var f = fi[0], i = fi[1], v = fieldVal(t,f,i);
        if (!v) return;
        var key = f+i, c = eff(t,key,v), ex = isExp(t,key);
        h += '<button class="p-sw'+(ex?' exp':'')+'" data-k="'+key+'" data-c="'+c+'" title="'+f+(i>=0?'['+i+']':'')+(ex?' \u2014 experiment':' \u2014 source')+'">'+
          '<span class="p-chip" style="background:'+c+'"></span>'+
          '<span class="p-fl">'+f+(i>=0?' '+(i+1):'')+'</span>'+
          (ex?'<span class="p-ex">experiment</span>':'<span class="p-src">source</span>')+'</button>';
      });
      sw.innerHTML = h || '<div class="empty">No colors for this type.</div>';
      Array.prototype.forEach.call(sw.querySelectorAll('.p-sw'), function(el){
        el.onclick = function(){
          var k = el.dataset.k, pick = host.querySelector('#p-pick');
          pick.value = el.dataset.c;
          pick.onchange = function(){
            exp[t] = exp[t]||{}; exp[t][k] = pick.value; saveExp(exp); render(); drawPreview();
          };
          pick.click();
        };
      });
      var n = exp[t] ? Object.keys(exp[t]).length : 0;
      host.querySelector('#p-expnote').textContent = n ? n+' temporary experiment'+(n>1?'s':'')+' on this type' : 'showing saved source colors';
      drawPreview();
    }

    sel.onchange = function(){ type = sel.value; render(); };
    host.querySelector('#p-reset').onclick = function(){ exp = {}; saveExp(exp); render(); };
    render();
  },
  unmount: function(){}
};
})();
