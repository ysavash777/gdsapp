// ═══════════════════════════════════════════════
//  MODULES · REALTIME
//  Abrir un proyecto + conexión SSE para colaboración
//  en vivo entre usuarios.
// ═══════════════════════════════════════════════

function openProject(id) {
  const proj = projects.find(p => p.id === id);
  if (!proj) return;

  activeProjectId   = id;
  activeProjectName = proj.name;
  entries           = proj.entries || [];

  document.getElementById('screen-projects').classList.add('hidden');
  document.getElementById('header-proj-name').textContent = proj.name;

  // Si quedaron registros pendientes de este proyecto de una sesión
  // anterior cerrada abruptamente, sincronizar ya en vez de esperar
  // el próximo ciclo del retry loop.
  if (typeof _flushPendingQueue === 'function') _flushPendingQueue();

  // Carga catálogos xlsx primero, luego muestra el escáner
  showSetup(id);
}

function connectSSE(projectId) {
  disconnectSSE();
  sseSource = new EventSource(`/api/projects/${projectId}/stream`);

  sseSource.onopen = () => {
    document.getElementById('live-dot').classList.remove('offline');
  };

  sseSource.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'sync') {
        entries = msg.project.entries || [];
        renderList();
      } else if (msg.type === 'entries') {
        entries = msg.entries || [];
        renderList();
      }
    } catch (_) { /* mensaje keepalive u otro no-JSON, ignorar */ }
  };

  sseSource.onerror = () => {
    document.getElementById('live-dot').classList.add('offline');
    // El reconnect automático lo maneja EventSource nativamente
  };
}

function disconnectSSE() {
  if (sseSource) { sseSource.close(); sseSource = null; }
  const dot = document.getElementById('live-dot');
  if (dot) dot.classList.add('offline');
}
