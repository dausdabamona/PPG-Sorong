// Service Worker - PPG Sorong PWA
const CACHE_NAME = 'ppg-sorong-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/generus.html',
    '/jamaah.html',
    '/presensi.html',
    '/pengajian.html',
    '/progress.html',
    '/penilaian.html',
    '/rapor.html',
    '/kurikulum.html',
    '/wilayah.html',
    '/users.html',
    '/pernikahan.html',
    '/css/style.css',
    '/css/mobile-grid.css',
    '/css/mobile-menu.css',
    '/css/pwa-enhanced.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/auth.js',
    '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip API requests (let them go through normally)
    if (event.request.url.includes('supabase.co')) return;
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Clone response for caching
                const responseClone = response.clone();
                
                // Cache successful responses
                if (response.status === 200) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request)
                    .then(cachedResponse => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Background sync for offline submissions
self.addEventListener('sync', event => {
    console.log('[SW] Sync event:', event.tag);
    // Handle background sync here if needed
});

// Push notifications
self.addEventListener('push', event => {
    console.log('[SW] Push received');
    const options = {
        body: event.data ? event.data.text() : 'Ada notifikasi baru',
        icon: '/images/icon-192x192.svg',
        badge: '/images/icon-72x72.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now()
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('PPG Sorong', options)
    );
});

// Notification click
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked');
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/dashboard.html')
    );
});
