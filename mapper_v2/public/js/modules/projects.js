// ═══════════════════════════════════════════════
//  MODULES · PROJECTS
//  Pantalla de selección de proyectos.
//
//  REESCRITO DESDE CERO (no es un parche).
//  El bug histórico de "eliminar mapeo" venía de usar
//  onclick inline tanto en la card completa (abrir) como
//  en un botón anidado (borrar), dependiendo de
//  stopPropagation() para que no se dispararan los dos.
//  Eso es fundamentalmente fragil en mobile (ghost clicks,
//  re-render de innerHTML a mitad de un toque, etc).
//
//  Acá usamos UN SOLO listener delegado sobre #proj-list,
//  que inspecciona el atributo data-action del elemento
//  clickeado más cercano. Abrir proyecto y borrar proyecto
//  son ramas mutuamente excluyentes del mismo handler:
//  nunca pueden "filtrarse" entre sí porque no son dos
//  listeners independientes compitiendo, son un único
//  punto de decisión.
// ═══════════════════════════════════════════════

function showProjectsScreen() {
  stopScanner();
  disconnectSSE();
  document.getElementById('screen-projects').classList.remove('hidden');
  loadProjects();
}

function goToProjects() {
  showProjectsScreen();
}

async function loadProjects() {
  try {
    const res = await fetch('/api/projects');
    projects  = await res.json();
  } catch (e) {
    console.error('[GDSMapiX] No se pudieron cargar los proyectos:', e);
    projects = projects || [];
  }
  renderProjects();
}

function renderProjects() {
  const list = document.getElementById('proj-list');

  if (!projects.length) {
    list.innerHTML = `
      <div class="proj-empty">
        <div class="proj-empty-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity=".7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" opacity=".3"/></svg>
        </div>
        <p>No hay proyectos todavía</p>
        <p class="hint">Creá uno con el botón de abajo</p>
      </div>`;
    return;
  }

  list.innerHTML = projects.map(p => {
    const date  = new Date(p.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    const count = (p.entries || []).length;
    // data-project-id en la card raíz; data-action distingue qué parte se tocó.
    // Sin onclick inline: todo pasa por el listener delegado de abajo.
    return `
      <div class="proj-card" data-project-id="${p.id}">
        <div class="proj-card-clickzone" data-action="open">
          <div class="proj-card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5" opacity=".3"/></svg>
          </div>
          <div class="proj-card-body">
            <div class="proj-card-name"></div>
            <div class="proj-card-meta">
              <span class="pcm-date"></span>
              <span class="pcm-author"></span>
            </div>
          </div>
          <span class="proj-card-count">${count} reg.</span>
        </div>
        <button type="button" class="proj-card-del" data-action="delete">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/></svg>
        </button>
      </div>`;
  }).join('');

  // Texto vía textContent (no template string) para evitar inyectar HTML
  // si un nombre de proyecto llegara a tener caracteres como < o &.
  list.querySelectorAll('.proj-card').forEach(card => {
    const id = card.dataset.projectId;
    const p  = projects.find(x => x.id === id);
    if (!p) return;
    const date = new Date(p.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    card.querySelector('.proj-card-name').textContent   = p.name;
    card.querySelector('.pcm-date').textContent          = date;
    card.querySelector('.pcm-author').textContent        = `por ${p.createdBy}`;
  });
}

// ── Delegación de eventos: único punto de entrada para clicks en la lista ──
// Se registra UNA SOLA VEZ al cargar el módulo (no en cada renderProjects),
// así sobrevive a cualquier cantidad de re-renders de innerHTML sin
// necesidad de volver a enganchar listeners.
function _initProjectListDelegation() {
  const list = document.getElementById('proj-list');
  if (!list) return;

  list.addEventListener('click', (evt) => {
    const actionEl = evt.target.closest('[data-action]');
    if (!actionEl || !list.contains(actionEl)) return;

    const card = actionEl.closest('.proj-card');
    if (!card) return;
    const projectId = card.dataset.projectId;
    const project    = projects.find(p => p.id === projectId);
    if (!project) return;

    const action = actionEl.dataset.action;

    if (action === 'open') {
      openProject(projectId);
      return;
    }

    if (action === 'delete') {
      handleDeleteProject(projectId, project.name);
      return;
    }
  });
}

// ── Borrado de proyecto: flujo único, lineal, sin callbacks compartidos ──
async function handleDeleteProject(id, name) {
  const confirmed = await confirmDialog(
    'Eliminar proyecto',
    `¿Eliminar "${name}" y todos sus registros?`
  );
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Proyecto eliminado', 'warn');
  } catch (e) {
    console.error('[GDSMapiX] Error al eliminar proyecto:', e);
    showToast('Error al eliminar', 'error');
  } finally {
    // Recargamos la lista siempre, haya fallado o no, para reflejar el
    // estado real del servidor (por si el borrado sí ocurrió pero la
    // respuesta de red falló en el camino de vuelta).
    await loadProjects();
  }
}

// ═══════════════════════════════════════════════
//  NUEVO PROYECTO
// ═══════════════════════════════════════════════
function openNewProjectDialog() {
  document.getElementById('new-project-dialog').classList.remove('hidden');
  const input = document.getElementById('np-name');
  setTimeout(() => input.focus(), 100);
}
function closeNewProjectDialog() {
  document.getElementById('new-project-dialog').classList.add('hidden');
  document.getElementById('np-name').value = '';
}

async function createProject() {
  const nameEl = document.getElementById('np-name');
  const name   = nameEl.value.trim();
  if (!name) { nameEl.focus(); return; }

  const id = uid();
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, createdBy: currentUser })
    });
    if (!res.ok) { showToast('Error al crear proyecto', 'error'); return; }
    closeNewProjectDialog();
    await loadProjects();
    openProject(id);
  } catch (e) {
    console.error('[GDSMapiX] Error al crear proyecto:', e);
    showToast('No se puede conectar al servidor', 'error');
  }
}

// ── Boot del módulo ──────────────────────────────
_initProjectListDelegation();

// Enter en el input de nuevo proyecto = crear
document.getElementById('np-name').addEventListener('keydown', e => {
  if (e.key === 'Enter') createProject();
});
