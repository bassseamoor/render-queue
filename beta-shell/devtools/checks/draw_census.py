"""F1 diagnostic: draw-census — "is it actually drawing".
Wraps shaderSource (maps programs to marker strings in their GLSL) and
drawArrays/drawElements (counts draws + vertices per program). Answers WHY
when visibility FAILs: program drawing but invisible = placement/camera
issue; program not drawing = pipeline issue.

Markers config: {name, glsl_marker} — matched against the program's
concatenated shader sources.
"""
import json
import os

import harness

INIT_TMPL = """(() => {
  const MARKERS = %s;
  const srcByShader = new Map();
  const proto = WebGLRenderingContext.prototype;
  const _ss = proto.shaderSource;
  proto.shaderSource = function(sh, src) {
    srcByShader.set(sh, src);
    return _ss.call(this, sh, src);
  };
  window.__census = {};
  function note(gl, count) {
    let names = [];
    try {
      const prog = gl.getParameter(gl.CURRENT_PROGRAM);
      if (prog) {
        const shs = gl.getAttachedShaders(prog) || [];
        const all = shs.map(s => srcByShader.get(s) || '').join('\\n');
        for (const m of MARKERS) {
          if (all.indexOf(m.glsl) !== -1) names.push(m.name);
        }
      }
    } catch (e) {}
    const key = names.length ? names.join('+') : 'other';
    const c = window.__census[key] || (window.__census[key] = {draws: 0, verts: 0});
    c.draws += 1;
    c.verts += count;
  }
  const _da = proto.drawArrays;
  proto.drawArrays = function(mode, first, count) {
    note(this, count);
    return _da.call(this, mode, first, count);
  };
  const _de = proto.drawElements;
  proto.drawElements = function(mode, count, type, off) {
    note(this, count);
    return _de.call(this, mode, count, type, off);
  };
})();"""


def run(ctx):
    beta = ctx['beta_path']
    markers = ctx.get('draw_markers', [])
    p, b = harness.launch()
    try:
        pg = harness.new_page(b)
        pg.add_init_script(INIT_TMPL % json.dumps(
            [{'name': m['name'], 'glsl': m['glsl_marker']} for m in markers]))
        pg.goto('file://' + beta)
        pg.wait_for_timeout(harness.LOAD_WAIT_MS)
        # sample a few frames of draws
        pg.wait_for_timeout(3000)
        census = pg.evaluate('() => window.__census || {}')
        pg.close()
    finally:
        b.close()
        p.stop()
    # gate: every named marker program must have drawn verts > 0
    missing = [m['name'] for m in markers
               if sum(v.get('verts', 0) for k, v in census.items()
                      if m['name'] in k.split('+')) == 0]
    passed = not missing
    summary = 'programs: ' + ', '.join(
        '%s draws=%d verts=%d' % (k, v['draws'], v['verts'])
        for k, v in sorted(census.items()))
    if missing:
        summary += ' | MISSING: ' + ','.join(missing)
    return {'name': 'draw-census', 'passed': passed, 'summary': summary,
            'metrics': {'census': census, 'missing': missing}, 'details': census}
