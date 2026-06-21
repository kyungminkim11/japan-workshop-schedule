const CACHE_NAME = 'workshop-offline-v8';
const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './sumone-theme.css',
  './ux-polish.css',
  './report-projects.css',
  './config.js',
  './app.js',
  './memo-patch.js',
  './state-preservation-patch.js',
  './gift-list-patch.js',
  './media-export-patch.js',
  './comment-request-patch.js',
  './free-post-patch.js',
  './gallery-picker-patch.js',
  './post-group-patch.js',
  './post-single-view-patch.js',
  './timeline-day-filter.js',
  './timeline-multi-download.js',
  './post-swipe-gallery.js',
  './home-quick-composer.js',
  './new-content-alert.js',
  './quick-post-fab.js',
  './ux-polish.js',
  './report-projects.js',
  './kingdom-note-report-patch.js',
  './report-tab.js',
  './report-all-places.js',
  './report-media.js',
  './go.js',
  './site-icon.svg'
];
const CDN_ASSETS = [
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

async function cacheOne(cache, url) {
  try {
    const request = new Request(url, { cache: 'reload', mode: url.startsWith('http') ? 'no-cors' : 'same-origin' });
    const response = await fetch(request);
    if (response) await cache.put(request, response.clone());
  } catch {}
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled([...APP_SHELL, ...CDN_ASSETS].map((url) => cacheOne(cache, url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('workshop-offline-') && name !== CACHE_NAME).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put('./index.html', response.clone()).catch(() => {});
    return response;
  } catch {
    return (await caches.match(request)) || (await caches.match('./index.html')) || (await caches.match('./'));
  }
}

async function assetResponse(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) {
    fetch(request).then(async (response) => {
      if (!response) return;
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone()).catch(() => {});
    }).catch(() => {});
    return cached;
  }
  const response = await fetch(request);
  if (response) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone()).catch(() => {});
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (url.origin === self.location.origin || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(assetResponse(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification?.data?.url || './#timeline';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const existing = list.find((client) => 'focus' in client);
    if (existing) {
      existing.navigate(target);
      return existing.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  }));
});
