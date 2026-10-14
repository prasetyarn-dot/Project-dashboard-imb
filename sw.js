const CACHE = 'manajemenx-v1';
const ASSETS = [
  '/', '/index.html', '/manifest.json', '/icon.svg',
  '/app.js', '/core.js', '/import.js',
  '/mod-dashboard.js', '/mod-pembayaran.js', '/mod-penerimaan.js',
  '/mod-pembelian.js', '/mod-barang.js', '/mod-jurnal.js', '/mod-kaskecil.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  // Skip API calls & non-GET
  if (request.method !== 'GET' || request.url.includes('script.google.com')) return;

  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
