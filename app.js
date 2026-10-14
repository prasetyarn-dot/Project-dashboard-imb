/* =========================================================
   app.js — Router dengan lazy loading modul
   ========================================================= */

const Routes = {
  dashboard:          { title: 'Dashboard',         file: 'mod-dashboard.js',          global: 'DashboardModule' },
  pembayaran:         { title: 'Pembayaran',        file: 'mod-pembayaran.js',         global: 'PembayaranModule' },
  penerimaan:         { title: 'Penerimaan Uang',   file: 'mod-penerimaan.js',         global: 'PenerimaanModule' },
  'pecah-dompet':     { title: 'Pecah Dompet',      file: 'mod-pecah-dompet.js',       global: 'PecahDompetModule' },
  'faktur-pembelian': { title: 'Faktur Pembelian',  file: 'mod-pembelian.js',          global: 'PembelianModule' },
  'faktur-penjualan': { title: 'Faktur Penjualan',  file: 'mod-faktur-penjualan.js',   global: 'FakturPenjualanModule' },
  'purchase-request': { title: 'Purchase Request',  file: 'mod-purchase-request.js',   global: 'PurchaseRequestModule' },
  inventory:          { title: 'Inventory',         file: 'mod-inventory.js',          global: 'InventoryModule' },
  'working-order':    { title: 'Working Order',     file: 'mod-working-order.js',      global: 'WorkingOrderModule' },
  jurnal:             { title: 'Jurnal Umum',       file: 'mod-jurnal.js',             global: 'JurnalModule' },
  kaskecil:           { title: 'Kas Kecil',         file: 'mod-kaskecil.js',           global: 'KasKecilModule' },
  akun:               { title: 'Master Akun',       file: 'mod-akun.js',               global: 'AkunModule' },
  barang:             { title: 'Master Barang',     file: 'mod-barang.js',             global: 'BarangModule' },
  supplier:           { title: 'Master Supplier',   file: 'mod-supplier.js',           global: 'SupplierModule' },
  customer:           { title: 'Master Customer',   file: 'mod-customer.js',           global: 'CustomerModule' },
};

const loadedModules = new Set();
let _renderToken = 0;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (loadedModules.has(src)) return resolve();
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { loadedModules.add(src); return resolve(); }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => { loadedModules.add(src); resolve(); };
    s.onerror = () => reject(new Error('Gagal load ' + src));
    document.body.appendChild(s);
  });
}

function currentRoute() {
  const hash = location.hash.replace('#/', '').trim();
  return Routes[hash] ? hash : 'dashboard';
}

async function render() {
  const token = ++_renderToken;
  const routeName = currentRoute();
  const route = Routes[routeName];
  const view = document.getElementById('view');
  const title = document.getElementById('pageTitle');

  title.textContent = route.title;

  document.querySelectorAll('#nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === routeName);
  });

  view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat...</div>`;

  try {
    if (!loadedModules.has('/' + route.file)) {
      await loadScript('/' + route.file);
    }
    if (token !== _renderToken) return;

    const Module = window[route.global];
    if (!Module || typeof Module.render !== 'function') {
      throw new Error(`Modul "${route.global}" tidak punya render(). Cek ${route.file}`);
    }

    await Module.render(view);
    if (token !== _renderToken) return;

    Core.setOnline(true);
    try { localStorage.setItem('lastRoute', routeName); } catch {}

  } catch (err) {
    if (token !== _renderToken) return;
    console.error(err);
    view.innerHTML = `<div class="card" style="color:var(--danger);">
      ⚠️ Gagal memuat: ${Core.escapeHtml(err.message)}
    </div>`;
    Core.setOnline(false);
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('backdrop');
  const menuBtn = document.getElementById('menuBtn');

  menuBtn?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('show');
  });
  backdrop?.addEventListener('click', () => {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
  });

  document.querySelectorAll('#nav a').forEach((a) => {
    a.addEventListener('click', () => {
      if (window.innerWidth < 900) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      }
    });
  });
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) {
    const last = localStorage.getItem('lastRoute');
    location.hash = '#/' + (last && Routes[last] ? last : 'dashboard');
  }
  initSidebar();
  render();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
