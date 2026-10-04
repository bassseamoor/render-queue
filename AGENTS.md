# Pulse dashboard rebuild contract

This repository publishes Project Pulse. Multiple builders update it. Always fetch the latest dashboard and manifest before writing; never replace newer changes using an older snapshot.

## Independent review components
- `pulse-component-extensions.js` registers Living Garden Lab, Planet Workshop, and Wall Mirror Foundry.
- Every generated `pulse-dashboard.html` MUST retain `<script src="pulse-component-extensions.js"></script>` after its inline tool scripts, immediately before the closing body tag.
- Do not inline, remove, or overwrite this registration file when reorganizing the dashboard.
- Preserve these tool records in `pulse-manifest.json`: `living-garden`, `planet-workshop`, and `wall-mirror`.
- Both belong in Bin > Generators and remain outside production MOOR.
- Their standalone implementations are `moor-living-garden.html` and `moor-planet-workshop.html`.

Before publishing a rebuild, verify both tools appear from the normal dashboard URL, without a component query parameter, and open from the bin. If changing component IDs, migrate saved UI state and deep links.

## Component project workspace
- Keep `<script src="pulse-workspace.js"></script>` before the independent-component extensions hook in every dashboard rebuild.
- `pulse-workspace.js` owns the multi-window canvas, drag/resize, assembly projects, save/import/export, and chat handoff. It is additive; do not replace it with single-tool focus navigation.
- Tool frames use `?workspace-tool=<component-id>` to isolate DOM/global state. Never initialize another workspace inside those frames.
- Dragging a Bin part onto a tool creates a new project; dragging into a project collects it without connecting logic automatically.
- Project schema is `moor.component-project` version 1. Preserve component IDs, source references, connections, intent, and nested layout. Tool recipe state is separate and must not be advertised as captured automatically.

## Wonder Feed recipe transformer
- Preserve `<script src="wonder-logic.js?v=1"></script>` in both Pulse and the standalone Wonder Feed.
- `wonder-logic.js` provides seeded idea recipes and schematics; idea genomes with `logicVersion:1` use it. Preserve legacy idea rendering for older saved genomes.
- `?feed=ideas&seed=<text>` replays an Ideas sequence. Ideas in the default stream remain proposals, not claimed live integrations.
