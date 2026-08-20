const SUPABASE_URL = "https://wfypcyxogxqdmobvyzdg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_lnR1MO-JdfcASAzhvfI37g_PP3G7hGw";
const EMAIL_REDIRECT_URL = "https://social-ai-filter.vercel.app/dashboard.html";
const PASSWORD_RESET_REDIRECT_URL = "https://social-ai-filter.vercel.app/update-password.html";

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

function resetButton(button, text) {
  if (!button) return;
  button.disabled = false;
  button.textContent = text;
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
  const forgotForm = document.querySelector("#forgot-form");
  const updatePasswordForm = document.querySelector("#update-password-form");

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
        if (error || !result.user) {
          setAuthMessage("Incorrect email or password. Please try again.");
          resetButton(button, "Login");
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
          options: {
            data: { full_name: fullName },
            emailRedirectTo: EMAIL_REDIRECT_URL
          }
        });

        if (error) {
          setAuthMessage(error.message);
          resetButton(button, "Create Account");
          return;
        }

        if (result.session && result.user) {
          await routeAfterAuth(client, result.user);
          return;
        }

        setAuthMessage("Account created. Check your email and click the confirmation link to continue to your dashboard.", false);
        signupForm.reset();
        resetButton(button, "Create Account");
      });
    }

    if (forgotForm) {
      forgotForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = forgotForm.querySelector("button[type=submit]");
        const email = String(new FormData(forgotForm).get("email") || "").trim();
        if (button) { button.disabled = true; button.textContent = "Sending..."; }
        setAuthMessage("", false);

        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: PASSWORD_RESET_REDIRECT_URL
        });

        if (error) {
          setAuthMessage(error.message);
          resetButton(button, "Send Reset Link");
          return;
        }

        setAuthMessage("If an account exists for this email, a password reset link has been sent. Check your inbox.", false);
        resetButton(button, "Send Reset Link");
      });
    }

    if (updatePasswordForm) {
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        setAuthMessage("Open this page using the password reset link sent to your email.");
      }

      updatePasswordForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = updatePasswordForm.querySelector("button[type=submit]");
        const data = new FormData(updatePasswordForm);
        const password = String(data.get("password") || "");
        const confirmPassword = String(data.get("confirmPassword") || "");

        if (password.length < 6) {
          setAuthMessage("Your new password must be at least 6 characters long.");
          return;
        }
        if (password !== confirmPassword) {
          setAuthMessage("Passwords do not match.");
          return;
        }

        if (button) { button.disabled = true; button.textContent = "Updating..."; }
        setAuthMessage("", false);
        const { error } = await client.auth.updateUser({ password });

        if (error) {
          setAuthMessage(error.message);
          resetButton(button, "Update Password");
          return;
        }

        setAuthMessage("Password updated successfully. Redirecting to login...", false);
        await client.auth.signOut();
        setTimeout(() => { window.location.href = "login.html"; }, 1200);
      });
    }
  } catch (error) {
    setAuthMessage(error.message || "Authentication is currently unavailable.");
  }
});
