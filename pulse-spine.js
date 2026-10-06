/* Pulse Learning Spine — Input / Stream / Discover / Bin / Funnel.
 * Additive only: reads existing Pulse/local app stores and writes its own
 * moor-pulse-spine-v1 store. It never deletes existing Pulse information.
 */
(function(){
'use strict';
if(typeof window==='undefined'||typeof COMPS==='undefined') return;

var LS='moor-pulse-spine-v1';
var mem=null;
function read(){
  try{
    var raw=localStorage.getItem(LS);
    if(raw){ var x=JSON.parse(raw); if(x&&x.version) return x; }
  }catch(e){}
  if(mem) return mem;
  return {version:1,createdAt:new Date().toISOString(),stream:[],kept:[],funnelInbox:[],seen:{},training:[],trainingBatches:[],trainingLessons:[],refs:[],edges:[],refSeen:{}};
}
function normalizeState(s){
  s=s||{};
  if(!Array.isArray(s.stream))s.stream=[];
  if(!Array.isArray(s.kept))s.kept=[];
  if(!Array.isArray(s.funnelInbox))s.funnelInbox=[];
  if(!s.seen||typeof s.seen!=='object')s.seen={};
  if(!Array.isArray(s.training))s.training=[];
  if(!Array.isArray(s.trainingBatches))s.trainingBatches=[];
  if(!Array.isArray(s.trainingLessons))s.trainingLessons=[];
  if(!Array.isArray(s.refs))s.refs=[];
  if(!Array.isArray(s.edges))s.edges=[];
  if(!s.refSeen||typeof s.refSeen!=='object')s.refSeen={};
  return s;
}
function write(s){
  mem=s;
  try{ localStorage.setItem(LS,JSON.stringify(s)); }catch(e){}
}
var S=normalizeState(read());
var BIN_GITHUB_PATH='moor-bin/';
var BIN_LOCAL_DIR='moor-bin';
var binSyncTimer=null,binLastSig='',binMirrorHandle=null;
var binBacking={local:'pending',lastSync:null,error:null,mirror:null};
function save(){ write(S); decorateFunnel(); scheduleLocalBinSync(); }
function esc2(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function uid(p){ return (p||'sp')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7); }
function textOf(v){
  if(typeof v==='string') return v;
  try{return JSON.stringify(v);}catch(e){return String(v||'');}
}
function hash(s){
  s=String(s||''); var h=2166136261;
  for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return (h>>>0).toString(16);
}
var REF_KINDS=['concept','intent','component','generator','recipe','artifact','blueprint','rule','requirement','evidence','failure','project','version','implementation','training','dataset','example','preference','critique','capability','assembly','composition','handoff','learning'];
function slug(v){return String(v||'ref').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'ref';}
function refStatusWeight(s){return {canonical:9,'human-approved':8,'machine-verified':7,generated:5,observed:4,'specified-not-verified':3,failed:1}[s]||2;}
function normalizeRefKind(k){
  k=String(k||'artifact').toLowerCase();
  if(k==='logic')return 'recipe';
  if(k==='asset'||k==='model'||k==='output'||k==='result')return 'artifact';
  if(k==='spec'||k==='contract')return 'blueprint';
  if(k==='component-project')return 'project';
  return REF_KINDS.indexOf(k)>=0?k:'artifact';
}
function refKey(x){
  if(x.id)return String(x.id);
  var base=[normalizeRefKind(x.kind),x.source||'',x.source_id||'',x.title||'',x.stableKey||''].join('|');
  return normalizeRefKind(x.kind)+':'+slug(x.title||x.source_id||x.source||'ref')+':'+hash(base);
}
function cloneSimple(x){try{return JSON.parse(JSON.stringify(x));}catch(e){return x;}}
function addEdge(from,to,type,provenance){
  if(!from||!to||from===to)return;
  type=type||'related';
  var key=from+'|'+type+'|'+to;
  if(S.edges.some(function(e){return e.key===key;}))return;
  S.edges.push({key:key,from:from,to:to,type:type,provenance:provenance||'observed',at:new Date().toISOString()});
}
function addReference(input){
  input=input||{};
  var id=refKey(input), now=new Date().toISOString(), existing=S.refs.find(function(r){return r.id===id;});
  var conceptPairs=(Array.isArray(input.concepts)?input.concepts:[]).map(function(c){
    var raw=String(c),cid=raw.indexOf('concept:')===0?raw:'concept:'+slug(raw);
    return {id:cid,label:raw.replace(/^concept:/,'').replace(/-/g,' ')};
  });
  var node={
    id:id,kind:normalizeRefKind(input.kind),title:input.title||input.name||id,summary:input.summary||'',
    status:input.status||'observed',source:input.source||'Pulse',source_id:input.source_id||null,
    provenance:input.provenance||'observed',concepts:conceptPairs.map(function(x){return x.id;}),
    roles:Array.isArray(input.roles)?input.roles.slice():[],doc_ref:input.doc_ref||null,
    implementation_ref:input.implementation_ref||null,data:cloneSimple(input.data!=null?input.data:input.payload),
    created_at:existing?existing.created_at:now,updated_at:now,revisions:existing&&Array.isArray(existing.revisions)?existing.revisions:[]
  };
  if(existing){
    var oldSig=hash(textOf([existing.kind,existing.title,existing.summary,existing.status,existing.source,existing.source_id,existing.provenance,existing.concepts,existing.roles,existing.doc_ref,existing.implementation_ref,existing.data]));
    var newSig=hash(textOf([node.kind,node.title,node.summary,node.status,node.source,node.source_id,node.provenance,node.concepts,node.roles,node.doc_ref,node.implementation_ref,node.data]));
    if(oldSig!==newSig){
      var snap=cloneSimple(existing);delete snap.revisions;
      node.revisions=(existing.revisions||[]).concat([snap]).slice(-20);
      S.refs[S.refs.indexOf(existing)]=node;
    }else node=existing;
  }else{
    S.refs.push(node);S.refSeen[id]=1;
  }
  conceptPairs.forEach(function(cp){
    if(!S.refs.some(function(r){return r.id===cp.id;})){
      S.refs.push({id:cp.id,kind:'concept',title:cp.label,summary:'Semantic concept reference.',status:'observed',source:'Reference Graph',source_id:null,provenance:'inferred',concepts:[],roles:[],doc_ref:null,implementation_ref:null,data:null,created_at:now,updated_at:now,revisions:[]});
      S.refSeen[cp.id]=1;
    }
    addEdge(id,cp.id,'about',input.provenance||'observed');
  });
  if(input.generated_by)addEdge(id,input.generated_by,'generated_by',input.provenance||'observed');
  if(input.derived_from)[].concat(input.derived_from).forEach(function(x){addEdge(id,x,'derived_from',input.provenance||'observed');});
  if(input.version_of)addEdge(id,input.version_of,'version_of',input.provenance||'observed');
  if(input.implements)addEdge(id,input.implements,'implements',input.provenance||'observed');
  if(input.verifies)addEdge(id,input.verifies,'verifies',input.provenance||'observed');
  if(input.where_used)[].concat(input.where_used).forEach(function(x){addEdge(id,x,'where_used',input.provenance||'observed');});
  if(input.supersedes)[].concat(input.supersedes).forEach(function(x){addEdge(id,x,'supersedes',input.provenance||'observed');});
  return node;
}
function outputSourceId(src){
  if(!src)return null;
  if(typeof src==='string')return src;
  return src.component||src.app||src.project||src.id||null;
}
function inferConcepts(text){
  var hay=' '+String(text||'').toLowerCase().replace(/[^a-z0-9]+/g,' ')+' ', hits=[];
  S.refs.filter(function(r){return r.kind==='concept';}).forEach(function(r){
    var names=[r.title].concat(r.data&&Array.isArray(r.data.aliases)?r.data.aliases:[]);
    if(names.some(function(n){n=' '+String(n||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()+' ';return n.trim()&&hay.indexOf(n)>=0;}))hits.push(r.id);
  });
  return hits;
}
function ingestCrystalBundle(bundle,outputRef){
  if(!bundle||bundle.schema!=='moor.crystal-bundle')return null;
  var sourceName='MOOR Refinery',sid=bundle.source&&bundle.source.id||'refinery';
  var assemblyRef=null;
  if(bundle.assembly_contract){
    assemblyRef=addReference({id:'assembly:'+bundle.assembly_contract.content_hash,kind:'assembly',
      title:'Assembly · '+(bundle.assembly_contract.artifact_id||bundle.source&&bundle.source.title||'artifact'),
      summary:'Deterministic model-free assembly contract.',status:bundle.status==='machine-verified'?'machine-verified':'specified-not-verified',
      source:sourceName,source_id:sid,provenance:'procedural',implementation_ref:bundle.implementation_ref||null,data:bundle.assembly_contract});
    if(outputRef)addEdge(outputRef.id,assemblyRef.id,'reassembled_by','refinery');
  }
  (bundle.capability_delta||[]).forEach(function(c){
    var cr=addReference({id:'capability:'+hash(textOf([c.capability_id,c.version,c.content_hash])),kind:'capability',
      title:c.capability_id||'Capability',summary:(c.provides&&c.provides.length)?('Provides '+c.provides.join(', ')):'Reusable MOOR capability.',
      status:c.status||'specified-not-verified',source:sourceName,source_id:c.capability_id||sid,provenance:(c.status==='machine-verified'||c.status==='human-approved')?'verified':'procedural',
      implementation_ref:c.implementation_ref||bundle.implementation_ref||null,supersedes:(c.supersedes||[]).map(function(ref){var prior=S.refs.find(function(r){return r.kind==='capability'&&r.data&&(r.id===ref||r.data.capability_id===ref||(r.data.capability_id+'@'+r.data.version)===ref);});return prior&&prior.id||ref;}),data:c});
    if(outputRef)addEdge(outputRef.id,cr.id,'provides','refinery');
    if(assemblyRef)addEdge(cr.id,assemblyRef.id,'assembled_by','refinery');
    (c.evidence_refs||[]).forEach(function(eid){if(S.refs.some(function(r){return r.id===eid;}))addEdge(eid,cr.id,'verifies','refinery');});
  });
  if(bundle.learning_capsule){
    var lr=addReference({id:'learning:'+hash(textOf(bundle.learning_capsule)),kind:'learning',title:'Learning · '+(bundle.source&&bundle.source.title||sid),
      summary:'Compacted reusable decisions, constraints, failures and verification outcome.',status:bundle.status==='machine-verified'?'machine-verified':'observed',
      source:sourceName,source_id:sid,provenance:'procedural',data:bundle.learning_capsule});
    if(outputRef)addEdge(lr.id,outputRef.id,'learned_from','refinery');
  }
  if(window.MoorCapabilityMemory){
    var snap=window.MoorCapabilityMemory.snapshot();
    Object.keys(snap.compositions||{}).forEach(function(id){
      var c=snap.compositions[id];
      var rr=addReference({id:id,kind:'composition',title:(c.from||'capability')+' → '+(c.to||'capability'),
        summary:'Typed capability composition · '+(c.match||'compatibility')+'.',status:c.status==='machine-verified'?'machine-verified':'specified-not-verified',
        source:sourceName,source_id:id,provenance:c.status==='machine-verified'?'verified':'inferred',data:c});
      var from=S.refs.find(function(x){return x.kind==='capability'&&x.data&&x.data.capability_id===c.from;});
      var to=S.refs.find(function(x){return x.kind==='capability'&&x.data&&x.data.capability_id===c.to;});
      if(from)addEdge(from.id,rr.id,'feeds','typed-output');
      if(to)addEdge(rr.id,to.id,'feeds','typed-input');
    });
  }
  return bundle;
}
function crystallizeAndIngestOutput(d,outputRef){
  try{
    if(!window.MoorRefinery||!window.MoorCapabilityMemory)return null;
    var bundle=d&&d.crystal_bundle&&d.crystal_bundle.schema==='moor.crystal-bundle'?d.crystal_bundle:window.MoorRefinery.crystallizeOutput(d||{});
    window.MoorCapabilityMemory.ingest(bundle);
    ingestCrystalBundle(bundle,outputRef);
    if(window.MoorCapabilityHandoff)window.MoorCapabilityHandoff.publishBundle(bundle);
    return bundle;
  }catch(e){return null;}
}
function ingestOutput(d){
  d=d||{};
  var src=d.source||{}, sourceName=(typeof src==='string'?src:(src.app||src.project||src.component||'Application'));
  var srcId=outputSourceId(src);
  var inferredConcepts=(d.concepts&&d.concepts.length)?d.concepts:inferConcepts([d.title,d.name,d.summary,textOf(d.payload),textOf(d.recipe)].join(' '));
  var output=addReference({
    id:d.id||null,kind:normalizeRefKind(d.kind||'artifact'),title:d.title||d.name||'Application output',summary:d.summary||'',
    status:d.status||'generated',source:sourceName,source_id:srcId,provenance:d.provenance||'procedural',
    concepts:inferredConcepts,roles:d.roles||[],doc_ref:d.doc_ref||null,
    implementation_ref:d.implementation_ref||(typeof d.implementation==='string'?d.implementation:null),
    data:d.payload!=null?d.payload:(d.data!=null?d.data:d)
  });
  var sourceRef=null;
  if(srcId){
    sourceRef=S.refs.find(function(r){return r.id==='component:'+srcId||r.source_id===srcId;});
    if(sourceRef)addEdge(output.id,sourceRef.id,'generated_by','output-source');
  }
  if(d.recipe){
    var rr=addReference({id:d.recipe_id||('recipe:'+slug(d.title||srcId||'output')+':'+hash(textOf(d.recipe))),kind:'recipe',
      title:(d.title||'Output')+' recipe',summary:'Reconstruction recipe for '+(d.title||'this output')+'.',
      status:(d.status==='machine-verified'||d.status==='human-approved')?d.status:'generated',source:sourceName,source_id:srcId,
      provenance:d.provenance||'procedural',concepts:inferredConcepts,data:d.recipe});
    addEdge(output.id,rr.id,'derived_from','recipe');
    if(sourceRef)addEdge(rr.id,sourceRef.id,'generated_by','recipe-source');
  }
  if(d.intent){
    var ir=addReference({id:d.intent_id||('intent:'+hash(textOf(d.intent))),kind:'intent',title:'Intent · '+(d.title||sourceName),
      summary:typeof d.intent==='string'?d.intent:'Resolved intent record',status:d.intent_status||'observed',source:sourceName,
      source_id:srcId,provenance:d.intent_provenance||'explicit',data:d.intent,concepts:inferredConcepts});
    addEdge(output.id,ir.id,'answers','output-intent');
  }
  if(d.evidence){
    var er=addReference({id:d.evidence_id||('evidence:'+hash(textOf(d.evidence))),kind:'evidence',title:'Evidence · '+(d.title||sourceName),
      summary:'Verification evidence for an application output.',status:d.status==='failed'?'failed':'machine-verified',source:sourceName,
      source_id:srcId,provenance:'verified',data:d.evidence});
    addEdge(er.id,output.id,'verifies','output-evidence');
  }
  if(d.failure||d.status==='failed'){
    var fr=addReference({id:d.failure_id||('failure:'+hash(textOf(d.failure||d.payload||d))),kind:'failure',title:'Failure · '+(d.title||sourceName),
      summary:(d.failure&&d.failure.reason)||d.failure_reason||'Output failed.',status:'failed',source:sourceName,source_id:srcId,
      provenance:'verified',data:d.failure||d.payload||d});
    addEdge(output.id,fr.id,'failed_because','output-failure');
  }
  crystallizeAndIngestOutput(d,output);
  save();
  return output;
}
function refText(r){
  return [r.title,r.summary,r.kind,r.status,r.source,r.source_id,(r.concepts||[]).join(' '),(r.roles||[]).join(' '),textOf(r.data)].join(' ').toLowerCase();
}
function searchReferences(query,opts){
  opts=opts||{};var ts=tokens(query), scored=[];
  S.refs.forEach(function(r,idx){
    if(opts.kinds&&opts.kinds.length&&opts.kinds.indexOf(r.kind)<0)return;
    var hay=refText(r),score=0;
    ts.forEach(function(t){if(hay.indexOf(t)>=0)score+=t.length>6?4:2;});
    if(!ts.length)score=1;
    if(score>0){score+=refStatusWeight(r.status)*.2;scored.push({ref:r,score:score,idx:idx});}
  });
  scored.sort(function(a,b){return b.score-a.score||b.idx-a.idx;});
  return scored.slice(0,opts.limit||30).map(function(x){return x.ref;});
}
function referencePacket(query,limit){
  var roots=searchReferences(query,{limit:limit||8}), ids={}, frontier=[];
  roots.forEach(function(r){ids[r.id]=1;frontier.push(r.id);});
  var related=[];
  for(var depth=0;depth<2&&frontier.length;depth++){
    var next=[];
    S.edges.forEach(function(e){
      var fromHit=frontier.indexOf(e.from)>=0,toHit=frontier.indexOf(e.to)>=0;
      if(!fromHit&&!toHit)return;
      var other=fromHit?e.to:e.from;
      if(ids[other])return;
      var r=S.refs.find(function(x){return x.id===other;});
      if(r){ids[r.id]=1;related.push(r);next.push(r.id);}
    });
    frontier=next;
  }
  related.sort(function(a,b){return refStatusWeight(b.status)-refStatusWeight(a.status);});
  var all=roots.concat(related).slice(0,(limit||8)*5);
  return {
    query:query,
    concepts:all.filter(function(r){return r.kind==='concept';}),
    recipes:all.filter(function(r){return r.kind==='recipe';}),
    implementations:all.filter(function(r){return r.kind==='component'||r.kind==='generator'||r.kind==='implementation'||r.kind==='artifact';}),
    datasets:all.filter(function(r){return r.kind==='dataset';}),
    examples:all.filter(function(r){return r.kind==='example'||r.kind==='preference'||r.kind==='critique';}),
    rules:all.filter(function(r){return r.kind==='rule'||r.kind==='requirement'||r.kind==='blueprint';}),
    failures:all.filter(function(r){return r.kind==='failure';}),
    evidence:all.filter(function(r){return r.kind==='evidence';}),
    intents:all.filter(function(r){return r.kind==='intent';}),
    capabilities:all.filter(function(r){return r.kind==='capability';}),
    assemblies:all.filter(function(r){return r.kind==='assembly';}),
    compositions:all.filter(function(r){return r.kind==='composition';}),
    handoffs:all.filter(function(r){return r.kind==='handoff';}),
    learning:all.filter(function(r){return r.kind==='learning';})
  };
}
function refMarkdown(r){
  if(!r)return '';
  var out=['# '+r.title,'','- Reference: '+r.id,'- Kind: '+r.kind,'- Status: '+r.status,'- Source: '+r.source,'- Provenance: '+r.provenance];
  if(r.summary)out.push('',r.summary);
  if(r.concepts&&r.concepts.length)out.push('','## Concepts','',r.concepts.map(function(x){return '- '+x;}).join('\\n'));
  if(r.doc_ref)out.push('','## Readable source','',r.doc_ref);
  if(r.implementation_ref)out.push('','## Implementation','',r.implementation_ref);
  if(r.data!=null)out.push('','## Data','',JSON.stringify(r.data,null,2));
  return out.join('\\n');
}


function safeFileName(v){
  return String(v||'ref').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,140)||'ref';
}
function binSnapshot(){
  return {
    schema:'moor.bin.snapshot',version:1,generated_at:new Date().toISOString(),
    github_path:BIN_GITHUB_PATH,local_path:BIN_LOCAL_DIR+'/',
    refs:S.refs,edges:S.edges,
    stats:{references:S.refs.length,edges:S.edges.length,training:S.training.length,projects:S.refs.filter(function(r){return r.kind==='project';}).length}
  };
}
function binBackingSignature(){
  return hash(textOf({
    refs:S.refs.map(function(r){return [r.id,r.updated_at,r.status];}),
    edges:S.edges.map(function(e){return e.key;})
  }));
}
async function writeHandleFile(dir,name,text){
  var h=await dir.getFileHandle(name,{create:true});
  var w=await h.createWritable();
  await w.write(text);await w.close();
}
async function writeBinTree(base){
  var refsDir=await base.getDirectoryHandle('refs',{create:true});
  var recipesDir=await base.getDirectoryHandle('recipes',{create:true});
  var artifactsDir=await base.getDirectoryHandle('artifacts',{create:true});
  var evidenceDir=await base.getDirectoryHandle('evidence',{create:true});
  var failuresDir=await base.getDirectoryHandle('failures',{create:true});
  var projectsDir=await base.getDirectoryHandle('projects',{create:true});
  var snapshotsDir=await base.getDirectoryHandle('snapshots',{create:true});
  var snap=binSnapshot();
  await writeHandleFile(base,'index.json',JSON.stringify({
    schema:'moor.bin.backing',version:1,updated_at:snap.generated_at,
    github_path:BIN_GITHUB_PATH,local_path:BIN_LOCAL_DIR+'/',
    stats:snap.stats,reference_schema:'pulse-reference-graph-schema.json'
  },null,2)+'\n');
  await writeHandleFile(base,'edges.json',JSON.stringify(S.edges,null,2)+'\n');
  await writeHandleFile(snapshotsDir,'latest.json',JSON.stringify(snap,null,2)+'\n');
  var kindDirs={};
  for(var i=0;i<S.refs.length;i++){
    var r=S.refs[i],kd=kindDirs[r.kind];
    if(!kd){kd=kindDirs[r.kind]=await refsDir.getDirectoryHandle(safeFileName(r.kind),{create:true});}
    var body=JSON.stringify(r,null,2)+'\n',fn=safeFileName(r.id)+'.json';
    await writeHandleFile(kd,fn,body);
    if(r.kind==='recipe')await writeHandleFile(recipesDir,fn,body);
    else if(r.kind==='artifact'||r.kind==='implementation')await writeHandleFile(artifactsDir,fn,body);
    else if(r.kind==='evidence')await writeHandleFile(evidenceDir,fn,body);
    else if(r.kind==='failure')await writeHandleFile(failuresDir,fn,body);
    else if(r.kind==='project'||r.kind==='version')await writeHandleFile(projectsDir,fn,body);
  }
  return snap;
}
async function getOpfsBin(){
  if(!navigator.storage||!navigator.storage.getDirectory)throw new Error('Origin Private File System unavailable');
  var root=await navigator.storage.getDirectory();
  return root.getDirectoryHandle(BIN_LOCAL_DIR,{create:true});
}
async function syncLocalBinNow(force){
  var sig=binBackingSignature();
  if(!force&&sig===binLastSig)return {ok:true,skipped:true,backing:binBacking};
  try{
    binBacking.local='syncing';binBacking.error=null;
    var dir=await getOpfsBin();
    var snap=await writeBinTree(dir);
    if(binMirrorHandle){
      try{
        var mirror=await binMirrorHandle.getDirectoryHandle(BIN_LOCAL_DIR,{create:true});
        await writeBinTree(mirror);
        binBacking.mirror=binMirrorHandle.name||'attached folder';
      }catch(me){binBacking.mirror='mirror error';}
    }
    binLastSig=sig;binBacking.local='synced';binBacking.lastSync=snap.generated_at;
    if(typeof renderStage==='function'&&typeof UI!=='undefined'&&UI.tab==='bin')renderStage();
    return {ok:true,snapshot:snap,backing:binBacking};
  }catch(e){
    binBacking.local='fallback';binBacking.error=String(e&&e.message||e);
    return {ok:false,error:binBacking.error,backing:binBacking};
  }
}
function scheduleLocalBinSync(){
  clearTimeout(binSyncTimer);
  binSyncTimer=setTimeout(function(){syncLocalBinNow(false);},1200);
}
async function chooseLocalBinMirror(){
  if(!window.showDirectoryPicker)throw new Error('Visible folder access is unavailable in this browser');
  var h=await window.showDirectoryPicker({mode:'readwrite'});
  binMirrorHandle=h;
  await syncLocalBinNow(true);
  return h.name||'folder';
}

function addStream(kind,source,title,payload,meta,stableKey){
  var sig=stableKey||hash(kind+'|'+source+'|'+title+'|'+textOf(payload));
  if(S.seen[sig]) return S.stream.find(function(x){return x.id===S.seen[sig];})||null;
  var r={id:uid('rec'),at:new Date().toISOString(),kind:kind||'information',source:source||'unknown',
    title:title||kind||'Record',payload:payload,meta:meta||{},provenance:{source:source||'unknown',mode:(meta&&meta.mode)||'observed'}};
  S.stream.push(r); S.seen[sig]=r.id; save(); return r;
}
function keepRecord(id,reason){
  var r=S.stream.find(function(x){return x.id===id;}); if(!r)return;
  if(!S.kept.some(function(k){return k.recordId===id;})){
    S.kept.push({id:uid('keep'),recordId:id,at:new Date().toISOString(),reason:reason||'kept',snapshot:r});
    save();
  }
}
function trainingText(t){
  return [t.one_line].concat(t.intent||[],t.logic_patterns||[],t.hard_rules||[],t.verification||[],t.negative_scope||[]).join(' ');
}
function relatedTraining(r,limit){
  var q=tokens((r&&r.title||'')+' '+textOf(r&&r.payload||'')), ranked=[];
  S.training.forEach(function(t,idx){
    var hay=trainingText(t).toLowerCase(),score=0;
    q.forEach(function(w){if(hay.indexOf(w)>=0)score+=w.length>6?3:2;});
    if(score>0)ranked.push({id:t.id,source_file:t.source_file,score:score,idx:idx});
  });
  ranked.sort(function(a,b){return b.score-a.score||a.idx-b.idx;});
  return ranked.slice(0,limit||5);
}
function sendRecordToFunnel(id){
  var r=S.stream.find(function(x){return x.id===id;}); if(!r)return null;
  var existing=S.funnelInbox.find(function(k){return k.recordId===id;});
  if(existing)return existing;
  var item={id:uid('fin'),recordId:id,at:new Date().toISOString(),record:r,status:'waiting',
    training_refs:relatedTraining(r,5),training_batch_ids:S.trainingBatches.slice()};
  S.funnelInbox.push(item);
  save();
  return item;
}
function requestToFunnel(input,context,source){
  input=String(input==null?'':input);
  var r=addStream('intent',source||'MOOR.request','Request · '+(input.slice(0,72)||'empty'),{
    input:input,context:context||{}
  },{mode:'request',context:context||{},provenance:'explicit'},'request:'+hash(input+'|'+textOf(context||{})));
  if(!r)return null;
  return sendRecordToFunnel(r.id);
}
function componentRecord(id){
  var c=COMPS.find(function(x){return x.id===id;}); if(!c)return null;
  return addStream('component','Pulse',c.label,{componentId:c.id,label:c.label,short:c.short||'',job:c.job||'',cats:c.cats||[],source:c.source||'',technical:c.technical||'',toolSrc:c.toolSrc||'',page:c.page||''},
    {mode:'selected',componentId:c.id},'component:'+c.id);
}

function seedCoreConcepts(){
  addReference({id:'concept:furniture',kind:'concept',title:'furniture',summary:'Objects designed to furnish inhabited spaces.',status:'observed',source:'User/example',provenance:'explicit',data:{aliases:['furnishing','furnishings']}});
  addReference({id:'concept:couch',kind:'concept',title:'couch',summary:'A loosely defined furniture concept that may have many recipes and implementations.',status:'observed',source:'User/example',provenance:'explicit',concepts:['concept:furniture'],data:{aliases:['sofa','settee','sectional']}});
  addReference({id:'concept:chair',kind:'concept',title:'chair',summary:'A furniture concept for a primarily single-person seat.',status:'observed',source:'User/example',provenance:'explicit',concepts:['concept:furniture'],data:{aliases:['armchair','seat']}});
  addReference({id:'concept:lamp',kind:'concept',title:'lamp',summary:'A furniture/lighting concept with many procedural forms.',status:'observed',source:'User/example',provenance:'explicit',concepts:['concept:furniture'],data:{aliases:['table lamp','floor lamp','light fixture']}});
  addEdge('concept:couch','concept:furniture','instance_of','user-example');
  addEdge('concept:chair','concept:furniture','instance_of','user-example');
  addEdge('concept:lamp','concept:furniture','instance_of','user-example');
}
function syncReferenceGraph(){
  seedCoreConcepts();
  COMPS.forEach(function(c){
    var roles=(c.cats||[]).indexOf('generators')>=0?['generator']:[];
    var cr=addReference({id:'component:'+c.id,kind:'component',title:c.label||c.id,summary:c.short||c.job||'Pulse component',
      status:c.inMoor||c.in_moor?'canonical':'observed',source:'Pulse Catalog',source_id:c.id,provenance:'imported',
      roles:roles,doc_ref:c.source||c.component_source||null,implementation_ref:c.toolSrc||c.panel_source||c.page||c.component_source||null,
      data:{id:c.id,cats:c.cats||[],job:c.job||'',why:c.why||'',technical:c.technical||'',limits:c.toolGap||c.honest_limits||''}});
    if(cr.implementation_ref){
      var impl=addReference({id:'implementation:'+c.id,kind:'implementation',title:(c.label||c.id)+' implementation',
        summary:'Actual implementation reference for '+(c.label||c.id)+'.',status:cr.status,source:'Pulse Catalog',
        source_id:c.id,provenance:'imported',implementation_ref:cr.implementation_ref,doc_ref:cr.doc_ref,
        data:{component_ref:cr.id,implementation:cr.implementation_ref}});
      addEdge(impl.id,cr.id,'implements','catalog');
    }
    if(c.id==='comp-furniture'||/furniture/i.test((c.label||'')+' '+(c.job||''))){
      ['concept:furniture','concept:couch','concept:chair','concept:lamp'].forEach(function(cid){addEdge(cr.id,cid,'about','user-described-generator-territory');});
    }
    if(roles.length){
      var gr=addReference({id:'generator:'+c.id,kind:'generator',title:(c.label||c.id)+' generator',summary:c.short||c.job||'Procedural generator capability.',
        status:cr.status,source:'Pulse Catalog',source_id:c.id,provenance:'imported',doc_ref:cr.doc_ref,implementation_ref:cr.implementation_ref,
        data:{component_ref:cr.id,cats:c.cats||[]}});
      addEdge(gr.id,cr.id,'implements','catalog-role');
    }
  });
  blueprintDocs().forEach(function(b){
    addReference({id:'blueprint:'+b.id,kind:'blueprint',title:b.name,summary:b.summary,status:'specified-not-verified',
      source:'Pulse Learning Spine',source_id:b.id,provenance:'imported',doc_ref:b.source||'pulse-learning-spine-blueprints.json',data:b});
  });
  S.training.forEach(function(t){
    var tr=addReference({id:'training:'+t.id,kind:'training',title:t.source_file||t.id,summary:t.one_line||'Training record',
      status:t.implementation_status||t.status||'specified-not-verified',source:'Pulse Training',source_id:t.id,provenance:'imported',
      doc_ref:t.source_file||'pulse-training-blueprints-11.json',data:t});
    (t.hard_rules||[]).forEach(function(rule,i){
      var rr=addReference({id:'rule:'+t.id+':'+i,kind:'rule',title:(t.source_file||t.id)+' rule '+(i+1),summary:rule,
        status:'specified-not-verified',source:'Pulse Training',source_id:t.id,provenance:'imported',data:{rule:rule}});
      addEdge(rr.id,tr.id,'derived_from','training');
    });
    (t.verification||[]).forEach(function(v,i){
      var rq=addReference({id:'requirement:'+t.id+':verify:'+i,kind:'requirement',title:(t.source_file||t.id)+' verification '+(i+1),
        summary:v,status:'specified-not-verified',source:'Pulse Training',source_id:t.id,provenance:'imported',data:{verification:v}});
      addEdge(rq.id,tr.id,'derived_from','training');
    });
  });
  S.trainingLessons.forEach(function(l){
    addReference({id:'rule:lesson:'+l.id,kind:'rule',title:l.id.replace(/-/g,' '),summary:l.lesson||'',status:'observed',
      source:'Cross-file training',source_id:l.id,provenance:'inferred',data:l});
  });
  S.stream.forEach(function(r){
    var k=r.kind==='intent'?'intent':r.kind==='training'?'training':r.kind==='logic'?'recipe':r.kind==='component'?'component':'artifact';
    addReference({id:'stream:'+r.id,kind:k,title:r.title,summary:r.kind+' from '+r.source,status:'observed',
      source:r.source,source_id:r.id,provenance:(r.provenance&&r.provenance.mode)||'observed',data:r.payload});
  });
  try{
    var fs=window.PulseFunnel&&PulseFunnel.state;
    if(fs&&Array.isArray(fs.projects))fs.projects.forEach(function(p){
      var pr=addReference({id:'project:'+p.id,kind:'project',title:p.name||p.id,summary:p.description||'Pulse project',
        status:p.queued?'observed':'canonical',source:'Pulse Funnel',source_id:p.id,provenance:'imported',implementation_ref:p.page||null,data:{queued:!!p.queued}});
      (p.versions||[]).forEach(function(v){
        var vr=addReference({id:'version:'+p.id+':'+v.id,kind:'version',title:(p.name||p.id)+' '+(v.number||v.id),
          summary:v.title||v.revision||'Project version',status:v.state&&v.state.indexOf('locked')>=0?'canonical':'observed',
          source:'Pulse Funnel',source_id:v.id,provenance:'imported',data:v,version_of:pr.id});
        addEdge(vr.id,pr.id,'version_of','project-version');
      });
    });
  }catch(e){}
  try{
    var ht=JSON.parse(localStorage.getItem('moor-harness-training')||'[]');
    if(Array.isArray(ht))ht.forEach(function(x,i){
      var e=addReference({id:'evidence:harness:'+(x.v||i)+':'+hash(textOf(x)),kind:'evidence',title:'Harness evidence '+(x.v||i),
        summary:x.lesson||'Harness verification record',status:x.logic&&x.logic.status==='verified-working'?'machine-verified':'observed',
        source:'App Compiler Harness',source_id:x.v||String(i),provenance:'verified',data:x});
      if(x.request){
        var ir=addReference({id:'intent:harness:'+hash(x.request),kind:'intent',title:'Harness request '+(x.v||i),summary:x.request,
          status:x.intent&&x.intent.status==='user-reviewed'?'human-approved':'observed',source:'App Compiler Harness',
          source_id:x.v||String(i),provenance:'recovered',data:x.intent});
        addEdge(e.id,ir.id,'verifies','harness-training');
      }
    });
  }catch(e){}
}
function harvestProtocolStores(){
  try{
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(!k||k.indexOf('moor-output:')!==0)continue;
      var val=JSON.parse(localStorage.getItem(k)||'null');
      if(Array.isArray(val))val.forEach(ingestOutput);else if(val)ingestOutput(val);
    }
  }catch(e){}
}
function captureAppMessage(ev){
  var d=ev&&ev.data;
  if(!d||!(d.type==='moor:output'||d.type==='moor:reference'))return;
  var frames=Array.from(document.querySelectorAll('iframe'));
  if(!ev.source||!frames.some(function(f){return f.contentWindow===ev.source;}))return;
  if(d.type==='moor:reference')addReference(d.detail||d.reference||{});
  else ingestOutput(d.detail||d.output||{});
  save();
}

function harvestCapabilityMemory(){
  try{
    if(!window.MoorCapabilityMemory)return;
    var snap=window.MoorCapabilityMemory.snapshot();
    Object.keys(snap.bundles||{}).forEach(function(k){ingestCrystalBundle(snap.bundles[k],null);});
    Object.keys(snap.handoffs||{}).forEach(function(){});
  }catch(e){}
}
function harvest(){
  try{
    var w=JSON.parse(localStorage.getItem('moor-wonder-library-v1')||'[]');
    if(Array.isArray(w)) w.forEach(function(item,i){
      var g=item&&item.genome||item||{}, seed=g.seed||item.seed||String(i), typ=g.type||'wonder';
      addStream('asset','Wonder Feed',typ+' · '+seed,item,{mode:'procedural',app:'wonder-feed'},'wonder:'+seed+':'+typ);
      ingestOutput({id:'artifact:wonder:'+hash(typ+'|'+seed+'|'+textOf(g)),kind:'artifact',title:item.title||('Wonder '+typ+' '+seed),
        summary:item.sub||'Saved Wonder Feed procedural output.',source:{app:'wonder-feed',component:'wonder-feed'},concepts:[typ],
        recipe:g,status:'generated',provenance:'procedural',payload:item});
    });
  }catch(e){}
  try{
    var c=JSON.parse(localStorage.getItem('moor-pulse-canvas-v1')||'{}');
    var parts=c&&Array.isArray(c.parts)?c.parts:[];
    parts.forEach(function(p,i){
      var key=p&&p.id||p&&p.name||String(i);
      addStream('logic','Moor Canvas',(p&&p.name)||'Canvas part',p,{mode:'designed',app:'more-canvas'},'canvas:'+key);
      ingestOutput({id:'artifact:canvas:'+slug(key),kind:'artifact',title:(p&&p.name)||'Canvas output',
        summary:(p&&p.desc)||'Saved Moor Canvas composition.',source:{app:'more-canvas',component:'more-canvas'},
        recipe:p&&p.recipe||p,status:'generated',provenance:'procedural',payload:p,
        intent:p&&p.recipe&&p.recipe.prompt||null,intent_provenance:p&&p.recipe&&p.recipe.prompt?'explicit':'inferred'});
    });
    var versions=c&&Array.isArray(c.version)?c.version:[];
    versions.forEach(function(v,i){
      var vr=addReference({id:'version:canvas:'+(v.id||i),kind:'version',title:'Moor Canvas · '+(v.name||('slot '+(i+1))),
        summary:v.status||'Canvas version slot',status:/pending/i.test(v.status||'')?'observed':'canonical',source:'Moor Canvas',
        source_id:v.id||String(i),provenance:'procedural',data:v,version_of:'project:moor-canvas'});
      if(v.recipe){
        var rr=addReference({id:'recipe:canvas-version:'+hash(textOf(v.recipe)),kind:'recipe',title:(v.name||'Canvas version')+' recipe',
          summary:'Exact inputs for this Canvas version.',status:'generated',source:'Moor Canvas',provenance:'procedural',data:v.recipe});
        addEdge(vr.id,rr.id,'derived_from','canvas-version');
      }
    });
  }catch(e){}
  harvestCapabilityMemory();
  harvestProtocolStores();
  syncReferenceGraph();
  save();
}
function ingestTrainingBatch(doc){
  if(!doc||!doc.id||!Array.isArray(doc.records))return false;
  if(S.trainingBatches.indexOf(doc.id)>=0)return false;
  var existing={};S.training.forEach(function(x){existing[x.id]=1;});
  doc.records.forEach(function(r){
    if(existing[r.id])return;
    var x={};Object.keys(r).forEach(function(k){x[k]=r[k];});
    x.batch_id=doc.id;x.admitted_at=new Date().toISOString();x.implementation_status=r.status||'specified-not-verified';
    S.training.push(x);existing[x.id]=1;
  });
  (doc.cross_file_lessons||[]).forEach(function(l){
    if(!S.trainingLessons.some(function(x){return x.id===l.id;}))S.trainingLessons.push(l);
  });
  S.trainingBatches.push(doc.id);
  addStream('training','Pulse Training',doc.title||doc.id,
    {batch_id:doc.id,records:doc.records.length,lessons:(doc.cross_file_lessons||[]).length},
    {mode:'training-deposit',admission_policy:doc.admission_policy},'training-batch:'+doc.id);
  save();return true;
}
function loadTrainingBatches(){
  if(window.PULSE_TRAINING_BLUEPRINTS_11){
    if(ingestTrainingBatch(window.PULSE_TRAINING_BLUEPRINTS_11))ensureFunnelProject();
    return;
  }
  if(location.protocol==='file:')return;
  fetch('pulse-training-blueprints-11.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;})
    .then(function(doc){if(doc&&ingestTrainingBatch(doc)){ensureFunnelProject();if(typeof renderStage==='function')renderStage();}})
    .catch(function(){});
}

var BLUEPRINTS=[
 {id:'input',name:'Input',summary:'Human, app, and procedural interfaces enter one pipe. Preserve raw payload and provenance; never delete the source.'},
 {id:'stream',name:'Stream',summary:'Append-only arrival lane. Records stay raw and can be kept in Bin or sent to Funnel.'},
 {id:'discover',name:'Discover',summary:'Deterministically surface relevant or novel real components from recent Stream context. Discovery is not truth.'},
 {id:'bin',name:'Bin',summary:'Durable searchable inventory for every Pulse component plus kept knowledge and blueprints.'},
 {id:'funnel',name:'Funnel',summary:'Sealed v44 resolver. Page 0 is immutable; references, distill, decisions, replay, and verdict are hard-gated before execution.'}
];
var CONTRACTS=[
 {id:'harness-completion',name:'Harness Completion Invariant',
  summary:'Even garbage or incomplete input must produce the best-known candidate. Passing gates teaches logic; intent confidence is tracked separately.',
  source:'moor-harness-runtime-v1.html'},
 {id:'reference-graph',name:'Universal Reference Graph',
  summary:'Bin stores concepts, intent, recipes, artifacts, rules, failures, evidence, projects, versions, components, generators, and implementations as linked references.',
  source:'pulse-reference-graph-schema.json'},
 {id:'request-entry',name:'Universal MOOR Request Entry',
  summary:'Humans, scripts, and models enter through MOOR.request; deterministic routing chooses references or sealed Funnel resolution without requiring a key.',
  source:'FUNNEL.md'},
 {id:'sealed-funnel',name:'Sealed Funnel Execution Law',
  summary:'Build/change execution requires immutable Page 0, ordered Funnel stages, second-half replay, builder-facing obligation preservation, and a kernel-issued receipt. Harness independently verifies the receipt.',
  source:'funnel-kernel.js'}
];
var FABRIC_DOCS=[
 {id:'blueprint-farm-master',name:'MOOR Blueprint Farm',summary:'Master planning machine: open-question harvesting, parallel child blueprints, realignment, choreography, receipts and explicit slice release.',source:'blueprint/blueprint-farm.blueprint.json'},
 {id:'blueprint-farm-library',name:'Blueprint Farm Library',summary:'Machine-readable index of the farm, blueprint statuses and released/planned slices.',source:'pulse-blueprint-farm-library.json'},
 {id:'blueprint-farm-inspector',name:'Blueprint Farm Inspector',summary:'Read-only Pulse surface for inspecting Page 0, evidence, open questions, contracts, failure modes, maintenance and implementation slices.',source:'blueprint-farm.html'},
 {id:'blueprint-farm-maintenance',name:'Funnel Maintenance Modernization',summary:'Blueprint for reducing semantic/theatrical maintenance debt without weakening proven Funnel authority or output quality.',source:'blueprint/funnel-maintenance-modernization.blueprint.json'},
 {id:'blueprint-farm-twin',name:'Factory Digital Twin',summary:'Blueprint for a beautiful 3D software factory whose operational state is bound to real machine evidence.',source:'blueprint/factory-digital-twin.blueprint.json'},
 {id:'blueprint-farm-procedural',name:'Seeded Procedural Toolchain',summary:'Blueprint for generator capability resolution and deterministic seed + recipe + version + semantic-anchor reconstruction.',source:'blueprint/seeded-procedural-toolchain.blueprint.json'},
 {id:'blueprint-farm-workers',name:'Blueprint-to-Worker Orchestration',summary:'Blueprint for deliberately releasing one approved slice to scoped workers with stale-state, integration and QC boundaries.',source:'blueprint/worker-execution-orchestration.blueprint.json'},
 {id:'blueprint-farm-choreography',name:'Blueprint Farm Choreography',summary:'Storyline and dependency DAG for implementation slices; only BF-01 is currently released.',source:'blueprint/blueprint-choreography.blueprint.json'},
 {id:'beam-rebrand-blueprint',name:'Pulse Beam Rebrand',summary:'Spatial product rebrand with permanent Beam Spaces, Funnel Hall, no-loss component migration and Beam Design Law.',source:'blueprint/pulse-beam-rebrand.blueprint.json'},
 {id:'beam-shell',name:'Pulse Beam Spatial Shell',summary:'Gesture-aware Create/Funnel Hall shell with Library, Inspector and runnable tool dock.',source:'pulse-beam.js'},
 {id:'beam-design-law',name:'Beam Design Law v1',summary:'Clear component standards plus compatibility → audited → Beam-native migration ladder.',source:'pulse-beam-standards.html'},
 {id:'beam-funnel-hall',name:'Pulse Beam Funnel Hall',summary:'Permanent live 3D room generated from the current Funnel graph.',source:'pulse-beam-funnel-hall.html'},
 {id:'beam-audit',name:'Beam Readiness Audit',summary:'No-loss parity and migration readiness records for the component estate.',source:'pulse-beam-audit.js'},
 {id:'fabric-maintenance-status',name:'Funnel Maintenance Status',summary:'Machine-readable distinction between documented, implemented, wired, verified, receipt-backed and visualized state; exposes real remaining gaps.',source:'funnel-maintenance-status.json'},
 {id:'fabric-ultra-v44-migration',name:'v44 → Ultra Inheritance Matrix',summary:'Explicit migration status for old Funnel protections: native Ultra, stronger Ultra mechanism, shared/external, or remaining gap.',source:'blueprint/funnel-ultra-v44-migration.blueprint.json'},
 {id:'fabric-software-manufacturing',name:'MOOR Software Manufacturing System',summary:'Maps OBJECTIVE, HUB, Funnel, Assembly, Harness, verification, receipts, Refinery and Beam into one cumulative software production line.',source:'blueprint/software-manufacturing-system.blueprint.json'},
 {id:'fabric-grounded-readiness',name:'Grounded Readiness Law',summary:'Clear-eyed realism plus preparation: no moral exemption, optimism as readiness, bounded commitment, reciprocity and explicit stop conditions.',source:'blueprint/grounded-readiness-law.blueprint.json'},
 {id:'fabric-objective',name:'OBJECTIVE Instrument',summary:'Outside-in requirements instrument: understand the objective before naming or shaping the machine.',source:'objective.html'},
 {id:'fabric-hub',name:'HUB Kind Registry',summary:'Versioned part/KIND registry: define once, instantiate by identity + parameters, refuse incompatible contexts loudly.',source:'hub.html'},
 {id:'fabric-assembly-core',name:'Assembly Core',summary:'Deterministic software work instructions with explicit operations, dependencies, outputs, verification and rollback.',source:'moor-assembly-core.js'},
 {id:'fabric-cumulative-machinery',name:'Cumulative Capability Memory',summary:'Verified capabilities accumulate as versioned machinery; deprecation preserves identity, quarantine is explicit, and preferred routing reuses active compatible machines.',source:'moor-capability-memory.js'},
 {id:'fabric-luxe-ui',name:'Pulse Luxe Spatial UI',summary:'Shared premium spatial design law for Pulse, embedded tools and the current 3D Funnel: deep field, floating chrome, ice-white light, emerald state and mobile-safe command dock.',source:'blueprint/pulse-luxe-ui.blueprint.json'},
 {id:'fabric-luxe-law',name:'MOOR Luxe UI Law',summary:'Shared CSS/JS shell that applies the spatial visual system across Pulse and same-origin embedded tools.',source:'moor-luxe.css'},
  {
    "id": "fabric-baseline",
    "name": "Recursive Funnel Fabric",
    "summary": "Baseline recursive Funnel architecture: child cases, solver swarms, receipts, resource budgets and Foundry.",
    "source": "blueprint/funnel-fabric.blueprint.json"
  },
  {
    "id": "fabric-citadel",
    "name": "Funnel Citadel Law",
    "summary": "Parallel blueprint optimized for integrity, least authority, auditability, fault containment and safe promotion.",
    "source": "blueprint/funnel-law-citadel.blueprint.json"
  },
  {
    "id": "fabric-society",
    "name": "Funnel Society Fabric",
    "summary": "Parallel blueprint optimized for recursive scale, package ecosystems, scheduling, sharding, caching and compaction.",
    "source": "blueprint/funnel-law-society.blueprint.json"
  },
  {
    "id": "fabric-realignment",
    "name": "Citadel × Society Realignment",
    "summary": "Resolves security-versus-scale conflicts into Secure Core / Elastic Society.",
    "source": "blueprint/funnel-law-realignment.blueprint.json"
  },
  {
    "id": "fabric-ultra",
    "name": "MOOR Ultra Funnel Law",
    "summary": "Amalgamated candidate law: Secure Core / Elastic Society with typed receipts, capabilities, budgets, recursion and Pulse observability.",
    "source": "blueprint/funnel-law-ultra.blueprint.json"
  },
  {
    "id": "fabric-library",
    "name": "Funnel Fabric Pulse Library",
    "summary": "Index of the complete Funnel Fabric blueprint, law, runtime, Foundry, test and contract corpus.",
    "source": "pulse-funnel-fabric-library.json"
  },
  {
    "id": "fabric-receipts",
    "name": "Typed Receipt Core",
    "summary": "Content-addressed authority receipts for questions, ballots, consensus, child Funnels, execution, verification, learning and promotion.",
    "source": "funnel-receipt-core.js"
  },
  {
    "id": "fabric-capabilities",
    "name": "Capability Core",
    "summary": "Least-authority scoped grants; workers can act only inside explicit case/question/reference/package scope.",
    "source": "funnel-capability-core.js"
  },
  {
    "id": "fabric-budgets",
    "name": "Budget Core",
    "summary": "Conserved hierarchical envelopes for tokens, compute, storage, worker calls, parallelism, money and deadlines.",
    "source": "funnel-budget-core.js"
  },
  {
    "id": "fabric-law-core",
    "name": "Ultra Law Core",
    "summary": "Candidate deterministic authority state machine with strict ordered transitions, staleness and receipt minting.",
    "source": "funnel-law-core.js"
  },
  {
    "id": "fabric-cases",
    "name": "Recursive Case Runtime",
    "summary": "Spawns child Funnel cases from parent questions with delegated scope, capabilities and sub-budgets.",
    "source": "funnel-case-runtime.js"
  },
  {
    "id": "fabric-solver",
    "name": "Sebastian Solver Core",
    "summary": "Independent open-ended solution ballots framed as direct questions from Sebastian; agreement raises labeled synthetic confidence.",
    "source": "sebastian-solver-core.js"
  },
  {
    "id": "fabric-consensus",
    "name": "Consensus Core",
    "summary": "Keeps owner evidence, solver convergence and verification confidence distinct while preserving dissent.",
    "source": "funnel-consensus-core.js"
  },
  {
    "id": "fabric-society-runtime",
    "name": "Funnel Society Runtime",
    "summary": "Plans solver swarms, convergence and recursive branching from configurable scale parameters.",
    "source": "funnel-society-core.js"
  },
  {
    "id": "fabric-packages",
    "name": "Funnel Package Registry",
    "summary": "Immutable versioned declarative system packages with compatibility and scoped reuse.",
    "source": "funnel-package-registry.js"
  },
  {
    "id": "fabric-promotion",
    "name": "Promotion Core",
    "summary": "Candidate → regression-tested → owner-approved → promoted law lifecycle with rollback target.",
    "source": "funnel-promotion-core.js"
  },
  {
    "id": "fabric-resources",
    "name": "Resource Governor",
    "summary": "Forecasts case count, worker calls, receipts, tokens, storage and cost with green/yellow/red pressure.",
    "source": "funnel-resource-governor.js"
  },
  {
    "id": "fabric-foundry",
    "name": "Funnel Foundry Core",
    "summary": "Procedural topology generator for packages, redundancy, symmetry and experimental Funnel ecosystems.",
    "source": "funnel-foundry-core.js"
  },
  {
    "id": "fabric-environment",
    "name": "Funnel 3D Environment",
    "summary": "Interactive finite node/edge/cone renderer for inspecting and tracing Funnel relationships.",
    "source": "funnel-environment.html"
  },
  {
    "id": "fabric-meta-receipt",
    "name": "Ultra Funnel Meta-Run",
    "summary": "Executable test that routes the amalgamated Ultra Funnel blueprint through the sealed v44 kernel and verifies its receipt.",
    "source": "tests/funnel-law-ultra-meta-run.cjs"
  },
  {
    "id": "fabric-tests",
    "name": "Ultra Funnel Adversarial Checks",
    "summary": "Invariant tests for receipts, capabilities, budgets, child cases, consensus, scale, staleness, packages and promotion.",
    "source": "tests/funnel-law-ultra-checks.cjs"
  }
];
var REFINERY_DOCS=[
 {id:'creation-deck-blueprint',name:'Pulse Creation Deck',summary:'Screenshot-led spatial workspace with floating app deck, slide-over component library, progressive inspector, universal command and measured Refinery reuse.',source:'blueprint/pulse-creation-deck.blueprint.json'},
 {id:'creation-deck-runtime',name:'Pulse Creation Deck Runtime',summary:'Shell runtime that wraps existing components without changing their internals.',source:'pulse-creation-deck.js'},
 {id:'creation-deck-style',name:'Pulse Creation Deck Layout',summary:'Near-black floating spatial hierarchy based heavily on the supplied unloaded-screen reference.',source:'pulse-creation-deck.css'},
 {id:'refinery-stats',name:'Refinery Use Telemetry',summary:'Live proof surface for capability handoffs consumed, model-free assemblies, verified compositions and repeated reasoning avoided.',source:'pulse-capability-memory.html'},
 {id:'refinery-blueprint',name:'MOOR Refinery',summary:'Parallel non-authoritative filter that crystallizes blueprints/builds into deterministic assembly contracts, verified capability deltas, compact learning and candidate compositions.',source:'blueprint/moor-refinery.blueprint.json'},
 {id:'refinery-assembly',name:'Assembly Core',summary:'Executes versioned AssemblyContracts without an LLM and fails explicitly when an executor is missing.',source:'moor-assembly-core.js'},
 {id:'refinery-core',name:'Refinery Core',summary:'Converts outputs and BLUEPRINT_READY events into Crystal Bundles.',source:'moor-capability-refinery.js'},
 {id:'refinery-memory',name:'Capability Memory',summary:'Cumulative typed graph of versioned verified capabilities, assembly contracts, adapters and candidate/verified compositions. Deprecated machines remain addressable; quarantined machines leave normal routing.',source:'moor-capability-memory.js'},
 {id:'refinery-handoff',name:'Funnel Capability Handoff',summary:'Reference-only bridge from verified Refinery capability deltas into the singular Funnel reference lane.',source:'funnel-capability-handoff.js'},
 {id:'refinery-ui',name:'Capability Memory UI',summary:'Pulse surface for inspecting crystals, capabilities, candidates, missing executors and handoffs.',source:'pulse-capability-memory.html'}
];
function blueprintDocs(){return BLUEPRINTS.concat(CONTRACTS,FABRIC_DOCS,REFINERY_DOCS);}

function ensureFunnelProject(){
  try{
    if(!window.PulseFunnel||!PulseFunnel.state||!Array.isArray(PulseFunnel.state.projects))return;
    var fs=PulseFunnel.state, now=new Date().toISOString();
    var members=blueprintDocs().map(function(b){
      var isContract=CONTRACTS.some(function(c){return c.id===b.id;});
      return {kind:isContract?'architecture-contract':'architecture',
      ref:(isContract?'contract-':'spine-')+b.id,label:b.name,
      sourceVersion:b.id==='funnel'?'v44-sealed':'v1',
      source:isContract&&b.source?b.source:'pulse-learning-spine-blueprints.json',detail:b.summary};});
    var p=fs.projects.find(function(x){return x.id==='learning-spine';});
    if(!p){
      p={id:'learning-spine',name:'Pulse Learning Spine',icon:'◇',
        description:'Input → Stream → Discover → Bin → Funnel, plus downstream compiler contracts. Existing Pulse data remains intact.',
        members:members,page:'pulse-dashboard.html',queued:false,versions:[{id:'spine-v1',number:'v1',title:'Funnel blueprint build',state:'locked-import',createdAt:now,parentId:null,revision:'',
          items:members.filter(function(x){return x.ref!=='contract-harness-completion';}).map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=false;y.change='baseline';return y;})}]};
      fs.projects.push(p);
    }
    var hasTraining=(p.versions||[]).some(function(v){return v.id==='spine-v3-training-11';});
    if(!hasTraining&&S.trainingBatches.indexOf('training-20261005-blueprint-11')>=0){
      var trainMembers=S.training.map(function(t){return {kind:'training-source',ref:'training-'+t.id,label:t.source_file||t.id,
        sourceVersion:'blueprint',source:'pulse-training-blueprints-11.json',detail:t.one_line||''};});
      p.members=p.members||[];
      trainMembers.forEach(function(tm){if(!p.members.some(function(x){return x.ref===tm.ref;}))p.members.push(tm);});
      p.versions=p.versions||[];
      p.versions.push({id:'spine-v3-training-11',number:'v3',title:'11 blueprint training pass',state:'locked-import',createdAt:now,
        parentId:p.versions.length?p.versions[p.versions.length-1].id:null,
        revision:'Admitted blueprint intent, rules, failures, and verification contracts. Implementation logic stays specified-not-verified until real gates pass.',
        items:p.members.map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=x.kind!=='training-source';y.change=x.kind==='training-source'?'new':'inherited';return y;})});
    }
    var hasContract=(p.members||[]).some(function(x){return x.ref==='contract-harness-completion';});
    if(!hasContract){
      var contract=members.find(function(x){return x.ref==='contract-harness-completion';});
      p.members=(p.members||[]).concat([contract]);
      p.versions=p.versions||[];
      p.versions.push({id:'spine-v2-harness-completion',number:'v2',title:'Harness completion invariant',state:'locked-import',createdAt:now,
        parentId:p.versions.length?p.versions[p.versions.length-1].id:null,revision:'Separate verified logic from intent confidence; always attempt a gated candidate.',
        items:(p.members||[]).map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=x.ref!=='contract-harness-completion';y.change=x.ref==='contract-harness-completion'?'new':'inherited';return y;})});
    }
    var hasRefGraph=(p.members||[]).some(function(x){return x.ref==='contract-reference-graph';});
    if(!hasRefGraph){
      var rg=members.find(function(x){return x.ref==='contract-reference-graph';});
      if(rg){
        p.members=p.members||[];p.members.push(rg);p.versions=p.versions||[];
        var nums=p.versions.map(function(v){return parseInt(String(v.number||'').replace(/\D/g,''),10);}).filter(Number.isFinite);
        var vn='v'+((nums.length?Math.max.apply(null,nums):0)+1);
        p.versions.push({id:'spine-reference-graph-'+Date.now(),number:vn,title:'Universal reference graph',state:'locked-import',createdAt:now,
          parentId:p.versions.length?p.versions[p.versions.length-1].id:null,
          revision:'Bin now stores concepts, recipes, artifacts, rules, failures, evidence, projects, versions, generators, components, implementations, and training as linked references; app/project outputs feed it with provenance.',
          items:p.members.map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=x.ref!=='contract-reference-graph';y.change=x.ref==='contract-reference-graph'?'new':'inherited';return y;})});
      }
    }
    var hasRequestEntry=(p.members||[]).some(function(x){return x.ref==='contract-request-entry';});
    if(!hasRequestEntry){
      var re=members.find(function(x){return x.ref==='contract-request-entry';});
      if(re){
        p.members=p.members||[];p.members.push(re);p.versions=p.versions||[];
        var rnums=p.versions.map(function(v){return parseInt(String(v.number||'').replace(/\D/g,''),10);}).filter(Number.isFinite);
        var rvn='v'+((rnums.length?Math.max.apply(null,rnums):0)+1);
        p.versions.push({id:'spine-request-entry-'+Date.now(),number:rvn,title:'Universal MOOR request entry',state:'locked-import',createdAt:now,
          parentId:p.versions.length?p.versions[p.versions.length-1].id:null,
          revision:'One zero-key MOOR.request doorway now routes reference lookup, navigation, unresolved decisions, and resolved execution; agents read FUNNEL.md and do not use the human bar.',
          items:p.members.map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=x.ref!=='contract-request-entry';y.change=x.ref==='contract-request-entry'?'new':'inherited';return y;})});
      }
    }
    var hasSealed=(p.members||[]).some(function(x){return x.ref==='contract-sealed-funnel';});
    if(!hasSealed){
      var sf=members.find(function(x){return x.ref==='contract-sealed-funnel';});
      if(sf){
        p.members=p.members||[];p.members.push(sf);p.versions=p.versions||[];
        var snums=p.versions.map(function(v){return parseInt(String(v.number||'').replace(/\D/g,''),10);}).filter(Number.isFinite);
        var svn='v'+((snums.length?Math.max.apply(null,snums):0)+1);
        p.versions.push({id:'spine-sealed-funnel-'+Date.now(),number:svn,title:'Sealed Funnel execution law',state:'locked-import',createdAt:now,
          parentId:p.versions.length?p.versions[p.versions.length-1].id:null,
          revision:'Execution authority moved out of model personality and into a deterministic receipt-gated Funnel Kernel with immutable Page 0 replay.',
          items:p.members.map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=x.ref!=='contract-sealed-funnel';y.change=x.ref==='contract-sealed-funnel'?'new':'inherited';return y;})});
      }
    }
    try{localStorage.setItem('moor-pulse-funnel-projects-v1',JSON.stringify(fs));}catch(e){}
  }catch(e){}
}


