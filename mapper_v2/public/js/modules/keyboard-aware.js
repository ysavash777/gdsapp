// ═══════════════════════════════════════════════
//  MODULES · KEYBOARD AWARE
//  En mobile, cuando aparece el teclado virtual,
//  reposiciona el bottom sheet y la barra de búsqueda
//  para que queden por encima de él.
// ═══════════════════════════════════════════════

(function initKeyboardAware() {
  if (!window.visualViewport) return;
  function onViewportChange() {
    const vv = window.visualViewport;
    const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    const sheet     = document.getElementById('entry-sheet');
    const searchBar = document.getElementById('list-search-fixed');
    if (sheet && sheet.classList.contains('open')) sheet.style.bottom = offset + 'px';
    if (searchBar && searchBar.classList.contains('open')) searchBar.style.bottom = offset + 'px';
  }
  window.visualViewport.addEventListener('resize', onViewportChange);
  window.visualViewport.addEventListener('scroll', onViewportChange);
})();

(function initManualInputFocus() {
  const inp = document.getElementById('manual-input'); if (!inp) return;
  inp.addEventListener('focus', () => { setTimeout(() => inp.scrollIntoView({ behavior: 'smooth', block: 'center' }), 320); });
})();
