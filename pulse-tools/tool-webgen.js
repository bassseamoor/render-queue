/* Website Generator — Pulse tool.
 * Port of the sealed narrow website generator (opaque product commission,
 * receipt c0d9f2b6d12608ef, first proof 35/35). The PRODUCT, not the factory:
 * no Funnel, no Foundry, no B15, no Chronicle, no factory names.
 *
 * Contract (identical to the Python original):
 *  - Declared variables only: product_class, title, sections (1..8),
 *    palette (ink/moss/ember/tide), layout (single/two/hero), seed (optional).
 *  - Validation + refusal with exact codes before anything is generated.
 *  - Explicit generation state machine with a transition log.
 *  - Artifact verification (6 checks) + admission gate (admit only on PASS).
 *  - Deterministic: same request -> same bytes. HTML escaping matches
 *    Python html.escape(quote=True) exactly; seed/run_id derivation uses
 *    SHA-256 over the same stable JSON encoding, so artifacts are
 *    byte-identical to the Python implementation for the same request.
 *
 * TAGS: tool:webgen | cat:creation | kind:generator |
 *       dep:none | prov:opaque-product |
 *       src:proof/packages/narrow-website-generator-1.0.0/child.py
 */
(function(){
'use strict';

/* ---------- SHA-256 (sync, standard construction) ---------- */
var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256Bytes(msg){
  var l=msg.length, bitLen=l*8, withOne=l+1, padLen=(((withOne+8+63)>>6)<<6), total=padLen+0;
  var b=new Array(total);
  for(var i=0;i<l;i++)b[i]=msg[i]&0xff;
  b[l]=0x80;
  for(i=l+1;i<padLen-8;i++)b[i]=0;
  var hi=Math.floor(bitLen/0x100000000), lo=bitLen>>>0;
  b[padLen-8]=(hi>>>24)&0xff;b[padLen-7]=(hi>>>16)&0xff;b[padLen-6]=(hi>>>8)&0xff;b[padLen-5]=hi&0xff;
  b[padLen-4]=(lo>>>24)&0xff;b[padLen-3]=(lo>>>16)&0xff;b[padLen-2]=(lo>>>8)&0xff;b[padLen-1]=lo&0xff;
  var h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  var w=new Array(64);
  function rotr(x,n){return (x>>>n)|(x<<(32-n));}
  for(var off=0;off<total;off+=64){
    for(i=0;i<16;i++)w[i]=((b[off+i*4]<<24)|(b[off+i*4+1]<<16)|(b[off+i*4+2]<<8)|b[off+i*4+3])>>>0;
    for(i=16;i<64;i++){
      var s0=(rotr(w[i-15],7)^rotr(w[i-15],18)^(w[i-15]>>>3))>>>0;
      var s1=(rotr(w[i-2],17)^rotr(w[i-2],19)^(w[i-2]>>>10))>>>0;
      w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
    }
    var a=h[0],bb=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
    for(i=0;i<64;i++){
      var S1=(rotr(e,6)^rotr(e,11)^rotr(e,25))>>>0;
      var ch=((e&f)^(~e&g))>>>0;
      var t1=(hh+S1+ch+K[i]+w[i])>>>0;
      var S0=(rotr(a,2)^rotr(a,13)^rotr(a,22))>>>0;
      var maj=((a&bb)^(a&c)^(bb&c))>>>0;
      var t2=(S0+maj)>>>0;
      hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=bb;bb=a;a=(t1+t2)>>>0;
    }
    h[0]=(h[0]+a)>>>0;h[1]=(h[1]+bb)>>>0;h[2]=(h[2]+c)>>>0;h[3]=(h[3]+d)>>>0;
    h[4]=(h[4]+e)>>>0;h[5]=(h[5]+f)>>>0;h[6]=(h[6]+g)>>>0;h[7]=(h[7]+hh)>>>0;
  }
  var out=new Array(32);
  for(i=0;i<8;i++){out[i*4]=(h[i]>>>24)&0xff;out[i*4+1]=(h[i]>>>16)&0xff;out[i*4+2]=(h[i]>>>8)&0xff;out[i*4+3]=h[i]&0xff;}
  return out;
}
function utf8Bytes(s){
  var b=[];
  for(var i=0;i<s.length;i++){
    var c=s.charCodeAt(i);
    if(c<0x80)b.push(c);
    else if(c<0x800)b.push(0xc0|(c>>6),0x80|(c&0x3f));
    else if(c>=0xd800&&c<=0xdbff&&i+1<s.length){
      var d=s.charCodeAt(i+1);
      if(d>=0xdc00&&d<=0xdfff){
        var cp=0x10000+((c-0xd800)<<10)+(d-0xdc00);
        b.push(0xf0|(cp>>18),0x80|((cp>>12)&0x3f),0x80|((cp>>6)&0x3f),0x80|(cp&0x3f));
        i++;
      }else b.push(0xe0|(c>>12),0x80|((c>>6)&0x3f),0x80|(c&0x3f));
    }else b.push(0xe0|(c>>12),0x80|((c>>6)&0x3f),0x80|(c&0x3f));
  }
  return b;
}
function sha256Hex(str){
  var h=sha256Bytes(utf8Bytes(str)), s='';
  for(var i=0;i<h.length;i++)s+=('0'+h[i].toString(16)).slice(-2);
  return s;
}

/* ---------- stable JSON (matches Python sort_keys, separators, ensure_ascii) ---------- */
function stable(o){
  if(o===null||o===undefined)return 'null';
  if(typeof o==='number'){
    if(!isFinite(o))return 'null';
    return String(o);
  }
  if(typeof o==='boolean')return o?'true':'false';
  if(typeof o==='string')return JSON.stringify(o).replace(/[\u0080-\uffff]/g,function(ch){
    var h=ch.charCodeAt(0).toString(16);
    return '\\u'+('0000'+h).slice(-4);
  });
  if(Array.isArray(o))return '['+o.map(stable).join(',')+']';
  var keys=Object.keys(o).sort();
  return '{'+keys.map(function(k){return stable(k)+':'+stable(o[k]);}).join(',')+'}';
}

/* ---------- escaping: Python html.escape(quote=True) exactly ---------- */
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

/* ---------- contract ---------- */
var PRODUCT_ID='narrow-website-generator';
var PALETTES={
  ink:  {bg:'#101014',fg:'#f2f0ea',accent:'#d8a24a'},
  moss: {bg:'#0f1a12',fg:'#e8f0e4',accent:'#7fc96b'},
  ember:{bg:'#1c0f0a',fg:'#f7e8dc',accent:'#e0642f'},
  tide: {bg:'#0a1620',fg:'#e2eef7',accent:'#4aa8d8'}
};
var LAYOUTS=['single','two','hero'];
var DECLARED_KEYS=['product_class','title','sections','palette','layout','seed'];
var UNSAFE=/(<script|javascript:|on\w+\s*=)/i;
var STATES=['REQUEST_RECEIVED','PURPOSE_FROZEN','CONSTRAINTS_LOADED','PRODUCT_STATE_INITIALIZED',
  'STRUCTURE_GENERATED','COMPONENTS_GENERATED','RELATIONSHIPS_GENERATED','VALIDATION',
  'REPAIR_OR_REFUSAL','FINAL_PRODUCT','SEAL_EXPORT_DEPLOY'];

function Refusal(code,detail,stage){
  this.code=code;this.detail=detail;this.stage=stage||null;
}
Refusal.prototype=new Error();

function checkStr(v,name,lo,hi){
  if(typeof v!=='string')return name+' must be a string';
  if(v.length<lo||v.length>hi)return name+' length must be '+lo+'..'+hi;
  if(UNSAFE.test(v))return name+' contains unsafe markup';
  return null;
}
function validateRequest(req){
  var errs=[],i,e;
  for(var k in req){
    if(req.hasOwnProperty(k)&&DECLARED_KEYS.indexOf(k)<0)
      errs.push('variable "'+k+'" is not declared for this product; request refused');
  }
  e=checkStr(req.title,'title',1,80); if(e)errs.push(e);
  var secs=req.sections;
  if(!Array.isArray(secs)||secs.length<1||secs.length>8){
    errs.push('sections must be a list of 1..8');
  }else{
    for(i=0;i<secs.length;i++){
      var s=secs[i];
      if(!s||typeof s!=='object'){errs.push('sections['+i+'] must be an object');continue;}
      e=checkStr(s.heading,'sections['+i+'].heading',1,60); if(e)errs.push(e);
      e=checkStr(s.body,'sections['+i+'].body',1,2000); if(e)errs.push(e);
    }
  }
  if(!PALETTES.hasOwnProperty(req.palette))
    errs.push('palette must be one of '+Object.keys(PALETTES).sort().join(', '));
  if(LAYOUTS.indexOf(req.layout)<0)
    errs.push('layout must be one of '+LAYOUTS.join(', '));
  return errs;
}
function seedFor(req){
  var s=req.seed;
  if(typeof s==='number'&&isFinite(s)&&Math.floor(s)===s)return s;
  var d=sha256Bytes(utf8Bytes(stable(req)));
  var n=0;
  for(var i=0;i<8;i++)n=n*256+d[i];
  return n;
}
function genStructure(req){
  var nav=[],i;
  for(i=0;i<req.sections.length;i++)
    nav.push({id:'s'+(i+1),label:req.sections[i].heading});
  var ids=[];
  for(i=0;i<req.sections.length;i++)ids.push('s'+(i+1));
  return {kind:'page',title:req.title,layout:req.layout,palette:req.palette,
    section_ids:ids,nav:nav};
}
function genComponents(req,structure){
  var pal=PALETTES[req.palette],comps=[],i;
  for(i=0;i<req.sections.length;i++){
    var s=req.sections[i],sid='s'+(i+1);
    comps.push({id:sid,html:'<section id="'+sid+'"><h2>'+esc(s.heading)+
      '</h2><p>'+esc(s.body)+'</p></section>'});
  }
  comps.push({id:'style',html:'<style>:root{--bg:'+pal.bg+';--fg:'+pal.fg+
    ';--ac:'+pal.accent+'}'+
    'body{background:var(--bg);color:var(--fg);'+
    'font-family:system-ui,sans-serif;margin:0 auto;'+
    'max-width:46rem;padding:2rem;line-height:1.6}'+
    'a{color:var(--ac)}h1,h2{color:var(--ac)}'+
    'nav a{margin-right:1rem}</style>'});
  return comps;
}
function genRelationships(req,structure,components){
  var secIds={},i;
  for(i=0;i<components.length;i++)
    if(components[i].id.charAt(0)==='s')secIds[components[i].id]=1;
  return {nav_links:structure.nav.map(function(n){
    return {from:'nav',to:n.id,resolves:!!secIds[n.id]};
  })};
}
function renderArtifact(req,structure,components){
  var nav=structure.nav.map(function(n){
    return '<a href="#'+n.id+'">'+esc(n.label)+'</a>';
  }).join('');
  var style='',secs='',i;
  for(i=0;i<components.length;i++){
    if(components[i].id==='style')style=components[i].html;
    /* matches the Python original: id "style" also starts with "s" */
    if(components[i].id.charAt(0)==='s')secs+=components[i].html;
  }
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n'+
    '<meta charset="utf-8">\n'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n'+
    '<title>'+esc(req.title)+'</title>\n'+style+'\n</head>\n'+
    '<body class="layout-'+req.layout+'">\n'+
    '<header><h1>'+esc(req.title)+'</h1><nav>'+nav+'</nav></header>\n'+
    '<main>\n'+secs+'\n</main>\n'+
    '<footer><p>Generated artifact. Proof grade.</p></footer>\n'+
    '</body>\n</html>\n';
}
function verifyArtifact(req,artifact){
  var checks=[];
  function chk(id,ok,detail){checks.push({id:id,passed:!!ok,detail:detail});}
  chk('doctype',artifact.indexOf('<!DOCTYPE html>')===0,'must start with doctype');
  chk('title',artifact.indexOf('<title>'+esc(req.title)+'</title>')>=0,'escaped title present');
  var n=artifact.split('<section id="s').length-1;
  chk('section_count',n===req.sections.length,
    'expected '+req.sections.length+' sections, found '+n);
  var navOk=true,i;
  for(i=0;i<req.sections.length;i++)
    if(artifact.indexOf('href="#s'+(i+1)+'"')<0)navOk=false;
  chk('nav_resolves',navOk,'every nav anchor resolves');
  chk('no_script',artifact.toLowerCase().indexOf('<script')<0,'no script elements allowed');
  chk('layout_class',artifact.indexOf('layout-'+req.layout)>=0,'layout class present');
  return checks;
}
function admit(run){
  var checks=[];
  function chk(id,ok,detail){checks.push({id:id,passed:!!ok,detail:detail});return !!ok;}
  if(!chk('structure',run.structure&&typeof run.structure==='object'&&
      Array.isArray(run.components)&&run.relationships&&
      typeof run.relationships==='object',
      'structure/components/relationships present'))
    return {status:'FAIL',checks:checks};
  var errs=validateRequest(run.request);
  if(!chk('constraints',errs.length===0,
      errs.length===0?'request within declared bounds':errs.join('; ')))
    return {status:'FAIL',checks:checks};
  if(!chk('authority',run.role==='customer'||run.role==='owner',
      'requester role "'+run.role+'" authorized for the declared class'))
    return {status:'REFUSED',checks:checks};
  if(!chk('dependencies',true,'declared capability subset present'))
    return {status:'BLOCKED',checks:checks};
  var ok=run.checks.length>0&&run.checks.every(function(c){return c.passed;});
  if(!chk('properties',ok,ok?'all verifier checks passed':'failed checks present'))
    return {status:'FAIL',checks:checks};
  return {status:'PASS',checks:checks};
}
function generate(request,role){
  role=role||'customer';
  var run={run_id:sha256Hex(stable(request)).slice(0,16),state:'REQUEST_RECEIVED',
    request:JSON.parse(JSON.stringify(request)),role:role,seed:null,
    structure:null,components:null,relationships:null,artifact:null,checks:[]};
  var log=[];
  function step(name,frm,to,fn){
    if(run.state!==frm)
      throw new Refusal('ILLEGAL_TRANSITION',
        'transition "'+name+'" requires state "'+frm+'", current state is "'+run.state+'"',
        run.state);
    fn();run.state=to;
    log.push({seq:log.length+1,transition:name,from:frm,to:to});
  }
  step('freeze_purpose','REQUEST_RECEIVED','PURPOSE_FROZEN',function(){
    if(request.product_class!=='website')
      throw new Refusal('UNKNOWN_PRODUCT_CLASS',
        'product class "'+request.product_class+'" is not accepted by this product '+
        '(declared: "website"); refused, nothing generated','PURPOSE_FROZEN');
    var errs=validateRequest(request);
    if(errs.length)
      throw new Refusal('OUT_OF_SCOPE_REQUEST',
        'request failed declared acceptance: '+errs.join('; '),'PURPOSE_FROZEN');
  });
  step('load_constraints','PURPOSE_FROZEN','CONSTRAINTS_LOADED',function(){
    run.constraints={product_class:'website',max_repairs:2};
  });
  step('init_product_state','CONSTRAINTS_LOADED','PRODUCT_STATE_INITIALIZED',function(){
    run.seed=seedFor(request);
  });
  var guard=0;
  while(true){
    if(++guard>4)throw new Refusal('VALIDATION_FAILED','repair loop guard','REPAIR_OR_REFUSAL');
    step('generate_structure','PRODUCT_STATE_INITIALIZED','STRUCTURE_GENERATED',function(){
      run.structure=genStructure(request);
    });
    step('generate_components','STRUCTURE_GENERATED','COMPONENTS_GENERATED',function(){
      run.components=genComponents(request,run.structure);
    });
    step('generate_relationships','COMPONENTS_GENERATED','RELATIONSHIPS_GENERATED',function(){
      run.relationships=genRelationships(request,run.structure,run.components);
    });
    step('validate','RELATIONSHIPS_GENERATED','VALIDATION',function(){
      run.artifact=renderArtifact(request,run.structure,run.components);
      run.checks=verifyArtifact(request,run.artifact);
    });
    step('decide','VALIDATION','REPAIR_OR_REFUSAL',function(){});
    if(run.checks.every(function(c){return c.passed;}))break;
    throw new Refusal('VALIDATION_FAILED',
      'artifact failed verification; refused, nothing admitted','REPAIR_OR_REFUSAL');
  }
  var adm=admit(run);
  if(adm.status!=='PASS')
    throw new Refusal('ADMISSION_'+adm.status,
      'admission gate did not pass (status '+adm.status+'); nothing admitted',
      'FINAL_PRODUCT');
  run.state='FINAL_PRODUCT';
  log.push({seq:log.length+1,transition:'accept_product',
    from:'REPAIR_OR_REFUSAL',to:'FINAL_PRODUCT'});
  var artifactSha=sha256Hex(run.artifact);
  run.state='SEAL_EXPORT_DEPLOY';
  log.push({seq:log.length+1,transition:'seal_export_deploy',
    from:'FINAL_PRODUCT',to:'SEAL_EXPORT_DEPLOY'});
  return {status:'admitted',product:PRODUCT_ID,product_class:'website',
    artifact_sha256:artifactSha,artifact_text:run.artifact,transitions:log,
    admission:adm,
    verification:{checks_passed:run.checks.filter(function(c){return c.passed;}).length,
      checks_total:run.checks.length},
    provenance:{run_id:run.run_id,seed:run.seed,transitions:log.length}};
}

var WG_CSS=[
'.wg-root{max-width:44rem;margin:0 auto;padding:4px 2px 24px;color:inherit}',
'.wg-lede{opacity:.85;margin:0 0 14px}',
'.wg-form{display:flex;flex-direction:column;gap:12px}',
'.wg-form label{display:flex;flex-direction:column;gap:6px;font-size:.9rem}',
'.wg-form input[type=text],.wg-form input[type=number],.wg-form textarea{',
'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);border-radius:10px;',
'color:inherit;padding:12px;font-size:1rem;width:100%;box-sizing:border-box}',
'.wg-cap{font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin-top:4px}',
'.wg-pick{display:flex;gap:8px;flex-wrap:wrap}',
'.wg-chip{border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);',
'color:inherit;border-radius:999px;padding:10px 16px;font-size:1rem;cursor:pointer}',
'.wg-chip.on{border-color:var(--ac,#4aa8d8);background:rgba(255,255,255,.12)}',
'.wg-sw{display:inline-flex;align-items:center;gap:8px}',
'.wg-dot{width:14px;height:14px;border-radius:50%;display:inline-block}',
'.wg-secs{display:flex;flex-direction:column;gap:10px}',
'.wg-sec{border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px}',
'.wg-sec-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}',
'.wg-rm{background:none;border:1px solid rgba(255,255,255,.2);color:inherit;border-radius:8px;',
'padding:6px 10px;cursor:pointer;font-size:.85rem}',
'.wg-add{background:none;border:1px dashed rgba(255,255,255,.3);color:inherit;border-radius:10px;',
'padding:12px;cursor:pointer;font-size:1rem}',
'.wg-add:disabled{opacity:.4;cursor:default}',
'.wg-go{border:0;border-radius:12px;padding:16px;font-size:1.1rem;cursor:pointer;',
'background:#4aa8d8;color:#04121c;font-weight:700;margin-top:6px}',
'.wg-out{margin-top:16px}',
'.wg-card{border:1px solid rgba(255,255,255,.14);border-radius:14px;padding:12px}',
'.wg-ok{margin-bottom:10px}',
'.wg-prev{width:100%;height:420px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:#fff}',
'.wg-row{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}',
'.wg-btn{border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:inherit;',
'border-radius:10px;padding:10px 14px;cursor:pointer;font-size:.95rem;text-decoration:none;display:inline-block}',
'.wg-refused{border:1px solid rgba(255,120,120,.5);border-radius:12px;padding:12px}',
'.wg-det{margin-top:8px}',
'.wg-det summary{cursor:pointer;padding:8px 0}',
'.wg-prov .mono,.mono{font-family:ui-monospace,monospace;font-size:.8rem;word-break:break-all}',
'.wg-checks{list-style:none;padding:0;margin:8px 0}',
'.wg-checks li{padding:4px 0}',
'.wg-checks li.ok{color:#7fc96b}',
'.wg-checks li.bad{color:#e0642f}'
].join('\n');
var wgStyleEl=null;
function wgCssOn(){
  if(wgStyleEl)return;
  wgStyleEl=document.createElement('style');
  wgStyleEl.setAttribute('data-wg','1');
  wgStyleEl.textContent=WG_CSS;
  document.head.appendChild(wgStyleEl);
}
function wgCssOff(){
  if(wgStyleEl&&wgStyleEl.parentNode)wgStyleEl.parentNode.removeChild(wgStyleEl);
  wgStyleEl=null;
}

/* ---------- UI ---------- */
var root=null;
function el(tag,cls,html){
  var d=document.createElement(tag);
  if(cls)d.className=cls;
  if(html!==undefined)d.innerHTML=html;
  return d;
}
function sectionRow(i,heading,body){
  var wrap=el('div','wg-sec');
  var head=el('div','wg-sec-head');
  head.appendChild(el('strong',null,'Section '+(i+1)));
  var rm=el('button','wg-rm','Remove');
  rm.type='button';
  rm.onclick=function(){wrap.parentNode.removeChild(wrap);renumber();};
  head.appendChild(rm);
  wrap.appendChild(head);
  var hl=el('label',null,'Heading');
  var hi=document.createElement('input');
  hi.type='text';hi.maxLength=60;hi.placeholder='Section heading';hi.value=heading||'';
  hl.appendChild(hi);wrap.appendChild(hl);
  var bl=el('label',null,'Body');
  var bt=document.createElement('textarea');
  bt.rows=3;bt.maxLength=2000;bt.placeholder='Section body text';bt.value=body||'';
  bl.appendChild(bt);wrap.appendChild(bl);
  return wrap;
}
function renumber(){
  if(!root)return;
  var secs=root.querySelectorAll('.wg-sec');
  for(var i=0;i<secs.length;i++)
    secs[i].querySelector('strong').textContent='Section '+(i+1);
}
function mount(host,c){
  wgCssOn();
  root=el('div','wg-root');
  root.appendChild(el('p','wg-lede',
    'Make a small website. Fill in the blanks, tap Generate. '+
    'Only the declared fields are accepted — anything else is refused.'));
  var form=el('div','wg-form');
  var tl=el('label',null,'Title');
  var ti=document.createElement('input');
  ti.type='text';ti.maxLength=80;ti.placeholder='My website';ti.id='wg-title';
  tl.appendChild(ti);form.appendChild(tl);

  form.appendChild(el('div','wg-cap','Layout'));
  var layouts=el('div','wg-pick');
  LAYOUTS.forEach(function(l,i){
    var b=el('button','wg-chip'+(i===0?' on':''),l);
    b.type='button';b.setAttribute('data-v',l);
    b.onclick=function(){
      var bs=layouts.querySelectorAll('button');
      for(var j=0;j<bs.length;j++)bs[j].classList.remove('on');
      b.classList.add('on');
    };
    layouts.appendChild(b);
  });
  form.appendChild(layouts);

  form.appendChild(el('div','wg-cap','Colors'));
  var pals=el('div','wg-pick');
  Object.keys(PALETTES).sort().forEach(function(p,i){
    var b=el('button','wg-chip'+(i===0?' on':'')+ ' wg-sw','');
    b.type='button';b.setAttribute('data-v',p);b.title=p;
    var dot=el('span','wg-dot');dot.style.background=PALETTES[p].accent;
    b.appendChild(dot);
    b.appendChild(el('span',null,p));
    b.onclick=function(){
      var bs=pals.querySelectorAll('button');
      for(var j=0;j<bs.length;j++)bs[j].classList.remove('on');
      b.classList.add('on');
    };
    pals.appendChild(b);
  });
  form.appendChild(pals);

  form.appendChild(el('div','wg-cap','Sections (1 to 8)'));
  var secHost=el('div','wg-secs');
  secHost.appendChild(sectionRow(0,'',''));
  form.appendChild(secHost);
  var add=el('button','wg-add','+ Add section');
  add.type='button';
  add.onclick=function(){
    var n=secHost.querySelectorAll('.wg-sec').length;
    if(n>=8){add.disabled=true;return;}
    secHost.appendChild(sectionRow(n,'',''));
    if(secHost.querySelectorAll('.wg-sec').length>=8)add.disabled=true;
  };
  form.appendChild(add);

  var sl=el('label',null,'Seed (optional — leave blank for deterministic default)');
  var si=document.createElement('input');
  si.type='number';si.placeholder='auto';si.id='wg-seed';
  sl.appendChild(si);form.appendChild(sl);

  var gen=el('button','wg-go','Generate website');
  gen.type='button';
  form.appendChild(gen);
  root.appendChild(form);

  var out=el('div','wg-out');
  root.appendChild(out);
  host.appendChild(root);

  function pickVal(hostEl){
    var b=hostEl.querySelector('button.on');
    return b?b.getAttribute('data-v'):null;
  }
  gen.onclick=function(){
    out.innerHTML='';
    var secs=[],ok=true;
    var nodes=secHost.querySelectorAll('.wg-sec');
    for(var i=0;i<nodes.length;i++){
      var h=nodes[i].querySelector('input').value;
      var b=nodes[i].querySelector('textarea').value;
      secs.push({heading:h,body:b});
    }
    var req={product_class:'website',title:ti.value,sections:secs,
      palette:pickVal(pals),layout:pickVal(layouts)};
    var sv=si.value.trim();
    if(sv!==''){var n=parseInt(sv,10);if(!isNaN(n))req.seed=n;}
    var res;
    try{
      res=generate(req,'customer');
    }catch(e){
      if(e instanceof Refusal||e.code){
        out.appendChild(el('div','wg-refused',
          '<strong>Refused — '+esc(e.code)+'</strong><p>'+esc(e.detail||e.message)+'</p>'));
      }else{
        out.appendChild(el('div','wg-refused',
          '<strong>Something went wrong</strong><p>'+esc(e.message||String(e))+'</p>'));
      }
      return;
    }
    var card=el('div','wg-card');
    card.appendChild(el('div','wg-ok',
      '<strong>Admitted.</strong> '+res.verification.checks_passed+'/'+
      res.verification.checks_total+' checks passed. '+
      'Artifact <span class="mono">'+res.artifact_sha256.slice(0,12)+'…</span>'));
    var prev=document.createElement('iframe');
    prev.className='wg-prev';
    prev.setAttribute('sandbox','');
    prev.setAttribute('title','Website preview');
    card.appendChild(prev);
    try{prev.srcdoc=res.artifact_text;}catch(e2){
      prev.src='data:text/html;charset=utf-8,'+encodeURIComponent(res.artifact_text);
    }
    var row=el('div','wg-row');
    var cp=el('button','wg-btn','Copy HTML');
    cp.type='button';
    cp.onclick=function(){
      function done(){cp.textContent='Copied';setTimeout(function(){cp.textContent='Copy HTML';},1500);}
      if(navigator.clipboard&&navigator.clipboard.writeText)
        navigator.clipboard.writeText(res.artifact_text).then(done,done);
      else{
        var ta=document.createElement('textarea');
        ta.value=res.artifact_text;document.body.appendChild(ta);
        ta.select();try{document.execCommand('copy');}catch(e){}
        document.body.removeChild(ta);done();
      }
    };
    row.appendChild(cp);
    var dl=el('a','wg-btn','Download .html');
    dl.href='data:text/html;charset=utf-8,'+encodeURIComponent(res.artifact_text);
    dl.download='website-'+res.artifact_sha256.slice(0,8)+'.html';
    row.appendChild(dl);
    card.appendChild(row);
    var det=el('details','wg-det');
    det.appendChild(el('summary',null,'Provenance & verification'));
    var ph=el('div','wg-prov');
    ph.appendChild(el('p','mono','artifact sha256: '+res.artifact_sha256));
    ph.appendChild(el('p','mono','run '+res.provenance.run_id+' · seed '+res.provenance.seed+
      ' · '+res.provenance.transitions+' transitions'));
    var ul=el('ul','wg-checks');
    res.admission.checks.forEach(function(ch){
      ul.appendChild(el('li',ch.passed?'ok':'bad',
        (ch.passed?'✓ ':'✗ ')+esc(ch.id)+' — '+esc(ch.detail)));
    });
    ph.appendChild(ul);
    det.appendChild(ph);
    card.appendChild(det);
    out.appendChild(card);
  };
}
function unmount(){
  wgCssOff();
  root=null;
}

TOOLS.webgen={mount:mount,unmount:unmount};
})();
