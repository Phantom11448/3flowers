// 3FS Service Worker — v1.0
// © 2026 ColdSide Study. All Rights Reserved.
const CACHE_NAME = '3fs-v1';
const ASSETS = [
  './three-flowers.html',
  './manifest.json',
  './logo.jpg'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
// Firebase calls always go to network (real-time game needs live data)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch Firebase and Google APIs from network
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return; // Let browser handle normally
  }

  // For game assets — try network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Cache fresh copy
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(e.request);
      })
  );
});
