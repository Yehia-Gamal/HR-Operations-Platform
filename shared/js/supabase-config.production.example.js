<<<<<<< HEAD
// انسخ هذا الملف إلى shared/js/supabase-config.js عند النشر الحقيقي، ثم ضع بيانات مشروع Supabase بعد تشغيل كل SQL patches حتى 029.
window.HR_SUPABASE_CONFIG = Object.freeze({
  enabled: true,
  strict: true,
  projectId: "ahla-shabab-hr",
  projectRef: "YOUR_PROJECT_REF",
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY",
  storage: { avatarsBucket: "avatars", punchSelfiesBucket: "punch-selfies", attachmentsBucket: "employee-attachments" },
  realtime: { enabled: true },
  push: { vapidPublicKey: "YOUR_VAPID_PUBLIC_KEY" },
  security: { allowLocalDemo: false, requireStrongPasswords: true, attachmentSignedUrlSeconds: 3600 },
  adminGateway: { enabled: true, accessCode: "CHANGE_THIS_GATE_CODE", sessionMinutes: 480, maxAttempts: 5, lockMinutes: 15 },
  deployment: { expectedPatch: "034_server_runtime_push_endpoint_completion.sql", packageVersion: "server-runtime-push-20260501-01" },
  cacheVersion: "server-runtime-push-20260501-01",
});
window.__HR_SUPABASE_CONFIG_LOADED__ = true;
window.__HR_SUPABASE_CONFIG_VERSION__ = "server-runtime-push-20260501-01";
=======
// Production-safe Supabase config example. Copy to shared/js/supabase-config.js for deployment.
// Do not put service_role keys in browser files.
// Local/production Supabase configuration.
// IMPORTANT:
// - Never put service_role keys in browser files.
// - Fill url + anonKey after rotating any previously exposed keys.
// - Keep enabled=true only after the real Supabase project is migrated and Edge Functions are deployed.
window.HR_SUPABASE_CONFIG = Object.freeze({
  enabled: true,
  strict: true,
  projectId: "your-production-project",
  projectRef: "your-project-ref",
  url: "https://your-project-ref.supabase.co",
  anonKey: "your-rotated-publishable-or-anon-key",
  storage: {
    avatarsBucket: "avatars",
    punchSelfiesBucket: "punch-selfies",
    attachmentsBucket: "employee-attachments",
  },
  realtime: {
    enabled: true,
  },
  security: {
    allowLocalFallback: false,
    requireStrongPasswords: true,
    attachmentSignedUrlSeconds: 3600,
  },
  push: {
    // مطلوب لتفعيل Web Push الحقيقي. اتركه فارغًا حتى تولد VAPID keys وتضيف المفتاح العام هنا.
    vapidPublicKey: "",
  },
  cacheVersion: "management-suite-20260502-01",
});

window.__HR_SUPABASE_CONFIG_LOADED__ = true;
window.__HR_SUPABASE_CONFIG_VERSION__ = "management-suite-20260502-01";

(function showSupabaseModeBanner() {
  const cfg = window.HR_SUPABASE_CONFIG || {};
  const configured = Boolean(cfg.enabled === true && /^https:\/\/[^\s]+\.supabase\.co$/.test(String(cfg.url || "")) && String(cfg.anonKey || "").length > 20);
  if (configured) {
    document.documentElement.dataset.supabaseMode = "enabled";
    return;
  }
  document.documentElement.dataset.supabaseMode = "local";
  const render = () => {
    if (document.getElementById("supabase-mode-banner")) return;
    const banner = document.createElement("div");
    banner.id = "supabase-mode-banner";
    banner.setAttribute("role", "status");
    banner.style.cssText = "position:sticky;top:0;z-index:99999;background:#f59e0b;color:#1c1917;padding:10px 14px;text-align:center;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    banner.textContent = "وضع محلي احتياطي: Supabase غير مكتمل الإعداد. في نسخة الإنتاج تم تعطيل التشغيل المحلي الاحتياطي، ولن تُستخدم البيانات المحلية إلا إذا كانت الإعدادات غير صالحة وبشكل تحذيري فقط.";
    document.body.prepend(banner);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render, { once: true });
  else render();
})();
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
