/* Funnel Tournament System v1 — 256×256 productive investigative diversity.
 *
 * Architecture:
 *   256 seed Funnels (verification perspectives)
 *     → 256 targeted Funnels per seed (specific investigations)
 *     → productive investigative diversity
 *     → 256 tournament finalists (best from each seed)
 *     → pairwise Defeat + Inherit
 *     → 128 → 64 → 32 → 16 → 8 → 4 → 2 → 1
 *     → champion Blueprint
 *
 * Defeat + Inherit: when two findings compete, stronger defeats weaker.
 * Winner inherits loser's unique insights. Nothing lost, only consolidated.
 *
 * Usage:
 *   const T = require('./funnel-tournament.js');
 *   const result = await T.run(target, {seeds: 256, targeted: 256});
 *   // result.champion, result.bracket[], result.insights[]
 *
 * Funnel receipt 8ca9767cfaf2a935 (2026-10-07).
 *
 * TAGS: kind:component | cat:verification | prov:tournament |
 *       see:funnel-kernel,moor-debug-stack | src:funnel-tournament.js |
 */
'use strict';

// 256 seed perspectives — verification angles
const SEED_PERSPECTIVES=[
  // Syntax (seeds 0-15)
  'syntax-modules','syntax-inline','syntax-edge','syntax-strict','syntax-async',
  'syntax-template','syntax-destructure','syntax-spread','syntax-classes','syntax-generators',
  'syntax-optional-chain','syntax-nullish','syntax-private','syntax-static','syntax-topawait','syntax-importmeta',
  // Init-order (seeds 16-31)
  'init-tdz','init-hoisting','init-const','init-let','init-function-decl',
  'init-class-decl','init-import-order','init-dom-ready','init-async-init','init-deps',
  'init-circular','init-lazy','init-eager','init-singleton','init-factory','init-sequence',
  // Runtime (seeds 32-47)
  'runtime-exceptions','runtime-async-errors','runtime-unhandled','runtime-boundaries','runtime-null',
  'runtime-undefined','runtime-type','runtime-range','runtime-stack','runtime-memory',
  'runtime-event-loop','runtime-microtask','runtime-macrotask','runtime-promise','runtime-await','runtime-callback',
  // Blueprint conformance (seeds 48-63)
  'bp-dimensions','bp-materials','bp-lighting','bp-movement','bp-interaction',
  'bp-colors','bp-geometry','bp-textures','bp-behavior','bp-entry',
  'bp-preventions','bp-runtime-contract','bp-failure-modes','bp-proof','bp-platform','bp-version',
  // Platform (seeds 64-79)
  'plat-ios','plat-safari','plat-webgl','plat-webgl2','plat-touch',
  'plat-modules','plat-importmap','plat-canvas','plat-webworker','plat-wasm',
  'plat-gpu','plat-memory-limit','plat-battery','plat-network','plat-offline','plat-pwa',
  // Visual (seeds 80-95)
  'vis-render','vis-nonblank','vis-pixels','vis-contrast','vis-colors',
  'vis-textures','vis-lighting-vis','vis-shadows','vis-fog','vis-aa',
  'vis-resolution','vis-aspect','vis-orientation','vis-fullscreen','vis-screenshot','vis-frames',
  // Interaction (seeds 96-111)
  'int-swipe','int-tap','int-buttons','int-transitions','int-chair',
  'int-lighting-ctl','int-presets','int-switches','int-headlook','int-velocity',
  'int-gestures','int-multitouch','int-haptic','int-accessibility','int-keyboard','int-mouse',
  // Performance (seeds 112-127)
  'perf-load','perf-fps','perf-memory','perf-gc','perf-drawcalls',
  'perf-textures-mem','perf-geometry-mem','perf-shader-compile','perf-first-frame','perf-ttfb',
  'perf-bundle-size','perf-parse','perf-execute','perf-layout','perf-paint','perf-composite',
  // Failure modes (seeds 128-143)
  'fail-camera-outside','fail-texture','fail-lighting-dark','fail-geometry-break','fail-uv-break',
  'fail-entry-dep','fail-init-order','fail-chair-trans','fail-switch-decorative','fail-webgl-missing',
  'fail-three-load','fail-module-error','fail-cors','fail-cdn','fail-timeout','fail-oom',
  // Prevention assertions (seeds 144-159)
  'prev-camera-inside','prev-material-fallback','prev-lighting-floor','prev-waypoint-bounds','prev-texture-repeat',
  'prev-entry-decoupled','prev-node-declared','prev-dom-declared','prev-ring-declared','prev-preset-declared',
  'prev-chairpos-declared','prev-streamtex-declared','prev-wallmat-declared','prev-emitter-declared','prev-tick-defined','prev-all-declared',
  // Network (seeds 160-175)
  'net-three-cdn','net-asset-load','net-latency','net-retry','net-cache',
  'net-compression','net-http2','net-cors-headers','net-mime','net-redirect',
  'net-timeout-cfg','net-offline-queue','net-prefetch','net-preload','net-dns','net-tls',
  // Security (seeds 176-191)
  'sec-xss','sec-csp','sec-mixed','sec-iframe','sec-sandbox',
  'sec-cookies','sec-storage','sec-permissions','sec-webrtc-leak','sec-fingerprint',
  'sec-redirect-chain','sec-subresource','sec-integrity','sec-referrer','sec-feature-policy','sec-trusted-types',
  // Accessibility (seeds 192-207)
  'a11y-contrast','a11y-text-size','a11y-touch-target','a11y-focus','a11y-aria',
  'a11y-reduced-motion','a11y-screen-reader','a11y-keyboard-nav','a11y-color-blind','a11y-zoom',
  'a11y-labels','a11y-headings','a11y-landmarks','a11y-skip-link','a11y-error-ident','a11y-timeout-extend',
  // Edge cases (seeds 208-223)
  'edge-empty','edge-null-props','edge-undefined-fn','edge-zero-div','edge-neg-index',
  'edge-overflow','edge-underflow','edge-race','edge-deadlock','edge-livelock',
  'edge-starvation','edge-priority-inv','edge-thundering','edge-cascading','edge-byzantine','edge-split-brain',
  // Integration (seeds 224-239)
  'intg-charstream','intg-three','intg-entry-ui','intg-debug-stack','intg-funnel',
  'intg-blueprint','intg-pulse','intg-manifest','intg-cdn-pages','intg-cache-bust',
  'intg-version-sync','intg-commit-atomic','intg-md5-verify','intg-deploy','intg-rollback','intg-monitor',
  // Meta (seeds 240-255)
  'meta-funnel-self','meta-blueprint-blueprint','meta-debug-debug','meta-tournament-self','meta-receipt-valid',
  'meta-page0-frozen','meta-obligation-complete','meta-verdict-sound','meta-provenance-clean','meta-determinism',
  'meta-replay-exact','meta-no-theater','meta-evidence-first','meta-user-eyes-final','meta-no-guess-compat','meta-champion-true',
];

