const assert=require('node:assert/strict');
const FRS=require('../funnel-reference-search-core.js');
const UP=require('../funnel-usage-plan-core.js');

// Stemming: morphological variants match ("procedurally" -> "procedural")
assert.equal(FRS.stem('procedurally'),'procedural');
assert.deepEqual(FRS.tagSegments('prov:procedural-funnel-generation'),['prov','procedural','funnel','generation']);

// Curated tag match outweighs raw text match
const tagDoc={id:'a',text:'unrelated words here',tags:['prov:procedural-funnel-generation']};
const textDoc={id:'b',text:'funnel stuff here',tags:[]};
assert(FRS.scoreDoc(['funnel'],tagDoc)>FRS.scoreDoc(['funnel'],textDoc),'tag match should outweigh text-only match');

// Query generation is boilerplate-free (regression: first-8-words produced
// "page production request preserved verbatim...")
const qs=UP.referenceQueries('Build it using the funnel');
assert(qs.length>0&&qs.length<=8);
assert(!qs.some(q=>/page production request preserved verbatim/.test(q)),'queries must not be Page 0 boilerplate: '+JSON.stringify(qs));
assert(qs.some(q=>/funnel/.test(q)),'queries must carry content terms: '+JSON.stringify(qs));

// End-to-end: the retrieval benchmark incident (2026-10-07). The Funnel Fabric
// must surface as high-relevance from pre-recall state.
const manifest=require('../pulse-manifest.json');
const tagData=FRS.normalizeTags(require('../pulse-tags.json'));
const docs=manifest.tools.map(t=>({id:t.id,text:((t.label||'')+' '+(t.what_it_does||'')).toLowerCase(),tags:FRS.tagsForFile(tagData,t.panel_source||'')}));
docs.push({id:'blueprint/funnel-fabric.blueprint.json',text:'moor recursive funnel fabric procedurally generate funnels',tags:['prov:procedural-funnel-generation','see:funnel-kernel','cat:creation']});
[['Build it using the funnel'],['Make MOOR handle my funnel intake automatically. When I drop in a messy request, it should plan the right funnel, search everything already built, and reuse before building new.']].forEach(([input])=>{
  const ranked=FRS.search(UP.referenceQueries(input),docs,{tagData,limit:50});
  const pos=ranked.findIndex(r=>/fabric/.test(r.id));
  assert(pos>=0&&pos<3,'funnel-fabric must rank top-3 for "'+input.slice(0,40)+'...", got '+(pos+1));
});

// Graceful degradation: empty/missing inputs never throw
assert.deepEqual(FRS.search([],[],{}),[]);
assert.equal(FRS.scoreDoc([],{text:'x',tags:[]}),0);
assert.deepEqual(FRS.buildQueriesFromText(''),[]);
assert.deepEqual(FRS.tagsForFile(null,'x'),[]);

console.log('PASS: shared retrieval — stemming, tag-weighted scoring, boilerplate-free queries, funnel-fabric top-3, graceful degradation');