function ensureFunnelFabricProject(){
  try{
    if(!window.PulseFunnel||!PulseFunnel.state||!Array.isArray(PulseFunnel.state.projects))return;
    var fs=PulseFunnel.state,now=new Date().toISOString(),p=fs.projects.find(function(x){return x.id==='funnel-fabric';});
    var members=FABRIC_DOCS.map(function(b){return {kind:'funnel-fabric-asset',ref:'fabric-'+b.id,label:b.name,sourceVersion:'ultra-v1-candidate',source:b.source,detail:b.summary};});
    if(!p){
      p={id:'funnel-fabric',name:'Funnel Fabric',icon:'⌬',
        description:'Secure Core / Elastic Society inside Pulse Beam. Funnel Hall is the permanent spatial observatory; blueprints, law modules, Foundry, receipts, tests and promotion evidence remain attached.',
        members:members,page:'pulse-beam-funnel-hall.html',queued:false,versions:[{
          id:'funnel-fabric-ultra-v1-candidate',number:'v1',title:'Ultra Funnel Law candidate',state:'candidate',createdAt:now,parentId:null,
          revision:'Parallel Citadel + Society blueprints realigned into Secure Core / Elastic Society. Candidate law is receipt-gated and remains beside v44 until promotion.',
          items:members.map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=false;y.change='new';return y;})
        }]};
      fs.projects.push(p);
    }else{
      p.members=p.members||[];
      members.forEach(function(m){if(!p.members.some(function(x){return x.ref===m.ref;}))p.members.push(m);});
      p.page='pulse-beam-funnel-hall.html';p.queued=false;
      p.description='Secure Core / Elastic Society. Blueprints, law modules, recursive solver/case runtime, Foundry, receipts, tests and promotion evidence live here.';
      p.versions=p.versions||[];
      if(!p.versions.some(function(v){return v.id==='funnel-fabric-ultra-v1-candidate';})){
        p.versions.push({id:'funnel-fabric-ultra-v1-candidate',number:'v1',title:'Ultra Funnel Law candidate',state:'candidate',createdAt:now,
          parentId:p.versions.length?p.versions[p.versions.length-1].id:null,
          revision:'Parallel Citadel + Society blueprints realigned into Secure Core / Elastic Society. Candidate law is receipt-gated and remains beside v44 until promotion.',
          items:p.members.map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=x.kind!=='funnel-fabric-asset';y.change=x.kind==='funnel-fabric-asset'?'new':'inherited';return y;})});
      }
    }
    try{localStorage.setItem('moor-pulse-funnel-projects-v1',JSON.stringify(fs));}catch(e){}
  }catch(e){}
}

