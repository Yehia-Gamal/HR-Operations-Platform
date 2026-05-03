<<<<<<< HEAD
import { endpoints, unwrap } from "./api.js?v=server-runtime-push-20260501-01";
=======
import { endpoints, unwrap } from "./api.js?v=management-suite-20260502-production";
import { enableWebPushSubscription } from "./push.js?v=management-suite-20260502-production";
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)

document.documentElement.classList.add("employee-portal-root");
document.body.classList.add("employee-portal");

const app = document.querySelector("#app");
<<<<<<< HEAD
const REMEMBER_LOGIN_KEY = "hr.login.rememberEmployee";
const REMEMBER_IDENTIFIER_KEY = "hr.login.rememberedEmployeeIdentifier";
const REMEMBER_PASSWORD_KEY = "hr.login.rememberedEmployeePassword";
const loginRemembered = localStorage.getItem(REMEMBER_LOGIN_KEY) === "true";
=======
const FLASH_KEY = "hr.employee.flash";
const IDLE_MS = 30 * 60 * 1000;
let idleTimer = null;
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
const state = {
  route: location.hash.replace("#", "") || "home",
  user: null,
  message: "",
  error: "",
<<<<<<< HEAD
  loginIdentifier: (loginRemembered ? localStorage.getItem(REMEMBER_IDENTIFIER_KEY) : "") || localStorage.getItem("hr.login.lastIdentifier") || "",
  loginPassword: loginRemembered ? localStorage.getItem(REMEMBER_PASSWORD_KEY) || "" : "",
  rememberLogin: loginRemembered,
  lastLoginFailed: false,
  recoveryMode: location.hash.includes("type=recovery") || location.search.includes("type=recovery"),
};
let notificationPollTimer = 0;
let notificationVisibilityHooked = false;
let employeeAlertHideTimer = 0;

const adminScopes = new Set(["*", "users:manage", "employees:view", "employees:write", "attendance:manage", "reports:export", "settings:manage", "audit:view", "requests:approve", "kpi:team"]);
const fullAccessRoles = new Set(["admin", "super-admin", "super_admin", "executive", "executive-secretary", "hr-manager", "role-admin", "role-executive", "role-hr", "مدير النظام", "المدير التنفيذي", "مدير موارد بشرية"]);
const employeeRoutes = [
  ["home", "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629", "H"],
  ["action-center", "\u0645\u0637\u0644\u0648\u0628 \u0645\u0646\u064a", "!"],
  ["punch", "\u0627\u0644\u0628\u0635\u0645\u0629", "P"],
  ["notifications", "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a", "N"],
  ["more", "\u0627\u0644\u0645\u0632\u064a\u062f", "+"],
];
const moreEmployeeRoutes = [
  ["location", "\u0627\u0644\u0645\u0648\u0642\u0639", "L"],
  ["leaves", "\u0627\u0644\u0625\u062c\u0627\u0632\u0627\u062a", "V"],
  ["missions", "\u0627\u0644\u0645\u0623\u0645\u0648\u0631\u064a\u0627\u062a", "M"],
  ["requests", "\u0637\u0644\u0628\u0627\u062a\u064a", "R"],
  ["tasks", "\u0645\u0647\u0627\u0645\u064a", "T"],
  ["daily-report", "\u062a\u0642\u0631\u064a\u0631\u064a", "D"],
  ["documents", "\u0645\u0633\u062a\u0646\u062f\u0627\u062a\u064a", "F"],
  ["policies", "\u0627\u0644\u0633\u064a\u0627\u0633\u0627\u062a", "S"],
  ["disputes", "\u0634\u0643\u0648\u0649", "!"],
  ["profile", "\u062d\u0633\u0627\u0628\u064a", "U"],
];
const routeSubtitles = {
  home: "ملخص يومك، اختصارات سريعة، وآخر نشاطاتك.",
  "action-center": "كل المطلوب منك الآن في شاشة واحدة: موقع، سياسة، مهمة، أو بصمة.",
=======
  loginIdentifier: localStorage.getItem("hr.login.lastIdentifier") || "",
  loginPassword: "",
  lastLoginFailed: false,
  recoveryMode: location.hash.includes("type=recovery") || location.search.includes("type=recovery"),
  registerMode: false,
};

const adminScopes = new Set(["*", "users:manage", "employees:write", "settings:manage", "audit:view"]);
const fullAccessRoles = new Set(["admin", "super-admin", "super_admin", "role-admin", "executive-secretary", "role-executive-secretary", "مدير النظام", "السكرتير التنفيذي"]);
const executiveOnlyRoles = new Set(["executive", "role-executive", "المدير التنفيذي"]);
const legacyEmployeeRoutes = [
  ["home", "الرئيسية", "⌂"],
  ["action-center", "مطلوب مني", "★"],
  ["kpi", "تقييمي", "◎"],
  ["punch", "البصمة", "◉"],
  ["location", "الموقع", "⌖"],
  ["leaves", "الإجازات", "✦"],
  ["missions", "المأموريات", "⇄"],
  ["requests", "طلباتي", "☰"],
  ["tasks", "مهامي", "✓"],
  ["daily-report", "تقريري", "✎"],
  ["documents", "مستنداتي", "▣"],
  ["policies", "السياسات", "§"],
  ["disputes", "شكوى", "!"],
  ["notifications", "الإشعارات", "●"],
  ["profile", "حسابي", "☺"],
];

const employeeRoutes = [
  ["home", "الرئيسية", "🏠"],
  ["action-center", "مطلوب مني", "⚡"],
  ["punch", "البصمة", "👁"],
  ["notifications", "الإشعارات", "🔔"],
  ["more", "المزيد", "☰"],
];

const moreEmployeeRoutes = [
  ["kpi", "تقييمي", "⭐"],
  ["leaves", "الإجازات", "🏖"],
  ["missions", "المأموريات", "🚗"],
  ["requests", "طلباتي", "📋"],
  ["tasks", "مهامي", "✅"],
  ["daily-report", "تقريري", "📝"],
  ["documents", "مستنداتي", "📁"],
  ["policies", "السياسات", "📜"],
  ["decisions", "القرارات", "📢"],
  ["disputes", "شكوى", "⚠️"],
  ["location", "الموقع", "📍"],
  ["profile", "حسابي", "👤"],
];

const routeSubtitles = {
  home: "ملخص يومك، اختصارات سريعة، وآخر نشاطاتك.",
  "action-center": "كل المطلوب منك الآن في شاشة واحدة: موقع، سياسة، مهمة، أو بصمة.",
  kpi: "قيّم نفسك شهريًا ثم ارفع النموذج لمديرك المباشر للاعتماد.",
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  punch: "سجّل حضورك أو انصرافك مباشرة بعد قراءة GPS.",
  location: "أرسل موقعك المباشر عند طلب الإدارة بضغطة واحدة.",
  leaves: "قدّم طلب إجازة وتابع حالته بدون أوراق.",
  missions: "قدّم طلب مأمورية وتابع موافقة الإدارة.",
  requests: "تابع كل طلباتك من إجازات ومأموريات ومواقع وتعديلات.",
  tasks: "تابع المهام المكلف بها وحدّث حالتها.",
  "daily-report": "أرسل تقرير إنجازك اليومي والعوائق واحتياجات الدعم.",
  documents: "مستنداتك الشخصية والتنبيهات الخاصة بانتهاء الصلاحية.",
  policies: "اقرأ سياسات الجمعية ووقّع عليها إلكترونيًا.",
<<<<<<< HEAD
=======
  decisions: "قرارات إدارية رسمية تحتاج تأكيد الاطلاع مع توقيت القراءة.",
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  disputes: "ارفع شكوى أو طلب فض خلاف للجنة المختصة.",
  notifications: "كل التنبيهات والطلبات المهمة في مكان واحد.",
  profile: "بيانات حسابك ووسائل الاتصال وكلمة المرور.",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "صبحكم الله بكل خير";
  return "عمتم مساءً";
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

<<<<<<< HEAD
function metricCard(label, value, hint) {
  return `<article class="employee-stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(hint)}</small></article>`;
=======
function metricCard(label, value, hint, icon = "📊") {
  return `<article class="employee-stat"><div class="stat-icon">${icon}</div><div class="stat-body"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong><small>${escapeHtml(hint)}</small></div></article>`;
}

function compactMetric(label, value, icon, route = "") {
  return `<button type="button" class="compact-metric-badge" ${route ? `data-route="${escapeHtml(route)}"` : ''}><span class="badge-icon">${icon}</span><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></button>`;
}

function confirmAction({ title = "تأكيد العملية", message = "هل تريد المتابعة؟", confirmLabel = "تأكيد", cancelLabel = "إلغاء", danger = false } = {}) {
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

function askText({ title = "إضافة ملاحظة", message = "اكتب التفاصيل", defaultValue = "", confirmLabel = "حفظ", cancelLabel = "إلغاء" } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <form class="confirm-modal prompt-modal">
        <div class="panel-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div></div>
        <label class="span-2">التفاصيل<textarea name="answer" rows="3">${escapeHtml(defaultValue)}</textarea></label>
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
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}


window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "home";
<<<<<<< HEAD
=======
  if (routeKey() === "register") { state.route = "home"; history.replaceState(null, "", "#home"); }
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  render();
});

function routeKey() {
  return (state.route || "home").split("?")[0] || "home";
}

<<<<<<< HEAD
function setMessage(message = "", error = "") {
  state.message = message;
  state.error = error;
=======
function showToast(message = "", type = "info") {
  if (!message) return;
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
  }, 3600);
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
    setMessage("تم تسجيل خروجك تلقائياً بعد 30 دقيقة من عدم النشاط.", "");
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
    throw new Error("هذا المتصفح لا يدعم بصمة الجهاز/Passkey. استخدم HTTPS أو localhost وموبايل يدعم البصمة.");
  }
  const userName = state.user?.email || state.user?.phone || state.user?.fullName || "employee";
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "نظام أحلى شباب HR" },
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
  await endpoints.registerPasskey({ credentialId: rawId, attestationObject, clientDataJSON, transports, label: "بصمة جهاز الموظف", platform: navigator.platform || "browser" });
  return rawId;
}

async function requestBrowserPasskeyForAction(label = "تأكيد العملية") {
  if (!window.PublicKeyCredential || !navigator.credentials?.get) {
    throw new Error(`${label}: بصمة الجهاز/Passkey غير مدعومة هنا. افتح التطبيق من موبايل يدعم البصمة أو من HTTPS.`);
  }
  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        timeout: 60000,
        userVerification: "required",
      },
    });
    if (!credential?.rawId) throw new Error("لم يتم استلام تأكيد البصمة.");
    return toBase64Url(credential.rawId);
  } catch {
    throw new Error(`${label}: تم إلغاء أو رفض بصمة الجهاز.`);
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
    showToast(fresh[0].title || "وصل تنبيه داخلي جديد", "ok");
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
  if (score >= 5) return { key: "strong", label: "قوية" };
  if (score >= 3) return { key: "medium", label: "متوسطة" };
  return { key: "weak", label: "ضعيفة" };
}

function passwordStrengthMarkup() {
  return `<div class="password-strength" data-password-strength><span></span><strong>اكتب كلمة مرور قوية</strong></div>`;
}

function bindPasswordStrength(form) {
  const input = form?.querySelector('[name="newPassword"], [name="password"]');
  const meter = form?.querySelector('[data-password-strength]');
  if (!input || !meter) return;
  const update = () => {
    const level = passwordStrengthLevel(input.value);
    meter.dataset.level = level.key;
    meter.querySelector('strong').textContent = input.value ? `قوة كلمة المرور: ${level.label}` : 'اكتب كلمة مرور قوية';
  };
  input.addEventListener('input', update);
  update();
}

function renderLoadingSkeleton(title = "جاري التحميل", subtitle = "نجهز البيانات الآن...") {
  const current = routeKey();
  app.innerHTML = `
    <div class="employee-shell">
      <header class="employee-topbar"><div class="employee-brand"><img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" /><div><strong>أحلى شباب</strong><span>تطبيق الموظفين</span></div></div></header>
      <main class="employee-main">
        <section class="employee-page-head"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></div></section>
        <section class="employee-grid loading-skeleton" aria-busy="true" aria-live="polite">
          <article class="employee-card full"><div class="skeleton wide"></div><div class="skeleton"></div><div class="skeleton short"></div></article>
          <article class="employee-card"><div class="skeleton"></div><div class="skeleton short"></div></article>
          <article class="employee-card"><div class="skeleton"></div><div class="skeleton short"></div></article>
        </section>
      </main>
      <nav class="employee-bottom-nav" aria-label="تنقل تطبيق الموظف">
        ${employeeRoutes.map(([key, label, icon]) => `<button class="${current === key || (key === 'more' && isMoreRoute(current)) ? 'is-active' : ''}" type="button" disabled><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`).join("")}
      </nav>
    </div>`;
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}

<<<<<<< HEAD
function passwordToggleButton() {
  return `<button type="button" class="password-eye" data-toggle-password aria-label="إظهار كلمة المرور" title="إظهار كلمة المرور" aria-pressed="false"><span class="password-eye-icon" aria-hidden="true"></span></button>`;
}

function passwordField({ name = "password", value = "", autocomplete = "", placeholder = "", required = false, minlength = "" } = {}) {
  const attrs = [
    `name="${escapeHtml(name)}"`,
    `type="password"`,
    value ? `value="${escapeHtml(value)}"` : "",
    autocomplete ? `autocomplete="${escapeHtml(autocomplete)}"` : "",
    placeholder ? `placeholder="${escapeHtml(placeholder)}"` : "",
    required ? "required" : "",
    minlength ? `minlength="${escapeHtml(minlength)}"` : "",
  ].filter(Boolean).join(" ");
  return `<span class="password-field"><input ${attrs} />${passwordToggleButton()}</span>`;
}

