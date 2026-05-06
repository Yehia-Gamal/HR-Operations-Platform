import { endpoints, unwrap } from "./api.js?v=v31-production-deploy-ready-keep-dev-files";
import { enableWebPushSubscription } from "./push.js?v=v31-production-deploy-ready-keep-dev-files";
import { getDeviceFingerprintHash, requestEmployeePasskey, filterEmployeePasskeys, calculateAttendanceRisk, rememberDevicePunch } from "./attendance-identity.js?v=v31-production-deploy-ready-keep-dev-files";
import { ensureAttendancePolicyAcknowledged, ensureTrustedDeviceApproval, requestBranchQrChallenge, analyzeLocationTrust, mergeRiskSignals, submitFallbackAttendanceRequest } from "./attendance-v3-security.js?v=v31-production-deploy-ready-keep-dev-files";
import { evaluateAttendanceV4Controls, mergeV4RiskSignals, createFormalFallbackRequest } from "./attendance-v4-ops.js?v=v31-production-deploy-ready-keep-dev-files";

document.documentElement.classList.add("employee-portal-root");
document.body.classList.add("employee-portal");

const app = document.querySelector("#app");
const FLASH_KEY = "hr.employee.flash";
const IDLE_MS = 30 * 60 * 1000;
let idleTimer = null;
const state = {
  route: location.hash.replace("#", "") || "home",
  user: null,
  message: "",
  error: "",
  loginIdentifier: localStorage.getItem("hr.login.lastIdentifier") || "",
  loginPassword: "",
  lastLoginFailed: false,
  recoveryMode: location.hash.includes("type=recovery") || location.search.includes("type=recovery"),
  registerMode: false,
};

const adminScopes = new Set(["*", "users:manage", "employees:write", "settings:manage", "audit:view"]);
const fullAccessRoles = new Set(["admin", "super-admin", "super_admin", "role-admin", "executive-secretary", "role-executive-secretary", "Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…", "Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ"]);
const executiveOnlyRoles = new Set(["executive", "role-executive", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ"]);
const legacyEmployeeRoutes = [
  ["home", "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©", "âŒ‚"],
  ["action-center", "Ù…Ø·Ù„ÙˆØ¨ Ù…Ù†ÙŠ", "â˜…"],
  ["kpi", "ØªÙ‚ÙŠÙŠÙ…ÙŠ", "â—Ž"],
  ["punch", "Ø§Ù„Ø¨ØµÙ…Ø©", "â—‰"],
  ["location", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "âŒ–"],
  ["leaves", "Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª", "âœ¦"],
  ["missions", "Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª", "â‡„"],
  ["requests", "Ø·Ù„Ø¨Ø§ØªÙŠ", "â˜°"],
  ["tasks", "Ù…Ù‡Ø§Ù…ÙŠ", "âœ“"],
  ["daily-report", "ØªÙ‚Ø±ÙŠØ±ÙŠ", "âœŽ"],
  ["documents", "Ù…Ø³ØªÙ†Ø¯Ø§ØªÙŠ", "â–£"],
  ["policies", "Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª", "Â§"],
  ["disputes", "Ø´ÙƒÙˆÙ‰", "!"],
  ["notifications", "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª", "â—"],
  ["profile", "Ø­Ø³Ø§Ø¨ÙŠ", "â˜º"],
];

const employeeRoutes = [
  ["home", "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©", "ðŸ "],
  ["action-center", "Ù…Ø·Ù„ÙˆØ¨ Ù…Ù†ÙŠ", "âš¡"],
  ["punch", "Ø§Ù„Ø¨ØµÙ…Ø©", "ðŸ‘"],
  ["notifications", "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª", "ðŸ””"],
  ["more", "Ø§Ù„Ù…Ø²ÙŠØ¯", "â˜°"],
];

const moreEmployeeRoutes = [
  ["kpi", "ØªÙ‚ÙŠÙŠÙ…ÙŠ", "â­"],
  ["leaves", "Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª", "ðŸ–"],
  ["missions", "Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª", "ðŸš—"],
  ["requests", "Ø·Ù„Ø¨Ø§ØªÙŠ", "ðŸ“‹"],
  ["tasks", "Ù…Ù‡Ø§Ù…ÙŠ", "âœ…"],
  ["daily-report", "ØªÙ‚Ø±ÙŠØ±ÙŠ", "ðŸ“"],
  ["documents", "Ù…Ø³ØªÙ†Ø¯Ø§ØªÙŠ", "ðŸ“"],
  ["policies", "Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª", "ðŸ“œ"],
  ["decisions", "Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª", "ðŸ“¢"],
  ["disputes", "Ø´ÙƒÙˆÙ‰", "âš ï¸"],
  ["location", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "ðŸ“"],
  ["profile", "Ø­Ø³Ø§Ø¨ÙŠ", "ðŸ‘¤"],
  ["team", "ÙØ±ÙŠÙ‚ÙŠ", "ðŸ‘¥"],
];

const routeSubtitles = {
  home: "Ù…Ù„Ø®Øµ ÙŠÙˆÙ…ÙƒØŒ Ø§Ø®ØªØµØ§Ø±Ø§Øª Ø³Ø±ÙŠØ¹Ø©ØŒ ÙˆØ¢Ø®Ø± Ù†Ø´Ø§Ø·Ø§ØªÙƒ.",
  "action-center": "ÙƒÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ù…Ù†Ùƒ Ø§Ù„Ø¢Ù† ÙÙŠ Ø´Ø§Ø´Ø© ÙˆØ§Ø­Ø¯Ø©: Ù…ÙˆÙ‚Ø¹ØŒ Ø³ÙŠØ§Ø³Ø©ØŒ Ù…Ù‡Ù…Ø©ØŒ Ø£Ùˆ Ø¨ØµÙ…Ø©.",
  kpi: "Ù‚ÙŠÙ‘Ù… Ù†ÙØ³Ùƒ Ø´Ù‡Ø±ÙŠÙ‹Ø§ Ø«Ù… Ø§Ø±ÙØ¹ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ù„Ù…Ø¯ÙŠØ±Ùƒ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ø§Ø¹ØªÙ…Ø§Ø¯.",
  punch: "Ø³Ø¬Ù‘Ù„ Ø­Ø¶ÙˆØ±Ùƒ Ø£Ùˆ Ø§Ù†ØµØ±Ø§ÙÙƒ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¨Ø¹Ø¯ Ù‚Ø±Ø§Ø¡Ø© GPS.",
  location: "Ø£Ø±Ø³Ù„ Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¹Ù†Ø¯ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø¨Ø¶ØºØ·Ø© ÙˆØ§Ø­Ø¯Ø©.",
  leaves: "Ù‚Ø¯Ù‘Ù… Ø·Ù„Ø¨ Ø¥Ø¬Ø§Ø²Ø© ÙˆØªØ§Ø¨Ø¹ Ø­Ø§Ù„ØªÙ‡ Ø¨Ø¯ÙˆÙ† Ø£ÙˆØ±Ø§Ù‚.",
  missions: "Ù‚Ø¯Ù‘Ù… Ø·Ù„Ø¨ Ù…Ø£Ù…ÙˆØ±ÙŠØ© ÙˆØªØ§Ø¨Ø¹ Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.",
  requests: "ØªØ§Ø¨Ø¹ ÙƒÙ„ Ø·Ù„Ø¨Ø§ØªÙƒ Ù…Ù† Ø¥Ø¬Ø§Ø²Ø§Øª ÙˆÙ…Ø£Ù…ÙˆØ±ÙŠØ§Øª ÙˆÙ…ÙˆØ§Ù‚Ø¹ ÙˆØªØ¹Ø¯ÙŠÙ„Ø§Øª.",
  tasks: "ØªØ§Ø¨Ø¹ Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ù…ÙƒÙ„Ù Ø¨Ù‡Ø§ ÙˆØ­Ø¯Ù‘Ø« Ø­Ø§Ù„ØªÙ‡Ø§.",
  "daily-report": "Ø£Ø±Ø³Ù„ ØªÙ‚Ø±ÙŠØ± Ø¥Ù†Ø¬Ø§Ø²Ùƒ Ø§Ù„ÙŠÙˆÙ…ÙŠ ÙˆØ§Ù„Ø¹ÙˆØ§Ø¦Ù‚ ÙˆØ§Ø­ØªÙŠØ§Ø¬Ø§Øª Ø§Ù„Ø¯Ø¹Ù….",
  documents: "Ù…Ø³ØªÙ†Ø¯Ø§ØªÙƒ Ø§Ù„Ø´Ø®ØµÙŠØ© ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø®Ø§ØµØ© Ø¨Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©.",
  policies: "Ø§Ù‚Ø±Ø£ Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø¬Ù…Ø¹ÙŠØ© ÙˆÙˆÙ‚Ù‘Ø¹ Ø¹Ù„ÙŠÙ‡Ø§ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠÙ‹Ø§.",
  decisions: "Ù‚Ø±Ø§Ø±Ø§Øª Ø¥Ø¯Ø§Ø±ÙŠØ© Ø±Ø³Ù…ÙŠØ© ØªØ­ØªØ§Ø¬ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø§Ø·Ù„Ø§Ø¹ Ù…Ø¹ ØªÙˆÙ‚ÙŠØª Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©.",
  disputes: "Ø§Ø±ÙØ¹ Ø´ÙƒÙˆÙ‰ Ø£Ùˆ Ø·Ù„Ø¨ ÙØ¶ Ø®Ù„Ø§Ù Ù„Ù„Ø¬Ù†Ø© Ø§Ù„Ù…Ø®ØªØµØ©.",
  notifications: "ÙƒÙ„ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ù‡Ù…Ø© ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯.",
  profile: "Ø¨ÙŠØ§Ù†Ø§Øª Ø­Ø³Ø§Ø¨Ùƒ ÙˆÙˆØ³Ø§Ø¦Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±.",
  team: "Ø¥Ø¯Ø§Ø±Ø© ÙØ±ÙŠÙ‚Ùƒ ÙˆØ·Ù„Ø¨Ø§Øª Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª ÙˆØ§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª Ø¨Ø®ØµÙˆØµÙŠØ© ÙˆÙˆØ¶ÙˆØ­.",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "ØµØ¨Ø­ÙƒÙ… Ø§Ù„Ù„Ù‡ Ø¨ÙƒÙ„ Ø®ÙŠØ±";
  return "Ø¹Ù…ØªÙ… Ù…Ø³Ø§Ø¡Ù‹";
}

function timeNowText() {
  try { return new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; }
}

function fullDateText() {
  try { return new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long" }); } catch { return ""; }
}

function actionCard(route, icon, title, text) {
  return `<button type="button" class="quick-action-card" data-route="${escapeHtml(route)}"><span class="quick-icon">${icon}</span><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></button>`;
}

function metricCard(label, value, hint, icon = "ðŸ“Š") {
  return `<article class="employee-stat"><div class="stat-icon">${icon}</div><div class="stat-body"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(hint)}</small></div></article>`;
}

function compactMetric(label, value, icon, route = "") {
  return `<button type="button" class="compact-metric-badge" ${route ? `data-route="${escapeHtml(route)}"` : ''}><span class="badge-icon">${icon}</span><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></button>`;
}

function confirmAction({ title = "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„ÙŠØ©", message = "Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©ØŸ", confirmLabel = "ØªØ£ÙƒÙŠØ¯", cancelLabel = "Ø¥Ù„ØºØ§Ø¡", danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="confirm-modal">
        <div class="panel-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div></div>
        <div class="form-actions">
          <button class="button ghost" type="button" data-cancel>${escapeHtml(cancelLabel)}</button>
          <button class="button ${danger ? "danger" : "primary"}" type="button" data-confirm>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    const cleanup = (answer) => { overlay.remove(); document.removeEventListener("keydown", onKey); resolve(answer); };
    const onKey = (event) => { if (event.key === "Escape") cleanup(false); };
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cleanup(false); });
    overlay.querySelector("[data-cancel]").addEventListener("click", () => cleanup(false));
    overlay.querySelector("[data-confirm]").addEventListener("click", () => cleanup(true));
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    overlay.querySelector("[data-confirm]").focus();
  });
}

function askText({ title = "Ø¥Ø¶Ø§ÙØ© Ù…Ù„Ø§Ø­Ø¸Ø©", message = "Ø§ÙƒØªØ¨ Ø§Ù„ØªÙØ§ØµÙŠÙ„", defaultValue = "", confirmLabel = "Ø­ÙØ¸", cancelLabel = "Ø¥Ù„ØºØ§Ø¡" } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <form class="confirm-modal prompt-modal">
        <div class="panel-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div></div>
        <label class="span-2">Ø§Ù„ØªÙØ§ØµÙŠÙ„<textarea name="answer" rows="3">${escapeHtml(defaultValue)}</textarea></label>
        <div class="form-actions">
          <button class="button ghost" type="button" data-cancel>${escapeHtml(cancelLabel)}</button>
          <button class="button primary" type="submit">${escapeHtml(confirmLabel)}</button>
        </div>
      </form>
    `;
    const form = overlay.querySelector("form");
    const cleanup = (answer) => { overlay.remove(); document.removeEventListener("keydown", onKey); resolve(answer); };
    const onKey = (event) => { if (event.key === "Escape") cleanup(null); };
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cleanup(null); });
    overlay.querySelector("[data-cancel]").addEventListener("click", () => cleanup(null));
    form.addEventListener("submit", (event) => { event.preventDefault(); cleanup(String(new FormData(form).get("answer") || "").trim()); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    form.elements.answer.focus();
  });
}


window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "home";
  if (routeKey() === "register") { state.route = "home"; history.replaceState(null, "", "#home"); }
  render();
});

function routeKey() {
  return (state.route || "home").split("?")[0] || "home";
}

function showToast(message = "", type = "info") {
  if (!message) return;
  if (window.HRToast && !showToast.__delegating) {
    try { showToast.__delegating = true; window.HRToast(message, type === "error" ? "error" : "ok"); return; }
    finally { showToast.__delegating = false; }
  }
  document.querySelectorAll(".hr-toast").forEach((toast) => toast.remove());
  const toast = document.createElement("div");
  toast.className = `hr-toast ${type === "error" ? "error" : "ok"}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.classList.add("is-visible"), 20);
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 240);
  }, 5000);
}

function consumeFlashMessage() {
  if (state.message || state.error) return;
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    if (!raw) return;
    sessionStorage.removeItem(FLASH_KEY);
    const flash = JSON.parse(raw);
    state.message = flash.message || "";
    state.error = flash.error || "";
  } catch {
    sessionStorage.removeItem(FLASH_KEY);
  }
}

function setMessage(message = "", error = "") {
  state.message = message;
  state.error = error;
  if (message || error) {
    sessionStorage.setItem(FLASH_KEY, JSON.stringify({ message, error }));
    showToast(error || message, error ? "error" : "ok");
    haptic(error ? [200, 100, 200] : [30, 50, 80]);
  }
}

function resetIdleTimer() {
  window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(async () => {
    if (!state.user) return;
    await endpoints.logout().catch(() => {});
    localStorage.removeItem("hr-attendance.local-db.v7");
    sessionStorage.removeItem("hr.core");
    sessionStorage.removeItem("hr.core.exp");
    state.user = null;
    state.message = "";
    state.error = "";
    setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø®Ø±ÙˆØ¬Ùƒ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¨Ø¹Ø¯ 30 Ø¯Ù‚ÙŠÙ‚Ø© Ù…Ù† Ø¹Ø¯Ù… Ø§Ù„Ù†Ø´Ø§Ø·.", "");
    renderLogin();
  }, IDLE_MS);
}

function startIdleTimer() {
  ["click", "keydown", "touchstart", "scroll", "pointermove"].forEach((eventName) => {
    document.addEventListener(eventName, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();
}

function haptic(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
}


const NOTIFICATION_SOUND_SEEN_KEY = "hr.employee.seenNotificationIds";
let notificationPollTimer = null;

function toBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function registerBrowserPasskey() {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error("Ù‡Ø°Ø§ Ø§Ù„Ù…ØªØµÙØ­ Ù„Ø§ ÙŠØ¯Ø¹Ù… Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø²/Passkey. Ø§Ø³ØªØ®Ø¯Ù… HTTPS Ø£Ùˆ localhost ÙˆÙ…ÙˆØ¨Ø§ÙŠÙ„ ÙŠØ¯Ø¹Ù… Ø§Ù„Ø¨ØµÙ…Ø©.");
  }
  const userName = state.user?.email || state.user?.phone || state.user?.fullName || "employee";
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Ù†Ø¸Ø§Ù… Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨ HR" },
      user: { id: userId, name: userName, displayName: state.user?.fullName || state.user?.employee?.fullName || userName },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
      timeout: 60000,
      attestation: "none",
    },
  });
  const rawId = toBase64Url(credential.rawId);
  const attestationObject = credential.response?.attestationObject ? toBase64Url(credential.response.attestationObject) : "";
  const clientDataJSON = credential.response?.clientDataJSON ? toBase64Url(credential.response.clientDataJSON) : "";
  const transports = typeof credential.response?.getTransports === "function" ? credential.response.getTransports() : [];
  const deviceFingerprintHash = await getDeviceFingerprintHash();
  const registered = unwrap(await endpoints.registerPasskey({ credentialId: rawId, attestationObject, clientDataJSON, transports, label: "Ø¨ØµÙ…Ø© Ø¬Ù‡Ø§Ø² Ø§Ù„Ù…ÙˆØ¸Ù", platform: navigator.platform || "browser", deviceFingerprintHash, trusted: true }));
  const credentialRow = registered?.credential || registered?.data || registered || {};
  state.user = { ...(state.user || {}), passkeyEnabled: true };
  if (state.user.employee) state.user.employee = { ...state.user.employee, passkeyEnabled: true };
  return {
    ok: true,
    credentialId: rawId,
    passkeyCredentialId: rawId,
    trustedDeviceId: credentialRow.id || credentialRow.trustedDeviceId || credentialRow.trusted_device_id || "",
    deviceFingerprintHash,
    passkeyUserVerified: true,
    deviceRiskFlags: [],
    justRegistered: true,
  };
}

function isMissingTrustedDeviceError(error) {
  const message = String(error?.message || error || "");
  return /Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ØµÙ…Ø© Ø¬Ù‡Ø§Ø²|Ø¨ØµÙ…Ø© Ø¬Ù‡Ø§Ø² Ù…ÙˆØ«ÙˆÙ‚Ø©|Ù…ÙØªØ§Ø­ Ø§Ù„Ù…Ø±ÙˆØ±|Passkey|passkey|MISSING_PASSKEY/i.test(message);
}

async function requestBrowserPasskeyForAction(label = "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„ÙŠØ©", employee = {}, options = {}) {
  try {
    return { ok: true, ...(await requestEmployeePasskey({ endpoints, user: state.user, employee, label })) };
  } catch (error) {
    if (!options.autoRegisterOnMissing || !isMissingTrustedDeviceError(error)) throw error;
    if (options.resultBox) options.resultBox.textContent = "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ØµÙ…Ø© Ø¬Ù‡Ø§Ø² Ù…Ø³Ø¬Ù„Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨. Ø³ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ Ø§Ù„Ø¢Ù† Ø«Ù… Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø¹Ù…Ù„ÙŠØ©.";
    const registered = await registerBrowserPasskey();
    if (options.resultBox) options.resultBox.textContent = "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø². Ø¬Ø§Ø±Ù Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø¹Ù…Ù„ÙŠØ©...";
    return registered;
  }
}

function playInternalAlertSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    gain.gain.value = 0.06;
    osc.frequency.value = 880;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    window.setTimeout(() => { osc.stop(); ctx.close?.(); }, 180);
  } catch {}
}

function seenNotificationIds() {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIFICATION_SOUND_SEEN_KEY) || "[]")); }
  catch { return new Set(); }
}

function saveSeenNotificationIds(ids) {
  try { localStorage.setItem(NOTIFICATION_SOUND_SEEN_KEY, JSON.stringify([...ids].slice(-200))); } catch {}
}

