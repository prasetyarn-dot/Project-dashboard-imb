/* =========================================================
   mod-purchase-request.js
   Sheet: 📝 Purchase Request
   Kolom: A=Jenis PR, B=Id, C=Nama Barang, D=UoM, E=Qty, F=Harga,
          G=Priority, H=ETA, I=Deadline, J=Status, K=Catatan
   ========================================================= */
const PurchaseRequestModule = (() => {
  const JENIS = ['Barang', 'Jasa', 'Aset'];
  const UOM = ['pcs','box','kg','gram','liter','meter','unit','set','roll','lusin'];
  const PRIORITY = ['Low', 'Medium', 'High', 'Urgent'];
  const STATUS = ['Draft', 'Approved', 'Ordered', 'Received', 'Cancelled'];

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.PURCHASE_REQUEST);
    const data = rows.slice(1).slice(-20).reverse();

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3>Input Purchase Request</h3>
        <form id="formPR">
          <div class="grid grid-2">
            <div class="field">
              <label>Jenis PR</label>
              <select name="jenis" required>${opt(JENIS)}</select>
            </div>
            <div class="field">
              <label>Id PR</label>
              <input name="id" required placeholder="PR-20261014-001" />
            </div>
            <div class="field" style="grid-column: 1 / -1;">
              <label>Nama Barang</label>
              <input name="nama" required />
            </div>
            <div class="field">
              <label>UoM</label>
              <select name="uom">${opt(UOM)}</select>
            </div>
            <div class="field">
              <label>Qty</label>
              <input type="number" step="any" name="qty" required min="0" />
            </div>
            <div class="field">
              <label>Harga Satuan</label>
              <input type="number" step="any" name="harga" value="0" min="0" />
            </div>
            <div class="field">
              <label>Priority</label>
              <select name="priority">${opt(PRIORITY, 'Medium')}</select>
            </div>
            <div class="field">
              <label>ETA</label>
              <input type="date" name="eta" />
            </div>
            <div class="field">
              <label>Deadline</label>
              <input type="date" name="deadline" />
            </div>
            <div class="field">
              <label>Status</label>
              <select name="status">${opt(STATUS, 'Draft')}</select>
            </div>
            <div class="field" style="grid-column:1/-1;">
              <label>Catatan</label>
              <input name="catatan" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Simpan PR</button>
        </form>
      </div>

      <div class="card">
        <h3>20 PR Terakhir</h3>
        ${Core.renderTable(data.map((r) => ({
          id: r[1], jenis: r[0], barang: r[2],
          qty: `${r[4]} ${r[3]}`, harga: Core.rupiah(r[5]),
          priority: r[6], deadline: r[8], status: r[9],
        })), [
          { key: 'id', label: 'ID' },
          { key: 'jenis', label: 'Jenis' },
          { key: 'barang', label: 'Barang' },
          { key: 'qty', label: 'Qty' },
          { key: 'harga', label: 'Harga' },
          { key: 'priority', label: 'Prioritas' },
          { key: 'deadline', label: 'Deadline' },
          { key: 'status', label: 'Status' },
        ])}
      </div>
    `;

    document.getElementById('formPR').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const d = Core.serializeForm(f);
      const btn = f.querySelector('button');
      btn.disabled = true;
      try {
        await Core.appendRow(Core.SHEETS.PURCHASE_REQUEST, [
          d.jenis, d.id, d.nama, d.uom, Number(d.qty) || 0,
          Number(d.harga) || 0, d.priority, d.eta || '', d.deadline || '',
          d.status, d.catatan || '',
        ]);
        Core.toast('✅ PR tersimpan');
        await PurchaseRequestModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
      } finally { btn.disabled = false; }
    });
  }

  return { render };
})();
