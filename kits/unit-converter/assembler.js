/* Moor Kit: unit-converter
 * Exposes window.MoorKit.build(config) -> complete self-contained HTML string.
 * Touch-first unit converter: keypad, 7 categories, live bidirectional
 * conversion (temperature handled with offsets), swap, favorites, history.
 * No external URLs, no localStorage, no placeholders.
 */
(function () {
"use strict";

var CATS_ORDER = ["length", "weight", "temperature", "speed", "volume", "time", "data"];
var TITLES = { converter: "Converter", unitlab: "Unit Lab", measurepro: "Measure Pro", quickconvert: "QuickConvert" };
var ACCENTS = { green: "#34d399", blue: "#60a5fa", amber: "#fbbf24", violet: "#a78bfa" };

function pick(v, allowed, def) {
  if (typeof v === "string" && allowed.indexOf(v) >= 0) return v;
  return def;
}

function build(config) {
  config = (config && typeof config === "object") ? config : {};
  var cat = pick(config.category, CATS_ORDER, "length");
  var pair = pick(config.pair, ["metric_imperial", "imperial_metric"], "metric_imperial");
  var accent = pick(config.accent, ["green", "blue", "amber", "violet"], "green");
  var titleId = pick(config.title, ["converter", "unitlab", "measurepro", "quickconvert"], "converter");
  var hex = ACCENTS[accent];
  var hexSoft = hex + "2e";
  var title = TITLES[titleId];

  var html = '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">\n' +
'<title>' + title + '</title>\n' +
'<style>\n' +
':root{--acc:' + hex + ';--accSoft:' + hexSoft + ';}\n' +
'*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}\n' +
'html,body{height:100%;margin:0;}\n' +
'body{background:#0b0e14;color:#f2f5f9;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,Roboto,Helvetica,Arial,sans-serif;touch-action:manipulation;overscroll-behavior:none;}\n' +
'#app{height:100dvh;max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:10px;padding:14px 14px calc(14px + env(safe-area-inset-bottom));overflow-y:auto;}\n' +
'header{display:flex;align-items:center;justify-content:space-between;flex:0 0 auto;}\n' +
'#title{font-size:22px;font-weight:800;letter-spacing:.2px;}\n' +
'#star{width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#8b93a7;font-size:24px;line-height:1;}\n' +
'#star.on{color:var(--acc);border-color:var(--acc);background:var(--accSoft);}\n' +
'#cats{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;flex:0 0 auto;}\n' +
'.cat{flex:0 0 auto;min-width:66px;min-height:52px;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#cfd6e4;font-size:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 10px;}\n' +
'.cat span{font-size:11px;color:#8b93a7;}\n' +
'.cat.on{background:var(--accSoft);border-color:var(--acc);color:#fff;}\n' +
'.cat.on span{color:#fff;}\n' +
'#favsWrap{flex:0 0 auto;display:none;}\n' +
'.seclab{font-size:11px;letter-spacing:2px;color:#8b93a7;margin:0 2px 6px;}\n' +
'#favs{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;}\n' +
'.f{flex:0 0 auto;min-height:40px;padding:0 14px;border-radius:999px;background:var(--accSoft);border:1px solid var(--acc);color:#fff;font-size:14px;font-weight:600;white-space:nowrap;}\n' +
'#conv{display:flex;flex-direction:column;gap:6px;flex:0 0 auto;}\n' +
'.card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);border-radius:16px;padding:10px 14px 12px;text-align:left;width:100%;color:inherit;font:inherit;cursor:pointer;}\n' +
'.card.active{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc);}\n' +
'.lab{font-size:11px;letter-spacing:2px;color:#8b93a7;margin-bottom:2px;}\n' +
'.lab b{color:var(--acc);font-weight:700;}\n' +
'.val{font-size:36px;font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:46px;line-height:46px;}\n' +
'.units{display:flex;gap:6px;overflow-x:auto;padding:6px 0 2px;}\n' +
'.u{flex:0 0 auto;min-height:38px;padding:0 13px;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid transparent;color:#cfd6e4;font-size:14px;}\n' +
'.u.on{background:var(--accSoft);border-color:var(--acc);color:#fff;font-weight:700;}\n' +
'#swapRow{display:flex;justify-content:center;margin:-2px 0;}\n' +
'#swap{width:58px;height:58px;border-radius:50%;background:var(--acc);color:#0b0e14;font-size:26px;font-weight:800;border:none;box-shadow:0 6px 20px rgba(0,0,0,.45);}\n' +
'#swap:active{transform:scale(.94);}\n' +
'#histWrap{flex:0 0 auto;display:none;}\n' +
'#hist{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;}\n' +
'.h{flex:0 0 auto;min-height:40px;padding:0 13px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#cfd6e4;font-size:13px;white-space:nowrap;font-variant-numeric:tabular-nums;}\n' +
'#pad{flex:1 0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;min-height:300px;}\n' +
'.key{border:none;border-radius:16px;background:rgba(255,255,255,.06);color:#fff;font-size:26px;font-weight:700;min-height:52px;font-family:inherit;}\n' +
'.key:active{background:var(--accSoft);}\n' +
'.key.fn{color:var(--acc);font-size:21px;}\n' +
'::-webkit-scrollbar{height:4px;width:4px;}\n' +
'::-webkit-scrollbar-thumb{background:var(--acc);border-radius:4px;}\n' +
'::-webkit-scrollbar-track{background:transparent;}\n' +
'</style>\n' +
'</head>\n' +
'<body>\n' +
'<div id="app">\n' +
'<header><div id="title">' + title + '</div><button id="star" aria-label="favorite this conversion">\u2606</button></header>\n' +
'<div id="cats"></div>\n' +
'<div id="favsWrap"><div class="seclab">FAVORITES</div><div id="favs"></div></div>\n' +
'<div id="conv">\n' +
'<div class="card" id="fromCard" role="button" tabindex="0"><div class="lab">FROM &middot; <b id="fromULab"></b></div><div class="val" id="fromVal">0</div><div class="units" id="fromUnits"></div></div>\n' +
'<div id="swapRow"><button id="swap" aria-label="swap units">&#8646;</button></div>\n' +
'<div class="card" id="toCard" role="button" tabindex="0"><div class="lab">TO &middot; <b id="toULab"></b></div><div class="val" id="toVal">0</div><div class="units" id="toUnits"></div></div>\n' +
'</div>\n' +
'<div id="histWrap"><div class="seclab">RECENT</div><div id="hist"></div></div>\n' +
'<div id="pad"></div>\n' +
'</div>\n' +
'<script>\n' +
'"use strict";\n' +
'var DCAT="' + cat + '";\n' +
'var DPAIR="' + pair + '";\n' +
'var ORDER=["length","weight","temperature","speed","volume","time","data"];\n' +
'var CATS={\n' +
'length:{label:"Length",icon:"\\uD83D\\uDCCF",units:{"mm":0.001,"cm":0.01,"m":1,"km":1000,"in":0.0254,"ft":0.3048,"yd":0.9144,"mi":1609.344}},\n' +
'weight:{label:"Weight",icon:"\\u2696\\uFE0F",units:{"mg":0.000001,"g":0.001,"kg":1,"t":1000,"oz":0.028349523125,"lb":0.45359237}},\n' +
'temperature:{label:"Temperature",icon:"\\uD83C\\uDF21\\uFE0F",temp:true,units:{"\\u00B0C":1,"\\u00B0F":1,"K":1}},\n' +
'speed:{label:"Speed",icon:"\\uD83D\\uDE97",units:{"m/s":1,"km/h":0.2777777777777778,"mph":0.44704,"ft/s":0.3048,"kn":0.5144444444444445}},\n' +
'volume:{label:"Volume",icon:"\\uD83E\\uDDEA",units:{"mL":0.001,"L":1,"m\\u00B3":1000,"tsp":0.00492892,"tbsp":0.0147868,"fl oz":0.0295735,"cup":0.236588,"pint":0.473176,"quart":0.946353,"gal":3.78541}},\n' +
'time:{label:"Time",icon:"\\u23F1\\uFE0F",units:{"ms":0.001,"s":1,"min":60,"hr":3600,"day":86400,"week":604800}},\n' +
'data:{label:"Data",icon:"\\uD83D\\uDCBE",units:{"B":1,"KB":1024,"MB":1048576,"GB":1073741824,"TB":1099511627776,"PB":1125899906842624}}\n' +
'};\n' +
'var PAIRS={length:["m","ft"],weight:["kg","lb"],temperature:["\\u00B0C","\\u00B0F"],speed:["km/h","mph"],volume:["L","gal"],time:["min","hr"],data:["MB","GB"]};\n' +
'function $(id){return document.getElementById(id);}\n' +
'function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined&&txt!==null)e.textContent=txt;return e;}\n' +
'function toC(v,u){if(u==="\\u00B0C")return v;if(u==="\\u00B0F")return (v-32)*5/9;return v-273.15;}\n' +
'function fromC(v,u){if(u==="\\u00B0C")return v;if(u==="\\u00B0F")return v*9/5+32;return v+273.15;}\n' +
'function convert(cat,v,fu,tu){var c=CATS[cat];if(c.temp)return fromC(toC(v,fu),tu);return v*c.units[fu]/c.units[tu];}\n' +
'function fmt(v){if(typeof v!=="number"||!isFinite(v))return "\\u2014";if(v===0)return "0";var a=Math.abs(v);if(a>=1e12||a<1e-6){return v.toExponential(4).replace(/(\\.\\d*?)0+e/,"$1e").replace(/\\.e/,"e");}return String(Math.round(v*1000000)/1000000);}\n' +
'var S={cat:DCAT,from:"",to:"",active:"from",fromStr:"1",toStr:"",hist:[],favs:[]};\n' +
'function pairFor(c){var p=PAIRS[c];return DPAIR==="metric_imperial"?[p[0],p[1]]:[p[1],p[0]];}\n' +
'function resetUnits(){var p=pairFor(S.cat);S.from=p[0];S.to=p[1];S.fromStr="1";S.active="from";recompute();}\n' +
'function pushHist(){var e={cat:S.cat,from:S.from,to:S.to,fv:S.fromStr,tv:S.toStr};var l=S.hist[0];if(l&&l.cat===e.cat&&l.from===e.from&&l.to===e.to&&l.fv===e.fv&&l.tv===e.tv)return;S.hist.unshift(e);if(S.hist.length>15)S.hist.pop();}\n' +
'function recompute(){var raw=S.active==="from"?S.fromStr:S.toStr;var a=parseFloat(raw);if(isNaN(a)){if(S.active==="from"){S.toStr="\\u2014";}else{S.fromStr="\\u2014";}return;}var r=convert(S.cat,a,S.active==="from"?S.from:S.to,S.active==="from"?S.to:S.from);var rs=fmt(r);if(S.active==="from"){S.toStr=rs;}else{S.fromStr=rs;}pushHist();}\n' +
'function press(k){var fld=S.active==="from"?"fromStr":"toStr";var s=S[fld];if(k==="C"){s="0";}else if(k==="back"){s=s.length>1?s.slice(0,-1):"0";if(s==="-"||s===""){s="0";}}else if(k==="neg"){if(s.charAt(0)==="-"){s=s.slice(1);if(s==="")s="0";}else{s=(s==="0"||s==="")?"-0":"-"+s;}}else if(k==="."){if(s.indexOf(".")<0){s=(s===""||s==="-")?s+"0.":s+".";}}else if(k==="00"){if(s!=="0"&&s!=="-0"&&s!==""){s=s+"00";}}else{if(s==="0"){s=k;}else if(s==="-0"){s="-"+k;}else{s=s+k;}}if(s.length>16){s=s.slice(0,16);}S[fld]=s;recompute();render();}\n' +
'function doSwap(){var u=S.from;S.from=S.to;S.to=u;var s=S.fromStr;S.fromStr=S.toStr;S.toStr=s;pushHist();render();}\n' +
'function isFav(){return S.favs.some(function(f){return f.cat===S.cat&&f.from===S.from&&f.to===S.to;});}\n' +
'function toggleFav(){var i=-1;for(var j=0;j<S.favs.length;j++){var f=S.favs[j];if(f.cat===S.cat&&f.from===S.from&&f.to===S.to){i=j;break;}}if(i>=0){S.favs.splice(i,1);}else{S.favs.push({cat:S.cat,from:S.from,to:S.to});}render();}\n' +
'function applyPair(c,fu,tu){S.cat=c;S.from=fu;S.to=tu;S.fromStr="1";S.active="from";recompute();render();}\n' +
'function buildCats(){var w=$("cats");w.innerHTML="";ORDER.forEach(function(id){var c=CATS[id];var b=el("button","cat"+(id===S.cat?" on":""));b.setAttribute("data-cat",id);var ic=el("span",null,c.icon);b.appendChild(ic);b.appendChild(el("span",null,c.label));b.addEventListener("click",function(){if(S.cat!==id){S.cat=id;resetUnits();render();}});w.appendChild(b);});}\n' +
'function buildUnits(){[["fromUnits","from"],["toUnits","to"]].forEach(function(pr){var w=$(pr[0]);w.innerHTML="";Object.keys(CATS[S.cat].units).forEach(function(u){var b=el("button","u"+(S[pr[1]]===u?" on":""),u);b.setAttribute("data-u",u);b.addEventListener("click",function(e){e.stopPropagation();var other=pr[1]==="from"?"to":"from";if(u===S[other]){S[other]=S[pr[1]];}S[pr[1]]=u;recompute();render();});w.appendChild(b);});});}\n' +
'function buildHist(){var w=$("hist");w.innerHTML="";$("histWrap").style.display=S.hist.length?"block":"none";S.hist.forEach(function(h,i){var b=el("button","h",h.fv+" "+h.from+" \\u2192 "+h.tv+" "+h.to);b.setAttribute("data-histi",String(i));b.addEventListener("click",function(){S.cat=h.cat;S.from=h.from;S.to=h.to;S.fromStr=h.fv;S.active="from";recompute();render();});w.appendChild(b);});}\n' +
'function buildFavs(){var w=$("favs");w.innerHTML="";$("favsWrap").style.display=S.favs.length?"block":"none";S.favs.forEach(function(f,i){var b=el("button","f",f.from+" \\u2192 "+f.to);b.setAttribute("data-favi",String(i));b.addEventListener("click",function(){applyPair(f.cat,f.from,f.to);});w.appendChild(b);});}\n' +
'function render(){$("fromVal").textContent=S.fromStr;$("toVal").textContent=S.toStr;$("fromCard").classList.toggle("active",S.active==="from");$("toCard").classList.toggle("active",S.active==="to");$("fromULab").textContent=S.from;$("toULab").textContent=S.to;var fav=isFav();$("star").textContent=fav?"\\u2605":"\\u2606";$("star").classList.toggle("on",fav);buildCats();buildUnits();buildHist();buildFavs();}\n' +
'function buildPad(){var w=$("pad");w.innerHTML="";var defs=[["1","1"],["2","2"],["3","3"],["4","4"],["5","5"],["6","6"],["7","7"],["8","8"],["9","9"],[".","."],["0","0"],["\\u232B","back"],["C","C"],["\\u00B1","neg"],["00","00"]];defs.forEach(function(d){var b=el("button","key"+((d[1]==="back"||d[1]==="C"||d[1]==="neg")?" fn":""),d[0]);b.setAttribute("data-k",d[1]);b.addEventListener("pointerdown",function(e){e.preventDefault();press(d[1]);});w.appendChild(b);});}\n' +
'try{\n' +
'$("swap").addEventListener("pointerdown",function(e){e.preventDefault();doSwap();});\n' +
'$("star").addEventListener("pointerdown",function(e){e.preventDefault();toggleFav();});\n' +
'$("fromCard").addEventListener("click",function(){S.active="from";render();});\n' +
'$("toCard").addEventListener("click",function(){S.active="to";render();});\n' +
'buildPad();\n' +
'resetUnits();\n' +
'S.hist=[];\n' +
'render();\n' +
'window.addEventListener("resize",function(){try{render();}catch(err){}});\n' +
'window.addEventListener("orientationchange",function(){setTimeout(function(){try{render();}catch(err){}},120);});\n' +
'}catch(err){document.getElementById("fromVal").textContent="error";}\n' +
'<\/script>\n' +
'</body>\n' +
'</html>\n';

  return html;
}

window.MoorKit = { build: build };
})();