function ensureCapabilityMemoryProject(){
  try{
    if(!window.PulseFunnel||!PulseFunnel.state||!Array.isArray(PulseFunnel.state.projects))return;
    var fs=PulseFunnel.state,now=new Date().toISOString(),p=fs.projects.find(function(x){return x.id==='capability-memory';});
    var members=REFINERY_DOCS.map(function(b){return {kind:'refinery-asset',ref:'refinery-'+b.id,label:b.name,sourceVersion:'v1',source:b.source,detail:b.summary};});
    if(!p){
      p={id:'capability-memory',name:'MOOR Refinery',icon:'◇',
        description:'Parallel capability filter. Crystallizes blueprints/builds into model-free assembly contracts and verified capability memory, then hands reference-only deltas to the singular Funnel.',
        members:members,page:'pulse-capability-memory.html',queued:false,versions:[{id:'refinery-v1',number:'v1',title:'Parallel Refinery',state:'candidate',createdAt:now,parentId:null,
          revision:'Separate non-authoritative capability crystallization from Funnel authority. Verified deltas hand off through the reference graph.',
          items:members.map(function(x){var y={};Object.keys(x).forEach(function(k){y[k]=x[k];});y.inherited=false;y.change='new';return y;})}]};
      fs.projects.push(p);
    }else{
      p.members=p.members||[];members.forEach(function(m){if(!p.members.some(function(x){return x.ref===m.ref;}))p.members.push(m);});
      p.page='pulse-capability-memory.html';p.queued=false;
    }
    try{localStorage.setItem('moor-pulse-funnel-projects-v1',JSON.stringify(fs));}catch(e){}
  }catch(e){}
}

