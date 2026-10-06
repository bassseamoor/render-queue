"""F-P1/F-P6: registration-check — "does every component actually ship".
Compares three sets that must agree:
  A. tool-*.js files on disk (pulse-v2/tools/)
  B. the build inline list (build_pulse_v2.py `for t in [...]`)
  C. tool refs in COMPS (pulse-v2/dashboard.js)
FAIL if: a file exists but isn't inlined (silent non-shipment, F-P1);
a COMPS entry references a tool with no file or no inline entry (F-P6).
"""
import os
import re
import harness

TOOLS_DIR = os.path.join(harness.REC, 'pulse-v2', 'tools')


def _inline_list():
    src = open(os.path.join(harness.REC, 'build_pulse_v2.py')).read()
    m = re.search(r"for t in \[(.*?)\]:", src, re.S)
    if not m:
        raise RuntimeError('inline tool list not found in build_pulse_v2.py')
    return set(re.findall(r"'([^']+)'", m.group(1)))


def _tool_files():
    return set(f for f in os.listdir(TOOLS_DIR)
               if f.startswith('tool-') and f.endswith('.js'))


def _comps_tools():
    js = open(os.path.join(harness.REC, 'pulse-v2', 'dashboard.js')).read()
    # toolSrc:'pulse-tools/tool-foo.js' -> tool-foo.js (the shippable filename)
    srcs = re.findall(r"toolSrc:'([^']+)'", js)
    return set(s.rsplit('/', 1)[-1] for s in srcs if s)


def run(ctx):
    files, inline, comps = _tool_files(), _inline_list(), _comps_tools()
    silent = sorted(files - inline)          # on disk, never shipped (F-P1)
    missing_file = sorted(inline - files)    # inlined but file gone
    unresolvable = sorted(t for t in comps if t not in inline)  # F-P6
    passed = not silent and not missing_file and not unresolvable
    parts = ['%d files, %d inlined, %d comps-refs' % (len(files), len(inline), len(comps))]
    if silent:
        parts.append('SILENT (not shipped): ' + ','.join(silent))
    if missing_file:
        parts.append('MISSING FILE: ' + ','.join(missing_file))
    if unresolvable:
        parts.append('UNRESOLVABLE COMPS: ' + ','.join(unresolvable))
    return {'name': 'registration-check', 'passed': passed,
            'summary': '; '.join(parts),
            'metrics': {'files': len(files), 'inlined': len(inline),
                        'silent': silent, 'missing_file': missing_file,
                        'unresolvable': unresolvable},
            'details': silent + missing_file + unresolvable}