if(SEED_PERSPECTIVES.length!==256) throw new Error(`need 256 seeds, have ${SEED_PERSPECTIVES.length}`);

// Generate 256 targeted investigations for a seed
function targetedInvestigations(seed, target){
  const out=[];
  for(let i=0;i<256;i++){
    out.push({
      seed, idx:i,
      perspective:seed,
      target:i,
      check:`${seed}#${i}`,
    });
  }
  return out;
}

// Run a single investigation against the target
async function investigate(inv, ctx){
  // Each investigation runs its check against the target
  // Returns {pass, finding, severity, insight}
  try{
    const result=await ctx.runCheck(inv);
    return {
      check:inv.check,
      pass:result.pass,
      finding:result.finding||null,
      severity:result.severity||'info',
      insight:result.insight||null,
    };
  }catch(e){
    return {check:inv.check, pass:false, finding:'investigation error: '+e.message, severity:'error', insight:null};
  }
}

// Select finalist from a seed's 256 investigations
function selectFinalist(seed, results){
  // Strongest finding wins; if all pass, the seed's finalist is a PASS
  const failures=results.filter(r=>!r.pass);
  if(failures.length===0){
    return {seed, pass:true, finding:null, severity:'pass',
      insight:`${seed}: all 256 investigations pass`,
      inherited:[]};
  }
  // Pick highest severity
  const order={fatal:4, error:3, warning:2, info:1};
  failures.sort((a,b)=>(order[b.severity]||0)-(order[a.severity]||0));
  const best=failures[0];
  return {seed, pass:false, finding:best.finding, severity:best.severity,
    insight:best.insight, inherited:failures.slice(1).map(f=>f.insight).filter(Boolean)};
}

