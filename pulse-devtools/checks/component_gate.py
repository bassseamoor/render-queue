"""component-gate — "component X is registered AND live".
Each component in requirements.json declares what proves it. v1 gates:
- registered: its tool file is in the build inline list
- tool: the named tool file exists on disk
- live: the live page bytes match the repo bytes (only with --live)
The beta's requirement-gate, universalized: check the requirement, never a proxy.
"""
import json
import os
import re
import harness

DEVTOOLS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(ctx):
    reqs = json.load(open(os.path.join(DEVTOOLS, 'requirements.json')))
    src = open(os.path.join(harness.REC, 'build_pulse_v2.py')).read()
    m = re.search(r"for t in \[(.*?)\]:", src, re.S)
    inline = set(re.findall(r"'([^']+)'", m.group(1))) if m else set()
    verdicts, ok = [], True
    for name, req in reqs.items():
        gates = req.get('gates', {})
        checks = []
        if gates.get('registered') or gates.get('tool'):
            t = gates.get('tool')
            good = bool(t) and t in inline and os.path.exists(
                os.path.join(harness.REC, 'pulse-v2', 'tools', t))
            checks.append(('tool %s inlined+exists' % t, good))
        if gates.get('live') and ctx.get('check_live'):
            try:
                live = harness.live_bytes(gates['live'])
                repo = harness.repo_file_bytes(gates['live'])
                good = harness.md5_bytes(live) == harness.md5_bytes(repo)
            except Exception:
                good = False
            checks.append(('live bytes match', good))
        good = all(c[1] for c in checks)
        ok = ok and good
        verdicts.append((name, good, checks))
    summary = '; '.join('%s %s' % (n, 'OK' if g else 'FAIL') for n, g, _ in verdicts)
    return {'name': 'component-gate', 'passed': ok, 'summary': summary,
            'metrics': {'components': [(n, g) for n, g, _ in verdicts]},
            'details': ['%s: %s' % (n, c) for n, g, cs in verdicts for _, c in
                        [(x, y) for x, y in cs if not y]][:5]}
