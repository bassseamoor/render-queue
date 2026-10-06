#!/usr/bin/env python3
"""Build Project Pulse v2: mockup layout/style + real component sources + 8 tools.
Assembles a single self-contained HTML for the Pages snapshot.
Usage: python3 build_pulse_v2.py
Output: ~/workspace/moor-recovery/pulse-v2.html
"""
import json, re, html as htmllib

HOME = '/home/hatch/workspace'
REC = HOME + '/moor-recovery'
MOCKUP = HOME + '/user/files/MOOR-Pulse-Functional-Mockup.html'
OUT = REC + '/pulse-v2.html'

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

# ---- 1. mockup skeleton + CSS ----
mockup = read(MOCKUP)
css = re.findall(r'<style>(.*?)</style>', mockup, re.S)[0]
body = mockup.split('<body>')[1].rsplit('</body>')[0]
body = re.sub(r'<script.*?</script>', '', body, flags=re.S)

# small honest tweaks to the skeleton copy
body = body.replace(
    'Based on your reports and linked dashboard. Open pages explain existing tools.',
    'Recovered software, running live in each page. Opening a page never integrates it into MOOR.')
body = body.replace(
    '<p class="activity-note">Project reports and your actions in this preview.</p>',
    '<p class="activity-note">Recorded project work and your actions in this dashboard.</p>')

# non-invasive source button: one </> in the header, opens the source drawer
body = body.replace(
    '<button id="activity-toggle" class="btn"',
    '<button id="src-toggle" class="btn" aria-label="Underlying source and logic" title="Underlying source and logic — for builders and AIs">&lt;/&gt;</button><button id="activity-toggle" class="btn"',
    1)

tools_css = read(REC + '/pulse-v2/tools.css')
glass_css = read(REC + '/pulse-v2/glass.css')
tabs_css = read(REC + '/pulse-v2/tabs.css')
full_css = css + '\n' + tools_css + '\n' + glass_css + '\n' + tabs_css

# ---- 2. component sources (verbatim, classic-script safe) ----
def js_file(p):
    return read(REC + '/components/' + p)

parts = []
# terrain-core: ES module -> strip export keywords, wrap in namespace
tc = js_file('terrain-core/source/terrain-core.mjs')
tc = re.sub(r'^export\s+', '', tc, flags=re.M)
parts.append('<script>\nwindow.TerrainCore = (function(){\n' + tc +
             '\nreturn {N:N,SIZE:SIZE,COUNT:COUNT,clamp:clamp,generate:generate,brush:brush,pack:pack,unpack:unpack};\n})();\n</script>')
parts.append('<script>\n' + js_file('seed-rng/rng.js') + '\n</script>')
# seed-codec: wrap in namespace (its top-level mix/clamp collide with mesh-builder)
cc = js_file('seed-codec/codec.js')
parts.append('<script>\nwindow.SeedCodec = (function(){\n' + cc +
             '\nreturn {makeCodec:makeCodec};\n})();\n</script>')
parts.append('<script>\n' + js_file('save-shape/save-shape.js') + '\n</script>')
# idempotent-upload: ES module -> strip export keywords, wrap in namespace
iu = js_file('idempotent-upload/adapter.js')
iu = re.sub(r'^export\s+', '', iu, flags=re.M)
parts.append('<script>\nwindow.DriveUpload = (function(){\n' + iu +
             '\nreturn {invoke:invoke, check:check};\n})();\n</script>')
# seed-console source as a string (used inside an iframe demo page)
sc_src = js_file('seed-console/seed-console.js')
parts.append('<script>\nwindow.SEED_CONSOLE_SRC = ' + json.dumps(sc_src) + ';\n</script>')
# intent compiler WASM glue (export-stripped, __wbg_init removed: import.meta
# is illegal in classic scripts and we only need initSync+handle) -> window.MoorWasm
wg = read(HOME + '/moor-core-v0/crates/moor-web/web/pkg/moor_web.js')
wg = re.sub(r'^export\s+', '', wg, flags=re.M)
wg = wg.replace('{ initSync, __wbg_init as default };', '')
# drop the async default initializer (uses import.meta.url); keep initSync
wg = re.sub(r'async function __wbg_init\(module_or_path\)[\s\S]*?\n\}\n', '', wg)
parts.append('<script>\nwindow.MoorWasm = (function(){\n' + wg +
             '\nreturn {initSync:initSync, handle:handle};\n})();\n</script>')
