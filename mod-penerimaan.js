
const PenerimaanModule = (() => {
  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.PENERIMAAN);
    const data = rows.slice(1).slice(-20).reverse();
    view.innerHTML = `
      <div class="card">
        <h3>Data Penerimaan Uang (20 terakhir)</h3>
        ${Core.renderTable(data.map((r) => ({
          id: r[1], tgl: r[2], dari: r[3],
          total: Core.rupiah(r[7]), sisa: Core.rupiah(r[8]), status: r[12],
        })), [
          { key: 'id', label: 'ID' },
          { key: 'tgl', label: 'Tanggal' },
          { key: 'dari', label: 'Dari' },
          { key: 'total', label: 'Total' },
          { key: 'sisa', label: 'Sisa Piutang' },
          { key: 'status', label: 'Status' },
        ])}
      </div>
      <p style="margin-top:16px;color:var(--muted);font-size:13px;">
        ℹ️ Form input penerimaan menyusul — pola sama dengan Pembayaran.
      </p>
    `;
  }
  return { render };
})();
