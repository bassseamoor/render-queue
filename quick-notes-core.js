(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.MOORQuickNotes=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1;
const STORAGE_KEY='moor.quick-notes.v1';
const ROOT='root';

function now(){return new Date().toISOString();}
function clone(x){return JSON.parse(JSON.stringify(x));}
function uid(prefix){
  return prefix+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
}
function blankState(){
  return {
    schema:'moor.quick-notes',
    version:VERSION,
    folders:[],
    notes:[],
    selectedFolder:ROOT,
    selectedNote:null
  };
}
function normalize(raw){
  const s=raw&&typeof raw==='object'?raw:blankState();
  return {
    schema:'moor.quick-notes',
    version:VERSION,
    folders:Array.isArray(s.folders)?s.folders.filter(Boolean):[],
    notes:Array.isArray(s.notes)?s.notes.filter(Boolean):[],
    selectedFolder:typeof s.selectedFolder==='string'?s.selectedFolder:ROOT,
    selectedNote:typeof s.selectedNote==='string'?s.selectedNote:null
  };
}
function storage(){
  try{return window.localStorage}catch(e){return null}
}
function load(){
  const st=storage();
  if(!st) return blankState();
  try{return normalize(JSON.parse(st.getItem(STORAGE_KEY)||'null'))}catch(e){return blankState()}
}
function save(state){
  const s=normalize(state),st=storage();
  if(st) st.setItem(STORAGE_KEY,JSON.stringify(s));
  return s;
}
function folderById(state,id){return state.folders.find(f=>f.id===id)||null;}
function noteById(state,id){return state.notes.find(n=>n.id===id)||null;}
function children(state,parentId){
  return state.folders.filter(f=>(f.parentId||ROOT)===(parentId||ROOT))
    .sort((a,b)=>a.name.localeCompare(b.name));
}
function createFolder(state,name,parentId){
  const s=clone(normalize(state));
  const clean=String(name||'New folder').trim().slice(0,80)||'New folder';
  const parent=parentId&&parentId!==ROOT&&folderById(s,parentId)?parentId:ROOT;
  const f={id:uid('folder'),parentId:parent,name:clean,createdAt:now(),updatedAt:now()};
  s.folders.push(f); s.selectedFolder=f.id; return {state:s,folder:f};
}
function descendants(state,id){
  const out=[]; const walk=(x)=>{children(state,x).forEach(c=>{out.push(c.id);walk(c.id)})}; walk(id); return out;
}
function renameFolder(state,id,name){
  const s=clone(normalize(state)),f=folderById(s,id); if(!f)return s;
  f.name=String(name||f.name).trim().slice(0,80)||f.name; f.updatedAt=now(); return s;
}
function deleteFolder(state,id){
  if(!id||id===ROOT) return normalize(state);
  const s=clone(normalize(state)); const ids=new Set([id,...descendants(s,id)]);
  s.folders=s.folders.filter(f=>!ids.has(f.id));
  s.notes.forEach(n=>{if(ids.has(n.folderId))n.folderId=ROOT});
  if(ids.has(s.selectedFolder))s.selectedFolder=ROOT;
  return s;
}
function createNote(state,folderId){
  const s=clone(normalize(state));
  const folder=folderId&&folderId!==ROOT&&folderById(s,folderId)?folderId:ROOT;
  const t=now(),n={id:uid('note'),folderId:folder,title:'Untitled',body:'',createdAt:t,updatedAt:t};
  s.notes.unshift(n); s.selectedFolder=folder; s.selectedNote=n.id;
  return {state:s,note:n};
}
function updateNote(state,id,patch){
  const s=clone(normalize(state)),n=noteById(s,id); if(!n)return s;
  if('title' in patch)n.title=String(patch.title||'Untitled').slice(0,160);
  if('body' in patch)n.body=String(patch.body||'');
  if('folderId' in patch)n.folderId=patch.folderId===ROOT||folderById(s,patch.folderId)?patch.folderId:ROOT;
  n.updatedAt=now(); return s;
}
function deleteNote(state,id){
  const s=clone(normalize(state));
  s.notes=s.notes.filter(n=>n.id!==id);
  if(s.selectedNote===id)s.selectedNote=null;
  return s;
}
function notesInFolder(state,folderId,query){
  const q=String(query||'').trim().toLowerCase();
  return state.notes.filter(n=>(n.folderId||ROOT)===(folderId||ROOT))
    .filter(n=>!q||n.title.toLowerCase().includes(q)||n.body.toLowerCase().includes(q))
    .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
function exportState(state){return JSON.stringify(normalize(state),null,2);}
function importState(text){
  const parsed=JSON.parse(String(text||'')); return normalize(parsed);
}
return Object.freeze({
  VERSION,STORAGE_KEY,ROOT,blankState,normalize,load,save,folderById,noteById,children,
  createFolder,renameFolder,deleteFolder,createNote,updateNote,deleteNote,notesInFolder,
  exportState,importState
});
});