const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),P=require('../wonder-scroll-policy.js');
// Long-session windowing at multiple widths, orientations and random scroll positions.
for(const n of [6,50,1000,100000])for(const cols of [1,2,3,6])for(const step of [180,450,900])for(let row=0;row<Math.ceil(n/cols);row+=Math.max(1,Math.floor(n/cols/100))){
 const w=P.windowRange(n,cols,step,row*step,900);
 assert(w.end-w.first<=P.limits.dom);assert(w.first%cols===0);assert(w.end<=n);assert(w.before>=0&&w.after>=0);
 assert.equal(w.before+Math.ceil((w.end-w.first)/cols)*step+w.after,Math.ceil(n/cols)*step);
}
for(const [w,h] of [[240,854],[8000,4500],[1920,1080],[480,854]]){const f=P.fit(w,h);assert(f.width*f.height<=P.limits.pixels+2000);assert(Math.abs(f.width/f.height-w/h)<.01);}
const read=p=>fs.readFileSync(p,'utf8');
const storage=new Map(),context={console,URL,URLSearchParams,setTimeout,clearTimeout,Uint32Array,Float32Array,Uint16Array,location:{href:'https://example.test/wonder-feed.html',origin:'https://example.test'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{createElement:()=>({style:{},dataset:{},append(){}}),head:{append(){}},documentElement:{dataset:{}}}};context.window={localStorage:context.localStorage};vm.createContext(context);
for(const p of ['wonder-core.js','wonder-scroll-policy.js','wonder-haven.js'])vm.runInContext(read(p),context);
const W=context.window.WonderFeed,original=W.Haven.kinds.length;
assert.throws(()=>W.Haven.register({id:'native-foreign',label:'Foreign',category:'Models',page:'https://other.test/render.html'}),/same-origin/);
W.Haven.register({id:'native-check',label:'Check generator',category:'Models',page:'check.html',canvasSelector:'#result'});
assert.equal(W.Haven.kinds.length,original+1);assert(W.Haven.kinds.includes('native-check'));
const type=W.genome.types.find(t=>t.kind==='native-check');assert(W.genome.valid({type:type.kind,seed:123,p:type.params(()=>.3)}));
assert.throws(()=>W.Haven.register({id:'native-check',label:'duplicate',category:'Models',page:'check.html'}),/Duplicate/);
for(const page of ['pulse-dashboard.html','wonder-feed.html']){const html=read(page);assert(html.indexOf('wonder-scroll-policy.js')<html.indexOf('wonder-haven.js'));}
const bundles=fs.readdirSync('wonder-previews');assert.equal(bundles.length,6);
for(const file of bundles){const s=read('wonder-previews/'+file);new vm.Script(s);assert(!s.includes('PulseSpine'));assert(!s.includes('wonder-haven.js'));assert(s.length<90000);}
new vm.Script(read('wonder-repair-funnel.js'));
const run=JSON.parse(read('docs/wonder-scroll-funnel-run.json'));assert.equal(run.initial.route,'funnel');assert.equal(run.queuedBlueprint.route,'funnel');assert.equal(run.execution.route,'harness');assert.equal(run.ownerIntentConfirmed,false);
assert.deepEqual(Object.keys(run.verdictPacket).sort(),['destination','doneCriteria','spec']);assert.equal(run.page0Queue[0].input,JSON.parse(read('docs/wonder-scroll-repair.blueprint.json')).page0);
console.log('PASS: 100k-history virtualization, pixel/aspect limits, automatic registration, invalid/duplicate rejection, isolated bundles, and canonical Funnel round-trip.');
