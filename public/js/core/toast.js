// ═══════════════════════════════════════════════
//  CORE · TOAST
//  Notificaciones efímeras en pantalla.
// ═══════════════════════════════════════════════

let toastTimer;

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, type === 'error' ? 3200 : 2400);
}
