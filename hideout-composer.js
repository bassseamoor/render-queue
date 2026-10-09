/* ================================================================
 * hideout-composer.js — SEMANTIC COMPOSER
 * The brain of the dev hideout's map layer.
 *
 * Plain-language composer over the sealed 8-dimension vocabulary.
 * State: {dimensions:{<dimId>:{<valueId>:'REQUIRED'|'ALLOWED'|
 * 'FORBIDDEN'|'UNSPECIFIED'}}}. Default: everything UNSPECIFIED.
 *
 * Public: window.__composer (only global).
 * Defensive: works fully without __band, __mapfield, __devroomUI,
 * or the build console. No network. No model calls. Deterministic.
 * Plain non-technical language throughout the UI.
 * ================================================================ */
(function(){
'use strict';

/* ---------------- utils ---------------- */
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function mk(tag,cls,html){var d=document.createElement(tag);
  if(cls)d.className=cls; if(html!==undefined)d.innerHTML=html; return d;}
function each(o,fn){for(var k in o)if(Object.prototype.hasOwnProperty.call(o,k))fn(k,o[k]);}
function deepCopy(o){return JSON.parse(JSON.stringify(o));}
function lsGet(k){try{return window.localStorage?window.localStorage.getItem(k):null;}catch(e){return null;}}
function lsSet(k,v){try{if(window.localStorage)window.localStorage.setItem(k,v);}catch(e){}}

/* Synchronous SHA-256 (no network). Compact standard implementation. */
function sha256Hex(ascii){
  function rr(v,a){return (v>>>a)|(v<<(32-a));}
  var maxWord=Math.pow(2,32),result='';
  var words=[],asciiBitLength=ascii.length*8;
  var hash=sha256Hex.h=sha256Hex.h||[],k=sha256Hex.k=sha256Hex.k||[];
  var primeCounter=k.length,isComposite={};
  for(var candidate=2;primeCounter<64;candidate++){
    if(!isComposite[candidate]){
      for(var i=0;i<313;i+=candidate)isComposite[i]=candidate;
      hash[primeCounter]=(Math.pow(candidate,.5)*maxWord)|0;
      k[primeCounter++]=(Math.pow(candidate,1/3)*maxWord)|0;
    }
  }
  ascii+='\x80';
  while(ascii.length%64-56)ascii+='\x00';
  for(var i2=0;i2<ascii.length;i2++){
    var j=ascii.charCodeAt(i2);if(j>>8)return;
    words[i2>>2]|=j<<((3-i2)%4)*8;
  }
  words[words.length]=((asciiBitLength/maxWord)|0);
  words[words.length]=(asciiBitLength);
  for(var j2=0;j2<words.length;){
    var w=words.slice(j2,j2+=16),oldHash=hash;
    hash=hash.slice(0,8);
    for(var i3=0;i3<64;i3++){
      var w15=w[i3-15],w2=w[i3-2],a=hash[0],e=hash[4];
      var temp1=hash[7]
        +(rr(e,6)^rr(e,11)^rr(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i3]
        +(w[i3]=(i3<16)?w[i3]:(w[i3-16]+(rr(w15,7)^rr(w15,18)^(w15>>>3))+w[i3-7]+(rr(w2,17)^rr(w2,19)^(w2>>>10)))|0);
      var temp2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&hash[1])^(a&hash[2])^(hash[1]&hash[2]));
      hash=[(temp1+temp2)|0].concat(hash);hash[4]=(hash[4]+temp1)|0;
    }
    for(var i4=0;i4<8;i4++)hash[i4]=(hash[i4]+oldHash[i4])|0;
  }
  for(var i5=0;i5<8;i5++)
    for(var j3=3;j3+1;j3--){
      var b=(hash[i5]>>(j3*8))&255;
      result+=((b<16)?0:'')+b.toString(16);
    }
  return result;
}
function utf8(s){return unescape(encodeURIComponent(s));}

/* ================================================================
 * SEALED VOCABULARY (from semantics.json, embedded verbatim).
 * Exact ids are used in state and UI. Two strings sanitized per
 * module rule (no factory names in UI/state):
 *  - SEALED_RECEIPT desc: "Sealed receipt for the sealed run"
 *  - evidence source: "build receipts + product provenance (sealed)"
 * Security proof statuses are shown honestly, never upgraded.
 * ================================================================ */
var MODES=['REQUIRED','ALLOWED','FORBIDDEN','UNSPECIFIED'];
var MODE_GLOSS={REQUIRED:'must have',ALLOWED:'can have',
  FORBIDDEN:'must not have',UNSPECIFIED:'not set'};
var SEM={dimensions:[
 {id:'behavior',label:'Behavior',plain:'What kind of machine it is',
  source:'machine registry (sealed)',
  values:[
   {id:'RESPONDER',desc:'Input -> current state -> response rule -> output'},
   {id:'DETECTOR',desc:'Observation -> classification -> evidence-bearing result'},
   {id:'TRANSFORMER',desc:'Input state -> governed transformation -> output state'},
   {id:'CONTROLLER',desc:'Current state -> permitted action selection -> bounded action request'},
   {id:'PLANNER',desc:'Goal + available capabilities -> candidate plan'},
   {id:'SPECIALIST',desc:'Domain input -> specialist interpretation -> domain output'},
   {id:'FUNNEL',desc:'Intent -> obligations -> capability composition -> execution'},
   {id:'COMPOSITE',desc:'Governed composition of two or more machine classes'},
   {id:'GENERATOR',desc:'Declared request + constraints -> bounded generation -> admission-gated artifact'}]},
 {id:'state',label:'State',plain:"How it's kept and moved",
  source:'crypto module (sealed)',
  values:[
   {id:'GENERATED',desc:'Artifact produced, not yet reviewed'},
   {id:'REVIEWED',desc:'Artifact reviewed, not yet approved'},
   {id:'APPROVED',desc:'Approved with bound provenance, not yet published'},
   {id:'PUBLISHED',desc:'Published; historical versions verifiable'},
   {id:'STATE_BOUND_AUTHORITY',desc:'Authority material separated per state (DRAFT != APPROVED != PUBLISHED)'},
   {id:'EXPLICIT_TRANSITIONS',desc:'Every state change is a declared, logged transition'}]},
 {id:'input',label:'Input',plain:'What it accepts',
  source:'generator contract (sealed)',
  values:[
   {id:'DECLARED_VARIABLES_ONLY',desc:'Only declared fields accepted; anything else refused'},
   {id:'PRODUCT_CLASS',desc:'One declared product class per machine'},
   {id:'BOUNDED_RANGES',desc:'Lengths, counts, and options bounded in the contract'}]},
 {id:'output',label:'Output',plain:'What it produces',
  source:'generator admission gate (sealed)',
  values:[
   {id:'SINGLE_FILE_ARTIFACT',desc:'One self-contained artifact, inline assets only'},
   {id:'VERIFIED',desc:'Artifact passes verification checks before anything else'},
   {id:'ADMITTED',desc:'Admission gate: PASS admits, FAIL/BLOCKED refuse'}]},
 {id:'intelligence',label:'Intelligence',plain:'Whether it thinks',
  source:'machine layers + zero-layer verdict (sealed)',
  note:'No authorized model exists (standing fact) — model-backed options stay BLOCKED',
  values:[
   {id:'NONE_DETERMINISTIC',desc:'No intelligence; deterministic procedures only'},
   {id:'OPTIONAL_ATTACHABLE',desc:'Intelligence attachable/detachable without redefining law'},
   {id:'NEVER_LAW',desc:'Intelligence is never law, authority, capability, verification, or history'}]},
 {id:'autonomy',label:'Autonomy',plain:'Who decides',
  source:'blueprint chain of command (sealed)',
  values:[
   {id:'OWNER_DECIDES',desc:'The owner decides; holds all responsibility'},
   {id:'MODELS_PROPOSE',desc:'Models propose; the room governs, validates, executes'},
   {id:'NO_AUTO_COLLAPSE',desc:"Never auto-collapse options to 'best' — owner picks"}]},
 {id:'evidence',label:'Evidence',plain:"How it's proven",
  source:'build receipts + product provenance (sealed)',
  values:[
   {id:'VERIFICATION_CHECKS',desc:'Named checks, each passed or failed'},
   {id:'PROVENANCE',desc:'Run id, seed, transition log, artifact hash'},
   {id:'SEALED_RECEIPT',desc:'Sealed receipt for the sealed run'},
   {id:'SHA256_DIGEST',desc:'Content digests, byte-verifiable'}]},
 {id:'security',label:'Security',plain:'How deep enforcement goes',
  source:'adjudicated levels, crypto module (sealed)',
  values:[
   {id:'L0_DESCRIPTIVE',desc:'Documented constraint (audit basis)',status:'proven-in-module'},
   {id:'L1_VALIDATION',desc:'Runtime check; violations refused',status:'proven-in-module'},
   {id:'L2_STATE_MACHINE',desc:'No violating transition exists',status:'proven-in-module'},
   {id:'L3_CAPABILITY',desc:'No capability to violate exists',status:'proven-in-module'},
   {id:'L4_PROCESS_ISOLATION',desc:'Separate process, no shared memory',status:'declared-not-proven'},
   {id:'L5_NETWORK_ISOLATION',desc:'No network route',status:'declared-not-proven'},
   {id:'L6_CRYPTOGRAPHIC',desc:'Inaccessible without key material',status:'proven-in-module'},
   {id:'L7_INFRASTRUCTURE',desc:'Deployment-side infrastructure',status:'out-of-scope'}]}
]};
var STATUS_PLAIN={
 'proven-in-module':'proven inside this module (sealed)',
 'declared-not-proven':'declared, NOT yet proven — do not rely on it',
 'out-of-scope':'outside this module — handled by the deployment side'};

/* ================================================================
 * COMPOSER STATE
 * ================================================================ */
var LS_STATE='hideout.composer.v1';
var LS_BUNDLES='hideout.bundles.v1';

function blankState(){
  var d={};
  SEM.dimensions.forEach(function(dim){
    d[dim.id]={};
    dim.values.forEach(function(v){d[dim.id][v.id]='UNSPECIFIED';});
  });
  return {dimensions:d};
}
var S=blankState();
var conflicts=[];       /* [{id,dim,value,current,incoming,source,detail,ts}] */
var rambleText='';
var rambleLast=null;    /* {matched:[{phrase,dim,value}],unmatched:[words]} */
var strictness={};      /* dimId -> 0..100 */
var conflictSeq=0;

function dimOf(id){for(var i=0;i<SEM.dimensions.length;i++)if(SEM.dimensions[i].id===id)return SEM.dimensions[i];return null;}
function valueOf(dimId,valId){var d=dimOf(dimId);if(!d)return null;
  for(var i=0;i<d.values.length;i++)if(d.values[i].id===valId)return d.values[i];return null;}

function persist(){
  lsSet(LS_STATE,JSON.stringify({dimensions:S.dimensions,conflicts:conflicts,
    rambleText:rambleText,strictness:strictness}));
}
function restore(){
  try{
    var raw=lsGet(LS_STATE);if(!raw)return;
    var o=JSON.parse(raw);
    if(o&&o.dimensions){
      each(o.dimensions,function(dimId,vals){
        each(vals,function(vId,m){
          if(valueOf(dimId,vId)&&MODES.indexOf(m)>=0)S.dimensions[dimId][vId]=m;
        });
      });
    }
    if(o&&Array.isArray(o.conflicts))conflicts=o.conflicts;
    if(o&&typeof o.rambleText==='string')rambleText=o.rambleText;
    if(o&&o.strictness)strictness=o.strictness;
  }catch(e){}
}

/* Live manifestation hook — same frame, defensive. */
function manifest(){
  try{
    if(window.__mapfield&&typeof window.__mapfield.manifest==='function')
      window.__mapfield.manifest(getState());
  }catch(e){}
}
function surfaceConflicts(){
  try{
    if(window.__mapfield&&typeof window.__mapfield.showConflicts==='function')
      window.__mapfield.showConflicts(conflicts.map(function(c){
        return {dimension:c.dim,valueId:c.value,reason:c.detail};
      }));
  }catch(e){}
}

function setDim(dimId,valueId,modality){
  if(!valueOf(dimId,valueId))return false;
  if(MODES.indexOf(modality)<0)return false;
  if(S.dimensions[dimId][valueId]===modality)return true;
  S.dimensions[dimId][valueId]=modality;
  persist();manifest();
  return true;
}
function getState(){return deepCopy(S);}
function reset(){
  S=blankState();conflicts=[];rambleLast=null;strictness={};
  persist();manifest();surfaceConflicts();
}

/* Map-field taps cycle toward REQUIRED. Documented choice:
 * UNSPECIFIED -> ALLOWED -> REQUIRED -> UNSPECIFIED.
 * FORBIDDEN is never set by tapping: refusing a value is a
 * deliberate act and only happens in the composer. */
function mapSelect(dimId,valueId){
  if(!valueOf(dimId,valueId))return false;
  var cur=S.dimensions[dimId][valueId];
  var next=(cur==='UNSPECIFIED')?'ALLOWED':(cur==='ALLOWED')?'REQUIRED':'UNSPECIFIED';
  return setDim(dimId,valueId,next);
}

/* ================================================================
 * RAMBLE — procedural keyword compile.
 * Documented keyword map below: phrase -> dimension value.
 * Everything matched is shown; unparsed words stay visible in
 * the text box and in the unmatched list. Verbatim text is kept.
 * ================================================================ */
var KEYWORDS=[
 /* behavior */
 ['detects','behavior','DETECTOR'],['detection','behavior','DETECTOR'],
 ['detector','behavior','DETECTOR'],['observes','behavior','DETECTOR'],
 ['responds','behavior','RESPONDER'],['answers','behavior','RESPONDER'],
 ['reply','behavior','RESPONDER'],['response rule','behavior','RESPONDER'],
 ['transforms','behavior','TRANSFORMER'],['conversion','behavior','TRANSFORMER'],
 ['controls','behavior','CONTROLLER'],['action selection','behavior','CONTROLLER'],
 ['plans','behavior','PLANNER'],['planning','behavior','PLANNER'],
 ['specialist','behavior','SPECIALIST'],['domain expert','behavior','SPECIALIST'],
 ['composite','behavior','COMPOSITE'],['composition of','behavior','COMPOSITE'],
 ['generates','behavior','GENERATOR'],['generation','behavior','GENERATOR'],
 /* intelligence */
 ['no intelligence','intelligence','NONE_DETERMINISTIC'],
 ['deterministic','intelligence','NONE_DETERMINISTIC'],
 ['no thinking','intelligence','NONE_DETERMINISTIC'],
 ['fixed rules','intelligence','NONE_DETERMINISTIC'],
 ['not smart','intelligence','NONE_DETERMINISTIC'],
 ['intelligence optional','intelligence','OPTIONAL_ATTACHABLE'],
 ['attachable','intelligence','OPTIONAL_ATTACHABLE'],
 ['detach','intelligence','OPTIONAL_ATTACHABLE'],
 ['intelligence never law','intelligence','NEVER_LAW'],
 ['intelligence is never law','intelligence','NEVER_LAW'],
 /* autonomy */
 ['owner decides','autonomy','OWNER_DECIDES'],
 ['i decide','autonomy','OWNER_DECIDES'],['my call','autonomy','OWNER_DECIDES'],
 ['owner picks','autonomy','OWNER_DECIDES'],
 ['models propose','autonomy','MODELS_PROPOSE'],
 ['no auto-pick','autonomy','NO_AUTO_COLLAPSE'],
 ['never collapse','autonomy','NO_AUTO_COLLAPSE'],
 ["don't auto-collapse",'autonomy','NO_AUTO_COLLAPSE'],
 ['no best pick','autonomy','NO_AUTO_COLLAPSE'],
 /* input */
 ['declared fields','input','DECLARED_VARIABLES_ONLY'],
 ['declared variables','input','DECLARED_VARIABLES_ONLY'],
 ['only declared','input','DECLARED_VARIABLES_ONLY'],
 ['one product class','input','PRODUCT_CLASS'],
 ['bounded','input','BOUNDED_RANGES'],['limits','input','BOUNDED_RANGES'],
 /* output */
 ['single file','output','SINGLE_FILE_ARTIFACT'],
 ['one file','output','SINGLE_FILE_ARTIFACT'],
 ['self-contained','output','SINGLE_FILE_ARTIFACT'],
 ['verified','output','VERIFIED'],
 ['passes verification','output','VERIFIED'],
 ['admission','output','ADMITTED'],['admission gate','output','ADMITTED'],
 /* state */
 ['not yet reviewed','state','GENERATED'],
 ['reviewed','state','REVIEWED'],['approved','state','APPROVED'],
 ['published','state','PUBLISHED'],
 ['authority per state','state','STATE_BOUND_AUTHORITY'],
 ['explicit transitions','state','EXPLICIT_TRANSITIONS'],
 ['logged transition','state','EXPLICIT_TRANSITIONS'],
 /* evidence */
 ['named checks','evidence','VERIFICATION_CHECKS'],
 ['checks passed','evidence','VERIFICATION_CHECKS'],
 ['provenance','evidence','PROVENANCE'],
 ['transition log','evidence','PROVENANCE'],
 ['run id','evidence','PROVENANCE'],
 ['sealed receipt','evidence','SEALED_RECEIPT'],
 ['receipt','evidence','SEALED_RECEIPT'],
 ['must prove','evidence','SEALED_RECEIPT'],
 ['prove it','evidence','SEALED_RECEIPT'],
 ['sha256','evidence','SHA256_DIGEST'],['sha 256','evidence','SHA256_DIGEST'],
 ['content digest','evidence','SHA256_DIGEST'],['hash','evidence','SHA256_DIGEST'],
 /* security */
 ['documented','security','L0_DESCRIPTIVE'],
 ['runtime check','security','L1_VALIDATION'],
 ['refuse violations','security','L1_VALIDATION'],
 ['validation','security','L1_VALIDATION'],
 ['state machine','security','L2_STATE_MACHINE'],
 ['no violating transition','security','L2_STATE_MACHINE'],
 ['capability','security','L3_CAPABILITY'],
 ['process isolation','security','L4_PROCESS_ISOLATION'],
 ['separate process','security','L4_PROCESS_ISOLATION'],
 ['no network','security','L5_NETWORK_ISOLATION'],
 ['network isolation','security','L5_NETWORK_ISOLATION'],
 ['offline','security','L5_NETWORK_ISOLATION'],
 ['locked down','security','L6_CRYPTOGRAPHIC'],
 ['crypto','security','L6_CRYPTOGRAPHIC'],
 ['key material','security','L6_CRYPTOGRAPHIC'],
 ['infrastructure','security','L7_INFRASTRUCTURE'],
 ['deployment side','security','L7_INFRASTRUCTURE']
];
/* longest phrase first so "admission gate" beats "admission" etc. */
KEYWORDS.sort(function(a,b){return b[0].length-a[0].length;});

function compileRamble(text){
  text=String(text==null?'':text);
  rambleText=text;
  /* cleaned with length preserved so indices line up with the original */
  var low=' '+text.toLowerCase().replace(/[^a-z0-9 ]/g,' ')+' ';
  var matched=[],seen={},spans=[];
  KEYWORDS.forEach(function(k){
    var phrase=' '+k[0]+' ';
    var idx=low.indexOf(phrase);
    if(idx>=0){
      var key=k[1]+':'+k[2];
      spans.push([idx,idx+phrase.length]);
      if(!seen[key]){seen[key]=true;
        matched.push({phrase:k[0],dim:k[1],value:k[2]});
      }
    }
  });
  /* unmatched: significant words not covered by any matched span */
  var words=text.split(/\s+/).filter(function(w){return w.length>3;});
  var used={};
  spans.forEach(function(sp){
    var seg=low.slice(sp[0],sp[1]).split(/\s+/);
    seg.forEach(function(w){used[w.replace(/[^a-z0-9]/g,'')]=true;});
  });
  var unmatched=[];
  words.forEach(function(w){
    var clean=w.toLowerCase().replace(/[^a-z0-9]/g,'');
    if(!used[clean]&&unmatched.indexOf(w)<0)unmatched.push(w);
  });
  /* apply: matched values become REQUIRED (only where owner has
   * not already set REQUIRED or FORBIDDEN — those are kept) */
  var applied=[],kept=[];
  matched.forEach(function(m){
    var cur=S.dimensions[m.dim][m.value];
    if(cur==='REQUIRED'||cur==='FORBIDDEN')kept.push(m);
    else{S.dimensions[m.dim][m.value]='REQUIRED';applied.push(m);}
  });
  rambleLast={matched:matched,applied:applied,kept:kept,unmatched:unmatched};
  persist();manifest();
  return deepCopy(rambleLast);
}

/* ================================================================
 * CONFLICTS — surfaced, never auto-resolved.
 * A conflict = one value claimed two ways at once (e.g. bundle
 * says REQUIRED while the room holds FORBIDDEN). Nothing picks
 * for the owner: each conflict waits for an explicit choice.
 * ================================================================ */
function addConflict(kind,dimId,valueId,current,incoming,source){
  /* dedupe: same triple already open */
  for(var i=0;i<conflicts.length;i++){
    var c=conflicts[i];
    if(c.dim===dimId&&c.value===valueId&&c.incoming===incoming)return c.id;
  }
  var dim=dimOf(dimId),v=valueOf(dimId,valueId);
  var c2={id:'cf'+(++conflictSeq)+'-'+Date.now().toString(36),
    kind:kind,dim:dimId,value:valueId,
    dimLabel:dim?dim.label:dimId,
    current:current,incoming:incoming,source:source||'',
    detail:'“'+(v?v.id:valueId)+'” ('+(dim?dim.plain:'')+') is “'+current+
      '” in the room but “'+incoming+'” was requested'+(source?(' by '+source):'')+'.',
    ts:new Date().toISOString()};
  conflicts.push(c2);persist();surfaceConflicts();
  return c2.id;
}
function getConflicts(){return deepCopy(conflicts);}
function resolveConflict(id,choice){
  /* choice: 'current' | 'incoming' | 'leave' (leave = dismiss, keep room as-is) */
  for(var i=0;i<conflicts.length;i++){
    if(conflicts[i].id===id){
      var c=conflicts[i];
      if(choice==='incoming')S.dimensions[c.dim][c.value]=c.incoming;
      conflicts.splice(i,1);
      persist();manifest();surfaceConflicts();
      return true;
    }
  }
  return false;
}

/* Scan the room for self-contradictions. In one state each value
 * has exactly one modality, so a single state cannot contradict
 * itself; this scan exists so bundles/ramble/map taps applied
 * over the room are checked before anything changes. */
function checkAgainst(dimId,valueId,incoming,source){
  var cur=S.dimensions[dimId][valueId];
  if(cur!=='UNSPECIFIED'&&cur!==incoming){
    return addConflict('modality',dimId,valueId,cur,incoming,source);
  }
  return null;
}

/* ================================================================
 * BUNDLES — named, saved, reusable compositions.
 * Persisted in localStorage under 'hideout.bundles.v1'.
 * Combine conflicts are surfaced, never silently resolved.
 * ================================================================ */
function bundlesLoad(){
  try{var a=JSON.parse(lsGet(LS_BUNDLES)||'[]');return Array.isArray(a)?a:[];}catch(e){return[];}
}
function bundlesSave(list){lsSet(LS_BUNDLES,JSON.stringify(list));}
function listBundles(){return deepCopy(bundlesLoad());}
function findBundle(name){
  var l=bundlesLoad();
  for(var i=0;i<l.length;i++)if(l[i].name===name)return l[i];
  return null;
}
function saveBundle(name){
  name=String(name||'').trim().slice(0,60);
  if(!name)return null;
  var l=bundlesLoad();
  for(var i=0;i<l.length;i++)if(l[i].name===name)l.splice(i,1);
  l.unshift({name:name,created:new Date().toISOString(),
    dimensions:deepCopy(S.dimensions),conflicts_open:[]});
  bundlesSave(l);
  return name;
}
function expandBundle(name){
  var b=findBundle(name);
  return b?deepCopy(b):null;
}
function deleteBundle(name){
  var l=bundlesLoad(),n0=l.length;
  l=l.filter(function(b){return b.name!==name;});
  bundlesSave(l);
  return l.length<n0;
}
/* Apply: every non-UNSPECIFIED bundle value is proposed to the
 * room. Collisions become conflicts for the owner to resolve. */
function applyBundle(name){
  var b=findBundle(name);
  if(!b)return {applied:0,conflicts:[]};
  var applied=0,made=[];
  each(b.dimensions,function(dimId,vals){
    each(vals,function(vId,m){
      if(MODES.indexOf(m)<0||m==='UNSPECIFIED')return;
      var cur=S.dimensions[dimId]&&S.dimensions[dimId][vId];
      if(cur===undefined)return;
      if(cur==='UNSPECIFIED'){S.dimensions[dimId][vId]=m;applied++;}
      else if(cur!==m)made.push(checkAgainst(dimId,vId,m,'bundle “'+name+'”'));
      else applied++;
    });
  });
  /* carried-open conflicts from the bundle surface too */
  (b.conflicts_open||[]).forEach(function(c){
    addConflict('bundle',c.dim,c.value,
      S.dimensions[c.dim]?S.dimensions[c.dim][c.value]:'UNSPECIFIED',
      c.incoming,'bundle “'+name+'”');
  });
  persist();manifest();surfaceConflicts();
  return {applied:applied,conflicts:made.filter(function(x){return x;})};
}
/* Combine: merge two bundles into a new one. Same value claimed
 * two ways -> recorded in conflicts_open, left UNSPECIFIED in
 * the merged bundle. Nothing is silently picked. */
function combineBundles(nameA,nameB,newName){
  var a=findBundle(nameA),b=findBundle(nameB);
  if(!a||!b)return null;
  newName=String(newName||(nameA+' + '+nameB)).trim().slice(0,60)||(nameA+' + '+nameB);
  var merged=blankState().dimensions,open=[];
  SEM.dimensions.forEach(function(dim){
    dim.values.forEach(function(v){
      var ma=a.dimensions[dim.id]?a.dimensions[dim.id][v.id]:'UNSPECIFIED';
      var mb=b.dimensions[dim.id]?b.dimensions[dim.id][v.id]:'UNSPECIFIED';
      if(ma===mb){merged[dim.id][v.id]=ma;}
      else if(ma==='UNSPECIFIED'){merged[dim.id][v.id]=mb;}
      else if(mb==='UNSPECIFIED'){merged[dim.id][v.id]=ma;}
      else{
        merged[dim.id][v.id]='UNSPECIFIED';
        open.push({dim:dim.id,value:v.id,fromA:ma,fromB:mb,incoming:mb,
          detail:'“'+v.id+'” is “'+ma+'” in “'+nameA+'” but “'+mb+'” in “'+nameB+'”.'});
      }
    });
  });
  var l=bundlesLoad();
  l.unshift({name:newName,created:new Date().toISOString(),
    from:[nameA,nameB],dimensions:merged,conflicts_open:open});
  bundlesSave(l);
  return {name:newName,conflicts:deepCopy(open)};
}

/* ================================================================
 * STRICTNESS SLIDERS — documented mapping, applied per dimension.
 *   0–33:  everything ALLOWED        (open — anything may be used)
 *   34–66: REQUIRED stays, everything else ALLOWED (guided)
 *   67–100: REQUIRED stays, everything else FORBIDDEN (locked)
 * The slider is a deliberate owner act: it applies directly,
 * no conflicts. The mapping is printed in the UI next to it.
 * ================================================================ */
function setStrictness(dimId,v){
  var d=dimOf(dimId);if(!d)return false;
  v=Math.max(0,Math.min(100,Math.round(Number(v)||0)));
  strictness[dimId]=v;
  SEM.dimensions.forEach(function(){});
  var vals=S.dimensions[dimId];
  each(vals,function(vId){
    if(v<34)vals[vId]='ALLOWED';
    else if(v<=66)vals[vId]=(vals[vId]==='REQUIRED')?'REQUIRED':'ALLOWED';
    else vals[vId]=(vals[vId]==='REQUIRED')?'REQUIRED':'FORBIDDEN';
  });
  persist();manifest();
  return true;
}
function getStrictness(dimId){return strictness[dimId]==null?50:strictness[dimId];}

/* ================================================================
 * OWNER-AS-COMPUTE — satisfyingOptions().
 * Computes the machine-class options (behavior values) consistent
 * with the composition and presents them side-by-side with a
 * plain-language reason each one fits. Never collapses to one
 * "best" — the owner picks.
 *
 * Documented rules (visible in the UI next to the results):
 *  - a value marked FORBIDDEN is out
 *  - if any behavior value is REQUIRED, the options are exactly
 *    those (REQUIRED is a must)
 *  - otherwise every non-FORBIDDEN behavior value is an option
 *  - PLANNER needs an intelligence attachment; the sealed note
 *    says no authorized model exists, so PLANNER shows as
 *    BLOCKED whenever NONE_DETERMINISTIC is REQUIRED, and as
 *    "needs owner-approved intelligence" otherwise
 * ================================================================ */
var NEEDS_INTELLIGENCE={PLANNER:true};
function satisfyingOptions(){
  var b=S.dimensions.behavior;
  var required=[],pool=[];
  each(b,function(vId,m){
    if(m==='REQUIRED')required.push(vId);
    else if(m!=='FORBIDDEN')pool.push(vId);
  });
  var candidates=required.length?required:pool;
  var intel=S.dimensions.intelligence;
  var noIntel=intel.NONE_DETERMINISTIC==='REQUIRED';
  var options=candidates.map(function(vId){
    var v=valueOf('behavior',vId);
    var blocked=noIntel&&NEEDS_INTELLIGENCE[vId];
    var why=[];
    why.push(S.dimensions.behavior[vId]==='REQUIRED'
      ?'marked “must have” in the room'
      :'not refused — marked “'+MODE_GLOSS[S.dimensions.behavior[vId]]+'”');
    if(blocked)why.push('needs an intelligence attachment, but “no intelligence” is required — blocked by the sealed note (no authorized model exists)');
    else if(NEEDS_INTELLIGENCE[vId])why.push('needs an intelligence attachment — only with an owner-approved one');
    /* autonomy constraints that shape every option */
    if(S.dimensions.autonomy.OWNER_DECIDES==='REQUIRED')why.push('owner decides — holds all responsibility');
    if(S.dimensions.autonomy.NO_AUTO_COLLAPSE==='REQUIRED')why.push('options stay side-by-side — never auto-collapsed');
    var sec=[];each(S.dimensions.security,function(sId,m){if(m==='REQUIRED')sec.push(sId);});
    if(sec.length)why.push('must enforce: '+sec.join(', '));
    return {value:vId,desc:v.desc,blocked:!!blocked,why:why};
  });
  /* intel-blocked pool members worth naming honestly */
  var alsoBlocked=[];
  if(noIntel)each(NEEDS_INTELLIGENCE,function(vId){
    if(candidates.indexOf(vId)<0&&S.dimensions.behavior[vId]!=='FORBIDDEN')
      alsoBlocked.push({value:vId,reason:'needs intelligence; “no intelligence” is required'});
  });
  return {options:options,alsoBlocked:alsoBlocked,
    rules:['FORBIDDEN values are out',
      required.length?'REQUIRED values are the whole list':'no REQUIRED — every non-FORBIDDEN kind is shown',
      'intelligence: no authorized model exists (sealed note) — model-backed options stay BLOCKED',
      'the composer never picks for you']};
}

/* ================================================================
 * EXPORT — moor.build-order-packet
 * Tiny synchronous sha256, no network. "Send to build console"
 * prefills the console draft when its API exists; otherwise the
 * packet is copyable and downloadable as JSON.
 * ================================================================ */
function canonicalState(){
  var parts=[];
  SEM.dimensions.forEach(function(dim){
    var p=[dim.id];
    dim.values.forEach(function(v){p.push(v.id+'='+S.dimensions[dim.id][v.id]);});
    parts.push(p.join(','));
  });
  return parts.join('|');
}
function page0Text(){
  var L=[];
  L.push('COMPOSER BUILD ORDER — page 0');
  L.push('Composed in the dev hideout, in plain words.');
  L.push('');
  SEM.dimensions.forEach(function(dim){
    var req=[],alw=[],frb=[];
    dim.values.forEach(function(v){
      var m=S.dimensions[dim.id][v.id];
      if(m==='REQUIRED')req.push(v.id);
      else if(m==='ALLOWED')alw.push(v.id);
      else if(m==='FORBIDDEN')frb.push(v.id);
    });
    var bits=[];
    if(req.length)bits.push('must have: '+req.join(', '));
    if(alw.length)bits.push('can have: '+alw.join(', '));
    if(frb.length)bits.push('must not have: '+frb.join(', '));
    L.push(dim.label+' ('+dim.plain+'): '+(bits.length?bits.join(' · '):'nothing set'));
  });
  L.push('');
  L.push('Open conflicts: '+conflicts.length+(conflicts.length?
    ' — the owner must resolve these before sealing.':' — none.'));
  conflicts.forEach(function(c){L.push('  - '+c.detail);});
  L.push('');
  var opts=satisfyingOptions();
  L.push('Machine-kind options ('+opts.options.length+'): '+
    opts.options.map(function(o){return o.value+(o.blocked?' [BLOCKED]':'');}).join(', '));
  L.push('');
  L.push('Done criteria:');
  doneCriteria().forEach(function(d){L.push('  - '+d);});
  return L.join('\n');
}
function doneCriteria(){
  return ['composition sealed with zero open conflicts',
    'owner reviewed the side-by-side options and picked',
    'artifact built and verified (all named checks pass)',
    'deployed to bassseamoor/render-queue@main and live bytes confirmed'];
}
function exportPacket(){
  var page0=page0Text();
  var pkt={schema:'moor.build-order-packet',
    rid:'composer-'+sha256Hex(utf8(canonicalState())).slice(0,12),
    page0:page0,
    page0_hash:sha256Hex(utf8(page0)),
    destination:'bassseamoor/render-queue@main',
    executor:'agent',
    authorize_execution:true,
    done_criteria:doneCriteria(),
    semantic_composition:{dimensions:getState().dimensions,
      bundles_used:listBundles().map(function(b){return b.name;}),
      conflicts_open:getConflicts().map(function(c){return c.id;})},
    issued_at:new Date().toISOString()};
  return pkt;
}
function sendToBuildConsole(){
  var pkt=exportPacket();
  var txt=JSON.stringify(pkt,null,1);
  try{
    var bld=window.__bld;
    var field=document.getElementById('bld-order');
    if(bld&&typeof bld.open==='function'&&field){
      bld.open();
      field.value=txt;
      try{field.focus();}catch(e){}
      return {sent:true,via:'console-draft'};
    }
  }catch(e){}
  return {sent:false,via:'none',packet:txt};
}

/* ================================================================
 * COMPOSER UI — deck tab "Compose", plain non-technical language.
 * Sub-tabs: Compose | Map | Bundles | Ramble | Review | Export.
 * Mobile-first: 390px, no horizontal overflow, >=44px targets.
 * ================================================================ */
var CSS=[
'.cmp{font-family:inherit;color:#e8e4da;font-size:15px;line-height:1.45}',
'.cmp *{box-sizing:border-box}',
'.cmp-sub{display:flex;gap:6px;overflow-x:auto;padding:2px 0 10px;-webkit-overflow-scrolling:touch}',
'.cmp-sub button{flex:none;min-height:44px;padding:0 14px;border-radius:8px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#e8e4da;font-size:14px}',
'.cmp-sub button.on{border-color:#3a86ff;background:rgba(58,134,255,.2)}',
'.cmp h3{font-size:17px;margin:14px 0 2px}',
'.cmp .sub{font-size:13px;opacity:.7;margin:0 0 10px}',
'.cmp-dim{border:1px solid rgba(255,255,255,.12);border-radius:10px;margin:0 0 12px;overflow:hidden}',
'.cmp-dim-h{padding:10px 12px;background:rgba(255,255,255,.04)}',
'.cmp-dim-h b{font-size:16px}',
'.cmp-dim-h .plain{font-size:13px;opacity:.65;display:block;margin-top:2px}',
'.cmp-dim-h .src{font-size:11px;opacity:.45;display:block;margin-top:2px}',
'.cmp-val{padding:10px 12px;border-top:1px solid rgba(255,255,255,.07)}',
'.cmp-val .vid{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:14px}',
'.cmp-val .vd{font-size:13px;opacity:.75;margin:3px 0 8px}',
'.cmp-val .vst{font-size:12px;margin:3px 0 8px;color:#e8c87a}',
'.cmp-seg{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px}',
'.cmp-seg button{min-height:44px;border-radius:8px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.04);color:#e8e4da;font-size:11px;font-weight:700;letter-spacing:.02em}',
'.cmp-seg button .g{display:block;font-weight:400;font-size:10px;opacity:.6}',
'.cmp-seg button.on{border-color:#3a86ff;background:rgba(58,134,255,.22)}',
'.cmp-seg button[data-m="REQUIRED"].on{border-color:#3ddc84;background:rgba(61,220,132,.16)}',
'.cmp-seg button[data-m="FORBIDDEN"].on{border-color:#ff6b6b;background:rgba(255,107,107,.14)}',
'.cmp-search{width:100%;min-height:44px;border-radius:8px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.3);color:#e8e4da;padding:0 12px;font-size:15px;margin:0 0 10px}',
'.cmp-chips{display:flex;gap:6px;overflow-x:auto;padding:0 0 10px;-webkit-overflow-scrolling:touch}',
'.cmp-chips button{flex:none;min-height:44px;padding:0 12px;border-radius:20px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#e8e4da;font-size:13px}',
'.cmp-folder{border:1px solid rgba(255,255,255,.12);border-radius:10px;margin:0 0 8px;overflow:hidden}',
'.cmp-folder>button.fh{width:100%;min-height:52px;background:rgba(255,255,255,.04);border:0;color:#e8e4da;text-align:left;padding:10px 12px;font-size:15px;display:flex;justify-content:space-between;align-items:center;gap:8px}',
'.cmp-folder .cnt{font-size:12px;opacity:.6;flex:none}',
'.cmp-fb{padding:4px 12px 12px}',
'.cmp-row{display:flex;align-items:center;gap:10px;min-height:48px;padding:6px 0;border-top:1px solid rgba(255,255,255,.06)}',
'.cmp-row label{flex:1;font-size:13px;min-width:0}',
'.cmp-row .vid2{font-family:ui-monospace,Menlo,monospace;font-weight:700}',
'.cmp-row .mm{font-size:11px;opacity:.6;display:block}',
'.cmp-row input[type=checkbox]{width:28px;height:28px;flex:none}',
'.cmp-slider{margin:8px 0 4px}',
'.cmp-slider input[type=range]{width:100%;min-height:44px}',
'.cmp-legend{font-size:12px;opacity:.65;margin:0 0 6px}',
'.cmp-btn{min-height:44px;padding:0 16px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(58,134,255,.18);color:#e8e4da;font-size:15px;margin:6px 6px 6px 0}',
'.cmp-btn.ghost{background:rgba(255,255,255,.05)}',
'.cmp-btn.danger{background:rgba(255,107,107,.12);border-color:rgba(255,107,107,.4)}',
'.cmp-ta{width:100%;min-height:120px;border-radius:8px;border:1px solid rgba(255,255,255,.16);background:rgba(0,0,0,.3);color:#e8e4da;padding:10px 12px;font-size:15px;resize:vertical}',
'.cmp-chip{display:inline-block;border:1px solid rgba(58,134,255,.5);border-radius:14px;padding:6px 10px;margin:3px;font-size:12px}',
'.cmp-chip b{font-family:ui-monospace,Menlo,monospace}',
'.cmp-note{font-size:13px;opacity:.7;margin:8px 0}',
'.cmp-conf{border:1px solid rgba(255,107,107,.5);border-radius:10px;padding:10px 12px;margin:0 0 10px;background:rgba(255,107,107,.06)}',
'.cmp-conf .dt{font-size:14px;margin:0 0 8px}',
'.cmp-ok{border:1px solid rgba(61,220,132,.4);border-radius:10px;padding:12px;margin:0 0 10px;font-size:14px}',
'.cmp-cards{display:flex;gap:10px;overflow-x:auto;padding:4px 0 12px;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}',
'.cmp-card{flex:0 0 250px;scroll-snap-align:start;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:12px;background:rgba(255,255,255,.04)}',
'.cmp-card.blocked{opacity:.6;border-color:rgba(255,107,107,.4)}',
'.cmp-card .vid{font-family:ui-monospace,Menlo,monospace;font-weight:700;font-size:15px}',
'.cmp-card ul{margin:8px 0 0;padding-left:18px;font-size:13px;opacity:.85}',
'.cmp-card li{margin:2px 0}',
'.cmp-pre{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.12);border-radius:8px;padding:10px 12px;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-all;max-height:300px;overflow-y:auto;font-family:ui-monospace,Menlo,monospace}',
'.cmp-bundle{border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px 12px;margin:0 0 8px}',
'.cmp-bundle .bn{font-size:16px;font-weight:700}',
'.cmp-bundle .bd{font-size:12px;opacity:.6;margin:2px 0 8px}',
'.cmp-kv{font-size:13px;margin:3px 0;overflow-wrap:anywhere;word-break:break-all}',
'.cmp-kv b{font-family:ui-monospace,Menlo,monospace}',
'.cmp-kv .mR{color:#3ddc84}.cmp-kv .mA{color:#8ab4ff}.cmp-kv .mF{color:#ff6b6b}',
'.cmp-sel{width:100%;min-height:44px;border-radius:8px;background:#101013;color:#e8e4da;border:1px solid rgba(255,255,255,.16);font-size:15px;margin:4px 0;padding:0 10px}'
].join('\n');

var uiTab='compose';   /* compose | map | bundles | ramble | review | export */
var mapOpen={};        /* dimId -> bool */
var mapSearch='';
var lastHost=null;
var cssDone=false;

function ensureCSS(){
  if(cssDone||!document.head)return;cssDone=true;
  var st=document.createElement('style');st.id='cmp-css';st.textContent=CSS;
  document.head.appendChild(st);
}
function modeClass(m){return m==='REQUIRED'?'mR':m==='ALLOWED'?'mA':m==='FORBIDDEN'?'mF':'';}

function renderTab(host){
  ensureCSS();
  lastHost=host;
  host.innerHTML='';
  var root=mk('div','cmp');
  var bar=mk('div','cmp-sub');
  [['compose','Compose'],['map','Map'],['bundles','Bundles'],
   ['ramble','Ramble'],['review','Review'],['export','Export']].forEach(function(t){
    var b=mk('button',uiTab===t[0]?'on':'',esc(t[1]));
    b.type='button';b.setAttribute('aria-pressed',uiTab===t[0]?'true':'false');
    b.addEventListener('click',function(){uiTab=t[0];renderTab(host);});
    bar.appendChild(b);
  });
  root.appendChild(bar);
  var body=mk('div');
  root.appendChild(body);
  host.appendChild(root);
  if(uiTab==='compose')renderComposeTab(body);
  else if(uiTab==='map')renderMapTab(body);
  else if(uiTab==='bundles')renderBundlesTab(body);
  else if(uiTab==='ramble')renderRambleTab(body);
  else if(uiTab==='review')renderReviewTab(body);
  else renderExportTab(body);
}
function rerender(){if(lastHost)renderTab(lastHost);}

/* ---------------- Compose tab ---------------- */
function renderComposeTab(body){
  body.appendChild(mk('h3',null,'What should this thing be?'));
  body.appendChild(mk('p','sub','For each trait, say: must have, can have, must not have — or leave it not set. The exact sealed names are used so nothing gets lost in translation.'));
  SEM.dimensions.forEach(function(dim){
    var box=mk('div','cmp-dim');
    var h=mk('div','cmp-dim-h',
      '<b>'+esc(dim.label)+'</b><span class="plain">'+esc(dim.plain)+'</span>'+
      '<span class="src">sealed source: '+esc(dim.source)+'</span>');
    box.appendChild(h);
    if(dim.note)box.appendChild(mk('div','cmp-val',
      '<div class="vst">'+esc(dim.note)+'</div>'));
    dim.values.forEach(function(v){
      var cur=S.dimensions[dim.id][v.id];
      var row=mk('div','cmp-val');
      row.appendChild(mk('div','vid',esc(v.id)));
      row.appendChild(mk('div','vd',esc(v.desc)));
      if(v.status)row.appendChild(mk('div','vst',
        'proof status: '+esc(STATUS_PLAIN[v.status]||v.status)));
      var seg=mk('div','cmp-seg');
      MODES.forEach(function(m){
        var b=mk('button',cur===m?'on':'',
          esc(m)+'<span class="g">'+esc(MODE_GLOSS[m])+'</span>');
        b.type='button';b.setAttribute('data-m',m);
        b.setAttribute('aria-pressed',cur===m?'true':'false');
        b.addEventListener('click',function(){
          setDim(dim.id,v.id,m);rerender();
        });
        seg.appendChild(b);
      });
      row.appendChild(seg);
      box.appendChild(row);
    });
    body.appendChild(box);
  });
  var cf=getConflicts();
  if(cf.length){
    body.appendChild(mk('div','cmp-note',
      esc(cf.length)+' open conflict'+(cf.length>1?'s':'')+' — see the Review tab. Nothing is decided for you.'));
  }
  var rs=mk('button','cmp-btn ghost','Start over (clear everything)');
  rs.type='button';
  rs.addEventListener('click',function(){
    if(confirm('Clear the whole composition and all conflicts?')){reset();rerender();}
  });
  body.appendChild(rs);
}

/* ---------------- Map tab: folder tree, search, checkboxes, sliders ---------------- */
function renderMapTab(body){
  body.appendChild(mk('h3',null,'Map control'));
  body.appendChild(mk('p','sub','The same room, seen as a map. Tick what may be used, drag a strictness slider per area, or jump between the 8 areas. Tapping a map item cycles: not set → can have → must have → not set. “Must not have” is only ever set by hand in the Compose tab.'));

  var s=mk('input','cmp-search');
  s.type='search';s.placeholder='Search traits…';s.value=mapSearch;
  s.setAttribute('aria-label','Search traits');
  s.addEventListener('input',function(){mapSearch=s.value;renderMapList(listHost,s.value);});
  body.appendChild(s);

  var chips=mk('div','cmp-chips');
  SEM.dimensions.forEach(function(dim){
    var c=mk('button',null,esc(dim.label));
    c.type='button';
    c.addEventListener('click',function(){
      mapOpen[dim.id]=true;rerender();
      setTimeout(function(){
        var t=lastHost&&lastHost.querySelector('[data-dim="'+dim.id+'"]');
        if(t)t.scrollIntoView({block:'start'});
      },30);
    });
    chips.appendChild(c);
  });
  body.appendChild(chips);

  var listHost=mk('div');
  body.appendChild(listHost);
  renderMapList(listHost,mapSearch);
}
function renderMapList(host,query){
  host.innerHTML='';
  var q=String(query||'').toLowerCase().trim();
  SEM.dimensions.forEach(function(dim){
    var vals=dim.values.filter(function(v){
      return !q||v.id.toLowerCase().indexOf(q)>=0||v.desc.toLowerCase().indexOf(q)>=0;
    });
    if(q&&!vals.length)return;
    if(q)mapOpen[dim.id]=true;
    var open=!!mapOpen[dim.id];
    var f=mk('div','cmp-folder');
    f.setAttribute('data-dim',dim.id);
    var setCount=dim.values.filter(function(v){
      return S.dimensions[dim.id][v.id]!=='UNSPECIFIED';}).length;
    var fh=mk('button','fh',
      '<span><b>'+esc(dim.label)+'</b> <span style="opacity:.6;font-size:13px">'+esc(dim.plain)+'</span></span>'+
      '<span class="cnt">'+setCount+' set ▾</span>');
    fh.type='button';fh.setAttribute('aria-expanded',open?'true':'false');
    fh.addEventListener('click',function(){mapOpen[dim.id]=!mapOpen[dim.id];rerender();});
    f.appendChild(fh);
    if(open){
      var fb=mk('div','cmp-fb');
      /* strictness slider */
      var sl=mk('div','cmp-slider');
      var sv=getStrictness(dim.id);
      sl.appendChild(mk('div','cmp-legend',
        '<b>Strictness '+sv+'</b> — 0–33: everything “can have” · 34–66: “must have” stays, rest “can have” · 67–100: “must have” stays, rest “must not have”'));
      var r=mk('input');r.type='range';r.min='0';r.max='100';r.value=String(sv);
      r.setAttribute('aria-label',dim.label+' strictness');
      r.addEventListener('change',function(){setStrictness(dim.id,r.value);rerender();});
      sl.appendChild(r);
      fb.appendChild(sl);
      /* checkboxes */
      vals.forEach(function(v){
        var cur=S.dimensions[dim.id][v.id];
        var checked=(cur==='ALLOWED'||cur==='REQUIRED');
        var row=mk('div','cmp-row');
        var cb=mk('input');cb.type='checkbox';cb.checked=checked;
        cb.setAttribute('aria-label',v.id);
        cb.addEventListener('change',function(){
          setDim(dim.id,v.id,cb.checked?'ALLOWED':'UNSPECIFIED');
          rerender();
        });
        row.appendChild(cb);
        var lab=mk('label',null,
          '<span class="vid2">'+esc(v.id)+'</span><span class="mm">'+
          esc(MODE_GLOSS[cur])+(cur==='REQUIRED'?' (must have — ticking leaves it)':'')+'</span>');
        row.appendChild(lab);
        fb.appendChild(row);
      });
      if(dim.note)fb.appendChild(mk('p','cmp-note',esc(dim.note)));
      f.appendChild(fb);
    }
    host.appendChild(f);
  });
}

/* ---------------- Bundles tab ---------------- */
function bundleSummary(b){
  var parts=[];
  SEM.dimensions.forEach(function(dim){
    dim.values.forEach(function(v){
      var m=b.dimensions[dim.id]&&b.dimensions[dim.id][v.id];
      if(m&&m!=='UNSPECIFIED')parts.push(v.id+'='+m);
    });
  });
  return parts;
}
function renderBundlesTab(body){
  body.appendChild(mk('h3',null,'Bundles'));
  body.appendChild(mk('p','sub','Save this exact composition under a name, re-apply it later, or merge two bundles. Merges that disagree are shown to you — never quietly settled.'));

  var row=mk('div');
  var save=mk('button','cmp-btn','Save current as bundle');
  save.type='button';
  save.addEventListener('click',function(){
    var n=prompt('Bundle name:','');
    if(n&&saveBundle(n))rerender();
  });
  row.appendChild(save);
  body.appendChild(row);

  var list=listBundles();
  if(!list.length)body.appendChild(mk('p','cmp-note','No bundles yet.'));
  list.forEach(function(b){
    var d=mk('div','cmp-bundle');
    d.appendChild(mk('div','bn',esc(b.name)));
    var sum=bundleSummary(b);
    d.appendChild(mk('div','bd',
      esc(sum.length?sum.length+' traits set':'nothing set')+
      (b.from?' · merged from '+b.from.map(esc).join(' + '):'')+
      (b.conflicts_open&&b.conflicts_open.length?' · <b style="color:#ff6b6b">'+b.conflicts_open.length+' open disagreement(s)</b>':'')+
      (b.created?' · saved '+esc(b.created.slice(0,10)):'')));
    var acts=mk('div');
    var ap=mk('button','cmp-btn','Use it');ap.type='button';
    ap.addEventListener('click',function(){
      var r=applyBundle(b.name);
      uiTab='review';rerender();
    });
    var ex=mk('button','cmp-btn ghost','Inspect');ex.type='button';
    ex.addEventListener('click',function(){expandBundleView(body,b);});
    var del=mk('button','cmp-btn danger','Delete');del.type='button';
    del.addEventListener('click',function(){
      if(confirm('Delete bundle “'+b.name+'”?')){deleteBundle(b.name);rerender();}
    });
    acts.appendChild(ap);acts.appendChild(ex);acts.appendChild(del);
    d.appendChild(acts);
    body.appendChild(d);
  });

  /* combine */
  if(list.length>=2){
    body.appendChild(mk('h3',null,'Merge two bundles'));
    body.appendChild(mk('p','sub','Where they agree, the merge keeps it. Where they disagree, the merge records the disagreement and leaves that trait unset — you decide.'));
    var sa=mk('select','cmp-sel'),sb=mk('select','cmp-sel');
    list.forEach(function(b){
      var o1=mk('option',null,esc(b.name));o1.value=b.name;sa.appendChild(o1);
      var o2=mk('option',null,esc(b.name));o2.value=b.name;sb.appendChild(o2);
    });
    sb.selectedIndex=1;
    body.appendChild(sa);body.appendChild(sb);
    var nm=mk('input','cmp-search');nm.placeholder='New bundle name (optional)';
    nm.setAttribute('aria-label','New bundle name');
    body.appendChild(nm);
    var mg=mk('button','cmp-btn','Merge');mg.type='button';
    mg.addEventListener('click',function(){
      if(sa.value===sb.value){alert('Pick two different bundles.');return;}
      var r=combineBundles(sa.value,sb.value,nm.value||undefined);
      if(r){
        uiTab='bundles';rerender();
        if(r.conflicts.length)
          alert(r.conflicts.length+' disagreement(s) recorded in “'+r.name+'” — nothing was quietly settled. See Review or inspect the bundle.');
      }
    });
    body.appendChild(mg);
  }
}
function expandBundleView(body,b){
  var full=expandBundle(b.name);
  if(!full)return;
  var box=mk('div','cmp-bundle');
  box.appendChild(mk('div','bn','Inspecting: '+esc(full.name)));
  SEM.dimensions.forEach(function(dim){
    var lines=[];
    dim.values.forEach(function(v){
      var m=full.dimensions[dim.id]&&full.dimensions[dim.id][v.id];
      if(m&&m!=='UNSPECIFIED')
        lines.push('<div class="cmp-kv"><b>'+esc(v.id)+'</b> — <span class="'+modeClass(m)+'">'+esc(m)+'</span> <span style="opacity:.6">('+esc(MODE_GLOSS[m])+')</span></div>');
    });
    if(lines.length){
      box.appendChild(mk('div','cmp-kv','<b>'+esc(dim.label)+'</b>'));
      lines.forEach(function(l){box.appendChild(mk('div',null,l));});
    }
  });
  (full.conflicts_open||[]).forEach(function(c){
    box.appendChild(mk('div','cmp-conf',
      '<div class="dt">Open disagreement: '+esc(c.detail)+'</div>'));
  });
  var back=mk('button','cmp-btn ghost','Back');back.type='button';
  back.addEventListener('click',function(){rerender();});
  box.appendChild(back);
  body.innerHTML='';body.appendChild(box);
  box.scrollIntoView({block:'start'});
}

/* ---------------- Ramble tab ---------------- */
function renderRambleTab(body){
  body.appendChild(mk('h3',null,'Say it in your own words'));
  body.appendChild(mk('p','sub','Type what you want, plainly. The room reads it and ticks the matching traits — it shows you exactly what it heard and what it didn\u2019t. Your words are kept verbatim.'));
  var ta=mk('textarea','cmp-ta');
  ta.value=rambleText;ta.setAttribute('aria-label','Describe what you want');
  ta.placeholder='e.g. "It detects things, no intelligence, deterministic, owner decides, locked down with crypto, must prove with a receipt…"';
  body.appendChild(ta);
  var go=mk('button','cmp-btn','Read it');go.type='button';
  go.addEventListener('click',function(){
    compileRamble(ta.value);
    rambleText=ta.value;rerender();
  });
  body.appendChild(go);
  if(rambleLast){
    var rl=rambleLast;
    if(rl.matched.length){
      body.appendChild(mk('h3',null,'Heard ('+rl.matched.length+')'));
      rl.matched.forEach(function(m){
        var ap=rl.applied.indexOf(m)>=0;
        body.appendChild(mk('span','cmp-chip',
          '“'+esc(m.phrase)+'” → <b>'+esc(m.value)+'</b>'+
          (ap?'<br><span style="opacity:.65">set to must-have</span>':
           '<br><span style="opacity:.65">kept your setting</span>')));
      });
    }else body.appendChild(mk('p','cmp-note','Nothing matched — try plain words like “detects”, “deterministic”, “locked down”, “must prove”.'));
    if(rl.unmatched.length){
      body.appendChild(mk('h3',null,'Not understood (kept)'));
      body.appendChild(mk('p','cmp-note',
        'These words didn\u2019t map to any trait. They stay in your text above — nothing was thrown away: '+
        rl.unmatched.map(esc).join(', ')));
    }
  }
  body.appendChild(mk('p','cmp-note','The room understands: detects · responds · transforms · controls · plans · specialist · generates · no intelligence / deterministic · owner decides / i decide · models propose · no auto-pick · declared fields · bounded · single file · verified · admission · reviewed / approved / published · named checks · provenance · sealed receipt · sha256 / hash · documented · runtime check · state machine · capability · process isolation · no network / offline · locked down / crypto · infrastructure.'));
}

/* ---------------- Review tab: conflicts + owner-as-compute options ---------------- */
function renderReviewTab(body){
  body.appendChild(mk('h3',null,'Review'));
  body.appendChild(mk('p','sub','Disagreements first, then the options that fit your composition — side by side. The room never picks for you.'));

  var cf=getConflicts();
  body.appendChild(mk('h3',null,'Disagreements ('+cf.length+')'));
  if(!cf.length){
    body.appendChild(mk('div','cmp-ok','No open disagreements. Every trait has exactly one setting.'));
  }else{
    body.appendChild(mk('p','cmp-note','Each one waits for your call. The room will not settle these by itself.'));
    cf.forEach(function(c){
      var box=mk('div','cmp-conf');
      box.appendChild(mk('div','dt',esc(c.detail)));
      var acts=mk('div');
      var k=mk('button','cmp-btn','Keep “'+c.current+'”');k.type='button';
      k.addEventListener('click',function(){resolveConflict(c.id,'current');rerender();});
      var u=mk('button','cmp-btn','Use “'+c.incoming+'”');u.type='button';
      u.addEventListener('click',function(){resolveConflict(c.id,'incoming');rerender();});
      var l=mk('button','cmp-btn ghost','Dismiss');l.type='button';
      l.addEventListener('click',function(){resolveConflict(c.id,'leave');rerender();});
      acts.appendChild(k);acts.appendChild(u);acts.appendChild(l);
      box.appendChild(acts);
      body.appendChild(box);
    });
  }

  body.appendChild(mk('h3',null,'What fits'));
  var res=satisfyingOptions();
  body.appendChild(mk('p','cmp-note','How the room worked it out: '+res.rules.join(' · ')+'.'));
  var cards=mk('div','cmp-cards');
  res.options.forEach(function(o){
    var card=mk('div','cmp-card'+(o.blocked?' blocked':''));
    card.appendChild(mk('div','vid',esc(o.value)+(o.blocked?' — BLOCKED':'')));
    card.appendChild(mk('div','vd',esc(o.desc)));
    var ul=mk('ul');
    o.why.forEach(function(w){ul.appendChild(mk('li',null,esc(w)));});
    card.appendChild(ul);
    cards.appendChild(card);
  });
  body.appendChild(cards);
  if(res.alsoBlocked.length){
    body.appendChild(mk('p','cmp-note','Also blocked: '+
      res.alsoBlocked.map(function(b){return esc(b.value)+' ('+esc(b.reason)+')';}).join(' · ')));
  }
}

/* ---------------- Export tab ---------------- */
function renderExportTab(body){
  body.appendChild(mk('h3',null,'Export'));
  body.appendChild(mk('p','sub','Turn this composition into a build-order packet. You can send it to the build console, or take the JSON yourself.'));
  var pkt=exportPacket();
  var txt=JSON.stringify(pkt,null,1);
  body.appendChild(mk('div','cmp-kv','Order id: <b>'+esc(pkt.rid)+'</b>'));
  body.appendChild(mk('div','cmp-kv','Page-0 hash (sha256): <b>'+esc(pkt.page0_hash)+'</b>'));
  body.appendChild(mk('div','cmp-kv','Destination: <b>'+esc(pkt.destination)+'</b>'));
  var pre=mk('pre','cmp-pre',esc(txt));
  body.appendChild(pre);
  var row=mk('div');
  var cp=mk('button','cmp-btn','Copy JSON');cp.type='button';
  cp.addEventListener('click',function(){
    function done(ok){cp.textContent=ok?'Copied':'Copy failed';setTimeout(function(){cp.textContent='Copy JSON';},1400);}
    if(navigator.clipboard&&navigator.clipboard.writeText)
      navigator.clipboard.writeText(txt).then(function(){done(true);},function(){done(false);});
    else done(false);
  });
  var dl=mk('button','cmp-btn ghost','Download JSON');dl.type='button';
  dl.addEventListener('click',function(){
    try{
      var blob=new Blob([txt],{type:'application/json'});
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=pkt.rid+'.build-order.json';
      document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},400);
    }catch(e){}
  });
  var sc=mk('button','cmp-btn','Send to build console');sc.type='button';
  sc.addEventListener('click',function(){
    var r=sendToBuildConsole();
    sc.textContent=r.sent?'Sent to console':'Console not open';
    if(!r.sent)setTimeout(function(){sc.textContent='Send to build console';},1600);
  });
  row.appendChild(cp);row.appendChild(dl);row.appendChild(sc);
  body.appendChild(row);
  body.appendChild(mk('p','cmp-note','The packet carries the full composition, the bundles used, any open disagreements, and a hash of the page-0 summary so the console can check nothing changed.'));
}