function attachPasswordToggles(root = app) {
  root.querySelectorAll("[data-toggle-password]").forEach((button) => {
    if (button.dataset.passwordToggleBound === "true") return;
    button.dataset.passwordToggleBound = "true";
    button.addEventListener("click", () => {
      const input = button.closest(".password-field")?.querySelector("input");
      if (!input) return;
      const willShow = input.type !== "text";
      input.type = willShow ? "text" : "password";
      const label = willShow ? "إخفاء كلمة المرور" : "إظهار كلمة المرور";
      button.setAttribute("aria-label", label);
      button.setAttribute("title", label);
      button.setAttribute("aria-pressed", String(willShow));
    });
  });
}

=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
function normalizePermissionList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try { return normalizePermissionList(JSON.parse(trimmed)); } catch { return trimmed.split(/[،,\s]+/).map((item) => item.trim()).filter(Boolean); }
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

function fileToAvatarDataUrl(file) {
  if (!file || !String(file.type || "").startsWith("image/")) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الصورة."));
    reader.onload = () => { image.src = reader.result; };
    image.onerror = () => reject(new Error("ملف الصورة غير صالح."));
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
<<<<<<< HEAD
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&accept-language=ar&addressdetails=1`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    const data = response.ok ? await response.json() : {};
    return formatReverseGeocode(data, latitude, longitude);
  } catch {
    return nearestKnownPlace(latitude, longitude);
=======
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=18&accept-language=ar`;
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    const data = response.ok ? await response.json() : {};
    return data.display_name || data.name || "";
  } catch {
    return "";
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  } finally {
    window.clearTimeout(timer);
  }
}

<<<<<<< HEAD
function nearestKnownPlace(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat - 28.35406) < 0.03 && Math.abs(lng - 30.743427) < 0.03) {
    return "قرية قلوصنا، مركز سمالوط، محافظة المنيا، مصر";
  }
  return "";
}

function formatReverseGeocode(data = {}, latitude, longitude) {
  const address = data.address || {};
  const road = String(address.road || address.pedestrian || address.footway || "").trim();
  const building = String(address.building || address.amenity || address.shop || address.office || data.name || "").trim();
  const neighbourhood = String(address.neighbourhood || address.suburb || address.quarter || "").trim();
  const rawName = String(address.village || address.town || address.city || address.hamlet || "").trim();
  const normalizedVillage = /qul|qulū|qulus|qlosna|قلوصنا/i.test(rawName) ? "قرية قلوصنا" : rawName;
  const state = String(address.state || "").trim();
  const county = String(address.county || address.city_district || "").trim();
  if (normalizedVillage === "قرية قلوصنا" || /المنيا/.test(state)) {
    return [building, road, neighbourhood, normalizedVillage || "قرية قلوصنا", county || "مركز سمالوط", state || "محافظة المنيا", address.country || "مصر"].filter(Boolean).join("، ");
  }
  return [building, road, neighbourhood, rawName, county, state, address.country].filter(Boolean).join("، ") || data.display_name || data.name || nearestKnownPlace(latitude, longitude);
}

function recordPlaceName(record = {}) {
  return record.placeName || record.locationName || record.currentPlaceName || record.currentAddress || record.address || record.place || "";
}

async function enrichRecordsWithPlaceNames(records = [], limit = 8) {
  return Promise.all(records.map(async (record, index) => {
    if (recordPlaceName(record) || index >= limit || record.latitude == null || record.longitude == null) return record;
    const placeName = await reverseGeocode(record.latitude, record.longitude);
    return placeName ? { ...record, placeName } : record;
  }));
}

