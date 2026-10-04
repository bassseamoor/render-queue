/* Automatic graphics quality — live demo of the real perf-governor.
 * Uses: createGovernor() -> {frame(dt) -> quality 0.28..1, reset(), state()}.
 * Particle harness adapted from the component's example.html (real frame
 * times drive the governor). Panel-owned: quality-over-time chart (the
 * component keeps no history), explicitly labeled simulated-fps buttons. */
(function(){
'use strict';
TOOLS.perf = {
  mount: function(host){
    host.innerHTML =
      '<div class="t-controls">'+
        '<button class="btn" id="p-add">+ load</button>'+
        '<button class="btn" id="p-sub">\u2212 load</button>'+
        '<button class="btn" id="p-reset">reset governor</button>'+
        '<span class="meta">or feed it labeled simulated frame times:</span>'+
        '<button class="btn" id="p-sim20">simulate 20 fps</button>'+
        '<button class="btn" id="p-sim60">simulate 60 fps</button>'+
        '<button class="btn" id="p-real">use real frames</button>'+
      '</div>'+
      '<div class="t-main"><canvas id="p-cv" width="420" height="260"></canvas>'+
      '<div class="t-side"><div class="eyebrow">Quality output</div>'+
      '<div class="p-big" id="p-q">100%</div><div class="p-bar"><div id="p-fill"></div></div>'+
      '<div class="meta" id="p-src">source: real measured frame times</div>'+
      '<div class="eyebrow">Quality over time</div><canvas id="p-chart" width="300" height="90"></canvas>'+
      '<p class="meta">120-frame warmup, then: 120 slow frames (&gt;23 ms) \u2192 quality \u22120.10; 600 good frames \u2192 +0.04. Floor 28%. It only <i>reports</i> quality \u2014 applying it is the host\u2019s job.</p></div></div>';

    var cv = host.querySelector('#p-cv'), ctx = cv.getContext('2d');
    var chart = host.querySelector('#p-chart'), cctx = chart.getContext('2d');
    var gov = createGovernor(), load = 40, parts = [];
    var sim = 0; // 0 = real, else fps to simulate
    var samples = [], raf = 0, last = performance.now(), running = true;

    host.querySelector('#p-add').onclick = function(){ load = Math.min(900, load+120); };
    host.querySelector('#p-sub').onclick = function(){ load = Math.max(0, load-120); };
    host.querySelector('#p-reset').onclick = function(){ gov.reset(); samples = []; };
    function setSim(fps, label){
      sim = fps;
      host.querySelector('#p-src').textContent = 'source: ' + label;
    }
    host.querySelector('#p-sim20').onclick = function(){ setSim(20, 'SIMULATED 20 fps (labeled \u2014 not measured)'); };
    host.querySelector('#p-sim60').onclick = function(){ setSim(60, 'SIMULATED 60 fps (labeled \u2014 not measured)'); };
    host.querySelector('#p-real').onclick = function(){ setSim(0, 'real measured frame times'); };

    function drawChart(){
      var W = chart.width, H = chart.height;
      cctx.fillStyle = '#0b1523'; cctx.fillRect(0,0,W,H);
      cctx.strokeStyle = '#f44336'; cctx.setLineDash([4,4]); cctx.beginPath();
      var fy = H - 0.28*H; cctx.moveTo(0,fy); cctx.lineTo(W,fy); cctx.stroke(); cctx.setLineDash([]);
      cctx.strokeStyle = '#5bd8ff'; cctx.lineWidth = 1.5; cctx.beginPath();
      samples.forEach(function(q,i){
        var x = i/(Math.max(1,samples.length-1))*W, y = H - q*H;
        if (i===0) cctx.moveTo(x,y); else cctx.lineTo(x,y);
      });
      cctx.stroke();
      cctx.fillStyle = '#9db1cc'; cctx.font = '10px system-ui';
      cctx.fillText('28% floor', 4, fy-3);
    }

    function tick(now){
      if (!running) return;
      raf = requestAnimationFrame(tick);
      var realDt = Math.min((now-last)/1000, 0.25); last = now;
      var dt = sim ? 1/sim : realDt;
      var q = gov.frame(dt);
      var n = Math.round(load*q);
      while (parts.length < n) parts.push({x:Math.random()*cv.width, y:Math.random()*cv.height, vx:(Math.random()-.5)*200, vy:(Math.random()-.5)*200});
      parts.length = n;
      ctx.fillStyle = '#0b0e13'; ctx.fillRect(0,0,cv.width,cv.height);
      ctx.fillStyle = '#7fd4ff';
      for (var i=0;i<parts.length;i++){
        var p = parts[i], s = 0;
        for (var k=0;k<300;k++) s += Math.sin(k)*Math.cos(p.x); // honest CPU burn per particle
        p.x += p.vx*realDt; p.y += p.vy*realDt;
        if (p.x<0||p.x>cv.width) p.vx *= -1;
        if (p.y<0||p.y>cv.height) p.vy *= -1;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      samples.push(q); if (samples.length > 300) samples.shift();
      host.querySelector('#p-q').textContent = Math.round(q*100)+'%';
      var fill = host.querySelector('#p-fill');
      fill.style.width = (q*100)+'%';
      fill.style.background = q>0.7 ? '#4caf50' : q>0.45 ? '#ff9800' : '#f44336';
      drawChart();
    }
    raf = requestAnimationFrame(tick);
    this._stop = function(){ running = false; cancelAnimationFrame(raf); };
  },
  unmount: function(){ if (this._stop) this._stop(); }
};
})();