function allVisibleComps(){
  return COMPS.filter(function(c){return typeof shownComp==='function'?shownComp(c):true;});
}
function tokens(s){
  var stop={the:1,and:1,for:1,with:1,that:1,this:1,from:1,into:1,your:1,you:1,are:1,was:1,have:1,has:1,just:1,want:1,make:1};
  return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(function(w){return w.length>2&&!stop[w];});
}
function latestContext(){
  for(var i=S.stream.length-1;i>=0;i--){
    var r=S.stream[i]; if(r.kind!=='system') return r;
  }
  return null;
}
function discoveries(){
  var ctx=latestContext(), ts=tokens(ctx?ctx.title+' '+textOf(ctx.payload):'');
  var comps=allVisibleComps(), scored=[];
  comps.forEach(function(c,idx){
    var hay=((c.label||'')+' '+(c.short||'')+' '+(c.job||'')+' '+(c.cats||[]).join(' ')).toLowerCase(), score=0;
    ts.forEach(function(t){ if(hay.indexOf(t)>=0) score+=t.length>5?3:2; });
    if(c.recommended) score+=0.2;
    scored.push({c:c,score:score,idx:idx});
  });
  scored.sort(function(a,b){return b.score-a.score||a.idx-b.idx;});
  var hit=scored.filter(function(x){return x.score>0;}).slice(0,10);
  if(hit.length<6){
    var used={}; hit.forEach(function(x){used[x.c.id]=1;});
    var fallback=[];
    if(window.Smart&&Smart.recommend){
      try{fallback=Smart.recommend(10,function(c){return allVisibleComps().indexOf(c)>=0;})||[];}catch(e){}
    }
    fallback.concat(['wonder-feed','more-canvas','render-studio','moor-beta','rust-intent-compiler','component-distiller'])
      .forEach(function(id){
        if(hit.length>=10||used[id])return;
        var c=COMPS.find(function(x){return x.id===id;});
        if(c){hit.push({c:c,score:0,idx:0});used[id]=1;}
      });
  }
  return {context:ctx,items:hit};
}

