const assert=require('node:assert/strict');
const fs=require('node:fs');
const Engine=require('../environment-engine-core.js');

const blueprint=JSON.parse(fs.readFileSync('blueprint/environment-engine-canonical-presentation.blueprint.json','utf8'));
assert.equal(Engine.studios.length,8,'all eight ambient studios must inform the engine');
assert.equal(Engine.qualityLaws.length>=10,true,'quality law set is unexpectedly thin');

const a=Engine.compile({seed:'CANON-TEST',profile:'canonical',hours:8,fps:30});
const b=Engine.compile({seed:'CANON-TEST',profile:'canonical',hours:8,fps:30});
assert.deepEqual(a,b,'same seed/profile must produce the same recipe');
assert.equal(Engine.validateRecipe(a).ok,true);
assert.equal(a.composition.depthPlanes,8);
assert.equal(a.export.totalSeconds,28800);
assert.equal(a.export.segmentCount,8);
assert.deepEqual(a.export.segments.map(x=>x.offsetSeconds),[0,3600,7200,10800,14400,18000,21600,25200]);
assert(a.export.segments.every(x=>x.seconds===3600));
assert(a.export.segments.every(x=>x.query.offset===String(x.offsetSeconds)));
assert.equal(a.export.continuity.fixedStep,true);

const contract=blueprint.advancement_contract;
assert.equal(Engine.validateContract(contract).ok,true);
const evidence={};
Engine.requiredGates.forEach(k=>evidence[k]=true);
assert.equal(Engine.advancementGate(evidence,contract).ready,true);
delete evidence.rendered_inspection;
const blocked=Engine.advancementGate(evidence,contract);
assert.equal(blocked.ready,false);
assert(blocked.missing.includes('rendered_inspection'));
assert.throws(()=>Engine.advance(a,evidence,contract,{profile:'world'}),/advancement blocked/i);

const promotedEvidence={};
Engine.requiredGates.forEach(k=>promotedEvidence[k]=true);
const next=Engine.advance(a,promotedEvidence,contract,{profile:'world'});
assert.equal(next.profile.id,'world');
assert.equal(next.supersedes.seedHash,a.seedHash);
assert.equal(next.advancementEvidence.length,Engine.requiredGates.length);

const html=fs.readFileSync('environment-engine.html','utf8');
for(const required of ['environment-engine-core.js','environment-engine-render.js','environment-engine-canonical-presentation.blueprint.json','Funnel contract loaded','8-hour deterministic plan']){
  assert(html.includes(required),'Environment Engine page missing '+required);
}
const render=fs.readFileSync('environment-engine-render.js','utf8');
assert(render.includes('for(int i=0;i<8;i++)'),'renderer must visibly implement eight depth planes');
assert(render.includes('prefers-reduced-motion'),'renderer must respect reduced motion');

const extensions=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(extensions.includes('"id":"environment-engine"'),'Pulse extension registry missing Environment Engine');
const build=fs.readFileSync('build_pulse_v2.py','utf8');
assert(build.includes("'environment-engine'"),'Pulse rebuild preservation missing Environment Engine');
const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
assert(manifest.items&&manifest.items['environment-engine'],'Pulse manifest missing Environment Engine');

console.log('PASS: Environment Engine deterministic recipes, 8h segmented plan, Funnel advancement gate, live renderer contract and Pulse registration.');
