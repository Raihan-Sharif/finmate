// FinMate Service Worker
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'finmate-v1.0.0';
const STATIC_CACHE_NAME = 'finmate-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'finmate-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/dashboard/overview',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Add other critical assets
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/rest\/v1\//,
  /^https:\/\/.*\.supabase\.co\/auth\/v1\//,
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /^https:\/\/.*\.supabase\.co\/rest\/v1\/transactions/,
  /^https:\/\/.*\.supabase\.co\/rest\/v1\/budgets/,
  /^https:\/\/.*\.supabase\.co\/rest\/v1\/investments/,
];

// Cache-first patterns (try cache first, fallback to network)
const CACHE_FIRST_PATTERNS = [
  /\.(js|css|woff|woff2|ttf|eot)$/,
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
];

// Maximum age for different types of cached content (in milliseconds)
const CACHE_EXPIRY = {
  static: 24 * 60 * 60 * 1000, // 24 hours
  api: 5 * 60 * 1000, // 5 minutes
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_FILES);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith('finmate-')
            ) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests that are not API calls
  if (url.origin !== location.origin && !isApiCall(request.url)) {
    return;
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isNetworkFirst(request.url)) {
      event.respondWith(networkFirst(request));
    } else if (isCacheFirst(request.url)) {
      event.respondWith(cacheFirst(request));
    } else if (isApiCall(request.url)) {
      event.respondWith(networkFirst(request));
    } else {
      event.respondWith(staleWhileRevalidate(request));
    }
  } else {
    // Non-GET requests (POST, PUT, DELETE) - always try network
    event.respondWith(networkOnly(request));
  }
});

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponse = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(DYNAMIC_CACHE_NAME);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => {
    // Network failed, return cached response if available
    return cachedResponse;
  });
  
  return cachedResponse || networkResponse;
}

// Network-only strategy
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // For POST/PUT/DELETE requests, we might want to store them for later sync
    if (request.method !== 'GET') {
      await storeFailedRequest(request);
    }
    throw error;
  }
}

// Helper functions
function isNetworkFirst(url) {
  return NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

function isCacheFirst(url) {
  return CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url));
}

function isApiCall(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isExpired(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  const age = now.getTime() - responseDate.getTime();
  
  // Determine expiry based on content type
  if (response.url.includes('/rest/v1/')) {
    return age > CACHE_EXPIRY.api;
  } else if (response.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
    return age > CACHE_EXPIRY.images;
  } else {
    return age > CACHE_EXPIRY.static;
  }
}

// Store failed requests for background sync
async function storeFailedRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.clone().text(),
      timestamp: Date.now(),
    };
    
    // Store in IndexedDB for later sync
    const db = await openDB();
    const transaction = db.transaction(['failedRequests'], 'readwrite');
    const store = transaction.objectStore('failedRequests');
    await store.add(requestData);
    
    console.log('SW: Stored failed request for later sync:', request.url);
  } catch (error) {
    console.error('SW: Failed to store request:', error);
  }
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncFailedRequests());
  }
});

async function syncFailedRequests() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['failedRequests'], 'readonly');
    const store = transaction.objectStore('failedRequests');
    const failedRequests = await store.getAll();
    
    for (const requestData of failedRequests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });
        
        if (response.ok) {
          // Remove from storage after successful sync
          const deleteTransaction = db.transaction(['failedRequests'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('failedRequests');
          await deleteStore.delete(requestData.id);
          
          console.log('SW: Successfully synced failed request:', requestData.url);
        }
      } catch (error) {
        console.log('SW: Failed to sync request:', requestData.url, error);
      }
    }
  } catch (error) {
    console.error('SW: Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: 'You have new financial insights!',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: {
      url: '/dashboard',
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/actions/view.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/actions/dismiss.png',
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data.url = data.url || options.data.url;
  }

  event.waitUntil(
    self.registration.showNotification('FinMate', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const url = event.notification.data.url || '/dashboard';

  if (action === 'view' || !action) {
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        // If a client is already open, focus it
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // If no client is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// IndexedDB helper
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinMateDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('failedRequests')) {
        const store = db.createObjectStore('failedRequests', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Cache cleanup on storage pressure
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_CLEANUP') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('finmate-') && 
    name !== STATIC_CACHE_NAME && 
    name !== DYNAMIC_CACHE_NAME
  );
  
  return Promise.all(oldCaches.map(name => caches.delete(name)));
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'budget-check') {
    event.waitUntil(checkBudgetStatus());
  }
});

async function checkBudgetStatus() {
  // This would check budget status and show notifications if needed
  // Implementation depends on your API structure
  try {
    // Placeholder for budget checking logic
    console.log('SW: Checking budget status...');
  } catch (error) {
    console.error('SW: Budget check failed:', error);
  }
}

console.log('SW: Service worker script loaded successfully');