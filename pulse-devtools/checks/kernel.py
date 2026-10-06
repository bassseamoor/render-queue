"""Tier 3: kernel-check — "the funnel verifies itself".
Downloads funnel-kernel.js from repo HEAD and, in Node:
  1. LAW_VERSION must be v44-sealed.
  2. Opens a test request, advances page0->references->distill->decisions->
     replay->verdict, mints a receipt, verifies it.
  3. Verifies the kernel REJECTS a skipped stage (order lock).
If the funnel's own law is broken, nothing built through it can be trusted.
"""
import subprocess
import harness

NODE_TEST = r"""
const K = require('/tmp/kernel-check.js');
const out = {};
out.law = K.law_version;
const id = 'selftest-' + Date.now();
let s = K.open({request_id: id, input: 'Test the kernel. It must work.'});
s = K.advance({request_id: id, stage: 'references', payload: {reused: [], missing: []}});
s = K.advance({request_id: id, stage: 'distill', payload: {spec_draft: 'a test spec'}});
s = K.advance({request_id: id, stage: 'decisions', payload: {locked: ['x'], unresolved: []}});
const obs = K.extractObligations('Test the kernel. It must work.');
s = K.advance({request_id: id, stage: 'replay', payload: {
  page0_verified: true, page0_hash: s.stages.page0.raw_hash,
  obligations: obs.map(o => ({id: o.id, source: o.source, status: 'satisfied'})), substitutions: []}});
s = K.advance({request_id: id, stage: 'verdict', payload: {
  spec: {obligations: obs.map(o => ({id: o.id, status: 'satisfied'}))},
  destination: 'test', done_criteria: ['receipt valid']}});
out.receipt_valid = K.verifyReceipt(s.receipt);
out.order_locked = false;
try { K.advance({request_id: id, stage: 'distill', payload: {}}); }
catch (e) { out.order_locked = /terminal|locked/i.test(e.message); }
console.log(JSON.stringify(out));
"""


def run(ctx):
    problems = []
    try:
        raw = harness.repo_file_bytes('funnel-kernel.js')
    except Exception as e:
        return {'name': 'kernel-check', 'passed': False,
                'summary': 'cannot fetch funnel-kernel.js: ' + str(e)[:80],
                'metrics': {}, 'details': []}
    open('/tmp/kernel-check.js', 'wb').write(raw)
    r = subprocess.run(['node', '-e', NODE_TEST], capture_output=True, text=True,
                       timeout=30)
    if r.returncode != 0:
        return {'name': 'kernel-check', 'passed': False,
                'summary': 'node test crashed: ' + r.stderr[:100],
                'metrics': {}, 'details': []}
    import json
    try:
        res = json.loads(r.stdout.strip())
    except Exception:
        return {'name': 'kernel-check', 'passed': False,
                'summary': 'node test bad output', 'metrics': {}, 'details': []}
    if res.get('law') != 'v44-sealed':
        problems.append('law_version=%s (want v44-sealed)' % res.get('law'))
    if not res.get('receipt_valid'):
        problems.append('test receipt did not verify')
    if not res.get('order_locked'):
        problems.append('stage order lock not enforced')
    passed = not problems
    return {'name': 'kernel-check', 'passed': passed,
            'summary': 'law=%s receipt=%s order-lock=%s' % (
                res.get('law'), 'valid' if res.get('receipt_valid') else 'BROKEN',
                'enforced' if res.get('order_locked') else 'BROKEN'),
            'metrics': res, 'details': problems}
