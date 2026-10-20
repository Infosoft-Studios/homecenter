const appGrid = document.querySelector("#app-grid");
const appCount = document.querySelector("#app-count");
const appsNote = document.querySelector("#apps-note");
const addAppForm = document.querySelector("#add-app-form");
const formMessage = document.querySelector("#form-message");
const storageKey = "homecenter.apps.v1";

const defaultApps = [
  { name: "Milo AI Friend", description: "Talk things through, explore ideas, and get unstuck.", initial: "M", style: "assistant", type: "internal", appUrl: null, webUrl: "#assistant" },
  { name: "ChatGPT", description: "A little help with anything.", initial: "C", style: "chatgpt", logo: "https://cdn.simpleicons.org/openai", appUrl: "chatgpt://", webUrl: "https://chatgpt.com/" },
  { name: "Zonoff", description: "Open Zonoff on the web.", initial: "Z", style: "zonoff", logo: "https://www.zonoff.com/favicon.ico", appUrl: null, webUrl: "https://www.zonoff.com/" },
  { name: "Instagram", description: "Your people and moments.", initial: "I", style: "instagram", logo: "https://cdn.simpleicons.org/instagram", appUrl: "instagram://app", webUrl: "https://www.instagram.com/" },
  { name: "YouTube", description: "Find something worth watching.", initial: "Y", style: "youtube", logo: "https://cdn.simpleicons.org/youtube/FF0000", appUrl: "youtube://", webUrl: "https://www.youtube.com/" }
];

let apps = [];

function safeWebUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function safeAppUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (["javascript:", "data:", "file:", "vbscript:", "blob:"].includes(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function renderApps() {
  appGrid.replaceChildren();
  appCount.textContent = `${apps.length.toString().padStart(2, "0")} apps`;

  for (const [index, app] of apps.entries()) {
    const link = document.createElement("a");
    link.className = "app-card";
    link.href = app.webUrl;
    link.dataset.appUrl = app.appUrl || "";
    link.dataset.appIndex = String(index);
    link.setAttribute("aria-label", `Open ${app.name}`);

    const icon = document.createElement("span");
    icon.className = `app-icon app-monogram icon-${app.style || "custom"}`;
    icon.setAttribute("aria-hidden", "true");
    const fallback = document.createElement("span");
    fallback.className = "app-logo-fallback";
    fallback.textContent = app.initial || app.name.charAt(0).toUpperCase();
    icon.append(fallback);
    const brandLogo = makeBrandLogo(app.style);
    if (brandLogo) {
      fallback.classList.add("is-hidden");
      icon.append(brandLogo);
    } else if (app.type !== "internal") {
      addRemoteLogo(icon, fallback, app);
    }

    const info = document.createElement("span");
    info.className = "app-info";
    const title = document.createElement("span");
    title.className = "app-title";
    title.textContent = app.name;
    const description = document.createElement("span");
    description.className = "app-description";
    description.textContent = app.description || new URL(app.webUrl).hostname;
    info.append(title, description);

    const arrow = document.createElement("span");
    arrow.className = "app-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    link.append(icon, info, arrow);
    appGrid.append(link);
  }
}

function saveApps() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(apps));
    return true;
  } catch {
    return false;
  }
}

function loadSavedApps(seedApps) {
  try {
    const savedApps = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!Array.isArray(savedApps)) return seedApps;
    const seedNames = new Set(seedApps.map((app) => app.name.toLowerCase()));
    const userApps = savedApps.filter((app) => !seedNames.has(String(app.name || "").toLowerCase()));
    return [...seedApps, ...userApps];
  } catch {
    return seedApps;
  }
}

