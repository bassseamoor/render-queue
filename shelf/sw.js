/* sw.js — THE DOCK shelf service worker (seq 868, piece 3).
 *
 * Detach mechanism: units installed by shelf.html live in Cache
 * Storage under <scope>installed/<unit-id>/<path>. This worker
 * answers every same-origin request under that prefix FROM THE
 * CACHE ONLY. It never falls through to the network for an
 * installed-path request: a missing file is a plain 404, so an
 * installed unit can never quietly depend on the dock, the server,
 * or a connection after delivery.
 */
'use strict';

var CACHE = 'moor-installed-v1';

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (event) {
  var url;
  try { url = new URL(event.request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  var scopePath = new URL(self.registration.scope).pathname;
  /* The browser's automatic favicon probe is not a unit dependency;
     answer it here (empty icon) so it never touches the network. */
  if (url.pathname === scopePath + 'favicon.ico') {
    event.respondWith(new Response(null, { status: 204 }));
    return;
  }
  if (url.pathname.indexOf(scopePath + 'installed/') !== 0) return;
  event.respondWith((async function () {
    var cache = await caches.open(CACHE);
    /* ignoreSearch: a unit's own seed/query links (?seed=…, ?p=…)
       still resolve to its installed files. */
    var hit = await cache.match(event.request, { ignoreSearch: true });
    if (hit) return hit;
    return new Response(
      'This thing is not on your shelf (it was never installed here, or the shelf was cleared).',
      { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
