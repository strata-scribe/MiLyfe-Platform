// MiLyfe Service Worker v4
const CACHE_NAME = 'milyfe-v4';
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
];

// Install — precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache, then offline page
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return; // Don't cache API calls

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('', { status: 503 });
        })
      )
  );
});

// ═══════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'MiLyfe', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    image: data.image || undefined,
    tag: data.tag || 'milyfe-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.data?.url || data.url || '/notifications',
      notificationId: data.data?.notificationId,
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MiLyfe', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/notifications';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Could track dismissal analytics here
});

// ═══════════════════════════════════════════════════════════════════
// BACKGROUND SYNC — Process offline queue when reconnected
// ═══════════════════════════════════════════════════════════════════

self.addEventListener('sync', (event) => {
  if (event.tag === 'milyfe-offline-sync') {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  // Open IndexedDB directly (can't use Dexie in SW, use raw IDB)
  const db = await openDB();
  if (!db) return;

  const tx = db.transaction('actions', 'readwrite');
  const store = tx.objectStore('actions');
  const request = store.getAll();

  return new Promise((resolve) => {
    request.onsuccess = async () => {
      const actions = request.result || [];
      let synced = 0;

      for (const action of actions) {
        try {
          if (action.endpoint.startsWith('/api/')) {
            const res = await fetch(action.endpoint, {
              method: action.method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(action.payload),
            });
            if (res.ok) {
              store.delete(action.id);
              synced++;
            }
          }
        } catch {
          // Still offline or failed — leave in queue
        }
      }

      if (synced > 0) {
        // Notify the client that sync completed
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_COMPLETE', synced, remaining: actions.length - synced });
        }
      }

      resolve();
    };
    request.onerror = () => resolve();
  });
}

function openDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open('milyfe-offline', 1);
    request.onerror = () => resolve(null);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Register for periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'milyfe-periodic-sync') {
    event.waitUntil(processOfflineQueue());
  }
});
