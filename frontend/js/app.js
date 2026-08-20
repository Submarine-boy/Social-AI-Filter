const SUPABASE_URL = "https://wfypcyxogxqdmobvyzdg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lnR1MO-JdfcASAzhvfI37g_PP3G7hGw";

function ensureSupabaseLoaded() {
  return new Promise((resolve, reject) => {
    if (window.supabase?.createClient) {
      return resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
    }
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = () => {
      if (!window.supabase?.createClient) return reject(new Error("Supabase client failed to initialize."));
      resolve(window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY));
    };
    script.onerror = () => reject(new Error("Unable to load Supabase."));
    document.head.appendChild(script);
  });
}

const savedTheme = localStorage.getItem('sai-theme');
if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.dataset.theme = savedTheme;

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const menu = document.getElementById('menuButton');
  const overlay = document.getElementById('sidebarOverlay');
  const close = () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('show');
    document.body.classList.remove('nav-open');
    menu?.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    sidebar?.classList.add('open');
    overlay?.classList.add('show');
    document.body.classList.add('nav-open');
    menu?.setAttribute('aria-expanded', 'true');
  };
  menu?.addEventListener('click', () => sidebar?.classList.contains('open') ? close() : open());
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) close(); });
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', close));
});
