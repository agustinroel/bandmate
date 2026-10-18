const CACHE_NAME = 'bandmate-stage-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/brand/transparent-gold.png',
  '/assets/brand/avatar-fallback.svg',
  '/assets/brand/favicon/web-app-manifest-192x192.png',
  '/assets/brand/favicon/web-app-manifest-512x512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Network-first with offline cache fallback for rehearsal rooms & stages without signal
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (
          res &&
          res.status === 200 &&
          (url.origin === self.location.origin ||
            url.pathname.includes('/songs') ||
            url.pathname.includes('/library') ||
            url.pathname.includes('/setlists'))
        ) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') {
          const shell = await caches.match('/index.html');
          if (shell) return shell;
        }
        throw new Error('Offline and not in cache');
      })
  );
});

// Native Web Push Notification handler
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Bandmate 🎸',
    body: 'Tienes una nueva notificación en tu comunidad musical.',
    icon: '/assets/brand/favicon/web-app-manifest-192x192.png',
    badge: '/assets/brand/favicon/favicon-96x96.png',
    data: { url: '/community' },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        title: parsed.title || payload.title,
        body: parsed.message || parsed.body || payload.body,
        icon: parsed.icon || payload.icon,
        badge: payload.badge,
        data: parsed.data || parsed,
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      vibrate: [120, 60, 120],
      data: payload.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notifData = event.notification.data || {};
  let targetUrl = '/community';

  if (notifData.type === 'band_invite' || notifData.type === 'band_joined' || notifData.type === 'band_song') {
    targetUrl = notifData.data?.bandId ? `/bands/${notifData.data.bandId}` : '/bands';
  } else if (notifData.type === 'follow' && notifData.data?.followerUsername) {
    targetUrl = `/u/${notifData.data.followerUsername}`;
  } else if (notifData.type === 'rating' && notifData.data?.songId) {
    targetUrl = `/songs/${notifData.data.songId}`;
  } else if (notifData.url) {
    targetUrl = notifData.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
