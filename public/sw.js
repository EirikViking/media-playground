/* Service Worker Update: Clearing old caches and behaving transparently */
const CACHE_NAME = 'media-playground-v2-cleanup';

self.addEventListener('install', event => {
    // Force this new service worker to become the active one, bypassing the waiting state
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    // Claim any clients immediately, so they start using this new worker
    event.waitUntil(
        caches.keys().then(cacheNames => {
            // Delete all old caches (specifically the 'media-playground-v1' that is stuck)
            return Promise.all(
                cacheNames.map(cacheName => {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// No fetch listener: This ensures the Service Worker acts as a transparent proxy,
// allowing the browser's native networking and caching (controlled by our new _headers)
// to take precedence. This effectively "uncaches" index.html.
