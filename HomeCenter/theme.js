const themeToggle = document.querySelector("#theme-toggle");
const themeColor = document.querySelector('meta[name="theme-color"]');

function setTheme(theme, persist = false) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  if (themeColor) themeColor.setAttribute("content", isDark ? "#080f20" : "#f5f8ff");

  if (persist) {
    try {
      localStorage.setItem("homecenter.theme", isDark ? "dark" : "light");
    } catch { /* The theme still works for this page view if storage is blocked. */ }
  }
}

setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  setTheme(nextTheme, true);
});
