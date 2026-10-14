/* =========================================================
   mod-kaskecil.js — Kas Kecil
   Sheet: 💵 Kas Kecil
   Kolom: A=Tanggal, B=Id, C=Jenis(Masuk/Keluar), D=Keterangan,
          E=Akun Kas, F=Jumlah, G=Saldo, H=Penanggung Jawab,
          I=Bukti, J=Status
   ========================================================= */
const KasKecilModule = (() => {

  const SHEET_KAS = '💵 Kas Kecil';
  const JENIS = ['Masuk', 'Keluar'];
  const STATUS = ['Draft', 'Posted', 'Cancelled'];

  let cacheAkun = [];

  async function loadAkun() {
    if (cacheAkun.length) return cacheAkun;
    const rows = await Core.readSheet(Core.SHEETS.MASTER_AKUN);
    cacheAkun = rows.slice(1)
      .filter((r) => r[0] && r[1] && /kas|bank/i.test(r[1]))
      .map((r) => `${r[0]} - ${r[1]}`);
    return cacheAkun;
  }

  async function loadKas() {
    try {
      const rows = await Core.readSheet(SHEET_KAS);
      return rows.slice(1).filter((r) => r[0] || r[1]);
    } catch {
      return [];
    }
  }

  function opt(list, sel) {
    return list.map((v) =>
      `<option value="${Core.escapeHtml(v)}"${v === sel ? ' selected' : ''}>${Core.escapeHtml(v)}</option>`
    ).join('');
  }

  /* ---------- Hitung saldo per akun ---------- */
  function computeSaldo(data, akunFilter) {
    const filtered = akunFilter
      ? data.filter((r) => r[4] === akunFilter)
      : data;

    let saldo = 0;
    const timeline = filtered.map((r) => {
      const jenis = String(r[2] || '').toLowerCase();
      const jumlah = Core.num(r[5]);
      saldo += jenis === 'masuk' ? jumlah : -jumlah;
      return {
        tgl: String(r[0] || '').slice(0, 10),
        id: r[1],
        jenis: r[2],
        keterangan: r[3],
        akun: r[4],
        jumlah,
        saldo, // running balance
        pj: r[7],
        status: r[9],
      };
    });
    return { timeline: timeline.reverse(), saldoAkhir: saldo };
  }

  async function render(view) {
    view.innerHTML = `<div class="loading"><div class="spinner"></div>Memuat kas kecil...</div>`;
    const [akunList, data] = await Promise.all([loadAkun(), loadKas()]);

    // Ringkasan per akun
    const perAkun = {};
    data.forEach((r) => {
      const akun = r[4] || '(tanpa akun)';
      const jenis = String(r[2] || '').toLowerCase();
      const jml = Core.num(r[5]);
      perAkun[akun] = (perAkun[akun] || 0) + (jenis === 'masuk' ? jml : -jml);
    });
    const ringkasan = Object.entries(perAkun);

    // Saldo akun terpilih (default: pertama)
    const akunTerpilih = akunList[0] || '';
    const { timeline, saldoAkhir } = computeSaldo(data, akunTerpilih);

    view.innerHTML = `
      <div class="grid grid-3" style="margin-bottom:20px;">
        ${ringkasan.map(([akun, saldo]) => `
          <div class="kpi ${saldo >= 0 ? 'green' : 'red'}">
            <div class="label">${Core.escapeHtml(akun)}</div>
            <div class="value">${Core.rupiah(saldo)}</div>
          </div>
        `).join('') || `
          <div class="kpi"><div class="label">Belum ada data kas</div><div class="value">—</div></div>
        `}
      </div>

      <div class="card" style="margin-bottom:20px;">
        <h3>Input Transaksi Kas Kecil</h3>
        <form id="formKas">
          <div class="grid grid-2">
            <div class="field">
              <label>Tanggal</label>
              <input type="date" name="tanggal" required value="${Core.today()}" />
            </div>
            <div class="field">
              <label>Id Transaksi</label>
              <input name="id" required placeholder="KK-001" />
            </div>
            <div class="field">
              <label>Jenis</label>
              <select name="jenis" required>${opt(JENIS)}</select>
            </div>
            <div class="field">
              <label>Akun Kas</label>
              <select name="akun" required>
                <option value="">Pilih akun...</option>
                ${opt(akunList)}
              </select>
            </div>
            <div class="field" style="grid-column:1 / -1;">
              <label>Keterangan</label>
              <input name="keterangan" required placeholder="mis. Beli ATK kantor" />
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
              <label>Bukti (URL)</label>
              <input name="bukti" placeholder="opsional link foto" />
            </div>
            <div class="field">
              <label>Status</label>
              <select name="status">${opt(STATUS, 'Posted')}</select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block">Simpan Transaksi</button>
        </form>
      </div>

      <div class="card">
        <h3>Buku Kas — ${Core.escapeHtml(akunTerpilih || '(semua akun)')}</h3>
        <div style="margin-bottom:10px;">
          <label style="font-size:13px;margin-right:8px;">Filter akun:</label>
          <select id="filterAkun" style="padding:6px 10px;border-radius:6px;border:1px solid var(--border);">
            <option value="">Semua Akun</option>
            ${opt(akunList, akunTerpilih)}
          </select>
          <span style="margin-left:16px;font-size:13px;">
            Saldo akhir: <strong style="color:${saldoAkhir >= 0 ? 'var(--success)' : 'var(--danger)'}">
              ${Core.rupiah(saldoAkhir)}
            </strong>
          </span>
        </div>
        ${Core.renderTable(timeline.map((r) => ({
          tgl: r.tgl,
          id: r.id,
          jenis: r.jenis,
          keterangan: r.keterangan,
          akun: r.akun,
          masuk: r.jenis === 'Masuk' ? Core.rupiah(r.jumlah) : '',
          keluar: r.jenis === 'Keluar' ? Core.rupiah(r.jumlah) : '',
          saldo: Core.rupiah(r.saldo),
          status: r.status,
        })), [
          { key: 'tgl', label: 'Tanggal' },
          { key: 'id', label: 'ID' },
          { key: 'keterangan', label: 'Keterangan' },
          { key: 'akun', label: 'Akun' },
          { key: 'masuk', label: 'Masuk' },
          { key: 'keluar', label: 'Keluar' },
          { key: 'saldo', label: 'Saldo' },
          { key: 'status', label: 'Status' },
        ])}
      </div>
    `;

    document.getElementById('formKas').addEventListener('submit', onSubmit);

    document.getElementById('filterAkun').addEventListener('change', (e) => {
      const akun = e.target.value;
      const { timeline: tl, saldoAkhir: sa } = computeSaldo(data, akun || null);
      // Redraw only table
      const card = e.target.closest('.card');
      const title = card.querySelector('h3');
      title.textContent = `Buku Kas — ${akun || '(semua akun)'}`;
      const statusEl = card.querySelector('strong');
      statusEl.textContent = Core.rupiah(sa);
      statusEl.style.color = sa >= 0 ? 'var(--success)' : 'var(--danger)';

      // Replace table
      const oldTable = card.querySelector('.table-wrap, .card');
      const newHtml = Core.renderTable(tl.map((r) => ({
        tgl: r.tgl, id: r.id, keterangan: r.keterangan, akun: r.akun,
        masuk: r.jenis === 'Masuk' ? Core.rupiah(r.jumlah) : '',
        keluar: r.jenis === 'Keluar' ? Core.rupiah(r.jumlah) : '',
        saldo: Core.rupiah(r.saldo), status: r.status,
      })), [
        { key: 'tgl', label: 'Tanggal' },
        { key: 'id', label: 'ID' },
        { key: 'keterangan', label: 'Keterangan' },
        { key: 'akun', label: 'Akun' },
        { key: 'masuk', label: 'Masuk' },
        { key: 'keluar', label: 'Keluar' },
        { key: 'saldo', label: 'Saldo' },
        { key: 'status', label: 'Status' },
      ]);
      // remove existing table nodes
      card.querySelectorAll('.table-wrap').forEach((n) => n.remove());
      card.querySelectorAll('p').forEach((n) => { if (n.textContent.includes('Belum ada')) n.remove(); });
      card.insertAdjacentHTML('beforeend', newHtml);
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    Core.clearErrors(form);

    const d = Core.serializeForm(form);
    const values = [
      d.tanggal, d.id, d.jenis, d.keterangan, d.akun,
      Number(d.jumlah) || 0,
      0, // Saldo akan dihitung di view; kosongkan di sheet (atau pakai formula)
      d.pj || '', d.bukti || '', d.status,
    ];

    btn.disabled = true; btn.textContent = 'Menyimpan...';
    try {
      await Core.appendRow(SHEET_KAS, values);
      Core.toast('✅ Transaksi kas tersimpan');
      form.reset();
      form.tanggal.value = Core.today();
      await KasKecilModule.render(document.getElementById('view'));
    } catch (err) {
      Core.toast('❌ ' + err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Simpan Transaksi';
    }
  }

  return { render };
})();
