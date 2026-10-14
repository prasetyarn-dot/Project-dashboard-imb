/* =========================================================
   mod-working-order.js
   Sheet: 🛠️ Working Order
   Kolom: A=Jenis WO, B=Id, C=Barang Terpakai, D=Ongkos,
          E=Status, F=Deadline, G=Referensi Faktur, H=Catatan
   ========================================================= */
const WorkingOrderModule = (() => {
  const JENIS = ['Produksi', 'Perakitan', 'Custom Order', 'Reparasi'];
  const STATUS = ['Draft', 'In Progress', 'Completed', 'Cancelled'];

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.WORKING_ORDER);
    const data = rows.slice(1).reverse();

    const totalOngkos = data.reduce((s, r) => s + Core.num(r[3]), 0);
    const inProgress = data.filter((r) => r[4] === 'In Progress').length;
    const completed = data.filter((r) => r[4] === 'Completed').length;

    view.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        <div class="kpi blue">
          <div class="label">Total WO</div>
          <div class="value">${data.length}</div>
        </div>
        <div class="kpi orange">
          <div class="label">In Progress</div>
          <div class="value">${inProgress}</div>
        </div>
        <div class="kpi green">
          <div class="label">Completed</div>
          <div class="value">${completed}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <h3>Input Working Order</h3>
        <form id="formWO">
          <div class="grid grid-2">
            <div class="field">
              <label>Jenis WO</label>
              <select name="jenis" required>${opt(JENIS)}</select>
            </div>
            <div class="field">
              <label>Id WO</label>
              <input name="id" required placeholder="WO-20261014-001" />
            </div>
            <div class="field" style="grid-column: 1 / -1;">
              <label>Barang Terpakai (pisah dengan koma)</label>
              <input name="barang" placeholder="mis. BRG-001, BRG-002" />
            </div>
            <div class="field">
              <label>Ongkos Operasional</label>
              <input type="number" step="any" name="ongkos" value="0" min="0" />
            </div>
            <div class="field">
              <label>Status</label>
              <select name="status">${opt(STATUS, 'Draft')}</select>
            </div>
            <div class="field">
              <label>Deadline</label>
              <input type="date" name="deadline" />
            </div>
            <div class="field">
              <label>Referensi Faktur Pembelian</label>
              <input name="ref" placeholder="mis. PB-20261014-001" />
            </div>
            <div class="field" style="grid-column:1/-1;">
              <label>Catatan</label>
              <input name="catatan" />
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Simpan WO</button>
        </form>
      </div>

      <div class="card">
        <h3>Daftar Working Order</h3>
        ${Core.renderTable(data.map((r)
