/* Detailed terrain — WebGL2 host around the real terrain-field GLSL.
 * Uses: FIELD_GLSL (inlined verbatim), uniforms seedOff / uEditA[48] / uEditB[48]
 *       / uEditCount / uMicroK, and the fieldRaw+microH+editDelta functions.
 * Host pattern copied from the component's example-webgl.html (proven).
 * Panel-owned: uniform controls, click-to-place brush edits (first UI ever
 * for the 48 edit slots), export-edits-as-JSON (panel format, not the
 * component's — the component defines no save format). */
(function(){
'use strict';
TOOLS.field = {
  mount: function(host){
    host.innerHTML =
      '<div class="t-controls">'+
        '<label>Seed <input id="f-seed" type="number" value="4242" style="width:90px"></label>'+
        '<label>Fine detail <input id="f-micro" type="range" min="0" max="1" step="0.01" value="1"><span id="f-micro-v">1.00</span></label>'+
        '<button class="btn primary" id="f-render">Render</button>'+
      '</div>'+
      '<div class="t-main">'+
        '<canvas id="f-cv" width="360" height="360"></canvas>'+
        '<div class="t-side">'+
          '<div class="eyebrow">Brush edits (up to 48)</div>'+
          '<p class="meta">Click the preview to aim. Then set size and lift, and add the edit.</p>'+
          '<label>Edit size <input id="f-erad" type="range" min="2" max="40" value="12"><span id="f-erad-v">12\u00B0</span></label>'+
          '<label>Lift <input id="f-edelta" type="range" min="-60" max="60" value="20"><span id="f-edelta-v">+20 m</span></label>'+
          '<div class="t-row"><button class="btn" id="f-add">Add edit</button><button class="btn" id="f-clear">Clear edits</button></div>'+
          '<div class="meta" id="f-estat">0 of 48 edit slots used</div>'+
          '<div class="t-row"><button class="btn" id="f-exp">Copy edits as JSON</button></div>'+
          '<p class="meta">Height = ridged terrain + fine detail \u00D7 detail + your edits. Colors are a display ramp; the component outputs meters.</p>'+
        '</div>'+
      '</div>';

    var cv = host.querySelector('#f-cv');
    var gl = cv.getContext('webgl2', {preserveDrawingBuffer:true});
    if (!gl) { host.innerHTML = '<div class="empty">This device has no WebGL2, which the terrain shader needs.</div>'; return; }

    var vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, 'attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }');
    gl.compileShader(vs);
    var fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, 'precision highp float;\n' + window.FIELD_GLSL +
      '\nuniform vec2 uSeed;\nvoid main(){\n'+
      '  vec2 xy = (gl_FragCoord.xy / 360.0 - 0.5) * 2.0;\n'+
      '  vec3 sp = normalize(vec3(xy.x, 1.0, xy.y));\n'+
      '  float h = fieldRaw(sp + vec3(uSeed, 0.0));\n'+
      '  h += microH((gl_FragCoord.xy / 360.0 - 0.5) * 200.0);\n'+
      '  h += editDelta(sp);\n'+
      '  float t = clamp(h / 60.0 + 0.5, 0.0, 1.0);\n'+
      '  vec3 col = mix(vec3(0.05,0.10,0.16), vec3(0.55,0.75,0.55), smoothstep(0.35,0.6,t));\n'+
      '  col = mix(col, vec3(0.9,0.92,0.95), smoothstep(0.6,0.85,t));\n'+
      '  col = mix(vec3(0.10,0.16,0.28), col, smoothstep(0.28,0.35,t));\n'+
      '  gl_FragColor = vec4(col, 1.0);\n}');
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      host.innerHTML = '<div class="empty">Shader failed: '+gl.getShaderInfoLog(fs)+'</div>'; return;
    }
    var pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    gl.useProgram(pr);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var uSeed = gl.getUniformLocation(pr, 'uSeed');
    var uSeedOff = gl.getUniformLocation(pr, 'seedOff');
    var uA = gl.getUniformLocation(pr, 'uEditA'), uB = gl.getUniformLocation(pr, 'uEditB');
    var uC = gl.getUniformLocation(pr, 'uEditCount'), uM = gl.getUniformLocation(pr, 'uMicroK');

    var editA = new Float32Array(48*4), editB = new Float32Array(48), editCount = 0;
    var aim = [0, 1, 0]; // unit direction of next edit

    function seedTuple(s){ return [(s%100)*0.13, (s%77)*0.29, (s%53)*0.41]; }
    function render(){
      var s = parseInt(host.querySelector('#f-seed').value, 10) || 0;
      var st = seedTuple(s);
      gl.uniform2f(uSeed, st[0], st[1]);
      gl.uniform3f(uSeedOff, st[0], st[1], st[2]);
      gl.uniform4fv(uA, editA); gl.uniform1fv(uB, editB);
      gl.uniform1i(uC, editCount);
      gl.uniform1f(uM, parseFloat(host.querySelector('#f-micro').value));
      gl.viewport(0, 0, 360, 360);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      host.querySelector('#f-estat').textContent = editCount + ' of 48 edit slots used';
    }

    cv.addEventListener('click', function(ev){
      var r = cv.getBoundingClientRect();
      var xy = [((ev.clientX-r.left)/r.width - 0.5)*2, ((ev.clientY-r.top)/r.height - 0.5)*2];
      var v = [xy[0], 1, xy[1]], l = Math.hypot(v[0],v[1],v[2]);
      aim = [v[0]/l, v[1]/l, v[2]/l];
      render();
    });

    host.querySelector('#f-micro').addEventListener('input', function(ev){
      host.querySelector('#f-micro-v').textContent = (+ev.target.value).toFixed(2); render();
    });
    host.querySelector('#f-erad').addEventListener('input', function(ev){
      host.querySelector('#f-erad-v').textContent = ev.target.value + '\u00B0';
    });
    host.querySelector('#f-edelta').addEventListener('input', function(ev){
      var v = +ev.target.value;
      host.querySelector('#f-edelta-v').textContent = (v>=0?'+':'') + v + ' m';
    });
    host.querySelector('#f-render').onclick = render;
    host.querySelector('#f-add').onclick = function(){
      if (editCount >= 48) { toast('All 48 edit slots are full'); return; }
      var rad = (+host.querySelector('#f-erad').value) * Math.PI/180;
      var d = +host.querySelector('#f-edelta').value;
      editA.set([aim[0], aim[1], aim[2], rad], editCount*4);
      editB[editCount] = d;
      editCount++;
      render();
    };
    host.querySelector('#f-clear').onclick = function(){
      editA = new Float32Array(48*4); editB = new Float32Array(48); editCount = 0; render();
    };
    host.querySelector('#f-exp').onclick = function(){
      var out = [];
      for (var i=0;i<editCount;i++) out.push({dir:[+editA[i*4].toFixed(4),+editA[i*4+1].toFixed(4),+editA[i*4+2].toFixed(4)], radiusRad:+editA[i*4+3].toFixed(4), deltaM:editB[i]});
      var txt = JSON.stringify({format:'pulse-v2/terrain-field-edits/1', edits:out}, null, 1);
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){ toast('Edits copied ('+out.length+')'); });
      else toast('Clipboard unavailable');
    };

    this._gl = gl;
    render();
  },
  unmount: function(){ /* context dies with the canvas */ }
};
})();
