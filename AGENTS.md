# Pulse dashboard rebuild contract

This repository publishes Project Pulse. Multiple builders update it. Always fetch the latest dashboard and manifest before writing; never replace newer changes using an older snapshot.

## Independent review components
- `pulse-component-extensions.js` registers Living Garden Lab and Planet Workshop.
- Every generated `pulse-dashboard.html` MUST retain `<script src="pulse-component-extensions.js"></script>` after its inline tool scripts, immediately before the closing body tag.
- Do not inline, remove, or overwrite this registration file when reorganizing the dashboard.
- Preserve these tool records in `pulse-manifest.json`: `living-garden` and `planet-workshop`.
- Both belong in Bin > Generators and remain outside production MOOR.
- Their standalone implementations are `moor-living-garden.html` and `moor-planet-workshop.html`.

Before publishing a rebuild, verify both tools appear from the normal dashboard URL, without a component query parameter, and open from the bin. If changing component IDs, migrate saved UI state and deep links.
