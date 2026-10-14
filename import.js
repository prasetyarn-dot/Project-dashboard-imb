/* =========================================================
   import.js — Bulk import JSON / CSV ke sheet
   ========================================================= */

window.ImportUtil = {
  parseCSV(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cells[i]; });
      return obj;
    });
  },

  parseJSON(text) {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [data];
  },

  async bulkAppend(sheet, rows) {
    const res = await Core.apiPost('bulkAppend', { sheet, rows });
    return res;
  },
};
