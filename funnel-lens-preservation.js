(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MOORFunnelLensPreservation=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function norm(s){return String(s||'').toLowerCase().replace(/\bi\s+(?:don't|do not)\s+know\b/g,'').replace(/\bi(?:'m| am)\s+not\s+sure\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function extract(raw){
  const src=String(raw||''), sentences=src.split(/(?:\n+|(?<=[.!?;])\s+)/).map(x=>x.trim()).filter(Boolean);
  const protectedIdeas=/\b(page\s*0|funnel|receipt|claim|harness|builder|compiler|owner|password|signature|hard[- ]coded|redundan(?:t|cy)|isolated|llm|tokens?|same question|skip(?:ping)?|edit(?:ing)?|immutable|proof|guard(?:ian)?)\b/i;
  const constraint=/\b(without|prevent|block|seal|lock|never|cannot|can't|must|need|should|same|separate|isolated|redundan(?:t|cy)|hard[- ]coded|do not|don't|only)\b/i;
  return sentences.filter(s=>protectedIdeas.test(s)&&constraint.test(s))
    .map(source=>({lens:'preservation',source,normalized:norm(source),confidence:1}));
}
return Object.freeze({id:'preservation-v1',extract});
});