=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
function date(value) {
  if (!value) return "-";
  try { return new Date(value).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" }); } catch { return value; }
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function statusLabel(value = "") {
  const map = {
    CHECK_IN: "حضور",
    CHECK_OUT: "انصراف",
    PRESENT: "حاضر",
    LATE: "متأخر",
    ABSENT: "غائب",
    PENDING: "قيد المراجعة",
    APPROVED: "مقبول",
    REJECTED: "مرفوض",
    REJECTED_CONFIRMED: "رفض نهائي",
    MANUAL_APPROVED: "اعتماد يدوي",
    UNREAD: "جديد",
    READ: "مقروء",
    IN_REVIEW: "أمام اللجنة",
    ON_LEAVE: "إجازة",
    ON_MISSION: "مأمورية",
    CHECKED_OUT: "انصرف",
    LIVE_SHARED: "موقع مباشر مُرسل",
    ACTION_REQUIRED: "إجراء مطلوب",
<<<<<<< HEAD
    inside_branch: "داخل المجمع",
    inside_branch_low_accuracy: "داخل المجمع - دقة ضعيفة",
    outside_branch: "خارج المجمع",
    location_low_accuracy: "خارج المجمع - دقة ضعيفة",
    permission_denied: "صلاحية الموقع مرفوضة",
    location_unavailable: "الموقع غير متاح",
    branch_location_missing: "إحداثيات المجمع غير مضبوطة",
    branch_unknown: "المجمع غير معروف",
    manual_review_required: "مراجعة يدوية",
    verified: "تم التحقق",
=======
    SELF_SUBMITTED: "مرسل من الموظف",
    MANAGER_APPROVED: "اعتماد المدير",
    HR_REVIEWED: "مراجعة HR",
    SECRETARY_REVIEWED: "مراجعة السكرتير",
    EXECUTIVE_APPROVED: "اعتماد المدير التنفيذي",
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  };
  return map[value] || value || "-";
}

<<<<<<< HEAD
function formatMeters(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  if (number >= 1000) return `${(number / 1000).toLocaleString("ar-EG", { maximumFractionDigits: 2 })} كم`;
  return `${Math.round(number).toLocaleString("ar-EG")} متر`;
}

function eventLocationDetails(event = {}) {
  const distance = event.distanceFromBranchMeters ?? event.distanceMeters;
  const placeName = recordPlaceName(event);
  const parts = [];
  if (event.geofenceStatus) parts.push(statusLabel(event.geofenceStatus));
  if (placeName) parts.push(`المكان: ${placeName}`);
  if (distance != null) parts.push(`يبعد عن المجمع: ${formatMeters(distance)}`);
  if (event.accuracyMeters != null) parts.push(`دقة GPS: ${formatMeters(event.accuracyMeters)}`);
  if (!placeName && event.latitude != null && event.longitude != null) parts.push("اسم المكان غير محفوظ لهذه البصمة");
  return parts.join(" - ");
}

function geofenceMessageAr(evaluation = {}) {
  const distance = evaluation.distanceFromBranchMeters ?? evaluation.distanceMeters;
  const radius = evaluation.radiusMeters;
  const accuracy = evaluation.accuracyMeters;
  if (evaluation.geofenceStatus === "inside_branch") return "البصمة داخل المجمع ويمكن تسجيلها.";
  if (evaluation.geofenceStatus === "inside_branch_low_accuracy") return "البصمة داخل نطاق المجمع، لكن دقة GPS ضعيفة. يفضل تشغيل الموقع عالي الدقة.";
  if (evaluation.geofenceStatus === "outside_branch") return `البصمة خارج المجمع. المسافة الحالية ${formatMeters(distance)}، والنطاق المسموح ${formatMeters(radius)}.`;
  if (evaluation.geofenceStatus === "location_low_accuracy") return `دقة الموقع ضعيفة. المسافة الحالية ${formatMeters(distance)}، ودقة GPS ${formatMeters(accuracy)}.`;
  if (evaluation.geofenceStatus === "permission_denied") return "تم رفض صلاحية الموقع. اسمح للمتصفح بقراءة الموقع ثم حاول مرة أخرى.";
  if (evaluation.geofenceStatus === "location_unavailable") return "الموقع غير متاح حاليًا. فعّل GPS ثم حاول مرة أخرى.";
  if (evaluation.geofenceStatus === "branch_location_missing") return "إحداثيات المجمع غير مضبوطة لهذا الموظف.";
  return evaluation.message || evaluation.blockReason || "";
}

=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
function badge(value, extra = "") {
  const key = String(value || "").toLowerCase();
  return `<span class="badge ${extra} status-${escapeHtml(key)}">${escapeHtml(statusLabel(value))}</span>`;
}

<<<<<<< HEAD
const STATIC_EMPLOYEE_PHOTOS = {
  "emp-demo-001": "demo-employee-001.png",
  "emp-demo-002": "demo-employee-002.png",
  "emp-demo-003": "demo-employee-003.png",
  "emp-demo-004": "demo-employee-004.png",
  "emp-demo-005": "demo-employee-005.png",
  "emp-demo-006": "demo-employee-006.png",
  "emp-demo-007": "demo-employee-007.png",
  "emp-demo-008": "demo-employee-008.png",
  "emp-demo-010": "demo-employee-009.png",
  "emp-demo-011": "demo-employee-010.png",
  "emp-demo-012": "demo-employee-011.png",
  "emp-demo-013": "demo-employee-012.png",
  "emp-demo-014": "demo-employee-013.png",
  "emp-demo-015": "demo-employee-014.png",
  "emp-demo-016": "demo-employee-015.png",
  "emp-demo-020": "demo-employee-016.png",
  "emp-demo-022": "demo-employee-017.png",
  "emp-demo-023": "demo-employee-018.png",
};
const STATIC_EMPLOYEE_PHOTO_ALIASES = {
  "demo.alias": "demo-employee-001.png",
  "demo.alias": "demo-employee-002.png",
  "demo.alias": "demo-employee-002.png",
  "demo.alias": "demo-employee-003.png",
  "hr": "demo-employee-003.png",
  "demo.alias": "demo-employee-004.png",
  "demo.alias": "demo-employee-005.png",
  "demo.alias": "demo-employee-006.png",
  "demo.alias": "demo-employee-007.png",
  "demo.alias": "demo-employee-008.png",
  "employee": "demo-employee-009.png",
  "demo.alias": "demo-employee-009.png",
  "demo.alias": "demo-employee-010.png",
  "demo.alias": "demo-employee-011.png",
  "demo.alias": "demo-employee-012.png",
  "demo.alias": "demo-employee-013.png",
  "demo.alias": "demo-employee-014.png",
  "demo.alias": "demo-employee-015.png",
  "demo.alias": "demo-employee-016.png",
  "demo.alias": "demo-employee-017.png",
  "demo.alias": "demo-employee-018.png",
};
function assetPrefix() { return location.pathname.includes("/admin/") || location.pathname.includes("/employee/") || location.pathname.includes("/executive/") || location.pathname.includes("/operations-gate/") ? "../" : "./"; }
function staticPhotoFor(subject = {}) {
  const id = subject.employeeId || subject.employee?.id || subject.employee?.employeeId || subject.id || "";
  const emailKey = String(subject.email || subject.employee?.email || "").split("@")[0].toLowerCase();
  const file = STATIC_EMPLOYEE_PHOTOS[id] || STATIC_EMPLOYEE_PHOTO_ALIASES[emailKey] || "";
  return file ? assetPrefix() + "shared/images/employees/" + file : "";
}
function avatar(subject = {}, size = "") {
  const url = subject?.avatarUrl || subject?.photoUrl || subject?.employee?.photoUrl || subject?.employee?.avatarUrl || staticPhotoFor(subject);
  const name = subject?.fullName || subject?.name || subject?.employee?.fullName || subject?.email || "م";
  const text = escapeHtml(String(name).trim().charAt(0) || "م");
  return url ? "<span class=\"avatar-wrap " + escapeHtml(size) + "\"><img class=\"avatar " + escapeHtml(size) + "\" src=\"" + escapeHtml(url) + "\" alt=\"\" onerror=\"this.hidden=true;this.nextElementSibling.hidden=false\" /><span class=\"avatar-fallback\" hidden>" + text + "</span></span>" : "<span class=\"avatar " + escapeHtml(size) + "\">" + text + "</span>";
=======

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
  const name = subject?.fullName || subject?.name || subject?.email || subject?.employee?.fullName || "م";
  return url
    ? `<img class="avatar ${size}" src="${escapeHtml(url)}" alt="" loading="lazy" />`
    : `<span class="avatar ${size}">${escapeHtml(String(name).trim().charAt(0) || "م")}</span>`;
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
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
<<<<<<< HEAD
=======
  if (executiveOnlyRoles.has(role)) return false;
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  if (fullAccessRoles.has(role)) return true;
  const permissions = permissionsOf(user);
  return [...permissions].some((scope) => adminScopes.has(scope));
}

function employeeSubject() {
  return state.user?.employee || state.user || {};
}

<<<<<<< HEAD
async function enableMobileNotifications() {
  if (!("Notification" in window)) throw new Error("الإشعارات غير مدعومة في هذا المتصفح.");
  let subscription = null;
  if (window.HR_SHOW_NOTIFICATION) {
    await window.HR_SHOW_NOTIFICATION({ title: "تم تفعيل إشعارات أحلى شباب", body: "ستظهر تنبيهات طلب الموقع والبصمة والقرارات المهمة.", tag: "hr-notifications-enabled", url: "#notifications" });
    if (window.HR_CREATE_PUSH_SUBSCRIPTION) subscription = await window.HR_CREATE_PUSH_SUBSCRIPTION();
  } else {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("لم يتم السماح بالإشعارات.");
    new Notification("تم تفعيل إشعارات أحلى شباب", { body: "ستظهر تنبيهات طلب الموقع والبصمة والقرارات المهمة." });
  }
  await endpoints.subscribePush({ subscription, endpoint: subscription?.endpoint || "browser-local", permission: Notification.permission, platform: navigator.userAgent });
  await pollEmployeeNotifications();
}

function rememberAndNotify(items = []) {
  if (!("Notification" in window) || Notification.permission !== "granted" || !items.length) return;
  const key = "hr.notified." + ((state.user && state.user.id) || "user");
  let seen = [];
  try { seen = JSON.parse(localStorage.getItem(key) || "[]"); } catch {}
  const nextSeen = new Set(seen);
  items.slice(0, 4).forEach((item) => {
    if (!item || !item.id || nextSeen.has(item.id)) return;
    nextSeen.add(item.id);
    const payload = { title: item.title || "تنبيه من الإدارة", body: item.body || item.reason || "راجع تطبيق الموظف الآن.", tag: item.id, requireInteraction: false, url: item.route ? ("#" + item.route) : "#notifications" };
    if (window.HR_SHOW_NOTIFICATION) window.HR_SHOW_NOTIFICATION(payload).catch(() => {});
    else try { new Notification(payload.title, { body: payload.body, tag: payload.tag, requireInteraction: false }); } catch {}
  });
  localStorage.setItem(key, JSON.stringify(Array.from(nextSeen).slice(-80)));
}

async function pollEmployeeNotifications() {
  if (!state.user) return;
  const employeeId = state.user?.employeeId || state.user?.employee?.id || "";
  try {
    const [liveRequests, notifications, actionCenter] = await Promise.all([
      endpoints.myLiveLocationRequests().then(unwrap).catch(() => []),
      endpoints.notifications().then(unwrap).catch(() => []),
      endpoints.myActionCenter().then(unwrap).catch(() => ({ actions: [] })),
    ]);
    const liveItems = (liveRequests || [])
      .filter((item) => item.status === "PENDING" && (!employeeId || item.employeeId === employeeId))
      .map((item) => ({ ...item, title: "طلب موقع مباشر", body: item.reason || "الإدارة تطلب إرسال موقعك الآن.", route: "location" }));
    const actionItems = (actionCenter?.actions || [])
      .filter((item) => item.type === "LIVE_LOCATION" || item.route === "location")
      .map((item) => ({ ...item, title: item.title || "طلب موقع مباشر", body: item.body || item.reason || "راجع طلب الموقع الآن.", route: "location" }));
    const notificationItems = (notifications || [])
      .filter((item) => !item.liveLocationRequestId && !item.isRead && (!employeeId || !item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id))
      .map((item) => ({ ...item, route: item.route || (item.liveLocationRequestId ? "location" : "notifications") }));
    const items = [...liveItems, ...actionItems, ...notificationItems];
    showInAppNotification(items);
    rememberAndNotify(items);
  } catch (error) {
    console.warn("notification poll failed", error);
  }
}

function showInAppNotification(items = []) {
  const current = items.find((item) => item && item.id);
  let alert = document.querySelector("[data-employee-live-alert]");
  const dismissedKey = "hr.dismissed.alerts." + ((state.user && state.user.id) || "user");
  const mutedKey = "hr.muted.alerts." + ((state.user && state.user.id) || "user");
  if (Number(sessionStorage.getItem(mutedKey) || 0) > Date.now()) {
    alert?.remove();
    return;
  }
  let dismissed = [];
  try { dismissed = JSON.parse(sessionStorage.getItem(dismissedKey) || "[]"); } catch {}
  const dismissedSet = new Set(dismissed);
  if (current?.id && dismissedSet.has(current.id)) {
    alert?.remove();
    return;
  }
  if (!current) {
    alert?.remove();
    return;
  }
  if (!alert) {
    alert = document.createElement("div");
    alert.className = "employee-live-alert";
    alert.dataset.employeeLiveAlert = "true";
    document.body.appendChild(alert);
  }
  alert.innerHTML = `<button type="button" data-alert-open><strong>${escapeHtml(current.title || "تنبيه جديد")}</strong><span>${escapeHtml(current.body || current.reason || "راجع تطبيق الموظف الآن.")}</span></button><button type="button" aria-label="إغلاق" data-alert-close>×</button>`;
  alert.querySelector("[data-alert-open]")?.addEventListener("click", () => { location.hash = current.route || "notifications"; });
  alert.querySelector("[data-alert-close]")?.addEventListener("click", () => {
    if (current?.id) {
      dismissedSet.add(current.id);
      sessionStorage.setItem(dismissedKey, JSON.stringify(Array.from(dismissedSet).slice(-80)));
    }
    sessionStorage.setItem(mutedKey, String(Date.now() + 5 * 60 * 1000));
    alert.remove();
  });
  clearTimeout(employeeAlertHideTimer);
  employeeAlertHideTimer = window.setTimeout(() => alert.remove(), 7000);
}

function stopNotificationPolling() {
  if (!notificationPollTimer) return;
  clearInterval(notificationPollTimer);
  notificationPollTimer = 0;
}

function startNotificationPolling() {
  if (!state.user) return;
  if (!notificationPollTimer) notificationPollTimer = setInterval(pollEmployeeNotifications, 10000);
  if (!notificationVisibilityHooked) {
    notificationVisibilityHooked = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") pollEmployeeNotifications();
    });
  }
  pollEmployeeNotifications();
=======
function isMoreRoute(key = routeKey()) {
  return moreEmployeeRoutes.some(([route]) => route === key);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}

function shell(content, title = "تطبيق الموظف", subtitle = "") {
  const current = routeKey();
  const user = state.user || {};
  const employee = employeeSubject();
<<<<<<< HEAD
  const moreRouteActive = moreEmployeeRoutes.some(([key]) => key === current);
=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  app.innerHTML = `
    <div class="employee-shell">
      <header class="employee-topbar">
        <div class="employee-brand">
          <img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" />
          <div><strong>أحلى شباب</strong><span>تطبيق الموظفين</span></div>
        </div>
        <div class="employee-user" title="${escapeHtml(user.fullName || user.name || user.email || "مستخدم")}">
          ${avatar(user, "tiny")}
          <span><strong>${escapeHtml(user.fullName || user.name || employee.fullName || "مستخدم")}</strong><small>${escapeHtml(employee.jobTitle || "تطبيق الموظفين")}</small></span>
        </div>
      </header>
      <main class="employee-main">
        <section class="employee-page-head">
          <div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle || routeSubtitles[current] || "")}</p></div>
        </section>
<<<<<<< HEAD
        ${localStorage.getItem("hr.demoMode") === "true" ? `<div class="message warning">وضع التدريب مفعل: البيانات تجريبية محلية.</div>` : ""}
=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
        ${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ""}
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${content}
      </main>
<<<<<<< HEAD
      <div class="employee-more-sheet" data-more-sheet hidden>
        <div class="employee-more-sheet-panel">
          <div class="employee-more-sheet-head"><strong>\u0627\u0644\u0645\u0632\u064a\u062f</strong><button type="button" data-close-more>\u0625\u063a\u0644\u0627\u0642</button></div>
          <div class="employee-more-grid">
            ${moreEmployeeRoutes.map(([key, label, icon]) => `<button class="${current === key ? "is-active" : ""}" data-route="${key}" aria-label="${escapeHtml(label)}" ${current === key ? 'aria-current="page"' : ""}><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`).join("")}
          </div>
        </div>
      </div>
      <nav class="employee-bottom-nav" aria-label="تنقل تطبيق الموظف">
        ${employeeRoutes.map(([key, label, icon]) => key === "more"
          ? `<button class="${moreRouteActive ? "is-active" : ""}" data-more-menu aria-label="${escapeHtml(label)}" ${moreRouteActive ? 'aria-current="page"' : ""}><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`
          : `<button class="${current === key ? "is-active" : ""}" data-route="${key}" aria-label="${escapeHtml(label)}" ${current === key ? 'aria-current="page"' : ""}><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`).join("")}
      </nav>
    </div>
  `;
  app.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => { location.hash = button.dataset.route; }));
  app.querySelector("[data-more-menu]")?.addEventListener("click", () => { app.querySelector("[data-more-sheet]").hidden = false; });
  app.querySelector("[data-close-more]")?.addEventListener("click", () => { app.querySelector("[data-more-sheet]").hidden = true; });
  app.querySelector("[data-more-sheet]")?.addEventListener("click", (event) => {
    if (event.target?.matches?.("[data-more-sheet]")) event.currentTarget.hidden = true;
  });
  app.querySelectorAll("form[data-ajax]").forEach((form) => form.addEventListener("submit", handleFormSubmit));
  app.querySelectorAll("[data-enable-notifications]").forEach((button) => button.addEventListener("click", async () => {
    try { await enableMobileNotifications(); setMessage("تم تفعيل إشعارات الموبايل.", ""); }
    catch (error) { setMessage("", error.message || "تعذر تفعيل الإشعارات."); }
    render();
  }));
  app.querySelector("[data-logout]")?.addEventListener("click", async () => {
    if (!confirm("هل تريد تسجيل الخروج؟")) return;
    stopNotificationPolling();
    await endpoints.logout();
    document.querySelector("[data-employee-live-alert]")?.remove();
=======
      <nav class="employee-bottom-nav" aria-label="تنقل تطبيق الموظف">
        ${employeeRoutes.map(([key, label, icon]) => key === "more"
          ? `<button class="${isMoreRoute(current) ? "is-active" : ""}" type="button" data-more-menu aria-expanded="false"><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`
          : `<button class="${current === key ? "is-active" : ""}" type="button" data-route="${key}"><strong>${icon}</strong><span>${escapeHtml(label)}</span></button>`).join("")}
      </nav>
      <div class="employee-more-backdrop hidden" data-more-backdrop></div>
      <section class="employee-more-sheet hidden" data-more-sheet aria-label="قائمة المزيد">
        <div class="more-sheet-handle"></div>
        <div class="more-sheet-head"><strong>المزيد</strong><button type="button" class="icon-button" data-close-more aria-label="إغلاق">×</button></div>
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
  app.querySelectorAll("form[data-ajax]").forEach((form) => form.addEventListener("submit", handleFormSubmit));
  app.querySelector("[data-logout]")?.addEventListener("click", async () => {
    const ok = await confirmAction({ title: "تسجيل الخروج", message: "هل تريد تسجيل الخروج من تطبيق الموظفين؟", confirmLabel: "خروج", danger: true });
    if (!ok) return;
    await endpoints.logout();
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    localStorage.removeItem("hr-attendance.local-db.v7");
    sessionStorage.removeItem("hr.core");
    sessionStorage.removeItem("hr.core.exp");
    state.user = null;
    location.hash = "home";
    renderLogin();
  });
<<<<<<< HEAD
  attachPasswordToggles(app);
=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const action = form.dataset.ajax;
  const values = readForm(form);
  try {
    if (action === "leave") {
      if (values.startDate && values.endDate && values.startDate > values.endDate) {
        setMessage("", "تاريخ نهاية الإجازة يجب أن يكون بعد تاريخ البداية.");
        renderLeaves();
        return;
      }
      await endpoints.createLeave(values);
      setMessage("تم إرسال طلب الإجازة للمراجعة.", "");
      location.hash = "leaves";
    }
    if (action === "mission") {
      await endpoints.createMission(values);
      setMessage("تم إرسال طلب المأمورية للمراجعة.", "");
      location.hash = "missions";
    }
    if (action === "dispute") {
      await endpoints.createDispute({ title: values.title, description: values.description, employeeId: state.user?.employeeId || state.user?.employee?.id || "" });
      setMessage("تم رفع الشكوى إلى لجنة حل المشاكل والخلافات.", "");
      location.hash = "disputes";
    }
    render();
  } catch (error) {
    setMessage("", error.message || "حدث خطأ أثناء الحفظ.");
    render();
  }
}

async function renderLogin() {
<<<<<<< HEAD
  const identifierValue = state.loginIdentifier || "";
  const passwordValue = state.loginPassword || "";
  const rememberChecked = state.rememberLogin ? "checked" : "";
=======
  if (routeKey() === "register") {
    state.registerMode = false;
    history.replaceState(null, "", "#home");
  }
  const identifierValue = state.loginIdentifier || "";
  const passwordValue = state.loginPassword || "";
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  app.innerHTML = `
    <div class="employee-login-screen">
      <form class="employee-login-card" id="employee-login-form" novalidate>
        <div class="login-brand-row">
          <img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" />
          <div><strong>أحلى شباب</strong><span>منصة الموظفين</span></div>
        </div>
        <h1>دخول الموظفين</h1>
<<<<<<< HEAD
        <p>حضور وانصراف، إرسال الموقع، طلب إجازة أو شكوى، وإشعارات في تطبيق واحد بسيط.</p>
        <div class="login-features"><span class="login-feature">بصمة آمنة</span><span class="login-feature">موقع مباشر</span><span class="login-feature">إشعارات</span></div>
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ""}
        ${state.lastLoginFailed ? `<div class="message warning compact">لو نسيت كلمة المرور اضغط على "نسيت كلمة السر" وسيتم إرسال رابط إعادة التعيين.</div>` : ""}
        <label>رقم الهاتف أو البريد الإلكتروني<input name="identifier" value="${escapeHtml(identifierValue)}" autocomplete="username" inputmode="email" placeholder="مثال: 010... أو name@email.com" required /></label>
        <label>كلمة المرور${passwordField({ value: passwordValue, autocomplete: "current-password", placeholder: "اكتب كلمة المرور", required: true })}</label>
        <label class="check-row login-remember-row"><input type="checkbox" name="rememberLogin" ${rememberChecked} /> تذكرني على هذا الجهاز</label>
        <button class="button primary full" type="submit">دخول للتطبيق</button>
        <button class="button ghost full" type="button" data-forgot-password>نسيت كلمة السر؟ أرسل رابط إعادة التعيين</button>
=======
        <p>يتم إنشاء الحسابات من لوحة HR فقط. ادخل برقم هاتفك المسجل، وكلمة المرور الافتراضية هي نفس رقمك الشخصي/رقم الهاتف المسجل في قائمة الموظفين المعتمدة.</p>
        <div class="login-features"><span class="login-feature">دخول بالهاتف</span><span class="login-feature">بصمة + GPS</span><span class="login-feature">إشعارات داخلية</span></div>
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ""}
        ${state.lastLoginFailed ? `<div class="message warning compact">تحقق من رقم الهاتف وكلمة المرور. الحسابات تُدار من HR فقط.</div>` : ""}
        <label>رقم الهاتف<input name="identifier" value="${escapeHtml(identifierValue)}" autocomplete="username" inputmode="tel" placeholder="اكتب رقم الهاتف المسجل" required /></label>
        <label>كلمة المرور<input name="password" type="password" value="${escapeHtml(passwordValue)}" autocomplete="current-password" placeholder="نفس الرقم الشخصي/رقم الهاتف أول مرة" required /></label>
        <button class="button primary full" type="submit">دخول للتطبيق</button>
        <button class="button ghost full" type="button" data-forgot-password>نسيت كلمة السر؟ تواصل مع HR أو أرسل رابط إعادة التعيين</button>
        <div class="message compact">لا يوجد تسجيل ذاتي من تطبيق الموظف. أي موظف جديد تتم إضافته من لوحة HR فقط لضمان اعتماد القائمة الرسمية.</div>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      </form>
    </div>
  `;
  const form = app.querySelector("#employee-login-form");
<<<<<<< HEAD
  attachPasswordToggles(form);
  form.addEventListener("input", () => {
    const values = readForm(form);
    state.loginIdentifier = values.identifier || "";
    state.loginPassword = values.password || "";
    state.rememberLogin = values.rememberLogin === "on" || values.rememberLogin === true;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(form);
    state.loginIdentifier = values.identifier || "";
    state.loginPassword = values.password || "";
    state.rememberLogin = values.rememberLogin === "on" || values.rememberLogin === true;
    if (state.loginIdentifier) localStorage.setItem("hr.login.lastIdentifier", state.loginIdentifier);
    try {
      state.user = unwrap(await endpoints.login(values.identifier, values.password));
      if (state.rememberLogin) {
        localStorage.setItem(REMEMBER_LOGIN_KEY, "true");
        localStorage.setItem(REMEMBER_IDENTIFIER_KEY, state.loginIdentifier);
        localStorage.setItem(REMEMBER_PASSWORD_KEY, state.loginPassword);
      } else {
        localStorage.removeItem(REMEMBER_LOGIN_KEY);
        localStorage.removeItem(REMEMBER_IDENTIFIER_KEY);
        localStorage.removeItem(REMEMBER_PASSWORD_KEY);
        state.loginPassword = "";
      }
=======
  form.addEventListener("input", () => {
    const values = readForm(form);
    state.loginIdentifier = values.identifier || state.loginIdentifier || "";
    state.loginPassword = values.password || "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    try {
      state.loginIdentifier = values.identifier || "";
      state.loginPassword = values.password || "";
      if (state.loginIdentifier) localStorage.setItem("hr.login.lastIdentifier", state.loginIdentifier);
      state.user = unwrap(await endpoints.login(values.identifier, values.password));
      state.loginPassword = "";
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      state.lastLoginFailed = false;
      setMessage("تم تسجيل الدخول بنجاح.", "");
      startNotificationPolling();
      render();
    } catch (error) {
      state.lastLoginFailed = true;
      setMessage("", error.message || "تعذر تسجيل الدخول.");
      renderLogin();
    }
  });
  app.querySelector("[data-forgot-password]")?.addEventListener("click", async () => {
    const values = readForm(form);
    state.loginIdentifier = values.identifier || state.loginIdentifier || "";
    state.loginPassword = values.password || state.loginPassword || "";
    if (!state.loginIdentifier) {
<<<<<<< HEAD
      setMessage("", "اكتب رقم الهاتف أو البريد الإلكتروني أولًا ثم اضغط نسيت كلمة السر.");
=======
      setMessage("", "اكتب رقم الهاتف أولًا ثم اضغط نسيت كلمة السر.");
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      return renderLogin();
    }
    try {
      await endpoints.forgotPassword(state.loginIdentifier);
      state.lastLoginFailed = false;
<<<<<<< HEAD
      setMessage("تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد المرتبط بالحساب.", "");
=======
      setMessage("تم إرسال طلب إعادة تعيين كلمة المرور إلى الإدارة/البريد المرتبط.", "");
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      renderLogin();
    } catch (error) {
      state.lastLoginFailed = true;
      setMessage("", error.message || "تعذر إرسال رابط إعادة التعيين.");
      renderLogin();
    }
  });
}

async function getBrowserLocation() {
  if (!navigator.geolocation) return { locationPermission: "unavailable", accuracyMeters: null };
<<<<<<< HEAD
  const normalizePosition = (position) => {
    const accuracyMeters = Math.round(Number(position.coords.accuracy || 0));
    return {
      locationPermission: "granted",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: accuracyMeters,
      accuracyMeters,
      capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
    };
  };
  const readOnce = (timeout = 12000) => new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(normalizePosition(position)),
      (error) => resolve({ locationPermission: error.code === error.PERMISSION_DENIED ? "denied" : "unknown", accuracyMeters: null }),
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    );
  });
  const watchedSamples = await new Promise((resolve) => {
    const samples = [];
    let finished = false;
    let watchId = null;
    const finish = (fallback = null) => {
      if (finished) return;
      finished = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      resolve(samples.length ? samples : (fallback ? [fallback] : []));
    };
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const current = normalizePosition(position);
        samples.push(current);
        if (Number(current.accuracyMeters || Infinity) <= 60) finish();
      },
      async (error) => {
        const fallback = await readOnce(12000);
        finish(error.code === error.PERMISSION_DENIED ? { locationPermission: "denied", accuracyMeters: null } : fallback);
      },
      { enableHighAccuracy: true, timeout: 18000, maximumAge: 0 },
    );
    window.setTimeout(() => finish(), 18000);
  });
  const samples = watchedSamples.length ? watchedSamples : [await readOnce(15000)];
  const denied = samples.find((item) => item.locationPermission && item.locationPermission !== "granted");
  if (denied) return denied;
  const best = samples
    .filter((item) => Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
    .sort((a, b) => Number(a.accuracyMeters || Infinity) - Number(b.accuracyMeters || Infinity))[0];
  return best || { locationPermission: "unknown", accuracyMeters: null };
=======
  return await new Promise((resolve) => {
    let bestPosition = null;
    const timeout = 15000; // Increased to 15s for better lock chance
    const targetAccuracy = 35; // meters (more realistic for city)
    const unacceptableAccuracy = 2000; // if > 2km, it's definitely IP-based
    
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        const acc = Math.round(Number(position.coords.accuracy || 9999));
        
        // If we get an IP-based location (very low accuracy), we keep it as last resort but flag it
        if (!bestPosition || acc < (bestPosition.accuracy || 9999)) {
          bestPosition = {
            locationPermission: "granted",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: acc,
            accuracyMeters: acc,
            isIpBased: acc > unacceptableAccuracy,
            capturedAt: new Date().toISOString(),
          };
        }
        
        // If we reach a good GPS accuracy, stop and resolve immediately
        if (acc <= targetAccuracy) {
          navigator.geolocation.clearWatch(watcher);
          window.clearTimeout(timer);
          resolve(bestPosition);
        }
      },
      (error) => {
        if (!bestPosition) {
          navigator.geolocation.clearWatch(watcher);
          window.clearTimeout(timer);
          resolve({ locationPermission: error.code === error.PERMISSION_DENIED ? "denied" : "unknown", accuracyMeters: null });
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );

    const timer = window.setTimeout(() => {
      navigator.geolocation.clearWatch(watcher);
      if (bestPosition) {
        if (bestPosition.accuracy > unacceptableAccuracy) {
          bestPosition.locationError = "تم رصد موقع تقريبي جداً (عن طريق الإنترنت وليس GPS). يرجى تفعيل الموقع الدقيق Precise Location في إعدادات المتصفح والموبايل والاقتراب من نافذة.";
        }
        resolve(bestPosition);
      }
      else resolve({ locationPermission: "timeout", accuracyMeters: null });
    }, timeout);
  });
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}

