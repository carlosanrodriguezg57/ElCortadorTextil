const CACHE_NAME = "app-cache-v1";

// Archivos estáticos a cachear
const STATIC_ASSETS = [
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/css/styles.css",
  "/js/main.js"
];

// Instalar SW y crear el caché
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activar SW y limpiar cachés viejos
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Intercepción de requests
self.addEventListener("fetch", event => {
  // No interceptar POST ni requests del servidor
  if (event.request.method !== "GET") return;

  // Respuesta del caché o de la red
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // Opcional: devolver fallback si falla totalmente
        })
      );
    })
  );
});
