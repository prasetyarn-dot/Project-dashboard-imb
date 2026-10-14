/* =========================================================
   app.js — MINIMAL (debug version)
   ========================================================= */

var Routes = {
  dashboard:          { title: 'Dashboard',         global: 'DashboardModule' },
  pembayaran:         { title: 'Pembayaran',        global: 'PembayaranModule' },
  penerimaan:         { title: 'Penerimaan Uang',   global: 'PenerimaanModule' },
  'pecah-dompet':     { title: 'Pecah Dompet',      global: 'PecahDompetModule' },
  'faktur-pembelian': { title: 'Faktur Pembelian',  global: 'PembelianModule' },
  'faktur-penjualan': { title: 'Faktur Penjualan',  global: 'FakturPenjualanModule' },
  'purchase-request': { title: 'Purchase Request',  global: 'PurchaseRequestModule' },
  inventory:          { title: 'Inventory',         global: 'InventoryModule' },
  'working-order':    { title: 'Working Order',     global: 'WorkingOrderModule' },
  jurnal:             { title: 'Jurnal Umum',       global: 'JurnalModule' },
  kaskecil:           { title: 'Kas Kecil',         global: 'KasKecilModule' },
  akun:               { title: 'Master Akun',       global: 'AkunModule' },
  barang:             { title: 'Master Barang',     global: 'BarangModule' },
  supplier:           { title: 'Master Supplier',   global: 'SupplierModule' },
  customer:           { title: 'Master Customer',   global: 'CustomerModule' },
};

function getRoute() {
  var hash = (location.hash || '').replace('#/', '').trim();
  return Routes[hash] ? hash : 'dashboard';
}

function render() {
  var routeName = getRoute();
  var route = Routes[routeName];
  var view = document.getElementById('view');
  var title = document.getElementById('pageTitle');

  if (!view || !title) return;

  title.textContent = route.title;

  // Update active nav
  var navLinks = document.querySelectorAll('#nav a');
  for (var i = 0; i < navLinks.length; i++) {
    var a = navLinks[i];
    if (a.dataset.route === routeName) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  }

  view.innerHTML = '<div class="loading"><div class="spinner"></div>Memuat...</div>';

  var Module = window[route.global];
  console.log('[app.js] Route:', routeName, '| Global:', route.global, '| Ada?', !!Module);

  if (!Module || typeof Module.render !== 'function') {
    view.innerHTML = '<div class="card" style="color:var(--danger);">⚠️ Modul "' + route.global + '" tidak ada render()</div>';
    return;
  }

  try {
    Module.render(view);
  } catch (e) {
    console.error('[app.js] Render error:', e);
    view.innerHTML = '<div class="card" style="color:var(--danger);">⚠️ Error: ' + (e.message || e) + '</div>';
  }
}

function initSidebar() {
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('backdrop');
  var menuBtn = document.getElementById('menuBtn');

  if (menuBtn) {
    menuBtn.onclick = function() {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    };
  }
  if (backdrop) {
    backdrop.onclick = function() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    };
  }
  var navLinks = document.querySelectorAll('#nav a');
  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].onclick = function() {
      if (window.innerWidth < 900) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      }
    };
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', function() {
  if (!location.hash) location.hash = '#/dashboard';
  initSidebar();
  render();
});
