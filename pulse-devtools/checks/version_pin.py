"""F-P5: version-pin-check — "don't revert the version".
The live dashboard's PULSE_VERSION must equal the pin in PIN.txt.
Also checks the local built file when present (warns if the local tree is
stale rather than failing — other chats land work directly on main).
"""
import os
import re
import harness

DEVTOOLS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _pin():
    pin = {}
    for line in open(os.path.join(DEVTOOLS, 'PIN.txt')):
        line = line.strip()
        if line and '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            pin[k.strip()] = v.strip()
    return pin


def _version_in(html):
    m = re.search(r"PULSE_VERSION='([^']+)'", html)
    return m.group(1) if m else None


def run(ctx):
    pin = _pin()
    want = pin.get('PULSE_VERSION')
    live_html = harness.live_bytes('pulse-dashboard.html').decode('utf-8', 'replace')
    live_ver = _version_in(live_html)
    local_path = os.path.join(harness.REC, 'pulse-v2.html')
    local_ver = _version_in(open(local_path).read()) if os.path.exists(local_path) else None
    passed = (live_ver == want)
    parts = ['pin %s, live %s %s' % (want, live_ver,
                                    'MATCH' if live_ver == want else 'MISMATCH')]
    if local_ver != want:
        parts.append('local tree %s (stale or unbuilt — not a fail, see stale-tree-guard)'
                     % (local_ver or 'none'))
    return {'name': 'version-pin-check', 'passed': passed,
            'summary': '; '.join(parts),
            'metrics': {'pin': want, 'live': live_ver, 'local': local_ver},
            'details': [] if passed else ['live version does not match pin']}
