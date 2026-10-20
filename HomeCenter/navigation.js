const homeNav = document.querySelector("#home-nav");
const appsNav = document.querySelector("#apps-nav");
const homeView = document.querySelector("#home");

function updateDashboardView() {
  const showAppsOnly = window.location.hash === "#your-apps";
  const showAssistant = window.location.hash === "#assistant";
  homeView.classList.toggle("apps-only", showAppsOnly);
  homeView.classList.toggle("assistant-only", showAssistant);
  homeNav.classList.toggle("active", !showAppsOnly && !showAssistant);
  appsNav.classList.toggle("active", showAppsOnly);

  if (showAppsOnly) {
    homeNav.removeAttribute("aria-current");
    appsNav.setAttribute("aria-current", "page");
  } else {
    appsNav.removeAttribute("aria-current");
    if (showAssistant) homeNav.removeAttribute("aria-current");
    else homeNav.setAttribute("aria-current", "page");
  }
}

window.addEventListener("hashchange", updateDashboardView);
updateDashboardView();