function quickInput(label){
  return '<div class="ps-compose"><input id="ps-quick" type="text" autocomplete="off" placeholder="'+esc2(label||'Put anything into Stream…')+'">'+
    '<button class="ps-primary" data-spine-send>Send</button></div>';
}
function recordRow(r){
  return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(r.title)+'</strong>'+
    '<span>'+esc2(r.kind)+' · '+esc2(r.source)+'</span></div><div class="ps-actions">'+
    '<button data-spine-keep="'+esc2(r.id)+'">Keep</button><button data-spine-funnel="'+esc2(r.id)+'">Funnel</button></div></div>';
}
function inputView(){
  harvest();
  var ids=['project-pulse','more-canvas','stream','wonder-feed'], cards=ids.map(function(id){return COMPS.find(function(c){return c.id===id;});}).filter(Boolean);
  var gens=COMPS.filter(function(c){return Array.isArray(c.cats)&&c.cats.indexOf('generators')>=0;});
  return '<div class="ps-head"><h2>Input</h2><p>Different interfaces. Same pipe.</p></div>'+quickInput('Type or paste anything…')+
    '<div class="ps-grid">'+cards.map(function(c){return '<button class="ps-card" data-open="'+esc2(c.id)+'"><b>'+esc2(c.label)+'</b><span>'+esc2(c.short||c.job||'')+'</span></button>';}).join('')+
    '<div class="ps-card ps-card-static"><b>Procedural Generators</b><span>'+gens.length+' generator components feed the same Stream as human input.</span>'+
      '<details><summary>Open generators</summary><div class="ps-mini">'+gens.map(function(c){return '<button data-open="'+esc2(c.id)+'">'+esc2(c.label)+'</button>';}).join('')+'</div></details></div></div>';
}
function streamView2(){
  harvest();
  var rows=S.stream.slice().reverse().slice(0,80);
  return '<div class="ps-head"><h2>Stream</h2><p>Everything arrives here before it is judged.</p></div>'+quickInput('Ramble, paste logic, describe a result…')+
    '<div class="ps-kicker">'+S.stream.length+' records · raw source preserved</div>'+
    '<div class="ps-rows">'+(rows.length?rows.map(recordRow).join(''):'<div class="ps-empty">Nothing has entered the Stream yet.</div>')+'</div>';
}
function discoverView2(){
  harvest();
  var d=discoveries(), ctx=d.context;
  return '<div class="ps-head"><h2>Discover</h2><p>Relevant real things, not invented answers.</p></div>'+
    '<div class="ps-context">'+(ctx?'Using recent Stream context: <b>'+esc2(ctx.title)+'</b>':'No Stream context yet — showing useful starting points.')+'</div>'+
    '<div class="ps-rows">'+d.items.map(function(x){
      var c=x.c;
      return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(c.label)+'</strong><span>'+esc2(c.short||c.job||'')+'</span></div>'+
        '<div class="ps-actions"><button data-open="'+esc2(c.id)+'">Open</button><button data-spine-comp-funnel="'+esc2(c.id)+'">Funnel</button></div></div>';
    }).join('')+'</div>';
}
function binView2(){
  harvest();
  var q=(window.PulseSpine&&PulseSpine.query||'').trim().toLowerCase();
  var uf=window.PulseDatasets&&PulseDatasets.ultraFeedback||null,ufs=uf?uf.state:null;
  var comps=allVisibleComps().filter(function(c){
    if(!q)return true;
    if(window.Smart&&Smart.matches){try{return Smart.matches(c,q,((c.label||'')+' '+(c.short||'')));}catch(e){}}
    return ((c.label||'')+' '+(c.short||'')+' '+(c.job||'')).toLowerCase().indexOf(q)>=0;
  });
  var kept=S.kept.filter(function(k){return !q||textOf(k.snapshot).toLowerCase().indexOf(q)>=0;});
  var records=S.stream.filter(function(r){return !q||textOf(r).toLowerCase().indexOf(q)>=0;});
  var training=S.training.filter(function(t){return !q||trainingText(t).toLowerCase().indexOf(q)>=0||(t.source_file||'').toLowerCase().indexOf(q)>=0;});
  var refs=searchReferences(q,{limit:q?220:120});
  var kindCounts={};S.refs.forEach(function(r){kindCounts[r.kind]=(kindCounts[r.kind]||0)+1;});
  var bps=blueprintDocs().filter(function(b){return !q||(b.name+' '+b.summary).toLowerCase().indexOf(q)>=0;});
  return '<div class="ps-head"><h2>Bin</h2><p>Everything stays addressable.</p></div>'+
    '<div class="ps-compose ps-search"><input id="ps-bin-search" type="search" value="'+esc2(q)+'" placeholder="Search everything…"></div>'+
    '<section class="ps-section ps-backing"><h3>Backing</h3><div class="ps-backing-grid">'+
      '<div><strong>GitHub</strong><span>'+esc2(BIN_GITHUB_PATH)+'</span></div>'+
      '<div><strong>Local</strong><span>'+esc2(BIN_LOCAL_DIR)+'/ · '+esc2(binBacking.local)+(binBacking.lastSync?' · '+esc2(binBacking.lastSync):'')+'</span></div>'+
    '</div><div class="ps-actions"><button data-bin-sync>Sync local now</button>'+
      (window.showDirectoryPicker?'<button data-bin-mirror>Mirror to device folder</button>':'')+
    '</div>'+(binBacking.error?'<p class="ps-back-error">'+esc2(binBacking.error)+'</p>':'')+'</section>'+
    (uf?'<section class="ps-section ps-backing"><h3>Dataset training</h3><div class="ps-backing-grid"><div><strong>UltraFeedback</strong><span>'+esc2(ufs&&ufs.status||'not-local')+(ufs&&ufs.rows?' · '+ufs.rows+' rows':'')+'</span></div><div><strong>Local dataset</strong><span>moor-bin/datasets/ultrafeedback/ · ~940 MB raw</span></div></div><div class="ps-actions">'+((ufs&&ufs.status==='pulling')?'<button disabled>Pulling…</button>':'<button data-ultrafeedback-pull>Pull full dataset local</button>')+'</div>'+(ufs&&ufs.error?'<p class="ps-back-error">'+esc2(ufs.error)+'</p>':'')+'</section>':'')+
    '<section class="ps-section"><h3>Reference graph · '+S.refs.length+' refs · '+S.edges.length+' links</h3><div class="ps-ref-kinds">'+Object.keys(kindCounts).sort().map(function(k){return '<span>'+esc2(k)+' '+kindCounts[k]+'</span>';}).join('')+'</div><div class="ps-rows">'+refs.map(function(r){return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(r.title)+'</strong><span>'+esc2(r.kind)+' · '+esc2(r.status)+' · '+esc2(r.source)+'</span></div><div class="ps-actions"><button data-spine-ref="'+esc2(r.id)+'">View</button></div></div>';}).join('')+'</div></section>'+    '<section class="ps-section"><h3>Blueprints</h3><div class="ps-rows">'+bps.map(function(b){return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(b.name)+'</strong><span>'+esc2(b.summary)+'</span></div><div class="ps-actions"><button data-spine-blueprint="'+b.id+'">View</button></div></div>';}).join('')+'</div></section>'+
    (training.length?'<section class="ps-section"><h3>Training · '+training.length+'</h3><div class="ps-rows">'+training.map(function(t){return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(t.source_file||t.id)+'</strong><span>'+esc2(t.one_line||'training record')+' · '+esc2(t.implementation_status||t.status||'specified')+'</span></div><div class="ps-actions"><button data-spine-training="'+esc2(t.id)+'">View</button></div></div>';}).join('')+'</div></section>':'')+
    (kept.length?'<section class="ps-section"><h3>Kept</h3><div class="ps-rows">'+kept.slice().reverse().map(function(k){return recordRow(k.snapshot);}).join('')+'</div></section>':'')+
    (records.length?'<details class="ps-section ps-all"><summary>Stream records · '+records.length+'</summary><div class="ps-rows">'+records.slice().reverse().map(recordRow).join('')+'</div></details>':'')+
    '<section class="ps-section"><h3>Components</h3><div class="ps-rows">'+comps.map(function(c){return '<div class="ps-row"><div class="ps-row-main"><strong>'+esc2(c.label)+'</strong><span>'+esc2(c.short||c.job||c.source||'component')+'</span></div><div class="ps-actions"><button data-open="'+esc2(c.id)+'">Open</button><button data-spine-comp-funnel="'+esc2(c.id)+'">Funnel</button></div></div>';}).join('')+'</div></section>';
}

