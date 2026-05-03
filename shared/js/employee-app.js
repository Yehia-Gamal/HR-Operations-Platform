import { endpoints, unwrap } from "./api.js?v=management-suite-20260502-production";
import { enableWebPushSubscription } from "./push.js?v=management-suite-20260502-production";

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
  punch: "سجّل حضورك أو انصرافك مباشرة بعد قراءة GPS.",
  location: "أرسل موقعك المباشر عند طلب الإدارة بضغطة واحدة.",
  leaves: "قدّم طلب إجازة وتابع حالته بدون أوراق.",
  missions: "قدّم طلب مأمورية وتابع موافقة الإدارة.",
  requests: "تابع كل طلباتك من إجازات ومأموريات ومواقع وتعديلات.",
  tasks: "تابع المهام المكلف بها وحدّث حالتها.",
  "daily-report": "أرسل تقرير إنجازك اليومي والعوائق واحتياجات الدعم.",
  documents: "مستنداتك الشخصية والتنبيهات الخاصة بانتهاء الصلاحية.",
  policies: "اقرأ سياسات الجمعية ووقّع عليها إلكترونيًا.",
  decisions: "قرارات إدارية رسمية تحتاج تأكيد الاطلاع مع توقيت القراءة.",
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
}

function escapeHtml(value = "") {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" }[char]));
}

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
    SELF_SUBMITTED: "مرسل من الموظف",
    MANAGER_APPROVED: "اعتماد المدير",
    HR_REVIEWED: "مراجعة HR",
    SECRETARY_REVIEWED: "مراجعة السكرتير",
    EXECUTIVE_APPROVED: "اعتماد المدير التنفيذي",
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
  const name = subject?.fullName || subject?.name || subject?.email || subject?.employee?.fullName || "م";
  return url
    ? `<img class="avatar ${size}" src="${escapeHtml(url)}" alt="" loading="lazy" />`
    : `<span class="avatar ${size}">${escapeHtml(String(name).trim().charAt(0) || "م")}</span>`;
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

function isMoreRoute(key = routeKey()) {
  return moreEmployeeRoutes.some(([route]) => route === key);
}