/* ================================================================
 * INTEGRATION — deck tab, band region, public API.
 * Everything below is defensive: the composer fully works if the
 * deck, band, map field, or build console are absent.
 * ================================================================ */
function deckTabsEl(){
  var d=document.getElementById('deck');
  return d?d.querySelector('.deck-tabs'):null;
}
function deckBodyEl(){
  var d=document.getElementById('deck');
  return d?d.querySelector('.deck-body'):null;
}
/* Fallback tab registration: if the room's deck does not already
 * carry a Compose tab (the integration spec adds it properly to
 * TAB_IDS), add one ourselves. */
function ensureDeckTab(){
  try{
    var tabs=deckTabsEl();
    if(!tabs||tabs.querySelector('button[data-tab="compose"]'))return;
    var b=document.createElement('button');
    b.className='deck-tab';b.type='button';
    b.setAttribute('data-tab','compose');
    b.textContent='Compose';
    b.addEventListener('click',function(){
      var bs=tabs.querySelectorAll('.deck-tab');
      for(var i=0;i<bs.length;i++)bs[i].classList.toggle('on',bs[i]===b);
      var body=deckBodyEl();
      if(body)renderTab(body);
    });
    tabs.appendChild(b);
  }catch(e){}
}
function openCompose(){
  try{
    var d=document.getElementById('deck');
    if(!d)return false;
    ensureDeckTab();
    d.classList.add('open');
    var b=d.querySelector('button[data-tab="compose"]');
    if(b)b.click();
    return true;
  }catch(e){return false;}
}
/* Band region (defensive): if another worker unified the band
 * into window.__band {draw(fn), onTap(cb), uvToWall(u)}, paint a
 * small compose summary and make tapping it open the composer.
 * If __band is absent, everything above still works deck-only. */
