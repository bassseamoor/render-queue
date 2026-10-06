#!/usr/bin/env python3
"""pulse-devtools/run.py — universal dev tools for Pulse.
Sealed funnel v44 receipt: pulse-devtools-2026-10-06 (fingerprint f2b6a00a9baf0eb8).
Packet: /tmp/pulse-devtools-packet.json

Usage: python3 run.py [--live] [--pre-push]
  --live      also verify live bytes (slower, hits network)
  --pre-push  strict mode: stale-tree-guard FAILs if HEAD moved

Exit 0 = all pass. Exit 1 = any fail. FAIL blocks ship.
"""
import argparse
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import ledger
from checks import registration, stale_tree, version_pin, live_bytes, build_check, component_gate
from checks import functional, kernel, cross_chat, self_test

# Tier map for the report (by check name)
TIERS = {
    'functional-check': 'T0 components',
    'registration-check': 'T2 platform', 'stale-tree-guard': 'T2 platform',
    'version-pin-check': 'T2 platform', 'build-check': 'T2 platform',
    'component-gate': 'T2 platform', 'live-bytes-check': 'T2 platform',
    'kernel-check': 'T3 pipeline', 'cross-chat-check': 'T3 pipeline',
    'stack-self-test': 'T3 pipeline',
}
CHECKS = [functional,
          registration, stale_tree, version_pin, build_check, component_gate,
          kernel, cross_chat, self_test]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--live', action='store_true')
    ap.add_argument('--pre-push', action='store_true')
    args = ap.parse_args()
    ctx = {'check_live': args.live, 'pre_push': args.pre_push}

    results = []
    for mod in CHECKS:
        try:
            results.append(mod.run(ctx))
        except Exception as e:
            results.append({'name': mod.__name__, 'passed': False,
                            'summary': 'HARNESS ERROR: %s' % e,
                            'metrics': {}, 'details': [traceback.format_exc()[-400:]]})
    if args.live:
        try:
            results.append(live_bytes.run(ctx))
        except Exception as e:
            results.append({'name': 'live_bytes', 'passed': False,
                            'summary': 'HARNESS ERROR: %s' % e,
                            'metrics': {}, 'details': []})

    print('==============================================================')
    print('  PULSE DEVTOOLS  ::  diamond stack (sealed funnel v44)')
    print('  T0 components · T1 products · T2 platform · T3 pipeline')
    print('==============================================================')
    allpass = True
    last_tier = None
    for r in results:
        tier = TIERS.get(r['name'], '')
        if tier and tier != last_tier:
            print('  -- %s --' % tier)
            last_tier = tier
        mark = 'PASS' if r['passed'] else 'FAIL'
        allpass = allpass and r['passed']
        print('  [%s] %-20s %s' % (mark, r['name'], r['summary'][:95]))
        det = r.get('details') or []
        if isinstance(det, dict):
            det = ['%s: %s' % (k, v) for k, v in list(det.items())[:3]]
        for d in det[:3]:
            print('         | %s' % str(d)[:100])
    print('==============================================================')
    print('  RESULT: %s' % ('ALL GREEN' if allpass else 'FAIL — DO NOT SHIP'))
    print('==============================================================')

    ledger.store({'passed': allpass, 'live': args.live, 'pre_push': args.pre_push,
                  'results': [{'name': r['name'], 'passed': r['passed'],
                               'summary': r['summary']} for r in results]})
    return 0 if allpass else 1


if __name__ == '__main__':
    sys.exit(main())
