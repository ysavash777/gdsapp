// ═══════════════════════════════════════════════
//  MODULES · BACK GUARD
//  Intercepta el botón "atrás" del navegador mientras
//  el usuario está dentro de un proyecto, para evitar
//  que salga sin querer y pierda de vista el escáner.
// ═══════════════════════════════════════════════

history.pushState(null, '', location.href);
let _backGuardActive = true;

async function _backGuardHandler() {
  if (!_backGuardActive) return;
  history.pushState(null, '', location.href);
  soundAlert();

  const confirmed = await confirmDialog(
    'Volver a proyectos',
    '¿Deseas volver a la lista de proyectos?',
    { warn: true }
  );
  if (confirmed) goToProjects();
}

window.addEventListener('popstate', _backGuardHandler);
