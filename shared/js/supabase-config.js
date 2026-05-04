// Production Supabase configuration.
// IMPORTANT: Never put service_role keys or VAPID private keys in browser files.
// Supabase configuration injected at build time.
// NOTE: Do not place secrets such as service_role keys in this file. See .env.example for server-only values.
window.HR_SUPABASE_CONFIG = Object.freeze({
  enabled: true,
  strict: true,
  // Identifier for your Supabase project (used internally by some tools)
  projectId: "ahla-shabab-hr",
  // These values are replaced during deployment using environment variables or a local secrets file
  projectRef: "yemradvxmwadlldnxtpz",
  url: "https://yemradvxmwadlldnxtpz.supabase.co",
  anonKey: "sb_publishable_zd51Cc4KSDbUzrQ53maaOw_NbjHC__T",
  storage: {
    avatarsBucket: "avatars",
    punchSelfiesBucket: "punch-selfies",
    attachmentsBucket: "employee-attachments",
  },
  realtime: {
    enabled: true,
  },
  push: {
    // Public VAPID key used for Push Notifications
    vapidPublicKey: "BNf9nnoV6nLXQBA4anyKRN0aylPqS__DRABe3b1Qw2NDIQDg8cZlafffPvdCAxwF8-xtMaUuef055N0-J01ZtBA",
  },
  security: {
    allowLocalDemo: false,
    requireStrongPasswords: true,
    attachmentSignedUrlSeconds: 3600,
  },
  adminGateway: {
    enabled: true,
    // This code should be strong and changed for each deployment. See operations-gate/index.html for the hashed version.
    accessCode: "A7B3C9D4E6F8",
    // Shorten session duration to 4 hours for improved security
    sessionMinutes: 240,
    maxAttempts: 5,
    lockMinutes: 15,
  },
  deployment: {
    // Last SQL patch expected to be present on the database when this frontend is deployed
    expectedPatch: "043_executive_presence_risk_decisions_reports.sql",
    // Semantic version for the package; bump to force cache invalidation in SW
    packageVersion: "management-suite-20260502-01",
  },
  // Used by service workers to invalidate old caches
  cacheVersion: "management-suite-20260502-01",
});

window.__HR_SUPABASE_CONFIG_LOADED__ = true;
window.__HR_SUPABASE_CONFIG_VERSION__ = "server-runtime-push-20260501-01";

(function markSupabaseMode() {
  const cfg = window.HR_SUPABASE_CONFIG || {};
  const configured = Boolean(cfg.enabled === true && /^https:\/\/[^\s]+\.supabase\.co$/.test(String(cfg.url || "")) && String(cfg.anonKey || "").length > 20);
  document.documentElement.dataset.supabaseMode = configured ? "enabled" : "local";
})();
