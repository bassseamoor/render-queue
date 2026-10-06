// Actual canonical zero-key router, with explicit local fallback provenance.
const fs=require('node:fs'),vm=require('node:vm');
const blueprint=JSON.parse(fs.readFileSync('docs/wonder-scroll-repair.blueprint.json','utf8'));
const values=new Map(),localStorage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v))};
const document={readyState:'loading',title:'Wonder Feed repair',body:{dataset:{}},addEventListener(){}};
const location={href:'https://bassseamoor.github.io/render-queue/pulse-dashboard.html',pathname:'/pulse-dashboard.html'};
const window={document,location,localStorage};window.parent=window;
const ctx=vm.createContext({window,document,location,localStorage,URL,URLSearchParams,setTimeout:()=>0,console});
vm.runInContext(fs.readFileSync('moor-request.js','utf8'),ctx);
(async()=>{
 const initial=await window.MOOR.request({input:blueprint.page0,source:'agent',context:{page:'wonder-feed',blueprint:blueprint.id}});
 const resolvedSpec=JSON.stringify(blueprint.spec);
 const queuedBlueprint=await window.MOOR.request({input:'Implement repair blueprint '+resolvedSpec,source:'agent',forceFunnel:true,context:{page:'wonder-feed',blueprint:blueprint.id,provenance:'fallback-system-decisions'}});
 const execution=await window.MOOR.request({input:'Implement repair blueprint '+resolvedSpec,source:'agent',resolved:true,done_criteria:blueprint.doneCriteria,context:{page:'wonder-feed',blueprint:blueprint.id,provenance:'fallback-system-decisions'}});
 const verdict={spec:blueprint.spec,destination:blueprint.destination,doneCriteria:blueprint.doneCriteria};
 if(initial.route!=='funnel'||queuedBlueprint.route!=='funnel'||execution.route!=='harness')throw Error('Canonical route failed');
 fs.writeFileSync('docs/wonder-scroll-funnel-run.json',JSON.stringify({schema:'moor.funnel-run-evidence',version:1,canonical:'FUNNEL.md',mode:'canonical router executed locally; zero-key fallback resolver choices recorded in blueprint',ownerIntentConfirmed:false,initial,queuedBlueprint,execution,verdictPacket:verdict,page0Queue:JSON.parse(values.get('moor-request-queue-v1')),verification:{logic:'pending tests',intent:'unconfirmed',webgl:'pending device verification'}},null,2)+'\n');
 console.log('PASS: immutable Page 0 -> canonical Funnel; blueprint -> canonical Funnel -> Harness verdict.');
})().catch(e=>{console.error(e);process.exitCode=1;});
