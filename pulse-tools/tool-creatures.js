/* MOOR Creature Lab — Stage A: end-to-end walker (handoff v1.0 §16).
 * Replaces the 2D viability sketch. This is the real architecture, first stage:
 *
 *   genome (seeded traits) -> anatomy definition (canonical JSON, hashed)
 *     -> validator + bounded repair (diagnostics) -> compiler
 *     -> render mesh + IK rig + collision proxies + soft-tissue region
 *     -> runtime: procedural gait, foot IK, fixture terrain queries
 *
 * Stages B–G (environment-conditioned species, scaling, swimming, flight,
 * breeding, ecosystems) are NOT implemented — the lab labels them planned.
 * Fixture adapters stand in for unfinished world systems, clearly labeled.
 *
 * Uses: seed-rng (named streams), moorworld (planet data), palettes (colors).
 * Renderer: raw WebGL, self-contained. */
(function(){
'use strict';

/* ================= deterministic streams (handoff §13) ================= */
function stream(name, seed){
  return streamFrom('creature:'+name+':'+seed);
}
function hashAnatomy(a){
  var s = JSON.stringify(a);
  var h1=0xdeadbeef, h2=0x41c6ce57;
  for (var i=0;i<s.length;i++){
    var ch=s.charCodeAt(i);
    h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677);
  }
  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);
  return (h2>>>0).toString(16)+(h1>>>0).toString(16);
}

/* ================= species definition (fixture) ================= */
var GRAMMAR_VERSION = 1, SCHEMA_VERSION = 1;
var SPECIES = {
  id:'walker-terran', grammar:'bilateral-walker', grammarVersion:GRAMMAR_VERSION,
  legPairs:[2,3],            // 4 or 6 legs
  bodyLen:[2.4,3.6], bodyW:[0.85,1.25], bodyH:[0.95,1.35],
  legLen:[1.3,1.9],          // total leg length range
  headScale:[0.8,1.2], tailSegs:[0,4],
  massKg:[90,140]
};

/* ================= genome: resolved individual traits ================= */
function resolveGenome(speciesSeed, individualSeed){
  var g={ speciesId:SPECIES.id, speciesSeed:speciesSeed, individualSeed:individualSeed };
  var r;
  r=stream('body',speciesSeed+':'+individualSeed);
  var legPairs = SPECIES.legPairs[Math.floor(r()*SPECIES.legPairs.length)];
  g.legCount = legPairs*2;
  g.bodyLen = SPECIES.bodyLen[0]+r()*(SPECIES.bodyLen[1]-SPECIES.bodyLen[0]);
  g.bodyW   = SPECIES.bodyW[0]+r()*(SPECIES.bodyW[1]-SPECIES.bodyW[0]);
  g.bodyH   = SPECIES.bodyH[0]+r()*(SPECIES.bodyH[1]-SPECIES.bodyH[0]);
  g.legLen  = SPECIES.legLen[0]+r()*(SPECIES.legLen[1]-SPECIES.legLen[0]);
  g.upperFrac = 0.52+r()*0.1;                       // upper:lower split
  g.headScale = SPECIES.headScale[0]+r()*(SPECIES.headScale[1]-SPECIES.headScale[0]);
  g.tailSegs = Math.floor(r()*(SPECIES.tailSegs[1]+1));
  g.massKg = SPECIES.massKg[0]+r()*(SPECIES.massKg[1]-SPECIES.massKg[0]);
  r=stream('surface',speciesSeed+':'+individualSeed);
  g.hueShift = r(); g.marking = r(); g.markingAmt = r()*0.6;
  r=stream('gait',speciesSeed+':'+individualSeed);
  g.strideF = 0.9+r()*0.3; g.dutyF = 0.58+r()*0.08;
  return g;
}

/* ================= anatomy expander: genome -> canonical definition ================= */
function expandAnatomy(genome, planet){
  var ptype = planetTypeKey(planet);
  var M = (typeof MAT!=='undefined' && MAT[ptype]) || MAT.TERRAN;
  var nodes=[], rels=[];
  var nid=0;
  function node(role, parent, dims, extra){
    var n={ id:'n'+(nid++), semanticRole:role, parentId:parent,
      restPose:{p:[0,0,0], q:[0,0,0,1]}, dimensions:dims,
      material:(extra&&extra.material)||'skin', capabilities:(extra&&extra.caps)||[],
      symmetry:(extra&&extra.sym)||null };
    nodes.push(n); return n;
  }
  // torso root: 3 axial segments for organic taper
  var torso = node('torso', null, {len:genome.bodyLen, w:genome.bodyW, h:genome.bodyH},
    {material:'skin', caps:['core-support']});
  torso.restPose.p=[0, genome.legLen*0.92, 0];
  var segL=genome.bodyLen/3;
  var segs=[];
  for (var s=0;s<3;s++){
    var sg=node('axial-segment', torso.id,
      {len:segL, w:genome.bodyW*(1-0.18*Math.abs(s-1)), h:genome.bodyH*(1-0.15*Math.abs(s-1))},
      {material:'skin'});
    sg.restPose.p=[(s-1)*segL, 0, 0];
    segs.push(sg);
  }
  // legs
  var legs=[];
  var upperL=genome.legLen*genome.upperFrac, lowerL=genome.legLen*(1-genome.upperFrac);
  for (var i=0;i<genome.legCount;i++){
    var side = (i%2===0)?'L':'R';
    var pairIdx = Math.floor(i/2);
    var along = genome.legCount===4 ? (pairIdx===0?0.32:-0.32) : (pairIdx/(genome.legCount/2-1)-0.5)*0.7;
    var hip=node('locomotor-segment', torso.id,
      {upper:upperL, lower:lowerL, footR:0.14},
      {material:'skin', caps:['ground-contact'], sym:'leg-'+side});
    hip.restPose.p=[along*genome.bodyLen, -genome.bodyH*0.28, (side==='L'?1:-1)*genome.bodyW*0.52];
    hip.joint={ type:'ball', limits:{swing:0.9, lift:0.7}, poleOut:1 };
    var foot=node('contact-pad', hip.id, {r:0.14}, {material:'pad', caps:['ground-contact']});
    legs.push({hip:hip, foot:foot, side:side, along:along});
  }
  // head + sensors
  var head=node('feeding-structure', torso.id,
    {len:0.55*genome.headScale, w:0.5*genome.headScale, h:0.55*genome.headScale},
    {material:'skin', caps:['bite','visual-sensing']});
  head.restPose.p=[genome.bodyLen*0.5+0.25*genome.headScale, genome.bodyH*0.12, 0];
  var eyeL=node('sensor', head.id, {r:0.07}, {material:'eye', caps:['visual-sensing'], sym:'eye-L'});
  eyeL.restPose.p=[0.28*genome.headScale, 0.12, 0.18*genome.headScale];
  var eyeR=node('sensor', head.id, {r:0.07}, {material:'eye', caps:['visual-sensing'], sym:'eye-R'});
  eyeR.restPose.p=[0.28*genome.headScale, 0.12, -0.18*genome.headScale];
  // tail
  var tailNodes=[];
  var parent=torso.id, tx=-genome.bodyLen*0.5;
  for (var t=0;t<genome.tailSegs;t++){
    var tl=0.5*(1-t/(genome.tailSegs+0.5));
    var tn=node('tail-segment', parent, {len:tl, r:0.16*(1-t/genome.tailSegs)+0.03},
      {material:'skin', caps:t===genome.tailSegs-1?['tail-tip']:[]});
    tn.restPose.p = t===0 ? [tx, genome.bodyH*0.1, 0] : [-tl/2-0.02, 0, 0];
    if (t>0) tn.restPose.p=[-0.5*(1-(t-1)/(genome.tailSegs+0.5))-0.02, 0, 0];
    tailNodes.push(tn); parent=tn.id;
  }
  var skin = (M.leaf&&M.leaf[0])||'#4a6a3a';
  var skinB = (M.leaf&&M.leaf[1])||'#6a8a4a';
  var bellyC = (M.grass&&M.grass[0])||'#7a8a4a';
  var A={
    schema:'creature-anatomy/1', schemaVersion:SCHEMA_VERSION,
    grammarVersion:GRAMMAR_VERSION, speciesId:genome.speciesId,
    individualSeed:genome.individualSeed, genome:genome,
    nodes:nodes, softRegions:[{ id:'belly', nodeId:torso.id,
      policy:'deformable', anchors:'torso-bottom-edge',
      solver:{type:'verlet-cloth', iterations:3, damping:0.96} }],
    materials:{ skin:skin, skinB:skinB, belly:bellyC,
      pad:'#2a2018', eye:'#101418' },
    planet:{ id:planet.id, name:planet.name, type:ptype }
  };
  A.hash=hashAnatomy({nodes:nodes, genome:genome, materials:A.materials});
  return A;
}
function planetTypeKey(planet){
  var n=(((window.MoorWorld||{}).planetType||function(){return{name:''};})(planet).name||'').toUpperCase();
  var m={'TERRAN WORLD':'TERRAN','OCEAN WORLD':'OCEAN','DESERT WORLD':'DESERT','ICE WORLD':'ICE',
    'LAVA WORLD':'LAVA','JUNGLE WORLD':'JUNGLE','BARREN ROCK':'BARREN','GAS GIANT':'GAS',
    'CRYSTAL WORLD':'CRYSTAL','TOXIC WORLD':'TOXIC'};
  return m[n]||'TERRAN';
}

