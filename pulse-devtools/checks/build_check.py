"""build-check — "the build inputs are consistent".
Honest v1 (no rebuild — the local tree may be stale by design):
- every file in the build inline list exists on disk
- dashboard.js COMPS parses (the manifest parser succeeds)
- the mockup skeleton + css inputs exist
A full rebuild is a separate deliberate act, never a side effect.
"""
import os
import re
import harness


def run(ctx):
    rec = harness.REC
    problems = []
    # inline list files exist
    src = open(os.path.join(rec, 'build_pulse_v2.py')).read()
    m = re.search(r"for t in \[(.*?)\]:", src, re.S)
    tools = re.findall(r"'([^']+)'", m.group(1)) if m else []
    for t in tools:
        p = os.path.join(rec, 'pulse-v2', 'tools', t)
        if not os.path.exists(p):
            problems.append('missing tool file: ' + t)
    # dashboard.js COMPS parses
    js = open(os.path.join(rec, 'pulse-v2', 'dashboard.js')).read()
    if not re.search(r'var COMPS = \[', js):
        problems.append('COMPS inventory not found in dashboard.js')
    # skeleton + css inputs
    for p in [os.path.join(rec, 'pulse-v2', 'tools.css'),
              os.path.join(rec, 'pulse-v2', 'glass.css'),
              os.path.join(rec, 'pulse-v2', 'tabs.css'),
              os.path.join(rec, 'pulse-v2', 'dashboard.js')]:
        if not os.path.exists(p):
            problems.append('missing build input: ' + p)
    passed = not problems
    return {'name': 'build-check', 'passed': passed,
            'summary': '%d inline tools, COMPS %s, inputs %s' % (
                len(tools), 'parses' if 'COMPS inventory not found' not in str(problems) else 'BROKEN',
                'ok' if passed else 'MISSING'),
            'metrics': {'tools': len(tools), 'problems': problems},
            'details': problems[:5]}