parts.append('<script>\n' + js_file('ambience-engine/ambience.js') + '\n</script>')
parts.append('<script>\n' + js_file('moorworld/moorworld.js') + '\n</script>')
parts.append('<script>\n' + js_file('mesh-builder/mesh-builder.js') + '\n</script>')
# furnish geometry core: IIFE-wrapped (top-level `var TAU` would collide with
# mesh-builder's `const TAU`; `function tri` would shadow struct's). struct.js
# picks up window.Furnish at load — this block must come first.
_fu = js_file('struct/furnish.js')
parts.append('<script>\nwindow.Furnish = (function(){\n' + _fu +
             '\nreturn Furnish;\n})();\n</script>')
# struct engine: namespace-wrap (top-level names are generic: RNG, mat, ...)
_st = js_file('struct/struct.js')
parts.append('<script>\nwindow.Struct = (function(){\n' + _st +
             '\nreturn Struct;\n})();\n</script>')
parts.append('<script>\n' + js_file('palettes/palettes.js') + '\n</script>')
parts.append('<script>\n' + js_file('spawn-director/spawn-director.js') + '\n</script>')
parts.append('<script>\n' + js_file('perf-governor/perf-governor.js') + '\n</script>')

# terrain-field GLSL as a JS string
field_glsl = js_file('terrain-field/field.glsl')
parts.append('<script>\nwindow.FIELD_GLSL = ' + json.dumps(field_glsl) + ';\n</script>')

# mesh-builder fragment shader: proven host version from example.html
ex = js_file('mesh-builder/example.html')
i = ex.index('var FRAG = `') + len('var FRAG = `')
j = ex.index('`; // materials.glsl inlined verbatim')
frag = ex[i:j]
parts.append('<script>\nwindow.MESH_FRAG = ' + json.dumps(frag) + ';\n</script>')

