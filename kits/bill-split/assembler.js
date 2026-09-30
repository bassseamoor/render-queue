window.MoorKit = { build: build };

function build(config) {
  config = (config && typeof config === "object") ? config : {};
  var NAMES = { "fair-share": "Fair Share", "check-please": "Check Please", "split-it": "Split It", "tip-top": "Tip Top" };
  var ACC = { emerald: "#34d399", ocean: "#38bdf8", amber: "#fbbf24", violet: "#a78bdf" };
  var name = NAMES[config.name] || "Fair Share";
  var acc = ACC[config.accent] || ACC.emerald;
  var defTip = parseFloat(config.tip);
  if (!(defTip >= 0)) defTip = 20;
  var extras = Array.isArray(config.extras) ? config.extras : ["tax", "roundup", "custom"];
  var hasTax = extras.indexOf("tax") !== -1;
  var hasRound = extras.indexOf("roundup") !== -1;
  var hasCustom = extras.indexOf("custom") !== -1;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  var tips = [10, 15, 18, 20, 25];
  var tipBtns = tips.map(function (t) {
    var on = (t === defTip) ? " on" : "";
    return '<button class="tipbtn' + on + '" data-tip="' + t + '" type="button">' + t + '%</button>';
  }).join("");

  var taxRow = hasTax ?
    '<div class="row card"><div class="lab">Tax</div><div class="taxwrap"><input id="taxinp" class="num" inputmode="decimal" value="8.5" aria-label="Tax percent"><span class="pct">%</span></div></div>' : '';
  var modeTabs = hasCustom ?
    '<div class="seg"><button id="meven" class="segbtn on" type="button">Even split</button><button id="mcustom" class="segbtn" type="button">Per person</button></div>' : '';
  var roundRow = hasRound ?
    '<div class="row card"><div class="lab">Round up</div><button id="roundsw" class="sw" type="button" role="switch" aria-checked="false"><span class="knob"></span></button></div>' : '';

  var html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>' + esc(name) + '</title>\n<style>\n' +
  ':root{--acc:' + acc + ';}\n' +
  '*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}\n' +
  'html,body{margin:0;padding:0;height:100%;}\n' +
  'body{background:#0b0e11;color:#f2f5f4;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;display:flex;flex-direction:column;min-height:100dvh;}\n' +
  'header{padding:calc(env(safe-area-inset-top,0px) + 14px) 18px 6px;display:flex;align-items:center;gap:10px;}\n' +
  'header .ico{font-size:26px;}\n' +
  'header h1{font-size:20px;margin:0;font-weight:700;letter-spacing:.2px;}\n' +
  'main{flex:1;overflow-y:auto;padding:10px 14px 16px;display:flex;flex-direction:column;gap:10px;}\n' +
  '.card{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:12px 14px;}\n' +
  '.row{display:flex;align-items:center;justify-content:space-between;}\n' +
  '.lab{font-size:13px;color:#9fb0a8;text-transform:uppercase;letter-spacing:1px;}\n' +
  '#disp .sub{font-size:13px;color:#9fb0a8;}\n' +
  '#disp .amt{font-size:46px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums;}\n' +
  '#disp .amt .cur{font-size:26px;color:var(--acc);font-weight:700;}\n' +
  '#disp .hint{font-size:12px;color:#8a9891;}\n' +
  '.pad{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}\n' +
  '.key{min-height:56px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.06);color:#fff;font-size:22px;font-weight:600;touch-action:manipulation;cursor:pointer;}\n' +
  '.key:active{background:rgba(255,255,255,.16);transform:scale(.97);}\n' +
  '.key.fn{color:var(--acc);font-size:18px;}\n' +
  '.step{display:flex;align-items:center;gap:14px;}\n' +
  '.step button{width:56px;height:56px;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#fff;font-size:26px;touch-action:manipulation;}\n' +
  '.step button:active{background:var(--acc);color:#04120c;}\n' +
  '#pcount{font-size:30px;font-weight:800;min-width:48px;text-align:center;font-variant-numeric:tabular-nums;}\n' +
  '.tips{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;}\n' +
  '.tipbtn{min-width:56px;min-height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;font-size:16px;font-weight:600;touch-action:manipulation;}\n' +
  '.tipbtn.on{background:var(--acc);color:#04120c;border-color:var(--acc);}\n' +
  '.taxwrap{display:flex;align-items:center;gap:4px;}\n' +
  '.num{width:84px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:12px;color:#fff;font-size:20px;padding:10px;text-align:right;font-variant-numeric:tabular-nums;}\n' +
  '.pct{color:#9fb0a8;font-size:16px;}\n' +
  '.seg{display:flex;background:rgba(255,255,255,.05);border-radius:14px;padding:4px;gap:4px;}\n' +
  '.segbtn{flex:1;min-height:48px;border:0;border-radius:11px;background:transparent;color:#cfd8d4;font-size:16px;font-weight:600;touch-action:manipulation;}\n' +
  '.segbtn.on{background:var(--acc);color:#04120c;}\n' +
  '#plist{display:flex;flex-direction:column;gap:8px;}\n' +
  '.prow{display:flex;align-items:center;gap:8px;}\n' +
  '.pname{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:12px;color:#fff;font-size:16px;padding:12px;min-width:0;}\n' +
  '.pamt{min-width:104px;text-align:right;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:12px;color:#fff;font-size:18px;font-weight:700;padding:12px 10px;font-variant-numeric:tabular-nums;touch-action:manipulation;}\n' +
  '.pamt.sel{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc);}\n' +
  '.px{width:44px;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#8a9891;font-size:18px;flex:none;touch-action:manipulation;}\n' +
  '#addp{min-height:52px;border-radius:14px;border:1px dashed rgba(255,255,255,.22);background:transparent;color:var(--acc);font-size:16px;font-weight:700;touch-action:manipulation;}\n' +
  '.sw{width:64px;height:38px;border-radius:20px;border:0;background:rgba(255,255,255,.14);position:relative;touch-action:manipulation;}\n' +
  '.sw .knob{position:absolute;top:3px;left:3px;width:32px;height:32px;border-radius:50%;background:#fff;transition:left .15s;}\n' +
  '.sw[aria-checked="true"]{background:var(--acc);}\n' +
  '.sw[aria-checked="true"] .knob{left:29px;}\n' +
  '#res .per{font-size:22px;font-weight:800;color:var(--acc);font-variant-numeric:tabular-nums;}\n' +
  '#res .brk{font-size:14px;color:#aeb9b4;margin-top:6px;line-height:1.6;font-variant-numeric:tabular-nums;}\n' +
  '.person{padding:8px 0;border-top:1px solid rgba(255,255,255,.07);display:flex;justify-content:space-between;font-size:16px;}\n' +
  '.person b{color:var(--acc);font-variant-numeric:tabular-nums;}\n' +
  'footer{padding:12px 14px calc(env(safe-area-inset-bottom,0px) + 14px);}\n' +
  '#copy{min-height:60px;width:100%;border:0;border-radius:16px;background:var(--acc);color:#04120c;font-size:18px;font-weight:800;touch-action:manipulation;}\n' +
  '#copy:active{transform:scale(.98);}\n' +
  '#modal{position:fixed;inset:0;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:20px;z-index:10;}\n' +
  '#modal.open{display:flex;}\n' +
  '#modal .box{background:#14191d;border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:18px;width:100%;max-width:420px;display:flex;flex-direction:column;gap:12px;}\n' +
  '#sumtxt{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#fff;font-size:14px;padding:12px;min-height:180px;font-family:inherit;resize:vertical;}\n' +
  '#modal .btns{display:flex;gap:10px;}\n' +
  '#modal .btns button{flex:1;min-height:52px;border-radius:14px;font-size:16px;font-weight:700;border:0;touch-action:manipulation;}\n' +
  '#docopy{background:var(--acc);color:#04120c;}\n' +
  '#mclose{background:rgba(255,255,255,.1);color:#fff;}\n' +
  '#toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(0,0,0,.8);color:#fff;padding:10px 18px;border-radius:24px;font-size:14px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:20;}\n' +
  '::-webkit-scrollbar{width:4px;}\n::-webkit-scrollbar-thumb{background:var(--acc);border-radius:2px;}\n' +
  '@media (orientation:landscape) and (max-height:500px){#disp .amt{font-size:32px;}.key{min-height:44px;}}\n' +
  '</style>\n</head>\n<body>\n' +
  '<header><span class="ico">🧾</span><h1>' + esc(name) + '</h1></header>\n' +
  '<main>\n' +
  '<div class="card" id="disp"><div class="sub" id="dsub">Bill total</div><div class="amt"><span class="cur">$</span><span id="damt">0.00</span></div><div class="hint" id="dhint">Tap the keypad to enter</div></div>\n' +
  '<div class="card"><div class="pad" id="pad"></div></div>\n' +
  '<div class="card row"><div class="lab">People</div><div class="step"><button id="pminus" type="button" aria-label="Fewer people">−</button><div id="pcount">2</div><button id="pplus" type="button" aria-label="More people">+</button></div></div>\n' +
  '<div class="card"><div class="lab">Tip</div><div class="tips" id="tips">' + tipBtns + '<input id="tipcustom" class="num" inputmode="decimal" placeholder="%" aria-label="Custom tip percent"></div></div>\n' +
  taxRow + modeTabs +
  '<div class="card" id="pcard" style="display:none;"><div class="lab" style="margin-bottom:8px;">Who had what</div><div id="plist"></div><button id="addp" type="button" style="width:100%;margin-top:8px;">+ Add person</button></div>\n' +
  roundRow +
  '<div class="card" id="res"><div class="lab">Each pays</div><div class="per" id="rper">$0.00</div><div class="brk" id="rbrk"></div></div>\n' +
  '</main>\n' +
  '<footer><button id="copy" type="button">Copy summary</button></footer>\n' +
  '<div id="modal"><div class="box"><div class="lab">Shareable summary</div><textarea id="sumtxt" readonly></textarea><div class="btns"><button id="docopy" type="button">Copy</button><button id="mclose" type="button">Close</button></div></div></div>\n' +
  '<div id="toast"></div>\n' +
  '<script>\n(function(){\n' +
  '"use strict";\n' +
  'var ACC="' + acc + '";\n' +
  'var HAS_TAX=' + (hasTax ? "true" : "false") + ',HAS_CUSTOM=' + (hasCustom ? "true" : "false") + ';\n' +
  'var st={entry:"0",target:"bill",people:2,tip:' + defTip + ',tax:8.5,mode:"even",sel:0,round:false,' +
  'names:["Alex","Sam"],shares:[0,0]};\n' +
  'function $(id){return document.getElementById(id);}\n' +
  'function money(n){return "$"+(isFinite(n)?n:0).toFixed(2);}\n' +
  'function clamp(n,a,b){n=parseFloat(n);if(!isFinite(n))n=0;return Math.min(b,Math.max(a,n));}\n' +
  'function load(){try{var r=localStorage.getItem("billsplit.v1");if(r){var s=JSON.parse(r);if(s&&typeof s==="object"){for(var k in s){if(k in st)st[k]=s[k];}}}}catch(e){}}\n' +
  'function save(){try{localStorage.setItem("billsplit.v1",JSON.stringify(st));}catch(e){}}\n' +
  'load();\n' +
  'function targetVal(){return st.target==="bill"?parseFloat(st.entry)||0:parseFloat(st.shares[st.sel])||0;}\n' +
  'function setTargetVal(v){var s=String(v);if(st.target==="bill"){st.entry=s;}else{st.shares[st.sel]=s;}}\n' +
  'function subtotal(){return parseFloat(st.entry)||0;}\n' +
  'function taxAmt(){if(!HAS_TAX)return 0;return subtotal()*clamp(st.tax,0,50)/100;}\n' +
  'function tipAmt(){return subtotal()*clamp(st.tip,0,100)/100;}\n' +
  'function total(){return subtotal()+taxAmt()+tipAmt();}\n' +
  'function perPerson(){\n' +
  '  var n=st.people;\n' +
  '  if(st.mode==="even"||!HAS_CUSTOM){\n' +
  '    var each=total()/n;if(st.round)each=Math.ceil(each-1e-9);return {list:null,each:each};\n' +
  '  }\n' +
  '  var S=subtotal(),tx=taxAmt(),tp=tipAmt(),list=[],i,share;\n' +
  '  var sumShares=0;for(i=0;i<n;i++)sumShares+=parseFloat(st.shares[i])||0;\n' +
  '  for(i=0;i<n;i++){\n' +
  '    if(sumShares>0&&S>0){share=parseFloat(st.shares[i])||0;share+=tx*share/S+tp*share/S;}\n' +
  '    else{share=total()/n;}\n' +
  '    if(st.round)share=Math.ceil(share-1e-9);\n' +
  '    list.push({name:st.names[i]||("Person "+(i+1)),amt:share});\n' +
  '  }\n' +
  '  return {list:list,each:0};\n' +
  '}\n' +
  'function render(){\n' +
  '  var tv=targetVal();\n' +
  '  $("damt").textContent=tv.toFixed(2);\n' +
  '  if(st.target==="bill"){$("dsub").textContent="Bill total";$("dhint").textContent="Tap the keypad to enter";}\n' +
  '  else{$("dsub").textContent="Editing "+(st.names[st.sel]||("Person "+(st.sel+1)))+chr(8212)+" their pre-tax total";$("dhint").textContent="Keypad edits the selected person";}\n' +
  '  $("pcount").textContent=st.people;\n' +
  '  var pp=perPerson();\n' +
  '  if(pp.list){\n' +
  '    var h="";for(var i=0;i<pp.list.length;i++){h+=\'<div class="person"><span>\'+esc(pp.list[i].name)+\'</span><b>\'+money(pp.list[i].amt)+\'</b></div>\';}\n' +
  '    $("rper").textContent="see below";$("rbrk").innerHTML=h;\n' +
  '  }else{\n' +
  '    $("rper").textContent=money(pp.each);\n' +
  '    $("rbrk").textContent="Subtotal "+money(subtotal())+" · Tip ("+clamp(st.tip,0,100)+"%) "+money(tipAmt())+(HAS_TAX?" · Tax "+money(taxAmt()):"")+" · Total "+money(total());\n' +
  '  }\n' +
  '  save();\n' +
  '  if(HAS_CUSTOM&&st.target!=="bill"){var _pa=document.querySelectorAll("#plist .pamt");if(_pa[st.sel])_pa[st.sel].textContent=money(parseFloat(st.shares[st.sel])||0);}\n' +
  '}\n' +
  'function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}\n' +
  'function chr(c){return String.fromCharCode(c);}\n' +
  'function toast(m){var t=$("toast");t.textContent=m;t.style.opacity="1";clearTimeout(t._h);t._h=setTimeout(function(){t.style.opacity="0";},1600);}\n' +
  'var KEYS=["1","2","3","4","5","6","7","8","9",".","0","00","\u232B","C","\u2713"];\n' +
  'var pad=$("pad");\n' +
  'KEYS.forEach(function(k){\n' +
  '  var b=document.createElement("button");\n' +
  '  b.type="button";b.textContent=k;b.className="key"+((k==="\u232B"||k==="C"||k==="\u2713")?" fn":"");\n' +
  '  b.addEventListener("pointerdown",function(e){e.preventDefault();press(k);});\n' +
  '  pad.appendChild(b);\n' +
  '});\n' +
  'function press(k){\n' +
  '  try{\n' +
  '    var v=String(st.target==="bill"?st.entry:st.shares[st.sel]);\n' +
  '    if(v==="0"&&k!=="."&&k!=="00")v="";\n' +
  '    if(k==="C")v="0";\n' +
  '    else if(k==="\u232B")v=v.length<=1?"0":v.slice(0,-1);\n' +
  '    else if(k==="\u2713"){if(document.activeElement)document.activeElement.blur();render();return;}\n' +
  '    else if(k==="."){if(v.indexOf(".")===-1)v=v===""?"0.":v+".";}\n' +
  '    else{var d=k;var dec=v.indexOf(".");if(dec!==-1&&v.length-dec>2){render();return;}\n' +
  '      if(v.replace(".","").length>=7){render();return;}\n' +
  '      v=v+d;}\n' +
  '    if(st.target==="bill")st.entry=v;else st.shares[st.sel]=v;\n' +
  '  }catch(e){}\n' +
  '  render();\n' +
  '}\n' +
  'function tap(el,fn){el.addEventListener("pointerdown",function(e){e.preventDefault();try{fn();}catch(err){}render();});}\n' +
  'tap($("pminus"),function(){if(st.people>1){st.people--;syncPeople();}});\n' +
  'tap($("pplus"),function(){if(st.people<20){st.people++;syncPeople();}});\n' +
  'function syncPeople(){while(st.names.length<st.people){st.names.push("Person "+(st.names.length+1));st.shares.push("0");}\n' +
  '  st.names.length=st.people;st.shares.length=st.people;\n' +
  '  if(st.sel>=st.people)st.sel=0;\n' +
  '  if(st.target!=="bill")st.target="bill";\n' +
  '  buildRows();}\n' +
  'Array.prototype.forEach.call(document.querySelectorAll(".tipbtn"),function(b){\n' +
  '  b.addEventListener("pointerdown",function(e){e.preventDefault();\n' +
  '    try{document.querySelectorAll(".tipbtn").forEach(function(x){x.classList.remove("on");});\n' +
  '    b.classList.add("on");st.tip=parseFloat(b.getAttribute("data-tip"));$("tipcustom").value="";}catch(err){}\n' +
  '    render();});\n' +
  '});\n' +
  '$("tipcustom").addEventListener("input",function(){var v=clamp(this.value,0,100);\n' +
  '  document.querySelectorAll(".tipbtn").forEach(function(x){x.classList.remove("on");});\n' +
  '  st.tip=v;render();});\n' +
  (hasTax ? '$("taxinp").addEventListener("input",function(){st.tax=clamp(this.value,0,50);render();});\n' : '') +
  (hasCustom ?
  'tap($("meven"),function(){st.mode="even";$("meven").classList.add("on");$("mcustom").classList.remove("on");$("pcard").style.display="none";st.target="bill";});\n' +
  'tap($("mcustom"),function(){st.mode="custom";$("mcustom").classList.add("on");$("meven").classList.remove("on");$("pcard").style.display="block";syncPeople();});\n' : '') +
  'function buildRows(){\n' +
  '  var pl=$("plist");pl.innerHTML="";\n' +
  '  for(var i=0;i<st.people;i++){\n' +
  '    (function(idx){\n' +
  '      var r=document.createElement("div");r.className="prow";\n' +
  '      var nm=document.createElement("input");nm.className="pname";nm.value=st.names[idx];nm.maxLength=24;nm.setAttribute("aria-label","Name for person "+(idx+1));\n' +
  '      nm.addEventListener("input",function(){st.names[idx]=this.value;render();});\n' +
  '      var am=document.createElement("button");am.type="button";am.className="pamt"+(st.mode==="custom"&&st.target!=="bill"&&st.sel===idx?" sel":"");\n' +
  '      am.textContent=money(parseFloat(st.shares[idx])||0);\n' +
  '      am.addEventListener("pointerdown",function(e){e.preventDefault();st.target="p";st.sel=idx;buildRows();render();try{var pd=$("pad");if(pd&&pd.scrollIntoView)pd.scrollIntoView({block:"nearest"});}catch(err2){}});\n' +
  '      r.appendChild(nm);r.appendChild(am);\n' +
  '      if(st.people>1){var x=document.createElement("button");x.type="button";x.className="px";x.textContent="\u00D7";x.setAttribute("aria-label","Remove person");\n' +
  '        x.addEventListener("pointerdown",function(e){e.preventDefault();e.stopPropagation();st.names.splice(idx,1);st.shares.splice(idx,1);st.people--;syncPeople();render();});\n' +
  '        r.appendChild(x);}\n' +
  '      pl.appendChild(r);\n' +
  '    })(i);\n' +
  '  }\n' +
  '}\n' +
  (hasCustom ? 'tap($("addp"),function(){if(st.people<20){st.people++;syncPeople();}});\n' : '') +
  (hasRound ? '$("roundsw").addEventListener("pointerdown",function(e){e.preventDefault();try{st.round=!st.round;this.setAttribute("aria-checked",st.round?"true":"false");}catch(err){}render();});\n' : '') +
  'function summary(){\n' +
  '  var L=[];L.push("'+ esc(name) +'");\n' +
  '  L.push("Subtotal "+money(subtotal())+" · Tip ("+clamp(st.tip,0,100)+"%) "+money(tipAmt())+(HAS_TAX?" · Tax "+money(taxAmt()):"")+" = "+money(total()));\n' +
  '  var pp=perPerson();\n' +
  '  if(pp.list){for(var i=0;i<pp.list.length;i++)L.push("• "+pp.list[i].name+": "+money(pp.list[i].amt));}\n' +
  '  else{L.push(st.people+" people — each pays "+money(pp.each));}\n' +
  '  return L.join("\\n");\n' +
  '}\n' +
  'function openModal(txt){$("sumtxt").value=txt;$("modal").classList.add("open");}\n' +
  'tap($("copy"),function(){openModal(summary());});\n' +
  'tap($("mclose"),function(){$("modal").classList.remove("open");});\n' +
  'tap($("docopy"),function(){\n' +
  '  var t=$("sumtxt").value;\n' +
  '  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){toast("Copied");},function(){fallback();});}\n' +
  '  else fallback();\n' +
  '  function fallback(){try{$("sumtxt").select();document.execCommand("copy");toast("Copied");}catch(e){toast("Select and copy the text");}}\n' +
  '});\n' +
  'document.addEventListener("keydown",function(e){var t=e.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"))return;if(e.key>="0"&&e.key<="9")press(e.key);else if(e.key===".")press(".");else if(e.key==="Backspace")press("\u232B");});\n' +
  'if(HAS_CUSTOM)buildRows();\n' +
  'if(st.tax!==undefined&&$("taxinp"))$("taxinp").value=st.tax;\n' +
  'render();\n' +
  '})();\n</scr'+'ipt>\n</body>\n</html>';
  return html;
}
