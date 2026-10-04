/* Enemy wave director — visual simulation driven by the real spawn-director.
 * Uses: createSpawnDirector({types, rand, onSpawn, onSwarm, maxAlive, swarmType}),
 *       dir.update(dt), dir.reportKill(), dir.reset(), dir.state() -> {t, alive}.
 * Simulation harness adapted from the component's example.html (real behavior).
 * Panel-owned: canvas markers, unlock list, derived difficulty readout (labeled
 * as derived — the component exposes curves, not a difficulty number). */
(function(){
'use strict';
var TYPES = {
  bat:   {hp:9,  sp:100, dmg:7,  r:10, xp:1,  score:10, unlock:0,               color:'#8d7bff'},
  zombie:{hp:30, sp:46,  dmg:13, r:15, xp:2,  score:8,  unlock:0,               color:'#6fae6f'},
  wraith:{hp:16, sp:138, dmg:9,  r:10, xp:3,  score:7,  unlock:90,              color:'#38e1ff'},
  brute: {hp:150,sp:40,  dmg:22, r:22, xp:12, score:3,  unlock:240, elite:true, color:'#ff8c42'}
};

TOOLS.spawn = {
  mount: function(host){
    host.innerHTML =
      '<div class="t-controls">'+
        '<label>Seed <input id="s-seed" type="number" value="1234" style="width:90px"></label>'+
        '<button class="btn primary" id="s-start">Start simulation</button>'+
        '<button class="btn" id="s-reset">Reset</button>'+
        '<span class="meta" id="s-hud"></span>'+
      '</div>'+
      '<div class="s-main"><canvas id="s-cv" width="520" height="340"></canvas>'+
      '<div class="t-side"><div class="eyebrow">Enemy types (unlock over time)</div><div id="s-types"></div>'+
      '<div class="eyebrow">Difficulty (derived from the real curves)</div><div class="meta" id="s-diff"></div>'+
      '<p class="meta">Interval shrinks, batches grow, HP scales \u00D7(1+t/70). Swarms strike every 45\u201370 s. Markers are simple circles \u2014 the brain is the real thing.</p></div></div>'+
      '<div id="s-banner">\u26A0 SWARM \u26A0</div>';

    var cv = host.querySelector('#s-cv'), ctx = cv.getContext('2d');
    var foes = [], dir = null, raf = 0, last = 0, running = false;
    var banner = host.querySelector('#s-banner');

    function interval(t){ return Math.max(0.22, 1.05 - t*0.0015); }
    function batch(t){ return 1 + Math.floor(t/40); }

    function renderTypes(t){
      host.querySelector('#s-types').innerHTML = Object.keys(TYPES).map(function(k){
        var ty = TYPES[k], un = t >= ty.unlock;
        return '<div class="w-fact"><span style="color:'+ty.color+'">\u25CF</span><b>'+k+(ty.elite?' (elite)':'')+'</b><span class="meta">'+(un?'unlocked':'unlocks at '+ty.unlock+'s')+'</span></div>';
      }).join('');
      var d = 'spawn every '+interval(t).toFixed(2)+'s \u00B7 '+batch(t)+' per batch \u00B7 HP \u00D7'+(1+t/70).toFixed(2)+' \u00B7 damage \u00D7'+(1+t/300).toFixed(2);
      host.querySelector('#s-diff').textContent = d;
    }

    function start(){
      foes = [];
      var seed = parseInt(host.querySelector('#s-seed').value, 10) || 1;
      dir = createSpawnDirector({
        types: TYPES, rand: mulberry32(seed), swarmType: 'bat', maxAlive: 320,
        onSpawn: function(type, s){
          var a = Math.random()*6.283, rad = Math.max(cv.width, cv.height)*0.42;
          foes.push({x:cv.width/2+Math.cos(a)*rad, y:cv.height/2+Math.sin(a)*rad, r:s.r, color:s.color||'#fff'});
        },
        onSwarm: function(){
          banner.style.opacity = 1;
          setTimeout(function(){ banner.style.opacity = 0; }, 1200);
        }
      });
      running = true; last = performance.now();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    }

    function tick(now){
      if (!running) return;
      raf = requestAnimationFrame(tick);
      var dt = Math.min((now-last)/1000, 0.1); last = now;
      dir.update(dt);
      ctx.fillStyle = '#0b0e13'; ctx.fillRect(0,0,cv.width,cv.height);
      ctx.fillStyle = '#3aa'; ctx.beginPath(); ctx.arc(cv.width/2, cv.height/2, 12, 0, 7); ctx.fill();
      for (var i=foes.length-1;i>=0;i--){
        var f = foes[i], dx = cv.width/2-f.x, dy = cv.height/2-f.y, d = Math.hypot(dx,dy)||1;
        f.x += dx/d*40*dt; f.y += dy/d*40*dt;
        if (d < 18) { foes.splice(i,1); dir.reportKill(); continue; }
        ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 7); ctx.fill();
      }
      var st = dir.state();
      host.querySelector('#s-hud').textContent = 't='+st.t.toFixed(0)+'s \u00B7 alive='+st.alive;
      renderTypes(st.t);
    }

    host.querySelector('#s-start').onclick = start;
    host.querySelector('#s-reset').onclick = function(){ foes=[]; if (dir) dir.reset(); renderTypes(0); host.querySelector('#s-hud').textContent=''; };
    renderTypes(0);
    this._stop = function(){ running = false; cancelAnimationFrame(raf); };
  },
  unmount: function(){ if (this._stop) this._stop(); }
};
})();