async function pollNotificationsForSound() {
  if (!state.user || document.hidden) return;
  const rows = await endpoints.notifications().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const relevant = rows.filter((item) => !item.isRead && (!item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id));
  const seen = seenNotificationIds();
  const fresh = relevant.filter((item) => item.id && !seen.has(item.id));
  if (fresh.length) {
    fresh.forEach((item) => seen.add(item.id));
    saveSeenNotificationIds(seen);
    playInternalAlertSound();
    haptic([60, 40, 60]);
    showToast(fresh[0].title || "ÙˆØµÙ„ ØªÙ†Ø¨ÙŠÙ‡ Ø¯Ø§Ø®Ù„ÙŠ Ø¬Ø¯ÙŠØ¯", "ok");
  }
}

function startNotificationPolling() {
  if (notificationPollTimer) return;
  pollNotificationsForSound();
  notificationPollTimer = window.setInterval(pollNotificationsForSound, 60000);
}

function stopNotificationPolling() {
  window.clearInterval(notificationPollTimer);
  notificationPollTimer = null;
}


function passwordStrengthLevel(value = "") {
  const text = String(value || "");
  let score = 0;
  if (text.length >= 8) score += 1;
  if (text.length >= 12) score += 1;
  if (/[A-Z]/.test(text) && /[a-z]/.test(text)) score += 1;
  if (/\d/.test(text)) score += 1;
  if (/[^A-Za-z0-9]/.test(text)) score += 1;
  if (score >= 5) return { key: "strong", label: "Ù‚ÙˆÙŠØ©" };
  if (score >= 3) return { key: "medium", label: "Ù…ØªÙˆØ³Ø·Ø©" };
  return { key: "weak", label: "Ø¶Ø¹ÙŠÙØ©" };
}

function passwordStrengthMarkup() {
  return `<div class="password-strength" data-password-strength><span></span><strong>Ø§ÙƒØªØ¨ ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù‚ÙˆÙŠØ©</strong></div>`;
}

function bindPasswordStrength(form) {
  const input = form?.querySelector('[name="newPassword"], [name="password"]');
  const meter = form?.querySelector('[data-password-strength]');
  if (!input || !meter) return;
  const update = () => {
    const level = passwordStrengthLevel(input.value);
    meter.dataset.level = level.key;
    meter.querySelector('strong').textContent = input.value ? `Ù‚ÙˆØ© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±: ${level.label}` : 'Ø§ÙƒØªØ¨ ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù‚ÙˆÙŠØ©';
  };
  input.addEventListener('input', update);
  update();
}

function renderLoadingSkeleton(title = "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„", subtitle = "Ù†Ø¬Ù‡Ø² Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¢Ù†...") {
  const current = routeKey();
  app.innerHTML = `
    <div class="employee-shell">
      <header class="employee-topbar"><div class="employee-brand"><img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" /><div><strong>Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨</strong><span>ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</span></div></div></header>
      <main class="employee-main">
        <section class="employee-page-head"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div></section>
        <section class="employee-grid loading-skeleton" aria-busy="true" aria-live="polite">
          <article class="employee-card full"><div class="skeleton wide"></div><div class="skeleton"></div><div class="skeleton short"></div></article>
          <article class="employee-card"><div class="skeleton"></div><div class="skeleton short"></div></article>
          <article class="employee-card"><div class="skeleton"></div><div class="skeleton short"></div></article>
        </section>
      </main>
      <nav class="employee-bottom-nav" aria-label="ØªÙ†Ù‚Ù„ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù">
        ${employeeRoutes.map(([key, label, icon]) => `<button class="${current === key || (key === 'more' && isMoreRoute(current)) ? 'is-active' : ''}" type="button" disabled><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`).join("")}
      </nav>
    </div>`;
}

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}

function normalizePermissionList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try { return normalizePermissionList(JSON.parse(trimmed)); } catch { return trimmed.split(/[ØŒ,\s]+/).map((item) => item.trim()).filter(Boolean); }
  }
  if (value && typeof value === "object") {
    if (Array.isArray(value.permissions)) return normalizePermissionList(value.permissions);
    if (Array.isArray(value.scopes)) return normalizePermissionList(value.scopes);
    return Object.entries(value).filter(([, enabled]) => enabled === true || enabled === "true" || enabled === 1 || enabled === "1").map(([scope]) => scope);
  }
  return [];
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function normalizeEgyptPhone(value = "") {
  let text = String(value || "").trim();
  const ar = "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©";
  const fa = "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹";
  text = text.replace(/[Ù -Ù©]/g, (d) => String(ar.indexOf(d))).replace(/[Û°-Û¹]/g, (d) => String(fa.indexOf(d)));
  let digits = text.replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(2);
  if (digits.startsWith("20") && digits.length >= 12) digits = `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`;
  return digits;
}

function validEgyptPhone(value = "") {
  return /^01[0125][0-9]{8}$/.test(normalizeEgyptPhone(value));
}

function fileToAvatarDataUrl(file) {
  if (!file || !String(file.type || "").startsWith("image/")) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ØªØ¹Ø°Ø± Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ØµÙˆØ±Ø©."));
    reader.onload = () => { image.src = reader.result; };
    image.onerror = () => reject(new Error("Ù…Ù„Ù Ø§Ù„ØµÙˆØ±Ø© ØºÙŠØ± ØµØ§Ù„Ø­."));
    image.onload = () => {
      const max = 512;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", .82));
    };
    reader.readAsDataURL(file);
  });
}

async function reverseGeocode(latitude, longitude) {
  if (latitude == null || longitude == null) return "";
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&accept-language=ar`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    const data = response.ok ? await response.json() : {};
    return data.display_name || data.name || "";
  } catch {
    return "";
  } finally {
    window.clearTimeout(timer);
  }
}

function date(value) {
  if (!value) return "-";
  try { return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }); } catch { return value; }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function statusLabel(value = "") {
  const map = {
    CHECK_IN: "Ø­Ø¶ÙˆØ±",
    CHECK_OUT: "Ø§Ù†ØµØ±Ø§Ù",
    PRESENT: "Ø­Ø§Ø¶Ø±",
    LATE: "Ù…ØªØ£Ø®Ø±",
    ABSENT: "ØºØ§Ø¦Ø¨",
    PENDING: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    APPROVED: "Ù…Ù‚Ø¨ÙˆÙ„",
    REJECTED: "Ù…Ø±ÙÙˆØ¶",
    REJECTED_CONFIRMED: "Ø±ÙØ¶ Ù†Ù‡Ø§Ø¦ÙŠ",
    MANUAL_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ ÙŠØ¯ÙˆÙŠ",
    UNREAD: "Ø¬Ø¯ÙŠØ¯",
    READ: "Ù…Ù‚Ø±ÙˆØ¡",
    IN_REVIEW: "Ø£Ù…Ø§Ù… Ø§Ù„Ù„Ø¬Ù†Ø©",
    ON_LEAVE: "Ø¥Ø¬Ø§Ø²Ø©",
    ON_MISSION: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©",
    CHECKED_OUT: "Ø§Ù†ØµØ±Ù",
    LIVE_SHARED: "Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± Ù…ÙØ±Ø³Ù„",
    ACTION_REQUIRED: "Ø¥Ø¬Ø±Ø§Ø¡ Ù…Ø·Ù„ÙˆØ¨",
    SELF_SUBMITTED: "Ù…Ø±Ø³Ù„ Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù",
    MANAGER_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ±",
    HR_REVIEWED: "Ù…Ø±Ø§Ø¬Ø¹Ø© HR",
    SECRETARY_REVIEWED: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø³ÙƒØ±ØªÙŠØ±",
    EXECUTIVE_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ",
  };
  return map[value] || value || "-";
}

function badge(value, extra = "") {
  const key = String(value || "").toLowerCase();
  return `<span class="badge ${extra} status-${escapeHtml(key)}">${escapeHtml(statusLabel(value))}</span>`;
}


const bundledEmployeePhotos = Object.freeze({});

function bundledEmployeePhoto() {
  return "";
}

function resolveAvatarUrl(value) {
  const src = String(value || "").trim();
  if (!src) return "";
  if (/^(data:|blob:|https?:|\/)/i.test(src)) return src;
  if (src.startsWith("employee-avatars/") || src.startsWith("avatars/employee-avatars/")) {
    const cfg = window.HR_SUPABASE_CONFIG || {};
    const bucket = cfg.storage?.avatarsBucket || "avatars";
    const path = src.replace(/^avatars\//, "").split("/").map(encodeURIComponent).join("/");
    if (cfg.url) return `${String(cfg.url).replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
  }
  return src;
}

function avatar(subject = {}, size = "") {
  const url = resolveAvatarUrl(subject?.avatarUrl || subject?.photoUrl || subject?.employee?.photoUrl || subject?.employee?.avatarUrl || bundledEmployeePhoto(subject) || "");
  const name = subject?.fullName || subject?.name || subject?.email || subject?.employee?.fullName || "Ù…";
  return url
    ? `<img class="avatar ${size}" src="${escapeHtml(url)}" alt="" loading="lazy" />`
    : `<span class="avatar ${size}">${escapeHtml(String(name).trim().charAt(0) || "Ù…")}</span>`;
}

function permissionsOf(user = state.user) {
  const fromRole = user?.role?.permissions || [];
  return new Set([
    ...normalizePermissionList(user?.permissions),
    ...normalizePermissionList(user?.permissionScopes),
    ...normalizePermissionList(user?.scopes),
    ...normalizePermissionList(user?.profile?.permissions),
    ...normalizePermissionList(fromRole),
  ]);
}

function roleKey(user = state.user) {
  const role = user?.role || {};
  return String(role.slug || role.key || role.id || user?.roleSlug || user?.roleKey || user?.role || "").toLowerCase();
}

function isAdminUser(user = state.user) {
  const role = roleKey(user);
  if (executiveOnlyRoles.has(role)) return false;
  if (fullAccessRoles.has(role)) return true;
  const permissions = permissionsOf(user);
  return [...permissions].some((scope) => adminScopes.has(scope));
}

function employeeSubject() {
  return state.user?.employee || state.user || {};
}


const BRANCH_DISPLAY_NAME = "Ù…Ø¬Ù…Ø¹ Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨";
const BRANCH_DISPLAY_AREA = "Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©";
const ATTENDANCE_REMINDER_HOUR = 9;
const ATTENDANCE_REMINDER_MINUTE = 30;
const FACE_SELFIE_TEMP_DISABLED = true;

function attendanceConfig() {
  return (window.HR_SUPABASE_CONFIG && window.HR_SUPABASE_CONFIG.attendance) || {};
}
function branchConfig() {
  return attendanceConfig().branchLocation || {};
}
function branchName() { return branchConfig().name || BRANCH_DISPLAY_NAME; }
function branchArea() { return branchConfig().area || BRANCH_DISPLAY_AREA; }
function isQrDisabled() { return attendanceConfig().qrRequired === false || window.HR_QR_REQUIRED === false; }
function isFaceSelfieDisabled() { return FACE_SELFIE_TEMP_DISABLED || attendanceConfig().faceSelfieRequired === false || window.HR_FACE_SELFIE_REQUIRED === false; }
function gpsPolicy() {
  const cfg = attendanceConfig();
  return {
    samples: Number(cfg.gpsSamples || 12),
    windowMs: Number(cfg.gpsSampleWindowMs || 30000),
    targetAccuracy: Number(cfg.gpsTargetAccuracyMeters || 25),
    maxAcceptableAccuracy: Number(cfg.gpsMaxAcceptableAccuracyMeters || 180),
    safetyBuffer: Number(cfg.gpsSafetyBufferMeters || 90),
    uncertainReviewOnly: cfg.gpsUncertainReviewOnly !== false,
  };
}

function distanceMetersBetween(a = {}, b = {}) {
  if (![a.latitude, a.longitude, b.latitude, b.longitude].every((value) => Number.isFinite(Number(value)))) return null;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const radius = 6371000;
  const dLat = toRad(Number(b.latitude) - Number(a.latitude));
  const dLng = toRad(Number(b.longitude) - Number(a.longitude));
  const lat1 = toRad(Number(a.latitude));
  const lat2 = toRad(Number(b.latitude));
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * radius * Math.asin(Math.sqrt(h)));
}

