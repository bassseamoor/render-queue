const fs=require('node:fs'),assert=require('node:assert/strict');
const hall=fs.readFileSync('pulse-beam-funnel-hall.html','utf8');
const js=fs.readFileSync('pulse-beam-funnel-hall.js','utf8');
const bp=require('../blueprint/pulse-beam-six-hour-citadel.blueprint.json');

assert(hall.includes('Select laser architecture'),'UI must describe the implemented optical graph');
assert(js.includes('function funnelGlyph()'),'specialist Funnels require a dedicated optical glyph');
assert(js.includes('ellipse(')&&js.includes('beam('),'Funnel glyphs require laser contours and converging rays');
assert(!js.includes('SphereGeometry'),'graph nodes must never regress to sphere/ball representation');
assert(!js.includes('ConeGeometry'),'Funnel meaning must not regress to opaque/glass cone bodies');
assert(js.includes('QuadraticBezierCurve3')&&js.includes('TubeGeometry'),'relationships must be spatial luminous paths');
for(const evidence of ['RingGeometry','TorusGeometry','gallery(','stairs(','planter(','projectors'])
  assert(js.includes(evidence),'Citadel must retain complete architectural system: '+evidence);
assert(js.includes('window.FUNNEL_ENVIRONMENT_GRAPH'),'architecture must remain bound to live Funnel graph truth');
assert(!js.includes('image_gen'),'implementation must never substitute generated imagery for runtime geometry');
assert(bp.hologram.rule.includes('No visible sphere nodes'));
assert(bp.questionBlueprint.length>=12,'Funnel question blueprint must remain substantive');
assert(bp.acceptance.some(x=>x.includes('No visible sphere geometry')),'blueprint must explicitly forbid ball-node regression');
assert(bp.acceptance.some(x=>x.includes('complete floor, ceiling, perimeter, mezzanine')),'blueprint must require the whole building, not a central prop');
console.log('PASS: Funnel Citadel is guarded as a real graph-backed laser architecture with no sphere/ball Funnel representation and no image-generation substitution');
