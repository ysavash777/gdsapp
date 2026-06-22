// ═══════════════════════════════════════════════
//  MODULES · PERSISTENCE
//  Cola de tránsito: el navegador NUNCA es almacenamiento
//  permanente. Es solo un buffer de tránsito — el dato entra
//  acá, se intenta mandar al servidor, y recién se borra del
//  buffer cuando el servidor confirma que lo guardó.
// ═══════════════════════════════════════════════

const PENDING_QUEUE_KEY = 'mapix_pending_queue_v1';

function _loadQueue() {
  try { return JSON.parse(localStorage.getItem(PENDING_QUEUE_KEY) || '[]'); }
  catch (e) { return []; }
}
function _saveQueue(q) {
  try { localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(q)); }
  catch (e) { console.error('[GDSMapiX] No se pudo persistir la cola local:', e); }
}
function _enqueue(op) {
  const q = _loadQueue();
  q.push(op);
  _saveQueue(q);
  return op.qid;
}
function _dequeue(qid) {
  const q = _loadQueue().filter(op => op.qid !== qid);
  _saveQueue(q);
}

async function _sendOp(op) {
  const base = `/api/projects/${op.projectId}/entries`;
  if (op.kind === 'create') {
    return fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op.entry) });
  }
  if (op.kind === 'update') {
    return fetch(`${base}/${op.entryId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(op.patch) });
  }
  if (op.kind === 'delete') {
    return fetch(`${base}/${op.entryId}`, { method: 'DELETE' });
  }
  throw new Error('Operación desconocida: ' + op.kind);
}

// Intenta enviar una operación. Si falla, queda en la cola para reintento.
async function _attemptOp(op) {
  try {
    const res = await _sendOp(op);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _dequeue(op.qid);
    return true;
  } catch (err) {
    console.warn(`[GDSMapiX] Pendiente de sincronizar (sin confirmación del servidor todavía):`, op, err);
    return false;
  }
}

async function saveEntry(entry) {
  const op = { qid: uid(), kind: 'create', projectId: activeProjectId, entry, ts: Date.now() };
  _enqueue(op);
  await _attemptOp(op);
  // SSE actualizará la lista en todos los clientes, incluido este, una vez confirmado
}

async function updateEntry(id, patch) {
  const op = { qid: uid(), kind: 'update', projectId: activeProjectId, entryId: id, patch, ts: Date.now() };
  _enqueue(op);
  await _attemptOp(op);
}

async function removeEntry(id) {
  const op = { qid: uid(), kind: 'delete', projectId: activeProjectId, entryId: id, ts: Date.now() };
  _enqueue(op);
  await _attemptOp(op);
}

// ── Reintento periódico + al recuperar conexión ─────────────────────────────
let _retryTimer = null;

async function _flushPendingQueue() {
  const q = _loadQueue();
  if (!q.length) return;
  console.info(`[GDSMapiX] Reintentando sincronizar ${q.length} registro(s) pendiente(s)...`);
  // Procesar en orden (FIFO) para no invertir la secuencia de cambios
  for (const op of q) {
    // Si cambiamos de proyecto, no reintentamos contra el activo actual
    if (op.projectId !== activeProjectId) continue;
    await _attemptOp(op);
  }
}

function _startRetryLoop() {
  if (_retryTimer) clearInterval(_retryTimer);
  _retryTimer = setInterval(_flushPendingQueue, 4000);
}

window.addEventListener('online', () => {
  console.info('[GDSMapiX] Conexión recuperada, sincronizando pendientes...');
  _flushPendingQueue();
});
window.addEventListener('offline', () => {
  console.warn('[GDSMapiX] Sin conexión. Los registros se guardarán localmente hasta poder sincronizar.');
});

_startRetryLoop();
// Intento inicial por si quedaron operaciones de una sesión anterior cerrada abruptamente
_flushPendingQueue();