function configuredBranchTarget() {
  const cfg = branchConfig();
  const latitude = Number(cfg.latitude);
  const longitude = Number(cfg.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return {
    latitude,
    longitude,
    radiusMeters: Number(cfg.radiusMeters || 300),
    safetyBufferMeters: Number(cfg.safetyBufferMeters || gpsPolicy().safetyBuffer),
    maxAccuracyMeters: Number(cfg.maxAccuracyMeters || gpsPolicy().maxAcceptableAccuracy),
  };
}

function localGeofenceEvaluation(location = {}) {
  const target = configuredBranchTarget();
  if (!target || !Number.isFinite(Number(location.latitude)) || !Number.isFinite(Number(location.longitude))) return {};
  const distance = distanceMetersBetween(location, target);
  const accuracy = Number(location.accuracyMeters ?? location.accuracy ?? 0);
  const effectiveRadius = Number(target.radiusMeters || 300) + Number(target.safetyBufferMeters || 0) + Math.min(Math.max(accuracy || 0, 0), Math.max(Number(target.maxAccuracyMeters || 180), 300));
  const insideHard = distance != null && distance <= Number(target.radiusMeters || 300);
  const insideSoft = distance != null && distance <= effectiveRadius;
  return {
    distanceFromBranchMeters: distance,
    localDistanceFromBranchMeters: distance,
    localRadiusMeters: target.radiusMeters,
    localEffectiveRadiusMeters: effectiveRadius,
    localInsideBranch: insideHard,
    localInsideSoft: insideSoft,
  };
}

function renderRequestList(requests = []) {
  if (!requests || !requests.length) return `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù…Ø³Ø¬Ù„Ø©.</div>`;
  return `<div class="employee-list">${requests.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title || item.leaveType?.name || item.leaveType || item.type || "Ø·Ù„Ø¨")}</strong><span>${escapeHtml(date(item.createdAt || item.startDate || item.plannedStart || "-"))}</span><small>${escapeHtml(item.reason || item.notes || item.destinationName || "-")}</small></div><div class="list-item-side">${badge(item.finalStatus || item.workflowStatus || item.status)}</div></div>`).join("")}</div>`;
}

function currentEmployeeLabel(subject = employeeSubject()) {
  return subject?.fullName || state.user?.fullName || state.user?.name || "Ø§Ù„Ù…ÙˆØ¸Ù";
}

function currentJobLabel(subject = employeeSubject()) {
  return subject?.jobTitle || subject?.position || state.user?.role?.name || "Ù…ÙˆØ¸Ù";
}

function employeeHeaderCell(subject = employeeSubject()) {
  return `<div class="employee-header-card person-cell large">${avatar(subject, "large")}<span><strong>${escapeHtml(currentEmployeeLabel(subject))}</strong><small>${escapeHtml(currentJobLabel(subject))}</small></span></div>`;
}

function locationLabelFromRecord(record = {}) {
  const locationStatus = String(record.locationStatus || record.geofenceStatus || "").toLowerCase();
  const attendanceStatus = String(record.status || record.type || record.eventType || "").toLowerCase();
  const branchish = ["inside_branch", "inside_branch_low_accuracy", "inside", "in_range", "active", "approved"].includes(locationStatus)
    || (!locationStatus && ["check_in", "check_out", "present", "late", "checked_out", "manual_approved"].includes(attendanceStatus) && !record.requiresReview);
  if (branchish) return `${branchName()} â€” ${branchArea()}`;
  return record.addressLabel || record.locationLabel || record.placeLabel || record.address || record.destinationName || "Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø¹Ù†ÙˆØ§Ù† Ù†ØµÙŠ Ø¨Ø¹Ø¯";
}

function locationStatusBadge(record = {}) {
  const status = String(record.locationStatus || record.geofenceStatus || "").toLowerCase();
  const attendanceStatus = String(record.status || record.type || record.eventType || "").toLowerCase();
  const inside = status.includes("inside") || status.includes("in_range") || status === "active" || status === "approved";
  const uncertain = status.includes("uncertain") || status.includes("low_accuracy") || status.includes("unavailable") || status.includes("unknown") || record.locationUncertain;
  const outside = status.includes("outside") || status.includes("out_of_range") || status.includes("geofence_miss");
  const acceptedAttendance = ["check_in", "check_out", "present", "late", "checked_out", "manual_approved"].includes(attendanceStatus);
  if (inside) return `<span class="pill success">Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ø¬Ù…Ø¹</span>`;
  if (uncertain) return `<span class="pill warning">Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…Ø¤ÙƒØ¯</span>`;
  if (outside) return `<span class="pill danger">Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹</span>`;
  if (acceptedAttendance && !record.requiresReview) return `<span class="pill success">ØªÙ… Ø§Ù„ØªØ³Ø¬ÙŠÙ„</span>`;
  return `<span class="pill warning">Ø¨Ø­Ø§Ø¬Ø© Ù„Ù„ØªØ­Ù‚Ù‚</span>`;
}

function readableLocationBlock(record = {}, { compact = false } = {}) {
  const label = locationLabelFromRecord(record);
  const accuracy = Number(record.accuracy || record.gpsAccuracy || 0);
  const distance = Number(record.distanceFromBranch || record.distanceMeters || 0);
  const hasDistance = Number.isFinite(distance) && distance > 0;
  return `<div class="readable-location ${compact ? "compact" : ""}">
    <div>${locationStatusBadge(record)}<strong>${escapeHtml(label)}</strong><small>${escapeHtml(label.includes(BRANCH_DISPLAY_NAME) ? BRANCH_DISPLAY_AREA : "Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„ÙØ¹Ù„ÙŠ Ø§Ù„Ù…Ø³Ø¬Ù„")}</small></div>
    <div class="location-meta-row">${accuracy ? `<span>Ø§Ù„Ø¯Ù‚Ø© Â±${Math.round(accuracy)} Ù…</span>` : ""}${hasDistance ? `<span>ÙŠØ¨Ø¹Ø¯ ØªÙ‚Ø±ÙŠØ¨Ù‹Ø§ ${Math.round(distance)} Ù…</span>` : ""}</div>
  </div>`;
}

function attendanceNoteField(value = "") {
  return `<label class="span-2 punch-note-field">Ù…Ù„Ø§Ø­Ø¸Ø© Ù…Ø¹ Ø§Ù„Ø¨ØµÙ…Ø©<textarea id="punch-notes" name="notes" rows="2" placeholder="Ø§ÙƒØªØ¨ Ù…Ù„Ø§Ø­Ø¸Ø© Ø¥Ù† ÙˆØ¬Ø¯Øª: Ù…Ø£Ù…ÙˆØ±ÙŠØ©ØŒ Ø¸Ø±Ù Ø·Ø§Ø±Ø¦ØŒ ØªØ£Ø®ÙŠØ± Ù…ÙˆØ§ØµÙ„Ø§Øª...">${escapeHtml(value)}</textarea></label>`;
}

function isMorningPunchTime() {
  const h = new Date().getHours();
  return h < 15;
}

function todayReminderDue(events = []) {
  const now = new Date();
  if (now.getHours() < ATTENDANCE_REMINDER_HOUR || (now.getHours() === ATTENDANCE_REMINDER_HOUR && now.getMinutes() < ATTENDANCE_REMINDER_MINUTE)) return false;
  return !(events || []).some((e) => String(e.type || e.eventType || "").toLowerCase().includes("in") || String(e.type || "").includes("Ø­Ø¶ÙˆØ±"));
}

function kpiSlider({ name, label, weight, value = 0, readonly = false }) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  const calculated = (pct * weight / 100).toFixed(1);
  return `<label class="kpi-slider-field ${readonly ? "is-readonly" : ""}"><span>${escapeHtml(label)}</span><input type="range" name="${escapeHtml(name)}" min="0" max="100" step="1" value="${pct}" ${readonly ? "disabled" : ""} data-weight="${weight}" /><div class="kpi-slider-meta"><b>${pct}%</b><small>Ø§Ù„ÙˆØ²Ù† ${weight} â€” Ø§Ù„Ù…Ø­ØªØ³Ø¨ ${calculated}/${weight}</small></div><div class="kpi-progress"><i style="width:${pct}%"></i></div></label>`;
}

function getManagerLikeRole() {
  const role = roleKey();
  const perms = permissionsOf();
  return role.includes("manager") || role.includes("Ù…Ø¯ÙŠØ±") || perms.has("team:manage") || perms.has("employees:team");
}

function isMoreRoute(key = routeKey()) {
  return moreEmployeeRoutes.some(([route]) => route === key);
}

function shell(content, title = "ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù", subtitle = "") {
  const current = routeKey();
  const user = state.user || {};
  const employee = employeeSubject();
  app.innerHTML = `
    <div class="employee-shell">
      <header class="employee-topbar">
        <div class="employee-brand is-larger-logo">
          <img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" />
          <div><strong>Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨</strong><span>ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</span></div>
        </div>
        <div class="employee-user" title="${escapeHtml(user.fullName || user.name || user.email || "Ù…Ø³ØªØ®Ø¯Ù…")}">
          ${avatar(user, "tiny")}
          <span><strong>${escapeHtml(user.fullName || user.name || employee.fullName || "Ù…Ø³ØªØ®Ø¯Ù…")}</strong><small>${escapeHtml(employee.jobTitle || "ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†")}</small></span>
        </div>
      </header>
      <main class="employee-main">
        <section class="employee-page-head">
          <div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle || routeSubtitles[current] || "")}</p></div>
        </section>
        ${(user.mustChangePassword || user.temporaryPassword) && current !== "profile" ? `<section class="employee-card full must-change-card"><strong>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø¤Ù‚ØªØ©</strong><span>Ù…Ù† ÙØ¶Ù„Ùƒ ØºÙŠÙ‘Ø± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ù† ØµÙØ­Ø© Ø­Ø³Ø§Ø¨ÙŠ Ù„ØªØ£Ù…ÙŠÙ† Ø­Ø³Ø§Ø¨Ùƒ.</span><button class="button primary small" type="button" data-route="profile">ØªØºÙŠÙŠØ± Ø§Ù„Ø¢Ù†</button></section>` : ""}
        ${content}
      </main>
      <nav class="employee-bottom-nav" aria-label="ØªÙ†Ù‚Ù„ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù">
        ${employeeRoutes.map(([key, label, icon]) => key === "more"
          ? `<button class="${isMoreRoute(current) ? "is-active" : ""}" type="button" data-more-menu aria-expanded="false"><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`
          : `<button class="${current === key ? "is-active" : ""}" type="button" data-route="${key}"><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`).join("")}
      </nav>
      <div class="employee-more-backdrop hidden" data-more-backdrop></div>
      <section class="employee-more-sheet hidden" data-more-sheet aria-label="Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø²ÙŠØ¯">
        <div class="more-sheet-handle"></div>
        <div class="more-sheet-head"><strong>Ø§Ù„Ù…Ø²ÙŠØ¯</strong><button type="button" class="icon-button" data-close-more aria-label="Ø¥ØºÙ„Ø§Ù‚">Ã—</button></div>
        <div class="more-sheet-grid">
          ${moreEmployeeRoutes.map(([key, label, icon]) => `<button class="${current === key ? "is-active" : ""}" type="button" data-route="${key}"><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`).join("")}
        </div>
      </section>
    </div>
  `;
  const moreButton = app.querySelector("[data-more-menu]");
  const moreSheet = app.querySelector("[data-more-sheet]");
  const moreBackdrop = app.querySelector("[data-more-backdrop]");
  const closeMore = () => {
    moreSheet?.classList.add("hidden");
    moreBackdrop?.classList.add("hidden");
    moreButton?.setAttribute("aria-expanded", "false");
  };
  const openMore = () => {
    moreSheet?.classList.remove("hidden");
    moreBackdrop?.classList.remove("hidden");
    moreButton?.setAttribute("aria-expanded", "true");
  };
  moreButton?.addEventListener("click", openMore);
  moreBackdrop?.addEventListener("click", closeMore);
  app.querySelector("[data-close-more]")?.addEventListener("click", closeMore);
  document.onkeydown = (event) => { if (event.key === "Escape") closeMore(); };
  app.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => { closeMore(); location.hash = button.dataset.route; }));
  app.querySelectorAll("[data-enable-notifications]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    button.dataset.hrPushBound = "1";
    try {
      const explained = await window.HRExplainAndEnablePush?.();
      if (explained !== false && Notification?.permission === "granted") await enableWebPushSubscription(endpoints);
      setMessage("ØªÙ… ØªÙØ¹ÙŠÙ„ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø².", "");
    } catch (error) {
      setMessage("", friendlyError(error, "ØªØ¹Ø°Ø± ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª."));
    }
  }));
  app.querySelectorAll("[data-enable-location]").forEach((button) => button.addEventListener("click", async (event) => {
    event.preventDefault();
    button.dataset.hrLocationBound = "1";
    try { await window.HRExplainAndEnableLocation?.(); }
    catch (error) { setMessage("", friendlyError(error, "ØªØ¹Ø°Ø± ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù…ÙˆÙ‚Ø¹.")); }
  }));
  app.querySelectorAll("form[data-ajax]").forEach((form) => form.addEventListener("submit", handleFormSubmit));
  app.querySelector("[data-logout]")?.addEventListener("click", async () => {
    const ok = await confirmAction({ title: "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬", message: "Ù‡Ù„ ØªØ±ÙŠØ¯ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬ Ù…Ù† ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†ØŸ", confirmLabel: "Ø®Ø±ÙˆØ¬", danger: true });
    if (!ok) return;
    await endpoints.logout();
    localStorage.removeItem("hr-attendance.local-db.v7");
    sessionStorage.removeItem("hr.core");
    sessionStorage.removeItem("hr.core.exp");
    state.user = null;
    location.hash = "home";
    renderLogin();
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = form.dataset.ajax;
  const values = readForm(form);
  try {
    if (action === "leave") {
      if (values.startDate && values.endDate && values.startDate > values.endDate) {
        setMessage("", "ØªØ§Ø±ÙŠØ® Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ø¥Ø¬Ø§Ø²Ø© ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø¨Ø¹Ø¯ ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©.");
        renderLeaves();
        return;
      }
      await endpoints.createLeave({ ...values, workflowStatus: "pending_manager_review", status: "PENDING_MANAGER_REVIEW" });
      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.", "");
      location.hash = "leaves";
    }
    if (action === "mission") {
      await endpoints.createMission({ ...values, workflowStatus: "pending_manager_review", status: "PENDING_MANAGER_REVIEW" });
      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.", "");
      location.hash = "missions";
    }
    if (action === "dispute") {
      await endpoints.createDispute({ ...values, employeeId: state.user?.employeeId || state.user?.employee?.id || "", status: "committee_review", privacyLevel: "committee_only" });
      setMessage("ØªÙ… Ø±ÙØ¹ Ø§Ù„Ø´ÙƒÙˆÙ‰ Ø¥Ù„Ù‰ Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª.", "");
      location.hash = "disputes";
    }
    render();
  } catch (error) {
    setMessage("", error.message || "Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„Ø­ÙØ¸.");
    render();
  }
}

async function renderLogin() {
  if (routeKey() === "register") {
    state.registerMode = false;
    history.replaceState(null, "", "#home");
  }
  const identifierValue = state.loginIdentifier || "";
  const passwordValue = state.loginPassword || "";
  app.innerHTML = `
    <div class="employee-login-screen">
      <form class="employee-login-card refined-login-card" id="employee-login-form" novalidate>
        <div class="login-brand-row">
          <img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" />
          <div><strong>Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨</strong><span>ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</span></div>
        </div>
        <h1>Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</h1>
        <div class="employee-login-intro"><span class="login-highlight">Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</span><span class="login-separator"></span><span class="login-highlight">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ© = Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</span></div>
        <div class="login-features"><span class="login-feature">Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ù„Ù‡Ø§ØªÙ</span><span class="login-feature">GPS + Ø§Ù„Ø¨ØµÙ…Ø©</span><span class="login-feature">Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¯Ø§Ø®Ù„ÙŠØ©</span></div>
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ""}
        ${state.lastLoginFailed ? `<div class="message warning compact">ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„. ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ù„Ø±Ù‚Ù… ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.</div>` : ""}
        <label>Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ<input name="identifier" value="${escapeHtml(identifierValue)}" autocomplete="username" inputmode="tel" placeholder="01xxxxxxxxx" required /></label>
        <label>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±<input name="password" type="password" value="${escapeHtml(passwordValue)}" autocomplete="current-password" placeholder="Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±" /></label>
        <button class="button primary full" type="submit">Ø¯Ø®ÙˆÙ„ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚</button>
        <button class="button ghost full compact-ghost" type="button" data-forgot-password>Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±ØŸ</button>
      </form>
    </div>
  `;
  const form = app.querySelector("#employee-login-form");
  form.addEventListener("input", () => {
    const values = readForm(form);
    state.loginIdentifier = values.identifier || state.loginIdentifier || "";
    state.loginPassword = values.password || values.identifier || "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    try {
      state.loginIdentifier = values.identifier || "";
      state.loginPassword = values.password || values.identifier || "";
      if (state.loginIdentifier) localStorage.setItem("hr.login.lastIdentifier", state.loginIdentifier);
      state.user = unwrap(await endpoints.login(state.loginIdentifier, state.loginPassword));
      state.loginPassword = "";
      state.lastLoginFailed = false;
      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ù†Ø¬Ø§Ø­.", "");
      startNotificationPolling();
      render();
    } catch (error) {
      state.lastLoginFailed = true;
      setMessage("", error.message || "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.");
      renderLogin();
    }
  });
  app.querySelector("[data-forgot-password]")?.addEventListener("click", async () => {
    const values = readForm(form);
    state.loginIdentifier = values.identifier || state.loginIdentifier || "";
    state.loginPassword = values.password || state.loginPassword || "";
    if (!state.loginIdentifier) {
      setMessage("", "Ø§ÙƒØªØ¨ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø£ÙˆÙ„Ù‹Ø§.");
      return renderLogin();
    }
    try {
      await endpoints.forgotPassword(state.loginIdentifier);
      state.lastLoginFailed = false;
      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±.", "");
      renderLogin();
    } catch (error) {
      state.lastLoginFailed = true;
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ¹ÙŠÙŠÙ†.");
      renderLogin();
    }
  });
}

async function getBrowserLocation(options = {}) {
  if (!navigator.geolocation) return { locationPermission: "unavailable", accuracyMeters: null };
  const basePolicy = gpsPolicy();
  const policy = {
    ...basePolicy,
    samples: Number(options.samples || basePolicy.samples),
    windowMs: Number(options.windowMs || basePolicy.windowMs),
    targetAccuracy: Number(options.targetAccuracy || basePolicy.targetAccuracy),
    maxAcceptableAccuracy: Number(options.maxAcceptableAccuracy || basePolicy.maxAcceptableAccuracy),
  };
  return await new Promise((resolve) => {
    const samples = [];
    let watcher = null;
    let timer = null;
    const normalize = (position) => ({
      locationPermission: "granted",
      latitude: Number(position.coords.latitude),
      longitude: Number(position.coords.longitude),
      accuracy: Math.round(Number(position.coords.accuracy || 9999)),
      accuracyMeters: Math.round(Number(position.coords.accuracy || 9999)),
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp || Date.now(),
      capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
    });
    const best = () => samples.slice().sort((a, b) => (a.accuracyMeters || 9999) - (b.accuracyMeters || 9999) || (b.timestamp || 0) - (a.timestamp || 0))[0] || null;
    const finish = (fallback = null) => {
      try { if (watcher != null) navigator.geolocation.clearWatch(watcher); } catch {}
      try { if (timer) window.clearTimeout(timer); } catch {}
      const value = best() || fallback || { locationPermission: "timeout", accuracyMeters: null };
      if (value.accuracyMeters && value.accuracyMeters > policy.maxAcceptableAccuracy) {
        value.locationWarning = "GPS_UNRELIABLE";
        value.locationError = "Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ø¯Ù‚ÙŠÙ‚Ø© ÙƒÙØ§ÙŠØ© Ù„Ù„Ø­ÙƒÙ… Ø¯Ø§Ø®Ù„/Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© ÙÙŠ Ù…ÙƒØ§Ù† Ù…ÙØªÙˆØ­ Ø£Ùˆ Ø£Ø±Ø³Ù„Ù‡Ø§ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.";
      }
      resolve(value);
    };
    watcher = navigator.geolocation.watchPosition(
      (position) => {
        const row = normalize(position);
        samples.push(row);
        if (samples.length >= policy.samples || row.accuracyMeters <= policy.targetAccuracy) finish(row);
      },
      (error) => {
        if (!samples.length) finish({ locationPermission: error.code === error.PERMISSION_DENIED ? "denied" : "unknown", accuracyMeters: null, error: error.message || "GPS error" });
      },
      { enableHighAccuracy: true, timeout: Math.min(12000, policy.windowMs), maximumAge: 15000 }
    );
    timer = window.setTimeout(() => finish(), policy.windowMs);
  });
}


async function getVerifiedBrowserLocation(employeeId = "", options = {}) {
  const raw = await getBrowserLocation(options);
  let evaluation = {};
  try {
    evaluation = unwrap(await endpoints.evaluateGeofence({ ...raw, employeeId, accuracyMeters: raw.accuracyMeters || raw.accuracy }));
  } catch (error) {
    evaluation = {};
  }
  const local = localGeofenceEvaluation(raw);
  const policy = gpsPolicy();
  const status = String(evaluation.geofenceStatus || raw.geofenceStatus || "").toLowerCase();
  const accuracy = Number(raw.accuracyMeters || raw.accuracy || evaluation.accuracyMeters || 0);
  const weak = Boolean(accuracy && accuracy > policy.maxAcceptableAccuracy);
  const serverInside = status.includes("inside") || evaluation.allowed === true || evaluation.canRecord === true;
  const serverOutside = status.includes("outside") || status.includes("geofence_miss");
  const localInsideHard = local.localInsideBranch === true;
  const localInsideSoft = local.localInsideSoft === true;
  const uncertain = weak || status.includes("low_accuracy") || status.includes("unavailable") || status.includes("unknown") || (serverOutside && localInsideSoft && policy.uncertainReviewOnly);
  const inside = serverInside || localInsideHard || (localInsideSoft && !serverOutside && !weak);
  const finalStatus = inside
    ? (weak ? "inside_branch_low_accuracy" : "inside_branch")
    : (uncertain ? "location_uncertain" : (evaluation.geofenceStatus || "outside_branch"));
  const merged = {
    ...raw,
    ...evaluation,
    ...local,
    accuracyMeters: accuracy || evaluation.accuracyMeters || raw.accuracyMeters,
    insideBranch: Boolean(inside),
    locationUncertain: Boolean(uncertain && !inside),
    geofenceStatus: finalStatus,
    canRecord: Boolean(inside),
    allowed: Boolean(inside),
    requiresReview: Boolean((uncertain && !inside) || evaluation.requiresReview),
  };
  if (merged.insideBranch) merged.addressLabel = `${branchName()} â€” ${branchArea()}`;
  else if (merged.locationUncertain) merged.addressLabel = "Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…Ø¤ÙƒØ¯ â€” Ø³ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„Ù‡ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¨Ø¯Ù„ Ø§Ù„Ø­ÙƒÙ… Ø§Ù„Ø®Ø§Ø·Ø¦";
  else merged.addressLabel = merged.addressLabel || "Ù…ÙˆÙ‚Ø¹ Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹";
  return merged;
}


function friendlyError(error, fallback = "ØªØ¹Ø°Ø± ØªÙ†ÙÙŠØ° Ø§Ù„Ø¹Ù…Ù„ÙŠØ©.") {
  const text = String(error?.message || error || fallback);
  if (text.includes("permission") || text.includes("ØµÙ„Ø§Ø­ÙŠØ©") || text.includes("Ø§Ù„Ù…ÙˆÙ‚Ø¹")) return "Ù„Ù… Ù†ØªÙ…ÙƒÙ† Ù…Ù† ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆÙ‚Ø¹Ùƒ. ÙØ¹Ù‘Ù„ GPS ÙˆØ§Ø³Ù…Ø­ Ù„Ù„ØªØ·Ø¨ÙŠÙ‚ Ø¨Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ù…ÙˆÙ‚Ø¹ Ø«Ù… Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.";
  if (text.includes("network") || text.includes("fetch")) return "Ø§Ù„Ø§ØªØµØ§Ù„ ØºÙŠØ± Ù…Ø³ØªÙ‚Ø±. ØªØ£ÙƒØ¯ Ù…Ù† Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª Ø«Ù… Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.";
  if (text.includes("quota") || text.includes("Ù…Ø³Ø§Ø­Ø©")) return "Ù…Ø³Ø§Ø­Ø© Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø§Ù„Ù…Ø­Ù„ÙŠØ© Ø§Ù…ØªÙ„Ø£Øª. Ø§Ø³ØªØ®Ø¯Ù… ØµÙˆØ±Ø© Ø£ØµØºØ± Ø£Ùˆ Ø§Ø·Ù„Ø¨ Ù…Ù† Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ØªÙØ¹ÙŠÙ„ Supabase.";
  if (text.includes("Ø®Ø§Ø±Ø¬") || text.includes("outside")) return "Ø£Ù†Øª Ø®Ø§Ø±Ø¬ Ù†Ø·Ø§Ù‚ Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©. Ø³ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¨ØµÙ…Ø© Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¥Ø°Ø§ ÙƒØ§Ù† Ø°Ù„Ùƒ Ù…Ø³Ù…ÙˆØ­Ù‹Ø§.";
  return text || fallback;
}

async function renderRecoveryPassword() {
  shell(`
    <section class="employee-grid">
      <form class="employee-card full" id="recovery-password-form">
        <h2>ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ø¬Ø¯ÙŠØ¯Ø©</h2>
        <p>ØªÙ… ÙØªØ­ Ø±Ø§Ø¨Ø· Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±. Ø§ÙƒØªØ¨ ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ø¬Ø¯ÙŠØ¯Ø© Ù„Ø§ ØªÙ‚Ù„ Ø¹Ù† 8 Ø£Ø­Ø±Ù.</p>
        <label>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©<input type="password" name="newPassword" autocomplete="new-password" minlength="8" required /></label>
        ${passwordStrengthMarkup()}
        <label>ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©<input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" required /></label>
        <button class="button primary full" type="submit">Ø­ÙØ¸ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©</button>
      </form>
    </section>
  `, "Ø§Ø³ØªØ¹Ø§Ø¯Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ø¬Ø¯ÙŠØ¯Ø© Ø¨Ø¹Ø¯ ÙØªØ­ Ø±Ø§Ø¨Ø· Ø§Ù„Ø§Ø³ØªØ¹Ø§Ø¯Ø©.");
  bindPasswordStrength(app.querySelector("#recovery-password-form"));
  app.querySelector("#recovery-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    if (values.newPassword !== values.confirmPassword) { setMessage("", "ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…Ø·Ø§Ø¨Ù‚."); return renderRecoveryPassword(); }
    try {
      await endpoints.changePassword({ ...values, recoveryMode: true });
      state.recoveryMode = false;
      setMessage("ØªÙ… Ø­ÙØ¸ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¢Ù†.", "");
      location.hash = "profile";
      renderProfile();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©.");
      renderRecoveryPassword();
    }
  });
}

async function renderHome() {
  if (window.HRV9?.shouldShowOnboarding?.(state.user?.profile || state.user || {})) {
    location.hash = "profile";
    return;
  }
  const [events, leaves, notifications, missions, tasks, liveRequests] = await Promise.all([
    endpoints.myAttendanceEvents().then(unwrap).catch(() => []),
    endpoints.leaves().then(unwrap).catch(() => []),
    endpoints.notifications().then(unwrap).catch(() => []),
    endpoints.missions().then(unwrap).catch(() => []),
    endpoints.myTasks().then(unwrap).catch(() => []),
    endpoints.myLiveLocationRequests().then(unwrap).catch(() => []),
  ]);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const employee = employeeSubject();
  const myEvents = events.filter((event) => !employeeId || event.employeeId === employeeId);
  const todayEvents = myEvents.filter((event) => String(event.eventAt || event.createdAt || "").startsWith(todayIso()));
  const lastEvent = myEvents[0] || {};
  const pendingLeaves = leaves.filter((item) => item.employeeId === employeeId && String(item.status || "").includes("PENDING")).length;
  const pendingMissions = missions.filter((item) => item.employeeId === employeeId && String(item.status || "").includes("PENDING")).length;
  const unread = notifications.filter((item) => !item.isRead && (!item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id)).length;
  const pendingLive = (liveRequests || []).filter((item) => item.status === "PENDING" && (!employeeId || item.employeeId === employeeId)).length;
  const reminder = todayReminderDue(todayEvents);
  const lastStatus = lastEvent.status || lastEvent.locationStatus || lastEvent.geofenceStatus || "";
  const inside = String(lastStatus).toLowerCase().includes("inside") || String(lastStatus).toLowerCase().includes("active") || String(lastStatus).toLowerCase().includes("in_range");
  shell(`
    <section class="employee-home-flow">
      <article class="employee-hero-card home-welcome">
        ${employeeHeaderCell(employee)}
        <p>ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ ÙŠÙˆÙ…ÙŠÙ‹Ø§ ÙÙŠ Ø´Ø§Ø´Ø© ÙˆØ§Ø­Ø¯Ø©: Ø¨ØµÙ…Ø©ØŒ Ù…ÙˆÙ‚Ø¹ØŒ Ø¥Ø¬Ø§Ø²Ø©ØŒ Ù…Ø£Ù…ÙˆØ±ÙŠØ©ØŒ Ø´ÙƒÙˆÙ‰ØŒ ÙˆØ¥Ø´Ø¹Ø§Ø±Ø§Øª.</p>
        <div class="hero-meta"><span class="hero-chip">${escapeHtml(fullDateText())}</span><span class="hero-chip">Ø§Ù„Ø³Ø§Ø¹Ø© ${escapeHtml(timeNowText())}</span>${todayEvents.length ? `<span class="hero-chip success">ØªÙ… ØªØ³Ø¬ÙŠÙ„ ${todayEvents.length} Ø­Ø±ÙƒØ© Ø§Ù„ÙŠÙˆÙ…</span>` : `<span class="hero-chip warning">Ù„Ù… ØªØ³Ø¬Ù„ Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…</span>`}</div>
      </article>

      ${reminder ? `<article class="employee-card full attendance-reminder-card"><h2>ØªØ°ÙƒÙŠØ± Ø¨ØµÙ…Ø© 10:00 ØµØ¨Ø§Ø­Ù‹Ø§</h2><p>Ù„Ù… ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†. ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø© Ø¹Ù†Ø¯ Ø§Ù„ÙˆØµÙˆÙ„. Ø³ÙŠØµÙ„Ùƒ ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ Ø§Ù„Ø³Ø§Ø¹Ø© 9:30 ØµØ¨Ø§Ø­Ù‹Ø§.</p><button class="button primary full" data-route="punch">ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¢Ù†</button></article>` : ""}

      <article class="employee-card full punch-primary-card">
        <div class="panel-kicker">Ø§Ù„Ø¨ØµÙ…Ø© Ø§Ù„ÙŠÙˆÙ…ÙŠØ©</div>
        <h2>${todayEvents.length ? "Ù…ØªØ§Ø¨Ø¹Ø© Ø­Ø±ÙƒØ© Ø§Ù„ÙŠÙˆÙ…" : "Ø¬Ø§Ù‡Ø² Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ±"}</h2>
        <p>${todayEvents.length ? `Ø¢Ø®Ø± Ø­Ø±ÙƒØ© Ù…Ø³Ø¬Ù„Ø©: ${escapeHtml(date(lastEvent.eventAt || lastEvent.createdAt))}` : "Ø³Ø¬Ù‘Ù„ Ø­Ø¶ÙˆØ±Ùƒ Ø¹Ù†Ø¯ Ø§Ù„ÙˆØµÙˆÙ„ØŒ Ø£Ùˆ Ø£Ø±Ø³Ù„ Ù…ÙˆÙ‚Ø¹Ùƒ Ù„Ùˆ Ø·Ù„Ø¨ØªÙ‡ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©."}</p>
        <div class="employee-actions-row"><button class="button primary" data-route="punch">ÙØªØ­ Ø§Ù„Ø¨ØµÙ…Ø©</button><button class="button ghost" data-route="location">Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹ÙŠ</button></div>
      </article>

      <article class="employee-card full location-status-card">
        <h2>Ø­Ø§Ù„Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹</h2>
        ${lastEvent?.id ? readableLocationBlock(lastEvent) : `<div class="readable-location"><div><span class="pill warning">Ù„Ù… ÙŠØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ø¨Ø¹Ø¯</span><strong>${branchName()}</strong><small>${branchArea()}</small></div></div>`}
        <div class="employee-actions-row"><button class="button ghost small" data-route="punch">Ø¹Ø±Ø¶ Ø§Ù„Ø®Ø±ÙŠØ·Ø© ÙˆØ§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹</button></div>
      </article>

      <div class="employee-actions-row v10-permissions-row"><button class="button ghost small" data-enable-notifications type="button">ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª</button><button class="button ghost small" data-enable-location type="button">ØªÙØ¹ÙŠÙ„ Ø§Ù„Ù…ÙˆÙ‚Ø¹</button></div>
      <section class="quick-actions-grid unified-actions">
        ${compactMetric("Ø¨ØµÙ…Ø§Øª Ø§Ù„ÙŠÙˆÙ…", todayEvents.length, "ðŸ‘", "punch")}
        ${compactMetric("Ø¥Ø´Ø¹Ø§Ø±Ø§Øª", unread, "ðŸ””", "notifications")}
        ${compactMetric("Ø·Ù„Ø¨Ø§Øª Ù…ÙˆÙ‚Ø¹", pendingLive, "ðŸ“", "location")}
        ${compactMetric("Ø¥Ø¬Ø§Ø²Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", pendingLeaves, "ðŸ–", "leaves")}
        ${compactMetric("Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª Ù…Ø¹Ù„Ù‚Ø©", pendingMissions, "ðŸš—", "missions")}
        ${compactMetric("Ù…Ù‡Ø§Ù…ÙŠ", tasks.filter((t) => t.status !== "COMPLETED").length, "âœ…", "tasks")}
        ${compactMetric("ØªÙ‚ÙŠÙŠÙ…ÙŠ KPI", "ÙØªØ­", "ðŸ“Š", "kpi")}
        ${compactMetric("Ø´ÙƒÙˆÙ‰/Ø®Ù„Ø§Ù", "Ø±ÙØ¹", "âš–ï¸", "disputes")}
        ${getManagerLikeRole() ? compactMetric("ÙØ±ÙŠÙ‚ÙŠ", "Ø¥Ø¯Ø§Ø±Ø©", "ðŸ‘¥", "team") : ""}
      </section>

      <article class="employee-card full context-state-card">
        <h2>Ø­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ…</h2>
        ${inside ? `<p class="success-text">Ø£Ù†Øª Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ù…Ø¬Ù…Ø¹ Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨ØŒ ÙˆÙŠÙ…ÙƒÙ† Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¨ØµÙ…Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¥Ø°Ø§ Ø§ÙƒØªÙ…Ù„Øª Ø®Ø·ÙˆØ§Øª Ø§Ù„ØªØ­Ù‚Ù‚.</p>` : `<p class="warning-text">Ø¥Ø°Ø§ ÙƒÙ†Øª Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹ØŒ Ø³ÙŠØªÙ… Ø°ÙƒØ± Ø§Ù„Ù…ÙƒØ§Ù† Ø§Ù„ÙØ¹Ù„ÙŠ Ù…Ø¹ Ù…Ù„Ø§Ø­Ø¸ØªÙƒØŒ ÙˆÙ‚Ø¯ ØªÙØ­ÙˆÙ‘Ù„ Ø§Ù„Ø¨ØµÙ…Ø© Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø£Ùˆ Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ©.</p>`}
        <div class="employee-actions-row"><button class="button ghost" data-route="missions">Ø·Ù„Ø¨ Ù…Ø£Ù…ÙˆØ±ÙŠØ©</button><button class="button ghost" data-route="leaves">Ø·Ù„Ø¨ Ø¥Ø¬Ø§Ø²Ø©</button></div>
      </article>

      <article class="employee-card full"><h2>Ø¢Ø®Ø± Ø¨ØµÙ…Ø§ØªÙŠ</h2>${myEvents.length ? `<div class="employee-list">${myEvents.slice(0, 3).map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(statusLabel(item.type || item.eventType || "Ø­Ø±ÙƒØ©"))}</strong><span>${escapeHtml(date(item.eventAt || item.createdAt))}</span><small>${escapeHtml(locationLabelFromRecord(item))}</small></div><div class="list-item-side">${locationStatusBadge(item)}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ØµÙ…Ø§Øª Ù…Ø³Ø¬Ù„Ø© Ø¨Ø¹Ø¯.</div>`}</article>
      <article class="employee-card full"><h2>Ø¢Ø®Ø± Ø·Ù„Ø¨Ø§ØªÙŠ</h2>${renderRequestList([...leaves.filter((x)=>x.employeeId===employeeId), ...missions.filter((x)=>x.employeeId===employeeId)].slice(0,3))}</article>
    </section>
  `, "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©", "Ù…Ù„Ø®Øµ Ø³Ø±ÙŠØ¹ ÙˆÙ…Ø®ØªØµØ± Ù„Ø­Ø³Ø§Ø¨Ùƒ Ø§Ù„ÙŠÙˆÙ….");
}

async function renderActionCenter() {
  const data = await endpoints.myActionCenter().then(unwrap).catch(() => ({ actions: [] }));
  const actions = data.actions || [];
  shell(`
    <section class="employee-grid">
      <article class="employee-card full ${actions.length ? 'urgent-card' : ''}">
        <div class="panel-kicker">Ù…Ø·Ù„ÙˆØ¨ Ù…Ù†ÙŠ Ø§Ù„Ø¢Ù†</div>
        <h2>${actions.length ? `Ù„Ø¯ÙŠÙƒ ${actions.length} Ø¥Ø¬Ø±Ø§Ø¡ Ù…Ø·Ù„ÙˆØ¨` : 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ù…Ø·Ù„ÙˆØ¨Ø©'}</h2>
        <p>Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø© ØªØ¬Ù…Ø¹ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ Ù…Ù†Ùƒ Ø¨Ø¯Ù„ Ø§Ù„Ø¨Ø­Ø« Ø¯Ø§Ø®Ù„ Ø§Ù„ØµÙØ­Ø§Øª: Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹ØŒ Ø³ÙŠØ§Ø³Ø©ØŒ Ù…Ù‡Ù…Ø©ØŒ Ù…Ø³ØªÙ†Ø¯ØŒ Ø£Ùˆ Ø¨ØµÙ…Ø© ØªØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©.</p>
      </article>
      ${actions.length ? actions.map((item) => `
        <article class="employee-card full">
          <div class="panel-kicker">${escapeHtml(item.type || 'ACTION')} â€” ${escapeHtml(item.severity || '')}</div>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.body || '')}</p>
          <button class="button primary" data-route="${escapeHtml(item.route || 'home')}">ÙØªØ­ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡</button>
        </article>
      `).join('') : `<article class="employee-card full"><div class="empty-state">ÙƒÙ„ Ø´ÙŠØ¡ Ù…ÙƒØªÙ…Ù„ Ø­Ø§Ù„ÙŠÙ‹Ø§. ØªØ§Ø¨Ø¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆØ§Ù„Ù…Ù‡Ø§Ù… ÙŠÙˆÙ…ÙŠÙ‹Ø§.</div></article>`}
    </section>
  `, "Ù…Ø·Ù„ÙˆØ¨ Ù…Ù†ÙŠ Ø§Ù„Ø¢Ù†", "Ù…Ø±ÙƒØ² Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª Ø§Ù„Ø¹Ø§Ø¬Ù„Ø© Ù„Ù„Ù…ÙˆØ¸Ù.");
}


async function renderPunch() {
  let address = {};
  let events = [];
  try {
    [address, events] = await Promise.all([
      endpoints.attendanceAddress().then(unwrap),
      endpoints.myAttendanceEvents().then(unwrap).catch(() => []),
    ]);
  } catch (error) {
    shell(`<section class="employee-card"><h2>Ù„Ø§ ÙŠÙ…ÙƒÙ† ÙØªØ­ Ø§Ù„Ø¨ØµÙ…Ø©</h2><p>${escapeHtml(error.message || "Ø§Ù„Ø­Ø³Ø§Ø¨ ØºÙŠØ± Ù…Ø±ØªØ¨Ø· Ø¨Ù…ÙˆØ¸Ù.")}</p></section>`, "Ø§Ù„Ø¨ØµÙ…Ø©", "ÙŠÙ„Ø²Ù… Ø±Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ù…ÙˆØ¸Ù.");
    return;
  }
  const employee = address.employee || state.user?.employee || employeeSubject();
  const employeeId = state.user?.employeeId || state.user?.employee?.id || employee.id;
  const myEvents = events.filter((event) => !employeeId || event.employeeId === employeeId);
  const todayEvents = myEvents.filter((event) => String(event.eventAt || event.createdAt || "").startsWith(todayIso()));
  const suggestedType = todayEvents.length && isMorningPunchTime() === false ? "out" : (todayEvents.some((e)=>String(e.type||e.eventType||"").toLowerCase().includes("in")) ? "out" : "in");
  const primaryLabel = suggestedType === "in" ? "Ø¨ØµÙ…Ø© Ø­Ø¶ÙˆØ± Ø§Ù„Ø¢Ù†" : "Ø¨ØµÙ…Ø© Ø§Ù†ØµØ±Ø§Ù Ø§Ù„Ø¢Ù†";
  const secondaryLabel = suggestedType === "in" ? "Ø¨ØµÙ…Ø© Ø§Ù†ØµØ±Ø§Ù" : "Ø¨ØµÙ…Ø© Ø­Ø¶ÙˆØ±";
  shell(`
    <section class="employee-grid punch-mobile punch-redesigned">
      <article class="employee-card full">
        <div class="punch-focus">${employeeHeaderCell(employee)}<div class="punch-orb">ðŸ‘</div></div>
        <div class="branch-readable-card">
          <div class="branch-circle">ðŸ“</div>
          <div><strong>${branchName()}</strong><small>${branchArea()}</small></div>
        </div>
        <div id="gps-map-preview" class="gps-map-preview"><div class="geo-circle"><span>Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹</span><i></i></div><small>Ø§Ø¶ØºØ· Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù„Ø¹Ø±Ø¶ Ø­Ø§Ù„ØªÙƒ Ø¯Ø§Ø®Ù„/Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹.</small></div>
        ${attendanceNoteField()}
        <div class="employee-actions-stack punch-actions-clear">
          <button class="button primary full" data-punch-type="${suggestedType}">${primaryLabel}</button>
          <button class="button ghost full" data-punch-type="${suggestedType === "in" ? "out" : "in"}">${secondaryLabel}</button>
          <button class="button ghost small" data-test-gps type="button">Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹ / Ø¹Ø±Ø¶ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</button>
        </div>
        <div id="punch-result" class="message compact hidden"></div>
        <p class="form-hint">ØªØ³Ø¬ÙŠÙ„/ØªØ­Ø¯ÙŠØ« Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø§Ù†ØªÙ‚Ù„ Ø¥Ù„Ù‰: Ø­Ø³Ø§Ø¨ÙŠ â† Ø£Ù…Ø§Ù† Ø§Ù„Ø¬Ù‡Ø§Ø²ØŒ Ø­ØªÙ‰ Ù„Ø§ ÙŠØ®ØªÙ„Ø· Ø¨Ø²Ø± Ø§Ù„Ø¨ØµÙ…Ø©.</p>
      </article>
      <article class="employee-card full"><h2>Ø¢Ø®Ø± Ø¨ØµÙ…Ø§ØªÙŠ</h2>${myEvents.length ? `<div class="employee-list">${myEvents.slice(0, 5).map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(statusLabel(item.type || item.eventType || "Ø­Ø±ÙƒØ©"))}</strong><span>${escapeHtml(date(item.eventAt || item.createdAt))}</span><small>${escapeHtml(locationLabelFromRecord(item))}</small>${item.notes ? `<small>Ù…Ù„Ø§Ø­Ø¸Ø©: ${escapeHtml(item.notes)}</small>` : ""}</div><div class="list-item-side">${locationStatusBadge(item)}${badge(item.riskLevel || item.status || "")}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ØµÙ…Ø§Øª Ù…Ø³Ø¬Ù„Ø©.</div>`}</article>
    </section>
  `, "Ø§Ù„Ø¨ØµÙ…Ø©", "ØªØ³Ø¬ÙŠÙ„ Ø­Ø¶ÙˆØ± Ø£Ùˆ Ø§Ù†ØµØ±Ø§Ù Ø¨Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² + GPS.");

  const resultBox = app.querySelector("#punch-result");
  app.querySelector("[data-test-gps]")?.addEventListener("click", async () => {
    try {
      resultBox?.classList.remove("hidden", "danger-box");
      if (resultBox) resultBox.textContent = "Ø¬Ø§Ø±ÙŠ Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¨Ø¯Ù‚Ø© Ø¹Ø§Ù„ÙŠØ©...";
      const current = await getVerifiedBrowserLocation(employeeId);
      const normalized = { ...current, status: current.geofenceStatus || (current.insideBranch ? "inside_branch" : (current.locationUncertain ? "location_uncertain" : "outside_branch")), addressLabel: current.insideBranch ? `${branchName()} â€” ${branchArea()}` : (current.addressLabel || (current.locationUncertain ? "Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…Ø¤ÙƒØ¯" : "Ù…ÙˆÙ‚Ø¹ Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹")) };
      sessionStorage.setItem("hr.employee.lastGpsTest", JSON.stringify({ ...normalized, testedAt: new Date().toISOString() }));
      const preview = app.querySelector("#gps-map-preview");
      if (preview) preview.innerHTML = `${readableLocationBlock(normalized)}<a class="button ghost small" target="_blank" rel="noopener" href="https://maps.google.com/?q=${encodeURIComponent(`${current.latitude},${current.longitude}`)}">ÙØªØ­ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</a>`;
      if (resultBox) resultBox.textContent = current.insideBranch ? "Ø£Ù†Øª Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ù…Ø¬Ù…Ø¹ Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨." : (current.locationUncertain ? "Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…Ø¤ÙƒØ¯Ø› Ù„Ù† Ù†Ø­ÙƒÙ… Ø£Ù†Ùƒ Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹ØŒ ÙˆØ³ÙŠÙØ±Ø³Ù„ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ù…Ø¹ Ø§Ù„Ø¯Ù‚Ø© ÙˆØ§Ù„Ù…Ø³Ø§ÙØ©." : "Ø£Ù†Øª Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹ØŒ Ø³ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ù…ÙƒØ§Ù† Ø§Ù„ÙØ¹Ù„ÙŠ ÙˆØ§Ù„Ù…Ù„Ø§Ø­Ø¸Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø¨ØµÙ…Ø©.");
    } catch (error) {
      resultBox?.classList.remove("hidden");
      resultBox?.classList.add("danger-box");
      if (resultBox) resultBox.textContent = friendlyError(error, "ØªØ¹Ø°Ø± Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹.");
    }
  });

  app.querySelectorAll("[data-punch-type]").forEach((button) => button.addEventListener("click", async () => {
    const type = button.dataset.punchType || "in";
    const actionText = type === "out" ? "Ø§Ù†ØµØ±Ø§Ù" : "Ø­Ø¶ÙˆØ±";
    try {
      resultBox?.classList.remove("hidden", "danger-box");
      if (resultBox) resultBox.textContent = `Ø¬Ø§Ø±ÙŠ ØªØ£ÙƒÙŠØ¯ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø«Ù… GPS Ù„ØªØ³Ø¬ÙŠÙ„ ${actionText}...`;
      const preFingerprint = await getDeviceFingerprintHash().catch(() => "");
      const policyAck = await ensureAttendancePolicyAcknowledged({ endpoints, employee, deviceFingerprintHash: preFingerprint });
      const device = await requestBrowserPasskeyForAction(`ØªØ£ÙƒÙŠØ¯ Ø¨ØµÙ…Ø© ${actionText}`, employee, { autoRegisterOnMissing: true, resultBox });
      if (!state.lastLocation) await window.HRExplainAndEnableLocation?.();
      if (resultBox) resultBox.textContent = "Ø¬Ø§Ø±ÙŠ Ù‚Ø±Ø§Ø¡Ø© GPS ÙˆØ§Ù„ØªÙ‚Ø§Ø· ØµÙˆØ±Ø© ØªØ­Ù‚Ù‚...";
      const current = await getVerifiedBrowserLocation(employeeId, { samples: 4, windowMs: 10000, targetAccuracy: 60 });
      state.lastLocation = current;
      const selfie = await capturePunchSelfie({ endpoints, employeeId, resultBox }).catch((error) => ({ ok: false, reason: "SELFIE_CAPTURE_FAILED", message: error?.message || "ØªØ¹Ø°Ø± Ø§Ù„ØªÙ‚Ø§Ø· ØµÙˆØ±Ø© Ø§Ù„ØªØ­Ù‚Ù‚.", selfieUrl: "" }));
      if (!selfie.ok) throw new Error(selfie.message || "ÙŠÙ„Ø²Ù… Ø§Ù„ØªÙ‚Ø§Ø· ØµÙˆØ±Ø© ØªØ­Ù‚Ù‚ Ù‚Ø¨Ù„ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø©.");
      if (!current.latitude || !current.longitude || current.locationPermission === "denied") throw new Error("Ù„Ù… ÙŠØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª GPS. ÙØ¹Ù‘Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù…Ù† Ø§Ù„Ù…ØªØµÙØ­ ÙˆØ§Ø¶ØºØ· Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø£ÙˆÙ„Ø§Ù‹.");
      const qr = isQrDisabled() ? { valid: true, status: "DISABLED", riskFlags: [], requiresReview: false } : await requestBranchQrChallenge({ endpoints, branchId: address.branch?.id || address.branchId || "main" }).catch(() => ({ status: "NOT_PROVIDED" }));
      const trustedDevice = await ensureTrustedDeviceApproval({ endpoints, employee, device: { ...device, deviceFingerprintHash: device.deviceFingerprintHash || preFingerprint }, selfieUrl: selfie.selfieUrl || selfie.url || "", location: current }).catch(() => ({ status: "PENDING_REVIEW", requiresReview: true, riskFlags: ["DEVICE_APPROVAL_CHECK_FAILED"] }));
      const status = current.insideBranch ? "inside_branch" : (current.locationUncertain ? "location_uncertain" : "outside_branch");
      const locationTrust = analyzeLocationTrust(current, { branch: address.branch || address, geofenceStatus: current.geofenceStatus || status });
      const risk = mergeRiskSignals(calculateAttendanceRisk({ employeeId, location: current, device, selfie, evaluation: { ...(trustedDevice || {}), geofenceStatus: status } }), locationTrust, qr, trustedDevice);
      const v4 = await evaluateAttendanceV4Controls({ endpoints, employee, device: { ...device, deviceFingerprintHash: device.deviceFingerprintHash || preFingerprint }, location: current, risk }).catch(() => ({}));
      const merged = mergeV4RiskSignals ? mergeV4RiskSignals(risk, v4) : risk;
      const faceDisabled = isFaceSelfieDisabled();
      const insideBranch = status === "inside_branch" || String(current.geofenceStatus || "").includes("inside_branch");
      const finalRiskFlags = Array.from(new Set(merged.riskFlags || risk.riskFlags || []))
        .filter((flag) => !(faceDisabled && ["MISSING_SELFIE", "FACE_SELFIE_TEMP_DISABLED", "SELFIE_CAPTURE_FAILED"].includes(String(flag))));
      const directRecord = insideBranch && device.ok !== false && current.locationPermission === "granted";
      const finalRequiresReview = directRecord ? false : Boolean(merged.requiresReview || risk.requiresReview || status !== "inside_branch");
      const finalRiskScore = directRecord ? 0 : Number(merged.riskScore ?? risk.riskScore ?? 0);
      const finalRiskLevel = directRecord ? "LOW" : (merged.riskLevel || risk.riskLevel || "MEDIUM");
      const notes = app.querySelector("#punch-notes")?.value || "";
      const body = { ...current, type: type === "out" ? "CHECK_OUT" : "CHECK_IN", eventType: type, employeeId, notes, status, locationStatus: status, addressLabel: current.insideBranch ? `${branchName()} â€” ${branchArea()}` : (current.addressLabel || current.locationLabel || (current.locationUncertain ? "Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…Ø¤ÙƒØ¯ â€” Ù…Ø±Ø§Ø¬Ø¹Ø©" : "Ø®Ø§Ø±Ø¬ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹")), verificationStatus: "verified", biometricMethod: isQrDisabled() ? "passkey+gps" : "passkey+gps+qr", passkeyCredentialId: device.passkeyCredentialId, trustedDeviceId: device.trustedDeviceId, deviceFingerprintHash: device.deviceFingerprintHash || preFingerprint, browserInstallId: policyAck.browserInstallId || "", selfieUrl: selfie.selfieUrl || selfie.url || "", branchQrStatus: qr.status, branchQrChallengeId: qr.challengeId || "", antiSpoofingFlags: locationTrust.flags || [], riskScore: finalRiskScore, riskLevel: finalRiskLevel, riskFlags: finalRiskFlags, requiresReview: finalRequiresReview };
      if (!device.ok || !selfie.ok || current.locationPermission === "denied") await createFormalFallbackRequest?.({ endpoints, reason: "IDENTITY_COMPONENT_FAILED", body }).catch(() => submitFallbackAttendanceRequest({ endpoints, reason: "IDENTITY_COMPONENT_FAILED", body }).catch(() => null));
      await endpoints.recordAttendance(body);
      rememberDevicePunch(body.deviceFingerprintHash, employeeId);
      setMessage(status === "inside_branch" ? `ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© ${actionText} Ø¯Ø§Ø®Ù„ Ù…Ø¬Ù…Ø¹ Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨.` : (status === "location_uncertain" ? `ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© ${actionText} ÙƒÙ…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…Ø¤ÙƒØ¯ ÙˆØ³ØªØ¸Ù‡Ø± Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¨Ø¯Ù„ Ø§Ù„Ø­ÙƒÙ… Ø¨Ø§Ù„Ø®Ø±ÙˆØ¬.` : `ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© ${actionText} Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹ ÙˆØ³ØªØ¸Ù‡Ø± Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ù…Ø¹ Ø§Ù„Ù…ÙƒØ§Ù† ÙˆØ§Ù„Ù…Ù„Ø§Ø­Ø¸Ø©.`), "");
      renderPunch();
    } catch (error) {
      resultBox?.classList.remove("hidden");
      resultBox?.classList.add("danger-box");
      if (resultBox) resultBox.textContent = friendlyError(error, "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø©.");
    }
  }));
}

async function renderLocation() {
  const [rows, liveRequests, _actionCenter, passkeys] = await Promise.all([
    endpoints.locations().then(unwrap).catch(() => []),
    endpoints.myLiveLocationRequests().then(unwrap).catch(() => []),
    endpoints.myActionCenter().then(unwrap).catch(() => ({ actions: [] })),
    endpoints.passkeyStatus().then(unwrap).catch(() => []),
  ]);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const employee = state.user?.employee || { id: employeeId, fullName: state.user?.fullName || "Ø§Ù„Ù…ÙˆØ¸Ù" };
  const trustedPasskeys = filterEmployeePasskeys(passkeys || [], state.user || {}, employee);
  const hasTrustedDevice = trustedPasskeys.length > 0;
  const mine = rows.filter((item) => !item.employeeId || item.employeeId === employeeId).slice(0, 20);
  const pending = liveRequests.filter((item) => item.status === "PENDING").slice(0, 5);
  shell(`
    <section class="employee-grid">
      ${pending.length ? `<article class="employee-card full urgent-card"><div class="panel-kicker">Ø¥Ø¬Ø±Ø§Ø¡ Ù…Ø·Ù„ÙˆØ¨</div><h2>Ø·Ù„Ø¨Ø§Øª Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©</h2><p>Ø´Ø§Ø±Ùƒ Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ ÙÙ‚Ø· Ø¹Ù†Ø¯ Ù…ÙˆØ§ÙÙ‚ØªÙƒ. ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø·Ù„Ø¨ ÙˆØ§Ù„Ø±Ø¯ ÙÙŠ Ø³Ø¬Ù„ Ø§Ù„Ù†Ø¸Ø§Ù….</p><div class="employee-list">${pending.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.requestedByName || "Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©")}</strong><span>${escapeHtml(item.reason || "Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø±")}</span><small>ÙŠÙ†ØªÙ‡ÙŠ: ${escapeHtml(date(item.expiresAt))}</small></div><div class="list-item-side"><button class="button primary" data-live-send="${escapeHtml(item.id)}">Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹ÙŠ</button><button class="button ghost" data-live-reject="${escapeHtml(item.id)}">Ø±ÙØ¶</button></div></div>`).join("")}</div></article>` : ""}
      <article class="employee-card full">
        <div class="panel-kicker">Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø±</div>
        <h2>Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ</h2>
        <p>Ø§Ø³ØªØ®Ø¯Ù… Ù‡Ø°Ø§ Ø§Ù„Ø²Ø± Ù„Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø·ÙˆØ¹Ù‹Ø§ Ø£Ùˆ Ø¹Ù†Ø¯ ÙˆØ¬ÙˆØ¯ Ø·Ù„Ø¨ Ù…Ù† Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©. Ù„Ø§ ÙŠÙˆØ¬Ø¯ ØªØªØ¨Ø¹ Ù…Ø³ØªÙ…Ø± ÙÙŠ Ø§Ù„Ø®Ù„ÙÙŠØ©.</p>
        <button class="button primary full" data-send-location>Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹ÙŠ Ø§Ù„Ø¢Ù†</button>
        <div class="device-inline-status ${hasTrustedDevice ? 'ok' : 'warn'}">
          <strong>${hasTrustedDevice ? 'âœ… Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ù…Ø³Ø¬Ù„Ø©' : 'âš ï¸ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² ØºÙŠØ± Ù…Ø³Ø¬Ù„Ø©'}</strong>
          <span>${hasTrustedDevice ? 'Ø³ÙŠØ·Ù„Ø¨ Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨ØµÙ…Ø© Ø§Ù„Ù‡Ø§ØªÙ Ù‚Ø¨Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹.' : 'ÙŠÙ…ÙƒÙ† ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ Ù…Ù† Ù‡Ù†Ø§ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¨Ø¯ÙˆÙ† Ø§Ù„Ø°Ù‡Ø§Ø¨ Ù„Ø­Ø³Ø§Ø¨ÙŠ.'}</span>
          ${hasTrustedDevice ? '' : '<button class="button ghost full" type="button" data-register-location-passkey>ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø² Ø§Ù„Ø¢Ù†</button>'}
        </div>
        <div id="location-result" class="risk-box hidden"></div>
      </article>
      <article class="employee-card full"><h2>Ø³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹ ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${statusLabel(item.status)}</strong><span>${date(item.requestedAt || item.date || item.createdAt)}</span><small>${item.latitude && item.longitude ? `${escapeHtml(item.latitude)} , ${escapeHtml(item.longitude)}` : "Ù„Ù… ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ø¨Ø¹Ø¯"}</small></div><div class="list-item-side">${item.latitude && item.longitude ? `<a target="_blank" rel="noopener" class="button ghost" href="https://www.google.com/maps?q=${escapeHtml(item.latitude)},${escapeHtml(item.longitude)}">Ø®Ø±ÙŠØ·Ø©</a>` : badge(item.status || "PENDING")}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù…ÙˆÙ‚Ø¹ Ø¨Ø¹Ø¯.</div>`}</article>
      <article class="employee-card full"><h2>Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</h2>${liveRequests.length ? `<div class="employee-list">${liveRequests.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.requestedByName || "Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©")}</strong><span>${escapeHtml(item.reason || "Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹")}</span><small>${escapeHtml(date(item.createdAt))}</small></div><div class="list-item-side">${badge(item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ù…Ø¨Ø§Ø´Ø±Ø©.</div>`}</article>
    </section>
  `, "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "Ù…Ø´Ø§Ø±ÙƒØ© Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¨Ù…ÙˆØ§ÙÙ‚Ø© Ø§Ù„Ù…ÙˆØ¸Ù Ø¹Ù†Ø¯ Ø§Ù„Ø·Ù„Ø¨.");
  const result = app.querySelector("#location-result");
  const sendLive = async (id) => {
    result?.classList.remove("hidden", "danger-box");
    if (result) result.textContent = "Ø¬Ø§Ø±ÙŠ ØªØ£ÙƒÙŠØ¯ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ù‚Ø¨Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹...";
    const device = await requestBrowserPasskeyForAction("Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹", state.user?.employee || {}, { autoRegisterOnMissing: true, resultBox: result });
    const passkeyCredentialId = device.passkeyCredentialId;
    if (result) result.textContent = "Ø¬Ø§Ø±ÙŠ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¨Ø¯Ù‚Ø© Ø¹Ø§Ù„ÙŠØ©...";
    const current = await getVerifiedBrowserLocation(employeeId);
    if (current.locationPermission !== "granted") throw new Error("Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹. ÙØ¹Ù‘Ù„ GPS ÙˆØ§Ø³Ù…Ø­ Ù„Ù„ØªØ·Ø¨ÙŠÙ‚ Ø¨Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ù…ÙˆÙ‚Ø¹.");
    await endpoints.respondLiveLocationRequest(id, { status: "APPROVED", ...current, biometricMethod: "passkey", passkeyCredentialId });
  };
  app.querySelectorAll("[data-live-send]").forEach((button) => button.addEventListener("click", async () => {
    try { await sendLive(button.dataset.liveSend); setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©.", ""); renderLocation(); } catch (error) { setMessage("", friendlyError(error, "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹.")); renderLocation(); }
  }));
  app.querySelectorAll("[data-live-reject]").forEach((button) => button.addEventListener("click", async () => {
    const reason = await askText({ title: "Ø±ÙØ¶ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹", message: "Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø±ÙØ¶ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø­ØªÙ‰ ÙŠØ¸Ù‡Ø± Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©.", defaultValue: "ØºÙŠØ± Ù…ØªØ§Ø­ Ø§Ù„Ø¢Ù†", confirmLabel: "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±ÙØ¶" });
    if (reason === null) return;
    try { await endpoints.respondLiveLocationRequest(button.dataset.liveReject, { status: "REJECTED", reason }); setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø³Ø¨Ø¨ Ø§Ù„Ø±ÙØ¶ Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©.", ""); renderLocation(); } catch (error) { setMessage("", error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ø±Ø¯."); renderLocation(); }
  }));
  app.querySelector("[data-register-location-passkey]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    try {
      button.disabled = true;
      result?.classList.remove("hidden", "danger-box");
      if (result) result.textContent = "Ø§ÙØªØ­ Ø¨ØµÙ…Ø© Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ù‚ÙÙ„ Ø§Ù„Ø´Ø§Ø´Ø© Ù„ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø²...";
      await registerBrowserPasskey();
      if (result) result.textContent = "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø¨Ù†Ø¬Ø§Ø­. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹Ùƒ Ø£Ùˆ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¨ØµÙ…Ø©.";
      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø¨Ù†Ø¬Ø§Ø­.", "");
      renderLocation();
    } catch (error) {
      result?.classList.remove("hidden");
      result?.classList.add("danger-box");
      if (result) result.textContent = friendlyError(error, "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø².");
    } finally {
      button.disabled = false;
    }
  });
  app.querySelector("[data-send-location]")?.addEventListener("click", async () => {
    try {
      result?.classList.remove("hidden", "danger-box");
      if (result) result.textContent = "Ø¬Ø§Ø±ÙŠ ØªØ£ÙƒÙŠØ¯ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ù‚Ø¨Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹...";
      const device = await requestBrowserPasskeyForAction("Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹", state.user?.employee || {}, { autoRegisterOnMissing: true, resultBox: result });
      const passkeyCredentialId = device.passkeyCredentialId;
      if (result) result.textContent = "Ø¬Ø§Ø±ÙŠ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹...";
      const current = await getVerifiedBrowserLocation(employeeId);
      if (current.locationPermission !== "granted") throw new Error("Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹.");
      const pendingLocationRequest = mine.find((item) => item.status === "PENDING" && item.id && String(item.id).startsWith("locreq"));
      if (pendingLocationRequest) await endpoints.updateLocationRequest(pendingLocationRequest.id, { status: "APPROVED", ...current, biometricMethod: "passkey", passkeyCredentialId });
      else await endpoints.recordLocation({ employeeId, source: "employee_app", status: "ACTIVE", ...current, biometricMethod: "passkey", passkeyCredentialId });
      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ù†Ø¬Ø§Ø­.", "");
      renderLocation();
    } catch (error) {
      if (result) { result.classList.remove("hidden"); result.classList.add("danger-box"); result.textContent = friendlyError(error, "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹."); }
    }
  });
}


async function renderLeaves() {
  const leaves = await endpoints.leaves().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = leaves.filter((item) => !employeeId || item.employeeId === employeeId).slice(0, 30);
  shell(`
    <section class="employee-grid">
      <form class="employee-card full" data-ajax="leave">
        <div class="panel-kicker">Ù…Ø³Ø§Ø± Ø§Ø¹ØªÙ…Ø§Ø¯: Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø«Ù… HR</div>
        <h2>Ø·Ù„Ø¨ Ø¥Ø¬Ø§Ø²Ø©</h2>
        <p>ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨ Ø£ÙˆÙ„Ù‹Ø§ Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±ØŒ ÙˆØ¨Ø¹Ø¯ Ù…ÙˆØ§ÙÙ‚ØªÙ‡ ÙŠÙ†ØªÙ‚Ù„ Ø¥Ù„Ù‰ HR Ù„Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ.</p>
        <div class="employee-form-grid">
          <label>Ù†ÙˆØ¹ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©<select name="leaveType"><option>Ø§Ø¹ØªÙŠØ§Ø¯ÙŠØ©</option><option>Ù…Ø±Ø¶ÙŠØ©</option><option>Ø·Ø§Ø±Ø¦Ø©</option></select></label>
          <label>Ù…Ù† ØªØ§Ø±ÙŠØ®<input type="date" name="startDate" required /></label>
          <label>Ø¥Ù„Ù‰ ØªØ§Ø±ÙŠØ®<input type="date" name="endDate" required /></label>
          <label class="span-2">Ø§Ù„Ø³Ø¨Ø¨<textarea name="reason" rows="3" required></textarea></label>
        </div>
        <input type="hidden" name="workflowStatus" value="pending_manager_review" />
        <button class="button primary full" type="submit">Ø¥Ø±Ø³Ø§Ù„ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</button>
      </form>
      <article class="employee-card full"><h2>Ø·Ù„Ø¨Ø§ØªÙŠ</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.leaveType?.name || item.leaveType || "Ø¥Ø¬Ø§Ø²Ø©")}</strong><span>${escapeHtml(item.startDate || "-")} Ø¥Ù„Ù‰ ${escapeHtml(item.endDate || "-")}</span><small>${escapeHtml(item.managerDecision ? `Ù‚Ø±Ø§Ø± Ø§Ù„Ù…Ø¯ÙŠØ±: ${item.managerDecision}` : "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ù…Ø³Ø§Ø± Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯")}</small></div><div class="list-item-side">${badge(item.finalStatus || item.workflowStatus || item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø¥Ø¬Ø§Ø²Ø©.</div>`}</article>
    </section>
  `, "Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª", "ØªÙ‚Ø¯ÙŠÙ… Ø·Ù„Ø¨ Ø¥Ø¬Ø§Ø²Ø© ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯.");
}

