const DashboardModule = (() => {

  async function loadData() {
    const [pembayaran, penerimaan, akun, pecah] = await Promise.all([
      Core.readSheet(Core.SHEETS.PEMBAYARAN),
      Core.readSheet(Core.SHEETS.PENERIMAAN),
      Core.readSheet(Core.SHEETS.MASTER_AKUN),
      Core.readSheet(Core.SHEETS.PECAH_DOMPET),
    ]);

    // Skip header row
    const pm = pembayaran.slice(1);
    const pn = penerimaan.slice(1);
    const pc = pecah.slice(1);
    const ak = akun.slice(1);

    const posted = (arr, idx) =>
      arr.filter((r) => String(r[idx] || '').toLowerCase() === 'posted');

    const pmPosted = posted(pm, 10);
    const pnPosted = posted(pn, 12);

    const totalPemasukan = pnPosted.reduce((s, r) => s + Core.num(r[7]), 0);
    const totalPengeluaran = pmPosted.reduce((s, r) => s + Core.num(r[6]), 0);
    const piutang = pn.reduce((s, r) => s + Core.num(r[8]), 0);
    const hutang = pm.reduce((s, r) => s + Core.num(r[7]), 0);

    // Saldo per kas/bank
    const kasList = ak
      .filter((r) => r[1] && /kas|bank/i.test(r[1]))
      .map((r) => {
        const label = `${r[0]} - ${r[1]}`;
        const masuk = pnPosted.filter((x) => x[6] === label).reduce((s, x) => s + Core.num(x[7]), 0);
        const keluar = pmPosted.filter((x) => x[5] === label).reduce((s, x) => s + Core.num(x[6]), 0);
        const tfOut = pc.filter((x) => x[3] === label).reduce((s, x) => s + Core.num(x[5]), 0);
        const tfIn  = pc.filter((x) => x[4] === label).reduce((s, x) => s + Core.num(x[5]), 0);
        return { name: label, saldo: masuk - keluar - tfOut + tfIn };
      });

    return {
      totalPemasukan, totalPengeluaran,
      saldoBersih: totalPemasukan - totalPengeluaran,
      piutang, hutang,
      jumlahTransaksi: pmPosted.length + pnPosted.length,
      kasList,
    };
  }

  async function render(view) {
    const d = await loadData();
    const rp = Core.rupiah;

    const kasRows = d.kasList.map((k) => `
      <tr><td>${Core.escapeHtml(k.name)}</td><td style="text-align:right;">${rp(k.saldo)}</td></tr>
    `).join('');

    view.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        <div class="kpi green"><div class="label">Total Pemasukan</div><div class="value">${rp(d.totalPemasukan)}</div></div>
        <div class="kpi red"><div class="label">Total Pengeluaran</div><div class="value">${rp(d.totalPengeluaran)}</div></div>
        <div class="kpi blue"><div class="label">Saldo Bersih</div><div class="value">${rp(d.saldoBersih)}</div></div>
        <div class="kpi orange"><div class="label">Piutang</div><div class="value">${rp(d.piutang)}</div></div>
        <div class="kpi orange"><div class="label">Hutang</div><div class="value">${rp(d.hutang)}</div></div>
        <div class="kpi"><div class="label">Total Transaksi</div><div class="value">${d.jumlahTransaksi}</div></div>
      </div>

      <div class="card">
        <h3>Saldo Kas & Bank</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Akun</th><th style="text-align:right;">Saldo</th></tr></thead>
            <tbody>${kasRows || '<tr><td colspan="2" style="text-align:center;color:var(--muted);">Belum ada data</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  return { render };
})();
