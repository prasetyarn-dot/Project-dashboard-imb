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
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
});
