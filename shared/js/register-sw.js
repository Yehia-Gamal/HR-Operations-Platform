<<<<<<< HEAD
// تنبيه: يجب أن يتطابق HR_SW_VERSION مع CACHE_NAME في sw.js دائماً.
// sw.js: const CACHE_NAME = "hr-attendance-server-runtime-push-20260501-01"
// register-sw.js: const HR_SW_CACHE_NAME بنفس القيمة.
const HR_SW_CACHE_NAME = "hr-attendance-server-runtime-push-20260501-01";
function swBasePath() {
  const path = location.pathname.toLowerCase();
  const nestedPaths = ["/admin/", "/employee/", "/executive/", "/operations-gate/"];
  return nestedPaths.some((item) => path.includes(item)) ? "../" : "./";
}

function employeeNotificationUrl(url = "#notifications") {
  if (String(url).startsWith("#")) return new URL(`employee/${url}`, new URL(swBasePath(), location.href)).href;
  return new URL(url || "employee/#notifications", new URL(swBasePath(), location.href)).href;
}

function urlBase64ToUint8Array(value = "") {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

const HR_SW_URL = `${swBasePath()}sw.js?v=server-runtime-push-20260501-01`;

=======
// Service Worker registration is portal-scoped so employee devices do not cache admin UI.
const HR_SW_CACHE_NAME = "hr-attendance-management-suite-20260502-01";
const HR_SW_VERSION = "management-suite-20260502-01";

function portalServiceWorkerConfig() {
  const path = location.pathname.toLowerCase();
  if (path.includes("/admin/")) return { url: "../sw-admin.js", scope: "/admin/" };
  if (path.includes("/executive/")) return { url: "../sw-executive.js", scope: "/executive/" };
  if (path.includes("/employee/")) return { url: "../sw-employee.js", scope: "/employee/" };
  return { url: "./sw-employee.js", scope: "/employee/" };
}

>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
async function clearOldHrCaches() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(
    keys
<<<<<<< HEAD
      .filter((key) => key.startsWith("hr-attendance") && key !== HR_SW_CACHE_NAME)
=======
      .filter((key) => key.startsWith("hr-attendance") && !key.includes(HR_SW_VERSION))
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      .map((key) => caches.delete(key)),
  );
}

<<<<<<< HEAD
=======
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

>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", async () => {
    try {
      await clearOldHrCaches();
<<<<<<< HEAD
      const registration = await navigator.serviceWorker.register(HR_SW_URL, { updateViaCache: "none" });
=======
      const cfg = portalServiceWorkerConfig();
      const swUrl = `${cfg.url}?v=${HR_SW_VERSION}`;
      await unregisterLegacyRootWorkers(cfg.url);
      const registration = await navigator.serviceWorker.register(swUrl, { scope: cfg.scope, updateViaCache: "none" });
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
      await registration.update();
    } catch (error) {
      console.warn("تعذر تحديث Service Worker:", error);
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
<<<<<<< HEAD

window.HR_SHOW_NOTIFICATION = async function HR_SHOW_NOTIFICATION(payload = {}) {
  if (!("Notification" in window)) throw new Error("الإشعارات غير مدعومة في هذا المتصفح.");
  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("لم يتم السماح بالإشعارات من إعدادات المتصفح.");
  }
  const registration = await navigator.serviceWorker?.ready?.catch(() => null);
  const title = payload.title || "نظام الحضور";
  const options = {
    body: payload.body || "لديك تنبيه جديد",
    icon: `${swBasePath()}shared/images/icon-192.png`,
    badge: `${swBasePath()}shared/images/favicon-64.png`,
    tag: payload.tag || `hr-${Date.now()}`,
    requireInteraction: payload.requireInteraction === true,
    vibrate: [160, 80, 160],
    data: payload.data || { url: employeeNotificationUrl(payload.url) },
  };
  if (registration?.showNotification) return registration.showNotification(title, options);
  return new Notification(title, options);
};

window.HR_CREATE_PUSH_SUBSCRIPTION = async function HR_CREATE_PUSH_SUBSCRIPTION() {
  const vapidPublicKey = window.HR_SUPABASE_CONFIG?.push?.vapidPublicKey || "";
  if (!vapidPublicKey || vapidPublicKey.includes("CHANGE_")) throw new Error("مفتاح VAPID العام غير مضبوط في إعدادات الواجهة.");
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("هذا المتصفح لا يدعم Push Notifications.");
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }
  return subscription.toJSON();
};
=======
>>>>>>> 94cd004 (UI Modernization: Refactored Admin, Executive, and Employee portals for a premium mobile-first experience. Optimized GPS accuracy and updated layout consistency.)
