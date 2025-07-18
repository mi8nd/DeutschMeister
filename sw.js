const STATIC_CACHE_NAME = 'DeutschMeister-static-v1';
const DYNAMIC_CACHE_NAME = 'DeutschMeister-dynamic-v1';

// These are the core files that make the app shell work.
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

// On install, pre-cache the core assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('Service Worker: Pre-caching core assets...');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// On activate, clean up old caches.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys
        .filter(key => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});

// On fetch, apply caching strategies.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Ignore all non-GET requests and API calls.
  // This lets the browser handle them directly, preserving headers.
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  // Strategy 2: Network First for the main HTML file.
  // This ensures the user always gets the latest page structure.
  if (request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If successful, clone it and put it in the dynamic cache.
          const copy = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(request.url, copy);
          });
          return response;
        })
        .catch(() => caches.match(request.url)) // Fallback to cache if offline
    );
    return;
  }

  // Strategy 3: Cache First for all other static assets (CSS, JS, Fonts, etc.).
  // This makes the app load instantly.
  event.respondWith(
    caches.match(request).then(cacheRes => {
      return cacheRes || fetch(request).then(fetchRes => {
        // If the asset is not in the cache, fetch it and cache it dynamically.
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(request.url, fetchRes.clone());
          return fetchRes;
        });
      });
    })
  );
});
