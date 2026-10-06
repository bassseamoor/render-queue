const assert=require('node:assert/strict');
const Compare=require('../blueprint-comparison-core.js');
const lib=require('../pulse-blueprint-farm-library.json');
const byId={
  master:require('../blueprint/blueprint-farm.blueprint.json'),
  'funnel-maintenance-modernization':require('../blueprint/funnel-maintenance-modernization.blueprint.json'),
  'factory-digital-twin':require('../blueprint/factory-digital-twin.blueprint.json'),
  'seeded-procedural-toolchain':require('../blueprint/seeded-procedural-toolchain.blueprint.json'),
  'worker-execution-orchestration':require('../blueprint/worker-execution-orchestration.blueprint.json'),
  'blueprint-choreography':require('../blueprint/blueprint-choreography.blueprint.json')
};
const entries=lib.blueprints.map(x=>({id:x.id,title:x.title,blueprint:byId[x.id]}));
assert(entries.every(x=>x.blueprint),'all farm blueprints must be analyzable');
const r=Compare.compile(entries);
assert.equal(r.schema,'moor.blueprint-comparison-report');
assert.equal(r.authority,'read-only/no-release');
assert.equal(r.summary.blueprints,lib.blueprints.length);
assert(r.summary.open_questions>=30,'BF-02 must aggregate the real unresolved-question inventory');
assert.equal(r.question_queue.length,r.summary.open_questions);
assert(r.question_queue.every(q=>q.blueprint_id&&q.question_id&&q.text),'questions must retain source attribution');
assert(r.question_clusters.every(c=>c.questions.length>=1));
assert(Array.isArray(r.tensions)&&Array.isArray(r.interface_overlaps)&&Array.isArray(r.dependency_defects)&&Array.isArray(r.lineage));
assert(!Object.prototype.hasOwnProperty.call(Compare,'release'),'comparison core must not release work');
assert(!Object.prototype.hasOwnProperty.call(Compare,'execute'),'comparison core must not execute work');
console.log(JSON.stringify({pass:true,summary:r.summary,first_questions:r.question_queue.slice(0,3)},null,2));
