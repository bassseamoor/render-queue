const assert=require('node:assert/strict');
const fs=require('node:fs');
const Q=require('../quick-notes-core.js');

let s=Q.blankState();
assert.equal(s.schema,'moor.quick-notes');
let f1=Q.createFolder(s,'Work',Q.ROOT);s=f1.state;
let f2=Q.createFolder(s,'Ideas',f1.folder.id);s=f2.state;
assert.equal(Q.children(s,Q.ROOT)[0].name,'Work');
assert.equal(Q.children(s,f1.folder.id)[0].name,'Ideas');

let n=Q.createNote(s,f2.folder.id);s=n.state;
s=Q.updateNote(s,n.note.id,{title:'Test note',body:'hello world'});
assert.equal(Q.noteById(s,n.note.id).body,'hello world');
assert.equal(Q.notesInFolder(s,f2.folder.id,'hello').length,1);
assert.equal(Q.notesInFolder(s,f2.folder.id,'missing').length,0);

const json=Q.exportState(s);
const imported=Q.importState(json);
assert.equal(imported.notes.length,1);
assert.equal(imported.folders.length,2);

s=Q.deleteFolder(s,f1.folder.id);
assert.equal(s.folders.length,0);
assert.equal(Q.noteById(s,n.note.id).folderId,Q.ROOT,'folder deletion must preserve note by moving it to root');

const html=fs.readFileSync('quick-notes.html','utf8');
for(const needle of ['quick-notes-core.js','environment-engine-core.js','Paste or type anything','New folder','Search notes']){
  assert(html.includes(needle),'quick-notes.html missing '+needle);
}
const ext=fs.readFileSync('pulse-component-extensions.js','utf8');
assert(ext.includes('"id":"quick-notes"'),'Pulse catalog missing Quick Notes');
const build=fs.readFileSync('build_pulse_v2.py','utf8');
assert(build.includes("'quick-notes':"),'Pulse rebuild preservation missing Quick Notes');
const manifest=JSON.parse(fs.readFileSync('pulse-manifest.json','utf8'));
assert(manifest.items&&manifest.items['quick-notes'],'Pulse manifest missing Quick Notes');
console.log('PASS: Quick Notes supports nested folders, preserved notes, search, simple editing surface, and Pulse registration.');
