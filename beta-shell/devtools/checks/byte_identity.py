"""F3: byte-identity — "did the push land".
MD5 of the live URL bytes (cache-busted) vs the intended local file.
PASS = match. Only runs when ctx['live_url'] is set."""
import hashlib
import random
import urllib.request


def _md5_bytes(b):
    return hashlib.md5(b).hexdigest()


def run(ctx):
    live_url = ctx.get('live_url')
    local = ctx['beta_path']
    if not live_url:
        return {'name': 'byte-identity', 'passed': True,
                'summary': 'skipped (no --live-url)',
                'metrics': {'skipped': True}, 'details': []}
    want = _md5_bytes(open(local, 'rb').read())
    url = live_url + ('&' if '?' in live_url else '?') + 'v=%d' % random.randint(1, 1e9)
    got = _md5_bytes(urllib.request.urlopen(url, timeout=60).read())
    passed = (want == got)
    return {'name': 'byte-identity', 'passed': passed,
            'summary': 'local %s vs live %s %s' % (
                want[:8], got[:8], 'MATCH' if passed else 'MISMATCH'),
            'metrics': {'local_md5': want, 'live_md5': got}, 'details': []}
