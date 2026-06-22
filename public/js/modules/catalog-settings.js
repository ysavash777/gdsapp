// ═══════════════════════════════════════════════
//  MODULES · CATALOG SETTINGS
//  Panel de configuración de catálogos accesible
//  desde la pantalla de proyectos.
//  Permite subir variables.xlsx y referencia.xlsx
//  al servidor. Los archivos se almacenan en public/
//  y son compartidos por todos los usuarios.
// ═══════════════════════════════════════════════

let _catalogStatus = [];

async function openCatalogSettings() {
  // Cerrar panel de settings si estuviera abierto
  const existing = document.getElementById('catalog-settings-backdrop');
  if (existing) { existing.remove(); return; }

  // Cargar estado actual de catálogos desde el servidor
  try {
    const res    = await fetch('/api/catalogs');
    _catalogStatus = await res.json();
  } catch (e) {
    _catalogStatus = [];
  }

  _renderCatalogPanel();
}

function _renderCatalogPanel() {
  const prev = document.getElementById('catalog-settings-backdrop');
  if (prev) prev.remove();

  function fileRow(catalog) {
    const name      = catalog.name;
    const exists    = catalog.exists;
    const updatedAt = exists
      ? new Date(catalog.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
      : null;
    const sizeKb = exists ? Math.round(catalog.size / 1024) : null;

    return `
      <div class="cs-file-row" id="cs-row-${name.replace('.','_')}">
        <div class="cs-file-info">
          <div class="cs-file-name">${name}</div>
          <div class="cs-file-meta">
            ${exists
              ? `<span class="cs-badge cs-badge-ok">En servidor</span><span class="cs-file-detail">${sizeKb} KB · ${updatedAt}</span>`
              : `<span class="cs-badge cs-badge-missing">No encontrado</span>`}
          </div>
        </div>
        <label class="cs-upload-btn" title="Subir nuevo ${name}">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 10V2M5 5l3-3 3 3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>
          <input type="file" accept=".xlsx,.xls" data-catalog="${name}" style="display:none"/>
        </label>
      </div>`;
  }

  const rows = _catalogStatus.map(fileRow).join('');

  document.body.insertAdjacentHTML('beforeend', `
    <div class="cs-backdrop" id="catalog-settings-backdrop" onclick="closeCatalogSettings(event)">
      <div class="cs-panel">
        <div class="cs-handle"></div>
        <div class="cs-header">
          <div class="cs-title">Catálogos del sistema</div>
          <button type="button" class="cs-close-btn" onclick="document.getElementById('catalog-settings-backdrop').remove()">
            <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
          </button>
        </div>
        <p class="cs-subtitle">Los archivos subidos se almacenan en el servidor y son usados por todos los usuarios automáticamente.</p>

        <div class="cs-section-label">Referencias y variables</div>
        <div class="cs-files-list">
          ${rows}
        </div>

        <div class="cs-section-label" style="margin-top:14px">Coordenadas</div>
        <div class="cs-coming-soon">
          <div class="cs-coming-icon">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M8 2C5.8 2 4 3.8 4 6c0 3.5 4 8 4 8s4-4.5 4-8c0-2.2-1.8-4-4-4z"/><circle cx="8" cy="6" r="1.5"/></svg>
          </div>
          <div>
            <div class="cs-coming-label">Próximamente</div>
            <div class="cs-coming-sub">Carga de archivo de coordenadas de ubicaciones</div>
          </div>
          <span class="cs-soon-badge">Pronto</span>
        </div>
      </div>
    </div>`);

  // Listener para los inputs de archivo — delegado en el panel
  document.getElementById('catalog-settings-backdrop').addEventListener('change', async (evt) => {
    const input = evt.target;
    if (input.tagName !== 'INPUT' || input.type !== 'file') return;
    const file = input.files[0];
    if (!file) return;

    const catalogName = input.dataset.catalog;
    const row         = document.getElementById(`cs-row-${catalogName.replace('.','_')}`);

    // Mostrar estado "subiendo"
    const uploadBtn = input.closest('.cs-upload-btn');
    if (uploadBtn) {
      uploadBtn.classList.add('cs-uploading');
      uploadBtn.innerHTML = `<span class="cs-spinner"></span>`;
    }

    try {
      // Renombrar el archivo al nombre canónico del catálogo si el usuario
      // subió un archivo con nombre diferente (ej: "variables_v2.xlsx")
      const renamedFile = new File([file], catalogName, { type: file.type });

      const form = new FormData();
      form.append('files', renamedFile);

      const res  = await fetch('/api/catalogs', { method: 'POST', body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Limpiar caché local de xlsx para forzar re-carga al próximo proyecto
      vlData  = vlData.length  && catalogName === 'variables.xlsx'  ? [] : vlData;
      refData = refData.length && catalogName === 'referencia.xlsx' ? [] : refData;

      showToast(`${catalogName} actualizado`, 'success');

      // Refrescar panel con estado actualizado del servidor
      const statusRes = await fetch('/api/catalogs');
      _catalogStatus  = await statusRes.json();
      _renderCatalogPanel();

    } catch (err) {
      console.error('[GDSMapiX] Error al subir catálogo:', err);
      showToast(`Error al subir ${catalogName}`, 'error');
      // Restaurar botón de subida
      if (uploadBtn) {
        uploadBtn.classList.remove('cs-uploading');
        uploadBtn.innerHTML = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 10V2M5 5l3-3 3 3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg><input type="file" accept=".xlsx,.xls" data-catalog="${catalogName}" style="display:none"/>`;
      }
    }
  });
}

function closeCatalogSettings(evt) {
  if (evt.target.id === 'catalog-settings-backdrop')
    document.getElementById('catalog-settings-backdrop').remove();
}
