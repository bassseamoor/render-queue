const K=require('../funnel-kernel.js');

const page0='What can you do? Give me an ordered list of every operation you perform to turn a request into a result, including the sub-operations inside each step.';
const plan=K.makeUsagePlan(page0,{source:'Sebastian direct Funnel self-description audit',page:'Project Pulse / Funnel'});
console.log(JSON.stringify({
  kernel:{
    law_version:K.law_version,
    revision:K.revision,
    stages:K.stages,
    writable:K.writable
  },
  page0,
  usage_plan:plan
},null,2));
