# MOOR BEAUTY KERNEL

Version 1.0.0

## Canonical definition

Beauty is coherent complexity with clear hierarchy, believable depth, intentional variation, meaningful contrast, causal material behavior, and enough restraint that the whole is legible before the details are discovered.

Short form:

**Beauty = coherence × hierarchy × depth × variation × restraint × life.**

MOOR signature:

**Clean structure, dirty consequence. Advanced technology, natural occupation. Precise forms, imperfect surfaces. Quiet futurism inside a living world.**

This is a procedural grammar, not a single beauty score. The numeric values below are priors and useful ranges, not universal laws of perception.

## 1. Proportion grammar

Use a small family of related dimensions instead of arbitrary independent sizes. Useful ratio families include:

- Harmonic: 1 : 1.25 : 1.5 : 2
- Classical: 1 : 4/3 : 3/2 : 5/3
- Root-2: 1 : √2 : 2 : 2√2
- Golden family: 1 : φ : φ²
- Compact: 1 : 1.2 : 4/3 : 1.6

Do not force every dimension onto φ or any other magic constant. The rule is shared ancestry of dimensions, not worship of a number.

## 2. Hierarchy

A useful starting prior for visual authority:

- Dominant: about 50–75%
- Supporting: about 20–40%
- Accent: about 2–10%

Visual authority is not just pixel area. It is projected size, contrast, saturation, motion, position, edge density, and semantic importance.

Hard rule: avoid equal importance everywhere.

## 3. Scale hierarchy

Use macro → meso → micro → temporal structure. Adjacent bands should usually be separated by roughly 4–10× so they remain perceptually distinct.

Examples:

Terrain: continent/valley → hill/ridge → bank/mound → stone/rut → grain.

Vegetation: biome → meadow → colony → tuft → blade.

Architecture: district → building → facade bay → panel/trim → surface wear.

## 4. Spatial distributions

Choose the distribution that matches the process:

- Blue noise / Poisson disk: even natural coverage without obvious grids.
- Clustered point processes: colonies, neighborhoods, flowers, bushes, insects, settlements.
- Log-normal: many small/medium members, few large ones.
- Heavy-tail / power-law-like: a few dominant features among many ordinary features.
- Correlated fields: placement conditioned on soil, moisture, slope, sun, traffic, heat, wind, or another field.
- 1/f-like multi-scale structure: terrain, clouds, material variation, ambience.
- Bounded jitter: crafted repetition with controlled deviation.
- Rhythmic sequences: A A B / A A B / A C instead of A A A A A.

Core rule:

**P(child | parent, environment, history), not P(child) = random().**

## 5. Symmetry and asymmetry

Use:

**global balance + local asymmetry + occasional strong symmetry**

Exact symmetry increases order. Controlled asymmetry increases life. Pure asymmetry everywhere becomes noise.

## 6. Exception budget

A useful prior is roughly 5–15% intentional violation after the visual law is established.

Pattern first. Exception second.

Spend exceptions on surprise, focus, story, function, landmarks, damage, history, or interaction—not arbitrary randomness.

## 7. Rhythm and negative space

Uniform spacing feels synthetic. Pure random spacing feels accidental. Use structured intervals with bounded variation and motif interruption.

Alternate:

- dense / quiet
- repeated / interrupted
- hard / soft
- clean / dirty
- bright / dark
- still / moving

The eye needs quiet regions. High-frequency detail everywhere is a failure.

## 8. Color hierarchy

The familiar 60/30/10 heuristic is useful as a starting intuition, but the more general rule is:

**large low-salience field → smaller supporting family → sparse high-salience accent**

High saturation should usually occupy less area than low saturation. Emissives should occupy less area still.

For MOOR, futuristic does not mean neon everywhere. Use precise materials, quiet emissives, embedded light, glass/composites, restrained contrast, and natural weathering.

## 9. Luminance and depth

Useful value hierarchy:

- Background: compressed contrast
- Midground: moderate contrast
- Foreground: widest useful contrast
- Focal object: strongest local contrast

Depth also comes from contact, occlusion, atmosphere, shadow, material response, and scale—not fog alone.

## 10. Edge density

Treat edge density as a budget. Concentrate high-frequency edges where meaning lives. Preserve low-information regions where the eye can rest.

