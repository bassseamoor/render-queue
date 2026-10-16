# THE SHELF — staged local proof (THE DOCK, slice 1, seq 868, piece 3)

A proof artifact, staged on disk only. Nothing here is published.

## Run it

Serve this folder as-is over local HTTP (a service worker needs
http://localhost or https, not file://), then open the page:

```
cd files/shelf
python3 -m http.server 8765
# open http://localhost:8765/shelf.html
```

## What it does

- **Discover** — the five staged units as cards (name, one-line
  purpose, maker, version, detached / optional-connection status in
  plain words), catalogued from their real `card.json`/`manifest.json`.
- **Pull** — fetches the chosen unit's `.moorpack` from `packages/`
  beside the page (byte-identical copies of the staged packages).
- **Verify** — the PACKAGE-FORMAT.md §5 verifier runs in-page
  (dependency-free JS, SubtleCrypto SHA-256, §3 canonical-JSON
  digest): same check order, same verdict words as
  `files/verify_unit.py`. The verdict shows BEFORE install; a FAIL
  leaves Install unavailable.
- **Install** — the verified files land in Cache Storage on this
  device, under `installed/<unit-id>/…`, and appear in "Your shelf".
- **Detach** — `sw.js` serves installed units from the cache alone.
  An installed copy opens and runs with this page closed and all
  network blocked. The worker never falls through to the network
  for an installed path — a missing file is a 404, not a fetch.

## Honest limits

- Same browser, same origin (host + port), same device. Clearing
  the site's browser data clears the shelf. First delivery of the
  page + worker needs the local server once; detachment is the
  post-delivery claim, exactly as commissioned.
- A unit's own declared optional calls stay optional and fail
  silently offline (Parallax's `rq_token` queue-marking). Wonder
  Feed's social layer is declared, not built — presented as a
  possible future extra, never a live feature.

Full build + proof record: `../../work/notes-c.md`.
