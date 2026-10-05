/* Pulse UltraFeedback adapter
 * Dataset stays behind a dataset boundary; live Bin gets dataset/preference references.
 * Full local pull streams upstream JSONL into OPFS under moor-bin/datasets/ultrafeedback.
 */
(function(){
'use strict';
if(typeof window==='undefined')return;

var ID='dataset:openbmb-ultrafeedback';
var BASE='https://huggingface.co/datasets/openbmb/UltraFeedback/resolve/main/';
var FILES=[
 {name:'evol_instruct.jsonl',bytes:168000000},
 {name:'false_qa.jsonl',bytes:25900000},
 {name:'flan.jsonl',bytes:240000000},
 {name:'sharegpt.jsonl',bytes:313000000},
 {name:'truthful_qa.jsonl',bytes:9990000},
 {name:'ultrachat.jsonl',bytes:182000000}
];
var STATUS_KEY='moor-ultrafeedback-local-v1';
var state=readState();

function readState(){
 try{var x=JSON.parse(localStorage.getItem(STATUS_KEY)||'null');if(x&&x.version)return x;}catch(e){}
 return {version:1,status:'not-local',rows:0,completions:0,files:{},startedAt:null,finishedAt:null,error:null};
}
function writeState(){try{localStorage.setItem(STATUS_KEY,JSON.stringify(state));}catch(e){}}
function emitChange(){try{window.dispatchEvent(new CustomEvent('moor:dataset-status',{detail:{id:ID,state:state}}));}catch(e){}}
function refs(){return window.PulseReferences||null;}
function registerDataset(extra){
 var api=refs();if(!api)return;
 var summary=extra&&extra.summary||null,manifest=extra&&extra.manifest||null;
 api.add({
   id:ID,kind:'dataset',title:'UltraFeedback',summary:'64k-prompt preference/critique corpus from OpenBMB, stored behind a dataset boundary.',
   status:summary?'observed':'specified-not-verified',source:'openbmb/UltraFeedback',source_id:'openbmb/UltraFeedback',
   provenance:'imported',doc_ref:'https://huggingface.co/datasets/openbmb/UltraFeedback',
   implementation_ref:'scripts/ultrafeedback_to_moor.py',
   concepts:['preference learning','critique','instruction following','truthfulness','honesty','helpfulness'],
   data:{
     license:'MIT',upstream:'openbmb/UltraFeedback',rows:summary&&summary.rows||63967,
     completions:summary&&summary.completions||255868,aspects:['instruction_following','truthfulness','honesty','helpfulness'],
     local:state,manifest:manifest||null,summary:summary||null
   }
 });
 api.add({
   id:'training:ultrafeedback-contract',kind:'training',title:'UltraFeedback training contract',
   summary:'Use request → candidates → critique/score as preference evidence; never treat generic response preference as verified MOOR implementation logic.',
   status:'observed',source:'Pulse Dataset Adapter',source_id:ID,provenance:'derived',
   concepts:['preference learning'],
   data:{
     mapping:{instruction:'intent/example',response:'candidate answer',annotations:'critique/evidence',best_vs_worst:'preference'},
     boundary:'answer-quality evidence only; MOOR implementation logic still requires MOOR gates'
   }
 });
}

function parseRating(v){var n=Number(v);return Number.isFinite(n)?n:null;}
function scoreCompletion(c){
 var ann=c&&c.annotations||{},aspects={},sum=0,n=0;
 ['instruction_following','truthfulness','honesty','helpfulness'].forEach(function(k){
   var a=ann[k]||{},v=parseRating(a.Rating);
   if(v!=null){aspects[k]=v;sum+=v;n++;}
 });
 var overall=parseRating(c&&c.overall_score);
 if(overall==null&&n)overall=sum/n;
 return {overall:overall,aspects:aspects};
}
function derive(row){
 var cs=(row&&row.completions)||[],scored=cs.map(function(c,i){
   var s=scoreCompletion(c);return {index:i,model:c.model||null,principle:c.principle||null,overall:s.overall,aspects:s.aspects};
 });
 var usable=scored.filter(function(x){return x.overall!=null;});
 usable.sort(function(a,b){return b.overall-a.overall;});
 return {scores:scored,best:usable[0]||null,worst:usable.length?usable[usable.length-1]:null,
   margin:usable.length?usable[0].overall-usable[usable.length-1].overall:0};
}
function compactExample(row,derived){
 if(!derived.best||!derived.worst)return null;
 var bc=row.completions[derived.best.index]||{},wc=row.completions[derived.worst.index]||{};
 function rationales(c){
   var out={},ann=c.annotations||{};
   Object.keys(ann).forEach(function(k){var a=ann[k]||{};out[k]=a['Rationale For Rating']||a.Rationale||null;});
   return out;
 }
 return {
   dataset:ID,source:row.source||null,source_id:row.id||null,instruction:row.instruction||'',
   margin:derived.margin,
   chosen:{model:bc.model||null,response:bc.response||'',score:derived.best.overall,aspects:derived.best.aspects,rationales:rationales(bc)},
   rejected:{model:wc.model||null,response:wc.response||'',score:derived.worst.overall,aspects:derived.worst.aspects,rationales:rationales(wc)}
 };
}
function addExampleReference(ex,index){
 var api=refs();if(!api||!ex)return;
 var id='preference:ultrafeedback:'+(ex.source_id||String(index));
 api.add({
   id:id,kind:'preference',title:'UltraFeedback · '+(ex.source_id||index),
   summary:ex.instruction.slice(0,220),status:'observed',source:'openbmb/UltraFeedback',source_id:ex.source_id||String(index),
   provenance:'imported',concepts:['preference learning'],data:ex
 });
}

async function loadCompactRepoTraining(){
 registerDataset();
 try{
   var pair=await Promise.all([
     fetch('moor-bin/datasets/ultrafeedback/manifest.json',{cache:'no-store'}),
     fetch('moor-bin/datasets/ultrafeedback/summary.json',{cache:'no-store'}),
     fetch('moor-bin/datasets/ultrafeedback/examples.jsonl',{cache:'no-store'})
   ]);
   if(!pair[0].ok||!pair[1].ok||!pair[2].ok)return false;
   var manifest=await pair[0].json(),summary=await pair[1].json(),txt=await pair[2].text();
   registerDataset({manifest:manifest,summary:summary});
   txt.split(/\r?\n/).filter(Boolean).slice(0,200).forEach(function(line,i){
     try{addExampleReference(JSON.parse(line),i);}catch(e){}
   });
   return true;
 }catch(e){return false;}
}

async function opfsDatasetDir(){
 if(!navigator.storage||!navigator.storage.getDirectory)throw new Error('Origin Private File System unavailable');
 var root=await navigator.storage.getDirectory();
 var bin=await root.getDirectoryHandle('moor-bin',{create:true});
 var datasets=await bin.getDirectoryHandle('datasets',{create:true});
 return datasets.getDirectoryHandle('ultrafeedback',{create:true});
}
async function fileText(dir,name){
 try{var h=await dir.getFileHandle(name);return await (await h.getFile()).text();}catch(e){return null;}
}
async function writeText(dir,name,text){
 var h=await dir.getFileHandle(name,{create:true}),w=await h.createWritable();await w.write(text);await w.close();
}
function concatBytes(a,b){
 if(!a||!a.length)return b;
 var out=new Uint8Array(a.length+b.length);out.set(a,0);out.set(b,a.length);return out;
}
function bytesToText(b){return new TextDecoder().decode(b);}
function indexRecord(row,file,offset,length){
 var d=derive(row);
 return {
   dataset:ID,source:row.source||null,source_id:row.id||null,instruction:row.instruction||'',
   file:file,offset:offset,length:length,
   models:(row.models||[]).slice(),best_index:d.best&&d.best.index,worst_index:d.worst&&d.worst.index,
   best_score:d.best&&d.best.overall,worst_score:d.worst&&d.worst.overall,margin:d.margin
 };
}
async function pullFile(file,rawDir,indexDir,onProgress){
 var url=BASE+file.name,resp=await fetch(url);
 if(!resp.ok)throw new Error(file.name+' HTTP '+resp.status);
 if(!resp.body)throw new Error(file.name+' streaming response unavailable');
 var rawHandle=await rawDir.getFileHandle(file.name,{create:true});
 var rawWriter=await rawHandle.createWritable();
 var idxHandle=await indexDir.getFileHandle(file.name.replace(/\.jsonl$/,'.index.jsonl'),{create:true});
 var idxWriter=await idxHandle.createWritable();
 var reader=resp.body.getReader(),pending=new Uint8Array(0),offset=0,downloaded=0,rows=0,completions=0,idxBuf=[];
 try{
   while(true){
     var step=await reader.read();if(step.done)break;
     var chunk=step.value;downloaded+=chunk.length;await rawWriter.write(chunk);
     var data=concatBytes(pending,chunk),start=0;
     for(var i=0;i<data.length;i++){
       if(data[i]!==10)continue;
       var lineBytes=data.slice(start,i),lineLen=i-start+1,lineOffset=offset;
       offset+=lineLen;start=i+1;
       if(lineBytes.length&&lineBytes[lineBytes.length-1]===13)lineBytes=lineBytes.slice(0,-1);
       if(lineBytes.length){
         try{
           var row=JSON.parse(bytesToText(lineBytes));rows++;completions+=(row.completions||[]).length;
           idxBuf.push(JSON.stringify(indexRecord(row,file.name,lineOffset,lineLen))+'\n');
           if(idxBuf.length>=100){await idxWriter.write(idxBuf.join(''));idxBuf=[];}
         }catch(e){}
       }
     }
     pending=data.slice(start);
     if(onProgress)onProgress({file:file.name,downloaded:downloaded,total:Number(resp.headers.get('content-length'))||file.bytes,rows:rows,completions:completions});
   }
   if(pending.length){
     var lineOffset=offset,lineLen=pending.length;
     try{
       var row=JSON.parse(bytesToText(pending));rows++;completions+=(row.completions||[]).length;
       idxBuf.push(JSON.stringify(indexRecord(row,file.name,lineOffset,lineLen))+'\n');
     }catch(e){}
   }
   if(idxBuf.length)await idxWriter.write(idxBuf.join(''));
 } finally {
   try{await rawWriter.close();}catch(e){}
   try{await idxWriter.close();}catch(e){}
 }
 return {file:file.name,rows:rows,completions:completions,bytes:downloaded};
}
async function pullFullLocal(onProgress){
 if(state.status==='pulling')return state;
 state={version:1,status:'pulling',rows:0,completions:0,files:state.files||{},startedAt:new Date().toISOString(),finishedAt:null,error:null};
 writeState();emitChange();registerDataset();
 try{
   var dir=await opfsDatasetDir();
   var rawDir=await dir.getDirectoryHandle('raw',{create:true});
   var indexDir=await dir.getDirectoryHandle('index',{create:true});
   for(var i=0;i<FILES.length;i++){
     var f=FILES[i];
     state.files[f.name]={status:'pulling',bytes:0,rows:0};writeState();emitChange();
     var result=await pullFile(f,rawDir,indexDir,function(p){
       state.files[f.name]={status:'pulling',bytes:p.downloaded,total:p.total,rows:p.rows,completions:p.completions};
       if(onProgress)onProgress(Object.assign({index:i,totalFiles:FILES.length},p));
       writeState();emitChange();
     });
     state.files[f.name]=Object.assign({status:'done'},result);
     state.rows+=result.rows;state.completions+=result.completions;writeState();emitChange();
   }
   state.status='local';state.finishedAt=new Date().toISOString();writeState();
   await writeText(dir,'manifest.json',JSON.stringify({
     schema:'moor.dataset.local',version:1,id:ID,upstream:'openbmb/UltraFeedback',
     imported_at:state.finishedAt,rows:state.rows,completions:state.completions,files:state.files,
     raw_path:'raw/',index_path:'index/',logic_boundary:'preference/critique evidence, not verified MOOR implementation logic'
   },null,2)+'\n');
   registerDataset();emitChange();
   return state;
 }catch(e){
   state.status='error';state.error=String(e&&e.message||e);writeState();registerDataset();emitChange();throw e;
 }
}
function queryTokens(q){return String(q||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').split(/\s+/).filter(function(x){return x.length>2;});}
function scoreText(text,tokens){
 text=String(text||'').toLowerCase();var s=0;tokens.forEach(function(t){if(text.indexOf(t)>=0)s+=t.length>6?3:1;});return s;
}
async function searchLocal(query,limit){
 if(state.status!=='local')return [];
 var dir=await opfsDatasetDir(),indexDir=await dir.getDirectoryHandle('index'),tokens=queryTokens(query),hits=[];
 for(var fi=0;fi<FILES.length;fi++){
   var txt=await fileText(indexDir,FILES[fi].name.replace(/\.jsonl$/,'.index.jsonl'));if(!txt)continue;
   txt.split(/\r?\n/).forEach(function(line){
     if(!line)return;
     try{
       var x=JSON.parse(line),score=scoreText(x.instruction,tokens);
       if(score<=0)return;
       hits.push({score:score,record:x});
     }catch(e){}
   });
 }
 hits.sort(function(a,b){return b.score-a.score||((b.record.margin||0)-(a.record.margin||0));});
 return hits.slice(0,limit||8).map(function(x){return x.record;});
}
async function readRawRecord(hit){
 var dir=await opfsDatasetDir(),raw=await dir.getDirectoryHandle('raw'),h=await raw.getFileHandle(hit.file),file=await h.getFile();
 var txt=await file.slice(hit.offset,hit.offset+hit.length).text();return JSON.parse(txt.trim());
}
async function packetLocal(query,limit){
 var hits=await searchLocal(query,limit||6),out=[];
 for(var i=0;i<hits.length;i++){
   try{var row=await readRawRecord(hits[i]),d=derive(row),ex=compactExample(row,d);if(ex)out.push(ex);}catch(e){}
 }
 return {dataset:ID,query:query,examples:out};
}

window.PulseDatasets=window.PulseDatasets||{};
window.PulseDatasets.ultraFeedback={
 id:ID,files:FILES.slice(),get state(){return JSON.parse(JSON.stringify(state));},
 pullLocal:pullFullLocal,search:searchLocal,packet:packetLocal,loadCompact:loadCompactRepoTraining,
 estimatedBytes:FILES.reduce(function(a,b){return a+b.bytes;},0)
};
function boot(){
 registerDataset();
 loadCompactRepoTraining();
 if(window.PulseReferences&&!window.PulseReferences.packetAsync){
   window.PulseReferences.packetAsync=async function(q,limit){
     var base=window.PulseReferences.packet(q,limit),local=await packetLocal(q,Math.min(limit||6,8));
     base.dataset_examples={ultrafeedback:local};return base;
   };
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,0);});
else setTimeout(boot,0);
})();