/* MOOR Funnel Reference Search — shared retrieval machinery.
 * One module for: request -> reference queries -> search accumulated knowledge -> reuse before new.
 * Used by: funnel-usage-plan-core (query generation), pulse-spine searchReferences (scoring),
 *           moor-request referencePacket (via PulseReferences.packet -> spine).
 * Scoring = token overlap (legacy weights) + curated tag overlap (for_ai registry:
 * prov:/cat:/see:/kind:) + relations-graph expansion. No embeddings, no network calls here;
 * callers supply tag data (or it degrades gracefully to token-only scoring).
 * Funnel receipt 5e7551e22f32f22f (2026-10-07).
 *
 * TAGS: kind:component | cat:creation | prov:semantic-reference-retrieval |
 *       see:funnel-kernel see:funnel-usage-plan-core see:pulse-spine |
 *       src:funnel-usage-plan-core.js src:pulse-spine.js |
 */
(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FunnelReferenceSearch=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';

/* Minimal stop set for query generation: only true function words.
 * (Deliberately NOT the usage-plan core's domain-boilerplate set: for retrieval,
 * domain terms like "funnel"/"build" are signal, not noise. TF-ranking already
 * demotes boilerplate by frequency instead of by fiat.) */
var STOP=new Set(['the','a','an','of','to','in','on','at','by','it','its','and','or','for','with','from','that','this','these','those','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','could','can','may','might','must','shall','what','when','where','which','who','whom','whose','how','why','i','you','he','she','we','they','them','his','her','our','their','me','my','your','as','if','then','than','so','such','no','not','only','own','same','too','very','just','into','using']);
function text(x){return String(x==null?'':x);}
function tokens(q){return text(q).toLowerCase().split(/[^a-z0-9]+/).filter(function(t){return t.length>1;});}
function stem(t){
  t=text(t).toLowerCase();
  if(t.length>5){
    if(/ies$/.test(t))return t.slice(0,-3)+'y';
    if(/(ing|edly)$/.test(t))return t.slice(0,-3);
    if(/ly$/.test(t))return t.slice(0,-2);
    if(/ed$/.test(t))return t.slice(0,-2);
    if(/s$/.test(t))return t.slice(0,-1);
  }
  return t;
}
function tagSegments(tag){
  return text(tag).toLowerCase().split(/[^a-z0-9]+/).filter(function(s){return s.length>1;}).map(stem);
}
function uniq(a){var s={},o=[];a.forEach(function(x){if(!s[x]){s[x]=1;o.push(x);}});return o;}

/* Query generation from the semantic core.
 * The old behavior (first 8 raw words of Page 0) produced boilerplate queries
 * ("page production request preserved verbatim..."). Instead: rank keywords by
 * term frequency (repeated terms are the semantic core; boilerplate appears once),
 * then compose queries from top terms + detected surfaces + material targets +
 * obligation-hint phrases.
 */
function rankedKeywords(raw,limit){
  var freq={},order={};
  tokens(raw).forEach(function(t){
    if(STOP.has(t)||t.length<3)return;
    if(!freq[t]){freq[t]=0;order[t]=Object.keys(freq).length;}
    freq[t]++;
  });
  return Object.keys(freq).sort(function(a,b){
    return (freq[b]-freq[a])||(b.length-a.length)||(order[a]-order[b]);
  }).slice(0,limit||12);
}
function surfaceWords(surface){
  return text(surface).split(/[-_]/).filter(function(w){return w.length>2&&!STOP.has(w);});
}
function buildQueriesFromText(raw,analysis){
  analysis=analysis||{};
  var qs=[];
  function push(q){q=text(q).trim().replace(/\s+/g,' ');if(q&&qs.indexOf(q)<0&&qs.length<8)qs.push(q);}
  var kws=rankedKeywords(raw,12);
  if(kws.length)push(kws.slice(0,6).join(' '));
  (analysis.surfaces||[]).forEach(function(s){
    var sw=surfaceWords(s);
    if(sw.length)push(sw.concat(kws.slice(0,3)).join(' '));
  });
  (analysis.material_targets||[]).forEach(function(t){
    var tw=text(t).split(/[-_]/).filter(function(w){return w.length>2;});
    if(tw.length)push(tw.join(' '));
  });
  (analysis.obligation_hints||[]).slice(0,3).forEach(function(h){
    var hw=tokens(h).filter(function(w){return !STOP.has(w)&&w.length>2;}).slice(0,6);
    if(hw.length>1)push(hw.join(' '));
  });
  if(!qs.length&&kws.length)push(kws.join(' '));
  return qs;
}

/* Tag data: normalize the for_ai registry into {byFile:{file->[tags]}, relations:{id->{see:[],feeds:[],fed_by:[]}}} */
function normalizeTags(registry){
  registry=registry||{};
  var byFile={},items=registry.items||{},index=registry.index||{};
  Object.keys(items).forEach(function(id){
    var it=items[id]||{},f=text(it.file||it.panel_source||'');
    if(f)byFile[f]=uniq((byFile[f]||[]).concat(it.tags||[]));
  });
  // also invert the tag index: tag -> files (covers entries keyed differently)
  Object.keys(index).forEach(function(tag){
    (index[tag]||[]).forEach(function(id){
      var it=items[id]||{},f=text(it.file||it.panel_source||'');
      if(f){byFile[f]=byFile[f]||[];if(byFile[f].indexOf(tag)<0)byFile[f].push(tag);}
    });
  });
  return {byFile:byFile,relations:registry.relations||{}};
}
function tagsForFile(tagData,file){
  if(!tagData||!tagData.byFile)return [];
  var f=text(file);
  if(tagData.byFile[f])return tagData.byFile[f];
  // fuzzy: match by basename
  var base=f.split('/').pop();
  var keys=Object.keys(tagData.byFile);
  for(var i=0;i<keys.length;i++){
    if(keys[i].split('/').pop()===base)return tagData.byFile[keys[i]];
  }
  return [];
}

/* Scoring: legacy token weights + curated tag overlap + (in search) relations boost. */
function scoreDoc(qtokens,doc){
  doc=doc||{};
  var hay=text(doc.text).toLowerCase(),score=0;
  var tags=doc.tags||[],segCache={};
  qtokens.forEach(function(raw){
    var t=text(raw).toLowerCase(),st=stem(t);
    if(hay.indexOf(t)>=0)score+=t.length>6?4:2;
    else if(st!==t&&hay.indexOf(st)>=0)score+=2;
    var matched=false;
    tags.forEach(function(tag){
      var segs=segCache[tag]||(segCache[tag]=tagSegments(tag));
      if(segs.indexOf(st)>=0)matched=true;
    });
    if(matched)score+=6; // curated tag match outweighs raw text
  });
  return score;
}
function search(queries,docs,opts){
  opts=opts||{};
  var tagData=opts.tagData||null,relations=(tagData&&tagData.relations)||{};
  var agg={},i,q;
  (queries||[]).forEach(function(query){
    var qts=tokens(query);
    (docs||[]).forEach(function(d){
      var s=scoreDoc(qts,d);
      if(s>0)agg[d.id]=(agg[d.id]||0)+s;
    });
  });
  var ranked=Object.keys(agg).map(function(id){return {id:id,score:agg[id]};})
    .sort(function(a,b){return b.score-a.score;});
  // relations-graph expansion: boost docs related to the current top 3
  var boosted={},top=ranked.slice(0,3);
  top.forEach(function(r){
    var rel=relations[r.id]||{};
    ['see','feeds','fed_by'].forEach(function(k){
      (rel[k]||[]).forEach(function(other){
        if(agg[other]&&!boosted[other]){boosted[other]=1;agg[other]+=3;}
      });
    });
  });
  if(Object.keys(boosted).length){
    ranked=Object.keys(agg).map(function(id){return {id:id,score:agg[id]};})
      .sort(function(a,b){return b.score-a.score;});
  }
  var limit=opts.limit||30;
  return ranked.slice(0,limit);
}

return Object.freeze({
  version:1,
  tokens:tokens, stem:stem, tagSegments:tagSegments,
  rankedKeywords:rankedKeywords,
  buildQueriesFromText:buildQueriesFromText,
  normalizeTags:normalizeTags, tagsForFile:tagsForFile,
  scoreDoc:scoreDoc, search:search
});
});
