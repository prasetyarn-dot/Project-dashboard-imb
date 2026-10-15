const PembayaranModule = (() => {
  const JENIS = ['Pembelian Barang','Pembayaran Hutang','Biaya Operasional','Pembelian Aset'];
  const METODE = ['Cash','Transfer Bank','E-Wallet','Cek','Giro'];
  const STATUS = ['Draft','Posted','Cancelled'];

  async function loadAkunOptions() {
    const rows = await Core.readSheet(Core.SHEETS.MASTER_AKUN);
    return rows.slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => `${r[0]} - ${r[1]}`);
  }

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  // FIX: ID otomatis KODE-YYYYMMDD-URUTAN (kolom ID di sheet = index 1)
  async function updateId(form) {
    const idEl = form.querySelector('[name="id"]');
    const kode = Core.KODE_JENIS[form.jenis.value];
    if (!kode) { idEl.value = ''; return ''; }
    idEl.value = 'Membuat ID...';
    try {
      const id = await Core.generateId(kode, Core.SHEETS.PEMBAYARAN, 1);
      idEl.value = id;
      return id;
    } catch (err) {
      idEl.value = '';
      Core.toast('❌ Gagal membuat ID: ' + err.message);
      return '';
    }
  }

  async function render(view) {
    const [akunList, rows] = await Promise.all([
      loadAkunOptions(),
      Core.readSheet(Core.SHEETS.PEMBAYARAN),
    ]);
    const data = rows.slice(1).slice(-10).reverse();

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3>Input Pembayaran</h3>
        <form id="formPembayaran">
          <div class="grid grid-2">
            <div class="field">
              <label>Jenis Pembayaran</label>
              <select name="jenis" required>
                <option value="">Pilih...</option>
                ${opt(JENIS)}
              </select>
            </div>
            <div class="field">
              <label>Id Pembayaran</label>
              <input name="id" required readonly placeholder="Otomatis setelah pilih jenis" />
            </div>
            <div class="field">
              <label>Tanggal Bayar</label>
              <input type="date" name="tanggal" required value="${Core.today()}" />
            </div>
            <div class="field">
              <label>Supplier / Vendor</label>
              <input name="supplier" required />
            </div>
            <div class="field">
              <label>Metode Bayar</label>
              <select name="metode" required>
                <option value="">Pilih...</option>
                ${opt(METODE)}
              </select>
            </div>
            <div class="field">
              <label>Akun Kas</label>
              <select name="akunKas" required>
                <option value="">Pilih...</option>
                ${opt(akunList)}
              </select>
            </div>
            <div class="field">
              <label>Total Bayar</label>
              <input type="number" step="any" name="total" required min="0" />
            </div>
            <div class="field">
              <label>Sisa Hutang</label>
              <input type="number" step="any" name="sisaHutang" value="0" min="0" />
            </div>
            <div class="field">
              <label>Terbitkan Faktur</label>
              <select name="terbitkan">
                <option value="Tidak">Tidak</option>
                <option value="Ya">Ya</option>
              </select>
            </div>
            <div class="field">
              <label>Status</label>
              <select name="status">${opt(STATUS, 'Posted')}</select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Simpan Pembayaran</button>
        </form>
      </div>

      <div class="card">
        <h3>10 Transaksi Terakhir</h3>
        ${Core.renderTable(data.map((r) => ({
          id: r[1], tgl: r[2], supplier: r[3],
          metode: r[4], akun: r[5], total: Core.rupiah(r[6]), status: r[10],
        })), [
          { key: 'id', label: 'ID' },
          { key: 'tgl', label: 'Tanggal' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'metode', label: 'Metode' },
          { key: 'akun', label: 'Akun' },
          { key: 'total', label: 'Total' },
          { key: 'status', label: 'Status' },
        ])}
      </div>
    `;

    const form = document.getElementById('formPembayaran');
    form.addEventListener('submit', onSubmit);
    form.jenis.addEventListener('change', () => updateId(form)); // FIX
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    Core.clearErrors(form);

    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      // FIX: buat ulang ID tepat sebelum simpan supaya urutan tidak kembar
      const newId = await updateId(form);
      if (!newId) { Core.toast('⚠️ Pilih Jenis Pembayaran dulu'); return; }

      const d = Core.serializeForm(form);
      const values = [
        d.jenis, d.id, d.tanggal, d.supplier, d.metode, d.akunKas,
        Number(d.total) || 0, Number(d.sisaHutang) || 0,
        '', d.terbitkan, d.status, '',
      ];

      await Core.appendRow(Core.SHEETS.PEMBAYARAN, values);
      Core.toast('✅ Pembayaran tersimpan! ID: ' + d.id);
      form.reset();
      form.tanggal.value = Core.today();
      await PembayaranModule.render(document.getElementById('view'));
    } catch (err) {
      Core.toast('❌ Gagal: ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Simpan Pembayaran';
    }
  }

  return { render };
})();
