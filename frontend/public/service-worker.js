const CACHE_NAME = 'scholarmart-cache-v5';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/style.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/marketplace.js',
    '/js/dashboards.js',
    '/js/toast.js',
    '/manifest.json',
    '/uploads/products/placeholder.webp'
];

// Service Worker installation and resource pre-caching
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Pre-caching Core Assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activation and Cache Cleanup of outdated versions
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing Old Cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Network-First with Cache Fallback Fetch Interceptor
self.addEventListener('fetch', event => {
    // Only intercept local HTTP/S requests, ignore browser extension schemes
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip API routes so that database requests are always live
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If it is a successful response, clone and cache it
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // If request fails (offline), check cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // If page navigation request fails and isn't cached, return offline.html
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});
