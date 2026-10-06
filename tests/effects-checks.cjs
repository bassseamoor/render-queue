'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),E=require('../effects-core.js');
const presets=JSON.parse(fs.readFileSync('effects/presets.json')).presets;
assert.equal(presets.length,6);const signatures=new Set();
for(const preset of presets){
 const r=E.normalize(preset.recipe),a=E.compile(r,'replay-123'),b=E.compile(JSON.parse(JSON.stringify(r)),'replay-123');
 const at=E.sample(a,1.3),same=E.sample(b,1.3);assert.deepEqual(at,same);
 E.sample(a,4.9);E.sample(a,.2);assert.deepEqual(E.sample(a,1.3),same,'Seeking must not depend on frame history');
 assert.notDeepEqual(at,E.sample(E.compile(r,'other-seed'),1.3));
 assert(at.some(g=>g.elements.some(p=>p.alpha>0)));signatures.add(JSON.stringify(at.map(g=>({renderer:g.layer.renderer,position:g.elements[0].position}))));
 for(const t of [0,.01,1.3,2.9,5,123])for(const g of E.sample(a,t))for(const p of g.elements){assert(p.position.every(Number.isFinite));assert(p.previous.every(Number.isFinite));assert(Number.isFinite(p.alpha));if(p.path)assert(p.path.every(v=>v.every(Number.isFinite)));}
 const capacity=r.layers.reduce((n,l)=>n+l.count,0);assert(capacity<=E.limits.elements);
 const snapshot=JSON.stringify(r);E.compile(r,1);E.sample(a,1);assert.equal(JSON.stringify(r),snapshot,'Compilation must not mutate a saved recipe');
}
assert.equal(signatures.size,6);
const bad=structuredClone(presets[0].recipe);bad.layers[0].count=1000;assert.throws(()=>E.normalize(bad),/Path renderers/);bad.layers[0].count=1;bad.layers[0].renderer='execute-js';assert.throws(()=>E.normalize(bad),/Unknown renderer/);
const over=structuredClone(presets[1].recipe);over.layers[0].count=1200;over.layers[1].count=1200;assert.throws(()=>E.normalize(over),/capacity/);
for(const value of [NaN,Infinity,-1])assert.throws(()=>E.sample(E.compile(presets[0].recipe,1),value),/Time/);
const foreign=structuredClone(presets[0].recipe);foreign.layers[0].sprite='https://other.test/x.png';assert.throws(()=>E.normalize(foreign),/PNG/);
const duplicate=structuredClone(presets[0].recipe);duplicate.layers[1].id=duplicate.layers[0].id;assert.throws(()=>E.normalize(duplicate),/unique/);
for(const [w,h] of [[300,900],[900,300],[8000,5000]]){const size=E.fit(w,h);assert(size.width*size.height<E.limits.pixels+2000);const q=E.project([0,0,0],{yaw:0,pitch:0,zoom:1,projection:'orthographic'},w,h);assert.equal(q.x,w/2);assert.equal(q.y,h/2);}
// Execute the actual library with a fake IndexedDB; draws/sample/list never call put.
let writes=0;const rows=new Map(),storage=new Map(),listeners=new Map();
const database={transaction(store,mode){const tx={objectStore(){return {getAll(){const q={};queueMicrotask(()=>q.onsuccess?.({}));Object.defineProperty(q,'result',{get:()=>[...rows.values()]});return q;},put(rec){assert.equal(mode,'readwrite');writes++;rows.set(rec.id,structuredClone(rec));queueMicrotask(()=>tx.oncomplete?.());}};}};return tx;}};
const window={MoorEffects:E,dispatchEvent(e){listeners.get(e.type)?.(e);},addEventListener(t,fn){listeners.set(t,fn);}};
const indexedDB={open(){const q={result:database};queueMicrotask(()=>q.onsuccess());return q;}};
const context=vm.createContext({window,indexedDB,localStorage:{setItem:(k,v)=>storage.set(k,v)},CustomEvent:class{constructor(type,args){this.type=type;this.detail=args.detail;}},console});vm.runInContext(fs.readFileSync('effects-library.js','utf8'),context);
(async()=>{
 await window.EffectsLibrary.list();for(let i=0;i<30;i++)E.sample(E.compile(presets[0].recipe,i),1.3);assert.equal(writes,0);
 const rec=await window.EffectsLibrary.save('test-ion','Test Ion',presets[1].recipe);assert.equal(writes,1);assert.equal((await window.EffectsLibrary.list()).length,1);assert(!('image'in rec));
 const descriptor=window.EffectsLibrary.descriptor(rec);assert.equal(descriptor.id,'native-fx-test-ion');assert.equal(descriptor.recipe.name,'Ion Bloom');
 await window.EffectsLibrary.save('test-ion','Updated',presets[0].recipe);assert.equal(rows.size,1);assert.equal(descriptor.recipe.name,'Ion Bloom','Old saved recipe stays immutable');
 await assert.rejects(()=>window.EffectsLibrary.save('preset-prism-lance','collision',presets[0].recipe),/generator ID/);
 for(let i=1;i<100;i++)rows.set('g-'+i,{id:'g-'+i});await assert.rejects(()=>window.EffectsLibrary.save('one-too-many','Over',presets[0].recipe),/full/);
 const read=p=>fs.readFileSync(p,'utf8');for(const file of ['effects-studio.js','effects-feed.js','effects-funnel.js'])new vm.Script(read(file));
 const registry=JSON.parse(read('wonder-generators.json'));for(const p of presets){const d=registry.generators.find(x=>x.id==='native-fx-preset-'+p.id);assert(d);assert.deepEqual(d.recipe,p.recipe);}
 for(const page of ['pulse-dashboard.html','wonder-feed.html']){const html=read(page);assert(html.indexOf('effects-library.js')<html.indexOf('effects-feed.js'));assert(html.includes('effects-feed.js'));}
 assert(read('pulse-component-extensions.js').includes('"id": "effects-studio"'));assert(JSON.parse(read('pulse-manifest.json')).items['effects-studio']);
 const run=JSON.parse(read('docs/effects-studio-funnel-run.json'));assert.equal(run.initial.route,'funnel');assert.equal(run.evidence.route,'funnel');assert.equal(run.queuedBlueprint.route,'funnel');assert.equal(run.execution.route,'harness');assert.deepEqual(Object.keys(run.verdictPacket).sort(),['destination','doneCriteria','spec']);assert.equal(run.page0Queue[0].input,JSON.parse(read('docs/effects-studio.blueprint.json')).page0);
 console.log('PASS: six unique effects, deterministic 3D replay/seeking, capacity and input rejection, immutable generators, zero unsaved writes, bounded storage, automatic feed contracts and canonical Funnel roundtrip.');
})().catch(e=>{console.error(e);process.exitCode=1;});
