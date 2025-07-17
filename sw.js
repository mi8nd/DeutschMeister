const CACHE_NAME = 'DeutschMeister-v1'; // Use a new cache name to ensure old assets are cleared

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

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event: Apply a smarter caching strategy.
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // THIS IS THE DEFINITIVE FIX:
    // If the request is for the YouTube API, do not intercept it.
    // Let the browser handle it directly to preserve all headers.
    if (requestUrl.hostname === 'www.googleapis.com') {
        return;
    }

    // For all other GET requests, use the "Network First, Cache Second" strategy.
    if (event.request.method === 'GET') {
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
    }
});
