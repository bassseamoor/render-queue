// Recovery guards for the two failures that disabled Pulse navigation.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const html = read('pulse-dashboard.html');
let scripts = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
  if (/\bsrc\s*=|\btype\s*=\s*["']application\/json/.test(match[1])) continue;
  new vm.Script(match[2], { filename: `pulse-dashboard inline ${++scripts}` });
}
const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
assert.equal((markup.match(/<\/body\s*>/gi) || []).length, 1, 'Tool source must not close the dashboard body');
assert.equal((markup.match(/<\/html\s*>/gi) || []).length, 1);
for (const file of ['pulse-workspace.js', 'pulse-spine.js', 'funnel-kernel.js', 'moor-request.js', 'pulse-component-extensions.js', 'pulse-ultrafeedback.js', 'pulse-training-blueprints-11.js']) {
  assert(html.includes(`src="${file}`), `Missing ${file} hook`);
  new vm.Script(read(file), { filename: file });
}
assert.equal(html.match(/var PULSE_VERSION='([^']+)'/)[1], read('pulse-version.txt').trim());
assert(read('AGENTS.md').includes('/FUNNEL.md'), 'AGENTS.md must route agents to FUNNEL.md');
assert(read('FUNNEL.md').includes('MOOR.request'), 'FUNNEL.md must identify MOOR.request');
const agent=JSON.parse(read('moor-agent.json'));
assert.equal(agent.entrypoint, 'MOOR.request');
assert.equal(agent.funnel.kernel, 'funnel-kernel.js');
assert.equal(agent.funnel.execution_receipt, 'moor.funnel-receipt');
assert(html.indexOf('funnel-kernel.js')<html.indexOf('moor-request.js'), 'Funnel kernel must load before request router');
const sourceBlock = html.match(/window\.SEED_CONSOLE_SRC = ([^\n]+);/)[1];
new vm.Script(JSON.parse(sourceBlock), { filename: 'embedded Seed Console source' });

// Simulate observer delivery: a decorator that writes unchanged content keeps
// enqueuing itself forever. It must settle, including while the inbox is open.
const spine = read('pulse-spine.js');
const decorate = spine.slice(spine.indexOf('function decorateFunnel(){'), spine.indexOf('function toggleInbox('));
let pending = 0;
const badge = { _text: '', get textContent(){ return this._text; }, set textContent(v){ this._text=v; pending++; } };
const panel = { set innerHTML(v){ this.markup=v; pending++; } };
const top = { querySelector: () => badge };
const state = { funnelInbox: [] };
const context = vm.createContext({ S: state, document: { querySelector: selector => selector.endsWith('.pf-top') ? top : panel }, esc2: s => String(s) });
vm.runInContext(decorate, context);
function drain(){
  pending++;
  let deliveries=0;
  while(pending){
    assert(++deliveries<10, 'Funnel decoration causes an infinite observer loop');
    pending=0;
    vm.runInContext('decorateFunnel()', context);
  }
}
drain();
assert.equal(badge.textContent, 'Inbox 0');
state.funnelInbox.push({ record: { title: 'A new component', kind: 'component', source: 'Bin' } });
drain();
assert.equal(badge.textContent, 'Inbox 1');
assert(panel.markup.includes('A new component'));
console.log(`PASS: ${scripts} inline scripts, embedded Seed Console, extension hooks, release version, and Funnel observer settling`);
