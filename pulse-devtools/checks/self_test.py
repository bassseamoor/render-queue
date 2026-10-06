"""Tier 3: stack-self-test — "the suite proves itself".
Runs the devtools' own checks against synthetic fixtures:
  - GOOD fixture: temp tools dir where every file is inlined -> registration must PASS.
  - BAD fixture: temp tools dir with an unlisted file -> registration must FAIL.
  - BAD pin fixture: version check against a wrong pin -> must FAIL.
If the suite can't fail a known-bad fixture, it's decoration.
"""
import os
import re
import shutil
import tempfile
import harness
from checks import registration as reg_mod


def run(ctx):
    results = []
    # GOOD fixture: mirror real inline list, all files listed
    tmp = tempfile.mkdtemp(prefix='selftest-')
    try:
        tools_dir = os.path.join(tmp, 'tools')
        os.makedirs(tools_dir)
        src = open(os.path.join(harness.REC, 'build_pulse_v2.py')).read()
        m = re.search(r"for t in \[(.*?)\]:", src, re.S)
        inline = re.findall(r"'([^']+)'", m.group(1))
        for t in inline[:5]:
            open(os.path.join(tools_dir, t), 'w').write('// fixture')
        # monkeypatch the module for the fixture run (self-consistent: 5 files,
        # 5 inlined, 5 comps-refs)
        orig_dir, orig_inline, orig_comps = (
            reg_mod.TOOLS_DIR, reg_mod._inline_list, reg_mod._comps_tools)
        reg_mod.TOOLS_DIR = tools_dir
        reg_mod._inline_list = lambda: set(inline[:5])
        reg_mod._comps_tools = lambda: set(inline[:5])
        try:
            r_good = reg_mod.run({})
            results.append(('good-fixture passes', r_good['passed']))
            # BAD fixture: add unlisted file
            open(os.path.join(tools_dir, 'tool-evil.js'), 'w').write('// evil')
            r_bad = reg_mod.run({})
            results.append(('bad-fixture fails', not r_bad['passed'] and
                            'tool-evil.js' in r_bad['summary']))
        finally:
            reg_mod.TOOLS_DIR, reg_mod._inline_list, reg_mod._comps_tools = (
                orig_dir, orig_inline, orig_comps)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    # BAD pin: version check must fail on wrong pin
    from checks import version_pin as vp_mod
    orig_pin = vp_mod._pin
    vp_mod._pin = lambda: {'PULSE_VERSION': '20000101-0000'}
    try:
        r_pin = vp_mod.run({})
        results.append(('bad-pin fails', not r_pin['passed']))
    finally:
        vp_mod._pin = orig_pin
    passed = all(ok for _, ok in results)
    return {'name': 'stack-self-test', 'passed': passed,
            'summary': '; '.join('%s %s' % (n, 'OK' if ok else 'FAIL')
                                 for n, ok in results),
            'metrics': {'tests': results},
            'details': [n for n, ok in results if not ok]}
