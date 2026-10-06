"""F-P2: stale-tree-guard — "never rebuild from a stale tree".
Compares repo HEAD against the recorded sync point (LAST_SYNC.txt).
- No sync point yet: records current HEAD, PASS with note.
- HEAD == sync point: PASS, tree is current.
- HEAD moved: FAIL — another chat landed work; re-sync (download current
  built file + manifest, apply surgically) before any push. This makes the
  2026-10-04 clobber impossible.
The build hook refreshes LAST_SYNC after a successful verified build.
"""
import os
import harness

SYNC_FILE = os.path.join(os.path.dirname(os.path.dirname(
    os.path.abspath(__file__))), 'LAST_SYNC.txt')


def run(ctx):
    head = harness.repo_head_sha()[:8]
    if not os.path.exists(SYNC_FILE):
        open(SYNC_FILE, 'w').write(head + '\n')
        return {'name': 'stale-tree-guard', 'passed': True,
                'summary': 'sync point recorded at %s' % head,
                'metrics': {'head': head, 'sync': None}, 'details': []}
    sync = open(SYNC_FILE).read().strip()[:8]
    if sync == head:
        return {'name': 'stale-tree-guard', 'passed': True,
                'summary': 'tree current at %s' % head,
                'metrics': {'head': head, 'sync': sync}, 'details': []}
    return {'name': 'stale-tree-guard', 'passed': False,
            'summary': 'HEAD moved %s -> %s: RE-SYNC BEFORE PUSH' % (sync, head),
            'metrics': {'head': head, 'sync': sync},
            'details': ['HEAD moved since last sync; do not push from this tree']}
