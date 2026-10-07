const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('quiz-funnel-v3.html','utf8');
let inline=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=/.test(m[1]))continue;
  new vm.Script(m[2],{filename:'quiz-funnel-v3 inline '+(++inline)});
}
assert(html.includes('sealed v44'));
assert(html.includes('funnel-usage-plan-core.js'));
assert(html.includes("stage:'usage_plan'")||html.includes("stage:'usage_plan',"));
assert(html.includes('makeUsagePlan'));
assert(html.includes('src="funnel-kernel.js'));
assert(html.indexOf('funnel-kernel.js')<html.indexOf('"use strict"'));
assert(html.includes('function vReplay(){'));
assert(html.includes("kAdvance('replay'"));
assert(html.includes("kAdvance('verdict'"));
assert(html.includes('page0_verified:true'));
assert(html.includes('extractObligations'));
assert(html.includes('sendHarness'));
assert(html.includes('funnel_receipt:receipt'));
assert(html.includes("destination:'app-compiler-harness'"));
console.log('PASS: Funnel UI syntax, sealed kernel load, Page 0 replay, receipt minting, and Harness handoff guards');
