// Cached files are a single verified release. Document URLs and external requests
// are never written to CacheStorage.
const VERSION = "__OFFLINE_VERSION__";
const scope = new URL(self.registration.scope);
const prefix = `sheets-offline:${scope.pathname}:`;
const cacheName = prefix + VERSION;
const manifestURL = new URL("offline-assets.json", scope).href;
async function notify(message) {
  for (const client of await self.clients.matchAll({
    includeUncontrolled: true,
  }))
    if (client.url.startsWith(scope.href))
      client.postMessage({ channel: "sheets-offline", ...message });
}
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const response = await fetch(manifestURL, { cache: "no-store" });
        if (!response.ok) throw new Error("Offline manifest unavailable.");
        const manifest = await response.json();
        if (manifest.version !== VERSION || !manifest.assets?.length)
          throw new Error("Offline release changed; retry the download.");
        const cache = await caches.open(cacheName);
        let next = 0,
          complete = 0;
        await notify({
          type: "progress",
          complete,
          total: manifest.assets.length,
        });
        // Bound downloads so a full install does not overwhelm the connection.
        const downloads = await Promise.allSettled(
          Array.from({ length: 6 }, async () => {
            while (next < manifest.assets.length) {
              const asset = manifest.assets[next++];
              const url = new URL(asset.path, scope);
              if (
                url.origin !== scope.origin ||
                !url.href.startsWith(scope.href) ||
                url.search ||
                url.hash ||
                !asset.integrity?.startsWith("sha256-")
              )
                throw new Error("Invalid offline asset.");
              const result = await fetch(url, {
                cache: "reload",
                integrity: asset.integrity,
              });
              if (!result.ok || result.redirected)
                throw new Error("Offline asset unavailable.");
              await cache.put(url, result);
              complete++;
              if (complete % 5 === 0 || complete === manifest.assets.length)
                await notify({
                  type: "progress",
                  complete,
                  total: manifest.assets.length,
                });
            }
          }),
        );
        const failure = downloads.find(
          (result) => result.status === "rejected",
        );
        if (failure) throw failure.reason;
        // This final entry marks a complete install. Partial caches are never activated.
        await cache.put(
          manifestURL,
          new Response(JSON.stringify(manifest), {
            headers: { "Content-Type": "application/json" },
          }),
        );
      } catch (error) {
        await caches.delete(cacheName);
        await notify({ type: "error" });
        throw error;
      }
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      await Promise.all(
        (await caches.keys())
          .filter((name) => name.startsWith(prefix) && name !== cacheName)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE") event.waitUntil(self.skipWaiting());
  if (event.data?.type === "STATUS")
    event.waitUntil(
      (async () => {
        const ready = Boolean(await caches.match(manifestURL, { cacheName }));
        event.ports[0]?.postMessage({ ready, version: VERSION });
      })(),
    );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== scope.origin ||
    !url.href.startsWith(scope.href)
  )
    return;
  url.search = "";
  url.hash = "";
  if (url.pathname === scope.pathname) url.pathname += "index.html";
  event.respondWith(
    (async () =>
      (await caches.match(url.href, { cacheName })) || fetch(event.request))(),
  );
});
