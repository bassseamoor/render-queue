# Terrain → plants → creature and material inputs

Ecology contract **1.0.0**; terrain generator remains **3.0.0**.

Planet Workshop and Living Garden Lab load `moor-ecology.js`. The same deterministic geometry builder makes both the detailed specimen and the cheaper landscape mesh. This is a review component in Pulse's Bin, not production MOOR integration.

## Use in Pulse

Open **Planet Workshop → Life → Inspect these plants**. Garden Lab opens at the selected terrain environment. Its **Planet environment** section shows the source and allows unlinking for experiments. **Ecology data ↓** exports the packet for another tool. Shared context is saved as `moor.ecology.context.v1`; recipes retain their source environment on save/import.

## What drives what

Planet seed/type → species identities and inherited shape/chemistry traits.
Terrain latitude, coarse altitude, rainfall, runoff, slope, soil estimate → habitat suitability, density, local growth form and placement.
Plants → edible forage, seeds, nectar, toxicity, cover, wood and fiber descriptors.
The packet also carries geology and water descriptors so future mineral rules can use geology rather than inventing ores from plants.

Desert variants are shorter with narrow leaves. Jungle variants grow larger with broader foliage. Ice worlds use low grass, shrub and flower variants. Gas, barren and lava worlds have no supported terrestrial flora. Toxic and crystal flora are excluded from the generic edible-food list.

## Consumer interfaces

```js
// In Planet Workshop. Direction is a finite nonzero {x,y,z}.
const packet = planetWorkshop.ecologyAt(direction);
const actualPatch = planetWorkshop.ecologySnapshot();
// actualPatch.placement.specimens lists speciesId, direction, scale and resources.

// In another tool: load moor-ecology.js, import JSON or read the shared context.
const packet = MoorEcology.validatePacket(importedJson);
const grazableFood = packet.foodSources;
const plantMaterials = packet.organicMaterials;
const shelter = packet.habitat;
const geology = packet.environment.geology;
```

`MoorEcology.flora(seed,type)` returns stable species IDs, genes and chemistry. `communities(environment)` returns potentially suitable local species and phenotypes; this is not a census. `phenotype(species,environment)` returns a garden recipe. `build(THREE,recipe,quality)` returns bark/leaf/petal vertex batches; quality 1 is detailed, 0 is landscape. Changing generator rules requires an ecology version bump.

A creature consumer should select food by species/material ID and suitability, reject incompatible chemistry, and use cover/water/climate to choose habitats. It must not equate estimated biomass with inventory. Mineral consumers should use `environment.geology`; organic consumers use `organicMaterials`. These interfaces do not implement creature behavior or resource transactions.

## Preserved contracts and limits

Terrain, water and camera generation are unchanged. Landscape roots still evaluate the existing shared GPU terrain field, microrelief fade and brush delta. CPU climate/height/slope are coarse habitat estimates; do not use them for root placement. Placement records are candidates: shoreline/brush shaders can hide them. Landscape meshes simplify the detailed specimen; they are not screen-distance automatic LOD. Eight broad plant families are supported, not every biological growth habit. Food chemistry and dry masses are explicitly model estimates, not real biology or harvestable stock.

Local Chromium/SwiftShader verification: zero page/shader errors; linked recipe roundtrip; portrait/landscape layout; all ten types; brush displacement and persistence; fresh-load terrain hash `3.0.0:fdec3d02` for seed 1337. Riverbank scene: **448,480 triangles, 17 draw calls, 2,138 instance capacity**. Software rendering does not certify 60fps on a phone or laptop GPU.