function friendlyError(error, fallback = "تعذر تنفيذ العملية.") {
  const text = String(error?.message || error || fallback);
  if (text.includes("permission") || text.includes("صلاحية") || text.includes("الموقع")) return "لم نتمكن من تحديد موقعك. فعّل GPS واسمح للتطبيق بالوصول للموقع ثم حاول مرة أخرى.";
  if (text.includes("network") || text.includes("fetch")) return "الاتصال غير مستقر. تأكد من الإنترنت ثم أعد المحاولة.";
  if (text.includes("quota") || text.includes("مساحة")) return "مساحة التخزين المحلية امتلأت. استخدم صورة أصغر أو اطلب من الإدارة تفعيل Supabase.";
  if (text.includes("خارج") || text.includes("outside")) return "أنت خارج نطاق الجمعية. سيتم إرسال البصمة للمراجعة إذا كان ذلك مسموحًا.";
  return text || fallback;
}

async function renderRecoveryPassword() {
  shell(`
    <section class="employee-grid">
<<<<<<< HEAD
      
      <form class="employee-card full" id="recovery-password-form">
        <h2>تعيين كلمة مرور جديدة</h2>
        <p>تم فتح رابط استعادة كلمة المرور. اكتب كلمة مرور جديدة لا تقل عن 8 أحرف.</p>
        <label>كلمة المرور الجديدة${passwordField({ name: "newPassword", autocomplete: "new-password", minlength: "8", required: true })}</label>
        <label>تأكيد كلمة المرور الجديدة${passwordField({ name: "confirmPassword", autocomplete: "new-password", minlength: "8", required: true })}</label>
=======
      <form class="employee-card full" id="recovery-password-form">
        <h2>تعيين كلمة مرور جديدة</h2>
        <p>تم فتح رابط استعادة كلمة المرور. اكتب كلمة مرور جديدة لا تقل عن 8 أحرف.</p>
        <label>كلمة المرور الجديدة<input type="password" name="newPassword" autocomplete="new-password" minlength="8" required /></label>
        ${passwordStrengthMarkup()}
        <label>تأكيد كلمة المرور الجديدة<input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" required /></label>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
        <button class="button primary full" type="submit">حفظ كلمة المرور الجديدة</button>
      </form>
    </section>
  `, "استعادة كلمة المرور", "تعيين كلمة مرور جديدة بعد فتح رابط الاستعادة.");
<<<<<<< HEAD
=======
  bindPasswordStrength(app.querySelector("#recovery-password-form"));
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  app.querySelector("#recovery-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    if (values.newPassword !== values.confirmPassword) { setMessage("", "تأكيد كلمة المرور غير مطابق."); return renderRecoveryPassword(); }
    try {
      await endpoints.changePassword({ ...values, recoveryMode: true });
      state.recoveryMode = false;
      setMessage("تم حفظ كلمة المرور الجديدة. يمكنك استخدام الحساب الآن.", "");
      location.hash = "profile";
      renderProfile();
    } catch (error) {
      setMessage("", error.message || "تعذر حفظ كلمة المرور الجديدة.");
      renderRecoveryPassword();
    }
  });
}

