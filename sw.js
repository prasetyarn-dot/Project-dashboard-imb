/* =========================================================
   sw.js — v4 (network-first untuk HTML, cache-first untuk asset)
   ========================================================= */
const CACHE = 'manajemenx-v5'; // ⚠️ NAIKKAN SETIAP DEPLOY

const ASSETS = [
  '/', '/index.html', '/manifest.json', '/icon.svg',
  '/app.js', '/core.js', '/import.js',
  '/mod-dashboard.js', '/mod-pembayaran.js', '/mod-penerimaan.js',
  '/mod-pecah-dompet.js', '/mod-pembelian.js', '/mod-faktur-penjualan.js',
  '/mod-purchase-request.js', '/mod-inventory.js', '/mod-working-order.js',
  '/mod-jurnal.js', '/mod-kaskecil.js',
  '/mod-akun.js', '/mod-barang.js', '/mod-supplier.js', '/mod-customer.js',
];

/* ---------- Install ---------- */
self.addEventListener('install', (event) => {
  self.skipWaiting(); // langsung aktif
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

/* ---------- Activate ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // kontrol tab aktif sekarang
  );
});

/* ---------- Message: SKIP_WAITING ---------- */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ---------- Fetch strategy ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Lewati request non-GET & API Apps Script
  if (request.method !== 'GET') return;
  if (request.url.includes('script.google.com')) return;
  if (request.url.includes('googleusercontent.com')) return;

  const url = new URL(request.url);
  const isHTML =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html');

  // ✅ HTML & JS: Network-first (selalu coba terbaru dulu)
  if (isHTML || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request)) // fallback cache kalau offline
    );
    return;
  }

  // ✅ Aset statis (icon, gambar, font): Cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