async function renderMissions() {
  const missions = await endpoints.missions().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = missions.filter((item) => !employeeId || item.employeeId === employeeId).slice(0, 30);
  shell(`
    <section class="employee-grid">
      <form class="employee-card full" data-ajax="mission">
        <div class="panel-kicker">Ù…Ø³Ø§Ø± Ø§Ø¹ØªÙ…Ø§Ø¯: Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø«Ù… HR</div>
        <h2>Ø·Ù„Ø¨ Ù…Ø£Ù…ÙˆØ±ÙŠØ©</h2>
        <p>Ø§ÙƒØªØ¨ ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ© ÙˆØ§Ù„ÙˆØ¬Ù‡Ø© ÙˆÙ…ÙˆØ¹Ø¯ Ø§Ù„Ø¨Ø¯Ø§ÙŠØ© ÙˆØ§Ù„Ù†Ù‡Ø§ÙŠØ©. ÙŠÙ†ØªÙ‚Ù„ Ø§Ù„Ø·Ù„Ø¨ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø«Ù… HR.</p>
        <label>Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ©<input name="title" required placeholder="Ù…Ø«Ø§Ù„: Ø²ÙŠØ§Ø±Ø© Ø­Ø§Ù„Ø© / ØªÙˆØµÙŠÙ„ Ù…Ø³ØªÙ†Ø¯Ø§Øª" /></label>
        <label>Ø§Ù„ÙˆØ¬Ù‡Ø©<input name="destinationName" required placeholder="Ø§Ø³Ù… Ø§Ù„Ù…ÙƒØ§Ù† Ø£Ùˆ Ø§Ù„Ø¹Ù†ÙˆØ§Ù†" /></label>
        <label>Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ©<input name="plannedStart" type="datetime-local" required /></label>
        <label>Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ©<input name="plannedEnd" type="datetime-local" required /></label>
        <label>Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ©<textarea name="notes" rows="2" placeholder="Ø§ÙƒØªØ¨ ØªÙØ§ØµÙŠÙ„ Ù…Ø®ØªØµØ±Ø© Ø¥Ù† ÙˆØ¬Ø¯Øª"></textarea></label>
        <input type="hidden" name="workflowStatus" value="pending_manager_review" />
        <div class="employee-actions-stack"><button class="button primary">Ø¥Ø±Ø³Ø§Ù„ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</button></div>
      </form>
      <article class="employee-card full"><h2>Ù…Ø£Ù…ÙˆØ±ÙŠØ§ØªÙŠ</h2>${renderRequestList(mine)}</article>
    </section>
  `, "Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª", "Ø·Ù„Ø¨ ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©.");
}

