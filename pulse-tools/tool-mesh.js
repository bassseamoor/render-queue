/* City geometry builder — WebGL host around the real mesh-builder + materials.
 * Uses: CityMesh + shape helpers (box, bevelBox, dome, cylinder, sphere),
 *       MESH_FRAG (the proven fragment shader from the component's example),
 *       attribute layout + neutral-sampler setup + orbit rig from example.html.
 * Panel-owned: shape/material picker UI, shape list, rebuild-on-change.
 * Honest limits: materials 20/21 render flat (texture painters not recovered);
 * roundCap is a city-macro primitive, not offered as a general shape. */
(function(){
'use strict';
var MAT_NAMES = {
  1:'facade glass', 2:'facade stone', 3:'facade brick', 4:'masonry', 5:'stone',
  6:'water', 8:'metal', 9:'emissive glass', 10:'tile',
  12:'jointed course', 13:'fine stone', 14:'seamed panel', 15:'ribbed',
  16:'slatted', 17:'paneled metal', 18:'trim', 20:'blimp marquee*', 21:'billboard*',
  22:'signage', 23:'foliage', 24:'glass wall', 25:'interior', 26:'beacon',
  27:'smoke', 28:'graffiti', 29:'brushed metal', 30:'copper', 31:'prop trim', 32:'flag'
};
var SHAPES = ['box','bevelBox','dome','cylinder','sphere'];

TOOLS.mesh = {
  mount: function(host){
    host.innerHTML =
      '<div class="t-main">'+
        '<canvas id="m-cv" width="460" height="360"></canvas>'+
        '<div class="t-side">'+
          '<div class="eyebrow">Add a shape</div>'+
          '<label>Shape <select id="m-shape">'+SHAPES.map(function(s){return '<option>'+s+'</option>';}).join('')+'</select></label>'+
          '<label>Material <select id="m-mat"></select></label>'+
          '<label>Color <input id="m-color" type="color" value="#b8b0a4"></label>'+
          '<div class="t-dims"><label>W <input id="m-w" type="number" value="4" step="0.5"></label>'+
          '<label>H <input id="m-h" type="number" value="3" step="0.5"></label>'+
          '<label>D <input id="m-d" type="number" value="4" step="0.5"></label></div>'+
          '<div class="t-dims"><label>X <input id="m-x" type="number" value="0" step="1"></label>'+
          '<label>Z <input id="m-z" type="number" value="0" step="1"></label></div>'+
          '<div class="t-row"><button class="btn primary" id="m-add">Add shape</button><button class="btn" id="m-clear">Clear all</button></div>'+
          '<div class="eyebrow">Scene</div><div class="meta" id="m-list">empty</div>'+
          '<div class="meta" id="m-info"></div>'+
          '<p class="meta">Drag the preview to orbit. * Materials 20/21 need texture painters that were not recovered \u2014 they render flat grey.</p>'+
        '</div>'+
      '</div>';

    var matSel = host.querySelector('#m-mat');
    Object.keys(MAT_NAMES).forEach(function(id){
      var o = document.createElement('option');
      o.value = id; o.textContent = id + ' \u2014 ' + MAT_NAMES[id];
      matSel.appendChild(o);
    });
    matSel.value = '2';

    var cv = host.querySelector('#m-cv');
    var gl = cv.getContext('webgl2', {preserveDrawingBuffer:true}) || cv.getContext('webgl', {preserveDrawingBuffer:true});
    if (!gl) { host.innerHTML = '<div class="empty">This device has no WebGL, which the city shader needs.</div>'; return; }

    var VERT = 'attribute vec3 p; attribute vec3 n; attribute vec4 col; attribute vec2 uv; attribute vec4 info;\n'+
      'uniform mat4 uMVP; varying vec3 vPosition,vNormal,vTint; varying vec2 vTex,vBuild; varying vec4 vInfo,vShadow; varying float vFade,vProgress;\n'+
      'void main(){ vPosition=p; vNormal=n; vTint=col.rgb; vTex=uv; vBuild=vec2(0.); vInfo=info; vShadow=vec4(0.); vFade=1.; vProgress=0.;\n'+
      ' gl_Position=uMVP*vec4(p,1.); }';
    function sh(t,src){ var s=gl.createShader(t); gl.shaderSource(s,src); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, window.MESH_FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);

    var buf = gl.createBuffer(), ibuf = gl.createBuffer();
    function attr(name, size, off){ var l=gl.getAttribLocation(prog,name);
      gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l,size,gl.FLOAT,false,23*4,off*4); }
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    attr('p',3,0); attr('n',3,3); attr('col',3,6); attr('uv',2,13); attr('info',4,15);

    function tex1(r,g,b){ var t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([r,g,b,255]));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST); return t; }
    ['uMaterial','uBlimpSign','uBillboard','uFoliage','uSignage','uGraffiti','uFlag','uShadow'].forEach(function(n,i){
      var u=gl.getUniformLocation(prog,n); gl.uniform1i(u,i); gl.activeTexture(gl.TEXTURE0+i); gl.bindTexture(gl.TEXTURE_2D, tex1(128,128,128)); });
    function uf(n,v){ var u=gl.getUniformLocation(prog,n); if(u) gl.uniform1f(u,v); }
    function uf3(n,a){ var u=gl.getUniformLocation(prog,n); if(u) gl.uniform3fv(u,a); }
    uf('uTime',0); uf('uTod',0.5); uf('uPixelScale',0.001); uf('uGlow',0); uf('uMist',0); uf('uWeather',0);
    uf('uRays',1); uf('uSunI',1); uf('uAmbI',1); uf('uStory',0);
    uf3('uEye',[0,6,14]); uf3('uSun',[0.4,0.8,0.3]);
    var um=gl.getUniformLocation(prog,'uMVP');

    var shapes = [];
    var indexCount = 0;

    function hexRGB(h){ return [parseInt(h.slice(1,3),16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255]; }

    function rebuild(){
      var m = new CityMesh();
      shapes.forEach(function(s){
        var c = hexRGB(s.color), mat = s.mat;
        if (s.type==='box') m.box(s.x, 0, s.z, s.w, s.h, s.d, c, mat);
        else if (s.type==='bevelBox') m.bevelBox(s.x, 0, s.z, s.w, s.h, s.d, c, mat);
        else if (s.type==='dome') m.dome(s.x, s.h/2, s.z, s.w/2, s.h/2, s.d/2, c, mat);
        else if (s.type==='cylinder') m.cylinder(s.x, 0, s.z, s.w/2, s.d/2, s.h, c, mat);
        else if (s.type==='sphere') m.sphere(s.x, s.h/2, s.z, s.w/2, s.h/2, s.d/2, c, mat);
      });
      indexCount = m.indices.length;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m.data), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(m.indices), gl.STATIC_DRAW);
      host.querySelector('#m-info').textContent = (m.data.length/23)+' verts \u00B7 '+(m.indices.length/3)+' tris';
      host.querySelector('#m-list').innerHTML = shapes.length
        ? shapes.map(function(s,i){ return '<div>'+(i+1)+'. '+s.type+' \u00B7 mat '+s.mat+' ('+MAT_NAMES[s.mat]+')</div>'; }).join('')
        : 'empty';
    }

    var yaw=0.6, pitch=0.35, drag=null, raf=0;
    cv.addEventListener('pointerdown', function(e){ drag=[e.clientX,e.clientY,yaw,pitch]; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function(e){ if(drag){ yaw=drag[2]+(e.clientX-drag[0])*0.01; pitch=Math.max(0.05,Math.min(1.4,drag[3]+(e.clientY-drag[1])*0.01)); }});
    cv.addEventListener('pointerup', function(){ drag=null; });

    function mat4persp(a,n,f){ var t=1/Math.tan(0.5); return [t/a,0,0,0, 0,t,0,0, 0,0,(f+n)/(n-f),-1, 0,0,2*f*n/(n-f),0]; }
    // Correct lookAt (the component example's orbit math inverts the view axis;
    // this is panel code, the component is untouched).
    function lookAt(eye, target){
      var z=[eye[0]-target[0], eye[1]-target[1], eye[2]-target[2]], zl=Math.hypot(z[0],z[1],z[2])||1;
      z=[z[0]/zl, z[1]/zl, z[2]/zl];
      var x=[1*z[2]-0*z[1], 0*z[0]-0*z[2], 0*z[1]-1*z[0]]; // up(0,1,0) x z
      var xl=Math.hypot(x[0],x[1],x[2])||1; x=[x[0]/xl,x[1]/xl,x[2]/xl];
      var y=[z[1]*x[2]-z[2]*x[1], z[2]*x[0]-z[0]*x[2], z[0]*x[1]-z[1]*x[0]];
      return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
        -(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]),
        -(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]),
        -(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]), 1];
    }
    function draw(){
      raf = requestAnimationFrame(draw);
      var eye=[Math.sin(yaw)*16*Math.cos(pitch), 6+Math.sin(pitch)*10, Math.cos(yaw)*16*Math.cos(pitch)];
      var view=lookAt(eye,[0,2,0]);
      var pr=mat4persp(cv.width/cv.height,0.1,100), out=new Array(16).fill(0);
      for(var c=0;c<4;c++)for(var r=0;r<4;r++)for(var k=0;k<4;k++)out[c*4+r]+=pr[k*4+r]*view[c*4+k];
      gl.uniformMatrix4fv(um,false,out);
      var ue=gl.getUniformLocation(prog,'uEye'); if(ue) gl.uniform3fv(ue,eye);
      gl.viewport(0,0,cv.width,cv.height);
      gl.clearColor(0.04,0.05,0.08,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
      if (indexCount) gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    }

    host.querySelector('#m-add').onclick = function(){
      shapes.push({
        type: host.querySelector('#m-shape').value,
        mat: +matSel.value,
        color: host.querySelector('#m-color').value,
        w: +host.querySelector('#m-w').value || 4,
        h: +host.querySelector('#m-h').value || 3,
        d: +host.querySelector('#m-d').value || 4,
        x: +host.querySelector('#m-x').value || 0,
        z: +host.querySelector('#m-z').value || 0
      });
      rebuild();
    };
    host.querySelector('#m-clear').onclick = function(){ shapes=[]; rebuild(); };

    // starter scene (same four primitives as the component's example)
    shapes = [
      {type:'box', mat:2, color:'#bfb8ac', w:4,h:3,d:4, x:-2,z:-2},
      {type:'cylinder', mat:3, color:'#808c99', w:2,h:5,d:2, x:4,z:0},
      {type:'sphere', mat:8, color:'#e6994d', w:2.4,h:2.4,d:2.4, x:-4,z:1},
      {type:'bevelBox', mat:18, color:'#999da3', w:4,h:1,d:4, x:0,z:-2}
    ];
    rebuild();
    draw();
    this._stop = function(){ cancelAnimationFrame(raf); };
  },
  unmount: function(){ if (this._stop) this._stop(); }
};
})();
