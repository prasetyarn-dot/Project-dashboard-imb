/* =========================================================
   core.js — Shared utilities & Google Sheets API client
   ========================================================= */

const Core = (() => {
  // ⚠️ GANTI dengan URL Apps Script Web App kamu
  const API_URL = 'https://script.google.com/macros/library/d/1_Ws5pbO_GneWOXMuYKbljDdf5TDKJyhPIagJZgt9XF_aV2f5g6FSX4jJ/7';

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg, ms = 2500) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  }

  /* ---------- Format ---------- */
  const rupiah = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
    }).format(Number(n) || 0);

  const num = (v) => {
    if (typeof v === 'number') return v;
    if (!v) return 0;
    return Number(String(v).replace(/[^0-9.-]/g, '')) || 0;
  };

  const today = () => new Date().toISOString().slice(0, 10);

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  /* ---------- API ---------- */
  async function apiGet(action, params = {}) {
    const q = new URLSearchParams({ action, ...params });
    const url = `${API_URL}?${q.toString()}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  }

  async function apiPost(action, payload = {}) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  }

  /* ---------- Sheet ops (raw) ---------- */
  async function readSheet(sheet, limit) {
    const params = { sheet };
    if (limit) params.limit = limit;
    return await apiGet('read', params);
  }
  const appendRow = (sheet, values) => apiPost('append', { sheet, values });
  const updateRow = (sheet, rowIndex, values) => apiPost('update', { sheet, rowIndex, values });
  const deleteRow = (sheet, rowIndex) => apiPost('delete', { sheet, rowIndex });

  /* ---------- In-memory cache (15 detik) ---------- */
  const _cache = new Map();
  const _CACHE_TTL = 15000;

  async function readSheetCached(sheet, limit) {
    const now = Date.now();
    const hit = _cache.get(sheet);
    if (hit && now - hit.t < _CACHE_TTL) return hit.v;
    const v = await readSheet(sheet, limit);
    _cache.set(sheet, { t: now, v });
    return v;
  }

  function invalidateCache(sheet) {
    if (sheet) _cache.delete(sheet);
    else _cache.clear();
  }

  /* ---------- Connection status ---------- */
  function setOnline(ok) {
    const dot = document.getElementById('statusDot');
    if (!dot) return;
    dot.classList.toggle('online', ok);
    dot.classList.toggle('offline', !ok);
  }

  /* ---------- Form helpers ---------- */
  function serializeForm(form) {
    const data = {};
    new FormData(form).forEach((v, k) => { data[k] = v; });
    return data;
  }

  function showError(form, fieldName, message) {
    const field = form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    let err = field.parentElement.querySelector('.error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'error';
      field.parentElement.appendChild(err);
    }
    err.textContent = message;
  }

  function clearErrors(form) {
    form.querySelectorAll('.error').forEach((e) => e.remove());
  }

  /* ---------- Table render ---------- */
  function renderTable(rows, columns) {
    if (!rows || rows.length === 0) {
      return `<div class="card" style="text-align:center;color:var(--muted);">Belum ada data</div>`;
    }
    const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
    const body = rows.map((r) =>
      `<tr>${columns.map((c) => `<td>${escapeHtml(r[c.key] ?? '')}</td>`).join('')}</tr>`
    ).join('');
    return `<div class="table-wrap"><table>
      <thead><tr>${head}</tr></thead>
      <tbody>${body}</tbody>
    </table></div>`;
  }

  /* ---------- ID generator ---------- */
  async function generateId(prefix, sheet, colIndex) {
    const today = new Date();
    const ymd = today.getFullYear().toString()
      + String(today.getMonth() + 1).padStart(2, '0')
      + String(today.getDate()).padStart(2, '0');

    const rows = await readSheet(sheet);
    const pattern = new RegExp(`^${prefix}-${ymd}-(\\d+)$`);
    let max = 0;

    rows.slice(1).forEach((r) => {
      const v = String(r[colIndex] || '').trim();
      const m = v.match(pattern);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    });

    return `${prefix}-${ymd}-${String(max + 1).padStart(3, '0')}`;
  }

  const KODE_JENIS = {
    'Pembelian Barang':   'PB',
    'Pembayaran Hutang':  'PH',
    'Biaya Operasional':  'BO',
    'Pembelian Aset':     'PA',
    'Penjualan':          'PJ',
    'Pelunasan Piutang':  'PP',
    'Pendapatan Lain':    'PL',
    'Setoran Modal':      'SM',
    'Pecah Dompet':       'PD',
    'Transfer Internal':  'TI',
    'Setoran ke Bank':    'SB',
    'Penarikan Kas':      'PK',
  };

  /* ---------- Sheet names ---------- */
  const SHEETS = {
    MASTER_AKUN:      '📋 Master Akun',
    MASTER_SUPPLIER:  '📋 Master Supplier',
    MASTER_CUSTOMER:  '📋 Master Customer',
    MASTER_BARANG:    '📋 Master Barang',
    PEMBAYARAN:       '💸 Pembayaran',
    PENERIMAAN:       '💰 Penerimaan Uang',
    PECAH_DOMPET:     '🔄 Pecah Dompet',
    FAKTUR_PEMBELIAN: '🧾 Faktur Pembelian',
    FAKTUR_PENJUALAN: '🧾 Faktur Penjualan',
    PURCHASE_REQUEST: '📝 Purchase Request',
    INVENTORY:        '📦 Inventory',
    WORKING_ORDER:    '🛠️ Working Order',
    DASHBOARD:        '📊 Dashboard',
    JURNAL_UMUM:      '📒 Jurnal Umum',
    KAS_KECIL:        '💵 Kas Kecil',
  };

  return {
    toast, rupiah, num, today, escapeHtml,
    apiGet, apiPost,
    readSheet, readSheetCached, invalidateCache,
    appendRow, updateRow, deleteRow,
    setOnline, serializeForm, showError, clearErrors, renderTable,
    generateId, KODE_JENIS,
    SHEETS,
  };
})();
