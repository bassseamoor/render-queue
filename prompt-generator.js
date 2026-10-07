// Adaptive Procedural Prompt Generator
// Generates sharp prompts procedurally, adapts toward best performers, stores winners.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Component pools — each piece is swappable
const COMPONENTS = {
  openers: [
    { id: 'op-direct', text: 'I need your best thinking here', weight: 1.0 },
    { id: 'op-stakes', text: "Give me the version you'd stand behind if you only got one shot", weight: 1.0 },
    { id: 'op-peer', text: "Think this through like we're solving it together", weight: 1.0 },
    { id: 'op-challenge', text: "This needs more than a safe answer", weight: 1.0 },
  ],
  constraints: [
    { id: 'co-no-hedge', text: 'Skip the preamble. Skip the caveats. If you know the answer, give it straight.', weight: 1.0 },
    { id: 'co-commit', text: "Don't give me three options when you know which one is right.", weight: 1.0 },
    { id: 'co-focus', text: "I'm not looking for comprehensive. I'm looking for the one thing that matters most.", weight: 1.0 },
    { id: 'co-bet', text: "If you're torn, tell me which you'd bet on and what would change your mind.", weight: 1.0 },
  ],
  challenges: [
    { id: 'ch-pushback', text: 'If my question is dumb, say so and ask me a better one.', weight: 1.0 },
    { id: 'ch-obvious', text: "If something's obvious but everyone's missing it, that's what I want to hear.", weight: 1.0 },
    { id: 'ch-wrong', text: 'If you have a take that might be wrong but it\'s interesting, give it anyway and say where it breaks.', weight: 1.0 },
    { id: 'ch-prove', text: 'Name the load-bearing insight, then prove it.', weight: 1.0 },
  ],
  closers: [
    { id: 'cl-problem', text: "Here's what I'm working on:\n\n[PROBLEM]", weight: 1.0 },
    { id: 'cl-direct', text: 'Problem:\n\n[PROBLEM]\n\nGo.', weight: 1.0 },
  ],
};

class AdaptivePromptGenerator {
  constructor(storePath) {
    this.storePath = storePath || '/home/hatch/workspace/funnel-docs/prompt-performers.jsonl';
    this.components = JSON.parse(JSON.stringify(COMPONENTS));  // deep copy
    this.history = [];
    this.loadHistory();
  }

  loadHistory() {
    try {
      if (fs.existsSync(this.storePath)) {
        const lines = fs.readFileSync(this.storePath, 'utf8').split('\n').filter(Boolean);
        this.history = lines.map(l => JSON.parse(l));
        this.adaptWeights();
      }
    } catch (e) { /* fresh start */ }
  }

  // Adapt component weights based on historical performance
  adaptWeights() {
    for (const entry of this.history) {
      if (!entry.components || !entry.score) continue;
      for (const compId of entry.components) {
        for (const pool of Object.values(this.components)) {
          const comp = pool.find(c => c.id === compId);
          if (comp) {
            // Weighted update: good scores increase weight, bad decrease
            const delta = (entry.score - 0.5) * 0.2;
            comp.weight = Math.max(0.1, Math.min(3.0, comp.weight + delta));
          }
        }
      }
    }
  }

  // Procedural generation with weighted selection
  generate(seed) {
    const rng = seed ? this._seededRng(seed) : Math.random;
    const pick = (pool) => {
      const total = pool.reduce((s, c) => s + c.weight, 0);
      let r = rng() * total;
      for (const c of pool) {
        r -= c.weight;
        if (r <= 0) return c;
      }
      return pool[pool.length - 1];
    };

    const opener = pick(this.components.openers);
    const constraint = pick(this.components.constraints);
    const challenge = pick(this.components.challenges);
    const closer = pick(this.components.closers);

    const prompt = `${opener.text} — ${constraint.text}\n\n${challenge.text}\n\n${closer.text}`;
    const id = crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 12);

    const _self = selfScore(prompt);
    return {
      id,
      prompt,
      components: [opener.id, constraint.id, challenge.id, closer.id],
      seed: seed || null,
      self_score: _self.score,
      self_checks: _self.checks,
    };
  }

  // Score a prompt (0-1). Called after observing performance.
  score(promptId, score, notes) {
    const entry = {
      id: promptId,
      score,
      notes: notes || '',
      at: new Date().toISOString(),
      components: this._findComponents(promptId),
    };
    this.history.push(entry);
    try {
      fs.appendFileSync(this.storePath, JSON.stringify(entry) + '\n');
    } catch (e) { /* non-fatal */ }
    this.adaptWeights();  // re-adapt immediately
    return entry;
  }

  _findComponents(promptId) {
    // Find from recent generations (in-memory)
    const gen = this._recentGenerations?.find(g => g.id === promptId);
    return gen ? gen.components : [];
  }

  _seededRng(seed) {
    let h = crypto.createHash('sha256').update(String(seed)).digest();
    let i = 0;
    return () => {
      const v = h[i % h.length] / 255;
      i++;
      return v;
    };
  }

  // Get best performers
  best(n = 5) {
    return [...this.history]
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }

  // Generate N variants, return the best-scoring structure
  generateBatch(n = 10, seedBase = Date.now()) {
    this._recentGenerations = [];
    for (let i = 0; i < n; i++) {
      const gen = this.generate(`${seedBase}-${i}`);
      this._recentGenerations.push(gen);
    }
    return this._recentGenerations;
  }

  getWeights() {
    const out = {};
    for (const [poolName, pool] of Object.entries(this.components)) {
      out[poolName] = pool.map(c => ({ id: c.id, weight: +c.weight.toFixed(2) }));
    }
    return out;
  }
}


// SELF-SCORING: the generator evaluates its own prompts structurally.
// No human needed. Scores 0-1 based on discriminating criteria.
function selfScore(prompt) {
  let score = 0.5;  // start neutral
  const checks = [];
  const lower = prompt.toLowerCase();

  // Positive: has commitment mechanism (+0.15)
  if (/bet on|one shot|stand behind|commit/i.test(prompt)) {
    score += 0.15; checks.push('+commitment');
  }
  // Positive: kills hedging (+0.15)
  if (/skip.*caveat|don't hedge|no preamble|give it straight/i.test(prompt)) {
    score += 0.15; checks.push('+anti-hedge');
  }
  // Positive: gives permission to challenge (+0.1)
  if (/say so|push back|question is dumb|challenge/i.test(prompt)) {
    score += 0.1; checks.push('+challenge');
  }
  // Positive: concrete target (+0.1)
  if (/one thing|load-bearing|matters most/i.test(prompt)) {
    score += 0.1; checks.push('+focus');
  }
  // Negative: generic flattery (-0.2)
  if (/you're amazing|you're the best|as an ai language/i.test(prompt)) {
    score -= 0.2; checks.push('-flattery');
  }
  // Negative: hedging in the prompt itself (-0.15)
  if (/maybe|perhaps|if you don't mind|would you kindly/i.test(prompt)) {
    score -= 0.15; checks.push('-hedging');
  }
  // Negative: too long (-0.1)
  if (prompt.length > 800) {
    score -= 0.1; checks.push('-too-long');
  }
  // Negative: too short (-0.1)
  if (prompt.length < 150) {
    score -= 0.1; checks.push('-too-short');
  }
  // Positive: has problem placeholder (+0.05)
  if (/\[PROBLEM\]/.test(prompt)) {
    score += 0.05; checks.push('+placeholder');
  }

  score = Math.max(0, Math.min(1, score));
  return { score: +score.toFixed(2), checks };
}

module.exports = { AdaptivePromptGenerator, COMPONENTS, selfScore };
