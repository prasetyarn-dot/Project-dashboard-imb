/* =========================================================
   mod-pecah-dompet.js — Transfer antar kas / rekening
   Sheet: 🔄 Pecah Dompet
   Kolom: A=Jenis, B=Id, C=Tanggal, D=Sumber Kas, E=Tujuan,
          F=Jumlah, G=PJ, H=Bukti, I=Catatan
   ========================================================= */
const PecahDompetModule = (() => {
  const JENIS = ['Pecah Dompet', 'Transfer Internal', 'Setoran ke Bank', 'Penarikan Kas'];

  let cacheAkun = [];

  async function loadAkun() {
    if (cacheAkun.length) return cacheAkun;
    const rows = await Core.readSheet(Core.SHEETS.MASTER_AKUN);
    cacheAkun = rows.slice(1)
      .filter((r) => r[0] && r[1] && /kas|bank/i.test(r[1]))
      .map((r) => `${r[0]} - ${r[1]}`);
    return cacheAkun;
  }

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  async function render(view) {
    view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat...</div>`;
    const [akunList, rows] = await Promise.all([
      loadAkun(),
      Core.readSheet(Core.SHEETS.PECAH_DOMPET),
    ]);
    const data = rows.slice(1).slice(-15).reverse();

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3>Input Pecah Dompet / Transfer</h3>
        <form id="formPecah">
          <div class="grid grid-2">
            <div class="field">
              <label>Jenis Transfer</label>
              <select name="jenis" id="jenisPecah" required>
                <option value="">Pilih...</option>
                ${opt(JENIS)}
              </select>
            </div>
            <div class="field">
              <label>Id Transfer <small style="color:var(--muted);">(otomatis)</small></label>
              <input name="id" id="idPecah" readonly
                     placeholder="Pilih jenis dulu..."
                     style="background:#f5f7fa;cursor:not-allowed;font-weight:600;" />
            </div>
            <div class="field">
              <label>Tanggal</label>
              <input type="date" name="tanggal" required value="${Core.today()}" />
            </div>
            <div class="field">
              <label>Sumber Kas</label>
              <select name="sumber" required>
                <option value="">Pilih...</option>
                ${opt(akunList)}
              </select>
            </div>
            <div class="field">
              <label>Tujuan Kas / Rekening</label>
              <select name="tujuan" required>
                <option value="">Pilih...</option>
                ${opt(akunList)}
              </select>
            </div>
            <div class="field">
              <label>Jumlah</label>
              <input type="number" step="any" name="jumlah" required min="0" />
            </div>
            <div class="field">
              <label>Penanggung Jawab</label>
              <input name="pj" placeholder="nama" />
            </div>
            <div class="field">
              <label>Bukti Transfer (URL)</label>
              <input name="bukti" placeholder="opsional" />
            </div>
            <div class="field" style="grid-column: 1 / -1;">
              <label>Catatan</label>
              <input name="catatan" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Simpan Transfer</button>
        </form>
      </div>

      <div class="card">
        <h3>15 Transfer Terakhir</h3>
        ${Core.renderTable(data.map((r) => ({
          id: r[1], tgl: String(r[2] || '').slice(0, 10),
          sumber: r[3], tujuan: r[4],
          jumlah: Core.rupiah(r[5]), pj: r[6],
        })), [
          { key: 'id', label: 'ID' },
          { key: 'tgl', label: 'Tanggal' },
          { key: 'sumber', label: 'Dari' },
          { key: 'tujuan', label: 'Ke' },
          { key: 'jumlah', label: 'Jumlah' },
          { key: 'pj', label: 'PJ' },
        ])}
      </div>
    `;

    // Auto-generate ID
    const jenisSel = document.getElementById('jenisPecah');
    const idField = document.getElementById('idPecah');
    jenisSel.addEventListener('change', async () => {
      const jenis = jenisSel.value;
      if (!jenis) { idField.value = ''; return; }
      const prefix = Core.KODE_JENIS[jenis];
      if (!prefix) return;
      idField.placeholder = 'Menghitung...';
      idField.value = '';
      try {
        idField.value = await Core.generateId(prefix, Core.SHEETS.PECAH_DOMPET, 1);
        idField.placeholder = '';
      } catch (e) { Core.toast('❌ ' + e.message); }
    });

    document.getElementById('formPecah').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button[type="submit"]');
      const d = Core.serializeForm(form);

      if (d.sumber === d.tujuan) {
        Core.toast('⚠️ Sumber & tujuan tidak boleh sama');
        return;
      }
      if (!d.id) {
        Core.toast('⚠️ ID belum di-generate, pilih jenis dulu');
        return;
      }

      const values = [
        d.jenis, d.id, d.tanggal, d.sumber, d.tujuan,
        Number(d.jumlah) || 0, d.pj || '', d.bukti || '', d.catatan || '',
      ];

      btn.disabled = true; btn.textContent = 'Menyimpan...';
      try {
        await Core.appendRow(Core.SHEETS.PECAH_DOMPET, values);
        Core.toast('✅ Transfer tersimpan');
        form.reset();
        form.tanggal.value = Core.today();
        idField.value = '';
        idField.placeholder = 'Pilih jenis dulu...';
        await PecahDompetModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
      } finally {
        btn.disabled = false; btn.textContent = 'Simpan Transfer';
      }
    });
  }

  return { render };
})();
