/* Pure graph operations. A build edge orders work; it never proves implementation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BlueprintGraph=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clone=x=>JSON.parse(JSON.stringify(x));
 const cardColors=[
  {id:'ruby',label:'Ruby',fill:'#64283b'},{id:'coral',label:'Coral',fill:'#763b38'},
  {id:'copper',label:'Copper',fill:'#704624'},{id:'amber',label:'Amber',fill:'#63511d'},
  {id:'olive',label:'Olive',fill:'#4a5526'},{id:'lime',label:'Lime',fill:'#365b2a'},
  {id:'emerald',label:'Emerald',fill:'#23533c'},{id:'teal',label:'Teal',fill:'#205854'},
  {id:'cyan',label:'Cyan',fill:'#235363'},{id:'sky',label:'Sky',fill:'#2c4f73'},
  {id:'blue',label:'Blue',fill:'#304583'},{id:'indigo',label:'Indigo',fill:'#443c7b'},
  {id:'violet',label:'Violet',fill:'#573975'},{id:'purple',label:'Purple',fill:'#68396b'},
  {id:'magenta',label:'Magenta',fill:'#74334f'},{id:'slate',label:'Slate',fill:'#424e5c'}
 ];
 const colorIds=new Set(cardColors.map(c=>c.id));
 function colorLabel(g,id){return g.colorKey?.[id]??(g.funnel&&(typeof BlueprintFunnel!=='undefined'?BlueprintFunnel.grades[id]?.label:null))??cardColors.find(c=>c.id===id)?.label??'';}
 function setCardColor(g,id,colorId){const n=g.nodes.find(n=>n.id===id);if(!n)throw Error('Card no longer exists.');if(colorId==null)delete n.colorId;else{if(!colorIds.has(colorId))throw Error('Unknown card color.');n.colorId=colorId;}return g;}
 function renameColor(g,id,label){if(!colorIds.has(id))throw Error('Unknown key color.');if(typeof label!=='string'||!label.trim()||label.trim().length>80)throw Error('Color names need 1–80 characters.');g.colorKey={...(g.colorKey||{}),[id]:label.trim()};return g;}
 const types=['build','flow','related','contains','risk'];
 const key=e=>[e.fromId,e.toId,e.type].join('|');
 function order(g){
  const ids=g.nodes.map(n=>n.id), degree=new Map(ids.map(id=>[id,0])), next=new Map(ids.map(id=>[id,[]])), levels=new Map(ids.map(id=>[id,0]));
  for(const e of g.edges.filter(e=>e.type==='build')){if(!degree.has(e.fromId)||!degree.has(e.toId))throw Error('A dependency points to a missing card.');degree.set(e.toId,degree.get(e.toId)+1);next.get(e.fromId).push(e.toId);}
  const ready=ids.filter(id=>degree.get(id)===0),sorted=[];
  while(ready.length){const id=ready.shift();sorted.push(id);for(const target of next.get(id)){levels.set(target,Math.max(levels.get(target),levels.get(id)+1));degree.set(target,degree.get(target)-1);if(!degree.get(target))ready.push(target);}}
  if(sorted.length!==ids.length)throw Error('Build dependencies form a cycle. Use a flow or related link for a feedback loop.');
  return {ids:sorted,levels,ready:ids.filter(id=>!(g.edges.some(e=>e.type==='build'&&e.toId===id)))};
 }
 function validate(g){
  if(!g||g.schema!=='moor.whole-product-blueprint'||g.version!==1||!Array.isArray(g.nodes)||!Array.isArray(g.edges))throw Error('Expected a MOOR whole-product blueprint, schema version 1.');
  if(g.nodes.length>10000||g.edges.length>50000)throw Error('Import exceeds the supported map size.');
  for(const n of g.nodes)if(n.colorId!=null&&!colorIds.has(n.colorId))throw Error('Unknown card color.');
  if(g.colorKey!=null){if(typeof g.colorKey!=='object'||Array.isArray(g.colorKey))throw Error('Invalid color key.');for(const [id,label] of Object.entries(g.colorKey))if(!colorIds.has(id)||typeof label!=='string'||!label.trim()||label.length>80)throw Error('Invalid color key label.');}
  const ids=new Set();for(const n of g.nodes){if(typeof n.id!=='string'||!n.id||ids.has(n.id))throw Error('Card IDs must be nonempty and unique.');ids.add(n.id);if(typeof n.title!=='string'||typeof n.overview!=='string')throw Error('Each card needs a title and overview.');if(n.reference!=null&&typeof n.reference!=='string')throw Error('Reference code must be text.');for(const k of ['sources','alternatives','tradeoffs','acceptance','risks','questions'])if(n[k]!=null&&!Array.isArray(n[k]))throw Error('Card '+k+' must be an array.');if(n.ports&&(!Array.isArray(n.ports.in)||!Array.isArray(n.ports.out)))throw Error('Input and output contracts must be arrays.');}
  for(const n of g.nodes)if(n.parent&&!ids.has(n.parent))throw Error('A card points to a missing parent.');
  const seen=new Set();for(const e of g.edges){if(!ids.has(e.fromId)||!ids.has(e.toId))throw Error('An imported connection points to a missing card.');if(e.fromId===e.toId)throw Error('A card cannot depend on itself.');if(!types.includes(e.type))throw Error('Unknown connection type.');if(seen.has(key(e)))throw Error('Duplicate connections must be consolidated.');seen.add(key(e));if(e.type==='build'&&e.contract!=='order'&&!compatible(g,e))throw Error('Incompatible port contract: '+e.contract);}
  if(g.sources){if(!Array.isArray(g.sources)||g.sources.some(s=>typeof s.id!=='string'||typeof s.title!=='string'))throw Error('Invalid source ledger.');}
  for(const k of ['decisions','execution','inventory','tombstones','changelog'])if(g[k]!=null&&!Array.isArray(g[k]))throw Error('Invalid '+k+' collection.');
  if(g.offer&&(!Array.isArray(g.offer.parties)||!Array.isArray(g.offer.notPromises)||g.offer.parties.some(p=>!Array.isArray(p.gains)||!Array.isArray(p.costs))))throw Error('Invalid product offer.');
  if(g.funnel){const F=typeof module==='object'&&module.exports?require('./funnel-core.js'):globalThis.BlueprintFunnel;if(!F)throw Error('Funnel validator unavailable.');F.validate(g);}
  order(g);return g;
 }
 function compatible(g,e){const a=g.nodes.find(n=>n.id===e.fromId),b=g.nodes.find(n=>n.id===e.toId);return !!(a&&b&&(e.contract==='order'||(a.ports?.out||[]).includes(e.contract)&&(b.ports?.in||[]).includes(e.contract)));}
 function addEdge(g,fromId,toId,type='build',contract='order',reason='Owner connection'){const e={id:'edge:'+fromId+'>'+toId+':'+type,fromId,toId,type,contract,reason,basis:'owner edit',review:false};if(g.edges.some(x=>key(x)===key(e)))return g;if(type==='build'&&!compatible(g,e))throw Error('The selected ports do not share this contract. Add an explicit adapter.');g.edges.push(e);validate(g);return g;}
 function remove(g,id){
  const n=g.nodes.find(n=>n.id===id);if(!n)throw Error('Card no longer exists.');
  const incoming=g.edges.filter(e=>e.toId===id&&e.type==='build'),outgoing=g.edges.filter(e=>e.fromId===id&&e.type==='build'),removed=g.edges.filter(e=>e.fromId===id||e.toId===id);
  g.nodes=g.nodes.filter(n=>n.id!==id);g.edges=g.edges.filter(e=>e.fromId!==id&&e.toId!==id);
  const unresolved=[];
  for(const a of incoming)for(const b of outgoing){const e={id:'bridge:'+a.fromId+'>'+b.toId,fromId:a.fromId,toId:b.toId,type:'build',contract:a.contract===b.contract?a.contract:'adapter-required',reason:'Order reconnected after removing '+n.title+'. Removed responsibilities still require review.',basis:'automatic reconnection',review:true,removedObligations:[n.id]};if(compatible(g,e)){const existing=g.edges.find(x=>key(x)===key(e));if(existing){existing.review=true;existing.removedObligations=[...new Set([...(existing.removedObligations||[]),n.id])];}else g.edges.push(e);}else unresolved.push(e);}
  for(const child of g.nodes.filter(x=>x.parent===id)){child.parent=null;child.questions=[...(child.questions||[]),'Parent '+n.title+' was removed. Decide where this responsibility belongs.'];}
  g.tombstones=g.tombstones||[];g.tombstones.push({node:n,edges:removed,unresolved,removedAt:new Date().toISOString()});validate(g);return g;
 }
 function insert(g,node,edgeKeys){
  if(!edgeKeys.length)throw Error('Choose at least one build connection to split.');const edges=edgeKeys.map(k=>g.edges.find(e=>key(e)===k));if(edges.some(e=>!e||e.type!=='build'))throw Error('Insertion needs existing build connections.');
  g.nodes.push(node);g.edges=g.edges.filter(e=>!edgeKeys.includes(key(e)));
  for(const e of edges){addEdge(g,e.fromId,node.id,'build',e.contract,'Inserted before '+e.toId);addEdge(g,node.id,e.toId,'build',e.contract,'Inserted after '+e.fromId);}validate(g);return g;
 }
 function transact(g,fn,description){const next=clone(g);fn(next);validate(next);next.revision=(g.revision||0)+1;next.changelog=[...(g.changelog||[]),{at:new Date().toISOString(),description,revision:next.revision}];return next;}
 function visibleEdges(g,visible){
  const ids=new Set(visible),out=[],seen=new Set(),build=g.edges.filter(e=>e.type==='build');
  for(const fromId of ids){const queue=build.filter(e=>e.fromId===fromId).map(e=>({id:e.toId,path:[e],via:[]}));const visited=new Set();while(queue.length){const x=queue.shift();if(visited.has(x.id))continue;visited.add(x.id);if(ids.has(x.id)){const e={...x.path[0],fromId,toId:x.id,id:'visible:'+fromId+'>'+x.id,via:x.via,review:x.path.some(e=>e.review),reason:x.via.length?'Summarized order through '+x.via.length+' hidden cards.':x.path[0].reason};if(fromId!==x.id&&!seen.has(key(e))){out.push(e);seen.add(key(e));}}else for(const e of build.filter(e=>e.fromId===x.id))queue.push({id:e.toId,path:[...x.path,e],via:[...x.via,x.id]});}}
  return out;
 }
 return {clone,key,types,validate,order,compatible,addEdge,remove,insert,transact,visibleEdges,cardColors,colorLabel,setCardColor,renameColor};
});
