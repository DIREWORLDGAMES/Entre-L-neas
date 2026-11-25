const CACHE_NAME = "entre-lineas-shell-v7";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/icon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-180.png",
  "/icons/icon-maskable-512.png",
  "/vendor/zxing-browser.min.js"
];

function cacheResponse(event, request, response) {
  if (!response.ok) return;
  const update = caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
  event.waitUntil(update.catch(error => console.error("No se pudo guardar un recurso para uso sin conexión.", error)));
}

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match("/");
        if (!cachedIndex) throw new Error("No se encontró el documento principal para preparar la app.");
        const html = await cachedIndex.text();
        const assets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
          .map(([, path]) => new URL(path, self.location.origin))
          .filter(url => url.origin === self.location.origin && /\.(?:js|css)$/.test(url.pathname))
          .map(url => url.href);
        await cache.addAll([...new Set(assets)]);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error("No se pudo preparar la app para uso sin conexión.", error);
        throw error;
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("entre-lineas-shell-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          cacheResponse(event, request, response);
          return response;
        })
        .catch(async () => (await caches.match(request, { ignoreVary: true })) || (await caches.match("/index.html", { ignoreVary: true })) || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        cacheResponse(event, request, response);
        return response;
      });
    })
  );
});
