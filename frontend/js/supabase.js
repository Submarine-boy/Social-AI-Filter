const SUPABASE_URL = "https://wfypcyxogxqdmobvyzdg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lnR1MO-JdfcASAzhvfI37g_PP3G7hGw";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
