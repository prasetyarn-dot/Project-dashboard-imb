/* =========================================================
   app.js — Router + lazy-load modul
   ========================================================= */

// Folder tempat file modul berada. Contoh: '/' atau '/modules/'
var MODULE_DIR = '/';

var Routes = {
  dashboard:          { title: 'Dashboard',        global: 'DashboardModule',       file: 'dashboard.js' },
  pembayaran:         { title: 'Pembayaran',       global: 'PembayaranModule',      file: 'pembayaran.js' },
  penerimaan:         { title: 'Penerimaan Uang',  global: 'PenerimaanModule',      file: 'penerimaan.js' },
  'pecah-dompet':     { title: 'Pecah Dompet',     global: 'PecahDompetModule',     file: 'pecah-dompet.js' },
  'faktur-pembelian': { title: 'Faktur Pembelian', global: 'PembelianModule',       file: 'pembelian.js' },
  'faktur-penjualan': { title: 'Faktur Penjualan', global: 'FakturPenjualanModule', file: 'faktur-penjualan.js' },
  'purchase-request': { title: 'Purchase Request', global: 'PurchaseRequestModule', file: 'purchase-request.js' },
  inventory:          { title: 'Inventory',        global: 'InventoryModule',       file: 'inventory.js' },
  'working-order':    { title: 'Working Order',    global: 'WorkingOrderModule',    file: 'working-order.js' },
  jurnal:             { title: 'Jurnal Umum',      global: 'JurnalModule',          file: 'jurnal.js' },
  kaskecil:           { title: 'Kas Kecil',        global: 'KasKecilModule',        file: 'kaskecil.js' },
  akun:               { title: 'Master Akun',      global: 'AkunModule',            file: 'akun.js' },
  barang:             { title: 'Master Barang',    global: 'BarangModule',          file: 'barang.js' },
  supplier:           { title: 'Master Supplier',  global: 'SupplierModule',        file: 'supplier.js' },
  customer:           { title: 'Master Customer',  global: 'CustomerModule',        file: 'customer.js' }
};

var loadedScripts = {};
var renderToken = 0;

function getRoute() {
  var hash = (location.hash || '').replace('#/', '').trim();
  return Routes[hash] ? hash : 'dashboard';
}

// Ambil modul dari scope global (bisa baca var, window.X, maupun const/let)
function getModule(name) {
  if (window[name]) return window[name];
  try { return (0, eval)(name); } catch (e) { return undefined; }
}

function loadScript(src) {
  return new Promise(function (resolve, reject) {
    if (loadedScripts[src]) return resolve();
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { loadedScripts[src] = true; resolve(); };
    s.onerror = function () {
      s.remove();
      reject(new Error('Gagal memuat file: ' + src + ' (cek nama/lokasi file, kemungkinan 404)'));
    };
    document.head.appendChild(s);
  });
}

function showViewError(view, msg) {
  view.innerHTML = '<div class="card" style="color:var(--danger);">⚠️ ' + msg + '</div>';
}

function render() {
  var routeName = getRoute();
  var route = Routes[routeName];
  var view = document.getElementById('view');
  var title = document.getElementById('pageTitle');

  if (!view || !title) return;

  title.textContent = route.title;

  var navLinks = document.querySelectorAll('#nav a');
  for (var i = 0; i < navLinks.length; i++) {
    var a = navLinks[i];
    if (a.dataset.route === routeName) a.classList.add('active');
    else a.classList.remove('active');
  }

  view.innerHTML = '<div class="loading"><div class="spinner"></div>Memuat...</div>';

  var token = ++renderToken;

  loadScript(MODULE_DIR + 'mod-' + route.file).then(function () {
    if (token !== renderToken) return; // user sudah pindah menu

    var Module = getModule(route.global);
    console.log('[app.js] Route:', routeName, '| Global:', route.global, '| Ada?', !!Module);

    if (!Module) {
      showViewError(view, 'File ' + route.file + ' ter-load, tapi "' + route.global + '" tidak ditemukan. Cek nama variabel modul di file itu.');
      return;
    }
    if (typeof Module.render !== 'function') {
      showViewError(view, 'Modul "' + route.global + '" tidak ada render()');
      return;
    }

    try {
      var result = Module.render(view);
      if (result && typeof result.catch === 'function') {
        result.catch(function (e) {
          if (token !== renderToken) return;
          console.error('[app.js] Render error:', e);
          showViewError(view, 'Error: ' + (e.message || e));
        });
      }
    } catch (e) {
      console.error('[app.js] Render error:', e);
      showViewError(view, 'Error: ' + (e.message || e));
    }
  }).catch(function (e) {
    if (token !== renderToken) return;
    showViewError(view, e.message);
  });
}

function initSidebar() {
  var sidebar = document.getElementById('sidebar');
  var backdrop = document.getElementById('backdrop');
  var menuBtn = document.getElementById('menuBtn');

  if (menuBtn) {
    menuBtn.onclick = function () {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('show');
    };
  }
  if (backdrop) {
    backdrop.onclick = function () {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    };
  }
  var navLinks = document.querySelectorAll('#nav a');
  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].onclick = function () {
      if (window.innerWidth < 900) {
        sidebar.classList.remove('open');
        backdrop.classList.remove('show');
      }
    };
  }
}

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', function () {
  if (!location.hash) location.hash = '#/dashboard';
  initSidebar();
  render();
});
