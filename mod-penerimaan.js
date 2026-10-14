/* =========================================================
   mod-penerimaan.js — Penerimaan Uang (Form + Tabel)
   Kolom sheet:
   A=Jenis Penerimaan, B=Id Penerimaan, C=Tanggal Terima,
   D=Diterima Dari, E=Jenis, F=Metode Terima, G=Tujuan Kas,
   H=Total Diterima, I=Sisa Piutang, J=Bukti Transfer,
   K=Terbitkan Faktur, L=Terbitkan Invoice, M=Status, N=Catatan
   ========================================================= */
const PenerimaanModule = (() => {

  const JENIS = ['Penjualan', 'Pelunasan Piutang', 'Pendapatan Lain', 'Setoran Modal'];
  const METODE = ['Cash', 'Transfer Bank', 'E-Wallet', 'Cek', 'Giro'];
  const STATUS = ['Draft', 'Posted', 'Cancelled'];
  const YA_TIDAK = ['Ya', 'Tidak'];

  let cacheAkun = [];

  async function loadAkun() {
    if (cacheAkun.length) return cacheAkun;
    const rows = await Core.readSheet(Core.SHEETS.MASTER_AKUN);
    cacheAkun = rows.slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => `${r[0]} - ${r[1]}`);
    return cacheAkun;
  }

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  async function render(view) {
    view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat penerimaan...</div>`;

    const [akunList, rows] = await Promise.all([
      loadAkun(),
      Core.readSheet(Core.SHEETS.PENERIMAAN),
    ]);
    const data = rows.slice(1).slice(-20).reverse();
    const totalAll = rows.slice(1).reduce((s, r) => s + Core.num(r[7]), 0);

    view.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        <div class="kpi green">
          <div class="label">Total Penerimaan</div>
          <div class="value">${Core.rupiah(totalAll)}</div>
        </div>
        <div class="kpi blue">
          <div class="label">Jumlah Transaksi</div>
          <div class="value">${rows.length - 1}</div>
        </div>
        <div class="kpi">
          <div class="label">20 Terakhir</div>
          <div class="value" style="font-size:14px;">ditampilkan di bawah</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <h3>Input Penerimaan Uang</h3>
        <form id="formPenerimaan">
          <div class="grid grid-2">
            <div class="field">
              <label>Jenis Penerimaan</label>
              <select name="jenisPenerimaan" required>
                <option value="">Pilih...</option>
                ${opt(JENIS)}
              </select>
            </div>
            <div class="field">
              <label>Id Penerimaan</label>
              <input name="id" required placeholder="RCV-001" />
            </div>
            <div class="field">
              <label>Tanggal Terima</label>
              <input type="date" name="tanggal" required value="${Core.today()}" />
            </div>
            <div class="field">
              <label>Diterima Dari</label>
              <input name="dari" required placeholder="Nama customer" />
            </div>
            <div class="field">
              <label>Jenis</label>
              <select name="jenis" required>
                <option value="">Pilih...</option>
                ${opt(JENIS)}
              </select>
            </div>
            <div class="field">
              <label>Metode Terima</label>
              <select name="metode" required>
                <option value="">Pilih...</option>
                ${opt(METODE)}
              </select>
            </div>
            <div class="field">
              <label>Tujuan Kas</label>
              <select name="tujuanKas" required>
                <option value="">Pilih akun...</option>
                ${opt(akunList)}
              </select>
            </div>
            <div class="field">
              <label>Total Diterima</label>
              <input type="number" step="any" name="total" required min="0" />
            </div>
            <div class="field">
              <label>Sisa Piutang</label>
              <input type="number" step="any" name="sisaPiutang" value="0" min="0" />
            </div>
            <div class="field">
              <label>Bukti Transfer (URL)</label>
              <input name="bukti" placeholder="opsional link foto" />
            </div>
            <div class="field">
              <label>Terbitkan Faktur</label>
              <select name="terbitkanFaktur">${opt(YA_TIDAK, 'Tidak')}</select>
            </div>
            <div class="field">
              <label>Terbitkan Invoice</label>
              <select name="terbitkanInvoice">${opt(YA_TIDAK, 'Tidak')}</select>
            </div>
            <div class="field">
              <label>Status</label>
              <select name="status">${opt(STATUS, 'Posted')}</select>
            </div>
            <div class="field">
              <label>Catatan</label>
              <input name="catatan" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Simpan Penerimaan</button>
        </form>
      </div>

      <div class="card">
        <h3>20 Penerimaan Terakhir</h3>
        ${Core.renderTable(data.map((r) => ({
          id: r[1],
          tgl: String(r[2] || '').slice(0, 10),
          dari: r[3],
          jenis: r[4],
          metode: r[5],
          akun: r[6],
          total: Core.rupiah(r[7]),
          sisa: Core.rupiah(r[8]),
          status: r[12],
        })), [
          { key: 'id', label: 'ID' },
          { key: 'tgl', label: 'Tanggal' },
          { key: 'dari', label: 'Dari' },
          { key: 'jenis', label: 'Jenis' },
          { key: 'metode', label: 'Metode' },
          { key: 'akun', label: 'Tujuan Kas' },
          { key: 'total', label: 'Total' },
          { key: 'sisa', label: 'Sisa Piutang' },
          { key: 'status', label: 'Status' },
        ])}
      </div>
    `;

    document.getElementById('formPenerimaan').addEventListener('submit', onSubmit);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    Core.clearErrors(form);

    const d = Core.serializeForm(form);

    // Validasi
    if (!d.id || !d.jenisPenerimaan) {
      Core.toast('⚠️ Lengkapi field wajib');
      return;
    }

    // Urutan HARUS sesuai header sheet (A:N)
    const values = [
      d.jenisPenerimaan,       // A
      d.id,                    // B
      d.tanggal,               // C
      d.dari,                  // D
      d.jenis,                 // E
      d.metode,                // F
      d.tujuanKas,             // G
      Number(d.total) || 0,    // H
      Number(d.sisaPiutang) || 0, // I
      d.bukti || '',           // J
      d.terbitkanFaktur,       // K
      d.terbitkanInvoice,      // L
      d.status,                // M
      d.catatan || '',         // N
    ];

    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      await Core.appendRow(Core.SHEETS.PENERIMAAN, values);
      Core.toast('✅ Penerimaan tersimpan!');
      form.reset();
      form.tanggal.value = Core.today();
      form.status.value = 'Posted';
      // Reload view
      await PenerimaanModule.render(document.getElementById('view'));
    } catch (err) {
      Core.toast('❌ ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Simpan Penerimaan';
    }
  }

  return { render };
})();
