import { endpoints, unwrap } from "./api.js?v=management-suite-20260502-production";
import { enableWebPushSubscription } from "./push.js?v=management-suite-20260502-production";
import { getDeviceFingerprintHash, requestEmployeePasskey, capturePunchSelfie, calculateAttendanceRisk, rememberDevicePunch } from "./attendance-identity.js?v=identity-v1";
import { ensureAttendancePolicyAcknowledged, ensureTrustedDeviceApproval, requestBranchQrChallenge, analyzeLocationTrust, mergeRiskSignals, submitFallbackAttendanceRequest } from "./attendance-v3-security.js?v=identity-v3";
import { evaluateAttendanceV4Controls, mergeV4RiskSignals, createFormalFallbackRequest } from "./attendance-v4-ops.js?v=identity-v4-notes";

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
  ["team", "فريقي", "👥"],
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
  team: "إدارة فريقك وطلبات الإجازات والمأموريات بخصوصية ووضوح.",
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
  const deviceFingerprintHash = await getDeviceFingerprintHash();
  await endpoints.registerPasskey({ credentialId: rawId, attestationObject, clientDataJSON, transports, label: "بصمة جهاز الموظف", platform: navigator.platform || "browser", deviceFingerprintHash, trusted: true });
  return rawId;
}

async function requestBrowserPasskeyForAction(label = "تأكيد العملية", employee = {}) {
  return await requestEmployeePasskey({ endpoints, user: state.user, employee, label });
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


const BRANCH_DISPLAY_NAME = "مجمع أحلى شباب";
const BRANCH_DISPLAY_AREA = "منيل شيحة - الجيزة";
const ATTENDANCE_REMINDER_HOUR = 9;
const ATTENDANCE_REMINDER_MINUTE = 30;

function renderRequestList(requests = []) {
  if (!requests || !requests.length) return `<div class="empty-state">لا توجد طلبات مسجلة.</div>`;
  return `<div class="employee-list">${requests.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title || item.leaveType?.name || item.leaveType || item.type || "طلب")}</strong><span>${escapeHtml(date(item.createdAt || item.startDate || item.plannedStart || "-"))}</span><small>${escapeHtml(item.reason || item.notes || item.destinationName || "-")}</small></div><div class="list-item-side">${badge(item.finalStatus || item.workflowStatus || item.status)}</div></div>`).join("")}</div>`;
}

function currentEmployeeLabel(subject = employeeSubject()) {
  return subject?.fullName || state.user?.fullName || state.user?.name || "الموظف";
}

function currentJobLabel(subject = employeeSubject()) {
  return subject?.jobTitle || subject?.position || state.user?.role?.name || "موظف";
}

function employeeHeaderCell(subject = employeeSubject()) {
  return `<div class="employee-header-card person-cell large">${avatar(subject, "large")}<span><strong>${escapeHtml(currentEmployeeLabel(subject))}</strong><small>${escapeHtml(currentJobLabel(subject))}</small></span></div>`;
}

function locationLabelFromRecord(record = {}) {
  const branchish = ["inside_branch", "INSIDE_BRANCH", "inside", "IN_RANGE", "ACTIVE"].includes(String(record.status || record.locationStatus || record.geofenceStatus || ""));
  if (branchish) return `${BRANCH_DISPLAY_NAME} — ${BRANCH_DISPLAY_AREA}`;
  return record.addressLabel || record.locationLabel || record.placeLabel || record.address || record.destinationName || "لم يتم تحديد عنوان نصي بعد";
}

function locationStatusBadge(record = {}) {
  const status = String(record.status || record.locationStatus || record.geofenceStatus || "").toLowerCase();
  const inside = status.includes("inside") || status.includes("in_range") || status === "active" || status === "approved";
  const outside = status.includes("outside") || status.includes("out_of_range") || status.includes("branch");
  if (inside) return `<span class="pill success">داخل المجمع</span>`;
  if (outside) return `<span class="pill danger">خارج المجمع</span>`;
  return `<span class="pill warning">بحاجة للتحقق</span>`;
}

function readableLocationBlock(record = {}, { compact = false } = {}) {
  const label = locationLabelFromRecord(record);
  const accuracy = Number(record.accuracy || record.gpsAccuracy || 0);
  const distance = Number(record.distanceFromBranch || record.distanceMeters || 0);
  const hasDistance = Number.isFinite(distance) && distance > 0;
  return `<div class="readable-location ${compact ? "compact" : ""}">
    <div>${locationStatusBadge(record)}<strong>${escapeHtml(label)}</strong><small>${escapeHtml(label.includes(BRANCH_DISPLAY_NAME) ? BRANCH_DISPLAY_AREA : "الموقع الفعلي المسجل")}</small></div>
    <div class="location-meta-row">${accuracy ? `<span>الدقة ±${Math.round(accuracy)} م</span>` : ""}${hasDistance ? `<span>يبعد تقريبًا ${Math.round(distance)} م</span>` : ""}</div>
  </div>`;
}

function attendanceNoteField(value = "") {
  return `<label class="span-2 punch-note-field">ملاحظة مع البصمة<textarea id="punch-notes" name="notes" rows="2" placeholder="اكتب ملاحظة إن وجدت: مأمورية، ظرف طارئ، تأخير مواصلات...">${escapeHtml(value)}</textarea></label>`;
}

function isMorningPunchTime() {
  const h = new Date().getHours();
  return h < 15;
}

function todayReminderDue(events = []) {
  const now = new Date();
  if (now.getHours() < ATTENDANCE_REMINDER_HOUR || (now.getHours() === ATTENDANCE_REMINDER_HOUR && now.getMinutes() < ATTENDANCE_REMINDER_MINUTE)) return false;
  return !(events || []).some((e) => String(e.type || e.eventType || "").toLowerCase().includes("in") || String(e.type || "").includes("حضور"));
}

function kpiSlider({ name, label, weight, value = 0, readonly = false }) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  const calculated = (pct * weight / 100).toFixed(1);
  return `<label class="kpi-slider-field ${readonly ? "is-readonly" : ""}"><span>${escapeHtml(label)}</span><input type="range" name="${escapeHtml(name)}" min="0" max="100" step="1" value="${pct}" ${readonly ? "disabled" : ""} data-weight="${weight}" /><div class="kpi-slider-meta"><b>${pct}%</b><small>الوزن ${weight} — المحتسب ${calculated}/${weight}</small></div><div class="kpi-progress"><i style="width:${pct}%"></i></div></label>`;
}

function getManagerLikeRole() {
  const role = roleKey();
  const perms = permissionsOf();
  return role.includes("manager") || role.includes("مدير") || perms.has("team:manage") || perms.has("employees:team");
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
        <div class="employee-brand is-larger-logo">
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
      await endpoints.createLeave({ ...values, workflowStatus: "pending_manager_review", status: "PENDING_MANAGER_REVIEW" });
      setMessage("تم إرسال طلب الإجازة للمدير المباشر.", "");
      location.hash = "leaves";
    }
    if (action === "mission") {
      await endpoints.createMission({ ...values, workflowStatus: "pending_manager_review", status: "PENDING_MANAGER_REVIEW" });
      setMessage("تم إرسال طلب المأمورية للمدير المباشر.", "");
      location.hash = "missions";
    }
    if (action === "dispute") {
      await endpoints.createDispute({ ...values, employeeId: state.user?.employeeId || state.user?.employee?.id || "", status: "committee_review", privacyLevel: "committee_only" });
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
        <p>كل ما تحتاجه يوميًا في شاشة واحدة: بصمة، موقع، إجازة، مأمورية، شكوى، وإشعارات.</p>
        <div class="hero-meta"><span class="hero-chip">${escapeHtml(fullDateText())}</span><span class="hero-chip">الساعة ${escapeHtml(timeNowText())}</span>${todayEvents.length ? `<span class="hero-chip success">تم تسجيل ${todayEvents.length} حركة اليوم</span>` : `<span class="hero-chip warning">لم تسجل حضور اليوم</span>`}</div>
      </article>

      ${reminder ? `<article class="employee-card full attendance-reminder-card"><h2>تذكير بصمة 9:30 صباحًا</h2><p>لم يتم تسجيل بصمة الحضور حتى الآن. يرجى تسجيل البصمة وإرسال الموقع عند الوصول إلى مجمع أحلى شباب.</p><button class="button primary full" data-route="punch">تسجيل بصمة الآن</button></article>` : ""}

      <article class="employee-card full punch-primary-card">
        <div class="panel-kicker">البصمة اليومية</div>
        <h2>${todayEvents.length ? "متابعة حركة اليوم" : "جاهز لتسجيل الحضور"}</h2>
        <p>${todayEvents.length ? `آخر حركة مسجلة: ${escapeHtml(date(lastEvent.eventAt || lastEvent.createdAt))}` : "سجّل حضورك عند الوصول، أو أرسل موقعك لو طلبته الإدارة."}</p>
        <div class="employee-actions-row"><button class="button primary" data-route="punch">فتح البصمة</button><button class="button ghost" data-route="location">إرسال موقعي</button></div>
      </article>

      <article class="employee-card full location-status-card">
        <h2>حالة الموقع</h2>
        ${lastEvent?.id ? readableLocationBlock(lastEvent) : `<div class="readable-location"><div><span class="pill warning">لم يتم التحقق بعد</span><strong>${BRANCH_DISPLAY_NAME}</strong><small>${BRANCH_DISPLAY_AREA}</small></div></div>`}
        <div class="employee-actions-row"><button class="button ghost small" data-route="punch">عرض الخريطة واختبار الموقع</button></div>
      </article>

      <section class="quick-actions-grid unified-actions">
        ${compactMetric("بصمات اليوم", todayEvents.length, "👁", "punch")}
        ${compactMetric("إشعارات", unread, "🔔", "notifications")}
        ${compactMetric("طلبات موقع", pendingLive, "📍", "location")}
        ${compactMetric("إجازات معلقة", pendingLeaves, "🏖", "leaves")}
        ${compactMetric("مأموريات معلقة", pendingMissions, "🚗", "missions")}
        ${compactMetric("مهامي", tasks.filter((t) => t.status !== "COMPLETED").length, "✅", "tasks")}
        ${compactMetric("تقييمي KPI", "فتح", "📊", "kpi")}
        ${compactMetric("شكوى/خلاف", "رفع", "⚖️", "disputes")}
        ${getManagerLikeRole() ? compactMetric("فريقي", "إدارة", "👥", "team") : ""}
      </section>

      <article class="employee-card full context-state-card">
        <h2>حالة اليوم</h2>
        ${inside ? `<p class="success-text">أنت داخل نطاق مجمع أحلى شباب، ويمكن اعتماد البصمة تلقائيًا إذا اكتملت خطوات التحقق.</p>` : `<p class="warning-text">إذا كنت خارج المجمع، سيتم ذكر المكان الفعلي مع ملاحظتك، وقد تُحوّل البصمة للمراجعة أو المأمورية.</p>`}
        <div class="employee-actions-row"><button class="button ghost" data-route="missions">طلب مأمورية</button><button class="button ghost" data-route="leaves">طلب إجازة</button></div>
      </article>

      <article class="employee-card full"><h2>آخر بصماتي</h2>${myEvents.length ? `<div class="employee-list">${myEvents.slice(0, 3).map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.type || item.eventType || "حركة")}</strong><span>${escapeHtml(date(item.eventAt || item.createdAt))}</span><small>${escapeHtml(locationLabelFromRecord(item))}</small></div><div class="list-item-side">${locationStatusBadge(item)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد بصمات مسجلة بعد.</div>`}</article>
      <article class="employee-card full"><h2>آخر طلباتي</h2>${renderRequestList([...leaves.filter((x)=>x.employeeId===employeeId), ...missions.filter((x)=>x.employeeId===employeeId)].slice(0,3))}</article>
    </section>
  `, "الرئيسية", "ملخص سريع ومختصر لحسابك اليوم.");
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
  const employee = address.employee || state.user?.employee || employeeSubject();
  const employeeId = state.user?.employeeId || state.user?.employee?.id || employee.id;
  const myEvents = events.filter((event) => !employeeId || event.employeeId === employeeId);
  const todayEvents = myEvents.filter((event) => String(event.eventAt || event.createdAt || "").startsWith(todayIso()));
  const suggestedType = todayEvents.length && isMorningPunchTime() === false ? "out" : (todayEvents.some((e)=>String(e.type||e.eventType||"").toLowerCase().includes("in")) ? "out" : "in");
  const primaryLabel = suggestedType === "in" ? "بصمة حضور الآن" : "بصمة انصراف الآن";
  const secondaryLabel = suggestedType === "in" ? "بصمة انصراف" : "بصمة حضور";
  shell(`
    <section class="employee-grid punch-mobile punch-redesigned">
      <article class="employee-card full">
        <div class="punch-focus">${employeeHeaderCell(employee)}<div class="punch-orb">👁</div></div>
        <div class="branch-readable-card">
          <div class="branch-circle">📍</div>
          <div><strong>${BRANCH_DISPLAY_NAME}</strong><small>${BRANCH_DISPLAY_AREA}</small></div>
        </div>
        <div id="gps-map-preview" class="gps-map-preview"><div class="geo-circle"><span>نطاق المجمع</span><i></i></div><small>اضغط اختبار الموقع لعرض حالتك داخل/خارج المجمع.</small></div>
        ${attendanceNoteField()}
        <div class="employee-actions-stack punch-actions-clear">
          <button class="button primary full" data-punch-type="${suggestedType}">${primaryLabel}</button>
          <button class="button ghost full" data-punch-type="${suggestedType === "in" ? "out" : "in"}">${secondaryLabel}</button>
          <button class="button ghost small" data-test-gps type="button">اختبار الموقع / عرض الخريطة</button>
        </div>
        <div id="punch-result" class="message compact hidden"></div>
        <p class="form-hint">تسجيل/تحديث بصمة الجهاز انتقل إلى: حسابي ← أمان الجهاز، حتى لا يختلط بزر البصمة.</p>
      </article>
      <article class="employee-card full"><h2>آخر بصماتي</h2>${myEvents.length ? `<div class="employee-list">${myEvents.slice(0, 5).map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.type || item.eventType || "حركة")}</strong><span>${escapeHtml(date(item.eventAt || item.createdAt))}</span><small>${escapeHtml(locationLabelFromRecord(item))}</small>${item.notes ? `<small>ملاحظة: ${escapeHtml(item.notes)}</small>` : ""}</div><div class="list-item-side">${locationStatusBadge(item)}${badge(item.riskLevel || item.status || "")}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد بصمات مسجلة.</div>`}</article>
    </section>
  `, "البصمة", "تسجيل حضور أو انصراف ببصمة الجهاز + GPS.");

  const resultBox = app.querySelector("#punch-result");
  app.querySelector("[data-test-gps]")?.addEventListener("click", async () => {
    try {
      resultBox?.classList.remove("hidden", "danger-box");
      if (resultBox) resultBox.textContent = "جاري اختبار الموقع بدقة عالية...";
      const current = await getBrowserLocation();
      const normalized = { ...current, status: current.insideBranch ? "inside_branch" : "outside_branch", addressLabel: current.insideBranch ? `${BRANCH_DISPLAY_NAME} — ${BRANCH_DISPLAY_AREA}` : (current.addressLabel || "موقع خارج المجمع") };
      sessionStorage.setItem("hr.employee.lastGpsTest", JSON.stringify({ ...normalized, testedAt: new Date().toISOString() }));
      const preview = app.querySelector("#gps-map-preview");
      if (preview) preview.innerHTML = `${readableLocationBlock(normalized)}<a class="button ghost small" target="_blank" rel="noopener" href="https://maps.google.com/?q=${encodeURIComponent(`${current.latitude},${current.longitude}`)}">فتح الخريطة</a>`;
      if (resultBox) resultBox.textContent = current.insideBranch ? "أنت داخل نطاق مجمع أحلى شباب." : "أنت خارج المجمع، سيتم تسجيل المكان الفعلي والملاحظة عند البصمة.";
    } catch (error) {
      resultBox?.classList.remove("hidden");
      resultBox?.classList.add("danger-box");
      if (resultBox) resultBox.textContent = friendlyError(error, "تعذر اختبار الموقع.");
    }
  });

  app.querySelectorAll("[data-punch-type]").forEach((button) => button.addEventListener("click", async () => {
    const type = button.dataset.punchType || "in";
    const actionText = type === "out" ? "انصراف" : "حضور";
    try {
      resultBox?.classList.remove("hidden", "danger-box");
      if (resultBox) resultBox.textContent = `جاري تسجيل بصمة ${actionText}...`;
      const preFingerprint = await getDeviceFingerprintHash().catch(() => "");
      const policyAck = await ensureAttendancePolicyAcknowledged({ endpoints, employee, deviceFingerprintHash: preFingerprint });
      let device = {};
      try { device = await requestEmployeePasskey({ employeeId: employee.id || employeeId, username: employee.fullName || state.user?.fullName || "employee" }); }
      catch (err) { device = { ok: false, status: "PASSKEY_FAILED", error: err?.message || "Passkey failed", deviceFingerprintHash: preFingerprint }; }
      let current = {};
      try { current = await getBrowserLocation(); }
      catch (err) { current = { locationPermission: "denied", error: err?.message || "GPS failed" }; }
      // uploadPunchSelfie is performed inside capturePunchSelfie via endpoints.uploadPunchSelfie when available.
      const selfie = await capturePunchSelfie({ employeeId: employee.id || employeeId, endpoints }).catch((err) => ({ ok: false, reason: err?.message || "SELFIE_FAILED" }));
      const qr = await requestBranchQrChallenge({ endpoints, branchId: address.branch?.id || address.branchId || "main" }).catch(() => ({ status: "NOT_PROVIDED" }));
      const trustedDevice = await ensureTrustedDeviceApproval({ endpoints, employeeId: employee.id || employeeId, deviceFingerprintHash: device.deviceFingerprintHash || preFingerprint, passkeyCredentialId: device.passkeyCredentialId || "" }).catch(() => ({ status: "PENDING_REVIEW" }));
      const locationTrust = analyzeLocationTrust(current, { branch: address.branch || address });
      const v4 = evaluateAttendanceV4Controls({ location: current, identity: { trustedDevice }, qr, selfie }).catch ? {} : evaluateAttendanceV4Controls({ location: current, identity: { trustedDevice }, qr, selfie });
      const risk = mergeRiskSignals(calculateAttendanceRisk({ currentLocation: current, device, selfie, trustedDevice }), locationTrust);
      const merged = mergeV4RiskSignals ? mergeV4RiskSignals(risk, v4) : risk;
      const status = current.insideBranch ? "inside_branch" : "outside_branch";
      const notes = app.querySelector("#punch-notes")?.value || "";
      const body = { ...current, type: actionText, eventType: type, employeeId, notes, status, locationStatus: status, addressLabel: current.insideBranch ? `${BRANCH_DISPLAY_NAME} — ${BRANCH_DISPLAY_AREA}` : (current.addressLabel || current.locationLabel || "خارج نطاق المجمع"), verificationStatus: "verified", biometricMethod: "passkey+gps+selfie+qr", passkeyCredentialId: device.passkeyCredentialId, trustedDeviceId: device.trustedDeviceId, deviceFingerprintHash: device.deviceFingerprintHash || preFingerprint, browserInstallId: policyAck.browserInstallId || "", selfieUrl: selfie.selfieUrl || selfie.url || "", branchQrStatus: qr.status, branchQrChallengeId: qr.challengeId || "", antiSpoofingFlags: locationTrust.flags || [], riskScore: merged.riskScore || risk.riskScore, riskLevel: merged.riskLevel || risk.riskLevel, riskFlags: merged.riskFlags || risk.riskFlags, requiresReview: merged.requiresReview || risk.requiresReview || status === "outside_branch" };
      if (!device.ok || !selfie.ok || current.locationPermission === "denied") await createFormalFallbackRequest?.({ endpoints, reason: "IDENTITY_COMPONENT_FAILED", body }).catch(() => submitFallbackAttendanceRequest({ endpoints, reason: "IDENTITY_COMPONENT_FAILED", body }).catch(() => null));
      await endpoints.recordAttendance(body);
      rememberDevicePunch({ employeeId, deviceFingerprintHash: body.deviceFingerprintHash, eventType: type });
      setMessage(status === "inside_branch" ? `تم تسجيل بصمة ${actionText} داخل مجمع أحلى شباب.` : `تم تسجيل بصمة ${actionText} خارج المجمع وستظهر للمراجعة مع المكان والملاحظة.`, "");
      renderPunch();
    } catch (error) {
      resultBox?.classList.remove("hidden");
      resultBox?.classList.add("danger-box");
      if (resultBox) resultBox.textContent = friendlyError(error, "تعذر تسجيل البصمة.");
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
    const device = await requestBrowserPasskeyForAction("إرسال الموقع", state.user?.employee || {});
    const passkeyCredentialId = device.passkeyCredentialId;
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
      const device = await requestBrowserPasskeyForAction("إرسال الموقع", state.user?.employee || {});
      const passkeyCredentialId = device.passkeyCredentialId;
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
        <div class="panel-kicker">مسار اعتماد: المدير المباشر ثم HR</div>
        <h2>طلب إجازة</h2>
        <p>يتم إرسال الطلب أولًا إلى المدير المباشر، وبعد موافقته ينتقل إلى HR للاعتماد النهائي.</p>
        <div class="employee-form-grid">
          <label>نوع الإجازة<select name="leaveType"><option>اعتيادية</option><option>مرضية</option><option>طارئة</option></select></label>
          <label>من تاريخ<input type="date" name="startDate" required /></label>
          <label>إلى تاريخ<input type="date" name="endDate" required /></label>
          <label class="span-2">السبب<textarea name="reason" rows="3" required></textarea></label>
        </div>
        <input type="hidden" name="workflowStatus" value="pending_manager_review" />
        <button class="button primary full" type="submit">إرسال للمدير المباشر</button>
      </form>
      <article class="employee-card full"><h2>طلباتي</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.leaveType?.name || item.leaveType || "إجازة")}</strong><span>${escapeHtml(item.startDate || "-")} إلى ${escapeHtml(item.endDate || "-")}</span><small>${escapeHtml(item.managerDecision ? `قرار المدير: ${item.managerDecision}` : "بانتظار مسار الاعتماد")}</small></div><div class="list-item-side">${badge(item.finalStatus || item.workflowStatus || item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد طلبات إجازة.</div>`}</article>
    </section>
  `, "الإجازات", "تقديم طلب إجازة ومتابعة الاعتماد.");
}

async function renderMissions() {
  const missions = await endpoints.missions().then(unwrap).catch(() => []);
  const employeeId = state.user?.employeeId || state.user?.employee?.id;
  const mine = missions.filter((item) => !employeeId || item.employeeId === employeeId).slice(0, 30);
  shell(`
    <section class="employee-grid">
      <form class="employee-card full" data-ajax="mission">
        <div class="panel-kicker">مسار اعتماد: المدير المباشر ثم HR</div>
        <h2>طلب مأمورية</h2>
        <p>اكتب تفاصيل المأمورية والوجهة وموعد البداية والنهاية. ينتقل الطلب للمدير المباشر ثم HR.</p>
        <label>عنوان المأمورية<input name="title" required placeholder="مثال: زيارة حالة / توصيل مستندات" /></label>
        <label>الوجهة<input name="destinationName" required placeholder="اسم المكان أو العنوان" /></label>
        <label>بداية المأمورية<input name="plannedStart" type="datetime-local" required /></label>
        <label>نهاية المأمورية<input name="plannedEnd" type="datetime-local" required /></label>
        <label>ملاحظات إضافية<textarea name="notes" rows="2" placeholder="اكتب تفاصيل مختصرة إن وجدت"></textarea></label>
        <input type="hidden" name="workflowStatus" value="pending_manager_review" />
        <div class="employee-actions-stack"><button class="button primary">إرسال للمدير المباشر</button></div>
      </form>
      <article class="employee-card full"><h2>مأمورياتي</h2>${renderRequestList(mine)}</article>
    </section>
  `, "المأموريات", "طلب ومتابعة المأموريات المعتمدة.");
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
    <section class="employee-grid">
      <form class="employee-card full" data-ajax="dispute">
        <div class="panel-kicker">لجنة حل المشاكل والخلافات</div>
        <h2>تقديم شكوى / فض خلاف</h2>
        <p>الشكوى تذهب مباشرة للجنة المختصة ولا تحتاج موافقة المدير المباشر حفاظًا على الخصوصية.</p>
        <div class="employee-form-grid">
          <label class="span-2 checkbox-line"><input type="checkbox" name="hasRelatedEmployee" value="yes" data-toggle-related-employee /> الشكوى ضد موظف معين</label>
          <label class="span-2 related-employee-field hidden">اختيار الموظف<select name="relatedEmployeeId"><option value="">اختر الموظف</option>${employees.map((e)=>`<option value="${escapeHtml(e.id)}">${escapeHtml(e.fullName || e.name || e.email || e.id)}</option>`).join("")}</select></label>
          <label class="span-2">عنوان المشكلة<input name="title" required placeholder="مثال: خلاف أو موقف معين" /></label>
          <label class="span-2 checkbox-line"><input type="checkbox" name="repeatedBefore" value="yes" /> سبق أن تكررت هذه المشكلة</label>
          <label class="span-2 checkbox-line"><input type="checkbox" name="repeatedWithSamePerson" value="yes" /> سبق أن تكررت نفس المشكلة مع نفس الشخص</label>
          <label class="span-2">التفاصيل كاملة<textarea name="description" rows="6" required placeholder="اكتب ماذا حدث، متى، أين، ومن الأطراف إن وجدوا."></textarea></label>
        </div>
        <button class="button primary full" type="submit">رفع إلى لجنة الخلافات</button>
      </form>
      <article class="employee-card full"><h2>طلباتي السابقة</h2>${mine.length ? `<div class="employee-list">${mine.map((item) => `<div class="employee-list-item"><div><strong>${escapeHtml(item.title)}</strong><span>${date(item.createdAt)}</span><small>${escapeHtml(item.publicUpdate || "قيد مراجعة اللجنة")}</small></div><div class="list-item-side">${badge(item.status)}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد شكاوى مسجلة.</div>`}</article>
    </section>
  `, "الشكاوى", "طلب شكوى أو فض خلاف.");
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
  const monthName = cycle.name || `تقييم شهر ${new Date().toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}`;
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
        <div class="panel-kicker">KPI شهري — ${escapeHtml(monthName)}</div>
        <h2>نموذج التقييم الذاتي</h2>
        <p>السكرتير التنفيذي يفتح الدورة. الموظف يقيّم نفسه من يوم 20 إلى 22، ثم HR يضيف بنوده، ثم المدير المباشر يعتمد خلال 3 أيام، ثم يرفع للسكرتير التنفيذي.</p>
        <div class="employee-actions-row"><span class="login-feature">الحالة: ${badge(mine.status || "closed")}</span><span class="login-feature">الإجمالي التقديري: ${escapeHtml(total)}%</span><span class="login-feature">النموذج: ${escapeHtml(windowInfo.isOpen === false ? "مغلق" : "مفتوح")}</span></div>
      </article>
      <form class="employee-card full" id="kpi-self-form">
        <div class="kpi-slider-stack">
          ${kpiSlider({ name: "targetPercent", label: "تحقيق الأهداف", weight: 40, value: mine.targetPercent ?? mine.targetScore })}
          ${kpiSlider({ name: "efficiencyPercent", label: "الكفاءة في أداء المهام", weight: 20, value: mine.efficiencyPercent ?? mine.efficiencyScore })}
          ${kpiSlider({ name: "conductPercent", label: "حسن التعامل والسلوك", weight: 5, value: mine.conductPercent ?? mine.conductScore })}
          ${kpiSlider({ name: "initiativesPercent", label: "التبرعات والمبادرات", weight: 5, value: mine.initiativesPercent ?? mine.initiativesScore })}
          <div class="employee-card-subtle"><strong>بنود HR فقط — 30 درجة</strong><p>الحضور والانصراف 20%، الصلاة في المسجد 5%، وحضور حلقة الشيخ وليد 5%. تظهر للموظف للعلم فقط ولا يمكن تعديلها هنا.</p></div>
          ${kpiSlider({ name: "attendancePercent", label: "الحضور والانصراف — HR", weight: 20, value: mine.attendancePercent ?? mine.attendanceScore, readonly: true })}
          ${kpiSlider({ name: "quranPercent", label: "حلقة الشيخ وليد — HR", weight: 5, value: mine.quranPercent ?? mine.quranCircleScore, readonly: true })}
          ${kpiSlider({ name: "prayerPercent", label: "الصلاة في المسجد — HR", weight: 5, value: mine.prayerPercent ?? mine.prayerScore, readonly: true })}
          <label>ملاحظاتي للمدير<textarea name="employeeNotes" rows="4">${escapeHtml(mine.employeeNotes || "")}</textarea></label>
        </div>
        <input type="hidden" name="employeeId" value="${escapeHtml(employeeId)}" />
        <input type="hidden" name="cycleName" value="${escapeHtml(monthName)}" />
        <input type="hidden" name="status" value="employee_submitted" />
        <button class="button primary full" type="submit" ${windowInfo.isOpen === false ? "disabled" : ""}>رفع التقييم للمدير المباشر</button>
        ${windowInfo.isOpen === false ? `<p class="form-hint danger-text">النموذج غير مفتوح حاليًا. يفتحه السكرتير التنفيذي حسب دورة التقييم.</p>` : ""}
      </form>
      <article class="employee-card full"><h2>مسار الاعتماد</h2><div class="employee-list">
        ${["الموظف يرسل تقييمه خلال 48 ساعة", "HR يضيف الحضور والانصراف والصلاة وحلقة القرآن", "المدير المباشر يراجع ويعتمد خلال 3 أيام", "السكرتير التنفيذي يراجع ويجهز PDF", "الاعتماد النهائي والأرشفة"].map((step, index) => `<div class="employee-list-item"><div><strong>${index + 1}. ${escapeHtml(step)}</strong></div><div class="list-item-side">${index === 0 && mine.status ? badge(mine.status) : ""}</div></div>`).join("")}
      </div></article>
    </section>
  `, "تقييمي", "نموذج KPI الشهري الخاص بالموظف.");
  app.querySelectorAll('.kpi-slider-field input[type="range"]').forEach((input) => input.addEventListener("input", () => {
    const weight = Number(input.dataset.weight || 0);
    const pct = Number(input.value || 0);
    const meta = input.closest('.kpi-slider-field')?.querySelector('.kpi-slider-meta');
    const bar = input.closest('.kpi-slider-field')?.querySelector('.kpi-progress i');
    if (meta) meta.innerHTML = `<b>${pct}%</b><small>الوزن ${weight} — المحتسب ${(pct * weight / 100).toFixed(1)}/${weight}</small>`;
    if (bar) bar.style.width = `${pct}%`;
  }));
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


async function renderTeam() {
  const [employees, leaves, missions, attendance] = await Promise.all([
    endpoints.employees().then(unwrap).catch(() => []),
    endpoints.leaves().then(unwrap).catch(() => []),
    endpoints.missions().then(unwrap).catch(() => []),
    endpoints.myAttendanceEvents().then(unwrap).catch(() => []),
  ]);
  const myId = state.user?.employeeId || state.user?.employee?.id;
  const team = employees.filter((e) => e.managerId === myId || e.directManagerId === myId || e.managerEmployeeId === myId);
  const teamIds = new Set(team.map((e) => e.id));
  const pendingLeaves = leaves.filter((x) => teamIds.has(x.employeeId) && /pending/i.test(String(x.workflowStatus || x.status || "")));
  const pendingMissions = missions.filter((x) => teamIds.has(x.employeeId) && /pending/i.test(String(x.workflowStatus || x.status || "")));
  shell(`
    <section class="employee-grid team-manager-page">
      <article class="employee-card full"><div class="panel-kicker">إدارة الفريق</div><h2>فريقي</h2><p>هذه الصفحة تظهر للمدير المباشر لمراجعة طلبات الفريق قبل انتقالها إلى HR.</p></article>
      <article class="employee-card full"><h2>موظفو فريقي</h2>${team.length ? `<div class="employee-list">${team.map((e)=>`<div class="employee-list-item"><div>${employeeHeaderCell(e)}</div><div class="list-item-side">${badge(e.status || "ACTIVE")}</div></div>`).join("")}</div>` : `<div class="empty-state">لا توجد بيانات فريق مرتبطة بحسابك حتى الآن.</div>`}</article>
      <article class="employee-card full"><h2>طلبات إجازة تنتظر مراجعتي</h2>${pendingLeaves.length ? renderManagerReviewList(pendingLeaves, "leave") : `<div class="empty-state">لا توجد إجازات معلقة للمدير.</div>`}</article>
      <article class="employee-card full"><h2>طلبات مأمورية تنتظر مراجعتي</h2>${pendingMissions.length ? renderManagerReviewList(pendingMissions, "mission") : `<div class="empty-state">لا توجد مأموريات معلقة للمدير.</div>`}</article>
    </section>
  `, "فريقي", "اعتماد طلبات الفريق ومتابعة الحضور.");
  app.querySelectorAll("[data-manager-review]").forEach((button)=>button.addEventListener("click", async()=>{
    const [kind, id, action] = button.dataset.managerReview.split(":");
    const note = "";
    try {
      if (kind === "leave") await endpoints.updateLeave(id, action === "approve" ? "manager_approve" : "reject", { managerNote: note });
      if (kind === "mission") await endpoints.updateMission(id, action === "approve" ? "manager_approve" : "reject", { managerNote: note });
      setMessage(action === "approve" ? "تم اعتماد الطلب وتحويله إلى HR." : "تم رفض الطلب.", "");
      renderTeam();
    } catch (error) { setMessage("", error.message || "تعذر حفظ قرار المدير."); renderTeam(); }
  }));
}

function renderManagerReviewList(items = [], kind = "leave") {
  return `<div class="employee-list">${items.map((item)=>`<div class="employee-list-item"><div><strong>${escapeHtml(item.title || item.leaveType || item.destinationName || "طلب")}</strong><span>${escapeHtml(item.startDate || item.plannedStart || item.createdAt || "-")}</span><small>${escapeHtml(item.reason || item.notes || item.destinationName || "")}</small></div><div class="list-item-side"><button class="button primary small" data-manager-review="${kind}:${escapeHtml(item.id)}:approve">اعتماد</button><button class="button danger small" data-manager-review="${kind}:${escapeHtml(item.id)}:reject">رفض</button></div></div>`).join("")}</div>`;
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
    if (key === "team") return renderTeam();
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
