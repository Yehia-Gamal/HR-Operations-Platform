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
    vapidPublicKey: "BFO13DLR--4dck34L6GN144yabyNosxX5ZndloXvrLHiGBInFXBrRpKSvLI8Suyy-i07br6cwxi274PPaoo2yfI",
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
      name: "مجمع أحلى شباب",
      area: "منيل شيحة - الجيزة",
      // اضبط هذه الإحداثيات من لوحة الإدارة إذا ظهر الحكم داخل/خارج المجمع بشكل غير صحيح.
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
      label: "بوابة HR / الإدارة",
      code: "00000000",
      allowedEmails: ["yahia.gamal.idh@gmail.com"],
      allowedPhones: ["01154869616", "010040455849", "01028403239"],
      allowedIdentifiers: ["yahia.gamal.idh@gmail.com", "01154869616", "010040455849", "01028403239"],
      target: "../admin/"
    },
    executive: {
      enabled: true,
      label: "بوابة المدير التنفيذي",
      code: "00000000",
      allowedEmails: ["yahia.gamal.idh@gmail.com"],
      allowedPhones: ["01154869616", "010040455849"],
      allowedIdentifiers: ["yahia.gamal.idh@gmail.com", "01154869616", "010040455849"],
      target: "../executive/"
    }
  },
  adminGateway: {
    enabled: true,
    // This code should be strong and changed for each deployment. See operations-gate/index.html for the hashed version.
    accessCode: "00000000",
    // Shorten session duration to 4 hours for improved security
    sessionMinutes: 240,
    maxAttempts: 5,
    lockMinutes: 15,
  },
  deployment: {
    // Last SQL patch expected to be present on the database when this frontend is deployed
    expectedPatch: "074_e2e_test_readiness.sql",
    // Semantic version for the package; bump to force cache invalidation in SW
    packageVersion: "v31-live-location-alert-fix-082",
  },
  // Used by service workers to invalidate old caches
  cacheVersion: "v31-live-location-alert-fix-082",
});

window.__HR_SUPABASE_CONFIG_LOADED__ = true;
window.__HR_SUPABASE_CONFIG_VERSION__ = "v31-live-location-alert-fix-082";

(function markSupabaseMode() {
  const cfg = window.HR_SUPABASE_CONFIG || {};
  const configured = Boolean(cfg.enabled === true && /^https:\/\/[^\s]+\.supabase\.co$/.test(String(cfg.url || "")) && String(cfg.anonKey || "").length > 20);
  document.documentElement.dataset.supabaseMode = configured ? "enabled" : "local";
})();
