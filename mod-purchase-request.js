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

  // Nomor baris sheet = index data + ROW_OFFSET (header di baris 1, data mulai baris 2).
  // Kalau setelah dites update masuk ke baris yang salah, ubah angka ini (mis. jadi 1).
  const ROW_OFFSET = 2;

  let current = [];     // data yang sedang tampil: { r: [...], row: nomorBaris }
  let editingRow = null;

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  // Ubah nilai tanggal dari sheet jadi format yyyy-mm-dd (pakai zona waktu lokal)
  function toInputDate(v) {
    if (!v) return '';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (isNaN(d)) return s.slice(0, 10);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.PURCHASE_REQUEST);
    current = rows.slice(1)
      .map((r, i) => ({ r, row: i + ROW_OFFSET }))
      .slice(-20).reverse();
    editingRow = null;

    const e = Core.escapeHtml;
    const body = current.map((x, i) => `
      <tr>
        <td>${e(x.r[1])}</td>
        <td>${e(x.r[0])}</td>
        <td>${e(x.r[2])}</td>
        <td>${e(x.r[4])} ${e(x.r[3])}</td>
        <td>${e(Core.rupiah(x.r[5]))}</td>
        <td>${e(x.r[6])}</td>
        <td>${e(toInputDate(x.r[8]))}</td>
        <td>${e(x.r[9])}</td>
        <td><button type="button" class="btn btn-secondary" data-edit="${i}" style="padding:6px 12px;">✏️ Edit</button></td>
      </tr>`).join('');

    const tabel = current.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Jenis</th><th>Barang</th><th>Qty</th><th>Harga</th><th>Prioritas</th><th>Deadline</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>${body}</tbody></table></div>`
      : '<div style="text-align:center;color:var(--muted);padding:16px;">Belum ada data</div>';

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3 id="judulForm">Input Purchase Request</h3>
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
          <button type="submit" id="btnSimpan" class="btn btn-primary btn-block">Simpan PR</button>
          <button type="button" id="btnBatal" class="btn btn-secondary btn-block hidden" style="margin-top:8px;">Batal Edit</button>
        </form>
      </div>

      <div class="card" id="cardPR">
        <h3>20 PR Terakhir</h3>
        ${tabel}
      </div>
    `;

    const form = document.getElementById('formPR');
    const btnSimpan = document.getElementById('btnSimpan');
    const btnBatal = document.getElementById('btnBatal');
    const judul = document.getElementById('judulForm');

    function keModeBaru() {
      editingRow = null;
      form.reset();
      form.id.readOnly = false;
      judul.textContent = 'Input Purchase Request';
      btnSimpan.textContent = 'Simpan PR';
      btnBatal.classList.add('hidden');
    }

    function keModeEdit(item) {
      const r = item.r;
      editingRow = item.row;
      form.jenis.value = r[0] || '';
      form.id.value = r[1] || '';
      form.nama.value = r[2] || '';
      form.uom.value = r[3] || '';
      form.qty.value = r[4] ?? '';
      form.harga.value = r[5] ?? 0;
      form.priority.value = r[6] || 'Medium';
      form.eta.value = toInputDate(r[7]);
      form.deadline.value = toInputDate(r[8]);
      form.status.value = r[9] || 'Draft';
      form.catatan.value = r[10] || '';
      form.id.readOnly = true; // ID tidak boleh diubah saat edit
      judul.textContent = 'Edit Purchase Request: ' + r[1];
      btnSimpan.textContent = 'Update PR';
      btnBatal.classList.remove('hidden');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    btnBatal.addEventListener('click', keModeBaru);

    document.getElementById('cardPR').addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-edit]');
      if (!b) return;
      const item = current[Number(b.dataset.edit)];
      if (item) keModeEdit(item);
    });

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const d = Core.serializeForm(form);
      const values = [
        d.jenis, d.id, d.nama, d.uom, Number(d.qty) || 0,
        Number(d.harga) || 0, d.priority, d.eta || '', d.deadline || '',
        d.status, d.catatan || '',
      ];
      const sedangEdit = editingRow !== null;
      btnSimpan.disabled = true;
      btnSimpan.textContent = 'Menyimpan...';
      try {
        if (sedangEdit) {
          await Core.updateRow(Core.SHEETS.PURCHASE_REQUEST, editingRow, values);
        } else {
          await Core.appendRow(Core.SHEETS.PURCHASE_REQUEST, values);
        }
        Core.invalidateCache(Core.SHEETS.PURCHASE_REQUEST);
        Core.toast(sedangEdit ? '✅ PR diupdate' : '✅ PR tersimpan');
        await PurchaseRequestModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
        btnSimpan.disabled = false;
        btnSimpan.textContent = sedangEdit ? 'Update PR' : 'Simpan PR';
      }
    });
  }

  return { render };
})();