async function renderHome() {
  const [events, leaves, notifications, missions, tasks, documents, liveRequests, actionCenter] = await Promise.all([
    endpoints.myAttendanceEvents().then(unwrap).catch(() => []),
    endpoints.leaves().then(unwrap).catch(() => []),
    endpoints.notifications().then(unwrap).catch(() => []),
    endpoints.missions().then(unwrap).catch(() => []),
    endpoints.myTasks().then(unwrap).catch(() => []),
    endpoints.myDocuments().then(unwrap).catch(() => []),
    endpoints.myLiveLocationRequests().then(unwrap).catch(() => []),
    endpoints.myActionCenter().then(unwrap).catch(() => ({ actions: [] })),
  ]);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
<<<<<<< HEAD
  const myEvents = await enrichRecordsWithPlaceNames(events.filter((event) => !employeeId || event.employeeId === employeeId), 5);
=======
  const myEvents = events.filter((event) => !employeeId || event.employeeId === employeeId);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  const todayEvents = myEvents.filter((event) => String(event.eventAt || event.createdAt || "").startsWith(todayIso()));
  const pendingLeaves = leaves.filter((item) => item.employeeId === employeeId && item.status === "PENDING").length;
  const pendingMissions = missions.filter((item) => item.employeeId === employeeId && item.status === "PENDING").length;
  const unread = notifications.filter((item) => !item.isRead && (!item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id)).length;
  const pendingLive = (liveRequests || []).filter((item) => item.status === "PENDING" && (!employeeId || item.employeeId === employeeId)).length;
  const employee = employeeSubject();
  const lastEvent = myEvents[0];
<<<<<<< HEAD
  const notificationPrompt = ("Notification" in window) && Notification.permission !== "granted";
  const notificationPromptHtml = notificationPrompt ? '<article class="status-strip urgent"><span class="status-dot warning"></span><div><strong>فعّل إشعارات الموبايل</strong><span>لتظهر طلبات الموقع والتذكير بالبصمة وقرارات الإدارة على شاشة الهاتف عند دعم المتصفح.</span></div><button class="button primary" data-enable-notifications>تفعيل الإشعارات</button></article>' : "";
  rememberAndNotify([
    ...(liveRequests || []).filter((item) => item.status === "PENDING").map((item) => ({ ...item, title: "طلب موقع مباشر", body: item.reason || "الإدارة تطلب إرسال موقعك الآن.", route: "location" })),
    ...(notifications || []).filter((item) => !item.isRead),
  ]);
  shell(`
    <section class="employee-grid">
      ${notificationPromptHtml}
=======
  shell(`
    <section class="employee-grid">
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      <article class="employee-hero-card">
        <div class="person-cell large">${avatar(employee, "large")}<span><strong>${escapeHtml(greeting())}، ${escapeHtml(employee.fullName || state.user?.fullName || "أهلًا")}</strong><small>${escapeHtml(employee.jobTitle || "جاهز لبدء يومك")}</small></span></div>
        <p>كل ما تحتاجه يوميًا في شاشة واحدة: بصمة، موقع، إجازة، شكوى، وإشعارات.</p>
        <div class="hero-meta"><span class="hero-chip">${escapeHtml(fullDateText())}</span><span class="hero-chip">الساعة ${escapeHtml(timeNowText())}</span><span class="hero-chip">جاهز للتسجيل</span></div>
        <div class="employee-actions-row"><button class="button primary" data-route="punch">تسجيل بصمة الآن</button><button class="button ghost" data-route="location">إرسال موقعي</button></div>
      </article>
<<<<<<< HEAD
      ${metricCard("بصمات اليوم", todayEvents.length, "حضور / انصراف")}
      ${metricCard("طلبات معلقة", pendingLeaves + pendingMissions, "إجازات ومأموريات")}
      ${metricCard("مهام مفتوحة", tasks.filter((task) => task.status !== "DONE").length, "تكليفات حالية")}
      ${metricCard("إشعارات جديدة", unread, "غير مقروءة")}
      ${metricCard("طلبات موقع", pendingLive, "تحتاج رد سريع")}
      ${metricCard("مطلوب مني", (actionCenter.actions || []).length, "إجراءات حالية")}
=======
      <div class="compact-metrics-grid">
        ${compactMetric("بصمات اليوم", todayEvents.length, "👁", "punch")}
        ${compactMetric("طلبات معلقة", pendingLeaves + pendingMissions, "🏖", "requests")}
        ${compactMetric("مهام مفتوحة", tasks.filter((task) => task.status !== "DONE").length, "✅", "tasks")}
        ${compactMetric("إشعارات", unread, "🔔", "notifications")}
        ${compactMetric("طلب موقع", pendingLive, "📍", "location")}
        ${compactMetric("مطلوب مني", (actionCenter.actions || []).length, "⚡", "action-center")}
      </div>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      ${pendingLive ? `<article class="status-strip urgent"><span class="status-dot danger"></span><div><strong>الإدارة طلبت موقعك المباشر الآن</strong><span>افتح صفحة الموقع للقبول أو الرفض مع السبب.</span></div><button class="button primary" data-route="location">الرد على الطلب</button></article>` : ""}
      <article class="status-strip">
        <span class="status-dot ${lastEvent?.status === "REJECTED" ? "danger" : todayEvents.length ? "" : "warning"}"></span>
        <div><strong>${todayEvents.length ? "لديك حركة مسجلة اليوم" : "لم تسجل بصمة اليوم بعد"}</strong><span>${lastEvent ? `آخر حركة: ${statusLabel(lastEvent.type)} — ${date(lastEvent.eventAt || lastEvent.createdAt)}` : "ابدأ يومك من زر البصمة."}</span></div>
        <button class="button ghost" data-route="punch">فتح البصمة</button>
      </article>
      <div class="quick-action-grid">
<<<<<<< HEAD
        ${actionCard("action-center", "★", "مطلوب مني", "إجراءات عاجلة")}
        ${actionCard("punch", "◉", "البصمة", "حضور أو انصراف")}
        ${actionCard("location", "⌖", "الموقع", "إرسال اللوكيشن")}
        ${actionCard("leaves", "✦", "الإجازة", "طلب ومتابعة")}
        ${actionCard("missions", "⇄", "مأمورية", "طلب اعتماد")}
        ${actionCard("requests", "☰", "طلباتي", "كل الطلبات")}
        ${actionCard("tasks", "✓", "مهامي", "تكليفات يومية")}
        ${actionCard("daily-report", "✎", "تقريري اليومي", "إنجازات وعوائق")}
        ${actionCard("documents", "▣", "مستنداتي", "ملفات وتنبيهات")}
        ${actionCard("notifications", "●", "الإشعارات", "تنبيهات الإدارة")}
        ${actionCard("disputes", "!", "شكوى", "رفع للجنة")}
=======
        ${actionCard("punch", "🔘", "البصمة", "حضور/انصراف")}
        ${actionCard("location", "📍", "الموقع", "إرسال لوكيشن")}
        ${actionCard("leaves", "🏖", "الإجازات", "طلب ومتابعة")}
        ${actionCard("missions", "🚀", "المأمورية", "مهام خارجية")}
        ${actionCard("tasks", "📋", "مهامي", "قائمة العمل")}
        ${actionCard("kpi", "📊", "الأداء", "تقييمي KPI")}
        ${actionCard("daily-report", "📝", "التقرير", "إنجاز يومي")}
        ${actionCard("documents", "📁", "ملفاتي", "مستندات")}
        ${actionCard("action-center", "⚡", "المطلوب", "إجراءات عاجلة")}
        ${actionCard("notifications", "🔔", "تنبيهات", "إشعارات")}
        ${actionCard("disputes", "⚖", "شكوى", "تظلم")}
        ${actionCard("requests", "☰", "الطلبات", "سجل كامل")}
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      </div>
      <article class="employee-card full"><h2>آخر بصماتي</h2>${renderEventList(myEvents.slice(0, 5))}</article>
      <article class="employee-card full"><h2>آخر طلباتي</h2>${renderRequestList([...leaves, ...missions].filter((item) => item.employeeId === employeeId).slice(0, 6))}</article>
      <article class="employee-card full"><h2>آخر مهامي</h2>${tasks.length ? `<div class="employee-list">${tasks.slice(0, 4).map((task) => `<div class="employee-list-item"><div><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.description || "")}</span></div><div class="list-item-side">${badge(task.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد مهام حالية.</div>`}</article>
    </section>
  `, "الرئيسية", "ملخص سريع ومختصر لحسابك اليوم.");
}

function renderEventList(events = []) {
  if (!events.length) return `<div class="empty-state">لا توجد بصمات مسجلة بعد.</div>`;
<<<<<<< HEAD
  return `<div class="employee-list">${events.map((event) => {
    const mapUrl = event.latitude != null && event.longitude != null ? `https://www.google.com/maps?q=${encodeURIComponent(event.latitude)},${encodeURIComponent(event.longitude)}` : "";
    return `<div class="employee-list-item punch-history-item"><div><strong>${statusLabel(event.type)}</strong><span>${date(event.eventAt || event.createdAt)}</span><small>${escapeHtml(eventLocationDetails(event) || event.notes || event.source || "")}</small></div><div class="list-item-side">${badge(event.geofenceStatus || event.status || "")}${mapUrl ? `<a class="button ghost small" target="_blank" rel="noopener" href="${mapUrl}">خريطة</a>` : ""}</div></div>`;
  }).join("")}</div>`;
=======
  return `<div class="employee-list">${events.map((event) => `<div class="employee-list-item"><div><strong>${statusLabel(event.type)}</strong><span>${date(event.eventAt || event.createdAt)}</span><small>${escapeHtml(event.notes || event.source || "")}</small></div><div class="list-item-side">${badge(event.geofenceStatus || event.status || "")}</div></div>`).join("")}</div>`;
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}

async function renderActionCenter() {
  const data = await endpoints.myActionCenter().then(unwrap).catch(() => ({ actions: [] }));
  const actions = data.actions || [];
  shell(`
    <section class="employee-grid">
      <article class="employee-card full ${actions.length ? 'urgent-card' : ''}">
        <div class="panel-kicker">مطلوب مني الآن</div>
        <h2>${actions.length ? `لديك ${actions.length} إجراء مطلوب` : 'لا توجد إجراءات مطلوبة'}</h2>
        <p>هذه الصفحة تجمع المطلوب منك بدل البحث داخل الصفحات: طلب موقع، سياسة، مهمة، مستند، أو بصمة تحتاج متابعة.</p>
      </article>
      ${actions.length ? actions.map((item) => `
        <article class="employee-card full">
          <div class="panel-kicker">${escapeHtml(item.type || 'ACTION')} — ${escapeHtml(item.severity || '')}</div>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.body || '')}</p>
          <button class="button primary" data-route="${escapeHtml(item.route || 'home')}">فتح الإجراء</button>
        </article>
      `).join('') : `<article class="employee-card full"><div class="empty-state">كل شيء مكتمل حاليًا. تابع الإشعارات والمهام يوميًا.</div></article>`}
    </section>
  `, "مطلوب مني الآن", "مركز الإجراءات العاجلة للموظف.");
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
    shell(`<section class="employee-card"><h2>لا يمكن فتح البصمة</h2><p>${escapeHtml(error.message || "الحساب غير مرتبط بموظف.")}</p></section>`, "البصمة", "يلزم ربط الحساب بموظف.");
    return;
  }
  const employee = address.employee || state.user?.employee || {};
  const branchName = address.branch?.name || address.branchName || address.locationName || "الفرع";
<<<<<<< HEAD
  events = await enrichRecordsWithPlaceNames(events, 8);
=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  shell(`
    <section class="employee-grid punch-mobile">
      <article class="employee-card full">
        <div class="punch-focus">
          <div>
            <div class="person-cell large">${avatar(employee, "large")}<span><strong>${escapeHtml(employee.fullName || state.user?.fullName || "الموظف")}</strong><small>${escapeHtml(employee.jobTitle || "جاهز للتسجيل")}</small></span></div>
<<<<<<< HEAD
            <div class="step-list"><span class="step-item"><b>1</b>تأكيد الحساب</span><span class="step-item"><b>2</b>قراءة GPS</span><span class="step-item"><b>3</b>حفظ الحركة</span></div>
=======
            <div class="step-list"><span class="step-item"><b>1</b>بصمة الجهاز</span><span class="step-item"><b>2</b>قراءة GPS</span><span class="step-item"><b>3</b>حفظ الحركة</span></div>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
          </div>
          <div class="punch-orb">◉</div>
        </div>
        <div class="gps-panel"><span class="feature-icon">⌖</span><div><strong>${escapeHtml(branchName)}</strong><span>النطاق: ${escapeHtml(address.radiusMeters || 300)} متر — أقصى دقة GPS: ${escapeHtml(address.maxAccuracyMeters || 500)} متر</span></div></div>
        <label>ملاحظات اختيارية<input id="punch-notes" placeholder="مثال: من البوابة الرئيسية" /></label>
<<<<<<< HEAD
        <div class="biometric-box"><strong>تسجيل سريع</strong><p>لن تظهر نافذة مفتاح مرور أثناء تسجيل الحضور. سيتم قراءة GPS ثم حفظ الحركة مباشرة.</p></div>
=======
        <div class="biometric-box"><strong>التحقق الإجباري: بصمة الإصبع / Passkey</strong><p>عند تسجيل الحضور أو الانصراف سيطلب التطبيق بصمة الجهاز أولًا، ثم يقرأ GPS، ثم يحفظ الحركة والموقع.</p><button class="button ghost" type="button" data-register-passkey>تسجيل/تحديث بصمة الجهاز</button></div>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
        <div class="employee-actions-stack punch-buttons">
          <button class="button primary" data-punch="checkIn">بصمة حضور</button>
          <button class="button" data-punch="checkOut">بصمة انصراف</button>
          <button class="button ghost" data-test-location>اختبار GPS</button>
        </div>
        <div id="punch-result" class="risk-box hidden"></div>
      </article>
      <article class="employee-card full"><h2>آخر بصماتي</h2>${renderEventList(events.slice(0, 8))}</article>
    </section>
