import { endpoints, unwrap } from "./api.js?v=v31-production-deploy-ready-keep-dev-files";
import { enableWebPushSubscription } from "./push.js?v=v31-production-deploy-ready-keep-dev-files";

const app = document.querySelector("#app");

const state = {
  route: location.hash.replace("#", "") || "dashboard",
  user: null,
  message: "",
  error: "",
  sidebarCollapsed: localStorage.getItem("hr.sidebarCollapsed") === "true",
  sidebarScrollTop: Number(sessionStorage.getItem("hr.sidebarScrollTop") || 0),
  loginIdentifier: localStorage.getItem("hr.login.lastIdentifier") || "",
  loginPassword: "",
  lastLoginFailed: false,
};

const navGroups = [
  ["Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©", [["dashboard", "Ù„ÙˆØ­Ø© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©"], ["executive-report", "ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ"], ["executive-mobile", "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©"], ["presence-map", "Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ù„Ø­Ø¸ÙŠØ©"], ["attendance-risk", "Ù…Ø®Ø§Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©"], ["manager-dashboard", "Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¯ÙŠØ±"], ["manager-suite", "Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±"], ["realtime", "Ù„ÙˆØ­Ø© Live"], ["employee-punch", "Ø¨ØµÙ…Ø© Ø§Ù„Ù…ÙˆØ¸Ù"], ["attendance", "Ø§Ù„Ø­Ø¶ÙˆØ±"], ["attendance-review", "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ØµÙ…Ø§Øª"], ["smart-attendance", "Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø°ÙƒÙŠØ©"], ["attendance-calendar", "ØªÙ‚ÙˆÙŠÙ… Ø§Ù„Ø­Ø¶ÙˆØ±"]]],
  ["Ø§Ù„Ø£ÙØ±Ø§Ø¯", [["employees", "Ø§Ù„Ø£Ø´Ø®Ø§Øµ ÙˆØ§Ù„Ù…ÙˆØ¸ÙÙˆÙ†"], ["management-structure", "Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„ÙØ±Ù‚"], ["team-dashboard", "ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ±"], ["hr-operations", "Ø¹Ù…Ù„ÙŠØ§Øª HR"], ["employee-archive", "Ø£Ø±Ø´ÙŠÙ Ù…ÙˆØ¸Ù"], ["users", "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†"], ["leave-balances", "Ø£Ø±ØµØ¯Ø© Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª"], ["documents", "Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†"], ["trusted-devices", "Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©"], ["org-chart", "Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ"]]],
  ["Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª", [["roles", "Ø§Ù„Ø£Ø¯ÙˆØ§Ø± ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª"], ["permission-matrix", "Ù…ØµÙÙˆÙØ© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª"], ["password-vault", "Ø®Ø²Ù†Ø© ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ±"], ["sensitive-approvals", "Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª Ø­Ø³Ø§Ø³Ø©"]]],
  ["Ø§Ù„Ø·Ù„Ø¨Ø§Øª", [["requests", "Ù…Ø±ÙƒØ² Ø§Ù„Ø·Ù„Ø¨Ø§Øª"], ["tasks", "Ø§Ù„Ù…Ù‡Ø§Ù…"], ["missions", "Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª"], ["leaves", "Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª"], ["locations", "Ø·Ù„Ø¨Ø§Øª ÙˆØ³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹"], ["disputes", "Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆÙØ¶ Ø§Ù„Ø®Ù„Ø§ÙØ§Øª"], ["admin-decisions", "Ø³Ø¬Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©"], ["dispute-workflow", "Ù…Ø³Ø§Ø± Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆØ§Ù„ØªØµØ¹ÙŠØ¯"]]],
  ["Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©", [["kpi", "Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø¡"], ["monthly-evaluations", "Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø´Ù‡Ø±ÙŠ"], ["control-room", "ØºØ±ÙØ© Ø§Ù„ØªØ­ÙƒÙ…"], ["daily-reports", "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ©"], ["ai-analytics", "ØªØ­Ù„ÙŠÙ„Ø§Øª AI"], ["reports", "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±"], ["report-center", "Ù…Ø±ÙƒØ² Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± ÙˆØ§Ù„ØªØµØ¯ÙŠØ±"], ["executive-pdf", "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ PDF"], ["monthly-auto-pdf", "PDF Ø´Ù‡Ø±ÙŠ ØªÙ„Ù‚Ø§Ø¦ÙŠ"], ["smart-alerts", "Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©"], ["monthly-report", "ØªÙ‚Ø±ÙŠØ± Ø´Ù‡Ø±ÙŠ"], ["advanced-reports", "Ù…Ù†Ø´Ø¦ Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±"], ["audit", "Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚"], ["security-log", "Ø³Ø¬Ù„ Ø§Ù„Ø£Ù…Ø§Ù†"], ["notifications", "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª"]]],
  ["Ø§Ù„Ù†Ø¸Ø§Ù…", [["settings", "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª"], ["supabase-setup", "Ø¥Ø¹Ø¯Ø§Ø¯ Supabase"], ["db-updates", "ØªØ­Ø¯ÙŠØ«Ø§Øª Database"], ["auto-backup", "Backup ØªÙ„Ù‚Ø§Ø¦ÙŠ"], ["data-center", "Ù…Ø±ÙƒØ² Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª"], ["complex-settings", "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹"], ["system-diagnostics", "Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù†Ø¸Ø§Ù…"], ["quality-center", "Ù…Ø±ÙƒØ² Ø§Ù„Ø¬ÙˆØ¯Ø© ÙˆØ§Ù„Ø¥ØµÙ„Ø§Ø­"], ["policies", "Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª ÙˆØ§Ù„ØªÙˆÙ‚ÙŠØ¹Ø§Øª"], ["route-access", "ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©"], ["integrations", "Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª"], ["access-control", "Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© ÙˆØ§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª"], ["offline-sync", "Offline Sync"], ["health", "Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù…"], ["backup", "Ù†Ø³Ø® ÙˆØ§Ø³ØªÙŠØ±Ø§Ø¯"]]],
];

const routePermissions = {
  dashboard: ["dashboard:view"],
  "executive-report": ["executive:report", "dashboard:view", "reports:export"],
  "executive-mobile": ["executive:mobile", "dashboard:view", "live-location:request"],
  "presence-map": ["executive:presence-map", "executive:mobile", "dashboard:view"],
  "attendance-risk": ["attendance:risk", "attendance:review", "attendance:manage", "executive:mobile"],
  realtime: ["realtime:view", "dashboard:view", "reports:export"],
  "manager-dashboard": ["dashboard:view", "manager:team", "kpi:team", "attendance:manage", "requests:approve"],
  employees: ["employees:view", "employees:write", "users:manage"],
  "management-structure": ["organization:manage", "employees:view", "manager:team"],
  "team-dashboard": ["team:dashboard", "manager:team", "manager:suite", "kpi:team"],
  "hr-operations": ["hr:operations", "attendance:manage", "kpi:hr", "employees:write"],
  "employee-profile": ["employees:view", "employees:write", "users:manage"],
  users: ["users:manage"],
  "leave-balances": ["leave:balance", "employees:view", "requests:approve"],
  documents: ["documents:manage", "employees:view"],
  "trusted-devices": ["users:manage", "attendance:manage", "attendance:self"],
  "org-chart": ["employees:view"],
  roles: ["users:manage"],
  "permission-matrix": ["permissions:matrix", "users:manage"],
  "password-vault": ["users:manage"],
  "sensitive-approvals": ["sensitive-actions:approve", "approvals:manage", "audit:view", "users:manage"],
  "employee-punch": ["dashboard:view", "attendance:self", "attendance:manage"],
  "smart-attendance": ["attendance:smart", "attendance:rules", "attendance:manage"],
  "manager-suite": ["manager:suite", "manager:team", "kpi:team", "attendance:manage", "requests:approve"],
  "executive-pdf": ["executive:report", "reports:export"],
  "monthly-auto-pdf": ["reports:pdf", "reports:export", "executive:report"],
  "employee-archive": ["employee:archive", "employees:view", "audit:view"],
  "smart-alerts": ["alerts:manage", "control-room:view", "dashboard:view"],
  "monthly-evaluations": ["kpi:monthly", "kpi:team", "kpi:manage", "kpi:hr", "kpi:executive"],
  "supabase-setup": ["supabase:diagnostics", "settings:manage"],
  "db-updates": ["database:migrations", "settings:manage"],
  "auto-backup": ["backup:auto", "settings:manage", "reports:export"],
  attendance: ["attendance:manage", "employees:write"],
  "attendance-review": ["attendance:manage", "attendance:review", "requests:approve"],
  "attendance-calendar": ["attendance:manage", "employees:view"],
  requests: ["requests:approve", "attendance:manage"],
  tasks: ["tasks:manage", "dashboard:view"],
  missions: ["dashboard:view"],
  leaves: ["dashboard:view"],
  locations: ["dashboard:view", "attendance:self", "attendance:manage", "requests:approve"],
  disputes: ["dashboard:view", "disputes:manage", "disputes:committee", "requests:approve", "users:manage"],
  "dispute-workflow": ["disputes:committee", "disputes:manage", "disputes:escalate", "requests:approve"],
  "admin-decisions": ["decisions:manage", "notifications:manage", "executive:report"],
  kpi: ["kpi:manage", "kpi:team", "kpi:self", "kpi:hr", "kpi:executive", "kpi:final-approve", "reports:export"],
  reports: ["reports:export"],
  "report-center": ["reports:export", "reports:pdf", "reports:excel"],
  "advanced-reports": ["reports:export"],
  "monthly-report": ["reports:export", "attendance:manage"],
  "ai-analytics": ["ai:view", "reports:export"],
  audit: ["audit:view"],
  "security-log": ["audit:view", "security:view", "settings:manage"],
  "control-room": ["control-room:view", "maintenance:run", "audit:view", "dashboard:view"],
  "daily-reports": ["daily-report:review", "dashboard:view", "reports:export"],
  notifications: ["dashboard:view"],
  "data-center": ["data-center:manage", "settings:manage", "reports:export"],
  settings: ["settings:manage"],
  "complex-settings": ["settings:manage", "attendance:manage"],
  "system-diagnostics": ["settings:manage", "audit:view", "users:manage"],
  "quality-center": ["maintenance:run", "workflow:manage", "settings:manage", "audit:view"],
  policies: ["policies:manage", "policies:self", "settings:manage"],
  "route-access": ["settings:manage", "users:manage"],
  health: ["settings:manage", "audit:view"],
  backup: ["settings:manage", "reports:export"],
  integrations: ["integrations:manage", "settings:manage"],
  "access-control": ["access_control:manage", "attendance:manage"],
  "offline-sync": ["offline:manage", "settings:manage", "attendance:self"],
};

const FULL_ACCESS_ROLE_KEYS = new Set([
  "admin",
  "super-admin",
  "super_admin",
  "role-admin",
  "executive-secretary",
  "role-executive-secretary",
  "Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…",
  "Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ",
]);

function safeList(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDashboardPayload(value = {}) {
  const dashboard = value && typeof value === "object" ? value : {};
  const cards = dashboard.cards && typeof dashboard.cards === "object" ? dashboard.cards : {};
  const metrics = safeList(dashboard.metrics);
  const attendanceBreakdown = safeList(dashboard.attendanceBreakdown);
  const attendanceTrends = safeList(dashboard.attendanceTrends);
  const fallbackMetrics = [
    { label: "Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†", value: cards.employees ?? 0, helper: "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù…ØªØ§Ø­Ø©" },
    { label: "Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…", value: cards.presentToday ?? 0, helper: "Ø§Ù„Ø­Ø±ÙƒØ§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø© Ø§Ù„ÙŠÙˆÙ…" },
    { label: "Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", value: cards.pendingRequests ?? 0, helper: "ØªØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©" },
    { label: "Ø¥Ø¬Ø§Ø²Ø§Øª Ø§Ù„ÙŠÙˆÙ…", value: cards.leavesToday ?? 0, helper: "Ø§Ù„Ù…ÙˆØ§ÙÙ‚ Ø¹Ù„ÙŠÙ‡Ø§ Ø§Ù„ÙŠÙˆÙ…" },
  ];
  const fallbackBreakdown = [
    { label: "Ø­Ø¶ÙˆØ±", value: cards.presentToday ?? 0 },
    { label: "Ø·Ù„Ø¨Ø§Øª", value: cards.pendingRequests ?? 0 },
    { label: "Ø¥Ø¬Ø§Ø²Ø§Øª", value: cards.leavesToday ?? 0 },
  ];
  const normalizedBreakdown = attendanceBreakdown.length ? attendanceBreakdown : fallbackBreakdown;
  const normalizedTrends = attendanceTrends.length
    ? attendanceTrends
    : normalizedBreakdown.map((item) => ({ label: item.label, present: Number(item.value || 0), late: 0, mission: 0 }));
  return {
    ...dashboard,
    metrics: metrics.length ? metrics : fallbackMetrics,
    attendanceBreakdown: normalizedBreakdown,
    attendanceTrends: normalizedTrends,
    latestEvents: safeList(dashboard.latestEvents),
    latestAudit: safeList(dashboard.latestAudit),
  };
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

function roleMeta(user = state.user) {
  const role = user?.role;
  if (role && typeof role === "object") {
    return {
      id: role.id || user?.roleId || "",
      key: role.key || role.slug || role.code || "",
      slug: role.slug || role.key || "",
      name: role.name || role.label || user?.roleName || user?.role || "",
      permissions: normalizePermissionList(role.permissions),
    };
  }
  return {
    id: user?.roleId || "",
    key: user?.roleKey || user?.roleSlug || user?.role || "",
    slug: user?.roleSlug || user?.roleKey || user?.role || "",
    name: user?.roleName || user?.role || user?.employee?.role?.name || "",
    permissions: normalizePermissionList(user?.employee?.role?.permissions),
  };
}

function currentPermissions(user = state.user) {
  return new Set([
    ...normalizePermissionList(user?.permissions),
    ...normalizePermissionList(user?.permissionScopes),
    ...normalizePermissionList(user?.scopes),
    ...normalizePermissionList(user?.profile?.permissions),
    ...roleMeta(user).permissions,
  ]);
}

function isExecutiveOnlyRole(user = state.user) {
  const role = roleMeta(user);
  const keys = [role.id, role.key, role.slug, role.name].filter(Boolean).map((item) => String(item).toLowerCase());
  return keys.some((key) => ["role-executive", "executive", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ"].includes(key));
}

function hasFullAccess(user = state.user) {
  if (isExecutiveOnlyRole(user)) return false;
  const role = roleMeta(user);
  const rawKeys = [role.id, role.key, role.slug, role.name].filter(Boolean).map(String);
  const lowerKeys = rawKeys.map((item) => item.toLowerCase());
  const permissions = currentPermissions(user);
  return permissions.has("*") || rawKeys.some((key) => FULL_ACCESS_ROLE_KEYS.has(key)) || lowerKeys.some((key) => FULL_ACCESS_ROLE_KEYS.has(key));
}

function isTechnicalAdmin(user = state.user) {
  const role = roleMeta(user);
  const keys = [role.id, role.key, role.slug, user?.roleId, user?.roleKey, user?.roleSlug]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase());
  return hasFullAccess(user) || keys.some((key) => ["role-admin", "admin", "super-admin", "super_admin"].includes(key));
}

function hasAnyPermission(scopes = []) {
  const permissions = currentPermissions();
  if (!scopes.length || hasFullAccess()) return true;
  return scopes.some((scope) => permissions.has(scope));
}

function roleLabel(user = state.user) {
  const role = roleMeta(user);
  return role.name || role.key || role.slug || "Ø¨Ø¯ÙˆÙ† Ø¯ÙˆØ± Ù…Ø­Ø¯Ø¯";
}

function activeNavKey(key = routeKey()) {
  if (key === "employee-profile") return "employees";
  return key;
}

function canRoute(key) {
  if (key === "password-vault") return isTechnicalAdmin() || hasFullAccess();
  return hasAnyPermission(routePermissions[key] || []);
}

function isAdminPortalUser(user = state.user) {
  if (!user) return false;
  if (isExecutiveOnlyRole(user)) return true;
  if (hasFullAccess(user)) return true;
  const previousUser = state.user;
  state.user = user;
  const allowed = hasAnyPermission([
    "employees:view",
    "users:manage",
    "attendance:manage",
    "requests:approve",
    "reports:export",
    "settings:manage",
    "audit:view",
    "kpi:team",
    "team:dashboard",
    "hr:operations",
    "organization:manage",
  ]);
  state.user = previousUser;
  return allowed;
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

function gateIdentityForPortal(target = "admin") {
  if (sessionStorage.getItem("hr.opsGatewayUnlockedTarget") !== target) return "";
  return sessionStorage.getItem("hr.ops.gate.identity") || sessionStorage.getItem("hr.ops.gate.email") || "";
}

function sessionMatchesGateIdentity(user = state.user, target = "admin") {
  const gateIdentity = normalizeGateIdentifier(gateIdentityForPortal(target));
  if (!gateIdentity || !user) return true;
  const employee = user.employee || {};
  const tokens = [
    user.email, user.phone, user.mobile, user.identifier, user.fullName, user.name,
    employee.email, employee.phone, employee.mobile, employee.fullName,
  ].map(normalizeGateIdentifier).filter(Boolean);
  return tokens.includes(gateIdentity);
}

async function enforceGateSessionIdentity(target = "admin") {
  const gateIdentity = gateIdentityForPortal(target);
  if (!gateIdentity || !state.user || sessionMatchesGateIdentity(state.user, target)) return false;
  await endpoints.logout().catch(() => null);
  state.user = null;
  state.loginIdentifier = gateIdentity;
  state.loginPassword = "";
  state.lastLoginFailed = false;
  setMessage("", "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø®Ø±ÙˆØ¬ Ø§Ù„Ø¬Ù„Ø³Ø© Ø§Ù„Ø³Ø§Ø¨Ù‚Ø© Ù„Ø£Ù†Ù‡Ø§ Ù„Ø§ ØªØ·Ø§Ø¨Ù‚ Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø°ÙŠ ÙØªØ­ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø©. Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.");
  renderLogin();
  return true;
}

function goEmployeePortal(route = "home") {
  window.location.href = "../employee/index.html#" + encodeURIComponent(route);
}

function goExecutivePortal(route = "home") {
  window.location.href = "../operations-gate/?next=" + encodeURIComponent("../executive/#" + route);
}

window.addEventListener("hashchange", () => {
  state.route = location.hash.replace("#", "") || "dashboard";
  render();
});

function routeKey() {
  return state.route.split("?")[0];
}

function routeParams() {
  return new URLSearchParams(state.route.split("?")[1] || "");
}

function inputDate(value = new Date()) {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function setRouteQuery(key, values = {}) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([name, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") params.set(name, String(value));
  });
  const query = params.toString();
  location.hash = query ? `${key}?${query}` : key;
}

function attendanceFiltersFromRoute() {
  const params = routeParams();
  const today = inputDate(new Date());
  const monthAgo = inputDate(addDays(new Date(), -30));
  const limit = Math.min(Math.max(Number(params.get("limit") || 500), 100), 5000);
  return {
    from: params.get("from") || monthAgo,
    to: params.get("to") || today,
    employeeId: params.get("employeeId") || "",
    type: params.get("type") || "",
    review: params.get("review") || "",
    limit,
  };
}

function eventDay(event) {
  return String(event?.eventAt || event?.createdAt || event?.date || "").slice(0, 10);
}

function filterAttendanceEvents(events = [], filters = {}) {
  return events.filter((event) => {
    const day = eventDay(event);
    return (!filters.from || !day || day >= filters.from)
      && (!filters.to || !day || day <= filters.to)
      && (!filters.employeeId || event.employeeId === filters.employeeId)
      && (!filters.type || event.type === filters.type)
      && (!filters.review || (filters.review === "review" ? Boolean(event.requiresReview) : !event.requiresReview));
  }).sort((a, b) => new Date(b.eventAt || b.createdAt || 0) - new Date(a.eventAt || a.createdAt || 0));
}

function routeDisplayName(key) {
  for (const [, routes] of navGroups) {
    const found = routes.find(([routeKey]) => routeKey === key);
    if (found) return found[1];
  }
  if (key === "employee-profile") return "Ù…Ù„Ù Ø§Ù„Ù…ÙˆØ¸Ù";
  return key;
}

function debounce(fn, wait = 250) {
  let timer = null;
  return (...args) => { window.clearTimeout(timer); timer = window.setTimeout(() => fn(...args), wait); };
}

function setMessage(message = "", error = "") {
  state.message = message;
  state.error = error;
}

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

function metric(label, value, helper = "") {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 0)}</strong><small>${escapeHtml(helper)}</small></article>`;
}

function statusLabel(value) {
  return {
    ACTIVE: "Ù†Ø´Ø·",
    INACTIVE: "ØºÙŠØ± Ù…ÙØ¹Ù„",
    INVITED: "Ø¯Ø¹ÙˆØ© Ù…Ø¤Ù‚ØªØ©",
    LOCKED: "Ù…ØºÙ„Ù‚",
    TERMINATED: "Ù…Ù†ØªÙ‡ÙŠ",
    SUSPENDED: "Ù…ÙˆÙ‚ÙˆÙ",
    DISABLED: "Ù…Ø¹Ø·Ù„",
    ON_LEAVE: "Ø¥Ø¬Ø§Ø²Ø©",
    LEAVE: "Ø¥Ø¬Ø§Ø²Ø©",
    REMOTE: "Ø¹Ù† Ø¨Ø¹Ø¯",
    PRESENT: "Ø­Ø§Ø¶Ø±",
    PRESENT_REVIEW: "Ø­Ø¶ÙˆØ± Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    LATE: "Ù…ØªØ£Ø®Ø±",
    ABSENT: "ØºØ§Ø¦Ø¨",
    MISSION: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©",
    CHECK_IN: "Ø­Ø¶ÙˆØ±",
    CHECK_OUT: "Ø§Ù†ØµØ±Ø§Ù",
    CHECKED_OUT: "Ø§Ù†ØµØ±Ù",
    ON_MISSION: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©",
    LIVE_SHARED: "Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø± Ù…ÙØ±Ø³Ù„",
    ACTION_REQUIRED: "Ø¥Ø¬Ø±Ø§Ø¡ Ù…Ø·Ù„ÙˆØ¨",
    SELF_SUBMITTED: "Ù…Ø±Ø³Ù„ Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù",
    MANAGER_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ±",
    HR_REVIEWED: "Ù…Ø±Ø§Ø¬Ø¹Ø© HR",
    SECRETARY_REVIEWED: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø³ÙƒØ±ØªÙŠØ±",
    EXECUTIVE_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ",
    CHECKOUT_REVIEW: "Ø§Ù†ØµØ±Ø§Ù Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    APPROVED: "Ù…Ø¹ØªÙ…Ø¯",
    REJECTED: "Ù…Ø±ÙÙˆØ¶",
    DRAFT: "Ù…Ø³ÙˆØ¯Ø©",
    PENDING: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    SUBMITTED: "ØªÙ… Ø§Ù„ØªØ³Ù„ÙŠÙ…",
    IN_REVIEW: "Ù‚ÙŠØ¯ ÙØ­Øµ Ø§Ù„Ù„Ø¬Ù†Ø©",
    OPEN: "Ù…ÙØªÙˆØ­Ø©",
    RESOLVED: "ØªÙ… Ø§Ù„Ø­Ù„",
    CLOSED: "Ù…ØºÙ„Ù‚Ø©",
    ESCALATED: "Ù…Ø±ÙÙˆØ¹Ø© Ù„Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©",
    MEDIUM: "Ù…ØªÙˆØ³Ø·Ø©",
    HIGH: "Ø¹Ø§Ù„ÙŠØ©",
    LOW: "Ù…Ù†Ø®ÙØ¶Ø©",
    COMPLETED: "Ù…ÙƒØªÙ…Ù„",
    READ: "Ù…Ù‚Ø±ÙˆØ¡",
    UNREAD: "Ø¬Ø¯ÙŠØ¯",
    INFO: "Ù…Ø¹Ù„ÙˆÙ…Ø©",
    SUCCESS: "Ù†Ø¬Ø§Ø­",
    verified: "ØªØ­Ù‚Ù‚ Ù†Ø§Ø¬Ø­",
    not_checked: "Ø¨Ø¯ÙˆÙ† ØªØ­Ù‚Ù‚",
    failed: "ÙØ´Ù„ Ø§Ù„ØªØ­Ù‚Ù‚",
    inside_branch: "Ø¯Ø§Ø®Ù„ Ø§Ù„ÙØ±Ø¹",
    outside_branch: "Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø·Ø§Ù‚",
    inside_mission: "Ø¯Ø§Ø®Ù„ Ù…Ø£Ù…ÙˆØ±ÙŠØ©",
    location_unavailable: "Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ù…ØªØ§Ø­",
    permission_denied: "ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù…Ø±ÙÙˆØ¶Ø©",
    branch_unknown: "Ù…Ø¬Ù…Ø¹ ØºÙŠØ± Ù…Ø­Ø¯Ø¯",
    branch_location_missing: "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙØ±Ø¹ ØºÙŠØ± Ù…Ø¶Ø¨ÙˆØ·",
    location_low_accuracy: "Ø¯Ù‚Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¶Ø¹ÙŠÙØ©",
    inside_branch_low_accuracy: "Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø·Ø§Ù‚ Ø¨Ø¯Ù‚Ø© Ø¶Ø¹ÙŠÙØ©",
    biometric_pending: "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø¨ØµÙ…Ø©",
    storage_ok: "Storage Ø³Ù„ÙŠÙ…",
    storage_missing: "Bucket Ù†Ø§Ù‚Øµ",
    linked: "Ù…Ø±ØªØ¨Ø·",
    unlinked: "ØºÙŠØ± Ù…Ø±ØªØ¨Ø·",
    fixed: "ØªÙ… Ø§Ù„ØªØµØ­ÙŠØ­",

    APPROVE: "Ø§Ø¹ØªÙ…Ø§Ø¯",
    REJECT: "Ø±ÙØ¶",
    REVIEWED: "ØªÙ…Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    REVIEW_PENDING: "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    REJECTED_CONFIRMED: "Ø±ÙØ¶ Ù…Ø¤ÙƒØ¯",
    MANUAL_APPROVED: "Ø§Ø¹ØªÙ…Ø§Ø¯ ÙŠØ¯ÙˆÙŠ",
    DEVICE_TRUSTED: "Ø¬Ù‡Ø§Ø² Ù…Ø¹ØªÙ…Ø¯",
    DEVICE_DISABLED: "Ø¬Ù‡Ø§Ø² Ù…Ø¹Ø·Ù„",
    unknown: "ØºÙŠØ± Ù…Ø¹Ø±ÙˆÙ",
  }[value] || value || "-";
}

function badge(value) {
  return `<span class="status ${escapeHtml(value)}">${escapeHtml(statusLabel(value))}</span>`;
}

function healthBadge(ok, label = "") {
  return `<span class="status ${ok ? "APPROVED" : "REJECTED"}">${escapeHtml(label || (ok ? "Ø³Ù„ÙŠÙ…" : "ÙŠØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©"))}</span>`;
}

function formatMeters(value) {
  return value == null || value === "" || Number.isNaN(Number(value)) ? "-" : `${Math.round(Number(value))} Ù…ØªØ±`;
}

function initials(name) {
  return String(name || "?").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("") || "?";
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

function avatar(person, size = "") {
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
function isStrongPassword(value) {
  return new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{10,}$").test(String(value || ""));
}

function readForm(form, options = {}) {
  const values = Object.fromEntries(new FormData(form));
  const errors = [];
  const emailPattern = new RegExp("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  const phonePattern = new RegExp("^01[0-9]{8,10}$");
  const passwordPolicy = options.passwordPolicy || form.dataset.passwordPolicy || "none";
  for (const [name, value] of Object.entries(values)) {
    const text = String(value || "").trim();
    if (["email", "mail"].includes(name) && text && !emailPattern.test(text)) errors.push("Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­.");
    if (["phone", "mobile"].includes(name) && text && !phonePattern.test(text.replace(/\s+/g, ""))) errors.push("Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø±Ù‚Ù…Ù‹Ø§ Ù…ØµØ±ÙŠÙ‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§ ÙŠØ¨Ø¯Ø£ Ø¨Ù€ 01.");
    const shouldValidatePassword = name === "newPassword" || (name === "password" && passwordPolicy === "strong");
    if (shouldValidatePassword && text && !isStrongPassword(text)) errors.push("ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© ÙŠØ¬Ø¨ Ø£Ù„Ø§ ØªÙ‚Ù„ Ø¹Ù† 10 Ø£Ø­Ø±Ù ÙˆØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø­Ø±Ù ÙƒØ¨ÙŠØ± ÙˆØµØºÙŠØ± ÙˆØ±Ù‚Ù… ÙˆØ±Ù…Ø².");
  }
  if (errors.length) throw new Error([...new Set(errors)].join("\n"));
  return values;
}

function optionList(items = [], selected = "", empty = "") {
  return `${empty ? `<option value="">${escapeHtml(empty)}</option>` : ""}${items.map((item) => {
    const value = item.id ?? item.value ?? item.name;
    return `<option value="${escapeHtml(value)}" ${String(selected || "") === String(value || "") ? "selected" : ""}>${escapeHtml(item.name ?? item.fullName ?? item.label ?? value)}</option>`;
  }).join("")}`;
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

function enhanceResponsiveTables(scope = app) {
  scope.querySelectorAll(".table-wrap table").forEach((tableElement) => {
    const headers = [...tableElement.querySelectorAll("thead th")].map((th) => th.textContent.trim());
    tableElement.querySelectorAll("tbody tr").forEach((row) => {
      [...row.children].forEach((cell, index) => {
        if (!cell.dataset.label && headers[index]) cell.dataset.label = headers[index];
      });
    });
  });
}

function simpleForm(id, fields, submitText) {
  return `<form id="${id}" class="form-grid compact-form">${fields.map(([name, label, type = "text", opts = "", value = ""]) => `<label>${escapeHtml(label)}${type === "select" ? `<select name="${name}">${opts}</select>` : type === "textarea" ? `<textarea name="${name}">${escapeHtml(value)}</textarea>` : `<input name="${name}" type="${type}" value="${escapeHtml(value)}" ${type !== "checkbox" ? "required" : ""}/>`}</label>`).join("")}<div class="form-actions"><button class="button primary" type="submit">${escapeHtml(submitText)}</button></div></form>`;
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

function askText({ title = "Ø·Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª", message = "Ø§ÙƒØªØ¨ Ø§Ù„ØªÙØ§ØµÙŠÙ„", defaultValue = "", confirmLabel = "Ø­ÙØ¸", cancelLabel = "Ø¥Ù„ØºØ§Ø¡", required = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <form class="confirm-modal prompt-modal">
        <div class="panel-head"><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p></div></div>
        <label><span class="sr-only">${escapeHtml(title)}</span><textarea name="answer" ${required ? "required" : ""}>${escapeHtml(defaultValue)}</textarea></label>
        <div class="form-actions">
          <button class="button ghost" type="button" data-cancel>${escapeHtml(cancelLabel)}</button>
          <button class="button primary" type="submit">${escapeHtml(confirmLabel)}</button>
        </div>
      </form>
    `;
    const form = overlay.querySelector("form");
    const input = overlay.querySelector("textarea");
    const cleanup = (answer) => { overlay.remove(); document.removeEventListener("keydown", onKey); resolve(answer); };
    const onKey = (event) => { if (event.key === "Escape") cleanup(null); };
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cleanup(null); });
    overlay.querySelector("[data-cancel]").addEventListener("click", () => cleanup(null));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const value = String(input.value || "").trim();
      if (required && !value) { input.focus(); return; }
      cleanup(value);
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    input.focus();
    input.select();
  });
}

function downloadFile(name, content, type = "text/plain;charset=utf-8") {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type }));
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

function toCsv(rows) {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}

function exportHtmlTable(name, headers, rows) {
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><style>body{font-family:Arial,sans-serif;direction:rtl}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:8px;text-align:right}th{background:#f3f4f6}</style></head><body><table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  downloadFile(name, html, "application/vnd.ms-excel;charset=utf-8");
}

function printReport(title, headers, rows) {
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return;
  win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;direction:rtl;color:#111827}h1{font-size:22px}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #d1d5db;padding:8px;text-align:right;font-size:12px}th{background:#f3f4f6}.meta{color:#6b7280;margin-bottom:12px}@media print{button{display:none}}</style></head><body><button onclick="print()">Ø·Ø¨Ø§Ø¹Ø© / Ø­ÙØ¸ PDF</button><h1>${escapeHtml(title)}</h1><div class="meta">ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙ‚Ø±ÙŠØ±: ${new Date().toLocaleString("ar-EG")}</div><table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
  win.document.close();
}
function printBrandedReport(title, summaryHtml, headers, rows) {
  const win = window.open("", "_blank", "width=1200,height=850");
  if (!win) return;
  win.document.write(`<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title><style>body{font-family:Arial,Tahoma,sans-serif;padding:28px;direction:rtl;color:#0f172a}.brand{display:flex;align-items:center;gap:14px;border-bottom:3px solid #0ea5e9;padding-bottom:16px;margin-bottom:18px}.brand img{width:68px;height:68px;object-fit:contain}.brand h1{margin:0;font-size:24px}.brand p{margin:4px 0 0;color:#64748b}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}.summary div{border:1px solid #dbeafe;background:#eff6ff;border-radius:14px;padding:10px}.summary strong{display:block;font-size:20px;color:#0369a1}.qr-print{display:block;margin:18px auto;width:300px;height:300px}table{border-collapse:collapse;width:100%;margin-top:16px}th,td{border:1px solid #d1d5db;padding:8px;text-align:right;font-size:12px}th{background:#e0f2fe}.meta{color:#64748b;margin:10px 0}.actions{margin-bottom:16px}@media print{.actions{display:none}.summary{break-inside:avoid}}</style></head><body><div class="actions"><button onclick="print()">Ø·Ø¨Ø§Ø¹Ø© / Ø­ÙØ¸ PDF</button></div><div class="brand"><img src="../shared/images/ahla-shabab-logo.png" onerror="this.style.display='none'" /><div><h1>${escapeHtml(title)}</h1><p>Ø¬Ù…Ø¹ÙŠØ© Ø®ÙˆØ§Ø·Ø± Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨ Ø§Ù„Ø®ÙŠØ±ÙŠØ© â€” Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©</p><p class="meta">ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙ‚Ø±ÙŠØ±: ${new Date().toLocaleString("ar-EG")}</p></div></div>${summaryHtml}<table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
  win.document.close();
}

function punchUrlForEmployee(employee = {}) {
  const url = new URL(location.href);
  url.pathname = url.pathname.replace(/\/admin\/.*$/, "/employee/index.html");
  url.hash = `punch${employee.id ? `?employeeId=${encodeURIComponent(employee.id)}` : ""}`;
  return url.toString();
}

function qrImageUrl(value, size = 220) {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#071120"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#94a3b8" font-size="16" font-family="Arial">QR Ù…ØªÙˆÙ‚Ù</text></svg>`);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}


async function getBrowserLocation() {
  if (!navigator.geolocation) return { locationPermission: "unavailable", accuracyMeters: null };
  return await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const accuracyMeters = Math.round(Number(position.coords.accuracy || 0));
        resolve({
          locationPermission: "granted",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: accuracyMeters,
          accuracyMeters,
          capturedAt: new Date().toISOString(),
        });
      },
      (error) => resolve({ locationPermission: error.code === error.PERMISSION_DENIED ? "denied" : "unknown", accuracyMeters: null }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

const referenceDataCache = { ts: 0, data: null };
async function referenceData({ force = false } = {}) {
  if (!force && referenceDataCache.data && Date.now() - referenceDataCache.ts < 120000) return referenceDataCache.data;
  const safe = async (reader, fallback = []) => {
    try {
      return unwrap(await reader());
    } catch {
      return fallback;
    }
  };
  const fallbackEmployee = state.user?.employee ? [state.user.employee] : [];
  const fallbackRole = state.user?.role ? [state.user.role] : [];
  const fallbackBranch = state.user?.branch ? [state.user.branch] : state.user?.employee?.branch ? [state.user.employee.branch] : [];
  const fallbackDepartment = state.user?.department ? [state.user.department] : state.user?.employee?.department ? [state.user.employee.department] : [];
  const fallbackGovernorate = state.user?.governorate ? [state.user.governorate] : state.user?.employee?.governorate ? [state.user.employee.governorate] : [];
  const fallbackComplex = state.user?.complex ? [state.user.complex] : state.user?.employee?.complex ? [state.user.employee.complex] : [];
  const [roles, branches, departments, governorates, complexes, employees, permissions] = await Promise.all([
    safe(() => endpoints.roles(), fallbackRole),
    safe(() => endpoints.branches(), fallbackBranch),
    safe(() => endpoints.departments(), fallbackDepartment),
    safe(() => endpoints.governorates(), fallbackGovernorate),
    safe(() => endpoints.complexes(), fallbackComplex),
    safe(() => endpoints.employees(), fallbackEmployee),
    safe(() => endpoints.permissions(), []),
  ]);
  referenceDataCache.ts = Date.now();
  referenceDataCache.data = { roles, branches, departments, governorates, complexes, employees, permissions };
  return referenceDataCache.data;
}

function shell(content, title, description = "") {
  const previousSidebar = app.querySelector(".sidebar");
  if (previousSidebar) {
    state.sidebarScrollTop = previousSidebar.scrollTop;
    sessionStorage.setItem("hr.sidebarScrollTop", String(state.sidebarScrollTop));
  }
  const current = activeNavKey(routeKey());
  document.body.classList.remove("nav-open");
  document.body.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  app.innerHTML = `
    <div class="app-shell">
      <div class="sidebar-overlay" data-action="nav-close"></div>
      <aside class="sidebar ${state.sidebarCollapsed ? "is-collapsed" : ""}">
        <button class="sidebar-close" type="button" data-action="nav-close" aria-label="Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©">Ã—</button>
        <div class="brand">
          <img src="../shared/images/ahla-shabab-logo.png" alt="" onerror="this.style.display='none'" />
          <div><strong>Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ø¶ÙˆØ±</strong><span>HR Operations SaaS</span></div>
        </div>
        <div class="sidebar-account-section">
          <div class="user-info" data-route="settings">
            ${avatar(userAvatarSubject(), "small")}
            <div>
              <strong>${escapeHtml(state.user?.name || state.user?.fullName || "Ù…Ø³ØªØ®Ø¯Ù…")}</strong>
              <small>${escapeHtml(roleLabel())}</small>
            </div>
          </div>
          <button class="button ghost full" type="button" data-action="logout">ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬</button>
        </div>
        <nav class="nav" aria-label="Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©">
          ${navGroups.map(([group, routes]) => `
            <section class="nav-group">
              <p>${escapeHtml(group)}</p>
              ${routes.filter(([key]) => canRoute(key)).map(([key, label]) => `<button class="${current === key ? "is-active" : ""}" data-route="${key}" aria-current="${current === key ? "page" : "false"}"><span>${escapeHtml(label)}</span></button>`).join("")}
            </section>
          `).join("")}
          <section class="nav-group portal-links">
            <p>Ø§Ù„Ø§Ù†ØªÙ‚Ø§Ù„ Ù„Ù„Ø£Ù†Ø¸Ù…Ø©</p>
            <button data-action="employee-portal"><span>ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù</span></button>
            <button data-action="executive-portal"><span>Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ</span></button>
          </section>
        </nav>
        <button class="collapse-button" type="button" data-action="collapse-sidebar">${state.sidebarCollapsed ? "ØªÙˆØ³ÙŠØ¹ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©" : "Ø·ÙŠ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©"}</button>
      </aside>
      <button class="nav-fab" type="button" data-action="sidebar-expand" aria-label="ÙØªØ­ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©" title="ÙØªØ­ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©">â˜°</button>
      <main class="main">
        <header class="topbar">
          <div class="topbar-left">
            <button class="button ghost mobile-menu" type="button" data-action="nav-open" aria-expanded="false">Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©</button>
            <div class="compact-user-info desktop-hidden">
               ${avatar(userAvatarSubject(), "tiny")}
               <div><strong>${escapeHtml(state.user?.name || state.user?.fullName || "Ù…Ø³ØªØ®Ø¯Ù…")}</strong><small>${escapeHtml(roleLabel())}</small></div>
            </div>
          </div>
          <div class="page-title mobile-hidden"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div>
          <div class="toolbar mobile-hidden">
            <span class="user-chip" title="${escapeHtml(roleLabel())}">${avatar(userAvatarSubject(), "tiny")}<span>${escapeHtml(state.user?.name || state.user?.fullName || "Ù…Ø³ØªØ®Ø¯Ù…")}</span></span>
            <button class="button ghost" data-action="refresh">ØªØ­Ø¯ÙŠØ«</button>
            <button class="button danger" data-action="logout">ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬</button>
          </div>
        </header>
        ${state.user?.mustChangePassword ? `<div class="message warning">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø­Ø§Ù„ÙŠØ© Ù…Ø¤Ù‚ØªØ©. Ø§ÙØªØ­ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ÙˆØºÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù‚Ø¨Ù„ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø­Ø³Ø§Ø¨.</div>` : ""}
        ${state.message ? `<div class="message">${escapeHtml(state.message)}</div>` : ""}
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${content}
      </main>
    </div>
  `;

  enhanceResponsiveTables(app);
  const sidebar = app.querySelector(".sidebar");
  if (sidebar) {
    requestAnimationFrame(() => {
      sidebar.scrollTop = Number(state.sidebarScrollTop || 0);
      sidebar.querySelector('.nav button.is-active')?.scrollIntoView?.({ block: 'nearest' });
    });
    sidebar.addEventListener("scroll", () => {
      state.sidebarScrollTop = sidebar.scrollTop;
      sessionStorage.setItem("hr.sidebarScrollTop", String(state.sidebarScrollTop));
    }, { passive: true });
  }

  const closeMobileNav = () => {
    document.body.classList.remove("nav-open");
    app.querySelectorAll('[data-action="nav-open"]').forEach((button) => button.setAttribute("aria-expanded", "false"));
  };
  const openMobileNav = () => {
    document.body.classList.add("nav-open");
    app.querySelectorAll('[data-action="nav-open"]').forEach((button) => button.setAttribute("aria-expanded", "true"));
  };
  app.querySelectorAll("[data-route]").forEach((button) => button.addEventListener("click", () => {
    const currentSidebar = app.querySelector(".sidebar");
    if (currentSidebar) {
      state.sidebarScrollTop = currentSidebar.scrollTop;
      sessionStorage.setItem("hr.sidebarScrollTop", String(state.sidebarScrollTop));
    }
    closeMobileNav();
    location.hash = button.dataset.route;
  }));
  app.querySelectorAll('[data-action="nav-open"]').forEach((button) => button.addEventListener("click", openMobileNav));
  app.querySelectorAll('[data-action="nav-close"]').forEach((button) => button.addEventListener("click", closeMobileNav));
  app.querySelectorAll('[data-action="sidebar-expand"]').forEach((button) => button.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 1180px)").matches) {
      openMobileNav();
      return;
    }
    state.sidebarCollapsed = false;
    localStorage.setItem("hr.sidebarCollapsed", "false");
    render();
  }));
  app.querySelector('[data-action="collapse-sidebar"]')?.addEventListener("click", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem("hr.sidebarCollapsed", String(state.sidebarCollapsed));
    render();
  });
  app.querySelectorAll('[data-action="employee-portal"]').forEach(btn => btn.addEventListener("click", () => goEmployeePortal("home")));
  app.querySelectorAll('[data-action="executive-portal"]').forEach(btn => btn.addEventListener("click", () => goExecutivePortal("home")));
  app.querySelectorAll('[data-action="refresh"]').forEach(btn => btn.addEventListener("click", render));
  app.querySelectorAll('[data-action="logout"]').forEach(btn => btn.addEventListener("click", async () => {
    await endpoints.logout();
    state.user = null;
    renderLogin();
  }));
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.body.classList.remove("nav-open");
});

async function renderLogin() {
  const identifierValue = state.loginIdentifier || gateIdentityForPortal("admin") || "";
  const passwordValue = state.loginPassword || "";
  app.innerHTML = `
    <div class="login-screen">
      <form class="login-panel" id="login-form" data-password-policy="none" novalidate>
        <div class="login-mark">HR</div>
        <h1>ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„</h1>
        <p>Ø§ÙƒØªØ¨ Ø¨Ø±ÙŠØ¯Ùƒ ÙˆÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±. Ø¹Ù†Ø¯ Ø­Ø¯ÙˆØ« Ø®Ø·Ø£ Ù„Ù† ÙŠØªÙ… Ù…Ø³Ø­ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„ØªÙŠ Ø£Ø¯Ø®Ù„ØªÙ‡Ø§.</p>
        ${state.error ? `<div class="message error">${escapeHtml(state.error)}</div>` : ""}
        ${state.lastLoginFailed ? `<div class="message warning compact">Ù„Ùˆ Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ø¶ØºØ· Ø¹Ù„Ù‰ "Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±" ÙˆØ³ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ.</div>` : ""}
        <label>Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø£Ùˆ Ø§Ù„Ø§Ø³Ù…<input name="identifier" value="${escapeHtml(identifierValue)}" autocomplete="username" required /></label>
        <label>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±<input name="password" type="password" value="${escapeHtml(passwordValue)}" autocomplete="current-password" required /></label>
        <button class="button primary full" type="submit">Ø¯Ø®ÙˆÙ„</button>
        <button class="button ghost full forgot-password-btn" type="button" data-forgot-password>Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±ØŸ Ø£Ø±Ø³Ù„ Ø±Ø§Ø¨Ø· Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ¹ÙŠÙŠÙ†</button>
        <div class="login-help-note">Ù„Ù† ÙŠØªÙ… Ù…Ø³Ø­ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ/Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…ÙƒØªÙˆØ¨Ø© Ø¹Ù†Ø¯ ÙØ´Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„.</div>
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
      await endpoints.adminAccessLog?.({ action: "admin.login.success", result: "SUCCESS", route: location.hash || "login" }).catch(() => null);
      state.loginPassword = "";
      state.lastLoginFailed = false;
      if (!isAdminPortalUser(state.user)) return isExecutiveOnlyRole(state.user) ? goExecutivePortal("home") : goEmployeePortal("home");
      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.", "");
      render();
    } catch (error) {
      await endpoints.adminAccessLog?.({ action: "admin.login.failed", result: "FAILED", metadata: { identifier: state.loginIdentifier } }).catch(() => null);
      state.lastLoginFailed = true;
      setMessage("", error.message || "ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.");
      renderLogin();
    }
  });
  app.querySelector("[data-forgot-password]").addEventListener("click", async () => {
    const values = readForm(form);
    state.loginIdentifier = values.identifier || state.loginIdentifier || "";
    state.loginPassword = values.password || state.loginPassword || "";
    if (!state.loginIdentifier) {
      setMessage("", "Ø§ÙƒØªØ¨ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø£ÙˆÙ„Ù‹Ø§ Ø«Ù… Ø§Ø¶ØºØ· Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±.");
      renderLogin();
      return;
    }
    try {
      await endpoints.forgotPassword(state.loginIdentifier);
      state.lastLoginFailed = false;
      setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¥Ù„Ù‰ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ù…Ø³Ø¬Ù„ØŒ Ø±Ø§Ø¬Ø¹ Inbox Ø£Ùˆ Spam.", "");
      renderLogin();
    } catch (error) {
      state.lastLoginFailed = true;
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø±Ø§Ø¨Ø· Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªØ¹ÙŠÙŠÙ†.");
      renderLogin();
    }
  });
}

async function renderDashboard() {
  const dashboard = normalizeDashboardPayload(unwrap(await endpoints.dashboard()));
  const trends = safeList(dashboard.attendanceTrends);
  const breakdown = safeList(dashboard.attendanceBreakdown);
  const latestEvents = safeList(dashboard.latestEvents);
  const latestAudit = safeList(dashboard.latestAudit);
  const workflowLatest = safeList(dashboard.workflowLatest);
  const readiness = dashboard.readiness || dashboard.executive?.readiness || { score: 0, grade: "-", parts: [] };
  const workflow = dashboard.executive?.workflow || { pending: 0, approved: 0, rejected: 0, stale: 0, byKind: [] };
  const max = Math.max(1, ...trends.map((item) => Number(item.present || 0) + Number(item.late || 0) + Number(item.mission || 0)));
  shell(
    `<section class="grid dashboard-grid executive-dashboard">
      ${safeList(dashboard.metrics).map((metric) => `<article class="metric"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong><small>${escapeHtml(metric.helper || "")}</small></article>`).join("")}
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ù„ÙˆØ­Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ø°ÙƒÙŠØ©</h2><p>Ù…Ø¤Ø´Ø± Ø§Ù„Ø¬Ø§Ù‡Ø²ÙŠØ©ØŒ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¹Ø§Ù„Ù‚Ø©ØŒ ÙˆÙ…Ø±Ø§Ø¬Ø¹Ø§Øª Ø§Ù„Ø­Ø¶ÙˆØ± ÙÙŠ Ø´Ø§Ø´Ø© ÙˆØ§Ø­Ø¯Ø©.</p></div><div class="score-ring"><strong>${escapeHtml(readiness.score || 0)}%</strong><span>${escapeHtml(readiness.grade || "-")}</span></div></div>
        <div class="readiness-grid">${safeList(readiness.parts).map((part) => `<div class="readiness-item ${part.ok ? "ok" : "warn"}"><strong>${escapeHtml(part.label)}</strong><span>${escapeHtml(part.detail || "")}</span><small>${escapeHtml(part.score || 0)} Ù†Ù‚Ø·Ø©</small></div>`).join("")}</div>
      </article>
      <article class="panel span-7">
        <div class="panel-head"><div><h2>ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ø­Ø¶ÙˆØ± Ø­Ø³Ø¨ Ø§Ù„Ù‚Ø³Ù…</h2><p>Ù…Ù‚Ø§Ø±Ù†Ø© ØªØ´ØºÙŠÙ„ÙŠØ© Ø³Ø±ÙŠØ¹Ø©</p></div><span>Ø§Ù„ÙŠÙˆÙ…</span></div>
        <div class="chart">${trends.map((item) => `<div class="bar"><div class="bar-fill" style="height:${((Number(item.present || 0) + Number(item.late || 0) + Number(item.mission || 0)) / max) * 150}px"></div><span>${escapeHtml(item.label)}</span></div>`).join("") || `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø§ØªØ¬Ø§Ù‡Ø§Øª Ø¨Ø¹Ø¯.</div>`}</div>
      </article>
      <article class="panel span-5">
        <div class="panel-head"><div><h2>Ù…Ù„Ø®Øµ Ø§Ù„Ø·Ù„Ø¨Ø§Øª</h2><p>Workflow Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª</p></div><button class="button ghost" data-route="requests">ÙØªØ­ Ø§Ù„Ù…Ø±ÙƒØ²</button></div>
        <div class="mini-stats">
          <div><span>Ù…Ø¹Ù„Ù‚Ø©</span><strong>${escapeHtml(workflow.pending || 0)}</strong></div>
          <div><span>Ù…ØªØ£Ø®Ø±Ø©</span><strong>${escapeHtml(workflow.stale || 0)}</strong></div>
          <div><span>Ù…Ù‚Ø¨ÙˆÙ„Ø©</span><strong>${escapeHtml(workflow.approved || 0)}</strong></div>
          <div><span>Ù…Ø±ÙÙˆØ¶Ø©</span><strong>${escapeHtml(workflow.rejected || 0)}</strong></div>
        </div>
        ${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ", "Ù…Ø¹Ù„Ù‚"], safeList(workflow.byKind).map((item) => `<tr><td>${escapeHtml(item.kind)}</td><td>${escapeHtml(item.count)}</td><td>${escapeHtml(item.pending)}</td></tr>`))}
      </article>
      <article class="panel span-8">
        <div class="panel-head"><div><h2>Ø¢Ø®Ø± Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ø­Ø¶ÙˆØ±</h2><p>Ø¢Ø®Ø± Ø§Ù„Ø­Ø±ÙƒØ§Øª Ø§Ù„Ù…Ø³Ø¬Ù„Ø©</p></div><button class="button ghost" data-route="attendance">ÙØªØ­ Ø§Ù„Ø­Ø¶ÙˆØ±</button></div>
        ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ÙˆÙ‚Øª", "Ø§Ù„Ù…ØµØ¯Ø±"], latestEvents.map((event) => `<tr><td class="person-cell">${avatar(event.employee, "tiny")}<span>${escapeHtml(event.employee?.fullName || event.employeeId || "-")}</span></td><td>${badge(event.type)}</td><td>${date(event.eventAt)}</td><td>${escapeHtml(event.source || "-")}</td></tr>`))}
      </article>
      <article class="panel span-4">
        <div class="panel-head"><div><h2>Ø·Ù„Ø¨Ø§Øª ØªØ­ØªØ§Ø¬ Ù‚Ø±Ø§Ø±</h2><p>Ø¢Ø®Ø± Ø¹Ù†Ø§ØµØ± Ù…Ø±ÙƒØ² Ø§Ù„Ø·Ù„Ø¨Ø§Øª</p></div><button class="button ghost" data-route="requests">Ù…Ø±Ø§Ø¬Ø¹Ø©</button></div>
        ${table(["Ø§Ù„Ø·Ù„Ø¨", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø­Ø§Ù„Ø©"], workflowLatest.map((item) => `<tr><td>${escapeHtml(item.kindLabel || item.kind)}<br><small>${escapeHtml(item.label || "")}</small></td><td>${escapeHtml(item.employee?.fullName || "-")}</td><td>${badge(item.status)}</td></tr>`))}
      </article>
      <article class="panel span-12">
        <div class="panel-head"><div><h2>Ø¢Ø®Ø± Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ù†Ø¸Ø§Ù…</h2><p>Audit Log</p></div><button class="button ghost" data-route="audit">Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙ„</button></div>
        ${table(["Ø§Ù„Ø¹Ù…Ù„ÙŠØ©", "Ø§Ù„ÙƒÙŠØ§Ù†", "Ø§Ù„ÙˆÙ‚Øª"], latestAudit.map((item) => `<tr><td>${escapeHtml(item.action)}</td><td>${escapeHtml(item.entityType)}</td><td>${date(item.createdAt)}</td></tr>`))}
      </article>
    </section>`,
    "Ù„ÙˆØ­Ø© Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©",
    "Ù„ÙˆØ­Ø© Ù‚ÙŠØ§Ø¯Ø© ØªÙ†ÙÙŠØ°ÙŠØ© ØªØ¬Ù…Ø¹ Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ù†Ø¸Ø§Ù….",
  );
}


function employeeFilters(ref) {
  return `
    <form class="filters" id="employee-filters">
      <input name="q" placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø£Ùˆ Ø§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ" />
      <select name="managerEmployeeId">${optionList(ref.employees.map((item) => ({ id: item.id, name: item.fullName })), "", "ÙƒÙ„ Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ†")}</select>
    </form>`;
}

function filterEmployees(employees) {
  const values = readForm(app.querySelector("#employee-filters"));
  const q = (values.q || "").trim().toLowerCase();
  return employees.filter((employee) => {
    const text = [employee.fullName, employee.phone, employee.email, employee.jobTitle].join(" ").toLowerCase();
    return (!q || text.includes(q))
      && (!values.managerEmployeeId || employee.managerEmployeeId === values.managerEmployeeId);
  });
}

async function renderEmployees() {
  const [employees, ref] = await Promise.all([endpoints.employees().then(unwrap), referenceData()]);
  shell(
    `<section class="stack employees-control-center">
      <article class="panel">
        <div class="panel-head">
          <div><h2>Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø£Ø´Ø®Ø§Øµ ÙˆØ§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</h2><p>Ø¥Ø¯Ø§Ø±Ø© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†ØŒ Ø§Ù„Ø±Ø¨Ø· Ø¨Ø§Ù„Ø­Ø³Ø§Ø¨Ø§ØªØŒ ÙˆØ§Ù„ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠ Ù…Ù† Ø´Ø§Ø´Ø© ÙˆØ§Ø­Ø¯Ø©.</p></div>
          <div class="toolbar"><button class="button primary" data-action="new-employee">Ø¥Ø¶Ø§ÙØ© Ù…ÙˆØ¸Ù</button><button class="button ghost" data-export-employees>ØªØµØ¯ÙŠØ± CSV</button><button class="button ghost" data-export-employees-xls>Excel</button><button class="button ghost" data-print-employees>Ø·Ø¨Ø§Ø¹Ø©</button></div>
        </div>
        ${employeeFilters(ref)}
        <div class="bulk-bar advanced-bulk" id="employees-bulk-bar">
          <label class="check-row"><input type="checkbox" id="employee-select-all" /> ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¸Ø§Ù‡Ø±Ø©</label>
          <span id="employee-selected-count">Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆØ¸ÙÙŠÙ†</span>
          <select id="bulk-status"><option value="ACTIVE">ØªÙ†Ø´ÙŠØ·</option><option value="SUSPENDED">Ø¥ÙŠÙ‚Ø§Ù Ù…Ø¤Ù‚Øª</option><option value="TERMINATED">Ø¥Ù†Ù‡Ø§Ø¡ Ø®Ø¯Ù…Ø©</option></select>
          <button class="button ghost" data-bulk-employee-status disabled>ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø­Ø§Ù„Ø©</button>
          <select id="bulk-department"><option value="">Ù†Ù‚Ù„ Ù„Ù‚Ø³Ù…...</option>${optionList(ref.departments)}</select>
          <select id="bulk-manager"><option value="">ØªØºÙŠÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ±...</option>${optionList(ref.employees.map((item) => ({ id: item.id, name: item.fullName })))}</select>
          <button class="button ghost" data-bulk-employee-assign disabled>ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù†Ù‚Ù„</button>
          <button class="button ghost" data-bulk-employee-notify disabled>Ø¥Ø±Ø³Ø§Ù„ ØªÙ†Ø¨ÙŠÙ‡</button>
          <button class="button danger ghost" data-bulk-employee-delete disabled>Ø­Ø°Ù Ù…Ù†Ø·Ù‚ÙŠ</button>
        </div>
        <div id="employees-list" class="people-grid"></div>
      </article>
      <article id="employee-editor" class="panel hidden"></article>
    </section>`,
    "Ø§Ù„Ø£Ø´Ø®Ø§Øµ ÙˆØ§Ù„Ù…ÙˆØ¸ÙÙˆÙ†",
    "Ù…Ù„ÙØ§Øª ÙØ¹Ù„ÙŠØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ø¥Ø¶Ø§ÙØ© ÙˆØ§Ù„ØªØ¹Ø¯ÙŠÙ„ ÙˆØ§Ù„Ø±Ø¨Ø· ÙˆØ§Ù„Ø­Ø°Ù Ø§Ù„Ù…Ù†Ø·Ù‚ÙŠ ÙˆØ§Ù„ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠ.",
  );

  const selectedEmployees = new Set();
  const selectedCountText = () => selectedEmployees.size ? `ØªÙ… ØªØ­Ø¯ÙŠØ¯ ${selectedEmployees.size} Ù…ÙˆØ¸Ù` : "Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ Ù…ÙˆØ¸ÙÙŠÙ†";
  const updateBulkBar = () => {
    const count = selectedEmployees.size;
    app.querySelector("#employee-selected-count").textContent = selectedCountText();
    app.querySelectorAll("[data-bulk-employee-delete],[data-bulk-employee-status],[data-bulk-employee-assign],[data-bulk-employee-notify]").forEach((button) => { button.disabled = count === 0; });
  };
  const selectedIds = () => [...selectedEmployees];
  const runBulk = async (body, success) => {
    const result = await endpoints.bulkEmployeeAction({ ids: selectedIds(), ...body });
    setMessage(`${success} â€” ØªÙ… ØªØ­Ø¯ÙŠØ« ${result.updated || 0} Ù…ÙˆØ¸Ù.`, "");
    render();
  };

  const draw = () => {
    const filtered = filterEmployees(employees);
    const visibleIds = new Set(filtered.map((employee) => employee.id));
    [...selectedEmployees].forEach((id) => { if (!visibleIds.has(id)) selectedEmployees.delete(id); });
    app.querySelector("#employees-list").innerHTML = filtered.map((employee) => `
      <article class="person-card executive-person-card ${selectedEmployees.has(employee.id) ? "is-selected" : ""}">
        <div class="card-selection"><input type="checkbox" data-select-employee="${employee.id}" ${selectedEmployees.has(employee.id) ? "checked" : ""} /></div>
        <div class="card-header">
          <div class="avatar-wrapper" data-view="${employee.id}">
            ${avatar(employee, "large")}
            <div class="status-badge-corner">${badge(employee.status || "ACTIVE")}</div>
          </div>
        </div>
        <div class="card-body">
          <h3 class="emp-name">${escapeHtml(employee.fullName)}</h3>
          <p class="emp-job">${escapeHtml(employee.jobTitle || "Ù…ÙˆØ¸Ù")}</p>
          <div class="emp-details-grid">
            <div class="detail-item"><span>Ø§Ù„Ù‡Ø§ØªÙ</span><strong>${escapeHtml(employee.phone || "-")}</strong></div>
            <div class="detail-item"><span>Ø§Ù„Ù‚Ø³Ù…</span><strong>${escapeHtml(employee.department?.name || "-")}</strong></div>
            <div class="detail-item full"><span>Ø§Ù„Ø¨Ø±ÙŠØ¯</span><strong>${escapeHtml(employee.email || "-")}</strong></div>
            <div class="detail-item full"><span>Ø§Ù„Ù…Ø¯ÙŠØ±</span><strong>${escapeHtml(employee.manager?.fullName || "Ø¨Ø¯ÙˆÙ†")}</strong></div>
          </div>
        </div>
        <div class="card-footer-actions">
          <button class="button primary" data-view="${employee.id}">Ø¹Ø±Ø¶</button>
          <button class="button ghost" data-edit="${employee.id}">ØªØ¹Ø¯ÙŠÙ„</button>
          <button class="button danger ghost" data-delete="${employee.id}">Ø­Ø°Ù</button>
        </div>
      </article>
    `).join("") || `<div class="empty-box">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø©.</div>`;
    bindEmployeeActions(ref);
    app.querySelectorAll("[data-select-employee]").forEach((input) => input.addEventListener("change", () => {
      if (input.checked) selectedEmployees.add(input.dataset.selectEmployee);
      else selectedEmployees.delete(input.dataset.selectEmployee);
      input.closest(".person-card")?.classList.toggle("is-selected", input.checked);
      updateBulkBar();
    }));
    const selectAll = app.querySelector("#employee-select-all");
    if (selectAll) selectAll.checked = filtered.length > 0 && filtered.every((employee) => selectedEmployees.has(employee.id));
    updateBulkBar();
  };

  app.querySelector("#employee-filters").addEventListener("input", debounce(draw, 250));
  app.querySelector("#employee-select-all").addEventListener("change", (event) => {
    const filtered = filterEmployees(employees);
    filtered.forEach((employee) => event.target.checked ? selectedEmployees.add(employee.id) : selectedEmployees.delete(employee.id));
    draw();
  });
  app.querySelector("[data-bulk-employee-delete]").addEventListener("click", async () => {
    if (!await confirmAction({ title: "Ø­Ø°Ù Ù…Ù†Ø·Ù‚ÙŠ Ø¬Ù…Ø§Ø¹ÙŠ", message: `Ø³ÙŠØªÙ… Ø­Ø°Ù ${selectedEmployees.size} Ù…ÙˆØ¸Ù Ù…Ù†Ø·Ù‚ÙŠÙ‹Ø§ ÙˆØªØ¹Ø·ÙŠÙ„ Ø­Ø³Ø§Ø¨Ø§ØªÙ‡Ù… Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø©.`, confirmLabel: "Ø­Ø°Ù Ø§Ù„Ù…Ø­Ø¯Ø¯", danger: true })) return;
    await runBulk({ action: "delete" }, "ØªÙ… Ø§Ù„Ø­Ø°Ù Ø§Ù„Ù…Ù†Ø·Ù‚ÙŠ Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠ");
  });
  app.querySelector("[data-bulk-employee-status]").addEventListener("click", async () => {
    const status = app.querySelector("#bulk-status")?.value || "ACTIVE";
    await runBulk({ action: "status", status }, "ØªÙ… ØªØºÙŠÙŠØ± Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠØ©");
  });
  app.querySelector("[data-bulk-employee-assign]").addEventListener("click", async () => {
    const departmentId = app.querySelector("#bulk-department")?.value || undefined;
    const managerEmployeeId = app.querySelector("#bulk-manager")?.value || undefined;
    if (!departmentId && !managerEmployeeId) return setMessage("", "Ø§Ø®ØªØ± Ù‚Ø³Ù…Ù‹Ø§ Ø£Ùˆ Ù…Ø¯ÙŠØ±Ù‹Ø§ Ù‚Ø¨Ù„ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù†Ù‚Ù„.");
    await runBulk({ action: "assign", departmentId, managerEmployeeId }, "ØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù†Ù‚Ù„ Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠ");
  });
  app.querySelector("[data-bulk-employee-notify]").addEventListener("click", async () => {
    const message = await askText({ title: "ØªÙ†Ø¨ÙŠÙ‡ Ø¬Ù…Ø§Ø¹ÙŠ", message: "Ø§ÙƒØªØ¨ Ù†Øµ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ø°ÙŠ Ø³ÙŠØµÙ„ Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ù…Ø­Ø¯Ø¯ÙŠÙ†.", defaultValue: "ÙŠØ±Ø¬Ù‰ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø¹Ù†Ø¯ Ø§Ù„ØªÙØ±Øº.", confirmLabel: "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡", required: true });
    if (!message) return;
    await runBulk({ action: "notify", title: "ØªÙ†Ø¨ÙŠÙ‡ Ù…Ù† Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©", message }, "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠ");
  });
  app.querySelector('[data-action="new-employee"]').addEventListener("click", () => showEmployeeEditor(ref));
  const employeeExportRows = () => filterEmployees(employees).map((e) => [e.fullName, e.phone, e.email, e.jobTitle, e.department?.name, e.manager?.fullName || "", e.status || ""]);
  const employeeExportHeaders = ["Ø§Ù„Ø§Ø³Ù…","Ø§Ù„Ù‡Ø§ØªÙ","Ø§Ù„Ø¨Ø±ÙŠØ¯","Ø§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ","Ø§Ù„Ù‚Ø³Ù…","Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", "Ø§Ù„Ø­Ø§Ù„Ø©"];
  app.querySelector("[data-export-employees]").addEventListener("click", () => downloadFile("employees.csv", `\ufeff${toCsv([employeeExportHeaders, ...employeeExportRows()])}`, "text/csv;charset=utf-8"));
  app.querySelector("[data-export-employees-xls]").addEventListener("click", () => exportHtmlTable("employees.xls", employeeExportHeaders, employeeExportRows()));
  app.querySelector("[data-print-employees]").addEventListener("click", () => printReport("ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†", employeeExportHeaders, employeeExportRows()));
  draw();
}


function bindEmployeeActions(ref) {
  app.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => (location.hash = `employee-profile?id=${button.dataset.view}`)));
  app.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", async () => showEmployeeEditor(ref, await endpoints.employee(button.dataset.edit))));
  app.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmAction({ title: "Ø­Ø°Ù Ù…ÙˆØ¸Ù", message: "Ø³ÙŠØªÙ… Ø­Ø°Ù Ø§Ù„Ù…ÙˆØ¸Ù Ù…Ù†Ø·Ù‚ÙŠÙ‹Ø§ ÙˆØªØ¹Ø·ÙŠÙ„ Ø­Ø³Ø§Ø¨Ù‡ Ø§Ù„Ù…Ø±ØªØ¨Ø· Ø¯ÙˆÙ† Ø­Ø°Ù Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ§Ø±ÙŠØ®ÙŠ.", confirmLabel: "Ø­Ø°Ù Ù…Ù†Ø·Ù‚ÙŠ", danger: true })) return;
    await endpoints.deleteEmployee(button.dataset.delete);
    setMessage("ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…ÙˆØ¸Ù Ù…Ù†Ø·Ù‚ÙŠÙ‹Ø§.", "");
    render();
  }));
}

function defaultEmployeeRefs(ref = {}, employee = null) {
  const defaultBranch = ref.branches?.[0] || {};
  const defaultRole = ref.roles?.find((role) => ["employee", "role-employee", "staff"].includes(String(role.slug || role.key || "").toLowerCase())) || ref.roles?.at(-1) || {};
  return {
    roleId: employee?.roleId || defaultRole.id || "",
    branchId: employee?.branchId || defaultBranch.id || "",
    governorateId: employee?.governorateId || defaultBranch.governorateId || ref.governorates?.[0]?.id || "",
    complexId: employee?.complexId || defaultBranch.complexId || ref.complexes?.[0]?.id || "",
    status: "ACTIVE",
  };
}

function showEmployeeEditor(ref, employee = null) {
  const editor = app.querySelector("#employee-editor");
  const defaults = defaultEmployeeRefs(ref, employee);
  const managerOptions = ref.employees
    .filter((item) => item.id !== employee?.id)
    .map((item) => ({ id: item.id, name: `${item.fullName}${item.jobTitle ? " â€” " + item.jobTitle : ""}` }));
  editor.classList.remove("hidden");
  editor.innerHTML = `
    <div class="panel-head"><div><h2>${employee ? "ØªØ¹Ø¯ÙŠÙ„ Ù…ÙˆØ¸Ù" : "Ø¥Ø¶Ø§ÙØ© Ù…ÙˆØ¸Ù Ø¬Ø¯ÙŠØ¯"}</h2><p>ÙƒÙ„ ØªØ¹Ø¯ÙŠÙ„ ÙŠØªÙ… Ø­ÙØ¸Ù‡ ÙÙˆØ±Ù‹Ø§. ÙÙŠ Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù…Ø­Ù„ÙŠ ÙŠÙØ­ÙØ¸ Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ØªØµÙØ­ØŒ ÙˆÙÙŠ Supabase ÙŠÙØ­ÙØ¸ ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.</p></div><button class="button ghost" data-close-editor>Ø¥ØºÙ„Ø§Ù‚</button></div>
    <form id="employee-form" class="editor-grid" data-password-policy="none">
      <div class="photo-box"><div id="photo-preview">${avatar(employee || { fullName: "Ù…ÙˆØ¸Ù Ø¬Ø¯ÙŠØ¯" })}</div><label>Ø§Ù„ØµÙˆØ±Ø© Ø§Ù„Ø´Ø®ØµÙŠØ©<input name="photo" type="file" accept="image/*" /></label></div>
      <label>Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„<input name="fullName" required value="${escapeHtml(employee?.fullName || "")}" /></label>
      <label>Ø±Ù‚Ù… Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„<input name="phone" value="${escapeHtml(employee?.phone || "")}" /></label>
      <label>Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ<input name="email" type="email" required value="${escapeHtml(employee?.email || "")}" placeholder="name@ahla-shabab.org" /></label>
      <label>Ø§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ<input name="jobTitle" value="${escapeHtml(employee?.jobTitle || "")}" /></label>
      <label>Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±<select name="managerEmployeeId">${optionList(managerOptions, employee?.managerEmployeeId, "Ø¨Ø¯ÙˆÙ† Ù…Ø¯ÙŠØ±")}</select></label>
      <input type="hidden" name="roleId" value="${escapeHtml(defaults.roleId)}" />
      <input type="hidden" name="branchId" value="${escapeHtml(defaults.branchId)}" />
      <input type="hidden" name="governorateId" value="${escapeHtml(defaults.governorateId)}" />
      <input type="hidden" name="complexId" value="${escapeHtml(defaults.complexId)}" />
      <input type="hidden" name="status" value="ACTIVE" />
      ${employee ? `<label class="check-row"><input type="checkbox" name="createUser" /> Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ù…Ø³ØªØ®Ø¯Ù… Ø¥Ø°Ø§ Ù„Ù… ÙŠÙƒÙ† Ù…Ø±ØªØ¨Ø·Ù‹Ø§</label><label>ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù…Ø¤Ù‚ØªØ© Ø¬Ø¯ÙŠØ¯Ø©<input name="password" value="" placeholder="Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºÙ‹Ø§ Ø¥Ù† Ù„Ù… ØªÙ†Ø´Ø¦ Ø­Ø³Ø§Ø¨Ù‹Ø§" /></label>` : `<label class="check-row"><input type="checkbox" name="createUser" checked /> Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø±ØªØ¨Ø·</label><label>ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù…Ø¤Ù‚ØªØ©<input name="password" value="" placeholder="Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºÙ‹Ø§ Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ÙƒÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ±" /></label>`}
      <div class="message compact span-2">Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø·Ù„ÙˆØ¨ Ù„Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨. ÙŠØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…Ù† Ù„ÙˆØ­Ø© HR ÙÙ‚Ø·. Ø¹Ù†Ø¯ ØªØ±Ùƒ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙØ§Ø±ØºØ© ØªØµØ¨Ø­ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ù‡ÙŠ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ/Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø´Ø®ØµÙŠ Ø§Ù„Ù…Ø³Ø¬Ù„.</div>
      <div class="form-actions wide"><button class="button primary" type="submit">Ø­ÙØ¸ Ø§Ù„Ù…Ù„Ù</button></div>
    </form>
  `;
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
  const photoInput = editor.querySelector('[name="photo"]');
  photoInput.addEventListener("change", async () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    const url = await endpoints.uploadAvatar(file);
    editor.querySelector("#photo-preview").innerHTML = `<img class="avatar large" src="${escapeHtml(url)}" alt="" />`;
    photoInput.dataset.uploadedUrl = url;
    setMessage("ØªÙ… ØªØ¬Ù‡ÙŠØ² Ø§Ù„ØµÙˆØ±Ø© ÙˆØ¶ØºØ·Ù‡Ø§. Ø§Ø¶ØºØ· Ø­ÙØ¸ Ø§Ù„Ù…Ù„Ù Ù„ØªØ«Ø¨ÙŠØªÙ‡Ø§.", "");
  });
  editor.querySelector("[data-close-editor]").addEventListener("click", () => editor.classList.add("hidden"));
  editor.querySelector("#employee-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const values = readForm(event.currentTarget);
      values.photoUrl = photoInput.dataset.uploadedUrl || employee?.photoUrl || "";
      values.status = "ACTIVE";
      delete values.photo;
      if (employee) await endpoints.updateEmployee(employee.id, values);
      else await endpoints.createEmployee(values);
      setMessage(employee ? "ØªÙ… ØªØ¹Ø¯ÙŠÙ„ Ù…Ù„Ù Ø§Ù„Ù…ÙˆØ¸Ù ÙˆØ­ÙØ¸Ù‡." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù Ø§Ù„Ù…ÙˆØ¸Ù ÙˆØ­Ø³Ø§Ø¨ Ø§Ù„Ø¯Ø®ÙˆÙ„. ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ù‡ÙŠ Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ/Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø´Ø®ØµÙŠ Ø§Ù„Ù…Ø³Ø¬Ù„.", "");
      render();
    } catch (error) {
      setMessage("", error.message);
      render();
    }
  });
}

async function renderEmployeeProfile() {
  const employee = await endpoints.employee(routeParams().get("id"));
  const attachments = await endpoints.attachments?.("EMPLOYEE", employee.id).catch(() => employee.attachments || []) || employee.attachments || [];
  const totalLate = (employee.attendanceDaily || []).reduce((sum, item) => sum + Number(item.lateMinutes || 0), 0);
  const locations = await endpoints.locations().then(unwrap).catch(() => []);
  const latestLocation = (locations || []).filter((item) => item.employeeId === employee.id && item.latitude && item.longitude).sort((a, b) => new Date(b.date || b.requestedAt || 0) - new Date(a.date || a.requestedAt || 0))[0];
  shell(
    `<section class="profile-layout">
      <article class="panel profile-card">
        ${avatar(employee, "large")}
        <h2>${escapeHtml(employee.fullName)}</h2>
        <p>${escapeHtml(employee.jobTitle || "-")}</p>
        <div class="profile-actions"><button class="button" data-route="employees">Ø±Ø¬ÙˆØ¹ Ù„Ù„Ù‚Ø§Ø¦Ù…Ø©</button></div>
      </article>
      <article class="panel profile-details">
        <div class="panel-head"><h2>Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø­Ø§Ù„ÙŠ</h2></div>
        <div class="status-location-card">
          <strong>Ø¢Ø®Ø± Ù…ÙˆÙ‚Ø¹ Ù…Ø³Ø¬Ù„</strong>
          <p>${latestLocation ? `Ø¢Ø®Ø± Ù…ÙˆÙ‚Ø¹ Ù…Ø±Ø³Ù„: ${date(latestLocation.date || latestLocation.requestedAt)}` : "Ù„Ù… ÙŠØ±Ø³Ù„ Ø§Ù„Ù…ÙˆØ¸Ù Ù…ÙˆÙ‚Ø¹Ù‹Ø§ Ø­Ø¯ÙŠØ«Ù‹Ø§ Ø¨Ø¹Ø¯."}</p>
          ${latestLocation ? `<div class="meta-grid"><span>Latitude: ${escapeHtml(latestLocation.latitude)}</span><span>Longitude: ${escapeHtml(latestLocation.longitude)}</span><span>Ø§Ù„Ø¯Ù‚Ø©: ${escapeHtml(latestLocation.accuracyMeters || "-")} Ù…ØªØ±</span><span>Ø§Ù„Ù…ØµØ¯Ø±: ${escapeHtml(latestLocation.source || latestLocation.purpose || "-")}</span></div><a class="button ghost" target="_blank" rel="noopener" href="https://maps.google.com/?q=${escapeHtml(latestLocation.latitude)},${escapeHtml(latestLocation.longitude)}">ÙØªØ­ Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</a>` : ""}
        </div>
      </article>
      <article class="panel profile-details">
        <div class="panel-head"><h2>Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©</h2><span>${escapeHtml(employee.jobTitle || "")}</span></div>
        ${table(["Ø§Ù„Ø¨Ù†Ø¯", "Ø§Ù„Ù‚ÙŠÙ…Ø©"], [
          ["Ø§Ù„Ù‡Ø§ØªÙ", employee.phone], ["Ø§Ù„Ø¨Ø±ÙŠØ¯", employee.email], ["Ø§Ù„Ù…Ø³Ù…Ù‰ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ", employee.jobTitle], ["Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", employee.manager?.fullName], ["Ø­Ø³Ø§Ø¨ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…", employee.user ? employee.user.email : "ØºÙŠØ± Ù…Ø±ØªØ¨Ø·"], ["Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ØªØ£Ø®ÙŠØ±", `${totalLate} Ø¯Ù‚ÙŠÙ‚Ø©`],
        ].map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value || "-")}</td></tr>`))}
      </article>
      <article class="panel span-4"><h2>Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ</h2>${table(["Ø§Ù„ÙŠÙˆÙ…", "Ø§Ù„Ø­Ø§Ù„Ø©", "ØªØ£Ø®ÙŠØ±"], (employee.attendanceDaily || []).map((item) => `<tr><td>${dateOnly(item.date)}</td><td>${badge(item.status)}</td><td>${escapeHtml(item.lateMinutes || 0)} Ø¯</td></tr>`))}</article>
      <article class="panel span-4"><h2>Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª</h2>${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„Ø­Ø§Ù„Ø©"], (employee.missions || []).map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${badge(item.status)}</td></tr>`))}</article>
      <article class="panel span-4"><h2>Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª ÙˆØ§Ù„Ø§Ø³ØªØ«Ù†Ø§Ø¡Ø§Øª</h2>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø­Ø§Ù„Ø©"], [...(employee.leaves || []).map((item) => ({ name: item.leaveType?.name, status: item.status })), ...(employee.exceptions || []).map((item) => ({ name: item.title, status: item.status }))].map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${badge(item.status)}</td></tr>`))}</article>
      <article class="panel span-12">
        <div class="panel-head"><div><h2>Ø§Ù„Ù…Ø±ÙÙ‚Ø§Øª</h2><p>Ø¹Ù‚ÙˆØ¯ØŒ Ø¨Ø·Ø§Ù‚Ø§ØªØŒ Ø´Ù‡Ø§Ø¯Ø§ØªØŒ Ø£Ùˆ Ø£ÙŠ Ù…Ø³ØªÙ†Ø¯ Ù…Ø±ØªØ¨Ø· Ø¨Ø§Ù„Ù…ÙˆØ¸Ù.</p></div><div class="toolbar"><input type="file" id="employee-attachment" /><button class="button" id="upload-employee-attachment">Ø±ÙØ¹ Ù…Ø±ÙÙ‚</button></div></div>
        ${table(["Ø§Ù„Ù…Ù„Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø­Ø¬Ù…", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], attachments.map((item) => `<tr><td>${item.url || item.filePath ? `<a href="${escapeHtml(item.url || item.filePath)}" target="_blank" rel="noopener">${escapeHtml(item.originalName || item.fileName)} <small>(Ø±Ø§Ø¨Ø· Ø¢Ù…Ù† Ù…Ø¤Ù‚Øª)</small></a>` : escapeHtml(item.originalName || item.fileName)}</td><td>${escapeHtml(item.mimeType || item.scope || "-")}</td><td>${Math.round(Number(item.sizeBytes || 0) / 1024)} KB</td><td>${date(item.createdAt)}</td></tr>`))}
      </article>
    </section>`,
    "Ù…Ù„Ù Ø§Ù„Ù…ÙˆØ¸Ù",
    "Ù…Ø±ÙƒØ² Ù…ÙˆØ­Ø¯ Ù„Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ÙˆØ§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª.",
  );
  app.querySelector("[data-route=employees]")?.addEventListener("click", () => { location.hash = "employees"; });
  app.querySelector("#upload-employee-attachment")?.addEventListener("click", async () => {
    const file = app.querySelector("#employee-attachment")?.files?.[0];
    if (!file) return setMessage("", "Ø§Ø®ØªØ± Ù…Ù„ÙÙ‹Ø§ Ø£ÙˆÙ„Ù‹Ø§.");
    await endpoints.uploadAttachment(file, { scope: "EMPLOYEE", entityId: employee.id, employeeId: employee.id });
    setMessage("ØªÙ… Ø±ÙØ¹ Ø§Ù„Ù…Ø±ÙÙ‚.", "");
    render();
  });
}

async function renderUsers() {
  const [users, ref] = await Promise.all([endpoints.users().then(unwrap), referenceData()]);
  shell(
    `<section class="stack users-lite-page">
      <article class="panel">
        <div class="panel-head"><div><h2>Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†</h2><p>Ø´Ø§Ø´Ø© Ù…Ø¨Ø³Ø·Ø© Ù…Ø«Ù„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†: Ø§Ù„Ø§Ø³Ù…ØŒ Ø§Ù„Ø¨Ø±ÙŠØ¯ØŒ Ø§Ù„ØµÙˆØ±Ø©ØŒ ÙˆØ§Ù„Ù…ÙˆØ¸Ù Ø§Ù„Ù…Ø±ØªØ¨Ø· ÙÙ‚Ø·. Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª ØªÙØ³ØªÙ…Ø¯ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ù…Ù† Ù…Ù„Ù Ø§Ù„Ù…ÙˆØ¸Ù Ø£Ùˆ ØªØ¨Ù‚Ù‰ ÙƒÙ…Ø§ Ù‡ÙŠ Ø¹Ù†Ø¯ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„.</p></div><div class="toolbar"><button class="button ghost" data-autolink-users>Ø±Ø¨Ø· ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø­Ø³Ø¨ Ø§Ù„Ø¨Ø±ÙŠØ¯</button><button class="button primary" data-new-user>Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªØ®Ø¯Ù…</button></div></div>
        <form class="filters" id="user-filters"><input name="q" placeholder="Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø£Ùˆ Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„Ù…Ø±ØªØ¨Ø·" /></form>
        <div id="users-table"></div>
      </article>
      <article id="user-editor" class="panel hidden"></article>
    </section>`,
    "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†",
    "Ø¥Ø¯Ø§Ø±Ø© Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø´ÙƒÙ„ Ù…Ø¨Ø³Ø· Ø¨Ø¯ÙˆÙ† ÙØ±Ø¹ Ø£Ùˆ Ù‚Ø³Ù… Ø£Ùˆ ÙƒÙˆØ¯ Ø£Ùˆ Ø¯ÙˆØ§Ù….",
  );
  const draw = () => {
    const values = readForm(app.querySelector("#user-filters"));
    const q = (values.q || "").toLowerCase();
    const filtered = users.filter((user) => !q || [user.name, user.fullName, user.email, user.employee?.fullName].join(" ").toLowerCase().includes(q));
    app.querySelector("#users-table").innerHTML = table(["Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…", "Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„Ù…Ø±ØªØ¨Ø·", "Ø¢Ø®Ø± Ø¯Ø®ÙˆÙ„", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], filtered.map((user) => `
      <tr>
        <td class="person-cell">${avatar(userAvatarSubject(user), "tiny")}<span>${escapeHtml(user.name || user.fullName || "Ù…Ø³ØªØ®Ø¯Ù…")}<small>${escapeHtml(user.email)}</small></span></td>
        <td>${escapeHtml(user.employee?.fullName || "ØºÙŠØ± Ù…Ø±ØªØ¨Ø·")}</td>
        <td>${date(user.lastLoginAt)}</td>
        <td>${badge(user.status || "ACTIVE")} ${user.temporaryPassword ? badge("INVITED") : ""}</td>
        <td><button class="button ghost" data-edit-user="${user.id}">ØªØ¹Ø¯ÙŠÙ„</button><button class="button ghost" data-toggle-user="${user.id}">${user.status === "ACTIVE" ? "ØªØ¹Ø·ÙŠÙ„" : "ØªÙ†Ø´ÙŠØ·"}</button></td>
      </tr>`));
    bindUserActions(ref, users);
  };
  app.querySelector("#user-filters").addEventListener("input", debounce(draw, 250));
  app.querySelector("[data-new-user]").addEventListener("click", () => showUserEditor(ref));
  app.querySelector("[data-autolink-users]").addEventListener("click", async () => {
    try {
      const result = await endpoints.autoLinkUsersByEmail();
      setMessage(`ØªÙ… Ø§Ù„Ø±Ø¨Ø· Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ: ${result.linked || 0} Ù…Ø³ØªØ®Ø¯Ù…/Ù…ÙˆØ¸Ù.`, "");
      render();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø§Ù„Ø±Ø¨Ø· Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ.");
      render();
    }
  });
  draw();
}

function bindUserActions(ref, users = []) {
  app.querySelectorAll("[data-edit-user]").forEach((button) => button.addEventListener("click", () => {
    showUserEditor(ref, users.find((user) => user.id === button.dataset.editUser));
  }));
  app.querySelectorAll("[data-toggle-user]").forEach((button) => button.addEventListener("click", async () => {
    const user = users.find((item) => item.id === button.dataset.toggleUser);
    if (!user) return setMessage("", "ØªØ¹Ø°Ø± Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…Ø·Ù„ÙˆØ¨.");
    await endpoints.setUserStatus(user.id, user.status === "ACTIVE" ? "DISABLED" : "ACTIVE");
    setMessage("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….", "");
    render();
  }));
}

function userDefaultsFromEmployee(ref, user = null) {
  const linkedEmployee = (ref.employees || []).find((employee) => employee.id === user?.employeeId);
  const fallbackRole = ref.roles?.find((role) => ["employee", "role-employee", "staff"].includes(String(role.slug || role.key || role.id || "").toLowerCase())) || ref.roles?.at(-1) || {};
  return {
    roleId: user?.roleId || linkedEmployee?.roleId || fallbackRole.id || "",
    branchId: user?.branchId || linkedEmployee?.branchId || ref.branches?.[0]?.id || "",
    departmentId: user?.departmentId || linkedEmployee?.departmentId || ref.departments?.[0]?.id || "",
    governorateId: user?.governorateId || linkedEmployee?.governorateId || ref.governorates?.[0]?.id || "",
    complexId: user?.complexId || linkedEmployee?.complexId || ref.complexes?.[0]?.id || "",
    status: user?.status || "ACTIVE",
  };
}

function showUserEditor(ref, user = null) {
  const editor = app.querySelector("#user-editor");
  const defaults = userDefaultsFromEmployee(ref, user);
  editor.classList.remove("hidden");
  editor.innerHTML = `
    <div class="panel-head"><div><h2>${user ? "ØªØ¹Ø¯ÙŠÙ„ Ù…Ø³ØªØ®Ø¯Ù…" : "Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªØ®Ø¯Ù…"}</h2><p>Ù„Ø§ ØªØ­ØªØ§Ø¬ Ù„Ø§Ø®ØªÙŠØ§Ø± ÙØ±Ø¹ Ø£Ùˆ Ù‚Ø³Ù… Ø£Ùˆ Ø¯ÙˆØ± ÙŠØ¯ÙˆÙŠÙ‹Ø§. Ø§Ø±Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ø§Ù„Ù…ÙˆØ¸Ù ÙˆØ³ÙŠØªÙ… Ø¶Ø¨Ø· Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.</p></div><button class="button ghost" data-close-user>Ø¥ØºÙ„Ø§Ù‚</button></div>
    <form id="user-form" class="editor-grid simplified-user-form" data-password-policy="none">
      <div class="photo-box user-avatar-editor">
        <div id="user-avatar-preview">${avatar(userAvatarSubject(user || { name: "Ù…Ø³ØªØ®Ø¯Ù… Ø¬Ø¯ÙŠØ¯" }), "large")}</div>
        <label>ØµÙˆØ±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…<input name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif" /></label>
        <small>Ø§Ù„ØµÙˆØ±Ø© Ø§Ø®ØªÙŠØ§Ø±ÙŠØ© ÙˆØªØ¸Ù‡Ø± ÙÙŠ Ø§Ù„Ø´Ø±ÙŠØ· Ø§Ù„Ø¹Ù„ÙˆÙŠ ÙˆØ¬Ø¯ÙˆÙ„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†.</small>
      </div>
      <label>Ø§Ù„Ø§Ø³Ù…<input name="name" required value="${escapeHtml(user?.name || user?.fullName || "")}" /></label>
      <label>Ø§Ù„Ø¨Ø±ÙŠØ¯<input name="email" type="email" required value="${escapeHtml(user?.email || "")}" /></label>
      <label>Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„Ù…Ø±ØªØ¨Ø·<select name="employeeId">${optionList(ref.employees.map((employee) => ({ id: employee.id, name: `${employee.fullName}${employee.jobTitle ? " â€” " + employee.jobTitle : ""}` })), user?.employeeId, "Ø¨Ø¯ÙˆÙ†")}</select></label>
      <label>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ©<input name="password" value="" placeholder="${user ? "Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºÙ‹Ø§ Ù„Ù„Ø¥Ø¨Ù‚Ø§Ø¡ Ø¹Ù„ÙŠÙ‡Ø§" : "Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºÙ‹Ø§ Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø±Ù‚Ù… Ù‡Ø§ØªÙ Ø§Ù„Ù…ÙˆØ¸Ù"}" /></label>
      <input type="hidden" name="roleId" value="${escapeHtml(defaults.roleId)}" />
      <input type="hidden" name="branchId" value="${escapeHtml(defaults.branchId)}" />
      <input type="hidden" name="departmentId" value="${escapeHtml(defaults.departmentId)}" />
      <input type="hidden" name="governorateId" value="${escapeHtml(defaults.governorateId)}" />
      <input type="hidden" name="complexId" value="${escapeHtml(defaults.complexId)}" />
      <input type="hidden" name="status" value="${escapeHtml(defaults.status)}" />
      <label class="check-row"><input type="checkbox" name="temporaryPassword" ${user?.temporaryPassword ?? true ? "checked" : ""} /> ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù…Ø¤Ù‚ØªØ©</label>
      <label class="check-row"><input type="checkbox" name="passkeyEnabled" ${user?.passkeyEnabled ? "checked" : ""} /> Passkey Ù…ÙØ¹Ù„Ø©</label>
      <div class="message compact span-2">ØªÙ… Ø­Ø°Ù Ø­Ù‚ÙˆÙ„ Ø§Ù„ÙØ±Ø¹ØŒ Ø§Ù„Ù‚Ø³Ù…ØŒ Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©ØŒ Ø§Ù„Ù…Ø¬Ù…Ø¹ØŒ Ø§Ù„Ø¯ÙˆØ±ØŒ ÙˆØ§Ù„ÙƒÙˆØ¯ Ù…Ù† Ø´Ø§Ø´Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†. ÙŠØªÙ… Ø¶Ø¨Ø·Ù‡Ø§ Ø¯Ø§Ø®Ù„ÙŠÙ‹Ø§ ÙÙ‚Ø· Ù„ØªÙˆØ§ÙÙ‚ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.</div>
      <div class="form-actions wide"><button class="button primary" type="submit">Ø­ÙØ¸ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</button></div>
    </form>
  `;
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
  const avatarInput = editor.querySelector('[name="avatar"]');
  const employeeSelect = editor.querySelector('[name="employeeId"]');
  const refreshHiddenDefaults = () => {
    const linkedEmployee = (ref.employees || []).find((employee) => employee.id === employeeSelect?.value);
    if (!linkedEmployee) return;
    editor.querySelector('[name="roleId"]').value = linkedEmployee.roleId || defaults.roleId || "";
    editor.querySelector('[name="branchId"]').value = linkedEmployee.branchId || defaults.branchId || "";
    editor.querySelector('[name="departmentId"]').value = linkedEmployee.departmentId || defaults.departmentId || "";
    editor.querySelector('[name="governorateId"]').value = linkedEmployee.governorateId || defaults.governorateId || "";
    editor.querySelector('[name="complexId"]').value = linkedEmployee.complexId || defaults.complexId || "";
  };
  employeeSelect?.addEventListener("change", refreshHiddenDefaults);
  avatarInput?.addEventListener("change", async () => {
    try {
      const file = avatarInput.files?.[0];
      if (!file) return;
      const url = await endpoints.uploadAvatar(file);
      editor.querySelector("#user-avatar-preview").innerHTML = `<img class="avatar large" src="${escapeHtml(url)}" alt="ØµÙˆØ±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…" />`;
      avatarInput.dataset.uploadedUrl = url;
      setMessage("ØªÙ… ØªØ¬Ù‡ÙŠØ² ØµÙˆØ±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…. Ø§Ø¶ØºØ· Ø­ÙØ¸ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù„ØªØ«Ø¨ÙŠØªÙ‡Ø§.", "");
    } catch (error) {
      setMessage("", error.message);
    }
  });
  editor.querySelector("[data-close-user]").addEventListener("click", () => editor.classList.add("hidden"));
  editor.querySelector("#user-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      refreshHiddenDefaults();
      const values = readForm(event.currentTarget);
      values.avatarUrl = avatarInput?.dataset?.uploadedUrl || user?.avatarUrl || user?.photoUrl || "";
      delete values.avatar;
      if (!values.password) delete values.password;
      if (user) await endpoints.updateUser(user.id, values);
      else await endpoints.createUser(values);
      setMessage(user ? "ØªÙ… ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…." : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….", "");
      render();
    } catch (error) {
      setMessage("", error.message);
      render();
    }
  });
}

async function enableBrowserNotifications() {
  await enableWebPushSubscription(endpoints);
  new Notification("ØªÙ… ØªÙØ¹ÙŠÙ„ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù…", { body: "Ø³ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ© Ø¹Ù†Ø¯ Ø¶Ø¨Ø· VAPID Ùˆ Edge Function." });
}

async function registerBrowserPasskey() {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) throw new Error("Ù‡Ø°Ø§ Ø§Ù„Ù…ØªØµÙØ­ Ø£Ùˆ Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙˆØªÙˆÙƒÙˆÙ„ Ù„Ø§ ÙŠØ¯Ø¹Ù… WebAuthn. Ø§Ø³ØªØ®Ø¯Ù… localhost Ø£Ùˆ HTTPS.");
  const toBase64Url = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
  const userName = state.user?.email || state.user?.fullName || "hr-user";
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Ù†Ø¸Ø§Ù… Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù" },
      user: { id: userId, name: userName, displayName: state.user?.fullName || userName },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { userVerification: "required", residentKey: "required" },
      timeout: 60000,
      attestation: "none",
    },
  });
  const rawId = toBase64Url(credential.rawId);
  const attestationObject = credential.response?.attestationObject ? toBase64Url(credential.response.attestationObject) : "";
  const clientDataJSON = credential.response?.clientDataJSON ? toBase64Url(credential.response.clientDataJSON) : "";
  const transports = typeof credential.response?.getTransports === "function" ? credential.response.getTransports() : [];
  await endpoints.registerPasskey({ credentialId: rawId, attestationObject, clientDataJSON, transports, label: "Ù…ÙØªØ§Ø­ Ù…Ø±ÙˆØ± Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø²", platform: navigator.platform || "browser" });
  return rawId;
}

async function requestBrowserPasskeyForPunch() {
  if (!window.PublicKeyCredential || !navigator.credentials?.get) {
    throw new Error("Ø¨ØµÙ…Ø© Ø§Ù„Ø¥ØµØ¨Ø¹/Passkey ØºÙŠØ± Ù…Ø¯Ø¹ÙˆÙ…Ø© Ù‡Ù†Ø§. Ø§ÙØªØ­ Ø§Ù„Ù†Ø¸Ø§Ù… Ù…Ù† Ù…ÙˆØ¨Ø§ÙŠÙ„ ÙŠØ¯Ø¹Ù… Ø§Ù„Ø¨ØµÙ…Ø© Ø£Ùˆ Ù…Ù† Chrome Ø¹Ù„Ù‰ localhost/HTTPS.");
  }
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  let credential;
  try {
    credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: "required",
      },
    });
  } catch (error) {
    throw new Error("Ù„Ù… ÙŠØªÙ… ØªØ£ÙƒÙŠØ¯ Ø¨ØµÙ…Ø© Ø§Ù„Ø¥ØµØ¨Ø¹ Ø£Ùˆ ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ØªØ­Ù‚Ù‚.");
  }
  if (!credential?.rawId) throw new Error("Ù„Ù… ÙŠØªÙ… Ø§Ø³ØªÙ„Ø§Ù… ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø¨ØµÙ…Ø© Ù…Ù† Ø§Ù„Ø¬Ù‡Ø§Ø².");
  return btoa(String.fromCharCode(...new Uint8Array(credential.rawId))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function cleanAddressText(value = "") {
  const text = String(value || "").replace(/https?:\/\/\S+/gi, "").replace(/Google Maps\s*[:ï¼š]?/gi, "").replace(/[â€”-]\s*$/g, "").trim();
  return text || "Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©";
}

function mapsUrlForAddress(address = {}) {
  const lat = Number(address.latitude);
  const lng = Number(address.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

async function renderEmployeePunch() {
  let address;
  let events = [];
  try {
    [address, events] = await Promise.all([
      endpoints.attendanceAddress().then(unwrap),
      endpoints.myAttendanceEvents().then(unwrap).catch(() => []),
    ]);
  } catch (error) {
    shell(
      `<section class="panel empty-state-panel">
        <h2>Ù„Ø§ ÙŠÙ…ÙƒÙ† ÙØªØ­ Ø¨ØµÙ…Ø© Ø§Ù„Ù…ÙˆØ¸Ù Ù„Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨</h2>
        <p>${escapeHtml(error.message || "Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨ ØºÙŠØ± Ù…Ø±ØªØ¨Ø· Ø¨Ù…Ù„Ù Ù…ÙˆØ¸Ù.")}</p>
        <div class="message warning">Ø§Ø±Ø¨Ø· Ù‡Ø°Ø§ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ù…ÙˆØ¸Ù Ù…Ù† ØµÙØ­Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†ØŒ Ø£Ùˆ Ø§ÙØªØ­ ØµÙØ­Ø© Ø§Ù„Ø£Ø´Ø®Ø§Øµ ÙˆØ§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ£Ù†Ø´Ø¦ Ù…Ù„Ù Ù…ÙˆØ¸Ù Ø¨Ù†ÙØ³ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ.</div>
        <div class="toolbar spaced">
          <button class="button primary" data-route="users">ÙØªØ­ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†</button>
          <button class="button ghost" data-route="employees">ÙØªØ­ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</button>
          <button class="button ghost" data-route="route-access">ÙØ­Øµ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª</button>
        </div>
      </section>`,
      "Ø¨ØµÙ…Ø© Ø§Ù„Ù…ÙˆØ¸Ù",
      "ÙŠÙ„Ø²Ù… Ø±Ø¨Ø· Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ù…Ù„Ù Ù…ÙˆØ¸Ù Ù‚Ø¨Ù„ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù.",
    );
    return;
  }
  const employee = address.employee || state.user?.employee || {};
  const branch = address.branch || employee.branch || {};
  const employeeEvents = (events || []).filter((event) => event.employeeId === employee.id).slice(0, 10);
  shell(
    `<section class="grid punch-page">
      <article class="panel span-6 punch-hero">
        <div class="person-cell large">${avatar(employee, "large")}<span><strong>${escapeHtml(employee.fullName || state.user?.fullName || "Ø§Ù„Ù…ÙˆØ¸Ù")}</strong><small>${escapeHtml(employee.jobTitle || "")}</small></span></div>
        <div class="address-card">
          <h2>Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ Ù„Ù„Ø¨ØµÙ…Ø©</h2>
          <p>${escapeHtml(branch.name || "Ù…Ø¬Ù…Ø¹ ØºÙŠØ± Ù…Ø­Ø¯Ø¯")}</p>
          <strong>${escapeHtml(cleanAddressText(address.address || branch.address || "Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©"))}</strong>
          <div class="meta-grid">
            <span>Latitude: ${escapeHtml(address.latitude ?? "-")}</span>
            <span>Longitude: ${escapeHtml(address.longitude ?? "-")}</span>
            <span>Ø§Ù„Ù†Ø·Ø§Ù‚: ${escapeHtml(address.radiusMeters || branch.radiusMeters || 300)} Ù…ØªØ±</span>
            <span>Ø£Ù‚ØµÙ‰ Ø¯Ù‚Ø© GPS: ${escapeHtml(address.maxAccuracyMeters || 500)} Ù…ØªØ±</span>
          </div>
          ${mapsUrlForAddress(address) ? `<a class="button ghost map-open-btn" target="_blank" rel="noopener" href="${escapeHtml(mapsUrlForAddress(address))}">ÙØªØ­ Ø§Ù„Ù…Ø¬Ù…Ø¹ Ø¹Ù„Ù‰ Google Maps</a>` : ""}
        </div>
        <label>Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ø®ØªÙŠØ§Ø±ÙŠØ©<input id="self-punch-notes" placeholder="Ù…Ø«Ø§Ù„: Ø­Ø¶ÙˆØ± Ù…Ù† Ø§Ù„Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©" /></label>
        <div class="biometric-box"><strong>Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨: Ø¨ØµÙ…Ø© Ø§Ù„Ø¥ØµØ¨Ø¹ / Passkey</strong><p>Ù„Ø§ ÙŠØªÙ… Ø§Ø³ØªØ®Ø¯Ø§Ù… ØµÙˆØ±Ø© Ø³ÙŠÙ„ÙÙŠ. Ø¹Ù†Ø¯ Ø§Ù„Ø¶ØºØ· Ø¹Ù„Ù‰ Ø­Ø¶ÙˆØ± Ø£Ùˆ Ø§Ù†ØµØ±Ø§Ù Ø³ÙŠØ·Ù„Ø¨ Ø§Ù„Ù…ØªØµÙØ­ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø£ÙˆÙ„Ù‹Ø§ØŒ Ø«Ù… ÙŠÙ‚Ø±Ø£ GPS ÙˆÙŠØ­ÙØ¸ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù…Ø¹ Ø§Ù„Ø¨ØµÙ…Ø©.</p><button class="button ghost" type="button" data-register-passkey>ØªØ³Ø¬ÙŠÙ„/ØªØ­Ø¯ÙŠØ« Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø²</button></div>
        <div class="toolbar spaced punch-actions">
          <button class="button ghost" data-test-location>Ø§Ø®ØªØ¨Ø§Ø± Ù…ÙˆÙ‚Ø¹ÙŠ</button>
          <button class="button primary" data-self-punch="checkIn">Ø¨ØµÙ…Ø© Ø­Ø¶ÙˆØ±</button>
          <button class="button" data-self-punch="checkOut">Ø¨ØµÙ…Ø© Ø§Ù†ØµØ±Ø§Ù</button>
        </div>
        <div id="self-punch-result" class="risk-box ${address.hasConfiguredAddress === false ? "" : "hidden"}">${address.hasConfiguredAddress === false ? "ÙŠØ¬Ø¨ Ø¶Ø¨Ø· Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹ Ù‚Ø¨Ù„ Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ø§Ù„Ø¨ØµÙ…Ø©." : ""}</div>
      </article>
      <article class="panel span-6 latest-punches-panel">
        <div class="panel-head"><div><h2>Ø¢Ø®Ø± Ø¨ØµÙ…Ø§ØªÙŠ</h2><p>Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù Ù„Ø§ ÙŠÙØ­ÙØ¸Ø§Ù† Ø¥Ù„Ø§ Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹ØŒ ÙˆØ£ÙŠ Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±ÙÙˆØ¶Ø© ØªÙØ³Ø¬Ù„ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¨Ø§Ù„Ø³Ø¨Ø¨ ÙˆØ§Ù„Ù…Ø³Ø§ÙØ© ÙˆØ§Ù„Ø¯Ù‚Ø©.</p></div></div>
        ${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "Ø§Ù„Ù…Ø³Ø§ÙØ©", "Ø§Ù„Ø¯Ù‚Ø©", "Ø§Ù„ÙˆÙ‚Øª"], employeeEvents.map((event) => `<tr><td>${badge(event.type)}</td><td>${badge(event.geofenceStatus || "unknown")}</td><td>${formatMeters(event.distanceFromBranchMeters)}</td><td>${formatMeters(event.accuracyMeters)}</td><td>${date(event.eventAt)}</td></tr>`))}
      </article>
      <article class="panel span-12 guidance-panel">
        <h2>Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø¨ØµÙ…Ø©</h2>
        <div class="steps"><span>1. Ø§ÙØªØ­ Ø§Ù„ØµÙØ­Ø© Ù…Ù† Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„ Ø£Ùˆ Ø¬Ù‡Ø§Ø² ÙŠØ¯Ø¹Ù… Passkey.</span><span>2. Ø§Ø¶ØºØ· ØªØ³Ø¬ÙŠÙ„/ØªØ­Ø¯ÙŠØ« Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø£ÙˆÙ„ Ù…Ø±Ø© ÙÙ‚Ø·.</span><span>3. Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø£Ùˆ Ø§Ù„Ø§Ù†ØµØ±Ø§Ù Ø£ÙƒÙ‘Ø¯ Ø¨Ø¨ØµÙ…Ø© Ø§Ù„Ø¥ØµØ¨Ø¹.</span><span>4. Ø§Ø³Ù…Ø­ Ù„Ù„Ù…ØªØµÙØ­ Ø¨Ù‚Ø±Ø§Ø¡Ø© GPS.</span><span>5. Ø·Ø§Ù„Ù…Ø§ Ø£Ù†Øª Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ø¬Ù…Ø¹ ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¨ØµÙ…Ø© Ø­ØªÙ‰ Ù„Ùˆ Ù‚Ø¨Ù„ Ø£Ùˆ Ø¨Ø¹Ø¯ ÙˆÙ‚Øª Ø§Ù„Ø¯ÙˆØ§Ù… Ø§Ù„Ø±Ø³Ù…ÙŠ 10Øµ Ø¥Ù„Ù‰ 6Ù….</span></div>
      </article>
    </section>`,
    "Ø¨ØµÙ…Ø© Ø§Ù„Ù…ÙˆØ¸Ù",
    "ØªØ³Ø¬ÙŠÙ„ Ø­Ø¶ÙˆØ± ÙˆØ§Ù†ØµØ±Ø§Ù Ø°Ø§ØªÙŠ Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹ ÙÙ‚Ø·.",
  );
  const resultBox = app.querySelector("#self-punch-result");
  app.querySelector("[data-register-passkey]")?.addEventListener("click", async () => {
    try {
      await registerBrowserPasskey();
      setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø²/Passkey Ø¨Ù†Ø¬Ø§Ø­.", "");
    } catch (error) {
      setMessage("", error.message);
    }
  });
  const showResult = (title, evaluation = {}, error = false) => {
    resultBox.classList.remove("hidden");
    resultBox.innerHTML = `<strong>${escapeHtml(title)}</strong><div class="toolbar spaced">${badge(evaluation.geofenceStatus || evaluation.status || "unknown")}${evaluation.allowed || evaluation.canRecord ? badge("APPROVED") : badge("REJECTED")}</div><p>${escapeHtml(evaluation.message || evaluation.blockReason || "")}</p>${evaluation.distanceFromBranchMeters != null || evaluation.distanceMeters != null ? `<p>Ø§Ù„Ù…Ø³Ø§ÙØ© Ø¹Ù† Ø§Ù„Ø¹Ù†ÙˆØ§Ù†: ${escapeHtml(evaluation.distanceFromBranchMeters ?? evaluation.distanceMeters)} Ù…ØªØ±.</p>` : ""}`;
    resultBox.classList.toggle("danger-box", Boolean(error));
  };
  const logRejectedPunch = async (action, current = {}, evaluation = {}, reason = "") => {
    try {
      await endpoints.recordPunchRejection({
        employeeId: employee.id,
        action,
        ...current,
        geofenceStatus: evaluation.geofenceStatus || "REJECTED",
        distanceFromBranchMeters: evaluation.distanceFromBranchMeters ?? evaluation.distanceMeters ?? null,
        blockReason: reason || evaluation.blockReason || evaluation.message || "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø¨ØµÙ…Ø©",
        notes: app.querySelector("#self-punch-notes")?.value || "",
      });
    } catch (logError) {
      console.warn("ØªØ¹Ø°Ø± ØªØ³Ø¬ÙŠÙ„ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø¨ØµÙ…Ø© Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø©", logError);
    }
  };
  const readLocationAndEvaluate = async () => {
    resultBox.classList.remove("hidden");
    resultBox.textContent = "Ø¬Ø§Ø±ÙŠ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ø¯Ù‚Ø© Ø¹Ø§Ù„ÙŠØ©...";
    let current = await getBrowserLocation();
    if (current.accuracyMeters == null || Number(current.accuracyMeters) > Number(address.maxAccuracyMeters || 500)) {
      resultBox.textContent = "Ø¯Ù‚Ø© GPS Ø¶Ø¹ÙŠÙØ©ØŒ Ø¬Ø§Ø±ÙŠ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø®Ù„Ø§Ù„ Ø«ÙˆØ§Ù†Ù...";
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const retry = await getBrowserLocation();
      if ((Number(retry.accuracyMeters || 999999) < Number(current.accuracyMeters || 999999)) || !current.latitude) current = retry;
    }
    const evaluation = await endpoints.evaluateGeofence({ ...current, employeeId: employee.id });
    showResult(evaluation.allowed || evaluation.canRecord ? "Ù…ÙˆÙ‚Ø¹Ùƒ Ù…Ù‚Ø¨ÙˆÙ„ Ù„Ù„Ø¨ØµÙ…Ø©" : "Ù…ÙˆÙ‚Ø¹Ùƒ ØºÙŠØ± Ù…Ù‚Ø¨ÙˆÙ„ Ù„Ù„Ø¨ØµÙ…Ø©", evaluation, !(evaluation.allowed || evaluation.canRecord));
    return { current, evaluation };
  };
  app.querySelector("[data-test-location]").addEventListener("click", () => readLocationAndEvaluate().catch((error) => showResult(error.message, { message: error.message }, true)));
  app.querySelectorAll("[data-self-punch]").forEach((button) => button.addEventListener("click", async () => {
    try {
      showResult("Ø¬Ø§Ø±ÙŠ ØªØ£ÙƒÙŠØ¯ Ø¨ØµÙ…Ø© Ø§Ù„Ø¥ØµØ¨Ø¹", { message: "Ø§Ø³ØªØ®Ø¯Ù… Ø¨ØµÙ…Ø© Ø§Ù„Ø¬Ù‡Ø§Ø² Ø£Ùˆ Passkey Ù„Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„ØªØ³Ø¬ÙŠÙ„.", geofenceStatus: "biometric_pending", allowed: true }, false);
      const passkeyCredentialId = await requestBrowserPasskeyForPunch();
      const { current, evaluation } = await readLocationAndEvaluate();
      if (!evaluation.allowed && !evaluation.canRecord) {
        await logRejectedPunch(button.dataset.selfPunch, current, evaluation);
        setMessage("", evaluation.blockReason || evaluation.message || "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø¨ØµÙ…Ø© Ø®Ø§Ø±Ø¬ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹.");
        return;
      }
      const body = { ...current, notes: app.querySelector("#self-punch-notes").value, verificationStatus: "verified", biometricMethod: "passkey", passkeyCredentialId };
      const response = button.dataset.selfPunch === "checkIn" ? await endpoints.selfCheckIn(body) : await endpoints.selfCheckOut(body);
      showResult(button.dataset.selfPunch === "checkIn" ? "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø­Ø¶ÙˆØ±" : "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø§Ù„Ø§Ù†ØµØ±Ø§Ù", response.evaluation || evaluation, false);
      setMessage(button.dataset.selfPunch === "checkIn" ? "ØªÙ… Ø­ÙØ¸ Ø¨ØµÙ…Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹." : "ØªÙ… Ø­ÙØ¸ Ø¨ØµÙ…Ø© Ø§Ù„Ø§Ù†ØµØ±Ø§Ù Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹.", "");
      await render();
    } catch (error) {
      await logRejectedPunch(button.dataset.selfPunch, {}, { message: error.message, geofenceStatus: "REJECTED" }, error.message);
      showResult("ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø¨ØµÙ…Ø©", { message: error.message, geofenceStatus: "REJECTED" }, true);
      setMessage("", error.message);
    }
  }));
}


async function renderAttendance() {
  const filters = attendanceFiltersFromRoute();
  const maxSafeLimit = 2000;
  if (filters.limit > maxSafeLimit) setMessage("Ø§Ù„Ø³Ø¬Ù„Ø§Øª ÙƒØ«ÙŠØ±Ø© Ø¬Ø¯Ù‹Ø§Ø› Ø§Ø³ØªØ®Ø¯Ù… ÙØªØ±Ø© Ø£Ø¶ÙŠÙ‚ Ø£Ùˆ Ø­Ø¯Ù‹Ø§ Ø£Ù‚Ù„ Ù…Ù† 2000.", "");
  const queryFilters = { ...filters, limit: Math.min(filters.limit + 1, maxSafeLimit) };
  const [employees, eventsPayload] = await Promise.all([endpoints.employees().then(unwrap), endpoints.attendanceEvents(queryFilters).then(unwrap)]);
  const events = filterAttendanceEvents(eventsPayload || [], filters);
  const visibleEvents = events.slice(0, filters.limit);
  const hasMore = events.length > filters.limit || (eventsPayload || []).length >= queryFilters.limit;
  const employeeOptions = employees.map((employee) => ({ id: employee.id, name: `${employee.fullName}${employee.jobTitle ? " â€” " + employee.jobTitle : ""}` }));
  const employeeSelect = optionList(employeeOptions);
  const employeeFilterSelect = optionList(employeeOptions, filters.employeeId, "ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†");
  const typeFilterSelect = optionList([
    { id: "CHECK_IN", name: "Ø­Ø¶ÙˆØ±" },
    { id: "CHECK_OUT", name: "Ø§Ù†ØµØ±Ø§Ù" },
    { id: "MANUAL_ADJUSTMENT", name: "ØªØ¹Ø¯ÙŠÙ„ ÙŠØ¯ÙˆÙŠ" },
    { id: "PRESENT", name: "Ø­Ø§Ø¶Ø±" },
    { id: "LATE", name: "Ù…ØªØ£Ø®Ø±" },
    { id: "MISSION", name: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©" },
  ], filters.type, "ÙƒÙ„ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹");
  const reviewFilterSelect = optionList([{ id: "approved", name: "Ø§Ù„Ù…Ø¹ØªÙ…Ø¯ ÙÙ‚Ø·" }, { id: "review", name: "ÙŠØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©" }], filters.review, "ÙƒÙ„ Ø­Ø§Ù„Ø§Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©");
  shell(
    `<section class="grid">
      <article class="panel span-4">
        <div class="panel-head"><div><h2>ØªØ³Ø¬ÙŠÙ„ Ø³Ø±ÙŠØ¹</h2><p>ÙŠØ³Ø¬Ù„ Ø§Ù„Ø­Ø±ÙƒØ© Ù…Ø¹ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠ ÙˆØ­Ø§Ù„Ø© Ø§Ù„ØªØ­Ù‚Ù‚.</p></div></div>
        <label>Ø§Ù„Ù…ÙˆØ¸Ù<select id="attendance-employee">${employeeSelect}</select></label>
        <label>Ù…Ù„Ø§Ø­Ø¸Ø§Øª<input id="attendance-notes" placeholder="Ø§Ø®ØªÙŠØ§Ø±ÙŠ: Ø³Ø¨Ø¨ Ø£Ùˆ ØªÙˆØ¶ÙŠØ­" /></label>
        <label>Ø­Ø§Ù„Ø© Ø§Ù„ØªØ­Ù‚Ù‚<select id="attendance-verification"><option value="verified">ØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§Ù„Ø¬Ù‡Ø§Ø²</option><option value="not_checked">Ø¨Ø¯ÙˆÙ† ØªØ­Ù‚Ù‚</option><option value="failed">ÙØ´Ù„ Ø§Ù„ØªØ­Ù‚Ù‚</option></select></label>
        <div class="toolbar spaced"><button class="button primary" data-attendance="checkIn">Ø­Ø¶ÙˆØ±</button><button class="button" data-attendance="checkOut">Ø§Ù†ØµØ±Ø§Ù</button></div>
        <div id="attendance-result" class="risk-box hidden"></div>
      </article>
      <article class="panel span-8">
        <div class="panel-head"><div><h2>Ø³Ø¬Ù„ Ø§Ù„Ø­Ø¶ÙˆØ±</h2><p>Ø§Ù„ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ Ø¢Ø®Ø± 30 ÙŠÙˆÙ… Ù„ØªÙ‚Ù„ÙŠÙ„ Ø§Ù„Ø­Ù…Ù„ØŒ ÙˆÙŠÙ…ÙƒÙ† ØªÙˆØ³ÙŠØ¹ Ø§Ù„ÙØªØ±Ø© Ù…Ù† Ø§Ù„ÙÙ„Ø§ØªØ±.</p></div><div class="toolbar"><button class="button ghost" data-regenerate-attendance>Ø¥Ø¹Ø§Ø¯Ø© Ø­Ø³Ø§Ø¨ Ø§Ù„ÙŠÙˆÙ…ÙŠØ§Øª</button><button class="button ghost" data-export-attendance>ØªØµØ¯ÙŠØ± CSV</button></div></div>
        <form id="attendance-filters" class="filters attendance-filters">
          <label>Ù…Ù†<input name="from" type="date" value="${escapeHtml(filters.from)}" /></label>
          <label>Ø¥Ù„Ù‰<input name="to" type="date" value="${escapeHtml(filters.to)}" /></label>
          <label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId">${employeeFilterSelect}</select></label>
          <label>Ù†ÙˆØ¹ Ø§Ù„Ø­Ø±ÙƒØ©<select name="type">${typeFilterSelect}</select></label>
          <label>Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©<select name="review">${reviewFilterSelect}</select></label>
          <div class="form-actions"><button class="button primary" type="submit">ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„ÙÙ„ØªØ±</button><button class="button ghost" type="button" data-reset-attendance-filters>Ø¢Ø®Ø± 30 ÙŠÙˆÙ…</button></div>
        </form>
        <div class="table-summary"><strong>ÙŠØ¹Ø±Ø¶ ${escapeHtml(visibleEvents.length)} Ù…Ù† ${escapeHtml(events.length)} Ø­Ø±ÙƒØ©</strong><span>Ø§Ù„Ù…Ø¯Ù‰: ${escapeHtml(filters.from)} Ø¥Ù„Ù‰ ${escapeHtml(filters.to)}</span></div>
        ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©", "Ø§Ù„Ù…Ø®Ø§Ø·Ø±", "Ø³ÙŠÙ„ÙÙŠ", "Ø§Ù„ÙˆÙ‚Øª"], visibleEvents.map((event) => `<tr><td class="person-cell">${avatar(event.employee, "tiny")}<span>${escapeHtml(event.employee?.fullName || event.employeeId)}<small>${escapeHtml(event.notes || "")}</small></span></td><td>${badge(event.type)}</td><td>${badge(event.geofenceStatus || "unknown")}<small>${event.distanceFromBranchMeters != null ? `${event.distanceFromBranchMeters} Ù…ØªØ±` : ""}</small></td><td>${event.requiresReview ? badge("PENDING") : badge("APPROVED")}</td><td><strong>${escapeHtml(event.riskScore ?? 0)}%</strong> ${event.riskLevel ? badge(event.riskLevel) : ""}<br>${(event.riskFlags || []).length ? event.riskFlags.map((flag) => `<span class="status warning">${escapeHtml(flag)}</span>`).join(" ") : `<span class="status ACTIVE">Ø¢Ù…Ù†</span>`}</td><td>${event.selfieUrl ? `<a target="_blank" rel="noopener" href="${escapeHtml(event.selfieUrl)}">Ø¹Ø±Ø¶</a>` : `<span class="status warning">Ù„Ø§ ÙŠÙˆØ¬Ø¯</span>`}</td><td>${date(event.eventAt)}</td></tr>`), "attendance-table")}
        ${hasMore ? `<div class="load-more-row"><button class="button ghost" data-attendance-more>Ø¹Ø±Ø¶ 500 Ø­Ø±ÙƒØ© Ø£Ø®Ø±Ù‰</button><small>Ø§Ø³ØªØ®Ø¯Ù… ÙÙ„Ø§ØªØ± Ø£Ø¶ÙŠÙ‚ Ø¹Ù†Ø¯ Ø§Ù„Ø³Ø¬Ù„Ø§Øª Ø§Ù„ÙƒØ¨ÙŠØ±Ø© Ø¬Ø¯Ù‹Ø§.</small></div>` : ""}
      </article>
      <article class="panel span-12">
        <div class="panel-head"><div><h2>Ø·Ù„Ø¨ ØªØ¹Ø¯ÙŠÙ„ Ø­Ø¶ÙˆØ±</h2><p>ÙŠØªÙ… Ø­ÙØ¸Ù‡ ÙÙŠ Ù…Ø±ÙƒØ² Ø§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚</p></div></div>
        ${simpleForm("adjust-form", [["employeeId", "Ø§Ù„Ù…ÙˆØ¸Ù", "select", employeeSelect], ["title", "Ù†ÙˆØ¹ Ø§Ù„Ø·Ù„Ø¨", "select", optionList([{ name: "Ù†Ø³ÙŠØ§Ù† Ø¨ØµÙ…Ø© Ø­Ø¶ÙˆØ±" }, { name: "Ù†Ø³ÙŠØ§Ù† Ø¨ØµÙ…Ø© Ø§Ù†ØµØ±Ø§Ù" }, { name: "ØªØ¹Ø¯ÙŠÙ„ ØªØ£Ø®ÙŠØ±" }])], ["reason", "Ø§Ù„Ø³Ø¨Ø¨", "textarea"]], "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨")}
        <hr class="soft-separator" />
        <h3>ØªØ¹Ø¯ÙŠÙ„ ÙŠØ¯ÙˆÙŠ Ù…Ø¨Ø§Ø´Ø± Ø¨ØµÙ„Ø§Ø­ÙŠØ© HR</h3>
        <form id="manual-attendance-form" class="form-grid compact-form"><label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId">${employeeSelect}</select></label><label>Ù†ÙˆØ¹ Ø§Ù„Ø­Ø±ÙƒØ©<select name="type"><option value="CHECK_IN">Ø­Ø¶ÙˆØ±</option><option value="CHECK_OUT">Ø§Ù†ØµØ±Ø§Ù</option><option value="MANUAL_ADJUSTMENT">ØªØ¹Ø¯ÙŠÙ„ ÙŠØ¯ÙˆÙŠ</option></select></label><label>Ø§Ù„ØªØ§Ø±ÙŠØ® ÙˆØ§Ù„ÙˆÙ‚Øª<input type="datetime-local" name="eventAt" /></label><label>Ø§Ù„Ø³Ø¨Ø¨<input name="reason" required /></label><div class="form-actions"><button class="button">Ø­ÙØ¸ ØªØ¹Ø¯ÙŠÙ„ ÙŠØ¯ÙˆÙŠ</button></div></form>
      </article>
    </section>`,
    "Ø§Ù„Ø­Ø¶ÙˆØ±",
    "ØªØ³Ø¬ÙŠÙ„ ÙˆÙ…Ø±Ø§Ø¬Ø¹Ø© Ø£Ø­Ø¯Ø§Ø« Ø§Ù„Ø­Ø¶ÙˆØ± Ù…Ø¹ ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ§Ù„Ù‚ÙˆØ§Ø¹Ø¯.",
  );
  app.querySelector("#attendance-filters").addEventListener("submit", (event) => {
    event.preventDefault();
    setRouteQuery("attendance", { ...readForm(event.currentTarget), limit: 500 });
  });
  app.querySelector("[data-reset-attendance-filters]").addEventListener("click", () => setRouteQuery("attendance", {}));
  app.querySelector("[data-attendance-more]")?.addEventListener("click", () => setRouteQuery("attendance", { ...filters, limit: filters.limit + 500 }));

  const recordAttendance = async (action) => {
    const resultBox = app.querySelector("#attendance-result");
    try {
      resultBox.classList.remove("hidden");
      resultBox.classList.remove("danger-box");
      resultBox.textContent = "Ø¬Ø§Ø±ÙŠ Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø­Ø±ÙƒØ©...";
      const location = await getBrowserLocation();
      const body = { employeeId: app.querySelector("#attendance-employee").value, notes: app.querySelector("#attendance-notes").value, verificationStatus: app.querySelector("#attendance-verification").value, ...location };
      const response = action === "checkIn" ? await endpoints.checkIn(body) : await endpoints.checkOut(body);
      const evaluation = response.evaluation || response.event?.evaluation || {};
      resultBox.innerHTML = `<strong>${evaluation.requiresReview ? "Ø§Ù„Ø­Ø±ÙƒØ© ØªØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©" : "Ø§Ù„Ø­Ø±ÙƒØ© Ù…Ù‚Ø¨ÙˆÙ„Ø© Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹"}</strong><div class="toolbar spaced">${badge(evaluation.type || response.type)}${badge(evaluation.geofenceStatus || response.geofenceStatus)}${badge(evaluation.verificationStatus || response.verificationStatus)}</div><p>${evaluation.distanceFromBranchMeters != null || response.distanceFromBranchMeters != null ? `Ø§Ù„Ù…Ø³Ø§ÙØ© Ø¹Ù† Ø§Ù„ÙØ±Ø¹: ${escapeHtml(evaluation.distanceFromBranchMeters ?? response.distanceFromBranchMeters)} Ù…ØªØ±.` : "ØªÙ… Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹."}</p>`;
      setMessage(action === "checkIn" ? "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹." : "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø§Ù†ØµØ±Ø§Ù Ø¯Ø§Ø®Ù„ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹.", "");
      await render();
    } catch (error) {
      resultBox.classList.remove("hidden");
      resultBox.classList.add("danger-box");
      resultBox.innerHTML = `<strong>ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø¨ØµÙ…Ø©</strong><p>${escapeHtml(error.message)}</p>`;
      setMessage("", error.message);
    }
  };

  app.querySelector('[data-attendance="checkIn"]').addEventListener("click", () => recordAttendance("checkIn"));
  app.querySelector('[data-attendance="checkOut"]').addEventListener("click", () => recordAttendance("checkOut"));
  app.querySelector("#adjust-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await endpoints.adjustAttendance(readForm(event.currentTarget));
    setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ±.", "");
    render();
  });
  app.querySelector("#manual-attendance-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await endpoints.manualAttendance(readForm(event.currentTarget));
    setMessage("ØªÙ… Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„ÙŠØ¯ÙˆÙŠ ÙˆØ¥Ø¹Ø§Ø¯Ø© Ø­Ø³Ø§Ø¨ Ø§Ù„ÙŠÙˆÙ…ÙŠØ§Øª.", "");
    render();
  });
  app.querySelector("[data-regenerate-attendance]").addEventListener("click", async () => {
    const result = await endpoints.regenerateAttendance({});
    setMessage(`ØªÙ…Øª Ø¥Ø¹Ø§Ø¯Ø© Ø­Ø³Ø§Ø¨ ${result.generated || 0} Ø³Ø¬Ù„ ÙŠÙˆÙ…ÙŠ.`, "");
    render();
  });
  app.querySelector("[data-export-attendance]").addEventListener("click", () => {
    const rows = [["Ø§Ù„Ù…ÙˆØ¸Ù","Ø§Ù„Ù†ÙˆØ¹","Ø§Ù„ÙˆÙ‚Øª","Ø§Ù„Ù…ÙˆÙ‚Ø¹","Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©"], ...events.map((e) => [e.employee?.fullName || e.employeeId, statusLabel(e.type), e.eventAt, statusLabel(e.geofenceStatus), e.requiresReview ? "Ù†Ø¹Ù…" : "Ù„Ø§"])];
    downloadFile(`attendance-${filters.from || "all"}-${filters.to || "all"}.csv`, `\ufeff${toCsv(rows)}`, "text/csv;charset=utf-8");
  });
}

async function renderAttendanceCalendar() {
  const [employees, daily, events] = await Promise.all([endpoints.employees().then(unwrap), endpoints.attendanceDaily().then(unwrap), endpoints.attendanceEvents().then(unwrap)]);
  const employeeId = routeParams().get("employeeId") || employees[0]?.id || "";
  const employee = employees.find((item) => item.id === employeeId);
  const days = Array.from({ length: 31 }).map((_, index) => {
    const d = new Date();
    d.setDate(d.getDate() - (30 - index));
    const key = d.toISOString().slice(0, 10);
    const record = daily.find((item) => item.employeeId === employeeId && String(item.date).startsWith(key));
    const event = events.find((item) => item.employeeId === employeeId && String(item.eventAt).startsWith(key));
    return { key, status: record?.status || event?.type || "ABSENT", lateMinutes: record?.lateMinutes || event?.lateMinutes || 0 };
  });
  shell(
    `<section class="stack">
      <article class="panel">
        <div class="panel-head"><div><h2>ØªÙ‚ÙˆÙŠÙ… Ø­Ø¶ÙˆØ± ${escapeHtml(employee?.fullName || "")}</h2><p>Ø¢Ø®Ø± 31 ÙŠÙˆÙ…</p></div><select id="calendar-employee">${optionList(employees.map((e) => ({ id: e.id, name: `${e.fullName}${e.jobTitle ? " â€” " + e.jobTitle : ""}` })), employeeId)}</select></div>
        <div class="calendar-grid">${days.map((day) => `<div class="calendar-day ${day.status}"><strong>${dateOnly(day.key)}</strong>${badge(day.status)}<small>${day.lateMinutes ? `${day.lateMinutes} Ø¯Ù‚ÙŠÙ‚Ø© ØªØ£Ø®ÙŠØ±` : ""}</small></div>`).join("")}</div>
      </article>
    </section>`,
    "ØªÙ‚ÙˆÙŠÙ… Ø§Ù„Ø­Ø¶ÙˆØ±",
    "Ø±Ø¤ÙŠØ© Ø´Ù‡Ø±ÙŠØ© Ø³Ø±ÙŠØ¹Ø© Ù„Ø­Ø¶ÙˆØ± ÙƒÙ„ Ù…ÙˆØ¸Ù.",
  );
  app.querySelector("#calendar-employee").addEventListener("change", (event) => {
    location.hash = `attendance-calendar?employeeId=${event.target.value}`;
  });
}

async function renderMissions() {
  const [employees, missions] = await Promise.all([endpoints.employees().then(unwrap), endpoints.missions().then(unwrap)]);
  const employeeSelect = optionList(employees.map((employee) => ({ id: employee.id, name: `${employee.fullName}${employee.jobTitle ? " â€” " + employee.jobTitle : ""}` })));
  shell(
    `<section class="grid">
      <article class="panel span-4"><h2>Ù…Ø£Ù…ÙˆØ±ÙŠØ© Ø¬Ø¯ÙŠØ¯Ø©</h2>${simpleForm("mission-form", [["employeeId", "Ø§Ù„Ù…ÙˆØ¸Ù", "select", employeeSelect], ["title", "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†"], ["destinationName", "Ø§Ù„ÙˆØ¬Ù‡Ø©"], ["plannedStart", "Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©", "datetime-local"], ["plannedEnd", "Ø§Ù„Ù†Ù‡Ø§ÙŠØ©", "datetime-local"]], "Ø¥Ù†Ø´Ø§Ø¡")}</article>
      <article class="panel span-8"><h2>Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª</h2>${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„ÙˆØ¬Ù‡Ø©", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], missions.map((mission) => `<tr><td>${escapeHtml(mission.title)}</td><td>${escapeHtml(mission.employee?.fullName || "-")}</td><td>${escapeHtml(mission.destinationName)}</td><td>${badge(mission.status)}</td><td><button class="button ghost" data-mission="${mission.id}" data-action-name="approve">Ø§Ø¹ØªÙ…Ø§Ø¯</button><button class="button ghost" data-mission="${mission.id}" data-action-name="complete">Ø¥ÙƒÙ…Ø§Ù„</button><button class="button danger ghost" data-mission="${mission.id}" data-action-name="reject">Ø±ÙØ¶</button></td></tr>`))}</article>
    </section>`,
    "Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª",
    "Ø¥Ù†Ø´Ø§Ø¡ ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ ÙˆØ¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª Ù…Ø¹ Timeline Ø¯Ø§Ø®Ù„ÙŠ.",
  );
  app.querySelector("#mission-form").addEventListener("submit", submitForm(endpoints.createMission, "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ©."));
  app.querySelectorAll("[data-mission]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.updateMission(button.dataset.mission, button.dataset.actionName);
    setMessage("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ©.", "");
    render();
  }));
}

async function renderLeaves() {
  const [employees, leaves] = await Promise.all([endpoints.employees().then(unwrap), endpoints.leaves().then(unwrap)]);
  const employeeSelect = optionList(employees.map((employee) => ({ id: employee.id, name: `${employee.fullName}${employee.jobTitle ? " â€” " + employee.jobTitle : ""}` })));
  shell(
    `<section class="grid">
      <article class="panel span-4"><h2>Ø·Ù„Ø¨ Ø¥Ø¬Ø§Ø²Ø©</h2>${simpleForm("leave-form", [["employeeId", "Ø§Ù„Ù…ÙˆØ¸Ù", "select", employeeSelect], ["leaveType", "Ù†ÙˆØ¹ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©", "select", optionList([{ name: "Ø§Ø¹ØªÙŠØ§Ø¯ÙŠØ©" }, { name: "Ù…Ø±Ø¶ÙŠØ©" }, { name: "Ø·Ø§Ø±Ø¦Ø©" }])], ["startDate", "Ù…Ù†", "date"], ["endDate", "Ø¥Ù„Ù‰", "date"], ["reason", "Ø§Ù„Ø³Ø¨Ø¨"]], "Ø¥Ø±Ø³Ø§Ù„")}</article>
      <article class="panel span-8"><h2>Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©</h2>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ù…Ù†", "Ø¥Ù„Ù‰", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], leaves.map((leave) => `<tr><td>${escapeHtml(leave.employee?.fullName || "-")}</td><td>${escapeHtml(leave.leaveType?.name)}</td><td>${dateOnly(leave.startDate)}</td><td>${dateOnly(leave.endDate)}</td><td>${badge(leave.status)}</td><td><button class="button ghost" data-leave="${leave.id}" data-action-name="approve">Ø§Ø¹ØªÙ…Ø§Ø¯</button><button class="button danger ghost" data-leave="${leave.id}" data-action-name="reject">Ø±ÙØ¶</button></td></tr>`))}</article>
    </section>`,
    "Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª",
    "Ø¥Ø±Ø³Ø§Ù„ ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ ÙˆØ±ÙØ¶ Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©.",
  );
  app.querySelector("#leave-form").addEventListener("submit", submitForm(endpoints.createLeave, "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©."));
  app.querySelectorAll("[data-leave]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.updateLeave(button.dataset.leave, button.dataset.actionName);
    setMessage("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø·Ù„Ø¨ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©.", "");
    render();
  }));
}

async function renderRequests() {
  const params = routeParams();
  const filters = { status: params.get("status") || "", kind: params.get("kind") || "" };
  const payload = endpoints.requestCenter ? await endpoints.requestCenter(filters).then(unwrap) : null;
  let rows = payload?.rows;
  let summary = payload?.summary;
  if (!rows) {
    const [leaves, missions, exceptions, locations] = await Promise.all([endpoints.leaves().then(unwrap), endpoints.missions().then(unwrap), endpoints.exceptions().then(unwrap), endpoints.locations().then(unwrap)]);
    rows = [
      ...leaves.map((item) => ({ ...item, kind: "leave", kindLabel: "Ø¥Ø¬Ø§Ø²Ø©", label: item.leaveType?.name || "Ø¥Ø¬Ø§Ø²Ø©" })),
      ...missions.map((item) => ({ ...item, kind: "mission", kindLabel: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©", label: item.title || "Ù…Ø£Ù…ÙˆØ±ÙŠØ©" })),
      ...exceptions.map((item) => ({ ...item, kind: "exception", kindLabel: "Ø§Ø³ØªØ«Ù†Ø§Ø¡ Ø­Ø¶ÙˆØ±", label: item.title || "Ø§Ø³ØªØ«Ù†Ø§Ø¡ Ø­Ø¶ÙˆØ±" })),
      ...locations.filter((item) => item.purpose).map((item) => ({ ...item, kind: "location", kindLabel: "Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹", label: item.purpose || "Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹" })),
    ].sort((a, b) => new Date(b.createdAt || b.requestedAt || 0) - new Date(a.createdAt || a.requestedAt || 0));
    summary = { pending: rows.filter((i) => i.status === "PENDING").length, approved: rows.filter((i) => i.status === "APPROVED").length, rejected: rows.filter((i) => i.status === "REJECTED").length, stale: 0 };
  }
  const pendingRows = rows.filter((item) => item.status === "PENDING");
  shell(
    `<section class="grid request-center-page">
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ù…Ø±ÙƒØ² Ø§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª</h2><p>Workflow Ù…ÙˆØ­Ø¯ Ù„Ù„Ø¥Ø¬Ø§Ø²Ø§Øª ÙˆØ§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª ÙˆØ§Ù„Ø§Ø³ØªØ«Ù†Ø§Ø¡Ø§Øª ÙˆØ·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù…Ø¹ Ù‚Ø±Ø§Ø±Ø§Øª Ø¬Ù…Ø§Ø¹ÙŠØ©.</p></div><div class="toolbar"><button class="button ghost" data-route="leaves">Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª</button><button class="button ghost" data-route="missions">Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª</button></div></div>
        <div class="mini-stats"><div><span>Ù…Ø¹Ù„Ù‚Ø©</span><strong>${escapeHtml(summary?.pending || 0)}</strong></div><div><span>Ù…ØªØ£Ø®Ø±Ø©</span><strong>${escapeHtml(summary?.stale || 0)}</strong></div><div><span>Ù…Ø¹ØªÙ…Ø¯Ø©</span><strong>${escapeHtml(summary?.approved || 0)}</strong></div><div><span>Ù…Ø±ÙÙˆØ¶Ø©</span><strong>${escapeHtml(summary?.rejected || 0)}</strong></div></div>
      </article>
      <article class="panel span-12">
        <form class="filters" id="request-filters">
          <select name="status"><option value="">ÙƒÙ„ Ø§Ù„Ø­Ø§Ù„Ø§Øª</option>${optionList([{ value: "PENDING", name: "Ù‚ÙŠØ¯ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©" }, { value: "APPROVED", name: "Ù…Ø¹ØªÙ…Ø¯" }, { value: "REJECTED", name: "Ù…Ø±ÙÙˆØ¶" }], filters.status)}</select>
          <select name="kind"><option value="">ÙƒÙ„ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹</option>${optionList([{ value: "leave", name: "Ø¥Ø¬Ø§Ø²Ø©" }, { value: "mission", name: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©" }, { value: "exception", name: "Ø§Ø³ØªØ«Ù†Ø§Ø¡ Ø­Ø¶ÙˆØ±" }, { value: "location", name: "Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹" }], filters.kind)}</select>
        </form>
        <div class="request-card-grid">
          ${rows.map((item) => `
            <article class="request-card ${item.status === 'PENDING' ? 'is-pending' : ''}">
              <div class="card-top">
                <div class="requester-info">
                  ${avatar(item.employee, "small")}
                  <div>
                    <strong>${escapeHtml(item.employee?.fullName || "-")}</strong>
                    <small>${escapeHtml(item.kindLabel || item.kind)}</small>
                  </div>
                </div>
                <div class="status-side">${badge(item.status)}</div>
              </div>
              <div class="card-body">
                <h3>${escapeHtml(item.label)}</h3>
                <div class="request-meta">
                   <span>ØªØ§Ø±ÙŠØ® Ø§Ù„Ø·Ù„Ø¨: ${escapeHtml(date(item.createdAt || item.requestedAt))}</span>
                   ${item.workflow?.length ? `<div class="workflow-hint">Ø¢Ø®Ø± Ø¥Ø¬Ø±Ø§Ø¡: ${escapeHtml(item.workflow[item.workflow.length-1].action)} â€” ${escapeHtml(date(item.workflow[item.workflow.length-1].at))}</div>` : ''}
                </div>
              </div>
              <div class="card-footer">
                ${item.status === "PENDING" ? `
                  <div class="selection-area"><input type="checkbox" data-select-request="${escapeHtml(item.kind + ':' + item.id)}" /><span>ØªØ­Ø¯ÙŠØ¯ Ù„Ù„Ø¬Ù…Ø§Ø¹ÙŠ</span></div>
                  <div class="action-buttons">
                    <button class="button primary" data-request="${escapeHtml(item.kind + ':' + item.id)}" data-action-name="approve">Ø§Ø¹ØªÙ…Ø§Ø¯</button>
                    <button class="button danger ghost" data-request="${escapeHtml(item.kind + ':' + item.id)}" data-action-name="reject">Ø±ÙØ¶</button>
                  </div>
                ` : `<div class="decision-made">ØªÙ…Øª Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø© Ø¨Ù†Ø¬Ø§Ø­</div>`}
              </div>
            </article>
          `).join("") || `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø·Ù„Ø¨Ø§Øª Ø­Ø§Ù„ÙŠØ§Ù‹.</div>`}
        </div>
      </article>
    </section>`,
    "Ù…Ø±ÙƒØ² Ø§Ù„Ø·Ù„Ø¨Ø§Øª",
    "Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆØ§Ø¹ØªÙ…Ø§Ø¯ ÙˆØ±ÙØ¶ ÙƒÙ„ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ù…Ù† Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯.",
  );
  app.querySelector("#request-filters")?.addEventListener("change", (event) => {
    const values = readForm(event.currentTarget);
    const q = new URLSearchParams();
    if (values.status) q.set("status", values.status);
    if (values.kind) q.set("kind", values.kind);
    location.hash = `requests${q.toString() ? `?${q}` : ""}`;
  });
  const selected = new Set();
  const updateBulk = () => {
    app.querySelector("#request-selected-count").textContent = selected.size ? `ØªÙ… ØªØ­Ø¯ÙŠØ¯ ${selected.size} Ø·Ù„Ø¨` : "Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ Ø·Ù„Ø¨Ø§Øª";
    app.querySelectorAll("[data-bulk-request]").forEach((button) => { button.disabled = selected.size === 0; });
  };
  app.querySelectorAll("[data-select-request]").forEach((input) => input.addEventListener("change", () => { input.checked ? selected.add(input.dataset.selectRequest) : selected.delete(input.dataset.selectRequest); updateBulk(); }));
  app.querySelector("#request-select-all")?.addEventListener("change", (event) => {
    pendingRows.forEach((item) => event.target.checked ? selected.add(`${item.kind}:${item.id}`) : selected.delete(`${item.kind}:${item.id}`));
    app.querySelectorAll("[data-select-request]").forEach((input) => { input.checked = selected.has(input.dataset.selectRequest); });
    updateBulk();
  });
  app.querySelectorAll("[data-bulk-request]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.bulkRequest;
    if (!await confirmAction({ title: action === "approve" ? "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¬Ù…Ø§Ø¹ÙŠ" : "Ø±ÙØ¶ Ø¬Ù…Ø§Ø¹ÙŠ", message: `Ø³ÙŠØªÙ… ${action === "approve" ? "Ø§Ø¹ØªÙ…Ø§Ø¯" : "Ø±ÙØ¶"} ${selected.size} Ø·Ù„Ø¨.`, confirmLabel: action === "approve" ? "Ø§Ø¹ØªÙ…Ø§Ø¯" : "Ø±ÙØ¶", danger: action !== "approve" })) return;
    const result = endpoints.bulkRequestAction ? await endpoints.bulkRequestAction({ items: [...selected], action }) : { updated: 0 };
    setMessage(`ØªÙ… ØªØ­Ø¯ÙŠØ« ${result.updated || 0} Ø·Ù„Ø¨.`, "");
    render();
  }));
  app.querySelectorAll("[data-request]").forEach((button) => button.addEventListener("click", async () => {
    const [kind, id] = button.dataset.request.split(":");
    const action = button.dataset.actionName;
    if (kind === "leave") await endpoints.updateLeave(id, action);
    else if (kind === "mission") await endpoints.updateMission(id, action);
    else if (kind === "exception") await endpoints.updateException(id, action);
    else if (kind === "location") await endpoints.updateLocationRequest(id, { status: action === "reject" ? "REJECTED" : "APPROVED" });
    setMessage("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø·Ù„Ø¨.", "");
    render();
  }));
}


async function renderOrganization() {
  const ref = await referenceData();
  const config = [
    ["governorates", "Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø§Øª", ref.governorates, [["code","Ø§Ù„ÙƒÙˆØ¯"], ["name","Ø§Ù„Ø§Ø³Ù…"]]],
    ["complexes", "Ø§Ù„Ù…Ø¬Ù…Ø¹Ø§Øª", ref.complexes, [["code","Ø§Ù„ÙƒÙˆØ¯"], ["name","Ø§Ù„Ø§Ø³Ù…"], ["governorateId","Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©","select", optionList(ref.governorates)]]],
    ["branches", "Ø§Ù„ÙØ±ÙˆØ¹", ref.branches, [["code","Ø§Ù„ÙƒÙˆØ¯"], ["name","Ø§Ù„Ø§Ø³Ù…"], ["governorateId","Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©","select", optionList(ref.governorates)], ["complexId","Ø§Ù„Ù…Ø¬Ù…Ø¹","select", optionList(ref.complexes)], ["address","Ø§Ù„Ø¹Ù†ÙˆØ§Ù†"], ["latitude","Lat","number"], ["longitude","Lng","number"], ["geofenceRadiusMeters","Ù†Ø·Ø§Ù‚ Ø§Ù„Ø­Ø¶ÙˆØ±/Ù…ØªØ±","number"]]],
    ["departments", "Ø§Ù„Ø£Ù‚Ø³Ø§Ù…", ref.departments, [["code","Ø§Ù„ÙƒÙˆØ¯"], ["name","Ø§Ù„Ø§Ø³Ù…"], ["branchId","Ø§Ù„ÙØ±Ø¹","select", optionList(ref.branches)], ["managerEmployeeId","Ø§Ù„Ù…Ø¯ÙŠØ±","select", optionList(ref.employees.map((e) => ({ id: e.id, name: e.fullName })), "", "Ø¨Ø¯ÙˆÙ†")]]],
  ];
  shell(
    `<section class="grid">${config.map(([kind, title, items, fields]) => `
      <article class="panel span-6">
        <div class="panel-head"><div><h2>${escapeHtml(title)}</h2><p>CRUD ÙØ¹Ù„ÙŠ Ù…Ø¹ Ø­Ø°Ù Ù…Ù†Ø·Ù‚ÙŠ</p></div></div>
        ${simpleOrgForm(kind, fields)}
        ${table(["Ø§Ù„Ø§Ø³Ù…", "Ø§Ù„ÙƒÙˆØ¯", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.code || "-")}</td><td>${badge(item.active === false ? "INACTIVE" : "ACTIVE")}</td><td><button class="button ghost" data-edit-org="${kind}:${item.id}">ØªØ¹Ø¯ÙŠÙ„</button><button class="button danger ghost" data-delete-org="${kind}:${item.id}">ØªØ¹Ø·ÙŠÙ„</button></td></tr>`))}
      </article>`).join("")}</section>`,
    "Ø§Ù„ÙØ±ÙˆØ¹ ÙˆØ§Ù„Ø£Ù‚Ø³Ø§Ù…",
    "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ: Ù…Ø­Ø§ÙØ¸Ø§ØªØŒ Ù…Ø¬Ù…Ø¹Ø§ØªØŒ ÙØ±ÙˆØ¹ØŒ Ø£Ù‚Ø³Ø§Ù….",
  );
  config.forEach(([kind, _title, _items, fields]) => {
    app.querySelector(`#form-${kind}`).addEventListener("submit", async (event) => {
      event.preventDefault();
      await endpoints.saveOrg(kind, readForm(event.currentTarget));
      setMessage("ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¹Ù†ØµØ± Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠ.", "");
      render();
    });
  });
  app.querySelectorAll("[data-use-current-location]").forEach((button) => button.addEventListener("click", async () => {
    try {
      const current = await getBrowserLocation();
      const form = button.closest("form");
      if (current.latitude != null && form.elements.latitude) form.elements.latitude.value = current.latitude;
      if (current.longitude != null && form.elements.longitude) form.elements.longitude.value = current.longitude;
      if (form.elements.geofenceRadiusMeters && !form.elements.geofenceRadiusMeters.value) form.elements.geofenceRadiusMeters.value = 200;
      setMessage("ØªÙ… ÙˆØ¶Ø¹ Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ ÙƒØ¹Ù†ÙˆØ§Ù† Ø­Ø¶ÙˆØ± Ù„Ù„ÙØ±Ø¹. Ø§Ø¶ØºØ· Ø­ÙØ¸ Ù„ØªØ«Ø¨ÙŠØªÙ‡.", "");
    } catch (error) {
      setMessage("", error.message);
    }
  }));
  app.querySelectorAll("[data-edit-org]").forEach((button) => button.addEventListener("click", async () => {
    const [kind, id] = button.dataset.editOrg.split(":");
    const items = await endpoints.listOrg(kind);
    const item = items.find((row) => row.id === id);
    const form = app.querySelector(`#form-${kind}`);
    Object.entries(item || {}).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? "";
    });
    form.elements.id.value = id;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
  app.querySelectorAll("[data-delete-org]").forEach((button) => button.addEventListener("click", async () => {
    const [kind, id] = button.dataset.deleteOrg.split(":");
    await endpoints.deleteOrg(kind, id);
    setMessage("ØªÙ… ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ø¹Ù†ØµØ± ØªÙ†Ø¸ÙŠÙ…ÙŠÙ‹Ø§.", "");
    render();
  }));
}

function simpleOrgForm(kind, fields) {
  const locationButton = kind === "branches" ? `<button class="button ghost" type="button" data-use-current-location="${kind}">Ø§Ø³ØªØ®Ø¯Ù… Ù…ÙˆÙ‚Ø¹ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ ÙƒØ¹Ù†ÙˆØ§Ù† Ù„Ù„ÙØ±Ø¹</button>` : "";
  return `<form id="form-${kind}" class="form-grid compact-form"><input type="hidden" name="id" />${fields.map(([name, label, type = "text", opts = ""]) => `<label>${escapeHtml(label)}${type === "select" ? `<select name="${name}">${opts}</select>` : `<input name="${name}" type="${type}" step="any" />`}</label>`).join("")}<div class="form-actions">${locationButton}<button class="button primary" type="submit">Ø­ÙØ¸</button></div></form>`;
}

async function renderRoles() {
  const [roles, rawPermissions] = await Promise.all([endpoints.roles().then(unwrap), endpoints.permissions().then(unwrap)]);
  const permissions = rawPermissions;
  shell(
    `<section class="grid">
      <article class="panel span-5">
        <div class="panel-head"><div><h2>Ø¯ÙˆØ± Ø¬Ø¯ÙŠØ¯ / ØªØ¹Ø¯ÙŠÙ„</h2><p>ØµÙ„Ø§Ø­ÙŠØ§Øª Ø¯Ù‚ÙŠÙ‚Ø© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªØ®ØµÙŠØµ</p></div></div>
        <form id="role-form" class="form-grid">
          <input type="hidden" name="id" />
          <label>Ø§Ø³Ù… Ø§Ù„Ø¯ÙˆØ±<input name="name" required /></label>
          <label>Ø§Ù„ÙƒÙˆØ¯<input name="key" required /></label>
          <label>Ø§Ù„ÙˆØµÙ<input name="description" /></label>
          <div class="permissions-list">${permissions.map((p) => `<label class="check-row"><input type="checkbox" name="perm" value="${escapeHtml(p.scope)}" /> ${escapeHtml(p.name)}</label>`).join("")}</div>
          <div class="form-actions"><button class="button primary" type="submit">Ø­ÙØ¸ Ø§Ù„Ø¯ÙˆØ±</button></div>
        </form>
      </article>
      <article class="panel span-7">
        <h2>Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ø§Ù„Ø­Ø§Ù„ÙŠØ©</h2>
        ${table(["Ø§Ù„Ø¯ÙˆØ±", "Ø§Ù„ÙƒÙˆØ¯", "Ø¹Ø¯Ø¯ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], roles.map((role) => `<tr><td>${escapeHtml(role.name)}</td><td>${escapeHtml(role.key || role.slug)}</td><td>${escapeHtml(role.permissions?.length || 0)}</td><td><button class="button ghost" data-edit-role="${role.id}">ØªØ¹Ø¯ÙŠÙ„</button></td></tr>`))}
      </article>
    </section>`,
    "Ø§Ù„Ø£Ø¯ÙˆØ§Ø± ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª",
    "RBAC Ø¹Ù…Ù„ÙŠ Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…Ù‡ ÙÙŠ ØªÙ†Ø¸ÙŠÙ… Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ù†Ø¸Ø§Ù….",
  );
  app.querySelector("#role-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readForm(form);
    values.permissions = [...form.querySelectorAll('[name="perm"]:checked')].map((input) => input.value);
    await endpoints.saveRole(values);
    setMessage("ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¯ÙˆØ± ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª.", "");
    render();
  });
  app.querySelectorAll("[data-edit-role]").forEach((button) => button.addEventListener("click", () => {
    const role = roles.find((item) => item.id === button.dataset.editRole);
    const form = app.querySelector("#role-form");
    form.elements.id.value = role.id;
    form.elements.name.value = role.name || "";
    form.elements.key.value = role.key || role.slug || "";
    form.elements.description.value = role.description || "";
    form.querySelectorAll('[name="perm"]').forEach((input) => { input.checked = (role.permissions || []).includes(input.value); });
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  }));
}

async function renderOrgChart() {
  const employees = await endpoints.employees().then(unwrap);
  const active = employees.filter((employee) => employee.status !== "TERMINATED" && !employee.isDeleted);
  const byId = new Map(active.map((employee) => [employee.id, employee]));
  const childrenOf = (id) => active
    .filter((employee) => employee.managerEmployeeId === id)
    .sort((a, b) => String(a.fullName || "").localeCompare(String(b.fullName || ""), "ar"));
  const roots = active
    .filter((employee) => !employee.managerEmployeeId || !byId.has(employee.managerEmployeeId))
    .sort((a, b) => String(a.fullName || "").localeCompare(String(b.fullName || ""), "ar"));
  const countDescendants = (id) => childrenOf(id).reduce((total, child) => total + 1 + countDescendants(child.id), 0);
  const levelOf = (employee) => {
    let depth = 0;
    let current = employee;
    const seen = new Set();
    while (current?.managerEmployeeId && byId.has(current.managerEmployeeId) && !seen.has(current.managerEmployeeId)) {
      seen.add(current.id);
      depth += 1;
      current = byId.get(current.managerEmployeeId);
    }
    return depth;
  };
  const directToExecutive = active.filter((employee) => byId.get(employee.managerEmployeeId)?.roleId === "role-executive" || employee.managerEmployeeId === "emp-executive-director").length;
  const managers = active.filter((employee) => childrenOf(employee.id).length);
  const leaves = active.filter((employee) => !childrenOf(employee.id).length);
  const maxDepth = active.reduce((max, employee) => Math.max(max, levelOf(employee)), 0);
  const rows = active.map((employee) => [
    employee.fullName,
    employee.jobTitle || "-",
    employee.manager?.fullName || byId.get(employee.managerEmployeeId)?.fullName || "Ù…Ø¯ÙŠØ± Ø£Ø¹Ù„Ù‰ / Ù„Ø§ ÙŠÙˆØ¬Ø¯",
    childrenOf(employee.id).length,
    countDescendants(employee.id),
  ]);
  const node = (employee, depth = 0) => {
    const children = childrenOf(employee.id);
    return `<div class="org-tree-item" style="--depth:${depth}">
      <div class="org-node enhanced">
        ${avatar(employee, "tiny")}
        <span><strong>${escapeHtml(employee.fullName)}</strong><small>${escapeHtml(employee.jobTitle || "")}</small></span>
        <em>${children.length ? `${children.length} Ù…Ø¨Ø§Ø´Ø± / ${countDescendants(employee.id)} Ø¥Ø¬Ù…Ø§Ù„ÙŠ` : "Ø¨Ø¯ÙˆÙ† ØªØ§Ø¨Ø¹ÙŠÙ†"}</em>
      </div>
      ${children.length ? `<div class="org-children">${children.map((child) => node(child, depth + 1)).join("")}</div>` : ""}
    </div>`;
  };
  const roleSlugOf = (employee) => String(employee.role?.slug || employee.roleSlug || "").toLowerCase();
  const normalizedName = (employee) => String(employee.fullName || employee.name || "").trim();
  const sortPeople = (list) => list
    .filter(Boolean)
    .filter((employee, index, self) => self.findIndex((item) => item.id === employee.id) === index)
    .sort((a, b) => String(a.fullName || "").localeCompare(String(b.fullName || ""), "ar"));
  const executive = active.find((employee) => roleSlugOf(employee) === "executive")
    || active.find((employee) => String(employee.jobTitle || "").includes("ØªÙ†ÙÙŠØ°ÙŠ"))
    || roots[0];
  const secretary = active.find((employee) => ["executive-secretary", "admin"].includes(roleSlugOf(employee)) && employee.id !== executive?.id)
    || active.find((employee) => String(employee.jobTitle || "").includes("Ø³ÙƒØ±ØªÙŠØ±"));
  const managerLike = active.filter((employee) => employee.id !== executive?.id && employee.id !== secretary?.id)
    .filter((employee) => childrenOf(employee.id).length || ["manager", "direct-manager", "operations-manager-1", "operations-manager-2", "hr-manager"].includes(roleSlugOf(employee)));
  const firstLine = sortPeople([
    ...(executive ? childrenOf(executive.id).filter((employee) => employee.id !== secretary?.id) : []),
    ...managerLike.filter((employee) => !employee.managerEmployeeId || employee.managerEmployeeId === executive?.id),
  ]);
  const firstLineIds = new Set(firstLine.map((employee) => employee.id));
  const branchNode = (employee, depth = 0) => {
    const children = childrenOf(employee.id).filter((child) => child.id !== secretary?.id && !firstLineIds.has(child.id));
    return `<div class="org-feature-branch" style="--depth:${depth}">
      <div class="org-feature-node ${depth === 0 ? "is-manager" : ""}">
        ${avatar(employee, "tiny")}
        <span><strong>${escapeHtml(employee.fullName)}</strong><small>${escapeHtml(employee.jobTitle || employee.role?.name || "")}</small></span>
        <em>${children.length ? `${children.length} Ù…Ø¨Ø§Ø´Ø±` : "ØªÙ†ÙÙŠØ°"}</em>
      </div>
      ${children.length ? `<div class="org-feature-children">${children.map((child) => branchNode(child, depth + 1)).join("")}</div>` : ""}
    </div>`;
  };
  const featuredChart = executive ? `<div class="org-featured-chart">
    <div class="org-feature-top">
      <div class="org-feature-node is-executive">${avatar(executive, "tiny")}<span><strong>${escapeHtml(executive.fullName)}</strong><small>${escapeHtml(executive.jobTitle || "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ")}</small></span></div>
      ${secretary ? `<div class="org-feature-node is-secretary">${avatar(secretary, "tiny")}<span><strong>${escapeHtml(secretary.fullName)}</strong><small>${escapeHtml(secretary.jobTitle || secretary.role?.name || "Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ")}</small></span></div>` : ""}
    </div>
    <div class="org-feature-line" aria-hidden="true"></div>
    <div class="org-feature-managers">${firstLine.length ? firstLine.map((employee) => branchNode(employee)).join("") : roots.filter((employee) => employee.id !== executive.id && employee.id !== secretary?.id).map((employee) => branchNode(employee)).join("")}</div>
  </div>` : "";
  const fallbackRoots = roots.filter((employee) => employee.id !== executive?.id && employee.id !== secretary?.id && !firstLineIds.has(employee.id));
  shell(`
    <section class="stack">
      <div class="metric-grid org-summary-grid">
        ${[
          ["Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø£ÙØ±Ø§Ø¯", active.length, "ÙƒÙ„ Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„Ù†Ø´Ø·Ø© ÙÙŠ Ø§Ù„Ù‡ÙŠÙƒÙ„"],
          ["Ù…Ø¯ÙŠØ±ÙˆÙ† Ù„Ø¯ÙŠÙ‡Ù… ÙØ±Ù‚", managers.length, "Ù„Ø¯ÙŠÙ‡Ù… Ù…ÙˆØ¸Ù ÙˆØ§Ø­Ø¯ Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„"],
          ["ØªØ§Ø¨Ø¹ÙˆÙ† Ù…Ø¨Ø§Ø´Ø±Ø© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ", directToExecutive, "Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£ÙˆÙ„"],
          ["Ø£ÙƒØ¨Ø± Ø¹Ù…Ù‚ Ø¥Ø¯Ø§Ø±ÙŠ", maxDepth + 1, "Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ø³ØªÙˆÙŠØ§Øª Ù…Ù† Ø§Ù„Ù‚Ù…Ø©"],
          ["Ù…ÙˆØ¸ÙÙˆÙ† Ø¨Ù„Ø§ ØªØ§Ø¨Ø¹ÙŠÙ†", leaves.length, "Ø£ÙØ±Ø§Ø¯ ØªÙ†ÙÙŠØ°"],
        ].map(([label, value, helper]) => `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(helper)}</small></article>`).join("")}
      </div>
      <section class="panel">
        <div class="panel-head">
          <div><h2>Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ Ù„Ø¬Ù…Ø¹ÙŠØ© Ø®ÙˆØ§Ø·Ø± Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨</h2><p>Ø­Ø³Ø¨ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ù…Ø³Ø¬Ù„ ÙÙŠ Ù…Ù„ÙØ§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† â€” ÙŠØ¯Ø¹Ù… Ø£ÙƒØ«Ø± Ù…Ù† Ù…Ø³ØªÙˆÙ‰ Ø¥Ø¯Ø§Ø±ÙŠ.</p></div>
          <div class="toolbar"><button class="button ghost" data-export-org>ØªØµØ¯ÙŠØ± CSV</button><button class="button ghost" data-print-org>Ø·Ø¨Ø§Ø¹Ø©</button></div>
        </div>
        <div class="org-chart org-tree">${featuredChart || roots.map((employee) => node(employee)).join("")}${fallbackRoots.length && featuredChart ? `<div class="org-fallback-tree">${fallbackRoots.map((employee) => node(employee)).join("")}</div>` : ""}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><div><h2>Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©</h2><p>Ù…Ø±Ø§Ø¬Ø¹Ø© Ø³Ø±ÙŠØ¹Ø© Ù„ÙƒÙ„ Ù…ÙˆØ¸Ù ÙˆÙ…Ø¯ÙŠØ±Ù‡ ÙˆØ¹Ø¯Ø¯ Ø§Ù„ØªØ§Ø¨Ø¹ÙŠÙ†.</p></div></div>
        ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„ÙˆØ¸ÙŠÙØ©", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", "ØªØ§Ø¨Ø¹ÙˆÙ† Ù…Ø¨Ø§Ø´Ø±ÙˆÙ†", "Ø¥Ø¬Ù…Ø§Ù„ÙŠ ØªØ­Øª Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©"], rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`))}
      </section>
    </section>`, "Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ", "Ø¹Ø±Ø¶ Ø¹Ù„Ø§Ù‚Ø§Øª Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ† ÙˆØ§Ù„ÙØ±Ù‚ ÙƒÙ…Ø§ ÙˆØµÙØªÙ‡Ø§.");
  app.querySelector("[data-export-org]")?.addEventListener("click", () => downloadFile("org-hierarchy.csv", `\ufeff${toCsv([["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„ÙˆØ¸ÙŠÙØ©", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", "ØªØ§Ø¨Ø¹ÙˆÙ† Ù…Ø¨Ø§Ø´Ø±ÙˆÙ†", "Ø¥Ø¬Ù…Ø§Ù„ÙŠ ØªØ­Øª Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©"], ...rows])}`, "text/csv;charset=utf-8"));
  app.querySelector("[data-print-org]")?.addEventListener("click", () => printReport("Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„ÙˆØ¸ÙŠÙÙŠ", ["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„ÙˆØ¸ÙŠÙØ©", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", "ØªØ§Ø¨Ø¹ÙˆÙ† Ù…Ø¨Ø§Ø´Ø±ÙˆÙ†", "Ø¥Ø¬Ù…Ø§Ù„ÙŠ ØªØ­Øª Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©"], rows));
}

async function renderLocations() {
  const [employees, rawLocations] = await Promise.all([endpoints.employees().then(unwrap), endpoints.locations().then(unwrap).catch(() => [])]);
  const locations = safeList(rawLocations);
  const byEmployee = new Map(employees.map((employee) => [employee.id, employee]));
  const enrichedLocations = locations.map((item) => ({ ...item, employee: item.employee || byEmployee.get(item.employeeId) || null }));
  const latestFor = (employeeId) => enrichedLocations
    .filter((item) => item.employeeId === employeeId && item.latitude && item.longitude)
    .sort((a, b) => new Date(b.date || b.createdAt || b.requestedAt || 0) - new Date(a.date || a.createdAt || a.requestedAt || 0))[0];
  const pendingFor = (employeeId) => enrichedLocations
    .filter((item) => item.employeeId === employeeId && String(item.status || "").toUpperCase() === "PENDING")
    .sort((a, b) => new Date(b.requestedAt || b.createdAt || 0) - new Date(a.requestedAt || a.createdAt || 0))[0];
  const currentEmployeeId = state.user?.employeeId || state.user?.employee?.id || "";
  const employeeCards = employees.map((employee) => {
    const latest = latestFor(employee.id);
    const pending = pendingFor(employee.id);
    const employeeEvents = enrichedLocations
      .filter((item) => item.employeeId === employee.id)
      .sort((a, b) => new Date(b.date || b.createdAt || b.requestedAt || 0) - new Date(a.date || a.createdAt || a.requestedAt || 0))
      .slice(0, 8);
    return `<article class="employee-location-card" data-location-card="${escapeHtml(employee.id)}">
      <button class="location-card-head" type="button" data-toggle-location-details="${escapeHtml(employee.id)}">
        ${avatar(employee, "medium")}
        <span><strong>${escapeHtml(employee.fullName || "-")}</strong><small>${escapeHtml(employee.jobTitle || employee.phone || "")}</small></span>
        ${pending ? badge("Ø·Ù„Ø¨ Ù…ÙØªÙˆØ­") : badge(latest ? "Ø¢Ø®Ø± Ù…ÙˆÙ‚Ø¹ Ù…ÙˆØ¬ÙˆØ¯" : "Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…ÙˆÙ‚Ø¹")}
      </button>
      <div class="location-card-actions">
        <button class="button primary" type="button" data-request-live-location="${escapeHtml(employee.id)}">Ø¥Ø´Ø¹Ø§Ø± ÙØªØ­ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù„ÙˆÙƒÙŠØ´Ù†</button>
        ${employee.id === currentEmployeeId ? `<button class="button ghost" type="button" data-send-my-location>Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹ÙŠ Ø§Ù„Ø¢Ù†</button>` : ""}
      </div>
      <div class="location-details hidden" id="location-details-${escapeHtml(employee.id)}">
        <div class="meta-grid">
          <span>Ø§Ù„Ø§Ø³Ù…: ${escapeHtml(employee.fullName || "-")}</span>
          <span>Ø§Ù„Ù…Ø³Ù…Ù‰: ${escapeHtml(employee.jobTitle || "-")}</span>
          <span>Ø§Ù„Ù‡Ø§ØªÙ: ${escapeHtml(employee.phone || "-")}</span>
          <span>Ø§Ù„Ø¨Ø±ÙŠØ¯: ${escapeHtml(employee.email || "-")}</span>
          <span>Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±: ${escapeHtml(employee.manager?.fullName || "-")}</span>
          <span>Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«: ${latest ? date(latest.date || latest.createdAt || latest.requestedAt) : "Ù„Ø§ ÙŠÙˆØ¬Ø¯"}</span>
        </div>
        ${latest ? `<div class="map-line"><span>Lat: ${escapeHtml(latest.latitude)}</span><span>Lng: ${escapeHtml(latest.longitude)}</span><span>Ø§Ù„Ø¯Ù‚Ø©: ${escapeHtml(latest.accuracyMeters || "-")} Ù…ØªØ±</span><a class="button ghost" target="_blank" rel="noopener" href="https://maps.google.com/?q=${escapeHtml(latest.latitude)},${escapeHtml(latest.longitude)}">ÙØªØ­ Ø¹Ù„Ù‰ Google Maps</a></div>` : `<div class="empty-box">Ù„Ù… ÙŠØ±Ø³Ù„ Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¸Ù Ù…ÙˆÙ‚Ø¹Ù‹Ø§ Ù…Ø¨Ø§Ø´Ø±Ù‹Ø§ Ø¨Ø¹Ø¯.</div>`}
        ${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ÙˆÙ‚Øª", "Ø§Ù„Ù…ÙˆÙ‚Ø¹"], employeeEvents.map((item) => `<tr><td>${escapeHtml(item.latitude ? "Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø±" : "Ø·Ù„Ø¨ Ù…ÙˆÙ‚Ø¹")}</td><td>${badge(item.status || "ACTIVE")}</td><td>${date(item.date || item.createdAt || item.requestedAt)}</td><td>${item.latitude && item.longitude ? `${escapeHtml(item.latitude)}, ${escapeHtml(item.longitude)}` : "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ø¥Ø±Ø³Ø§Ù„"}</td></tr>`))}
      </div>
    </article>`;
  }).join("");
  shell(
    `<section class="grid locations-page">
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ø·Ù„Ø¨Ø§Øª ÙˆØ³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹</h2><p>ÙƒÙ„ Ù…ÙˆØ¸Ù ÙŠØ¸Ù‡Ø± Ø¨Ø§Ø³Ù…Ù‡ ÙˆØµÙˆØ±ØªÙ‡. Ø§Ø¶ØºØ· Ø¹Ù„Ù‰ Ø§Ù„Ù…ÙˆØ¸Ù Ù„Ø¹Ø±Ø¶ Ø§Ù„ØªÙØ§ØµÙŠÙ„ ÙˆØ¢Ø®Ø± Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹.</p></div></div>
        <div class="message compact">Ù„Ø§ ÙŠØªÙ… Ø·Ù„Ø¨ Ø³Ø¨Ø¨ Ø£Ùˆ ØºØ±Ø¶. Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ ÙŠØ±Ø³Ù„ Ø¥Ø´Ø¹Ø§Ø±Ù‹Ø§ Ù…Ø¨Ø§Ø´Ø±Ù‹Ø§ Ù„Ù„Ù…ÙˆØ¸Ù Ù„ÙØªØ­ ØµÙØ­Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù„ÙˆÙƒÙŠØ´Ù† Ø§Ù„Ø­Ø§Ù„ÙŠ.</div>
        ${currentEmployeeId ? `<div class="toolbar spaced"><button class="button primary" type="button" data-send-my-location>Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø§Ù„Ø¢Ù†</button></div>` : ""}
      </article>
      <article class="panel span-12">
        <div class="employee-location-grid">${employeeCards || `<div class="empty-state">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…ÙˆØ¸ÙÙˆÙ† Ù…Ø³Ø¬Ù„ÙˆÙ†.</div>`}</div>
      </article>
    </section>`,
    "Ø·Ù„Ø¨Ø§Øª ÙˆØ³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹",
    "Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù„ÙˆÙƒÙŠØ´Ù† Ø§Ù„Ù…Ø¨Ø§Ø´Ø± ÙˆÙ…Ø±Ø§Ø¬Ø¹Ø© Ø³Ø¬Ù„ Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹ Ø¨Ø¯ÙˆÙ† Ø³Ø¨Ø¨ Ø£Ùˆ ØºØ±Ø¶.",
  );
  app.querySelectorAll("[data-toggle-location-details]").forEach((button) => button.addEventListener("click", () => {
    const id = button.dataset.toggleLocationDetails;
    app.querySelector(`#location-details-${CSS.escape(id)}`)?.classList.toggle("hidden");
  }));
  const sendMyLocation = async () => {
    const employeeId = state.user?.employeeId || state.user?.employee?.id;
    if (!employeeId) throw new Error("Ù‡Ø°Ø§ Ø§Ù„Ø­Ø³Ø§Ø¨ ØºÙŠØ± Ù…Ø±Ø¨ÙˆØ· Ø¨Ù…Ù„Ù Ù…ÙˆØ¸Ù Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹.");
    const current = await getBrowserLocation();
    if (!current.latitude || !current.longitude) throw new Error("ØªØ¹Ø°Ø± Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø­Ø§Ù„ÙŠ. ÙØ¹Ù‘Ù„ GPS Ø«Ù… Ø­Ø§ÙˆÙ„ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.");
    await endpoints.recordLocation({ ...current, employeeId, source: "direct_live_location", status: "ACTIVE" });
    setMessage("ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ Ø¨Ù†Ø¬Ø§Ø­.", "");
    render();
  };
  app.querySelectorAll("[data-send-my-location]").forEach((button) => button.addEventListener("click", () => sendMyLocation().catch((error) => setMessage("", error.message))));
  app.querySelectorAll("[data-request-live-location]").forEach((button) => button.addEventListener("click", async () => {
    const employee = byEmployee.get(button.dataset.requestLiveLocation);
    await endpoints.createLocationRequest({
      employeeId: button.dataset.requestLiveLocation,
      purpose: "ÙØªØ­ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù„ÙˆÙƒÙŠØ´Ù† Ø§Ù„Ù…Ø¨Ø§Ø´Ø±",
      title: "ÙØªØ­ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ù„ÙˆÙƒÙŠØ´Ù† Ø§Ù„Ù…Ø¨Ø§Ø´Ø±",
      requestReason: "",
      status: "PENDING",
    });
    setMessage(`تم إنشاء طلب الموقع، وقد لا يصل الإشعار الخارجي إذا كان غير مفعل.`, "");
    render();
  }));
}

async function renderKpi() {
  const payload = unwrap(await endpoints.kpi());
  const ref = await referenceData();
  const employees = (payload.accessMode === "all" ? ref.employees : (ref.employees || []).filter((employee) => employee.id === payload.currentEmployeeId || (payload.pendingEmployees || []).some((item) => item.id === employee.id) || (payload.evaluations || []).some((item) => item.employeeId === employee.id))) || [];
  const policy = payload.policy || {};
  const cycle = payload.cycle || {};
  const criteria = payload.criteria || [];
  const evaluations = payload.evaluations || payload.summaries || [];
  const progressMetrics = payload.progressMetrics || [];
  const windowInfo = payload.windowInfo || cycle.window || {};
  const pendingEmployees = payload.pendingEmployees || [];
  const isSelf = payload.accessMode === "self";
  const isTeam = payload.accessMode === "team";
  const isHr = payload.accessMode === "hr";
  const isExecutive = payload.accessMode === "executive";
  const nextKpiStatus = isExecutive ? "EXECUTIVE_APPROVED" : isHr ? "HR_REVIEWED" : isTeam ? "MANAGER_APPROVED" : "SECRETARY_REVIEWED";
  const employeeOptions = optionList(employees.map((employee) => ({ id: employee.id, name: `${employee.fullName}${employee.jobTitle ? " â€” " + employee.jobTitle : ""}` })), isSelf ? payload.currentEmployeeId : "", isSelf ? "" : "Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ¸Ù");
  const managerOptions = optionList(ref.employees.map((employee) => ({ id: employee.id, name: `${employee.fullName}${employee.jobTitle ? " â€” " + employee.jobTitle : ""}` })), state.user?.employeeId || "", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ù…Ù„Ù Ø§Ù„Ù…ÙˆØ¸Ù");
  const metricCards = (payload.metrics || []).map((metric) => `<article class="metric span-3"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong><small>${escapeHtml(metric.helper || "")}</small></article>`).join("");
  const progressCards = progressMetrics.map((metric) => `<article class="metric span-2"><span>${escapeHtml(metric.label)}</span><strong>${escapeHtml(metric.value)}</strong><small>${escapeHtml(metric.helper || "")}</small></article>`).join("");
  shell(
    `<section class="grid kpi-page">
      <article class="panel span-12 accent-panel">
        <div class="panel-head">
          <div>
            <h2>${isSelf ? "ØªÙ‚ÙŠÙŠÙ…ÙŠ Ø§Ù„Ø°Ø§ØªÙŠ Ø§Ù„Ø´Ù‡Ø±ÙŠ" : isHr ? "Ù…Ø±Ø§Ø¬Ø¹Ø© HR Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª KPI" : isTeam ? "ØªÙ‚ÙŠÙŠÙ…Ø§Øª Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±" : isExecutive ? "Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª KPI" : "Ù†Ù…ÙˆØ°Ø¬ ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø£Ø¯Ø§Ø¡ Ø§Ù„Ø´Ù‡Ø±ÙŠ Ø§Ù„Ù…Ø¹ØªÙ…Ø¯"}</h2>
            <p>${escapeHtml(policy.description || "ÙŠØ¨Ø¯Ø£ Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ù…Ù† ÙŠÙˆÙ… 20 ÙˆÙŠÙ†ØªÙ‡ÙŠ ÙŠÙˆÙ… 25 Ù…Ù† Ù†ÙØ³ Ø§Ù„Ø´Ù‡Ø±.")}</p>
          </div>
          ${payload.accessMode === "all" ? `<div class="toolbar"><button class="button primary" id="recompute-kpi">ØªØ¬Ù‡ÙŠØ² ØªÙ‚ÙŠÙŠÙ…Ø§Øª Ù†Ø§Ù‚ØµØ©</button><button class="button ghost" id="send-kpi-reminders">Ø¥Ø±Ø³Ø§Ù„ ØªØ°ÙƒÙŠØ±Ø§Øª KPI</button><button class="button danger" id="close-kpi-cycle">Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ø¯ÙˆØ±Ø©</button></div>` : isExecutive ? `<button class="button primary" id="close-kpi-cycle">Ø¥ØºÙ„Ø§Ù‚/Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ø¯ÙˆØ±Ø©</button>` : ""}
        </div>
        <div class="kpi-policy-strip">
          <span>Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„ØªÙ‚ÙŠÙŠÙ…: ÙŠÙˆÙ… ${escapeHtml(policy.evaluationStartDay || 20)}</span>
          <span>Ù†Ù‡Ø§ÙŠØ© Ø§Ù„ØªÙ‚ÙŠÙŠÙ…: ÙŠÙˆÙ… ${escapeHtml(policy.evaluationEndDay || 25)}</span>
          <span>Ø¢Ø®Ø± Ù…ÙˆØ¹Ø¯ Ù„Ù„ØªØ³Ù„ÙŠÙ…: ÙŠÙˆÙ… ${escapeHtml(policy.submissionDeadlineDay || 25)}</span>
          <span>Ø§Ù„Ø­Ø§Ù„Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©: ${escapeHtml(windowInfo.label || "-")}</span>
          <span>${escapeHtml(windowInfo.message || "Ø§Ù„Ù…ÙˆØ¸Ù ÙŠØ±ÙØ¹ ØªÙ‚ÙŠÙŠÙ…Ù‡ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø«Ù… ÙŠØ¹ØªÙ…Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø£Ùˆ ÙŠØ¹Ø¯Ù„ Ù‚Ø¨Ù„ Ø§Ù„ØªØ³Ù„ÙŠÙ…")}</span>
        </div>
      </article>
      ${metricCards}
      ${progressCards ? `<article class="panel span-12"><div class="panel-head"><div><h2>Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯</h2><p>Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù Ø­ØªÙ‰ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ</p></div></div><div class="grid nested-metrics">${progressCards}</div></article>` : ""}
      <article class="panel span-5">
        <h2>${isSelf ? "Ø¥Ø±Ø³Ø§Ù„ ØªÙ‚ÙŠÙŠÙ…ÙŠ Ù„Ù…Ø¯ÙŠØ±ÙŠ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±" : "Ø¥Ø¯Ø®Ø§Ù„ / ØªØ¹Ø¯ÙŠÙ„ ØªÙ‚ÙŠÙŠÙ…"}</h2>
        <form id="kpi-form" class="form-grid compact-form">
          <label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId" required ${isSelf ? "disabled" : ""}>${employeeOptions}</select></label>
          ${isSelf ? `<input type="hidden" name="employeeId" value="${escapeHtml(payload.currentEmployeeId || "")}" />` : ""}
          <label>Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±<select name="managerEmployeeId" ${isSelf ? "disabled" : ""}>${managerOptions}</select></label>
          ${isSelf ? `<input type="hidden" name="managerEmployeeId" value="${escapeHtml(state.user?.employee?.managerEmployeeId || "")}" />` : ""}
          <label>ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¬Ù„Ø³Ø©<input name="evaluationDate" type="date" value="${escapeHtml(cycle.startsOn || new Date().toISOString().slice(0, 10))}" required /></label>
          <label>Ø­Ø§Ù„Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ…<select name="status">${optionList(isSelf ? [{ value: "SELF_SUBMITTED", name: "Ø±ÙØ¹ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±" }] : isHr ? [{ value: "HR_REVIEWED", name: "Ù…Ø±Ø§Ø¬Ø¹Ø© HR Ù…ÙƒØªÙ…Ù„Ø©" }] : isTeam ? [{ value: "MANAGER_APPROVED", name: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±" }] : isExecutive ? [{ value: "EXECUTIVE_APPROVED", name: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ" }] : [{ value: "DRAFT", name: "Ù…Ø³ÙˆØ¯Ø©" }, { value: "SELF_SUBMITTED", name: "Ø§Ø³ØªÙ„Ø§Ù… Ù…Ù† Ø§Ù„Ù…ÙˆØ¸Ù" }, { value: "MANAGER_APPROVED", name: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ±" }, { value: "HR_REVIEWED", name: "Ù…Ø±Ø§Ø¬Ø¹Ø© HR" }, { value: "SECRETARY_REVIEWED", name: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ" }, { value: "EXECUTIVE_APPROVED", name: "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ" }], isSelf ? "SELF_SUBMITTED" : isHr ? "HR_REVIEWED" : isTeam ? "MANAGER_APPROVED" : "SECRETARY_REVIEWED")}</select></label>
          ${!isHr ? `<label>ØªØ­Ù‚ÙŠÙ‚ Ø§Ù„Ø£Ù‡Ø¯Ø§Ù / 40<input name="targetScore" type="number" min="0" max="40" step="0.5" value="0" /></label>
          <label>Ø§Ù„ÙƒÙØ§Ø¡Ø© ÙÙŠ Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…Ù‡Ø§Ù… / 20<input name="efficiencyScore" type="number" min="0" max="20" step="0.5" value="0" /></label>
          <label>Ø­Ø³Ù† Ø§Ù„ØªØ¹Ø§Ù…Ù„ ÙˆØ§Ù„Ø³Ù„ÙˆÙƒ / 5<input name="conductScore" type="number" min="0" max="5" step="0.5" value="0" /></label>
          <label>Ø§Ù„ØªØ¨Ø±Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø¨Ø§Ø¯Ø±Ø§Øª / 5<input name="initiativesScore" type="number" min="0" max="5" step="0.5" value="0" /></label>` : ""}
          ${(isHr || payload.accessMode === "all") ? `<label>Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ø¹Ù…Ù„ Ø­Ø¶ÙˆØ±Ù‹Ø§ ÙˆØ§Ù†ØµØ±Ø§ÙÙ‹Ø§ / 20<input name="attendanceScore" type="number" min="0" max="20" step="0.5" placeholder="ÙŠØ­Ø³Ø¨ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¥Ù† ØªÙØ±Ùƒ ÙØ§Ø±ØºÙ‹Ø§" /></label>
          <label>Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ø§Ù„ØµÙ„Ø§Ø© ÙÙŠ Ø§Ù„Ù…Ø³Ø¬Ø¯ / 5<input name="prayerScore" type="number" min="0" max="5" step="0.5" value="0" /></label>
          <label>Ø­Ø¶ÙˆØ± Ø­Ù„Ù‚Ø© Ø§Ù„Ø´ÙŠØ® ÙˆÙ„ÙŠØ¯ ÙŠÙˆØ³Ù Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© Ù„ØªØ¯Ø±ÙŠØ³ Ø§Ù„Ù‚Ø±Ø¢Ù† ÙˆØ§Ù„ØªØ¬ÙˆÙŠØ¯ / 5<input name="quranCircleScore" type="number" min="0" max="5" step="0.5" value="0" /></label>` : `<div class="notice span-2">Ø®Ø§Øµ Ø¨Ù€ HR â€” Ø¨Ù†ÙˆØ¯ HR ÙÙ‚Ø·: Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù /20ØŒ Ø§Ù„ØµÙ„Ø§Ø© ÙÙŠ Ø§Ù„Ù…Ø³Ø¬Ø¯ /5ØŒ Ø­Ø¶ÙˆØ± Ø­Ù„Ù‚Ø© Ø§Ù„Ø´ÙŠØ® ÙˆÙ„ÙŠØ¯ ÙŠÙˆØ³Ù Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ÙŠØ© Ù„ØªØ¯Ø±ÙŠØ³ Ø§Ù„Ù‚Ø±Ø¢Ù† ÙˆØ§Ù„ØªØ¬ÙˆÙŠØ¯ /5.</div>`}
          <label class="span-2">${isSelf ? "Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ù…ÙˆØ¸Ù" : "Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ù…Ø¯ÙŠØ±"}<textarea name="${isSelf ? "employeeNotes" : "managerNotes"}" placeholder="${isSelf ? "Ø§ÙƒØªØ¨ Ù…Ù„Ø®Øµ ØªÙ‚ÙŠÙŠÙ…Ùƒ Ø§Ù„Ø°Ø§ØªÙŠ ÙˆÙ…Ø§ ØªÙ… Ø§Ù„Ø§ØªÙØ§Ù‚ Ø¹Ù„ÙŠÙ‡ Ù…Ø¹ Ø§Ù„Ù…Ø¯ÙŠØ±" : "Ù…Ù„Ø®Øµ Ø¬Ù„Ø³Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ… ÙˆÙ†Ù‚Ø§Ø· Ø§Ù„ØªØ­Ø³ÙŠÙ†"}"></textarea></label>
          <label class="checkbox-row"><input name="meetingHeld" type="checkbox" checked /> ØªÙ…Øª Ø¬Ù„Ø³Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø¨ÙŠÙ† Ø§Ù„Ù…ÙˆØ¸Ù ÙˆÙ…Ø¯ÙŠØ±Ù‡ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</label>
          <div class="form-actions"><button class="button primary" type="submit" ${isSelf && windowInfo.isOpen === false ? "disabled" : ""}>${isSelf ? "Ø±ÙØ¹ Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ù„Ù„Ù…Ø¯ÙŠØ±" : "Ø­ÙØ¸ / Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„ØªÙ‚ÙŠÙŠÙ…"}</button></div>
        </form>
      </article>
      <article class="panel span-7">
        <div class="panel-head"><div><h2>Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„ØªÙ‚ÙŠÙŠÙ…</h2><p>Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ 100 Ø¯Ø±Ø¬Ø©</p></div><strong>${escapeHtml(cycle.name || "Ø§Ù„Ø¯ÙˆØ±Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©")}</strong></div>
        ${table(["Ø§Ù„Ù…Ø¹ÙŠØ§Ø±", "Ø§Ù„Ø¯Ø±Ø¬Ø©", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ÙˆØµÙ"], criteria.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong></td><td>${escapeHtml(item.maxScore || item.weight || item.weightPercentage)} Ø¯Ø±Ø¬Ø©</td><td>${escapeHtml(item.parentCode || item.scoringType || "-")}</td><td>${escapeHtml(item.description || "-")}</td></tr>`))}
      </article>
      <article class="panel span-12">
        <div class="panel-head"><div><h2>${isSelf ? "ØªÙ‚ÙŠÙŠÙ…ÙŠ Ø§Ù„Ø­Ø§Ù„ÙŠ" : "ØªÙ‚ÙŠÙŠÙ…Ø§Øª Ø§Ù„Ø¯ÙˆØ±Ø© Ø§Ù„Ø­Ø§Ù„ÙŠØ©"}</h2><p>Ø¢Ø®Ø± Ù…ÙˆØ¹Ø¯ Ù„ØªØ³Ù„ÙŠÙ… Ø§Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª ÙŠÙˆÙ… 25 Ù…Ù† Ø§Ù„Ø´Ù‡Ø± â€” Ø§Ù„ÙØªØ±Ø© Ø§Ù„Ø±Ø³Ù…ÙŠØ© Ù…Ù† ÙŠÙˆÙ… 20 Ø¥Ù„Ù‰ 25</p></div>${payload.accessMode !== "self" ? `<button class="button ghost" id="export-kpi-csv">ØªØµØ¯ÙŠØ± CSV</button>` : ""}</div>
        ${table(["Ø§Ù„ØªØ±ØªÙŠØ¨", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù…Ø¯ÙŠØ±", "Ø§Ù„Ø£Ù‡Ø¯Ø§Ù", "Ø§Ù„ÙƒÙØ§Ø¡Ø©", "Ø§Ù„Ø­Ø¶ÙˆØ±", "Ø§Ù„Ø³Ù„ÙˆÙƒÙŠØ§Øª", "Ø§Ù„Ù…Ø¨Ø§Ø¯Ø±Ø§Øª", "Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ", "Ø§Ù„ØªÙ‚Ø¯ÙŠØ±", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], evaluations.map((item) => `<tr>
          <td>${escapeHtml(item.rank || "-")}</td>
          <td>${escapeHtml(item.employee?.fullName || item.employeeId)}</td>
          <td>${escapeHtml(item.manager?.fullName || item.managerEmployeeId || "-")}</td>
          <td>${escapeHtml(item.targetScore ?? "-")}/40</td>
          <td>${escapeHtml(item.efficiencyScore ?? "-")}/20</td>
          <td>${escapeHtml(item.attendanceScore ?? "-")}/20</td>
          <td>${escapeHtml((Number(item.conductScore || 0) + Number(item.prayerScore || 0) + Number(item.quranCircleScore || 0)).toFixed(1))}/15</td>
          <td>${escapeHtml(item.initiativesScore ?? "-")}/5</td>
          <td><strong>${escapeHtml(item.totalScore ?? "-")}/100</strong></td>
          <td>${escapeHtml(item.rating || item.grade || "-")}</td>
          <td>${badge(item.status || "DRAFT")}</td>
          <td>${payload.accessMode === "self" ? "-" : `<button class="button ghost" data-kpi-action="approve" data-next-status="${escapeHtml(nextKpiStatus)}" data-id="${escapeHtml(item.id)}">${isExecutive ? "Ø§Ø¹ØªÙ…Ø§Ø¯ Ù†Ù‡Ø§Ø¦ÙŠ" : "Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØªØ³Ù„ÙŠÙ…"}</button>`}</td>
        </tr>`))}
      </article>
      <article class="panel span-12">
        <h2>${isSelf ? "Ø§Ù„Ø®Ø·ÙˆØ© Ø§Ù„ØªØ§Ù„ÙŠØ©" : "Ù…ÙˆØ¸ÙÙˆÙ† Ù„Ù… ÙŠØªÙ… ØªÙ‚ÙŠÙŠÙ…Ù‡Ù… Ø¨Ø¹Ø¯"}</h2>
        <div class="chips">${isSelf ? `<span class="chip">Ø¨Ø¹Ø¯ Ø±ÙØ¹ ØªÙ‚ÙŠÙŠÙ…ÙƒØŒ ÙŠØ¸Ù‡Ø± Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„Ø§Ø¹ØªÙ…Ø§Ø¯Ù‡ Ø£Ùˆ ØªØ¹Ø¯ÙŠÙ„Ù‡ Ø«Ù… ØªØ³Ù„ÙŠÙ…Ù‡.</span>` : pendingEmployees.length ? pendingEmployees.map((employee) => `<span class="chip">${escapeHtml(employee.fullName)} - ${escapeHtml(employee.jobTitle || "")}</span>`).join("") : `<span class="chip success">Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙ‚ÙŠÙŠÙ…Ø§Øª Ù†Ø§Ù‚ØµØ©</span>`}</div>
      </article>
    </section>`,
    "Ù…Ø¤Ø´Ø±Ø§Øª ÙˆØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø£Ø¯Ø§Ø¡",
    isSelf ? "Ø§Ù„Ù…ÙˆØ¸Ù ÙŠØ±Ù‰ ØªÙ‚ÙŠÙŠÙ…Ù‡ ÙÙ‚Ø· ÙˆÙŠØ±ÙØ¹Ù‡ Ù„Ù…Ø¯ÙŠØ±Ù‡ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±." : "Ù†Ù…ÙˆØ°Ø¬ KPI Ø´Ù‡Ø±ÙŠ ÙŠØ¨Ø¯Ø£ Ù…Ù† ÙŠÙˆÙ… 20 Ø¥Ù„Ù‰ 25ØŒ Ù…Ø¹ ÙØµÙ„ Ø¨Ù†ÙˆØ¯ HR Ø¹Ù† Ø¨Ù†ÙˆØ¯ Ø§Ù„Ù…ÙˆØ¸Ù ÙˆØ§Ù„Ù…Ø¯ÙŠØ±.",
  );
  app.querySelector("#kpi-form").addEventListener("submit", submitForm(endpoints.saveKpiEvaluation, isSelf ? "ØªÙ… Ø±ÙØ¹ ØªÙ‚ÙŠÙŠÙ…Ùƒ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±." : "ØªÙ… Ø­ÙØ¸ ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø£Ø¯Ø§Ø¡."));
  app.querySelector("#recompute-kpi")?.addEventListener("click", async () => {
    const result = await endpoints.recomputeKpi({});
    setMessage(`ØªÙ… ØªØ¬Ù‡ÙŠØ² ${result.recomputed || 0} ØªÙ‚ÙŠÙŠÙ… Ù†Ø§Ù‚Øµ.`, "");
    render();
  });
  app.querySelector("#send-kpi-reminders")?.addEventListener("click", async () => {
    const result = await endpoints.sendKpiReminders();
    setMessage(`ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ${result.sent || 0} ØªØ°ÙƒÙŠØ± KPI Ø­Ø³Ø¨ Ø§Ù„Ù…Ø±Ø­Ù„Ø©.`, "");
    render();
  });
  app.querySelector("#close-kpi-cycle")?.addEventListener("click", async () => {
    await endpoints.closeKpiCycle();
    setMessage("ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ø¯ÙˆØ±Ø© KPI Ø§Ù„Ø­Ø§Ù„ÙŠØ©.", "");
    render();
  });
  app.querySelectorAll("[data-kpi-action]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.updateKpiEvaluation(button.dataset.id, { status: button.dataset.nextStatus || nextKpiStatus });
    setMessage("ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„ØªÙ‚ÙŠÙŠÙ… ÙˆØªØ³Ù„ÙŠÙ…Ù‡.", "");
    render();
  }));
  app.querySelector("#export-kpi-csv")?.addEventListener("click", () => {
    const rows = [["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù…Ø¯ÙŠØ±", "Ø§Ù„Ø£Ù‡Ø¯Ø§Ù", "Ø§Ù„ÙƒÙØ§Ø¡Ø©", "Ø§Ù„Ø­Ø¶ÙˆØ±", "Ø§Ù„Ø³Ù„ÙˆÙƒÙŠØ§Øª", "Ø§Ù„Ù…Ø¨Ø§Ø¯Ø±Ø§Øª", "Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ", "Ø§Ù„Ø­Ø§Ù„Ø©"], ...evaluations.map((item) => [item.employee?.fullName || item.employeeId, item.manager?.fullName || "", item.targetScore, item.efficiencyScore, item.attendanceScore, Number(item.conductScore || 0) + Number(item.prayerScore || 0) + Number(item.quranCircleScore || 0), item.initiativesScore, item.totalScore, statusLabel(item.status)])];
    downloadFile("monthly-kpi-evaluations.csv", `\ufeff${toCsv(rows)}`, "text/csv;charset=utf-8");
  });
}

async function renderReports() {
  const payload = await endpoints.reports();
  const jobs = payload.jobs || [];
  const schedules = payload.schedules || [];
  const templates = payload.templates || [
    { key: "attendance", name: "Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù" },
    { key: "employees", name: "Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†" },
    { key: "requests", name: "Ø§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª" },
  ];
  shell(
    `<section class="grid reports-hub-page">
      <article class="panel span-4"><h2>Ø·Ù„Ø¨ ØªÙ‚Ø±ÙŠØ±</h2>${simpleForm("report-form", [["title", "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†"], ["reportKey", "Ø§Ù„Ù†ÙˆØ¹", "select", optionList(templates.map((item) => ({ value: item.key, name: item.name })))], ["format", "Ø§Ù„ØµÙŠØºØ©", "select", optionList([{ name: "csv" }, { name: "excel" }, { name: "pdf" }, { name: "json" }])]], "Ø¥Ù†Ø´Ø§Ø¡")}</article>
      <article class="panel span-8">
        <div class="panel-head"><div><h2>Ù…Ø±ÙƒØ² Ø§Ù„ØªØµØ¯ÙŠØ±</h2><p>ØªØµØ¯ÙŠØ± ÙÙˆØ±ÙŠ CSV/Excel/PDF Ù…Ø¹ Ù‚Ø§Ù„Ø¨ Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©.</p></div></div>
        <form id="quick-report-form" class="form-grid compact-form">
          <label>Ù†ÙˆØ¹ Ø§Ù„ØªÙ‚Ø±ÙŠØ±<select name="reportKey">${optionList(templates.map((item) => ({ value: item.key, name: item.name })))}</select></label>
          <label>Ø§Ù„ÙØªØ±Ø© Ù…Ù†<input name="from" type="date" /></label>
          <label>Ø¥Ù„Ù‰<input name="to" type="date" /></label>
          <div class="form-actions"><button class="button ghost" type="button" data-export-format="csv">CSV</button><button class="button ghost" type="button" data-export-format="xls">Excel</button><button class="button primary" type="button" data-export-format="pdf">Ø·Ø¨Ø§Ø¹Ø© / PDF</button></div>
        </form>
      </article>
      <article class="panel span-5">
        <h2>Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±</h2>
        <form id="report-schedule-form" class="form-grid compact-form">
          <label>Ø§Ø³Ù… Ø§Ù„Ø¬Ø¯ÙˆÙ„Ø©<input name="title" value="ØªÙ‚Ø±ÙŠØ± Ø´Ù‡Ø±ÙŠ Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©" /></label>
          <label>Ù†ÙˆØ¹ Ø§Ù„ØªÙ‚Ø±ÙŠØ±<select name="reportKey">${optionList(templates.map((item) => ({ value: item.key, name: item.name })))}</select></label>
          <label>Ø§Ù„ØªÙƒØ±Ø§Ø±<select name="frequency"><option value="weekly">Ø£Ø³Ø¨ÙˆØ¹ÙŠ</option><option value="monthly" selected>Ø´Ù‡Ø±ÙŠ</option></select></label>
          <label>Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ†<input name="recipients" placeholder="email@example.com" /></label>
          <div class="form-actions"><button class="button primary">Ø­ÙØ¸ Ø§Ù„Ø¬Ø¯ÙˆÙ„Ø©</button></div>
        </form>
      </article>
      <article class="panel span-7"><h2>Ø§Ù„Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©</h2>${table(["Ø§Ù„Ø§Ø³Ù…", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ØªÙƒØ±Ø§Ø±", "Ø§Ù„Ù…Ø³ØªÙ„Ù…ÙˆÙ†", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], schedules.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.reportKey)}</td><td>${escapeHtml(item.frequency)}</td><td>${escapeHtml(item.recipients || "-")}</td><td>${date(item.createdAt)}</td></tr>`))}</article>
      <article class="panel span-12"><div class="panel-head"><h2>Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ù†Ø´Ø£Ø©</h2><div class="toolbar"><button class="button ghost" id="export-system-json">Backup JSON</button></div></div>${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ØµÙŠØºØ©", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], jobs.map((job) => `<tr><td>${escapeHtml(job.title)}</td><td>${escapeHtml(job.reportKey)}</td><td>${escapeHtml(job.format)}</td><td>${badge(job.status)}</td><td>${date(job.createdAt)}</td></tr>`))}</article>
    </section>`,
    "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±",
    "Ø¥Ù†Ø´Ø§Ø¡ ÙˆØªØµØ¯ÙŠØ± ÙˆØ¬Ø¯ÙˆÙ„Ø© Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ØªØ´ØºÙŠÙ„ÙŠØ©.",
  );
  app.querySelector("#report-form").addEventListener("submit", submitForm(endpoints.createReport, "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ØªÙ‚Ø±ÙŠØ±."));
  app.querySelector("#report-schedule-form")?.addEventListener("submit", submitForm(endpoints.saveReportSchedule, "ØªÙ… Ø­ÙØ¸ Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„ØªÙ‚Ø±ÙŠØ±."));
  const exportQuick = async (format) => {
    const values = readForm(app.querySelector("#quick-report-form"));
    const report = await endpoints.exportReportData(values).then(unwrap);
    const headers = report.headers || [];
    const rows = report.rows || [];
    const name = `${values.reportKey || "report"}-${new Date().toISOString().slice(0,10)}`;
    if (format === "csv") return downloadFile(`${name}.csv`, `\ufeff${toCsv([headers, ...rows])}`, "text/csv;charset=utf-8");
    if (format === "xls") return exportHtmlTable(`${name}.xls`, headers, rows);
    return printBrandedReport(report.title || "ØªÙ‚Ø±ÙŠØ±", `<div class="summary"><div><span>Ø¹Ø¯Ø¯ Ø§Ù„Ø³Ø¬Ù„Ø§Øª</span><strong>${rows.length}</strong></div><div><span>Ù†ÙˆØ¹ Ø§Ù„ØªÙ‚Ø±ÙŠØ±</span><strong>${escapeHtml(values.reportKey || "attendance")}</strong></div></div>`, headers, rows);
  };
  app.querySelectorAll("[data-export-format]").forEach((button) => button.addEventListener("click", () => exportQuick(button.dataset.exportFormat)));
  app.querySelector("#export-system-json").addEventListener("click", async () => downloadFile("hr-backup.json", JSON.stringify(await endpoints.backup(), null, 2), "application/json;charset=utf-8"));
}


async function renderAudit() {
  const logs = await endpoints.auditLogs().then(unwrap);
  shell(
    `<section class="panel">
      <div class="panel-head"><div><h2>Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚</h2><p>ÙƒÙ„ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ù…Ù‡Ù…Ø© ØªØ­ÙØ¸ Ù‡Ù†Ø§ Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</p></div><button class="button ghost" id="export-audit">ØªØµØ¯ÙŠØ±</button></div>
      ${table(["Ø§Ù„Ø¹Ù…Ù„ÙŠØ©", "Ø§Ù„ÙƒÙŠØ§Ù†", "Ø§Ù„Ù…Ø¹Ø±Ù", "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], logs.map((log) => `<tr><td>${escapeHtml(log.action)}</td><td>${escapeHtml(log.entityType)}</td><td>${escapeHtml(log.entityId)}</td><td>${escapeHtml(log.actor || log.actorUserId || "-")}</td><td>${date(log.createdAt)}</td></tr>`))}
    </section>`,
    "Ø³Ø¬Ù„ Ø§Ù„ØªØ¯Ù‚ÙŠÙ‚",
    "Audit Log Ù„Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ù…Ù‡Ù…Ø©.",
  );
  app.querySelector("#export-audit").addEventListener("click", () => downloadFile("audit-log.csv", `\ufeff${toCsv([["action","entity","id","actor","date"], ...logs.map((l) => [l.action, l.entityType, l.entityId, l.actor, l.createdAt])])}`, "text/csv;charset=utf-8"));
}

async function renderNotifications() {
  const [items, ref] = await Promise.all([endpoints.notifications().then(unwrap), referenceData()]);
  const unread = items.filter((item) => !item.isRead).length;
  shell(
    `<section class="grid notifications-hub-page">
      <article class="panel span-5">
        <div class="panel-head"><div><h2>Ù‚Ù†Ø§Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ</h2><p>Ø¥Ø¹Ù„Ø§Ù†Ø§ØªØŒ ØªØ°ÙƒÙŠØ±Ø§ØªØŒ ÙˆØªØ¹Ù„ÙŠÙ…Ø§Øª ØªØµÙ„ Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙƒØªÙ†Ø¨ÙŠÙ‡ Ø¯Ø§Ø®Ù„ÙŠ ÙˆWeb Push Ù…Ø¹ ØªÙ†Ø¨ÙŠÙ‡ ØµÙˆØªÙŠ Ø¯Ø§Ø®Ù„ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø¹Ù†Ø¯ ÙØªØ­Ù‡.</p></div>${healthBadge(Boolean("Notification" in window), "Browser Push")}</div>
        <form id="announcement-form" class="form-grid compact-form">
          <label>Ù†ÙˆØ¹ Ø§Ù„Ø±Ø³Ø§Ù„Ø©<select name="type"><option value="ANNOUNCEMENT">Ø¥Ø¹Ù„Ø§Ù† Ø¥Ø¯Ø§Ø±ÙŠ</option><option value="REMINDER">ØªØ°ÙƒÙŠØ±</option><option value="ACTION_REQUIRED">Ù…Ø·Ù„ÙˆØ¨ Ø¥Ø¬Ø±Ø§Ø¡</option><option value="DECISION">Ù‚Ø±Ø§Ø± Ø¥Ø¯Ø§Ø±ÙŠ</option></select></label>
          <label>Ø§Ù„Ø¹Ù†ÙˆØ§Ù†<input name="title" value="ØªØ°ÙƒÙŠØ± Ø¥Ø¯Ø§Ø±ÙŠ Ù…Ù‡Ù…" /></label>
          <label>Ø§Ù„Ø¬Ù…Ù‡ÙˆØ±<select name="audience"><option value="all">ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</option>${optionList(ref.departments.map((d) => ({ value: d.id, name: `Ù‚Ø³Ù…: ${d.name}` })))}${optionList(ref.branches.map((b) => ({ value: b.id, name: `ÙØ±Ø¹: ${b.name}` })))}</select></label>
          <label class="check-row"><input type="checkbox" name="playSound" checked /> ØªØ´ØºÙŠÙ„ ØªÙ†Ø¨ÙŠÙ‡ ØµÙˆØªÙŠ Ø¯Ø§Ø®Ù„ ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ù…ÙˆØ¸Ù Ø¹Ù†Ø¯ ÙˆØµÙˆÙ„ Ø§Ù„Ø±Ø³Ø§Ù„Ø©</label>
          <label class="span-2">Ø§Ù„Ù…Ø­ØªÙˆÙ‰<textarea name="body" placeholder="Ø§ÙƒØªØ¨ Ù†Øµ Ø§Ù„Ø¥Ø¹Ù„Ø§Ù† Ø£Ùˆ Ø§Ù„ØªØ°ÙƒÙŠØ± Ø£Ùˆ Ø§Ù„ØªØ¹Ù„ÙŠÙ…Ø§Øª"></textarea></label>
          <div class="form-actions"><button class="button primary">Ø¥Ø±Ø³Ø§Ù„ Ø¹Ø¨Ø± Ø§Ù„Ù‚Ù†Ø§Ø© Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©</button><button class="button ghost" type="button" id="enable-browser-notifications">ØªÙØ¹ÙŠÙ„ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØµÙØ­</button></div>
        </form>
      </article>
      <article class="panel span-7">
        <div class="panel-head"><div><h2>ØµÙ†Ø¯ÙˆÙ‚ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª</h2><p>${escapeHtml(unread)} Ø¥Ø´Ø¹Ø§Ø± ØºÙŠØ± Ù…Ù‚Ø±ÙˆØ¡</p></div></div>
        ${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„Ù…Ø­ØªÙˆÙ‰", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], items.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.body || "")}</td><td>${badge(item.isRead ? "READ" : "UNREAD")}</td><td>${date(item.createdAt)}</td><td>${item.isRead ? "" : `<button class="button ghost" data-read="${item.id}">ØªØ¹Ù„ÙŠÙ… ÙƒÙ…Ù‚Ø±ÙˆØ¡</button>`}</td></tr>`))}
      </article>
    </section>`,
    "Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª",
    "Ù‚Ù†Ø§Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ ÙˆØ§Ù„Ø¥Ø¹Ù„Ø§Ù†Ø§Øª ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„ØµÙˆØªÙŠØ©.",
  );
  app.querySelector("#announcement-form")?.addEventListener("submit", submitForm(endpoints.createAnnouncement, "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø¹Ù„Ø§Ù† Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ†."));
  app.querySelector("#enable-browser-notifications")?.addEventListener("click", async () => {
    if (!("Notification" in window)) return setMessage("", "Ø§Ù„Ù…ØªØµÙØ­ Ù„Ø§ ÙŠØ¯Ø¹Ù… Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø³Ø·Ø­ Ø§Ù„Ù…ÙƒØªØ¨.");
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await enableBrowserNotifications();
      setMessage("ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ø´ØªØ±Ø§Ùƒ Web Push Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…ØªØµÙØ­.", "");
    } else setMessage("", "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø³Ù…Ø§Ø­ Ø¨Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØµÙØ­.");
    render();
  });
  app.querySelectorAll("[data-read]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.markNotificationRead(button.dataset.read);
    render();
  }));
}


function renderRouteAccess() {
  const permissions = [...currentPermissions()].sort();
  const rows = Object.entries(routePermissions).map(([key, scopes]) => {
    const allowed = canRoute(key);
    const matched = hasFullAccess() ? ["*"] : scopes.filter((scope) => currentPermissions().has(scope));
    return `<tr>
      <td><strong>${escapeHtml(routeDisplayName(key))}</strong><small>${escapeHtml(key)}</small></td>
      <td><div class="scope-list">${scopes.length ? scopes.map((scope) => `<span>${escapeHtml(scope)}</span>`).join("") : `<span>Ø¹Ø§Ù…</span>`}</div></td>
      <td><div class="scope-list matched">${matched.length ? matched.map((scope) => `<span>${escapeHtml(scope)}</span>`).join("") : `<span>Ù„Ø§ ÙŠÙˆØ¬Ø¯ ØªØ·Ø§Ø¨Ù‚</span>`}</div></td>
      <td>${allowed ? badge("APPROVED") : badge("REJECTED")}</td>
    </tr>`;
  });
  shell(
    `<section class="grid">
      <article class="panel span-4">
        <h2>Ù…Ù„Ø®Øµ Ø¯ÙˆØ±Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ</h2>
        <div class="meta-grid">
          <span><strong>Ø§Ù„Ø¯ÙˆØ±</strong>${escapeHtml(roleLabel())}</span>
          <span><strong>Ù†ÙˆØ¹ Ø§Ù„ÙˆØµÙˆÙ„</strong>${hasFullAccess() ? "ØµÙ„Ø§Ø­ÙŠØ§Øª ÙƒØ§Ù…Ù„Ø©" : "Ø­Ø³Ø¨ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª"}</span>
          <span><strong>Ø¹Ø¯Ø¯ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ù…Ù‚Ø±ÙˆØ¡Ø©</strong>${escapeHtml(permissions.length)}</span>
        </div>
        <div class="scope-list all-scopes">${permissions.length ? permissions.map((scope) => `<span>${escapeHtml(scope)}</span>`).join("") : `<span>Ù„Ø§ ØªÙˆØ¬Ø¯ ØµÙ„Ø§Ø­ÙŠØ§Øª Ù…Ø¨Ø§Ø´Ø±Ø©Ø› Ø±Ø§Ø¬Ø¹ Ø±Ø¨Ø· Ø§Ù„Ø¯ÙˆØ± Ø¨Ø§Ù„Ù…Ù„Ù.</span>`}</div>
      </article>
      <article class="panel span-8">
        <div class="panel-head"><div><h2>Ø³Ø¨Ø¨ Ø¸Ù‡ÙˆØ± Ø£Ùˆ Ø§Ø®ØªÙØ§Ø¡ Ø§Ù„ØµÙØ­Ø§Øª</h2><p>Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø© ØªØ³Ø§Ø¹Ø¯Ùƒ Ø¹Ù„Ù‰ Ù…Ø¹Ø±ÙØ© Ø§Ù„Ù€ Route Ø§Ù„Ù…Ø·Ù„ÙˆØ¨ ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„ØªÙŠ ØªØ³Ù…Ø­ Ø¨ÙØªØ­Ù‡.</p></div></div>
        ${table(["Ø§Ù„ØµÙØ­Ø©", "Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©", "Ø§Ù„Ù…ØªØ·Ø§Ø¨Ù‚ Ù…Ø¹ Ø­Ø³Ø§Ø¨Ùƒ", "Ø§Ù„Ø­Ø§Ù„Ø©"], rows, "route-access-table")}
      </article>
    </section>`,
    "ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©",
    "ØªØ´Ø®ÙŠØµ ÙˆØ§Ø¶Ø­ Ù„Ù…Ø³Ø§Ø±Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø¯ÙˆØ± ÙˆØ§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø­Ø§Ù„ÙŠØ©.",
  );
}

async function renderSettings() {
  const [health, settingsPayload] = await Promise.all([endpoints.health(), endpoints.settings().then(unwrap)]);
  const settingsRows = Array.isArray(settingsPayload)
    ? settingsPayload
    : Object.entries(settingsPayload || {}).map(([key, value]) => ({ key, value: typeof value === "object" ? JSON.stringify(value) : value }));
  shell(
    `<section class="grid">
      <article class="panel span-6"><h2>Ø­Ø§Ù„Ø© Ø§Ù„ØªØ´ØºÙŠÙ„ Ø§Ù„Ø³Ø±ÙŠØ¹Ø©</h2>${table(["Ø§Ù„Ø¨Ù†Ø¯", "Ø§Ù„Ù‚ÙŠÙ…Ø©"], [`<tr><td>Ø§Ù„ØªØ·Ø¨ÙŠÙ‚</td><td>${escapeHtml(health.app || health.mode || "HR")}</td></tr>`, `<tr><td>Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª</td><td>${escapeHtml(health.database?.mode || health.database || "-")} / Ù…ØªØµÙ„Ø©</td></tr>`, `<tr><td>Ø§Ù„Ø¬Ù„Ø³Ø§Øª</td><td>${health.authEnforced ? "Ù…ÙØ¹Ù„Ø©" : "Ø§Ø®ØªÙŠØ§Ø±ÙŠØ©"}</td></tr>`, `<tr><td>Ø§Ù„Ø¥ØµØ¯Ø§Ø±</td><td>${escapeHtml(health.version || "-")}</td></tr>`])}</article>
      <article class="panel span-6 account-avatar-panel"><div class="panel-head"><div><h2>ØµÙˆØ±Ø© Ø­Ø³Ø§Ø¨ÙŠ</h2><p>ØªØ¹Ø¯ÙŠÙ„ Avatar Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ ÙˆÙŠØ¸Ù‡Ø± ÙÙŠ Ø£Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¸Ø§Ù… ÙˆÙ‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†.</p></div>${avatar(userAvatarSubject(), "large")}</div><div class="toolbar spaced"><input type="file" id="current-user-avatar" accept="image/png,image/jpeg,image/webp,image/gif" /><button class="button primary" id="save-current-avatar" type="button">Ø­ÙØ¸ ØµÙˆØ±Ø© Ø§Ù„Ø­Ø³Ø§Ø¨</button></div></article>
      <article class="panel span-6"><h2>ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª</h2><form id="settings-form" class="form-grid">${settingsRows.map((item) => `<label>${escapeHtml(item.key)}<input name="${escapeHtml(item.key)}" value="${escapeHtml(item.value)}" /></label>`).join("")}<div class="form-actions"><button class="button primary">Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª</button></div></form></article>
      <article class="panel span-6"><h2>ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±</h2><form id="password-form" class="form-grid"><label>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø­Ø§Ù„ÙŠØ©<input type="password" name="currentPassword" required /></label><label>ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©<input type="password" name="newPassword" minlength="8" required /></label><div class="form-actions"><button class="button primary">ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±</button></div></form></article>
      <article class="panel span-6"><h2>Ø§Ø®ØªØ¨Ø§Ø± GPS Ø³Ø±ÙŠØ¹</h2><p>Ø§Ø®ØªØ¨Ø§Ø± Ù…Ø¨Ø§Ø´Ø± Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ù„Ù…Ø¹Ø±ÙØ© Ø¯Ù‚Ø© Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙˆØ§Ù„Ù…Ø³Ø§ÙØ© Ù…Ù† Ø§Ù„Ù…Ø¬Ù…Ø¹.</p><button class="button ghost" type="button" data-settings-gps-test>Ø§Ø®ØªØ¨Ø§Ø± GPS Ø§Ù„Ø¢Ù†</button><div id="settings-gps-result" class="risk-box hidden"></div></article>
      <article class="panel span-12"><h2>Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø£Ù…Ø§Ù† Ø§Ù„Ù…Ù‚ØªØ±Ø­Ø©</h2>${table(["Ø§Ù„Ø³ÙŠØ§Ø³Ø©", "Ø§Ù„Ø­Ø§Ù„Ø©"], [["Ù‚ÙÙ„ Ø§Ù„Ø­Ø³Ø§Ø¨ Ø¨Ø¹Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø§Øª ÙØ§Ø´Ù„Ø©", "Ù…ÙØ¹Ù„ Ø¹Ù†Ø¯ ØªØ´ØºÙŠÙ„ Backend"], ["ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ©", "Ù…Ø¯Ø¹ÙˆÙ… Ø¹Ø¨Ø± mustChangePassword"], ["Ø³Ø¬Ù„ Ø¢Ø®Ø± IP ÙˆØ¬Ù‡Ø§Ø²", "Ù…Ø¯Ø¹ÙˆÙ… ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª"], ["Passkeys", "Ø¬Ø§Ù‡Ø² ÙƒÙ†Ù…ÙˆØ°Ø¬ Ø¨ÙŠØ§Ù†Ø§Øª ÙˆÙŠÙ†ØªØ¸Ø± HTTPS/Domain"]].map(([a,b]) => `<tr><td>${escapeHtml(a)}</td><td>${escapeHtml(b)}</td></tr>`))}</article>
    </section>`,
    "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª",
    "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø¹Ø§Ù…Ø© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªØ¹Ø¯ÙŠÙ„.",
  );
  app.querySelector("#save-current-avatar")?.addEventListener("click", async () => {
    try {
      const file = app.querySelector("#current-user-avatar")?.files?.[0];
      if (!file) return setMessage("", "Ø§Ø®ØªØ± ØµÙˆØ±Ø© Ø£ÙˆÙ„Ù‹Ø§.");
      const url = await endpoints.uploadAvatar(file);
      await endpoints.updateUser(state.user.id, { avatarUrl: url, name: state.user.name || state.user.fullName || state.user.email });
      state.user = { ...state.user, avatarUrl: url, photoUrl: url };
      setMessage("ØªÙ… ØªØ­Ø¯ÙŠØ« ØµÙˆØ±Ø© Ø§Ù„Ø­Ø³Ø§Ø¨.", "");
      render();
    } catch (error) {
      setMessage("", error.message);
      render();
    }
  });
  app.querySelector("[data-settings-gps-test]")?.addEventListener("click", async () => {
    const box = app.querySelector("#settings-gps-result");
    box.classList.remove("hidden", "danger-box");
    box.textContent = "Ø¬Ø§Ø±ÙŠ Ø§Ø®ØªØ¨Ø§Ø± GPS...";
    try {
      const current = await getBrowserLocation();
      const evaluation = await endpoints.evaluateGeofence(current);
      const ok = evaluation.allowed || evaluation.canRecord;
      box.classList.toggle("danger-box", !ok);
      box.innerHTML = `<strong>${ok ? "Ù…Ù‚Ø¨ÙˆÙ„" : "ØºÙŠØ± Ù…Ù‚Ø¨ÙˆÙ„"}</strong><p>${escapeHtml(evaluation.message || "")}</p><div class="meta-grid"><span>Ø§Ù„Ø¯Ù‚Ø©: ${formatMeters(current.accuracyMeters)}</span><span>Ø§Ù„Ù…Ø³Ø§ÙØ©: ${formatMeters(evaluation.distanceFromBranchMeters ?? evaluation.distanceMeters)}</span></div>`;
    } catch (error) {
      box.classList.add("danger-box");
      box.textContent = error.message;
    }
  });
  app.querySelector("#settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await endpoints.updateSettings(readForm(event.currentTarget));
    setMessage("ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª.", "");
    render();
  });
  app.querySelector("#password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await endpoints.changePassword(readForm(event.currentTarget));
    event.currentTarget.reset();
    setMessage("ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¨Ù†Ø¬Ø§Ø­.", "");
    render();
  });
}

async function renderComplexSettings() {
  const [address, settingsPayload] = await Promise.all([
    endpoints.attendanceAddress().then(unwrap).catch(() => ({})),
    endpoints.settings().then(unwrap).catch(() => []),
  ]);
  const settingsRows = Array.isArray(settingsPayload) ? settingsPayload : [];
  const getSetting = (key, fallback) => settingsRows.find((item) => item.key === key)?.value ?? fallback;
  const current = {
    name: address.branch?.name || address.name || getSetting("complex.name", "Ù…Ø¬Ù…Ø¹ Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø©"),
    address: cleanAddressText(address.address || address.branch?.address || getSetting("complex.address", "Ø´Ø§Ø±Ø¹ Ù…Ø²Ù„Ù‚Ø§Ù† Ø§Ù„Ø¹Ø±Ø¨, Manil Shihah, Abu El Numrus, Giza Governorate 12912")),
    latitude: address.latitude ?? getSetting("complex.latitude", "29.950738592862045"),
    longitude: address.longitude ?? getSetting("complex.longitude", "31.238094542328678"),
    radiusMeters: address.radiusMeters || getSetting("complex.radiusMeters", 300),
    maxAccuracyMeters: address.maxAccuracyMeters || getSetting("complex.maxAccuracyMeters", 500),
  };
  shell(
    `<section class="grid complex-settings-page">
      <article class="panel span-7">
        <div class="panel-head"><div><h2>Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹ Ø§Ù„ÙˆØ§Ø­Ø¯</h2><p>Ø¨Ø¯ÙŠÙ„ Ø¨Ø³ÙŠØ· Ù„ØµÙØ­Ø§Øª Ø§Ù„ÙØ±ÙˆØ¹ ÙˆØ§Ù„Ø£Ù‚Ø³Ø§Ù… Ù„Ø£Ù† Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠØ¹Ù…Ù„ Ø¹Ù„Ù‰ Ù…Ø¬Ù…Ø¹ ÙˆØ§Ø­Ø¯ ÙÙ‚Ø·.</p></div>${healthBadge(Boolean(current.latitude && current.longitude), current.latitude && current.longitude ? "Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ù…ÙˆØ¬ÙˆØ¯Ø©" : "Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ù†Ø§Ù‚ØµØ©")}</div>
        <form id="complex-settings-form" class="form-grid">
          <label>Ø§Ø³Ù… Ø§Ù„Ù…Ø¬Ù…Ø¹<input name="name" value="${escapeHtml(current.name)}" required /></label>
          <label>ÙˆØµÙ Ø§Ù„Ø¹Ù†ÙˆØ§Ù†<input name="address" value="${escapeHtml(current.address)}" required /></label>
          <label>Latitude<input name="latitude" type="number" step="0.00000000000001" value="${escapeHtml(current.latitude)}" required /></label>
          <label>Longitude<input name="longitude" type="number" step="0.00000000000001" value="${escapeHtml(current.longitude)}" required /></label>
          <label>Ù†Ø·Ø§Ù‚ Ø§Ù„Ø¨ØµÙ…Ø© Ø¨Ø§Ù„Ù…ØªØ±<input name="radiusMeters" type="number" min="50" max="2000" value="${escapeHtml(current.radiusMeters)}" required /></label>
          <label>Ø£Ù‚ØµÙ‰ Ø¯Ù‚Ø© GPS Ù…Ù‚Ø¨ÙˆÙ„Ø©<input name="maxAccuracyMeters" type="number" min="50" max="2000" value="${escapeHtml(current.maxAccuracyMeters)}" required /></label>
          <div class="form-actions wide"><button class="button primary" type="submit">Ø­ÙØ¸ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹</button><button class="button ghost" type="button" data-test-gps>Ø§Ø®ØªØ¨Ø§Ø± GPS Ø§Ù„Ø¢Ù†</button></div>
        </form>
      </article>
      <article class="panel span-5">
        <h2>Ø§Ø®ØªØ¨Ø§Ø± Ø³Ø±ÙŠØ¹ Ù„Ù„Ù…ÙˆÙ‚Ø¹</h2>
        <div id="gps-test-result" class="risk-box hidden"></div>
        <div class="address-card compact-address-card">
          <strong>${escapeHtml(current.name)}</strong>
          <p>${escapeHtml(current.address)}</p>
          <div class="meta-grid"><span>Lat: ${escapeHtml(current.latitude)}</span><span>Lng: ${escapeHtml(current.longitude)}</span><span>Ø§Ù„Ù†Ø·Ø§Ù‚: ${escapeHtml(current.radiusMeters)} Ù…ØªØ±</span><span>Ø§Ù„Ø¯Ù‚Ø©: ${escapeHtml(current.maxAccuracyMeters)} Ù…ØªØ±</span></div>
          <a class="button ghost map-open-btn" target="_blank" rel="noopener" href="https://maps.google.com/?q=${escapeHtml(current.latitude)},${escapeHtml(current.longitude)}">ÙØªØ­ Ø¹Ù„Ù‰ Google Maps</a>
        </div>
      </article>
    </section>`,
    "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹",
    "Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª ÙˆÙ†Ø·Ø§Ù‚ Ø§Ù„Ø¨ØµÙ…Ø© Ù„Ù„Ù…Ø¬Ù…Ø¹ Ø§Ù„ÙˆØ§Ø­Ø¯.",
  );
  const result = app.querySelector("#gps-test-result");
  const runGpsTest = async () => {
    result.classList.remove("hidden", "danger-box");
    result.textContent = "Ø¬Ø§Ø±ÙŠ Ù‚Ø±Ø§Ø¡Ø© GPS ÙˆØªÙ‚ÙŠÙŠÙ…Ù‡ Ø¹Ù„Ù‰ Ù†Ø·Ø§Ù‚ Ø§Ù„Ù…Ø¬Ù…Ø¹...";
    try {
      const currentLocation = await getBrowserLocation();
      const evaluation = await endpoints.evaluateGeofence(currentLocation);
      const ok = evaluation.allowed || evaluation.canRecord;
      result.classList.toggle("danger-box", !ok);
      result.innerHTML = `<strong>${ok ? "Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ù…Ù‚Ø¨ÙˆÙ„" : "Ø§Ù„Ù…ÙˆÙ‚Ø¹ ÙŠØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©"}</strong><p>${escapeHtml(evaluation.message || "")}</p><div class="meta-grid"><span>Ø¯Ù‚Ø© Ø¬Ù‡Ø§Ø²Ùƒ: ${formatMeters(currentLocation.accuracyMeters)}</span><span>Ø§Ù„Ù…Ø³Ø§ÙØ©: ${formatMeters(evaluation.distanceFromBranchMeters ?? evaluation.distanceMeters)}</span><span>Lat: ${escapeHtml(currentLocation.latitude || "-")}</span><span>Lng: ${escapeHtml(currentLocation.longitude || "-")}</span></div>`;
    } catch (error) {
      result.classList.add("danger-box");
      result.textContent = error.message;
    }
  };
  app.querySelector("[data-test-gps]")?.addEventListener("click", runGpsTest);
  app.querySelector("#complex-settings-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    await endpoints.updateComplexSettings(values);
    setMessage("ØªÙ… Ø­ÙØ¸ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹ ÙˆÙ†Ø·Ø§Ù‚ Ø§Ù„Ø¨ØµÙ…Ø©.", "");
    render();
  });
}

async function renderSystemDiagnostics() {
  const [diag, users, employees] = await Promise.all([
    endpoints.systemDiagnostics().catch((error) => ({ error: error.message, checks: [] })),
    endpoints.users().then(unwrap).catch(() => []),
    endpoints.employees().then(unwrap).catch(() => []),
  ]);
  const unlinkedUsers = (users || []).filter((user) => !user.employeeId);
  const usersByEmployee = new Set((users || []).map((user) => user.employeeId).filter(Boolean));
  const unlinkedEmployees = (employees || []).filter((employee) => !usersByEmployee.has(employee.id));
  shell(
    `<section class="grid diagnostics-page">
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ù…Ø±ÙƒØ² Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù†Ø¸Ø§Ù…</h2><p>ÙŠÙØ­Øµ Supabase/Auth/Storage ÙˆØ±Ø¨Ø· Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø¨Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¨ØµÙ…Ø© Ù…Ù† ØµÙØ­Ø© ÙˆØ§Ø­Ø¯Ø©.</p></div><div class="toolbar"><button class="button ghost" data-run-autolink>Ø±Ø¨Ø· Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø¨Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø­Ø³Ø¨ Ø§Ù„Ø¨Ø±ÙŠØ¯</button><button class="button primary" data-route="complex-settings">Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹</button></div></div>
      </article>
      <article class="panel span-7"><h2>Ø§Ù„ÙØ­ÙˆØµØ§Øª Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ©</h2>${table(["Ø§Ù„ÙØ­Øµ", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªÙØ§ØµÙŠÙ„"], (diag.checks || []).map((check) => `<tr><td>${escapeHtml(check.label)}</td><td>${healthBadge(check.ok, check.status || "")}</td><td>${escapeHtml(check.detail || "-")}</td></tr>`))}</article>
      <article class="panel span-5"><h2>Ù…Ø¤Ø´Ø±Ø§Øª Ø³Ø±ÙŠØ¹Ø©</h2>${table(["Ø§Ù„Ø¨Ù†Ø¯", "Ø§Ù„Ø¹Ø¯Ø¯"], [["Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†", users.length], ["Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†", employees.length], ["Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ† ØºÙŠØ± Ù…Ø±Ø¨ÙˆØ·ÙŠÙ†", unlinkedUsers.length], ["Ù…ÙˆØ¸ÙÙˆÙ† Ø¨Ù„Ø§ Ø­Ø³Ø§Ø¨", unlinkedEmployees.length]].map(([a,b]) => `<tr><td>${escapeHtml(a)}</td><td>${escapeHtml(b)}</td></tr>`))}</article>
      <article class="panel span-6"><h2>Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ† ØºÙŠØ± Ù…Ø±Ø¨ÙˆØ·ÙŠÙ†</h2>${table(["Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…", "Ø§Ù„Ø¨Ø±ÙŠØ¯"], unlinkedUsers.map((user) => `<tr><td>${escapeHtml(user.name || user.fullName || "-")}</td><td>${escapeHtml(user.email || "-")}</td></tr>`))}</article>
      <article class="panel span-6"><h2>Ù…ÙˆØ¸ÙÙˆÙ† Ø¨Ù„Ø§ Ø­Ø³Ø§Ø¨ Ø¯Ø®ÙˆÙ„</h2>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø¨Ø±ÙŠØ¯"], unlinkedEmployees.map((employee) => `<tr><td>${escapeHtml(employee.fullName || "-")}</td><td>${escapeHtml(employee.email || "-")}</td></tr>`))}</article>
    </section>`,
    "Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ù†Ø¸Ø§Ù…",
    "ÙØ­Øµ Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ù†Ø¸Ø§Ù… Ù‚Ø¨Ù„ Ø§Ù„ØªØ¬Ø±Ø¨Ø© Ø£Ùˆ Ø§Ù„ØªØ³Ù„ÙŠÙ….",
  );
  app.querySelector("[data-run-autolink]")?.addEventListener("click", async () => {
    try {
      const result = await endpoints.autoLinkUsersByEmail();
      setMessage(`ØªÙ… Ø§Ù„Ø±Ø¨Ø· Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ: ${result.linked || 0} Ø³Ø¬Ù„.`, "");
      render();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø§Ù„Ø±Ø¨Ø· Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ.");
      render();
    }
  });
}

async function renderHealth() {
  const health = await endpoints.health();
  const readiness = health.readiness || { score: 0, grade: "-", parts: [] };
  shell(
    `<section class="grid health-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ù…Ø±ÙƒØ² ÙØ­Øµ Ø§Ù„Ù†Ø¸Ø§Ù…</h2><p>Ù†ØªÙŠØ¬Ø© Ø§Ù„Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ø¹Ø§Ù…Ø© ÙˆÙØ­ÙˆØµØ§Øª Ø§Ù„ØªØ´ØºÙŠÙ„ Ù‚Ø¨Ù„ Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯.</p></div><div class="score-ring"><strong>${escapeHtml(readiness.score || 0)}%</strong><span>${escapeHtml(readiness.grade || "-")}</span></div></div><div class="toolbar"><button class="button ghost" id="export-health-json">ØªØµØ¯ÙŠØ± ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙØ­Øµ JSON</button><button class="button ghost" data-route="system-diagnostics">ØªØ´Ø®ÙŠØµ Ø£Ø¹Ù…Ù‚</button></div></article>
      <article class="panel span-5"><h2>Ù…Ù„Ø®Øµ Ø§Ù„Ø­Ø§Ù„Ø©</h2>${table(["Ø§Ù„Ø¨Ù†Ø¯", "Ø§Ù„Ù‚ÙŠÙ…Ø©"], Object.entries(health.counts || {}).map(([key, value]) => `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(value)}</td></tr>`))}</article>
      <article class="panel span-7"><h2>Ø§Ù„ÙØ­ÙˆØµØ§Øª</h2>${table(["Ø§Ù„ÙØ­Øµ", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªÙØ§ØµÙŠÙ„"], (health.checks || []).map((check) => `<tr><td>${escapeHtml(check.label)}</td><td>${check.ok ? badge("APPROVED") : badge(check.status || "PENDING")}</td><td>${escapeHtml(check.detail || "-")}</td></tr>`))}</article>
      <article class="panel span-12"><h2>Ø®Ø·Ø© Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø³Ø±ÙŠØ¹Ø©</h2><div class="readiness-grid">${safeList(readiness.parts).filter((part) => !part.ok).map((part) => `<div class="readiness-item warn"><strong>${escapeHtml(part.label)}</strong><span>${escapeHtml(part.detail || "")}</span><small>Ø§Ø¨Ø¯Ø£ Ù…Ù† ØµÙØ­Ø© ${part.key === "location" ? "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø¬Ù…Ø¹" : part.key === "linked" ? "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†" : part.key === "workflow" ? "Ù…Ø±ÙƒØ² Ø§Ù„Ø·Ù„Ø¨Ø§Øª" : "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª"}</small></div>`).join("") || `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø´Ø§ÙƒÙ„ Ø¸Ø§Ù‡Ø±Ø© ÙÙŠ Ø§Ù„ÙØ­Øµ Ø§Ù„Ù…Ø­Ù„ÙŠ.</div>`}</div></article>
    </section>`,
    "Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù…",
    "System Health Ù„Ù„ØªØ£ÙƒØ¯ Ù…Ù† Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„ØªØ´ØºÙŠÙ„.",
  );
  app.querySelector("#export-health-json")?.addEventListener("click", () => downloadFile("system-health-report.json", JSON.stringify(health, null, 2), "application/json;charset=utf-8"));
}

async function renderBackup() {
  const backup = await endpoints.backup().catch(() => ({}));
  const snapshots = backup.systemBackups || [];
  shell(
    `<section class="grid backup-page">
      <article class="panel span-3"><h2>Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©</h2><p>ØªØµØ¯ÙŠØ± ÙƒÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨ØµÙŠØºØ© JSON.</p><button class="button primary" id="download-backup">ØªØ­Ù…ÙŠÙ„ Backup</button></article>
      <article class="panel span-3"><h2>Snapshot Ø¯Ø§Ø®Ù„ÙŠ</h2><p>Ø­ÙØ¸ Ø¢Ø®Ø± 10 Ù†Ø³Ø® Ø¯Ø§Ø®Ù„ Ø§Ù„ØªØ®Ø²ÙŠÙ† Ø§Ù„Ù…Ø­Ù„ÙŠ Ù„Ù„Ø§Ø®ØªØ¨Ø§Ø± Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ ÙÙ‚Ø·.</p><button class="button" id="save-snapshot">Ø­ÙØ¸ Snapshot</button></article>
      <article class="panel span-3"><h2>Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Backup</h2><input type="file" id="backup-file" accept="application/json" /><button class="button" id="restore-backup">Ø§Ø³ØªØ±Ø¬Ø§Ø¹</button></article>
      <article class="panel span-3"><h2>Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù…ÙˆØ¸ÙÙŠÙ†</h2><p>Ø§Ø±ÙØ¹ JSON Array Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø£Ùˆ CSV Ø¨Ø³ÙŠØ·.</p><input type="file" id="employees-import" accept=".json,.csv,text/csv,application/json" /><button class="button" id="import-employees">Ø§Ø³ØªÙŠØ±Ø§Ø¯</button></article>
      <article class="panel span-8"><h2>Ø¢Ø®Ø± Snapshots</h2>${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†", "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†", "Ø§Ù„Ø­Ø¶ÙˆØ±", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], snapshots.map((item) => `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.counts?.employees || 0)}</td><td>${escapeHtml(item.counts?.users || 0)}</td><td>${escapeHtml(item.counts?.attendance || 0)}</td><td>${date(item.createdAt)}</td></tr>`))}</article>
      <article class="panel span-4"><h2>Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø·</h2><p>ØªØ±Ø¬Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£ÙˆÙ„ÙŠØ© Ù„Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ù…Ø­Ù„ÙŠØ©.</p><button class="button danger" id="reset-data">Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£ÙˆÙ„ÙŠØ©</button></article>
    </section>`,
    "Ù†Ø³Ø® ÙˆØ§Ø³ØªÙŠØ±Ø§Ø¯",
    "Backup/Restore Ùˆ Import Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ù…Ø¹ Snapshot Ø¯Ø§Ø®Ù„ÙŠ.",
  );
  app.querySelector("#download-backup").addEventListener("click", async () => downloadFile("hr-system-backup.json", JSON.stringify(await endpoints.backup(), null, 2), "application/json;charset=utf-8"));
  app.querySelector("#save-snapshot").addEventListener("click", async () => { await endpoints.saveBackupSnapshot({}); setMessage("ØªÙ… Ø­ÙØ¸ Snapshot Ø¯Ø§Ø®Ù„ÙŠ.", ""); render(); });
  app.querySelector("#restore-backup").addEventListener("click", async () => {
    const file = app.querySelector("#backup-file").files?.[0];
    if (!file) return setMessage("", "Ø§Ø®ØªØ± Ù…Ù„Ù Backup Ø£ÙˆÙ„Ù‹Ø§.");
    const db = JSON.parse(await file.text());
    if (!db || typeof db !== "object" || !Array.isArray(db.employees)) return setMessage("", "Ù…Ù„Ù Ø§Ù„Ù†Ø³Ø®Ø© ØºÙŠØ± ØµØ§Ù„Ø­ Ø£Ùˆ Ù„Ø§ ÙŠØ­ØªÙˆÙŠ Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.");
    await endpoints.restoreBackup(db);
    setMessage("ØªÙ… Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©.", "");
    render();
  });
  app.querySelector("#import-employees").addEventListener("click", async () => {
    const file = app.querySelector("#employees-import").files?.[0];
    if (!file) return setMessage("", "Ø§Ø®ØªØ± Ù…Ù„Ù Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø£ÙˆÙ„Ù‹Ø§.");
    const text = await file.text();
    let rows;
    if (file.name.endsWith(".json")) rows = JSON.parse(text);
    else {
      const [head, ...lines] = text.split(/\r?\n/).filter(Boolean);
      const keys = head.split(",").map((x) => x.replaceAll('"', "").trim());
      rows = lines.map((line) => Object.fromEntries(line.split(",").map((cell, index) => [keys[index], cell.replaceAll('"', "").trim()])));
    }
    const result = await endpoints.importEmployees(rows);
    setMessage(`ØªÙ… Ø§Ø³ØªÙŠØ±Ø§Ø¯ ${result.created} Ù…ÙˆØ¸Ù.`, "");
    render();
  });
  app.querySelector("#reset-data").addEventListener("click", async () => {
    if (!await confirmAction({ title: "Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª", message: "Ø³ÙŠØªÙ… Ø­Ø°Ù Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ØªØµÙØ­ Ø§Ù„Ù…Ø­Ù„ÙŠØ© ÙˆØ§Ø³ØªØ±Ø¬Ø§Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£ÙˆÙ„ÙŠØ©.", confirmLabel: "Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø¶Ø¨Ø·", danger: true })) return;
    await endpoints.reset();
    setMessage("ØªÙ… Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£ÙˆÙ„ÙŠØ©.", "");
    render();
  });
}



async function renderPasswordVault() {
  const rows = await endpoints.passwordVault().then(unwrap);
  shell(
    `<section class="grid">
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ø®Ø²Ù†Ø© ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ©</h2><p>Ù…Ø®ØµØµØ© Ù„Ù„ØªÙ‚Ù†ÙŠ/Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ù„ÙŠØ§. ÙÙŠ Supabase Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ù„Ø§ ÙŠÙ…ÙƒÙ† Ù‚Ø±Ø§Ø¡Ø© ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø£ØµÙ„ÙŠØ© Ø¨Ø¹Ø¯ Ø¥Ù†Ø´Ø§Ø¦Ù‡Ø§Ø› Ø§Ù„Ù…ØªØ§Ø­ Ø£Ù…Ù†ÙŠÙ‹Ø§ Ù‡Ùˆ Ø¥ØµØ¯Ø§Ø± ÙƒÙ„Ù…Ø© Ù…Ø¤Ù‚ØªØ© Ø¬Ø¯ÙŠØ¯Ø© ÙˆØ¥Ø¬Ø¨Ø§Ø± Ø§Ù„Ù…ÙˆØ¸Ù Ø¹Ù„Ù‰ ØªØºÙŠÙŠØ±Ù‡Ø§.</p></div></div>
        <div class="message warning">Ù„Ø§ ØªØ´Ø§Ø±Ùƒ Ù‡Ø°Ù‡ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø¥Ù„Ø§ Ù…Ø¹ ØµØ§Ø­Ø¨ Ø§Ù„Ø­Ø³Ø§Ø¨. Ø§Ù„Ø£ÙØ¶Ù„ Ø¯Ø§Ø¦Ù…Ù‹Ø§ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ† ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù…Ø¤Ù‚ØªØ© Ø¨Ø¯Ù„ Ø§Ù„Ø§Ø­ØªÙØ§Ø¸ Ø¨ÙƒÙ„Ù…Ø§Øª Ù…Ø±ÙˆØ± Ø¯Ø§Ø¦Ù…Ø©.</div>
      </article>
      <article class="panel span-12">
        ${table(["Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…", "Ø§Ù„Ø¨Ø±ÙŠØ¯", "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ©", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], rows.map((user) => `<tr>
          <td class="person-cell">${avatar(user.employee || user, "tiny")}<span>${escapeHtml(user.name || user.fullName || "-")}<small>${escapeHtml(user.employee?.jobTitle || "")}</small></span></td>
          <td>${escapeHtml(user.email || "-")}</td>
          <td><code class="password-chip">${escapeHtml(user.password || "ØºÙŠØ± Ù…ØªØ§Ø­Ø©")}</code></td>
          <td>${badge(user.mustChangePassword ? "INVITED" : user.status || "ACTIVE")}</td>
          <td><button class="button ghost" data-copy-password="${escapeHtml(user.password || "")}">Ù†Ø³Ø®</button><button class="button danger ghost" data-reset-password="${escapeHtml(user.id)}">Ø¥ØµØ¯Ø§Ø± ÙƒÙ„Ù…Ø© Ø¬Ø¯ÙŠØ¯Ø©</button></td>
        </tr>`))}
      </article>
    </section>`,
    "Ø®Ø²Ù†Ø© ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ±",
    "Ø¹Ø±Ø¶ ÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ© ÙˆØ¥Ø¹Ø§Ø¯Ø© ØªØ¹ÙŠÙŠÙ†Ù‡Ø§ Ø¨Ø´ÙƒÙ„ Ø¢Ù…Ù†."
  );
  app.querySelectorAll("[data-copy-password]").forEach((button) => button.addEventListener("click", async () => {
    await navigator.clipboard?.writeText(button.dataset.copyPassword || "");
    setMessage("ØªÙ… Ù†Ø³Ø® ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ù…Ø¤Ù‚ØªØ©.", "");
    render();
  }));
  app.querySelectorAll("[data-reset-password]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmAction({ title: "Ø¥ØµØ¯Ø§Ø± ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ø¬Ø¯ÙŠØ¯Ø©", message: "Ø³ÙŠØªÙ… Ø¥Ù†Ø´Ø§Ø¡ ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± Ù…Ø¤Ù‚ØªØ© Ø¬Ø¯ÙŠØ¯Ø© ÙˆØ¥Ø¬Ø¨Ø§Ø± Ø§Ù„Ù…ÙˆØ¸Ù Ø¹Ù„Ù‰ ØªØºÙŠÙŠØ±Ù‡Ø§ Ø¨Ø¹Ø¯ Ø§Ù„Ø¯Ø®ÙˆÙ„.", confirmLabel: "Ø¥ØµØ¯Ø§Ø±", danger: true })) return;
    const result = await endpoints.resetUserPassword(button.dataset.resetPassword);
    setMessage(`ØªÙ… Ø¥ØµØ¯Ø§Ø± ÙƒÙ„Ù…Ø© Ù…Ø¤Ù‚ØªØ© Ø¬Ø¯ÙŠØ¯Ø©: ${result.temporaryPassword}`, "");
    render();
  }));
}


async function renderDisputes() {
  const payload = unwrap(await endpoints.disputes());
  const ref = await referenceData();
  const employees = ref.employees || [];
  const cases = Array.isArray(payload) ? payload : (payload.cases || []);
  const committee = Array.isArray(payload) ? { members: ["Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø«", "Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù†Ù", "Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø£ÙˆÙ„", "Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ"], mandate: "Ø£ÙŠ Ù…Ø´ÙƒÙ„Ø© ØªÙØ±ÙØ¹ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¥Ù„Ù‰ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø« ÙˆÙ…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù†Ù ÙˆÙ…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø£ÙˆÙ„ ÙˆØ§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙˆØ§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØŒ Ø«Ù… ÙŠØªÙ… Ø§Ù„ØªÙ†Ø³ÙŠÙ‚ ÙˆØ§Ù„Ø­Ù„ Ø£Ùˆ Ø§Ù„ØªØµØ¹ÙŠØ¯ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø¹Ø¨Ø± Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ." } : (payload.committee || {});
  const currentEmployeeId = state.user?.employeeId || state.user?.employee?.id || "";
  const employeeOptions = optionList(employees.map((employee) => ({ id: employee.id, name: `${employee.fullName}${employee.jobTitle ? " â€” " + employee.jobTitle : ""}` })), currentEmployeeId, "Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ¸Ù");
  shell(
    `<section class="grid disputes-page">
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª</h2><p>${escapeHtml(committee.mandate || "Ø£ÙŠ Ù…Ø´ÙƒÙ„Ø© ØªÙØ±ÙØ¹ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§ Ø¥Ù„Ù‰ Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù„Ø« ÙˆÙ…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø«Ø§Ù†Ù ÙˆÙ…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø± Ø£ÙˆÙ„ ÙˆØ§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙˆØ§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØŒ Ø«Ù… ÙŠØªÙ… Ø§Ù„ØªÙ†Ø³ÙŠÙ‚ ÙˆØ§Ù„Ø­Ù„ Ø£Ùˆ Ø§Ù„ØªØµØ¹ÙŠØ¯ Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø¹Ø¨Ø± Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ.")}</p></div></div>
        <div class="chips">${(committee.members || ["Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª"]).map((member) => `<span class="chip">${escapeHtml(member)}</span>`).join("")}</div>
      </article>
      <article class="panel span-4">
        <h2>Ø·Ù„Ø¨ Ø´ÙƒÙˆÙ‰ Ø¬Ø¯ÙŠØ¯</h2>
        <form id="dispute-form" class="form-grid compact-form">
          <label>Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø´ÙƒÙˆÙ‰<input name="title" required placeholder="Ù…Ø«Ø§Ù„: Ù…Ø´ÙƒÙ„Ø© Ø¥Ø¯Ø§Ø±ÙŠØ© Ø£Ùˆ Ø®Ù„Ø§Ù Ø¹Ù…Ù„" /></label>
          <label>ØµØ§Ø­Ø¨ Ø§Ù„Ø´ÙƒÙˆÙ‰<select name="employeeId" required>${employeeOptions}</select></label>
          <input type="hidden" name="status" value="IN_REVIEW" />
          <input type="hidden" name="severity" value="MEDIUM" />
          <label class="span-2">Ø³Ø¨Ø¨ Ø§Ù„Ø´ÙƒÙˆÙ‰ ÙˆØ§Ù„ØªÙØ§ØµÙŠÙ„<textarea name="description" required placeholder="Ø§ÙƒØªØ¨ Ø§Ù„Ø³Ø¨Ø¨ ÙˆØ§Ù„ØªÙØ§ØµÙŠÙ„ Ø§Ù„ØªÙŠ ØªØ±ÙŠØ¯ Ø¹Ø±Ø¶Ù‡Ø§ Ø¹Ù„Ù‰ Ø§Ù„Ù„Ø¬Ù†Ø©"></textarea></label>
          <div class="form-actions"><button class="button primary" type="submit">Ø±ÙØ¹ Ø§Ù„Ø´ÙƒÙˆÙ‰ Ù„Ù„Ø¬Ù†Ø©</button></div>
        </form>
      </article>
      <article class="panel span-8">
        <h2>Ø³Ø¬Ù„ Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰</h2>
        ${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "ØµØ§Ø­Ø¨ Ø§Ù„Ø´ÙƒÙˆÙ‰", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ù‚Ø±Ø§Ø± Ø§Ù„Ù„Ø¬Ù†Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], cases.map((item) => `<tr>
          <td>${escapeHtml(item.title || "-")}</td>
          <td>${escapeHtml(item.employee?.fullName || employees.find((employee) => employee.id === item.employeeId)?.fullName || "-")}</td>
          <td>${badge(item.status || "IN_REVIEW")}</td>
          <td>${escapeHtml(item.committeeDecision || item.resolution || "Ù„Ù… ÙŠØµØ¯Ø± Ù‚Ø±Ø§Ø± Ø¨Ø¹Ø¯")}</td>
          <td><button class="button ghost" data-dispute="${escapeHtml(item.id)}" data-status="RESOLVED">ØªÙ… Ø§Ù„Ø­Ù„</button><button class="button danger ghost" data-dispute="${escapeHtml(item.id)}" data-status="ESCALATED">Ø±ÙØ¹ Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©</button></td>
        </tr>`))}
      </article>
    </section>`,
    "Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆÙØ¶ Ø§Ù„Ø®Ù„Ø§ÙØ§Øª",
    "ØªØ³Ø¬ÙŠÙ„ Ø´ÙƒÙˆÙ‰ Ø¨Ø³Ø¨Ø¨ ÙˆØ§Ø¶Ø­ Ø«Ù… Ø¥Ø­Ø§Ù„ØªÙ‡Ø§ Ù„Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª.",
  );
  app.querySelector("#dispute-form").addEventListener("submit", submitForm(endpoints.createDispute, "ØªÙ… Ø±ÙØ¹ Ø§Ù„Ø´ÙƒÙˆÙ‰ Ø¥Ù„Ù‰ Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª."));
  app.querySelectorAll("[data-dispute]").forEach((button) => button.addEventListener("click", async () => {
    const status = button.dataset.status;
    const committeeDecision = status === "RESOLVED" ? "ØªÙ… Ø­Ù„ Ø§Ù„Ø´ÙƒÙˆÙ‰ Ø¨ÙˆØ§Ø³Ø·Ø© Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ø®Ù„Ø§ÙØ§Øª." : "ØªÙ… Ø±ÙØ¹ Ø§Ù„Ø´ÙƒÙˆÙ‰ Ù„Ù„Ø¥Ø¯Ø§Ø±Ø© Ù„Ø§Ø³ØªÙƒÙ…Ø§Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±.";
    await endpoints.updateDispute(button.dataset.dispute, { status, committeeDecision, escalatedToExecutive: status === "ESCALATED" });
    setMessage(status === "RESOLVED" ? "ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ø´ÙƒÙˆÙ‰ Ø¨Ù‚Ø±Ø§Ø± Ø§Ù„Ù„Ø¬Ù†Ø©." : "ØªÙ… Ø±ÙØ¹ Ø§Ù„Ø´ÙƒÙˆÙ‰ Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©.", "");
    render();
  }));
}

async function renderRealtime() {
  const snapshot = await endpoints.realtimeSnapshot();
  const data = snapshot.dashboard || snapshot;
  const locations = snapshot.locations || [];
  shell(
    `<section class="grid">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ù„ÙˆØ­Ø© Ù…Ø¨Ø§Ø´Ø±Ø© Real-time</h2><p>ØªØ¹Ù…Ù„ Ø¹Ø¨Ø± Supabase Realtime Ø¹Ù†Ø¯ ØªÙØ¹ÙŠÙ„ SupabaseØŒ ÙˆÙ…Ø¹ Live Server ØªØ³ØªØ®Ø¯Ù… Snapshot Ù…Ø­Ù„ÙŠ.</p></div><strong id="live-state">${escapeHtml(snapshot.realtime?.transport || "snapshot")}</strong></div><div class="toolbar"><button class="button ghost" id="connect-live">Ø§ØªØµØ§Ù„ Realtime</button><button class="button ghost" data-route="dashboard">Ø§Ù„Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯</button></div></article>
      <article class="panel span-7"><h2>Ø®Ø±ÙŠØ·Ø© Ø­Ø±Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</h2><div class="heatmap-card">${(locations || []).map((loc, index) => `<span class="heat-dot" style="--x:${12 + (index * 17) % 76}%;--y:${18 + (index * 29) % 66}%" title="${escapeHtml(loc.employee?.fullName || loc.employeeId)}"></span>`).join("") || `<div class="empty-box">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ÙˆØ§Ù‚Ø¹ Ø­Ø¯ÙŠØ«Ø© Ø¨Ø¹Ø¯.</div>`}</div></article>
      <article class="panel span-5"><h2>KPIs Ù„Ø­Ø¸ÙŠØ©</h2>${table(["Ø§Ù„Ù…Ø¤Ø´Ø±", "Ø§Ù„Ù‚ÙŠÙ…Ø©"], [["Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†", data.cards?.employees ?? "-"], ["Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…", data.cards?.presentToday ?? "-"], ["Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", data.cards?.pendingRequests ?? "-"], ["Ø¥Ø¬Ø§Ø²Ø§Øª", data.cards?.leavesToday ?? "-"]].map(([a,b]) => `<tr><td>${escapeHtml(a)}</td><td><strong>${escapeHtml(b)}</strong></td></tr>`))}</article>
    </section>`,
    "Ù„ÙˆØ­Ø© Live",
    "Ù…ØªØ§Ø¨Ø¹Ø© Ù„Ø­Ø¸ÙŠØ© Ù„Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ù…ÙˆØ§Ù‚Ø¹ ÙˆØ§Ù„Ù…Ø¤Ø´Ø±Ø§Øª.",
  );
  app.querySelector("#connect-live")?.addEventListener("click", () => {
    if (!("WebSocket" in window)) return setMessage("", "Ø§Ù„Ù…ØªØµÙØ­ Ù„Ø§ ÙŠØ¯Ø¹Ù… WebSocket.");
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}/ws/live`);
    ws.onopen = () => { app.querySelector("#live-state").textContent = "Ù…ØªØµÙ„"; setMessage("ØªÙ… Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø§Ù„Ù„ÙˆØ­Ø© Ø§Ù„Ù„Ø­Ø¸ÙŠØ©.", ""); };
    ws.onerror = () => setMessage("", "ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø§Ù„Ù„Ø­Ø¸ÙŠ. ØªØ£ÙƒØ¯ Ù…Ù† ØªÙØ¹ÙŠÙ„ Supabase Realtime Ø£Ùˆ ØªØ´ØºÙŠÙ„ Ø§Ù„Ø®Ø§Ø¯Ù… Ø§Ù„Ù…Ø­Ù„ÙŠ.");
    ws.onmessage = (event) => { try { const msg = JSON.parse(event.data); if (msg.type === "dashboard.snapshot") app.querySelector("#live-state").textContent = `Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ« ${new Date().toLocaleTimeString("ar-EG")}`; } catch {} };
  });
}

async function renderAdvancedReports() {
  const employees = await endpoints.employees().then(unwrap);
  const events = await endpoints.attendanceEvents().then(unwrap);
  const fields = ["employee", "type", "date", "source", "geofence", "notes"];
  shell(`<section class="grid"><article class="panel span-4"><h2>Ù…Ù†Ø´Ø¦ Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±</h2><p>Ø§Ø®ØªØ± Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø© Ø«Ù… ØµØ¯Ù‘Ø± Ø§Ù„ØªÙ‚Ø±ÙŠØ±.</p><form id="report-builder" class="form-grid">${fields.map((field) => `<label class="check-row"><input type="checkbox" name="fields" value="${field}" checked /> ${field}</label>`).join("")}<label>Ø¥Ø±Ø³Ø§Ù„ Ù…Ø¬Ø¯ÙˆÙ„ Ø¥Ù„Ù‰<input name="email" type="email" placeholder="manager@example.com" /></label><div class="form-actions"><button class="button primary">ØªØ¬Ù‡ÙŠØ² CSV</button></div></form></article><article class="panel span-8"><h2>ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙØ±ÙˆÙ‚Ø§Øª</h2>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø³Ø§Ø¹Ø§Øª ÙØ¹Ù„ÙŠØ©", "Ø³Ø§Ø¹Ø§Øª Ù…Ø®Ø·Ø·Ø©", "Ø§Ù„ÙØ±Ù‚"], employees.map((employee) => { const empEvents = events.filter((e) => e.employeeId === employee.id); const actual = Math.round(empEvents.length * 4 * 10) / 10; const planned = 8; return `<tr><td>${escapeHtml(employee.fullName)}</td><td>${actual}</td><td>${planned}</td><td>${actual - planned}</td></tr>`; }))}</article></section>`, "Ù…Ù†Ø´Ø¦ Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±", "ØªØµØ¯ÙŠØ± Ø°ÙƒÙŠ CSV/Excel/PDF ÙˆØ¬Ø¯ÙˆÙ„Ø© Ø¨Ø±ÙŠØ¯ÙŠØ© Ù…Ø¨Ø¯Ø¦ÙŠØ©.");
  app.querySelector("#report-builder").addEventListener("submit", async (event) => {
    event.preventDefault();
    const selected = [...new FormData(event.currentTarget).getAll("fields")];
    const rows = events.map((ev) => selected.map((field) => ({ employee: ev.employee?.fullName || ev.employeeId, type: statusLabel(ev.type), date: date(ev.eventAt), source: ev.source || "-", geofence: statusLabel(ev.geofenceStatus), notes: ev.notes || "" })[field]));
    downloadFile("custom-attendance-report.csv", `\ufeff${toCsv([selected, ...rows])}`, "text/csv;charset=utf-8");
  });
}

async function renderAiAnalytics() {
  const payload = await endpoints.aiAnalytics();
  const rows = payload.rows || [];
  shell(`<section class="grid"><article class="panel span-12 accent-panel"><h2>ØªØ­Ù„ÙŠÙ„Ø§Øª AI</h2><p>${escapeHtml(payload.note || "ØªØ­Ù„ÙŠÙ„ ØªÙ‚Ø¯ÙŠØ±ÙŠ ÙŠØ³Ø§Ø¹Ø¯ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆÙ„Ø§ ÙŠØªØ®Ø° Ù‚Ø±Ø§Ø±Ø§Øª ØªÙ„Ù‚Ø§Ø¦ÙŠØ©.")}</p></article><article class="panel span-12">${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø¯Ø±Ø¬Ø© Ø®Ø·Ø± Ø§Ù„ØºÙŠØ§Ø¨", "ØºÙŠØ§Ø¨", "ØªØ£Ø®ÙŠØ± Ø¨Ø§Ù„Ø¯Ù‚Ø§Ø¦Ù‚", "Ù…Ù„Ø§Ø­Ø¸Ø©"], rows.map((row) => `<tr><td class="person-cell">${avatar(row.employee, "tiny")}<span>${escapeHtml(row.employee?.fullName || row.employeeId)}</span></td><td><strong>${escapeHtml(row.riskScore)}</strong></td><td>${escapeHtml(row.absences)}</td><td>${escapeHtml(row.lateMinutes)}</td><td>${escapeHtml(row.productivityHint)}</td></tr>`))}</article></section>`, "ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ", "ØªÙˆÙ‚Ø¹Ø§Øª ØºÙŠØ§Ø¨ ÙˆØ¥Ù†ØªØ§Ø¬ÙŠØ© Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ø­Ø¶ÙˆØ±.");
}

async function renderIntegrations() {
  const items = await endpoints.integrations().then(unwrap);
  shell(`<section class="grid"><article class="panel span-7"><h2>Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª</h2>${table(["Ø§Ù„ØªÙƒØ§Ù…Ù„", "Ø§Ù„Ù…Ø²ÙˆÙ‘Ø¯", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"], items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.provider)}</td><td>${badge(item.status)}</td><td>${escapeHtml(item.notes || "")}</td></tr>`))}</article><article class="panel span-5"><h2>WebAuthn / Passkeys</h2><p>ÙŠØ³Ù…Ø­ Ø¨Ø§Ø³ØªØ®Ø¯Ø§Ù… Touch ID / Face ID / Windows Hello / YubiKey Ø¹Ù„Ù‰ localhost Ø£Ùˆ HTTPS.</p><div class="toolbar"><button class="button primary" id="register-passkey">ØªØ³Ø¬ÙŠÙ„ Passkey Ù„Ù‡Ø°Ø§ Ø§Ù„Ø¬Ù‡Ø§Ø²</button><button class="button ghost" id="enable-push">ØªÙØ¹ÙŠÙ„ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…ØªØµÙØ­</button></div><div class="message compact">Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠØ© ÙˆØ§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª ØªØ­ØªØ§Ø¬ API Key Ø£Ùˆ Ø¬Ù‡Ø§Ø² ÙØ¹Ù„ÙŠ.</div></article></section>`, "Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª ÙˆØ§Ù„Ø¨ÙŠÙˆÙ…ØªØ±ÙŠØ©", "Ø¥Ø¹Ø¯Ø§Ø¯ WebAuthn ÙˆPush ÙˆØ§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª.");
  app.querySelector("#register-passkey")?.addEventListener("click", async () => { try { await registerBrowserPasskey(); setMessage("ØªÙ… ØªØ³Ø¬ÙŠÙ„ Passkey Ù„Ù„Ø¬Ù‡Ø§Ø² Ø§Ù„Ø­Ø§Ù„ÙŠ.", ""); render(); } catch (error) { setMessage("", error.message); } });
  app.querySelector("#enable-push")?.addEventListener("click", async () => { try { await enableBrowserNotifications(); setMessage("ØªÙ… ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª.", ""); } catch (error) { setMessage("", error.message); } });
}

async function renderAccessControl() {
  const [events, employees] = await Promise.all([endpoints.accessControlEvents().then(unwrap), endpoints.employees().then(unwrap)]);
  const employeeOptions = optionList(employees.map((employee) => ({ id: employee.id, name: employee.fullName })));
  shell(`<section class="grid"><article class="panel span-4"><h2>Ù…Ø­Ø§ÙƒØ§Ø© Ø¨ÙˆØ§Ø¨Ø©/Ø¨Ø§Ø¨ Ø°ÙƒÙŠ</h2><form id="access-form" class="form-grid"><label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId">${employeeOptions}</select></label><label>Ø§Ù„Ø¬Ù‡Ø§Ø²<input name="deviceId" value="main-gate" /></label><label>Ø§Ù„Ø§ØªØ¬Ø§Ù‡<select name="direction"><option value="ENTRY">Ø¯Ø®ÙˆÙ„</option><option value="EXIT">Ø®Ø±ÙˆØ¬</option></select></label><label>Ø§Ù„Ù‚Ø±Ø§Ø±<select name="decision"><option value="ALLOW">Ø³Ù…Ø§Ø­</option><option value="DENY">Ø±ÙØ¶</option></select></label><label>Ø§Ù„Ø³Ø¨Ø¨<input name="reason" value="ØªØ­Ù‚Ù‚ Ù…Ø²Ø¯ÙˆØ¬" /></label><div class="form-actions"><button class="button primary">ØªØ³Ø¬ÙŠÙ„ Ø­Ø¯Ø«</button></div></form></article><article class="panel span-8"><h2>Ø³Ø¬Ù„ Ø§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª</h2>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø¬Ù‡Ø§Ø²", "Ø§Ù„Ø§ØªØ¬Ø§Ù‡", "Ø§Ù„Ù‚Ø±Ø§Ø±", "Ø§Ù„ÙˆÙ‚Øª"], events.map((event) => `<tr><td>${escapeHtml(event.employee?.fullName || event.employeeId)}</td><td>${escapeHtml(event.deviceId)}</td><td>${badge(event.direction)}</td><td>${badge(event.decision)}</td><td>${date(event.date)}</td></tr>`))}</article></section>`, "ØªÙƒØ§Ù…Ù„ Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© ÙˆØ§Ù„Ø¨ÙˆØ§Ø¨Ø§Øª", "Ø¬Ø§Ù‡Ø² Ù„Ù„Ø±Ø¨Ø· Ù…Ø¹ Turnstiles Ø£Ùˆ Door API Ø¹Ù†Ø¯ ØªÙˆÙØ± Ø§Ù„Ø¬Ù‡Ø§Ø².");
  app.querySelector("#access-form").addEventListener("submit", submitForm(endpoints.createAccessEvent, "ØªÙ… ØªØ³Ø¬ÙŠÙ„ Ø­Ø¯Ø« Ø§Ù„Ø¨ÙˆØ§Ø¨Ø©."));
}

async function renderOfflineSync() {
  const rows = await endpoints.offlineQueue().then(unwrap).catch(() => []);
  shell(`<section class="grid"><article class="panel span-5"><h2>Offline-first</h2><p>Ø¹Ù†Ø¯ ÙØ´Ù„ Ø§Ù„Ø´Ø¨ÙƒØ© ÙŠØªÙ… Ø­ÙØ¸ Ø§Ù„Ø·Ù„Ø¨Ø§Øª ØºÙŠØ± GET ÙÙŠ Ù‚Ø§Ø¦Ù…Ø© Ù…Ø­Ù„ÙŠØ© Ø«Ù… Ù…Ø²Ø§Ù…Ù†ØªÙ‡Ø§ Ø¹Ù†Ø¯ Ø¹ÙˆØ¯Ø© Ø§Ù„Ø§ØªØµØ§Ù„.</p><div class="toolbar"><button class="button primary" id="sync-offline">Ù…Ø²Ø§Ù…Ù†Ø© Ø§Ù„Ø¢Ù†</button><button class="button ghost" id="register-bg-sync">ØªÙØ¹ÙŠÙ„ Background Sync</button></div></article><article class="panel span-7"><h2>Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±</h2>${table(["Ø§Ù„Ù…Ø³Ø§Ø±", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], rows.map((row) => `<tr><td>${escapeHtml(row.path)}</td><td>${escapeHtml(row.method)}</td><td>${badge(row.status)}</td><td>${date(row.createdAt)}</td></tr>`))}</article></section>`, "Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø© Ø¯ÙˆÙ† Ø§ØªØµØ§Ù„", "IndexedDB/Queue-ready Ù…Ø¹ Background Sync Ø¹Ø¨Ø± Service Worker Ø¹Ù†Ø¯ Ø¯Ø¹Ù… Ø§Ù„Ù…ØªØµÙØ­.");
  app.querySelector("#sync-offline")?.addEventListener("click", async () => { const result = await endpoints.syncOfflineQueue(); setMessage(`ØªÙ…Øª Ù…Ø²Ø§Ù…Ù†Ø© ${result.synced || 0} Ø·Ù„Ø¨.`, ""); render(); });
  app.querySelector("#register-bg-sync")?.addEventListener("click", async () => { try { const reg = await navigator.serviceWorker.ready; await reg.sync?.register?.("hr-offline-sync"); setMessage("ØªÙ… ØªÙØ¹ÙŠÙ„ Background Sync Ø¥Ù† ÙƒØ§Ù† Ø§Ù„Ù…ØªØµÙØ­ ÙŠØ¯Ø¹Ù…Ù‡.", ""); } catch (error) { setMessage("", "Ø§Ù„Ù…ØªØµÙØ­ Ù„Ø§ ÙŠØ¯Ø¹Ù… Background Sync Ø£Ùˆ Ù„Ù… ÙŠØªÙ… ØªØ³Ø¬ÙŠÙ„ Service Worker."); } });
}

async function renderManagementStructure() {
  const data = await endpoints.managementStructure().then(unwrap);
  const employees = data.employees || [];
  const managers = data.managerOptions || [];
  const employeeOptions = optionList(employees.map((employee) => ({ id: employee.id, name: employee.fullName })), "", "Ø§Ø®ØªØ± Ù…ÙˆØ¸ÙÙ‹Ø§");
  const managerOptions = optionList(managers.map((employee) => ({ id: employee.id, name: employee.fullName })), "", "Ø¨Ø¯ÙˆÙ† Ù…Ø¯ÙŠØ± Ù…Ø¨Ø§Ø´Ø±");
  const levelRows = (data.levels || []).flatMap((level) => (level.people || []).map((person) => `<tr><td>${escapeHtml(level.label)}</td><td class="person-cell">${avatar(person, "tiny")}<span><strong>${escapeHtml(person.fullName || "-")}</strong><small>${escapeHtml(person.jobTitle || "")}</small></span></td><td>${escapeHtml(person.manager?.fullName || "-")}</td><td>${escapeHtml(person.teamCount || 0)}</td><td>${badge(person.role?.slug || person.role?.key || person.roleId || "-")}</td></tr>`));
  const teamRows = (data.managerTeams || []).map((row) => `<tr><td class="person-cell">${avatar(row.manager, "tiny")}<span><strong>${escapeHtml(row.manager?.fullName || "-")}</strong><small>${escapeHtml(row.manager?.jobTitle || "")}</small></span></td><td>${escapeHtml(row.teamCount || 0)}</td><td>${escapeHtml(row.activeCount || 0)}</td><td>${escapeHtml(row.pendingKpi || 0)}</td><td>${escapeHtml(row.pendingRequests || 0)}</td><td><button class="button ghost" data-route="team-dashboard?managerId=${escapeHtml(row.manager?.id || "")}">ÙØªØ­ Ø§Ù„ÙØ±ÙŠÙ‚</button></td></tr>`);
  shell(`<section class="stack management-structure-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© ÙˆØ§Ù„ÙØ±Ù‚</h2><p>ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ù„ÙƒÙ„ Ù…ÙˆØ¸ÙØ› ÙˆÙŠØ¹ØªÙ…Ø¯ Ø¹Ù„ÙŠÙ‡ Ø¸Ù‡ÙˆØ± Ø§Ù„ÙØ±ÙŠÙ‚ØŒ KPIØŒ Ø§Ù„Ø·Ù„Ø¨Ø§ØªØŒ ÙˆØ§Ù„ØªØµØ¹ÙŠØ¯.</p></div><button class="button ghost" data-export-structure>ØªØµØ¯ÙŠØ± Ø§Ù„Ù‡ÙŠÙƒÙ„ CSV</button></div><div class="mini-stats">${(data.metrics || []).map((m) => `<div><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper || "")}</small></div>`).join("")}</div></article>
    <article class="panel"><h2>ØªØºÙŠÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</h2><form id="assign-manager-form" class="form-grid compact-form"><label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId" required>${employeeOptions}</select></label><label>Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±<select name="managerEmployeeId">${managerOptions}</select></label><label class="span-2">Ù…Ù„Ø§Ø­Ø¸Ø© Ø§Ù„Ù†Ù‚Ù„<input name="note" placeholder="Ø³Ø¨Ø¨ Ø§Ù„Ù†Ù‚Ù„ Ø£Ùˆ Ù‚Ø±Ø§Ø± Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©" /></label><div class="form-actions"><button class="button primary">Ø­ÙØ¸ Ø§Ù„Ù†Ù‚Ù„</button></div></form></article>
    <article class="panel"><h2>Ø§Ù„ØµÙ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠ</h2>${table(["Ø§Ù„Ù…Ø³ØªÙˆÙ‰", "Ø§Ù„Ø´Ø®Øµ", "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ø£Ø¹Ù„Ù‰", "Ø­Ø¬Ù… Ø§Ù„ÙØ±ÙŠÙ‚", "Ø§Ù„Ø¯ÙˆØ±"], levelRows)}</article>
    <article class="panel"><h2>Ø§Ù„ÙØ±Ù‚ Ø­Ø³Ø¨ Ø§Ù„Ù…Ø¯ÙŠØ±</h2>${table(["Ø§Ù„Ù…Ø¯ÙŠØ±", "Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙØ±ÙŠÙ‚", "Ù†Ø´Ø·", "KPI Ù…Ø¹Ù„Ù‚", "Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", "Ø¥Ø¬Ø±Ø§Ø¡"], teamRows)}</article>
  </section>`, "Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©", "ØªÙ†Ø¸ÙŠÙ… Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ† ÙˆØ§Ù„ÙØ±Ù‚.");
  app.querySelector('#assign-manager-form')?.addEventListener('submit', submitForm((values) => endpoints.assignManager(values), 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.'));
  app.querySelector('[data-export-structure]')?.addEventListener('click', () => downloadFile('management-structure.csv', `\ufeff${toCsv([["Ø§Ù„Ù…Ø³ØªÙˆÙ‰","Ø§Ù„Ø´Ø®Øµ","Ø§Ù„Ù…Ø¯ÙŠØ±","Ø­Ø¬Ù… Ø§Ù„ÙØ±ÙŠÙ‚"], ...(data.levels || []).flatMap((level) => (level.people || []).map((person) => [level.label, person.fullName, person.manager?.fullName || '-', person.teamCount || 0]))])}`, 'text/csv;charset=utf-8'));
}

async function renderTeamDashboard() {
  const managerId = routeParams().get('managerId') || '';
  const data = await endpoints.teamDashboard({ managerId }).then(unwrap);
  const rows = data.team || [];
  shell(`<section class="stack team-dashboard-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</h2><p>${escapeHtml(data.manager?.fullName || 'ÙØ±ÙŠÙ‚ÙŠ')} â€” Ù…ØªØ§Ø¨Ø¹Ø© ÙŠÙˆÙ…ÙŠØ© Ù„Ù„Ø§Ù†Ø¶Ø¨Ø§Ø·ØŒ Ø§Ù„Ø·Ù„Ø¨Ø§ØªØŒ ÙˆKPI.</p></div><div class="toolbar"><button class="button primary" data-remind-team>Ø¥Ø±Ø³Ø§Ù„ ØªØ°ÙƒÙŠØ± Ù„Ù„ÙØ±ÙŠÙ‚</button><button class="button ghost" data-export-team>ØªØµØ¯ÙŠØ± CSV</button></div></div><div class="mini-stats">${(data.metrics || []).map((m) => `<div><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper || '')}</small></div>`).join('')}</div></article>
    <article class="panel"><h2>Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„ÙØ±ÙŠÙ‚</h2>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ…','Ø¢Ø®Ø± Ø¨ØµÙ…Ø©','KPI','Ø·Ù„Ø¨Ø§Øª','Ø¥Ø¬Ø±Ø§Ø¡'], rows.map((item) => `<tr><td class="person-cell">${avatar(item,'tiny')}<span><strong>${escapeHtml(item.fullName)}</strong><small>${escapeHtml(item.jobTitle || '')}</small></span></td><td>${badge(item.todayStatus || 'ABSENT')}</td><td>${date(item.lastEventAt)}</td><td>${badge(item.kpiStatus || 'DRAFT')}</td><td>${escapeHtml(item.pendingItems || 0)}</td><td><button class="button ghost" data-route="employee-archive?id=${escapeHtml(item.id)}">Ø£Ø±Ø´ÙŠÙ</button><button class="button ghost" data-route="kpi?employeeId=${escapeHtml(item.id)}">KPI</button></td></tr>`))}</article>
    <article class="panel"><h2>Ø·Ù„Ø¨Ø§Øª ÙˆÙ…Ù‡Ø§Ù… Ø§Ù„ÙØ±ÙŠÙ‚</h2>${table(['Ø§Ù„Ù†ÙˆØ¹','Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„Ø¹Ù†ÙˆØ§Ù†','Ø§Ù„ØªØ§Ø±ÙŠØ®'], (data.pending || []).map((item) => `<tr><td>${escapeHtml(item.kindLabel || item.kind)}</td><td>${escapeHtml(item.employee?.fullName || '-')}</td><td>${badge(item.status)}</td><td>${escapeHtml(item.label || item.title || '-')}</td><td>${date(item.createdAt || item.createdSort)}</td></tr>`))}</article>
  </section>`, "ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¯ÙŠØ±", "Ù„ÙˆØ­Ø© ØªØ´ØºÙŠÙ„ ÙŠÙˆÙ…ÙŠØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±.");
  app.querySelector('[data-export-team]')?.addEventListener('click', () => downloadFile('team-dashboard.csv', `\ufeff${toCsv([['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„ÙˆØ¸ÙŠÙØ©','Ø­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ…','Ø¢Ø®Ø± Ø¨ØµÙ…Ø©','KPI','Ø·Ù„Ø¨Ø§Øª'], ...rows.map((r) => [r.fullName, r.jobTitle || '', statusLabel(r.todayStatus), date(r.lastEventAt), statusLabel(r.kpiStatus), r.pendingItems || 0])])}`, 'text/csv;charset=utf-8'));
  app.querySelector('[data-remind-team]')?.addEventListener('click', async () => { const result = await endpoints.sendTeamReminder({ managerId }); setMessage(`ØªÙ… Ø¥Ø±Ø³Ø§Ù„ ${result.sent || 0} ØªØ°ÙƒÙŠØ± Ù„Ù„ÙØ±ÙŠÙ‚.`, ''); renderTeamDashboard(); });
}

async function renderHrOperations() {
  const data = await endpoints.hrOperations().then(unwrap);
  shell(`<section class="stack hr-ops-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©</h2><p>ØµÙØ­Ø© HR Ù…Ø³ØªÙ‚Ù„Ø©: Ø­Ø¶ÙˆØ±ØŒ KPIØŒ Ù…Ù„ÙØ§ØªØŒ Ø¨ÙŠØ§Ù†Ø§Øª Ù†Ø§Ù‚ØµØ©ØŒ ÙˆØ´ÙƒØ§ÙˆÙ‰ Ø¨Ø¯ÙˆÙ† Ø£Ø¯ÙˆØ§Øª ØªÙ‚Ù†ÙŠØ© ÙƒØ§Ù…Ù„Ø©.</p></div><div class="toolbar"><button class="button ghost" data-export-hr>ØªØµØ¯ÙŠØ± ØªÙ‚Ø±ÙŠØ± HR</button><button class="button primary" data-route="kpi">Ù…Ø±Ø§Ø¬Ø¹Ø© KPI</button></div></div><div class="mini-stats">${(data.metrics || []).map((m) => `<div><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper || '')}</small></div>`).join('')}</div></article>
    <article class="panel"><h2>Ø­Ø¶ÙˆØ± ÙˆØ§Ù†ØµØ±Ø§Ù ÙŠØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©</h2>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„ØªÙØ§ØµÙŠÙ„','Ø§Ù„ØªØ§Ø±ÙŠØ®','Ø¥Ø¬Ø±Ø§Ø¡'], (data.attendanceIssues || []).map((row) => `<tr><td>${escapeHtml(row.employee?.fullName || row.employeeName || '-')}</td><td>${badge(row.status || row.smartStatus || 'REVIEW')}</td><td>${escapeHtml(row.recommendation || row.title || row.notes || '-')}</td><td>${date(row.date || row.eventAt || row.createdAt)}</td><td><button class="button ghost" data-route="attendance-review">Ù…Ø±Ø§Ø¬Ø¹Ø©</button></td></tr>`))}</article>
    <article class="panel"><h2>KPI Ø¨Ø§Ù†ØªØ¸Ø§Ø± HR</h2>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ù…Ø¯ÙŠØ±','Ø§Ù„Ø­Ø¶ÙˆØ±','Ø§Ù„ØµÙ„Ø§Ø©','Ø§Ù„Ø­Ù„Ù‚Ø©','Ø§Ù„Ø­Ø§Ù„Ø©'], (data.kpiForHr || []).map((row) => `<tr><td>${escapeHtml(row.employee?.fullName || '-')}</td><td>${escapeHtml(row.manager?.fullName || '-')}</td><td>${escapeHtml(row.attendanceScore || 0)}/20</td><td>${escapeHtml(row.prayerScore || 0)}/5</td><td>${escapeHtml(row.quranCircleScore || 0)}/5</td><td>${badge(row.status || 'MANAGER_APPROVED')}</td></tr>`))}</article>
    <article class="panel"><h2>Ø¨ÙŠØ§Ù†Ø§Øª Ù†Ø§Ù‚ØµØ© Ø£Ùˆ ØªØ­ØªØ§Ø¬ Ø§Ø³ØªÙƒÙ…Ø§Ù„</h2>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ù…Ø´ÙƒÙ„Ø©','Ø¥Ø¬Ø±Ø§Ø¡'], (data.dataIssues || []).map((row) => `<tr><td>${escapeHtml(row.employee?.fullName || '-')}</td><td>${escapeHtml(row.issue)}</td><td><button class="button ghost" data-route="employee-profile?id=${escapeHtml(row.employee?.id || row.employeeId || '')}">ÙØªØ­ Ø§Ù„Ù…Ù„Ù</button></td></tr>`))}</article>
  </section>`, "Ø¹Ù…Ù„ÙŠØ§Øª HR", "Ù…Ø±ÙƒØ² Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© Ø§Ù„ÙŠÙˆÙ…ÙŠ.");
  app.querySelector('[data-export-hr]')?.addEventListener('click', () => downloadFile('hr-operations.csv', `\ufeff${toCsv([['Ø§Ù„Ù…Ø¤Ø´Ø±','Ø§Ù„Ù‚ÙŠÙ…Ø©'], ...(data.metrics || []).map((m) => [m.label, m.value])])}`, 'text/csv;charset=utf-8'));
}

async function renderDisputeWorkflow() {
  const data = await endpoints.disputeWorkflow().then(unwrap);
  const cases = data.cases || [];
  shell(`<section class="stack dispute-workflow-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>Ù…Ø³Ø§Ø± Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆØ­Ù„ Ø§Ù„Ù…Ø´ÙƒÙ„Ø§Øª</h2><p>Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„Ø±Ø³Ù…ÙŠ: Ø§Ù„Ù…ÙˆØ¸Ù â† Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø± â† Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ù…Ø´ÙƒÙ„Ø§Øª â† Ø§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ â† Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø¹Ù†Ø¯ Ø§Ù„ØªØµØ¹ÙŠØ¯.</p></div><button class="button ghost" data-export-disputes>ØªØµØ¯ÙŠØ± Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ CSV</button></div><div class="workflow-steps">${(data.workflowSteps || []).map((step, index) => `<div class="workflow-step"><strong>${index + 1}</strong><span>${escapeHtml(step)}</span></div>`).join('')}</div></article>
    <article class="panel"><h2>Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ù„Ø¬Ù†Ø©</h2><div class="committee-grid">${(data.committeeMembers || []).map((member) => `<div class="mini-card person-cell">${avatar(member,'small')}<span><strong>${escapeHtml(member.fullName || '-')}</strong><small>${escapeHtml(member.jobTitle || '')}</small></span></div>`).join('')}</div></article>
    <article class="panel"><h2>Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ Ø­Ø³Ø¨ Ø§Ù„Ù…Ø±Ø­Ù„Ø©</h2>${table(['Ø§Ù„Ø¹Ù†ÙˆØ§Ù†','ØµØ§Ø­Ø¨ Ø§Ù„Ø´ÙƒÙˆÙ‰','Ø§Ù„Ù…Ø±Ø­Ù„Ø©','Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©','Ù‚Ø±Ø§Ø±/Ù…Ù„Ø§Ø­Ø¸Ø©','Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª'], cases.map((item) => `<tr><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description || '')}</small></td><td>${escapeHtml(item.employee?.fullName || '-')}</td><td>${badge(item.status || 'OPEN')}</td><td>${badge(item.priority || 'MEDIUM')}</td><td>${escapeHtml(item.committeeDecision || item.resolution || '-')}</td><td><button class="button primary" data-dispute-stage="${escapeHtml(item.id)}" data-status="COMMITTEE_REVIEW">Ù„Ø¬Ù†Ø©</button><button class="button ghost" data-dispute-stage="${escapeHtml(item.id)}" data-status="ESCALATED">ØªØµØ¹ÙŠØ¯</button><button class="button ghost" data-dispute-stage="${escapeHtml(item.id)}" data-status="RESOLVED">Ø­Ù„</button></td></tr>`))}</article>
  </section>`, "Ù…Ø³Ø§Ø± Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰", "Workflow ÙˆØ§Ø¶Ø­ Ù„Ù„ØªØµØ¹ÙŠØ¯ ÙˆØ§Ù„Ù‚Ø±Ø§Ø±Ø§Øª.");
  app.querySelectorAll('[data-dispute-stage]').forEach((button) => button.addEventListener('click', async () => { const note = await askText({ title: 'Ù…Ù„Ø§Ø­Ø¸Ø© Ø§Ù„Ù‚Ø±Ø§Ø±', message: 'Ø§ÙƒØªØ¨ Ù…Ù„Ø®Øµ Ø§Ù„Ù‚Ø±Ø§Ø± Ø£Ùˆ Ø³Ø¨Ø¨ Ø§Ù„ØªØµØ¹ÙŠØ¯.', defaultValue: button.dataset.status === 'ESCALATED' ? 'ÙŠØ­ØªØ§Ø¬ Ù‚Ø±Ø§Ø± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ' : 'ØªÙ…Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©', confirmLabel: 'Ø­ÙØ¸' }); if (note === null) return; await endpoints.advanceDispute(button.dataset.disputeStage, { status: button.dataset.status, note }); setMessage('ØªÙ… ØªØ­Ø¯ÙŠØ« Ù…Ø³Ø§Ø± Ø§Ù„Ø´ÙƒÙˆÙ‰.', ''); renderDisputeWorkflow(); }));
  app.querySelector('[data-export-disputes]')?.addEventListener('click', () => downloadFile('dispute-workflow.csv', `\ufeff${toCsv([['Ø§Ù„Ø¹Ù†ÙˆØ§Ù†','Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©','Ø§Ù„Ù‚Ø±Ø§Ø±'], ...cases.map((c) => [c.title, c.employee?.fullName || '', statusLabel(c.status), statusLabel(c.priority), c.committeeDecision || c.resolution || ''])])}`, 'text/csv;charset=utf-8'));
}

async function renderReportCenter() {
  const data = await endpoints.reportCenter().then(unwrap);
  const rows = data.rows || [];
  const headers = ['Ø§Ù„ØªÙ‚Ø±ÙŠØ±','Ø§Ù„Ù†Ø·Ø§Ù‚','Ø¹Ø¯Ø¯ Ø§Ù„Ø³Ø¬Ù„Ø§Øª','Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«','Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª'];
  shell(`<section class="stack report-center-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>Ù…Ø±ÙƒØ² Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± ÙˆØ§Ù„ØªØµØ¯ÙŠØ±</h2><p>ØªØµØ¯ÙŠØ± ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©ØŒ HRØŒ Ø§Ù„Ø­Ø¶ÙˆØ±ØŒ KPIØŒ Ø§Ù„ÙØ±Ù‚ØŒ ÙˆØ§Ù„Ø´ÙƒØ§ÙˆÙ‰ Ø¨ØµÙŠØº CSV/Excel Ø£Ùˆ ÙØªØ­ ØªÙ‚Ø±ÙŠØ± Ù‚Ø§Ø¨Ù„ Ù„Ù„Ø­ÙØ¸ PDF.</p></div></div><div class="mini-stats">${(data.metrics || []).map((m) => `<div><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper || '')}</small></div>`).join('')}</div></article>
    <article class="panel">${table(headers, rows.map((row) => `<tr><td><strong>${escapeHtml(row.title)}</strong><small>${escapeHtml(row.description || '')}</small></td><td>${escapeHtml(row.scope || '-')}</td><td>${escapeHtml(row.count || 0)}</td><td>${date(row.updatedAt || row.generatedAt)}</td><td><button class="button ghost" data-export-report="${escapeHtml(row.key)}" data-format="csv">CSV</button><button class="button ghost" data-export-report="${escapeHtml(row.key)}" data-format="xls">Excel</button><button class="button primary" data-export-report="${escapeHtml(row.key)}" data-format="pdf">PDF</button></td></tr>`))}</article>
  </section>`, "Ù…Ø±ÙƒØ² Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±", "ØªØµØ¯ÙŠØ± ÙˆØªØ¬Ù‡ÙŠØ² ØªÙ‚Ø§Ø±ÙŠØ± Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©.");
  app.querySelectorAll('[data-export-report]').forEach((button) => button.addEventListener('click', async () => { const result = await endpoints.exportManagementReport({ key: button.dataset.exportReport, format: button.dataset.format }).then(unwrap); if (button.dataset.format === 'pdf') printBrandedReport(result.title, result.summaryHtml || '', result.headers || [], result.rows || []); else if (button.dataset.format === 'xls') exportHtmlTable(`${result.fileName || button.dataset.exportReport}.xls`, result.headers || [], result.rows || []); else downloadFile(`${result.fileName || button.dataset.exportReport}.csv`, `\ufeff${toCsv([result.headers || [], ...(result.rows || [])])}`, 'text/csv;charset=utf-8'); }));
}

async function renderManagerDashboard() {
  const data = await endpoints.managerDashboard().then(unwrap);
  const team = data.team || [];
  const rows = team.map((item) => `<tr><td><div class="person-cell">${avatar(item, "small")}<span><strong>${escapeHtml(item.fullName)}</strong><small>${escapeHtml(item.jobTitle || "")}</small></span></div></td><td>${badge(item.todayStatus || "ABSENT")}</td><td>${date(item.lastEventAt)}</td><td>${escapeHtml(item.pendingItems || 0)}</td><td><button class="button ghost" data-profile="${escapeHtml(item.id)}">ÙØªØ­ Ø§Ù„Ù…Ù„Ù</button></td></tr>`);
  shell(
    `<section class="grid manager-dashboard-page">
      <article class="panel span-12"><div class="panel-head"><div><h2>Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</h2><p>Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ÙØ±ÙŠÙ‚ØŒ Ø§Ù„Ø­Ø¶ÙˆØ±ØŒ Ø§Ù„Ø·Ù„Ø¨Ø§ØªØŒ ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù…Ù† Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯.</p></div><div class="toolbar"><button class="button primary" data-generate-attendance-alerts>ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ù…ØªØ£Ø®Ø±ÙŠÙ† Ø¹Ù† Ø§Ù„Ø¨ØµÙ…Ø©</button><button class="button ghost" data-route="monthly-report">ØªÙ‚Ø±ÙŠØ± Ø´Ù‡Ø±ÙŠ</button></div></div><div class="metric-grid">${(data.metrics || []).map((m) => `<div class="metric-card"><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper || "")}</small></div>`).join("")}</div></article>
      <article class="panel span-8"><h2>ÙØ±ÙŠÙ‚ÙŠ Ø§Ù„ÙŠÙˆÙ…</h2>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¢Ø®Ø± Ø¨ØµÙ…Ø©", "Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], rows)}</article>
      <article class="panel span-4"><h2>Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ø¹Ø§Ø¬Ù„Ø©</h2><div class="stack-list">${(data.actions || []).map((a) => `<div class="task-card"><strong>${escapeHtml(a.title)}</strong><p>${escapeHtml(a.body || "")}</p>${badge(a.status || "INFO")}</div>`).join("") || `<div class="empty-state">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ø¹Ø§Ø¬Ù„Ø© Ø§Ù„Ø¢Ù†.</div>`}</div></article>
    </section>`,
    "Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±",
    "Ø±Ø¤ÙŠØ© Ù…Ø®ØªØµØ±Ø© Ù„Ù„ÙØ±ÙŠÙ‚ ÙˆØ§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª.",
  );
  app.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => { location.hash = `employee-profile?id=${button.dataset.profile}`; }));
  app.querySelector("[data-generate-attendance-alerts]")?.addEventListener("click", async () => {
    const result = await endpoints.generateAttendanceAlerts();
    setMessage(`ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ ${result.created || 0} Ø¥Ø´Ø¹Ø§Ø±ØŒ ÙˆØªÙ… Ø¥Ø±Ø³Ø§Ù„ ${result.pushed || result.attempted || 0} Push Ù„Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„Ø§Øª Ø§Ù„Ù…Ø´ØªØ±ÙƒØ©.`, "");
    render();
  });
}

async function renderAttendanceReview() {
  const rows = await endpoints.rejectedPunches().then(unwrap);
  shell(
    `<section class="panel attendance-review-page">
      <div class="panel-head"><div><h2>Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ØµÙ…Ø§Øª Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø©</h2><p>Ø£ÙŠ Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±ÙÙˆØ¶Ø© Ø¨Ø³Ø¨Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø£Ùˆ Ø§Ù„Ø¯Ù‚Ø© Ø£Ùˆ ÙØ´Ù„ Ø§Ù„Ø¨ØµÙ…Ø© ØªØ¸Ù‡Ø± Ù‡Ù†Ø§ Ù„Ø§Ø¹ØªÙ…Ø§Ø¯Ù‡Ø§ ÙŠØ¯ÙˆÙŠÙ‹Ø§ Ø£Ùˆ ØªØ«Ø¨ÙŠØª Ø±ÙØ¶Ù‡Ø§.</p></div><button class="button ghost" data-route="attendance">ÙƒÙ„ Ø§Ù„Ø­Ø¶ÙˆØ±</button></div>
      ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø³Ø¨Ø¨", "Ø§Ù„Ù…Ø®Ø§Ø·Ø±", "Ø³ÙŠÙ„ÙÙŠ", "Ø§Ù„Ù…Ø³Ø§ÙØ©", "Ø§Ù„Ø¯Ù‚Ø©", "Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡"], rows.map((event) => `<tr><td>${escapeHtml(event.employee?.fullName || event.employeeId || "-")}</td><td>${badge(event.type)}</td><td>${escapeHtml(event.notes || event.blockReason || "-")}</td><td><strong>${escapeHtml(event.riskScore ?? 0)}%</strong> ${event.riskLevel ? badge(event.riskLevel) : ""}<br>${(event.riskFlags || []).map((flag) => `<span class="status warning">${escapeHtml(flag)}</span>`).join(" ") || "-"}</td><td>${event.selfieUrl ? `<a target="_blank" rel="noopener" href="${escapeHtml(event.selfieUrl)}">Ø¹Ø±Ø¶ Ø§Ù„Ø³ÙŠÙ„ÙÙŠ</a>` : `<span class="status warning">Ù„Ø§ ÙŠÙˆØ¬Ø¯</span>`}</td><td>${formatMeters(event.distanceFromBranchMeters)}</td><td>${formatMeters(event.accuracyMeters)}</td><td>${date(event.eventAt)}</td><td><div class="toolbar"><button class="button primary" data-review-punch="approve" data-id="${escapeHtml(event.id)}" data-check-id="${escapeHtml(event.identityCheckId || '')}">Ø§Ø¹ØªÙ…Ø§Ø¯</button><button class="button danger" data-review-punch="reject" data-id="${escapeHtml(event.id)}" data-check-id="${escapeHtml(event.identityCheckId || '')}">Ø±ÙØ¶ Ù†Ù‡Ø§Ø¦ÙŠ</button></div></td></tr>`))}
    </section>`,
    "Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¨ØµÙ…Ø§Øª",
    "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø£Ùˆ Ø±ÙØ¶ Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„Ø¨ØµÙ…Ø© Ø§Ù„Ù…Ø±ÙÙˆØ¶Ø©.",
  );
  app.querySelectorAll("[data-review-punch]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.reviewPunch;
    const ok = await confirmAction({ title: action === "approve" ? "Ø§Ø¹ØªÙ…Ø§Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø¨ØµÙ…Ø©" : "Ø±ÙØ¶ Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø¨ØµÙ…Ø©", message: action === "approve" ? "Ø³ÙŠØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© ÙŠØ¯ÙˆÙŠÙ‹Ø§ ÙˆØ¥Ø²Ø§Ù„Ø© Ø¹Ù„Ø§Ù…Ø© Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©." : "Ø³ÙŠØªÙ… ØªØ«Ø¨ÙŠØª Ø§Ù„Ø±ÙØ¶ ÙˆØ¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©.", confirmLabel: action === "approve" ? "Ø§Ø¹ØªÙ…Ø§Ø¯" : "Ø±ÙØ¶ Ù†Ù‡Ø§Ø¦ÙŠ", danger: action !== "approve" });
    if (!ok) return;
    await endpoints.reviewRejectedPunch(button.dataset.id, action, button.dataset.checkId || "");
    setMessage(action === "approve" ? "ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¨ØµÙ…Ø© ÙŠØ¯ÙˆÙŠÙ‹Ø§." : "ØªÙ… ØªØ«Ø¨ÙŠØª Ø±ÙØ¶ Ø§Ù„Ø¨ØµÙ…Ø©.", "");
    render();
  }));
}

async function renderEmployeeQr() {
  shell(`
    <section class="grid qr-page">
      <article class="panel span-12">
        <div class="panel-kicker">QR Ù…ØªÙˆÙ‚Ù</div>
        <h2>ØªÙ… Ø¥ÙŠÙ‚Ø§Ù QR Ø§Ù„Ø¨ØµÙ…Ø© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„</h2>
        <p>ØªÙ… Ø­Ø°Ù QR Ù…Ù† Ù…Ø³Ø§Ø± Ø§Ù„Ø¨ØµÙ…Ø© ÙˆÙ…Ù†Ø¹ Ø¥Ù†Ø´Ø§Ø¡ QR Ø§Ù„ÙØ±Ø¹ ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù†Ø³Ø®Ø©. Ø§Ù„Ø¨ØµÙ…Ø© ØªØ¹ØªÙ…Ø¯ Ø§Ù„Ø¢Ù† Ø¹Ù„Ù‰ Passkey + GPS Ø¹Ø§Ù„ÙŠ Ø§Ù„Ø¯Ù‚Ø© + Ø³ÙŠÙ„ÙÙŠ + Ù…Ø±Ø§Ø¬Ø¹Ø© HR Ø¹Ù†Ø¯ Ø§Ù„Ø´Ùƒ.</p>
        <div class="message warning">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø³Ø­ QR ÙˆÙ„Ø§ Ø¥Ù†Ø´Ø§Ø¡ QR ÙˆÙ„Ø§ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¹Ù„Ù‰ Ø£ÙŠ Ø®Ø¯Ù…Ø© QR Ø®Ø§Ø±Ø¬ÙŠØ©.</div>
      </article>
    </section>
  `, "QR Ù…ØªÙˆÙ‚Ù", "ØªÙ… Ø¥ÙŠÙ‚Ø§Ù QR Ù…Ù† Ø§Ù„ØªØ´ØºÙŠÙ„ ÙˆØ§Ù„ÙˆØ§Ø¬Ù‡Ø©.");
}


async function renderTrustedDevices() {
  const [devices, employees, requests] = await Promise.all([
    endpoints.trustedDevices().then(unwrap),
    endpoints.employees().then(unwrap),
    endpoints.trustedDeviceApprovalRequests().then(unwrap).catch(() => []),
  ]);
  const byEmployee = new Map(employees.map((e) => [e.id, e]));
  shell(
    `<section class="grid devices-page">
      <article class="panel span-12"><div class="panel-head"><div><h2>Ø·Ù„Ø¨Ø§Øª Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©</h2><p>Ø£ÙŠ Ø¬Ù‡Ø§Ø² Ø¬Ø¯ÙŠØ¯ Ø£Ùˆ ØºÙŠØ± Ù…Ø¹ØªÙ…Ø¯ ÙŠØªØ­ÙˆÙ„ Ø¥Ù„Ù‰ Ù‡Ø°Ù‡ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ù‚Ø¨Ù„ Ø§Ø¹ØªÙ…Ø§Ø¯ Ø¨ØµÙ…ØªÙ‡ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§.</p></div></div>
      ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø¬Ù‡Ø§Ø²", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„Ø³ÙŠÙ„ÙÙŠ", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø¥Ø¬Ø±Ø§Ø¡"], (requests || []).map((r) => { const employee = byEmployee.get(r.employeeId) || {}; return `<tr><td>${escapeHtml(employee.fullName || r.employeeName || r.employeeId || "-")}</td><td><strong>${escapeHtml(r.deviceName || "Ø¬Ù‡Ø§Ø² Ù…ØªØµÙØ­")}</strong><br><small>${escapeHtml(String(r.deviceFingerprintHash || "").slice(0,16))}</small></td><td>${badge(r.status || "PENDING")}</td><td>${r.selfieUrl ? `<a target="_blank" rel="noopener" href="${escapeHtml(r.selfieUrl)}">Ø¹Ø±Ø¶</a>` : "-"}</td><td>${r.latitude ? `<a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${escapeHtml(r.latitude)},${escapeHtml(r.longitude)}">Ø®Ø±ÙŠØ·Ø©</a>` : "-"}</td><td>${date(r.createdAt)}</td><td><div class="toolbar"><button class="button primary" data-device-review="APPROVED" data-request-id="${escapeHtml(r.id)}">Ø§Ø¹ØªÙ…Ø§Ø¯</button><button class="button danger" data-device-review="REJECTED" data-request-id="${escapeHtml(r.id)}">Ø±ÙØ¶</button></div></td></tr>`; }))}</article>
      <article class="panel span-12"><div class="panel-head"><div><h2>Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©</h2><p>Ù‚Ø§Ø¦Ù…Ø© Passkeys ÙˆØ§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„ØªÙŠ ÙŠØ³ØªØ®Ø¯Ù…Ù‡Ø§ Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ† ÙÙŠ Ø¨ØµÙ…Ø© Ø§Ù„Ø­Ø¶ÙˆØ±.</p></div><button class="button ghost" data-route="employee-punch">ØªØ³Ø¬ÙŠÙ„ Ø¨ØµÙ…Ø© Ø¬Ù‡Ø§Ø²</button></div>
      ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø¬Ù‡Ø§Ø²", "Ø§Ù„Ù…Ù†ØµØ©", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¢Ø®Ø± Ø§Ø³ØªØ®Ø¯Ø§Ù…", "Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª"], devices.map((d) => { const employee = d.employee || byEmployee.get(d.employeeId) || employees.find((e) => e.userId === d.userId) || {}; return `<tr><td>${escapeHtml(employee.fullName || d.employeeId || d.userId || "-")}</td><td>${escapeHtml(d.label || d.deviceLabel || "Ù…ÙØªØ§Ø­ Ù…Ø±ÙˆØ±")}</td><td>${escapeHtml(d.platform || d.userAgent || "-")}</td><td>${badge(d.approvalStatus || d.status || (d.trusted === false ? "DEVICE_DISABLED" : "DEVICE_TRUSTED"))}</td><td>${date(d.lastUsedAt)}</td><td><div class="toolbar"><button class="button ghost" data-device-action="trust" data-id="${escapeHtml(d.id)}">Ø§Ø¹ØªÙ…Ø§Ø¯</button><button class="button danger" data-device-action="disable" data-id="${escapeHtml(d.id)}">ØªØ¹Ø·ÙŠÙ„</button></div></td></tr>`; }))}</article>
    </section>`,
    "Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø©",
    "Ø¥Ø¯Ø§Ø±Ø© Ù…ÙØ§ØªÙŠØ­ Ø§Ù„Ù…Ø±ÙˆØ± ÙˆØ§Ù„Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ù…ÙˆØ«ÙˆÙ‚Ø©.",
  );
  app.querySelectorAll("[data-device-review]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.reviewTrustedDeviceApproval({ requestId: button.dataset.requestId, decision: button.dataset.deviceReview });
    setMessage(button.dataset.deviceReview === "APPROVED" ? "ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¬Ù‡Ø§Ø²." : "ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø¬Ù‡Ø§Ø².", "");
    renderTrustedDevices();
  }));
  app.querySelectorAll("[data-device-action]").forEach((button) => button.addEventListener("click", async () => {
    await endpoints.updateTrustedDevice(button.dataset.id, { action: button.dataset.deviceAction });
    setMessage(button.dataset.deviceAction === "trust" ? "ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¬Ù‡Ø§Ø²." : "ØªÙ… ØªØ¹Ø·ÙŠÙ„ Ø§Ù„Ø¬Ù‡Ø§Ø².", "");
    render();
  }));
}

async function renderMonthlyReport() {
  const params = routeParams();
  const month = params.get("month") || new Date().toISOString().slice(0, 7);
  const report = await endpoints.monthlyReport({ month }).then(unwrap);
  const rows = report.rows || [];
  shell(
    `<section class="grid monthly-report-page">
      <article class="panel span-12"><div class="panel-head"><div><h2>Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ</h2><p>ØªÙ‚Ø±ÙŠØ± Ø­Ø¶ÙˆØ± ÙˆØ§Ù†ØµØ±Ø§Ù Ù‚Ø§Ø¨Ù„ Ù„Ù„Ø·Ø¨Ø§Ø¹Ø© PDF Ø¨ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¬Ù…Ø¹ÙŠØ©.</p></div><div class="toolbar"><input id="report-month" type="month" value="${escapeHtml(month)}" /><button class="button primary" id="print-monthly-report">Ø·Ø¨Ø§Ø¹Ø© / PDF</button><button class="button ghost" id="export-monthly-csv">CSV</button></div></div><div class="metric-grid">${(report.metrics || []).map((m) => `<div class="metric-card"><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper || "")}</small></div>`).join("")}</div></article>
      <article class="panel span-12">${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø­Ø¶ÙˆØ±", "Ø§Ù†ØµØ±Ø§Ù", "Ù…Ø±ÙÙˆØ¶", "ØªØ£Ø®ÙŠØ±", "Ø¢Ø®Ø± Ø¨ØµÙ…Ø©"], rows.map((r) => `<tr><td>${escapeHtml(r.employeeName)}</td><td>${escapeHtml(r.checkIns)}</td><td>${escapeHtml(r.checkOuts)}</td><td>${escapeHtml(r.rejected)}</td><td>${escapeHtml(r.lateMinutes)} Ø¯Ù‚ÙŠÙ‚Ø©</td><td>${date(r.lastEventAt)}</td></tr>`))}</article>
    </section>`,
    "ØªÙ‚Ø±ÙŠØ± Ø´Ù‡Ø±ÙŠ",
    "Ù…Ù„Ø®Øµ Ø´Ù‡Ø±ÙŠ Ù„Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù.",
  );
  app.querySelector("#report-month")?.addEventListener("change", (event) => { location.hash = `monthly-report?month=${event.target.value}`; });
  const headers = ["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø­Ø¶ÙˆØ±", "Ø§Ù†ØµØ±Ø§Ù", "Ù…Ø±ÙÙˆØ¶", "ØªØ£Ø®ÙŠØ±", "Ø¢Ø®Ø± Ø¨ØµÙ…Ø©"];
  const tableRows = rows.map((r) => [r.employeeName, r.checkIns, r.checkOuts, r.rejected, `${r.lateMinutes} Ø¯Ù‚ÙŠÙ‚Ø©`, r.lastEventAt || "-"]);
  app.querySelector("#export-monthly-csv")?.addEventListener("click", () => downloadFile(`monthly-attendance-${month}.csv`, `\ufeff${toCsv([headers, ...tableRows])}`, "text/csv;charset=utf-8"));
  app.querySelector("#print-monthly-report")?.addEventListener("click", () => {
    const summary = `<div class="summary">${(report.metrics || []).map((m) => `<div><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper || "")}</small></div>`).join("")}</div>`;
    printBrandedReport(`ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø´Ù‡Ø±ÙŠ ${month}`, summary, headers, tableRows);
  });
}

async function renderSecurityLog() {
  const logs = await endpoints.securityLog().then(unwrap);
  shell(
    `<section class="panel security-log-page"><div class="panel-head"><div><h2>Ø³Ø¬Ù„ Ø§Ù„Ø£Ù…Ø§Ù†</h2><p>Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„ÙØ§Ø´Ù„Ø©ØŒ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ØŒ Ø·Ù„Ø¨Ø§Øª Ù†Ø³ÙŠØª ÙƒÙ„Ù…Ø© Ø§Ù„Ø³Ø±ØŒ ÙˆØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±.</p></div><button class="button ghost" id="export-security-log">ØªØµØ¯ÙŠØ±</button></div>${table(["Ø§Ù„Ø¹Ù…Ù„ÙŠØ©", "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…", "Ø§Ù„ÙƒÙŠØ§Ù†", "Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø§Ù„ØªÙØ§ØµÙŠÙ„"], logs.map((log) => `<tr><td>${escapeHtml(log.action)}</td><td>${escapeHtml(log.actor || log.actorUserId || "-")}</td><td>${escapeHtml(log.entityType || "-")}</td><td>${date(log.createdAt)}</td><td><small>${escapeHtml(JSON.stringify(log.metadata || log.afterData || {}))}</small></td></tr>`))}</section>`,
    "Ø³Ø¬Ù„ Ø§Ù„Ø£Ù…Ø§Ù†",
    "Ù…Ø±Ø§Ù‚Ø¨Ø© Ø§Ù„Ø¯Ø®ÙˆÙ„ ÙˆÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ±.",
  );
  app.querySelector("#export-security-log")?.addEventListener("click", () => downloadFile("security-log.csv", `\ufeff${toCsv([["action","actor","entity","date"], ...logs.map((l) => [l.action, l.actor || l.actorUserId || "", l.entityType || "", l.createdAt || ""])])}`, "text/csv;charset=utf-8"));
}


async function renderExecutiveReport() {
  const data = unwrap(await endpoints.executiveReport());
  const cards = data.cards || {};
  shell(
    `<section class="grid executive-report-page">
      <article class="panel span-12 accent-panel">
        <div class="panel-head"><div><h2>Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ Ø§Ù„Ù…Ø®ØªØµØ± Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ</h2><p>Ù…Ù„Ø®Øµ ÙˆØ§Ø­Ø¯ ÙŠØ¬Ù…Ø¹ Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ§Ù„Ù…Ø´Ø§ÙƒÙ„ ÙˆØ§Ù„Ù…Ù‡Ø§Ù… ÙˆØ§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„ØªÙŠ ØªØ­ØªØ§Ø¬ Ù‚Ø±Ø§Ø±Ù‹Ø§.</p></div><div class="score-ring"><strong>${escapeHtml(data.readiness?.score || 0)}%</strong><span>${escapeHtml(data.readiness?.grade || "-")}</span></div></div>
      </article>
      ${[
        ["Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†", cards.employees],
        ["Ø§Ù„Ù†Ø´Ø·ÙˆÙ†", cards.activeEmployees],
        ["Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…", cards.presentToday],
        ["Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", cards.pendingRequests],
        ["Ù…Ø´Ø§ÙƒÙ„ Ù…ÙØªÙˆØ­Ø©", cards.openDisputes],
        ["Ù…Ù‡Ø§Ù… Ù…ØªØ£Ø®Ø±Ø©", cards.overdueTasks],
        ["Ù…Ø³ØªÙ†Ø¯Ø§Øª Ù‚Ø±Ø¨ Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡", cards.expiringDocuments],
      ].map(([label, value]) => `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 0)}</strong><small>Ù…Ø¤Ø´Ø± ØªÙ†ÙÙŠØ°ÙŠ Ù…Ø¨Ø§Ø´Ø±</small></article>`).join("")}
      <article class="panel span-6"><div class="panel-head"><div><h2>Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ†</h2><p>Ø¹Ø¯Ø¯ Ø§Ù„ÙØ±ÙŠÙ‚ ÙˆØ§Ù„Ù…Ù‡Ø§Ù… ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙØªÙˆØ­Ø©.</p></div></div>${table(["Ø§Ù„Ù…Ø¯ÙŠØ±", "Ø§Ù„ÙØ±ÙŠÙ‚", "Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©", "Ù…Ù‡Ø§Ù… Ù…ÙØªÙˆØ­Ø©"], safeList(data.managerPerformance).map((row) => `<tr><td>${escapeHtml(row.manager?.fullName || "-")}</td><td>${escapeHtml(row.teamCount || 0)}</td><td>${escapeHtml(row.pendingRequests || 0)}</td><td>${escapeHtml(row.openTasks || 0)}</td></tr>`))}</article>
      <article class="panel span-6"><div class="panel-head"><div><h2>Ù…Ø´Ø§ÙƒÙ„ ØªØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©</h2><p>Ù‚Ø¶Ø§ÙŠØ§ Ù„Ø¬Ù†Ø© Ø­Ù„ Ø§Ù„Ø®Ù„Ø§ÙØ§Øª ØºÙŠØ± Ø§Ù„Ù…ØºÙ„Ù‚Ø©.</p></div><button class="button ghost" data-route="disputes">ÙØªØ­ Ø§Ù„Ù„Ø¬Ù†Ø©</button></div>${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©", "Ø§Ù„Ø­Ø§Ù„Ø©"], safeList(data.openDisputes).map((item) => `<tr><td>${escapeHtml(item.title || "-")}</td><td>${escapeHtml(item.employee?.fullName || "-")}</td><td>${badge(item.priority || "-")}</td><td>${badge(item.status || "-")}</td></tr>`))}</article>
      <article class="panel span-6"><div class="panel-head"><div><h2>Ù…Ù‡Ø§Ù… Ù…ØªØ£Ø®Ø±Ø©</h2><p>Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„ØªÙŠ ØªØ¬Ø§ÙˆØ²Øª ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚.</p></div><button class="button ghost" data-route="tasks">ÙØªØ­ Ø§Ù„Ù…Ù‡Ø§Ù…</button></div>${table(["Ø§Ù„Ù…Ù‡Ù…Ø©", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©", "Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚"], safeList(data.overdueTasks).map((item) => `<tr><td>${escapeHtml(item.title || "-")}</td><td>${escapeHtml(item.employee?.fullName || "-")}</td><td>${badge(item.priority || "-")}</td><td>${escapeHtml(item.dueDate || "-")}</td></tr>`))}</article>
      <article class="panel span-6"><div class="panel-head"><div><h2>Ù…Ø³ØªÙ†Ø¯Ø§Øª Ù‚Ø±Ø¨ Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡</h2><p>ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù‚Ø¨Ù„ Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª.</p></div><button class="button ghost" data-route="documents">ÙØªØ­ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª</button></div>${table(["Ø§Ù„Ù…Ø³ØªÙ†Ø¯", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "ÙŠÙ†ØªÙ‡ÙŠ ÙÙŠ"], safeList(data.documentsExpiring).map((item) => `<tr><td>${escapeHtml(item.title || "-")}</td><td>${escapeHtml(item.employee?.fullName || "-")}</td><td>${escapeHtml(item.documentType || "-")}</td><td>${escapeHtml(item.expiresOn || "-")}</td></tr>`))}</article>
    </section>`,
    "Ø§Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ",
    "ØµÙØ­Ø© Ø®Ø§ØµØ© Ø¨Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ÙˆØ§Ù„Ø³ÙƒØ±ØªÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ.",
  );
}

async function renderLeaveBalances() {
  const [balances, employees] = await Promise.all([endpoints.leaveBalances().then(unwrap), endpoints.employees().then(unwrap)]);
  shell(
    `<section class="grid">
      <article class="panel span-12"><div class="panel-head"><div><h2>Ø£Ø±ØµØ¯Ø© Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª</h2><p>Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ø³Ù†ÙˆÙŠ ÙˆØ§Ù„Ø¹Ø§Ø±Ø¶ ÙˆØ§Ù„Ù…Ø±Ø¶ÙŠØŒ Ù…Ø¹ Ø§Ø­ØªØ³Ø§Ø¨ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙˆØ§Ù„Ù…ØªØ¨Ù‚ÙŠ.</p></div></div>
        <form id="leave-balance-form" class="form-grid compact-form">
          <label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId" required>${optionList(employees, "", "Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ¸Ù")}</select></label>
          <label>Ø³Ù†ÙˆÙŠ<input name="annualTotal" type="number" value="21" min="0" required /></label>
          <label>Ø¹Ø§Ø±Ø¶<input name="casualTotal" type="number" value="7" min="0" required /></label>
          <label>Ù…Ø±Ø¶ÙŠ<input name="sickTotal" type="number" value="15" min="0" required /></label>
          <label>Ù…Ø³ØªØ®Ø¯Ù…<input name="usedDays" type="number" value="0" min="0" required /></label>
          <label>Ù…Ù„Ø§Ø­Ø¸Ø§Øª<input name="notes" placeholder="Ø§Ø®ØªÙŠØ§Ø±ÙŠ" /></label>
          <div class="form-actions"><button class="button primary" type="submit">Ø­ÙØ¸ Ø§Ù„Ø±ØµÙŠØ¯</button></div>
        </form>
        ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø³Ù†ÙˆÙŠ", "Ø¹Ø§Ø±Ø¶", "Ù…Ø±Ø¶ÙŠ", "Ù…Ø³ØªØ®Ø¯Ù…", "Ù…ØªØ¨Ù‚ÙŠ", "Ø¢Ø®Ø± ØªØ­Ø¯ÙŠØ«"], balances.map((row) => `<tr><td>${escapeHtml(row.employee?.fullName || row.employeeId)}</td><td>${escapeHtml(row.annualTotal)}</td><td>${escapeHtml(row.casualTotal)}</td><td>${escapeHtml(row.sickTotal)}</td><td>${escapeHtml(row.usedDays)}</td><td>${escapeHtml(row.remainingDays)}</td><td>${date(row.updatedAt)}</td></tr>`))}
      </article>
    </section>`,
    "Ø£Ø±ØµØ¯Ø© Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª",
    "ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª Ø¥Ù„Ù‰ Ø±ØµÙŠØ¯ ÙˆØ§Ø¶Ø­ Ù‚Ø¨Ù„ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª.",
  );
  app.querySelector("#leave-balance-form")?.addEventListener("submit", submitForm(async (values) => endpoints.saveLeaveBalance(values.employeeId, values), "ØªÙ… Ø­ÙØ¸ Ø±ØµÙŠØ¯ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©."));
}

async function renderTasks() {
  const [tasks, employees] = await Promise.all([endpoints.tasks().then(unwrap), endpoints.employees().then(unwrap)]);
  shell(
    `<section class="grid">
      <article class="panel span-12"><div class="panel-head"><div><h2>Ø§Ù„Ù…Ù‡Ø§Ù… Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠØ©</h2><p>ØªÙƒÙ„ÙŠÙ ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ù…Ù‡Ø§Ù… Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ† Ø¨Ø¯Ù„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø´ÙÙˆÙŠØ©.</p></div></div>
        <form id="task-form" class="form-grid compact-form">
          <label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId" required>${optionList(employees, "", "Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ¸Ù")}</select></label>
          <label>Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ù‡Ù…Ø©<input name="title" required /></label>
          <label>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©<select name="priority"><option value="LOW">Ù…Ù†Ø®ÙØ¶Ø©</option><option value="MEDIUM" selected>Ù…ØªÙˆØ³Ø·Ø©</option><option value="HIGH">Ø¹Ø§Ù„ÙŠØ©</option></select></label>
          <label>ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚<input name="dueDate" type="date" /></label>
          <label class="span-2">Ø§Ù„ØªÙØ§ØµÙŠÙ„<textarea name="description"></textarea></label>
          <div class="form-actions"><button class="button primary" type="submit">Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù‡Ù…Ø©</button></div>
        </form>
        ${table(["Ø§Ù„Ù…Ù‡Ù…Ø©", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚", "Ø¥Ø¬Ø±Ø§Ø¡"], tasks.map((task) => `<tr><td>${escapeHtml(task.title)}</td><td>${escapeHtml(task.employee?.fullName || "-")}</td><td>${badge(task.priority)}</td><td>${badge(task.status)}</td><td>${escapeHtml(task.dueDate || "-")}</td><td><button class="button ghost small" data-task-done="${escapeHtml(task.id)}">ØªÙ… Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²</button></td></tr>`))}
      </article>
    </section>`,
    "Ø§Ù„Ù…Ù‡Ø§Ù…",
    "Ù†Ø¸Ø§Ù… Ù…Ù‡Ø§Ù… Ø¯Ø§Ø®Ù„ÙŠ Ù…Ø±ØªØ¨Ø· Ø¨Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†.",
  );
  app.querySelector("#task-form")?.addEventListener("submit", submitForm((values) => endpoints.createTask(values), "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù…Ø© ÙˆØ¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø± Ù„Ù„Ù…ÙˆØ¸Ù."));
  app.querySelectorAll("[data-task-done]").forEach((btn) => btn.addEventListener("click", async () => { await endpoints.updateTask(btn.dataset.taskDone, { status: "DONE" }); setMessage("ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ù‡Ù…Ø©.", ""); renderTasks(); }));
}

async function renderDocuments() {
  const [docs, employees] = await Promise.all([endpoints.employeeDocuments().then(unwrap), endpoints.employees().then(unwrap)]);
  shell(
    `<section class="grid">
      <article class="panel span-12"><div class="panel-head"><div><h2>Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</h2><p>Ø£Ø±Ø´ÙØ© Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª ÙˆÙ…ØªØ§Ø¨Ø¹Ø© ØªØ§Ø±ÙŠØ® Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„Ø¨Ø·Ø§Ù‚Ø©/Ø§Ù„Ø¹Ù‚Ø¯/Ø£ÙŠ Ù…Ù„Ù Ù…Ù‡Ù….</p></div></div>
        <form id="doc-form" class="form-grid compact-form">
          <label>Ø§Ù„Ù…ÙˆØ¸Ù<select name="employeeId" required>${optionList(employees, "", "Ø§Ø®ØªØ± Ø§Ù„Ù…ÙˆØ¸Ù")}</select></label>
          <label>Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªÙ†Ø¯<input name="title" required /></label>
          <label>Ø§Ù„Ù†ÙˆØ¹<select name="documentType"><option value="ID_CARD">Ø¨Ø·Ø§Ù‚Ø©</option><option value="CONTRACT">Ø¹Ù‚Ø¯</option><option value="MEDICAL">Ø·Ø¨ÙŠ</option><option value="OTHER">Ø£Ø®Ø±Ù‰</option></select></label>
          <label>ÙŠÙ†ØªÙ‡ÙŠ ÙÙŠ<input name="expiresOn" type="date" /></label>
          <label>Ø±Ø§Ø¨Ø· Ø§Ù„Ù…Ù„Ù<input name="fileUrl" placeholder="Ø±Ø§Ø¨Ø· Ø®Ø§Øµ Ø£Ùˆ Signed URL" /></label>
          <label>Ù…Ù„Ø§Ø­Ø¸Ø§Øª<input name="notes" /></label>
          <div class="form-actions"><button class="button primary" type="submit">Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªÙ†Ø¯</button></div>
        </form>
        ${table(["Ø§Ù„Ù…Ø³ØªÙ†Ø¯", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø­Ø§Ù„Ø©", "ÙŠÙ†ØªÙ‡ÙŠ ÙÙŠ", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"], docs.map((doc) => `<tr><td>${doc.fileUrl ? `<a href="${escapeHtml(doc.fileUrl)}" target="_blank" rel="noopener">${escapeHtml(doc.title)}</a>` : escapeHtml(doc.title)}</td><td>${escapeHtml(doc.employee?.fullName || "-")}</td><td>${escapeHtml(doc.documentType || "-")}</td><td>${badge(doc.status || "ACTIVE")}</td><td>${escapeHtml(doc.expiresOn || "-")}</td><td>${escapeHtml(doc.notes || "")}</td></tr>`))}
      </article>
    </section>`,
    "Ù…Ø³ØªÙ†Ø¯Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†",
    "Ø£Ø±Ø´ÙŠÙ Ù…Ù†Ø¸Ù… Ù…Ø¹ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©.",
  );
  app.querySelector("#doc-form")?.addEventListener("submit", submitForm((values) => endpoints.createEmployeeDocument(values), "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø³ØªÙ†Ø¯."));
}

async function renderPermissionMatrix() {
  const data = unwrap(await endpoints.permissionMatrix());
  const roles = safeList(data.roles);
  const permissions = safeList(data.permissions);
  const firstRole = roles[0] || {};
  shell(
    `<section class="grid">
      <article class="panel span-12"><div class="panel-head"><div><h2>Ù…ØµÙÙˆÙØ© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª</h2><p>ØªØ­ÙƒÙ… ØªÙØµÙŠÙ„ÙŠ ÙÙŠ ØµÙ„Ø§Ø­ÙŠØ§Øª ÙƒÙ„ Ø¯ÙˆØ± Ø¯Ø§Ø®Ù„ Ø§Ù„Ù†Ø¸Ø§Ù….</p></div></div>
        <form id="matrix-form" class="matrix-form">
          <label>Ø§Ù„Ø¯ÙˆØ±<select name="roleId" id="matrix-role">${optionList(roles, firstRole.id, "Ø§Ø®ØªØ± Ø§Ù„Ø¯ÙˆØ±")}</select></label>
          <div class="permission-grid">${permissions.map((perm) => `<label class="permission-check"><input type="checkbox" name="permissions" value="${escapeHtml(perm.scope)}" ${safeList(firstRole.permissions).includes(perm.scope) ? "checked" : ""}/><span><strong>${escapeHtml(perm.name || perm.scope)}</strong><small>${escapeHtml(perm.scope)}</small></span></label>`).join("")}</div>
          <div class="form-actions"><button class="button primary" type="submit">Ø­ÙØ¸ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª</button></div>
        </form>
      </article>
    </section>`,
    "Ù…ØµÙÙˆÙØ© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª",
    "Ø¥Ø¯Ø§Ø±Ø© ØµÙ„Ø§Ø­ÙŠØ§Øª Ø§Ù„Ø£Ø¯ÙˆØ§Ø± Ø¨Ø·Ø±ÙŠÙ‚Ø© ÙˆØ§Ø¶Ø­Ø©.",
  );
  const applyRoleChecks = () => {
    const role = roles.find((item) => item.id === app.querySelector("#matrix-role")?.value) || {};
    app.querySelectorAll('input[name="permissions"]').forEach((input) => { input.checked = safeList(role.permissions).includes(input.value); });
  };
  app.querySelector("#matrix-role")?.addEventListener("change", applyRoleChecks);
  app.querySelector("#matrix-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const roleId = app.querySelector("#matrix-role").value;
    const permissions = [...app.querySelectorAll('input[name="permissions"]:checked')].map((input) => input.value);
    await endpoints.savePermissionMatrix({ roleId, permissions });
    setMessage("ØªÙ… Ø­ÙØ¸ Ù…ØµÙÙˆÙØ© Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª.", "");
    renderPermissionMatrix();
  });
}


async function renderQualityCenter() {
  const data = await endpoints.qualityCenter().then(unwrap).catch(() => ({ readiness: { score: 0, grade: "ØºÙŠØ± Ù…ØªØ§Ø­", issues: [] }, policy: {}, maintenanceRuns: [], escalations: [] }));
  const readiness = data.readiness || {};
  const issues = readiness.issues || [];
  const policy = data.policy || {};
  shell(
    `<section class="grid quality-center-page">
      <article class="panel span-12 accent-panel">
        <div class="panel-head">
          <div><h2>Ù…Ø±ÙƒØ² Ø§Ù„Ø¬ÙˆØ¯Ø© ÙˆØ§Ù„Ø¥ØµÙ„Ø§Ø­ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ</h2><p>ÙŠÙØ­Øµ Ø§Ù„ØªØ±Ø§Ø¨Ø· Ø¨ÙŠÙ† Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†ØŒ Ø§Ù„Ù‡ÙŠÙƒÙ„ Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØŒ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø©ØŒ Ø§Ù„Ø³ÙŠØ§Ø³Ø§ØªØŒ ÙˆØ§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª.</p></div>
          <div class="toolbar"><button class="button primary" id="run-maintenance">ØªØ´ØºÙŠÙ„ Ø¥ØµÙ„Ø§Ø­ Ø´Ø§Ù…Ù„ Ø§Ù„Ø¢Ù†</button><button class="button ghost" id="export-quality-report">ØªØµØ¯ÙŠØ± ØªÙ‚Ø±ÙŠØ± JSON</button></div>
        </div>
      </article>
      <article class="panel span-3"><span class="panel-kicker">Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ù†Ø¸Ø§Ù…</span><strong class="big-number">${escapeHtml(readiness.score ?? 0)}%</strong><p>${escapeHtml(readiness.grade || "-")}</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ù…Ø´Ø§ÙƒÙ„ Ø¹Ø§Ù„ÙŠØ©</span><strong class="big-number">${issues.filter((item) => item.severity === "HIGH").length}</strong><p>ØªØ­ØªØ§Ø¬ Ø¥ØµÙ„Ø§Ø­ ÙÙˆØ±ÙŠ</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ø·Ù„Ø¨Ø§Øª Ù…ØªØ£Ø®Ø±Ø©</span><strong class="big-number">${escapeHtml(readiness.staleWorkflow || 0)}</strong><p>SLA Ø£ÙƒØ«Ø± Ù…Ù† 48 Ø³Ø§Ø¹Ø©</p></article>
      <article class="panel span-3"><span class="panel-kicker">ØªÙˆÙ‚ÙŠØ¹ Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª</span><strong class="big-number">${escapeHtml(policy.percent ?? 100)}%</strong><p>${escapeHtml(policy.signed || 0)} Ù…Ù† ${escapeHtml(policy.totalRequired || 0)}</p></article>
      <article class="panel span-8"><h2>Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ Ø§Ù„Ù…ÙƒØªØ´ÙØ©</h2>${table(["Ø§Ù„Ø®Ø·ÙˆØ±Ø©", "Ø§Ù„Ù…Ø¬Ø§Ù„", "Ø§Ù„Ù…Ø´ÙƒÙ„Ø©", "Ø§Ù„ØªÙØ§ØµÙŠÙ„"], issues.map((item) => `<tr><td>${badge(item.severity)}</td><td>${escapeHtml(item.area)}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.detail || "-")}</td></tr>`))}</article>
      <article class="panel span-4"><h2>Ø¢Ø®Ø± Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØµÙŠØ§Ù†Ø©</h2>${table(["Ù‚Ø¨Ù„", "Ø¨Ø¹Ø¯", "Ø¥ØµÙ„Ø§Ø­Ø§Øª", "ØªØµØ¹ÙŠØ¯"], (data.maintenanceRuns || []).slice(0, 8).map((run) => `<tr><td>${escapeHtml(run.beforeScore ?? "-")}</td><td>${escapeHtml(run.afterScore ?? "-")}</td><td>${escapeHtml(run.repair?.fixed ?? 0)}</td><td>${escapeHtml(run.workflow?.escalated ?? 0)}</td></tr>`))}</article>
      <article class="panel span-12"><h2>Ø§Ù„ØªØµØ¹ÙŠØ¯Ø§Øª Ø§Ù„Ù…ÙØªÙˆØ­Ø©</h2>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø³Ø¨Ø¨", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], (data.escalations || []).slice(0, 50).map((item) => `<tr><td>${escapeHtml(item.sourceKind)}</td><td>${escapeHtml(item.employeeId)}</td><td>${escapeHtml(item.reason)}</td><td>${badge(item.status)}</td><td>${date(item.createdAt)}</td></tr>`))}</article>
    </section>`,
    "Ù…Ø±ÙƒØ² Ø§Ù„Ø¬ÙˆØ¯Ø© ÙˆØ§Ù„Ø¥ØµÙ„Ø§Ø­",
    "ØªØ´ØºÙŠÙ„ ØµÙŠØ§Ù†Ø© Ø°ÙƒÙŠØ© ÙˆÙØ­Øµ Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ù†Ø¸Ø§Ù….",
  );
  app.querySelector("#run-maintenance")?.addEventListener("click", async () => {
    if (!await confirmAction({ title: "ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ø´Ø§Ù…Ù„", message: "Ø³ÙŠØªÙ… Ø¥ØµÙ„Ø§Ø­ Ø§Ù„Ø±ÙˆØ§Ø¨Ø· Ø§Ù„Ù†Ø§Ù‚ØµØ© ÙˆØ¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨Ø§Øª Ù…Ø¤Ù‚ØªØ© Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø¨Ù„Ø§ Ø­Ø³Ø§Ø¨ ÙˆØªØµØ¹ÙŠØ¯ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø©.", confirmLabel: "ØªØ´ØºÙŠÙ„ Ø§Ù„Ø¢Ù†" })) return;
    const result = await endpoints.runMaintenance({ thresholdHours: 48 }).then(unwrap);
    setMessage(`ØªÙ… Ø§Ù„ØªØ´ØºÙŠÙ„: ${result.run?.repair?.fixed || 0} Ø¥ØµÙ„Ø§Ø­Ø§ØªØŒ ${result.run?.workflow?.escalated || 0} ØªØµØ¹ÙŠØ¯Ø§Øª.`, "");
    renderQualityCenter();
  });
  app.querySelector("#export-quality-report")?.addEventListener("click", () => downloadFile("quality-center-report.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8"));
}

async function renderPolicies() {
  const data = await endpoints.policies().then(unwrap).catch(() => ({ policies: [], summary: {}, acknowledgements: [] }));
  const policies = data.policies || [];
  shell(
    `<section class="grid policies-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª ÙˆØ§Ù„ØªÙˆÙ‚ÙŠØ¹Ø§Øª</h2><p>Ø¥Ø¯Ø§Ø±Ø© Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø¬Ù…Ø¹ÙŠØ© ÙˆØ¥Ø«Ø¨Ø§Øª Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ù„Ù‡Ø§.</p></div></div></article>
      <article class="panel span-3"><span class="panel-kicker">Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª</span><strong class="big-number">${escapeHtml(data.summary?.policies || policies.length)}</strong><p>ÙØ¹Ø§Ù„Ø© ÙˆÙ…Ø¤Ø±Ø´ÙØ©</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ø§Ù„ØªÙˆÙ‚ÙŠØ¹Ø§Øª</span><strong class="big-number">${escapeHtml(data.summary?.signed || 0)}</strong><p>ØªÙ…Øª Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ</span><strong class="big-number">${escapeHtml(data.summary?.missing || 0)}</strong><p>ØªØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ø§Ù„Ù†Ø³Ø¨Ø©</span><strong class="big-number">${escapeHtml(data.summary?.percent ?? 100)}%</strong><p>Ø§ÙƒØªÙ…Ø§Ù„ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù…</p></article>
      <article class="panel span-5">
        <h2>Ø³ÙŠØ§Ø³Ø© Ø¬Ø¯ÙŠØ¯Ø©</h2>
        <form id="policy-form" class="form-grid compact-form">
          <label>Ø§Ù„Ø¹Ù†ÙˆØ§Ù†<input name="title" required placeholder="Ù…Ø«Ø§Ù„: Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø­Ø¶ÙˆØ±" /></label>
          <label>Ø§Ù„ØªØµÙ†ÙŠÙ<select name="category"><option value="ATTENDANCE">Ø§Ù„Ø­Ø¶ÙˆØ±</option><option value="SECURITY">Ø§Ù„Ø£Ù…Ø§Ù†</option><option value="DISPUTES">Ø§Ù„Ø®Ù„Ø§ÙØ§Øª</option><option value="GENERAL">Ø¹Ø§Ù…</option></select></label>
          <label>Ø§Ù„Ø¥ØµØ¯Ø§Ø±<input name="version" value="1.0" /></label>
          <label>Ø§Ù„Ø­Ø§Ù„Ø©<select name="status"><option value="ACTIVE">ÙØ¹Ø§Ù„Ø©</option><option value="DRAFT">Ù…Ø³ÙˆØ¯Ø©</option><option value="ARCHIVED">Ø£Ø±Ø´ÙŠÙ</option></select></label>
          <label class="span-2">Ø§Ù„Ù†Øµ<textarea name="body" rows="6" required></textarea></label>
          <label class="checkbox-line span-2"><input type="checkbox" name="requiresAcknowledgement" checked /> ØªØ­ØªØ§Ø¬ ØªÙˆÙ‚ÙŠØ¹/Ù‚Ø±Ø§Ø¡Ø© Ù…Ù† Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</label>
          <div class="form-actions"><button class="button primary">Ø­ÙØ¸ Ø§Ù„Ø³ÙŠØ§Ø³Ø©</button></div>
        </form>
      </article>
      <article class="panel span-7"><h2>Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø­Ø§Ù„ÙŠØ©</h2>${table(["Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„ØªØµÙ†ÙŠÙ", "Ø§Ù„Ø¥ØµØ¯Ø§Ø±", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªÙˆÙ‚ÙŠØ¹"], policies.map((policy) => `<tr><td>${escapeHtml(policy.title)}</td><td>${escapeHtml(policy.category || "-")}</td><td>${escapeHtml(policy.version || "-")}</td><td>${badge(policy.status)}</td><td>${policy.requiresAcknowledgement === false ? "ØºÙŠØ± Ù…Ø·Ù„ÙˆØ¨" : "Ù…Ø·Ù„ÙˆØ¨"}</td></tr>`))}</article>
    </section>`,
    "Ø§Ù„Ø³ÙŠØ§Ø³Ø§Øª ÙˆØ§Ù„ØªÙˆÙ‚ÙŠØ¹Ø§Øª",
    "Ù…Ø±ÙƒØ² Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ."
  );
  app.querySelector("#policy-form")?.addEventListener("submit", submitForm(endpoints.savePolicy, "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø³ÙŠØ§Ø³Ø© ÙˆØ¥Ø®Ø·Ø§Ø± Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†."));
}

async function renderControlRoom() {
  const data = await endpoints.controlRoom().then(unwrap).catch(() => ({ cards: {}, readiness: {}, alerts: [], staleRequests: [], openTasks: [], dailyReports: [] }));
  const cards = data.cards || {};
  shell(
    `<section class="grid control-room-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>ØºØ±ÙØ© Ø§Ù„ØªØ­ÙƒÙ… ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©</h2><p>Ù„ÙˆØ­Ø© ÙˆØ§Ø­Ø¯Ø© ØªØ¹Ø±Ø¶ Ø£Ø®Ø·Ø± Ù…Ø§ ÙŠØ­ØªØ§Ø¬ Ù‚Ø±Ø§Ø±Ù‹Ø§ Ø§Ù„Ø¢Ù†: SLAØŒ Ø¬ÙˆØ¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§ØªØŒ Ø§Ù„Ù…Ù‡Ø§Ù…ØŒ Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ© ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª.</p></div><div class="toolbar"><button class="button primary" id="run-smart-audit">ØªØ­Ø¯ÙŠØ« Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø°ÙƒÙŠ</button><button class="button ghost" id="export-control-room">ØªØµØ¯ÙŠØ± JSON</button></div></div></article>
      <article class="panel span-2"><span class="panel-kicker">Ø¬Ø§Ù‡Ø²ÙŠØ©</span><strong class="big-number">${escapeHtml(cards.readiness ?? 0)}%</strong><p>${escapeHtml(data.readiness?.grade || "-")}</p></article>
      <article class="panel span-2"><span class="panel-kicker">ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù…ÙØªÙˆØ­Ø©</span><strong class="big-number">${escapeHtml(cards.openAlerts ?? 0)}</strong><p>ØªØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©</p></article>
      <article class="panel span-2"><span class="panel-kicker">Ø®Ø·ÙŠØ±Ø©</span><strong class="big-number">${escapeHtml(cards.highAlerts ?? 0)}</strong><p>Ø£ÙˆÙ„ÙˆÙŠØ© Ø¹Ø§Ù„ÙŠØ©</p></article>
      <article class="panel span-2"><span class="panel-kicker">Ø·Ù„Ø¨Ø§Øª Ù…ØªØ£Ø®Ø±Ø©</span><strong class="big-number">${escapeHtml(cards.staleRequests ?? 0)}</strong><p>Ø£ÙƒØ«Ø± Ù…Ù† 48 Ø³Ø§Ø¹Ø©</p></article>
      <article class="panel span-2"><span class="panel-kicker">Ù…Ù‡Ø§Ù… Ù…ÙØªÙˆØ­Ø©</span><strong class="big-number">${escapeHtml(cards.openTasks ?? 0)}</strong><p>Ù‚ÙŠØ¯ Ø§Ù„ØªÙ†ÙÙŠØ°</p></article>
      <article class="panel span-2"><span class="panel-kicker">ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…</span><strong class="big-number">${escapeHtml(cards.todayReports ?? 0)}</strong><p>${escapeHtml(cards.pendingReports ?? 0)} Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</p></article>
      <article class="panel span-7"><h2>Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©</h2>${table(["Ø§Ù„Ø®Ø·ÙˆØ±Ø©", "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†", "Ø§Ù„ØªÙØ§ØµÙŠÙ„", "Ø§Ù„Ù…Ø³Ø§Ø±", "Ø¥Ø¬Ø±Ø§Ø¡"], (data.alerts || []).slice(0, 60).map((alert) => `<tr><td>${badge(alert.severity)}</td><td>${escapeHtml(alert.title)}</td><td>${escapeHtml(alert.body || "-")}</td><td><button class="button ghost small" data-route="${escapeHtml(alert.route || "quality-center")}">ÙØªØ­</button></td><td>${alert.status === "OPEN" ? `<button class="button small" data-resolve-alert="${escapeHtml(alert.id)}">Ø¥ØºÙ„Ø§Ù‚</button>` : badge(alert.status)}</td></tr>`))}</article>
      <article class="panel span-5"><h2>Ø·Ù„Ø¨Ø§Øª Ù…ØªØ£Ø®Ø±Ø©</h2>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø¹Ù…Ø±", "Ø§Ù„Ø­Ø§Ù„Ø©"], (data.staleRequests || []).map((item) => `<tr><td>${escapeHtml(item.kindLabel || item.kind)}</td><td>${escapeHtml(item.employee?.fullName || item.employeeId || "-")}</td><td>${escapeHtml(item.ageHours || "48+")} Ø³Ø§Ø¹Ø©</td><td>${badge(item.status)}</td></tr>`))}</article>
      <article class="panel span-6"><h2>Ù…Ù‡Ø§Ù… Ù…ÙØªÙˆØ­Ø©</h2>${table(["Ø§Ù„Ù…Ù‡Ù…Ø©", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], (data.openTasks || []).slice(0, 30).map((task) => `<tr><td>${escapeHtml(task.title)}</td><td>${escapeHtml(task.employee?.fullName || "-")}</td><td>${badge(task.priority)}</td><td>${escapeHtml(task.dueDate || "-")}</td></tr>`))}</article>
      <article class="panel span-6"><h2>Ø¢Ø®Ø± Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ©</h2>${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„ÙŠÙˆÙ…", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„Ø¹ÙˆØ§Ø¦Ù‚"], (data.dailyReports || []).slice(0, 30).map((report) => `<tr><td>${escapeHtml(report.employee?.fullName || "-")}</td><td>${escapeHtml(report.reportDate || "-")}</td><td>${badge(report.status)}</td><td>${escapeHtml(report.blockers || "-")}</td></tr>`))}</article>
    </section>`,
    "ØºØ±ÙØ© Ø§Ù„ØªØ­ÙƒÙ…",
    "ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø°ÙƒÙŠØ© ÙˆÙ…ØªØ§Ø¨Ø¹Ø© ÙÙˆØ±ÙŠØ© Ù„Ø£Ø®Ø·Ø± Ù†Ù‚Ø§Ø· Ø§Ù„ØªØ´ØºÙŠÙ„.",
  );
  app.querySelector("#run-smart-audit")?.addEventListener("click", async () => { await endpoints.runSmartAudit(); setMessage("ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©.", ""); renderControlRoom(); });
  app.querySelector("#export-control-room")?.addEventListener("click", () => downloadFile("control-room.json", JSON.stringify(data, null, 2), "application/json;charset=utf-8"));
  app.querySelectorAll("[data-resolve-alert]").forEach((button) => button.addEventListener("click", async () => { await endpoints.resolveSmartAlert(button.dataset.resolveAlert, { note: "ØªÙ… Ø§Ù„Ø¥ØºÙ„Ø§Ù‚ Ù…Ù† ØºØ±ÙØ© Ø§Ù„ØªØ­ÙƒÙ…" }); setMessage("ØªÙ… Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡.", ""); renderControlRoom(); }));
}

async function renderDataCenter() {
  const data = await endpoints.dataCenter().then(unwrap).catch(() => ({ counts: {}, importBatches: [], backups: [] }));
  const counts = data.counts || {};
  shell(
    `<section class="grid data-center-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ù…Ø±ÙƒØ² Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø§Ù„Ø¢Ù…Ù†</h2><p>ØªØµØ¯ÙŠØ± Ù†Ø³Ø®Ø© ÙƒØ§Ù…Ù„Ø©ØŒ Ø§Ø®ØªØ¨Ø§Ø± Ù…Ù„Ù Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ù‚Ø¨Ù„ ØªØ·Ø¨ÙŠÙ‚Ù‡ØŒ ÙˆØ­ÙØ¸ Snapshot Ù‚Ø¨Ù„ Ø£ÙŠ Ø¹Ù…Ù„ÙŠØ© Ø­Ø³Ø§Ø³Ø©.</p></div><div class="toolbar"><button class="button primary" id="download-full-backup">ØªÙ†Ø²ÙŠÙ„ Backup ÙƒØ§Ù…Ù„</button></div></div></article>
      ${["employees","users","attendance","requests","documents","dailyReports","audits"].map((key) => `<article class="panel span-2"><span class="panel-kicker">${escapeHtml(key)}</span><strong class="big-number">${escapeHtml(counts[key] ?? 0)}</strong><p>Ø³Ø¬Ù„</p></article>`).join("")}
      <article class="panel span-6"><h2>Ø§Ø®ØªØ¨Ø§Ø± Ù…Ù„Ù Ø§Ø³ØªÙŠØ±Ø§Ø¯ JSON</h2><p>Ø¶Ø¹ Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ù†Ø³Ø®Ø© Ù‡Ù†Ø§ Ø£ÙˆÙ„Ù‹Ø§ØŒ ÙˆØ³ÙŠØ®Ø¨Ø±Ùƒ Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ Ù‚Ø¨Ù„ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚.</p><form id="validate-import-form" class="form-grid compact-form"><label class="span-2">JSON<textarea name="payload" rows="10" placeholder='{ "employees": [], "users": [] }'></textarea></label><div class="form-actions"><button class="button ghost" name="mode" value="validate">ÙØ­Øµ ÙÙ‚Ø·</button><button class="button danger" name="mode" value="import">Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø¨Ø¹Ø¯ Ø§Ù„ÙØ­Øµ</button></div></form><div id="import-result" class="message"></div></article>
      <article class="panel span-6"><h2>Ø¢Ø®Ø± Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ ÙˆØ§Ù„Ù†Ø³Ø®</h2>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„Ø¹Ø¯Ø¯", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], [...(data.importBatches || []).map((row) => ({ type: "Ø§Ø³ØªÙŠØ±Ø§Ø¯", count: row.employees || row.employeesCount || 0, date: row.createdAt })), ...(data.backups || []).map((row) => ({ type: row.title || "Backup", count: "-", date: row.createdAt }))].slice(0, 20).map((row) => `<tr><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.count)}</td><td>${date(row.date)}</td></tr>`))}</article>
    </section>`,
    "Ù…Ø±ÙƒØ² Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
    "Ø£Ø¯ÙˆØ§Øª Ø£Ù…Ø§Ù† Ù„Ù„ØªØµØ¯ÙŠØ± ÙˆØ§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ ÙˆÙØ­Øµ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.",
  );
  app.querySelector("#download-full-backup")?.addEventListener("click", async () => { const backup = await endpoints.exportFullBackup().then(unwrap); downloadFile(`ahla-shabab-backup-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8"); });
  app.querySelector("#validate-import-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const mode = event.submitter?.value || "validate";
    const box = app.querySelector("#import-result");
    try {
      const payload = JSON.parse(new FormData(event.currentTarget).get("payload") || "{}");
      const validation = await endpoints.validateImportBackup(payload).then(unwrap);
      if (mode === "import") {
        if (!await confirmAction({ title: "Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª", message: "Ø³ÙŠØªÙ… Ø­ÙØ¸ Backup Ù‚Ø¨Ù„ Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯ Ø«Ù… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø© Ø¹Ù„Ù‰ Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù…Ø­Ù„ÙŠ.", confirmLabel: "Ø§Ø³ØªÙŠØ±Ø§Ø¯" })) return;
        const result = await endpoints.importBackup(payload).then(unwrap);
        box.className = "message success"; box.textContent = `ØªÙ… Ø§Ù„Ø§Ø³ØªÙŠØ±Ø§Ø¯: ${result.counts?.employees || 0} Ù…ÙˆØ¸Ù.`;
      } else {
        box.className = validation.ok ? "message success" : "message error";
        box.textContent = `${validation.ok ? "ØµØ§Ù„Ø­" : "Ø¨Ù‡ Ø£Ø®Ø·Ø§Ø¡"}: ${[...(validation.issues || []), ...(validation.warnings || [])].join(" â€” ") || "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø´Ø§ÙƒÙ„ Ø¸Ø§Ù‡Ø±Ø©."}`;
      }
    } catch (error) { box.className = "message error"; box.textContent = error.message; }
  });
}

async function renderDailyReports() {
  const reports = await endpoints.dailyReports().then(unwrap).catch(() => []);
  shell(
    `<section class="grid daily-reports-page">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ© Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ†</h2><p>Ù…ØªØ§Ø¨Ø¹Ø© Ø¥Ù†Ø¬Ø§Ø²Ø§Øª Ø§Ù„ÙŠÙˆÙ… ÙˆØ§Ù„Ø¹ÙˆØ§Ø¦Ù‚ ÙˆØ®Ø·Ø© Ø§Ù„ØºØ¯ Ù„ÙƒÙ„ Ù…ÙˆØ¸Ù ÙˆÙ…Ø¯ÙŠØ±.</p></div><div class="toolbar"><button class="button ghost" id="export-daily-reports">ØªØµØ¯ÙŠØ± CSV</button></div></div></article>
      <article class="panel span-3"><span class="panel-kicker">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ</span><strong class="big-number">${reports.length}</strong><p>ØªÙ‚Ø±ÙŠØ±</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©</span><strong class="big-number">${reports.filter((r) => r.status === "SUBMITTED").length}</strong><p>ØªØ­ØªØ§Ø¬ Ù…Ø¯ÙŠØ±</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ø¨Ù‡Ø§ Ø¹ÙˆØ§Ø¦Ù‚</span><strong class="big-number">${reports.filter((r) => r.blockers).length}</strong><p>ØªØ­ØªØ§Ø¬ Ø¯Ø¹Ù…</p></article>
      <article class="panel span-3"><span class="panel-kicker">Ø§Ù„ÙŠÙˆÙ…</span><strong class="big-number">${reports.filter((r) => r.reportDate === new Date().toISOString().slice(0,10)).length}</strong><p>ØªÙ… Ø§Ù„Ø¥Ø±Ø³Ø§Ù„</p></article>
      <article class="panel span-12">${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„ÙŠÙˆÙ…", "Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²", "Ø§Ù„Ø¹ÙˆØ§Ø¦Ù‚", "Ø®Ø·Ø© Ø§Ù„ØºØ¯", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø¥Ø¬Ø±Ø§Ø¡"], reports.map((report) => `<tr><td>${escapeHtml(report.employee?.fullName || "-")}</td><td>${escapeHtml(report.reportDate || "-")}</td><td>${escapeHtml(report.achievements || "-")}</td><td>${escapeHtml(report.blockers || "-")}</td><td>${escapeHtml(report.tomorrowPlan || "-")}</td><td>${badge(report.status)}</td><td>${report.status === "SUBMITTED" ? `<button class="button small" data-review-report="${escapeHtml(report.id)}">Ù…Ø±Ø§Ø¬Ø¹Ø©</button>` : "-"}</td></tr>`))}</article>
    </section>`,
    "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠØ©",
    "Ø¥Ø¯Ø§Ø±Ø© ØªÙ‚Ø§Ø±ÙŠØ± Ø¥Ù†Ø¬Ø§Ø² Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„ÙŠÙˆÙ…ÙŠØ©.",
  );
  app.querySelector("#export-daily-reports")?.addEventListener("click", () => downloadFile("daily-reports.csv", `\ufeff${toCsv([["Ø§Ù„Ù…ÙˆØ¸Ù","Ø§Ù„ÙŠÙˆÙ…","Ø§Ù„Ø¥Ù†Ø¬Ø§Ø²","Ø§Ù„Ø¹ÙˆØ§Ø¦Ù‚","Ø®Ø·Ø© Ø§Ù„ØºØ¯","Ø§Ù„Ø­Ø§Ù„Ø©"], ...reports.map((r) => [r.employee?.fullName || "", r.reportDate || "", r.achievements || "", r.blockers || "", r.tomorrowPlan || "", r.status || ""])])}`, "text/csv;charset=utf-8"));
  app.querySelectorAll("[data-review-report]").forEach((button) => button.addEventListener("click", async () => { const comment = await askText({ title: "ØªØ¹Ù„ÙŠÙ‚ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©", message: "Ø§ÙƒØªØ¨ ØªØ¹Ù„ÙŠÙ‚ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© Ù„Ù„ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ.", defaultValue: "ØªÙ…Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©", confirmLabel: "Ø­ÙØ¸ Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©" }); if (comment === null) return; await endpoints.reviewDailyReport(button.dataset.reviewReport, { managerComment: comment }); setMessage("ØªÙ…Øª Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„ØªÙ‚Ø±ÙŠØ±.", ""); renderDailyReports(); }));
}

async function renderExecutiveMobile() {
  const params = routeParams();
  const employeeId = params.get("employeeId") || "";
  if (employeeId) {
    const detail = await endpoints.executiveEmployeeDetail(employeeId).then(unwrap);
    const employee = detail.employee || {};
    const today = detail.today || {};
    const loc = today.latestLocation || {};
    shell(`
      <section class="grid executive-mobile-view">
        <article class="panel span-12">
          <div class="panel-head">
            <div><h2>Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© â€” ${escapeHtml(employee.fullName || "Ù…ÙˆØ¸Ù")}</h2><p>ØµÙØ­Ø© Ù…ÙˆØ¨Ø§ÙŠÙ„ Ù…Ø®ØªØµØ±Ø© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ: Ø­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ…ØŒ Ø§Ù„Ø­Ø¶ÙˆØ±ØŒ Ø§Ù„Ø§Ù†ØµØ±Ø§ÙØŒ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø©ØŒ ÙˆØ§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ø£Ø®ÙŠØ±.</p></div>
            <div class="toolbar"><button class="button ghost" data-route="executive-mobile">ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</button><button class="button primary" data-request-live="${escapeHtml(employee.id || employeeId)}">Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø§Ù„Ø¢Ù†</button></div>
          </div>
          <div class="executive-detail-header">
            <div class="detail-avatar-side">
              ${avatar(employee, "large")}
              <div class="detail-status-badge">${badge(today.status || "ABSENT")}</div>
            </div>
            <div class="detail-info-side">
              <h2 class="detail-name">${escapeHtml(employee.fullName || "-")}</h2>
              <div class="detail-job-title">${escapeHtml(employee.jobTitle || "Ù…ÙˆØ¸Ù")}</div>
              <div class="detail-meta-tags">
                ${today.status === 'LEAVE' ? '<span class="tag warning">ÙÙŠ Ø¥Ø¬Ø§Ø²Ø© Ø±Ø³Ù…ÙŠØ©</span>' : ''}
                ${today.checkInAt ? `<span class="tag success">Ø­Ø¶Ø± Ø§Ù„Ø³Ø§Ø¹Ø© ${escapeHtml(date(today.checkInAt).split(' ').pop())}</span>` : '<span class="tag danger">Ù„Ù… ÙŠØ­Ø¶Ø± Ø¨Ø¹Ø¯</span>'}
              </div>
            </div>
          </div>
          <div class="metric-grid">
            <article class="metric"><span>Ø­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ…</span><strong>${escapeHtml(statusLabel(today.status))}</strong><small>${escapeHtml(today.day || "")}</small></article>
            <article class="metric"><span>ÙˆÙ‚Øª Ø§Ù„Ø­Ø¶ÙˆØ±</span><strong>${escapeHtml(date(today.checkInAt))}</strong><small>Ø£ÙˆÙ„ Ø¨ØµÙ…Ø© Ø­Ø¶ÙˆØ±</small></article>
            <article class="metric"><span>ÙˆÙ‚Øª Ø§Ù„Ø§Ù†ØµØ±Ø§Ù</span><strong>${escapeHtml(date(today.checkOutAt))}</strong><small>Ø¢Ø®Ø± Ø¨ØµÙ…Ø© Ø§Ù†ØµØ±Ø§Ù</small></article>
            <article class="metric"><span>Ø¢Ø®Ø± Ù…ÙˆÙ‚Ø¹</span><strong>${loc.latitude && loc.longitude ? formatMeters(loc.accuracyMeters) : "Ù„Ø§ ÙŠÙˆØ¬Ø¯"}</strong><small>${escapeHtml(date(loc.capturedAt || loc.respondedAt || loc.date))}</small></article>
          </div>
          ${loc.latitude && loc.longitude ? `<div class="message"><strong>Ø¢Ø®Ø± Ù…ÙˆÙ‚Ø¹:</strong> ${escapeHtml(loc.latitude)}, ${escapeHtml(loc.longitude)} â€” <a target="_blank" rel="noopener" href="https://www.google.com/maps?q=${escapeHtml(loc.latitude)},${escapeHtml(loc.longitude)}">ÙØªØ­ Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</a></div>` : `<div class="message warning">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…ÙˆÙ‚Ø¹ Ù…Ø¨Ø§Ø´Ø±/Ø¨ØµÙ…Ø© GPS Ù…Ø­ÙÙˆØ¸Ø© Ù„Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ¸Ù Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†.</div>`}
        </article>
        <article class="panel span-6"><h3>Ø¢Ø®Ø± 7 Ø£ÙŠØ§Ù… Ø­Ø¶ÙˆØ±</h3>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ÙˆÙ‚Øª", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"], (detail.attendance || []).slice(0, 12).map((row) => `<tr><td>${escapeHtml(statusLabel(row.type || row.action))}</td><td>${escapeHtml(date(row.eventAt || row.createdAt))}</td><td>${badge(row.geofenceStatus || row.status || "")}</td><td>${escapeHtml(row.notes || row.source || "")}</td></tr>`))}</article>
        <article class="panel span-6"><h3>Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª ÙˆØ§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§Øª</h3>${table(["Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ÙØªØ±Ø©", "Ø§Ù„Ø­Ø§Ù„Ø©"], [...(detail.leaves || []).map((row) => [row.leaveType?.name || row.leaveType || "Ø¥Ø¬Ø§Ø²Ø©", `${row.startDate || "-"} â†’ ${row.endDate || "-"}`, row.status]), ...(detail.missions || []).map((row) => [row.destinationName || row.title || "Ù…Ø£Ù…ÙˆØ±ÙŠØ©", `${row.plannedStart || "-"} â†’ ${row.plannedEnd || "-"}`, row.status])].slice(0, 12).map((row) => `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${badge(row[2])}</td></tr>`))}</article>
        <article class="panel span-12"><h3>Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</h3>${table(["Ø§Ù„ÙˆÙ‚Øª", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„Ø³Ø¨Ø¨", "Ø§Ù„Ø±Ø¯"], (detail.liveRequests || []).map((row) => `<tr><td>${escapeHtml(date(row.createdAt))}</td><td>${badge(row.status)}</td><td>${escapeHtml(row.reason || "")}</td><td>${escapeHtml(date(row.respondedAt))}</td></tr>`))}</article>
      </section>
    `, "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©", "ØªÙØ§ØµÙŠÙ„ Ù…ÙˆØ¸Ù Ù…Ù† Ø´Ø§Ø´Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ.");
    app.querySelector("[data-request-live]")?.addEventListener("click", async (event) => {
      const reason = await askText({ title: "Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", message: "Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø­ØªÙ‰ ÙŠØ¸Ù‡Ø± Ù„Ù„Ù…ÙˆØ¸Ù Ø¨ÙˆØ¶ÙˆØ­.", defaultValue: "Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø©", confirmLabel: "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨", required: true });
      if (!reason) return;
      try { await endpoints.requestLiveLocation(event.currentTarget.dataset.requestLive, { reason }); setMessage("تم إنشاء طلب الموقع، وقد لا يصل الإشعار الخارجي إذا كان غير مفعل.", ""); location.hash = `executive-mobile?employeeId=${encodeURIComponent(event.currentTarget.dataset.requestLive)}`; render(); } catch (error) { setMessage("", error.message || "تعذر طلب الموقع."); render(); }
    });
    return;
  }
  const data = await endpoints.executiveMobile().then(unwrap);
  const q = String(params.get("q") || "").trim();
  const employees = (data.employees || []).filter((employee) => !q || String(employee.fullName || "").includes(q) || String(employee.phone || "").includes(q));
  shell(`
    <section class="grid executive-mobile-view">
      <article class="panel span-12">
        <div class="panel-head"><div><h2>Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ© Ù„Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„</h2><p>ØµÙØ­Ø© Ø®Ø§ØµØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ ØªØ¹Ø±Ø¶ ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆØ­Ø§Ù„Ø© Ø§Ù„ÙŠÙˆÙ… ÙˆØ·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø± Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©.</p></div><div class="toolbar"><button class="button ghost" data-action="refresh">ØªØ­Ø¯ÙŠØ«</button></div></div>
        <div class="metric-grid">
          ${[["Ø¥Ø¬Ù…Ø§Ù„ÙŠ", data.counts?.total], ["Ø­Ø§Ø¶Ø±", data.counts?.present], ["Ù…ØªØ£Ø®Ø±", data.counts?.late], ["ØºØ§Ø¦Ø¨", data.counts?.absent], ["Ø¥Ø¬Ø§Ø²Ø©", data.counts?.onLeave], ["Ù…ÙˆØ§Ù‚Ø¹ Ù…Ø¹Ù„Ù‚Ø©", data.counts?.pendingLiveLocations]].map(([label, value]) => `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value ?? 0)}</strong><small>Ø§Ù„ÙŠÙˆÙ…</small></article>`).join("")}
        </div>
        <form class="toolbar" id="exec-search"><input name="q" placeholder="Ø¨Ø­Ø« Ø¨Ø§Ø³Ù… Ø§Ù„Ù…ÙˆØ¸Ù Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ" value="${escapeHtml(q)}" /><button class="button ghost" type="submit">Ø¨Ø­Ø«</button></form>
      </article>
      <article class="panel span-12"><div class="employee-card-grid">
        ${employees.map((employee) => `
          <article class="mini-card executive-employee-card">
            <div class="card-status-corner">${badge(employee.today?.status || "ABSENT")}</div>
            <div class="card-avatar-box">
              ${avatar(employee, "large")}
            </div>
            <div class="card-info-box">
              <strong class="emp-name">${escapeHtml(employee.fullName || "-")}</strong>
              <div class="emp-job-title">${escapeHtml(employee.jobTitle || "Ù…ÙˆØ¸Ù")}</div>
            </div>
            <div class="card-actions-row">
              <button class="button primary" data-request-live="${escapeHtml(employee.id)}">Ø§Ø±Ø³Ø§Ù„ Ù…ÙˆÙ‚Ø¹</button>
              <button class="button ghost" data-view-exec="${escapeHtml(employee.id)}">Ø§Ù„ØªÙØ§ØµÙŠÙ„</button>
            </div>
          </article>
        `).join("") || `<div class="empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬.</div>`}
      </div></article>
    </section>
  `, "Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©", "ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙÙŠ Ø´Ø§Ø´Ø© Ù…ÙˆØ¨Ø§ÙŠÙ„ ØªÙ†ÙÙŠØ°ÙŠØ©.");
  app.querySelector("#exec-search")?.addEventListener("submit", (event) => { event.preventDefault(); const values = readForm(event.currentTarget, { passwordPolicy: "none" }); location.hash = `executive-mobile?q=${encodeURIComponent(values.q || "")}`; });
  app.querySelectorAll("[data-view-exec]").forEach((button) => button.addEventListener("click", () => { location.hash = `executive-mobile?employeeId=${encodeURIComponent(button.dataset.viewExec)}`; }));
  app.querySelectorAll("[data-request-live]").forEach((button) => button.addEventListener("click", async () => {
    if (button.disabled) return;
    const reason = await askText({ title: "Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", message: "Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø­ØªÙ‰ ÙŠØ¸Ù‡Ø± Ù„Ù„Ù…ÙˆØ¸Ù Ø¨ÙˆØ¶ÙˆØ­.", defaultValue: "Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø©", confirmLabel: "Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø·Ù„Ø¨", required: true });
    if (!reason) return;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„...";
    try {
      await endpoints.requestLiveLocation(button.dataset.requestLive, { reason });
      setMessage("تم إنشاء طلب الموقع، وقد لا يصل الإشعار الخارجي إذا كان غير مفعل.", "");
      renderExecutiveMobile();
    } catch (error) {
      setMessage("", error.message || "ØªØ¹Ø°Ø± Ø·Ù„Ø¨ Ø§Ù„Ù…ÙˆÙ‚Ø¹.");
      button.disabled = false;
      button.textContent = originalText;
    }
  }));
}

async function renderSensitiveApprovals() {
  const data = await endpoints.sensitiveApprovals().then(unwrap).catch(() => ({ rows: [], counts: {} }));
  const rows = data.rows || [];
  const counts = data.counts || {};
  shell(
    `<section class="grid approvals-page">
      <article class="panel span-12">
        <div class="panel-head"><div><h2>Ù…Ø±ÙƒØ² Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª Ø§Ù„Ø­Ø³Ø§Ø³Ø©</h2><p>Ø£ÙŠ Ø­Ø°Ù Ø£Ùˆ ØªØ¹Ø·ÙŠÙ„ Ø­Ø³Ø§Ø³ ÙŠØªØ­ÙˆÙ„ Ø¥Ù„Ù‰ Ø·Ù„Ø¨ Ø§Ø¹ØªÙ…Ø§Ø¯ ØªÙ†ÙÙŠØ°ÙŠ Ø¨Ø¯Ù„ Ø§Ù„ØªÙ†ÙÙŠØ° Ø§Ù„Ù…Ø¨Ø§Ø´Ø±ØŒ Ù„Ø­Ù…Ø§ÙŠØ© Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆÙ…Ù†Ø¹ Ø§Ù„Ø£Ø®Ø·Ø§Ø¡.</p></div><div class="toolbar"><button class="button ghost" data-action="refresh">ØªØ­Ø¯ÙŠØ«</button></div></div>
        <div class="metric-grid">
          ${[["Ø¥Ø¬Ù…Ø§Ù„ÙŠ", counts.total || 0], ["Ù…Ø¹Ù„Ù‚", counts.PENDING || 0], ["Ù…Ù†ÙØ°", counts.EXECUTED || 0], ["Ù…Ø±ÙÙˆØ¶", counts.REJECTED || 0]].map(([label, value]) => `<article class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª</small></article>`).join("")}
        </div>
      </article>
      <article class="panel span-12">
        ${table(["Ø§Ù„Ø·Ù„Ø¨", "Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù", "Ø§Ù„Ø·Ø§Ù„Ø¨", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ÙˆÙ‚Øª", "Ø¥Ø¬Ø±Ø§Ø¡"], rows.map((row) => `
          <tr>
            <td><strong>${escapeHtml(row.title || row.actionType)}</strong><small>${escapeHtml(row.summary || "")}</small></td>
            <td>${escapeHtml(row.employee?.fullName || row.targetId || "-")}</td>
            <td>${escapeHtml(row.requestedByName || "-")}</td>
            <td>${badge(row.status || "PENDING")}</td>
            <td>${escapeHtml(date(row.createdAt || row.requestedAt))}</td>
            <td>${row.status === "PENDING" ? `<button class="button primary" data-approve-sensitive="${escapeHtml(row.id)}">Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØªÙ†ÙÙŠØ°</button><button class="button danger" data-reject-sensitive="${escapeHtml(row.id)}">Ø±ÙØ¶</button>` : `<small>${escapeHtml(row.decisionNote || row.executedAt || "ØªÙ…Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©")}</small>`}</td>
          </tr>`))}
      </article>
    </section>`,
    "Ø§Ø¹ØªÙ…Ø§Ø¯Ø§Øª Ø­Ø³Ø§Ø³Ø©",
    "Ø§Ø¹ØªÙ…Ø§Ø¯ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„ØªÙŠ Ù‚Ø¯ ØªØ¤Ø«Ø± Ø¹Ù„Ù‰ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø£Ùˆ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª.",
  );
  app.querySelectorAll("[data-approve-sensitive]").forEach((button) => button.addEventListener("click", async () => {
    const note = await askText({ title: "Ù…Ù„Ø§Ø­Ø¸Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯", message: "Ø§ÙƒØªØ¨ Ù…Ù„Ø§Ø­Ø¸Ø© Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØ§Ù„ØªÙ†ÙÙŠØ°.", defaultValue: "Ù…Ø¹ØªÙ…Ø¯ Ù…Ù† Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©", confirmLabel: "Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØªÙ†ÙÙŠØ°" }) || "Ù…Ø¹ØªÙ…Ø¯";
    try { await endpoints.decideSensitiveApproval(button.dataset.approveSensitive, { decision: "approve", note, execute: true }); setMessage("ØªÙ… Ø§Ø¹ØªÙ…Ø§Ø¯ ÙˆØªÙ†ÙÙŠØ° Ø§Ù„Ø·Ù„Ø¨.", ""); renderSensitiveApprovals(); } catch (error) { setMessage("", error.message || "ØªØ¹Ø°Ø± ØªÙ†ÙÙŠØ° Ø§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯."); renderSensitiveApprovals(); }
  }));
  app.querySelectorAll("[data-reject-sensitive]").forEach((button) => button.addEventListener("click", async () => {
    const note = await askText({ title: "Ø³Ø¨Ø¨ Ø§Ù„Ø±ÙØ¶", message: "Ø§ÙƒØªØ¨ Ø³Ø¨Ø¨ Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø­Ø³Ø§Ø³.", defaultValue: "ØºÙŠØ± Ù…Ù†Ø§Ø³Ø¨ Ù„Ù„ØªÙ†ÙÙŠØ°", confirmLabel: "Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨" }) || "Ù…Ø±ÙÙˆØ¶";
    try { await endpoints.decideSensitiveApproval(button.dataset.rejectSensitive, { decision: "reject", note, execute: false }); setMessage("ØªÙ… Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨.", ""); renderSensitiveApprovals(); } catch (error) { setMessage("", error.message || "ØªØ¹Ø°Ø± Ø±ÙØ¶ Ø§Ù„Ø·Ù„Ø¨."); renderSensitiveApprovals(); }
  }));
}

async function renderGeneric(title, description, loader) {
  const rows = unwrap(await loader());
  shell(`<section class="grid"><article class="panel"><h2>${escapeHtml(title)}</h2>${table(["Ø§Ù„Ù…Ø¹Ø±Ù", "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†/Ø§Ù„Ø§Ø³Ù…", "Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø§Ù„ØªØ§Ø±ÙŠØ®"], rows.map((item) => `<tr><td>${escapeHtml(item.id || "-")}</td><td>${escapeHtml(item.title || item.name || item.fullName || item.key || "-")}</td><td>${escapeHtml(item.employee?.fullName || "-")}</td><td>${badge(item.status || item.type || "-")}</td><td>${date(item.createdAt || item.updatedAt || item.date)}</td></tr>`))}</article></section>`, title, description);
}

function submitForm(handler, successMessage) {
  return async (event) => {
    event.preventDefault();
    try {
      await handler(readForm(event.currentTarget));
      setMessage(successMessage, "");
      render();
    } catch (error) {
      setMessage("", error.message);
      render();
    }
  };
}

async function attendanceExportRows() {
  const events = await endpoints.attendanceEvents().then(unwrap);
  return events.map((event) => [event.employee?.fullName || event.employeeId, statusLabel(event.type), date(event.eventAt), event.source || "-", statusLabel(event.geofenceStatus), event.notes || ""]);
}

async function exportAttendanceCsv() {
  const headers = ["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø§Ù„Ù…ØµØ¯Ø±", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"];
  downloadFile("attendance-report.csv", `\ufeff${toCsv([headers, ...(await attendanceExportRows())])}`, "text/csv;charset=utf-8");
}

async function exportAttendanceExcel() {
  exportHtmlTable("attendance-report.xls", ["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø§Ù„Ù…ØµØ¯Ø±", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"], await attendanceExportRows());
}

async function printAttendanceReport() {
  printReport("ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø§Ù†ØµØ±Ø§Ù", ["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ù†ÙˆØ¹", "Ø§Ù„ØªØ§Ø±ÙŠØ®", "Ø§Ù„Ù…ØµØ¯Ø±", "Ø§Ù„Ù…ÙˆÙ‚Ø¹", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"], await attendanceExportRows());
}

function smartStatusLabel(value = "") {
  const map = { PRESENT: "Ø­Ø§Ø¶Ø±", LATE: "Ù…ØªØ£Ø®Ø±", ABSENT_TEMP: "ØºØ§Ø¦Ø¨ Ù…Ø¤Ù‚ØªÙ‹Ø§", ABSENT: "ØºØ§Ø¦Ø¨", EARLY_EXIT: "Ø®Ø±ÙˆØ¬ Ù…Ø¨ÙƒØ±", MISSING_CHECKOUT: "Ù†Ø³ÙŠØ§Ù† Ø§Ù†ØµØ±Ø§Ù", REVIEW: "Ù…Ø±Ø§Ø¬Ø¹Ø©", ON_LEAVE: "Ø¥Ø¬Ø§Ø²Ø©", ON_MISSION: "Ù…Ø£Ù…ÙˆØ±ÙŠØ©", ABSENT_PENDING: "Ù„Ù… ÙŠØ­Ø¶Ø± Ø¨Ø¹Ø¯" };
  return map[value] || statusLabel(value);
}

async function renderSmartAttendance() {
  const [rulesData, runData] = await Promise.all([
    endpoints.smartAttendanceRules().then(unwrap).catch(() => ({ rules: {} })),
    endpoints.runSmartAttendance({ date: todayIso() }).then(unwrap).catch(() => ({ rows: [], counts: {} })),
  ]);
  const rules = rulesData.rules || {};
  const rows = runData.rows || [];
  shell(`
    <section class="stack">
      <article class="panel accent-panel">
        <div class="panel-head"><div><h2>Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø°ÙƒÙŠØ©</h2><p>ØªØ­Ø¯ÙŠØ¯ Ø§Ù„ØªØ£Ø®ÙŠØ± ÙˆØ§Ù„ØºÙŠØ§Ø¨ Ø§Ù„Ù…Ø¤Ù‚Øª ÙˆØ§Ù„Ø®Ø±ÙˆØ¬ Ø§Ù„Ù…Ø¨ÙƒØ± ÙˆÙ†Ø³ÙŠØ§Ù† Ø§Ù„Ø§Ù†ØµØ±Ø§Ù ÙˆØªÙƒØ±Ø§Ø± Ø§Ù„Ø¨ØµÙ…Ø§Øª Ø§Ù„Ù…Ø´Ø¨ÙˆÙ‡Ø©.</p></div><button class="button primary" data-run-smart-attendance>ØªØ´ØºÙŠÙ„ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¢Ù†</button></div>
        <form class="form-grid" id="smart-rules-form">
          <label>Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ø¯ÙˆØ§Ù…<input type="time" name="shiftStart" value="${escapeHtml(rules.shiftStart || '10:00')}" /></label>
          <label>Ø§Ø¹ØªØ¨Ø§Ø± ØºÙŠØ§Ø¨ Ù…Ø¤Ù‚Øª Ø¨Ø¹Ø¯<input type="time" name="absentAfter" value="${escapeHtml(rules.absentAfter || '11:00')}" /></label>
          <label>Ø§Ù„Ø®Ø±ÙˆØ¬ Ø§Ù„Ù…Ø¨ÙƒØ± Ù‚Ø¨Ù„<input type="time" name="earlyExitBefore" value="${escapeHtml(rules.earlyExitBefore || '17:00')}" /></label>
          <label>Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ø¯ÙˆØ§Ù…<input type="time" name="shiftEnd" value="${escapeHtml(rules.shiftEnd || '18:00')}" /></label>
          <label>Ù†Ø§ÙØ°Ø© Ø§Ù„ØªÙƒØ±Ø§Ø± Ø§Ù„Ù…Ø´Ø¨ÙˆÙ‡ Ø¨Ø§Ù„Ø¯Ù‚Ø§Ø¦Ù‚<input type="number" min="1" name="duplicateWindowMinutes" value="${escapeHtml(rules.duplicateWindowMinutes || 10)}" /></label>
          <label>ØªÙ‚Ø±ÙŠØ± Ø¢Ø®Ø± Ø§Ù„ÙŠÙˆÙ… ÙÙŠ<input type="time" name="endOfDayReportAt" value="${escapeHtml(rules.endOfDayReportAt || '19:00')}" /></label>
          <label class="check-row"><input type="checkbox" name="notifyManagerOnAbsence" ${rules.notifyManagerOnAbsence !== false ? 'checked' : ''} /> Ø¥Ø®Ø·Ø§Ø± Ø§Ù„Ù…Ø¯ÙŠØ± Ø¹Ù†Ø¯ Ø§Ù„ØºÙŠØ§Ø¨/Ø§Ù„Ù…Ø´ÙƒÙ„Ø©</label>
          <button class="button primary" type="submit">Ø­ÙØ¸ Ø§Ù„Ù‚ÙˆØ§Ø¹Ø¯</button>
        </form>
      </article>
      <article class="panel">
        <div class="panel-head"><div><h2>ØªØ­Ù„ÙŠÙ„ Ø§Ù„ÙŠÙˆÙ…</h2><p>Ø¢Ø®Ø± ØªØ´ØºÙŠÙ„: ${escapeHtml(date(runData.run?.createdAt || new Date().toISOString()))}</p></div><button class="button ghost" data-generate-eod>ØªÙ‚Ø±ÙŠØ± ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¢Ø®Ø± Ø§Ù„ÙŠÙˆÙ…</button></div>
        <div class="mini-stats">${Object.entries(runData.counts || {}).map(([k,v]) => `<div><span>${escapeHtml(smartStatusLabel(k))}</span><strong>${escapeHtml(v)}</strong></div>`).join('')}</div>
        ${table(["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø­Ø¶ÙˆØ±", "Ø§Ù†ØµØ±Ø§Ù", "Ù…Ù„Ø§Ø­Ø¸Ø§Øª"], rows.map((row) => `<tr><td class="person-cell">${avatar(row.employee, 'tiny')}<span>${escapeHtml(row.employee?.fullName || row.employeeId)}</span></td><td>${badge(smartStatusLabel(row.status))}</td><td>${date(row.firstCheckInAt)}</td><td>${date(row.lastCheckOutAt)}</td><td>${escapeHtml(row.recommendation || '')}<br><small>${escapeHtml((row.flags || []).join(' / '))}</small></td></tr>`))}
      </article>
    </section>`,
    "Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø°ÙƒÙŠØ©",
    "ØªØ´ØºÙŠÙ„ ØªÙ„Ù‚Ø§Ø¦ÙŠ ÙˆÙ…Ù†Ø·Ù‚ÙŠ Ù„ÙƒÙ„ Ø­Ø§Ù„Ø§Øª Ø§Ù„Ø­Ø¶ÙˆØ± ØºÙŠØ± Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠØ©.",
  );
  app.querySelector('#smart-rules-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = readForm(event.currentTarget);
    values.notifyManagerOnAbsence = Boolean(event.currentTarget.querySelector('[name="notifyManagerOnAbsence"]')?.checked);
    await endpoints.saveSmartAttendanceRules(values);
    setMessage('ØªÙ… Ø­ÙØ¸ Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø°ÙƒÙŠØ©.', '');
    renderSmartAttendance();
  });
  app.querySelector('[data-run-smart-attendance]')?.addEventListener('click', async () => {
    await endpoints.runSmartAttendance({ date: todayIso() });
    setMessage('ØªÙ… ØªØ´ØºÙŠÙ„ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ø°ÙƒÙŠ ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ù„Ø§Ø²Ù…Ø©.', '');
    renderSmartAttendance();
  });
  app.querySelector('[data-generate-eod]')?.addEventListener('click', async () => {
    const report = unwrap(await endpoints.endOfDayReport({ date: todayIso() }));
    setMessage(`ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ ØªÙ‚Ø±ÙŠØ± Ø¢Ø®Ø± Ø§Ù„ÙŠÙˆÙ…: ${report.title}`, '');
    renderSmartAttendance();
  });
}

async function renderExecutivePdfReports() {
  shell(`
    <section class="grid">
      <article class="panel span-12 accent-panel"><div class="panel-head"><div><h2>ØªÙ‚Ø§Ø±ÙŠØ± ØªÙ†ÙÙŠØ°ÙŠØ© PDF Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ</h2><p>ØªØµØ¯ÙŠØ± ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ… Ø£Ùˆ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø£Ùˆ Ø§Ù„Ø´Ù‡Ø± Ø¨ØµÙŠØºØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ø·Ø¨Ø§Ø¹Ø© PDF Ù…Ù† Ø§Ù„Ù…ØªØµÙØ­.</p></div></div>
        <div class="quick-action-grid"><button class="button primary" data-exec-report="daily">ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ…</button><button class="button ghost" data-exec-report="weekly">ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹</button><button class="button ghost" data-exec-report="monthly">ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø±</button></div>
      </article>
      <article class="panel span-12"><h2>Ù…Ø­ØªÙˆÙ‰ Ø§Ù„ØªÙ‚Ø±ÙŠØ±</h2><p>ÙŠØ´Ù…Ù„ Ø§Ù„Ø­Ø¶ÙˆØ±ØŒ Ø§Ù„ØºÙŠØ§Ø¨ØŒ Ø§Ù„ØªØ£Ø®ÙŠØ±ØŒ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§ØªØŒ Ø§Ù„Ù…Ø£Ù…ÙˆØ±ÙŠØ§ØªØŒ Ø§Ù„Ù…Ø´Ø§ÙƒÙ„ Ø§Ù„Ù…ÙØªÙˆØ­Ø©ØŒ ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©.</p></article>
    </section>
  `, "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ PDF", "Ø·Ø¨Ø§Ø¹Ø© ÙˆØ­ÙØ¸ ØªÙ‚Ø§Ø±ÙŠØ± ØªÙ†ÙÙŠØ°ÙŠØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ.");
  app.querySelectorAll('[data-exec-report]').forEach((button) => button.addEventListener('click', async () => {
    const period = button.dataset.execReport;
    const data = unwrap(await endpoints.executivePdfReportData({ period }));
    const title = period === 'daily' ? 'ØªÙ‚Ø±ÙŠØ± Ø§Ù„ÙŠÙˆÙ… Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ' : period === 'weekly' ? 'ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹ Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ' : 'ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø´Ù‡Ø± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ';
    const report = data.report || {};
    const summary = `<div class="summary"><div><span>Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†</span><strong>${report.totals?.employees || 0}</strong></div><div><span>Ø­Ø§Ø¶Ø±</span><strong>${report.totals?.present || 0}</strong></div><div><span>ØºØ§Ø¦Ø¨</span><strong>${report.totals?.absent || 0}</strong></div><div><span>ÙŠØ­ØªØ§Ø¬ Ù…Ø±Ø§Ø¬Ø¹Ø©</span><strong>${report.totals?.review || 0}</strong></div></div>`;
    printBrandedReport(title, summary, ["Ø§Ù„Ù…ÙˆØ¸Ù", "Ø§Ù„Ø­Ø§Ù„Ø©", "Ø­Ø¶ÙˆØ±", "Ø§Ù†ØµØ±Ø§Ù", "ØªÙˆØµÙŠØ©"], (report.rows || []).map((row) => [row.employeeName, smartStatusLabel(row.status), date(row.firstCheckInAt), date(row.lastCheckOutAt), row.recommendation || '']));
  }));
}

async function renderEmployeeArchive() {
  const employees = await endpoints.employees().then(unwrap).catch(() => []);
  const params = new URLSearchParams((state.route || '').split('?')[1] || '');
  const selectedId = params.get('id') || employees[0]?.id || '';
  const archive = selectedId ? await endpoints.employeeArchive(selectedId).then(unwrap).catch((error) => ({ error: error.message })) : null;
  shell(`
    <section class="stack">
      <article class="panel"><div class="panel-head"><div><h2>Ø£Ø±Ø´ÙŠÙ Ø§Ù„Ù…ÙˆØ¸Ù Ø§Ù„ÙƒØ§Ù…Ù„</h2><p>Ù…Ù„Ù HR Ù…ØªÙƒØ§Ù…Ù„: Ø¨ÙŠØ§Ù†Ø§ØªØŒ Ø­Ø¶ÙˆØ±ØŒ Ø¥Ø¬Ø§Ø²Ø§ØªØŒ Ù…Ù‡Ø§Ù…ØŒ Ù…Ø³ØªÙ†Ø¯Ø§ØªØŒ Ù…Ø´Ø§ÙƒÙ„ØŒ ØªÙ‚ÙŠÙŠÙ…Ø§Øª ÙˆØ³Ø¬Ù„ ØªØ¯Ù‚ÙŠÙ‚.</p></div><button class="button ghost" data-print-archive>Ø·Ø¨Ø§Ø¹Ø© Ù…Ù„Ù Ø§Ù„Ù…ÙˆØ¸Ù PDF</button></div>
        <form class="filters" id="archive-filter"><select name="employeeId">${optionList(employees.map((e) => ({ id: e.id, name: e.fullName })), selectedId, 'Ø§Ø®ØªØ± Ù…ÙˆØ¸Ù')}</select><button class="button primary">ÙØªØ­ Ø§Ù„Ø£Ø±Ø´ÙŠÙ</button></form>
      </article>
      ${archive?.error ? `<article class="panel"><div class="message error">${escapeHtml(archive.error)}</div></article>` : archive ? `
      <article class="panel profile-card"><div class="person-cell large">${avatar(archive.employee, 'large')}<span><strong>${escapeHtml(archive.employee?.fullName || '')}</strong><small>${escapeHtml(archive.employee?.jobTitle || '')}</small></span></div><div class="mini-stats"><div><span>Ø¨ØµÙ…Ø§Øª</span><strong>${archive.summary?.attendanceEvents || 0}</strong></div><div><span>ØºÙŠØ§Ø¨</span><strong>${archive.summary?.absences || 0}</strong></div><div><span>ØªØ£Ø®ÙŠØ± Ø¨Ø§Ù„Ø¯Ù‚Ø§Ø¦Ù‚</span><strong>${archive.summary?.lateMinutes || 0}</strong></div><div><span>Ù…Ù‡Ø§Ù… Ù…ÙØªÙˆØ­Ø©</span><strong>${archive.summary?.openTasks || 0}</strong></div></div></article>
      <article class="panel"><h2>Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…ÙŠ</h2>${table(['Ø§Ù„ÙŠÙˆÙ…','Ø§Ù„Ø­Ø§Ù„Ø©','Ø­Ø¶ÙˆØ±','Ø§Ù†ØµØ±Ø§Ù','Ù…Ù„Ø§Ø­Ø¸Ø§Øª'], (archive.daily || []).slice(0,30).map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${badge(smartStatusLabel(row.smartStatus || row.status))}</td><td>${date(row.firstCheckInAt)}</td><td>${date(row.lastCheckOutAt)}</td><td>${escapeHtml(row.recommendation || '')}</td></tr>`))}</article>
      <article class="panel"><h2>Ø§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª</h2>${table(['Ø§Ù„Ù†ÙˆØ¹','Ø§Ù„Ø¹Ù†ÙˆØ§Ù†','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„ØªØ§Ø±ÙŠØ®'], [...(archive.leaves||[]).map(i=>['Ø¥Ø¬Ø§Ø²Ø©', i.leaveType || i.reason || '-', i.status, i.createdAt || i.startDate]), ...(archive.missions||[]).map(i=>['Ù…Ø£Ù…ÙˆØ±ÙŠØ©', i.title || i.destinationName || '-', i.status, i.createdAt || i.plannedStart]), ...(archive.documents||[]).map(i=>['Ù…Ø³ØªÙ†Ø¯', i.title || i.fileName || '-', i.status, i.expiresOn])].map((row)=>`<tr>${row.map((c)=>`<td>${escapeHtml(c || '-')}</td>`).join('')}</tr>`))}</article>
      <article class="panel"><h2>Ø§Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª</h2>${table(['Ø§Ù„Ø´Ù‡Ø±/Ø§Ù„Ø¯ÙˆØ±Ø©','Ø§Ù„Ø­Ø¶ÙˆØ±','Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ','Ø§Ù„Ø­Ø§Ù„Ø©'], (archive.kpi || []).slice(0,20).map((row) => `<tr><td>${escapeHtml(row.month || row.cycleId || '-')}</td><td>${escapeHtml(row.attendanceScore || 0)}</td><td>${escapeHtml(row.totalScore || 0)}</td><td>${badge(row.status || 'DRAFT')}</td></tr>`))}</article>` : `<article class="panel"><div class="empty-state">Ø§Ø®ØªØ± Ù…ÙˆØ¸ÙÙ‹Ø§ Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø£Ø±Ø´ÙŠÙ.</div></article>`}
    </section>
  `, "Ø£Ø±Ø´ÙŠÙ Ù…ÙˆØ¸Ù", "Ù…Ù„Ù Ø´Ø§Ù…Ù„ Ù„ÙƒÙ„ Ù…ÙˆØ¸Ù.");
  app.querySelector('#archive-filter')?.addEventListener('submit', (event) => { event.preventDefault(); const values = readForm(event.currentTarget); location.hash = `employee-archive?id=${encodeURIComponent(values.employeeId)}`; });
  app.querySelector('[data-print-archive]')?.addEventListener('click', () => window.print());
}

async function renderSmartAlerts() {
  const data = await endpoints.smartAdminAlerts().then(unwrap).catch(() => ({ alerts: [] }));
  const alerts = data.alerts || [];
  shell(`<section class="panel"><div class="panel-head"><div><h2>Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ© Ù„Ù„Ø¥Ø¯Ø§Ø±Ø©</h2><p>ØªÙ†Ø¨ÙŠÙ‡Ø§Øª ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ø¹Ù† Ø§Ù„ØºÙŠØ§Ø¨ØŒ Ø§Ù„ØªØ£Ø®ÙŠØ±ØŒ Ù†Ø³ÙŠØ§Ù† Ø§Ù„Ø§Ù†ØµØ±Ø§ÙØŒ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§ØªØŒ ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø©.</p></div><button class="button primary" data-refresh-smart-alerts>ØªØ­Ø¯ÙŠØ« Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª</button></div>${table(['Ø§Ù„Ø¹Ù†ÙˆØ§Ù†','Ø§Ù„Ø®Ø·ÙˆØ±Ø©','Ø§Ù„Ù…Ø³Ø§Ø±','Ø§Ù„ÙˆÙ‚Øª'], alerts.map((a)=>`<tr><td>${escapeHtml(a.title)}<br><small>${escapeHtml(a.body || '')}</small></td><td>${badge(a.severity || 'MEDIUM')}</td><td>${escapeHtml(a.route || '-')}</td><td>${date(a.updatedAt || a.createdAt)}</td></tr>`))}</section>`, "Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø°ÙƒÙŠØ©", "Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ø³ØªØ¨Ø§Ù‚ÙŠØ© Ø¨Ø¯ÙˆÙ† Ø¨Ø­Ø« ÙŠØ¯ÙˆÙŠ.");
  app.querySelector('[data-refresh-smart-alerts]')?.addEventListener('click', async () => { await endpoints.smartAdminAlerts(); setMessage('ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª.', ''); renderSmartAlerts(); });
}

async function renderManagerSuite() {
  const data = await endpoints.managerSuite().then(unwrap);
  const rows = data.smartRows || [];
  shell(`<section class="stack"><article class="panel accent-panel"><div class="panel-head"><div><h2>Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±</h2><p>ÙƒÙ„ Ù…Ø¯ÙŠØ± ÙŠØ±Ù‰ ÙØ±ÙŠÙ‚Ù‡ ÙÙ‚Ø·: Ø­Ø¶ÙˆØ± Ø§Ù„ÙŠÙˆÙ…ØŒ Ø·Ù„Ø¨Ø§Øª Ù…Ø¹Ù„Ù‚Ø©ØŒ Ù…Ù‡Ø§Ù…ØŒ ÙˆØªÙ†Ø¨ÙŠÙ‡Ø§Øª.</p></div></div><div class="mini-stats">${(data.metrics||[]).map((m)=>`<div><span>${escapeHtml(m.label)}</span><strong>${escapeHtml(m.value)}</strong><small>${escapeHtml(m.helper||'')}</small></div>`).join('')}</div></article><article class="panel"><h2>ÙØ±ÙŠÙ‚Ùƒ Ø§Ù„ÙŠÙˆÙ…</h2>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø­Ø¶ÙˆØ±','Ø§Ù†ØµØ±Ø§Ù','Ø¥Ø¬Ø±Ø§Ø¡'], rows.map((row)=>`<tr><td class="person-cell">${avatar(row.employee,'tiny')}<span>${escapeHtml(row.employee?.fullName||row.employeeId)}</span></td><td>${badge(smartStatusLabel(row.status))}</td><td>${date(row.firstCheckInAt)}</td><td>${date(row.lastCheckOutAt)}</td><td><button class="button ghost" data-route="employee-archive?id=${escapeHtml(row.employeeId)}">Ø£Ø±Ø´ÙŠÙ</button></td></tr>`))}</article><article class="panel"><h2>Ø·Ù„Ø¨Ø§Øª Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©</h2>${table(['Ø§Ù„Ù†ÙˆØ¹','Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„ØªØ§Ø±ÙŠØ®'], (data.pending||[]).map((item)=>`<tr><td>${escapeHtml(item.kindLabel||item.kind)}</td><td>${escapeHtml(item.employee?.fullName||'-')}</td><td>${badge(item.status)}</td><td>${date(item.createdAt||item.createdSort)}</td></tr>`))}</article></section>`, "Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø¨Ø§Ø´Ø±", "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙØ±ÙŠÙ‚ Ø§Ù„ÙŠÙˆÙ…ÙŠ.");
}

async function renderMonthlyEvaluations() {
  const data = await endpoints.monthlyEvaluations({ month: new Date().toISOString().slice(0,7) }).then(unwrap);
  const rows = data.evaluations || [];
  shell(`<section class="panel"><div class="panel-head"><div><h2>Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø´Ù‡Ø±ÙŠ</h2><p>ØªÙ‚ÙŠÙŠÙ… Ø´Ù‡Ø±ÙŠ ÙŠØ¬Ù…Ø¹ Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø£Ø¯Ø§Ø¡ ÙˆØ§Ù„Ø³Ù„ÙˆÙƒ ÙˆØ§Ù„Ù…Ø¨Ø§Ø¯Ø±Ø§Øª.</p></div><button class="button ghost" data-export-evaluations>ØªØµØ¯ÙŠØ± CSV</button></div>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø¶ÙˆØ±','Ø§Ù„Ø£Ø¯Ø§Ø¡','Ø§Ù„Ø³Ù„ÙˆÙƒ','Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ','Ø§Ù„Ø­Ø§Ù„Ø©','Ø­ÙØ¸'], rows.map((row)=>`<tr data-eval-row="${escapeHtml(row.id)}"><td class="person-cell">${avatar(row.employee,'tiny')}<span>${escapeHtml(row.employee?.fullName||row.employeeId)}</span></td><td><input class="mini-input" name="attendanceScore" value="${escapeHtml(row.attendanceScore||0)}" /></td><td><input class="mini-input" name="efficiencyScore" value="${escapeHtml(row.efficiencyScore||0)}" /></td><td><input class="mini-input" name="conductScore" value="${escapeHtml(row.conductScore||0)}" /></td><td><strong>${escapeHtml(row.totalScore||0)}</strong></td><td>${badge(row.status||'DRAFT')}</td><td><button class="button primary" data-save-eval="${escapeHtml(row.id)}">Ø­ÙØ¸</button></td></tr>`))}</section>`, "Ø§Ù„ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø´Ù‡Ø±ÙŠ", "Ø¥Ø¯Ø§Ø±Ø© ØªÙ‚ÙŠÙŠÙ…Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø¡.");
  app.querySelectorAll('[data-save-eval]').forEach((button)=>button.addEventListener('click', async ()=>{ const tr=button.closest('tr'); const values=Object.fromEntries([...tr.querySelectorAll('input')].map((i)=>[i.name,i.value])); await endpoints.saveMonthlyEvaluation(button.dataset.saveEval, values); setMessage('ØªÙ… Ø­ÙØ¸ Ø§Ù„ØªÙ‚ÙŠÙŠÙ….', ''); renderMonthlyEvaluations(); }));
  app.querySelector('[data-export-evaluations]')?.addEventListener('click', ()=>downloadFile('monthly-evaluations.csv', `\ufeff${toCsv([['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø¶ÙˆØ±','Ø§Ù„Ø£Ø¯Ø§Ø¡','Ø§Ù„Ø³Ù„ÙˆÙƒ','Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ'], ...rows.map((r)=>[r.employee?.fullName||r.employeeId,r.attendanceScore,r.efficiencyScore,r.conductScore,r.totalScore])])}`, 'text/csv;charset=utf-8'));
}

async function renderPresenceMap() {
  const data = await endpoints.executivePresenceDashboard().then(unwrap);
  const rows = data.rows || [];
  const missing = rows.filter((row) => !row.lastLocation?.latitude && ["PRESENT", "LATE", "CHECKED_OUT"].includes(row.status));
  const located = rows.filter((row) => row.lastLocation?.latitude && row.lastLocation?.longitude);
  shell(`<section class="stack presence-live-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>Ù„ÙˆØ­Ø© Ø­Ø¶ÙˆØ± Ù„Ø­Ø¸ÙŠØ© Ù„Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ</h2><p>Ø®Ø±ÙŠØ·Ø© Ù…Ø¨Ø§Ø´Ø±Ø© ØªÙˆØ¶Ù‘Ø­ Ø§Ù„Ø­Ø¶ÙˆØ±ØŒ Ø§Ù„ØªØ£Ø®ÙŠØ±ØŒ Ø§Ù„Ø®Ø±ÙˆØ¬ Ø¹Ù† Ø§Ù„Ù†Ø·Ø§Ù‚ØŒ ÙˆÙ…Ù† Ù„Ù… ÙŠØ±Ø³Ù„ Ù…ÙˆÙ‚Ø¹Ù‡.</p></div><button class="button primary" data-refresh-presence>ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¢Ù†</button></div>
      <div class="metric-grid">${metric("Ø­Ø§Ø¶Ø±", data.counts?.PRESENT || 0, "Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©")}${metric("Ù…ØªØ£Ø®Ø±", data.counts?.LATE || 0, "ÙŠØ­ØªØ§Ø¬ Ù…ØªØ§Ø¨Ø¹Ø©")}${metric("ØºØ§Ø¦Ø¨", data.counts?.ABSENT || 0, "Ù„Ù… ÙŠØ³Ø¬Ù„ Ø­Ø¶ÙˆØ±")}${metric("Ù„Ù… ÙŠØ±Ø³Ù„ Ù…ÙˆÙ‚Ø¹", missing.length, "Ø­Ø§Ø¶Ø± Ø¨Ù„Ø§ GPS")}${metric("Ø®Ø§Ø±Ø¬ Ø§Ù„Ù†Ø·Ø§Ù‚", data.counts?.outOfRange || 0, "Ø¨ØµÙ…Ø© Ù…Ø´ÙƒÙˆÙƒ Ø¨Ù‡Ø§")}</div>
    </article>
    <article class="panel"><div class="panel-head"><div><h2>Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©</h2><p>Ù†Ù‚Ø§Ø· Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ù…ØªØ§Ø­Ø© ØªØ¸Ù‡Ø± ÙƒØ±Ø§Ø¨Ø· Ù…Ø¨Ø§Ø´Ø± Ø¹Ù„Ù‰ Google MapsØŒ ÙˆØ§Ù„Ø¨Ø§Ù‚ÙŠ ÙŠØ¸Ù‡Ø± ÙÙŠ Ù‚Ø§Ø¦Ù…Ø© "Ù„Ù… ÙŠØ±Ø³Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹".</p></div></div>
      <div class="live-map-board">${located.map((row, index) => `<a class="map-pin risk-${escapeHtml(row.risk?.level || 'CLEAR')}" style="--x:${12 + (index * 17) % 76}%;--y:${18 + (index * 23) % 64}%" target="_blank" rel="noopener" href="${escapeHtml(row.mapUrl)}"><strong>${escapeHtml(row.employee?.fullName || row.employeeId)}</strong><span>${escapeHtml(statusLabel(row.status))} Â· Ø®Ø·Ø± ${escapeHtml(row.risk?.score || 0)}%</span></a>`).join('') || `<div class="empty">Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ÙˆØ§Ù‚Ø¹ GPS Ù…ØªØ§Ø­Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø¢Ù†.</div>`}</div>
    </article>
    <article class="panel"><h2>ØªÙØ§ØµÙŠÙ„ Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ù…ÙˆÙ‚Ø¹</h2>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„Ø­Ø¶ÙˆØ±','Ø§Ù„Ø§Ù†ØµØ±Ø§Ù','Ø§Ù„Ù…ÙˆÙ‚Ø¹','Ù…Ø®Ø§Ø·Ø±'], rows.map((row) => `<tr><td class="person-cell">${avatar(row.employee,'tiny')}<span>${escapeHtml(row.employee?.fullName || row.employeeId)}</span></td><td>${badge(row.status)}</td><td>${date(row.checkInAt)}</td><td>${date(row.checkOutAt)}</td><td>${row.mapUrl ? `<a target="_blank" rel="noopener" href="${escapeHtml(row.mapUrl)}">ÙØªØ­ Ø§Ù„Ø®Ø±ÙŠØ·Ø©</a>` : '<span class="status warning">Ù„Ù… ÙŠØ±Ø³Ù„ Ø§Ù„Ù…ÙˆÙ‚Ø¹</span>'}</td><td>${badge(row.risk?.level || 'CLEAR')} ${escapeHtml(row.risk?.score || 0)}%</td></tr>`))}</article>
  </section>`, "Ø®Ø±ÙŠØ·Ø© Ø§Ù„Ø­Ø¶ÙˆØ± Ø§Ù„Ù„Ø­Ø¸ÙŠØ©", "Ù…ØªØ§Ø¨Ø¹Ø© ØªÙ†ÙÙŠØ°ÙŠØ© Ù…Ø¨Ø§Ø´Ø±Ø© Ù„Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ù…ÙˆÙ‚Ø¹.");
  app.querySelector('[data-refresh-presence]')?.addEventListener('click', () => renderPresenceMap());
}

async function renderAttendanceRisk() {
  const data = await endpoints.attendanceRiskCenter({ days: 7 }).then(unwrap);
  const rows = data.rows || [];
  shell(`<section class="stack attendance-risk-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>Ù†Ø¸Ø§Ù… ØªÙ‚ÙŠÙŠÙ… Ø®Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©</h2><p>ÙŠØ±ØµØ¯ ØªÙƒØ±Ø§Ø± Ø§Ù„Ø¨ØµÙ…Ø©ØŒ Ø§Ù„Ù…ÙˆÙ‚Ø¹ ØºÙŠØ± Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠØŒ Ø§Ù„Ø¬Ù‡Ø§Ø² Ø§Ù„Ø¬Ø¯ÙŠØ¯ØŒ Ø§Ù„Ø­Ø¶ÙˆØ± Ù…Ù† Ù…ÙƒØ§Ù† Ø¨Ø¹ÙŠØ¯ØŒ ÙˆØ§Ù„Ø¨ØµÙ…Ø© Ø¨Ø¯ÙˆÙ† GPS.</p></div><button class="button ghost" data-refresh-risk>Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªÙ‚ÙŠÙŠÙ…</button></div>
      <div class="chips">${(data.rules || []).map((rule) => `<span class="chip">${escapeHtml(rule)}</span>`).join('')}</div>
      <div class="metric-grid">${metric('Ø¹Ø§Ù„ÙŠ', data.counts?.HIGH || 0, 'ØªØ­Ù‚ÙŠÙ‚ ÙÙˆØ±ÙŠ')}${metric('Ù…ØªÙˆØ³Ø·', data.counts?.MEDIUM || 0, 'Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù…Ø¯ÙŠØ±')}${metric('Ù…Ù†Ø®ÙØ¶', data.counts?.LOW || 0, 'Ù…ØªØ§Ø¨Ø¹Ø©')}${metric('Ø³Ù„ÙŠÙ…', data.counts?.CLEAR || 0, 'Ù„Ø§ Ù…Ø¤Ø´Ø±Ø§Øª')}</div>
    </article>
    <article class="panel"><h2>Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ† Ø­Ø³Ø¨ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø®Ø·Ø±</h2>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø§Ù„Ø¯Ø±Ø¬Ø©','Ø§Ù„Ù…Ø³ØªÙˆÙ‰','Ø§Ù„Ø£Ø³Ø¨Ø§Ø¨','Ø¢Ø®Ø± Ø£Ø­Ø¯Ø§Ø«'], rows.map((row) => `<tr><td class="person-cell">${avatar(row.employee,'tiny')}<span>${escapeHtml(row.employee?.fullName || row.employeeId)}</span></td><td><strong>${escapeHtml(row.score)}%</strong></td><td>${badge(row.level)}</td><td>${(row.flags || []).map((flag) => `<span class="chip danger-soft">${escapeHtml(flag.label)}</span>`).join('') || 'â€”'}</td><td>${(row.events || []).slice(0,3).map((event) => `${escapeHtml(statusLabel(event.type || event.action || event.status))} ${date(event.eventAt || event.createdAt)}`).join('<br>')}</td></tr>`))}</article>
  </section>`, "Ù…Ø®Ø§Ø·Ø± Ø§Ù„Ø¨ØµÙ…Ø©", "ÙƒØ´Ù Ø§Ù„ØªÙ„Ø§Ø¹Ø¨ Ø£Ùˆ Ø§Ù„Ø¨ØµÙ…Ø§Øª ØºÙŠØ± Ø§Ù„Ø·Ø¨ÙŠØ¹ÙŠØ©.");
  app.querySelector('[data-refresh-risk]')?.addEventListener('click', () => renderAttendanceRisk());
}

async function renderAdminDecisions() {
  const data = await endpoints.adminDecisions().then(unwrap);
  const rows = data.decisions || [];
  shell(`<section class="stack admin-decisions-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>Ø³Ø¬Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ© Ø§Ù„Ø±Ø³Ù…ÙŠ</h2><p>ÙƒÙ„ Ù‚Ø±Ø§Ø± ÙŠØµÙ„ Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆÙŠØ­ØªØ§Ø¬ "ØªÙ… Ø§Ù„Ø§Ø·Ù„Ø§Ø¹" Ù…Ø¹ ØªÙˆÙ‚ÙŠØª Ø§Ù„Ù‚Ø±Ø§Ø¡Ø©.</p></div></div>
      <form id="decision-form" class="form-grid compact-form"><label>Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù‚Ø±Ø§Ø±<input name="title" required /></label><label>Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©<select name="priority"><option value="MEDIUM">Ù…ØªÙˆØ³Ø·Ø©</option><option value="HIGH">Ø¹Ø§Ù„ÙŠØ©</option><option value="LOW">Ù…Ù†Ø®ÙØ¶Ø©</option></select></label><label class="span-2">Ù†Øµ Ø§Ù„Ù‚Ø±Ø§Ø±<textarea name="body" rows="4" required></textarea></label><label>Ø§Ù„Ù†Ø·Ø§Ù‚<select name="scope"><option value="ALL">ÙƒÙ„ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</option><option value="SELECTED">Ù…ÙˆØ¸ÙÙˆÙ† Ù…Ø­Ø¯Ø¯ÙˆÙ†</option></select></label><label>Ø£ÙƒÙˆØ§Ø¯ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ù…Ø­Ø¯Ø¯ÙŠÙ†<input name="targetEmployeeIds" placeholder="Ø§Ø®ØªÙŠØ§Ø±ÙŠ: employee ids Ù…ÙØµÙˆÙ„Ø© Ø¨ÙØ§ØµÙ„Ø©" /></label><button class="button primary" type="submit">Ù†Ø´Ø± Ø§Ù„Ù‚Ø±Ø§Ø± ÙˆØ¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø±</button></form>
    </article>
    <article class="panel"><h2>Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ù…Ù†Ø´ÙˆØ±Ø©</h2>${table(['Ø§Ù„Ø¹Ù†ÙˆØ§Ù†','Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©','Ø§Ù„Ù†Ø·Ø§Ù‚','Ø§Ù„Ù†Ø´Ø±','Ø§Ù„Ø§Ø·Ù„Ø§Ø¹','Ø§Ù„Ù†Øµ'], rows.map((row) => `<tr><td><strong>${escapeHtml(row.title)}</strong></td><td>${badge(row.priority)}</td><td>${escapeHtml(row.scope || 'ALL')}</td><td>${date(row.publishedAt || row.createdAt)}</td><td><strong>${escapeHtml((row.acknowledgements || []).length || (row.acknowledged ? 1 : 0))}</strong></td><td>${escapeHtml(row.body || '')}</td></tr>`))}</article>
  </section>`, "Ø³Ø¬Ù„ Ø§Ù„Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ø¥Ø¯Ø§Ø±ÙŠØ©", "Ù‚Ø±Ø§Ø±Ø§Øª Ø±Ø³Ù…ÙŠØ© Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªÙˆÙ‚ÙŠØ¹ ÙˆØ§Ù„Ø§Ø·Ù„Ø§Ø¹.");
  app.querySelector('#decision-form')?.addEventListener('submit', async (event) => { event.preventDefault(); await endpoints.createAdminDecision(readForm(event.currentTarget)); setMessage('ØªÙ… Ù†Ø´Ø± Ø§Ù„Ù‚Ø±Ø§Ø± ÙˆØ¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª.', ''); renderAdminDecisions(); });
}

async function renderMonthlyAutoPdfReports() {
  const month = new Date().toISOString().slice(0,7);
  const data = await endpoints.monthlyAutoPdfReports({ month }).then(unwrap);
  shell(`<section class="stack monthly-pdf-page">
    <article class="panel accent-panel"><div class="panel-head"><div><h2>ØªÙ‚Ø§Ø±ÙŠØ± PDF Ø´Ù‡Ø±ÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ©</h2><p>ØªØ¬Ù…ÙŠØ¹ ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù„Ù„Ø­Ø¶ÙˆØ±ØŒ Ø§Ù„ØªØ£Ø®ÙŠØ±ØŒ Ø§Ù„ØºÙŠØ§Ø¨ØŒ KPIØŒ Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰ ÙˆØ§Ù„Ø·Ù„Ø¨Ø§Øª Ù„ÙƒÙ„ Ù…ÙˆØ¸Ù ÙˆÙ„ÙƒÙ„ Ù…Ø¯ÙŠØ±.</p></div><div class="toolbar"><button class="button primary" data-print-monthly>Ø·Ø¨Ø§Ø¹Ø© / Ø­ÙØ¸ PDF</button><button class="button ghost" data-regenerate-monthly>Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„ØªÙˆÙ„ÙŠØ¯</button></div></div>
      <div class="metric-grid">${metric('Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†', data.attendance?.rows?.length || 0, 'Ø¯Ø§Ø®Ù„ Ø§Ù„ØªÙ‚Ø±ÙŠØ±')}${metric('Ø§Ù„Ù…Ø¯ÙŠØ±ÙˆÙ†', data.managers?.length || 0, 'ØªÙ‚Ø§Ø±ÙŠØ± ÙØ±Ù‚')}${metric('Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰', data.disputes?.length || 0, 'Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±')}${metric('Ø§Ù„Ø·Ù„Ø¨Ø§Øª', data.requests?.length || 0, 'Ù‡Ø°Ø§ Ø§Ù„Ø´Ù‡Ø±')}</div>
    </article>
    <article class="panel print-area"><h2>${escapeHtml(data.title)}</h2><p>ØªØ§Ø±ÙŠØ® Ø§Ù„ØªÙˆÙ„ÙŠØ¯: ${date(data.generatedAt)}</p><h3>Ù…Ù„Ø®Øµ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</h3>${table(['Ø§Ù„Ù…ÙˆØ¸Ù','Ø­Ø¶ÙˆØ±','ØªØ£Ø®ÙŠØ±','ØºÙŠØ§Ø¨','Ù…Ù„Ø§Ø­Ø¸Ø§Øª'], (data.attendance?.rows || []).map((row) => `<tr><td>${escapeHtml(row.employee?.fullName || row.employeeName || row.employeeId)}</td><td>${escapeHtml(row.presentDays || row.present || 0)}</td><td>${escapeHtml(row.lateMinutes || 0)} Ø¯Ù‚ÙŠÙ‚Ø©</td><td>${escapeHtml(row.absentDays || row.absences || 0)}</td><td>${escapeHtml(row.recommendation || row.status || '')}</td></tr>`))}<h3>ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø¯ÙŠØ±ÙŠÙ†</h3>${table(['Ø§Ù„Ù…Ø¯ÙŠØ±','Ø¹Ø¯Ø¯ Ø§Ù„ÙØ±ÙŠÙ‚','KPI','Ø§Ù„Ø´ÙƒØ§ÙˆÙ‰','Ø§Ù„Ø·Ù„Ø¨Ø§Øª'], (data.managers || []).map((row) => `<tr><td>${escapeHtml(row.manager?.fullName || row.manager?.name || '')}</td><td>${escapeHtml(row.teamCount || 0)}</td><td>${escapeHtml(row.kpiRows?.length || 0)}</td><td>${escapeHtml(row.disputes?.length || 0)}</td><td>${escapeHtml(row.requests?.length || 0)}</td></tr>`))}</article>
    <article class="panel"><h2>Ø³Ø¬Ù„ Ø§Ù„ØªÙˆÙ„ÙŠØ¯</h2>${table(['Ø§Ù„Ø´Ù‡Ø±','Ø§Ù„Ø­Ø§Ù„Ø©','Ø§Ù„ØªØ§Ø±ÙŠØ®','Ø§Ù„Ø£Ø¹Ø¯Ø§Ø¯'], (data.runs || []).map((run) => `<tr><td>${escapeHtml(run.month)}</td><td>${badge(run.status)}</td><td>${date(run.generatedAt)}</td><td>${escapeHtml(JSON.stringify(run.counts || {}))}</td></tr>`))}</article>
  </section>`, "PDF Ø´Ù‡Ø±ÙŠ ØªÙ„Ù‚Ø§Ø¦ÙŠ", "ØªÙ‚Ø§Ø±ÙŠØ± Ø´Ù‡Ø±ÙŠØ© Ø¬Ø§Ù‡Ø²Ø© Ù„Ù„Ø·Ø¨Ø§Ø¹Ø© ÙˆØ§Ù„Ø­ÙØ¸ PDF.");
  app.querySelector('[data-print-monthly]')?.addEventListener('click', () => window.print());
  app.querySelector('[data-regenerate-monthly]')?.addEventListener('click', () => renderMonthlyAutoPdfReports());
}

async function renderSupabaseSetup() {
  const data = await endpoints.supabaseSetupCheck().then(unwrap);
  shell(`<section class="panel"><div class="panel-head"><div><h2>Ù„ÙˆØ­Ø© Ø¥Ø¹Ø¯Ø§Ø¯ Supabase</h2><p>ÙØ­Øµ Ø³Ø±ÙŠØ¹ Ù„Ù…Ø¹Ø±ÙØ© Ù‡Ù„ Ø§Ù„Ù†Ø¸Ø§Ù… Ø¬Ø§Ù‡Ø² Ù„Ù„Ø­ÙØ¸ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ Ø¨ÙŠÙ† ÙƒÙ„ Ø§Ù„Ø£Ø¬Ù‡Ø²Ø©.</p></div></div>${table(['Ø§Ù„ÙØ­Øµ','Ø§Ù„Ù†ØªÙŠØ¬Ø©','Ø§Ù„ØªÙØ§ØµÙŠÙ„'], (data.checks||[]).map((c)=>`<tr><td>${escapeHtml(c.label)}</td><td>${c.ok ? badge('APPROVED') : badge('PENDING')}</td><td>${escapeHtml(c.detail||'')}</td></tr>`))}<div class="message warning">${escapeHtml(data.recommended || '')}</div></section>`, "Ø¥Ø¹Ø¯Ø§Ø¯ Supabase", "ÙØ­Øµ Ø§Ù„Ø§ØªØµØ§Ù„ ÙˆØ§Ù„ØªØ¬Ù‡ÙŠØ².");
}

async function renderDatabaseUpdates() {
  const data = await endpoints.databaseMigrationsStatus().then(unwrap);
  shell(`<section class="panel"><div class="panel-head"><div><h2>ØªØ­Ø¯ÙŠØ«Ø§Øª Database</h2><p>Ø¢Ø®Ø± Patch Ù…Ø·Ù„ÙˆØ¨: ${escapeHtml(data.expectedPatch)}</p></div></div>${table(['Ø§Ù„ØªØ±ØªÙŠØ¨','Ø§Ù„Ù…Ù„Ù','Ø§Ù„Ø­Ø§Ù„Ø©','Ø¥Ø¬Ø±Ø§Ø¡'], (data.rows||[]).map((row)=>`<tr><td>${escapeHtml(row.order)}</td><td>${escapeHtml(row.name)}</td><td>${badge(row.status)}</td><td><button class="button ghost" data-mark-migration="${escapeHtml(row.name)}">ØªÙ… ØªØ´ØºÙŠÙ„Ù‡</button></td></tr>`))}<div class="message warning">${escapeHtml(data.notes||'')}</div></section>`, "ØªØ­Ø¯ÙŠØ«Ø§Øª Database", "Ù…ØªØ§Ø¨Ø¹Ø© Ù…Ù„ÙØ§Øª SQL Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©.");
  app.querySelectorAll('[data-mark-migration]').forEach((button)=>button.addEventListener('click', async ()=>{ await endpoints.markMigrationApplied(button.dataset.markMigration); setMessage('ØªÙ… ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ù…Ù„Ù ÙƒÙ…Ø·Ø¨Ù‚ Ù…Ø­Ù„ÙŠÙ‹Ø§.', ''); renderDatabaseUpdates(); }));
}

async function renderAutoBackup() {
  const data = await endpoints.autoBackupStatus().then(unwrap);
  const backups = data.backups || [];
  shell(`<section class="stack"><article class="panel accent-panel"><div class="panel-head"><div><h2>Backup ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø­Ù‚ÙŠÙ‚ÙŠ</h2><p>ÙÙŠ Ø§Ù„ÙˆØ¶Ø¹ Ø§Ù„Ù…Ø­Ù„ÙŠ ÙŠØªÙ… Ø­ÙØ¸ Snapshot Ø¯Ø§Ø®Ù„ÙŠ. ÙÙŠ Supabase Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ ÙŠÙÙ†ØµØ­ Ø¨Ø¬Ø¯ÙˆÙ„Ø© Edge Function/Storage ÙŠÙˆÙ…ÙŠÙ‹Ø§.</p></div><button class="button primary" data-run-auto-backup>ØªØ´ØºÙŠÙ„ Backup Ø§Ù„Ø¢Ù†</button></div><div class="mini-stats"><div><span>Ø§Ù„Ø§Ø­ØªÙØ§Ø¸ Ø¨Ø¢Ø®Ø±</span><strong>${escapeHtml(data.policy?.keepLast||30)}</strong></div><div><span>Ø¹Ø¯Ø¯ Ø§Ù„Ù†Ø³Ø®</span><strong>${backups.length}</strong></div><div><span>Ø¢Ø®Ø± Ù†Ø³Ø®Ø©</span><strong>${escapeHtml(backups[0] ? date(backups[0].createdAt) : '-')}</strong></div></div></article><article class="panel"><h2>Ø³Ø¬Ù„ Ø§Ù„Ù†Ø³Ø®</h2>${table(['Ø§Ù„Ø¹Ù†ÙˆØ§Ù†','Ø§Ù„Ø³Ø¨Ø¨','Ø§Ù„ÙˆÙ‚Øª','Ø§Ù„Ø£Ø¹Ø¯Ø§Ø¯'], backups.map((b)=>`<tr><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.reason||'-')}</td><td>${date(b.createdAt)}</td><td>${escapeHtml(JSON.stringify(b.counts||{}))}</td></tr>`))}</article></section>`, "Backup ØªÙ„Ù‚Ø§Ø¦ÙŠ", "Ù†Ø³Ø® Ø§Ø­ØªÙŠØ§Ø·ÙŠ ÙˆØªØ´ØºÙŠÙ„ ÙŠØ¯ÙˆÙŠ.");
  app.querySelector('[data-run-auto-backup]')?.addEventListener('click', async ()=>{ await endpoints.runAutomaticBackup({ reason: 'manual-admin' }); setMessage('ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Backup Ø¨Ù†Ø¬Ø§Ø­.', ''); renderAutoBackup(); });
}

async function render() {
  try {
    state.error = "";
    if (!state.user) state.user = await endpoints.me().then(unwrap).catch(() => null);
    if (await enforceGateSessionIdentity("admin")) return;
    if (!state.user && routeKey() !== "login") return renderLogin();
    if (state.user && !isAdminPortalUser(state.user)) return isExecutiveOnlyRole(state.user) ? goExecutivePortal("home") : goEmployeePortal("home");

    const key = routeKey();
    if (!canRoute(key)) {
      return shell(`<section class="panel"><h2>Ù„Ø§ ØªÙˆØ¬Ø¯ ØµÙ„Ø§Ø­ÙŠØ©</h2><p>Ø­Ø³Ø§Ø¨Ùƒ Ù„Ø§ ÙŠÙ…Ù„Ùƒ ØµÙ„Ø§Ø­ÙŠØ© ÙØªØ­ Ù‡Ø°Ù‡ Ø§Ù„ØµÙØ­Ø©. Ø§Ø·Ù„Ø¨ Ù…Ù† Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù… ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¯ÙˆØ± Ø£Ùˆ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§Øª.</p></section>`, "ØµÙ„Ø§Ø­ÙŠØ§Øª ØºÙŠØ± ÙƒØ§ÙÙŠØ©", "ØªÙ… Ù…Ù†Ø¹ Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„ØµÙØ­Ø© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©.");
    }
    if (key === "dashboard") await renderDashboard();
    else if (key === "executive-report") await renderExecutiveReport();
    else if (key === "executive-mobile") await renderExecutiveMobile();
    else if (key === "presence-map") await renderPresenceMap();
    else if (key === "attendance-risk") await renderAttendanceRisk();
    else if (key === "manager-dashboard") await renderManagerDashboard();
    else if (key === "management-structure") await renderManagementStructure();
    else if (key === "team-dashboard") await renderTeamDashboard();
    else if (key === "hr-operations") await renderHrOperations();
    else if (key === "manager-suite") await renderManagerSuite();
    else if (key === "realtime") await renderRealtime();
    else if (key === "employees") await renderEmployees();
    else if (key === "employee-archive") await renderEmployeeArchive();
    else if (key === "employee-profile") await renderEmployeeProfile();
    else if (key === "users") await renderUsers();
    else if (key === "leave-balances") await renderLeaveBalances();
    else if (key === "documents") await renderDocuments();
    else if (key === "trusted-devices") await renderTrustedDevices();
    else if (key === "employee-punch") await renderEmployeePunch();
    else if (key === "employee-qr") await renderEmployeeQr();
    else if (key === "attendance") await renderAttendance();
    else if (key === "attendance-review") await renderAttendanceReview();
    else if (key === "smart-attendance") await renderSmartAttendance();
    else if (key === "attendance-calendar") await renderAttendanceCalendar();
    else if (key === "missions") await renderMissions();
    else if (key === "leaves") await renderLeaves();
    else if (key === "requests") await renderRequests();
    else if (key === "tasks") await renderTasks();
    else if (key === "locations") await renderLocations();
    else if (key === "disputes") await renderDisputes();
    else if (key === "dispute-workflow") await renderDisputeWorkflow();
    else if (key === "admin-decisions") await renderAdminDecisions();
    else if (key === "roles") await renderRoles();
    else if (key === "permission-matrix") await renderPermissionMatrix();
    else if (key === "password-vault") await renderPasswordVault();
    else if (key === "sensitive-approvals") await renderSensitiveApprovals();
    else if (key === "org-chart") await renderOrgChart();
    else if (key === "reports") await renderReports();
    else if (key === "report-center") await renderReportCenter();
    else if (key === "executive-pdf") await renderExecutivePdfReports();
    else if (key === "monthly-auto-pdf") await renderMonthlyAutoPdfReports();
    else if (key === "monthly-report") await renderMonthlyReport();
    else if (key === "advanced-reports") await renderAdvancedReports();
    else if (key === "control-room") await renderControlRoom();
    else if (key === "smart-alerts") await renderSmartAlerts();
    else if (key === "daily-reports") await renderDailyReports();
    else if (key === "ai-analytics") await renderAiAnalytics();
    else if (key === "data-center") await renderDataCenter();
    else if (key === "settings") await renderSettings();
    else if (key === "supabase-setup") await renderSupabaseSetup();
    else if (key === "db-updates") await renderDatabaseUpdates();
    else if (key === "auto-backup") await renderAutoBackup();
    else if (key === "complex-settings") await renderComplexSettings();
    else if (key === "system-diagnostics") await renderSystemDiagnostics();
    else if (key === "quality-center") await renderQualityCenter();
    else if (key === "policies") await renderPolicies();
    else if (key === "route-access") await renderRouteAccess();
    else if (key === "integrations") await renderIntegrations();
    else if (key === "access-control") await renderAccessControl();
    else if (key === "offline-sync") await renderOfflineSync();
    else if (key === "health") await renderHealth();
    else if (key === "backup") await renderBackup();
    else if (key === "audit") await renderAudit();
    else if (key === "security-log") await renderSecurityLog();
    else if (key === "kpi") await renderKpi();
    else if (key === "monthly-evaluations") await renderMonthlyEvaluations();
    else if (key === "notifications") await renderNotifications();
    else await renderDashboard();
  } catch (error) {
    console.error(error);
    setMessage("", error.message);
    shell(`<section class="panel"><h2>ØªØ¹Ø°Ø± ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©</h2><p>${escapeHtml(error.message)}</p></section>`, "Ø®Ø·Ø£", "Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø£Ùˆ Ø£Ø¹Ø¯ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ØµÙØ­Ø©.");
  }
}

render();