// Defeat + Inherit: two finalists compete
function defeatInherit(a, b){
  // Stronger finding wins. Winner inherits loser's unique insights.
  const order={fatal:4, error:3, warning:2, info:1, pass:0};
  const sa=order[a.severity]||0, sb=order[b.severity]||0;
  let winner, loser;
  if(sa>sb){ winner=a; loser=b; }
  else if(sb>sa){ winner=b; loser=a; }
  else{
    // Tie: more inherited insights wins
    winner=(a.inherited||[]).length>=(b.inherited||[]).length?a:b;
    loser=winner===a?b:a;
  }
  const inherited=[...(winner.inherited||[])];
  if(loser.insight && !inherited.includes(loser.insight)) inherited.push(loser.insight);
  (loser.inherited||[]).forEach(i=>{ if(!inherited.includes(i)) inherited.push(i); });
  return {...winner, inherited,
    defeated:winner===a?b.seed:a.seed,
    battle:`${a.seed} vs ${b.seed} → ${winner.seed} wins`};
}

// Tournament bracket: 256 → 1
function tournament(finalists){
  let round=[...finalists];
  const battles=[];
  let roundNum=1;
  while(round.length>1){
    const next=[];
    for(let i=0;i<round.length;i+=2){
      if(i+1>=round.length){ next.push(round[i]); continue; }
      const winner=defeatInherit(round[i],round[i+1]);
      battles.push({round:roundNum, battle:winner.battle});
      next.push(winner);
    }
    round=next;
    roundNum++;
  }
  return {champion:round[0], battles, rounds:roundNum-1};
}

// Main entry: run tournament on a target
async function run(ctx, opts){
  opts=opts||{};
  const seeds=opts.seeds||256;
  const perSeed=opts.targeted||256;

  console.log(`Tournament: ${seeds} seeds × ${perSeed} targeted = ${seeds*perSeed} investigations`);

  const finalists=[];
  for(let s=0;s<seeds;s++){
    const seed=SEED_PERSPECTIVES[s];
    const invs=targetedInvestigations(seed, opts.target);
    const results=[];
    for(const inv of invs){
      results.push(await investigate(inv, ctx));
    }
    finalists.push(selectFinalist(seed, results));
    if((s+1)%32===0) console.log(`  seeds ${s+1}/${seeds} complete`);
  }

  console.log(`Tournament bracket: ${finalists.length} finalists`);
  const {champion, battles, rounds}=tournament(finalists);
  console.log(`Champion after ${rounds} rounds: ${champion.seed}`);

  return {
    seeds, perSeed,
    totalInvestigations:seeds*perSeed,
    finalists:finalists.length,
    rounds, battles:battles.length,
    champion,
    verdict:champion.pass?'CHAMPION: ALL PASS':'CHAMPION FINDING: '+champion.finding,
  };
}

module.exports={SEED_PERSPECTIVES, targetedInvestigations, investigate, selectFinalist, defeatInherit, tournament, run};
