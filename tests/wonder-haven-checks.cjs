const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=p=>fs.readFileSync(require('path').join(__dirname,'..',p),'utf8');
const storage=new Map(),sandbox={console,URL,URLSearchParams,Date,Math,JSON,Uint32Array,Float32Array,Uint16Array,Set,Map,setTimeout,clearTimeout};
sandbox.window={};sandbox.document={createElement:()=>({style:{},dataset:{},classList:{add(){}},append(){},appendChild(){}}),head:{append(){},appendChild(){}},documentElement:{dataset:{}}};
sandbox.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};sandbox.window.localStorage=sandbox.localStorage;
vm.createContext(sandbox);vm.runInContext(source('wonder-core.js'),sandbox);vm.runInContext(source('wonder-scroll-policy.js'),sandbox);vm.runInContext(source('wonder-haven.js'),sandbox);
const w=sandbox.window.WonderFeed;
assert(w.Haven.kinds.length>=50);assert.equal(w.Haven.native.length,19);
assert(!w.Haven.kinds.includes('amalgam'));assert(!w.Haven.kinds.includes('component'));assert(!w.Haven.kinds.includes('motive'));
for(const n of w.Haven.native){const t=w.genome.types.find(t=>t.kind===n.id),g={type:t.kind,seed:123,p:t.params(()=>.4)};assert(w.genome.valid(g));assert.equal(w.genome.sanitize(g).type,n.id);}
for(const k of ['terrain','planet','forest','firefountain','native-plant','native-furniture','native-workshop'])assert(w.Haven.kinds.includes(k));
for(const page of ['wonder-feed.html','pulse-dashboard.html']){const s=source(page);assert(s.includes('wonder-core.js?v='+w.Haven.release));assert(s.includes('wonder-haven.js?v='+w.Haven.release));for(const match of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g))if(!/application\/json/.test(match[1]))new vm.Script(match[2]);}
assert(source('pulse-dashboard.html').includes('x:wonderPlant?0:Math.cos(a)*r'));
assert(source('wonder-haven.js').includes('indexedDB.open'));assert(source('wonder-haven.js').includes('createWritable'));assert(source('wonder-haven.js').includes("frame?.remove()"));
assert(source('wonder-haven.js').includes("aria-label','Generator feed"));assert(source('wonder-haven.js').includes("activeKind==='all'?null"));assert(source('wonder-haven.js').includes('policy.windowRange'));
assert(source('wonder-haven.js').includes("document.body.append(frame)"));assert(!source('wonder-haven.js').includes("vis.append(frame)"));assert(source('wonder-haven.js').includes('function mirror(now=0)'));
console.log('PASS: '+w.Haven.kinds.length+' visual generators, 19 native adapters, canonical genomes, shared engine, centered plants, local files and paused previews');
