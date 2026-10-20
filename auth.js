const authDialog = document.querySelector("#auth-dialog");
const authForm = document.querySelector("#auth-form");
const authTitle = document.querySelector("#auth-title");
const authIntro = document.querySelector("#auth-intro");
const authSubmit = document.querySelector("#auth-submit");
const authSwitch = document.querySelector("#auth-switch");
const authSwitchCopy = document.querySelector("#auth-switch-copy");
const authMessage = document.querySelector("#auth-message");
const profileButton = document.querySelector("#profile-button");
const profileAvatar = document.querySelector("#profile-avatar");
const profileName = document.querySelector("#profile-name");
const emailInput = document.querySelector("#auth-email");
const passwordInput = document.querySelector("#auth-password");
const rememberInput = document.querySelector("#remember-me");

const rememberedKey = "homecenter.profile.remembered";
const sessionKey = "homecenter.profile.session";
let isCreatingAccount = false;

function getSignedInEmail() {
  try {
    return localStorage.getItem(rememberedKey) || sessionStorage.getItem(sessionKey) || "";
  } catch {
    return "";
  }
}

function hasRememberedEmail() {
  try {
    return Boolean(localStorage.getItem(rememberedKey));
  } catch {
    return false;
  }
}

function renderProfile(email) {
  if (!email) {
    profileAvatar.textContent = "?";
    profileName.textContent = "Log in";
    profileButton.setAttribute("aria-label", "Log in to HomeCenter");
    return;
  }

  const name = email.split("@")[0];
  profileAvatar.textContent = (name.charAt(0) || "H").toUpperCase();
  profileName.textContent = name;
  profileButton.setAttribute("aria-label", "Sign out of HomeCenter");
}

function openSignIn() {
  isCreatingAccount = false;
  updateAuthMode();
  authMessage.textContent = "";
  emailInput.value = getSignedInEmail();
  passwordInput.value = "";
  rememberInput.checked = hasRememberedEmail();
  authDialog.showModal();
  emailInput.focus();
}

function updateAuthMode() {
  authTitle.textContent = isCreatingAccount ? "Create your profile" : "Sign in";
  authIntro.textContent = isCreatingAccount ? "Set up your HomeCenter profile on this device." : "Log in to pick up where you left off.";
  authSubmit.textContent = isCreatingAccount ? "Create profile" : "Log in";
  authSwitchCopy.textContent = isCreatingAccount ? "Already have a profile?" : "New to HomeCenter?";
  authSwitch.textContent = isCreatingAccount ? "Sign in" : "Create an account";
  passwordInput.autocomplete = isCreatingAccount ? "new-password" : "current-password";
}

profileButton.addEventListener("click", () => {
  if (getSignedInEmail()) {
    try {
      localStorage.removeItem(rememberedKey);
      sessionStorage.removeItem(sessionKey);
    } catch { /* Storage may be unavailable in restricted browser contexts. */ }
    renderProfile("");
  } else {
    openSignIn();
  }
});

document.querySelector("#auth-close").addEventListener("click", () => authDialog.close());

authSwitch.addEventListener("click", () => {
  isCreatingAccount = !isCreatingAccount;
  authMessage.textContent = "";
  updateAuthMode();
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  if (!email || password.length < 4) {
    authMessage.textContent = "Enter a valid email and a password of at least 4 characters.";
    return;
  }

  try {
    if (rememberInput.checked) {
      localStorage.setItem(rememberedKey, email);
      sessionStorage.removeItem(sessionKey);
    } else {
      localStorage.removeItem(rememberedKey);
      sessionStorage.setItem(sessionKey, email);
    }
    renderProfile(email);
    authDialog.close();
    passwordInput.value = "";
  } catch {
    authMessage.textContent = "Browser storage is unavailable, so this profile cannot be remembered.";
  }
});

renderProfile(getSignedInEmail());