<<<<<<< HEAD
  `, "البصمة", "تسجيل سريع بدون سيلفي أو نافذة Passkey.");

  const resultBox = app.querySelector("#punch-result");
=======
  `, "البصمة", "تسجيل حضور وانصراف ببصمة الجهاز + GPS.");

  const resultBox = app.querySelector("#punch-result");
  app.querySelector("[data-register-passkey]")?.addEventListener("click", async () => {
    try {
      await registerBrowserPasskey();
      setMessage("تم تسجيل بصمة الجهاز/Passkey بنجاح.", "");
    } catch (error) {
      setMessage("", error.message);
    }
  });
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  const showResult = (title, evaluation = {}, error = false) => {
    const status = String(evaluation.geofenceStatus || "");
    const outside = ["outside_branch", "location_low_accuracy", "permission_denied", "location_unavailable"].includes(status);
    const inside = status === "inside_branch" || status === "inside_branch_low_accuracy";
    const distance = evaluation.distanceFromBranchMeters ?? evaluation.distanceMeters;
    const mapUrl = evaluation.latitude != null && evaluation.longitude != null ? `https://www.google.com/maps?q=${encodeURIComponent(evaluation.latitude)},${encodeURIComponent(evaluation.longitude)}` : "";
    const statusTitle = inside ? "داخل المجمع" : outside ? "خارج المجمع" : "حالة الموقع";
    resultBox.classList.remove("hidden");
    resultBox.classList.toggle("danger-box", Boolean(error || outside));
    resultBox.classList.toggle("inside-box", Boolean(inside && !error));
    resultBox.innerHTML = `
<<<<<<< HEAD
      <div class="punch-result-head"><strong>${escapeHtml(title)}</strong><span class="punch-location-status ${outside || error ? "outside" : inside ? "inside" : ""}">${escapeHtml(statusTitle)}</span></div>
      <p>${escapeHtml(geofenceMessageAr(evaluation))}</p>
      ${evaluation.placeName ? `<p>المكان الحالي: ${escapeHtml(evaluation.placeName)}</p>` : `<p>تعذر جلب اسم المكان التفصيلي من خدمة الخرائط. جرّب مرة أخرى بعد ثوانٍ مع تشغيل GPS عالي الدقة.</p>`}
      ${distance != null ? `<p>يبعد عن المجمع: ${escapeHtml(formatMeters(distance))}</p>` : ""}
      ${evaluation.accuracyMeters != null ? `<p>دقة GPS: ${escapeHtml(formatMeters(evaluation.accuracyMeters))}</p>` : ""}
      ${address.address ? `<p>موقع البصمة المعتمد: ${escapeHtml(address.address)}</p>` : ""}
=======
      <strong>${escapeHtml(title)} - ${statusTitle}</strong>
      <p>${escapeHtml(evaluation.message || evaluation.blockReason || "")}</p>
      ${evaluation.placeName ? `<p>المكان الحالي: ${escapeHtml(evaluation.placeName)}</p>` : ""}
      ${distance != null ? `<p>يبعد عن المجمع: ${escapeHtml(Math.round(Number(distance)))} متر</p>` : ""}
      ${evaluation.accuracyMeters != null ? `<p>دقة GPS: ${escapeHtml(evaluation.accuracyMeters)} متر</p>` : ""}
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      ${mapUrl ? `<a class="button ghost map-link" target="_blank" rel="noopener" href="${mapUrl}">فتح المكان على الخريطة</a>` : ""}
    `;
  };
  const logRejected = async (action, current = {}, evaluation = {}, reason = "") => {
    try {
      await endpoints.recordPunchRejection({ employeeId: employee.id, action, ...current, geofenceStatus: evaluation.geofenceStatus || "REJECTED", distanceFromBranchMeters: evaluation.distanceFromBranchMeters ?? evaluation.distanceMeters ?? null, blockReason: reason || evaluation.blockReason || evaluation.message || "تم رفض البصمة", notes: app.querySelector("#punch-notes")?.value || "" });
    } catch (logError) { console.warn("تعذر تسجيل محاولة الرفض", logError); }
  };
  const readAndEvaluate = async () => {
    resultBox.classList.remove("hidden");
    resultBox.classList.remove("danger-box");
<<<<<<< HEAD
      resultBox.textContent = "الخطوة 2 من 3: جاري قراءة GPS بدقة عالية...";
    const current = await getBrowserLocation();
    if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع. فعّل GPS واسمح للتطبيق بالوصول للموقع.");
    const evaluation = await endpoints.evaluateGeofence({ employeeId: employee.id, ...current }).then(unwrap);
    evaluation.latitude = current.latitude;
    evaluation.longitude = current.longitude;
=======
    resultBox.textContent = "الخطوة 2 من 3: جاري تحديد الموقع بدقة عالية (انتظر للحصول على أفضل قراءة)...";
    const current = await getBrowserLocation();
    if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع. فعّل GPS واسمح للتطبيق بالوصول للموقع.");
    if (current.locationError) throw new Error(current.locationError);
    resultBox.textContent = "جاري التحقق من النطاق الجغرافي...";
    const evaluation = await endpoints.evaluateGeofence({ employeeId: employee.id, ...current }).then(unwrap);
    evaluation.latitude = current.latitude;
    evaluation.longitude = current.longitude;
    resultBox.textContent = "جاري جلب اسم المكان...";
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    evaluation.placeName = await reverseGeocode(current.latitude, current.longitude);
    return { current, evaluation };
  };
  app.querySelector("[data-test-location]")?.addEventListener("click", async () => {
    try { const { evaluation } = await readAndEvaluate(); showResult("نتيجة اختبار GPS", evaluation, !evaluation.allowed); } catch (error) { showResult("تعذر اختبار GPS", { message: friendlyError(error) }, true); }
  });
  app.querySelectorAll("[data-punch]").forEach((button) => button.addEventListener("click", async () => {
    if (button.disabled) return;
    const originalHtml = button.innerHTML;
    try {
      app.querySelectorAll("[data-punch]").forEach((item) => { item.disabled = true; });
      button.innerHTML = "جاري التسجيل...";
      resultBox.classList.remove("hidden");
      resultBox.classList.remove("danger-box");
<<<<<<< HEAD
      resultBox.textContent = "الخطوة 1 من 3: تم تأكيد الحساب من جلسة تسجيل الدخول...";
      const { current, evaluation } = await readAndEvaluate();
      resultBox.textContent = "الخطوة 3 من 3: جاري حفظ حركة الحضور أو الانصراف...";
      const body = { ...current, notes: app.querySelector("#punch-notes")?.value || "", verificationStatus: "verified", biometricMethod: "session_gps" };
=======
      resultBox.textContent = "الخطوة 1 من 3: جاري تأكيد بصمة الجهاز...";
      const passkeyCredentialId = await requestBrowserPasskeyForAction("تسجيل البصمة");
      const { current, evaluation } = await readAndEvaluate();
      resultBox.textContent = "الخطوة 3 من 3: جاري حفظ حركة الحضور أو الانصراف...";
      const body = { ...current, notes: app.querySelector("#punch-notes")?.value || "", verificationStatus: "verified", biometricMethod: "passkey", passkeyCredentialId };
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      const response = button.dataset.punch === "checkIn" ? await endpoints.selfCheckIn(body) : await endpoints.selfCheckOut(body);
      const savedEvaluation = { ...evaluation, ...(response.evaluation || {}), placeName: evaluation.placeName, latitude: current.latitude, longitude: current.longitude };
      showResult(button.dataset.punch === "checkIn" ? "تم تسجيل الحضور" : "تم تسجيل الانصراف", savedEvaluation, false);
      setMessage(button.dataset.punch === "checkIn" ? "تم حفظ بصمة الحضور." : "تم حفظ بصمة الانصراف.", "");
<<<<<<< HEAD
=======
      haptic([30, 50, 80]);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      window.setTimeout(render, 800);
    } catch (error) {
      await logRejected(button.dataset.punch, {}, { message: error.message }, error.message);
      showResult("تعذر تسجيل البصمة", { message: friendlyError(error) }, true);
<<<<<<< HEAD
=======
      haptic([200, 100, 200]);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    } finally {
      app.querySelectorAll("[data-punch]").forEach((item) => { item.disabled = false; });
      button.innerHTML = originalHtml;
    }
  }));
}

async function renderLocation() {
  const [rows, liveRequests] = await Promise.all([
    endpoints.locations().then(unwrap).catch(() => []),
    endpoints.myLiveLocationRequests().then(unwrap).catch(() => []),
    endpoints.myActionCenter().then(unwrap).catch(() => ({ actions: [] })),
  ]);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
<<<<<<< HEAD
  const mine = await enrichRecordsWithPlaceNames(rows.filter((item) => !item.employeeId || item.employeeId === employeeId).slice(0, 20), 10);
=======
  const mine = rows.filter((item) => !item.employeeId || item.employeeId === employeeId).slice(0, 20);
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  const pending = liveRequests.filter((item) => item.status === "PENDING").slice(0, 5);
  shell(`
    <section class="employee-grid">
      ${pending.length ? `<article class="employee-card full urgent-card"><div class="panel-kicker">إجراء مطلوب</div><h2>طلبات موقع مباشر من الإدارة</h2><p>شارك موقعك الحالي فقط عند موافقتك. يتم تسجيل الطلب والرد في سجل النظام.</p><div class="employee-list">${pending.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.requestedByName || "الإدارة")}</strong><span>${escapeHtml(item.reason || "طلب موقع مباشر")}</span><small>ينتهي: ${escapeHtml(date(item.expiresAt))}</small></div><div class="list-item-side"><button class="button primary" data-live-send="${escapeHtml(item.id)}">إرسال موقعي</button><button class="button ghost" data-live-reject="${escapeHtml(item.id)}">رفض</button></div></div>`).join("")}</div></article>` : ""}
      <article class="employee-card full">
        <div class="panel-kicker">موقع مباشر</div>
        <h2>إرسال موقعي الحالي</h2>
        <p>استخدم هذا الزر لإرسال موقعك الحالي طوعًا أو عند وجود طلب من الإدارة. لا يوجد تتبع مستمر في الخلفية.</p>
        <button class="button primary full" data-send-location>إرسال موقعي الآن</button>
        <div id="location-result" class="risk-box hidden"></div>
      </article>
<<<<<<< HEAD
      <article class="employee-card full"><h2>سجل المواقع والطلبات</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => {
        const placeName = recordPlaceName(item);
        const mapUrl = item.latitude && item.longitude ? `https://www.google.com/maps?q=${escapeHtml(item.latitude)},${escapeHtml(item.longitude)}` : "";
        return `<div class="employee-list-item"><div><strong>${statusLabel(item.status)}</strong><span>${date(item.requestedAt || item.date || item.createdAt)}</span><small>${escapeHtml(placeName || (mapUrl ? "اسم المكان غير متاح من خدمة الخرائط" : "لم يتم إرسال موقع بعد"))}</small></div><div class="list-item-side">${mapUrl ? `<a target="_blank" rel="noopener" class="button ghost" href="${mapUrl}">خريطة</a>` : badge(item.status || "PENDING")}</div></div>`;
      }).join("")}</div>` : `<div class="empty-state">لا توجد طلبات موقع بعد.</div>`}</article>
=======
      <article class="employee-card full"><h2>سجل المواقع والطلبات</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${statusLabel(item.status)}</strong><span>${date(item.requestedAt || item.date || item.createdAt)}</span><small>${item.latitude && item.longitude ? `${escapeHtml(item.latitude)} , ${escapeHtml(item.longitude)}` : "لم يتم إرسال إحداثيات بعد"}</small></div><div class="list-item-side">${item.latitude && item.longitude ? `<a target="_blank" rel="noopener" class="button ghost" href="https://www.google.com/maps?q=${escapeHtml(item.latitude)},${escapeHtml(item.longitude)}">خريطة</a>` : badge(item.status || "PENDING")}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد طلبات موقع بعد.</div>`}</article>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      <article class="employee-card full"><h2>طلبات الموقع المباشر</h2>${liveRequests.length ? `<div class="employee-list">${liveRequests.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.requestedByName || "الإدارة")}</strong><span>${escapeHtml(item.reason || "طلب موقع")}</span><small>${escapeHtml(date(item.createdAt))}</small></div><div class="list-item-side">${badge(item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد طلبات مباشرة.</div>`}</article>
    </section>
  `, "الموقع", "مشاركة الموقع المباشر بموافقة الموظف عند الطلب.");
  const result = app.querySelector("#location-result");
  const sendLive = async (id) => {
    result?.classList.remove("hidden", "danger-box");
<<<<<<< HEAD
    if (result) result.textContent = "جاري قراءة الموقع بدقة عالية...";
    const current = await getBrowserLocation();
    if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع. فعّل GPS واسمح للتطبيق بالوصول للموقع.");
    current.placeName = await reverseGeocode(current.latitude, current.longitude);
    await endpoints.respondLiveLocationRequest(id, { status: "APPROVED", ...current });
=======
    if (result) result.textContent = "جاري تأكيد بصمة الجهاز قبل إرسال الموقع...";
    const passkeyCredentialId = await requestBrowserPasskeyForAction("إرسال الموقع");
    if (result) result.textContent = "جاري قراءة الموقع بدقة عالية...";
    const current = await getBrowserLocation();
    if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع. فعّل GPS واسمح للتطبيق بالوصول للموقع.");
    await endpoints.respondLiveLocationRequest(id, { status: "APPROVED", ...current, biometricMethod: "passkey", passkeyCredentialId });
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  };
  app.querySelectorAll("[data-live-send]").forEach((button) => button.addEventListener("click", async () => {
    try { await sendLive(button.dataset.liveSend); setMessage("تم إرسال موقعك المباشر للإدارة.", ""); renderLocation(); } catch (error) { setMessage("", friendlyError(error, "تعذر إرسال الموقع.")); renderLocation(); }
  }));
  app.querySelectorAll("[data-live-reject]").forEach((button) => button.addEventListener("click", async () => {
<<<<<<< HEAD
    const reason = prompt("اكتب سبب رفض إرسال الموقع", "غير متاح الآن") || "غير متاح الآن";
=======
    const reason = await askText({ title: "رفض إرسال الموقع", message: "اكتب سبب رفض إرسال الموقع حتى يظهر للإدارة.", defaultValue: "غير متاح الآن", confirmLabel: "إرسال الرفض" });
    if (reason === null) return;
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    try { await endpoints.respondLiveLocationRequest(button.dataset.liveReject, { status: "REJECTED", reason }); setMessage("تم إرسال سبب الرفض للإدارة.", ""); renderLocation(); } catch (error) { setMessage("", error.message || "تعذر حفظ الرد."); renderLocation(); }
  }));
  app.querySelector("[data-send-location]")?.addEventListener("click", async () => {
    try {
      result?.classList.remove("hidden", "danger-box");
<<<<<<< HEAD
      if (result) result.textContent = "جاري قراءة الموقع...";
      const current = await getBrowserLocation();
      if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع.");
      current.placeName = await reverseGeocode(current.latitude, current.longitude);
      const pendingLocationRequest = mine.find((item) => item.status === "PENDING" && item.id && String(item.id).startsWith("locreq"));
      if (pendingLocationRequest) await endpoints.updateLocationRequest(pendingLocationRequest.id, { status: "APPROVED", ...current });
      else await endpoints.recordLocation({ employeeId, source: "employee_app", status: "ACTIVE", ...current });
=======
      if (result) result.textContent = "جاري تأكيد بصمة الجهاز قبل إرسال الموقع...";
      const passkeyCredentialId = await requestBrowserPasskeyForAction("إرسال الموقع");
      if (result) result.textContent = "جاري قراءة الموقع...";
      const current = await getBrowserLocation();
      if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع.");
      const pendingLocationRequest = mine.find((item) => item.status === "PENDING" && item.id && String(item.id).startsWith("locreq"));
      if (pendingLocationRequest) await endpoints.updateLocationRequest(pendingLocationRequest.id, { status: "APPROVED", ...current, biometricMethod: "passkey", passkeyCredentialId });
      else await endpoints.recordLocation({ employeeId, source: "employee_app", status: "ACTIVE", ...current, biometricMethod: "passkey", passkeyCredentialId });
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      setMessage("تم إرسال موقعك الحالي بنجاح.", "");
      renderLocation();
    } catch (error) {
      if (result) { result.classList.remove("hidden"); result.classList.add("danger-box"); result.textContent = friendlyError(error, "تعذر إرسال الموقع."); }
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
        <div class="panel-kicker">طلب جديد</div>
        <h2>طلب إجازة</h2>
        <div class="employee-form-grid">
          <label>نوع الإجازة<select name="leaveType"><option>اعتيادية</option><option>مرضية</option><option>طارئة</option></select></label>
          <label>من تاريخ<input type="date" name="startDate" required /></label>
          <label>إلى تاريخ<input type="date" name="endDate" required /></label>
          <label class="span-2">السبب<textarea name="reason" rows="3" required></textarea></label>
        </div>
        <button class="button primary full" type="submit">إرسال الطلب</button>
      </form>
      <article class="employee-card full"><h2>طلباتي</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.leaveType?.name || item.leaveType || "إجازة")}</strong><span>${escapeHtml(item.startDate || "-")} إلى ${escapeHtml(item.endDate || "-")}</span></div><div class="list-item-side">${badge(item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد طلبات إجازة.</div>`}</article>
    </section>
  `, "الإجازات", "تقديم طلب إجازة ومتابعة حالته.");
}

function renderRequestList(items = []) {
  if (!items.length) return `<div class="empty-state">لا توجد طلبات مسجلة بعد.</div>`;
  return `<div class="employee-list">${items.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.leaveType?.name || item.title || item.destinationName || "طلب")}</strong><span>${escapeHtml(item.startDate || item.plannedStart || item.createdAt || "-")} ${item.endDate || item.plannedEnd ? "إلى " + escapeHtml(item.endDate || item.plannedEnd) : ""}</span><small>${escapeHtml(item.reason || item.destinationName || item.purpose || "")}</small></div><div class="list-item-side">${badge(item.status)}</div></div>`).join("")}</div>`;
}

