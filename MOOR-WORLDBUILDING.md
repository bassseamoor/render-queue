# MOOR Worldbuilding — Location Contract v1

MOOR locations are systems with geometry, not geometry with names.

A location is incomplete until it answers six questions: **Why does it exist? Why arrive? Why explore? Why return? What persists? What changes?**

## Required location packet

Every important Morverse location should declare:

- **Identity** — canonical name, silhouette, material/light language, sound identity, civic/game/product role.
- **Purpose** — what value exists here that is stronger in-place than in a generic menu.
- **Arrival** — threshold, first sightline, orientation cue, first useful action.
- **Landmark** — one dominant form readable at low quality and long distance.
- **Circulation** — primary loop, secondary paths, vertical transitions, dead-end policy, accessibility.
- **Activities** — useful things a person can do now; future activities are explicitly marked future.
- **Social role** — why another person improves the place without being required for basic utility.
- **Economy** — legitimate faucets/sinks/markets/services, or `none`.
- **Ownership boundary** — what can be owned and what is permanently public/common infrastructure.
- **Permissions** — who may enter, modify, operate, exhibit, transact, moderate, or administer.
- **History** — what events can become durable place history.
- **State changes** — what visibly changes because the underlying world/system changed.
- **Life systems** — people, ecology, machines, traffic, weather, service systems, ambient causality.
- **Audio** — spatial identity, quiet zones, event sounds, accessibility/off state.
- **Material history** — causal wear/weather/contact rules; no random grunge.
- **Secrets** — optional discoveries that reward exploration without hiding required controls.
- **Transit** — where routes lead and what continuity/permissions survive travel.
- **Expansion seams** — where future districts, rooms, services, or worlds attach without rebuilding the identity.
- **Performance/LOD** — which identity-bearing forms must survive reduced quality.
- **Accessibility** — visible alternatives for gestures, reduced motion, readable contrast, touch and keyboard support.
- **Verification** — tests/evidence that the location is navigable, truthful, useful, performant enough for its target and consistent with its blueprint.

## Spatial hierarchy

Build macro → meso → micro → temporal.

- **Macro:** district silhouette, skyline, terrain, major approach, dominant landmark.
- **Meso:** rooms, streets, wings, plazas, bridges, gardens, circulation loops.
- **Micro:** furniture, rails, signage, joints, planters, wear, small interactive fixtures.
- **Temporal:** traffic, weather, crowds, machine cycles, events, construction, history.

Do not spend micro-detail budget before macro and meso read correctly.

## Importance law

Important places need at least one durable source of consequence: governance, creation, trade, learning, social gathering, production, transit, history, scarce access, culture, residence, risk, recovery, or discovery.

A location may be beautiful without being important. MOOR should deliberately build both, but must not confuse them.

## Property law

Property may capture **adjacent value** created by an important public place; it must not silently privatize the public place itself.

Before property is sellable or transferable, MOOR needs authoritative ownership, permissions, provenance, event-backed transactions, currency authority, transfer/recovery/dispute rules, and protected public rights-of-way. A rendered apartment is not ownership.

Desirable property can derive value from view, address, customization, social proximity, workspace convenience, exhibition access, transit, neighborhood history and scarcity. Governance authority, verification authority and core public infrastructure are not purchasable perks.

## Return law

Prefer legitimate return reasons over engagement tricks:

- the place changes because the world changed;
- people or organizations hold events there;
- useful work is easier there;
- new history/provenance accumulates there;
- exhibitions rotate;
- social presence creates new encounters;
- owned/customizable space develops over time;
- transit makes it a natural stop;
- exploration reveals optional depth.

## Beauty + truth

Apply `BEAUTY-KERNEL.md`: shared proportion ancestry, strong hierarchy, quiet regions, causal material behavior, deterministic variation, global balance with local asymmetry, and shared drivers for motion.

Never fake telemetry, occupancy, transactions, ownership, live state, or procedural causality merely to make a place look alive. If a live source is unavailable, the environment should show an unavailable/dormant state.

## Funnel integration

Location creation is a build/change request and therefore follows `FUNNEL.md` and `funnel-kernel.js`. The immutable Page 0 request survives distillation. The Location Contract becomes part of the structured spec and done criteria. Harness/build execution requires a valid Funnel receipt; verification writes failures back as evidence.

## First canonical application

`blueprint/moor-funnel-citadel.super-blueprint.json` applies this contract to the Funnel Citadel / Funnel Hall inside Pulse Beam.
