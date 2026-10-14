/* =========================================================
   sw.js — v5
   Network-first HTML & JS, cache-first asset statis
   ========================================================= */

const CACHE = 'manajemenx-v5';
const DEBUG = true;

/* Pre-cache hanya inti — modul lain on-demand */
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/app.js',
  '/core.js',
];

function log(...args) { if (DEBUG) console.log('[SW]', ...args); }

function isGoogleAPI(url) {
  return (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('googleapis.com')
  );
}
function isHTML(request, url) {
  return (
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  );
}
const isJS = (url) => url.pathname.endsWith('.js');
const isStatic = (url) => /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|css)$/i.test(url.pathname);

self.addEventListener('install', (event) => {
  log('Installing v5...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      log('Pre-caching', ASSETS.length, 'assets');
      return cache.addAll(ASSETS).catch((err) => log('⚠️ pre-cache partial fail:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  log('Activating v5...');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        log('Existing caches:', keys);
        return Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => {
            log('Deleting old cache:', k);
            return caches.delete(k);
          })
        );
      })
      .then(() => self.clients.claim())
      .then(() => log('✅ Activated & claimed clients'))
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') { log('SKIP_WAITING'); self.skipWaiting(); }
  if (data.type === 'CLEAR_CACHE') {
    log('CLEAR_CACHE');
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => event.source?.postMessage({ type: 'CACHE_CLEARED' }));
  }
  if (data.type === 'PING') {
    event.source?.postMessage({ type: 'PONG', version: CACHE });
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (isGoogleAPI(url)) return;
  if (url.origin !== self.location.origin && !isStatic(url)) return;

  /* HTML & JS → Network-first */
  if (isHTML(request, url) || isJS(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200 && url.origin === self.location.origin) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          log('🌐', url.pathname, res.status);
          return res;
        })
        .catch(() => {
          log('🔌 offline fallback:', url.pathname);
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (isHTML(request, url)) return caches.match('/index.html');
          });
        })
    );
    return;
  }

  /* Asset statis → Cache-first */
  if (isStatic(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) { log('📦', url.pathname); return cached; }
        return fetch(request).then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          log('🌐 static', url.pathname, res.status);
          return res;
        });
      })
    );
    return;
  }

  /* Lainnya → Network with cache fallback */
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