A beautiful frame usually alternates information density instead of filling every square degree with detail.

## 11. Curvature continuity

Use continuity intentionally:

- C0: positions meet
- C1: tangent direction flows
- C2: curvature flows

Organic surfaces benefit from C1/C2 continuity. Hard-surface designs can deliberately break continuity at seams, joints, and functional edges.

Randomly alternating smooth and sharp curvature is procedural cheapness.

## 12. Occlusion

Slight overlap creates depth and relationships. Perfect isolation makes objects read like icons placed on a floor. Excessive overlap destroys silhouette.

Target partial occlusion while preserving recognition.

## 13. Material truth

Variation must have cause:

- dirt where water, traffic, handling, or gravity puts it
- wear where contact occurs
- moss where moisture and exposure permit it
- wet specular where rain or water reaches
- edge damage where impacts happen
- roughness variation at physically plausible scales

No random grunge.

## 14. Motion hierarchy

Beautiful motion is causally layered:

**shared low-frequency driver + regional variation + individual response + small high-frequency detail**

Grass: weather field → gust → meadow → tuft → blade-tip flutter.

Birds: flock intent → neighborhood response → individual correction.

UI: primary transition → child response → restrained secondary motion.

Audio: phrase → section dynamics → event timing → micro texture.

Do not use unrelated global sine waves as a substitute for a shared physical cause.

## 15. Temporal distributions

Perfect periodic timing feels mechanical. Pure independent randomness feels incoherent. Prefer bounded stochastic timing, correlated events, phase relationships, anticipation, follow-through, and causal propagation.

## 16. Deterministic variation

Randomness must be seeded and scoped. Parent systems pass context downward. Unrelated generator evolution should not reshuffle existing worlds.

Aesthetic randomness without reproducibility is not a stable world law.

## 17. Hard failures

The following fail the Beauty Kernel unless explicitly intentional:

1. Uniform random scatter where an ecological/spatial process should exist.
2. Visible repeated texture or motif period at the intended viewing distance.
3. Equal visual weight across the whole frame.
4. Arbitrary dimension soup with no proportion language.
5. Independent random animation for objects responding to the same force.
6. High-frequency detail everywhere with no quiet regions.
7. Perfect regularity everywhere unless the design explicitly calls for it.
8. Randomness without a causal field or parent condition.
9. Complexity that weakens silhouette, hierarchy, legibility, or interaction.
10. Random dirt/wear/wetness with no plausible cause.
11. LOD or quality reduction that destroys identity before removing secondary detail.
12. Proxy metrics treated as proof that a perceptual result is beautiful.

## 18. Domain adapters

### Environment
Correlated fields + clustered placement + 1/f multi-scale variation. Global balance, local asymmetry. Shared weather state drives motion.

### Vegetation
Biome → meadow → colony → tuft → blade. Clustered/log-normal placement conditioned on soil, moisture, slope, water, sun, traffic, and species.

### Terrain
One-over-f / geological hierarchy, heavy-tail landmarks, correlated erosion/material fields. Large forms must not carry all local detail.

### Architecture
Shared dimensional modules, bounded jitter, motif grammar, deliberate symmetry/asymmetry, functional material history.

### UI
Shared spacing/radius/type scale, alignment hierarchy, restrained motion, low clutter, focal action dominance, accessible reduced motion.

### Creature
Bilateral base with controlled asymmetry, proportion families, functional curvature, body intent driving appendages and secondary motion.

### Material
Host form first, causal weather/history second, micro texture last. Never let micro detail replace form.

### Motion
Primary driver first, phase and regional response second, individual detail last.

### Audio
Phrase hierarchy, dynamics hierarchy, spectral contrast, controlled spatial depth, rhythmic deviation, and enough quiet to preserve intelligibility.

## 19. Integration with the Convergence Funnel

Beauty Kernel output is dogfood, not proof.

The forward system can compile a Beauty Contract from this grammar. The reverse half must still observe the actual artifact in the correct modality and compare the consequence to the contract/original description.

No ratio, distribution, shader count, material count, or procedural rule may promote an ugly result by itself.

The Beauty Kernel constrains generation. The Convergence Funnel judges consequence.
