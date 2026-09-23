// Prevent a return to inline monoliths, duplicate entry points, and shipped backups.
// Run: node --experimental-vm-modules tests/fireplace/modules.test.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const dir=path.join(root,'studios/fireplace');
const html=fs.readFileSync(path.join(root,'fireplace.html'),'utf8');
assert.equal([...html.matchAll(/<script\b/g)].length,1,'The shell must have one entry point');
assert.match(html,/<script type="module" src="studios\/fireplace\/main\.js"><\/script>/);
assert.ok(Buffer.byteLength(html)<4096,'The page must remain a small shell');
for(const name of ['fireplace.js','fireplace-render.js'])assert.ok(!fs.existsSync(path.join(root,name)),name+' must stay in Git history only');
const modules=new Map(),sources=new Map();
function walk(d){for(const item of fs.readdirSync(d,{withFileTypes:true})){const f=path.join(d,item.name);if(item.isDirectory())walk(f);else if(f.endsWith('.js')){const src=fs.readFileSync(f,'utf8');sources.set(f,src);modules.set(f,new vm.SourceTextModule(src,{identifier:f}));if(!f.endsWith('export/mp4-muxer.js'))assert.ok(Buffer.byteLength(src)<32768,'Split growing responsibilities in '+f);}}}
walk(dir);
const graph=new Map();
for(const [f,m]of modules){const specs=[...m.dependencySpecifiers,...[...sources.get(f).matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map(x=>x[1])];const deps=specs.map(s=>{assert.ok(s.startsWith('.'),'Use explicit local dependencies: '+s);const dep=path.resolve(path.dirname(f),s);assert.ok(modules.has(dep),'Missing dependency '+dep);return dep;});graph.set(f,deps);}
const visiting=new Set(),done=new Set();
function visit(f,stack=[]){assert.ok(!visiting.has(f),'Import cycle: '+[...stack,f].join(' → '));if(done.has(f))return;visiting.add(f);for(const d of graph.get(f))visit(d,[...stack,f]);visiting.delete(f);done.add(f);}
visit(path.join(dir,'main.js'));
assert.equal(done.size,modules.size,'Every module must be reachable from the entry; remove abandoned files');
const staticSeen=new Set();function staticVisit(f){if(staticSeen.has(f))return;staticSeen.add(f);for(const s of modules.get(f).dependencySpecifiers)staticVisit(path.resolve(path.dirname(f),s));}
staticVisit(path.join(dir,'studio.js'));
assert.ok(!staticSeen.has(path.join(dir,'export/mp4-muxer.js')),'The video library must not load on ordinary preview visits');
const firstParty=[...sources].filter(([f])=>!f.endsWith('export/mp4-muxer.js'));
for(const name of ['frameLoop','tickFrame'])assert.equal(firstParty.reduce((n,[,s])=>n+[...s.matchAll(new RegExp('function\\s+'+name+'\\s*\\(','g'))].length,0),1,'One owner for '+name);
for(const[f,s]of firstParty)if(!f.endsWith('core/clock.js'))assert.ok(!/requestAnimationFrame\(frameLoop\)/.test(s),'Clock ownership violated in '+f);
for(const[f,s]of sources)assert.ok(!/\bfrom\s*['"][^'"]*(?:archive|legacy|backup)/i.test(s),'No archive fallback in '+f);
for(const[f,m]of modules)if(m.status==='unlinked')await m.link((s,ref)=>modules.get(path.resolve(path.dirname(ref.identifier),s)));
console.log(`PASS ${modules.size} modules: valid syntax/exports, local imports, acyclic graph, one entry/loop, lazy MP4, no legacy files.`);
console.log('GPU rendering and video encoding are not exercised by this structural check.');
