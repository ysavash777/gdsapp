// ═══════════════════════════════════════════════
//  MODULES · SETTINGS
//  Panel de configuración: pantalla completa,
//  prefijos de stock ficticio, borrar todo.
// ═══════════════════════════════════════════════

function toggleSettings() {
  const existing = document.getElementById('settings-panel-wrap');
  if (existing) { existing.remove(); return; }
  document.body.insertAdjacentHTML('beforeend', `
    <div class="settings-backdrop" id="settings-panel-wrap" onclick="closeSettingsIfOutside(event)">
      <div class="settings-panel">
        <div class="settings-title">Configuración</div>
        <div class="settings-divider"></div>
        <div class="settings-item" onclick="toggleFullscreen()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 6V2h4M15 6V2h-4M1 10v4h4M15 10v4h-4"/></svg>
          <span id="fs-label">Pantalla completa</span>
        </div>
        <div class="settings-divider"></div>
        <div class="settings-item" onclick="openStockPrefixConfig()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V2M11 3V2M2 7h12M5 10h6"/></svg>
          Prefijos stock ficticio
        </div>
        <div class="settings-divider"></div>
        <div class="settings-item danger" onclick="confirmClearAll()">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/></svg>
          Borrar todos los registros
        </div>
      </div>
    </div>`);
}

function closeSettingsIfOutside(e) {
  if (e.target.id === 'settings-panel-wrap') document.getElementById('settings-panel-wrap').remove();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(() => {}); }
  else { document.exitFullscreen(); }
  const p = document.getElementById('settings-panel-wrap'); if (p) p.remove();
}
document.addEventListener('fullscreenchange', () => {
  const lbl = document.getElementById('fs-label');
  if (lbl) lbl.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
});

// ── Borrar TODOS los registros del proyecto ─────
// Acción altamente destructiva: usa el mismo confirmDialog robusto
// basado en Promise que el borrado de proyectos/registros individuales.
async function confirmClearAll() {
  const p = document.getElementById('settings-panel-wrap'); if (p) p.remove();

  const confirmed = await confirmDialog(
    'Borrar todos los registros',
    'Esta acción no se puede deshacer. Todos los registros serán eliminados.'
  );
  if (!confirmed) return;

  for (const e of [...entries]) {
    await removeEntry(e.id);
  }
  showToast('Registros eliminados', 'warn');
}
