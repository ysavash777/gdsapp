// ═══════════════════════════════════════════════
//  MODULES · USERS
//  Selección de usuario (Agus, Santi, Sofi, Mati, Joan).
//  USERS y currentUser viven en core/state.js
// ═══════════════════════════════════════════════

function initUserPicker() {
  const grid = document.getElementById('picker-grid');
  grid.innerHTML = USERS.map(u => `
    <button type="button" class="picker-btn" data-user="${u}">
      <div class="pb-avatar">${u[0]}</div>
      <span class="pb-name">${u}</span>
    </button>`).join('');

  grid.addEventListener('click', (evt) => {
    const btn = evt.target.closest('[data-user]');
    if (!btn) return;
    selectUser(btn.dataset.user);
  });
}

function selectUser(name) {
  currentUser = name;
  sessionStorage.setItem('mapix_user', name);
  document.getElementById('user-picker').classList.add('hidden');
  updateUserUI();
  showProjectsScreen();
}

function changeUser() {
  document.getElementById('user-picker').classList.remove('hidden');
}

function updateUserUI() {
  const initials = currentUser ? currentUser[0] : '?';
  document.getElementById('proj-user-avatar').textContent = initials;
  document.getElementById('proj-user-name').textContent   = currentUser || '—';
  document.getElementById('header-avatar').textContent    = initials;
  document.getElementById('header-uname').textContent     = currentUser || '—';
}