# ---- 3. activity seed (real records, newest 14) ----
events = []
try:
    with open(REC + '/shell/pulse-state/pulse/activity.jsonl', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                events.append(json.loads(line))
except FileNotFoundError:
    pass
events.sort(key=lambda e: e.get('ts', 0), reverse=True)
seed_events = [{
    't': int(e.get('ts', 0)) * 1000,
    'title': e.get('summary', '')[:140],
    'body': (e.get('detail', '') or '')[:220],
    'origin': e.get('origin', 'report'),
} for e in events[:14]]
parts.append('<script>\nvar SEED_EVENTS = ' + json.dumps(seed_events) + ';\n</script>')

# ---- 3b. distilled capability catalog (Component Distiller -> app data) ----
try:
    app_data = read(REC + '/pulse-v2/app-data.json')
    parts.append('<script>\nwindow.APP_DATA = ' + app_data + ';\n</script>')
except FileNotFoundError:
    parts.append('<script>\nwindow.APP_DATA = {"meta":{},"capabilities":[],"flagged_useless":[]};\n</script>')

# ---- 4. dashboard shell + tools ----
# smart.js first: on-device intelligence the dashboard shell uses at render time
parts.append('<script>\n' + read(REC + '/pulse-v2/smart.js') + '\n</script>')
parts.append('<script>\n' + read(REC + '/pulse-v2/dashboard.js') + '\n</script>')
for t in ['tool-terrain.js', 'tool-field.js', 'tool-mesh.js', 'tool-world.js',
          'tool-palettes.js', 'tool-ambience.js', 'tool-spawn.js', 'tool-perf.js',
          'tool-shared.js', 'tool-vegetation.js', 'tool-intent.js',
          'tool-pipeline.js', 'tool-creatures.js', 'tool-stream.js', 'tool-panels.js',
          'tool-redwood.js', 'tool-rstudio.js', 'tool-wonder.js', 'tool-distiller.js',
          'tool-vehicles.js', 'tool-vphys.js', 'tool-furniture.js',
          'tool-dualbox.js', 'tool-microrelief.js', 'tool-seedbreed.js',
          'tool-landclaim.js',
          'tool-glassmap.js', 'tool-gridcoords.js', 'tool-transit.js',
          'tool-struct.js', 'tool-structbuilder.js', 'tool-structxray.js', 'tool-structprefab.js',
          'tool-padgarden.js', 'tool-spellsiege.js', 'tool-perfplay.js',
          'tool-mazerunner.js', 'tool-planetdossier.js', 'tool-spawnwarp.js',
          'tool-creaturelab.js', 'tool-goolab.js', 'tool-terrainstack.js',
          'tool-signshop.js', 'tool-palettemixer.js', 'tool-sculptplay.js',
          'tool-quiz.js', 'tool-livinggarden.js', 'tool-planetworkshop.js', 'tool-assets.js',
          'tool-moobeta.js', 'tool-holopanel.js']:
    parts.append('<script>\n' + read(REC + '/pulse-v2/tools/' + t) + '\n</script>')
# source drawer (</> button) — additive, no dashboard restructuring
parts.append('<script>\n' + read(REC + '/pulse-v2/source-drawer.js') + '\n</script>')
# living chrome (header+nav auto-hide, orb parallax) — additive
parts.append('<script>\n' + read(REC + '/pulse-v2/chrome.js') + '\n</script>')
# carved-glass trim sheet (material pass) — additive
parts.append('<script>\n' + read(REC + '/pulse-v2/material.js') + '\n</script>')

scripts = '\n'.join(parts)

out = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
       '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
       '<title>MOOR \u00B7 Project Pulse</title>\n'
       '<meta name="description" content="Interactive MOOR project workspace: real recovered software running as tools, with plain-language explanations alongside.">\n'
       '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 32 32\'%3E%3Crect width=\'32\' height=\'32\' rx=\'7\' fill=\'%2308101c\'/%3E%3Cpath d=\'M6 24V9l10 10L26 9v15\' fill=\'none\' stroke=\'%235bd8ff\' stroke-width=\'3\'/%3E%3C/svg%3E">\n'
       '<style>\n' + full_css + '\n</style>\n<link rel="stylesheet" href="pulse-beam.css?v=20261006-beam1">\n</head>\n<body>' + body + '\n' + scripts + '\n<script src="pulse-beam-audit.js?v=20261006-beam1"></script>\n<script src="pulse-beam-component-adapter.js?v=20261006-beam1"></script>\n<script src="pulse-beam.js?v=20261006-beam1"></script>\n</body>\n</html>\n')

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(out)
print('built %s (%d bytes)' % (OUT, len(out.encode('utf-8'))))

# syntax-check every script block with node
import subprocess, tempfile, os
blocks = re.findall(r'<script>\n(.*?)</script>', out, re.S)
ok = True
for n, b in enumerate(blocks):
    with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as tf:
        tf.write(b)
        tf.flush()
        r = subprocess.run(['node', '--check', tf.name], capture_output=True, text=True)
        os.unlink(tf.name)
        if r.returncode != 0:
            ok = False
            print('SYNTAX FAIL block %d: %s' % (n, r.stderr[:300]))
print('JS syntax: %s (%d blocks)' % ('OK' if ok else 'FAILED', len(blocks)))

