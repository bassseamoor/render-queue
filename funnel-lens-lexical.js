(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MOORFunnelLensLexical=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function norm(s){return String(s||'').toLowerCase().replace(/\bi\s+(?:don't|do not)\s+know\b/g,'').replace(/\bi(?:'m| am)\s+not\s+sure\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();}
function split(raw){return String(raw||'').split(/(?:\n+|(?<=[.!?;])\s+)/).map(x=>x.trim()).filter(Boolean);}
function extract(raw){
  const cue=/\b(must|need(?:s)?|should|have to|has to|gotta|make sure|ensure|never|cannot|can't|want(?:s)?|required?|prevent(?:s|ed|ing)?|forbid(?:s|den|ding)?|block(?:s|ed|ing)?|lock(?:s|ed|ing)?|seal(?:s|ed|ing)?|force(?:s|d|ing)?|protect(?:s|ed|ing)?|disable(?:s|d|ing)?|create|build|make|add|remove|fix|separate|redundan(?:t|cy))\b/i;
  return split(raw).filter(s=>cue.test(norm(s))).map(source=>({lens:'lexical',source,normalized:norm(source),confidence:1}));
}
return Object.freeze({id:'lexical-v1',extract});
});