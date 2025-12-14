// ============================================================================
// SERVICE WORKER - PPG SORONG PWA
// ============================================================================

const CACHE_NAME = 'ppg-sorong-v1.0.0';
const urlsToCache = [
  '/',
  '/index-quick-login.html',
  '/quick-testing.html',
  '/jamaah.html',
  '/dashboard.html',
  '/css/style.css',
  '/js/config.js',
  '/js/auth.js',
  '/js/sidebar.js',
  '/js/utils.js',
  '/js/quick-testing.js',
  '/js/jamaah.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[ServiceWorker] Install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[ServiceWorker] Activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) &&
      !event.request.url.includes('supabase.co') &&
      !event.request.url.includes('googleapis.com') &&
      !event.request.url.includes('jsdelivr.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log('[ServiceWorker] Found in cache:', event.request.url);
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Fetch from network
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('[ServiceWorker] Fetch failed:', error);
          
          // Return offline page if available
          return caches.match('/offline.html');
        });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-testing-data') {
    event.waitUntil(syncTestingData());
  }
});

// Function to sync offline testing data
async function syncTestingData() {
  try {
    // Get offline data from IndexedDB
    const db = await openIndexedDB();
    const offlineData = await getOfflineData(db);
    
    if (offlineData.length === 0) {
      console.log('[ServiceWorker] No offline data to sync');
      return;
    }
    
    // Send to Supabase
    // This would require Supabase client in service worker
    console.log('[ServiceWorker] Syncing', offlineData.length, 'records');
    
    // Clear synced data
    await clearOfflineData(db);
    
    // Notify client
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          count: offlineData.length
        });
      });
    });
    
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// IndexedDB helpers (placeholder)
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PPGSorong', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getOfflineData(db) {
  // Implementation needed
  return Promise.resolve([]);
}

function clearOfflineData(db) {
  // Implementation needed
  return Promise.resolve();
}

console.log('[ServiceWorker] Loaded');
