// ═══════════════════════════════════════════════
//  APP · BOOT
//  Punto de entrada. Decide qué pantalla mostrar al
//  cargar: si ya hay un usuario en sesión, va directo
//  a la pantalla de proyectos (NUNCA directo a un
//  proyecto específico — eso es intencional).
// ═══════════════════════════════════════════════

initUserPicker();

if (currentUser) {
  document.getElementById('user-picker').classList.add('hidden');
  updateUserUI();
  showProjectsScreen();
}
