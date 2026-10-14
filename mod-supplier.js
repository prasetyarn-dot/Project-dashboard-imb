/* =========================================================
   mod-supplier.js
   Sheet: 📋 Master Supplier
   Kolom: A=Id, B=Nama, C=Kontak, D=Alamat, E=NPWP, F=Catatan
   ========================================================= */
const SupplierModule = (() => {
  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.MASTER_SUPPLIER);
    const data = rows.slice(1);

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3>Tambah Supplier</h3>
        <form id="formSupplier">
          <div class="grid grid-2">
            <div class="field"><label>Id Supplier</label><input name="id" required placeholder="SUP-001" /></div>
            <div class="field"><label>Nama Supplier</label><input name="nama" required /></div>
            <div class="field"><label>Kontak</label><input name="kontak" placeholder="0812..." /></div>
            <div class="field"><label>NPWP</label><input name="npwp" /></div>
            <div class="field" style="grid-column:1/-1;"><label>Alamat</label><input name="alamat" /></div>
            <div class="field" style="grid-column:1/-1;"><label>Catatan</label><input name="catatan" /></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Tambah Supplier</button>
        </form>
      </div>

      <div class="card">
        <h3>Daftar Supplier (${data.length})</h3>
        ${Core.renderTable(data.map((r) => ({
          id: r[0], nama: r[1], kontak: r[2], alamat: r[3], npwp: r[4],
        })), [
          { key: 'id', label: 'ID' },
          { key: 'nama', label: 'Nama' },
          { key: 'kontak', label: 'Kontak' },
          { key: 'alamat', label: 'Alamat' },
          { key: 'npwp', label: 'NPWP' },
        ])}
      </div>
    `;

    document.getElementById('formSupplier').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const d = Core.serializeForm(f);
      const btn = f.querySelector('button');
      btn.disabled = true;
      try {
        await Core.appendRow(Core.SHEETS.MASTER_SUPPLIER, [
          d.id, d.nama, d.kontak || '', d.alamat || '', d.npwp || '', d.catatan || '',
        ]);
        Core.toast('✅ Supplier ditambahkan');
        await SupplierModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
      } finally { btn.disabled = false; }
    });
  }

  return { render };
})();