async function renderDisputes() {
  const [payload, employees] = await Promise.all([
    endpoints.disputes().then(unwrap).catch(() => ({ cases: [] })),
    endpoints.employees().then(unwrap).catch(() => []),
  ]);
  const cases = Array.isArray(payload) ? payload : (payload.cases || []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = cases.filter((item) => !item.employeeId || item.employeeId === employeeId).slice(0, 20);
  shell(`
    <section class="employee-grid disputes-polished-page">
      <article class="employee-card full disputes-hero-card">
        <div class="panel-kicker">Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª</div>
        <h2>ØªÙ‚Ø¯ÙŠÙ… Ø´ÙƒÙˆÙ‰ Ø£Ùˆ Ø·Ù„Ø¨ ÙØ¶ Ø®Ù„Ø§Ù</h2>
        <p>ÙŠØªÙ… Ø±ÙØ¹ Ø§Ù„Ø·Ù„Ø¨ Ù„Ù„Ø¬Ù†Ø© Ø§Ù„Ù…Ø®ØªØµØ© Ø¨Ø³Ø±ÙŠØ©ØŒ Ø«Ù… Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø¹Ø¨Ø± Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙˆØ§Ù„ØªØµØ¹ÙŠØ¯ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.</p>
        <div class="workflow-steps compact-workflow">
          ${["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù„Ø¬Ù†Ø©", "Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ"].map((step, index) => `<span><strong>${index + 1}</strong>${escapeHtml(step)}</span>`).join("")}
        </div>
      </article>
      <form class="employee-card full dispute-form-card" data-ajax="dispute">
        <div class="employee-form-grid">
          <div class="span-2 segmented-field">
            <span>Ù†ÙˆØ¹ Ø§Ù„Ø·Ù„Ø¨</span>
            <label><input type="radio" name="category" value="Ø´ÙƒÙˆÙ‰" checked /> Ø´ÙƒÙˆÙ‰</label>
            <label><input type="radio" name="category" value="ÙØ¶ Ø®Ù„Ø§Ù" /> ÙØ¶ Ø®Ù„Ø§Ù</label>
            <label><input type="radio" name="category" value="Ù…Ù„Ø§Ø­Ø¸Ø© Ø³Ù„ÙˆÙƒÙŠØ©" /> Ù…Ù„Ø§Ø­Ø¸Ø© Ø³Ù„ÙˆÙƒÙŠØ©</label>
          </div>
          <div class="span-2 segmented-field danger-levels">
            <span>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©</span>
            <label><input type="radio" name="priority" value="LOW" /> Ø¹Ø§Ø¯ÙŠØ©</label>
            <label><input type="radio" name="priority" value="MEDIUM" checked /> Ù…ØªÙˆØ³Ø·Ø©</label>
            <label><input type="radio" name="priority" value="HIGH" /> Ø¹Ø§Ø¬Ù„Ø©</label>
          </div>
          <label class="span-2 checkbox-line polished-check"><input type="checkbox" name="hasRelatedEmployee" value="yes" data-toggle-related-employee /> Ø§Ù„Ø·Ù„Ø¨ Ù…ØªØ¹Ù„Ù‚ Ø¨Ù…ÙˆØ¸Ù Ù…Ø¹ÙŠÙ†</label>
          <label class="span-2 related-employee-field hidden">Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù…ÙˆØ¸Ù<select name="relatedEmployeeId"><option value="">Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ¸Ù</option>${employees.map((e)=>`<option value="${escapeHtml(e.id)}">${escapeHtml(e.fullName || e.name || e.email || e.id)}</option>`).join("")}</select></label>
          <label class="span-2">Ø¹Ù†ÙˆØ§Ù† Ù…Ø®ØªØµØ±<input name="title" required placeholder="Ù…Ø«Ø§Ù„: Ø®Ù„Ø§Ù ÙÙŠ ØªØ³Ù„ÙŠÙ… Ù…Ù‡Ù…Ø©" /></label>
          <div class="span-2 repeat-grid">
            <label class="checkbox-line polished-check"><input type="checkbox" name="repeatedBefore" value="yes" /> ØªÙƒØ±Ø±Øª Ø³Ø§Ø¨Ù‚Ù‹Ø§</label>
            <label class="checkbox-line polished-check"><input type="checkbox" name="repeatedWithSamePerson" value="yes" /> ØªÙƒØ±Ø±Øª Ù…Ø¹ Ù†ÙØ³ Ø§Ù„Ø´Ø®Øµ</label>
          </div>
          <label class="span-2">Ø§Ù„ØªÙØ§ØµÙŠÙ„ ÙƒØ§Ù…Ù„Ø©<textarea name="description" rows="7" required placeholder="Ø§ÙƒØªØ¨ Ù…Ø§Ø°Ø§ Ø­Ø¯Ø«ØŒ Ù…ØªÙ‰ØŒ Ø£ÙŠÙ†ØŒ ÙˆÙ…Ù† Ø§Ù„Ø£Ø·Ø±Ø§Ù Ø¥Ù† ÙˆØ¬Ø¯ÙˆØ§. ÙƒÙ„Ù…Ø§ ÙƒØ§Ù†Øª Ø§Ù„ØªÙØ§ØµÙŠÙ„ Ø£ÙˆØ¶Ø­ ÙƒØ§Ù† Ø§Ù„Ù‚Ø±Ø§Ø± Ø£Ø³Ø±Ø¹."></textarea></label>
          <label class="span-2">Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø£Ùˆ Ø´Ù‡ÙˆØ¯<input name="notes" placeholder="Ø§Ø®ØªÙŠØ§Ø±ÙŠ" /></label>
          <label class="span-2">Ù…Ø±ÙÙ‚Ø§Øª Ø¯Ø§Ø¹Ù…Ø©<input name="attachmentNote" placeholder="Ø§Ø°ÙƒØ± Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ù…Ù„ÙØ§Øª Ø£Ùˆ Ø³Ù„Ù…Ù‡Ø§ Ù„Ù„Ø¬Ù†Ø© Ø¹Ù†Ø¯ Ø§Ù„Ø·Ù„Ø¨" /></label>
        </div>
        <button class="button primary full" type="submit">Ø±ÙØ¹ Ø§Ù„Ø·Ù„Ø¨ Ù„Ù„Ø¬Ù†Ø©</button>
      </form>
      <article class="employee-card full"><h2>Ø·Ù„Ø¨Ø§ØªÙŠ Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©</h2>${mine.length ? `<div class="employee-list polished-history-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${date(item.createdAt)}</span><small>${escapeHtml(item.publicUpdate || item.committeeDecision || "Ù‚ÙŠØ¯ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù„Ø¬Ù†Ø©")}</small></div><div class="list-item-side">${badge(item.priority || item.severity || "MEDIUM")} ${badge(item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø´ÙƒØ§ÙˆÙ‰ Ù…Ø³Ø¬Ù„Ø©.</div>`}</article>
    </section>
  `, "Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰", "Ø·Ù„Ø¨ Ø´ÙƒÙˆÙ‰ Ø£Ùˆ ÙØ¶ Ø®Ù„Ø§Ù Ø¨Ø³Ø±ÙŠØ© ÙˆÙˆØ¶ÙˆØ­.");
  const toggle = app.querySelector("[data-toggle-related-employee]");
  const field = app.querySelector(".related-employee-field");
  toggle?.addEventListener("change", () => field?.classList.toggle("hidden", !toggle.checked));
}


async function renderKpi() {
  const payload = await endpoints.kpi().then(unwrap).catch(() => ({ metrics: [], evaluations: [], pendingEmployees: [], currentEmployeeId: state.user?.employeeId || state.user?.employee?.id || "" }));
  const employeeId = state.user?.employeeId || state.user?.employee?.id || payload.currentEmployeeId || "";
  const mine = (payload.evaluations || []).find((item) => item.employeeId === employeeId) || {};
  const cycle = payload.cycle || {};
  const windowInfo = payload.windowInfo || cycle.window || {};
  const monthName = cycle.name || `ØªÙ‚ÙŠÙŠÙ… Ø´Ù‡Ø± ${new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}`;
  const total = [
    [mine.targetPercent ?? mine.targetScore, 40],
    [mine.efficiencyPercent ?? mine.efficiencyScore, 20],
    [mine.attendancePercent ?? mine.attendanceScore, 20],
    [mine.quranPercent ?? mine.quranCircleScore, 5],
    [mine.prayerPercent ?? mine.prayerScore, 5],
    [mine.conductPercent ?? mine.conductScore, 5],
    [mine.initiativesPercent ?? mine.initiativesScore, 5],
  ].reduce((sum, [pct, weight]) => sum + (Number(pct || 0) * weight / 100), 0).toFixed(1);
  shell(`
    <section class="employee-grid kpi-advanced">
      <article class="employee-card full accent-card">
        <div class="panel-kicker">KPI Ø´Ù‡Ø±ÙŠ â€” ${escapeHtml(monthName)}</div>
        <h2>Ù†Ù…ÙˆØ°Ø¬ Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø°Ø§ØªÙŠ</h2>
        <p>Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙŠÙØªØ­ Ø§Ù„Ø¯ÙˆØ±Ø©. Ø§Ù„Ù…ÙˆØ¸Ù ÙŠÙ‚ÙŠÙ‘Ù… Ù†ÙØ³Ù‡ Ù…Ù† ÙŠÙˆÙ… 20 Ø¥Ù„Ù‰ 22ØŒ Ø«Ù… HR ÙŠØ¶ÙŠÙ Ø¨Ù†ÙˆØ¯Ù‡ØŒ Ø«Ù… Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙŠØ¹ØªÙ…Ø¯ Ø®Ù„Ø§Ù„ 3 Ø£ÙŠØ§Ù…ØŒ Ø«Ù… ÙŠØ±ÙØ¹ Ù„Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ.</p>
        <div class="employee-actions-row"><span class="login-feature">Ø§Ù„Ø­Ø§Ù„Ø©: ${badge(mine.status || "closed")}</span><span class="login-feature">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ØªÙ‚Ø¯ÙŠØ±ÙŠ: ${escapeHtml(total)}%</span><span class="login-feature">Ø§Ù„Ù†Ù…ÙˆØ°Ø¬: ${escapeHtml(windowInfo.isOpen === false ? "Ù…ØºÙ„Ù‚" : "Ù…ÙØªÙˆØ­")}</span></div>
      </article>
      <form class="employee-card full" id="kpi-self-form">
        <div class="kpi-slider-stack">
          ${kpiSlider({ name: "targetPercent", label: "ØªØ­Ù‚ÙŠÙ‚ Ø§Ù„Ø£Ù‡Ø¯Ø§Ù", weight: 40, value: mine.targetPercent ?? mine.targetScore })}
          ${kpiSlider({ name: "efficiencyPercent", label: "Ø§Ù„ÙƒÙØ§Ø¡Ø© ÙÙŠ Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…Ù‡Ø§Ù…", weight: 20, value: mine.efficiencyPercent ?? mine.efficiencyScore })}
          ${kpiSlider({ name: "conductPercent", label: "Ø­Ø³Ù† Ø§Ù„ØªØ¹Ø§Ù…Ù„ ÙˆØ§Ù„Ø³Ù„ÙˆÙƒ", weight: 5, value: mine.conductPercent ?? mine.conductScore })}
          ${kpiSlider({ name: "initiativesPercent", label: "Ø§Ù„ØªØ¨Ø±Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨Ø§Ø¯Ø±Ø§Øª", weight: 5, value: mine.initiativesPercent ?? mine.initiativesScore })}
          <div class="employee-card-subtle"><strong>Ø¨Ù†ÙˆØ¯ HR ÙÙ‚Ø· â€” 30 Ø¯Ø±Ø¬Ø©</strong><p>Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù 20%ØŒ Ø§Ù„ØµÙ„Ø§Ø© ÙÙŠ Ø§Ù„Ù…Ø³Ø¬Ø¯ 5%ØŒ ÙˆØ­Ø¶ÙˆØ± Ø­Ù„Ù‚Ø© Ø§Ù„Ø´ÙŠØ® ÙˆÙ„ÙŠØ¯ 5%. ØªØ¸Ù‡Ø± Ù„Ù„Ù…ÙˆØ¸Ù Ù„Ù„Ø¹Ù„Ù… ÙÙ‚Ø· ÙˆÙ„Ø§ ÙŠÙ…ÙƒÙ† ØªØ¹Ø¯ÙŠÙ„Ù‡Ø§ Ù‡Ù†Ø§.</p></div>
          ${kpiSlider({ name: "attendancePercent", label: "Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù â€” HR", weight: 20, value: mine.attendancePercent ?? mine.attendanceScore, readonly: true })}
          ${kpiSlider({ name: "quranPercent", label: "Ø­Ù„Ù‚Ø© Ø§Ù„Ø´ÙŠØ® ÙˆÙ„ÙŠØ¯ â€” HR", weight: 5, value: mine.quranPercent ?? mine.quranCircleScore, readonly: true })}
          ${kpiSlider({ name: "prayerPercent", label: "Ø§Ù„ØµÙ„Ø§Ø© ÙÙŠ Ø§Ù„Ù…Ø³Ø¬Ø¯ â€” HR", weight: 5, value: mine.prayerPercent ?? mine.prayerScore, readonly: true })}
          <label>Ù…Ù„Ø§Ø­Ø¸Ø§ØªÙŠ Ù„Ù„Ù…Ø¯ÙŠØ±<textarea name="employeeNotes" rows="4">${escapeHtml(mine.employeeNotes || "")}</textarea></label>
        </div>
        <input type="hidden" name="employeeId" value="${escapeHtml(employeeId)}" />
        <input type="hidden" name="cycleName" value="${escapeHtml(monthName)}" />
        <input type="hidden" name="status" value="employee_submitted" />
        <button class="button primary full" type="submit" ${windowInfo.isOpen === false ? "disabled" : ""}>Ø±ÙØ¹ Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</button>
        ${windowInfo.isOpen === false ? `<p class="form-hint danger-text">Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ ØºÙŠØ± Ù…ÙØªÙˆØ­ Ø­Ø§Ù„ÙŠÙ‹Ø§. ÙŠÙØªØ­Ù‡ Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø­Ø³Ø¨ Ø¯ÙˆØ±Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ….</p>` : ""}
      </form>
      <article class="employee-card full"><h2>Ù…Ø³Ø§Ø± Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯</h2><div class="employee-list">
        ${["Ø§Ù„Ù…ÙˆØ¸Ù ÙŠØ±Ø³Ù„ ØªÙ‚ÙŠÙŠÙ…Ù‡ Ø®Ù„Ø§Ù„ 48 Ø³Ø§Ø¹Ø©", "HR ÙŠØ¶ÙŠÙ Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù ÙˆØ§Ù„ØµÙ„Ø§Ø© ÙˆØ­Ù„Ù‚Ø© Ø§Ù„Ù‚Ø±Ø¢Ù†", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙŠØ±Ø§Ø¬Ø¹ ÙˆÙŠØ¹ØªÙ…Ø¯ Ø®Ù„Ø§Ù„ 3 Ø£ÙŠØ§Ù…", "Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙŠØ±Ø§Ø¬Ø¹ ÙˆÙŠØ¬Ù‡Ø² PDF", "Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ ÙˆØ§Ù„Ø£Ø±Ø´ÙØ©"].map((step, index) => `<div class="employee-list-item"><div><strong>${index + 1}. ${escapeHtml(step)}</strong></div><div class="list-item-side">${index === 0 && mine.status ? badge(mine.status) : ""}</div></div>`).join("")}
      </div></article>
    </section>
  `, "ØªÙ‚ÙŠÙŠÙ…ÙŠ", "Ù†Ù…ÙˆØ°Ø¬ KPI Ø§Ù„Ø´Ù‡Ø±ÙŠ Ø§Ù„Ø®Ø§Øµ Ø¨Ø§Ù„Ù…ÙˆØ¸Ù.");
  app.querySelectorAll('.kpi-slider-field input[type="range"]').forEach((input) => input.addEventListener("input", () => {
    const weight = Number(input.dataset.weight || 0);
    const pct = Number(input.value || 0);
    const meta = input.closest('.kpi-slider-field')?.querySelector('.kpi-slider-meta');
    const bar = input.closest('.kpi-slider-field')?.querySelector('.kpi-progress i');
    if (meta) meta.innerHTML = `<b>${pct}%</b><small>Ø§Ù„ÙˆØ²Ù† ${weight} â€” Ø§Ù„Ù…Ø­ØªØ³Ø¨ ${(pct * weight / 100).toFixed(1)}/${weight}</small>`;
    if (bar) bar.style.width = `${pct}%`;
  }));
  app.querySelector("#kpi-self-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await endpoints.saveKpiEvaluation(readForm(event.currentTarget));
      setMessage("ØªÙ… Ø±ÙØ¹ ØªÙ‚ÙŠÙŠÙ…Ùƒ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¨Ù†Ø¬Ø§Ø­.", "");
      renderKpi();
    } catch (error) { setMessage("", error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„ØªÙ‚ÙŠÙŠÙ…."); renderKpi(); }
  });
}

async function renderRequests() {
  const summary = await endpoints.myRequests().then(unwrap).catch(() => ({ pending: 0, approved: 0, rejected: 0, latest: [] }));
  shell(`
    <section class="employee-grid">
      <article class="employee-card"><span class="panel-kicker">Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</span><strong class="big-number">${escapeHtml(summary.pending || 0)}</strong><p>Ø·Ù„Ø¨Ø§Øª ØªÙ†ØªØ¸Ø± Ù‚Ø±Ø§Ø± Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø£Ùˆ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.</p></article>
      <article class="employee-card"><span class="panel-kicker">Ù…Ù‚Ø¨ÙˆÙ„Ø©</span><strong class="big-number">${escapeHtml(summary.approved || 0)}</strong><p>Ø·Ù„Ø¨Ø§Øª ØªÙ…Øª Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø© Ø¹Ù„ÙŠÙ‡Ø§.</p></article>
      <article class="employee-card"><span class="panel-kicker">Ù…Ø±ÙÙˆØ¶Ø©</span><strong class="big-number">${escapeHtml(summary.rejected || 0)}</strong><p>Ø·Ù„Ø¨Ø§Øª ØªÙ… Ø±ÙØ¶Ù‡Ø§ Ù…Ø¹ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø³Ø¨Ø¨.</p></article>
      <article class="employee-card full"><h2>Ø¢Ø®Ø± Ø·Ù„Ø¨Ø§ØªÙŠ</h2>${renderRequestList(summary.latest || [])}</article>
      <article class="employee-card full"><h2>Ø¥Ù†Ø´Ø§Ø¡ Ø·Ù„Ø¨ Ø³Ø±ÙŠØ¹</h2><div class="employee-actions-row"><button class="button primary" data-route="leaves">Ø·Ù„Ø¨ Ø¥Ø¬Ø§Ø²Ø©</button><button class="button ghost" data-route="missions">Ø·Ù„Ø¨ Ù…Ø£Ù…ÙˆØ±ÙŠØ©</button><button class="button ghost" data-route="disputes">Ø´ÙƒÙˆÙ‰/Ø®Ù„Ø§Ù</button><button class="button ghost" data-route="location">Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹</button></div></article>
    </section>
  `, "Ø·Ù„Ø¨Ø§ØªÙŠ", "ÙƒÙ„ Ø·Ù„Ø¨Ø§ØªÙƒ ÙˆØ­Ø§Ù„ØªÙ‡Ø§ ÙÙŠ Ø´Ø§Ø´Ø© ÙˆØ§Ø­Ø¯Ø©.");
}

async function renderTasks() {
  const tasks = await endpoints.myTasks().then(unwrap).catch(() => []);
  shell(`
    <section class="employee-card full">
      <div class="panel-kicker">Ø§Ù„Ù…Ù‡Ø§Ù…</div>
      <h2>Ù…Ù‡Ø§Ù…ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠØ©</h2>
      ${tasks.length ? `<div class="employee-list">${tasks.map((task) => `<div class="employee-list-item"><div><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.description || "")}</span><small>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©: ${escapeHtml(statusLabel(task.priority))} â€” Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚: ${escapeHtml(task.dueDate || "-")}</small></div><div class="list-item-side">${badge(task.status)}${task.status !== "DONE" ? `<button class="button ghost small" data-task-done="${escapeHtml(task.id)}">ØªÙ…</button>` : ""}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ù…ÙƒÙ„Ù Ø¨Ù‡Ø§ Ø§Ù„Ø¢Ù†.</div>`}
    </section>
  `, "Ù…Ù‡Ø§Ù…ÙŠ", "ØªØ§Ø¨Ø¹ Ø§Ù„ØªÙƒÙ„ÙŠÙØ§Øª Ø§Ù„ÙŠÙˆÙ…ÙŠØ© ÙˆØ­Ø¯Ù‘Ø« Ø­Ø§Ù„ØªÙ‡Ø§.");
  app.querySelectorAll("[data-task-done]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.updateTask(button.dataset.taskDone, { status: "DONE" });
    setMessage("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ù‡Ù…Ø©.", "");
    renderTasks();
  }));
}

