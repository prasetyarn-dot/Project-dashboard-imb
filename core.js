/* =========================================================
   core.js — Shared utilities & Google Sheets API client
   ========================================================= */

const Core = (() => {
  // ⚠️ GANTI dengan URL Apps Script Web App kamu (lihat STEP 12)
  const API_URL = 'https://script.google.com/macros/s/AKfycbwKc0WXoGgKWoS8QxvNAn-6jduU2cIVXgYW-sl1RqClQaQA2_264YOiaFezi0Xq72cqdg/exec';

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

  /* ---------- Format helpers ---------- */
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

  /* ---------- Sheets API (via Apps Script) ---------- */
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
      // text/plain menghindari preflight CORS di Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return json.data;
  }

  const readSheet  = (sheet) => apiGet('read',  { sheet });
  const appendRow  = (sheet, values) => apiPost('append', { sheet, values });
  const updateRow  = (sheet, rowIndex, values) => apiPost('update', { sheet, rowIndex, values });
  const deleteRow  = (sheet, rowIndex) => apiPost('delete', { sheet, rowIndex });

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

  /* ---------- Render helpers ---------- */
  function renderTable(rows, columns) {
    if (!rows || rows.length === 0) {
      return `<div class="card" style="text-align:center;color:var(--muted);">
        Belum ada data
      </div>`;
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

  /* ---------- Sheet name constants ---------- */
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
  };

  return {
    toast, rupiah, num, today, escapeHtml,
    apiGet, apiPost, readSheet, appendRow, updateRow, deleteRow,
    setOnline, serializeForm, showError, clearErrors, renderTable,
    SHEETS,
  };
})();
