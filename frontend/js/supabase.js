const SUPABASE_URL = "https://wfypcyxogxqdmobvyzdg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lnR1MO-JdfcASAzhvfI37g_PP3G7hGw";

function getSupabaseClient() {
  if (window.__socialAiSupabase) return window.__socialAiSupabase;
  if (!window.supabase?.createClient) throw new Error("Supabase client is not loaded.");
  window.__socialAiSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return window.__socialAiSupabase;
}

async function ensureSupabaseLoaded() {
  if (window.supabase?.createClient) return getSupabaseClient();
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Unable to load authentication service."));
    document.head.appendChild(script);
  });
  return getSupabaseClient();
}
