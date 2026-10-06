(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MOORFunnelLensStructural=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function norm(s){return String(s||'').toLowerCase().replace(/\bi\s+(?:don't|do not)\s+know\b/g,'').replace(/\bi(?:'m| am)\s+not\s+sure\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function clauses(raw){
  const out=[];
  for(const sentence of String(raw||'').split(/(?:\n+|(?<=[.!?;])\s+)/)){
    const s=sentence.trim();if(!s)continue;
    const bits=s.split(/\s+(?:but|while|except|unless|so that|because)\s+|\s*,\s*(?=(?:but|while|except|unless)\b)/i).map(x=>x.trim()).filter(Boolean);
    out.push(...(bits.length?bits:[s]));
  }
  return out;
}
function extract(raw){
  const hard=/\b(without|only|exact(?:ly)?|same|separate|isolated|hard[- ]coded|skip(?:ping)?|edit(?:ing)?|tokens?|llm|funnel|prevent|block|lock|seal|must|need|should|never|cannot|can't|do not|don't)\b/i;
  const action=/\b(create|build|make|use|run|distill|separate|prevent|block|lock|seal|edit|skip|require|allow|deny)\b/i;
  return clauses(raw).filter(s=>{const n=norm(s);return hard.test(n)&&(action.test(n)||/\bwithout\b/.test(n));})
    .map(source=>({lens:'structural',source,normalized:norm(source),confidence:1}));
}
return Object.freeze({id:'structural-v1',extract});
});