const BarangModule = (() => {
  const UOM = ['pcs','box','kg','gram','liter','meter','unit','set','roll','lusin'];
  const KATEGORI = ['Bahan Baku','WIP','Barang Jadi','Kemasan','Consumable'];

  function opt(list, sel) {
    return list.map((v) => `<option${v === sel ? ' selected' : ''}>${v}</option>`).join('');
  }

  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.MASTER_BARANG);
    const data = rows.slice(1);

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3>Tambah Barang</h3>
        <form id="formBarang">
          <div class="grid grid-2">
            <div class="field"><label>Id Barang</label><input name="id" required placeholder="BRG-001" /></div>
            <div class="field"><label>Nama Barang</label><input name="nama" required /></div>
            <div class="field"><label>UoM</label><select name="uom">${opt(UOM)}</select></div>
            <div class="field"><label>Kategori</label><select name="kategori">${opt(KATEGORI)}</select></div>
            <div class="field"><label>Harga Beli</label><input type="number" step="any" name="hargaBeli" value="0" min="0" /></div>
            <div class="field"><label>Harga Jual</label><input type="number" step="any" name="hargaJual" value="0" min="0" /></div>
            <div class="field"><label>Min Stok</label><input type="number" step="any" name="minStok" value="0" min="0" /></div>
            <div class="field"><label>Catatan</label><input name="catatan" /></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Tambah Barang</button>
        </form>
      </div>

      <div class="card">
        <h3>Daftar Barang (${data.length})</h3>
        ${Core.renderTable(data.map((r) => ({
          id: r[0], nama: r[1], uom: r[2], kategori: r[3],
          beli: Core.rupiah(r[4]), jual: Core.rupiah(r[5]), min: r[6],
        })), [
          { key: 'id', label: 'ID' },
          { key: 'nama', label: 'Nama' },
          { key: 'uom', label: 'UoM' },
          { key: 'kategori', label: 'Kategori' },
          { key: 'beli', label: 'Harga Beli' },
          { key: 'jual', label: 'Harga Jual' },
          { key: 'min', label: 'Min Stok' },
        ])}
      </div>
    `;

    document.getElementById('formBarang').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const d = Core.serializeForm(f);
      const btn = f.querySelector('button');
      btn.disabled = true;
      try {
        await Core.appendRow(Core.SHEETS.MASTER_BARANG, [
          d.id, d.nama, d.uom, d.kategori,
          Number(d.hargaBeli) || 0, Number(d.hargaJual) || 0, Number(d.minStok) || 0, d.catatan,
        ]);
        Core.toast('✅ Barang ditambahkan');
        BarangModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
      } finally { btn.disabled = false; }
    });
  }

  return { render };
})();
