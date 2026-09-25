# Aquarium Asset Index

> Asset-generation pass complete. Every asset below was generated from the planning pack's catalogs and specs.
> Review the previews here; nothing is assembled yet. Status is `ready` unless flagged otherwise.
> Seed-determinism: same seed + same parameters = byte-identical output (verified by spot-check rebuilds).

## Summary

| Group | Files | Seeds | Status |
|---|---|---|---|
| [Substrate textures](#substrate-textures) | 10 | 100001–100010 | ready |
| [Structure material textures](#structure-material-textures) | 4 | 100011–100014 | ready |
| [Plant detail textures](#plant-detail-textures) | 6 | 100101–100106 | ready |
| [Environment backdrops](#environment-backdrops) | 10 | n/a (media pipeline) | ready |
| [Preview cards — fish](#preview-cards--fish) | 50 | 100201–100250 | ready |
| [Preview cards — structures](#preview-cards--structures) | 50 | 100251–100300 | ready |
| [Preview cards — plants](#preview-cards--plants) | 50 | 100301–100350 | ready |
| [Preview cards — floors](#preview-cards--floors) | 10 | 100351–100360 | ready |
| [Preview cards — environments](#preview-cards--environments) | 10 | 100361–100370 | ready |
| [Fish meshes](#fish-meshes) | 101 | 11001–11220 | ready |
| [Structure meshes](#structure-meshes) | 150 | 13001–13050 | ready |
| [Plant meshes](#plant-meshes) | 150 | 114001–14050 | ready |
| [Tank glass meshes](#tank-glass-meshes) | 10 | 17001–17010 | ready |
| [Maintenance object meshes](#maintenance-object-meshes) | 20 | 15001–15020 | ready |
| [Ambient beds](#ambient-beds) | 30 | 91010–91102 | ready |
| [Tank water bed](#tank-water-bed) | 1 | 92000 | ready |
| [Scene presets](#scene-presets) | 6 | 424242–93005 | ready |
| [Show bibles](#show-bibles) | 5 | 94001–94005 | ready |

**Total assets: 673** (plus this index and 3 machine-readable manifests `_manifest-*.jsonl`).

## How to review

1. Scan each group's previews below — every mesh has a 512×512 render, every texture shows itself, every audio loop has a waveform.
2. Backdrops (AI-generated) and mesh previews (flat-shaded diagnostic renders) deserve human eyes before canonical status.
3. Anything marked other than `ready` is flagged honestly with notes — nothing was faked.

## Substrate textures

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-floor-001-river-sand.png` | ![img-floor-001-river-sand.png](images/floors/img-floor-001-river-sand.png) | 100001 | ready | max seam diff 16; grain fine |
| `img-floor-002-black-volcanic-gravel.png` | ![img-floor-002-black-volcanic-gravel.png](images/floors/img-floor-002-black-volcanic-gravel.png) | 100002 | ready | max seam diff 1; grain coarse |
| `img-floor-003-golden-pea-gravel.png` | ![img-floor-003-golden-pea-gravel.png](images/floors/img-floor-003-golden-pea-gravel.png) | 100003 | ready | max seam diff 5; grain medium |
| `img-floor-004-white-coral-sand.png` | ![img-floor-004-white-coral-sand.png](images/floors/img-floor-004-white-coral-sand.png) | 100004 | ready | max seam diff 12; grain fine |
| `img-floor-005-amazon-soil.png` | ![img-floor-005-amazon-soil.png](images/floors/img-floor-005-amazon-soil.png) | 100005 | ready | max seam diff 3; grain soft pellets |
| `img-floor-006-slate-tiles.png` | ![img-floor-006-slate-tiles.png](images/floors/img-floor-006-slate-tiles.png) | 100006 | ready | max seam diff 6; grain slabs |
| `img-floor-007-muddy-riverbed.png` | ![img-floor-007-muddy-riverbed.png](images/floors/img-floor-007-muddy-riverbed.png) | 100007 | ready | max seam diff 8; grain silt |
| `img-floor-008-crushed-shell.png` | ![img-floor-008-crushed-shell.png](images/floors/img-floor-008-crushed-shell.png) | 100008 | ready | max seam diff 5; grain medium |
| `img-floor-009-lava-rock-chips.png` | ![img-floor-009-lava-rock-chips.png](images/floors/img-floor-009-lava-rock-chips.png) | 100009 | ready | max seam diff 1; grain coarse |
| `img-floor-010-glass-pebbles.png` | ![img-floor-010-glass-pebbles.png](images/floors/img-floor-010-glass-pebbles.png) | 100010 | ready | max seam diff 48; grain smooth |

## Structure material textures

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-structuremat-ceramic.png` | ![img-structuremat-ceramic.png](images/structures/img-structuremat-ceramic.png) | 100014 | ready | max seam diff 1; grain low-contrast |
| `img-structuremat-coral-rock.png` | ![img-structuremat-coral-rock.png](images/structures/img-structuremat-coral-rock.png) | 100012 | ready | max seam diff 18; grain porous pits |
| `img-structuremat-stone.png` | ![img-structuremat-stone.png](images/structures/img-structuremat-stone.png) | 100011 | ready | max seam diff 8; grain fbm + ridged cracks |
| `img-structuremat-wood.png` | ![img-structuremat-wood.png](images/structures/img-structuremat-wood.png) | 100013 | ready | max seam diff 2; grain anisotropic 8:1 |

## Plant detail textures

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-plantdetail-blade.png` | ![img-plantdetail-blade.png](images/plants/img-plantdetail-blade.png) | 100101 | ready | alpha coverage 9%; palette from plant-species.csv blade rows |
| `img-plantdetail-fan.png` | ![img-plantdetail-fan.png](images/plants/img-plantdetail-fan.png) | 100102 | ready | alpha coverage 8%; palette from plant-species.csv fan rows |
| `img-plantdetail-mat.png` | ![img-plantdetail-mat.png](images/plants/img-plantdetail-mat.png) | 100103 | ready | alpha coverage 13%; palette from plant-species.csv mat rows |
| `img-plantdetail-stem.png` | ![img-plantdetail-stem.png](images/plants/img-plantdetail-stem.png) | 100104 | ready | alpha coverage 8%; palette from plant-species.csv stem rows |
| `img-plantdetail-tuft.png` | ![img-plantdetail-tuft.png](images/plants/img-plantdetail-tuft.png) | 100105 | ready | alpha coverage 6%; palette from plant-species.csv tuft rows |
| `img-plantdetail-veil.png` | ![img-plantdetail-veil.png](images/plants/img-plantdetail-veil.png) | 100106 | ready | alpha coverage 19%; palette from plant-species.csv veil rows |

## Environment backdrops

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-env-001-studio.png` | ![img-env-001-studio.png](images/environments/img-env-001-studio.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 1 (Studio); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-002-living-room.png` | ![img-env-002-living-room.png](images/environments/img-env-002-living-room.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 2 (Living room); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-003-lab.png` | ![img-env-003-lab.png](images/environments/img-env-003-lab.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 3 (Lab); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-004-public-aquarium.png` | ![img-env-004-public-aquarium.png](images/environments/img-env-004-public-aquarium.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 4 (Public aquarium); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-005-city.png` | ![img-env-005-city.png](images/environments/img-env-005-city.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 5 (City); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-006-forest.png` | ![img-env-006-forest.png](images/environments/img-env-006-forest.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 6 (Forest); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-007-ocean.png` | ![img-env-007-ocean.png](images/environments/img-env-007-ocean.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 7 (Ocean); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-008-greenhouse.png` | ![img-env-008-greenhouse.png](images/environments/img-env-008-greenhouse.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 8 (Greenhouse); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-009-desert.png` | ![img-env-009-desert.png](images/environments/img-env-009-desert.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 9 (Desert); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |
| `img-env-010-cabin-loft.png` | ![img-env-010-cabin-loft.png](images/environments/img-env-010-cabin-loft.png) | n/a (media pipeline) | ready | Outer-environment backdrop for row 10 (Cabin loft); generated via media pipeline, no seed reported; fit to 1920x1080 with ImageOps.fit/LANCZOS. |

## Preview cards — fish

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-preview-fish-001-goldflare.png` | ![img-preview-fish-001-goldflare.png](images/previews/img-preview-fish-001-goldflare.png) | 100201 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-002-neon-tetra-prime.png` | ![img-preview-fish-002-neon-tetra-prime.png](images/previews/img-preview-fish-002-neon-tetra-prime.png) | 100202 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-003-betta-silk.png` | ![img-preview-fish-003-betta-silk.png](images/previews/img-preview-fish-003-betta-silk.png) | 100203 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-004-guppy-mosaic.png` | ![img-preview-fish-004-guppy-mosaic.png](images/previews/img-preview-fish-004-guppy-mosaic.png) | 100204 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-005-ember-glow.png` | ![img-preview-fish-005-ember-glow.png](images/previews/img-preview-fish-005-ember-glow.png) | 100205 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-006-sapphire-ribbon.png` | ![img-preview-fish-006-sapphire-ribbon.png](images/previews/img-preview-fish-006-sapphire-ribbon.png) | 100206 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-007-jade-runner.png` | ![img-preview-fish-007-jade-runner.png](images/previews/img-preview-fish-007-jade-runner.png) | 100207 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-008-marble-koi-lite.png` | ![img-preview-fish-008-marble-koi-lite.png](images/previews/img-preview-fish-008-marble-koi-lite.png) | 100208 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-009-ghost-glass.png` | ![img-preview-fish-009-ghost-glass.png](images/previews/img-preview-fish-009-ghost-glass.png) | 100209 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-010-crimson-dart.png` | ![img-preview-fish-010-crimson-dart.png](images/previews/img-preview-fish-010-crimson-dart.png) | 100210 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-011-velvet-betta.png` | ![img-preview-fish-011-velvet-betta.png](images/previews/img-preview-fish-011-velvet-betta.png) | 100211 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-012-lemon-spark.png` | ![img-preview-fish-012-lemon-spark.png](images/previews/img-preview-fish-012-lemon-spark.png) | 100212 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-013-midnight-shimmer.png` | ![img-preview-fish-013-midnight-shimmer.png](images/previews/img-preview-fish-013-midnight-shimmer.png) | 100213 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-014-arctic-tetra.png` | ![img-preview-fish-014-arctic-tetra.png](images/previews/img-preview-fish-014-arctic-tetra.png) | 100214 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-015-emberfin.png` | ![img-preview-fish-015-emberfin.png](images/previews/img-preview-fish-015-emberfin.png) | 100215 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-016-moss-guppy.png` | ![img-preview-fish-016-moss-guppy.png](images/previews/img-preview-fish-016-moss-guppy.png) | 100216 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-017-pearlstream.png` | ![img-preview-fish-017-pearlstream.png](images/previews/img-preview-fish-017-pearlstream.png) | 100217 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-018-tiger-rasbora.png` | ![img-preview-fish-018-tiger-rasbora.png](images/previews/img-preview-fish-018-tiger-rasbora.png) | 100218 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-019-azure-blade.png` | ![img-preview-fish-019-azure-blade.png](images/previews/img-preview-fish-019-azure-blade.png) | 100219 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-020-rainbow-slip.png` | ![img-preview-fish-020-rainbow-slip.png](images/previews/img-preview-fish-020-rainbow-slip.png) | 100220 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-021-ember-pikelet.png` | ![img-preview-fish-021-ember-pikelet.png](images/previews/img-preview-fish-021-ember-pikelet.png) | 100221 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-022-cloud-minnow.png` | ![img-preview-fish-022-cloud-minnow.png](images/previews/img-preview-fish-022-cloud-minnow.png) | 100222 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-023-electric-tetra.png` | ![img-preview-fish-023-electric-tetra.png](images/previews/img-preview-fish-023-electric-tetra.png) | 100223 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-024-bronze-runner.png` | ![img-preview-fish-024-bronze-runner.png](images/previews/img-preview-fish-024-bronze-runner.png) | 100224 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-025-lavender-veil.png` | ![img-preview-fish-025-lavender-veil.png](images/previews/img-preview-fish-025-lavender-veil.png) | 100225 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-026-ember-ribbon.png` | ![img-preview-fish-026-ember-ribbon.png](images/previews/img-preview-fish-026-ember-ribbon.png) | 100226 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-027-glacier-guppy.png` | ![img-preview-fish-027-glacier-guppy.png](images/previews/img-preview-fish-027-glacier-guppy.png) | 100227 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-028-ruby-flash.png` | ![img-preview-fish-028-ruby-flash.png](images/previews/img-preview-fish-028-ruby-flash.png) | 100228 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-029-mossback-carp.png` | ![img-preview-fish-029-mossback-carp.png](images/previews/img-preview-fish-029-mossback-carp.png) | 100229 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-030-silver-needle.png` | ![img-preview-fish-030-silver-needle.png](images/previews/img-preview-fish-030-silver-needle.png) | 100230 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-031-opal-veiltail.png` | ![img-preview-fish-031-opal-veiltail.png](images/previews/img-preview-fish-031-opal-veiltail.png) | 100231 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-032-ember-lantern.png` | ![img-preview-fish-032-ember-lantern.png](images/previews/img-preview-fish-032-ember-lantern.png) | 100232 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-033-blue-phantom.png` | ![img-preview-fish-033-blue-phantom.png](images/previews/img-preview-fish-033-blue-phantom.png) | 100233 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-034-sunburst-runner.png` | ![img-preview-fish-034-sunburst-runner.png](images/previews/img-preview-fish-034-sunburst-runner.png) | 100234 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-035-jade-lantern.png` | ![img-preview-fish-035-jade-lantern.png](images/previews/img-preview-fish-035-jade-lantern.png) | 100235 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-036-shadow-pike.png` | ![img-preview-fish-036-shadow-pike.png](images/previews/img-preview-fish-036-shadow-pike.png) | 100236 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-037-frost-ribbon.png` | ![img-preview-fish-037-frost-ribbon.png](images/previews/img-preview-fish-037-frost-ribbon.png) | 100237 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-038-ember-tetra.png` | ![img-preview-fish-038-ember-tetra.png](images/previews/img-preview-fish-038-ember-tetra.png) | 100238 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-039-velvet-carp.png` | ![img-preview-fish-039-velvet-carp.png](images/previews/img-preview-fish-039-velvet-carp.png) | 100239 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-040-neon-blade.png` | ![img-preview-fish-040-neon-blade.png](images/previews/img-preview-fish-040-neon-blade.png) | 100240 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-041-coral-guppy.png` | ![img-preview-fish-041-coral-guppy.png](images/previews/img-preview-fish-041-coral-guppy.png) | 100241 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-042-ghost-ribbon.png` | ![img-preview-fish-042-ghost-ribbon.png](images/previews/img-preview-fish-042-ghost-ribbon.png) | 100242 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-043-sapphire-pike.png` | ![img-preview-fish-043-sapphire-pike.png](images/previews/img-preview-fish-043-sapphire-pike.png) | 100243 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-044-ember-veil.png` | ![img-preview-fish-044-ember-veil.png](images/previews/img-preview-fish-044-ember-veil.png) | 100244 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-045-mint-runner.png` | ![img-preview-fish-045-mint-runner.png](images/previews/img-preview-fish-045-mint-runner.png) | 100245 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-046-copper-flash.png` | ![img-preview-fish-046-copper-flash.png](images/previews/img-preview-fish-046-copper-flash.png) | 100246 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-047-twilight-betta.png` | ![img-preview-fish-047-twilight-betta.png](images/previews/img-preview-fish-047-twilight-betta.png) | 100247 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-048-crystal-minnow.png` | ![img-preview-fish-048-crystal-minnow.png](images/previews/img-preview-fish-048-crystal-minnow.png) | 100248 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-049-ember-shard.png` | ![img-preview-fish-049-ember-shard.png](images/previews/img-preview-fish-049-ember-shard.png) | 100249 | ready | glyph=fish; palette from fish-species.csv |
| `img-preview-fish-050-aurora-slip.png` | ![img-preview-fish-050-aurora-slip.png](images/previews/img-preview-fish-050-aurora-slip.png) | 100250 | ready | glyph=fish; palette from fish-species.csv |

## Preview cards — structures

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-preview-structure-001-ember-boulder.png` | ![img-preview-structure-001-ember-boulder.png](images/previews/img-preview-structure-001-ember-boulder.png) | 100251 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-002-mosscap-stone.png` | ![img-preview-structure-002-mosscap-stone.png](images/previews/img-preview-structure-002-mosscap-stone.png) | 100252 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-003-split-granite.png` | ![img-preview-structure-003-split-granite.png](images/previews/img-preview-structure-003-split-granite.png) | 100253 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-004-tideworn-slab.png` | ![img-preview-structure-004-tideworn-slab.png](images/previews/img-preview-structure-004-tideworn-slab.png) | 100254 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-005-basalt-fang.png` | ![img-preview-structure-005-basalt-fang.png](images/previews/img-preview-structure-005-basalt-fang.png) | 100255 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-006-rivercobble-heap.png` | ![img-preview-structure-006-rivercobble-heap.png](images/previews/img-preview-structure-006-rivercobble-heap.png) | 100256 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-007-sunstone-shelf.png` | ![img-preview-structure-007-sunstone-shelf.png](images/previews/img-preview-structure-007-sunstone-shelf.png) | 100257 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-008-ashen-crag.png` | ![img-preview-structure-008-ashen-crag.png](images/previews/img-preview-structure-008-ashen-crag.png) | 100258 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-009-pebble-garden-ring.png` | ![img-preview-structure-009-pebble-garden-ring.png](images/previews/img-preview-structure-009-pebble-garden-ring.png) | 100259 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-010-ironstone-block.png` | ![img-preview-structure-010-ironstone-block.png](images/previews/img-preview-structure-010-ironstone-block.png) | 100260 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-011-slate-shard.png` | ![img-preview-structure-011-slate-shard.png](images/previews/img-preview-structure-011-slate-shard.png) | 100261 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-012-coralrock-knoll.png` | ![img-preview-structure-012-coralrock-knoll.png](images/previews/img-preview-structure-012-coralrock-knoll.png) | 100262 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-013-moon-gate-arch.png` | ![img-preview-structure-013-moon-gate-arch.png](images/previews/img-preview-structure-013-moon-gate-arch.png) | 100263 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-014-twinfin-arch.png` | ![img-preview-structure-014-twinfin-arch.png](images/previews/img-preview-structure-014-twinfin-arch.png) | 100264 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-015-sunken-keystone.png` | ![img-preview-structure-015-sunken-keystone.png](images/previews/img-preview-structure-015-sunken-keystone.png) | 100265 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-016-driftwood-span.png` | ![img-preview-structure-016-driftwood-span.png](images/previews/img-preview-structure-016-driftwood-span.png) | 100266 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-017-reef-gate.png` | ![img-preview-structure-017-reef-gate.png](images/previews/img-preview-structure-017-reef-gate.png) | 100267 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-018-stone-ribbon-arch.png` | ![img-preview-structure-018-stone-ribbon-arch.png](images/previews/img-preview-structure-018-stone-ribbon-arch.png) | 100268 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-019-broken-halo.png` | ![img-preview-structure-019-broken-halo.png](images/previews/img-preview-structure-019-broken-halo.png) | 100269 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-020-kelpframe-arch.png` | ![img-preview-structure-020-kelpframe-arch.png](images/previews/img-preview-structure-020-kelpframe-arch.png) | 100270 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-021-sunken-skiff.png` | ![img-preview-structure-021-sunken-skiff.png](images/previews/img-preview-structure-021-sunken-skiff.png) | 100271 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-022-anchor-chain-coil.png` | ![img-preview-structure-022-anchor-chain-coil.png](images/previews/img-preview-structure-022-anchor-chain-coil.png) | 100272 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-023-broken-mast.png` | ![img-preview-structure-023-broken-mast.png](images/previews/img-preview-structure-023-broken-mast.png) | 100273 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-024-cargo-hold-hatch.png` | ![img-preview-structure-024-cargo-hold-hatch.png](images/previews/img-preview-structure-024-cargo-hold-hatch.png) | 100274 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-025-ship-s-wheel.png` | ![img-preview-structure-025-ship-s-wheel.png](images/previews/img-preview-structure-025-ship-s-wheel.png) | 100275 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-026-rusted-porthole-ring.png` | ![img-preview-structure-026-rusted-porthole-ring.png](images/previews/img-preview-structure-026-rusted-porthole-ring.png) | 100276 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-027-drowned-rowboat.png` | ![img-preview-structure-027-drowned-rowboat.png](images/previews/img-preview-structure-027-drowned-rowboat.png) | 100277 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-028-propeller-relic.png` | ![img-preview-structure-028-propeller-relic.png](images/previews/img-preview-structure-028-propeller-relic.png) | 100278 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-029-fallen-column.png` | ![img-preview-structure-029-fallen-column.png](images/previews/img-preview-structure-029-fallen-column.png) | 100279 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-030-temple-steps.png` | ![img-preview-structure-030-temple-steps.png](images/previews/img-preview-structure-030-temple-steps.png) | 100280 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-031-carved-obelisk.png` | ![img-preview-structure-031-carved-obelisk.png](images/previews/img-preview-structure-031-carved-obelisk.png) | 100281 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-032-sunken-courtyard.png` | ![img-preview-structure-032-sunken-courtyard.png](images/previews/img-preview-structure-032-sunken-courtyard.png) | 100282 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-033-broken-amphora.png` | ![img-preview-structure-033-broken-amphora.png](images/previews/img-preview-structure-033-broken-amphora.png) | 100283 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-034-stone-lantern.png` | ![img-preview-structure-034-stone-lantern.png](images/previews/img-preview-structure-034-stone-lantern.png) | 100284 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-035-ruined-gateway.png` | ![img-preview-structure-035-ruined-gateway.png](images/previews/img-preview-structure-035-ruined-gateway.png) | 100285 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-036-offering-bowl.png` | ![img-preview-structure-036-offering-bowl.png](images/previews/img-preview-structure-036-offering-bowl.png) | 100286 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-037-gloomy-grotto.png` | ![img-preview-structure-037-gloomy-grotto.png](images/previews/img-preview-structure-037-gloomy-grotto.png) | 100287 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-038-pebble-cave.png` | ![img-preview-structure-038-pebble-cave.png](images/previews/img-preview-structure-038-pebble-cave.png) | 100288 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-039-overhang-den.png` | ![img-preview-structure-039-overhang-den.png](images/previews/img-preview-structure-039-overhang-den.png) | 100289 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-040-twinmouth-cave.png` | ![img-preview-structure-040-twinmouth-cave.png](images/previews/img-preview-structure-040-twinmouth-cave.png) | 100290 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-041-shadow-hollow.png` | ![img-preview-structure-041-shadow-hollow.png](images/previews/img-preview-structure-041-shadow-hollow.png) | 100291 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-042-shell-grotto.png` | ![img-preview-structure-042-shell-grotto.png](images/previews/img-preview-structure-042-shell-grotto.png) | 100292 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-043-basalt-cavern.png` | ![img-preview-structure-043-basalt-cavern.png](images/previews/img-preview-structure-043-basalt-cavern.png) | 100293 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-044-ledge-of-whispers.png` | ![img-preview-structure-044-ledge-of-whispers.png](images/previews/img-preview-structure-044-ledge-of-whispers.png) | 100294 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-045-hanging-shelf.png` | ![img-preview-structure-045-hanging-shelf.png](images/previews/img-preview-structure-045-hanging-shelf.png) | 100295 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-046-cantilever-crag.png` | ![img-preview-structure-046-cantilever-crag.png](images/previews/img-preview-structure-046-cantilever-crag.png) | 100296 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-047-shaded-lintel.png` | ![img-preview-structure-047-shaded-lintel.png](images/previews/img-preview-structure-047-shaded-lintel.png) | 100297 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-048-mossy-brow.png` | ![img-preview-structure-048-mossy-brow.png](images/previews/img-preview-structure-048-mossy-brow.png) | 100298 | ready | glyph=structure(arch); palette from structures.csv |
| `img-preview-structure-049-slate-awning.png` | ![img-preview-structure-049-slate-awning.png](images/previews/img-preview-structure-049-slate-awning.png) | 100299 | ready | glyph=structure(rock); palette from structures.csv |
| `img-preview-structure-050-dripstone-lip.png` | ![img-preview-structure-050-dripstone-lip.png](images/previews/img-preview-structure-050-dripstone-lip.png) | 100300 | ready | glyph=structure(arch); palette from structures.csv |

## Preview cards — plants

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-preview-plant-001-riverblade-green.png` | ![img-preview-plant-001-riverblade-green.png](images/previews/img-preview-plant-001-riverblade-green.png) | 100301 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-002-sabre-grass.png` | ![img-preview-plant-002-sabre-grass.png](images/previews/img-preview-plant-002-sabre-grass.png) | 100302 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-003-moonlit-ribbonweed.png` | ![img-preview-plant-003-moonlit-ribbonweed.png](images/previews/img-preview-plant-003-moonlit-ribbonweed.png) | 100303 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-004-copper-blade.png` | ![img-preview-plant-004-copper-blade.png](images/previews/img-preview-plant-004-copper-blade.png) | 100304 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-005-tideblade.png` | ![img-preview-plant-005-tideblade.png](images/previews/img-preview-plant-005-tideblade.png) | 100305 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-006-emerald-swordleaf.png` | ![img-preview-plant-006-emerald-swordleaf.png](images/previews/img-preview-plant-006-emerald-swordleaf.png) | 100306 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-007-dusky-eelgrass.png` | ![img-preview-plant-007-dusky-eelgrass.png](images/previews/img-preview-plant-007-dusky-eelgrass.png) | 100307 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-008-golden-ribbon.png` | ![img-preview-plant-008-golden-ribbon.png](images/previews/img-preview-plant-008-golden-ribbon.png) | 100308 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-009-frostblade.png` | ![img-preview-plant-009-frostblade.png](images/previews/img-preview-plant-009-frostblade.png) | 100309 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-010-deepwater-lance.png` | ![img-preview-plant-010-deepwater-lance.png](images/previews/img-preview-plant-010-deepwater-lance.png) | 100310 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-011-emerald-tuft.png` | ![img-preview-plant-011-emerald-tuft.png](images/previews/img-preview-plant-011-emerald-tuft.png) | 100311 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-012-bubbletip-tuft.png` | ![img-preview-plant-012-bubbletip-tuft.png](images/previews/img-preview-plant-012-bubbletip-tuft.png) | 100312 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-013-rust-tuft.png` | ![img-preview-plant-013-rust-tuft.png](images/previews/img-preview-plant-013-rust-tuft.png) | 100313 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-014-pearlgrass-tuft.png` | ![img-preview-plant-014-pearlgrass-tuft.png](images/previews/img-preview-plant-014-pearlgrass-tuft.png) | 100314 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-015-shadowmoss-tuft.png` | ![img-preview-plant-015-shadowmoss-tuft.png](images/previews/img-preview-plant-015-shadowmoss-tuft.png) | 100315 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-016-amber-tuft.png` | ![img-preview-plant-016-amber-tuft.png](images/previews/img-preview-plant-016-amber-tuft.png) | 100316 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-017-cloud-tuft.png` | ![img-preview-plant-017-cloud-tuft.png](images/previews/img-preview-plant-017-cloud-tuft.png) | 100317 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-018-jade-puff.png` | ![img-preview-plant-018-jade-puff.png](images/previews/img-preview-plant-018-jade-puff.png) | 100318 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-019-ember-tuft.png` | ![img-preview-plant-019-ember-tuft.png](images/previews/img-preview-plant-019-ember-tuft.png) | 100319 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-020-silverspray-tuft.png` | ![img-preview-plant-020-silverspray-tuft.png](images/previews/img-preview-plant-020-silverspray-tuft.png) | 100320 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-021-fanpalm-weed.png` | ![img-preview-plant-021-fanpalm-weed.png](images/previews/img-preview-plant-021-fanpalm-weed.png) | 100321 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-022-peacock-fan.png` | ![img-preview-plant-022-peacock-fan.png](images/previews/img-preview-plant-022-peacock-fan.png) | 100322 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-023-coral-fanleaf.png` | ![img-preview-plant-023-coral-fanleaf.png](images/previews/img-preview-plant-023-coral-fanleaf.png) | 100323 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-024-sunset-fanweed.png` | ![img-preview-plant-024-sunset-fanweed.png](images/previews/img-preview-plant-024-sunset-fanweed.png) | 100324 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-025-lace-fan.png` | ![img-preview-plant-025-lace-fan.png](images/previews/img-preview-plant-025-lace-fan.png) | 100325 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-026-mint-fan.png` | ![img-preview-plant-026-mint-fan.png](images/previews/img-preview-plant-026-mint-fan.png) | 100326 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-027-bronze-fan.png` | ![img-preview-plant-027-bronze-fan.png](images/previews/img-preview-plant-027-bronze-fan.png) | 100327 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-028-ghost-fan.png` | ![img-preview-plant-028-ghost-fan.png](images/previews/img-preview-plant-028-ghost-fan.png) | 100328 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-029-carpet-moss.png` | ![img-preview-plant-029-carpet-moss.png](images/previews/img-preview-plant-029-carpet-moss.png) | 100329 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-030-java-mat.png` | ![img-preview-plant-030-java-mat.png](images/previews/img-preview-plant-030-java-mat.png) | 100330 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-031-velvet-carpetweed.png` | ![img-preview-plant-031-velvet-carpetweed.png](images/previews/img-preview-plant-031-velvet-carpetweed.png) | 100331 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-032-pebble-moss-mat.png` | ![img-preview-plant-032-pebble-moss-mat.png](images/previews/img-preview-plant-032-pebble-moss-mat.png) | 100332 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-033-starlight-carpet.png` | ![img-preview-plant-033-starlight-carpet.png](images/previews/img-preview-plant-033-starlight-carpet.png) | 100333 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-034-olive-mat.png` | ![img-preview-plant-034-olive-mat.png](images/previews/img-preview-plant-034-olive-mat.png) | 100334 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-035-cushion-algae-mat.png` | ![img-preview-plant-035-cushion-algae-mat.png](images/previews/img-preview-plant-035-cushion-algae-mat.png) | 100335 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-036-dwarf-pearl-mat.png` | ![img-preview-plant-036-dwarf-pearl-mat.png](images/previews/img-preview-plant-036-dwarf-pearl-mat.png) | 100336 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-037-bridal-veilweed.png` | ![img-preview-plant-037-bridal-veilweed.png](images/previews/img-preview-plant-037-bridal-veilweed.png) | 100337 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-038-mist-veil.png` | ![img-preview-plant-038-mist-veil.png](images/previews/img-preview-plant-038-mist-veil.png) | 100338 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-039-green-cascade.png` | ![img-preview-plant-039-green-cascade.png](images/previews/img-preview-plant-039-green-cascade.png) | 100339 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-040-willow-veil.png` | ![img-preview-plant-040-willow-veil.png](images/previews/img-preview-plant-040-willow-veil.png) | 100340 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-041-silverfall-veil.png` | ![img-preview-plant-041-silverfall-veil.png](images/previews/img-preview-plant-041-silverfall-veil.png) | 100341 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-042-teardrop-veil.png` | ![img-preview-plant-042-teardrop-veil.png](images/previews/img-preview-plant-042-teardrop-veil.png) | 100342 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-043-hanging-gardens.png` | ![img-preview-plant-043-hanging-gardens.png](images/previews/img-preview-plant-043-hanging-gardens.png) | 100343 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-044-redstem-weed.png` | ![img-preview-plant-044-redstem-weed.png](images/previews/img-preview-plant-044-redstem-weed.png) | 100344 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-045-bamboo-stem.png` | ![img-preview-plant-045-bamboo-stem.png](images/previews/img-preview-plant-045-bamboo-stem.png) | 100345 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-046-corkscrew-stem.png` | ![img-preview-plant-046-corkscrew-stem.png](images/previews/img-preview-plant-046-corkscrew-stem.png) | 100346 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-047-ladderweed.png` | ![img-preview-plant-047-ladderweed.png](images/previews/img-preview-plant-047-ladderweed.png) | 100347 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-048-pinkstem.png` | ![img-preview-plant-048-pinkstem.png](images/previews/img-preview-plant-048-pinkstem.png) | 100348 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-049-zigzag-stem.png` | ![img-preview-plant-049-zigzag-stem.png](images/previews/img-preview-plant-049-zigzag-stem.png) | 100349 | ready | glyph=plant; palette from plant-species.csv |
| `img-preview-plant-050-crystal-stem.png` | ![img-preview-plant-050-crystal-stem.png](images/previews/img-preview-plant-050-crystal-stem.png) | 100350 | ready | glyph=plant; palette from plant-species.csv |

## Preview cards — floors

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-preview-floor-001-river-sand.png` | ![img-preview-floor-001-river-sand.png](images/previews/img-preview-floor-001-river-sand.png) | 100351 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-002-black-volcanic-gravel.png` | ![img-preview-floor-002-black-volcanic-gravel.png](images/previews/img-preview-floor-002-black-volcanic-gravel.png) | 100352 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-003-golden-pea-gravel.png` | ![img-preview-floor-003-golden-pea-gravel.png](images/previews/img-preview-floor-003-golden-pea-gravel.png) | 100353 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-004-white-coral-sand.png` | ![img-preview-floor-004-white-coral-sand.png](images/previews/img-preview-floor-004-white-coral-sand.png) | 100354 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-005-amazon-soil.png` | ![img-preview-floor-005-amazon-soil.png](images/previews/img-preview-floor-005-amazon-soil.png) | 100355 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-006-slate-tiles.png` | ![img-preview-floor-006-slate-tiles.png](images/previews/img-preview-floor-006-slate-tiles.png) | 100356 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-007-muddy-riverbed.png` | ![img-preview-floor-007-muddy-riverbed.png](images/previews/img-preview-floor-007-muddy-riverbed.png) | 100357 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-008-crushed-shell.png` | ![img-preview-floor-008-crushed-shell.png](images/previews/img-preview-floor-008-crushed-shell.png) | 100358 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-009-lava-rock-chips.png` | ![img-preview-floor-009-lava-rock-chips.png](images/previews/img-preview-floor-009-lava-rock-chips.png) | 100359 | ready | glyph=floor; palette from floors-substrates.csv |
| `img-preview-floor-010-glass-pebbles.png` | ![img-preview-floor-010-glass-pebbles.png](images/previews/img-preview-floor-010-glass-pebbles.png) | 100360 | ready | glyph=floor; palette from floors-substrates.csv |

## Preview cards — environments

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `img-preview-env-001-studio.png` | ![img-preview-env-001-studio.png](images/previews/img-preview-env-001-studio.png) | 100361 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-002-living-room.png` | ![img-preview-env-002-living-room.png](images/previews/img-preview-env-002-living-room.png) | 100362 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-003-lab.png` | ![img-preview-env-003-lab.png](images/previews/img-preview-env-003-lab.png) | 100363 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-004-public-aquarium.png` | ![img-preview-env-004-public-aquarium.png](images/previews/img-preview-env-004-public-aquarium.png) | 100364 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-005-city.png` | ![img-preview-env-005-city.png](images/previews/img-preview-env-005-city.png) | 100365 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-006-forest.png` | ![img-preview-env-006-forest.png](images/previews/img-preview-env-006-forest.png) | 100366 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-007-ocean.png` | ![img-preview-env-007-ocean.png](images/previews/img-preview-env-007-ocean.png) | 100367 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-008-greenhouse.png` | ![img-preview-env-008-greenhouse.png](images/previews/img-preview-env-008-greenhouse.png) | 100368 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-009-desert.png` | ![img-preview-env-009-desert.png](images/previews/img-preview-env-009-desert.png) | 100369 | ready | glyph=env; palette derived from name->palette mapping |
| `img-preview-env-010-cabin-loft.png` | ![img-preview-env-010-cabin-loft.png](images/previews/img-preview-env-010-cabin-loft.png) | 100370 | ready | glyph=env; palette derived from name->palette mapping |

## Fish meshes

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `mesh-fish-angular_LOD0.glb` | ![mesh-fish-angular_LOD0.glb](meshes/previews/mesh-fish-angular-preview.png) | 11001 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-angular_LOD1.glb` | ![mesh-fish-angular_LOD1.glb](meshes/previews/mesh-fish-angular-preview.png) | 11001 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-angular_LOD2.glb` | ![mesh-fish-angular_LOD2.glb](meshes/previews/mesh-fish-angular-preview.png) | 11001 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-blade-like_LOD0.glb` | ![mesh-fish-blade-like_LOD0.glb](meshes/previews/mesh-fish-blade-like-preview.png) | 11002 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-blade-like_LOD1.glb` | ![mesh-fish-blade-like_LOD1.glb](meshes/previews/mesh-fish-blade-like-preview.png) | 11002 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-blade-like_LOD2.glb` | ![mesh-fish-blade-like_LOD2.glb](meshes/previews/mesh-fish-blade-like-preview.png) | 11002 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-chunky_LOD0.glb` | ![mesh-fish-chunky_LOD0.glb](meshes/previews/mesh-fish-chunky-preview.png) | 11003 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-chunky_LOD1.glb` | ![mesh-fish-chunky_LOD1.glb](meshes/previews/mesh-fish-chunky-preview.png) | 11003 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-chunky_LOD2.glb` | ![mesh-fish-chunky_LOD2.glb](meshes/previews/mesh-fish-chunky-preview.png) | 11003 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-compact_LOD0.glb` | ![mesh-fish-compact_LOD0.glb](meshes/previews/mesh-fish-compact-preview.png) | 11004 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-compact_LOD1.glb` | ![mesh-fish-compact_LOD1.glb](meshes/previews/mesh-fish-compact-preview.png) | 11004 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-compact_LOD2.glb` | ![mesh-fish-compact_LOD2.glb](meshes/previews/mesh-fish-compact-preview.png) | 11004 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-deep-bodied_LOD0.glb` | ![mesh-fish-deep-bodied_LOD0.glb](meshes/previews/mesh-fish-deep-bodied-preview.png) | 11005 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-deep-bodied_LOD1.glb` | ![mesh-fish-deep-bodied_LOD1.glb](meshes/previews/mesh-fish-deep-bodied-preview.png) | 11005 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-deep-bodied_LOD2.glb` | ![mesh-fish-deep-bodied_LOD2.glb](meshes/previews/mesh-fish-deep-bodied-preview.png) | 11005 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-elongated_LOD0.glb` | ![mesh-fish-elongated_LOD0.glb](meshes/previews/mesh-fish-elongated-preview.png) | 11006 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-elongated_LOD1.glb` | ![mesh-fish-elongated_LOD1.glb](meshes/previews/mesh-fish-elongated-preview.png) | 11006 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-elongated_LOD2.glb` | ![mesh-fish-elongated_LOD2.glb](meshes/previews/mesh-fish-elongated-preview.png) | 11006 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-fin-delicate-tail.glb` | ![mesh-fish-fin-delicate-tail.glb](meshes/previews/mesh-fish-fin-delicate-tail-preview.png) | 11102 | ready | fin variant 'delicate tail': neutral body + representative hero fin(s) · 168 tris |
| `mesh-fish-fin-delicate.glb` | ![mesh-fish-fin-delicate.glb](meshes/previews/mesh-fish-fin-delicate-preview.png) | 11101 | ready | fin variant 'delicate': neutral body + representative hero fin(s) · 116 tris |
| `mesh-fish-fin-glowing-belly.glb` | ![mesh-fish-fin-glowing-belly.glb](meshes/previews/mesh-fish-fin-glowing-belly-preview.png) | 11103 | ready | fin variant 'glowing belly': neutral body + representative hero fin(s) · 116 tris |
| `mesh-fish-fin-glowing-fins.glb` | ![mesh-fish-fin-glowing-fins.glb](meshes/previews/mesh-fish-fin-glowing-fins-preview.png) | 11104 | ready | fin variant 'glowing fins': neutral body + representative hero fin(s) · 144 tris |
| `mesh-fish-fin-large-veil.glb` | ![mesh-fish-fin-large-veil.glb](meshes/previews/mesh-fish-fin-large-veil-preview.png) | 11105 | ready | fin variant 'large veil': neutral body + representative hero fin(s) · 252 tris |
| `mesh-fish-fin-leafy-tail.glb` | ![mesh-fish-fin-leafy-tail.glb](meshes/previews/mesh-fish-fin-leafy-tail-preview.png) | 11106 | ready | fin variant 'leafy tail': neutral body + representative hero fin(s) · 200 tris |
| `mesh-fish-fin-metallic-fins.glb` | ![mesh-fish-fin-metallic-fins.glb](meshes/previews/mesh-fish-fin-metallic-fins-preview.png) | 11107 | ready | fin variant 'metallic fins': neutral body + representative hero fin(s) · 164 tris |
| `mesh-fish-fin-opalescent-veil.glb` | ![mesh-fish-fin-opalescent-veil.glb](meshes/previews/mesh-fish-fin-opalescent-veil-preview.png) | 11108 | ready | fin variant 'opalescent veil': neutral body + representative hero fin(s) · 252 tris |
| `mesh-fish-fin-ornate-fan.glb` | ![mesh-fish-fin-ornate-fan.glb](meshes/previews/mesh-fish-fin-ornate-fan-preview.png) | 11109 | ready | fin variant 'ornate fan': neutral body + representative hero fin(s) · 216 tris |
| `mesh-fish-fin-ornate-tail.glb` | ![mesh-fish-fin-ornate-tail.glb](meshes/previews/mesh-fish-fin-ornate-tail-preview.png) | 11110 | ready | fin variant 'ornate tail': neutral body + representative hero fin(s) · 216 tris |
| `mesh-fish-fin-pointed-tail.glb` | ![mesh-fish-fin-pointed-tail.glb](meshes/previews/mesh-fish-fin-pointed-tail-preview.png) | 11111 | ready | fin variant 'pointed tail': neutral body + representative hero fin(s) · 168 tris |
| `mesh-fish-fin-ribbon-fins.glb` | ![mesh-fish-fin-ribbon-fins.glb](meshes/previews/mesh-fish-fin-ribbon-fins-preview.png) | 11112 | ready | fin variant 'ribbon fins': neutral body + representative hero fin(s) · 216 tris |
| `mesh-fish-fin-ribbon-tail.glb` | ![mesh-fish-fin-ribbon-tail.glb](meshes/previews/mesh-fish-fin-ribbon-tail-preview.png) | 11113 | ready | fin variant 'ribbon tail': neutral body + representative hero fin(s) · 184 tris |
| `mesh-fish-fin-rounded-fins.glb` | ![mesh-fish-fin-rounded-fins.glb](meshes/previews/mesh-fish-fin-rounded-fins-preview.png) | 11115 | ready | fin variant 'rounded fins': neutral body + representative hero fin(s) · 160 tris |
| `mesh-fish-fin-rounded.glb` | ![mesh-fish-fin-rounded.glb](meshes/previews/mesh-fish-fin-rounded-preview.png) | 11114 | ready | fin variant 'rounded': neutral body + representative hero fin(s) · 184 tris |
| `mesh-fish-fin-sharp-fins.glb` | ![mesh-fish-fin-sharp-fins.glb](meshes/previews/mesh-fish-fin-sharp-fins-preview.png) | 11116 | ready | fin variant 'sharp fins': neutral body + representative hero fin(s) · 164 tris |
| `mesh-fish-fin-sharp-tail.glb` | ![mesh-fish-fin-sharp-tail.glb](meshes/previews/mesh-fish-fin-sharp-tail-preview.png) | 11117 | ready | fin variant 'sharp tail': neutral body + representative hero fin(s) · 152 tris |
| `mesh-fish-fin-short-fins.glb` | ![mesh-fish-fin-short-fins.glb](meshes/previews/mesh-fish-fin-short-fins-preview.png) | 11118 | ready | fin variant 'short fins': neutral body + representative hero fin(s) · 108 tris |
| `mesh-fish-fin-short-rounded.glb` | ![mesh-fish-fin-short-rounded.glb](meshes/previews/mesh-fish-fin-short-rounded-preview.png) | 11119 | ready | fin variant 'short rounded': neutral body + representative hero fin(s) · 168 tris |
| `mesh-fish-fin-small-dorsal.glb` | ![mesh-fish-fin-small-dorsal.glb](meshes/previews/mesh-fish-fin-small-dorsal-preview.png) | 11120 | ready | fin variant 'small dorsal': neutral body + representative hero fin(s) · 108 tris |
| `mesh-fish-fin-small-fins.glb` | ![mesh-fish-fin-small-fins.glb](meshes/previews/mesh-fish-fin-small-fins-preview.png) | 11121 | ready | fin variant 'small fins': neutral body + representative hero fin(s) · 108 tris |
| `mesh-fish-fin-small-paired.glb` | ![mesh-fish-fin-small-paired.glb](meshes/previews/mesh-fish-fin-small-paired-preview.png) | 11122 | ready | fin variant 'small paired': neutral body + representative hero fin(s) · 128 tris |
| `mesh-fish-fin-small-rear-fins.glb` | ![mesh-fish-fin-small-rear-fins.glb](meshes/previews/mesh-fish-fin-small-rear-fins-preview.png) | 11123 | ready | fin variant 'small rear fins': neutral body + representative hero fin(s) · 108 tris |
| `mesh-fish-fin-small-translucent.glb` | ![mesh-fish-fin-small-translucent.glb](meshes/previews/mesh-fish-fin-small-translucent-preview.png) | 11124 | ready | fin variant 'small translucent': neutral body + representative hero fin(s) · 116 tris |
| `mesh-fish-fin-soft-fins.glb` | ![mesh-fish-fin-soft-fins.glb](meshes/previews/mesh-fish-fin-soft-fins-preview.png) | 11125 | ready | fin variant 'soft fins': neutral body + representative hero fin(s) · 160 tris |
| `mesh-fish-fin-soft-veil.glb` | ![mesh-fish-fin-soft-veil.glb](meshes/previews/mesh-fish-fin-soft-veil-preview.png) | 11126 | ready | fin variant 'soft veil': neutral body + representative hero fin(s) · 252 tris |
| `mesh-fish-fin-tapered-flowing.glb` | ![mesh-fish-fin-tapered-flowing.glb](meshes/previews/mesh-fish-fin-tapered-flowing-preview.png) | 11127 | ready | fin variant 'tapered flowing': neutral body + representative hero fin(s) · 184 tris |
| `mesh-fish-fin-translucent-fins.glb` | ![mesh-fish-fin-translucent-fins.glb](meshes/previews/mesh-fish-fin-translucent-fins-preview.png) | 11128 | ready | fin variant 'translucent fins': neutral body + representative hero fin(s) · 144 tris |
| `mesh-fish-fin-transparent-fins.glb` | ![mesh-fish-fin-transparent-fins.glb](meshes/previews/mesh-fish-fin-transparent-fins-preview.png) | 11129 | ready | fin variant 'transparent fins': neutral body + representative hero fin(s) · 116 tris |
| `mesh-fish-fin-wide-veil.glb` | ![mesh-fish-fin-wide-veil.glb](meshes/previews/mesh-fish-fin-wide-veil-preview.png) | 11130 | ready | fin variant 'wide veil': neutral body + representative hero fin(s) · 252 tris |
| `mesh-fish-heavy_LOD0.glb` | ![mesh-fish-heavy_LOD0.glb](meshes/previews/mesh-fish-heavy-preview.png) | 11007 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-heavy_LOD1.glb` | ![mesh-fish-heavy_LOD1.glb](meshes/previews/mesh-fish-heavy-preview.png) | 11007 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-heavy_LOD2.glb` | ![mesh-fish-heavy_LOD2.glb](meshes/previews/mesh-fish-heavy-preview.png) | 11007 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-needle-like_LOD0.glb` | ![mesh-fish-needle-like_LOD0.glb](meshes/previews/mesh-fish-needle-like-preview.png) | 11008 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-needle-like_LOD1.glb` | ![mesh-fish-needle-like_LOD1.glb](meshes/previews/mesh-fish-needle-like-preview.png) | 11008 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-needle-like_LOD2.glb` | ![mesh-fish-needle-like_LOD2.glb](meshes/previews/mesh-fish-needle-like-preview.png) | 11008 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-pointed_LOD0.glb` | ![mesh-fish-pointed_LOD0.glb](meshes/previews/mesh-fish-pointed-preview.png) | 11009 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-pointed_LOD1.glb` | ![mesh-fish-pointed_LOD1.glb](meshes/previews/mesh-fish-pointed-preview.png) | 11009 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-pointed_LOD2.glb` | ![mesh-fish-pointed_LOD2.glb](meshes/previews/mesh-fish-pointed-preview.png) | 11009 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-rounded_LOD0.glb` | ![mesh-fish-rounded_LOD0.glb](meshes/previews/mesh-fish-rounded-preview.png) | 11010 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-rounded_LOD1.glb` | ![mesh-fish-rounded_LOD1.glb](meshes/previews/mesh-fish-rounded-preview.png) | 11010 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-rounded_LOD2.glb` | ![mesh-fish-rounded_LOD2.glb](meshes/previews/mesh-fish-rounded-preview.png) | 11010 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-sleek_LOD0.glb` | ![mesh-fish-sleek_LOD0.glb](meshes/previews/mesh-fish-sleek-preview.png) | 11011 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-sleek_LOD1.glb` | ![mesh-fish-sleek_LOD1.glb](meshes/previews/mesh-fish-sleek-preview.png) | 11011 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-sleek_LOD2.glb` | ![mesh-fish-sleek_LOD2.glb](meshes/previews/mesh-fish-sleek-preview.png) | 11011 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-slender_LOD0.glb` | ![mesh-fish-slender_LOD0.glb](meshes/previews/mesh-fish-slender-preview.png) | 11012 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-slender_LOD1.glb` | ![mesh-fish-slender_LOD1.glb](meshes/previews/mesh-fish-slender-preview.png) | 11012 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-slender_LOD2.glb` | ![mesh-fish-slender_LOD2.glb](meshes/previews/mesh-fish-slender-preview.png) | 11012 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-streamlined_LOD0.glb` | ![mesh-fish-streamlined_LOD0.glb](meshes/previews/mesh-fish-streamlined-preview.png) | 11013 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-streamlined_LOD1.glb` | ![mesh-fish-streamlined_LOD1.glb](meshes/previews/mesh-fish-streamlined-preview.png) | 11013 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-streamlined_LOD2.glb` | ![mesh-fish-streamlined_LOD2.glb](meshes/previews/mesh-fish-streamlined-preview.png) | 11013 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-tail-burst-whip.glb` | ![mesh-fish-tail-burst-whip.glb](meshes/previews/mesh-fish-tail-burst-whip-preview.png) | 11201 | ready | tail variant 'burst whip': neutral body + tail fin fork=0.7 size=0.62 wave=0.0 · 184 tris |
| `mesh-fish-tail-fast-slice.glb` | ![mesh-fish-tail-fast-slice.glb](meshes/previews/mesh-fish-tail-fast-slice-preview.png) | 11202 | ready | tail variant 'fast slice': neutral body + tail fin fork=0.3 size=0.48 wave=0.0 · 184 tris |
| `mesh-fish-tail-flow.glb` | ![mesh-fish-tail-flow.glb](meshes/previews/mesh-fish-tail-flow-preview.png) | 11203 | ready | tail variant 'flow': neutral body + tail fin fork=0.2 size=0.55 wave=0.04 · 184 tris |
| `mesh-fish-tail-flowing-whip.glb` | ![mesh-fish-tail-flowing-whip.glb](meshes/previews/mesh-fish-tail-flowing-whip-preview.png) | 11204 | ready | tail variant 'flowing whip': neutral body + tail fin fork=0.6 size=0.7 wave=0.05 · 184 tris |
| `mesh-fish-tail-flutter.glb` | ![mesh-fish-tail-flutter.glb](meshes/previews/mesh-fish-tail-flutter-preview.png) | 11205 | ready | tail variant 'flutter': neutral body + tail fin fork=0.5 size=0.42 wave=0.06 · 184 tris |
| `mesh-fish-tail-quick-flick.glb` | ![mesh-fish-tail-quick-flick.glb](meshes/previews/mesh-fish-tail-quick-flick-preview.png) | 11206 | ready | tail variant 'quick flick': neutral body + tail fin fork=0.6 size=0.42 wave=0.0 · 184 tris |
| `mesh-fish-tail-quick-whip.glb` | ![mesh-fish-tail-quick-whip.glb](meshes/previews/mesh-fish-tail-quick-whip-preview.png) | 11207 | ready | tail variant 'quick whip': neutral body + tail fin fork=0.7 size=0.55 wave=0.0 · 184 tris |
| `mesh-fish-tail-rapid-dart.glb` | ![mesh-fish-tail-rapid-dart.glb](meshes/previews/mesh-fish-tail-rapid-dart-preview.png) | 11208 | ready | tail variant 'rapid dart': neutral body + tail fin fork=0.25 size=0.42 wave=0.0 · 184 tris |
| `mesh-fish-tail-rapid-whip.glb` | ![mesh-fish-tail-rapid-whip.glb](meshes/previews/mesh-fish-tail-rapid-whip-preview.png) | 11209 | ready | tail variant 'rapid whip': neutral body + tail fin fork=0.65 size=0.6 wave=0.0 · 184 tris |
| `mesh-fish-tail-ripple.glb` | ![mesh-fish-tail-ripple.glb](meshes/previews/mesh-fish-tail-ripple-preview.png) | 11210 | ready | tail variant 'ripple': neutral body + tail fin fork=0.4 size=0.55 wave=0.1 · 184 tris |
| `mesh-fish-tail-sinuous.glb` | ![mesh-fish-tail-sinuous.glb](meshes/previews/mesh-fish-tail-sinuous-preview.png) | 11211 | ready | tail variant 'sinuous': neutral body + tail fin fork=0.45 size=0.66 wave=0.1 · 184 tris |
| `mesh-fish-tail-slow-undulate.glb` | ![mesh-fish-tail-slow-undulate.glb](meshes/previews/mesh-fish-tail-slow-undulate-preview.png) | 11212 | ready | tail variant 'slow undulate': neutral body + tail fin fork=0.5 size=0.7 wave=0.07 · 184 tris |
| `mesh-fish-tail-soft-flow.glb` | ![mesh-fish-tail-soft-flow.glb](meshes/previews/mesh-fish-tail-soft-flow-preview.png) | 11213 | ready | tail variant 'soft flow': neutral body + tail fin fork=0.35 size=0.58 wave=0.05 · 184 tris |
| `mesh-fish-tail-soft-flutter.glb` | ![mesh-fish-tail-soft-flutter.glb](meshes/previews/mesh-fish-tail-soft-flutter-preview.png) | 11214 | ready | tail variant 'soft flutter': neutral body + tail fin fork=0.5 size=0.44 wave=0.07 · 184 tris |
| `mesh-fish-tail-soft-glide.glb` | ![mesh-fish-tail-soft-glide.glb](meshes/previews/mesh-fish-tail-soft-glide-preview.png) | 11215 | ready | tail variant 'soft glide': neutral body + tail fin fork=0.15 size=0.55 wave=0.03 · 184 tris |
| `mesh-fish-tail-soft-ripple.glb` | ![mesh-fish-tail-soft-ripple.glb](meshes/previews/mesh-fish-tail-soft-ripple-preview.png) | 11216 | ready | tail variant 'soft ripple': neutral body + tail fin fork=0.4 size=0.58 wave=0.1 · 184 tris |
| `mesh-fish-tail-soft-undulate.glb` | ![mesh-fish-tail-soft-undulate.glb](meshes/previews/mesh-fish-tail-soft-undulate-preview.png) | 11217 | ready | tail variant 'soft undulate': neutral body + tail fin fork=0.45 size=0.64 wave=0.08 · 184 tris |
| `mesh-fish-tail-steady-whip.glb` | ![mesh-fish-tail-steady-whip.glb](meshes/previews/mesh-fish-tail-steady-whip-preview.png) | 11218 | ready | tail variant 'steady whip': neutral body + tail fin fork=0.55 size=0.58 wave=0.0 · 184 tris |
| `mesh-fish-tail-undulate.glb` | ![mesh-fish-tail-undulate.glb](meshes/previews/mesh-fish-tail-undulate-preview.png) | 11219 | ready | tail variant 'undulate': neutral body + tail fin fork=0.5 size=0.62 wave=0.07 · 184 tris |
| `mesh-fish-tail-whip.glb` | ![mesh-fish-tail-whip.glb](meshes/previews/mesh-fish-tail-whip-preview.png) | 11220 | ready | tail variant 'whip': neutral body + tail fin fork=0.6 size=0.58 wave=0.0 · 184 tris |
| `mesh-fish-thin_LOD0.glb` | ![mesh-fish-thin_LOD0.glb](meshes/previews/mesh-fish-thin-preview.png) | 11014 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-thin_LOD1.glb` | ![mesh-fish-thin_LOD1.glb](meshes/previews/mesh-fish-thin-preview.png) | 11014 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-thin_LOD2.glb` | ![mesh-fish-thin_LOD2.glb](meshes/previews/mesh-fish-thin-preview.png) | 11014 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-tiny_LOD0.glb` | ![mesh-fish-tiny_LOD0.glb](meshes/previews/mesh-fish-tiny-preview.png) | 11015 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-tiny_LOD1.glb` | ![mesh-fish-tiny_LOD1.glb](meshes/previews/mesh-fish-tiny-preview.png) | 11015 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-tiny_LOD2.glb` | ![mesh-fish-tiny_LOD2.glb](meshes/previews/mesh-fish-tiny-preview.png) | 11015 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-torpedo_LOD0.glb` | ![mesh-fish-torpedo_LOD0.glb](meshes/previews/mesh-fish-torpedo-preview.png) | 11016 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-torpedo_LOD1.glb` | ![mesh-fish-torpedo_LOD1.glb](meshes/previews/mesh-fish-torpedo-preview.png) | 11016 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-torpedo_LOD2.glb` | ![mesh-fish-torpedo_LOD2.glb](meshes/previews/mesh-fish-torpedo-preview.png) | 11016 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |
| `mesh-fish-transparent_LOD0.glb` | ![mesh-fish-transparent_LOD0.glb](meshes/previews/mesh-fish-transparent-preview.png) | 11017 | ready | attempt 1: subdiv3 tail_n=6 dor_n=5 pec_n=4 · 1492 tris |
| `mesh-fish-transparent_LOD1.glb` | ![mesh-fish-transparent_LOD1.glb](meshes/previews/mesh-fish-transparent-preview.png) | 11017 | ready | attempt 1: subdiv2 tail_n=3 dor_n=3 pec_n=2 · 436 tris |
| `mesh-fish-transparent_LOD2.glb` | ![mesh-fish-transparent_LOD2.glb](meshes/previews/mesh-fish-transparent-preview.png) | 11017 | ready | attempt 1: subdiv1 tail_n=2 dor_n=0 pec_n=0 · 120 tris |

## Structure meshes

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `mesh-structure-001-ember-boulder_LOD0.glb` | ![mesh-structure-001-ember-boulder_LOD0.glb](meshes/previews/mesh-structure-001-ember-boulder-preview.png) | 13001 | ready | ok · 5120 tris |
| `mesh-structure-001-ember-boulder_LOD1.glb` | ![mesh-structure-001-ember-boulder_LOD1.glb](meshes/previews/mesh-structure-001-ember-boulder-preview.png) | 13001 | ready | ok · 1280 tris |
| `mesh-structure-001-ember-boulder_LOD2.glb` | ![mesh-structure-001-ember-boulder_LOD2.glb](meshes/previews/mesh-structure-001-ember-boulder-preview.png) | 13001 | ready | ok · 320 tris |
| `mesh-structure-002-mosscap-stone_LOD0.glb` | ![mesh-structure-002-mosscap-stone_LOD0.glb](meshes/previews/mesh-structure-002-mosscap-stone-preview.png) | 13002 | ready | ok · 5120 tris |
| `mesh-structure-002-mosscap-stone_LOD1.glb` | ![mesh-structure-002-mosscap-stone_LOD1.glb](meshes/previews/mesh-structure-002-mosscap-stone-preview.png) | 13002 | ready | ok · 1280 tris |
| `mesh-structure-002-mosscap-stone_LOD2.glb` | ![mesh-structure-002-mosscap-stone_LOD2.glb](meshes/previews/mesh-structure-002-mosscap-stone-preview.png) | 13002 | ready | ok · 320 tris |
| `mesh-structure-003-split-granite_LOD0.glb` | ![mesh-structure-003-split-granite_LOD0.glb](meshes/previews/mesh-structure-003-split-granite-preview.png) | 13003 | ready | ok · 5120 tris |
| `mesh-structure-003-split-granite_LOD1.glb` | ![mesh-structure-003-split-granite_LOD1.glb](meshes/previews/mesh-structure-003-split-granite-preview.png) | 13003 | ready | ok · 1280 tris |
| `mesh-structure-003-split-granite_LOD2.glb` | ![mesh-structure-003-split-granite_LOD2.glb](meshes/previews/mesh-structure-003-split-granite-preview.png) | 13003 | ready | ok · 320 tris |
| `mesh-structure-004-tideworn-slab_LOD0.glb` | ![mesh-structure-004-tideworn-slab_LOD0.glb](meshes/previews/mesh-structure-004-tideworn-slab-preview.png) | 13004 | ready | ok · 5120 tris |
| `mesh-structure-004-tideworn-slab_LOD1.glb` | ![mesh-structure-004-tideworn-slab_LOD1.glb](meshes/previews/mesh-structure-004-tideworn-slab-preview.png) | 13004 | ready | ok · 1280 tris |
| `mesh-structure-004-tideworn-slab_LOD2.glb` | ![mesh-structure-004-tideworn-slab_LOD2.glb](meshes/previews/mesh-structure-004-tideworn-slab-preview.png) | 13004 | ready | ok · 320 tris |
| `mesh-structure-005-basalt-fang_LOD0.glb` | ![mesh-structure-005-basalt-fang_LOD0.glb](meshes/previews/mesh-structure-005-basalt-fang-preview.png) | 13005 | ready | ok · 5120 tris |
| `mesh-structure-005-basalt-fang_LOD1.glb` | ![mesh-structure-005-basalt-fang_LOD1.glb](meshes/previews/mesh-structure-005-basalt-fang-preview.png) | 13005 | ready | ok · 1280 tris |
| `mesh-structure-005-basalt-fang_LOD2.glb` | ![mesh-structure-005-basalt-fang_LOD2.glb](meshes/previews/mesh-structure-005-basalt-fang-preview.png) | 13005 | ready | ok · 320 tris |
| `mesh-structure-006-rivercobble-heap_LOD0.glb` | ![mesh-structure-006-rivercobble-heap_LOD0.glb](meshes/previews/mesh-structure-006-rivercobble-heap-preview.png) | 13006 | ready | ok · 5120 tris |
| `mesh-structure-006-rivercobble-heap_LOD1.glb` | ![mesh-structure-006-rivercobble-heap_LOD1.glb](meshes/previews/mesh-structure-006-rivercobble-heap-preview.png) | 13006 | ready | ok · 1280 tris |
| `mesh-structure-006-rivercobble-heap_LOD2.glb` | ![mesh-structure-006-rivercobble-heap_LOD2.glb](meshes/previews/mesh-structure-006-rivercobble-heap-preview.png) | 13006 | ready | ok · 320 tris |
| `mesh-structure-007-sunstone-shelf_LOD0.glb` | ![mesh-structure-007-sunstone-shelf_LOD0.glb](meshes/previews/mesh-structure-007-sunstone-shelf-preview.png) | 13007 | ready | ok · 5120 tris |
| `mesh-structure-007-sunstone-shelf_LOD1.glb` | ![mesh-structure-007-sunstone-shelf_LOD1.glb](meshes/previews/mesh-structure-007-sunstone-shelf-preview.png) | 13007 | ready | ok · 1280 tris |
| `mesh-structure-007-sunstone-shelf_LOD2.glb` | ![mesh-structure-007-sunstone-shelf_LOD2.glb](meshes/previews/mesh-structure-007-sunstone-shelf-preview.png) | 13007 | ready | ok · 320 tris |
| `mesh-structure-008-ashen-crag_LOD0.glb` | ![mesh-structure-008-ashen-crag_LOD0.glb](meshes/previews/mesh-structure-008-ashen-crag-preview.png) | 13008 | ready | ok · 5120 tris |
| `mesh-structure-008-ashen-crag_LOD1.glb` | ![mesh-structure-008-ashen-crag_LOD1.glb](meshes/previews/mesh-structure-008-ashen-crag-preview.png) | 13008 | ready | ok · 1280 tris |
| `mesh-structure-008-ashen-crag_LOD2.glb` | ![mesh-structure-008-ashen-crag_LOD2.glb](meshes/previews/mesh-structure-008-ashen-crag-preview.png) | 13008 | ready | ok · 320 tris |
| `mesh-structure-009-pebble-garden-ring_LOD0.glb` | ![mesh-structure-009-pebble-garden-ring_LOD0.glb](meshes/previews/mesh-structure-009-pebble-garden-ring-preview.png) | 13009 | ready | ok · 5120 tris |
| `mesh-structure-009-pebble-garden-ring_LOD1.glb` | ![mesh-structure-009-pebble-garden-ring_LOD1.glb](meshes/previews/mesh-structure-009-pebble-garden-ring-preview.png) | 13009 | ready | ok · 1280 tris |
| `mesh-structure-009-pebble-garden-ring_LOD2.glb` | ![mesh-structure-009-pebble-garden-ring_LOD2.glb](meshes/previews/mesh-structure-009-pebble-garden-ring-preview.png) | 13009 | ready | ok · 320 tris |
| `mesh-structure-010-ironstone-block_LOD0.glb` | ![mesh-structure-010-ironstone-block_LOD0.glb](meshes/previews/mesh-structure-010-ironstone-block-preview.png) | 13010 | ready | ok · 5120 tris |
| `mesh-structure-010-ironstone-block_LOD1.glb` | ![mesh-structure-010-ironstone-block_LOD1.glb](meshes/previews/mesh-structure-010-ironstone-block-preview.png) | 13010 | ready | ok · 1280 tris |
| `mesh-structure-010-ironstone-block_LOD2.glb` | ![mesh-structure-010-ironstone-block_LOD2.glb](meshes/previews/mesh-structure-010-ironstone-block-preview.png) | 13010 | ready | ok · 320 tris |
| `mesh-structure-011-slate-shard_LOD0.glb` | ![mesh-structure-011-slate-shard_LOD0.glb](meshes/previews/mesh-structure-011-slate-shard-preview.png) | 13011 | ready | ok · 5120 tris |
| `mesh-structure-011-slate-shard_LOD1.glb` | ![mesh-structure-011-slate-shard_LOD1.glb](meshes/previews/mesh-structure-011-slate-shard-preview.png) | 13011 | ready | ok · 1280 tris |
| `mesh-structure-011-slate-shard_LOD2.glb` | ![mesh-structure-011-slate-shard_LOD2.glb](meshes/previews/mesh-structure-011-slate-shard-preview.png) | 13011 | ready | ok · 320 tris |
| `mesh-structure-012-coralrock-knoll_LOD0.glb` | ![mesh-structure-012-coralrock-knoll_LOD0.glb](meshes/previews/mesh-structure-012-coralrock-knoll-preview.png) | 13012 | ready | ok · 5120 tris |
| `mesh-structure-012-coralrock-knoll_LOD1.glb` | ![mesh-structure-012-coralrock-knoll_LOD1.glb](meshes/previews/mesh-structure-012-coralrock-knoll-preview.png) | 13012 | ready | ok · 1280 tris |
| `mesh-structure-012-coralrock-knoll_LOD2.glb` | ![mesh-structure-012-coralrock-knoll_LOD2.glb](meshes/previews/mesh-structure-012-coralrock-knoll-preview.png) | 13012 | ready | ok · 320 tris |
| `mesh-structure-013-moon-gate-arch_LOD0.glb` | ![mesh-structure-013-moon-gate-arch_LOD0.glb](meshes/previews/mesh-structure-013-moon-gate-arch-preview.png) | 13013 | ready | ok · 7160 tris |
| `mesh-structure-013-moon-gate-arch_LOD1.glb` | ![mesh-structure-013-moon-gate-arch_LOD1.glb](meshes/previews/mesh-structure-013-moon-gate-arch-preview.png) | 13013 | ready | ok · 2244 tris |
| `mesh-structure-013-moon-gate-arch_LOD2.glb` | ![mesh-structure-013-moon-gate-arch_LOD2.glb](meshes/previews/mesh-structure-013-moon-gate-arch-preview.png) | 13013 | ready | ok · 544 tris |
| `mesh-structure-014-twinfin-arch_LOD0.glb` | ![mesh-structure-014-twinfin-arch_LOD0.glb](meshes/previews/mesh-structure-014-twinfin-arch-preview.png) | 13014 | ready | ok · 7160 tris |
| `mesh-structure-014-twinfin-arch_LOD1.glb` | ![mesh-structure-014-twinfin-arch_LOD1.glb](meshes/previews/mesh-structure-014-twinfin-arch-preview.png) | 13014 | ready | ok · 2244 tris |
| `mesh-structure-014-twinfin-arch_LOD2.glb` | ![mesh-structure-014-twinfin-arch_LOD2.glb](meshes/previews/mesh-structure-014-twinfin-arch-preview.png) | 13014 | ready | ok · 544 tris |
| `mesh-structure-015-sunken-keystone_LOD0.glb` | ![mesh-structure-015-sunken-keystone_LOD0.glb](meshes/previews/mesh-structure-015-sunken-keystone-preview.png) | 13015 | ready | ok · 7160 tris |
| `mesh-structure-015-sunken-keystone_LOD1.glb` | ![mesh-structure-015-sunken-keystone_LOD1.glb](meshes/previews/mesh-structure-015-sunken-keystone-preview.png) | 13015 | ready | ok · 2244 tris |
| `mesh-structure-015-sunken-keystone_LOD2.glb` | ![mesh-structure-015-sunken-keystone_LOD2.glb](meshes/previews/mesh-structure-015-sunken-keystone-preview.png) | 13015 | ready | ok · 544 tris |
| `mesh-structure-016-driftwood-span_LOD0.glb` | ![mesh-structure-016-driftwood-span_LOD0.glb](meshes/previews/mesh-structure-016-driftwood-span-preview.png) | 13016 | ready | ok · 7160 tris |
| `mesh-structure-016-driftwood-span_LOD1.glb` | ![mesh-structure-016-driftwood-span_LOD1.glb](meshes/previews/mesh-structure-016-driftwood-span-preview.png) | 13016 | ready | ok · 2244 tris |
| `mesh-structure-016-driftwood-span_LOD2.glb` | ![mesh-structure-016-driftwood-span_LOD2.glb](meshes/previews/mesh-structure-016-driftwood-span-preview.png) | 13016 | ready | ok · 544 tris |
| `mesh-structure-017-reef-gate_LOD0.glb` | ![mesh-structure-017-reef-gate_LOD0.glb](meshes/previews/mesh-structure-017-reef-gate-preview.png) | 13017 | ready | ok · 7160 tris |
| `mesh-structure-017-reef-gate_LOD1.glb` | ![mesh-structure-017-reef-gate_LOD1.glb](meshes/previews/mesh-structure-017-reef-gate-preview.png) | 13017 | ready | ok · 2244 tris |
| `mesh-structure-017-reef-gate_LOD2.glb` | ![mesh-structure-017-reef-gate_LOD2.glb](meshes/previews/mesh-structure-017-reef-gate-preview.png) | 13017 | ready | ok · 544 tris |
| `mesh-structure-018-stone-ribbon-arch_LOD0.glb` | ![mesh-structure-018-stone-ribbon-arch_LOD0.glb](meshes/previews/mesh-structure-018-stone-ribbon-arch-preview.png) | 13018 | ready | ok · 7160 tris |
| `mesh-structure-018-stone-ribbon-arch_LOD1.glb` | ![mesh-structure-018-stone-ribbon-arch_LOD1.glb](meshes/previews/mesh-structure-018-stone-ribbon-arch-preview.png) | 13018 | ready | ok · 2244 tris |
| `mesh-structure-018-stone-ribbon-arch_LOD2.glb` | ![mesh-structure-018-stone-ribbon-arch_LOD2.glb](meshes/previews/mesh-structure-018-stone-ribbon-arch-preview.png) | 13018 | ready | ok · 544 tris |
| `mesh-structure-019-broken-halo_LOD0.glb` | ![mesh-structure-019-broken-halo_LOD0.glb](meshes/previews/mesh-structure-019-broken-halo-preview.png) | 13019 | ready | ok · 7160 tris |
| `mesh-structure-019-broken-halo_LOD1.glb` | ![mesh-structure-019-broken-halo_LOD1.glb](meshes/previews/mesh-structure-019-broken-halo-preview.png) | 13019 | ready | ok · 2244 tris |
| `mesh-structure-019-broken-halo_LOD2.glb` | ![mesh-structure-019-broken-halo_LOD2.glb](meshes/previews/mesh-structure-019-broken-halo-preview.png) | 13019 | ready | ok · 544 tris |
| `mesh-structure-020-kelpframe-arch_LOD0.glb` | ![mesh-structure-020-kelpframe-arch_LOD0.glb](meshes/previews/mesh-structure-020-kelpframe-arch-preview.png) | 13020 | ready | ok · 7160 tris |
| `mesh-structure-020-kelpframe-arch_LOD1.glb` | ![mesh-structure-020-kelpframe-arch_LOD1.glb](meshes/previews/mesh-structure-020-kelpframe-arch-preview.png) | 13020 | ready | ok · 2244 tris |
| `mesh-structure-020-kelpframe-arch_LOD2.glb` | ![mesh-structure-020-kelpframe-arch_LOD2.glb](meshes/previews/mesh-structure-020-kelpframe-arch-preview.png) | 13020 | ready | ok · 544 tris |
| `mesh-structure-021-sunken-skiff_LOD0.glb` | ![mesh-structure-021-sunken-skiff_LOD0.glb](meshes/previews/mesh-structure-021-sunken-skiff-preview.png) | 13021 | ready | size-class "hero" not in task map; used default factor 1.0. · 4608 tris |
| `mesh-structure-021-sunken-skiff_LOD1.glb` | ![mesh-structure-021-sunken-skiff_LOD1.glb](meshes/previews/mesh-structure-021-sunken-skiff-preview.png) | 13021 | ready | size-class "hero" not in task map; used default factor 1.0. · 1152 tris |
| `mesh-structure-021-sunken-skiff_LOD2.glb` | ![mesh-structure-021-sunken-skiff_LOD2.glb](meshes/previews/mesh-structure-021-sunken-skiff-preview.png) | 13021 | ready | size-class "hero" not in task map; used default factor 1.0. · 336 tris |
| `mesh-structure-022-anchor-chain-coil_LOD0.glb` | ![mesh-structure-022-anchor-chain-coil_LOD0.glb](meshes/previews/mesh-structure-022-anchor-chain-coil-preview.png) | 13022 | ready | ok · 6912 tris |
| `mesh-structure-022-anchor-chain-coil_LOD1.glb` | ![mesh-structure-022-anchor-chain-coil_LOD1.glb](meshes/previews/mesh-structure-022-anchor-chain-coil-preview.png) | 13022 | ready | ok · 1536 tris |
| `mesh-structure-022-anchor-chain-coil_LOD2.glb` | ![mesh-structure-022-anchor-chain-coil_LOD2.glb](meshes/previews/mesh-structure-022-anchor-chain-coil-preview.png) | 13022 | ready | ok · 336 tris |
| `mesh-structure-023-broken-mast_LOD0.glb` | ![mesh-structure-023-broken-mast_LOD0.glb](meshes/previews/mesh-structure-023-broken-mast-preview.png) | 13023 | ready | ok · 4608 tris |
| `mesh-structure-023-broken-mast_LOD1.glb` | ![mesh-structure-023-broken-mast_LOD1.glb](meshes/previews/mesh-structure-023-broken-mast-preview.png) | 13023 | ready | ok · 1152 tris |
| `mesh-structure-023-broken-mast_LOD2.glb` | ![mesh-structure-023-broken-mast_LOD2.glb](meshes/previews/mesh-structure-023-broken-mast-preview.png) | 13023 | ready | ok · 336 tris |
| `mesh-structure-024-cargo-hold-hatch_LOD0.glb` | ![mesh-structure-024-cargo-hold-hatch_LOD0.glb](meshes/previews/mesh-structure-024-cargo-hold-hatch-preview.png) | 13024 | ready | ok · 4608 tris |
| `mesh-structure-024-cargo-hold-hatch_LOD1.glb` | ![mesh-structure-024-cargo-hold-hatch_LOD1.glb](meshes/previews/mesh-structure-024-cargo-hold-hatch-preview.png) | 13024 | ready | ok · 1728 tris |
| `mesh-structure-024-cargo-hold-hatch_LOD2.glb` | ![mesh-structure-024-cargo-hold-hatch_LOD2.glb](meshes/previews/mesh-structure-024-cargo-hold-hatch-preview.png) | 13024 | ready | ok · 384 tris |
| `mesh-structure-025-ship-s-wheel_LOD0.glb` | ![mesh-structure-025-ship-s-wheel_LOD0.glb](meshes/previews/mesh-structure-025-ship-s-wheel-preview.png) | 13025 | ready | ok · 6144 tris |
| `mesh-structure-025-ship-s-wheel_LOD1.glb` | ![mesh-structure-025-ship-s-wheel_LOD1.glb](meshes/previews/mesh-structure-025-ship-s-wheel-preview.png) | 13025 | ready | ok · 1152 tris |
| `mesh-structure-025-ship-s-wheel_LOD2.glb` | ![mesh-structure-025-ship-s-wheel_LOD2.glb](meshes/previews/mesh-structure-025-ship-s-wheel-preview.png) | 13025 | ready | ok · 336 tris |
| `mesh-structure-026-rusted-porthole-ring_LOD0.glb` | ![mesh-structure-026-rusted-porthole-ring_LOD0.glb](meshes/previews/mesh-structure-026-rusted-porthole-ring-preview.png) | 13026 | ready | ok · 5376 tris |
| `mesh-structure-026-rusted-porthole-ring_LOD1.glb` | ![mesh-structure-026-rusted-porthole-ring_LOD1.glb](meshes/previews/mesh-structure-026-rusted-porthole-ring-preview.png) | 13026 | ready | ok · 1344 tris |
| `mesh-structure-026-rusted-porthole-ring_LOD2.glb` | ![mesh-structure-026-rusted-porthole-ring_LOD2.glb](meshes/previews/mesh-structure-026-rusted-porthole-ring-preview.png) | 13026 | ready | ok · 336 tris |
| `mesh-structure-027-drowned-rowboat_LOD0.glb` | ![mesh-structure-027-drowned-rowboat_LOD0.glb](meshes/previews/mesh-structure-027-drowned-rowboat-preview.png) | 13027 | ready | ok · 6912 tris |
| `mesh-structure-027-drowned-rowboat_LOD1.glb` | ![mesh-structure-027-drowned-rowboat_LOD1.glb](meshes/previews/mesh-structure-027-drowned-rowboat-preview.png) | 13027 | ready | ok · 1536 tris |
| `mesh-structure-027-drowned-rowboat_LOD2.glb` | ![mesh-structure-027-drowned-rowboat_LOD2.glb](meshes/previews/mesh-structure-027-drowned-rowboat-preview.png) | 13027 | ready | ok · 336 tris |
| `mesh-structure-028-propeller-relic_LOD0.glb` | ![mesh-structure-028-propeller-relic_LOD0.glb](meshes/previews/mesh-structure-028-propeller-relic-preview.png) | 13028 | ready | ok · 5376 tris |
| `mesh-structure-028-propeller-relic_LOD1.glb` | ![mesh-structure-028-propeller-relic_LOD1.glb](meshes/previews/mesh-structure-028-propeller-relic-preview.png) | 13028 | ready | ok · 1152 tris |
| `mesh-structure-028-propeller-relic_LOD2.glb` | ![mesh-structure-028-propeller-relic_LOD2.glb](meshes/previews/mesh-structure-028-propeller-relic-preview.png) | 13028 | ready | ok · 432 tris |
| `mesh-structure-029-fallen-column_LOD0.glb` | ![mesh-structure-029-fallen-column_LOD0.glb](meshes/previews/mesh-structure-029-fallen-column-preview.png) | 13029 | ready | ok · 4208 tris |
| `mesh-structure-029-fallen-column_LOD1.glb` | ![mesh-structure-029-fallen-column_LOD1.glb](meshes/previews/mesh-structure-029-fallen-column-preview.png) | 13029 | ready | ok · 2104 tris |
| `mesh-structure-029-fallen-column_LOD2.glb` | ![mesh-structure-029-fallen-column_LOD2.glb](meshes/previews/mesh-structure-029-fallen-column-preview.png) | 13029 | ready | ok · 504 tris |
| `mesh-structure-030-temple-steps_LOD0.glb` | ![mesh-structure-030-temple-steps_LOD0.glb](meshes/previews/mesh-structure-030-temple-steps-preview.png) | 13030 | ready | ok · 4200 tris |
| `mesh-structure-030-temple-steps_LOD1.glb` | ![mesh-structure-030-temple-steps_LOD1.glb](meshes/previews/mesh-structure-030-temple-steps-preview.png) | 13030 | ready | ok · 2112 tris |
| `mesh-structure-030-temple-steps_LOD2.glb` | ![mesh-structure-030-temple-steps_LOD2.glb](meshes/previews/mesh-structure-030-temple-steps-preview.png) | 13030 | ready | ok · 512 tris |
| `mesh-structure-031-carved-obelisk_LOD0.glb` | ![mesh-structure-031-carved-obelisk_LOD0.glb](meshes/previews/mesh-structure-031-carved-obelisk-preview.png) | 13031 | ready | ok · 4200 tris |
| `mesh-structure-031-carved-obelisk_LOD1.glb` | ![mesh-structure-031-carved-obelisk_LOD1.glb](meshes/previews/mesh-structure-031-carved-obelisk-preview.png) | 13031 | ready | ok · 2100 tris |
| `mesh-structure-031-carved-obelisk_LOD2.glb` | ![mesh-structure-031-carved-obelisk_LOD2.glb](meshes/previews/mesh-structure-031-carved-obelisk-preview.png) | 13031 | ready | ok · 512 tris |
| `mesh-structure-032-sunken-courtyard_LOD0.glb` | ![mesh-structure-032-sunken-courtyard_LOD0.glb](meshes/previews/mesh-structure-032-sunken-courtyard-preview.png) | 13032 | ready | ok · 4200 tris |
| `mesh-structure-032-sunken-courtyard_LOD1.glb` | ![mesh-structure-032-sunken-courtyard_LOD1.glb](meshes/previews/mesh-structure-032-sunken-courtyard-preview.png) | 13032 | ready | ok · 2104 tris |
| `mesh-structure-032-sunken-courtyard_LOD2.glb` | ![mesh-structure-032-sunken-courtyard_LOD2.glb](meshes/previews/mesh-structure-032-sunken-courtyard-preview.png) | 13032 | ready | ok · 504 tris |
| `mesh-structure-033-broken-amphora_LOD0.glb` | ![mesh-structure-033-broken-amphora_LOD0.glb](meshes/previews/mesh-structure-033-broken-amphora-preview.png) | 13033 | ready | ok · 4200 tris |
| `mesh-structure-033-broken-amphora_LOD1.glb` | ![mesh-structure-033-broken-amphora_LOD1.glb](meshes/previews/mesh-structure-033-broken-amphora-preview.png) | 13033 | ready | ok · 2100 tris |
| `mesh-structure-033-broken-amphora_LOD2.glb` | ![mesh-structure-033-broken-amphora_LOD2.glb](meshes/previews/mesh-structure-033-broken-amphora-preview.png) | 13033 | ready | ok · 504 tris |
| `mesh-structure-034-stone-lantern_LOD0.glb` | ![mesh-structure-034-stone-lantern_LOD0.glb](meshes/previews/mesh-structure-034-stone-lantern-preview.png) | 13034 | ready | ok · 4208 tris |
| `mesh-structure-034-stone-lantern_LOD1.glb` | ![mesh-structure-034-stone-lantern_LOD1.glb](meshes/previews/mesh-structure-034-stone-lantern-preview.png) | 13034 | ready | ok · 2112 tris |
| `mesh-structure-034-stone-lantern_LOD2.glb` | ![mesh-structure-034-stone-lantern_LOD2.glb](meshes/previews/mesh-structure-034-stone-lantern-preview.png) | 13034 | ready | ok · 504 tris |
| `mesh-structure-035-ruined-gateway_LOD0.glb` | ![mesh-structure-035-ruined-gateway_LOD0.glb](meshes/previews/mesh-structure-035-ruined-gateway-preview.png) | 13035 | ready | ok · 4200 tris |
| `mesh-structure-035-ruined-gateway_LOD1.glb` | ![mesh-structure-035-ruined-gateway_LOD1.glb](meshes/previews/mesh-structure-035-ruined-gateway-preview.png) | 13035 | ready | ok · 2112 tris |
| `mesh-structure-035-ruined-gateway_LOD2.glb` | ![mesh-structure-035-ruined-gateway_LOD2.glb](meshes/previews/mesh-structure-035-ruined-gateway-preview.png) | 13035 | ready | ok · 504 tris |
| `mesh-structure-036-offering-bowl_LOD0.glb` | ![mesh-structure-036-offering-bowl_LOD0.glb](meshes/previews/mesh-structure-036-offering-bowl-preview.png) | 13036 | ready | ok · 4200 tris |
| `mesh-structure-036-offering-bowl_LOD1.glb` | ![mesh-structure-036-offering-bowl_LOD1.glb](meshes/previews/mesh-structure-036-offering-bowl-preview.png) | 13036 | ready | ok · 2112 tris |
| `mesh-structure-036-offering-bowl_LOD2.glb` | ![mesh-structure-036-offering-bowl_LOD2.glb](meshes/previews/mesh-structure-036-offering-bowl-preview.png) | 13036 | ready | ok · 512 tris |
| `mesh-structure-037-gloomy-grotto_LOD0.glb` | ![mesh-structure-037-gloomy-grotto_LOD0.glb](meshes/previews/mesh-structure-037-gloomy-grotto-preview.png) | 13037 | ready | size-class "hero" not in task map; used default factor 1.0. · 11238 tris |
| `mesh-structure-037-gloomy-grotto_LOD1.glb` | ![mesh-structure-037-gloomy-grotto_LOD1.glb](meshes/previews/mesh-structure-037-gloomy-grotto-preview.png) | 13037 | ready | size-class "hero" not in task map; used default factor 1.0. · 2812 tris |
| `mesh-structure-037-gloomy-grotto_LOD2.glb` | ![mesh-structure-037-gloomy-grotto_LOD2.glb](meshes/previews/mesh-structure-037-gloomy-grotto-preview.png) | 13037 | ready | size-class "hero" not in task map; used default factor 1.0. · 718 tris |
| `mesh-structure-038-pebble-cave_LOD0.glb` | ![mesh-structure-038-pebble-cave_LOD0.glb](meshes/previews/mesh-structure-038-pebble-cave-preview.png) | 13038 | ready | ok · 11238 tris |
| `mesh-structure-038-pebble-cave_LOD1.glb` | ![mesh-structure-038-pebble-cave_LOD1.glb](meshes/previews/mesh-structure-038-pebble-cave-preview.png) | 13038 | ready | ok · 2812 tris |
| `mesh-structure-038-pebble-cave_LOD2.glb` | ![mesh-structure-038-pebble-cave_LOD2.glb](meshes/previews/mesh-structure-038-pebble-cave-preview.png) | 13038 | ready | ok · 718 tris |
| `mesh-structure-039-overhang-den_LOD0.glb` | ![mesh-structure-039-overhang-den_LOD0.glb](meshes/previews/mesh-structure-039-overhang-den-preview.png) | 13039 | ready | ok · 11238 tris |
| `mesh-structure-039-overhang-den_LOD1.glb` | ![mesh-structure-039-overhang-den_LOD1.glb](meshes/previews/mesh-structure-039-overhang-den-preview.png) | 13039 | ready | ok · 2812 tris |
| `mesh-structure-039-overhang-den_LOD2.glb` | ![mesh-structure-039-overhang-den_LOD2.glb](meshes/previews/mesh-structure-039-overhang-den-preview.png) | 13039 | ready | ok · 718 tris |
| `mesh-structure-040-twinmouth-cave_LOD0.glb` | ![mesh-structure-040-twinmouth-cave_LOD0.glb](meshes/previews/mesh-structure-040-twinmouth-cave-preview.png) | 13040 | ready | ok · 11238 tris |
| `mesh-structure-040-twinmouth-cave_LOD1.glb` | ![mesh-structure-040-twinmouth-cave_LOD1.glb](meshes/previews/mesh-structure-040-twinmouth-cave-preview.png) | 13040 | ready | ok · 2812 tris |
| `mesh-structure-040-twinmouth-cave_LOD2.glb` | ![mesh-structure-040-twinmouth-cave_LOD2.glb](meshes/previews/mesh-structure-040-twinmouth-cave-preview.png) | 13040 | ready | ok · 718 tris |
| `mesh-structure-041-shadow-hollow_LOD0.glb` | ![mesh-structure-041-shadow-hollow_LOD0.glb](meshes/previews/mesh-structure-041-shadow-hollow-preview.png) | 13041 | ready | ok · 11238 tris |
| `mesh-structure-041-shadow-hollow_LOD1.glb` | ![mesh-structure-041-shadow-hollow_LOD1.glb](meshes/previews/mesh-structure-041-shadow-hollow-preview.png) | 13041 | ready | ok · 2812 tris |
| `mesh-structure-041-shadow-hollow_LOD2.glb` | ![mesh-structure-041-shadow-hollow_LOD2.glb](meshes/previews/mesh-structure-041-shadow-hollow-preview.png) | 13041 | ready | ok · 718 tris |
| `mesh-structure-042-shell-grotto_LOD0.glb` | ![mesh-structure-042-shell-grotto_LOD0.glb](meshes/previews/mesh-structure-042-shell-grotto-preview.png) | 13042 | ready | ok · 11238 tris |
| `mesh-structure-042-shell-grotto_LOD1.glb` | ![mesh-structure-042-shell-grotto_LOD1.glb](meshes/previews/mesh-structure-042-shell-grotto-preview.png) | 13042 | ready | ok · 2812 tris |
| `mesh-structure-042-shell-grotto_LOD2.glb` | ![mesh-structure-042-shell-grotto_LOD2.glb](meshes/previews/mesh-structure-042-shell-grotto-preview.png) | 13042 | ready | ok · 718 tris |
| `mesh-structure-043-basalt-cavern_LOD0.glb` | ![mesh-structure-043-basalt-cavern_LOD0.glb](meshes/previews/mesh-structure-043-basalt-cavern-preview.png) | 13043 | ready | ok · 11238 tris |
| `mesh-structure-043-basalt-cavern_LOD1.glb` | ![mesh-structure-043-basalt-cavern_LOD1.glb](meshes/previews/mesh-structure-043-basalt-cavern-preview.png) | 13043 | ready | ok · 2812 tris |
| `mesh-structure-043-basalt-cavern_LOD2.glb` | ![mesh-structure-043-basalt-cavern_LOD2.glb](meshes/previews/mesh-structure-043-basalt-cavern-preview.png) | 13043 | ready | ok · 718 tris |
| `mesh-structure-044-ledge-of-whispers_LOD0.glb` | ![mesh-structure-044-ledge-of-whispers_LOD0.glb](meshes/previews/mesh-structure-044-ledge-of-whispers-preview.png) | 13044 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 5120 tris |
| `mesh-structure-044-ledge-of-whispers_LOD1.glb` | ![mesh-structure-044-ledge-of-whispers_LOD1.glb](meshes/previews/mesh-structure-044-ledge-of-whispers-preview.png) | 13044 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 1280 tris |
| `mesh-structure-044-ledge-of-whispers_LOD2.glb` | ![mesh-structure-044-ledge-of-whispers_LOD2.glb](meshes/previews/mesh-structure-044-ledge-of-whispers-preview.png) | 13044 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 320 tris |
| `mesh-structure-045-hanging-shelf_LOD0.glb` | ![mesh-structure-045-hanging-shelf_LOD0.glb](meshes/previews/mesh-structure-045-hanging-shelf-preview.png) | 13045 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 5120 tris |
| `mesh-structure-045-hanging-shelf_LOD1.glb` | ![mesh-structure-045-hanging-shelf_LOD1.glb](meshes/previews/mesh-structure-045-hanging-shelf-preview.png) | 13045 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 1280 tris |
| `mesh-structure-045-hanging-shelf_LOD2.glb` | ![mesh-structure-045-hanging-shelf_LOD2.glb](meshes/previews/mesh-structure-045-hanging-shelf-preview.png) | 13045 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 320 tris |
| `mesh-structure-046-cantilever-crag_LOD0.glb` | ![mesh-structure-046-cantilever-crag_LOD0.glb](meshes/previews/mesh-structure-046-cantilever-crag-preview.png) | 13046 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 5120 tris |
| `mesh-structure-046-cantilever-crag_LOD1.glb` | ![mesh-structure-046-cantilever-crag_LOD1.glb](meshes/previews/mesh-structure-046-cantilever-crag-preview.png) | 13046 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 1280 tris |
| `mesh-structure-046-cantilever-crag_LOD2.glb` | ![mesh-structure-046-cantilever-crag_LOD2.glb](meshes/previews/mesh-structure-046-cantilever-crag-preview.png) | 13046 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 320 tris |
| `mesh-structure-047-shaded-lintel_LOD0.glb` | ![mesh-structure-047-shaded-lintel_LOD0.glb](meshes/previews/mesh-structure-047-shaded-lintel-preview.png) | 13047 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 5120 tris |
| `mesh-structure-047-shaded-lintel_LOD1.glb` | ![mesh-structure-047-shaded-lintel_LOD1.glb](meshes/previews/mesh-structure-047-shaded-lintel-preview.png) | 13047 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 1280 tris |
| `mesh-structure-047-shaded-lintel_LOD2.glb` | ![mesh-structure-047-shaded-lintel_LOD2.glb](meshes/previews/mesh-structure-047-shaded-lintel-preview.png) | 13047 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 320 tris |
| `mesh-structure-048-mossy-brow_LOD0.glb` | ![mesh-structure-048-mossy-brow_LOD0.glb](meshes/previews/mesh-structure-048-mossy-brow-preview.png) | 13048 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 5120 tris |
| `mesh-structure-048-mossy-brow_LOD1.glb` | ![mesh-structure-048-mossy-brow_LOD1.glb](meshes/previews/mesh-structure-048-mossy-brow-preview.png) | 13048 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 1280 tris |
| `mesh-structure-048-mossy-brow_LOD2.glb` | ![mesh-structure-048-mossy-brow_LOD2.glb](meshes/previews/mesh-structure-048-mossy-brow-preview.png) | 13048 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 320 tris |
| `mesh-structure-049-slate-awning_LOD0.glb` | ![mesh-structure-049-slate-awning_LOD0.glb](meshes/previews/mesh-structure-049-slate-awning-preview.png) | 13049 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 5120 tris |
| `mesh-structure-049-slate-awning_LOD1.glb` | ![mesh-structure-049-slate-awning_LOD1.glb](meshes/previews/mesh-structure-049-slate-awning-preview.png) | 13049 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 1280 tris |
| `mesh-structure-049-slate-awning_LOD2.glb` | ![mesh-structure-049-slate-awning_LOD2.glb](meshes/previews/mesh-structure-049-slate-awning-preview.png) | 13049 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 320 tris |
| `mesh-structure-050-dripstone-lip_LOD0.glb` | ![mesh-structure-050-dripstone-lip_LOD0.glb](meshes/previews/mesh-structure-050-dripstone-lip-preview.png) | 13050 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 5120 tris |
| `mesh-structure-050-dripstone-lip_LOD1.glb` | ![mesh-structure-050-dripstone-lip_LOD1.glb](meshes/previews/mesh-structure-050-dripstone-lip-preview.png) | 13050 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 1280 tris |
| `mesh-structure-050-dripstone-lip_LOD2.glb` | ![mesh-structure-050-dripstone-lip_LOD2.glb](meshes/previews/mesh-structure-050-dripstone-lip-preview.png) | 13050 | ready | overhang recipe adapted: subdivided box cannot hit LOD0 band (4 subdiv=3072 <4000, 5 subdiv=12288 >12000); used displaced flattened icosphere. · 320 tris |

## Plant meshes

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `mesh-plant-001-riverblade-green_LOD0.glb` | ![mesh-plant-001-riverblade-green_LOD0.glb](meshes/previews/mesh-plant-001-riverblade-green-preview.png) | 14001 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-001-riverblade-green_LOD1.glb` | ![mesh-plant-001-riverblade-green_LOD1.glb](meshes/previews/mesh-plant-001-riverblade-green-preview.png) | 114001 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-001-riverblade-green_LOD2.glb` | ![mesh-plant-001-riverblade-green_LOD2.glb](meshes/previews/mesh-plant-001-riverblade-green-preview.png) | 14001 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-002-sabre-grass_LOD0.glb` | ![mesh-plant-002-sabre-grass_LOD0.glb](meshes/previews/mesh-plant-002-sabre-grass-preview.png) | 14002 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-002-sabre-grass_LOD1.glb` | ![mesh-plant-002-sabre-grass_LOD1.glb](meshes/previews/mesh-plant-002-sabre-grass-preview.png) | 114002 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-002-sabre-grass_LOD2.glb` | ![mesh-plant-002-sabre-grass_LOD2.glb](meshes/previews/mesh-plant-002-sabre-grass-preview.png) | 14002 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-003-moonlit-ribbonweed_LOD0.glb` | ![mesh-plant-003-moonlit-ribbonweed_LOD0.glb](meshes/previews/mesh-plant-003-moonlit-ribbonweed-preview.png) | 14003 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-003-moonlit-ribbonweed_LOD1.glb` | ![mesh-plant-003-moonlit-ribbonweed_LOD1.glb](meshes/previews/mesh-plant-003-moonlit-ribbonweed-preview.png) | 114003 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-003-moonlit-ribbonweed_LOD2.glb` | ![mesh-plant-003-moonlit-ribbonweed_LOD2.glb](meshes/previews/mesh-plant-003-moonlit-ribbonweed-preview.png) | 14003 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-004-copper-blade_LOD0.glb` | ![mesh-plant-004-copper-blade_LOD0.glb](meshes/previews/mesh-plant-004-copper-blade-preview.png) | 14004 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-004-copper-blade_LOD1.glb` | ![mesh-plant-004-copper-blade_LOD1.glb](meshes/previews/mesh-plant-004-copper-blade-preview.png) | 114004 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-004-copper-blade_LOD2.glb` | ![mesh-plant-004-copper-blade_LOD2.glb](meshes/previews/mesh-plant-004-copper-blade-preview.png) | 14004 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-005-tideblade_LOD0.glb` | ![mesh-plant-005-tideblade_LOD0.glb](meshes/previews/mesh-plant-005-tideblade-preview.png) | 14005 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-005-tideblade_LOD1.glb` | ![mesh-plant-005-tideblade_LOD1.glb](meshes/previews/mesh-plant-005-tideblade-preview.png) | 114005 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-005-tideblade_LOD2.glb` | ![mesh-plant-005-tideblade_LOD2.glb](meshes/previews/mesh-plant-005-tideblade-preview.png) | 14005 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-006-emerald-swordleaf_LOD0.glb` | ![mesh-plant-006-emerald-swordleaf_LOD0.glb](meshes/previews/mesh-plant-006-emerald-swordleaf-preview.png) | 14006 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-006-emerald-swordleaf_LOD1.glb` | ![mesh-plant-006-emerald-swordleaf_LOD1.glb](meshes/previews/mesh-plant-006-emerald-swordleaf-preview.png) | 114006 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-006-emerald-swordleaf_LOD2.glb` | ![mesh-plant-006-emerald-swordleaf_LOD2.glb](meshes/previews/mesh-plant-006-emerald-swordleaf-preview.png) | 14006 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-007-dusky-eelgrass_LOD0.glb` | ![mesh-plant-007-dusky-eelgrass_LOD0.glb](meshes/previews/mesh-plant-007-dusky-eelgrass-preview.png) | 14007 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-007-dusky-eelgrass_LOD1.glb` | ![mesh-plant-007-dusky-eelgrass_LOD1.glb](meshes/previews/mesh-plant-007-dusky-eelgrass-preview.png) | 114007 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-007-dusky-eelgrass_LOD2.glb` | ![mesh-plant-007-dusky-eelgrass_LOD2.glb](meshes/previews/mesh-plant-007-dusky-eelgrass-preview.png) | 14007 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-008-golden-ribbon_LOD0.glb` | ![mesh-plant-008-golden-ribbon_LOD0.glb](meshes/previews/mesh-plant-008-golden-ribbon-preview.png) | 14008 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-008-golden-ribbon_LOD1.glb` | ![mesh-plant-008-golden-ribbon_LOD1.glb](meshes/previews/mesh-plant-008-golden-ribbon-preview.png) | 114008 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-008-golden-ribbon_LOD2.glb` | ![mesh-plant-008-golden-ribbon_LOD2.glb](meshes/previews/mesh-plant-008-golden-ribbon-preview.png) | 14008 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-009-frostblade_LOD0.glb` | ![mesh-plant-009-frostblade_LOD0.glb](meshes/previews/mesh-plant-009-frostblade-preview.png) | 14009 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-009-frostblade_LOD1.glb` | ![mesh-plant-009-frostblade_LOD1.glb](meshes/previews/mesh-plant-009-frostblade-preview.png) | 114009 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-009-frostblade_LOD2.glb` | ![mesh-plant-009-frostblade_LOD2.glb](meshes/previews/mesh-plant-009-frostblade-preview.png) | 14009 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-010-deepwater-lance_LOD0.glb` | ![mesh-plant-010-deepwater-lance_LOD0.glb](meshes/previews/mesh-plant-010-deepwater-lance-preview.png) | 14010 | ready | in band on attempt 1 (density 1.00) · 2600 tris |
| `mesh-plant-010-deepwater-lance_LOD1.glb` | ![mesh-plant-010-deepwater-lance_LOD1.glb](meshes/previews/mesh-plant-010-deepwater-lance-preview.png) | 114010 | ready | LOD1 1200 tris vs LOD0 2600 tris; < LOD0 · 1200 tris |
| `mesh-plant-010-deepwater-lance_LOD2.glb` | ![mesh-plant-010-deepwater-lance_LOD2.glb](meshes/previews/mesh-plant-010-deepwater-lance-preview.png) | 14010 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-011-emerald-tuft_LOD0.glb` | ![mesh-plant-011-emerald-tuft_LOD0.glb](meshes/previews/mesh-plant-011-emerald-tuft-preview.png) | 14011 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-011-emerald-tuft_LOD1.glb` | ![mesh-plant-011-emerald-tuft_LOD1.glb](meshes/previews/mesh-plant-011-emerald-tuft-preview.png) | 114011 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-011-emerald-tuft_LOD2.glb` | ![mesh-plant-011-emerald-tuft_LOD2.glb](meshes/previews/mesh-plant-011-emerald-tuft-preview.png) | 14011 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-012-bubbletip-tuft_LOD0.glb` | ![mesh-plant-012-bubbletip-tuft_LOD0.glb](meshes/previews/mesh-plant-012-bubbletip-tuft-preview.png) | 14012 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-012-bubbletip-tuft_LOD1.glb` | ![mesh-plant-012-bubbletip-tuft_LOD1.glb](meshes/previews/mesh-plant-012-bubbletip-tuft-preview.png) | 114012 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-012-bubbletip-tuft_LOD2.glb` | ![mesh-plant-012-bubbletip-tuft_LOD2.glb](meshes/previews/mesh-plant-012-bubbletip-tuft-preview.png) | 14012 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-013-rust-tuft_LOD0.glb` | ![mesh-plant-013-rust-tuft_LOD0.glb](meshes/previews/mesh-plant-013-rust-tuft-preview.png) | 14013 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-013-rust-tuft_LOD1.glb` | ![mesh-plant-013-rust-tuft_LOD1.glb](meshes/previews/mesh-plant-013-rust-tuft-preview.png) | 114013 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-013-rust-tuft_LOD2.glb` | ![mesh-plant-013-rust-tuft_LOD2.glb](meshes/previews/mesh-plant-013-rust-tuft-preview.png) | 14013 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-014-pearlgrass-tuft_LOD0.glb` | ![mesh-plant-014-pearlgrass-tuft_LOD0.glb](meshes/previews/mesh-plant-014-pearlgrass-tuft-preview.png) | 14014 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-014-pearlgrass-tuft_LOD1.glb` | ![mesh-plant-014-pearlgrass-tuft_LOD1.glb](meshes/previews/mesh-plant-014-pearlgrass-tuft-preview.png) | 114014 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-014-pearlgrass-tuft_LOD2.glb` | ![mesh-plant-014-pearlgrass-tuft_LOD2.glb](meshes/previews/mesh-plant-014-pearlgrass-tuft-preview.png) | 14014 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-015-shadowmoss-tuft_LOD0.glb` | ![mesh-plant-015-shadowmoss-tuft_LOD0.glb](meshes/previews/mesh-plant-015-shadowmoss-tuft-preview.png) | 14015 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-015-shadowmoss-tuft_LOD1.glb` | ![mesh-plant-015-shadowmoss-tuft_LOD1.glb](meshes/previews/mesh-plant-015-shadowmoss-tuft-preview.png) | 114015 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-015-shadowmoss-tuft_LOD2.glb` | ![mesh-plant-015-shadowmoss-tuft_LOD2.glb](meshes/previews/mesh-plant-015-shadowmoss-tuft-preview.png) | 14015 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-016-amber-tuft_LOD0.glb` | ![mesh-plant-016-amber-tuft_LOD0.glb](meshes/previews/mesh-plant-016-amber-tuft-preview.png) | 14016 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-016-amber-tuft_LOD1.glb` | ![mesh-plant-016-amber-tuft_LOD1.glb](meshes/previews/mesh-plant-016-amber-tuft-preview.png) | 114016 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-016-amber-tuft_LOD2.glb` | ![mesh-plant-016-amber-tuft_LOD2.glb](meshes/previews/mesh-plant-016-amber-tuft-preview.png) | 14016 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-017-cloud-tuft_LOD0.glb` | ![mesh-plant-017-cloud-tuft_LOD0.glb](meshes/previews/mesh-plant-017-cloud-tuft-preview.png) | 14017 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-017-cloud-tuft_LOD1.glb` | ![mesh-plant-017-cloud-tuft_LOD1.glb](meshes/previews/mesh-plant-017-cloud-tuft-preview.png) | 114017 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-017-cloud-tuft_LOD2.glb` | ![mesh-plant-017-cloud-tuft_LOD2.glb](meshes/previews/mesh-plant-017-cloud-tuft-preview.png) | 14017 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-018-jade-puff_LOD0.glb` | ![mesh-plant-018-jade-puff_LOD0.glb](meshes/previews/mesh-plant-018-jade-puff-preview.png) | 14018 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-018-jade-puff_LOD1.glb` | ![mesh-plant-018-jade-puff_LOD1.glb](meshes/previews/mesh-plant-018-jade-puff-preview.png) | 114018 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-018-jade-puff_LOD2.glb` | ![mesh-plant-018-jade-puff_LOD2.glb](meshes/previews/mesh-plant-018-jade-puff-preview.png) | 14018 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-019-ember-tuft_LOD0.glb` | ![mesh-plant-019-ember-tuft_LOD0.glb](meshes/previews/mesh-plant-019-ember-tuft-preview.png) | 14019 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-019-ember-tuft_LOD1.glb` | ![mesh-plant-019-ember-tuft_LOD1.glb](meshes/previews/mesh-plant-019-ember-tuft-preview.png) | 114019 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-019-ember-tuft_LOD2.glb` | ![mesh-plant-019-ember-tuft_LOD2.glb](meshes/previews/mesh-plant-019-ember-tuft-preview.png) | 14019 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-020-silverspray-tuft_LOD0.glb` | ![mesh-plant-020-silverspray-tuft_LOD0.glb](meshes/previews/mesh-plant-020-silverspray-tuft-preview.png) | 14020 | ready | in band on attempt 1 (density 1.00) · 2420 tris |
| `mesh-plant-020-silverspray-tuft_LOD1.glb` | ![mesh-plant-020-silverspray-tuft_LOD1.glb](meshes/previews/mesh-plant-020-silverspray-tuft-preview.png) | 114020 | ready | LOD1 1100 tris vs LOD0 2420 tris; < LOD0 · 1100 tris |
| `mesh-plant-020-silverspray-tuft_LOD2.glb` | ![mesh-plant-020-silverspray-tuft_LOD2.glb](meshes/previews/mesh-plant-020-silverspray-tuft-preview.png) | 14020 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-021-fanpalm-weed_LOD0.glb` | ![mesh-plant-021-fanpalm-weed_LOD0.glb](meshes/previews/mesh-plant-021-fanpalm-weed-preview.png) | 14021 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-021-fanpalm-weed_LOD1.glb` | ![mesh-plant-021-fanpalm-weed_LOD1.glb](meshes/previews/mesh-plant-021-fanpalm-weed-preview.png) | 114021 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-021-fanpalm-weed_LOD2.glb` | ![mesh-plant-021-fanpalm-weed_LOD2.glb](meshes/previews/mesh-plant-021-fanpalm-weed-preview.png) | 14021 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-022-peacock-fan_LOD0.glb` | ![mesh-plant-022-peacock-fan_LOD0.glb](meshes/previews/mesh-plant-022-peacock-fan-preview.png) | 14022 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-022-peacock-fan_LOD1.glb` | ![mesh-plant-022-peacock-fan_LOD1.glb](meshes/previews/mesh-plant-022-peacock-fan-preview.png) | 114022 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-022-peacock-fan_LOD2.glb` | ![mesh-plant-022-peacock-fan_LOD2.glb](meshes/previews/mesh-plant-022-peacock-fan-preview.png) | 14022 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-023-coral-fanleaf_LOD0.glb` | ![mesh-plant-023-coral-fanleaf_LOD0.glb](meshes/previews/mesh-plant-023-coral-fanleaf-preview.png) | 14023 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-023-coral-fanleaf_LOD1.glb` | ![mesh-plant-023-coral-fanleaf_LOD1.glb](meshes/previews/mesh-plant-023-coral-fanleaf-preview.png) | 114023 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-023-coral-fanleaf_LOD2.glb` | ![mesh-plant-023-coral-fanleaf_LOD2.glb](meshes/previews/mesh-plant-023-coral-fanleaf-preview.png) | 14023 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-024-sunset-fanweed_LOD0.glb` | ![mesh-plant-024-sunset-fanweed_LOD0.glb](meshes/previews/mesh-plant-024-sunset-fanweed-preview.png) | 14024 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-024-sunset-fanweed_LOD1.glb` | ![mesh-plant-024-sunset-fanweed_LOD1.glb](meshes/previews/mesh-plant-024-sunset-fanweed-preview.png) | 114024 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-024-sunset-fanweed_LOD2.glb` | ![mesh-plant-024-sunset-fanweed_LOD2.glb](meshes/previews/mesh-plant-024-sunset-fanweed-preview.png) | 14024 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-025-lace-fan_LOD0.glb` | ![mesh-plant-025-lace-fan_LOD0.glb](meshes/previews/mesh-plant-025-lace-fan-preview.png) | 14025 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-025-lace-fan_LOD1.glb` | ![mesh-plant-025-lace-fan_LOD1.glb](meshes/previews/mesh-plant-025-lace-fan-preview.png) | 114025 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-025-lace-fan_LOD2.glb` | ![mesh-plant-025-lace-fan_LOD2.glb](meshes/previews/mesh-plant-025-lace-fan-preview.png) | 14025 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-026-mint-fan_LOD0.glb` | ![mesh-plant-026-mint-fan_LOD0.glb](meshes/previews/mesh-plant-026-mint-fan-preview.png) | 14026 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-026-mint-fan_LOD1.glb` | ![mesh-plant-026-mint-fan_LOD1.glb](meshes/previews/mesh-plant-026-mint-fan-preview.png) | 114026 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-026-mint-fan_LOD2.glb` | ![mesh-plant-026-mint-fan_LOD2.glb](meshes/previews/mesh-plant-026-mint-fan-preview.png) | 14026 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-027-bronze-fan_LOD0.glb` | ![mesh-plant-027-bronze-fan_LOD0.glb](meshes/previews/mesh-plant-027-bronze-fan-preview.png) | 14027 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-027-bronze-fan_LOD1.glb` | ![mesh-plant-027-bronze-fan_LOD1.glb](meshes/previews/mesh-plant-027-bronze-fan-preview.png) | 114027 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-027-bronze-fan_LOD2.glb` | ![mesh-plant-027-bronze-fan_LOD2.glb](meshes/previews/mesh-plant-027-bronze-fan-preview.png) | 14027 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-028-ghost-fan_LOD0.glb` | ![mesh-plant-028-ghost-fan_LOD0.glb](meshes/previews/mesh-plant-028-ghost-fan-preview.png) | 14028 | ready | in band on attempt 1 (density 1.00) · 1584 tris |
| `mesh-plant-028-ghost-fan_LOD1.glb` | ![mesh-plant-028-ghost-fan_LOD1.glb](meshes/previews/mesh-plant-028-ghost-fan-preview.png) | 114028 | ready | LOD1 360 tris vs LOD0 1584 tris; < LOD0 · 360 tris |
| `mesh-plant-028-ghost-fan_LOD2.glb` | ![mesh-plant-028-ghost-fan_LOD2.glb](meshes/previews/mesh-plant-028-ghost-fan-preview.png) | 14028 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-029-carpet-moss_LOD0.glb` | ![mesh-plant-029-carpet-moss_LOD0.glb](meshes/previews/mesh-plant-029-carpet-moss-preview.png) | 14029 | ready | in band on attempt 1 (density 1.00) · 1770 tris |
| `mesh-plant-029-carpet-moss_LOD1.glb` | ![mesh-plant-029-carpet-moss_LOD1.glb](meshes/previews/mesh-plant-029-carpet-moss-preview.png) | 114029 | ready | LOD1 586 tris vs LOD0 1770 tris; < LOD0 · 586 tris |
| `mesh-plant-029-carpet-moss_LOD2.glb` | ![mesh-plant-029-carpet-moss_LOD2.glb](meshes/previews/mesh-plant-029-carpet-moss-preview.png) | 14029 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-030-java-mat_LOD0.glb` | ![mesh-plant-030-java-mat_LOD0.glb](meshes/previews/mesh-plant-030-java-mat-preview.png) | 14030 | ready | in band on attempt 1 (density 1.00) · 3540 tris |
| `mesh-plant-030-java-mat_LOD1.glb` | ![mesh-plant-030-java-mat_LOD1.glb](meshes/previews/mesh-plant-030-java-mat-preview.png) | 114030 | ready | LOD1 1172 tris vs LOD0 3540 tris; < LOD0 · 1172 tris |
| `mesh-plant-030-java-mat_LOD2.glb` | ![mesh-plant-030-java-mat_LOD2.glb](meshes/previews/mesh-plant-030-java-mat-preview.png) | 14030 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-031-velvet-carpetweed_LOD0.glb` | ![mesh-plant-031-velvet-carpetweed_LOD0.glb](meshes/previews/mesh-plant-031-velvet-carpetweed-preview.png) | 14031 | ready | in band on attempt 1 (density 1.00) · 1770 tris |
| `mesh-plant-031-velvet-carpetweed_LOD1.glb` | ![mesh-plant-031-velvet-carpetweed_LOD1.glb](meshes/previews/mesh-plant-031-velvet-carpetweed-preview.png) | 114031 | ready | LOD1 586 tris vs LOD0 1770 tris; < LOD0 · 586 tris |
| `mesh-plant-031-velvet-carpetweed_LOD2.glb` | ![mesh-plant-031-velvet-carpetweed_LOD2.glb](meshes/previews/mesh-plant-031-velvet-carpetweed-preview.png) | 14031 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-032-pebble-moss-mat_LOD0.glb` | ![mesh-plant-032-pebble-moss-mat_LOD0.glb](meshes/previews/mesh-plant-032-pebble-moss-mat-preview.png) | 14032 | ready | in band on attempt 1 (density 1.00) · 3540 tris |
| `mesh-plant-032-pebble-moss-mat_LOD1.glb` | ![mesh-plant-032-pebble-moss-mat_LOD1.glb](meshes/previews/mesh-plant-032-pebble-moss-mat-preview.png) | 114032 | ready | LOD1 1172 tris vs LOD0 3540 tris; < LOD0 · 1172 tris |
| `mesh-plant-032-pebble-moss-mat_LOD2.glb` | ![mesh-plant-032-pebble-moss-mat_LOD2.glb](meshes/previews/mesh-plant-032-pebble-moss-mat-preview.png) | 14032 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-033-starlight-carpet_LOD0.glb` | ![mesh-plant-033-starlight-carpet_LOD0.glb](meshes/previews/mesh-plant-033-starlight-carpet-preview.png) | 14033 | ready | in band on attempt 1 (density 1.00) · 1770 tris |
| `mesh-plant-033-starlight-carpet_LOD1.glb` | ![mesh-plant-033-starlight-carpet_LOD1.glb](meshes/previews/mesh-plant-033-starlight-carpet-preview.png) | 114033 | ready | LOD1 586 tris vs LOD0 1770 tris; < LOD0 · 586 tris |
| `mesh-plant-033-starlight-carpet_LOD2.glb` | ![mesh-plant-033-starlight-carpet_LOD2.glb](meshes/previews/mesh-plant-033-starlight-carpet-preview.png) | 14033 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-034-olive-mat_LOD0.glb` | ![mesh-plant-034-olive-mat_LOD0.glb](meshes/previews/mesh-plant-034-olive-mat-preview.png) | 14034 | ready | in band on attempt 1 (density 1.00) · 3540 tris |
| `mesh-plant-034-olive-mat_LOD1.glb` | ![mesh-plant-034-olive-mat_LOD1.glb](meshes/previews/mesh-plant-034-olive-mat-preview.png) | 114034 | ready | LOD1 1172 tris vs LOD0 3540 tris; < LOD0 · 1172 tris |
| `mesh-plant-034-olive-mat_LOD2.glb` | ![mesh-plant-034-olive-mat_LOD2.glb](meshes/previews/mesh-plant-034-olive-mat-preview.png) | 14034 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-035-cushion-algae-mat_LOD0.glb` | ![mesh-plant-035-cushion-algae-mat_LOD0.glb](meshes/previews/mesh-plant-035-cushion-algae-mat-preview.png) | 14035 | ready | in band on attempt 1 (density 1.00) · 1770 tris |
| `mesh-plant-035-cushion-algae-mat_LOD1.glb` | ![mesh-plant-035-cushion-algae-mat_LOD1.glb](meshes/previews/mesh-plant-035-cushion-algae-mat-preview.png) | 114035 | ready | LOD1 586 tris vs LOD0 1770 tris; < LOD0 · 586 tris |
| `mesh-plant-035-cushion-algae-mat_LOD2.glb` | ![mesh-plant-035-cushion-algae-mat_LOD2.glb](meshes/previews/mesh-plant-035-cushion-algae-mat-preview.png) | 14035 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-036-dwarf-pearl-mat_LOD0.glb` | ![mesh-plant-036-dwarf-pearl-mat_LOD0.glb](meshes/previews/mesh-plant-036-dwarf-pearl-mat-preview.png) | 14036 | ready | in band on attempt 1 (density 1.00) · 3540 tris |
| `mesh-plant-036-dwarf-pearl-mat_LOD1.glb` | ![mesh-plant-036-dwarf-pearl-mat_LOD1.glb](meshes/previews/mesh-plant-036-dwarf-pearl-mat-preview.png) | 114036 | ready | LOD1 1172 tris vs LOD0 3540 tris; < LOD0 · 1172 tris |
| `mesh-plant-036-dwarf-pearl-mat_LOD2.glb` | ![mesh-plant-036-dwarf-pearl-mat_LOD2.glb](meshes/previews/mesh-plant-036-dwarf-pearl-mat-preview.png) | 14036 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-037-bridal-veilweed_LOD0.glb` | ![mesh-plant-037-bridal-veilweed_LOD0.glb](meshes/previews/mesh-plant-037-bridal-veilweed-preview.png) | 14037 | ready | in band on attempt 1 (density 1.00) · 2340 tris |
| `mesh-plant-037-bridal-veilweed_LOD1.glb` | ![mesh-plant-037-bridal-veilweed_LOD1.glb](meshes/previews/mesh-plant-037-bridal-veilweed-preview.png) | 114037 | ready | LOD1 1080 tris vs LOD0 2340 tris; < LOD0 · 1080 tris |
| `mesh-plant-037-bridal-veilweed_LOD2.glb` | ![mesh-plant-037-bridal-veilweed_LOD2.glb](meshes/previews/mesh-plant-037-bridal-veilweed-preview.png) | 14037 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-038-mist-veil_LOD0.glb` | ![mesh-plant-038-mist-veil_LOD0.glb](meshes/previews/mesh-plant-038-mist-veil-preview.png) | 14038 | ready | in band on attempt 1 (density 1.00) · 2340 tris |
| `mesh-plant-038-mist-veil_LOD1.glb` | ![mesh-plant-038-mist-veil_LOD1.glb](meshes/previews/mesh-plant-038-mist-veil-preview.png) | 114038 | ready | LOD1 1080 tris vs LOD0 2340 tris; < LOD0 · 1080 tris |
| `mesh-plant-038-mist-veil_LOD2.glb` | ![mesh-plant-038-mist-veil_LOD2.glb](meshes/previews/mesh-plant-038-mist-veil-preview.png) | 14038 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-039-green-cascade_LOD0.glb` | ![mesh-plant-039-green-cascade_LOD0.glb](meshes/previews/mesh-plant-039-green-cascade-preview.png) | 14039 | ready | in band on attempt 1 (density 1.00) · 2340 tris |
| `mesh-plant-039-green-cascade_LOD1.glb` | ![mesh-plant-039-green-cascade_LOD1.glb](meshes/previews/mesh-plant-039-green-cascade-preview.png) | 114039 | ready | LOD1 1080 tris vs LOD0 2340 tris; < LOD0 · 1080 tris |
| `mesh-plant-039-green-cascade_LOD2.glb` | ![mesh-plant-039-green-cascade_LOD2.glb](meshes/previews/mesh-plant-039-green-cascade-preview.png) | 14039 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-040-willow-veil_LOD0.glb` | ![mesh-plant-040-willow-veil_LOD0.glb](meshes/previews/mesh-plant-040-willow-veil-preview.png) | 14040 | ready | in band on attempt 1 (density 1.00) · 2340 tris |
| `mesh-plant-040-willow-veil_LOD1.glb` | ![mesh-plant-040-willow-veil_LOD1.glb](meshes/previews/mesh-plant-040-willow-veil-preview.png) | 114040 | ready | LOD1 1080 tris vs LOD0 2340 tris; < LOD0 · 1080 tris |
| `mesh-plant-040-willow-veil_LOD2.glb` | ![mesh-plant-040-willow-veil_LOD2.glb](meshes/previews/mesh-plant-040-willow-veil-preview.png) | 14040 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-041-silverfall-veil_LOD0.glb` | ![mesh-plant-041-silverfall-veil_LOD0.glb](meshes/previews/mesh-plant-041-silverfall-veil-preview.png) | 14041 | ready | in band on attempt 1 (density 1.00) · 2340 tris |
| `mesh-plant-041-silverfall-veil_LOD1.glb` | ![mesh-plant-041-silverfall-veil_LOD1.glb](meshes/previews/mesh-plant-041-silverfall-veil-preview.png) | 114041 | ready | LOD1 1080 tris vs LOD0 2340 tris; < LOD0 · 1080 tris |
| `mesh-plant-041-silverfall-veil_LOD2.glb` | ![mesh-plant-041-silverfall-veil_LOD2.glb](meshes/previews/mesh-plant-041-silverfall-veil-preview.png) | 14041 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-042-teardrop-veil_LOD0.glb` | ![mesh-plant-042-teardrop-veil_LOD0.glb](meshes/previews/mesh-plant-042-teardrop-veil-preview.png) | 14042 | ready | in band on attempt 1 (density 1.00) · 2340 tris |
| `mesh-plant-042-teardrop-veil_LOD1.glb` | ![mesh-plant-042-teardrop-veil_LOD1.glb](meshes/previews/mesh-plant-042-teardrop-veil-preview.png) | 114042 | ready | LOD1 1080 tris vs LOD0 2340 tris; < LOD0 · 1080 tris |
| `mesh-plant-042-teardrop-veil_LOD2.glb` | ![mesh-plant-042-teardrop-veil_LOD2.glb](meshes/previews/mesh-plant-042-teardrop-veil-preview.png) | 14042 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-043-hanging-gardens_LOD0.glb` | ![mesh-plant-043-hanging-gardens_LOD0.glb](meshes/previews/mesh-plant-043-hanging-gardens-preview.png) | 14043 | ready | in band on attempt 1 (density 1.00) · 2340 tris |
| `mesh-plant-043-hanging-gardens_LOD1.glb` | ![mesh-plant-043-hanging-gardens_LOD1.glb](meshes/previews/mesh-plant-043-hanging-gardens-preview.png) | 114043 | ready | LOD1 1080 tris vs LOD0 2340 tris; < LOD0 · 1080 tris |
| `mesh-plant-043-hanging-gardens_LOD2.glb` | ![mesh-plant-043-hanging-gardens_LOD2.glb](meshes/previews/mesh-plant-043-hanging-gardens-preview.png) | 14043 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-044-redstem-weed_LOD0.glb` | ![mesh-plant-044-redstem-weed_LOD0.glb](meshes/previews/mesh-plant-044-redstem-weed-preview.png) | 14044 | ready | in band on attempt 1 (density 1.00) · 1752 tris |
| `mesh-plant-044-redstem-weed_LOD1.glb` | ![mesh-plant-044-redstem-weed_LOD1.glb](meshes/previews/mesh-plant-044-redstem-weed-preview.png) | 114044 | ready | LOD1 480 tris vs LOD0 1752 tris; < LOD0 · 480 tris |
| `mesh-plant-044-redstem-weed_LOD2.glb` | ![mesh-plant-044-redstem-weed_LOD2.glb](meshes/previews/mesh-plant-044-redstem-weed-preview.png) | 14044 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-045-bamboo-stem_LOD0.glb` | ![mesh-plant-045-bamboo-stem_LOD0.glb](meshes/previews/mesh-plant-045-bamboo-stem-preview.png) | 14045 | ready | in band on attempt 1 (density 1.00) · 1168 tris |
| `mesh-plant-045-bamboo-stem_LOD1.glb` | ![mesh-plant-045-bamboo-stem_LOD1.glb](meshes/previews/mesh-plant-045-bamboo-stem-preview.png) | 114045 | ready | LOD1 320 tris vs LOD0 1168 tris; < LOD0 · 320 tris |
| `mesh-plant-045-bamboo-stem_LOD2.glb` | ![mesh-plant-045-bamboo-stem_LOD2.glb](meshes/previews/mesh-plant-045-bamboo-stem-preview.png) | 14045 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-046-corkscrew-stem_LOD0.glb` | ![mesh-plant-046-corkscrew-stem_LOD0.glb](meshes/previews/mesh-plant-046-corkscrew-stem-preview.png) | 14046 | ready | in band on attempt 1 (density 1.00) · 1752 tris |
| `mesh-plant-046-corkscrew-stem_LOD1.glb` | ![mesh-plant-046-corkscrew-stem_LOD1.glb](meshes/previews/mesh-plant-046-corkscrew-stem-preview.png) | 114046 | ready | LOD1 480 tris vs LOD0 1752 tris; < LOD0 · 480 tris |
| `mesh-plant-046-corkscrew-stem_LOD2.glb` | ![mesh-plant-046-corkscrew-stem_LOD2.glb](meshes/previews/mesh-plant-046-corkscrew-stem-preview.png) | 14046 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-047-ladderweed_LOD0.glb` | ![mesh-plant-047-ladderweed_LOD0.glb](meshes/previews/mesh-plant-047-ladderweed-preview.png) | 14047 | ready | in band on attempt 1 (density 1.00) · 1168 tris |
| `mesh-plant-047-ladderweed_LOD1.glb` | ![mesh-plant-047-ladderweed_LOD1.glb](meshes/previews/mesh-plant-047-ladderweed-preview.png) | 114047 | ready | LOD1 320 tris vs LOD0 1168 tris; < LOD0 · 320 tris |
| `mesh-plant-047-ladderweed_LOD2.glb` | ![mesh-plant-047-ladderweed_LOD2.glb](meshes/previews/mesh-plant-047-ladderweed-preview.png) | 14047 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-048-pinkstem_LOD0.glb` | ![mesh-plant-048-pinkstem_LOD0.glb](meshes/previews/mesh-plant-048-pinkstem-preview.png) | 14048 | ready | in band on attempt 1 (density 1.00) · 1752 tris |
| `mesh-plant-048-pinkstem_LOD1.glb` | ![mesh-plant-048-pinkstem_LOD1.glb](meshes/previews/mesh-plant-048-pinkstem-preview.png) | 114048 | ready | LOD1 480 tris vs LOD0 1752 tris; < LOD0 · 480 tris |
| `mesh-plant-048-pinkstem_LOD2.glb` | ![mesh-plant-048-pinkstem_LOD2.glb](meshes/previews/mesh-plant-048-pinkstem-preview.png) | 14048 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-049-zigzag-stem_LOD0.glb` | ![mesh-plant-049-zigzag-stem_LOD0.glb](meshes/previews/mesh-plant-049-zigzag-stem-preview.png) | 14049 | ready | in band on attempt 1 (density 1.00) · 1168 tris |
| `mesh-plant-049-zigzag-stem_LOD1.glb` | ![mesh-plant-049-zigzag-stem_LOD1.glb](meshes/previews/mesh-plant-049-zigzag-stem-preview.png) | 114049 | ready | LOD1 320 tris vs LOD0 1168 tris; < LOD0 · 320 tris |
| `mesh-plant-049-zigzag-stem_LOD2.glb` | ![mesh-plant-049-zigzag-stem_LOD2.glb](meshes/previews/mesh-plant-049-zigzag-stem-preview.png) | 14049 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |
| `mesh-plant-050-crystal-stem_LOD0.glb` | ![mesh-plant-050-crystal-stem_LOD0.glb](meshes/previews/mesh-plant-050-crystal-stem-preview.png) | 14050 | ready | in band on attempt 1 (density 1.00) · 1752 tris |
| `mesh-plant-050-crystal-stem_LOD1.glb` | ![mesh-plant-050-crystal-stem_LOD1.glb](meshes/previews/mesh-plant-050-crystal-stem-preview.png) | 114050 | ready | LOD1 480 tris vs LOD0 1752 tris; < LOD0 · 480 tris |
| `mesh-plant-050-crystal-stem_LOD2.glb` | ![mesh-plant-050-crystal-stem_LOD2.glb](meshes/previews/mesh-plant-050-crystal-stem-preview.png) | 14050 | ready | card-based: 3 crossed quads, no numeric band · 6 tris |

## Tank glass meshes

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `mesh-tank-001-classic-rectangle.glb` | ![mesh-tank-001-classic-rectangle.glb](meshes/previews/mesh-tank-001-classic-rectangle-preview.png) | 17001 | ready | 5 thin boxes (bottom + 4 walls), open top, concatenated; medium glass t=0.035; butt joints overlap at corners. watertight=True; winding_consistent=True; degener · 60 tris |
| `mesh-tank-002-bowfront.glb` | ![mesh-tank-002-bowfront.glb](meshes/previews/mesh-tank-002-bowfront-preview.png) | 17002 | ready | flat back + 2 side boxes + curved front panel (arc R=1.368, medium glass t=0.035, panel is a true hollow shell); open top. watertight=True; winding_consistent=T · 544 tris |
| `mesh-tank-003-cube.glb` | ![mesh-tank-003-cube.glb](meshes/previews/mesh-tank-003-cube-preview.png) | 17003 | ready | 5 thick-glass boxes (bottom + 4 walls), open top; thick glass t=0.05; full 2.0-unit cube per largest-extent normalization (reads large next to the rectangle des · 60 tris |
| `mesh-tank-004-cylinder.glb` | ![mesh-tank-004-cylinder.glb](meshes/previews/mesh-tank-004-cylinder-preview.png) | 17004 | ready | open tube: full-circle hollow curved wall (thin glass t=0.02) + solid disc bottom; open top; diameter 2.0. watertight=True; winding_consistent=True; degenerate_ · 768 tris |
| `mesh-tank-005-panorama.glb` | ![mesh-tank-005-panorama.glb](meshes/previews/mesh-tank-005-panorama-preview.png) | 17005 | ready | wide 5-box open-top tank (2.0 x 0.62 x 0.72); medium glass t=0.035; the "film screen" stage. watertight=True; winding_consistent=True; degenerate_faces=0. · 60 tris |
| `mesh-tank-006-hexagon.glb` | ![mesh-tank-006-hexagon.glb](meshes/previews/mesh-tank-006-hexagon-preview.png) | 17006 | ready | 6 wall boxes butt-jointed around a hexagonal slab bottom; thick glass t=0.05; corner-to-corner 2.0; open top. watertight=True; winding_consistent=True; degenera · 96 tris |
| `mesh-tank-007-corner-triangle.glb` | ![mesh-tank-007-corner-triangle.glb](meshes/previews/mesh-tank-007-corner-triangle-preview.png) | 17007 | ready | right-triangle footprint (legs 1.5, hypotenuse ~2.12): 3 wall boxes + triangular slab bottom; medium glass t=0.035; open top; sits in a room corner. watertight= · 48 tris |
| `mesh-tank-008-tall-column.glb` | ![mesh-tank-008-tall-column.glb](meshes/previews/mesh-tank-008-tall-column-preview.png) | 17008 | ready | INTERPRETATION: "Tall Column" built as a tall square column (1.4 x 1.4 x 2.6) rather than forcing the 2.0 horizontal normalization, to keep the vertical-drama p · 60 tris |
| `mesh-tank-009-bowl.glb` | ![mesh-tank-009-bowl.glb](meshes/previews/mesh-tank-009-bowl-preview.png) | 17009 | ready | INTERPRETATION: "Bowl" built as a thick-walled spherical fishbowl (lathe of a closed glass profile: outer R=1.0, inner R-t, rim cut at y=+0.30); thin glass t=0. · 8960 tris |
| `mesh-tank-010-wall-flat.glb` | ![mesh-tank-010-wall-flat.glb](meshes/previews/mesh-tank-010-wall-flat-preview.png) | 17010 | ready | living-painting slab (2.0 x 0.35 x 1.0); 5 thin-glass boxes, open top; thin glass t=0.02; side-on viewing. watertight=True; winding_consistent=True; degenerate_ · 60 tris |

## Maintenance object meshes

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `mesh-maint-001-sponge-filter.glb` | ![mesh-maint-001-sponge-filter.glb](meshes/previews/mesh-maint-001-sponge-filter-preview.png) | 15001 | ready | sponge cylinder + lift tube; shrimp-safe. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; the union is no · 248 tris |
| `mesh-maint-002-hang-on-back-filter.glb` | ![mesh-maint-002-hang-on-back-filter.glb](meshes/previews/mesh-maint-002-hang-on-back-filter-preview.png) | 15002 | ready | HOB: box body + lid + intake tube below + outflow lip. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; th · 84 tris |
| `mesh-maint-003-canister-filter.glb` | ![mesh-maint-003-canister-filter.glb](meshes/previews/mesh-maint-003-canister-filter-preview.png) | 15003 | ready | external canister: tall cylinder + lid + 2 hose stubs. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; th · 268 tris |
| `mesh-maint-004-internal-corner-filter.glb` | ![mesh-maint-004-internal-corner-filter.glb](meshes/previews/mesh-maint-004-internal-corner-filter-preview.png) | 15004 | ready | corner unit rotated 45 deg: box + sponge cap + outlet tube. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive close · 64 tris |
| `mesh-maint-005-undergravel-plate.glb` | ![mesh-maint-005-undergravel-plate.glb](meshes/previews/mesh-maint-005-undergravel-plate-preview.png) | 15005 | ready | flat filter plate + 2 uplift tubes with caps. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; the union i · 204 tris |
| `mesh-maint-006-sump-refugium.glb` | ![mesh-maint-006-sump-refugium.glb](meshes/previews/mesh-maint-006-sump-refugium-preview.png) | 15006 | ready | mini open-top tank (2nd tank below) + divider + pump. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; the · 84 tris |
| `mesh-maint-007-stick-heater-50w.glb` | ![mesh-maint-007-stick-heater-50w.glb](meshes/previews/mesh-maint-007-stick-heater-50w-preview.png) | 15007 | ready | 50W stick: slim tube + caps + top dial box. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; the union is  · 212 tris |
| `mesh-maint-008-stick-heater-200w.glb` | ![mesh-maint-008-stick-heater-200w.glb](meshes/previews/mesh-maint-008-stick-heater-200w-preview.png) | 15008 | ready | 200W stick: thicker/longer tube + caps + top dial box. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; th · 212 tris |
| `mesh-maint-009-inline-heater.glb` | ![mesh-maint-009-inline-heater.glb](meshes/previews/mesh-maint-009-inline-heater-preview.png) | 15009 | ready | heats inside the filter line: horizontal body + hose barbs. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive close · 156 tris |
| `mesh-maint-010-surface-skimmer.glb` | ![mesh-maint-010-surface-skimmer.glb](meshes/previews/mesh-maint-010-surface-skimmer-preview.png) | 15010 | ready | skimmer: body + wider cup + torus ring implying intake slots. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive clo · 496 tris |
| `mesh-maint-011-protein-skimmer.glb` | ![mesh-maint-011-protein-skimmer.glb](meshes/previews/mesh-maint-011-protein-skimmer-preview.png) | 15011 | ready | tall protein skimmer: body + wide cup + ring + air inlet. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; · 576 tris |
| `mesh-maint-012-lily-pipe-skimmer.glb` | ![mesh-maint-012-lily-pipe-skimmer.glb](meshes/previews/mesh-maint-012-lily-pipe-skimmer-preview.png) | 15012 | ready | glass lily pipe: vertical tube + quarter bend + flared spout. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive clo · 484 tris |
| `mesh-maint-013-air-stone-bar.glb` | ![mesh-maint-013-air-stone-bar.glb](meshes/previews/mesh-maint-013-air-stone-bar-preview.png) | 15013 | ready | bubble-curtain bar: horizontal porous stone + inlet + feet. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive close · 112 tris |
| `mesh-maint-014-sponge-air-filter.glb` | ![mesh-maint-014-sponge-air-filter.glb](meshes/previews/mesh-maint-014-sponge-air-filter-preview.png) | 15014 | ready | air-driven sponge: base + sponge + tall lift tube. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; the un · 224 tris |
| `mesh-maint-015-co2-diffuser.glb` | ![mesh-maint-015-co2-diffuser.glb](meshes/previews/mesh-maint-015-co2-diffuser-preview.png) | 15015 | ready | CO2 diffuser: chamber + ceramic disc + bent inlet. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; the un · 368 tris |
| `mesh-maint-016-led-daylight-bar.glb` | ![mesh-maint-016-led-daylight-bar.glb](meshes/previews/mesh-maint-016-led-daylight-bar-preview.png) | 15016 | ready | LED daylight bar: long thin bar + 2 angled mount arms. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; th · 48 tris |
| `mesh-maint-017-moonlight-strip.glb` | ![mesh-maint-017-moonlight-strip.glb](meshes/previews/mesh-maint-017-moonlight-strip-preview.png) | 15017 | ready | dim blue moonlight strip: shorter bar + 2 mount arms. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed; the · 48 tris |
| `mesh-maint-018-spotlight-pendant.glb` | ![mesh-maint-018-spotlight-pendant.glb](meshes/previews/mesh-maint-018-spotlight-pendant-preview.png) | 15018 | ready | pendant: cord + tapered shade + bulb sphere; one dramatic beam. FLOATS BY DESIGN (hangs from ceiling; mount the cord top at install height). intersecting multi- · 200 tris |
| `mesh-maint-019-gravel-vacuum.glb` | ![mesh-maint-019-gravel-vacuum.glb](meshes/previews/mesh-maint-019-gravel-vacuum-preview.png) | 15019 | ready | siphon: wide vacuum head + reducer + draped hose (torus arc). intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive clo · 616 tris |
| `mesh-maint-020-auto-water-changer.glb` | ![mesh-maint-020-auto-water-changer.glb](meshes/previews/mesh-maint-020-auto-water-changer-preview.png) | 15020 | ready | auto changer: controller + hoses + display + float switch. intersecting multi-solid prop assembly (watertight=True by trimesh edge count = each primitive closed · 228 tris |

## Ambient beds

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `audio-env-001-studio-base.wav` | ![audio-env-001-studio-base.wav](audio/environments/audio-env-001-studio-base-waveform.png) | 91010 | ready | quiet room tone, faint hum. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= interior natural |
| `audio-env-001-studio-detail.wav` | ![audio-env-001-studio-detail.wav](audio/environments/audio-env-001-studio-detail-waveform.png) | 91011 | ready | quiet room tone, faint hum. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= interior natural |
| `audio-env-001-studio-night.wav` | ![audio-env-001-studio-night.wav](audio/environments/audio-env-001-studio-night-waveform.png) | 91012 | ready | quiet room tone, faint hum. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= interior natural |
| `audio-env-002-living-room-base.wav` | ![audio-env-002-living-room-base.wav](audio/environments/audio-env-002-living-room-base-waveform.png) | 91020 | ready | soft household murmur (abstract bandpassed-noise cadence, not voice) + distant traffic. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); l |
| `audio-env-002-living-room-detail.wav` | ![audio-env-002-living-room-detail.wav](audio/environments/audio-env-002-living-room-detail-waveform.png) | 91021 | ready | soft household murmur (abstract bandpassed-noise cadence, not voice) + distant traffic. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); l |
| `audio-env-002-living-room-night.wav` | ![audio-env-002-living-room-night.wav](audio/environments/audio-env-002-living-room-night-waveform.png) | 91022 | ready | soft household murmur (abstract bandpassed-noise cadence, not voice) + distant traffic. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); l |
| `audio-env-003-lab-base.wav` | ![audio-env-003-lab-base.wav](audio/environments/audio-env-003-lab-base-waveform.png) | 91030 | ready | ventilation hum + sparse soft sine beeps. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= in |
| `audio-env-003-lab-detail.wav` | ![audio-env-003-lab-detail.wav](audio/environments/audio-env-003-lab-detail-waveform.png) | 91031 | ready | ventilation hum + sparse soft sine beeps. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= in |
| `audio-env-003-lab-night.wav` | ![audio-env-003-lab-night.wav](audio/environments/audio-env-003-lab-night-waveform.png) | 91032 | ready | ventilation hum + sparse soft sine beeps. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= in |
| `audio-env-004-public-aquarium-base.wav` | ![audio-env-004-public-aquarium-base.wav](audio/environments/audio-env-004-public-aquarium-base-waveform.png) | 91040 | ready | large-hall wash (synthetic IR reverb) + water echoes, sparse footsteps/plops. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint  |
| `audio-env-004-public-aquarium-detail.wav` | ![audio-env-004-public-aquarium-detail.wav](audio/environments/audio-env-004-public-aquarium-detail-waveform.png) | 91041 | ready | large-hall wash (synthetic IR reverb) + water echoes, sparse footsteps/plops. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint  |
| `audio-env-004-public-aquarium-night.wav` | ![audio-env-004-public-aquarium-night.wav](audio/environments/audio-env-004-public-aquarium-night-waveform.png) | 91042 | ready | large-hall wash (synthetic IR reverb) + water echoes, sparse footsteps/plops. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint  |
| `audio-env-005-city-base.wav` | ![audio-env-005-city-base.wav](audio/environments/audio-env-005-city-base-waveform.png) | 91050 | ready | distant traffic rumble + rare quiet lowpassed siren wails. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free |
| `audio-env-005-city-detail.wav` | ![audio-env-005-city-detail.wav](audio/environments/audio-env-005-city-detail-waveform.png) | 91051 | ready | distant traffic rumble + rare quiet lowpassed siren wails. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free |
| `audio-env-005-city-night.wav` | ![audio-env-005-city-night.wav](audio/environments/audio-env-005-city-night-waveform.png) | 91052 | ready | distant traffic rumble + rare quiet lowpassed siren wails. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free |
| `audio-env-006-forest-base.wav` | ![audio-env-006-forest-base.wav](audio/environments/audio-env-006-forest-base-waveform.png) | 91060 | ready | wind through leaves; day=FM bird chirps, night=4.2kHz cricket pulses. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified |
| `audio-env-006-forest-detail.wav` | ![audio-env-006-forest-detail.wav](audio/environments/audio-env-006-forest-detail-waveform.png) | 91061 | ready | wind through leaves; day=FM bird chirps, night=4.2kHz cricket pulses. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified |
| `audio-env-006-forest-night.wav` | ![audio-env-006-forest-night.wav](audio/environments/audio-env-006-forest-night-waveform.png) | 91062 | ready | wind through leaves; day=FM bird chirps, night=4.2kHz cricket pulses. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified |
| `audio-env-007-ocean-base.wav` | ![audio-env-007-ocean-base.wav](audio/environments/audio-env-007-ocean-base-waveform.png) | 91070 | ready | surf swells; day=sparse FM gull cries. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= inter |
| `audio-env-007-ocean-detail.wav` | ![audio-env-007-ocean-detail.wav](audio/environments/audio-env-007-ocean-detail-waveform.png) | 91071 | ready | surf swells; day=sparse FM gull cries. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= inter |
| `audio-env-007-ocean-night.wav` | ![audio-env-007-ocean-night.wav](audio/environments/audio-env-007-ocean-night-waveform.png) | 91072 | ready | surf swells; day=sparse FM gull cries. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= inter |
| `audio-env-008-greenhouse-base.wav` | ![audio-env-008-greenhouse-base.wav](audio/environments/audio-env-008-greenhouse-base-waveform.png) | 91080 | ready | airy wash + leaf rustle; Poisson water drips. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump < |
| `audio-env-008-greenhouse-detail.wav` | ![audio-env-008-greenhouse-detail.wav](audio/environments/audio-env-008-greenhouse-detail-waveform.png) | 91081 | ready | airy wash + leaf rustle; Poisson water drips. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump < |
| `audio-env-008-greenhouse-night.wav` | ![audio-env-008-greenhouse-night.wav](audio/environments/audio-env-008-greenhouse-night-waveform.png) | 91082 | ready | airy wash + leaf rustle; Poisson water drips. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump < |
| `audio-env-009-desert-base.wav` | ![audio-env-009-desert-base.wav](audio/environments/audio-env-009-desert-base-waveform.png) | 91090 | ready | wind gusts + sand hiss. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= interior natural var |
| `audio-env-009-desert-detail.wav` | ![audio-env-009-desert-detail.wav](audio/environments/audio-env-009-desert-detail-waveform.png) | 91091 | ready | wind gusts + sand hiss. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= interior natural var |
| `audio-env-009-desert-night.wav` | ![audio-env-009-desert-night.wav](audio/environments/audio-env-009-desert-night-waveform.png) | 91092 | ready | wind gusts + sand hiss. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified click-free (seam jump <= interior natural var |
| `audio-env-010-cabin-loft-base.wav` | ![audio-env-010-cabin-loft-base.wav](audio/environments/audio-env-010-cabin-loft-base-waveform.png) | 91100 | ready | fire crackle (Poisson transients) + faint wind; sparse pops/creaks. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified c |
| `audio-env-010-cabin-loft-detail.wav` | ![audio-env-010-cabin-loft-detail.wav](audio/environments/audio-env-010-cabin-loft-detail-waveform.png) | 91101 | ready | fire crackle (Poisson transients) + faint wind; sparse pops/creaks. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified c |
| `audio-env-010-cabin-loft-night.wav` | ![audio-env-010-cabin-loft-night.wav](audio/environments/audio-env-010-cabin-loft-night-waveform.png) | 91102 | ready | fire crackle (Poisson transients) + faint wind; sparse pops/creaks. 40s seamless loop (44s generated, 4s equal-power head/tail crossfade); loop joint verified c |

## Tank water bed

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `audio-water-bubbles-filter.wav` | ![audio-water-bubbles-filter.wav](audio/water/audio-water-bubbles-filter-waveform.png) | 92000 | ready | Poisson bubble blips (800-2000 Hz sine bursts, exp decay) + gentle 120 Hz filter hum. 40s seamless loop, verified click-free. |

## Scene presets

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `preset-scene-cold-studio.json` | — | 93003 | ready | Type 8 Deep Trench/Shape 8 Tall Column/Floor 2/Room 1/Window 5 City; Arctic Tetra(14) x12, Glacier Guppy(27) x5, Ghost Glass(9) x6; structure 5; plant 9x6; main |
| `preset-scene-deep-reef.json` | — | 93004 | ready | Type 3 Reef Crest/Shape 5/Floor 1/Room 3 Lab, no window; Electric Tetra(23) x8, Ember Glow(5) x8, Rainbow Slip(20) x6 (no reef-safe column exists - chosen small |
| `preset-scene-jungle-tank.json` | — | 93002 | ready | Type 1/Shape 5 Panorama/Floor 1/Room 2 Living room/Window 6 Forest; Neon Tetra Prime x12, Ember Tetra(38) x10, Tiger Rasbora(18) x10, Opal Veiltail(31) x4 as go |
| `preset-scene-minimalist-cube.json` | — | 93001 | ready | Type 10/Shape 3 Cube/Floor 2/Room 1 Studio; Neon Tetra Prime x10 + Betta Silk x1; structure 9; plant 29x8; maint 1. Validator PASS. |
| `preset-scene-neon-night.json` | — | 93005 | ready | Type 10/Shape 3 Cube/Floor 2/Room 1/Window 5 City; Neon Tetra Prime(2) x8, Electric Tetra(23) x8, Midnight Shimmer(13) x6; structure 8; plant 3x12; maint 1+17.  |
| `preset-scene-phase-0.json` | — | 424242 | ready | Exact example-scene cast (seed 424242): type 1/shape 1/floor 1/room 1 Studio, no window; species 2x12, 14x12, 4x5; structure 2; plant 2x24; maint 1; knobs audio |

## Show bibles

| File | Preview | Seed | Status | Notes |
|---|---|---|---|---|
| `preset-show-cold-studio.json` | — | 94003 | ready | The Cold Studio Window Tank: cold blue, studio + city window, slow drift low light, arctic species minimal planting. Exactly the 6 playbook schema keys. Validat |
| `preset-show-deep-reef.json` | — | 94004 | ready | The Deep Reef: bright reef, lab, stable calcium-driven, reef-safe community. Exactly the 6 playbook schema keys. Validator PASS. |
| `preset-show-jungle-tank.json` | — | 94002 | ready | The Jungle Tank: warm green, living room + forest window, nitrate-rich fast growth, dense planting tetras + gouramis (catalog has no gourami row - see jungle sc |
| `preset-show-minimalist-cube.json` | — | 94001 | ready | The Minimalist Cube: cool white, studio no window, crystal low-nutrient, 1 schooling species + 1 accent. Exactly the 6 playbook schema keys. Validator PASS. |
| `preset-show-neon-night.json` | — | 94005 | ready | The Neon Night Tank: neon magenta/cyan, night city window, display (no chemistry arc), high-contrast schooling fish. Exactly the 6 playbook schema keys. Validat |
