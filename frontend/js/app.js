// Shared UI behaviour. Supabase configuration and ensureSupabaseLoaded() are provided by js/supabase.js.

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

  menu.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (window.innerWidth > 900) return;
    sidebar.classList.contains('open') ? closeNav() : openNav();
  });
  overlay.addEventListener('click', closeNav);
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeNav(); });
  document.querySelectorAll('.sidebar .nav-link').forEach(link => link.addEventListener('click', closeNav));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeNav(); });
  closeNav();
}

async function loadSharedProfile() {
  const nameEl = document.getElementById('sidebarName');
  const typeEl = document.getElementById('sidebarCreatorType');
  const avatarEls = document.querySelectorAll('#sidebarAvatar, #sidebarProfileAvatar');
  if (!nameEl && !typeEl && !avatarEls.length) return;

  try {
    const client = await ensureSupabaseLoaded();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return;
    const { data: profile, error } = await client.from('profiles')
      .select('full_name, username, avatar_url, creator_type')
      .eq('id', user.id).maybeSingle();
    if (error) throw error;

    const name = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Creator';
    const creatorType = profile?.creator_type || 'Creator';
    const initial = name.trim().charAt(0).toUpperCase() || '?';
    if (nameEl) nameEl.textContent = name;
    if (typeEl) typeEl.textContent = creatorType;
    avatarEls.forEach(el => {
      el.textContent = initial;
      if (profile?.avatar_url) el.style.backgroundImage = `url("${profile.avatar_url}")`;
    });
  } catch (error) {
    console.error('Unable to load shared profile:', error);
  }
}

function initializeSharedUI() {
  setupMobileNavigation();
  loadSharedProfile();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeSharedUI, { once: true });
else initializeSharedUI();
