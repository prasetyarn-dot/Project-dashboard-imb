/* =========================================================
   mod-faktur-penjualan.js
   Baca langsung dari sheet Penerimaan (client-side filter)
   ========================================================= */
const FakturPenjualanModule = (() => {
  let state = { all: [], filtered: [], filter: { q: '', dari: '', sampai: '' } };

  async function load() {
    const rows = await Core.readSheet(Core.SHEETS.PENERIMAAN);
    // Kolom: A=Jenis, B=Id, C=Tanggal, D=Dari, E=Jenis, F=Metode,
    //        G=Tujuan Kas, H=Total, I=Sisa, J=Bukti, K=Terbitkan Faktur, ...
    state.all = rows.slice(1)
      .filter((r) => String(r[10] || '').toLowerCase() === 'ya')
      .map((r) => ({
        id: r[1],
        tgl: String(r[2] || '').slice(0, 10),
        customer: r[3],
        total: Core.num(r[7]),
        akun: r[6],
        metode: r[5],
        bukti: r[9] || '',
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
        const hay = `${r.id} ${r.customer} ${r.akun}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }

  async function render(view) {
    view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat...</div>`;
    await load();
    paint(view);
  }

  function paint(view) {
    const total = state.filtered.reduce((s, r) => s + r.total, 0);
    view.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        <div class="kpi blue"><div class="label">Total Faktur</div><div class="value">${state.filtered.length}</div></div>
        <div class="kpi green"><div class="label">Nilai Faktur</div><div class="value">${Core.rupiah(total)}</div></div>
        <div class="kpi"><div class="label">Periode</div><div class="value" style="font-size:14px;">${state.filter.dari || '—'} → ${state.filter.sampai || '—'}</div></div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <h3>Filter</h3>
        <form id="filterForm">
          <div class="grid grid-3">
            <div class="field"><label>Cari</label><input name="q" value="${Core.escapeHtml(state.filter.q)}" placeholder="ID / Customer / Akun" /></div>
            <div class="field"><label>Dari</label><input type="date" name="dari" value="${state.filter.dari}" /></div>
            <div class="field"><label>Sampai</label><input type="date" name="sampai" value="${state.filter.sampai}" /></div>
          </div>
          <div style="display:flex;gap:10px;">
            <button type="submit" class="btn btn-primary">Terapkan</button>
            <button type="button" id="btnReset" class="btn btn-secondary">Reset</button>
            <button type="button" id="btnExport" class="btn btn-secondary" style="margin-left:auto;">⬇️ Export CSV</button>
          </div>
        </form>
      </div>

      <div class="card">
        <h3>Daftar Faktur Penjualan</h3>
        ${Core.renderTable(state.filtered.map((r) => ({
          id: r.id, tgl: r.tgl, customer: r.customer,
          total: Core.rupiah(r.total), akun: r.akun, metode: r.metode,
          bukti: r.bukti ? '🔗' : '—',
        })), [
          { key: 'id', label: 'ID' },
          { key: 'tgl', label: 'Tanggal' },
          { key: 'customer', label: 'Customer' },
          { key: 'total', label: 'Total' },
          { key: 'akun', label: 'Tujuan Kas' },
          { key: 'metode', label: 'Metode' },
          { key: 'bukti', label: 'Bukti' },
        ])}
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
      applyFilter(); paint(view);
    });
    document.getElementById('btnExport').addEventListener('click', () => {
      const header = ['Id', 'Tanggal', 'Customer', 'Total', 'Akun', 'Metode', 'Bukti'];
      const lines = [header.join(',')];
      state.filtered.forEach((r) => {
        lines.push([r.id, r.tgl, r.customer, r.total, r.akun, r.metode, r.bukti]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `faktur-penjualan-${Core.today()}.csv`; a.click();
      URL.revokeObjectURL(url);
    });
  }

  return { render };
})();
