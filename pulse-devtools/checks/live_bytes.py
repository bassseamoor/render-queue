"""F-P3: live-bytes-check — "'done' means the live link serves the new bytes".
For each shipped file: MD5(live bytes) vs MD5(repo HEAD bytes).
PASS only on match. Uses a cache-buster; waits for no CDN lag excuses —
if they don't match, the deploy hasn't landed.
"""
import harness

SHIPPED = [
    ('pulse-dashboard.html', 'pulse-dashboard.html'),
    ('pulse-manifest.json', 'pulse-manifest.json'),
    ('pulse-tags.json', 'pulse-tags.json'),
]


def run(ctx):
    results, ok = [], True
    for live_path, repo_path in SHIPPED:
        try:
            live = harness.live_bytes(live_path)
            repo = harness.repo_file_bytes(repo_path)
            match = harness.md5_bytes(live) == harness.md5_bytes(repo)
        except Exception as e:
            results.append((live_path, False, 'ERROR ' + str(e)[:80]))
            ok = False
            continue
        results.append((live_path, match,
                        'MATCH' if match else 'MISMATCH live=%s repo=%s' % (
                            harness.md5_bytes(live)[:8], harness.md5_bytes(repo)[:8])))
        ok = ok and match
    return {'name': 'live-bytes-check', 'passed': ok,
            'summary': '; '.join('%s %s' % (p, s) for p, s in results),
            'metrics': {'files': results}, 'details': [s for _, _, s in results if 'MATCH' not in s]}
