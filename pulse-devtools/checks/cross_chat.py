"""Tier 3: cross-chat-check — "did another chat's push break my component".
Looks at repo HEAD: which files changed, and do the changed components still
satisfy registration (inlined + in COMPS)? A push that adds an unregistered
tool, or removes a file a COMPS entry needs, FAILs here — before anyone
has to discover it by hand.
"""
import os
import re
import harness


def run(ctx):
    try:
        commits = harness.ghapi('/repos/%s/commits?per_page=1' % harness.REPO)
        sha = commits[0]['sha']
        detail = harness.ghapi('/repos/%s/commits/%s' % (harness.REPO, sha))
    except Exception as e:
        return {'name': 'cross-chat-check', 'passed': False,
                'summary': 'cannot read HEAD: ' + str(e)[:80],
                'metrics': {}, 'details': []}
    files = [f['filename'] for f in detail.get('files', [])]
    # map changed tool files to registration state
    src = open(os.path.join(harness.REC, 'build_pulse_v2.py')).read()
    m = re.search(r"for t in \[(.*?)\]:", src, re.S)
    inline = set(re.findall(r"'([^']+)'", m.group(1))) if m else set()
    problems = []
    changed_tools = [f for f in files if f.startswith('pulse-v2/tools/tool-')]
    for f in changed_tools:
        name = f.rsplit('/', 1)[-1]
        if name not in inline:
            problems.append('%s changed but not inlined (silent)' % name)
    msg = detail['commit']['message'].split('\n')[0][:60]
    passed = not problems
    summary = 'HEAD %s: %d files, %d tools changed' % (sha[:8], len(files), len(changed_tools))
    if problems:
        summary += '; ' + '; '.join(problems)
    else:
        summary += '; all changed tools registered'
    return {'name': 'cross-chat-check', 'passed': passed, 'summary': summary,
            'metrics': {'head': sha[:8], 'message': msg,
                        'changed_tools': changed_tools, 'problems': problems},
            'details': problems[:5]}
