// Extract the original renderers; never copy a second implementation by hand.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'pulse-dashboard.html'),'utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].filter(m=>!m[1].includes('src=')).map(m=>m[2]);
const common=['window.TerrainCore =','/* seed-rng','window.SeedCodec ='];
const defs={'terrain-core':'terrain','terrain-field':'field','planet-vegetation':'vegetation','softbody-creatures':'creatures','comp-proc-vehicles':'vehicles','comp-furniture':'furniture'};
fs.mkdirSync(path.join(root,'wonder-previews'),{recursive:true});
for(const [id,tool] of Object.entries(defs)){
 const source=scripts.find(s=>new RegExp('TOOLS\\.'+tool+'\\s*=').test(s));
 if(!source)throw Error('Renderer missing: '+tool);
 const deps=common.map(marker=>scripts.find(s=>s.includes(marker)));
 if(tool==='field')deps.push(scripts.find(s=>s.includes('window.FIELD_GLSL =')));
 if(deps.some(s=>!s))throw Error('Missing dependencies: '+tool);
 fs.writeFileSync(path.join(root,'wonder-previews',id+'.js'),deps.join('\n')+'\n'+source+'\nwindow.WONDER_PREVIEW_TOOL='+JSON.stringify(tool)+';\n');
}
console.log('Generated six isolated bundles from current Pulse renderers.');