# ---- 5. machine-readable manifest for AIs/builders ----
# Parses the COMPS inventory from dashboard.js so external consumers
# (Codex, GPT, any AI handed the Pulse link) can see the underlying
# logic: every tool, its panel source, its component source, dependencies.
def parse_comps(js):
    m = re.search(r'var COMPS = \[(.*?)\n\];', js, re.S)
    if not m:
        return []
    body = m.group(1)
    entries, depth, cur = [], 0, ''
    for ch in body:
        if ch == '{':
            if depth == 0:
                cur = ''
            depth += 1
        if depth > 0:
            cur += ch
        if ch == '}':
            depth -= 1
            if depth == 0:
                entries.append(cur)
                cur = ''
    out = []
    for e in entries:
        def f(name):
            mm = re.search(name + r":'((?:[^'\\]|\\.)*)'", e)
            return mm.group(1).encode('utf-8').decode('unicode_escape') if mm else ''
        def fb(name):
            mm = re.search(name + r':(true|false)', e)
            return mm.group(1) == 'true' if mm else False
        out.append({
            'id': f('id'), 'label': f('label'), 'tool': f('tool'),
            'toolSrc': f('toolSrc'), 'short': f('short'),
            'component': f('technical'), 'component_source': f('source'),
            'in_moor': fb('inMoor'), 'honest_limits': f('toolGap'),
        })
    return out

import datetime
dash_js = read(REC + '/pulse-v2/dashboard.js')
comps = parse_comps(dash_js)
BASE = 'https://bassseamoor.github.io/render-queue/'
manifest_tools = []
for c in comps:
    if not c['id']:
        continue
    manifest_tools.append({
        'id': c['id'],
        'label': c['label'],
        'what_it_does': c['short'],
        'panel_source': c['toolSrc'],
        'panel_source_url': BASE + c['toolSrc'] if c['toolSrc'] else None,
        'component': c['component'],
        'component_source': c['component_source'],
        'in_moor': c['in_moor'],
        'honest_limits': c['honest_limits'],
        'depends_on': sorted(list(set(
            ['seed-rng: streamFrom, hashStr'] +
            (['moorworld: MoorWorld, planetType'] if c['tool'] in ('world', 'creatures', 'vegetation') else []) +
            (['palettes: MAT'] if c['tool'] in ('world', 'creatures', 'vegetation', 'palettes') else []) +
            (['moor-web WASM: MoorWasm.handle'] if c['tool'] == 'intent' else [])
        ))),
    })

# Platform-level items that must survive every dashboard rebuild. These are not
# derived from the legacy COMPS inventory, so regeneration must add them explicitly.
PRESERVED_PLATFORM_ITEMS = {
    'pulse-beam': {
        'label': 'Pulse Beam', 'file': 'pulse-beam.js',
        'component': 'Pulse Beam Spatial Shell v1',
        'component_source': 'blueprint/pulse-beam-rebrand.blueprint.json',
        'page': 'pulse-dashboard.html',
        'depends_on': ['pulse-beam.css','pulse-beam-audit.js','pulse-beam-component-adapter.js','pulse-beam-funnel-hall.html','pulse-beam-funnel-hall.js'],
        'tags': ['cat:interface','cat:creation','kind:spatial-shell','prov:ultra-funnel','prov:beam']
    },
    'pulse-beam-funnel-hall': {
        'label': 'Pulse Beam · Funnel Hall', 'file': 'pulse-beam-funnel-hall.js',
        'component': 'Pulse Beam Funnel Hall v1',
        'component_source': 'blueprint/pulse-beam-rebrand.blueprint.json',
        'page': 'pulse-beam-funnel-hall.html',
        'depends_on': ['three.module.js','funnel-foundry-core.js','funnel-environment-data.js'],
        'tags': ['cat:space','cat:compdata','kind:permanent-space','prov:beam','prov:funnel-fabric']
    },
    'pulse-beam-standards': {
        'label': 'Pulse Beam · Design Law', 'file': 'pulse-beam-audit.js',
        'component': 'Beam Design Law v1',
        'component_source': 'blueprint/pulse-beam-rebrand.blueprint.json',
        'page': 'pulse-beam-standards.html',
        'depends_on': ['pulse-beam.css','pulse-beam-component-adapter.js'],
        'tags': ['cat:interface','cat:compdata','kind:design-law','prov:beam']
    },
    'funnel-maintenance-status': {
        'label': 'Funnel Maintenance Status', 'file': 'funnel-maintenance-status.json',
        'component': 'Funnel maintenance / evidence matrix',
        'component_source': 'blueprint/funnel-ultra-v44-migration.blueprint.json',
        'page': 'pulse-beam-funnel-hall.html',
        'depends_on': ['funnel-kernel.js','funnel-law-core.js','.github/workflows/pulse-checks.yml'],
        'tags': ['cat:compdata','kind:maintenance-status','prov:verified','see:funnel-fabric']
    }
}

