// ═══════════════════════════════════════════════
//  CORE · UTILS
//  Funciones puras de utilidad, sin estado propio.
// ═══════════════════════════════════════════════

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

function normalizeKey(str) {
  return String(str ?? '').toLowerCase().replace(/[\s_\-\.]/g, '');
}

function findCol(row, candidates) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const norm  = normalizeKey(c);
    const found = keys.find(k => normalizeKey(k) === norm);
    if (found !== undefined) return found;
  }
  return null;
}

function parseXLSX(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(ws, { defval: '' }));
      } catch (err) { reject(err); }
    };
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}

function entryKey(ref, tipo, subtipo, fechaVenc, comentario) {
  return [ref, tipo, subtipo || '', fechaVenc || '', (comentario || '').trim().toLowerCase()].join('|');
}

function formatFechaDisplay(f) {
  if (!f) return '';
  const parts = f.split('-');
  if (parts.length !== 3) return f;
  return `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}`;
}
