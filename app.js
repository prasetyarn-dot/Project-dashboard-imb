/* =========================================================
   app.js — Router + init
   ========================================================= */

const Routes = {
  dashboard:           { title: 'Dashboard',          module: () => DashboardModule },
  pembayaran:          { title: 'Pembayaran',         module: () => PembayaranModule },
  penerimaan:          { title: 'Penerimaan Uang',    module: () => PenerimaanModule },
  'pecah-dompet':      { title: 'Pecah Dompet',       module: () => PecahDompetModule },
  'faktur-pembelian':  { title: 'Faktur Pembelian',   module: () => PembelianModule },
  'faktur-penjualan':  { title: 'Faktur Penjualan',   module: () => FakturPenjualanModule },
  'purchase-request':  { title: 'Purchase Request',   module: () => PurchaseRequestModule },
  inventory:           { title: 'Inventory',          module: () => InventoryModule },
  'working-order':     { title: 'Working Order',      module: () => WorkingOrderModule },
  jurnal:              { title: 'Jurnal Umum',        module: () => JurnalModule },
  kaskecil:            { title: 'Kas Kecil',          module: () => KasKecilModule },
  akun:                { title: 'Master Akun',        module: () => AkunModule },
  barang:              { title: 'Master Barang',      module: () => BarangModule },
  supplier:            { title: 'Master Supplier',    module: () => SupplierModule },
  customer:            { title: 'Master Customer',    module: () => CustomerModule },
};

function currentRoute() {
  const hash = location.hash.replace('#/', '').trim();
  return Routes[hash] ? hash : 'dashboard';
}

async function render() {
  const route = currentRoute();
  const view = document.getElementById('view');
  const title = document.getElementById('pageTitle');

  title.textContent = Routes[route].title;

  // Update active nav
  document.querySelectorAll('#nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.route === route);
  });

  view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat...</div>`;

  try {
    const mod = Routes[route].module();
    await mod.render(view);
    Core.setOnline(true);
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="card" style="color:var(--danger);">
      ⚠️ Gagal memuat: ${Core.escapeHtml(err.message)}
    </div>`;
    Core.setOnline(false);
  }
}

/* ---------- Sidebar toggle (mobile) ---------- */
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
}

/* ---------- Boot ---------- */
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
  if (!location.hash) location.hash = '#/dashboard';
  initSidebar();
  render();

  // Register service worker
 /* ---------- Register service worker dengan auto-update ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      // Cek update setiap 30 detik
      setInterval(() => reg.update(), 30000);

      // Kalau ada SW baru menunggu → paksa activate
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            // Ada SW baru, paksa aktif & reload
            newSW.postMessage({ type: 'SKIP_WAITING' });
            setTimeout(() => window.location.reload(), 500);
          }
        });
      });

      // Kalau controller ganti → reload
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

    } catch (e) {
      console.warn('SW registration failed:', e);
    }
  });
}
