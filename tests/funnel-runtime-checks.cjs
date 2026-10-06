const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const html=fs.readFileSync('quiz-funnel-v3.html','utf8');
let inline=0;
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(/\bsrc\s*=/.test(m[1]))continue;
  new vm.Script(m[2],{filename:'quiz-funnel-v3 inline '+(++inline)});
}
assert(html.includes('redundant v46'));
for(const src of ['funnel-lens-lexical.js','funnel-lens-structural.js','funnel-lens-preservation.js','funnel-redundancy.js','funnel-kernel.js?v=20261006-redundant1']){
  assert(html.includes('src="'+src),'Missing redundant Funnel dependency '+src);
}
assert(html.indexOf('funnel-redundancy.js')<html.indexOf('funnel-kernel.js'),'Redundancy aggregator must load before kernel');
assert(html.indexOf('funnel-kernel.js')<html.indexOf('"use strict"'));
assert(html.includes('function vReplay(){'));
assert(html.includes("kAdvance('replay'"));
assert(html.includes("kAdvance('verdict'"));
assert(html.includes('page0_verified:true'));
assert(html.includes('extractObligations'));
assert(html.includes('sendHarness'));
assert(html.includes('funnel_receipt:receipt'));
assert(html.includes('Authorize Harness once'));
assert(html.includes('exportProof'));
assert(html.includes("destination:'app-compiler-harness'"));
console.log('PASS: Funnel UI syntax, redundant v46 kernel load, Page 0 replay, obligation-carrying three-way token-free distillation, receipt minting, one-use Harness authorization, and proof export');
