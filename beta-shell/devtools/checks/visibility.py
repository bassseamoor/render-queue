"""F1: visibility — "can the player SEE it", not "is the code present".
Red-shader pixel test: builds a throwaway /tmp copy of the beta with the
target shader's final fragment color replaced by a signal color, loads it,
counts signal pixels. Never touches the real built file.

Target config: {name, marker, replacement, r, g, b, min_pct}
  marker      - exact string in the built html identifying the shader's
                final color line (must occur exactly once)
  replacement - exact string to swap in (signal color output)
  r,g,b       - pixel match rule: R>=r and G<=g and B<=b
  min_pct     - minimum % of frame that must be signal color
"""
import os
import tempfile
import harness


def _count_signal(png_path, r, g, b):
    from PIL import Image
    im = Image.open(png_path).convert('RGB')
    px = im.load()
    w, h = im.size
    n = sum(1 for y in range(h) for x in range(w)
            if px[x, y][0] >= r and px[x, y][1] <= g and px[x, y][2] <= b)
    return n, w * h


def run(ctx):
    beta = ctx['beta_path']
    targets = ctx.get('visibility_targets', [])
    p, b = harness.launch()
    results = []
    try:
        src = open(beta).read()
        for t in targets:
            assert src.count(t['marker']) == 1, \
                'marker not unique for %s: %d' % (t['name'], src.count(t['marker']))
            test_html = src.replace(t['marker'], t['replacement'], 1)
            fd, tpath = tempfile.mkstemp(suffix='.html', prefix='vis-')
            os.write(fd, test_html.encode('utf-8'))
            os.close(fd)
            try:
                pg = harness.new_page(b)
                errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)[:120]))
                pg.goto('file://' + tpath)
                pg.wait_for_timeout(harness.LOAD_WAIT_MS)
                shot = tpath + '.png'
                pg.screenshot(path=shot)
                pg.close()
                n, total = _count_signal(shot, t['r'], t['g'], t['b'])
                pct = 100.0 * n / total
                ok = pct >= t['min_pct'] and not errs
                results.append({
                    'target': t['name'], 'passed': ok,
                    'pct': round(pct, 3), 'min_pct': t['min_pct'],
                    'signal_px': n, 'pageerrors': len(errs),
                })
                os.unlink(shot)
            finally:
                os.unlink(tpath)
    finally:
        b.close()
        p.stop()
    passed = all(r['passed'] for r in results)
    summary = '; '.join('%s %.3f%% (min %.2f%%)' % (r['target'], r['pct'], r['min_pct'])
                        for r in results)
    return {'name': 'visibility', 'passed': passed, 'summary': summary,
            'metrics': {'targets': results}, 'details': results}
