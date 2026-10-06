const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('pulse-beam-funnel-hall.html','utf8');
const js=fs.readFileSync('pulse-beam-funnel-hall.js','utf8');

assert(html.includes('factory-twin-core.js'),'Citadel must load canonical Factory Twin runtime');
assert(js.includes("twin.schema==='moor.factory-twin-snapshot'"),'renderer must require a valid Twin snapshot');
assert(js.includes('twin.spatial_bindings'),'semantic floor must consume Twin spatial bindings');
assert(js.includes('(twin.machines||[])'),'displayed capability machines must originate from TwinMachine records');
assert(js.includes('(twin.routes||[])'),'displayed factory connections must originate from TwinRoute records');
assert(js.includes('(twin.work_orders||[])'),'displayed WIP must originate from TwinWorkOrder records');
assert(js.includes("n.source==='capability-memory'"),'tool-crib projection must use capability-memory Twin entities');
assert(js.includes("twinBindings.get('work-order:'"),'work-order position must resolve its Twin spatial binding');
assert(js.includes('TWIN INVALID'),'invalid snapshot must fail visibly');
assert(!js.includes('const factoryNodes=(factory.nodes||[])'),'renderer must not independently create displayed machines from raw factory graph');
assert(!js.includes('const wipOrders=(plant.orders||[])'),'renderer must not independently create displayed WIP from raw plant state');

console.log('PASS: DT-02 Citadel semantic floor renders machines, routes and WIP from validated FactoryTwinSnapshot records/bindings and fails visibly on invalid Twin state.');
