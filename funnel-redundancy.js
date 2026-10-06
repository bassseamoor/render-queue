(function(root,factory){
  var api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MOORFunnelRedundancy=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
function get(name,path){
  if(root&&root[name])return root[name];
  if(typeof require==='function')return require(path);
  throw Error('Missing Funnel redundancy lens: '+name);
}
const L=[
  get('MOORFunnelLensLexical','./funnel-lens-lexical.js'),
  get('MOORFunnelLensStructural','./funnel-lens-structural.js'),
  get('MOORFunnelLensPreservation','./funnel-lens-preservation.js')
];
function stable(x){
  if(x===null||typeof x!=='object')return JSON.stringify(x);
  if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
  return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
}
function hash(x){
  const s=typeof x==='string'?x:stable(x);let a=2166136261>>>0,b=0x9e3779b9>>>0;
  for(let i=0;i<s.length;i++){a^=s.charCodeAt(i);a=Math.imul(a,16777619)>>>0;b^=(s.charCodeAt(i)+(i&255));b=Math.imul(b,2246822519)>>>0;}
  return ('00000000'+a.toString(16)).slice(-8)+('00000000'+b.toString(16)).slice(-8);
}
function toks(s){return new Set(String(s||'').split(/\s+/).filter(x=>x.length>2));}
function overlap(a,b){
  const A=toks(a),B=toks(b);if(!A.size||!B.size)return 0;let hit=0;
  for(const x of A)if(B.has(x))hit++;
  return hit/Math.min(A.size,B.size);
}
function analyze(raw){
  const outputs=L.map(l=>({lens:l.id,items:l.extract(raw)}));
  const clusters=[];
  for(const out of outputs)for(const item of out.items){
    let c=clusters.find(x=>overlap(x.normalized,item.normalized)>=0.58);
    if(!c){c={normalized:item.normalized,sources:[],lenses:[]};clusters.push(c);}
    c.sources.push(item.source);if(!c.lenses.includes(out.lens))c.lenses.push(out.lens);
    if(item.normalized.length>c.normalized.length)c.normalized=item.normalized;
  }
  const union=clusters.map(c=>{
    const source=c.sources.slice().sort((a,b)=>a.length-b.length)[0]||'';
    return {id:'obligation:'+hash(c.normalized),source,normalized:c.normalized,support:c.lenses.length,lenses:c.lenses.slice().sort()};
  }).sort((a,b)=>a.source.localeCompare(b.source));
  const consensus=union.filter(x=>x.support>=2);
  const disagreements=union.filter(x=>x.support===1);
  const core={version:1,lenses:outputs.map(x=>x.lens),union,consensus,disagreements};
  return Object.freeze(Object.assign({},core,{fingerprint:hash(core)}));
}
return Object.freeze({version:1,lenses:L.map(x=>x.id),analyze,hash});
});