/* ================= validator + bounded repair (handoff §8) ================= */
var MAX_REPAIR=8;
function validate(a){
  var diags=[];
  function bad(id, check, measured, why, sev){ diags.push({id:id, check:check, measured:measured, why:why, severity:sev||'error'}); }
  var byId={}; a.nodes.forEach(function(n){ byId[n.id]=n; });
  a.nodes.forEach(function(n){
    if (byId[n.id]!==n) bad(n.id,'unique-id',n.id,'duplicate node id');
    if (n.parentId && !byId[n.parentId]) bad(n.id,'valid-parent',n.parentId,'parent missing');
    for (var k in (n.dimensions||{})){ var v=n.dimensions[k];
      if (!isFinite(v)||v<=0) bad(n.id,'positive-dims',k+'='+v,'dimension must be finite positive'); }
  });
  // movement feasibility: leg reach vs body clearance
  var torso=a.nodes[0], g=a.genome;
  var clearance=torso.restPose.p[1];
  var reach=g.legLen;
  if (reach < clearance*1.05)
    bad('legs','support-capacity',reach.toFixed(2)+' < '+clearance.toFixed(2),'legs cannot reach ground under body');
  if (g.legLen > clearance*1.9)
    bad('legs','gait-compatibility',g.legLen.toFixed(2)+' > '+(clearance*1.9).toFixed(2),'legs far longer than clearance — unstable','warn');
  return diags;
}
function repair(a){
  var log=[], pass=0;
  while (pass<MAX_REPAIR){
    var diags=validate(a).filter(function(d){return d.severity==='error';});
    if (!diags.length) break;
    var d=diags[0], g=a.genome;
    if (d.check==='support-capacity'){
      var need=a.nodes[0].restPose.p[1]*1.15;
      log.push('lengthened legs '+g.legLen.toFixed(2)+' → '+need.toFixed(2));
      g.legLen=need;
      // re-expand leg dimensions
      a.nodes.forEach(function(n){
        if (n.semanticRole==='locomotor-segment'){
          n.dimensions.upper=need*g.upperFrac; n.dimensions.lower=need*(1-g.upperFrac);
        }
      });
    } else { log.push('no repair rule for '+d.check+' — aborting'); break; }
    pass++;
  }
  a.hash=hashAnatomy({nodes:a.nodes, genome:a.genome, materials:a.materials});
  return {passes:pass, log:log, diags:validate(a)};
}

/* ================= fixture terrain (labeled fixture, handoff §4) ================= */
function makeTerrain(seed, preset){
  var r=stream('terrain', seed+':'+preset);
  var oct=[];
  for (var i=0;i<4;i++) oct.push({f:0.02*(1<<i), a:3.2/(1<<i), px:r()*100, pz:r()*100});
  var rough = preset==='rocky'?1.6 : preset==='cold'?1.2 : 1.0;
  function h(x,z){
    var s=0;
    for (var i=0;i<oct.length;i++){ var o=oct[i];
      s+=o.a*Math.sin((x+o.px)*o.f)*Math.cos((z+o.pz)*o.f*1.3); }
    return s*rough;
  }
  return {
    preset:preset, seed:seed, fixture:true,
    sampleSurface:function(x,z){ // WorldQuery.sampleSurface fixture
      var e=0.6, y=h(x,z);
      var nx=(h(x-e,z)-h(x+e,z))/(2*e), nz=(h(x,z-e)-h(x,z+e))/(2*e);
      var inv=1/Math.hypot(nx,1,nz);
      return {hit:true, position:[x,y,z], normal:[nx*inv,inv,nz*inv], materialId:'ground'};
    },
    height:h
  };
}

/* ================= geometry helpers (panel renderer) ================= */
function Geo(){ this.pos=[]; this.nrm=[]; this.col=[]; this.idx=[]; }
Geo.prototype.v=function(x,y,z,nx,ny,nz,r,g,b){
  this.pos.push(x,y,z); this.nrm.push(nx,ny,nz); this.col.push(r,g,b);
  return this.pos.length/3-1;
};
function box(geo, w,h,d, x,y,z, c){
  var x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;
  var F=[[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]],
         [[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1]],
         [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0]],
         [[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0]],
         [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0]],
         [[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0]]];
  F.forEach(function(f){
    var b=geo.pos.length/3;
    for (var i=0;i<4;i++) geo.v(f[i][0],f[i][1],f[i][2],f[4][0],f[4][1],f[4][2],c[0],c[1],c[2]);
    geo.idx.push(b,b+1,b+2,b,b+2,b+3);
  });
}
function cyl(geo, r0,r1,len,seg, x,y,z, c, axis){
  // axis 'y': along Y centered at x,y,z
  var ring0=[], ring1=[];
  for (var i=0;i<seg;i++){
    var a=i/seg*Math.PI*2, ca=Math.cos(a), sa=Math.sin(a);
    var nx=ca, nz=sa;
    if (axis==='y'){
      ring0.push(geo.v(x+ca*r0,y-len/2,z+sa*r0,nx,0,nz,c[0],c[1],c[2]));
      ring1.push(geo.v(x+ca*r1,y+len/2,z+sa*r1,nx,0,nz,c[0],c[1],c[2]));
    } else { // along X
      ring0.push(geo.v(x-len/2,y+ca*r0,z+sa*r0,0,nx,nz,c[0],c[1],c[2]));
      ring1.push(geo.v(x+len/2,y+ca*r1,z+sa*r1,0,nx,nz,c[0],c[1],c[2]));
    }
  }
  for (var j=0;j<seg;j++){
    var a2=ring0[j], b2=ring0[(j+1)%seg], c2=ring1[j], d2=ring1[(j+1)%seg];
    geo.idx.push(a2,c2,b2, b2,c2,d2);
  }
}
function ball(geo, r, x,y,z, c, ws, hs){
  ws=ws||10; hs=hs||8;
  var rows=[];
  for (var j=0;j<=hs;j++){
    var v=j/hs*Math.PI, row=[];
    for (var i=0;i<ws;i++){
      var u=i/ws*Math.PI*2;
      var px=Math.sin(v)*Math.cos(u), py=Math.cos(v), pz=Math.sin(v)*Math.sin(u);
      row.push(geo.v(x+px*r,y+py*r,z+pz*r,px,py,pz,c[0],c[1],c[2]));
    }
    rows.push(row);
  }
  for (var y2=0;y2<hs;y2++) for (var x2=0;x2<ws;x2++){
    var a=rows[y2][x2], b=rows[y2][(x2+1)%ws], c2=rows[y2+1][x2], d=rows[y2+1][(x2+1)%ws];
    geo.idx.push(a,c2,b, b,c2,d);
  }
}
function hx(c){ return [parseInt(c.slice(1,3),16)/255,parseInt(c.slice(3,5),16)/255,parseInt(c.slice(5,7),16)/255]; }

