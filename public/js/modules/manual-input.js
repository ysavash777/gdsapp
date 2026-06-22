// ═══════════════════════════════════════════════
//  MODULES · MANUAL INPUT
//  Campo de texto para ingresar referencia/código
//  manualmente, como alternativa a la cámara.
// ═══════════════════════════════════════════════

function processManual() {
  const input = document.getElementById('manual-input');
  if (input.value.trim()) processCode(input.value.trim());
  input.value = '';
}

document.getElementById('manual-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') processManual();
});
