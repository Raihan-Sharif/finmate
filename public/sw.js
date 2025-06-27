// FinMate Service Worker
const CACHE_NAME = "finmate-v1.0.0";
const RUNTIME_CACHE = "finmate-runtime";

// Files to cache during install
const STATIC_CACHE_URLS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/offline",
  // Add critical CSS and JS files here
];

// Routes that should always be fetched from network
const NETWORK_ONLY_URLS = ["/api/", "/auth/", "/_next/webpack-hmr"];

// Routes that should be cached with network-first strategy
const NETWORK_FIRST_URLS = [
  "/dashboard",
  "/transactions",
  "/budget",
  "/investments",
  "/reports",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log("Service Worker: Installation complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Installation failed", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log("Service Worker: Activation complete");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Network-only requests
  if (NETWORK_ONLY_URLS.some((path) => url.pathname.startsWith(path))) {
    return;
  }

  // Network-first strategy for dynamic content
  if (NETWORK_FIRST_URLS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache-first strategy for static assets
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/")
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Stale-while-revalidate for other requests
  event.respondWith(staleWhileRevalidate(request));
});

// Cache-first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Cache-first strategy failed:", error);
    return new Response("Offline", { status: 503 });
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineResponse = await caches.match("/offline");
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response("Offline", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Background sync for offline form submissions
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync", event.tag);

  if (event.tag === "transaction-sync") {
    event.waitUntil(syncTransactions());
  }
});

// Sync offline transactions
async function syncTransactions() {
  try {
    const db = await openDB();
    const transactions = await getOfflineTransactions(db);

    for (const transaction of transactions) {
      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(transaction.data),
        });

        if (response.ok) {
          await deleteOfflineTransaction(db, transaction.id);
          console.log("Synced transaction:", transaction.id);
        }
      } catch (error) {
        console.error("Failed to sync transaction:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// IndexedDB helpers for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("FinMateOffline", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("transactions")) {
        const store = db.createObjectStore("transactions", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

async function getOfflineTransactions(db) {
  const transaction = db.transaction(["transactions"], "readonly");
  const store = transaction.objectStore("transactions");

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function deleteOfflineTransaction(db, id) {
  const transaction = db.transaction(["transactions"], "readwrite");
  const store = transaction.objectStore("transactions");

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Push notifications
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push received");

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-96.png",
    data: data.data,
    actions: data.actions || [
      {
        action: "open",
        title: "Open FinMate",
        icon: "/icons/action-open.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
        icon: "/icons/action-dismiss.png",
      },
    ],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || "finmate-notification",
    renotify: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === "dismiss") {
    return;
  }

  let url = "/dashboard";

  if (data && data.url) {
    url = data.url;
  } else if (action === "open" && data && data.type) {
    switch (data.type) {
      case "budget_alert":
        url = "/budget";
        break;
      case "emi_reminder":
        url = "/loans";
        break;
      case "lending_reminder":
        url = "/lending";
        break;
      default:
        url = "/dashboard";
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Share target handler
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SHARE_TARGET") {
    console.log("Service Worker: Share target received", event.data);

    // Handle shared content
    const { title, text, url } = event.data;

    // Store shared data for the app to retrieve
    event.ports[0].postMessage({
      type: "SHARE_DATA",
      data: { title, text, url },
    });
  }
});

// Periodic background sync (if supported)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "budget-check") {
    event.waitUntil(checkBudgetStatus());
  }
});

async function checkBudgetStatus() {
  try {
    const response = await fetch("/api/budget/status");
    const data = await response.json();

    if (data.nearLimit) {
      self.registration.showNotification("Budget Alert", {
        body: `You've used ${data.percentage}% of your monthly budget`,
        icon: "/icon-192.png",
        tag: "budget-alert",
        data: { type: "budget_alert", url: "/budget" },
      });
    }
  } catch (error) {
    console.error("Budget check failed:", error);
  }
}

// Handle app update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("Service Worker: Script loaded");
