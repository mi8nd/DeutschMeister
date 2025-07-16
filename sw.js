// The static cache name you requested.
const CACHE_NAME = 'DeutschMeister';

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

// Install event: cache the core assets of the app.
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
    );
    self.skipWaiting();
});

// Activate event: clean up old caches (this is good practice).
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: Apply a smart caching strategy.
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // RULE 1: Forbid caching of non-GET requests or requests to Firebase APIs.
    // This is the fix for your CORS and Storage errors.
    if (event.request.method !== 'GET' || requestUrl.origin.includes('firebase') || requestUrl.origin.includes('googleapis.com')) {
        // Let the browser handle the request normally, do not cache.
        return fetch(event.request);
    }

    // RULE 2: For all other GET requests, use the "Network First, Cache Second" strategy.
    // This ensures users always get the latest version if they are online.
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                // If the network request is successful, cache the new response.
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                // Return the fresh response from the network.
                return networkResponse;
            })
            .catch(() => {
                // If the network fails (user is offline), serve from the cache.
                return caches.match(event.request);
            })
    );
});