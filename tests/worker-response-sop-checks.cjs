const assert=require('node:assert/strict');
const fs=require('node:fs');

const sop=JSON.parse(fs.readFileSync('worker-response-sop.json','utf8'));
assert.equal(sop.schema,'moor.worker-response-sop');
assert.equal(sop.version,1);

const expected=['requested','funneled','implemented','verified','merged','pulse-registered','owner-visible','deployed-live'];
assert.deepEqual(sop.states.map(x=>x.id),expected,'response state ladder drifted');
for(const s of sop.states){
  assert(s.evidence&&s.evidence.length,'state missing evidence rule '+s.id);
  assert(Array.isArray(s.allowed_claims)&&s.allowed_claims.length,'state missing allowed claims '+s.id);
  assert(Array.isArray(s.forbidden_claims),'state missing forbidden claims '+s.id);
}
for(const k of ['What changed','Highest evidence-backed state','Canonical destination','Verification evidence','Remaining gaps or explicit non-claims']){
  assert(sop.final_response_contract.required.includes(k),'response contract missing '+k);
}
assert(sop.wording_rules.some(x=>x.includes("'pushed to Pulse'")),'must explicitly forbid pushed-to-Pulse shorthand');
assert(sop.wording_rules.some(x=>x.includes("PR being open is not a merge")),'must distinguish PR from merge');
assert(sop.wording_rules.some(x=>x.includes("merge is not deployment")),'must distinguish merge from deployment');

const buster=fs.readFileSync('BUSTER.md','utf8');
assert(buster.includes('## Evidence-backed response law'));
assert(buster.includes('worker-response-sop.json'));

const funnel=fs.readFileSync('FUNNEL.md','utf8');
assert(funnel.includes('### Worker response envelope'));
assert(funnel.includes('highest state supported by independent evidence'));

const prep=fs.readFileSync('pulse-devtools/PRE_PUSH.md','utf8');
assert(prep.includes('## Reporting after push / PR'));
assert(prep.includes('PR open → say PR open'));

const canonical=fs.readFileSync('moor-spec/MOOR-BLUEPRINT-SOP.md','utf8');
assert(canonical.includes('## 6. Response discipline'));
assert(canonical.includes('requested → funneled → implemented → verified → merged → Pulse-registered → owner-visible → deployed/live'));

const blue=fs.readFileSync('blueprint-sop.html','utf8');
assert(blue.includes('<h2>Response discipline</h2>'));
assert(blue.includes('Requested → funneled → implemented → verified → merged → Pulse-registered → owner-visible → deployed/live'));

const audit=fs.readFileSync('docs/RESPONSE_AUDIT_2026-10-07.md','utf8');
for(const item of ['Trajectory','PILLAR / VALUE / RECURSION','Substrate-neutral catch-all','Environment Engine','Quick Notes','Dev Feed','MOOR value proposition']){
  assert(audit.includes(item),'retroactive audit missing '+item);
}
assert(audit.includes('overclaim at that time'),'audit must preserve and correct earlier overclaim');
assert(audit.includes('not a persisted repository artifact'),'audit must distinguish chat blueprint from repository artifact');

console.log('PASS: Worker Response SOP binds reporting claims to evidence and audits prior chat work without rewriting history.');