/* ================= compiler: anatomy -> runtime assets ================= */
function compile(a){
  var g=a.genome, M=a.materials;
  var skin=hx(M.skin), skinB=hx(M.skinB), bellyC=hx(M.belly),
      padC=hx(M.pad), eyeC=hx(M.eye);
  var torsoY=g.legLen*0.92;

  /* Countershading color: dorsal slightly darker -> ventral light, plus markings */
  function skinColor(u, v, pos, base, dark){
    // v=0 at top (+Y). topness=1 at top, 0 at bottom.
    var topness=Math.cos(v*Math.PI*2)*0.5+0.5;
    // Gentle gradient: top uses dark, bottom uses base (lighter)
    var c=[
      dark[0]+(base[0]-dark[0])*(1-topness*0.5),
      dark[1]+(base[1]-dark[1])*(1-topness*0.5),
      dark[2]+(base[2]-dark[2])*(1-topness*0.5)
    ];
    // markings: stripes along body based on genome
    if (g.markingAmt>0.05){
      var stripe=Math.sin(u*20+g.marking*10)>0.6 ? 1 : 0;
      var spot=Math.sin(u*37+v*20+g.marking*20)>0.75 ? 1 : 0;
      var mk=g.marking<0.5?stripe:spot;
      if (mk && topness>0.4){
        var amt=g.markingAmt*0.5;
        c=[c[0]*(1-amt)+bellyC[0]*amt, c[1]*(1-amt)+bellyC[1]*amt, c[2]*(1-amt)+bellyC[2]*amt];
      }
    }
    return c;
  }
  var darkSkin=[Math.min(1,skin[0]*0.75+0.08), Math.min(1,skin[1]*0.75+0.08), Math.min(1,skin[2]*0.75+0.08)];

  /* ---- torso + neck + head: proper quadruped ---- */
  var body=new Geo();
  var L=g.bodyLen, W=g.bodyW, H=g.bodyH;
  var stations=[];
  var N=22;
  for (var si=0;si<N;si++){
    var u=si/(N-1); // 0=tail base, 1=nose
    var x=(u-0.5)*L*1.1;
    var rx, ry, y;
    if (u<0.62){
      // torso: tail base -> chest
      // Quadruped: hindquarters rounded, belly tucked, chest deep
      var tu=u/0.62;
      var hindQ=Math.exp(-Math.pow((tu-0.15)/0.25,2)); // hindquarter mass at rear
      var chestD=Math.exp(-Math.pow((tu-0.85)/0.2,2));  // chest depth at front
      rx=W*0.5*(0.45+0.35*hindQ+0.25*chestD);
      ry=H*0.5*(0.5+0.3*hindQ+0.35*chestD);
      // topline: level, belly tucked up (not hanging)
      y=hindQ*H*0.08 - (1-hindQ-chestD)*H*0.05 + chestD*H*0.02;
    } else {
      // neck -> head: RISES UP (not in line with body)
      var hu=(u-0.62)/0.38;
      if (hu<0.4){
        // neck: rises and narrows
        var nu=hu/0.4;
        rx=W*0.5*(0.5-0.18*nu);
        ry=H*0.5*(0.55-0.15*nu);
        y=H*0.1 + nu*H*0.35; // neck rises!
      } else if (hu<0.75){
        // skull: distinct, boxy-ish
        var su=(hu-0.4)/0.35;
        var skull=Math.sin(su*Math.PI);
        rx=W*0.5*(0.32+0.12*skull);
        ry=H*0.5*(0.4+0.12*skull);
        y=H*0.45 + su*H*0.08;
      } else {
        // muzzle: tapers, slightly down
        var mu=(hu-0.75)/0.25;
        rx=W*0.5*0.32*(1-mu*0.65);
        ry=H*0.5*0.4*(1-mu*0.55);
        y=H*0.53 - mu*H*0.12;
      }
    }
    if (u>=0.62){ rx*=g.headScale; ry*=g.headScale; }
    stations.push({x:x, y:y, z:0, rx:Math.max(0.03,rx), ry:Math.max(0.03,ry)});
  }
  tube(body, stations, 14, function(u,v,pos){
    return skinColor(u, v, pos, skin, darkSkin);
  });
  // haunch masses: spheres at rear hips for powerful hindquarters
  var haunchX=-L*0.32, haunchY=H*0.05, haunchZ=W*0.38;
  var hg2=new Geo();
  ball(hg2, 1, 0,0,0, skin, 10, 8);
  for (var hi=0;hi<hg2.pos.length;hi+=3){
    hg2.pos[hi]*=W*0.32; hg2.pos[hi+1]*=H*0.42; hg2.pos[hi+2]*=W*0.28;
  }
  // left haunch
  var hgL=new Geo(); appendGeo(hgL, hg2);
  for (var hli=0;hli<hgL.pos.length;hli+=3){
    hgL.pos[hli]+=haunchX; hgL.pos[hli+1]+=haunchY; hgL.pos[hli+2]+=haunchZ;
  }
  appendGeo(body, hgL);
  // right haunch
  var hgR=new Geo(); appendGeo(hgR, hg2);
  for (var hri=0;hri<hgR.pos.length;hri+=3){
    hgR.pos[hri]+=haunchX; hgR.pos[hri+1]+=haunchY; hgR.pos[hri+2]-=haunchZ;
  }
  appendGeo(body, hgR);
  // eyes: on the sides of the elevated skull
  var eyeX=L*0.5*1.1*0.88, eyeY=H*0.52*g.headScale, eyeZ=W*0.30*g.headScale;
  var eg=new Geo();
  ball(eg, 0.08*g.headScale, eyeX, eyeY, eyeZ, eyeC, 10, 8);
  ball(eg, 0.08*g.headScale, eyeX, eyeY, -eyeZ, eyeC, 10, 8);
  // eye shine
  var shineC=[0.9,0.9,0.9];
  ball(eg, 0.028*g.headScale, eyeX+0.055*g.headScale, eyeY+0.03, eyeZ*0.95, shineC, 6, 5);
  ball(eg, 0.028*g.headScale, eyeX+0.055*g.headScale, eyeY+0.03, -eyeZ*0.95, shineC, 6, 5);
  appendGeo(body, eg);
  // nose tip
  var noseC=[0.15,0.12,0.1];
  ball(eg, 0.05*g.headScale, L*0.5*1.1*0.98, H*0.46*g.headScale, 0, noseC, 8, 6);
  appendGeo(body, eg);

  /* ---- tail: tapered tube with natural curve ---- */
  var tail=[];
  for (var t=0;t<g.tailSegs;t++){
    var tg=new Geo();
    var tl=0.55*(1-t/(g.tailSegs+0.5));
    var r0=0.14*(1-t/g.tailSegs)+0.025, r1=0.14*(1-(t+1)/g.tailSegs)+0.02;
    var tst=[];
    for (var k=0;k<5;k++){
      var ku=k/4;
      tst.push({x:-ku*tl, y:Math.sin(ku*Math.PI)*0.03, z:0,
        rx:r0+(r1-r0)*ku, ry:r0+(r1-r0)*ku});
    }
    tube(tg, tst, 8, function(u,v,pos){ return skinColor(u*0.3, v, pos, skinB, darkSkin); });
    tail.push({geo:tg, len:tl});
  }

  /* ---- legs: simple tapered (reverted for stability; organic tube was breaking IK) ---- */
  function legGeo(len, cTop, cBot){
    var lg=new Geo();
    // upper segment: thicker tapered cylinder along -Y (muscular)
    var r0=0.19, r1=0.11;
    cyl(lg, r0, r1, len, 9, 0, -len/2, 0, cTop, 'y');
    // foot: flattened sphere + toes
    var fg=new Geo();
    ball(fg, 1, 0,0,0, padC, 9, 7);
    for (var i=0;i<fg.pos.length;i+=3){
      fg.pos[i]*=0.11; fg.pos[i+1]*=0.07; fg.pos[i+2]*=0.13;
      fg.pos[i+1]-=len+0.02;
    }
    appendGeo(lg, fg);
    for (var toe=-1;toe<=1;toe++){
      var tg2=new Geo();
      ball(tg2, 0.045, toe*0.07, -len-0.03, 0.1, padC, 7, 5);
      appendGeo(lg, tg2);
    }
    return lg;
  }
  var legUpper=legGeo(g.legLen*g.upperFrac, skin, skinB);
  var legLower=legGeo(g.legLen*(1-g.upperFrac), skinB, skinB);

  /* ---- soft belly: subtle, under chest only ---- */
  var belly={ nx:8, nz:4, pts:[], };
  for (var bz=0;bz<=belly.nz;bz++) for (var bx=0;bx<=belly.nx;bx++){
    var fx=bx/belly.nx-0.5, fz=bz/belly.nz-0.5;
    // small region under the chest, not the whole underside
    belly.pts.push({ x:fx*g.bodyLen*0.4 + g.bodyLen*0.15, y:-g.bodyH*0.42, z:fz*g.bodyW*0.5,
      px:0, py:0, pz:0, pin:(bx===0||bx===belly.nx||bz===0||bz===belly.nz) });
  }
  belly.pts.forEach(function(p){ p.px=p.x; p.py=p.y; p.pz=p.z; });

  return {
    anatomy:a, body:body, tail:tail, legUpper:legUpper, legLower:legLower,
    belly:belly, torsoY:torsoY,
    legDefs:a.nodes.filter(function(n){return n.semanticRole==='locomotor-segment';})
  };
}
function appendGeo(dst, src){
  var base=dst.pos.length/3;
  for (var k=0;k<src.pos.length;k++){ dst.pos.push(src.pos[k]); dst.nrm.push(src.nrm[k]); dst.col.push(src.col[k]); }
  src.idx.forEach(function(ix){ dst.idx.push(ix+base); });
}

