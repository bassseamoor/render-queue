(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.MOORDevFeed=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const SCHEMA='moor.dev-feed-ledger';
const VERSION=1;
const STAGES=['requested','funneled','blueprint','building','verified','pulse','main','owner-visible'];

function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function stageIndex(s){return STAGES.indexOf(String(s||''));}
function latestStage(item){
  if(!item||!Array.isArray(item.events)||!item.events.length)return null;
  return item.events.reduce((best,e)=>stageIndex(e.stage)>stageIndex(best.stage)?e:best,item.events[0]);
}
function validateEvent(e){
  const errors=[];
  if(!e||typeof e!=='object')return ['event missing'];
  if(!String(e.id||'').trim())errors.push('event id required');
  if(stageIndex(e.stage)<0)errors.push('invalid stage '+e.stage);
  if(!String(e.at||'').trim())errors.push('timestamp required');
  if(!String(e.status||'').trim())errors.push('status required');
  if(!String(e.source||'').trim())errors.push('source required');
  return errors;
}
function validateLedger(x){
  const errors=[];
  if(!x||x.schema!==SCHEMA)errors.push('wrong schema');
  if(!x||x.version!==VERSION)errors.push('wrong version');
  if(!x||!Array.isArray(x.items))errors.push('items missing');
  else{
    const ids=new Set(),eventIds=new Set();
    x.items.forEach((item,i)=>{
      if(!String(item.id||'').trim())errors.push('item '+i+' missing id');
      else if(ids.has(item.id))errors.push('duplicate item '+item.id); else ids.add(item.id);
      if(!String(item.title||'').trim())errors.push('item '+item.id+' missing title');
      if(!Array.isArray(item.events)||!item.events.length)errors.push('item '+item.id+' missing events');
      else item.events.forEach(e=>{
        validateEvent(e).forEach(err=>errors.push(item.id+': '+err));
        if(e&&e.id){if(eventIds.has(e.id))errors.push('duplicate event '+e.id);else eventIds.add(e.id);}
      });
    });
  }
  return {ok:errors.length===0,errors};
}
function normalizeLedger(x){
  const v=validateLedger(x); if(!v.ok)throw new Error(v.errors.join('; '));
  return clone(x);
}
function itemState(item){
  const ev=latestStage(item);
  const stages=new Set((item.events||[]).filter(e=>e.status==='complete'||e.status==='verified').map(e=>e.stage));
  const desiredPulse=item.expected_destination==='Project Pulse'||item.expected_destination==='Pulse';
  const gap = [];
  if(item.artifact_exists===true && desiredPulse && !stages.has('pulse'))gap.push('artifact-exists-not-in-pulse');
  if(stages.has('main') && !stages.has('owner-visible'))gap.push('merged-not-owner-visible');
  if(stages.has('verified') && !stages.has('main') && item.merge_expected!==false)gap.push('verified-not-main');
  return {
    latest_stage:ev&&ev.stage||null,
    latest_status:ev&&ev.status||'unknown',
    stages:[...stages],
    gap,
    owner_visible:stages.has('owner-visible')
  };
}
function summarize(ledger){
  const l=normalizeLedger(ledger),out={items:[],counts:{total:0,gaps:0,owner_visible:0}};
  l.items.forEach(item=>{
    const state=itemState(item);
    out.items.push({...clone(item),state});
    out.counts.total++;
    if(state.gap.length)out.counts.gaps++;
    if(state.owner_visible)out.counts.owner_visible++;
  });
  return out;
}
function pipelineLabel(stage){
  return {
    requested:'Requested',funneled:'Funnel',blueprint:'Blueprint',building:'Build',
    verified:'Verified',pulse:'Pulse',main:'Main',owner-visible:'Owner visible'
  }[stage]||stage;
}
function githubCommitToEvent(c){
  return {
    id:'github-commit:'+String(c.sha||'').slice(0,12),stage:'main',status:'observed',
    at:c.commit&&c.commit.author&&c.commit.author.date||'',
    source:'GitHub commit',
    worker:c.author&&c.author.login||c.commit&&c.commit.author&&c.commit.author.name||'unknown',
    title:c.commit&&c.commit.message&&c.commit.message.split('\n')[0]||'commit',
    ref:c.html_url||null
  };
}
function githubPullToEvent(pr){
  let stage='building',status='open';
  if(pr.merged_at){stage='main';status='complete';}
  else if(pr.closed_at){stage='verified';status='closed-without-merge';}
  return {
    id:'github-pr:'+pr.number,stage,status,at:pr.updated_at||pr.created_at||'',
    source:'GitHub pull request',worker:pr.user&&pr.user.login||'unknown',
    title:'#'+pr.number+' '+pr.title,ref:pr.html_url||null
  };
}
return Object.freeze({SCHEMA,VERSION,STAGES,stageIndex,latestStage,validateEvent,validateLedger,normalizeLedger,itemState,summarize,pipelineLabel,githubCommitToEvent,githubPullToEvent});
});