function bandHook(){
  try{
    var band=window.__band;
    if(!band)return;
    if(typeof band.onTap==='function'){
      band.onTap(function(){openCompose();});
    }
    if(typeof band.draw==='function'){
      band.draw(function(){
        try{
          var args=arguments,c=args[0];
          if(!c||typeof c.fillText!=='function')return;
          var cf=getConflicts().length;
          var set=0;
          SEM.dimensions.forEach(function(dim){dim.values.forEach(function(v){
            if(S.dimensions[dim.id][v.id]!=='UNSPECIFIED')set++;});});
          c.save&&c.save();
          c.fillStyle='rgba(232,228,218,.9)';
          c.font='12px sans-serif';
          c.fillText('COMPOSE  '+set+' set'+(cf?'  ·  '+cf+' disagreement'+(cf>1?'s':''):''),8,16);
          c.restore&&c.restore();
        }catch(e){}
      });
    }
  }catch(e){}
}

/* ---------------- public API ---------------- */
var api={
  /* state */
  setDim:setDim, getState:getState, reset:reset,
  mapSelect:mapSelect,
  /* strictness */
  setStrictness:setStrictness, getStrictness:getStrictness,
  /* ramble */
  compileRamble:compileRamble,
  getRamble:function(){return {text:rambleText,last:deepCopy(rambleLast)};},
  /* conflicts */
  getConflicts:getConflicts, resolveConflict:resolveConflict,
  /* bundles */
  listBundles:listBundles, saveBundle:saveBundle,
  applyBundle:applyBundle, deleteBundle:deleteBundle,
  expandBundle:expandBundle, combineBundles:combineBundles,
  /* owner-as-compute */
  satisfyingOptions:satisfyingOptions,
  /* export */
  exportPacket:exportPacket, sendToBuildConsole:sendToBuildConsole,
  /* ui */
  renderTab:renderTab, openCompose:openCompose,
  vocabulary:function(){return deepCopy(SEM);},
  selfTest:function(){
    var errs=[],n=0;
    SEM.dimensions.forEach(function(dim){dim.values.forEach(function(v){
      MODES.forEach(function(m){n++;if(!setDim(dim.id,v.id,m))errs.push(dim.id+'.'+v.id+'.'+m);});});});
    reset();
    var p=exportPacket();
    ['schema','rid','page0','page0_hash','destination','executor',
     'authorize_execution','done_criteria','semantic_composition','issued_at']
      .forEach(function(f){if(!(f in p))errs.push('packet.'+f);});
    if(p.page0_hash!==sha256Hex(utf8(p.page0)))errs.push('packet.hash');
    return {sets:n,errors:errs};
  }
};
window.__composer=api;

/* ---------------- init ---------------- */
restore();
surfaceConflicts();
function init(){
  ensureDeckTab();
  bandHook();
}
if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init);
else
  setTimeout(init,0);

})();
