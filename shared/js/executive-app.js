import { endpoints, unwrap } from "./api.js?v=v31-production-deploy-ready-keep-dev-files";

const app = document.querySelector("#app");
const EMPLOYEE_PORTAL = "../employee/index.html#home";
const ADMIN_PORTAL = "../operations-gate/?next=../admin/";

const state = {
  route: location.hash.replace("#", "") || "home",
  user: null,
  message: "",
  error: "",
  loginIdentifier: localStorage.getItem("hr.login.lastIdentifier") || "",
  loginPassword: "",
  lastLoginFailed: false,
  dataCache: null,
};

const bundledEmployeePhotos = Object.freeze({});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function date(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toLocaleString("ar-EG");
}

function dateOnly(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toLocaleDateString("ar-EG");
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try { return normalizeList(JSON.parse(trimmed)); } catch { return trimmed.split(/[ØŒ,\s]+/).map((item) => item.trim()).filter(Boolean); }
  }
  if (value && typeof value === "object") {
    if (Array.isArray(value.permissions)) return normalizeList(value.permissions);
    if (Array.isArray(value.scopes)) return normalizeList(value.scopes);
    return Object.entries(value).filter(([, enabled]) => enabled === true || enabled === "true" || enabled === 1 || enabled === "1").map(([scope]) => scope);
  }
  return [];
}

function roleMeta(user = state.user) {
  const role = user?.role;
  if (role && typeof role === "object") {
    return {
      id: role.id || user?.roleId || "",
      key: role.key || role.slug || role.code || "",
      slug: role.slug || role.key || "",
      name: role.name || role.label || user?.roleName || "",
      permissions: normalizeList(role.permissions),
    };
  }
  return {
    id: user?.roleId || "",
    key: user?.roleKey || user?.roleSlug || user?.role || "",
    slug: user?.roleSlug || user?.roleKey || user?.role || "",
    name: user?.roleName || user?.role || user?.employee?.role?.name || "",
    permissions: normalizeList(user?.employee?.role?.permissions),
  };
}

function currentPermissions(user = state.user) {
  return new Set([
    ...normalizeList(user?.permissions),
    ...normalizeList(user?.permissionScopes),
    ...normalizeList(user?.scopes),
    ...normalizeList(user?.profile?.permissions),
    ...roleMeta(user).permissions,
  ]);
}

function roleLabel(user = state.user) {
  const role = roleMeta(user);
  return role.name || role.key || role.slug || "Ø¯ÙˆØ± ØªÙ†ÙÙŠØ°ÙŠ";
}

function isExecutivePortalUser(user = state.user) {
  if (!user) return false;
  const role = roleMeta(user);
  const permissions = currentPermissions(user);
  const text = [role.id, role.key, role.slug, role.name, user?.roleId, user?.jobTitle, user?.employee?.jobTitle]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return permissions.has("*")
    || permissions.has("executive:mobile")
    || permissions.has("live-location:request")
    || text.includes("executive")
    || text.includes("ØªÙ†ÙÙŠØ°ÙŠ")
    || text.includes("Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ")
    || text.includes("Ø³ÙƒØ±ØªÙŠØ±");
}

function canOpenAdminPortal(user = state.user) {
  const role = roleMeta(user);
  const permissions = currentPermissions(user);
  const keys = [role.id, role.key, role.slug, role.name].filter(Boolean).map((item) => String(item).toLowerCase());
  const adminRole = keys.some((key) => ["role-admin", "admin", "Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…"].includes(key));
  return adminRole || permissions.has("*") || permissions.has("employees:view") || permissions.has("dashboard:view");
}

function normalizeGateIdentifier(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  const ar = "Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©";
  const fa = "Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹";
  const digits = raw.replace(/[Ù -Ù©]/g, (d) => String(ar.indexOf(d))).replace(/[Û°-Û¹]/g, (d) => String(fa.indexOf(d))).replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  if (digits.startsWith("20") && digits.length >= 12) return `0${digits.slice(2)}`;
  if (digits.length === 10 && digits.startsWith("1")) return `0${digits}`;
  return digits;
}

function gateIdentityForPortal(target = "executive") {
  if (sessionStorage.getItem("hr.opsGatewayUnlockedTarget") !== target) return "";
  return sessionStorage.getItem("hr.ops.gate.identity") || sessionStorage.getItem("hr.ops.gate.email") || "";
}

function sessionMatchesGateIdentity(user = state.user, target = "executive") {
  const gateIdentity = normalizeGateIdentifier(gateIdentityForPortal(target));
  if (!gateIdentity || !user) return true;
  const employee = user.employee || {};
  const tokens = [
    user.email, user.phone, user.mobile, user.identifier, user.fullName, user.name,
    employee.email, employee.phone, employee.mobile, employee.fullName,
  ].map(normalizeGateIdentifier).filter(Boolean);
  return tokens.includes(gateIdentity);
}

async function enforceGateSessionIdentity(target = "executive") {
  const gateIdentity = gateIdentityForPortal(target);
  if (!gateIdentity || !state.user || sessionMatchesGateIdentity(state.user, target)) return false;
  await endpoints.logout().catch(() => null);
  state.user = null;
  state.dataCache = null;
  state.loginIdentifier = gateIdentity;
  state.loginPassword = "";
  state.lastLoginFailed = false;
  setMessage("", "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø®Ø±ÙˆØ¬ Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ù„Ø£Ù†Ù‡Ø§ Ù„Ø§ ØªØ·Ø§Ø¨Ù‚ Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø°ÙŠ ÙØªØ­ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø©. Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.");
  renderLogin();
  return true;
}

function statusLabel(value) {
  return {
    ACTIVE: "Ù†Ø´Ø·",
    INACTIVE: "ØºÙŠØ± Ù…ÙØ¹Ù„",
    PRESENT: "Ø­Ø§Ø¶Ø±",
    CHECKED_OUT: "Ø§Ù†ØµØ±Ù",
    LATE: "Ù…ØªØ£Ø®Ø±",
    ABSENT: "ØºØ§Ø¦Ø¨",
    ON_LEAVE: "Ø¥Ø¬Ø§Ø²Ø©",
    LEAVE: "Ø¥Ø¬Ø§Ø²Ø©",
    ON_MISSION: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©",
    MISSION: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©",
    CHECK_IN: "Ø­Ø¶ÙˆØ±",
    CHECK_OUT: "Ø§Ù†ØµØ±Ø§Ù",
    PENDING: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    OPEN: "Ù…ÙØªÙˆØ­Ø©",
    CLOSED: "Ù…ØºÙ„Ù‚Ø©",
    RESOLVED: "ØªÙ… Ø§Ù„Ø­Ù„",
    ESCALATED: "Ù…Ø±ÙÙˆØ¹Ø© Ù„Ù„ØªÙ†ÙÙŠØ°ÙŠ",
    IN_REVIEW: "Ù‚ÙŠØ¯ Ø§Ù„Ù„Ø¬Ù†Ø©",
    APPROVED: "Ù…Ø¹ØªÙ…Ø¯",
    REJECTED: "Ù…Ø±ÙÙˆØ¶",
    LIVE_SHARED: "Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± Ù…Ø±Ø³Ù„",
    ACTION_REQUIRED: "Ø¥Ø¬Ø±Ø§Ø¡ Ù…Ø·Ù„ÙˆØ¨",
    SELF_SUBMITTED: "Ù…Ø±Ø³Ù„ Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù",
    MANAGER_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ±",
    HR_REVIEWED: "Ù…Ø±Ø§Ø¬Ø¹Ø© HR",
    SECRETARY_REVIEWED: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø³ÙƒØ±ØªÙŠØ±",
    EXECUTIVE_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ",
    inside_branch: "Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø·Ø§Ù‚",
    outside_branch: "Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø·Ø§Ù‚",
    inside_mission: "Ø¯Ø§Ø®Ù„ Ù…Ø£Ù…ÙˆØ±ÙŠØ©",
    location_unavailable: "Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…ØªØ§Ø­",
  }[value] || value || "-";
}

