// ═══════════════════════════════════════════════
//  MODULES · ENTRIES LIST
//  Renderizado de la lista de registros del proyecto
//  activo, edición y borrado de un registro puntual.
// ═══════════════════════════════════════════════

const TIPO_LABEL = { unidades: 'Unidades', rotura: 'Rotura', vencido: 'Vencido', otro: 'Otro' };
const ICON_EDIT  = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg>`;
const ICON_DEL   = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/></svg>`;

function renderList() {
  const list = document.getElementById('entries-list');
  if (!entries.length) {
    list.innerHTML = `<div class="empty-state"><div class="es-icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" opacity=".3"/></svg></div><p>Escanee o ingrese una referencia para comenzar</p><p class="es-hint">Los registros aparecerán aquí</p></div>`;
    updateListCount();
    return;
  }
  list.innerHTML = entries.map(e => `
    <div class="entry-card tipo-${e.tipo}" id="entry-${e.id}">
      <div class="entry-qty-col">
        <span class="entry-qty-num">${e.qty}</span>
        <span class="entry-qty-label">uds</span>
      </div>
      <div class="entry-divider"></div>
      <div class="entry-body">
        <div class="entry-code">${e.desc || e.ref || e.dun}</div>
        ${(e.ref || e.dun) ? `<div class="entry-ref">${e.ref || e.dun}</div>` : ''}
        <div class="entry-chips">
          <span class="e-chip tipo-${e.tipo}">${TIPO_LABEL[e.tipo]}</span>
          ${e.subtipo ? `<span class="e-chip sub-${e.subtipo.toLowerCase()}">${e.subtipo}</span>` : ''}
          ${e.fechaVenc ? `<span class="e-chip fv">Venc. ${formatFechaDisplay(e.fechaVenc)}</span>` : ''}
          ${e.comentario ? `<span class="e-chip cmnt" title="${e.comentario}">${e.comentario}</span>` : ''}
          ${e.user ? `<span class="e-chip user-chip">${e.user}</span>` : ''}
        </div>
      </div>
      <div class="entry-actions">
        <button class="btn-entry edit" onclick="editEntry('${e.id}')">${ICON_EDIT}</button>
        <button class="btn-entry del"  onclick="deleteEntry('${e.id}')">${ICON_DEL}</button>
      </div>
    </div>`).join('');
  const countEl = document.getElementById('list-count');
  if (countEl) { countEl.textContent = entries.length; countEl.style.display = entries.length ? '' : 'none'; }
  if (typeof applyListFilters === 'function') applyListFilters();
}

// ── Borrado de un registro individual ───────────
// Migrado al confirmDialog basado en Promise (ver core/confirm-dialog.js)
// por la misma razón que el borrado de proyectos: sin callback global
// compartido, sin posibilidad de quedar en estado ambiguo.
async function deleteEntry(id) {
  const e = entries.find(x => x.id === id);
  if (!e) return;

  const confirmed = await confirmDialog(
    'Eliminar registro',
    `¿Desea eliminar ${e.ref || e.dun} · ${TIPO_LABEL[e.tipo]}?`
  );
  if (!confirmed) return;

  await removeEntry(id);
  showToast('Registro eliminado', 'warn');
}

