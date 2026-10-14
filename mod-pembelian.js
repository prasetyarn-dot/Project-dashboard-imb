/* =========================================================
   mod-pembelian.js — Faktur Pembelian (FIXED)
   Baca langsung dari sheet Pembayaran, filter di client
   ========================================================= */
const PembelianModule = (() => {

  let state = {
    all: [],
    filtered: [],
    filter: { q: '', dari: '', sampai: '' },
  };

  /* ---------- Load dari sheet Pembayaran ---------- */
  async function load() {
    const rows = await Core.readSheet(Core.SHEETS.PEMBAYARAN);
    // Kolom: A=Jenis, B=Id, C=Tanggal, D=Supplier, E=Metode,
    //        F=Akun Kas, G=Total, H=Sisa Hutang, I=Bukti,
    //        J=Terbitkan Faktur, K=Status, L=Catatan
    state.all = rows.slice(1)
      .filter((r) => String(r[9] || '').toLowerCase() === 'ya') // Hanya "Terbitkan Faktur" = Ya
      .map((r) => ({
        id: r[1],
        tgl: String(r[2] || '').slice(0, 10),
        supplier: r[3],
        total: Core.num(r[6]),
        akun: r[5],
        metode: r[4],
        bukti: r[8] || '',
      }));
    applyFilter();
  }

  function applyFilter() {
    const { q, dari, sampai } = state.filter;
    const qq = q.trim().toLowerCase();
    state.filtered = state.all.filter((r) => {
      if (dari && r.tgl < dari) return false;
      if (sampai && r.tgl > sampai) return false;
      if (qq) {
        const hay = `${r.id} ${r.supplier} ${r.akun} ${r.metode}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }

  function totals(rows) {
    return rows.reduce((s, r) => s + Core.num(r.total), 0);
  }

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
          id: r.id,
          tgl: r.tgl,
          supplier: r.supplier,
          total: Core.rupiah(r.total),
          akun: r.akun,
          metode: r.metode,
          bukti: r.bukti ? '🔗' : '—',
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
          ℹ️ Faktur muncul dari <strong>Pembayaran</strong> yang kolom
          "Terbitkan Faktur" = <em>Ya</em>.
        </p>
      </div>
    `;

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

  function exportCSV() {
    const header = ['Id Pembayaran', 'Tanggal', 'Supplier', 'Total', 'Akun Kas', 'Metode', 'Bukti'];
    const lines = [header.join(',')];
    state.filtered.forEach((r) => {
      const row = [r.id, r.tgl, r.supplier, r.total, r.akun, r.metode, r.bukti]
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
