// ═══════════════════════════════════════════════
//  MODULES · PRODUCT LOOKUP
//  Búsqueda de producto en el catálogo (variables.xlsx)
//  y consulta de stock ficticio (referencia.xlsx).
// ═══════════════════════════════════════════════

function lookupProduct(code) {
  const trimmed = String(code).trim();
  if (!trimmed) return null;
  for (const row of vlData) {
    const refCol   = findCol(row, ['codigoreferencia', 'codigo referencia', 'referencia', 'productoean']);
    const dunCol   = findCol(row, ['dun', 'dun14', 'codigo dun']);
    const descCol  = findCol(row, ['descripcion', 'description', 'desc', 'nombre']);
    const eanCol   = findCol(row, ['ean', 'ean13', 'codigoean', 'codigo ean']);
    const idCol    = findCol(row, ['productoean', 'producto ean', 'idproducto', 'id producto']);
    const grupoCol = findCol(row, ['codigogrupo', 'codigo grupo', 'grupo']);
    const refVal   = refCol ? String(row[refCol] ?? '').trim() : '';
    const dunRaw   = dunCol ? String(row[dunCol] ?? '').trim() : '';
    const dunCodes = dunRaw.split(/[,;]/).map(s => s.split(':')[0].trim()).filter(Boolean);
    const dunMatch = dunCodes.includes(trimmed);
    if ((refVal && refVal === trimmed) || dunMatch) {
      return {
        code: trimmed, matchType: dunMatch ? 'DUN' : 'REF',
        ref: refVal, dun: dunRaw,
        ean: eanCol ? String(row[eanCol] ?? '').trim() : '',
        desc: descCol ? String(row[descCol] ?? '') : '',
        id: idCol ? String(row[idCol] ?? '').trim() : '',
        grupo: grupoCol ? String(row[grupoCol] ?? '').trim() : '',
      };
    }
  }
  return null;
}

// ── Stock ficticio ────────────────────────────────
let _stockRows = [];

function lookupStock(searchRef) {
  if (!searchRef || !refData.length) return [];
  const needle = String(searchRef).trim();
  const results = [];
  for (const row of refData) {
    const refCol   = findCol(row, ['referencia', 'codigoreferencia', 'ref', 'EAN', 'ean']);
    const ubicCol  = findCol(row, ['Ubicacion', 'ubicacion', 'ubicación', 'location']);
    const cajaCol  = findCol(row, ['Caja', 'caja', 'box']);
    const saldoCol = findCol(row, ['Saldo', 'saldo', 'stock', 'cantidad', 'qty']);
    if (!refCol || !ubicCol || !saldoCol) continue;
    const rowRef = String(row[refCol] ?? '').trim();
    if (rowRef !== needle) continue;
    const ubic  = String(row[ubicCol] ?? '').trim();
    const lower = ubic.toLowerCase();
    const isPrefix = stockPrefixes.some(p => lower.startsWith(p.toLowerCase()));
    if (!isPrefix) continue;
    const saldo = parseFloat(String(row[saldoCol]).replace(',', '.')) || 0;
    const caja  = cajaCol ? String(row[cajaCol] ?? '').trim() : '';
    results.push({ ubic, caja, saldo, raw: row });
  }
  return results;
}

function toggleStock() {
  const wrap = document.getElementById('sh-stock-wrap');
  if (wrap) wrap.classList.toggle('collapsed');
}
function toggleUbicaciones() {
  const wrap = document.getElementById('sh-ubicaciones-wrap');
  if (wrap) wrap.classList.toggle('collapsed');
}

function showStockInfo(idx) {
  const r = _stockRows[idx]; if (!r) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="sh-info-popover-backdrop" id="sh-info-pop" onclick="if(event.target.id==='sh-info-pop')document.getElementById('sh-info-pop').remove()">
      <div class="sh-info-popover">
        <div class="sh-info-handle"></div>
        <div class="sh-info-header">
          <div class="sh-info-ubic-badge">${r.ubic}</div>
          <button class="sh-info-close" onclick="document.getElementById('sh-info-pop').remove()">
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
          </button>
        </div>
        <div class="sh-info-grid">
          <div class="sh-info-cell accent"><div class="sh-info-cell-label">Saldo</div><div class="sh-info-cell-value">${r.saldo % 1 === 0 ? r.saldo : r.saldo.toFixed(2)}</div></div>
          <div class="sh-info-cell"><div class="sh-info-cell-label">Caja</div><div class="sh-info-cell-value">${r.caja || '—'}</div></div>
          <div class="sh-info-cell" style="grid-column:1/-1"><div class="sh-info-cell-label">Ubicación completa</div><div class="sh-info-cell-value">${r.ubic}</div></div>
        </div>
      </div>
    </div>`);
}

function renderStockSection(ref) {
  const section   = document.getElementById('sh-stock-section');
  const ubSection = document.getElementById('sh-ubicaciones-section');
  if (!section) return;
  if (ubSection) ubSection.style.display = '';
  const rows = lookupStock(ref);
  _stockRows = rows;
  section.style.display = '';
  const headerHTML = `
    <div class="sh-stock-header" onclick="toggleStock()">
      <span class="sh-stock-title">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V2M11 3V2M2 7h12"/></svg>
        Stock ficticio
      </span>
      <span class="sh-stock-chevron">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 4l4 4 4-4"/></svg>
      </span>
    </div>`;
  if (!rows.length) {
    section.innerHTML = `<div class="sh-stock-wrap" id="sh-stock-wrap">${headerHTML}<div class="sh-stock-body"><div class="sh-stock-empty">Sin stock en ubicaciones configuradas</div></div></div>`;
    return;
  }
  section.innerHTML = `
    <div class="sh-stock-wrap" id="sh-stock-wrap">
      ${headerHTML}
      <div class="sh-stock-body">
        <div class="sh-stock-cols">
          <span class="sh-stock-col-label">Ubicación</span>
          <span class="sh-stock-col-label center">Caja</span>
          <span class="sh-stock-col-label center">Saldo</span>
          <span></span>
        </div>
        <div class="sh-stock-scroll">
          ${rows.map((r, i) => `
            <div class="sh-stock-row">
              <span class="sh-stock-ubic" title="${r.ubic}">${r.ubic}</span>
              <span class="sh-stock-caja">${r.caja || '—'}</span>
              <span class="sh-stock-saldo">${r.saldo % 1 === 0 ? r.saldo : r.saldo.toFixed(2)}</span>
              <button class="sh-stock-info-btn" onclick="showStockInfo(${i})">
                <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="5" cy="5" r="4"/><path d="M5 4.5v2.5M5 3v.5"/></svg>
              </button>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
}
