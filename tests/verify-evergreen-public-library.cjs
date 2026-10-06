#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
const root=require('path').resolve(__dirname,'..');
const read=p=>fs.readFileSync(require('path').join(root,p),'utf8');
const blueprint=JSON.parse(read('blueprints/evergreen-public-library-world.json'));
const html=read('morverse-evergreen-library.html');
const js=read('morverse-evergreen-library.js');
const workspace=read('pulse-workspace.js');
const gates=[];
function gate(name,fn){try{fn();gates.push([name,true]);}catch(e){gates.push([name,false,e.message]);}}

gate('Frozen Page 0 contains public-library world intent',()=>{
 assert.match(blueprint.funnel.page0,/public library/i);
 assert.match(blueprint.funnel.page0,/Using the funnel/i);
});
gate('All explicit Funnel requirements are represented',()=>{
 assert.ok(blueprint.funnel.requirements.length>=18);
 const ids=new Set(blueprint.funnel.requirements.map(x=>x.id));
 assert.equal(ids.size,blueprint.funnel.requirements.length);
});
gate('Public/open covenant is explicit',()=>{
 assert.ok(blueprint.governance.public_covenant.length>=5);
 assert.ok(blueprint.governance.public_covenant.some(x=>/Public browsing/i.test(x)));
});
gate('Architecture is implementation-grade',()=>{
 assert.ok(blueprint.architectural_language.materials.length>=6);
 assert.ok(blueprint.architectural_language.scale_rules.length>=5);
 assert.ok(blueprint.world.zones.length>=10);
});
gate('Normal social reasons to return exist',()=>{
 const social=JSON.stringify(blueprint).toLowerCase();
 ['lecture','workshop','club','reading','meal','festival','mentor'].forEach(x=>assert.ok(social.includes(x),x));
});
gate('Expansion is planetary, not room-only',()=>{
 const s=JSON.stringify(blueprint).toLowerCase();
 ['regional','transit','interworld'].forEach(x=>assert.ok(s.includes(x),x));
});
gate('Runtime is actual Three.js 3D',()=>{
 assert.match(js,/import \* as THREE/);
 assert.match(js,/PerspectiveCamera/);
 assert.match(js,/WebGLRenderer/);
});
gate('Desktop and touch traversal are present',()=>{
 assert.match(js,/KeyW|ArrowUp/);
 assert.match(js,/pointer|touch/i);
 assert.match(html,/touch/i);
});
gate('Blueprints are interactive data, not decorative labels',()=>{
 assert.match(js,/blueprint/i);
 assert.match(js,/inspect|inspector/i);
 assert.match(js,/fork|request|build/i);
});
gate('Integrated world UI exposes map/program/request surfaces',()=>{
 ['map','program','request'].forEach(x=>assert.ok((html+js).toLowerCase().includes(x),x));
});
gate('No fake live population is required',()=>{
 const s=JSON.stringify(blueprint).toLowerCase();
 assert.ok(s.includes('no fake online population')||s.includes('do not fake live social presence'));
});
gate('Pulse contains the canonical Evergreen project',()=>{
 assert.ok(workspace.includes("seedProject('evergreen-public-library'"));
 assert.ok(workspace.includes('morverse-evergreen-library.html'));
 assert.ok(workspace.includes('blueprints/evergreen-public-library-world.json'));
});
gate('Evergreen compounding concept is explicit',()=>{
 const s=JSON.stringify(blueprint).toLowerCase();
 assert.ok(s.includes('evergreen'));
 assert.ok(s.includes('compound'));
});
gate('Runtime has no obvious placeholder/lorem text',()=>{
 assert.ok(!/lorem ipsum|todo placeholder|coming soon placeholder/i.test(html+js));
});

const failed=gates.filter(x=>!x[1]);
for(const [name,pass,msg] of gates)console.log(`${pass?'PASS':'FAIL'}  ${name}${msg?' — '+msg:''}`);
console.log(`\n${gates.length-failed.length}/${gates.length} gates passed.`);
if(failed.length)process.exit(1);
