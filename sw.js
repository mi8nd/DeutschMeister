const CACHE_NAME = 'DeutschMeister-v3'; // A new version to force update
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
    const { request } = event;

    // Strategy 1: Network Only for APIs and non-GET requests.
    // This is the definitive fix for the 403 error.
    if (request.url.startsWith('https://www.googleapis.com') || request.method !== 'GET') {
        return;
    }
    
    // Strategy 2: Network First, Cache Second for main HTML page navigation.
    // This ensures the user always gets the latest UI.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseToCache);
                    });
                    return response;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Strategy 3: Stale-While-Revalidate for all other assets (CSS, JS, Fonts, etc.).
    // This makes the app load instantly from cache, then updates in the background.
    event.respondWith(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
                return cachedResponse || fetchPromise;
            });
        })
    );
});