var oldTabView=window.tabView||tabView;
window.tabView=tabView=function(tab){
  if(tab==='input')return inputView();
  if(tab==='stream')return streamView2();
  if(tab==='discover')return discoverView2();
  if(tab==='bin')return binView2();
  return oldTabView(tab);
};

TABS=[
  {id:'stream',name:'Stream',icon:'≋',tag:'Everything entering MOOR.'},
  {id:'discover',name:'Discover',icon:'◇',tag:'Find what matters next.'},
  {id:'bin',name:'Bin',icon:'▧',tag:'Everything reusable.'},
  {id:'input',name:'Input',icon:'＋',tag:'Human and procedural interfaces.'}
];
if(typeof UI!=='undefined'){
  if(UI.tab==='you')UI.tab='input';
  if(UI.fromTab==='you')UI.fromTab='input';
  if(['stream','discover','bin','input'].indexOf(UI.tab)<0)UI.tab='stream';
}

var prevEnsure=ensureTabbar;
ensureTabbar=function(){
  prevEnsure();
  var bar=document.getElementById('tabbar'); if(!bar)return;
  var funnel=bar.querySelector('[data-tab="workspace"]'), input=bar.querySelector('[data-tab="input"]');
  if(funnel&&input&&funnel.nextSibling!==input) bar.insertBefore(funnel,input);
  bar.querySelectorAll('button').forEach(function(b){
    var tx=b.querySelector('span:not(.tb-ic)');
    if(tx){tx.style.display='inline';tx.style.visibility='visible';tx.style.opacity='1';}
    b.setAttribute('title',tx?tx.textContent.trim():'');
  });
};

