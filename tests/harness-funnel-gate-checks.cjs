const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('moor-harness-runtime-v1.html','utf8');
let inline=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=/.test(m[1]))continue;
  new vm.Script(m[2],{filename:'moor-harness inline '+(++inline)});
}
assert(html.includes('src="funnel-kernel.js'));
assert(html.indexOf('funnel-kernel.js')<html.indexOf('<script>'));
assert(html.includes('HARNESS_INBOX_KEY="moor-harness-inbox-v1"'));
assert(html.includes('k.verifyReceipt(receipt)'));
assert(html.includes('k.hash(String(input||""))===receipt.page0_hash'));
assert(html.includes('function harnessExecutionGate(){'));
assert(html.includes('async function executeJob(job,spec){\n  if(!harnessExecutionGate())return false;'));
assert(html.includes('async function executeIntegration(job,spec){\n  if(!harnessExecutionGate())return false;'));
assert(html.includes('async function runBuild(){\n  if(!harnessExecutionGate())return;'));
assert(html.includes('function doPromote(){\n  if(!harnessExecutionGate())return;'));
assert(html.includes('await routeRawIntakeToFunnel(r,{mode:"build"})'));
assert(html.includes('await routeRawIntakeToFunnel(r,{mode:"modify",base_version:H.canon})'));
assert(html.includes('await routeRawIntakeToFunnel(SAMPLE_RAMBLE,{mode:"demo"})'));
assert(!html.includes('H.ramble=r; H.spec=compileSpec(r); H.stage="spec"'),'Raw Harness intake bypass must stay removed');
assert(html.includes('obligations:clone(spec.funnel_obligations||[])'));
assert(html.includes('H.workOrderId=h.work_order_id||null'),'Harness must preserve the manufacturing work order from the verified handoff');
assert(html.includes('work_order_id:H.workOrderId||null'),'Harness output must return to the same software factory traveler');
console.log('PASS: Harness syntax, verified inbox, exact Page 0 receipt binding, worker/build/promotion gates, manufacturing traveler return, and raw-intake anti-bypass guards');
