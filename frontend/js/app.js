document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      nav.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", nav.classList.contains("is-open"));
    });
  }
});
