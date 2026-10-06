"""Shared harness for pulse-devtools checks."""
import hashlib
import json
import os
import random
import subprocess
import urllib.request

REC = '/home/hatch/workspace/moor-recovery'
GHAPI = '/home/hatch/workspace/skills/github/bin/ghapi'
REPO = 'bassseamoor/render-queue'
LIVE_BASE = 'https://bassseamoor.github.io/render-queue/'


def md5_bytes(b):
    return hashlib.md5(b).hexdigest()


def md5_file(path):
    return md5_bytes(open(path, 'rb').read())


def ghapi(path):
    out = subprocess.run([GHAPI, 'GET', path], capture_output=True, text=True,
                         timeout=60)
    if out.returncode != 0:
        raise RuntimeError('ghapi failed: ' + out.stderr[:200])
    return json.loads(out.stdout)


def repo_head_sha():
    d = ghapi('/repos/%s/commits?per_page=1' % REPO)
    return d[0]['sha']


def repo_file_bytes(repo_path, ref='main'):
    d = ghapi('/repos/%s/contents/%s?ref=%s' % (REPO, repo_path, ref))
    import base64
    return base64.b64decode(d['content'])


def live_bytes(url_path):
    url = LIVE_BASE + url_path
    url += ('&' if '?' in url else '?') + 'v=%d' % random.randint(1, 10 ** 9)
    return urllib.request.urlopen(url, timeout=60).read()
