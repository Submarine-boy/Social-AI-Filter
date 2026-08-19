document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("#login-form");
  const signupForm = document.querySelector("#signup-form");
  const message = document.querySelector("#auth-message");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      window.location.href = "dashboard.html";
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(signupForm);
      if (data.get("password") !== data.get("confirmPassword")) {
        if (message) message.textContent = "Passwords do not match.";
        return;
      }
      window.location.href = "dashboard.html";
    });
  }
});
