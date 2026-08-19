const SUPABASE_URL = "https://wfypcyxogxqdmobvyzdg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lnR1MO-JdfcASAzhvfI37g_PP3G7hGw";

function loadSupabase() {
  return new Promise((resolve, reject) => {
    if (window.supabase) return resolve(window.supabase);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload = () => resolve(window.supabase);
    script.onerror = () => reject(new Error("Unable to load authentication service."));
    document.head.appendChild(script);
  });
}

function setAuthMessage(message, isError = true) {
  const element = document.querySelector("#auth-message");
  if (!element) return;
  element.textContent = message;
  element.style.color = isError ? "var(--danger, #dc2626)" : "var(--accent, #2563eb)";
}

async function routeAfterAuth(client, user) {
  const { data: profile } = await client
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  window.location.href = profile?.onboarding_completed ? "dashboard.html" : "onboarding.html";
}

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.querySelector("#login-form");
  const signupForm = document.querySelector("#signup-form");

  try {
    const supabaseLib = await loadSupabase();
    const client = supabaseLib.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

    if (loginForm) {
      loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = loginForm.querySelector("button[type=submit]");
        const data = new FormData(loginForm);
        const email = String(data.get("email") || "").trim();
        const password = String(data.get("password") || "");

        if (button) { button.disabled = true; button.textContent = "Signing in..."; }
        setAuthMessage("", false);

        const { data: result, error } = await client.auth.signInWithPassword({ email, password });
        if (error) {
          setAuthMessage(error.message);
          if (button) { button.disabled = false; button.textContent = "Login"; }
          return;
        }

        await routeAfterAuth(client, result.user);
      });
    }

    if (signupForm) {
      signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = signupForm.querySelector("button[type=submit]");
        const data = new FormData(signupForm);
        const fullName = String(data.get("name") || "").trim();
        const email = String(data.get("email") || "").trim();
        const password = String(data.get("password") || "");
        const confirmPassword = String(data.get("confirmPassword") || "");

        if (password !== confirmPassword) {
          setAuthMessage("Passwords do not match.");
          return;
        }

        if (button) { button.disabled = true; button.textContent = "Creating account..."; }
        setAuthMessage("", false);

        const { data: result, error } = await client.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });

        if (error) {
          setAuthMessage(error.message);
          if (button) { button.disabled = false; button.textContent = "Create Account"; }
          return;
        }

        if (result.session && result.user) {
          await routeAfterAuth(client, result.user);
          return;
        }

        setAuthMessage("Account created. Check your email to confirm your account before logging in.", false);
        signupForm.reset();
        if (button) { button.disabled = false; button.textContent = "Create Account"; }
      });
    }
  } catch (error) {
    setAuthMessage(error.message || "Authentication is currently unavailable.");
  }
});
