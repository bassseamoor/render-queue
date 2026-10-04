/* Ambient sound generator — player around the real ambience-engine.
 * Uses: renderBed(seedStr, kind, seconds, sr) -> {mixL, mixR, sr, seconds}.
 * Playback pattern copied from Seed Lab (AudioBuffer + looped BufferSource).
 * Panel-owned: recipe/seed/duration controls, waveform canvas drawn from the
 * real rendered samples. AudioContext is created on the Play gesture. */
(function(){
'use strict';
var RECIPES = ['rainforest','px-forest','aquarium','molten','px-ember','rainwindow',
  'alien','px-orbital','px-cloud','px-mycel','canal','px-canal','turtle','road'];

TOOLS.ambience = {
  mount: function(host){
    host.innerHTML =
      '<div class="t-controls">'+
        '<label>Recipe <select id="a-kind">'+RECIPES.map(function(r){return '<option>'+r+'</option>';}).join('')+'</select></label>'+
        '<label>Seed <input id="a-seed" value="harbor-night" spellcheck="false"></label>'+
        '<label>Length <input id="a-secs" type="number" value="12" min="2" max="60" style="width:64px"> s</label>'+
        '<button class="btn primary" id="a-play">\u25B6 Generate &amp; play</button>'+
        '<button class="btn" id="a-stop">\u25A0 Stop</button>'+
      '</div>'+
      '<canvas id="a-cv" width="560" height="140"></canvas>'+
      '<div class="meta" id="a-status">Choose a recipe and press play. Rendering is deterministic: the same seed always makes the same sound.</div>';

    var actx = null, src = null, playing = false;

    function drawWave(bed){
      var cv = host.querySelector('#a-cv'), ctx = cv.getContext('2d');
      var W = cv.width, H = cv.height, mid = H/2;
      ctx.fillStyle = '#0b1523'; ctx.fillRect(0,0,W,H);
      ctx.strokeStyle = '#203b52'; ctx.beginPath(); ctx.moveTo(0,mid); ctx.lineTo(W,mid); ctx.stroke();
      ['#5bd8ff','#f4cb77'].forEach(function(col, ch){
        var d = ch ? bed.mixR : bed.mixL;
        ctx.strokeStyle = col; ctx.globalAlpha = ch ? 0.65 : 1; ctx.beginPath();
        var per = Math.floor(d.length / W);
        for (var x=0;x<W;x++){
          var mn=1, mx=-1;
          for (var i=x*per;i<(x+1)*per && i<d.length;i+=7){ var v=d[i]; if(v<mn)mn=v; if(v>mx)mx=v; }
          var y1 = mid - mx*mid*0.92, y2 = mid - mn*mid*0.92;
          ctx.moveTo(x+0.5, y1); ctx.lineTo(x+0.5, y2);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      });
    }

    function stop(){
      playing = false;
      if (src) { try { src.stop(); } catch(e){} src = null; }
      host.querySelector('#a-play').innerHTML = '\u25B6 Generate &amp; play';
    }

    host.querySelector('#a-play').onclick = function(){
      stop();
      try {
        actx = actx || new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === 'suspended') actx.resume();
        var kind = host.querySelector('#a-kind').value;
        var seed = host.querySelector('#a-seed').value.trim() || 'demo-seed';
        var secs = Math.max(2, Math.min(60, +host.querySelector('#a-secs').value || 12));
        var t0 = performance.now();
        var bed = renderBed(seed, kind, secs, actx.sampleRate);
        var ms = Math.round(performance.now()-t0);
        var buf = actx.createBuffer(2, bed.mixL.length, bed.sr);
        buf.getChannelData(0).set(bed.mixL);
        buf.getChannelData(1).set(bed.mixR);
        src = actx.createBufferSource();
        src.buffer = buf; src.loop = true;
        src.connect(actx.destination); src.start();
        playing = true;
        host.querySelector('#a-play').innerHTML = '\u25B6 Playing\u2026 (re-render)';
        host.querySelector('#a-status').textContent =
          'Playing \u201c'+kind+'\u201d \u00B7 seed \u201c'+seed+'\u201d \u00B7 '+secs+'s \u00B7 '+bed.sr+' Hz \u00B7 rendered in '+ms+' ms \u00B7 loop-seamless by construction';
        drawWave(bed);
      } catch(e){
        host.querySelector('#a-status').textContent = 'Could not play: '+e.message;
      }
    };
    host.querySelector('#a-stop').onclick = stop;
    this._stop = stop;
  },
  unmount: function(){ if (this._stop) this._stop(); }
};
})();