function shell(content, title = "تطبيق الموظف", subtitle = "") {
  const current = routeKey();
  const user = state.user || {};
  const employee = employeeSubject();
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
        ${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ""}
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${content}
      </main>
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
  if (routeKey() === "register") {
    state.registerMode = false;
    history.replaceState(null, "", "#home");
  }
  const identifierValue = state.loginIdentifier || "";
  const passwordValue = state.loginPassword || "";
  app.innerHTML = `
    <div class="employee-login-screen">
      <form class="employee-login-card" id="employee-login-form" novalidate>
        <div class="login-brand-row">
          <img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" />
          <div><strong>أحلى شباب</strong><span>منصة الموظفين</span></div>
        </div>
        <h1>دخول الموظفين</h1>
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
      </form>
    </div>
  `;
  const form = app.querySelector("#employee-login-form");
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
      setMessage("", "اكتب رقم الهاتف أولًا ثم اضغط نسيت كلمة السر.");
      return renderLogin();
    }
    try {
      await endpoints.forgotPassword(state.loginIdentifier);
      state.lastLoginFailed = false;
      setMessage("تم إرسال طلب إعادة تعيين كلمة المرور إلى الإدارة/البريد المرتبط.", "");
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
      <form class="employee-card full" id="recovery-password-form">
        <h2>تعيين كلمة مرور جديدة</h2>
        <p>تم فتح رابط استعادة كلمة المرور. اكتب كلمة مرور جديدة لا تقل عن 8 أحرف.</p>
        <label>كلمة المرور الجديدة<input type="password" name="newPassword" autocomplete="new-password" minlength="8" required /></label>
        ${passwordStrengthMarkup()}
        <label>تأكيد كلمة المرور الجديدة<input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" required /></label>
        <button class="button primary full" type="submit">حفظ كلمة المرور الجديدة</button>
      </form>
    </section>
  `, "استعادة كلمة المرور", "تعيين كلمة مرور جديدة بعد فتح رابط الاستعادة.");
  bindPasswordStrength(app.querySelector("#recovery-password-form"));
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
  const myEvents = events.filter((event) => !employeeId || event.employeeId === employeeId);
  const todayEvents = myEvents.filter((event) => String(event.eventAt || event.createdAt || "").startsWith(todayIso()));
  const pendingLeaves = leaves.filter((item) => item.employeeId === employeeId && item.status === "PENDING").length;
  const pendingMissions = missions.filter((item) => item.employeeId === employeeId && item.status === "PENDING").length;
  const unread = notifications.filter((item) => !item.isRead && (!item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id)).length;
  const pendingLive = (liveRequests || []).filter((item) => item.status === "PENDING" && (!employeeId || item.employeeId === employeeId)).length;
  const employee = employeeSubject();
  const lastEvent = myEvents[0];
  shell(`
    <section class="employee-grid">
      <article class="employee-hero-card">
        <div class="person-cell large">${avatar(employee, "large")}<span><strong>${escapeHtml(greeting())}، ${escapeHtml(employee.fullName || state.user?.fullName || "أهلًا")}</strong><small>${escapeHtml(employee.jobTitle || "جاهز لبدء يومك")}</small></span></div>
        <p>كل ما تحتاجه يوميًا في شاشة واحدة: بصمة، موقع، إجازة، شكوى، وإشعارات.</p>
        <div class="hero-meta"><span class="hero-chip">${escapeHtml(fullDateText())}</span><span class="hero-chip">الساعة ${escapeHtml(timeNowText())}</span><span class="hero-chip">جاهز للتسجيل</span></div>
        <div class="employee-actions-row"><button class="button primary" data-route="punch">تسجيل بصمة الآن</button><button class="button ghost" data-route="location">إرسال موقعي</button></div>
      </article>
      <div class="compact-metrics-grid">
        ${compactMetric("بصمات اليوم", todayEvents.length, "👁", "punch")}
        ${compactMetric("طلبات معلقة", pendingLeaves + pendingMissions, "🏖", "requests")}
        ${compactMetric("مهام مفتوحة", tasks.filter((task) => task.status !== "DONE").length, "✅", "tasks")}
        ${compactMetric("إشعارات", unread, "🔔", "notifications")}
        ${compactMetric("طلب موقع", pendingLive, "📍", "location")}
        ${compactMetric("مطلوب مني", (actionCenter.actions || []).length, "⚡", "action-center")}
      </div>
      ${pendingLive ? `<article class="status-strip urgent"><span class="status-dot danger"></span><div><strong>الإدارة طلبت موقعك المباشر الآن</strong><span>افتح صفحة الموقع للقبول أو الرفض مع السبب.</span></div><button class="button primary" data-route="location">الرد على الطلب</button></article>` : ""}
      <article class="status-strip">
        <span class="status-dot ${lastEvent?.status === "REJECTED" ? "danger" : todayEvents.length ? "" : "warning"}"></span>
        <div><strong>${todayEvents.length ? "لديك حركة مسجلة اليوم" : "لم تسجل بصمة اليوم بعد"}</strong><span>${lastEvent ? `آخر حركة: ${statusLabel(lastEvent.type)} — ${date(lastEvent.eventAt || lastEvent.createdAt)}` : "ابدأ يومك من زر البصمة."}</span></div>
        <button class="button ghost" data-route="punch">فتح البصمة</button>
      </article>
      <div class="quick-action-grid">
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
      </div>
      <article class="employee-card full"><h2>آخر بصماتي</h2>${renderEventList(myEvents.slice(0, 5))}</article>
      <article class="employee-card full"><h2>آخر طلباتي</h2>${renderRequestList([...leaves, ...missions].filter((item) => item.employeeId === employeeId).slice(0, 6))}</article>
      <article class="employee-card full"><h2>آخر مهامي</h2>${tasks.length ? `<div class="employee-list">${tasks.slice(0, 4).map((task) => `<div class="employee-list-item"><div><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml(task.description || "")}</span></div><div class="list-item-side">${badge(task.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد مهام حالية.</div>`}</article>
    </section>
  `, "الرئيسية", "ملخص سريع ومختصر لحسابك اليوم.");
}

function renderEventList(events = []) {
  if (!events.length) return `<div class="empty-state">لا توجد بصمات مسجلة بعد.</div>`;
  return `<div class="employee-list">${events.map((event) => `<div class="employee-list-item"><div><strong>${statusLabel(event.type)}</strong><span>${date(event.eventAt || event.createdAt)}</span><small>${escapeHtml(event.notes || event.source || "")}</small></div><div class="list-item-side">${badge(event.geofenceStatus || event.status || "")}</div></div>`).join("")}</div>`;
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
  shell(`
    <section class="employee-grid punch-mobile">
      <article class="employee-card full">
        <div class="punch-focus">
          <div>
            <div class="person-cell large">${avatar(employee, "large")}<span><strong>${escapeHtml(employee.fullName || state.user?.fullName || "الموظف")}</strong><small>${escapeHtml(employee.jobTitle || "جاهز للتسجيل")}</small></span></div>
            <div class="step-list"><span class="step-item"><b>1</b>بصمة الجهاز</span><span class="step-item"><b>2</b>قراءة GPS</span><span class="step-item"><b>3</b>حفظ الحركة</span></div>
          </div>
          <div class="punch-orb">◉</div>
        </div>
        <div class="gps-panel"><span class="feature-icon">⌖</span><div><strong>${escapeHtml(branchName)}</strong><span>النطاق: ${escapeHtml(address.radiusMeters || 300)} متر — أقصى دقة GPS: ${escapeHtml(address.maxAccuracyMeters || 500)} متر</span></div></div>
        <label>ملاحظات اختيارية<input id="punch-notes" placeholder="مثال: من البوابة الرئيسية" /></label>
        <div class="biometric-box"><strong>التحقق الإجباري: بصمة الإصبع / Passkey</strong><p>عند تسجيل الحضور أو الانصراف سيطلب التطبيق بصمة الجهاز أولًا، ثم يقرأ GPS، ثم يحفظ الحركة والموقع.</p><button class="button ghost" type="button" data-register-passkey>تسجيل/تحديث بصمة الجهاز</button></div>
        <div class="employee-actions-stack punch-buttons">
          <button class="button primary" data-punch="checkIn">بصمة حضور</button>
          <button class="button" data-punch="checkOut">بصمة انصراف</button>
          <button class="button ghost" data-test-location>اختبار GPS</button>
        </div>
        <div id="punch-result" class="risk-box hidden"></div>
      </article>
      <article class="employee-card full"><h2>آخر بصماتي</h2>${renderEventList(events.slice(0, 8))}</article>
    </section>
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
      <strong>${escapeHtml(title)} - ${statusTitle}</strong>
      <p>${escapeHtml(evaluation.message || evaluation.blockReason || "")}</p>
      ${evaluation.placeName ? `<p>المكان الحالي: ${escapeHtml(evaluation.placeName)}</p>` : ""}
      ${distance != null ? `<p>يبعد عن المجمع: ${escapeHtml(Math.round(Number(distance)))} متر</p>` : ""}
      ${evaluation.accuracyMeters != null ? `<p>دقة GPS: ${escapeHtml(evaluation.accuracyMeters)} متر</p>` : ""}
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
    resultBox.textContent = "الخطوة 2 من 3: جاري تحديد الموقع بدقة عالية (انتظر للحصول على أفضل قراءة)...";
    const current = await getBrowserLocation();
    if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع. فعّل GPS واسمح للتطبيق بالوصول للموقع.");
    if (current.locationError) throw new Error(current.locationError);
    resultBox.textContent = "جاري التحقق من النطاق الجغرافي...";
    const evaluation = await endpoints.evaluateGeofence({ employeeId: employee.id, ...current }).then(unwrap);
    evaluation.latitude = current.latitude;
    evaluation.longitude = current.longitude;
    resultBox.textContent = "جاري جلب اسم المكان...";
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
      resultBox.textContent = "الخطوة 1 من 3: جاري تأكيد بصمة الجهاز...";
      const passkeyCredentialId = await requestBrowserPasskeyForAction("تسجيل البصمة");
      const { current, evaluation } = await readAndEvaluate();
      resultBox.textContent = "الخطوة 3 من 3: جاري حفظ حركة الحضور أو الانصراف...";
      const body = { ...current, notes: app.querySelector("#punch-notes")?.value || "", verificationStatus: "verified", biometricMethod: "passkey", passkeyCredentialId };
      const response = button.dataset.punch === "checkIn" ? await endpoints.selfCheckIn(body) : await endpoints.selfCheckOut(body);
      const savedEvaluation = { ...evaluation, ...(response.evaluation || {}), placeName: evaluation.placeName, latitude: current.latitude, longitude: current.longitude };
      showResult(button.dataset.punch === "checkIn" ? "تم تسجيل الحضور" : "تم تسجيل الانصراف", savedEvaluation, false);
      setMessage(button.dataset.punch === "checkIn" ? "تم حفظ بصمة الحضور." : "تم حفظ بصمة الانصراف.", "");
      haptic([30, 50, 80]);
      window.setTimeout(render, 800);
    } catch (error) {
      await logRejected(button.dataset.punch, {}, { message: error.message }, error.message);
      showResult("تعذر تسجيل البصمة", { message: friendlyError(error) }, true);
      haptic([200, 100, 200]);
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
  const mine = rows.filter((item) => !item.employeeId || item.employeeId === employeeId).slice(0, 20);
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
      <article class="employee-card full"><h2>سجل المواقع والطلبات</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${statusLabel(item.status)}</strong><span>${date(item.requestedAt || item.date || item.createdAt)}</span><small>${item.latitude && item.longitude ? `${escapeHtml(item.latitude)} , ${escapeHtml(item.longitude)}` : "لم يتم إرسال إحداثيات بعد"}</small></div><div class="list-item-side">${item.latitude && item.longitude ? `<a target="_blank" rel="noopener" class="button ghost" href="https://www.google.com/maps?q=${escapeHtml(item.latitude)},${escapeHtml(item.longitude)}">خريطة</a>` : badge(item.status || "PENDING")}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد طلبات موقع بعد.</div>`}</article>
      <article class="employee-card full"><h2>طلبات الموقع المباشر</h2>${liveRequests.length ? `<div class="employee-list">${liveRequests.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.requestedByName || "الإدارة")}</strong><span>${escapeHtml(item.reason || "طلب موقع")}</span><small>${escapeHtml(date(item.createdAt))}</small></div><div class="list-item-side">${badge(item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد طلبات مباشرة.</div>`}</article>
    </section>
  `, "الموقع", "مشاركة الموقع المباشر بموافقة الموظف عند الطلب.");
  const result = app.querySelector("#location-result");
  const sendLive = async (id) => {
    result?.classList.remove("hidden", "danger-box");
    if (result) result.textContent = "جاري تأكيد بصمة الجهاز قبل إرسال الموقع...";
    const passkeyCredentialId = await requestBrowserPasskeyForAction("إرسال الموقع");
    if (result) result.textContent = "جاري قراءة الموقع بدقة عالية...";
    const current = await getBrowserLocation();
    if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع. فعّل GPS واسمح للتطبيق بالوصول للموقع.");
    await endpoints.respondLiveLocationRequest(id, { status: "APPROVED", ...current, biometricMethod: "passkey", passkeyCredentialId });
  };
  app.querySelectorAll("[data-live-send]").forEach((button) => button.addEventListener("click", async () => {
    try { await sendLive(button.dataset.liveSend); setMessage("تم إرسال موقعك المباشر للإدارة.", ""); renderLocation(); } catch (error) { setMessage("", friendlyError(error, "تعذر إرسال الموقع.")); renderLocation(); }
  }));
  app.querySelectorAll("[data-live-reject]").forEach((button) => button.addEventListener("click", async () => {
    const reason = await askText({ title: "رفض إرسال الموقع", message: "اكتب سبب رفض إرسال الموقع حتى يظهر للإدارة.", defaultValue: "غير متاح الآن", confirmLabel: "إرسال الرفض" });
    if (reason === null) return;
    try { await endpoints.respondLiveLocationRequest(button.dataset.liveReject, { status: "REJECTED", reason }); setMessage("تم إرسال سبب الرفض للإدارة.", ""); renderLocation(); } catch (error) { setMessage("", error.message || "تعذر حفظ الرد."); renderLocation(); }
  }));
  app.querySelector("[data-send-location]")?.addEventListener("click", async () => {
    try {
      result?.classList.remove("hidden", "danger-box");
      if (result) result.textContent = "جاري تأكيد بصمة الجهاز قبل إرسال الموقع...";
      const passkeyCredentialId = await requestBrowserPasskeyForAction("إرسال الموقع");
      if (result) result.textContent = "جاري قراءة الموقع...";
      const current = await getBrowserLocation();
      if (current.locationPermission !== "granted") throw new Error("لم يتم السماح بقراءة الموقع.");
      const pendingLocationRequest = mine.find((item) => item.status === "PENDING" && item.id && String(item.id).startsWith("locreq"));
      if (pendingLocationRequest) await endpoints.updateLocationRequest(pendingLocationRequest.id, { status: "APPROVED", ...current, biometricMethod: "passkey", passkeyCredentialId });
      else await endpoints.recordLocation({ employeeId, source: "employee_app", status: "ACTIVE", ...current, biometricMethod: "passkey", passkeyCredentialId });
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
        <p>يتم إخطار مدير مباشر ثالث ومدير مباشر ثانٍ ومدير مباشر أول والسكرتير التنفيذي والمدير التنفيذي فورًا، ثم يتم التنسيق أو التصعيد عبر السكرتير التنفيذي.</p>
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
      <article class="employee-card full accent-card"><h2>التقرير اليومي</h2><p>اكتب ما تم إنجازه اليوم، العوائق التي تحتاج دعمًا، وخطة الغد. يتم إرسال التقرير لمديرك والسكرتير التنفيذي للمتابعة التشغيلية.</p></article>
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

async function renderNotifications() {
  const rows = await endpoints.notifications().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = rows.filter((item) => !item.employeeId || item.employeeId === employeeId || item.userId === state.user?.id).slice(0, 50);
  shell(`
    <section class="employee-card full">
      <div class="panel-kicker">التنبيهات</div>
      <h2>الإشعارات</h2>
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
          <label class="span-2">كلمة المرور الحالية<input type="password" name="currentPassword" autocomplete="current-password" required /></label>
          <label class="span-2">كلمة المرور الجديدة<input type="password" name="newPassword" autocomplete="new-password" minlength="8" required /></label>
          <div class="span-2">${passwordStrengthMarkup()}</div>
          <label class="span-2">تأكيد كلمة المرور الجديدة<input type="password" name="confirmPassword" autocomplete="new-password" minlength="8" required /></label>
        </div>
        <button class="button primary full" type="submit">حفظ كلمة المرور</button>
      </form>
    </section>
  `, "حسابي", "بياناتي ووسائل الاتصال.");
  bindPasswordStrength(app.querySelector("#employee-password-form"));
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
      if (file) {
        try { values.avatarUrl = await endpoints.uploadAvatar(file); }
        catch { values.avatarUrl = await fileToAvatarDataUrl(file); }
      }
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
    consumeFlashMessage();
    if (!state.user) state.user = await endpoints.me().then(unwrap).catch(() => null);
    if (!state.user) return renderLogin();
    startNotificationPolling();
    if (state.recoveryMode) return renderRecoveryPassword();
    const key = routeKey();
    renderLoadingSkeleton(routeSubtitles[key] ? (moreEmployeeRoutes.concat(employeeRoutes).find(([route]) => route === key)?.[1] || "تطبيق الموظف") : "تطبيق الموظف", routeSubtitles[key] || "جاري تجهيز البيانات...");
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
    if (key === "profile") return renderProfile();
    return renderHome();
  } catch (error) {
    console.error(error);
    setMessage("", error.message || "تعذر تحميل الصفحة.");
    shell(`<section class="employee-card"><h2>تعذر تحميل الصفحة</h2><p>${escapeHtml(error.message || "حدث خطأ")}</p></section>`, "خطأ", "راجع الاتصال أو أعد المحاولة.");
  }
}

startIdleTimer();
render();
