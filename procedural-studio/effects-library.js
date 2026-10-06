/* Only explicit generator saves write to this device-local library. */
(function(root){
'use strict';let dbPromise;const MAX=100;
function db(){if(dbPromise)return dbPromise;dbPromise=new Promise((resolve,reject)=>{const q=indexedDB.open('moor-effects-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('generators',{keyPath:'id'});q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});return dbPromise;}
async function list(){const d=await db();return new Promise((resolve,reject)=>{const q=d.transaction('generators').objectStore('generators').getAll();q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
function descriptor(rec){return {id:'native-fx-'+rec.id,label:rec.name,category:'Effects',page:'effects-studio.html?preview=1&generator='+encodeURIComponent(rec.id),recipe:rec.recipe};}
async function save(id,name,recipe){const E=root.MoorEffects,r=E.normalize(recipe);id=String(id||'').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,44);if(!id||id.startsWith('preset-'))throw Error('Use a generator ID of letters, numbers and dashes');const items=await list();if(!items.some(x=>x.id===id)&&items.length>=MAX)throw Error('Generator library is full (100)');const rec={id,name:String(name||r.name).slice(0,60),recipe:r,updatedAt:Date.now()};const d=await db();await new Promise((resolve,reject)=>{const tx=d.transaction('generators','readwrite');tx.objectStore('generators').put(rec);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});root.dispatchEvent(new CustomEvent('moor:effect-generator-saved',{detail:rec}));try{localStorage.setItem('moor-effects-catalog-changed',String(Date.now()));}catch(_){}return rec;}
root.EffectsLibrary={list,save,descriptor,max:MAX};
})(window);