function showReference(id){
  var r=S.refs.find(function(x){return x.id===id;});if(!r)return;
  var old=document.getElementById('ps-modal');if(old)old.remove();
  var rel=S.edges.filter(function(e){return e.from===id||e.to===id;}).slice(0,40);
  var m=document.createElement('div');m.id='ps-modal';
  m.innerHTML='<div class="ps-modal-card ps-train-card"><button class="ps-x" data-spine-close>×</button>'+
    '<div class="ps-head"><h2>'+esc2(r.title)+'</h2><p>'+esc2(r.kind)+' · '+esc2(r.status)+'</p></div>'+
    '<p class="ps-blue">'+esc2(r.summary||'')+'</p>'+
    '<div class="ps-ref-meta"><span>'+esc2(r.id)+'</span><span>'+esc2(r.source)+'</span><span>'+esc2(r.provenance)+'</span></div>'+
    (r.doc_ref?'<h3>Readable source</h3><p>'+esc2(r.doc_ref)+'</p>':'')+
    (r.implementation_ref?'<h3>Implementation</h3><p>'+esc2(r.implementation_ref)+'</p>':'')+
    (rel.length?'<h3>Relationships</h3><ul>'+rel.map(function(e){var other=e.from===id?e.to:e.from;return '<li>'+esc2(e.type)+' → '+esc2(other)+'</li>';}).join('')+'</ul>':'')+
    '<h3>Markdown projection</h3><pre class="ps-ref-pre">'+esc2(refMarkdown(r))+'</pre></div>';
  document.body.appendChild(m);
}
function showTraining(id){
  var t=S.training.find(function(x){return x.id===id;});if(!t)return;
  var old=document.getElementById('ps-modal');if(old)old.remove();
  function group(name,a){return a&&a.length?'<h3>'+esc2(name)+'</h3><ul>'+a.map(function(x){return '<li>'+esc2(x)+'</li>';}).join('')+'</ul>':'';}
  var m=document.createElement('div');m.id='ps-modal';
  m.innerHTML='<div class="ps-modal-card ps-train-card"><button class="ps-x" data-spine-close>×</button><div class="ps-head"><h2>'+esc2(t.source_file||t.id)+'</h2><p>'+esc2(t.implementation_status||t.status||'specified')+'</p></div>'+
    '<p class="ps-blue">'+esc2(t.one_line||'')+'</p>'+group('Intent',t.intent)+group('Logic patterns',t.logic_patterns)+group('Hard rules',t.hard_rules)+group('Verification',t.verification)+group('Negative scope',t.negative_scope)+
    '<a class="ps-link" href="pulse-training-blueprints-11.json" target="_blank" rel="noopener">Training batch ↗</a></div>';
  document.body.appendChild(m);
}
function showBlueprint(id){
  var b=blueprintDocs().find(function(x){return x.id===id;}); if(!b)return;
  var old=document.getElementById('ps-modal'); if(old)old.remove();
  var m=document.createElement('div');m.id='ps-modal';
  m.innerHTML='<div class="ps-modal-card"><button class="ps-x" data-spine-close>×</button><div class="ps-head"><h2>'+esc2(b.name)+'</h2><p>Locked learning-spine blueprint</p></div><p class="ps-blue">'+esc2(b.summary)+'</p><a class="ps-link" href="pulse-learning-spine-blueprints.json" target="_blank" rel="noopener">Full blueprint ↗</a></div>';
  document.body.appendChild(m);
}
function decorateFunnel(){
  var top=document.querySelector('.pf-shell .pf-top'); if(!top)return;
  var badge=top.querySelector('.ps-funnel-badge');
  if(!badge){badge=document.createElement('button');badge.className='ps-funnel-badge';badge.dataset.spineInbox='1';top.appendChild(badge);}
  // This runs from a subtree observer: unchanged DOM must stay untouched.
  var label='Inbox '+S.funnelInbox.length;
  if(badge.textContent!==label)badge.textContent=label;
  var panel=document.querySelector('.pf-shell .ps-funnel-panel');
  if(panel){
    var markup='<div class="ps-funnel-panel-head"><b>Funnel inbox</b><button data-spine-hide-inbox>×</button></div>'+
      (S.funnelInbox.length?S.funnelInbox.slice().reverse().map(function(x){return '<div class="ps-funnel-item"><strong>'+esc2(x.record.title)+'</strong><span>'+esc2(x.record.kind)+' · '+esc2(x.record.source)+(x.training_refs&&x.training_refs.length?' · '+x.training_refs.length+' training refs':'')+'</span></div>';}).join(''):'<div class="ps-empty">Nothing waiting.</div>');
    if(panel._pulseInboxMarkup!==markup){
      panel._pulseInboxMarkup=markup;
      panel.innerHTML=markup;
    }
  }
}
function toggleInbox(show){
  var shell=document.querySelector('.pf-shell'); if(!shell)return;
  var p=shell.querySelector('.ps-funnel-panel');
  if(!p){p=document.createElement('div');p.className='ps-funnel-panel';var layout=shell.querySelector('.pf-layout');shell.insertBefore(p,layout||null);}
  p.style.display=show===false?'none':'block';decorateFunnel();
}

var mo=new MutationObserver(function(){ if(document.body.classList.contains('pw-active'))decorateFunnel(); });
mo.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

