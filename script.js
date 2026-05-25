const authToggleButtons = document.querySelectorAll("[data-auth-target]");
const authPanels = document.querySelectorAll(".center-auth");
const emailToggleButtons = document.querySelectorAll("[data-toggle-email]");
const brandHomeLink = document.querySelector("[data-brand-home]");
const accountPanel = document.getElementById("account-panel");
const accountWrap = document.querySelector("[data-account-wrap]");
const accountChip = document.querySelector("[data-account-chip]");
const accountAvatar = document.querySelector("[data-account-avatar]");
const accountIcon = document.querySelector("[data-account-icon]");
const closeAccountButton = document.querySelector("[data-close-account-button]");
const logoutButton = document.querySelector("[data-logout-button]");
const deleteAccountButton = document.querySelector("[data-delete-account-button]");
const accountPictureUpload = document.querySelector("[data-account-picture-upload]");
const accountName = document.querySelector("[data-account-name]");
const accountPanelName = document.querySelector("[data-account-panel-name]");
const accountPanelAvatar = document.querySelector("[data-account-panel-avatar]");
const loginForms = document.querySelectorAll('#login-panel form');
const signupForms = document.querySelectorAll('#signup-panel form');
const pageBody = document.body;
const REMEMBERED_USER_KEY = "cloverfinder-remembered-user";
const USERS_KEY = "cloverfinder-users";
let activeUsername = "";

function getStoredUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getUserByUsername(username) {
  if (!username) return null;
  const users = getStoredUsers();
  return users.find((user) => user.username === username) || null;
}

function setActiveUser(username, rememberUser) {
  activeUsername = username || "";

  if (rememberUser && username) {
    localStorage.setItem(REMEMBERED_USER_KEY, username);
  } else {
    localStorage.removeItem(REMEMBERED_USER_KEY);
  }
}

function setProfilePicture(photoDataUrl) {
  if (!accountAvatar || !accountIcon || !accountPanelAvatar) return;

  if (photoDataUrl) {
    accountAvatar.src = photoDataUrl;
    accountPanelAvatar.src = photoDataUrl;
    accountAvatar.classList.remove("is-hidden");
    accountPanelAvatar.classList.remove("is-hidden");
    accountIcon.classList.add("is-hidden");
  } else {
    accountAvatar.removeAttribute("src");
    accountPanelAvatar.removeAttribute("src");
    accountAvatar.classList.add("is-hidden");
    accountPanelAvatar.classList.add("is-hidden");
    accountIcon.classList.remove("is-hidden");
  }
}

function setAccountChip(username) {
  if (!accountWrap || !accountChip || !accountName || !accountPanelName) return;
  const user = getUserByUsername(username);
  setProfilePicture(user ? user.profilePicture : "");

  if (username) {
    accountName.textContent = username;
    accountPanelName.textContent = username;
    accountWrap.classList.remove("is-hidden");
  } else {
    accountName.textContent = "Your Account Name";
    accountPanelName.textContent = "Your Account Name";
    accountWrap.classList.add("is-hidden");
  }
}

function closeAuthPanels() {
  authPanels.forEach((panel) => panel.classList.remove("active"));
  pageBody.classList.remove("auth-view");
}

authToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-auth-target");
    const targetPanel = document.getElementById(targetId);
    const shouldOpen = targetPanel && !targetPanel.classList.contains("active");

    closeAuthPanels();
    if (shouldOpen && targetPanel) {
      targetPanel.classList.add("active");
      pageBody.classList.add("auth-view");
    }
  });
});

emailToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const form = button.closest("form");
    if (!form) return;

    const emailInput = form.querySelector('input[name="email"]');
    if (!emailInput) return;

    const emailIsEnabled = !emailInput.disabled;
    emailInput.disabled = emailIsEnabled;
    emailInput.required = false;

    if (emailIsEnabled) {
      emailInput.value = "";
      emailInput.placeholder = "Email disabled";
      button.textContent = "Use my email account";
    } else {
      emailInput.placeholder = "";
      button.textContent = "Don't use my email account";
    }
  });
});