async function renderDailyReport() {
  const reports = await endpoints.myDailyReports().then(unwrap).catch(() => []);
  const today = new Date().toISOString().slice(0, 10);
  const todayReport = reports.find((row) => row.reportDate === today) || {};
  shell(
    `<section class="employee-grid">
      <article class="employee-card full accent-card"><h2>Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ</h2><p>Ø§ÙƒØªØ¨ Ù…Ø§ ØªÙ… Ø¥Ù†Ø¬Ø§Ø²Ù‡ Ø§Ù„ÙŠÙˆÙ…ØŒ Ø§Ù„Ø¹ÙˆØ§Ø¦Ù‚ Ø§Ù„ØªÙŠ ØªØ­ØªØ§Ø¬ Ø¯Ø¹Ù…Ù‹Ø§ØŒ ÙˆØ®Ø·Ø© Ø§Ù„ØºØ¯. ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ù„Ù…Ø¯ÙŠØ±Ùƒ ÙˆØ§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ©.</p></article>
      <article class="employee-card full">
        <form id="daily-report-form" class="employee-form">
          <label>ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙ‚Ø±ÙŠØ±<input type="date" name="reportDate" value="${escapeHtml(todayReport.reportDate || today)}" required /></label>
          <label>Ù…Ø§ ØªÙ… Ø¥Ù†Ø¬Ø§Ø²Ù‡ Ø§Ù„ÙŠÙˆÙ…<textarea name="achievements" rows="4" required>${escapeHtml(todayReport.achievements || "")}</textarea></label>
          <label>Ø§Ù„Ø¹ÙˆØ§Ø¦Ù‚ Ø£Ùˆ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„<textarea name="blockers" rows="3">${escapeHtml(todayReport.blockers || "")}</textarea></label>
          <label>Ø®Ø·Ø© Ø§Ù„ØºØ¯<textarea name="tomorrowPlan" rows="3">${escapeHtml(todayReport.tomorrowPlan || "")}</textarea></label>
          <label>Ø§Ù„Ø¯Ø¹Ù… Ø§Ù„Ù…Ø·Ù„ÙˆØ¨<textarea name="supportNeeded" rows="2">${escapeHtml(todayReport.supportNeeded || "")}</textarea></label>
          <label>Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ù†ÙØ³ÙŠØ©/Ø¶ØºØ· Ø§Ù„Ø¹Ù…Ù„<select name="mood"><option value="NORMAL">Ø·Ø¨ÙŠØ¹ÙŠ</option><option value="GOOD">Ø¬ÙŠØ¯</option><option value="STRESSED">Ø¶ØºØ· Ø¹Ø§Ù„ÙŠ</option><option value="NEEDS_SUPPORT">Ø£Ø­ØªØ§Ø¬ Ø¯Ø¹Ù…</option></select></label>
          <button class="button primary" type="submit">Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ±</button>
        </form>
      </article>
      <article class="employee-card full"><h2>ØªÙ‚Ø§Ø±ÙŠØ±ÙŠ Ø§Ù„Ø³Ø§Ø¨Ù‚Ø©</h2>${reports.length ? `<div class="employee-list">${reports.slice(0, 20).map((report) => `<div class="employee-list-item"><div><strong>${escapeHtml(report.reportDate || "-")}</strong><span>${escapeHtml(report.achievements || "-")}</span><small>${escapeHtml(report.blockers ? `Ø¹ÙˆØ§Ø¦Ù‚: ${report.blockers}` : "Ø¨Ø¯ÙˆÙ† Ø¹ÙˆØ§Ø¦Ù‚")}</small></div><div class="list-item-side">${badge(report.status)}${report.managerComment ? `<small>${escapeHtml(report.managerComment)}</small>` : ""}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ù… ØªØ±Ø³Ù„ ØªÙ‚Ø§Ø±ÙŠØ± ÙŠÙˆÙ…ÙŠØ© Ø¨Ø¹Ø¯.</div>`}</article>
    </section>`,
    "Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ",
    "Ù…ØªØ§Ø¨Ø¹Ø© Ø¥Ù†Ø¬Ø§Ø²Ø§ØªÙƒ ÙˆØ§Ø­ØªÙŠØ§Ø¬Ø§Øª Ø§Ù„Ø¯Ø¹Ù….",
  );
  app.querySelector("#daily-report-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await endpoints.createDailyReport(readForm(event.currentTarget));
      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ Ø¨Ù†Ø¬Ø§Ø­.", "");
      renderDailyReport();
    } catch (error) { setMessage("", error.message); renderDailyReport(); }
  });
}

async function renderDocuments() {
  const docs = await endpoints.myDocuments().then(unwrap).catch(() => []);
  shell(`
    <section class="employee-card full">
      <div class="panel-kicker">Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª</div>
      <h2>Ù…Ø³ØªÙ†Ø¯Ø§ØªÙŠ</h2>
      <p>Ø±Ø§Ø¬Ø¹ Ù…Ø³ØªÙ†Ø¯Ø§ØªÙƒ Ø§Ù„Ù…Ø³Ø¬Ù„Ø©ØŒ ÙˆÙÙŠ Ø­Ø§Ù„Ø© ÙˆØ¬ÙˆØ¯ Ù…Ø³ØªÙ†Ø¯ Ù…Ù†ØªÙ‡ÙŠ Ø£Ùˆ Ù†Ø§Ù‚Øµ ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©.</p>
      ${docs.length ? `<div class="employee-list">${docs.map((doc) => `<div class="employee-list-item"><div><strong>${doc.fileUrl ? `<a href="${escapeHtml(doc.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(doc.title)}</a>` : escapeHtml(doc.title)}</strong><span>${escapeHtml(doc.documentType || "Ù…Ø³ØªÙ†Ø¯")}</span><small>ÙŠÙ†ØªÙ‡ÙŠ: ${escapeHtml(doc.expiresOn || "-")} â€” ${escapeHtml(doc.notes || "")}</small></div><div class="list-item-side">${badge(doc.status || "ACTIVE")}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø³ØªÙ†Ø¯Ø§Øª Ù…Ø³Ø¬Ù„Ø© Ù„Ùƒ Ø¨Ø¹Ø¯.</div>`}
    </section>
  `, "Ù…Ø³ØªÙ†Ø¯Ø§ØªÙŠ", "Ø£Ø±Ø´ÙŠÙ Ø§Ù„Ù…Ù„ÙØ§Øª ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ.");
}


async function renderPolicies() {
  const data = await endpoints.policies().then(unwrap).catch(() => ({ policies: [], summary: {} }));
  const policies = data.policies || [];
  shell(`
    <section class="employee-grid">
      <article class="employee-card full">
        <div class="panel-kicker">Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª ÙˆØ§Ù„ØªÙˆÙ‚ÙŠØ¹Ø§Øª</div>
        <h2>Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©</h2>
        <p>Ø§Ù‚Ø±Ø£ ÙƒÙ„ Ø³ÙŠØ§Ø³Ø© ÙˆØ§Ø¶ØºØ· ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©. Ù‡Ø°Ø§ ÙŠØ³Ø§Ø¹Ø¯ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø¹Ù„Ù‰ ØªÙˆØ«ÙŠÙ‚ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ Ø¨Ø¯ÙˆÙ† ÙˆØ±Ù‚.</p>
      </article>
      ${policies.length ? policies.map((policy) => `
        <article class="employee-card full">
          <div class="panel-kicker">${escapeHtml(policy.category || "GENERAL")} â€” Ø¥ØµØ¯Ø§Ø± ${escapeHtml(policy.version || "1.0")}</div>
          <h2>${escapeHtml(policy.title)}</h2>
          <p>${escapeHtml(policy.body || "")}</p>
          <div class="employee-actions-row">
            ${policy.acknowledged ? `<span class="pill success">ØªÙ… Ø§Ù„ØªØ£ÙƒÙŠØ¯ ${escapeHtml(policy.acknowledgedAt ? date(policy.acknowledgedAt) : "")}</span>` : `<button class="button primary" data-ack-policy="${escapeHtml(policy.id)}">Ø£Ø¤ÙƒØ¯ Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© ÙˆØ§Ù„Ø§Ù„ØªØ²Ø§Ù…</button>`}
          </div>
        </article>
      `).join("") : `<article class="employee-card full"><div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø³ÙŠØ§Ø³Ø§Øª Ù…Ø·Ù„ÙˆØ¨Ø© Ø§Ù„Ø¢Ù†.</div></article>`}
    </section>
  `, "Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª", "Ù‚Ø±Ø§Ø¡Ø© ÙˆØªÙˆÙ‚ÙŠØ¹ Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©.");
  app.querySelectorAll("[data-ack-policy]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.acknowledgePolicy(button.dataset.ackPolicy);
    setMessage("ØªÙ… ØªØ£ÙƒÙŠØ¯ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø³ÙŠØ§Ø³Ø©.", "");
    renderPolicies();
  }));
}

