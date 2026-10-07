(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MOORLocalFiles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const DB='moor.file-handles.v1', STORE='handles', PRIMARY='primary-root';
const MOOR_ROOT='MOOR', APP_DATA='app-data';
function supported(){return !!(root&&root.showDirectoryPicker&&root.indexedDB)}
function cleanSegment(x){return String(x||'').replace(/[\\/:*?"<>|]/g,'-').replace(/\s+/g,' ').trim().slice(0,120)||'untitled'}
function openDb(){
  return new Promise((resolve,reject)=>{
    if(!root.indexedDB)return reject(new Error('IndexedDB unavailable'));
    const r=root.indexedDB.open(DB,1);
    r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('IndexedDB open failed'));
  });
}
async function remember(handle,key){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(handle,key||PRIMARY);
    tx.oncomplete=()=>{db.close();resolve(handle)};
    tx.onerror=()=>{db.close();reject(tx.error||new Error('handle save failed'))};
  });
}
async function remembered(key){
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(key||PRIMARY);
    r.onsuccess=()=>{db.close();resolve(r.result||null)};
    r.onerror=()=>{db.close();reject(r.error||new Error('handle read failed'))};
  });
}
async function permission(handle,mode,request){
  if(!handle)return false;
  const opts={mode:mode||'readwrite'};
  if(handle.queryPermission&&await handle.queryPermission(opts)==='granted')return true;
  if(request&&handle.requestPermission&&await handle.requestPermission(opts)==='granted')return true;
  return false;
}
async function initializeRoot(handle){
  await ensureDir(handle,[MOOR_ROOT,APP_DATA]);
  const readme=[
    'MOOR local data root',
    '',
    'These files are durable backing storage for MOOR applications.',
    'The intended interface is the MOOR app that owns each directory, not manual filesystem editing.',
    '',
    'Structure:',
    '  MOOR/app-data/<app-id>/...',
    '',
    'Do not move or rename app-data files while MOOR apps are using them.'
  ].join('\n');
  const existing=await readText(handle,[MOOR_ROOT],'README.txt');
  if(existing==null)await writeText(handle,[MOOR_ROOT],'README.txt',readme+'\n');
  return handle;
}
async function connect(){
  if(!supported())throw new Error('File System Access API is unavailable in this browser.');
  const handle=await root.showDirectoryPicker({mode:'readwrite'});
  if(!await permission(handle,'readwrite',true))throw new Error('Read/write permission was not granted.');
  await remember(handle,PRIMARY);
  await initializeRoot(handle);
  return handle;
}
async function primary(requestPermission){
  if(!supported())return null;
  let handle=null;try{handle=await remembered(PRIMARY)}catch(e){return null}
  if(!handle)return null;
  return await permission(handle,'readwrite',!!requestPermission)?handle:null;
}
async function ensureDir(rootHandle,segments){
  let d=rootHandle;
  for(const raw of (segments||[]))d=await d.getDirectoryHandle(cleanSegment(raw),{create:true});
  return d;
}
async function readText(rootHandle,segments,name){
  const d=await ensureDir(rootHandle,segments);
  try{
    const h=await d.getFileHandle(cleanSegment(name),{create:false});
    return await (await h.getFile()).text();
  }catch(e){
    if(e&&e.name==='NotFoundError')return null;
    throw e;
  }
}
async function writeText(rootHandle,segments,name,text){
  const d=await ensureDir(rootHandle,segments);
  const h=await d.getFileHandle(cleanSegment(name),{create:true});
  const w=await h.createWritable();await w.write(String(text));await w.close();return true;
}
async function readJson(rootHandle,segments,name,fallback){
  const t=await readText(rootHandle,segments,name);
  if(t==null)return fallback;
  return JSON.parse(t);
}
async function writeJson(rootHandle,segments,name,value){
  return writeText(rootHandle,segments,name,JSON.stringify(value,null,2)+'\n');
}
function appSegments(appId,more){return [MOOR_ROOT,APP_DATA,cleanSegment(appId)].concat(Array.isArray(more)?more:[])}
async function readAppJson(rootHandle,appId,name,fallback){return readJson(rootHandle,appSegments(appId),name,fallback)}
async function writeAppJson(rootHandle,appId,name,value){await initializeRoot(rootHandle);return writeJson(rootHandle,appSegments(appId),name,value)}
async function readAppText(rootHandle,appId,name){return readText(rootHandle,appSegments(appId),name)}
async function writeAppText(rootHandle,appId,name,text){await initializeRoot(rootHandle);return writeText(rootHandle,appSegments(appId),name,text)}
return Object.freeze({
  DB,STORE,PRIMARY,MOOR_ROOT,APP_DATA,supported,cleanSegment,connect,remembered,primary,permission,initializeRoot,
  ensureDir,readText,writeText,readJson,writeJson,appSegments,readAppJson,writeAppJson,readAppText,writeAppText
});
});