"""F2: requirement-gate — "the BUILD'S EXPLICIT REQUIREMENT is met".
A build declares its requirement by name (--require NAME, see
requirements.json). The gate maps the requirement to the checks that prove
it, at the requirement's thresholds. PASS only if ALL mapped checks pass.
This is the anti-proxy-metric gate: you cannot pass "grass" via error-census
alone; the requirement names the proof it demands."""
import json
import os


def _load_requirements():
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(os.path.dirname(here), 'requirements.json')) as f:
        return json.load(f)


def run(ctx):
    req_name = ctx.get('require')
    if not req_name:
        return {'name': 'requirement-gate', 'passed': True,
                'summary': 'skipped (no --require)',
                'metrics': {'skipped': True}, 'details': []}
    reqs = _load_requirements()
    if req_name not in reqs:
        return {'name': 'requirement-gate', 'passed': False,
                'summary': 'unknown requirement: %s' % req_name,
                'metrics': {}, 'details': []}
    req = reqs[req_name]
    gates = req.get('gates', {})
    verdicts = []
    # visibility gate
    if 'visibility' in gates:
        g = gates['visibility']
        t = [t for t in ctx.get('visibility_targets', [])
             if t['name'] == g['target']]
        vres = next((r for r in ctx.get('_check_results', [])
                     if r['name'] == 'visibility'), None)
        detail = next((d for d in (vres['metrics'].get('targets', [])
                                   if vres else []) if d['target'] == g['target']), None)
        ok = bool(detail and detail['passed'] and detail['pct'] >= g['min_pct'])
        verdicts.append(('visibility:%s %.3f%% >= %.2f%%' % (
            g['target'], detail['pct'] if detail else -1, g['min_pct']), ok))
    # draw-census gate
    if 'draw-census' in gates:
        g = gates['draw-census']
        dres = next((r for r in ctx.get('_check_results', [])
                     if r['name'] == 'draw-census'), None)
        verts = 0
        if dres:
            for k, v in dres['metrics'].get('census', {}).items():
                if g['target'] in k.split('+'):
                    verts += v.get('verts', 0)
        ok = verts >= g['min_verts']
        verdicts.append(('draw-census:%s verts=%d >= %d' % (
            g['target'], verts, g['min_verts']), ok))
    passed = all(ok for _, ok in verdicts) and bool(verdicts)
    return {'name': 'requirement-gate:%s' % req_name, 'passed': passed,
            'summary': req['description'] + ' :: ' +
                       '; '.join('%s %s' % (s, 'OK' if ok else 'FAIL')
                                 for s, ok in verdicts),
            'metrics': {'requirement': req_name, 'verdicts': verdicts},
            'details': verdicts}
