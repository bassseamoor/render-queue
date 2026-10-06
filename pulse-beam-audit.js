/* Pulse Beam Audit v1 — migration/readiness + no-loss receipts. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.PulseBeamAudit=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const KEY='moor-pulse-beam-audit-v1';let cache=null;
function clone(x){return x==null?x:JSON.parse(JSON.stringify(x));}
function blank(){return {version:1,components:{},events:[],updated_at:null}}
function read(){if(cache)return cache;try{const x=JSON.parse(root.localStorage.getItem(KEY)||'null');if(x&&x.version)cache=x}catch(e){}return cache=blank()}
function save(){const s=read();s.updated_at=new Date().toISOString();try{root.localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}return clone(s)}
function record(id,data){id=String(id||'unknown');const s=read(),prior=s.components[id]||{};s.components[id]=Object.assign({},prior,clone(data||{}),{component_id:id,updated_at:new Date().toISOString()});s.events.push({id,type:'audit',at:new Date().toISOString(),level:s.components[id].level||null,parity:!!s.components[id].parity});if(s.events.length>1500)s.events=s.events.slice(-1500);save();try{root.dispatchEvent&&root.dispatchEvent(new CustomEvent('beam:audit',{detail:clone(s.components[id])}))}catch(e){}return clone(s.components[id])}
function get(id){return clone(read().components[String(id||'')]||null)}
function markNative(id,evidence){const prior=get(id)||{};if(!evidence||evidence.parity!==true||evidence.mobile_safe!==true||evidence.touch_safe!==true)throw Error('Beam-native promotion requires parity + mobile + touch evidence.');return record(id,Object.assign({},prior,{level:'beam-native',native_evidence:clone(evidence),parity:true,mobile_safe:true,touch_safe:true}))}
function summary(totalIds){const s=read(),rows=Object.values(s.components),total=Array.isArray(totalIds)?totalIds.length:Math.max(rows.length,Number(totalIds)||0);const count=x=>rows.filter(x).length;return {
 total,
 legacy_compatible:count(r=>r.level==='legacy-compatible'),
 audited:count(r=>r.level==='beam-audited'||r.level==='beam-native'),
 beam_native:count(r=>r.level==='beam-native'),
 mobile_safe:count(r=>r.mobile_safe===true),
 touch_safe:count(r=>r.touch_safe===true),
 no_loss_parity_passed:count(r=>r.parity===true),
 overflow_issues:count(r=>r.horizontal_overflow===true),
 external_unadapted:count(r=>r.level==='external-unadapted'),
 pending:Math.max(0,total-count(r=>!!r.level))
}}
function snapshot(){return clone(read())}
return Object.freeze({version:1,record,get,markNative,summary,snapshot,save});
});