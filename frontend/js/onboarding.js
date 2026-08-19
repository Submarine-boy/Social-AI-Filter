document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("creator-profile-form");
  const message = document.getElementById("profile-message");
  if (!form) return;

  try {
    const client = await ensureSupabaseLoaded();
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) {
      window.location.href = "login.html";
      return;
    }

    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("content_description, content_topics, creator_type")
      .eq("id", user.id)
      .single();

    if (!profileError && profile) {
      form.content_description.value = profile.content_description || "";
      form.content_topics.value = profile.content_topics || "";
      form.creator_type.value = profile.creator_type || "";
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = form.querySelector("button[type=submit]");
      const data = new FormData(form);

      if (button) {
        button.disabled = true;
        button.textContent = "Saving...";
      }
      message.textContent = "";

      const { error } = await client.from("profiles").update({
        content_description: String(data.get("content_description") || "").trim(),
        content_topics: String(data.get("content_topics") || "").trim(),
        creator_type: String(data.get("creator_type") || "").trim(),
        onboarding_completed: true
      }).eq("id", user.id);

      if (error) {
        message.textContent = error.message;
        if (button) {
          button.disabled = false;
          button.textContent = "Continue to dashboard";
        }
        return;
      }

      window.location.href = "dashboard.html";
    });
  } catch (error) {
    message.textContent = error.message || "Unable to load your profile.";
  }
});
