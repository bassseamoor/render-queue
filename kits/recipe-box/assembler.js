/* Moor kit assembler: recipe-box v1.0.0
 * Exposes window.MoorKit.build(config) -> complete <!DOCTYPE html> document.
 * Inner app uses string concatenation only (no backticks / ${}); every
 * backslash in the inner code is doubled in the outer template literal. */
(function () {
  'use strict';

  var VIBES = ['paper', 'dark', 'green'];
  var LAYOUTS = ['grid', 'list'];
  var EXTRAS = ['cookmode', 'timers'];

  function sanitize(cfg) {
    cfg = (cfg && typeof cfg === 'object') ? cfg : {};
    var vibe = VIBES.indexOf(cfg.vibe) >= 0 ? cfg.vibe : 'paper';
    var layout = LAYOUTS.indexOf(cfg.layout) >= 0 ? cfg.layout : 'grid';
    var ex = Array.isArray(cfg.extras) ? cfg.extras.filter(function (x) { return EXTRAS.indexOf(x) >= 0; }) : ['cookmode', 'timers'];
    return { vibe: vibe, layout: layout, extras: ex };
  }

  var THEME_COLOR = { paper: '#f7f1e3', dark: '#0e0f12', green: '#f0f7ef' };

  function build(config) {
    var c = sanitize(config);

    var CSS = [
      '*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}',
      'html,body{height:100%}',
      'body{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;}',
      'body[data-vibe="paper"]{--bg:#f7f1e3;--card:#fffdf6;--ink:#3e2f23;--mut:#8a7a68;--acc:#c96f2e;--accink:#fff;--line:#e8dcc4;--pill:#f1e4c8}',
      'body[data-vibe="dark"]{--bg:#0e0f12;--card:#17191f;--ink:#f2f2f2;--mut:#9aa0ad;--acc:#e8a33d;--accink:#171205;--line:#262932;--pill:#23262f}',
      'body[data-vibe="green"]{--bg:#f0f7ef;--card:#ffffff;--ink:#1c3a24;--mut:#6f8a75;--acc:#2f9e5f;--accink:#fff;--line:#d9e8d8;--pill:#e2f0e4}',
      'body{background:var(--bg);color:var(--ink);min-height:100%;padding:calc(env(safe-area-inset-top,0px) + 14px) 14px calc(env(safe-area-inset-bottom,0px) + 90px);}',
      '#app{max-width:560px;margin:0 auto}',
      '.top{display:flex;align-items:center;justify-content:space-between;margin:6px 2px 12px}',
      '.top h1{font-size:26px;letter-spacing:-.5px}',
      '.sub{color:var(--mut);font-size:13px;margin-top:2px}',
      '.fab{width:52px;height:52px;border-radius:26px;border:none;background:var(--acc);color:var(--accink);font-size:30px;line-height:1;box-shadow:0 6px 16px rgba(0,0,0,.18);min-width:52px;min-height:52px}',
      '.searchwrap{margin-bottom:12px}',
      '.search{width:100%;padding:14px 16px;border-radius:14px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:16px;min-height:48px}',
      '.cards.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
      '.cards.list{display:flex;flex-direction:column;gap:10px}',
      '.rcard{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;min-height:64px}',
      '.cards.grid .ric{font-size:34px;margin-bottom:8px}',
      '.cards.list .rcard{display:flex;align-items:center;gap:12px;padding:12px 14px}',
      '.cards.list .ric{font-size:30px;flex:none}',
      '.rtitle{font-size:16px;font-weight:700;line-height:1.25}',
      '.rmeta{color:var(--mut);font-size:13px;margin-top:5px}',
      '.dpill{display:inline-block;background:var(--pill);border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600;margin-right:4px}',
      '.tags{margin-top:7px;font-size:12px;color:var(--mut)}',
      '.back{background:none;border:none;color:var(--acc);font-size:17px;font-weight:600;padding:12px 8px;min-height:48px}',
      '.dtitle{font-size:24px;letter-spacing:-.4px;margin:2px 2px 6px}',
      '.dmeta{color:var(--mut);font-size:14px;margin:0 2px 8px}',
      'h3.sec{font-size:15px;text-transform:uppercase;letter-spacing:1px;color:var(--mut);margin:18px 2px 8px}',
      '.ing{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:13px 14px;margin-bottom:8px;display:flex;gap:12px;align-items:center;font-size:16px;min-height:52px}',
      '.ing .box{width:26px;height:26px;border-radius:8px;border:2px solid var(--acc);flex:none;display:flex;align-items:center;justify-content:center;color:transparent;font-size:16px;font-weight:800}',
      '.ing.done .box{background:var(--acc);color:var(--accink)}',
      '.ing.done .it{text-decoration:line-through;color:var(--mut)}',
      '.step{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:13px 14px;margin-bottom:8px;display:flex;gap:12px;font-size:16px;line-height:1.45;min-height:52px}',
      '.snum{width:28px;height:28px;border-radius:14px;background:var(--acc);color:var(--accink);font-weight:800;flex:none;display:flex;align-items:center;justify-content:center;font-size:14px}',
      '.tpill{margin-left:auto;flex:none;background:var(--pill);border-radius:12px;padding:4px 10px;font-size:13px;font-weight:700;align-self:flex-start}',
      '.btnrow{display:flex;gap:10px;margin-top:20px;flex-wrap:wrap}',
      '.btn{flex:1;min-height:52px;border-radius:14px;border:none;font-size:17px;font-weight:700;background:var(--acc);color:var(--accink);padding:14px}',
      '.btn.ghost{background:var(--pill);color:var(--ink)}',
      '.btn.danger{background:#c0392b;color:#fff}',
      '.btn.armed{background:#e74c3c;color:#fff}',
      '.cooktop{display:flex;align-items:center;justify-content:space-between;margin:4px 2px 10px}',
      '.cstep{color:var(--mut);font-size:14px;font-weight:600}',
      '.pbar{height:8px;border-radius:4px;background:var(--line);overflow:hidden;margin-bottom:26px}',
      '.pbar i{display:block;height:100%;background:var(--acc);border-radius:4px;transition:width .3s}',
      '.bigstep{font-size:27px;line-height:1.5;font-weight:600;letter-spacing:-.3px;margin-bottom:26px;min-height:120px}',
      '.tmbox{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;text-align:center;margin-bottom:22px}',
      '.tmread{font-size:44px;font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:1px}',
      '.tmrow{display:flex;gap:10px;margin-top:12px}',
      '.cooknav{display:flex;gap:10px}',
      '.empty{text-align:center;color:var(--mut);padding:44px 20px;font-size:16px;line-height:1.5}',
      '.fld{margin-bottom:14px}',
      '.fld label{display:block;font-size:13px;font-weight:700;color:var(--mut);margin:0 2px 6px;text-transform:uppercase;letter-spacing:.6px}',
      '.fld input,.fld textarea,.fld select{width:100%;padding:14px;border-radius:12px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:16px;min-height:52px;font-family:inherit}',
      '.fld textarea{min-height:110px;resize:vertical;line-height:1.5}',
      '.fhint{font-size:12px;color:var(--mut);margin:4px 2px 0}'
    ].join('\n');

    /* ---- inner app code: concatenation only, no backticks, no ${, backslashes doubled ---- */
    var APP = [
      '(function(){',
      '"use strict";',
      'var CFG=' + JSON.stringify(c) + ';',
      'var app=document.getElementById("app");',
      'function esc(s){s=String(s==null?"":s);return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}',
      'function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v);}catch(e){return null;}}',
      'var SEED=[',
      '{id:"seed1",title:"Creamy Garlic Pasta",time:25,diff:"Easy",tags:["dinner","italian","vegetarian"],',
      'ings:["400g spaghetti","6 garlic cloves, minced","240ml cream","60g parmesan, grated","2 tbsp olive oil","Salt and black pepper","Fresh parsley, chopped"],',
      'steps:[{t:"Boil the spaghetti in well-salted water until al dente. Reserve a cup of pasta water.",m:0},{t:"Sizzle garlic in olive oil until golden, about 2 minutes.",m:2},{t:"Pour in the cream and simmer gently.",m:5},{t:"Toss in pasta and parmesan, loosening with pasta water.",m:0},{t:"Season, top with parsley, serve immediately.",m:0}]},',
      '{id:"seed2",title:"Fluffy Pancakes",time:20,diff:"Easy",tags:["breakfast","sweet"],',
      'ings:["250g flour","2 tbsp sugar","2 tsp baking powder","300ml milk","2 eggs","40g melted butter","Maple syrup to serve"],',
      'steps:[{t:"Whisk flour, sugar and baking powder in a big bowl.",m:0},{t:"Beat milk, eggs and butter; pour into the dry mix and stir until just combined.",m:0},{t:"Rest the batter while the pan heats.",m:5},{t:"Cook ladles of batter 2 minutes per side until golden.",m:0},{t:"Stack high and drown in maple syrup.",m:0}]},',
      '{id:"seed3",title:"Sheet-Pan Chicken Fajitas",time:35,diff:"Medium",tags:["dinner","mexican"],',
      'ings:["600g chicken breast, sliced","3 bell peppers, sliced","1 red onion, wedged","3 tbsp fajita seasoning","2 tbsp oil","8 tortillas","1 lime, cut in wedges"],',
      'steps:[{t:"Heat the oven to 220C / 425F.",m:0},{t:"Toss chicken and veg with oil and seasoning on a sheet pan.",m:0},{t:"Roast until the chicken is cooked through and edges char.",m:18},{t:"Warm the tortillas in the last 2 minutes.",m:2},{t:"Serve with lime wedges and your favorite toppings.",m:0}]}',
      '];',
      'function load(){var raw=store("rbx1");if(raw){try{var r=JSON.parse(raw);if(Array.isArray(r))return r;}catch(e){}}',
      'return SEED.map(function(r){return {id:r.id,title:r.title,time:r.time,diff:r.diff,tags:r.tags.slice(),ings:r.ings.slice(),steps:r.steps.map(function(s){return {t:s.t,m:s.m};})};});}',
      'function save(){try{store("rbx1",JSON.stringify(S.recipes));}catch(e){}}',
      'var S={recipes:load(),screen:"list",sel:null,cook:0,q:"",checked:{},arm:0};',
      'var ICONS=[["pasta",String.fromCharCode(127837)],["italian",String.fromCharCode(127837)],["pancake",String.fromCharCode(129374)],["breakfast",String.fromCharCode(127828)],["fajita",String.fromCharCode(127789)],["mexican",String.fromCharCode(127789)],["taco",String.fromCharCode(127789)],["chicken",String.fromCharCode(127831)],["cake",String.fromCharCode(127856)],["sweet",String.fromCharCode(127856)],["salad",String.fromCharCode(129367)],["soup",String.fromCharCode(127858)],["pizza",String.fromCharCode(127829)],["fish",String.fromCharCode(127860)],["curry",String.fromCharCode(127836)],["rice",String.fromCharCode(127834)]];',
      'function iconFor(r){var hay=(r.title+" "+r.tags.join(" ")).toLowerCase();for(var i=0;i<ICONS.length;i++){if(hay.indexOf(ICONS[i][0])>=0)return ICONS[i][1];}return String.fromCharCode(127859);}',
      'function getR(){for(var i=0;i<S.recipes.length;i++)if(S.recipes[i].id===S.sel)return S.recipes[i];return null;}',
      'function mmss(sec){sec=Math.max(0,Math.ceil(sec));var m=Math.floor(sec/60),s=sec%60;return (m<10?"0"+m:""+m)+":"+(s<10?"0"+s:""+s);}',
      'var T={left:0,iv:null};',
      'function tStop(){if(T.iv){clearInterval(T.iv);T.iv=null;}}',
      'function tReset(mins){tStop();T.left=mins*60;var el=document.getElementById("tmread");if(el)el.textContent=mmss(T.left);var b=document.getElementById("tmb");if(b)b.textContent="Start";}',
      'function tToggle(){var mins=curStepMins();if(!mins)return;var b=document.getElementById("tmb");if(T.iv){tStop();if(b)b.textContent="Resume";}else{if(T.left<=0)T.left=mins*60;T.iv=setInterval(function(){T.left--;var el=document.getElementById("tmread");if(el)el.textContent=mmss(T.left);if(T.left<=0){tStop();var bb=document.getElementById("tmb");if(bb)bb.textContent="Start";try{navigator.vibrate&&navigator.vibrate(200);}catch(e){}}},1000);if(b)b.textContent="Pause";}}',
      'function curStepMins(){var r=getR();if(!r||!r.steps[S.cook])return 0;return r.steps[S.cook].m||0;}',
      'function filtered(){var q=S.q.trim().toLowerCase();if(!q)return S.recipes;return S.recipes.filter(function(r){if((r.title||"").toLowerCase().indexOf(q)>=0)return true;for(var i=0;i<r.tags.length;i++)if(r.tags[i].toLowerCase().indexOf(q)>=0)return true;for(var j=0;j<r.ings.length;j++)if(r.ings[j].toLowerCase().indexOf(q)>=0)return true;return false;});}',
      'function cardHTML(r){var ic=iconFor(r);var tags=r.tags.map(function(t){return "#"+esc(t);}).join(" ");',
      'var meta="&#9201; "+r.time+" min &nbsp;<span class=\\"dpill\\">"+esc(r.diff)+"</span>";',
      'if(CFG.layout==="list"){return "<div class=\\"rcard\\" data-act=\\"open\\" data-id=\\""+r.id+"\\"><div class=\\"ric\\">"+ic+"</div><div style=\\"flex:1\\"><div class=\\"rtitle\\">"+esc(r.title)+"</div><div class=\\"rmeta\\">"+meta+"</div></div><div style=\\"color:var(--mut);font-size:20px\\">&#8250;</div></div>";}',
      'return "<div class=\\"rcard\\" data-act=\\"open\\" data-id=\\""+r.id+"\\"><div class=\\"ric\\">"+ic+"</div><div class=\\"rtitle\\">"+esc(r.title)+"</div><div class=\\"rmeta\\">"+meta+"</div>"+(tags?"<div class=\\"tags\\">"+esc(tags)+"</div>":"")+"</div>";}',
      'function vList(){var rs=filtered();var h="<div class=\\"top\\"><div><h1>Recipe Box</h1><div class=\\"sub\\">"+rs.length+" recipe"+(rs.length===1?"":"s")+"</div></div><button class=\\"fab\\" data-act=\\"add\\" aria-label=\\"Add recipe\\">+</button></div>";',
      'h+="<div class=\\"searchwrap\\"><input id=\\"q\\" class=\\"search\\" type=\\"search\\" placeholder=\\"Search title, ingredient, tag\\u2026\\" value=\\""+esc(S.q)+"\\" autocomplete=\\"off\\"></div>";',
      'if(!rs.length){h+="<div class=\\"empty\\">No recipes found.<br>Tap + to add your first one.</div>";}else{h+="<div class=\\"cards "+CFG.layout+"\\">";for(var i=0;i<rs.length;i++)h+=cardHTML(rs[i]);h+="</div>";}',
      'return h;}',
      'function vDetail(){var r=getR();if(!r)return vList();var ck=S.checked[r.id]||{};',
      'var h="<button class=\\"back\\" data-act=\\"back\\">&#8249; Recipes</button><div class=\\"dtitle\\">"+esc(r.title)+"</div>";',
      'h+="<div class=\\"dmeta\\">&#9201; "+r.time+" min &nbsp;<span class=\\"dpill\\">"+esc(r.diff)+"</span></div>";',
      'if(r.tags.length)h+="<div class=\\"dmeta\\">"+r.tags.map(function(t){return "#"+esc(t);}).join(" ")+"</div>";',
      'h+="<h3 class=\\"sec\\">Ingredients</h3>";',
      'for(var i=0;i<r.ings.length;i++){h+="<div class=\\"ing"+(ck[i]?" done":"")+"\\" data-act=\\"ing\\" data-i=\\""+i+"\\"><span class=\\"box\\">&#10003;</span><span class=\\"it\\">"+esc(r.ings[i])+"</span></div>";}',
      'h+="<h3 class=\\"sec\\">Steps</h3>";',
      'for(var j=0;j<r.steps.length;j++){var st=r.steps[j];h+="<div class=\\"step\\"><span class=\\"snum\\">"+(j+1)+"</span><span>"+esc(st.t)+"</span>"+(st.m?("<span class=\\"tpill\\">&#9201;"+st.m+"m</span>"):"")+"</div>";}',
      'h+="<div class=\\"btnrow\\">";',
      'if(CFG.extras.indexOf("cookmode")>=0)h+="<button class=\\"btn\\" data-act=\\"cook\\">&#9654; Cook mode</button>";',
      'h+="<button class=\\"btn ghost\\" data-act=\\"edit\\">Edit</button>";',
      'var armed=(Date.now()-S.arm)<4000;h+="<button class=\\"btn "+(armed?"armed":"danger")+"\\" data-act=\\"del\\">"+(armed?"Tap again to delete":"Delete")+"</button>";',
      'h+="</div>";return h;}',
      'function vCook(){var r=getR();if(!r||!r.steps.length)return vList();var i=Math.min(S.cook,r.steps.length-1);var st=r.steps[i];',
      'var pct=Math.round(((i+1)/r.steps.length)*100);',
      'var h="<div class=\\"cooktop\\"><button class=\\"back\\" data-act=\\"back\\">&#10005; Exit</button><div class=\\"cstep\\">Step "+(i+1)+" of "+r.steps.length+"</div></div>";',
      'h+="<div class=\\"pbar\\"><i style=\\"width:"+pct+"%\\"></i></div>";',
      'h+="<p class=\\"bigstep\\">"+esc(st.t)+"</p>";',
      'if(CFG.extras.indexOf("timers")>=0&&st.m){h+="<div class=\\"tmbox\\"><div class=\\"tmread\\" id=\\"tmread\\">"+mmss(st.m*60)+"</div><div class=\\"tmrow\\"><button class=\\"btn\\" id=\\"tmb\\" data-act=\\"ttoggle\\">Start</button><button class=\\"btn ghost\\" data-act=\\"treset\\">Reset</button></div></div>";}',
      'h+="<div class=\\"cooknav\\"><button class=\\"btn ghost\\" data-act=\\"cprev\\""+(i===0?" disabled style=\\"opacity:.4\\"":"")+">&#8249; Prev</button><button class=\\"btn\\" data-act=\\"cnext\\">"+(i===r.steps.length-1?"Finish":"Next")+" &#8250;</button></div>";',
      'return h;}',
      'function vEdit(){var r=getR();var isNew=S.screen==="add";',
      'var h="<button class=\\"back\\" data-act=\\"back\\">&#8249; Cancel</button><div class=\\"dtitle\\">"+(isNew?"New recipe":"Edit recipe")+"</div>";',
      'h+="<div class=\\"fld\\"><label>Title</label><input id=\\"f-title\\" value=\\""+esc(isNew?"":r.title)+"\\" placeholder=\\"e.g. Lemon Herb Salmon\\"></div>";',
      'h+="<div class=\\"fld\\"><label>Time (minutes)</label><input id=\\"f-time\\" inputmode=\\"numeric\\" value=\\""+(isNew?"30":r.time)+"\\"></div>";',
      'h+="<div class=\\"fld\\"><label>Difficulty</label><select id=\\"f-diff\\">"+["Easy","Medium","Hard"].map(function(d){return "<option"+((!isNew&&r.diff===d)?" selected":"")+">"+d+"</option>";}).join("")+"</select></div>";',
      'h+="<div class=\\"fld\\"><label>Tags (comma separated)</label><input id=\\"f-tags\\" value=\\""+esc(isNew?"":r.tags.join(", "))+"\\" placeholder=\\"dinner, quick\\"></div>";',
      'h+="<div class=\\"fld\\"><label>Ingredients (one per line)</label><textarea id=\\"f-ings\\" placeholder=\\"2 eggs\\u000a200g flour\\">"+esc(isNew?"":r.ings.join("\\n"))+"</textarea></div>";',
      'h+="<div class=\\"fld\\"><label>Steps (one per line)</label><textarea id=\\"f-steps\\" placeholder=\\"Mix everything\\u000aBake until golden |20\\">"+esc(isNew?"":r.steps.map(function(s){return s.t+(s.m?" |"+s.m:"");}).join("\\n"))+"</textarea><div class=\\"fhint\\">Add |10 at the end of a step for a 10-minute timer.</div></div>";',
      'h+="<div class=\\"btnrow\\"><button class=\\"btn\\" data-act=\\"save\\">Save recipe</button></div>";',
      'return h;}',
      'function render(){tStop();var h="";if(S.screen==="list")h=vList();else if(S.screen==="detail")h=vDetail();else if(S.screen==="cook")h=vCook();else h=vEdit();app.innerHTML=h;',
      'var q=document.getElementById("q");if(q){q.addEventListener("input",function(){S.q=q.value;var pos=q.selectionStart;render();var nq=document.getElementById("q");if(nq){nq.focus();try{nq.setSelectionRange(pos,pos);}catch(e){}}});}}',
      'function parseSteps(txt){var out=[];var lines=String(txt).split("\\n");for(var i=0;i<lines.length;i++){var ln=lines[i].trim();if(!ln)continue;var m=0;var bar=ln.lastIndexOf("|");if(bar>0){var num=parseInt(ln.slice(bar+1).trim(),10);if(!isNaN(num)&&num>0&&num<=720){m=num;ln=ln.slice(0,bar).trim();}}if(ln)out.push({t:ln,m:m});}return out;}',
      'function doSave(){var ti=document.getElementById("f-title").value.trim();if(!ti){document.getElementById("f-title").focus();return;}',
      'var tm=parseInt(document.getElementById("f-time").value,10);if(isNaN(tm)||tm<1)tm=30;',
      'var tg=document.getElementById("f-tags").value.split(",").map(function(x){return x.trim().toLowerCase();}).filter(function(x){return x;});',
      'var ig=document.getElementById("f-ings").value.split("\\n").map(function(x){return x.trim();}).filter(function(x){return x;});',
      'var st=parseSteps(document.getElementById("f-steps").value);',
      'var df=document.getElementById("f-diff").value;',
      'if(S.screen==="add"){var r={id:"r"+Date.now().toString(36)+Math.floor(Math.random()*999),title:ti,time:tm,diff:df,tags:tg,ings:ig.length?ig:["(no ingredients listed)"],steps:st.length?st:[{t:"(no steps yet)",m:0}]};S.recipes.unshift(r);S.sel=r.id;}',
      'else{var r2=getR();if(r2){r2.title=ti;r2.time=tm;r2.diff=df;r2.tags=tg;if(ig.length)r2.ings=ig;if(st.length)r2.steps=st;}}',
      'save();S.arm=0;S.screen="detail";render();}',
      'function act(a,el){',
      'if(a==="open"){S.sel=el.getAttribute("data-id");S.cook=0;S.screen="detail";render();}',
      'else if(a==="back"){S.arm=0;S.screen="list";render();}',
      'else if(a==="add"){S.sel=null;S.screen="add";render();}',
      'else if(a==="edit"){S.screen="edit";render();}',
      'else if(a==="save"){doSave();}',
      'else if(a==="del"){if((Date.now()-S.arm)<4000){S.recipes=S.recipes.filter(function(r){return r.id!==S.sel;});delete S.checked[S.sel];save();S.arm=0;S.sel=null;S.screen="list";}else{S.arm=Date.now();}render();}',
      'else if(a==="ing"){var r=getR();if(!r)return;var i=el.getAttribute("data-i");var ck=S.checked[r.id]=S.checked[r.id]||{};if(ck[i])delete ck[i];else ck[i]=1;render();}',
      'else if(a==="cook"){S.cook=0;S.screen="cook";render();}',
      'else if(a==="cprev"){if(S.cook>0){S.cook--;render();}}',
      'else if(a==="cnext"){var rr=getR();if(rr&&S.cook<rr.steps.length-1){S.cook++;render();}else{S.screen="detail";render();}}',
      'else if(a==="ttoggle"){tToggle();}',
      'else if(a==="treset"){tReset(curStepMins());}',
      '}',
      'var pd=null;',
      'app.addEventListener("pointerdown",function(e){pd={x:e.clientX,y:e.clientY};},true);',
      'app.addEventListener("pointerup",function(e){if(pd&&Math.abs(e.clientX-pd.x)+Math.abs(e.clientY-pd.y)>14){pd=null;return;}pd=null;var t=e.target&&e.target.closest?e.target.closest("[data-act]"):null;if(!t)return;try{e.preventDefault();}catch(x){}act(t.getAttribute("data-act"),t);},true);',
      'render();',
      '})();'
    ].join('\n');

    var html = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
      '<meta name="theme-color" content="' + THEME_COLOR[c.vibe] + '">',
      '<title>Recipe Box</title>',
      '<style>' + CSS + '</style>',
      '</head>',
      '<body data-vibe="' + c.vibe + '">',
      '<div id="app"></div>',
      '<script>',
      APP,
      '<' + '/script>',
      '</body>',
      '</html>'
    ].join('\n');

    return html;
  }

  window.MoorKit = { build: build };
})();
