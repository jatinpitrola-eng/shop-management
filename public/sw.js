/* Shop Management by Nexoryos — Service Worker
 * - Precache app shell on install
 * - Runtime cache for static assets & khata reads (stale-while-revalidate)
 * - Background sync queue for offline entries & "I have paid" notifications
 */

const VERSION = 'v1.0.0';
const APP_SHELL_CACHE = `shopm-shell-${VERSION}`;
const RUNTIME_CACHE = `shopm-runtime-${VERSION}`;
const QUEUE_DB = `shopm-queue-${VERSION}`;

const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/nexoryos-logo.svg',
  '/icon-192.png',
  '/icon-512.png',
  'https://z-cdn.chatglm.cn/fullstack/logo.svg'
];

// IndexedDB helper for offline entry queue
function openQueue() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('entries')) {
        db.createObjectStore('entries', { keyPath: 'clientUuid' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== APP_SHELL_CACHE && k !== RUNTIME_CACHE && k !== QUEUE_DB)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Only handle GET for caching
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Skip cross-origin that's not in our allow list
  if (url.origin !== self.location.origin && url.origin !== 'https://z-cdn.chatglm.cn') {
    return;
  }

  // Network-first for navigations (fresh app shell), fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP_SHELL_CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/')))
    );
    return;
  }

  // Stale-while-revalidate for static assets & API reads
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});

// Background sync — flush offline entry queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'flush-entries') {
    event.waitUntil(flushQueue());
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'QUEUE_ENTRY') {
    event.waitUntil(queueEntry(event.data.payload));
  }
  if (event.data && event.data.type === 'FLUSH') {
    event.waitUntil(flushQueue());
  }
});

async function queueEntry(payload) {
  const db = await openQueue();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    tx.objectStore('entries').put(payload);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function flushQueue() {
  const db = await openQueue();
  const all = await new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly');
    const req = tx.objectStore('entries').getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  for (const item of all) {
    try {
      const res = await fetch(item.url, {
        method: item.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(item.headers || {}) },
        body: JSON.stringify(item.body)
      });
      if (res.ok) {
        await new Promise((resolve) => {
          const tx = db.transaction('entries', 'readwrite');
          tx.objectStore('entries').delete(item.clientUuid);
          tx.oncomplete = () => resolve();
        });
      }
    } catch (e) {
      // Will retry next sync
      break;
    }
  }
  // Notify clients of sync count
  const clients = await self.clients.matchAll();
  clients.forEach((c) => c.postMessage({ type: 'SYNC_DONE' }));
}
