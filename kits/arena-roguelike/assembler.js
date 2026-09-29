/* Moor kit: arena-roguelike
 * Exposes window.MoorKit.build(config) -> complete HTML document string.
 * Archero-style top-down arena roguelike. 2D canvas, procedural art, no assets.
 */
(function () {
'use strict';

var HEROES = {
  archer: { label: 'Archer', dmg: 10, cd: 0.55, ps: 540, pr: 5, ms: 250, color: '#ffd166', desc: 'Balanced bow' },
  mage:   { label: 'Mage',   dmg: 17, cd: 0.85, ps: 440, pr: 8, ms: 235, color: '#c77dff', desc: 'Heavy bolts' },
  gunner: { label: 'Gunner', dmg: 7,  cd: 0.30, ps: 660, pr: 4, ms: 265, color: '#7df9ff', desc: 'Rapid fire' }
};

var THEMES = {
  dungeon: { label: 'Dungeon', bg: '#0b0d16', floor: '#121627', wall: '#2a2f4a', acc: '#8b7bff', grid: 'rgba(139,123,255,0.07)', foe: '#ff5d5d' },
  forest:  { label: 'Forest',  bg: '#08120d', floor: '#0d1c13', wall: '#1e3a28', acc: '#4ade80', grid: 'rgba(74,222,128,0.07)', foe: '#ff5d5d' },
  neon:    { label: 'Neon',    bg: '#040409', floor: '#0a0a16', wall: '#1c1c38', acc: '#22d3ee', grid: 'rgba(34,211,238,0.09)', foe: '#ff4d6d' }
};

var DIFFS = {
  chill:   { label: 'Chill',   hp: 0.7,  sp: 0.85, dmg: 0.7, count: 0.7 },
  classic: { label: 'Classic', hp: 1.0,  sp: 1.0,  dmg: 1.0, count: 1.0 },
  brutal:  { label: 'Brutal',  hp: 1.45, sp: 1.15, dmg: 1.3, count: 1.45 }
};

function pick(v, table, fb) { return (v && table[v]) ? v : fb; }

function build(config) {
  config = config || {};
  var heroId = pick(config.hero, HEROES, 'archer');
  var themeId = pick(config.theme, THEMES, 'dungeon');
  var diffId = pick(config.difficulty, DIFFS, 'classic');
  var H = HEROES[heroId], T = THEMES[themeId];
  var cfgJson = JSON.stringify({ hero: heroId, theme: themeId, difficulty: diffId }).replace(/</g, '\\u003c');

  var L = [];
  L.push('<!DOCTYPE html>');
  L.push('<html lang="en"><head><meta charset="utf-8">');
  L.push('<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">');
  L.push('<title>Arena Roguelike</title>');
  L.push('<style>');
  L.push('*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}');
  L.push('html,body{margin:0;padding:0;height:100%;overflow:hidden;background:' + T.bg + ';color:#f2f3f7;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-user-select:none;user-select:none}');
  L.push(':root{--acc:' + T.acc + '}');
  L.push('#game{position:fixed;inset:0;touch-action:none;display:block}');
  L.push('#hud{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 72px 0 14px;pointer-events:none;z-index:5}');
  L.push('#hearts{display:flex;gap:4px}');
  L.push('.pip{width:14px;height:14px;border-radius:50%;background:var(--acc);box-shadow:0 0 8px var(--acc)}');
  L.push('.pip.off{background:rgba(255,255,255,.14);box-shadow:none}');
  L.push('#roomlbl{font-weight:800;letter-spacing:.08em;font-size:13px;opacity:.9}');
  L.push('#coinlbl{font-weight:700;font-size:13px;color:#ffd166}');
  L.push('#foelbl{font-size:12px;opacity:.65;margin-left:auto}');
  L.push('#pauseBtn{position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);right:10px;width:48px;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:rgba(16,18,30,.72);color:#fff;font-size:18px;font-weight:800;z-index:6;backdrop-filter:blur(8px)}');
  L.push('#overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(2,3,8,.62);backdrop-filter:blur(10px);z-index:10;padding:20px}');
  L.push('.card{background:rgba(18,20,34,.94);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:26px 22px;width:100%;max-width:360px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.5)}');
  L.push('.card h1{margin:0 0 4px;font-size:30px;letter-spacing:.02em}');
  L.push('.card h2{margin:0 0 10px;font-size:20px}');
  L.push('.sub{opacity:.65;font-size:14px;margin:0 0 6px;line-height:1.5}');
  L.push('.cfgline{display:inline-block;margin:8px 0 4px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:13px;font-weight:600}');
  L.push('.btn{display:block;width:100%;min-height:56px;margin-top:12px;border:none;border-radius:14px;background:var(--acc);color:#06121a;font-size:18px;font-weight:800;letter-spacing:.02em;cursor:pointer}');
  L.push('.btn.ghost{background:rgba(255,255,255,.08);color:#fff}');
  L.push('.upcard{display:block;width:100%;text-align:left;margin-top:10px;padding:16px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.045);color:#fff;cursor:pointer;min-height:76px}');
  L.push('.upcard b{font-size:16px;display:block;margin-bottom:4px}');
  L.push('.upcard span{font-size:13px;opacity:.65;line-height:1.4;display:block}');
  L.push('.upcard:active{border-color:var(--acc);background:rgba(255,255,255,.09)}');
  L.push('.stats{display:flex;justify-content:center;gap:18px;margin:14px 0 4px}');
  L.push('.stats div{text-align:center}.stats b{font-size:22px;display:block}.stats span{font-size:11px;opacity:.6;letter-spacing:.08em}');
  L.push('.big{font-size:52px;margin-bottom:6px}');
  L.push('</style></head><body>');
  L.push('<canvas id="game"></canvas>');
  L.push('<div id="hud"><div id="hearts"></div><div id="roomlbl"></div><div id="coinlbl"></div><div id="foelbl"></div></div>');
  L.push('<button id="pauseBtn" aria-label="Pause">&#10074;&#10074;</button>');
  L.push('<div id="overlay"></div>');
  L.push('<script>window.MOOR_CONFIG=' + cfgJson + ';<\/script>');
  L.push('<script>');
  L.push(GAME_JS);
  L.push('<\/script></body></html>');
  return L.join('\n');
}

/* ------------------------------------------------------------------ */
/* The game. No template literals / ${} in here: it lives inside the   */
/* HTML string built above. Strict ES5-ish + safe modern bits.          */
/* ------------------------------------------------------------------ */
var GAME_JS = [
"(function(){",
"'use strict';",
"var CFG=window.MOOR_CONFIG||{};",
"var HEROES={archer:{label:'Archer',dmg:10,cd:0.55,ps:540,pr:5,ms:250,color:'#ffd166'},mage:{label:'Mage',dmg:17,cd:0.85,ps:440,pr:8,ms:235,color:'#c77dff'},gunner:{label:'Gunner',dmg:7,cd:0.30,ps:660,pr:4,ms:265,color:'#7df9ff'}};",
"var THEMES={dungeon:{label:'Dungeon',bg:'#0b0d16',floor:'#121627',wall:'#2a2f4a',acc:'#8b7bff',grid:'rgba(139,123,255,0.07)'},forest:{label:'Forest',bg:'#08120d',floor:'#0d1c13',wall:'#1e3a28',acc:'#4ade80',grid:'rgba(74,222,128,0.07)'},neon:{label:'Neon',bg:'#040409',floor:'#0a0a16',wall:'#1c1c38',acc:'#22d3ee',grid:'rgba(34,211,238,0.09)'}};",
"var DIFFS={chill:{label:'Chill',hp:0.7,sp:0.85,dmg:0.7,count:0.7},classic:{label:'Classic',hp:1,sp:1,dmg:1,count:1},brutal:{label:'Brutal',hp:1.45,sp:1.15,dmg:1.3,count:1.45}};",
"function pk(v,t,fb){return(v&&t[v])?v:fb;}",
"var heroId=pk(CFG.hero,HEROES,'archer'),themeId=pk(CFG.theme,THEMES,'dungeon'),diffId=pk(CFG.difficulty,DIFFS,'classic');",
"var HERO=HEROES[heroId],TH=THEMES[themeId],DF=DIFFS[diffId];",
"var cv=document.getElementById('game'),ctx=cv.getContext('2d',{alpha:false});",
"var overlay=document.getElementById('overlay'),hud=document.getElementById('hud');",
"var heartsEl=document.getElementById('hearts'),roomEl=document.getElementById('roomlbl'),coinEl=document.getElementById('coinlbl'),foeEl=document.getElementById('foelbl');",
"var pauseBtn=document.getElementById('pauseBtn');",
"var W=0,Hh=0,DPR=1,arena={x:10,y:76,w:300,h:300};",
"function resize(){DPR=Math.min(2,window.devicePixelRatio||1);W=window.innerWidth;Hh=window.innerHeight;cv.width=Math.round(W*DPR);cv.height=Math.round(Hh*DPR);cv.style.width=W+'px';cv.style.height=Hh+'px';ctx.setTransform(DPR,0,0,DPR,0,0);arena={x:10,y:76,w:W-20,h:Hh-86};if(G&&G.p){G.p.x=clamp(G.p.x,arena.x+20,arena.x+arena.w-20);G.p.y=clamp(G.p.y,arena.y+20,arena.y+arena.h-20);}}",
"function clamp(v,a,b){return v<a?a:(v>b?b:v);}",
"function dist(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy);}",
"function rnd(a,b){return a+Math.random()*(b-a);}",
"function ang(a,b){return Math.atan2(b.y-a.y,b.x-a.x);}",
"",
"/* ---------- upgrades ---------- */",
"var UPS=[",
" {id:'multishot',n:'Split Shot',d:'+1 arrow per volley',f:function(p){p.arrows++;}},",
" {id:'ricochet',n:'Ricochet',d:'Arrows bounce to +1 nearby enemy',f:function(p){p.rico++;}},",
" {id:'blaze',n:'Blaze Arrows',d:'+40% damage, shots burn foes',f:function(p){p.dmg*=1.4;p.blaze=true;}},",
" {id:'swift',n:'Swift String',d:'Fire 18% faster',f:function(p){p.cdMax=Math.max(0.14,p.cdMax*0.82);}},",
" {id:'vitality',n:'Vitality',d:'+2 max HP and heal 2 now',f:function(p){p.maxHp+=2;p.hp=Math.min(p.maxHp,p.hp+2);}},",
" {id:'haste',n:'Fleet Foot',d:'+12% move speed',f:function(p){p.ms*=1.12;}},",
" {id:'pierce',n:'Piercing',d:'Arrows pierce +1 enemy',f:function(p){p.pierce++;}},",
" {id:'magnet',n:'Greed',d:'+70% coin pickup range',f:function(p){p.magnet*=1.7;}},",
" {id:'crit',n:'Deadeye',d:'+15% crit chance (2x damage)',f:function(p){p.crit+=0.15;}},",
" {id:'regen',n:'Second Wind',d:'Regenerate 1 HP every 20s',f:function(p){p.regen=true;}}",
"];",
"",
"/* ---------- enemies ---------- */",
"var FOES={",
" chaser:{hp:22,sp:95,r:13,dmg:1,coins:2,color:'#ff5d5d'},",
" shooter:{hp:16,sp:75,r:12,dmg:1,coins:3,color:'#b388ff'},",
" splitter:{hp:34,sp:62,r:18,dmg:1,coins:4,color:'#69f0ae'},",
" mini:{hp:9,sp:130,r:8,dmg:1,coins:1,color:'#69f0ae'},",
" brute:{hp:70,sp:52,r:22,dmg:2,coins:6,color:'#ffab40'},",
" boss:{hp:100,sp:66,r:34,dmg:2,coins:40,color:'#ff1744'}",
"};",
"",
"/* ---------- state ---------- */",
"var G=null;",
"var input={on:false,id:-1,ox:0,oy:0,dx:0,dy:0,mag:0};",
"function newPlayer(){return{x:arena.x+arena.w/2,y:arena.y+arena.h/2,r:14,hp:5,maxHp:5,ms:HERO.ms,cd:0,cdMax:HERO.cd,dmg:HERO.dmg,ps:HERO.ps,pr:HERO.pr,arrows:1,rico:0,pierce:0,crit:0.05,magnet:90,regen:false,regenT:0,inv:0,aim:-Math.PI/2,moving:false,blaze:false,color:HERO.color};}",
"function newRun(){G={state:'play',time:0,room:1,kills:0,coins:0,queue:[],spawnT:0,enemies:[],shots:[],eb:[],coinsA:[],parts:[],floats:[],p:newPlayer(),shake:0,draft:[]};startRoom();}",
"function roomCount(n){return Math.round((5+n*2.2)*DF.count);}",
"function buildQueue(n){",
" var q=[],i,c=Math.round(roomCount(n));",
" if(n===5||n===10){q.push('boss');c=Math.round(6*DF.count);}",
" for(i=0;i<c;i++){var r=Math.random(),t='chaser';",
"  if(n>=4&&r>0.82)t='brute';else if(n>=3&&r>0.66)t='splitter';else if(n>=2&&r>0.42)t='shooter';",
"  q.push(t);}",
" return q;}",
"function startRoom(){G.state='play';G.queue=buildQueue(G.room);G.spawnT=0.5;hideOverlay();syncHUD();}",
"function spawnPos(){var x=0,y=0,ok=false;for(var i=0;i<10&&!ok;i++){var s=Math.floor(rnd(0,4));if(s===0){x=arena.x+rnd(20,60);y=arena.y+rnd(20,arena.h-20);}else if(s===1){x=arena.x+arena.w-rnd(20,60);y=arena.y+rnd(20,arena.h-20);}else if(s===2){y=arena.y+rnd(20,60);x=arena.x+rnd(20,arena.w-20);}else{y=arena.y+arena.h-rnd(20,60);x=arena.x+rnd(20,arena.w-20);}var dx=x-G.p.x,dy=y-G.p.y;ok=(dx*dx+dy*dy)>220*220;}return{x:x,y:y};}",
"function spawnFoe(type){var b=FOES[type];if(!b)return;var s=spawnPos();var hp=b.hp*DF.hp;if(type==='boss')hp=Math.round((380+(G.room===10?260:0))*DF.hp);G.enemies.push({t:type,x:s.x,y:s.y,r:b.r,hp:hp,maxHp:hp,sp:b.sp*DF.sp*rnd(0.92,1.08),dmg:Math.max(1,Math.round(b.dmg*DF.dmg)),coins:b.coins,color:b.color,fireT:rnd(1,2.4),touchT:0,flash:0,burnT:0,burstT:2.5,addT:5,wob:rnd(0,6.28)});}",
"",
"/* ---------- combat ---------- */",
"function nearestFoe(x,y,maxD){var best=null,bd=(maxD||1e9);bd=bd*bd;for(var i=0;i<G.enemies.length;i++){var e=G.enemies[i];var dx=e.x-x,dy=e.y-y;var d=dx*dx+dy*dy;if(d<bd){bd=d;best=e;}}return best;}",
"function fireVolley(){var p=G.p;var tgt=nearestFoe(p.x,p.y,900);if(!tgt)return;var base=ang(p,tgt);p.aim=base;var n=p.arrows;for(var i=0;i<n;i++){var off=(i-(n-1)/2)*0.13;var a=base+off+rnd(-0.015,0.015);G.shots.push({x:p.x+Math.cos(a)*18,y:p.y+Math.sin(a)*18,vx:Math.cos(a)*p.ps,vy:Math.sin(a)*p.ps,dmg:p.dmg,r:p.pr,color:p.color,pierce:p.pierce,rico:p.rico,life:1.4});}p.cd=p.cdMax;burst(p.x,p.y,p.color,4,120);}",
"function hurtFoe(e,dmg,crit){e.hp-=dmg;e.flash=0.09;addFloat(e.x,e.y-14,Math.round(dmg)+'',crit?'#ffd166':'#ffffff');burst(e.x,e.y,e.color,crit?8:4,crit?200:120);}",
"function killFoe(idx){var e=G.enemies[idx];G.enemies.splice(idx,1);G.kills++;burst(e.x,e.y,e.color,14,240);var v=e.coins,n=Math.min(3,Math.max(1,Math.round(v/2)));for(var i=0;i<n;i++){G.coinsA.push({x:e.x+rnd(-8,8),y:e.y+rnd(-8,8),vx:rnd(-90,90),vy:rnd(-90,90),v:Math.ceil(v/n),life:14});}if(e.t==='splitter'){for(var k=0;k<2;k++){if(G.enemies.length<40){var s={t:'mini',x:e.x+rnd(-14,14),y:e.y+rnd(-14,14),r:FOES.mini.r,hp:FOES.mini.hp*DF.hp,maxHp:FOES.mini.hp*DF.hp,sp:FOES.mini.sp*DF.sp,dmg:Math.max(1,Math.round(FOES.mini.dmg*DF.dmg)),coins:1,color:FOES.mini.color,fireT:0,touchT:0,flash:0,burnT:0,burstT:0,addT:0,wob:rnd(0,6.28)};G.enemies.push(s);}}}syncHUD();}",
"function damagePlayer(n){var p=G.p;if(G.state!=='play'||p.inv>0)return;p.hp-=n;p.inv=0.9;G.shake=0.28;burst(p.x,p.y,'#ff5d5d',12,220);if(p.hp<=0){p.hp=0;gameOver();}}",
"",
"/* ---------- fx ---------- */",
"function burst(x,y,color,n,sp){for(var i=0;i<n;i++){if(G.parts.length>160)return;var a=rnd(0,6.28),s=rnd(sp*0.3,sp);G.parts.push({x:x,y:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rnd(0.25,0.55),max:0.55,color:color,sz:rnd(2,5)});}}",
"function addFloat(x,y,txt,color){if(G.floats.length>24)G.floats.shift();G.floats.push({x:x,y:y,txt:txt,life:0.8,color:color});}",
"",
"/* ---------- update ---------- */",
"function update(dt){G.time+=dt;if(G.state!=='play')return;var p=G.p;",
" if(p.inv>0)p.inv-=dt;if(G.shake>0)G.shake-=dt;",
" /* regen */ if(p.regen&&p.hp<p.maxHp){p.regenT+=dt;if(p.regenT>=20){p.regenT=0;p.hp++;syncHUD();}}",
" /* movement */ var mvx=0,mvy=0;p.moving=false;",
" if(input.on&&input.mag>12){var cl=Math.min(1,(input.mag-12)/48);mvx=input.dx/input.mag*cl;mvy=input.dy/input.mag*cl;p.moving=true;p.aim=Math.atan2(mvy,mvx);}",
" if(p.moving){p.x=clamp(p.x+mvx*p.ms*dt,arena.x+p.r,arena.x+arena.w-p.r);p.y=clamp(p.y+mvy*p.ms*dt,arena.y+p.r,arena.y+arena.h-p.r);}",
" /* fire */ p.cd-=dt;if(!p.moving&&p.cd<=0&&G.enemies.length>0)fireVolley();",
" /* spawn */ if(G.queue.length>0){G.spawnT-=dt;if(G.spawnT<=0){G.spawnT=1.4;var n=Math.min(3,G.queue.length);for(var si=0;si<n;si++){if(G.enemies.length>=40)break;spawnFoe(G.queue.shift());}syncHUD();}}",
" updateFoes(dt);updateShots(dt);updateEB(dt);updateCoins(dt);updateFx(dt);",
" /* room clear */ if(G.queue.length===0&&G.enemies.length===0){if(G.room>=10){victory();}else{openDraft();}}",
"}",
"function updateFoes(dt){var p=G.p;for(var i=G.enemies.length-1;i>=0;i--){var e=G.enemies[i];e.wob+=dt*6;if(e.flash>0)e.flash-=dt;if(e.touchT>0)e.touchT-=dt;",
" if(e.burnT>0){e.burnT-=dt;e.hp-=7*dt;burst(e.x,e.y,'#ff9f1c',1,60);if(e.hp<=0){killFoe(i);continue;}}",
" var a=ang(e,p),d=dist(e,p);",
" if(e.t==='shooter'){var want=280;var mv=0;if(d>want+40)mv=1;else if(d<want-40)mv=-1;e.x+=Math.cos(a)*e.sp*mv*dt;e.y+=Math.sin(a)*e.sp*mv*dt;if(mv===0){e.x+=Math.cos(a+1.57)*e.sp*0.4*dt*Math.sin(e.wob);}e.fireT-=dt;if(e.fireT<=0&&d<560){e.fireT=rnd(1.8,2.8);var ba=ang(e,p);G.eb.push({x:e.x,y:e.y,vx:Math.cos(ba)*235,vy:Math.sin(ba)*235,r:6,dmg:e.dmg,life:3.2,color:'#e1a6ff'});}",
" }else{ e.x+=Math.cos(a)*e.sp*dt;e.y+=Math.sin(a)*e.sp*dt;",
"  if(e.t==='boss'){e.burstT-=dt;if(e.burstT<=0){e.burstT=3.1;for(var k=0;k<10;k++){var ra=k/10*6.283;G.eb.push({x:e.x,y:e.y,vx:Math.cos(ra)*190,vy:Math.sin(ra)*190,r:7,dmg:e.dmg,life:3.6,color:'#ff8fa3'});}}e.addT-=dt;if(e.addT<=0){e.addT=6;for(var m=0;m<2;m++){if(G.enemies.length<40&&G.queue.length<20)G.queue.push('chaser');}}}",
" }",
" e.x=clamp(e.x,arena.x+e.r,arena.x+arena.w-e.r);e.y=clamp(e.y,arena.y+e.r,arena.y+arena.h-e.r);",
" if(d<e.r+p.r&&e.touchT<=0){damagePlayer(e.dmg);e.touchT=0.9;e.x-=Math.cos(a)*14;e.y-=Math.sin(a)*14;}",
"}}",
"function updateShots(dt){for(var i=G.shots.length-1;i>=0;i--){var s=G.shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;var dead=s.life<=0||s.x<arena.x||s.x>arena.x+arena.w||s.y<arena.y||s.y>arena.y+arena.h;if(!dead){for(var j=G.enemies.length-1;j>=0;j--){var e=G.enemies[j];var dx=e.x-s.x,dy=e.y-s.y;if(dx*dx+dy*dy<(e.r+s.r)*(e.r+s.r)){var crit=Math.random()<G.p.crit;var dmg=s.dmg*(crit?2:1)*rnd(0.9,1.1);hurtFoe(e,dmg,crit);if(G.p.blaze&&e.hp>0)e.burnT=3;var killed=e.hp<=0;if(killed)killFoe(j);if(s.pierce>0){s.pierce--;}else if(s.rico>0){var nx=nearestFoe(s.x,s.y,280);if(nx&&nx!==e){var na=ang(s,nx);var sp2=Math.sqrt(s.vx*s.vx+s.vy*s.vy);s.vx=Math.cos(na)*sp2;s.vy=Math.sin(na)*sp2;s.rico--;s.x=nx.x-Math.cos(na)*(nx.r+s.r+2);s.y=nx.y-Math.sin(na)*(nx.r+s.r+2);}else{dead=true;}}else{dead=true;}break;}}}if(dead)G.shots.splice(i,1);}}",
"function updateEB(dt){var p=G.p;for(var i=G.eb.length-1;i>=0;i--){var b=G.eb[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;var dx=b.x-p.x,dy=b.y-p.y;if(dx*dx+dy*dy<(b.r+p.r)*(b.r+p.r)){damagePlayer(b.dmg);G.eb.splice(i,1);continue;}if(b.life<=0)G.eb.splice(i,1);}}",
"function updateCoins(dt){var p=G.p;for(var i=G.coinsA.length-1;i>=0;i--){var c=G.coinsA[i];c.life-=dt;var dx=p.x-c.x,dy=p.y-c.y;var d=Math.sqrt(dx*dx+dy*dy)||1;if(d<p.magnet){c.vx+=dx/d*900*dt;c.vy+=dy/d*900*dt;}else{c.vx*=0.94;c.vy*=0.94;}c.x+=c.vx*dt;c.y+=c.vy*dt;if(d<24){G.coins+=c.v;G.coinsA.splice(i,1);syncHUD();continue;}if(c.life<=0)G.coinsA.splice(i,1);}}",
"function updateFx(dt){for(var i=G.parts.length-1;i>=0;i--){var q=G.parts[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=0.96;q.vy*=0.96;if(q.life<=0)G.parts.splice(i,1);}for(var j=G.floats.length-1;j>=0;j--){var f=G.floats[j];f.life-=dt;f.y-=34*dt;if(f.life<=0)G.floats.splice(j,1);}}",
"",
"/* ---------- render ---------- */",
"function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}",
"function render(){ctx.fillStyle=TH.bg;ctx.fillRect(0,0,W,Hh);ctx.save();if(G&&G.shake>0){ctx.translate(rnd(-1,1)*G.shake*22,rnd(-1,1)*G.shake*22);}",
" ctx.fillStyle=TH.floor;rr(arena.x,arena.y,arena.w,arena.h,18);ctx.fill();",
" ctx.strokeStyle=TH.grid;ctx.lineWidth=1;var gs=44;var gx0=arena.x+((gs-arena.x%gs)%gs);for(var gx=gx0;gx<arena.x+arena.w;gx+=gs){ctx.beginPath();ctx.moveTo(gx,arena.y);ctx.lineTo(gx,arena.y+arena.h);ctx.stroke();}var gy0=arena.y+((gs-arena.y%gs)%gs);for(var gy=gy0;gy<arena.y+arena.h;gy+=gs){ctx.beginPath();ctx.moveTo(arena.x,gy);ctx.lineTo(arena.x+arena.w,gy);ctx.stroke();}",
" ctx.strokeStyle=TH.wall;ctx.lineWidth=3;rr(arena.x,arena.y,arena.w,arena.h,18);ctx.stroke();",
" if(!G){ctx.restore();return;}",
" var i,e;",
" for(i=0;i<G.coinsA.length;i++){var c=G.coinsA[i];var bl=0.6+0.4*Math.sin(G.time*8+i);ctx.fillStyle='#ffd166';ctx.globalAlpha=bl;ctx.beginPath();ctx.arc(c.x,c.y,6,0,6.283);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#fff3c4';ctx.beginPath();ctx.arc(c.x-2,c.y-2,2.2,0,6.283);ctx.fill();}",
" for(i=0;i<G.enemies.length;i++){e=G.enemies[i];drawFoe(e);}",
" ctx.fillStyle='#fff';for(i=0;i<G.shots.length;i++){var s=G.shots[i];ctx.fillStyle=s.color;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill();ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(s.x-s.r*0.3,s.y-s.r*0.3,s.r*0.4,0,6.283);ctx.fill();}",
" for(i=0;i<G.eb.length;i++){var b=G.eb[i];ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fill();}",
" drawPlayer();",
" for(i=0;i<G.parts.length;i++){var q=G.parts[i];ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.fillStyle=q.color;ctx.fillRect(q.x-q.sz/2,q.y-q.sz/2,q.sz,q.sz);}ctx.globalAlpha=1;",
" ctx.textAlign='center';ctx.font='bold 14px system-ui,sans-serif';for(i=0;i<G.floats.length;i++){var f=G.floats[i];ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle=f.color;ctx.fillText(f.txt,f.x,f.y);}ctx.globalAlpha=1;",
" if(input.on){ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(input.ox,input.oy,52,0,6.283);ctx.stroke();var kx=input.ox+input.dx,ky=input.oy+input.dy;ctx.fillStyle=TH.acc;ctx.beginPath();ctx.arc(kx,ky,24,0,6.283);ctx.fill();}",
" ctx.restore();}",
"function drawFoe(e){var wob=Math.sin(e.wob)*0.06;ctx.save();ctx.translate(e.x,e.y);ctx.rotate(wob);",
" if(e.flash>0){ctx.fillStyle='#ffffff';}else{ctx.fillStyle=e.color;}",
" if(e.t==='chaser'||e.t==='mini'){poly(e.r,5);}",
" else if(e.t==='shooter'){ctx.rotate(Math.PI/4);poly(e.r,4);}",
" else if(e.t==='splitter'){ctx.beginPath();ctx.arc(-e.r*0.35,0,e.r*0.62,0,6.283);ctx.arc(e.r*0.35,0,e.r*0.62,0,6.283);ctx.fill();}",
" else if(e.t==='brute'){poly(e.r,6);}",
" else if(e.t==='boss'){poly(e.r,5);ctx.strokeStyle='#ffd166';ctx.lineWidth=3;ctx.stroke();}",
" if(e.t!=='splitter')ctx.fill();",
" ctx.fillStyle='#0a0a12';ctx.beginPath();ctx.arc(0,0,e.r*0.42,0,6.283);ctx.fill();",
" ctx.restore();",
" if(e.hp<e.maxHp){var bw=Math.max(26,e.r*2);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(e.x-bw/2,e.y-e.r-12,bw,5);ctx.fillStyle=e.hp/e.maxHp>0.4?TH.acc:'#ff5d5d';ctx.fillRect(e.x-bw/2,e.y-e.r-12,bw*Math.max(0,e.hp/e.maxHp),5);}}",
"function poly(r,n){ctx.beginPath();for(var i=0;i<n;i++){var a=i/n*6.283-Math.PI/2;var px=Math.cos(a)*r,py=Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}ctx.closePath();}",
"function drawPlayer(){var p=G.p;ctx.save();ctx.translate(p.x,p.y);if(p.inv>0&&Math.floor(G.time*14)%2===0)ctx.globalAlpha=0.45;",
" ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,p.r*0.95,p.r*0.9,p.r*0.35,0,0,6.283);ctx.fill();",
" ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(0,0,p.r,0,6.283);ctx.fill();",
" ctx.fillStyle='#0d0f1a';ctx.beginPath();ctx.arc(0,0,p.r*0.55,0,6.283);ctx.fill();",
" ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,p.r+5,p.aim-0.7,p.aim+0.7);ctx.stroke();",
" ctx.restore();}",
"",
"/* ---------- HUD + overlays ---------- */",
"function syncHUD(){if(!G)return;var h='';for(var i=0;i<G.p.maxHp;i++)h+='<span class=\"pip'+(i<G.p.hp?'':' off')+'\"></span>';heartsEl.innerHTML=h;roomEl.textContent='ROOM '+G.room+'/10';coinEl.textContent='\\uD83E\\uDE99 '+G.coins;foeEl.textContent=(G.queue.length+G.enemies.length)+' left';}",
"function show(html){overlay.innerHTML=html;overlay.style.display='flex';}",
"function hideOverlay(){overlay.style.display='none';overlay.innerHTML='';}",
"function cfgLine(){return '<div class=\"cfgline\">'+HERO.label+' \\u00B7 '+TH.label+' \\u00B7 '+DF.label+'</div>';}",
"function showTitle(){show('<div class=\"card\"><div class=\"big\">\\uD83C\\uDFF9</div><h1>Arena Roguelike</h1>'+cfgLine()+'<p class=\"sub\">Drag anywhere to move. Stand still to auto-fire. Clear 10 rooms, draft upgrades, slay the bosses.</p><button class=\"btn\" data-act=\"start\">Start Run</button></div>');}",
"function openDraft(){G.state='draft';var pool=UPS.slice(),picks=[];for(var i=0;i<3&&pool.length;i++){picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);}G.draft=picks;var h='<div class=\"card\"><h2>Room '+G.room+' cleared</h2><p class=\"sub\">Choose an upgrade</p>';for(var k=0;k<picks.length;k++){h+='<button class=\"upcard\" data-act=\"pick\" data-i=\"'+k+'\"><b>'+picks[k].n+'</b><span>'+picks[k].d+'</span></button>';}show(h+'</div>');}",
"function showPause(){show('<div class=\"card\"><h2>Paused</h2>'+cfgLine()+'<button class=\"btn\" data-act=\"resume\">Resume</button><button class=\"btn ghost\" data-act=\"restart\">Restart Run</button></div>');}",
"function statHTML(){var m=Math.floor(G.time/60),s=Math.floor(G.time%60);return '<div class=\"stats\"><div><b>'+G.room+'</b><span>ROOM</span></div><div><b>'+G.kills+'</b><span>KILLS</span></div><div><b>'+G.coins+'</b><span>COINS</span></div><div><b>'+m+':'+(s<10?'0':'')+s+'</b><span>TIME</span></div></div>';}",
"function gameOver(){G.state='over';show('<div class=\"card\"><div class=\"big\">\\uD83D\\uDC80</div><h2>Run Over</h2><p class=\"sub\">The arena claims another hero.</p>'+statHTML()+'<button class=\"btn\" data-act=\"restart\">Try Again</button></div>');}",
"function victory(){G.state='win';show('<div class=\"card\"><div class=\"big\">\\uD83C\\uDFC6</div><h2>Arena Conquered</h2><p class=\"sub\">10 rooms cleared. Legendary.</p>'+statHTML()+'<button class=\"btn\" data-act=\"restart\">Play Again</button></div>');}",
"function doAct(a,el){if(a==='start'||a==='restart'){newRun();}else if(a==='resume'){if(G&&(G.state==='pause')){G.state='play';hideOverlay();}}else if(a==='pick'){var u=G.draft[parseInt(el.getAttribute('data-i'),10)];if(u){u.f(G.p);G.room++;syncHUD();startRoom();}}}",
"",
"/* ---------- input ---------- */",
"cv.addEventListener('pointerdown',function(e){e.preventDefault();if(G&&G.state==='play'){input.on=true;input.id=e.pointerId;input.ox=e.clientX;input.oy=e.clientY;input.dx=0;input.dy=0;input.mag=0;}},{passive:false});",
"window.addEventListener('pointermove',function(e){if(input.on&&e.pointerId===input.id){input.dx=e.clientX-input.ox;input.dy=e.clientY-input.oy;input.mag=Math.sqrt(input.dx*input.dx+input.dy*input.dy);var m=Math.min(input.mag,60);if(input.mag>0){input.dx=input.dx/input.mag*m;input.dy=input.dy/input.mag*m;input.mag=m;}}},{passive:true});",
"function endTouch(e){if(e.pointerId===input.id){input.on=false;input.mag=0;}}",
"window.addEventListener('pointerup',endTouch);window.addEventListener('pointercancel',endTouch);",
"cv.addEventListener('contextmenu',function(e){e.preventDefault();});",
"overlay.addEventListener('click',function(e){var t=e.target;while(t&&t!==overlay&&!t.getAttribute('data-act'))t=t.parentNode;if(t&&t.getAttribute('data-act'))doAct(t.getAttribute('data-act'),t);});",
"overlay.addEventListener('pointerdown',function(e){e.stopPropagation();},{passive:true});",
"pauseBtn.addEventListener('click',function(){if(!G)return;if(G.state==='play'){G.state='pause';showPause();}else if(G.state==='pause'){G.state='play';hideOverlay();}});",
"document.addEventListener('visibilitychange',function(){if(document.hidden&&G&&G.state==='play'){G.state='pause';showPause();}});",
"window.addEventListener('resize',resize);",
"window.addEventListener('orientationchange',function(){setTimeout(resize,120);});",
"",
"/* ---------- boot ---------- */",
"window.MOOR_DEBUG={snap:function(){return G?{state:G.state,room:G.room,kills:G.kills,coins:G.coins,foes:G.enemies.length,queue:G.queue.length,shots:G.shots.length,hp:G.p.hp,maxHp:G.p.maxHp,arrows:G.p.arrows}:null;},clearRoom:function(){if(G&&G.state==='play'){G.queue.length=0;var g=600;while(G.enemies.length&&g-->0)killFoe(0);}},hurt:function(n){damagePlayer(n);}};",
"resize();showTitle();",
"var last=0;",
"function loop(t){requestAnimationFrame(loop);var dt=(t-last)/1000;last=t;if(!(dt>0)||dt>0.25)dt=0.016;if(G&&G.state==='play')update(dt);else if(G)G.time+=0;render();}",
"requestAnimationFrame(loop);",
"})();"
].join('\n');

window.MoorKit = { build: build };
})();
