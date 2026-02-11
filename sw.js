
const CACHE_NAME = 'beanlog-v9';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(ASSETS.map(url => cache.add(url)));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Cache-first for heavy dependencies
  if (event.request.url.includes('unpkg.com') || event.request.url.includes('tailwindcss.com')) {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
    return;
  }

  // Network-first for the app logic to ensure updates are seen
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request) || (
        event.request.mode === 'navigate' ? caches.match('./index.html') : null
      );
    })
  );
});