/* ============ organic tube builder (Stage A refinement) ============ */
/* Builds smooth tapered tubes along a spine — torso, neck, head, legs.
 * stations: [{x,y,z, rx,ry}] rings along the spine. colorFn(u, v, pos) -> [r,g,b]
 * where u is along-length (0..1), v is around (0..1, 0=top).
 * axis: 'x' for horizontal tubes (torso), 'y' for vertical tubes (legs). */
function tube(geo, stations, radial, colorFn, axis){
  axis=axis||'x';
  var rings=[];
  for (var s=0;s<stations.length;s++){
    var st=stations[s], ring=[];
    var u=s/(stations.length-1);
    for (var i=0;i<radial;i++){
      var v=i/radial, a=v*Math.PI*2;
      var cy=Math.cos(a), sz=Math.sin(a);
      var px, py, pz, nx, ny, nz;
      if (axis==='x'){
        // tube along X: rings in Y-Z plane, v=0 at top (+Y)
        px=st.x; py=st.y+cy*st.ry; pz=st.z+sz*st.rx;
        var nl=Math.hypot(cy*st.rx, sz*st.ry)||1;
        nx=0; ny=cy*st.rx/nl; nz=sz*st.ry/nl;
      } else {
        // tube along Y: rings in X-Z plane
        // v=0 at +Z (front), v=0.25 at +X, etc. — colorFn topness uses v differently
        px=st.x+cy*st.rx; py=st.y; pz=st.z+sz*st.rx;
        var nl2=Math.hypot(cy, sz)||1;
        nx=cy/nl2; ny=0; nz=sz/nl2;
      }
      var c=colorFn(u, v, [px,py,pz]);
      ring.push(geo.v(px,py,pz, nx,ny,nz, c[0],c[1],c[2]));
    }
    rings.push(ring);
  }
  for (var s2=0;s2<stations.length-1;s2++){
    for (var i2=0;i2<radial;i2++){
      var a2=rings[s2][i2], b2=rings[s2][(i2+1)%radial];
      var c2=rings[s2+1][i2], d2=rings[s2+1][(i2+1)%radial];
      geo.idx.push(a2,c2,b2, b2,c2,d2);
    }
  }
  // cap the ends
  function cap(ring, flip, c){
    var cx=0, cy2=0, cz2=0;
    ring.forEach(function(vi){ cx+=geo.pos[vi*3]; cy2+=geo.pos[vi*3+1]; cz2+=geo.pos[vi*3+2]; });
    var n=ring.length; cx/=n; cy2/=n; cz2/=n;
    var ci=geo.v(cx,cy2,cz2, flip?-1:1,0,0, c[0],c[1],c[2]);
    for (var i=0;i<n;i++){
      var a3=ring[i], b3=ring[(i+1)%n];
      if (flip) geo.idx.push(ci,a3,b3); else geo.idx.push(ci,b3,a3);
    }
  }
  var endC=colorFn(1,0.5,[0,0,0]);
  var startC=colorFn(0,0.5,[0,0,0]);
  cap(rings[rings.length-1], false, endC);
  cap(rings[0], true, startC);
}

