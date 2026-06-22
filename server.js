const express = require('express');
const path    = require('path');
const { createClient } = require('@supabase/supabase-js');

const app  = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.warn('⚠️  Faltan SUPABASE_URL / SUPABASE_KEY como variables de entorno.');
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── SSE clients pool ─────────────────────────────────────────────────────────
// Map: projectId → Set of res objects
const clients = new Map();

function broadcast(projectId, payload) {
  const pool = clients.get(projectId);
  if (!pool) return;
  const msg = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of pool) {
    try { res.write(msg); } catch (_) {}
  }
}

// ── Helpers (antes leían/escribían archivos, ahora hablan con Supabase) ──────
// La forma del objeto "project" es EXACTAMENTE la misma que antes:
// { id, name, createdBy, createdAt, entries: [...] }
// Se guarda completa dentro de la columna jsonb "data".

async function loadProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('loadProject error:', error.message); return null; }
  return data ? data.data : null;
}

async function saveProject(id, project) {
  const { error } = await supabase
    .from('projects')
    .upsert({ id, data: project });
  if (error) throw error;
}

async function deleteProjectRow(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

async function listProjects() {
  const { data, error } = await supabase.from('projects').select('data');
  if (error) { console.error('listProjects error:', error.message); return []; }
  return data
    .map(row => row.data)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Envuelve handlers async para no perder errores no controlados
const h = fn => (req, res) => fn(req, res).catch(err => {
  console.error(err);
  if (!res.headersSent) res.status(500).json({ error: 'Error interno' });
});

// ── SSE endpoint ─────────────────────────────────────────────────────────────
app.get('/api/projects/:id/stream', h(async (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  if (!clients.has(id)) clients.set(id, new Set());
  clients.get(id).add(res);

  // Send current state immediately on connect
  const project = await loadProject(id);
  if (project) res.write(`data: ${JSON.stringify({ type: 'sync', project })}\n\n`);

  // Keepalive every 25s
  const ka = setInterval(() => { try { res.write(': ka\n\n'); } catch (_) {} }, 25000);

  req.on('close', () => {
    clearInterval(ka);
    const pool = clients.get(id);
    if (pool) { pool.delete(res); if (!pool.size) clients.delete(id); }
  });
}));

// ── Projects CRUD ─────────────────────────────────────────────────────────────
app.get('/api/projects', h(async (_req, res) => {
  res.json(await listProjects());
}));

app.post('/api/projects', h(async (req, res) => {
  const { id, name, createdBy } = req.body;
  if (!id || !name) return res.status(400).json({ error: 'id y name requeridos' });
  if (await loadProject(id)) return res.status(409).json({ error: 'Proyecto ya existe' });

  const project = {
    id,
    name,
    createdBy: createdBy || 'Sistema',
    createdAt: new Date().toISOString(),
    entries:   []
  };
  await saveProject(id, project);
  res.json(project);
}));

app.delete('/api/projects/:id', h(async (req, res) => {
  const { id } = req.params;
  const project = await loadProject(id);
  if (!project) return res.status(404).json({ error: 'No existe' });
  await deleteProjectRow(id);
  res.json({ ok: true });
}));

// ── Entries ───────────────────────────────────────────────────────────────────
// Add or accumulate entry
app.post('/api/projects/:id/entries', h(async (req, res) => {
  const project = await loadProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const entry = req.body; // { id, ref, desc, tipo, subtipo, fechaVenc, comentario, qty, ts, user }

  // Accumulate if same key exists
  const key = [entry.ref, entry.tipo, entry.subtipo||'', entry.fechaVenc||'', (entry.comentario||'').trim().toLowerCase()].join('|');
  const existing = project.entries.find(e =>
    [e.ref, e.tipo, e.subtipo||'', e.fechaVenc||'', (e.comentario||'').trim().toLowerCase()].join('|') === key
  );

  if (existing) {
    existing.qty += entry.qty;
    existing.lastUser = entry.user;
    existing.lastTs   = entry.ts;
  } else {
    project.entries.unshift(entry);
  }

  await saveProject(project.id, project);
  broadcast(project.id, { type: 'entries', entries: project.entries });
  res.json({ ok: true, entries: project.entries });
}));

// Edit entry
app.put('/api/projects/:id/entries/:entryId', h(async (req, res) => {
  const project = await loadProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const idx = project.entries.findIndex(e => e.id === req.params.entryId);
  if (idx === -1) return res.status(404).json({ error: 'Entry no encontrada' });

  const updated = { ...project.entries[idx], ...req.body };

  // Check collision after edit
  const key = [updated.ref, updated.tipo, updated.subtipo||'', updated.fechaVenc||'', (updated.comentario||'').trim().toLowerCase()].join('|');
  const collision = project.entries.find((e, i) =>
    i !== idx &&
    [e.ref, e.tipo, e.subtipo||'', e.fechaVenc||'', (e.comentario||'').trim().toLowerCase()].join('|') === key
  );

  if (collision) {
    collision.qty += updated.qty;
    project.entries.splice(idx, 1);
  } else {
    project.entries[idx] = updated;
  }

  await saveProject(project.id, project);
  broadcast(project.id, { type: 'entries', entries: project.entries });
  res.json({ ok: true, entries: project.entries });
}));

// Delete entry
app.delete('/api/projects/:id/entries/:entryId', h(async (req, res) => {
  const project = await loadProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });

  project.entries = project.entries.filter(e => e.id !== req.params.entryId);
  await saveProject(project.id, project);
  broadcast(project.id, { type: 'entries', entries: project.entries });
  res.json({ ok: true });
}));

// ── Boot ──────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  GDSMapiX corriendo en http://localhost:${PORT}\n`);
});