if (brandHomeLink) {
  brandHomeLink.addEventListener("click", () => {
    closeAuthPanels();
  });
}

signupForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = form.querySelector('input[name="username"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const verifyPasswordInput = form.querySelector('input[name="verify-password"]');
    const rememberInput = form.querySelector('input[name="remember-signup"]');

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const verifyPassword = verifyPasswordInput ? verifyPasswordInput.value : "";
    const remember = rememberInput ? rememberInput.checked : false;

    if (!username || !password || !verifyPassword) return;

    if (password !== verifyPassword) {
      verifyPasswordInput.setCustomValidity("Passwords do not match.");
      verifyPasswordInput.reportValidity();
      return;
    }

    verifyPasswordInput.setCustomValidity("");

    const users = getStoredUsers();
    const usernameTaken = users.some((user) => user.username === username);
    if (usernameTaken) {
      usernameInput.setCustomValidity("That username already exists.");
      usernameInput.reportValidity();
      return;
    }

    usernameInput.setCustomValidity("");
    users.push({ username, password, profilePicture: "" });
    saveStoredUsers(users);

    setActiveUser(username, remember);
    setAccountChip(username);
    closeAuthPanels();
  });
});

if (accountChip && accountWrap) {
  accountChip.addEventListener("click", () => {
    closeAuthPanels();
    if (accountPanel) {
      accountPanel.classList.add("active");
      pageBody.classList.add("auth-view");
    }
  });
}

if (closeAccountButton) {
  closeAccountButton.addEventListener("click", () => {
    closeAuthPanels();
  });
}

if (logoutButton && accountWrap) {
  logoutButton.addEventListener("click", () => {
    setActiveUser("", false);
    setAccountChip("");
    closeAuthPanels();
  });
}

if (deleteAccountButton && accountWrap) {
  deleteAccountButton.addEventListener("click", () => {
    const usernameToDelete = activeUsername || localStorage.getItem(REMEMBERED_USER_KEY);
    if (!usernameToDelete) return;

    const shouldDelete = window.confirm(
      "Delete this account permanently? This cannot be undone."
    );
    if (!shouldDelete) return;

    const users = getStoredUsers();
    const filteredUsers = users.filter((user) => user.username !== usernameToDelete);
    saveStoredUsers(filteredUsers);
    setActiveUser("", false);
    setAccountChip("");
    closeAuthPanels();
  });
}

if (accountPictureUpload) {
  accountPictureUpload.addEventListener("change", () => {
    const username = activeUsername || localStorage.getItem(REMEMBERED_USER_KEY);
    const file = accountPictureUpload.files && accountPictureUpload.files[0];
    if (!username || !file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const users = getStoredUsers();
      const index = users.findIndex((user) => user.username === username);
      if (index === -1) return;

      users[index].profilePicture = String(reader.result || "");
      saveStoredUsers(users);
      setProfilePicture(users[index].profilePicture);
    };
    reader.readAsDataURL(file);
  });
}

loginForms.forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const usernameInput = form.querySelector('input[name="username"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const rememberInput = form.querySelector('input[name="remember"]');
    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const remember = rememberInput ? rememberInput.checked : false;

    if (!username || !password) return;

    const users = getStoredUsers();
    const matchingUser = users.find(
      (user) => user.username === username && user.password === password
    );
    if (!matchingUser) {
      passwordInput.setCustomValidity("Username or password is incorrect.");
      passwordInput.reportValidity();
      return;
    }

    passwordInput.setCustomValidity("");

    setActiveUser(username, remember);
    setAccountChip(username);
    closeAuthPanels();
  });
});

setActiveUser(localStorage.getItem(REMEMBERED_USER_KEY), true);
setAccountChip(activeUsername);
