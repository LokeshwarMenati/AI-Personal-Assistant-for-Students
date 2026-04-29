const CACHE_NAME = 'studybuddy-cache-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/oauth-callback.html',
  '/css/styles.css',
  '/css/styles.css?v=11',
  '/js/auth.js',
  '/js/auth.js?v=2',
  '/js/dashboard.js',
  '/js/dashboard.js?v=11',
  '/js/chat.js',
  '/js/chat.js?v=7',
  '/js/oauth-callback.js?v=1',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
