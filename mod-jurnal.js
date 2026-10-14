/* =========================================================
   mod-jurnal.js — Jurnal Umum (double-entry)
   Sheet: 📒 Jurnal Umum
   Kolom: A=Tanggal, B=Id, C=Keterangan, D=Akun, E=Debit,
          F=Kredit, G=Referensi, H=Status
   ========================================================= */
const JurnalModule = (() => {

  const SHEET_JURNAL = '📒 Jurnal Umum';
  const STATUS = ['Draft', 'Posted', 'Cancelled'];

  let cacheAkun = [];

  async function loadAkun() {
    if (cacheAkun.length) return cacheAkun;
    const rows = await Core.readSheet(Core.SHEETS.MASTER_AKUN);
    cacheAkun = rows.slice(1)
      .filter((r) => r[0] && r[1])
      .map((r) => `${r[0]} - ${r[1]}`);
    return cacheAkun;
  }

  async function loadJurnal() {
    try {
      const rows = await Core.readSheet(SHEET_JURNAL);
      return rows.slice(1).filter((r) => r[0] || r[1]);
    } catch {
      return []; // sheet belum ada
    }
  }

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  async function render(view) {
    view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat jurnal...</div>`;
    const [akunList, jurnal] = await Promise.all([loadAkun(), loadJurnal()]);

    // Ringkasan saldo (debit - kredit) per akun
    const saldoMap = {};
    jurnal.forEach((r) => {
      const akun = r[3] || '';
      if (!akun) return;
      const d = Core.num(r[4]);
      const k = Core.num(r[5]);
      saldoMap[akun] = (saldoMap[akun] || 0) + d - k;
    });
    const saldoRows = Object.entries(saldoMap);

    const recent = jurnal.slice(-15).reverse();

    view.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        <div class="kpi blue">
          <div class="label">Total Baris Jurnal</div>
          <div class="value">${jurnal.length}</div>
        </div>
        <div class="kpi green">
          <div class="label">Total Debit</div>
          <div class="value">${Core.rupiah(jurnal.reduce((s, r) => s + Core.num(r[4]), 0))}</div>
        </div>
        <div class="kpi red">
          <div class="label">Total Kredit</div>
          <div class="value">${Core.rupiah(jurnal.reduce((s, r) => s + Core.num(r[5]), 0))}</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px;">
        <h3>Input Jurnal</h3>
        <form id="formJurnal">
          <div class="grid grid-2">
            <div class="field">
              <label>Tanggal</label>
              <input type="date" name="tanggal" required value="${Core.today()}" />
            </div>
            <div class="field">
              <label>Id Jurnal</label>
              <input name="id" required placeholder="JV-001" />
            </div>
            <div class="field" style="grid-column:1 / -1;">
              <label>Keterangan</label>
              <input name="keterangan" required placeholder="mis. Pembelian kertas A4" />
            </div>
            <div class="field">
              <label>Akun</label>
              <select name="akun" required>
                <option value="">Pilih akun...</option>
                ${opt(akunList)}
              </select>
            </div>
            <div class="field">
              <label>Referensi</label>
              <input name="referensi" placeholder="mis. PAY-001" />
            </div>
            <div class="field">
              <label>Debit</label>
              <input type="number" step="any" name="debit" min="0" value="0" />
            </div>
            <div class="field">
              <label>Kredit</label>
              <input type="number" step="any" name="kredit" min="0" value="0" />
            </div>
            <div class="field">
              <label>Status</label>
              <select name="status">${opt(STATUS, 'Posted')}</select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Simpan Jurnal</button>
          <p style="margin-top:10px;color:var(--muted);font-size:12px;">
            ⚠️ Hanya salah satu (Debit atau Kredit) yang boleh > 0 per baris.
          </p>
        </form>
      </div>

      <div class="grid grid-2" style="margin-bottom:20px;">
        <div class="card">
          <h3>Saldo per Akun (Debit − Kredit)</h3>
          ${Core.renderTable(saldoRows.map(([akun, saldo]) => ({
            akun, saldo: Core.rupiah(saldo),
          })), [
            { key: 'akun', label: 'Akun' },
            { key: 'saldo', label: 'Saldo' },
          ])}
        </div>
        <div class="card">
          <h3>15 Baris Terakhir</h3>
          ${Core.renderTable(recent.map((r) => ({
            tgl: String(r[0] || '').slice(0, 10),
            id: r[1],
            keterangan: r[2],
            akun: r[3],
            debit: r[4] ? Core.rupiah(r[4]) : '',
            kredit: r[5] ? Core.rupiah(r[5]) : '',
          })), [
            { key: 'tgl', label: 'Tanggal' },
            { key: 'id', label: 'ID' },
            { key: 'akun', label: 'Akun' },
            { key: 'debit', label: 'Debit' },
            { key: 'kredit', label: 'Kredit' },
          ])}
        </div>
      </div>
    `;

    document.getElementById('formJurnal').addEventListener('submit', onSubmit);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    Core.clearErrors(form);

    const d = Core.serializeForm(form);
    const debit = Number(d.debit) || 0;
    const kredit = Number(d.kredit) || 0;

    // Validasi
    if (debit === 0 && kredit === 0) {
      Core.showError(form, 'debit', 'Isi salah satu: Debit atau Kredit');
      return;
    }
    if (debit > 0 && kredit > 0) {
      Core.showError(form, 'kredit', 'Tidak boleh keduanya terisi');
      return;
    }

    const values = [
      d.tanggal, d.id, d.keterangan, d.akun,
      debit, kredit, d.referensi, d.status,
    ];

    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      await Core.appendRow(SHEET_JURNAL, values);
      Core.toast('✅ Jurnal tersimpan');
      form.reset();
      form.tanggal.value = Core.today();
      await JurnalModule.render(document.getElementById('view'));
    } catch (err) {
      Core.toast('❌ ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Simpan Jurnal';
    }
  }

  return { render };
})();
