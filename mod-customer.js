/* =========================================================
   mod-customer.js
   Sheet: 📋 Master Customer
   ========================================================= */
const CustomerModule = (() => {
  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.MASTER_CUSTOMER);
    const data = rows.slice(1);

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3>Tambah Customer</h3>
        <form id="formCustomer">
          <div class="grid grid-2">
            <div class="field"><label>Id Customer</label><input name="id" required placeholder="CUS-001" /></div>
            <div class="field"><label>Nama Customer</label><input name="nama" required /></div>
            <div class="field"><label>Kontak</label><input name="kontak" placeholder="0813..." /></div>
            <div class="field"><label>NPWP</label><input name="npwp" /></div>
            <div class="field" style="grid-column:1/-1;"><label>Alamat</label><input name="alamat" /></div>
            <div class="field" style="grid-column:1/-1;"><label>Catatan</label><input name="catatan" /></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Tambah Customer</button>
        </form>
      </div>

      <div class="card">
        <h3>Daftar Customer (${data.length})</h3>
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

    document.getElementById('formCustomer').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const d = Core.serializeForm(f);
      const btn = f.querySelector('button');
      btn.disabled = true;
      try {
        await Core.appendRow(Core.SHEETS.MASTER_CUSTOMER, [
          d.id, d.nama, d.kontak || '', d.alamat || '', d.npwp || '', d.catatan || '',
        ]);
        Core.toast('✅ Customer ditambahkan');
        await CustomerModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
      } finally { btn.disabled = false; }
    });
  }

  return { render };
})();