// ── Edición de un registro ───────────────────────
function editEntry(id) {
  const e = entries.find(x => x.id === id);
  if (!e) return;
  editingId = id;
  const tipoOpts = ['unidades', 'rotura', 'vencido', 'otro'].map(t => `<option value="${t}" ${t === e.tipo ? 'selected' : ''}>${TIPO_LABEL[t]}</option>`).join('');
  let editDd = '', editMm = '', editAa = '';
  if (e.fechaVenc) {
    const parts = e.fechaVenc.split('-');
    if (parts.length === 3) { editAa = parts[0].slice(-2); editMm = parts[1]; editDd = parts[2]; }
  }
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" id="edit-modal" onclick="closeEditIfOutside(event)">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Editar · ${e.ref || e.dun}</div>
        <div class="modal-field"><label>Tipo</label><select id="edit-tipo" onchange="editTipoChange()">${tipoOpts}</select></div>
        <div class="modal-field" id="edit-subtipo-field" style="${e.tipo === 'rotura' ? '' : 'display:none'}">
          <label>Destino</label>
          <select id="edit-subtipo"><option value="IDL" ${e.subtipo === 'IDL' ? 'selected' : ''}>IDL</option><option value="RAPPI" ${e.subtipo === 'RAPPI' ? 'selected' : ''}>RAPPI</option></select>
        </div>
        <div class="modal-field" id="edit-fecha-field" style="${e.tipo === 'unidades' ? '' : 'display:none'}">
          <label>Fecha vencimiento</label>
          <div class="date-seg-wrap" id="edit-date-seg-wrap">
            <input class="date-seg-part" id="edit-seg-dd" maxlength="2" inputmode="numeric" placeholder="DD" autocomplete="off" value="${editDd}"/>
            <span class="date-seg-sep">/</span>
            <input class="date-seg-part" id="edit-seg-mm" maxlength="2" inputmode="numeric" placeholder="MM" autocomplete="off" value="${editMm}"/>
            <span class="date-seg-sep">/</span>
            <input class="date-seg-part date-seg-year" id="edit-seg-aa" maxlength="2" inputmode="numeric" placeholder="AA" autocomplete="off" value="${editAa}"/>
          </div>
          <input type="hidden" id="edit-fecha" value="${e.fechaVenc || ''}"/>
        </div>
        <div class="modal-field" id="edit-comentario-field" style="${e.tipo === 'otro' ? '' : 'display:none'}">
          <label>Comentario</label><textarea id="edit-comentario">${e.comentario || ''}</textarea>
        </div>
        <div class="modal-field"><label>Cantidad</label><input type="number" id="edit-qty" value="${e.qty}" min="1" placeholder="1" inputmode="numeric"/></div>
        <div class="modal-btns">
          <button class="m-cancel" onclick="closeEditModal()">Cancelar</button>
          <button class="m-save" onclick="confirmSaveEdit()">Guardar</button>
        </div>
      </div>
    </div>`);
  (function initEditSegDate() {
    function syncEdit() {
      const dd = (document.getElementById('edit-seg-dd') || {}).value || '';
      const mm = (document.getElementById('edit-seg-mm') || {}).value || '';
      const aa = (document.getElementById('edit-seg-aa') || {}).value || '';
      const h = document.getElementById('edit-fecha');
      if (h) h.value = (dd && mm && aa && aa.length === 2) ? `20${aa}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}` : '';
    }
    function setupSeg(el, maxLen, nextId) {
      if (!el) return;
      el.addEventListener('input', () => { let v = el.value.replace(/\D/g, '').slice(0, maxLen); el.value = v; syncEdit(); if (v.length === maxLen && nextId) { const n = document.getElementById(nextId); if (n) n.focus(); } });
      el.addEventListener('keydown', e => { if (e.key === 'Backspace' && el.value === '') { const pm = { 'edit-seg-mm': 'edit-seg-dd', 'edit-seg-aa': 'edit-seg-mm' }; if (pm[el.id]) { const p = document.getElementById(pm[el.id]); if (p) p.focus(); } } if (e.key === 'Enter') { const qty = document.getElementById('edit-qty'); if (qty) qty.focus(); } });
    }
    setupSeg(document.getElementById('edit-seg-dd'), 2, 'edit-seg-mm');
    setupSeg(document.getElementById('edit-seg-mm'), 2, 'edit-seg-aa');
    setupSeg(document.getElementById('edit-seg-aa'), 2, null);
  })();
  const editQtyEl = document.getElementById('edit-qty');
  if (editQtyEl) editQtyEl.addEventListener('keydown', ev => { if (ev.key === 'Enter') confirmSaveEdit(); });
  const editCmntEl = document.getElementById('edit-comentario');
  if (editCmntEl) editCmntEl.addEventListener('keydown', ev => { if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); confirmSaveEdit(); } });
}

async function confirmSaveEdit() {
  const tipo       = document.getElementById('edit-tipo') ? document.getElementById('edit-tipo').value : null;
  const subtipo    = tipo === 'rotura' ? (document.getElementById('edit-subtipo') ? document.getElementById('edit-subtipo').value : null) : null;
  const fechaVenc  = tipo === 'unidades' ? (document.getElementById('edit-fecha') ? document.getElementById('edit-fecha').value : null) : null;
  const comentario = tipo === 'otro' ? (document.getElementById('edit-comentario') ? document.getElementById('edit-comentario').value.trim() : null) : null;
  const qty        = Math.max(1, parseInt(document.getElementById('edit-qty') ? document.getElementById('edit-qty').value : 1) || 1);
  const e = entries.find(x => x.id === editingId);
  if (!e || !tipo) return;
  closeEditModal();
  await updateEntry(editingId, { tipo, subtipo, fechaVenc, comentario, qty });
  showToast('Guardado', 'success');
}

function editTipoChange() {
  const tipo = document.getElementById('edit-tipo').value;
  document.getElementById('edit-subtipo-field').style.display    = tipo === 'rotura' ? '' : 'none';
  document.getElementById('edit-fecha-field').style.display      = tipo === 'unidades' ? '' : 'none';
  document.getElementById('edit-comentario-field').style.display = tipo === 'otro' ? '' : 'none';
}

function closeEditModal() {
  const m = document.getElementById('edit-modal');
  if (m) m.remove();
  editingId = null;
}
function closeEditIfOutside(e) {
  if (e.target.id === 'edit-modal') closeEditModal();
}