function badge(value) {
  return `<span class="status ${escapeHtml(value || "unknown")}">${escapeHtml(statusLabel(value))}</span>`;
}

function initials(name) {
  return String(name || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("") || "?";
}

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

function avatar(person = {}, size = "") {
  const src = resolveAvatarUrl(person?.photoUrl || person?.avatarUrl || person?.employee?.photoUrl || person?.employee?.avatarUrl || bundledEmployeePhoto(person));
  const label = initials(person?.fullName || person?.name || person?.employee?.fullName || person?.employee?.name);
  if (src) return `<img class="avatar ${size}" src="${escapeHtml(src)}" alt="${escapeHtml(person.fullName || person.name || person?.employee?.fullName || "")}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling&&this.nextElementSibling.classList.remove('hidden')" /><span class="avatar fallback ${size} hidden">${escapeHtml(label)}</span>`;
  return `<span class="avatar fallback ${size}">${escapeHtml(label)}</span>`;
}

function userAvatarSubject(user = state.user) {
  const employee = user?.employee || {};
  return {
    ...employee,
    fullName: employee.fullName || user?.fullName || user?.name || user?.email || "Ù…Ø³ØªØ®Ø¯Ù…",
    name: employee.fullName || user?.name || user?.fullName || user?.email || "Ù…Ø³ØªØ®Ø¯Ù…",
    photoUrl: user?.avatarUrl || user?.photoUrl || employee.photoUrl || employee.avatarUrl || "",
    avatarUrl: user?.avatarUrl || user?.photoUrl || employee.photoUrl || employee.avatarUrl || "",
  };
}

function setMessage(message = "", error = "") {
  state.message = message;
  state.error = error;
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

function askText({ title = "Ø·Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª", message = "Ø§ÙƒØªØ¨ Ø§Ù„ØªÙØ§ØµÙŠÙ„", defaultValue = "", confirmLabel = "Ø¥Ø±Ø³Ø§Ù„", cancelLabel = "Ø¥Ù„ØºØ§Ø¡" } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <form class="confirm-modal prompt-modal">
        <div class="panel-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div></div>
        <label class="span-2">Ø§Ù„Ø³Ø¨Ø¨<textarea name="answer" rows="3">${escapeHtml(defaultValue)}</textarea></label>
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

function readForm(form) {
  return Object.fromEntries(new FormData(form));
}

function table(headers, rows, className = "") {
  return `
    <div class="table-wrap ${className}">
      <table>
        <thead><tr>${headers.map((item) => `<th>${escapeHtml(item)}</th>`).join("")}</tr></thead>
        <tbody>${rows.length ? rows.join("") : `<tr><td colspan="${headers.length}" class="empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù…Ø·Ø§Ø¨Ù‚Ø©</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

function routeKey() {
  return state.route.split("?")[0];
}

function routeParams() {
  return new URLSearchParams(state.route.split("?")[1] || "");
}

function setRoute(key, params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") query.set(name, String(value));
  });
  location.hash = query.toString() ? `${key}?${query}` : key;
}

function todayText() {
  return new Date().toLocaleDateString("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function metric(label, value, helper = "") {
  return `<article class="metric exec-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 0)}</strong><small>${escapeHtml(helper)}</small></article>`;
}

function employeeStatus(employee) {
  return employee?.today?.status || "ABSENT";
}

function employeeRisk(employee) {
  const status = employeeStatus(employee);
  if (employee.today?.pendingLiveRequest) return { level: "PENDING", label: "Ù…ÙˆÙ‚Ø¹ Ù…Ø¹Ù„Ù‚", text: "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø±Ø¯ Ø§Ù„Ù…ÙˆØ¸Ù" };
  if (status === "ABSENT") return { level: "HIGH", label: "ÙŠØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©", text: "ØºØ§Ø¦Ø¨ Ø§Ù„ÙŠÙˆÙ…" };
  if (status === "LATE") return { level: "MEDIUM", label: "Ù…ØªØ£Ø®Ø±", text: "Ø³Ø¬Ù„ Ø­Ø¶ÙˆØ± Ù…ØªØ£Ø®Ø±" };
  if (status === "PRESENT") return { level: "LOW", label: "Ù…Ø³ØªÙ‚Ø±", text: "Ø­Ø§Ø¶Ø± Ø§Ù„Ø¢Ù†" };
  return { level: "LOW", label: "Ù…ØªØ§Ø¨Ø¹Ø© Ø¹Ø§Ø¯ÙŠØ©", text: statusLabel(status) };
}

function summaryCounts(data = {}) {
  const counts = data.counts || {};
  return {
    total: counts.total || 0,
    present: counts.present || 0,
    late: counts.late || 0,
    absent: counts.absent || 0,
    onLeave: counts.onLeave || 0,
    onMission: counts.onMission || 0,
    pendingLiveLocations: counts.pendingLiveLocations || 0,
    checkedOut: counts.checkedOut || 0,
  };
}

async function loadExecutiveData(force = false) {
  if (!force && state.dataCache) return state.dataCache;
  state.dataCache = unwrap(await endpoints.executiveMobile());
  return state.dataCache;
}

function shell(content, title = "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©", description = "") {
  const active = routeKey();
  const user = state.user || {};
  app.innerHTML = `
    <div class="executive-shell">
      <header class="executive-topbar">
        <div class="executive-brand">
          <img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" />
          <div><strong>Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©</strong><span>Control View â€” Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨</span></div>
        </div>
        <nav class="executive-tabs" aria-label="Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ">
          <button class="${active === "home" ? "is-active" : ""}" data-route="home">Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</button>
          <button class="${active === "employees" ? "is-active" : ""}" data-route="employees">Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†</button>
          <button class="${active === "presence" ? "is-active" : ""}" data-route="presence">Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø­Ø¶ÙˆØ±</button>
          <button class="${active === "risk" ? "is-active" : ""}" data-route="risk">Ù…Ø®Ø§Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©</button>
          <button class="${active === "actions" ? "is-active" : ""}" data-route="actions">Ù…Ø·Ù„ÙˆØ¨ Ù‚Ø±Ø§Ø±</button>
          <button class="${active === "decisions" ? "is-active" : ""}" data-route="decisions">Ù‚Ø±Ø§Ø±Ø§Øª</button>
          <button class="${active === "disputes" ? "is-active" : ""}" data-route="disputes">Ù„Ø¬Ù†Ø© Ø§Ù„Ø®Ù„Ø§ÙØ§Øª</button>
        </nav>
        <div class="executive-user">
          <span class="user-chip">${avatar(userAvatarSubject(), "tiny")}<span>${escapeHtml(user.name || user.fullName || "Ù…Ø³ØªØ®Ø¯Ù…")}</span></span>
          <button class="button ghost" data-action="employee-portal">ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù</button>
          ${canOpenAdminPortal() ? `<button class="button ghost" data-action="admin-portal">Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ø¯Ù…Ù†</button>` : ""}
          <button class="button danger" data-action="logout">Ø®Ø±ÙˆØ¬</button>
        </div>
      </header>
      <main class="executive-main">
        <section class="executive-page-head">
          <div><p class="panel-kicker">${escapeHtml(todayText())}</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>
          <div class="role-chip">${escapeHtml(roleLabel())}</div>
        </section>
        ${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ""}
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${content}
      </main>
    </div>
  `;
  app.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => setRoute(button.dataset.route)));
  app.querySelector('[data-action="employee-portal"]')?.addEventListener("click", () => { window.location.href = EMPLOYEE_PORTAL; });
  app.querySelector('[data-action="admin-portal"]')?.addEventListener("click", () => { window.location.href = ADMIN_PORTAL; });
  app.querySelector('[data-action="logout"]')?.addEventListener("click", async () => {
    const ok = await confirmAction({ title: "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬", message: "Ù‡Ù„ ØªØ±ÙŠØ¯ Ø§Ù„Ø®Ø±ÙˆØ¬ Ù…Ù† Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©ØŸ", confirmLabel: "Ø®Ø±ÙˆØ¬", danger: true });
    if (!ok) return;
    await endpoints.logout();
    state.user = null;
    state.dataCache = null;
    renderLogin();
  });
}

function renderLogin() {
  const identifierValue = state.loginIdentifier || gateIdentityForPortal("executive") || "";
  const passwordValue = state.loginPassword || "";
  app.innerHTML = `
    <div class="login-screen executive-login-screen">
      <form class="login-panel executive-login-panel" id="login-form" novalidate>
        <div class="login-mark">EX</div>
        <h1>Ø¯Ø®ÙˆÙ„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©</h1>
        <p>Ù‡Ø°Ù‡ ÙˆØ§Ø¬Ù‡Ø© Ù…Ø®ØªØµØ±Ø© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ: Ù…Ø¤Ø´Ø±Ø§ØªØŒ Ù…ØªØ§Ø¨Ø¹Ø© Ù…ÙˆØ¸ÙÙŠÙ†ØŒ ÙˆØ·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± ÙÙ‚Ø·.</p>
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${state.lastLoginFailed ? `<div class="message warning compact">ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¨Ø±ÙŠØ¯/Ø§Ù„Ù‡Ø§ØªÙ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±. Ù„Ù† ÙŠØªÙ… Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙƒØªÙˆØ¨Ø©.</div>` : ""}
        <label>Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø£Ùˆ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø§Ø³Ù…<input name="identifier" value="${escapeHtml(identifierValue)}" autocomplete="username" required /></label>
        <label>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±<input name="password" type="password" value="${escapeHtml(passwordValue)}" autocomplete="current-password" required /></label>
        <button class="button primary full" type="submit">ÙØªØ­ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©</button>
        <button class="button ghost full" type="button" data-employee-login>Ø§Ù„Ø°Ù‡Ø§Ø¨ Ù„ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù</button>
      </form>
    </div>
  `;
  const form = app.querySelector("#login-form");
  form.addEventListener("input", () => {
    const values = readForm(form);
    state.loginIdentifier = values.identifier || "";
    state.loginPassword = values.password || "";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    state.loginIdentifier = values.identifier || "";
    state.loginPassword = values.password || "";
    if (state.loginIdentifier) localStorage.setItem("hr.login.lastIdentifier", state.loginIdentifier);
    try {
      state.user = unwrap(await endpoints.login(values.identifier, values.password));
      await endpoints.adminAccessLog?.({ action: "executive.login.success", result: "SUCCESS", route: location.hash || "executive" }).catch(() => null);
      state.loginPassword = "";
      state.lastLoginFailed = false;
      if (!isExecutivePortalUser(state.user)) {
        window.location.href = EMPLOYEE_PORTAL;
        return;
      }
      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©.", "");
      render();
    } catch (error) {
      await endpoints.adminAccessLog?.({ action: "executive.login.failed", result: "FAILED", metadata: { identifier: state.loginIdentifier } }).catch(() => null);
      state.lastLoginFailed = true;
      setMessage("", error.message || "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.");
      renderLogin();
    }
  });
  app.querySelector("[data-employee-login]")?.addEventListener("click", () => { window.location.href = EMPLOYEE_PORTAL; });
}

async function renderHome() {
  const data = await loadExecutiveData();
  const counts = summaryCounts(data);
  const employees = data.employees || [];
  const needsAttention = employees.filter((employee) => ["ABSENT", "LATE"].includes(employeeStatus(employee)) || employee.today?.pendingLiveRequest).slice(0, 8);
  const activeNow = employees.filter((employee) => ["PRESENT", "LATE"].includes(employeeStatus(employee))).slice(0, 8);
  const readiness = counts.total ? Math.round(((counts.present + counts.checkedOut + counts.onLeave + counts.onMission) / counts.total) * 100) : 0;
  shell(`
    <section class="executive-hero panel">
      <div>
        <p class="panel-kicker">Executive Control View</p>
        <h2>Ù†Ø¸Ø±Ø© ÙˆØ§Ø­Ø¯Ø© ØªÙƒÙÙŠ Ù„Ø§ØªØ®Ø§Ø° Ù‚Ø±Ø§Ø± Ø§Ù„ÙŠÙˆÙ…</h2>
        <p>ØªÙ… ÙØµÙ„ Ù‡Ø°Ù‡ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø¹Ù† Ø§Ù„Ø£Ø¯Ù…Ù†: Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ØªÙ‚Ù†ÙŠØ©ØŒ Ù„Ø§ ØªØ­Ø¯ÙŠØ«Ø§Øª DatabaseØŒ ÙˆÙ„Ø§ Ø¥Ø¯Ø§Ø±Ø© ØµÙ„Ø§Ø­ÙŠØ§Øª. ÙÙ‚Ø· Ù…ØªØ§Ø¨Ø¹Ø© ÙˆÙ‚Ø±Ø§Ø±Ø§Øª.</p>
      </div>
      <div class="score-ring"><strong>${escapeHtml(readiness)}%</strong><span>Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„ÙŠÙˆÙ…</span></div>
    </section>
    <section class="metric-grid executive-metric-grid">
      ${metric("Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†", counts.total, "ÙƒÙ„ Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù†Ø´Ø·Ø©")}
      ${metric("Ø­Ø§Ø¶Ø± Ø§Ù„Ø¢Ù†", counts.present, "Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ÙŠÙˆÙ…ÙŠØ©")}
      ${metric("Ù…ØªØ£Ø®Ø±", counts.late, "ÙŠØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©")}
      ${metric("ØºØ§Ø¦Ø¨", counts.absent, "Ø£ÙˆÙ„ÙˆÙŠØ© ØªÙˆØ§ØµÙ„")}
      ${metric("Ø¥Ø¬Ø§Ø²Ø§Øª", counts.onLeave, "Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡Ø§")}
      ${metric("Ù…ÙˆØ§Ù‚Ø¹ Ù…Ø¹Ù„Ù‚Ø©", counts.pendingLiveLocations, "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø±Ø¯")}
    </section>
    <section class="grid executive-focus-grid">
      <article class="panel span-7">
        <div class="panel-head"><div><h2>Ù…Ø·Ù„ÙˆØ¨ Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¢Ù†</h2><p>Ø£Ø´Ø®Ø§Øµ ÙŠØ­ØªØ§Ø¬ÙˆÙ† Ù‚Ø±Ø§Ø± Ø£Ùˆ Ø§ØªØµØ§Ù„ Ø³Ø±ÙŠØ¹.</p></div><button class="button ghost" data-route="actions">Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„</button></div>
        <div class="employee-card-grid compact-cards">
          ${needsAttention.map((employee) => employeeCard(employee)).join("") || `<div class="empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¹Ù†Ø§ØµØ± Ø¹Ø§Ø¬Ù„Ø© Ø­Ø§Ù„ÙŠÙ‹Ø§.</div>`}
        </div>
      </article>
      <article class="panel span-5">
        <div class="panel-head"><div><h2>Ø­Ø§Ø¶Ø±ÙˆÙ† Ø§Ù„Ø¢Ù†</h2><p>Ø£ÙˆÙ„ Ø¹ÙŠÙ†Ø© Ù…Ù† Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ù…Ø³Ø¬Ù„ÙŠÙ† Ø§Ù„ÙŠÙˆÙ….</p></div><button class="button ghost" data-route="employees">Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†</button></div>
        ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¢Ø®Ø± Ø­Ø±ÙƒØ©"], activeNow.map((employee) => `<tr><td class="person-cell">${avatar(employee, "tiny")}<span>${escapeHtml(employee.fullName || "-")}</span></td><td>${badge(employeeStatus(employee))}</td><td>${escapeHtml(date(employee.today?.checkInAt || employee.today?.checkOutAt || employee.today?.latestLocation?.date))}</td></tr>`))}
      </article>
    </section>
  `, "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©", "Ù…Ø®ØªØµØ± Ù…ØªØ§Ø¨Ø¹Ø© ÙŠÙˆÙ…ÙŠ Ù…Ù†Ø§Ø³Ø¨ Ù„Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ ÙˆÙ„Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø³Ø±ÙŠØ¹Ø©.");
  bindEmployeeCardActions();
}

function employeeCard(employee) {
  const risk = employeeRisk(employee);
  const status = employeeStatus(employee);
  return `
    <article class="mini-card executive-employee-card risk-${escapeHtml(risk.level)}">
      <button class="avatar-button" data-view-employee="${escapeHtml(employee.id)}">${avatar(employee, "large")}</button>
      <div class="employee-card-main">
        <strong>${escapeHtml(employee.fullName || "-")}</strong>
        <small>${escapeHtml(employee.jobTitle || "")}${employee.manager?.fullName ? ` â€” ${escapeHtml(employee.manager.fullName)}` : ""}</small>
        <span class="risk-line">${escapeHtml(risk.label)}: ${escapeHtml(risk.text)}</span>
      </div>
      <div class="mini-card-actions">
        ${badge(status)}
        <button class="button ghost" data-view-employee="${escapeHtml(employee.id)}">ØªÙØ§ØµÙŠÙ„</button>
        <button class="button primary" data-request-live="${escapeHtml(employee.id)}">Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹</button>
      </div>
    </article>
  `;
}

async function renderEmployees() {
  const params = routeParams();
  const data = await loadExecutiveData();
  const q = String(params.get("q") || "").trim().toLowerCase();
  const status = String(params.get("status") || "").trim();
  const employees = (data.employees || []).filter((employee) => {
    const text = [employee.fullName, employee.phone, employee.email, employee.jobTitle, employee.manager?.fullName].join(" ").toLowerCase();
    return (!q || text.includes(q)) && (!status || employeeStatus(employee) === status);
  });
  shell(`
    <section class="panel">
      <div class="panel-head"><div><h2>Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ† Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©</h2><p>Ø¹Ø±Ø¶ Ù…Ø®ØªØµØ± Ø¨Ø¯ÙˆÙ† Ø£Ø¯ÙˆØ§Øª ØªØ¹Ø¯ÙŠÙ„ Ø£Ùˆ Ø­Ø°Ù Ø£Ùˆ ØµÙ„Ø§Ø­ÙŠØ§Øª ØªÙ‚Ù†ÙŠØ©.</p></div><button class="button ghost" data-refresh-executive>ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª</button></div>
      <form class="filters executive-filters" id="executive-filters">
        <input name="q" placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ù…Ø³Ù…Ù‰" value="${escapeHtml(q)}" />
        <select name="status">
          <option value="">ÙƒÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª</option>
          ${[["PRESENT", "Ø­Ø§Ø¶Ø±"], ["LATE", "Ù…ØªØ£Ø®Ø±"], ["ABSENT", "ØºØ§Ø¦Ø¨"], ["ON_LEAVE", "Ø¥Ø¬Ø§Ø²Ø©"], ["ON_MISSION", "Ù…Ø£Ù…ÙˆØ±ÙŠØ©"], ["CHECKED_OUT", "Ø§Ù†ØµØ±Ù"]].map(([value, label]) => `<option value="${escapeHtml(value)}" ${status === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
        <button class="button ghost" type="submit">ØªØ·Ø¨ÙŠÙ‚</button>
      </form>
    </section>
    <section class="employee-card-grid executive-list-grid">
      ${employees.map((employee) => employeeCard(employee)).join("") || `<div class="empty panel">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø©.</div>`}
    </section>
  `, "Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†", "Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø®ØªØµØ±Ø© Ù„ÙƒÙ„ Ù…ÙˆØ¸Ù ÙˆØ­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ….");
  app.querySelector("#executive-filters")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    setRoute("employees", values);
  });
  app.querySelector("[data-refresh-executive]")?.addEventListener("click", async () => { state.dataCache = null; await renderEmployees(); });
  bindEmployeeCardActions();
}

async function renderActions() {
  const data = await loadExecutiveData();
  const employees = data.employees || [];
  const pendingLocation = employees.filter((employee) => employee.today?.pendingLiveRequest);
  const absent = employees.filter((employee) => employeeStatus(employee) === "ABSENT");
  const late = employees.filter((employee) => employeeStatus(employee) === "LATE");
  shell(`
    <section class="grid executive-focus-grid">
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ù…Ø·Ù„ÙˆØ¨ Ù‚Ø±Ø§Ø± Ø£Ùˆ Ù…ØªØ§Ø¨Ø¹Ø©</h2><p>Ù‡Ø°Ù‡ Ø§Ù„Ø´Ø§Ø´Ø© ØªØ¬Ù…Ø¹ Ø§Ù„Ø­Ø§Ù„Ø§Øª Ø§Ù„ØªÙŠ ØªØ­ØªØ§Ø¬ ØªØ¯Ø®Ù„Ù‹Ø§ Ø³Ø±ÙŠØ¹Ù‹Ø§ Ø¨Ø¯ÙˆÙ† Ø¯Ø®ÙˆÙ„ Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ø¯Ù…Ù†.</p></div><button class="button ghost" data-route="employees">ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</button></div>
      </article>
      <article class="panel span-4"><h3>Ù…ÙˆØ§Ù‚Ø¹ Ù…Ø¹Ù„Ù‚Ø©</h3>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø¥Ø¬Ø±Ø§Ø¡"], pendingLocation.map((employee) => `<tr><td class="person-cell">${avatar(employee, "tiny")}<span>${escapeHtml(employee.fullName || "-")}</span></td><td><button class="button small ghost" data-view-employee="${escapeHtml(employee.id)}">ÙØªØ­</button></td></tr>`))}</article>
      <article class="panel span-4"><h3>ØºÙŠØ§Ø¨ Ø§Ù„ÙŠÙˆÙ…</h3>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø¥Ø¬Ø±Ø§Ø¡"], absent.slice(0, 40).map((employee) => `<tr><td class="person-cell">${avatar(employee, "tiny")}<span>${escapeHtml(employee.fullName || "-")}</span></td><td><button class="button small primary" data-request-live="${escapeHtml(employee.id)}">Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹</button></td></tr>`))}</article>
      <article class="panel span-4"><h3>ØªØ£Ø®ÙŠØ± Ø§Ù„ÙŠÙˆÙ…</h3>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø¢Ø®Ø± Ø­Ø±ÙƒØ©"], late.slice(0, 40).map((employee) => `<tr><td class="person-cell">${avatar(employee, "tiny")}<span>${escapeHtml(employee.fullName || "-")}</span></td><td>${escapeHtml(date(employee.today?.checkInAt))}</td></tr>`))}</article>
    </section>
  `, "Ù…Ø·Ù„ÙˆØ¨ Ù‚Ø±Ø§Ø±", "Ø­Ø§Ù„Ø§Øª Ø§Ù„ØºÙŠØ§Ø¨ ÙˆØ§Ù„ØªØ£Ø®ÙŠØ± ÙˆØ·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©.");
  bindEmployeeCardActions();
}


async function renderPresenceMap() {
  const data = await endpoints.executivePresenceDashboard().then(unwrap);
  const rows = data.rows || [];
  const located = rows.filter((row) => row.lastLocation?.latitude && row.lastLocation?.longitude);
  const missing = rows.filter((row) => !row.lastLocation?.latitude && ["PRESENT", "LATE", "CHECKED_OUT"].includes(row.status));
  shell(`
    <section class="grid executive-focus-grid presence-live-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ø®Ø±ÙŠØ·Ø© Ø­Ø¶ÙˆØ± Ù„Ø­Ø¸ÙŠØ©</h2><p>Ø§Ù„Ø­Ø¶ÙˆØ±ØŒ Ø§Ù„ØªØ£Ø®ÙŠØ±ØŒ Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø·Ø§Ù‚ØŒ ÙˆØ§Ù„Ù…ÙˆØ¸ÙÙˆÙ† Ø§Ù„Ø°ÙŠÙ† Ù„Ù… ÙŠØ±Ø³Ù„ÙˆØ§ Ø§Ù„Ù…ÙˆÙ‚Ø¹.</p></div><button class="button ghost" data-refresh-presence>ØªØ­Ø¯ÙŠØ«</button></div>
        <div class="metric-grid">${metric('Ø­Ø§Ø¶Ø±', data.counts?.PRESENT || 0, 'Ù…ÙˆØ¬ÙˆØ¯')}${metric('Ù…ØªØ£Ø®Ø±', data.counts?.LATE || 0, 'Ù…ØªØ§Ø¨Ø¹Ø©')}${metric('ØºØ§Ø¦Ø¨', data.counts?.ABSENT || 0, 'Ù„Ù… ÙŠØ³Ø¬Ù„')}${metric('Ù„Ù… ÙŠØ±Ø³Ù„ Ù…ÙˆÙ‚Ø¹', missing.length, 'Ø­Ø§Ø¶Ø± Ø¨Ù„Ø§ GPS')}${metric('Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø·Ø§Ù‚', data.counts?.outOfRange || 0, 'ØªØ­Ù‚Ù‚')}</div>
      </article>
      <article class="panel span-12"><h3>Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©</h3><div class="live-map-board">${located.map((row, index) => `<a class="map-pin risk-${escapeHtml(row.risk?.level || 'CLEAR')}" style="--x:${12 + (index * 19) % 74}%;--y:${16 + (index * 29) % 66}%" target="_blank" rel="noopener" href="${escapeHtml(row.mapUrl)}"><strong>${escapeHtml(row.employee?.fullName || row.employeeId)}</strong><span>${escapeHtml(statusLabel(row.status))} Â· ${escapeHtml(row.risk?.score || 0)}%</span></a>`).join('') || '<div class="empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ÙˆØ§Ù‚Ø¹ Ù…ØªØ§Ø­Ø© Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.</div>'}</div></article>
      <article class="panel span-12"><h3>Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„ØªÙØµÙŠÙ„ÙŠØ©</h3>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„Ù…ÙˆÙ‚Ø¹','Ø§Ù„Ø®Ø·Ø±'], rows.map((row) => `<tr><td class="person-cell">${avatar(row.employee,'tiny')}<span>${escapeHtml(row.employee?.fullName || row.employeeId)}</span></td><td>${badge(row.status)}</td><td>${row.mapUrl ? `<a target="_blank" rel="noopener" href="${escapeHtml(row.mapUrl)}">ÙØªØ­ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</a>` : 'Ù„Ù… ÙŠØ±Ø³Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹'}</td><td>${badge(row.risk?.level || 'CLEAR')} ${escapeHtml(row.risk?.score || 0)}%</td></tr>`))}</article>
    </section>
  `, "Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ù„Ø­Ø¸ÙŠØ©", "Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„.");
  app.querySelector('[data-refresh-presence]')?.addEventListener('click', () => renderPresenceMap());
}

async function renderRiskCenter() {
  const data = await endpoints.attendanceRiskCenter({ days: 7 }).then(unwrap);
  const rows = data.rows || [];
  shell(`
    <section class="grid executive-focus-grid attendance-risk-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ù†Ø¸Ø§Ù… ØªÙ‚ÙŠÙŠÙ… Ø®Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©</h2><p>ÙŠÙƒØ´Ù Ø§Ù„ØªÙƒØ±Ø§Ø± Ø§Ù„Ø³Ø±ÙŠØ¹ØŒ Ø§Ù„Ø¬Ù‡Ø§Ø² Ø§Ù„Ø¬Ø¯ÙŠØ¯ØŒ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠØŒ ÙˆØ§Ù„Ø­Ø¶ÙˆØ± Ù…Ù† Ù…Ø³Ø§ÙØ© Ø¨Ø¹ÙŠØ¯Ø©.</p></div><button class="button ghost" data-refresh-risk>Ø¥Ø¹Ø§Ø¯Ø© ÙØ­Øµ</button></div>
        <div class="metric-grid">${metric('Ø¹Ø§Ù„ÙŠ', data.counts?.HIGH || 0, 'ØªØ­Ù‚ÙŠÙ‚')}${metric('Ù…ØªÙˆØ³Ø·', data.counts?.MEDIUM || 0, 'Ù…Ø±Ø§Ø¬Ø¹Ø©')}${metric('Ù…Ù†Ø®ÙØ¶', data.counts?.LOW || 0, 'Ù…ØªØ§Ø¨Ø¹Ø©')}${metric('Ø³Ù„ÙŠÙ…', data.counts?.CLEAR || 0, 'Ù…Ø³ØªÙ‚Ø±')}</div>
      </article>
      <article class="panel span-12">${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø¯Ø±Ø¬Ø©','Ø§Ù„Ø£Ø³Ø¨Ø§Ø¨','Ø¢Ø®Ø± Ø£Ø­Ø¯Ø§Ø«'], rows.map((row) => `<tr><td class="person-cell">${avatar(row.employee,'tiny')}<span>${escapeHtml(row.employee?.fullName || row.employeeId)}</span></td><td>${badge(row.level)} <strong>${escapeHtml(row.score)}%</strong></td><td>${(row.flags || []).map((flag) => `<span class="chip danger-soft">${escapeHtml(flag.label)}</span>`).join('') || '-'}</td><td>${(row.events || []).slice(0,2).map((event) => `${escapeHtml(statusLabel(event.type || event.action || event.status))} ${date(event.eventAt || event.createdAt)}`).join('<br>')}</td></tr>`))}</article>
    </section>
  `, "Ù…Ø®Ø§Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©", "ØªØ­Ù„ÙŠÙ„ ÙÙˆØ±ÙŠ Ù„Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„ØªÙ„Ø§Ø¹Ø¨.");
  app.querySelector('[data-refresh-risk]')?.addEventListener('click', () => renderRiskCenter());
}

async function renderAdminDecisions() {
  const data = await endpoints.adminDecisions().then(unwrap);
  const rows = data.decisions || [];
  shell(`
    <section class="grid executive-focus-grid admin-decisions-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ø³Ø¬Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©</h2><p>Ù‚Ø±Ø§Ø±Ø§Øª Ø±Ø³Ù…ÙŠØ© ØªØ­ØªØ§Ø¬ ØªÙ… Ø§Ù„Ø§Ø·Ù„Ø§Ø¹ ÙˆØªÙˆÙ‚ÙŠØª Ù‚Ø±Ø§Ø¡Ø© Ù…Ù† ÙƒÙ„ Ù…ÙˆØ¸Ù.</p></div><button class="button primary" data-new-decision>Ù‚Ø±Ø§Ø± Ø¬Ø¯ÙŠØ¯</button></div></article>
      <article class="panel span-12">${table(['Ø§Ù„Ù‚Ø±Ø§Ø±','Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©','Ø§Ù„Ù†Ø´Ø±','Ø§Ù„Ø§Ø·Ù„Ø§Ø¹','Ø§Ù„Ù†Øµ'], rows.map((row) => `<tr><td><strong>${escapeHtml(row.title)}</strong></td><td>${badge(row.priority)}</td><td>${date(row.publishedAt || row.createdAt)}</td><td>${escapeHtml((row.acknowledgements || []).length || (row.acknowledged ? 1 : 0))}</td><td>${escapeHtml(row.body || '')}</td></tr>`))}</article>
    </section>
  `, "Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©", "Ø¥ØµØ¯Ø§Ø± ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø±Ø³Ù…ÙŠØ©.");
  app.querySelector('[data-new-decision]')?.addEventListener('click', async () => {
    const title = await askText({ title: 'Ù‚Ø±Ø§Ø± Ø¥Ø¯Ø§Ø±ÙŠ Ø¬Ø¯ÙŠØ¯', message: 'Ø§ÙƒØªØ¨ Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù‚Ø±Ø§Ø±.', defaultValue: 'Ù‚Ø±Ø§Ø± Ø¥Ø¯Ø§Ø±ÙŠ', confirmLabel: 'Ø§Ù„ØªØ§Ù„ÙŠ' });
    if (title === null) return;
    const body = await askText({ title: 'Ù†Øµ Ø§Ù„Ù‚Ø±Ø§Ø±', message: 'Ø§ÙƒØªØ¨ Ù†Øµ Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„Ø°ÙŠ Ø³ÙŠØµÙ„ Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ†.', defaultValue: '', confirmLabel: 'Ù†Ø´Ø±' });
    if (body === null) return;
    await endpoints.createAdminDecision({ title, body, priority: 'HIGH', scope: 'ALL' });
    setMessage('ØªÙ… Ù†Ø´Ø± Ø§Ù„Ù‚Ø±Ø§Ø± ÙˆØ¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø± Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ†.', '');
    renderAdminDecisions();
  });
}

async function renderExecutiveDisputes() {
  const payload = await endpoints.disputes().then(unwrap).catch(() => ({ cases: [] }));
  const cases = Array.isArray(payload) ? payload : (payload.cases || []);
  const committee = payload.committee || {};
  const openCases = cases.filter((item) => !["CLOSED", "RESOLVED"].includes(String(item.status || "")));
  shell(`
    <section class="grid executive-focus-grid">
      <article class="panel span-12 accent-panel">
        <div class="panel-head">
          <div>
            <h2>Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª</h2>
            <p>Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø© Ù„ÙƒÙ„ Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©ØŒ Ù…Ø¹ Ø­ÙØ¸ Ø§Ù„Ù‚Ø±Ø§Ø± ÙˆØ§Ù„ØªØµØ¹ÙŠØ¯ Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.</p>
          </div>
          <span class="role-chip">${escapeHtml(openCases.length)} Ø­Ø§Ù„Ø© Ù…ÙØªÙˆØ­Ø©</span>
        </div>
        <div class="message compact"><strong>Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ù„Ø¬Ù†Ø©:</strong> ${escapeHtml((committee.members || ["Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ", "Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ", "HR", "Ù…Ø¯ÙŠØ±Ùˆ Ø§Ù„ØªØ´ØºÙŠÙ„"]).join("ØŒ "))}</div>
      </article>
      <article class="panel span-12">
        ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©", "ØªØ§Ø±ÙŠØ®", "Ù‚Ø±Ø§Ø±"], cases.map((item) => `
          <tr>
            <td class="person-cell">${avatar(item.employee || {}, "tiny")}<span>${escapeHtml(item.employee?.fullName || item.employeeName || item.employeeId || "-")}</span></td>
            <td><strong>${escapeHtml(item.title || "Ø´ÙƒÙˆÙ‰ / Ø®Ù„Ø§Ù")}</strong><br><small>${escapeHtml(item.description || "")}</small></td>
            <td>${badge(item.status || "IN_REVIEW")}</td>
            <td>${badge(item.priority || "MEDIUM")}</td>
            <td>${escapeHtml(date(item.createdAt))}</td>
            <td>
              <button class="button small ghost" data-dispute-minute="${escapeHtml(item.id)}">Ù…Ø­Ø¶Ø± Ù„Ø¬Ù†Ø©</button>
              <button class="button small ghost" data-dispute-decision="${escapeHtml(item.id)}">ØªØ³Ø¬ÙŠÙ„ Ù‚Ø±Ø§Ø±</button>
              <button class="button small primary" data-dispute-escalate="${escapeHtml(item.id)}">ØªØµØ¹ÙŠØ¯</button>
            </td>
          </tr>
        `))}
      </article>
    </section>
  `, "Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª", "Ø¥Ø¯Ø§Ø±Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù„Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆØ§Ù„ØªØµØ¹ÙŠØ¯.");
  app.querySelectorAll("[data-dispute-minute]").forEach((button) => button.addEventListener("click", async () => {
    const decision = await askText({ title: "Ù…Ø­Ø¶Ø± Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ø®Ù„Ø§ÙØ§Øª", message: "Ø§ÙƒØªØ¨ Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„Ø±Ø³Ù…ÙŠ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ ÙÙŠ Ø§Ù„Ù…Ø­Ø¶Ø±.", defaultValue: "ØªÙ…Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù‚Ø±Ø§Ø±.", confirmLabel: "Ø­ÙØ¸ Ø§Ù„Ù…Ø­Ø¶Ø±" });
    if (decision === null) return;
    const notes = await askText({ title: "Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ù…Ø­Ø¶Ø±", message: "Ø§ÙƒØªØ¨ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø£Ùˆ Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ø­Ø¶ÙˆØ± Ø£Ùˆ Ø§Ù„Ù…Ø±ÙÙ‚Ø§Øª Ø§Ù„ÙˆØ±Ù‚ÙŠØ©.", defaultValue: "Ø§Ù„Ø­Ø¶ÙˆØ±: Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØŒ Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØŒ HRØŒ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.", confirmLabel: "ØªÙˆÙ‚ÙŠØ¹ ÙˆØ­ÙØ¸" });
    if (notes === null) return;
    try {
      await endpoints.saveDisputeMinute({ caseId: button.dataset.disputeMinute, decision, notes, status: "COMMITTEE_REVIEW" });
      setMessage("ØªÙ… Ø­ÙØ¸ Ù…Ø­Ø¶Ø± Ø§Ù„Ù„Ø¬Ù†Ø© ÙˆØªÙˆÙ‚ÙŠØ¹Ù‡ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠÙ‹Ø§.", "");
      renderExecutiveDisputes();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ù…Ø­Ø¶Ø± Ø§Ù„Ù„Ø¬Ù†Ø©.");
      renderExecutiveDisputes();
    }
  }));
  app.querySelectorAll("[data-dispute-decision]").forEach((button) => button.addEventListener("click", async () => {
    const decision = await askText({ title: "ØªØ³Ø¬ÙŠÙ„ Ù‚Ø±Ø§Ø± Ø§Ù„Ù„Ø¬Ù†Ø©", message: "Ø§ÙƒØªØ¨ Ù‚Ø±Ø§Ø± Ø§Ù„Ù„Ø¬Ù†Ø© Ø£Ùˆ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ø§Ù„Ù…ØªØ®Ø°.", defaultValue: "ØªÙ…Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆØ¬Ø§Ø±ÙŠ Ø§Ù„ØªÙ†ÙÙŠØ°.", confirmLabel: "Ø­ÙØ¸ Ø§Ù„Ù‚Ø±Ø§Ø±" });
    if (decision === null) return;
    try {
      await endpoints.updateDispute(button.dataset.disputeDecision, { status: "RESOLVED", committeeDecision: decision, resolution: decision });
      setMessage("ØªÙ… Ø­ÙØ¸ Ù‚Ø±Ø§Ø± Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª.", "");
      renderExecutiveDisputes();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø­ÙØ¸ Ø§Ù„Ù‚Ø±Ø§Ø±.");
      renderExecutiveDisputes();
    }
  }));
  app.querySelectorAll("[data-dispute-escalate]").forEach((button) => button.addEventListener("click", async () => {
    const reason = await askText({ title: "ØªØµØ¹ÙŠØ¯ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ", message: "Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø§Ù„ØªØµØ¹ÙŠØ¯ Ø£Ùˆ Ø§Ù„Ù‚Ø±Ø§Ø± Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.", defaultValue: "ØªØ­ØªØ§Ø¬ Ø§Ù„Ø­Ø§Ù„Ø© Ø¥Ù„Ù‰ Ù‚Ø±Ø§Ø± ØªÙ†ÙÙŠØ°ÙŠ.", confirmLabel: "ØªØµØ¹ÙŠØ¯ Ø§Ù„Ø¢Ù†" });
    if (reason === null) return;
    try {
      await endpoints.updateDispute(button.dataset.disputeEscalate, { status: "ESCALATED", escalatedToExecutive: true, executiveEscalationReason: reason });
      setMessage("ØªÙ… ØªØµØ¹ÙŠØ¯ Ø§Ù„Ø­Ø§Ù„Ø© Ù„Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©.", "");
      renderExecutiveDisputes();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø§Ù„ØªØµØ¹ÙŠØ¯.");
      renderExecutiveDisputes();
    }
  }));
}


async function renderEmployeeDetail(employeeId) {
  const detail = unwrap(await endpoints.executiveEmployeeDetail(employeeId));
  const employee = detail.employee || {};
  const today = detail.today || {};
  const loc = today.latestLocation || {};
  shell(`
    <section class="grid executive-detail-grid">
      <article class="panel span-12 employee-detail-hero">
        <div class="panel-head">
          <div class="person-cell large">${avatar(employee, "large")}<span><strong>${escapeHtml(employee.fullName || "-")}</strong><small>${escapeHtml(employee.jobTitle || "")}${employee.manager?.fullName ? ` â€” ${escapeHtml(employee.manager.fullName)}` : ""}</small></span></div>
          <div class="toolbar"><button class="button ghost" data-route="employees">Ø±Ø¬ÙˆØ¹ Ù„Ù„Ù‚Ø§Ø¦Ù…Ø©</button><button class="button primary" data-request-live="${escapeHtml(employee.id || employeeId)}">Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</button></div>
        </div>
        <div class="metric-grid">
          ${metric("Ø­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ…", statusLabel(today.status), dateOnly(today.day))}
          ${metric("Ø§Ù„Ø­Ø¶ÙˆØ±", date(today.checkInAt), "Ø£ÙˆÙ„ Ø¨ØµÙ…Ø©")}
          ${metric("Ø§Ù„Ø§Ù†ØµØ±Ø§Ù", date(today.checkOutAt), "Ø¢Ø®Ø± Ø¨ØµÙ…Ø©")}
          ${metric("Ø¢Ø®Ø± Ù…ÙˆÙ‚Ø¹", loc.latitude && loc.longitude ? `${Math.round(Number(loc.accuracyMeters || 0))} Ù…ØªØ±` : "Ù„Ø§ ÙŠÙˆØ¬Ø¯", date(loc.capturedAt || loc.respondedAt || loc.date))}
        </div>
        ${loc.latitude && loc.longitude ? `<div class="message"><strong>Ø¢Ø®Ø± Ù…ÙˆÙ‚Ø¹:</strong> ${escapeHtml(loc.latitude)}, ${escapeHtml(loc.longitude)} â€” <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${escapeHtml(loc.latitude)},${escapeHtml(loc.longitude)}">ÙØªØ­ Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</a></div>` : `<div class="message warning">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…ÙˆÙ‚Ø¹ GPS Ù…Ø­ÙÙˆØ¸ Ø£Ùˆ Ø±Ø¯ Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.</div>`}
      </article>
      <article class="panel span-6"><h3>Ø¢Ø®Ø± Ø­Ø±ÙƒØ§Øª Ø§Ù„Ø­Ø¶ÙˆØ±</h3>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ÙˆÙ‚Øª", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"], (detail.attendance || []).slice(0, 12).map((row) => `<tr><td>${escapeHtml(statusLabel(row.type || row.action))}</td><td>${escapeHtml(date(row.eventAt || row.createdAt))}</td><td>${badge(row.geofenceStatus || row.status || "")}</td><td>${escapeHtml(row.notes || row.source || "")}</td></tr>`))}</article>
      <article class="panel span-6"><h3>Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª ÙˆØ§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª</h3>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ÙØªØ±Ø©", "Ø§Ù„Ø­Ø§Ù„Ø©"], [...(detail.leaves || []).map((row) => [row.leaveType?.name || row.leaveType || "Ø¥Ø¬Ø§Ø²Ø©", `${row.startDate || "-"} â†’ ${row.endDate || "-"}`, row.status]), ...(detail.missions || []).map((row) => [row.destinationName || row.title || "Ù…Ø£Ù…ÙˆØ±ÙŠØ©", `${row.plannedStart || "-"} â†’ ${row.plannedEnd || "-"}`, row.status])].slice(0, 12).map((row) => `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${badge(row[2])}</td></tr>`))}</article>
      <article class="panel span-12"><h3>Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</h3>${table(["Ø§Ù„ÙˆÙ‚Øª", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„Ø³Ø¨Ø¨", "Ø§Ù„Ø±Ø¯"], (detail.liveRequests || []).map((row) => `<tr><td>${escapeHtml(date(row.createdAt))}</td><td>${badge(row.status)}</td><td>${escapeHtml(row.reason || "")}</td><td>${escapeHtml(date(row.respondedAt))}</td></tr>`))}</article>
    </section>
  `, "ØªÙØ§ØµÙŠÙ„ Ù…ÙˆØ¸Ù", "Ù…ØªØ§Ø¨Ø¹Ø© Ø­Ø§Ù„Ø© Ù…ÙˆØ¸Ù ÙˆØ§Ø­Ø¯ Ø¯ÙˆÙ† Ø£Ø¯ÙˆØ§Øª Ø¥Ø¯Ø§Ø±ÙŠØ© Ù…Ø¹Ù‚Ø¯Ø©.");
  bindEmployeeCardActions();
}

function bindEmployeeCardActions() {
  app.querySelectorAll("[data-view-employee]").forEach((button) => button.addEventListener("click", () => setRoute("employee", { id: button.dataset.viewEmployee })));
  app.querySelectorAll("[data-request-live]").forEach((button) => button.addEventListener("click", async () => {
    if (button.disabled) return;
    const reason = await askText({ title: "Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", message: "Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø­ØªÙ‰ ÙŠØ¸Ù‡Ø± Ù„Ù„Ù…ÙˆØ¸Ù Ø¨ÙˆØ¶ÙˆØ­.", defaultValue: "Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø©", confirmLabel: "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨" });
    if (reason === null) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„...";
    try {
      await endpoints.requestLiveLocation(button.dataset.requestLive, { reason });
      state.dataCache = null;
      setMessage("تم إنشاء طلب الموقع، وقد لا يصل الإشعار الخارجي إذا كان غير مفعل.", "");
      if (routeKey() === "employee") await renderEmployeeDetail(button.dataset.requestLive);
      else render();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹.");
      button.disabled = false;
      button.textContent = originalText;
    }
  }));
}

async function renderNoPermission() {
  shell(`
    <section class="panel">
      <h2>Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨ Ù„ÙŠØ³ Ø­Ø³Ø§Ø¨Ù‹Ø§ ØªÙ†ÙÙŠØ°ÙŠÙ‹Ø§</h2>
      <p>Ù‡Ø°Ù‡ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ù…Ø®ØµØµØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø£Ùˆ Ù…Ù† ÙŠÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© ÙˆØ·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.</p>
      <div class="toolbar"><button class="button ghost" data-action="employee-portal">ÙØªØ­ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù</button>${canOpenAdminPortal() ? `<button class="button primary" data-action="admin-portal">ÙØªØ­ Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ø¯Ù…Ù†</button>` : ""}</div>
    </section>
  `, "ØµÙ„Ø§Ø­ÙŠØ§Øª ØºÙŠØ± ÙƒØ§ÙÙŠØ©", "ØªÙ… Ù…Ù†Ø¹ ÙØªØ­ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ù„Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨.");
}

async function render() {
  try {
    state.error = "";
    if (!state.user) state.user = await endpoints.me().then(unwrap).catch(() => null);
    if (await enforceGateSessionIdentity("executive")) return;
    if (!state.user) return renderLogin();
    if (!isExecutivePortalUser(state.user)) return renderNoPermission();

    const key = routeKey();
    if (key === "home") await renderHome();
    else if (key === "employees") await renderEmployees();
    else if (key === "presence") await renderPresenceMap();
    else if (key === "risk") await renderRiskCenter();
    else if (key === "actions") await renderActions();
    else if (key === "decisions") await renderAdminDecisions();
    else if (key === "disputes") await renderExecutiveDisputes();
    else if (key === "employee") {
      const id = routeParams().get("id") || "";
      if (!id) return setRoute("employees");
      await renderEmployeeDetail(id);
    } else await renderHome();
  } catch (error) {
    console.error(error);
    setMessage("", error.message || "ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©.");
    shell(`<section class="panel"><h2>ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©</h2><p>${escapeHtml(error.message || "Ø®Ø·Ø£ ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ")}</p><button class="button ghost" data-route="home">Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ø±Ø¦ÙŠØ³ÙŠØ©</button></section>`, "Ø®Ø·Ø£", "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø§ØªØµØ§Ù„ Ø£Ùˆ Ø£Ø¹Ø¯ Ø§Ù„ØªØ­Ù…ÙŠÙ„.");
  }
}

window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "home";
  render();
});

if (!location.hash) location.hash = "home";
render();
