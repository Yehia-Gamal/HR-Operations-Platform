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
    allowLocalFallback: false,
    requireStrongPasswords: true,
    attachmentSignedUrlSeconds: 3600,
  },
  attendance: {
    qrRequired: false,
    reminderInPageHour: 10,
    reminderPushHour: 9,
    reminderPushMinute: 30,
    gpsSamples: 18,
    gpsSampleWindowMs: 30000,
    gpsTargetAccuracyMeters: 15,
    gpsMaxAcceptableAccuracyMeters: 90,
    gpsSafetyBufferMeters: 90,
    gpsUncertainReviewOnly: true,
    branchLocation: {
      name: "Ù…Ø¬Ù…Ø¹ Ø£Ø­Ù„Ù‰ Ø´Ø¨Ø§Ø¨",
      area: "Ù…Ù†ÙŠÙ„ Ø´ÙŠØ­Ø© - Ø§Ù„Ø¬ÙŠØ²Ø©",
      // Ø§Ø¶Ø¨Ø· Ù‡Ø°Ù‡ Ø§Ù„Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ù…Ù† Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø°Ø§ Ø¸Ù‡Ø± Ø§Ù„Ø­ÙƒÙ… Ø¯Ø§Ø®Ù„/Ø®Ø§Ø±Ø¬ Ø§Ù„Ù…Ø¬Ù…Ø¹ Ø¨Ø´ÙƒÙ„ ØºÙŠØ± ØµØ­ÙŠØ­.
      latitude: 29.950738592862045,
      longitude: 31.238094542328678,
      radiusMeters: 180,
      safetyBufferMeters: 90,
      maxAccuracyMeters: 90,
    },
  },
  gateways: {
    admin: {
      enabled: true,
      label: "Ø¨ÙˆØ§Ø¨Ø© HR / Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©",
      code: "A7B3C9D4E6F8",
      allowedEmails: ["yahia.gamal.idh@gmail.com"],
      allowedPhones: ["01154869616", "010040455849", "01028403239"],
      allowedIdentifiers: ["yahia.gamal.idh@gmail.com", "01154869616", "010040455849", "01028403239"],
      target: "../admin/"
    },
    executive: {
      enabled: true,
      label: "Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠ",
      code: "EXEC-AHLA-2026",
      allowedEmails: ["yahia.gamal.idh@gmail.com"],
      allowedPhones: ["01154869616", "010040455849"],
      allowedIdentifiers: ["yahia.gamal.idh@gmail.com", "01154869616", "010040455849"],
      target: "../executive/"
    }
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
    expectedPatch: "074_e2e_test_readiness.sql",
    // Semantic version for the package; bump to force cache invalidation in SW
    packageVersion: "v31-production-deploy-ready-keep-dev-files",
  },
  // Used by service workers to invalidate old caches
  cacheVersion: "v31-production-deploy-ready-keep-dev-files",
});

window.__HR_SUPABASE_CONFIG_LOADED__ = true;
window.__HR_SUPABASE_CONFIG_VERSION__ = "v31-production-deploy-ready-keep-dev-files";

(function markSupabaseMode() {
  const cfg = window.HR_SUPABASE_CONFIG || {};
  const configured = Boolean(cfg.enabled === true && /^https:\/\/[^\s]+\.supabase\.co$/.test(String(cfg.url || "")) && String(cfg.anonKey || "").length > 20);
  document.documentElement.dataset.supabaseMode = configured ? "enabled" : "local";
})();
