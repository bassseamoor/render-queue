# MOOR local app storage

MOOR applications are the interface. The SSD is durable backing storage.

## Layout

```
MOOR/
  README.txt
  app-data/
    quick-notes/
      state.json
    trajectory/
      local-checkpoints.json
      canonical-cache.json
```

The layout is intentionally app-owned rather than mimicking every note folder or internal UI state as a raw filesystem tree. That keeps the disk clean while allowing the MOOR application to evolve its own richer organization.

## Storage precedence

1. Canonical repository evidence, where the app has a canonical source.
2. SSD app-data for durable local/user state.
3. Browser storage as cache/fallback.

Quick Notes uses the SSD for durable note/folder state after the owner connects the MOOR root directory.

Trajectory merges canonical repository checkpoints with SSD-backed local/manual checkpoints. Canonical repository history remains append-only and can be cached to the SSD for resilience.

## Permission boundary

Static browser pages use the File System Access API. The browser requires one explicit directory selection and read/write grant. The handle can then be remembered in IndexedDB for subsequent use when the browser allows it.

MOOR must never claim SSD access before that permission exists.
