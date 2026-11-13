# Render Queue studio template

Every Render Queue scene uses `studio-shell.css` and `studio-shell.js`. The shell owns the persistent Back button, mobile drawer, tabs, touch targets, and the full-screen scene treatment. A studio owns its renderer and existing controls.

## Minimum scene contract

1. Render into a full-viewport `canvas` or scene element.
2. Keep native controls in ordinary DOM nodes. The shell moves these nodes into its overlay, so their listeners and renderer state are retained.
3. For seeded scenes, expose `window.SeedConsole` and `window.SeedConsoleAdapter`; the shell preserves seed history, favorites, remix, capture, and recording controls.
4. Module-based studios must dispatch `window.dispatchEvent(new Event('studio:ready'))` after their renderer, adapter, and Seed Console imports complete.
5. Include the canonical assets before the closing body tag (or use `defer` in the head):

```html
<link rel="stylesheet" href="/render-queue/studio-shell.css?v=5">
<script src="/render-queue/studio-shell.js?v=5"></script>
```

For a standalone GitHub Pages repository under the same account, use `https://bassseamoor.github.io/render-queue/` in both asset URLs. The built-in Back button always returns there.

## Control placement

Use `#world`, `#camera`, and `#export` for a three-part studio. Existing scene-specific forms also work: the shell recognizes the Render Queue parallax, rain-window, aquarium, road-atlas, and FORGE control containers. Do not replace or duplicate renderer controls just to match the shell.

The scene must continue rendering while its overlay is open. Inputs should update renderer state directly on `input`, and range controls need an adjacent readable value.
