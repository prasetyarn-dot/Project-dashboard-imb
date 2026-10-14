/* =========================================================
   mod-inventory.js
   Sheet: 📦 Inventory
   Kolom: A=Id Barang, B=Masuk/Keluar, C=Nama Barang, D=UoM, E=Qty,
          F=Kategori, G=Tanggal, H=Referensi, I=Catatan
   ========================================================= */
const InventoryModule = (() => {
  const ARAH = ['Masuk', 'Keluar'];
  const KATEGORI = ['Bahan Baku', 'WIP', 'Barang Jadi', 'Kemasan', 'Consumable'];
  const UOM = ['pcs','box','kg','gram','liter','meter','unit','set','roll','lusin'];

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  async function render(view) {
    const [barangRows, invRows] = await Promise.all([
      Core.readSheet(Core.SHEETS.MASTER_BARANG),
      Core.readSheet(Core.SHEETS.INVENTORY),
    ]);

    const barangList = barangRows.slice(1).filter((r) => r[0]);
    const data = invRows.slice(1);

    // Hitung stok per barang (Masuk - Keluar)
    const stok = {};
    data.forEach((r) => {
      const id = r[0] || '';
      const arah = String(r[1] || '').toLowerCase();
      const qty = Core.num(r[4]);
      if (!stok[id]) stok[id] = { nama: r[2] || '', uom: r[3] || '', saldo: 0 };
      stok[id].saldo += arah === 'masuk' ? qty : -qty;
    });

    const stokList = Object.entries(stok);

    view.innerHTML = `
      <div class="grid grid-2" style="margin-bottom:20px;">
        <div class="card">
          <h3>Input Mutasi Stok</h3>
          <form id="formInv">
            <div class="field">
              <label>Barang</label>
              <select name="idBarang" id="pilihBarang" required>
                <option value="">Pilih barang...</option>
                ${barangList.map((b) => `
                  <option value="${Core.escapeHtml(b[0])}"
                          data-nama="${Core.escapeHtml(b[1])}"
                          data-uom="${Core.escapeHtml(b[2])}">
                    ${Core.escapeHtml(b[0])} - ${Core.escapeHtml(b[1])}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="field">
              <label>Masuk / Keluar</label>
              <select name="arah" required>${opt(ARAH)}</select>
            </div>
            <div class="field">
              <label>Nama Barang</label>
              <input name="nama" id="invNama" required readonly style="background:#f5f7fa;" />
            </div>
            <div class="field">
              <label>UoM</label>
              <input name="uom" id="invUom" readonly style="background:#f5f7fa;" />
            </div>
            <div class="field">
              <label>Qty</label>
              <input type="number" step="any" name="qty" required min="0" />
            </div>
            <div class="field">
              <label>Kategori</label>
              <select name="kategori">${opt(KATEGORI)}</select>
            </div>
            <div class="field">
              <label>Tanggal</label>
              <input type="date" name="tanggal" required value="${Core.today()}" />
            </div>
            <div class="field">
              <label>Referensi</label>
              <input name="referensi" placeholder="mis. PAY-001 / WO-001" />
            </div>
            <div class="field">
              <label>Catatan</label>
              <input name="catatan" />
            </div>
            <button type="submit" class="btn btn-primary btn-block">Simpan Mutasi</button>
          </form>
        </div>

        <div class="card">
          <h3>Stok Saat Ini</h3>
          ${Core.renderTable(stokList.map(([id, v]) => ({
            id, nama: v.nama, uom: v.uom,
            saldo: v.saldo, status: v.saldo <= 0 ? '⚠️ Habis' : '✅',
          })), [
            { key: 'id', label: 'ID' },
            { key: 'nama', label: 'Nama' },
            { key: 'uom', label: 'UoM' },
            { key: 'saldo', label: 'Stok' },
            { key: 'status', label: '' },
          ])}
        </div>
      </div>

      <div class="card">
        <h3>20 Mutasi Terakhir</h3>
        ${Core.renderTable(data.slice(-20).reverse().map((r) => ({
          id: r[0], arah: r[1], nama: r[2], uom: r[3],
          qty: r[4], tgl: String(r[6] || '').slice(0, 10), ref: r[7],
        })), [
          { key: 'tgl', label: 'Tanggal' },
          { key: 'id', label: 'ID' },
          { key: 'nama', label: 'Nama' },
          { key: 'arah', label: 'Arah' },
          { key: 'qty', label: 'Qty' },
          { key: 'uom', label: 'UoM' },
          { key: 'ref', label: 'Referensi' },
        ])}
      </div>
    `;

    // Auto-fill nama + uom saat barang dipilih
    document.getElementById('pilihBarang').addEventListener('change', (e) => {
      const sel = e.target.selectedOptions[0];
      document.getElementById('invNama').value = sel.dataset.nama || '';
      document.getElementById('invUom').value = sel.dataset.uom || '';
    });

    document.getElementById('formInv').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const d = Core.serializeForm(f);
      const btn = f.querySelector('button');
      btn.disabled = true;
      try {
        await Core.appendRow(Core.SHEETS.INVENTORY, [
          d.idBarang, d.arah, d.nama, d.uom, Number(d.qty) || 0,
          d.kategori, d.tanggal, d.referensi || '', d.catatan || '',
        ]);
        Core.toast('✅ Mutasi stok tersimpan');
        await InventoryModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
      } finally { btn.disabled = false; }
    });
  }

  return { render };
})();
