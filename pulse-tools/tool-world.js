/* Universe explorer — tree browser over the real moorworld data.
 * Uses: MoorWorld.sectors(), counts(), findByAddress(), planetType(),
 *       materials(), climate(), species(), summary().
 * The component is data-only; the tree UI is panel code over its query API.
 * Hierarchy position is the canonical address path (universe:prime/...). */
(function(){
'use strict';
var planetGL = null, planetRAF = 0;
TOOLS.world = {
  mount: function(host){
    var W = window.MoorWorld;
    var counts = W.counts();
    var selected = null;

    host.innerHTML =
      '<div class="t-controls">'+
        '<span class="meta">'+counts.sectors+' sectors \u00B7 '+counts.systems+' systems \u00B7 '+counts.planets+' planets \u00B7 '+counts.zones+' zones \u00B7 seed '+W.UNIVERSE_SEED+'</span>'+
      '</div>'+
      '<div class="t-controls"><div class="t-tabs">'+
        '<button class="btn primary" id="w-tab-tree">Tree</button>'+
        '<button class="btn" id="w-tab-planet">Planet view</button>'+
      '</div></div>'+
      '<div id="w-pane-tree">'+
      '<div class="t-controls">'+
        '<label>Find by address <input id="w-addr" placeholder="universe:prime/sector:S01/\u2026" spellcheck="false" style="width:280px"></label>'+
        '<button class="btn" id="w-go">Go</button>'+
      '</div>'+
      '<div class="w-main"><div class="w-tree" id="w-tree"></div><div class="w-detail" id="w-detail"><div class="empty">Select a sector, system, planet, or zone.</div></div></div>'+
      '</div>'+
      '<div id="w-pane-planet" style="display:none">'+
        '<div class="t-controls"><label>Planet <input id="w-psearch" placeholder="type a name…" spellcheck="false" style="width:200px"></label>'+
        '<select id="w-planet" style="max-width:220px"></select>'+
        '<button class="btn primary" id="w-view">View</button></div>'+
        '<canvas id="w-cv" width="600" height="380" style="width:100%;border-radius:12px;touch-action:none"></canvas>'+
        '<div class="meta" id="w-pinfo"></div>'+
        '<div class="t-row"><a class="btn" href="https://bassseamoor.github.io/render-queue/moor-planet-demo.html" target="_blank" rel="noopener">Walk the surface in the planet demo ↗</a></div>'+
        '<p class="meta">The sphere is panel composition — real planet data (name, type, address, climate) and real palette colors, with seeded relief. The full surface explorer is the planet demo.</p>'+
      '</div>';

    function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

    function select(node){
      selected = node;
      var d = host.querySelector('#w-detail');
      var crumbs = node.addr.split('/').map(esc).join(' <span class="meta">/</span> ');
      var h = '<div class="eyebrow">'+esc(node.kind)+'</div><h3>'+esc(node.name)+'</h3>'+
        '<p class="meta">'+crumbs+'</p><div class="w-facts">';
      function row(k,v){ h += '<div class="w-fact"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>'; }
      row('id', node.id);
      if (node.u) row('sector coords', node.u.join(', '));
      if (node.s) row('system offset', node.s.join(', '));
      if (node.starClass) row('star class', node.starClass);
      if (node.orbit != null) {
        row('orbit', node.orbit); row('size', node.size); row('type', W.planetType(node));
        var cl = W.climate(node.id), sp = W.species(node.id), mt = W.materials(node.id);
        row('climate', cl.temp+', '+cl.air+', '+cl.weather);
        row('species', sp.length+' known ('+sp[0].name+')');
        var sig = mt.signature || (mt.rows && mt.rows.length ? mt.rows[0][0] : '');
        row('materials', (mt.rows?mt.rows.length:0)+' categories'+(sig?'; signature '+sig:''));
        var sum = W.summary(node.id);
        if (sum) h += '</div><p class="w-summary">'+esc(sum)+'</p><div class="w-facts">';
      }
      if (node.lat != null) { row('lat', node.lat); row('lon', node.lon); row('alt', node.alt); row('kind', node.kind); }
      if (node.systems) row('systems', node.systems.length);
      if (node.planets) row('planets', node.planets.length);
      if (node.zones) row('zones', node.zones.length);
      h += '</div>';
      if (node.kind==='planet' && node.zones && node.zones.length)
        h += '<div class="eyebrow">Zones</div><p class="meta">'+node.zones.map(function(z){return esc(z.name);}).join(', ')+'</p>';
      d.innerHTML = h;
      Array.prototype.forEach.call(host.querySelectorAll('.w-node'), function(el){
        el.classList.toggle('sel', el.dataset.nid === node.id);
      });
    }

    function nodeBtn(n, depth){
      return '<button class="w-node" data-nid="'+esc(n.id)+'" style="padding-left:'+(8+depth*16)+'px">'+
        '<span class="w-kind">'+esc(n.kind)+'</span> '+esc(n.name)+'</button>';
    }
    function buildTree(){
      var h = '';
      W.sectors().forEach(function(sec){
        h += nodeBtn(sec, 0);
        sec.systems.forEach(function(sys){
          h += nodeBtn(sys, 1);
          sys.planets.forEach(function(p){
            h += nodeBtn(p, 2);
            p.zones.forEach(function(z){ h += nodeBtn(z, 3); });
          });
        });
      });
      host.querySelector('#w-tree').innerHTML = h;
      Array.prototype.forEach.call(host.querySelectorAll('.w-node'), function(el){
        el.onclick = function(){ var n = W.findById(el.dataset.nid); if (n) select(n); };
      });
    }

    host.querySelector('#w-go').onclick = function(){
      var a = host.querySelector('#w-addr').value.trim();
      var n = a && W.findByAddress(a);
      if (n) {
        select(n);
        var el = host.querySelector('.w-node[data-nid="'+n.id+'"]');
        if (el) el.scrollIntoView({block:'nearest'});
      } else toast('No place at that address');
    };

    buildTree();

    /* ---------- tabs ---------- */
    var tabTree = host.querySelector('#w-tab-tree'), tabPlanet = host.querySelector('#w-tab-planet');
    var paneTree = host.querySelector('#w-pane-tree'), panePlanet = host.querySelector('#w-pane-planet');
    tabTree.onclick = function(){
      tabTree.classList.add('primary'); tabPlanet.classList.remove('primary');
      paneTree.style.display=''; panePlanet.style.display='none';
    };
    tabPlanet.onclick = function(){
      tabPlanet.classList.add('primary'); tabTree.classList.remove('primary');
      paneTree.style.display='none'; panePlanet.style.display='';
      if (!planetGL) initPlanet();
    };

    /* ---------- planet view: 3D sphere from real data + real palettes ---------- */
    var planetSel = host.querySelector('#w-planet'), psearch = host.querySelector('#w-psearch');
    var allPlanets = [];
    W.sectors().forEach(function(s){ s.systems.forEach(function(y){ y.planets.forEach(function(p){ allPlanets.push(p); }); }); });
    function typeKey(p){
      var n = (W.planetType(p).name||'').toUpperCase();
      var m = {'TERRAN WORLD':'TERRAN','OCEAN WORLD':'OCEAN','DESERT WORLD':'DESERT','ICE WORLD':'ICE',
               'LAVA WORLD':'LAVA','JUNGLE WORLD':'JUNGLE','BARREN ROCK':'BARREN','GAS GIANT':'GAS',
               'CRYSTAL WORLD':'CRYSTAL','TOXIC WORLD':'TOXIC'};
      return m[n] || 'TERRAN';
    }
    function fillPlanetList(filter){
      planetSel.innerHTML='';
      var f=(filter||'').toLowerCase();
      allPlanets.filter(function(p){ return !f || p.name.toLowerCase().indexOf(f)>=0; })
        .slice(0,60).forEach(function(p){
          var o=document.createElement('option'); o.value=p.id;
          o.textContent=p.name+' ('+typeKey(p)+')'; planetSel.appendChild(o);
        });
    }
    fillPlanetList('');
    psearch.oninput = function(){ fillPlanetList(psearch.value); };
    host.querySelector('#w-view').onclick = function(){ if (planetGL) planetGL.setPlanet(planetSel.value); };

    function initPlanet(){
      var cv = host.querySelector('#w-cv'), gl = cv.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
      if (!gl) return;
      // UV sphere
      var pos=[], nrm=[], idx=[], uv=[];
      var NU=72, NV=48;
      for (var j=0;j<=NV;j++) for (var i=0;i<=NU;i++){
        var u=i/NU*Math.PI*2, v=j/NV*Math.PI;
        var x=Math.sin(v)*Math.cos(u), y=Math.cos(v), z=Math.sin(v)*Math.sin(u);
        pos.push(x,y,z); nrm.push(x,y,z); uv.push(i/NU, j/NV);
      }
      for (var y2=0;y2<NV;y2++) for (var x2=0;x2<NU;x2++){
        var a=y2*(NU+1)+x2, b=a+1, c=a+NU+1, d=c+1;
        idx.push(a,c,b, b,c,d);
      }
      var VS='attribute vec3 p;attribute vec3 n;attribute vec2 t;'+
        'uniform mat4 mvp;uniform float uSeed;'+
        'varying vec3 vN;varying vec2 vT;varying float vH;'+
        'float h21(vec2 q){ vec3 p3=fract(vec3(q.xyx)*0.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }'+
        'float vnoise(vec2 q){ vec2 i=floor(q), f=fract(q); vec2 u=f*f*(3.0-2.0*f);'+
        ' return mix(mix(h21(i+uSeed),h21(i+vec2(1,0)+uSeed),u.x), mix(h21(i+vec2(0,1)+uSeed),h21(i+vec2(1,1)+uSeed),u.x), u.y); }'+
        'float fbm(vec2 q){ float s=0.0,a=0.5; for(int k=0;k<4;k++){ s+=a*vnoise(q); q*=2.03; a*=0.5; } return s; }'+
        'void main(){'+
        ' float h=fbm(t*vec2(6.0,3.0));'+
        ' float continents=smoothstep(0.35,0.65,fbm(t*vec2(2.0,1.0)+7.0));'+
        ' float m=h*0.65+continents*0.35;'+
        ' vec3 q=p*(1.0+(m-0.5)*0.14);'+
        ' vH=m; vN=n; vT=t;'+
        ' gl_Position=mvp*vec4(q,1.0);}';
      var FS='precision mediump float;'+
        'uniform vec3 uDeep,uShallow,uLandA,uLandB,uIce,uAtmo;uniform float uSea;'+
        'varying vec3 vN;varying vec2 vT;varying float vH;'+
        'void main(){'+
        ' vec3 N=normalize(vN);'+
        ' vec3 base;'+
        ' if (vH<uSea){ float d=smoothstep(uSea,uSea-0.25,vH); base=mix(uShallow,uDeep,d); }'+
        ' else { float d=smoothstep(uSea,uSea+0.45,vH); base=mix(uLandA,uLandB,d);'+
        '   float ice=smoothstep(0.72,0.9,abs(vT.y*2.0-1.0)+ (vH-uSea)*0.4);'+
        '   base=mix(base,uIce,ice); }'+
        ' float ndl=max(dot(N,normalize(vec3(0.6,0.5,0.7))),0.0);'+
        ' float night=smoothstep(0.0,-0.25,dot(N,normalize(vec3(0.6,0.5,0.7))));'+
        ' vec3 lit=base*(0.12+0.95*ndl);'+
        ' lit+=base*night*vec3(0.1,0.15,0.3)*0.4;'+
        // atmosphere rim
        ' vec3 V=vec3(0.0,0.0,1.0);'+
        ' float rim=pow(1.0-abs(dot(N,V)),2.5);'+
        ' lit+=uAtmo*rim*0.9;'+
        ' gl_FragColor=vec4(lit,1.0);}';
      function sh(t,s){ var h=gl.createShader(t); gl.shaderSource(h,s); gl.compileShader(h);
        if (!gl.getShaderParameter(h,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(h));
        return h; }
      var pr=gl.createProgram();
      gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
      gl.linkProgram(pr); gl.useProgram(pr);
      function attr(nm,arr,size){
        var l=gl.getAttribLocation(pr,nm), b=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);
        gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l,size,gl.FLOAT,false,0,0);
      }
      attr('p',pos,3); attr('n',nrm,3); attr('t',uv,2);
      var ib=gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(idx),gl.STATIC_DRAW);
      var uMVP=gl.getUniformLocation(pr,'mvp'), uSeed=gl.getUniformLocation(pr,'uSeed');
      var U={};
      ['uDeep','uShallow','uLandA','uLandB','uIce','uAtmo'].forEach(function(nm){ U[nm]=gl.getUniformLocation(pr,nm); });
      var uSea=gl.getUniformLocation(pr,'uSea');
      function hx(c){ return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255]; }

      var yaw=0, dragging=false, lx=0, auto=true;
      cv.addEventListener('pointerdown',function(e){ dragging=true; auto=false; lx=e.clientX; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove',function(e){ if(dragging){ yaw+=(e.clientX-lx)*0.01; lx=e.clientX; } });
      cv.addEventListener('pointerup',function(){ dragging=false; });

      function setPlanet(pid){
        var p = W.findById(pid);
        if (!p || p.kind!=='planet') return;
        var type = typeKey(p);
        var T = (typeof PTEX!=='undefined' && PTEX[type]) || {};
        var M = (typeof MAT!=='undefined' && MAT[type]) || {};
        var seedH=0; for (var i=0;i<p.id.length;i++) seedH=(seedH*31+p.id.charCodeAt(i))%1000;
        gl.uniform1f(uSeed, seedH);
        function C(v, fb){ var c = v ? hx(v) : hx(fb); return c; }
        var land = T.land || ['#5a4a3a','#7a6a4a'];
        var water = T.water || ['#1a3a5a','#0a1a3a'];
        var landA=C(land[0],'#5a4a3a'), landB=C(land[1],'#7a6a4a');
        var leafA=C(M.leaf&&M.leaf[0],'#3a6a3a');
        var waterA=C(water[0],'#1a3a5a'), waterB=C(water[1],'#0a1a3a');
        var atmoNum = (typeof T.atmo==='number') ? T.atmo : 0x88bbff;
        var atmoCss = '#'+('000000'+atmoNum.toString(16)).slice(-6);
        var skyB=hx(atmoCss);
        // land color leans toward the planet's vegetation tone
        landB=[(landB[0]+leafA[0])/2,(landB[1]+leafA[1])/2,(landB[2]+leafA[2])/2];
        gl.uniform3f(U.uDeep,waterB[0],waterB[1],waterB[2]);
        gl.uniform3f(U.uShallow,waterA[0],waterA[1],waterA[2]);
        gl.uniform3f(U.uLandA,landA[0],landA[1],landA[2]);
        gl.uniform3f(U.uLandB,landB[0],landB[1],landB[2]);
        gl.uniform3f(U.uIce,0.88,0.92,0.96);
        gl.uniform3f(U.uAtmo,skyB[0]*1.5+0.1,skyB[1]*1.5+0.1,skyB[2]*1.5+0.2);
        gl.uniform1f(uSea, (typeof T.sea==='number' && T.sea>0) ? T.sea : -1);
        var cl=W.climate(p.id);
        host.querySelector('#w-pinfo').innerHTML =
          '<b>'+esc(p.name)+'</b> · '+esc(p.addr||p.id)+' · '+esc(type)+' · '+esc(cl.temp+', '+cl.air)+
          ' — relief seeded by planet id, colors from its real palette.';
      }
      planetGL={setPlanet:setPlanet};

      function persp(f,a,n,f2){ var t=1/Math.tan(f/2),o=new Float32Array(16);
        o[0]=t/a;o[5]=t;o[10]=(f2+n)/(n-f2);o[11]=-1;o[14]=2*f2*n/(n-f2); return o; }
      var t0=performance.now();
      function frame(){
        planetRAF=requestAnimationFrame(frame);
        var t=(performance.now()-t0)/1000;
        if (auto) yaw+=0.0016;
        gl.viewport(0,0,cv.width,cv.height);
        gl.clearColor(0.02,0.03,0.06,1); gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        // stars
        // (skip — clean gradient bg)
        var cy=Math.cos(yaw), sy=Math.sin(yaw);
        var rot=new Float32Array([cy,0,-sy,0, 0,1,0,0, sy,0,cy,0, 0,0,-3.2,1]);
        var mvp=new Float32Array(16), P=persp(0.8,cv.width/cv.height,0.1,50);
        for (var i=0;i<4;i++) for (var j=0;j<4;j++)
          mvp[i*4+j]=P[j]*rot[i*4]+P[4+j]*rot[i*4+1]+P[8+j]*rot[i*4+2]+P[12+j]*rot[i*4+3];
        gl.uniformMatrix4fv(uMVP,false,mvp);
        gl.drawElements(gl.TRIANGLES,idx.length,gl.UNSIGNED_SHORT,0);
      }
      frame();
      if (planetSel.value) setPlanet(planetSel.value);
    }
  },
  unmount: function(){ if (planetRAF) cancelAnimationFrame(planetRAF); planetRAF=0; planetGL=null; }
};
})();
