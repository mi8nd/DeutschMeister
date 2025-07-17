const CACHE_NAME = 'DeutschMeister-v2'; // A new version to force update
const CORE_ASSETS = [
    '/',
    'index.html',
    'style.css',
    'app.js',
    'auth.js',
    'firebase.js',
    'quiz.js',
    'youtube.js',
    'icon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,1,0'
];

// On install, cache the core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching core assets');
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting();
});

// On activate, clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// On fetch, apply the correct caching strategy
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // STRATEGY 1: Network Only for APIs.
    // If the request is for an external API (Google, Firebase), always go to the network.
    // This is the definitive fix for the 403 error.
    if (requestUrl.hostname !== self.location.hostname) {
        event.respondWith(fetch(event.request));
        return;
    }

    // STRATEGY 2: Stale-While-Revalidate for core assets.
    // This makes the app load instantly from cache, then updates in the background.
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(event.request).then((cachedResponse) => {
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });

                // Return the cached response immediately if available, otherwise wait for the network
                return cachedResponse || fetchPromise;
            });
        })
    );
});
