#!/usr/bin/env python3
"""Assemble moor-beta.html: template + mesh-builder + furnish (IIFE) + struct + app."""
import os, datetime, sys, subprocess
REC = '/home/hatch/workspace/moor-recovery'
B = os.path.join(REC, 'beta-shell')

def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()

tpl = read(os.path.join(B, 'template.html'))
mesh = read(os.path.join(REC, 'components/mesh-builder/mesh-builder.js'))
furnish = read(os.path.join(REC, 'components/struct/furnish.js'))
struct = read(os.path.join(REC, 'components/struct/struct.js'))
controller = read(os.path.join(REC, 'components/controller/moor-controller.js'))
moorworld = read(os.path.join(REC, 'components/moorworld/moorworld.js'))
map3d = read(os.path.join(REC, 'components/map3d/map3d.js'))
palettes = read(os.path.join(REC, 'components/palettes/palettes.js'))
widgets = read(os.path.join(B, 'widgets.js'))
settle = read(os.path.join(B, 'settle.js'))
grass_blade = read(os.path.join(B, 'grass-blade.js'))
grass_place = read(os.path.join(B, 'grass-place.js'))
grass_wind = read(os.path.join(B, 'grass-wind.js'))
grass_light = read(os.path.join(B, 'grass-light.js'))
rng = read(os.path.join(REC, 'components/seed-rng/rng.js'))
ambience = read(os.path.join(REC, 'components/ambience-engine/ambience.js'))
lifeworld = read(os.path.join(B, 'lifeworld.js'))
tuning = read(os.path.join(B, 'tuning.js'))
social = read(os.path.join(B, 'social.js'))
css = read(os.path.join(B, 'app.css'))
app = (read(os.path.join(B, 'app1.js'))
       + '\n/* ===== grass-blade.js (GRASS: segmented blades + shard assert, GS-01/02/11) ===== */\n'
       + grass_blade
       + '\n/* ===== grass-place.js (GRASS: patch/colony/tuft placement, GS-03/04/10) ===== */\n'
       + grass_place
       + '\n/* ===== grass-wind.js (GRASS: gust fronts + memory + VSH, GS-05/06/07) ===== */\n'
       + grass_wind
       + '\n/* ===== grass-light.js (GRASS: FSH, GS-08/09) ===== */\n'
       + grass_light
       + '\n/* GRASS boot: bind module shaders (VSH_GRASS/FSH_GRASS are null until here) */\n'
       + 'if(typeof GrassWind!=="undefined"&&GrassWind.VSH) VSH_GRASS=GrassWind.VSH;\n'
       + 'if(typeof GrassLight!=="undefined"&&GrassLight.FSH) FSH_GRASS=GrassLight.FSH;\n'
       + 'if(!VSH_GRASS||!FSH_GRASS) throw new Error("grass modules failed to load");\n'
       + '/* GRASS debug surface (headless verification + dev): */\n'
       + 'window.__grass={wind:GrassWind,blade:GrassBlade,place:GrassPlace,light:GrassLight,\n'
       + '  violations:function(){ return window.__grassViolations||0; }};\n'
       + '\n/* ===== doors.js (W3: Collide/Interact/Doors/Own, IIFE) ===== */\n'
       + read(os.path.join(B, 'doors.js'))
       + '\n/* ===== settle.js (W4: settlement planner, IIFE) ===== */\n'
       + read(os.path.join(B, 'settle.js'))
       + '\n' + read(os.path.join(B, 'app2.js')))

# sanity: no template placeholders left behind inside engine sources
for name, src in [('mesh', mesh), ('furnish', furnish), ('struct', struct), ('controller', controller),
               ('moorworld', moorworld), ('map3d', map3d), ('palettes', palettes), ('widgets', widgets),
               ('settle', settle), ('lifeworld', lifeworld), ('tuning', tuning), ('social', social)]:
    assert 'BETA-' not in src, 'placeholder inside %s source!' % name

html = tpl.replace('/* BETA-APP-CSS */', css)
html = html.replace('BETA-MESH', mesh)
html = html.replace('BETA-FURNISH', furnish)
html = html.replace('BETA-STRUCT', struct)
html = html.replace('BETA-CONTROLLER', controller)
html = html.replace('BETA-MOORWORLD', moorworld)
html = html.replace('BETA-MAP3D', map3d)
html = html.replace('BETA-PALETTES', palettes)
html = html.replace('BETA-WIDGETS', widgets)
html = html.replace('BETA-APP', app)
html = html.replace('BETA-LIFEWORLD', rng + '\n' + ambience + '\n' + lifeworld)
html = html.replace('BETA-TUNING', tuning)
html = html.replace('BETA-SOCIAL', social)
ver = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M')
html = html.replace('/*BETA-VERSION*/', ver)
assert 'BETA-' not in html, 'unreplaced placeholder remains'
with open(os.path.join(REC, 'moor-beta-version.txt'), 'w', encoding='utf-8') as vf:
    vf.write(ver + '\n')
print('version', ver)

out = os.path.join(REC, 'moor-beta.html')
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)
print('wrote %s (%d bytes)' % (out, len(html)))

# devtools: automatically verify every build (funnel run 2026-10-05-night).
# FAIL blocks ship. Opt out only with --no-verify (and say why).
if '--no-verify' not in sys.argv:
    print('--- devtools: verifying build ---')
    cmd = [sys.executable, os.path.join(B, 'devtools', 'run.py'),
           '--beta', out]
    req_file = os.path.join(B, 'devtools', 'REQUIREMENT.txt')
    if os.path.exists(req_file):
        req = open(req_file).read().strip()
        if req:
            cmd += ['--require', req]
    rc = subprocess.call(cmd)
    if rc != 0:
        print('DEVTOOLS FAIL — build did not pass verification. DO NOT SHIP.')
        sys.exit(1)
    print('DEVTOOLS PASS')
else:
    print('devtools skipped (--no-verify)')
