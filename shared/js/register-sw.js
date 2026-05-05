// Service Worker registration is portal-scoped so employee devices do not cache admin UI.
const HR_SW_CACHE_NAME = "hr-attendance-full-workflow-live-20260504-v21-session-gate-logout";
const HR_SW_VERSION = "full-workflow-live-20260504-v21-session-gate-logout";

function portalServiceWorkerConfig() {
  const path = location.pathname.toLowerCase();
  if (path.includes("/admin/")) return { url: "../sw-admin.js", scope: "./" };
  if (path.includes("/executive/")) return { url: "../sw-executive.js", scope: "./" };
  if (path.includes("/employee/")) return { url: "../sw-employee.js", scope: "./" };
  return { url: "./sw-employee.js", scope: "./employee/" };
}

async function clearOldHrCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("hr-attendance") && !key.includes(HR_SW_VERSION))
      .map((key) => caches.delete(key)),
  );
}

async function unregisterLegacyRootWorkers(expectedUrl) {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map(async (reg) => {
    const script = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
    const sameScript = expectedUrl && script.endsWith(expectedUrl.split("?")[0]);
    const rootScope = new URL(reg.scope).pathname === "/";
    if (rootScope || (!sameScript && /\/sw\.js(\?|$)|\/sw-(employee|admin|executive)\.js(\?|$)/.test(script))) {
      await reg.unregister();
    }
  }));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function registerPortalServiceWorker(swUrl, scope) {
  try {
    const registration = await navigator.serviceWorker.register(swUrl, { scope, updateViaCache: "none" });
    await registration.update().catch(() => null);
    return registration;
  } catch (error) {
    if (error?.name !== "AbortError") throw error;
    const existing = await navigator.serviceWorker.getRegistration(scope).catch(() => null);
    await existing?.unregister?.().catch(() => null);
    await wait(250);
    const registration = await navigator.serviceWorker.register(swUrl, { scope, updateViaCache: "none" });
    await registration.update().catch(() => null);
    return registration;
  }
}

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    try {
      await clearOldHrCaches();
      const cfg = portalServiceWorkerConfig();
      const swUrl = `${cfg.url}?v=${HR_SW_VERSION}`;
      await unregisterLegacyRootWorkers(cfg.url);
      await registerPortalServiceWorker(swUrl, cfg.scope);
    } catch (error) {
      console.info("تعذر تحديث Service Worker مؤقتاً، سيعمل التطبيق بدون كاش محدث في هذه الزيارة.", error?.message || error);
    }
  });
}

window.HR_CLEAR_APP_CACHE = async function HR_CLEAR_APP_CACHE() {
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
  }
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  }
  location.reload();
};
