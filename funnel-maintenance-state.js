/* MOOR Funnel maintenance state v1.
 * Factual product metadata for Pulse Beam / Funnel Citadel.
 * Decorative architecture must never override these states.
 */
(function(root){
'use strict';
root.FUNNEL_MAINTENANCE_STATE=Object.freeze({
  schema:'moor.funnel-maintenance-state',
  version:1,
  generated_from:'repository architecture + automated test evidence',
  active_authority:'v44-sealed',
  candidate_authority:'ultra-v1-candidate',
  overall:'operational-with-candidate',
  truth_rule:'3D is a projection/control plane. Health colors and authority labels come from this machine-readable state and referenced verification, never from decorative geometry.',
  legend:{
    native_tested:'Implemented in the named authority layer and exercised by automated verification.',
    live_shared:'Implemented and used on the live path, but owned by a shared/external subsystem.',
    candidate_tested:'Implemented and tested in Ultra, but not production authority.',
    inherited:'Currently supplied by active/shared infrastructure rather than an Ultra-native surface.',
    gap:'Known incomplete maintenance requirement. Must never render as healthy.'
  },
  systems:[
    {
      id:'request-entry',
      label:'Universal request entry',
      owner:'v44-sealed',
      state:'native_tested',
      live_path:true,
      implementation:['moor-request.js','funnel-kernel.js'],
      verification:['tests/moor-request-checks.cjs','tests/funnel-kernel-checks.cjs'],
      detail:'Build/change requests route through the production Funnel gate and exact Page 0 receipt binding.'
    },
    {
      id:'page0-replay-v44',
      label:'Page 0 replay · production',
      owner:'v44-sealed',
      state:'native_tested',
      live_path:true,
      implementation:['funnel-kernel.js','quiz-funnel-v3.html'],
      verification:['tests/funnel-kernel-checks.cjs','tests/funnel-runtime-checks.cjs'],
      detail:'Immutable source-backed replay is production authority.'
    },
    {
      id:'ultra-authority',
      label:'Ultra authority core',
      owner:'ultra-v1-candidate',
      state:'candidate_tested',
      live_path:false,
      implementation:['funnel-law-core.js','funnel-receipt-core.js'],
      verification:['tests/funnel-law-ultra-checks.cjs','tests/software-manufacturing-machine-ultra-run.cjs'],
      detail:'Candidate authority with native immutable Page 0 replay, typed receipt ordering, integrity chain and staleness. Not silently promoted.'
    },
    {
      id:'solver-society',
      label:'Solver society / recursive work cells',
      owner:'ultra-v1-candidate',
      state:'candidate_tested',
      live_path:false,
      implementation:['funnel-case-runtime.js','funnel-society-core.js','funnel-consensus-core.js','sebastian-solver-core.js'],
      verification:['tests/funnel-law-ultra-checks.cjs','tests/sebastian-solver-checks.cjs'],
      detail:'Scoped child Funnel work cells and separated owner/solver confidence.'
    },
    {
      id:'budgets-capabilities',
      label:'Capacity + least authority',
      owner:'ultra-v1-candidate',
      state:'candidate_tested',
      live_path:false,
      implementation:['funnel-budget-core.js','funnel-capability-core.js','funnel-resource-governor.js'],
      verification:['tests/funnel-law-ultra-checks.cjs'],
      detail:'Conserved WIP/resource envelopes and scoped worker capability grants.'
    },
    {
      id:'refinery-handoff',
      label:'Refinery capability handoff',
      owner:'shared',
      state:'live_shared',
      live_path:true,
      implementation:['funnel-capability-handoff.js','moor-capability-memory.js','moor-capability-refinery.js'],
      verification:['tests/refinery-creation-deck-checks.cjs','tests/capability-crystallizer-ultra-run.cjs'],
      detail:'Verified capability and assembly references can be handed into the Funnel without carrying execution authority.'
    },
    {
      id:'harness-gate',
      label:'Harness execution gate',
      owner:'v44-sealed',
      state:'native_tested',
      live_path:true,
      implementation:['moor-request.js','moor-harness-runtime-v1.html'],
      verification:['tests/harness-funnel-gate-checks.cjs','tests/moor-request-checks.cjs'],
      detail:'Execution requires a production kernel-verified receipt.'
    },
    {
      id:'pulse-beam-shell',
      label:'Pulse Beam factory floor',
      owner:'shared',
      state:'live_shared',
      live_path:true,
      implementation:['pulse-beam.js','pulse-beam.css','pulse-dashboard.html'],
      verification:['tests/pulse-beam-checks.cjs','tests/pulse-beam-laser-citadel-checks.cjs'],
      detail:'Human spatial shell and explorable factory floor. It is a projection of software state, not authority itself.'
    },
    {
      id:'funnel-citadel',
      label:'3D Funnel Citadel',
      owner:'shared',
      state:'live_shared',
      live_path:true,
      implementation:['pulse-beam-funnel-hall.html','pulse-beam-funnel-hall.js','funnel-environment-data.js'],
      verification:['tests/pulse-beam-laser-citadel-checks.cjs','tests/funnel-maintenance-state-checks.cjs'],
      detail:'Decorated physical location driven by the live graph and this maintenance state.'
    },
    {
      id:'ultra-persistent-ledger',
      label:'Ultra persistent authority ledger',
      owner:'ultra-v1-candidate',
      state:'gap',
      live_path:false,
      implementation:['funnel-law-core.js'],
      verification:[],
      detail:'Ultra candidate authority records are currently in-memory. Persistent authority storage remains a promotion-blocking maintenance gap.'
    },
    {
      id:'ultra-human-runtime',
      label:'Ultra-native human runtime',
      owner:'ultra-v1-candidate',
      state:'inherited',
      live_path:false,
      implementation:['quiz-funnel-v3.html'],
      verification:['tests/funnel-runtime-checks.cjs'],
      detail:'Human Funnel UI is still the production v44 runtime. Ultra uses shared tests/blueprints but has not replaced the production UI.'
    }
  ]
});
})(window);
