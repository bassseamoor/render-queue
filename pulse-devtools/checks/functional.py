"""Tier 0: functional-check — "every component actually works".
For each tool-*.js in the registry:
  1. node --check (syntax — the stray-brace failure mode).
  2. Headless: load real shared libs (seed-rng, moorworld, palettes),
     stub TOOLS, inject the tool, call mount(host), verify non-blank DOM.
PASS = all syntax-clean AND all mount without throwing AND produce output.
Dependencies come from the manifest's shared_libs (honest, not stubbed).
"""
import glob
import os
import subprocess
import harness

TOOLS_DIR = os.path.join(harness.REC, 'pulse-v2', 'tools')
CHROME = '/opt/meta-chromium/chrome'
FLAGS = ['--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage']

# Minimal valid GLSL stubs for globals the dashboard provides but tools need.
# Honest scope: these test the tool's mount machinery, not the real shaders.
STUB_FRAG = 'precision mediump float; void main(){ gl_FragColor = vec4(0.0,1.0,0.0,1.0); }'
STUB_VERT = 'attribute vec3 p; void main(){ gl_Position = vec4(p,1.0); }'

# Real shared libs the build provides (mirrors build_pulse_v2.py).
def _shared_lib_tags():
    tags = []
    rec = harness.REC
    # TerrainCore: ES module -> strip exports, wrap in namespace (as the build does)
    import re
    tc = open(os.path.join(rec, 'components', 'terrain-core', 'source', 'terrain-core.mjs')).read()
    tc = re.sub(r'^export\s+', '', tc, flags=re.M)
    tags.append('window.TerrainCore = (function(){\n' + tc +
                '\nreturn {N:N,SIZE:SIZE,COUNT:COUNT,clamp:clamp,generate:generate,brush:brush,pack:pack,unpack:unpack};\n})();')
    for rel in ['components/mesh-builder/mesh-builder.js',  # first: defines CityMesh
                'components/seed-rng/rng.js',
                'components/moorworld/moorworld.js',
                'components/palettes/palettes.js',
                'components/perf-governor/perf-governor.js',
                'components/struct/struct.js']:
        p = os.path.join(rec, rel)
        if os.path.exists(p):
            tags.append(open(p).read())
    return tags


def _syntax_ok(path):
    r = subprocess.run(['node', '--check', path], capture_output=True, text=True,
                       timeout=30)
    return r.returncode == 0, r.stderr[:120]


def run(ctx):
    tools = sorted(glob.glob(os.path.join(TOOLS_DIR, 'tool-*.js')))
    syntax_fails, mount_fails, mounted = [], [], 0
    for t in tools:
        ok, err = _syntax_ok(t)
        if not ok:
            syntax_fails.append((os.path.basename(t), err))
    # headless mount test (only for syntax-clean tools)
    from playwright.sync_api import sync_playwright
    good = [t for t in tools
            if os.path.basename(t) not in [s[0] for s in syntax_fails]]
    shared = _shared_lib_tags()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=FLAGS)
        for t in good:
            pg = b.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:100]))
            try:
                pg.goto('about:blank')
                pg.evaluate(
                    '([frag, vert]) => { window.TOOLS = {}; window.MESH_FRAG = frag; window.MESH_VERT = vert; }',
                    [STUB_FRAG, STUB_VERT])
                for lib_js in shared:
                    pg.add_script_tag(content=lib_js)
                pg.add_script_tag(path=t)
                pg.wait_for_timeout(400)
                res = pg.evaluate("""() => {
                  const keys = Object.keys(window.TOOLS);
                  if (!keys.length) return 'no-key';
                  const k = keys[0], tool = window.TOOLS[k];
                  // utilities (e.g. panels) register without mount: registering cleanly is the test
                  if (typeof tool.mount !== 'function') return 'utility-ok';
                  try {
                    const host = document.createElement('div');
                    document.body.appendChild(host);
                    tool.mount(host);
                    return 'ok:' + host.innerHTML.length;
                  } catch (e) { return 'throw:' + String(e).slice(0,80); }
                }""")
                if errs:
                    mount_fails.append((os.path.basename(t), errs[0]))
                elif res == 'no-key':
                    mount_fails.append((os.path.basename(t), 'registered nothing'))
                elif res == 'utility-ok':
                    mounted += 1
                elif not res.startswith('ok:'):
                    mount_fails.append((os.path.basename(t), res))
                elif int(res.split(':')[1]) == 0:
                    mount_fails.append((os.path.basename(t), 'blank output'))
                else:
                    mounted += 1
            except Exception as e:
                mount_fails.append((os.path.basename(t), 'INJECT ' + str(e)[:80]))
            pg.close()
        b.close()
    passed = not syntax_fails and not mount_fails
    parts = ['%d tools, %d mounted' % (len(tools), mounted)]
    if syntax_fails:
        parts.append('SYNTAX FAIL: ' + ','.join(s for s, _ in syntax_fails))
    if mount_fails:
        parts.append('MOUNT FAIL: ' + ','.join(s for s, _ in mount_fails))
    return {'name': 'functional-check', 'passed': passed,
            'summary': '; '.join(parts),
            'metrics': {'tools': len(tools), 'mounted': mounted,
                        'syntax_fails': syntax_fails, 'mount_fails': mount_fails},
            'details': [s + ': ' + e for s, e in (syntax_fails + mount_fails)][:5]}
