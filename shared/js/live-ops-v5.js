// HR Ahla Shabab — Live Operations V5 client helpers
// Non-invasive module: adds optional command-center tools and offline queue support
// without replacing the existing app runtime.

const V5_VERSION = "live-ops-v5-20260504";
const OFFLINE_QUEUE_KEY = "hr.offlineAttendanceQueue.v5";

function safeJsonParse(raw, fallback = null) {
  try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

function nowIso() { return new Date().toISOString(); }

function getSupabaseConfig() { return window.HR_SUPABASE_CONFIG || {}; }

function getQueuedOfflineAttendance() {
  return safeJsonParse(localStorage.getItem(OFFLINE_QUEUE_KEY), []) || [];
}

function saveQueuedOfflineAttendance(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
}

export function queueOfflineAttendanceAttempt(payload = {}) {
  const queue = getQueuedOfflineAttendance();
  const record = {
    id: crypto.randomUUID?.() || `offline-${Date.now()}`,
    type: payload.type || "attendance",
    created_at: nowIso(),
    status: "pending_sync",
    reason: payload.reason || "offline_or_verification_failed",
    employee_id: payload.employee_id || null,
    location_label: payload.location_label || "غير محدد",
    accuracy: payload.accuracy ?? null,
    note: payload.note || "",
    payload,
  };
  queue.push(record);
  saveQueuedOfflineAttendance(queue);
  window.dispatchEvent(new CustomEvent("hr:offline-attendance-queued", { detail: record }));
  return record;
}

export function buildRiskBadge(score = 0) {
  const n = Number(score || 0);
  if (n >= 70) return { label: "خطر عالٍ", className: "risk-high", level: "high" };
  if (n >= 35) return { label: "مراجعة", className: "risk-medium", level: "medium" };
  return { label: "طبيعي", className: "risk-low", level: "low" };
}

function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([key, value]) => {
    if (key === "className") el.className = value;
    else if (key === "text") el.textContent = value;
    else if (key === "html") el.innerHTML = value;
    else el.setAttribute(key, String(value));
  });
  children.forEach((child) => el.append(child));
  return el;
}

function injectStyles() {
  if (document.getElementById("hr-live-ops-v5-style")) return;
  const style = document.createElement("style");
  style.id = "hr-live-ops-v5-style";
  style.textContent = `
    .hr-v5-launcher{position:fixed;z-index:9997;left:18px;bottom:18px;border:1px solid rgba(125,211,252,.35);background:linear-gradient(135deg,rgba(15,23,42,.94),rgba(30,41,59,.9));color:#e0f2fe;border-radius:999px;padding:12px 16px;font-weight:900;box-shadow:0 16px 44px rgba(14,165,233,.25);cursor:pointer;backdrop-filter:blur(12px)}
    .hr-v5-panel{position:fixed;z-index:9998;left:18px;bottom:78px;width:min(420px,calc(100vw - 36px));max-height:min(680px,calc(100vh - 112px));overflow:auto;border:1px solid rgba(125,211,252,.28);background:rgba(2,6,23,.96);color:#e2e8f0;border-radius:24px;padding:18px;box-shadow:0 32px 90px rgba(0,0,0,.5),0 0 0 1px rgba(34,211,238,.08);display:none;backdrop-filter:blur(18px)}
    .hr-v5-panel.is-open{display:block}.hr-v5-panel h3{margin:0 0 8px;font-size:18px}.hr-v5-panel p{margin:0 0 14px;color:#94a3b8;font-size:13px}.hr-v5-grid{display:grid;gap:10px}.hr-v5-card{border:1px solid rgba(148,163,184,.18);background:rgba(15,23,42,.72);border-radius:18px;padding:12px}.hr-v5-card strong{display:block;margin-bottom:4px}.hr-v5-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.hr-v5-actions button{border:0;border-radius:14px;padding:10px 12px;font-weight:800;color:#07111f;background:#67e8f9;cursor:pointer}.hr-v5-actions button.secondary{background:#1e293b;color:#e2e8f0;border:1px solid rgba(148,163,184,.25)}
    .hr-v5-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900;background:rgba(59,130,246,.16);color:#bfdbfe}.hr-v5-badge.warn{background:rgba(251,191,36,.14);color:#fde68a}.hr-v5-badge.ok{background:rgba(34,197,94,.14);color:#bbf7d0}
    @media print{.hr-v5-launcher,.hr-v5-panel{display:none!important}}
  `;
  document.head.append(style);
}

function portalName() {
  const p = location.pathname.toLowerCase();
  if (p.includes("/admin/")) return "لوحة الإدارة";
  if (p.includes("/executive/")) return "لوحة المدير التنفيذي";
  if (p.includes("/employee/")) return "تطبيق الموظفين";
  return "مركز التشغيل";
}

function panelContent() {
  const cfg = getSupabaseConfig();
  const queue = getQueuedOfflineAttendance();
  const enabled = Boolean(cfg.enabled && cfg.url && cfg.anonKey);
  const v = cfg.cacheVersion || cfg.deployment?.packageVersion || V5_VERSION;
  return `
    <h3>مركز التشغيل الذكي V5</h3>
    <p>${portalName()} — أدوات متابعة مباشرة لا تكسر تدفق النظام الحالي.</p>
    <div class="hr-v5-grid">
      <div class="hr-v5-card"><strong>حالة Supabase</strong><span class="hr-v5-badge ${enabled ? 'ok' : 'warn'}">${enabled ? 'مفعّل' : 'غير مفعّل'}</span></div>
      <div class="hr-v5-card"><strong>نسخة الكاش</strong><span class="hr-v5-badge">${v}</span></div>
      <div class="hr-v5-card"><strong>محاولات الحضور الاحتياطي</strong><span class="hr-v5-badge ${queue.length ? 'warn' : 'ok'}">${queue.length}</span></div>
      <div class="hr-v5-card"><strong>الميزات المضافة</strong><p>Live Ops · Smart Alerts · Visual Permissions · Tasks · Official Messages · Offline Queue · Reports.</p></div>
    </div>
    <div class="hr-v5-actions">
      <button type="button" data-v5-action="health">فتح فحص الصحة</button>
      <button type="button" class="secondary" data-v5-action="clear-offline">مسح المحاولات المؤقتة</button>
    </div>
  `;
}

function initPanel() {
  injectStyles();
  if (document.getElementById("hr-v5-panel")) return;
  if (location.pathname.includes("/employee/")) return; // Hide for regular employees
  const launcher = createEl("button", { className: "hr-v5-launcher", type: "button", text: "مركز V5" });
  const panel = createEl("aside", { className: "hr-v5-panel", id: "hr-v5-panel", role: "dialog", "aria-label": "مركز التشغيل الذكي V5" });
  panel.innerHTML = panelContent();
  launcher.addEventListener("click", () => {
    panel.innerHTML = panelContent();
    panel.classList.toggle("is-open");
  });
  panel.addEventListener("click", (event) => {
    const action = event.target?.dataset?.v5Action;
    if (action === "health") location.href = location.pathname.includes("/admin/") || location.pathname.includes("/employee/") || location.pathname.includes("/executive/") ? "../health.html" : "./health.html";
    if (action === "clear-offline") { saveQueuedOfflineAttendance([]); panel.innerHTML = panelContent(); }
  });
  document.body.append(launcher, panel);
}

window.HR_LIVE_OPS_V5 = Object.freeze({
  version: V5_VERSION,
  queueOfflineAttendanceAttempt,
  getQueuedOfflineAttendance,
  buildRiskBadge,
});

document.addEventListener("DOMContentLoaded", initPanel);
