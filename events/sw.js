const CACHE_NAME = 'sd-events-offline-v2';
const OFFLINE_PAGE = new URL('./offline.html', self.registration.scope).href;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.add(OFFLINE_PAGE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => Promise.all(
            cacheNames
                .filter((cacheName) => cacheName.startsWith('sd-events-offline-') && cacheName !== CACHE_NAME)
                .map((cacheName) => caches.delete(cacheName))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.mode !== 'navigate') return;

    event.respondWith(
        fetch(event.request).catch(async () => {
            const offlinePage = await caches.match(OFFLINE_PAGE);
            if (offlinePage) return offlinePage;
            return new Response('Offline page is unavailable.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        })
    );
});
