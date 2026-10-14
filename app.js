/* =========================================================
   app.js — Router + Lazy Load + Auto-Detect (SAFE VERSION)
   ========================================================= */

const Routes = {
  dashboard:          { title: 'Dashboard',         file: 'mod-dashboard.js',         names: ['DashboardModule', 'Dashboard'] },
  pembayaran:         { title: 'Pembayaran',        file: 'mod-pembayaran.js',        names: ['PembayaranModule', 'Pembayaran'] },
  penerimaan:         { title: 'Penerimaan Uang',   file: 'mod-penerimaan.js',        names: ['PenerimaanModule', 'Penerimaan'] },
  'pecah-dompet':     { title: 'Pecah Dompet',      file: 'mod-pecah-dompet.js',      names: ['PecahDompetModule', 'PecahDompet'] },
  'faktur-pembelian': { title: 'Faktur Pembelian',  file: 'mod-pembelian.js',         names: ['PembelianModule', 'Pembelian'] },
  'faktur-penjualan': { title: 'Faktur Penjualan',  file: 'mod-faktur-penjualan.js',  names: ['FakturPenjualanModule', 'FakturPenjualan'] },
  'purchase-request': { title: 'Purchase Request',  file: 'mod-purchase-request.js',  names: ['PurchaseRequestModule', 'PurchaseRequest'] },
  inventory:          { title: 'Inventory',         file: 'mod-inventory.js',         names: ['InventoryModule', 'Inventory'] },
  'working-order':    { title: 'Working Order',     file: 'mod-working-order.js',     names: ['WorkingOrderModule', 'WorkingOrder'] },
  jurnal:             { title: 'Jurnal Umum',       file: 'mod-jurnal.js',            names: ['JurnalModule', 'Jurnal'] },
  kaskecil:           { title: 'Kas Kecil',         file: 'mod-kaskecil.js',          names: ['KasKecilModule', 'KasKecil'] },
  akun:               { title: 'Master Akun',       file: 'mod-akun.js',              names: ['AkunModule', 'Akun'] },
  barang:             { title: 'Master Barang',     file: 'mod-barang.js',            names: ['BarangModule', 'Barang'] },
  supplier:           { title: 'Master Supplier',   file: 'mod-supplier.js',          names: ['SupplierModule', 'Supplier'] },
  customer:           { title: 'Master Customer',   file: 'mod-customer.js',          names: ['CustomerModule', 'Customer'] },
};

const loadedScripts = new Map(); // src → Promise
let _renderToken = 0;

/* ---------- Load script dengan dedup + timeout ---------- */
function loadScript(src) {
  // Sudah pernah load? Kembalikan promise yang sama
  if (loadedScripts.has(src)) return loadedScripts.get(src);

  const promise = new Promise((resolve, reject) => {
    // Kalau <script> sudah ada di DOM, tunggu load-nya
    const existing = document.querySelector('script[src="' + src + '"]');
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Gagal load ' + src)));
      return;
    }

    const s = document.createElement('script');
    s.src = src;
    s.async = false;               // ⚠️ JANGAN true — bikin urutan kacau
    s.defer = false;

    // Timeout safety (10 detik)
    const timer = setTimeout(() => {
      reject(new Error('Timeout load ' + src));
    }, 10000);

    s.onload = () => {
      clearTimeout(timer);
      s.dataset.loaded = '1';
      resolve();
    };
    s.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Gagal load ' + src));
    };
    document.body.appendChild(s);
  });

  loadedScripts.set(src, promise);
  return promise;
}

/* ---------- Cari modul dari global ---------- */
function findModule(route) {
  // Coba nama yang didaftarkan dulu
  for (const name of route.names) {
    const m = window[name];
    if (m && typeof m.render === 'function') {
      console.log('[app.js] ✅ Modul ditemukan:', name);
      return m;
    }
  }
  // Fallback: global yang punya .render (bukan built-in)
  const skip = new Set(['window','document','location','navigator','console','Core','Routes','loadedScripts']);
  for (const k of Object.keys(window)) {
    if (skip.has(k)) continue;
    try {
      const v = window[k];
      if (v && typeof v === 'object' && typeof v.render === 'function') {
        console.log('[app.js] 🔍 Fallback modul:', k);
        return v;
      }
    } catch(e) {}
  }
  return null;
}

/* ---------- Route ---------- */
function currentRoute() {
  const hash = location.hash.replace('#/', '').trim();
  return Routes[hash] ? hash : 'dashboard';
}

/* ---------- Render ---------- */
async function render() {
  const token = ++_renderToken;
  const routeName = currentRoute();
  const route = Routes[routeName];
  const view = document.getElementById('view');
  const title = document.getElementById('pageTitle');

  title.textContent = route.title;

  document.querySelectorAll('#nav a').forEach(function(a) {
    a.classList.toggle('active', a.dataset.route === routeName);
  });

  view.innerHTML = '<div class="loading"><div class="spinner"></div>Memuat...</div>';

  try {
    // 1. Load script (aman, dedup, tunggu sampai selesai)
    await loadScript('/' + route.file);

    // 2. Cek user masih di halaman ini?
    if (token !== _renderToken) return;

    // 3. Cari modul
    const Module = findModule(route);
    if (!Module || typeof Module.render !== 'function') {
      throw new Error('Modul "' + route.file + '" tidak punya render()');
    }

    // 4. Render
    await Module.render(view);

    if (token !== _renderToken) return;
    Core.setOnline(true);
    try { localStorage.setItem('lastRoute', routeName); } catch(e) {}

  } catch (err) {
    if (token !== _renderToken) return;
    console.error('[app.js] ❌ Error:', err);
    view.innerHTML = '<div class="card" style="color:var(--danger);">⚠️ Gagal memuat: ' + Core.escapeHtml(err.message) + '</div>';
    Core.setOnline(false);
  }
}

/* ---------- Sidebar ---------- */
function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  const menuBtn = document.getElementById('menuBtn');

  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', function() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    });
  }
  document.querySelectorAll('#nav a').forEach(function(a) {
    a.addEventListener('click', function() {
      if (window.innerWidth < 900) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      }
    });
  });
}

/* ---------- Boot ---------- */
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', function() {
  if (!location.hash) {
    let last = 'dashboard';
    try { last = localStorage.getItem('lastRoute') || 'dashboard'; } catch(e) {}
    location.hash = '#/' + (Routes[last] ? last : 'dashboard');
  }
  initSidebar();
  render();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  }
});
