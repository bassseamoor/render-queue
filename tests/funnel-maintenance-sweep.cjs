const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const reportOnly=process.argv.includes('--report-only');
const stations=[
  {id:'page0-v44',tests:['tests/funnel-kernel-checks.cjs','tests/moor-request-checks.cjs'],critical:true},
  {id:'page0-ultra',tests:['tests/funnel-law-ultra-checks.cjs'],critical:true},
  {id:'ultra-society',tests:['tests/funnel-law-ultra-checks.cjs','tests/sebastian-solver-checks.cjs'],critical:false},
  {id:'ultra-capabilities',tests:['tests/funnel-law-ultra-checks.cjs'],critical:false},
  {id:'ultra-budgets',tests:['tests/funnel-law-ultra-checks.cjs'],critical:false},
  {id:'refinery-handoff',tests:['tests/refinery-creation-deck-checks.cjs'],critical:false},
  {id:'harness-gate',tests:['tests/harness-funnel-gate-checks.cjs','tests/moor-request-checks.cjs'],critical:true},
  {id:'pulse-beam-shell',tests:['tests/pulse-beam-checks.cjs'],critical:false},
  {id:'funnel-citadel',tests:['tests/pulse-beam-laser-citadel-checks.cjs'],critical:false},
  {id:'factory-accumulation',tests:['tests/factory-accumulation-checks.cjs'],critical:false},
  {id:'software-manufacturing',tests:['tests/software-manufacturing-checks.cjs','tests/software-manufacturing-machine-ultra-run.cjs'],critical:false},
  {id:'software-factory-ledger',tests:['tests/software-factory-core-checks.cjs','tests/moor-request-factory-checks.cjs'],critical:true},
  {id:'factory-digital-twin',tests:['tests/factory-twin-core-checks.cjs','tests/pulse-beam-laser-citadel-checks.cjs'],critical:false},
  {id:'ultra-human-runtime',tests:['tests/funnel-runtime-checks.cjs'],critical:false}
];

function runTest(file){
  const started=Date.now();
  try{
    const out=cp.execFileSync(process.execPath,[file],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],timeout:120000});
    return {file,pass:true,duration_ms:Date.now()-started,output:String(out||'').trim().split('\n').slice(-3)};
  }catch(e){
    const stdout=String(e.stdout||'').trim(),stderr=String(e.stderr||'').trim();
    return {file,pass:false,duration_ms:Date.now()-started,output:(stdout+'\n'+stderr).trim().split('\n').slice(-6)};
  }
}

const results=stations.map(st=>{
  const tests=st.tests.map(runTest);
  return {
    id:st.id,
    critical:st.critical,
    pass:tests.every(t=>t.pass),
    tests,
    passed:tests.filter(t=>t.pass).length,
    total:tests.length
  };
});
const failed=results.filter(x=>!x.pass),criticalFailed=failed.filter(x=>x.critical);
const report={
  schema:'moor.funnel-maintenance-live',
  version:1,
  generated_at:new Date().toISOString(),
  commit_sha:process.env.GITHUB_SHA||null,
  source:'independent maintenance sweep',
  overall:criticalFailed.length?'critical-failure':failed.length?'degraded':'pass',
  counts:{stations:results.length,passed:results.length-failed.length,failed:failed.length,critical_failed:criticalFailed.length},
  results
};
fs.writeFileSync(path.join(root,'funnel-maintenance-live.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({overall:report.overall,counts:report.counts,failed:failed.map(x=>x.id)},null,2));
if(!reportOnly&&failed.length)process.exitCode=1;
