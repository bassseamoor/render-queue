#!/usr/bin/env python3
"""devtools/run.py — master runner. One tool per named failure, nothing invented.
Funnel: ~/workspace/funnel/runs/devtools-20261005-night.md

Usage:
  python3 run.py [--beta PATH] [--live-url URL] [--require NAME]

Exit 0 = all pass. Exit 1 = any fail. FAIL blocks ship; tools never auto-fix.
"""
import argparse
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import harness
import ledger
from checks import error_census, visibility, draw_census, byte_identity, requirement_gate

# F1 target: grass fragment shader -> signal red. Marker must occur exactly once.
DEFAULT_VIS_TARGETS = [{
    'name': 'grass',
    'marker': 'gl_FragColor = vec4(col, 1.0);',
    'replacement': 'gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);',
    'r': 180, 'g': 90, 'b': 90,
    'min_pct': 0.5,
}]
# F1 diagnostic marker: grass GLSL contains vBend varying.
DEFAULT_DRAW_MARKERS = [{'name': 'grass', 'glsl_marker': 'vBend'}]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--beta', default=harness.default_beta_path())
    ap.add_argument('--live-url', default=None)
    ap.add_argument('--require', default=None)
    args = ap.parse_args()

    ctx = {
        'beta_path': args.beta,
        'live_url': args.live_url,
        'require': args.require,
        'visibility_targets': DEFAULT_VIS_TARGETS,
        'draw_markers': DEFAULT_DRAW_MARKERS,
    }
    checks = [error_census, visibility, draw_census, byte_identity]
    results = []
    for mod in checks:
        try:
            results.append(mod.run(ctx))
        except Exception as e:
            results.append({'name': mod.__name__, 'passed': False,
                            'summary': 'HARNESS ERROR: %s' % e,
                            'metrics': {}, 'details': [traceback.format_exc()[-500:]]})
    ctx['_check_results'] = results
    try:
        results.append(requirement_gate.run(ctx))
    except Exception as e:
        results.append({'name': 'requirement-gate', 'passed': False,
                        'summary': 'HARNESS ERROR: %s' % e,
                        'metrics': {}, 'details': []})

    beta_tag = os.path.basename(args.beta)
    print('==============================================================')
    print('  DEVTOOLS  ::  %s' % beta_tag)
    if args.require:
        print('  REQUIREMENT: %s' % args.require)
    print('==============================================================')
    allpass = True
    for r in results:
        mark = '\033[92mPASS\033[0m' if r['passed'] else '\033[91mFAIL\033[0m'
        allpass = allpass and r['passed']
        print('  [%s] %-28s %s' % (mark, r['name'], r['summary'][:90]))
        det = r.get('details') or []
        if isinstance(det, dict):
            det = ['%s: %s' % (k, v) for k, v in list(det.items())[:3]]
        for d in det[:3]:
            print('         | %s' % str(d)[:100])
    print('==============================================================')
    print('  RESULT: %s' % ('\033[92mALL GREEN\033[0m' if allpass
                            else '\033[91mFAIL — DO NOT SHIP\033[0m'))
    print('==============================================================')

    ledger.store({'beta': beta_tag, 'require': args.require,
                  'live_url': bool(args.live_url),
                  'passed': allpass,
                  'results': [{'name': r['name'], 'passed': r['passed'],
                               'summary': r['summary'], 'metrics': r['metrics']}
                              for r in results]})
    return 0 if allpass else 1


if __name__ == '__main__':
    sys.exit(main())
