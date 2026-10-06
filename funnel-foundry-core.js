/* MOOR Funnel Foundry — deterministic procedural funnel-ecosystem generator.
 * Pure data in -> graph + estimates out. No LLM and no renderer dependency.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FunnelFoundry=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const NEED_GROUPS=[
 ['Body',['Hydration','Nutrition','Sleep','Warmth','Cooling','Movement','Recovery','Pain relief','Hygiene','Physical safety']],
 ['Security',['Shelter','Stability','Predictability','Protection','Privacy','Control','Redundancy','Continuity','Backup','Resilience']],
 ['Resources',['Cash flow','Savings','Liquidity','Income','Ownership','Tools','Compute','Bandwidth','Transportation','Leverage']],
 ['Autonomy',['Choice','Independence','Mobility','Permission','Self-direction','Control of time','Optionality','Sovereignty','Escape','Self-reliance']],
 ['Competence',['Mastery','Skill','Fluency','Craftsmanship','Problem solving','Execution','Speed','Precision','Confidence','Adaptability']],
 ['Progress',['Momentum','Completion','Measurable gain','Feedback','Iteration','Challenge','Discipline','Consistency','Acceleration','Breakthrough']],
 ['Creation',['Invention','Expression','Design','Building','Experimentation','Originality','Composition','Prototyping','Worldbuilding','Authorship']],
 ['Understanding',['Clarity','Explanation','Mental models','Causality','Pattern recognition','Context','Truth','Prediction','Memory','Synthesis']],
 ['Connection',['Belonging','Friendship','Family','Partnership','Trust','Reciprocity','Communication','Collaboration','Intimacy','Community']],
 ['Recognition',['Being seen','Respect','Appreciation','Credibility','Reputation','Influence','Status','Legacy','Acknowledgment','Distinctiveness']],
 ['Play',['Fun','Novelty','Exploration','Adventure','Surprise','Challenge play','Immersion','Humor','Wonder','Freedom to play']],
 ['Comfort',['Ease','Convenience','Calm','Cleanliness','Organization','Beauty','Spaciousness','Simplicity','Coherence','Familiarity']],
 ['Meaning',['Purpose','Service','Usefulness','Impact','Responsibility','Fairness','Protection of others','Teaching','Stewardship','Transcendence']]
];

const SYSTEM_LIBRARY={
 fidelity:{label:'FIDELITY',role:'specialist',objective:'What did Sebastian actually ask for?',steps:[
   ['source','Page 0 slice','Only request language and explicit references.'],
   ['extract','Explicit requirements','Find named mechanisms, commands, prohibitions and requested behavior.'],
   ['claims','Interpretation claims','State the minimum interpretation needed to build.'],
   ['contradict','Contradiction scan','Find claims that conflict with Page 0 or each other.'],
   ['ballot','Fidelity ballot','Requirements, confidence, evidence and unanswered material questions.']
 ]},
 preservation:{label:'PRESERVATION',role:'specialist',objective:'What must not be broken?',steps:[
   ['source','System-state slice','Current implementation, dependencies, locked behavior and verified paths.'],
   ['deps','Dependency map','Trace upstream/downstream systems touched by the change.'],
   ['surface','Change surface','Identify exactly what must change and what should remain untouched.'],
   ['risks','Regression risks','List realistic breakage and required preservation tests.'],
   ['ballot','Preservation ballot','Protected invariants, risk scores and evidence.']
 ]},
 outcome:{label:'OUTCOME',role:'specialist',objective:'What observable result would make this useful?',steps:[
   ['source','Goal slice','Outcome language, requested experience and current dissatisfaction.'],
   ['success','Success condition','Define what the user can actually observe or do afterward.'],
   ['false','False-success attack','Find ways the implementation could technically work while still doing nothing useful.'],
   ['done','Done criteria','Turn outcomes into behavioral acceptance tests.'],
   ['ballot','Outcome ballot','Success criteria, anti-goals and confidence.']
 ]},
 needs:{label:'NEEDS',role:'specialist',objective:'Which Sebastian needs are implicated?',steps:[
   ['source','Need signals','Only signals relevant to needs; not the entire raw request.'],
   ['classify','Need classification','Map signals into the current needs ontology.'],
   ['weights','Need weights','Score relevance, urgency and conflicts without forcing every need into the decision.'],
   ['synergy','Synergy / conflict','Identify needs helped together or traded against each other.'],
   ['ballot','Needs ballot','Weighted need vector plus evidence and uncertainty.']
 ]},
 value:{label:'VALUE',role:'specialist',objective:'Can this create useful leverage or money?',steps:[
   ['source','Economic slice','Only market, cost, time, asset, distribution and monetization signals.'],
   ['paths','Value paths','Identify plausible ways the work creates value or leverage.'],
   ['costs','Cost / leverage','Compare effort, reuse, opportunity cost and compounding value.'],
   ['timing','Timing','Decide whether value matters now, later, or not at all for this request.'],
   ['ballot','Value ballot','Relevant value paths and relevance score; cannot hijack the request.']
 ]},
 interview:{label:'INTERVIEW',role:'branch',objective:'Ask only questions whose answers could materially change execution.',steps:[
   ['questions','Generate questions','Generate the smallest set of material questions.'],
   ['route','Route questions','Send each question only to the person or subsystem that can answer it.'],
   ['answers','Lock answers','Append answers with provenance; never overwrite Page 0.']
 ]},
 convergence:{label:'CONVERGENCE',role:'meta',objective:'Reconcile independent ballots without averaging away disagreement.',steps:[
   ['collect','Collect ballots','Collect independent specialist outputs without forcing agreement.'],
   ['normalize','Normalize evidence','Normalize evidence references, confidence scales and missing-data markers.'],
   ['weight','Dynamic weighting','Weight by request relevance, evidence quality and historical reliability.'],
   ['conflicts','Conflict resolver','Surface disagreements instead of averaging incompatible claims.'],
   ['gaps','Gap detector','Identify material information still missing.'],
   ['decision','Interview decision','Branch only when an answer could materially change execution.'],
   ['gate','Convergence gate','Require enough evidence to produce one coherent candidate.']
 ]},
 replay:{label:'REPLAY + RECEIPT',role:'gate',objective:'Prove the resolved candidate still covers Page 0 before execution.',steps:[
   ['collect','Reassemble candidate','Reassemble the complete candidate from resolved bundles.'],
   ['page0','Page 0 replay','Compare the candidate against the exact frozen request.'],
   ['coverage','Coverage proof','Every explicit obligation is represented or explicitly deferred.'],
   ['subs','Substitution check','Reject silent replacement of requested mechanisms.'],
   ['false','False-success check','Attack the candidate from the user-outcome perspective.'],
   ['gate','Replay gate','Only a clean replay can authorize receipts.'],
   ['req','Requirement receipts','Create source-backed receipts for consequential requirements.'],
   ['exec','Execution receipt','Bind Page 0, resolved spec, criteria and ledger state.']
 ]},
 execution:{label:'EXECUTION + VERIFY',role:'execution',objective:'Build only receipt-authorized work and prove the result.',steps:[
   ['intake','Harness intake','Accept only a valid execution receipt plus builder-facing packet.'],
   ['plan','Execution plan','Map requirements to implementation work and verification gates.'],
   ['build','Build / change','Perform the requested work through bounded workers/tools.'],
   ['integrate','Integration','Connect changes through the real system path.'],
   ['verify','Verifier','Prove syntax, boot, behavior, integration, regression and intent criteria.']
 ]},
 learning:{label:'LEARNING',role:'feedback',objective:'Turn real outcomes and Sebastian feedback into future evidence.',steps:[
   ['result','Outcome record','Record what actually happened, not what the builder claimed.'],
   ['feedback','Sebastian feedback','Acceptance, rejection, correction or changed priority.'],
   ['ledger','Learning ledger','Store verified successes, failures, interpretations and provenance.'],
   ['weights','Weight update','Adjust future reliability weights from outcomes, never confidence alone.']
 ]}
};

const DEFAULT_CONFIG={
  schema:'moor.funnel-foundry-config',version:1,name:'Sebastian Funnel Ecosystem',
  specialists:{fidelity:1,preservation:1,outcome:1,needs:1,value:1},
  support:{convergence:1,interview:1,replay:1,execution:1,learning:1},
  symmetry:{radialCopies:1,mirrorX:false,mirrorY:false,mirrorZ:false,rotationDeg:0},
  geometry:{armRadius:25,layerGap:6.2,depthSpread:7,coneScale:1,twistDeg:0},
  needs:{groups:13,perGroup:10},
  usage:{runsPerDay:24,retentionDays:90,budgetMB:25},
  customTemplates:[],
  customCounts:{}
};

function clone(x){return JSON.parse(JSON.stringify(x));}
function clamp(n,a,b){n=Number(n);return Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;}
function slug(s){return String(s||'system').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,42)||'system';}
function normalizeConfig(input){
  const c=clone(DEFAULT_CONFIG),s=input||{};
  c.name=String(s.name||c.name).slice(0,100);
  for(const k of Object.keys(c.specialists))c.specialists[k]=Math.round(clamp(s.specialists&&s.specialists[k]!=null?s.specialists[k]:c.specialists[k],0,8));
  for(const k of Object.keys(c.support))c.support[k]=Math.round(clamp(s.support&&s.support[k]!=null?s.support[k]:c.support[k],k==='interview'?0:1,6));
  c.symmetry.radialCopies=Math.round(clamp(s.symmetry&&s.symmetry.radialCopies!=null?s.symmetry.radialCopies:1,1,8));
  c.symmetry.mirrorX=!!(s.symmetry&&s.symmetry.mirrorX);c.symmetry.mirrorY=!!(s.symmetry&&s.symmetry.mirrorY);c.symmetry.mirrorZ=!!(s.symmetry&&s.symmetry.mirrorZ);
  c.symmetry.rotationDeg=clamp(s.symmetry&&s.symmetry.rotationDeg||0,-180,180);
  c.geometry.armRadius=clamp(s.geometry&&s.geometry.armRadius||25,8,60);
  c.geometry.layerGap=clamp(s.geometry&&s.geometry.layerGap||6.2,2.5,12);
  c.geometry.depthSpread=clamp(s.geometry&&s.geometry.depthSpread||7,1,24);
  c.geometry.coneScale=clamp(s.geometry&&s.geometry.coneScale||1,.45,2.5);
  c.geometry.twistDeg=clamp(s.geometry&&s.geometry.twistDeg||0,-60,60);
  c.needs.groups=Math.round(clamp(s.needs&&s.needs.groups!=null?s.needs.groups:13,0,13));
  c.needs.perGroup=Math.round(clamp(s.needs&&s.needs.perGroup!=null?s.needs.perGroup:10,0,10));
  c.usage.runsPerDay=Math.round(clamp(s.usage&&s.usage.runsPerDay||24,0,10000));
  c.usage.retentionDays=Math.round(clamp(s.usage&&s.usage.retentionDays||90,1,3650));
  c.usage.budgetMB=clamp(s.usage&&s.usage.budgetMB||25,1,100000);
  c.customTemplates=Array.isArray(s.customTemplates)?s.customTemplates.slice(0,32).map(normalizeTemplate):[];
  c.customCounts={};
  for(const t of c.customTemplates)c.customCounts[t.id]=Math.round(clamp(s.customCounts&&s.customCounts[t.id]||0,0,8));
  return c;
}
function normalizeTemplate(t){
  const name=String(t&&t.name||'Custom system').trim().slice(0,80)||'Custom system';
  const id='custom:'+slug(t&&t.id?t.id:name);
  let stages=Array.isArray(t&&t.stages)?t.stages:String(t&&t.stages||'Inspect, Decide, Emit').split(',');
  stages=stages.map(x=>String(x).trim()).filter(Boolean).slice(0,12);
  if(!stages.length)stages=['Inspect','Decide','Emit'];
  return {id,name,role:'specialist',objective:String(t&&t.objective||'Custom specialist objective.').trim().slice(0,240),stages};
}
function transforms(c){
  const out=[],baseRot=c.symmetry.rotationDeg*Math.PI/180;
  const mirrors=[{x:1,y:1,z:1,key:'base'}];
  if(c.symmetry.mirrorX)mirrors.push({x:-1,y:1,z:1,key:'mx'});
  if(c.symmetry.mirrorY)mirrors.push({x:1,y:-1,z:1,key:'my'});
  if(c.symmetry.mirrorZ)mirrors.push({x:1,y:1,z:-1,key:'mz'});
  if(c.symmetry.mirrorX&&c.symmetry.mirrorZ)mirrors.push({x:-1,y:1,z:-1,key:'mxz'});
  if(c.symmetry.mirrorX&&c.symmetry.mirrorY)mirrors.push({x:-1,y:-1,z:1,key:'mxy'});
  if(c.symmetry.mirrorY&&c.symmetry.mirrorZ)mirrors.push({x:1,y:-1,z:-1,key:'myz'});
  if(c.symmetry.mirrorX&&c.symmetry.mirrorY&&c.symmetry.mirrorZ)mirrors.push({x:-1,y:-1,z:-1,key:'mxyz'});
  for(let r=0;r<c.symmetry.radialCopies;r++){
    const a=baseRot+(r/c.symmetry.radialCopies)*Math.PI*2;
    const ca=Math.cos(a),sa=Math.sin(a);
    for(const m of mirrors){
      out.push({key:'r'+r+'-'+m.key,apply(p){
        const x=p.x*m.x,y=p.y*m.y,z=p.z*m.z;
        return {x:x*ca-z*sa,y,z:x*sa+z*ca};
      }});
    }
  }
  const uniq=[],seen=new Set();
  for(const t of out){const probe=t.apply({x:13.123,y:7.321,z:4.567}),k=[probe.x.toFixed(4),probe.y.toFixed(4),probe.z.toFixed(4)].join('|');if(!seen.has(k)){seen.add(k);uniq.push(t);}}
  return uniq;
}
function build(input){
  const c=normalizeConfig(input),nodes=[],edges=[],N=(o)=>nodes.push(o),E=(from,to,type='flow',label='')=>edges.push({from,to,type,label});
  const gap=c.geometry.layerGap,top=54;
  const pos=(x,y,z)=>({x:+x.toFixed(4),y:+y.toFixed(4),z:+z.toFixed(4)});
  N({id:'page0',label:'PAGE 0',type:'source',layer:0,lane:0,detail:'Exact original request. Frozen; never replaced by a summary.',position:pos(0,top,0)});
  const intake=[['freeze','Freeze','Bind request ID, context, attachments and raw Page 0.'],['parse','Parse','Extract statements without deciding what they mean.'],['context','Context','Attach project state, references, prior locks and failures.'],['route','Route','Create bounded inputs for specialist systems.']];
  let prev='page0';
  intake.forEach((s,i)=>{const id='intake.'+s[0];N({id,label:s[1],type:'gate',layer:1+i,lane:0,detail:s[2],position:pos(0,top-(i+1)*gap,0)});E(prev,id);prev=id;});
  const routeId=prev;
  const specialistDefs=[];
  for(const [key,count] of Object.entries(c.specialists))for(let i=0;i<count;i++)specialistDefs.push({key,def:SYSTEM_LIBRARY[key],instance:i});
  for(const t of c.customTemplates){const count=c.customCounts[t.id]||0;for(let i=0;i<count;i++)specialistDefs.push({key:t.id,def:{label:t.name,objective:t.objective,steps:t.stages.map((name,j)=>['s'+j,name,'Custom template stage.'])},instance:i,custom:true});}
  const ts=transforms(c),baseCount=Math.max(1,specialistDefs.length),ballots=[];
  specialistDefs.forEach((it,bi)=>{
    ts.forEach((tr,ti)=>{
      const theta=(bi/baseCount)*Math.PI*2,rad=c.geometry.armRadius;
      const base={x:Math.cos(theta)*rad,y:top-5*gap,z:Math.sin(theta)*Math.min(rad,c.geometry.depthSpread*2)};
      const tp=tr.apply(base),rootId=slug(it.key)+'.'+it.instance+'.'+tr.key+'.funnel';
      N({id:rootId,label:it.def.label,type:'funnel',layer:5,lane:bi,detail:it.def.objective,objective:it.def.objective,coneScale:c.geometry.coneScale,position:pos(tp.x,tp.y,tp.z),systemKey:it.key,transform:tr.key});
      E(routeId,rootId,'route',it.def.objective);
      let p=rootId;
      it.def.steps.forEach((s,si)=>{
        const ang=(c.geometry.twistDeg*Math.PI/180)*si,dx=Math.cos(theta+ang)*1.3*si,dz=Math.sin(theta+ang)*1.3*si;
        const raw={x:base.x+dx,y:base.y-(si+1)*gap*.72,z:base.z+dz},q=tr.apply(raw),id=rootId+'.'+s[0],last=si===it.def.steps.length-1;
        N({id,label:s[1],type:last?'ballot':'step',layer:6+si,lane:bi,detail:s[2],funnel:it.def.label,position:pos(q.x,q.y,q.z),systemKey:it.key,transform:tr.key});
        E(p,id,'flow');p=id;
      });
      ballots.push(p);
      if(it.key==='needs'&&c.needs.groups&&c.needs.perGroup){
        const classify=rootId+'.classify',weights=rootId+'.weights';
        if(nodes.some(n=>n.id===classify)&&nodes.some(n=>n.id===weights)){
          for(let gi=0;gi<c.needs.groups;gi++){
            const names=NEED_GROUPS[gi][1].slice(0,c.needs.perGroup),catId=rootId+'.needcat.'+gi,ca=(gi/Math.max(1,c.needs.groups))*Math.PI*2;
            const rawHub={x:base.x+Math.cos(ca)*9,y:base.y-2.2*gap,z:base.z+Math.sin(ca)*9},hp=tr.apply(rawHub);
            N({id:catId,label:NEED_GROUPS[gi][0],type:'need-category',layer:8,lane:gi,detail:'Need category hub.',category:NEED_GROUPS[gi][0],position:pos(hp.x,hp.y,hp.z),transform:tr.key});
            E(classify,catId,'classify');
            names.forEach((name,ni)=>{
              const a=ca+(ni-names.length/2)*.05,rr=11+ni*.72,rawNeed={x:base.x+Math.cos(a)*rr,y:base.y-3*gap-(ni%2)*.28,z:base.z+Math.sin(a)*rr},np=tr.apply(rawNeed),nid=catId+'.need.'+ni;
              N({id:nid,label:name,type:'need',layer:9,lane:gi,detail:'Provisional Sebastian need.',category:NEED_GROUPS[gi][0],needNumber:gi*10+ni+1,position:pos(np.x,np.y,np.z),transform:tr.key});
              E(catId,nid,'contains');
            });
            E(catId,weights,'aggregate');
          }
        }
      }
    });
  });

  // Convergence cores: every ballot feeds every independent core, then the cores merge.
  const convergenceOut=[];
  for(let ci=0;ci<c.support.convergence;ci++){
    const def=SYSTEM_LIBRARY.convergence,x=(ci-(c.support.convergence-1)/2)*8,root='meta.'+ci+'.funnel';
    N({id:root,label:def.label+' '+(ci+1),type:'funnel',layer:10,lane:ci,detail:def.objective,coneScale:c.geometry.coneScale,position:pos(x,top-10*gap,0),systemKey:'convergence'});
    let p=root;
    def.steps.forEach((s,si)=>{const id='meta.'+ci+'.'+s[0];N({id,label:s[1],type:'meta',layer:11+si,lane:ci,detail:s[2],position:pos(x,top-(11+si)*gap*.72,0),systemKey:'convergence'});E(p,id);p=id;});
    ballots.forEach(b=>E(b,'meta.'+ci+'.collect','ballot'));
    convergenceOut.push(p);
  }
  N({id:'meta.merge',label:'Meta merge',type:'meta',layer:18,lane:0,detail:'Reconcile independent convergence cores; disagreement remains explicit.',position:pos(0,top-17*gap*.72,0)});
  convergenceOut.forEach(x=>E(x,'meta.merge','resolve'));

  // Optional interview branches loop back into all convergence collectors.
  for(let ii=0;ii<c.support.interview;ii++){
    const def=SYSTEM_LIBRARY.interview,x=14+(ii*5),root='interview.'+ii+'.funnel';
    N({id:root,label:def.label+' '+(ii+1),type:'funnel',layer:18,lane:ii,detail:def.objective,coneScale:c.geometry.coneScale,position:pos(x,top-16*gap*.72,8),systemKey:'interview'});
    E('meta.merge',root,'branch','material uncertainty');
    let p=root;
    def.steps.forEach((s,si)=>{const id='interview.'+ii+'.'+s[0];N({id,label:s[1],type:'interview',layer:19+si,lane:ii,detail:s[2],position:pos(x,top-(17+si)*gap*.72,8),systemKey:'interview'});E(p,id);p=id;});
    for(let ci=0;ci<c.support.convergence;ci++)E(p,'meta.'+ci+'.collect','feedback','re-run affected core');
  }

  const finals=[['requirements','Requirements',-3],['dependencies','Dependencies',-2],['constraints','Constraints',-1],['assumptions','Assumptions',0],['priorities','Priorities',1],['acceptance','Acceptance tests',2],['deferred','Deferred ideas',3]];
  finals.forEach(([k,l,lane])=>{const id='final.'+k;N({id,label:l,type:'final',layer:22,lane,detail:'Resolved convergence output.',position:pos(lane*6,top-20*gap*.72,0)});E('meta.merge',id,'resolve');});
  N({id:'final.merge',label:'Resolved candidate',type:'final',layer:23,lane:0,detail:'Complete candidate assembled from final bundles.',position:pos(0,top-21*gap*.72,0)});
  finals.forEach(([k])=>E('final.'+k,'final.merge'));

  // Replay chains in parallel, then merge their execution receipts.
  const receiptOut=[];
  for(let ri=0;ri<c.support.replay;ri++){
    const def=SYSTEM_LIBRARY.replay,x=(ri-(c.support.replay-1)/2)*8,root='replay.'+ri+'.funnel';
    N({id:root,label:def.label+' '+(ri+1),type:'funnel',layer:24,lane:ri,detail:def.objective,coneScale:c.geometry.coneScale,position:pos(x,top-22*gap*.72,0),systemKey:'replay'});
    E('final.merge',root,'resolve');let p=root;
    def.steps.forEach((s,si)=>{const id='replay.'+ri+'.'+s[0];const type=s[0]==='req'||s[0]==='exec'?'receipt':'replay';N({id,label:s[1],type,layer:25+si,lane:ri,detail:s[2],position:pos(x,top-(23+si)*gap*.72,0),systemKey:'replay'});E(p,id,s[0]==='req'||s[0]==='exec'?'authorize':'flow');p=id;});
    receiptOut.push(p);
  }
  N({id:'receipt.merge',label:'Execution authority',type:'receipt',layer:34,lane:0,detail:'Only receipts from valid replay chains reach execution.',position:pos(0,top-32*gap*.72,0)});
  receiptOut.forEach(r=>E(r,'receipt.merge','authorize'));

  // Execution/verifier chains in parallel, merged as evidence.
  const verifyOut=[];
  for(let ei=0;ei<c.support.execution;ei++){
    const def=SYSTEM_LIBRARY.execution,x=(ei-(c.support.execution-1)/2)*9,root='exec.'+ei+'.funnel';
    N({id:root,label:def.label+' '+(ei+1),type:'funnel',layer:35,lane:ei,detail:def.objective,coneScale:c.geometry.coneScale,position:pos(x,top-33*gap*.72,0),systemKey:'execution'});
    E('receipt.merge',root,'execute');let p=root;
    def.steps.forEach((s,si)=>{const id='exec.'+ei+'.'+s[0];N({id,label:s[1],type:'execution',layer:36+si,lane:ei,detail:s[2],position:pos(x,top-(34+si)*gap*.72,0),systemKey:'execution'});E(p,id);p=id;});
    verifyOut.push(p);
  }
  N({id:'verify.merge',label:'Verified result',type:'execution',layer:42,lane:0,detail:'Aggregate execution/verifier evidence without hiding failures.',position:pos(0,top-40*gap*.72,0)});
  verifyOut.forEach(v=>E(v,'verify.merge','evidence'));

  // Learning chains.
  for(let li=0;li<c.support.learning;li++){
    const def=SYSTEM_LIBRARY.learning,x=(li-(c.support.learning-1)/2)*8,root='learn.'+li+'.funnel';
    N({id:root,label:def.label+' '+(li+1),type:'funnel',layer:43,lane:li,detail:def.objective,coneScale:c.geometry.coneScale,position:pos(x,top-41*gap*.72,-3),systemKey:'learning'});
    E('verify.merge',root,'evidence');let p=root;
    def.steps.forEach((s,si)=>{const id='learn.'+li+'.'+s[0];N({id,label:s[1],type:'learning',layer:44+si,lane:li,detail:s[2],position:pos(x,top-(42+si)*gap*.72,-3),systemKey:'learning'});E(p,id);p=id;});
    for(const b of specialistDefs){
      for(const tr of ts){
        const rootId=slug(b.key)+'.'+b.instance+'.'+tr.key+'.funnel';
        if(nodes.some(n=>n.id===rootId))E(p,rootId,'feedback','future weighting');
      }
    }
  }
  const graph={schema:'moor.funnel-environment-graph',version:2,title:c.name,note:'Generated by MOOR Funnel Foundry from a serializable architecture config.',config:c,needCount:nodes.filter(n=>n.type==='need').length,nodes,edges};
  validateGraph(graph);
  return graph;
}
function validateGraph(g){
  if(!g||!Array.isArray(g.nodes)||!Array.isArray(g.edges))throw Error('Foundry build produced no graph.');
  const ids=new Set();for(const n of g.nodes){if(!n.id||ids.has(n.id))throw Error('Duplicate or missing node id: '+n.id);ids.add(n.id);}
  for(const e of g.edges)if(!ids.has(e.from)||!ids.has(e.to))throw Error('Dangling edge '+e.from+' -> '+e.to);
  const start='page0',goal='verify.merge',seen=new Set([start]),q=[start];
  while(q.length){const a=q.shift();for(const e of g.edges)if(e.from===a&&e.type!=='feedback'&&!seen.has(e.to)){seen.add(e.to);q.push(e.to);}}
  if(!seen.has(goal))throw Error('No executable Page 0 -> verifier path exists.');
  return true;
}
function pathCount(g,cap=100000){
  const adj=new Map(g.nodes.map(n=>[n.id,[]]));for(const e of g.edges)if(e.type!=='feedback'&&adj.has(e.from))adj.get(e.from).push(e.to);
  const memo=new Map(),visiting=new Set();
  function count(id){if(id==='verify.merge')return 1;if(memo.has(id))return memo.get(id);if(visiting.has(id))return 0;visiting.add(id);let n=0;for(const to of adj.get(id)||[]){n+=count(to);if(n>=cap){n=cap;break;}}visiting.delete(id);memo.set(id,n);return n;}
  return count('page0');
}
function utf8Bytes(s){if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(s).length;return unescape(encodeURIComponent(s)).length;}
function estimateStorage(graph,usage){
  usage=usage||graph.config&&graph.config.usage||DEFAULT_CONFIG.usage;
  const designBytes=utf8Bytes(JSON.stringify({config:graph.config,nodes:graph.nodes,edges:graph.edges}));
  const requirementNodes=graph.nodes.filter(n=>n.type==='receipt'||n.type==='live-requirement').length;
  const perRunBytes=Math.round(700+graph.nodes.length*18+graph.edges.length*16+requirementNodes*260);
  const runBytes=perRunBytes*Math.max(0,Number(usage.runsPerDay)||0)*Math.max(1,Number(usage.retentionDays)||1);
  const totalBytes=designBytes+runBytes,budgetBytes=Math.max(1,Number(usage.budgetMB)||1)*1024*1024,ratio=totalBytes/budgetBytes;
  return {designBytes,perRunBytes,runBytes,totalBytes,budgetBytes,ratio,status:ratio<.5?'green':ratio<.85?'yellow':'red'};
}
function stress(graph){
  validateGraph(graph);
  const isolated=graph.nodes.filter(n=>n.id!=='page0'&&!graph.edges.some(e=>e.from===n.id||e.to===n.id)).map(n=>n.id);
  const paths=pathCount(graph);
  const specialistRoots=graph.nodes.filter(n=>n.type==='funnel'&&['fidelity','preservation','outcome','needs','value'].includes(n.systemKey)).length;
  const convergence=graph.nodes.filter(n=>n.systemKey==='convergence'&&n.type==='funnel').length;
  const execution=graph.nodes.filter(n=>n.systemKey==='execution'&&n.type==='funnel').length;
  return {ok:isolated.length===0&&paths>0,isolated,paths,specialistRoots,convergence,execution,nodeCount:graph.nodes.length,edgeCount:graph.edges.length};
}
function addTemplate(config,t){
  const c=normalizeConfig(config),n=normalizeTemplate(t);
  const existing=c.customTemplates.find(x=>x.id===n.id);
  if(existing)Object.assign(existing,n);else c.customTemplates.push(n);
  if(c.customCounts[n.id]==null)c.customCounts[n.id]=1;
  return c;
}

return Object.freeze({
  version:1,NEED_GROUPS:clone(NEED_GROUPS),SYSTEM_LIBRARY:clone(SYSTEM_LIBRARY),DEFAULT_CONFIG:clone(DEFAULT_CONFIG),
  normalizeConfig,normalizeTemplate,addTemplate,build,validateGraph,pathCount,estimateStorage,stress
});
});