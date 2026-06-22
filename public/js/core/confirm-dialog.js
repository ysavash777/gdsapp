// ═══════════════════════════════════════════════
//  CORE · CONFIRM DIALOG
//  Reescrito desde cero (no es un parche del anterior).
//
//  Diseño: cada llamada a confirmDialog() crea su PROPIO
//  par de elementos en el DOM con un ID único, y resuelve
//  una Promise<boolean>. No existe ninguna variable global
//  compartida del tipo "confirmCallback" que pueda ser
//  pisada por una segunda invocación simultánea — esa
//  variable compartida era la causa raíz del bug de
//  "eliminar mapeo" quedando en estado inconsistente.
//
//  Si se invoca confirmDialog() mientras ya hay un diálogo
//  abierto, el anterior se cierra y resuelve `false` antes
//  de abrir el nuevo, así nunca conviven dos modales con
//  estado ambiguo sobre cuál "Confirmar" pertenece a cuál.
// ═══════════════════════════════════════════════

let _activeConfirmDialog = null; // { rootEl, resolve }

function _closeActiveConfirmDialog(result) {
  if (!_activeConfirmDialog) return;
  const { rootEl, resolve } = _activeConfirmDialog;
  _activeConfirmDialog = null;
  if (rootEl && rootEl.parentNode) rootEl.remove();
  resolve(result);
}

/**
 * Muestra un diálogo de confirmación y devuelve una Promise<boolean>.
 * true  = el usuario confirmó
 * false = el usuario canceló, o se cerró por otro motivo
 *
 * @param {string} title
 * @param {string} msg
 * @param {{safe?: boolean, warn?: boolean}} opts
 */
function confirmDialog(title, msg, opts = {}) {
  const { safe = false, warn = false } = opts;

  // Si ya había un diálogo abierto, lo cerramos como "cancelado"
  // antes de abrir el nuevo. Nunca conviven dos a la vez.
  if (_activeConfirmDialog) _closeActiveConfirmDialog(false);

  return new Promise((resolve) => {
    let iconClass, iconSvg;
    if (warn) {
      iconClass = 'warn';
      iconSvg = `<svg viewBox="0 0 20 20" fill="none" stroke="#f59e0b" stroke-width="1.8"><path d="M10 7v4M10 14.5v.5M4.9 17h10.2c1.4 0 2.3-1.5 1.6-2.7L11.6 4.3a1.85 1.85 0 00-3.2 0L3.3 14.3C2.6 15.5 3.5 17 4.9 17z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else if (safe) {
      iconClass = 'safe';
      iconSvg = `<svg viewBox="0 0 20 20" fill="none" stroke="#93c5fd" stroke-width="1.8"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else {
      iconClass = 'danger';
      iconSvg = `<svg viewBox="0 0 20 20" fill="none" stroke="#fca5a5" stroke-width="1.8"><path d="M10 7v4M10 14.5v.5M4.9 17h10.2c1.4 0 2.3-1.5 1.6-2.7L11.6 4.3a1.85 1.85 0 00-3.2 0L3.3 14.3C2.6 15.5 3.5 17 4.9 17z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    const rootEl = document.createElement('div');
    rootEl.className = 'dialog-backdrop';
    rootEl.innerHTML = `
      <div class="dialog-box">
        <div class="dialog-icon-wrap ${iconClass}">${iconSvg}</div>
        <h3></h3><p></p>
        <div class="dialog-divider"></div>
        <div class="dialog-btns">
          <button type="button" class="d-cancel">Cancelar</button>
          <button type="button" class="d-confirm${safe ? ' safe' : ''}">Confirmar</button>
        </div>
      </div>`;
    // Texto vía textContent (no innerHTML) para no interpretar HTML/markup
    // accidental que venga en title/msg (ej. nombres de proyecto con caracteres especiales).
    rootEl.querySelector('h3').textContent = title;
    rootEl.querySelector('p').textContent  = msg;

    document.body.appendChild(rootEl);
    _activeConfirmDialog = { rootEl, resolve };

    const cancelBtn  = rootEl.querySelector('.d-cancel');
    const confirmBtn = rootEl.querySelector('.d-confirm');

    // type="button" + listeners reales (no inline onclick) evitan cualquier
    // ambigüedad sobre a qué instancia del diálogo pertenece el click,
    // incluso si por algún motivo hubiera más de un nodo .dialog-backdrop
    // transitoriamente en el DOM.
    cancelBtn.addEventListener('click', () => _closeActiveConfirmDialog(false));
    confirmBtn.addEventListener('click', () => _closeActiveConfirmDialog(true));

    // Click en el fondo oscuro = cancelar (no en la caja blanca)
    rootEl.addEventListener('click', (e) => {
      if (e.target === rootEl) _closeActiveConfirmDialog(false);
    });
  });
}
