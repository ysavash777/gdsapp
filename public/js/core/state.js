// ═══════════════════════════════════════════════
//  CORE · STATE
//  Estado global compartido entre módulos.
//  Todo lo que vive acá es mutable y accedido por
//  múltiples módulos (scanner, sheet, lista, etc.)
// ═══════════════════════════════════════════════

// ── Usuario ──────────────────────────────────────
const USERS = ['Agus', 'Santi', 'Sofi', 'Mati', 'Joan'];
let currentUser = sessionStorage.getItem('mapix_user') || null;

// ── Proyectos ────────────────────────────────────
let projects           = [];
let activeProjectId    = null;
let activeProjectName  = '';
let entries            = [];
let sseSource           = null;

// ── Catálogos (xlsx) ─────────────────────────────
let vlData  = [];
let refData = [];

// ── Producto / formulario en curso ──────────────
let currentProduct = null;
let currentTipo    = null;
let currentRotura  = null;
let lastRotura     = null;
let editingId       = null;

// ── Scanner ──────────────────────────────────────
let scannerActive = false;
let lastCode      = '';
let lastCodeTime  = 0;

// ── Stock ficticio: prefijos configurables ──────
const STOCK_PREFIXES_KEY      = 'mapeo_stock_prefixes_v1';
const DEFAULT_STOCK_PREFIXES  = ['recupero', 'diferencias', 'bin', 'recibo'];

function loadStockPrefixes() {
  try {
    const r = localStorage.getItem(STOCK_PREFIXES_KEY);
    return r ? JSON.parse(r) : [...DEFAULT_STOCK_PREFIXES];
  } catch (e) {
    return [...DEFAULT_STOCK_PREFIXES];
  }
}
function saveStockPrefixes(arr) {
  try { localStorage.setItem(STOCK_PREFIXES_KEY, JSON.stringify(arr)); }
  catch (e) { console.error('[GDSMapiX] No se pudo persistir prefijos de stock:', e); }
}
let stockPrefixes = loadStockPrefixes();