/* ================= the Lab ================= */
TOOLS.creatures = { mount: function(host){
  var MW=window.MoorWorld;
  var planets=[];
  (MW.sectors()||[]).forEach(function(s){ (s.systems||[]).forEach(function(y){ (y.planets||[]).forEach(function(p){ planets.push(p); }); }); });
  var planet=planets[3]||planets[0];
  var terrain=makeTerrain('lab','temperate');
  var speciesSeed='prime', individualSeed='alpha-1';
  var anatomy=null, compiled=null, diagReport=null;
  var playing=true, softness=1, showInspector=false;
  // creature state
  var S={ x:0, z:0, heading:0.6, speed:0, targetSpeed:1.1, tx:6, tz:4, phase:0 };
  var feet=[]; // per leg runtime: {plant:[x,y,z], phase, swinging, from, to}

  host.innerHTML =
    '<p class="meta"><b>Creature Lab — Stage A: end-to-end walker.</b> '+
    'Deterministic anatomy → validation + repair → compiled mesh/rig/soft-tissue → procedural walking. '+
    'Stages B–G (swimming, flight, breeding, ecosystems) are planned, not present.</p>'+
    '<div class="t-controls">'+
    '<label>Habitat <select id="cl-ter"><option value="temperate">Temperate uneven</option><option value="rocky">High-gravity rocky</option><option value="cold">Cold terrain</option></select></label>'+
    '<label>Species seed <input id="cl-ss" value="prime" spellcheck="false" style="width:80px"></label>'+
    '<label>Individual <input id="cl-is" value="alpha-1" spellcheck="false" style="width:80px"></label>'+
    '<button class="btn primary" id="cl-gen">Generate</button>'+
    '<button class="btn" id="cl-remix">Remix individual</button>'+
    '</div>'+
    '<div class="t-controls">'+
    '<button class="btn" id="cl-play">Pause</button>'+
    '<label>Softness <input id="cl-soft" type="range" min="20" max="150" value="100"></label>'+
    '<button class="btn" id="cl-insp">Inspector</button>'+
    '<button class="btn" id="cl-save">Export</button>'+
    '<label class="btn">Import<input id="cl-load" type="file" accept=".json" hidden></label>'+
    '</div>'+
    '<canvas id="cl-cv" width="640" height="400" style="width:100%;border-radius:12px;touch-action:none"></canvas>'+
    '<div class="meta" id="cl-info"></div>'+
    '<div class="t-sec" id="cl-inspect" style="display:none"><div class="eyebrow">Inspector — anatomy, validation, diagnostics</div>'+
    '<div class="meta mono" id="cl-diag" style="white-space:pre-wrap;max-height:220px;overflow:auto"></div></div>'+
    '<p class="meta">Click the ground to set a walk target. Same seeds → same creature, byte-identical anatomy hash.</p>';

  /* ---------- WebGL ---------- */
  var cv=host.querySelector('#cl-cv'), gl=cv.getContext('webgl',{antialias:true,preserveDrawingBuffer:true});
  var VS='attribute vec3 p;attribute vec3 n;attribute vec3 c;'+
    'uniform mat4 mvp;uniform mat4 model;'+
    'varying vec3 vN;varying vec3 vC;'+
    'void main(){vec4 wp=model*vec4(p,1.0);vN=mat3(model)*n;vC=c;'+
    'gl_Position=mvp*wp;}';
  var FS='precision mediump float;varying vec3 vN;varying vec3 vC;'+
    'void main(){vec3 N=normalize(vN);'+
    'float ndl=max(dot(N,normalize(vec3(0.5,0.8,0.35))),0.0);'+
    'float up=N.y*0.5+0.5;'+
    'vec3 lit=vC*(0.45+0.75*ndl+0.25*up);'+
    'gl_FragColor=vec4(lit,1.0);}';
  function sh(t,s){ var h=gl.createShader(t); gl.shaderSource(h,s); gl.compileShader(h); return h; }
  var pr=gl.createProgram();
  gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));
  gl.linkProgram(pr); gl.useProgram(pr);
  var aP=gl.getAttribLocation(pr,'p'), aNorm=gl.getAttribLocation(pr,'n'), aC=gl.getAttribLocation(pr,'c');
  var uMVP=gl.getUniformLocation(pr,'mvp'), uModel=gl.getUniformLocation(pr,'model');
  var meshCache={};
  function toMesh(geo){
    var key=geo.__mk;
    if (key&&meshCache[key]) return meshCache[key];
    var lp=gl.getAttribLocation(pr,'p'), ln=gl.getAttribLocation(pr,'n'), lc=gl.getAttribLocation(pr,'c');
    // Expand indexed geometry to non-indexed triangle soup (avoids index buffer issues)
    var pos=[], nrm=[], col=[];
    for (var i=0;i<geo.idx.length;i++){
      var vi=geo.idx[i]*3;
      pos.push(geo.pos[vi],geo.pos[vi+1],geo.pos[vi+2]);
      nrm.push(geo.nrm[vi],geo.nrm[vi+1],geo.nrm[vi+2]);
      col.push(geo.col[vi],geo.col[vi+1],geo.col[vi+2]);
    }
    function buf(arr,loc){
      var b=gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER,b);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);
      return {b:b,loc:loc,sz:3};
    }
    var m={p:buf(pos,lp),n:buf(nrm,ln),c:buf(col,lc),count:geo.idx.length,indexed:false};
    if (geo.pos.length/3<65536){
      key='k'+Math.random().toString(36).slice(2); geo.__mk=key; meshCache[key]=m;
    }
    return m;
  }
  function drawGeo(geo, model){
    var m=toMesh(geo);
    gl.uniformMatrix4fv(uModel,false,model);
    var attrs=[m.p,m.n,m.c];
    for (var i=0;i<attrs.length;i++){
      var at=attrs[i];
      gl.bindBuffer(gl.ARRAY_BUFFER,at.b);
      gl.enableVertexAttribArray(at.loc);
      gl.vertexAttribPointer(at.loc,at.sz,gl.FLOAT,false,0,0);
    }
    gl.drawArrays(gl.TRIANGLES,0,m.count);
  }
  function matIdentity(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function matMul(a,b){ var o=new Float32Array(16);
    for (var c=0;c<4;c++) for (var r=0;r<4;r++)
      o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];
    return o; }
  function matTrans(x,y,z){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]); }
  function matRotY(a){ var c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
  function matRotX(a){ var c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }
  function matRotZ(a){ var c=Math.cos(a),s=Math.sin(a);
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]); }
  // terrain mesh (fixture)
  var terGeo=(function(){
    var g=new Geo(), N=48, SZ=44;
    var c1=hx('#3a5a3a'), c2=hx('#5a6a4a');
    for (var j=0;j<=N;j++) for (var i=0;i<=N;i++){
      var x=(i/N-0.5)*SZ, z=(j/N-0.5)*SZ, y=terrain.height(x,z);
      var t=Math.min(1,Math.max(0,(y+3)/6));
      g.v(x,y,z, 0,1,0, c1[0]+(c2[0]-c1[0])*t, c1[1]+(c2[1]-c1[1])*t, c1[2]+(c2[2]-c1[2])*t);
    }
    for (var y2=0;y2<N;y2++) for (var x2=0;x2<N;x2++){
      var a=y2*(N+1)+x2, b=a+1, c=a+N+1, d=c+1;
      g.idx.push(a,c,b,b,c,d);
    }
    // compute normals
    var gg=new Geo(); gg.pos=g.pos; gg.idx=g.idx;
    // (flat-up normals are fine for the fixture look; skip true normals)
    return g;
  })();

  /* ---------- camera ---------- */
  var camYaw=0.7, camPitch=0.32, camDist=10, dragging=false, lx=0, ly=0;
  cv.addEventListener('pointerdown',function(e){dragging=true;lx=e.clientX;ly=e.clientY;cv.setPointerCapture(e.pointerId);});
  cv.addEventListener('pointermove',function(e){if(!dragging)return;
    camYaw+=(e.clientX-lx)*0.008; camPitch=Math.max(0.15,Math.min(1.35,camPitch+(e.clientY-ly)*0.008));
    lx=e.clientX;ly=e.clientY;});
  cv.addEventListener('pointerup',function(){dragging=false;});
  cv.addEventListener('wheel',function(e){e.preventDefault();camDist=Math.max(6,Math.min(30,camDist*(1+e.deltaY*0.001)));},{passive:false});
  // click-to-move (click without drag)
  var downPos=null;
  cv.addEventListener('pointerdown',function(e){downPos=[e.clientX,e.clientY];});
  cv.addEventListener('pointerup',function(e){
    if (!downPos) return;
    var moved=Math.hypot(e.clientX-downPos[0],e.clientY-downPos[1]); downPos=null;
    if (moved>6||!compiled) return;
    var r=cv.getBoundingClientRect();
    var nx=((e.clientX-r.left)/r.width)*2-1, ny=-(((e.clientY-r.top)/r.height)*2-1);
    // unproject onto y=0 plane
    var mvp=currentMVP;
    var inv=matInverse(mvp);
    function unproj(px,py,pz){
      var v=[px,py,pz,1], o=[0,0,0,0];
      for (var r2=0;r2<4;r2++) o[r2]=inv[r2]*v[0]+inv[4+r2]*v[1]+inv[8+r2]*v[2]+inv[12+r2]*v[3];
      return [o[0]/o[3],o[1]/o[3],o[2]/o[3]];
    }
    var a=unproj(nx,ny,-1), b=unproj(nx,ny,1);
    var t=-a[1]/(b[1]-a[1]);
    if (t>0&&t<100){ S.tx=a[0]+(b[0]-a[0])*t; S.tz=a[2]+(b[2]-a[2])*t; }
  });
  function matInverse(m){
    var inv=new Float32Array(16);
    inv[0]=m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];
    inv[4]=-m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    inv[8]=m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];
    inv[12]=-m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    inv[1]=-m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];
    inv[5]=m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    inv[9]=-m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];
    inv[13]=m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    inv[2]=m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];
    inv[6]=-m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    inv[10]=m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];
    inv[14]=-m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    inv[3]=-m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];
    inv[7]=m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    inv[11]=-m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];
    inv[15]=m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
    var det=m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];
    if (!det) return matIdentity();
    det=1/det; for (var i=0;i<16;i++) inv[i]*=det;
    return inv;
  }

  /* ---------- generate ---------- */
  function generate(ss, is){
    speciesSeed=ss; individualSeed=is;
    var genome=resolveGenome(ss,is);
    anatomy=expandAnatomy(genome, planet);
    diagReport=repair(anatomy);
    compiled=compile(anatomy);
    // init feet
    feet=compiled.legDefs.map(function(ld,i){
      var p=ld.restPose.p;
      var wx=S.x+Math.cos(S.heading)*p[0]-Math.sin(S.heading)*p[2];
      var wz=S.z+Math.sin(S.heading)*p[0]+Math.cos(S.heading)*p[2];
      var s=terrain.sampleSurface(wx,wz);
      return { plant:[wx,s.position[1],wz], phase:gaitPhase(i,genome.legCount),
               swinging:false, from:null, to:null, t:0 };
    });
    meshCache={};
    var errs=diagReport.diags.filter(function(d){return d.severity==='error';});
    host.querySelector('#cl-info').innerHTML=
      '<b>'+esc(anatomy.genome.legCount)+'-leg walker</b> · '+esc(planet.name)+' ('+esc(anatomy.planet.type)+') · '+
      'anatomy hash <span class="mono">'+anatomy.hash.slice(0,12)+'…</span> · '+
      'validation: '+(errs.length? errs.length+' errors' : 'clean')+
      (diagReport.log.length? ' · repaired: '+esc(diagReport.log.join('; ')) : '')+
      ' · mass '+genome.massKg.toFixed(0)+' kg';
    renderDiag();
  }
  function gaitPhase(i,n){
    if (n===4){ return [0,0.5,0.5,0][i%4]; }
    // 6 legs: lateral wave
    return [0,0.5,0.25,0.75,0.5,0][i%6];
  }
  function renderDiag(){
    if (!showInspector||!anatomy) return;
    var L=[];
    L.push('SPECIES '+anatomy.speciesId+'  grammar '+anatomy.grammarVersion+'  schema '+anatomy.schemaVersion);
    L.push('genome: '+anatomy.genome.legCount+' legs, body '+anatomy.genome.bodyLen.toFixed(2)+'m, mass '+anatomy.genome.massKg.toFixed(0)+'kg');
    L.push('anatomy hash: '+anatomy.hash);
    L.push('nodes: '+anatomy.nodes.length+'  soft regions: '+anatomy.softRegions.map(function(r){return r.id;}).join(','));
    L.push('--- validation ---');
    if (!diagReport.diags.length) L.push('clean');
    diagReport.diags.forEach(function(d){ L.push((d.severity==='error'?'ERR ':'warn ')+d.check+' @'+d.id+' — '+d.why); });
    L.push('--- repairs ('+diagReport.passes+' passes) ---');
    diagReport.log.forEach(function(l){ L.push('fixed: '+l); });
    L.push('--- capabilities (implemented) ---');
    L.push('walking (trot/wave gait, 2-bone IK, terrain feet) ✓');
    L.push('soft belly (verlet, inertia) ✓');
    L.push('swimming / flight / climbing / burrowing — PLANNED (Stage D–E)');
    L.push('breeding / damage / ecosystem — PLANNED (Stage F–G)');
    host.querySelector('#cl-diag').textContent=L.join('\n');
  }

  /* ---------- locomotion ---------- */
  function legLocal(i){
    var ld=compiled.legDefs[i];
    return ld.restPose.p;
  }
  function step(dt){
    if (!compiled||!playing) return;
    var g=anatomy.genome;
    // steering toward target
    var dx=S.tx-S.x, dz=S.tz-S.z, dist=Math.hypot(dx,dz);
    var wantHeading=Math.atan2(dz,dx);
    var dh=wantHeading-S.heading;
    while (dh>Math.PI)dh-=Math.PI*2; while (dh<-Math.PI)dh+=Math.PI*2;
    var turnRate=Math.max(-1.5,Math.min(1.5,dh*3));
    S.heading+=Math.max(-1.5*dt,Math.min(1.5*dt,dh));
    S.targetSpeed = dist>0.6 ? 1.1 : 0;
    var prevSpeed=S.speed;
    S.speed += (S.targetSpeed-S.speed)*Math.min(1,dt*2.5);
    S.accel=((S.speed-prevSpeed)/Math.max(dt,1e-4));
    var stride=0.55*g.strideF*(0.4+S.speed);
    var cycleT=Math.max(0.5, 1.15-S.speed*0.35);
    S.phase+=dt/cycleT*(S.speed>0.05?1:0);
    var ch=Math.cos(S.heading), sh=Math.sin(S.heading);
    // body follows terrain + gait bob
    // (roll removed: body mesh rolling without hips following looks like tipping over)
    var bs=terrain.sampleSurface(S.x,S.z);
    // bob at 2x stride frequency, amplitude scales with speed
    var bobA=0.06*Math.min(1,S.speed);
    var bob=Math.sin(S.phase*Math.PI*2*2)*bobA;
    var targetY=bs.position[1]+compiled.torsoY+bob;
    S.y=(S.y==null?targetY:S.y+(targetY-S.y)*Math.min(1,dt*6));
    // pitch with acceleration (subtle lean)
    var targetPitch=Math.max(-0.12,Math.min(0.12,-S.accel*0.05));
    S.pitch=(S.pitch==null?targetPitch:S.pitch+(targetPitch-S.pitch)*Math.min(1,dt*4));
    S.roll=0;
    S.x+=Math.cos(S.heading)*S.speed*dt;
    S.z+=Math.sin(S.heading)*S.speed*dt;
    // keep in bounds
    if (Math.abs(S.x)>20){S.x=Math.sign(S.x)*20;S.tx=-S.tx;}
    if (Math.abs(S.z)>20){S.z=Math.sign(S.z)*20;S.tz=-S.tz;}
    // feet
    feet.forEach(function(f,i){
      var lp=legLocal(i);
      // neutral foot in world
      var nx=S.x+ch*lp[0]-sh*lp[2]+ch*0.25, nz=S.z+sh*lp[0]+ch*lp[2]+sh*0.25;
      var cyc=(S.phase+f.phase)%1;
      var swinging=cyc>g.dutyF;
      if (swinging&&!f.swinging){
        // lift: choose new target ahead
        f.swinging=true; f.from=f.plant.slice();
        var lead=stride*1.4;
        var tx2=nx+Math.cos(S.heading)*lead*0.5, tz2=nz+Math.sin(S.heading)*lead*0.5;
        var s2=terrain.sampleSurface(tx2,tz2);
        f.to=[tx2,s2.position[1],tz2]; f.t=0;
      }
      if (!swinging){ f.swinging=false; }
      else {
        f.t+=dt/(cycleT*(1-g.dutyF));
        var k=Math.min(1,f.t), e=k*k*(3-2*k);
        var lift=Math.sin(e*Math.PI)*0.35;
        var s3=terrain.sampleSurface(
          f.from[0]+(f.to[0]-f.from[0])*e, f.from[2]+(f.to[2]-f.from[2])*e);
        f.plant=[ f.from[0]+(f.to[0]-f.from[0])*e,
                  s3.position[1]+lift,
                  f.from[2]+(f.to[2]-f.from[2])*e ];
        if (k>=1){ f.swinging=false; f.plant=f.to.slice(); }
      }
    });
    // soft belly verlet — exaggerated for visibility, scaled by softness
    var b=compiled.belly, damp=0.965-(1-softness)*0.06;
    var jiggle=softness; // 0.2..1.5
    // track body acceleration for flesh lag (in creature-local frame approx)
    b.pts.forEach(function(p){
      if (p.pin){
        p.x=p.px; p.y=p.py; p.z=p.pz; return;
      }
      var vx=(p.x-p.px)*damp, vy=(p.y-p.py)*damp, vz=(p.z-p.pz)*damp;
      p.px=p.x; p.py=p.y; p.pz=p.z;
      // gravity + lateral slosh from turning/acceleration
      p.x+=vx - S.accel*dt*dt*30*jiggle*ch - turnRate*dt*dt*40*jiggle*sh;
      p.y+=vy - 9.8*dt*dt*10*jiggle;
      p.z+=vz - S.accel*dt*dt*30*jiggle*sh + turnRate*dt*dt*40*jiggle*ch;
    });
    for (var it=0;it<3;it++){
      // distance constraints to neighbors
      for (var zi=0;zi<=b.nz;zi++) for (var xi=0;xi<=b.nx;xi++){
        var idx=zi*(b.nx+1)+xi, p0=b.pts[idx];
        [[1,0],[0,1]].forEach(function(d){
          var xj=xi+d[0], zj=zi+d[1];
          if (xj>b.nx||zj>b.nz) return;
          var p1=b.pts[zj*(b.nx+1)+xj];
          // rest length from initial layout (small chest belly)
          var rx=(d[0]? (anatomy.genome.bodyLen*0.4/b.nx):0),
              rz=(d[1]? (anatomy.genome.bodyW*0.5/b.nz):0);
          var rest=Math.hypot(rx,rz);
          var dx=p1.x-p0.x, dy=p1.y-p0.y, dz=p1.z-p0.z;
          var dd=Math.hypot(dx,dy,dz)||1e-6, diff=(dd-rest)/dd*0.5;
          if (!p0.pin){p0.x+=dx*diff;p0.y+=dy*diff;p0.z+=dz*diff;}
          if (!p1.pin){p1.x-=dx*diff;p1.y-=dy*diff;p1.z-=dz*diff;}
        });
      }
    }
    // belly world transform: belly pts are creature-local; convert at draw time
  }

  /* ---------- 2-bone IK ---------- */
  function solveLeg(hipW, footW, l1, l2, poleW){
    var toF=[footW[0]-hipW[0],footW[1]-hipW[1],footW[2]-hipW[2]];
    var d=Math.hypot(toF[0],toF[1],toF[2]);
    var maxD=(l1+l2)*0.999, minD=Math.abs(l1-l2)*1.05+0.01;
    var dc=Math.max(minD,Math.min(maxD,d));
    var dir=[toF[0]/d,toF[1]/d,toF[2]/d];
    // knee via law of cosines
    var a1=Math.acos(Math.max(-1,Math.min(1,(l1*l1+dc*dc-l2*l2)/(2*l1*dc))));
    // bend axis = normalize(cross(dir, pole))
    var px=poleW[0],py=poleW[1],pz=poleW[2];
    var cx=dir[1]*pz-dir[2]*py, cy=dir[2]*px-dir[0]*pz, cz=dir[0]*py-dir[1]*px;
    var cl=Math.hypot(cx,cy,cz)||1; cx/=cl;cy/=cl;cz/=cl;
    // knee = hip + R(dir, +a1 around axis)*l1... use Rodrigues
    var cosA=Math.cos(a1), sinA=Math.sin(a1);
    var kx=dir[0]*cosA+(cy*dir[2]-cz*dir[1])*sinA+cx*(cx*dir[0]+cy*dir[1]+cz*dir[2])*(1-cosA);
    var ky=dir[1]*cosA+(cz*dir[0]-cx*dir[2])*sinA+cy*(cx*dir[0]+cy*dir[1]+cz*dir[2])*(1-cosA);
    var kz=dir[2]*cosA+(cx*dir[1]-cy*dir[0])*sinA+cz*(cx*dir[0]+cy*dir[1]+cz*dir[2])*(1-cosA);
    var knee=[hipW[0]+kx*l1, hipW[1]+ky*l1, hipW[2]+kz*l1];
    var footC=[hipW[0]+dir[0]*dc, hipW[1]+dir[1]*dc, hipW[2]+dir[2]*dc];
    return {knee:knee, foot:footC, stretched:d>maxD};
  }

  /* ---------- render ---------- */
  var currentMVP=matIdentity();
  // persistent dynamic buffers for belly cloth + target marker (updated per frame, not re-created)
  var dynBelly=null, dynMarker=null;
  function getDynBelly(nverts){
    if (!dynBelly){
      dynBelly={};
      [['p',3],['n',3],['c',3]].forEach(function(x){
        var b=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,b);
        gl.bufferData(gl.ARRAY_BUFFER, nverts*x[1]*4, gl.DYNAMIC_DRAW);
        dynBelly[x[0]]={b:b, sz:x[1], loc:x[0]==='p'?aP:(x[0]==='n'?aNorm:aC)};
      });
      var ib=gl.createBuffer(); dynBelly.ib=ib;
    }
    return dynBelly;
  }
  function getDynMarker(){
    if (!dynMarker){
      var mg=new Geo(); var mc=hx('#5bd8ff');
      cyl(mg, 0.12,0.12,1.2,8, 0,0,0, mc,'y');
      dynMarker={geo:mg, mesh:toMesh(mg)};
    }
    return dynMarker;
  }
  function persp(f,a,n,f2){ var t=1/Math.tan(f/2),o=new Float32Array(16);
    o[0]=t/a;o[5]=t;o[10]=(f2+n)/(n-f2);o[11]=-1;o[14]=2*f2*n/(n-f2);return o; }
  function lookAt(e,c){
    var zx=e[0]-c[0],zy=e[1]-c[1],zz=e[2]-c[2],l=Math.hypot(zx,zy,zz);
    zx/=l;zy/=l;zz/=l;
    var xx=zz,xz=-zx;l=Math.hypot(xx,xz)||1;xx/=l;xz/=l;
    var yx=zy*xz-zz*0, yy=zz*xx-zx*xz, yz=-zy*xx;
    return new Float32Array([xx,yx,zx,0, 0,yy,zy,0, xz,yz,zz,0,
      -(xx*e[0]+xz*e[2]), -(yx*e[0]+yy*e[1]+yz*e[2]), -(zx*e[0]+zy*e[1]+zz*e[2]),1]);
  }
  function segModel(from, to, r){
    // model matrix aligning +Y cylinder from->to (for limb segments drawn along Y)
    var dx=to[0]-from[0], dy=to[1]-from[1], dz=to[2]-from[2];
    var len=Math.hypot(dx,dy,dz)||1e-6;
    var ux=dx/len, uy=dy/len, uz=dz/len;
    // rotation taking +Y to u
    var dot=uy, ang=Math.acos(Math.max(-1,Math.min(1,dot)));
    var ax=uz, az=-ux; // axis = Y x u
    var al=Math.hypot(ax,az);
    var m;
    if (al<1e-4){ m=matIdentity(); if (dot<0) m=matRotX(Math.PI); }
    else {
      ax/=al; az/=al;
      var c=Math.cos(ang), s=Math.sin(ang), t=1-c;
      m=new Float32Array([
        t*ax*ax+c, t*ax*0+s*az, t*ax*az-s*0, 0,
        t*ax*0-s*az, t*0*0+c, t*0*az+s*ax, 0,
        t*ax*az+s*0, t*0*az-s*ax, t*az*az+c, 0,
        0,0,0,1]);
      // note: geometry built along -Y from origin; we want +Y->u then translate
    }
    // scale Y by len (geometry is unit-ish? no — geometry has real length; use as-is)
    return matMul(matTrans(from[0],from[1],from[2]), m);
  }

  var raf=0, lastT=performance.now();
  function frame(now){
    raf=requestAnimationFrame(frame);
    var dt=Math.min(0.05,(now-lastT)/1000); lastT=now;
    step(dt);
    gl.viewport(0,0,cv.width,cv.height);
    gl.clearColor(0.05,0.07,0.11,1);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    var cx=S.x, cz=S.z, cy=(S.y||2);
    var eye=[cx+Math.cos(camYaw)*Math.cos(camPitch)*camDist, cy+Math.sin(camPitch)*camDist,
             cz+Math.sin(camYaw)*Math.cos(camPitch)*camDist];
    var mvp=matMul(persp(0.9,cv.width/cv.height,0.1,120), lookAt(eye,[cx,cy,cz]));
    currentMVP=mvp;
    gl.uniformMatrix4fv(uMVP,false,mvp);
    // terrain
    drawGeo(terGeo, matIdentity());
    if (!compiled) return;
    var g=anatomy.genome, ch=Math.cos(S.heading), sh=Math.sin(S.heading);
    var bodyM=matMul(matTrans(S.x,S.y,S.z), matRotY(-S.heading));
    // apply roll (bank into turns) and pitch (acceleration lean)
    if (S.roll) bodyM=matMul(bodyM, matRotX(S.roll));
    if (S.pitch) bodyM=matMul(bodyM, matRotZ(S.pitch));
    // body (torso+head, creature-local with torso at y=0)
    drawGeo(compiled.body, matMul(bodyM, matTrans(0,0,0)));
    // legs
    var upperL=g.legLen*g.upperFrac, lowerL=g.legLen*(1-g.upperFrac);
    compiled.legDefs.forEach(function(ld,i){
      var lp=ld.restPose.p;
      var hipW=[S.x+ch*lp[0]-sh*lp[2], S.y+lp[1], S.z+sh*lp[0]+ch*lp[2]];
      var f=feet[i];
      // pole: knees point outward (away from body) and slightly forward
      var sideSign=(lp[2]>0?1:-1);
      var outX=-sh*sideSign, outZ=ch*sideSign; // local +Z transformed to world
      var poleW=[hipW[0]+outX*0.4+ch*0.2, hipW[1]-0.2, hipW[2]+outZ*0.4+sh*0.2];
      var sol=solveLeg(hipW, f.plant, upperL, lowerL, poleW);
      // upper: hip->knee ; lower: knee->foot
      drawGeo(compiled.legUpper, segModel(hipW, sol.knee));
      drawGeo(compiled.legLower, segModel(sol.knee, sol.foot));
    });
    // tail
    var tx=-g.bodyLen*0.5, ty=g.bodyH*0.1;
    var px=S.x+ch*tx, py=S.y+ty, pz=S.z+sh*tx;
    var dirx=ch, dirz=sh, t=now/1000;
    compiled.tail.forEach(function(seg,ti){
      var wag=Math.sin(t*3+ti*0.9)*0.12*(ti+1)/compiled.tail.length*S.speed;
      var nx=px-dirx*seg.len*0.9, nz=pz-dirz*seg.len*0.9;
      var ny=py+Math.sin(t*2+ti)*0.02;
      // perpendicular wag
      nx+=-dirz*wag*seg.len; nz+=dirx*wag*seg.len;
      var from=[px,py,pz], to=[nx,ny,nz];
      // tail geo is along X centered; build model: translate to midpoint, rotY to dir
      var ang=Math.atan2(-(to[2]-from[2]), to[0]-from[0]);
      var mid=[(from[0]+to[0])/2,(from[1]+to[1])/2,(from[2]+to[2])/2];
      drawGeo(seg.geo, matMul(matTrans(mid[0],mid[1],mid[2]), matRotY(-ang)));
      px=nx; py=ny; pz=nz;
    });
    // belly cloth (creature-local -> world) — update persistent buffer
    var b=compiled.belly;
    function bw(p){ return [S.x+ch*p.x-sh*p.z, S.y+p.y, S.z+sh*p.x+ch*p.z]; }
    var db=getDynBelly(b.pts.length);
    var bpos=new Float32Array(b.pts.length*3), bnrm=new Float32Array(b.pts.length*3), bcol=new Float32Array(b.pts.length*3);
    // use skin color (not green) for the belly, slightly lighter
    var bc=hx(anatomy.materials.skin);
    bc=[Math.min(1,bc[0]*1.15), Math.min(1,bc[1]*1.15), Math.min(1,bc[2]*1.15)];
    b.pts.forEach(function(p,vi){
      var w=bw(p);
      bpos[vi*3]=w[0]; bpos[vi*3+1]=w[1]; bpos[vi*3+2]=w[2];
      bnrm[vi*3]=0; bnrm[vi*3+1]=-1; bnrm[vi*3+2]=0;
      bcol[vi*3]=bc[0]; bcol[vi*3+1]=bc[1]; bcol[vi*3+2]=bc[2];
    });
    var bidx=[];
    for (var zi=0;zi<b.nz;zi++) for (var xi=0;xi<b.nx;xi++){
      var a2=zi*(b.nx+1)+xi, b2=a2+1, c2=a2+b.nx+1, d2=c2+1;
      bidx.push(a2,c2,b2, b2,c2,d2);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, db.p.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, bpos);
    gl.bindBuffer(gl.ARRAY_BUFFER, db.n.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, bnrm);
    gl.bindBuffer(gl.ARRAY_BUFFER, db.c.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, bcol);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, db.ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bidx), gl.DYNAMIC_DRAW);
    gl.uniformMatrix4fv(uModel,false,matIdentity());
    [['p',db.p],['n',db.n],['c',db.c]].forEach(function(x){
      gl.bindBuffer(gl.ARRAY_BUFFER,x[1].b); gl.enableVertexAttribArray(x[1].loc);
      gl.vertexAttribPointer(x[1].loc,x[1].sz,gl.FLOAT,false,0,0); });
    gl.drawElements(gl.TRIANGLES,bidx.length,gl.UNSIGNED_SHORT,0);
    // walk target marker
    drawGeo(getDynMarker().geo, matTrans(S.tx,terrain.height(S.tx,S.tz)+0.6,S.tz));
  }

  /* ---------- UI wiring ---------- */
  host.querySelector('#cl-gen').onclick=function(){
    generate(host.querySelector('#cl-ss').value||'prime', host.querySelector('#cl-is').value||'alpha-1');
  };
  host.querySelector('#cl-remix').onclick=function(){
    var r=stream('remix',speciesSeed+':'+individualSeed+':'+Date.now());
    generate(speciesSeed, 'remix-'+Math.floor(r()*1e6).toString(36));
    host.querySelector('#cl-is').value=individualSeed;
  };
  host.querySelector('#cl-play').onclick=function(e){
    playing=!playing; e.target.textContent=playing?'Pause':'Play';
  };
  host.querySelector('#cl-soft').oninput=function(e){ softness=e.target.value/100; };
  host.querySelector('#cl-insp').onclick=function(){
    showInspector=!showInspector;
    host.querySelector('#cl-inspect').style.display=showInspector?'':'none';
    renderDiag();
  };
  host.querySelector('#cl-ter').onchange=function(e){
    terrain=makeTerrain('lab', e.target.value);
  };
  host.querySelector('#cl-save').onclick=function(){
    if (!anatomy) return;
    var data={ app:'moor-creature-lab', schemaVersion:SCHEMA_VERSION,
      speciesId:anatomy.speciesId, speciesSeed:speciesSeed, individualSeed:individualSeed,
      anatomyHash:anatomy.hash, genome:anatomy.genome,
      state:{x:S.x,z:S.z,heading:S.heading} };
    var blob=new Blob([JSON.stringify(data)],{type:'application/json'});
    var aEl=document.createElement('a');
    aEl.href=URL.createObjectURL(blob);
    aEl.download='creature-'+individualSeed+'.json';
    aEl.click(); setTimeout(function(){URL.revokeObjectURL(aEl.href);},2000);
  };
  host.querySelector('#cl-load').onchange=function(e){
    var f=e.target.files[0]; if (!f) return;
    var rd=new FileReader();
    rd.onload=function(){
      try {
        var d=JSON.parse(rd.result);
        if (d.app!=='moor-creature-lab') throw new Error('not a creature file');
        generate(d.speciesSeed, d.individualSeed);
        if (d.anatomyHash!==anatomy.hash) throw new Error('hash mismatch — generator changed');
        S.x=d.state.x; S.z=d.state.z; S.heading=d.state.heading;
        host.querySelector('#cl-ss').value=d.speciesSeed;
        host.querySelector('#cl-is').value=d.individualSeed;
      } catch(err){ host.querySelector('#cl-info').textContent='Import failed: '+err.message; }
    };
    rd.readAsText(f);
  };

  generate(speciesSeed, individualSeed);
  frame(performance.now());
  TOOLS.creatures.unmount=function(){ cancelAnimationFrame(raf); };
}};

function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

})();