function makeBrandLogo(style) {
  const svgNs = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("viewBox", "0 0 32 32");
  svg.setAttribute("class", "app-brand-svg");
  svg.setAttribute("aria-hidden", "true");

  if (style === "instagram") {
    const defs = document.createElementNS(svgNs, "defs");
    const gradient = document.createElementNS(svgNs, "linearGradient");
    gradient.setAttribute("id", "instagram-gradient");
    gradient.setAttribute("x1", "0");
    gradient.setAttribute("y1", "1");
    gradient.setAttribute("x2", "1");
    gradient.setAttribute("y2", "0");
    for (const [offset, color] of [["0%", "#ffb43d"], ["48%", "#e54572"], ["100%", "#7947c8"]]) {
      const stop = document.createElementNS(svgNs, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      gradient.append(stop);
    }
    defs.append(gradient);
    const tile = document.createElementNS(svgNs, "rect");
    tile.setAttribute("x", "1"); tile.setAttribute("y", "1"); tile.setAttribute("width", "30"); tile.setAttribute("height", "30"); tile.setAttribute("rx", "9"); tile.setAttribute("fill", "url(#instagram-gradient)");
    const camera = document.createElementNS(svgNs, "rect");
    camera.setAttribute("x", "7"); camera.setAttribute("y", "7"); camera.setAttribute("width", "18"); camera.setAttribute("height", "18"); camera.setAttribute("rx", "5"); camera.setAttribute("fill", "none"); camera.setAttribute("stroke", "white"); camera.setAttribute("stroke-width", "2");
    const lens = document.createElementNS(svgNs, "circle");
    lens.setAttribute("cx", "16"); lens.setAttribute("cy", "16"); lens.setAttribute("r", "4"); lens.setAttribute("fill", "none"); lens.setAttribute("stroke", "white"); lens.setAttribute("stroke-width", "2");
    const dot = document.createElementNS(svgNs, "circle");
    dot.setAttribute("cx", "21.5"); dot.setAttribute("cy", "10.5"); dot.setAttribute("r", "1.2"); dot.setAttribute("fill", "white");
    svg.append(defs, tile, camera, lens, dot);
    return svg;
  }

  if (style === "zonoff") {
    const tile = document.createElementNS(svgNs, "rect");
    tile.setAttribute("x", "1"); tile.setAttribute("y", "1"); tile.setAttribute("width", "30"); tile.setAttribute("height", "30"); tile.setAttribute("rx", "9"); tile.setAttribute("fill", "#446fd2");
    const letter = document.createElementNS(svgNs, "text");
    letter.setAttribute("x", "16"); letter.setAttribute("y", "23"); letter.setAttribute("text-anchor", "middle"); letter.setAttribute("font-family", "Arial, sans-serif"); letter.setAttribute("font-weight", "700"); letter.setAttribute("font-size", "21"); letter.setAttribute("fill", "white"); letter.textContent = "Z";
    svg.append(tile, letter);
    return svg;
  }

  if (style === "assistant") {
    const bubble = document.createElementNS(svgNs, "rect");
    bubble.setAttribute("x", "3"); bubble.setAttribute("y", "4"); bubble.setAttribute("width", "26"); bubble.setAttribute("height", "20"); bubble.setAttribute("rx", "8"); bubble.setAttribute("fill", "#637cdb");
    const tail = document.createElementNS(svgNs, "path");
    tail.setAttribute("d", "M10 23l-1 5 6-4"); tail.setAttribute("fill", "#637cdb");
    svg.append(bubble, tail);
    for (const x of [10, 16, 22]) {
      const dot = document.createElementNS(svgNs, "circle");
      dot.setAttribute("cx", String(x)); dot.setAttribute("cy", "14"); dot.setAttribute("r", "1.5"); dot.setAttribute("fill", "white");
      svg.append(dot);
    }
    return svg;
  }

  return null;
}

function addRemoteLogo(icon, fallback, app) {
  const webUrl = new URL(app.webUrl);
  const faviconUrl = new URL("/favicon.ico", webUrl).href;
  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(webUrl.hostname)}&sz=128`;
  const sources = [...new Set([safeWebUrl(app.logo), faviconUrl, googleFaviconUrl].filter(Boolean))];
  const logo = document.createElement("img");
  logo.className = "app-logo";
  logo.alt = "";
  logo.loading = "lazy";
  let currentSource = 0;
  logo.addEventListener("load", () => fallback.classList.add("is-hidden"));
  logo.addEventListener("error", () => {
    currentSource += 1;
    if (currentSource < sources.length) logo.src = sources[currentSource];
    else logo.remove();
  });
  logo.src = sources[currentSource];
  icon.append(logo);
}

appGrid.addEventListener("click", (event) => {
  const link = event.target.closest("a.app-card");
  if (!link || !link.dataset.appUrl || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  let appOpened = false;
  const stopFallback = () => { appOpened = true; };
  const onVisibilityChange = () => {
    if (document.hidden) stopFallback();
  };
  window.addEventListener("blur", stopFallback, { once: true });
  document.addEventListener("visibilitychange", onVisibilityChange, { once: true });

  window.location.href = link.dataset.appUrl;
  window.setTimeout(() => {
    window.removeEventListener("blur", stopFallback);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    if (!appOpened) window.location.href = link.href;
  }, 1400);
});

addAppForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(addAppForm);
  const name = String(formData.get("name") || "").trim();
  const webUrl = safeWebUrl(String(formData.get("webUrl") || "").trim());
  const rawAppUrl = String(formData.get("appUrl") || "").trim();
  const appUrl = safeAppUrl(rawAppUrl);
  const rawLogo = String(formData.get("logo") || "").trim();
  const logo = rawLogo ? safeWebUrl(rawLogo) : new URL("/favicon.ico", webUrl || "https://example.com/").href;

  if (!name || !webUrl) {
    formMessage.textContent = "Enter a name and a valid http or https website URL.";
    return;
  }
  if (rawAppUrl && !appUrl) {
    formMessage.textContent = "That app link is not valid. Enter a URL scheme such as spotify://.";
    return;
  }
  if (rawLogo && !safeWebUrl(rawLogo)) {
    formMessage.textContent = "Enter a valid http or https logo image URL.";
    return;
  }

  apps.push({
    name,
    description: "Your app, one click away.",
    initial: name.charAt(0).toUpperCase(),
    style: "custom",
    logo,
    appUrl,
    webUrl
  });
  renderApps();
  if (!saveApps()) {
    formMessage.textContent = "Added for this session, but browser storage is unavailable.";
    return;
  }

  addAppForm.reset();
  formMessage.textContent = `${name} added and saved in this browser.`;
});

fetch("apps.json")
  .then((response) => {
    if (!response.ok) throw new Error("Could not load apps.json");
    return response.json();
  })
  .then((seedApps) => {
    apps = loadSavedApps(seedApps);
    renderApps();
    appsNote.hidden = true;
  })
  .catch(() => {
    apps = loadSavedApps(defaultApps);
    renderApps();
    appsNote.hidden = false;
    appsNote.textContent = "Using the built-in app list. Open this page through a local web server to load apps.json.";
  });
