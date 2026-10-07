/* MOOR Seed Substream Core v1 — PG-03
 * Names deterministic child streams without owning/replacing the RNG.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MoorSeedSubstream=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SCHEME='semantic-key-v1';
const PREFIX='moor:subseed:v1:';
function copy(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function parts(input){
  const xs=(Array.isArray(input)?input:[input]).map(x=>String(x==null?'':x));
  if(!xs.length||xs.some(x=>!x))throw Error('semantic sub-seed key parts must be non-empty strings');
  return xs;
}
function describe(rootSeed,keyParts){
  const root=String(rootSeed==null?'':rootSeed);
  if(!root)throw Error('root seed required');
  const keys=parts(keyParts);
  return {scheme:SCHEME,root_seed:root,key_parts:keys,seed_string:PREFIX+JSON.stringify([root,keys])};
}
function seed(rootSeed,keyParts){return describe(rootSeed,keyParts).seed_string}
function stream(rootSeed,keyParts,streamFrom){
  if(typeof streamFrom!=='function')throw Error('streamFrom function required');
  return streamFrom(seed(rootSeed,keyParts));
}
return Object.freeze({version:1,scheme:SCHEME,prefix:PREFIX,describe,seed,stream});
});
