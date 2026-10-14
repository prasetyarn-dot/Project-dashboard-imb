/* =========================================================
   mod-akun.js — Master Chart of Accounts
   Sheet: 📋 Master Akun
   Kolom: A=Kode, B=Nama, C=Tipe, D=Saldo Normal, E=Saldo Awal, F=Catatan
   ========================================================= */
const AkunModule = (() => {
  const TIPE = ['Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban'];
  const SALDO = ['Debit', 'Kredit'];

  function opt(list) {
    return list.map((v) => `<option>${v}</option>`).join('');
  }

  async function render(view) {
    const rows = await Core.readSheet(Core.SHEETS.MASTER_AKUN);
    const data = rows.slice(1);

    // Group by tipe
    const grouped = TIPE.map((t) => ({
      tipe: t,
      items: data.filter((r) => r[2] === t),
    }));

    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3>Tambah Akun</h3>
        <form id="formAkun">
          <div class="grid grid-2">
            <div class="field"><label>Kode Akun</label><input name="kode" required placeholder="101" /></div>
            <div class="field"><label>Nama Akun</label><input name="nama" required /></div>
            <div class="field">
              <label>Tipe</label>
              <select name="tipe" required>${opt(TIPE)}</select>
            </div>
            <div class="field">
              <label>Saldo Normal</label>
              <select name="saldo" required>${opt(SALDO)}</select>
            </div>
            <div class="field"><label>Saldo Awal</label><input type="number" step="any" name="saldoAwal" value="0" /></div>
            <div class="field"><label>Catatan</label><input name="catatan" /></div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Tambah Akun</button>
        </form>
      </div>

      <div class="grid grid-2">
        ${grouped.map((g) => `
          <div class="card">
            <h3>${g.tipe} (${g.items.length})</h3>
            ${Core.renderTable(g.items.map((r) => ({
              kode: r[0], nama: r[1], saldo: r[3],
              awal: Core.rupiah(r[4]),
            })), [
              { key: 'kode', label: 'Kode' },
              { key: 'nama', label: 'Nama' },
              { key: 'saldo', label: 'Saldo Normal' },
              { key: 'awal', label: 'Saldo Awal' },
            ])}
          </div>
        `).join('')}
      </div>
    `;

    document.getElementById('formAkun').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const d = Core.serializeForm(f);
      const btn = f.querySelector('button');
      btn.disabled = true;
      try {
        await Core.appendRow(Core.SHEETS.MASTER_AKUN, [
          d.kode, d.nama, d.tipe, d.saldo, Number(d.saldoAwal) || 0, d.catatan || '',
        ]);
        Core.toast('✅ Akun ditambahkan');
        await AkunModule.render(document.getElementById('view'));
      } catch (err) {
        Core.toast('❌ ' + err.message);
      } finally { btn.disabled = false; }
    });
  }

  return { render };
})();
