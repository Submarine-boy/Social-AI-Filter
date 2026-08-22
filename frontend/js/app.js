// Shared UI behaviour. Supabase configuration and ensureSupabaseLoaded()
// are provided by js/supabase.js, which must be loaded before this file.

const savedTheme = localStorage.getItem('sai-theme');
if (savedTheme === 'dark' || savedTheme === 'light') {
  document.documentElement.dataset.theme = savedTheme;
}

function setupMobileNavigation() {
  const sidebar = document.getElementById('sidebar');
  const menu = document.getElementById('menuButton');
  const overlay = document.getElementById('sidebarOverlay');

  if (!sidebar || !menu || !overlay) return;

  const closeNav = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    overlay.hidden = true;
    document.body.classList.remove('nav-open');
    menu.setAttribute('aria-expanded', 'false');
  };

  const openNav = () => {
    sidebar.classList.add('open');
    overlay.hidden = false;
    overlay.classList.add('show');
    document.body.classList.add('nav-open');
    menu.setAttribute('aria-expanded', 'true');
  };

  menu.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.innerWidth > 900) return;

    if (sidebar.classList.contains('open')) {
      closeNav();
    } else {
      openNav();
    }
  });

  overlay.addEventListener('click', closeNav);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });

  document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
    link.addEventListener('click', closeNav);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeNav();
  });

  closeNav();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupMobileNavigation, { once: true });
} else {
  setupMobileNavigation();
}
