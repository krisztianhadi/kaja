/* Kaja service worker - minimal installable-shell caching.
 * Static assets are cached for speed; API calls and navigations always hit
 * the network (the app is a logbook, offline recording is out of scope).
 * Bump CACHE when the app shell changes so old HTML/CSS is purged.
 */
const CACHE = "kaja-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.pathname === "/sw.js" || url.pathname === "/manifest.webmanifest") return;

  // navigations: always hit the network so a deploy's new HTML/CSS is
  // picked up immediately - cache-first here is what served a stale shell
  // (old hashed CSS) after deploys
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.open(CACHE).then((cache) => cache.match(req).then((r) => r ?? Response.error()))
        )
    );
    return;
  }

  // static assets: cache-first, refreshed from the network on miss
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return cached ?? Response.error();
      }
    })
  );
});