async function renderMissions() {
  const missions = await endpoints.missions().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = missions.filter((item) => !employeeId || item.employeeId === employeeId).slice(0, 30);
  shell(`
    <section class="employee-grid">
      <form class="employee-card full" data-ajax="mission">
        <h2>طلب مأمورية</h2>
        <p>اكتب تفاصيل المأمورية والوجهة وموعد البداية والنهاية ليتم اعتمادها من الإدارة.</p>
        <label>عنوان المأمورية<input name="title" required placeholder="مثال: زيارة حالة / توصيل مستندات" /></label>
        <label>الوجهة<input name="destinationName" required placeholder="اسم المكان أو العنوان" /></label>
        <label>بداية المأمورية<input name="plannedStart" type="datetime-local" required /></label>
        <label>نهاية المأمورية<input name="plannedEnd" type="datetime-local" required /></label>
        <div class="employee-actions-stack"><button class="button primary">إرسال الطلب</button></div>
      </form>
      <article class="employee-card full"><h2>مأمورياتي</h2>${renderRequestList(mine)}</article>
    </section>
  `, "المأموريات", "طلب ومتابعة المأموريات المعتمدة.");
}

async function renderDisputes() {
  const payload = await endpoints.disputes().then(unwrap).catch(() => ({ cases: [] }));
  const cases = Array.isArray(payload) ? payload : (payload.cases || []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = cases.filter((item) => !item.employeeId || item.employeeId === employeeId).slice(0, 20);
  shell(`
    <section class="employee-grid">
      <form class="employee-card full" data-ajax="dispute">
        <div class="panel-kicker">لجنة حل المشاكل</div>
        <h2>تقديم شكوى / فض خلاف</h2>
<<<<<<< HEAD
        <p>يتم إخطار أبو عمار وياسر فتحي وبلال الشاكر ويحيى جمال والشيخ محمد فورًا، ثم يتم التنسيق أو التصعيد عبر السكرتير التنفيذي يحيى السبع.</p>
=======
        <p>يتم إخطار مدير مباشر ثالث ومدير مباشر ثانٍ ومدير مباشر أول والسكرتير التنفيذي والمدير التنفيذي فورًا، ثم يتم التنسيق أو التصعيد عبر السكرتير التنفيذي.</p>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
        <div class="employee-form-grid">
          <label class="span-2">عنوان مختصر<input name="title" required placeholder="مثال: شكوى بخصوص موقف معين" /></label>
          <label class="span-2">السبب والتفاصيل<textarea name="description" rows="5" required></textarea></label>
        </div>
        <button class="button primary full" type="submit">رفع إلى اللجنة</button>
      </form>
      <article class="employee-card full"><h2>طلباتي السابقة</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${date(item.createdAt)}</span></div><div class="list-item-side">${badge(item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد شكاوى مسجلة.</div>`}</article>
    </section>
  `, "الشكاوى", "طلب شكوى أو فض خلاف.");
}


<<<<<<< HEAD
=======
async function renderKpi() {
  const payload = await endpoints.kpi().then(unwrap).catch(() => ({ metrics: [], evaluations: [], pendingEmployees: [], currentEmployeeId: state.user?.employeeId || state.user?.employee?.id || "" }));
  const employeeId = state.user?.employeeId || state.user?.employee?.id || payload.currentEmployeeId || "";
  const mine = (payload.evaluations || []).find((item) => item.employeeId === employeeId) || {};
  const cycle = payload.cycle || {};
  const windowInfo = payload.windowInfo || cycle.window || {};
  shell(`
    <section class="employee-grid">
      <article class="employee-card full accent-card">
        <div class="panel-kicker">KPI شهري</div>
        <h2>نموذج التقييم الذاتي</h2>
        <p>املأ البنود الخاصة بك فقط بعد جلسة التقييم مع مديرك المباشر. بنود الحضور والانصراف، الصلاة في المسجد، وحضور حلقة الشيخ وليد يوسف الأسبوعية لتدريس القرآن والتجويد يضيفها HR فقط.</p>
        <div class="employee-actions-row"><span class="login-feature">الدورة: ${escapeHtml(cycle.name || cycle.id || "الشهر الحالي")}</span><span class="login-feature">نافذة التقييم: ${escapeHtml(windowInfo.label || "-")}</span><span class="login-feature">الحالة: ${badge(mine.status || "DRAFT")}</span><span class="login-feature">الإجمالي: ${escapeHtml(mine.totalScore || 0)}/100</span></div>
      </article>
      <form class="employee-card full" id="kpi-self-form">
        <div class="employee-form-grid">
          <label>تحقيق الأهداف / 40<input name="targetScore" type="number" min="0" max="40" step="0.5" value="${escapeHtml(mine.targetScore || 0)}" /></label>
          <label>الكفاءة في أداء المهام / 20<input name="efficiencyScore" type="number" min="0" max="20" step="0.5" value="${escapeHtml(mine.efficiencyScore || 0)}" /></label>
          <label>حسن التعامل والسلوك / 5<input name="conductScore" type="number" min="0" max="5" step="0.5" value="${escapeHtml(mine.conductScore || 0)}" /></label>
          <label>التبرعات والمبادرات / 5<input name="initiativesScore" type="number" min="0" max="5" step="0.5" value="${escapeHtml(mine.initiativesScore || 0)}" /></label>
          <div class="employee-card-subtle span-2"><strong>بنود HR فقط — 30 درجة</strong><p>الحضور والانصراف /20، الصلاة في المسجد /5، حضور حلقة الشيخ وليد يوسف الأسبوعية لتدريس القرآن والتجويد /5. تظهر لك بعد مراجعة HR ولا يمكنك تعديلها من تطبيق الموظف.</p></div>
          <label class="span-2">ملاحظاتي للمدير<textarea name="employeeNotes" rows="4">${escapeHtml(mine.employeeNotes || "")}</textarea></label>
        </div>
        <input type="hidden" name="employeeId" value="${escapeHtml(employeeId)}" />
        <input type="hidden" name="status" value="SELF_SUBMITTED" />
        <button class="button primary full" type="submit" ${windowInfo.isOpen === false ? "disabled" : ""}>رفع التقييم للمدير المباشر</button>
        ${windowInfo.isOpen === false ? `<p class="form-hint danger-text">${escapeHtml(windowInfo.message || "التقييم متاح فقط من يوم 20 إلى 25.")}</p>` : ""}
      </form>
      <article class="employee-card full"><h2>مسار الاعتماد</h2><div class="employee-list">
        ${["الموظف يرسل التقييم", "المدير المباشر يعتمد/يعدّل", "HR يضيف الحضور والانصراف والصلاة وحلقة القرآن والتجويد", "السكرتير التنفيذي يراجع ويرفع", "المدير التنفيذي يعتمد النتيجة النهائية"].map((step, index) => `<div class="employee-list-item"><div><strong>${index + 1}. ${escapeHtml(step)}</strong></div><div class="list-item-side">${index === 0 && mine.status ? badge(mine.status) : ""}</div></div>`).join("")}
      </div></article>
    </section>
  `, "تقييمي", "نموذج KPI الشهري الخاص بالموظف.");
  app.querySelector("#kpi-self-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await endpoints.saveKpiEvaluation(readForm(event.currentTarget));
      setMessage("تم رفع تقييمك للمدير المباشر بنجاح.", "");
      renderKpi();
    } catch (error) { setMessage("", error.message || "تعذر حفظ التقييم."); renderKpi(); }
  });
}

>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
async function renderRequests() {
  const summary = await endpoints.myRequests().then(unwrap).catch(() => ({ pending: 0, approved: 0, rejected: 0, latest: [] }));
  shell(`
    <section class="employee-grid">
      <article class="employee-card"><span class="panel-kicker">قيد المراجعة</span><strong class="big-number">${escapeHtml(summary.pending || 0)}</strong><p>طلبات تنتظر قرار الإدارة أو المدير المباشر.</p></article>
      <article class="employee-card"><span class="panel-kicker">مقبولة</span><strong class="big-number">${escapeHtml(summary.approved || 0)}</strong><p>طلبات تمت الموافقة عليها.</p></article>
      <article class="employee-card"><span class="panel-kicker">مرفوضة</span><strong class="big-number">${escapeHtml(summary.rejected || 0)}</strong><p>طلبات تم رفضها مع متابعة السبب.</p></article>
      <article class="employee-card full"><h2>آخر طلباتي</h2>${renderRequestList(summary.latest || [])}</article>
      <article class="employee-card full"><h2>إنشاء طلب سريع</h2><div class="employee-actions-row"><button class="button primary" data-route="leaves">طلب إجازة</button><button class="button ghost" data-route="missions">طلب مأمورية</button><button class="button ghost" data-route="disputes">شكوى/خلاف</button><button class="button ghost" data-route="location">إرسال موقع</button></div></article>
    </section>
  `, "طلباتي", "كل طلباتك وحالتها في شاشة واحدة.");
}

async function renderTasks() {
  const tasks = await endpoints.myTasks().then(unwrap).catch(() => []);
  shell(`
    <section class="employee-card full">
      <div class="panel-kicker">المهام</div>
      <h2>مهامي الحالية</h2>
      ${tasks.length ? `<div class="employee-list">${tasks.map((task) => `<div class="employee-list-item"><div><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.description || "")}</span><small>الأولوية: ${escapeHtml(statusLabel(task.priority))} — الاستحقاق: ${escapeHtml(task.dueDate || "-")}</small></div><div class="list-item-side">${badge(task.status)}${task.status !== "DONE" ? `<button class="button ghost small" data-task-done="${escapeHtml(task.id)}">تم</button>` : ""}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد مهام مكلف بها الآن.</div>`}
    </section>
  `, "مهامي", "تابع التكليفات اليومية وحدّث حالتها.");
  app.querySelectorAll("[data-task-done]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.updateTask(button.dataset.taskDone, { status: "DONE" });
    setMessage("تم تحديث المهمة.", "");
    renderTasks();
  }));
}

async function renderDailyReport() {
  const reports = await endpoints.myDailyReports().then(unwrap).catch(() => []);
  const today = new Date().toISOString().slice(0, 10);
  const todayReport = reports.find((row) => row.reportDate === today) || {};
  shell(
    `<section class="employee-grid">
<<<<<<< HEAD
      <article class="employee-card full accent-card"><h2>التقرير اليومي</h2><p>اكتب ما تم إنجازه اليوم، العوائق التي تحتاج دعمًا، وخطة الغد. يتم إرسال التقرير لمديرك ويحيى للمتابعة التشغيلية.</p></article>
=======
      <article class="employee-card full accent-card"><h2>التقرير اليومي</h2><p>اكتب ما تم إنجازه اليوم، العوائق التي تحتاج دعمًا، وخطة الغد. يتم إرسال التقرير لمديرك والسكرتير التنفيذي للمتابعة التشغيلية.</p></article>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      <article class="employee-card full">
        <form id="daily-report-form" class="employee-form">
          <label>تاريخ التقرير<input type="date" name="reportDate" value="${escapeHtml(todayReport.reportDate || today)}" required /></label>
          <label>ما تم إنجازه اليوم<textarea name="achievements" rows="4" required>${escapeHtml(todayReport.achievements || "")}</textarea></label>
          <label>العوائق أو المشاكل<textarea name="blockers" rows="3">${escapeHtml(todayReport.blockers || "")}</textarea></label>
          <label>خطة الغد<textarea name="tomorrowPlan" rows="3">${escapeHtml(todayReport.tomorrowPlan || "")}</textarea></label>
          <label>الدعم المطلوب<textarea name="supportNeeded" rows="2">${escapeHtml(todayReport.supportNeeded || "")}</textarea></label>
          <label>الحالة النفسية/ضغط العمل<select name="mood"><option value="NORMAL">طبيعي</option><option value="GOOD">جيد</option><option value="STRESSED">ضغط عالي</option><option value="NEEDS_SUPPORT">أحتاج دعم</option></select></label>
          <button class="button primary" type="submit">إرسال التقرير</button>
        </form>
      </article>
      <article class="employee-card full"><h2>تقاريري السابقة</h2>${reports.length ? `<div class="employee-list">${reports.slice(0, 20).map((report) => `<div class="employee-list-item"><div><strong>${escapeHtml(report.reportDate || "-")}</strong><span>${escapeHtml(report.achievements || "-")}</span><small>${escapeHtml(report.blockers ? `عوائق: ${report.blockers}` : "بدون عوائق")}</small></div><div class="list-item-side">${badge(report.status)}${report.managerComment ? `<small>${escapeHtml(report.managerComment)}</small>` : ""}</div></div>`).join("")}</div>` : `<div class="empty-state">لم ترسل تقارير يومية بعد.</div>`}</article>
    </section>`,
    "التقرير اليومي",
    "متابعة إنجازاتك واحتياجات الدعم.",
  );
  app.querySelector("#daily-report-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await endpoints.createDailyReport(readForm(event.currentTarget));
      setMessage("تم إرسال التقرير اليومي بنجاح.", "");
      renderDailyReport();
    } catch (error) { setMessage("", error.message); renderDailyReport(); }
  });
}