document.addEventListener('click',function(e){
  var send=e.target.closest('[data-spine-send]');
  if(send){
    var inp=document.getElementById('ps-quick'),v=inp&&inp.value.trim(); if(!v)return;
    addStream('intent','You',v,v,{mode:'human'});
    if(inp)inp.value='';
    if(typeof renderStage==='function')renderStage();
    return;
  }
  var k=e.target.closest('[data-spine-keep]'); if(k){keepRecord(k.dataset.spineKeep,'manual keep');if(typeof renderStage==='function')renderStage();return;}
  var f=e.target.closest('[data-spine-funnel]'); if(f){sendRecordToFunnel(f.dataset.spineFunnel);decorateFunnel();return;}
  var cf=e.target.closest('[data-spine-comp-funnel]'); if(cf){var r=componentRecord(cf.dataset.spineCompFunnel);if(r)sendRecordToFunnel(r.id);decorateFunnel();return;}
  var bp=e.target.closest('[data-spine-blueprint]'); if(bp){showBlueprint(bp.dataset.spineBlueprint);return;}
  var tr=e.target.closest('[data-spine-training]'); if(tr){showTraining(tr.dataset.spineTraining);return;}
  var rf=e.target.closest('[data-spine-ref]'); if(rf){showReference(rf.dataset.spineRef);return;}
  if(e.target.closest('[data-bin-sync]')){syncLocalBinNow(true).then(function(){if(typeof renderStage==='function')renderStage();});return;}
  if(e.target.closest('[data-bin-mirror]')){chooseLocalBinMirror().then(function(){if(typeof renderStage==='function')renderStage();}).catch(function(err){binBacking.error=String(err&&err.message||err);if(typeof renderStage==='function')renderStage();});return;}
  if(e.target.closest('[data-ultrafeedback-pull]')){
    var uf=window.PulseDatasets&&PulseDatasets.ultraFeedback;
    if(uf)uf.pullLocal(function(){if(typeof renderStage==='function'&&typeof UI!=='undefined'&&UI.tab==='bin')renderStage();})
      .then(function(){if(typeof renderStage==='function')renderStage();})
      .catch(function(){if(typeof renderStage==='function')renderStage();});
    return;
  }
  if(e.target.closest('[data-spine-close]')){var m=document.getElementById('ps-modal');if(m)m.remove();return;}
  if(e.target.closest('[data-spine-inbox]')){toggleInbox(true);return;}
  if(e.target.closest('[data-spine-hide-inbox]')){toggleInbox(false);return;}
});
window.addEventListener('moor:spine-input',function(e){
  var d=e&&e.detail||{};
  addStream(d.kind||'information',d.source||'App',d.title||d.kind||'Input',d.payload!=null?d.payload:d,d.meta||{mode:'app'},d.stableKey||null);
});
window.addEventListener('moor:output',function(e){if(e&&e.detail)ingestOutput(e.detail);});
window.addEventListener('moor:capability-memory',function(e){if(e&&e.detail&&e.detail.bundle){ingestCrystalBundle(e.detail.bundle,null);save();}});
window.addEventListener('moor:reference',function(e){if(e&&e.detail){addReference(e.detail);save();}});
window.addEventListener('message',captureAppMessage);
window.addEventListener('storage',function(e){
  if(!e||!e.key)return;
  if(e.key.indexOf('moor-output:')===0||e.key==='moor-wonder-library-v1'||e.key==='moor-pulse-canvas-v1'||e.key==='moor-harness-training')harvest();
});
window.addEventListener('moor:dataset-status',function(){if(typeof renderStage==='function'&&typeof UI!=='undefined'&&UI.tab==='bin')renderStage();});
window.addEventListener('focus',function(){harvest();});
document.addEventListener('visibilitychange',function(){if(!document.hidden)harvest();});

document.addEventListener('input',function(e){
  if(e.target&&e.target.id==='ps-bin-search'){
    window.PulseSpine.query=e.target.value;
    var pos=e.target.selectionStart;
    if(typeof renderStage==='function')renderStage();
    var n=document.getElementById('ps-bin-search');if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(x){}}
  }
});

var st=document.createElement('style');st.id='pulse-spine-style';st.textContent=
'.ps-head{margin:4px 0 12px}.ps-head h2{font-size:1.15rem;margin:0}.ps-head p{margin:2px 0 0;color:var(--muted);font-size:.78rem}'+
'.ps-compose{display:flex;gap:6px;margin:0 0 12px}.ps-compose input{flex:1;min-width:0;height:38px;border:1px solid rgba(255,255,255,.1);border-radius:10px;background:#0b111c;color:var(--text);padding:0 11px;font:inherit;font-size:12px}.ps-primary{border:0;border-radius:10px;padding:0 14px;background:#f5f7fb;color:#101218;font-weight:700;cursor:pointer}'+
'.ps-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px}.ps-card{display:flex;flex-direction:column;gap:5px;text-align:left;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.025);color:var(--text);padding:13px;font:inherit;cursor:pointer}.ps-card b{font-size:12px}.ps-card span{font-size:10px;color:var(--muted);line-height:1.4}.ps-card-static{cursor:default}.ps-card details{margin-top:5px}.ps-card summary{cursor:pointer;font-size:10px;color:var(--cyan)}.ps-mini{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.ps-mini button{font:inherit;font-size:9px;color:var(--muted);border:1px solid rgba(255,255,255,.08);border-radius:999px;background:transparent;padding:4px 7px;cursor:pointer}'+
'.ps-kicker,.ps-context{font-size:10px;color:var(--muted);margin:2px 0 9px}.ps-rows{display:flex;flex-direction:column;gap:5px}.ps-row{display:flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.07);border-radius:11px;background:rgba(255,255,255,.02);padding:8px 9px}.ps-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.ps-row-main strong{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ps-row-main span{font-size:9px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ps-actions{display:flex;gap:3px}.ps-actions button{border:1px solid rgba(255,255,255,.09);background:transparent;color:var(--muted);border-radius:8px;padding:5px 7px;font:inherit;font-size:9px;cursor:pointer}.ps-actions button:hover{color:var(--text)}'+
'.ps-section{margin:15px 0}.ps-backing{border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px;background:rgba(255,255,255,.018)}.ps-backing-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px}.ps-backing-grid>div{display:flex;flex-direction:column;gap:2px}.ps-backing-grid strong{font-size:10px}.ps-backing-grid span{font-size:9px;color:var(--muted);word-break:break-all}.ps-back-error{font-size:9px;color:#e6b98b;margin:7px 0 0}.ps-ref-kinds{display:flex;gap:4px;flex-wrap:wrap;margin:0 0 7px}.ps-ref-kinds span{font-size:8px;border:1px solid rgba(255,255,255,.07);border-radius:999px;padding:3px 6px;color:var(--muted)}.ps-ref-meta{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.ps-ref-meta span{font-size:9px;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,.04);color:var(--muted)}.ps-ref-pre{white-space:pre-wrap;word-break:break-word;font-size:9px;line-height:1.45;padding:9px;border-radius:9px;background:#080b12;color:#cfd8e5}.ps-section{margin:15px 0}.ps-section h3,.ps-all>summary{font-size:10px;letter-spacing:.11em;text-transform:uppercase;margin:0 0 6px;color:var(--muted)}.ps-all>summary{cursor:pointer;list-style:none}.ps-all>summary::-webkit-details-marker{display:none}.ps-empty{padding:14px;color:var(--muted);font-size:11px}.ps-search{max-width:520px}'+
'#ps-modal{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.65);display:grid;place-items:center;padding:18px}.ps-modal-card{position:relative;width:min(520px,100%);border:1px solid rgba(255,255,255,.13);border-radius:18px;background:#10131d;padding:18px;box-shadow:0 25px 80px #000}.ps-x{position:absolute;right:10px;top:10px;border:0;background:transparent;color:var(--muted);font-size:20px;cursor:pointer}.ps-blue{font-size:13px;line-height:1.6;color:#dce2ee}.ps-train-card{max-height:82vh;overflow:auto}.ps-train-card h3{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:16px 0 5px}.ps-train-card ul{margin:0;padding-left:18px}.ps-train-card li{font-size:11px;line-height:1.45;margin:4px 0;color:#dce2ee}.ps-link{display:inline-block;margin-top:14px;color:var(--cyan);font-size:11px;text-decoration:none}'+
'.ps-funnel-badge{margin-left:auto;border:1px solid rgba(255,255,255,.1);border-radius:999px;background:rgba(255,255,255,.035);color:#eef3fa;padding:5px 9px;font:inherit;font-size:10px;cursor:pointer}.ps-funnel-panel{display:none;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(10,12,19,.85);padding:9px;margin-bottom:8px}.ps-funnel-panel-head{display:flex;justify-content:space-between;align-items:center;font-size:11px;margin-bottom:6px}.ps-funnel-panel-head button{border:0;background:transparent;color:var(--muted);cursor:pointer}.ps-funnel-item{display:flex;justify-content:space-between;gap:8px;padding:6px 2px;border-top:1px solid rgba(255,255,255,.05);font-size:10px}.ps-funnel-item span{color:var(--muted)}'+
'body.tabs-on #tabbar button>span:not(.tb-ic){display:inline!important;visibility:visible!important;opacity:1!important;color:inherit!important;white-space:nowrap!important}.pf-project-copy strong{display:block!important;visibility:visible!important;opacity:1!important;color:#eef3fa!important}'+
'@media(min-width:761px){body.tabs-on #tabbar button{overflow:visible!important}.ps-row{min-height:38px}}'+
'@media(max-width:760px){.ps-grid{grid-template-columns:1fr 1fr}.ps-actions{flex:none}.ps-row{padding:7px}.ps-funnel-item{display:block}.ps-funnel-item span{display:block;margin-top:2px}}';
document.head.appendChild(st);

window.PulseSpine={
  get state(){return S;},
  query:'',
  add:function(kind,source,title,payload,meta){return addStream(kind,source,title,payload,meta);},
  keep:keepRecord,
  funnel:sendRecordToFunnel,
  request:requestToFunnel,
  harvest:harvest,
  blueprints:BLUEPRINTS.slice(),
  contracts:CONTRACTS.slice(),
  fabric:FABRIC_DOCS.slice(),
  refinery:REFINERY_DOCS.slice(),
  get training(){return S.training.slice();},
  get trainingLessons(){return S.trainingLessons.slice();},
  findTraining:function(q){return relatedTraining({title:q||'',payload:q||''},8);},
  get references(){return S.refs.slice();},
  get edges(){return S.edges.slice();}
};
window.PulseReferences={
  kinds:REF_KINDS.slice(),
  add:function(x){var r=addReference(x);save();return r;},
  output:ingestOutput,
  search:function(q,opts){return searchReferences(q,opts||{});},
  packet:referencePacket,
  markdown:function(id){return refMarkdown(S.refs.find(function(r){return r.id===id;}));},
  related:function(id){return S.edges.filter(function(e){return e.from===id||e.to===id;});},
  sync:function(){harvest();return {references:S.refs.length,edges:S.edges.length};},
  backing:function(){return {github:BIN_GITHUB_PATH,local:BIN_LOCAL_DIR+'/',state:Object.assign({},binBacking)};},
  syncLocal:function(){return syncLocalBinNow(true);},
  chooseLocalMirror:chooseLocalBinMirror
};
window.MoorOutput={
  emit:function(detail){return ingestOutput(detail||{});},
  reference:function(detail){var r=addReference(detail||{});save();return r;},
  persist:function(key,detail){
    var k='moor-output:'+slug(key||detail&&detail.id||detail&&detail.title||'output');
    try{localStorage.setItem(k,JSON.stringify(detail));}catch(e){}
    return ingestOutput(detail||{});
  },
  packet:referencePacket
};

harvest();
loadTrainingBatches();
syncReferenceGraph();
save();
scheduleLocalBinSync();
ensureFunnelProject();
ensureFunnelFabricProject();
ensureCapabilityMemoryProject();
ensureTabbar();
if(typeof renderStage==='function')renderStage();
decorateFunnel();
})();
