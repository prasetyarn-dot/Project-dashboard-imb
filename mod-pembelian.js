/* =========================================================
   mod-pembelian.js — Faktur Pembelian (derived view)
   ========================================================= */
const PembelianModule = (() => {

  let state = {
    all: [],       // semua baris faktur
    filtered: [],  // hasil filter
    filter: {
      q: '',
      dari: '',
      sampai: '',
    },
  };

  /* ---------- Load dari sheet ---------- */
  async function load() {
    const rows = await Core.readSheet(Core.SHEETS.FAKTUR_PEMBELIAN);
    // Kolom: A=Id, B=Tanggal, C=Supplier, D=Total, E=Akun, F=Metode, G=Bukti
    state.all = rows.slice(1).filter((r) => r[0]); // buang header + baris kosong
    applyFilter();
  }

  /* ---------- Filter lokal ---------- */
  function applyFilter() {
    const { q, dari, sampai } = state.filter;
    const qq = q.trim().toLowerCase();

    state.filtered = state.all.filter((r) => {
      const tgl = String(r[1] || '').slice(0, 10);
      if (dari && tgl < dari) return false;
      if (sampai && tgl > sampai) return false;
      if (qq) {
        const hay = `${r[0]} ${r[2]} ${r[3]} ${r[4]} ${r[5]}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }

  /* ---------- Hitung total ---------- */
  function totals(rows) {
    return rows.reduce((s, r) => s + Core.num(r[3]), 0);
  }

  /* ---------- Render ---------- */
  async function render(view) {
    view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat faktur...</div>`;
    await load();
    paint(view);
  }

  function paint(view) {
    const total = totals(state.filtered);

    view.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        <div class="kpi blue">
          <div class="label">Total Faktur</div>
          <div class="value">${state.filtered.length}</div>
        </div>
        <div class="kpi orange">
          <div class="label">Nilai Faktur</div>
          <div class="value">${Core.rupiah(total)}</div>
        </div>
        <div class="kpi">
          <div class="label">Periode</div>
          <div class="value" style="font-size:14px;">
            ${state.filter.dari || '—'} → ${state.filter.sampai || '—'}
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <h3>Filter</h3>
        <form id="filterForm">
          <div class="grid grid-3">
            <div class="field">
              <label>Cari (ID / Supplier / Akun)</label>
              <input name="q" placeholder="ketik untuk filter..." value="${Core.escapeHtml(state.filter.q)}" />
            </div>
            <div class="field">
              <label>Dari Tanggal</label>
              <input type="date" name="dari" value="${state.filter.dari}" />
            </div>
            <div class="field">
              <label>Sampai Tanggal</label>
              <input type="date" name="sampai" value="${state.filter.sampai}" />
            </div>
          </div>
          <div style="display:flex;gap:10px;">
            <button type="submit" class="btn btn-primary">Terapkan</button>
            <button type="button" id="btnReset" class="btn btn-secondary">Reset</button>
            <button type="button" id="btnExport" class="btn btn-secondary" style="margin-left:auto;">⬇️ Export CSV</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h3>Daftar Faktur Pembelian</h3>
        ${Core.renderTable(state.filtered.map((r) => ({
          id: r[0],
          tgl: String(r[1] || '').slice(0, 10),
          supplier: r[2],
          total: Core.rupiah(r[3]),
          akun: r[4],
          metode: r[5],
          bukti: r[6] ? '🔗' : '—',
        })), [
          { key: 'id', label: 'ID' },
          { key: 'tgl', label: 'Tanggal' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'total', label: 'Total' },
          { key: 'akun', label: 'Akun Kas' },
          { key: 'metode', label: 'Metode' },
          { key: 'bukti', label: 'Bukti' },
        ])}
        <p style="margin-top:12px;color:var(--muted);font-size:12px;">
          ℹ️ Sheet ini otomatis terisi dari sheet <strong>Pembayaran</strong> yang kolom
          "Terbitkan Faktur" = <em>Ya</em>. Input baru dilakukan di modul Pembayaran.
        </p>
      </div>
    `;

    // Events
    document.getElementById('filterForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Core.serializeForm(e.target);
      state.filter = { q: d.q || '', dari: d.dari || '', sampai: d.sampai || '' };
      applyFilter();
      paint(view);
    });

    document.getElementById('btnReset').addEventListener('click', () => {
      state.filter = { q: '', dari: '', sampai: '' };
      applyFilter();
      paint(view);
    });

    document.getElementById('btnExport').addEventListener('click', exportCSV);
  }

  /* ---------- Export CSV ---------- */
  function exportCSV() {
    const header = ['Id Pembayaran', 'Tanggal', 'Supplier', 'Total', 'Akun Kas', 'Metode', 'Bukti'];
    const lines = [header.join(',')];
    state.filtered.forEach((r) => {
      const row = [r[0], r[1], r[2], r[3], r[4], r[5], r[6]]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`);
      lines.push(row.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faktur-pembelian-${Core.today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Core.toast('📥 CSV ter-download');
  }

  return { render };
})();
