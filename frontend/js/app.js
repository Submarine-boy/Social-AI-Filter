const SUPABASE_URL = "https://wfypcyxogxqdmobvyzdg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lnR1MO-JdfcASAzhvfI37g_PP3G7hGw";

function ensureSupabaseLoaded() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) return resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = () => window.supabase?.createClient ? resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)) : reject(new Error("Supabase client failed to initialize."));
    script.onerror = () => reject(new Error("Unable to load Supabase."));
    document.head.appendChild(script);
  });
}

const savedTheme = localStorage.getItem('sai-theme');
if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.dataset.theme = savedTheme;

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

  menu.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (window.innerWidth > 900) return;
    sidebar.classList.contains('open') ? closeNav() : openNav();
  };

  overlay.onclick = closeNav;
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeNav(); });
  document.querySelectorAll('.sidebar .nav-link').forEach((link) => link.addEventListener('click', closeNav));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeNav(); });
  closeNav();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupMobileNavigation);
else setupMobileNavigation();
