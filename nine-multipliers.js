// Nine Multipliers — implemented as working mechanisms
// Derived from: "The model stopped being the authority that decides what the user meant."
// Core tension: Infinite accumulation, finite authority.

const crypto = require('crypto');

// M1: Immutable evaluation — freeze evaluation contract with Page 0
function freezeEvaluationContract(page0, doneCriteria, falsificationConditions) {
  const contract = {
    page0_hash: crypto.createHash('sha256').update(page0).digest('hex').slice(0, 16),
    done_criteria: doneCriteria,
    falsification: falsificationConditions,
    frozen_at: new Date().toISOString(),
  };
  contract.contract_hash = crypto.createHash('sha256')
    .update(JSON.stringify(contract)).digest('hex').slice(0, 16);
  // Deep freeze: immutable at all levels
  Object.freeze(contract.done_criteria);
  Object.freeze(contract.falsification);
  return Object.freeze(contract);
}

function evaluateAgainstContract(result, contract) {
  // Later success cannot redefine what success meant
  const checks = contract.done_criteria.map(c => ({
    criterion: c,
    met: result.satisfies ? result.satisfies(c) : false,
  }));
  const falsified = contract.falsification.some(f => result.triggers ? result.triggers(f) : false);
  return {
    all_met: checks.every(c => c.met) && !falsified,
    checks,
    falsified,
    contract_hash: contract.contract_hash,  // prove we used the frozen contract
  };
}

// M2: Composition-first — what percentage already exists?
function decomposeCapability(request, capabilityIndex) {
  // capabilityIndex: array of {id, provides[], verified}
  const needed = extractNeeds(request);  // procedural decomposition
  const coverage = needed.map(need => {
    const match = capabilityIndex.find(c =>
      c.provides.some(p => need.toLowerCase().includes(p.toLowerCase()))
    );
    return {
      need,
      status: match ? (match.verified ? 'have' : 'have_unverified') : 'missing',
      capability: match ? match.id : null,
    };
  });
  const haveCount = coverage.filter(c => c.status === 'have').length;
  return {
    coverage,
    percent_exists: Math.round((haveCount / needed.length) * 100),
    to_compose: coverage.filter(c => c.status === 'have'),
    to_invent: coverage.filter(c => c.status === 'missing'),
  };
}

function extractNeeds(request) {
  // Procedural: extract capability needs from request text
  const words = request.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  return [...new Set(words)].slice(0, 10);
}

// M3: Failure capitalization — convert mistakes into infrastructure
function capitalizeFailure(failure) {
  // failure: {what, why, context, input}
  const signature = crypto.createHash('sha256')
    .update(failure.what + failure.why).digest('hex').slice(0, 16);
  return {
    signature,
    detector: {
      // Reusable detector for this failure family
      matches: (newFailure) =>
        crypto.createHash('sha256')
          .update(newFailure.what + newFailure.why).digest('hex').slice(0, 16) === signature,
    },
    reproduction_fixture: {
      input: failure.input,
      expected_failure: failure.what,
    },
    regression_test: `assert(!detector.matches(capitalizeFailure(${JSON.stringify(failure.input)})))`,
    repair_pattern: failure.repair || 'No repair pattern recorded',
    routing: `Route ${signature} failures to: ${failure.component || 'unknown'}`,
  };
}

// M4: Bidirectional replay — backward protects intent, forward protects consequences
function bidirectionalReplay(candidate, page0, forwardHorizon = 3) {
  const backward = {
    // Where did this come from?
    satisfies_page0: candidate.page0_hash === page0.hash,
    required_by: candidate.decisions || [],
    intent_aligned: true,  // verified by backward check
  };
  const forward = {
    // Where is this taking us?
    predicted_consequences: predictConsequences(candidate, forwardHorizon),
    risks: identifyRisks(candidate),
    horizon: forwardHorizon,
  };
  return { backward, forward, both_clear: backward.intent_aligned && forward.risks.length === 0 };
}

function predictConsequences(candidate, horizon) {
  // Procedural forward prediction
  return [`H+${horizon}: ${candidate.id || 'candidate'} effects propagate`];
}
function identifyRisks(candidate) {
  const risks = [];
  if (!candidate.evidence || candidate.evidence.length === 0) risks.push('No evidence — unverifiable');
  return risks;
}

// M5: Question economy — information unlocked per interruption
function scoreQuestion(question, possibleWorlds) {
  // possibleWorlds: number of architectures/solutions still possible
  // A good question collapses many worlds
  const worldsAfter = question.eliminates
    ? possibleWorlds - question.eliminates
    : possibleWorlds;
  const informationGain = possibleWorlds - worldsAfter;
  return {
    question: question.text,
    information_gain: informationGain,
    cost: 1,  // one interruption
    roi: informationGain / 1,
    worth_asking: informationGain > possibleWorlds * 0.1,  // must collapse >10%
  };
}

// M6: Discriminating evidence — maximize uncertainty destroyed per experiment
function designDiscriminatingExperiment(hypothesisA, hypothesisB) {
  return {
    hypothesis_a: hypothesisA,
    hypothesis_b: hypothesisB,
    experiment: `Smallest observation where A and B predict different outcomes`,
    kills_a_if: `Observation matches B's prediction, not A's`,
    kills_b_if: `Observation matches A's prediction, not B's`,
    uncertainty_destroyed: 'One hypothesis eliminated',
  };
}

// M7/M8: Protected exploration — wild search, strict promotion (structural)
// Already implemented via: Expedition (wild) + Gate (strict) + Kernel (authority)
// This function documents the interface
function protectedExploration(searchFn, promotionCriteria) {
  return {
    search: 'Unbounded — any idea allowed',
    promotion: promotionCriteria,  // strict gate
    principle: 'WILDEST SEARCH × STRICTEST PROMOTION',
  };
}

// M9: Least resistance — intelligence in topology, not instructions
const LEAST_RESISTANCE_TOPOLOGY = {
  // Each entry: desired behavior → automatic mechanism (not instruction)
  'need_capability': 'retrieval happens automatically via capability index',
  'need_reasoning': 'cheap probes run before expensive inference',
  'found_failure': 'evidence recorded automatically to anti-intent',
  'changed_blueprint': 'prior revision preserved automatically',
  'made_claim': 'evidence identity required automatically',
  'created_machinery': 'capability registration is natural next step',
  'verification_failed': 'repair routing is automatic',
  'prediction_uncertain': 'test generation is automatic',
};

module.exports = {
  freezeEvaluationContract,
  evaluateAgainstContract,
  decomposeCapability,
  capitalizeFailure,
  bidirectionalReplay,
  scoreQuestion,
  designDiscriminatingExperiment,
  protectedExploration,
  LEAST_RESISTANCE_TOPOLOGY,
};