async function renderAdminDecisions() {
  const data = await endpoints.adminDecisions().then(unwrap).catch(() => ({ decisions: [] }));
  const decisions = data.decisions || [];
  shell(`
    <section class="employee-grid">
      <article class="employee-card full">
        <div class="panel-kicker">Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©</div>
        <h2>Ø³Ø¬Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ©</h2>
        <p>ÙƒÙ„ Ù‚Ø±Ø§Ø± ÙŠØ¸Ù‡Ø± Ù‡Ù†Ø§ ÙŠØ­ØªØ§Ø¬ ØªØ£ÙƒÙŠØ¯ "ØªÙ… Ø§Ù„Ø§Ø·Ù„Ø§Ø¹" Ù„ÙŠØªÙ… Ø­ÙØ¸ ØªÙˆÙ‚ÙŠØª Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© Ø±Ø³Ù…ÙŠÙ‹Ø§.</p>
      </article>
      ${decisions.length ? decisions.map((decision) => `
        <article class="employee-card full decision-card ${decision.acknowledged ? 'is-acknowledged' : ''}">
          <div class="panel-kicker">${escapeHtml(decision.category || 'ADMINISTRATIVE')} â€” ${escapeHtml(decision.priority || 'MEDIUM')}</div>
          <h2>${escapeHtml(decision.title)}</h2>
          <p>${escapeHtml(decision.body || '')}</p>
          <small>ØªØ§Ø±ÙŠØ® Ø§Ù„Ù†Ø´Ø±: ${date(decision.publishedAt || decision.createdAt)}</small>
          <div class="employee-actions-row">
            ${decision.acknowledged ? `<span class="pill success">ØªÙ… Ø§Ù„Ø§Ø·Ù„Ø§Ø¹ ${escapeHtml(decision.acknowledgedAt ? date(decision.acknowledgedAt) : '')}</span>` : `<button class="button primary" data-ack-decision="${escapeHtml(decision.id)}">ØªÙ… Ø§Ù„Ø§Ø·Ù„Ø§Ø¹</button>`}
          </div>
        </article>
      `).join('') : `<article class="employee-card full"><div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù‚Ø±Ø§Ø±Ø§Øª Ø¥Ø¯Ø§Ø±ÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø© Ø§Ù„Ø¢Ù†.</div></article>`}
    </section>
  `, "Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª", "ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø§Ø·Ù„Ø§Ø¹ Ø¹Ù„Ù‰ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ©.");
  app.querySelectorAll('[data-ack-decision]').forEach((button) => button.addEventListener('click', async () => {
    await endpoints.acknowledgeAdminDecision(button.dataset.ackDecision);
    setMessage('ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ø·Ù„Ø§Ø¹Ùƒ Ø¹Ù„Ù‰ Ø§Ù„Ù‚Ø±Ø§Ø±.', '');
    renderAdminDecisions();
  }));
}

