/* MOOR Blueprint Comparison Core v1 — BF-02
 * Read-only planning analysis. It never releases work or mints authority.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorBlueprintComparison=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const STOP=new Set('a an and are as at be by for from has have how in into is it of on or should that the their this to what when where which who why with without'.split(' '));
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function arr(x){return Array.isArray(x)?x:[];}
function words(x){return [...new Set(String(x||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(w=>w.length>2&&!STOP.has(w)))];}
function overlap(a,b){const A=new Set(words(a)),B=new Set(words(b));if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.max(1,new Set([...A,...B]).size);}
function negativeText(x){return /^(?:do not|don't|no |not |never |cannot|can't|avoid |without )/i.test(String(x||'').trim());}
function interfaceKey(x){const from=x.from||x.source||x.owner||'?',to=x.to||x.use||x.target||'?';return String(from).toLowerCase().trim()+' → '+String(to).toLowerCase().trim();}
function compile(entries){
  entries=arr(entries).map(e=>({id:String(e.id),title:e.title||e.id,blueprint:clone(e.blueprint||{})}));
  const question_queue=[],question_clusters=[],claims=[],interfaces=[],sliceIds=new Set(),slices=[],lineage=[];
  for(const e of entries){
    const bp=e.blueprint;
    arr(bp.openQuestions).forEach((q,i)=>{
      const text=typeof q==='string'?q:q.question||JSON.stringify(q);
      const row={question_id:e.id+':q'+String(i+1).padStart(2,'0'),blueprint_id:e.id,blueprint_title:e.title,text};
      question_queue.push(row);
      let cluster=question_clusters.find(c=>overlap(c.canonical,text)>=.58);
      if(!cluster){cluster={cluster_id:'cluster:'+(question_clusters.length+1),canonical:text,questions:[]};question_clusters.push(cluster)}
      cluster.questions.push(row.question_id);
    });
    arr(bp.assumptions).forEach((text,i)=>claims.push({claim_id:e.id+':assumption:'+i,blueprint_id:e.id,kind:'assumption',polarity:negativeText(text)?'negative':'positive',text:String(text)}));
    arr(bp.nonGoals).forEach((text,i)=>claims.push({claim_id:e.id+':non-goal:'+i,blueprint_id:e.id,kind:'non-goal',polarity:'negative',text:String(text)}));
    arr(bp.interfaces).forEach((x,i)=>interfaces.push({interface_id:e.id+':interface:'+i,blueprint_id:e.id,key:interfaceKey(x),data:clone(x)}));
    arr(bp.implementationSlices).forEach(s=>{if(s&&s.id){sliceIds.add(String(s.id));slices.push({blueprint_id:e.id,...clone(s)})}});
    arr(bp.supersedes).forEach(x=>lineage.push({from:e.id,to:String(x),type:'blueprint-supersedes'}));
    arr(bp.implementationSlices).forEach(s=>arr(s&&s.supersedes).forEach(x=>lineage.push({from:String(s.id),to:String(x),type:'slice-supersedes'})));
  }
  const tensions=[];
  for(let i=0;i<claims.length;i++)for(let j=i+1;j<claims.length;j++){
    const a=claims[i],b=claims[j];if(a.blueprint_id===b.blueprint_id||a.polarity===b.polarity)continue;
    const similarity=overlap(a.text,b.text);if(similarity>=.48)tensions.push({type:'potential-assumption-tension',a:a.claim_id,b:b.claim_id,similarity:+similarity.toFixed(3),a_text:a.text,b_text:b.text});
  }
  const interface_overlaps=[];
  const byKey={};for(const x of interfaces)(byKey[x.key]||(byKey[x.key]=[])).push(x);
  for(const [key,items] of Object.entries(byKey))if(items.length>1)interface_overlaps.push({key,interfaces:items.map(x=>x.interface_id),blueprints:[...new Set(items.map(x=>x.blueprint_id))]});
  const dependency_defects=[];
  for(const s of slices)for(const dep of arr(s.dependsOn))if(!sliceIds.has(String(dep)))dependency_defects.push({slice_id:s.id,blueprint_id:s.blueprint_id,missing_dependency:String(dep)});
  return {
    schema:'moor.blueprint-comparison-report',version:1,authority:'read-only/no-release',
    summary:{blueprints:entries.length,open_questions:question_queue.length,question_clusters:question_clusters.length,potential_tensions:tensions.length,interface_overlaps:interface_overlaps.length,dependency_defects:dependency_defects.length,lineage_edges:lineage.length},
    question_queue,question_clusters,tensions,interface_overlaps,dependency_defects,lineage
  };
}
return Object.freeze({version:1,compile,overlap});
});
