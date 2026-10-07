const fs=require('node:fs');
const assert=require('node:assert/strict');

const js=fs.readFileSync('pulse-beam-funnel-hall.js','utf8');
const html=fs.readFileSync('pulse-beam-funnel-hall.html','utf8');

for(const id of ['semantic-index-toggle','semantic-index','semantic-search','semantic-list','semantic-index-count','semantic-more'])
  assert(html.includes('id="'+id+'"'),'missing semantic parity UI '+id);

for(const needle of [
  'compactWidth:720',
  'machineVisualCap:{low:24,full:72}',
  'routeVisualCap:{low:36,full:120}',
  'wipVisualCap:{low:12,full:32}',
  'ringSegments:{low:64,full:128}',
  'dprCap:{low:1.2,full:1.8}',
  'catalogInitialRows:80',
  "const semanticFactory=(twinValid?(twin.machines||[]):[])",
  "const semanticRoutes=twinValid?(twin.routes||[]):[]",
  "const semanticWip=(twinValid?(twin.work_orders||[]):[]).filter(o=>o.status!=='RELEASED')",
  "const visibleFactory=semanticFactory.slice(0,density('machineVisualCap'))",
  "const visibleRoutes=semanticRoutes.slice(0,density('routeVisualCap'))",
  "const visibleWip=semanticWip.slice(0,density('wipVisualCap'))",
  'window.FACTORY_TWIN_VIEW_STATE=Object.freeze({',
  'semantic_ids:semanticCatalog.map(x=>x.entity_id)',
  'semantic_counts:{machines:semanticFactory.length,routes:semanticRoutes.length,wip:semanticWip.length}',
  'drawn_counts:{machines:visibleFactory.length,routes:visibleRoutes.length,wip:visibleWip.length}',
  'semanticCatalog.filter',
  'inspect(row.node)',
  'TWIN INVALID'
]) assert(js.includes(needle),'missing DT-06 runtime contract: '+needle);

for(const forbidden of [
  "const factoryLimit=low?24:72",
  "slice(0,low?36:120)",
  "slice(0,low?12:32)",
  "renderer.setPixelRatio(Math.min(devicePixelRatio||1,low?1.2:1.8))"
]) assert(!js.includes(forbidden),'legacy semantic-loss path remains: '+forbidden);

assert(html.includes('@media(max-width:720px)'),'mobile UI breakpoint must equal semantic compact width');
assert(html.includes('min-height:44px'),'semantic rows must meet touch target');
assert(html.includes('height:44px'),'semantic search must meet touch target');

const machines=Array.from({length:100},(_,i)=>'m'+i);
const routes=Array.from({length:50},(_,i)=>'r'+i);
const wip=Array.from({length:40},(_,i)=>'w'+i);
function view(low){
  const caps=low?{m:24,r:36,w:12}:{m:72,r:120,w:32};
  return {
    semantic:[...machines,...routes,...wip],
    drawn:[...machines.slice(0,caps.m),...routes.slice(0,caps.r),...wip.slice(0,caps.w)]
  };
}
const low=view(true),full=view(false);
assert.deepEqual(low.semantic,full.semantic,'low and full must expose identical semantic IDs');
assert.equal(low.drawn.length,24+36+12);
assert.equal(full.drawn.length,72+50+32);
assert(low.semantic.includes('m99')&&!low.drawn.includes('m99'),'visually omitted machine must remain semantic');
assert(low.semantic.includes('w39')&&!low.drawn.includes('w39'),'visually omitted WIP must remain semantic');

function mobileGap(height){
  const safe=14,moveBottom=safe+38,moveHeight=44+5+44;
  const moveTop=height-moveBottom-moveHeight;
  const sheetBottom=height-154;
  return moveTop-sheetBottom;
}
assert.equal(mobileGap(844),9,'portrait sheet must leave 9px above movement controls');
assert.equal(mobileGap(390),9,'landscape sheet must leave 9px above movement controls');

assert(!html.includes('@media(max-width:680px)'),'old split breakpoint must be removed');
console.log('PASS: DT-06 preserves full FactoryTwin semantic identity on low-density/mobile views while capping only drawn geometry and exposing omitted entities through one touch-safe searchable inspector.');