async function renderNotifications() {
  const rows = await endpoints.notifications().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = rows.filter((item) => !item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id).slice(0, 50);
  shell(`
    <section class="employee-card full">
      <div class="panel-kicker">Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª</div>
      <h2>Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª</h2>
      <div class="employee-actions-row"><button class="button ghost" data-enable-push>Ø´Ø±Ø­ ÙˆØªÙØ¹ÙŠÙ„ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„</button></div>
      ${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body || "")}</span><small>${date(item.createdAt)}</small></div><div class="list-item-side">${badge(item.status || (item.isRead ? "READ" : "UNREAD"))}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª.</div>`}
    </section>
  `, "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª", "ÙƒÙ„ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ù‡Ù…Ø©.");
  app.querySelector("[data-enable-push]")?.addEventListener("click", async () => {
    try {
      const ok = await window.HRExplainAndEnablePush?.();
      if (ok === false && Notification?.permission !== "granted") return;
      await enableWebPushSubscription(endpoints);
      setMessage("ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ø´ØªØ±Ø§Ùƒ Web Push Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø².", "");
      renderNotifications();
    } catch (error) {
      setMessage("", error.message);
      renderNotifications();
    }
  });
}


function employeeRoleSlug(employee = {}) {
  return String(employee.role?.slug || employee.role?.key || employee.roleId || employee.role || "").toLowerCase();
}

function sortHierarchyChildren(children = [], priorityId = "") {
  return [...children].sort((a, b) => {
    const aSlug = employeeRoleSlug(a);
    const bSlug = employeeRoleSlug(b);
    const aScore = a.id === priorityId ? -20 : aSlug.includes("executive-secretary") || aSlug.includes("admin") ? -10 : aSlug.includes("manager") ? 0 : 10;
    const bScore = b.id === priorityId ? -20 : bSlug.includes("executive-secretary") || bSlug.includes("admin") ? -10 : bSlug.includes("manager") ? 0 : 10;
    return aScore - bScore || String(a.fullName || "").localeCompare(String(b.fullName || ""), "ar");
  });
}

function collectDescendants(employeeId, byManager = new Map()) {
  const direct = byManager.get(employeeId) || [];
  return direct.flatMap((child) => [child, ...collectDescendants(child.id, byManager)]);
}

function renderEmployeeOrgTree(roots = [], byManager = new Map(), options = {}) {
  const currentId = options.currentEmployeeId || "";
  const myManagerId = options.myManagerId || "";
  const myTeamIds = options.myTeamIds || new Set();
  const renderNode = (employee, depth = 0) => {
    const children = sortHierarchyChildren(byManager.get(employee.id) || [], options.secretaryId || "");
    const classes = ["employee-org-node"];
    if (employee.id === currentId) classes.push("is-me");
    if (employee.id === myManagerId) classes.push("is-my-manager");
    if (myTeamIds.has(employee.id)) classes.push("is-direct-report");
    const childMeta = children.length ? `${children.length} Ù…Ø¨Ø§Ø´Ø± / ${collectDescendants(employee.id, byManager).length} Ø¥Ø¬Ù…Ø§Ù„ÙŠ` : "Ø¨Ø¯ÙˆÙ† ØªØ§Ø¨Ø¹ÙŠÙ†";
    return `<div class="employee-org-tree-item" style="--org-depth:${depth}">
      <article class="${classes.join(" ")}">
        <div class="org-node-head">
          ${avatar(employee, "medium")}
          <div class="org-node-copy">
            <strong>${escapeHtml(employee.fullName || "-")}</strong>
            <span>${escapeHtml(employee.jobTitle || employee.role?.name || "-")}</span>
          </div>
        </div>
        <div class="org-node-meta">
          <span class="org-chip">${escapeHtml(employee.department?.name || employee.branch?.name || employee.role?.name || "Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ")}</span>
          <span class="org-chip org-chip-muted">${escapeHtml(childMeta)}</span>
        </div>
      </article>
      ${children.length ? `<div class="employee-org-children">${children.map((child) => renderNode(child, depth + 1)).join("")}</div>` : ""}
    </div>`;
  };
  return `<div class="employee-org-tree">${roots.map((root) => renderNode(root)).join("")}</div>`;
}

function buildEmployeeOrgModel(employees = []) {
  const active = employees.filter((employee) => !employee.isDeleted && String(employee.status || "ACTIVE").toUpperCase() !== "DELETED");
  const byId = new Map(active.map((employee) => [employee.id, employee]));
  const byManager = new Map();
  active.forEach((employee) => {
    const managerId = employee.managerEmployeeId || employee.managerId || employee.directManagerId || employee.manager?.id || "";
    if (!managerId) return;
    if (!byManager.has(managerId)) byManager.set(managerId, []);
    byManager.get(managerId).push(employee);
  });
  const executiveDirector = active.find((employee) => {
    const slug = employeeRoleSlug(employee);
    return slug.includes("executive") && !slug.includes("secretary");
  }) || active.find((employee) => !(employee.managerEmployeeId || employee.managerId || employee.directManagerId || employee.manager?.id || "")) || active[0] || null;
  const secretary = active.find((employee) => {
    const slug = employeeRoleSlug(employee);
    const title = String(employee.jobTitle || employee.role?.name || "");
    return slug.includes("executive-secretary") || title.includes("Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ");
  }) || null;
  const allRoots = active.filter((employee) => !byId.has(employee.managerEmployeeId || employee.managerId || employee.directManagerId || employee.manager?.id || ""));
  const roots = executiveDirector ? [executiveDirector, ...allRoots.filter((employee) => employee.id !== executiveDirector.id)] : allRoots;
  return { active, byId, byManager, roots: sortHierarchyChildren(roots, secretary?.id || ""), executiveDirector, secretary };
}


async function renderTeam() {
  const [employees, leaves, missions] = await Promise.all([
    endpoints.employees().then(unwrap).catch(() => []),
    endpoints.leaves().then(unwrap).catch(() => []),
    endpoints.missions().then(unwrap).catch(() => []),
  ]);
  const myId = state.user?.employeeId || state.user?.employee?.id;
  const team = employees.filter((e) => e.managerId === myId || e.directManagerId === myId || e.managerEmployeeId === myId);
  const teamIds = new Set(team.map((e) => e.id));
  const pendingLeaves = leaves.filter((x) => teamIds.has(x.employeeId) && /pending/i.test(String(x.workflowStatus || x.status || "")));
  const pendingMissions = missions.filter((x) => teamIds.has(x.employeeId) && /pending/i.test(String(x.workflowStatus || x.status || "")));
  const org = buildEmployeeOrgModel(employees || []);
  const managerLike = (org.byManager.get(myId) || []).length > 0;
  const descendantsCount = collectDescendants(myId, org.byManager).length;
  const managerNode = org.byId.get(myId) || state.user?.employee || null;
  const myManagerId = managerNode?.managerEmployeeId || managerNode?.managerId || managerNode?.directManagerId || managerNode?.manager?.id || "";
  const hierarchyMarkup = renderEmployeeOrgTree(org.roots, org.byManager, { currentEmployeeId: myId, myManagerId, myTeamIds: teamIds, secretaryId: org.secretary?.id || "" });
  shell(`
    <section class="employee-grid team-manager-page">
      <article class="employee-card full employee-org-shell">
        <div class="panel-kicker">Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ</div>
        <h2>ÙØ±ÙŠÙ‚ÙŠ ÙˆØ§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ</h2>
        <p>Ø¹Ø±Ø¶ Ø§Ø­ØªØ±Ø§ÙÙŠ Ù…ØªØµÙ„ ÙŠØ¨Ø¯Ø£ Ù…Ù† Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø«Ù… Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø«Ù… Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ† Ø«Ù… Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ù…Ø¹ Ø¥Ø¨Ø±Ø§Ø² Ù…ÙˆÙ‚Ø¹Ùƒ ÙˆÙØ±ÙŠÙ‚Ùƒ Ø¯Ø§Ø®Ù„ Ø§Ù„Ø´Ø¨ÙƒØ©.</p>
        <div class="team-overview-grid">
          <article class="team-summary-card"><span>Ù‚Ù…Ø© Ø§Ù„Ù‡ÙŠÙƒÙ„</span><strong>${escapeHtml(org.executiveDirector?.fullName || "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ")}</strong><small>${escapeHtml(org.executiveDirector?.jobTitle || "Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©")}</small></article>
          <article class="team-summary-card"><span>Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ</span><strong>${escapeHtml(org.secretary?.fullName || "-")}</strong><small>${escapeHtml(org.secretary?.jobTitle || "-")}</small></article>
          <article class="team-summary-card"><span>ÙØ±ÙŠÙ‚ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</span><strong>${escapeHtml(team.length)}</strong><small>${managerLike ? "ØªØ§Ø¨Ø¹ÙˆÙ† Ù…Ø¨Ø§Ø´Ø±ÙˆÙ†" : "Ù„Ø§ ÙŠÙˆØ¬Ø¯ ÙØ±ÙŠÙ‚ Ù…Ø¨Ø§Ø´Ø±"}</small></article>
          <article class="team-summary-card"><span>Ø¥Ø¬Ù…Ø§Ù„ÙŠ ØªØ­Øª Ù…Ø³Ø¤ÙˆÙ„ÙŠØªÙŠ</span><strong>${escapeHtml(descendantsCount)}</strong><small>Ù…Ø¨Ø§Ø´Ø± + ØºÙŠØ± Ù…Ø¨Ø§Ø´Ø±</small></article>
        </div>
        <div class="employee-org-legend">
          <span class="org-legend-item"><i class="legend-dot executive"></i>Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø§Ù„Ø¹Ù„ÙŠØ§</span>
          <span class="org-legend-item"><i class="legend-dot me"></i>Ø­Ø³Ø§Ø¨ÙŠ</span>
          <span class="org-legend-item"><i class="legend-dot team"></i>ÙØ±ÙŠÙ‚ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</span>
          <span class="org-legend-item"><i class="legend-dot manager"></i>Ù…Ø¯ÙŠØ±ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</span>
        </div>
        ${hierarchyMarkup}
      </article>
      <article class="employee-card full">
        <div class="panel-kicker">ÙØ±ÙŠÙ‚ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</div>
        <h2>Ù…ÙˆØ¸ÙÙˆ ÙØ±ÙŠÙ‚ÙŠ</h2>
        ${team.length ? `<div class="employee-list my-team-focus-grid">${team.map((e)=>`<div class="employee-list-item"><div>${employeeHeaderCell(e)}</div><div class="list-item-side">${badge(e.status || "ACTIVE")}</div></div>`).join("")}</div>` : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª ÙØ±ÙŠÙ‚ Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ø­Ø³Ø§Ø¨Ùƒ Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.</div>`}
      </article>
      <article class="employee-card full"><h2>Ø·Ù„Ø¨Ø§Øª Ø¥Ø¬Ø§Ø²Ø© ØªÙ†ØªØ¸Ø± Ù…Ø±Ø§Ø¬Ø¹ØªÙŠ</h2>${pendingLeaves.length ? renderManagerReviewList(pendingLeaves, "leave") : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø¬Ø§Ø²Ø§Øª Ù…Ø¹Ù„Ù‚Ø© Ù„Ù„Ù…Ø¯ÙŠØ±.</div>`}</article>
      <article class="employee-card full"><h2>Ø·Ù„Ø¨Ø§Øª Ù…Ø£Ù…ÙˆØ±ÙŠØ© ØªÙ†ØªØ¸Ø± Ù…Ø±Ø§Ø¬Ø¹ØªÙŠ</h2>${pendingMissions.length ? renderManagerReviewList(pendingMissions, "mission") : `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª Ù…Ø¹Ù„Ù‚Ø© Ù„Ù„Ù…Ø¯ÙŠØ±.</div>`}</article>
    </section>
  `, "ÙØ±ÙŠÙ‚ÙŠ", "Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ Ø§Ù„ÙƒØ§Ù…Ù„ ÙˆÙ…Ø±Ø§Ø¬Ø¹Ø§Øª Ø§Ù„ÙØ±ÙŠÙ‚.");
  app.querySelectorAll("[data-manager-review]").forEach((button)=>button.addEventListener("click", async()=>{
    const [kind, id, action] = button.dataset.managerReview.split(":");
    const note = "";
    try {
      if (kind === "leave") await endpoints.updateLeave(id, action === "approve" ? "manager_approve" : "reject", { managerNote: note });
      if (kind === "mission") await endpoints.updateMission(id, action === "approve" ? "manager_approve" : "reject", { managerNote: note });
      setMessage(action === "approve" ? "ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø·Ù„Ø¨ ÙˆØªØ­ÙˆÙŠÙ„Ù‡ Ø¥Ù„Ù‰ HR." : "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨.", "");
      renderTeam();
    } catch (error) { setMessage("", error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ù‚Ø±Ø§Ø± Ø§Ù„Ù…Ø¯ÙŠØ±."); renderTeam(); }
  }));
}

function renderManagerReviewList(items = [], kind = "leave") {
  return `<div class="employee-list">${items.map((item)=>`<div class="employee-list-item"><div><strong>${escapeHtml(item.title || item.leaveType || item.destinationName || "Ø·Ù„Ø¨")}</strong><span>${escapeHtml(item.startDate || item.plannedStart || item.createdAt || "-")}</span><small>${escapeHtml(item.reason || item.notes || item.destinationName || "")}</small></div><div class="list-item-side"><button class="button primary small" data-manager-review="${kind}:${escapeHtml(item.id)}:approve">Ø§Ø¹ØªÙ…Ø§Ø¯</button><button class="button danger small" data-manager-review="${kind}:${escapeHtml(item.id)}:reject">Ø±ÙØ¶</button></div></div>`).join("")}</div>`;
}

async function renderProfile() {
  const user = state.user || {};
  const employee = user.employee || {};
  shell(`
    <section class="employee-grid">
      <article class="employee-card full profile-card">
        <div class="profile-hero">
          <div class="person-cell large">${avatar(user, "large")}<span><strong>${escapeHtml(user.fullName || user.name || employee.fullName || "Ø§Ù„Ù…ÙˆØ¸Ù")}</strong><small>${escapeHtml(employee.jobTitle || "ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†")}</small></span></div>
        </div>
        <dl class="profile-list">
          <div><dt>Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„</dt><dd>${escapeHtml(employee.phone || user.phone || "-")}</dd></div>
          <div><dt>Ø§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ</dt><dd>${escapeHtml(employee.jobTitle || "-")}</dd></div>
        </dl>
        <div class="employee-actions-stack"><button class="button danger" data-logout>Ø®Ø±ÙˆØ¬</button></div>
      </article>
      <form class="employee-card full" id="employee-contact-form">
        <div class="panel-kicker">Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª</div>
        <h2>ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„ØµÙˆØ±Ø© ÙˆØ§Ù„Ø¨Ø±ÙŠØ¯ ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</h2>
        <p>ÙŠÙ…ÙƒÙ†Ùƒ ØªØ­Ø¯ÙŠØ« Ø§Ù„ØµÙˆØ±Ø© ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ÙˆØ§Ù„Ø¨Ø±ÙŠØ¯. ÙŠØªÙ… Ø¶ØºØ· Ø§Ù„ØµÙˆØ±Ø© Ù‚Ø¨Ù„ Ø§Ù„Ø±ÙØ¹ Ù„ØªØ³Ø±ÙŠØ¹ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ØŒ ÙˆØ±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ù‹Ø§ Ù…ØµØ±ÙŠÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§.</p>
        <div class="profile-photo-editor">
          <div data-avatar-preview>${avatar(user, "large")}</div>
          <div class="profile-photo-actions">
            <label class="button ghost">ØªØºÙŠÙŠØ± Ø§Ù„ØµÙˆØ±Ø©<input class="hidden-file" type="file" name="avatarFile" accept="image/*" /></label>
            <small>Ù…Ø¹Ø§ÙŠÙ†Ø© ÙÙˆØ±ÙŠØ© ÙˆØ¶ØºØ· ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù‚Ø¨Ù„ Ø§Ù„Ø­ÙØ¸</small>
          </div>
        </div>
        <div class="employee-form-grid">
          <label class="span-2">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ<input type="email" name="email" autocomplete="email" value="${escapeHtml(user.email || employee.email || "")}" required /></label>
          <label class="span-2">Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ<input name="phone" inputmode="tel" autocomplete="tel" pattern="01[0125][0-9]{8}" value="${escapeHtml(employee.phone || user.phone || "")}" placeholder="01xxxxxxxxx" required /></label>
          <input type="hidden" name="avatarUrl" value="${escapeHtml(user.avatarUrl || user.photoUrl || employee.photoUrl || "")}" />
        </div>
        <button class="button primary full" type="submit">Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª</button>
      </form>
      <article class="employee-card full device-security-card" id="employee-device-security">
        <div class="panel-kicker">Ø£Ù…Ø§Ù† Ø§Ù„Ø¬Ù‡Ø§Ø²</div>
        <h2>ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ù„Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨</h2>
        <p>Ø§Ø¶ØºØ· Ø§Ù„Ø²Ø± Ù…Ù† Ù†ÙØ³ Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ Ù„ØªØ³Ø¬ÙŠÙ„ Passkey/Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø². Ø¨Ø¹Ø¯Ù‡Ø§ Ø³ÙŠØ·Ù„Ø¨ Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨ØµÙ…Ø© Ø§Ù„Ù‡Ø§ØªÙ Ù‚Ø¨Ù„ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø£Ùˆ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ±/Ø§Ù„Ø§Ù†ØµØ±Ø§Ù.</p>
        <div class="employee-actions-stack">
          <button class="button primary full" type="button" data-register-passkey>ØªØ³Ø¬ÙŠÙ„ / ØªØ­Ø¯ÙŠØ« Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø²</button>
          <button class="button ghost full" type="button" data-test-gps>Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù‚Ø¨Ù„ Ø§Ù„Ø¨ØµÙ…Ø©</button>
        </div>
        <div id="device-security-result" class="message compact hidden"></div>
      </article>
      <form class="employee-card full" id="employee-password-form">
        <div class="panel-kicker">Ø§Ù„Ø£Ù…Ø§Ù†</div>
        <h2>ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±</h2>
        <div class="employee-form-grid">
          <input class="visually-hidden" type="text" name="username" autocomplete="username" value="${escapeHtml(user.email || employee.email || employee.phone || user.phone || "")}" tabindex="-1" aria-hidden="true" />
          <label class="span-2">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø­Ø§Ù„ÙŠØ©<input type="password" name="currentPassword" autocomplete="current-password" required /></label>
          <label class="span-2">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©<input type="password" name="newPassword" autocomplete="new-password" minlength="8" placeholder="8 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„" required /></label>
          <div class="span-2">${passwordStrengthMarkup()}</div>
          <label class="span-2">ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©<input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" required /></label>
        </div>
        <button class="button primary full" type="submit">Ø­ÙØ¸ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±</button>
      </form>
    </section>
  `, "Ø­Ø³Ø§Ø¨ÙŠ", "Ø¨ÙŠØ§Ù†Ø§ØªÙŠ ÙˆÙˆØ³Ø§Ø¦Ù„ Ø§Ù„Ø§ØªØµØ§Ù„.");
  bindPasswordStrength(app.querySelector("#employee-password-form"));
  const profileForm = app.querySelector("#employee-contact-form");
  profileForm?.querySelector("[name='avatarFile']")?.addEventListener("change", async (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const preview = profileForm.querySelector("[data-avatar-preview]");
      if (preview && dataUrl) preview.innerHTML = `<img class="person-avatar large" src="${escapeHtml(dataUrl)}" alt="Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„ØµÙˆØ±Ø©" />`;
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„ØµÙˆØ±Ø©.");
    }
  });
  app.querySelector("[data-register-passkey]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget;
    const box = app.querySelector("#device-security-result");
    try {
      button.disabled = true;
      box?.classList.remove("hidden", "danger-box");
      if (box) box.textContent = "Ø§ÙØªØ­ Ø¨ØµÙ…Ø© Ø§Ù„Ù‡Ø§ØªÙ/Ù‚ÙÙ„ Ø§Ù„Ø´Ø§Ø´Ø© Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¬Ù‡Ø§Ø²...";
      await registerBrowserPasskey();
      if (box) box.textContent = "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² ÙˆØ±Ø¨Ø·Ù‡Ø§ Ø¨Ø­Ø³Ø§Ø¨Ùƒ. ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„Ø¢Ù† Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ±/Ø§Ù„Ø§Ù†ØµØ±Ø§Ù.";
      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø¨Ù†Ø¬Ø§Ø­.", "");
    } catch (error) {
      box?.classList.remove("hidden");
      box?.classList.add("danger-box");
      if (box) box.textContent = friendlyError(error, "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø².");
    } finally {
      button.disabled = false;
    }
  });
  app.querySelector("#employee-device-security [data-test-gps]")?.addEventListener("click", async () => {
    const box = app.querySelector("#device-security-result");
    try {
      box?.classList.remove("hidden", "danger-box");
      if (box) box.textContent = "Ø¬Ø§Ø±ÙŠ Ø§Ø®ØªØ¨Ø§Ø± GPS Ø¨Ø¯Ù‚Ø© Ø¹Ø§Ù„ÙŠØ©...";
      const current = await getVerifiedBrowserLocation(user.employeeId || employee.id || state.user?.employeeId || "");
      if (box) box.innerHTML = `${readableLocationBlock(current)}${current.latitude && current.longitude ? `<a class="button ghost small" target="_blank" rel="noopener" href="https://maps.google.com/?q=${encodeURIComponent(`${current.latitude},${current.longitude}`)}">ÙØªØ­ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</a>` : ""}`;
    } catch (error) {
      box?.classList.remove("hidden");
      box?.classList.add("danger-box");
      if (box) box.textContent = friendlyError(error, "ØªØ¹Ø°Ø± Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù…ÙˆÙ‚Ø¹.");
    }
  });
  app.querySelector("#employee-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    if (values.newPassword !== values.confirmPassword) { setMessage("", "ØªØ£ÙƒÙŠØ¯ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± Ù…Ø·Ø§Ø¨Ù‚."); return renderProfile(); }
    try { await endpoints.changePassword(values); setMessage("ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­.", ""); event.currentTarget.reset(); } catch (error) { setMessage("", error.message || "ØªØ¹Ø°Ø± ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±."); }
    renderProfile();
  });
  profileForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    values.phone = normalizeEgyptPhone(values.phone || "");
    if (!validEgyptPhone(values.phone)) { setMessage("", "Ø§ÙƒØªØ¨ Ø±Ù‚Ù… Ù‡Ø§ØªÙ Ù…ØµØ±ÙŠ ØµØ­ÙŠØ­ ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 01."); return renderProfile(); }
    try {
      const file = event.currentTarget.querySelector("[name='avatarFile']")?.files?.[0];
      if (file) {
        try { values.avatarUrl = await endpoints.uploadAvatar(file); }
        catch { values.avatarUrl = await fileToAvatarDataUrl(file); }
      }
      delete values.avatarFile;
      const updated = unwrap(await endpoints.updateMyContact(values));
      state.user = updated || state.user;
      setMessage("ØªÙ… Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª. Ø¥Ø°Ø§ ØºÙŠØ±Øª Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù‚Ø¯ ØªØ­ØªØ§Ø¬ ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¬Ø¯ÙŠØ¯ Ù‚Ø¨Ù„ Ø§Ø³ØªØ®Ø¯Ø§Ù…Ù‡ ÙÙŠ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.", "");
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª.");
    }
    renderProfile();
  });
}

async function render() {
  try {
    consumeFlashMessage();
    if (!state.user) state.user = await endpoints.me().then(unwrap).catch(() => null);
    if (!state.user) return renderLogin();
    startNotificationPolling();
    if (state.recoveryMode) return renderRecoveryPassword();
    const key = routeKey();
    renderLoadingSkeleton(routeSubtitles[key] ? (moreEmployeeRoutes.concat(employeeRoutes).find(([route]) => route === key)?.[1] || "ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù") : "ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù", routeSubtitles[key] || "Ø¬Ø§Ø±ÙŠ ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...");
    if (key === "action-center") return renderActionCenter();
    if (key === "kpi") return renderKpi();
    if (key === "punch") return renderPunch();
    if (key === "location") return renderLocation();
    if (key === "leaves") return renderLeaves();
    if (key === "missions") return renderMissions();
    if (key === "requests") return renderRequests();
    if (key === "tasks") return renderTasks();
    if (key === "daily-report") return renderDailyReport();
    if (key === "documents") return renderDocuments();
    if (key === "policies") return renderPolicies();
    if (key === "decisions") return renderAdminDecisions();
    if (key === "disputes") return renderDisputes();
    if (key === "notifications") return renderNotifications();
    if (key === "team") return renderTeam();
    if (key === "profile") return renderProfile();
    return renderHome();
  } catch (error) {
    console.error(error);
    setMessage("", error.message || "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©.");
    shell(`<section class="employee-card"><h2>ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©</h2><p>${escapeHtml(error.message || "Ø­Ø¯Ø« Ø®Ø·Ø£")}</p></section>`, "Ø®Ø·Ø£", "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø§ØªØµØ§Ù„ Ø£Ùˆ Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }
}

startIdleTimer();
render();