async function renderDocuments() {
  const docs = await endpoints.myDocuments().then(unwrap).catch(() => []);
  shell(`
    <section class="employee-card full">
      <div class="panel-kicker">المستندات</div>
      <h2>مستنداتي</h2>
      <p>راجع مستنداتك المسجلة، وفي حالة وجود مستند منتهي أو ناقص تواصل مع الإدارة.</p>
      ${docs.length ? `<div class="employee-list">${docs.map((doc) => `<div class="employee-list-item"><div><strong>${doc.fileUrl ? `<a href="${escapeHtml(doc.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(doc.title)}</a>` : escapeHtml(doc.title)}</strong><span>${escapeHtml(doc.documentType || "مستند")}</span><small>ينتهي: ${escapeHtml(doc.expiresOn || "-")} — ${escapeHtml(doc.notes || "")}</small></div><div class="list-item-side">${badge(doc.status || "ACTIVE")}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد مستندات مسجلة لك بعد.</div>`}
    </section>
  `, "مستنداتي", "أرشيف الملفات والتنبيهات الخاصة بك.");
}


async function renderPolicies() {
  const data = await endpoints.policies().then(unwrap).catch(() => ({ policies: [], summary: {} }));
  const policies = data.policies || [];
  shell(`
    <section class="employee-grid">
      <article class="employee-card full">
        <div class="panel-kicker">السياسات والتوقيعات</div>
        <h2>سياسات الجمعية</h2>
        <p>اقرأ كل سياسة واضغط تأكيد القراءة. هذا يساعد الإدارة على توثيق الالتزام الداخلي بدون ورق.</p>
      </article>
      ${policies.length ? policies.map((policy) => `
        <article class="employee-card full">
          <div class="panel-kicker">${escapeHtml(policy.category || "GENERAL")} — إصدار ${escapeHtml(policy.version || "1.0")}</div>
          <h2>${escapeHtml(policy.title)}</h2>
          <p>${escapeHtml(policy.body || "")}</p>
          <div class="employee-actions-row">
            ${policy.acknowledged ? `<span class="pill success">تم التأكيد ${escapeHtml(policy.acknowledgedAt ? date(policy.acknowledgedAt) : "")}</span>` : `<button class="button primary" data-ack-policy="${escapeHtml(policy.id)}">أؤكد القراءة والالتزام</button>`}
          </div>
        </article>
      `).join("") : `<article class="employee-card full"><div class="empty-state">لا توجد سياسات مطلوبة الآن.</div></article>`}
    </section>
  `, "السياسات", "قراءة وتوقيع سياسات الجمعية.");
  app.querySelectorAll("[data-ack-policy]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.acknowledgePolicy(button.dataset.ackPolicy);
    setMessage("تم تأكيد قراءة السياسة.", "");
    renderPolicies();
  }));
}

<<<<<<< HEAD
=======
async function renderAdminDecisions() {
  const data = await endpoints.adminDecisions().then(unwrap).catch(() => ({ decisions: [] }));
  const decisions = data.decisions || [];
  shell(`
    <section class="employee-grid">
      <article class="employee-card full">
        <div class="panel-kicker">القرارات الإدارية</div>
        <h2>سجل القرارات الرسمية</h2>
        <p>كل قرار يظهر هنا يحتاج تأكيد "تم الاطلاع" ليتم حفظ توقيت القراءة رسميًا.</p>
      </article>
      ${decisions.length ? decisions.map((decision) => `
        <article class="employee-card full decision-card ${decision.acknowledged ? 'is-acknowledged' : ''}">
          <div class="panel-kicker">${escapeHtml(decision.category || 'ADMINISTRATIVE')} — ${escapeHtml(decision.priority || 'MEDIUM')}</div>
          <h2>${escapeHtml(decision.title)}</h2>
          <p>${escapeHtml(decision.body || '')}</p>
          <small>تاريخ النشر: ${date(decision.publishedAt || decision.createdAt)}</small>
          <div class="employee-actions-row">
            ${decision.acknowledged ? `<span class="pill success">تم الاطلاع ${escapeHtml(decision.acknowledgedAt ? date(decision.acknowledgedAt) : '')}</span>` : `<button class="button primary" data-ack-decision="${escapeHtml(decision.id)}">تم الاطلاع</button>`}
          </div>
        </article>
      `).join('') : `<article class="employee-card full"><div class="empty-state">لا توجد قرارات إدارية مطلوبة الآن.</div></article>`}
    </section>
  `, "القرارات", "تأكيد الاطلاع على القرارات الرسمية.");
  app.querySelectorAll('[data-ack-decision]').forEach((button) => button.addEventListener('click', async () => {
    await endpoints.acknowledgeAdminDecision(button.dataset.ackDecision);
    setMessage('تم تسجيل اطلاعك على القرار.', '');
    renderAdminDecisions();
  }));
}

>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
async function renderNotifications() {
  const rows = await endpoints.notifications().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = rows.filter((item) => !item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id).slice(0, 50);
  shell(`
    <section class="employee-card full">
      <div class="panel-kicker">التنبيهات</div>
      <h2>الإشعارات</h2>
<<<<<<< HEAD
      ${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body || "")}</span><small>${date(item.createdAt)}</small></div><div class="list-item-side">${badge(item.status || (item.isRead ? "READ" : "UNREAD"))}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد إشعارات.</div>`}
    </section>
  `, "الإشعارات", "كل التنبيهات والطلبات المهمة.");
=======
      <div class="employee-actions-row"><button class="button ghost" data-enable-push>شرح وتفعيل إشعارات الموبايل</button></div>
      ${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body || "")}</span><small>${date(item.createdAt)}</small></div><div class="list-item-side">${badge(item.status || (item.isRead ? "READ" : "UNREAD"))}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد إشعارات.</div>`}
    </section>
  `, "الإشعارات", "كل التنبيهات والطلبات المهمة.");
  app.querySelector("[data-enable-push]")?.addEventListener("click", async () => {
    try {
      const ok = await confirmAction({ title: "تفعيل إشعارات الموبايل", message: "سنرسل لك فقط تنبيهات مهمة مثل تذكير البصمة، طلب إرسال الموقع، الإجازات، والقرارات الإدارية. يمكنك إيقافها من إعدادات المتصفح في أي وقت.", confirmLabel: "تفعيل الآن", cancelLabel: "لاحقًا" });
      if (!ok) return;
      await enableWebPushSubscription(endpoints);
      setMessage("تم تفعيل اشتراك Web Push الحقيقي لهذا الجهاز.", "");
      renderNotifications();
    } catch (error) {
      setMessage("", error.message);
      renderNotifications();
    }
  });
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
}

async function renderProfile() {
  const user = state.user || {};
  const employee = user.employee || {};
  shell(`
    <section class="employee-grid">
      <article class="employee-card full profile-card">
        <div class="profile-hero">
          <div class="person-cell large">${avatar(user, "large")}<span><strong>${escapeHtml(user.fullName || user.name || employee.fullName || "الموظف")}</strong><small>${escapeHtml(employee.jobTitle || "تطبيق الموظفين")}</small></span></div>
        </div>
        <dl class="profile-list">
          <div><dt>الموبايل</dt><dd>${escapeHtml(employee.phone || user.phone || "-")}</dd></div>
          <div><dt>المسمى الوظيفي</dt><dd>${escapeHtml(employee.jobTitle || "-")}</dd></div>
        </dl>
        <div class="employee-actions-stack"><button class="button danger" data-logout>خروج</button></div>
      </article>
      <form class="employee-card full" id="employee-contact-form">
        <div class="panel-kicker">قائمة التعديلات</div>
        <h2>تعديل الصورة والبريد ورقم الهاتف</h2>
        <p>الصورة تظهر داخل التطبيق. تحديث رقم الهاتف يساعدك على الدخول بالموبايل، وتغيير البريد قد يحتاج تأكيد البريد الجديد.</p>
        <div class="profile-photo-editor">
          ${avatar(user, "large")}
          <label class="button ghost">تغيير الصورة<input class="hidden-file" type="file" name="avatarFile" accept="image/*" /></label>
        </div>
        <div class="employee-form-grid">
          <label class="span-2">البريد الإلكتروني<input type="email" name="email" autocomplete="email" value="${escapeHtml(user.email || employee.email || "")}" required /></label>
          <label class="span-2">رقم الهاتف<input name="phone" inputmode="tel" autocomplete="tel" value="${escapeHtml(employee.phone || user.phone || "")}" placeholder="01xxxxxxxxx" required /></label>
          <input type="hidden" name="avatarUrl" value="${escapeHtml(user.avatarUrl || user.photoUrl || employee.photoUrl || "")}" />
        </div>
        <button class="button primary full" type="submit">حفظ التعديلات</button>
      </form>
      <form class="employee-card full" id="employee-password-form">
        <div class="panel-kicker">الأمان</div>
        <h2>تغيير كلمة المرور</h2>
        <div class="employee-form-grid">
          <input class="visually-hidden" type="text" name="username" autocomplete="username" value="${escapeHtml(user.email || employee.email || employee.phone || user.phone || "")}" tabindex="-1" aria-hidden="true" />
<<<<<<< HEAD
          <label class="span-2">كلمة المرور الحالية${passwordField({ name: "currentPassword", autocomplete: "current-password", required: true })}</label>
          <label class="span-2">كلمة المرور الجديدة${passwordField({ name: "newPassword", autocomplete: "new-password", minlength: "8", required: true })}</label>
          <label class="span-2">تأكيد كلمة المرور الجديدة${passwordField({ name: "confirmPassword", autocomplete: "new-password", minlength: "8", required: true })}</label>
=======
          <label class="span-2">كلمة المرور الحالية<input type="password" name="currentPassword" autocomplete="current-password" required /></label>
          <label class="span-2">كلمة المرور الجديدة<input type="password" name="newPassword" autocomplete="new-password" minlength="8" required /></label>
          <div class="span-2">${passwordStrengthMarkup()}</div>
          <label class="span-2">تأكيد كلمة المرور الجديدة<input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" required /></label>
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
        </div>
        <button class="button primary full" type="submit">حفظ كلمة المرور</button>
      </form>
    </section>
  `, "حسابي", "بياناتي ووسائل الاتصال.");
<<<<<<< HEAD
=======
  bindPasswordStrength(app.querySelector("#employee-password-form"));
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
  app.querySelector("#employee-password-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    if (values.newPassword !== values.confirmPassword) { setMessage("", "تأكيد كلمة المرور غير مطابق."); return renderProfile(); }
    try { await endpoints.changePassword(values); setMessage("تم تغيير كلمة المرور بنجاح.", ""); event.currentTarget.reset(); } catch (error) { setMessage("", error.message || "تعذر تغيير كلمة المرور."); }
    renderProfile();
  });
  app.querySelector("#employee-contact-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    try {
      const file = event.currentTarget.querySelector("[name='avatarFile']")?.files?.[0];
<<<<<<< HEAD
      if (file) values.avatarUrl = await fileToAvatarDataUrl(file);
=======
      if (file) {
        try { values.avatarUrl = await endpoints.uploadAvatar(file); }
        catch { values.avatarUrl = await fileToAvatarDataUrl(file); }
      }
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      delete values.avatarFile;
      const updated = unwrap(await endpoints.updateMyContact(values));
      state.user = updated || state.user;
      setMessage("تم حفظ التعديلات. إذا غيرت البريد قد تحتاج تأكيد البريد الجديد قبل استخدامه في تسجيل الدخول.", "");
    } catch (error) {
      setMessage("", error.message || "تعذر حفظ التعديلات.");
    }
    renderProfile();
  });
}

async function render() {
  try {
<<<<<<< HEAD
    state.error = "";
    if (!state.user) state.user = await endpoints.me().then(unwrap).catch(() => null);
    if (!state.user) return renderLogin();
    if (state.recoveryMode) return renderRecoveryPassword();
    startNotificationPolling();
    const key = routeKey();
    if (key === "action-center") return renderActionCenter();
=======
    consumeFlashMessage();
    if (!state.user) state.user = await endpoints.me().then(unwrap).catch(() => null);
    if (!state.user) return renderLogin();
    startNotificationPolling();
    if (state.recoveryMode) return renderRecoveryPassword();
    const key = routeKey();
    renderLoadingSkeleton(routeSubtitles[key] ? (moreEmployeeRoutes.concat(employeeRoutes).find(([route]) => route === key)?.[1] || "تطبيق الموظف") : "تطبيق الموظف", routeSubtitles[key] || "جاري تجهيز البيانات...");
    if (key === "action-center") return renderActionCenter();
    if (key === "kpi") return renderKpi();
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    if (key === "punch") return renderPunch();
    if (key === "location") return renderLocation();
    if (key === "leaves") return renderLeaves();
    if (key === "missions") return renderMissions();
    if (key === "requests") return renderRequests();
    if (key === "tasks") return renderTasks();
    if (key === "daily-report") return renderDailyReport();
    if (key === "documents") return renderDocuments();
    if (key === "policies") return renderPolicies();
<<<<<<< HEAD
=======
    if (key === "decisions") return renderAdminDecisions();
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
    if (key === "disputes") return renderDisputes();
    if (key === "notifications") return renderNotifications();
    if (key === "profile") return renderProfile();
    return renderHome();
  } catch (error) {
    console.error(error);
    setMessage("", error.message || "تعذر تحميل الصفحة.");
    shell(`<section class="employee-card"><h2>تعذر تحميل الصفحة</h2><p>${escapeHtml(error.message || "حدث خطأ")}</p></section>`, "خطأ", "راجع الاتصال أو أعد المحاولة.");
  }
}

<<<<<<< HEAD
=======
startIdleTimer();
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
render();