manifest = {
    'name': 'MOOR Project Pulse',
    'version': '2.1',
    'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
    'page': BASE + 'pulse-dashboard.html',
    'manifest_url': BASE + 'pulse-manifest.json',
    'repo': 'bassseamoor/render-queue',
    'branch': 'main',
    'for_ai': ('You were handed the Project Pulse link. This manifest is the underlying logic map. '
               'Each tool has a panel_source_url (the interactive implementation, plain browser JavaScript, '
               'fetch it and read it) and a component_source (the recovered/original software it builds on). '
               'depends_on lists the globals a panel source needs. To reuse a tool as a dependency, fetch its '
               'panel source and provide the listed globals. Shared libs live under pulse-tools/. '
               'The dashboard page itself is assembled by build_pulse_v2.py from pulse-v2/dashboard.js, '
               'pulse-v2/tools/*.js, and verbatim component sources.'),
    'build': {
        'script': 'build_pulse_v2.py',
        'description': ('Assembles pulse-dashboard.html from the mockup skeleton, dashboard.js (component inventory), '
                        'tools/*.js (interactive panels), and verbatim recovered component sources. '
                        'Nothing is modified; panel code is additive.'),
        'sources': {
            'dashboard': 'pulse-v2/dashboard.js',
            'tools': 'pulse-v2/tools/tool-*.js',
            'components': 'components/<name>/ (verbatim recovered sources)',
        },
    },
    'shared_libs': {
        'seed-rng': {'provides': ['streamFrom(name, seed)', 'hashStr(s)'],
                     'source': 'components/seed-rng/rng.js',
                     'note': 'Deterministic named streams. Every procedural tool depends on this.'},
        'moorworld': {'provides': ['MoorWorld', 'planetType(planet)'],
                      'source': 'components/moorworld/moorworld.js',
                      'note': 'Canonical world/planet data: 8 sectors, 57 systems, 254 planets.'},
        'palettes': {'provides': ['MAT (10 planet-type palettes)', 'PTEX'],
                     'source': 'components/palettes/palettes.js',
                     'note': 'Procedural material/color tables keyed by planet type.'},
        'moor-wasm': {'provides': ['MoorWasm.initSync(wasmBytes)', 'MoorWasm.handle(requestJson)'],
                      'source': 'moor-core-v0/crates/moor-web/web/pkg/moor_web_bg.wasm',
                      'note': 'Real Rust intent compiler compiled to WASM. Reference only; production is js-create-pipeline.'},
    },
    'tools': manifest_tools,
}
manifest.setdefault('items', {})
manifest['items'].update(PRESERVED_PLATFORM_ITEMS)
with open(REC + '/pulse-manifest.json', 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2, ensure_ascii=False)
print('wrote %s (%d tools)' % (REC + '/pulse-manifest.json', len(manifest_tools)))

# pulse-devtools: automatically verify every Pulse build (sealed funnel v44,
# receipt pulse-devtools-2026-10-06). FAIL blocks ship. Opt out with --no-verify.
import sys as _sys
if '--no-verify' not in _sys.argv:
    print('--- pulse-devtools: verifying build ---')
    _rc = subprocess.call([_sys.executable, REC + '/pulse-devtools/run.py'])
    if _rc != 0:
        print('PULSE DEVTOOLS FAIL — build did not pass verification. DO NOT SHIP.')
        _sys.exit(1)
    print('PULSE DEVTOOLS PASS')
else:
    print('pulse-devtools skipped (--no-verify)')
