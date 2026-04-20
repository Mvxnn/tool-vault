// Minimal Service Worker to satisfy PWA installation criteria

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler for PWA support
  // No offline caching implemented yet to avoid data staleness with Blob
  return;
});
